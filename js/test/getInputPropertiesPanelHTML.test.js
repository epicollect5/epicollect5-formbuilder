/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
chai.use(require('chai-jquery'));
var expect = chai.expect;
var assert = chai.assert;
var import_form_validation = require('helpers/import-form-validation');
var consts = require('config/consts');
var utils = require('helpers/utils');
var getInputPropertiesPanelHTML = require('template/methods/getInputPropertiesPanelHTML');
var extend_natives = require('config/extend-natives');
var load_components = require('loaders/load-components');
var formbuilder = require('config/formbuilder');

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


var getInputPropertiesPanelHTMLTest = function () {

    function _testInputDom(formIndex, input, is_branch, is_group) {

        var properties_panel_html;
        var wrapper;

        //create properties panel in right sidebar for this input (common properties)
        properties_panel_html = template.getInputPropertiesPanelHTML(input);

        $('body').append('<div class="' + input.ref + '"></div>');
        wrapper = $('.' + input.ref);
        wrapper.append(properties_panel_html);

        //question
        if (input.type !== consts.README_TYPE) {
            expect(wrapper.find('.input-properties__form__question input').val())
                .to.equal(input.question);
        }
        else {
            //readme type needs to convert html entities to tags
            expect(wrapper.find('.input-properties__form__question textarea').val())
                .to.equal(utils.decodeHtml(input.question));
        }

        //is required?
        if (input.is_required) {
            expect(wrapper.find('.input-properties__form__required-flag label input')
                .is(':checked'))
                .to.be.true;
        }
        else {
            //for input allowing required flag, must be set to false
            if ($.inArray(input.type, consts.REQUIRED_ALLOWED_TYPES) > -1) {
                console.log(input.type, input.question);
                expect(wrapper.find('.input-properties__form__required-flag label input')
                    .is(':checked'))
                    .to.be.false;
            }
            else {
                //for all other inputs the dom must be undefined as it does not exist
                expect(wrapper.find('.input-properties__form__required-flag label input')
                    .attr('checked'))
                    .to.be.undefined;
            }
        }

        //title
        if (input.is_title) {
            expect(wrapper.find('.input-properties__form__title-flag label input')
                .is(':checked'))
                .to.be.true;
        }
        else {
            expect(wrapper.find('.input-properties__form__title-flag label input')
                .is(':checked'))
                .to.be.false;
        }

        //default answer input-properties__form__advanced-properties__default
        if (input.default !== null) {
            if (input.default === '') {
                expect(wrapper.find('.input-properties__form__advanced-properties__default input').val())
                    .to.be.empty;
            }
            else {
                //multiple answers type?
                if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) > -1) {
                    //default value must be one of the possible answers
                    expect(wrapper.find('.input-properties__form__advanced-properties__default select option:selected').val())
                        .to.equal(input.default);
                }
                else {
                    expect(wrapper.find('.input-properties__form__advanced-properties__default input').val())
                        .to.equal(input.default);
                }
            }
        }

        //regex
        if (input.regex !== null) {
            if (input.regex === '') {
                expect(wrapper.find('.input-properties__form__advanced-properties__regex input').val())
                    .to.be.empty;
            }
            else {
                expect(wrapper.find('.input-properties__form__advanced-properties__regex input').val())
                    .to.equal(input.regex);
            }
        }

        //verify
        if ($.inArray(input.type, consts.VERIFY_ALLOWED_TYPES) > -1) {
            if (input.verify) {
                expect(wrapper.find('.input-properties__form__advanced-properties__double-entry label input')
                    .is(':checked'))
                    .to.be.true;
            }
            else {
                expect(wrapper.find('.input-properties__form__advanced-properties__double-entry label input')
                    .is(':checked'))
                    .to.be.false;
            }
        }

        //uniqueness if allowed
        if ($.inArray(input.type, consts.UNIQUENESS_ALLOWED_TYPES) > -1) {
            if (input.uniqueness === consts.UNIQUESS_NONE) {
                expect(wrapper.find('.input-properties__form__advanced-properties__uniqueness label input')
                    .is(':checked'))
                    .to.be.false;
            }
            else {
                //top parent form can have only uniqueness set to form
                if (formIndex === 0) {
                    if (input.uniqueness === consts.UNIQUESS_FORM) {
                        expect(wrapper.find('.input-properties__form__advanced-properties__uniqueness label input')
                            .is(':checked'))
                            .to.be.true;
                    }
                    else {
                        expect(wrapper.find('.input-properties__form__advanced-properties__uniqueness label input')
                            .is(':checked'))
                            .to.be.false;
                    }
                }
                else {
                    //child forms have form or hierarchy uniqueness
                    if (input.uniqueness === consts.UNIQUESS_FORM) {
                        expect(wrapper.find('.input-properties__form__advanced-properties__uniqueness label input.uniqueness-form')
                            .is(':checked'))
                            .to.be.true;
                    }
                    else {
                        expect(wrapper.find('.input-properties__form__advanced-properties__uniqueness label input.uniqueness-form')
                            .is(':checked'))
                            .to.be.false;

                    }

                    if (input.uniqueness === consts.UNIQUESS_HIERARCHY) {
                        expect(wrapper.find('.input-properties__form__advanced-properties__uniqueness label input.uniqueness-hierarchy')
                            .is(':checked'))
                            .to.be.true;
                    }
                    else {
                        expect(wrapper.find('.input-properties__form__advanced-properties__uniqueness label input.uniqueness-hierarchy')
                            .is(':checked'))
                            .to.be.false;

                    }
                }
            }
        } else {
            //no uniquess allowed, no dom ;)
            expect(wrapper.find('#advanced-' + input.ref).find('.input-properties__form__advanced-properties__uniqueness').html())
                .to.be.undefined;

        }

        //integer and decimal
        if (input.type === consts.INTEGER_TYPE || input.type === consts.DECIMAL_TYPE) {

            if (input.type === consts.INTEGER_TYPE) {
                expect(wrapper
                    .find('.input-properties__form__advanced-properties__numeric label input').eq(0))
                    .to.be.checked;
            }

            if (input.type === consts.DECIMAL_TYPE) {

                expect(wrapper
                    .find('.input-properties__form__advanced-properties__numeric label input').eq(1))
                    .to.be.checked;
            }

            //min and max
            if (input.min) {
                expect(wrapper
                    .find('.input-properties__form__advanced-properties__min form-group input').val())
                    .to.equal(input.min);
            }

            if (input.max) {
                expect(wrapper
                    .find('.input-properties__form__advanced-properties__max form-group input').val())
                    .to.equal(input.max);
            }
        }

        //add jumps button
        if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) > -1) {
            //multiple answer types
            if (input.jumps.length >= input.possible_answers.length) {
                //add jump button must be disabled
                expect(wrapper.find(' .input-properties__form__jumps__add-jump'))
                    .to.be.disabled;
            }
            else {
                //add jump button must be enabled
                expect(wrapper.find(' .input-properties__form__jumps__add-jump'))
                    .to.be.enabled;
            }
        }
        else {
            // single answer types, max 1 jump
            if (input.jumps.length >= 1) {
                //add jump button must be disabled
                expect(wrapper.find(' .input-properties__form__jumps__add-jump'))
                    .to.be.disabled;
            }
            else {
                //add jump button must be enabled
                expect(wrapper.find(' .input-properties__form__jumps__add-jump'))
                    .to.be.enabled;
            }
        }


        //add possible answers button
        if ($.inArray(input.type, consts.MULTIPLE_ANSWER_TYPES) > -1) {

            //lower limit for testing
            consts.LIMITS.possible_answers_max = 5;

            //multiple answer types
            if (input.possible_answers.length >= consts.LIMITS.possible_answers_max) {
                //add jump button must be disabled
                expect(wrapper.find('.input-properties__form__possible-answers__add-answer'))
                    .to.be.disabled;
            }
            else {
                //add jump button must be enabled
                expect(wrapper.find('.input-properties__form__possible-answers__add-answer'))
                    .to.be.enabled;
            }

            //restore limit
            consts.LIMITS.possible_answers_max = 300;
        }

        //jumps list in dom must be equal to jumps.lenght
        expect(wrapper.find('.input-properties__form__jumps__list li').length)
            .to.equal(input.jumps.length);

        //possible answer list must be equal to possible answer array
        expect(wrapper.find('.input-properties__form__possible-answers__list li').length)
            .to.equal(input.possible_answers.length);

        //check jumps "select" to match jump object
        if (input.jumps.length > 0) {
            //"no jumps set yet message" should be hidden
            expect(wrapper
                .find('.input-properties__form__jumps__no-jumps-message').hasClass('hidden'))
                .to.be.true;

            $(input.jumps).each(function (jumpIndex, jump) {
                //when
                expect(wrapper
                    .find('.input-properties__form__jumps__list li')
                    .eq(jumpIndex)
                    .find('.input-properties__form__jumps__logic--when')
                    .find('select option:selected').val())
                    .to.equal(jump.when);

                //answer is
                if (jump.answer_ref === null) {
                    //when answer is null there is no <option>
                    expect(wrapper
                        .find('.input-properties__form__jumps__list li')
                        .eq(jumpIndex)
                        .find('.input-properties__form__jumps__logic--answer')
                        .find('select option:selected').val())
                        .to.be.undefined;
                }
                else {
                    expect(wrapper
                        .find('.input-properties__form__jumps__list li')
                        .eq(jumpIndex)
                        .find('.input-properties__form__jumps__logic--answer')
                        .find('select option:selected').val())
                        .to.equal(jump.answer_ref);
                }

                //to
                expect(wrapper
                    .find('.input-properties__form__jumps__list li')
                    .eq(jumpIndex)
                    .find('.input-properties__form__jumps__logic--goto')
                    .find('select option:selected').val())
                    .to.equal(jump.to);
            });
        }
        else {
            //"no jumps set yet message" should be visible, no hidden class
            expect(wrapper
                .find('.input-properties__form__jumps__no-jumps-message').hasClass('hidden'))
                .to.be.false;
        }

        //todo nested branch and group inputs
        //...

        //edit branch button
        if (input.type === consts.BRANCH_TYPE) {
            if (input.question.length > 0) {
                expect(wrapper
                    .find('.input-properties__form__edit-branch'))
                    .to.be.enabled;
            }
            else {
                expect(wrapper
                    .find('.input-properties__form__edit-branch'))
                    .to.be.disabled;
            }
        }

        //edit group button
        if (input.type === consts.GROUP_TYPE) {
            if (input.question.length > 0) {
                expect(wrapper
                    .find('.input-properties__form__edit-group'))
                    .to.be.enabled;
            }
            else {
                expect(wrapper
                    .find('.input-properties__form__edit-group'))
                    .to.be.disabled;
            }
        }

        //clear dom -> if test fails the dom is still there for debugging
        wrapper.remove();

    }


    describe('Test ec5-test-cleaning -> getInputPropertiesPanelHTML() -> valid dom', function () {

        //set urls for test environment
        consts.API_DEVELOPMENT_GET_PATH = '../' + consts.API_DEVELOPMENT_GET_PATH;
        consts.VIEWS_PATH = '../' + consts.VIEWS_PATH;
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


        it('should be valid dom for all properties panels', function () {
            $(forms).each(function (formIndex, form) {
                $(form.inputs).each(function (inputIndex, input) {

                    _testInputDom(formIndex, input, false, false);

                    if (input.type === consts.BRANCH_TYPE) {
                        $(input.branch).each(function (branchInputIndex, branchInput) {

                            _testInputDom(formIndex, branchInput, true, false);

                            if (branchInput.type === consts.GROUP_TYPE) {
                                $(branchInput.group).each(function (groupInputIndex, groupInput) {
                                    _testInputDom(formIndex, groupInput, true, true);
                                });
                            }
                        });
                    }

                    if (input.type === consts.GROUP_TYPE) {
                        $(input.group).each(function (groupInputIndex, groupInput) {
                            _testInputDom(formIndex, groupInput, false, true);
                        });
                    }

                });
            });
        });
    });
};

module.export = getInputPropertiesPanelHTMLTest();

    
