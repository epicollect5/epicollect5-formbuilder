/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var template = require('template');


var Input = function () {
};

Input.prototype.prepareAdvancedInputProperties = function () {
    //override in specific input type
};

Input.prototype.isQuestionTextValid = function () {
    //validate question text
    return validation.isQuestionTextValid(this);
};

Input.prototype.hideQuestionErrors = function () {
    this.hidePropertiesErrors();
};
Input.prototype.showQuestionErrors = function (the_error_message) {
    this.showPropertiesErrors(the_error_message);
};

Input.prototype.isInitialAnswerValid = function () {
    //validate initial answer
    return validation.isInitialAnswerValid(this.type, this.default, this.regex);
};

Input.prototype.isJumpValid = function (the_jump_properties) {
    //validate initial answer
    return validation.isJumpValid(the_jump_properties, this);
};

Input.prototype.saveProperties = function () {
    save.saveProperties(this);
};

Input.prototype.saveAdvancedProperties = function () {
    save.saveAdvancedProperties(this);
};

Input.prototype.saveJumps = function () {
    save.saveJumps(this);
};

Input.prototype.showPropertiesErrors = function (the_error_message) {
    errors.showQuestionTextErrors(this.dom.properties_panel, the_error_message);
};

Input.prototype.hidePropertiesErrors = function () {
    errors.hidePropertiesErrors(this.dom.properties_panel);
};

Input.prototype.showAdvancedPropertiesErrors = function (the_invalid_property, the_error_message) {
    errors.showSingleAdvancedPropertyError(this.dom.advanced_properties_wrapper, the_invalid_property, the_error_message);
};

Input.prototype.hideAdvancedPropertiesErrors = function () {
    //override in specific input type
};

Input.prototype.addJump = function () {

    var self = this;

    //set "Add Jump" button reference (so it is available when playing with jumps)
    self.dom.add_jump_button = formbuilder.dom.input_properties
        .find('.panel-body form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__jumps__add-jump');

    $.when(jumps.addJump(this)).then(function () {
        //disable add jump button as this input type only allows to set a single jump
        self.dom.add_jump_button.attr('disabled', true);
    });
};

Input.prototype.removeJump = function (the_remove_btn) {

    var self = this;

    self.dom.add_jump_button = formbuilder.dom.input_properties
        .find('.panel-body form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__jumps__add-jump');

    jumps.removeJump(this, the_remove_btn);

    if (this.jumps.length === 0) {
        //enable add jump button
        this.dom.add_jump_button.attr('disabled', false);
    }
};

Input.prototype.showSingleJumpErrors = function (the_jump_item, the_jump_properties) {
    errors.showSingleJumpErrors(the_jump_item, the_jump_properties);
};
Input.prototype.hideJumpsErrors = function (the_jumps_list) {
    errors.hideJumpsErrors(the_jumps_list);
};

module.exports = Input;
