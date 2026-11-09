'use strict';

import {PARAMETERS} from '@/config/parameters.js';
import {
    allowsRequired,
    allowsTitle,
    getDefaultDatetimeFormat,
    isBranchOrGroup
} from '@/models/input-properties.js';
import {isMultipleAnswerType} from '@/models/possible-answers.js';
import {countTitles, getAdvancedFields} from '@/services/properties.js';
import {
    enterInput,
    getCurrentForm,
    getCurrentInputs,
    getEditingTrail,
    getSession,
    updateCurrentInput
} from '@/services/session.js';
import {createReadmeEditor} from '@/ui/readme-editor.js';
import {element} from '@/ui/dom.js';
import {initDropdown} from '@/ui/dropdown.js';
import {
    getActiveReadmeEditor,
    getHandlers,
    recordChange,
    setActivePropertyTab,
    setActiveReadmeEditor
} from '@/ui/state.js';
import {
    renderApp,
    renderQuestions,
    renderProperties,
    updateQuestionText,
    bindQuestionField,
    getQuestionLabelText,
    updateCurrentQuestionStatus,
    refreshCurrentProperties
} from '@/ui/shell.js';
import {buildPossibleAnswers} from '@/ui/possible-answers.js';

const DOUBLE_ENTRY_VERIFICATION_TYPES = ['text', 'phone'];

export const buildBasicPanel = (input, pane) => {
    const panel = pane.querySelector('.builder__properties-panel');
    const question_group = panel.querySelector('.builder__question-field-group');
    const question_field = panel.querySelector('.builder__question-field');
    const question_label = panel.querySelector('[data-role="question-label"]');
    const required_toggle = panel.querySelector('[data-field="required"]');
    const title_row = panel.querySelector('[data-field="title"]');
    const edit_container_grid = panel.querySelector('[data-role="edit-container-grid"]');
    const edit_container = panel.querySelector('[data-role="edit-container"]');

    if (input.type === 'readme') {
        question_group.remove();
        required_toggle.remove();
        title_row.remove();
        edit_container_grid.remove();

        const editor = createReadmeEditor(input.question || '', (question, plain_text) => {
            if (getSession().current_input_ref !== input.ref) {
                return;
            }

            updateCurrentInput({question});
            updateQuestionText(plain_text);
            recordChange({throttle: true});
        });

        setActiveReadmeEditor(editor);
        panel.append(editor.element);

        return;
    }

    question_label.textContent = getQuestionLabelText(input.type);
    bindQuestionField(question_field, input);

    if (allowsRequired(input.type)) {
        bindCheckboxToggle(required_toggle, input.is_required === true, (checked) => {
            updateCurrentInput({is_required: checked});
        });
    } else {
        required_toggle.remove();
    }

    if (allowsTitle(input.type)) {
        bindTitleToggle(title_row, input);
    } else {
        title_row.remove();
    }

    if (isBranchOrGroup(input.type)) {
        edit_container.hidden = false;
        edit_container.querySelector('[data-role="edit-container-label"]').textContent =
            input.type === 'branch' ? 'Edit Branch' : 'Edit Group';
        edit_container.disabled = String(input.question || '').trim() === '';
        edit_container.onclick = () => {
            enterInput(input.ref);
            setActivePropertyTab('basic');
            renderApp(getHandlers());
        };
    } else {
        //the button lives in the first third of the grid, remove the whole grid
        edit_container_grid.remove();
    }

    if (isMultipleAnswerType(input.type)) {
        panel.append(buildPossibleAnswers(input));
    }
};

export const buildAdvancedPanel = (input, pane) => {
    const panel = pane.querySelector('.builder__properties-panel');
    const empty = panel.querySelector('[data-role="advanced-empty"]');
    const fields = getAdvancedFields(input.type);

    panel.querySelectorAll('[data-field]').forEach((field) => {
        if (fields.indexOf(field.getAttribute('data-field')) === -1) {
            // The external field label lives in a .builder__field-group wrapper,
            // so remove the whole group or the label would be left behind.
            const group = field.closest('.builder__field-group');
            (group || field).remove();
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
            updateCurrentInput({verify: checked});
        });
    }

    if (fields.indexOf('datetime_format') !== -1) {
        // Imported date/time questions can arrive with a null format; legacy
        // checks its default radio, so the definition must carry it too.
        if (!input.datetime_format) {
            updateCurrentInput({datetime_format: getDefaultDatetimeFormat(input.type)});
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

export const bindCheckboxToggle = (toggle, checked, on_change, options) => {
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

/* Syncs the no-title well in the question column with the active list: visible
   only when the active list (form inputs or the drilled-in container) holds
   questions but no title. Called after a change that cannot re-render
   (the title toggle skips renderApp to keep focus and scroll position). */
export const refreshTitleWarning = () => {
    const questions = document.getElementById('questions');

    if (!questions) {
        return;
    }

    const warning = questions.querySelector('[data-role="title-warning"]');

    if (!warning) {
        return;
    }

    const trail = getEditingTrail();
    const active_container = trail.length ? trail[trail.length - 1] : null;
    const branch_active = active_container && active_container.type === 'branch';
    const inputs = getCurrentInputs();
    const show = inputs.length > 0 && countTitles(inputs) === 0;

    warning.hidden = !show;

    if (show) {
        warning.querySelector('[data-role="title-warning-text"]').textContent =
            branch_active ? 'No title set for this branch yet' :
                (active_container ? 'No title set for this group yet' : 'No title set for this form yet');
    }
};

export const bindTitleToggle = (row, input) => {
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
        // The title well lives in the question column, so sync it directly.
        updateCurrentInput({is_title: next_checked});
        refreshTitleWarning();
    }, {disabled: limit_reached});
};

export const bindTextField = (field, value, property) => {
    field.setAttribute('maxlength', String(PARAMETERS.QUESTION_MAX_LENGTH));
    field.value = value || '';
    field.placeholder = '';
    field.setAttribute('placeholder', '');

    field.addEventListener('ionInput', (event) => {
        const next = {};
        const text = event.detail.value || '';

        next[property] = text === '' ? null : text;
        updateCurrentInput(next);
        recordChange({throttle: true});
    });
};

export const bindNumberField = (field, value, property) => {
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
        updateCurrentQuestionStatus();
        refreshCurrentProperties();
        recordChange({throttle: true});
    });
};

export const bindRegexField = (wrapper, input) => {
    const field = wrapper.querySelector('ion-input');

    field.setAttribute('maxlength', String(PARAMETERS.REGEX_MAX_LENGTH));
    field.value = input.regex || '';
    field.placeholder = '';
    field.setAttribute('placeholder', '');

    field.addEventListener('ionInput', (event) => {
        const text = event.detail.value || '';

        updateCurrentInput({regex: text === '' ? null : text});
        updateCurrentQuestionStatus();
        refreshCurrentProperties();
        recordChange({throttle: true});
    });

};

export const bindNumericTypeControl = (field_group, input) => {
    const current = input.type === 'decimal' ? 'decimal' : 'integer';
    const group = field_group.querySelector('ion-radio-group');

    group.value = current;
    group.addEventListener('ionChange', (event) => {
        const next_type = event.detail.value;

        if (next_type !== 'integer' && next_type !== 'decimal') {
            return;
        }

        updateCurrentInput({type: next_type});
        recordChange();
        renderQuestions();
        renderProperties();
    });
};

export const bindSearchTypeControl = (field_group, input) => {
    const group = field_group.querySelector('ion-radio-group');

    group.value = input.type;
    group.addEventListener('ionChange', (event) => {
        const next_type = event.detail.value;

        if (next_type !== 'searchsingle' && next_type !== 'searchmultiple') {
            return;
        }

        updateCurrentInput({type: next_type});
        recordChange();
        renderQuestions();
        renderProperties();
    });
};

export const bindDatetimeFormatControl = (field_group, input) => {
    const label = field_group.querySelector('.builder__field-label');

    label.textContent = input.type === 'time' ? 'Time format' : 'Date format';

    field_group.querySelectorAll('ion-radio-group').forEach((group) => {
        if (group.getAttribute('data-datetime-type') !== input.type) {
            group.remove();
            return;
        }

        group.value = input.datetime_format || getDefaultDatetimeFormat(input.type);
        group.addEventListener('ionChange', (event) => {
            updateCurrentInput({datetime_format: event.detail.value});
            recordChange();
        });
    });
};

export const bindCurrentDatetimeToggle = (toggle, input) => {
    const label = toggle.querySelector('[data-role="datetime-label"]');

    label.textContent = input.type === 'date' ?
        'Set initial answer to current date' :
        'Set initial answer to current time';

    bindCheckboxToggle(toggle, input.set_to_current_datetime === true, (checked) => {
        updateCurrentInput({set_to_current_datetime: checked});
    });
};

export const bindDefaultChoiceControl = (control, input) => {
    if (!control) {
        return;
    }

    const options = [{value: '', label: 'None'}, ...(input.possible_answers || []).map((answer) => {
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
            updateCurrentInput({default: detail.value ? detail.value : null});
            recordChange();
        }, false);
        return;
    }

    control.replaceChildren();
    options.forEach((option_data) => {
        control.append(element('ion-select-option', {value: option_data.value}, [option_data.label]));
    });
    control.value = value;
    control.addEventListener('ionChange', (event) => {
        const next = event.detail.value;
        updateCurrentInput({default: next ? next : null});
        recordChange();
    });
};

export const bindUniquenessControl = (control, input) => {
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

    const options = [{value: 'none', label: 'No uniqueness'}];

    if (is_editing_branch) {
        // Legacy branch uniqueness: contract value is 'form', label is branch-scoped.
        options.push({
            value: 'form',
            label: `Make answer unique to all ${branch_header} entries of a ${form_name} entry`
        });
    } else if (form_index > 0) {
        const parent_name = forms[form_index - 1] ? forms[form_index - 1].name : 'parent form';
        options.push({value: 'form', label: `All ${form_name} entries`});
        options.push({value: 'hierarchy', label: `Only ${form_name} children of a ${parent_name} parent entry`});
    } else {
        options.push({value: 'form', label: `Make answer unique to all ${form_name} entries`});
    }

    const value = options.some((option) => {
        return option.value === (input.uniqueness || 'none');
    }) ?
        (input.uniqueness || 'none') : 'none';

    const dropdown_control = (typeof control.setOptions === 'function' || control.hasAttribute('data-dropdown')) ?
        control :
        control.querySelector('[data-dropdown], .dropdown');

    if (dropdown_control) {
        const dropdown = initDropdown(dropdown_control, options, value, (detail) => {
            updateCurrentInput({uniqueness: detail.value || 'none'});
            recordChange();
        }, false);

        if (dropdown) {
            dropdown.setOptions(options, value);
        }
        return;
    }

    control.replaceChildren();
    options.forEach((option_data) => {
        control.append(element('ion-select-option', {value: option_data.value}, [option_data.label]));
    });
    control.value = value;
    control.addEventListener('ionChange', (event) => {
        updateCurrentInput({uniqueness: event.detail.value || 'none'});
        recordChange();
    });
};
