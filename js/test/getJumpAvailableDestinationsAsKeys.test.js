/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var utils = require('helpers/utils');
var consts = require('config/consts');

var getJumpAvailableDestinationsAsKeys = function () {

    /**
     * It is possible only to jump forward, and not to the next input, but nect input +1
     */
    describe('Test utils.getJumpAvailableDestinationsAsKeys()', function () {


        var inputs = [
            {
                ref: '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1858fb17192'
            },
            {
                ref: '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590017193'
            },
            {
                ref: '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590517194'
            },
            {
                ref: '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591917199'
            },
            {
                ref: '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591f1719a'
            },
            {
                ref: '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859241719b'
            },
            {
                ref: '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859291719c'
            }
        ];

        it('should get valid destinations for input[0]', function () {

            var index = 0;

            //passing first input
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.have.all.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590517194',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591917199',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591f1719a',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859241719b',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859291719c',
                consts.JUMP_TO_END_OF_FORM_REF
            );
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.not.have.any.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1858fb17192',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590017193'
            );
        });

        it('should get valid destinations for input[1]', function () {

            var index = 1;

            //passing second input
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.have.all.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591917199',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591f1719a',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859241719b',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859291719c',
                consts.JUMP_TO_END_OF_FORM_REF
            );
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.not.have.any.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1858fb17192',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590017193',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590517194'
            );
        });

        it('should get valid destinations for input[2]', function () {

            var index = 2;
            //passing second input
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.have.all.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591f1719a',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859241719b',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859291719c',
                consts.JUMP_TO_END_OF_FORM_REF
            );
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.not.have.any.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1858fb17192',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590017193',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590517194',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591917199'
            );
        });

        it('should get valid destinations for input[3]', function () {

            var index = 3;

            //passing fourth input
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.have.all.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859241719b',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859291719c',
                consts.JUMP_TO_END_OF_FORM_REF
            );
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.not.have.any.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1858fb17192',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590017193',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590517194',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591917199',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591f1719a'
            );
        });

        it('should get valid destinations for input[4]', function () {

            var index = 4;


            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.have.all.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859291719c',
                consts.JUMP_TO_END_OF_FORM_REF
            );
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.not.have.any.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1858fb17192',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590017193',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590517194',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591917199',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591f1719a',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859241719b'
            );
        });

        it('should get valid destinations for input[5]', function () {

            var index = 5;

            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.have.all.keys(
                consts.JUMP_TO_END_OF_FORM_REF
            );
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.not.have.any.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1858fb17192',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590017193',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590517194',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591917199',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591f1719a',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859241719b',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859291719c'
            );
        });

        it('should get valid destinations for input[6]', function () {

            var index = 6;

            /**
             *
             */
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.have.all.keys(
                consts.JUMP_TO_END_OF_FORM_REF
            );
            expect(utils.getJumpAvailableDestinationsAsKeys(index, inputs[index], inputs)).to.not.have.any.keys(
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1858fb17192',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590017193',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18590517194',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591917199',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a18591f1719a',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859241719b',
                '286e7847ba844919838bef2c0fbff382_5a1858f6d6898_5a1859291719c'
            );
        });
    });
};

module.export = getJumpAvailableDestinationsAsKeys();

