'use strict';

import { generateUniqID } from '@/models/refs.js';

export const PLACEHOLDER_ANSWER = 'I am a placeholder answer';

/* Mirrors consts.LIMITS.possible_answers_max / _max_search. */
export const MAX_ANSWERS = 300;
export const MAX_SEARCH_ANSWERS = 1000;

const MULTIPLE_ANSWER_TYPES = [
    'radio',
    'checkbox',
    'dropdown',
    'searchsingle',
    'searchmultiple'
];

export function isMultipleAnswerType(type) {
    return MULTIPLE_ANSWER_TYPES.indexOf(type) !== -1;
}

export function isSearchType(type) {
    return type === 'searchsingle' || type === 'searchmultiple';
}

export function getAnswerLimit(type) {
    return isSearchType(type) ? MAX_SEARCH_ANSWERS : MAX_ANSWERS;
}

export function createAnswer(answer) {
    return {
        answer: answer === undefined ? PLACEHOLDER_ANSWER : answer,
        answer_ref: generateUniqID()
    };
}
