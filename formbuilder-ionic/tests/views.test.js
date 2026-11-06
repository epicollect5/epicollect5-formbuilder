import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { QUESTION_TYPES } from '@/models/question-types.js';
import { DATE_FORMATS, TIME_FORMATS } from '@/models/input-properties.js';
import { getAdvancedFields } from '@/services/properties.js';

function datetime_values(html, type) {
    const group_start = html.indexOf('data-datetime-type="' + type + '"');
    const group_end = html.indexOf('</ion-radio-group>', group_start);

    return [...html.slice(group_start, group_end).matchAll(/value="([^"]+)"/g)].map((match) => match[1]);
}

function read(relative_path) {
    return readFile(new URL('../' + relative_path, import.meta.url), 'utf8');
}

describe('Ionic entry point', () => {
    it('loads the Vite-bundled Ionic theme and the native entry module', async () => {
        const html = await read('src/index.html');

        expect(html).toContain('theme/ionic-formbuilder.scss');
        expect(html).toContain('src="./app.js"');
        expect(html).toContain('type="module"');
        expect(html).not.toContain('vendor/ionic/css/ionic.bundle.css');
        expect(html).not.toContain('js/formbuilder-ionic.js');
        expect(html).not.toContain('vendor/jquery.min.js');
        expect(html).not.toContain('vendor/jquery-ui.min.js');
        expect(html).not.toContain('js/vendor-formbuilder.js');
        expect(html).not.toContain('code.jquery.com');
        expect(html).not.toContain('js/legacy-formbuilder.js');
        expect(html).not.toMatch(/bootstrap(\.min)?\.(css|js)|bootstrapcdn/i);
        expect(html).not.toContain('font-awesome.min.css');
        expect(html).not.toMatch(/font-?awesome/i);
    });

    it('hosts the print preview and loads its print styles', async () => {
        const html = await read('src/index.html');
        const theme = await read('src/theme/ionic-formbuilder.scss');

        expect(html).toContain('<div class="print-preview-wrapper"></div>');
        expect(theme).toContain("@use 'print';");
    });

    it('owns its markup instead of reproducing legacy hooks', async () => {
        const html = await read('src/index.html');

        expect(html).toContain('id="builder"');
        expect(html).toContain('id="tools"');
        expect(html).toContain('id="form-tabs"');
        expect(html).toContain('id="questions"');
        expect(html).toContain('id="properties"');
        expect(html).not.toContain('main__tabs');
        expect(html).not.toContain('inputs-collection');
        expect(html).not.toContain('data-form-index');
    });
});

describe('question catalogue', () => {
    it('keeps the 18 project-definition types in toolbar order', () => {
        expect(QUESTION_TYPES.map((question_type) => question_type.type)).toEqual([
            'text', 'integer', 'phone', 'date', 'time', 'dropdown', 'radio', 'checkbox',
            'searchsingle', 'textarea', 'readme', 'location', 'photo', 'audio', 'video',
            'barcode', 'branch', 'group'
        ]);
    });

    it('gives every type a label and an icon', () => {
        QUESTION_TYPES.forEach((question_type) => {
            expect(question_type.label.length).toBeGreaterThan(0);
            expect(question_type.icon.length).toBeGreaterThan(0);
        });
    });
});

describe('fixed markup views', () => {
    it('keeps the question toolbar in the view, in catalogue order', async () => {
        const html = await read('src/views/tools.html');
        const types = [...html.matchAll(/data-type="([^"]+)"/g)].map((match) => match[1]);

        expect(types).toEqual(QUESTION_TYPES.map((question_type) => question_type.type));
    });

    it('defines every advanced property control in the properties view', async () => {
        const html = await read('src/views/properties-card.html');
        const field_ids = new Set([...html.matchAll(/data-field="([^"]+)"/g)].map((match) => match[1]));

        QUESTION_TYPES.forEach((question_type) => {
            getAdvancedFields(question_type.type).forEach((field_id) => {
                expect(field_ids.has(field_id)).toBe(true);
            });
        });
    });

    it('links the title help to the docs instead of a modal', async () => {
        const properties = await read('src/views/properties-card.html');
        const questions = await read('src/views/question-card.html');
        const shell = await read('src/ui/shell.js');

        expect(properties).toContain('data-role="title-info"');
        expect(questions).toContain('data-role="title-info"');
        expect(properties).toContain('https://docs.epicollect.net/formbuilder/title');
        expect(questions).toContain('https://docs.epicollect.net/formbuilder/title');
        expect(properties).not.toContain('PLACEHOLDER-titles');
        expect(properties).not.toContain('data-toggle="modal"');
        expect(shell).not.toContain('openTitleInfo');
        expect(shell).not.toContain('title-info-body');
    });

    it('keeps the date and time format choices in the properties view', async () => {
        const html = await read('src/views/properties-card.html');

        expect(datetime_values(html, 'date')).toEqual(DATE_FORMATS.map((format) => format.value));
        expect(datetime_values(html, 'time')).toEqual(TIME_FORMATS.map((format) => format.value));
    });

    it('keeps the readme toolbar buttons in the view', async () => {
        const html = await read('src/views/readme-editor.html');
        const formats = [...html.matchAll(/data-format="([^"]+)"/g)].map((match) => match[1]);

        expect(formats).toEqual(['bold', 'italic', 'underline']);
    });

    it('gives every modal body a single root element', async () => {
        const bodies = [
            'src/views/form-name-modal-body.html',
            'src/views/csv-import-modal-body.html',
            'src/views/delete-question-modal-body.html'
        ];

        for (const path of bodies) {
            const template = document.createElement('template');

            template.innerHTML = (await read(path)).trim();
            expect(template.content.children, path).toHaveLength(1);
        }
    });

    it('keeps the form menu trigger in the view and its actions in the shell', async () => {
        const html = await read('src/views/question-card.html');
        const shell = await read('src/ui/shell.js');

        expect(html).toContain('data-role="form-actions-trigger"');
        expect(shell).toContain("label: 'Print form'");
    });
});

describe('build boundary', () => {
    it('builds stable app, ionic and vendor bundles with Vite', async () => {
        const config = await read('vite.config.js');

        expect(config).toContain("root: src_root");
        expect(config).toContain('fs: {');
        expect(config).toContain("allow: [repo_root]");
        expect(config).toContain("entryFileNames: 'js/[name].js'");
        expect(config).toContain("chunkFileNames: 'js/[name].js'");
        expect(config).toContain("return 'ionic'");
        expect(config).toContain("return 'vendor'");
        expect(config).not.toContain('[hash]');
        expect(config).not.toContain('legacy-formbuilder');
        expect(config).not.toContain("path.join(repo, 'js/app.js')");
        expect(config).not.toContain('esbuild');
    });

    it('bundles jQuery and jQuery UI from npm in the native entry', async () => {
        const entry = await read('src/app.js');
        const jquery_setup = await read('src/jquery.js');

        expect(entry).toContain("import './jquery.js'");
        expect(entry).toContain('jquery-ui/dist/jquery-ui.min.js');
        expect(entry).not.toContain('vendor/jquery');
        expect(jquery_setup).toContain("from 'jquery'");
    });

    it('keeps the legacy page served for comparison', async () => {
        const routes = await read('scripts/comparison-server.mjs');

        expect(routes).toContain('PUBLIC_PREFIX');
        expect(routes).toContain("COMPARISON_BASE + '/public/'");
        expect(routes).toContain('DEV_PROJECT_SAVE_PATH');
    });
});
