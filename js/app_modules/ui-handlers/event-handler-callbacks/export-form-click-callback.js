/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var validation = require('actions/validation');
var toast = require('config/toast');

var callback = function (e) {

    var undo = require('actions/undo');
    // var generate_search_type_project = require('helpers/generate-search-type-project');
    //
    // generate_search_type_project.doIt();
    // return false;

    var index = formbuilder.current_form_index;
    var formToExport = {
        data: {
            id: '',
            type: 'form',
            form: {}
        }
    };
    //create a deep copy of the project object properties
    var project_definition_json = window.CircularJSON.parse(window.CircularJSON.stringify(formbuilder.project_definition));
    var is_valid_form = true;
    var project_slug = project_definition_json.data.project.slug;
    var form = project_definition_json.data.project.forms[index];
    var filename = project_slug + '__' + form.slug + '__form.json';

    if (form.inputs.length === 0) {
        toast.showError(messages.error.FORM_IS_INVALID);
        return;
    }

    $(form.inputs).each(function (inputIndex, input) {

        //get valid jump destinations
        var jump_destinations = utils.getJumpAvailableDestinationsAsKeys(inputIndex, input, form.inputs, false);

        //extra validation for jumps, check if the destination still exists and it is valid
        $(input.jumps).each(function (jumpIndex, jump) {
            //does the jump "to" property reference a valid destination input?
            if (!jump_destinations[jump.to]) {
                //invalid destination found
                is_valid_form = false;
            }
        });

        $(input.branch).each(function (branchInputIndex, branch_input) {

            if (!branch_input.dom.is_valid) {
                is_valid_form = false;
            }

            delete branch_input.dom;

            //todo validate branch jumps
            jump_destinations = utils.getJumpAvailableDestinationsAsKeys(branchInputIndex, branch_input, input.branch, true);

            //extra validation for jumps, check if the destination still exists and it is valid
            $(branch_input.jumps).each(function (branchJumpIndex, branchJump) {
                //does the jump "to" property reference a valid destination input?
                if (!jump_destinations[branchJump.to]) {
                    //invalid destination found
                    is_valid_form = false;
                }
            });

            $(branch_input.group).each(function (index, group_input) {

                if (!group_input.dom.is_valid) {
                    is_valid_form = false;
                }
                delete group_input.dom;
            });
        });
        $(input.group).each(function (index, group_input) {
            if (!group_input.dom.is_valid) {
                is_valid_form = false;
            }
            delete group_input.dom;
        });

        if (!input.dom.is_valid) {
            is_valid_form = false;
        }
        delete input.dom;
    });

    //wrap form in "data {}" accordin to json api
    formToExport.data.id = form.ref;
    formToExport.data.form = form;

    if (is_valid_form) {
        //do export

        var file;

        try {
            file = new File([JSON.stringify(formToExport)], filename, { type: 'text/plain:charset=utf-8' });
            saveAs(file);
        }
        catch (error) {
            console.log(error);

            //Microsoft browsers?
            if (navigator.msSaveBlob) {
                return navigator.msSaveBlob(new Blob([JSON.stringify(formToExport)], { type: 'text/plain:charset=utf-8' }), filename);
            }
            else {
                //browser not supported yet
                toast.showError(messages.error.BROWSER_NOT_SUPPORTED);
            }
        }

    }
    else {
        toast.showError(messages.error.FORM_IS_INVALID);
    }
};

module.exports = callback;
