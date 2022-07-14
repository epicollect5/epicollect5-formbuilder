/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var validation = require('actions/validation');
var form_factory = require('factory/form-factory');

var callback = function (e) {

    var target = $(this);
    var href = target.attr('href');
    var form_ref = target.attr('href').substring(1, href.length - 9);
    var forms = formbuilder.project_definition.data.project.forms;
    var inputs;
    var is_last_child_form;
    var active_input;


    //ignore clicks on active tab
    if (target.parent().hasClass('active')) {
        return;
    }

    //validate active input (if any) before switching
    if (formbuilder.current_input_ref) {
        active_input = utils.getInputObjectByRef(formbuilder.current_input_ref);
    }

    //validate previous input (if any, I might have only one left) when user goes to another input, but do not show toast
    if (active_input) {
        validation.performValidation(active_input, false);
    }

    //unbind current panel handlers before switching
    form_factory.unbindFormPanelsEvents();

    //update formbuilder dom references to point to the selected form markup
    form_factory.updateFormbuilderDomReferences(form_ref);

    //bind events to active form
    form_factory.bindFormPanelsEvents();

    //get active input for the selected form (if any)
    var active_input_ref = formbuilder.dom.inputs_collection_sortable.find('.active').attr('data-input-ref');

    //switch form to selected one
    formbuilder.current_form_index = parseInt(target.attr('data-form-index'), 10);
    formbuilder.current_form_ref = forms[formbuilder.current_form_index].ref;

    //remove any reference to selected input
    //todo check this as we might need to run a validation before switching tab
    formbuilder.current_input_ref = active_input_ref;

    is_last_child_form = formbuilder.current_form_index === forms.length - 1;
    //enable delete button if the active child form is the last child
    if (is_last_child_form) {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__buttons--remove-form')
            .attr('disabled', false);
    }
    else {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__buttons--remove-form')
            .attr('disabled', true);
    }

    inputs = forms[formbuilder.current_form_index].inputs;

    //if the new active form does not have a title set, show warning
    //show no title warning (if no title set for the first form)
    if (utils.getTitleCount(inputs) === 0 && inputs.length > 0) {
        ui.inputs_collection.toggleTitleWarning(0, false);
    }

    //if no inputs, disable download form button
    if (inputs.length === 0) {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').addClass('disabled');

        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').addClass('disabled');
    }
    else {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').removeClass('disabled');

        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').removeClass('disabled');
    }

    //toggle form icon to a green chck if the top parent form is valid
    if (validation.areFormInputsValid(formbuilder.current_form_index)) {
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
};

module.exports = callback;
