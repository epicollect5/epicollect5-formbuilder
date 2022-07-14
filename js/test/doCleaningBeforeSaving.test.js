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

function getProjectStructure(name) {

    var deferred = new $.Deferred();

    $.ajax({
        url: 'json/' + name + '.json',
        type: 'GET',
        contentType: 'application/vnd.api+json',
        success: function (data) {
            deferred.resolve(data);
        },
        error: function (req, status, error) {
            console.log(error);
            deferred.reject(error);
        }
    });

    return deferred.promise();
}

var doCleaningBeforeSaving = function () {

    var project = 'project-cleaning-before-save';
    var structure;

    describe('Test  valid doCleaningBeforeSaving', function () {
        //get dependencies/resolve promises need for all the it() tests
        //IMPORTANT: do not use `done` in it(), otherwise it will be waiting for a promise to resolve
        before(function (done) {
            console.log('Getting data...');
            return $.when(
                getProjectStructure(project)
                )
                .then(function (response) {
                    console.log(response);
                    structure = response;
                    done();
                }, function () {
                    console.log('parsing failed');
                    done();
                });
        });

        it('should be valid structure', function () {

            var forms = [structure.data.form];
            expect(save.doCleaningBeforeSaving(forms).all_jumps_valid).to.be.true;
            expect(save.doCleaningBeforeSaving(forms).invalid_jumps_question).to.equal('');
        });


        it('should remove dom props', function () {

            var forms = [structure.data.form];

            //add dom prop to inputs
            $(structure.data.form.inputs).each(function (index, input) {
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
            $(structure.data.form.inputs).each(function (index, input) {
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
            $(structure.data.form.inputs).each(function (index, input) {
                expect(input).to.not.have.property('dom');
                if (input.type === consts.BRANCH_TYPE) {
                    $(input.branch).each(function (branchIndex, branchInput) {
                        expect(branchInput).to.not.have.property('dom');
                    });
                }
            });
        });

        it('should remove has_valid_destination prop from jumps', function () {

            var forms = [structure.data.form];

            //add has_valid_destination prop to input jumps
            $(structure.data.form.inputs).each(function (index, input) {

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
            $(structure.data.form.inputs).each(function (index, input) {

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
            $(structure.data.form.inputs).each(function (index, input) {

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



