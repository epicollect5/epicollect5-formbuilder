'use strict';

import {PARAMETERS} from '@/config/parameters.js';
import {getForms} from '@/models/project-definition.js';
import {getQuestionType} from '@/models/question-types.js';
import {isBranchOrGroup, isMediaType} from '@/models/input-properties.js';
import {countTitles} from '@/models/project-limits.js';
import {isInputValid} from '@/services/validation.js';
import {
    exitEditing,
    getEditingContainer,
    getEditingTrail,
    getCurrentForm,
    getCurrentInput,
    getCurrentInputs,
    getSession,
    reorderInputs,
    selectInput,
    updateCurrentInput
} from '@/services/session.js';
import {createView, element, icon, button} from '@/ui/dom.js';
import question_card_view from '@/views/question-card.html?raw';
import {installQuestionSortable} from '@/ui/sortable.js';
import {getActivePropertyTab, getHandlers, setActivePropertyTab, recordChange} from '@/ui/state.js';
import {renderApp, renderProperties, runBackgroundValidation, installFormActions, refreshCurrentProperties} from '@/ui/shell.js';

export const renderQuestions = () => {
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
        title.append(element('span', {class: 'builder__questions-title-sep', 'aria-hidden': 'true'}, [' > ']));
        title.append(element('span', {
            class: `builder__questions-title-crumb${index === trail.length - 1 ? ' is-current' : ''}`
        }, [getQuestionLabel(node)]));
    });

    title.setAttribute('title', [form_name, ...trail.map(getQuestionLabel)].join(' > '));

    const editing_toolbar = card.querySelector('[data-role="editing-toolbar"]');

    if (editing_toolbar) {
        if (active_container) {
            editing_toolbar.hidden = false;
            editing_toolbar.querySelector('[data-role="exit-editing"]').onclick = () => {
                exitEditing();
                setActivePropertyTab('basic');
                renderApp(getHandlers());
            };
            editing_toolbar.querySelector('[data-role="editing-status"]')
                .append(buildEditingStatus(active_container));
        } else {
            editing_toolbar.remove();
        }
    }

    if (active_container) {
        empty.textContent = `No questions in this ${active_container.type} yet.`;
    }

    const branch_active = active_container && active_container.type === 'branch';
    // a list without questions has nothing to title: the warning waits for the
    // first question, and groups warn like branches do
    const show_title_warning = inputs.length > 0 && countTitles(inputs) === 0;

    if (show_title_warning) {
        const warning = card.querySelector('[data-role="title-warning"]');

        if (warning) {
            warning.hidden = false;
            warning.querySelector('[data-role="title-warning-text"]').textContent = branch_active ?
                'No title set for this branch yet' :
                (active_container ? 'No title set for this group yet' : 'No title set for this form yet');
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

    installQuestionSortable('#questions .builder__question-list', syncAfterDrop);
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
        element('span', {class: 'builder__question-type-icon'}, [
            icon(question_type ? question_type.icon : 'help-outline')
        ]),
        element('span', {class: 'builder__question-text', title: getQuestionLabel(input)}, [getQuestionLabel(input)]),
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
    const status = element('span', {class: 'builder__question-status'});
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

/* The editing toolbar shows whether every question of the container is valid. */
export const buildEditingStatus = (container) => {
    const valid = isInputValid(container, getCurrentInputs());

    return element('span', {
        class: `question-state ${valid ? 'is-valid' : 'is-invalid'}`,
        'aria-label': valid ? 'All questions are valid' : 'Questions have errors',
        title: valid ? 'All questions are valid' : 'Some questions need attention'
    }, [
        icon(valid ? 'checkmark-circle' : 'warning')
    ]);
};

/* Rows belong to the active list, so that list is the jump-validation context. */
const isInputRowValid = (input) => {
    return isInputValid(input, getCurrentInputs());
};

/* Persists the order the sortable left in the DOM. */
const syncAfterDrop = () => {
    const list = document.querySelector('#questions .builder__question-list');

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

export const chooseInput = (input_ref) => {
    selectInput(input_ref);
    setActivePropertyTab('basic');
    updateSelection();
    renderProperties();
    runBackgroundValidation();
};

/* Only the selected row changes, so the list and its scroll position stay put. */
export const updateSelection = () => {
    const current_ref = getSession().current_input_ref;

    document.querySelectorAll('#questions .builder__question').forEach((row) => {
        row.setAttribute('aria-current', row.getAttribute('data-input-ref') === current_ref ? 'true' : 'false');
    });
};

export const refreshQuestionRows = () => {
    const inputs = getCurrentInputs();

    document.querySelectorAll('#questions .builder__question-list > .builder__question').forEach((row) => {
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
        } else {
            row.append(replacement);
        }
    });

    // the container's validity icon follows the children's edits live
    const status_slot = document.querySelector('[data-role="editing-status"]');
    const editing_container = getEditingContainer();

    if (status_slot && editing_container) {
        status_slot.replaceChildren(buildEditingStatus(editing_container));
    }
};

export const updateCurrentQuestionStatus = () => {
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
    } else {
        row.append(replacement);
    }
};

export const getQuestionLabelText = (type) => {
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
export const updateEditButtonState = (input) => {
    if (!isBranchOrGroup(input.type)) {
        return;
    }

    const edit_container = document.querySelector('#properties [data-role="edit-container"]');

    if (edit_container) {
        edit_container.disabled = String(input.question || '').trim() === '';
    }
};

export const bindQuestionField = (field, input) => {
    const label = getQuestionLabelText(input.type);
    const placeholder = isBranchOrGroup(input.type) ? 'Type header here...' : 'Type question here...';

    field.placeholder = placeholder;
    field.setAttribute('placeholder', placeholder);
    field.setAttribute('aria-label', label);
    field.value = input.question || '';

    // Legacy media text fields have no maxlength; every other question does.
    if (isMediaType(input.type)) {
        field.removeAttribute('maxlength');
    } else {
        field.setAttribute('maxlength', String(PARAMETERS.QUESTION_MAX_LENGTH));
    }

    field.addEventListener('ionInput', (event) => {
        const question = sanitizeQuestion(getCurrentInput(), event.detail.value || '');

        if (field.value !== question) {

            field.value = question;
        }

        updateCurrentInput({question});
        updateEditButtonState(input);
        updateQuestionText(question);
        updateCurrentQuestionStatus();
        refreshCurrentProperties();
        recordChange({throttle: true});
    });
};

/*
 * Keeps the selected row and the panel title in step with the edited text
 * without re-rendering the field being typed into.
 */
export const updateQuestionText = (question) => {
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

export const sanitizeQuestion = (input, value) => {
    const text = value === undefined || value === null ? '' : String(value);
    const limit = input && input.type === 'readme' ? PARAMETERS.README_MAX_LENGTH : PARAMETERS.QUESTION_MAX_LENGTH;
    // Legacy stores angle brackets as look-alike Unicode instead of markup.
    const sanitized = input && input.type === 'readme' ? text : text.replace(/>/g, '\ufe65').replace(/</g, '\ufe64');

    return sanitized.slice(0, limit);
};

export const getQuestionLabel = (input) => {
    if (!input || !input.question) {
        return input && input.type === 'readme' ? 'Readme' : 'Untitled question';
    }

    if (input.type !== 'readme') {
        return input.question;
    }

    const parsed = new DOMParser().parseFromString(input.question, 'text/html');

    return parsed.body.textContent.trim() || 'Readme';
};
