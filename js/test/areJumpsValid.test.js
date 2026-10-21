/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var import_form_validation = require('helpers/import-form-validation');
var consts = require('config/consts');
var utils = require('helpers/utils');

/**
 * Test for valid jumps within an input.
 *
 * The structure used is a strip down version of the input object
 * with only properties needed for the validation
 */
var areJumpsValid = function () {


    describe('Test answer_ref regex', function () {

        var answer_ref_regex = new RegExp(consts.REGEX.possible_answer_ref);

        it('should be all valid answer_ref(s)', function () {
            //test 50 generated answer_ref
            for (var i = 0; i < 50; i++) {
                expect(answer_ref_regex.test(utils.generateUniqID())).to.be.true;
            }
        });

        it('should catch invalid answer_ref', function () {

            var answer_ref1 = utils.generateUniqID() + 'a'; //too long
            var answer_ref2 = null; //is null
            var answer_ref3 = 0; // not string
            var answer_ref4 = ''; //empty string
            var answer_ref5 = '#8d38792a1a8b'; //has #
            var answer_ref6 = 'a8d3879-a1a8b';//has -
            var answer_ref7 = '8d3879-a1a8b'; //too short

            expect(answer_ref_regex.test(answer_ref1)).to.be.false;
            expect(answer_ref_regex.test(answer_ref2)).to.be.false;
            expect(answer_ref_regex.test(answer_ref3)).to.be.false;
            expect(answer_ref_regex.test(answer_ref4)).to.be.false;
            expect(answer_ref_regex.test(answer_ref5)).to.be.false;
            expect(answer_ref_regex.test(answer_ref6)).to.be.false;
            expect(answer_ref_regex.test(answer_ref7)).to.be.false;

        });
    });

    describe('Test areJumpsValid() -> valid jumps', function () {

        it('should have valid jumps', function () {

            var structure = {
                type: 'dropdown',
                jumps: [
                    {
                        to: 'END',
                        when: 'IS',
                        answer_ref: '58d38792a1a8b'
                    }
                ],
                possible_answers: [
                    {
                        answer: 'Jump to end',
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        answer: 'Jump to Radio',
                        answer_ref: '58d387a9a1a8c'
                    }
                ]
            };

            expect(import_form_validation.areJumpsValid(structure)).to.be.true;

            structure = {
                type: 'radio',
                jumps: [
                    {
                        to: 'END',
                        when: 'IS',
                        answer_ref: '58d38792a1a8b'
                    }
                ],
                possible_answers: [
                    {
                        answer: 'Jump to end',
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        answer: 'Jump to Radio',
                        answer_ref: '58d387a9a1a8c'
                    }
                ]
            };

            expect(import_form_validation.areJumpsValid(structure)).to.be.true;


            structure = {
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d38792a1a8a',
                type: 'dropdown',
                jumps: [
                    {
                        to: 'END',
                        when: 'IS',
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        to: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d387e8a1a8e',
                        when: 'IS',
                        answer_ref: '58d387a9a1a8c'
                    },
                    {
                        to: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_5a16d127f9cc6',
                        when: 'IS',
                        answer_ref: '5a16d143f9cc7'
                    }
                ],

                possible_answers: [
                    {
                        answer: 'Jump to end',
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        answer: 'Jump to Radio',
                        answer_ref: '58d387a9a1a8c'
                    },
                    {
                        answer: 'Jump to a jump always text field',
                        answer_ref: '5a16d143f9cc7'
                    }
                ]
            };

            expect(import_form_validation.areJumpsValid(structure)).to.be.true;

            expect(import_form_validation.areJumpsValid({
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'radio',
                possible_answers: [
                    {
                        answer: 'BSK Banashankari',
                        answer_ref: '589202653055c'
                    },
                    {
                        answer: 'KDL Kudlu Gate',
                        answer_ref: '5892027b3055d'
                    },
                    {
                        answer: 'KMH Kammanahalli',
                        answer_ref: '589202823055e'
                    }, {
                        answer: 'NGB Nagarbhavi',
                        answer_ref: '5892028a3055f'
                    }, {
                        answer: 'VDY Vidyaranyapura',
                        answer_ref: '5892029330560'
                    }],
                jumps: [{
                    to: 'END',
                    when: 'ALL',
                    answer_ref: null
                }]
            })).to.be.true;
        });
    });

    describe('Test areJumpsValid() -> conditions not referencing an answer', function () {

        //"no answer given" and "always" do not reference a specific possible answer,
        //so their answer_ref is meaningless and can be empty or dangling
        var possible_answers = [
            {
                answer: 'Yes',
                answer_ref: '589202653055c'
            },
            {
                answer: 'No',
                answer_ref: '5892027b3055d'
            }
        ];

        var getStructure = function (the_when, the_answer_ref) {
            return {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'radio',
                possible_answers: possible_answers,
                jumps: [
                    {
                        to: 'END',
                        when: the_when,
                        answer_ref: the_answer_ref
                    }
                ]
            };
        };

        it('should accept "no answer given" with any answer_ref', function () {

            //no answer at all
            expect(import_form_validation.areJumpsValid(getStructure('NO_ANSWER_GIVEN', null))).to.be.true;

            //dangling answer_ref, it is not checked as the condition does not use it
            expect(import_form_validation.areJumpsValid(getStructure('NO_ANSWER_GIVEN', '5892028a3055f'))).to.be.true;

            //a valid answer_ref, it is ignored
            expect(import_form_validation.areJumpsValid(getStructure('NO_ANSWER_GIVEN', '589202653055c'))).to.be.true;
        });

        it('should accept "always" with any answer_ref', function () {

            //no answer at all
            expect(import_form_validation.areJumpsValid(getStructure('ALL', null))).to.be.true;

            //dangling answer_ref, it is not checked as the condition does not use it
            expect(import_form_validation.areJumpsValid(getStructure('ALL', '5892028a3055f'))).to.be.true;

            //a valid answer_ref, it is ignored
            expect(import_form_validation.areJumpsValid(getStructure('ALL', '589202653055c'))).to.be.true;
        });

        it('should reject "answer is" / "answer is NOT" without an answer_ref', function () {

            expect(import_form_validation.areJumpsValid(getStructure('IS', null))).to.be.false;
            expect(import_form_validation.areJumpsValid(getStructure('IS_NOT', null))).to.be.false;
        });
    });

    describe('Test areJumpsValid() -> invalid jumps', function () {

        it('should flag invalid jumps', function () {

            var structure = {
                type: 'dropdown',
                jumps: [
                    {
                        to: '', //missing destination
                        when: 'IS',
                        answer_ref: '58d38792a1a8b'
                    }
                ],
                possible_answers: [
                    {
                        answer: 'Jump to end',
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        answer: 'Jump to Radio',
                        answer_ref: '58d387a9a1a8c'
                    }
                ]
            };

            expect(import_form_validation.areJumpsValid(structure)).to.be.false;

            structure = {
                type: 'radio',
                jumps: [
                    {
                        to: 'END',
                        when: 'xx',//wrong value
                        answer_ref: '58d38792a1a8b'
                    }
                ],
                possible_answers: [
                    {
                        answer: 'Jump to end',
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        answer: 'Jump to Radio',
                        answer_ref: '58d387a9a1a8c'
                    }
                ]
            };

            expect(import_form_validation.areJumpsValid(structure)).to.be.false;

            structure = {
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d38792a1a8a',
                type: 'dropdown',
                jumps: [
                    {
                        to: 'END',
                        when: '',//empty when
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        to: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d387e8a1a8e',
                        when: 'IS',
                        answer_ref: '58d387a9a1a8c'
                    },
                    {
                        to: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_5a16d127f9cc6',
                        when: 'IS',
                        answer_ref: '5a16d143f9cc7'
                    }
                ],

                possible_answers: [
                    {
                        answer: 'Jump to end',
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        answer: 'Jump to Radio',
                        answer_ref: '58d387a9a1a8c'
                    },
                    {
                        answer: 'Jump to a jump always text field',
                        answer_ref: '5a16d143f9cc7'
                    }
                ]
            };

            expect(import_form_validation.areJumpsValid(structure)).to.be.false;

            structure = {
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d38792a1a8a',
                type: 'dropdown',
                jumps: [
                    {
                        to: 'END',
                        when: 'IS',
                        answer_ref: '£d38792a1a8b'//wrong answer_ref
                    },
                    {
                        to: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d387e8a1a8e',
                        when: 'IS',
                        answer_ref: '58d387a9a1a8c'
                    },
                    {
                        to: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_5a16d127f9cc6',
                        when: 'IS',
                        answer_ref: '5a16d143f9cc7'
                    }
                ],

                possible_answers: [
                    {
                        answer: 'Jump to end',
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        answer: 'Jump to Radio',
                        answer_ref: '58d387a9a1a8c'
                    },
                    {
                        answer: 'Jump to a jump always text field',
                        answer_ref: '5a16d143f9cc7'
                    }
                ]
            };

            structure = {
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d38792a1a8a',
                type: 'text', //type is text, so all jumps fail because not "ALL"
                jumps: [
                    {
                        to: 'END',
                        when: 'IS',
                        answer_ref: 'ad38792a1a8b'
                    },
                    {
                        to: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d387e8a1a8e',
                        when: 'IS',
                        answer_ref: '58d387a9a1a8c'
                    },
                    {
                        to: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_5a16d127f9cc6',
                        when: 'IS',
                        answer_ref: '5a16d143f9cc7'
                    }
                ],

                possible_answers: [
                    {
                        answer: 'Jump to end',
                        answer_ref: '58d38792a1a8b'
                    },
                    {
                        answer: 'Jump to Radio',
                        answer_ref: '58d387a9a1a8c'
                    },
                    {
                        answer: 'Jump to a jump always text field',
                        answer_ref: '5a16d143f9cc7'
                    }
                ]
            };

            expect(import_form_validation.areJumpsValid(structure)).to.be.false;
        });
    });
};

module.export = areJumpsValid();
