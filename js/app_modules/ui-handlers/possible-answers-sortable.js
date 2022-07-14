'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var ui = require('helpers/ui');
var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');

var possibleAnswersSortable = function (input) {

    var validation = require('actions/validation');

    //if not multiple choice type, return
    if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) === -1) {
        return false;
    }

    //attach sortable only once per each input to keep low memory usage
    if ($.inArray(input.ref, formbuilder.possible_answers.enabled_sortable) === -1) {

        //enable sortable for this input
        formbuilder.dom.input_properties_forms_wrapper
            .find('.input-properties__form__possible-answers__list').sortable({
            axis: 'y',
            containment: 'parent',
            handle: '.input-properties__form__possible-answers__list__drag-answer',
            cancel: '',
            helper: 'clone',
            tolerance: 'pointer',
            placeholder: 'possible-answers-drop-placeholder',
            stop: function (e, jquery_ui) {
                //'from_index is set in start event of sortable'
                formbuilder.possible_answers.to_index = jquery_ui.item.index('') === 0 ? jquery_ui.item.index() : jquery_ui.item.index();

                //move inputs to keep the possible answers sequence like the sequence on screen (dom)
                input.possible_answers.move(formbuilder.possible_answers.from_index, formbuilder.possible_answers.to_index);

                //save possible answers
                input.savePossibleAnswers();
                //validate input
                validation.performValidation(input, false);

                //enable save project button as user made a change
                //and ALL the inputs are valid

                //enable save project button if all inputs are valid
                if (validation.areAllInputsValid(formbuilder.project_definition)) {
                    //enable save project button (if disabled)
                    ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
                    formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);
                }
            },
            start: function(e, jquery_ui){
                formbuilder.possible_answers.from_index = jquery_ui.item.index() === 0 ? 0 : jquery_ui.item.index();
            }
        }).disableSelection();

        //keep track of the current inpuot so we do not attach the event more than once
        formbuilder.possible_answers.enabled_sortable.push(input.ref);
    }
};

module.exports = possibleAnswersSortable;
