'use strict';
var formbuilder = require('config/formbuilder');
var messages = require('config/messages');
var validation = require('actions/validation');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var consts = require('config/consts');
var input_properties_keyup_callback = require('ui-handlers/event-handler-callbacks/input-properties-keyup-callback');
var template = require('template');
var toast = require('config/toast');
var possibleAnswersSortable = require('ui-handlers/possible-answers-sortable');

var group_sortable = function () {

    var group_input;

    return {
        cursor: 'move',
        items: '.input',
        revert: 100,
        //axis: 'y',// it causes the placeholder to be always active
        containment: 'parent',
        tolerance: 'pointer',
        // forcePlaceholderSize: true,
        placeholder: 'input-collection-drop-placeholder',

        //triggered when a new input is dropped over the sortable
        receive: function (e, jquery_ui) {

            var form_index = formbuilder.current_form_index;
            var previous_group_input_ref = formbuilder.group.current_input_ref;
            var current_element;
            var group_inputs = utils.getInputObjectByRef(formbuilder.current_input_ref).group;
            var group_input_ref = utils.generateBranchGroupInputRef(formbuilder.current_input_ref);
            var group_input_index = group_inputs.length;
            var group_input_type = jquery_ui.item.attr('data-type');
            var input_factory = require('factory/input-factory');
            var owner_branch;

            //if we are editing a branch, it means this is a nested group, update references accordingly
            if (formbuilder.is_editing_branch) {
                console.log('we are editing a nested group');

                group_inputs = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref).group;
                group_input_ref = utils.generateBranchGroupInputRef(formbuilder.branch.current_input_ref);
                group_input_index = group_inputs.length;
            }

            //do not consider group/branch inputs within a group
            if (group_input_type === consts.BRANCH_TYPE || group_input_type === consts.GROUP_TYPE) {
                return false;
            }
            else {

                formbuilder.group.current_input_ref = group_input_ref;

                //validate previous input (if any) to show embedded errors (in case the user did not press validate button)
                //todo is this an overkill?
                if (previous_group_input_ref) {

                    if (formbuilder.is_editing_branch) {
                        //this is a nested group,get owner branch
                        owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);

                        validation.performValidation(utils.getNestedGroupInputObjectByRef(owner_branch, previous_group_input_ref), false);
                    }
                    else {
                        validation.performValidation(utils.getGroupInputObjectByRef(previous_group_input_ref), false);
                    }

                }

                console.log('group sortable receive');

                formbuilder.group.collection_is_being_sorted = false;

                //generate input object based on type and set index incrementally
                group_input = input_factory.createInput(group_input_type, group_input_ref);
                console.log(group_input);

                //disable current active element
                current_element = formbuilder.dom.inputs_collection_sortable.find('.active');
                current_element.removeClass('active');

                //add input to collection as the last one
                group_inputs.push(group_input);
            }

            //disable save project button as by default an input is invalid when it is created
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
        },
        stop: function (e, jquery_ui) {

            var undo = require('actions/undo');
            var form_index = formbuilder.current_form_index;
            var group_input_ref = formbuilder.group.current_input_ref;
            var owner_input_ref = formbuilder.current_input_ref;
            var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
            var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;
            var group_inputs = inputs[owner_input_index].group;
            var placeholder_text = messages.error.NO_QUESTION_TEXT_YET;
            var input_type = jquery_ui.item.attr('data-type');
            var properties_panel_html;

            //disable draggable if we hit the max amount of inputs allowed
            if (utils.getInputsTotal(inputs) >= consts.INPUTS_MAX_ALLOWED) {
                ui.input_tools.disable();
            }
            //reject group/branch inputs here
            if (input_type === consts.BRANCH_TYPE || input_type === consts.GROUP_TYPE) {
                jquery_ui.item.remove();
                //if group inputs length is zero, show help text placeholder
                //todo
            }
            else {
                //count search inputs
                if(input_type === consts.SEARCH_SINGLE_TYPE && !formbuilder.group.collection_is_being_sorted) {
                    //if the limit is reached, hide search from input tools
                    if (utils.getSearchInputsTotal() >= consts.LIMITS.search_inputs_max) {
                        ui.input_tools.hideSearchInput();
                        //show warning to user
                        toast.showWarning(messages.warning.SEARCH_INPUTS_LIMIT_REACHED + '(' + consts.LIMITS.search_inputs_max + ')')
                    }
                }

                //if we are editing a branch, it means this is a nested group
                if (formbuilder.is_editing_branch) {
                    console.log('we are editing a nested group');
                    owner_input_ref = formbuilder.branch.current_input_ref;
                    group_inputs = utils.getBranchInputObjectByRef(owner_input_ref).group;
                }

                jquery_ui.item.removeAttr('style'); // undo styling set by jqueryUI (http://goo.gl/EKz8tC)

                //get the index where the input was dropped (skip when list is empty)
                formbuilder.group.to_index = jquery_ui.item.index() === 0 ? jquery_ui.item.index() : jquery_ui.item.index() - 1;

                //hide message about no input selected, as dropped input gets focus
                formbuilder.dom.input_properties_no_input_selected.hide();


                /*
                 if the user is dragging a new input over, it was added as the last element of the array
                 otherwise the current input position is set in the start event
                 */
                if (!formbuilder.group.collection_is_being_sorted) {

                    //override 'from_index' as we are dropping a new element (min value for length is 1, as we add the input in the `receive` function)
                    formbuilder.group.from_index = group_inputs.length - 1;

                    //move inputs to keep the array sequence like the input sequence on screen
                    group_inputs.move(formbuilder.group.from_index, formbuilder.group.to_index);

                    jquery_ui.item.addClass('active');
                    jquery_ui.item.attr('data-input-ref', group_input_ref);

                    //append input id and a warning icon, as by default the question does not have any text
                    jquery_ui.item.find('.input-inner').append(ui.inputs_collection.getInputStateIconsHTML());
                    jquery_ui.item.find('span.question-preview').text(placeholder_text);

                    //show input properties for the new dropped input
                    formbuilder.dom.input_properties.find('.panel-body form').hide();
                    formbuilder.dom.input_properties.find('.panel-title span').text(placeholder_text);

                    //create properties panel in right sidebar for this input (common properties)
                    properties_panel_html = template.getInputPropertiesPanelHTML(group_input);

                    //append input and show it as it gets selected by default
                    formbuilder.dom.input_properties_forms_wrapper.hide();
                    $(properties_panel_html).removeClass('hidden').appendTo(formbuilder.dom.input_properties_forms_wrapper);

                    formbuilder.dom.input_properties_forms_wrapper.fadeIn(consts.ANIMATION_FAST);

                    //show action buttons for input
                    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);

                    if (!formbuilder.is_editing_branch) {

                        //formbuilder.dom.input_properties.off('keyup');

                        //this is NOT nested group
                        //triggered when users type in the header input field for branches or groups
                        if (group_input.type === consts.GROUP_TYPE) {
                            formbuilder.dom.input_properties.on('keyup', 'input', input_properties_keyup_callback);
                        }
                    }

                    //enable sortable on current input
                    possibleAnswersSortable(group_input);
                }
                else {
                    //'from_index is set in start event of sortable'
                    //move inputs to keep the array sequence like the input sequence on screen
                    group_inputs.move(formbuilder.group.from_index, formbuilder.group.to_index);

                    //run the validation on all group jumps, as we might have some invalid destinations after re-ordering
                    //I am forced to do this against all the branch inputs
                    validation.validateJumpsAfterSorting(group_inputs);

                    jquery_ui.item.addClass('active');
                }
            }

            //add this state for undoing, so it is easier to rebind everything
            formbuilder.render_action = consts.RENDER_ACTION_DO;
            undo.pushState();

            if (input_type === consts.README_TYPE) {
                $('.summernote').summernote(consts.SUMMERNOTE_OPTIONS);
            }
        },
        //this callback is triggered when the user start dragging an existing input from the sortable
        start: function (e, jquery_ui) {

            //get current input position, as we need to move from here
            formbuilder.group.collection_is_being_sorted = true;
            formbuilder.group.from_index = jquery_ui.item.index() === 0 ? 0 : jquery_ui.item.index() - 1;
            //de-activate all inputs in collection
            formbuilder.dom.inputs_collection_sortable.removeClass('active');

        },
        scroll: true,
        snap: false,
        over: function (e, jquery_ui) {

            var owner_input_ref = formbuilder.group.active_group_ref;
            var owner_input = utils.getInputObjectByRef(owner_input_ref);

            //if we are editing a nested group, grab the nested group
            if (formbuilder.is_editing_branch) {
                owner_input = utils.getBranchInputObjectByRef(owner_input_ref);
            }

            //hide help text if the list is empty and we are hovering with an input
            if (owner_input.group.length === 0) {
                //remove input from dom collection (middle column)
                formbuilder.dom.inputs_collection_sortable
                    .find('div.input[data-input-ref="' + owner_input_ref + '"]')
                    .find('.input-properties__no-group-questions-message')
                    .hide();
            }
        }
    };
};

module.exports = group_sortable();
