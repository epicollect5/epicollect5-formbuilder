/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
//var chaiAsPromised = require('chai-as-promised');

var expect = chai.expect;
var extend_natives = require('config/extend-natives');
//var module_a = require('module-a');
var createInputToolHTML = require('template/methods/createInputToolHTML');
var utils = require('helpers/utils');
var consts = require('config/consts');
var validation = require('actions/validation');

var hasValidFormStructure = require('hasValidFormStructure.test');
var areJumpsValid = require('areJumpsValid.test');
var hasSameProps = require('hasSameProps.test');
var areJumpsDestinationsValid = require('areJumpsDestinationsValid.test');
var getJumpAvailableDestinationsAsKeys = require('getJumpAvailableDestinationsAsKeys.test');
var arePossibleAnswersValid = require('arePossibleAnswersValid.test');
var isValidInput = require('isValidInput.test');
var isValidCopiedInput = require('isValidCopiedInput.test');
var doCleaningBeforeSaving = require('doCleaningBeforeSaving.test');
var getInputPropertiesPanelHTML = require('getInputPropertiesPanelHTML.test');
var exportPossibleAnswersCSV = require('exportPossibleAnswersCSV.test');
var deletePossibleAnswers = require('deletePossibleAnswers.test');
var importPossibleAnswers = require('importPossibleAnswers.test');
var replaceWordChars = require('replaceWordChars.test');
var wordCharsCleaning = require('wordCharsCleaning.test');
var paginationPossibleAnswers = require('paginationPossibleAnswers.test');
var projectWithSearchInputs = require('projectWithSearchInputs.test');
var projectWithInputs = require('projectWithInputs.test');

var assert = chai.assert;
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

describe('Test project definition', function () {
    //var foo = false;
    var structure = {};
    var project_keys = ['name', 'small_description', 'access', 'slug', 'ref', 'status', 'visibility', 'logo_url', 'forms'];


    //get dependencies/resolve promises need for all the it() tests
    //IMPORTANT: do not use `done` in it(), otherwise it will be waiting for a promise to resolve
    before(function (done) {
        console.log('Getting data...');
        return getProjectStructure('project').then(function (response) {
            structure = response;
            done();
        }, function () {
            console.log('parsing failed');
            structure = null;
            done();
        });
    });

    it('Project should be valid json', function () {
        assert.notEqual(structure, null, 'error parsing json: ' + parsing_error);
    });

    it('Project object should not be empty', function () {
        assert.equal(!$.isEmptyObject(structure), true, 'data is empty!!');
    });

    it('Project must have "data" property', function () {
        assert.property(structure, 'data', 'data property is missing!');
    });

    it('Project must have "project" property', function () {
        assert.property(structure.data, 'project', 'project property is missing!');
    });

    it('Project data.type must be "project"', function () {
        assert.propertyVal(structure.data, 'type', 'project');
    });

    it('Project data.project must have only allowed keys', function () {

        var has_missing_key = false;
        var missing_key = '';
        var has_extra_key = false;
        var extra_key = '';

        //missing property?
        project_keys.forEach(function (key) {
            if (!structure.data.project.hasOwnProperty(key)) {
                has_missing_key = true;
                missing_key = key;
            }
        });

        //extra property
        for (var property in structure.data.project) {
            if (project_keys.indexOf(property) === -1) {
                has_extra_key = true;
            }
        }

        assert.equal(has_missing_key, false, '"data.project" ' + missing_key + ' key missing');
        assert.equal(has_extra_key, false, '"data.project" extra key ' + extra_key + ' found');

    });

    it('Project data.project must be an object with ' + project_keys.length + ' properties', function () {
        assert.equal(Object.keys(structure.data.project).length, project_keys.length, 'data.project total of keys not correct');

    });

    it('Project data.project.forms must have at least 1 element', function () {
        assert.equal(structure.data.project.forms.length > 0, true, 'forms length cannot be 0');
    });

    it('Form refs must have project ref prepended', function () {

        var forms = structure.data.project.forms;
        var project_ref = structure.data.project.ref;

        $(forms).each(function (index, form) {
            var form_ref_parts = form.ref.split('_');
            expect(form_ref_parts[0]).to.be.equal(project_ref, 'form ref does not comply with project ref');
        });

    });

    after(function () {
        console.log('Logging data');
        console.log(structure);
    });
});
