import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { QUESTION_TYPES } from '@/models/question-types.js';
import { DATE_FORMATS, REGEX_PRESETS, TIME_FORMATS } from '@/models/input-properties.js';
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
    it('loads the Ionic bundle and the vendored jQuery runtime', async () => {
        const html = await read('src/index.html');

        expect(html).toContain('vendor/ionic/css/ionic.bundle.css');
        expect(html).toContain('js/formbuilder-ionic.js');
        expect(html).toContain('vendor/jquery.min.js');
        expect(html).toContain('vendor/jquery-ui.min.js');
        expect(html).not.toContain('js/vendor-formbuilder.js');
        expect(html).not.toContain('code.jquery.com');
        expect(html).not.toContain('js/legacy-formbuilder.js');
        expect(html).not.toMatch(/bootstrap(\.min)?\.(css|js)|bootstrapcdn/i);
        expect(html).not.toContain('font-awesome.min.css');
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

    it('keeps the regex presets in the properties view', async () => {
        const html = await read('src/views/properties-card.html');
        const keys = [...html.matchAll(/data-preset="([^"]+)"/g)].map((match) => match[1]);

        expect(keys).toEqual(REGEX_PRESETS.map((preset) => preset.key));
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
});

describe('build boundary', () => {
    it('bundles only the native entry for the Ionic build', async () => {
        const build = await read('scripts/build.mjs');

        expect(build).toContain("entryPoints: { 'formbuilder-ionic': path.join(root, 'src/app.js') }");
        expect(build).not.toContain('legacy-formbuilder');
        expect(build).not.toContain("path.join(repo, 'js/app.js')");
    });

    it('keeps the legacy page served for comparison', async () => {
        const build = await read('scripts/build.mjs');

        expect(build).toContain("prefix: '/epicollect5-formbuilder/public/'");
    });
});
