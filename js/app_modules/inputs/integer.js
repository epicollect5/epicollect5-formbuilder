/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var messages = require('config/messages');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var template = require ('template');

var NumericInput = function (the_input_ref) {

    $.extend(true, this, input_properties);

    //set default properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.INTEGER_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
NumericInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

//validate initial answer
NumericInput.prototype.isInitialAnswerValid = function () {

    var validate = validation.isInitialAnswerValid(this.type,this.default, this.regex);

    if (validate.is_valid) {
        //validate for integer type
        if (this.type === consts.INTEGER_TYPE && this.default !== '') {
            //initial answer must be an integer, not a float
            if (!validation.isValueInt(this.default)) {
                validate.is_valid = false;
                validate.error.message = messages.error.VALUE_MUST_BE_INTEGER;
            }
        }
    }
    return validate;
};

NumericInput.prototype.isMinValueValid = function () {
    //validate min value
    return validation.isMinMaxValueValid(this.type, this.min);
};

NumericInput.prototype.isMaxValueValid = function () {
    //validate max value
    return validation.isMinMaxValueValid(this.type, this.max);
};

NumericInput.prototype.saveAdvancedProperties = function () {

    var initial_answer_validation;
    var min_value_validation;
    var max_value_validation;
    var uniqueness;

    this.dom.advanced_properties_wrapper = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //clear all advanced properties errors from dom
    this.hideAdvancedPropertiesErrors();

    //set integer or decimal numeric type
    this.type = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__numeric input:checked').val();

    //set default (initial answer)
    this.default = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val();

    //strip html tags
    this.default = this.default.replace(/(<([^>]+)>)/ig, '');
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(this.default);


    //set min value
    this.min = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__min input').val();
    this.min = this.min.replace(/(<([^>]+)>)/ig, '');
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__min input').val(this.min);

    //set max value
    this.max = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__max input').val();
    this.max = this.max.replace(/(<([^>]+)>)/ig, '');
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__max input').val(this.max);

    //set regex
    this.regex = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val();
    this.regex = this.regex.replace(/(<([^>]+)>)/ig, '');
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(this.regex);

    //set verify flag
    this.verify = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').is(':checked');

    //validate initial answer (based also on min max and numeric type)
    initial_answer_validation = this.isInitialAnswerValid();
    if (!initial_answer_validation.is_valid) {
        //warn user initial answer is not valid
        this.dom.is_valid = false;
        //highlight wrong input
        this.showAdvancedPropertiesErrors(consts.DEFAULT_PROPERTY, initial_answer_validation.error.message);
    }

    //validate min value
    min_value_validation = this.isMinValueValid();
    if (!min_value_validation.is_valid) {
        //warn user min value is not valid
        this.dom.is_valid = false;
        //highlight wrong input
        this.showAdvancedPropertiesErrors(consts.MIN_VALUE_PROPERTY, min_value_validation.error.message);
    }

    //validate max value
    max_value_validation = this.isMaxValueValid();
    if (!max_value_validation.is_valid) {
        //warn user min value is not valid
        this.dom.is_valid = false;
        //highlight wrong input
        this.showAdvancedPropertiesErrors(consts.MAX_VALUE_PROPERTY, max_value_validation.error.message);
    }

    //all advanced properties are valid, validate combinations across properties
    //min (if set) needs to be smaller than max (if set)
    if (min_value_validation.is_valid && max_value_validation.is_valid && this.min !== '' && this.max !== '') {

        if (parseFloat(this.min) >= parseFloat(this.max)) {
            //warn user min value is not valid
            this.dom.is_valid = false;
            //highlight wrong input
            this.showAdvancedPropertiesErrors(consts.MIN_VALUE_PROPERTY, messages.error.MIN_MUST_BE_SMALLER_THAN_MAX);
        }
    }

    //intial answer (if set) should be within the range set by min/max properties
    if (initial_answer_validation.is_valid && this.default !== '') {

        if (min_value_validation.is_valid && this.min !== '') {
            if (parseFloat(this.default) < parseFloat(this.min)) {
                //warn user min value is not valid
                this.dom.is_valid = false;
                //highlight wrong input
                this.showAdvancedPropertiesErrors(consts.DEFAULT_PROPERTY, messages.error.INITIAL_ANSWER_OUT_OF_RANGE);
            }
        }

        if (max_value_validation.is_valid && this.max !== '') {
            if (parseFloat(this.default) > parseFloat(this.max)) {
                //warn user min value is not valid
                this.dom.is_valid = false;
                //highlight wrong input
                this.showAdvancedPropertiesErrors(consts.DEFAULT_PROPERTY, messages.error.INITIAL_ANSWER_OUT_OF_RANGE);
            }
        }
    }

    //save uniqueness
    save.saveUniqueness(this);
};

NumericInput.prototype.hideAdvancedPropertiesErrors = function () {

    //reset validation dom feedback (hide all errors from dom)
    var properties_to_hide_error = [
        consts.DEFAULT_PROPERTY,
        consts.MIN_VALUE_PROPERTY,
        consts.MAX_VALUE_PROPERTY
    ];

    errors.hideAdvancedPropertiesErrors(this, properties_to_hide_error);
};

module.exports = NumericInput;
