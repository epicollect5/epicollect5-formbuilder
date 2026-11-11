'use strict';

import { QUESTION_TYPE } from '@/config/question-types.js';
import { PARAMETERS } from '@/config/parameters.js';
import { PANEL_MESSAGES } from '@/config/strings.js';
import { isBranchOrGroup, isMediaType } from '@/models/input-properties.js';

/*
 * Pure question-text helpers shared by the vanilla render layer and the Vue
 * app: the per-type label, the sanitised text and the display label. They were
 * moved out of ui/questions-list.js so the Vue side does not import the
 * vanilla render layer. The copy comes from config/strings.js.
 */

export const getQuestionLabelText = (type) => {
    if (isBranchOrGroup(type)) {
        return PANEL_MESSAGES.HEADER_LABEL;
    }

    // Legacy labels the media text field differently from the other questions;
    // the port shows the plain question label for media types too.
    if (isMediaType(type)) {
        return PANEL_MESSAGES.QUESTION_LABEL;
    }

    return PANEL_MESSAGES.QUESTION_LABEL;
};

export const sanitizeQuestion = (input, value) => {
    const text = value === undefined || value === null ? '' : String(value);
    const limit = input && input.type === QUESTION_TYPE.README ? PARAMETERS.README_MAX_LENGTH : PARAMETERS.QUESTION_MAX_LENGTH;
    // Legacy stores angle brackets as look-alike Unicode instead of markup.
    const sanitized = input && input.type === QUESTION_TYPE.README ? text : text.replace(/>/g, '\ufe65').replace(/</g, '\ufe64');

    return sanitized.slice(0, limit);
};

export const getQuestionLabel = (input) => {
    if (!input || !input.question) {
        return input && input.type === QUESTION_TYPE.README ? PANEL_MESSAGES.README_LABEL : PANEL_MESSAGES.UNTITLED_QUESTION;
    }

    if (input.type !== QUESTION_TYPE.README) {
        return input.question;
    }

    const parsed = new DOMParser().parseFromString(input.question, 'text/html');

    return parsed.body.textContent.trim() || PANEL_MESSAGES.README_LABEL;
};
