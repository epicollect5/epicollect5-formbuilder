import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import jQuery from 'jquery';
import { getCurrentInputs, setProject } from '@/services/session.js';
import { renderApp } from '@/ui/shell.js';

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

function build_markup() {
    document.body.innerHTML = [
        '<ion-toolbar><ion-buttons slot="start"><ion-button data-action="back">Back</ion-button></ion-buttons><ion-title><img id="project-logo" alt=""><span id="project-name"></span></ion-title><ion-buttons slot="end"><ion-button data-action="exit">Exit</ion-button></ion-buttons></ion-toolbar>',
        '<section id="tools"></section>',
        '<nav id="form-tabs" role="tablist"><ion-segment class="builder__forms-segment" value="0" scrollable="true"></ion-segment></nav>',
        '<button type="button" id="add-form">Add form</button>',
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
});
