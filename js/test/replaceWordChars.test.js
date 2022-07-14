/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var import_form_validation = require('helpers/import-form-validation');
var consts = require('config/consts');
var utils = require('helpers/utils');


var replaceWordChars = function () {

    describe('Test replaceWordChars()', function () {

        it('should replace \u2013 ', function () {

            var s = 'I am a string with \u2013';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with -');
        });

        it('should replace \u2014 ', function () {

            var s = 'I am a string with \u2014';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with -');
        });

        it('should replace \u2018 ', function () {

            var s = 'I am a string with \u2018';

            var result = utils.replaceWordChars(s);
            // jscs:disable
            expect(result).to.equal("I am a string with '");
            // jscs:enable
        });

        it('should replace \u2019 ', function () {

            var s = 'I am a string with \u2019';

            var result = utils.replaceWordChars(s);
            // jscs:disable
            expect(result).to.equal("I am a string with '");
            // jscs:enable
        });

        it('should replace \u201A ', function () {

            var s = 'I am a string with \u201A';

            var result = utils.replaceWordChars(s);
            // jscs:disable
            expect(result).to.equal("I am a string with '");
            // jscs:enable
        });

        it('should replace \u201C ', function () {

            var s = 'I am a string with \u201C';

            var result = utils.replaceWordChars(s);
            // jscs:disable
            expect(result).to.equal('I am a string with "');
            // jscs:enable
        });

        it('should replace \u201D ', function () {

            var s = 'I am a string with \u201D';

            var result = utils.replaceWordChars(s);
            // jscs:disable
            expect(result).to.equal('I am a string with "');
            // jscs:enable
        });

        it('should replace \u201E ', function () {

            var s = 'I am a string with \u201E';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with "');
        });

        it('should replace \u2026 ', function () {

            var s = 'I am a string with \u2026';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with ...');
        });

        it('should replace \u02C6 ', function () {

            var s = 'I am a string with \u02C6';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with ^');
        });

        it('should replace \u2039 ', function () {

            var s = 'I am a string with \u2039';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with  ');
        });

        it('should replace \u203A ', function () {

            var s = 'I am a string with \u203A';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with  ');
        });

        it('should replace \u02DC ', function () {

            var s = 'I am a string with \u02DC';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with  ');
        });

        it('should replace \u00A0 ', function () {

            var s = 'I am a string with \u00A0';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with  ');
        });

        it('should replace \uFFFD ', function () {

            var s = 'I am a string with \uFFFD';

            var result = utils.replaceWordChars(s);

            expect(result).to.equal('I am a string with  ');
        });
    });

};

module.export = replaceWordChars();

