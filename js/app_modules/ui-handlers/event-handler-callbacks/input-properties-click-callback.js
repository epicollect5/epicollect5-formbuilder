/* global $, toastr, File, saveAs*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var validation = require('actions/validation');
var input_duplicator = require('actions/input-duplicator');
var toast = require('config/toast');

/*
 handle click action on input properties panel in the right sidebar (use event delegation)
 we check the class of the target element to trigger the proper action
 */
var callback = function (e) {

    console.log('properties panel clicked.');

    var undo = require('actions/undo');
    var possible_answers = require('actions/possible-answers');
    var input_factory = require('factory/input-factory');
    //get hold of the current active input in the input collection (middle column)
    var input = utils.getInputObjectByRef(formbuilder.current_input_ref);
    var first_input_ref;
    var nested_group;
    var owner_branch;
    //get hold of tapped element dom element
    var target = $(this);
    var csv;
    var form_index = formbuilder.current_form_index;
    var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;

    formbuilder.render_action = consts.RENDER_ACTION_DO;

    function _getInput() {

        //check whether we are validatin a nested input i.e. BOTH branch AND group edit flags are true
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //get nested group input
            owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = utils.getNestedGroupInputObjectByRef(owner_branch, formbuilder.group.current_input_ref);
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

    function _validateBranch() {

        //check the branch has got at least 1 input left

        var active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);

        if (active_branch.branch.length > 0) {
            validation.performValidation(active_branch.branch[0], false);
        }
        else {
            //invalid the form as it does not have any inputs
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

            //disable save project button
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
            formbuilder.dom.save_project_btn.off('click');
        }
    }

    function _validateForm() {

        var form_index = formbuilder.current_form_index;

        if (formbuilder.project_definition.data.project.forms[form_index].inputs.length > 0) {
            first_input_ref = formbuilder.project_definition.data.project.forms[form_index].inputs[0].ref;
            if (first_input_ref) {
                validation.performValidation(utils.getInputObjectByRef(first_input_ref), false);
            }
        }
        else {
            //invalid the form as it does not have any inputs
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

            //disable save project button
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
            formbuilder.dom.save_project_btn.off('click');

            //add no question message
            formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').removeClass('hidden');
        }
    }

    //get hold of advanced properties panel for this input
    input.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + input.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    /***************************************************************
     * Remove selected input
     **************************************************************/
    if (target.hasClass('input-properties__buttons--remove-input')) {

        //re-nable draggable if needed
        if ($('ul#inputs-tools-list li div.input').hasClass('dragging-disabled')) {
            ui.input_tools.enable();
        }

        //enable save project button
        ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);

        //check whether we are validatin a nested input i.e. BOTH branch AND group edit flags are true
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {

            //remove nested group
            input_factory.removeNestedGroupInput(formbuilder.branch.active_branch_ref, formbuilder.group.current_input_ref);
            toastr.warning(messages.warning.INPUT_DELETED);
            _validateForm();
            //push state to enable undoing the action (deleting input)
            undo.pushState();
            return;
        }
        else {

            //nested group?
            if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
                //to handle nested group
            }
            else {

                if (formbuilder.is_editing_branch) {
                    input_factory.removeBranchInput(input.ref, formbuilder.branch.current_input_ref);
                    toastr.warning(messages.warning.INPUT_DELETED);

                    //run validation as I might have deleted the only invalid input for the branch
                    //since there is not a previous one, so it uses the first input of the top parent form (if any) just to trigger the validation
                    _validateBranch();

                    //push state to enable undoing the action (deleting input)
                    undo.pushState();
                    return;
                }

                if (formbuilder.is_editing_group) {
                    input_factory.removeGroupInput(input.ref, formbuilder.group.current_input_ref);
                    toastr.warning(messages.warning.INPUT_DELETED);
                    //push state to enable undoing the action (deleting input)
                    undo.pushState();
                    return;
                }
            }

            //remove input from input collection (also remove its properties)
            input_factory.removeInput(input.ref);
            toastr.warning(messages.warning.INPUT_DELETED);

            //todo I need to do the same for branches, groups and nested groups
            //run validation as I might have deleted the only invalid input
            //there is not a previous one, so it uses the first input of the top parent form (if any)
            _validateForm();
            //push state to enable undoing the action (deleting input)
            undo.pushState();

            //show message and import button when no inputs left

            //remove no questions message and upload button, as now we have at least 1 input
            //todo avoid to to this all the time?
            if (inputs.length === 0) {
                formbuilder.dom.inputs_collection
                    .find('.input-properties__no-questions-message')
                    .hide()
                    .removeClass('hidden')
                    .fadeIn();

                //hide title warning message, passing a count > 1
                ui.inputs_collection.toggleTitleWarning(1, false);

                //disable download form button
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__export-form').addClass('disabled');

                //disable print as pdf form button
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__print-as-pdf').addClass('disabled');
            }
            return;
        }
    }

    /***************************************************************
     * Copy selected input
     **************************************************************/
    if (target.hasClass('input-properties__buttons--copy-input')) {
        console.log('copying input ***************************************************');

        var input_copied;
        var search_inputs_total = utils.getSearchInputsTotal();

        input = _getInput();

        //if the input is not valid, reject copy action
        if (!input.dom.is_valid) {
            toast.showError(messages.error.INPUT_NOT_VALID);
            return;
        }

        //if we reached the max number of questions for this form, bail out
        if (utils.getInputsTotal(inputs) >= consts.INPUTS_MAX_ALLOWED) {
            toast.showError(messages.error.MAX_QUESTIONS_LIMIT_REACHED + ' ('+ consts.INPUTS_MAX_ALLOWED+')');
            ui.input_tools.disable();
            return;
        }

        //if the input is of type search and we reached the limit already, bail out
        if(input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {

            //warn the user if limit was reached
            if (search_inputs_total === consts.LIMITS.search_inputs_max) {
                toast.showError(messages.warning.SEARCH_INPUTS_LIMIT_REACHED + '(' + consts.LIMITS.search_inputs_max + ')');
                return;
            }
            //if we are reaching the search input limits with this copy, hide search question tool
            if (search_inputs_total === consts.LIMITS.search_inputs_max - 1) {
                //hide search input from question list
                ui.input_tools.hideSearchInput();
            }
        }

        //show overlay
        formbuilder.dom.overlay.fadeIn();

        //get copy if original input
        input_copied = input_duplicator.createInputCopy(input);

        //add copied input to project definition
        input_duplicator.pushInput(input_copied);

        //append the copied input markup
        input_duplicator.appendInputToDom(input_copied);

        //hide overlay (with delay)
        window.setTimeout(function () {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST, function () {
                toast.showSuccess(messages.success.INPUT_COPIED);
            });
        }, consts.ANIMATION_SLOW);
    }

    /***************************************************************
     * Validate selected input
     **************************************************************/
    if (target.hasClass('input-properties__buttons--validate-input')) {
        validation.performValidation(_getInput(), true);
    }

    /***************************************************************
     * Add possible answer
     **************************************************************/
    if (target.hasClass('input-properties__form__possible-answers__add-answer')) {

        var possible_answers_max = consts.LIMITS.possible_answers_max;

        input = _getInput();

        if (input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {
            possible_answers_max = consts.LIMITS.possible_answers_max_search;
        }

        //add possible answer (if total is less than max allowed)
        if (input.possible_answers.length < possible_answers_max) {
            input.addPossibleAnswer();
            undo.pushState();
        }
    }

    /***************************************************************
     * Remove possible answer
     **************************************************************/
    if (target.hasClass('input-properties__form__possible-answers__list__remove-answer')) {

        input = _getInput();

        //we need to leave at least 1 possible answer
        if (input.possible_answers.length >= 2) {
            input.removePossibleAnswer(target.closest('li').index());
            undo.pushState();
        }
    }

    /***************************************************************
     * Add jump to selected input
     **************************************************************/
    if (target.hasClass('input-properties__form__jumps__add-jump')) {

        input = _getInput();

        //disable save project button as the new added jump makes the input invalid
        ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);

        //set input as invalid
        input.dom.is_valid = false;

        //flag input dom in input collection as invalid
        ui.inputs_collection.showInputInvalidIcon(input.ref);

        //flag current form as invalid
        ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

        input.addJump();
        undo.pushState();
    }

    /***************************************************************
     * Remove selected jump
     **************************************************************/
    if (target.hasClass('input-properties__form__jumps__remove-jump')) {

        input = _getInput();

        input.removeJump(target);

        //revalidate input after deleting a jump as the jump might have been the only thing keeping it invalid
        validation.performValidation(input, false);
        undo.pushState();
    }

    /***************************************************************
     * Edit branch
     **************************************************************/
    if (target.hasClass('input-properties__form__edit-branch')) {
        target.attr('disabled', true);
        input.enterBranchSortable();
    }
    if (target.hasClass('input-properties__form__exit-branch-editing')) {
        target.attr('disabled', true);
        target.prev('.input-properties__form__edit-branch').attr('disabled', false);
        input.exitBranchSortable();
    }

    /***************************************************************
     * Edit group
     **************************************************************/
    if (target.hasClass('input-properties__form__edit-group')) {
        target.attr('disabled', true);

        //check whether we are editing a group nested into a branch
        if (formbuilder.is_editing_branch) {

            nested_group = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);

            if (nested_group) {
                //user clicked on edit nested group button
                input = nested_group;
                input.enterGroupSortable(true);
            }
        }
        else {
            input.enterGroupSortable(false);
        }
    }

    if (target.hasClass('input-properties__form__exit-group-editing')) {
        target.attr('disabled', true);
        target.prev('.input-properties__form__edit-branch').attr('disabled', false);

        //check whether we are editing a group nested into a branch
        if (formbuilder.is_editing_branch) {
            nested_group = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);

            if (nested_group) {
                //user clicked on edit nested group button
                input = nested_group;
                input.exitGroupSortable(true);
            }
        }
        else {
            input.exitGroupSortable(false);
        }
    }

    if (target.hasClass('possible_answers__export-csv')) {

        //show overlay and cursor
        formbuilder.dom.overlay.fadeIn(0);

        csv = possible_answers.exportPossibleAnswersCSV();

        window.setTimeout(function () {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);

            if (csv) {
                //do export
                var file;

                try {
                    file = new File([csv.data], csv.filename, { type: 'text/plain:charset=utf-8' });
                    saveAs(file);
                }
                catch (error) {
                    //Microsoft browsers?
                    if (navigator.msSaveBlob) {
                        return navigator.msSaveBlob(new Blob([csv.data], { type: 'text/plain:charset=utf-8' }), csv.filename);
                    }
                    else {
                        //browser not supported yet
                        toast.showError(messages.error.BROWSER_NOT_SUPPORTED);
                    }
                }
            }
            else {
                //show error
                toast.showError(messages.error.POSSIBLE_ANSWERS_INVALID);
            }
        }, consts.ANIMATION_SUPER_SLOW);
    }

    if (target.hasClass('possible_answers__import-csv')) {

        //import file first then show modal to pick which column (if more than one)
        //todo not use window, use formbuilder object
        if (!formbuilder.isOpeningFileBrowser) {

            var file_input = target.find('.possible_answers__import-csv-input-file');

            formbuilder.isOpeningFileBrowser = true;

            file_input.off('change').on('change', function () {
                possible_answers.importCSVFile(this.files);
                $(this).val(null);
            });

            target.find('.possible_answers__import-csv-input-file').trigger('click');
        }

        //to avoid a infinte loop (since we are triggering the click event)
        //we remove the flag later, to be able to upload another file
        //even if the user tapped on "cancel"
        window.setTimeout(function () {
            formbuilder.isOpeningFileBrowser = false;
        }, 3000);

    }

    if (target.hasClass('possible_answers__delete-all')) {
        possible_answers.deleteAllAnswers();
    }

    if (target.hasClass('possible_answers__order-az')) {
        possible_answers.orderPossibleAnswers(consts.POSSIBLE_ANSWERS_ORDER.AZ);
    }

    if (target.hasClass('possible_answers__order-za')) {
        possible_answers.orderPossibleAnswers(consts.POSSIBLE_ANSWERS_ORDER.ZA);
    }

    if (target.hasClass('possible_answers__order-shuffle')) {
        possible_answers.orderPossibleAnswers(consts.POSSIBLE_ANSWERS_ORDER.SHUFFLE);
    }

};

module.exports = callback;
