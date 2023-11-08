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
            if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) > -1) {
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
        if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) > -1) {
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
