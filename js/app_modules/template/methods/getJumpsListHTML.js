/*jshint expr:true */
'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var utils = require('helpers/utils');

function _getSelectedJumpAnswerHTML(possible_answer) {
    return '<option value="' + possible_answer.answer_ref + '" selected="selected">' + possible_answer.answer + '</option>';
}

function _getSelectedJumpConditionHTML(jump) {

    var text = '';

    $(consts.JUMP_CONDITIONS).each(function (index, condition) {
        if (condition.key === jump.when) {
            text = condition.text;
            return false;
        }
    });
    return '<option value="' + jump.when + '" selected="selected">' + text + '</option>';
}

function _getSelectedJumpDestinationHTML(destination_input) {
    return '<option value="' + destination_input.ref + '" selected="selected">' + destination_input.question + '</option>';
}

var getJumpsListHTML = function (input) {

    var html = '';
    var inputs = [];
    var selected_condition_html;
    var selected_possible_answer_html;

    //get input list (hierarchy or branch)
    var parts = input.ref.split('_');
    if (parts.length > 3) {
        //this is a branch ref
        parts.pop();
        inputs = utils.getInputObjectByRef(parts.join('_')).branch;
    }
    else {
        inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
    }
    //jump destinations: cannot jump on the next one, but always next + 1
    var jump_destinations = utils.getJumpAvailableDestinations(input, inputs);

    $(input.jumps).each(function (index, jump) {

        /****************************************************************************************************
         * set `when option`
         */
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) === -1) {
            //append a jump with condition disabled and set to 'always' jump
            //we do this because on EC5 when the question is an open answer, a jump will always jump no matter the answer given
            html += formbuilder.dom.partials.jump_list_item_always_jump;
        }
        else {
            //jumps get full functionality with multiple answers input types
            html += formbuilder.dom.partials.jump_list_item;

            selected_condition_html = _getSelectedJumpConditionHTML(jump);
            html = html.replace('{{logic-when-saved-option}}', selected_condition_html);

            /****************************************************************************************************
             *  set selected `answer`
             */
            $(input.possible_answers).each(function (index, possible_answer) {
                if (possible_answer.answer_ref === jump.answer_ref) {
                    selected_possible_answer_html = _getSelectedJumpAnswerHTML(possible_answer);
                }
            });
            html = html.replace('{{logic-answer-saved-option}}', selected_possible_answer_html);
            /***************************************************************************************************/

        }
        /****************************************************************************************************
         *  set selected `goto`
         */
        var selected_goto_html = '';
        if (jump.to === 'END') {
            selected_goto_html = _getSelectedJumpDestinationHTML({ ref: 'END', question: 'End of form' });
        }
        else {
            $(jump_destinations).each(function (index, jump_destination) {
                if (jump_destination.ref === jump.to) {
                    selected_goto_html = _getSelectedJumpDestinationHTML(jump_destination);
                    return false;
                }
            });
        }

        html = html.replace('{{logic-goto-saved-option}}', selected_goto_html);
        /***************************************************************************************************/

        html = html.replace(/{{input-ref-logic-when}}/g, index + '-' + input.ref + '-logic-when');
        html = html.replace(/{{input-ref-logic-goto}}/g, index + '-' + input.ref + '-logic-goto');
        html = html.replace(/{{input-ref-logic-answer}}/g, index + '-' + input.ref + '-logic-answer');

    });


    return html;
};

module.exports = getJumpsListHTML;
