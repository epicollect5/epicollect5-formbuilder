'use strict';

import {PARAMETERS} from '@/config/parameters.js';
import {getForms, getInputs} from '@/models/project-definition.js';
import {areFormInputsValid} from '@/services/validation.js';
import {countInputs} from '@/models/project-limits.js';
import {getCurrentForm, getSession, isEditing, selectForm} from '@/services/session.js';
import {element} from '@/ui/dom.js';
import {
    getHandlers,
    getActivePropertyTab,
    setActivePropertyTab
} from '@/ui/state.js';
import {renderApp} from '@/ui/shell.js';

export const renderForms = () => {
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

    // Every tab keeps its name; CSS gives each an equal share of the strip and
    // ellipsises the name when space runs out (five forms maximum).
    forms.forEach((form, form_index) => {
        const is_selected = form_index === current_index;
        const tab = element('ion-segment-button', {
            class: 'builder__form-tab',
            value: String(form_index),
            role: 'tab',
            'aria-selected': is_selected ? 'true' : 'false',
            title: form.name
        }, [buildFormTabLabel(form)]);

        segment.append(tab);
    });

    bindFormSegment(segment);
};

const buildFormTabLabel = (form) => {
    // Each tab carries its live question count on the left of the name.
    const label = element('ion-label', {}, [
        element('ion-badge', {
            class: 'builder__question-count-badge',
            title: 'Questions in this form'
        }, [String(countInputs(getInputs(form)))]),
        element('span', {class: 'builder__form-tab-name'}, [form.name])
    ]);

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
        setActivePropertyTab('basic');
        renderApp(getHandlers());
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

export const refreshFormTabs = (only_index) => {
    const forms = getForms(getSession().project_definition);
    const tabs = document.querySelectorAll('#form-tabs .builder__form-tab');

    tabs.forEach((tab, index) => {
        const form = forms[index];
        const label = tab.querySelector('ion-label');

        if (!form || !label) {
            return;
        }

        // a keystroke can only change the active form; the others are untouched
        if (only_index !== undefined && only_index !== index) {
            return;
        }

        const invalid = !areFormInputsValid(form);
        const warning = label.querySelector('.builder__form-tab-state');

        // the tab's question count follows the edits live
        const count = label.querySelector('.builder__question-count-badge');

        if (count) {
            count.textContent = String(countInputs(getInputs(form)));
        }

        if (invalid && !warning) {
            label.append(element('ion-icon', {
                class: 'builder__form-tab-state',
                name: 'warning',
                'aria-label': 'Form has validation errors'
            }));
        } else if (!invalid && warning) {
            warning.remove();
        }
    });
};

/* The menu popover survives between renders; its export and print gates
   follow the form's validity the way the save button does. */
export const refreshFormMenuGates = () => {
    const form = getCurrentForm();
    const valid = form ? areFormInputsValid(form) : false;

    document.querySelectorAll('#questions [data-action="form-export"], #questions [data-action="form-print"]').forEach((control) => {
        control.disabled = !valid;
    });
};
