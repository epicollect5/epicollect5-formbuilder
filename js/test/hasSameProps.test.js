/* jshint expr: true */
/* IMPORTANT: there is a bug in mocha that renders the errors twice in the browser https://github.com/mochajs/mocha/issues/2083*/
'use strict';
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var utils = require('helpers/utils');

var hasSameProps = function () {

    describe('Test utils.hasSameProps() -> valid structures', function () {

        it('should be valid structure comparison', function () {

            var valid = {};
            var test = {};

            expect(utils.hasSameProps(valid, test, false), 'both are object').to.be.true;

            valid = {
                data: {
                    id: 1,
                    entries: []
                }
            };

            test = {
                data: {
                    id: 2,//different value
                    entries: [1, 2, 3]//different array content
                }
            };

            expect(utils.hasSameProps(valid, test, false), 'same props with different content').to.be.true;

            valid = {
                data: {
                    id: 1,
                    entries: [],
                    other: {
                        me: 'ciao',
                        another: {
                            you: true
                        }
                    }
                }
            };

            test = {
                data: {
                    id: '6',//different value and type
                    entries: [],
                    other: {
                        me: 'hallo',//different value
                        another: {
                            you: false //different value
                        }
                    }
                }
            };

            expect(utils.hasSameProps(valid, test, false), ' same props with different content and type')
                .to.be.true;


            valid = {
                data: {
                    a: {
                        b: {
                            c: {
                                d: {
                                    id: 0
                                }
                            }
                        }
                    }
                }
            };

            test = {
                data: {
                    a: {
                        b: {
                            c: {
                                d: {
                                    id: -1 //different value
                                }
                            }
                        }
                    }
                }
            };

            expect(utils.hasSameProps(valid, test, false), 'nested props').to.be.true;
        });
    });

    describe('Test utils.hasSameProps() -> invalid structures', function () {

        it('should catch invalid structure comparison', function () {

            var valid = {};
            var test = []; //array, not object

            expect(utils.hasSameProps(valid, test, true)).to.be.false;

            valid = {
                data: {
                    id: 1,
                    entries: []
                }
            };

            test = {
                data: {
                    id: 1,
                    entries: [],
                    extra: ''//extra property
                }
            };

            expect(utils.hasSameProps(valid, test, false)).to.be.false;
            valid = {
                data: {
                    id: 1,
                    entries: []
                }
            };

            test = {
                data: {
                    // id: 1, missing property
                    entries: []
                }
            };

            expect(utils.hasSameProps(valid, test, false)).to.be.false;


            valid = {
                data: {
                    a: {
                        b: {
                            c: {
                                d: {
                                    id: 0
                                }
                            }
                        }
                    }
                }
            };

            test = {
                data: {
                    a: {
                        b: {
                            c: {
                                d: {
                                    id: 0,
                                    extra: true//  extra nested proerty
                                }
                            }
                        }
                    }
                }
            };
            expect(utils.hasSameProps(valid, test, false)).to.be.false;

            valid = {
                data: {
                    id: 1,
                    entries: {}
                }
            };

            test = {
                data: {
                    id: 1,
                    entries: [] //array instead of object
                }
            };

            expect(utils.hasSameProps(valid, test, false)).to.be.false;

            valid = {
                data: {
                    id: 1,
                    entries: {}
                }
            };

            test = {
                data: {
                    id: 1,
                    entrie: {} //mispelled property
                }
            };

            expect(utils.hasSameProps(valid, test, false)).to.be.false;
        });
    });
};

module.export = hasSameProps();

