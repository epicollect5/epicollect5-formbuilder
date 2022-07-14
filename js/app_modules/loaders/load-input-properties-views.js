'use strict';
var consts = require('config/consts.js');
var ui = require('helpers/ui');
var utils = require('helpers/utils');


var load_input_properties_views = function () {

    var views = {};
    var deferred = new $.Deferred();
    var path = utils.getPropertiesPath();
    var version = consts.FORMBUILDER_VERSION;

    $.when(
        $.get(path + 'properties-audio.html?v=' + version, function (data) {
            views.audio = data;
        }),
        $.get(path + 'properties-barcode.html?v=' + version, function (data) {
            views.barcode = data;
        }),
        $.get(path + 'properties-branch.html?v=' + version, function (data) {
            views.branch = data;
        }),
        $.get(path + 'properties-checkbox.html?v=' + version, function (data) {
            views.checkbox = data;
        }),
        $.get(path + 'properties-date.html?v=' + version, function (data) {
            views.date = data;
        }),
        $.get(path + 'properties-dropdown.html?v=' + version, function (data) {
            views.dropdown = data;
        }),
        $.get(path + 'properties-group.html?v=' + version, function (data) {
            views.group = data;
        }),
        $.get(path + 'properties-integer.html?v=' + version, function (data) {
            views.integer = data;
            views.decimal = data;
        }),
        $.get(path + 'properties-location.html?v=' + version, function (data) {
            views.location = data;
        }),
        $.get(path + 'properties-photo.html?v=' + version, function (data) {
            views.photo = data;
        }),
        $.get(path + 'properties-phone.html?v=' + version, function (data) {
            views.phone = data;
        }),
        $.get(path + 'properties-radio.html?v=' + version, function (data) {
            views.radio = data;
        }),
        $.get(path + 'properties-textarea.html?v=' + version, function (data) {
            views.textarea = data;
        }),
        $.get(path + 'properties-readme.html?v=' + version, function (data) {
            views.readme = data;
        }),
        $.get(path + 'properties-text.html?v=' + version, function (data) {
            views.text = data;
        }),
        $.get(path + 'properties-time.html?v=' + version, function (data) {
            views.time = data;
        }),
        $.get(path + 'properties-video.html?v=' + version, function (data) {
            views.video = data;
        }),
        $.get(path + 'properties-searchsingle.html?v=' + version, function (data) {
            views.searchsingle = data;
        }),
        $.get(path + 'properties-searchsingle.html?v=' + version, function (data) {
            views.searchmultiple = data;
        })
    ).then(function () {
        deferred.resolve(views);
    });
    return deferred.promise();
};

module.exports = load_input_properties_views;
