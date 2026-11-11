'use strict';

/*
 * Shared constants: limits and tuning named to match the mobile app, plus the
 * option lists, default strings and contract vocabularies the models and
 * panels read. Domain-sized taxonomies (the question types) have their own
 * config module, `question-types.js`.
 */
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
    JUMPS_PER_PAGE: 20,

    QUESTION_MAX_LENGTH: 255,
    README_MAX_LENGTH: 1000,
    QUESTION_PREVIEW_LENGTH: 50,
    REGEX_MAX_LENGTH: 50,
    MIN_MAX_LENGTH: 50,

    DATE_FORMATS_DEFAULT: 'dd/MM/YYYY',
    TIME_FORMATS_DEFAULT: 'HH:mm',
    /* The advanced-tab format options, first date / third time value being the defaults above. */
    DATE_FORMATS: [
        { value: 'dd/MM/YYYY', label: 'Day/Month/Year' },
        { value: 'MM/dd/YYYY', label: 'Month/Day/Year' },
        { value: 'YYYY/MM/dd', label: 'Year/Month/Day' },
        { value: 'MM/YYYY', label: 'Month/Year' },
        { value: 'dd/MM', label: 'Day/Month' }
    ],
    TIME_FORMATS: [
        { value: 'HH:mm:ss', label: 'Hours:Minutes:Seconds (24 hours)' },
        { value: 'hh:mm:ss', label: 'Hours:Minutes:Seconds (12 hours)' },
        { value: 'HH:mm', label: 'Hours:Minutes (24 hours)' },
        { value: 'hh:mm', label: 'Hours:Minutes (12 hours)' },
        { value: 'mm:ss', label: 'Minutes:Seconds' }
    ],

    /* One placeholder answer is the minimum the contract allows. */
    PLACEHOLDER_ANSWER: 'I am a placeholder answer',

    /* Possible-answers ordering menu values. */
    POSSIBLE_ANSWERS_ORDER: {
        AZ: 'az',
        ZA: 'za',
        SHUFFLE: 'shuffle'
    },

    /* Jump condition vocabulary; the contract keys are frozen. */
    JUMP_CONDITIONS: [
        { key: 'NO_ANSWER_GIVEN', label: 'no answer given' },
        { key: 'IS', label: 'answer is' },
        { key: 'IS_NOT', label: 'answer is NOT' },
        { key: 'ALL', label: 'always' }
    ],
    JUMP_WHEN: {
        NO_ANSWER_GIVEN: 'NO_ANSWER_GIVEN',
        IS: 'IS',
        IS_NOT: 'IS_NOT',
        ALL: 'ALL'
    },
    JUMP_TO_END_OF_FORM_LABEL: 'End of form',

    /* Property-panel tab ids; validation errors carry the tab they belong to. */
    PROPERTIES_TAB: 'properties',
    ADVANCED_TAB: 'advanced',
    JUMPS_TAB: 'jumps',

    MAX_UNDO_STATES: 5,
    /* Ceiling for the serialized snapshots, the UTF-16 upper bound of the text. */
    MAX_UNDO_BYTES: 1024 * 1024 * 1024,
    UNDO_THROTTLE_MS: 500,

    TOAST_DURATION_MS: 3200,

    PROJECT_PATH: '../project/project.json',
    PROJECT_SAVE_PATH: 'api/internal/formbuilder',
    PROJECT_SCHEMA_ID: 'epicollect5-project',

    /* Import guard: refuse absurdly large files before reading them (R-71). */
    IMPORT_MAX_BYTES: 5 * 1024 * 1024,

    JUMP_TO_END_OF_FORM_REF: 'END'
};
