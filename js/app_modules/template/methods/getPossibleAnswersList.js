'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');

//generate list of possible answers and return html
var getPossibleAnswersList = function (possible_answers) {

    var list = '';
    var list_item = '';

    //generate markup for first possible answers page
    $(possible_answers).each(function (index, possible_answer) {

        if (index === consts.LIMITS.possible_answers_per_page) {
            return false;
        }

        list_item = formbuilder.dom.partials.possible_answer_list_item;
        list_item = list_item.replace('{{answer-ref}}', possible_answer.answer_ref);
        list_item = list_item.replace('{{answer}}', possible_answer.answer);

        if (index === 0 && possible_answers.length === 1) {
            list_item = list_item.replace('{{disabled}}', 'disabled');
        }
        else {
            list_item = list_item.replace('{{disabled}}', '');
        }
        list += list_item;
    });

    return list;
};

module.exports = getPossibleAnswersList;
