/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var import_form_validation = require('helpers/import-form-validation');
var consts = require('config/consts');
var utils = require('helpers/utils');

var parsing_error;
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
            parsing_error = error;
            deferred.reject(error);
        }
    });

    return deferred.promise();
}


/**
 * Test for valid jumps within an input.
 *
 * The structure used is a strip down version of the input object
 * with only properties needed for the validation
 */
var areJumpsDestinationsValid = function () {

    var validStructure;
    var invalidStructure1;
    var invalidStructure2;
    var validJumpsProject = 'project-valid-jumps';
    var invalidJumpsProject1 = 'project-invalid-jumps-1';
    var invalidJumpsProject2 = 'project-invalid-jumps-2';

    describe('Test areJumpsDestinationsValid()', function () {

        //get dependencies/resolve promises need for all the it() tests
        //IMPORTANT: do not use `done` in it(), otherwise it will be waiting for a promise to resolve
        before(function (done) {
            console.log('Getting data...');
            return $.when(
                getProjectStructure(validJumpsProject),
                getProjectStructure(invalidJumpsProject1),
                getProjectStructure(invalidJumpsProject2)
                )
                .then(function (validResponse,
                                invalidResponse1,
                                invalidResponse2) {
                    console.log(validResponse);
                    validStructure = validResponse;
                    invalidStructure1 = invalidResponse1;
                    invalidStructure2 = invalidResponse2;
                    done();
                }, function () {
                    console.log('parsing failed');
                    validStructure = null;
                    invalidStructure1 = null;
                    done();
                });
        });

        it('Projects should be valid json', function () {
            expect(validStructure, 'error parsing json: ' + parsing_error).to.not.equal(null);
            expect(invalidStructure1, 'error parsing json: ' + parsing_error).to.not.equal(null);
            expect(invalidStructure2, 'error parsing json: ' + parsing_error).to.not.equal(null);
        });

        it('should have valid jumps destinations ("to" property)', function () {

            $(validStructure.data.project.forms).each(function (i, form) {
                expect(import_form_validation.areJumpsDestinationsValid(form.inputs)).to.be.true;
            });
        });

        it('1 - should fail as jumps destinations ("to" property) are wrong', function () {

            $(invalidStructure1.data.project.forms).each(function (i, form) {
                expect(import_form_validation.areJumpsDestinationsValid(form.inputs)).to.be.false;
            });
        });

        it('2 - should fail as jumps destinations ("to" property) are wrong', function () {

            $(invalidStructure2.data.project.forms).each(function (i, form) {
                expect(import_form_validation.areJumpsDestinationsValid(form.inputs)).to.be.false;
            });
        });
    });
};

module.export = areJumpsDestinationsValid();
