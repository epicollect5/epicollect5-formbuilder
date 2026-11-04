'use strict';

/**
 * Shared harness for the properties panel component tests.
 *
 * The jumps and possible answers behaviour lives in the legacy modules under
 * js/app_modules/actions, so the tests render the same markup the legacy
 * template layer produces and drive those modules against it.
 */

import '../legacy/setup.js';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { vi } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const prototype_root = path.resolve(here, '../..');
const repo_root = path.resolve(prototype_root, '..');

export const $ = globalThis.$;
export const legacy_require = createRequire(path.join(repo_root, 'js/test.js'));

const extend_natives = legacy_require('config/extend-natives');

if (typeof extend_natives === 'function') {
    extend_natives();
}

export const formbuilder = legacy_require('config/formbuilder');
export const consts = legacy_require('config/consts');
export const jumps = legacy_require('actions/jumps');
export const possible_answers = legacy_require('actions/possible-answers');
export const ui = legacy_require('helpers/ui');

export const toastr = {
    options: {},
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    clear: vi.fn()
};

globalThis.toastr = toastr;
window.toastr = toastr;

/*
 * The legacy panel helpers look the active input up through the whole project
 * definition; these tests only build a properties panel, so that lookup is not
 * part of what they assert.
 */
ui.input_properties_panel.toggleAddAnswerBtn = vi.fn();

const INPUT_REF = 'ec5_1';

function read_prototype_view(relative_path) {
    return fs.readFileSync(path.join(prototype_root, relative_path), 'utf8');
}

function read_legacy_view(relative_path) {
    return fs.readFileSync(path.join(repo_root, relative_path), 'utf8');
}

const POSSIBLE_ANSWER_PARTIAL = read_legacy_view('public/views/partials/possible-answer-list-item.html');

const PARTIALS = {
    jump_list_item: read_prototype_view('src/views/partials/jump-list-item.html'),
    jump_list_item_always_jump: read_prototype_view('src/views/partials/jump-list-item-always-jump.html'),
    // a row added at runtime always starts with the remove button enabled
    possible_answer_list_item: POSSIBLE_ANSWER_PARTIAL.replace('{{disabled}}', '')
};

function escape_attribute(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// mirrors getPossibleAnswersList: the only answer cannot be removed
function possible_answers_list_html(answers) {
    return answers.map(function (answer, index) {
        const disabled = answers.length === 1 && index === 0 ? 'disabled' : '';

        return POSSIBLE_ANSWER_PARTIAL
            .replace('{{answer-ref}}', escape_attribute(answer.answer_ref))
            .replace('{{answer}}', escape_attribute(answer.answer))
            .replace('{{disabled}}', disabled);
    }).join('');
}

export function create_input(overrides) {
    const input = Object.assign({
        ref: INPUT_REF,
        type: consts.RADIO_TYPE,
        question: 'Question one',
        default: '',
        dom: {},
        jumps: [],
        possible_answers: [
            { answer: 'Yes', answer_ref: INPUT_REF + '_answer_1' },
            { answer: 'No', answer_ref: INPUT_REF + '_answer_2' }
        ],
        updatePossibleInitialAnswers: vi.fn()
    }, overrides || {});

    // the legacy modules read the answers back out of the panel
    input.savePossibleAnswers = vi.fn(function () {
        const list_items = $('form[data-input-ref="' + input.ref + '"]')
            .find('.input-properties__form__possible-answers__list li');

        input.possible_answers = list_items.map(function () {
            const field = $(this).find('input');

            return {
                answer: field.val(),
                answer_ref: field.attr('data-answer-ref')
            };
        }).get();
    });

    input.addJump = function () {
        jumps.addJump(input);
    };

    input.removeJump = function (remove_btn) {
        jumps.removeJump(input, remove_btn);
    };

    return input;
}

export function build_panel(input) {
    document.body.innerHTML = [
        '<div id="' + INPUT_REF + '-input-properties" class="input-properties">',
        '    <div class="panel">',
        '        <div class="panel-body input_properties__forms_wrapper">',
        '            <form data-input-ref="' + input.ref + '">',
        '                <div class="tab-content">',
        '                    <div class="tab-pane input-properties__form__jumps">',
        '                        <div class="panel-body">',
        '                            <button class="input-properties__form__jumps__add-jump" type="button">Add jump</button>',
        '                            <span class="input-properties__form__jumps__no-jumps-message hidden">No jumps set yet</span>',
        '                            <ul class="input-properties__form__jumps__list list-group"></ul>',
        '                        </div>',
        '                    </div>',
        '                    <div class="tab-pane input-properties__form__possible-answers">',
        '                        <div class="panel-body">',
        '                            <ul class="input-properties__form__possible-answers__list list-group">' +
            possible_answers_list_html(input.possible_answers) +
        '</ul>',
        '                            <button class="input-properties__form__possible-answers__add-answer" type="button">Add answer</button>',
        '                        </div>',
        '                    </div>',
        '                    <div class="input-properties__form__advanced-properties panel">',
        '                        <div class="panel-body">',
        '                            <div class="input-properties__form__advanced-properties__default">',
        '                                <select></select>',
        '                            </div>',
        '                        </div>',
        '                    </div>',
        '                </div>',
        '            </form>',
        '        </div>',
        '    </div>',
        '</div>',
        '<div class="inputs-collection">',
        '    <div class="input" data-input-ref="' + input.ref + '">',
        '        <div class="input-inner"><i class="jump-state invisible"></i></div>',
        '    </div>',
        '</div>'
    ].join('\n');

    const panel = $('#' + INPUT_REF + '-input-properties.input-properties');

    formbuilder.dom.input_properties = panel;
    formbuilder.dom.input_properties_forms_wrapper = panel.children('.panel').children('.panel-body');
    formbuilder.dom.inputs_collection = $('.inputs-collection');
    formbuilder.dom.partials = {
        jump_list_item: PARTIALS.jump_list_item,
        jump_list_item_always_jump: PARTIALS.jump_list_item_always_jump,
        possible_answer_list_item: PARTIALS.possible_answer_list_item
    };
    formbuilder.possible_answers_pagination = {};
    formbuilder.possible_answers_pagination[input.ref] = { page: 1 };

    return panel;
}
