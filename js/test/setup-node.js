/*
    Mocha setup to run the test suite in Node (CLI) instead of in the browser.

    The tests need a DOM, jQuery and the local views/fixtures, so we set up a jsdom
    window and serve the XHR requests straight from the file system.

    Usage: mocha --opts js/test/mocha.opts
 */
/* jshint evil: true */
'use strict';
var fs = require('fs');
var path = require('path');
var Module = require('module');
var JSDOM = require('jsdom').JSDOM;

var project_root = path.resolve(__dirname, '../..');
//the test fixtures live next to the tests, so the relative XHR paths are resolved from there
var base_path = path.join(project_root, 'js', 'test');

/*
    The app modules use browserify style absolute requires ("config/consts", "actions/validation", ...)
    and the test entry point requires the test files by name ("areJumpsValid.test").
    In the browser they are resolved by the browserify "paths" option, here we do it with NODE_PATH.
 */
process.env.NODE_PATH = [
    path.join(project_root, 'js', 'app_modules'),
    path.join(project_root, 'js', 'test')
].join(path.delimiter);
Module.Module._initPaths();

var dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
    //lets the vendor bundle run in the window scope (it needs "self")
    runScripts: 'outside-only'
});

var window = dom.window;

//expose the dom to the app and to the tests
//(some globals are read only in newer node versions, so use defineProperty)
var set_global = function (name, value) {
    try {
        Object.defineProperty(global, name, {
            value: value,
            configurable: true,
            writable: true
        });
    } catch (error) {
        //the global cannot be replaced, the app does not need it
    }
};

set_global('window', window);
set_global('document', window.document);
set_global('navigator', window.navigator);
set_global('location', window.location);
set_global('history', window.history);
set_global('getComputedStyle', window.getComputedStyle.bind(window));
set_global('XMLHttpRequest', window.XMLHttpRequest);
set_global('Element', window.Element);
set_global('HTMLElement', window.HTMLElement);
set_global('Node', window.Node);
set_global('Event', window.Event);
set_global('CustomEvent', window.CustomEvent);
set_global('DOMParser', window.DOMParser);

//jQuery binds itself to the global window/document
var jQuery = require('jquery');
set_global('$', jQuery);
set_global('jQuery', jQuery);
window.$ = jQuery;
window.jQuery = jQuery;

/*
    The vendor bundle holds the globals the app uses (CircularJSON, Flatted, Papa, pako, toastr...).
    It is the same bundle the browser test page loads, it does not include jQuery (loaded from a CDN there).
 */
var vendor_bundle = fs.readFileSync(path.join(project_root, 'public', 'js', 'vendor-formbuilder.js'), 'utf8');
window.eval(vendor_bundle);

/*
    The vendor bundle runs in the window realm, so the objects it creates have the window
    prototypes (Array, Object...) instead of the node ones, and the app and the tests would
    not be able to compare them.

    So load the libs that create objects in the node realm and use them everywhere.
 */
var vendor_path = path.join(project_root, 'js', 'vendor');

//CircularJSON assigns itself to "window"
var circular_json = new Function('window',
    fs.readFileSync(path.join(vendor_path, 'CircularJSON.js'), 'utf8') + '\nreturn window.CircularJSON;'
)({});

//Flatted is a top level var
var flatted = new Function(
    fs.readFileSync(path.join(vendor_path, 'flatted.js'), 'utf8') + '\nreturn Flatted;'
)();

//Papa is a UMD module
var papa = require(path.join(vendor_path, 'papaparse.min.js'));

set_global('CircularJSON', circular_json);
set_global('Flatted', flatted);
set_global('Papa', papa);

window.CircularJSON = circular_json;
window.Flated = flatted;
window.Papa = papa;

/*
    The app logs a lot of debug info (the whole project structure, the loaded views, ...),
    it is only noise in the test output. Buffer it instead of printing it.

    The mocha reporter writes its summary with console.log, so the real one is restored
    at the end of the run (see js/test.js), before the reporter prints the summary.
 */
var real_console_log = console.log;
var log_buffer = [];

if (!process.env.VERBOSE) {
    console.log = function () {
        log_buffer.push(Array.prototype.slice.call(arguments).map(function (arg) {
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
        }).join(' '));
    };
}

/*
    Serve the XHR requests from the file system.

    The app fetches the views, the partials and the test fixtures with relative urls,
    so they are resolved from the test folder (js/test)
 */
var get_data_type = function (the_url, the_options) {

    if (the_options.dataType && the_options.dataType !== 'text') {
        return the_options.dataType;
    }
    //jQuery guesses the data type from the response content type
    if (path.extname(the_url.split('?')[0]) === '.json') {
        return 'json';
    }
    return 'text';
};

jQuery.ajax = function (options) {

    options = options || {};

    var url = options.url || '';
    //strip the cache busting query string
    var file_path = path.join(base_path, decodeURIComponent(url.split('?')[0]));
    var data_type = get_data_type(url, options);

    var deferred = jQuery.Deferred();

    fs.readFile(file_path, 'utf8', function (err, content) {
        if (err) {
            if (options.error) {
                options.error(err, 'error', err.message);
            }
            deferred.reject(err);
            return;
        }

        var data = content;
        if (data_type === 'json') {
            try {
                data = JSON.parse(content);
            } catch (error) {
                //not a valid json, serve it as text
            }
        }

        if (options.success) {
            options.success(data);
        }
        deferred.resolve(data);
    });

    return deferred.promise();
};

module.exports = {
    //called at the end of the run, so the mocha reporter can print its summary
    restore_console_log: function () {
        console.log = real_console_log;
    },
    //the buffered app logs, they are dropped unless running with VERBOSE=1
    log_buffer: log_buffer
};
