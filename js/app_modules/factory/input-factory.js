/* global $*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var AudioInput = require('inputs/audio');
var BarcodeInput = require('inputs/barcode');
var BranchInput = require('inputs/branch');
var CheckboxInput = require('inputs/checkbox');
var DateInput = require('inputs/date');
var DropdownInput = require('inputs/dropdown');
var LocationInput = require('inputs/location');
var NumericInput = require('inputs/integer');
var PhotoInput = require('inputs/photo');
var PhoneInput = require('inputs/phone');
var RadioInput = require('inputs/radio');
var TextInput = require('inputs/text');
var TextareaInput = require('inputs/textarea');
var ReadmeInput = require('inputs/readme');
var TimeInput = require('inputs/time');
var VideoInput = require('inputs/video');
var GroupInput = require('inputs/group');
var SearchInput = require('inputs/search');
var formbuilder = require('config/formbuilder');
var possible_answers = require('actions/possible-answers');
var jumps = require('actions/jumps');
var template = require('template');

/**
 * Define an interface for creating an object, but let subclasses decide which class to instantiate.
 * Factory Method lets a class defer instantiation to subclasses.
 */
var input_factory = {

    //set default input as type text
    type: TextInput,

    //create input based on type, set also index unique to each input
    createInput: function (the_type, the_input_ref) {

        var type = the_type;
        var input_ref = the_input_ref;

        switch (type) {
            case consts.AUDIO_TYPE:
                this.type = AudioInput;
                break;
            case consts.BARCODE_TYPE:
                this.type = BarcodeInput;
                break;
            case consts.BRANCH_TYPE:
                this.type = BranchInput;
                break;
            case consts.CHECKBOX_TYPE:
                this.type = CheckboxInput;
                break;
            case consts.DATE_TYPE:
                this.type = DateInput;
                break;
            case consts.DROPDOWN_TYPE:
                this.type = DropdownInput;
                break;
            case consts.GROUP_TYPE:
                this.type = GroupInput;
                break;
            case consts.LOCATION_TYPE:
                this.type = LocationInput;
                break;
            case consts.INTEGER_TYPE:
                this.type = NumericInput;
                break;
            case consts.DECIMAL_TYPE:
                this.type = NumericInput;
                break;
            case consts.PHONE_TYPE:
                this.type = PhoneInput;
                break;
            case consts.PHOTO_TYPE:
                this.type = PhotoInput;
                break;
            case consts.RADIO_TYPE:
                this.type = RadioInput;
                break;
            case consts.TEXT_TYPE:
                this.type = TextInput;
                break;
            case consts.TEXTAREA_TYPE:
                this.type = TextareaInput;
                break;
            case consts.README_TYPE:
                this.type = ReadmeInput;
                break;
            case consts.TIME_TYPE:
                this.type = TimeInput;
                break;
            case consts.VIDEO_TYPE:
                this.type = VideoInput;
                break;
            case consts.SEARCH_SINGLE_TYPE:
                this.type = SearchInput;
                break;
            case consts.SEARCH_MULTIPLE_TYPE:
                this.type = SearchInput;
                break;
        }

        return new this.type(input_ref);
    },

    //remove input from dom and memory
    removeInput: function (the_ref) {

        var undo = require('actions/undo');
        var input_ref = the_ref;
        var input_index = utils.getInputCurrentIndexByRef(input_ref);
        var input = utils.getInputObjectByRef(input_ref);

        //remove element from global array in memory
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs.splice(input_index, 1);

        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties.find('div.panel-body form[data-input-ref="' + input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable.find('div.input[data-input-ref="' + input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //after deletion no input is selected, show message and hide context buttons
        formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
        //show action button for input
        formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

        //remove track of this input
        formbuilder.current_input_ref = undefined;
        if (input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {
            if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max - 1)) {
                ui.input_tools.showSearchInput();
            }
        }
    },

    //remove branch input from dom and memory
    removeBranchInput: function (the_owner_input_ref, the_branch_input_ref) {

        var owner_input_ref = the_owner_input_ref;
        var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
        var branch_input_ref = the_branch_input_ref;
        var branch_input_index = utils.getBranchInputCurrentIndexByRef(owner_input_index, branch_input_ref);
        var form_index = formbuilder.current_form_index;
        var branch_inputs = formbuilder.project_definition.data.project.forms[form_index].inputs[owner_input_index].branch;

        //remove element from global object in memory (and store the removed element for later use)
        var branch_input = branch_inputs.splice(branch_input_index, 1)[0];

        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties.find('div.panel-body form[data-input-ref="' + branch_input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable.find('div.input[data-input-ref="' + branch_input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //after deletion no branch input is selected, so show message and hide context buttons
        formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
        //hide action button for input
        formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

        //if branch is empty, show message
        if (branch_inputs.length === 0) {
            formbuilder.dom.inputs_collection_sortable.find('.active-branch').find('.input-properties__no-branch-questions-message').show();

            //show invalid icon in active branch
            ui.inputs_collection.showInputInvalidIcon(formbuilder.branch.active_branch_ref);

            //set the form as invalid
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);
        }

        //remove track of this input
        formbuilder.branch.current_input_ref = undefined;

        if (branch_input.type === consts.SEARCH_SINGLE_TYPE || branch_input.type === consts.SEARCH_MULTIPLE_TYPE) {
            //update search inputs total
            if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max -1)) {
                ui.input_tools.showSearchInput();
            }
        }
    },

    //remove branch input from dom and memory
    removeGroupInput: function (the_owner_input_ref, the_group_input_ref) {

        var owner_input_ref = the_owner_input_ref;
        var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
        var group_input_ref = the_group_input_ref;
        var group_input_index = utils.getGroupInputCurrentIndexByRef(owner_input_index, group_input_ref);
        var form_index = formbuilder.current_form_index;
        var group_inputs = formbuilder.project_definition.data.project.forms[form_index].inputs[owner_input_index].group;

        //remove element from global object in memory (and store the removed element for later use)
        var group_input = group_inputs.splice(group_input_index, 1)[0];

        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties.find('div.panel-body form[data-input-ref="' + group_input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable.find('div.input[data-input-ref="' + group_input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //after deletion no group input is selected, so show message and hide context buttons
        formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
        //hide action button for input
        formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

        //if group is empty, show message
        if (group_inputs.length === 0) {
            formbuilder.dom.inputs_collection_sortable.find('.active-group').find('.input-properties__no-group-questions-message').show();

            //show invalid icon in active branch
            ui.inputs_collection.showInputInvalidIcon(formbuilder.group.active_group_ref);

            //set the form as invalid
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);
        }

        //remove track of this input
        formbuilder.group.current_input_ref = undefined;

        if (group_input.type === consts.SEARCH_SINGLE_TYPE || group_input.type === consts.SEARCH_MULTIPLE_TYPE) {
            if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max -1)) {
                ui.input_tools.showSearchInput();
            }
        }
    },

    removeNestedGroupInput: function (the_owner_input_branch_ref, the_nested_group_ref) {

        var nested_group_ref = the_nested_group_ref;
        var form_index = formbuilder.current_form_index;
        var owner_input_index = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);
        var owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
        var owner_branch_index = utils.getBranchInputCurrentIndexByRef(owner_input_index, formbuilder.branch.current_input_ref);
        var nested_group_index = utils.getNestedGroupInputCurrentIndexByRef(owner_branch, nested_group_ref);
        var nested_group_inputs = formbuilder.project_definition.data.project
            .forms[form_index]
            .inputs[owner_input_index]
            .branch[owner_branch_index]
            .group;

        //remove element from global object in memory (and store the removed element for later use)
        var nested_group_input = nested_group_inputs.splice(nested_group_index, 1)[0];

        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties.find('div.panel-body form[data-input-ref="' + nested_group_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable.find('div.input[data-input-ref="' + nested_group_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //after deletion no group input is selected, so show message and hide context buttons
        formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
        //hide action button for input
        formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

        //if group is empty, show message
        if (nested_group_inputs.length === 0) {
            formbuilder.dom.inputs_collection_sortable.find('.active-group').find('.input-properties__no-group-questions-message').show();

            //show invalid icon in active branch
            ui.inputs_collection.showInputInvalidIcon(formbuilder.group.active_group_ref);

            //set the form as invalid
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);
        }

        //remove track of this input
        formbuilder.group.current_input_ref = undefined;

        if (nested_group_input.type === consts.SEARCH_SINGLE_TYPE || nested_group_input.type === consts.SEARCH_MULTIPLE_TYPE) {
            if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max -1)) {
                ui.input_tools.showSearchInput();
            }
        }
    },

    //todo this is a bit of code duplication, to be refactored
    showGroupInputPropertiesDom: function (the_group_input_index) {

        var form_index = formbuilder.current_form_index;
        var owner_input_ref = formbuilder.current_input_ref;
        var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
        var group_input_index = the_group_input_index;
        var group_input = formbuilder.project_definition.data.project.forms[form_index].inputs[owner_input_index].group[group_input_index];
        var input_properties_forms_wrapper = formbuilder.dom.input_properties_forms_wrapper;
        var view = formbuilder.dom.input_properties_views[group_input.type];

        input_properties_forms_wrapper.append(view).hide().fadeIn(consts.ANIMATION_FAST);

        //init properties panel
        //todo
        //helpers.initInputPropertiesPanel(input_properties_forms_wrapper, group_input, formbuilder.dom.partials);
    },

    //todo this is a bit of code duplication, to be refactored
    showNestedGroupInputPropertiesDom: function (the_nested_group_input_index) {


        console.log(formbuilder.project_definition.data.project.forms);

        var form_index = formbuilder.current_form_index;
        var branch_index = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);
        var group_index = utils.getBranchInputCurrentIndexByRef(branch_index, formbuilder.group.active_group_ref);
        var nested_group_index = the_nested_group_input_index;
        var nested_group_input = formbuilder.project_definition.data.project
            .forms[form_index]
            .inputs[branch_index]
            .branch[group_index]
            .group[nested_group_index];

        var input_properties_forms_wrapper = formbuilder.dom.input_properties_forms_wrapper;
        var view = formbuilder.dom.input_properties_views[nested_group_input.type];

        input_properties_forms_wrapper.append(view).hide().fadeIn(consts.ANIMATION_FAST);

    },

    createInputToolHTML: function (input) {
        return template.createInputToolHTML(input);
    },

    createPropertiesHTML: function (input) {
        return template.createPropertiesHTML(input);
    },
    getAdvancedTabBtnHTML: function (ref, is_active) {
        return template.getAdvancedTabBtnHTML(ref, is_active);
    },
    getJumpTabBtnHTML: function (ref, is_active) {
        return template.getJumpTabBtnHTML(ref, is_active);
    }
};

module.exports = input_factory;
