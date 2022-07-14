/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var utils = require('helpers/utils');
var import_form_validation = require('helpers/import-form-validation');

var hasValidFormStructure = function () {

    describe('Valid form structure', function () {

        it('should be valid form structure', function () {

            var form = {
                data: {
                    id: '',
                    type: 'form',
                    form: {
                        ref: '',
                        name: '',
                        slug: '',
                        type: 'hierarchy',
                        inputs: []
                    }
                }
            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.true;


            form = {
                data: {
                    id: '',
                    type: 'form',
                    form: {
                        ref: '',
                        name: 'Test Form',
                        slug: 'test-form',
                        type: 'hierarchy',
                        inputs: [{}, {}, {}]
                    }
                }
            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.true;
        });
    });

    describe('Invalid form structure', function () {

        it('should be invalid form structure', function () {

            var form = {
                data: {
                    id: '',
                    type: 'mirko',//wrong type
                    form: {
                        ref: '',
                        name: '',
                        slug: '',
                        type: 'hierarchy',
                        inputs: []
                    }
                }
            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.false;

            form = {
                data: {
                    id: '',
                    type: 'form',
                    form: {
                        ref: '',
                        name: 'Test Form',
                        slug: 'test-form',
                        type: 'branch', //wrong type
                        inputs: [{}, {}, {}]
                    }
                }
            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.false;


            form = {
                data: {
                    id: '',
                    type: 'form',
                    form: {
                        ref: '',
                        name: 'Test Form',
                        slug: 'test-form',
                        type: 'hierarchy',
                        inputs: []
                    }
                },
                extra: [] //extra key
            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.false;

            form = {
                data: {
                    id: '',
                    type: 'form',
                    extra: '',//extra key
                    form: {
                        ref: '',
                        name: 'Test Form',
                        slug: 'test-form',
                        type: 'hierarchy',
                        inputs: []
                    }
                }

            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.false;


            form = {
                data: {
                    id: '',
                    type: 'form',
                    form: {
                        extra: '',//extra key
                        ref: '',
                        name: 'Test Form',
                        slug: 'test-form',
                        type: 'hierarchy',
                        inputs: []
                    }
                }

            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.false;

            form = {
                data: {
                    id: '',
                    type: 'form',
                    form: {
                        // ref: '', missing ref
                        name: 'Test Form',
                        slug: 'test-form',
                        type: 'hierarchy',
                        inputs: []
                    }
                }

            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.false;


            form = {
                data: {
                    // id: '', missing id
                    type: 'form',
                    form: {
                        ref: '',
                        name: 'Test Form',
                        slug: 'test-form',
                        type: 'hierarchy',
                        inputs: []
                    }
                }

            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.false;

            form = {
                data: [] //wrong structure

            };

            expect(import_form_validation.hasValidFormStructure(form)).to.be.false;
        });
    });
};

module.exports = hasValidFormStructure();


