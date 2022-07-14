'use strict';
var consts = require('../config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var formbuilder = require('../config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var DateInput = function (the_input_ref) {

    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.DATE_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
DateInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

DateInput.prototype.setAdvancedInputProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //set default to current datetime?
    this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__default-to-current input').prop('checked', this.set_to_current_datetime);

    //set datetime format
    this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__dateformat input[name="dateformatRadio"][value="' + this.datetime_format + '"]')
        .prop('checked', true);

    ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);
};


DateInput.prototype.saveAdvancedProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //set default to current datetime?
    this.set_to_current_datetime = this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__default-to-current input')
        .is(':checked');

    //set datetime format
    this.datetime_format = this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__dateformat input[name="dateformatRadio"]:checked')
        .val();

    //save uniqueness
    save.saveUniqueness(this);
};

module.exports = DateInput;
