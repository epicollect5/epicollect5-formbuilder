'use strict';
var ui = require('helpers/ui');
var formbuilder = require('config/formbuilder');
var template = require('template');
var consts = require('config/consts');

var getBranchInputsHTML = function (the_input, the_index) {

    var input_factory = require('factory/input-factory');
    var self = this;
    var input = the_input;
    var index = the_index;
    var branch_properties;
    var html;
    var branch_sortable_html = ui.inputs_collection.getEmptyCollectionSortableHTML(consts.BRANCH_TYPE);
    var branch_input_collection_html = '';
    var branch_properties_panel_html = '';
    var properties_panel_html = '';

    formbuilder.current_input_ref = input.ref;

    //if no branch inputs, show "no branch inputs message"

    $.each(input.branch, function (branch_index, branch_input) {

        //create html branch element for input collection (middle column)
        html = input_factory.createInputToolHTML(branch_input);
        branch_input_collection_html += html;

        //copy input properties from stored branch input
        branch_properties = JSON.parse(JSON.stringify(branch_input));

        //generate new branch input with attached prototype
        branch_input = input_factory.createInput(branch_properties.type, branch_properties.ref);

        //set branch input properties to stored properties (only the one saved in the project definition, leave the others intact)
        for (var property in branch_input) {
            if (branch_properties.hasOwnProperty(property)) {
                branch_input[property] = branch_properties[property];
            }
        }
        //set branch input as valid, as by default it is generated as invalid
        branch_input.dom.is_valid = true;

        //override 'global' branch input obj literal with newly created
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[index].branch[branch_index] = branch_input;

        //if it is a group, loop all the nesyed group inputs (there must be at least a group input)
        if (branch_input.type === consts.GROUP_TYPE) {

            formbuilder.is_editing_group = true;

            //pass in branch_index as this is a nested group
            var nested_group_inputs_html = self.getGroupInputsHTML(branch_input, index, branch_index);
            branch_input_collection_html = branch_input_collection_html.replace('{{group-content}}', nested_group_inputs_html.collection);
            branch_properties_panel_html += nested_group_inputs_html.panels;

            formbuilder.is_editing_group = false;
        }

        //per each branch input with possible answers keep track of pagination
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(branch_input.type) > -1) {
            //we have possible answers
            formbuilder.possible_answers_pagination[branch_input.ref] = {};
            formbuilder.possible_answers_pagination[branch_input.ref].page = 1;
        }

        //get properties panel for branch input
        properties_panel_html = template.getInputPropertiesPanelHTML(branch_input);
        branch_properties_panel_html += properties_panel_html;

    });

    branch_sortable_html = branch_sortable_html.replace('{{branch-inputs}}', branch_input_collection_html);

    return {
        collection: branch_sortable_html,
        panels: branch_properties_panel_html
    };
};

module.exports = getBranchInputsHTML;
