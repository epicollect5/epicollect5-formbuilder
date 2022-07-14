'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var input_factory = require('factory/input-factory');
var form_factory = require('factory/form-factory');
var Input = require('factory/input-prototype');
var template = require('template');
var validation = require('actions/validation');

var renderProject = function (project_definition) {

    var self = this;
    var forms = project_definition.data.project.forms.slice();//need a deep copy
    var inputs;

    self.deferred = new $.Deferred();

    //if undoing, reset formbuilder on top parent form
    if (formbuilder.render_action === consts.RENDER_ACTION_UNDO) {
        console.log('resetting references to top parent form');
        form_factory.updateFormbuilderDomReferences(forms[0].ref);
    }

    //render top parent form by default as the formbuilder loads.
    formbuilder.current_form_index = 0;
    inputs = self.renderInputs(forms[0].inputs);

    //remove no questions message (if any inputs)
    if (inputs.length > 0) {
        formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').addClass('hidden');
    }

    //show no title warning (if no title set for the first form and we have inputs)
    if (utils.getTitleCount(inputs) === 0 && inputs.length > 0) {
        ui.inputs_collection.toggleTitleWarning(0, false);
    }

    //toggle form icon to a green chck if the top parent form is valid
    if (validation.areFormInputsValid(0)) {
        ui.forms_tabs.showFormValidIcon(0);

        //enable download form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').removeClass('disabled');

        //enable print as pdf form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').removeClass('disabled');
    }

    //if no inputs, disable download form button
    if (inputs.length === 0) {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').addClass('disabled');

        //disable print as pdf
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').addClass('disabled');
    }
    else {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').removeClass('disabled');

        //enable print as pdf form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').removeClass('disabled');
    }

    //replace object literal inputs with newly generated ones via factory (i.e. using new) so they get the prototype
    formbuilder.project_definition.data.project.forms[0].inputs = inputs.slice();

    //remove first form as it is already rendered
    forms.shift();

    //render child forms recursively (if any)
    if (forms.length > 0) {
        self.renderChildForms(forms);
    }
    else {
        self.initFormbuilder();
    }

    return self.deferred.promise();
};

module.exports = renderProject;
