/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var save = require('actions/save');
var validation = require('actions/validation');
var input_properties_keyup_callback = require('ui-handlers/event-handler-callbacks/input-properties-keyup-callback');
var jumps = require('actions/jumps');
var possible_answers_pager = require('actions/possible-answers-pager');
var possibleAnswersSortable = require('ui-handlers/possible-answers-sortable');

function _exitBranch(the_input) {

    var active_branch_input;
    var input = the_input;
    var branch_validation;

    //if there is any branch to validate, do it before exiting
    if (formbuilder.branch.current_input_ref) {
        //validate currently active branch input (in case the user did not click validate himself)
        active_branch_input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
        validation.performValidation(active_branch_input, false);

    }
    //exit
    input.exitBranchSortable();
}

function _exitGroup(the_input) {

    var active_group_input;
    var input = the_input;

    //if there is any group to validate, do it before exiting
    if (formbuilder.group.current_input_ref) {
        //validate currently active group input (in case the user did not click validate himself)
        active_group_input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        validation.performValidation(active_group_input, false);

        //branch inputs are already attached to the branch property ot the owner input, just validate them
        input.validateGroupInputs();
    }
    //exit
    input.exitGroupSortable();
}


var callback = function (e) {

    /***************************************/
    //hack to remove focus from jump select so it gets refreshed
    var $focused = $(':focus');
    var jump_select = $focused.attr('data-jump-logic');
    if (jump_select === 'goto') {
        $focused.blur();
    }
    //end hack
    /*************************************/

    var self = $(this);
    var previous_input;
    var ref;
    var input;
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
    var question;
    var copy_btn_state;
    //var pager;

    /*
     If we are editng a nested branch  or group we are just interested on a click on the exit button
     to go back to the parent sortable
     */
    if (formbuilder.is_editing_branch || formbuilder.is_editing_group) {
        //we are in branch edit mode, exit is the only action we need to intercept
        if (self.hasClass('chevron-left')) {
            //get ref from parent
            ref = self.parents().eq(1).attr('data-input-ref');
            input = utils.getInputObjectByRef(ref);

            if (formbuilder.is_editing_branch) {
                _exitBranch(input);
            }
            else {
                _exitGroup(input);
            }
        }
        else {
            return false;
        }
    }
    else {

        /*
         we are editing a top level sortable
         */
        previous_input = utils.getInputObjectByRef(formbuilder.current_input_ref);
        ref = self.attr('data-input-ref');
        input = utils.getInputObjectByRef(ref);

        //enable sortable on current input
        possibleAnswersSortable(input);

        //validate previous input (if any, I might have only one left) when user goes to another input, but do not show toast
        if (previous_input) {
            validation.performValidation(previous_input, false);
        }

        //deactivate all inputs in collection
        formbuilder.dom.inputs_collection_sortable.find('.active').removeClass('active');

        //activate just current clicked input in the collection
        self.addClass('active');

        /*
         show properties for the selected input in properties panel
         */
        if (!input.question) {
            //empty question text? show warning
            formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(messages.error.NO_QUESTION_TEXT_YET);
        }
        else {

            //strip html tags from readme type if any
            if (input.type === consts.README_TYPE) {
                question = utils.decodeHtml(input.question);
                question = question.replace(/(<([^>]+)>)/ig, ' ');
                formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(question.trunc(20));
            }
            else {
                formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(input.question.trunc(20));
            }
        }
    }

    //toggle checkbox events for uniqueness if this is a child form
    // i.e. checkboxes behave like radio
    if (formbuilder.current_form_index > 0) {

        //do not attach this event for branches
        if (!formbuilder.is_editing_branch) {

            //get handle of current active properties panel
            input.dom.advanced_properties_wrapper = formbuilder
                .dom
                .input_properties_forms_wrapper
                .find('form[data-input-ref="' + input.ref + '"]')
                .find('.input-properties__form__advanced-properties');

            //bind function to make only a single checkbox selected at a time
            input.dom.advanced_properties_wrapper
                .find('.input-properties__form__advanced-properties__uniqueness input')
                .off().on('change', function () {

                    //get the current check/unckeck state of the checkbox the user has click to restore it
                    var currentCheckBoxState = $(this).prop('checked');

                    //uncheck all
                    $(this).parents('.input-properties__form__advanced-properties__uniqueness')
                        .find('input[type="checkbox"]')
                        .prop('checked', false);

                    //check/uncheck the selected one based on the previous state
                    $(this).prop('checked', currentCheckBoxState);
                });
        }
    }


    //toggle title base on number of titles selected (but only if not checked)
    if (utils.isMaxTitleLimitReached(inputs)) {
        if (!input.is_title) {
            ui.input_properties_panel.toggleTitleCheckbox(consts.DISABLED_STATE, ref);
        }
    }
    else {
        ui.input_properties_panel.toggleTitleCheckbox(consts.ENABLED_STATE, ref);
    }

    ////if any jump, refresh the jumps selected destination label as it might have changed (current selected input only)
    if (input.jumps.length > 0) {
        jumps.refreshInputJumpsDom(input, inputs);
    }

    //show current active input properties panel
    //formbuilder.dom.input_properties.find('.panel-body form').removeClass('shown').addClass('hidden');
    formbuilder.dom.input_properties.find('.panel-body form').css('display', 'none');
    formbuilder.dom.input_properties.find('.panel-body form[data-input-ref="' + ref + '"]').removeClass('hidden').fadeIn(consts.ANIMATION_NORMAL);


    // //if the input type has possible answers, show pager if needed
    if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) > -1) {
        // pager = formbuilder.dom.input_properties
        //    .find('.panel-body form[data-input-ref="' + input.ref + '"]')
        //    .find('.possible-answers__list_pager');
        if (input.possible_answers.length > consts.LIMITS.possible_answers_per_page) {
            //show pagination
            possible_answers_pager.init(input);
        }
        else {
            possible_answers_pager.tearDown(input);
        }
    }

    //show save/delete btns
    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);

    //hide message about no input selected, as input gets focus
    formbuilder.dom.input_properties_no_input_selected.hide();

    formbuilder.current_input_ref = ref;

    if (input.type === consts.README_TYPE) {
        $('.summernote').summernote(consts.SUMMERNOTE_OPTIONS);
    }

    //toggle copy button
    copy_btn_state = input.dom.is_valid ? consts.BTN_ENABLED : consts.BTN_DISABLED;
    ui.input_properties_panel.toggleCopyInputButton(input.ref, copy_btn_state);

};

module.exports = callback;
