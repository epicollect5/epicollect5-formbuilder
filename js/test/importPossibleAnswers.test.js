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
var confirm_import_callback = require('ui-handlers/event-handler-callbacks/confirm-import-possible-answers-callback');

var formbuilder = require('config/formbuilder');
var input_factory = require('factory/input-factory');
var extend_natives = require('config/extend-natives');
var load_components = require('loaders/load-components');

var methods = {};

methods.replaceCommonAdvancedProperties = require('template/methods/replaceCommonAdvancedProperties');
methods.createInputToolHTML = require('template/methods/createInputToolHTML');
methods.prepareAdvancedInputPropertiesHTML = require('template/methods/prepareAdvancedInputPropertiesHTML');
methods.getJumpTabBtnHTML = require('template/methods/getJumpTabBtnHTML');
methods.getAdvancedTabBtnHTML = require('template/methods/getAdvancedTabBtnHTML');
methods.createBasicPropertiesHTML = require('template/methods/createBasicPropertiesHTML');
methods.getUniquenessHTML = require('template/methods/getUniquenessHTML');
methods.getPossibleAnswersHTML = require('template/methods/getPossibleAnswersHTML');
methods.getInputPropertiesPanelHTML = require('template/methods/getInputPropertiesPanelHTML');
methods.createInputPropertiesHTML = require('template/methods/createInputPropertiesHTML');
methods.getJumpsListHTML = require('template/methods/getJumpsListHTML');

var template = {

    replaceCommonAdvancedProperties: function (the_markup, the_input) {
        return methods.replaceCommonAdvancedProperties(the_markup, the_input);
    },
    createInputToolHTML: function (input) {
        return methods.createInputToolHTML(input);
    },
    prepareAdvancedInputPropertiesHTML: function (view, input) {
        return methods.prepareAdvancedInputPropertiesHTML(view, input);
    },
    getAdvancedTabBtnHTML: function (ref, is_active) {
        return methods.getAdvancedTabBtnHTML(ref, is_active);
    },
    getJumpTabBtnHTML: function (ref, is_active) {
        return methods.getJumpTabBtnHTML(ref, is_active);
    },
    createBasicPropertiesHTML: function (input) {
        return methods.createBasicPropertiesHTML(input);
    },
    getUniquenessHTML: function (input) {
        return methods.getUniquenessHTML(input);
    },
    getPossibleAnswersHTML: function (input) {
        return methods.getPossibleAnswersHTML(input);
    },
    getInputPropertiesPanelHTML: function (input) {
        return methods.getInputPropertiesPanelHTML(input);
    },
    createInputPropertiesHTML: function (input, view) {
        return methods.createInputPropertiesHTML(input, view);
    },
    getJumpsListHTML: function (input) {
        return methods.getJumpsListHTML(input);
    }
};

var loadProjectToTest = function () {

    var deferred = new $.Deferred();
    var project_name = 'ec5-test-cleaning';

    //load container views for index.html (main entry point)
    $.when(
        $.ajax({
            url: 'json/dom/' + project_name + '.json',
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

var params = {
    userWantstoReplaceAnswers: false,
    doesFirstRowContainsHeaders: true,
    input: null,
    importedJson: {
        data: [
            {
                'too long': 'mirko',
                passing: 'one',
                'no values': '',
                tags: '<script>'

            },
            {
                'too long': 'david',
                passing: 'two',
                'no values': '',
                tags: '1'
            },
            {
                'too long': 'corin',
                passing: 'three',
                'no values': '',
                tags: '2'
            },
            {
                'too long': 'Instruction: I will now ask you about your experience of seeking care in your usual health provider. I will ask about your level of experience about the',
                passing: '',
                'no values': '',
                tags: '3'
            }
        ],

        meta: {
            fields: [
                'too long',
                'passing',
                'no values',
                'tags'
            ]
        }
    },
    selectedHeaderIndex: null
};


var importPossibleAnswers = function () {

    describe('Test possible answer csv import', function () {

        var forms = [];

        //get dependencies/resolve promises need for all the it() tests
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
                        forms = formbuilder.project_definition.data.project.forms;

                        done();
                    });
                }, function () {
                    console.log('parsing failed');
                    done();
                });
        });

        it('should work for column 1 -> "passing", 1 item filtered as empty ', function () {

            //set current input ref;
            formbuilder.current_input_ref = '77ceaef2b5634ee3b20765d25e0047d1_5a252849399f6_5a2529efd8890';

            //mock project definition (it is set by previous tests)
            formbuilder.current_form_index = 0;
            var input = input_factory.createInput(consts.RADIO_TYPE, formbuilder.current_input_ref);
            var inputIndex = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);

            var mock_markup = '';
            mock_markup += '<div class="wrapper-' + input.ref + '">';
            mock_markup += '<form data-input-ref="' + input.ref + '">';
            mock_markup += '<div class="input-properties__form__possible-answers">';
            mock_markup += '<div>';
            mock_markup += '<ul class="input-properties__form__possible-answers__list">';
            mock_markup += '<li></li>';
            mock_markup += '<li></li>';
            mock_markup += '</ul>';
            mock_markup += '</div>';
            mock_markup += '</div>';
            mock_markup += '</form>';
            mock_markup += '</div>';

            $('body').append(mock_markup);

            formbuilder.dom.input_properties_forms_wrapper = $('.wrapper-' + input.ref);

            //mock formbuilder properties
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex] = input;
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex].dom = {};
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex].possible_answers = [
                {
                    answer: 'Male',
                    answer_ref: '5a2529efd8891'
                },
                {
                    answer: 'Female',
                    answer_ref: '5a2529f4d8892'
                }
            ];

            params.selectedHeaderIndex = 1;
            params.input = input;
            expect(confirm_import_callback(params)).to.be.true;

            if (params.userWantstoReplaceAnswers) {
                //answers get replaced, list length should match the imported csv
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li').length)
                    .to.equal(params.importedJson.data.length);
            }
            else {
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li').length)
                    .to.equal(5);
            }

            var list_items = formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li');


            //max number of possible answers max be less the possible_answers_max
            expect(list_items.length).to.be.at.most(consts.LIMITS.possible_answers_max);

            $(list_items).each(function (index, item) {
                //check all the answers are not empty in dom
                expect($(item).find('input').val()).not.to.be.empty;

                //check all answers are less than possible_answer_max_lenght in dom
                expect($(item).find('input').val().length).to.be.at.most(consts.LIMITS.possible_answer_max_length);
            });

            //clear dom from mocks
            formbuilder.dom.input_properties_forms_wrapper.remove();
        });

        it('should work for column 0 -> "too long", 1 item truncated as too long ', function () {

            //set current input ref;
            formbuilder.current_input_ref = '77ceaef2b5634ee3b20765d25e0047d1_5a252849399f6_5a2529efd8890';

            //mock project definition (it is set by previous tests)
            formbuilder.current_form_index = 0;
            var input = input_factory.createInput(consts.RADIO_TYPE, formbuilder.current_input_ref);
            var inputIndex = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);

            var mock_markup = '';
            mock_markup += '<div class="wrapper-' + input.ref + '">';
            mock_markup += '<form data-input-ref="' + input.ref + '">';
            mock_markup += '<div class="input-properties__form__possible-answers">';
            mock_markup += '<div>';
            mock_markup += '<ul class="input-properties__form__possible-answers__list">';
            mock_markup += '<li></li>';
            mock_markup += '<li></li>';
            mock_markup += '</ul>';
            mock_markup += '</div>';
            mock_markup += '</div>';
            mock_markup += '</form>';
            mock_markup += '</div>';

            $('body').append(mock_markup);

            formbuilder.dom.input_properties_forms_wrapper = $('.wrapper-' + input.ref);

            //mock formbuilder properties
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex] = input;
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex].dom = {};
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex].possible_answers = [
                {
                    answer: 'Male',
                    answer_ref: '5a2529efd8891'
                },
                {
                    answer: 'Female',
                    answer_ref: '5a2529f4d8892'
                }
            ];

            params.selectedHeaderIndex = 0;
            params.input = input;
            expect(confirm_import_callback(params)).to.be.true;

            if (params.userWantstoReplaceAnswers) {
                //answers get replaced, list length should match the imported csv
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li').length)
                    .to.equal(params.importedJson.data.length);
            }
            else {
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li').length)
                    .to.equal(6);
            }

            var list_items = formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li');


            //max number of possible answers max be less the possible_answers_max
            expect(list_items.length).to.be.at.most(consts.LIMITS.possible_answers_max);

            $(list_items).each(function (index, item) {
                //check all the answers are not empty in dom
                expect($(item).find('input').val()).not.to.be.empty;

                //check all answers are less than possible_answer_max_lenght in dom
                expect($(item).find('input').val().length).to.be.at.most(consts.LIMITS.possible_answer_max_length);
            });

            //clear dom from mocks
            formbuilder.dom.input_properties_forms_wrapper.remove();
        });

        it('should work for column 3 -> "tags", 1 item filtered from <> ', function () {

            //set current input ref;
            formbuilder.current_input_ref = '77ceaef2b5634ee3b20765d25e0047d1_5a252849399f6_5a2529efd8890';

            //mock project definition (it is set by previous tests)
            formbuilder.current_form_index = 0;
            var input = input_factory.createInput(consts.RADIO_TYPE, formbuilder.current_input_ref);
            var inputIndex = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);

            var mock_markup = '';
            mock_markup += '<div class="wrapper-' + input.ref + '">';
            mock_markup += '<form data-input-ref="' + input.ref + '">';
            mock_markup += '<div class="input-properties__form__possible-answers">';
            mock_markup += '<div>';
            mock_markup += '<ul class="input-properties__form__possible-answers__list">';
            mock_markup += '<li></li>';
            mock_markup += '<li></li>';
            mock_markup += '</ul>';
            mock_markup += '</div>';
            mock_markup += '</div>';
            mock_markup += '</form>';
            mock_markup += '</div>';

            $('body').append(mock_markup);

            formbuilder.dom.input_properties_forms_wrapper = $('.wrapper-' + input.ref);

            //mock formbuilder properties
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex] = input;
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex].dom = {};
            formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex].possible_answers = [
                {
                    answer: 'Male',
                    answer_ref: '5a2529efd8891'
                },
                {
                    answer: 'Female',
                    answer_ref: '5a2529f4d8892'
                }
            ];

            params.selectedHeaderIndex = 3;
            params.input = input;
            expect(confirm_import_callback(params)).to.be.true;

            if (params.userWantstoReplaceAnswers) {
                //answers get replaced, list length should match the imported csv
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li').length)
                    .to.equal(params.importedJson.data.length);
            }
            else {
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li').length)
                    .to.equal(5);
            }

            var list_items = formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li');


            //max number of possible answers max be less the possible_answers_max
            expect(list_items.length).to.be.at.most(consts.LIMITS.possible_answers_max);

            $(list_items).each(function (index, item) {
                //check all the answers are not empty in dom
                expect($(item).find('input').val()).not.to.be.empty;

                //check all answers are less than possible_answer_max_lenght in dom
                expect($(item).find('input').val().length).to.be.at.most(consts.LIMITS.possible_answer_max_length);
            });

            //clear dom from mocks
            formbuilder.dom.input_properties_forms_wrapper.remove();
        });
    });
};

module.export = importPossibleAnswers();
