/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');

var saveJumps = function (input) {

    var ui = require('helpers/ui');
    var undo = require('actions/undo');
    var jumps_list_wrapper = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + input.ref + '"]')
        .find('.input-properties__form__jumps .input-properties__form__jumps__list');

    var jumps = jumps_list_wrapper.find('li');
    var jump_properties = {
        are_valid: null,
        when: null,
        to: null,
        answer_ref: null,
        type: null
    };

    input.hideJumpsErrors(jumps);

    //reset all jumps
    input.jumps = [];
    jumps.each(function (i) {
            jump_properties.has_valid_destination = true;
            jump_properties.type = input.type;

            //get jump properties
            jump_properties.when = $(this).find('.input-properties__form__jumps__logic--when select option:selected').val();
            jump_properties.to = $(this).find('.input-properties__form__jumps__logic--goto select option:selected').val();
            jump_properties.answer_ref = $(this).find('.input-properties__form__jumps__logic--answer select option:selected').val();

            //validate jump properties
            jump_properties.are_valid = input.isJumpValid(jump_properties);

            if (!jump_properties.are_valid) {

                //show errors
                input.showSingleJumpErrors($(this), jump_properties);

                //set input as invalid
                input.dom.is_valid = false;
            }

            //save jump anyway, as it is flag as invalid and it will keep the project invalid until it is either removed or set properly
            input.jumps[i] = {
                to: jump_properties.to,
                //this will be always 'ALL' for this type of input
                when: jump_properties.when,
                //this will be null for single answer options. val() is set to answer_ref of possible answer otherwise
                answer_ref: jump_properties.answer_ref || null
            };
        }
    );
    undo.pushState();
};

module.exports = saveJumps;
