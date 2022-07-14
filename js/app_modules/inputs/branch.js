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
var branch_sortable = require('ui-handlers/branch-sortable');
var input_collection_branch_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-branch-sortable-mousedown-callback');
var input_collection_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback');

var BranchInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.BRANCH_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
BranchInput.prototype = Object.create(Input.prototype);

BranchInput.prototype.isHeaderTextValid = function () {
    return this.isQuestionTextValid();
};


//toggle edit branch button
BranchInput.prototype.toggleEditButton = function (the_state) {
    ui.branch.toggleEditBranchButton(this.ref, the_state);
};

BranchInput.prototype.enterBranchSortable = function () {

    var self = this;
    var undo = require('actions/undo');
    var active_branch = formbuilder.dom.inputs_collection_sortable
        .find('div.input[data-input-ref="' + self.ref + '"]');
    var active_branch_inner = active_branch.find(' > .input-inner');
    var branch_holder_html = ui.inputs_collection.getEmptyCollectionSortableHTML(consts.BRANCH_TYPE);
    var branch_inputs = utils.getInputObjectByRef(self.ref).branch;
    var exit_btn_html = '';
    exit_btn_html += '<button class="btn btn-sm btn-default exit-branch-editing">';
    exit_btn_html += '<i class="fa fa-2x fa-fw fa-chevron-left "></i>';
    exit_btn_html += messages.labels.EXIT_EDITING;
    exit_btn_html += '</button>';

    //reset branch object, as we cache properties of the current enabled branch only
    formbuilder.branch = {};

    //set draggable to work with enabled branch only
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.branch-sortable');

    //set useful flags
    formbuilder.is_editing_branch = true;
    formbuilder.branch.active_branch_ref = self.ref;
    formbuilder.branch.active_branch_header = self.question;

    active_branch.off().on('mousedown', 'div.input', input_collection_branch_sortable_mousedown_callback);

    // if it is a brand new branch, append sortable markup and show help message
    if (active_branch.find('.branch-sortable').length === 0) {
        branch_holder_html = branch_holder_html.replace('{{branch-inputs}}', '');
        active_branch.append(branch_holder_html);
        active_branch.find('.input-properties__no-branch-questions-message').show();
    }
    else {
        if (formbuilder.render_action === consts.RENDER_ACTION_UNDO && active_branch.find('.branch-sortable > div').length === 0) {
            active_branch.find('.input-properties__no-group-questions-message').show();
        }
    }

    //enable branch sortable
    active_branch.find('.branch-sortable').sortable(branch_sortable).disableSelection().removeClass('hidden');

    //remove any previously selected branch input
    active_branch.find('.branch-sortable').find('.input.active').removeClass('active');

    //show exit editing button
    active_branch.addClass('active-branch').removeClass('active');

    //remove first two elements
    active_branch_inner.find('.fa-clone').remove();
    active_branch_inner.find('> .question-preview').remove();

    //append exit button
    active_branch_inner.prepend(exit_btn_html);

    //disable form tab buttons
    ui.forms_tabs.toggleFormTabsButtons({enable: false});

    //prepare ui for editing branch
    self.showEditBranchUI();

    active_branch
        .find('.exit-branch-editing')
        .one('click', function () {
            self.exitBranchSortable();
        });

    /*
     change binding when editing a branch, as we want to incercept only a mousedown to the exit button on the active branch input
     */
    //destroy sortable only if it is set already (see http://goo.gl/riN4Yk)
    if (formbuilder.dom.inputs_collection_sortable.data('ui-sortable')) {
        formbuilder.dom.inputs_collection_sortable.sortable('destroy');//Remove the plugin functionality
    }

    formbuilder.dom.inputs_collection_sortable.off('mousedown').on('mousedown', '.fa-chevron-left', input_collection_sortable_mousedown_callback);

    //hide form title warning regardless (passing 1)=> this is for the form which owns the branch
    ui.inputs_collection.toggleTitleWarning(1, false);

    //show/hide warning for the branch
    ui.inputs_collection.toggleTitleWarning(utils.getTitleCount(branch_inputs), true);

    //push state to enable undoing the action (adding/dragging input)
    undo.pushState();
};

BranchInput.prototype.exitBranchSortable = function () {

    var self = this;
    var sortable = require('ui-handlers/sortable');
    var current_form_name = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].name;
    var active_branch = formbuilder.dom.inputs_collection_sortable.find('.input.active-branch');
    var active_branch_input_sortable = active_branch.find('.branch-sortable');
    var active_branch_inner = active_branch.find(' > .input-inner');
    var active_branch_input;
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;

    if (formbuilder.branch.current_input_ref) {
        active_branch_input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
        //validate last active group input and update dom accordingly
        validation.performValidation(active_branch_input, false);
    }

    active_branch.removeClass('active-branch').addClass('active');


    //remove exit button
    active_branch_inner.find('.exit-branch-editing').remove();

    //restore question in input collection
    active_branch_inner.prepend('<span class="question-preview">' + self.question + '</span>');
    active_branch_inner.prepend('<i class="fa fa-2x fa-fw fa-clone"></i>');

    formbuilder.dom.inputs_collection_sortable.find('.input').not('.active').slideDown(consts.ANIMATION_NORMAL);

    //update panel header
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_FORM);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(current_form_name.trunc(consts.INPUTS_COLLECTION_BRANCH_NAME_MAX_DISPLAY_LENGHT));

    //show form action buttons in panel heading
    ui.inputs_collection.toggleFormActionButtons(true);

    //enable jumps tab
    ui.input_properties_panel.toggleJumpTab(self.ref, true);

    self.toggleEditButton(true);

    //set draggable to work with main sortable
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.sortable');

    active_branch_input_sortable.addClass('hidden');

    /*
     restore parent binding after exiting branch editing
     */
    formbuilder.dom.inputs_collection_sortable.off('mousedown').on('mousedown', 'div.input', input_collection_sortable_mousedown_callback);


    //re-bind sortable plugin
    sortable();

    self.validateBranchInputs();

    //todo: hide current input and show branch
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').hide();

    //hide previously selected branch input properties panel
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.branch.current_input_ref + '"]').hide();

    //show branch input properties panel
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.branch.active_branch_ref + '"]').fadeIn(consts.ANIMATION_FAST);

    //enable branch input tools in left sidebar, as we cannot have a branch withing a branch
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch').show();

    formbuilder.is_editing_branch = false;
    formbuilder.branch.current_input_ref = undefined;

    //enable form tab buttons
    ui.forms_tabs.toggleFormTabsButtons({enable: true});

    //show action buttons for owner input
    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);

    //show title warning if no title set
    //todo is this needed?
    ui.inputs_collection.toggleTitleWarning(utils.getTitleCount(inputs), false);
};


BranchInput.prototype.showEditBranchUI = function () {

    var self = this;

    //hide first level inputs from the input collection
    formbuilder.dom.inputs_collection_sortable.find(' > .input').not('.active-branch').slideUp(consts.ANIMATION_NORMAL);

    //update panel header
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_BRANCH);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(self.question.trunc(consts.INPUTS_COLLECTION_BRANCH_NAME_MAX_DISPLAY_LENGHT));

    //disable form action buttons in panel heading
    ui.inputs_collection.toggleFormActionButtons(false);

    //disable jumps tab //todo is this needed?
    ui.input_properties_panel.toggleJumpTab(self.ref, false);

    //hide owner branch input panel and show 'no branch inputs selected' by default
    formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + self.ref + '"]').hide();

    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').show();

    //hide input properties panel action buttons until a branch input gets selected
    formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);


    //disable branch input tools in left sidebar, as we cannot have a branch withing a branch
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch').hide();

};

BranchInput.prototype.validateBranchInputs = function () {

    var self = this;
    var branch_inputs_validation = validation.validateBranchInputs(self);

    self.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + self.ref + '"]');

    if (!branch_inputs_validation.is_valid) {
        //highlight wrong input and show error message
        errors.showBranchInputsErrors(self.dom.properties_panel, branch_inputs_validation.error.message);
        //set element as invalid
        self.dom.is_valid = false;
    }
    else {
        //set element as valid
        self.dom.is_valid = true;
        errors.hideBranchInputsErrors(self.dom.properties_panel);
    }
};

module.exports = BranchInput;
