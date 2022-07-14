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
methods.getPossibleAnswersPage = require('template/methods/getPossibleAnswersPage');

var _buildMockMarkUp = function (formRef, inputRef) {

    //var forms = formbuilder.project_definition.data.project.forms;
    var input;
    var inputIndex;
    var mock_markup = '';

    formbuilder.current_form_ref = formRef;
    //set current input ref;
    formbuilder.current_input_ref = inputRef;

    //mock project definition (it is set by previous tests)
    formbuilder.current_form_index = 0;
    input = input_factory.createInput(consts.SEARCH_SINGLE_TYPE, formbuilder.current_input_ref);

    //add input to project definition
    formbuilder.project_definition.data.project
        .forms[formbuilder.current_form_index]
        .inputs.push(input);


    inputIndex = utils.getInputCurrentIndexByRef(formbuilder.current_input_ref);

    mock_markup += '<div id="' + formbuilder.current_form_ref + '-input-properties" class="input-properties" >';
    mock_markup += '<div class="panel-body wrapper-' + input.ref + '">';
    mock_markup += '<form data-input-ref="' + input.ref + '">';
    mock_markup += '<div class="input-properties__form__possible-answers">';
    mock_markup += '<div>';
    mock_markup += '<ul class="input-properties__form__possible-answers__list">';
    mock_markup += '</ul>';
    mock_markup += '</div>';
    mock_markup += '</div>';
    mock_markup += '<div>';
    mock_markup += ' <ul class="pager hidden possible-answers__list_pager">';
    mock_markup += '<li>';
    mock_markup += '<a class="possible-answers__list_pager__prev" href="#">';
    mock_markup += '<i class="fa fa-chevron-left"></i>';
    mock_markup += '</a>';
    mock_markup += '</li>';
    mock_markup += '<li>';
    mock_markup += '<div class="possible-answers__list_pager__current">1</div>';
    mock_markup += '/';
    mock_markup += '<div class="possible-answers__list_pager__total">1</div>';
    mock_markup += '</li>';
    mock_markup += '<li>';
    mock_markup += '<a class="possible-answers__list_pager__next" href="#">';
    mock_markup += '<i class="fa fa-chevron-right"></i>';
    mock_markup += '</a>';
    mock_markup += '</li>';
    mock_markup += '</ul>';
    mock_markup += '</div>';
    mock_markup += '</form>';
    mock_markup += '</div>';
    mock_markup += '</div>';

    $('body').append(mock_markup);

    //grab mock dom
    formbuilder.dom.input_properties_forms_wrapper = $('.wrapper-' + input.ref);
    formbuilder.dom.input_properties = $('#' + formbuilder.current_form_ref + '-input-properties.input-properties');

    //mock formbuilder properties
    formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex] = input;
    formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex].dom = {};

    return {
        input: input,
        inputIndex: inputIndex
    }
};

var _nukeMockMarkup = function (formRef) {
    $('body').find('#' + formRef + '-input-properties').remove();
};


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


var paginationPossibleAnswers = function () {

    describe('Test pagination possible answers', function () {

        //get dependencies/resolve promises need for all the it() tests
        //IMPORTANT: do not use `done` in it(), otherwise it will be waiting for a promise to resolve
        before(function (done) {

            console.log('Getting data...');
            return $.when(
                loadProjectToTest()
            )
                .then(function (response) {
                    $.when(
                        load_components(),
                        extend_natives()).then(function () {
                        console.log('done is called');
                        done();
                    });
                }, function () {
                    console.log('parsing failed');
                    done();
                });
        });

        it('should not show pagination as < 100', function (done) {

            var form_ref = utils.generateFormRef();
            var input_ref = utils.generateInputRef(form_ref);

            //build markup
            var fakeInput = _buildMockMarkUp(form_ref, input_ref);

            var possible_answers_pager = $('.possible-answers__list_pager');
            var list_items = formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li');
            var list_item = '';
            var list = '';
            var inputIndex = fakeInput.inputIndex;
            var input = fakeInput.input;

            //build 100 answers
            for (var i = 0; i < consts.LIMITS.possible_answers_per_page; i++) {
                formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex].possible_answers[i] = {
                    answer: i + ' Option',
                    answer_ref: utils.generateUniqID()
                }
            }

            //generate markup for first possible answers page
            $(formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[inputIndex].possible_answers).each(function (index, possible_answer) {

                if (index === consts.LIMITS.possible_answers_per_page) {
                    return false;
                }

                list_item = formbuilder.dom.partials.possible_answer_list_item;
                list_item = list_item.replace('{{answer-ref}}', possible_answer.answer_ref);
                list_item = list_item.replace('{{answer}}', possible_answer.answer);

                if (index === 0 && input.possible_answers.length === 1) {
                    list_item = list_item.replace('{{disabled}}', 'disabled');
                }
                else {
                    list_item = list_item.replace('{{disabled}}', '');
                }
                list += list_item;
            });

            var properties_panel = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + input.ref + '"]');

            var possible_answers_list = properties_panel
                .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');

            //empty current list and append new one to dom
            possible_answers_list.append(list);

            //max number of possible answers max be less the possible_answers_max
            expect(list_items.length).to.be.at.most(consts.LIMITS.possible_answers_per_page);

            $(list_items).each(function (index, item) {
                //check all the answers are not empty in dom
                expect($(item).find('input').val()).not.to.be.empty;

                //check all answers are less than possible_answer_max_lenght in dom
                expect($(item).find('input').val().length).to.be.at.most(consts.LIMITS.possible_answer_max_length);
            });

            //check pagination is hidden
            expect(possible_answers_pager).to.have.class('hidden');

            //clear dom from mocks
            _nukeMockMarkup(form_ref);

            // use done() to tell mocha-chai the test has been completed, as there is a timeout
            //due to animations
            //  see https://github.com/mochajs/mocha/issues/2190#issuecomment-206968778
            done();
        });

        it('should show pagination with 101 possible answers, set to 2/2', function (done) {

            var form_ref = utils.generateFormRef();
            var input_ref = utils.generateInputRef(form_ref);

            //build markup
            var fakeInput = _buildMockMarkUp(form_ref, input_ref);
            var possible_answers_pager = $('.possible-answers__list_pager');


            //build 100 answers
            for (var i = 0; i < consts.LIMITS.possible_answers_per_page; i++) {
                formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[fakeInput.inputIndex].possible_answers[i] = {
                    answer: i + ' Option',
                    answer_ref: utils.generateUniqID()
                }
            }

            //add answer (will be answer 101)
            fakeInput.input.addPossibleAnswer();

            window.setTimeout(function () {
                //check pagination is shown

                expect(possible_answers_pager).to.not.have.class('hidden');

                //check pagination values, should be 2/2
                expect(possible_answers_pager.find('possible-answers__list_pager__current').val() === '2');
                expect(possible_answers_pager.find('possible-answers__list_pager__total').val() === '2');

                //possible answers in dom should be only one
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li')).to.have.lengthOf(1);

                //clear dom from mocks
                _nukeMockMarkup(form_ref);
                // use done() to tell mocha-chai the test has been completed, as there is a timeout
                //due to animations
                //  see https://github.com/mochajs/mocha/issues/2190#issuecomment-206968778
                done();
            }, 300);
        });

        it('should hide pagination when all possible answers are removed', function (done) {

            var form_ref = utils.generateFormRef();
            var input_ref = utils.generateInputRef(form_ref);

            //build markup
            var fakeInput = _buildMockMarkUp(form_ref, input_ref);

            var possible_answers_pager = $('.possible-answers__list_pager');
            var list_items = formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li');

            formbuilder.is_editing_branch = false;
            formbuilder.is_editing_group = false;

            //remove all answers
            possible_answers.deleteAllAnswers();

            //check pagination is hidden (adding timeout as we have  delays due to animation)
            window.setTimeout(function () {

                list_items = formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li');

                expect(possible_answers_pager).to.have.class('hidden');

                //check the dom has only a single placeholder answer
                expect(list_items.length).to.equal(1);

                //check pagination values, should be 1/1 (but hidden)
                expect(possible_answers_pager.find('possible-answers__list_pager__current').val() === '1');
                expect(possible_answers_pager.find('possible-answers__list_pager__total').val() === '1');

                //clear dom from mocks

                _nukeMockMarkup(form_ref);

                //use done() to tell mocha-chai the test has been completed, as there is a timeout
                //see https://github.com/mochajs/mocha/issues/2190#issuecomment-206968778
                done();

            }, 300);
        });

        it('should show pagination as 300 possible answers, 3/3', function (done) {

            var form_ref = utils.generateFormRef();
            var input_ref = utils.generateInputRef(form_ref);

            //build markup
            var fakeInput = _buildMockMarkUp(form_ref, input_ref);

            var possible_answers_pager = $('.possible-answers__list_pager');
            var list_items = formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li');
            var list_item = '';
            var list = '';

            formbuilder.is_editing_branch = false;
            formbuilder.is_editing_group = false;

            //build 299 answers
            for (var i = 0; i < 299; i++) {
                formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[fakeInput.inputIndex].possible_answers[i] = {
                    answer: i + ' Option',
                    answer_ref: utils.generateUniqID()
                }
            }

            //generate markup for first possible answers page
            $(formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[fakeInput.inputIndex].possible_answers).each(function (index, possible_answer) {

                if (index === consts.LIMITS.possible_answers_per_page) {
                    return false;
                }

                list_item = formbuilder.dom.partials.possible_answer_list_item;
                list_item = list_item.replace('{{answer-ref}}', possible_answer.answer_ref);
                list_item = list_item.replace('{{answer}}', possible_answer.answer);

                if (index === 0 && fakeInput.input.possible_answers.length === 1) {
                    list_item = list_item.replace('{{disabled}}', 'disabled');
                }
                else {
                    list_item = list_item.replace('{{disabled}}', '');
                }
                list += list_item;
            });

            var properties_panel = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + fakeInput.input.ref + '"]');

            var possible_answers_list = properties_panel
                .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');

            //empty current list and append new one to dom
            possible_answers_list.append(list);

            //add answer (will be answer 300 ans initialise the pager)
            fakeInput.input.addPossibleAnswer();

            //check pagination is hidden (adding timeout as we have  delays due to animation)
            window.setTimeout(function () {

                //max number of possible answers max be less the possible_answers_max
                expect(list_items.length).to.be.at.most(consts.LIMITS.possible_answers_per_page);

                $(list_items).each(function (index, item) {
                    //check all the answers are not empty in dom
                    expect($(item).find('input').val()).not.to.be.empty;

                    //check all answers are less than possible_answer_max_lenght in dom
                    expect($(item).find('input').val().length).to.be.at.most(consts.LIMITS.possible_answer_max_length);
                });

                //check pagination is shown
                expect(possible_answers_pager).to.not.have.class('hidden');

                //check pagination values, should be 3/3
                expect(possible_answers_pager.find('possible-answers__list_pager__current').val() === '3');
                expect(possible_answers_pager.find('possible-answers__list_pager__total').val() === '3');

                //possible answers in dom should be 100
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li')).to.have.lengthOf(100);

                //clear dom from mocks
                _nukeMockMarkup(form_ref);

                //use done() to tell mocha-chai the test has been completed, as there is a timeout
                //see https://github.com/mochajs/mocha/issues/2190#issuecomment-206968778
                done();
            }, 300);
        });

        it('should navigate pages and update pagination', function (done) {

            var form_ref = utils.generateFormRef();
            var input_ref = utils.generateInputRef(form_ref);

            //build markup
            var fakeInput = _buildMockMarkUp(form_ref, input_ref);

            var possible_answers_pager = $('.possible-answers__list_pager');
            var list_items = formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li');
            var list_item = '';
            var list = '';

            formbuilder.is_editing_branch = false;
            formbuilder.is_editing_group = false;

            //build 300 answers
            for (var i = 0; i < 300; i++) {
                formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[fakeInput.inputIndex].possible_answers[i] = {
                    answer: i + ' Option',
                    answer_ref: utils.generateUniqID()
                }
            }

            //generate markup for first possible answers page
            $(formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[fakeInput.inputIndex].possible_answers).each(function (index, possible_answer) {

                if (index === consts.LIMITS.possible_answers_per_page) {
                    return false;
                }

                list_item = formbuilder.dom.partials.possible_answer_list_item;
                list_item = list_item.replace('{{answer-ref}}', possible_answer.answer_ref);
                list_item = list_item.replace('{{answer}}', possible_answer.answer);

                if (index === 0 && fakeInput.input.possible_answers.length === 1) {
                    list_item = list_item.replace('{{disabled}}', 'disabled');
                }
                else {
                    list_item = list_item.replace('{{disabled}}', '');
                }
                list += list_item;
            });

            var properties_panel = formbuilder.dom.input_properties_forms_wrapper
                .find('form[data-input-ref="' + fakeInput.input.ref + '"]');

            var possible_answers_list = properties_panel
                .find('.input-properties__form__possible-answers div ul.input-properties__form__possible-answers__list');

            //empty current list and append new one to dom
            possible_answers_list.append(list);

            //add answer (will be answer 301 and initialise the pager)
            fakeInput.input.addPossibleAnswer();

            //check pagination is hidden (adding timeout as we have  delays due to animation)
            window.setTimeout(function () {

                //check pagination is shown
                expect(possible_answers_pager).to.not.have.class('hidden');

                //check pagination values, should be 4/4
                expect(possible_answers_pager.find('possible-answers__list_pager__current').val() === '4');
                expect(possible_answers_pager.find('possible-answers__list_pager__total').val() === '4');

                //possible answers in dom should be 1
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li')).to.have.lengthOf(1);

                //go to previous page
                methods.getPossibleAnswersPage(fakeInput.input, 3);

                //possible answers in dom should be 100 now
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li')).to.have.lengthOf(100);

                //check pagination values, should be 3/4
                expect(possible_answers_pager.find('possible-answers__list_pager__current').val() === '3');
                expect(possible_answers_pager.find('possible-answers__list_pager__total').val() === '4');

                //go to last page
                methods.getPossibleAnswersPage(fakeInput.input, 4);

                //check pagination values, should be 4/4
                expect(possible_answers_pager.find('possible-answers__list_pager__current').val() === '4');
                expect(possible_answers_pager.find('possible-answers__list_pager__total').val() === '4');

                //possible answers in dom should be 1
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li')).to.have.lengthOf(1);

                    //clear dom from mocks
                    _nukeMockMarkup(form_ref);

                    //use done() to tell mocha-chai the test has been completed, as there is a timeout
                    //see https://github.com/mochajs/mocha/issues/2190#issuecomment-206968778
                    done();
            }, 200);
        });

        it('should hide pagination when deleting 1 answer from 101 to 100', function (done) {

            var form_ref = utils.generateFormRef();
            var input_ref = utils.generateInputRef(form_ref);

            //build markup
            var fakeInput = _buildMockMarkUp(form_ref, input_ref);
            var possible_answers_pager = $('.possible-answers__list_pager');


            //build 100 answers
            for (var i = 0; i < consts.LIMITS.possible_answers_per_page; i++) {
                formbuilder.project_definition.data.project.forms[formbuilder.current_form_index].inputs[fakeInput.inputIndex].possible_answers[i] = {
                    answer: i + ' Option',
                    answer_ref: utils.generateUniqID()
                }
            }

            //add answer (will be answer 101)
            fakeInput.input.addPossibleAnswer();

            window.setTimeout(function () {
                //check pagination is shown

                expect(possible_answers_pager).to.not.have.class('hidden');

                //check pagination values, should be 2/2
                expect(possible_answers_pager.find('possible-answers__list_pager__current').val() === '2');
                expect(possible_answers_pager.find('possible-answers__list_pager__total').val() === '2');

                //possible answers in dom should be only one
                expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li')).to.have.lengthOf(1);

                //delete one answer (the only one in dom, so index = 0)
                possible_answers.removePossibleAnswer(fakeInput.input, 0);

                window.setTimeout(function(){

                    expect(possible_answers_pager).to.have.class('hidden');

                    //check pagination values, should be 1/1 despite being hidden
                    expect(possible_answers_pager.find('possible-answers__list_pager__current').val() === '1');
                    expect(possible_answers_pager.find('possible-answers__list_pager__total').val() === '1');

                    //check dom, should have gone back to page 1 with 100 answers in dom
                    expect(formbuilder.dom.input_properties_forms_wrapper.find('.input-properties__form__possible-answers__list li')).to.have.lengthOf(100);

                    //clear dom from mocks
                    _nukeMockMarkup(form_ref);
                    // use done() to tell mocha-chai the test has been completed, as there is a timeout
                    //due to animations
                    //  see https://github.com/mochajs/mocha/issues/2190#issuecomment-206968778
                    done();

                }, 300);
            }, 300);
        });
    });
};

module.export = paginationPossibleAnswers();
