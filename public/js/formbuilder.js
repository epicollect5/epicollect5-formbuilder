(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
//modules are required using absolute paths in browserify: https://goo.gl/UkccGz
var init = require('config/init');
var extend_natives = require('config/extend-natives');
var load_components = require('loaders/load-components');
var load_project = require('loaders/load-project');

//load project first
$.when(
    load_project()
).then(function () {
    //load partial views for index.html, extend natives, then init app
    $.when(
        load_components(),
        extend_natives())
       .then(init);
});

/*
 Set middle and right panel to the same height of the inputs-collection panel
 Maybe there is a pure css solution (flexbox), but middle column needs to be scrollable though when I add inputs
 For the time being this will do
 */
//var inputs_collection_height = $('.inputs-tools').height();
//$('.main .panel-body').height(inputs_collection_height);


},{"config/extend-natives":25,"config/init":27,"loaders/load-components":57,"loaders/load-project":61}],2:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');


var errors = {

    //hide all properties errors for the current selected input
    hidePropertiesErrors: function (the_properties_panel) {

        var properties_panel = the_properties_panel;

        //remove inline errors
        properties_panel.find('div.input-properties__form__question').removeClass('has-error has-feedback');
        properties_panel.find('div.input-properties__form__question > i').addClass('hidden');
        properties_panel.find('div.input-properties__form__question span.input-properties__form__error').text('');

        //remove visual errors from tabs
        properties_panel.find('.input-properties__tabs .nav-tabs i').addClass('invisible');
        properties_panel.find('.input-properties__tabs .nav-tabs i').parent().removeClass('validation-error');
    },

    hidePossibleAnswersErrors: function (the_input) {

        //todo this function is called 3 times whne validating on keyup, look inot it when there is time
        var input = the_input;
        var possible_answer_list = input.dom.properties_panel.find('.input-properties__form__possible-answers__list');

        $(possible_answer_list).each(function (index, possible_answer) {

            //highlight wrong input and show error message
            $(possible_answer).find('.input-properties__form__possible-answers__list__possible_answer_item')
                .removeClass('has-error has-feedback');

            $(possible_answer).find('.input-properties__form__error')
                .addClass('hidden')
                .text('');//set error description

        });
        //remove visual errors from tabs (if the input is valid, there might be some cuncurrency conditions)
        if (input.dom.is_valid) {
            input.dom.properties_panel.find('.input-properties__tabs .nav-tabs i').addClass('invisible');
            input.dom.properties_panel.find('.input-properties__tabs .nav-tabs i').parent().removeClass('validation-error');
        }
    },

    hideTabButtonsErrors: function () {
        //todo maybe this is not needed
    },

    hideAdvancedPropertiesErrors: function (input, the_properties) {

        var i;
        var properties = the_properties;
        var iLength = properties.length;
        var wrapper = formbuilder.dom
            .input_properties_forms_wrapper
            .find('form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__advanced-properties');


        for (i = 0; i < iLength; i++) {
            wrapper
                .find('div.input-properties__form__advanced-properties__' + properties[i])
                .removeClass('has-error has-feedback');

            wrapper
                .find('div.input-properties__form__advanced-properties__' + properties[i] + ' i')
                .addClass('hidden');

            wrapper
                .find('div.input-properties__form__advanced-properties__' + properties[i] + ' span.input-properties__form__error')
                .addClass('hidden')
                .text('');
        }
    },

    //hide inline errors from jumps (red ouline and error message)
    hideJumpsErrors: function (the_jumps_list) {

        var jump_list = the_jumps_list;
        var jump_properties = ['when', 'answer', 'goto'];

        $(jump_list).each(function (index, jump) {
            $(jump_properties).each(function (index, prop) {
                $(jump)
                    .find('.input-properties__form__jumps__logic--' + prop)
                    .removeClass('has-error')
                    .find('.input-properties__form__error')
                    .addClass('hidden')
                    .text('');
            });
        });
    },

    showQuestionTextErrors: function (the_properties_panel, the_error_message) {

        var properties_panel = the_properties_panel;
        var error = the_error_message;

        //highlight wrong input and show error message
        properties_panel.find('div.input-properties__form__question')
            .addClass('has-error has-feedback');
        properties_panel.find('div.input-properties__form__question i')
            .removeClass('hidden')
            .hide()
            .fadeIn(consts.ANIMATION_FAST);
        properties_panel.find('div.input-properties__form__question span.input-properties__form__error')
            .removeClass('hidden')
            .text(error)//set error description
            .hide()
            .fadeIn(consts.ANIMATION_FAST);

        //show '!' on affected tab, in this case the basic properties tab (first)
        properties_panel.find('.input-properties__tabs .nav-tabs i:first')
            .removeClass('invisible')
            .fadeIn(consts.ANIMATION_FAST);

        //set properties tab text to red
        properties_panel.find('.input-properties__tabs .nav-tabs i:first')
            .parent()
            .addClass('validation-error');


    },

    showFormNameErrors: function (the_modal, the_error_message) {

        var modal = the_modal;
        var error = the_error_message;

        modal.find('.modal-body .input-properties__form__error')
            .removeClass('hidden')
            .text(error)//set error description
            .hide()
            .fadeIn(300);
    },

    hideFormNameErrors: function (the_modal) {

        var modal = the_modal;
        modal.find('.modal-body .input-properties__form__error')
            .addClass('hidden')
            .text('');
    },

    showPossibleAnswerErrors: function (the_possible_answer, the_error_message) {

        var possible_answer = the_possible_answer;
        var properties_panel = possible_answer.parents().eq(9);
        var error = the_error_message;

        //highlight wrong input and show error message
        possible_answer.find('.input-properties__form__possible-answers__list__possible_answer_item')
            .addClass('has-error has-feedback');

        possible_answer.find('.input-properties__form__error')
            .removeClass('hidden')
            .text(error)//set error description
            .hide()
            .fadeIn(300);


        //show '!' on affected tab, in this case the basic properties tab (first)
        properties_panel.find('.input-properties__tabs .nav-tabs i:first')
            .removeClass('invisible')
            .hide()
            .fadeIn(300);

        //set properties tab text to red
        properties_panel.find('.input-properties__tabs .nav-tabs i:first')
            .parent()
            .addClass('validation-error');

    },

    showSingleAdvancedPropertyError: function (the_wrapper, the_property, the_error) {

        var prop = the_property;
        var error = the_error;
        var wrapper = the_wrapper;

        wrapper
            .find('div.input-properties__form__advanced-properties__' + prop).addClass('has-error has-feedback');

        wrapper
            .find('div.input-properties__form__advanced-properties__' + prop + ' i')
            .removeClass('hidden')
            .hide()
            .fadeIn(300);

        wrapper
            .find('div.input-properties__form__advanced-properties__' + prop + ' span.input-properties__form__error')
            .removeClass('hidden')
            .text(error)
            .hide()
            .fadeIn(300);

        //show '!' on affected tab, in this case the advanced properties tab
        wrapper.parent().parent().find('.nav-tabs').find('i.advanced-error')
            .removeClass('invisible')
            .hide()
            .fadeIn(300);

        //set properties tab text to red
        wrapper.parent().parent().find('.nav-tabs').find('i.advanced-error')
            .parent()
            .addClass('validation-error');
    },

    showSingleJumpErrors: function (the_jump_item_wrapper, the_properties) {

        var jump_properties = the_properties;
        var wrapper = the_jump_item_wrapper;
        var ui = require('helpers/ui');

        //jump condition was not selected
        if (jump_properties.when === undefined) {
            wrapper
                .find('.input-properties__form__jumps__logic--when')
                .addClass('has-error')
                .find('.input-properties__form__error')
                .removeClass('hidden')
                .text(messages.error.JUMP_CONDITION_NOT_SELECTED);
        }

        //jump answer not selected
        if (jump_properties.answer_ref === undefined) {
            wrapper
                .find('.input-properties__form__jumps__logic--answer')
                .addClass('has-error ')
                .find('.input-properties__form__error')
                .removeClass('hidden')
                .text(messages.error.JUMP_ANSWER_NOT_SELECTED);
        }

        //jump destination not selected
        if (jump_properties.to === undefined) {
            wrapper
                .find('.input-properties__form__jumps__logic--goto')
                .addClass('has-error ')
                .find('.input-properties__form__error')
                .removeClass('hidden')
                .text(messages.error.JUMP_DESTINATION_NOT_SELECTED);
        }

        //jump destination not valid (after dragging)
        if (!jump_properties.has_valid_destination) {
            wrapper
                .find('.input-properties__form__jumps__logic--goto')
                .addClass('has-error')
                .find('.input-properties__form__error')
                .removeClass('hidden')
                .text(messages.error.JUMP_DESTINATION_NOT_SELECTED);
        }

        console.log(wrapper.parents().eq(5));

        ui.input_properties_panel.showJumpTabError(wrapper);
    },

    showBranchInputsErrors: function (the_properties_panel, the_error_message) {

        var properties_panel = the_properties_panel;
        var error = the_error_message;
        var branch_input_ref = formbuilder.branch.current_input_ref;
        var ui = require('helpers/ui');


        //show error message
        properties_panel.find('.input-properties__form__error--branch-error')
            .removeClass('invisible')
            .text(error);
        //.hide()
        //  .fadeIn(300);

        //toggle icon to warning
        ui.inputs_collection.showInputInvalidIcon(branch_input_ref);
    },

    showGroupInputsErrors: function (the_properties_panel, the_error_message) {

        var properties_panel = the_properties_panel;
        var error = the_error_message;
        var branch_input_ref = formbuilder.branch.current_input_ref;
        var ui = require('helpers/ui');


        //show error message
        properties_panel.find('.input-properties__form__error--group-error')
            .removeClass('invisible')
            .text(error);
        // .hide()
        //.fadeIn(300);

        //toggle icon to warning
        ui.inputs_collection.showInputInvalidIcon(branch_input_ref);
    },

    hideBranchInputsErrors: function (the_properties_panel) {
        //show error message
        the_properties_panel.find('.input-properties__form__error--branch-error')
            .addClass('invisible')
            .text('&nbsp;');
    },

    hideGroupInputsErrors: function (the_properties_panel) {
        //show error message
        the_properties_panel.find('.input-properties__form__error--group-error')
            .addClass('invisible')
            .text('&nbsp;');
    }
};

module.exports = errors;

},{"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/ui":36}],3:[function(require,module,exports){
/* global CircularJSON*/
'use strict';
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');
var consts = require('config/consts');
var template = require('template');
var input_factory = require('factory/input-factory');

var copy = {

    pushInput: function (input) {

        var branch_inputs;
        var group_inputs;

        //remove jumps (they would be invalid when copied, so not worthy)
        input.jumps = [];

        //also, do not copy the title, set it as false (as we might go over the 3 title limits)
        input.is_title = false;

        //add input to collection as the last one
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {

            var branch_index = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);
            var nested_group_index = utils.getBranchInputCurrentIndexByRef(branch_index, formbuilder.group.active_group_ref);

            //push nested group input
            formbuilder.project_definition.data.project
                .forms[formbuilder.current_form_index]
                .inputs[branch_index]
                .branch[nested_group_index]
                .group.push(input);
        }
        else {

            if (!formbuilder.is_editing_branch && !formbuilder.is_editing_group) {
                //push top level input
                formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs.push(input);
            }

            if (formbuilder.is_editing_branch) {
                branch_inputs = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref).branch;
                //push branch input
                branch_inputs.push(input);
            }

            if (formbuilder.is_editing_group) {
                group_inputs = utils.getInputObjectByRef(formbuilder.group.active_group_ref).group;
                //push group input
                group_inputs.push(input);
            }
        }
    },

    appendInputToDom: function (input) {

        var self = this;
        var input_html = self.createInputHTML(input);
        var active_branch_sortable;
        var active_group_sortable;

        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {

            //console.log('active group ref = ' + formbuilder.group.active_group_ref);
            //console.log('active branch ref = ' + formbuilder.branch.active_branch_ref);

            //todo
            //get active group sortable
            active_group_sortable = formbuilder.dom.inputs_collection_sortable
                .find('div.input[data-input-ref="' + formbuilder.group.active_group_ref + '"]')
                .find('.group-sortable');

            //append markup to group sortable
            active_group_sortable.append(input_html.collection);
        }
        else {
            if (!formbuilder.is_editing_branch && !formbuilder.is_editing_group) {
                //append to top level sortable
                formbuilder.dom.inputs_collection_sortable.append(input_html.collection);
            }

            if (formbuilder.is_editing_branch) {

                //get active branch sortable
                active_branch_sortable = formbuilder.dom.inputs_collection_sortable
                    .find('div.input[data-input-ref="' + formbuilder.branch.active_branch_ref + '"]')
                    .find('.branch-sortable');

                //append markup to bracnh sortable
                active_branch_sortable.append(input_html.collection);
            }

            if (formbuilder.is_editing_group) {

                //get active group sortable
                active_group_sortable = formbuilder.dom.inputs_collection_sortable
                    .find('div.input[data-input-ref="' + formbuilder.group.active_group_ref + '"]')
                    .find('.group-sortable');

                //append markup to group sortable
                active_group_sortable.append(input_html.collection);
            }
        }

        //append panels
        formbuilder.dom.input_properties_forms_wrapper.append(input_html.panels);
    },

    createInputHTML: function (input) {

        var parse = require('actions/parse');
        var input_factory = require('factory/input-factory');
        var form_index = formbuilder.current_form_index;
        var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;
        //create html element for input collection (middle column)
        var input_collection_html = input_factory.createInputToolHTML(input);
        var properties_panel_html;
        var input_properties_panel_html = '';


        //if it is a branch, loop all the branch inputs (there must be at least a branch input)
        if (input.type === consts.BRANCH_TYPE) {
            //todo check the secons arg of getBranchInputsHTML, I had to pass `inputs.length - 1`
            var branch_inputs_html = parse.getBranchInputsHTML(input, inputs.length - 1);
            input_collection_html = input_collection_html.replace('{{branch-content}}', branch_inputs_html.collection);
            //todo check where the string replacement happens
            input_properties_panel_html += branch_inputs_html.panels;
        }

        //if it is a group, loop all the group inputs (there must be at least a group input)
        if (input.type === consts.GROUP_TYPE) {

            var group_inputs_html = parse.getGroupInputsHTML(input, inputs.length - 1, null);
            input_collection_html = input_collection_html.replace('{{group-content}}', group_inputs_html.collection);
            //todo check where the string replacement happens
            input_properties_panel_html += group_inputs_html.panels;
        }


        //create properties panel for current input
        properties_panel_html = template.getInputPropertiesPanelHTML(input);

        /* Add the group or branch inputs panels markup (if any)
         The panels are not attached in the right order in the dom but it does not matter,
         as only one is shown at a time
         */
        input_properties_panel_html += properties_panel_html;

        return {
            collection: input_collection_html,
            panels: input_properties_panel_html
        };
    },

    createPossibleAnswersCopy: function (possible_answers) {

        var possible_answers_copy = [];

        $.each(possible_answers, function (index, possible_answer) {
            possible_answers_copy[index] = {};
            possible_answers_copy[index].answer = possible_answer.answer;
            possible_answers_copy[index].answer_ref = utils.generateUniqID();
        });

        return possible_answers_copy;
    },

    createInputCopy: function (input) {

        var input_factory = require('factory/input-factory');
        var self = this;
        var input_copied_ref = utils.generateInputCopyRef();
        var input_copied = input_factory.createInput(input.type, input_copied_ref);
        var ref_map =[];

        //set input copy properties to original input properties
        // (only the one saved in the project definition, leave the others intact,
        // and DO NOT copy the ref!)
        for (var property in input_copied) {
            if (input.hasOwnProperty(property) && property !== 'ref') {

                /* Important: branch/group is an array, so perform deep copy
                 * using JSON.parse(JSON.stringify(obj));
                 *
                 * This is because array.slice does not perform a deep copy on anything nested, just on a plain array
                 * and $.extend(true, [], oldArray) was not working
                 * */
                switch (property) {
                    case consts.BRANCH_TYPE:
                        input_copied.branch = CircularJSON.parse(CircularJSON.stringify(input.branch));
                        break;
                    case consts.GROUP_TYPE:
                        input_copied.group = CircularJSON.parse(CircularJSON.stringify(input.group));
                        break;
                    default:
                        input_copied[property] = input[property];
                }
            }
        }

        //branch
        ref_map = self.createBranchCopy(input_copied.ref, input_copied.branch, input);

        //a top level group:
        self.createGroupCopy(input_copied.ref, input_copied.group, input);

        //override possible answers "answer_ref" on copied top level input (on multiple answers type only)
        if ($.inArray(input_copied.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
            input_copied.possible_answers = self.createPossibleAnswersCopy(input_copied.possible_answers);

            //todo check what the default property is set to, whether null or empty string
            if (!(input.default === '' || input.default === null)) {
                //there is a default value to remap!
                input_copied.default = self.getDefaultValueFromInputCopy(input, input_copied);
            }
        }

        //clear jumps for top level input (when not a branch!)
        if(input_copied.type === consts.BRANCH_TYPE) {
            //update jumps for all the branch inputs
            self.updateBranchJumps(input_copied.branch, ref_map);
        }
        else {
            input_copied.jumps = [];
        }

        return input_copied;
    },

    updateBranchJumps: function(branch, ref_map) {

        //to store the new jumps
        var updated_jumps;
        var self = this;

        $(branch).each(function (branch_index, branch_input) {

            updated_jumps =[];

            if(branch_input.jumps.length > 0) {

                $(branch_input.jumps).each(function(ji, jump){

                    if ($.inArray(branch_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                        //update the jump references
                        updated_jumps.push({
                            when: jump.when,
                            to: self.getJumpToValueFromRefMap(ref_map, jump.to),
                            answer_ref: ref_map[branch_index].answer_refs[jump.answer_ref]
                        });
                    }
                    else {
                        //update the jump references
                        updated_jumps.push({
                            when: jump.when,
                            to: self.getJumpToValueFromRefMap(ref_map, jump.to),
                            answer_ref: null
                        });
                    }
                });
            }
            //replace jumps with updated ones
            branch_input.jumps = updated_jumps;
        });
    },

    createGroupCopy: function (ref, group, input){

        var group_copy =[];

        $(group).each(function (group_input_index, group_input) {

            var  group_answer_ref_map = {};

            group_copy[group_input_index] = group_input;
            group_copy[group_input_index].ref = utils.generateBranchGroupInputRef(ref);

            //override any "answer_ref"
            if ($.inArray(group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {

                var group_input_possible_answers_copy = [];

                $.each(group_input.possible_answers, function (index, possible_answer) {

                    var new_answer_ref = utils.generateUniqID();

                    group_input_possible_answers_copy[index] = {};
                    group_input_possible_answers_copy[index].answer = possible_answer.answer;
                    group_input_possible_answers_copy[index].answer_ref = new_answer_ref;

                    group_answer_ref_map[possible_answer.answer_ref] = new_answer_ref;
                });

                //override possible answers for this branch input
                group_input.possible_answers = group_input_possible_answers_copy;

                //remap default value to new answer_ref
                if (!(group_input.default === '' || group_input.default === null)) {
                    //there is a default value to remap!
                    if ($.inArray(group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                        group_input.default = group_answer_ref_map[input.group[group_input_index].default];
                    }
                    else {
                        //do nothing
                    }
                }
            }
        });
    },

    createBranchCopy: function(ref, branch, input){

        var branch_copy =[];
        var branch_input_possible_answers_copy;
        var ref_map = [];
        var branch_input_jumps_copy;
        var answer_ref_map;
        var new_answer_refs;
        var nested_group_copy = [];
        var nested_group_input_possible_answers_copy;

        $(branch).each(function (branch_index, branch_input) {

            branch_copy[branch_index] = branch_input;
            branch_copy[branch_index].ref = utils.generateBranchGroupInputRef(ref);

            ref_map[branch_index] = {
                jumps: branch_input.jumps,
                answer_refs: {}
            };

            //map old - new input ref
            ref_map[branch_index].old_ref = input.branch[branch_index].ref;
            ref_map[branch_index].new_ref = branch_copy[branch_index].ref;

            //override any "answer_ref" and update jumps
            //todo all the jumps, there is the jump always as well!!!!!
            if ($.inArray(branch_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {

                branch_input_possible_answers_copy = [];
                branch_input_jumps_copy = [];
                answer_ref_map = {};

                $.each(branch_input.possible_answers, function (index, possible_answer) {

                    //build a map to update jumps references
                    var new_answer_ref = utils.generateUniqID();
                    answer_ref_map[possible_answer.answer_ref] = new_answer_ref;

                    //override
                    branch_input_possible_answers_copy[index] = {};
                    branch_input_possible_answers_copy[index].answer = possible_answer.answer;
                    branch_input_possible_answers_copy[index].answer_ref = new_answer_ref
                });

                //override possible answers for this branch input
                branch_input.possible_answers = branch_input_possible_answers_copy;

                new_answer_refs = answer_ref_map;
            }
            else {
                new_answer_refs = null;
            }

            //add answer_refs map to jumps map
            ref_map[branch_index].answer_refs = new_answer_refs;

            //remap default value to new answer_ref
            if (!(branch_input.default === '' || branch_input.default === null)) {
                //there is a default value to remap!
                if ($.inArray(branch_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                    branch_input.default = new_answer_refs[branch_input.default];
                }
            }

            //a group within a branch:

            $(branch_input.group).each(function (nested_group_input_index, nested_group_input) {

                var  group_input_answer_ref_map = {};

                nested_group_copy[nested_group_input_index] = nested_group_input;
                nested_group_copy[nested_group_input_index].ref = utils.generateBranchGroupInputRef(branch[branch_index].ref);

                if ($.inArray(nested_group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {

                    nested_group_input_possible_answers_copy = [];

                    $.each(nested_group_input.possible_answers, function (index, possible_answer) {

                        var new_answer_ref = utils.generateUniqID();

                        //override
                        nested_group_input_possible_answers_copy[index] = {};
                        nested_group_input_possible_answers_copy[index].answer = possible_answer.answer;
                        nested_group_input_possible_answers_copy[index].answer_ref = new_answer_ref;

                        group_input_answer_ref_map[possible_answer.answer_ref] = new_answer_ref;
                    });

                    //override possible answers for this branch input
                    nested_group_input.possible_answers = nested_group_input_possible_answers_copy;

                    //remap default value to new answer_ref
                    if (!(nested_group_input.default === '' || nested_group_input.default === null)) {
                        //there is a default value to remap!
                        if ($.inArray(nested_group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                            nested_group_input.default = group_input_answer_ref_map[branch_input.group[nested_group_input_index].default];
                        }
                    }
                }
            });
        });

        return ref_map;
    },

    getDefaultValueFromInputCopy: function (original, copy) {

        var original_default_answer_ref_index = -1;

        $(original.possible_answers).each(function (index, possible_answer) {
            if (possible_answer.answer_ref === original.default) {
                original_default_answer_ref_index = index;
            }
        });

        return copy.possible_answers[original_default_answer_ref_index].answer_ref;

    },

    getJumpToValueFromRefMap: function(ref_map, to){

        var jump_to = null;

        //if to id "END", just return it
        if(to === consts.JUMP_TO_END_OF_FORM_REF) {
            jump_to = consts.JUMP_TO_END_OF_FORM_REF;
        }
        else {
            //otherwise return the new ref
            $(ref_map).each(function (index, map) {
                if (map.old_ref === to) {
                    jump_to = map.new_ref;
                    return false;
                }
            });
        }

        return jump_to
    }
};

module.exports = copy;

},{"actions/parse":5,"config/consts":24,"config/formbuilder":26,"factory/input-factory":31,"helpers/utils":37,"template":62}],4:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var jumps = {

    addJump: function (the_input) {

        var input = the_input;
        var jumps_list_wrapper = formbuilder.dom.input_properties_forms_wrapper
            .find('form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__jumps .input-properties__form__jumps__list');
        var html = '';
        var jump_index = input.jumps.length;

        //if the number of jumps is already equal to the number of possible answers, do not add jump
        //Do this check only for multiple answers inputs, as single answer inputs do have zero possible_answers at all times.
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) > -1) {
            if (input.jumps.length >= input.possible_answers.length) {
                return;
            }
        }

        //if jumps, remove 'no jumps set' item
        jumps_list_wrapper.parent().find('.input-properties__form__jumps__no-jumps-message').addClass('hidden');

        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) === -1) {
            //append a jump with condition disabled and set to 'always' jump
            //we do this because on EC5 when the question is an open answer, a jump will always jump no matter the answer given
            // jumps_list_wrapper.append();

            html += formbuilder.dom.partials.jump_list_item_always_jump;
        }
        else {
            //jumps get full functionality with multiple answers input types
            html += formbuilder.dom.partials.jump_list_item;
        }

        html = html.replace(/{{input-ref-logic-when}}/g, jump_index + '-' + input.ref + '-logic-when');
        html = html.replace(/{{input-ref-logic-answer}}/g, jump_index + '-' + input.ref + '-logic-answer');
        html = html.replace(/{{input-ref-logic-goto}}/g, jump_index + '-' + input.ref + '-logic-goto');

        jumps_list_wrapper.append(html);

        //add empty jump to input
        input.jumps.push({});

        //show jump icon in input tool
        //todo
        formbuilder.dom.inputs_collection.find('.input[data-input-ref="' + input.ref + '"]');
        formbuilder.dom.inputs_collection.find('.input[data-input-ref="' + input.ref + '"] .input-inner');
        formbuilder.dom.inputs_collection.find('.input[data-input-ref="' + input.ref + '"] .input-inner .jump-state').removeClass('invisible');

    },

    removeJump: function (the_current_input, the_remove_btn) {

        var input = the_current_input;
        var jump_item = the_remove_btn.parent();
        var jump_list = jump_item.parent();
        // jump index starts from 1, as index 0 is 'no jumps yet' placeholder, wrapped in a <li> tag
        var jump_index = jump_item.index();

        //remove selected from dom
        jump_item.remove();

        //remove from memory
        input.jumps.splice((jump_index - 1), 1);

        //if no jumps, show message
        if (jump_list.find('li').length === 0) {
            //if no jumps yet, remove 'no jumps set' item
            jump_list.parent().find('.input-properties__form__jumps__no-jumps-message').removeClass('hidden');

            //hide jumps icon from input tool
            //todo
            formbuilder.dom.inputs_collection.find('.input[data-input-ref="' + input.ref + '"] .input-inner .jump-state').addClass('invisible');
        }
    },

    listJumpPossibleAnswers: function (the_select, the_input) {

        var focused_select = the_select;
        var input = the_input;
        var html = '';

        //trigger a save in case the user typed in a possibile answer and switched directly to the jump tab
        input.savePossibleAnswers();

        focused_select.empty();
        $(input.possible_answers).each(function (index, possible_answer) {
            html += '<option value="';
            html += possible_answer.answer_ref + '">';
            html += possible_answer.answer.trunc(50);
            html += '</option>';
        });
        focused_select.append(html);
    },

    //list jump consitions (is, is not etc...)
    listJumpConditions: function (the_select) {

        var focused_select = the_select;
        var possible_conditions = consts.JUMP_CONDITIONS;
        var html = '';

        focused_select.empty();
        $(possible_conditions).each(function (i) {

            html += '<option value="';
            html += this.key + '">';
            html += this.text;
            html += '</option>';
        });
        focused_select.append(html);
    },

    //dynamically show a list of possible destination for a jump
    listJumpDestinations: function (the_select, the_jump_destinations) {

        var focused_select = the_select;
        var jump_destinations = the_jump_destinations;

        /*
         jumps can go only forward, possible jumps destinations are index of current input +1,
         as it not possible to jump to an adjacent input
         */
        focused_select.empty();
        $(jump_destinations).each(function (index, destination) {

            var question;
            var purifiedReadme = '';

            if (destination.question === '') {
                if (destination.type === consts.BRANCH_TYPE) {
                    question = messages.error.NO_BRANCH_HEADER_YET;
                }
                else {
                    question = messages.error.NO_QUESTION_TEXT_YET;
                }
            }
            else {
                if (destination.type === consts.README_TYPE) {
                    //strip all tags for preview within select
                    purifiedReadme = utils.decodeHtml(destination.question);
                    purifiedReadme = utils.stripTags(purifiedReadme);
                    question = purifiedReadme.trunc(50);
                }
                else {
                    question = destination.question.trunc(50);
                }
            }
            focused_select.append('<option value="' + destination.ref + '">' + question + ' </option>');
        });
    },

    ////if any jump, refresh the jumps selected destination label as it might have changed
    refreshInputJumpsDom: function (input, inputs) {

        var selected_destinations = formbuilder.dom.input_properties_forms_wrapper
            .find('form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__jumps__logic--goto select option:selected');
        var purifiedReadme = '';

        var available_destinations = utils.getJumpAvailableDestinations(input, inputs);

        //loop each jump
        $(input.jumps).each(function (jumpIndex, jump) {

            //find the destination "question" and update the text shown in the dropdown "go to"
            $(available_destinations).each(function (destinationIndex, destination) {

                if (jump.to === destination.ref) {
                    if (destination.type === consts.README_TYPE) {
                        //strip all tags for preview within select
                        purifiedReadme = utils.decodeHtml(destination.question);
                        purifiedReadme = utils.stripTags(purifiedReadme);
                        $(selected_destinations[jumpIndex]).text(purifiedReadme.trunc(50));
                    }
                    else {
                        $(selected_destinations[jumpIndex]).text(destination.question);
                    }
                    return false;
                }
            });
        });
    }
};

module.exports = jumps;

},{"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/utils":37}],5:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var input_factory = require('factory/input-factory');
var Input = require('factory/input-prototype');
var form_factory = require('factory/form-factory');
var template = require('template');
var validation = require('actions/validation');
var methods = {
    getBranchInputsHTML: require('actions/parse/methods/getBranchInputsHTML'),
    getGroupInputsHTML: require('actions/parse/methods/getGroupInputsHTML'),
    renderInputs: require('actions/parse/methods/renderInputs'),
    renderProject: require('actions/parse/methods/renderProject'),
    renderChildForms: require('actions/parse/methods/renderChildForms'),
    initFormbuilder: require('actions/parse/methods/initFormbuilder')
};

var parse = {

    action: '',

    renderInputs: function (the_inputs) {
        return methods.renderInputs(the_inputs);
    },

    getBranchInputsHTML: function (the_input, the_index) {
        return methods.getBranchInputsHTML(the_input, the_index);
    },
    //branch index is set when it is a nested group only
    getGroupInputsHTML: function (the_input, the_index, the_branch_index) {
        return methods.getGroupInputsHTML(the_input, the_index, the_branch_index);
    },

    renderProject: function (project_definition, action) {
        return methods.renderProject(project_definition, action);
    },

    initFormbuilder: function () {
        return methods.initFormbuilder();
    },

    //render children forms recursively
    renderChildForm: function (the_child_forms) {
        return methods.renderChildForms(the_child_forms);
    }
};

module.exports = parse;


},{"actions/parse/methods/getBranchInputsHTML":6,"actions/parse/methods/getGroupInputsHTML":7,"actions/parse/methods/initFormbuilder":8,"actions/parse/methods/renderChildForms":9,"actions/parse/methods/renderInputs":10,"actions/parse/methods/renderProject":11,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/form-factory":30,"factory/input-factory":31,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37,"template":62}],6:[function(require,module,exports){
'use strict';
var ui = require('helpers/ui');
var formbuilder = require('config/formbuilder');
var template = require('template');
var consts = require('config/consts');

var getBranchInputsHTML = function (the_input, the_index) {

    var input_factory = require('factory/input-factory');
    var self = this;
    var input = the_input;
    var index = the_index;
    var branch_properties;
    var html;
    var branch_sortable_html = ui.inputs_collection.getEmptyCollectionSortableHTML(consts.BRANCH_TYPE);
    var branch_input_collection_html = '';
    var branch_properties_panel_html = '';
    var properties_panel_html = '';

    formbuilder.current_input_ref = input.ref;

    //if no branch inputs, show "no branch inputs message"

    $.each(input.branch, function (branch_index, branch_input) {

        //create html branch element for input collection (middle column)
        html = input_factory.createInputToolHTML(branch_input);
        branch_input_collection_html += html;

        //copy input properties from stored branch input
        branch_properties = JSON.parse(JSON.stringify(branch_input));

        //generate new branch input with attached prototype
        branch_input = input_factory.createInput(branch_properties.type, branch_properties.ref);

        //set branch input properties to stored properties (only the one saved in the project definition, leave the others intact)
        for (var property in branch_input) {
            if (branch_properties.hasOwnProperty(property)) {
                branch_input[property] = branch_properties[property];
            }
        }
        //set branch input as valid, as by default it is generated as invalid
        branch_input.dom.is_valid = true;

        //override 'global' branch input obj literal with newly created
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[index].branch[branch_index] = branch_input;

        //if it is a group, loop all the nesyed group inputs (there must be at least a group input)
        if (branch_input.type === consts.GROUP_TYPE) {

            formbuilder.is_editing_group = true;

            //pass in branch_index as this is a nested group
            var nested_group_inputs_html = self.getGroupInputsHTML(branch_input, index, branch_index);
            branch_input_collection_html = branch_input_collection_html.replace('{{group-content}}', nested_group_inputs_html.collection);
            branch_properties_panel_html += nested_group_inputs_html.panels;

            formbuilder.is_editing_group = false;
        }

        //per each branch input with possible answers keep track of pagination
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(branch_input.type) > -1) {
            //we have possible answers
            formbuilder.possible_answers_pagination[branch_input.ref] = {};
            formbuilder.possible_answers_pagination[branch_input.ref].page = 1;
        }

        //get properties panel for branch input
        properties_panel_html = template.getInputPropertiesPanelHTML(branch_input);
        branch_properties_panel_html += properties_panel_html;

    });

    branch_sortable_html = branch_sortable_html.replace('{{branch-inputs}}', branch_input_collection_html);

    return {
        collection: branch_sortable_html,
        panels: branch_properties_panel_html
    };
};

module.exports = getBranchInputsHTML;

},{"config/consts":24,"config/formbuilder":26,"factory/input-factory":31,"helpers/ui":36,"template":62}],7:[function(require,module,exports){
'use strict';
var ui = require('helpers/ui');
var formbuilder = require('config/formbuilder');
var template = require('template');
var consts = require('config/consts');

var getGroupsInputsHTML = function (the_input, the_index, the_branch_index) {

    var input_factory = require('factory/input-factory');
    var input = the_input;
    var index = the_index;
    var branch_index = the_branch_index;
    var group_properties;
    var html;
    var group_sortable_html = ui.inputs_collection.getEmptyCollectionSortableHTML(consts.GROUP_TYPE);
    var group_input_collection_html = '';
    var properties_panel_html = '';
    var group_properties_panel_html = '';

    formbuilder.current_input_ref = input.ref;

    $.each(input.group, function (group_index, group_input) {

        //create html group element for input collection (middle column)
        html = input_factory.createInputToolHTML(group_input);
        group_input_collection_html += html;

        //copy input properties from stored group input
        group_properties = JSON.parse(JSON.stringify(group_input));

        //generate new group input with attached prototype
        group_input = input_factory.createInput(group_properties.type, group_properties.ref);

        //set group input properties to stored properties (only the one saved in the project definition, leave the others intact)
        for (var property in group_input) {
            if (group_properties.hasOwnProperty(property)) {
                group_input[property] = group_properties[property];
            }
        }

        //set group input as valid, as by default it is generated as invalid
        group_input.dom.is_valid = true;

        //override 'global' group input obj literal with newly created
        if (branch_index === null) {
            //this is a first level group
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[index].group[group_index] = group_input;
        }
        else {
            //this is a nested group
            formbuilder.project_definition.data.project
                .forms[formbuilder.current_form_index]
                .inputs[index]
                .branch[branch_index]
                .group[group_index] = group_input;
        }

        //per each group input with possible answers keep track of pagination
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(group_input.type) > -1) {
            //we have possible answers
            formbuilder.possible_answers_pagination[group_input.ref] = {};
            formbuilder.possible_answers_pagination[group_input.ref].page = 1;
        }

        properties_panel_html = template.getInputPropertiesPanelHTML(group_input);
        group_properties_panel_html += properties_panel_html;
    });

    group_sortable_html = group_sortable_html.replace('{{group-inputs}}', group_input_collection_html);

    return {
        collection: group_sortable_html,
        panels: group_properties_panel_html
    };
};

module.exports = getGroupsInputsHTML;

},{"config/consts":24,"config/formbuilder":26,"factory/input-factory":31,"helpers/ui":36,"template":62}],8:[function(require,module,exports){
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



},{"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/form-factory":30,"factory/input-factory":31,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37,"template":62,"ui-handlers/event-handler-callbacks/input-collection-branch-sortable-mousedown-callback":84}],9:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var input_factory = require('factory/input-factory');
var Input = require('factory/input-prototype');
var form_factory = require('factory/form-factory');
var template = require('template');

var renderChildForms = function (the_child_forms) {

    var child_forms = the_child_forms;
    var child_form = child_forms.shift();
    var child_inputs;
    var self = this;

    formbuilder.current_form_index++;

    //render child form
    $.when(form_factory.createChildForm(child_form.name, child_form.ref, formbuilder.current_form_index, false)).then(function () {

        //append inputs and their properties panels
        child_inputs = self.renderInputs(child_form.inputs);
        //replace object literal inputs with newly generated ones via factory (i.e. using new) so they get the prototype
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs = child_inputs.slice();

        //remove no questions message
        formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').addClass('hidden');

        //hide properties panel buttons as no input is selected
        formbuilder.dom.input_properties_buttons.fadeOut();

        //render next child form recursively
        if (child_forms.length > 0) {
            self.renderChildForms(child_forms);
        }
        else {
            self.initFormbuilder();
        }
    });

};

module.exports = renderChildForms;

},{"config/consts":24,"config/formbuilder":26,"factory/form-factory":30,"factory/input-factory":31,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37,"template":62}],10:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var template = require('template');

var renderInputs = function (the_inputs) {

    var self = this;
    var inputs = the_inputs;
    var html;
    var properties;
    var properties_panel_html;
    var generated_inputs = [];
    var input_collection_html = '';
    var input_properties_panel_html = '';


    $.each(inputs, function (index, input) {

        var input_factory = require('factory/input-factory');

        ///**
        // * Loop all jumps to remove any "has_valid_destination" property
        // * this was caused by a bug so a few projects have it.
        // * Instead of hacking the db, we sanitise that here
        // * so the next time they save the project is ok
        // */
        //$(input.jumps).each(function(jumpIndex, jump){
        //    delete jump.has_valid_destination;
        //});

        //create html element for input collection (middle column)
        html = input_factory.createInputToolHTML(input);
        input_collection_html += html;

        //copy input properties from stored input
        properties = JSON.parse(JSON.stringify(input));

        //generate new input with attached prototype
        input = input_factory.createInput(properties.type, properties.ref);

        //on load (when loading an existing project)
        if (formbuilder.render_action === consts.RENDER_ACTION_DO) {
            console.log('render on load');
            //set input as valid, as it is generated as invalid by default
            input.dom.is_valid = true;
        }

        //set input properties to stored input properties (only the one saved in the project definition, leave the others intact)
        for (var property in input) {
            if (properties.hasOwnProperty(property)) {
                input[property] = properties[property];
            }
        }

        //override 'global' input obj literal with newly created
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[index] = input;

        //if it is a branch, loop all the branch inputs (there must be at least a branch input)
        if (input.type === consts.BRANCH_TYPE) {

            //set edit branch to true when rendering from a saved project,
            //because we are re-using functions that expects this flag to be true
            formbuilder.is_editing_branch = true;
            formbuilder.branch.active_branch_header = input.question;
            formbuilder.branch.active_branch_ref = input.ref;

            var branch_inputs_html = self.getBranchInputsHTML(input, index);
            input_collection_html = input_collection_html.replace('{{branch-content}}', branch_inputs_html.collection);
            input_properties_panel_html += branch_inputs_html.panels;

            //reset edit branch flag
            formbuilder.is_editing_branch = false;
            formbuilder.branch.active_branch_ref = null;
            formbuilder.branch.active_branch_ref = null;
        }

        //if it is a group, loop all the group inputs (there must be at least a group input)
        if (input.type === consts.GROUP_TYPE) {

            formbuilder.is_editing_group = true;
            //todo should I set active group header and active group ref?
            //todo maybe because I do nit have jumps in groups?

            var group_inputs_html = self.getGroupInputsHTML(input, index, null);
            input_collection_html = input_collection_html.replace('{{group-content}}', group_inputs_html.collection);
            input_properties_panel_html += group_inputs_html.panels;

            formbuilder.is_editing_group = false;
        }

        //per each input with possible answers keep track of pagination
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) > -1) {
            //we have possible answers
            formbuilder.possible_answers_pagination[input.ref] = {};
            formbuilder.possible_answers_pagination[input.ref].page = 1;
        }
        //create properties panel for current input
        properties_panel_html = template.getInputPropertiesPanelHTML(input);
        input_properties_panel_html += properties_panel_html;

        //hide panels as by default no inputs are selected
        formbuilder.dom.input_properties.find('.panel-body form').hide();

        //save newly generated input
        generated_inputs.push(input);
    });

    formbuilder.dom.inputs_collection_sortable.append(input_collection_html);
    formbuilder.dom.input_properties_forms_wrapper.append(input_properties_panel_html);

    return generated_inputs;
};

module.exports = renderInputs;

},{"config/consts":24,"config/formbuilder":26,"factory/input-factory":31,"template":62}],11:[function(require,module,exports){
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

var renderProject = function (project_definition) {

    var self = this;
    var forms = project_definition.data.project.forms.slice();//need a deep copy
    var inputs;

    self.deferred = new $.Deferred();

    //if undoing, reset formbuilder on top parent form
    if (formbuilder.render_action === consts.RENDER_ACTION_UNDO) {
        console.log('resetting references to top parent form');
        form_factory.updateFormbuilderDomReferences(forms[0].ref);
    }

    //render top parent form by default as the formbuilder loads.
    formbuilder.current_form_index = 0;
    inputs = self.renderInputs(forms[0].inputs);

    //remove no questions message (if any inputs)
    if (inputs.length > 0) {
        formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').addClass('hidden');
    }

    //show no title warning (if no title set for the first form and we have inputs)
    if (utils.getTitleCount(inputs) === 0 && inputs.length > 0) {
        ui.inputs_collection.toggleTitleWarning(0, false);
    }

    //toggle form icon to a green chck if the top parent form is valid
    if (validation.areFormInputsValid(0)) {
        ui.forms_tabs.showFormValidIcon(0);

        //enable download form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').removeClass('disabled');

        //enable print as pdf form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').removeClass('disabled');
    }

    //if no inputs, disable download form button
    if (inputs.length === 0) {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').addClass('disabled');

        //disable print as pdf
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').addClass('disabled');
    }
    else {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').removeClass('disabled');

        //enable print as pdf form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').removeClass('disabled');
    }

    //replace object literal inputs with newly generated ones via factory (i.e. using new) so they get the prototype
    formbuilder.project_definition.data.project.forms[0].inputs = inputs.slice();

    //remove first form as it is already rendered
    forms.shift();

    //render child forms recursively (if any)
    if (forms.length > 0) {
        self.renderChildForms(forms);
    }
    else {
        self.initFormbuilder();
    }

    return self.deferred.promise();
};

module.exports = renderProject;

},{"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/form-factory":30,"factory/input-factory":31,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37,"template":62}],12:[function(require,module,exports){
/* global $, toastr, Papa*/
'use strict';
var formbuilder = require('config/formbuilder');
var toast = require('config/toast');
var consts = require('config/consts');
var messages = require('config/messages');
var getPossibleAnswerPage = require('template/methods/getPossibleAnswersPage');

var possible_answers_pager = {

    init: function (input) {

        var self = this;
        var pager = formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.possible-answers__list_pager');
        var page = formbuilder.possible_answers_pagination[input.ref].page;
        var total = Math.ceil(input.possible_answers.length / consts.LIMITS.possible_answers_per_page);

        pager.removeClass('hidden');
        pager.find('.possible-answers__list_pager__current')
            .html(page);
        pager.find('.possible-answers__list_pager__total')
            .html(total);

        //attach handlers to pagination buttons
        var prev_btn = pager.find('.possible-answers__list_pager__prev');
        var next_btn = pager.find('.possible-answers__list_pager__next');

        //when the pager is shown, set min-height on parent container
        formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__possible-answers__list')
            .parent().css('min-height', '325px');

        var was_clicked = false;
        next_btn.off().on('click', function () {

            console.log('next button clicked');
            var next_page;

            //validate answers currently in the dom
            //if any error, warn user instead of changing page
            //so the user has the chance to fix them
            if (!self.areValidPossibleAnswersInDOM(input)) {
                //show error
                toast.showError(messages.error.POSSIBLE_ANSWERS_INVALID);
                return false;
            }

            if (!was_clicked) {
                was_clicked = true;

                //save possible answers currently on the dom
                input.savePossibleAnswers();

                if (formbuilder.possible_answers_pagination[input.ref].page < total) {
                    //show next possible answers page in dom
                    next_page = formbuilder.possible_answers_pagination[input.ref].page + 1;
                    formbuilder.possible_answers_pagination[input.ref].page = next_page;

                    getPossibleAnswerPage(input, next_page);

                    //update dom with current page
                    pager.find('.possible-answers__list_pager__current')
                        .html(next_page);

                    //restore button functionality
                    window.setTimeout(function () {
                        was_clicked = false;
                    }, consts.ANIMATION_SLOW)
                }
                else {
                    was_clicked = false;
                }
            }
        });

        prev_btn.off().on('click', function () {
            console.log('prev button clicked');
            //show next possible answers page in dom
            var prev_page;

            if (!self.areValidPossibleAnswersInDOM(input)) {
                //show error
                toast.showError(messages.error.POSSIBLE_ANSWERS_INVALID);
                return false;
            }

            if (!was_clicked) {
                was_clicked = true;

                //save possible answers currently on the dom
                input.savePossibleAnswers();

                if (formbuilder.possible_answers_pagination[input.ref].page > 1) {
                    prev_page = formbuilder.possible_answers_pagination[input.ref].page - 1;
                    formbuilder.possible_answers_pagination[input.ref].page = prev_page;

                    getPossibleAnswerPage(input, prev_page);

                    //update dom with current page
                    pager.find('.possible-answers__list_pager__current')
                        .html(prev_page);

                    //restore button functionality
                    window.setTimeout(function () {
                        was_clicked = false
                    }, consts.ANIMATION_SLOW);
                }
            }
            else {
                was_clicked = false;
            }
        });
    },

    //hide pager and restore possible answers container height
    tearDown: function (input) {

        var pager = formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.possible-answers__list_pager');

        //restore height
        formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__possible-answers__list')
            .parent().css('min-height', 'auto');

        pager.addClass('hidden');

        formbuilder.possible_answers_pagination[input.ref].page = 1;
    },

    areValidPossibleAnswersInDOM: function (input) {
        var are_possible_answers_valid = true;
        var properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
        var possible_answers = properties_panel.find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list li');

        possible_answers.each(function (index, possible_answer) {

            var current_input = $(possible_answer).find('div input');
            var answer = current_input.val();

            // //strip html tags (angle brackets)
            // answer = answer.replace(/[<>]/ig, '');

            //sanitise < and > replacing by unicode
            answer = answer.replaceAll('>', '\ufe65');
            answer = answer.replaceAll('<', '\ufe64');

            if (answer === '') {
                are_possible_answers_valid = false;
                return false;
            }

        });

        return are_possible_answers_valid;
    },

    recalculatePagination: function (input) {

        //get current page and total of possibe answers
        var page = formbuilder.possible_answers_pagination[input.ref].page;
        var total = Math.ceil(input.possible_answers.length / consts.LIMITS.possible_answers_per_page);

        var pager = formbuilder.dom.input_properties
            .find('.panel-body form[data-input-ref="' + input.ref + '"]')
            .find('.possible-answers__list_pager');

        pager.find('.possible-answers__list_pager__current')
            .html(page);
        pager.find('.possible-answers__list_pager__total')
            .html(total);

        //hide pager if not needed
        if (input.possible_answers.length <= consts.LIMITS.possible_answers_per_page) {
            pager.addClass('hidden');
        }
    },

    recalculatePossibleAnswersDOM: function (input) {

        var self = this;
        var possible_answers_list = input.dom.properties_panel
            .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');
        var possible_answers = possible_answers_list.find('li');
        var lookup_index;
        var possible_answer_to_append;
        var list_item;
        var prev_page;
        var current_page = formbuilder.possible_answers_pagination[input.ref].page;

        /*add one answer to the bottom to fill the page (if any)
        here we are checking the possible answers currently on the dom
        this is the case where the user remove the 100th answer from the dom and we have more answers
        to show
        * */
        if (possible_answers.length === (consts.LIMITS.possible_answers_per_page - 1)) {

            if (input.possible_answers.length > possible_answers.length) {

                //append answer to the bottom of current page
                list_item = formbuilder.dom.partials.possible_answer_list_item;
                list_item = list_item.replace('{{answer}}', possible_answer_to_append.answer);
                list_item = list_item.replace('{{answer-ref}}', possible_answer_to_append.answer_ref);

                list_item = formbuilder.dom.partials.possible_answer_list_item;
                list_item = list_item.replace('{{answer}}', possible_answer_to_append.answer);
                list_item = list_item.replace('{{answer-ref}}', possible_answer_to_append.answer_ref);

                //append to dom
                possible_answers_list.append(list_item);

                //update pagination
                self.recalculatePagination(input);
            }
        }

        /*
        if the possible answers in the dom is 0, it means the user removed all the answers
        from the dom, therefore we have to
        * */
        if (possible_answers.length === 0) {

            //go to previous page
            formbuilder.possible_answers_pagination[input.ref].page--;
            prev_page = formbuilder.possible_answers_pagination[input.ref].page;
            getPossibleAnswerPage(input, prev_page);

            //update pagination buttons
            self.recalculatePagination(input);
        }
    }
};

module.exports = possible_answers_pager;

},{"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"template/methods/getPossibleAnswersPage":72}],13:[function(require,module,exports){
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

},{"actions/possible-answers-pager":12,"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"helpers/import-form-validation":35,"helpers/ui":36,"helpers/utils":37,"template/methods/getPossibleAnswersHTML":70,"template/methods/getPossibleAnswersList":71,"template/methods/getPossibleAnswersPage":72,"ui-handlers/event-handler-callbacks/confirm-import-possible-answers-callback":78,"ui-handlers/event-handler-callbacks/save-project-click-callback":97}],14:[function(require,module,exports){
/* global $*/
'use strict';
var saveAllInputProperties = require('actions/save/module.saveAllInputProperties');
var saveProperties = require('actions/save/module.saveProperties');
var savePossibleAnswers = require('actions/save/module.savePossibleAnswers');
var saveAdvancedProperties = require('actions/save/module.saveAdvancedProperties');
var saveJumps = require('actions/save/module.saveJumps');
var saveUniqueness = require('actions/save/module.saveUniqueness');
var doCleaningBeforeSaving = require('actions/save/module.doCleaningBeforeSaving');

var save = {

    saveUniqueness: function (the_input) {
        return saveUniqueness(the_input);
    },
    saveAllInputProperties: function (the_input) {
        return saveAllInputProperties(the_input);
    },
    saveProperties: function (the_input) {
        return saveProperties(the_input);
    },
    savePossibleAnswers: function (the_input) {
        return savePossibleAnswers(the_input);
    },
    saveAdvancedProperties: function (the_input) {
        return saveAdvancedProperties(the_input);
    },
    saveJumps: function (the_input) {
        return saveJumps(the_input);
    },
    doCleaningBeforeSaving: function (the_forms) {
        return doCleaningBeforeSaving(the_forms);
    }
};

module.exports = save;

},{"actions/save/module.doCleaningBeforeSaving":15,"actions/save/module.saveAdvancedProperties":16,"actions/save/module.saveAllInputProperties":17,"actions/save/module.saveJumps":18,"actions/save/module.savePossibleAnswers":19,"actions/save/module.saveProperties":20,"actions/save/module.saveUniqueness":21}],15:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');


var doCleaningBeforeSaving = function (forms) {

    var invalid_jumps_question = '';
    var all_jumps_valid = true;

    $(forms).each(function (index, form) {
        $(form.inputs).each(function (inputIndex, input) {

            //remove Word Unicode chars from question (if any)
            form.inputs[inputIndex].question = utils.replaceWordChars(input.question);

            //get valid jump destinations
            var jump_destinations = utils.getJumpAvailableDestinationsAsKeys(inputIndex, input, form.inputs, false);

            //extra validation for jumps, check if the destination still exists and it is valid
            $(input.jumps).each(function (jumpIndex, jump) {
                //does the jump "to" property reference a valid destination input?
                ////test: screw up the jump.to
                // jump.to = 'sfdgg';

                if (!jump_destinations[jump.to]) {
                    //invalid destination found
                    invalid_jumps_question = input.question;
                    all_jumps_valid = false;
                }

                //remove any leftover extra property from jump (if any)
                //hack to avoid huge refactoring and testing ;)
                input.jumps[jumpIndex] = {
                    to: jump.to,
                    when: jump.when,
                    answer_ref: jump.answer_ref
                };
            });

            $(input.branch).each(function (branchInputIndex, branch_input) {
                delete branch_input.dom;

                //remove Word Unicode chars from question (if any)
                input.branch[branchInputIndex].question = utils.replaceWordChars(branch_input.question);

                //todo validate branch jumps
                jump_destinations = utils.getJumpAvailableDestinationsAsKeys(branchInputIndex, branch_input, input.branch, true);

                //extra validation for jumps, check if the destination still exists and it is valid
                $(branch_input.jumps).each(function (branchJumpIndex, branchJump) {
                    //does the jump "to" property reference a valid destination input?
                    ////test: screw up the jump.to
                    // branchJump.to = 'sfdgg';

                    if (!jump_destinations[branchJump.to]) {
                        //invalid destination found
                        invalid_jumps_question = ' (branch) ' + branch_input.question;
                        all_jumps_valid = false;
                    }

                    //remove any leftover extra property from jump (if any)
                    //hack to avoid huge refactoring and testing ;)
                    branch_input.jumps[branchJumpIndex] = {
                        to: branchJump.to,
                        when: branchJump.when,
                        answer_ref: branchJump.answer_ref
                    };
                });

                $(branch_input.group).each(function (index, group_input) {

                    //remove Word Unicode chars from question (if any)
                    branch_input.group[index].question = utils.replaceWordChars(group_input.question);

                    delete group_input.dom;
                });
            });
            $(input.group).each(function (index, group_input) {

                //remove Word Unicode chars from question (if any)
                input.group[index].question = utils.replaceWordChars(group_input.question);

                delete group_input.dom;
            });
            console.log(' delete input.dom; called *******');
            delete input.dom;
        });
    });

    return {
        invalid_jumps_question: invalid_jumps_question,
        all_jumps_valid: all_jumps_valid
    };
};

module.exports = doCleaningBeforeSaving;

},{"config/consts":24,"config/formbuilder":26,"helpers/utils":37}],16:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');


var saveAdvancedProperties = function (input) {

    var save = require('actions/save');
    var initial_answer_validation;

    input.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + input.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //clear all advanced properties errors from dom
    input.hideAdvancedPropertiesErrors();


    //set properties but skip if it is a readme
    if (input.type !== consts.README_TYPE) {
        //set default
        input.default = input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val();
        input.default = input.default === '' ? null : input.default;

        //strip html tags and reset input to sanitised value
        if (input.default) {
            input.default = input.default.replace(/(<([^>]+)>)/ig, '');
            input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(input.default);
        }

        //set regex
        input.regex = input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val();
        input.regex = input.regex === '' ? null : input.regex;

        //strip html tags and reset input to sanitised value
        if (input.regex) {
            input.regex = input.regex.replace(/(<([^>]+)>)/ig, '');
            input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(input.regex);
        }

        //set verification flag
        input.verify = input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').is(':checked');

        /* get uniqueness flag */
        save.saveUniqueness(input);

    }

    /****************************************************/

    //validate initial answer
    initial_answer_validation = input.isInitialAnswerValid();
    if (!initial_answer_validation.is_valid) {
        input.dom.is_valid = false;
        //highlight wrong input
        input.showAdvancedPropertiesErrors(consts.DEFAULT_PROPERTY, initial_answer_validation.error.message);
    }
};

module.exports = saveAdvancedProperties;

},{"actions/save":14,"config/consts":24,"config/formbuilder":26}],17:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');

var saveAllInputProperties = function (the_input) {

    var input = the_input;
    var ui = require('helpers/ui');
    var utils = require('helpers/utils');
    var validation = require('actions/validation');
    var active_branch;
    var active_group;
    var branch_inputs_validation;
    var group_inputs_validation;
    var nested_group_owner_branch_validation;

    //save basic properties
    input.saveProperties();

    //if the selected input is a multiple choice input, save possible answers
    if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) !== -1) {
        //todo we are testing performance
        input.savePossibleAnswers();
    }
    //save advanced properties (not for media or branch or group types)
    if (consts.MEDIA_ANSWER_TYPES.indexOf(input.type) === -1 && input.type !== consts.BRANCH_TYPE && input.type !== consts.GROUP_TYPE) {
        input.saveAdvancedProperties();
    }

    //save jumps
    // if (input.type !== consts.GROUP_TYPE) {
    if (input.jumps.length > 0) {
        input.saveJumps();
    }

    //save branch inputs if the branch input owner is valid (header is not empty)
    if (input.type === consts.BRANCH_TYPE && input.dom.is_valid) {

        //set header preview
        ui.inputs_collection.showInputQuestionPreview(input.ref, input.question.trunc(50));

        //branch inputs are already attached to the branch property, just validate them
        //todo check this as I should do something if there is a valid/invalid one?
        input.validateBranchInputs();
    }

    //save branch inputs if the branch input owner is valid (header is not empty)
    if (input.type === consts.GROUP_TYPE && input.dom.is_valid) {

        //set header preview
        ui.inputs_collection.showInputQuestionPreview(input.ref, input.question.trunc(50));

        //branch inputs are already attached to the branch property, just validate them
        input.validateGroupInputs();
    }

    //if we are editing a nested group
    if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {

        // if we are editing a nested group, and all the nested group inputs are valid,
        // set the nested group input owner as valid and toggle valid icon for the owner group input
        active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
        active_group = utils.getNestedGroupObjectByRef(active_branch, formbuilder.group.active_group_ref);
        group_inputs_validation = validation.validateGroupInputs(active_group);

        if (group_inputs_validation.is_valid) {
            active_group.dom.is_valid = true;
            ui.inputs_collection.showInputValidIcon(active_group.ref);

            //if the nested group is valid, is the owner branch valid then?
            nested_group_owner_branch_validation = active_branch.validateBranchInputs();

            //todo do i need to do something here  based on the above result?

        }
        else {
            ui.inputs_collection.showInputInvalidIcon(active_group.ref);
            active_group.dom.is_valid = false;
        }
    }
    else {


        // if we are editing a branch, and all the active branch inputs are valid,
        // set the branch input owner as valid and toggle valid icon for the owner branch input
        if (formbuilder.is_editing_branch) {

            //get current active branch and validate
            active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            branch_inputs_validation = validation.validateBranchInputs(active_branch);

            if (branch_inputs_validation.is_valid) {

                ui.inputs_collection.showInputValidIcon(active_branch.ref);
                active_branch.dom.is_valid = true;
            }
            else {
                ui.inputs_collection.showInputInvalidIcon(active_branch.ref);
                active_branch.dom.is_valid = false;
            }
        }

        // if we are editing a group, and all the active group inputs are valid,
        // set the group input owner as valid and toggle valid icon for the owner branch input
        if (formbuilder.is_editing_group) {

            //get current active group and validate
            active_group = utils.getInputObjectByRef(formbuilder.group.active_group_ref);
            group_inputs_validation = validation.validateGroupInputs(active_group);

            if (group_inputs_validation.is_valid) {

                active_group.dom.is_valid = true;
                ui.inputs_collection.showInputValidIcon(active_group.ref);
            }
            else {
                ui.inputs_collection.showInputInvalidIcon(active_group.ref);
                active_group.dom.is_valid = false;
            }
        }
    }
};

module.exports = saveAllInputProperties;

},{"actions/validation":23,"config/consts":24,"config/formbuilder":26,"helpers/ui":36,"helpers/utils":37}],18:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');

var saveJumps = function (input) {

    var ui = require('helpers/ui');
    var undo = require('actions/undo');
    var jumps_list_wrapper = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + input.ref + '"]')
        .find('.input-properties__form__jumps .input-properties__form__jumps__list');

    var jumps = jumps_list_wrapper.find('li');
    var jump_properties = {
        are_valid: null,
        when: null,
        to: null,
        answer_ref: null,
        type: null
    };

    input.hideJumpsErrors(jumps);

    //reset all jumps
    input.jumps = [];
    jumps.each(function (i) {
            jump_properties.has_valid_destination = true;
            jump_properties.type = input.type;

            //get jump properties
            jump_properties.when = $(this).find('.input-properties__form__jumps__logic--when select option:selected').val();
            jump_properties.to = $(this).find('.input-properties__form__jumps__logic--goto select option:selected').val();
            jump_properties.answer_ref = $(this).find('.input-properties__form__jumps__logic--answer select option:selected').val();

            //validate jump properties
            jump_properties.are_valid = input.isJumpValid(jump_properties);

            if (!jump_properties.are_valid) {

                //show errors
                input.showSingleJumpErrors($(this), jump_properties);

                //set input as invalid
                input.dom.is_valid = false;
            }

            //save jump anyway, as it is flag as invalid and it will keep the project invalid until it is either removed or set properly
            input.jumps[i] = {
                to: jump_properties.to,
                //this will be always 'ALL' for this type of input
                when: jump_properties.when,
                //this will be null for single answer options. val() is set to answer_ref of possible answer otherwise
                answer_ref: jump_properties.answer_ref || null
            };
        }
    );
    undo.pushState();
};

module.exports = saveJumps;

},{"actions/undo":22,"config/consts":24,"config/formbuilder":26,"helpers/ui":36}],19:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var messages = require('config/messages');

var savePossibleAnswers;
savePossibleAnswers = function (the_input) {

    var input = the_input;
    var answer;
    var answer_ref;
    var properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
    var possible_answers = properties_panel.find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list li');
    var is_possible_aswer_valid;
    var answer_refs = [];

    var current_page = formbuilder.possible_answers_pagination[input.ref].page;
    var from_index = (current_page - 1) * consts.LIMITS.possible_answers_per_page;

    input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');

    //reset validation dom feedback (hide all errors from dom)
    input.hidePossibleAnswersErrors(possible_answers);

    /*
     Possible answers are grabbed from the dom, so we just update the text with whatever is set
     */
    possible_answers.each(function (index, possible_answer) {

        var current_input = $(possible_answer).find('div input');

        answer = current_input.val();

        //strip html tags (angle brackets)
        //answer = answer.replace(/[<>]/ig, '');

        //sanitise < and > replacing by unicode
        answer = answer.replaceAll('>', '\ufe65');
        answer = answer.replaceAll('<', '\ufe64');

        //reflect changes in dom
        current_input.attr('value', answer);
        current_input.val(answer);

        answer_ref = current_input.attr('data-answer-ref');
        if (!answer_refs.includes(answer_ref)) {
            answer_refs.push(answer_ref);
        } else {
            //duplicated answer_ref, show error
            input.dom.is_valid = false;
            //highlight wrong answer and show error message
            input.showPossibleAnswerErrors($(possible_answer), messages.error.POSSIBLE_ANSWER_DUPLICATED_IDENTIFIER);
            return false;
        }

        //add element to the correct position in the array
        //based on pagination
        input.possible_answers[from_index + index] = {
            answer: answer,
            answer_ref: answer_ref
        };

        is_possible_aswer_valid = input.isPossibleAnswerValid(answer);

        //validate each possible answer and show embedded errors if any
        if (!is_possible_aswer_valid.is_valid) {
            // warn user question text is wrong
            input.dom.is_valid = false;

            //highlight wrong answer and show error message
            input.showPossibleAnswerErrors($(possible_answer), is_possible_aswer_valid.error.message);
        }
    });
};

module.exports = savePossibleAnswers;


},{"config/consts":24,"config/formbuilder":26,"config/messages":28}],20:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var saveProperties = function (the_input) {

    var question_text_validation;
    var input = the_input;

    input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
    input.dom.is_valid = true;

    //reset validation dom feedback (hide all errors from dom)
    input.hidePropertiesErrors();

    //set question text (readme is the only one with a textarea in the markup)
    if (input.type === consts.README_TYPE) {

        input.question = input.dom.properties_panel.find('div.input-properties__form__question textarea').val().trim();

        //remove double white spaces, tabs and new lines and &nbsp;
        input.question = input.question.replace(/\s\s+/g, ' ').replace(/&nbsp;/g, '');

        //convert html tags to html entities
        input.question = utils.encodeHtml(input.question)
    }
    else {
        input.question = input.dom.properties_panel.find('div.input-properties__form__question input').val();

        //sanitise < and > replacing by unicode
        input.question = input.question.replaceAll('>', '\ufe65');
        input.question = input.question.replaceAll('<', '\ufe64');
        input.dom.properties_panel.find('div.input-properties__form__question input').val(input.question);

        //set required flag
        input.is_required = input.dom.properties_panel.find('div.input-properties__form__required-flag input').is(':checked');

        //set title flag
        input.is_title = input.dom.properties_panel.find('div.input-properties__form__title-flag input').is(':checked');
    }

    //validate question text
    question_text_validation = input.isQuestionTextValid();

    if (!question_text_validation.is_valid) {
        // warn user question text is wrong
        input.dom.is_valid = false;
        input.dom.error = question_text_validation.error.message;

        //highlight wrong input and show error message
        input.showPropertiesErrors(question_text_validation.error.message);

    }
};

module.exports = saveProperties;

},{"config/consts":24,"config/formbuilder":26,"helpers/utils":37}],21:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');

var saveUniqueness = function (input) {

    /* get uniqueness flag */
    var uniqueness = input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__uniqueness input:checked');
    //top parent form
    if (formbuilder.current_form_index === 0) {
        //this is the top level form, get single checkbox state
        input.uniqueness = (uniqueness.length > 0) ? consts.UNIQUESS_FORM : consts.UNIQUESS_NONE;
    }
    else {
        //do we have some checkboxes selected?
        if (uniqueness.length > 0) {
            //child form can have either hierarchy or form uniqueness
            input.uniqueness = uniqueness.hasClass('uniqueness-hierarchy') ? consts.UNIQUESS_HIERARCHY : consts.UNIQUESS_FORM;
        }
        else {
            input.uniqueness = consts.UNIQUESS_NONE;
        }
    }

};

module.exports = saveUniqueness;

},{"config/consts":24,"config/formbuilder":26}],22:[function(require,module,exports){
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

            formbuilder.previous_state = CircularJSON.parse(CircularJSON.stringify(formbuilder.state[formbuilder.state.length - 1]));

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

},{"actions/parse":5,"config/consts":24,"config/formbuilder":26,"factory/form-factory":30,"helpers/ui":36,"helpers/utils":37}],23:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var save = require('actions/save');
var utils = require('helpers/utils');
var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');
var import_form_validation = require('helpers/import-form-validation');
var toast = require('config/toast');

var validation = {

    isFormNameValid: function (the_name, is_adding_new_form) {

        var forms = formbuilder.project_definition.data.project.forms;
        var str = the_name.trim();
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.QUESTION_PROPERTY
            }
        };
        //reject an empty string
        if (str === '') {
            validate.is_valid = false;
            validate.error.message = messages.error.FORM_NAME_EMPTY;
        }
        else {
            //reject if not alphanumeric
            if (!consts.FORM_NAME_REGEX.test(str)) {
                validate.is_valid = false;
                validate.error.message = messages.error.FORM_NAME_INVALID;
            }
            else {

                if (is_adding_new_form) {
                    //check if the form name already exists (case insensitive)
                    $(forms).each(function (index, form) {
                        if (form.name.toLowerCase() === str.toLowerCase()) {
                            validate.is_valid = false;
                            validate.error.message = messages.error.FORM_NAME_EXIST;
                        }
                    });
                }
            }
        }

        return validate;
    },

    //check for empty string and the presence of either '|' or '_skipp3d_' which are reserved words/chars
    isQuestionTextValid: function (input) {

        var question = input.question;
        var str = question.trim();
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.QUESTION_PROPERTY
            }
        };
        if (str === '') {
            validate.is_valid = false;
            validate.error.message = messages.error.QUESTION_TEXT_EMPTY;
        }
        //readme text too long?
        if (input.type === consts.README_TYPE) {
            //convert any html entities to tags
            str = utils.decodeHtml(str);
            //strip tags
            str = str.replace(/(<([^>]+)>)/ig, '');
            //check REAL length
            if (str.trim().length > consts.LIMITS.readme_length) {
                validate.is_valid = false;
                validate.error.message = messages.error.QUESTION_LENGTH_LIMIT_EXCEEDED;
            }
        }

        //other questions text too long
        if (input.type !== consts.README_TYPE && str.length > consts.LIMITS.question_length) {
            validate.is_valid = false;
            validate.error.message = messages.error.QUESTION_LENGTH_LIMIT_EXCEEDED;
        }

        return validate;
    },

    isPossibleAnswerValid: function (the_possible_answer) {

        var str = the_possible_answer.trim();
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.QUESTION_PROPERTY
            }
        };

        if (str === '') {
            validate.is_valid = false;
            validate.error.message = messages.error.POSSIBLE_ANSWER_EMPTY;
        }
        return validate;
    },

    //check if this is valid against the input type or the regex
    isInitialAnswerValid: function (the_type, the_default, the_regex) {

        var str = the_default || '';
        var regex = the_regex;
        var type = the_type;
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.DEFAULT_PROPERTY
            }
        };

        str = str.trim();

        //does the initial answer pass the regex?
        if (regex && str) {
            if (!str.match(regex)) {
                validate.is_valid = false;
                validate.error.message = messages.error.INITIAL_ANSWER_NOT_MATCHING_REGEX;
            }
        }

        if (type === consts.PHONE_TYPE) {
            //is the initial answer a valid phone number format?
            //todo this is hairy, too many options
            //validate.is_valid = false;
            //validate.error.message = messages.error.INITIAL_ANSWER_NOT_PHONE_NUMBER;
        }


        return validate;
    },
    //convert value to a float and check if it is an integer
    isValueInt: function (n) {
        n = parseFloat(n);
        return Number(n) === n && n % 1 === 0;
    },
    //convert value to a float and check if it is a decimal or
    isValueFloat: function (n) {
        n = parseFloat(n);
        return n === Number(n) && n % 1 !== 0;
    },

    //is this right? todo double check this and maybe refactor integer/decimal validation in integer.js
    isMinMaxValueValid: function (type, value) {

        var minmax_value = value;
        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.MAX_VALUE_PROPERTY
            }
        };

        if (type === consts.INTEGER_TYPE && minmax_value !== '') {
            //min must be an integer, not a float
            if (!this.isValueInt(minmax_value)) {
                validate.is_valid = false;
                validate.error.message = messages.error.VALUE_MUST_BE_INTEGER;
            }
        }
        return validate;
    },

    isJumpValid: function (the_jump, the_input) {

        var jump = the_jump;
        var input = the_input;
        var is_valid = true;
        var inputs;
        var jump_destinations;

        //if editing a branch, get jumps destinations within the active branch
        if (formbuilder.is_editing_branch) {
            inputs = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref).branch;
        }
        else {
            inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        }

        jump_destinations = utils.getJumpAvailableDestinations(input, inputs);

        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(jump.type) !== -1) {
            //multiple answers validation
            if (jump.to === undefined || jump.when === undefined) {
                is_valid = false;
            }

            //answer_ref in needed when IS ans IS NOT only
            if (jump.answer_ref === undefined) {
                if (jump.when === 'IS' || jump.when === 'IS_NOT') {
                    is_valid = false;
                }
            }
        }
        else {
            //single answer validation (it will always jump, so check if destination is set)
            if (jump.to === undefined) {
                is_valid = false;
            }
        }

        //check the destination is valid (the user might have dragged the input around)
        if (is_valid) {

            var refs = jump_destinations.map(function (destination) {
                return destination.ref;
            });


            if (refs.indexOf(jump.to) === -1) {
                is_valid = false;
                jump.has_valid_destination = false;
            }
            else {
                //remove jump.has_valid_destination just in case it was there from a previous error
                //this happens because I am mutating the object! shame on me, too much work refactoring ;)
                delete jump.has_valid_destination;
            }
        }
        return is_valid;
    },

    //todo I do not think this is used anymore
    isPossibleAnswerlinkedToJump: function (the_possible_answer, the_jumps) {

        var possible_answer = the_possible_answer;
        var jumps = the_jumps;
        var i;
        var iLength = jumps.length;
        var has_linked_jump = false;

        for (i = 0; i < iLength; i++) {
            if (jumps[i].answer_id === possible_answer.answer_id) {
                has_linked_jump = true;
                break;
            }
        }
        return has_linked_jump;
    },

    //perform validation on an input and optionally show toast notification
    performValidation: function (the_input, show_toast) {

        var input = the_input;
        var message;
        var ui = require('helpers/ui');
        var utils = require('helpers/utils');
        var undo = require('actions/undo');
        var question;
        var copy_btn_state = input.dom.is_valid ? consts.BTN_ENABLED : consts.BTN_DISABLED;
        /***************************************
         Save will implicitly run the validation!
         */
        save.saveAllInputProperties(input);
        /*************************************/

        //show visual feedback if the properties are valid
        if (input.dom.is_valid) {

            //update the just saved input showing a preview of the question text (limit to 50 chars)
            //strip html tags from readme type if any
            if (input.type === consts.README_TYPE) {

                //start with deconding the html
                question = utils.decodeHtml(input.question);
                //remove '<' and '>' from decoded string (as html entities)
                //tags already parsed (<b>, <i>, <u>) should go through
                //todo test this well
                var purifiedHtml = utils.replaceAllOccurrences(question, '&lt;', '\ufe64');
                purifiedHtml = utils.replaceAllOccurrences(purifiedHtml, '&gt;', '\ufe65');

                //remove link protocol
                purifiedHtml = utils.replaceAllOccurrences(purifiedHtml, 'http://', '');
                purifiedHtml = utils.replaceAllOccurrences(purifiedHtml, 'https://', '');

                //remove not allowed tags
                purifiedHtml = utils.stripTags(purifiedHtml, consts.README_ALLOWED_TAGS);

                //save purified question
                input.question = utils.encodeHtml(purifiedHtml);

                //remove ALL tags for preview only
                question = purifiedHtml.replace(/(<([^>]+)>)/ig, ' ');
                //wrap in double quotes to escape html in the preview so <br> do not get rendered
                ui.inputs_collection.showInputQuestionPreview(input.ref, '"' + question.trunc(consts.LIMITS.question_preview_length) + '"');
            }
            else {
                ui.inputs_collection.showInputQuestionPreview(input.ref, input.question.trunc(consts.LIMITS.question_preview_length));
            }

            //replace warning icon with green check
            ui.inputs_collection.showInputValidIcon(input.ref);

            //show question preview on input properties panel
            //strip html tags from readme type if any
            if (input.type === consts.README_TYPE) {
                question = utils.decodeHtml(input.question);
                question = question.replace(/(<([^>]+)>)/ig, ' ');
                //wrap in double quotes to escape html rendering in preview
                ui.input_properties_panel.showInputQuestionPreview('"' + question.trunc(20) + "");
            }
            else {
                ui.input_properties_panel.showInputQuestionPreview(input.question.trunc(20));
            }

            if (show_toast) {
                toast.showSuccess(messages.success.INPUT_VALID);
            }
            //enable save project button if all inputs are valid
            if (this.areAllInputsValid(formbuilder.project_definition)) {
                //console.log('** all good **');
                //enable save project button
                ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
                formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);

                //replace warning icon with green check on current form tab
                ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);

                //enable download form button on current form
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__export-form').removeClass('disabled');

                //enable prnt as pdf button
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__print-as-pdf').removeClass('disabled');
            }
            else {

                //check if inputs are all valid for current form only
                if (this.areFormInputsValid(formbuilder.current_form_index)) {
                    //replace warning icon with green check on current form tab
                    ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);

                    //enable download form button
                    formbuilder.dom.inputs_collection
                        .find('.inputs-collection__export-form').removeClass('disabled');

                    //enable print as pdf form button
                    formbuilder.dom.inputs_collection
                        .find('.inputs-collection__print-as-pdf').removeClass('disabled');
                }
                else {
                    //disable download form button
                    formbuilder.dom.inputs_collection
                        .find('.inputs-collection__export-form').addClass('disabled');

                    //disable print as pdf form button
                    formbuilder.dom.inputs_collection
                        .find('.inputs-collection__print-as-pdf').addClass('disabled');
                }
            }
        } else {
            if (input.question) {
                message = input.dom.error ? input.dom.error : input.question;
            }
            else {
                switch (input.type) {
                    case consts.BRANCH_TYPE:
                        message = messages.error.NO_BRANCH_HEADER_YET;
                        break;
                    case consts.GROUP_TYPE:
                        message = messages.error.NO_GROUP_HEADER_YET;
                        break;
                    default:
                        message = messages.error.NO_QUESTION_TEXT_YET;
                        break;
                }
            }

            //update question preview
            ui.inputs_collection.showInputInvalidIcon(input.ref);
            ui.inputs_collection.showInputQuestionPreview(input.ref, message);
            ui.input_properties_panel.showInputQuestionPreview(message);

            if (show_toast) {
                toast.showError(messages.error.INPUT_NOT_VALID, 2000);
            }

            //disable save project button
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
            formbuilder.dom.save_project_btn.off('click');

            //show warning icon on current form tab
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

            //disable download form button on current form
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__export-form').addClass('disabled');
            //disable print as pdf button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__print-as-pdf').addClass('disabled');
        }

        //toggle copy button (valid, enable button else disable)
        ui.input_properties_panel.toggleCopyInputButton(input.ref, copy_btn_state);
    },

    areAllInputsValid: function (project_definition) {
        var are_all_valid = true;
        var forms = project_definition.data.project.forms;

        loop1:
        for (var index = 0; index < forms.length; index++) {

            //do not accept forms with no inputs
            if (forms[index].inputs.length === 0) {
                are_all_valid = false;
                break;
            }

            for (var input_index = 0; input_index < forms[index].inputs.length; input_index++) {

                if (!forms[index].inputs[input_index].dom.is_valid) {
                    are_all_valid = false;
                    break loop1;
                }
            }
        }
        return are_all_valid;
    },

    areFormInputsValid: function (form_index) {

        var are_valid = true;
        var form = formbuilder.project_definition.data.project.forms[form_index];

        //do not accept forms with no inputs
        if (form.inputs.length === 0) {
            are_valid = false;
        }

        //loop all inputs to see if they are all valid
        $(form.inputs).each(function (index, input) {
            if (!input.dom.is_valid) {
                are_valid = false;
                return false;
            }
        });

        return are_valid;
    },

    // a branch is valid when the branch header is not empty and there is at least a valid branch question
    // also, all the branch questions need to pass validation to make a branch valid
    validateBranchInputs: function (the_branch_owner) {

        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.DEFAULT_PROPERTY
            }
        };

        var branch_owner = the_branch_owner;

        if (branch_owner.branch.length === 0) {
            validate.is_valid = false;
            validate.error.message = messages.error.NO_BRANCH_INPUTS_FOUND;
        }
        else {
            //check if ALL the branch inputs are valid and return as soon as the first invalid is found
            $(branch_owner.branch).each(function (index, input) {
                // console.log('** input dom is_valid for branches');
                // console.log(input.dom.is_valid);
                if (!input.dom.is_valid) {
                    validate.is_valid = false;
                    validate.error.message = messages.error.INVALID_BRANCH_INPUTS;
                    return false;
                }
            });
        }
        return validate;
    },

    // a group is valid when the group header is not empty and there is at least a valid group question
    // also, all the group questions need to pass validation to make a group valid
    validateGroupInputs: function (the_group_input) {

        var validate = {
            is_valid: true,
            error: {
                message: null,
                type: consts.DEFAULT_PROPERTY
            }
        };

        var group_input = the_group_input;

        if (group_input.group.length === 0) {
            validate.is_valid = false;
            validate.error.message = messages.error.NO_GROUP_INPUTS_FOUND;
        }
        else {
            //check if ALL the group inputs are valid and return as soon as the first invalid is found
            $(group_input.group).each(function (index, input) {
                if (!input.dom.is_valid) {
                    validate.is_valid = false;
                    validate.error.message = messages.error.INVALID_GROUP_INPUTS;
                    return false;
                }
            });
        }
        return validate;
    },

    validateJumpsAfterSorting: function (inputs) {

        var self = this;
        var ui = require('helpers/ui');
        var inputs_to_validate = inputs;
        var jumps_list_wrapper_dom;
        var jumps_dom;
        var jump_dom;

        //validate previous inputs based and current one
        for (var index = 0; index < inputs_to_validate.length; index++) {

            var input = inputs_to_validate[index];
            var are_jumps_valid = true;

            //hide all errors for a jump in the dom
            jumps_list_wrapper_dom = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + input.ref + '"]')
                .find('.input-properties__form__jumps .input-properties__form__jumps__list');

            jumps_dom = jumps_list_wrapper_dom.find('li');

            //hide all the jumps error
            input.hideJumpsErrors(jumps_dom);

            for (var jump_index = 0; jump_index < input.jumps.length; jump_index++) {

                var jump = input.jumps[jump_index];

                // Assume the index of the <li> in the list is the same of the index in the jumps object
                jump_dom = jumps_dom.eq(jump_index);

                //todo if any error, highlight the wrong destination in the markup
                if (!self.isJumpValid(jump, input)) {

                    //show errors
                    input.showSingleJumpErrors(jump_dom, jump);

                    //keep track the jumps now are invalid
                    are_jumps_valid = false;

                    //set input in the dom as invalid, and also the form if it is the only invalid one
                    ui.inputs_collection.showInputInvalidIcon(input.ref);
                }
                else {
                    //todo what if I have multiple jumps with errors?
                    ui.input_properties_panel.hideJumpTabError(jump_dom);
                }
            }

            //Is the input valid aside from the jumps? That would mean all the jumps were ok, but there might be other errors
            //we just need to check the object properties, as they do not change when sorting
            input.dom.is_valid = self.isInputObjectValid(input) && are_jumps_valid;

            //set input validation icon accordingly
            if (input.dom.is_valid) {
                ui.inputs_collection.showInputValidIcon(input.ref);
            }
            else {
                ui.inputs_collection.showInputInvalidIcon(input.ref);
            }
        }


        //check if the form is now valid
        if (self.areFormInputsValid(formbuilder.current_form_index)) {
            ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);

            //enable download form button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__export-form').removeClass('disabled');

            //enable print as pdf form button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__print-as-pdf').removeClass('disabled');
        }
        else {
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

            //disable form download button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__export-form').addClass('disabled');

            //disable print as pdf download button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__print-as-pdf').addClass('disabled');
        }

        //check if all inputs are now valid to enable save project button
        if (self.areAllInputsValid(formbuilder.project_definition)) {
            ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
        }
        else {
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
        }
    },

    isInputObjectValid: function (input) {

        var self = this;
        var is_valid = true;

        //check question text ***********************************************************
        if (!self.isQuestionTextValid(input).is_valid) {
            is_valid = false;
        }
        //*******************************************************************************

        //test min and max for integer **************************************************
        if (input.type === consts.INTEGER_TYPE) {

            //is min a int?
            if (input.min !== '') {
                if (!self.isValueInt(input.min)) {
                    is_valid = false;
                }
            }

            //is max a int?
            if (input.max !== '') {
                if (!self.isValueInt(input.max)) {
                    is_valid = false;
                }
            }

            //If both are set, are they valid?
            if (is_valid && (input.min !== '' && input.max !== '')) {
                if (parseFloat(input.min) > parseFloat(input.max)) {
                    is_valid = false;
                }
            }

            //if the default answer is set, is it valid?
            if (input.default !== '') {
                if (!self.isValueInt(input.default)) {
                    is_valid = false;
                }
                else {
                    //default answer is a valid int, is it within range?
                    if (input.min !== '' && parseInt(input.default, 0) < input.min) {
                        is_valid = false;
                    }
                    if (input.min !== '' && parseInt(input.default, 0) > input.max) {
                        is_valid = false;
                    }
                }
            }
        }
        //*******************************************************************************

        //test min and max for decimal (float) ******************************************
        if (input.type === consts.DECIMAL_TYPE) {
            //is min a float or an integer?
            if (input.min !== '') {
                if (!(self.isValueFloat(input.min) || self.isValueInt(input.min))) {
                    is_valid = false;
                }
            }

            //is max a float or integer?
            if (input.max !== '') {
                if (!(self.isValueFloat(input.max) || self.isValueInt(input.max))) {
                    is_valid = false;
                }
            }

            //If both are set, are they valid?
            if (is_valid && (input.min !== '' && input.max !== '')) {
                if (parseFloat(input.min) > parseFloat(input.max)) {
                    is_valid = false;
                }
            }

            //if the default answer is set, is it valid?
            if (input.default !== '') {
                if (!(self.isValueFloat(input.default) || self.isValueInt(input.default))) {
                    is_valid = false;
                }
                else {
                    //default answer is a valid number, is it within range?
                    if (input.min !== '' && parseFloat(input.default) < input.min) {
                        is_valid = false;
                    }
                    if (input.min !== '' && parseFloat(input.default) > input.max) {
                        is_valid = false;
                    }
                }
            }
        }
        //*******************************************************************************

        //check possible answers for multiple answer types ******************************
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type !== -1)) {
            $(input.possible_answers).each(function (index, possible_answer) {
                if (!self.isPossibleAnswerValid(possible_answer.answer).is_valid) {
                    is_valid = false;
                }
            });
        }
        //*******************************************************************************

        //group type but empty? *********************************************************
        if (input.type === consts.GROUP_TYPE && input.group.length === 0) {
            is_valid = false;
        }
        //*******************************************************************************

        //branch type but empty? ********************************************************
        if (input.type === consts.BRANCH_TYPE && input.branch.length === 0) {
            is_valid = false;
        }
        //*******************************************************************************

        return is_valid;
    }
    ,

    validateBeforeSaving: function (form_ref, inputs) {

        var validate = {
            is_valid: true,
            error: {
                message: null
            }
        };
        var invalid_question = '';
        var are_inputs_valid = true;
        var are_branch_inputs_valid = true;
        $(inputs).each(function (index, input) {
            if (!import_form_validation.isValidInput(form_ref, input, false, false)) {
                console.log(JSON.stringify(input));
                invalid_question = input.question.trunc(50);
                are_inputs_valid = false;
                return false;//exit loop only
            }
        });
        var questions_total;

        if (!are_inputs_valid) {
            validate = {
                is_valid: false,
                error: {
                    message: invalid_question
                }
            };
            return validate;
        }

        //check total number of questions/branches
        questions_total = utils.getInputsTotal(inputs);
        if (questions_total > consts.INPUTS_MAX_ALLOWED) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.TOO_MANY_QUESTIONS_FOR_CURRENT_FORM + questions_total + ', limit is ' + consts.INPUTS_MAX_ALLOWED + '!'
                }
            };
            return validate;
        }

        //check total number of titles (main form)
        if (utils.isMaxTitleLimitExceeded(inputs)) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.TOO_MANY_TITLES
                }
            };
            return validate;
        }
        //check total number of titles (branches)
        $(inputs).each(function (index, input) {
            if (utils.isMaxTitleLimitExceeded(input.branch)) {
                are_branch_inputs_valid = false;
                return false;
            }
        });

        if (!are_branch_inputs_valid) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.TOO_MANY_TITLES + ' (branch)'
                }
            };
            return validate;
        }

        //check jumps destinations
        if (!import_form_validation.areJumpsDestinationsValid(inputs)) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.JUMPS_INVALID
                }
            };
            return validate;
        }

        //check total number of search inputs
        if (utils.getSearchInputsTotal() > consts.LIMITS.search_inputs_max) {
            validate = {
                is_valid: false,
                error: {
                    message: messages.error.TOO_MANY_SEARCH_QUESTIONS
                }
            };
            return validate;
        }

        return validate;
    }
}
    ;

module.exports = validation;


},{"actions/save":14,"actions/undo":22,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"helpers/import-form-validation":35,"helpers/ui":36,"helpers/utils":37,"ui-handlers/event-handler-callbacks/save-project-click-callback":97}],24:[function(require,module,exports){
/*
 set of constants and values to use across the application
 we use `consts` as const is a reserved word and `constant` is a window global object
 */
'use strict';

console.log(window.location.href);

var consts = {

    PROJECT_URL: '',
    PROJECT_LOGO_URL: '',
    BACK_URL: '',
    API_DEVELOPMENT_GET_PATH: '../project/',
    API_DEVELOPMENT_POST_PATH: '../postdump/',
    API_DEVELOPMENT_PROJECT: 'project.json',

    API_PRODUCTION_PATH: 'api/internal/formbuilder/',
    API_MEDIA_PATH: 'api/internal/media/',
    API_PROJECT_LOGO_QUERY_STRING: '?type=photo&name=logo.jpg&format=project_mobile_logo',
    API_DEVELOPMENT_SERVER: 'http://localhost/~mmenegazzo/epicollect5-server/public',//to be changed accordingly
    FORMBUIlDER_ROOT_FOLDER: 'epicollect5-formbuilder',

    PROJECT_NAME_MAX_LENGHT: 100,
    FORM_NAME_MAX_LENGHT: 50,
    INPUTS_MAX_ALLOWED: 300,
    TAB_FORM_NAME_MAX_DISPLAY_LENGHT: 22,
    INPUTS_COLLECTION_FORM_NAME_MAX_DISPLAY_LENGHT: 22,
    INPUTS_COLLECTION_BRANCH_NAME_MAX_DISPLAY_LENGHT: 25,
    INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT: 25,
    MAX_NUMBER_OF_NESTED_CHILD_FORMS: 5,
    ANIMATION_FAST: 100,//milliseconds
    ANIMATION_NORMAL: 150,
    ANIMATION_SLOW: 500,
    ANIMATION_SUPER_SLOW: 1000,

    FORM_NAME_REGEX: /^[\w\-\s]+$/, //allow only alphanumeric chars and '-', '_'
    FORM_HIERARCHY_TYPE: 'hierarchy',
    FORM_TYPE: 'form',

    UNIQUESS_NONE: 'none',
    UNIQUESS_FORM: 'form',
    UNIQUESS_HIERARCHY: 'hierarchy',

    //app ids namespace
    NAMESPACE_PREFIX: 'ec5_',

    //input types icons
    TEXT_TYPE_ICON: 'fa-text-width', //
    TEXTAREA_TYPE_ICON: 'fa-sticky-note-o',
    NUMERIC_TYPE_ICON: 'fa-hashtag',
    INTEGER_TYPE_ICON: 'fa-hashtag',
    DECIMAL_TYPE_ICON: 'fa-hashtag',
    DATE_TYPE_ICON: 'fa-calendar',
    TIME_TYPE_ICON: 'fa-clock-o',
    RADIO_TYPE_ICON: 'fa-dot-circle-o',
    README_TYPE_ICON: 'fa-file-text-o',
    CHECKBOX_TYPE_ICON: 'fa-check-square-o',
    DROPDOWN_TYPE_ICON: 'fa-caret-square-o-down',
    BARCODE_TYPE_ICON: 'fa-barcode',
    LOCATION_TYPE_ICON: 'fa-map-marker',
    AUDIO_TYPE_ICON: 'fa-microphone',
    VIDEO_TYPE_ICON: 'fa-video-camera',
    PHOTO_TYPE_ICON: 'fa-camera-retro',
    PHONE_TYPE_ICON: 'fa-phone',
    BRANCH_TYPE_ICON: 'fa-clone',
    GROUP_TYPE_ICON: 'fa-align-justify',
    SEARCH_SINGLE_TYPE_ICON: 'fa-search',
    SEARCH_MULTIPLE_TYPE_ICON: 'fa-search',

    //input types
    TEXT_TYPE: 'text', //
    TEXTAREA_TYPE: 'textarea',
    INTEGER_TYPE: 'integer',
    DECIMAL_TYPE: 'decimal',
    DATE_TYPE: 'date',
    TIME_TYPE: 'time',
    RADIO_TYPE: 'radio',
    CHECKBOX_TYPE: 'checkbox',
    DROPDOWN_TYPE: 'dropdown',
    BARCODE_TYPE: 'barcode',
    LOCATION_TYPE: 'location',
    AUDIO_TYPE: 'audio',
    VIDEO_TYPE: 'video',
    PHOTO_TYPE: 'photo',
    BRANCH_TYPE: 'branch',
    GROUP_TYPE: 'group',
    README_TYPE: 'readme',
    PHONE_TYPE: 'phone',
    SEARCH_SINGLE_TYPE: 'searchsingle',
    SEARCH_MULTIPLE_TYPE: 'searchmultiple',

    //date formats
    DATE_FORMAT_1: 'dd/MM/YYYY',
    DATE_FORMAT_2: 'MM/dd/YYYY',
    DATE_FORMAT_3: 'YYYY/MM/dd',
    DATE_FORMAT_4: 'MM/YYYY',
    DATE_FORMAT_5: 'dd/MM',

    //time formats
    TIME_FORMAT_1: 'HH:mm:ss',
    TIME_FORMAT_2: 'hh:mm:ss',
    TIME_FORMAT_3: 'HH:mm',
    TIME_FORMAT_4: 'hh:mm',
    TIME_FORMAT_5: 'mm:ss',

    //reserverd words/chars
    //RESERVED_WORD_SKIPP3D: '_skipp3d_',
    //PATH_SEPARATOR_MOBILE_CLIENT: '|',

    //input properties names
    DEFAULT_PROPERTY: 'default',
    QUESTION_PROPERTY: 'question',
    MIN_VALUE_PROPERTY: 'min',
    MAX_VALUE_PROPERTY: 'max',

    //button labels
    SHOW_JUMPS: 'Show jumps',
    HIDE_JUMPS: 'Hide jumps',
    JUMP_TO_END_OF_FORM_REF: 'END',
    JUMP_TO_END_OF_FORM_LABEL: 'End of form',

    //possible answers
    POSSIBILE_ANSWERS_CUSTOM_ID: 'pa_custom_id',
    POSSIBILE_ANSWER_PLACEHOLDER: 'I am a placeholder answer',
    USE_ANSWER_AS_TITLE: 'Use answer as title',
    MAX_TITLE_LIMIT_REACHED: 'Limit of 3 titles reached',

    //paths
    VIEWS_PATH: 'views/',

    //buttons status
    BTN_ENABLED: 'btn-enabled',
    BTN_DISABLED: 'btn-disabled',

    ENABLED_STATE: 'enabled',
    DISABLED_STATE: 'disabled',

    //action
    RENDER_ACTION_UNDO: 'undo',
    RENDER_ACTION_DO: 'do',
    RENDER_ACTION_VALIDATE: 'validate',

    //form export/import
    FORM_FILE_ACCEPTED_TYPE: 'application/json',
    FORM_FILE_EXTENSION: 'json',

    //possible answers csv import/export
    CSV_FILE_ACCEPTED_TYPES: ['text/csv', 'application/vnd.ms-excel'], //MIME types
    CSV_FILE_EXTENSION: 'csv'
};

//multiple answers types
consts.MULTIPLE_ANSWER_TYPES = [
    consts.RADIO_TYPE,
    consts.CHECKBOX_TYPE,
    consts.DROPDOWN_TYPE,
    consts.SEARCH_MULTIPLE_TYPE,
    consts.SEARCH_SINGLE_TYPE
];


consts.SINGLE_ANSWER_TYPES = [
    consts.TEXT_TYPE,
    consts.TEXTAREA_TYPE,
    consts.DATE_TYPE,
    consts.TIME_TYPE,
    consts.INTEGER_TYPE,
    consts.DECIMAL_TYPE,
    consts.BARCODE_TYPE,
    consts.README_TYPE,
    consts.PHONE_TYPE
];

//these types do not have the required/uniqueness option
consts.MEDIA_ANSWER_TYPES = [
    consts.AUDIO_TYPE,
    consts.PHOTO_TYPE,
    consts.VIDEO_TYPE,
    consts.LOCATION_TYPE
];

//types that have the verify option
consts.VERIFY_ALLOWED_TYPES = [
    consts.TEXT_TYPE,
    consts.TEXTAREA_TYPE,
    consts.INTEGER_TYPE,
    consts.DECIMAL_TYPE,
    consts.BARCODE_TYPE,
    consts.PHONE_TYPE
];

//types that have the uniquess option
consts.UNIQUENESS_ALLOWED_TYPES = [
    consts.TEXT_TYPE,
    consts.TEXTAREA_TYPE,
    consts.DATE_TYPE,
    consts.TIME_TYPE,
    consts.INTEGER_TYPE,//numeric
    consts.DECIMAL_TYPE,//numeric
    consts.BARCODE_TYPE,
    consts.PHONE_TYPE
];

//these types DO have the required option
consts.REQUIRED_ALLOWED_TYPES = [
    consts.TEXT_TYPE,
    consts.TEXTAREA_TYPE,
    consts.DATE_TYPE,
    consts.TIME_TYPE,
    consts.INTEGER_TYPE,
    consts.DECIMAL_TYPE,
    consts.BARCODE_TYPE,
    consts.PHONE_TYPE,
    consts.RADIO_TYPE,
    consts.CHECKBOX_TYPE,
    consts.DROPDOWN_TYPE,
    consts.SEARCH_MULTIPLE_TYPE,
    consts.SEARCH_SINGLE_TYPE
];


//jump conditions
consts.JUMP_CONDITIONS = [
    { key: 'NO_ANSWER_GIVEN', text: 'no answer given' },
    { key: 'IS', text: 'answer is' },
    { key: 'IS_NOT', text: 'answer is NOT' },
    { key: 'ALL', text: 'always' }
];

consts.LIMITS = {
    question_length: 255,
    readme_length: 1000,
    default_answer_length: 255,
    regex_length: 50,
    min_value_length: 50,
    max_value_length: 50,
    possible_answers_max: 300,
    possible_answers_max_search: 1000,
    titles_max: 3,
    max_states: 10,
    possible_answer_ref_length: 13,
    possible_answer_max_length: 150,
    possible_answers_per_page: 100,
    search_inputs_max: 5,
    question_preview_length: 80
};

consts.SUMMERNOTE_OPTIONS = {
    placeholder: 'Type here...',
    toolbar: [
        // [groupName, [list of button]]
        ['style', ['bold', 'italic', 'underline']]
    ]
};

consts.REGEX = {
    only_letters: '^[a-zA-Z]*$',
    only_digits: '^[0-9]+$',
    limit_length_20: '^.{1,20}$',
    possible_answer_ref: '^[a-zA-Z0-9]{13}$',
    input_ref: '^[a-zA-Z0-9-_]{60}$'
};

consts.README_ALLOWED_TAGS = [
    '<br>',
    '<p>',
    '<b>',
    '<strong>',
    '<i>',
    '<em>',
    '<u>'
];

consts.POSSIBLE_ANSWERS_ORDER = {
    AZ: 'az',
    ZA: 'za',
    SHUFFLE: 'shuffle'
};

module.exports = consts;

},{}],25:[function(require,module,exports){
'use strict';

var extend_natives = function () {

    //from http://www.redips.net/javascript/array-move/
    //move an element within same array and shift other elements
    Array.prototype.move = function (from, to) {
        // local variables
        var i, tmp;
        // cast input parameters to integers
        from = parseInt(from, 10);
        to = parseInt(to, 10);
        // if positions are different and inside array
        if (from !== to && from >= 0 && from <= this.length && to >= 0 && to <= this.length) {
            // save element 'from'
            tmp = this[from];
            // move element down and shift other elements up
            if (from < to) {
                for (i = from; i < to; i++) {
                    this[i] = this[i + 1];
                }
            }
            // move element up and shift other elements down
            else {
                for (i = from; i > to; i--) {
                    this[i] = this[i - 1];
                }
            }
            // put element 'from' to destination
            this[to] = tmp;
        }
    };

    String.prototype.trunc = function (n) {
        return this.substr(0, n - 1) + (this.length >= n ? '...' : '');
    };

    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (str) {
            return !this.indexOf(str);
        };
    }

    //indexOf polyfill
    // Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement, fromIndex) {

            var k;

            // 1. Let O be the result of calling ToObject passing
            //    the this value as the argument.
            if (this === null) {
                throw new TypeError('"this" is null or not defined');
            }

            var O = Object(this);

            // 2. Let lenValue be the result of calling the Get
            //    internal method of O with the argument "length".
            // 3. Let len be ToUint32(lenValue).
            var len = O.length >>> 0;

            // 4. If len is 0, return -1.
            if (len === 0) {
                return -1;
            }

            // 5. If argument fromIndex was passed let n be
            //    ToInteger(fromIndex); else let n be 0.
            var n = +fromIndex || 0;

            if (Math.abs(n) === Infinity) {
                n = 0;
            }

            // 6. If n >= len, return -1.
            if (n >= len) {
                return -1;
            }

            // 7. If n >= 0, then Let k be n.
            // 8. Else, n<0, Let k be len - abs(n).
            //    If k is less than 0, then let k be 0.
            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            // 9. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ToString(k).
                //   This is implicit for LHS operands of the in operator
                // b. Let kPresent be the result of calling the
                //    HasProperty internal method of O with argument Pk.
                //   This step can be combined with c
                // c. If kPresent is true, then
                //    i.  Let elementK be the result of calling the Get
                //        internal method of O with the argument ToString(k).
                //   ii.  Let same be the result of applying the
                //        Strict Equality Comparison Algorithm to
                //        searchElement and elementK.
                //  iii.  If same is true, return k.
                if (k in O && O[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    }
};

module.exports = extend_natives;


},{}],26:[function(require,module,exports){
/* global $*/
'use strict';

var formbuilder = {
    current_form_ref: '',
    current_form_index: '',
    current_input_ref: '',
    is_sorting: false,
    from_index: 0,
    to_index: 0,
    possible_answers: {
        enabled_sortable: [],
        from_index: 0,
        to_index: 0
    },
    state: [],
    dom: {
        input_properties: '',
        input_properties_forms_wrapper: '',
        input_properties_buttons: '',
        input_properties_no_input_selected: '',
        inputs_collection: '',
        inputs_collection_sortable: '',
        partials: {},
        input_properties_views: {}
    },
    branch: {},
    project_definition: {},//this gets loaded dynamically

    setup: function (ref, partials, views) {

        //set refs for current form (always top parent, on load)
        formbuilder.current_form_ref = ref;
        formbuilder.current_form_index = 0;
        formbuilder.possible_answers_pagination = {};

        /* cache static dom selectors to speed up dynamic queries
         and also for consistent and quick access throughout the code as
         we are abstracting the dom access away a little bit

         to get the dom element, we concatenate find() calls, as it is faster
         http://jsperf.com/find-chaining/2
         */
        formbuilder.dom = {
            overlay: $('.wait-overlay'),
            loader: $('.loader'),
            navbar: $('.navbar'),
            forms_tabs: $('.main .main__tabs'),
            forms_tabs_content: $('.main .main__tabs-content'),
            save_project_btn: $('.main__tabs-btns .btn-group .main__tabs__save-project-btn'),
            undo_btn: $('.main__tabs-btns .btn-group .main__tabs__undo-btn'),
            main_container: $('.container-fluid'),
            input_properties: $('#' + ref + '-input-properties.input-properties'),
            input_properties_forms_wrapper: $('#' + ref + '-input-properties.input-properties > .panel > .panel-body.input_properties__forms_wrapper'),
            input_properties_buttons: $('#' + ref + '-input-properties .input-properties__buttons'),
            input_properties_no_input_selected: $('.input-properties__no-input-selected'),
            inputs_collection: $('#' + ref + '-inputs-collection.inputs-collection'),
            inputs_collection_sortable: $('#' + ref + '-inputs-collection.inputs-collection .panel .panel-body'),
            inputs_tools_draggable: $('ul#inputs-tools-list li div.input')
        };

        if ($.isEmptyObject(formbuilder.dom.partials) && partials) {
            formbuilder.dom.partials = partials;
        }

        if ($.isEmptyObject(formbuilder.dom.input_properties_views) && views) {
            formbuilder.dom.input_properties_views = views;
        }

        formbuilder.isOpeningFileBrowser = false;

        console.log('formbuilder object ready');
    }
};


module.exports = formbuilder;

},{}],27:[function(require,module,exports){
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
        CircularJSON = utils.JSONPolyfill;
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


},{"actions/parse":5,"actions/undo":22,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/ui":36,"helpers/utils":37,"ui-handlers/draggable":77,"ui-handlers/event-handler-callbacks/delete-all-questions-click-callback":79,"ui-handlers/event-handler-callbacks/export-form-click-callback":81,"ui-handlers/event-handler-callbacks/form-tab-click-callback":82,"ui-handlers/event-handler-callbacks/import-form-click-callback":83,"ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback":87,"ui-handlers/event-handler-callbacks/input-properties-advanced-tab-click-callback":88,"ui-handlers/event-handler-callbacks/input-properties-change-callback":89,"ui-handlers/event-handler-callbacks/input-properties-click-callback":90,"ui-handlers/event-handler-callbacks/input-properties-focus-callback":91,"ui-handlers/event-handler-callbacks/input-properties-keyup-callback":92,"ui-handlers/event-handler-callbacks/input-properties-title-checkbox-callback":93,"ui-handlers/event-handler-callbacks/modal-form-callback":94,"ui-handlers/event-handler-callbacks/modal-regex-callback":95,"ui-handlers/event-handler-callbacks/print-as-pdf-click-callback":96,"ui-handlers/event-handler-callbacks/save-project-click-callback":97,"ui-handlers/sortable":100}],28:[function(require,module,exports){
'use strict';

var consts = require('config/consts');

var messages = {

    labels: {
        EDITING_FORM: 'Form > ',
        EDITING_BRANCH: 'Branch > ',
        EDITING_GROUP: 'Group > ',
        EDITING_NESTED_GROUP: ' Group: ',
        EXIT_EDITING: 'Back',
        ADD_BRANCH_INPUTS_HERE: 'Add branch questions here',
        ADD_GROUP_INPUTS_HERE: 'Add group questions here'
    },
    success: {
        INPUT_VALID: 'Question valid!',
        FORM_IMPORTED: 'Form import succeeded!',
        POSSIBLE_ANSWERS_IMPORTED: 'Possible answers import succeeded!',
        PROJECT_SAVED: 'Project saved!',
        JUMP_DELETED: 'Jump deleted!',//this should be a warning
        INPUT_COPIED: 'Question copied!'
    },
    error: {
        FORM_CANNOT_BE_DELETED: 'Form cannot be deleted',
        FORM_NAME_EMPTY: 'Form name cannot be empty',
        FORM_NAME_INVALID: 'Form name is invalid',
        FORM_FILE_INVALID: 'Form file is invalid',
        FORM_IS_INVALID: 'Form is invalid',
        FORM_NAME_EXIST: 'Form name exists',
        INPUT_NOT_VALID: 'Question NOT valid!',
        INPUT_NOT_SELECTED: 'No question selected',
        POSSILE_ANSWERS_CUSTOM_ID_CANNOT_SWITCH_BACK: 'Cannot switch back to basic mode',
        QUESTION_TEXT_EMPTY: 'This field cannot be empty',
        POSSIBLE_ANSWER_EMPTY: 'Answer text cannot be empty',
        POSSIBLE_ANSWER_DUPLICATED_IDENTIFIER: 'Duplicated identifier, please remove',
        VALUE_MUST_BE_INTEGER: 'Value must be an integer',
        MIN_MUST_BE_SMALLER_THAN_MAX: 'Min value must be smaller than Max',
        INITIAL_ANSWER_OUT_OF_RANGE: 'Value is out of range',
        INITIAL_ANSWER_NOT_MATCHING_REGEX: 'Value does not match regex',
        INITIAL_ANSWER_NOT_PHONE_NUMBER: 'Value is not a phone number',
        NO_QUESTION_TEXT_YET: 'No question text yet',
        NO_BRANCH_HEADER_YET: 'No branch header yet',
        NO_GROUP_HEADER_YET: 'No group header yet',
        NO_BRANCH_INPUTS_FOUND: 'No branch questions found',
        NO_GROUP_INPUTS_FOUND: 'No group questions found',
        INVALID_BRANCH_INPUTS: 'There are invalid branch questions',
        INVALID_GROUP_INPUTS: 'There are invalid group questions',
        JUMP_CONDITION_NOT_SELECTED: 'You must choose a condition',
        JUMP_ANSWER_NOT_SELECTED: 'You must choose an answer',
        JUMP_DESTINATION_NOT_SELECTED: 'You must choose a valid destination',
        JUMP_DESTINATION_INVALID: 'Invalid destination',
        PROJECT_NOT_SAVED: 'Project error!',
        JUMP_INVALID: 'Invalid jump on question:',
        JUMPS_INVALID: 'Some jumps are invalid',
        POSSIBLE_ANSWERS_INVALID: 'Some possible answers are invalid',
        CSV_FILE_INVALID: 'CSV file is invalid!',
        BROWSER_NOT_SUPPORTED: 'Browser not supported',
        MAX_QUESTIONS_LIMIT_REACHED: 'Questions limit reached for this form!',
        TOO_MANY_SEARCH_QUESTIONS: 'Too many search questions, only ' + consts.LIMITS.search_inputs_max + '  per project are allowed!',
        TOO_MANY_TITLES: 'Too many titles',
        TOO_MANY_QUESTIONS_FOR_CURRENT_FORM: 'Too many questions for this form: ',
        QUESTION_LENGTH_LIMIT_EXCEEDED: 'Characters limit exceeded'
    },
    warning: {
        POSSIBILE_ANSWER_HAS_LINKED_JUMP: 'There is a jump linked to this answer, please remove it first!',
        INPUT_DELETED: 'Question deleted!',
        FORM_DELETED: 'Form deleted!',
        SEARCH_INPUTS_LIMIT_REACHED: 'Search questions limit reached!'
    }
};

module.exports = messages;

},{"config/consts":24}],29:[function(require,module,exports){
'use strict';
var options = {
    closeButton: true,
    positionClass: 'toast-top-center',
    preventDuplicates: true,
    onclick: null,
    showDuration: 500,
    hideDuration: 500,
    extendedTimeOut: 0,
    showMethod: 'fadeIn',
    hideMethod: 'fadeOut'
};

var toast = {
    showSuccess: function (message) {
        options.timeOut = 2000;
        window.toastr.options = options;
        window.toastr.success(message);
    },

    showError: function (message, timeout) {
        options.timeOut = timeout || 0;
        window.toastr.options = options;
        window.toastr.error(message);
    },

    showWarning: function (message, timeout) {
        options.timeOut = timeout || 0;
        window.toastr.options = options;
        window.toastr.warning(message);
    },

    clear: function () {
        window.toastr.clear();
    }
};

module.exports = toast;


},{}],30:[function(require,module,exports){
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

},{"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/ui":36,"helpers/utils":37,"ui-handlers/event-handler-callbacks/delete-all-questions-click-callback":79,"ui-handlers/event-handler-callbacks/delete-form-click-callback":80,"ui-handlers/event-handler-callbacks/export-form-click-callback":81,"ui-handlers/event-handler-callbacks/import-form-click-callback":83,"ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback":87,"ui-handlers/event-handler-callbacks/input-properties-click-callback":90,"ui-handlers/event-handler-callbacks/input-properties-focus-callback":91,"ui-handlers/event-handler-callbacks/input-properties-keyup-callback":92,"ui-handlers/event-handler-callbacks/input-properties-title-checkbox-callback":93,"ui-handlers/event-handler-callbacks/print-as-pdf-click-callback":96,"ui-handlers/event-handler-callbacks/save-project-click-callback":97,"ui-handlers/sortable":100}],31:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var AudioInput = require('inputs/audio');
var BarcodeInput = require('inputs/barcode');
var BranchInput = require('inputs/branch');
var CheckboxInput = require('inputs/checkbox');
var DateInput = require('inputs/date');
var DropdownInput = require('inputs/dropdown');
var LocationInput = require('inputs/location');
var NumericInput = require('inputs/integer');
var PhotoInput = require('inputs/photo');
var PhoneInput = require('inputs/phone');
var RadioInput = require('inputs/radio');
var TextInput = require('inputs/text');
var TextareaInput = require('inputs/textarea');
var ReadmeInput = require('inputs/readme');
var TimeInput = require('inputs/time');
var VideoInput = require('inputs/video');
var GroupInput = require('inputs/group');
var SearchInput = require('inputs/search');
var formbuilder = require('config/formbuilder');
var possible_answers = require('actions/possible-answers');
var jumps = require('actions/jumps');
var template = require('template');

/**
 * Define an interface for creating an object, but let subclasses decide which class to instantiate.
 * Factory Method lets a class defer instantiation to subclasses.
 */
var input_factory = {

    //set default input as type text
    type: TextInput,

    //create input based on type, set also index unique to each input
    createInput: function (the_type, the_input_ref) {

        var type = the_type;
        var input_ref = the_input_ref;

        switch (type) {
            case consts.AUDIO_TYPE:
                this.type = AudioInput;
                break;
            case consts.BARCODE_TYPE:
                this.type = BarcodeInput;
                break;
            case consts.BRANCH_TYPE:
                this.type = BranchInput;
                break;
            case consts.CHECKBOX_TYPE:
                this.type = CheckboxInput;
                break;
            case consts.DATE_TYPE:
                this.type = DateInput;
                break;
            case consts.DROPDOWN_TYPE:
                this.type = DropdownInput;
                break;
            case consts.GROUP_TYPE:
                this.type = GroupInput;
                break;
            case consts.LOCATION_TYPE:
                this.type = LocationInput;
                break;
            case consts.INTEGER_TYPE:
                this.type = NumericInput;
                break;
            case consts.DECIMAL_TYPE:
                this.type = NumericInput;
                break;
            case consts.PHONE_TYPE:
                this.type = PhoneInput;
                break;
            case consts.PHOTO_TYPE:
                this.type = PhotoInput;
                break;
            case consts.RADIO_TYPE:
                this.type = RadioInput;
                break;
            case consts.TEXT_TYPE:
                this.type = TextInput;
                break;
            case consts.TEXTAREA_TYPE:
                this.type = TextareaInput;
                break;
            case consts.README_TYPE:
                this.type = ReadmeInput;
                break;
            case consts.TIME_TYPE:
                this.type = TimeInput;
                break;
            case consts.VIDEO_TYPE:
                this.type = VideoInput;
                break;
            case consts.SEARCH_SINGLE_TYPE:
                this.type = SearchInput;
                break;
            case consts.SEARCH_MULTIPLE_TYPE:
                this.type = SearchInput;
                break;
        }

        return new this.type(input_ref);
    },

    //remove input from dom and memory
    removeInput: function (the_ref) {

        var undo = require('actions/undo');
        var input_ref = the_ref;
        var input_index = utils.getInputCurrentIndexByRef(input_ref);
        var input = utils.getInputObjectByRef(input_ref);

        //remove element from global array in memory
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs.splice(input_index, 1);

        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties.find('div.panel-body form[data-input-ref="' + input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable.find('div.input[data-input-ref="' + input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //after deletion no input is selected, show message and hide context buttons
        formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
        //show action button for input
        formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

        //remove track of this input
        formbuilder.current_input_ref = undefined;
        if (input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {
            if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max - 1)) {
                ui.input_tools.showSearchInput();
            }
        }
    },

    //remove branch input from dom and memory
    removeBranchInput: function (the_owner_input_ref, the_branch_input_ref) {

        var owner_input_ref = the_owner_input_ref;
        var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
        var branch_input_ref = the_branch_input_ref;
        var branch_input_index = utils.getBranchInputCurrentIndexByRef(owner_input_index, branch_input_ref);
        var form_index = formbuilder.current_form_index;
        var branch_inputs = formbuilder.project_definition.data.project.forms[form_index].inputs[owner_input_index].branch;

        //remove element from global object in memory (and store the removed element for later use)
        var branch_input = branch_inputs.splice(branch_input_index, 1)[0];

        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties.find('div.panel-body form[data-input-ref="' + branch_input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable.find('div.input[data-input-ref="' + branch_input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //after deletion no branch input is selected, so show message and hide context buttons
        formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
        //hide action button for input
        formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

        //if branch is empty, show message
        if (branch_inputs.length === 0) {
            formbuilder.dom.inputs_collection_sortable.find('.active-branch').find('.input-properties__no-branch-questions-message').show();

            //show invalid icon in active branch
            ui.inputs_collection.showInputInvalidIcon(formbuilder.branch.active_branch_ref);

            //set the form as invalid
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);
        }

        //remove track of this input
        formbuilder.branch.current_input_ref = undefined;

        if (branch_input.type === consts.SEARCH_SINGLE_TYPE || branch_input.type === consts.SEARCH_MULTIPLE_TYPE) {
            //update search inputs total
            if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max -1)) {
                ui.input_tools.showSearchInput();
            }
        }
    },

    //remove branch input from dom and memory
    removeGroupInput: function (the_owner_input_ref, the_group_input_ref) {

        var owner_input_ref = the_owner_input_ref;
        var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
        var group_input_ref = the_group_input_ref;
        var group_input_index = utils.getGroupInputCurrentIndexByRef(owner_input_index, group_input_ref);
        var form_index = formbuilder.current_form_index;
        var group_inputs = formbuilder.project_definition.data.project.forms[form_index].inputs[owner_input_index].group;

        //remove element from global object in memory (and store the removed element for later use)
        var group_input = group_inputs.splice(group_input_index, 1)[0];

        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties.find('div.panel-body form[data-input-ref="' + group_input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable.find('div.input[data-input-ref="' + group_input_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //after deletion no group input is selected, so show message and hide context buttons
        formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
        //hide action button for input
        formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

        //if group is empty, show message
        if (group_inputs.length === 0) {
            formbuilder.dom.inputs_collection_sortable.find('.active-group').find('.input-properties__no-group-questions-message').show();

            //show invalid icon in active branch
            ui.inputs_collection.showInputInvalidIcon(formbuilder.group.active_group_ref);

            //set the form as invalid
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);
        }

        //remove track of this input
        formbuilder.group.current_input_ref = undefined;

        if (group_input.type === consts.SEARCH_SINGLE_TYPE || group_input.type === consts.SEARCH_MULTIPLE_TYPE) {
            if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max -1)) {
                ui.input_tools.showSearchInput();
            }
        }
    },

    removeNestedGroupInput: function (the_owner_input_branch_ref, the_nested_group_ref) {

        var nested_group_ref = the_nested_group_ref;
        var form_index = formbuilder.current_form_index;
        var owner_input_index = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);
        var owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
        var owner_branch_index = utils.getBranchInputCurrentIndexByRef(owner_input_index, formbuilder.branch.current_input_ref);
        var nested_group_index = utils.getNestedGroupInputCurrentIndexByRef(owner_branch, nested_group_ref);
        var nested_group_inputs = formbuilder.project_definition.data.project
            .forms[form_index]
            .inputs[owner_input_index]
            .branch[owner_branch_index]
            .group;

        //remove element from global object in memory (and store the removed element for later use)
        var nested_group_input = nested_group_inputs.splice(nested_group_index, 1)[0];

        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties.find('div.panel-body form[data-input-ref="' + nested_group_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable.find('div.input[data-input-ref="' + nested_group_ref + '"]').fadeOut(consts.ANIMATION_FAST).remove();

        //after deletion no group input is selected, so show message and hide context buttons
        formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
        //hide action button for input
        formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

        //if group is empty, show message
        if (nested_group_inputs.length === 0) {
            formbuilder.dom.inputs_collection_sortable.find('.active-group').find('.input-properties__no-group-questions-message').show();

            //show invalid icon in active branch
            ui.inputs_collection.showInputInvalidIcon(formbuilder.group.active_group_ref);

            //set the form as invalid
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);
        }

        //remove track of this input
        formbuilder.group.current_input_ref = undefined;

        if (nested_group_input.type === consts.SEARCH_SINGLE_TYPE || nested_group_input.type === consts.SEARCH_MULTIPLE_TYPE) {
            if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max -1)) {
                ui.input_tools.showSearchInput();
            }
        }
    },

    //todo this is a bit of code duplication, to be refactored
    showGroupInputPropertiesDom: function (the_group_input_index) {

        var form_index = formbuilder.current_form_index;
        var owner_input_ref = formbuilder.current_input_ref;
        var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
        var group_input_index = the_group_input_index;
        var group_input = formbuilder.project_definition.data.project.forms[form_index].inputs[owner_input_index].group[group_input_index];
        var input_properties_forms_wrapper = formbuilder.dom.input_properties_forms_wrapper;
        var view = formbuilder.dom.input_properties_views[group_input.type];

        input_properties_forms_wrapper.append(view).hide().fadeIn(consts.ANIMATION_FAST);

        //init properties panel
        //todo
        //helpers.initInputPropertiesPanel(input_properties_forms_wrapper, group_input, formbuilder.dom.partials);
    },

    //todo this is a bit of code duplication, to be refactored
    showNestedGroupInputPropertiesDom: function (the_nested_group_input_index) {


        console.log(formbuilder.project_definition.data.project.forms);

        var form_index = formbuilder.current_form_index;
        var branch_index = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);
        var group_index = utils.getBranchInputCurrentIndexByRef(branch_index, formbuilder.group.active_group_ref);
        var nested_group_index = the_nested_group_input_index;
        var nested_group_input = formbuilder.project_definition.data.project
            .forms[form_index]
            .inputs[branch_index]
            .branch[group_index]
            .group[nested_group_index];

        var input_properties_forms_wrapper = formbuilder.dom.input_properties_forms_wrapper;
        var view = formbuilder.dom.input_properties_views[nested_group_input.type];

        input_properties_forms_wrapper.append(view).hide().fadeIn(consts.ANIMATION_FAST);

    },

    createInputToolHTML: function (input) {
        return template.createInputToolHTML(input);
    },

    createPropertiesHTML: function (input) {
        return template.createPropertiesHTML(input);
    },
    getAdvancedTabBtnHTML: function (ref, is_active) {
        return template.getAdvancedTabBtnHTML(ref, is_active);
    },
    getJumpTabBtnHTML: function (ref, is_active) {
        return template.getJumpTabBtnHTML(ref, is_active);
    }
};

module.exports = input_factory;

},{"actions/jumps":4,"actions/possible-answers":13,"actions/undo":22,"config/consts":24,"config/formbuilder":26,"helpers/ui":36,"helpers/utils":37,"inputs/audio":38,"inputs/barcode":39,"inputs/branch":40,"inputs/checkbox":41,"inputs/date":42,"inputs/dropdown":43,"inputs/group":44,"inputs/integer":45,"inputs/location":46,"inputs/phone":47,"inputs/photo":48,"inputs/radio":49,"inputs/readme":50,"inputs/search":51,"inputs/text":52,"inputs/textarea":53,"inputs/time":54,"inputs/video":55,"template":62}],32:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var possible_answers = require('actions/possible-answers');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var template = require('template');

var InputMultipleAnswers = function () {
};

InputMultipleAnswers.prototype.prepareAdvancedInputProperties = function (view) {
    return template.prepareAdvancedInputProperties(view, this);
};

InputMultipleAnswers.prototype.setAdvancedInputProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    this.dom.advanced_properties_wrapper
        .find('div.panel-body div.input-properties__form__advanced-properties__default select option[value="' + this.default + '"]').prop('selected', true);

    //set 'input_ref' on 'uniqueness' option
    //  ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);

};

InputMultipleAnswers.prototype.saveAdvancedProperties = function () {

    var self = this;

    self.dom.advanced_properties_wrapper = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__advanced-properties');
    //set default
    this.default = this.dom.advanced_properties_wrapper
        .find('div.panel-body div.input-properties__form__advanced-properties__default select option:selected')
        .val();

    if (this.default === 'None') {
        this.default = null;
    }

    //for SEARCH type, save if the search allow a single answer or multiple answers
    if (self.type === consts.SEARCH_SINGLE_TYPE || self.type === consts.SEARCH_MULTIPLE_TYPE) {

        //set single or multiple search type
        self.type = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__search input:checked').val();
    }

};

InputMultipleAnswers.prototype.hidePropertiesErrors = function () {
    errors.hidePropertiesErrors(this.dom.properties_panel);
    errors.hidePossibleAnswersErrors(this);
};

InputMultipleAnswers.prototype.addPossibleAnswer = function () {
    possible_answers.addPossibleAnswer(this);
};

InputMultipleAnswers.prototype.removePossibleAnswer = function (the_answer_index) {
    possible_answers.removePossibleAnswer(this, the_answer_index);
};


InputMultipleAnswers.prototype.savePossibleAnswers = function () {
    save.savePossibleAnswers(this);
};
InputMultipleAnswers.prototype.showPossibleAnswerErrors = function (the_possible_answer, the_error_message) {
    errors.showPossibleAnswerErrors(the_possible_answer, the_error_message);
};
InputMultipleAnswers.prototype.hidePossibleAnswersErrors = function (the_possible_answers) {
    errors.hidePossibleAnswersErrors(this, the_possible_answers);
};
InputMultipleAnswers.prototype.isPossibleAnswerValid = function (the_answer) {
    //validate possible answer
    return validation.isPossibleAnswerValid(the_answer);
};

/*
 update the selected possible answers for the jumps, in case the possible answers got changed by the user
 this is to refresh the dom when the user change a possible answer text and then switches to the jumps panel:
 if an old option was selected, we reflect that change on the dom
 */
InputMultipleAnswers.prototype.updateJumpPossibleAnswers = function (the_jump_panel) {
    possible_answers.updateJumpPossibleAnswers(this, the_jump_panel);
};

InputMultipleAnswers.prototype.updatePossibleInitialAnswers = function () {
    possible_answers.updatePossibleInitialAnswers(this);
};

InputMultipleAnswers.prototype.listPossibleInitialAnswers = function () {
    possible_answers.listPossibleInitialAnswers(this);
};

InputMultipleAnswers.prototype.addJump = function () {

    var self = this;

    //set "Add Jump" button reference (so it is available when playing with jumps)
    self.dom.add_jump_button = formbuilder.dom.input_properties
        .find('.panel-body form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__jumps__add-jump');

    $.when(jumps.addJump(self, true)).then(function () {

        //disable add jump button if total of jumps is equal to total of possible answers
        if (self.jumps.length === self.possible_answers.length) {
            self.dom.add_jump_button.attr('disabled', true);
        }
    });
};

//override the existing method, as we need an extra check for these types of input
InputMultipleAnswers.prototype.removeJump = function (the_remove_btn) {

    var self = this;

    //set "Add Jump" button reference (so it is available when playing with jumps)
    self.dom.add_jump_button = formbuilder.dom.input_properties
        .find('.panel-body form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__jumps__add-jump');

    jumps.removeJump(self, the_remove_btn);

    //enable button if we removed last jump
    if (self.jumps.length === 0) {
        //enable add jump button
        self.dom.add_jump_button.attr('disabled', false);
    }
    else {
        //enable button if we can add jumps
        if (self.jumps.length < self.possible_answers.length) {
            self.dom.add_jump_button.attr('disabled', false);
        }
    }
};

module.exports = InputMultipleAnswers;

},{"actions/errors":2,"actions/jumps":4,"actions/possible-answers":13,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"helpers/ui":36,"helpers/utils":37,"template":62}],33:[function(require,module,exports){
'use strict';

//input base properties
var inputs_properties = {

    //top level, to be exported when saving project
   // index: null,
    ref: null,
    type: '',
    question: '',
    is_title: false,
    is_required: false,
    uniqueness: 'none',
    regex: null,
    default: null,
    verify: false,
    max: null,
    min: null,
    datetime_format: null,
    set_to_current_datetime: false,
    possible_answers: [],
    jumps: [],
    branch: [],
    group: []

    /**************************************************************************************************************/
    //this property is not declared here anymore as with jquery the dom is cached and stays the same per each object,
    //so I will add them later after the object is instantiated
    ///* DOM properties*/
    //dom: {
    //    is_valid: false, //false by default as we sdo not have a question text after drag and drop
    //    advanced_properties_wrapper: null,
    //    add_jump_button: null,
    //    properties_panel:null
    //}
    /**************************************************************************************************************/
};

module.exports = inputs_properties;

},{}],34:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var template = require('template');


var Input = function () {
};

Input.prototype.prepareAdvancedInputProperties = function () {
    //override in specific input type
};

Input.prototype.isQuestionTextValid = function () {
    //validate question text
    return validation.isQuestionTextValid(this);
};

Input.prototype.hideQuestionErrors = function () {
    this.hidePropertiesErrors();
};
Input.prototype.showQuestionErrors = function (the_error_message) {
    this.showPropertiesErrors(the_error_message);
};

Input.prototype.isInitialAnswerValid = function () {
    //validate initial answer
    return validation.isInitialAnswerValid(this.type, this.default, this.regex);
};

Input.prototype.isJumpValid = function (the_jump_properties) {
    //validate initial answer
    return validation.isJumpValid(the_jump_properties, this);
};

Input.prototype.saveProperties = function () {
    save.saveProperties(this);
};

Input.prototype.saveAdvancedProperties = function () {
    save.saveAdvancedProperties(this);
};

Input.prototype.saveJumps = function () {
    save.saveJumps(this);
};

Input.prototype.showPropertiesErrors = function (the_error_message) {
    errors.showQuestionTextErrors(this.dom.properties_panel, the_error_message);
};

Input.prototype.hidePropertiesErrors = function () {
    errors.hidePropertiesErrors(this.dom.properties_panel);
};

Input.prototype.showAdvancedPropertiesErrors = function (the_invalid_property, the_error_message) {
    errors.showSingleAdvancedPropertyError(this.dom.advanced_properties_wrapper, the_invalid_property, the_error_message);
};

Input.prototype.hideAdvancedPropertiesErrors = function () {
    //override in specific input type
};

Input.prototype.addJump = function () {

    var self = this;

    //set "Add Jump" button reference (so it is available when playing with jumps)
    self.dom.add_jump_button = formbuilder.dom.input_properties
        .find('.panel-body form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__jumps__add-jump');

    $.when(jumps.addJump(this)).then(function () {
        //disable add jump button as this input type only allows to set a single jump
        self.dom.add_jump_button.attr('disabled', true);
    });
};

Input.prototype.removeJump = function (the_remove_btn) {

    var self = this;

    self.dom.add_jump_button = formbuilder.dom.input_properties
        .find('.panel-body form[data-input-ref="' + self.ref + '"]')
        .find('.input-properties__form__jumps__add-jump');

    jumps.removeJump(this, the_remove_btn);

    if (this.jumps.length === 0) {
        //enable add jump button
        this.dom.add_jump_button.attr('disabled', false);
    }
};

Input.prototype.showSingleJumpErrors = function (the_jump_item, the_jump_properties) {
    errors.showSingleJumpErrors(the_jump_item, the_jump_properties);
};
Input.prototype.hideJumpsErrors = function (the_jumps_list) {
    errors.hideJumpsErrors(the_jumps_list);
};

module.exports = Input;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"helpers/ui":36,"helpers/utils":37,"template":62}],35:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var utils = require('helpers/utils');

var valid_date_formats = [
    consts.DATE_FORMAT_1,
    consts.DATE_FORMAT_2,
    consts.DATE_FORMAT_3,
    consts.DATE_FORMAT_4,
    consts.DATE_FORMAT_5
];

var valid_time_formats = [
    consts.TIME_FORMAT_1,
    consts.TIME_FORMAT_2,
    consts.TIME_FORMAT_3,
    consts.TIME_FORMAT_4,
    consts.TIME_FORMAT_5
];

var import_form_validation = {

    hasValidFormStructure: function (form) {

        var validFormStructure = {
            data: {
                id: '',
                type: 'form',
                form: {
                    ref: '',
                    name: '',
                    slug: '',
                    type: 'hierarchy',
                    inputs: []
                }
            }
        };

        //compare a valid object against the imported form object if they have the same keys
        if (!utils.hasSameProps(validFormStructure, form)) {
            return false;
        }

        //data type must be form
        if (form.data.type !== 'form') {
            return false;
        }

        //form type must be hierarchy
        if (form.data.form.type !== 'hierarchy') {
            return false;
        }

        //ref, name, slug and inputs props are not considered here
        return true;
    },

    areJumpsValid: function (input) {

        var jumps = input.jumps;
        var are_valid = true;
        var possible_answers = input.possible_answers;
        var validJumpStructure = {
            to: '',
            when: '',
            answer_ref: ''
        };

        var answer_ref_regex = new RegExp(consts.REGEX.possible_answer_ref);

        if (!$.isArray(jumps)) {
            are_valid = false;
        }
        else {
            $(jumps).each(function (index, jump) {

                var answer_ref_found = false;

                //validate structure
                if (!utils.hasSameProps(validJumpStructure, jump)) {
                    are_valid = false;
                    return false;
                }

                //if answer_ref is in invalid format, bail out (can be null, we catch that later)
                if (jump.answer_ref) {
                    if (!answer_ref_regex.test(jump.answer_ref)) {
                        are_valid = false;
                        return false;
                    }
                }

                //validate jumps properties values
                if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) > -1) {
                    // multiple choice input
                    //jump "to" value must be an existing "forward" input_ref
                    //todo need next inputs

                    //jump "to" must exist in possible answers (it is the answer_ref)
                    // only if "when" is not either ALL or NO_ANSWER_GIVEN
                    if (!(jump.when === 'ALL' || jump.when === 'NO_ANSWER_GIVEN')) {
                        $(possible_answers).each(function (index, possible_answer) {
                            if (jump.answer_ref === possible_answer.answer_ref) {
                                answer_ref_found = true;
                            }
                        });

                        if (!answer_ref_found) {
                            are_valid = false;
                            return false;
                        }
                    }
                }
                else {
                    //single question, jump "when" must be set to ALL
                    if (jump.when !== 'ALL') {
                        are_valid = false;
                        return false;
                    }
                }

                // If we have an empty 'to' - error
                // If we have an empty 'when' - error
                // If we have an empty 'answer_ref' and 'when' is not 'ALL' or 'NO_ANSWER_GIVEN' - error
                if (!jump.to || !jump.when ||
                    (!jump.answer_ref && !(jump.when === 'ALL' || jump.when === 'NO_ANSWER_GIVEN'))
                ) {
                    are_valid = false;
                    return false;
                }

                //validate "when" prop, must be one of the jump conditions
                var isValidWhenProperty = false;
                $(consts.JUMP_CONDITIONS).each(function (index, condition) {
                    if (condition.key === jump.when) {
                        isValidWhenProperty = true;
                        return false;
                    }
                });
                if (!isValidWhenProperty) {
                    are_valid = false;
                    return false;
                }

            });
        }

        return are_valid;
    },

    areJumpsDestinationsValid: function (inputs) {

        var all_jumps_valid = true;

        $(inputs).each(function (inputIndex, input) {

            //get valid jump destinations
            var jump_destinations = utils.getJumpAvailableDestinationsAsKeys(inputIndex, input, inputs, false);

            //extra validation for jumps, check if the destination still exists and it is valid
            $(input.jumps).each(function (jumpIndex, jump) {
                //does the jump "to" property reference a valid destination input?
                if (!jump_destinations[jump.to]) {
                    //invalid destination found
                    all_jumps_valid = false;
                }
            });

            //validate branch jumps
            $(input.branch).each(function (branchInputIndex, branch_input) {

                jump_destinations = utils.getJumpAvailableDestinationsAsKeys(branchInputIndex, branch_input, input.branch, true);

                //extra validation for jumps, check if the destination still exists and it is valid
                $(branch_input.jumps).each(function (branchJumpIndex, branchJump) {
                    //does the jump "to" property reference a valid destination input?
                    if (!jump_destinations[branchJump.to]) {
                        //invalid destination found
                        all_jumps_valid = false;
                    }
                });
            });
        });

        return all_jumps_valid;
    },

    arePossibleAnswersValid: function (possible_answers, input_type) {

        var answer_ref_regex = new RegExp(consts.REGEX.possible_answer_ref);
        var answer_refs = [];
        var validPossibleAnswerStructure = {
            answer: '',
            answer_ref: ''//this must be unique
        };

        if (!$.isArray(possible_answers)) {
            return false;
        }
        else {
            //check possible answer total is within limits
            if (possible_answers.length > consts.LIMITS.possible_answers_max) {
                //is this a search type?
                if (input_type === consts.SEARCH_MULTIPLE_TYPE || input_type === consts.SEARCH_SINGLE_TYPE) {
                    //limit is higher for search type
                    if (possible_answers.length > consts.LIMITS.possible_answers_max_search) {
                        return false;
                    }
                }
                else {
                    return false;
                }

            }

            //at least 1 possible answer
            if (possible_answers.length === 0) {
                return false;
            }

            //check possible answer structure
            var are_possible_answer_valid = true;
            $(possible_answers).each(function (key, possible_answer) {

                answer_refs.push(possible_answer.answer_ref);

                if (typeof possible_answer.answer_ref !== 'string' || typeof possible_answer.answer !== 'string') {
                    are_possible_answer_valid = false;
                    return false;
                }

                //check answer_ref length
                if (possible_answer.answer_ref.length !== consts.LIMITS.possible_answer_ref_length) {
                    are_possible_answer_valid = false;
                    return false;
                }

                //check answer_ref to be hex characters
                if (!answer_ref_regex.test(possible_answer.answer_ref)) {
                    are_possible_answer_valid = false;
                    return false;
                }

                //check answer max length
                if (possible_answer.answer.length === 0 || possible_answer.answer.length > consts.LIMITS.possible_answer_max_length) {
                    are_possible_answer_valid = false;
                    return false;
                }

                //possible_answer cannot be empty
                if (possible_answer.answer === '') {
                    are_possible_answer_valid = false;
                    return false;
                }

                //strip html tags from possible answers answer prop
                possible_answer.answer = possible_answer.answer.replace(/(<([^>]+)>)/ig, ' ');

                if (!utils.hasSameProps(validPossibleAnswerStructure, possible_answer)) {
                    are_possible_answer_valid = false;
                    return false;
                }

                ////check for answer_ref uniqueness
                ////note: this has bad performance with big arrays
                //var hasDuplicateAnswerRef = answer_refs.some(function (ref, index) {
                //    return answer_refs.indexOf(ref) !== index;
                //});

                var seen = {};
                var hasDuplicateAnswerRef = possible_answers.some(function (possible_answer) {
                    return seen.hasOwnProperty(possible_answer.answer_ref) || (seen[possible_answer.answer_ref] === false);
                });

                if (hasDuplicateAnswerRef) {
                    are_possible_answer_valid = false;
                    return false;
                }
            });

            if (!are_possible_answer_valid) {
                return false;
            }
        }

        return true;
    },

    isValidInput: function (form_ref, input, is_branch, is_group) {

        var self = this;
        var valid = true;
        var input_ref_regex = new RegExp(consts.REGEX.input_ref);
        var readme = '';

        var validInputStructure = {
            ref: '',
            type: '',
            question: '',
            is_title: true,
            is_required: false,
            uniqueness: '',
            regex: null,
            default: null,
            verify: false,
            max: null,
            min: null,
            datetime_format: null,
            set_to_current_datetime: false,
            possible_answers: [],
            jumps: [],
            branch: [],
            group: []
        };

        var accepted_types = [
            consts.TEXT_TYPE,
            consts.TEXTAREA_TYPE,
            consts.INTEGER_TYPE,
            consts.DECIMAL_TYPE,
            consts.DATE_TYPE,
            consts.TIME_TYPE,
            consts.RADIO_TYPE,
            consts.CHECKBOX_TYPE,
            consts.DROPDOWN_TYPE,
            consts.BARCODE_TYPE,
            consts.LOCATION_TYPE,
            consts.AUDIO_TYPE,
            consts.VIDEO_TYPE,
            consts.PHOTO_TYPE,
            consts.BRANCH_TYPE,
            consts.GROUP_TYPE,
            consts.README_TYPE,
            consts.PHONE_TYPE,
            consts.SEARCH_SINGLE_TYPE,
            consts.SEARCH_MULTIPLE_TYPE
        ];

        /**
         * Validate input structure
         */

        if (!utils.hasSameProps(validInputStructure, input)) {
            //it means the input structure is invalid
            return false;
        }

        /**
         * Validate ref
         */
        if (input.ref && typeof input.ref !== 'boolean') {
            if (!input.ref.startsWith(form_ref)) {
                return false;
            }
            //check ref structure
            if (!input_ref_regex.test(input.ref)) {
                return false;
            }

            // must have 3 components
            if (input.ref.split('_').length !== 3) {
                return false;
            }
        }
        else {
            return false;
        }

        //validate ref against regex
        //(todo)

        /**
         * Validate type
         */
        if ($.inArray(input.type, accepted_types) < 0 || typeof input.type !== 'string') {
            return false;
        }

        /**
         * Validate question
         */
        if (input.type === consts.README_TYPE) {
            //readme type is up to 1000 chars, html is allowed (server catches was it is not)
            if (typeof input.question !== 'string' || input.question === '') {
                return false;
            }

            //first convert html entities to tags
            readme = utils.decodeHtml(input.question);
            //then remove all tags
            readme = readme.replace(/(<([^>]+)>)/ig, ' ');

            //now check the lenght of the remaining pure text ;)
            if (readme.length > consts.LIMITS.readme_length) {
                return false;
            }
        }
        else {
            //any other question
            if (input.question.length > consts.LIMITS.question_length || typeof input.question !== 'string' || input.question === '') {
                return false;
            }
            else {
                input.question = input.question.replace(/(<([^>]+)>)/ig, ' ');
            }
        }


        /**
         * Validate is_title
         */

        if (typeof input.is_title !== 'boolean') {
            return false;
        }

        /**
         *  Validate is_required
         */
        if (typeof input.is_required !== 'boolean') {
            return false;
        }
        else {
            //check if we can have required set to true
            if ($.inArray(input.type, consts.REQUIRED_ALLOWED_TYPES) < 0 && input.is_required === true) {
                return false;
            }
        }

        /**
         * Validate uniqueness
         */
        if ($.inArray(input.type, consts.UNIQUENESS_ALLOWED_TYPES) < 0) {
            //uniquess must be "none"
            if (input.uniqueness !== consts.UNIQUESS_NONE) {
                return false;
            }
        }
        else {
            if (is_branch) {
                if (!(input.uniqueness === consts.UNIQUESS_NONE || input.uniqueness == consts.UNIQUESS_FORM)) {
                    return false;
                }
            }
            else {
                if (!(input.uniqueness === consts.UNIQUESS_NONE || input.uniqueness === consts.UNIQUESS_FORM || input.uniqueness == consts.UNIQUESS_HIERARCHY)) {
                    return false;
                }
            }
        }

        /**
         * Validate regex (can be null)
         */
        if (input.regex !== null && input.regex !== '') {
            if (input.regex.length > consts.LIMITS.regex_length || typeof input.regex !== 'string') {
                return false;
            }
        }
        else {
            //check if a regex is allowed for this input type?
            //todo

        }

        /**
         * Validate default answer
         */
        if (input.default !== null && input.default !== '') {
            if (input.default.length > consts.LIMITS.default_answer_length || typeof input.default !== 'string') {
                return false;
            }

            //multiple answers type?
            if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) > 0) {
                //check that the default answer (if set) is one of the possible answers
                var found = false;
                $(input.possible_answers).each(function (key, possible_answer) {
                    if (possible_answer.answer_ref === input.default) {
                        found = true;
                        return false;//exit the loop
                    }
                });

                if (!found) {
                    return false;
                }
            }
            else {
                //valid default answer, strip html tags
                input.default = input.default.replace(/(<([^>]+)>)/ig, ' ');
            }
        }

        /**
         * Validate verify
         */
        if (typeof input.verify !== 'boolean') {
            return false;
        }


        /**
         * validate max and min (for numeric types)
         */
        if (input.type === consts.INTEGER_TYPE || input.type === consts.DECIMAL_TYPE) {
            //check min, if it is set must be numeric. can be null
            if (input.min) {

                if (input.type === consts.INTEGER_TYPE && !utils.isInteger(parseInt(input.min))) {
                    return false;
                }

                if (input.type === consts.DECIMAL_TYPE && !$.isNumeric(input.min)) {
                    return false;
                }

                if (input.min.toString().length > consts.LIMITS.min_value_length) {
                    return false;
                }

            }

            //check min, if it is set must be numeric. can be null
            if (input.max) {

                //bail if not integer for integer type
                if (input.type === consts.INTEGER_TYPE && !utils.isInteger(parseInt(input.max))) {
                    return false;
                }

                //bail if not numeric for decimal type
                if (input.type === consts.DECIMAL_TYPE && !$.isNumeric(input.max)) {
                    return false;
                }

                if (input.max.toString().length > consts.LIMITS.max_value_length) {
                    return false;
                }
            }

            //if they are both set, check min < max
            if (input.min && input.max) {

                if (input.type === consts.INTEGER_TYPE) {
                    if (parseInt(input.min, 10) >= parseInt(input.max, 10)) {
                        return false;
                    }
                }

                if (input.type === consts.DECIMAL_TYPE) {
                    if (parseFloat(input.min, 10) >= parseFloat(input.max, 10)) {
                        return false;
                    }
                }
            }
        }

        /**
         * Validate date format
         */

        //date
        if (input.type === consts.DATE_TYPE) {
            if (input.datetime_format) {
                if ($.inArray(input.datetime_format, valid_date_formats) < 0) {
                    //format not allowed
                    return false;
                }
            }
        }

        //time
        if (input.type === consts.TIME_TYPE) {
            if (input.datetime_format) {
                if ($.inArray(input.datetime_format, valid_time_formats) < 0) {
                    //format not allowed
                    return false;
                }
            }
        }

        /**
         * Validate set_to_current_datetime
         */
        if (input.set_to_current_datetime) {
            if (typeof input.set_to_current_datetime !== 'boolean') {
                return false;
            }

            //it can be true only for date and time input types
            if (input.set_to_current_datetime === true) {
                if (!(input.type === consts.DATE_TYPE || input.type === consts.TIME_TYPE)) {
                    return false;
                }
            }
        }

        /**
         * Validate possible answers
         */
        if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) > 0) {
            if (!self.arePossibleAnswersValid(input.possible_answers, input.type)) {
                return false;
            }
        }

        if (!is_branch && !is_group) {
            /**
             * Validate jumps
             */
            if (!self.areJumpsValid(input)) {
                return false;
            }


            //top level input, validate branch and group recursively

            //branch
            if ($.isArray(input.branch)) {
                $(input.branch).each(function (index, branch_input) {
                    self.isValidInput(form_ref, branch_input, true, false);
                });
            }
            else {
                return false;
            }

            //group
            if ($.isArray(input.group)) {
                $(input.group).each(function (index, group_input) {
                    self.isValidInput(form_ref, group_input, false, true);
                });
            }
            else {
                return false;
            }

        }
        else {

            if (is_branch) {
                //branch in branch is not allowed
                if (input.branch.length > 0) {
                    return false;
                }

                /**
                 * Validate jumps
                 */
                if (!self.areJumpsValid(input.branch)) {
                    return false;
                }
            }

            if (is_group) {
                //group in group is not allowed
                if (input.group.length > 0) {
                    return false;
                }

                //jumps in group are not allowed
                if (input.jumps.length > 0) {
                    return false;
                }
            }
        }
        return valid;
    }

};


module.exports = import_form_validation;

},{"config/consts":24,"helpers/utils":37}],36:[function(require,module,exports){
'use strict';

var formbuilder = require('config/formbuilder');
var messages = require('config/messages');
var consts = require('config/consts');
var jumps = require('actions/jumps');
var utils = require('helpers/utils');
var load_child_form_containers = require('loaders/load-child-form-containers');

var ui = {

    navbar: {

        toggleUndoBtn: function (status) {

            if (status === consts.BTN_DISABLED) {
                //toggle button
                formbuilder.dom.undo_btn
                    .attr('disabled', true);
            }

            if (status === consts.BTN_ENABLED) {
                //toggle button
                formbuilder.dom.undo_btn
                    .attr('disabled', false);
            }
        },

        toggleSaveProjectBtn: function (status) {

            if (status === consts.BTN_DISABLED) {
                //toggle button
                formbuilder.dom.save_project_btn
                    .attr('disabled', true);

            }

            if (status === consts.BTN_ENABLED) {
                //toggle button
                formbuilder.dom.save_project_btn
                    .attr('disabled', false);
            }

            //toggle icon
            if (status === consts.BTN_ENABLED) {
                formbuilder
                    .dom.save_project_btn
                    .find('.project-state')
                    .removeClass('fa-warning')
                    .addClass('fa-check');
            }
            else {
                formbuilder
                    .dom.save_project_btn
                    .find('.project-state')
                    .addClass('fa-warning')
                    .removeClass('fa-check');
            }
        }
    },
    forms_tabs: {

        injectRefIntoFormTab: function (ref) {

            var tab_button = $('.main .main__tabs li').first();
            var tab_panel = $('.main .main__tabs-content .main__tabs-content-tabpanel').first();

            //inject ref of the first form to the fist tab/tab content, as it is shown by default
            tab_button.find('a').attr('href', '#' + ref + '-tabpanel');
            tab_panel.first().attr('id', ref + '-tabpanel');
            tab_panel.find('.inputs-collection').attr('id', ref + '-inputs-collection');
            tab_panel.find('.input-properties').attr('id', ref + '-input-properties');

        },

        toggleFormTabsButtons: function (option) {

            if (option.enable) {
                //enable form tab buttons
                formbuilder.dom.forms_tabs.find('li')
                    .not('.main__tabs-btns')
                    .each(function (index, item) {
                        $(item).removeClass('disabled disabled-tab');
                    });
            }
            else {
                //disable form tab buttons
                formbuilder.dom.forms_tabs.find('li')
                    .not('.main__tabs-btns')
                    .each(function (index, item) {
                        $(item).addClass('disabled disabled-tab');
                    });
            }
        },

        setFirstFormTabName: function (the_form_name) {

            var forms = formbuilder.project_definition.data.project.forms;

            formbuilder.dom.forms_tabs
                .find('.active a[data-form-index="0"]')
                .text(the_form_name.trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2)))
                .append('&nbsp;<i class="form-state fa fa-exclamation-triangle"></i>');
        },


        //if the form is valid show a green check on its tab button
        showFormValidIcon: function (the_form_index) {
            formbuilder.dom.forms_tabs
                .find('li a[data-form-index=' + the_form_index + '] i.form-state')
                .removeClass('fa-exclamation-triangle').addClass('fa-check');
        },

        //if the form is NOT valid show a warning icon on its tab button
        showFormInvalidIcon: function (the_form_index) {
            formbuilder.dom.forms_tabs
                .find('li a[data-form-index=' + the_form_index + '] i.form-state')
                .removeClass('fa-check').addClass('fa-exclamation-triangle');
        },

        //return the markup for a form tab button, showing form name
        getFormTabButtonHTML: function (form) {

            var html = '';
            var form_index = formbuilder.current_form_index;
            var forms = formbuilder.project_definition.data.project.forms;

            html += '<li role="presentation" class="main__tabs__form-btn">';
            html += '<a href="#' + form.ref + '-tabpanel" role="tab" data-toggle="tab" data-form-index="' + form_index + '">';
            html += form.name.trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2));
            html += '&nbsp;<i class="form-state fa fa-exclamation-triangle"></i>';
            html += '</a>';
            html += '</li>';

            return html;
        },

        //get markup for a form tab content (input collection + input properties)
        getFormTabContentHTML: function (form) {

            var html = '';

            var deferred = new $.Deferred();

            $.when(load_child_form_containers()).then(function (views) {

                html += '<div role="tabpanel" class="main__tabs-content-tabpanel tab-pane fade in active" id="' + form.ref + '-tabpanel">';
                html += '<div id="' + form.ref + '-inputs-collection" class="inputs-collection col-md-6">';
                html += views.inputs_collection;
                html += '</div>';
                html += '<div id="' + form.ref + '-input-properties" class="input-properties col-md-6">';
                html += views.inputs_properties;
                html += '</div>';
                html += '</div>';

                deferred.resolve(html);
            });

            return deferred.promise();
        },

        resizeFormTabs: function () {

            var forms = formbuilder.project_definition.data.project.forms;


            formbuilder.dom.forms_tabs
                .find('li:lt(' + forms.length + ')').each(function (index, form_btn) {

                    var state = $(form_btn).find('a i').hasClass('fa-check');
                    var btn = $(form_btn).find('a');
                    var valid_icon_html = '&nbsp;<i class="form-state fa fa-check"></i>';
                    var invalid_icon_html = '&nbsp;<i class="form-state fa fa-exclamation-triangle"></i>';

                    btn.text(forms[index].name
                        .trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2)));
                    btn.append(state ? valid_icon_html : invalid_icon_html);
                });
        }
    },
    inputs_collection: {

        //show/hide the title not set warning message
        toggleTitleWarning: function (count, is_branch) {

            //find warning for either the active form or the active branch
            var element_to_find = is_branch ? '.active-branch .no-branch-title-set' : '.no-form-title-set';

            if (count === 0) {
                //show
                formbuilder.dom.inputs_collection_sortable.find(element_to_find).removeClass('hidden').animate({
                    opacity: 1,
                    height: 37
                }, consts.ANIMATION_FAST);
            }
            else {
                //hide
                formbuilder.dom.inputs_collection_sortable.find(element_to_find).animate({
                    opacity: 0,
                    height: 0
                }, consts.ANIMATION_FAST, function () {
                    $(this).addClass('hidden');
                });
            }
        },

        getInputStateIconsHTML: function () {

            var html = '';
            html += '<i class="question-state fa fa-exclamation-triangle fa-2x fa-fw pull-right"></i>';
            html += '<i class="jump-state fa fa-arrow-circle-o-down fa-2x fa-fw pull-right invisible"></i>';

            return html;
        },

        showInputValidIcon: function (the_ref) {
            formbuilder.dom.inputs_collection_sortable
                .find('div.input[data-input-ref="' + the_ref + '"] i.question-state')
                .first()
                .removeClass('fa-exclamation-triangle').addClass('fa-check');
        },

        showInputInvalidIcon: function (the_ref) {
            formbuilder.dom.inputs_collection_sortable
                .find('div.input[data-input-ref="' + the_ref + '"] i.question-state')
                .first()
                .removeClass('fa-check').addClass('fa-exclamation-triangle');
        },

        showInputQuestionPreview: function (the_ref, the_question) {
            formbuilder.dom.inputs_collection_sortable
                .find('div.input[data-input-ref="' + the_ref + '"] > .input-inner > .question-preview')
                .text(the_question.trunc(50));
        },
        toggleFormActionButtons: function (the_state) {
            var buttons = formbuilder.dom.inputs_collection
                .find('.inputs-collection__buttons')
                .find('.btn');

            if (the_state) {
                buttons.attr('disabled', false).show();
            }
            else {
                buttons.attr('disabled', true).hide();
            }
        },
        getEmptyCollectionSortableHTML: function (type) {

            var html = '';

            html += '<div class="' + type + '-sortable hidden">';
            //no title set warning (only for branch type)
            if (type === consts.BRANCH_TYPE) {
                html += '<div class="warning-well no-branch-title-set hidden">No title set for this branch yet ';
                html += '<i class="fa fa-question-circle fa-2x fa-fw" data-toggle="modal" data-target="#info-title">';
                html += '</i>';
                html += '</div>';
            }
            //no inputs yet message
            html += '<span class="input-properties__no-' + type + '-questions-message" style="display: none;">';
            html += type === consts.BRANCH_TYPE ? messages.labels.ADD_BRANCH_INPUTS_HERE : messages.labels.ADD_GROUP_INPUTS_HERE;
            html += '</span>';
            html += '{{' + type + '-inputs}}';
            html += '</div>';

            return html;
        }
    },
    input_tools: {

        enable: function () {
            $('ul#inputs-tools-list li div.input')
                .draggable('enable')
                .removeClass('dragging-disabled');
        },
        disable: function () {
            //disable draggable
            $('ul#inputs-tools-list li div.input')
                .draggable('disable')
                .addClass('dragging-disabled');

            //show toast max number of input hit
            //todo
        },
        hideSearchInput: function () {
            formbuilder.dom.inputs_tools_draggable.filter('.input-search').hide();
        },
        showSearchInput: function () {
            formbuilder.dom.inputs_tools_draggable.filter('.input-search').show();
        }
    },
    input_properties_panel: {

        toggleAddAnswerBtn: function (is_disabled) {

            var input = utils.getActiveInput();
            var properties_panel = formbuilder.dom
                .input_properties_forms_wrapper
                .find('form[data-input-ref="' + input.ref + '"]');

            properties_panel
                .find('.input-properties__form__possible-answers__add-answer')
                .attr('disabled', is_disabled);

        },

        setUniquenessProperty: function (the_form_index, the_input) {

            var form_index = the_form_index;
            var input = the_input;

            if (form_index === 0) {
                input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__uniqueness input')
                    .prop('checked', input.uniquess !== consts.UNIQUESS_NONE);
            }
            else {
                switch (input.uniqueness) {

                    case consts.UNIQUESS_FORM:
                        input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__uniqueness input.uniqueness-form')
                            .prop('checked', true);
                        break;
                    case consts.UNIQUESS_HIERARCHY:
                        input.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__uniqueness input.uniqueness-hierarchy')
                            .prop('checked', true);
                        break;
                }
            }
        },

        showInputQuestionPreview: function (question) {

            formbuilder.dom.input_properties
                .find('.panel .panel-heading .input-properties__header .question-preview')
                .text(question);
        },

        toggleJumpTab: function (the_ref, the_state) {

            var jump_tab = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + the_ref + '"]')
                .find('.input-properties__tabs')
                .find('.nav-tabs')
                .children()
                .eq(2);

            //true enable, false disable
            if (the_state) {
                jump_tab.removeClass('disabled disabled-tab');
            }
            else {
                jump_tab.addClass('disabled disabled-tab');
            }
        },

        showJumpTabError: function (jump_dom_object) {

            //show '!' on affected tab, in this case the jump properties tab (third)
            jump_dom_object
                .parents()
                .eq(5)
                .find('.nav-tabs')
                .find('i.jumps-error')
                .removeClass('invisible')
                .hide()
                .fadeIn(300);

            //set jump properties tab text to red
            jump_dom_object
                .parents()
                .eq(5)
                .find('.nav-tabs')
                .find('i.jumps-error')
                .parent()
                .addClass('validation-error');

        },

        hideJumpTabError: function (jump_dom_object) {

            //show '!' on affected tab, in this case the jump properties tab (third)
            jump_dom_object
                .parents()
                .eq(5)
                .find('.nav-tabs')
                .find('i.jumps-error')
                .addClass('invisible');


            //set jump properties tab text to red
            jump_dom_object
                .parents()
                .eq(5)
                .find('.nav-tabs')
                .find('i.jumps-error')
                .parent()
                .removeClass('validation-error');

        },

        toggleTitleCheckbox: function (state, ref) {

            var title_control = formbuilder.dom
                .input_properties_forms_wrapper
                .find('form[data-input-ref="' + ref + '"]')
                .find('.input-properties__form__title-flag');

            switch (state) {
                case consts.DISABLED_STATE:
                    title_control.find('label').addClass('disabled-checkbox');
                    title_control.find('input').attr('disabled', true).addClass('disabled-checkbox');
                    title_control.find('span.title-label').text(consts.MAX_TITLE_LIMIT_REACHED);
                    break;
                case consts.ENABLED_STATE:
                    title_control.find('label').removeClass('disabled-checkbox');
                    title_control.find('input').attr('disabled', false).removeClass('disabled-checkbox');
                    title_control.find('span.title-label').text(consts.USE_ANSWER_AS_TITLE);
                    break;
            }
        },
        toggleCopyInputButton: function (ref, state) {

            var copy_btn = formbuilder.dom
                .input_properties
                .find('.input-properties__buttons--copy-input');

            switch (state) {
                case consts.BTN_DISABLED:
                    copy_btn.attr('disabled', true);
                    break;
                case consts.BTN_ENABLED:
                    copy_btn.attr('disabled', false);
                    break;
            }
        }
    },
    group: {

        toggleEditGroupButton: function (the_ref, the_state) {
            formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + the_ref + '"]')
                .find('.input-properties__form__basic-properties')
                .find('.input-properties__form__edit-group').attr('disabled', !the_state);
        },

        hideGroupInputsErrors: function (the_properties_panel) {
            //show error message
            the_properties_panel.find('.input-properties__form__error--group-error')
                .addClass('hidden')
                .text('&nbsp;');
        }

    },
    branch: {

        toggleEditBranchButton: function (the_ref, the_state) {
            formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + the_ref + '"]')
                .find('.input-properties__form__basic-properties')
                .find('.input-properties__form__edit-branch').attr('disabled', !the_state);
        },

        hideBranchInputsErrors: function (the_properties_panel) {
            //show error message
            the_properties_panel.find('.input-properties__form__error--branch-error')
                .addClass('hidden')
                .text('&nbsp;');
        },
        showBranchInputPropertiesDom: function (the_branch_input_index) {

            var form_index = formbuilder.current_form_index;
            var owner_input_ref = formbuilder.current_input_ref;
            var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
            var branch_input_index = the_branch_input_index;
            var branch_input = formbuilder.project_definition.data.project.forms[form_index].inputs[owner_input_index].branch[branch_input_index];
            var input_properties_forms_wrapper = formbuilder.dom.input_properties_forms_wrapper;
            var view = formbuilder.dom.input_properties_views[branch_input.type];


            //todo update view template with ref and stuff
            //init properties panel
            // helpers.initInputPropertiesPanel(input_properties_forms_wrapper, branch_input, formbuilder.dom.partials);


            input_properties_forms_wrapper.append(view).hide().fadeIn(consts.ANIMATION_FAST);


            ////todo move this in mousedown?
            ////for group nested in a branch, enable keyup to check for validation of header text
            //if (branch_input.type === consts.GROUP_TYPE) {
            //    formbuilder.dom.input_properties.off('keyup').on('keyup', 'input', input_properties_keyup_callback);
            //}
            //else {
            //    formbuilder.dom.input_properties.off('keyup');
            //}
        }
    }
};

module.exports = ui;

},{"actions/jumps":4,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/utils":37,"loaders/load-child-form-containers":56}],37:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');

var utils = {

    //from MDN
    JSONPolyfill: {
        parse: function (sJSON) {
            return eval('(' + sJSON + ')');
        },
        stringify: (function () {
            var toString = Object.prototype.toString;
            var isArray = Array.isArray || function (a) {
                return toString.call(a) === '[object Array]';
            };
            var escMap = {
                '"': '\\"',
                '\\': '\\\\',
                '\b': '\\b',
                '\f': '\\f',
                '\n': '\\n',
                '\r': '\\r',
                '\t': '\\t'
            };
            var escFunc = function (m) {
                return escMap[m] || '\\u' + (m.charCodeAt(0) + 0x10000).toString(16).substr(1);
            };
            var escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
            return function stringify(value) {
                if (value == null) {
                    return 'null';
                } else if (typeof value === 'number') {
                    return isFinite(value) ? value.toString() : 'null';
                } else if (typeof value === 'boolean') {
                    return value.toString();
                } else if (typeof value === 'object') {
                    if (typeof value.toJSON === 'function') {
                        return stringify(value.toJSON());
                    } else if (isArray(value)) {
                        var res = '[';
                        for (var i = 0; i < value.length; i++)
                            res += (i ? ', ' : '') + stringify(value[i]);
                        return res + ']';
                    } else if (toString.call(value) === '[object Object]') {
                        var tmp = [];
                        for (var k in value) {
                            if (value.hasOwnProperty(k))
                                tmp.push(stringify(k) + ': ' + stringify(value[k]));
                        }
                        return '{' + tmp.join(', ') + '}';
                    }
                }
                return '"' + value.toString().replace(escRE, escFunc) + '"';
            };
        })()
    },
    //https://goo.gl/x4jcS
    isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0 || (function (p) {
        return p.toString() === '[object SafariRemoteNotification]';
    })(!window.safari || safari.pushNotification),

    getContainersPath: function () {
        return consts.VIEWS_PATH + 'containers/';
    },

    getPropertiesPath: function () {
        return consts.VIEWS_PATH + 'properties/';
    },

    getPartialsPath: function () {
        return consts.VIEWS_PATH + 'partials/';
    },

    //go back to project details page (when inside Epicollect5 Laravel)
    goBack: function () {

        var href = window.location.href;
        //both http and https
        var protocol = window.location.protocol;
        var parts = href.replace(protocol + '//', '').split('/');
        var last = parts.pop();
        var back_href = parts.join('/');

        //standalone mode for testing from localhost?
        if (last.indexOf('formbuilder') !== -1) {
            window.location.replace(protocol + '//' + back_href);
        }
        else {
            return false;
        }
    },

    //project_ref is defined on the server, and it is unique server wise
    setProjectURL: function () {

        var domain;
        var path;
        var slug;
        var href = window.location.href;
        var protocol = window.location.protocol;
        var parts = href.replace(protocol + '//', '').split('/');
        var subpath;

        console.log('parts[0]', parts[0]);

        //standalone mode for testing from localhost?
        if (parts[0].indexOf('localhost') !== -1 || parts[0].indexOf('ngrok')) {

            //is standalone formbuilder?
            if (parts.indexOf('epicollect5-formbuilder') !== -1) {
                buildLocalPath();//testing locally, copying the json into project.json
            }
            else {
                //it is a local installation of Laravel
                buildLaravelPath();
            }
        }
        else {
            //laravel server
            buildLaravelPath();
            console.log(consts.PROJECT_URL);
        }

        function buildLaravelPath() {

            slug = parts[parts.length - 2];
            parts.splice(parts.length - 3, 3);
            domain = protocol + '//' + parts.join('/') + '/';

            path = consts.API_PRODUCTION_PATH;
            consts.PROJECT_URL = domain + path + slug;

            //do this for Laravel integration
            //remove domain (first element)
            parts.shift();
            if (parts.length > 0) {
                subpath = parts.join('/');
                consts.VIEWS_PATH = '/' + subpath + '/' + consts.VIEWS_PATH;
            }
            else {
                consts.VIEWS_PATH = '/' + consts.VIEWS_PATH;
            }
        }

        function buildLocalPath() {
            consts.PROJECT_URL = consts.API_DEVELOPMENT_GET_PATH + consts.API_DEVELOPMENT_PROJECT;
        }
    },

    setProjectLogoUrl: function () {
        console.log('href =>' + window.location.href);
        var domain;
        var path;
        var slug;
        var href = window.location.href;
        var protocol = window.location.protocol;
        var parts = href.replace(protocol + '//', '').split('/');

        slug = parts[parts.length - 2];
        parts.splice(parts.length - 3, 3);
        domain = window.location.protocol + '//' + parts.join('/') + '/';

        path = consts.API_MEDIA_PATH;
        consts.PROJECT_LOGO_URL = domain + path + slug + consts.API_PROJECT_LOGO_QUERY_STRING;


        console.log(consts.PROJECT_LOGO_URL);
    },

    //we generate the refs appending a uniqid per each level
    //form - input - branch_input - group_input
    generateFormRef: function () {
        return formbuilder.project_definition.data.project.ref + '_' + this.generateUniqID();
    },

    //input ref consists of form_ref + input_ref
    generateInputRef: function (form_ref) {
        return form_ref + '_' + this.generateUniqID();
    },

    generateInputCopyRef: function () {

        var ref;
        //top level input?
        if (!formbuilder.is_editing_branch && !formbuilder.is_editing_group) {
            ref = utils.generateInputRef(formbuilder.current_form_ref);
        }
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //generate nested group input ref (passing active branch input ref)
            ref = utils.generateBranchGroupInputRef(formbuilder.branch.current_input_ref);
        }
        else {
            if (formbuilder.is_editing_branch) {
                //generated branch input ref
                ref = utils.generateBranchGroupInputRef(formbuilder.branch.active_branch_ref);
            }
            if (formbuilder.is_editing_group) {
                //generate group ref
                ref = utils.generateBranchGroupInputRef(formbuilder.group.active_group_ref);
            }
        }
        return ref;
    },

    //for branch and groups, we append the unique ID to the input (nesting a level more)
    //a nested group will be 2 levels nested
    generateBranchGroupInputRef: function (input_ref) {
        return input_ref + '_' + this.generateUniqID();
    },
    //generate PHP type uniqid to be appended to form, inputs, branch and groups
    generateUniqID: function (prefix, more_entropy) {
        if (typeof prefix === 'undefined') {
            prefix = '';
        }

        var retId;
        var formatSeed = function (seed, reqWidth) {
            seed = parseInt(seed, 10)
                .toString(16); // to hex str
            if (reqWidth < seed.length) {
                // so long we split
                return seed.slice(seed.length - reqWidth);
            }
            if (reqWidth > seed.length) {
                // so short we pad
                return Array(1 + (reqWidth - seed.length))
                    .join('0') + seed;
            }
            return seed;
        };

        // BEGIN REDUNDANT
        if (!this.php_js) {
            this.php_js = {};
        }
        // END REDUNDANT
        if (!this.php_js.uniqidSeed) {
            // init seed with big random int
            this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
        }
        this.php_js.uniqidSeed++;

        // start with prefix, add current milliseconds hex string
        retId = prefix;
        retId += formatSeed(parseInt(new Date()
            .getTime() / 1000, 10), 8);
        // add seed hex string
        retId += formatSeed(this.php_js.uniqidSeed, 5);
        if (more_entropy) {
            // for more entropy we add a float lower to 10
            retId += (Math.random() * 10)
                .toFixed(8)
                .toString();
        }

        return retId;
    },

    //find duplicates in array
    hasDuplicates: function (array) {
        var valuesSoFar = [];
        for (var i = 0; i < array.length; ++i) {
            var value = array[i];
            if (valuesSoFar.indexOf(value) !== -1) {
                return true;
            }
            valuesSoFar.push(value);
        }
        return false;
    },

    getInputCurrentIndexByRef: function (the_ref) {

        var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        var i;
        var iLength = inputs.length;

        for (i = 0; i < iLength; i++) {
            if (inputs[i].ref === the_ref) {
                return i;
            }
        }
    },

    getBranchInputCurrentIndexByRef: function (the_owner_input_index, the_branch_input_ref) {

        var branch_inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[the_owner_input_index].branch;
        var found = -1;

        $(branch_inputs).each(function (index, branch_input) {
            if (branch_input.ref === the_branch_input_ref) {
                found = index;
                return false;
            }
        });
        return found;
    },

    getGroupInputCurrentIndexByRef: function (the_owner_input_index, the_group_input_ref) {

        var group_inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[the_owner_input_index].group;
        var found = -1;

        $(group_inputs).each(function (index, branch_input) {
            if (branch_input.ref === the_group_input_ref) {
                found = index;
                return false;
            }
        });
        return found;
    },

    getInputObjectByRef: function (the_ref) {

        var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        var i;
        var iLength = inputs.length;

        if (the_ref === undefined) {
            return false;
        }

        for (i = 0; i < iLength; i++) {
            if (inputs[i].ref === the_ref) {
                return inputs[i];
            }
        }

    },

    getBranchInputObjectByRef: function (the_ref) {

        var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        var owner_input_index = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);
        var branch_inputs = inputs[owner_input_index].branch;
        var found;

        if (the_ref !== undefined) {

            $(branch_inputs).each(function (index, input) {
                if (input.ref === the_ref) {
                    found = input;
                    return false;
                }
            });
        }

        return found;
    },

    getNestedGroupInputObjectByRef: function (the_owner_branch, the_current_nested_group_input_ref) {

        var ref = the_current_nested_group_input_ref;
        var owner_branch = the_owner_branch;
        var owner_group_ref = formbuilder.group.active_group_ref;

        var found;

        $(owner_branch.branch).each(function (index, branch_input) {

            //get the nested group
            if (branch_input.ref === owner_group_ref) {

                //for each nested group inputs, look for the one we are looking for
                $(branch_input.group).each(function (index, nested_group_input) {

                    if (nested_group_input.ref === ref) {
                        found = nested_group_input;
                        return false;
                    }
                });

                if (found) {
                    return false;
                }
            }
        });
        return found;
    },

    getNestedGroupInputCurrentIndexByRef: function (the_owner_branch, the_current_nested_group_input_ref) {

        var ref = the_current_nested_group_input_ref;
        var owner_branch = the_owner_branch;
        var owner_group_ref = formbuilder.group.active_group_ref;

        var found;

        $(owner_branch.branch).each(function (index, branch_input) {

            //get the nested group
            if (branch_input.ref === owner_group_ref) {

                //for each nested group inputs, look for the one we are looking for
                $(branch_input.group).each(function (group_index, nested_group_input) {

                    if (nested_group_input.ref === ref) {
                        found = group_index;
                        return false;
                    }
                });

                if (found) {
                    return false;
                }
            }
        });
        return found;
    },

    getGroupInputObjectByRef: function (the_ref) {

        var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        var owner_input_index = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);
        var group_inputs = inputs[owner_input_index].group;
        var found;

        if (the_ref !== undefined) {

            $(group_inputs).each(function (index, input) {
                if (input.ref === the_ref) {
                    found = input;
                    return false;
                }
            });
        }

        return found;
    },

    getNestedGroupObjectByRef: function (owner_branch, nested_group_ref) {

        var found;

        $(owner_branch.branch).each(function (index, branch_input) {

            //get the nested group
            if (branch_input.ref === nested_group_ref) {
                found = branch_input;
                return false;
            }
        });

        return found;
    },

    //passing in a branch input ref, removing the last `_uniqid` we have the input ref that branch belong to
    getBranchOwnerInputRef: function (the_branch_input_ref) {

        var parts = the_branch_input_ref.split('_');

        parts.pop();

        return parts.join('_');
    },

    //passing in a group input ref, removing the last `_uniqid` we have the input ref that group belong to
    getGroupOwnerInputRef: function (the_group_input_ref) {

        var parts = the_group_input_ref.split('_');

        parts.pop();

        return parts.join('_');
    },

    getInputToolIcon: function (the_type) {

        var icon;

        switch (the_type) {
            case consts.AUDIO_TYPE:
                icon = consts.AUDIO_TYPE_ICON;
                break;
            case consts.BARCODE_TYPE:
                icon = consts.BARCODE_TYPE_ICON;
                break;
            case consts.BRANCH_TYPE:
                icon = consts.BRANCH_TYPE_ICON;
                break;
            case consts.CHECKBOX_TYPE:
                icon = consts.CHECKBOX_TYPE_ICON;
                break;
            case consts.DATE_TYPE:
                icon = consts.DATE_TYPE_ICON;
                break;
            case consts.DROPDOWN_TYPE:
                icon = consts.DROPDOWN_TYPE_ICON;
                break;
            case consts.GROUP_TYPE:
                icon = consts.GROUP_TYPE_ICON;
                break;
            case consts.LOCATION_TYPE:
                icon = consts.LOCATION_TYPE_ICON;
                break;
            case consts.INTEGER_TYPE:
                icon = consts.NUMERIC_TYPE_ICON;
                break;
            case consts.DECIMAL_TYPE:
                icon = consts.NUMERIC_TYPE_ICON;
                break;
            case consts.PHONE_TYPE:
                icon = consts.PHONE_TYPE_ICON;
                break;
            case consts.PHOTO_TYPE:
                icon = consts.PHOTO_TYPE_ICON;
                break;
            case consts.RADIO_TYPE:
                icon = consts.RADIO_TYPE_ICON;
                break;
            case consts.README_TYPE:
                icon = consts.README_TYPE_ICON;
                break;
            case consts.TEXT_TYPE:
                icon = consts.TEXT_TYPE_ICON;
                break;
            case consts.TEXTAREA_TYPE:
                icon = consts.TEXTAREA_TYPE_ICON;
                break;
            case consts.TIME_TYPE:
                icon = consts.TIME_TYPE_ICON;
                break;
            case consts.VIDEO_TYPE:
                icon = consts.VIDEO_TYPE_ICON;
                break;
            case consts.SEARCH_SINGLE_TYPE:
                icon = consts.SEARCH_SINGLE_TYPE_ICON;
                break;
            case consts.SEARCH_MULTIPLE_TYPE:
                icon = consts.SEARCH_MULTIPLE_TYPE_ICON;
                break;
        }
        return icon;
    },

    slugify: function (text) {

        var trimmed = $.trim(text);
        var $slug = trimmed.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return $slug.toLowerCase();
    },

    //get total inputs downo to al levels: counting also nested branch inputs and group inputs
    getInputsTotal: function (inputs) {

        var total = 0;

        total += inputs.length;

        $(inputs).each(function (index, input) {
            if (input.type === consts.GROUP_TYPE) {
                total += input.group.length;
            }
            if (input.type === consts.BRANCH_TYPE) {
                total += input.branch.length;

                //todo count nested group inputs!
                //todo
            }
        });
        return total;
    },
    //get total inputs down to all levels: counting also nested branch inputs and group inputs
    getSearchInputsTotal: function () {

        var total = 0;
        var forms = formbuilder.project_definition.data.project.forms;

        $(forms).each(function (formIndex, form) {

            $(form.inputs).each(function (inputIndex, input) {
                //count all search input types
                if (input.type === consts.SEARCH_MULTIPLE_TYPE || input.type === consts.SEARCH_SINGLE_TYPE) {
                    total++;
                }

                if (input.type === consts.GROUP_TYPE) {
                    //count all search input types of a group
                    $(input.group).each(function (groupIndex, groupInput) {
                        if (groupInput.type === consts.SEARCH_MULTIPLE_TYPE || groupInput.type === consts.SEARCH_SINGLE_TYPE) {
                            total++;
                        }
                    });
                }

                if (input.type === consts.BRANCH_TYPE) {
                    //count all search input types of a branch
                    $(input.branch).each(function (branchIndex, branchInput) {
                        if (branchInput.type === consts.SEARCH_MULTIPLE_TYPE || branchInput.type === consts.SEARCH_SINGLE_TYPE) {
                            total++;
                        }
                        //nested group?
                        if (branchInput.type === consts.GROUP_TYPE) {
                            $(branchInput.group).each(function (groupIndex, groupInput) {
                                if (groupInput.type === consts.SEARCH_MULTIPLE_TYPE || groupInput.type === consts.SEARCH_SINGLE_TYPE) {
                                    total++;
                                }
                            });
                        }
                    });
                }
            });
        });

        return total;
    },
    //jump destinations: cannot jump on the next one, but always next + 1
    getJumpAvailableDestinations: function (input, inputs) {

        var current_input_index;
        var owner_input_index;
        var destinations = [];
        var available_inputs;

        if (formbuilder.is_editing_branch) {
            owner_input_index = utils.getInputCurrentIndexByRef(formbuilder.branch.active_branch_ref);
            current_input_index = utils.getBranchInputCurrentIndexByRef(owner_input_index, input.ref);
        }
        else {
            current_input_index = utils.getInputCurrentIndexByRef(input.ref);
        }

        available_inputs = inputs.slice(current_input_index + 2);

        $(available_inputs).each(function (index, input) {
            destinations.push({
                ref: input.ref,
                question: input.question,
                type: input.type
            });
        });

        //add "End of form" as an available destination
        destinations.push({
            ref: consts.JUMP_TO_END_OF_FORM_REF,
            question: consts.JUMP_TO_END_OF_FORM_LABEL,
            type: null
        });


        return destinations;
    },

    //jump destinations object: for quicker look ups, this is for extra validation on "save"
    getJumpAvailableDestinationsAsKeys: function (current_input_index, input, inputs) {

        var destinations = {};
        var available_inputs;

        available_inputs = inputs.slice(current_input_index + 2);

        //fill with available inputs refs as keys
        $(available_inputs).each(function (index, input) {
            destinations[input.ref] = 1;
        });
        //add "End of form" as an available destination
        destinations[consts.JUMP_TO_END_OF_FORM_REF] = 1;

        return destinations;
    },

    //return true when the value is less or equal to max title
    isMaxTitleLimitReached: function (inputs) {
        return this.getTitleCount(inputs) >= consts.LIMITS.titles_max;
    },
    //return true when the value exceeds max title
    isMaxTitleLimitExceeded: function (inputs) {
        return this.getTitleCount(inputs) > consts.LIMITS.titles_max;
    },

    getTitleCount: function (inputs) {

        var count = 0;

        $(inputs).each(function (index, input) {
            if (input.is_title) {
                count++;
            }
            //loop all group inputs as they count towards the limit
            if (input.type === consts.GROUP_TYPE) {
                $(input.group).each(function (index, group_input) {
                    if (group_input.is_title) {
                        count++;
                    }
                });
            }
        });
        return count;
    },
    //from http://goo.gl/D7FxG0
    //  //convert html tags to html entities
    encodeHtml: function (str) {
        return str.replace(/[&<>"']/g, function ($0) {
            /* jshint ignore:start */
            // jscs:disable
            return "&" + {
                "&": "amp",
                "<": "lt",
                ">": "gt",
                '"': "quot",
                "'": "#39"
            }[$0] + ";";
            /* jshint ignore:end */
            // jscs:enable
        });
    },

    //from http://goo.gl/htCroU
    decodeHtml: function (html) {
        var txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    },

    getPossibleAnswerLabel: function (input) {
        var label = '';
        $(input.possible_answers).each(function (answer_index, answer) {
            if (answer.answer_ref === input.default) {
                label = answer.answer;
            }
        });
        return label;
    },
    /**
     * @param validSource: the valid obj structure
     * @param wannaBe: the obj structure to validate
     * @param strict: whether the type must be the same
     * @returns {boolean}
     * Compare properties of objects (only keys: wannaBe must have the same keys, in any order. Values don't matter, they are check separately)
     * we do check for the same nested properties when an object {} but arrays must be arrays []
     */
    hasSameProps: function (validSource, wannaBe, strict) {

        var self = this;

        //false when wannabe property is an array but validSource is not
        if (typeof validSource === 'object' && Array.isArray(wannaBe)) {
            return false;
        }

        //check for wannaBe overlapping props
        if (!Object.keys(wannaBe).every(function (key) {
            return validSource.hasOwnProperty(key);
        })) {
            // console.log('wannaBe has extra keys')
            return false;
        }

        //check every key for being same
        return Object.keys(validSource).every(function (key) {
            //if object
            if (typeof validSource[key] === 'object' && typeof wannaBe[key] === 'object' && validSource[key] !== null && wannaBe[key] !== null) {

                //check array is array
                if (Array.isArray(validSource[key])) {
                    //console.log('must be array key: ' + key);
                    return Array.isArray(wannaBe[key]);
                } else {
                    //recursively check nested object
                    return self.hasSameProps(validSource[key], wannaBe[key]);
                }

            } else {
                //check every key is present in the wanna be object
                if (wannaBe[key] === undefined) {
                    // console.log('wannaBe does not have key:' + key)
                    return false;
                }

                //check the type of value is the same (not the actual value, which can be different)
                if (strict) {
                    if (typeof validSource[key] !== typeof wannaBe[key]) {
                        //console.log('wannaBe type is wrong for key: ' + key)
                        return false;
                    }
                }

                return true;
            }
        });
    },
    //from MDN https://goo.gl/vOhzta
    isInteger: function (value) {
        return typeof value === 'number' &&
            isFinite(value) &&
            Math.floor(value) === value;
    },

    getActiveInput: function () {

        var self = this;
        var input;
        var current_branch;
        var current_input_ref = formbuilder.current_input_ref;

        //get current input object based on editing state:

        //nested group?
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //get nested group input
            current_branch = self.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = self.getNestedGroupInputObjectByRef(current_branch, formbuilder.group.current_input_ref);
        }

        //branch input
        if (formbuilder.is_editing_branch && !formbuilder.is_editing_group) {
            //get branch input
            input = self.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
        }

        //group input?
        if (!formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //get group input
            input = self.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        }

        //top level input?
        if (!formbuilder.is_editing_branch && !formbuilder.is_editing_group) {
            //get input
            input = self.getInputObjectByRef(current_input_ref);
        }

        return input;
    },
    /// Replaces commonly-used Windows 1252 encoded chars that do not exist in ASCII or ISO-8859-1 with ISO-8859-1 cognates.
    replaceWordChars: function (text) {
        var s = text;
        // smart single quotes and apostrophe
        s = s.replace(/[\u2018\u2019\u201A]/g, "\'");
        // smart double quotes
        s = s.replace(/[\u201C\u201D\u201E]/g, '\"');
        // ellipsis
        s = s.replace(/\u2026/g, '...');
        // dashes
        s = s.replace(/[\u2013\u2014]/g, '-');
        // circumflex
        s = s.replace(/\u02C6/g, '^');
        // open angle bracket
        s = s.replace(/\u2039/g, ' ');
        // close angle bracket
        s = s.replace(/\u203A/g, ' ');
        // spaces
        s = s.replace(/[\u02DC\u00A0]/g, ' ');

        //remove invalid chars
        s = s.replace(/\uFFFD/g, ' ');

        return s;
    },

    getCurrentlySelectedInput: function () {

        var self = this;
        var input = self.getInputObjectByRef(formbuilder.current_input_ref);
        var owner_branch;

        //check whether we are validatin a nested input i.e. BOTH branch AND group edit flags are true
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //get nested group input
            owner_branch = self.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = self.getNestedGroupInputObjectByRef(owner_branch, formbuilder.group.current_input_ref);
        }
        else {
            if (formbuilder.is_editing_branch) {
                //get selected branch input
                input = self.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
            }

            if (formbuilder.is_editing_group) {
                //get selected group input
                input = self.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
            }
        }

        return input;
    },
    //http://locutus.io/php/strings/strip_tags/
    stripTags: function (input, allowed) {
        allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
        var commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
        return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
            return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
        })
    },
    //replace all occurences of 'needle' in string
    replaceAllOccurrences: function (string, needle, replacement) {
        return string.replace(new RegExp(needle, 'g'), replacement);
    },

    /**
     * Randomize array element order in-place.
     * Using Durstenfeld shuffle algorithm.
     */
    shuffleArray: function (array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
};

module.exports = utils;

},{"config/consts":24,"config/formbuilder":26}],38:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var validation = require('actions/validation');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var formbuilder = require('config/formbuilder');

var AudioInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set default properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.AUDIO_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
AudioInput.prototype = Object.create(Input.prototype);

module.exports = AudioInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-properties":33,"factory/input-prototype":34}],39:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var BarcodeInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
   // this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.BARCODE_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
BarcodeInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

BarcodeInput.prototype.setAdvancedInputProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //set  'default' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(this.default);

    //set 'regex' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(this.regex);

    //set 'input_ref' on 'double entry verification' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').prop('checked', this.verify);

    ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);
};

BarcodeInput.prototype.hideAdvancedPropertiesErrors = function () {

    //reset validation dom feedback (hide all errors from dom)
    var properties_to_hide_error = [
        consts.DEFAULT_PROPERTY
    ];
    errors.hideAdvancedPropertiesErrors(this, properties_to_hide_error);
};

module.exports = BarcodeInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],40:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var messages = require('config/messages');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var branch_sortable = require('ui-handlers/branch-sortable');
var input_collection_branch_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-branch-sortable-mousedown-callback');
var input_collection_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback');

var BranchInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.BRANCH_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
BranchInput.prototype = Object.create(Input.prototype);

BranchInput.prototype.isHeaderTextValid = function () {
    return this.isQuestionTextValid();
};


//toggle edit branch button
BranchInput.prototype.toggleEditButton = function (the_state) {
    ui.branch.toggleEditBranchButton(this.ref, the_state);
};

BranchInput.prototype.enterBranchSortable = function () {

    var self = this;
    var undo = require('actions/undo');
    var active_branch = formbuilder.dom.inputs_collection_sortable
        .find('div.input[data-input-ref="' + self.ref + '"]');
    var active_branch_inner = active_branch.find(' > .input-inner');
    var branch_holder_html = ui.inputs_collection.getEmptyCollectionSortableHTML(consts.BRANCH_TYPE);
    var branch_inputs = utils.getInputObjectByRef(self.ref).branch;
    var exit_btn_html = '';
    exit_btn_html += '<button class="btn btn-sm btn-default exit-branch-editing">';
    exit_btn_html += '<i class="fa fa-2x fa-fw fa-chevron-left "></i>';
    exit_btn_html += messages.labels.EXIT_EDITING;
    exit_btn_html += '</button>';

    //reset branch object, as we cache properties of the current enabled branch only
    formbuilder.branch = {};

    //set draggable to work with enabled branch only
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.branch-sortable');

    //set useful flags
    formbuilder.is_editing_branch = true;
    formbuilder.branch.active_branch_ref = self.ref;
    formbuilder.branch.active_branch_header = self.question;

    active_branch.off().on('mousedown', 'div.input', input_collection_branch_sortable_mousedown_callback);

    // if it is a brand new branch, append sortable markup and show help message
    if (active_branch.find('.branch-sortable').length === 0) {
        branch_holder_html = branch_holder_html.replace('{{branch-inputs}}', '');
        active_branch.append(branch_holder_html);
        active_branch.find('.input-properties__no-branch-questions-message').show();
    }
    else {
        if (formbuilder.render_action === consts.RENDER_ACTION_UNDO && active_branch.find('.branch-sortable > div').length === 0) {
            active_branch.find('.input-properties__no-group-questions-message').show();
        }
    }

    //enable branch sortable
    active_branch.find('.branch-sortable').sortable(branch_sortable).disableSelection().removeClass('hidden');

    //remove any previously selected branch input
    active_branch.find('.branch-sortable').find('.input.active').removeClass('active');

    //show exit editing button
    active_branch.addClass('active-branch').removeClass('active');

    //remove first two elements
    active_branch_inner.find('.fa-clone').remove();
    active_branch_inner.find('> .question-preview').remove();

    //append exit button
    active_branch_inner.prepend(exit_btn_html);

    //disable form tab buttons
    ui.forms_tabs.toggleFormTabsButtons({enable: false});

    //prepare ui for editing branch
    self.showEditBranchUI();

    active_branch
        .find('.exit-branch-editing')
        .one('click', function () {
            self.exitBranchSortable();
        });

    /*
     change binding when editing a branch, as we want to incercept only a mousedown to the exit button on the active branch input
     */
    //destroy sortable only if it is set already (see http://goo.gl/riN4Yk)
    if (formbuilder.dom.inputs_collection_sortable.data('ui-sortable')) {
        formbuilder.dom.inputs_collection_sortable.sortable('destroy');//Remove the plugin functionality
    }

    formbuilder.dom.inputs_collection_sortable.off('mousedown').on('mousedown', '.fa-chevron-left', input_collection_sortable_mousedown_callback);

    //hide form title warning regardless (passing 1)=> this is for the form which owns the branch
    ui.inputs_collection.toggleTitleWarning(1, false);

    //show/hide warning for the branch
    ui.inputs_collection.toggleTitleWarning(utils.getTitleCount(branch_inputs), true);

    //push state to enable undoing the action (adding/dragging input)
    undo.pushState();
};

BranchInput.prototype.exitBranchSortable = function () {

    var self = this;
    var sortable = require('ui-handlers/sortable');
    var current_form_name = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].name;
    var active_branch = formbuilder.dom.inputs_collection_sortable.find('.input.active-branch');
    var active_branch_input_sortable = active_branch.find('.branch-sortable');
    var active_branch_inner = active_branch.find(' > .input-inner');
    var active_branch_input;
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;

    if (formbuilder.branch.current_input_ref) {
        active_branch_input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
        //validate last active group input and update dom accordingly
        validation.performValidation(active_branch_input, false);
    }

    active_branch.removeClass('active-branch').addClass('active');


    //remove exit button
    active_branch_inner.find('.exit-branch-editing').remove();

    //restore question in input collection
    active_branch_inner.prepend('<span class="question-preview">' + self.question + '</span>');
    active_branch_inner.prepend('<i class="fa fa-2x fa-fw fa-clone"></i>');

    formbuilder.dom.inputs_collection_sortable.find('.input').not('.active').slideDown(consts.ANIMATION_NORMAL);

    //update panel header
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_FORM);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(current_form_name.trunc(consts.INPUTS_COLLECTION_BRANCH_NAME_MAX_DISPLAY_LENGHT));

    //show form action buttons in panel heading
    ui.inputs_collection.toggleFormActionButtons(true);

    //enable jumps tab
    ui.input_properties_panel.toggleJumpTab(self.ref, true);

    self.toggleEditButton(true);

    //set draggable to work with main sortable
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.sortable');

    active_branch_input_sortable.addClass('hidden');

    /*
     restore parent binding after exiting branch editing
     */
    formbuilder.dom.inputs_collection_sortable.off('mousedown').on('mousedown', 'div.input', input_collection_sortable_mousedown_callback);


    //re-bind sortable plugin
    sortable();

    self.validateBranchInputs();

    //todo: hide current input and show branch
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').hide();

    //hide previously selected branch input properties panel
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.branch.current_input_ref + '"]').hide();

    //show branch input properties panel
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.branch.active_branch_ref + '"]').fadeIn(consts.ANIMATION_FAST);

    //enable branch input tools in left sidebar, as we cannot have a branch withing a branch
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch').show();

    formbuilder.is_editing_branch = false;
    formbuilder.branch.current_input_ref = undefined;

    //enable form tab buttons
    ui.forms_tabs.toggleFormTabsButtons({enable: true});

    //show action buttons for owner input
    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);

    //show title warning if no title set
    //todo is this needed?
    ui.inputs_collection.toggleTitleWarning(utils.getTitleCount(inputs), false);
};


BranchInput.prototype.showEditBranchUI = function () {

    var self = this;

    //hide first level inputs from the input collection
    formbuilder.dom.inputs_collection_sortable.find(' > .input').not('.active-branch').slideUp(consts.ANIMATION_NORMAL);

    //update panel header
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_BRANCH);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(self.question.trunc(consts.INPUTS_COLLECTION_BRANCH_NAME_MAX_DISPLAY_LENGHT));

    //disable form action buttons in panel heading
    ui.inputs_collection.toggleFormActionButtons(false);

    //disable jumps tab //todo is this needed?
    ui.input_properties_panel.toggleJumpTab(self.ref, false);

    //hide owner branch input panel and show 'no branch inputs selected' by default
    formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + self.ref + '"]').hide();

    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').show();

    //hide input properties panel action buttons until a branch input gets selected
    formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);


    //disable branch input tools in left sidebar, as we cannot have a branch withing a branch
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch').hide();

};

BranchInput.prototype.validateBranchInputs = function () {

    var self = this;
    var branch_inputs_validation = validation.validateBranchInputs(self);

    self.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + self.ref + '"]');

    if (!branch_inputs_validation.is_valid) {
        //highlight wrong input and show error message
        errors.showBranchInputsErrors(self.dom.properties_panel, branch_inputs_validation.error.message);
        //set element as invalid
        self.dom.is_valid = false;
    }
    else {
        //set element as valid
        self.dom.is_valid = true;
        errors.hideBranchInputsErrors(self.dom.properties_panel);
    }
};

module.exports = BranchInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37,"ui-handlers/branch-sortable":76,"ui-handlers/event-handler-callbacks/input-collection-branch-sortable-mousedown-callback":84,"ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback":87,"ui-handlers/sortable":100}],41:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var possible_answers = require('actions/possible-answers');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var InputMultipleAnswers = require('factory/input-multiple-answers-prototype');
var validation = require('actions/validation');
var formbuilder = require('../config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var CheckboxInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set default properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.CHECKBOX_TYPE;

    //set a default answer on newly created dropdowns inputs
    this.possible_answers = [{
        answer: 'I am a placeholder answer',
        answer_ref: utils.generateUniqID()
    }];


    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;

    //pagination defaults
    formbuilder.possible_answers_pagination[this.ref] = {};
    formbuilder.possible_answers_pagination[this.ref].page = 1;
};

//extend prototype from basic input object and multiple answer object
CheckboxInput.prototype = $.extend({}, Input.prototype, InputMultipleAnswers.prototype);

module.exports = CheckboxInput;

},{"../config/formbuilder":26,"actions/errors":2,"actions/jumps":4,"actions/possible-answers":13,"actions/save":14,"actions/validation":23,"config/consts":24,"factory/input-multiple-answers-prototype":32,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],42:[function(require,module,exports){
'use strict';
var consts = require('../config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var formbuilder = require('../config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var DateInput = function (the_input_ref) {

    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.DATE_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
DateInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

DateInput.prototype.setAdvancedInputProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //set default to current datetime?
    this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__default-to-current input').prop('checked', this.set_to_current_datetime);

    //set datetime format
    this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__dateformat input[name="dateformatRadio"][value="' + this.datetime_format + '"]')
        .prop('checked', true);

    ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);
};


DateInput.prototype.saveAdvancedProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //set default to current datetime?
    this.set_to_current_datetime = this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__default-to-current input')
        .is(':checked');

    //set datetime format
    this.datetime_format = this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__dateformat input[name="dateformatRadio"]:checked')
        .val();

    //save uniqueness
    save.saveUniqueness(this);
};

module.exports = DateInput;

},{"../config/consts":24,"../config/formbuilder":26,"actions/errors":2,"actions/jumps":4,"actions/save":14,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],43:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('../config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var InputMultipleAnswers = require('factory/input-multiple-answers-prototype');
var validation = require('actions/validation');
var formbuilder = require('../config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var DropdownInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set default properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.DROPDOWN_TYPE;

    //set a default answer on newly created dropdowns inputs
    this.possible_answers = [{
        answer: 'I am a placeholder answer',
        answer_ref: utils.generateUniqID()
    }];

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;

    //pagination defaults
    formbuilder.possible_answers_pagination[this.ref] = {};
    formbuilder.possible_answers_pagination[this.ref].page = 1;
};

//extend prototype from basic input object and multiple answer object
DropdownInput.prototype = $.extend({}, Input.prototype, InputMultipleAnswers.prototype);


module.exports = DropdownInput;

},{"../config/consts":24,"../config/formbuilder":26,"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"factory/input-multiple-answers-prototype":32,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],44:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var messages = require('config/messages');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var group_sortable = require('ui-handlers/group-sortable');
var input_collection_branch_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-branch-sortable-mousedown-callback');
var input_collection_group_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-group-sortable-mousedown-callback');
var input_collection_nested_group_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-nested-group-sortable-mousedown-callback');
var input_collection_sortable_mousedown_callback = require('ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback');

var GroupInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.GROUP_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
GroupInput.prototype = Object.create(Input.prototype);

GroupInput.prototype.isHeaderTextValid = function () {
    return this.isQuestionTextValid();
};

//toggle edit branch button
GroupInput.prototype.toggleEditButton = function (the_state) {
    ui.group.toggleEditGroupButton(this.ref, the_state);
};

GroupInput.prototype.enterGroupSortable = function (is_nested) {

    var self = this;
    var undo = require('actions/undo');
    var active_group = formbuilder.dom.inputs_collection_sortable
        .find('div.input[data-input-ref="' + self.ref + '"]');
    var active_group_inner = active_group.find(' > .input-inner');
    var group_holder_html = ui.inputs_collection.getEmptyCollectionSortableHTML(consts.GROUP_TYPE);
    var exit_btn_html = '';
    var exit_button_class = is_nested ? 'exit-nested-group-editing' : 'exit-group-editing';
    exit_btn_html += '<button class="btn btn-sm btn-default ' + exit_button_class + '">';
    exit_btn_html += '<i class="fa fa-2x fa-fw fa-chevron-left "></i>';
    exit_btn_html += messages.labels.EXIT_EDITING;
    exit_btn_html += '</button>';


    //disable jumps tab when editing a group
    $('.jump-tab').addClass('disabled disabled-tab');

    //reset group object, as we cache properties of the current enabled group only
    formbuilder.group = {};

    //set draggable to work with enabled group only
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.group-sortable');

    //set useful flags
    formbuilder.is_editing_group = true;
    formbuilder.group.active_group_ref = self.ref;

    if (is_nested) {
        active_group.off().on('mousedown', 'div.input', input_collection_nested_group_sortable_mousedown_callback);
    } else {
        active_group.off().on('mousedown', 'div.input', input_collection_group_sortable_mousedown_callback);
    }

    //if it is a brand new group, append sortable markup
    if (active_group.find('.group-sortable').length === 0) {
        group_holder_html = group_holder_html.replace('{{group-inputs}}', '');
        active_group.append(group_holder_html);
        active_group.find('.input-properties__no-group-questions-message').show();
    }
    else {
        if (formbuilder.render_action === consts.RENDER_ACTION_UNDO && active_group.find('.group-sortable > div').length === 0) {
            active_group.find('.input-properties__no-group-questions-message').show();
        }
    }

    //enable group sortable
    active_group.find('.group-sortable').sortable(group_sortable).disableSelection().removeClass('hidden');

    //remove any previously selected group input
    active_group.find('.group-sortable').find('.input.active').removeClass('active');

    //show exit editing button
    active_group.addClass('active-group').removeClass('active');

    //remove first two elements
    active_group_inner.find('.fa-align-justify').remove();
    active_group_inner.find('> .question-preview').remove();

    //append exit button
    active_group_inner.prepend(exit_btn_html);

    //disable form tab buttons
    ui.forms_tabs.toggleFormTabsButtons({
        enable: false
    });

    //prepare ui for editing group
    if (is_nested) {
        self.showEditNestedGroupUI();
    } else {
        self.showEditGroupUI();
    }

    active_group
        .find('.' + exit_button_class)
        .one('click', function () {
            if (is_nested) {
                self.exitNestedGroupSortable();
            } else {
                self.exitGroupSortable();
            }
        });

    /*
     change binding when editing a group, as we want to incercept only a mousedown to the exit button on the active group input
     */
    //destroy top parent sortable
    console.log('group.js calls destroy');

    /******** NEEDED BUG *********/
    /* The call to 'destroy' will trigger an error the first time, but if it does not (catching the error or using the commented 'if else' statement)
     *  when exiting the group the parent sortable will not work anymore, whether is a top level sortable or a branch sortable.
     *  todo look into it
     *
     * */
    if (formbuilder.render_action === consts.RENDER_ACTION_DO) {
        formbuilder.dom.inputs_collection_sortable.sortable('destroy');
    }
    /******** END NEEDED BUG *********/

    // formbuilder.dom.inputs_collection_sortable.find('.active-branch.hidden-active-branch .branch-sortable').sortable('destroy');
    if (is_nested) {
        //disable mousedown
        formbuilder.dom.inputs_collection_sortable
            .find('.active-branch.hidden-active-branch .branch-sortable')
            .off('mousedown')
            .on('mousedown', '.fa-chevron-left', input_collection_branch_sortable_mousedown_callback);
    } else {
        formbuilder.dom.inputs_collection_sortable.on('mousedown', '.fa-chevron-left', input_collection_sortable_mousedown_callback);
    }

    undo.pushState();
};

GroupInput.prototype.exitNestedGroupSortable = function () {

    //exit nested group sortable
    console.log('exiting nested group, goes up to branch');

    var self = this;
    var branch_sortable = require('ui-handlers/branch-sortable');
    var active_branch = formbuilder.dom.inputs_collection_sortable.find('.active-branch');
    var current_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
    var current_branch_name = current_branch.question;
    var active_group = formbuilder.dom.inputs_collection_sortable.find('.input.active-group');
    var active_group_input_sortable = active_group.find('.group-sortable');
    var active_group_inner = active_group.find(' > .input-inner');
    var active_nested_group_input;

    if (formbuilder.group.current_input_ref) {
        active_nested_group_input = utils.getNestedGroupInputObjectByRef(current_branch, formbuilder.group.current_input_ref);
        //validate last active group input and update dom accordingly (if an input was selected)
        validation.performValidation(active_nested_group_input, false, formbuilder.project_definition);
    }

    //enable owner branch sortable
    active_branch.find('.branch-sortable').sortable(branch_sortable).disableSelection();

    active_group.removeClass('active-group').addClass('active');

    //remove exit button
    active_group_inner.find('.exit-nested-group-editing').remove();

    //restore question in input collection
    active_group_inner.prepend('<span class="question-preview">' + self.question + '</span>');
    active_group_inner.prepend('<i class="fa fa-2x fa-fw fa-align-justify"></i>');

    //show owner branch
    active_branch
        .removeClass('hidden-active-branch')
        .find(' > .input-inner > i')
        .fadeIn(consts.ANIMATION_FAST);

    active_branch.find(' > .input-inner > .exit-branch-editing').fadeIn(consts.ANIMATION_FAST);

    //show inactive branch inputs
    formbuilder.dom.inputs_collection_sortable
        .find('.active-branch')
        .find('.branch-sortable')
        .find(' > .input')
        .not('.active-group')
        .slideDown(consts.ANIMATION_NORMAL);

    //update middle colum panel header showing owner branch question
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_BRANCH);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(current_branch_name.trunc(consts.INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT));

    self.toggleEditButton(true);

    //set draggable to work with the active branch sortable
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.branch-sortable');

    //hide nested group sortable
    active_group_input_sortable.addClass('hidden');

    /*
     restore parent binding after exiting group editing
     */
    formbuilder.dom.inputs_collection_sortable
        .find('.active-branch')
        .off()
        .on('mousedown', 'div.input', input_collection_branch_sortable_mousedown_callback);

    formbuilder.dom.inputs_collection_sortable.find('.active-branch > .branch-sortable').sortable(branch_sortable);

    //if both header and groups are valid, show green check on active group input
    if (self.dom.is_valid) {
        //replace warning icon with green check
        ui.inputs_collection.showInputValidIcon(self.ref);
    } else {
        //replace warning icon with green check
        ui.inputs_collection.showInputInvalidIcon(self.ref);
    }

    //show a preview of the nested group header (limit to 20 chars)
    formbuilder.dom.input_properties.find('.panel-title span.question-preview').text(self.question.trunc(20));

    //hide no inputs selected (just in case no input was selected in the nested group)
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').hide();

    //hide any input previously selected
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.group.current_input_ref + '"]').hide();

    //show nested group input properties panel
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.group.active_group_ref + '"]').fadeIn(consts.ANIMATION_FAST);

    //enable group input tools in left sidebar
    formbuilder.dom.inputs_tools_draggable.filter('.input-group').show();

    formbuilder.is_editing_group = false;
    formbuilder.group.current_input_ref = undefined;

    //enable jumps tab when exit editing a group
    $('.jump-tab').removeClass('disabled disabled-tab');

    //show action buttons for owner input
    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);
};

GroupInput.prototype.exitGroupSortable = function () {

    var self = this;
    var active_group_input;
    var sortable = require('ui-handlers/sortable');
    var current_form_name = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].name;
    var active_group = formbuilder.dom.inputs_collection_sortable.find('.input.active-group');
    var active_group_input_sortable = active_group.find('.group-sortable');
    var active_group_inner = active_group.find(' > .input-inner');

    if (formbuilder.group.current_input_ref) {
        active_group_input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        //validate last active group input and update dom accordingly
        validation.performValidation(active_group_input, false, formbuilder.project_definition);
    }

    active_group.removeClass('active-group').addClass('active');

    //remove exit button
    active_group_inner.find('.exit-group-editing').remove();

    //restore question in input collection
    active_group_inner.prepend('<span class="question-preview">' + self.question + '</span>');
    active_group_inner.prepend('<i class="fa fa-2x fa-fw fa-align-justify"></i>');

    formbuilder.dom.inputs_collection_sortable.find('.input').not('.active').slideDown(consts.ANIMATION_NORMAL);

    //update panel header
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_FORM);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(current_form_name.trunc(consts.INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT));

    //show form action buttons in panel heading
    ui.inputs_collection.toggleFormActionButtons(true);

    //enable jumps tab
    ui.input_properties_panel.toggleJumpTab(self.ref, true);

    self.toggleEditButton(true);

    //set draggable to work with main sortable
    formbuilder.dom.inputs_tools_draggable.draggable('option', 'connectToSortable', '.sortable');

    active_group_input_sortable.addClass('hidden');

    /*
     restore parent binding and sortable after exiting group editing
     */
    formbuilder.dom.inputs_collection_sortable.off('mousedown').on('mousedown', 'div.input', input_collection_sortable_mousedown_callback);
    sortable();

    //if both header and groups are valid, show green check on active group input
    if (self.dom.is_valid) {
        //update the just saved input showing a preview of the question text (limit to 50 chars)
        ui.inputs_collection.showInputQuestionPreview(self.ref, self.question.trunc(50));
        //replace warning icon with green check
        ui.inputs_collection.showInputValidIcon(self.ref);
    } else {
        //replace warning icon with green check
        ui.inputs_collection.showInputInvalidIcon(self.ref);
    }

    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').hide();

    //hide any input previously selected
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.group.current_input_ref + '"]').hide();

    //show branch input properties panel
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__form[data-input-ref="' + formbuilder.group.active_group_ref + '"]').fadeIn(consts.ANIMATION_FAST);

    //enable branch & group input tools in left sidebar
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch, .input-group').show();

    formbuilder.is_editing_group = false;
    formbuilder.group.current_input_ref = undefined;

    //enable jumps tab when exit editing a group
    $('.jump-tab').removeClass('disabled disabled-tab');

    //show title flag
    $('.input-properties__form__title-flag').removeClass('hidden');

    //enable form tabs buttons
    ui.forms_tabs.toggleFormTabsButtons({
        enable: true
    });

    //show action buttons for owner input
    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);
};

GroupInput.prototype.showEditGroupUI = function () {

    var self = this;

    //hide first level inputs from the input collection
    formbuilder.dom.inputs_collection_sortable.find(' > .input').not('.active-group').slideUp(consts.ANIMATION_NORMAL);

    //update panel header
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__edit-state').text(messages.labels.EDITING_GROUP);
    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(self.question.trunc(consts.INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT));

    //disable form action buttons in panel heading
    ui.inputs_collection.toggleFormActionButtons(false);

    //disable jumps tab //todo is this needed?
    ui.input_properties_panel.toggleJumpTab(self.ref, false);

    //hide owner group input panel and show 'no group inputs selected' by default
    formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + self.ref + '"]').hide();

    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').show();

    //hide input properties panel action buttons until a group input gets selected
    formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

    ////hide branch & group input tools in left sidebar, as we cannot have a branch or a group withing a group
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch, .input-group').hide();

};

GroupInput.prototype.showEditNestedGroupUI = function () {

    var self = this;
    var active_branch = formbuilder.dom.inputs_collection_sortable.find('.active-branch');

    //render UI for a nested group, as we cannot just hide the main parent since it is a branch sortable
    //hide inactive branch inputs from the input collection
    active_branch
        .find('.branch-sortable')
        .find(' > .input')
        .not('.active-group')
        .slideUp(consts.ANIMATION_NORMAL);

    //hide owner branch ant its inactive inputs (without using display:none as that will hide the nested group as well :/)
    active_branch
        .addClass('hidden-active-branch')
        .find(' > .input-inner > i')
        .hide();

    active_branch.find('.exit-branch-editing').hide();

    //remove all events from active branch as we are only interested in the mousedown event of the group sortable
    active_branch.off();

    //update panel header, as it a nested group show full breadcrumbs
    formbuilder.dom.inputs_collection
        .find('.inputs-collection__header__edit-state')
        .text(messages.labels.EDITING_BRANCH + messages.labels.EDITING_NESTED_GROUP);

    formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name').text(self.question.trunc(consts.INPUTS_COLLECTION_GROUP_NAME_MAX_DISPLAY_LENGHT));

    //hide owner group input panel and show 'no group inputs selected' by default
    formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + self.ref + '"]').hide();
    formbuilder.dom.input_properties_forms_wrapper
        .find('.input-properties__no-input-selected').show();

    //hide input properties panel action buttons until a group input gets selected
    formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

    ////disable branch & group input tools in left sidebar, as we cannot have a branch or a group withing a group
    formbuilder.dom.inputs_tools_draggable.filter('.input-branch, .input-group').hide();
};

GroupInput.prototype.validateGroupInputs = function () {

    var self = this;
    var group_inputs_validation = validation.validateGroupInputs(self);
    if (!group_inputs_validation.is_valid) {
        //highlight wrong input and show error message
        errors.showGroupInputsErrors(self.dom.properties_panel, group_inputs_validation.error.message);
        //set element as invalid
        self.dom.is_valid = false;
    } else {
        //set element as valid
        self.dom.is_valid = true;
        errors.hideGroupInputsErrors(self.dom.properties_panel);
    }
};

module.exports = GroupInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37,"ui-handlers/branch-sortable":76,"ui-handlers/event-handler-callbacks/input-collection-branch-sortable-mousedown-callback":84,"ui-handlers/event-handler-callbacks/input-collection-group-sortable-mousedown-callback":85,"ui-handlers/event-handler-callbacks/input-collection-nested-group-sortable-mousedown-callback":86,"ui-handlers/event-handler-callbacks/input-collection-sortable-mousedown-callback":87,"ui-handlers/group-sortable":98,"ui-handlers/sortable":100}],45:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var messages = require('config/messages');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var template = require ('template');

var NumericInput = function (the_input_ref) {

    $.extend(true, this, input_properties);

    //set default properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.INTEGER_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
NumericInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

//validate initial answer
NumericInput.prototype.isInitialAnswerValid = function () {

    var validate = validation.isInitialAnswerValid(this.type,this.default, this.regex);

    if (validate.is_valid) {
        //validate for integer type
        if (this.type === consts.INTEGER_TYPE && this.default !== '') {
            //initial answer must be an integer, not a float
            if (!validation.isValueInt(this.default)) {
                validate.is_valid = false;
                validate.error.message = messages.error.VALUE_MUST_BE_INTEGER;
            }
        }
    }
    return validate;
};

NumericInput.prototype.isMinValueValid = function () {
    //validate min value
    return validation.isMinMaxValueValid(this.type, this.min);
};

NumericInput.prototype.isMaxValueValid = function () {
    //validate max value
    return validation.isMinMaxValueValid(this.type, this.max);
};

NumericInput.prototype.saveAdvancedProperties = function () {

    var initial_answer_validation;
    var min_value_validation;
    var max_value_validation;
    var uniqueness;

    this.dom.advanced_properties_wrapper = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //clear all advanced properties errors from dom
    this.hideAdvancedPropertiesErrors();

    //set integer or decimal numeric type
    this.type = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__numeric input:checked').val();

    //set default (initial answer)
    this.default = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val();

    //strip html tags
    this.default = this.default.replace(/(<([^>]+)>)/ig, '');
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(this.default);


    //set min value
    this.min = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__min input').val();
    this.min = this.min.replace(/(<([^>]+)>)/ig, '');
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__min input').val(this.min);

    //set max value
    this.max = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__max input').val();
    this.max = this.max.replace(/(<([^>]+)>)/ig, '');
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__max input').val(this.max);

    //set regex
    this.regex = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val();
    this.regex = this.regex.replace(/(<([^>]+)>)/ig, '');
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(this.regex);

    //set verify flag
    this.verify = this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').is(':checked');

    //validate initial answer (based also on min max and numeric type)
    initial_answer_validation = this.isInitialAnswerValid();
    if (!initial_answer_validation.is_valid) {
        //warn user initial answer is not valid
        this.dom.is_valid = false;
        //highlight wrong input
        this.showAdvancedPropertiesErrors(consts.DEFAULT_PROPERTY, initial_answer_validation.error.message);
    }

    //validate min value
    min_value_validation = this.isMinValueValid();
    if (!min_value_validation.is_valid) {
        //warn user min value is not valid
        this.dom.is_valid = false;
        //highlight wrong input
        this.showAdvancedPropertiesErrors(consts.MIN_VALUE_PROPERTY, min_value_validation.error.message);
    }

    //validate max value
    max_value_validation = this.isMaxValueValid();
    if (!max_value_validation.is_valid) {
        //warn user min value is not valid
        this.dom.is_valid = false;
        //highlight wrong input
        this.showAdvancedPropertiesErrors(consts.MAX_VALUE_PROPERTY, max_value_validation.error.message);
    }

    //all advanced properties are valid, validate combinations across properties
    //min (if set) needs to be smaller than max (if set)
    if (min_value_validation.is_valid && max_value_validation.is_valid && this.min !== '' && this.max !== '') {

        if (parseFloat(this.min) >= parseFloat(this.max)) {
            //warn user min value is not valid
            this.dom.is_valid = false;
            //highlight wrong input
            this.showAdvancedPropertiesErrors(consts.MIN_VALUE_PROPERTY, messages.error.MIN_MUST_BE_SMALLER_THAN_MAX);
        }
    }

    //intial answer (if set) should be within the range set by min/max properties
    if (initial_answer_validation.is_valid && this.default !== '') {

        if (min_value_validation.is_valid && this.min !== '') {
            if (parseFloat(this.default) < parseFloat(this.min)) {
                //warn user min value is not valid
                this.dom.is_valid = false;
                //highlight wrong input
                this.showAdvancedPropertiesErrors(consts.DEFAULT_PROPERTY, messages.error.INITIAL_ANSWER_OUT_OF_RANGE);
            }
        }

        if (max_value_validation.is_valid && this.max !== '') {
            if (parseFloat(this.default) > parseFloat(this.max)) {
                //warn user min value is not valid
                this.dom.is_valid = false;
                //highlight wrong input
                this.showAdvancedPropertiesErrors(consts.DEFAULT_PROPERTY, messages.error.INITIAL_ANSWER_OUT_OF_RANGE);
            }
        }
    }

    //save uniqueness
    save.saveUniqueness(this);
};

NumericInput.prototype.hideAdvancedPropertiesErrors = function () {

    //reset validation dom feedback (hide all errors from dom)
    var properties_to_hide_error = [
        consts.DEFAULT_PROPERTY,
        consts.MIN_VALUE_PROPERTY,
        consts.MAX_VALUE_PROPERTY
    ];

    errors.hideAdvancedPropertiesErrors(this, properties_to_hide_error);
};

module.exports = NumericInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37,"template":62}],46:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');

var LocationInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set default properties
   // this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.LOCATION_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
LocationInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */
//LocationInput.prototype.prepareAdvancedInputProperties = function () {
//};
//
//LocationInput.prototype.hideAdvancedPropertiesErrors = function () {
//    //do nothing
//};

module.exports = LocationInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-properties":33,"factory/input-prototype":34}],47:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var PhoneInput = function (the_input_ref) {

    //extend basic input (using a clone, not a reference) wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    this.ref = the_input_ref;
    this.type = consts.PHONE_TYPE;

    /* reset DOM properties (jquery selectors are not 'live')*/
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
PhoneInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

PhoneInput.prototype.setAdvancedInputProperties = function () {

    //set  'default' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(this.default);

    //set 'regex' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(this.regex);

    //set 'input_ref' on 'double entry verification' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').prop('checked', this.verify);

    //set 'input_ref' on 'uniqueness' option
    ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);
};


PhoneInput.prototype.hideAdvancedPropertiesErrors = function () {

    //reset validation dom feedback (hide all errors from dom)
    var properties_to_hide_error = [
        consts.DEFAULT_PROPERTY
    ];
    errors.hideAdvancedPropertiesErrors(this, properties_to_hide_error);
};

module.exports = PhoneInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],48:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('../config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('../config/formbuilder');

var PhotoInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.PHOTO_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
PhotoInput.prototype = Object.create(Input.prototype);
/*
 Overrides
 */
//PhotoInput.prototype.prepareAdvancedInputProperties = function () {
//};

//PhotoInput.prototype.hideAdvancedPropertiesErrors = function () {
//    //do nothing
//};

module.exports = PhotoInput;

},{"../config/consts":24,"../config/formbuilder":26,"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"factory/input-properties":33,"factory/input-prototype":34}],49:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var possible_answers = require('actions/possible-answers');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var InputMultipleAnswers = require('factory/input-multiple-answers-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var RadioInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.RADIO_TYPE;

    //set a default answer on newly created dropdowns inputs
    this.possible_answers = [{
        answer: 'I am a placeholder answer',
        answer_ref: utils.generateUniqID()
    }];


    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;

    //pagination defaults
    formbuilder.possible_answers_pagination[this.ref] = {};
    formbuilder.possible_answers_pagination[this.ref].page = 1;

};

//extend prototype from basic input object and multiple answer object
RadioInput.prototype = $.extend({}, Input.prototype, InputMultipleAnswers.prototype);

module.exports = RadioInput;

},{"actions/errors":2,"actions/jumps":4,"actions/possible-answers":13,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-multiple-answers-prototype":32,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],50:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var ReadmeInput = function (the_input_ref) {

    //extend basic input (using a clone, not a reference) wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    this.ref = the_input_ref;
    this.type = consts.README_TYPE;

    /* reset DOM properties (jquery selectors are not 'live')*/
    this.dom = {};
    this.dom.is_valid = false;

    //override a few properties for validation purposes server side
    this.is_title = false;
    this.verify = false;
    this.is_required = false;



};

//extend prototype from basic input object
ReadmeInput.prototype = Object.create(Input.prototype);


/*
 Overrides
 */


module.exports = ReadmeInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],51:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var possible_answers = require('actions/possible-answers');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var InputMultipleAnswers = require('factory/input-multiple-answers-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var SearchInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.SEARCH_SINGLE_TYPE;

    //set a default answer on newly created dropdowns inputs
    this.possible_answers = [{
        answer: 'I am a placeholder answer',
        answer_ref: utils.generateUniqID()
    }];


    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;

    formbuilder.possible_answers_pagination[this.ref] = {};
    formbuilder.possible_answers_pagination[this.ref].page = 1;

};

//extend prototype from basic input object and multiple answer object
SearchInput.prototype = $.extend({}, Input.prototype, InputMultipleAnswers.prototype);

module.exports = SearchInput;

},{"actions/errors":2,"actions/jumps":4,"actions/possible-answers":13,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-multiple-answers-prototype":32,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],52:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var TextInput = function (the_input_ref) {

    //extend basic input (using a clone, not a reference) wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    this.ref = the_input_ref;
    this.type = consts.TEXT_TYPE;

    /* reset DOM properties (jquery selectors are not 'live')*/
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
TextInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

TextInput.prototype.setAdvancedInputProperties = function () {

    //set  'default' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(this.default);

    //set 'regex' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(this.regex);

    //set 'input_ref' on 'double entry verification' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').prop('checked', this.verify);

    //set 'input_ref' on 'uniqueness' option
    ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);
};


TextInput.prototype.hideAdvancedPropertiesErrors = function () {

    //reset validation dom feedback (hide all errors from dom)
    var properties_to_hide_error = [
        consts.DEFAULT_PROPERTY
    ];
    errors.hideAdvancedPropertiesErrors(this, properties_to_hide_error);
};

module.exports = TextInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],53:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var TextareaInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set default properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.TEXTAREA_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
TextareaInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */

TextareaInput.prototype.setAdvancedInputProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //set  'default' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__default input').val(this.default);

    //set 'regex' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__regex input').val(this.regex);

    //set 'input_ref' on 'double entry verification' option
    this.dom.advanced_properties_wrapper.find('div.input-properties__form__advanced-properties__double-entry input').prop('checked', this.verify);

    //set 'input_ref' on 'uniqueness' option
    ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);
};

TextareaInput.prototype.hideAdvancedPropertiesErrors = function () {
    //reset validation dom feedback (hide all errors from dom)
    var properties_to_hide_error = [
        consts.DEFAULT_PROPERTY
    ];
    errors.hideAdvancedPropertiesErrors(this, properties_to_hide_error);
};

module.exports = TextareaInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],54:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var TimeInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.TIME_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
TimeInput.prototype = Object.create(Input.prototype);

/*
 Overrides
 */


TimeInput.prototype.setAdvancedInputProperties = function () {

    this.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');


    //set default to current datetime?
    this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__default-to-current label input').prop('checked', this.set_to_current_datetime);

    //set datetime format
    this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__timeformat input[name="timeformatRadio"][value="' + this.datetime_format + '"]')
        .prop('checked', true);

    //set 'uniqueness' option
    //set 'input_ref' on 'uniqueness' option
    ui.input_properties_panel.setUniquenessProperty(formbuilder.current_form_index, this);

};

TimeInput.prototype.saveAdvancedProperties = function () {

    var form_index = formbuilder.current_form_index;
    var uniqueness;

    this.dom.advanced_properties_wrapper = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + this.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    //set default to current datetime?
    this.set_to_current_datetime = this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__default-to-current input')
        .is(':checked');

    //set datetime format
    this.datetime_format = this.dom.advanced_properties_wrapper
        .find('div.input-properties__form__advanced-properties__timeformat input[name="timeformatRadio"]:checked')
        .val();

    //save uniqueness
    save.saveUniqueness(this);
};

module.exports = TimeInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],55:[function(require,module,exports){
/* global $*/
'use strict';
var consts = require('config/consts');
var errors = require('actions/errors');
var jumps = require('actions/jumps');
var save = require('actions/save');
var input_properties = require('factory/input-properties');
var Input = require('factory/input-prototype');
var validation = require('actions/validation');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var VideoInput = function (the_input_ref) {

    //extend basic input wih common properties (easier than passing a properties object to Object.create)
    $.extend(true, this, input_properties);

    //set current instance properties
    //this.index = the_index;
    this.ref = the_input_ref;
    this.type = consts.VIDEO_TYPE;

    /* reset DOM properties (jquery selectors are not 'live', we need to run them again for new object)
     *
     * if the property below is not reset here, all the inputs will get the same dom reference
     * */
    this.dom = {};
    this.dom.is_valid = false;
};

//extend prototype from basic input object
VideoInput.prototype = Object.create(Input.prototype);

module.exports = VideoInput;

},{"actions/errors":2,"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"factory/input-properties":33,"factory/input-prototype":34,"helpers/ui":36,"helpers/utils":37}],56:[function(require,module,exports){
'use strict';
var consts = require('config/consts.js');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var load_child_form_containers = function () {

    var deferred = new $.Deferred();
    var views = {};
    var path = utils.getContainersPath();
    var version = consts.FORMBUILDER_VERSION;

    $.when(
        //inputs collection (sortable), holding all the inputs for a child form
        $.get(path + 'inputs-collection.html?v=' + version, function (data) {
            views.inputs_collection = data;
        }),
        //inputs properties, showing properties for selected input
        $.get(path + 'inputs-properties.html?v=' + version, function (data) {
            views.inputs_properties = data;
        })
    ).then(function () {
        deferred.resolve(views);
    });
    return deferred.promise();
};

module.exports = load_child_form_containers;

},{"config/consts.js":24,"config/formbuilder":26,"helpers/utils":37}],57:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var load_partials = require('loaders/load-partials');
var load_containers = require('loaders/load-containers');
var load_input_properties_views = require('loaders/load-input-properties-views');
var ui = require('helpers/ui');

/********************************************
 Load html components
 *******************************************/
var load_components = function () {

    var deferred = new $.Deferred();

    //load main containers (inputs tools, inputs collection and inputs properties) ("containers will be undefined")
    //load partials for input properties tabs ("partials")
    //load views for input properties ("views")
    $.when(load_containers(), load_partials(), load_input_properties_views()).then(function (containers, partials, views) {

        //init with first form ref
        var form_ref = formbuilder.project_definition.data.project.forms[0].ref;

        //inject ref into first form in the dom
        ui.forms_tabs.injectRefIntoFormTab(form_ref);

        //setup formbuilder object
        formbuilder.setup(form_ref, partials, views);


        deferred.resolve();
    });
    return deferred.promise();
};

module.exports = load_components;

},{"config/consts":24,"config/formbuilder":26,"helpers/ui":36,"loaders/load-containers":58,"loaders/load-input-properties-views":59,"loaders/load-partials":60}],58:[function(require,module,exports){
'use strict';
var consts = require('config/consts.js');
var utils = require('helpers/utils');

var get_containers = function () {

    var deferred = new $.Deferred();
    var path = utils.getContainersPath();
    var version = consts.FORMBUILDER_VERSION;

    //load container views for index.html (main entry point)
    $.when(
        //navbar
        $.get(path + 'navbar.html?v=' + version, function (data) {
            $('.navbar').html(data);
        }),
        //inputs tools list (source inputs to drag, draggable)
        $.get(path + 'inputs-tools.html?v=' + version, function (data) {
            $('.inputs-tools').html(data);
        }),
        //inputs collection (sortable), holding all the inputs for a form
        $.get(path + 'inputs-collection.html?v=' + version, function (data) {
            $('.inputs-collection').html(data);
        }),
        //inputs properties, showing properties for selected input
        $.get(path + 'inputs-properties.html?v=' + version, function (data) {
            $('.input-properties').html(data);
        })
    ).then(function () {
        deferred.resolve();
    });

    return deferred.promise();
};

module.exports = get_containers;

},{"config/consts.js":24,"helpers/utils":37}],59:[function(require,module,exports){
'use strict';
var consts = require('config/consts.js');
var ui = require('helpers/ui');
var utils = require('helpers/utils');


var load_input_properties_views = function () {

    var views = {};
    var deferred = new $.Deferred();
    var path = utils.getPropertiesPath();
    var version = consts.FORMBUILDER_VERSION;

    $.when(
        $.get(path + 'properties-audio.html?v=' + version, function (data) {
            views.audio = data;
        }),
        $.get(path + 'properties-barcode.html?v=' + version, function (data) {
            views.barcode = data;
        }),
        $.get(path + 'properties-branch.html?v=' + version, function (data) {
            views.branch = data;
        }),
        $.get(path + 'properties-checkbox.html?v=' + version, function (data) {
            views.checkbox = data;
        }),
        $.get(path + 'properties-date.html?v=' + version, function (data) {
            views.date = data;
        }),
        $.get(path + 'properties-dropdown.html?v=' + version, function (data) {
            views.dropdown = data;
        }),
        $.get(path + 'properties-group.html?v=' + version, function (data) {
            views.group = data;
        }),
        $.get(path + 'properties-integer.html?v=' + version, function (data) {
            views.integer = data;
            views.decimal = data;
        }),
        $.get(path + 'properties-location.html?v=' + version, function (data) {
            views.location = data;
        }),
        $.get(path + 'properties-photo.html?v=' + version, function (data) {
            views.photo = data;
        }),
        $.get(path + 'properties-phone.html?v=' + version, function (data) {
            views.phone = data;
        }),
        $.get(path + 'properties-radio.html?v=' + version, function (data) {
            views.radio = data;
        }),
        $.get(path + 'properties-textarea.html?v=' + version, function (data) {
            views.textarea = data;
        }),
        $.get(path + 'properties-readme.html?v=' + version, function (data) {
            views.readme = data;
        }),
        $.get(path + 'properties-text.html?v=' + version, function (data) {
            views.text = data;
        }),
        $.get(path + 'properties-time.html?v=' + version, function (data) {
            views.time = data;
        }),
        $.get(path + 'properties-video.html?v=' + version, function (data) {
            views.video = data;
        }),
        $.get(path + 'properties-searchsingle.html?v=' + version, function (data) {
            views.searchsingle = data;
        }),
        $.get(path + 'properties-searchsingle.html?v=' + version, function (data) {
            views.searchmultiple = data;
        })
    ).then(function () {
        deferred.resolve(views);
    });
    return deferred.promise();
};

module.exports = load_input_properties_views;

},{"config/consts.js":24,"helpers/ui":36,"helpers/utils":37}],60:[function(require,module,exports){
'use strict';
var consts = require('config/consts.js');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var get_partials = function () {

    var partials = {};
    var deferred = new $.Deferred();
    var path = utils.getPartialsPath();
    var version = consts.FORMBUILDER_VERSION;

    $.when(
        $.get(path + 'nav-tabs.html?v=' + version, function (data) {
            partials.navtabs = data;
        }),
        $.get(path + 'basic-properties.html?v=' + version, function (data) {
            partials.basic_properties = data;
        }),
        $.get(path + 'uniqueness-form-checkbox.html?v=' + version, function (data) {
            partials.uniqueness_form_checkbox = data;
        }),
        $.get(path + 'uniqueness-hierarchy-checkboxes.html?v=' + version, function (data) {
            partials.uniqueness_hierarchy_checkboxes = data;
        }),
        $.get(path + 'uniqueness-branch-checkbox.html?v=' + version, function (data) {
            partials.uniqueness_branch_checkbox = data;
        }),
        $.get(path + 'exit-branchgroup-editing.html?v=' + version, function (data) {
            partials.exit_branchgroup_editing = data;
        }),
        $.get(path + 'basic-media-properties.html?v=' + version, function (data) {
            partials.basic_media_properties = data;
        }),
        $.get(path + 'basic-branch-properties.html?v=' + version, function (data) {
            partials.basic_branch_properties = data;
        }),
        $.get(path + 'basic-group-properties.html?v=' + version, function (data) {
            partials.basic_group_properties = data;
        }),
        $.get(path + 'basic-readme-properties.html?v=' + version, function (data) {
            partials.basic_readme_properties = data;
        }),
        $.get(path + 'possible-answers-wrapper.html?v=' + version, function (data) {
            partials.possible_answers_wrapper = data;
        }),
        $.get(path + 'possible-answer-list-item.html?v=' + version, function (data) {
            partials.possible_answer_list_item = data;
        }),
        $.get(path + 'jumps-wrapper.html?v=' + version, function (data) {
            partials.jumps_wrapper = data;
        }),
        $.get(path + 'jump-list-item.html?v=' + version, function (data) {
            partials.jump_list_item = data;
        }),
        $.get(path + 'jump-list-item-always-jump.html?v=' + version, function (data) {
            partials.jump_list_item_always_jump = data;
        }),
        $.get(path + 'modal-form.html?v=' + version, function (data) {
            partials.modal_edit_form_name = data;
        }),
        $.get(path + 'input-tool.html?v=' + version, function (data) {
            partials.input_tool = data;
        })
    ).then(function () {
        deferred.resolve(partials);
    });
    return deferred.promise();
};

module.exports = get_partials;

},{"config/consts.js":24,"helpers/ui":36,"helpers/utils":37}],61:[function(require,module,exports){
'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var utils = require('helpers/utils');

var load_project = function () {

    //get version first, we need it for busting cache in inner ajax requests
    console.log($('#formbuilder-version').data());
    try {
        consts.FORMBUILDER_VERSION = $('#formbuilder-version').data().version;
    }
    catch (error) {
        console.log(error);
        consts.FORMBUILDER_VERSION = Date.now();
    }

    var deferred = new $.Deferred();

    utils.setProjectURL();

    console.log(consts.PROJECT_URL + '?' + Date.now());

    //load container views for index.html (main entry point)
    $.when(
        $.ajax({
            url: consts.PROJECT_URL + '?' + Date.now(),
            type: 'GET',
            //contentType: 'application/vnd.api+json',
            success: function (data) {
                formbuilder.project_definition = data;
                // formbuilder.project_definition = data
            },
            error: function (error) {
                console.log(error);
                formbuilder.project_definition = JSON.parse(pako.ungzip(window.atob(error.responseText), { 'to': 'string' }));
            }
        })
    ).then(function () {
        deferred.resolve();
    }).fail(function () {
        deferred.resolve();
    });
    return deferred.promise();
};

module.exports = load_project;

},{"config/consts":24,"config/formbuilder":26,"helpers/utils":37}],62:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var methods = {};

methods.replaceCommonAdvancedProperties = require('template/methods/replaceCommonAdvancedProperties');
methods.createInputToolHTML = require('template/methods/createInputToolHTML');
methods.prepareAdvancedInputPropertiesHTML = require('template/methods/prepareAdvancedInputPropertiesHTML');
methods.getJumpTabBtnHTML = require('template/methods/getJumpTabBtnHTML');
methods.getAdvancedTabBtnHTML = require('template/methods/getAdvancedTabBtnHTML');
methods.createBasicPropertiesHTML = require('template/methods/createBasicPropertiesHTML');
methods.getUniquenessHTML = require('template/methods/getUniquenessHTML');
methods.getPossibleAnswersHTML = require('template/methods/getPossibleAnswersHTML');
methods.getInputPropertiesPanelHTML = require('template/methods/getInputPropertiesPanelHTML');
methods.createInputPropertiesHTML = require('template/methods/createInputPropertiesHTML');
methods.getJumpsListHTML = require('template/methods/getJumpsListHTML');

var template = {

    replaceCommonAdvancedProperties: function (the_markup, the_input) {
        return methods.replaceCommonAdvancedProperties(the_markup, the_input);
    },
    createInputToolHTML: function (input) {
        return methods.createInputToolHTML(input);
    },
    prepareAdvancedInputPropertiesHTML: function (view, input) {
        return methods.prepareAdvancedInputPropertiesHTML(view, input);
    },
    getAdvancedTabBtnHTML: function (ref, is_active) {
        return methods.getAdvancedTabBtnHTML(ref, is_active);
    },
    getJumpTabBtnHTML: function (ref, is_active) {
        return methods.getJumpTabBtnHTML(ref, is_active);
    },
    createBasicPropertiesHTML: function (input) {
        return methods.createBasicPropertiesHTML(input);
    },
    getUniquenessHTML: function (input) {
        return methods.getUniquenessHTML(input);
    },
    getPossibleAnswersHTML: function (input) {
        return methods.getPossibleAnswersHTML(input);
    },
    getInputPropertiesPanelHTML: function (input) {
        return methods.getInputPropertiesPanelHTML(input);
    },
    createInputPropertiesHTML: function (input, view) {
        return methods.createInputPropertiesHTML(input, view);
    },
    getJumpsListHTML: function (input) {
        return methods.getJumpsListHTML(input);
    }
};

module.exports = template;

},{"config/consts":24,"config/formbuilder":26,"helpers/ui":36,"helpers/utils":37,"template/methods/createBasicPropertiesHTML":63,"template/methods/createInputPropertiesHTML":64,"template/methods/createInputToolHTML":65,"template/methods/getAdvancedTabBtnHTML":66,"template/methods/getInputPropertiesPanelHTML":67,"template/methods/getJumpTabBtnHTML":68,"template/methods/getJumpsListHTML":69,"template/methods/getPossibleAnswersHTML":70,"template/methods/getUniquenessHTML":73,"template/methods/prepareAdvancedInputPropertiesHTML":74,"template/methods/replaceCommonAdvancedProperties":75}],63:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var createBasicPropertiesHTML = function (input) {

    var html;
    var partials = formbuilder.dom.partials;
    var question = input.question;
    var is_required_checked = (input.is_required) ? 'checked' : '';
    var is_title_checked = (input.is_title) ? 'checked' : '';
    var is_branch_edit_disabled = (input.question === '') ? 'disabled' : '';
    var is_group_edit_disabled = (input.question === '') ? 'disabled' : '';
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
    var branch_inputs = [];

    //when editing a branch, check the title limit against the inputs within a branch (even the group inputs)
    if (formbuilder.is_editing_branch) {
        branch_inputs = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref).branch;
    }

    //if the input is NOT media type, get basic properties
    if (consts.SINGLE_ANSWER_TYPES.indexOf(input.type) !== -1 || consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) !== -1) {

        //if input is a readme type, get readme property
        if (input.type === consts.README_TYPE) {
            html = partials.basic_readme_properties;
        }
        else {
            html = partials.basic_properties;

            html = html.replace('{{required-flag-checked}}', is_required_checked);
            html = html.replace('{{title-flag-checked}}', is_title_checked);

            //if 3 titles are already set, disable title checkbox and show proper message
            //if we are editing a branch, check branch inputs for titles

            if (formbuilder.is_editing_branch ? utils.isMaxTitleLimitReached(branch_inputs) : utils.isMaxTitleLimitReached(inputs)) {
                if (!input.is_title) {
                    html = html.replace('{{is-title-disabled}}', 'disabled');
                    html = html.replace(/{{is-checkbox-disabled}}/g, 'disabled-checkbox');
                    html = html.replace('{{checkbox-title-label}}', consts.MAX_TITLE_LIMIT_REACHED);
                }
                else {
                    html = html.replace('{{is-title-disabled}}', '');
                    html = html.replace(/{{is-checkbox-disabled}}/g, '');
                    html = html.replace('{{checkbox-title-label}}', consts.USE_ANSWER_AS_TITLE);
                }
            }
            else {
                html = html.replace('{{is-title-disabled}}', '');
                html = html.replace(/{{is-checkbox-disabled}}/g, '');
                html = html.replace('{{checkbox-title-label}}', consts.USE_ANSWER_AS_TITLE);
            }
        }
    }

    //if input is a media type, get media properties
    if (consts.MEDIA_ANSWER_TYPES.indexOf(input.type) !== -1) {
        html = partials.basic_media_properties;
    }

    //is a branch? check the edit button status
    if (input.type === consts.BRANCH_TYPE) {
        html = partials.basic_branch_properties;
        html = html.replace('{{branch-edit-disabled}}', is_branch_edit_disabled);
    }

    //is a group? check the edit button status
    if (input.type === consts.GROUP_TYPE) {
        html = partials.basic_group_properties;
        html = html.replace('{{group-edit-disabled}}', is_group_edit_disabled);
    }

    html = html.replace(/{{input-ref-question}}/g, input.ref + '-question');
    html = html.replace('{{basic-input-ref}}', 'basic-' + input.ref);
    html = html.replace('{{input-question-value}}', question);

    return html;
};

module.exports = createBasicPropertiesHTML;

},{"config/consts":24,"config/formbuilder":26,"helpers/utils":37}],64:[function(require,module,exports){
'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var utils = require('helpers/utils');

var createInputPropertiesHTML = function (the_input, the_view) {

    var self = this;
    var html = the_view;
    var input = the_input;
    var partials = formbuilder.dom.partials;
    var is_media_type = consts.MEDIA_ANSWER_TYPES.indexOf(input.type) !== -1;
    var nav_tabs = partials.navtabs;
    var advanced_tab_btn;
    var jump_tab_button;
    var properties;
    var jumps_html;
    var jump_list_html;

    html = html.replace('{{input-ref}}', input.ref);
    html = html.replace('{{advanced-input-ref}}', 'advanced-' + input.ref);

    //get navtabs html
    nav_tabs = nav_tabs.replace('{{#basic-input-ref}}', '#basic-' + input.ref);

    //for media inputs, branch and groups, readme, get disabled 'Advanced tab' button
    if (is_media_type || input.type === consts.BRANCH_TYPE || input.type === consts.GROUP_TYPE || input.type === consts.README_TYPE) {
        advanced_tab_btn = self.getAdvancedTabBtnHTML(input.ref, false);
    }
    else {
        //get enable advanced tab button
        advanced_tab_btn = self.getAdvancedTabBtnHTML(input.ref, true);
    }

    nav_tabs = nav_tabs.replace('{{advanced-tab-btn}}', advanced_tab_btn);

    //for inputs NESTED within a group, disable jumps tab, as we cannot have jumps in groups
    if (formbuilder.is_editing_group) {
        jump_tab_button = self.getJumpTabBtnHTML(input.ref, false);
    }
    else {
        jump_tab_button = self.getJumpTabBtnHTML(input.ref, true);
    }

    nav_tabs = nav_tabs.replace('{{jumps-tab-btn}}', jump_tab_button);

    html = html.replace('{{nav-tabs}}', nav_tabs);

    //get properties html
    properties = self.createBasicPropertiesHTML(input);
    html = html.replace('{{properties}}', properties);

    //get jumps html
    jumps_html = partials.jumps_wrapper;
    jumps_html = jumps_html.replace('{{jumps-input-ref}}', 'jumps-' + input.ref);

    //build jump list html
    if (input.jumps.length > 0) {
        //get list of jumps markup
        jump_list_html = self.getJumpsListHTML(input);
        jumps_html = jumps_html.replace('{{no-jumps_message-hidden}}', 'hidden');

        jumps_html = jumps_html.replace('{{jumps-list}}', jump_list_html);

        //if we reached the max number of jumps or this input does not allow multiple jumps, disable button
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) > -1) {
            //multiple answer input, disable add jump if the maximum number of jumps for the input is reached
            // or exceeded, the latter because we had a bug.
            if (input.jumps.length >= input.possible_answers.length) {
                jumps_html = jumps_html.replace('{{add-jump-btn-state}}', 'disabled');
            }
            else {
                jumps_html = jumps_html.replace('{{add-jump-btn-state}}', '');
            }
        }
        else {
            //single answer input
            jumps_html = jumps_html.replace('{{add-jump-btn-state}}', 'disabled');
        }
    }
    else {
        //no jumps list to render
        jumps_html = jumps_html.replace('{{jumps-list}}', '');
        jumps_html = jumps_html.replace('{{add-jump-btn-state}}', '');
        jumps_html = jumps_html.replace('{{no-jumps_message-hidden}}', '');
    }

    html = html.replace('{{jumps}}', jumps_html);

    //disable "Add Jump" button if the max number of jumps is reached
    if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) !== -1) {
        //multiple jumps allowed, check if limit met (number of jumps must be less or equal to possible answers)
        if (input.jumps.length >= input.possible_answers.length) {
            html = html.replace('{{add-jump-btn-state}}', 'disabled="disabled"');
        }
        else {
            html = html.replace('{{add-jump-btn-state}}', '');
        }
    }
    else {
        //single jump allowed, enable add jump button
        html = html.replace('{{add-jump-btn-state}}', '');
    }

    //if multiple choice input type, append possible answer wrapper
    if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) !== -1) {

        html = html.replace('{{possible-answers}}', self.getPossibleAnswersHTML(input));
    }
    else {
        html = html.replace('{{possible-answers}}', '');
    }

    //check if input allows uniqueness
    if (consts.UNIQUENESS_ALLOWED_TYPES.indexOf(input.type) !== -1) {
        html = html.replace('{{uniqueness}}', self.getUniquenessHTML(input));
    }
    return html;
};

module.exports = createInputPropertiesHTML;



},{"config/consts":24,"config/formbuilder":26,"helpers/utils":37}],65:[function(require,module,exports){
'use strict';
var utils = require('helpers/utils');
var consts = require('config/consts');
var messages = require('config/messages');

var createInputToolHTML = function (input) {

    var html = '';
    var icon = utils.getInputToolIcon(input.type);
    var is_input_branch = (input.type === consts.BRANCH_TYPE) ? 'input-branch' : '';
    var is_input_group = (input.type === consts.GROUP_TYPE) ? 'input-group' : '';
    var question = input.question === '' ? messages.error.NO_QUESTION_TEXT_YET : input.question;
    var invisible_class = input.jumps.length > 0 ? '' : 'invisible';

    //convert html entities to tags and strip html tags from readme type if any
    if (input.type === consts.README_TYPE) {
        question = utils.decodeHtml(input.question);
        question = question.replace(/(<([^>]+)>)/ig, ' ');
        //wrap in "" to avoid rendering of <br/>
        question = '"' + question + '"';
    }

    html += '<div class="input ' + is_input_branch + is_input_group + ' ui-draggable ui-draggable-handle" ';
    html += 'data-type="' + input.type + '" data-input-ref="' + input.ref + '">';
    html += '<div class="input-inner">';
    html += '<i class="fa fa-2x fa-fw ' + icon + '"></i>';
    html += '<span class="question-preview">' + question.trunc(consts.LIMITS.question_preview_length) + '</span>';
    html += '<i class="question-state fa fa-check fa-2x fa-fw pull-right"></i>';
    html += '<i class="jump-state fa fa-arrow-circle-o-down fa-2x fa-fw pull-right ' + invisible_class + '"></i>';

    if (input.type === consts.BRANCH_TYPE) {
        html += '{{branch-content}}';
    }
    if (input.type === consts.GROUP_TYPE) {
        html += '{{group-content}}';
    }
    html += '</div>';
    html += '</div>';

    return html;
};

module.exports = createInputToolHTML;

},{"config/consts":24,"config/messages":28,"helpers/utils":37}],66:[function(require,module,exports){
'use strict';

var getAdvancedTabBtnHTML = function (ref, is_active) {

    var html = '';

    if (is_active) {
        html += '<li role="presentation" class="nav-tabs__tab-btn-item advanced-tab">';
        html += '<a href="#advanced-' + ref + '" role="tab" data-toggle="tab"> Advanced&nbsp;';
        html += '<i class="fa fa-exclamation fa-2x invisible advanced-error"></i>';
        html += '</a>';
        html += '</li>';
    }
    else {

        html += '<li role="presentation" class="disabled disabled-tab nav-tabs__tab-btn-item">';
        html += '<a href="#" role="tab" > Advanced&nbsp;';
        html += '<i class="fa fa-exclamation fa-2x  invisible advanced-error"></i>';
        html += '</a>';
        html += '</li>';
    }
    return html;
};

module.exports = getAdvancedTabBtnHTML;

},{}],67:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');

var getInputPropertiesPanelHTML = function (the_input) {

    //todo use the function here http://jsfiddle.net/jfriend00/DyCwk/
    var self = this;
    var input = the_input;
    var is_media_type = consts.MEDIA_ANSWER_TYPES.indexOf(input.type) !== -1;
    var html = formbuilder.dom.input_properties_views[input.type];

    //get dynamic html for input properties panel
    html = self.createInputPropertiesHTML(input, html);

    //prepare advanced properties (NOT for branch or groups or media types)
    if (input.type !== consts.BRANCH_TYPE || input.type !== consts.GROUP_TYPE || !is_media_type) {
        //manipulate dom for advanced options, which are unique (most of the time) to the input type
        html = self.prepareAdvancedInputPropertiesHTML(html, input);
    }

    return html;

};

module.exports = getInputPropertiesPanelHTML;

},{"config/consts":24,"config/formbuilder":26}],68:[function(require,module,exports){
'use strict';

var getJumpTabBtnHTML =  function (ref, is_active) {

    var html = '';

    if (is_active) {

        html += '<li role="presentation" class="jump-tab nav-tabs__tab-btn-item">';
        html += '<a href="#jumps-' + ref + '" role="tab" data-toggle="tab" > Jumps&nbsp;';
        html += '<i class="fa fa-exclamation fa-2x invisible jumps-error"></i>';
        html += '</a>';
        html += '</li>';

    }
    else {

        html += '<li role="presentation" class="jump-tab disabled disabled-tab nav-tabs__tab-btn-item">';
        html += '<a href="#" class="nav-tabs__jump" role="tab" > Jumps&nbsp;';
        html += '<i class="fa fa-exclamation fa-2x invisible jumps-error"></i>';
        html += '</a>';
        html += '</li>';
    }
    return html;
};

module.exports = getJumpTabBtnHTML;

},{}],69:[function(require,module,exports){
/*jshint expr:true */
'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var utils = require('helpers/utils');

function _getSelectedJumpAnswerHTML(possible_answer) {
    return '<option value="' + possible_answer.answer_ref + '" selected="selected">' + possible_answer.answer + '</option>';
}

function _getSelectedJumpConditionHTML(jump) {

    var text = '';

    $(consts.JUMP_CONDITIONS).each(function (index, condition) {
        if (condition.key === jump.when) {
            text = condition.text;
            return false;
        }
    });
    return '<option value="' + jump.when + '" selected="selected">' + text + '</option>';
}

function _getSelectedJumpDestinationHTML(destination_input) {
    return '<option value="' + destination_input.ref + '" selected="selected">' + destination_input.question + '</option>';
}

var getJumpsListHTML = function (input) {

    var html = '';
    var inputs = [];
    var selected_condition_html;
    var selected_possible_answer_html;

    //get input list (hierarchy or branch)
    var parts = input.ref.split('_');
    if (parts.length > 3) {
        //this is a branch ref
        parts.pop();
        inputs = utils.getInputObjectByRef(parts.join('_')).branch;
    }
    else {
        inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
    }
    //jump destinations: cannot jump on the next one, but always next + 1
    var jump_destinations = utils.getJumpAvailableDestinations(input, inputs);

    $(input.jumps).each(function (index, jump) {

        /****************************************************************************************************
         * set `when option`
         */
        if (consts.MULTIPLE_ANSWER_TYPES.indexOf(input.type) === -1) {
            //append a jump with condition disabled and set to 'always' jump
            //we do this because on EC5 when the question is an open answer, a jump will always jump no matter the answer given
            html += formbuilder.dom.partials.jump_list_item_always_jump;
        }
        else {
            //jumps get full functionality with multiple answers input types
            html += formbuilder.dom.partials.jump_list_item;

            selected_condition_html = _getSelectedJumpConditionHTML(jump);
            html = html.replace('{{logic-when-saved-option}}', selected_condition_html);

            /****************************************************************************************************
             *  set selected `answer`
             */
            $(input.possible_answers).each(function (index, possible_answer) {
                if (possible_answer.answer_ref === jump.answer_ref) {
                    selected_possible_answer_html = _getSelectedJumpAnswerHTML(possible_answer);
                }
            });
            html = html.replace('{{logic-answer-saved-option}}', selected_possible_answer_html);
            /***************************************************************************************************/

        }
        /****************************************************************************************************
         *  set selected `goto`
         */
        var selected_goto_html = '';
        if (jump.to === 'END') {
            selected_goto_html = _getSelectedJumpDestinationHTML({ ref: 'END', question: 'End of form' });
        }
        else {
            $(jump_destinations).each(function (index, jump_destination) {
                if (jump_destination.ref === jump.to) {
                    selected_goto_html = _getSelectedJumpDestinationHTML(jump_destination);
                    return false;
                }
            });
        }

        html = html.replace('{{logic-goto-saved-option}}', selected_goto_html);
        /***************************************************************************************************/

        html = html.replace(/{{input-ref-logic-when}}/g, index + '-' + input.ref + '-logic-when');
        html = html.replace(/{{input-ref-logic-goto}}/g, index + '-' + input.ref + '-logic-goto');
        html = html.replace(/{{input-ref-logic-answer}}/g, index + '-' + input.ref + '-logic-answer');

    });


    return html;
};

module.exports = getJumpsListHTML;

},{"config/consts":24,"config/formbuilder":26,"helpers/utils":37}],70:[function(require,module,exports){
'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var getPossibleAnswersList = require('template/methods/getPossibleAnswersList');

//generate list of possible answers and inject it into its wrapper, then return it
var getPossibleAnswersHTML = function (the_input) {

    var input = the_input;
    var wrapper = formbuilder.dom.partials.possible_answers_wrapper;
    var list = getPossibleAnswersList(input.possible_answers);

    wrapper = wrapper.replace('{{possible-answers-list}}', list);

    //toggle "add answers" button
    if (input.possible_answers.length >= consts.LIMITS.possible_answers_max) {
        //is it a search type? limit is higher for search type
        if(input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {
            if (input.possible_answers.length >= consts.LIMITS.possible_answers_max_search) {
                wrapper = wrapper.replace('{{disabled}}', 'disabled');
            }
            else {
                wrapper = wrapper.replace('{{disabled}}', '');
            }
        }
        else {
            wrapper = wrapper.replace('{{disabled}}', 'disabled');
        }
    }
    else {
        wrapper = wrapper.replace('{{disabled}}', '');
    }

    return wrapper;
};

module.exports = getPossibleAnswersHTML;

},{"config/consts":24,"config/formbuilder":26,"template/methods/getPossibleAnswersList":71}],71:[function(require,module,exports){
'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');

//generate list of possible answers and return html
var getPossibleAnswersList = function (possible_answers) {

    var list = '';
    var list_item = '';

    //generate markup for first possible answers page
    $(possible_answers).each(function (index, possible_answer) {

        if (index === consts.LIMITS.possible_answers_per_page) {
            return false;
        }

        list_item = formbuilder.dom.partials.possible_answer_list_item;
        list_item = list_item.replace('{{answer-ref}}', possible_answer.answer_ref);
        list_item = list_item.replace('{{answer}}', possible_answer.answer);

        if (index === 0 && possible_answers.length === 1) {
            list_item = list_item.replace('{{disabled}}', 'disabled');
        }
        else {
            list_item = list_item.replace('{{disabled}}', '');
        }
        list += list_item;
    });

    return list;
};

module.exports = getPossibleAnswersList;

},{"config/consts":24,"config/formbuilder":26}],72:[function(require,module,exports){
'use strict';
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');
var consts = require('config/consts');

//generate list of possible answers and inject it into its wrapper, then return it
var getPossibleAnswersPage = function (the_input, the_page) {

    var input = the_input;
    var current_page = the_page;
    var list_item = '';
    var list = '';
    var properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');
    var possible_answers_wrapper = properties_panel.find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');
    var from_index = (current_page - 1) * consts.LIMITS.possible_answers_per_page;
    var to_index = current_page * consts.LIMITS.possible_answers_per_page;

    //remove possible aswers from dom
    possible_answers_wrapper.find('li').remove();

    //get next possible answers
    var possible_answers =  input.possible_answers.slice(from_index, to_index);

    $(possible_answers).each(function (index, possible_answer) {

        //replace double quotes with html entities
        possible_answer.answer = possible_answer.answer.replace(/"/gi, '&quot;');

        list_item = formbuilder.dom.partials.possible_answer_list_item;
        list_item = list_item.replace('{{answer-ref}}', possible_answer.answer_ref);
        list_item = list_item.replace('{{answer}}', possible_answer.answer);

        if (index === 0 && input.possible_answers.length === 1) {
            list_item = list_item.replace('{{disabled}}', 'disabled');
        }
        else {
            list_item = list_item.replace('{{disabled}}', '');
        }
        list += list_item;

        //if the possible answer is invalid, add error in the dom
        if(possible_answer.answer === '') {
            //todo

        }
    });

    //append new page to dom
    possible_answers_wrapper.hide().html(list).fadeIn(consts.ANIMATION_SLOW);
};

module.exports = getPossibleAnswersPage;

},{"config/consts":24,"config/formbuilder":26,"helpers/utils":37}],73:[function(require,module,exports){
'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');

var getUniquenessHTML = function (the_input) {

    var html = '';
    var input = the_input;
    var form_index = formbuilder.current_form_index;
    var current_form_name = formbuilder.project_definition.data.project.forms[form_index].name;
    var partials = formbuilder.dom.partials;
    var parent_form_name;
    var is_uniqueness_form_checked;
    var is_uniqueness_hierarchy_checked;

    function getStandardUniquessMarkup(markup) {

        markup = partials.uniqueness_hierarchy_checkboxes;
        parent_form_name = formbuilder.project_definition.data.project.forms[form_index - 1].name;
        markup = markup.replace(/{{parent-form-name}}/g, parent_form_name);
        markup = markup.replace('{{input-ref-uniqueness-hierarchy}}', input.ref + '-uniqueness-hierarchy');

        is_uniqueness_hierarchy_checked = (input.uniqueness === consts.UNIQUESS_HIERARCHY) ? 'checked' : '';
        markup = markup.replace('{{input-ref-uniqueness-hierarchy-checked}}', is_uniqueness_hierarchy_checked);

        return markup;
    }

    function getBranchUniquenessMarkup(markup) {
        //branch uniquess is within for all the '{branch header}' entries for a branch question within a single entry ('form')
        markup = partials.uniqueness_branch_checkbox;
        markup = markup.replace('{{branch-header}}', formbuilder.branch.active_branch_header);

        return markup;
    }

    //add uniqueness constraint based on form hierarchy
    if (form_index > 0) {
        //child forms, user cn select form or hierarchy uniqueness
        if (formbuilder.is_editing_branch) {
            //if (formbuilder.is_editing_group) {
            //    //nested group gets standard uniqueness
            //    html = getStandardUniquessMarkup(html);
            //}
            //  else {
            //branches get its own uniqueness
            html = getBranchUniquenessMarkup(html);
            //  }
        }
        else {
            //standard uniqueness
            html = getStandardUniquessMarkup(html);
        }
    }

    else {
        //standard uniqueness, top parent form inputscan be set to form uniqueness only
        if (!formbuilder.is_editing_branch) {
            html = partials.uniqueness_form_checkbox;
        }
        else {
            //branches get its own uniqueness
            //if (formbuilder.is_editing_group) {
            //    //group gets standard uniqueness
            //    html = partials.uniqueness_form_checkbox;
            //}
            //else {
            //branch uniquess is within for all the branches within a single entry ('form')
            html = getBranchUniquenessMarkup(html);
            // }
        }
    }

    //common markup
    html = html.replace('{{input-ref-uniqueness-form}}', input.ref + '-uniqueness-form');
    is_uniqueness_form_checked = (input.uniqueness === consts.UNIQUESS_FORM) ? 'checked' : '';
    html = html.replace('{{input-ref-uniqueness-form-checked}}', is_uniqueness_form_checked);
    html = html.replace(/{{form-name}}/g, current_form_name);

    return html;
};

module.exports = getUniquenessHTML;

},{"config/consts":24,"config/formbuilder":26}],74:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var utils = require('helpers/utils');

var prepareAdvancedInputPropertiesHTML = function (view, input) {

    var html = view;
    var ref = input.ref;
    var type = input.type;
    var datetime_format = {
        is_checked_datetime_format_1: '',//set first format as default
        is_checked_datetime_format_2: '',
        is_checked_datetime_format_3: '',
        is_checked_datetime_format_4: '',
        is_checked_datetime_format_5: ''
    };

    var is_integer_checked;
    var is_decimal_checked;
    var is_search_single_checked;
    var is_search_multiple_checked;

    function _replaceDatetimeAdvancedProperties(type) {

        var i;
        var iLength = 6;

        //if it is a new input, set datatime format to default
        if (input.datetime_format === null) {
            if (input.type === consts.TIME_TYPE) {
                //for time questions, default to HH:mm to get best UI on device
                input.datetime_format = consts[type.toUpperCase() + '_FORMAT_3'];
            }
            else {
                input.datetime_format = consts[type.toUpperCase() + '_FORMAT_1'];
            }
        }

        //set datetime format to the one saved
        for (i = 1; i < iLength; i++) {
            datetime_format['is_checked_datetime_format_' + i] = input.datetime_format === consts[type.toUpperCase() + '_FORMAT_' + i] ? 'checked' : '';
            html = html.replace('{{is-checked-datetime-format-' + i + '}}', datetime_format['is_checked_datetime_format_' + i]);
        }
        html = html.replace('{{input-ref-default-to-current}}', ref + '-default-to-current');
        html = html.replace('{{set-to-current-datetime}}', set_to_current_datetime);
    }

    function _replaceNumericAdvancedProperties(type) {

        is_integer_checked = 'checked';
        is_decimal_checked = '';

        if (type === consts.DECIMAL_TYPE) {
            is_integer_checked = '';
            is_decimal_checked = 'checked';
        }

        html = html.replace('{{is-integer-checked}}', is_integer_checked);
        html = html.replace('{{is-decimal-checked}}', is_decimal_checked);
        html = html.replace('{{input-ref-min-value}}', input.min);
        html = html.replace('{{input-ref-max-value}}', input.max);
        html = html.replace(/{{input-ref-integer}}/g, ref + '-integer');
        html = html.replace(/{{input-ref-decimal}}/g, ref + '-decimal');
        html = html.replace(/{{input-ref-min}}/g, ref + '-min');
        html = html.replace(/{{input-ref-max}}/g, ref + '-max');

    }

    function _replaceSearchAdvancedProperties(type) {

        is_search_single_checked = 'checked';
        is_search_multiple_checked = '';

        if (type === consts.SEARCH_MULTIPLE_TYPE) {
            is_search_single_checked = '';
            is_search_multiple_checked = 'checked';
        }

        html = html.replace('{{is-searchsingle-checked}}', is_search_single_checked);
        html = html.replace('{{is-searchmultiple-checked}}', is_search_multiple_checked);


    }

    function _getInitialAnswerHTML(input, the_html) {

        var html = the_html;
        var answer_label = '';

        html = html.replace(/{{input-ref-default}}/g, input.ref + '-default');

        if (input.default === '' || input.default === null) {
            //no, set 'none'
            html = html.replace(/{{selected}}/g, 'selected');
            html = html.replace(/{{initial-answer}}/g, '');
        }
        else {

            //get possible answer label
            answer_label = utils.getPossibleAnswerLabel(input);

            html = html.replace(/{{selected}}/g, '');
            html = html.replace(/{{initial-answer}}/g, '<option value="' + input.default + '"  selected >' + answer_label + '</option>');
        }
        return html;
    }

    var set_to_current_datetime = (input.set_to_current_datetime) ? 'checked' : '';

    switch (type) {

        case consts.DROPDOWN_TYPE:
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        case consts.RADIO_TYPE:
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        case consts.CHECKBOX_TYPE:
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        case consts.INTEGER_TYPE:
            html = this.replaceCommonAdvancedProperties(html, input);
            _replaceNumericAdvancedProperties(type);
            break;
        case consts.DECIMAL_TYPE:
            html = this.replaceCommonAdvancedProperties(html, input);
            _replaceNumericAdvancedProperties(type);
            break;
        case consts.DATE_TYPE:
            _replaceDatetimeAdvancedProperties(consts.DATE_TYPE);
            break;
        case consts.TIME_TYPE:
            _replaceDatetimeAdvancedProperties(consts.TIME_TYPE);
            break;
        case consts.SEARCH_SINGLE_TYPE:
            _replaceSearchAdvancedProperties(consts.SEARCH_SINGLE_TYPE);
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        case consts.SEARCH_MULTIPLE_TYPE:
            _replaceSearchAdvancedProperties(consts.SEARCH_MULTIPLE_TYPE);
            //set initial answer
            html = _getInitialAnswerHTML(input, html);
            break;
        default:
            html = this.replaceCommonAdvancedProperties(html, input);

    }
    return html;
};

module.exports = prepareAdvancedInputPropertiesHTML;

},{"config/consts":24,"helpers/utils":37}],75:[function(require,module,exports){
'use strict';

var replaceCommonAdvancedProperties = function (the_markup, the_input) {

    var html = the_markup;
    var input = the_input;

    var replacements = [
        {
            to_be_replaced: /{{input-ref-default}}/g,
            with_this: input.ref + '-default'
        },
        {
            to_be_replaced: /{{input-ref-regex}}/g,
            with_this: input.ref + '-regex'
        },
        {
            to_be_replaced: /{{input-ref-double-entry}}/g,
            with_this: input.ref + '-double-entry'
        },
        {
            to_be_replaced: '{{input-ref-default-value}}',
            with_this: (input.default === null) ? '' : input.default
        },
        {
            to_be_replaced: '{{input-ref-regex-value}}',
            with_this: (input.regex === null) ? '' : input.regex
        },
        {
            to_be_replaced: '{{input-ref-double-entry-checked}}',
            with_this: input.verify ? 'checked' : ''
        }
    ];

    //replace placeholder with values from input
    $(replacements).each(function (index, replacement) {
        html = html.replace(replacement.to_be_replaced, replacement.with_this);
    });

    return html;
};

module.exports = replaceCommonAdvancedProperties;


},{}],76:[function(require,module,exports){
'use strict';
var formbuilder = require('config/formbuilder');
var messages = require('config/messages');
var validation = require('actions/validation');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var consts = require('config/consts');
var template = require('template');
var toast = require('config/toast');
var possibleAnswersSortable = require('ui-handlers/possible-answers-sortable');

var branch_sortable = function () {

    var branch_input;

    return {
        cursor: 'move',
        items: '.input',
        revert: 100,
        //axis: 'y',// it causes the placeholder to be always active
        containment: 'parent',
        tolerance: 'pointer',
        // forcePlaceholderSize: true,
        placeholder: 'input-collection-drop-placeholder',

        //triggered when a new input is dropped over the sortable
        receive: function (e, jquery_ui) {

            var form_index = formbuilder.current_form_index;
            var previous_branch_input_ref = formbuilder.branch.current_input_ref;
            var current_element;
            var branch_inputs = utils.getInputObjectByRef(formbuilder.current_input_ref).branch;
            var branch_input_ref = utils.generateBranchGroupInputRef(formbuilder.current_input_ref);
            var branch_input_index = branch_inputs.length;
            var branch_input_type = jquery_ui.item.attr('data-type');
            var input_factory = require('factory/input-factory');

            //do not consider branch inputs within a branch
            if (branch_input_type === consts.BRANCH_TYPE) {
                return false;
            }
            else {

                formbuilder.branch.current_input_ref = branch_input_ref;

                //validate previous input (if any) to show embedded errors (in case the ser did not press validate button)
                //todo is this an overkill?
                if (previous_branch_input_ref) {
                    validation.performValidation(utils.getBranchInputObjectByRef(previous_branch_input_ref), false);
                }

              //  console.log('branch sortable receive');

                formbuilder.branch.collection_is_being_sorted = false;

                //generate input object based on type and set index incrementally
                branch_input = input_factory.createInput(branch_input_type, branch_input_ref);
                //formbuilder.current_input_ref = input.ref;
             //   console.log(branch_input);

                //disable current active element
                current_element = formbuilder.dom.inputs_collection_sortable.find('.active');
                current_element.removeClass('active');

                //add input to collection as the last one
                branch_inputs.push(branch_input);
                //console.log(branch_inputs);
                //console.log(formbuilder.project_definition.data.project.forms[form_index].inputs);
            }

            //disable save project button as by default an input is invalid when it is created
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);

            //set form tab as invalid, as the new input will be invalid by default
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);
        },
        stop: function (e, jquery_ui) {

            var undo = require('actions/undo');
            var form_index = formbuilder.current_form_index;
            var branch_input_ref = formbuilder.branch.current_input_ref;
            var owner_input_ref = formbuilder.current_input_ref;
            var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
            var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;
            var branch_inputs = inputs[owner_input_index].branch;
            var placeholder_text = messages.error.NO_QUESTION_TEXT_YET;
            var input_type = jquery_ui.item.attr('data-type');
            var active_branch;
            var properties_panel_html;

            //disable draggable if we hit the max amount of inputs allowed
            if (utils.getInputsTotal(inputs) >= consts.INPUTS_MAX_ALLOWED) {
                ui.input_tools.disable();
            }

            //reject branch inputs here
            if (input_type === consts.BRANCH_TYPE) {
                jquery_ui.item.remove();

                //if branch inputs length is zero, show help text placeholder
                //todo
            }
            else {

                //count search inputs
                if(input_type === consts.SEARCH_SINGLE_TYPE && !formbuilder.branch.collection_is_being_sorted) {
                    //if the limit is reached, hide search from input tools
                    if (utils.getSearchInputsTotal() >= consts.LIMITS.search_inputs_max) {
                        ui.input_tools.hideSearchInput();
                        console.log('search limit reached');

                        //show warning to user
                        toast.showWarning(messages.warning.SEARCH_INPUTS_LIMIT_REACHED + '(' + consts.LIMITS.search_inputs_max + ')');
                    }
                }

            //    console.log('sortable stop');
                jquery_ui.item.removeAttr('style'); // undo styling set by jqueryUI (http://goo.gl/EKz8tC)

                //get the index where the input was dropped (skip when list is empty)
                //nb the -2 is to remove the element which are no input (warning messages)
                formbuilder.branch.to_index = jquery_ui.item.index() === 0 ? jquery_ui.item.index() : jquery_ui.item.index() - 2;

                //hide message about no input selected, as dropped input gets focus
                formbuilder.dom.input_properties_no_input_selected.hide();

                /*
                 if the user is dragging a new input over, it was added as the last element of the array
                 otherwise the current input position is set in the start event
                 */
                if (!formbuilder.branch.collection_is_being_sorted) {

                    //override 'from_index' as we are dropping a new element (min value for length is 1, as we add the input in the `receive` function)
                    formbuilder.branch.from_index = branch_inputs.length - 1;

                    //move inputs to keep the array sequence like the input sequence on screen
                    branch_inputs.move(formbuilder.branch.from_index, formbuilder.branch.to_index);
                    //console.log(branch_inputs);
                    //console.log(branch_inputs.length);

                    jquery_ui.item.addClass('active');
                    jquery_ui.item.attr('data-input-ref', branch_input_ref);

                    //append input id and a warning icon, as by default the question does not have any text
                    jquery_ui.item.find('.input-inner').append(ui.inputs_collection.getInputStateIconsHTML());
                    jquery_ui.item.find('span.question-preview').text(placeholder_text);

                    //set owner branch as invalid as we are adding an invalid input
                    active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
                    ui.inputs_collection.showInputInvalidIcon(active_branch.ref);

                    //show input properties for the new dropped input
                    formbuilder.dom.input_properties.find('.panel-body form').hide();
                    formbuilder.dom.input_properties.find('.panel-title span').text(placeholder_text);

                    //create properties panel in right sidebar for this input (common properties)
                    properties_panel_html = template.getInputPropertiesPanelHTML(branch_input);

                    //append input and show it as it gets selected by default
                    formbuilder.dom.input_properties_forms_wrapper.hide();
                    $(properties_panel_html).removeClass('hidden').appendTo(formbuilder.dom.input_properties_forms_wrapper);
                    formbuilder.dom.input_properties_forms_wrapper.fadeIn(consts.ANIMATION_FAST);


                    //show action buttons for input
                    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);

                    //for nested group, enable keyup to check for validation of header text
                    //triggered when users type in the header input field for nested group
                    //todo check this
                    if (branch_input.type === consts.GROUP_TYPE) {
                        //formbuilder.dom.input_properties.off('keyup').on('keyup', 'input', input_properties_keyup_callback);
                    }
                    else {
                        //formbuilder.dom.input_properties.off('keyup');
                    }

                    //enable sortable on current input (only when first created)
                    possibleAnswersSortable(branch_input);
                }
                else {

                    //'from_index is set in start event of sortable'
                    //move branch inputs to keep the array sequence like the input sequence on screen
                    branch_inputs.move(formbuilder.branch.from_index, formbuilder.branch.to_index);
                    //console.log(branch_inputs);

                    //run the validation on all branch jumps, as we might have some invalid destinations after re-ordering
                    //I am forced to do this against all the branch inputs
                    validation.validateJumpsAfterSorting(branch_inputs);

                    jquery_ui.item.addClass('active');
                }
            }

            //todo test this thing
            //add this state for undoing, so it is easier to rebind everything
            formbuilder.render_action = consts.RENDER_ACTION_DO;
            undo.pushState();

            if (input_type === consts.README_TYPE) {
                $('.summernote').summernote(consts.SUMMERNOTE_OPTIONS);
            }

            //if there is not any title set, show warning
            ui.inputs_collection.toggleTitleWarning(utils.getTitleCount(branch_inputs), true);

        },
        //this callback is triggered when the user start dragging an existing input from the      sortable
        start: function (e, jquery_ui) {


            console.log('sortable start');
            //get current input position, as we need to move from here
            //console.log('branch input index: ' + jquery_ui.item.index());

            formbuilder.branch.collection_is_being_sorted = true;

            //nb the -2 is to remove the element which are no input (warning messages)
            formbuilder.branch.from_index = jquery_ui.item.index() === 0 ? 0 : jquery_ui.item.index() - 2;

            //de-activate all inputs in collection
            formbuilder.dom.inputs_collection_sortable.removeClass('active');

        },
        scroll: true,
        snap: false,
        over: function (e, jquery_ui) {

            var owner_input_ref = formbuilder.branch.active_branch_ref;
            var owner_input = utils.getInputObjectByRef(owner_input_ref);

            //hide help text if the list is empty and we are hovering with an input
            if (owner_input.branch.length === 0) {
                //remove input from dom collection (middle column)
                formbuilder.dom.inputs_collection_sortable
                    .find('div.input[data-input-ref="' + owner_input_ref + '"]')
                    .find('.input-properties__no-branch-questions-message')
                    .hide();
            }
        }
    };
};

module.exports = branch_sortable();

},{"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"factory/input-factory":31,"helpers/ui":36,"helpers/utils":37,"template":62,"ui-handlers/possible-answers-sortable":99}],77:[function(require,module,exports){
'use strict';
var formbuilder = require('../config/formbuilder');
var draggable = function () {

    $('ul#inputs-tools-list li div.input').draggable({
        connectToSortable: '.sortable',
        //clone element keeping same width when dragging
        //mind: `evt` is jquery generated, it cannot be called anything else!
        helper: function (evt) {

            var event = evt || window.event;

            /*
             clone always the input wrapper, checking which element the user is actually dragging
             */
            if ($(event.target).prop('tagName') === 'SPAN' || $(event.target).prop('tagName') === 'I') {
                //dragging elements inside inner div
                return $(event.target).parent().parent().clone().css({
                    width: $(event.target).parent().width()

                });

            } else {
                //dragging inner div
                if ($(event.target).hasClass('input-inner')) {
                    return $(event.target).parent().clone().css({
                        width: $(event.target).width()
                    });

                }
                else {
                    //dragging outer div (input wrapper)
                    return $(event.target).clone().css({
                        width: $(event.target).width()
                    });
                }
            }
        },
        snap: false,
        //cursorAt: {left: '50%', top: '50%'}, get mouse x and y dinamically
        //handle: 'i',
        // cancel: 'i', //this stop the dragging over the icon, not good
        //better stop propagation on mousedown like
        // cursor: 'move', this keep the cursor 'move' after dropping, not good
        revert: 'invalid',
        revertDuration: 100,
        zIndex: 9999,
        appendTo: 'body',//append outside sortable to avoid flickering
        stop: function () {
            formbuilder.collection_is_being_sorted = false;


        },
        start: function (e, ui) {


            if ($(e.target).prop('tagName') === 'SPAN' || $(e.target).prop('tagName') === 'I') {
                $(this).width($(e.target).parent().width());
            } else {
                $(this).width($(e.target).width());
            }
            //keep track we are dragging from sidebar a new input to the input list
            formbuilder.collection_is_being_sorted = false;
        },
        scroll: true
    }).disableSelection();
};

module.exports = draggable;

},{"../config/formbuilder":26}],78:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');
var possible_answers_pager = require('actions/possible-answers-pager');
var getPossibleAnswersList = require('template/methods/getPossibleAnswersList');

var callback = function (params) {

    var selectedHeaderIndex = params.selectedHeaderIndex;
    var input = params.input;
    var importedJson = params.importedJson;
    var list;
    var properties_panel;
    var possible_answers_list;
    var headers = importedJson.meta.fields;
    var userWantstoReplaceAnswers = params.userWantstoReplaceAnswers;
    var doesFirstRowContainsHeaders = params.doesFirstRowContainsHeaders;
    var possible_answers_max = consts.LIMITS.possible_answers_max;

    if(input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {
        possible_answers_max = consts.LIMITS.possible_answers_max_search;
    }

    //if no column is selected abort
    if (selectedHeaderIndex === null) {
        return false;
    }

    //replace or append?
    if (userWantstoReplaceAnswers) {
        //reset answers array
        input.possible_answers = [];
    }

    //headers on first row or not?
    if (!doesFirstRowContainsHeaders) {

        var first_row = {};
        first_row[importedJson.meta.fields[selectedHeaderIndex]] = importedJson.meta.fields[selectedHeaderIndex];
        //csv file does not have any headers, prepend meta.fields (which is the headers)
        importedJson.data.unshift(first_row);
    }

    //append imported possible answers based on selected column (up to max number allowed)
    $(importedJson.data).each(function (index, item) {

        var imported_answer = item[headers[selectedHeaderIndex]];

        //import as many as we can
        if (input.possible_answers.length < possible_answers_max && imported_answer !== undefined) {

            //strip html tags
            imported_answer = imported_answer.replace(/(<([^>]+)>)/ig, ' ');

            //escape double quotes
            imported_answer = imported_answer.replace(/"/gi, '&quot;');

            //filter out empty answers
            if (imported_answer.trim() !== '') {

                //truncate if too long
                if (imported_answer.length > consts.LIMITS.possible_answer_max_length) {
                    imported_answer = imported_answer.substring(0,consts.LIMITS.possible_answer_max_length);
                }

                //add to object
                input.possible_answers.push({
                    answer: imported_answer,
                    answer_ref: utils.generateUniqID()
                });
            }
        }
        else {
            //too many, exit
            console.log('exit at ' + possible_answers_max);
            return false;//just to exit loop
        }
    });

    //get possible answers list markup
    list = getPossibleAnswersList(input.possible_answers);

    properties_panel = formbuilder.dom.input_properties_forms_wrapper
        .find('form[data-input-ref="' + input.ref + '"]');

    possible_answers_list = properties_panel
        .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');

    //empty current list and append new one to dom
    possible_answers_list
        .empty()
        .hide()
        .append(list)
        .fadeIn(consts.ANIMATION_FAST);

    //when there is more than 1 possible answers, enable all remove buttons
    possible_answers_list.find('li div span button').prop('disabled', false);

    //show pagination if needed, starting from page 1
    if(input.possible_answers.length > consts.LIMITS.possible_answers_per_page) {
        formbuilder.possible_answers_pagination[input.ref].page = 1;
        possible_answers_pager.init(input);
    }
    else {
        //reset pagination
        possible_answers_pager.tearDown(input);
    }

    return true;
};

module.exports = callback;

},{"actions/possible-answers-pager":12,"config/consts":24,"config/formbuilder":26,"helpers/utils":37,"template/methods/getPossibleAnswersList":71}],79:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var toast = require('config/toast');
var utils = require('helpers/utils');

var callback = function (files) {

    var undo = require('actions/undo');
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;


    //show overlay and cursor
    formbuilder.dom.overlay.fadeIn(consts.ANIMATION_FAST);

    //delete all inputs from dom
    $(inputs).each(function (index, input) {
        //remove properties dom elements (right sidebar)
        formbuilder.dom.input_properties
            .find('div.panel-body form[data-input-ref="' + input.ref + '"]')
            .fadeOut(consts.ANIMATION_FAST).remove();

        //remove input from dom collection (middle column)
        formbuilder.dom.inputs_collection_sortable
            .find('div.input[data-input-ref="' + input.ref + '"]')
            .fadeOut(consts.ANIMATION_FAST).remove();
    });

    //delete all question from project definition
    formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs = [];

    //after deletion no input is selected, show message and hide context buttons
    formbuilder.dom.input_properties_no_input_selected.fadeIn(consts.ANIMATION_FAST);
    //hide action button for input
    formbuilder.dom.input_properties_buttons.fadeOut(consts.ANIMATION_FAST);

    //remove track of any inputs
    formbuilder.current_input_ref = undefined;

    //re calculate search questions total
    if (utils.getSearchInputsTotal() <= (consts.LIMITS.search_inputs_max - 1)) {
        ui.input_tools.showSearchInput();
    }

    //remove title warning if any
    ui.inputs_collection.toggleTitleWarning(1,false);

    //set form as invalid
    ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

    //disable save project button
    ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);

    //show import form button
    formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').removeClass('hidden');

    //handle the undo...can we go back?
    ui.navbar.toggleUndoBtn(consts.BTN_ENABLED);

    //hide overlay
    window.setTimeout(function () {
        formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
    }, 1000);

};

module.exports = callback;

},{"actions/undo":22,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"helpers/ui":36,"helpers/utils":37}],80:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var validation = require('actions/validation');


var callback = function (e) {

    var undo = require('actions/undo');
    var form_factory = require('factory/form-factory');
    var form_ref = formbuilder.current_form_ref;
    var form_tab = formbuilder.dom.forms_tabs.find('.active');
    var previous_tab_trigger = form_tab.prev().find('a');
    var previous_form_ref = previous_tab_trigger.attr('href');
    var forms = formbuilder.project_definition.data.project.forms;

    //if current form index === 0, do not delete as this is the first form
    if(formbuilder.current_form_index === 0) {
        //cannot delete top parent form
        toastr.error(messages.error.FORM_CANNOT_BE_DELETED);
        return;
    }

    //if the current form is not the last in the hierarchy, do not delete it
    if(formbuilder.current_form_index !== (forms.length - 1)) {
        //cannot delete top parent form
        toastr.error(messages.error.FORM_CANNOT_BE_DELETED);
        return;
    }

    previous_form_ref = previous_form_ref.substring(1, previous_form_ref.length - 9);
    //after the form to be deleted is hidden, delete it and unbind the callback
    previous_tab_trigger.on('shown.bs.tab', function (e) {

        form_factory.removeForm(previous_form_ref, form_ref, form_tab);

        //show toast
        toastr.warning(messages.warning.FORM_DELETED);
        undo.pushState();

        previous_tab_trigger.off();

        //run validation, the removed form night have been the only one with invalid inputs
        if (validation.areAllInputsValid(formbuilder.project_definition)) {
            ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
        }

        //show search input if we deleted some search qestions
        if (utils.getSearchInputsTotal() <= consts.LIMITS.search_inputs_max) {
            ui.input_tools.showSearchInput();
        }
    });

    //unbind current panel handlers before switching
    form_factory.unbindFormPanelsEvents();

    //update formbuilder dom references to point to the selected form markup
    form_factory.updateFormbuilderDomReferences(previous_form_ref);

    //bind events to active form
    form_factory.bindFormPanelsEvents();

    //switch to previous form
    form_tab.prev().find('a').tab('show');
};

module.exports = callback;

},{"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"factory/form-factory":30,"helpers/ui":36,"helpers/utils":37}],81:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var validation = require('actions/validation');
var toast = require('config/toast');

var callback = function (e) {

    var undo = require('actions/undo');
    // var generate_search_type_project = require('helpers/generate-search-type-project');
    //
    // generate_search_type_project.doIt();
    // return false;

    var index = formbuilder.current_form_index;
    var formToExport = {
        data: {
            id: '',
            type: 'form',
            form: {}
        }
    };
    //create a deep copy of the project object properties
    var project_definition_json = CircularJSON.parse(CircularJSON.stringify(formbuilder.project_definition));
    var is_valid_form = true;
    var project_slug = project_definition_json.data.project.slug;
    var form = project_definition_json.data.project.forms[index];
    var filename = project_slug + '__' + form.slug + '__form.json';

    if (form.inputs.length === 0) {
        toast.showError(messages.error.FORM_IS_INVALID);
        return;
    }

    $(form.inputs).each(function (inputIndex, input) {

        //get valid jump destinations
        var jump_destinations = utils.getJumpAvailableDestinationsAsKeys(inputIndex, input, form.inputs, false);

        //extra validation for jumps, check if the destination still exists and it is valid
        $(input.jumps).each(function (jumpIndex, jump) {
            //does the jump "to" property reference a valid destination input?
            if (!jump_destinations[jump.to]) {
                //invalid destination found
                is_valid_form = false;
            }
        });

        $(input.branch).each(function (branchInputIndex, branch_input) {

            if (!branch_input.dom.is_valid) {
                is_valid_form = false;
            }

            delete branch_input.dom;

            //todo validate branch jumps
            jump_destinations = utils.getJumpAvailableDestinationsAsKeys(branchInputIndex, branch_input, input.branch, true);

            //extra validation for jumps, check if the destination still exists and it is valid
            $(branch_input.jumps).each(function (branchJumpIndex, branchJump) {
                //does the jump "to" property reference a valid destination input?
                if (!jump_destinations[branchJump.to]) {
                    //invalid destination found
                    is_valid_form = false;
                }
            });

            $(branch_input.group).each(function (index, group_input) {

                if (!group_input.dom.is_valid) {
                    is_valid_form = false;
                }
                delete group_input.dom;
            });
        });
        $(input.group).each(function (index, group_input) {
            if (!group_input.dom.is_valid) {
                is_valid_form = false;
            }
            delete group_input.dom;
        });

        if (!input.dom.is_valid) {
            is_valid_form = false;
        }
        delete input.dom;
    });

    //wrap form in "data {}" accordin to json api
    formToExport.data.id = form.ref;
    formToExport.data.form = form;

    if (is_valid_form) {
        //do export

        var file;

        try {
            file = new File([JSON.stringify(formToExport)], filename, { type: 'text/plain:charset=utf-8' });
            saveAs(file);
        }
        catch (error) {
            console.log(error);

            //Microsoft browsers?
           if(navigator.msSaveBlob) {
               return navigator.msSaveBlob(new Blob([JSON.stringify(formToExport)], { type: 'text/plain:charset=utf-8'  }), filename);
           }
           else {
               //browser not supported yet
               toast.showError(messages.error.BROWSER_NOT_SUPPORTED);
           }
        }

    }
    else {
        toast.showError(messages.error.FORM_IS_INVALID);
    }
};

module.exports = callback;

},{"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"helpers/ui":36,"helpers/utils":37}],82:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var validation = require('actions/validation');
var form_factory = require('factory/form-factory');

var callback = function (e) {

    var target = $(this);
    var href = target.attr('href');
    var form_ref = target.attr('href').substring(1, href.length - 9);
    var forms = formbuilder.project_definition.data.project.forms;
    var inputs;
    var is_last_child_form;
    var active_input;


    //ignore clicks on active tab
    if (target.parent().hasClass('active')) {
        return;
    }

    //validate active input (if any) before switching
    if (formbuilder.current_input_ref) {
        active_input = utils.getInputObjectByRef(formbuilder.current_input_ref);
    }

    //validate previous input (if any, I might have only one left) when user goes to another input, but do not show toast
    if (active_input) {
        validation.performValidation(active_input, false);
    }

    //unbind current panel handlers before switching
    form_factory.unbindFormPanelsEvents();

    //update formbuilder dom references to point to the selected form markup
    form_factory.updateFormbuilderDomReferences(form_ref);

    //bind events to active form
    form_factory.bindFormPanelsEvents();

    //get active input for the selected form (if any)
    var active_input_ref = formbuilder.dom.inputs_collection_sortable.find('.active').attr('data-input-ref');

    //switch form to selected one
    formbuilder.current_form_index = parseInt(target.attr('data-form-index'), 10);
    formbuilder.current_form_ref = forms[formbuilder.current_form_index].ref;

    //remove any reference to selected input
    //todo check this as we might need to run a validation before switching tab
    formbuilder.current_input_ref = active_input_ref;

    is_last_child_form = formbuilder.current_form_index === forms.length - 1;
    //enable delete button if the active child form is the last child
    if (is_last_child_form) {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__buttons--remove-form')
            .attr('disabled', false);
    }
    else {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__buttons--remove-form')
            .attr('disabled', true);
    }

    inputs = forms[formbuilder.current_form_index].inputs;

    //if the new active form does not have a title set, show warning
    //show no title warning (if no title set for the first form)
    if (utils.getTitleCount(inputs) === 0 && inputs.length > 0) {
        ui.inputs_collection.toggleTitleWarning(0, false);
    }

    //if no inputs, disable download form button
    if (inputs.length === 0) {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').addClass('disabled');

        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').addClass('disabled');
    }
    else {
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').removeClass('disabled');

        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').removeClass('disabled');
    }

    //toggle form icon to a green chck if the top parent form is valid
    if (validation.areFormInputsValid(formbuilder.current_form_index)) {
        ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);

        //enable download form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').removeClass('disabled');

        //enable print as pdf form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').removeClass('disabled');
    }
    else {
        //disable download form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__export-form').addClass('disabled');

        //disable print as pdf form button
        formbuilder.dom.inputs_collection
            .find('.inputs-collection__print-as-pdf').addClass('disabled');
    }
};

module.exports = callback;

},{"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"factory/form-factory":30,"helpers/ui":36,"helpers/utils":37}],83:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var toast = require('config/toast');
var utils = require('helpers/utils');
var validation = require('actions/validation');
var parser = {
    getBranchInputsHTML: require('actions/parse/methods/getBranchInputsHTML'),
    getGroupInputsHTML: require('actions/parse/methods/getGroupInputsHTML'),
    renderInputs: require('actions/parse/methods/renderInputs'),
    renderProject: require('actions/parse/methods/renderProject'),
    renderChildForms: require('actions/parse/methods/renderChildForms'),
    initFormbuilder: require('actions/parse/methods/initFormbuilder')
};

var import_form_validation = require('helpers/import-form-validation');
var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');

var callback = function (files) {

    var undo = require('actions/undo');
    var file = files[0];
    var file_parts;
    var file_ext;

    //show overlay and cursor
    formbuilder.dom.overlay.fadeIn(consts.ANIMATION_FAST);

    //if the user cancels the action
    if (!file) {
        //hide overlay
        formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
        toastr.error(messages.error.FORM_FILE_INVALID);
        return;
    }

    file_parts = file.name.split('.');
    file_ext = file_parts[file_parts.length - 1];

    console.log(file);

    //it must be json
    if (file_ext !== consts.FORM_FILE_EXTENSION) {
        //hide overlay
        formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
        toastr.error(messages.error.FORM_FILE_INVALID);
        return;
    }

    //todo skip MIME type validation on the front end as it is a mess
    //json format according to epicollect5 api
    //if (file.type !== consts.FORM_FILE_ACCEPTED_TYPE) {
    //hide overlay
    //     formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
    //     toastr.error(messages.error.FORM_FILE_INVALID);
    //     return;
    // }

    var reader = new FileReader();

    reader.onload = function (e) {

        var json_text = e.target.result;
        var form;
        var current_form_ref;
        var imported_form_ref;
        var regex;
        var inputs;
        try {
            form = JSON.parse(json_text);
        }
        catch (error) {
            //hide overlay
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            //it means the json is in invalid format
            toastr.error(messages.error.FORM_FILE_INVALID);
            return;
        }


        //validate form structure
        if (!import_form_validation.hasValidFormStructure(form)) {
            //hide overlay
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            //it means the structure is invalid
            toastr.error(messages.error.FORM_FILE_INVALID);
            return;
        }

        //grab inputs
        inputs = form.data.form.inputs;

        //are there any inputs?
        if (inputs.length === 0) {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            toastr.error(messages.error.FORM_FILE_INVALID);
            return;
        }

        //is inputs array?
        if (!$.isArray(inputs)) {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
            toastr.error(messages.error.FORM_FILE_INVALID);
            return;
        }
        else {
            var are_valid_inputs = true;
            $(inputs).each(function (index, input) {
                if (!import_form_validation.isValidInput(form.data.form.ref, input, false, false)) {
                    console.log(input);
                    console.log(JSON.stringify(input));
                    are_valid_inputs = false;
                    return false;
                }
            });

            if (!are_valid_inputs) {
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }

            //check total number of questions/branches
            if (utils.getInputsTotal(inputs) > consts.INPUTS_MAX_ALLOWED) {
                //hide overlay
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }

            //check total number of titles (main form)
            if (utils.isMaxTitleLimitExceeded(inputs)) {
                //hide overlay
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }
            //check total number of titles (branches)
            var are_branch_inputs_valid = true;
            $(inputs).each(function (index, input) {
                if (utils.isMaxTitleLimitExceeded(input.branch)) {
                    are_branch_inputs_valid = false;
                    return false;
                }
            });

            if (!are_branch_inputs_valid) {
                //hide overlay
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }

            //check jumps destinations
            if (!import_form_validation.areJumpsDestinationsValid(inputs)) {
                //hide overlay
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toastr.error(messages.error.FORM_FILE_INVALID);
                return;
            }
        }

        //we need to use the current form ref
        current_form_ref = formbuilder.current_form_ref;
        imported_form_ref = form.data.form.ref;
        regex = new RegExp(imported_form_ref, 'g');

        //replace imported form ref with current form ref(all occurrrences)
        json_text = json_text.replace(regex, current_form_ref);
        form = JSON.parse(json_text);

        // temporarly setup inputs with the current_form_ref in formbuilder global object (so it can pass jump destinations validation when parsing, and also to render jumps properly in the dom)
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index]
            .inputs = form.data.form.inputs.slice();

        //parse the form and add the markup then.
        var renderedInputs = parser.renderInputs(form.data.form.inputs);

        //remove no questions message (if any inputs)
        if (renderedInputs.length > 0) {
            formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').addClass('hidden');
        }

        //show no title warning (if no title set for the first form)
        if (utils.getTitleCount(renderedInputs) === 0) {
            ui.inputs_collection.toggleTitleWarning(0, false);
        }

        //toggle form icon to a green check if the top parent form is valid
        if (validation.areFormInputsValid(formbuilder.current_form_index)) {
            ui.forms_tabs.showFormValidIcon(formbuilder.current_form_index);
            //enable download form button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__export-form').removeClass('disabled');

            //enable print as pdf form button
            formbuilder.dom.inputs_collection
                .find('.inputs-collection__print-as-pdf').removeClass('disabled');
        }

        //replace object literal inputs with newly generated ones via factory (i.e. using new) so they get the prototype
        formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs = renderedInputs.slice();//by value


        //enable save project button if all inputs are valid
        if (validation.areAllInputsValid(formbuilder.project_definition)) {

            //enable save project button (if disabled)
            ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);

            //reset some flags
            formbuilder.current_input_ref = null; //no input is selected

            formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);
        }

        //if there are too many search inputs, hide the search input tool in the sidebar
        if (utils.getSearchInputsTotal() >= consts.LIMITS.search_inputs_max) {
            ui.input_tools.hideSearchInput();

            //also show warning
            //show warning to user
            toast.showWarning(messages.warning.SEARCH_INPUTS_LIMIT_REACHED + '(' + consts.LIMITS.search_inputs_max + ')');
        }

        window.setTimeout(function () {
            //hide overlay
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_SLOW);
            //show success toast
            toastr.success(messages.success.FORM_IMPORTED);
            //push state for undo
            undo.pushState();
        }, consts.ANIMATION_SLOW);
    };

    reader.readAsText(file);
};

module.exports = callback;

},{"actions/parse/methods/getBranchInputsHTML":6,"actions/parse/methods/getGroupInputsHTML":7,"actions/parse/methods/initFormbuilder":8,"actions/parse/methods/renderChildForms":9,"actions/parse/methods/renderInputs":10,"actions/parse/methods/renderProject":11,"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"helpers/import-form-validation":35,"helpers/ui":36,"helpers/utils":37,"ui-handlers/event-handler-callbacks/save-project-click-callback":97}],84:[function(require,module,exports){
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

},{"actions/possible-answers-pager":12,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/ui":36,"helpers/utils":37,"ui-handlers/possible-answers-sortable":99}],85:[function(require,module,exports){
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

},{"actions/possible-answers-pager":12,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/ui":36,"helpers/utils":37,"ui-handlers/possible-answers-sortable":99}],86:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var validation = require('actions/validation');
var possibleAnswersSortable = require('ui-handlers/possible-answers-sortable');
var possible_answers_pager = require('actions/possible-answers-pager');

var callback = function (e) {

    var self = $(this);
    var ref = self.attr('data-input-ref');
    var owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
    var group_input = utils.getNestedGroupInputObjectByRef(owner_branch, ref);
    var previous_group_input = utils.getNestedGroupInputObjectByRef(owner_branch, formbuilder.group.current_input_ref);
    var branch_inputs = utils.getInputObjectByRef(formbuilder.current_input_ref).branch;
    var question;

    // group_input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + ref + '"]');

    //deactivate all inputs in active nested group sortable collection
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
    if (utils.isMaxTitleLimitReached(branch_inputs)) {
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

},{"actions/possible-answers-pager":12,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/ui":36,"helpers/utils":37,"ui-handlers/possible-answers-sortable":99}],87:[function(require,module,exports){
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

},{"actions/jumps":4,"actions/possible-answers-pager":12,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/ui":36,"helpers/utils":37,"ui-handlers/event-handler-callbacks/input-properties-keyup-callback":92,"ui-handlers/possible-answers-sortable":99}],88:[function(require,module,exports){
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var utils = require('helpers/utils');

var callback = function (e) {

    var input = utils.getInputObjectByRef(formbuilder.current_input_ref);

    console.log(e.target);
    console.log($(this));

    input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');

    //get selected initial answer
    var initial_answer = input.dom.properties_panel
        .find('.input-properties__form__advanced-properties')
        .find('.input-properties__form__advanced-properties__default')
        .find('select').find(':selected');

    console.log(initial_answer);

    if (initial_answer.val() === input.default && input.default !== '') {
        initial_answer.text(utils.getPossibleAnswerLabel(input));
    }

    console.log(input);
    console.log('refresh initial answer');


};

module.exports = callback;

},{"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/utils":37}],89:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');

var callback = function () {

    var input = utils.getInputObjectByRef(formbuilder.current_input_ref);
    var owner_branch;

    //is editing a branch?
    if (formbuilder.is_editing_branch) {
        //override input to be the branch input
        input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);

        //handle nested group inside a branch
        if (formbuilder.is_editing_group) {
            owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = utils.getNestedGroupInputObjectByRef(owner_branch, formbuilder.group.current_input_ref);
        }
    }
    else {
        //is editing a group?
        if (formbuilder.is_editing_group) {
            //override input to be the branch input
            input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        }
    }

    if ($(this).attr('data-jump-logic')) {
        console.log('it is a jump');
    }

    if ($(this).attr('data-initial-answer')) {
        console.log('multi select');
        input.updatePossibleInitialAnswers();
    }
};

module.exports = callback;

},{"config/formbuilder":26,"helpers/ui":36,"helpers/utils":37}],90:[function(require,module,exports){
/* global $, toastr, File, saveAs*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var validation = require('actions/validation');
var input_duplicator = require('actions/input-duplicator');
var toast = require('config/toast');

/*
 handle click action on input properties panel in the right sidebar (use event delegation)
 we check the class of the target element to trigger the proper action
 */
var callback = function (e) {

    console.log('properties panel clicked.');

    var undo = require('actions/undo');
    var possible_answers = require('actions/possible-answers');
    var input_factory = require('factory/input-factory');
    //get hold of the current active input in the input collection (middle column)
    var input = utils.getInputObjectByRef(formbuilder.current_input_ref);
    var first_input_ref;
    var nested_group;
    var owner_branch;
    //get hold of tapped element dom element
    var target = $(this);
    var csv;
    var form_index = formbuilder.current_form_index;
    var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;

    formbuilder.render_action = consts.RENDER_ACTION_DO;

    function _getInput() {

        //check whether we are validatin a nested input i.e. BOTH branch AND group edit flags are true
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
            //get nested group input
            owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = utils.getNestedGroupInputObjectByRef(owner_branch, formbuilder.group.current_input_ref);
        }
        else {
            if (formbuilder.is_editing_branch) {
                //get selected branch input
                input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
            }

            if (formbuilder.is_editing_group) {
                //get selected group input
                input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
            }
        }

        return input;
    }

    function _validateBranch() {

        //check the branch has got at least 1 input left

        var active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);

        if (active_branch.branch.length > 0) {
            validation.performValidation(active_branch.branch[0], false);
        }
        else {
            //invalid the form as it does not have any inputs
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

            //disable save project button
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
            formbuilder.dom.save_project_btn.off('click');
        }
    }

    function _validateForm() {

        var form_index = formbuilder.current_form_index;

        if (formbuilder.project_definition.data.project.forms[form_index].inputs.length > 0) {
            first_input_ref = formbuilder.project_definition.data.project.forms[form_index].inputs[0].ref;
            if (first_input_ref) {
                validation.performValidation(utils.getInputObjectByRef(first_input_ref), false);
            }
        }
        else {
            //invalid the form as it does not have any inputs
            ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

            //disable save project button
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
            formbuilder.dom.save_project_btn.off('click');

            //add no question message
            formbuilder.dom.inputs_collection.find('.input-properties__no-questions-message').removeClass('hidden');
        }
    }

    //get hold of advanced properties panel for this input
    input.dom.advanced_properties_wrapper = formbuilder
        .dom
        .input_properties_forms_wrapper
        .find('form[data-input-ref="' + input.ref + '"]')
        .find('.input-properties__form__advanced-properties');

    /***************************************************************
     * Remove selected input
     **************************************************************/
    if (target.hasClass('input-properties__buttons--remove-input')) {

        //re-nable draggable if needed
        if ($('ul#inputs-tools-list li div.input').hasClass('dragging-disabled')) {
            ui.input_tools.enable();
        }

        //enable save project button
        ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);

        //check whether we are validatin a nested input i.e. BOTH branch AND group edit flags are true
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {

            //remove nested group
            input_factory.removeNestedGroupInput(formbuilder.branch.active_branch_ref, formbuilder.group.current_input_ref);
            toastr.warning(messages.warning.INPUT_DELETED);
            _validateForm();
            //push state to enable undoing the action (deleting input)
            undo.pushState();
            return;
        }
        else {

            //nested group?
            if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {
                //to handle nested group
            }
            else {

                if (formbuilder.is_editing_branch) {
                    input_factory.removeBranchInput(input.ref, formbuilder.branch.current_input_ref);
                    toastr.warning(messages.warning.INPUT_DELETED);

                    //run validation as I might have deleted the only invalid input for the branch
                    //since there is not a previous one, so it uses the first input of the top parent form (if any) just to trigger the validation
                    _validateBranch();

                    //push state to enable undoing the action (deleting input)
                    undo.pushState();
                    return;
                }

                if (formbuilder.is_editing_group) {
                    input_factory.removeGroupInput(input.ref, formbuilder.group.current_input_ref);
                    toastr.warning(messages.warning.INPUT_DELETED);
                    //push state to enable undoing the action (deleting input)
                    undo.pushState();
                    return;
                }
            }

            //remove input from input collection (also remove its properties)
            input_factory.removeInput(input.ref);
            toastr.warning(messages.warning.INPUT_DELETED);

            //todo I need to do the same for branches, groups and nested groups
            //run validation as I might have deleted the only invalid input
            //there is not a previous one, so it uses the first input of the top parent form (if any)
            _validateForm();
            //push state to enable undoing the action (deleting input)
            undo.pushState();

            //show message and import button when no inputs left

            //remove no questions message and upload button, as now we have at least 1 input
            //todo avoid to to this all the time?
            if (inputs.length === 0) {
                formbuilder.dom.inputs_collection
                    .find('.input-properties__no-questions-message')
                    .hide()
                    .removeClass('hidden')
                    .fadeIn();

                //hide title warning message, passing a count > 1
                ui.inputs_collection.toggleTitleWarning(1, false);

                //disable download form button
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__export-form').addClass('disabled');

                //disable print as pdf form button
                formbuilder.dom.inputs_collection
                    .find('.inputs-collection__print-as-pdf').addClass('disabled');
            }
            return;
        }
    }

    /***************************************************************
     * Copy selected input
     **************************************************************/
    if (target.hasClass('input-properties__buttons--copy-input')) {
        console.log('copying input ***************************************************');

        var input_copied;
        var search_inputs_total = utils.getSearchInputsTotal();

        input = _getInput();

        //if the input is not valid, reject copy action
        if (!input.dom.is_valid) {
            toast.showError(messages.error.INPUT_NOT_VALID);
            return;
        }

        //if we reached the max number of questions for this form, bail out
        if (utils.getInputsTotal(inputs) >= consts.INPUTS_MAX_ALLOWED) {
            toast.showError(messages.error.MAX_QUESTIONS_LIMIT_REACHED + ' ('+ consts.INPUTS_MAX_ALLOWED+')');
            ui.input_tools.disable();
            return;
        }

        //if the input is of type search and we reached the limit already, bail out
        if(input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {

            //warn the user if limit was reached
            if (search_inputs_total === consts.LIMITS.search_inputs_max) {
                toast.showError(messages.warning.SEARCH_INPUTS_LIMIT_REACHED + '(' + consts.LIMITS.search_inputs_max + ')');
                return;
            }
            //if we are reaching the search input limits with this copy, hide search question tool
            if (search_inputs_total === consts.LIMITS.search_inputs_max - 1) {
                //hide search input from question list
                ui.input_tools.hideSearchInput();
            }
        }

        //show overlay
        formbuilder.dom.overlay.fadeIn();

        //get copy if original input
        input_copied = input_duplicator.createInputCopy(input);

        //add copied input to project definition
        input_duplicator.pushInput(input_copied);

        //append the copied input markup
        input_duplicator.appendInputToDom(input_copied);

        //hide overlay (with delay)
        window.setTimeout(function () {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST, function () {
                toast.showSuccess(messages.success.INPUT_COPIED);
            });
        }, consts.ANIMATION_SLOW);
    }

    /***************************************************************
     * Validate selected input
     **************************************************************/
    if (target.hasClass('input-properties__buttons--validate-input')) {
        validation.performValidation(_getInput(), true);
    }

    /***************************************************************
     * Add possible answer
     **************************************************************/
    if (target.hasClass('input-properties__form__possible-answers__add-answer')) {

        var possible_answers_max = consts.LIMITS.possible_answers_max;

        input = _getInput();

        if (input.type === consts.SEARCH_SINGLE_TYPE || input.type === consts.SEARCH_MULTIPLE_TYPE) {
            possible_answers_max = consts.LIMITS.possible_answers_max_search;
        }

        //add possible answer (if total is less than max allowed)
        if (input.possible_answers.length < possible_answers_max) {
            input.addPossibleAnswer();
            undo.pushState();
        }
    }

    /***************************************************************
     * Remove possible answer
     **************************************************************/
    if (target.hasClass('input-properties__form__possible-answers__list__remove-answer')) {

        input = _getInput();

        //we need to leave at least 1 possible answer
        if (input.possible_answers.length >= 2) {
            input.removePossibleAnswer(target.closest('li').index());
            undo.pushState();
        }
    }

    /***************************************************************
     * Add jump to selected input
     **************************************************************/
    if (target.hasClass('input-properties__form__jumps__add-jump')) {

        input = _getInput();

        //disable save project button as the new added jump makes the input invalid
        ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);

        //set input as invalid
        input.dom.is_valid = false;

        //flag input dom in input collection as invalid
        ui.inputs_collection.showInputInvalidIcon(input.ref);

        //flag current form as invalid
        ui.forms_tabs.showFormInvalidIcon(formbuilder.current_form_index);

        input.addJump();
        undo.pushState();
    }

    /***************************************************************
     * Remove selected jump
     **************************************************************/
    if (target.hasClass('input-properties__form__jumps__remove-jump')) {

        input = _getInput();

        input.removeJump(target);

        //revalidate input after deleting a jump as the jump might have been the only thing keeping it invalid
        validation.performValidation(input, false);
        undo.pushState();
    }

    /***************************************************************
     * Edit branch
     **************************************************************/
    if (target.hasClass('input-properties__form__edit-branch')) {
        target.attr('disabled', true);
        input.enterBranchSortable();
    }
    if (target.hasClass('input-properties__form__exit-branch-editing')) {
        target.attr('disabled', true);
        target.prev('.input-properties__form__edit-branch').attr('disabled', false);
        input.exitBranchSortable();
    }

    /***************************************************************
     * Edit group
     **************************************************************/
    if (target.hasClass('input-properties__form__edit-group')) {
        target.attr('disabled', true);

        //check whether we are editing a group nested into a branch
        if (formbuilder.is_editing_branch) {

            nested_group = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);

            if (nested_group) {
                //user clicked on edit nested group button
                input = nested_group;
                input.enterGroupSortable(true);
            }
        }
        else {
            input.enterGroupSortable(false);
        }
    }

    if (target.hasClass('input-properties__form__exit-group-editing')) {
        target.attr('disabled', true);
        target.prev('.input-properties__form__edit-branch').attr('disabled', false);

        //check whether we are editing a group nested into a branch
        if (formbuilder.is_editing_branch) {
            nested_group = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);

            if (nested_group) {
                //user clicked on edit nested group button
                input = nested_group;
                input.exitGroupSortable(true);
            }
        }
        else {
            input.exitGroupSortable(false);
        }
    }

    if (target.hasClass('possible_answers__export-csv')) {

        //show overlay and cursor
        formbuilder.dom.overlay.fadeIn(0);

        csv = possible_answers.exportPossibleAnswersCSV();

        window.setTimeout(function () {
            formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);

            if (csv) {
                //do export
                var file;

                try {
                    file = new File([csv.data], csv.filename, { type: 'text/plain:charset=utf-8' });
                    saveAs(file);
                }
                catch (error) {
                    //Microsoft browsers?
                    if (navigator.msSaveBlob) {
                        return navigator.msSaveBlob(new Blob([csv.data], { type: 'text/plain:charset=utf-8' }), csv.filename);
                    }
                    else {
                        //browser not supported yet
                        toast.showError(messages.error.BROWSER_NOT_SUPPORTED);
                    }
                }
            }
            else {
                //show error
                toast.showError(messages.error.POSSIBLE_ANSWERS_INVALID);
            }
        }, consts.ANIMATION_SUPER_SLOW);
    }

    if (target.hasClass('possible_answers__import-csv')) {

        //import file first then show modal to pick which column (if more than one)
        //todo not use window, use formbuilder object
        if (!formbuilder.isOpeningFileBrowser) {

            var file_input = target.find('.possible_answers__import-csv-input-file');

            formbuilder.isOpeningFileBrowser = true;

            file_input.off('change').on('change', function () {
                possible_answers.importCSVFile(this.files);
                $(this).val(null);
            });

            target.find('.possible_answers__import-csv-input-file').trigger('click');
        }

        //to avoid a infinte loop (since we are triggering the click event)
        //we remove the flag later, to be able to upload another file
        //even if the user tapped on "cancel"
        window.setTimeout(function () {
            formbuilder.isOpeningFileBrowser = false;
        }, 3000);

    }

    if (target.hasClass('possible_answers__delete-all')) {
        possible_answers.deleteAllAnswers();
    }

    if (target.hasClass('possible_answers__order-az')) {
        possible_answers.orderPossibleAnswers(consts.POSSIBLE_ANSWERS_ORDER.AZ);
    }

    if (target.hasClass('possible_answers__order-za')) {
        possible_answers.orderPossibleAnswers(consts.POSSIBLE_ANSWERS_ORDER.ZA);
    }

    if (target.hasClass('possible_answers__order-shuffle')) {
        possible_answers.orderPossibleAnswers(consts.POSSIBLE_ANSWERS_ORDER.SHUFFLE);
    }

};

module.exports = callback;

},{"actions/input-duplicator":3,"actions/possible-answers":13,"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"factory/input-factory":31,"helpers/ui":36,"helpers/utils":37}],91:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var jumps = require('actions/jumps');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');

var callback = function (e) {

    var input = utils.getInputObjectByRef(formbuilder.current_input_ref);
    var inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
    var jump_destinations;
    var owner_branch;

    //is editing a branch?
    if (formbuilder.is_editing_branch) {
        //override inputs, get branch inputs from owner input
        inputs = input.branch;
        //override input to be the branch input
        input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);

        //handle nested group inside a branch
        if (formbuilder.is_editing_group) {
            inputs = input.group;
            owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);
            input = utils.getNestedGroupInputObjectByRef(owner_branch, formbuilder.group.current_input_ref);
        }
    }
    else {
        //is editing a group?
        if (formbuilder.is_editing_group) {
            //override inputs, get group inputs from owner input
            inputs = input.group;
            //override input to be the branch input
            input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        }
    }

    //get all jumps available
    jump_destinations = utils.getJumpAvailableDestinations(input, inputs);

    //check if the <select> is either a jump logic or a multiple choice input
    if ($(this).attr('data-jump-logic')) {

        var focused_select = $(this);
        var focused_select_id = focused_select.attr('id');

        //split on the dash to remove the first part of "focused_select_id" as it can
        //be 1-, 2-, 11-, 45-.... so:
        var focused_select_id_parts = focused_select_id.split('-');
        focused_select_id_parts.shift();
        focused_select_id = focused_select_id_parts.join('-');
        //todo the above is faster with a regex, when there is time...

        switch (focused_select_id) {

            //for open answer input type like  'text', this will be set to 'always'
            case input.ref + '-logic-when':
                //list al the available conditions
                jumps.listJumpConditions(focused_select);
                break;
            /*
             get all possible answers for current input and list them as options
             (for open answer input type like  'text', this will be hidden)
             */
            case input.ref + '-logic-answer':
                jumps.listJumpPossibleAnswers(focused_select, input);
                break;

            //get all possible jump destinations for current input and list them as options
            case input.ref + '-logic-goto':
                jumps.listJumpDestinations(focused_select, jump_destinations);
                break;
        }
    }
    else {
        input.listPossibleInitialAnswers();
    }
};

module.exports = callback;

},{"actions/jumps":4,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/ui":36,"helpers/utils":37}],92:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var jumps = require('actions/jumps');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var validation = require('actions/validation');

var callback = function (e) {

    //ignore left and right arrow keyboard keys (otherwise the user cannot edit a string)
    //from the docs:
    // The event.which property normalizes event.keyCode and event.charCode.
    // It is recommended to watch event.which for keyboard key input.
    if (e.which === 37 || e.which === 39) {
        return;
    }

    var input;
    var input_question_validation;
    var possible_answer_validation;
    var target = $(this);
    var undo = require('actions/undo');//it is here otherwise it breaks when compiling...go figure??
    // Capture initial cursor position, as we are replacing the input value on keyup, to avoid the cursor go to the end of the string
    var position = target[0].selectionStart;

    function _inputIsValid() {

        input.dom.is_valid = true;

        //validate input to refresh dom
        validation.performValidation(input, false);

        target[0].selectionEnd = position;    // Set the cursor back to the initial position.
    }

    function _getInput() {

        var input = utils.getInputObjectByRef(formbuilder.current_input_ref);
        var current_branch;

        //check whether we are validatin a nested input i.e. BOTH branch AND group edit flags are true
        if (formbuilder.is_editing_branch && formbuilder.is_editing_group) {

            //get owner branch
            current_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);

            //get nested group input
            input = utils.getNestedGroupInputObjectByRef(current_branch, formbuilder.group.current_input_ref);
        }
        else {
            if (formbuilder.is_editing_branch) {
                //get selected branch input
                input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
            }

            if (formbuilder.is_editing_group) {
                //get selected group input
                input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
            }
        }

        return input;
    }

    input = _getInput();
    //get handle of input properties panel
    input.dom.properties_panel = formbuilder.dom.input_properties_forms_wrapper.find('form[data-input-ref="' + input.ref + '"]');

    //hide errors
    input.hideQuestionErrors();

    if (target.parent().hasClass('input-properties__form__question')) {
        //get question
        input.question = $(this).val();

        //validate question or header
        if (input.type === consts.BRANCH_TYPE || input.type === consts.GROUP_TYPE) {
            input_question_validation = input.isHeaderTextValid();
        }
        else {
            input_question_validation = input.isQuestionTextValid();
        }

        if (!input_question_validation.is_valid) {
            // warn user question text is wrong
            input.dom.is_valid = false;

            //highlight wrong input and show error message
            input.showQuestionErrors(input_question_validation.error.message);

            //disable edit btn for groups or branches
            if (input.type === consts.BRANCH_TYPE || input.type === consts.GROUP_TYPE) {
                input.toggleEditButton(false);
            }

            //validate all inputs (to toggle save project button on keyup)
            validation.performValidation(input, false);
            target[0].selectionEnd = position;    // Set the cursor back to the initial position.
        }
        else {

            //branch and group inputs are invalid if they do not have any inputs
            if (input.type === consts.BRANCH_TYPE || input.type === consts.GROUP_TYPE) {

                //enable edit btn for groups or branches
                input.toggleEditButton(true);

                if (input.type === consts.BRANCH_TYPE && input.branch.length === 0) {
                    input.dom.is_valid = false;
                }
                if (input.type === consts.GROUP_TYPE && input.group.length === 0) {
                    input.dom.is_valid = false;
                }
                if (input.dom.is_valid) {
                    _inputIsValid();
                }
            }
            else {
                _inputIsValid();
            }
        }
    }

    if (target.parent().hasClass('input-properties__form__possible-answers__list__possible_answer_item')) {

        possible_answer_validation = validation.isPossibleAnswerValid(target.val());

        //validate each possible answer and show embedded errors if any
        if (!possible_answer_validation.is_valid) {
            // warn user question text is wrong
            input.dom.is_valid = false;

            //highlight wrong answer and show error message
            input.showPossibleAnswerErrors(target.parent().parent(), possible_answer_validation.error.message);

            validation.performValidation(input, false);
            target[0].selectionEnd = position;    // Set the cursor back to the initial position.

        } else {
            _inputIsValid();
        }
    }

    //push state to enable undoing the action (typing) passing "true" so it gets a bit of throttling
    undo.pushState(true);
};

module.exports = callback;

},{"actions/jumps":4,"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"helpers/ui":36,"helpers/utils":37}],93:[function(require,module,exports){
/* global $, Ftoastr*/
'use strict';
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var save = require('actions/save');

var callback = function () {

    var count;
    var inputs = [];
    var active_input;
    var active_branch;

    if (formbuilder.is_editing_branch) {

        active_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);

        //group in a branch?
        if (formbuilder.is_editing_group) {
            //set active input to be the active group input
            active_input = utils.getNestedGroupInputObjectByRef(active_branch, formbuilder.group.current_input_ref);
        }
        else {
            active_input = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref);
        }

        //save current input
        save.saveProperties(active_input);

        inputs = active_branch.branch;
        count = utils.getTitleCount(inputs);
        ui.inputs_collection.toggleTitleWarning(count, true);

    }
    else {
        //is it a group?
        if (formbuilder.is_editing_group) {
            //set active input to be the active group input
            active_input = utils.getGroupInputObjectByRef(formbuilder.group.current_input_ref);
        }
        else {
            //form level input
            active_input = utils.getInputObjectByRef(formbuilder.current_input_ref);
        }
        //save current input
        save.saveProperties(active_input);

        inputs = formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs;
        count = utils.getTitleCount(inputs);
        //if there is not any title set form the form, show warning
        ui.inputs_collection.toggleTitleWarning(count, false);
    }
};

module.exports = callback;

},{"actions/save":14,"config/formbuilder":26,"helpers/ui":36,"helpers/utils":37}],94:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var messages = require('config/messages');
var validation = require('actions/validation');
var errors = require('actions/errors');
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var form_factory = require('factory/form-factory');
var save_project_click_callback = require('ui-handlers/event-handler-callbacks/save-project-click-callback');
var undo = require('actions/undo');

var callback = function (evt) {

    var target = $(evt.relatedTarget);// Button that triggered the modal
    var modal = $(this);
    var form_name_input;
    var form_ref;
    var is_adding_new_form = false;
    var form = {};
    var next_form_index;

    //get partial
    modal.html(formbuilder.dom.partials.modal_edit_form_name);
    form_name_input = modal.find('.modal-body input');

    //validate on keyup for better UX todo
    form_name_input.on('keyup', function () {
        console.log('activated');
    });

    if (target.hasClass('main__tabs_add-form')) {
        console.log('************ - add new form - **************');
        //todo
        is_adding_new_form = true;
        form_ref = utils.generateFormRef();
        next_form_index = formbuilder.project_definition.data.project.forms.length;
    }
    else {
        //set current form name in modal
        form_name_input.val(formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].name);
        form_ref = formbuilder.current_form_ref;
    }

    //bind save changes button
    $('.main__modal--edit-form-name__save-btn').off().on('click', function () {

        //get updated value
        var name = form_name_input.val();
        var is_form_name_valid;
        var form_index = formbuilder.current_form_index;
        var forms = formbuilder.project_definition.data.project.forms;

        //hide errors
        errors.hideFormNameErrors(modal);

        //validate form name
        is_form_name_valid = validation.isFormNameValid(name, is_adding_new_form);

        if (!is_form_name_valid.is_valid) {
            //show errors
            errors.showFormNameErrors(modal, is_form_name_valid.error.message);
        }
        else {

            //disable button to avoid double clicks
            $(this).off().attr('disabled', true);

            if (is_adding_new_form) {

                //add child form
                form_factory.createChildForm(name, form_ref, next_form_index, true);

                //disable save project button as we do not accept empty forms
                ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);

                undo.pushState();
            }
            else {
                //update name for current form
                formbuilder.project_definition.data.project.forms[form_index].name = name;
                formbuilder.project_definition.data.project.forms[form_index].slug = utils.slugify(name);

                //show name of form in tab and inputs collection container, truncating form name (>10) for UI purposes
                formbuilder.dom.inputs_collection.find('.inputs-collection__header__element-name')
                    .text(name.trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2)));

                //tab, target the active one
                formbuilder.dom.forms_tabs.find('.active a')
                    .text(name.trunc(consts.TAB_FORM_NAME_MAX_DISPLAY_LENGHT - (forms.length * 2)))
                    .append('&nbsp;<i class="form-state fa fa-check"></i>');

                //enable save project button
                ui.navbar.toggleSaveProjectBtn(consts.BTN_ENABLED);
                formbuilder.dom.save_project_btn.off().on('click', save_project_click_callback);
            }

            //hide add child form button if the form total is MAX_NUMBER_OF_NESTED_CHILD_FORMS
            if (formbuilder.project_definition.data.project.forms.length === consts.MAX_NUMBER_OF_NESTED_CHILD_FORMS) {
                formbuilder.dom.forms_tabs.find('.main__tabs_add-form').parent().hide();
            }

            //resize form tabs
            ui.forms_tabs.resizeFormTabs();

            //close modal (with a little delay for better UX, no FOUC)
            window.setTimeout(function () {
                modal.modal('hide');
                //force a backdrop removal as sometimes it is triggered twice
                $('.modal-backdrop').remove();
            }, 100);
        }
    });
};

module.exports = callback;



},{"actions/errors":2,"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"factory/form-factory":30,"helpers/ui":36,"helpers/utils":37,"ui-handlers/event-handler-callbacks/save-project-click-callback":97}],95:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var formbuilder = require('config/formbuilder');
var consts = require('config/consts');

//todo maybe this callback is not needed anymore
var callback = function () {

    //get hold of modal;
    var modal = $(this);

    //bind buttons
    modal.find('.table').off().on('click', '.btn', function () {

        var button = $(this);
        var current_input_regex_property;

        if (formbuilder.is_editing_group) {
            current_input_regex_property = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + formbuilder.group.current_input_ref + '"]')
                .find('.input-properties__form__advanced-properties__regex input');
        }
        else {

            if (formbuilder.is_editing_branch) {
                current_input_regex_property = formbuilder.dom.input_properties_forms_wrapper
                    .find('form[data-input-ref="' + formbuilder.branch.current_input_ref + '"]')
                    .find('.input-properties__form__advanced-properties__regex input');
            }
            else {

                current_input_regex_property = formbuilder.dom.input_properties_forms_wrapper
                    .find('form[data-input-ref="' + formbuilder.current_input_ref + '"]')
                    .find('.input-properties__form__advanced-properties__regex input');
            }
        }

        //apply the selected regex
        current_input_regex_property.val(consts.REGEX[button.attr('data-apply-regex')]);

        modal.modal('hide');
    });
};

module.exports = callback;

},{"config/consts":24,"config/formbuilder":26}],96:[function(require,module,exports){
/* global $, toastr*/
'use strict';
var consts = require('config/consts');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var validation = require('actions/validation');
var toast = require('config/toast');

var callback = function (e) {

    function _renderQuestion(input) {

        //strip html tags from readme type if any
        if (input.type === consts.README_TYPE) {
            input.question = utils.decodeHtml(input.question);
            input.question = input.question.replace(/(<([^>]+)>)/ig, ' ');
            html += '<hr/>';
        }

        html += '<h4 class="question">' + input.question + '</h4>';

        if (input.type === consts.TEXTAREA_TYPE) {
            html += '<table border="1" width="100%">';
            html += '<tr><td></td></td></tr>';
            html += '<tr><td></td></td></tr>';
            html += '<tr><td></td></td></tr>';
            html += '<tr><td></td></td></tr>';
            html += '</table>';
        }
        else {
            if (input.type !== consts.README_TYPE) {
                html += '<table border="1" width="100%">';
                html += '<tr><td></td></td></tr>';
                html += '</table>';
            }
            else{
                html += '<hr/>';
            }
        }
    }

    function _renderPossibleAnswers(input) {
        $.each(input.possible_answers, function (index, possible_answer) {

            switch (input.type) {
                case consts.SEARCH_SINGLE_TYPE:
                case consts.SEARCH_MULTIPLE_TYPE:

                    if (index === 0) {
                        html += '<ul class="possible-answers-list">';
                    }

                    html += '<li><h5>' + possible_answer.answer + '</h5></li>';

                    if (index === input.possible_answers.length - 1) {
                        html += '</ul>';
                    }
                    break;
                //render dropdown and radio as radio buttons (single choice)
                case consts.DROPDOWN_TYPE:
                case consts.RADIO_TYPE:
                    html += '<div class="radio-type"><h5>';
                    html += '<input type="radio"  value="' + possible_answer.answer + '">';
                    html += '<label for="' + possible_answer.answer + '">' + possible_answer.answer + '</label>';
                    html += '</h5></div>';
                    break;
                case consts.CHECKBOX_TYPE:
                    html += '<div class="checkbox-type"><h5>';
                    html += '<input type="checkbox"  value="' + possible_answer.answer + '">';
                    html += '<label for="' + possible_answer.answer + '">' + possible_answer.answer + '</label>';
                    html += '</h5></div>';
                    break;
                default:
                //do nothing
            }
        });
    }


    var html = '';

    //add form title
    html += '';
    var index = formbuilder.current_form_index;

    //create a deep copy of the project object properties
    var project_definition_json = CircularJSON.parse(CircularJSON.stringify(formbuilder.project_definition));
    var is_valid_form = true;
    var project_slug = project_definition_json.data.project.slug;
    var form = project_definition_json.data.project.forms[index];

    if (form.inputs.length === 0) {
        toast.showError(messages.error.FORM_IS_INVALID);
        return;
    }

    //print project name as header
    html += '<h2>' + project_definition_json.data.project.name + '</h2>';

    //print form name as header
    html += '<h3>' + form.name + '</h3>';

    $(form.inputs).each(function (inputIndex, input) {

        //get valid jump destinations
        var jump_destinations = utils.getJumpAvailableDestinationsAsKeys(inputIndex, input, form.inputs, false);

        //extra validation for jumps, check if the destination still exists and it is valid
        $(input.jumps).each(function (jumpIndex, jump) {
            //does the jump "to" property reference a valid destination input?
            if (!jump_destinations[jump.to]) {
                //invalid destination found
                is_valid_form = false;
            }
        });

        switch (input.type) {

            case consts.BRANCH_TYPE:
                html += '<h4 class="branch-header">' + input.question + '</h4>';

                html += '<table border="1" cellpadding="10" cellspacing="10">';
                html += '<tr>';
                html += '<td>';

                $(input.branch).each(function (branchInputIndex, branch_input) {

                    if (!branch_input.dom.is_valid) {
                        is_valid_form = false;
                    }

                    delete branch_input.dom;

                    //todo validate branch jumps
                    jump_destinations = utils.getJumpAvailableDestinationsAsKeys(branchInputIndex, branch_input, input.branch, true);

                    //extra validation for jumps, check if the destination still exists and it is valid
                    $(branch_input.jumps).each(function (branchJumpIndex, branchJump) {
                        //does the jump "to" property reference a valid destination input?
                        if (!jump_destinations[branchJump.to]) {
                            //invalid destination found
                            is_valid_form = false;
                        }
                    });

                    //multiple choice question?
                    if ($.inArray(branch_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                        html += '<h4 class="question">' + branch_input.question + '</h4>';
                        //render possible answers
                        _renderPossibleAnswers(branch_input);
                    }
                    else {
                       _renderQuestion(branch_input);
                    }

                    $(branch_input.group).each(function (index, group_input) {

                        if (!group_input.dom.is_valid) {
                            is_valid_form = false;
                        }
                        delete group_input.dom;

                        //multiple choice question?
                        if ($.inArray(group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                            html += '<h4 class="question">' + group_input.question + '</h4>';
                            //render possible answers
                            _renderPossibleAnswers(group_input);
                        }
                        else {
                            _renderQuestion(group_input);
                        }
                    });
                });

                html += '</td>';
                html += '</tr>';
                html += '</table>';
                break;

            case consts.GROUP_TYPE:
                html += '<h4 class="group-header">' + input.question + '</h4>';

                html += '<table border="1" cellpadding="10" cellspacing="10">';
                html += '<tr>';
                html += '<td>';


                $(input.group).each(function (index, group_input) {
                    if (!group_input.dom.is_valid) {
                        is_valid_form = false;
                    }
                    delete group_input.dom;

                    //multiple choice question?
                    if ($.inArray(group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                        html += '<h4 class="question">' + group_input.question + '</h4>';
                        //render possible answers
                        _renderPossibleAnswers(group_input);
                    }
                    else {
                       _renderQuestion(group_input);
                    }
                });

                html += '</td>';
                html += '</tr>';
                html += '</table>';
                break;

            default:
                //multiple choice question?
                if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                    html += '<h4 class="question">' + input.question + '</h4>';
                    //render possible answers
                    _renderPossibleAnswers(input);
                }
                else {
                    //open answer question
                    _renderQuestion(input);
                }
        }

        if (!input.dom.is_valid) {
            is_valid_form = false;
        }
        delete input.dom;
    });

    if (is_valid_form) {
        //do print
        $('.print-preview-wrapper').empty().append(html);
        window.print();
    }
    else {
        toast.showError(messages.error.FORM_IS_INVALID);
    }
};

module.exports = callback;

},{"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"helpers/ui":36,"helpers/utils":37}],97:[function(require,module,exports){
/* global $, toastr, Flatted, require */
'use strict';
var consts = require('config/consts');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var messages = require('config/messages');
var formbuilder = require('config/formbuilder');
var jumps = require('actions/jumps');
var save = require('actions/save');
var toast = require('config/toast');


/*
 handle click action on save project button
 */
var callback = function (e) {

    //for testing
    var url = '../postdump/index.php';
    var validation = require('actions/validation');
    var current_input = utils.getCurrentlySelectedInput();

    /***************************************************************
     * Save project
     **************************************************************/

    //save the currently selected input just in case
    if (current_input) {
        validation.performValidation(utils.getCurrentlySelectedInput(), false);
    }



    //create a deep copy of the project object properties
    var project_definition_json = Flatted.parse(Flatted.stringify(formbuilder.project_definition));
    //clean up forms from extra properties

    var cleanedForms = save.doCleaningBeforeSaving(project_definition_json.data.project.forms);

    if (cleanedForms.all_jumps_valid && cleanedForms.invalid_jumps_question === '') {

        //*****************************************************************************************************
        //after cleaning, do extra validation, the same one that runs when importing a form -------------------------
        var result = {
            is_valid: true,
            error: {
                message: null
            }
        };

        $(project_definition_json.data.project.forms).each(function (formIndex, form) {

            var validateBeforeSaving = require('actions/validation').validateBeforeSaving;

            result = validateBeforeSaving(form.ref, form.inputs);

            if (!result.is_valid) {
                return false;//exit loop
            }
        });

        //catch forms invalid here
        if (!result.is_valid) {
            toast.showError(result.error.message);
            return false;
        }

        //******************************************************************************************************
        //all valid, start saving ------------------------------------------------------------------------------

        //show overlay and cursor
        formbuilder.dom.overlay.fadeIn(consts.ANIMATION_FAST);

        //for local testing only
        if (window.location.href.indexOf('localhost/') !== -1 && window.location.href.indexOf('epicollect5-formbuilder/') !== -1) {
            consts.PROJECT_URL = url;
        }

        $.ajax({
            url: consts.PROJECT_URL,
            //  contentType: 'application/vnd.api+json',
            data: window.btoa(pako.gzip(JSON.stringify(project_definition_json), {
                'to': 'string'
            }
            )),
            //  data: JSON.stringify(project_definition_json),
            //   dataType: 'json',
            method: 'POST',
            crossDomain: true,
            success: function (data) {
                window.setTimeout(function () {
                    formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST, function () {
                        toast.showSuccess(messages.success.PROJECT_SAVED);
                    });

                }, consts.ANIMATION_SLOW);
                console.log(data);
                console.log('posted successfully');

            },
            error: function (xhr, error, response) {

                var error_obj;
                var titles = '';

                try {
                    error_obj = JSON.parse(xhr.responseText);
                    console.log(xhr.responseText);
                    console.log(xhr, error, response);
                    //get server errors
                    $(error_obj.errors).each(function (index, error) {
                        titles += '<br/>' + error.title;
                    });
                } catch (error) {
                    console.log(error);
                }
                formbuilder.dom.overlay.fadeOut(consts.ANIMATION_FAST);
                toast.showError(messages.error.PROJECT_NOT_SAVED + titles, 3000);
            }
        }
        );
    }
    else {
        toast.showError(messages.error.JUMP_INVALID + cleanedForms.invalid_jumps_question);
    }
};

module.exports = callback;

},{"actions/jumps":4,"actions/save":14,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"helpers/ui":36,"helpers/utils":37}],98:[function(require,module,exports){
'use strict';
var formbuilder = require('config/formbuilder');
var messages = require('config/messages');
var validation = require('actions/validation');
var ui = require('helpers/ui');
var utils = require('helpers/utils');
var consts = require('config/consts');
var input_properties_keyup_callback = require('ui-handlers/event-handler-callbacks/input-properties-keyup-callback');
var template = require('template');
var toast = require('config/toast');
var possibleAnswersSortable = require('ui-handlers/possible-answers-sortable');

var group_sortable = function () {

    var group_input;

    return {
        cursor: 'move',
        items: '.input',
        revert: 100,
        //axis: 'y',// it causes the placeholder to be always active
        containment: 'parent',
        tolerance: 'pointer',
        // forcePlaceholderSize: true,
        placeholder: 'input-collection-drop-placeholder',

        //triggered when a new input is dropped over the sortable
        receive: function (e, jquery_ui) {

            var form_index = formbuilder.current_form_index;
            var previous_group_input_ref = formbuilder.group.current_input_ref;
            var current_element;
            var group_inputs = utils.getInputObjectByRef(formbuilder.current_input_ref).group;
            var group_input_ref = utils.generateBranchGroupInputRef(formbuilder.current_input_ref);
            var group_input_index = group_inputs.length;
            var group_input_type = jquery_ui.item.attr('data-type');
            var input_factory = require('factory/input-factory');
            var owner_branch;

            //if we are editing a branch, it means this is a nested group, update references accordingly
            if (formbuilder.is_editing_branch) {
                console.log('we are editing a nested group');

                group_inputs = utils.getBranchInputObjectByRef(formbuilder.branch.current_input_ref).group;
                group_input_ref = utils.generateBranchGroupInputRef(formbuilder.branch.current_input_ref);
                group_input_index = group_inputs.length;
            }

            //do not consider group/branch inputs within a group
            if (group_input_type === consts.BRANCH_TYPE || group_input_type === consts.GROUP_TYPE) {
                return false;
            }
            else {

                formbuilder.group.current_input_ref = group_input_ref;

                //validate previous input (if any) to show embedded errors (in case the user did not press validate button)
                //todo is this an overkill?
                if (previous_group_input_ref) {

                    if (formbuilder.is_editing_branch) {
                        //this is a nested group,get owner branch
                        owner_branch = utils.getInputObjectByRef(formbuilder.branch.active_branch_ref);

                        validation.performValidation(utils.getNestedGroupInputObjectByRef(owner_branch, previous_group_input_ref), false);
                    }
                    else {
                        validation.performValidation(utils.getGroupInputObjectByRef(previous_group_input_ref), false);
                    }

                }

                console.log('group sortable receive');

                formbuilder.group.collection_is_being_sorted = false;

                //generate input object based on type and set index incrementally
                group_input = input_factory.createInput(group_input_type, group_input_ref);
                console.log(group_input);

                //disable current active element
                current_element = formbuilder.dom.inputs_collection_sortable.find('.active');
                current_element.removeClass('active');

                //add input to collection as the last one
                group_inputs.push(group_input);
            }

            //disable save project button as by default an input is invalid when it is created
            ui.navbar.toggleSaveProjectBtn(consts.BTN_DISABLED);
        },
        stop: function (e, jquery_ui) {

            var undo = require('actions/undo');
            var form_index = formbuilder.current_form_index;
            var group_input_ref = formbuilder.group.current_input_ref;
            var owner_input_ref = formbuilder.current_input_ref;
            var owner_input_index = utils.getInputCurrentIndexByRef(owner_input_ref);
            var inputs = formbuilder.project_definition.data.project.forms[form_index].inputs;
            var group_inputs = inputs[owner_input_index].group;
            var placeholder_text = messages.error.NO_QUESTION_TEXT_YET;
            var input_type = jquery_ui.item.attr('data-type');
            var properties_panel_html;

            //disable draggable if we hit the max amount of inputs allowed
            if (utils.getInputsTotal(inputs) >= consts.INPUTS_MAX_ALLOWED) {
                ui.input_tools.disable();
            }
            //reject group/branch inputs here
            if (input_type === consts.BRANCH_TYPE || input_type === consts.GROUP_TYPE) {
                jquery_ui.item.remove();
                //if group inputs length is zero, show help text placeholder
                //todo
            }
            else {
                //count search inputs
                if(input_type === consts.SEARCH_SINGLE_TYPE && !formbuilder.group.collection_is_being_sorted) {
                    //if the limit is reached, hide search from input tools
                    if (utils.getSearchInputsTotal() >= consts.LIMITS.search_inputs_max) {
                        ui.input_tools.hideSearchInput();
                        //show warning to user
                        toast.showWarning(messages.warning.SEARCH_INPUTS_LIMIT_REACHED + '(' + consts.LIMITS.search_inputs_max + ')')
                    }
                }

                //if we are editing a branch, it means this is a nested group
                if (formbuilder.is_editing_branch) {
                    console.log('we are editing a nested group');
                    owner_input_ref = formbuilder.branch.current_input_ref;
                    group_inputs = utils.getBranchInputObjectByRef(owner_input_ref).group;
                }

                jquery_ui.item.removeAttr('style'); // undo styling set by jqueryUI (http://goo.gl/EKz8tC)

                //get the index where the input was dropped (skip when list is empty)
                formbuilder.group.to_index = jquery_ui.item.index() === 0 ? jquery_ui.item.index() : jquery_ui.item.index() - 1;

                //hide message about no input selected, as dropped input gets focus
                formbuilder.dom.input_properties_no_input_selected.hide();


                /*
                 if the user is dragging a new input over, it was added as the last element of the array
                 otherwise the current input position is set in the start event
                 */
                if (!formbuilder.group.collection_is_being_sorted) {

                    //override 'from_index' as we are dropping a new element (min value for length is 1, as we add the input in the `receive` function)
                    formbuilder.group.from_index = group_inputs.length - 1;

                    //move inputs to keep the array sequence like the input sequence on screen
                    group_inputs.move(formbuilder.group.from_index, formbuilder.group.to_index);

                    jquery_ui.item.addClass('active');
                    jquery_ui.item.attr('data-input-ref', group_input_ref);

                    //append input id and a warning icon, as by default the question does not have any text
                    jquery_ui.item.find('.input-inner').append(ui.inputs_collection.getInputStateIconsHTML());
                    jquery_ui.item.find('span.question-preview').text(placeholder_text);

                    //show input properties for the new dropped input
                    formbuilder.dom.input_properties.find('.panel-body form').hide();
                    formbuilder.dom.input_properties.find('.panel-title span').text(placeholder_text);

                    //create properties panel in right sidebar for this input (common properties)
                    properties_panel_html = template.getInputPropertiesPanelHTML(group_input);

                    //append input and show it as it gets selected by default
                    formbuilder.dom.input_properties_forms_wrapper.hide();
                    $(properties_panel_html).removeClass('hidden').appendTo(formbuilder.dom.input_properties_forms_wrapper);

                    formbuilder.dom.input_properties_forms_wrapper.fadeIn(consts.ANIMATION_FAST);

                    //show action buttons for input
                    formbuilder.dom.input_properties_buttons.fadeIn(consts.ANIMATION_FAST);

                    if (!formbuilder.is_editing_branch) {

                        //formbuilder.dom.input_properties.off('keyup');

                        //this is NOT nested group
                        //triggered when users type in the header input field for branches or groups
                        if (group_input.type === consts.GROUP_TYPE) {
                            formbuilder.dom.input_properties.on('keyup', 'input', input_properties_keyup_callback);
                        }
                    }

                    //enable sortable on current input
                    possibleAnswersSortable(group_input);
                }
                else {
                    //'from_index is set in start event of sortable'
                    //move inputs to keep the array sequence like the input sequence on screen
                    group_inputs.move(formbuilder.group.from_index, formbuilder.group.to_index);

                    //run the validation on all group jumps, as we might have some invalid destinations after re-ordering
                    //I am forced to do this against all the branch inputs
                    validation.validateJumpsAfterSorting(group_inputs);

                    jquery_ui.item.addClass('active');
                }
            }

            //add this state for undoing, so it is easier to rebind everything
            formbuilder.render_action = consts.RENDER_ACTION_DO;
            undo.pushState();

            if (input_type === consts.README_TYPE) {
                $('.summernote').summernote(consts.SUMMERNOTE_OPTIONS);
            }
        },
        //this callback is triggered when the user start dragging an existing input from the sortable
        start: function (e, jquery_ui) {

            //get current input position, as we need to move from here
            formbuilder.group.collection_is_being_sorted = true;
            formbuilder.group.from_index = jquery_ui.item.index() === 0 ? 0 : jquery_ui.item.index() - 1;
            //de-activate all inputs in collection
            formbuilder.dom.inputs_collection_sortable.removeClass('active');

        },
        scroll: true,
        snap: false,
        over: function (e, jquery_ui) {

            var owner_input_ref = formbuilder.group.active_group_ref;
            var owner_input = utils.getInputObjectByRef(owner_input_ref);

            //if we are editing a nested group, grab the nested group
            if (formbuilder.is_editing_branch) {
                owner_input = utils.getBranchInputObjectByRef(owner_input_ref);
            }

            //hide help text if the list is empty and we are hovering with an input
            if (owner_input.group.length === 0) {
                //remove input from dom collection (middle column)
                formbuilder.dom.inputs_collection_sortable
                    .find('div.input[data-input-ref="' + owner_input_ref + '"]')
                    .find('.input-properties__no-group-questions-message')
                    .hide();
            }
        }
    };
};

module.exports = group_sortable();

},{"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"factory/input-factory":31,"helpers/ui":36,"helpers/utils":37,"template":62,"ui-handlers/event-handler-callbacks/input-properties-keyup-callback":92,"ui-handlers/possible-answers-sortable":99}],99:[function(require,module,exports){
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

},{"actions/validation":23,"config/consts":24,"config/formbuilder":26,"helpers/ui":36,"ui-handlers/event-handler-callbacks/save-project-click-callback":97}],100:[function(require,module,exports){
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

},{"actions/undo":22,"actions/validation":23,"config/consts":24,"config/formbuilder":26,"config/messages":28,"config/toast":29,"factory/input-factory":31,"helpers/ui":36,"helpers/utils":37,"template":62,"ui-handlers/possible-answers-sortable":99}]},{},[1])

//# sourceMappingURL=formbuilder.js.map
