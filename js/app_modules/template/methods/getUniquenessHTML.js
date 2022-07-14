'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');

var getUniquenessHTML = function (the_input) {

    var html = '';
    var input = the_input;
    var form_index = formbuilder.current_form_index;
    var current_form_name = formbuilder.project_definition.data.project.forms[form_index].name;
    var partials = formbuilder.dom.partials;
    var parent_form_name;
    var is_uniqueness_form_checked;
    var is_uniqueness_hierarchy_checked;

    function getStandardUniquessMarkup(markup) {

        markup = partials.uniqueness_hierarchy_checkboxes;
        parent_form_name = formbuilder.project_definition.data.project.forms[form_index - 1].name;
        markup = markup.replace(/{{parent-form-name}}/g, parent_form_name);
        markup = markup.replace('{{input-ref-uniqueness-hierarchy}}', input.ref + '-uniqueness-hierarchy');

        is_uniqueness_hierarchy_checked = (input.uniqueness === consts.UNIQUESS_HIERARCHY) ? 'checked' : '';
        markup = markup.replace('{{input-ref-uniqueness-hierarchy-checked}}', is_uniqueness_hierarchy_checked);

        return markup;
    }

    function getBranchUniquenessMarkup(markup) {
        //branch uniquess is within for all the '{branch header}' entries for a branch question within a single entry ('form')
        markup = partials.uniqueness_branch_checkbox;
        markup = markup.replace('{{branch-header}}', formbuilder.branch.active_branch_header);

        return markup;
    }

    //add uniqueness constraint based on form hierarchy
    if (form_index > 0) {
        //child forms, user cn select form or hierarchy uniqueness
        if (formbuilder.is_editing_branch) {
            //if (formbuilder.is_editing_group) {
            //    //nested group gets standard uniqueness
            //    html = getStandardUniquessMarkup(html);
            //}
            //  else {
            //branches get its own uniqueness
            html = getBranchUniquenessMarkup(html);
            //  }
        }
        else {
            //standard uniqueness
            html = getStandardUniquessMarkup(html);
        }
    }

    else {
        //standard uniqueness, top parent form inputscan be set to form uniqueness only
        if (!formbuilder.is_editing_branch) {
            html = partials.uniqueness_form_checkbox;
        }
        else {
            //branches get its own uniqueness
            //if (formbuilder.is_editing_group) {
            //    //group gets standard uniqueness
            //    html = partials.uniqueness_form_checkbox;
            //}
            //else {
            //branch uniquess is within for all the branches within a single entry ('form')
            html = getBranchUniquenessMarkup(html);
            // }
        }
    }

    //common markup
    html = html.replace('{{input-ref-uniqueness-form}}', input.ref + '-uniqueness-form');
    is_uniqueness_form_checked = (input.uniqueness === consts.UNIQUESS_FORM) ? 'checked' : '';
    html = html.replace('{{input-ref-uniqueness-form-checked}}', is_uniqueness_form_checked);
    html = html.replace(/{{form-name}}/g, current_form_name);

    return html;
};

module.exports = getUniquenessHTML;
