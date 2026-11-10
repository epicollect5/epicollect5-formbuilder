'use strict';

import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { FORM_MESSAGES } from '@/config/strings.js';
import { PARAMETERS } from '@/config/parameters.js';
import { getForms, getInputs } from '@/models/project-definition.js';
import {
    POSSIBLE_ANSWERS_ORDER,
    getAnswerLimit,
    getAnswerPage,
    getAnswerPageCount,
    isMultipleAnswerType
} from '@/models/possible-answers.js';
import { isSearchType } from '@/models/possible-answers.js';
import { countInputs, countProjectSearchInputs, countTitles } from '@/models/project-limits.js';
import { sanitizeQuestion } from '@/models/question-text.js';
import { QUESTION_TYPES } from '@/models/question-types.js';
import { getDefaultDatetimeFormat } from '@/models/input-properties.js';
import { getAdvancedFields } from '@/services/properties.js';
import {
    addPossibleAnswer,
    deleteAllAnswers,
    orderPossibleAnswers,
    removePossibleAnswer,
    renamePossibleAnswer,
    reorderAnswerPage
} from '@/services/possible-answers.js';
import {
    exportCsv,
    getCsvColumns,
    getCsvFilename,
    importAnswers,
    parseCsv
} from '@/services/possible-answers-csv.js';
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
    reorderInputs,
    selectForm,
    selectInput,
    updateCurrentInput
} from '@/services/session.js';
import { canUndo, undo, pushUndoState } from '@/services/undo.js';
import {
    ADVANCED_TAB,
    areAllInputsValid,
    areFormInputsValid,
    getInputErrors,
    isInputValid,
    JUMPS_TAB,
    PROPERTIES_TAB
} from '@/services/validation.js';
import { saveProject } from '@/services/save.js';
import { hideLoading, notifyError, notifySuccess, notifyWarning, showLoading } from '@/services/notifications.js';
import { downloadFile } from '@/ui/download.js';
import { createDropdown, createMenu } from '@/ui/dropdown.js';
import { openModal } from '@/ui/modal.js';
import csv_import_modal_body_view from '@/views/csv-import-modal-body.html?raw';
import { createView } from '@/ui/dom.js';
import { VALIDATION_MESSAGES } from '@/config/strings.js';

/* Vanilla parity: the double-entry label wording per question type. */
const DOUBLE_ENTRY_VERIFICATION_TYPES = ['text', 'phone'];

/*
 * The Vue builder's action and derived layer. The project definition itself
 * stays the single source of truth: it lives in the reactive session singleton
 * (services/session.js) and the services keep mutating it exactly as they do
 * for the vanilla app. The store holds the UI flags the vanilla app keeps in
 * ui/state.js and turns the old refresh passes into computeds.
 */
export const useBuilderStore = defineStore('builder', () => {
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
        // the visible answers page per input ref (ui/state.js parity); page
        // state is not undoable, as in the vanilla app
        answer_pages: new Map(),
        /*
         * The Ionic app root (/epicollect5-formbuilder/ionic/), set at boot:
         * the Vue entry sits one level deeper than the vanilla page, so the
         * project load, the dev save endpoint and the logo fallback derive
         * their URLs from it instead of the page location.
         */
        app_base_url: null
    });

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
         * Mirrors ui/state.js recordChange for the Vue app: the undo push at
         * the legacy push points, the revision bump guarding the save race
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
         * A palette tool dropped into the question list: the draggable has
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
         * palette tool object inserted at the drop index. Both paths go
         * through the session services, like the vanilla sortable callbacks.
         */
        setActiveInputs(newInputs) {
            const dropped_tool = newInputs.find((item) => {
                // inputs always carry a ref; palette tools never do
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
        /* Advanced-panel text/number fields: an empty input stores null. */
        editAdvancedField(property, value) {
            const next = {};

            next[property] = value === '' ? null : value;
            updateCurrentInput(next);
            methods.recordChange({ throttle: true });
        },
        toggleVerify(checked) {
            updateCurrentInput({ verify: !!checked });
            methods.recordChange();
        },
        toggleSetToCurrentDatetime(checked) {
            updateCurrentInput({ set_to_current_datetime: !!checked });
            methods.recordChange();
        },
        setNumericType(next_type) {
            if (next_type !== 'integer' && next_type !== 'decimal') {
                return;
            }

            updateCurrentInput({ type: next_type });
            methods.recordChange();
        },
        setSearchType(next_type) {
            if (next_type !== 'searchsingle' && next_type !== 'searchmultiple') {
                return;
            }

            updateCurrentInput({ type: next_type });
            methods.recordChange();
        },
        setDatetimeFormat(value) {
            updateCurrentInput({ datetime_format: value });
            methods.recordChange();
        },
        setUniqueness(value) {
            updateCurrentInput({ uniqueness: value || 'none' });
            methods.recordChange();
        },
        setDefaultChoice(value) {
            updateCurrentInput({ default: value ? value : null });
            methods.recordChange();
        },
        editReadme(question) {
            updateCurrentInput({ question });
            methods.recordChange({ throttle: true });
        },
        /*
         * Possible answers. The services own the mutations; the store keeps
         * the per-input page state and the overlay/toast orchestration.
         */
        addAnswer() {
            const input = getCurrentInput();

            if (!input || !addPossibleAnswer(input)) {
                return;
            }

            // the new answer is on the last page
            state.answer_pages.set(input.ref, getAnswerPageCount(input.possible_answers));
            methods.recordChange();
        },
        renameAnswer(answer_ref, value) {
            const input = getCurrentInput();

            if (!input || !renamePossibleAnswer(input, answer_ref, value)) {
                return;
            }

            methods.recordChange({ throttle: true });
        },
        removeAnswer(answer_ref) {
            const input = getCurrentInput();

            if (!input || !removePossibleAnswer(input, answer_ref)) {
                return;
            }

            methods.recordChange();
        },
        /* The sortable reports the reordered page; commit it page-locally. */
        commitAnswerReorder(refs) {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            const page = methods.currentAnswersPage();

            if (reorderAnswerPage(input, refs, page)) {
                methods.recordChange();
            }
        },
        currentAnswersPage() {
            const input = getCurrentInput();

            if (!input) {
                return 1;
            }

            const page = state.answer_pages.get(input.ref) || 1;

            return Math.min(Math.max(page, 1), getAnswerPageCount(input.possible_answers));
        },
        /* Paging is blocked while a visible answer is still empty. */
        goToAnswersPage(target) {
            const input = getCurrentInput();

            if (!input) {
                return false;
            }

            const page = methods.currentAnswersPage();
            const page_answers = getAnswerPage(input.possible_answers, page);
            const blocked = page_answers.some((answer) => {
                return String(answer.answer || '').trim() === '';
            });

            if (blocked) {
                return false;
            }

            state.answer_pages.set(input.ref, Math.min(Math.max(target, 1), getAnswerPageCount(input.possible_answers)));

            return true;
        },
        orderAnswers(order) {
            const input = getCurrentInput();

            // Legacy reorders behind the overlay and hides it after ANIMATION_SUPER_SLOW.
            showLoading();

            if (!input || !orderPossibleAnswers(input, order)) {
                hideLoading();
                return;
            }

            state.answer_pages.set(input.ref, 1);
            methods.recordChange();
            hideLoading(1000);
        },
        deleteAllCurrentAnswers() {
            const input = getCurrentInput();

            showLoading();

            if (!input || !deleteAllAnswers(input)) {
                hideLoading();
                return;
            }

            state.answer_pages.set(input.ref, 1);
            methods.recordChange();

            // Legacy keeps the overlay up for ANIMATION_SUPER_SLOW.
            hideLoading(1000);
        },
        exportAnswersCsv() {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            downloadFile(getCsvFilename(input), exportCsv(input), 'text/csv;charset=utf-8;');
        },
        pickAnswersCsv() {
            const field = document.createElement('input');

            field.type = 'file';
            field.accept = '.csv,text/csv';
            field.hidden = true;

            field.addEventListener('change', () => {
                const file = field.files && field.files[0];

                if (!file) {
                    field.remove();
                    return;
                }

                if (!/\.csv$/i.test(file.name)) {
                    field.remove();
                    notifyError(VALIDATION_MESSAGES.CSV_FILE_INVALID);
                    return;
                }

                // the same bound as the form import bounds the synchronous parse (R-51)
                if (file.size > PARAMETERS.IMPORT_MAX_BYTES) {
                    field.remove();
                    notifyError(VALIDATION_MESSAGES.CSV_FILE_TOO_LARGE);
                    return;
                }

                const reader = new FileReader();

                reader.onload = () => {
                    const parsed = parseCsv(reader.result);

                    field.remove();

                    if (!parsed.rows.length) {
                        notifyError(VALIDATION_MESSAGES.CSV_FILE_INVALID);
                        return;
                    }

                    methods.openAnswersCsvModal(parsed);
                };

                reader.onerror = () => {
                    field.remove();
                    notifyError(VALIDATION_MESSAGES.CSV_FILE_INVALID);
                };

                reader.readAsText(file);
            });

            document.body.append(field);
            field.click();
        },
        openAnswersCsvModal(parsed) {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            const body = createView(csv_import_modal_body_view);
            const headers = body.querySelector('[data-role="csv-headers"]');
            const mode = body.querySelector('[data-role="csv-mode"]');
            const column_placeholder = body.querySelector('[data-role="csv-column"]');
            let selected_column = '';
            let import_button = null;

            headers.checked = true;
            mode.value = 'replace';

            const column_dropdown = createDropdown({
                class_name: 'builder__csv-column-select',
                aria_label: 'Column to import',
                placeholder: 'Pick column',
                options: [...getCsvColumns(parsed, true)],
                value: '',
                on_change: (detail) => {
                    selected_column = detail.value;

                    if (import_button) {
                        import_button.disabled = !selected_column;
                    }
                }
            });

            column_dropdown.setAttribute('data-role', 'csv-column');
            column_placeholder.replaceWith(column_dropdown);

            headers.addEventListener('ionChange', () => {
                selected_column = '';
                column_dropdown.setOptions(
                    [...getCsvColumns(parsed, headers.checked === true)],
                    ''
                );

                if (import_button) {
                    import_button.disabled = true;
                }
            });

            const modal = openModal({
                title: 'Possible answers csv import options',
                body,
                buttons: [
                    { text: 'Dismiss', align: 'start' },
                    {
                        text: 'Import',
                        disabled: true,
                        on_click: (close) => {
                            if (!selected_column) {
                                return;
                            }

                            // Legacy imports the answers behind the wait overlay.
                            showLoading();

                            const result = importAnswers(input, parsed, {
                                column_index: Number(selected_column),
                                has_headers: headers.checked === true,
                                replace: mode.value !== 'append'
                            });

                            if (!result.ok) {
                                hideLoading();
                                notifyError(VALIDATION_MESSAGES.POSSIBLE_ANSWER_EMPTY);
                                return;
                            }

                            close();
                            state.answer_pages.set(input.ref, 1);
                            methods.recordChange();

                            // Legacy hides the overlay after ANIMATION_SUPER_SLOW.
                            hideLoading(1000);
                            setTimeout(() => {
                                notifySuccess(VALIDATION_MESSAGES.POSSIBLE_ANSWERS_IMPORTED);
                            }, 1000);
                        }
                    }
                ]
            });

            // Footer actions are ion-button elements, not <button> tags.
            import_button = modal.footer.querySelectorAll('ion-button')[1];
        },
        /*
         * Imported date/time questions can arrive with a null format; legacy
         * checks its default radio, so the definition must carry it too. The
         * vanilla applies this when the advanced panel builds, unrecorded —
         * the same timing and semantics apply here.
         */
        ensureDatetimeFormat() {
            const input = getCurrentInput();

            if (!input || (input.type !== 'date' && input.type !== 'time')) {
                return;
            }

            if (!input.datetime_format) {
                updateCurrentInput({ datetime_format: getDefaultDatetimeFormat(input.type) });
            }
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
                config.dev_url = new URL('project/project.json', state.app_base_url).href;
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
     * Shared computed sources: the dropdown options are referenced by their
     * value computeds, so they are declared before the grouped scope.
     */
    const uniquenessOptions = computed(() => {
        const form = getCurrentForm();
        const form_name = form ? form.name : 'this form';
        const project = state.session.project_definition && state.session.project_definition.data ?
            state.session.project_definition.data.project : null;
        const forms = project && project.forms ? project.forms : [];
        const form_index = form ? forms.indexOf(form) : 0;
        const branch_container = getEditingTrail().find((node) => {
            return node.type === 'branch';
        });
        const branch_header = branch_container && branch_container.question ? branch_container.question : 'branch';
        const options = [{ value: 'none', label: 'No uniqueness' }];

        if (branch_container) {
            options.push({
                value: 'form',
                label: `Make answer unique to all ${branch_header} entries of a ${form_name} entry`
            });
        } else if (form_index > 0) {
            const parent_name = forms[form_index - 1] ? forms[form_index - 1].name : 'parent form';

            options.push({ value: 'form', label: `All ${form_name} entries` });
            options.push({ value: 'hierarchy', label: `Only ${form_name} children of a ${parent_name} parent entry` });
        } else {
            options.push({ value: 'form', label: `Make answer unique to all ${form_name} entries` });
        }

        return options;
    });

    const defaultChoiceOptions = computed(() => {
        const input = getCurrentInput();

        return [{ value: '', label: 'None' }, ...(input && input.possible_answers ? input.possible_answers : []).map((answer) => {
            return {
                value: answer.answer_ref,
                label: answer.answer || 'Untitled answer'
            };
        })];
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
        saveEnabled: computed(() => {
            return !state.saving && areAllInputsValid(state.session.project_definition);
        }),
        saveTitle: computed(() => {
            const valid = areAllInputsValid(state.session.project_definition);

            return state.saving ? FORM_MESSAGES.PROJECT_SAVING : (valid ? 'Save project' : 'Fix the validation errors before saving');
        }),
        /*
         * The tab strip: one entry per form with the live count and validity
         * the vanilla refreshFormTabs used to patch into the labels.
         */
        formTabs: computed(() => {
            return getForms(state.session.project_definition).map((form, form_index) => {
                return {
                    index: form_index,
                    name: form.name,
                    count: countInputs(getInputs(form)),
                    valid: areFormInputsValid(form)
                };
            });
        }),
        /* The palette with the container gating the vanilla renderTools applies. */
        tools: computed(() => {
            return QUESTION_TYPES.map((question_type) => {
                return Object.assign({}, question_type, {
                    allowed: canAddInput(question_type.type)
                });
            });
        }),
        /* The basic-tab error under the question field: the first properties-tab error. */
        basicErrorMessage: computed(() => {
            const input = getCurrentInput();
            const tab_errors = getInputErrors(input, getCurrentInputs()).filter((error) => {
                return error.tab === PROPERTIES_TAB;
            });

            return tab_errors.length ? tab_errors[0].message : '';
        }),
        /* The properties tab badges: which tabs carry errors (R-32 aggregate). */
        propertyTabErrors: computed(() => {
            const input = getCurrentInput();
            const errors = getInputErrors(input, getCurrentInputs());

            return {
                basic: errors.some((error) => {
                    return error.tab === PROPERTIES_TAB;
                }),
                advanced: errors.some((error) => {
                    return error.tab === ADVANCED_TAB;
                }),
                jumps: errors.some((error) => {
                    return error.tab === JUMPS_TAB;
                })
            };
        }),
        rowValidity: computed(() => {
            const inputs = getCurrentInputs();

            return inputs.map((input) => {
                return {
                    ref: input.ref,
                    valid: isInputValid(input, inputs)
                };
            });
        }),
        /*
         * The advanced panel: which fields the current question type shows
         * (services/properties.js owns the per-type list).
         */
        advancedFields: computed(() => {
            const input = getCurrentInput();

            return input ? getAdvancedFields(input.type) : [];
        }),
        verifyLabel: computed(() => {
            const input = getCurrentInput();

            return input && DOUBLE_ENTRY_VERIFICATION_TYPES.indexOf(input.type) !== -1 ?
                'Require double entry verification' : 'Require double entry';
        }),
        numericType: computed(() => {
            const input = getCurrentInput();

            return input && input.type === 'decimal' ? 'decimal' : 'integer';
        }),
        datetimeLabel: computed(() => {
            const input = getCurrentInput();

            return input && input.type === 'time' ? 'Time format' : 'Date format';
        }),
        currentDatetimeLabel: computed(() => {
            const input = getCurrentInput();

            return input && input.type === 'date' ?
                'Set initial answer to current date' : 'Set initial answer to current time';
        }),
        defaultNumberValue: computed(() => {
            const input = getCurrentInput();

            return input && input.default !== null && input.default !== undefined ? String(input.default) : '';
        }),
        minValue: computed(() => {
            const input = getCurrentInput();

            return input && input.min !== null && input.min !== undefined ? String(input.min) : '';
        }),
        maxValue: computed(() => {
            const input = getCurrentInput();

            return input && input.max !== null && input.max !== undefined ? String(input.max) : '';
        }),
        defaultTextValue: computed(() => {
            const input = getCurrentInput();

            return input && input.default ? input.default : '';
        }),
        regexValue: computed(() => {
            const input = getCurrentInput();

            return input && input.regex ? input.regex : '';
        }),
        /*
         * The uniqueness dropdown options, branch-scoped like the legacy
         * builder: inside a branch, 'form' means unique to the branch entries.
         */
        uniquenessOptions: computed(() => {
            return uniquenessOptions.value;
        }),
        uniquenessValue: computed(() => {
            const input = getCurrentInput();
            const current = input ? (input.uniqueness || 'none') : 'none';

            return uniquenessOptions.value.some((option) => {
                return option.value === current;
            }) ? current : 'none';
        }),
        defaultChoiceOptions: computed(() => {
            return defaultChoiceOptions.value;
        }),
        defaultChoiceValue: computed(() => {
            const input = getCurrentInput();

            if (!input) {
                return '';
            }

            const has_default = (input.possible_answers || []).some((answer) => {
                return String(answer.answer_ref) === String(input.default);
            });

            return has_default ? input.default : '';
        }),
        readmeValue: computed(() => {
            const input = getCurrentInput();

            return input ? (input.question || '') : '';
        }),
        /*
         * The possible answers card. The page slice is what the list shows
         * and reorders; the default select lives in the advanced fields.
         */
        showPossibleAnswers: computed(() => {
            const input = getCurrentInput();

            return !!input && isMultipleAnswerType(input.type);
        }),
        answerCount: computed(() => {
            const input = getCurrentInput();

            return input && input.possible_answers ? input.possible_answers.length : 0;
        }),
        answerAtLimit: computed(() => {
            const input = getCurrentInput();

            return !!input && input.possible_answers.length >= getAnswerLimit(input.type);
        }),
        answerPageCount: computed(() => {
            const input = getCurrentInput();

            return getAnswerPageCount(input ? input.possible_answers : []);
        }),
        answerCurrentPage: computed(() => {
            return methods.currentAnswersPage();
        }),
        answerRows: computed(() => {
            const input = getCurrentInput();

            if (!input) {
                return [];
            }

            const page = methods.currentAnswersPage();
            const offset = (page - 1) * PARAMETERS.ANSWERS_PER_PAGE;

            return getAnswerPage(input.possible_answers, page).map((answer, index) => {
                return {
                    answer,
                    ariaLabel: `Answer ${offset + index + 1}`,
                    removeLabel: `Remove answer ${offset + index + 1}`
                };
            });
        })
    };

    return {
        state,
        ...methods,
        ...computedScope
    };
});
