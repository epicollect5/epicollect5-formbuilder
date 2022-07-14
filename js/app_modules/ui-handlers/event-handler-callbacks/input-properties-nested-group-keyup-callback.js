/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var jumps = require('actions/jumps');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var validation = require('actions/validation');

var callback = function (e) {

    var input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
    var header_validation;

    input.question = $(this).val();

    //validate header
    header_validation = input.isHeaderTextValid();

    if (!header_validation.is_valid) {
        // warn user question text is wrong
        input.dom.is_valid = false;

        //highlight wrong input and show error message
        input.showHeaderErrors(header_validation.error.message);

        //disable edit btn
        input.toggleEditButton(false);

        //validate all inputs (to toggle save project button on keyup)
        validation.performValidation(input, false);
    }
    else {
        //hide errors
        input.hideHeaderErrors();

        //enable edit btn
        input.toggleEditButton(true);

        input.dom.is_valid = true;

        //validate all inputs (to toggle save project button on keyup)
        validation.performValidation(input, false);
    }
};

module.exports = callback;
