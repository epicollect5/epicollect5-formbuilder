'use strict';

import { generateUniqID } from '@/models/refs.js';
import { PARAMETERS } from '@/models/parameters.js';

export const PLACEHOLDER_ANSWER = 'I am a placeholder answer';

/* Mirrors consts.LIMITS.possible_answers_max / _max_search. */
export const MAX_ANSWERS = PARAMETERS.MAX_ANSWERS;
export const MAX_SEARCH_ANSWERS = PARAMETERS.MAX_SEARCH_ANSWERS;

/* consts.LIMITS.possible_answer_max_length / possible_answers_per_page. */
export const MAX_ANSWER_LENGTH = PARAMETERS.MAX_ANSWER_LENGTH;
export const ANSWERS_PER_PAGE = PARAMETERS.ANSWERS_PER_PAGE;

export const POSSIBLE_ANSWERS_ORDER = {
    AZ: 'az',
    ZA: 'za',
    SHUFFLE: 'shuffle'
};

const MULTIPLE_ANSWER_TYPES = [
    'radio',
    'checkbox',
    'dropdown',
    'searchsingle',
    'searchmultiple'
];

export const isMultipleAnswerType = (type) => {
    return MULTIPLE_ANSWER_TYPES.indexOf(type) !== -1;
};

export const isSearchType = (type) => {
    return type === 'searchsingle' || type === 'searchmultiple';
};

export const getAnswerLimit = (type) => {
    return isSearchType(type) ? MAX_SEARCH_ANSWERS : MAX_ANSWERS;
};

export const createAnswer = (answer) => {
    return {
        answer: answer === undefined ? PLACEHOLDER_ANSWER : answer,
        answer_ref: generateUniqID()
    };
};

/*
 * Answer text is capped at 250 characters, and angle brackets become the
 * private-use characters the legacy builder used, so an answer can never turn
 * into markup in the mobile app or the dataviewer.
 */
export const sanitizeAnswer = (value) => {
    return String(value === undefined || value === null ? '' : value)
        .replace(/</g, '\ufe64')
        .replace(/>/g, '\ufe65')
        .slice(0, MAX_ANSWER_LENGTH);
};

/* `answer_ref` is part of the contract and has to stay unique per question. */
export const hasDuplicateAnswerRefs = (answers) => {
    const refs = (answers || []).map((answer) => {
        return answer && answer.answer_ref;
    });

    return new Set(refs).size !== refs.length;
};

export const getAnswerPageCount = (answers) => {
    const total = (answers || []).length;

    return Math.max(1, Math.ceil(total / ANSWERS_PER_PAGE));
};

export const getAnswerPage = (answers, page) => {
    const bounded = Math.min(Math.max(page, 1), getAnswerPageCount(answers));
    const start = (bounded - 1) * ANSWERS_PER_PAGE;

    return (answers || []).slice(start, start + ANSWERS_PER_PAGE);
};

const compareAnswers = (a, b) => {
    return String(a.answer || '').localeCompare(String(b.answer || ''), undefined, {
        ignorePunctuation: true,
        numeric: true
    });
};

/* Returns the ordered copy; the service decides when to apply it. */
export const sortAnswers = (answers, order) => {
    const ordered = (answers || []).slice();

    if (order === POSSIBLE_ANSWERS_ORDER.AZ) {
        return ordered.sort(compareAnswers);
    }

    if (order === POSSIBLE_ANSWERS_ORDER.ZA) {
        return ordered.sort((a, b) => {
            return compareAnswers(b, a);
        });
    }

    if (order === POSSIBLE_ANSWERS_ORDER.SHUFFLE) {
        for (let i = ordered.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const swap = ordered[i];

            ordered[i] = ordered[j];
            ordered[j] = swap;
        }
    }

    return ordered;
};
