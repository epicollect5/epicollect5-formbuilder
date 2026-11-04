'use strict';

import { getForms, getProject } from '@/models/project-definition.js';
import { getAnswerLimit, isMultipleAnswerType } from '@/models/possible-answers.js';
import { QUESTION_TYPES, getQuestionType } from '@/models/question-types.js';
import {
    addPossibleAnswer,
    removePossibleAnswer,
    renamePossibleAnswer,
    reorderPossibleAnswers
} from '@/services/possible-answers.js';
import { goBack } from '@/services/navigation.js';
import {
    addForm,
    addInput,
    getCurrentForm,
    getCurrentInput,
    getCurrentInputs,
    getSession,
    insertInput,
    removeInput,
    reorderInputs,
    selectForm,
    selectInput,
    updateCurrentInput
} from '@/services/session.js';
import { button, element, icon } from '@/ui/dom.js';
import { createReadmeEditor } from '@/ui/readme-editor.js';
import { installAnswerSortable, installQuestionSortable, installToolDrag } from '@/ui/sortable.js';

const QUESTION_LIST = '#questions .builder__question-list';

let handlers = {};
let active_readme_editor = null;

export function renderApp(app_handlers) {
    handlers = app_handlers || {};

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
    const container = document.getElementById('project-name');
    const logo = document.getElementById('project-logo');

    if (container) {
        const label = container.querySelector('.builder-bar__project-name');

        if (label) {
            label.textContent = project ? project.name : '';
        }
        else {
            container.textContent = project ? project.name : '';
        }
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

    const add_form = document.getElementById('add-form');

    if (add_form) {
        add_form.onclick = function () {
            addForm();
            renderApp(handlers);
        };
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

    installToolDrag('#tools .builder__tool', QUESTION_LIST, function (type, index) {
        insertInput(type, index);
        renderQuestions();
        renderProperties();
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
            element('span', { class: 'builder__count' }, [String(inputs.length)]),
            buildFormActions()
        ]),
        list
    );

    if (!inputs.length) {
        list.append(element('li', { class: 'builder__empty' }, ['No questions in this form yet.']));
    }
    else {
        inputs.forEach(function (input) {
            list.append(buildQuestionRow(input, input.ref === current_ref));
        });
    }

    installQuestionSortable(QUESTION_LIST, syncAfterDrop);
}

/* Legacy form-level actions: remove form, edit form name, more. */
function buildFormActions() {
    return element('div', { class: 'builder__heading-actions' }, [
        iconButton({
            class: 'builder__icon-btn',
            icon_name: 'trash-outline',
            label: 'Delete form',
            title: 'Deleting a form is not ported yet',
            disabled: true
        }),
        iconButton({
            class: 'builder__icon-btn',
            icon_name: 'create-outline',
            label: 'Edit form name',
            title: 'Renaming a form is not ported yet',
            disabled: true
        }),
        iconButton({
            class: 'builder__icon-btn',
            icon_name: 'ellipsis-horizontal',
            label: 'Form actions',
            title: 'Form actions are not ported yet',
            disabled: true
        })
    ]);
}

function buildQuestionRow(input, is_current) {
    const question_type = getQuestionType(input.type);
    const row = element('li', {
        class: 'builder__question',
        role: 'button',
        tabindex: '0',
        'data-input-ref': input.ref,
        'aria-current': is_current ? 'true' : 'false'
    }, [
        icon(question_type ? question_type.icon : 'help-outline'),
        element('span', { class: 'builder__question-text' }, [getQuestionLabel(input)])
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

    return row;
}

/* Persists the order the sortable left in the DOM. */
function syncAfterDrop() {
    const list = document.querySelector(QUESTION_LIST);

    if (!list) {
        return;
    }

    reorderInputs([...list.querySelectorAll('.builder__question')].map(function (row) {
        return row.getAttribute('data-input-ref');
    }));

    // jQuery UI is still unwinding its own drop when stop fires, so the
    // re-render waits for the next task.
    setTimeout(function () {
        renderQuestions();
        renderProperties();
    }, 0);
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

    if (active_readme_editor) {
        active_readme_editor.destroy();
        active_readme_editor = null;
    }

    const previous_body = container.querySelector('.builder__properties-body');
    const previous_scroll = previous_body ? previous_body.scrollTop : 0;

    container.replaceChildren(buildPropertiesHeading(input));

    if (!input) {
        container.append(element('div', { class: 'builder__empty' }, ['Select a question to edit it.']));
        return;
    }

    const question_type = getQuestionType(input.type);
    const body = element('div', { class: 'builder__properties-body' });

    if (input.type === 'readme') {
        active_readme_editor = createReadmeEditor(input.question || '', function (question, plain_text) {
            if (getSession().current_input_ref !== input.ref) {
                return;
            }

            updateCurrentInput({ question: question });
            updateQuestionText(plain_text);
        });
        body.append(active_readme_editor.element);
    }
    else {
        body.append(buildQuestionField(input.question || ''));
        body.append(buildToggle('Required', input.is_required === true, function (checked) {
            updateCurrentInput({ is_required: checked });
        }));
        body.append(buildToggle('Use as entry title', input.is_title === true, function (checked) {
            updateCurrentInput({ is_title: checked });
        }));
    }
    body.append(element('p', { class: 'builder__hint' }, [
        'Type: ' + (question_type ? question_type.label : input.type)
    ]));

    if (isMultipleAnswerType(input.type)) {
        body.append(buildPossibleAnswers(input));
    }

    container.append(body);

    if (isMultipleAnswerType(input.type)) {
        installAnswersSortable(input);
    }

    body.scrollTop = previous_scroll;
}

function buildPropertiesHeading(input) {
    const heading = element('div', { class: 'builder__panel-heading' }, [
        element('span', { class: 'builder__panel-title' }, [
            input ? getQuestionLabel(input) : 'Question properties'
        ])
    ]);
    const actions = element('div', { class: 'builder__heading-actions' });

    if (!input) {
        return heading;
    }

    actions.append(iconButton({
        class: 'builder__icon-btn',
        icon_name: 'copy-outline',
        label: 'Copy question',
        title: 'Copy is not ported yet',
        disabled: true
    }));
    actions.append(iconButton({
        class: 'builder__icon-btn',
        icon_name: 'checkmark-circle-outline',
        label: 'Validate question',
        title: 'Validation is not ported yet',
        disabled: true
    }));

    const delete_button = iconButton({
        class: 'builder__icon-btn builder__icon-btn--danger',
        icon_name: 'trash-outline',
        label: 'Delete question'
    });

    delete_button.addEventListener('click', function () {
        removeInput(input.ref);
        renderQuestions();
        renderProperties();
    });

    actions.append(delete_button);
    heading.append(actions);

    return heading;
}

function iconButton(options) {
    const attributes = {
        type: 'button',
        class: options.class,
        'aria-label': options.label,
        title: options.title || options.label
    };

    if (options.disabled) {
        attributes.disabled = 'disabled';
    }

    return button(attributes, [icon(options.icon_name)]);
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

function buildPossibleAnswers(input) {
    const answers = input.possible_answers;
    const section = element('section', { class: 'builder__answers' }, [
        element('div', { class: 'builder__answers-head' }, [
            element('span', { class: 'builder__answers-title' }, ['Possible answers']),
            element('span', { class: 'builder__count' }, [String(answers.length)])
        ])
    ]);
    const list = element('ul', { class: 'builder__answer-list' });

    answers.forEach(function (answer, index) {
        list.append(buildAnswerRow(input, answer, index, answers.length));
    });

    section.append(list);
    section.append(buildAddAnswerButton(input));

    return section;
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

        if (!reorderPossibleAnswers(input, refs)) {
            return;
        }

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
        fill: 'outline',
        'aria-label': 'Answer ' + (index + 1)
    });

    field.value = answer.answer;
    field.addEventListener('ionInput', function (event) {
        renamePossibleAnswer(input, answer.answer_ref, event.detail.value || '');
    });

    const remove_button = button({
        type: 'button',
        class: 'builder__answer-remove',
        'aria-label': 'Remove answer ' + (index + 1),
        disabled: total === 1 ? 'disabled' : undefined
    }, [icon('close-circle-outline')]);

    remove_button.addEventListener('click', function () {
        if (removePossibleAnswer(input, answer.answer_ref)) {
            renderProperties();
        }
    });

    row.append(icon('reorder-three-outline'));
    row.append(field);
    row.append(remove_button);

    return row;
}

function buildAddAnswerButton(input) {
    const at_limit = input.possible_answers.length >= getAnswerLimit(input.type);
    const add_button = button({
        type: 'button',
        class: 'builder__add-answer',
        disabled: at_limit ? 'disabled' : undefined
    }, ['Add answer']);

    add_button.addEventListener('click', function () {
        if (addPossibleAnswer(input)) {
            renderProperties();
        }
    });

    return add_button;
}

/*
 * Keeps the selected row and the panel title in step with the edited text
 * without re-rendering the field being typed into.
 */
function updateQuestionText(question) {
    const input = getCurrentInput();
    const title = document.querySelector('#properties > .builder__panel-heading .builder__panel-title');
    const row = document.querySelector('.builder__question[aria-current="true"] .builder__question-text');
    const label = question || (input && input.type === 'readme' ? 'Readme' : 'Untitled question');

    if (title) {
        title.textContent = label;
    }

    if (row) {
        row.textContent = label;
    }
}
