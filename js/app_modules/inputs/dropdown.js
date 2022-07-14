/* global $*/
'use strict';
var consts = require('../config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var InputMultipleAnswers = require('factory/input-multiple-answers-prototype');
var validation = require('actions/validation');
var formbuilder = require('../config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var DropdownInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set default properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.DROPDOWN_TYPE;

    //set a default answer on newly created dropdowns inputs
    this.possible_answers = [{
        answer: 'I am a placeholder answer',
        answer_ref: utils.generateUniqID()
    }];

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;

    //pagination defaults
    formbuilder.possible_answers_pagination[this.ref] = {};
    formbuilder.possible_answers_pagination[this.ref].page = 1;
};

//extend prototype from basic input object and multiple answer object
DropdownInput.prototype = $.extend({}, Input.prototype, InputMultipleAnswers.prototype);


module.exports = DropdownInput;
