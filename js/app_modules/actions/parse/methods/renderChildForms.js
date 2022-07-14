'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var input_factory = require('factory/input-factory');
var Input = require('factory/input-prototype');
var form_factory = require('factory/form-factory');
var template = require('template');

var renderChildForms = function (the_child_forms) {

    var child_forms = the_child_forms;
    var child_form = child_forms.shift();
    var child_inputs;
    var self = this;

    formbuilder.current_form_index++;

    //render child form
    $.when(form_factory.createChildForm(child_form.name, child_form.ref, formbuilder.current_form_index, false)).then(function () {

        //append inputs and their properties panels
        child_inputs = self.renderInputs(child_form.inputs);
        //replace object literal inputs with newly generated ones via factory (i.e. using new) so they get the prototype
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs = child_inputs.slice();

        //remove no questions message
        formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').addClass('hidden');

        //hide properties panel buttons as no input is selected
        formbuilder.dom.input_properties_buttons.fadeOut();

        //render next child form recursively
        if (child_forms.length > 0) {
            self.renderChildForms(child_forms);
        }
        else {
            self.initFormbuilder();
        }
    });

};

module.exports = renderChildForms;
