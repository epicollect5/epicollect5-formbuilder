/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var jumps = require('actions/jumps');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');

var callback = function (e) {

    var input = utils.getInputObjectByRef(formbuilder.current_input_ref);
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
    var jump_destinations;
    var owner_branch;

    //is editing a branch?
    if (formbuilder.is_editing_branch) {
        //override inputs, get branch inputs from owner input
        inputs = input.branch;
        //override input to be the branch input
        input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);

        //handle nested group inside a branch
        if (formbuilder.is_editing_group) {
            inputs = input.group;
            owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = utils.getNestedGroupInputObjectByRef(owner_branch, formbuilder.group.current_input_ref);
        }
    }
    else {
        //is editing a group?
        if (formbuilder.is_editing_group) {
            //override inputs, get group inputs from owner input
            inputs = input.group;
            //override input to be the branch input
            input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        }
    }

    //get all jumps available
    jump_destinations = utils.getJumpAvailableDestinations(input, inputs);

    //check if the <select> is either a jump logic or a multiple choice input
    if ($(this).attr('data-jump-logic')) {

        var focused_select = $(this);
        var focused_select_id = focused_select.attr('id');

        //split on the dash to remove the first part of "focused_select_id" as it can
        //be 1-, 2-, 11-, 45-.... so:
        var focused_select_id_parts = focused_select_id.split('-');
        focused_select_id_parts.shift();
        focused_select_id = focused_select_id_parts.join('-');
        //todo the above is faster with a regex, when there is time...

        switch (focused_select_id) {

            //for open answer input type like  'text', this will be set to 'always'
            case input.ref + '-logic-when':
                //list al the available conditions
                jumps.listJumpConditions(focused_select);
                break;
            /*
             get all possible answers for current input and list them as options
             (for open answer input type like  'text', this will be hidden)
             */
            case input.ref + '-logic-answer':
                jumps.listJumpPossibleAnswers(focused_select, input);
                break;

            //get all possible jump destinations for current input and list them as options
            case input.ref + '-logic-goto':
                jumps.listJumpDestinations(focused_select, jump_destinations);
                break;
        }
    }
    else {
        input.listPossibleInitialAnswers();
    }
};

module.exports = callback;
