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

            var branch_index = null;
            var group_inputs_html = '';

            //is this a nested group (inside a branch)
            if (formbuilder.is_editing_branch) {
                console.log('This is a nested group in a branch')
                branch_index = utils.getInputCurrentIndexByRef(formbuilder.branch.active_branch_ref);
                var form_index = formbuilder.current_form_index;
                var branch_inputs = formbuilder.project_definition.data.project.forms[form_index].inputs[branch_index].branch;

                //we insert the new nested group as the last question in the current branch
                var group_inputs_html = parse.getGroupInputsHTML(input, branch_index, branch_inputs.length - 1);
            }
            else {
                group_inputs_html = parse.getGroupInputsHTML(input, inputs.length - 1, branch_index);
            }
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
        var ref_map = [];

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
                        input_copied.branch = window.CircularJSON.parse(window.CircularJSON.stringify(input.branch));
                        // Copy the prototype per each branch input (not done by CircularJSON)
                        input_copied.branch.forEach(function (copiedBranchInput, copiedIndex) {
                            input.branch.forEach(function (sourceBranchInput, sourceIndex) {
                                if (sourceIndex === copiedIndex) {
                                    Object.setPrototypeOf(copiedBranchInput, Object.getPrototypeOf(sourceBranchInput));
                                }
                            });
                        });
                        break;
                    case consts.GROUP_TYPE:
                        //copy object
                        input_copied.group = window.CircularJSON.parse(window.CircularJSON.stringify(input.group));
                        // Copy the prototype per each group input (not done by CircularJSON)
                        input_copied.group.forEach(function (copiedGroupInput, copiedIndex) {
                            input.group.forEach(function (sourceGroupInput, sourceIndex) {
                                if (sourceIndex === copiedIndex) {
                                    Object.setPrototypeOf(copiedGroupInput, Object.getPrototypeOf(sourceGroupInput));
                                }
                            });
                        });
                        break;
                    default:
                        input_copied[property] = input[property];

                }
            }
        }

        //branch
        ref_map = self.createBranchCopy(input_copied.ref, input_copied.branch, input);

        //group:
        self.overrideGroupCopyRefs(input_copied.ref, input_copied.group, input);

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
        if (input_copied.type === consts.BRANCH_TYPE) {
            //update jumps for all the branch inputs
            self.updateBranchJumps(input_copied.branch, ref_map);
        }
        else {
            input_copied.jumps = [];
        }

        //copy prototype
        Object.setPrototypeOf(input_copied, Object.getPrototypeOf(input));

        return input_copied;
    },

    updateBranchJumps: function (branch, ref_map) {
        //to store the new jumps
        var updated_jumps;
        var self = this;

        $(branch).each(function (branch_index, branch_input) {

            updated_jumps = [];

            if (branch_input.jumps.length > 0) {

                $(branch_input.jumps).each(function (ji, jump) {

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

    overrideGroupCopyRefs: function (copiedInputRef, copiedGroup, originalInput) {

        $(copiedGroup).each(function (copiedGroupInputIndex, copiedGroupInput) {

            var group_answer_ref_map = {};

            copiedGroupInput.ref = utils.generateNestedGroupInputRef(copiedInputRef);

            //override any "answer_ref"
            if ($.inArray(copiedGroupInput.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {

                var group_input_possible_answers_copy = [];

                $.each(copiedGroupInput.possible_answers, function (index, possible_answer) {

                    var new_answer_ref = utils.generateUniqID();

                    group_input_possible_answers_copy[index] = {};
                    group_input_possible_answers_copy[index].answer = possible_answer.answer;
                    group_input_possible_answers_copy[index].answer_ref = new_answer_ref;

                    group_answer_ref_map[possible_answer.answer_ref] = new_answer_ref;
                });

                //override possible answers for this group input
                copiedGroupInput.possible_answers = group_input_possible_answers_copy;

                //remap default value to new answer_ref
                if (!(copiedGroupInput.default === '' || copiedGroupInput.default === null)) {
                    //there is a default value to remap!
                    if ($.inArray(copiedGroupInput.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                        copiedGroupInput.default = group_answer_ref_map[originalInput.group[copiedGroupInputIndex].default];
                    }
                    else {
                        //do nothing
                    }
                }
            }
        });
    },

    createBranchCopy: function (ref, branch, input) {

        var branch_copy = [];
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

                var group_input_answer_ref_map = {};

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

    getJumpToValueFromRefMap: function (ref_map, to) {

        var jump_to = null;

        //if to id "END", just return it
        if (to === consts.JUMP_TO_END_OF_FORM_REF) {
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
    },

    deepCloneWithPrototypeMap: function (obj) {

        var self = this;

        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // Create a new instance of the same prototype
        var copy = Object.create(Object.getPrototypeOf(obj));

        // Copy properties
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                copy[key] = (typeof value === 'object') ? self.deepCloneWithPrototypeMap(value) : value;
            }
        }

        return copy;
    }
};

module.exports = copy;
