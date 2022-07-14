/* global $, toastr*/
'use strict';
var messages = require('config/messages');
var validation = require('actions/validation');
var errors = require('actions/errors');
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var form_factory = require('factory/form-factory');
var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');
var undo = require('actions/undo');

var callback = function (evt) {

    var target = $(evt.relatedTarget);// Button that triggered the modal
    var modal = $(this);
    var form_name_input;
    var form_ref;
    var is_adding_new_form = false;
    var form = {};
    var next_form_index;

    //get partial
    modal.html(formbuilder.dom.partials.modal_edit_form_name);
    form_name_input = modal.find('.modal-body input');

    //validate on keyup for better UX todo
    form_name_input.on('keyup', function () {
        console.log('activated');
    });

    if (target.hasClass('main__tabs_add-form')) {
        console.log('************ - add new form - **************');
        //todo
        is_adding_new_form = true;
        form_ref = utils.generateFormRef();
        next_form_index = formbuilder.project_definition.data.project.forms.length;
    }
    else {
        //set current form name in modal
        form_name_input.val(formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].name);
        form_ref = formbuilder.current_form_ref;
    }

    //bind save changes button
    $('.main__modal--edit-form-name__save-btn').off().on('click', function () {

        //get updated value
        var name = form_name_input.val();
        var is_form_name_valid;
        var form_index = formbuilder.current_form_index;
        var forms = formbuilder.project_definition.data.project.forms;

        //hide errors
        errors.hideFormNameErrors(modal);

        //validate form name
        is_form_name_valid = validation.isFormNameValid(name, is_adding_new_form);

        if (!is_form_name_valid.is_valid) {
            //show errors
            errors.showFormNameErrors(modal, is_form_name_valid.error.message);
        }
        else {

            //disable button to avoid double clicks
            $(this).off().attr('disabled', true);

            if (is_adding_new_form) {

                //add child form
                form_factory.createChildForm(name, form_ref, next_form_index, true);

                //disable save project button as we do not accept empty forms
                ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);

                undo.pushState();
            }
            else {
                //update name for current form
                formbuilder.project_definition.data.project.forms[form_index].name = name;
                formbuilder.project_definition.data.project.forms[form_index].slug = utils.slugify(name);

                //show name of form in tab and inputs collection container, truncating form name (>10) for UI purposes
                formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name')
                    .text(name.trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2)));

                //tab, target the active one
                formbuilder.dom.forms_tabs.find('.active a')
                    .text(name.trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2)))
                    .append('&nbsp;<i class="form-state fa fa-check"></i>');

                //enable save project button
                ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
                formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);
            }

            //hide add child form button if the form total is MAX_NUMBER_OF_NESTED_CHILD_FORMS
            if (formbuilder.project_definition.data.project.forms.length === consts.MAX_NUMBER_OF_NESTED_CHILD_FORMS) {
                formbuilder.dom.forms_tabs.find('.main__tabs_add-form').parent().hide();
            }

            //resize form tabs
            ui.forms_tabs.resizeFormTabs();

            //close modal (with a little delay for better UX, no FOUC)
            window.setTimeout(function () {
                modal.modal('hide');
                //force a backdrop removal as sometimes it is triggered twice
                $('.modal-backdrop').remove();
            }, 100);
        }
    });
};

module.exports = callback;


