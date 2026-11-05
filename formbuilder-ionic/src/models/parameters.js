'use strict';

/* Shared limits and tuning parameters, named to match the mobile app. */
export const PARAMETERS = {
    MAX_FORMS: 5,
    FORM_NAME_MAX_LENGTH: 50,
    FORM_NAME_REGEX: /^[\w\-\s]+$/,

    INPUTS_MAX_ALLOWED: 300,
    TITLES_MAX: 3,
    SEARCH_INPUTS_MAX: 5,

    MAX_ANSWERS: 300,
    MAX_SEARCH_ANSWERS: 1000,
    MAX_ANSWER_LENGTH: 250,
    ANSWERS_PER_PAGE: 100,

    QUESTION_MAX_LENGTH: 255,
    README_MAX_LENGTH: 1000,
    QUESTION_PREVIEW_LENGTH: 50,
    REGEX_MAX_LENGTH: 50,
    MIN_MAX_LENGTH: 50,

    MAX_UNDO_STATES: 10,
    UNDO_THROTTLE_MS: 500
};
