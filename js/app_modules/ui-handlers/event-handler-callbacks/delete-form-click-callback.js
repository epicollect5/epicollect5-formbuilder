/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var validation = require('actions/validation');


var callback = function (e) {

    var undo = require('actions/undo');
    var form_factory = require('factory/form-factory');
    var form_ref = formbuilder.current_form_ref;
    var form_tab = formbuilder.dom.forms_tabs.find('.active');
    var previous_tab_trigger = form_tab.prev().find('a');
    var previous_form_ref = previous_tab_trigger.attr('href');
    var forms = formbuilder.project_definition.data.project.forms;

    //if current form index === 0, do not delete as this is the first form
    if(formbuilder.current_form_index === 0) {
        //cannot delete top parent form
        toastr.error(messages.error.FORM_CANNOT_BE_DELETED);
        return;
    }

    //if the current form is not the last in the hierarchy, do not delete it
    if(formbuilder.current_form_index !== (forms.length - 1)) {
        //cannot delete top parent form
        toastr.error(messages.error.FORM_CANNOT_BE_DELETED);
        return;
    }

    previous_form_ref = previous_form_ref.substring(1, previous_form_ref.length - 9);
    //after the form to be deleted is hidden, delete it and unbind the callback
    previous_tab_trigger.on('shown.bs.tab', function (e) {

        form_factory.removeForm(previous_form_ref, form_ref, form_tab);

        //show toast
        toastr.warning(messages.warning.FORM_DELETED);
        undo.pushState();

        previous_tab_trigger.off();

        //run validation, the removed form night have been the only one with invalid inputs
        if (validation.areAllInputsValid(formbuilder.project_definition)) {
            ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
        }

        //show search input if we deleted some search qestions
        if (utils.getSearchInputsTotal() <= consts.LIMITS.search_inputs_max) {
            ui.input_tools.showSearchInput();
        }
    });

    //unbind current panel handlers before switching
    form_factory.unbindFormPanelsEvents();

    //update formbuilder dom references to point to the selected form markup
    form_factory.updateFormbuilderDomReferences(previous_form_ref);

    //bind events to active form
    form_factory.bindFormPanelsEvents();

    //switch to previous form
    form_tab.prev().find('a').tab('show');
};

module.exports = callback;
