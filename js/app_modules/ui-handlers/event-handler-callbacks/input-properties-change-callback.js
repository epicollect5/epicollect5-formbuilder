/* global $, toastr*/
'use strict';
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var callback = function () {

    var input = utils.getInputObjectByRef(formbuilder.current_input_ref);
    var owner_branch;

    //is editing a branch?
    if (formbuilder.is_editing_branch) {
        //override input to be the branch input
        input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);

        //handle nested group inside a branch
        if (formbuilder.is_editing_group) {
            owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = utils.getNestedGroupInputObjectByRef(owner_branch, formbuilder.group.current_input_ref);
        }
    }
    else {
        //is editing a group?
        if (formbuilder.is_editing_group) {
            //override input to be the branch input
            input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        }
    }

    if ($(this).attr('data-jump-logic')) {
        console.log('it is a jump');
    }

    if ($(this).attr('data-initial-answer')) {
        console.log('multi select');
        input.updatePossibleInitialAnswers();
    }
};

module.exports = callback;
