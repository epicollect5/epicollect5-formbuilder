'use strict';

import { getForms, getProject } from '@/models/project-definition.js';
import {
    ANSWERS_PER_PAGE,
    MAX_ANSWER_LENGTH,
    POSSIBLE_ANSWERS_ORDER,
    getAnswerLimit,
    getAnswerPage,
    getAnswerPageCount,
    isMultipleAnswerType,
    sanitizeAnswer
} from '@/models/possible-answers.js';
import {
    allowsRequired,
    allowsTitle,
    getDefaultDatetimeFormat,
    hasAdvancedTab,
    hasJumpsTab,
    isBranchOrGroup
} from '@/models/input-properties.js';
import { getContainerList } from '@/models/nesting.js';
import { FORM_MESSAGES, VALIDATION_MESSAGES } from '@/models/messages.js';
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
    JUMP_TO_END_OF_FORM_REF,
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
    getEditingContainer,
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
import { getFormNameError, MAX_FORMS } from '@/services/form-management.js';
import { prepareImportedForm } from '@/services/form-import.js';
import { buildFormExport, getFormExportFilename, saveProject } from '@/services/save.js';
import { areAllInputsValid, areFormInputsValid, getInputErrors, isInputValid } from '@/services/validation.js';
import { canUndo, ensureUndoBaseline, pushUndoState, undo } from '@/services/undo.js';
import { confirmAlert } from '@/ui/alert.js';
import { button, createView, element, icon, parseView } from '@/ui/dom.js';
import { hideLoading, showLoading } from '@/ui/loading.js';
import { showToast } from '@/ui/toast.js';
import { createDropdown, populateDropdown } from '@/ui/dropdown.js';
import { printForm } from '@/ui/print.js';
import { createReadmeEditor } from '@/ui/readme-editor.js';
import { installAnswerSortable, installQuestionSortable, installToolDrag } from '@/ui/sortable.js';
import tools_view from '@/views/tools.html?raw';
import question_card_view from '@/views/question-card.html?raw';
import properties_card_view from '@/views/properties-card.html?raw';
import possible_answers_view from '@/views/possible-answers-card.html?raw';
import jump_row_view from '@/views/jump-row.html?raw';
import jump_row_always_view from '@/views/jump-row-always.html?raw';

const QUESTION_LIST = '#questions .builder__question-list';
const TITLE_LIMIT = 3;

let handlers = {};
const answer_pages = new Map();
const answer_notices = new Map();
let active_readme_editor = null;
let active_property_tab = 'basic';
let saving = false;
let pending_rename = false;
let unsaved_changes = false;
let tracked_project = null;
let unload_guard_bound = false;

export function renderApp(app_handlers) {
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
}

function renderProjectName() {
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
}

/* Same source as the legacy navbar: the project logo, else the media endpoint. */
function getProjectLogoUrl(project) {
    if (!project) {
        return '';
    }

    if (project.logo_url) {
        return project.logo_url;
    }

    const protocol = window.location.protocol;
    const parts = window.location.href.split('?')[0].split('#')[0].replace(protocol + '//', '').split('/');

    parts.pop();

    return protocol + '//' + parts.join('/') + '/api/internal/media/' + project.slug +
        '?type=photo&name=logo.jpg&format=project_mobile_logo';
}

function revealBuilder() {
    const loader = document.querySelector('.loader');
    const builder = document.getElementById('builder');

    if (loader) {
        loader.remove();
    }

    if (builder) {
        builder.hidden = false;
    }
}

/* Chrome controls are static, so assigning handlers keeps re-renders from
   stacking duplicate listeners. */
function bindChrome() {
    document.querySelectorAll('[data-action="back"], [data-action="exit"]').forEach(function (control) {
        control.onclick = function () {
            goBack();
        };
    });

    const undo_button = document.getElementById('undo');

    if (undo_button) {
        undo_button.onclick = function () {
            performUndo();
        };
    }

    const save_button = document.getElementById('save');

    if (save_button) {
        save_button.onclick = function () {
            performSave();
        };
    }

    const add_form = document.getElementById('add-form');
    const forms = getForms(getSession().project_definition);
    const at_form_cap = forms.length >= MAX_FORMS;

    if (add_form) {
        add_form.disabled = at_form_cap;
        add_form.title = at_form_cap ? 'A project can have at most ' + MAX_FORMS + ' forms' : 'Add form';
        add_form.onclick = function () {
            if (!addForm()) {
                return;
            }

            // The legacy flow asks for the new form's name straight away.
            pending_rename = true;
            recordChange();
            renderApp(handlers);
        };
    }

    updateUndoButton();
    updateSaveButton();
}

/* Snapshots are taken after a mutation, matching the legacy push points. */
function recordChange(options) {
    // The throttled push lands later, so the button gate has to follow it.
    pushUndoState(Object.assign({ on_change: updateUndoButton }, options || {}));
    unsaved_changes = true;
    updateUndoButton();
    updateSaveButton();
}
function updateUndoButton() {
    const undo_button = document.getElementById('undo');

    if (!undo_button) {
        return;
    }

    const available = canUndo();

    undo_button.disabled = !available;
    undo_button.title = available ? 'Undo the last change' : 'Nothing to undo';
}

function installUnloadGuard() {
    if (unload_guard_bound) {
        return;
    }

    unload_guard_bound = true;

    window.addEventListener('beforeunload', function (event) {
        if (!unsaved_changes) {
            return;
        }

        event.preventDefault();
        event.returnValue = 'Are you sure you want to leave?';
    });
}

function performUndo() {
    if (!undo()) {
        updateUndoButton();
        return;
    }

    // Undoing an added form leaves the index past the end of the restored list.
    if (getSession().current_form_index >= getForms(getSession().project_definition).length) {
        selectForm(Math.max(getForms(getSession().project_definition).length - 1, 0));
    }

    active_property_tab = 'basic';
    renderApp(handlers);
}

function updateSaveButton() {
    const button = document.getElementById('save');

    if (!button) {
        return;
    }

    const valid = areAllInputsValid(getSession().project_definition);

    button.disabled = saving || !valid;
    button.title = saving ? FORM_MESSAGES.PROJECT_SAVING : (valid ? 'Save project' : 'Fix the validation errors before saving');
}

async function performSave() {
    if (saving) {
        return;
    }

    const project_definition = getSession().project_definition;

    saving = true;
    updateSaveButton();
    showLoading(FORM_MESSAGES.PROJECT_SAVING);

    try {
        await saveProject(project_definition);
        unsaved_changes = false;
        showToast(FORM_MESSAGES.PROJECT_SAVED, 'success');
    }
    catch (error) {
        const message = error && error.message ? error.message : '';

        showToast(FORM_MESSAGES.PROJECT_NOT_SAVED + (message ? ' ' + message : ''), 'error');
    }
    finally {
        hideLoading();
        saving = false;
        updateSaveButton();
    }
}

function installFormActions(card, form) {
    if (!form) {
        return;
    }

    const forms = getForms(getSession().project_definition);
    const form_index = getSession().current_form_index;
    const deletable = !isEditing() && form_index > 0 && form_index === forms.length - 1;
    const delete_button = card.querySelector('.builder__form-action-btn--delete');
    const edit_button = card.querySelector('.builder__form-action-btn--edit');
    const import_button = card.querySelector('[data-action="form-import"]');

    if (delete_button) {
        delete_button.disabled = !deletable;
        delete_button.title = deletable ? 'Delete form' : FORM_MESSAGES.FORM_CANNOT_BE_DELETED;
        delete_button.onclick = function () {
            askFormConfirm(card, FORM_MESSAGES.FORM_DELETE_CONFIRM, function () {
                if (deleteForm(form_index)) {
                    recordChange();
                    renderApp(handlers);
                }
            });
        };
    }

    if (edit_button) {
        edit_button.onclick = function () {
            openFormRename(card, form);
        };
    }

    if (import_button) {
        import_button.disabled = isEditing();
        import_button.title = isEditing() ? 'Return to the form to import' : 'Import form';
    }

    const actions = {
        'form-rename': function () {
            openFormRename(card, form);
        },
        'form-export': function () {
            const payload = buildFormExport(getSession().project_definition, form_index);

            if (!payload) {
                showToast(FORM_MESSAGES.FORM_IS_INVALID, 'error');
                return;
            }

            downloadFile(getFormExportFilename(getSession().project_definition, form_index), JSON.stringify(payload), 'application/json');
        },
        'form-print': function () {
            if (!printForm(getSession().project_definition, form_index)) {
                showToast(FORM_MESSAGES.FORM_IS_INVALID, 'error');
            }
        },
        'form-import': function () {
            if (!isEditing()) {
                importFormFile(card, form);
            }
        },
        'form-delete-all': function () {
            askFormConfirm(card, FORM_MESSAGES.DELETE_ALL_CONFIRM, function () {
                if (removeAllInputs()) {
                    recordChange();
                    renderApp(handlers);
                }
            });
        }
    };

    Object.keys(actions).forEach(function (action) {
        const control = card.querySelector('[data-action="' + action + '"]');

        if (control) {
            control.onclick = function () {
                actions[action]();
            };
        }
    });
}

function openFormRename(card, form) {
    const panel = card.querySelector('[data-role="form-rename"]');
    const confirm_panel = card.querySelector('[data-role="form-confirm"]');
    const field = card.querySelector('[data-role="form-name-input"]');
    const save_button = card.querySelector('[data-action="form-rename-save"]');
    const cancel_button = card.querySelector('[data-action="form-rename-cancel"]');

    if (!panel || !field) {
        return;
    }

    if (confirm_panel) {
        confirm_panel.hidden = true;
    }

    panel.hidden = false;
    field.value = form.name || '';

    save_button.onclick = function () {
        const form_index = getSession().current_form_index;
        const error = getFormNameError(getForms(getSession().project_definition), field.value, form_index);

        if (error) {
            showToast(error, 'error');
            return;
        }

        renameForm(form_index, field.value);
        recordChange();
        renderApp(handlers);
    };

    cancel_button.onclick = function () {
        panel.hidden = true;
    };
}

function askFormConfirm(card, message, on_confirm) {
    const panel = card.querySelector('[data-role="form-confirm"]');
    const rename_panel = card.querySelector('[data-role="form-rename"]');
    const message_node = card.querySelector('[data-role="form-confirm-message"]');
    const yes = card.querySelector('[data-action="form-confirm-yes"]');
    const no = card.querySelector('[data-action="form-confirm-no"]');

    if (!panel) {
        return;
    }

    if (rename_panel) {
        rename_panel.hidden = true;
    }

    message_node.textContent = message;
    panel.hidden = false;

    yes.onclick = function () {
        panel.hidden = true;
        on_confirm();
    };

    no.onclick = function () {
        panel.hidden = true;
    };
}

function importFormFile(card, form) {
    const field = card.querySelector('[data-role="form-file"]');

    if (!field) {
        return;
    }

    field.value = '';
    field.onchange = function () {
        const file = field.files && field.files[0];

        if (!file) {
            return;
        }

        if (!/\.json$/i.test(file.name)) {
            showToast(FORM_MESSAGES.FORM_FILE_INVALID, 'error');
            return;
        }

        const reader = new FileReader();

        showLoading(FORM_MESSAGES.FORM_IMPORTING);

        reader.onload = function () {
            let result;

            try {
                result = prepareImportedForm(reader.result, getSession().project_definition, getSession().current_form_index);
            }
            catch (error) {
                // Never leave the overlay up if the parser itself throws.
                result = { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
            }

            hideLoading();

            if (!result.ok) {
                showToast(result.error, 'error');
                return;
            }

            getCurrentForm().inputs = result.inputs;
            getSession().current_input_ref = null;
            recordChange();
            renderApp(handlers);
            showToast(FORM_MESSAGES.FORM_IMPORTED, 'success');
        };

        reader.onerror = function () {
            hideLoading();
            showToast(FORM_MESSAGES.FORM_FILE_INVALID, 'error');
        };

        reader.readAsText(file);
    };

    field.click();
}

/* The tool catalogue is static markup; only the click and drag wiring changes. */
function renderTools() {
    const container = document.getElementById('tools');

    if (!container) {
        return;
    }

    container.replaceChildren(parseView(tools_view));

    container.querySelectorAll('.builder__tool').forEach(function (tool) {
        const type = tool.getAttribute('data-type');
        const allowed = canAddInput(type);

        // The legacy palette hides the tools a container cannot hold.
        tool.hidden = !allowed;
        tool.disabled = !allowed;

        tool.onclick = function () {
            addQuestion(type);
        };
    });

    installToolDrag('#tools .builder__tool', QUESTION_LIST, function (type, index) {
        if (!insertInput(type, index)) {
            return;
        }

        recordChange();
        renderQuestions();
        renderProperties();
    });
}

function addQuestion(type) {
    if (!addInput(type)) {
        return;
    }

    recordChange();
    renderQuestions();
    renderProperties();
}

function renderForms() {
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

    forms.forEach(function (form, form_index) {
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
}

function buildFormTabLabel(form) {
    const label = element('ion-label', {}, [form.name]);

    if (!areFormInputsValid(form)) {
        label.append(element('ion-icon', {
            class: 'builder__form-tab-state',
            name: 'warning-outline',
            'aria-label': 'Form has validation errors'
        }));
    }

    return label;
}

/* The segment lives in the page shell, so its listeners are bound once. */
function bindFormSegment(segment) {
    if (segment.__form_tabs_bound === true) {
        return;
    }

    segment.__form_tabs_bound = true;

    const activate_form = function (form_index) {
        if (isEditing() || form_index === getSession().current_form_index) {
            return;
        }

        selectForm(form_index);
        active_property_tab = 'basic';
        renderApp(handlers);
    };

    segment.addEventListener('ionChange', function (event) {
        activate_form(parseInt(event.detail.value, 10));
    });

    segment.addEventListener('click', function (event) {
        const tab = event.target.closest('.builder__form-tab');

        if (!tab) {
            return;
        }

        activate_form(parseInt(tab.getAttribute('value'), 10));
    });
}

function renderQuestions() {
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

    trail.forEach(function (node, index) {
        title.append(element('span', { class: 'builder__questions-title-sep', 'aria-hidden': 'true' }, [' > ']));
        title.append(element('span', {
            class: 'builder__questions-title-crumb' + (index === trail.length - 1 ? ' is-current' : '')
        }, [getQuestionLabel(node)]));
    });

    title.setAttribute('title', [form_name].concat(trail.map(getQuestionLabel)).join(' > '));

    if (active_container) {
        bindExitEditing(card, trail.length > 1);
        empty.textContent = 'No questions in this ' + active_container.type + ' yet.';
    }

    if (inputs.length) {
        empty.remove();

        inputs.forEach(function (input) {
            list.append(buildQuestionRow(input, input.ref === current_ref));
        });
    }

    container.replaceChildren(card);

    installFormActions(card, form);

    if (pending_rename && form) {
        pending_rename = false;
        openFormRename(card, form);
    }

    installQuestionSortable(QUESTION_LIST, syncAfterDrop);
}

function bindExitEditing(card, nested) {
    const exit_button = card.querySelector('.builder__questions-exit');
    const label = exit_button.querySelector('.builder__questions-exit-label');

    exit_button.removeAttribute('hidden');
    label.textContent = nested ? 'Back to branch' : 'Back to form';

    exit_button.addEventListener('click', function () {
        exitEditing();
        active_property_tab = 'basic';
        renderApp(handlers);
    });
}

/* ion-item with `button` supplies the button role and keyboard activation, so
   the row only needs the selection click. */
function buildQuestionRow(input, is_current) {
    const question_type = getQuestionType(input.type);
    const container_input = isBranchOrGroup(input.type);
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

    if (container_input) {
        // The row holds its own "edit" button, and an ion-item in button mode
        // cannot contain another button, so the row keeps the button role.
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                chooseInput(input.ref);
            }
        });
    }
    else {
        row.button = true;
    }

    row.addEventListener('click', function () {
        chooseInput(input.ref);
    });

    return row;
}

function buildQuestionTail(input) {
    const status = buildQuestionStatus(input);

    if (isBranchOrGroup(input.type)) {
        status.append(buildChildCount(input));
        status.append(buildEnterButton(input));
    }

    return status;
}

function buildChildCount(input) {
    const count = getContainerList(input).length;

    return element('span', {
        class: 'builder__question-count',
        title: count + (count === 1 ? ' question' : ' questions')
    }, [String(count)]);
}

function buildEnterButton(input) {
    const label = input.type === 'branch' ? 'Edit branch' : 'Edit group';
    const open = button({
        type: 'button',
        class: 'builder__question-enter',
        'aria-label': label + ': ' + getQuestionLabel(input),
        title: label
    }, [icon('chevron-forward-outline')]);

    open.addEventListener('click', function (event) {
        event.stopPropagation();
        enterInput(input.ref);
        active_property_tab = 'basic';
        renderApp(handlers);
    });

    return open;
}

function buildQuestionStatus(input) {
    const valid = isInputRowValid(input);
    const has_jumps = Array.isArray(input.jumps) && input.jumps.length > 0;
    const status = element('span', { class: 'builder__question-status' });
    const validity = element('span', {
        class: 'question-state ' + (valid ? 'is-valid' : 'is-invalid'),
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
}

/* Rows belong to the active list, so that list is the jump-validation context. */
function isInputRowValid(input) {
    return isInputValid(input, getCurrentInputs());
}

/* Persists the order the sortable left in the DOM. */
function syncAfterDrop() {
    const list = document.querySelector(QUESTION_LIST);

    if (!list) {
        return;
    }

    const reordered = reorderInputs([...list.querySelectorAll('.builder__question')].map(function (row) {
        return row.getAttribute('data-input-ref');
    }));

    if (reordered) {
        recordChange();
    }

    // jQuery UI is still unwinding its own drop when stop fires, so the
    // re-render waits for the next task.
    setTimeout(function () {
        renderQuestions();
        renderProperties();
    }, 0);
}

function chooseInput(input_ref) {
    selectInput(input_ref);
    active_property_tab = 'basic';
    updateSelection();
    renderProperties();
}

/* Only the selected row changes, so the list and its scroll position stay put. */
function updateSelection() {
    const current_ref = getSession().current_input_ref;

    document.querySelectorAll('#questions .builder__question').forEach(function (row) {
        row.setAttribute('aria-current', row.getAttribute('data-input-ref') === current_ref ? 'true' : 'false');
    });
}

function renderProperties() {
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

    if (!input) {
        active_property_tab = 'basic';
        card.querySelector('.builder__properties-actions-group').remove();
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

    if (active_property_tab === 'jumps' && !hasJumpsTab(input.type)) {
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
}

function destroyReadmeEditor() {
    if (active_readme_editor) {
        active_readme_editor.destroy();
        active_readme_editor = null;
    }
}

function bindPropertyActions(card, input) {
    const copy_button = card.querySelector('[data-action="copy"]');
    const validate_button = card.querySelector('[data-action="validate"]');
    const delete_button = card.querySelector('[data-action="delete"]');

    // Legacy keeps copy disabled until the question itself is valid.
    copy_button.disabled = !isInputValid(input, getCurrentInputs());

    copy_button.addEventListener('click', function () {
        if (duplicateInput(input)) {
            recordChange();
            renderQuestions();
            renderProperties();
        }
    });

    validate_button.addEventListener('click', function () {
        updatePropertyError(card, input, true);
        copy_button.disabled = !isInputValid(input, getCurrentInputs());
        updateCurrentQuestionStatus();
    });

    delete_button.addEventListener('click', function () {
        confirmAlert({
            header: 'Warning',
            message: FORM_MESSAGES.INPUT_DELETE_CONFIRM + ' ' + FORM_MESSAGES.INPUT_DELETE_WARNING,
            confirm_text: 'Confirm',
            on_confirm: function () {
                removeInput(input.ref);
                recordChange();
                renderQuestions();
                renderProperties();
            }
        });
    });
}

/* Shows the first error under the header; `announce_valid` confirms a pass. */
function updatePropertyError(card, input, announce_valid) {
    const message = card.querySelector('[data-role="properties-error"]');

    if (!message) {
        return;
    }

    const errors = getInputErrors(input, getCurrentInputs());
    const text = errors.length ? errors[0].message : (announce_valid ? VALIDATION_MESSAGES.INPUT_VALID : '');

    if (!text) {
        message.textContent = '';
        message.classList.remove('is-valid');
        message.setAttribute('hidden', 'hidden');
        return;
    }

    message.textContent = text;
    message.classList.toggle('is-valid', errors.length === 0);
    message.removeAttribute('hidden');
}

function bindPropertyTabs(tab_strip, input) {
    const advanced_tab = tab_strip.querySelector('[value="advanced"]');
    const jumps_tab = tab_strip.querySelector('[value="jumps"]');

    updateTabBadges(tab_strip, input);

    if (!hasAdvancedTab(input.type)) {
        advanced_tab.setAttribute('disabled', 'disabled');
    }

    if (!hasJumpsTab(input.type)) {
        jumps_tab.setAttribute('disabled', 'disabled');
    }

    tab_strip.addEventListener('ionChange', function (event) {
        const value = event.detail.value;

        if (!value) {
            return;
        }

        if (value === 'advanced' && !hasAdvancedTab(input.type)) {
            return;
        }

        if (value === 'jumps' && !hasJumpsTab(input.type)) {
            return;
        }

        if (value === active_property_tab) {
            return;
        }

        active_property_tab = value;
        setActivePropertyContent(value);
    });
}

function updateTabBadges(tab_strip, input) {
    const errors = getInputErrors(input, getCurrentInputs());
    const has_error = function (tab) {
        return errors.some(function (error) {
            return error.tab === tab;
        });
    };

    markTabInvalid(tab_strip.querySelector('[value="basic"]'), has_error('properties'));
    markTabInvalid(tab_strip.querySelector('[value="jumps"]'), has_error('jumps'));
}

function markTabInvalid(tab, invalid) {
    tab.classList.toggle('is-invalid', invalid);

    if (invalid) {
        tab.setAttribute('aria-invalid', 'true');
    }
    else {
        tab.removeAttribute('aria-invalid');
    }
}

/* Live edits change validity, so the message, badges and copy gate follow. */
function refreshPropertyValidation(card, input) {
    const tab_strip = card.querySelector('.builder__property-tabs');
    const copy_button = card.querySelector('[data-action="copy"]');

    if (tab_strip) {
        updateTabBadges(tab_strip, input);
    }

    if (copy_button) {
        copy_button.disabled = !isInputValid(input, getCurrentInputs());
    }

    updatePropertyError(card, input);
}

function refreshCurrentProperties() {
    const card = document.querySelector('#properties ion-card');
    const input = getCurrentInput();

    if (card && input) {
        refreshPropertyValidation(card, input);
    }
}

function setActivePropertyContent(value) {
    document.querySelectorAll('#properties .builder__property-content').forEach(function (content) {
        const active = content.id === 'property-content-' + value;

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
}

function buildBasicPanel(input, pane) {
    const panel = pane.querySelector('.builder__properties-panel');
    const question_field = panel.querySelector('.builder__question-field');
    const required_toggle = panel.querySelector('[data-field="required"]');
    const title_toggle = panel.querySelector('[data-field="title"]');

    if (input.type === 'readme') {
        question_field.remove();
        required_toggle.remove();
        title_toggle.remove();

        active_readme_editor = createReadmeEditor(input.question || '', function (question, plain_text) {
            if (getSession().current_input_ref !== input.ref) {
                return;
            }

            updateCurrentInput({ question: question });
            updateQuestionText(plain_text);
            recordChange({ throttle: true });
        });
        panel.append(active_readme_editor.element);

        return;
    }

    bindQuestionField(question_field, input);

    if (allowsRequired(input.type)) {
        bindCheckboxToggle(required_toggle, input.is_required === true, function (checked) {
            updateCurrentInput({ is_required: checked });
        });
    }
    else {
        required_toggle.remove();
    }

    if (allowsTitle(input.type)) {
        bindTitleToggle(title_toggle, input);
    }
    else {
        title_toggle.remove();
    }

    if (isMultipleAnswerType(input.type)) {
        panel.append(buildPossibleAnswers(input));
    }
}

function buildAdvancedPanel(input, pane) {
    const panel = pane.querySelector('.builder__properties-panel');
    const empty = panel.querySelector('[data-role="advanced-empty"]');
    const fields = getAdvancedFields(input.type);

    panel.querySelectorAll('[data-field]').forEach(function (field) {
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
        bindCheckboxToggle(panel.querySelector('[data-field="verify"]'), input.verify === true, function (checked) {
            updateCurrentInput({ verify: checked });
        });
    }

    if (fields.indexOf('datetime_format') !== -1) {
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
}

function buildJumpsPanel(input, pane) {
    const panel = pane.querySelector('.builder__jumps-panel');
    const add_button = panel.querySelector('.builder__add-jump');
    const no_jumps = panel.querySelector('[data-role="no-jumps"]');
    const list = panel.querySelector('.builder__jumps-list');
    const jumps = Array.isArray(input.jumps) ? input.jumps : [];
    const destinations = getJumpAvailableDestinations(input, getCurrentInputs());

    list.replaceChildren();
    add_button.disabled = !canAddJump(input);
    add_button.addEventListener('click', function () {
        if (addJump(input)) {
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

    jumps.forEach(function (jump, index) {
        list.append(buildJumpRow(input, jump, index, destinations));
    });
}

function initDropdown(control, options, value, on_change, disabled) {
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
        options: options,
        value: value,
        disabled: !!disabled,
        on_change: on_change
    });

    if (placeholder.parentNode) {
        placeholder.replaceWith(dropdown);
    }

    return dropdown;
}

function buildJumpRow(input, jump, index, destinations) {
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
        initDropdown(when_placeholder, JUMP_CONDITIONS.map(function (condition) {
            return { value: condition.key, label: condition.label };
        }), jump.when || 'IS', function (detail) {
            updateJump(input, index, { when: detail.value });
            recordChange();
            renderProperties();
            renderQuestions();
            updateCurrentQuestionStatus();
        }, false);

        if (answer_placeholder) {
            const answer_options = (input.possible_answers || []).map(function (answer) {
                return {
                    value: answer.answer_ref,
                    label: answer.answer || 'Untitled answer'
                };
            });
            const has_value = answer_options.some(function (option) {
                return String(option.value) === String(jump.answer_ref);
            });
            const answer_value = has_value ? jump.answer_ref : (answer_options[0] ? answer_options[0].value : '');

            initDropdown(answer_placeholder, answer_options, answer_value, !jumpNeedsAnswer(jump.when) ? null : function (detail) {
                updateJump(input, index, { answer_ref: detail.value || '' });
                recordChange();
                renderProperties();
                renderQuestions();
                updateCurrentQuestionStatus();
            }, !jumpNeedsAnswer(jump.when));
        }
    }

    const destination_options = destinations.map(function (destination) {
        return {
            value: destination.ref,
            label: destination.question
        };
    });
    const has_destination = destination_options.some(function (option) {
        return String(option.value) === String(jump.to);
    });

    if (jump.to && !has_destination) {
        destination_options.unshift({
            value: jump.to,
            label: jump.to === JUMP_TO_END_OF_FORM_REF ? 'End of form' : 'Unavailable destination'
        });
    }

    if (!jump.to || !destination_options.some(function (option) { return String(option.value) === String(jump.to); })) {
        destination_options.unshift({ value: '', label: 'Select destination' });
    }

    initDropdown(goto_placeholder, destination_options, jump.to || '', function (detail) {
        updateJump(input, index, { to: detail.value || '' });
        recordChange();
        renderQuestions();
        updateCurrentQuestionStatus();
    }, false);

    remove_button.addEventListener('click', function () {
        if (removeJump(input, index)) {
            recordChange();
            renderProperties();
            renderQuestions();
            updateCurrentQuestionStatus();
        }
    });

    return row;
}

function populateSelect(select, options, value, on_change) {
    if (select && typeof select.setOptions === 'function') {
        populateDropdown(select, options, value, on_change);
        return;
    }

    if (!select) {
        return;
    }

    select.replaceChildren();

    if (select.tagName && select.tagName.toLowerCase() === 'ion-select') {
        select.justify = 'space-between';
        select.setAttribute('justify', 'space-between');
        options.forEach(function (option_data) {
            const option = element('ion-select-option', { value: option_data.value });
            option.textContent = option_data.label;
            select.append(option);
        });
        select.value = value;
        return;
    }

    options.forEach(function (option_data) {
        const option = element('option', { value: option_data.value });
        option.textContent = option_data.label;
        select.append(option);
    });
    select.value = value;
}

function getQuestionLabelText(type) {
    if (type === 'branch') {
        return 'Header';
    }

    if (type === 'group') {
        return 'Header';
    }

    return 'Question';
}

function bindQuestionField(field, input) {
    const label = getQuestionLabelText(input.type);

    field.label = label;
    field.placeholder = '';
    field.setAttribute('placeholder', '');
    field.setAttribute('aria-label', label);
    field.value = input.question || '';

    field.addEventListener('ionInput', function (event) {
        const question = sanitizeQuestion(getCurrentInput(), event.detail.value || '');

        if (field.value !== question) {
            field.value = question;
        }

        updateCurrentInput({ question: question });
        updateQuestionText(question);
        updateCurrentQuestionStatus();
        refreshCurrentProperties();
        recordChange({ throttle: true });
    });
}

function sanitizeQuestion(input, value) {
    const text = value === undefined || value === null ? '' : String(value);
    const limit = input && input.type === 'readme' ? 1000 : 255;

    return text.slice(0, limit);
}

function getQuestionLabel(input) {
    if (!input || !input.question) {
        return input && input.type === 'readme' ? 'Readme' : 'Untitled question';
    }

    if (input.type !== 'readme') {
        return input.question;
    }

    const parsed = new DOMParser().parseFromString(input.question, 'text/html');

    return parsed.body.textContent.trim() || 'Readme';
}

function bindCheckboxToggle(toggle, checked, on_change, options) {
    const config = options || {};

    if (config.disabled) {
        toggle.disabled = true;
    }

    toggle.checked = checked;
    toggle.addEventListener('ionChange', function (event) {
        on_change(event.detail.checked);
        // A refused change leaves the state identical and is skipped by dedupe.
        recordChange();
    });
}

function bindTitleToggle(toggle, input) {
    const inputs = getCurrentInputs();
    const other_titles = countTitles(inputs, input.ref);
    const checked = input.is_title === true;
    const limit_reached = !checked && other_titles >= TITLE_LIMIT;
    const label = toggle.querySelector('.builder__title-label');

    label.textContent = limit_reached ? 'Limit of ' + TITLE_LIMIT + ' titles reached' : 'Use answer as title';

    bindCheckboxToggle(toggle, checked, function (next_checked) {
        if (next_checked && !input.is_title && countTitles(getCurrentInputs(), input.ref) >= TITLE_LIMIT) {
            // Refused by the limit: put the box back without rebuilding the panel.
            toggle.checked = input.is_title === true;
            return;
        }

        // No re-render: the checkbox already shows its own state, and replacing
        // the card would drop focus and reset the panel's scroll position.
        updateCurrentInput({ is_title: next_checked });
    }, { disabled: limit_reached });
}

function bindTextField(field, value, property) {
    field.value = value || '';
    field.placeholder = '';
    field.setAttribute('placeholder', '');

    field.addEventListener('ionInput', function (event) {
        const next = {};
        const text = event.detail.value || '';

        next[property] = text === '' ? null : text;
        updateCurrentInput(next);
        recordChange({ throttle: true });
    });
}

function bindNumberField(field, value, property) {
    field.value = value === null || value === undefined ? '' : String(value);
    field.placeholder = '';
    field.setAttribute('placeholder', '');

    field.addEventListener('ionInput', function (event) {
        const text = event.detail.value || '';
        const next = {};

        next[property] = text === '' ? null : text;
        updateCurrentInput(next);
        recordChange({ throttle: true });
    });
}

function bindRegexField(wrapper, input) {
    const field = wrapper.querySelector('ion-input');

    field.value = input.regex || '';
    field.placeholder = '';
    field.setAttribute('placeholder', '');

    field.addEventListener('ionInput', function (event) {
        const text = event.detail.value || '';

        updateCurrentInput({ regex: text === '' ? null : text });
        recordChange({ throttle: true });
    });

}

function bindNumericTypeControl(field_group, input) {
    const current = input.type === 'decimal' ? 'decimal' : 'integer';
    const group = field_group.querySelector('ion-radio-group');

    group.value = current;
    group.addEventListener('ionChange', function (event) {
        const next_type = event.detail.value;

        if (next_type !== 'integer' && next_type !== 'decimal') {
            return;
        }

        updateCurrentInput({ type: next_type });
        recordChange();
        renderQuestions();
        renderProperties();
    });
}

function bindSearchTypeControl(field_group, input) {
    const group = field_group.querySelector('ion-radio-group');

    group.value = input.type;
    group.addEventListener('ionChange', function (event) {
        const next_type = event.detail.value;

        if (next_type !== 'searchsingle' && next_type !== 'searchmultiple') {
            return;
        }

        updateCurrentInput({ type: next_type });
        recordChange();
        renderQuestions();
        renderProperties();
    });
}

function bindDatetimeFormatControl(field_group, input) {
    const label = field_group.querySelector('.builder__field-label');

    label.textContent = input.type === 'time' ? 'Time format' : 'Date format';

    field_group.querySelectorAll('ion-radio-group').forEach(function (group) {
        if (group.getAttribute('data-datetime-type') !== input.type) {
            group.remove();
            return;
        }

        group.value = input.datetime_format || getDefaultDatetimeFormat(input.type);
        group.addEventListener('ionChange', function (event) {
            updateCurrentInput({ datetime_format: event.detail.value });
            recordChange();
        });
    });
}

function bindCurrentDatetimeToggle(toggle, input) {
    const label = toggle.querySelector('[data-role="datetime-label"]');

    label.textContent = input.type === 'date' ?
        'Set initial answer to current date' :
        'Set initial answer to current time';

    bindCheckboxToggle(toggle, input.set_to_current_datetime === true, function (checked) {
        updateCurrentInput({ set_to_current_datetime: checked });
    });
}

function bindDefaultChoiceControl(control, input) {
    if (!control) {
        return;
    }

    const options = [{ value: '', label: 'None' }].concat((input.possible_answers || []).map(function (answer) {
        return {
            value: answer.answer_ref,
            label: answer.answer || 'Untitled answer'
        };
    }));
    const has_default = (input.possible_answers || []).some(function (answer) {
        return String(answer.answer_ref) === String(input.default);
    });
    const value = has_default ? input.default : '';

    const dropdown_control = (typeof control.setOptions === 'function' || control.hasAttribute('data-dropdown')) ?
        control :
        control.querySelector('[data-dropdown], .dropdown');

    if (dropdown_control) {
        initDropdown(dropdown_control, options, value, function (detail) {
            updateCurrentInput({ default: detail.value ? detail.value : null });
            recordChange();
        }, false);
        return;
    }

    control.replaceChildren();
    options.forEach(function (option_data) {
        control.append(element('ion-select-option', { value: option_data.value }, [option_data.label]));
    });
    control.value = value;
    control.addEventListener('ionChange', function (event) {
        const next = event.detail.value;
        updateCurrentInput({ default: next ? next : null });
        recordChange();
    });
}

function bindUniquenessControl(control, input) {
    if (!control) {
        return;
    }

    const form = getCurrentForm();
    const form_name = form ? form.name : 'this form';
    const project = getSession().project_definition && getSession().project_definition.data && getSession().project_definition.data.project;
    const forms = project && project.forms ? project.forms : [];
    const form_index = form ? forms.indexOf(form) : 0;
    const container = getEditingContainer();
    const is_editing_branch = !!(container && container.type === 'branch');

    let options = [{ value: 'none', label: 'No uniqueness' }];

    if (is_editing_branch) {
        // Legacy branch uniqueness: contract value is 'form', label is branch-scoped.
        options.push({ value: 'form', label: 'Unique within this branch' });
    }
    else if (form_index > 0) {
        const parent_name = forms[form_index - 1] ? forms[form_index - 1].name : 'parent form';
        options.push({ value: 'form', label: 'Unique to all ' + form_name + ' entries' });
        options.push({ value: 'hierarchy', label: 'Unique to all ' + parent_name + ' entries' });
    }
    else {
        options.push({ value: 'form', label: 'Unique to all ' + form_name + ' entries' });
    }

    const value = options.some(function (option) { return option.value === (input.uniqueness || 'none'); }) ?
        (input.uniqueness || 'none') : 'none';

    const dropdown_control = (typeof control.setOptions === 'function' || control.hasAttribute('data-dropdown')) ?
        control :
        control.querySelector('[data-dropdown], .dropdown');

    if (dropdown_control) {
        const dropdown = initDropdown(dropdown_control, options, value, function (detail) {
            updateCurrentInput({ uniqueness: detail.value || 'none' });
            recordChange();
        }, false);

        if (dropdown) {
            dropdown.setOptions(options, value);
        }
        return;
    }

    control.replaceChildren();
    options.forEach(function (option_data) {
        control.append(element('ion-select-option', { value: option_data.value }, [option_data.label]));
    });
    control.value = value;
    control.addEventListener('ionChange', function (event) {
        updateCurrentInput({ uniqueness: event.detail.value || 'none' });
        recordChange();
    });
}

function buildPossibleAnswers(input) {
    const answers = input.possible_answers;
    const card = createView(possible_answers_view);
    const list = card.querySelector('.builder__answer-list');
    const add_button = card.querySelector('.builder__add-answer');
    const page = getAnswersPage(input);
    const pages = getAnswerPageCount(answers);
    const page_answers = getAnswerPage(answers, page);
    const at_limit = answers.length >= getAnswerLimit(input.type);
    const notice = answer_notices.get(input.ref);

    page_answers.forEach(function (answer, index) {
        list.append(buildAnswerRow(input, answer, (page - 1) * ANSWERS_PER_PAGE + index, answers.length));
    });

    add_button.disabled = at_limit;
    add_button.addEventListener('click', function () {
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
}

/* The visible page is the unit the list sorts and saves. */
function getAnswersPage(input) {
    const pages = getAnswerPageCount(input.possible_answers);
    const page = Math.min(Math.max(answer_pages.get(input.ref) || 1, 1), pages);

    answer_pages.set(input.ref, page);

    return page;
}

function setAnswersPage(input, page) {
    answer_pages.set(input.ref, page);
}

function showAnswersNote(card, message, is_error) {
    const note = card.querySelector('[data-role="answers-note"]');

    if (!note) {
        return;
    }

    note.textContent = message || '';
    note.classList.toggle('is-error', is_error === true);
    note.hidden = !message;
}

/* Paging is blocked while a visible answer is still empty. */
function canLeaveAnswersPage(page_answers) {
    return page_answers.every(function (answer) {
        return String(answer.answer || '').trim() !== '';
    });
}

function installAnswersPager(card, input, page, pages, page_answers) {
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

    function go_to(target) {
        if (!canLeaveAnswersPage(page_answers)) {
            showAnswersNote(card, VALIDATION_MESSAGES.POSSIBLE_ANSWER_EMPTY, true);
            return;
        }

        setAnswersPage(input, target);
        renderProperties();
    }

    previous.addEventListener('click', function () {
        go_to(page - 1);
    });

    next.addEventListener('click', function () {
        go_to(page + 1);
    });
}

function downloadFile(filename, contents, type) {
    const blob = new Blob([contents], { type: type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function installAnswersMenu(card, input) {
    const actions = {
        import: function () {
            openAnswersCsv(card, input);
        },
        export: function () {
            downloadFile(getCsvFilename(input), exportCsv(input), 'text/csv;charset=utf-8;');
        },
        'order-az': function () {
            if (orderPossibleAnswers(input, POSSIBLE_ANSWERS_ORDER.AZ)) {
                setAnswersPage(input, 1);
                renderProperties();
                updateCurrentQuestionStatus();
            }
        },
        'order-za': function () {
            if (orderPossibleAnswers(input, POSSIBLE_ANSWERS_ORDER.ZA)) {
                setAnswersPage(input, 1);
                renderProperties();
                updateCurrentQuestionStatus();
            }
        },
        shuffle: function () {
            if (orderPossibleAnswers(input, POSSIBLE_ANSWERS_ORDER.SHUFFLE)) {
                setAnswersPage(input, 1);
                renderProperties();
                updateCurrentQuestionStatus();
            }
        },
        'delete-all': function () {
            if (deleteAllAnswers(input)) {
                setAnswersPage(input, 1);
                renderProperties();
                updateCurrentQuestionStatus();
            }
        }
    };

    Object.keys(actions).forEach(function (action) {
        const control = card.querySelector('[data-action="' + action + '"]');

        if (control) {
            control.addEventListener('click', function () {
                actions[action]();
                // Opening the panel or exporting leaves the state unchanged and
                // is skipped by the dedupe in the undo service.
                recordChange();
            });
        }
    });
}

/* The CSV panel is inline: it stays inside the answers card it imports into. */
function openAnswersCsv(card, input) {
    const panel = card.querySelector('[data-role="answers-csv"]');
    const file_field = panel.querySelector('[data-role="answers-csv-file"]');
    const headers_toggle = panel.querySelector('[data-role="answers-csv-headers"]');
    const column_select = panel.querySelector('[data-role="answers-csv-column"]');
    const mode_group = panel.querySelector('[data-role="answers-csv-mode"]');
    const import_button = panel.querySelector('[data-action="csv-import"]');
    const cancel_button = panel.querySelector('[data-action="csv-cancel"]');
    let parsed = null;

    panel.removeAttribute('hidden');
    file_field.value = '';
    headers_toggle.checked = true;
    mode_group.value = 'replace';
    column_select.replaceChildren();
    column_select.value = undefined;
    import_button.disabled = true;
    showAnswersNote(card, '', false);

    function fill_columns() {
        const columns = parsed ? getCsvColumns(parsed, headers_toggle.checked === true) : [];

        column_select.replaceChildren();
        columns.forEach(function (column) {
            const option = element('ion-select-option', { value: column.value });

            option.textContent = column.label;
            column_select.append(option);
        });

        column_select.value = columns.length ? columns[0].value : undefined;
        import_button.disabled = columns.length === 0;
    }

    headers_toggle.addEventListener('ionChange', fill_columns);

    file_field.addEventListener('change', function () {
        const file = file_field.files && file_field.files[0];

        if (!file) {
            return;
        }

        if (!/\.csv$/i.test(file.name)) {
            parsed = null;
            import_button.disabled = true;
            showAnswersNote(card, VALIDATION_MESSAGES.CSV_FILE_INVALID, true);
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {
            parsed = parseCsv(reader.result);

            if (!parsed.rows.length) {
                parsed = null;
                import_button.disabled = true;
                showAnswersNote(card, VALIDATION_MESSAGES.CSV_FILE_INVALID, true);
                return;
            }

            showAnswersNote(card, '', false);
            fill_columns();
        };
        reader.readAsText(file);
    });

    import_button.addEventListener('click', function () {
        if (!parsed) {
            showAnswersNote(card, VALIDATION_MESSAGES.CSV_FILE_INVALID, true);
            return;
        }

        const result = importAnswers(input, parsed, {
            column_index: column_select.value,
            has_headers: headers_toggle.checked === true,
            replace: mode_group.value !== 'append'
        });

        if (!result.ok) {
            showAnswersNote(card, VALIDATION_MESSAGES.POSSIBLE_ANSWER_EMPTY, true);
            return;
        }

        answer_notices.set(input.ref, VALIDATION_MESSAGES.POSSIBLE_ANSWERS_IMPORTED);
        setAnswersPage(input, 1);
        recordChange();
        renderProperties();
        updateCurrentQuestionStatus();
    });

    cancel_button.addEventListener('click', function () {
        panel.setAttribute('hidden', 'hidden');
    });
}

/* The list has to be in the document before jQuery UI can hold on to it. */
function installAnswersSortable(input) {
    installAnswerSortable('#properties .builder__answer-list', function () {
        const answers_list = document.querySelector('#properties .builder__answer-list');

        if (!answers_list) {
            return;
        }

        const refs = [...answers_list.querySelectorAll('.builder__answer')].map(function (row) {
            return row.getAttribute('data-answer-ref');
        });
        const page = answer_pages.get(input.ref) || 1;

        if (!reorderAnswerPage(input, refs, page)) {
            return;
        }

        recordChange();

        setTimeout(function () {
            renderProperties();
        }, 0);
    });
}

function buildAnswerRow(input, answer, index, total) {
    const row = element('li', {
        class: 'builder__answer',
        'data-answer-ref': answer.answer_ref
    });

    const field = element('ion-input', {
        class: 'builder__answer-field',
        'aria-label': 'Answer ' + (index + 1),
        fill: 'outline',
        maxlength: String(MAX_ANSWER_LENGTH)
    });

    field.value = answer.answer;
    field.placeholder = '';
    field.setAttribute('placeholder', '');
    field.addEventListener('ionInput', function (event) {
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
        'aria-label': 'Remove answer ' + (index + 1),
        disabled: total === 1 ? 'disabled' : undefined
    }, [icon('close-circle-outline')]);

    remove_button.addEventListener('click', function () {
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
}

/*
 * Keeps the selected row and the panel title in step with the edited text
 * without re-rendering the field being typed into.
 */
function updateQuestionText(question) {
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
}

function updateCurrentQuestionStatus() {
    const input = getCurrentInput();

    if (!input) {
        return;
    }

    const row = document.querySelector('.builder__question[data-input-ref="' + input.ref + '"]');

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
}
