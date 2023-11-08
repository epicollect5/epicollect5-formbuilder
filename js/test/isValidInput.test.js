/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var import_form_validation = require('helpers/import-form-validation');
var consts = require('config/consts');
var utils = require('helpers/utils');

var isValidInput = function () {

    describe('Test form-validation.isValidInput() -> valid inputs', function () {

        it('should be valid input readme', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_59bc135b3ea47',
                type: 'readme',
                question: '&lt;b&gt;&lt;span style=&quot;font-size:12.0pt;line-height:107%;font-family:&amp;quot;Cambria&amp;quot;,serif;\nmso-fareast-font-family:Calibri;mso-fareast-theme-font:minor-latin;mso-bidi-font-family:\n&amp;quot;Times New Roman&amp;quot;;mso-ansi-language:EN-GB;mso-fareast-language:EN-US;\nmso-bidi-language:AR-SA&quot;&gt;Instruction:&lt;/span&gt;&lt;/b&gt;&lt;span style=&quot;font-size:12.0pt;\nline-height:107%;font-family:&amp;quot;Cambria&amp;quot;,serif;mso-fareast-font-family:Calibri;\nmso-fareast-theme-font:minor-latin;mso-bidi-font-family:&amp;quot;Times New Roman&amp;quot;;\nmso-ansi-language:EN-GB;mso-fareast-language:EN-US;mso-bidi-language:AR-SA&quot;&gt; I will now ask you about your experience of seeking care in your usual health provider.&lt;/span&gt;&lt;span style=&quot;font-size:11.0pt;line-height:107%;font-family:\n&amp;quot;Cambria&amp;quot;,serif;mso-fareast-font-family:Calibri;mso-fareast-theme-font:minor-latin;\nmso-bidi-font-family:&amp;quot;Times New Roman&amp;quot;;mso-bidi-theme-font:minor-bidi;\nmso-ansi-language:EN-GB;mso-fareast-language:EN-US;mso-bidi-language:AR-SA&quot;&gt; &lt;/span&gt;&lt;span style=&quot;font-size:12.0pt;line-height:107%;font-family:&amp;quot;Cambria&amp;quot;,serif;\nmso-fareast-font-family:Calibri;mso-fareast-theme-font:minor-latin;mso-bidi-font-family:\n&amp;quot;Times New Roman&amp;quot;;mso-ansi-language:EN-GB;mso-fareast-language:EN-US;\nmso-bidi-language:AR-SA&quot;&gt;I will ask about your level of satisfaction on various aspect of health care, I will provide you with five options for you to express your level of satisfaction. Read allowed all options to respondents&lt;/span&gt;',
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
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input readme', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_59d123e68fac0',
                type: 'readme',
                question: '&lt;p&gt;&lt;b&gt;&lt;i&gt;&lt;span style=&quot;font-size:12.0pt;line-height:\n107%;font-family:&amp;quot;Cambria&amp;quot;,serif;mso-fareast-font-family:Calibri;mso-fareast-theme-font:\nminor-latin;mso-bidi-font-family:&amp;quot;Times New Roman&amp;quot;;mso-ansi-language:EN-GB;\nmso-fareast-language:EN-US;mso-bidi-language:AR-SA&quot;&gt;In the next question, do not read aloud options. Allow respondents to exhaust the reasons. Then ask anything else. Tick all the options that apply&lt;/span&gt;&lt;/i&gt;&lt;/b&gt;&lt;br&gt;&lt;/p&gt;',
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
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input text', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [
                    {
                        to: 'END',
                        when: 'ALL',
                        answer_ref: null
                    }
                ],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'Name?',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input integer', function () {

            var form_ref = '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: 9,
                min: 1,
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d3877ea1a89',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5',
                is_title: true,
                question: 'Number',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid integer min max as strings', function () {

            var form_ref = '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: '9',
                min: '1',
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d3877ea1a89',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5',
                is_title: true,
                question: 'Number',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input integer', function () {

            var form_ref = 'b14a8938b633440d868f7de2524a4cce_591becac1db37';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: 'b14a8938b633440d868f7de2524a4cce_591becac1db37_591beeb35a747',
                type: 'integer',
                question: '4. Mã thôn xã Bù Gia Mập (village) (Cầu Sắt =1; Đăk Côn=2; Bù Lư=3; Bù Dốt=4; Bù Rên=5; Bù Đăk Á=6; Bù La=7; Bù Nga=8)',
                is_title: true,
                is_required: true,
                uniqueness: 'none',
                regex: '',
                default: '',
                verify: false,
                max: '8',
                min: '1',
                datetime_format: null,
                set_to_current_datetime: false,
                possible_answers: [],
                jumps: [
                    {
                        to: 'b14a8938b633440d868f7de2524a4cce_591becac1db37_591bf28f5a74c',
                        when: 'ALL',
                        answer_ref: null
                    }],
                branch: [],
                group: []
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input decimal', function () {

            var form_ref = '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: 100.678,
                min: -789.456,
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d3877ea1a89',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5.5',
                is_title: true,
                question: 'Decimal',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input decimal min max as strings', function () {

            var form_ref = '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: '110',
                min: '15',
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d3877ea1a89',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5.5',
                is_title: true,
                question: 'Decimal',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input decimal min max as strings 2', function () {

            var form_ref = '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: '150',
                min: '1',
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d3877ea1a89',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5.5',
                is_title: true,
                question: 'Decimal',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input phone', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'phone',
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

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input date', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2852bf686',
                type: 'date',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: false,
                question: 'Date',
                uniqueness: 'none',
                is_required: false,
                datetime_format: 'YYYY\/MM\/dd',
                possible_answers: [],
                set_to_current_datetime: true
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input time', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c285bbf687',
                type: 'time',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: false,
                question: 'Time',
                uniqueness: 'form',
                is_required: false,
                datetime_format: 'HH:mm',
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input dropdown', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

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

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input radio', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'radio',
                question: 'Associated Branch',
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
                }],
                branch: [],
                group: []
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input searchsingle', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'searchsingle',
                question: 'Search single',
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
                possible_answers: [],
                jumps: [],
                branch: [],
                group: []
            };

            //build possible answers to the limit
            for (var i = 0; i < consts.LIMITS.possible_answers_max_search; i++) {
                input.possible_answers[i] =
                {
                    answer: i + ' option',
                    answer_ref: utils.generateUniqID()
                }
            }

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

        it('should be valid input searchmultiple', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'searchsingle',
                question: 'Search single',
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
                possible_answers: [],
                jumps: [],
                branch: [],
                group: []
            };

            //build possible answers to the limit
            for (var i = 0; i < consts.LIMITS.possible_answers_max_search; i++) {
                input.possible_answers[i] =
                {
                    answer: i + ' option',
                    answer_ref: utils.generateUniqID()
                }
            }

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.true;
        });

    });

    describe('Test form-validation.isValidInput() -> invalid inputs', function () {

        /**************************************************************************
         * General
         */
        it('should catch extra key', function () {

            var form_ref = '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57';
            var is_branch = false;
            var is_group = false;

            var input = {
                alex: 8,
                max: 9,
                min: 1,
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d3877ea1a89',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5',
                is_title: true,
                question: 'Number',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch missing key', function () {

            var form_ref = '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: 9,
                min: 1,
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d3877ea1a89',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                default: '5',
                is_title: true,
                question: 'Number',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        /**************************************************************************/

        /**************************************************************************
         * Input properties
         */

        //min and max
        it('should catch wrong max for integer input', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: 'xxx',
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;


        });

        it('should catch wrong max for integer input', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: true,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

        });

        it('should catch wrong max for integer input', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            input.max = true;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

        });

        it('should catch wrong max for integer input', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            input.max = [];
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch wrong max for integer input', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            input.max = {};
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch wrong max for integer input', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            input.max = function () {
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch wrong max for integer input', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            input.max = 5;
            input.min = true;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch wrong max for integer input', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                min: [],
                max: 0,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                min: [],
                max: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false

            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                min: {},
                max: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false

            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                min: function () {
                },
                max: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false

            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                min: function () {
                },
                max: 9,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false

            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                min: 7,
                max: -4,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false

            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                min: '7',
                max: '4',
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false

            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                min: 7.4,
                max: 4.5,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'integer',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false

            }, is_branch, is_group)).to.be.false;

        });

        it('should catch wrong min or max decimal input', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: 'xxx',
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            //decimal go through
            expect(import_form_validation.isValidInput(form_ref, {
                max: 7.8,
                min: 4.2,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.true;


            expect(import_form_validation.isValidInput(form_ref, {
                max: true,
                min: 4.2,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: [],
                min: 4.2,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: {},
                min: 4.2,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;


            expect(import_form_validation.isValidInput(form_ref, {
                max: function () {
                },
                min: 4.2,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: 7.8,
                min: true,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;


            expect(import_form_validation.isValidInput(form_ref, {
                max: 7.8,
                min: [],
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;


            expect(import_form_validation.isValidInput(form_ref, {
                max: 7.8,
                min: {},
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: 7.8,
                min: function () {
                },
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: 7.8,
                min: 9.11111,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: -4.4,
                min: 7.00986,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'decimal',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: true,
                question: 'Type an integer',
                uniqueness: 'none',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;
        });

        //ref
        //todo improve validation on this one
        it('should catch wrong input ref', function () {
            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: 'b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685',
                type: 'phone',
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


            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.ref = true;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.ref = null;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.ref = '';
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.ref = 'bb12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c283cbf685';
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.ref = 'b12dde9751446d39695f54e13708d53#5a1c1556e2aba_5a1c283cbf685';
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        //type
        it('should catch invalid input type', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'awesome',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'How are you?',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch group in group', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = true;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [{
                    max: null,
                    min: null,
                    ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                    type: 'text',
                    group: [],
                    jumps: [],
                    regex: null,
                    branch: [],
                    verify: true,
                    default: 'Mirko',
                    is_title: true,
                    question: 'Group in group',
                    uniqueness: 'form',
                    is_required: true,
                    datetime_format: null,
                    possible_answers: [],
                    set_to_current_datetime: false
                }],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'test',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch invalid group', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: 'xxx',
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'test',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.group = null;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.group = true;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.group = {};
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.group = function () {
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        //jumps are tested separately
        //...

        //regex
        it('should catch invalid regex', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: true,
                branch: [],
                verify: false,
                default: '',
                is_title: false,
                question: 'Name?',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: [],
                branch: [],
                verify: false,
                default: '',
                is_title: false,
                question: 'Name?',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: new Array(consts.LIMITS.regex_length + 2).join('x'),
                branch: [],
                verify: false,
                default: '',
                is_title: false,
                question: 'Name?',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;
        });

        //branch
        it('should catch invalid branch', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: 'xxx',
                jumps: [],
                regex: null,
                branch: 'xxx',
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'test',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.branch = null;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.branch = true;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.branch = {};
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.branch = function () {
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch branch in branch', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = true;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [{
                    max: null,
                    min: null,
                    ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                    type: 'text',
                    group: [],
                    jumps: [],
                    regex: null,
                    branch: [],
                    verify: true,
                    default: 'Mirko',
                    is_title: true,
                    question: 'Branch in branch',
                    uniqueness: 'form',
                    is_required: true,
                    datetime_format: null,
                    possible_answers: [],
                    set_to_current_datetime: false
                }],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'test',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        //verify
        it('should catch invalid verify', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: null,
                default: '',
                is_title: false,
                question: 'Name?',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: [],
                default: '',
                is_title: false,
                question: 'Name?',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: 'wow',
                default: '',
                is_title: false,
                question: 'Name?',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;
        });

        //default
        it('should catch invalid default answer', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

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
                default: '5a1c2875bfo68a',
                is_title: false,
                question: 'fave color',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: 12345,
                is_title: false,
                question: 'fave color',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: (new Array(consts.LIMITS.default_answer_length + 2)).join('x'),
                is_title: false,
                question: 'fave color',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: [],
                is_title: false,
                question: 'fave color',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2869bf688',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: true,
                is_title: false,
                question: 'fave color',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;
        });

        //is_title
        it('should catch invalid is_title', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: [],
                question: 'Name?',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: 45,
                question: 'Name?',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: null,
                question: 'Name?',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: {},
                question: 'Name?',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: 'true',
                question: 'Name?',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;
        });

        //question
        it('should catch question too long', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [
                    {
                        to: 'END',
                        when: 'ALL',
                        answer_ref: null
                    }
                ],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: new Array(consts.LIMITS.question_length + 2).join('a'),
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            console.log(input.question);

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        //question
        it('should catch readme too long', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'readme',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: new Array(consts.LIMITS.readme_length + 2).join('a'),
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch empty question', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [
                    {
                        to: 'END',
                        when: 'ALL',
                        answer_ref: null
                    }
                ],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: '',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        //uniqueness
        it('should catch invalid uniqueness', function () {

            var form_ref = '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: -0.98,
                min: 76.5,
                ref: '54ad0b84e5d94acc814cdc0844cdccc3_58d3877938d57_58d3877ea1a89',
                type: 'xxxxxxx',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: '5.5',
                is_title: true,
                question: 'Decimal',
                uniqueness: 'cvbn',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.uniqueness = true;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.uniqueness = '';
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.uniqueness = null;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.uniqueness = {};
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.uniqueness = [];
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            input.uniqueness = input;
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        //is_required
        it('should catch invalid is_required', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'Name?',
                uniqueness: 'form',
                is_required: null, //cannot be null
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'location',//cannot be required
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'Name?',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'photo',//cannot be required
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'Name?',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'photo',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'Name?',
                uniqueness: 'form',
                is_required: 1234,//integer
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'photo',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: 'Name?',
                uniqueness: 'form',
                is_required: '1234',//string
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            }, is_branch, is_group)).to.be.false;
        });

        //datetime_format
        it('should catch invalid date format', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c2852bf686',
                type: 'date',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: false,
                question: 'Date',
                uniqueness: 'none',
                is_required: false,
                datetime_format: 'YYYYY\/MM\/dd',
                possible_answers: [],
                set_to_current_datetime: true
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch invalid time format', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c285bbf687',
                type: 'time',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: false,
                default: null,
                is_title: false,
                question: 'Time',
                uniqueness: 'form',
                is_required: false,
                datetime_format: 'HH|mm',
                possible_answers: [],
                set_to_current_datetime: false
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        //possible_answer are tested separately, these are extra tests
        it('should catch too many possible answers', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

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
                default: '',
                is_title: false,
                question: 'fave color',
                uniqueness: 'none',
                is_required: false,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: false
            };

            for (var i = 0; i < consts.LIMITS.possible_answers_max + 1; i++) {
                input.possible_answers.push({
                    answer: 'option ' + i,
                    answer_ref: utils.generateUniqID()
                });
            }

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        //set_to_current_datetime
        it('should catch invalid set_to_current_datetime', function () {

            var form_ref = '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba';
            var is_branch = false;
            var is_group = false;

            var input = {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'text',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: '',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: true //type is text
            };
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'date',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: '',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: null//cannot be null
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'date',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: '',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: 'null'//cannot be string
            }, is_branch, is_group)).to.be.false;

            expect(import_form_validation.isValidInput(form_ref, {
                max: null,
                min: null,
                ref: '8b12dde9751446d39695f54e13708d53_5a1c1556e2aba_5a1c155cb7a1d',
                type: 'date',
                group: [],
                jumps: [],
                regex: null,
                branch: [],
                verify: true,
                default: 'Mirko',
                is_title: true,
                question: '',
                uniqueness: 'form',
                is_required: true,
                datetime_format: null,
                possible_answers: [],
                set_to_current_datetime: 123//cannot be int
            }, is_branch, is_group)).to.be.false;
        });


        it('should be invalid jump extra property', function () {

            var form_ref = '2e5eae576b864b20843b2b8c492099d8_59143b433ed7e';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '2e5eae576b864b20843b2b8c492099d8_59143b433ed7e_5948ec8708177',
                type: 'radio',
                question: '114. आपले सरकार पोर्टल बघता का? ',
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
                        answer: 'होय ',
                        answer_ref: '5948ec4708175'
                    },
                    {
                        answer: 'नाही ', answer_rer: '5948ec7408176'
                    }
                ],
                jumps: [{
                    to: '2e5eae576b864b20843b2b8c492099d8_59143b433ed7e_594383efaf540',
                    when: 'IS',
                    answer_ref: '5948ec4708175',
                    has_valid_destination: false
                }],
                branch: [],
                group: []
            };

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch invalid input searchsingle', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'searchsingle',
                question: 'Search single',
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
                possible_answers: [],
                jumps: [],
                branch: [],
                group: []
            };

            //build possible answers to the limit
            for (var i = 0; i < consts.LIMITS.possible_answers_max_search + 3; i++) {
                input.possible_answers[i] =
                {
                    answer: i + ' option',
                    answer_ref: utils.generateUniqID()
                }
            }

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch invalid input searchmultiple', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'searchmultiple',
                question: 'Search multiple',
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
                possible_answers: [],
                jumps: [],
                branch: [],
                group: []
            };

            //build possible answers to the limit
            for (var i = 0; i < consts.LIMITS.possible_answers_max_search + 7; i++) {
                input.possible_answers[i] =
                {
                    answer: i + ' option',
                    answer_ref: utils.generateUniqID()
                }
            }

            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch duplicated answer_ref radio', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'radio',
                question: 'Radio',
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
                possible_answers: [],
                jumps: [],
                branch: [],
                group: []
            };

            input.possible_answers = [
                {
                    answer: '1',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '2',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '3',
                    answer_ref: '5a18590f17197'
                }
            ];
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch duplicated answer_ref dropdown', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'dropdown',
                question: 'Dropdown',
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
                possible_answers: [],
                jumps: [],
                branch: [],
                group: []
            };

            input.possible_answers = [
                {
                    answer: '1',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '2',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '3',
                    answer_ref: '5a18590f17197'
                }
            ];
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch duplicated answer_ref checkbox', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'dropdown',
                question: 'Dropdown',
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
                possible_answers: [],
                jumps: [],
                branch: [],
                group: []
            };

            input.possible_answers = [
                {
                    answer: '1',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '2',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '3',
                    answer_ref: '5a18590f17197'
                }
            ];
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch duplicated answer_ref searchsingle', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'searchsingle',
                question: 'Search single',
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
                possible_answers: [],
                jumps: [],
                branch: [],
                group: []
            };

            input.possible_answers = [
                {
                    answer: '1',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '2',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '3',
                    answer_ref: '5a18590f17197'
                }
            ];
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        it('should catch duplicated answer_ref searchmultiple', function () {

            var form_ref = '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd';
            var is_branch = false;
            var is_group = false;

            var input = {
                ref: '9e37766df6664e909f74a8e1a37251ed_5891fb5fb20fd_589202653055b',
                type: 'searchmultiple',
                question: 'Search multiple',
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
                possible_answers: [],
                jumps: [],
                branch: [],
                group: []
            };

            input.possible_answers = [
                {
                    answer: '1',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '2',
                    answer_ref: '5a18590517195'
                },
                {
                    answer: '3',
                    answer_ref: '5a18590f17197'
                }
            ];
            expect(import_form_validation.isValidInput(form_ref, input, is_branch, is_group)).to.be.false;
        });

        /**************************************************************************/

    });
};

module.export = isValidInput();


