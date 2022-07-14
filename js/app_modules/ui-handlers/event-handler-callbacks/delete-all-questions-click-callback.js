/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var toast = require('config/toast');
var utils = require('helpers/utils');

var callback = function (files) {

    var undo = require('actions/undo');
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;


    //show overlay and cursor
    formbuilder.dom.overlay.fadeIn(consts.ANIMATION_FAST);

    //delete all inputs from dom
    $(inputs).each(function (index, input) {
        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties
            .find('div.panel-body form[data-input-ref="' + input.ref + '"]')
            .fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable
            .find('div.input[data-input-ref="' + input.ref + '"]')
            .fadeOut(consts.ANIMATION_FAST).remove();
    });

    //delete all question from project definition
    formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs = [];

    //after deletion no input is selected, show message and hide context buttons
    formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
    //hide action button for input
    formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

    //remove track of any inputs
    formbuilder.current_input_ref = undefined;

    //re calculate search questions total
    if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max - 1)) {
        ui.input_tools.showSearchInput();
    }

    //remove title warning if any
    ui.inputs_collection.toggleTitleWarning(1,false);

    //set form as invalid
    ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

    //disable save project button
    ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);

    //show import form button
    formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').removeClass('hidden');

    //handle the undo...can we go back?
    ui.navbar.toggleUndoBtn(consts.BTN_ENABLED);

    //hide overlay
    window.setTimeout(function () {
        formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
    }, 1000);

};

module.exports = callback;
