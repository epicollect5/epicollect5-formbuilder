/* global $, toastr, Flatted, require */
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var jumps = require('actions/jumps');
var save = require('actions/save');
var toast = require('config/toast');


/*
 handle click action on save project button
 */
var callback = function (e) {

    //for testing
    var url = '../postdump/index.php';
    var validation = require('actions/validation');
    var current_input = utils.getCurrentlySelectedInput();

    /***************************************************************
     * Save project
     **************************************************************/

    //save the currently selected input just in case
    if (current_input) {
        validation.performValidation(utils.getCurrentlySelectedInput(), false);
    }

    //create a deep copy of the project object properties
    var project_definition_json = Flatted.parse(Flatted.stringify(formbuilder.project_definition));
    //clean up forms from extra properties

    var cleanedForms = save.doCleaningBeforeSaving(project_definition_json.data.project.forms);

    if (cleanedForms.all_jumps_valid && cleanedForms.invalid_jumps_question === '') {
        //*****************************************************************************************************
        //after cleaning, do extra validation, the same one that runs when importing a form -------------------------
        var result = {
            is_valid: true,
            error: {
                message: null
            }
        };

        $(project_definition_json.data.project.forms).each(function (formIndex, form) {

            var validateBeforeSaving = require('actions/validation').validateBeforeSaving;

            result = validateBeforeSaving(form.ref, form.inputs);

            if (!result.is_valid) {
                return false;//exit loop
            }
        });

        //catch forms invalid here
        if (!result.is_valid) {
            toast.showError(result.error.message);
            return false;
        }

        //******************************************************************************************************
        //all valid, start saving ------------------------------------------------------------------------------

        //show overlay and cursor
        formbuilder.dom.overlay.fadeIn(consts.ANIMATION_FAST);

        //for local testing only
        if (window.location.href.indexOf('localhost/') !== -1 && window.location.href.indexOf('epicollect5-formbuilder/') !== -1) {
            consts.PROJECT_URL = url;
            console.log('Saved project definition ->', window.CircularJSON.stringify(project_definition_json));
        }

        $.ajax({
            url: consts.PROJECT_URL,
            //  contentType: 'application/vnd.api+json',
            data: window.btoa(pako.gzip(JSON.stringify(project_definition_json), {
                'to': 'string'
            }
            )),
            //  data: JSON.stringify(project_definition_json),
            //   dataType: 'json',
            method: 'POST',
            crossDomain: true,
            success: function (data) {
                window.setTimeout(function () {
                    formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST, function () {
                        toast.showSuccess(messages.success.PROJECT_SAVED);
                    });

                }, consts.ANIMATION_SLOW);
                console.log(data);
                console.log('posted successfully');

            },
            error: function (xhr, error, response) {

                var error_obj;
                var titles = '';

                try {
                    error_obj = JSON.parse(xhr.responseText);
                    console.log(xhr.responseText);
                    console.log(xhr, error, response);
                    //get server errors
                    $(error_obj.errors).each(function (index, error) {
                        titles += '<br/>' + error.title;
                    });
                } catch (error) {
                    console.log(error);
                }
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toast.showError(messages.error.PROJECT_NOT_SAVED + titles, 3000);
            }
        }
        );
    }
    else {
        toast.showError(messages.error.JUMP_INVALID + cleanedForms.invalid_jumps_question);
    }
};

module.exports = callback;
