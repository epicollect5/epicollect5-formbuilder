'use strict';

import { getForms, getProject } from '@/models/project-definition.js';
import { QUESTION_TYPES, getQuestionType } from '@/models/question-types.js';
import {
    addInput,
    getCurrentForm,
    getCurrentInput,
    getCurrentInputs,
    getSession,
    moveInput,
    removeInput,
    selectForm,
    selectInput,
    updateCurrentInput
} from '@/services/session.js';
import { button, element, icon } from '@/ui/dom.js';

let handlers = {};
let dragged_ref = null;

export function renderApp(app_handlers) {
    handlers = app_handlers || {};

    renderProjectName();
    revealBuilder();
    renderTools();
    renderForms();
    renderQuestions();
    renderProperties();
}

function renderProjectName() {
    const project = getProject(getSession().project_definition);
    const name = document.getElementById('project-name');

    if (name) {
        name.textContent = project ? project.name : '';
    }
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

function renderTools() {
    const container = document.getElementById('tools');

    if (!container) {
        return;
    }

    container.replaceChildren();

    QUESTION_TYPES.forEach(function (question_type) {
        const tool = button({
            type: 'button',
            class: 'builder__tool',
            'data-type': question_type.type,
            'aria-label': 'Add a ' + question_type.label + ' question'
        }, [
            icon(question_type.icon),
            element('span', { class: 'builder__tool-label' }, [question_type.label])
        ]);

        tool.addEventListener('click', function () {
            addQuestion(question_type.type);
        });

        container.append(tool);
    });
}

function addQuestion(type) {
    if (!addInput(type)) {
        return;
    }

    renderQuestions();
    renderProperties();
}

function renderForms() {
    const container = document.getElementById('form-tabs');

    if (!container) {
        return;
    }

    const current_form = getCurrentForm();

    container.replaceChildren();

    getForms(getSession().project_definition).forEach(function (form, form_index) {
        const tab = button({
            type: 'button',
            class: 'builder__form-tab',
            role: 'tab',
            'aria-selected': form === current_form ? 'true' : 'false'
        }, [form.name]);

        tab.addEventListener('click', function () {
            selectForm(form_index);
            renderApp(handlers);
        });

        container.append(tab);
    });
}

function renderQuestions() {
    const container = document.getElementById('questions');

    if (!container) {
        return;
    }

    const inputs = getCurrentInputs();
    const current_ref = getSession().current_input_ref;
    const list = element('ul', { class: 'builder__question-list' });

    container.replaceChildren(
        element('div', { class: 'builder__panel-heading' }, [
            element('span', { class: 'builder__panel-title' }, ['Questions']),
            element('span', { class: 'builder__count' }, [String(inputs.length)])
        ]),
        list
    );

    if (!inputs.length) {
        list.append(element('li', { class: 'builder__empty' }, ['No questions in this form yet.']));
        return;
    }

    inputs.forEach(function (input) {
        list.append(buildQuestionRow(input, input.ref === current_ref));
    });
}

function buildQuestionRow(input, is_current) {
    const question_type = getQuestionType(input.type);
    const row = element('li', {
        class: 'builder__question',
        role: 'button',
        tabindex: '0',
        draggable: 'true',
        'data-input-ref': input.ref,
        'aria-current': is_current ? 'true' : 'false'
    }, [
        icon('reorder-three-outline'),
        icon(question_type ? question_type.icon : 'help-outline'),
        element('span', { class: 'builder__question-text' }, [input.question || 'Untitled question'])
    ]);

    row.addEventListener('click', function () {
        chooseInput(input.ref);
    });

    row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            chooseInput(input.ref);
        }
    });

    row.addEventListener('dragstart', function (event) {
        dragged_ref = input.ref;
        row.classList.add('builder__question--dragging');

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', input.ref);
        }
    });

    row.addEventListener('dragend', function () {
        dragged_ref = null;
        row.classList.remove('builder__question--dragging');
        clearDropTargets();
    });

    row.addEventListener('dragover', function (event) {
        if (!dragged_ref || dragged_ref === input.ref) {
            return;
        }

        event.preventDefault();
        row.classList.add('builder__question--over');
    });

    row.addEventListener('dragleave', function () {
        row.classList.remove('builder__question--over');
    });

    row.addEventListener('drop', function (event) {
        event.preventDefault();
        row.classList.remove('builder__question--over');
        reorderBefore(input.ref);
    });

    return row;
}

function reorderBefore(target_ref) {
    const inputs = getCurrentInputs();
    const from_index = inputs.findIndex(function (input) {
        return input.ref === dragged_ref;
    });
    const to_index = inputs.findIndex(function (input) {
        return input.ref === target_ref;
    });

    dragged_ref = null;

    if (!moveInput(from_index, to_index)) {
        return;
    }

    renderQuestions();
    renderProperties();
}

function clearDropTargets() {
    document.querySelectorAll('.builder__question--over').forEach(function (row) {
        row.classList.remove('builder__question--over');
    });
}

function chooseInput(input_ref) {
    selectInput(input_ref);
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

    container.replaceChildren(buildPropertiesHeading(input));

    if (!input) {
        container.append(element('div', { class: 'builder__empty' }, ['Select a question to edit it.']));
        return;
    }

    const question_type = getQuestionType(input.type);
    const body = element('div', { class: 'builder__properties-body' });

    body.append(buildQuestionField(input.question || ''));
    body.append(buildToggle('Required', input.is_required === true, function (checked) {
        updateCurrentInput({ is_required: checked });
    }));
    body.append(buildToggle('Use as entry title', input.is_title === true, function (checked) {
        updateCurrentInput({ is_title: checked });
    }));
    body.append(element('p', { class: 'builder__hint' }, [
        'Type: ' + (question_type ? question_type.label : input.type)
    ]));

    container.append(body);
}

function buildPropertiesHeading(input) {
    const heading = element('div', { class: 'builder__panel-heading' }, [
        element('span', { class: 'builder__panel-title' }, [
            input ? (input.question || 'Untitled question') : 'Question properties'
        ])
    ]);

    if (!input) {
        return heading;
    }

    const delete_button = button({
        type: 'button',
        class: 'builder__delete',
        'aria-label': 'Delete question'
    }, [icon('trash-outline')]);

    delete_button.addEventListener('click', function () {
        removeInput(input.ref);
        renderQuestions();
        renderProperties();
    });

    heading.append(delete_button);

    return heading;
}

function buildQuestionField(value) {
    const field = element('ion-input', {
        class: 'builder__field',
        'aria-label': 'Question text',
        'label-placement': 'stacked',
        fill: 'outline'
    });

    field.label = 'Question';
    field.value = value;

    field.addEventListener('ionInput', function (event) {
        const question = event.detail.value || '';

        updateCurrentInput({ question: question });
        updateQuestionText(question);
    });

    return field;
}

function buildToggle(label, checked, on_change) {
    /* ion-checkbox renders its label from slotted content, not from the
       `label` attribute. */
    const toggle = element('ion-checkbox', {
        justify: 'space-between',
        'label-placement': 'end'
    });

    toggle.append(element('span', {}, [label]));
    toggle.checked = checked;
    toggle.addEventListener('ionChange', function (event) {
        on_change(event.detail.checked);
    });

    return toggle;
}

/*
 * Keeps the selected row and the panel title in step with the edited text
 * without re-rendering the field being typed into.
 */
function updateQuestionText(question) {
    const title = document.querySelector('#properties > .builder__panel-heading .builder__panel-title');
    const row = document.querySelector('.builder__question[aria-current="true"] .builder__question-text');
    const label = question || 'Untitled question';

    if (title) {
        title.textContent = label;
    }

    if (row) {
        row.textContent = label;
    }
}
