/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var saveProperties = function (the_input) {

    var question_text_validation;
    var input = the_input;

    input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
    input.dom.is_valid = true;

    //reset validation dom feedback (hide all errors from dom)
    input.hidePropertiesErrors();

    //set question text (readme is the only one with a textarea in the markup)
    if (input.type === consts.README_TYPE) {

        input.question = input.dom.properties_panel.find('div.input-properties__form__question textarea').val().trim();

        //remove double white spaces, tabs and new lines and &nbsp;
        input.question = input.question.replace(/\s\s+/g, ' ').replace(/&nbsp;/g, '');

        //convert html tags to html entities
        input.question = utils.encodeHtml(input.question)
    }
    else {
        input.question = input.dom.properties_panel.find('div.input-properties__form__question input').val();

        //sanitise < and > replacing by unicode
        input.question = input.question.replaceAll('>', '\ufe65');
        input.question = input.question.replaceAll('<', '\ufe64');
        input.dom.properties_panel.find('div.input-properties__form__question input').val(input.question);

        //set required flag
        input.is_required = input.dom.properties_panel.find('div.input-properties__form__required-flag input').is(':checked');

        //set title flag
        input.is_title = input.dom.properties_panel.find('div.input-properties__form__title-flag input').is(':checked');
    }

    //validate question text
    question_text_validation = input.isQuestionTextValid();

    if (!question_text_validation.is_valid) {
        // warn user question text is wrong
        input.dom.is_valid = false;
        input.dom.error = question_text_validation.error.message;

        //highlight wrong input and show error message
        input.showPropertiesErrors(question_text_validation.error.message);

    }
};

module.exports = saveProperties;
