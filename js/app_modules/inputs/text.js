/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var TextInput = function (the_input_ref) {

    //extend basic input (using a clone, not a reference) wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    this.ref = the_input_ref;
    this.type = consts.TEXT_TYPE;

    /* reset DOM properties (jquery selectors are not 'live')*/
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
TextInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

TextInput.prototype.setAdvancedInputProperties = function () {

    //set  'default' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(this.default);

    //set 'regex' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(this.regex);

    //set 'input_ref' on 'double entry verification' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').prop('checked', this.verify);

    //set 'input_ref' on 'uniqueness' option
    ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);
};


TextInput.prototype.hideAdvancedPropertiesErrors = function () {

    //reset validation dom feedback (hide all errors from dom)
    var properties_to_hide_error = [
        consts.DEFAULT_PROPERTY
    ];
    errors.hideAdvancedPropertiesErrors(this, properties_to_hide_error);
};

module.exports = TextInput;
