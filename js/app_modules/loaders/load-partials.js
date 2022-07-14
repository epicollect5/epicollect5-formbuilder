'use strict';
var consts = require('config/consts.js');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var get_partials = function () {

    var partials = {};
    var deferred = new $.Deferred();
    var path = utils.getPartialsPath();
    var version = consts.FORMBUILDER_VERSION;

    $.when(
        $.get(path + 'nav-tabs.html?v=' + version, function (data) {
            partials.navtabs = data;
        }),
        $.get(path + 'basic-properties.html?v=' + version, function (data) {
            partials.basic_properties = data;
        }),
        $.get(path + 'uniqueness-form-checkbox.html?v=' + version, function (data) {
            partials.uniqueness_form_checkbox = data;
        }),
        $.get(path + 'uniqueness-hierarchy-checkboxes.html?v=' + version, function (data) {
            partials.uniqueness_hierarchy_checkboxes = data;
        }),
        $.get(path + 'uniqueness-branch-checkbox.html?v=' + version, function (data) {
            partials.uniqueness_branch_checkbox = data;
        }),
        $.get(path + 'exit-branchgroup-editing.html?v=' + version, function (data) {
            partials.exit_branchgroup_editing = data;
        }),
        $.get(path + 'basic-media-properties.html?v=' + version, function (data) {
            partials.basic_media_properties = data;
        }),
        $.get(path + 'basic-branch-properties.html?v=' + version, function (data) {
            partials.basic_branch_properties = data;
        }),
        $.get(path + 'basic-group-properties.html?v=' + version, function (data) {
            partials.basic_group_properties = data;
        }),
        $.get(path + 'basic-readme-properties.html?v=' + version, function (data) {
            partials.basic_readme_properties = data;
        }),
        $.get(path + 'possible-answers-wrapper.html?v=' + version, function (data) {
            partials.possible_answers_wrapper = data;
        }),
        $.get(path + 'possible-answer-list-item.html?v=' + version, function (data) {
            partials.possible_answer_list_item = data;
        }),
        $.get(path + 'jumps-wrapper.html?v=' + version, function (data) {
            partials.jumps_wrapper = data;
        }),
        $.get(path + 'jump-list-item.html?v=' + version, function (data) {
            partials.jump_list_item = data;
        }),
        $.get(path + 'jump-list-item-always-jump.html?v=' + version, function (data) {
            partials.jump_list_item_always_jump = data;
        }),
        $.get(path + 'modal-form.html?v=' + version, function (data) {
            partials.modal_edit_form_name = data;
        }),
        $.get(path + 'input-tool.html?v=' + version, function (data) {
            partials.input_tool = data;
        })
    ).then(function () {
        deferred.resolve(partials);
    });
    return deferred.promise();
};

module.exports = get_partials;
