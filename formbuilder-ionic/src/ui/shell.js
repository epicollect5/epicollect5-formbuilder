'use strict';

import { getForms, getProject } from '@/models/project-definition.js';
import { PARAMETERS } from '@/config/parameters.js';
import {
    POSSIBLE_ANSWERS_ORDER,
    getAnswerLimit,
    getAnswerPage,
    getAnswerPageCount,
    isMultipleAnswerType,
    isSearchType,
    sanitizeAnswer
} from '@/models/possible-answers.js';
import {
    allowsRequired,
    allowsTitle,
    getDefaultDatetimeFormat,
    hasAdvancedTab,
    hasJumpsTab,
    isBranchOrGroup,
    isMediaType
} from '@/models/input-properties.js';
import { FORM_MESSAGES, VALIDATION_MESSAGES } from '@/config/strings.js';
import { getQuestionType } from '@/models/question-types.js';
import { countTitles, getAdvancedFields } from '@/services/properties.js';
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
    addJump,
    canAddJump,
    getJumpAvailableDestinations,
    removeJump,
    updateJump
} from '@/services/jumps.js';
import { JUMP_CONDITIONS, jumpNeedsAnswer, usesAlwaysJump } from '@/models/jumps.js';
import { goBack } from '@/services/navigation.js';
import {
    addForm,
    addInput,
    canAddInput,
    deleteForm,
    enterInput,
    exitEditing,
    getCurrentForm,
    getCurrentInput,
    getCurrentInputs,
    getEditingTrail,
    getSession,
    insertInput,
    isEditing,
    removeAllInputs,
    removeInput,
    renameForm,
    reorderInputs,
    selectForm,
    selectInput,
    updateCurrentInput
} from '@/services/session.js';
import { duplicateInput } from '@/services/question-actions.js';
import { getFormNameError } from '@/services/form-management.js';
import { prepareImportedForm } from '@/services/form-import.js';
import { buildFormExport, getFormExportFilename, saveProject } from '@/services/save.js';
import { areAllInputsValid, areFormInputsValid, getInputErrors, isInputValid } from '@/services/validation.js';
import { canUndo, ensureUndoBaseline, pushUndoState, undo } from '@/services/undo.js';
import { countProjectSearchInputs } from '@/models/project-limits.js';
import { button, createView, element, icon, parseView } from '@/ui/dom.js';
import { hideLoading, notifyError, notifySuccess, notifyWarning, openModal, showLoading } from '@/services/notifications.js';
import { createDropdown, createMenu } from '@/ui/dropdown.js';
import { printForm } from '@/ui/print.js';
import { createReadmeEditor } from '@/ui/readme-editor.js';
import { installAnswerSortable, installQuestionSortable, installToolDrag } from '@/ui/sortable.js';
import tools_view from '@/views/tools.html?raw';
import question_card_view from '@/views/question-card.html?raw';
import properties_card_view from '@/views/properties-card.html?raw';
import possible_answers_view from '@/views/possible-answers-card.html?raw';
import jump_row_view from '@/views/jump-row.html?raw';
import jump_row_always_view from '@/views/jump-row-always.html?raw';
import form_name_modal_body_view from '@/views/form-name-modal-body.html?raw';
import csv_import_modal_body_view from '@/views/csv-import-modal-body.html?raw';
import delete_question_modal_body_view from '@/views/delete-question-modal-body.html?raw';

const QUESTION_LIST = '#questions .builder__question-list';
const DOUBLE_ENTRY_VERIFICATION_TYPES = ['text', 'phone'];

let handlers = {};
const answer_pages = new Map();
const answer_notices = new Map();
let active_readme_editor = null;
let active_property_tab = 'basic';
let saving = false;
let unsaved_changes = false;
let tracked_project = null;
let unload_guard_bound = false;

export const renderApp = (app_handlers) => {
    handlers = app_handlers || {};

    if (getSession().project_definition !== tracked_project) {
        tracked_project = getSession().project_definition;
        unsaved_changes = false;
    }

    installUnloadGuard();
    ensureUndoBaseline();
    renderProjectName();
    revealBuilder();
    bindChrome();
    renderTools();
    renderForms();
    renderQuestions();
    renderProperties();
};

const renderProjectName = () => {
    const project = getProject(getSession().project_definition);
    const title = document.querySelector('ion-title #project-name, ion-title') || document.getElementById('project-name');
    const name = document.getElementById('project-name');
    const logo = document.getElementById('project-logo');

    if (name) {
        name.textContent = project ? project.name : '';
    }
    else if (title && title.tagName && title.tagName.toLowerCase() === 'ion-title') {
        title.textContent = project ? project.name : '';
    }

    if (logo) {
        logo.src = getProjectLogoUrl(project);
    }
};

/* Same source as the legacy navbar: the project logo, else the media endpoint. */
const getProjectLogoUrl = (project) => {
    if (!project) {
        return '';
    }

    if (project.logo_url) {
        return project.logo_url;
    }

    const protocol = window.location.protocol;
    const parts = window.location.href.split('?')[0].split('#')[0].replace(protocol + '//', '').split('/');

    parts.pop();

    return `${protocol}//${parts.join('/')}/api/internal/media/${project.slug}` +
        '?type=photo&name=logo.jpg&format=project_mobile_logo';
};

const revealBuilder = () => {
    const loader = document.querySelector('.loader');
    const builder = document.getElementById('builder');

    if (loader) {
        loader.remove();
    }

    if (builder) {
        builder.hidden = false;
    }
};

/* Chrome controls are static, so assigning handlers keeps re-renders from
   stacking duplicate listeners. */
const bindChrome = () => {
    document.querySelectorAll('[data-action="back"], [data-action="exit"]').forEach((control) => {
        control.onclick = () => {
            goBack();
        };
    });

    const undo_button = document.getElementById('undo');

    if (undo_button) {
        undo_button.onclick = () => {
            performUndo();
        };
    }

    const save_button = document.getElementById('save');

    if (save_button) {
        save_button.onclick = () => {
            performSave().catch((error) => {
                console.error('[formbuilder-ionic] unexpected save error', error);
            });
        };
    }

    const add_form = document.getElementById('add-form');
    const forms = getForms(getSession().project_definition);
    const at_form_cap = forms.length >= PARAMETERS.MAX_FORMS;

    if (add_form) {
        add_form.disabled = at_form_cap;
        add_form.title = at_form_cap ? `A project can have at most ${PARAMETERS.MAX_FORMS} forms` : 'Add form';
        add_form.onclick = () => {
            if (at_form_cap) {
                return;
            }

            // The legacy flow asks for the new form's name before adding it.
            openFormNameModal(null);
        };
    }

    updateUndoButton();
    updateSaveButton();
};

/* Snapshots are taken after a mutation, matching the legacy push points. */
const recordChange = (options) => {
    // The throttled push lands later, so the button gate has to follow it.
    pushUndoState(Object.assign({ on_change: updateUndoButton }, options || {}));
    unsaved_changes = true;
    updateUndoButton();
    updateSaveButton();
    // Validity changes while editing, not only on select or sort.
    refreshFormTabs();
};
const updateUndoButton = () => {
    const undo_button = document.getElementById('undo');

    if (!undo_button) {
        return;
    }

    const available = canUndo();

    undo_button.disabled = !available;
    undo_button.title = available ? 'Undo the last change' : 'Nothing to undo';
};

const installUnloadGuard = () => {
    if (unload_guard_bound) {
        return;
    }

    unload_guard_bound = true;

    window.addEventListener('beforeunload', (event) => {
        if (!unsaved_changes) {
            return;
        }

        event.preventDefault();
    });
};

const performUndo = () => {
    showLoading();

    if (!undo()) {
        hideLoading();
        updateUndoButton();
        return;
    }

    // Undoing an added form leaves the index past the end of the restored list.
    if (getSession().current_form_index >= getForms(getSession().project_definition).length) {
        selectForm(Math.max(getForms(getSession().project_definition).length - 1, 0));
    }

    active_property_tab = 'basic';
    renderApp(handlers);
    // Legacy drops the overlay ANIMATION_SLOW after re-rendering the state.
    hideLoading(500);
};

const updateSaveButton = () => {
    const button = document.getElementById('save');

    if (!button) {
        return;
    }

    const valid = areAllInputsValid(getSession().project_definition);

    button.disabled = saving || !valid;
    button.title = saving ? FORM_MESSAGES.PROJECT_SAVING : (valid ? 'Save project' : 'Fix the validation errors before saving');
};

const performSave = async () => {
    if (saving) {
        return;
    }

    const project_definition = getSession().project_definition;

    saving = true;
    updateSaveButton();
    showLoading();

    try {
        await saveProject(project_definition, { dev: isDevMode() });
        unsaved_changes = false;
        // Legacy keeps the overlay up for ANIMATION_SLOW after the response;
        // the toast waits for the overlay to clear.
        hideLoading(500);
        setTimeout(() => {
            notifySuccess(FORM_MESSAGES.PROJECT_SAVED);
        }, 500);
    }
    catch (error) {
        const message = error && error.message ? error.message : '';

        hideLoading();
        notifyError(`${FORM_MESSAGES.PROJECT_NOT_SAVED}${message ? ` ${message}` : ''}`);
    }
    finally {
        saving = false;
        updateSaveButton();
    }
};

const installFormActions = (card, form) => {
    if (!form) {
        return;
    }

    const forms = getForms(getSession().project_definition);
    const form_index = getSession().current_form_index;
    const deletable = !isEditing() && form_index > 0 && form_index === forms.length - 1;
    const delete_button = card.querySelector('.builder__form-action-btn--delete');
    const edit_button = card.querySelector('.builder__form-action-btn--edit');
    const import_buttons = [...card.querySelectorAll('[data-action="form-import"]')];

    if (delete_button) {
        delete_button.disabled = !deletable;
        delete_button.title = deletable ? 'Delete form' : FORM_MESSAGES.FORM_CANNOT_BE_DELETED;
        delete_button.onclick = () => {
            if (deleteForm(form_index)) {
                recordChange();
                renderApp(handlers);
                notifyWarning(FORM_MESSAGES.FORM_DELETED);
            }
        };
    }

    if (edit_button) {
        edit_button.onclick = () => {
            openFormNameModal(form);
        };
    }

    import_buttons.forEach((import_button) => {
        import_button.disabled = isEditing();
        import_button.title = isEditing() ? 'Return to the form to import' : 'Import form';
    });

    const actions = {
        'form-rename': () => {
            openFormNameModal(form);
        },
        'form-export': () => {
            const payload = buildFormExport(getSession().project_definition, form_index);

            if (!payload) {
                notifyError(FORM_MESSAGES.FORM_IS_INVALID);
                return;
            }

            downloadFile(getFormExportFilename(getSession().project_definition, form_index), JSON.stringify(payload), 'application/json');
        },
        'form-print': () => {
            if (!printForm(getSession().project_definition, form_index)) {
                notifyError(FORM_MESSAGES.FORM_IS_INVALID);
            }
        },
        'form-import': () => {
            if (!isEditing()) {
                importFormFile(card);
            }
        },
        'form-delete-all': () => {
            if (!removeAllInputs()) {
                return;
            }

            recordChange();
            renderApp(handlers);
            // Legacy deletes behind the busy overlay and drops it after 1s.
            showLoading();
            hideLoading(1000);
        }
    };

    Object.keys(actions).forEach((action) => {
        card.querySelectorAll(`[data-action="${action}"]`).forEach((control) => {
            control.onclick = (event) => {
                event.preventDefault();
                actions[action]();
            };
        });
    });

    const menu_trigger = card.querySelector('[data-role="form-actions-trigger"]');

    if (menu_trigger) {
        createMenu(menu_trigger, [
            { label: 'Rename form', data_action: 'form-rename', action: actions['form-rename'] },
            { label: 'Export form', data_action: 'form-export', action: actions['form-export'] },
            { label: 'Print form', data_action: 'form-print', action: actions['form-print'] },
            { label: 'Import form', data_action: 'form-import', action: actions['form-import'], disabled: isEditing() },
            { divider: true },
            { label: 'Delete all questions', data_action: 'form-delete-all', action: actions['form-delete-all'] }
        ], (item) => {
            item.action();
        });
    }
};

const isDevMode = () => {
    return window.__FORMBUILDER_DEV__ === true;
};

const openFormNameModal = (form) => {
    const adding = !form;
    const body = createView(form_name_modal_body_view);
    const field = body.querySelector('input');
    const error = body.querySelector('[data-role="form-name-error"]');

    field.maxLength = PARAMETERS.FORM_NAME_MAX_LENGTH;
    field.value = form ? form.name || '' : '';
    field.addEventListener('input', () => {
        error.hidden = true;
    });

    const modal = openModal({
        title: 'Form name',
        body,
        buttons: [
            { text: 'Close', class_name: 'btn-default' },
            {
                text: 'Save changes',
                class_name: 'btn-primary',
                on_click: (close) => {
                    const forms = getForms(getSession().project_definition);
                    const form_index = getSession().current_form_index;
                    const validation_error = getFormNameError(forms, field.value, adding ? -1 : form_index);

                    if (validation_error) {
                        error.textContent = validation_error;
                        error.removeAttribute('hidden');
                        return;
                    }

                    if (adding) {
                        if (!addForm(field.value)) {
                            return;
                        }
                    }
                    else {
                        renameForm(form_index, field.value);
                    }

                    recordChange();
                    close();
                    renderApp(handlers);
                }
            }
        ]
    });

    field.focus();

    return modal;
};

const getTotalEntries = () => {
    const legacy_counter = document.querySelector('.total-entries');
    const data_value = legacy_counter ? legacy_counter.getAttribute('data-total-entries') : null;

    if (data_value !== null && data_value !== undefined) {
        return parseInt(data_value, 10) || 0;
    }

    const project = getProject(getSession().project_definition);

    return Number(project && (project.total_entries || project.entries) || 0);
};

const deleteQuestion = (input) => {
    if (!removeInput(input.ref)) {
        return;
    }

    recordChange();
    renderApp(handlers);
    notifyWarning(FORM_MESSAGES.INPUT_DELETED);
};

const openDeleteQuestion = (input) => {
    // With entries on the server, legacy warns before dropping their data.
    if (getTotalEntries() === 0) {
        deleteQuestion(input);
        return;
    }

    openModal({
        title: 'Warning',
        class_name: 'builder__delete-question-modal',
        body: createView(delete_question_modal_body_view),
        buttons: [{
            text: 'Confirm',
            class_name: 'btn-danger',
            on_click: (close) => {
                close();
                deleteQuestion(input);
            }
        }]
    });
};

const importFormFile = (card) => {
    const field = card.querySelector('[data-role="form-file"]');

    if (!field) {
        return;
    }

    field.value = '';
    field.onchange = () => {
        const file = field.files && field.files[0];

        if (!file) {
            return;
        }

        if (!/\.json$/i.test(file.name)) {
            notifyError(FORM_MESSAGES.FORM_FILE_INVALID);
            return;
        }

        const reader = new FileReader();

        showLoading();

        reader.onload = () => {
            let result;

            try {
                result = prepareImportedForm(reader.result, getSession().project_definition, getSession().current_form_index);
            }
            catch (error) {
                // Never leave the overlay up if the parser itself throws.
                result = { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
            }

            if (!result.ok) {
                hideLoading();
                notifyError(result.error);
                return;
            }

            getCurrentForm().inputs = result.inputs;
            getSession().current_input_ref = null;
            recordChange();
            renderApp(handlers);
            // Legacy hides the overlay ANIMATION_SLOW after the import.
            hideLoading(500);
            setTimeout(() => {
                notifySuccess(FORM_MESSAGES.FORM_IMPORTED);
            }, 500);
        };

        reader.onerror = () => {
            hideLoading();
            notifyError(FORM_MESSAGES.FORM_FILE_INVALID);
        };

        reader.readAsText(file);
    };

    field.click();
};

/* The tool catalogue is static markup; only the click and drag wiring changes. */
const renderTools = () => {
    const container = document.getElementById('tools');

    if (!container) {
        return;
    }

    container.replaceChildren(parseView(tools_view));

    container.querySelectorAll('.builder__tool').forEach((tool) => {
        const type = tool.getAttribute('data-type');
        const allowed = canAddInput(type);

        // The legacy palette hides the tools a container cannot hold.
        tool.hidden = !allowed;
        tool.disabled = !allowed;

        tool.onclick = () => {
            addQuestion(type);
        };
    });

    installToolDrag('#tools .builder__tool', QUESTION_LIST, (type, index) => {
        if (!insertInput(type, index)) {
            return;
        }

        recordChange();
        renderQuestions();
        renderProperties();
    });
};

const addQuestion = (type) => {
    if (!addInput(type)) {
        return;
    }

    recordChange();
    renderQuestions();
    renderProperties();

    // Legacy warns when the new question reaches the search cap.
    if (isSearchType(type) && countProjectSearchInputs(getSession().project_definition) >= PARAMETERS.SEARCH_INPUTS_MAX) {
        notifyWarning(FORM_MESSAGES.SEARCH_INPUTS_LIMIT_REACHED);
    }
};

const renderForms = () => {
    const container = document.getElementById('form-tabs');

    if (!container) {
        return;
    }

    const segment = container.querySelector('.builder__forms-segment');

    if (!segment) {
        return;
    }

    const forms = getForms(getSession().project_definition);
    const current_index = getSession().current_form_index;

    segment.replaceChildren();
    segment.setAttribute('value', String(current_index));
    segment.value = String(current_index);
    segment.disabled = isEditing();

    forms.forEach((form, form_index) => {
        const is_selected = form_index === current_index;
        const tab = element('ion-segment-button', {
            class: 'builder__form-tab',
            value: String(form_index),
            role: 'tab',
            'aria-selected': is_selected ? 'true' : 'false'
        }, [buildFormTabLabel(form)]);

        segment.append(tab);
    });

    bindFormSegment(segment);
};

const buildFormTabLabel = (form) => {
    const label = element('ion-label', {}, [form.name]);

    if (!areFormInputsValid(form)) {
        label.append(element('ion-icon', {
            class: 'builder__form-tab-state',
            name: 'warning',
            'aria-label': 'Form has validation errors'
        }));
    }

    return label;
};

/* The segment lives in the page shell, so its listeners are bound once. */
const bindFormSegment = (segment) => {
    if (segment.__form_tabs_bound === true) {
        return;
    }

    segment.__form_tabs_bound = true;

    const activate_form = (form_index) => {
        if (isEditing() || form_index === getSession().current_form_index) {
            return;
        }

        selectForm(form_index);
        active_property_tab = 'basic';
        renderApp(handlers);
    };

    segment.addEventListener('ionChange', (event) => {
        activate_form(parseInt(event.detail.value, 10));
    });

    segment.addEventListener('click', (event) => {
        const tab = event.target.closest('.builder__form-tab');

        if (!tab) {
            return;
        }

        activate_form(parseInt(tab.getAttribute('value'), 10));
    });
};

const renderQuestions = () => {
    const container = document.getElementById('questions');

    if (!container) {
        return;
    }

    const inputs = getCurrentInputs();
    const current_ref = getSession().current_input_ref;
    const form = getCurrentForm();
    const form_name = form && form.name ? form.name : 'Form';
    const trail = getEditingTrail();
    const active_container = trail.length ? trail[trail.length - 1] : null;
    const card = createView(question_card_view);
    const title = card.querySelector('.builder__questions-title');
    const title_name = card.querySelector('.builder__questions-title-name');
    const list = card.querySelector('.builder__question-list');
    const empty = card.querySelector('.builder__empty');

    title_name.textContent = form_name;

    trail.forEach((node, index) => {
        title.append(element('span', { class: 'builder__questions-title-sep', 'aria-hidden': 'true' }, [' > ']));
        title.append(element('span', {
            class: `builder__questions-title-crumb${index === trail.length - 1 ? ' is-current' : ''}`
        }, [getQuestionLabel(node)]));
    });

    title.setAttribute('title', [form_name, ...trail.map(getQuestionLabel)].join(' > '));

    if (active_container) {
        empty.textContent = `No questions in this ${active_container.type} yet.`;
    }

    const branch_active = active_container && active_container.type === 'branch';
    // Legacy warns on entering an empty branch, but only for a form with inputs.
    const show_title_warning = countTitles(inputs) === 0 && (branch_active || (!active_container && inputs.length > 0));

    if (show_title_warning) {
        const warning = card.querySelector('[data-role="title-warning"]');

        if (warning) {
            warning.hidden = false;
            warning.querySelector('[data-role="title-warning-text"]').textContent = branch_active ?
                'No title set for this branch yet' :
                'No title set for this form yet';
        }
    }

    if (inputs.length) {
        empty.remove();

        inputs.forEach((input) => {
            list.append(buildQuestionRow(input, input.ref === current_ref));
        });
    }

    container.replaceChildren(card);

    installFormActions(card, form);

    installQuestionSortable(QUESTION_LIST, syncAfterDrop);
};

/* ion-item with `button` supplies the button role and keyboard activation, so
   the row only needs the selection click. */
const buildQuestionRow = (input, is_current) => {
    const question_type = getQuestionType(input.type);
    const row = element('ion-item', {
        class: 'builder__question',
        'data-input-ref': input.ref,
        'aria-current': is_current ? 'true' : 'false',
        'data-valid': isInputRowValid(input) ? 'true' : 'false'
    }, [
        element('span', { class: 'builder__question-type-icon' }, [
            icon(question_type ? question_type.icon : 'help-outline')
        ]),
        element('span', { class: 'builder__question-text', title: getQuestionLabel(input) }, [getQuestionLabel(input)]),
        buildQuestionTail(input)
    ]);

    row.button = true;

    row.addEventListener('click', () => {
        chooseInput(input.ref);
    });

    return row;
};

const buildQuestionTail = (input) => {
    return buildQuestionStatus(input);
};

const buildQuestionStatus = (input) => {
    const valid = isInputRowValid(input);
    const has_jumps = Array.isArray(input.jumps) && input.jumps.length > 0;
    const status = element('span', { class: 'builder__question-status' });
    const validity = element('span', {
        class: `question-state ${valid ? 'is-valid' : 'is-invalid'}`,
        'aria-label': valid ? 'Valid question' : 'Question has errors',
        title: valid ? 'Valid' : 'Needs attention'
    }, [
        icon(valid ? 'checkmark-circle' : 'warning')
    ]);

    if (has_jumps) {
        status.append(element('span', {
            class: 'jump-state',
            'aria-label': 'Question has jumps',
            title: 'Has jumps'
        }, [
            icon('arrow-down-circle-outline')
        ]));
    }

    status.append(validity);

    return status;
};

/* Rows belong to the active list, so that list is the jump-validation context. */
const isInputRowValid = (input) => {
    return isInputValid(input, getCurrentInputs());
};

/* Persists the order the sortable left in the DOM. */
const syncAfterDrop = () => {
    const list = document.querySelector(QUESTION_LIST);

    if (!list) {
        return;
    }

    const reordered = reorderInputs([...list.querySelectorAll('.builder__question')].map((row) => {
        return row.getAttribute('data-input-ref');
    }));

    if (reordered) {
        recordChange();
    }

    // jQuery UI is still unwinding its own drop when stop fires, so the
    // re-render waits for the next task.
    setTimeout(() => {
        renderQuestions();
        renderProperties();
        runBackgroundValidation();
    }, 0);
};

const chooseInput = (input_ref) => {
    selectInput(input_ref);
    active_property_tab = 'basic';
    updateSelection();
    renderProperties();
    runBackgroundValidation();
};

/* Only the selected row changes, so the list and its scroll position stay put. */
const updateSelection = () => {
    const current_ref = getSession().current_input_ref;

    document.querySelectorAll('#questions .builder__question').forEach((row) => {
        row.setAttribute('aria-current', row.getAttribute('data-input-ref') === current_ref ? 'true' : 'false');
    });
};

/* Legacy disables Jumps for anything edited inside a group. */
const canUseJumpsTab = (input) => {
    return hasJumpsTab(input.type) && !isEditingInsideGroup();
};

const isEditingInsideGroup = () => {
    return getEditingTrail().some((node) => {
        return node.type === 'group';
    });
};

const renderProperties = () => {
    const container = document.getElementById('properties');
    const input = getCurrentInput();

    if (!container) {
        return;
    }

    destroyReadmeEditor();

    const previous_body = container.querySelector('.builder__properties-body');
    const previous_scroll = previous_body ? previous_body.scrollTop : 0;
    const card = createView(properties_card_view);
    const title = card.querySelector('.builder__properties-title');
    const tab_strip = card.querySelector('.builder__property-tabs');
    const body = card.querySelector('.builder__properties-body');
    const empty = card.querySelector('[data-role="properties-empty"]');
    const editing_bar = card.querySelector('[data-role="editing-bar"]');

    if (editing_bar) {
        if (isEditing()) {
            editing_bar.hidden = false;
            editing_bar.querySelector('[data-role="exit-editing"]').onclick = () => {
                exitEditing();
                active_property_tab = 'basic';
                renderApp(handlers);
            };
        }
        else {
            editing_bar.remove();
        }
    }

    if (!input) {
        active_property_tab = 'basic';
        // Keep the actions group in layout but invisible: removing it shifts
        // the heading and misaligns it with the questions column.
        card.querySelector('.builder__properties-actions-group').style.visibility = 'hidden';
        tab_strip.remove();
        body.remove();
        empty.removeAttribute('hidden');
        container.replaceChildren(card);
        return;
    }

    empty.remove();

    const label = getQuestionLabel(input);

    title.textContent = label;
    title.setAttribute('title', label);

    if (active_property_tab === 'advanced' && !hasAdvancedTab(input.type)) {
        active_property_tab = 'basic';
    }

    if (active_property_tab === 'jumps' && !canUseJumpsTab(input)) {
        active_property_tab = 'basic';
    }

    // A custom element drops property writes made before it is upgraded, so
    // the card has to be in the document before the panels set control values.
    container.replaceChildren(card);

    bindPropertyActions(card, input);
    bindPropertyTabs(tab_strip, input);
    buildBasicPanel(input, card.querySelector('#property-content-basic'));
    buildAdvancedPanel(input, card.querySelector('#property-content-advanced'));
    buildJumpsPanel(input, card.querySelector('#property-content-jumps'));

    tab_strip.value = active_property_tab;

    setActivePropertyContent(active_property_tab);
    updatePropertyError(card, input);

    if (isMultipleAnswerType(input.type)) {
        installAnswersSortable(input);
    }

    body.scrollTop = previous_scroll;
};

const destroyReadmeEditor = () => {
    if (active_readme_editor) {
        active_readme_editor.destroy();
        active_readme_editor = null;
    }
};

const bindPropertyActions = (card, input) => {
    const copy_button = card.querySelector('[data-action="copy"]');
    const validate_button = card.querySelector('[data-action="validate"]');
    const delete_button = card.querySelector('[data-action="delete"]');

    // Legacy keeps copy disabled until the question itself is valid.
    copy_button.disabled = !isInputValid(input, getCurrentInputs());

    copy_button.addEventListener('click', () => {
        // Legacy covers the copy and drops the overlay ANIMATION_SLOW later.
        showLoading();

        if (!duplicateInput(input)) {
            hideLoading();
            return;
        }

        recordChange();
        renderQuestions();
        renderProperties();
        hideLoading(500);
        setTimeout(() => {
            notifySuccess(FORM_MESSAGES.INPUT_COPIED);
        }, 500);
    });

    validate_button.addEventListener('click', () => {
        performInputValidation();
    });

    delete_button.addEventListener('click', () => {
        openDeleteQuestion(input);
    });
};

/* Legacy validates the selected question and toasts the result. */
const performInputValidation = () => {
    if (!getCurrentInput()) {
        return;
    }

    showLoading();

    // The overlay makes the pass, and the icons it refreshes, visible.
    setTimeout(() => {
        hideLoading();
        renderApp(handlers);

        const input = getCurrentInput();
        const valid = input ? isInputValid(input, getCurrentInputs()) : false;

        if (valid) {
            notifySuccess(VALIDATION_MESSAGES.INPUT_VALID);
        }
        else {
            notifyError(VALIDATION_MESSAGES.INPUT_NOT_VALID);
        }
    }, 600);
};

/* Shows the first error for the selected question, under the question field. */
const updatePropertyError = (card, input) => {
    const message = card.querySelector('[data-role="properties-error"]');

    if (!message) {
        return;
    }

    const errors = getInputErrors(input, getCurrentInputs());

    if (!errors.length) {
        message.textContent = '';
        message.setAttribute('hidden', 'hidden');
        return;
    }

    message.textContent = errors[0].message;
    message.removeAttribute('hidden');
};

const bindPropertyTabs = (tab_strip, input) => {
    const advanced_tab = tab_strip.querySelector('[value="advanced"]');
    const jumps_tab = tab_strip.querySelector('[value="jumps"]');

    updateTabBadges(tab_strip, input);

    if (!hasAdvancedTab(input.type)) {
        advanced_tab.setAttribute('disabled', 'disabled');
    }

    if (!canUseJumpsTab(input)) {
        jumps_tab.setAttribute('disabled', 'disabled');
    }

    tab_strip.addEventListener('ionChange', (event) => {
        const value = event.detail.value;

        if (!value) {
            return;
        }

        if (value === 'advanced' && !hasAdvancedTab(input.type)) {
            return;
        }

        if (value === 'jumps' && !canUseJumpsTab(input)) {
            return;
        }

        if (value === active_property_tab) {
            return;
        }

        active_property_tab = value;
        setActivePropertyContent(value);
    });
};

const updateTabBadges = (tab_strip, input) => {
    const errors = getInputErrors(input, getCurrentInputs());
    const has_error = (tab) => {
        return errors.some((error) => {
            return error.tab === tab;
        });
    };

    markTabInvalid(tab_strip.querySelector('[value="basic"]'), has_error('properties'));
    markTabInvalid(tab_strip.querySelector('[value="jumps"]'), has_error('jumps'));
};

const markTabInvalid = (tab, invalid) => {
    tab.classList.toggle('is-invalid', invalid);

    if (invalid) {
        tab.setAttribute('aria-invalid', 'true');
    }
    else {
        tab.removeAttribute('aria-invalid');
    }
};

/* Live edits change validity, so the message, badges and copy gate follow. */
const refreshPropertyValidation = (card, input) => {
    const tab_strip = card.querySelector('.builder__property-tabs');
    const copy_button = card.querySelector('[data-action="copy"]');

    if (tab_strip) {
        updateTabBadges(tab_strip, input);
    }

    if (copy_button) {
        copy_button.disabled = !isInputValid(input, getCurrentInputs());
    }

    updatePropertyError(card, input);
};

const refreshCurrentProperties = () => {
    const card = document.querySelector('#properties ion-card');
    const input = getCurrentInput();

    if (card && input) {
        refreshPropertyValidation(card, input);
    }
};

/*
 * Background pass: reordering changes jump validity and selecting another
 * question must show the result of edits made since the last render. It
 * updates the icons and gates in place and never toasts, so only the explicit
 * Validate action reports a result.
 */
const runBackgroundValidation = () => {
    refreshQuestionRows();
    refreshFormTabs();
    updateSaveButton();
    refreshCurrentProperties();
};

const refreshQuestionRows = () => {
    const inputs = getCurrentInputs();

    document.querySelectorAll(QUESTION_LIST + ' > .builder__question').forEach((row) => {
        const input = inputs.find((candidate) => {
            return candidate.ref === row.getAttribute('data-input-ref');
        });

        if (!input) {
            return;
        }

        const valid = isInputRowValid(input);

        row.setAttribute('data-valid', valid ? 'true' : 'false');

        const status = row.querySelector('.builder__question-status');
        const replacement = buildQuestionTail(input);

        if (status) {
            status.replaceWith(replacement);
        }
        else {
            row.append(replacement);
        }
    });
};

/* The form tabs live in the page shell and outlive question re-renders. */
const refreshFormTabs = () => {
    const forms = getForms(getSession().project_definition);
    const tabs = document.querySelectorAll('#form-tabs .builder__form-tab');

    tabs.forEach((tab, index) => {
        const form = forms[index];
        const label = tab.querySelector('ion-label');

        if (!form || !label) {
            return;
        }

        const invalid = !areFormInputsValid(form);
        const warning = label.querySelector('.builder__form-tab-state');

        if (invalid && !warning) {
            label.append(element('ion-icon', {
                class: 'builder__form-tab-state',
                name: 'warning',
                'aria-label': 'Form has validation errors'
            }));
        }
        else if (!invalid && warning) {
            warning.remove();
        }
    });
};

const setActivePropertyContent = (value) => {
    document.querySelectorAll('#properties .builder__property-content').forEach((content) => {
        const active = content.id === `property-content-${value}`;

        content.classList.toggle('is-active', active);

        if (active) {
            content.removeAttribute('hidden');
            content.setAttribute('aria-hidden', 'false');
        }
        else {
            content.setAttribute('hidden', 'hidden');
            content.setAttribute('aria-hidden', 'true');
        }
    });
};

const buildBasicPanel = (input, pane) => {
    const panel = pane.querySelector('.builder__properties-panel');
    const question_group = panel.querySelector('.builder__question-field-group');
    const question_field = panel.querySelector('.builder__question-field');
    const question_label = panel.querySelector('[data-role="question-label"]');
    const required_toggle = panel.querySelector('[data-field="required"]');
    const title_row = panel.querySelector('[data-field="title"]');
    const edit_container = panel.querySelector('[data-role="edit-container"]');

    if (input.type === 'readme') {
        question_group.remove();
        required_toggle.remove();
        title_row.remove();
        edit_container.remove();

        active_readme_editor = createReadmeEditor(input.question || '', (question, plain_text) => {
            if (getSession().current_input_ref !== input.ref) {
                return;
            }

            updateCurrentInput({ question });
            updateQuestionText(plain_text);
            recordChange({ throttle: true });
        });
        panel.append(active_readme_editor.element);

        return;
    }

    question_label.textContent = getQuestionLabelText(input.type);
    bindQuestionField(question_field, input);

    if (allowsRequired(input.type)) {
        bindCheckboxToggle(required_toggle, input.is_required === true, (checked) => {
            updateCurrentInput({ is_required: checked });
        });
    }
    else {
        required_toggle.remove();
    }

    if (allowsTitle(input.type)) {
        bindTitleToggle(title_row, input);
    }
    else {
        title_row.remove();
    }

    if (isBranchOrGroup(input.type)) {
        edit_container.hidden = false;
        edit_container.textContent = input.type === 'branch' ? 'Edit Branch' : 'Edit Group';
        edit_container.disabled = String(input.question || '').trim() === '';
        edit_container.onclick = () => {
            enterInput(input.ref);
            active_property_tab = 'basic';
            renderApp(handlers);
        };
    }
    else {
        edit_container.remove();
    }

    if (isMultipleAnswerType(input.type)) {
        panel.append(buildPossibleAnswers(input));
    }
};

const buildAdvancedPanel = (input, pane) => {
    const panel = pane.querySelector('.builder__properties-panel');
    const empty = panel.querySelector('[data-role="advanced-empty"]');
    const fields = getAdvancedFields(input.type);

    panel.querySelectorAll('[data-field]').forEach((field) => {
        if (fields.indexOf(field.getAttribute('data-field')) === -1) {
            field.remove();
        }
    });

    if (!fields.length) {
        empty.removeAttribute('hidden');
        return;
    }

    empty.remove();

    if (fields.indexOf('numeric_type') !== -1) {
        bindNumericTypeControl(panel.querySelector('[data-field="numeric_type"]'), input);
    }

    if (fields.indexOf('default_number') !== -1) {
        bindNumberField(panel.querySelector('[data-field="default_number"]'), input.default, 'default');
    }

    if (fields.indexOf('min') !== -1) {
        bindNumberField(panel.querySelector('[data-field="min"]'), input.min, 'min');
    }

    if (fields.indexOf('max') !== -1) {
        bindNumberField(panel.querySelector('[data-field="max"]'), input.max, 'max');
    }

    if (fields.indexOf('default_text') !== -1) {
        bindTextField(panel.querySelector('[data-field="default_text"]'), input.default, 'default');
    }

    if (fields.indexOf('regex') !== -1) {
        bindRegexField(panel.querySelector('[data-field="regex"]'), input);
    }

    if (fields.indexOf('verify') !== -1) {
        const verify_label = panel.querySelector('[data-field="verify"] [data-role="verify-label"]');

        if (verify_label) {
            verify_label.textContent = DOUBLE_ENTRY_VERIFICATION_TYPES.indexOf(input.type) !== -1 ?
                'Require double entry verification' :
                'Require double entry';
        }

        bindCheckboxToggle(panel.querySelector('[data-field="verify"]'), input.verify === true, (checked) => {
            updateCurrentInput({ verify: checked });
        });
    }

    if (fields.indexOf('datetime_format') !== -1) {
        // Imported date/time questions can arrive with a null format; legacy
        // checks its default radio, so the definition must carry it too.
        if (!input.datetime_format) {
            updateCurrentInput({ datetime_format: getDefaultDatetimeFormat(input.type) });
        }

        bindDatetimeFormatControl(panel.querySelector('[data-field="datetime_format"]'), input);
    }

    if (fields.indexOf('set_to_current_datetime') !== -1) {
        bindCurrentDatetimeToggle(panel.querySelector('[data-field="set_to_current_datetime"]'), input);
    }

    if (fields.indexOf('uniqueness') !== -1) {
        bindUniquenessControl(panel.querySelector('[data-field="uniqueness"]'), input);
    }

    if (fields.indexOf('default_choice') !== -1) {
        bindDefaultChoiceControl(panel.querySelector('[data-field="default_choice"]'), input);
    }

    if (fields.indexOf('search_type') !== -1) {
        bindSearchTypeControl(panel.querySelector('[data-field="search_type"]'), input);
    }
};

const buildJumpsPanel = (input, pane) => {
    const panel = pane.querySelector('.builder__jumps-panel');
    const add_button = panel.querySelector('.builder__add-jump');
    const no_jumps = panel.querySelector('[data-role="no-jumps"]');
    const list = panel.querySelector('.builder__jumps-list');
    const jumps = Array.isArray(input.jumps) ? input.jumps : [];
    const destinations = getJumpAvailableDestinations(input, getCurrentInputs());

    list.replaceChildren();

    const can_add = canAddJump(input, getCurrentInputs());

    add_button.disabled = !can_add;
    add_button.title = can_add ? 'Add jump' : 'No jump destinations available';
    add_button.addEventListener('click', () => {
        if (addJump(input, getCurrentInputs())) {
            recordChange();
            renderProperties();
            renderQuestions();
            updateCurrentQuestionStatus();
        }
    });

    if (jumps.length === 0) {
        no_jumps.removeAttribute('hidden');
        return;
    }

    no_jumps.setAttribute('hidden', 'hidden');

    jumps.forEach((jump, index) => {
        list.append(buildJumpRow(input, jump, index, destinations));
    });
};

const initDropdown = (control, options, value, on_change, disabled) => {
    if (!control) {
        return null;
    }

    const is_dropdown = typeof control.setOptions === 'function' || control.classList && control.classList.contains('dropdown') && !control.hasAttribute('data-dropdown');
    if (is_dropdown && typeof control.setOptions === 'function') {
        if (on_change) {
            control.onChange(on_change);
        }
        control.setOptions(options, value);
        control.setDisabled(!!disabled);
        return control;
    }

    const placeholder = control.hasAttribute('data-dropdown') ?
        control :
        control.querySelector('[data-dropdown]');

    if (!placeholder) {
        return null;
    }

    if (typeof placeholder.setOptions === 'function') {
        if (on_change) {
            placeholder.onChange(on_change);
        }
        placeholder.setOptions(options, value);
        placeholder.setDisabled(!!disabled);
        return placeholder;
    }

    const dropdown = createDropdown({
        class_name: placeholder.className.replace(/\bdropdown\b/g, '').trim(),
        aria_label: placeholder.getAttribute('aria-label') || control.getAttribute('aria-label') || 'Select option',
        placeholder: placeholder.getAttribute('data-dropdown-placeholder') || 'Select',
        options,
        value,
        disabled: !!disabled,
        on_change: on_change
    });

    if (placeholder.parentNode) {
        placeholder.replaceWith(dropdown);
    }

    return dropdown;
};

const buildJumpRow = (input, jump, index, destinations) => {
    const always = usesAlwaysJump(input.type);
    const row = createView(always ? jump_row_always_view : jump_row_view);
    const when_placeholder = row.querySelector('.builder__jump-when');
    const answer_placeholder = row.querySelector('.builder__jump-answer');
    const goto_placeholder = row.querySelector('.builder__jump-goto');
    const remove_button = row.querySelector('.builder__jump-remove');

    row.setAttribute('data-jump-index', String(index));

    if (always) {
        initDropdown(when_placeholder, [{ value: 'ALL', label: 'always' }], 'ALL', null, true);
    }
    else {
        initDropdown(when_placeholder, JUMP_CONDITIONS.map((condition) => {
            return { value: condition.key, label: condition.label };
        }), jump.when || 'IS', (detail) => {
            updateJump(input, index, { when: detail.value });
            recordChange();
            renderProperties();
            renderQuestions();
            updateCurrentQuestionStatus();
        }, false);

        if (answer_placeholder) {
            const answer_options = (input.possible_answers || []).map((answer) => {
                return {
                    value: answer.answer_ref,
                    label: answer.answer || 'Untitled answer'
                };
            });
            const has_value = answer_options.some((option) => {
                return String(option.value) === String(jump.answer_ref);
            });
            const answer_value = has_value ? jump.answer_ref : (answer_options[0] ? answer_options[0].value : '');

            initDropdown(answer_placeholder, answer_options, answer_value, !jumpNeedsAnswer(jump.when) ? null : (detail) => {
                updateJump(input, index, { answer_ref: detail.value || '' });
                recordChange();
                renderProperties();
                renderQuestions();
                updateCurrentQuestionStatus();
            }, !jumpNeedsAnswer(jump.when));
        }
    }

    const destination_options = destinations.map((destination) => {
        return {
            value: destination.ref,
            label: destination.question
        };
    });
    const has_destination = destination_options.some((option) => {
        return String(option.value) === String(jump.to);
    });

    if (jump.to && !has_destination) {
        destination_options.unshift({
            value: jump.to,
            label: jump.to === PARAMETERS.JUMP_TO_END_OF_FORM_REF ? 'End of form' : 'Unavailable destination'
        });
    }

    if (!jump.to || !destination_options.some((option) => { return String(option.value) === String(jump.to); })) {
        destination_options.unshift({ value: '', label: 'Select destination' });
    }

    initDropdown(goto_placeholder, destination_options, jump.to || '', (detail) => {
        updateJump(input, index, { to: detail.value || '' });
        recordChange();
        renderQuestions();
        updateCurrentQuestionStatus();
    }, false);

    remove_button.addEventListener('click', () => {
        if (removeJump(input, index)) {
            recordChange();
            renderProperties();
            renderQuestions();
            updateCurrentQuestionStatus();
        }
    });

    return row;
};

const getQuestionLabelText = (type) => {
    if (isBranchOrGroup(type)) {
        return 'Header';
    }

    // Legacy labels the media text field differently from the other questions.
    if (isMediaType(type)) {
        return 'Question Text';
    }

    return 'Question';
};

/* Legacy disables Edit while a branch/group header is empty. */
const updateEditButtonState = (input) => {
    if (!isBranchOrGroup(input.type)) {
        return;
    }

    const edit_container = document.querySelector('#properties [data-role="edit-container"]');

    if (edit_container) {
        edit_container.disabled = String(input.question || '').trim() === '';
    }
};

const bindQuestionField = (field, input) => {
    const label = getQuestionLabelText(input.type);
    const placeholder = isBranchOrGroup(input.type) ? 'Type header here...' : 'Type question here...';

    field.placeholder = placeholder;
    field.setAttribute('placeholder', placeholder);
    field.setAttribute('aria-label', label);
    field.value = input.question || '';

    // Legacy media text fields have no maxlength; every other question does.
    if (isMediaType(input.type)) {
        field.removeAttribute('maxlength');
    }
    else {
        field.setAttribute('maxlength', String(PARAMETERS.QUESTION_MAX_LENGTH));
    }

    field.addEventListener('ionInput', (event) => {
        const question = sanitizeQuestion(getCurrentInput(), event.detail.value || '');

        if (field.value !== question) {

            field.value = question;
        }

        updateCurrentInput({ question });
        updateEditButtonState(input);
        updateQuestionText(question);
        updateCurrentQuestionStatus();
        refreshCurrentProperties();
        recordChange({ throttle: true });
    });
};

const sanitizeQuestion = (input, value) => {
    const text = value === undefined || value === null ? '' : String(value);
    const limit = input && input.type === 'readme' ? PARAMETERS.README_MAX_LENGTH : PARAMETERS.QUESTION_MAX_LENGTH;
    // Legacy stores angle brackets as look-alike Unicode instead of markup.
    const sanitized = input && input.type === 'readme' ? text : text.replace(/>/g, '\ufe65').replace(/</g, '\ufe64');

    return sanitized.slice(0, limit);
};

const getQuestionLabel = (input) => {
    if (!input || !input.question) {
        return input && input.type === 'readme' ? 'Readme' : 'Untitled question';
    }

    if (input.type !== 'readme') {
        return input.question;
    }

    const parsed = new DOMParser().parseFromString(input.question, 'text/html');

    return parsed.body.textContent.trim() || 'Readme';
};

const bindCheckboxToggle = (toggle, checked, on_change, options) => {
    const config = options || {};

    if (config.disabled) {
        toggle.disabled = true;
    }

    toggle.checked = checked;
    toggle.addEventListener('ionChange', (event) => {
        on_change(event.detail.checked);
        // A refused change leaves the state identical and is skipped by dedupe.
        recordChange();
    });
};

const bindTitleToggle = (row, input) => {
    const toggle = row.querySelector('.builder__title-toggle');
    const inputs = getCurrentInputs();
    const other_titles = countTitles(inputs, input.ref);
    const checked = input.is_title === true;
    const limit_reached = !checked && other_titles >= PARAMETERS.TITLES_MAX;
    const label = row.querySelector('.builder__title-label');

    label.textContent = limit_reached ? `Limit of ${PARAMETERS.TITLES_MAX} titles reached` : 'Use answer as title';

    bindCheckboxToggle(toggle, checked, (next_checked) => {
        if (next_checked && !input.is_title && countTitles(getCurrentInputs(), input.ref) >= PARAMETERS.TITLES_MAX) {
            // Refused by the limit: put the box back without rebuilding the panel.
            toggle.checked = input.is_title === true;
            return;
        }

        // No re-render: the checkbox already shows its own state, and replacing
        // the card would drop focus and reset the panel's scroll position.
        updateCurrentInput({ is_title: next_checked });
    }, { disabled: limit_reached });
};

const bindTextField = (field, value, property) => {
    field.setAttribute('maxlength', String(PARAMETERS.QUESTION_MAX_LENGTH));
    field.value = value || '';
    field.placeholder = '';
    field.setAttribute('placeholder', '');

    field.addEventListener('ionInput', (event) => {
        const next = {};
        const text = event.detail.value || '';

        next[property] = text === '' ? null : text;
        updateCurrentInput(next);
        recordChange({ throttle: true });
    });
};

const bindNumberField = (field, value, property) => {
    const max_length = property === 'min' || property === 'max' ?
        PARAMETERS.MIN_MAX_LENGTH :
        PARAMETERS.QUESTION_MAX_LENGTH;

    field.setAttribute('maxlength', String(max_length));
    field.value = value === null || value === undefined ? '' : String(value);
    field.placeholder = '';
    field.setAttribute('placeholder', '');

    field.addEventListener('ionInput', (event) => {
        const text = event.detail.value || '';
        const next = {};

        next[property] = text === '' ? null : text;
        updateCurrentInput(next);
        recordChange({ throttle: true });
    });
};

const bindRegexField = (wrapper, input) => {
    const field = wrapper.querySelector('ion-input');

    field.setAttribute('maxlength', String(PARAMETERS.REGEX_MAX_LENGTH));
    field.value = input.regex || '';
    field.placeholder = '';
    field.setAttribute('placeholder', '');

    field.addEventListener('ionInput', (event) => {
        const text = event.detail.value || '';

        updateCurrentInput({ regex: text === '' ? null : text });
        recordChange({ throttle: true });
    });

};

const bindNumericTypeControl = (field_group, input) => {
    const current = input.type === 'decimal' ? 'decimal' : 'integer';
    const group = field_group.querySelector('ion-radio-group');

    group.value = current;
    group.addEventListener('ionChange', (event) => {
        const next_type = event.detail.value;

        if (next_type !== 'integer' && next_type !== 'decimal') {
            return;
        }

        updateCurrentInput({ type: next_type });
        recordChange();
        renderQuestions();
        renderProperties();
    });
};

const bindSearchTypeControl = (field_group, input) => {
    const group = field_group.querySelector('ion-radio-group');

    group.value = input.type;
    group.addEventListener('ionChange', (event) => {
        const next_type = event.detail.value;

        if (next_type !== 'searchsingle' && next_type !== 'searchmultiple') {
            return;
        }

        updateCurrentInput({ type: next_type });
        recordChange();
        renderQuestions();
        renderProperties();
    });
};

const bindDatetimeFormatControl = (field_group, input) => {
    const label = field_group.querySelector('.builder__field-label');

    label.textContent = input.type === 'time' ? 'Time format' : 'Date format';

    field_group.querySelectorAll('ion-radio-group').forEach((group) => {
        if (group.getAttribute('data-datetime-type') !== input.type) {
            group.remove();
            return;
        }

        group.value = input.datetime_format || getDefaultDatetimeFormat(input.type);
        group.addEventListener('ionChange', (event) => {
            updateCurrentInput({ datetime_format: event.detail.value });
            recordChange();
        });
    });
};

const bindCurrentDatetimeToggle = (toggle, input) => {
    const label = toggle.querySelector('[data-role="datetime-label"]');

    label.textContent = input.type === 'date' ?
        'Set initial answer to current date' :
        'Set initial answer to current time';

    bindCheckboxToggle(toggle, input.set_to_current_datetime === true, (checked) => {
        updateCurrentInput({ set_to_current_datetime: checked });
    });
};

const bindDefaultChoiceControl = (control, input) => {
    if (!control) {
        return;
    }

    const options = [{ value: '', label: 'None' }, ...(input.possible_answers || []).map((answer) => {
        return {
            value: answer.answer_ref,
            label: answer.answer || 'Untitled answer'
        };
    })];
    const has_default = (input.possible_answers || []).some((answer) => {
        return String(answer.answer_ref) === String(input.default);
    });
    const value = has_default ? input.default : '';

    const dropdown_control = (typeof control.setOptions === 'function' || control.hasAttribute('data-dropdown')) ?
        control :
        control.querySelector('[data-dropdown], .dropdown');

    if (dropdown_control) {
        initDropdown(dropdown_control, options, value, (detail) => {
            updateCurrentInput({ default: detail.value ? detail.value : null });
            recordChange();
        }, false);
        return;
    }

    control.replaceChildren();
    options.forEach((option_data) => {
        control.append(element('ion-select-option', { value: option_data.value }, [option_data.label]));
    });
    control.value = value;
    control.addEventListener('ionChange', (event) => {
        const next = event.detail.value;
        updateCurrentInput({ default: next ? next : null });
        recordChange();
    });
};

const bindUniquenessControl = (control, input) => {
    if (!control) {
        return;
    }

    const form = getCurrentForm();
    const form_name = form ? form.name : 'this form';
    const project = getSession().project_definition && getSession().project_definition.data && getSession().project_definition.data.project;
    const forms = project && project.forms ? project.forms : [];
    const form_index = form ? forms.indexOf(form) : 0;
    const branch_container = getEditingTrail().find((node) => {
        return node.type === 'branch';
    });
    const is_editing_branch = !!branch_container;
    const branch_header = branch_container && branch_container.question ? branch_container.question : 'branch';

    const options = [{ value: 'none', label: 'No uniqueness' }];

    if (is_editing_branch) {
        // Legacy branch uniqueness: contract value is 'form', label is branch-scoped.
        options.push({
            value: 'form',
            label: `Make answer unique to all ${branch_header} entries of a ${form_name} entry`
        });
    }
    else if (form_index > 0) {
        const parent_name = forms[form_index - 1] ? forms[form_index - 1].name : 'parent form';
        options.push({ value: 'form', label: `All ${form_name} entries` });
        options.push({ value: 'hierarchy', label: `Only ${form_name} children of a ${parent_name} parent entry` });
    }
    else {
        options.push({ value: 'form', label: `Make answer unique to all ${form_name} entries` });
    }

    const value = options.some((option) => { return option.value === (input.uniqueness || 'none'); }) ?
        (input.uniqueness || 'none') : 'none';

    const dropdown_control = (typeof control.setOptions === 'function' || control.hasAttribute('data-dropdown')) ?
        control :
        control.querySelector('[data-dropdown], .dropdown');

    if (dropdown_control) {
        const dropdown = initDropdown(dropdown_control, options, value, (detail) => {
            updateCurrentInput({ uniqueness: detail.value || 'none' });
            recordChange();
        }, false);

        if (dropdown) {
            dropdown.setOptions(options, value);
        }
        return;
    }

    control.replaceChildren();
    options.forEach((option_data) => {
        control.append(element('ion-select-option', { value: option_data.value }, [option_data.label]));
    });
    control.value = value;
    control.addEventListener('ionChange', (event) => {
        updateCurrentInput({ uniqueness: event.detail.value || 'none' });
        recordChange();
    });
};

const buildPossibleAnswers = (input) => {
    const answers = input.possible_answers;
    const card = createView(possible_answers_view);
    const list = card.querySelector('.builder__answer-list');
    const add_button = card.querySelector('.builder__add-answer');
    const page = getAnswersPage(input);
    const pages = getAnswerPageCount(answers);
    const page_answers = getAnswerPage(answers, page);
    const at_limit = answers.length >= getAnswerLimit(input.type);
    const notice = answer_notices.get(input.ref);

    page_answers.forEach((answer, index) => {
        list.append(buildAnswerRow(input, answer, (page - 1) * PARAMETERS.ANSWERS_PER_PAGE + index, answers.length));
    });

    add_button.disabled = at_limit;
    add_button.addEventListener('click', () => {
        if (!addPossibleAnswer(input)) {
            return;
        }

        setAnswersPage(input, getAnswerPageCount(input.possible_answers));
        recordChange();
        renderProperties();
        updateCurrentQuestionStatus();
    });

    if (notice) {
        answer_notices.delete(input.ref);
        showAnswersNote(card, notice, false);
    }

    installAnswersPager(card, input, page, pages, page_answers);
    installAnswersMenu(card, input);

    return card;
};

/* The visible page is the unit the list sorts and saves. */
const getAnswersPage = (input) => {
    const pages = getAnswerPageCount(input.possible_answers);
    const page = Math.min(Math.max(answer_pages.get(input.ref) || 1, 1), pages);

    answer_pages.set(input.ref, page);

    return page;
};

const setAnswersPage = (input, page) => {
    answer_pages.set(input.ref, page);
};

const showAnswersNote = (card, message, is_error) => {
    const note = card.querySelector('[data-role="answers-note"]');

    if (!note) {
        return;
    }

    note.textContent = message || '';
    note.classList.toggle('is-error', is_error === true);
    note.hidden = !message;
};

/* Paging is blocked while a visible answer is still empty. */
const canLeaveAnswersPage = (page_answers) => {
    return page_answers.every((answer) => {
        return String(answer.answer || '').trim() !== '';
    });
};

const installAnswersPager = (card, input, page, pages, page_answers) => {
    const pager = card.querySelector('[data-role="answers-pager"]');

    if (!pager) {
        return;
    }

    if (pages <= 1) {
        pager.setAttribute('hidden', 'hidden');
        return;
    }

    const label = pager.querySelector('[data-role="answers-page"]');
    const total = pager.querySelector('[data-role="answers-pages"]');
    const previous = pager.querySelector('[data-action="page-prev"]');
    const next = pager.querySelector('[data-action="page-next"]');

    pager.removeAttribute('hidden');
    label.textContent = String(page);
    total.textContent = String(pages);
    previous.disabled = page <= 1;
    next.disabled = page >= pages;

    const go_to = (target) => {
        if (!canLeaveAnswersPage(page_answers)) {
            showAnswersNote(card, VALIDATION_MESSAGES.POSSIBLE_ANSWER_EMPTY, true);
            return;
        }

        setAnswersPage(input, target);
        renderProperties();
    };

    previous.addEventListener('click', () => {
        go_to(page - 1);
    });

    next.addEventListener('click', () => {
        go_to(page + 1);
    });
};

const downloadFile = (filename, contents, type) => {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const installAnswersMenu = (card, input) => {
    const trigger = card.querySelector('[data-role="answers-actions-trigger"]');

    if (!trigger) {
        return;
    }

    createMenu(trigger, [
        { label: 'Import CSV', data_action: 'import', action: () => { pickAnswersCsv(input); } },
        { label: 'Export CSV', data_action: 'export', action: () => {
            downloadFile(getCsvFilename(input), exportCsv(input), 'text/csv;charset=utf-8;');
        } },
        { divider: true },
        { label: 'Order ascending', data_action: 'order-az', action: () => { orderAnswers(input, POSSIBLE_ANSWERS_ORDER.AZ); } },
        { label: 'Order descending', data_action: 'order-za', action: () => { orderAnswers(input, POSSIBLE_ANSWERS_ORDER.ZA); } },
        { label: 'Shuffle', data_action: 'shuffle', action: () => { orderAnswers(input, POSSIBLE_ANSWERS_ORDER.SHUFFLE); } },
        { divider: true },
        { label: 'Delete all answers', data_action: 'delete-all', action: () => {
            showLoading();

            if (deleteAllAnswers(input)) {
                setAnswersPage(input, 1);
                recordChange();
                renderProperties();
                updateCurrentQuestionStatus();
            }

            // Legacy keeps the overlay up for ANIMATION_SUPER_SLOW.
            hideLoading(1000);
        } }
    ], (item) => {
        item.action();
    });
};

const orderAnswers = (input, order) => {
    // Legacy reorders behind the overlay and hides it after ANIMATION_SUPER_SLOW.
    showLoading();

    if (!orderPossibleAnswers(input, order)) {
        hideLoading();
        return;
    }

    setAnswersPage(input, 1);
    recordChange();
    renderProperties();
    updateCurrentQuestionStatus();
    hideLoading(1000);
};

const pickAnswersCsv = (input) => {
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

        const reader = new FileReader();

        reader.onload = () => {
            const parsed = parseCsv(reader.result);

            field.remove();

            if (!parsed.rows.length) {
                notifyError(VALIDATION_MESSAGES.CSV_FILE_INVALID);
                return;
            }

            openAnswersCsvModal(input, parsed);
        };

        reader.onerror = () => {
            field.remove();
            notifyError(VALIDATION_MESSAGES.CSV_FILE_INVALID);
        };

        reader.readAsText(file);
    });

    document.body.append(field);
    field.click();
};

const openAnswersCsvModal = (input, parsed) => {
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
        options: [{ value: '', label: 'Pick column' }, ...getCsvColumns(parsed, true)],
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
            [{ value: '', label: 'Pick column' }, ...getCsvColumns(parsed, headers.checked === true)],
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
            { text: 'Dismiss', class_name: 'btn-default' },
            {
                text: 'Import',
                class_name: 'btn-primary',
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
                    answer_notices.delete(input.ref);
                    setAnswersPage(input, 1);
                    recordChange();
                    renderProperties();
                    updateCurrentQuestionStatus();
                    // Legacy hides the overlay after ANIMATION_SUPER_SLOW.
                    hideLoading(1000);
                    setTimeout(() => {
                        notifySuccess(VALIDATION_MESSAGES.POSSIBLE_ANSWERS_IMPORTED);
                    }, 1000);
                }
            }
        ]
    });

    import_button = modal.footer.querySelectorAll('button')[1];
};

/* The list has to be in the document before jQuery UI can hold on to it. */
const installAnswersSortable = (input) => {
    installAnswerSortable('#properties .builder__answer-list', () => {
        const answers_list = document.querySelector('#properties .builder__answer-list');

        if (!answers_list) {
            return;
        }

        const refs = [...answers_list.querySelectorAll('.builder__answer')].map((row) => {
            return row.getAttribute('data-answer-ref');
        });
        const page = answer_pages.get(input.ref) || 1;

        if (!reorderAnswerPage(input, refs, page)) {
            return;
        }

        recordChange();

        setTimeout(() => {
            renderProperties();
        }, 0);
    });
};

const buildAnswerRow = (input, answer, index, total) => {
    const row = element('li', {
        class: 'builder__answer',
        'data-answer-ref': answer.answer_ref
    });

    const field = element('ion-input', {
        class: 'builder__answer-field',
        'aria-label': `Answer ${index + 1}`,
        fill: 'outline',
        maxlength: String(PARAMETERS.MAX_ANSWER_LENGTH)
    });

    field.value = answer.answer;
    field.placeholder = '';
    field.setAttribute('placeholder', '');
    field.addEventListener('ionInput', (event) => {
        const value = sanitizeAnswer(event.detail.value || '');

        if (field.value !== value) {
            field.value = value;
        }

        renamePossibleAnswer(input, answer.answer_ref, value);
        updateCurrentQuestionStatus();
        refreshCurrentProperties();
        recordChange({ throttle: true });
    });

    const remove_button = button({
        type: 'button',
        class: 'builder__answer-remove',
        'aria-label': `Remove answer ${index + 1}`,
        disabled: total === 1 ? 'disabled' : undefined
    }, [icon('close-circle-outline')]);

    remove_button.addEventListener('click', () => {
        if (removePossibleAnswer(input, answer.answer_ref)) {
            recordChange();
            renderProperties();
            updateCurrentQuestionStatus();
        }
    });

    row.append(icon('swap-vertical-outline'));
    row.append(field);
    row.append(remove_button);

    return row;
};

/*
 * Keeps the selected row and the panel title in step with the edited text
 * without re-rendering the field being typed into.
 */
const updateQuestionText = (question) => {
    const input = getCurrentInput();
    const title = document.querySelector('#properties .builder__panel-title');
    const row = document.querySelector('.builder__question[aria-current="true"] .builder__question-text');
    const label = question || (input && input.type === 'readme' ? 'Readme' : 'Untitled question');

    if (title) {
        title.textContent = label;
    }

    if (row) {
        row.textContent = label;
        row.setAttribute('title', label);
    }
};

const updateCurrentQuestionStatus = () => {
    const input = getCurrentInput();

    if (!input) {
        return;
    }

    const row = document.querySelector(`.builder__question[data-input-ref="${input.ref}"]`);

    if (!row) {
        return;
    }

    row.setAttribute('data-valid', isInputRowValid(input) ? 'true' : 'false');

    const status = row.querySelector('.builder__question-status');
    const replacement = buildQuestionTail(input);

    if (status) {
        status.replaceWith(replacement);
    }
    else {
        row.append(replacement);
    }
};
