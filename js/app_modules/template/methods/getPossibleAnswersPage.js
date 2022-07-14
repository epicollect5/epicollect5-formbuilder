'use strict';
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');
var consts = require('config/consts');

//generate list of possible answers and inject it into its wrapper, then return it
var getPossibleAnswersPage = function (the_input, the_page) {

    var input = the_input;
    var current_page = the_page;
    var list_item = '';
    var list = '';
    var properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
    var possible_answers_wrapper = properties_panel.find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');
    var from_index = (current_page - 1) * consts.LIMITS.possible_answers_per_page;
    var to_index = current_page * consts.LIMITS.possible_answers_per_page;

    //remove possible aswers from dom
    possible_answers_wrapper.find('li').remove();

    //get next possible answers
    var possible_answers =  input.possible_answers.slice(from_index, to_index);

    $(possible_answers).each(function (index, possible_answer) {

        //replace double quotes with html entities
        possible_answer.answer = possible_answer.answer.replace(/"/gi, '&quot;');

        list_item = formbuilder.dom.partials.possible_answer_list_item;
        list_item = list_item.replace('{{answer-ref}}', possible_answer.answer_ref);
        list_item = list_item.replace('{{answer}}', possible_answer.answer);

        if (index === 0 && input.possible_answers.length === 1) {
            list_item = list_item.replace('{{disabled}}', 'disabled');
        }
        else {
            list_item = list_item.replace('{{disabled}}', '');
        }
        list += list_item;

        //if the possible answer is invalid, add error in the dom
        if(possible_answer.answer === '') {
            //todo

        }
    });

    //append new page to dom
    possible_answers_wrapper.hide().html(list).fadeIn(consts.ANIMATION_SLOW);
};

module.exports = getPossibleAnswersPage;
