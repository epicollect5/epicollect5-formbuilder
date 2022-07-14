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

var wordCharsCleaning = function () {

    var project = 'project-word-chars';
    var structure;

    describe('Test  valid doCleaningBeforeSaving for Word chars', function () {
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

        it('should be valid', function () {

            var forms = structure.data.project.forms;
            expect(save.doCleaningBeforeSaving(forms).all_jumps_valid).to.be.true;
            expect(save.doCleaningBeforeSaving(forms).invalid_jumps_question).to.equal('');


        });

        it('should remove all Word Unicode chars', function () {

            var forms = structure.data.project.forms;
            var inputs = forms[0].inputs;

            //clean all up
            save.doCleaningBeforeSaving(forms);

            $(inputs).each(function (inputIndex, input) {

                expect(inputs[0].question).to.not.have.string('\u2018');
                expect(inputs[0].question).to.not.have.string('\u2019');
                expect(inputs[0].question).to.not.have.string('\u201A');
                expect(inputs[0].question).to.not.have.string('\uFFFD');

                if (input.type === consts.BRANCH_TYPE) {
                    expect(input.branch[0].question).to.not.have.string('\u201C');
                    expect(input.branch[0].question).to.not.have.string('\u201D');
                    expect(input.branch[0].question).to.not.have.string('\u201E');

                    //branch[1] is a nested group
                    expect(input.branch[1].group[0].question).to.not.have.string('\u2026');
                    expect(input.branch[1].group[0].question).to.not.have.string('\u2039');
                    expect(input.branch[1].group[0].question).to.not.have.string('\u203A');
                    expect(input.branch[1].group[0].question).to.not.have.string('\u02DC');
                    expect(input.branch[1].group[0].question).to.not.have.string('\u00A0');

                }

                if (input.type === consts.GROUP_TYPE) {
                    expect(input.group[0].question).to.not.have.string('\u2026');
                    expect(input.group[0].question).to.not.have.string('\u2013');
                    expect(input.group[0].question).to.not.have.string('\u2014');
                }
            });
        });
    });
};

module.exports = wordCharsCleaning();



