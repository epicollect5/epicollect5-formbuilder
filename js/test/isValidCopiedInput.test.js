/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var import_form_validation = require('helpers/import-form-validation');
var consts = require('config/consts');
var utils = require('helpers/utils');
var input_duplicator = require('actions/input-duplicator');
var formbuilder = require('config/formbuilder');

var isValidCopiedInput = function () {

    //form_ref for all the inputs
    var form_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292';
    formbuilder.current_form_ref = form_ref;
    formbuilder.is_editing_branch = false;
    formbuilder.is_editing_group = false;
    formbuilder.possible_answers_pagination = {};

    function isNewinputRefDifferent(form_ref, original, copy) {

        if (original.ref === copy.ref) {
            return false;
        }

        if (original.ref.replace(form_ref, '') === copy.ref.replace(form_ref, '')) {
            return false;
        }

        return true;
    }

    function _areBasicPropertiesAndValuesTheSame(original, copy) {

        var basic_properties = [
            'max',
            'min',
            'type',
            'regex',
            'verify',
            'default',
            'is_title',
            'question',
            'uniqueness',
            'is_required',
            'datetime_format',
            'set_to_current_datetime'
        ];

        $(basic_properties).each(function (index, property) {
            if (original[property] !== copy[property]) {
                return false;
            }
        });

        return true;
    }

    function _areAllPossibleAnswerRefsDifferent(original, copy) {

        var original_possible_answers = original.possible_answers;
        var copy_possible_answers = copy.possible_answers;
        var areTheyAllDifferent = true;

        $(original_possible_answers).each(function (index, original_possible_aswer) {

            console.log('original answer ref', original_possible_aswer.answer_ref);

            $(copy_possible_answers).each(function (index, copy_possible_aswer) {

                console.log('copy answer ref', copy_possible_aswer.answer_ref);

                if (original_possible_aswer.answer_ref === copy_possible_aswer.answer_ref) {
                    areTheyAllDifferent = false;
                    return false;
                }
            });

            if (!areTheyAllDifferent) {
                return false;
            }
        });

        return areTheyAllDifferent;
    }

    function _isDefaultValueCopiedCorrectly(original, copy) {

        var correct = false;

        if (!(original.default === null || original.default === '')) {

            if ($.inArray(original.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {

                    $(copy.possible_answers).each(function (index, possible_answer) {
                        if (possible_answer.answer_ref === copy.default) {
                            correct = true;
                            return false;
                        }
                    });
            }
            else {
                correct = original.default === copy.default;
            }
        }
        else {
            correct = original.default === copy.default;
        }

        return correct;
    }

    describe('Test copied inputs', function () {

        it('should be valid copy of input text', function () {

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '0044657896785235467253',
                is_title: true,
                question: 'Phone number',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            var input_copied = input_duplicator.createInputCopy(input);

            //check ref
            expect(isNewinputRefDifferent(form_ref, input, input_copied)).to.be.true;

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(input, input_copied)).to.be.true;
            expect(input_copied.jumps).to.have.lengthOf(0);

            //check possible answers
            if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                //do nothing here
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }

            //todo

            //check jumps
            //todo

            //check group and branch
            //todo

        });

        it('should be valid copy of input dropdown', function () {

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'dropdown',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5a1c2875bf68a',
                is_title: false,
                question: 'fave color',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [
                    {
                        answer: 'Blue',
                        answer_ref: '5a1c2869bf689'
                    },
                    {
                        answer: 'Green',
                        answer_ref: '5a1c2875bf68a'
                    },
                    {
                        answer: 'Red',
                        answer_ref: '5a1c2879bf68b'
                    }
                ],
                set_to_current_datetime: false
            };

            var input_copied = input_duplicator.createInputCopy(input);

            //check input ref is different
            expect(isNewinputRefDifferent(form_ref, input, input_copied)).to.be.true;

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(input, input_copied)).to.be.true;
            expect(input_copied.jumps).to.have.lengthOf(0);

            //check possible answers
            if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                expect(_areAllPossibleAnswerRefsDifferent(input, input_copied)).to.be.true;
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }

            expect(_isDefaultValueCopiedCorrectly(input, input_copied)).to.be.true;
        });

        it('should be valid copy of input radio', function () {

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'radio',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5a1c2875bf68a',
                is_title: false,
                question: 'fave color',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [
                    {
                        answer: 'Blue',
                        answer_ref: '5a1c2869bf689'
                    },
                    {
                        answer: 'Green',
                        answer_ref: '5a1c2875bf68a'
                    },
                    {
                        answer: 'Red',
                        answer_ref: '5a1c2879bf68b'
                    }
                ],
                set_to_current_datetime: false
            };

            var input_copied = input_duplicator.createInputCopy(input);

            //check input ref is different
            expect(isNewinputRefDifferent(form_ref, input, input_copied)).to.be.true;

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(input, input_copied)).to.be.true;
            expect(input_copied.jumps).to.have.lengthOf(0);

            //check possible answers
            if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                expect(_areAllPossibleAnswerRefsDifferent(input, input_copied)).to.be.true;
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }
            expect(_isDefaultValueCopiedCorrectly(input, input_copied)).to.be.true;
        });

        it('should be valid copy of input checkbox', function () {

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'checkbox',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5a1c2875bf68a',
                is_title: false,
                question: 'fave color',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [
                    {
                        answer: 'Blue',
                        answer_ref: '5a1c2869bf689'
                    },
                    {
                        answer: 'Green',
                        answer_ref: '5a1c2875bf68a'
                    },
                    {
                        answer: 'Red',
                        answer_ref: '5a1c2879bf68b'
                    }
                ],
                set_to_current_datetime: false
            };

            var input_copied = input_duplicator.createInputCopy(input);

            //check input ref is different
            expect(isNewinputRefDifferent(form_ref, input, input_copied)).to.be.true;

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(input, input_copied)).to.be.true;
            expect(input_copied.jumps).to.have.lengthOf(0);

            //check possible answers
            if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                expect(_areAllPossibleAnswerRefsDifferent(input, input_copied)).to.be.true;
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }
            expect(_isDefaultValueCopiedCorrectly(input, input_copied)).to.be.true;
        });

        it('should be valid copy of input branch with a nested group', function () {

            form_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292';
            formbuilder.current_form_ref = form_ref;

            var input = {
                question: 'A branch',
                is_title: false,
                is_required: false,
                max: null,
                min: null,
                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5a1c1556e2aba_5a1c2869bf688',
                type: 'branch',
                group: [],
                jumps: [],
                possible_answers: [],
                uniqueness: 'none',
                regex: null,
                verify: false,
                default: null,
                datetime_format: null,
                set_to_current_datetime: false,
                branch: [
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e785a9076',
                        type: 'text',
                        question: 'Name',
                        is_title: true,
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
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e792a9077',
                        type: 'dropdown',
                        question: 'What color?',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'Red',
                                answer_ref: '5c34e792a9078'
                            },
                            {
                                answer: 'Blue',
                                answer_ref: '5c34e8d2a907d'
                            },
                            {
                                answer: 'Green',
                                answer_ref: '5c34e8d7a907e'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e794a9079',
                        type: 'radio',
                        question: 'What letter?',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '5c34e794a907a',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'A',
                                answer_ref: '5c34e794a907a'
                            },
                            {
                                answer: 'B',
                                answer_ref: '5c34e94fa907f'
                            },
                            {
                                answer: 'C',
                                answer_ref: '5c34e952a9080'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e795a907b',
                        type: 'checkbox',
                        question: 'What number?',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'One',
                                answer_ref: '5c34e795a907c'
                            },
                            {
                                answer: 'Two',
                                answer_ref: '5c34e9a2a9081'
                            },
                            {
                                answer: 'Three',
                                answer_ref: '5c34e9e0a9082'
                            }],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083',
                        type: 'group',
                        question: 'A nested group',
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
                        group: [
                            {
                                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083_5c35e3b6a9085',
                                type: 'text',
                                question: 'Open question',
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
                            },
                            {
                                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083_5c35e3c1a9087',
                                type: 'dropdown',
                                question: 'Pick a number',
                                is_title: false,
                                is_required: false,
                                uniqueness: 'none',
                                regex: null,
                                default: '',
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [
                                    {
                                        answer: '1',
                                        answer_ref: '5c35e3c1a9088'
                                    },
                                    {
                                        answer: '2',
                                        answer_ref: '5c35e3d5a908f'
                                    },
                                    {
                                        answer: '3',
                                        answer_ref: '5c35e3d9a9090'
                                    }
                                ],
                                jumps: [],
                                branch: [],
                                group: []
                            },
                            {
                                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083_5c35e3c3a908a',
                                type: 'radio',
                                question: 'Pick a country',
                                is_title: false,
                                is_required: false,
                                uniqueness: 'none',
                                regex: null,
                                default: '',
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [
                                    {
                                        answer: 'Italy',
                                        answer_ref: '5c35e3c3a908b'
                                    },
                                    {
                                        answer: 'Spain',
                                        answer_ref: '5c35e3e5a9091'
                                    },
                                    {
                                        answer: 'France',
                                        answer_ref: '5c35e409a9092'
                                    }
                                ],
                                jumps: [],
                                branch: [],
                                group: []
                            },
                            {
                                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083_5c35e3c4a908d',
                                type: 'checkbox',
                                question: 'Pick a pet',
                                is_title: false,
                                is_required: false,
                                uniqueness: 'none',
                                regex: null,
                                default: '5c35e3c4a908e',
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [
                                    {
                                        answer: 'Dog',
                                        answer_ref: '5c35e3c4a908e'
                                    },
                                    {
                                        answer: 'Cat',
                                        answer_ref: '5c35e41ea9093'
                                    },
                                    {
                                        answer: 'Bird',
                                        answer_ref: '5c35e423a9094'
                                    },
                                    {
                                        answer: 'Dinosaur',
                                        answer_ref: '5c35e428a9095'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            var input_copied = input_duplicator.createInputCopy(input);

            //check input ref is different
            expect(isNewinputRefDifferent(form_ref, input, input_copied)).to.be.true;

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(input, input_copied)).to.be.true;
            expect(input_copied.jumps).to.have.lengthOf(0);

            expect(input_copied.branch.length).to.be.above(0);

            //check possible answers
            if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                expect(_areAllPossibleAnswerRefsDifferent(input, input_copied)).to.be.true;
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }

            expect(_isDefaultValueCopiedCorrectly(input, input_copied)).to.be.true;

            //check all branch inputs if valid
            $(input_copied.branch).each(function (branch_index, copied_branch_input) {

                //check input ref is different
                expect(isNewinputRefDifferent(form_ref, input.branch[branch_index], copied_branch_input)).to.be.true;

                //check all basic properties and values
                expect(_areBasicPropertiesAndValuesTheSame(input.branch[branch_index], copied_branch_input)).to.be.true;

                //check possible answers
                if ($.inArray(copied_branch_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                    expect(_areAllPossibleAnswerRefsDifferent(input.branch[branch_index], copied_branch_input)).to.be.true;
                }
                else {
                    expect(copied_branch_input.possible_answers).to.have.lengthOf(0);
                }

                expect(_isDefaultValueCopiedCorrectly(input.branch[branch_index], copied_branch_input)).to.be.true;

                //if it is a nested group, check all group inputs
                if (copied_branch_input.type === consts.GROUP_TYPE) {
                    $(copied_branch_input.group).each(function (group_index, copied_nested_group_input) {

                        //check input ref is different
                        expect(isNewinputRefDifferent(form_ref, input.branch[branch_index].group[group_index], copied_nested_group_input), 'wrong nested group input ref').to.be.true;

                        //check all basic properties and values
                        expect(_areBasicPropertiesAndValuesTheSame(input.branch[branch_index].group[group_index], copied_nested_group_input)).to.be.true;

                        //check possible answers
                        if ($.inArray(copied_nested_group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                            expect(_areAllPossibleAnswerRefsDifferent(input.branch[branch_index].group[group_index], copied_branch_input)).to.be.true;
                        }
                        else {
                            expect(copied_nested_group_input.possible_answers).to.have.lengthOf(0);
                        }

                        expect(_isDefaultValueCopiedCorrectly(input.branch[branch_index].group[group_index],copied_nested_group_input)).to.be.true;
                    });
                }
            });

            console.log(CircularJSON.stringify(input_copied));
            console.log('**********************************');
            console.log(CircularJSON.stringify(input));

        });

        it('should be valid copy of input group', function () {

            form_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292';
            formbuilder.current_form_ref = form_ref;
            formbuilder.group = {};
            formbuilder.group.active_group_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e795a907b';

            var input = {
                max: null,
                min: null,
                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5a1c1556e2aba_5a1c2869bf688',
                type: 'group',
                branch: [],
                jumps: [],
                regex: null,
                group: [
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e785a9076',
                        type: 'text',
                        question: 'Name',
                        is_title: true,
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
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e792a9077',
                        type: 'dropdown',
                        question: 'What color?',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'Red',
                                answer_ref: '5c34e792a9078'
                            },
                            {
                                answer: 'Blue',
                                answer_ref: '5c34e8d2a907d'
                            },
                            {
                                answer: 'Green',
                                answer_ref: '5c34e8d7a907e'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e794a9079',
                        type: 'radio',
                        question: 'What letter?',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '5c34e794a907a',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'A',
                                answer_ref: '5c34e794a907a'
                            },
                            {
                                answer: 'B',
                                answer_ref: '5c34e94fa907f'
                            },
                            {
                                answer: 'C',
                                answer_ref: '5c34e952a9080'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e795a907b',
                        type: 'checkbox',
                        question: 'What number?',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'One',
                                answer_ref: '5c34e795a907c'
                            },
                            {
                                answer: 'Two',
                                answer_ref: '5c34e9a2a9081'
                            },
                            {
                                answer: 'Three',
                                answer_ref: '5c34e9e0a9082'
                            }]
                    }
                ],
                verify: false,
                default: '5a1c2875bf68a',
                is_title: false,
                question: 'A group about family members',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            var input_copied = input_duplicator.createInputCopy(input);

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(input, input_copied)).to.be.true;
            expect(input_copied.jumps).to.have.lengthOf(0);
            expect(input_copied.group.length).to.be.above(0);

            //check possible answers
            if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                expect(_areAllPossibleAnswerRefsDifferent(input, input_copied)).to.be.true;
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }

            //check all branch inputs if valid
            $(input_copied.group).each(function (index, copied_group_input) {
                //check all basic properties and values
                expect(_areBasicPropertiesAndValuesTheSame(input.group[index], copied_group_input)).to.be.true;

                //check possible answers
                if ($.inArray(copied_group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                    expect(_areAllPossibleAnswerRefsDifferent(input.group[index], copied_group_input)).to.be.true;
                }
                else {
                    expect(copied_group_input.possible_answers).to.have.lengthOf(0);
                }

                expect(_isDefaultValueCopiedCorrectly(input.group[index], copied_group_input)).to.be.true;
            });
        });

        it('should be a valid copy of a group input', function () {

            form_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292';
            formbuilder.current_form_ref = form_ref;
            formbuilder.is_editing_group = true;

            var input = {
                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a',
                type: 'group',
                question: 'A group',
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
                group: [
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a_5c389f537039b',
                        type: 'text',
                        question: 'Name',
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
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a_5c389f5c7039c',
                        type: 'dropdown',
                        question: 'Pick number',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: '1',
                                answer_ref: '5c389f5c7039d'
                            },
                            {
                                answer: '2',
                                answer_ref: '5c389fb1703a2'
                            },
                            {
                                answer: '3',
                                answer_ref: '5c389fb4703a3'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a_5c389f5d7039e',
                        type: 'radio',
                        question: 'Pick color',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'Red',
                                answer_ref: '5c389f5d7039f'
                            },
                            {
                                answer: 'Blue',
                                answer_ref: '5c38a001703a4'
                            },
                            {
                                answer: 'Yellow',
                                answer_ref: '5c38a006703a5'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a_5c389fa1703a0',
                        type: 'checkbox',
                        question: 'Pick letter',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'A',
                                answer_ref: '5c389fa1703a1'
                            },
                            {
                                answer: 'B',
                                answer_ref: '5c38a0ec703a6'
                            },
                            {
                                answer: 'C',
                                answer_ref: '5c38a0ef703a7'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    }
                ]
            };

            var group_input = input.group[3];
            var input_copied = input_duplicator.createInputCopy(group_input);

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(group_input, input_copied)).to.be.true;
            expect(input_copied.jumps).to.have.lengthOf(0);

            //check possible answers
            if ($.inArray(group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                expect(_areAllPossibleAnswerRefsDifferent(group_input, input_copied)).to.be.true;
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }

            expect(_isDefaultValueCopiedCorrectly(group_input, input_copied)).to.be.true;

            formbuilder.is_editing_group = false;
        });

        it('should be a valid copy of a branch input', function () {

            form_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292';
            formbuilder.current_form_ref = form_ref;
            formbuilder.is_editing_branch = true;
            formbuilder.is_editing_group = false;

            var input = {
                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a',
                type: 'branch',
                question: 'A branch',
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
                group: [],
                branch: [
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a_5c389f537039b',
                        type: 'text',
                        question: 'Name',
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
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a_5c389f5c7039c',
                        type: 'dropdown',
                        question: 'Pick number',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: '1',
                                answer_ref: '5c389f5c7039d'
                            },
                            {
                                answer: '2',
                                answer_ref: '5c389fb1703a2'
                            },
                            {
                                answer: '3',
                                answer_ref: '5c389fb4703a3'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a_5c389f5d7039e',
                        type: 'radio',
                        question: 'Pick color',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'Red',
                                answer_ref: '5c389f5d7039f'
                            },
                            {
                                answer: 'Blue',
                                answer_ref: '5c38a001703a4'
                            },
                            {
                                answer: 'Yellow',
                                answer_ref: '5c38a006703a5'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c389f4a7039a_5c389fa1703a0',
                        type: 'checkbox',
                        question: 'Pick letter',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'A',
                                answer_ref: '5c389fa1703a1'
                            },
                            {
                                answer: 'B',
                                answer_ref: '5c38a0ec703a6'
                            },
                            {
                                answer: 'C',
                                answer_ref: '5c38a0ef703a7'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    }
                ]
            };

            var branch_input = input.branch[3];
            var input_copied = input_duplicator.createInputCopy(branch_input);

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(branch_input, input_copied)).to.be.true;

            //check possible answers
            if ($.inArray(branch_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                expect(_areAllPossibleAnswerRefsDifferent(branch_input, input_copied)).to.be.true;
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }

            expect(_isDefaultValueCopiedCorrectly(branch_input, input_copied)).to.be.true;

            formbuilder.is_editing_group = false;
            formbuilder.is_editing_branch = false;
        });

        it('should be valid copy of a nested group input', function () {

            form_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292';
            formbuilder.current_form_ref = form_ref;
            formbuilder.is_editing_group = true;
            formbuilder.is_editing_branch = true;
            formbuilder.branch.active_branch_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5a1c1556e2aba_5a1c2869bf688';
            formbuilder.group.current_input_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083_5c35e3c1a9087';

            var input = {
                question: 'A branch',
                is_title: false,
                is_required: false,
                max: null,
                min: null,
                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5a1c1556e2aba_5a1c2869bf688',
                type: 'branch',
                group: [],
                jumps: [],
                possible_answers: [],
                uniqueness: 'none',
                regex: null,
                verify: false,
                default: null,
                datetime_format: null,
                set_to_current_datetime: false,
                branch: [
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e785a9076',
                        type: 'text',
                        question: 'Name',
                        is_title: true,
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
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e792a9077',
                        type: 'dropdown',
                        question: 'What color?',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'Red',
                                answer_ref: '5c34e792a9078'
                            },
                            {
                                answer: 'Blue',
                                answer_ref: '5c34e8d2a907d'
                            },
                            {
                                answer: 'Green',
                                answer_ref: '5c34e8d7a907e'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e794a9079',
                        type: 'radio',
                        question: 'What letter?',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'A',
                                answer_ref: '5c34e794a907a'
                            },
                            {
                                answer: 'B',
                                answer_ref: '5c34e94fa907f'
                            },
                            {
                                answer: 'C',
                                answer_ref: '5c34e952a9080'
                            }
                        ],
                        jumps: [],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c34e795a907b',
                        type: 'checkbox',
                        question: 'What number?',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'One',
                                answer_ref: '5c34e795a907c'
                            },
                            {
                                answer: 'Two',
                                answer_ref: '5c34e9a2a9081'
                            },
                            {
                                answer: 'Three',
                                answer_ref: '5c34e9e0a9082'
                            }]
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083',
                        type: 'group',
                        question: 'A nested group',
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
                        group: [
                            {
                                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083_5c35e3b6a9085',
                                type: 'text',
                                question: 'Open question',
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
                            },
                            {
                                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083_5c35e3c1a9087',
                                type: 'dropdown',
                                question: 'Pick a number',
                                is_title: false,
                                is_required: false,
                                uniqueness: 'none',
                                regex: null,
                                default: '',
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [
                                    {
                                        answer: '1',
                                        answer_ref: '5c35e3c1a9088'
                                    },
                                    {
                                        answer: '2',
                                        answer_ref: '5c35e3d5a908f'
                                    },
                                    {
                                        answer: '3',
                                        answer_ref: '5c35e3d9a9090'
                                    }
                                ],
                                jumps: [],
                                branch: [],
                                group: []
                            },
                            {
                                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083_5c35e3c3a908a',
                                type: 'radio',
                                question: 'Pick a country',
                                is_title: false,
                                is_required: false,
                                uniqueness: 'none',
                                regex: null,
                                default: '',
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [
                                    {
                                        answer: 'Italy',
                                        answer_ref: '5c35e3c3a908b'
                                    },
                                    {
                                        answer: 'Spain',
                                        answer_ref: '5c35e3e5a9091'
                                    },
                                    {
                                        answer: 'France',
                                        answer_ref: '5c35e409a9092'
                                    }
                                ],
                                jumps: [],
                                branch: [],
                                group: []
                            },
                            {
                                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c34e779a9075_5c35e3ada9083_5c35e3c4a908d',
                                type: 'checkbox',
                                question: 'Pick a pet',
                                is_title: false,
                                is_required: false,
                                uniqueness: 'none',
                                regex: null,
                                default: '',
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [
                                    {
                                        answer: 'Dog',
                                        answer_ref: '5c35e3c4a908e'
                                    },
                                    {
                                        answer: 'Cat',
                                        answer_ref: '5c35e41ea9093'
                                    },
                                    {
                                        answer: 'Bird',
                                        answer_ref: '5c35e423a9094'
                                    },
                                    {
                                        answer: 'Dinosaur',
                                        answer_ref: '5c35e428a9095'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };

            var nested_group_input = input.branch[4].group[1];
            var input_copied = input_duplicator.createInputCopy(nested_group_input);

            //check input ref is different
            expect(isNewinputRefDifferent(form_ref, nested_group_input, input_copied)).to.be.true;

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(nested_group_input, input_copied)).to.be.true;
            expect(input_copied.jumps).to.have.lengthOf(0);

            //check possible answers
            if ($.inArray(nested_group_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                expect(_areAllPossibleAnswerRefsDifferent(nested_group_input, input_copied)).to.be.true;
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }

            expect(_isDefaultValueCopiedCorrectly(nested_group_input, input_copied)).to.be.true;


            formbuilder.is_editing_group = false;
            formbuilder.is_editing_branch = false;
            formbuilder.branch.active_branch_ref = null;
            formbuilder.group.current_input_ref = null;

            console.log(CircularJSON.stringify(input_copied));
            console.log('**********************************');
            console.log(CircularJSON.stringify(input));

        });

        it('should be valid copy of input branch with jumps', function () {

            form_ref = 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292';
            formbuilder.current_form_ref = form_ref;

            var input = {
                ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c3f0acab2db1',
                type: 'branch',
                question: 'A branch',
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
                branch: [
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c3f0acab2db1_5c3f198d37374',
                        type: 'dropdown',
                        question: 'Pick number',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: '1',
                                answer_ref: '5c3f198d37375'
                            },
                            {
                                answer: '2',
                                answer_ref: '5c3f199537376'
                            },
                            {
                                answer: '3',
                                answer_ref: '5c3f199537377'
                            }
                        ],
                        jumps: [
                            {
                                to: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c3f0acab2db1_5c3f1a1d3737f',
                                when: 'IS',
                                answer_ref: '5c3f199537377'
                            }
                        ],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c3f0acab2db1_5c4067e8cb47b',
                        type: 'checkbox',
                        question: 'Pick a letter',
                        is_title: false,
                        is_required: false,
                        uniqueness: 'none',
                        regex: null,
                        default: '',
                        verify: false,
                        max: null,
                        min: null,
                        datetime_format: null,
                        set_to_current_datetime: false,
                        possible_answers: [
                            {
                                answer: 'A',
                                answer_ref: '5c4067e8cb47c'
                            },
                            {
                                answer: 'B',
                                answer_ref: '5c4067f4cb47d'
                            },
                            {
                                answer: 'C',
                                answer_ref: '5c4067f4cb47e'
                            }
                        ],
                        jumps: [
                            {
                                to: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c3f0acab2db1_5c3f1a1d3737f',
                                when: 'IS',
                                answer_ref: '5c4067e8cb47c'
                            },
                            {
                                to: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c3f0acab2db1_5c406804cb480',
                                when: 'IS',
                                answer_ref: '5c4067f4cb47e'
                            }
                        ],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c3f0acab2db1_5c3f0ad6b2db2',
                        type: 'text',
                        question: 'Name',
                        is_title: true,
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
                        jumps: [
                            {
                                to: 'END',
                                when: 'ALL',
                                answer_ref: null
                            }
                        ],
                        branch: [],
                        group: []
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c3f0acab2db1_5c3f1a1d3737f',
                        type: 'phone',
                        question: 'Phone number',
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
                    },
                    {
                        ref: 'd51f67bc01f14ee18443cd3b90dd211b_5c124ee940292_5c3f0acab2db1_5c406804cb480',
                        type: 'readme',
                        question: '&lt;p&gt;Just a readme&lt;/p&gt;',
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
                    }
                ],
                group: []
            };
            var input_copied = input_duplicator.createInputCopy(input);

            //check input ref is different
            expect(isNewinputRefDifferent(form_ref, input, input_copied)).to.be.true;

            //check all basic properties and values
            expect(_areBasicPropertiesAndValuesTheSame(input, input_copied)).to.be.true;
            expect(input_copied.jumps).to.have.lengthOf(0);
            expect(input_copied.branch.length).to.be.above(0);

            //check possible answers
            if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                expect(_areAllPossibleAnswerRefsDifferent(input, input_copied)).to.be.true;
            }
            else {
                expect(input_copied.possible_answers).to.have.lengthOf(0);
            }

            //check all branch inputs if valid
            $(input_copied.branch).each(function (branch_index, copied_branch_input) {

                //check input ref is different
                expect(isNewinputRefDifferent(form_ref, input.branch[branch_index], copied_branch_input)).to.be.true;

                //check all basic properties and values
                expect(_areBasicPropertiesAndValuesTheSame(input.branch[branch_index], copied_branch_input)).to.be.true;

                //check possible answers
                if ($.inArray(copied_branch_input.type, consts.MULTIPLE_ANSWER_TYPES) !== -1) {
                    expect(_areAllPossibleAnswerRefsDifferent(input.branch[branch_index], copied_branch_input)).to.be.true;
                }
                else {
                    expect(copied_branch_input.possible_answers).to.have.lengthOf(0);
                }

                expect(import_form_validation.areJumpsValid(copied_branch_input)).to.be.true;

                expect(_isDefaultValueCopiedCorrectly(input.branch[branch_index], copied_branch_input)).to.be.true;
            });

            expect(import_form_validation.areJumpsDestinationsValid(input_copied.branch)).to.be.true;
        });
    });
};

module.export = isValidCopiedInput();


