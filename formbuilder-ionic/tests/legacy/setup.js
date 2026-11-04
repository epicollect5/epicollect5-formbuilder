'use strict';

/**
 * Runs the legacy Mocha (js/test) suite inside Vitest.
 *
 * The specs are CommonJS modules using browserify style absolute ids
 * ("config/consts", "helpers/utils") and Mocha globals. They are loaded through
 * Node's own resolver, exactly like js/test/setup-node.js does, so the legacy
 * modules keep a single instance and their `require` calls keep working.
 */

import fs from 'node:fs';
import path from 'node:path';
import Module, { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as vitest from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const prototype_root = path.resolve(here, '../..');
const repo_root = path.resolve(prototype_root, '..');
const fixtures_root = path.join(repo_root, 'js', 'test');

process.env.NODE_PATH = [
    path.join(repo_root, 'js', 'app_modules'),
    fixtures_root
].join(path.delimiter);
Module._initPaths();

const legacy_require = createRequire(path.join(repo_root, 'js', 'test.js'));

/*
 * The legacy modules read their globals off the Node global object, so the
 * globals have to be defined there (js/test/setup-node.js does the same).
 */
function set_global(name, value) {
    try {
        Object.defineProperty(global, name, {
            value: value,
            configurable: true,
            writable: true
        });
    }
    catch (error) {
        globalThis[name] = value;
    }
}

const jQuery = legacy_require('jquery');

set_global('$', jQuery);
set_global('jQuery', jQuery);
window.$ = jQuery;
window.jQuery = jQuery;

/*
 * The app reads a few libraries as globals (CircularJSON, Flatted, Papa).
 * The browser gets them from the vendor bundle; load the same files here
 * instead of evaluating the whole bundle in jsdom.
 */
const vendor_root = path.join(repo_root, 'js', 'vendor');

const circular_json = new Function(
    'window',
    fs.readFileSync(path.join(vendor_root, 'CircularJSON.js'), 'utf8') + '\nreturn window.CircularJSON;'
)({});

const flatted = new Function(
    fs.readFileSync(path.join(vendor_root, 'flatted.js'), 'utf8') + '\nreturn Flatted;'
)();

const papa = legacy_require(path.join(vendor_root, 'papaparse.min.js'));

set_global('CircularJSON', circular_json);
set_global('Flatted', flatted);
set_global('Papa', papa);
window.CircularJSON = circular_json;
window.Flated = flatted;
window.Papa = papa;

/*
 * The app fetches views, partials and fixtures with relative urls.
 * js/test/setup-node.js resolves them from js/test; do the same.
 */
jQuery.ajax = function (options) {
    options = options || {};

    const requested = decodeURIComponent(String(options.url || '').split('?')[0]);
    const file_path = path.join(fixtures_root, requested);
    const is_json = options.dataType
        ? options.dataType === 'json'
        : path.extname(requested) === '.json';

    const deferred = jQuery.Deferred();

    fs.readFile(file_path, 'utf8', function (error, content) {
        if (error) {
            if (options.error) {
                options.error(error, 'error', error.message);
            }
            deferred.reject(error);
            return;
        }

        let data = content;

        if (is_json) {
            try {
                data = JSON.parse(content);
            }
            catch (parse_error) {
                data = content;
            }
        }

        if (options.success) {
            options.success(data);
        }

        deferred.resolve(data);
    });

    return deferred.promise();
};

/*
 * The app logs a lot of debug info (the whole project structure, the loaded
 * views, ...). js/test/setup-node.js buffers it; do the same, the real console
 * is restored at the end of the file (VERBOSE=1 keeps the logs).
 */
const real_console_log = console.log;
const real_console_clear = console.clear;

if (!process.env.VERBOSE) {
    console.log = function () {};
    console.clear = function () {};
}

vitest.afterAll(function () {
    console.log = real_console_log;
    console.clear = real_console_clear;
});

/*
 * Mocha callbacks may take a `done` argument; Vitest hooks and tests do not.
 * Adapt them so the legacy specs run unchanged.
 */
function withDone(callback) {
    if (typeof callback !== 'function' || callback.length === 0) {
        return callback;
    }

    return function () {
        const context = this;

        return new Promise(function (resolve, reject) {
            let settled = false;

            const done = function (error) {
                if (settled) {
                    return;
                }

                settled = true;

                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            };

            try {
                // Mocha ignores the return value of a callback that declares `done`.
                callback.call(context, done);
            }
            catch (error) {
                reject(error);
            }
        });
    };
}

function describeWithDone(name, callback) {
    return vitest.describe(name, function () {
        return callback.call(this);
    });
}

function itWithDone(name, callback) {
    return vitest.it(name, withDone(callback));
}

set_global('describe', describeWithDone);
set_global('it', itWithDone);
set_global('before', function (callback) {
    return vitest.beforeAll(withDone(callback));
});
set_global('after', function (callback) {
    return vitest.afterAll(withDone(callback));
});
set_global('beforeEach', function (callback) {
    return vitest.beforeEach(withDone(callback));
});
set_global('afterEach', function (callback) {
    return vitest.afterEach(withDone(callback));
});

export { legacy_require, fixtures_root, repo_root };
