/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var messages = require('config/messages');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var group_sortable = require('ui-handlers/group-sortable');
var input_collection_branch_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-branch-sortable-mousedown-callback');
var input_collection_group_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-group-sortable-mousedown-callback');
var input_collection_nested_group_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-nested-group-sortable-mousedown-callback');
var input_collection_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback');

var GroupInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.GROUP_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
GroupInput.prototype = Object.create(Input.prototype);

GroupInput.prototype.isHeaderTextValid = function () {
    return this.isQuestionTextValid();
};

//toggle edit branch button
GroupInput.prototype.toggleEditButton = function (the_state) {
    ui.group.toggleEditGroupButton(this.ref, the_state);
};

GroupInput.prototype.enterGroupSortable = function (is_nested) {

    var self = this;
    var undo = require('actions/undo');
    var active_group = formbuilder.dom.inputs_collection_sortable
        .find('div.input[data-input-ref="' + self.ref + '"]');
    var active_group_inner = active_group.find(' > .input-inner');
    var group_holder_html = ui.inputs_collection.getEmptyCollectionSortableHTML(consts.GROUP_TYPE);
    var exit_btn_html = '';
    var exit_button_class = is_nested ? 'exit-nested-group-editing' : 'exit-group-editing';
    exit_btn_html += '<button class="btn btn-sm btn-default ' + exit_button_class + '">';
    exit_btn_html += '<i class="fa fa-2x fa-fw fa-chevron-left "></i>';
    exit_btn_html += messages.labels.EXIT_EDITING;
    exit_btn_html += '</button>';


    //disable jumps tab when editing a group
    $('.jump-tab').addClass('disabled disabled-tab');

    //reset group object, as we cache properties of the current enabled group only
    formbuilder.group = {};

    //set draggable to work with enabled group only
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.group-sortable');

    //set useful flags
    formbuilder.is_editing_group = true;
    formbuilder.group.active_group_ref = self.ref;

    if (is_nested) {
        active_group.off().on('mousedown', 'div.input', input_collection_nested_group_sortable_mousedown_callback);
    } else {
        active_group.off().on('mousedown', 'div.input', input_collection_group_sortable_mousedown_callback);
    }

    //if it is a brand new group, append sortable markup
    if (active_group.find('.group-sortable').length === 0) {
        group_holder_html = group_holder_html.replace('{{group-inputs}}', '');
        active_group.append(group_holder_html);
        active_group.find('.input-properties__no-group-questions-message').show();
    }
    else {
        if (formbuilder.render_action === consts.RENDER_ACTION_UNDO && active_group.find('.group-sortable > div').length === 0) {
            active_group.find('.input-properties__no-group-questions-message').show();
        }
    }

    //enable group sortable
    active_group.find('.group-sortable').sortable(group_sortable).disableSelection().removeClass('hidden');

    //remove any previously selected group input
    active_group.find('.group-sortable').find('.input.active').removeClass('active');

    //show exit editing button
    active_group.addClass('active-group').removeClass('active');

    //remove first two elements
    active_group_inner.find('.fa-align-justify').remove();
    active_group_inner.find('> .question-preview').remove();

    //append exit button
    active_group_inner.prepend(exit_btn_html);

    //disable form tab buttons
    ui.forms_tabs.toggleFormTabsButtons({
        enable: false
    });

    //prepare ui for editing group
    if (is_nested) {
        self.showEditNestedGroupUI();
    } else {
        self.showEditGroupUI();
    }

    active_group
        .find('.' + exit_button_class)
        .one('click', function () {
            if (is_nested) {
                self.exitNestedGroupSortable();
            } else {
                self.exitGroupSortable();
            }
        });

    /*
     change binding when editing a group, as we want to incercept only a mousedown to the exit button on the active group input
     */
    //destroy top parent sortable
    console.log('group.js calls destroy');

    /******** NEEDED BUG *********/
    /* The call to 'destroy' will trigger an error the first time, but if it does not (catching the error or using the commented 'if else' statement)
     *  when exiting the group the parent sortable will not work anymore, whether is a top level sortable or a branch sortable.
     *  todo look into it
     *
     * */
    if (formbuilder.render_action === consts.RENDER_ACTION_DO) {
        formbuilder.dom.inputs_collection_sortable.sortable('destroy');
    }
    /******** END NEEDED BUG *********/

    // formbuilder.dom.inputs_collection_sortable.find('.active-branch.hidden-active-branch .branch-sortable').sortable('destroy');
    if (is_nested) {
        //disable mousedown
        formbuilder.dom.inputs_collection_sortable
            .find('.active-branch.hidden-active-branch .branch-sortable')
            .off('mousedown')
            .on('mousedown', '.fa-chevron-left', input_collection_branch_sortable_mousedown_callback);
    } else {
        formbuilder.dom.inputs_collection_sortable.on('mousedown', '.fa-chevron-left', input_collection_sortable_mousedown_callback);
    }

    undo.pushState();
};

GroupInput.prototype.exitNestedGroupSortable = function () {

    //exit nested group sortable
    console.log('exiting nested group, goes up to branch');

    var self = this;
    var branch_sortable = require('ui-handlers/branch-sortable');
    var active_branch = formbuilder.dom.inputs_collection_sortable.find('.active-branch');
    var current_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
    var current_branch_name = current_branch.question;
    var active_group = formbuilder.dom.inputs_collection_sortable.find('.input.active-group');
    var active_group_input_sortable = active_group.find('.group-sortable');
    var active_group_inner = active_group.find(' > .input-inner');
    var active_nested_group_input;

    if (formbuilder.group.current_input_ref) {
        active_nested_group_input = utils.getNestedGroupInputObjectByRef(current_branch, formbuilder.group.current_input_ref);
        //validate last active group input and update dom accordingly (if an input was selected)
        validation.performValidation(active_nested_group_input, false, formbuilder.project_definition);
    }

    //enable owner branch sortable
    active_branch.find('.branch-sortable').sortable(branch_sortable).disableSelection();

    active_group.removeClass('active-group').addClass('active');

    //remove exit button
    active_group_inner.find('.exit-nested-group-editing').remove();

    //restore question in input collection
    active_group_inner.prepend('<span class="question-preview">' + self.question + '</span>');
    active_group_inner.prepend('<i class="fa fa-2x fa-fw fa-align-justify"></i>');

    //show owner branch
    active_branch
        .removeClass('hidden-active-branch')
        .find(' > .input-inner > i')
        .fadeIn(consts.ANIMATION_FAST);

    active_branch.find(' > .input-inner > .exit-branch-editing').fadeIn(consts.ANIMATION_FAST);

    //show inactive branch inputs
    formbuilder.dom.inputs_collection_sortable
        .find('.active-branch')
        .find('.branch-sortable')
        .find(' > .input')
        .not('.active-group')
        .slideDown(consts.ANIMATION_NORMAL);

    //update middle colum panel header showing owner branch question
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_BRANCH);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(current_branch_name.trunc(consts.INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT));

    self.toggleEditButton(true);

    //set draggable to work with the active branch sortable
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.branch-sortable');

    //hide nested group sortable
    active_group_input_sortable.addClass('hidden');

    /*
     restore parent binding after exiting group editing
     */
    formbuilder.dom.inputs_collection_sortable
        .find('.active-branch')
        .off()
        .on('mousedown', 'div.input', input_collection_branch_sortable_mousedown_callback);

    formbuilder.dom.inputs_collection_sortable.find('.active-branch > .branch-sortable').sortable(branch_sortable);

    //if both header and groups are valid, show green check on active group input
    if (self.dom.is_valid) {
        //replace warning icon with green check
        ui.inputs_collection.showInputValidIcon(self.ref);
    } else {
        //replace warning icon with green check
        ui.inputs_collection.showInputInvalidIcon(self.ref);
    }

    //show a preview of the nested group header (limit to 20 chars)
    formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(self.question.trunc(20));

    //hide no inputs selected (just in case no input was selected in the nested group)
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').hide();

    //hide any input previously selected
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.group.current_input_ref + '"]').hide();

    //show nested group input properties panel
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.group.active_group_ref + '"]').fadeIn(consts.ANIMATION_FAST);

    //enable group input tools in left sidebar
    formbuilder.dom.inputs_tools_draggable.filter('.input-group').show();

    formbuilder.is_editing_group = false;
    formbuilder.group.current_input_ref = undefined;

    //enable jumps tab when exit editing a group
    $('.jump-tab').removeClass('disabled disabled-tab');

    //show action buttons for owner input
    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);
};

GroupInput.prototype.exitGroupSortable = function () {

    var self = this;
    var active_group_input;
    var sortable = require('ui-handlers/sortable');
    var current_form_name = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].name;
    var active_group = formbuilder.dom.inputs_collection_sortable.find('.input.active-group');
    var active_group_input_sortable = active_group.find('.group-sortable');
    var active_group_inner = active_group.find(' > .input-inner');

    if (formbuilder.group.current_input_ref) {
        active_group_input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        //validate last active group input and update dom accordingly
        validation.performValidation(active_group_input, false, formbuilder.project_definition);
    }

    active_group.removeClass('active-group').addClass('active');

    //remove exit button
    active_group_inner.find('.exit-group-editing').remove();

    //restore question in input collection
    active_group_inner.prepend('<span class="question-preview">' + self.question + '</span>');
    active_group_inner.prepend('<i class="fa fa-2x fa-fw fa-align-justify"></i>');

    formbuilder.dom.inputs_collection_sortable.find('.input').not('.active').slideDown(consts.ANIMATION_NORMAL);

    //update panel header
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_FORM);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(current_form_name.trunc(consts.INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT));

    //show form action buttons in panel heading
    ui.inputs_collection.toggleFormActionButtons(true);

    //enable jumps tab
    ui.input_properties_panel.toggleJumpTab(self.ref, true);

    self.toggleEditButton(true);

    //set draggable to work with main sortable
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.sortable');

    active_group_input_sortable.addClass('hidden');

    /*
     restore parent binding and sortable after exiting group editing
     */
    formbuilder.dom.inputs_collection_sortable.off('mousedown').on('mousedown', 'div.input', input_collection_sortable_mousedown_callback);
    sortable();

    //if both header and groups are valid, show green check on active group input
    if (self.dom.is_valid) {
        //update the just saved input showing a preview of the question text (limit to 50 chars)
        ui.inputs_collection.showInputQuestionPreview(self.ref, self.question.trunc(50));
        //replace warning icon with green check
        ui.inputs_collection.showInputValidIcon(self.ref);
    } else {
        //replace warning icon with green check
        ui.inputs_collection.showInputInvalidIcon(self.ref);
    }

    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').hide();

    //hide any input previously selected
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.group.current_input_ref + '"]').hide();

    //show branch input properties panel
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.group.active_group_ref + '"]').fadeIn(consts.ANIMATION_FAST);

    //enable branch & group input tools in left sidebar
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch, .input-group').show();

    formbuilder.is_editing_group = false;
    formbuilder.group.current_input_ref = undefined;

    //enable jumps tab when exit editing a group
    $('.jump-tab').removeClass('disabled disabled-tab');

    //show title flag
    $('.input-properties__form__title-flag').removeClass('hidden');

    //enable form tabs buttons
    ui.forms_tabs.toggleFormTabsButtons({
        enable: true
    });

    //show action buttons for owner input
    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);
};

GroupInput.prototype.showEditGroupUI = function () {

    var self = this;

    //hide first level inputs from the input collection
    formbuilder.dom.inputs_collection_sortable.find(' > .input').not('.active-group').slideUp(consts.ANIMATION_NORMAL);

    //update panel header
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_GROUP);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(self.question.trunc(consts.INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT));

    //disable form action buttons in panel heading
    ui.inputs_collection.toggleFormActionButtons(false);

    //disable jumps tab //todo is this needed?
    ui.input_properties_panel.toggleJumpTab(self.ref, false);

    //hide owner group input panel and show 'no group inputs selected' by default
    formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + self.ref + '"]').hide();

    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').show();

    //hide input properties panel action buttons until a group input gets selected
    formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

    ////hide branch & group input tools in left sidebar, as we cannot have a branch or a group withing a group
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch, .input-group').hide();

};

GroupInput.prototype.showEditNestedGroupUI = function () {

    var self = this;
    var active_branch = formbuilder.dom.inputs_collection_sortable.find('.active-branch');

    //render UI for a nested group, as we cannot just hide the main parent since it is a branch sortable
    //hide inactive branch inputs from the input collection
    active_branch
        .find('.branch-sortable')
        .find(' > .input')
        .not('.active-group')
        .slideUp(consts.ANIMATION_NORMAL);

    //hide owner branch ant its inactive inputs (without using display:none as that will hide the nested group as well :/)
    active_branch
        .addClass('hidden-active-branch')
        .find(' > .input-inner > i')
        .hide();

    active_branch.find('.exit-branch-editing').hide();

    //remove all events from active branch as we are only interested in the mousedown event of the group sortable
    active_branch.off();

    //update panel header, as it a nested group show full breadcrumbs
    formbuilder.dom.inputs_collection
        .find('.inputs-collection__header__edit-state')
        .text(messages.labels.EDITING_BRANCH + messages.labels.EDITING_NESTED_GROUP);

    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(self.question.trunc(consts.INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT));

    //hide owner group input panel and show 'no group inputs selected' by default
    formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + self.ref + '"]').hide();
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').show();

    //hide input properties panel action buttons until a group input gets selected
    formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

    ////disable branch & group input tools in left sidebar, as we cannot have a branch or a group withing a group
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch, .input-group').hide();
};

GroupInput.prototype.validateGroupInputs = function () {

    var self = this;
    var group_inputs_validation = validation.validateGroupInputs(self);
    if (!group_inputs_validation.is_valid) {
        //highlight wrong input and show error message
        errors.showGroupInputsErrors(self.dom.properties_panel, group_inputs_validation.error.message);
        //set element as invalid
        self.dom.is_valid = false;
    } else {
        //set element as valid
        self.dom.is_valid = true;
        errors.hideGroupInputsErrors(self.dom.properties_panel);
    }
};

module.exports = GroupInput;
