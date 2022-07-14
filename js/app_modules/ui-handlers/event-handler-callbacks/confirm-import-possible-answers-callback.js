/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');
var possible_answers_pager = require('actions/possible-answers-pager');
var getPossibleAnswersList = require('template/methods/getPossibleAnswersList');

var callback = function (params) {

    var selectedHeaderIndex = params.selectedHeaderIndex;
    var input = params.input;
    var importedJson = params.importedJson;
    var list;
    var properties_panel;
    var possible_answers_list;
    var headers = importedJson.meta.fields;
    var userWantstoReplaceAnswers = params.userWantstoReplaceAnswers;
    var doesFirstRowContainsHeaders = params.doesFirstRowContainsHeaders;
    var possible_answers_max = consts.LIMITS.possible_answers_max;

    if(input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {
        possible_answers_max = consts.LIMITS.possible_answers_max_search;
    }

    //if no column is selected abort
    if (selectedHeaderIndex === null) {
        return false;
    }

    //replace or append?
    if (userWantstoReplaceAnswers) {
        //reset answers array
        input.possible_answers = [];
    }

    //headers on first row or not?
    if (!doesFirstRowContainsHeaders) {

        var first_row = {};
        first_row[importedJson.meta.fields[selectedHeaderIndex]] = importedJson.meta.fields[selectedHeaderIndex];
        //csv file does not have any headers, prepend meta.fields (which is the headers)
        importedJson.data.unshift(first_row);
    }

    //append imported possible answers based on selected column (up to max number allowed)
    $(importedJson.data).each(function (index, item) {

        var imported_answer = item[headers[selectedHeaderIndex]];

        //import as many as we can
        if (input.possible_answers.length < possible_answers_max && imported_answer !== undefined) {

            //strip html tags
            imported_answer = imported_answer.replace(/(<([^>]+)>)/ig, ' ');

            //escape double quotes
            imported_answer = imported_answer.replace(/"/gi, '&quot;');

            //filter out empty answers
            if (imported_answer.trim() !== '') {

                //truncate if too long
                if (imported_answer.length > consts.LIMITS.possible_answer_max_length) {
                    imported_answer = imported_answer.substring(0,consts.LIMITS.possible_answer_max_length);
                }

                //add to object
                input.possible_answers.push({
                    answer: imported_answer,
                    answer_ref: utils.generateUniqID()
                });
            }
        }
        else {
            //too many, exit
            console.log('exit at ' + possible_answers_max);
            return false;//just to exit loop
        }
    });

    //get possible answers list markup
    list = getPossibleAnswersList(input.possible_answers);

    properties_panel = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + input.ref + '"]');

    possible_answers_list = properties_panel
        .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');

    //empty current list and append new one to dom
    possible_answers_list
        .empty()
        .hide()
        .append(list)
        .fadeIn(consts.ANIMATION_FAST);

    //when there is more than 1 possible answers, enable all remove buttons
    possible_answers_list.find('li div span button').prop('disabled', false);

    //show pagination if needed, starting from page 1
    if(input.possible_answers.length > consts.LIMITS.possible_answers_per_page) {
        formbuilder.possible_answers_pagination[input.ref].page = 1;
        possible_answers_pager.init(input);
    }
    else {
        //reset pagination
        possible_answers_pager.tearDown(input);
    }

    return true;
};

module.exports = callback;
