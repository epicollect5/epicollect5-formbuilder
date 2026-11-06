'use strict';

import { FORM_MESSAGES } from '@/config/strings.js';
import { PARAMETERS } from '@/config/parameters.js';

/*
 * Ported from `validation.isFormNameValid`: not empty, only word characters,
 * dashes and spaces, at most 50 characters. The legacy builder only checked
 * duplicate names when adding a form; the port checks on rename too, because a
 * duplicate label makes the form tabs ambiguous.
 */
export const getFormNameError = (forms, name, exclude_index) => {
    const trimmed = String(name === undefined || name === null ? '' : name).trim();

    if (!trimmed) {
        return FORM_MESSAGES.FORM_NAME_EMPTY;
    }

    if (trimmed.length > PARAMETERS.FORM_NAME_MAX_LENGTH) {
        return FORM_MESSAGES.FORM_NAME_LENGTH;
    }

    if (!PARAMETERS.FORM_NAME_REGEX.test(trimmed)) {
        return FORM_MESSAGES.FORM_NAME_INVALID;
    }

    const duplicate = (forms || []).some((form, index) => {
        return index !== exclude_index && String(form.name || '').toLowerCase() === trimmed.toLowerCase();
    });

    return duplicate ? FORM_MESSAGES.FORM_NAME_EXISTS : null;
};
