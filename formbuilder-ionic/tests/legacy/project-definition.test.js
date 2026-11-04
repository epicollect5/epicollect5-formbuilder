'use strict';

/**
 * js/test.js holds the "Test project definition" assertions inline, outside the
 * spec files. They are ported here so the Vitest run covers the same ground;
 * the fixture and the assertions are the legacy ones.
 */

import { beforeAll, describe, it } from 'vitest';
import { legacy_require } from './setup.js';

const assert = legacy_require('chai').assert;
const $ = globalThis.$;

const project_keys = [
    'name',
    'small_description',
    'access',
    'slug',
    'ref',
    'status',
    'visibility',
    'logo_url',
    'forms'
];

let structure = {};
let parsing_error;

describe('legacy project definition', function () {

    beforeAll(function () {
        return new Promise(function (resolve) {
            $.ajax({
                url: 'json/project.json',
                type: 'GET',
                success: function (data) {
                    structure = data;
                    resolve();
                },
                error: function (request, status, error) {
                    parsing_error = error;
                    structure = null;
                    resolve();
                }
            });
        });
    });

    it('Project should be valid json', function () {
        assert.notEqual(structure, null, 'error parsing json: ' + parsing_error);
    });

    it('Project object should not be empty', function () {
        assert.equal(!$.isEmptyObject(structure), true, 'data is empty!!');
    });

    it('Project must have "data" property', function () {
        assert.property(structure, 'data', 'data property is missing!');
    });

    it('Project must have "project" property', function () {
        assert.property(structure.data, 'project', 'project property is missing!');
    });

    it('Project data.type must be "project"', function () {
        assert.propertyVal(structure.data, 'type', 'project');
    });

    it('Project data.project must have only allowed keys', function () {
        let has_missing_key = false;
        let missing_key = '';
        let has_extra_key = false;

        project_keys.forEach(function (key) {
            if (!structure.data.project.hasOwnProperty(key)) {
                has_missing_key = true;
                missing_key = key;
            }
        });

        for (const property in structure.data.project) {
            if (project_keys.indexOf(property) === -1) {
                has_extra_key = true;
            }
        }

        assert.equal(has_missing_key, false, '"data.project" ' + missing_key + ' key missing');
        assert.equal(has_extra_key, false, '"data.project" extra key found');
    });

    it('Project data.project must be an object with ' + project_keys.length + ' properties', function () {
        assert.equal(Object.keys(structure.data.project).length, project_keys.length, 'data.project total of keys not correct');
    });

    it('Project data.project.forms must have at least 1 element', function () {
        assert.equal(structure.data.project.forms.length > 0, true, 'forms length cannot be 0');
    });

    it('Form refs must have project ref prepended', function () {
        const forms = structure.data.project.forms;
        const project_ref = structure.data.project.ref;

        forms.forEach(function (form) {
            const form_ref_parts = form.ref.split('_');

            assert.equal(form_ref_parts[0], project_ref, 'form ref does not comply with project ref');
        });
    });
});
