/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var consts = require('config/consts');
var formbuilder = require('config/formbuilder');
var validation = require('actions/validation');

/**
 * Test for the validation of a single jump within the properties panel.
 *
 * The structure used is a strip down version of the input object
 * with only properties needed for the validation
 */
var isJumpValid = function () {

    var radio_input;

    //the jump "to" must be a valid destination, hence the input is not the last one
    var getJump = function (the_when, the_answer_ref) {
        return {
            type: radio_input.type,
            to: 'form_ref_question_3',
            when: the_when,
            answer_ref: the_answer_ref
        };
    };

    describe('Test validation.isJumpValid()', function () {

        before(function () {

            formbuilder.current_form_index = 0;
            formbuilder.is_editing_branch = false;
            formbuilder.project_definition = {
                data: {
                    project: {
                        forms: [
                            {
                                inputs: [
                                    {
                                        ref: 'form_ref_question_1',
                                        type: 'radio',
                                        question: 'Q1',
                                        jumps: [],
                                        branch: []
                                    },
                                    {
                                        ref: 'form_ref_question_2',
                                        type: 'text',
                                        question: 'Q2',
                                        jumps: [],
                                        branch: []
                                    },
                                    {
                                        ref: 'form_ref_question_3',
                                        type: 'text',
                                        question: 'Q3',
                                        jumps: [],
                                        branch: []
                                    }
                                ]
                            }
                        ]
                    }
                }
            };

            radio_input = formbuilder.project_definition.data.project.forms[0].inputs[0];
        });

        it('should accept "no answer given" without an answer_ref', function () {

            expect(validation.isJumpValid(getJump('NO_ANSWER_GIVEN', undefined), radio_input)).to.be.true;
            expect(validation.isJumpValid(getJump('NO_ANSWER_GIVEN', null), radio_input)).to.be.true;
        });

        it('should accept "always" without an answer_ref', function () {

            expect(validation.isJumpValid(getJump('ALL', undefined), radio_input)).to.be.true;
            expect(validation.isJumpValid(getJump('ALL', null), radio_input)).to.be.true;
        });

        it('should reject "answer is" / "answer is NOT" without an answer_ref', function () {

            expect(validation.isJumpValid(getJump('IS', undefined), radio_input)).to.be.false;
            expect(validation.isJumpValid(getJump('IS_NOT', undefined), radio_input)).to.be.false;
        });

        it('should reject a jump without a condition', function () {

            expect(validation.isJumpValid(getJump(undefined, undefined), radio_input)).to.be.false;
        });

        it('should reject a jump without a destination', function () {

            var jump = getJump('NO_ANSWER_GIVEN', null);
            jump.to = undefined;

            expect(validation.isJumpValid(jump, radio_input)).to.be.false;
        });
    });
};

module.exports = isJumpValid();
