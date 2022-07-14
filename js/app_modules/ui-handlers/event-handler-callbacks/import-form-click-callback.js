/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var toast = require('config/toast');
var utils = require('helpers/utils');
var validation = require('actions/validation');
var parser = {
    getBranchInputsHTML: require('actions/parse/methods/getBranchInputsHTML'),
    getGroupInputsHTML: require('actions/parse/methods/getGroupInputsHTML'),
    renderInputs: require('actions/parse/methods/renderInputs'),
    renderProject: require('actions/parse/methods/renderProject'),
    renderChildForms: require('actions/parse/methods/renderChildForms'),
    initFormbuilder: require('actions/parse/methods/initFormbuilder')
};

var import_form_validation = require('helpers/import-form-validation');
var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');

var callback = function (files) {

    var undo = require('actions/undo');
    var file = files[0];
    var file_parts;
    var file_ext;

    //show overlay and cursor
    formbuilder.dom.overlay.fadeIn(consts.ANIMATION_FAST);

    //if the user cancels the action
    if (!file) {
        //hide overlay
        formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
        toastr.error(messages.error.FORM_FILE_INVALID);
        return;
    }

    file_parts = file.name.split('.');
    file_ext = file_parts[file_parts.length - 1];

    console.log(file);

    //it must be json
    if (file_ext !== consts.FORM_FILE_EXTENSION) {
        //hide overlay
        formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
        toastr.error(messages.error.FORM_FILE_INVALID);
        return;
    }

    //todo skip MIME type validation on the front end as it is a mess
    //json format according to epicollect5 api
    //if (file.type !== consts.FORM_FILE_ACCEPTED_TYPE) {
    //hide overlay
    //     formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
    //     toastr.error(messages.error.FORM_FILE_INVALID);
    //     return;
    // }

    var reader = new FileReader();

    reader.onload = function (e) {

        var json_text = e.target.result;
        var form;
        var current_form_ref;
        var imported_form_ref;
        var regex;
        var inputs;
        try {
            form = JSON.parse(json_text);
        }
        catch (error) {
            //hide overlay
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            //it means the json is in invalid format
            toastr.error(messages.error.FORM_FILE_INVALID);
            return;
        }


        //validate form structure
        if (!import_form_validation.hasValidFormStructure(form)) {
            //hide overlay
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            //it means the structure is invalid
            toastr.error(messages.error.FORM_FILE_INVALID);
            return;
        }

        //grab inputs
        inputs = form.data.form.inputs;

        //are there any inputs?
        if (inputs.length === 0) {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            toastr.error(messages.error.FORM_FILE_INVALID);
            return;
        }

        //is inputs array?
        if (!$.isArray(inputs)) {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            toastr.error(messages.error.FORM_FILE_INVALID);
            return;
        }
        else {
            var are_valid_inputs = true;
            $(inputs).each(function (index, input) {
                if (!import_form_validation.isValidInput(form.data.form.ref, input, false, false)) {
                    console.log(input);
                    console.log(JSON.stringify(input));
                    are_valid_inputs = false;
                    return false;
                }
            });

            if (!are_valid_inputs) {
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }

            //check total number of questions/branches
            if (utils.getInputsTotal(inputs) > consts.INPUTS_MAX_ALLOWED) {
                //hide overlay
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }

            //check total number of titles (main form)
            if (utils.isMaxTitleLimitExceeded(inputs)) {
                //hide overlay
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }
            //check total number of titles (branches)
            var are_branch_inputs_valid = true;
            $(inputs).each(function (index, input) {
                if (utils.isMaxTitleLimitExceeded(input.branch)) {
                    are_branch_inputs_valid = false;
                    return false;
                }
            });

            if (!are_branch_inputs_valid) {
                //hide overlay
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }

            //check jumps destinations
            if (!import_form_validation.areJumpsDestinationsValid(inputs)) {
                //hide overlay
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }
        }

        //we need to use the current form ref
        current_form_ref = formbuilder.current_form_ref;
        imported_form_ref = form.data.form.ref;
        regex = new RegExp(imported_form_ref, 'g');

        //replace imported form ref with current form ref(all occurrrences)
        json_text = json_text.replace(regex, current_form_ref);
        form = JSON.parse(json_text);

        // temporarly setup inputs with the current_form_ref in formbuilder global object (so it can pass jump destinations validation when parsing, and also to render jumps properly in the dom)
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index]
            .inputs = form.data.form.inputs.slice();

        //parse the form and add the markup then.
        var renderedInputs = parser.renderInputs(form.data.form.inputs);

        //remove no questions message (if any inputs)
        if (renderedInputs.length > 0) {
            formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').addClass('hidden');
        }

        //show no title warning (if no title set for the first form)
        if (utils.getTitleCount(renderedInputs) === 0) {
            ui.inputs_collection.toggleTitleWarning(0, false);
        }

        //toggle form icon to a green check if the top parent form is valid
        if (validation.areFormInputsValid(formbuilder.current_form_index)) {
            ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);
            //enable download form button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__export-form').removeClass('disabled');

            //enable print as pdf form button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__print-as-pdf').removeClass('disabled');
        }

        //replace object literal inputs with newly generated ones via factory (i.e. using new) so they get the prototype
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs = renderedInputs.slice();//by value


        //enable save project button if all inputs are valid
        if (validation.areAllInputsValid(formbuilder.project_definition)) {

            //enable save project button (if disabled)
            ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);

            //reset some flags
            formbuilder.current_input_ref = null; //no input is selected

            formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);
        }

        //if there are too many search inputs, hide the search input tool in the sidebar
        if (utils.getSearchInputsTotal() >= consts.LIMITS.search_inputs_max) {
            ui.input_tools.hideSearchInput();

            //also show warning
            //show warning to user
            toast.showWarning(messages.warning.SEARCH_INPUTS_LIMIT_REACHED + '(' + consts.LIMITS.search_inputs_max + ')');
        }

        window.setTimeout(function () {
            //hide overlay
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_SLOW);
            //show success toast
            toastr.success(messages.success.FORM_IMPORTED);
            //push state for undo
            undo.pushState();
        }, consts.ANIMATION_SLOW);
    };

    reader.readAsText(file);
};

module.exports = callback;
