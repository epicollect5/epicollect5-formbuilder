'use strict';
var ui = require('helpers/ui');
var formbuilder = require('config/formbuilder');
var template = require('template');
var consts = require('config/consts');

var getGroupsInputsHTML = function (the_input, the_index, the_branch_index) {

    var input_factory = require('factory/input-factory');
    var input = the_input;
    var index = the_index;
    var branch_index = the_branch_index;
    var group_properties;
    var html;
    var group_sortable_html = ui.inputs_collection.getEmptyCollectionSortableHTML(consts.GROUP_TYPE);
    var group_input_collection_html = '';
    var properties_panel_html = '';
    var group_properties_panel_html = '';

    formbuilder.current_input_ref = input.ref;

    $.each(input.group, function (group_index, group_input) {

        //create html group element for input collection (middle column)
        html = input_factory.createInputToolHTML(group_input);
        group_input_collection_html += html;

        //copy input properties from stored group input
        group_properties = JSON.parse(JSON.stringify(group_input));

        //generate new group input with attached prototype
        group_input = input_factory.createInput(group_properties.type, group_properties.ref);

        //set group input properties to stored properties (only the one saved in the project definition, leave the others intact)
        for (var property in group_input) {
            if (group_properties.hasOwnProperty(property)) {
                group_input[property] = group_properties[property];
            }
        }

        //set group input as valid, as by default it is generated as invalid
        group_input.dom.is_valid = true;

        //override 'global' group input obj literal with newly created
        if (branch_index === null) {
            //this is a first level group
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[index].group[group_index] = group_input;
        }
        else {
            //this is a nested group
            formbuilder.project_definition.data.project
                .forms[formbuilder.current_form_index]
                .inputs[index]
                .branch[branch_index]
                .group[group_index] = group_input;
        }

        //per each group input with possible answers keep track of pagination
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(group_input.type) > -1) {
            //we have possible answers
            formbuilder.possible_answers_pagination[group_input.ref] = {};
            formbuilder.possible_answers_pagination[group_input.ref].page = 1;
        }

        properties_panel_html = template.getInputPropertiesPanelHTML(group_input);
        group_properties_panel_html += properties_panel_html;
    });

    group_sortable_html = group_sortable_html.replace('{{group-inputs}}', group_input_collection_html);

    return {
        collection: group_sortable_html,
        panels: group_properties_panel_html
    };
};

module.exports = getGroupsInputsHTML;
