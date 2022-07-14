'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var template = require('template');

var renderInputs = function (the_inputs) {

    var self = this;
    var inputs = the_inputs;
    var html;
    var properties;
    var properties_panel_html;
    var generated_inputs = [];
    var input_collection_html = '';
    var input_properties_panel_html = '';


    $.each(inputs, function (index, input) {

        var input_factory = require('factory/input-factory');

        ///**
        // * Loop all jumps to remove any "has_valid_destination" property
        // * this was caused by a bug so a few projects have it.
        // * Instead of hacking the db, we sanitise that here
        // * so the next time they save the project is ok
        // */
        //$(input.jumps).each(function(jumpIndex, jump){
        //    delete jump.has_valid_destination;
        //});

        //create html element for input collection (middle column)
        html = input_factory.createInputToolHTML(input);
        input_collection_html += html;

        //copy input properties from stored input
        properties = JSON.parse(JSON.stringify(input));

        //generate new input with attached prototype
        input = input_factory.createInput(properties.type, properties.ref);

        //on load (when loading an existing project)
        if (formbuilder.render_action === consts.RENDER_ACTION_DO) {
            console.log('render on load');
            //set input as valid, as it is generated as invalid by default
            input.dom.is_valid = true;
        }

        //set input properties to stored input properties (only the one saved in the project definition, leave the others intact)
        for (var property in input) {
            if (properties.hasOwnProperty(property)) {
                input[property] = properties[property];
            }
        }

        //override 'global' input obj literal with newly created
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[index] = input;

        //if it is a branch, loop all the branch inputs (there must be at least a branch input)
        if (input.type === consts.BRANCH_TYPE) {

            //set edit branch to true when rendering from a saved project,
            //because we are re-using functions that expects this flag to be true
            formbuilder.is_editing_branch = true;
            formbuilder.branch.active_branch_header = input.question;
            formbuilder.branch.active_branch_ref = input.ref;

            var branch_inputs_html = self.getBranchInputsHTML(input, index);
            input_collection_html = input_collection_html.replace('{{branch-content}}', branch_inputs_html.collection);
            input_properties_panel_html += branch_inputs_html.panels;

            //reset edit branch flag
            formbuilder.is_editing_branch = false;
            formbuilder.branch.active_branch_ref = null;
            formbuilder.branch.active_branch_ref = null;
        }

        //if it is a group, loop all the group inputs (there must be at least a group input)
        if (input.type === consts.GROUP_TYPE) {

            formbuilder.is_editing_group = true;
            //todo should I set active group header and active group ref?
            //todo maybe because I do nit have jumps in groups?

            var group_inputs_html = self.getGroupInputsHTML(input, index, null);
            input_collection_html = input_collection_html.replace('{{group-content}}', group_inputs_html.collection);
            input_properties_panel_html += group_inputs_html.panels;

            formbuilder.is_editing_group = false;
        }

        //per each input with possible answers keep track of pagination
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) > -1) {
            //we have possible answers
            formbuilder.possible_answers_pagination[input.ref] = {};
            formbuilder.possible_answers_pagination[input.ref].page = 1;
        }
        //create properties panel for current input
        properties_panel_html = template.getInputPropertiesPanelHTML(input);
        input_properties_panel_html += properties_panel_html;

        //hide panels as by default no inputs are selected
        formbuilder.dom.input_properties.find('.panel-body form').hide();

        //save newly generated input
        generated_inputs.push(input);
    });

    formbuilder.dom.inputs_collection_sortable.append(input_collection_html);
    formbuilder.dom.input_properties_forms_wrapper.append(input_properties_panel_html);

    return generated_inputs;
};

module.exports = renderInputs;
