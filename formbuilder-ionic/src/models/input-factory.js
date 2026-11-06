'use strict';

import { createAnswer, isMultipleAnswerType } from '@/models/possible-answers.js';
import { generateInputRef } from '@/models/refs.js';

const getDefaultDatetimeFormat = (type) => {
    if (type === 'date') {
        return 'dd/MM/YYYY';
    }

    if (type === 'time') {
        return 'HH:mm';
    }

    return null;
};

/*
 * A new question starts with the same shape the legacy factory produced, so the
 * server, the mobile app and the dataviewer keep receiving the same object.
 */
export const createInput = (type, form_ref) => {
    return {
        ref: generateInputRef(form_ref),
        type,
        question: '',
        is_title: false,
        is_required: false,
        uniqueness: 'none',
        regex: null,
        default: null,
        verify: false,
        max: null,
        min: null,
        datetime_format: getDefaultDatetimeFormat(type),
        set_to_current_datetime: false,
        possible_answers: isMultipleAnswerType(type) ? [createAnswer()] : [],
        jumps: [],
        branch: [],
        group: []
    };
};
