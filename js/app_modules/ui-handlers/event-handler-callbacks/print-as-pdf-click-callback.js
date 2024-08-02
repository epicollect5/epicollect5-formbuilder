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

    function _renderQuestion(input) {

        //strip html tags from readme type if any
        if (input.type === consts.README_TYPE) {
            input.question = utils.decodeHtml(input.question);
            input.question = input.question.replace(/(<([^>]+)>)/ig, ' ');
            html += '<hr/>';
        }

        html += '<h4 class="question">' + input.question + '</h4>';

        if (input.type === consts.TEXTAREA_TYPE) {
            html += '<table border="1" width="100%">';
            html += '<tr><td></td></td></tr>';
            html += '<tr><td></td></td></tr>';
            html += '<tr><td></td></td></tr>';
            html += '<tr><td></td></td></tr>';
            html += '</table>';
        }
        else {
            if (input.type !== consts.README_TYPE) {
                html += '<table border="1" width="100%">';
                html += '<tr><td></td></td></tr>';
                html += '</table>';
            }
            else {
                html += '<hr/>';
            }
        }
    }

    function _renderPossibleAnswers(input) {
        $.each(input.possible_answers, function (index, possible_answer) {

            switch (input.type) {
                case consts.SEARCH_SINGLE_TYPE:
                case consts.SEARCH_MULTIPLE_TYPE:

                    if (index === 0) {
                        html += '<ul class="possible-answers-list">';
                    }

                    html += '<li><h5>' + possible_answer.answer + '</h5></li>';

                    if (index === input.possible_answers.length - 1) {
                        html += '</ul>';
                    }
                    break;
                //render dropdown and radio as radio buttons (single choice)
                case consts.DROPDOWN_TYPE:
                case consts.RADIO_TYPE:
                    html += '<div class="radio-type"><h5>';
                    html += '<input type="radio"  value="' + possible_answer.answer + '">';
                    html += '<label for="' + possible_answer.answer + '">' + possible_answer.answer + '</label>';
                    html += '</h5></div>';
                    break;
                case consts.CHECKBOX_TYPE:
                    html += '<div class="checkbox-type"><h5>';
                    html += '<input type="checkbox"  value="' + possible_answer.answer + '">';
                    html += '<label for="' + possible_answer.answer + '">' + possible_answer.answer + '</label>';
                    html += '</h5></div>';
                    break;
                default:
                //do nothing
            }
        });
    }


    var html = '';

    //add form title
    html += '';
    var index = formbuilder.current_form_index;

    //create a deep copy of the project object properties
    var project_definition_json = window.CircularJSON.parse(window.CircularJSON.stringify(formbuilder.project_definition));
    var is_valid_form = true;
    var project_slug = project_definition_json.data.project.slug;
    var form = project_definition_json.data.project.forms[index];

    if (form.inputs.length === 0) {
        toast.showError(messages.error.FORM_IS_INVALID);
        return;
    }

    //print project name as header
    html += '<h2>' + project_definition_json.data.project.name + '</h2>';

    //print form name as header
    html += '<h3>' + form.name + '</h3>';

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

        switch (input.type) {

            case consts.BRANCH_TYPE:
                html += '<h4 class="branch-header">' + input.question + '</h4>';

                html += '<table border="1" cellpadding="10" cellspacing="10">';
                html += '<tr>';
                html += '<td>';

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

                    //multiple choice question?
                    if ($.inArray(branch_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                        html += '<h4 class="question">' + branch_input.question + '</h4>';
                        //render possible answers
                        _renderPossibleAnswers(branch_input);
                    }
                    else {
                        _renderQuestion(branch_input);
                    }

                    $(branch_input.group).each(function (index, group_input) {

                        if (!group_input.dom.is_valid) {
                            is_valid_form = false;
                        }
                        delete group_input.dom;

                        //multiple choice question?
                        if ($.inArray(group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                            html += '<h4 class="question">' + group_input.question + '</h4>';
                            //render possible answers
                            _renderPossibleAnswers(group_input);
                        }
                        else {
                            _renderQuestion(group_input);
                        }
                    });
                });

                html += '</td>';
                html += '</tr>';
                html += '</table>';
                break;

            case consts.GROUP_TYPE:
                html += '<h4 class="group-header">' + input.question + '</h4>';

                html += '<table border="1" cellpadding="10" cellspacing="10">';
                html += '<tr>';
                html += '<td>';


                $(input.group).each(function (index, group_input) {
                    if (!group_input.dom.is_valid) {
                        is_valid_form = false;
                    }
                    delete group_input.dom;

                    //multiple choice question?
                    if ($.inArray(group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                        html += '<h4 class="question">' + group_input.question + '</h4>';
                        //render possible answers
                        _renderPossibleAnswers(group_input);
                    }
                    else {
                        _renderQuestion(group_input);
                    }
                });

                html += '</td>';
                html += '</tr>';
                html += '</table>';
                break;

            default:
                //multiple choice question?
                if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                    html += '<h4 class="question">' + input.question + '</h4>';
                    //render possible answers
                    _renderPossibleAnswers(input);
                }
                else {
                    //open answer question
                    _renderQuestion(input);
                }
        }

        if (!input.dom.is_valid) {
            is_valid_form = false;
        }
        delete input.dom;
    });

    if (is_valid_form) {
        //do print
        $('.print-preview-wrapper').empty().append(html);
        window.print();
    }
    else {
        toast.showError(messages.error.FORM_IS_INVALID);
    }
};

module.exports = callback;
