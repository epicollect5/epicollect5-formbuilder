/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var save = require('actions/save');
var validation = require('actions/validation');
var possibleAnswersSortable = require('ui-handlers/possible-answers-sortable');
var possible_answers_pager = require('actions/possible-answers-pager');


var callback = function (e) {

    console.log('called branch-sortable-mousedown');


    var self = $(this);
    console.log('formbuilder current input ref ->', JSON.stringify(formbuilder.current_input_ref));
    console.log('formbuilder active branch ref ->', JSON.stringify(formbuilder.branch.active_branch_ref));

    var ref = self.attr('data-input-ref');
    var branch_input = utils.getBranchInputObjectByRef(ref);
    var previous_branch_input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
    var branch_inputs = utils.getInputObjectByRef(formbuilder.current_input_ref).branch;
    var question;

    //branch_input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + ref + '"]');

    /*
     if both the editing branch flag and the editing group flag are set, we are exiting a nested group
     */
    if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
        //we are in nested group edit mode, exit is the only action we need to intercept
        if (self.hasClass('fa-chevron-left')) {

            //get active nested group we are exiting from
            var input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);

            //exit nested group editing
            input.exitNestedGroupSortable();
        }
        else {
            return false;
        }
    }
    else {

        //deactivate all inputs in active branch sortable collection
        formbuilder.dom.inputs_collection_sortable.find('.active-branch .branch-sortable').find('.active').removeClass('active');
        //activate new clicked element
        self.addClass('active');

        //validate previous input (if any, I might have only one left) when user goes to another input, but do not show toast
        if (previous_branch_input) {
            validation.performValidation(previous_branch_input, false);
        }

        /*
         show properties for the selected input in properties panel
         */

        if (!branch_input.question) {
            //empty question text? show warning
            formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(messages.error.NO_QUESTION_TEXT_YET);
        }
        else {

            //strip html tags from readme type if any
            if (branch_input.type === consts.README_TYPE) {
                question = utils.decodeHtml(branch_input.question);
                question = question.replace(/(<([^>]+)>)/ig, ' ');
                formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(question.trunc(20));
            }
            else {
                formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(branch_input.question.trunc(20));
            }
        }

        //toggle title base on number of titles selected within this branch (but only if not checked)
        if (utils.isMaxTitleLimitReached(branch_inputs)) {
            if (!branch_input.is_title) {
                ui.input_properties_panel.toggleTitleCheckbox(consts.DISABLED_STATE, ref);
            }
        }
        else {
            ui.input_properties_panel.toggleTitleCheckbox(consts.ENABLED_STATE, ref);

        }

        formbuilder.dom.input_properties.find('.panel-body form').hide();
        // //formbuilder.dom.input_properties.find('.panel-body form[data-input-ref="' + ref + '"]');
        formbuilder.dom.input_properties.find('.panel-body form[data-input-ref="' + ref + '"]').removeClass('hidden').fadeIn(consts.ANIMATION_NORMAL);

        //hide 'no inputs selected buttons'
        formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__no-input-selected').hide();

        //if the input type has possible answers, show pager if needed
        if ($.inArray(branch_input.type, consts.MULTIPLE_ANSWER_TYPES) > -1) {
            if (branch_input.possible_answers.length > consts.LIMITS.possible_answers_per_page) {
                //show pagination
                possible_answers_pager.init(branch_input);
            }
            else {
                possible_answers_pager.tearDown(branch_input);
            }
        }

        //show save/delete btns
        formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);
        formbuilder.branch.current_input_ref = ref;

        //enable sortable on current input
        possibleAnswersSortable(branch_input);
    }

    if (branch_input.type === consts.README_TYPE) {
        $('.summernote').summernote(consts.SUMMERNOTE_OPTIONS);
    }
};

module.exports = callback;
