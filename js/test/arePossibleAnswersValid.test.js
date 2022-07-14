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
var arePossibleAnswersValid = function () {
    

    describe('Test arePossibleAnswersValid()', function () {
        
        it('should have valid possible answers', function () {

            var possible_answers = [
                {
                    answer: '1',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '2',
                    answer_ref: '5a18590c17196'
                },
                {
                    answer: '3',
                    answer_ref: '5a18590f17197'
                }
            ];

            expect(import_form_validation.arePossibleAnswersValid(possible_answers)).to.be.true;
        });




        it('should catch empty answer', function () {

            var possible_answers = [
                {
                    answer: '',
                    answer_ref: '5a18590517195'
                }
            ];
            expect(import_form_validation.arePossibleAnswersValid(possible_answers)).to.be.false;
        });

        it('should catch empty answer_ref', function () {

            var possible_answers = [
                {
                    answer: 'ciao',
                    answer_ref: ''
                }
            ];
            expect(import_form_validation.arePossibleAnswersValid(possible_answers)).to.be.false;
        });

        it('should catch invalid answer_ref', function () {

            var possible_answers = [
                {
                    answer: 'One',
                    answer_ref: '&a18590517195'
                }
            ];

            expect(import_form_validation.arePossibleAnswersValid(possible_answers)).to.be.false;
        });

        it('should catch short answer_ref', function () {

            var possible_answers = [
                {
                    answer: 'One',
                    answer_ref: 'a18590517195'
                }
            ];

            expect(import_form_validation.arePossibleAnswersValid(possible_answers)).to.be.false;
        });

        it('should catch long answer_ref', function () {

            var possible_answers = [
                {
                    answer: 'One',
                    answer_ref: 'aa18590517195o'
                }
            ];

            expect(import_form_validation.arePossibleAnswersValid(possible_answers)).to.be.false;
        });

        it('should catch missing key', function () {

            var possible_answers = [
                {
                    answer_ref: 'aa18590517195'
                }
            ];

            expect(import_form_validation.arePossibleAnswersValid(possible_answers)).to.be.false;
        });

        it('should catch extra key', function () {

            var possible_answers = [
                {
                    extra:'',
                    answer: 'One',
                    answer_ref: 'aa18590517195'
                }
            ];

            expect(import_form_validation.arePossibleAnswersValid(possible_answers)).to.be.false;
        });


        it('should catch wrong keys', function () {

            var possible_answers = [
                {
                    extra:'',
                    id: 'aa18590517195'
                }
            ];

            expect(import_form_validation.arePossibleAnswersValid(possible_answers)).to.be.false;
        });
    });
};

module.export = arePossibleAnswersValid();
