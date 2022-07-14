'use strict';
var formbuilder = require('config/formbuilder');
var input_factory = require('factory/input-factory');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var consts = require('config/consts');
var messages = require('config/messages');
var validation = require('actions/validation');
var template = require('template');
var undo = require('actions/undo');
var toast = require('config/toast');
var possibleAnswersSortable = require('ui-handlers/possible-answers-sortable');

var sortable = function () {

    var input;

    formbuilder.dom.inputs_collection_sortable.sortable({
        zIndex: 9999,
        cursor: 'move',
        items: '> div.input',
        revert: 100,
        //axis: 'y',// it causes the placeholder to be always active
        containment: 'parent',
        // containment: 'document', no!
        tolerance: 'pointer',
        // forcePlaceholderSize: true,
        placeholder: 'input-collection-drop-placeholder',

        //triggered when a new input is dropped over the sortable
        receive: function (e, jquery_ui) {

            var input_factory = require('factory/input-factory');
            var form_index = formbuilder.current_form_index;
            var form_ref = formbuilder.current_form_ref;
            var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;
            var previous_input_ref = formbuilder.current_input_ref;
            var input_type = jquery_ui.item.attr('data-type');
            var input_index = inputs.length;
            var input_ref = utils.generateInputRef(form_ref);

            //validate previous input (if any) to show embedded errors (in case the user did not press validate button)
            if (previous_input_ref && input_index > 0) {
                validation.performValidation(utils.getInputObjectByRef(previous_input_ref), false);
            }

            //console.log('sortable receive');
            jquery_ui.item.removeAttr('style'); // undo styling set by jqueryUI (http://goo.gl/EKz8tC)

            formbuilder.collection_is_being_sorted = false;
            //generate input object based on type and set index incrementally
            input = input_factory.createInput(input_type, input_ref);
            formbuilder.current_input_ref = input.ref;
            // console.log(input);

            //disable current active element
            var current_element = formbuilder.dom.inputs_collection_sortable.find('.active');
            current_element.removeClass('active');

            //add input to collection as the last one
            inputs.push(input);
            //console.log(inputs);

            //hide message about no input selected, as dropped input gets focus
            formbuilder.dom.input_properties_no_input_selected.hide();

            //get hold of advanced properties panel for this input
            input.dom.advanced_properties_wrapper = formbuilder
                .dom
                .input_properties_forms_wrapper
                .find('form[data-input-ref="' + input.ref + '"]')
                .find('.input-properties__form__advanced-properties');

            //disable save project button as by default an input is invalid when it is created
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);

            //set form tab as invalid, as the new input will be invalid by default
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);



        },
        stop: function (e, jquery_ui) {

            var form_index = formbuilder.current_form_index;
            var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;
            var placeholder_text = messages.error.NO_QUESTION_TEXT_YET;
            var input_type = jquery_ui.item.attr('data-type');
            var properties_panel_html;

            //disable draggable if we hit the max amount of inputs allowed
            if (utils.getInputsTotal(inputs) >= consts.INPUTS_MAX_ALLOWED) {
                ui.input_tools.disable();
            }

            //hide search input if we hit the max (globally) but only when adding new inputs
            if (input_type === consts.SEARCH_SINGLE_TYPE && !formbuilder.collection_is_being_sorted) {
                if (utils.getSearchInputsTotal() >= consts.LIMITS.search_inputs_max) {
                    ui.input_tools.hideSearchInput();
                    console.log('search limit reached');

                    //show warning to user
                    toast.showWarning(messages.warning.SEARCH_INPUTS_LIMIT_REACHED + '(' + consts.LIMITS.search_inputs_max + ')');
                }
            }

            //console.log('sortable stop');
            jquery_ui.item.removeAttr('style'); // undo styling set by jqueryUI (http://goo.gl/EKz8tC)

            var input_ref = formbuilder.current_input_ref;

            //get the index where the input was dropped (skip when list is empty)
            console.log(jquery_ui.item.index());
            //here from_index is based on the siblings, so we need to remove the indexes for the warning messages <div>
            //we have 2 <div>, so remove 2
            formbuilder.to_index = jquery_ui.item.index('') === 0 ? jquery_ui.item.index() : jquery_ui.item.index() - 2;

            /*
             if the user is dragging a new input over, it was added as the last element of the array
             otherwise the current input position is set in the start event
             */
            if (!formbuilder.collection_is_being_sorted) {

                //override 'from_index' as we are dropping a new element
                formbuilder.from_index = inputs.length - 1;

                //move inputs to keep the array sequence like the input sequence on screen
                inputs.move(formbuilder.from_index, formbuilder.to_index);

                jquery_ui.item.addClass('active');
                jquery_ui.item.attr('data-input-ref', input_ref);

                //append input id and a warning icon, as by default the question does not have any text
                jquery_ui.item.find('.input-inner').append(ui.inputs_collection.getInputStateIconsHTML());

                //add placeholder text on current input (based on input type)
                if (input_type === consts.BRANCH_TYPE) {
                    //it is a branch, add branch placeholder
                    placeholder_text = messages.error.NO_BRANCH_HEADER_YET;
                }

                if (input_type === consts.GROUP_TYPE) {
                    //it is a group, add group placeholder
                    placeholder_text = messages.error.NO_GROUP_HEADER_YET;
                }

                jquery_ui.item.find('span.question-preview').text(placeholder_text);

                //show input properties for the new dropped input
                formbuilder.dom.input_properties.find('.panel-body form').hide();
                formbuilder.dom.input_properties.find('.panel-title span').text(placeholder_text);

                //create properties panel in right sidebar for this input (common properties)
                properties_panel_html = template.getInputPropertiesPanelHTML(input);

                //append input and show it as it gets selected by default
                formbuilder.dom.input_properties_forms_wrapper.hide();
                $(properties_panel_html).removeClass('hidden').appendTo(formbuilder.dom.input_properties_forms_wrapper);
                formbuilder.dom.input_properties_forms_wrapper.fadeIn(consts.ANIMATION_FAST);

                //show action buttons for input
                formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);

                //for branches, enable keyup to check for validation of header text
                //triggered when users type in the header input field for branches or groups

                if (input.type === consts.BRANCH_TYPE || input.type === consts.GROUP_TYPE) {
                    //formbuilder.dom.input_properties.off('keyup').on('keyup', 'input', input_properties_keyup_callback);
                }
                else {
                    // formbuilder.dom.input_properties.off('keyup');
                }

                //enable sortable on current input (only when it gets created)
                possibleAnswersSortable(input);
            }
            else {

                //todo do I need to bind keyup for branches and groups here?

                //'from_index is set in start event of sortable'
                //move inputs to keep the array sequence like the input sequence on screen
                inputs.move(formbuilder.from_index, formbuilder.to_index);

                //run the validation on all jumps, as we might have some invalid destinations after re-ordering
                //I am forced to do this against all the inputs
                validation.validateJumpsAfterSorting(inputs);

                jquery_ui.item.addClass('active');
            }


            //push state to enable undoing the action (adding/dragging input)
            formbuilder.render_action = consts.RENDER_ACTION_DO;
            undo.pushState();

            if (input_type === consts.README_TYPE) {
                $('.summernote').summernote(consts.SUMMERNOTE_OPTIONS);
            }

            //if there is not any title set, show warning
            //but only if there are any inputs
            if (inputs.length > 0) {
                ui.inputs_collection.toggleTitleWarning(utils.getTitleCount(inputs), false);
            }
            else {
                //hide it, passing a count > 1
                ui.inputs_collection.toggleTitleWarning(1, false);

                //disable download form button
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__export-form').addClass('disabled');

                //disable print as pdf form button
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__print-as-pdf').addClass('disabled');
            }



        },
        //this callback is triggered when the user start dragging an existing input from the sortable
        start: function (e, jquery_ui) {

            //get current input position, as we need to move from here (if there is any input)
            formbuilder.collection_is_being_sorted = true;
            //here from_index is based on the siblings, so we need to remove the indexes for the warning messages <div>
            //we have 2 <div>, so remove 2
            formbuilder.from_index = jquery_ui.item.index() === 0 ? 0 : jquery_ui.item.index() - 2;

            //de-activate all inputs in collection
            formbuilder.dom.inputs_collection_sortable.removeClass('active');
        },
        over: function () {
            var form_index = formbuilder.current_form_index;
            var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;
            //remove no questions message and upload button if no inputs
            if (inputs.length === 0) {
                formbuilder.dom.inputs_collection
                    .find('.input-properties__no-questions-message')
                    .addClass('hidden');
            }
        },
        out: function () {
            var form_index = formbuilder.current_form_index;
            var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;
            //show no questions message and upload button if no inputs
            if (inputs.length === 0) {
                formbuilder.dom.inputs_collection
                    .find('.input-properties__no-questions-message')
                    .hide()
                    .removeClass('hidden')
                    .fadeIn(consts.ANIMATION_FAST);
            }
        },
        scroll: true
    }).disableSelection();
};

module.exports = sortable;
