/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');

var saveAllInputProperties = function (the_input) {

    var input = the_input;
    var ui = require('helpers/ui');
    var utils = require('helpers/utils');
    var validation = require('actions/validation');
    var active_branch;
    var active_group;
    var branch_inputs_validation;
    var group_inputs_validation;
    var nested_group_owner_branch_validation;

    //save basic properties
    input.saveProperties();

    //if the selected input is a multiple choice input, save possible answers
    if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) !== -1) {
        //todo we are testing performance
        input.savePossibleAnswers();
    }
    //save advanced properties (not for media or branch or group types)
    if (consts.MEDIA_ANSWER_TYPES.indexOf(input.type) === -1 && input.type !== consts.BRANCH_TYPE && input.type !== consts.GROUP_TYPE) {
        input.saveAdvancedProperties();
    }

    //save jumps
    // if (input.type !== consts.GROUP_TYPE) {
    if (input.jumps.length > 0) {
        input.saveJumps();
    }

    //save branch inputs if the branch input owner is valid (header is not empty)
    if (input.type === consts.BRANCH_TYPE && input.dom.is_valid) {

        //set header preview
        ui.inputs_collection.showInputQuestionPreview(input.ref, input.question.trunc(50));

        //branch inputs are already attached to the branch property, just validate them
        //todo check this as I should do something if there is a valid/invalid one?
        input.validateBranchInputs();
    }

    //save branch inputs if the branch input owner is valid (header is not empty)
    if (input.type === consts.GROUP_TYPE && input.dom.is_valid) {

        //set header preview
        ui.inputs_collection.showInputQuestionPreview(input.ref, input.question.trunc(50));

        //branch inputs are already attached to the branch property, just validate them
        input.validateGroupInputs();
    }

    //if we are editing a nested group
    if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {

        // if we are editing a nested group, and all the nested group inputs are valid,
        // set the nested group input owner as valid and toggle valid icon for the owner group input
        active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
        active_group = utils.getNestedGroupObjectByRef(active_branch, formbuilder.group.active_group_ref);
        group_inputs_validation = validation.validateGroupInputs(active_group);

        if (group_inputs_validation.is_valid) {
            active_group.dom.is_valid = true;
            ui.inputs_collection.showInputValidIcon(active_group.ref);

            //if the nested group is valid, is the owner branch valid then?
            nested_group_owner_branch_validation = active_branch.validateBranchInputs();

            //todo do i need to do something here  based on the above result?

        }
        else {
            ui.inputs_collection.showInputInvalidIcon(active_group.ref);
            active_group.dom.is_valid = false;
        }
    }
    else {


        // if we are editing a branch, and all the active branch inputs are valid,
        // set the branch input owner as valid and toggle valid icon for the owner branch input
        if (formbuilder.is_editing_branch) {

            //get current active branch and validate
            active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            branch_inputs_validation = validation.validateBranchInputs(active_branch);

            if (branch_inputs_validation.is_valid) {

                ui.inputs_collection.showInputValidIcon(active_branch.ref);
                active_branch.dom.is_valid = true;
            }
            else {
                ui.inputs_collection.showInputInvalidIcon(active_branch.ref);
                active_branch.dom.is_valid = false;
            }
        }

        // if we are editing a group, and all the active group inputs are valid,
        // set the group input owner as valid and toggle valid icon for the owner branch input
        if (formbuilder.is_editing_group) {

            //get current active group and validate
            active_group = utils.getInputObjectByRef(formbuilder.group.active_group_ref);
            group_inputs_validation = validation.validateGroupInputs(active_group);

            if (group_inputs_validation.is_valid) {

                active_group.dom.is_valid = true;
                ui.inputs_collection.showInputValidIcon(active_group.ref);
            }
            else {
                ui.inputs_collection.showInputInvalidIcon(active_group.ref);
                active_group.dom.is_valid = false;
            }
        }
    }
};

module.exports = saveAllInputProperties;
