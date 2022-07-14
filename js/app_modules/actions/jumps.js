/* global $*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var jumps = {

    addJump: function (the_input) {

        var input = the_input;
        var jumps_list_wrapper = formbuilder.dom.input_properties_forms_wrapper
            .find('form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__jumps .input-properties__form__jumps__list');
        var html = '';
        var jump_index = input.jumps.length;

        //if the number of jumps is already equal to the number of possible answers, do not add jump
        //Do this check only for multiple answers inputs, as single answer inputs do have zero possible_answers at all times.
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) > -1) {
            if (input.jumps.length >= input.possible_answers.length) {
                return;
            }
        }

        //if jumps, remove 'no jumps set' item
        jumps_list_wrapper.parent().find('.input-properties__form__jumps__no-jumps-message').addClass('hidden');

        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) === -1) {
            //append a jump with condition disabled and set to 'always' jump
            //we do this because on EC5 when the question is an open answer, a jump will always jump no matter the answer given
            // jumps_list_wrapper.append();

            html += formbuilder.dom.partials.jump_list_item_always_jump;
        }
        else {
            //jumps get full functionality with multiple answers input types
            html += formbuilder.dom.partials.jump_list_item;
        }

        html = html.replace(/{{input-ref-logic-when}}/g, jump_index + '-' + input.ref + '-logic-when');
        html = html.replace(/{{input-ref-logic-answer}}/g, jump_index + '-' + input.ref + '-logic-answer');
        html = html.replace(/{{input-ref-logic-goto}}/g, jump_index + '-' + input.ref + '-logic-goto');

        jumps_list_wrapper.append(html);

        //add empty jump to input
        input.jumps.push({});

        //show jump icon in input tool
        //todo
        formbuilder.dom.inputs_collection.find('.input[data-input-ref="' + input.ref + '"]');
        formbuilder.dom.inputs_collection.find('.input[data-input-ref="' + input.ref + '"] .input-inner');
        formbuilder.dom.inputs_collection.find('.input[data-input-ref="' + input.ref + '"] .input-inner .jump-state').removeClass('invisible');

    },

    removeJump: function (the_current_input, the_remove_btn) {

        var input = the_current_input;
        var jump_item = the_remove_btn.parent();
        var jump_list = jump_item.parent();
        // jump index starts from 1, as index 0 is 'no jumps yet' placeholder, wrapped in a <li> tag
        var jump_index = jump_item.index();

        //remove selected from dom
        jump_item.remove();

        //remove from memory
        input.jumps.splice((jump_index - 1), 1);

        //if no jumps, show message
        if (jump_list.find('li').length === 0) {
            //if no jumps yet, remove 'no jumps set' item
            jump_list.parent().find('.input-properties__form__jumps__no-jumps-message').removeClass('hidden');

            //hide jumps icon from input tool
            //todo
            formbuilder.dom.inputs_collection.find('.input[data-input-ref="' + input.ref + '"] .input-inner .jump-state').addClass('invisible');
        }
    },

    listJumpPossibleAnswers: function (the_select, the_input) {

        var focused_select = the_select;
        var input = the_input;
        var html = '';

        //trigger a save in case the user typed in a possibile answer and switched directly to the jump tab
        input.savePossibleAnswers();

        focused_select.empty();
        $(input.possible_answers).each(function (index, possible_answer) {
            html += '<option value="';
            html += possible_answer.answer_ref + '">';
            html += possible_answer.answer.trunc(50);
            html += '</option>';
        });
        focused_select.append(html);
    },

    //list jump consitions (is, is not etc...)
    listJumpConditions: function (the_select) {

        var focused_select = the_select;
        var possible_conditions = consts.JUMP_CONDITIONS;
        var html = '';

        focused_select.empty();
        $(possible_conditions).each(function (i) {

            html += '<option value="';
            html += this.key + '">';
            html += this.text;
            html += '</option>';
        });
        focused_select.append(html);
    },

    //dynamically show a list of possible destination for a jump
    listJumpDestinations: function (the_select, the_jump_destinations) {

        var focused_select = the_select;
        var jump_destinations = the_jump_destinations;

        /*
         jumps can go only forward, possible jumps destinations are index of current input +1,
         as it not possible to jump to an adjacent input
         */
        focused_select.empty();
        $(jump_destinations).each(function (index, destination) {

            var question;
            var purifiedReadme = '';

            if (destination.question === '') {
                if (destination.type === consts.BRANCH_TYPE) {
                    question = messages.error.NO_BRANCH_HEADER_YET;
                }
                else {
                    question = messages.error.NO_QUESTION_TEXT_YET;
                }
            }
            else {
                if (destination.type === consts.README_TYPE) {
                    //strip all tags for preview within select
                    purifiedReadme = utils.decodeHtml(destination.question);
                    purifiedReadme = utils.stripTags(purifiedReadme);
                    question = purifiedReadme.trunc(50);
                }
                else {
                    question = destination.question.trunc(50);
                }
            }
            focused_select.append('<option value="' + destination.ref + '">' + question + ' </option>');
        });
    },

    ////if any jump, refresh the jumps selected destination label as it might have changed
    refreshInputJumpsDom: function (input, inputs) {

        var selected_destinations = formbuilder.dom.input_properties_forms_wrapper
            .find('form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__jumps__logic--goto select option:selected');
        var purifiedReadme = '';

        var available_destinations = utils.getJumpAvailableDestinations(input, inputs);

        //loop each jump
        $(input.jumps).each(function (jumpIndex, jump) {

            //find the destination "question" and update the text shown in the dropdown "go to"
            $(available_destinations).each(function (destinationIndex, destination) {

                if (jump.to === destination.ref) {
                    if (destination.type === consts.README_TYPE) {
                        //strip all tags for preview within select
                        purifiedReadme = utils.decodeHtml(destination.question);
                        purifiedReadme = utils.stripTags(purifiedReadme);
                        $(selected_destinations[jumpIndex]).text(purifiedReadme.trunc(50));
                    }
                    else {
                        $(selected_destinations[jumpIndex]).text(destination.question);
                    }
                    return false;
                }
            });
        });
    }
};

module.exports = jumps;
