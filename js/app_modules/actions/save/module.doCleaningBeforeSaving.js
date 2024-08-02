/* global $*/
'use strict';
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
