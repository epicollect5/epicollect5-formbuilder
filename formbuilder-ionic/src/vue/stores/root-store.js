'use strict';

import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { FORM_MESSAGES, VALIDATION_MESSAGES } from '@/config/strings.js';
import { PARAMETERS } from '@/config/parameters.js';
import { getForms, getInputs } from '@/models/project-definition.js';
import { isSearchType } from '@/models/possible-answers.js';
import { getQuestionTextErrors } from '@/models/validation.js';
import { countInputs, countProjectSearchInputs, countTitles } from '@/models/project-limits.js';
import { sanitizeQuestion } from '@/models/question-text.js';
import { QUESTION_TYPES } from '@/config/question-types.js';
import {
    addInput,
    canAddInput,
    enterInput,
    exitEditing,
    getEditingTrail,
    getCurrentForm,
    getCurrentInput,
    getCurrentInputs,
    getSession,
    insertInput,
    isEditing,
    removeInput,
    reorderInputs,
    selectForm,
    selectInput,
    updateCurrentInput
} from '@/services/session.js';
import { canUndo, undo, pushUndoState } from '@/services/undo.js';
import {
    areFormInputsValid,
    getInputErrors,
} from '@/services/validation.js';
import { saveProject } from '@/services/save.js';
import { duplicateInput } from '@/services/question-actions.js';
import { getProject } from '@/models/project-definition.js';
import { hideLoading, notifyError, notifySuccess, notifyWarning, showLoading } from '@/services/notifications.js';
import { useModalStore } from '@/vue/stores/modal-store.js';

/*
 * The Vue builder's core store: the shared session wrapper, the selection and
 * editing actions, the mutation hub (recordChange) and the undo/save gates.
 * Domain slices live in their own composed stores — the possible answers card
 * in stores/possible-answers-store.js and the advanced properties panel in
 * stores/properties-store.js — which call recordChange here so the undo push points
 * and the save/undo gates stay in one place.
 */
export const useRootStore = defineStore('rootStore', () => {
    const modal = useModalStore();

    const state = reactive({
        session: getSession(),
        unsaved_changes: false,
        saving: false,
        change_revision: 0,
        /*
         * The undo stack is a module-level structure in services/undo.js that
         * reactivity cannot see; pushes (the throttled one included) report
         * through pushUndoState's on_change, and undo bumps it directly.
         */
        undo_revision: 0,
        active_property_tab: 'basic',
        unload_guard_bound: false,
        /*
         * The Ionic app root (/epicollect5-formbuilder/ionic/), set at boot:
         * the Vue entry sits one level deeper than the vanilla page, so the
         * project load, the dev save endpoint and the logo fallback derive
         * their URLs from it instead of the page location.
         */
        app_base_url: null
    });

    /* The drag the ghost clamp follows: the list box it is held inside, and
       the pointer offset inside the ghost, captured on the first move. */
    let drag_box = null;
    let drag_anchor = null;

    const methods = {
        /* Boot wiring, called by vue/main.js before the first project load. */
        setAppBaseUrl(url) {
            state.app_base_url = url;
        },
        /* Mirrors ui/save.js installUnloadGuard for the Vue app. */
        installUnloadGuard() {
            if (state.unload_guard_bound) {
                return;
            }

            state.unload_guard_bound = true;

            window.addEventListener('beforeunload', (event) => {
                if (!state.unsaved_changes) {
                    return;
                }

                event.preventDefault();
            });
        },
        /*
         * The held cursor. The lists sort in fallback mode, so the cursor is
         * CSS-driven for the whole gesture — including the page gaps between
         * the lists. A body class carries it, set on drag start and removed on
         * drag end, so no list has to own the state and nothing is left behind
         * if a sortable class lingers after the drop. The list element comes
         * from the caller's template ref; only the builder tools pass nothing
         * (a clone dragged from the tools column is not clamped to a box).
         */
        beginDrag(list_element) {
            document.body.classList.add('is-sortable-dragging');

            drag_box = list_element || null;
            drag_anchor = null;
            window.addEventListener('pointermove', methods.clampGhost);

            // a release the sortable never sees (outside the window, a
            // cancelled pointer) must not leave the builder in the held cursor
            window.addEventListener('pointerup', methods.endDrag, { once: true });
            window.addEventListener('pointercancel', methods.endDrag, { once: true });
        },
        /*
         * The lists sort in fallback mode, so the ghost is a clone appended to
         * the body: left alone it follows the pointer across the whole page.
         * It is held inside the box of the list it was dragged from, on both
         * axes, so the drag feedback stays in its container and on its own
         * column. The drop guard still decides where an insertion is allowed.
         */
        clampGhost(event) {
            const ghost = document.querySelector('.sortable-fallback');

            if (!drag_box || !ghost) {
                return;
            }

            const base_top = parseFloat(ghost.style.top);
            const base_left = parseFloat(ghost.style.left);

            if (!drag_anchor) {
                drag_anchor = {x: event.clientX - base_left, y: event.clientY - base_top};
            }

            const box = drag_box.getBoundingClientRect();
            const width = ghost.offsetWidth;
            const height = ghost.offsetHeight;
            const left = Math.min(Math.max(event.clientX - drag_anchor.x, box.left), box.right - width);
            const top = Math.min(Math.max(event.clientY - drag_anchor.y, box.top), box.bottom - height);

            ghost.style.transform = 'translate3d(' + Math.round(left - base_left) + 'px, ' +
                Math.round(top - base_top) + 'px, 0)';
        },
        endDrag() {
            window.removeEventListener('pointermove', methods.clampGhost);
            drag_box = null;
            drag_anchor = null;

            document.body.classList.remove('is-sortable-dragging');

            /*
             * The fallback drag is a mouse gesture over the lists: whatever
             * selection the gesture anchored along the way (a stray range over
             * answer text) is not the user's, so it is dropped with the rest
             * of the drag state.
             */
            const selection = window.getSelection();

            if (selection) {
                selection.removeAllRanges();
            }

            // SortableJS leaves its hidden fallback clone inside the list after
            // a drop, and Vue does not own that node, so nothing else removes
            // it — it would otherwise stack up once per drag.
            document.querySelectorAll('.sortable-fallback').forEach((clone) => {
                clone.remove();
            });

            // the ghost class is not always stripped either; a leftover would
            // leave the dropped row as a placeholder with hidden content
            document
                .querySelectorAll('.builder__question-placeholder, .builder__answer-placeholder')
                .forEach((node) => {
                    node.classList.remove('builder__question-placeholder', 'builder__answer-placeholder');
                });
        },
        /*
         * The mutation hub, mirroring ui/state.js recordChange: the undo push
         * at the legacy push points, the revision bump guarding the save race
         * (R-72) and the unsaved flag. No fan-out — reactivity replaces it.
         */
        recordChange(options) {
            const config = Object.assign({}, options || {});

            config.on_change = () => {
                state.undo_revision += 1;
            };

            pushUndoState(config);
            state.change_revision += 1;
            state.unsaved_changes = true;
        },
        chooseForm(form_index) {
            if (isEditing() || form_index === state.session.current_form_index) {
                return;
            }

            selectForm(form_index);
            state.active_property_tab = 'basic';
        },
        chooseInput(input_ref) {
            selectInput(input_ref);
            state.active_property_tab = 'basic';
        },
        setPropertyTab(value) {
            state.active_property_tab = value;
        },
        enterContainer(input_ref) {
            enterInput(input_ref);
            state.active_property_tab = 'basic';
        },
        exitContainer() {
            exitEditing();
            state.active_property_tab = 'basic';
        },
        addQuestion(type) {
            if (!addInput(type)) {
                return;
            }

            state.active_property_tab = 'basic';
            methods.recordChange();

            // Legacy warns when the new question reaches the search cap.
            if (isSearchType(type) && countProjectSearchInputs(state.session.project_definition) >= PARAMETERS.SEARCH_INPUTS_MAX) {
                notifyWarning(FORM_MESSAGES.SEARCH_INPUTS_LIMIT_REACHED);
            }
        },
        /*
         * A builder tool dropped into the question list: the draggable has
         * already removed the cloned tool object from the list, so this
         * inserts the real input at the drop index (the vanilla drop path).
         */
        insertQuestion(type, index) {
            if (!insertInput(type, index)) {
                return null;
            }

            state.active_property_tab = 'basic';
            methods.recordChange();

            return getCurrentInput();
        },
        /* The sortable already left the list in the new order; commit it. */
        commitReorder() {
            methods.recordChange();
        },
        /*
         * The question-list draggable reports its new list through v-model:
         * either the current inputs reordered, or the list with a cloned
         * builder tool object inserted at the drop index. Both paths go
         * through the session services, like the vanilla sortable callbacks.
         */
        setActiveInputs(newInputs) {
            const dropped_tool = newInputs.find((item) => {
                // inputs always carry a ref; builder tools never do
                return item && !item.ref && !!item.type;
            });

            if (dropped_tool) {
                methods.insertQuestion(dropped_tool.type, newInputs.indexOf(dropped_tool));
                return;
            }

            if (reorderInputs(newInputs.map((input) => {
                return input.ref;
            }))) {
                methods.recordChange();
            }
        },
        editQuestion(value) {
            updateCurrentInput({ question: sanitizeQuestion(getCurrentInput(), value) });
            methods.recordChange({ throttle: true });
        },
        toggleRequired(value) {
            updateCurrentInput({ is_required: !!value });
            methods.recordChange();
        },
        /* Legacy refuses a fourth title and resets the checkbox (R-12). */
        toggleTitle(value) {
            const input = getCurrentInput();

            if (!input) {
                return false;
            }

            if (value && !input.is_title && countTitles(getCurrentInputs()) >= PARAMETERS.TITLES_MAX) {
                return false;
            }

            updateCurrentInput({ is_title: !!value });
            methods.recordChange();

            return true;
        },
        editReadme(question) {
            updateCurrentInput({ question });
            methods.recordChange({ throttle: true });
        },
        /* Copies the selected question to the end of the active list. */
        copyQuestion() {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            // Legacy covers the copy and drops the overlay ANIMATION_SLOW later.
            showLoading();

            if (!duplicateInput(input)) {
                hideLoading();
                return;
            }

            methods.recordChange();
            hideLoading(500);
            setTimeout(() => {
                notifySuccess(FORM_MESSAGES.INPUT_COPIED);
            }, 500);
        },
        /*
         * Deletes the selected question; with entries on the server, legacy
         * warns before dropping their data.
         */
        requestDeleteQuestion() {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            const project = getProject(state.session.project_definition);
            const total_entries = Number((project && (project.total_entries || project.entries)) || 0);

            if (total_entries === 0) {
                methods.deleteQuestion(input);
                return;
            }

            modal.openModal({
                title: FORM_MESSAGES.WARNING_TITLE,
                class_name: 'builder__delete-question-modal',
                kind: 'delete-question',
                buttons: [{
                    text: FORM_MESSAGES.CONFIRM_BUTTON,
                    action: () => {
                        modal.closeModal();
                        methods.deleteQuestion(input);
                    }
                }]
            });
        },
        deleteQuestion(input) {
            if (!removeInput(input.ref)) {
                return;
            }

            methods.recordChange();
            notifyWarning(FORM_MESSAGES.INPUT_DELETED);
        },
        performUndo() {
            showLoading();

            if (!undo()) {
                hideLoading();
                state.undo_revision += 1;
                return;
            }

            // Undoing an added form leaves the index past the end of the restored list.
            if (state.session.current_form_index >= getForms(state.session.project_definition).length) {
                selectForm(Math.max(getForms(state.session.project_definition).length - 1, 0));
            }

            // the data now differs from any save in flight, so a racing save
            // must not clear the unsaved marker (R-72)
            state.change_revision += 1;
            state.undo_revision += 1;
            state.active_property_tab = 'basic';

            hideLoading(500);
        },
        async performSave() {
            if (state.saving) {
                return;
            }

            const project_definition = state.session.project_definition;
            // the payload is copied synchronously inside saveProject, so this
            // revision is the one the request carries
            const revision_at_start = state.change_revision;

            state.saving = true;
            showLoading();

            const config = { dev: window.__FORMBUILDER_DEV__ === true };

            if (state.app_base_url) {
                // the Ionic root is /ionic/: the project file lives one level
                // above it, next to the legacy public/ tree
                config.dev_url = new URL('../project/project.json', state.app_base_url).href;
            }

            try {
                await saveProject(project_definition, config);

                // an edit or an undo made while the request was in flight is
                // not in the saved payload, so it stays marked unsaved (R-72)
                state.unsaved_changes = state.change_revision !== revision_at_start;

                // Legacy keeps the overlay up for ANIMATION_SLOW after the
                // response; the toast waits for the overlay to clear.
                hideLoading(500);
                setTimeout(() => {
                    notifySuccess(FORM_MESSAGES.PROJECT_SAVED);
                }, 500);
            } catch (error) {
                const message = error && error.message ? error.message : '';

                hideLoading();
                notifyError(`${FORM_MESSAGES.PROJECT_NOT_SAVED}${message ? ` ${message}` : ''}`);
            } finally {
                state.saving = false;
            }
        }
    };

    /*
     * One validity pass per revision, shared by every save gate: per-form
     * flags the tab strip needs, aggregated for the save button and title.
     * Three separate whole-project computeds each re-walked every answer on
     * any edit (F-04); Vue's computed memoisation is the revision counter, so
     * the three consumers agree by construction instead of by re-running.
     */
    const formValidity = computed(() => {
        return getForms(state.session.project_definition).map((form) => {
            return areFormInputsValid(form);
        });
    });

    const projectValid = computed(() => {
        const validity = formValidity.value;

        return validity.length > 0 && validity.every((valid) => {
            return valid;
        });
    });

    const computedScope = {
        forms: computed(() => {
            return getForms(state.session.project_definition);
        }),
        currentForm: computed(() => {
            return getCurrentForm();
        }),
        currentInputs: computed(() => {
            return getCurrentInputs();
        }),
        currentInput: computed(() => {
            return getCurrentInput();
        }),
        editingTrail: computed(() => {
            return getEditingTrail();
        }),
        editing: computed(() => {
            return isEditing();
        }),
        canUndo: computed(() => {
            state.undo_revision;
            return canUndo();
        }),
        formValidity: formValidity,
        saveEnabled: computed(() => {
            return !state.saving && projectValid.value;
        }),
        saveTitle: computed(() => {
            return state.saving ? FORM_MESSAGES.PROJECT_SAVING : (projectValid.value ? FORM_MESSAGES.SAVE_TITLE : FORM_MESSAGES.FIX_ERRORS_TITLE);
        }),
        /*
         * The tab strip: one entry per form with the live count and validity
         * the vanilla refreshFormTabs used to patch into the labels.
         */
        formTabs: computed(() => {
            const validity = formValidity.value;

            return getForms(state.session.project_definition).map((form, form_index) => {
                return {
                    index: form_index,
                    name: form.name,
                    count: countInputs(getInputs(form)),
                    valid: validity[form_index]
                };
            });
        }),
        /* The builder tools, with the container gating the vanilla renderTools applies. */
        tools: computed(() => {
            return QUESTION_TYPES.map((question_type) => {
                return Object.assign({}, question_type, {
                    allowed: canAddInput(question_type.type)
                });
            });
        }),
        /*
         * The basic-tab error under the question field: the question text
         * errors only (legacy showQuestionTextErrors). Possible answers and
         * container errors flag the same tab, but they surface in the
         * answers card and the badges — never under the question field.
         */
        basicErrorMessage: computed(() => {
            const input = getCurrentInput();

            if (!input) {
                return VALIDATION_MESSAGES.QUESTION_TEXT_EMPTY;
            }

            return getQuestionTextErrors(input)[0] || '';
        }),
        /* The properties tab badges: which tabs carry errors (R-32 aggregate). */
        propertyTabErrors: computed(() => {
            const input = getCurrentInput();
            const errors = getInputErrors(input, getCurrentInputs());

            return {
                basic: errors.some((error) => {
                    return error.tab === PARAMETERS.PROPERTIES_TAB;
                }),
                advanced: errors.some((error) => {
                    return error.tab === PARAMETERS.ADVANCED_TAB;
                }),
                jumps: errors.some((error) => {
                    return error.tab === PARAMETERS.JUMPS_TAB;
                })
            };
        }),
        readmeValue: computed(() => {
            const input = getCurrentInput();

            return input ? (input.question || '') : '';
        })
    };

    return {
        state,
        ...methods,
        ...computedScope
    };
});
