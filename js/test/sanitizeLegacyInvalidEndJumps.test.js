/* jshint expr: true */
'use strict';
var chai = require('chai');
var expect = chai.expect;
var import_form_validation = require('helpers/import-form-validation');
var consts = require('config/consts');

var sanitizeLegacyInvalidEndJumps = function () {

    describe('Test sanitizeLegacyInvalidEndJumps()', function () {

        it('should remove END jumps from the last form and branch inputs only', function () {

            var inputs = [
                {
                    ref: 'form_ref_question_1',
                    jumps: [
                        {
                            to: consts.JUMP_TO_END_OF_FORM_REF,
                            when: 'ALL',
                            answer_ref: null
                        }
                    ],
                    branch: []
                },
                {
                    ref: 'form_ref_question_2',
                    jumps: [
                        {
                            to: consts.JUMP_TO_END_OF_FORM_REF,
                            when: 'ALL',
                            answer_ref: null
                        }
                    ],
                    branch: [
                        {
                            ref: 'form_ref_question_2_branch_1',
                            jumps: [
                                {
                                    to: consts.JUMP_TO_END_OF_FORM_REF,
                                    when: 'ALL',
                                    answer_ref: null
                                }
                            ]
                        },
                        {
                            ref: 'form_ref_question_2_branch_2',
                            jumps: [
                                {
                                    to: consts.JUMP_TO_END_OF_FORM_REF,
                                    when: 'ALL',
                                    answer_ref: null
                                }
                            ]
                        }
                    ]
                }
            ];

            import_form_validation.sanitizeLegacyInvalidEndJumps(inputs);

            expect(inputs[0].jumps).to.have.length(1);
            expect(inputs[1].jumps).to.be.empty;
            expect(inputs[1].branch[0].jumps).to.have.length(1);
            expect(inputs[1].branch[1].jumps).to.be.empty;
        });
    });
};

module.export = sanitizeLegacyInvalidEndJumps();
