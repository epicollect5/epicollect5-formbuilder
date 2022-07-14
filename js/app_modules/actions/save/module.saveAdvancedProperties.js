/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');


var saveAdvancedProperties = function (input) {

    var save = require('actions/save');
    var initial_answer_validation;

    input.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + input.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //clear all advanced properties errors from dom
    input.hideAdvancedPropertiesErrors();


    //set properties but skip if it is a readme
    if (input.type !== consts.README_TYPE) {
        //set default
        input.default = input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val();
        input.default = input.default === '' ? null : input.default;

        //strip html tags and reset input to sanitised value
        if (input.default) {
            input.default = input.default.replace(/(<([^>]+)>)/ig, '');
            input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(input.default);
        }

        //set regex
        input.regex = input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val();
        input.regex = input.regex === '' ? null : input.regex;

        //strip html tags and reset input to sanitised value
        if (input.regex) {
            input.regex = input.regex.replace(/(<([^>]+)>)/ig, '');
            input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(input.regex);
        }

        //set verification flag
        input.verify = input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').is(':checked');

        /* get uniqueness flag */
        save.saveUniqueness(input);

    }

    /****************************************************/

    //validate initial answer
    initial_answer_validation = input.isInitialAnswerValid();
    if (!initial_answer_validation.is_valid) {
        input.dom.is_valid = false;
        //highlight wrong input
        input.showAdvancedPropertiesErrors(consts.DEFAULT_PROPERTY, initial_answer_validation.error.message);
    }
};

module.exports = saveAdvancedProperties;
