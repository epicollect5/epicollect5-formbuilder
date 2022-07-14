/* global $, Ftoastr*/
'use strict';
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var save = require('actions/save');

var callback = function () {

    var count;
    var inputs = [];
    var active_input;
    var active_branch;

    if (formbuilder.is_editing_branch) {

        active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);

        //group in a branch?
        if (formbuilder.is_editing_group) {
            //set active input to be the active group input
            active_input = utils.getNestedGroupInputObjectByRef(active_branch, formbuilder.group.current_input_ref);
        }
        else {
            active_input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
        }

        //save current input
        save.saveProperties(active_input);

        inputs = active_branch.branch;
        count = utils.getTitleCount(inputs);
        ui.inputs_collection.toggleTitleWarning(count, true);

    }
    else {
        //is it a group?
        if (formbuilder.is_editing_group) {
            //set active input to be the active group input
            active_input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        }
        else {
            //form level input
            active_input = utils.getInputObjectByRef(formbuilder.current_input_ref);
        }
        //save current input
        save.saveProperties(active_input);

        inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        count = utils.getTitleCount(inputs);
        //if there is not any title set form the form, show warning
        ui.inputs_collection.toggleTitleWarning(count, false);
    }
};

module.exports = callback;
