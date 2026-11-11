'use strict';

import { PARAMETERS } from '@/config/parameters.js';

/*
 * Validation copy ported from the legacy `config/messages.js`. The texts are
 * part of the builder's behaviour, so they are kept verbatim.
 */
/* Save / export / import and form management copy. */
export const FORM_MESSAGES = {
    PROJECT_SAVED: 'Project saved!',
    PROJECT_NOT_SAVED: 'Project error!',
    PROJECT_SAVING: 'Saving…',
    PROJECT_VALIDATING: 'Validating…',
    PROJECT_VALID: 'Project is valid!',
    PROJECT_INVALID: 'Project has validation errors',
    INPUT_DELETED: 'Question deleted',
    INPUT_COPIED: 'Question copied!',
    FORM_DELETED: 'Form deleted',
    FORM_IMPORTED: 'Form import succeeded!',
    FORM_IMPORTING: 'Importing form…',
    FORM_FILE_INVALID: 'Form file is invalid',
    FORM_FILE_TOO_LARGE: 'Form file is too large',
    FORM_IS_INVALID: 'Form is invalid',
    FORM_CANNOT_BE_DELETED: 'Form cannot be deleted',
    FORM_DELETE_CONFIRM: 'Delete this form and all its questions?',
    DELETE_ALL_CONFIRM: 'Delete all questions?',
    FORM_NAME_EMPTY: 'Form name cannot be empty',
    FORM_NAME_INVALID: 'Form name is invalid',
    FORM_NAME_EXISTS: 'Form name exists',
    FORM_NAME_LENGTH: `Form name is too long (${PARAMETERS.FORM_NAME_MAX_LENGTH} characters max)`,
    INPUT_DELETE_CONFIRM: 'Are you sure you want to delete this question?',
    INPUT_DELETE_WARNING: 'This action cannot be undone!',
    TOO_MANY_QUESTIONS: `Too many questions, only ${PARAMETERS.INPUTS_MAX_ALLOWED} per project are allowed!`,
    TOO_MANY_TITLES: 'Too many titles',
    SEARCH_INPUTS_LIMIT_REACHED: `Search questions limit reached!(${PARAMETERS.SEARCH_INPUTS_MAX})`,
    TOO_MANY_SEARCH_QUESTIONS: `Too many search questions, only ${PARAMETERS.SEARCH_INPUTS_MAX} per project are allowed!`,

    /* The save gate, the save flow and the shared modal buttons. */
    SAVE_TITLE: 'Save project',
    FIX_ERRORS_TITLE: 'Fix the validation errors before saving',
    WARNING_TITLE: 'Warning',
    CONFIRM_BUTTON: 'Confirm',
    DISMISS_BUTTON: 'Dismiss',
    PROJECT_PAYLOAD_EMPTY: 'The project payload is empty',
    PROJECT_COMPRESS_UNSUPPORTED: 'This browser cannot compress the project definition',
    PROJECT_DECODE_UNSUPPORTED: 'This browser cannot decode a gzipped project definition',
    PROJECT_SAVE_INVALID: 'The project is invalid',
    STREAMS_UNSUPPORTED: 'This browser supports neither CompressionStream nor TransformStream'
};

/*
 * Field labels, placeholders and panel copy for the properties side: the
 * question field, the advanced fields and the question-row badges. Shared by
 * the models that derive them and the panels that render them.
 */
export const PANEL_MESSAGES = {
    QUESTION_LABEL: 'Question',
    HEADER_LABEL: 'Header',
    README_LABEL: 'Readme',
    UNTITLED_QUESTION: 'Untitled question',
    UNTITLED_ANSWER: 'Untitled answer',
    QUESTION_PLACEHOLDER: 'Type question here...',
    HEADER_PLACEHOLDER: 'Type header here...',
    PANEL_TITLE: 'Question properties',
    SELECT_QUESTION_EMPTY: 'Select a question to edit it.',
    EDIT_BRANCH: 'Edit Branch',
    EDIT_GROUP: 'Edit Group',
    REQUIRED_LABEL: 'Answer is required',
    TITLE_LABEL: 'Use answer as title',
    TITLE_INFO_LABEL: 'What is a title?',
    NO_UNIQUENESS: 'No uniqueness',
    VERIFY_LABEL: 'Require double entry',
    VERIFY_DOUBLE_LABEL: 'Require double entry verification',
    TIME_FORMAT_LABEL: 'Time format',
    DATE_FORMAT_LABEL: 'Date format',
    SET_CURRENT_DATE_LABEL: 'Set initial answer to current date',
    SET_CURRENT_TIME_LABEL: 'Set initial answer to current time',
    VALID_QUESTION: 'Valid question',
    INVALID_QUESTION: 'Question has errors'
};

/* The possible-answers card and its CSV options modal. */
export const ANSWERS_MESSAGES = {
    NONE_OPTION: 'None',
    CSV_MODAL_TITLE: 'Possible answers csv import options',
    CSV_COLUMN_LABEL: 'Column to import',
    CSV_PICK_COLUMN: 'Pick column',
    IMPORT_BUTTON: 'Import'
};

/* Copy the jumps panel derives: previews and unavailable selections. */
export const JUMPS_MESSAGES = {
    PREVIEW_NO_BRANCH_HEADER: 'No branch header yet',
    PREVIEW_NO_QUESTION_TEXT: 'No question text yet',
    UNAVAILABLE_ANSWER: 'Unavailable answer',
    UNAVAILABLE_DESTINATION: 'Unavailable destination'
};

/* Form strip, form menu and form-name modal copy. */
export const FORMS_MESSAGES = {
    NEW_FORM_DEFAULT: 'New form',
    FORM_NAME_MODAL: 'Form name',
    SAVE_CHANGES: 'Save changes',
    ADD_FORM: 'Add form',
    ADD_FORM_LIMIT: `A project can have at most ${PARAMETERS.MAX_FORMS} forms`
};

export const VALIDATION_MESSAGES = {
    QUESTION_TEXT_EMPTY: 'This field cannot be empty',
    QUESTION_LENGTH_LIMIT_EXCEEDED: 'Characters limit exceeded',
    POSSIBLE_ANSWER_EMPTY: 'Answer text cannot be empty',
    POSSIBLE_ANSWER_DUPLICATED_IDENTIFIER: 'Duplicated identifier, please remove',
    CSV_FILE_INVALID: 'CSV file is invalid!',
    CSV_FILE_TOO_LARGE: 'CSV file is too large!',
    POSSIBLE_ANSWERS_IMPORTED: 'Possible answers import succeeded!',
    POSSIBLE_ANSWERS_INVALID: 'Some possible answers are invalid',
    VALUE_MUST_BE_INTEGER: 'Value must be an integer',
    VALUE_MUST_BE_NUMBER: 'Value must be a number',
    MIN_MUST_BE_SMALLER_THAN_MAX: 'Min value must be smaller than Max',
    INITIAL_ANSWER_OUT_OF_RANGE: 'Value is out of range',
    INITIAL_ANSWER_NOT_MATCHING_REGEX: 'Value does not match regex',
    NO_BRANCH_INPUTS_FOUND: 'No branch questions found',
    NO_GROUP_INPUTS_FOUND: 'No group questions found',
    INVALID_BRANCH_INPUTS: 'There are invalid branch questions',
    INVALID_GROUP_INPUTS: 'There are invalid group questions',
    JUMP_CONDITION_NOT_SELECTED: 'You must choose a condition',
    JUMP_ANSWER_NOT_SELECTED: 'You must choose an answer',
    JUMP_DESTINATION_NOT_SELECTED: 'You must choose a valid destination',
    JUMP_DESTINATION_INVALID: 'Invalid destination',
    INPUT_VALID: 'Question valid!',
    INPUT_NOT_VALID: 'Question NOT valid!'
};
