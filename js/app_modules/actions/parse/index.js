'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var input_factory = require('factory/input-factory');
var Input = require('factory/input-prototype');
var form_factory = require('factory/form-factory');
var template = require('template');
var validation = require('actions/validation');
var methods = {
    getBranchInputsHTML: require('actions/parse/methods/getBranchInputsHTML'),
    getGroupInputsHTML: require('actions/parse/methods/getGroupInputsHTML'),
    renderInputs: require('actions/parse/methods/renderInputs'),
    renderProject: require('actions/parse/methods/renderProject'),
    renderChildForms: require('actions/parse/methods/renderChildForms'),
    initFormbuilder: require('actions/parse/methods/initFormbuilder')
};

var parse = {

    action: '',

    renderInputs: function (the_inputs) {
        return methods.renderInputs(the_inputs);
    },

    getBranchInputsHTML: function (the_input, the_index) {
        return methods.getBranchInputsHTML(the_input, the_index);
    },
    //branch index is set when it is a nested group only
    getGroupInputsHTML: function (the_input, the_index, the_branch_index) {
        return methods.getGroupInputsHTML(the_input, the_index, the_branch_index);
    },

    renderProject: function (project_definition, action) {
        return methods.renderProject(project_definition, action);
    },

    initFormbuilder: function () {
        return methods.initFormbuilder();
    },

    //render children forms recursively
    renderChildForm: function (the_child_forms) {
        return methods.renderChildForms(the_child_forms);
    }
};

module.exports = parse;

