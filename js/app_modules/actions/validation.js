/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var save = require('actions/save');
var utils = require('helpers/utils');
var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');
var import_form_validation = require('helpers/import-form-validation');
var toast = require('config/toast');

var validation = {

    isFormNameValid: function (the_name, is_adding_new_form) {

        var forms = formbuilder.project_definition.data.project.forms;
        var str = the_name.trim();
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.QUESTION_PROPERTY
            }
        };
        //reject an empty string
        if (str === '') {
            validate.is_valid = false;
            validate.error.message = messages.error.FORM_NAME_EMPTY;
        }
        else {
            //reject if not alphanumeric
            if (!consts.FORM_NAME_REGEX.test(str)) {
                validate.is_valid = false;
                validate.error.message = messages.error.FORM_NAME_INVALID;
            }
            else {

                if (is_adding_new_form) {
                    //check if the form name already exists (case insensitive)
                    $(forms).each(function (index, form) {
                        if (form.name.toLowerCase() === str.toLowerCase()) {
                            validate.is_valid = false;
                            validate.error.message = messages.error.FORM_NAME_EXIST;
                        }
                    });
                }
            }
        }

        return validate;
    },

    //check for empty string and the presence of either '|' or '_skipp3d_' which are reserved words/chars
    isQuestionTextValid: function (input) {

        var question = input.question;
        var str = question.trim();
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.QUESTION_PROPERTY
            }
        };
        if (str === '') {
            validate.is_valid = false;
            validate.error.message = messages.error.QUESTION_TEXT_EMPTY;
        }
        //readme text too long?
        if (input.type === consts.README_TYPE) {
            //convert any html entities to tags
            str = utils.decodeHtml(str);
            //strip tags
            str = str.replace(/(<([^>]+)>)/ig, '');
            //check REAL length
            if (str.trim().length > consts.LIMITS.readme_length) {
                validate.is_valid = false;
                validate.error.message = messages.error.QUESTION_LENGTH_LIMIT_EXCEEDED;
            }
        }

        //other questions text too long
        if (input.type !== consts.README_TYPE && str.length > consts.LIMITS.question_length) {
            validate.is_valid = false;
            validate.error.message = messages.error.QUESTION_LENGTH_LIMIT_EXCEEDED;
        }

        return validate;
    },

    isPossibleAnswerValid: function (the_possible_answer) {

        var str = the_possible_answer.trim();
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.QUESTION_PROPERTY
            }
        };

        if (str === '') {
            validate.is_valid = false;
            validate.error.message = messages.error.POSSIBLE_ANSWER_EMPTY;
        }
        return validate;
    },

    //check if this is valid against the input type or the regex
    isInitialAnswerValid: function (the_type, the_default, the_regex) {

        var str = the_default || '';
        var regex = the_regex;
        var type = the_type;
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.DEFAULT_PROPERTY
            }
        };

        str = str.trim();

        //does the initial answer pass the regex?
        if (regex && str) {
            if (!str.match(regex)) {
                validate.is_valid = false;
                validate.error.message = messages.error.INITIAL_ANSWER_NOT_MATCHING_REGEX;
            }
        }

        if (type === consts.PHONE_TYPE) {
            //is the initial answer a valid phone number format?
            //todo this is hairy, too many options
            //validate.is_valid = false;
            //validate.error.message = messages.error.INITIAL_ANSWER_NOT_PHONE_NUMBER;
        }


        return validate;
    },
    //convert value to a float and check if it is an integer
    isValueInt: function (n) {
        n = parseFloat(n);
        return Number(n) === n && n % 1 === 0;
    },
    //convert value to a float and check if it is a decimal or
    isValueFloat: function (n) {
        n = parseFloat(n);
        return n === Number(n) && n % 1 !== 0;
    },

    //is this right? todo double check this and maybe refactor integer/decimal validation in integer.js
    isMinMaxValueValid: function (type, value) {

        var minmax_value = value;
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.MAX_VALUE_PROPERTY
            }
        };

        if (type === consts.INTEGER_TYPE && minmax_value !== '') {
            //min must be an integer, not a float
            if (!this.isValueInt(minmax_value)) {
                validate.is_valid = false;
                validate.error.message = messages.error.VALUE_MUST_BE_INTEGER;
            }
        }
        return validate;
    },

    isJumpValid: function (the_jump, the_input) {

        var jump = the_jump;
        var input = the_input;
        var is_valid = true;
        var inputs;
        var jump_destinations;

        //if editing a branch, get jumps destinations within the active branch
        if (formbuilder.is_editing_branch) {
            inputs = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref).branch;
        }
        else {
            inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        }

        jump_destinations = utils.getJumpAvailableDestinations(input, inputs);

        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(jump.type) !== -1) {
            //multiple answers validation
            if (jump.to === undefined || jump.when === undefined) {
                is_valid = false;
            }

            //answer_ref in needed when IS ans IS NOT only
            if (jump.answer_ref === undefined) {
                if (jump.when === 'IS' || jump.when === 'IS_NOT') {
                    is_valid = false;
                }
            }
        }
        else {
            //single answer validation (it will always jump, so check if destination is set)
            if (jump.to === undefined) {
                is_valid = false;
            }
        }

        //check the destination is valid (the user might have dragged the input around)
        if (is_valid) {

            var refs = jump_destinations.map(function (destination) {
                return destination.ref;
            });


            if (refs.indexOf(jump.to) === -1) {
                is_valid = false;
                jump.has_valid_destination = false;
            }
            else {
                //remove jump.has_valid_destination just in case it was there from a previous error
                //this happens because I am mutating the object! shame on me, too much work refactoring ;)
                delete jump.has_valid_destination;
            }
        }
        return is_valid;
    },

    //todo I do not think this is used anymore
    isPossibleAnswerlinkedToJump: function (the_possible_answer, the_jumps) {

        var possible_answer = the_possible_answer;
        var jumps = the_jumps;
        var i;
        var iLength = jumps.length;
        var has_linked_jump = false;

        for (i = 0; i < iLength; i++) {
            if (jumps[i].answer_id === possible_answer.answer_id) {
                has_linked_jump = true;
                break;
            }
        }
        return has_linked_jump;
    },

    //perform validation on an input and optionally show toast notification
    performValidation: function (the_input, show_toast) {

        var input = the_input;
        var message;
        var ui = require('helpers/ui');
        var utils = require('helpers/utils');
        var undo = require('actions/undo');
        var question;
        var copy_btn_state = input.dom.is_valid ? consts.BTN_ENABLED : consts.BTN_DISABLED;
        /***************************************
         Save will implicitly run the validation!
         */
        save.saveAllInputProperties(input);
        /*************************************/

        //show visual feedback if the properties are valid
        if (input.dom.is_valid) {

            //update the just saved input showing a preview of the question text (limit to 50 chars)
            //strip html tags from readme type if any
            if (input.type === consts.README_TYPE) {

                //start with deconding the html
                question = utils.decodeHtml(input.question);
                //remove '<' and '>' from decoded string (as html entities)
                //tags already parsed (<b>, <i>, <u>) should go through
                //todo test this well
                var purifiedHtml = utils.replaceAllOccurrences(question, '&lt;', '\ufe64');
                purifiedHtml = utils.replaceAllOccurrences(purifiedHtml, '&gt;', '\ufe65');

                //remove link protocol
                purifiedHtml = utils.replaceAllOccurrences(purifiedHtml, 'http://', '');
                purifiedHtml = utils.replaceAllOccurrences(purifiedHtml, 'https://', '');

                //remove not allowed tags
                purifiedHtml = utils.stripTags(purifiedHtml, consts.README_ALLOWED_TAGS);

                //save purified question
                input.question = utils.encodeHtml(purifiedHtml);

                //remove ALL tags for preview only
                question = purifiedHtml.replace(/(<([^>]+)>)/ig, ' ');
                //wrap in double quotes to escape html in the preview so <br> do not get rendered
                ui.inputs_collection.showInputQuestionPreview(input.ref, '"' + question.trunc(consts.LIMITS.question_preview_length) + '"');
            }
            else {
                ui.inputs_collection.showInputQuestionPreview(input.ref, input.question.trunc(consts.LIMITS.question_preview_length));
            }

            //replace warning icon with green check
            ui.inputs_collection.showInputValidIcon(input.ref);

            //show question preview on input properties panel
            //strip html tags from readme type if any
            if (input.type === consts.README_TYPE) {
                question = utils.decodeHtml(input.question);
                question = question.replace(/(<([^>]+)>)/ig, ' ');
                //wrap in double quotes to escape html rendering in preview
                ui.input_properties_panel.showInputQuestionPreview('"' + question.trunc(20) + "");
            }
            else {
                ui.input_properties_panel.showInputQuestionPreview(input.question.trunc(20));
            }

            if (show_toast) {
                toast.showSuccess(messages.success.INPUT_VALID);
            }
            //enable save project button if all inputs are valid
            if (this.areAllInputsValid(formbuilder.project_definition)) {
                //console.log('** all good **');
                //enable save project button
                ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
                formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);

                //replace warning icon with green check on current form tab
                ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);

                //enable download form button on current form
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__export-form').removeClass('disabled');

                //enable prnt as pdf button
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__print-as-pdf').removeClass('disabled');
            }
            else {

                //check if inputs are all valid for current form only
                if (this.areFormInputsValid(formbuilder.current_form_index)) {
                    //replace warning icon with green check on current form tab
                    ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);

                    //enable download form button
                    formbuilder.dom.inputs_collection
                        .find('.inputs-collection__export-form').removeClass('disabled');

                    //enable print as pdf form button
                    formbuilder.dom.inputs_collection
                        .find('.inputs-collection__print-as-pdf').removeClass('disabled');
                }
                else {
                    //disable download form button
                    formbuilder.dom.inputs_collection
                        .find('.inputs-collection__export-form').addClass('disabled');

                    //disable print as pdf form button
                    formbuilder.dom.inputs_collection
                        .find('.inputs-collection__print-as-pdf').addClass('disabled');
                }
            }
        } else {
            if (input.question) {
                message = input.dom.error ? input.dom.error : input.question;
            }
            else {
                switch (input.type) {
                    case consts.BRANCH_TYPE:
                        message = messages.error.NO_BRANCH_HEADER_YET;
                        break;
                    case consts.GROUP_TYPE:
                        message = messages.error.NO_GROUP_HEADER_YET;
                        break;
                    default:
                        message = messages.error.NO_QUESTION_TEXT_YET;
                        break;
                }
            }

            //update question preview
            ui.inputs_collection.showInputInvalidIcon(input.ref);
            ui.inputs_collection.showInputQuestionPreview(input.ref, message);
            ui.input_properties_panel.showInputQuestionPreview(message);

            if (show_toast) {
                toast.showError(messages.error.INPUT_NOT_VALID, 2000);
            }

            //disable save project button
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
            formbuilder.dom.save_project_btn.off('click');

            //show warning icon on current form tab
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

            //disable download form button on current form
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__export-form').addClass('disabled');
            //disable print as pdf button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__print-as-pdf').addClass('disabled');
        }

        //toggle copy button (valid, enable button else disable)
        ui.input_properties_panel.toggleCopyInputButton(input.ref, copy_btn_state);
    },

    areAllInputsValid: function (project_definition) {
        var are_all_valid = true;
        var forms = project_definition.data.project.forms;

        loop1:
        for (var index = 0; index < forms.length; index++) {

            //do not accept forms with no inputs
            if (forms[index].inputs.length === 0) {
                are_all_valid = false;
                break;
            }

            for (var input_index = 0; input_index < forms[index].inputs.length; input_index++) {

                if (!forms[index].inputs[input_index].dom.is_valid) {
                    are_all_valid = false;
                    break loop1;
                }
            }
        }
        return are_all_valid;
    },

    areFormInputsValid: function (form_index) {

        var are_valid = true;
        var form = formbuilder.project_definition.data.project.forms[form_index];

        //do not accept forms with no inputs
        if (form.inputs.length === 0) {
            are_valid = false;
        }

        //loop all inputs to see if they are all valid
        $(form.inputs).each(function (index, input) {
            if (!input.dom.is_valid) {
                are_valid = false;
                return false;
            }
        });

        return are_valid;
    },

    // a branch is valid when the branch header is not empty and there is at least a valid branch question
    // also, all the branch questions need to pass validation to make a branch valid
    validateBranchInputs: function (the_branch_owner) {

        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.DEFAULT_PROPERTY
            }
        };

        var branch_owner = the_branch_owner;

        if (branch_owner.branch.length === 0) {
            validate.is_valid = false;
            validate.error.message = messages.error.NO_BRANCH_INPUTS_FOUND;
        }
        else {
            //check if ALL the branch inputs are valid and return as soon as the first invalid is found
            $(branch_owner.branch).each(function (index, input) {
                // console.log('** input dom is_valid for branches');
                // console.log(input.dom.is_valid);
                if (!input.dom.is_valid) {
                    validate.is_valid = false;
                    validate.error.message = messages.error.INVALID_BRANCH_INPUTS;
                    return false;
                }
            });
        }
        return validate;
    },

    // a group is valid when the group header is not empty and there is at least a valid group question
    // also, all the group questions need to pass validation to make a group valid
    validateGroupInputs: function (the_group_input) {

        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.DEFAULT_PROPERTY
            }
        };

        var group_input = the_group_input;

        if (group_input.group.length === 0) {
            validate.is_valid = false;
            validate.error.message = messages.error.NO_GROUP_INPUTS_FOUND;
        }
        else {
            //check if ALL the group inputs are valid and return as soon as the first invalid is found
            $(group_input.group).each(function (index, input) {
                if (!input.dom.is_valid) {
                    validate.is_valid = false;
                    validate.error.message = messages.error.INVALID_GROUP_INPUTS;
                    return false;
                }
            });
        }
        return validate;
    },

    validateJumpsAfterSorting: function (inputs) {

        var self = this;
        var ui = require('helpers/ui');
        var inputs_to_validate = inputs;
        var jumps_list_wrapper_dom;
        var jumps_dom;
        var jump_dom;

        //validate previous inputs based and current one
        for (var index = 0; index < inputs_to_validate.length; index++) {

            var input = inputs_to_validate[index];
            var are_jumps_valid = true;

            //hide all errors for a jump in the dom
            jumps_list_wrapper_dom = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + input.ref + '"]')
                .find('.input-properties__form__jumps .input-properties__form__jumps__list');

            jumps_dom = jumps_list_wrapper_dom.find('li');

            //hide all the jumps error
            input.hideJumpsErrors(jumps_dom);

            for (var jump_index = 0; jump_index < input.jumps.length; jump_index++) {

                var jump = input.jumps[jump_index];

                // Assume the index of the <li> in the list is the same of the index in the jumps object
                jump_dom = jumps_dom.eq(jump_index);

                //todo if any error, highlight the wrong destination in the markup
                if (!self.isJumpValid(jump, input)) {

                    //show errors
                    input.showSingleJumpErrors(jump_dom, jump);

                    //keep track the jumps now are invalid
                    are_jumps_valid = false;

                    //set input in the dom as invalid, and also the form if it is the only invalid one
                    ui.inputs_collection.showInputInvalidIcon(input.ref);
                }
                else {
                    //todo what if I have multiple jumps with errors?
                    ui.input_properties_panel.hideJumpTabError(jump_dom);
                }
            }

            //Is the input valid aside from the jumps? That would mean all the jumps were ok, but there might be other errors
            //we just need to check the object properties, as they do not change when sorting
            input.dom.is_valid = self.isInputObjectValid(input) && are_jumps_valid;

            //set input validation icon accordingly
            if (input.dom.is_valid) {
                ui.inputs_collection.showInputValidIcon(input.ref);
            }
            else {
                ui.inputs_collection.showInputInvalidIcon(input.ref);
            }
        }


        //check if the form is now valid
        if (self.areFormInputsValid(formbuilder.current_form_index)) {
            ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);

            //enable download form button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__export-form').removeClass('disabled');

            //enable print as pdf form button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__print-as-pdf').removeClass('disabled');
        }
        else {
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

            //disable form download button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__export-form').addClass('disabled');

            //disable print as pdf download button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__print-as-pdf').addClass('disabled');
        }

        //check if all inputs are now valid to enable save project button
        if (self.areAllInputsValid(formbuilder.project_definition)) {
            ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
        }
        else {
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
        }
    },

    isInputObjectValid: function (input) {

        var self = this;
        var is_valid = true;

        //check question text ***********************************************************
        if (!self.isQuestionTextValid(input).is_valid) {
            is_valid = false;
        }
        //*******************************************************************************

        //test min and max for integer **************************************************
        if (input.type === consts.INTEGER_TYPE) {

            //is min a int?
            if (input.min !== '') {
                if (!self.isValueInt(input.min)) {
                    is_valid = false;
                }
            }

            //is max a int?
            if (input.max !== '') {
                if (!self.isValueInt(input.max)) {
                    is_valid = false;
                }
            }

            //If both are set, are they valid?
            if (is_valid && (input.min !== '' && input.max !== '')) {
                if (parseFloat(input.min) > parseFloat(input.max)) {
                    is_valid = false;
                }
            }

            //if the default answer is set, is it valid?
            if (input.default !== '') {
                if (!self.isValueInt(input.default)) {
                    is_valid = false;
                }
                else {
                    //default answer is a valid int, is it within range?
                    if (input.min !== '' && parseInt(input.default, 0) < input.min) {
                        is_valid = false;
                    }
                    if (input.min !== '' && parseInt(input.default, 0) > input.max) {
                        is_valid = false;
                    }
                }
            }
        }
        //*******************************************************************************

        //test min and max for decimal (float) ******************************************
        if (input.type === consts.DECIMAL_TYPE) {
            //is min a float or an integer?
            if (input.min !== '') {
                if (!(self.isValueFloat(input.min) || self.isValueInt(input.min))) {
                    is_valid = false;
                }
            }

            //is max a float or integer?
            if (input.max !== '') {
                if (!(self.isValueFloat(input.max) || self.isValueInt(input.max))) {
                    is_valid = false;
                }
            }

            //If both are set, are they valid?
            if (is_valid && (input.min !== '' && input.max !== '')) {
                if (parseFloat(input.min) > parseFloat(input.max)) {
                    is_valid = false;
                }
            }

            //if the default answer is set, is it valid?
            if (input.default !== '') {
                if (!(self.isValueFloat(input.default) || self.isValueInt(input.default))) {
                    is_valid = false;
                }
                else {
                    //default answer is a valid number, is it within range?
                    if (input.min !== '' && parseFloat(input.default) < input.min) {
                        is_valid = false;
                    }
                    if (input.min !== '' && parseFloat(input.default) > input.max) {
                        is_valid = false;
                    }
                }
            }
        }
        //*******************************************************************************

        //check possible answers for multiple answer types ******************************
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type !== -1)) {
            $(input.possible_answers).each(function (index, possible_answer) {
                if (!self.isPossibleAnswerValid(possible_answer.answer).is_valid) {
                    is_valid = false;
                }
            });
        }
        //*******************************************************************************

        //group type but empty? *********************************************************
        if (input.type === consts.GROUP_TYPE && input.group.length === 0) {
            is_valid = false;
        }
        //*******************************************************************************

        //branch type but empty? ********************************************************
        if (input.type === consts.BRANCH_TYPE && input.branch.length === 0) {
            is_valid = false;
        }
        //*******************************************************************************

        return is_valid;
    }
    ,

    validateBeforeSaving: function (form_ref, inputs) {

        var validate = {
            is_valid: true,
            error: {
                message: null
            }
        };
        var invalid_question = '';
        var are_inputs_valid = true;
        var are_branch_inputs_valid = true;
        $(inputs).each(function (index, input) {
            if (!import_form_validation.isValidInput(form_ref, input, false, false)) {
                console.log(JSON.stringify(input));
                invalid_question = input.question.trunc(50);
                are_inputs_valid = false;
                return false;//exit loop only
            }
        });
        var questions_total;

        if (!are_inputs_valid) {
            validate = {
                is_valid: false,
                error: {
                    message: invalid_question
                }
            };
            return validate;
        }

        //check total number of questions/branches
        questions_total = utils.getInputsTotal(inputs);
        if (questions_total > consts.INPUTS_MAX_ALLOWED) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.TOO_MANY_QUESTIONS_FOR_CURRENT_FORM + questions_total + ', limit is ' + consts.INPUTS_MAX_ALLOWED + '!'
                }
            };
            return validate;
        }

        //check total number of titles (main form)
        if (utils.isMaxTitleLimitExceeded(inputs)) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.TOO_MANY_TITLES
                }
            };
            return validate;
        }
        //check total number of titles (branches)
        $(inputs).each(function (index, input) {
            if (utils.isMaxTitleLimitExceeded(input.branch)) {
                are_branch_inputs_valid = false;
                return false;
            }
        });

        if (!are_branch_inputs_valid) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.TOO_MANY_TITLES + ' (branch)'
                }
            };
            return validate;
        }

        //check jumps destinations
        if (!import_form_validation.areJumpsDestinationsValid(inputs)) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.JUMPS_INVALID
                }
            };
            return validate;
        }

        //check total number of search inputs
        if (utils.getSearchInputsTotal() > consts.LIMITS.search_inputs_max) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.TOO_MANY_SEARCH_QUESTIONS
                }
            };
            return validate;
        }

        return validate;
    }
}
    ;

module.exports = validation;

