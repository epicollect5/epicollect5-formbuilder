/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var possible_answers = require('actions/possible-answers');
var consts = require('config/consts');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');


var exportPossibleAnswersCSV = function () {

    consts.LIMITS.possible_answers_max = 300;

    describe('Test exportPossibleAnswersCSV()', function () {

        it('should be valid csv string 1', function () {

            var csv;
            var expected;

            //mock current input ref;
            formbuilder.current_input_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d';
            //mock project definition (it is set by previous tests)
            formbuilder.current_form_index = 0;
            formbuilder.project_definition.data.project.forms[0].inputs = [];
            formbuilder.project_definition.data.project.forms[0].inputs[0] = {
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                question: 'This is a test question for the csv export',
                possible_answers: [

                    {answer: '1', answer_ref: '5a3145cb20eb7'},
                    {answer: '2', answer_ref: '5a31722e0dead'},
                    {answer: '3', answer_ref: '5a3145cb20eb8'},
                    {answer: '4', answer_ref: '5a3145cb20eb9'}

                ]
            };
            console.log(formbuilder);

            csv = possible_answers.exportPossibleAnswersCSV();

            expect(csv).not.to.be.false;
            expect(csv).to.be.an('object');
            expect(csv).to.have.keys(['data', 'filename']);
            expect(csv.filename).to.be.a('string');
            expect(csv.data).to.be.a('string');

            expected = 'This is a test question for the csv export\r\n1\r\n2\r\n3\r\n4';

            expect(csv.data).to.equal(expected);


        });

        it('should be valid csv string 2', function () {

            var csv;
            var expected;

            //mock current input ref;
            formbuilder.current_input_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d';
            //mock project definition (it is set by previous tests)
            formbuilder.current_form_index = 0;
            formbuilder.project_definition.data.project.forms[0].inputs = [];
            formbuilder.project_definition.data.project.forms[0].inputs[0] = {
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                question: 'This is a test question for the csv export',
                possible_answers: [

                    {answer: 'This has "quotes"', answer_ref: '5a3145cb20eb7'},
                    {answer: 'This has single \'quotes\'', answer_ref: '5a31722e0dead'},
                    {answer: 'This has got both "double" and \'single\' quotes', answer_ref: '5a3145cb20eb8'},
                    {answer: 'This has got pipe |', answer_ref: '5a3145cb20eb9'}

                ]
            };

            csv = possible_answers.exportPossibleAnswersCSV();

            expect(csv).not.to.be.false;
            expect(csv).to.be.an('object');
            expect(csv).to.have.keys(['data', 'filename']);
            expect(csv.filename).to.be.a('string');
            expect(csv.data).to.be.a('string');

            expected = 'This is a test question for the csv export\r\nThis has "quotes"\r\nThis has single \'quotes\'\r\nThis has got both "double" and \'single\' quotes\r\nThis has got pipe |';

            expect(csv.data).to.equal(expected);


        });

        it('should abort as no possible answers to export', function () {

            var csv;

            //mock current input ref;
            formbuilder.current_input_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d';
            //mock project definition (it is set by previous tests)
            formbuilder.current_form_index = 0;
            formbuilder.project_definition.data.project.forms[0].inputs = [];
            formbuilder.project_definition.data.project.forms[0].inputs[0] = {
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                question: 'This is a test question for the csv export',
                possible_answers: []
            };

            csv = possible_answers.exportPossibleAnswersCSV();

            expect(csv).to.be.false;
            expect(csv).to.be.a('boolean');
        });
    });
};

module.export = exportPossibleAnswersCSV();
