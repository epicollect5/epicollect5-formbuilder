'use strict';

/*
 * Validation copy ported from the legacy `config/messages.js`. The texts are
 * part of the builder's behaviour, so they are kept verbatim.
 */
/* Save / export / import and form management copy. */
export const FORM_MESSAGES = {
    PROJECT_SAVED: 'Project saved!',
    PROJECT_NOT_SAVED: 'Project error!',
    PROJECT_SAVING: 'Saving…',
    FORM_IMPORTED: 'Form import succeeded!',
    FORM_IMPORTING: 'Importing form…',
    FORM_FILE_INVALID: 'Form file is invalid',
    FORM_IS_INVALID: 'Form is invalid',
    FORM_CANNOT_BE_DELETED: 'Form cannot be deleted',
    FORM_DELETE_CONFIRM: 'Delete this form and all its questions?',
    DELETE_ALL_CONFIRM: 'Delete all questions?',
    FORM_NAME_EMPTY: 'Form name cannot be empty',
    FORM_NAME_INVALID: 'Form name is invalid',
    FORM_NAME_EXISTS: 'Form name exists',
    FORM_NAME_LENGTH: 'Form name is too long (50 characters max)',
    INPUT_DELETE_CONFIRM: 'Are you sure you want to delete this question?',
    INPUT_DELETE_WARNING: 'This action cannot be undone!',
    TOO_MANY_QUESTIONS: 'Too many questions, only 300 per project are allowed!',
    TOO_MANY_TITLES: 'Too many titles',
    TOO_MANY_SEARCH_QUESTIONS: 'Too many search questions, only 5 per project are allowed!'
};

export const VALIDATION_MESSAGES = {
    QUESTION_TEXT_EMPTY: 'This field cannot be empty',
    QUESTION_LENGTH_LIMIT_EXCEEDED: 'Characters limit exceeded',
    POSSIBLE_ANSWER_EMPTY: 'Answer text cannot be empty',
    POSSIBLE_ANSWER_DUPLICATED_IDENTIFIER: 'Duplicated identifier, please remove',
    CSV_FILE_INVALID: 'CSV file is invalid!',
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
    INPUT_VALID: 'Question valid!'
};
