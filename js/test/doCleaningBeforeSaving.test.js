/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var import_form_validation = require('helpers/import-form-validation');
var consts = require('config/consts');
var utils = require('helpers/utils');
var save = require('actions/save');

var doCleaningBeforeSaving = function () {

    function getFormStructure() {
        return {
            ref: 'form_ref',
            name: 'Form One',
            slug: 'form-one',
            type: 'hierarchy',
            inputs: [
                {
                    ref: 'form_ref_question_1',
                    type: 'text',
                    question: 'Name',
                    is_title: true,
                    is_required: true,
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
                    ref: 'form_ref_question_2',
                    type: 'dropdown',
                    question: 'Pick a path',
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
                            answer: 'Skip to branch',
                            answer_ref: '5a252a07d8894'
                        }
                    ],
                    jumps: [
                        {
                            to: 'form_ref_question_4',
                            when: 'ALL',
                            answer_ref: null
                        }
                    ],
                    branch: [],
                    group: []
                },
                {
                    ref: 'form_ref_question_3',
                    type: 'checkbox',
                    question: 'Ignored question',
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
                            answer_ref: '5a252a42d8898'
                        }
                    ],
                    jumps: [],
                    branch: [],
                    group: []
                },
                {
                    ref: 'form_ref_question_4',
                    type: 'branch',
                    question: 'Family Members',
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
                            ref: 'form_ref_question_4_branch_1',
                            type: 'text',
                            question: 'Name',
                            is_title: true,
                            is_required: true,
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
                            ref: 'form_ref_question_4_branch_2',
                            type: 'radio',
                            question: 'Relationship',
                            is_title: false,
                            is_required: true,
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
                                    answer: 'Mother',
                                    answer_ref: '5a252a94d88a1'
                                },
                                {
                                    answer: 'Sister',
                                    answer_ref: '5a252a98d88a2'
                                }
                            ],
                            jumps: [
                                {
                                    to: 'form_ref_question_4_branch_4',
                                    when: 'IS',
                                    answer_ref: '5a252a94d88a1'
                                },
                                {
                                    to: 'END',
                                    when: 'IS',
                                    answer_ref: '5a252a98d88a2'
                                }
                            ],
                            branch: [],
                            group: []
                        },
                        {
                            ref: 'form_ref_question_4_branch_3',
                            type: 'integer',
                            question: 'How old is your father',
                            is_title: false,
                            is_required: false,
                            uniqueness: 'none',
                            regex: '',
                            default: '',
                            verify: false,
                            max: '',
                            min: '',
                            datetime_format: null,
                            set_to_current_datetime: false,
                            possible_answers: [],
                            jumps: [],
                            branch: [],
                            group: []
                        },
                        {
                            ref: 'form_ref_question_4_branch_4',
                            type: 'integer',
                            question: 'How old is your mother',
                            is_title: false,
                            is_required: false,
                            uniqueness: 'none',
                            regex: '',
                            default: '',
                            verify: false,
                            max: '',
                            min: '',
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
                            ref: 'form_ref_question_4_branch_5',
                            type: 'integer',
                            question: 'How old is your sibling',
                            is_title: false,
                            is_required: false,
                            uniqueness: 'none',
                            regex: '',
                            default: '',
                            verify: false,
                            max: '',
                            min: '',
                            datetime_format: null,
                            set_to_current_datetime: false,
                            possible_answers: [],
                            jumps: [],
                            branch: [],
                            group: []
                        }
                    ],
                    group: []
                }
            ]
        };
    }

    describe('Test  valid doCleaningBeforeSaving', function () {

        it('should be valid structure', function () {

            var forms = [getFormStructure()];
            expect(save.doCleaningBeforeSaving(forms).all_jumps_valid).to.be.true;
            expect(save.doCleaningBeforeSaving(forms).invalid_jumps_question).to.equal('');
        });


        it('should remove dom props', function () {

            var forms = [getFormStructure()];

            //add dom prop to inputs
            $(forms[0].inputs).each(function (index, input) {
                input.dom = {
                    is_valid: true
                };

                if (input.type === consts.BRANCH_TYPE) {
                    $(input.branch).each(function (branchIndex, branchInput) {
                        branchInput.dom = {
                            is_valid: true
                        };
                    });
                }
            });


            //check structure has got dom property
            $(forms[0].inputs).each(function (index, input) {
                expect(input).to.have.property('dom');
                if (input.type === consts.BRANCH_TYPE) {
                    $(input.branch).each(function (branchIndex, branchInput) {
                        expect(branchInput).to.have.property('dom');
                    });
                }
            });

            //call cleaning
            save.doCleaningBeforeSaving(forms);

            //dom property must be gone
            $(forms[0].inputs).each(function (index, input) {
                expect(input).to.not.have.property('dom');
                if (input.type === consts.BRANCH_TYPE) {
                    $(input.branch).each(function (branchIndex, branchInput) {
                        expect(branchInput).to.not.have.property('dom');
                    });
                }
            });
        });

        it('should remove has_valid_destination prop from jumps', function () {

            var forms = [getFormStructure()];

            //add has_valid_destination prop to input jumps
            $(forms[0].inputs).each(function (index, input) {

                $(input.jumps).each(function (jumpIndex, jump) {
                    jump.has_valid_destination = false;
                });

                if (input.type === consts.BRANCH_TYPE) {
                    $(input.branch).each(function (branchIndex, branchInput) {
                        $(branchInput.jumps).each(function (jumpIndex, jump) {
                            jump.has_valid_destination = false;
                        });
                    });
                }
            });


            //check structure has got has_valid_destination property on jumps
            $(forms[0].inputs).each(function (index, input) {

                $(input.jumps).each(function (jumpIndex, jump) {
                    expect(jump).to.have.property('has_valid_destination');
                });


                if (input.type === consts.BRANCH_TYPE) {
                    $(input.branch).each(function (branchIndex, branchInput) {
                        $(branchInput.jumps).each(function (jumpIndex, jump) {
                            expect(jump).to.have.property('has_valid_destination');
                        });
                    });
                }
            });

            //call cleaning
            save.doCleaningBeforeSaving(forms);

            //has_valid_destination property must be gone
            $(forms[0].inputs).each(function (index, input) {

                $(input.jumps).each(function (jumpIndex, jump) {
                    expect(jump).to.not.have.property('has_valid_destination');
                });


                if (input.type === consts.BRANCH_TYPE) {
                    $(input.branch).each(function (branchIndex, branchInput) {
                        $(branchInput.jumps).each(function (jumpIndex, jump) {
                            expect(jump).to.not.have.property('has_valid_destination');
                        });
                    });
                }
            });
        });
    });
};

module.exports = doCleaningBeforeSaving();

