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
    var project_name = 'project-search';

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

function _getSearchInput(parentRef) {

    var types = [consts.SEARCH_SINGLE_TYPE, consts.SEARCH_MULTIPLE_TYPE];

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
        question: 'Pick a name',
        uniqueness: 'none',
        is_required: false,
        datetime_format: null,
        possible_answers: [{
            answer: "I am a placeholder answer",
            answer_ref: utils.generateUniqID()
        }],
        set_to_current_datetime: false
    };

}

var projectWithSearchInputs = function () {

    describe('Validate project with search inputs', function () {

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

        it('1 form, first level search inputs', function () {

            var form_ref = project.forms[0].ref;
            //todo
            expect(project.forms[0].inputs.length).to.equal(0);

            //add 1 search input and test validation
            project.forms[0].inputs[0] = _getSearchInput(form_ref);
            expect(project.forms[0].inputs.length).to.equal(1);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            //add 1 search input and test validation
            project.forms[0].inputs[1] = _getSearchInput(form_ref);
            expect(project.forms[0].inputs.length).to.equal(2);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            //add 1 search input and test validation
            project.forms[0].inputs[2] = _getSearchInput(form_ref);
            expect(project.forms[0].inputs.length).to.equal(3);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            //add 1 search input and test validation
            project.forms[0].inputs[3] = _getSearchInput(form_ref);
            expect(project.forms[0].inputs.length).to.equal(4);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            //add 1 search input and test validation
            project.forms[0].inputs[4] = _getSearchInput(form_ref);
            expect(project.forms[0].inputs.length).to.equal(5);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            // //add 1 search input and test validation
            project.forms[0].inputs[5] = _getSearchInput(form_ref);
            expect(project.forms[0].inputs.length).to.equal(6);
            expect(utils.getSearchInputsTotal()).to.be.above(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.false;


        });

        it('More forms, first level search inputs', function () {

            var form_ref = project.forms[0].ref;

            expect(project.forms[0].inputs.length).to.equal(0);

            //add 1 search input and test validation
            project.forms[0].inputs[0] = _getSearchInput(form_ref);
            expect(project.forms[0].inputs.length).to.equal(1);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            //add 1 form with 1 search input
            project.forms[1] = _getForm(project.ref, 1);
            project.forms[1].inputs[0] = _getSearchInput(form_ref);
            expect(project.forms[1].inputs.length).to.equal(1);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[1].inputs).is_valid).to.be.true;

            //add 1 form with 1 search input
            project.forms[2] = _getForm(project.ref, 2);
            project.forms[2].inputs[0] = _getSearchInput(form_ref);
            expect(project.forms[2].inputs.length).to.equal(1);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[2].inputs).is_valid).to.be.true;

            //add 1 form with 1 search input
            project.forms[3] = _getForm(project.ref, 3);
            project.forms[3].inputs[0] = _getSearchInput(form_ref);
            expect(project.forms[3].inputs.length).to.equal(1);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[3].inputs).is_valid).to.be.true;

            //add 1 form with 1 search input
            project.forms[4] = _getForm(project.ref, 4);
            project.forms[4].inputs[0] = _getSearchInput(form_ref);
            expect(project.forms[4].inputs.length).to.equal(1);
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[4].inputs).is_valid).to.be.true;

            //add 1 search input to last form -> do not pass
            project.forms[4].inputs[1] = _getSearchInput(form_ref);
            expect(project.forms[4].inputs.length).to.equal(2);
            expect(utils.getSearchInputsTotal()).to.be.above(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[4].inputs).is_valid).to.be.false;

        });

        it('1 form, branch level search inputs', function () {

            var form_ref = project.forms[0].ref;
            var input_ref;

            expect(project.forms[0].inputs.length).to.equal(0);

            //add 1 search input
            project.forms[0].inputs[0] = _getSearchInput(form_ref);
            //override type
            project.forms[0].inputs[0].type = consts.BRANCH_TYPE;
            //override question
            project.forms[0].inputs[0].question = 'A branch with search inputs';
            input_ref = project.forms[0].inputs[0].ref;

            //add search inputs to branch
            for (var i = 0; i < consts.LIMITS.search_inputs_max; i++) {
                project.forms[0].inputs[0].branch[i] = _getSearchInput(input_ref)
            }
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            //add extra input to make it fail
            project.forms[0].inputs[0].branch[project.forms[0].inputs[0].branch.length] = _getSearchInput(input_ref);
            expect(utils.getSearchInputsTotal()).to.be.above(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.false;
        });

        it('1 form, group level search inputs', function () {

            var form_ref = project.forms[0].ref;
            var input_ref;

            expect(project.forms[0].inputs.length).to.equal(0);

            //add 1 search input
            project.forms[0].inputs[0] = _getSearchInput(form_ref);
            //override type
            project.forms[0].inputs[0].type = consts.GROUP_TYPE;
            //override question
            project.forms[0].inputs[0].question = 'A group with search inputs';
            input_ref = project.forms[0].inputs[0].ref;

            //add search inputs to group
            for (var i = 0; i < consts.LIMITS.search_inputs_max; i++) {
                project.forms[0].inputs[0].group[i] = _getSearchInput(input_ref)
            }
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            //add extra input to make it fail
            project.forms[0].inputs[0].group[project.forms[0].inputs[0].group.length] = _getSearchInput(input_ref);
            expect(utils.getSearchInputsTotal()).to.be.above(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.false;
        });

        it('1 form, nested group with search inputs', function () {

            var form_ref = project.forms[0].ref;
            var input_ref;
            var branch_ref;

            expect(project.forms[0].inputs.length).to.equal(0);

            //add 1 search input
            project.forms[0].inputs[0] = _getSearchInput(form_ref);
            //override type
            project.forms[0].inputs[0].type = consts.BRANCH_TYPE;
            //override question
            project.forms[0].inputs[0].question = 'A branch with search inputs';
            input_ref = project.forms[0].inputs[0].ref;

            // add group input to branch
            project.forms[0].inputs[0].branch[0] = _getSearchInput(input_ref);
            //override type
            project.forms[0].inputs[0].branch[0].type = consts.GROUP_TYPE;
            branch_ref = project.forms[0].inputs[0].branch[0].ref;

            //add search inputs to branch
            for (var i = 0; i < consts.LIMITS.search_inputs_max; i++) {
                project.forms[0].inputs[0].branch[0].group[i] = _getSearchInput(branch_ref)
            }

            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.true;

            //add extra input to make it fail
            project.forms[0].inputs[0].branch[0].group[project.forms[0].inputs[0].branch[0].group.length] = _getSearchInput(branch_ref);
            expect(utils.getSearchInputsTotal()).to.be.above(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[0].inputs).is_valid).to.be.false;
        });

        it('More forms, 1 branch each with 1 search input', function () {

            var form_ref = project.forms[0].ref;
            var max_number_child_forms = consts.MAX_NUMBER_OF_NESTED_CHILD_FORMS;
            var input_ref;
            var branch_ref;

            expect(project.forms[0].inputs.length).to.equal(0);

            //add 5 forms with 1 branch each having a single search input
            for (var i = 0; i < max_number_child_forms; i++) {
                project.forms[i] = _getForm(project.ref, i);
                project.forms[i].inputs[0] = _getSearchInput(form_ref);
                //override type
                project.forms[i].inputs[0].type = consts.BRANCH_TYPE;

                input_ref = project.forms[i].inputs[0].ref;
                project.forms[i].inputs[0].branch[0] = _getSearchInput(input_ref)

            }
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            $(project.forms).each(function (formIndex, form) {
                expect(validation.validateBeforeSaving(form_ref, form.inputs).is_valid).to.be.true;
            });

            input_ref = project.forms[max_number_child_forms - 1].inputs[0].ref;
            project.forms[max_number_child_forms - 1].inputs[0].branch[1] = _getSearchInput(input_ref);
            expect(utils.getSearchInputsTotal()).to.be.above(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[max_number_child_forms - 1].inputs).is_valid).to.be.false;
        });

        it('More forms, 1 group each with 1 search input', function () {

            var form_ref = project.forms[0].ref;
            var max_number_child_forms = consts.MAX_NUMBER_OF_NESTED_CHILD_FORMS;
            var input_ref;
            var branch_ref;

            expect(project.forms[0].inputs.length).to.equal(0);

            //add 5 forms with 1 branch each having a single search input
            for (var i = 0; i < max_number_child_forms; i++) {
                project.forms[i] = _getForm(project.ref, i);
                project.forms[i].inputs[0] = _getSearchInput(form_ref);
                //override type
                project.forms[i].inputs[0].type = consts.GROUP_TYPE;

                input_ref = project.forms[i].inputs[0].ref;
                project.forms[i].inputs[0].group[0] = _getSearchInput(input_ref)

            }
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            $(project.forms).each(function (formIndex, form) {
                expect(validation.validateBeforeSaving(form_ref, form.inputs).is_valid).to.be.true;
            });

            input_ref = project.forms[max_number_child_forms - 1].inputs[0].ref;
            project.forms[max_number_child_forms - 1].inputs[0].group[1] = _getSearchInput(input_ref);
            expect(utils.getSearchInputsTotal()).to.be.above(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[max_number_child_forms - 1].inputs).is_valid).to.be.false;
        });

        it('More forms, 1 branch each with 1 group input with 1 search input', function () {

            var form_ref = project.forms[0].ref;
            var max_number_child_forms = consts.MAX_NUMBER_OF_NESTED_CHILD_FORMS;
            var input_ref;
            var group_ref;

            expect(project.forms[0].inputs.length).to.equal(0);

            //add 5 forms with 1 branch each having group with  a single search input
            for (var i = 0; i < max_number_child_forms; i++) {
                project.forms[i] = _getForm(project.ref, i);
                project.forms[i].inputs[0] = _getSearchInput(form_ref);
                //override type to branch
                project.forms[i].inputs[0].type = consts.BRANCH_TYPE;

                input_ref = project.forms[i].inputs[0].ref;
                project.forms[i].inputs[0].branch[0] = _getSearchInput(input_ref);

                group_ref = project.forms[i].inputs[0].branch[0].ref;
                //override type to group
                project.forms[i].inputs[0].branch[0].type = consts.GROUP_TYPE;
                project.forms[i].inputs[0].branch[0].group[0] = _getSearchInput(group_ref);

            }
            expect(utils.getSearchInputsTotal()).to.be.at.most(consts.LIMITS.search_inputs_max);
            $(project.forms).each(function (formIndex, form) {
                expect(validation.validateBeforeSaving(form_ref, form.inputs).is_valid).to.be.true;
            });

            input_ref = project.forms[max_number_child_forms - 1].inputs[0].ref;
            project.forms[max_number_child_forms - 1].inputs[0].branch[1] = _getSearchInput(input_ref);
            group_ref = project.forms[max_number_child_forms - 1].inputs[0].branch[1].ref;
            project.forms[max_number_child_forms - 1].inputs[0].branch[1].type = consts.GROUP_TYPE;
            project.forms[max_number_child_forms - 1].inputs[0].branch[1].group[0] = _getSearchInput(group_ref);

            expect(utils.getSearchInputsTotal()).to.be.above(consts.LIMITS.search_inputs_max);
            expect(validation.validateBeforeSaving(form_ref, project.forms[max_number_child_forms - 1].inputs).is_valid).to.be.false;

            console.clear();
            console.log(JSON.stringify(project.forms));
        });
    });
};

module.exports = projectWithSearchInputs();


