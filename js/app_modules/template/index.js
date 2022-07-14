'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var methods = {};

methods.replaceCommonAdvancedProperties = require('template/methods/replaceCommonAdvancedProperties');
methods.createInputToolHTML = require('template/methods/createInputToolHTML');
methods.prepareAdvancedInputPropertiesHTML = require('template/methods/prepareAdvancedInputPropertiesHTML');
methods.getJumpTabBtnHTML = require('template/methods/getJumpTabBtnHTML');
methods.getAdvancedTabBtnHTML = require('template/methods/getAdvancedTabBtnHTML');
methods.createBasicPropertiesHTML = require('template/methods/createBasicPropertiesHTML');
methods.getUniquenessHTML = require('template/methods/getUniquenessHTML');
methods.getPossibleAnswersHTML = require('template/methods/getPossibleAnswersHTML');
methods.getInputPropertiesPanelHTML = require('template/methods/getInputPropertiesPanelHTML');
methods.createInputPropertiesHTML = require('template/methods/createInputPropertiesHTML');
methods.getJumpsListHTML = require('template/methods/getJumpsListHTML');

var template = {

    replaceCommonAdvancedProperties: function (the_markup, the_input) {
        return methods.replaceCommonAdvancedProperties(the_markup, the_input);
    },
    createInputToolHTML: function (input) {
        return methods.createInputToolHTML(input);
    },
    prepareAdvancedInputPropertiesHTML: function (view, input) {
        return methods.prepareAdvancedInputPropertiesHTML(view, input);
    },
    getAdvancedTabBtnHTML: function (ref, is_active) {
        return methods.getAdvancedTabBtnHTML(ref, is_active);
    },
    getJumpTabBtnHTML: function (ref, is_active) {
        return methods.getJumpTabBtnHTML(ref, is_active);
    },
    createBasicPropertiesHTML: function (input) {
        return methods.createBasicPropertiesHTML(input);
    },
    getUniquenessHTML: function (input) {
        return methods.getUniquenessHTML(input);
    },
    getPossibleAnswersHTML: function (input) {
        return methods.getPossibleAnswersHTML(input);
    },
    getInputPropertiesPanelHTML: function (input) {
        return methods.getInputPropertiesPanelHTML(input);
    },
    createInputPropertiesHTML: function (input, view) {
        return methods.createInputPropertiesHTML(input, view);
    },
    getJumpsListHTML: function (input) {
        return methods.getJumpsListHTML(input);
    }
};

module.exports = template;
