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

var ReadmeInput = function (the_input_ref) {

    //extend basic input (using a clone, not a reference) wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    this.ref = the_input_ref;
    this.type = consts.README_TYPE;

    /* reset DOM properties (jquery selectors are not 'live')*/
    this.dom = {};
    this.dom.is_valid = false;

    //override a few properties for validation purposes server side
    this.is_title = false;
    this.verify = false;
    this.is_required = false;



};

//extend prototype from basic input object
ReadmeInput.prototype = Object.create(Input.prototype);


/*
 Overrides
 */


module.exports = ReadmeInput;
