'use strict';

import { getForms, getInputs, getProject } from '@/models/project-definition.js';
import { getAnswerLimit, isMultipleAnswerType } from '@/models/possible-answers.js';
import {
    allowsRequired,
    allowsTitle,
    getDefaultDatetimeFormat,
    hasAdvancedTab,
    hasJumpsTab,
    REGEX_PRESETS
} from '@/models/input-properties.js';

const NUMERIC_TYPES = new Set(['integer', 'decimal']);
import { getQuestionType } from '@/models/question-types.js';
import { countTitles, getAdvancedFields } from '@/services/properties.js';
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
import { button, createView, element, icon, parseView } from '@/ui/dom.js';
import { createReadmeEditor } from '@/ui/readme-editor.js';
import { installAnswerSortable, installQuestionSortable, installToolDrag } from '@/ui/sortable.js';
import tools_view from '@/views/tools.html?raw';
import question_card_view from '@/views/question-card.html?raw';
import properties_card_view from '@/views/properties-card.html?raw';
import possible_answers_view from '@/views/possible-answers-card.html?raw';

const QUESTION_LIST = '#questions .builder__question-list';
const TITLE_LIMIT = 3;

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

/* The tool catalogue is static markup; only the click and drag wiring changes. */
function renderTools() {
    const container = document.getElementById('tools');

    if (!container) {
        return;
    }

    container.replaceChildren(parseView(tools_view));

    container.querySelectorAll('.builder__tool').forEach(function (tool) {
        tool.onclick = function () {
            addQuestion(tool.getAttribute('data-type'));
        };
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

    const segment = container.querySelector('.builder__forms-segment');

    if (!segment) {
        return;
    }

    const forms = getForms(getSession().project_definition);
    const current_index = getSession().current_form_index;

    segment.replaceChildren();
    segment.setAttribute('value', String(current_index));
    segment.value = String(current_index);

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

    bindFormSegment(segment);
}

/* The segment lives in the page shell, so its listeners are bound once. */
function bindFormSegment(segment) {
    if (segment.__form_tabs_bound === true) {
        return;
    }

    segment.__form_tabs_bound = true;

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
    const card = createView(question_card_view);
    const title = card.querySelector('.builder__questions-title');
    const title_name = card.querySelector('.builder__questions-title-name');
    const list = card.querySelector('.builder__question-list');
    const empty = card.querySelector('.builder__empty');

    title.setAttribute('title', 'Form > ' + form_name);
    title_name.textContent = form_name;

    if (inputs.length) {
        empty.remove();

        inputs.forEach(function (input) {
            list.append(buildQuestionRow(input, input.ref === current_ref));
        });
    }

    container.replaceChildren(card);

    installQuestionSortable(QUESTION_LIST, syncAfterDrop);
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
    bindPropertyActions(card, input);

    if (active_property_tab === 'advanced' && !hasAdvancedTab(input.type)) {
        active_property_tab = 'basic';
    }

    if (active_property_tab === 'jumps' && !hasJumpsTab(input.type)) {
        active_property_tab = 'basic';
    }

    bindPropertyTabs(tab_strip, input);
    buildBasicPanel(input, card.querySelector('#property-content-basic'));
    buildAdvancedPanel(input, card.querySelector('#property-content-advanced'));

    tab_strip.value = active_property_tab;
    container.replaceChildren(card);

    setActivePropertyContent(active_property_tab);

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
    const delete_button = card.querySelector('.builder__icon-btn--danger');

    delete_button.addEventListener('click', function () {
        removeInput(input.ref);
        renderQuestions();
        renderProperties();
    });
}

function bindPropertyTabs(tab_strip, input) {
    const advanced_tab = tab_strip.querySelector('[value="advanced"]');
    const jumps_tab = tab_strip.querySelector('[value="jumps"]');

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
    field.placeholder = label;
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
    });
}

function bindTitleToggle(toggle, input) {
    const form = getCurrentForm();
    const inputs = getInputs(form);
    const other_titles = countTitles(inputs, input.ref);
    const checked = input.is_title === true;
    const limit_reached = !checked && other_titles >= TITLE_LIMIT;
    const label = toggle.querySelector('.builder__title-label');

    label.textContent = limit_reached ? 'Limit of ' + TITLE_LIMIT + ' titles reached' : 'Use answer as title';

    bindCheckboxToggle(toggle, checked, function (next_checked) {
        if (next_checked && !input.is_title && countTitles(getInputs(getCurrentForm()), input.ref) >= TITLE_LIMIT) {
            renderProperties();
            return;
        }

        updateCurrentInput({ is_title: next_checked });
        renderProperties();
    }, { disabled: limit_reached });
}

function bindTextField(field, value, property) {
    field.value = value || '';

    field.addEventListener('ionInput', function (event) {
        const next = {};
        const text = event.detail.value || '';

        next[property] = text === '' ? null : text;
        updateCurrentInput(next);
    });
}

function bindNumberField(field, value, property) {
    field.value = value === null || value === undefined ? '' : String(value);

    field.addEventListener('ionInput', function (event) {
        const next = {};
        const text = event.detail.value || '';

        next[property] = text === '' ? null : text;
        updateCurrentInput(next);
    });
}

function bindRegexField(wrapper, input) {
    const field = wrapper.querySelector('ion-input');

    field.value = input.regex || '';

    field.addEventListener('ionInput', function (event) {
        const text = event.detail.value || '';

        updateCurrentInput({ regex: text === '' ? null : text });
    });

    wrapper.querySelectorAll('.builder__preset-btn').forEach(function (preset_button) {
        const preset = REGEX_PRESETS.find(function (candidate) {
            return candidate.key === preset_button.getAttribute('data-preset');
        });

        preset_button.addEventListener('click', function () {
            field.value = preset.pattern;
            updateCurrentInput({ regex: preset.pattern });
        });
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

function bindDefaultChoiceControl(select, input) {
    const has_default = (input.possible_answers || []).some(function (answer) {
        return answer.answer_ref === input.default;
    });

    select.value = has_default ? input.default : '';
    select.append(buildSelectOption('', 'None'));

    (input.possible_answers || []).forEach(function (answer) {
        select.append(buildSelectOption(answer.answer_ref, answer.answer || 'Untitled answer'));
    });

    select.addEventListener('ionChange', function (event) {
        const value = event.detail.value;

        updateCurrentInput({ default: value ? value : null });
    });
}

function buildSelectOption(value, label) {
    const option = element('ion-select-option', { value: value });

    option.textContent = label;

    return option;
}

function bindUniquenessControl(select, input) {
    const form = getCurrentForm();
    const form_name = form ? form.name : 'this form';
    const scoped_option = select.querySelector('ion-select-option[value="form"]');

    scoped_option.textContent = 'Unique to all ' + form_name + ' entries';
    select.value = input.uniqueness || 'none';

    select.addEventListener('ionChange', function (event) {
        updateCurrentInput({ uniqueness: event.detail.value || 'none' });
    });
}

function buildPossibleAnswers(input) {
    const answers = input.possible_answers;
    const card = createView(possible_answers_view);
    const list = card.querySelector('.builder__answer-list');
    const add_button = card.querySelector('.builder__add-answer');
    const at_limit = answers.length >= getAnswerLimit(input.type);

    answers.forEach(function (answer, index) {
        list.append(buildAnswerRow(input, answer, index, answers.length));
    });

    add_button.disabled = at_limit;
    add_button.addEventListener('click', function () {
        if (addPossibleAnswer(input)) {
            renderProperties();
        }
    });

    return card;
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
