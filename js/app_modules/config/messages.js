'use strict';

var consts = require('config/consts');

var messages = {

    labels: {
        EDITING_FORM: 'Form > ',
        EDITING_BRANCH: 'Branch > ',
        EDITING_GROUP: 'Group > ',
        EDITING_NESTED_GROUP: ' Group: ',
        EXIT_EDITING: 'Back',
        ADD_BRANCH_INPUTS_HERE: 'Add branch questions here',
        ADD_GROUP_INPUTS_HERE: 'Add group questions here'
    },
    success: {
        INPUT_VALID: 'Question valid!',
        FORM_IMPORTED: 'Form import succeeded!',
        POSSIBLE_ANSWERS_IMPORTED: 'Possible answers import succeeded!',
        PROJECT_SAVED: 'Project saved!',
        JUMP_DELETED: 'Jump deleted!',//this should be a warning
        INPUT_COPIED: 'Question copied!'
    },
    error: {
        FORM_CANNOT_BE_DELETED: 'Form cannot be deleted',
        FORM_NAME_EMPTY: 'Form name cannot be empty',
        FORM_NAME_INVALID: 'Form name is invalid',
        FORM_FILE_INVALID: 'Form file is invalid',
        FORM_IS_INVALID: 'Form is invalid',
        FORM_NAME_EXIST: 'Form name exists',
        INPUT_NOT_VALID: 'Question NOT valid!',
        INPUT_NOT_SELECTED: 'No question selected',
        POSSILE_ANSWERS_CUSTOM_ID_CANNOT_SWITCH_BACK: 'Cannot switch back to basic mode',
        QUESTION_TEXT_EMPTY: 'This field cannot be empty',
        POSSIBLE_ANSWER_EMPTY: 'Answer text cannot be empty',
        POSSIBLE_ANSWER_DUPLICATED_IDENTIFIER: 'Duplicated identifier, please remove',
        VALUE_MUST_BE_INTEGER: 'Value must be an integer',
        MIN_MUST_BE_SMALLER_THAN_MAX: 'Min value must be smaller than Max',
        INITIAL_ANSWER_OUT_OF_RANGE: 'Value is out of range',
        INITIAL_ANSWER_NOT_MATCHING_REGEX: 'Value does not match regex',
        INITIAL_ANSWER_NOT_PHONE_NUMBER: 'Value is not a phone number',
        NO_QUESTION_TEXT_YET: 'No question text yet',
        NO_BRANCH_HEADER_YET: 'No branch header yet',
        NO_GROUP_HEADER_YET: 'No group header yet',
        NO_BRANCH_INPUTS_FOUND: 'No branch questions found',
        NO_GROUP_INPUTS_FOUND: 'No group questions found',
        INVALID_BRANCH_INPUTS: 'There are invalid branch questions',
        INVALID_GROUP_INPUTS: 'There are invalid group questions',
        JUMP_CONDITION_NOT_SELECTED: 'You must choose a condition',
        JUMP_ANSWER_NOT_SELECTED: 'You must choose an answer',
        JUMP_DESTINATION_NOT_SELECTED: 'You must choose a valid destination',
        JUMP_DESTINATION_INVALID: 'Invalid destination',
        PROJECT_NOT_SAVED: 'Project error!',
        JUMP_INVALID: 'Invalid jump on question:',
        JUMPS_INVALID: 'Some jumps are invalid',
        POSSIBLE_ANSWERS_INVALID: 'Some possible answers are invalid',
        CSV_FILE_INVALID: 'CSV file is invalid!',
        BROWSER_NOT_SUPPORTED: 'Browser not supported',
        MAX_QUESTIONS_LIMIT_REACHED: 'Questions limit reached for this form!',
        TOO_MANY_SEARCH_QUESTIONS: 'Too many search questions, only ' + consts.LIMITS.search_inputs_max + '  per project are allowed!',
        TOO_MANY_TITLES: 'Too many titles',
        TOO_MANY_QUESTIONS_FOR_CURRENT_FORM: 'Too many questions for this form: ',
        QUESTION_LENGTH_LIMIT_EXCEEDED: 'Characters limit exceeded'
    },
    warning: {
        POSSIBILE_ANSWER_HAS_LINKED_JUMP: 'There is a jump linked to this answer, please remove it first!',
        INPUT_DELETED: 'Question deleted!',
        FORM_DELETED: 'Form deleted!',
        SEARCH_INPUTS_LIMIT_REACHED: 'Search questions limit reached!'
    }
};

module.exports = messages;
