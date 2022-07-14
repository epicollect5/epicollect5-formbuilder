'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var input_factory = require('factory/input-factory');
var form_factory = require('factory/form-factory');
var Input = require('factory/input-prototype');
var template = require('template');
var validation = require('actions/validation');
var input_collection_branch_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-branch-sortable-mousedown-callback');

var initFormbuilder = function () {

    var self = this;
    var project;
    var forms;
    var state;
    // var project_definition;
    var active_branch;
    var active_branch_input;
    var active_nested_group;


    //drop any reference to input ref, as we start with no input selected
    formbuilder.current_input_ref = undefined;
    formbuilder.is_editing_branch = false;
    formbuilder.is_editing_group = false;

    //re-enable branch input tool in left sidebar
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch').show();
    //re-enable group input tool in left sidebar
    formbuilder.dom.inputs_tools_draggable.filter('.input-group').show();

    if(utils.getSearchInputsTotal() >= consts.LIMITS.search_inputs_max) {
        ui.input_tools.hideSearchInput();
    }
    else {
        ui.input_tools.showSearchInput();
    }

    //disable save project button, as there is no point saving a project with no changes
    //it will be re-enable as soon the user make a change
    formbuilder.dom.save_project_btn.off('click');

    //when undoing
    if (formbuilder.render_action === consts.RENDER_ACTION_UNDO) {

        //get current project definition as we have all the methods attached to inputs (it is the previous state just rendered on screen)
        //project_definition = formbuilder.project_definition;
        state = formbuilder.previous_state;
        project = formbuilder.project_definition.data.project;
        forms = project.forms.slice();

        //let's set all inputs as disabled to start with
        formbuilder.current_input_ref = undefined;

        //run validation on each form
        $(forms).each(function (index, form) {

            //set form dom references (for the validation and dom changes)
            form_factory.updateFormbuilderDomReferences(form.ref);

            //set formbuilder stet for validation
            formbuilder.current_form_index = index;
            formbuilder.current_form_ref = form.ref;

            //todo check this for branches, groups and nested groups
            $(form.inputs).each(function (index, input) {

                //check if we have an active input after undoing
                if (input.ref === state.active_input_ref) {
                    formbuilder.current_input_ref = state.active_input_ref;
                }

                if (!input.dom.is_valid) {
                    //run a validation after the dom is created looping all the inputs which are set as false, and set dom accordingly
                    validation.performValidation(input, false);
                }
            });

            if (validation.areFormInputsValid(index)) {
                //set valid icon on form
                ui.forms_tabs.showFormValidIcon(index);
            }
            else {
                //set invalid icon on form
                ui.forms_tabs.showFormInvalidIcon(index);
            }
        });

        //set formbuilder interface to previous state
        formbuilder.current_form_index = state.active_form_index;
        formbuilder.current_form_ref = state.active_form_ref;
        form_factory.updateFormbuilderDomReferences(formbuilder.current_form_ref);
        formbuilder.is_editing_branch = state.was_editing_branch;
        formbuilder.is_editing_group = state.was_editing_group;

        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //todo re-enable the nested group that was being edited


            console.log(formbuilder);

            active_branch = utils.getInputObjectByRef(state.active_branch_ref);
            active_nested_group = utils.getNestedGroupObjectByRef(active_branch, state.active_group_ref);
            active_branch.enterBranchSortable();

            formbuilder.current_input_ref = state.active_branch_ref;//the branch that was active when undoing
            formbuilder.branch.current_input_ref = state.active_group_ref;//the nested group that was active when undoing
            formbuilder.group.active_group_ref = state.active_group_ref;//the nested group that was active when undoing

            active_nested_group.enterGroupSortable(true);

        }
        else {
            if (formbuilder.is_editing_branch) {
                //re-enable the branch that was being edited
                active_branch = utils.getInputObjectByRef(state.active_branch_ref);
                active_branch.enterBranchSortable();

                //set the active branch input if there was one selected
                if (state.active_branch_input_ref) {
                    //trigger a synthetic click on the branch sortable (dom)
                    //active_branch_input = utils.getBranchInputObjectByRef(state.active_branch_input_ref);
                    $('.input[data-input-ref="' + state.active_branch_input_ref + '"]').trigger('mousedown');
                }

                //switch to previously active properties tab
                formbuilder.dom.input_properties_forms_wrapper
                    .find('.nav-tabs .nav-tabs__tab-btn-item a[href="' + state.active_properties_tab + '"]').tab('show');
            }

            if (formbuilder.is_editing_group) {
                //re-enable the branch that was being edited
                var active_group = utils.getInputObjectByRef(state.active_group_ref);
                active_group.enterGroupSortable();

                if (state.active_group_input_ref) {
                    //trigger a synthetic click on the branch sortable (dom)
                    //active_branch_input = utils.getBranchInputObjectByRef(state.active_branch_input_ref);
                    $('.input[data-input-ref="' + state.active_group_input_ref + '"]').trigger('mousedown');
                }

                //switch to previously active properties tab
                formbuilder.dom.input_properties_forms_wrapper
                    .find('.nav-tabs .nav-tabs__tab-btn-item a[href="' + state.active_properties_tab + '"]').tab('show');

            }
        }

        //if the user was editing main forms, rebind events
        if (!formbuilder.is_editing_branch && !formbuilder.is_editing_group) {

            /* do this as we might have had an active branch when clicking undo ***************/
            //enable form tab buttons
            ui.forms_tabs.toggleFormTabsButtons({enable: true});
            //set draggable to work with main sortable
            formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.sortable');
            /**********************************************************************************/

            form_factory.unbindFormPanelsEvents();
            form_factory.updateFormbuilderDomReferences(formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].ref);
            form_factory.bindFormPanelsEvents();

            //switch to previously active form
            formbuilder.dom.forms_tabs.find('a[data-form-index=' + state.active_form_index + ']').tab('show');

            //activate previous input from dom collection (middle column), if one was active in the previous state
            if (formbuilder.current_input_ref) {
                formbuilder.dom.inputs_collection_sortable
                    .find('div.input[data-input-ref="' + formbuilder.current_input_ref + '"]').addClass('active');

                //show active input properties panel
                formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + formbuilder.current_input_ref + '"]').removeClass('hidden');

                //switch to previously active properties tab
                formbuilder.dom.input_properties_forms_wrapper
                    .find('.nav-tabs .nav-tabs__tab-btn-item a[href="' + state.active_properties_tab + '"]').tab('show');

                //hide message no input was selected
                formbuilder.dom
                    .input_properties_forms_wrapper
                    .find('.input-properties__no-input-selected')
                    .hide();
            }
        }
        self.deferred.resolve();
    }

    if (formbuilder.render_action === consts.RENDER_ACTION_DO) {
        //we are rendering an existing project, so switch dom references to top level form which is shown by default
        formbuilder.current_form_index = 0;
        formbuilder.current_form_ref = formbuilder.project_definition.data.project.forms[0].ref;
        //form_factory.unbindFormPanelsEvents();
        form_factory.updateFormbuilderDomReferences(formbuilder.project_definition.data.project.forms[0].ref);

        //hide add child form button if the form total is MAX_NUMBER_OF_NESTED_CHILD_FORMS
        if (formbuilder.project_definition.data.project.forms.length === consts.MAX_NUMBER_OF_NESTED_CHILD_FORMS) {
            formbuilder.dom.forms_tabs.find('.main__tabs_add-form').parent().hide();
        }

        self.deferred.resolve();
    }
};

module.exports = initFormbuilder;


