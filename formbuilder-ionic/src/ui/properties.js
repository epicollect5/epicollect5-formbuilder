'use strict';

import {FORM_MESSAGES, VALIDATION_MESSAGES} from '@/config/strings.js';
import {
    hasAdvancedTab,
    hasJumpsTab,
    isBranchOrGroup
} from '@/models/input-properties.js';
import {isMultipleAnswerType} from '@/models/possible-answers.js';
import {
    getCurrentInput,
    getCurrentInputs,
    getEditingTrail,
    removeInput
} from '@/services/session.js';
import {duplicateInput} from '@/services/question-actions.js';
import {
    getInputErrors,
    isInputValid,
    PROPERTIES_TAB
} from '@/services/validation.js';
import {createReadmeEditor} from '@/ui/readme-editor.js';
import {createView, element} from '@/ui/dom.js';
import {
    hideLoading,
    notifyError,
    notifySuccess,
    showLoading
} from '@/services/notifications.js';
import properties_card_view from '@/views/properties-card.html?raw';
import {openModal} from '@/ui/modal.js';
import {
    getActivePropertyTab,
    getActiveReadmeEditor,
    getHandlers,
    recordChange,
    setActivePropertyTab,
    setActiveReadmeEditor
} from '@/ui/state.js';
import {
    renderApp,
    renderQuestions,
    getQuestionLabel
} from '@/ui/shell.js';
import {buildBasicPanel, buildAdvancedPanel} from '@/ui/properties-fields.js';
import {buildJumpsPanel} from '@/ui/jumps.js';
import {buildPossibleAnswers, installAnswersSortable} from '@/ui/possible-answers.js';
import {openDeleteQuestion} from '@/ui/form-actions.js';

/* Legacy disables Jumps for anything edited inside a group. */
const canUseJumpsTab = (input) => {
    return hasJumpsTab(input.type) && !isEditingInsideGroup();
};

const isEditingInsideGroup = () => {
    return getEditingTrail().some((node) => {
        return node.type === 'group';
    });
};

export const renderProperties = () => {
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
        setActivePropertyTab('basic');
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

    if (getActivePropertyTab() === 'advanced' && !hasAdvancedTab(input.type)) {
        setActivePropertyTab('basic');
    }

    if (getActivePropertyTab() === 'jumps' && !canUseJumpsTab(input)) {
        setActivePropertyTab('basic');
    }

    // A custom element drops property writes made before it is upgraded, so
    // the card has to be in the document before the panels set control values.
    container.replaceChildren(card);

    bindPropertyActions(card, input);
    bindPropertyTabs(tab_strip, input);
    buildBasicPanel(input, card.querySelector('#property-content-basic'));
    buildAdvancedPanel(input, card.querySelector('#property-content-advanced'));
    buildJumpsPanel(input, card.querySelector('#property-content-jumps'));

    tab_strip.value = getActivePropertyTab();

    setActivePropertyContent(getActivePropertyTab());
    updatePropertyError(card, input);

    if (isMultipleAnswerType(input.type)) {
        installAnswersSortable(input);
    }

    body.scrollTop = previous_scroll;
};

export const destroyReadmeEditor = () => {
    const editor = getActiveReadmeEditor();

    if (editor) {
        editor.destroy();
        setActiveReadmeEditor(null);
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
export const performInputValidation = () => {
    if (!getCurrentInput()) {
        return;
    }

    showLoading();

    // The overlay makes the pass, and the icons it refreshes, visible.
    setTimeout(() => {
        hideLoading();
        renderApp(getHandlers());

        const input = getCurrentInput();
        const valid = input ? isInputValid(input, getCurrentInputs()) : false;

        if (valid) {
            notifySuccess(VALIDATION_MESSAGES.INPUT_VALID);
        } else {
            notifyError(VALIDATION_MESSAGES.INPUT_NOT_VALID);
        }
    }, 600);
};

/* Shows the first error of the basic tab under the question field; errors of
   the other tabs belong to their own badges, not to the question text. */
export const updatePropertyError = (card, input) => {
    const message = card.querySelector('[data-role="properties-error"]');

    if (!message) {
        return;
    }

    const tab_errors = getInputErrors(input, getCurrentInputs()).filter((error) => {
        return error.tab === PROPERTIES_TAB;
    });

    if (!tab_errors.length) {
        message.textContent = '';
        message.setAttribute('hidden', 'hidden');
        return;
    }

    message.textContent = tab_errors[0].message;
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

        if (value === getActivePropertyTab()) {
            return;
        }

        setActivePropertyTab(value);
        setActivePropertyContent(value);
    });
};

export const updateTabBadges = (tab_strip, input) => {
    const errors = getInputErrors(input, getCurrentInputs());
    const has_error = (tab) => {
        return errors.some((error) => {
            return error.tab === tab;
        });
    };

    markTabInvalid(tab_strip.querySelector('[value="basic"]'), has_error('properties'));
    markTabInvalid(tab_strip.querySelector('[value="advanced"]'), has_error('advanced'));
    markTabInvalid(tab_strip.querySelector('[value="jumps"]'), has_error('jumps'));
};

export const markTabInvalid = (tab, invalid) => {
    tab.classList.toggle('is-invalid', invalid);

    if (invalid) {
        tab.setAttribute('aria-invalid', 'true');
    } else {
        tab.removeAttribute('aria-invalid');
    }

    //as in legacy, a tab holding an error shows an alert icon next to its label
    const label = tab.querySelector('ion-label');
    const state_icon = label ? label.querySelector('.builder__property-tab-state') : null;

    if (invalid && !state_icon) {
        label.append(element('ion-icon', {
            class: 'builder__property-tab-state',
            name: 'alert',
            'aria-label': 'Tab has validation errors'
        }));
    } else if (!invalid && state_icon) {
        state_icon.remove();
    }
};

/* Live edits change validity, so the message, badges and copy gate follow. */
export const refreshPropertyValidation = (card, input) => {
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

export const refreshCurrentProperties = () => {
    const card = document.querySelector('#properties ion-card');
    const input = getCurrentInput();

    if (card && input) {
        refreshPropertyValidation(card, input);
    }
};

export const setActivePropertyContent = (value) => {
    document.querySelectorAll('#properties .builder__property-content').forEach((content) => {
        const active = content.id === `property-content-${value}`;

        content.classList.toggle('is-active', active);

        if (active) {
            content.removeAttribute('hidden');
            content.setAttribute('aria-hidden', 'false');
        } else {
            content.setAttribute('hidden', 'hidden');
            content.setAttribute('aria-hidden', 'true');
        }
    });
};

