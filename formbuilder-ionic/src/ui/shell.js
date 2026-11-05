'use strict';

import { getForms, getInputs, getProject } from '@/models/project-definition.js';
import { getAnswerLimit, isMultipleAnswerType } from '@/models/possible-answers.js';
import {
    allowsRequired,
    allowsTitle,
    allowsUniqueness,
    DATE_FORMATS,
    getDefaultDatetimeFormat,
    hasAdvancedTab,
    hasJumpsTab,
    REGEX_PRESETS,
    TIME_FORMATS
} from '@/models/input-properties.js';

const NUMERIC_TYPES = new Set(['integer', 'decimal']);
import { QUESTION_TYPES, getQuestionType } from '@/models/question-types.js';
import { countTitles } from '@/services/properties.js';
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
let active_property_tab = 'basic';

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

    const forms = getForms(getSession().project_definition);
    const current_index = getSession().current_form_index;
    const segment = element('ion-segment', {
        class: 'builder__forms-segment',
        value: String(current_index),
        scrollable: 'true'
    });

    forms.forEach(function (form, form_index) {
        const is_selected = form_index === current_index;
        const tab = element('ion-segment-button', {
            class: 'builder__form-tab',
            value: String(form_index),
            role: 'tab',
            'aria-selected': is_selected ? 'true' : 'false'
        }, [
            element('ion-label', {}, [form.name])
        ]);

        segment.append(tab);
    });

    const activate_form = function (form_index) {
        if (form_index === getSession().current_form_index) {
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
        const button = event.target.closest('.builder__form-tab');

        if (!button) {
            return;
        }

        activate_form(parseInt(button.getAttribute('value'), 10));
    });

    container.replaceChildren(segment);
}

function renderQuestions() {
    const container = document.getElementById('questions');

    if (!container) {
        return;
    }

    const inputs = getCurrentInputs();
    const current_ref = getSession().current_input_ref;
    const list = element('ul', { class: 'builder__question-list' });

    const form = getCurrentForm();
    const form_name = form && form.name ? form.name : 'Form';
    const card = element('ion-card', { class: 'builder__questions-card' });
    const header = element('ion-card-header', { class: 'builder__panel-heading builder__questions-header' });
    const heading = element('div', { class: 'builder__questions-heading' });
    const title = element('ion-card-title', { class: 'builder__panel-title builder__questions-title', title: 'Form > ' + form_name });
    const content = element('ion-card-content', { class: 'builder__questions-content' });

    title.append(
        element('span', { class: 'builder__questions-title-prefix' }, ['Form']),
        element('span', { class: 'builder__questions-title-sep', 'aria-hidden': 'true' }, [' > ']),
        element('span', { class: 'builder__questions-title-name' }, [form_name])
    );

    heading.append(title, buildFormActions());
    header.append(heading);
    content.append(list);
    card.append(header, content);

    container.replaceChildren(card);

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
    const group = element('div', { class: 'builder__heading-actions builder__answers-btn-group builder__form-actions-group' });

    [
        {
            icon_name: 'trash-outline',
            label: 'Delete form',
            title: 'Deleting a form is not ported yet',
            class_name: 'builder__form-action-btn builder__form-action-btn--delete'
        },
        {
            icon_name: 'create-outline',
            label: 'Edit form name',
            title: 'Renaming a form is not ported yet',
            class_name: 'builder__form-action-btn builder__form-action-btn--edit'
        },
        {
            icon_name: 'chevron-down-outline',
            label: 'Form actions',
            title: 'Form actions are not ported yet',
            class_name: 'builder__form-action-btn builder__form-action-btn--more',
            use_caret: false
        }
    ].forEach(function (config) {
        group.append(iconButton({
            class: 'builder__answers-more-btn ' + config.class_name,
            icon_name: config.icon_name,
            label: config.label,
            title: config.title,
            disabled: true
        }));
    });

    return group;
}

function buildQuestionRow(input, is_current) {
    const question_type = getQuestionType(input.type);
    const row = element('li', {
        class: 'builder__question',
        role: 'button',
        tabindex: '0',
        'data-input-ref': input.ref,
        'aria-current': is_current ? 'true' : 'false',
        'data-valid': isInputRowValid(input) ? 'true' : 'false'
    }, [
        element('span', { class: 'builder__question-type-icon' }, [
            icon(question_type ? question_type.icon : 'help-outline')
        ]),
        element('span', { class: 'builder__question-text', title: getQuestionLabel(input) }, [getQuestionLabel(input)]),
        buildQuestionStatus(input)
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

function isInputRowValid(input) {
    if (!input) {
        return false;
    }

    if (!hasValidQuestionText(input)) {
        return false;
    }

    if (input.type === 'group') {
        return Array.isArray(input.group) && input.group.length > 0;
    }

    if (input.type === 'branch') {
        return Array.isArray(input.branch) && input.branch.length > 0;
    }

    if (isMultipleAnswerType(input.type)) {
        if (!Array.isArray(input.possible_answers) || input.possible_answers.length === 0) {
            return false;
        }

        if (!input.possible_answers.every(isPossibleAnswerRowValid)) {
            return false;
        }
    }

    if (NUMERIC_TYPES.has(input.type) && !hasValidNumericRange(input)) {
        return false;
    }

    if (isDefaultInvalid(input)) {
        return false;
    }

    return true;
}

function hasValidQuestionText(input) {
    const question = input.question === null || input.question === undefined ? '' : String(input.question);

    if (question.trim() === '') {
        return false;
    }

    if (input.type !== 'readme') {
        return true;
    }

    const plain = question.replace(/<[^>]*>/g, '').trim();

    return plain.length > 0 && plain.length <= 1000;
}

function isPossibleAnswerRowValid(possible_answer) {
    return !!(possible_answer && String(possible_answer.answer || '').trim() !== '');
}

function hasValidNumericRange(input) {
    const min = toNumericValue(input.min);
    const max = toNumericValue(input.max);

    if (min !== null && isNaN(min)) {
        return false;
    }

    if (max !== null && isNaN(max)) {
        return false;
    }

    if (min !== null && max !== null && min > max) {
        return false;
    }

    return true;
}

function isDefaultInvalid(input) {
    if (input.default === null || input.default === undefined || String(input.default).trim() === '') {
        return false;
    }

    if (NUMERIC_TYPES.has(input.type)) {
        const value = toNumericValue(input.default);

        if (value === null || isNaN(value)) {
            return true;
        }

        if (input.type === 'integer' && !Number.isInteger(value)) {
            return true;
        }

        const min = toNumericValue(input.min);
        const max = toNumericValue(input.max);

        if (min !== null && !isNaN(min) && value < min) {
            return true;
        }

        if (max !== null && !isNaN(max) && value > max) {
            return true;
        }
    }

    return false;
}

function toNumericValue(value) {
    if (value === null || value === undefined || String(value).trim() === '') {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : NaN;
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

    if (active_readme_editor) {
        active_readme_editor.destroy();
        active_readme_editor = null;
    }

    const previous_body = container.querySelector('.builder__properties-body');
    const previous_scroll = previous_body ? previous_body.scrollTop : 0;
    const card = element('ion-card', { class: 'builder__properties-card' });
    const header = element('ion-card-header', { class: 'builder__panel-heading builder__properties-header' });
    const content = element('ion-card-content', { class: 'builder__properties-content' });

    header.append(buildPropertiesHeading(input));
    card.append(header, content);

    if (!input) {
        active_property_tab = 'basic';
        content.append(element('div', { class: 'builder__empty' }, ['Select a question to edit it.']));
        container.replaceChildren(card);
        return;
    }

    const can_advanced = hasAdvancedTab(input.type);
    const can_jumps = hasJumpsTab(input.type);

    if (active_property_tab === 'advanced' && !can_advanced) {
        active_property_tab = 'basic';
    }

    if (active_property_tab === 'jumps' && !can_jumps) {
        active_property_tab = 'basic';
    }

    content.append(buildPropertyTabs(input, can_advanced, can_jumps));

    const body = element('div', { class: 'builder__properties-body' });
    const view = element('ion-segment-view', {
        class: 'builder__property-view',
        'swipe-gesture': 'false'
    });
    const panes = {
        basic: buildBasicPanel(input),
        advanced: buildAdvancedPanel(input),
        jumps: buildJumpsPanel(input)
    };

    Object.keys(panes).forEach(function (key) {
        const is_active = key === active_property_tab;
        const pane = element('ion-segment-content', {
            id: 'property-content-' + key,
            class: 'builder__property-content' + (is_active ? ' is-active' : '')
        });

        if (!is_active) {
            pane.setAttribute('hidden', 'hidden');
            pane.setAttribute('aria-hidden', 'true');
        }
        else {
            pane.setAttribute('aria-hidden', 'false');
        }

        pane.append(panes[key]);
        view.append(pane);
    });

    body.append(view);
    content.append(body);
    container.replaceChildren(card);

    if (isMultipleAnswerType(input.type)) {
        installAnswersSortable(input);
    }

    body.scrollTop = previous_scroll;
}

function buildPropertyTabs(input, can_advanced, can_jumps) {
    const segment = element('ion-segment', {
        class: 'builder__property-tabs',
        value: active_property_tab
    });

    segment.append(buildPropertyTab('basic', 'Properties', 'property-content-basic', true));
    segment.append(buildPropertyTab('advanced', 'Advanced', 'property-content-advanced', can_advanced));
    segment.append(buildPropertyTab('jumps', 'Jumps', 'property-content-jumps', can_jumps));

    segment.addEventListener('ionChange', function (event) {
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

    setActivePropertyContent(active_property_tab);

    return segment;
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

function buildPropertyTab(value, label, content_id, enabled) {
    const attributes = {
        value: value,
        content_id: content_id
    };

    if (!enabled) {
        attributes.disabled = 'disabled';
    }

    return element('ion-segment-button', attributes, [
        element('ion-label', {}, [label])
    ]);
}

function buildBasicPanel(input) {
    const panel = element('section', { class: 'builder__properties-panel' });

    if (input.type === 'readme') {
        active_readme_editor = createReadmeEditor(input.question || '', function (question, plain_text) {
            if (getSession().current_input_ref !== input.ref) {
                return;
            }

            updateCurrentInput({ question: question });
            updateQuestionText(plain_text);
        });
        panel.append(active_readme_editor.element);

        return panel;
    }

    panel.append(buildQuestionField(input.question || '', getQuestionLabelText(input.type), 255));

    if (allowsRequired(input.type)) {
        panel.append(buildCheckboxToggle('Required', input.is_required === true, function (checked) {
            updateCurrentInput({ is_required: checked });
        }));
    }

    if (allowsTitle(input.type)) {
        panel.append(buildTitleToggle(input));
    }

    if (isMultipleAnswerType(input.type)) {
        panel.append(buildPossibleAnswers(input));
    }

    return panel;
}

function buildAdvancedPanel(input) {
    const panel = element('section', { class: 'builder__properties-panel builder__properties-panel--advanced' });

    if (!hasAdvancedTab(input.type)) {
        panel.append(element('p', { class: 'builder__empty' }, ['No advanced properties for this question type.']));

        return panel;
    }

    if (input.type === 'integer' || input.type === 'decimal') {
        panel.append(buildNumericTypeControl(input));
        panel.append(buildNumberField('Initial answer', input.default, 'default', 255));
        panel.append(buildNumberField('Min value', input.min, 'min', 50));
        panel.append(buildNumberField('Max value', input.max, 'max', 50));
        panel.append(buildRegexField(input));
        panel.append(buildCheckboxToggle('Require double entry', input.verify === true, function (checked) {
            updateCurrentInput({ verify: checked });
        }));
        panel.append(buildUniquenessControl(input));

        return panel;
    }

    if (input.type === 'date' || input.type === 'time') {
        panel.append(buildDatetimeFormatControl(input));
        panel.append(buildCheckboxToggle(
            input.type === 'date' ? 'Set initial answer to current date' : 'Set initial answer to current time',
            input.set_to_current_datetime === true,
            function (checked) {
                updateCurrentInput({ set_to_current_datetime: checked });
            }
        ));
        panel.append(buildUniquenessControl(input));

        return panel;
    }

    if (isMultipleAnswerType(input.type)) {
        panel.append(buildDefaultChoiceControl(input));

        if (input.type === 'searchsingle' || input.type === 'searchmultiple') {
            panel.append(buildSearchTypeControl(input));
        }

        return panel;
    }

    panel.append(buildTextField('Initial answer', input.default, 'default', 255));
    panel.append(buildRegexField(input));

    if (input.type !== 'barcode') {
        panel.append(buildCheckboxToggle('Require double entry', input.verify === true, function (checked) {
            updateCurrentInput({ verify: checked });
        }));
    }

    panel.append(buildUniquenessControl(input));

    return panel;
}

function buildJumpsPanel() {
    return element('section', { class: 'builder__properties-panel' }, [
        element('p', { class: 'builder__empty' }, ['Jumps are not ported yet.'])
    ]);
}

function buildPropertiesHeading(input) {
    const heading = element('div', { class: 'builder__properties-heading' }, [
        element('span', { class: 'builder__panel-title builder__properties-title', title: input ? getQuestionLabel(input) : 'Question properties' }, [
            input ? getQuestionLabel(input) : 'Question properties'
        ])
    ]);

    if (!input) {
        return heading;
    }

    const actions = element('div', { class: 'builder__heading-actions builder__answers-btn-group builder__form-actions-group builder__properties-actions-group' });

    [
        {
            icon_name: 'copy-outline',
            label: 'Copy question',
            title: 'Copy is not ported yet',
            class_name: 'builder__form-action-btn'
        },
        {
            icon_name: 'checkmark-circle-outline',
            label: 'Validate question',
            title: 'Validation is not ported yet',
            class_name: 'builder__form-action-btn'
        }
    ].forEach(function (config) {
        actions.append(iconButton({
            class: 'builder__answers-more-btn ' + config.class_name,
            icon_name: config.icon_name,
            label: config.label,
            title: config.title,
            disabled: true
        }));
    });

    const delete_button = iconButton({
        class: 'builder__answers-more-btn builder__form-action-btn builder__icon-btn--danger',
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

function getQuestionLabelText(type) {
    if (type === 'branch') {
        return 'Header';
    }

    if (type === 'group') {
        return 'Header';
    }

    return 'Question';
}

function buildQuestionField(value, label, maxlength) {
    const field = element('ion-input', {
        class: 'builder__field builder__question-field',
        'aria-label': label || 'Question text',
        'label-placement': 'stacked',
        fill: 'outline',
        maxlength: String(maxlength || 255)
    });

    field.label = label || 'Question';
    field.value = value;
    field.placeholder = label || 'Type question here...';
    field.setAttribute('size', 'small');

    field.addEventListener('ionInput', function (event) {
        const question = sanitizeQuestion(getCurrentInput(), event.detail.value || '');

        if (field.value !== question) {
            field.value = question;
        }

        updateCurrentInput({ question: question });
        updateQuestionText(question);
        updateCurrentQuestionStatus();
    });

    return field;
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

function buildCheckboxToggle(label, checked, on_change, options) {
    const config = options || {};
    const toggle = element('ion-checkbox', {
        class: 'builder__checkbox' + (config.class_name ? ' ' + config.class_name : ''),
        'label-placement': 'end'
    });

    if (config.disabled) {
        toggle.disabled = true;
    }

    toggle.append(element('span', {}, [label]));
    toggle.checked = checked;
    toggle.addEventListener('ionChange', function (event) {
        on_change(event.detail.checked);
    });

    return toggle;
}

function buildTitleToggle(input) {
    const form = getCurrentForm();
    const inputs = getInputs(form);
    const other_titles = countTitles(inputs, input.ref);
    const checked = input.is_title === true;
    const limit_reached = !checked && other_titles >= 3;
    const label = limit_reached ? 'Limit of 3 titles reached' : 'Use answer as title';

    return buildCheckboxToggle(label, checked, function (next_checked) {
        if (next_checked && !input.is_title && countTitles(getInputs(getCurrentForm()), input.ref) >= 3) {
            renderProperties();
            return;
        }

        updateCurrentInput({ is_title: next_checked });
        renderProperties();
    }, { disabled: limit_reached, class_name: 'builder__title-toggle' });
}

function buildTextField(label, value, property, maxlength) {
    const field = element('ion-input', {
        class: 'builder__field',
        'label-placement': 'stacked',
        fill: 'outline',
        maxlength: String(maxlength || 255)
    });

    field.label = label;
    field.value = value || '';
    field.placeholder = label;

    field.addEventListener('ionInput', function (event) {
        const next = {};
        const text = event.detail.value || '';

        next[property] = text === '' ? null : text;
        updateCurrentInput(next);
    });

    return field;
}

function buildNumberField(label, value, property, maxlength) {
    const field = element('ion-input', {
        class: 'builder__field',
        'label-placement': 'stacked',
        fill: 'outline',
        type: 'text',
        inputmode: 'decimal',
        maxlength: String(maxlength || 50)
    });

    field.label = label;
    field.value = value === null || value === undefined ? '' : String(value);
    field.placeholder = label;

    field.addEventListener('ionInput', function (event) {
        const next = {};
        const text = event.detail.value || '';

        next[property] = text === '' ? null : text;
        updateCurrentInput(next);
    });

    return field;
}

function buildRegexField(input) {
    const wrapper = element('div', { class: 'builder__regex-field' });
    const field = element('ion-input', {
        class: 'builder__field',
        'label-placement': 'stacked',
        fill: 'outline',
        maxlength: '50'
    });

    field.label = 'Match REGEX';
    field.value = input.regex || '';

    field.addEventListener('ionInput', function (event) {
        const text = event.detail.value || '';

        updateCurrentInput({ regex: text === '' ? null : text });
    });

    const presets = element('div', { class: 'builder__regex-presets' }, [
        element('span', { class: 'builder__hint' }, ['Presets:'])
    ]);

    REGEX_PRESETS.forEach(function (preset) {
        const preset_button = button({
            type: 'button',
            class: 'builder__preset-btn'
        }, [preset.label]);

        preset_button.addEventListener('click', function () {
            field.value = preset.pattern;
            updateCurrentInput({ regex: preset.pattern });
        });

        presets.append(preset_button);
    });

    wrapper.append(field, presets);

    return wrapper;
}

function buildNumericTypeControl(input) {
    const current = input.type === 'decimal' ? 'decimal' : 'integer';
    const group = element('ion-radio-group', {
        class: 'builder__radio-group',
        value: current
    });

    group.append(buildRadioOption('integer', 'Integer'));
    group.append(buildRadioOption('decimal', 'Decimal'));
    group.addEventListener('ionChange', function (event) {
        const next_type = event.detail.value;

        if (next_type !== 'integer' && next_type !== 'decimal') {
            return;
        }

        updateCurrentInput({ type: next_type });
        renderQuestions();
        renderProperties();
    });

    return buildLabeledSection('Number type', group);
}

function buildSearchTypeControl(input) {
    const group = element('ion-radio-group', {
        class: 'builder__radio-group',
        value: input.type
    });

    group.append(buildRadioOption('searchsingle', 'Single answer'));
    group.append(buildRadioOption('searchmultiple', 'Multiple answers'));
    group.addEventListener('ionChange', function (event) {
        const next_type = event.detail.value;

        if (next_type !== 'searchsingle' && next_type !== 'searchmultiple') {
            return;
        }

        updateCurrentInput({ type: next_type });
        renderQuestions();
        renderProperties();
    });

    return buildLabeledSection('Search type', group);
}

function buildDatetimeFormatControl(input) {
    const formats = input.type === 'time' ? TIME_FORMATS : DATE_FORMATS;
    const current = input.datetime_format || getDefaultDatetimeFormat(input.type) || formats[0].value;
    const group = element('ion-radio-group', {
        class: 'builder__radio-group',
        value: current
    });

    formats.forEach(function (format) {
        group.append(buildRadioOption(format.value, format.label));
    });

    group.addEventListener('ionChange', function (event) {
        updateCurrentInput({ datetime_format: event.detail.value });
    });

    return buildLabeledSection(input.type === 'time' ? 'Time format' : 'Date format', group);
}

function buildRadioOption(value, label) {
    const radio = element('ion-radio', { value: value, 'label-placement': 'end' });

    radio.append(element('span', {}, [label]));

    return radio;
}

function buildLabeledSection(label, content) {
    return element('div', { class: 'builder__field-group' }, [
        element('div', { class: 'builder__field-label' }, [label]),
        content
    ]);
}

function buildDefaultChoiceControl(input) {
    const select = element('ion-select', {
        class: 'builder__select',
        'label-placement': 'stacked',
        interface: 'popover',
        placeholder: 'None'
    });
    const has_default = (input.possible_answers || []).some(function (answer) {
        return answer.answer_ref === input.default;
    });

    select.label = 'Initial answer';
    select.value = has_default ? input.default : '';
    select.append(buildSelectOption('', 'None'));

    (input.possible_answers || []).forEach(function (answer) {
        select.append(buildSelectOption(answer.answer_ref, answer.answer || 'Untitled answer'));
    });

    select.addEventListener('ionChange', function (event) {
        const value = event.detail.value;

        updateCurrentInput({ default: value ? value : null });
    });

    return select;
}

function buildSelectOption(value, label) {
    const option = element('ion-select-option', { value: value });

    option.textContent = label;

    return option;
}

function buildUniquenessControl(input) {
    if (!allowsUniqueness(input.type)) {
        return element('div');
    }

    const form = getCurrentForm();
    const form_name = form ? form.name : 'this form';
    const select = element('ion-select', {
        class: 'builder__select',
        'label-placement': 'stacked',
        interface: 'popover'
    });

    select.label = 'Uniqueness';
    select.value = input.uniqueness || 'none';
    select.append(buildSelectOption('none', 'No uniqueness'));
    select.append(buildSelectOption('form', 'Unique to all ' + form_name + ' entries'));

    select.addEventListener('ionChange', function (event) {
        updateCurrentInput({ uniqueness: event.detail.value || 'none' });
    });

    return select;
}

function buildPossibleAnswers(input) {
    const answers = input.possible_answers;
    const card = element('ion-card', { class: 'builder__answers-card' });
    const header = element('ion-card-header', { class: 'builder__answers-header' });
    const heading = element('div', { class: 'builder__answers-heading' });
    const actions = buildAnswersActions(input);
    const content = element('ion-card-content', { class: 'builder__answers-content' });
    const list = element('ul', { class: 'builder__answer-list' });

    heading.append(element('ion-card-title', { class: 'builder__answers-title' }, ['Possible answers']));
    heading.append(actions);
    header.append(heading);

    answers.forEach(function (answer, index) {
        list.append(buildAnswerRow(input, answer, index, answers.length));
    });

    content.append(list);
    card.append(header, content);

    return card;
}

function buildAnswersActions(input) {
    const group = element('div', { class: 'builder__answers-btn-group' });
    const add_button = buildAddAnswerButton(input);
    const menu = element('div', { class: 'builder__answers-menu' });
    const toggle = button({
        type: 'button',
        class: 'builder__answers-more-btn',
        'aria-label': 'More possible answer actions',
        'aria-haspopup': 'true',
        'aria-expanded': 'false'
    }, [icon('chevron-down-outline')]);
    const dropdown = element('div', { class: 'builder__answers-dropdown', hidden: 'hidden' });

    add_button.classList.add('builder__answers-add-btn');

    [
        'Import CSV',
        'Export CSV',
        '---',
        'Order ascending',
        'Order descending',
        'Shuffle',
        '---',
        'Delete all answers'
    ].forEach(function (label) {
        if (label === '---') {
            dropdown.append(element('div', { class: 'builder__answers-dropdown-divider' }));
            return;
        }

        const item = button({
            type: 'button',
            class: 'builder__answers-dropdown-item',
            disabled: 'disabled'
        }, [label]);

        dropdown.append(item);
    });

    toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        const open = dropdown.hasAttribute('hidden');

        closeAnswersMenus();

        if (open) {
            dropdown.removeAttribute('hidden');
            toggle.setAttribute('aria-expanded', 'true');
        }
    });

    menu.append(toggle, dropdown);
    group.append(add_button, menu);

    return group;
}

function closeAnswersMenus() {
    document.querySelectorAll('.builder__answers-dropdown:not([hidden])').forEach(function (node) {
        node.setAttribute('hidden', 'hidden');
    });
    document.querySelectorAll('.builder__answers-more-btn[aria-expanded="true"]').forEach(function (node) {
        node.setAttribute('aria-expanded', 'false');
    });
}

if (!document.__answers_menu_close_bound) {
    document.__answers_menu_close_bound = true;
    document.addEventListener('click', closeAnswersMenus);
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
    const replacement = buildQuestionStatus(input);

    if (status) {
        status.replaceWith(replacement);
    }
    else {
        row.append(replacement);
    }
}
