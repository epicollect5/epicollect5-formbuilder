'use strict';

import { getInputs } from '@/models/project-definition.js';
import { PARAMETERS } from '@/config/parameters.js';
import { isMultipleAnswerType } from '@/models/possible-answers.js';
import {
    allowsRequired,
    allowsTitle,
    allowsUniqueness,
    DATE_FORMATS,
    hasAdvancedTab,
    isBranchOrGroup,
    isMediaType,
    TIME_FORMATS
} from '@/models/input-properties.js';

export const getPropertySections = (type) => {
    return {
        show_question: type !== 'readme',
        show_required: allowsRequired(type),
        show_title: allowsTitle(type),
        show_readme: type === 'readme',
        show_possible_answers: isMultipleAnswerType(type),
        has_advanced: hasAdvancedTab(type)
    };
};

export const countTitles = (inputs, excluded_ref) => {
    return (inputs || []).reduce((count, input) => {
        if (input && input.ref !== excluded_ref && input.is_title === true) {
            return count + 1;
        }

        return count;
    }, 0);
};

export const getTitleLimitState = (form, input) => {
    if (!allowsTitle(input.type) || !input.is_title) {
        return { disabled: false, limit_reached: false };
    }

    const reached = countTitles(getInputs(form), input.ref) >= PARAMETERS.TITLES_MAX;

    return { disabled: false, limit_reached: reached };
};

export const sanitizeQuestion = (input, value) => {
    const text = value === undefined || value === null ? '' : String(value);
    const limit = input && input.type === 'readme' ? PARAMETERS.README_MAX_LENGTH : PARAMETERS.QUESTION_MAX_LENGTH;

    return text.slice(0, limit);
};

export const getAdvancedFields = (type) => {
    if (type === 'readme' || isMediaType(type) || isBranchOrGroup(type)) {
        return [];
    }

    if (type === 'integer' || type === 'decimal') {
        return ['numeric_type', 'default_number', 'min', 'max', 'regex', 'verify', 'uniqueness'];
    }

    if (type === 'date') {
        return ['datetime_format', 'set_to_current_datetime', 'uniqueness'];
    }

    if (type === 'time') {
        return ['datetime_format', 'set_to_current_datetime', 'uniqueness'];
    }

    if (isMultipleAnswerType(type)) {
        if (type === 'searchsingle' || type === 'searchmultiple') {
            return ['default_choice', 'search_type'];
        }

        return ['default_choice'];
    }

    if (type === 'barcode') {
        return ['default_text', 'regex', 'uniqueness'];
    }

    return ['default_text', 'regex', 'verify', 'uniqueness'];
};

export const normalizeAdvancedChange = (input, changes) => {
    const next = Object.assign({}, changes);

    if (next.regex === '') {
        next.regex = null;
    }

    if (next.default === '') {
        next.default = null;
    }

    if (next.min === '') {
        next.min = null;
    }

    if (next.max === '') {
        next.max = null;
    }

    if (next.datetime_format === undefined && input) {
        if (input.type === 'date' && !input.datetime_format) {
            next.datetime_format = DATE_FORMATS[0].value;
        }

        if (input.type === 'time' && !input.datetime_format) {
            next.datetime_format = TIME_FORMATS[2].value;
        }
    }

    return next;
};
