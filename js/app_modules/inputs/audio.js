'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var validation = require('actions/validation');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var formbuilder = require('config/formbuilder');

var AudioInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set default properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.AUDIO_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
AudioInput.prototype = Object.create(Input.prototype);

module.exports = AudioInput;
