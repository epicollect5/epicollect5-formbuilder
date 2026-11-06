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

    DATE_FORMATS_DEFAULT: 'dd/MM/YYYY',
    TIME_FORMATS_DEFAULT: 'HH:mm',

    MAX_UNDO_STATES: 10,
    UNDO_THROTTLE_MS: 500,

    TOAST_DURATION_MS: 3200,

    PROJECT_PATH: '../project/project.json',
    PROJECT_SAVE_PATH: 'api/internal/formbuilder',
    PROJECT_SCHEMA_ID: 'epicollect5-project',

    /* Import guard: refuse absurdly large files before reading them (R-71). */
    FORM_IMPORT_MAX_BYTES: 5 * 1024 * 1024,

    JUMP_TO_END_OF_FORM_REF: 'END'
};
