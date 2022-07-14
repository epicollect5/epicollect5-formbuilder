/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var jumps = require('actions/jumps');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var validation = require('actions/validation');

var callback = function (e) {

    //ignore left and right arrow keyboard keys (otherwise the user cannot edit a string)
    //from the docs:
    // The event.which property normalizes event.keyCode and event.charCode.
    // It is recommended to watch event.which for keyboard key input.
    if (e.which === 37 || e.which === 39) {
        return;
    }

    var input;
    var input_question_validation;
    var possible_answer_validation;
    var target = $(this);
    var undo = require('actions/undo');//it is here otherwise it breaks when compiling...go figure??
    // Capture initial cursor position, as we are replacing the input value on keyup, to avoid the cursor go to the end of the string
    var position = target[0].selectionStart;

    function _inputIsValid() {

        input.dom.is_valid = true;

        //validate input to refresh dom
        validation.performValidation(input, false);

        target[0].selectionEnd = position;    // Set the cursor back to the initial position.
    }

    function _getInput() {

        var input = utils.getInputObjectByRef(formbuilder.current_input_ref);
        var current_branch;

        //check whether we are validatin a nested input i.e. BOTH branch AND group edit flags are true
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {

            //get owner branch
            current_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);

            //get nested group input
            input = utils.getNestedGroupInputObjectByRef(current_branch, formbuilder.group.current_input_ref);
        }
        else {
            if (formbuilder.is_editing_branch) {
                //get selected branch input
                input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
            }

            if (formbuilder.is_editing_group) {
                //get selected group input
                input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
            }
        }

        return input;
    }

    input = _getInput();
    //get handle of input properties panel
    input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');

    //hide errors
    input.hideQuestionErrors();

    if (target.parent().hasClass('input-properties__form__question')) {
        //get question
        input.question = $(this).val();

        //validate question or header
        if (input.type === consts.BRANCH_TYPE || input.type === consts.GROUP_TYPE) {
            input_question_validation = input.isHeaderTextValid();
        }
        else {
            input_question_validation = input.isQuestionTextValid();
        }

        if (!input_question_validation.is_valid) {
            // warn user question text is wrong
            input.dom.is_valid = false;

            //highlight wrong input and show error message
            input.showQuestionErrors(input_question_validation.error.message);

            //disable edit btn for groups or branches
            if (input.type === consts.BRANCH_TYPE || input.type === consts.GROUP_TYPE) {
                input.toggleEditButton(false);
            }

            //validate all inputs (to toggle save project button on keyup)
            validation.performValidation(input, false);
            target[0].selectionEnd = position;    // Set the cursor back to the initial position.
        }
        else {

            //branch and group inputs are invalid if they do not have any inputs
            if (input.type === consts.BRANCH_TYPE || input.type === consts.GROUP_TYPE) {

                //enable edit btn for groups or branches
                input.toggleEditButton(true);

                if (input.type === consts.BRANCH_TYPE && input.branch.length === 0) {
                    input.dom.is_valid = false;
                }
                if (input.type === consts.GROUP_TYPE && input.group.length === 0) {
                    input.dom.is_valid = false;
                }
                if (input.dom.is_valid) {
                    _inputIsValid();
                }
            }
            else {
                _inputIsValid();
            }
        }
    }

    if (target.parent().hasClass('input-properties__form__possible-answers__list__possible_answer_item')) {

        possible_answer_validation = validation.isPossibleAnswerValid(target.val());

        //validate each possible answer and show embedded errors if any
        if (!possible_answer_validation.is_valid) {
            // warn user question text is wrong
            input.dom.is_valid = false;

            //highlight wrong answer and show error message
            input.showPossibleAnswerErrors(target.parent().parent(), possible_answer_validation.error.message);

            validation.performValidation(input, false);
            target[0].selectionEnd = position;    // Set the cursor back to the initial position.

        } else {
            _inputIsValid();
        }
    }

    //push state to enable undoing the action (typing) passing "true" so it gets a bit of throttling
    undo.pushState(true);
};

module.exports = callback;
