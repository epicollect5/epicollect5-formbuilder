import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import jQuery from 'jquery';
import { getCurrentInputs, setProject } from '@/services/session.js';
import { renderApp } from '@/ui/shell.js';
import { installAnswerSortable, installQuestionSortable, installToolDrag } from '@/ui/sortable.js';

/*
 * The shell only wires drag and drop when jQuery UI is on the page, so this
 * suite loads the same vendored build the app loads and drives the real
 * sortable against the rendered ion-list.
 */
beforeAll(async () => {
    window.jQuery = jQuery;
    window.$ = jQuery;

    const source = await readFile(resolve(process.cwd(), 'node_modules/jquery-ui/dist/jquery-ui.min.js'), 'utf8');

    new Function('jQuery', 'define', 'module', 'exports', source)(jQuery, undefined, undefined, undefined);
});

afterAll(() => {
    vi.useRealTimers();
});

function build_markup() {
    document.body.innerHTML = [
        '<ion-toolbar><ion-buttons slot="start"><ion-button data-action="back">Back</ion-button></ion-buttons><ion-title><img id="project-logo" alt=""><span id="project-name"></span></ion-title><ion-buttons slot="end"><ion-button data-action="exit">Exit</ion-button></ion-buttons></ion-toolbar>',
        '<section id="tools"></section>',
        '<nav id="form-tabs" role="tablist"><ion-segment class="builder__forms-segment" value="0" scrollable="true"></ion-segment></nav>',
        '<button type="button" id="add-form">Add Form</button>',
        '<button type="button" id="undo" disabled>Undo</button>',
        '<button type="button" id="save" disabled>Save project</button>',
        '<section id="questions"></section>',
        '<section id="properties"></section>'
    ].join('');
}

function project_definition() {
    return {
        data: {
            project: {
                name: 'Sortable test',
                slug: 'sortable-test',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Screening form',
                        type: 'hierarchy',
                        inputs: [
                            { ref: 'input_1', type: 'text', question: 'Your name', is_required: false, is_title: false },
                            { ref: 'input_2', type: 'text', question: 'Your age', is_required: false, is_title: false }
                        ]
                    }
                ]
            }
        }
    };
}

function question_list() {
    return jQuery('#questions .builder__question-list');
}

/* A forward jump that a reorder invalidates. */
function jump_project() {
    return {
        data: {
            project: {
                name: 'Jump test',
                slug: 'jump-test',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Jump form',
                        type: 'hierarchy',
                        inputs: [
                            {
                                ref: 'input_1',
                                type: 'radio',
                                question: 'Pick one',
                                is_required: false,
                                is_title: false,
                                uniqueness: 'none',
                                regex: null,
                                default: null,
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [
                                    { answer: 'Yes', answer_ref: 'answer_1' },
                                    { answer: 'No', answer_ref: 'answer_2' }
                                ],
                                jumps: [{ to: 'input_3', when: 'ALL', answer_ref: null }],
                                branch: [],
                                group: []
                            },
                            {
                                ref: 'input_2',
                                type: 'text',
                                question: 'Explain',
                                is_required: false,
                                is_title: false,
                                uniqueness: 'none',
                                regex: null,
                                default: null,
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [],
                                jumps: [],
                                branch: [],
                                group: []
                            },
                            {
                                ref: 'input_3',
                                type: 'text',
                                question: 'Notes',
                                is_required: false,
                                is_title: false,
                                uniqueness: 'none',
                                regex: null,
                                default: null,
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [],
                                jumps: [],
                                branch: [],
                                group: []
                            }
                        ]
                    }
                ]
            }
        }
    };
}

describe('question sortable', () => {
    beforeEach(() => {
        build_markup();
        setProject(project_definition());
        renderApp();
    });

    it('initialises on the rendered ion-list and matches the ion-item rows', () => {
        const $list = question_list();

        expect($list).toHaveLength(1);
        expect($list[0].nodeName).toBe('ION-LIST');
        expect($list.hasClass('ui-sortable')).toBe(true);

        const instance = $list.sortable('instance');
        const rows = $list.find('> .builder__question');

        expect(instance.options.items).toBe('> .builder__question');
        expect(rows).toHaveLength(2);
        expect(rows.map((_, row) => row.nodeName).get()).toEqual(['ION-ITEM', 'ION-ITEM']);
        expect(rows.map((_, row) => row.getAttribute('data-input-ref')).get())
            .toEqual(getCurrentInputs().map((input) => input.ref));
    });

    it('builds a placeholder that the items selector ignores', () => {
        const $list = question_list();
        const instance = $list.sortable('instance');

        instance.currentItem = $list.find('> .builder__question').eq(0);
        instance._createPlaceholder();

        const placeholder = instance.options.placeholder.element();

        $list.append(placeholder);

        expect(placeholder[0].nodeName).toBe('ION-ITEM');
        expect(placeholder[0].classList.contains('builder__question-placeholder')).toBe(true);
        expect($list.find('> .builder__question')).toHaveLength(2);
        expect(placeholder[0].parentNode).toBe($list[0]);

        placeholder.remove();
    });

    it('drags the palette tools into the list', () => {
        const tools = jQuery('#tools .builder__tool');

        expect(tools).toHaveLength(18);
        expect(tools.hasClass('ui-draggable')).toBe(true);
        expect(tools.first().attr('data-type')).toBe('text');
    });

    it('fails loudly when jQuery is missing instead of silently skipping', () => {
        const jquery = window.jQuery;
        const dollar = window.$;

        delete window.jQuery;
        delete window.$;

        try {
            const message = 'Drag and drop requires jQuery, but window.jQuery is not available.';

            expect(() => installToolDrag('#tools .builder__tool', '#questions .builder__question-list', () => {})).toThrow(message);
            expect(() => installQuestionSortable('#questions .builder__question-list', () => {})).toThrow(message);
            expect(() => installAnswerSortable('#properties .builder__answer-list', () => {})).toThrow(message);
        } finally {
            window.jQuery = jquery;
            window.$ = dollar;
        }
    });

    it('refreshes validity after a reorder without a toast', () => {
        vi.useFakeTimers();
        setProject(jump_project());
        renderApp();

        expect(document.getElementById('save').disabled).toBe(false);

        const list = document.querySelector('#questions .builder__question-list');
        const first_row = list.querySelector('.builder__question');

        // The sortable leaves the DOM in its new order; its stop persists it.
        list.append(first_row);
        question_list().sortable('instance').options.stop();
        vi.advanceTimersByTime(1);

        const moved = document.querySelector('.builder__question[data-input-ref="input_1"]');

        expect(moved.getAttribute('data-valid')).toBe('false');
        expect(moved.querySelector('.question-state').classList.contains('is-invalid')).toBe(true);
        expect(document.querySelector('#form-tabs .builder__form-tab .builder__form-tab-state')).not.toBeNull();
        expect(document.getElementById('save').disabled).toBe(true);
        expect(document.querySelector('ion-toast')).toBeNull();
    });
});
