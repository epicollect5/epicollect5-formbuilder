'use strict';

import { generateInputRef, generateUniqID } from '@/models/refs.js';

// Types whose properties panel carries a possible-answers list.
const MULTIPLE_ANSWER_TYPES = [
    'radio',
    'checkbox',
    'dropdown',
    'searchsingle',
    'searchmultiple'
];

const PLACEHOLDER_ANSWER = 'I am a placeholder answer';

/*
 * A new question starts with the same shape the legacy factory produced, so the
 * server, the mobile app and the dataviewer keep receiving the same object.
 */
export function createInput(type, form_ref) {
    return {
        ref: generateInputRef(form_ref),
        type: type,
        question: '',
        is_title: false,
        is_required: false,
        uniqueness: 'none',
        regex: null,
        default: null,
        verify: false,
        max: null,
        min: null,
        datetime_format: null,
        set_to_current_datetime: false,
        possible_answers: MULTIPLE_ANSWER_TYPES.indexOf(type) !== -1
            ? [{ answer: PLACEHOLDER_ANSWER, answer_ref: generateUniqID() }]
            : [],
        jumps: [],
        branch: [],
        group: []
    };
}
