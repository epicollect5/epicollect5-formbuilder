'use strict';

import { hasDuplicateAnswerRefs, isMultipleAnswerType } from '@/models/possible-answers.js';
import { getContainerList } from '@/models/nesting.js';
import { isBranchOrGroup } from '@/models/input-properties.js';
import { VALIDATION_MESSAGES as M } from '@/models/messages.js';

/*
 * Per-input validation, ported from `actions/validation.js` without the legacy
 * defects listed in docs/legacy-known-defects.md:
 *
 * - an integer default is range-checked against both min and max (legacy
 *   compared against `min` twice),
 * - possible answers are checked for every multiple-answer type (legacy's
 *   `indexOf(input.type !== -1)` test was always true),
 * - a malformed regex is reported instead of throwing inside the panel.
 */

const NUMERIC_TYPES = ['integer', 'decimal'];

export function isBlank(value) {
    return value === null || value === undefined || String(value).trim() === '';
}

export function isIntegerValue(value) {
    const number = Number(value);

    return Number.isFinite(number) && Math.floor(number) === number;
}

export function isNumberValue(value) {
    return Number.isFinite(Number(value));
}

function numberOrNull(value) {
    return isBlank(value) ? null : Number(value);
}

function plainTextLength(html) {
    return String(html || '').replace(/<[^>]*>/g, '').trim().length;
}

export function getQuestionTextErrors(input) {
    const question = input.question === null || input.question === undefined ? '' : String(input.question);

    if (question.trim() === '') {
        return [M.QUESTION_TEXT_EMPTY];
    }

    if (input.type === 'readme') {
        return plainTextLength(question) > 1000 ? [M.QUESTION_LENGTH_LIMIT_EXCEEDED] : [];
    }

    return question.length > 255 ? [M.QUESTION_LENGTH_LIMIT_EXCEEDED] : [];
}

function getPossibleAnswerErrors(input) {
    if (!isMultipleAnswerType(input.type)) {
        return [];
    }

    const answers = Array.isArray(input.possible_answers) ? input.possible_answers : [];

    if (answers.length === 0) {
        return [M.POSSIBLE_ANSWER_EMPTY];
    }

    if (answers.some(function (answer) {
        return !answer || isBlank(answer.answer);
    })) {
        return [M.POSSIBLE_ANSWER_EMPTY];
    }

    if (hasDuplicateAnswerRefs(answers)) {
        return [M.POSSIBLE_ANSWER_DUPLICATED_IDENTIFIER];
    }

    return [];
}

function getNumericErrors(input) {
    if (NUMERIC_TYPES.indexOf(input.type) === -1) {
        return [];
    }

    const errors = [];
    const integer = input.type === 'integer';
    const min_value = numberOrNull(input.min);
    const max_value = numberOrNull(input.max);

    if (min_value !== null) {
        if (!isNumberValue(input.min) || (integer && !isIntegerValue(input.min))) {
            errors.push(integer ? M.VALUE_MUST_BE_INTEGER : M.VALUE_MUST_BE_NUMBER);
        }
    }

    if (max_value !== null) {
        if (!isNumberValue(input.max) || (integer && !isIntegerValue(input.max))) {
            errors.push(integer ? M.VALUE_MUST_BE_INTEGER : M.VALUE_MUST_BE_NUMBER);
        }
    }

    if (!errors.length && min_value !== null && max_value !== null && min_value >= max_value) {
        errors.push(M.MIN_MUST_BE_SMALLER_THAN_MAX);
    }

    if (isBlank(input.default)) {
        return errors;
    }

    const default_value = Number(input.default);

    if (!isNumberValue(input.default) || (integer && !isIntegerValue(input.default))) {
        errors.push(integer ? M.VALUE_MUST_BE_INTEGER : M.VALUE_MUST_BE_NUMBER);
        return errors;
    }

    if ((min_value !== null && default_value < min_value) || (max_value !== null && default_value > max_value)) {
        errors.push(M.INITIAL_ANSWER_OUT_OF_RANGE);
    }

    return errors;
}

function getDefaultErrors(input) {
    // Legacy applies the regex to numeric defaults as well.
    if (isBlank(input.regex) || isBlank(input.default)) {
        return [];
    }

    try {
        return new RegExp(input.regex).test(String(input.default)) ? [] : [M.INITIAL_ANSWER_NOT_MATCHING_REGEX];
    }
    catch (error) {
        // A half-typed pattern must not break the properties panel.
        return [M.INITIAL_ANSWER_NOT_MATCHING_REGEX];
    }
}

function getChildrenErrors(input) {
    if (!isBranchOrGroup(input.type)) {
        return [];
    }

    if (getContainerList(input).length === 0) {
        return [input.type === 'branch' ? M.NO_BRANCH_INPUTS_FOUND : M.NO_GROUP_INPUTS_FOUND];
    }

    return [];
}

/* Object-level rules only; jump and child-validity checks need the list. */
export function getInputObjectErrors(input) {
    if (!input) {
        return [M.QUESTION_TEXT_EMPTY];
    }

    return getQuestionTextErrors(input)
        .concat(getChildrenErrors(input))
        .concat(getPossibleAnswerErrors(input))
        .concat(getNumericErrors(input))
        .concat(getDefaultErrors(input));
}
