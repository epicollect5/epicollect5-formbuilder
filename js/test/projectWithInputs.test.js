/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var consts = require('config/consts');
var utils = require('helpers/utils');
var formbuilder = require('config/formbuilder');
var extend_natives = require('config/extend-natives');
var load_components = require('loaders/load-components');
var validation = require('actions/validation');

var loadProjectToTest = function () {

    var deferred = new $.Deferred();
    var project_name = 'project-inputs';

    //load container views for index.html (main entry point)
    $.when(
        $.ajax({
            url: 'json/' + project_name + '.json',
            type: 'GET',
            success: function (data) {
                formbuilder.project_definition = data;
            }
        })
    ).then(function () {
        deferred.resolve();
    });
    return deferred.promise();
};

function _getForm(projectRef, formIndex) {
    return {
        ref: projectRef + '_' + utils.generateUniqID(),
        name: 'Form ' + formIndex,
        slug: 'form-' + formIndex,
        type: 'hierarchy',
        inputs: []
    }
}

function _getInput(parentRef) {

    var types = [
        consts.TEXT_TYPE,
        consts.INTEGER_TYPE
    ];

    return {
        max: null,
        min: null,
        ref: utils.generateInputRef(parentRef),
        type: types[Math.floor(Math.random() * types.length)],
        group: [],
        jumps: [],
        regex: null,
        branch: [],
        verify: false,
        default: '',
        is_title: false,
        question: 'Name',
        uniqueness: 'none',
        is_required: false,
        datetime_format: null,
        possible_answers: [],
        set_to_current_datetime: false
    };

}

var projectWithInputs = function () {

    describe('Validate project within max number of questions', function () {

        var project;

        //IMPORTANT: do not use `done` in it(), otherwise it will be waiting for a promise to resolve
        before(function (done) {

            console.log('Getting data...');
            return $.when(
                loadProjectToTest()
            )
                .then(function (response) {
                    console.log(response);
                    $.when(
                        load_components(),
                        extend_natives()).then(function () {
                        console.log('done is called');
                        project = formbuilder.project_definition.data.project;
                        done();
                    });
                }, function () {
                    console.log('parsing failed');
                    done();
                });
        });

        beforeEach(function () {
            //reset all inputs to []
            $(project.forms).each(function (formIndex, form) {
                form.inputs = [];
            });
        });

        it('1 form, first level inputs only', function () {

            var form_ref = project.forms[0].ref;

            expect(project.forms[0].inputs.length).to.equal(0);

            //add max-1 inputs and test validation

            for(var i = 0; i < consts.INPUTS_MAX_ALLOWED; i++){
                project.forms[0].inputs[i] = _getInput(form_ref);
            }
            expect(project.forms[0].inputs.length).to.equal(consts.INPUTS_MAX_ALLOWED);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            //add one input to same form
            project.forms[0].inputs[consts.INPUTS_MAX_ALLOWED] = _getInput(form_ref);
            expect(project.forms[0].inputs.length).to.be.above(consts.INPUTS_MAX_ALLOWED);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.false;
        });
        it('Multiple forms, first level inputs only', function () {

            var form_ref = project.forms[0].ref;
            project.forms[1] = _getForm(project.ref, 1);
            project.forms[2] = _getForm(project.ref, 2);
            project.forms[3] = _getForm(project.ref, 3);
            project.forms[4] = _getForm(project.ref, 4);

            expect(project.forms[0].inputs.length).to.equal(0);
            expect(project.forms[1].inputs.length).to.equal(0);
            expect(project.forms[2].inputs.length).to.equal(0);
            expect(project.forms[3].inputs.length).to.equal(0);
            expect(project.forms[4].inputs.length).to.equal(0);

            //add max-1 inputs and test validation

            for(var i = 0; i < consts.INPUTS_MAX_ALLOWED; i++){
                project.forms[0].inputs[i] = _getInput(form_ref);
                project.forms[1].inputs[i] = _getInput(form_ref);
                project.forms[2].inputs[i] = _getInput(form_ref);
                project.forms[3].inputs[i] = _getInput(form_ref);
                project.forms[4].inputs[i] = _getInput(form_ref);
            }
            expect(project.forms[0].inputs.length).to.equal(consts.INPUTS_MAX_ALLOWED);
            expect(project.forms[1].inputs.length).to.equal(consts.INPUTS_MAX_ALLOWED);
            expect(project.forms[2].inputs.length).to.equal(consts.INPUTS_MAX_ALLOWED);
            expect(project.forms[3].inputs.length).to.equal(consts.INPUTS_MAX_ALLOWED);
            expect(project.forms[4].inputs.length).to.equal(consts.INPUTS_MAX_ALLOWED);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;
            expect(validation.validateBeforeSaving(form_ref, project.forms[1].inputs).is_valid).to.be.true;
            expect(validation.validateBeforeSaving(form_ref, project.forms[2].inputs).is_valid).to.be.true;
            expect(validation.validateBeforeSaving(form_ref, project.forms[3].inputs).is_valid).to.be.true;
            expect(validation.validateBeforeSaving(form_ref, project.forms[4].inputs).is_valid).to.be.true;

            //add one input to same form
            project.forms[0].inputs[consts.INPUTS_MAX_ALLOWED] = _getInput(form_ref);
            project.forms[1].inputs[consts.INPUTS_MAX_ALLOWED] = _getInput(form_ref);
            project.forms[2].inputs[consts.INPUTS_MAX_ALLOWED] = _getInput(form_ref);
            project.forms[3].inputs[consts.INPUTS_MAX_ALLOWED] = _getInput(form_ref);
            project.forms[4].inputs[consts.INPUTS_MAX_ALLOWED] = _getInput(form_ref);
            expect(project.forms[0].inputs.length).to.be.above(consts.INPUTS_MAX_ALLOWED);
            expect(project.forms[1].inputs.length).to.be.above(consts.INPUTS_MAX_ALLOWED);
            expect(project.forms[2].inputs.length).to.be.above(consts.INPUTS_MAX_ALLOWED);
            expect(project.forms[3].inputs.length).to.be.above(consts.INPUTS_MAX_ALLOWED);
            expect(project.forms[4].inputs.length).to.be.above(consts.INPUTS_MAX_ALLOWED);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.false;
            expect(validation.validateBeforeSaving(form_ref, project.forms[1].inputs).is_valid).to.be.false;
            expect(validation.validateBeforeSaving(form_ref, project.forms[2].inputs).is_valid).to.be.false;
            expect(validation.validateBeforeSaving(form_ref, project.forms[3].inputs).is_valid).to.be.false;
            expect(validation.validateBeforeSaving(form_ref, project.forms[4].inputs).is_valid).to.be.false;
        });

    });
};

module.exports = projectWithInputs();


