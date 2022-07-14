/* global $*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');


var errors = {

    //hide all properties errors for the current selected input
    hidePropertiesErrors: function (the_properties_panel) {

        var properties_panel = the_properties_panel;

        //remove inline errors
        properties_panel.find('div.input-properties__form__question').removeClass('has-error has-feedback');
        properties_panel.find('div.input-properties__form__question > i').addClass('hidden');
        properties_panel.find('div.input-properties__form__question span.input-properties__form__error').text('');

        //remove visual errors from tabs
        properties_panel.find('.input-properties__tabs .nav-tabs i').addClass('invisible');
        properties_panel.find('.input-properties__tabs .nav-tabs i').parent().removeClass('validation-error');
    },

    hidePossibleAnswersErrors: function (the_input) {

        //todo this function is called 3 times whne validating on keyup, look inot it when there is time
        var input = the_input;
        var possible_answer_list = input.dom.properties_panel.find('.input-properties__form__possible-answers__list');

        $(possible_answer_list).each(function (index, possible_answer) {

            //highlight wrong input and show error message
            $(possible_answer).find('.input-properties__form__possible-answers__list__possible_answer_item')
                .removeClass('has-error has-feedback');

            $(possible_answer).find('.input-properties__form__error')
                .addClass('hidden')
                .text('');//set error description

        });
        //remove visual errors from tabs (if the input is valid, there might be some cuncurrency conditions)
        if (input.dom.is_valid) {
            input.dom.properties_panel.find('.input-properties__tabs .nav-tabs i').addClass('invisible');
            input.dom.properties_panel.find('.input-properties__tabs .nav-tabs i').parent().removeClass('validation-error');
        }
    },

    hideTabButtonsErrors: function () {
        //todo maybe this is not needed
    },

    hideAdvancedPropertiesErrors: function (input, the_properties) {

        var i;
        var properties = the_properties;
        var iLength = properties.length;
        var wrapper = formbuilder.dom
            .input_properties_forms_wrapper
            .find('form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__advanced-properties');


        for (i = 0; i < iLength; i++) {
            wrapper
                .find('div.input-properties__form__advanced-properties__' + properties[i])
                .removeClass('has-error has-feedback');

            wrapper
                .find('div.input-properties__form__advanced-properties__' + properties[i] + ' i')
                .addClass('hidden');

            wrapper
                .find('div.input-properties__form__advanced-properties__' + properties[i] + ' span.input-properties__form__error')
                .addClass('hidden')
                .text('');
        }
    },

    //hide inline errors from jumps (red ouline and error message)
    hideJumpsErrors: function (the_jumps_list) {

        var jump_list = the_jumps_list;
        var jump_properties = ['when', 'answer', 'goto'];

        $(jump_list).each(function (index, jump) {
            $(jump_properties).each(function (index, prop) {
                $(jump)
                    .find('.input-properties__form__jumps__logic--' + prop)
                    .removeClass('has-error')
                    .find('.input-properties__form__error')
                    .addClass('hidden')
                    .text('');
            });
        });
    },

    showQuestionTextErrors: function (the_properties_panel, the_error_message) {

        var properties_panel = the_properties_panel;
        var error = the_error_message;

        //highlight wrong input and show error message
        properties_panel.find('div.input-properties__form__question')
            .addClass('has-error has-feedback');
        properties_panel.find('div.input-properties__form__question i')
            .removeClass('hidden')
            .hide()
            .fadeIn(consts.ANIMATION_FAST);
        properties_panel.find('div.input-properties__form__question span.input-properties__form__error')
            .removeClass('hidden')
            .text(error)//set error description
            .hide()
            .fadeIn(consts.ANIMATION_FAST);

        //show '!' on affected tab, in this case the basic properties tab (first)
        properties_panel.find('.input-properties__tabs .nav-tabs i:first')
            .removeClass('invisible')
            .fadeIn(consts.ANIMATION_FAST);

        //set properties tab text to red
        properties_panel.find('.input-properties__tabs .nav-tabs i:first')
            .parent()
            .addClass('validation-error');


    },

    showFormNameErrors: function (the_modal, the_error_message) {

        var modal = the_modal;
        var error = the_error_message;

        modal.find('.modal-body .input-properties__form__error')
            .removeClass('hidden')
            .text(error)//set error description
            .hide()
            .fadeIn(300);
    },

    hideFormNameErrors: function (the_modal) {

        var modal = the_modal;
        modal.find('.modal-body .input-properties__form__error')
            .addClass('hidden')
            .text('');
    },

    showPossibleAnswerErrors: function (the_possible_answer, the_error_message) {

        var possible_answer = the_possible_answer;
        var properties_panel = possible_answer.parents().eq(9);
        var error = the_error_message;

        //highlight wrong input and show error message
        possible_answer.find('.input-properties__form__possible-answers__list__possible_answer_item')
            .addClass('has-error has-feedback');

        possible_answer.find('.input-properties__form__error')
            .removeClass('hidden')
            .text(error)//set error description
            .hide()
            .fadeIn(300);


        //show '!' on affected tab, in this case the basic properties tab (first)
        properties_panel.find('.input-properties__tabs .nav-tabs i:first')
            .removeClass('invisible')
            .hide()
            .fadeIn(300);

        //set properties tab text to red
        properties_panel.find('.input-properties__tabs .nav-tabs i:first')
            .parent()
            .addClass('validation-error');

    },

    showSingleAdvancedPropertyError: function (the_wrapper, the_property, the_error) {

        var prop = the_property;
        var error = the_error;
        var wrapper = the_wrapper;

        wrapper
            .find('div.input-properties__form__advanced-properties__' + prop).addClass('has-error has-feedback');

        wrapper
            .find('div.input-properties__form__advanced-properties__' + prop + ' i')
            .removeClass('hidden')
            .hide()
            .fadeIn(300);

        wrapper
            .find('div.input-properties__form__advanced-properties__' + prop + ' span.input-properties__form__error')
            .removeClass('hidden')
            .text(error)
            .hide()
            .fadeIn(300);

        //show '!' on affected tab, in this case the advanced properties tab
        wrapper.parent().parent().find('.nav-tabs').find('i.advanced-error')
            .removeClass('invisible')
            .hide()
            .fadeIn(300);

        //set properties tab text to red
        wrapper.parent().parent().find('.nav-tabs').find('i.advanced-error')
            .parent()
            .addClass('validation-error');
    },

    showSingleJumpErrors: function (the_jump_item_wrapper, the_properties) {

        var jump_properties = the_properties;
        var wrapper = the_jump_item_wrapper;
        var ui = require('helpers/ui');

        //jump condition was not selected
        if (jump_properties.when === undefined) {
            wrapper
                .find('.input-properties__form__jumps__logic--when')
                .addClass('has-error')
                .find('.input-properties__form__error')
                .removeClass('hidden')
                .text(messages.error.JUMP_CONDITION_NOT_SELECTED);
        }

        //jump answer not selected
        if (jump_properties.answer_ref === undefined) {
            wrapper
                .find('.input-properties__form__jumps__logic--answer')
                .addClass('has-error ')
                .find('.input-properties__form__error')
                .removeClass('hidden')
                .text(messages.error.JUMP_ANSWER_NOT_SELECTED);
        }

        //jump destination not selected
        if (jump_properties.to === undefined) {
            wrapper
                .find('.input-properties__form__jumps__logic--goto')
                .addClass('has-error ')
                .find('.input-properties__form__error')
                .removeClass('hidden')
                .text(messages.error.JUMP_DESTINATION_NOT_SELECTED);
        }

        //jump destination not valid (after dragging)
        if (!jump_properties.has_valid_destination) {
            wrapper
                .find('.input-properties__form__jumps__logic--goto')
                .addClass('has-error')
                .find('.input-properties__form__error')
                .removeClass('hidden')
                .text(messages.error.JUMP_DESTINATION_NOT_SELECTED);
        }

        console.log(wrapper.parents().eq(5));

        ui.input_properties_panel.showJumpTabError(wrapper);
    },

    showBranchInputsErrors: function (the_properties_panel, the_error_message) {

        var properties_panel = the_properties_panel;
        var error = the_error_message;
        var branch_input_ref = formbuilder.branch.current_input_ref;
        var ui = require('helpers/ui');


        //show error message
        properties_panel.find('.input-properties__form__error--branch-error')
            .removeClass('invisible')
            .text(error);
        //.hide()
        //  .fadeIn(300);

        //toggle icon to warning
        ui.inputs_collection.showInputInvalidIcon(branch_input_ref);
    },

    showGroupInputsErrors: function (the_properties_panel, the_error_message) {

        var properties_panel = the_properties_panel;
        var error = the_error_message;
        var branch_input_ref = formbuilder.branch.current_input_ref;
        var ui = require('helpers/ui');


        //show error message
        properties_panel.find('.input-properties__form__error--group-error')
            .removeClass('invisible')
            .text(error);
        // .hide()
        //.fadeIn(300);

        //toggle icon to warning
        ui.inputs_collection.showInputInvalidIcon(branch_input_ref);
    },

    hideBranchInputsErrors: function (the_properties_panel) {
        //show error message
        the_properties_panel.find('.input-properties__form__error--branch-error')
            .addClass('invisible')
            .text('&nbsp;');
    },

    hideGroupInputsErrors: function (the_properties_panel) {
        //show error message
        the_properties_panel.find('.input-properties__form__error--group-error')
            .addClass('invisible')
            .text('&nbsp;');
    }
};

module.exports = errors;
