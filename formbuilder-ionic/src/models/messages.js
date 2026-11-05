'use strict';

/*
 * Validation copy ported from the legacy `config/messages.js`. The texts are
 * part of the builder's behaviour, so they are kept verbatim.
 */
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
