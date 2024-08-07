'use strict';
var formbuilder = require('config/formbuilder');
var messages = require('config/messages');
var validation = require('actions/validation');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var consts = require('config/consts');
var template = require('template');
var toast = require('config/toast');
var possibleAnswersSortable = require('ui-handlers/possible-answers-sortable');

var branch_sortable = function () {

    var branch_input;

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
            var previous_branch_input_ref = formbuilder.branch.current_input_ref;
            var current_element;
            var branch_inputs = utils.getInputObjectByRef(formbuilder.current_input_ref).branch;
            var branch_input_ref = utils.generateBranchGroupInputRef(formbuilder.current_input_ref);
            var branch_input_index = branch_inputs.length;
            var branch_input_type = jquery_ui.item.attr('data-type');
            var input_factory = require('factory/input-factory');

            //do not consider branch inputs within a branch
            if (branch_input_type === consts.BRANCH_TYPE) {
                return false;
            }
            else {

                formbuilder.branch.current_input_ref = branch_input_ref;

                //validate previous input (if any) to show embedded errors (in case the ser did not press validate button)
                //todo is this an overkill?
                if (previous_branch_input_ref) {
                    validation.performValidation(utils.getBranchInputObjectByRef(previous_branch_input_ref), false);
                }

                //  console.log('branch sortable receive');

                formbuilder.branch.collection_is_being_sorted = false;

                //generate input object based on type and set index incrementally
                branch_input = input_factory.createInput(branch_input_type, branch_input_ref);
                //formbuilder.current_input_ref = input.ref;
                //   console.log(branch_input);

                //disable current active element
                current_element = formbuilder.dom.inputs_collection_sortable.find('.active');
                current_element.removeClass('active');

                //add input to collection as the last one
                branch_inputs.push(branch_input);
                //console.log(branch_inputs);
                //console.log(formbuilder.project_definition.data.project.forms[form_index].inputs);
            }

            //disable save project button as by default an input is invalid when it is created
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);

            //set form tab as invalid, as the new input will be invalid by default
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);
        },
        stop: function (e, jquery_ui) {

            var undo = require('actions/undo');
            var form_index = formbuilder.current_form_index;
            var branch_input_ref = formbuilder.branch.current_input_ref;
            var owner_input_ref = formbuilder.current_input_ref;
            var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
            var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;
            var branch_inputs = inputs[owner_input_index].branch;
            var placeholder_text = messages.error.NO_QUESTION_TEXT_YET;
            var input_type = jquery_ui.item.attr('data-type');
            var active_branch;
            var properties_panel_html;

            //disable draggable if we hit the max amount of inputs allowed
            if (utils.getInputsTotal(inputs) >= consts.INPUTS_MAX_ALLOWED) {
                ui.input_tools.disable();
            }

            //reject branch inputs here
            if (input_type === consts.BRANCH_TYPE) {
                jquery_ui.item.remove();

                //if branch inputs length is zero, show help text placeholder
                //todo
            }
            else {

                //count search inputs
                if (input_type === consts.SEARCH_SINGLE_TYPE && !formbuilder.branch.collection_is_being_sorted) {
                    //if the limit is reached, hide search from input tools
                    if (utils.getSearchInputsTotal() >= consts.LIMITS.search_inputs_max) {
                        ui.input_tools.hideSearchInput();
                        console.log('search limit reached');

                        //show warning to user
                        toast.showWarning(messages.warning.SEARCH_INPUTS_LIMIT_REACHED + '(' + consts.LIMITS.search_inputs_max + ')');
                    }
                }

                //    console.log('sortable stop');
                jquery_ui.item.removeAttr('style'); // undo styling set by jqueryUI (http://goo.gl/EKz8tC)

                //get the index where the input was dropped (skip when list is empty)
                //nb the -2 is to remove the element which are no input (warning messages)
                formbuilder.branch.to_index = jquery_ui.item.index() === 0 ? jquery_ui.item.index() : jquery_ui.item.index() - 2;

                //hide message about no input selected, as dropped input gets focus
                formbuilder.dom.input_properties_no_input_selected.hide();

                /*
                 if the user is dragging a new input over, it was added as the last element of the array
                 otherwise the current input position is set in the start event
                 */
                if (!formbuilder.branch.collection_is_being_sorted) {

                    //override 'from_index' as we are dropping a new element (min value for length is 1, as we add the input in the `receive` function)
                    formbuilder.branch.from_index = branch_inputs.length - 1;

                    //move inputs to keep the array sequence like the input sequence on screen
                    branch_inputs.move(formbuilder.branch.from_index, formbuilder.branch.to_index);
                    //console.log(branch_inputs);
                    //console.log(branch_inputs.length);

                    jquery_ui.item.addClass('active');
                    jquery_ui.item.attr('data-input-ref', branch_input_ref);

                    //append input id and a warning icon, as by default the question does not have any text
                    jquery_ui.item.find('.input-inner').append(ui.inputs_collection.getInputStateIconsHTML());
                    jquery_ui.item.find('span.question-preview').text(placeholder_text);

                    //set owner branch as invalid as we are adding an invalid input
                    active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
                    ui.inputs_collection.showInputInvalidIcon(active_branch.ref);

                    //show input properties for the new dropped input
                    formbuilder.dom.input_properties.find('.panel-body form').hide();
                    formbuilder.dom.input_properties.find('.panel-title span').text(placeholder_text);

                    //create properties panel in right sidebar for this input (common properties)
                    properties_panel_html = template.getInputPropertiesPanelHTML(branch_input);

                    //append input and show it as it gets selected by default
                    formbuilder.dom.input_properties_forms_wrapper.hide();
                    $(properties_panel_html).removeClass('hidden').appendTo(formbuilder.dom.input_properties_forms_wrapper);
                    formbuilder.dom.input_properties_forms_wrapper.fadeIn(consts.ANIMATION_FAST);


                    //show action buttons for input
                    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);

                    //for nested group, enable keyup to check for validation of header text
                    //triggered when users type in the header input field for nested group
                    //todo check this
                    if (branch_input.type === consts.GROUP_TYPE) {
                        //formbuilder.dom.input_properties.off('keyup').on('keyup', 'input', input_properties_keyup_callback);
                    }
                    else {
                        //formbuilder.dom.input_properties.off('keyup');
                    }

                    //enable sortable on current input (only when first created)
                    possibleAnswersSortable(branch_input);
                }
                else {

                    //'from_index is set in start event of sortable'
                    //move branch inputs to keep the array sequence like the input sequence on screen
                    branch_inputs.move(formbuilder.branch.from_index, formbuilder.branch.to_index);
                    //console.log(branch_inputs);

                    //run the validation on all branch jumps, as we might have some invalid destinations after re-ordering
                    //I am forced to do this against all the branch inputs
                    validation.validateJumpsAfterSorting(branch_inputs);

                    jquery_ui.item.addClass('active');
                }
            }

            //todo test this thing
            //add this state for undoing, so it is easier to rebind everything
            formbuilder.render_action = consts.RENDER_ACTION_DO;
            undo.pushState();

            if (input_type === consts.README_TYPE) {
                $('.summernote').summernote(consts.SUMMERNOTE_OPTIONS);
            }

            //if there is not any title set, show warning
            ui.inputs_collection.toggleTitleWarning(utils.getTitleCount(branch_inputs), true);

        },
        //this callback is triggered when the user start dragging an existing input from the      sortable
        start: function (e, jquery_ui) {


            console.log('sortable start');
            //get current input position, as we need to move from here
            //console.log('branch input index: ' + jquery_ui.item.index());

            formbuilder.branch.collection_is_being_sorted = true;

            //nb the -2 is to remove the element which are no input (warning messages)
            formbuilder.branch.from_index = jquery_ui.item.index() === 0 ? 0 : jquery_ui.item.index() - 2;

            //de-activate all inputs in collection
            formbuilder.dom.inputs_collection_sortable.removeClass('active');

        },
        scroll: true,
        snap: false,
        over: function (e, jquery_ui) {

            var owner_input_ref = formbuilder.branch.active_branch_ref;
            var owner_input = utils.getInputObjectByRef(owner_input_ref);

            //hide help text if the list is empty and we are hovering with an input
            if (owner_input.branch.length === 0) {
                //remove input from dom collection (middle column)
                formbuilder.dom.inputs_collection_sortable
                    .find('div.input[data-input-ref="' + owner_input_ref + '"]')
                    .find('.input-properties__no-branch-questions-message')
                    .hide();
            }
        }
    };
};

module.exports = branch_sortable();
