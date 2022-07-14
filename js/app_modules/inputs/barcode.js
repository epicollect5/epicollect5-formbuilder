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

var BarcodeInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
   // this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.BARCODE_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
BarcodeInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

BarcodeInput.prototype.setAdvancedInputProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //set  'default' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(this.default);

    //set 'regex' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(this.regex);

    //set 'input_ref' on 'double entry verification' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').prop('checked', this.verify);

    ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);
};

BarcodeInput.prototype.hideAdvancedPropertiesErrors = function () {

    //reset validation dom feedback (hide all errors from dom)
    var properties_to_hide_error = [
        consts.DEFAULT_PROPERTY
    ];
    errors.hideAdvancedPropertiesErrors(this, properties_to_hide_error);
};

module.exports = BarcodeInput;
