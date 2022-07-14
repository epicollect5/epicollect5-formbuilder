/* global $, toastr, Papa*/
'use strict';
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var consts = require('config/consts');
var validation = require('actions/validation');
var import_form_validation = require('helpers/import-form-validation');
var messages = require('config/messages');
var toast = require('config/toast');
var confirm_import_callback = require('ui-handlers/event-handler-callbacks/confirm-import-possible-answers-callback');
var getPossibleAnswerPage = require('template/methods/getPossibleAnswersPage');
var possible_answers_pager = require('actions/possible-answers-pager');
var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');
var getPossibleAnswersList = require('template/methods/getPossibleAnswersList');
var undo = require('actions/undo');

var possible_answers = {

    addPossibleAnswer: function (the_input) {

        var input = the_input;
        var possible_answers_list;
        var answer_ref;
        var list_item = formbuilder.dom.partials.possible_answer_list_item;
        var properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
        var possible_answers;
        var areAllPOssibleAnswersValidinDom = true;

        possible_answers_list = properties_panel
            .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');

        //Validate answers currently in dom
        possible_answers = possible_answers_list.find('li div input');
        possible_answers.each(function (index, possible_answer) {
            if (!validation.isPossibleAnswerValid($(possible_answer).val()).is_valid) {
                areAllPOssibleAnswersValidinDom = false;
                return false;
            }
        });

        //warn user if there is any error to fix, and exit
        if (!areAllPOssibleAnswersValidinDom) {
            toast.showError(messages.error.POSSIBLE_ANSWER_EMPTY);
            return;
        }

        //when there is more than 1 possible answers, enable all remove buttons
        possible_answers_list.find('li div span button').prop('disabled', false);

        //prepare dom for possible answer list item
        //generate uniqid here and append it to the dom to be used later
        answer_ref = utils.generateUniqID();

        list_item = list_item.replace('{{answer}}', consts.POSSIBILE_ANSWER_PLACEHOLDER);
        list_item = list_item.replace('{{answer-ref}}', answer_ref);

        //load html snippet based on input type

        //do we have pagination?
        if (input.possible_answers.length >= consts.LIMITS.possible_answers_per_page) {

            //ok, so go to last possible answers page
            //todo check user is not there already
            var last_page = Math.ceil((input.possible_answers.length + 1) / (consts.LIMITS.possible_answers_per_page));

            //save answers currently in the dom
            input.savePossibleAnswers();

            //update global flag to keep track of pagination
            formbuilder.possible_answers_pagination[input.ref].page = last_page;
            getPossibleAnswerPage(input, last_page);

            //Get updated list
            possible_answers = properties_panel
                .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list li');

            //Append answer to current list if there is any room,
            //otherwise create new page
            if (possible_answers.length > (consts.LIMITS.possible_answers_per_page - 1)) {
                //go to a brand new page
                getPossibleAnswerPage(input, (last_page + 1));
                possible_answers = properties_panel
                    .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list li ');
            }

            possible_answers_list.append(list_item).fadeIn(consts.ANIMATION_FAST);

            //save the new answer (both dom and input object)
            input.possible_answers.push({
                answer: consts.POSSIBILE_ANSWER_PLACEHOLDER,
                answer_ref: answer_ref
            });
            input.savePossibleAnswers();

            //show pager
            possible_answers_pager.init(input);

            //update pagination
            possible_answers_pager.recalculatePagination(input);
        }
        else {
            possible_answers_list.append(list_item).fadeIn(consts.ANIMATION_FAST);
            input.savePossibleAnswers();
        }

        //if max number of allowed possible answers reached, disable "Add answer" button
        switch (input.type) {
            case consts.SEARCH_SINGLE_TYPE:
            case consts.SEARCH_MULTIPLE_TYPE:
                //up to 1000
                if
                    (input.possible_answers.length >= consts.LIMITS.possible_answers_max_search) {
                    ui.input_properties_panel.toggleAddAnswerBtn(true);
                }
                break;
            case consts.CHECKBOX_TYPE:
            case consts.RADIO_TYPE:
            case consts.DROPDOWN_TYPE:
                //up to 300

                if
                    (input.possible_answers.length >= consts.LIMITS.possible_answers_max) {
                    ui.input_properties_panel.toggleAddAnswerBtn(true);
                }
                break;
            default:
            //do nothing
        }
    },

    removePossibleAnswer: function (the_input, the_answer_index_dom) {

        var input = the_input;
        var answer_index_dom = the_answer_index_dom;
        var possible_answers_list;
        var possible_answers;
        var current_page = formbuilder.possible_answers_pagination[input.ref].page;

        input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');

        possible_answers_list = input.dom.properties_panel
            .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');
        possible_answers = possible_answers_list.find('li');

        /* check if the possible answer has got a jump attached
         if so, the jump will be dropped so ask the user to confirm action
         */
        //todo check if the jump is just dropped

        //do not do anything if there is only 1 possible answer
        if (input.possible_answers.length === 1) {
            return;
        }

        //if 'possible_answers' length is 2, after removing the element disable the one left, so we have at least 1 possible answer
        possible_answers.eq(answer_index_dom).fadeOut(200, function () {

            //get possible answer index offset based on what page we are showing in the DOM
            var offset = (current_page - 1) * consts.LIMITS.possible_answers_per_page;

            //remove from dom
            $(this).remove();

            //remove answer from project definition
            input.possible_answers.splice(offset + answer_index_dom, 1);

            if (input.possible_answers.length === 1) {
                possible_answers_list.find('li div span button').prop('disabled', true);
            }

            //if max number of allowed possible answers reached, disable "Add answer" button
            switch (input.type) {
                case consts.SEARCH_SINGLE_TYPE:
                case consts.SEARCH_MULTIPLE_TYPE:
                    //up to 1000
                    if
                        (input.possible_answers.length < consts.LIMITS.possible_answers_max_search) {
                        ui.input_properties_panel.toggleAddAnswerBtn(false);
                    }
                    //update possible answers in dom (when needed)
                    possible_answers_pager.recalculatePossibleAnswersDOM(input);
                    break;
                case consts.CHECKBOX_TYPE:
                case consts.RADIO_TYPE:
                case consts.DROPDOWN_TYPE:
                    //up to 300
                    if
                        (input.possible_answers.length < consts.LIMITS.possible_answers_max) {
                        ui.input_properties_panel.toggleAddAnswerBtn(false);
                    }
                    //update possible answers in dom (when needed)
                    possible_answers_pager.recalculatePossibleAnswersDOM(input);

                    input.updatePossibleInitialAnswers();
                    break;
                default:
                //do nothing
            }

            //todo check what this does here, when removing an answer?
            // input.savePossibleAnswers();

        });
    },

    updateJumpPossibleAnswers: function (the_input, the_jump_panel) {

        var input = the_input;
        var jump_panel = the_jump_panel;
        var i;
        var iLength = input.possible_answers.length;

        //find answer <select>(s)
        var selects_to_target = jump_panel
            .find('.input-properties__form__jumps__list .input-properties__form__jumps__list-item .input-properties__form__jumps__logic--answer select');

        selects_to_target.each(function (index) {

            var target = $(this);
            var selected_option = target.find('option:selected');
            var current_selected_answer_id = window.parseInt(selected_option.val(), 10);

            //get the updated answer text from "possible answers"
            for (i = 0; i < iLength; i++) {
                if (current_selected_answer_id === input.possible_answers[i].answer_id) {
                    selected_option.text(current_selected_answer_id + ' - ' + input.possible_answers[i].answer);
                }

            }
            console.log($(this).attr('id'));
            console.log($(this).find('option:selected').val());
        });
    },

    //get selected possible answer and save it in the input object as the default answer
    updatePossibleInitialAnswers: function (the_input) {
        var input = the_input;
        var possible_initial_answers_list;
        var selected_answer;

        input.dom.advanced_properties_wrapper = formbuilder
            .dom
            .input_properties_forms_wrapper
            .find('form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__advanced-properties');

        possible_initial_answers_list = input.dom.advanced_properties_wrapper.find('div.panel-body div.input-properties__form__advanced-properties__default select');

        selected_answer = possible_initial_answers_list.find('option:selected');

        input.default = selected_answer.val();

    },

    listPossibleInitialAnswers: function (the_input) {

        var input = the_input;
        var possible_answers;
        var possible_initial_answers_list;
        var value;
        var answer_ref;
        var selected = '';

        input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
        possible_answers = input.dom
            .properties_panel
            .find('.input-properties__form__possible-answers .panel-body ul.input-properties__form__possible-answers__list li');


        console.log(possible_answers);


        input.dom.advanced_properties_wrapper = formbuilder
            .dom
            .input_properties_forms_wrapper
            .find('form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__advanced-properties');

        possible_initial_answers_list = input.dom.advanced_properties_wrapper.find('div.panel-body div.input-properties__form__advanced-properties__default select');

        //empty list and re-append items todo maybe too expensive, find a better way
        possible_initial_answers_list.empty();

        //append 'none' selection, using index 0 as nothing has been selected
        possible_initial_answers_list.append('<option value="">None</option>');

        input.possible_answers.forEach(function (possible_answer) {

            var answer_ref = possible_answer.answer_ref;
            var answer = possible_answer.answer

            //pre select previously saved option
            selected = (answer_ref === input.default) ? 'selected' : '';

            possible_initial_answers_list.append('<option value="' + answer_ref + '" ' + selected + ' >' + answer + '</option>');
        });
    },

    exportPossibleAnswersCSV: function () {

        var input;
        var answers = [];
        var filename;

        input = utils.getActiveInput();

        //abort if no possible answers
        if (input.possible_answers.length === 0) {
            return false;
        }

        //abort if possible answers are invalid
        if (!import_form_validation.arePossibleAnswersValid(input.possible_answers, input.type)) {
            return false;
        }

        //filename gets very long if we use the input ref...so we do not
        filename = input.question.trunc(20) + '__possible_answers.csv';

        $(input.possible_answers).each(function (index, possible_answer) {
            answers[index] = [possible_answer.answer];
        });

        // Specifying fields and data explicitly
        var csv = Papa.unparse({
            fields: [input.question],
            data: answers
        }, {
            quotes: false,
            quoteChar: '',
            delimiter: ',',
            header: true,
            newline: '\r\n'
        });

        return {
            data: csv,
            filename: filename
        };
    },

    importCSVFile: function (files) {

        var file = files[0];
        var file_parts;
        var file_ext;
        var getPossibleAnswersHTML = require('template/methods/getPossibleAnswersHTML');

        //show overlay and cursor
        formbuilder.dom.overlay.fadeIn(0);

        formbuilder.isOpeningFileBrowser = false;

        //if the user cancels the action
        if (!file) {
            //hide overlay
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            toastr.error(messages.error.CSV_FILE_INVALID);
            return;
        }

        file_parts = file.name.split('.');
        file_ext = file_parts[file_parts.length - 1];

        //it must be csv
        if (file_ext !== consts.CSV_FILE_EXTENSION) {
            //hide overlay
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            toastr.error(messages.error.CSV_FILE_INVALID);
            return;
        }
        //file is valid, let's parse it
        var reader = new FileReader();

        reader.onload = function (e) {

            var content = e.target.result;
            var json = Papa.parse(content, { header: true, delimiter: ',' });
            var headers = json.meta.fields;
            var undo = require('actions/undo');//it is here otherwise it breaks when compiling...go figure??
            var modal = $('#csv-import-possible_answers');

            if (json.data.length === 0) {
                //empty csv file, show error
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.CSV_FILE_INVALID);
                return;
            }

            //todo show modal asking which colums and whether to replace or not the existing possible answers
            modal.modal();

            modal.off().on('shown.bs.modal', function () {

                var column_picker = $('#csv-import-possible_answers').find('.possible-answers-column-picker');
                var column_items = '';
                var selectedHeaderIndex = null;
                var params;
                var userWantstoReplaceAnswers;
                var doesFirstRowContainsHeaders;
                var possible_answers_max = consts.LIMITS.possible_answers_max;
                var input = utils.getActiveInput();

                if (input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {
                    possible_answers_max = consts.LIMITS.possible_answers_max_search;
                }

                //reset column picker
                column_picker.find('.btn').html('Pick column' + ' <span class="caret"></span>');
                column_picker.find('.btn').val('');

                //reset other controls
                modal.find('.possible_answers__first-row-headers input').prop('checked', true);

                modal.find('.possible_answers__append-or-replace input#replace').prop('checked', true);

                //disable import button
                modal.find('.possible_answers-perform-import').attr('disabled', true);

                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);

                //show list of headers so the user can select which column to use
                //generate list items
                $(headers).each(function (headerIndex, header) {
                    column_items += '<li>';
                    column_items += '<a href="#">' + header.trunc(25) + '</a>';
                    column_items += '</li>';
                });

                //append items
                column_picker.find('.dropdown-menu').empty().append(column_items);

                //show selected colun in dropdown picker
                column_picker.find('.dropdown-menu li').off().on('click', function () {
                    $(this).parents('.possible-answers-column-picker').find('.btn').html($(this).text() + ' <span class="caret"></span>');
                    $(this).parents('.possible-answers-column-picker').find('.btn').val($(this).data('value'));

                    selectedHeaderIndex = $(this).index();

                    //enable import button
                    modal.find('.possible_answers-perform-import').attr('disabled', false);
                });


                $('.possible_answers-perform-import').off().on('click', function () {

                    //show overlay and cursor
                    formbuilder.dom.overlay.fadeIn(0);

                    //get parameters from modal
                    userWantstoReplaceAnswers = modal.find('.possible_answers__append-or-replace').find('#replace').is(':checked');
                    doesFirstRowContainsHeaders = modal.find('.possible_answers__first-row-headers').find('.checkbox input').is(':checked');

                    //add callback to handle the import
                    params = {
                        userWantstoReplaceAnswers: userWantstoReplaceAnswers,
                        doesFirstRowContainsHeaders: doesFirstRowContainsHeaders,
                        input: input,
                        importedJson: json,
                        selectedHeaderIndex: selectedHeaderIndex
                    };

                    if (confirm_import_callback(params)) {

                        modal.modal('hide');

                        //if max number of allowed possible answers reached, disable "Add answer" button
                        ui.input_properties_panel
                            .toggleAddAnswerBtn(input.possible_answers.length >= possible_answers_max);

                        //recalculate pagination
                        possible_answers_pager.recalculatePagination(input);

                        //enable save project button if all inputs are valid
                        if (validation.areAllInputsValid(formbuilder.project_definition)) {
                            //enable save project button (if disabled)
                            ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
                            formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);
                        }

                        //hide overlay
                        window.setTimeout(function () {
                            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);

                            //show toast confirm
                            toast.showSuccess(messages.success.POSSIBLE_ANSWERS_IMPORTED);

                            //push state to enable undoing the action (typing) passing "true" so it gets a bit of throttling
                            undo.pushState(false);

                        }, consts.ANIMATION_SUPER_SLOW);
                    }
                    else {
                        window.setTimeout(function () {
                            //hide overlay
                            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                            //show error/warning
                            toast.showError(messages.error.POSSIBLE_ANSWERS_INVALID);
                        }, consts.ANIMATION_SUPER_SLOW);
                    }
                });
            });

            //add events to hide the modal manually (was nt working, go figure)
            modal.find('button[data-dismiss="modal"]').one('click', function () {
                modal.modal('hide');
            });
        };

        reader.readAsText(file);
    },

    orderPossibleAnswers: function (order_type) {
        //get current input object
        var input = utils.getActiveInput();
        var possible_answers = input.possible_answers;

        formbuilder.possible_answers_pagination[input.ref].page = 1;
        //show overlay and cursor
        formbuilder.dom.overlay.fadeIn(0);

        switch (order_type) {
            //order A - Z for UTF-8 languages
            case consts.POSSIBLE_ANSWERS_ORDER.AZ:
                possible_answers = possible_answers.sort(function (a, b) {
                    return a.answer.localeCompare(b.answer, undefined, {
                        ignorePunctuation: true,
                        numeric: true
                    });
                });
                break;
            //order Z - A for UTF-8 languages
            case consts.POSSIBLE_ANSWERS_ORDER.ZA:
                possible_answers = possible_answers.sort(function (a, b) {
                    return b.answer.localeCompare(a.answer, undefined, {
                        ignorePunctuation: true,
                        numeric: true
                    });
                });
                break;
            case consts.POSSIBLE_ANSWERS_ORDER.SHUFFLE:
                possible_answers = utils.shuffleArray(possible_answers);
                break;
        }

        var ordered_list_html = getPossibleAnswersList(possible_answers);
        var possible_answers_list;
        var properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');

        possible_answers_list = properties_panel
            .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');

        //remove current answers from dom and append ordered ones
        possible_answers_list
            .empty()
            .hide()
            .append(ordered_list_html)
            .fadeIn(consts.ANIMATION_FAST);

        //recalculate pagination
        possible_answers_pager.recalculatePagination(input);

        //push state to enable undoing the action (typing) passing "true" so it gets a bit of throttling
        undo.pushState(false);

        //enable save project button as user made a change
        ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
        formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);

        //hide overlay
        window.setTimeout(function () {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
        }, consts.ANIMATION_SUPER_SLOW);

    },

    deleteAllAnswers: function () {

        var input;
        var answer_ref = utils.generateUniqID();
        var undo = require('actions/undo');//it is here otherwise it breaks when compiling...go figure??

        //show overlay and cursor
        formbuilder.dom.overlay.fadeIn(0);

        //get current input object
        input = utils.getActiveInput();

        var possible_answers_list;
        var list_item = formbuilder.dom.partials.possible_answer_list_item;
        var properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');

        possible_answers_list = properties_panel
            .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');

        list_item = list_item.replace('{{answer}}', consts.POSSIBILE_ANSWER_PLACEHOLDER);
        list_item = list_item.replace('{{answer-ref}}', answer_ref);
        list_item = list_item.replace('{{disabled}}', consts.DISABLED_STATE);


        //load html snippet based on input type
        possible_answers_list.empty().hide().append(list_item).fadeIn(consts.ANIMATION_FAST);

        //reset array of possible answers to 1 single default element
        input.possible_answers = [{
            answer_ref: utils.generateUniqID(),
            answer: consts.POSSIBILE_ANSWER_PLACEHOLDER
        }];

        //push state to enable undoing the action (typing) passing "true" so it gets a bit of throttling
        undo.pushState(false);

        //enable save project button (if disabled)
        ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
        formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);

        //enable add answer button
        ui.input_properties_panel.toggleAddAnswerBtn(false);

        //reset pagination
        possible_answers_pager.tearDown(input);

        //hide overlay
        window.setTimeout(function () {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
        }, consts.ANIMATION_SUPER_SLOW);
    }
};

module.exports = possible_answers;
