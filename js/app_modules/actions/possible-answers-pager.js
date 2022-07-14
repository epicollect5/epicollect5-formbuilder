/* global $, toastr, Papa*/
'use strict';
var formbuilder = require('config/formbuilder');
var toast = require('config/toast');
var consts = require('config/consts');
var messages = require('config/messages');
var getPossibleAnswerPage = require('template/methods/getPossibleAnswersPage');

var possible_answers_pager = {

    init: function (input) {

        var self = this;
        var pager = formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.possible-answers__list_pager');
        var page = formbuilder.possible_answers_pagination[input.ref].page;
        var total = Math.ceil(input.possible_answers.length / consts.LIMITS.possible_answers_per_page);

        pager.removeClass('hidden');
        pager.find('.possible-answers__list_pager__current')
            .html(page);
        pager.find('.possible-answers__list_pager__total')
            .html(total);

        //attach handlers to pagination buttons
        var prev_btn = pager.find('.possible-answers__list_pager__prev');
        var next_btn = pager.find('.possible-answers__list_pager__next');

        //when the pager is shown, set min-height on parent container
        formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__possible-answers__list')
            .parent().css('min-height', '325px');

        var was_clicked = false;
        next_btn.off().on('click', function () {

            console.log('next button clicked');
            var next_page;

            //validate answers currently in the dom
            //if any error, warn user instead of changing page
            //so the user has the chance to fix them
            if (!self.areValidPossibleAnswersInDOM(input)) {
                //show error
                toast.showError(messages.error.POSSIBLE_ANSWERS_INVALID);
                return false;
            }

            if (!was_clicked) {
                was_clicked = true;

                //save possible answers currently on the dom
                input.savePossibleAnswers();

                if (formbuilder.possible_answers_pagination[input.ref].page < total) {
                    //show next possible answers page in dom
                    next_page = formbuilder.possible_answers_pagination[input.ref].page + 1;
                    formbuilder.possible_answers_pagination[input.ref].page = next_page;

                    getPossibleAnswerPage(input, next_page);

                    //update dom with current page
                    pager.find('.possible-answers__list_pager__current')
                        .html(next_page);

                    //restore button functionality
                    window.setTimeout(function () {
                        was_clicked = false;
                    }, consts.ANIMATION_SLOW)
                }
                else {
                    was_clicked = false;
                }
            }
        });

        prev_btn.off().on('click', function () {
            console.log('prev button clicked');
            //show next possible answers page in dom
            var prev_page;

            if (!self.areValidPossibleAnswersInDOM(input)) {
                //show error
                toast.showError(messages.error.POSSIBLE_ANSWERS_INVALID);
                return false;
            }

            if (!was_clicked) {
                was_clicked = true;

                //save possible answers currently on the dom
                input.savePossibleAnswers();

                if (formbuilder.possible_answers_pagination[input.ref].page > 1) {
                    prev_page = formbuilder.possible_answers_pagination[input.ref].page - 1;
                    formbuilder.possible_answers_pagination[input.ref].page = prev_page;

                    getPossibleAnswerPage(input, prev_page);

                    //update dom with current page
                    pager.find('.possible-answers__list_pager__current')
                        .html(prev_page);

                    //restore button functionality
                    window.setTimeout(function () {
                        was_clicked = false
                    }, consts.ANIMATION_SLOW);
                }
            }
            else {
                was_clicked = false;
            }
        });
    },

    //hide pager and restore possible answers container height
    tearDown: function (input) {

        var pager = formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.possible-answers__list_pager');

        //restore height
        formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__possible-answers__list')
            .parent().css('min-height', 'auto');

        pager.addClass('hidden');

        formbuilder.possible_answers_pagination[input.ref].page = 1;
    },

    areValidPossibleAnswersInDOM: function (input) {
        var are_possible_answers_valid = true;
        var properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
        var possible_answers = properties_panel.find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list li');

        possible_answers.each(function (index, possible_answer) {

            var current_input = $(possible_answer).find('div input');
            var answer = current_input.val();

            // //strip html tags (angle brackets)
            // answer = answer.replace(/[<>]/ig, '');

            //sanitise < and > replacing by unicode
            answer = answer.replaceAll('>', '\ufe65');
            answer = answer.replaceAll('<', '\ufe64');

            if (answer === '') {
                are_possible_answers_valid = false;
                return false;
            }

        });

        return are_possible_answers_valid;
    },

    recalculatePagination: function (input) {

        //get current page and total of possibe answers
        var page = formbuilder.possible_answers_pagination[input.ref].page;
        var total = Math.ceil(input.possible_answers.length / consts.LIMITS.possible_answers_per_page);

        var pager = formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.possible-answers__list_pager');

        pager.find('.possible-answers__list_pager__current')
            .html(page);
        pager.find('.possible-answers__list_pager__total')
            .html(total);

        //hide pager if not needed
        if (input.possible_answers.length <= consts.LIMITS.possible_answers_per_page) {
            pager.addClass('hidden');
        }
    },

    recalculatePossibleAnswersDOM: function (input) {

        var self = this;
        var possible_answers_list = input.dom.properties_panel
            .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');
        var possible_answers = possible_answers_list.find('li');
        var lookup_index;
        var possible_answer_to_append;
        var list_item;
        var prev_page;
        var current_page = formbuilder.possible_answers_pagination[input.ref].page;

        /*add one answer to the bottom to fill the page (if any)
        here we are checking the possible answers currently on the dom
        this is the case where the user remove the 100th answer from the dom and we have more answers
        to show
        * */
        if (possible_answers.length === (consts.LIMITS.possible_answers_per_page - 1)) {

            if (input.possible_answers.length > possible_answers.length) {

                //append answer to the bottom of current page
                list_item = formbuilder.dom.partials.possible_answer_list_item;
                list_item = list_item.replace('{{answer}}', possible_answer_to_append.answer);
                list_item = list_item.replace('{{answer-ref}}', possible_answer_to_append.answer_ref);

                list_item = formbuilder.dom.partials.possible_answer_list_item;
                list_item = list_item.replace('{{answer}}', possible_answer_to_append.answer);
                list_item = list_item.replace('{{answer-ref}}', possible_answer_to_append.answer_ref);

                //append to dom
                possible_answers_list.append(list_item);

                //update pagination
                self.recalculatePagination(input);
            }
        }

        /*
        if the possible answers in the dom is 0, it means the user removed all the answers
        from the dom, therefore we have to
        * */
        if (possible_answers.length === 0) {

            //go to previous page
            formbuilder.possible_answers_pagination[input.ref].page--;
            prev_page = formbuilder.possible_answers_pagination[input.ref].page;
            getPossibleAnswerPage(input, prev_page);

            //update pagination buttons
            self.recalculatePagination(input);
        }
    }
};

module.exports = possible_answers_pager;
