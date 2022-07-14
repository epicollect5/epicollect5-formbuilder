/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var possible_answers = require('actions/possible-answers');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var template = require('template');

var InputMultipleAnswers = function () {
};

InputMultipleAnswers.prototype.prepareAdvancedInputProperties = function (view) {
    return template.prepareAdvancedInputProperties(view, this);
};

InputMultipleAnswers.prototype.setAdvancedInputProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    this.dom.advanced_properties_wrapper
        .find('div.panel-body div.input-properties__form__advanced-properties__default select option[value="' + this.default + '"]').prop('selected', true);

    //set 'input_ref' on 'uniqueness' option
    //  ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);

};

InputMultipleAnswers.prototype.saveAdvancedProperties = function () {

    var self = this;

    self.dom.advanced_properties_wrapper = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__advanced-properties');
    //set default
    this.default = this.dom.advanced_properties_wrapper
        .find('div.panel-body div.input-properties__form__advanced-properties__default select option:selected')
        .val();

    if (this.default === 'None') {
        this.default = null;
    }

    //for SEARCH type, save if the search allow a single answer or multiple answers
    if (self.type === consts.SEARCH_SINGLE_TYPE || self.type === consts.SEARCH_MULTIPLE_TYPE) {

        //set single or multiple search type
        self.type = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__search input:checked').val();
    }

};

InputMultipleAnswers.prototype.hidePropertiesErrors = function () {
    errors.hidePropertiesErrors(this.dom.properties_panel);
    errors.hidePossibleAnswersErrors(this);
};

InputMultipleAnswers.prototype.addPossibleAnswer = function () {
    possible_answers.addPossibleAnswer(this);
};

InputMultipleAnswers.prototype.removePossibleAnswer = function (the_answer_index) {
    possible_answers.removePossibleAnswer(this, the_answer_index);
};


InputMultipleAnswers.prototype.savePossibleAnswers = function () {
    save.savePossibleAnswers(this);
};
InputMultipleAnswers.prototype.showPossibleAnswerErrors = function (the_possible_answer, the_error_message) {
    errors.showPossibleAnswerErrors(the_possible_answer, the_error_message);
};
InputMultipleAnswers.prototype.hidePossibleAnswersErrors = function (the_possible_answers) {
    errors.hidePossibleAnswersErrors(this, the_possible_answers);
};
InputMultipleAnswers.prototype.isPossibleAnswerValid = function (the_answer) {
    //validate possible answer
    return validation.isPossibleAnswerValid(the_answer);
};

/*
 update the selected possible answers for the jumps, in case the possible answers got changed by the user
 this is to refresh the dom when the user change a possible answer text and then switches to the jumps panel:
 if an old option was selected, we reflect that change on the dom
 */
InputMultipleAnswers.prototype.updateJumpPossibleAnswers = function (the_jump_panel) {
    possible_answers.updateJumpPossibleAnswers(this, the_jump_panel);
};

InputMultipleAnswers.prototype.updatePossibleInitialAnswers = function () {
    possible_answers.updatePossibleInitialAnswers(this);
};

InputMultipleAnswers.prototype.listPossibleInitialAnswers = function () {
    possible_answers.listPossibleInitialAnswers(this);
};

InputMultipleAnswers.prototype.addJump = function () {

    var self = this;

    //set "Add Jump" button reference (so it is available when playing with jumps)
    self.dom.add_jump_button = formbuilder.dom.input_properties
        .find('.panel-body form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__jumps__add-jump');

    $.when(jumps.addJump(self, true)).then(function () {

        //disable add jump button if total of jumps is equal to total of possible answers
        if (self.jumps.length === self.possible_answers.length) {
            self.dom.add_jump_button.attr('disabled', true);
        }
    });
};

//override the existing method, as we need an extra check for these types of input
InputMultipleAnswers.prototype.removeJump = function (the_remove_btn) {

    var self = this;

    //set "Add Jump" button reference (so it is available when playing with jumps)
    self.dom.add_jump_button = formbuilder.dom.input_properties
        .find('.panel-body form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__jumps__add-jump');

    jumps.removeJump(self, the_remove_btn);

    //enable button if we removed last jump
    if (self.jumps.length === 0) {
        //enable add jump button
        self.dom.add_jump_button.attr('disabled', false);
    }
    else {
        //enable button if we can add jumps
        if (self.jumps.length < self.possible_answers.length) {
            self.dom.add_jump_button.attr('disabled', false);
        }
    }
};

module.exports = InputMultipleAnswers;
