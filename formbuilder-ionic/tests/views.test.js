import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { QUESTION_TYPES } from '@/models/question-types.js';

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
