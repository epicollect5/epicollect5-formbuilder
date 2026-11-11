'use strict';

import { QUESTION_TYPE } from '@/config/question-types.js';
import { getInputs } from '@/models/project-definition.js';
import { PARAMETERS } from '@/config/parameters.js';
import { isMultipleAnswerType } from '@/models/possible-answers.js';
import {
    allowsRequired,
    allowsTitle,
    allowsUniqueness,
    hasAdvancedTab,
    isBranchOrGroup,
    isMediaType,
} from '@/models/input-properties.js';

export const getPropertySections = (type) => {
    return {
        show_question: type !== QUESTION_TYPE.README,
        show_required: allowsRequired(type),
        show_title: allowsTitle(type),
        show_readme: type === QUESTION_TYPE.README,
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
    const limit = input && input.type === QUESTION_TYPE.README ? PARAMETERS.README_MAX_LENGTH : PARAMETERS.QUESTION_MAX_LENGTH;

    return text.slice(0, limit);
};

export const getAdvancedFields = (type) => {
    if (type === QUESTION_TYPE.README || isMediaType(type) || isBranchOrGroup(type)) {
        return [];
    }

    if (type === QUESTION_TYPE.INTEGER || type === QUESTION_TYPE.DECIMAL) {
        return ['numeric_type', 'default_number', 'min', 'max', 'regex', 'verify', 'uniqueness'];
    }

    if (type === QUESTION_TYPE.DATE) {
        return ['datetime_format', 'set_to_current_datetime', 'uniqueness'];
    }

    if (type === QUESTION_TYPE.TIME) {
        return ['datetime_format', 'set_to_current_datetime', 'uniqueness'];
    }

    if (isMultipleAnswerType(type)) {
        if (type === QUESTION_TYPE.SEARCH_SINGLE || type === QUESTION_TYPE.SEARCH_MULTIPLE) {
            return ['default_choice', 'search_type'];
        }

        return ['default_choice'];
    }

    if (type === QUESTION_TYPE.BARCODE) {
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
        if (input.type === QUESTION_TYPE.DATE && !input.datetime_format) {
            next.datetime_format = PARAMETERS.DATE_FORMATS[0].value;
        }

        if (input.type === QUESTION_TYPE.TIME && !input.datetime_format) {
            next.datetime_format = PARAMETERS.TIME_FORMATS[2].value;
        }
    }

    return next;
};
