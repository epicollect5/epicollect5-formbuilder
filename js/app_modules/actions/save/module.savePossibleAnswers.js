/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var messages = require('config/messages');

var savePossibleAnswers;
savePossibleAnswers = function (the_input) {

    var input = the_input;
    var answer;
    var answer_ref;
    var properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
    var possible_answers = properties_panel.find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list li');
    var is_possible_aswer_valid;
    var answer_refs = [];

    var current_page = formbuilder.possible_answers_pagination[input.ref].page;
    var from_index = (current_page - 1) * consts.LIMITS.possible_answers_per_page;

    input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');

    //reset validation dom feedback (hide all errors from dom)
    input.hidePossibleAnswersErrors(possible_answers);

    /*
     Possible answers are grabbed from the dom, so we just update the text with whatever is set
     */
    possible_answers.each(function (index, possible_answer) {

        var current_input = $(possible_answer).find('div input');

        answer = current_input.val();

        //strip html tags (angle brackets)
        //answer = answer.replace(/[<>]/ig, '');

        //sanitise < and > replacing by unicode
        answer = answer.replaceAll('>', '\ufe65');
        answer = answer.replaceAll('<', '\ufe64');

        //reflect changes in dom
        current_input.attr('value', answer);
        current_input.val(answer);

        answer_ref = current_input.attr('data-answer-ref');
        if (!answer_refs.includes(answer_ref)) {
            answer_refs.push(answer_ref);
        } else {
            //duplicated answer_ref, show error
            input.dom.is_valid = false;
            //highlight wrong answer and show error message
            input.showPossibleAnswerErrors($(possible_answer), messages.error.POSSIBLE_ANSWER_DUPLICATED_IDENTIFIER);
            return false;
        }

        //add element to the correct position in the array
        //based on pagination
        input.possible_answers[from_index + index] = {
            answer: answer,
            answer_ref: answer_ref
        };

        is_possible_aswer_valid = input.isPossibleAnswerValid(answer);

        //validate each possible answer and show embedded errors if any
        if (!is_possible_aswer_valid.is_valid) {
            // warn user question text is wrong
            input.dom.is_valid = false;

            //highlight wrong answer and show error message
            input.showPossibleAnswerErrors($(possible_answer), is_possible_aswer_valid.error.message);
        }
    });
};

module.exports = savePossibleAnswers;

