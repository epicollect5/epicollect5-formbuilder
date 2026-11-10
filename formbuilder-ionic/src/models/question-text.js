'use strict';

import { PARAMETERS } from '@/config/parameters.js';
import { isBranchOrGroup, isMediaType } from '@/models/input-properties.js';

/*
 * Pure question-text helpers shared by the vanilla render layer and the Vue
 * app: the per-type label, the sanitised text and the display label. They were
 * moved out of ui/questions-list.js so the Vue side does not import the
 * vanilla render layer.
 */

export const getQuestionLabelText = (type) => {
    if (isBranchOrGroup(type)) {
        return 'Header';
    }

    // Legacy labels the media text field differently from the other questions.
    if (isMediaType(type)) {
        return 'Question Text';
    }

    return 'Question';
};

export const sanitizeQuestion = (input, value) => {
    const text = value === undefined || value === null ? '' : String(value);
    const limit = input && input.type === 'readme' ? PARAMETERS.README_MAX_LENGTH : PARAMETERS.QUESTION_MAX_LENGTH;
    // Legacy stores angle brackets as look-alike Unicode instead of markup.
    const sanitized = input && input.type === 'readme' ? text : text.replace(/>/g, '\ufe65').replace(/</g, '\ufe64');

    return sanitized.slice(0, limit);
};

export const getQuestionLabel = (input) => {
    if (!input || !input.question) {
        return input && input.type === 'readme' ? 'Readme' : 'Untitled question';
    }

    if (input.type !== 'readme') {
        return input.question;
    }

    const parsed = new DOMParser().parseFromString(input.question, 'text/html');

    return parsed.body.textContent.trim() || 'Readme';
};
