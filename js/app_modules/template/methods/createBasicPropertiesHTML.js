'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var createBasicPropertiesHTML = function (input) {

    var html;
    var partials = formbuilder.dom.partials;
    var question = input.question;
    var is_required_checked = (input.is_required) ? 'checked' : '';
    var is_title_checked = (input.is_title) ? 'checked' : '';
    var is_branch_edit_disabled = (input.question === '') ? 'disabled' : '';
    var is_group_edit_disabled = (input.question === '') ? 'disabled' : '';
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
    var branch_inputs = [];

    //when editing a branch, check the title limit against the inputs within a branch (even the group inputs)
    if (formbuilder.is_editing_branch) {
        branch_inputs = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref).branch;
    }

    //if the input is NOT media type, get basic properties
    if (consts.SINGLE_ANSWER_TYPES.indexOf(input.type) !== -1 || consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) !== -1) {

        //if input is a readme type, get readme property
        if (input.type === consts.README_TYPE) {
            html = partials.basic_readme_properties;
        }
        else {
            html = partials.basic_properties;

            html = html.replace('{{required-flag-checked}}', is_required_checked);
            html = html.replace('{{title-flag-checked}}', is_title_checked);

            //if 3 titles are already set, disable title checkbox and show proper message
            //if we are editing a branch, check branch inputs for titles

            if (formbuilder.is_editing_branch ? utils.isMaxTitleLimitReached(branch_inputs) : utils.isMaxTitleLimitReached(inputs)) {
                if (!input.is_title) {
                    html = html.replace('{{is-title-disabled}}', 'disabled');
                    html = html.replace(/{{is-checkbox-disabled}}/g, 'disabled-checkbox');
                    html = html.replace('{{checkbox-title-label}}', consts.MAX_TITLE_LIMIT_REACHED);
                }
                else {
                    html = html.replace('{{is-title-disabled}}', '');
                    html = html.replace(/{{is-checkbox-disabled}}/g, '');
                    html = html.replace('{{checkbox-title-label}}', consts.USE_ANSWER_AS_TITLE);
                }
            }
            else {
                html = html.replace('{{is-title-disabled}}', '');
                html = html.replace(/{{is-checkbox-disabled}}/g, '');
                html = html.replace('{{checkbox-title-label}}', consts.USE_ANSWER_AS_TITLE);
            }
        }
    }

    //if input is a media type, get media properties
    if (consts.MEDIA_ANSWER_TYPES.indexOf(input.type) !== -1) {
        html = partials.basic_media_properties;
    }

    //is a branch? check the edit button status
    if (input.type === consts.BRANCH_TYPE) {
        html = partials.basic_branch_properties;
        html = html.replace('{{branch-edit-disabled}}', is_branch_edit_disabled);
    }

    //is a group? check the edit button status
    if (input.type === consts.GROUP_TYPE) {
        html = partials.basic_group_properties;
        html = html.replace('{{group-edit-disabled}}', is_group_edit_disabled);
    }

    html = html.replace(/{{input-ref-question}}/g, input.ref + '-question');
    html = html.replace('{{basic-input-ref}}', 'basic-' + input.ref);
    html = html.replace('{{input-question-value}}', question);

    return html;
};

module.exports = createBasicPropertiesHTML;
