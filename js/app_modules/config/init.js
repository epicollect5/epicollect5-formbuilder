/* global toastr, $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var draggable = require('ui-handlers/draggable');
var sortable = require('ui-handlers/sortable');
var input_properties_click_callback = require('ui-handlers/event-handler-callbacks/input-properties-click-callback');
var input_collection_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback');
var input_properties_focus_callback = require('ui-handlers/event-handler-callbacks/input-properties-focus-callback');
var input_properties_change_callback = require('ui-handlers/event-handler-callbacks/input-properties-change-callback');
var input_properties_title_checkbox_callback = require('ui-handlers/event-handler-callbacks/input-properties-title-checkbox-callback');
var form_tab_click_callback = require('ui-handlers/event-handler-callbacks/form-tab-click-callback');
var modal_edit_form_name_callback = require('ui-handlers/event-handler-callbacks/modal-form-callback');
var export_form_click_callback = require('ui-handlers/event-handler-callbacks/export-form-click-callback');

var print_as_pdf_click_callback = require('ui-handlers/event-handler-callbacks/print-as-pdf-click-callback');

var import_form_click_callback = require('ui-handlers/event-handler-callbacks/import-form-click-callback');

var delete_all_questions_callback = require('ui-handlers/event-handler-callbacks/delete-all-questions-click-callback');

var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');
var input_properties_keyup_callback = require('ui-handlers/event-handler-callbacks/input-properties-keyup-callback');
var modal_regex_callback = require('ui-handlers/event-handler-callbacks/modal-regex-callback');
var input_properties_advanced_tab_callback = require('ui-handlers/event-handler-callbacks/input-properties-advanced-tab-click-callback');


var messages = require('config/messages');
var parse = require('actions/parse');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var undo = require('actions/undo');

var init = function () {

    var project_name = formbuilder.project_definition.data.project.name;
    var first_form_name = formbuilder.project_definition.data.project.forms[0].name;

    //config toast notification options
    window.toastr.options = {
        closeButton: true,
        // progressBar: true,
        positionClass: 'toast-top-center',
        showDuration: '200',
        hideDuration: '300',
        timeOut: '2000'
    };

    //on Safari 9, JSON.stringify() causes a bug, so we override it with a MDN polyfill
    if (utils.isSafari) {
        window.CircularJSON = utils.JSONPolyfill;
    }

    //set back button
    $('.navbar-back-button').on('click', function () {
        utils.goBack();
    });

    //set undo button
    $('.main__tabs__undo-btn').off().on('click', function () {
        undo.execute();
    });

    //todo disable text selection if it causes problems with drag and drop

    //make text not selectable for sortable
    formbuilder.dom.inputs_collection.disableSelection();

    /*********************************************************/
    /******* attach UI dom events and event handlers *********/

    draggable();

    //init inputs collection as a sortable (it is also droppable by default)
    sortable();

    //handle click action on input properties panel in the right sidebar (use event delegation)
    formbuilder.dom.input_properties.off().on('click', 'button.btn, .possible_answer-more-action', input_properties_click_callback);

    //handle click on the advanced tab button
    formbuilder.dom.input_properties.on('click', '.advanced-tab', input_properties_advanced_tab_callback);

    //attach delegate event to mousedown so we cover both clicks and click hold + drag
    formbuilder.dom.inputs_collection_sortable.on('mousedown', 'div.input', input_collection_sortable_mousedown_callback);

    //triggered when users focus on a select of the input properties panel
    formbuilder.dom.input_properties.on('focus', 'select', input_properties_focus_callback);

    //triggered when users change selected option in the input properties panel
    formbuilder.dom.input_properties.on('change', 'select', input_properties_change_callback);

    //triggered when users check/unckeck title in the input properties panel
    formbuilder.dom.input_properties.on('change', '.input-properties__form__title-flag input', input_properties_title_checkbox_callback);

    //triggered when user navigates form hierarchy using the forms tabs
    formbuilder.dom.forms_tabs.on('click', 'a[data-toggle="tab"]', form_tab_click_callback);

    //triggered when user navigates form hierarchy using the forms tabsx
    formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);

    //triggered when user wants to export a form
    formbuilder.dom.inputs_collection.on('click', '.inputs-collection__export-form', function (e) {

        //avoid any action if option in dropdown is disabled
        if ($(e.target).parent().hasClass(consts.DISABLED_STATE)) {
            return false
        }

        export_form_click_callback();
    });

    //triggered when user wants to export a form
    formbuilder.dom.inputs_collection.on('click', '.inputs-collection__print-as-pdf', function (e) {

        //avoid any action if option in dropdown is disabled
        if ($(e.target).parent().hasClass(consts.DISABLED_STATE)) {
            return false
        }

        print_as_pdf_click_callback();
    });

    //triggered when the user wants to import a form
    formbuilder.dom.inputs_collection.find('.inputs-collection__form-import input').off('change').on('change', function () {
        import_form_click_callback(this.files);
        $(this).val(null);
    });

    //triggered when the user wants to remove all questions at once
    formbuilder.dom.inputs_collection.on('click', '.inputs-collection__delete-all-questions', function (e) {
        delete_all_questions_callback();
    });

    //validate question text/ group or branch header, possible answer text on keyup
    formbuilder.dom.input_properties
        .off('keyup')
        .on('keyup', '.input-properties__form__question input, .input-properties__form__possible-answers__list__possible_answer_item input', input_properties_keyup_callback);

    //blur links after closing modals
    $(document).on('hidden.bs.modal', function (e) {
        $('a').blur();
    });

    //show project name in navbar
    formbuilder.dom.navbar.find('.navbar-project-name span').text(project_name);

    //show project logo in sidebar
    //'var logo_url = https://test.epicollect.net/api/internal/json/media/ants-project?type=photo&name=logo.jpg&format=project_mobile_logo'
    console.log(consts.PROJECT_URL);
    console.log(window.location.href);

    //for live server only
    // if (window.location.href.indexOf('localhost/') === -1 && window.location.href.indexOf('epicollect5-formbuilder/') === -1) {
    utils.setProjectLogoUrl();
    formbuilder.dom.navbar.find('.navbar-project-name img').attr('src', consts.PROJECT_LOGO_URL);
    // }
    //else {
    //  formbuilder.dom.navbar.find('.navbar-project-name img').remove();
    // }

    //show name of first form in navbar and inputs collection container

    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_FORM);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(first_form_name.trunc(consts.INPUTS_COLLECTION_FORM_NAME_MAX_DISPLAY_LENGHT));
    formbuilder.dom.input_properties.find('.question-preview').text('');

    //set form name in form tab
    ui.forms_tabs.setFirstFormTabName(first_form_name);

    //hide properties panel buttons as no input is selected
    formbuilder.dom.input_properties_buttons.fadeOut();

    /*********************************************************/

    //init help popovers and tooltips
    $('[data-toggle="popover"]').popover();
    $('[data-toggle="tooltip"]').tooltip();

    //edit form name modal handler
    $('.main__modal--edit-form-name').on('show.bs.modal', modal_edit_form_name_callback);

    //regex modal handler
    $('#info-regex').on('show.bs.modal', modal_regex_callback);

    //render project from project definition json
    formbuilder.render_action = consts.RENDER_ACTION_DO;
    $.when(parse.renderProject(formbuilder.project_definition)).then(function () {

        //set initial state, now after render all the inputs have the 'dom' property
        var state = {
            project_definition: JSON.parse(JSON.stringify(formbuilder.project_definition)),
            active_input_ref: null,
            active_form_index: 0,
            active_form_ref: formbuilder.project_definition.data.project.forms[0].ref
        };

        //set state as the starting state pushing a deep copy
        formbuilder.state.push(state);

        //hide loader and show formbuilder containers
        formbuilder.dom.loader.fadeOut(consts.ANIMATION_FAST);
        formbuilder.dom.navbar.removeClass('hidden').hide().fadeIn(consts.ANIMATION_FAST);
        formbuilder.dom.main_container.removeClass('hidden').hide().fadeIn(consts.ANIMATION_FAST);
    });

    $(window).on('beforeunload', function () {
        return 'Are you sure you want to leave?';
    });

    /**
 * String.prototype.replaceAll() polyfill
 * https://gomakethings.com/how-to-replace-a-section-of-a-string-with-another-one-with-vanilla-js/
 * @author Chris Ferdinandi
 * @license MIT
 */
    if (!String.prototype.replaceAll) {
        String.prototype.replaceAll = function (str, newStr) {
            // If a regex pattern
            if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
                return this.replace(str, newStr);
            }
            // If a string
            return this.replace(new RegExp(str, 'g'), newStr);
        };
    }
};

module.exports = init;

