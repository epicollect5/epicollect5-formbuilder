'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var callback = function (e) {

    var input = utils.getInputObjectByRef(formbuilder.current_input_ref);

    console.log(e.target);
    console.log($(this));

    input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');

    //get selected initial answer
    var initial_answer = input.dom.properties_panel
        .find('.input-properties__form__advanced-properties')
        .find('.input-properties__form__advanced-properties__default')
        .find('select').find(':selected');

    console.log(initial_answer);

    if (initial_answer.val() === input.default && input.default !== '') {
        initial_answer.text(utils.getPossibleAnswerLabel(input));
    }

    console.log(input);
    console.log('refresh initial answer');


};

module.exports = callback;
