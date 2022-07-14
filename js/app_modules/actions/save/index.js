/* global $*/
'use strict';
var saveAllInputProperties = require('actions/save/module.saveAllInputProperties');
var saveProperties = require('actions/save/module.saveProperties');
var savePossibleAnswers = require('actions/save/module.savePossibleAnswers');
var saveAdvancedProperties = require('actions/save/module.saveAdvancedProperties');
var saveJumps = require('actions/save/module.saveJumps');
var saveUniqueness = require('actions/save/module.saveUniqueness');
var doCleaningBeforeSaving = require('actions/save/module.doCleaningBeforeSaving');

var save = {

    saveUniqueness: function (the_input) {
        return saveUniqueness(the_input);
    },
    saveAllInputProperties: function (the_input) {
        return saveAllInputProperties(the_input);
    },
    saveProperties: function (the_input) {
        return saveProperties(the_input);
    },
    savePossibleAnswers: function (the_input) {
        return savePossibleAnswers(the_input);
    },
    saveAdvancedProperties: function (the_input) {
        return saveAdvancedProperties(the_input);
    },
    saveJumps: function (the_input) {
        return saveJumps(the_input);
    },
    doCleaningBeforeSaving: function (the_forms) {
        return doCleaningBeforeSaving(the_forms);
    }
};

module.exports = save;
