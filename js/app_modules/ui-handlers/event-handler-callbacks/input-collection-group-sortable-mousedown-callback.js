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

    console.log('called group-sortable-mousedown');

    var self = $(this);
    var ref = self.attr('data-input-ref');
    var group_input = utils.getGroupInputObjectByRef(ref);
    var previous_group_input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
    var question;

    //deactivate all inputs in active group sortable collection
    formbuilder.dom.inputs_collection_sortable.find('.active-group .group-sortable').find('.active').removeClass('active');
    //activate new clicked element
    self.addClass('active');

    //validate previous input (if any, I might have only one left) when user goes to another input, but do not show toast
    if (previous_group_input) {
        validation.performValidation(previous_group_input, false);
    }

    /*
     show properties for the selected input in properties panel
     */
    if (!group_input.question) {
        //empty question text? show warning
        formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(messages.error.NO_QUESTION_TEXT_YET);
    }
    else {

        //strip html tags from readme type if any
        if (group_input.type === consts.README_TYPE) {
            question = utils.decodeHtml(group_input.question);
            question = question.replace(/(<([^>]+)>)/ig, ' ');
            formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(question.trunc(20));
        }
        else {
            formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(group_input.question.trunc(20));
        }
    }

    //toggle title base on number of titles selected (but only if not checked)
    if (utils.isMaxTitleLimitReached(inputs)) {
        if (!group_input.is_title) {
            ui.input_properties_panel.toggleTitleCheckbox(consts.DISABLED_STATE, ref);
        }
    }
    else {
        ui.input_properties_panel.toggleTitleCheckbox(consts.ENABLED_STATE, ref);
    }

    formbuilder.dom.input_properties.find('.panel-body form').hide();
    formbuilder.dom.input_properties.find('.panel-body form[data-input-ref="' + ref + '"]').removeClass('hidden').fadeIn(consts.ANIMATION_NORMAL);

    //hide 'no inputs selected buttons'
    formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__no-input-selected').hide();

    //if the input type has possible answers, show pager if needed
    if ($.inArray(group_input.type, consts.MULTIPLE_ANSWER_TYPES) > -1) {
        if (group_input.possible_answers.length > consts.LIMITS.possible_answers_per_page) {
            //show pagination
            possible_answers_pager.init(group_input);
        }
        else {
            possible_answers_pager.tearDown(group_input);
        }
    }

    //show save/delete btns
    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);
    formbuilder.group.current_input_ref = ref;

    if (group_input.type === consts.README_TYPE) {
        $('.summernote').summernote(consts.SUMMERNOTE_OPTIONS);
    }
    //enable sortable on current input
    possibleAnswersSortable(group_input);
};

module.exports = callback;
