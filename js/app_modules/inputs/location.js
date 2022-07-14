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

var LocationInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set default properties
   // this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.LOCATION_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
LocationInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */
//LocationInput.prototype.prepareAdvancedInputProperties = function () {
//};
//
//LocationInput.prototype.hideAdvancedPropertiesErrors = function () {
//    //do nothing
//};

module.exports = LocationInput;
