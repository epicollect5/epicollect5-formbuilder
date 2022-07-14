'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var getPossibleAnswersList = require('template/methods/getPossibleAnswersList');

//generate list of possible answers and inject it into its wrapper, then return it
var getPossibleAnswersHTML = function (the_input) {

    var input = the_input;
    var wrapper = formbuilder.dom.partials.possible_answers_wrapper;
    var list = getPossibleAnswersList(input.possible_answers);

    wrapper = wrapper.replace('{{possible-answers-list}}', list);

    //toggle "add answers" button
    if (input.possible_answers.length >= consts.LIMITS.possible_answers_max) {
        //is it a search type? limit is higher for search type
        if(input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {
            if (input.possible_answers.length >= consts.LIMITS.possible_answers_max_search) {
                wrapper = wrapper.replace('{{disabled}}', 'disabled');
            }
            else {
                wrapper = wrapper.replace('{{disabled}}', '');
            }
        }
        else {
            wrapper = wrapper.replace('{{disabled}}', 'disabled');
        }
    }
    else {
        wrapper = wrapper.replace('{{disabled}}', '');
    }

    return wrapper;
};

module.exports = getPossibleAnswersHTML;
