'use strict';
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var consts = require('config/consts');
var messages = require('config/messages');
var input_properties_click_callback = require('ui-handlers/event-handler-callbacks/input-properties-click-callback');
var input_properties_focus_callback = require('ui-handlers/event-handler-callbacks/input-properties-focus-callback');
var delete_form_click_callback = require('ui-handlers/event-handler-callbacks/delete-form-click-callback');
var export_form_click_callback = require('ui-handlers/event-handler-callbacks/export-form-click-callback');
var print_as_pdf_click_callback = require('ui-handlers/event-handler-callbacks/print-as-pdf-click-callback');
var input_collection_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback');
var input_properties_keyup_callback = require('ui-handlers/event-handler-callbacks/input-properties-keyup-callback');
var input_properties_title_checkbox_callback = require('ui-handlers/event-handler-callbacks/input-properties-title-checkbox-callback');
var delete_all_questions_callback = require('ui-handlers/event-handler-callbacks/delete-all-questions-click-callback');
var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');
var validation = require('actions/validation');
var form;
var forms;

var form_factory = {

    createTabButton: function () {

        //create new tab button, append after latest form tab button
        var form_tab_button_html = ui.forms_tabs.getFormTabButtonHTML(form);
        var form_tab_buttons = formbuilder.dom.forms_tabs.find('li.main__tabs__form-btn');
        form_tab_buttons.eq(form_tab_buttons.length - 1).after(form_tab_button_html);
    },

    createChildForm: function (the_form_name, the_form_ref, the_form_index, is_creating_new_child_form) {

        var self = this;
        var deferred = new $.Deferred();
        form = {};
        form.name = the_form_name;
        form.slug = utils.slugify(the_form_name);
        form.ref = the_form_ref;
        form.type = consts.FORM_HIERARCHY_TYPE;
        formbuilder.current_form_index = the_form_index;
        formbuilder.current_form_ref = form.ref;
        forms = formbuilder.project_definition.data.project.forms;

        self.createTabButton();

        if (is_creating_new_child_form) {
            form.inputs = [];
            formbuilder.project_definition.data.project.forms[the_form_index] = form;
        }
        else {
            //set the form tab button to a valid green check as a parsed from must be valid
            ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);
        }

        //create new tab content
        $.when(ui.forms_tabs.getFormTabContentHTML(form)).then(function (html) {

            formbuilder.dom.forms_tabs_content.append(html);

            //update formbuilder dom references to point to the new form markup
            self.updateFormbuilderDomReferences(form.ref);

            //show name of form in tab and inputs collection container, truncating form name (>10) for UI purposes
            formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_FORM);
            formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(form.name.trunc(consts.INPUTS_COLLECTION_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2)));

            //show empty input question preview
            ui.input_properties_panel.showInputQuestionPreview('');

            //enable delete form button as the new form will be the last child
            // (it is possible to delete from the last child up to the first child up to the top form which cannot be deleted)
            formbuilder.dom.inputs_collection.find('.inputs-collection__buttons .inputs-collection__buttons--remove-form').prop('disabled', false);

            //switch to newly created form/tab when creating a child form only, not when rendering an existing project for editing
            if (is_creating_new_child_form) {

                formbuilder.dom.forms_tabs.find('li a[href="#' + form.ref + '-tabpanel"]').tab('show');

                //bind event handlers
                self.bindFormPanelsEvents();
            }

            deferred.resolve();
        });

        return deferred.promise();
    },

    removeForm: function (previous_form_ref, form_ref, form_tab) {

        //delete form from project definition (it is always the last one)
        formbuilder.project_definition.data.project.forms.pop();

        //remove form markup from dom (a single tabpanel, which has got both the input collection and the inputs properties)
        formbuilder.dom.forms_tabs_content.find('#' + form_ref + '-tabpanel').remove();

        //remove tab
        form_tab.remove();

        //set form state to previous
        formbuilder.current_form_index--;

        //set ref to previous form
        formbuilder.current_form_ref = previous_form_ref;
        form_ref = previous_form_ref;

        //update formbuilder dom references to point to the selected form markup
        form_factory.updateFormbuilderDomReferences(form_ref);

        //enable delete form button for previous form as it becomes the last (aside from fist form)
        if (formbuilder.current_form_index !== 0) {
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__buttons .inputs-collection__buttons--remove-form')
                .prop('disabled', false);
        }

        //show add form button if total is less than max number of forms
        if (formbuilder.project_definition.data.project.forms.length < consts.MAX_NUMBER_OF_NESTED_CHILD_FORMS) {
            formbuilder.dom.forms_tabs.find('.main__tabs_add-form').parent().show();
        }

        //resize form tabs
        ui.forms_tabs.resizeFormTabs();


        //enable save project button if all inputs are valid
        if (validation.areAllInputsValid(formbuilder.project_definition)) {
            //console.log('** all good **');
            //enable save project button
            ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
            formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);
        }
    },

    updateFormbuilderDomReferences: function (the_form_ref) {

        var form_ref = the_form_ref;

        //update formbuilder dom references to point to the currently active form markup
        formbuilder.dom.input_properties = $('#' + form_ref + '-input-properties.input-properties');
        formbuilder.dom.input_properties_forms_wrapper = $('#' + form_ref + '-input-properties.input-properties > .panel > .panel-body.input_properties__forms_wrapper');
        formbuilder.dom.input_properties_buttons = $('#' + form_ref + '-input-properties .input-properties__buttons');

        //todo check this
        formbuilder.dom.input_properties_no_input_selected = $('.input-properties__no-input-selected');

        formbuilder.dom.inputs_collection = $('#' + form_ref + '-inputs-collection.inputs-collection');
        formbuilder.dom.inputs_collection_sortable = $('#' + form_ref + '-inputs-collection.inputs-collection .panel .panel-body');

    },

    bindFormPanelsEvents: function () {

        var sortable = require('ui-handlers/sortable');
        var import_form_click_callback = require('ui-handlers/event-handler-callbacks/import-form-click-callback');

        sortable();

        //attach delegate event to mousedown so we cover both clicks and click hold + drag
        formbuilder.dom.inputs_collection_sortable.on('mousedown', 'div.input', input_collection_sortable_mousedown_callback);

        //handle click action on input properties panel in the right sidebar (use event delegation)
        //todo test this if it is unbinding other events
        formbuilder.dom.input_properties.off('click').on('click', 'button.btn, .possible_answer-more-action', input_properties_click_callback);
        //triggered when users focus on a select of the input properties panel
        formbuilder.dom.input_properties.on('focus', 'select', input_properties_focus_callback);

        //triggered when user wants to delete a form
        formbuilder.dom.inputs_collection.find('.inputs-collection__buttons--remove-form').off('click').on('click', delete_form_click_callback);
        //formbuilder.dom.inputs_collection.on('click', '.inputs-collection__buttons--remove-form', delete_form_click_callback);

        //triggered when user wants to export a form
        formbuilder.dom.inputs_collection.find('.inputs-collection__export-form').off('click').on('click', function (e) {

            //avoid any action if option in dropdown is disabled
            if ($(e.target).parent().hasClass(consts.DISABLED_STATE)) {
                return false
            }

            export_form_click_callback();
        });

        //triggered when the user wants to remove all questions at once
        formbuilder.dom.inputs_collection.on('click', '.inputs-collection__delete-all-questions', function (e) {
            delete_all_questions_callback();
        });

        //triggered when user wants to export a form
        formbuilder.dom.inputs_collection.find('.inputs-collection__print-as-pdf').off('click').on('click', function (e) {

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

        //validate question text/ group or branch header on keyup
        formbuilder.dom.input_properties.on('keyup', '.input-properties__form__question input', input_properties_keyup_callback);

        //triggered when users check/unckeck title in the input properties panel
        formbuilder.dom.input_properties.on('change', '.input-properties__form__title-flag input', input_properties_title_checkbox_callback);
    },

    unbindFormPanelsEvents: function () {

        formbuilder.dom.input_properties.off();
        formbuilder.dom.inputs_collection.off();

        //destroy sortable only if it is set already (see http://goo.gl/riN4Yk)
        if (formbuilder.dom.inputs_collection_sortable.data('ui-sortable')) {
            formbuilder.dom.inputs_collection_sortable.sortable('destroy');//Remove the plugin functionality
        }
        formbuilder.dom.inputs_collection_sortable.off();
    }
};

module.exports = form_factory;
