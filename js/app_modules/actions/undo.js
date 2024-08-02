/* global Flatted*/
'use strict';
var formbuilder = require('config/formbuilder');
var parse = require('actions/parse');
var consts = require('config/consts');
var ui = require('helpers/ui');
var form_factory = require('factory/form-factory');
var utils = require('helpers/utils');
var push_state_timeout;

var undo = {

    execute: function () {

        //set render action flag so we know we do not have to push a state when we undo (since we are re-using the same functions)
        formbuilder.render_action = consts.RENDER_ACTION_UNDO;

        //show overlay and cursor, on complete execute undo
        formbuilder.dom.overlay.fadeIn(consts.ANIMATION_FAST, function () {

            //if there is only 1 element in state, that is the starting state and it cannot be undone
            if (formbuilder.state.length > 1) {
                formbuilder.state.pop();
            }

            formbuilder.previous_state = window.CircularJSON.parse(window.CircularJSON.stringify(formbuilder.state[formbuilder.state.length - 1]));

            //remove all child tab-panel
            formbuilder.dom.forms_tabs_content.find('.main__tabs-content-tabpanel').not(':first').remove();

            //remove all inputs from top level form
            formbuilder.dom.forms_tabs_content.find('.inputs-collection .sortable .input').remove();

            //remove all properties panels for top level form
            formbuilder.dom.forms_tabs_content.find('.main__tabs-content-tabpanel .input-properties .input-properties__form').remove();

            //remove forms tabs buttons (not the first one)
            formbuilder.dom.forms_tabs.find('.main__tabs__form-btn').not(':first').remove();

            //render previous state
            formbuilder.project_definition = formbuilder.previous_state.project_definition;//todo test for side effect of this assignment

            $.when(parse.renderProject(formbuilder.project_definition)).then(function () {

                //always switch tabs to form of index 0
                //todo

                //hide overlay with a bit of delay
                window.setTimeout(function () {
                    formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST, function () {
                    });
                }, consts.ANIMATION_SLOW);

                //disable undo button if we do not have any more state
                if (formbuilder.state.length === 1) {
                    ui.navbar.toggleUndoBtn(consts.BTN_DISABLED);
                }

                //reset state to register new  user actions
                formbuilder.render_action = consts.RENDER_ACTION_DO;

                //clear possible answers sortable enabled array!
                //to bind the sortable events again
                //it might bind it twice for some elements, but the undo action is not common
                //so it is acceptable in terms of memory usage
                formbuilder.possible_answers.enabled_sortable = [];
            });
        });
    },

    pushState: function (with_throttle) {

        var state = {};

        //push a state only when we are NOT undoing ;)
        if (formbuilder.render_action === consts.RENDER_ACTION_UNDO) {
            return;
        }

        function _doPushState() {
            //console.log('called pushState');
            //push state
            if (formbuilder.state.length >= consts.LIMITS.max_states) {
                formbuilder.state.shift();
            }

            state.project_definition = Flatted.parse(Flatted.stringify(formbuilder.project_definition));
            // state.project_definition = formbuilder.project_definition;
            state.active_input_ref = formbuilder.current_input_ref;
            state.active_form_index = formbuilder.current_form_index;
            state.active_form_ref = formbuilder.current_form_ref;

            state.active_properties_tab = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + state.active_input_ref + '"]')
                .find('.nav-tabs .active a').attr('href');

            if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
                //todo save reference to the nested group that was being edited

                //save the branch that was being edited
                state.active_branch_ref = formbuilder.branch.active_branch_ref;

                //save the group that was being edited
                state.active_group_ref = formbuilder.group.active_group_ref;

                //override input ref reference to get the nested group input that was being edited
                state.active_input_ref = formbuilder.group.current_input_ref;
                state.active_properties_tab = formbuilder.dom.input_properties_forms_wrapper
                    .find('form[data-input-ref="' + state.active_input_ref + '"]')
                    .find('.nav-tabs .active a').attr('href');
            }
            else {
                if (formbuilder.is_editing_branch) {
                    //save the branch that was being edited
                    state.active_branch_ref = formbuilder.branch.active_branch_ref;

                    //save the active branch input (if any)
                    if (formbuilder.branch.current_input_ref) {
                        state.active_branch_input_ref = formbuilder.branch.current_input_ref;
                    }

                    //save branch input active tab if any
                    state.active_properties_tab = formbuilder.dom.input_properties_forms_wrapper
                        .find('form[data-input-ref="' + state.active_branch_input_ref + '"]')
                        .find('.nav-tabs .active a').attr('href');
                }

                if (formbuilder.is_editing_group) {
                    //save the group that was being edited
                    state.active_group_ref = formbuilder.group.active_group_ref;

                    //save the active branch input (if any)
                    if (formbuilder.group.current_input_ref) {
                        state.active_group_input_ref = formbuilder.group.current_input_ref;
                    }

                    //save branch input active tab if any
                    state.active_properties_tab = formbuilder.dom.input_properties_forms_wrapper
                        .find('form[data-input-ref="' + state.active_group_input_ref + '"]')
                        .find('.nav-tabs .active a').attr('href');
                }
            }

            state.was_editing_branch = formbuilder.is_editing_branch;
            state.was_editing_group = formbuilder.is_editing_group;

            formbuilder.state.push(state);

            console.log('current formbuilder state');
            console.log(formbuilder.state);
        }

        //enable undo button the first tije a state is pushed
        if (formbuilder.state.length === 1) {
            ui.navbar.toggleUndoBtn(consts.BTN_ENABLED);
        }

        if (with_throttle) {
            // Throttle requests
            clearTimeout(push_state_timeout);
            push_state_timeout = window.setTimeout(_doPushState, 500);
        }
        else {
            _doPushState();
        }
    }
};

module.exports = undo;
