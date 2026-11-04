import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

function read(relative_path) {
    return readFile(new URL('../' + relative_path, import.meta.url), 'utf8');
}

describe('Ionic shell', () => {
    it('loads Ionic, the prototype bundle and the legacy bundle without Bootstrap or Font Awesome', async () => {
        const html = await read('src/index.html');

        expect(html).toContain('vendor/ionic/css/ionic.bundle.css');
        expect(html).toContain('js/formbuilder-ionic.js');
        expect(html).toContain('js/legacy-formbuilder.js');
        expect(html.indexOf('js/formbuilder-ionic.js')).toBeLessThan(html.indexOf('js/legacy-formbuilder.js'));
        expect(html).not.toMatch(/bootstrap(\.min)?\.(css|js)|bootstrapcdn/i);
        expect(html).not.toContain('font-awesome.min.css');
    });

    it('keeps every hook the legacy boot code queries', async () => {
        const html = await read('src/index.html');

        expect(html).toContain('id="formbuilder-version"');
        expect(html).toContain('class="navbar hidden formbuilder-navbar"');
        expect(html).toContain('class="container-fluid hidden"');
        expect(html).toContain('class="main__tabs nav nav-tabs"');
        expect(html).toContain('data-form-index="0"');
        expect(html).toContain('class="main__tabs-btns"');
        expect(html).toContain('main__tabs__undo-btn');
        expect(html).toContain('main__tabs__save-project-btn');
        expect(html).toContain('class="main__modal--edit-form-name modal fade"');
        expect((html.match(/class="modal fade"/g) || [])).toHaveLength(5);
        expect(html).toContain('main__tabs-content');
        expect(html).toContain('class="inputs-collection"');
        expect(html).toContain('class="input-properties"');
        expect(html).toContain('id="info-title"');
        expect(html).toContain('id="info-regex"');
        expect(html).toContain('id="info-import-form"');
        expect(html).toContain('id="csv-import-possible_answers"');
        expect(html).toContain('id="warning-delete-question"');
        expect(html).toContain('total-entries');
        expect(html).toContain('project-definition-version');
    });
});

describe('container views', () => {
    it('keeps the toolbar project hooks', async () => {
        const html = await read('src/views/containers/navbar.html');

        expect(html).toContain('class="navbar-back-button');
        expect(html).toContain('navbar-project-name');
        expect(html).toContain('<span>{Project name}</span>');
        expect(html).toContain('navbar-exit-button');
    });

    it('offers all 18 legacy question tools with their data types', async () => {
        const html = await read('src/views/containers/inputs-tools.html');
        const types = Array.from(html.matchAll(/data-type="([^"]+)"/g)).map((match) => match[1]);

        expect(types).toEqual([
            'text', 'integer', 'phone', 'date', 'time', 'dropdown', 'radio', 'checkbox',
            'searchsingle', 'textarea', 'readme', 'location', 'photo', 'audio', 'video',
            'barcode', 'branch', 'group'
        ]);
        expect(html).toContain('id="inputs-tools-list"');
    });

    it('keeps the collection panel, sortable body and accessible action menu', async () => {
        const html = await read('src/views/containers/inputs-collection.html');

        expect(html).toContain('class="panel panel-default"');
        expect(html).toContain('class="panel-body sortable"');
        expect(html).toContain('inputs-collection__header__edit-state');
        expect(html).toContain('inputs-collection__header__element-name');
        expect(html).toContain('inputs-collection__buttons');
        expect(html).toContain('data-toggle="dropdown"');
        expect(html).toContain('inputs-collection__export-form');
        expect(html).toContain('inputs-collection__print-as-pdf');
        expect(html).toContain('inputs-collection__delete-all-questions');
        expect(html).toContain('inputs-collection__form-import');
        expect(html).toContain('no-form-title-set');
        expect(html).toContain('input-properties__no-questions-message');
    });

    it('keeps the properties wrapper as a div so legacy form lookups still match', async () => {
        const html = await read('src/views/containers/inputs-properties.html');

        expect(html).toContain('class="panel-body input_properties__forms_wrapper"');
        expect(html).not.toContain('<ion-card-content class="panel-body input_properties__forms_wrapper"');
        expect(html).toContain('input-properties__buttons--copy-input');
        expect(html).toContain('input-properties__buttons--remove-input');
        expect(html).toContain('input-properties__buttons--validate-input');
        expect(html).toContain('input-properties__no-input-selected');
        expect(html).toContain('question-preview');
    });
});

describe('partial views', () => {
    const partials = [
        'basic-properties.html',
        'basic-media-properties.html',
        'basic-branch-properties.html',
        'basic-group-properties.html',
        'basic-readme-properties.html',
        'exit-branchgroup-editing.html',
        'input-tool.html',
        'jump-list-item.html',
        'jump-list-item-always-jump.html',
        'jumps-wrapper.html',
        'modal-form.html',
        'nav-tabs.html',
        'possible-answer-list-item.html',
        'possible-answers-wrapper.html',
        'uniqueness-branch-checkbox.html',
        'uniqueness-form-checkbox.html',
        'uniqueness-hierarchy-checkboxes.html'
    ];

    it('loads every partial the legacy loader requests', async () => {
        for (const partial of partials) {
            const html = await read('src/views/partials/' + partial);

            expect(html.length).toBeGreaterThan(0);
        }
    });

    it('keeps template placeholders and hook classes used by the template layer', async () => {
        const basic = await read('src/views/partials/basic-properties.html');
        expect(basic).toContain('{{basic-input-ref}}');
        expect(basic).toContain('{{required-flag-checked}}');
        expect(basic).toContain('{{title-flag-checked}}');
        expect(basic).toContain('{{checkbox-title-label}}');
        expect(basic).toContain('{{possible-answers}}');

        const answers = await read('src/views/partials/possible-answers-wrapper.html');
        expect(answers).toContain('{{possible-answers-list}}');
        expect(answers).toContain('{{disabled}}');
        expect(answers).toContain('input-properties__form__possible-answers__list');
        expect(answers).toContain('possible-answer');

        const jumps = await read('src/views/partials/jumps-wrapper.html');
        expect(jumps).toContain('{{jumps-input-ref}}');
        expect(jumps).toContain('{{jumps-list}}');

        const modal = await read('src/views/partials/modal-form.html');
        expect(modal).toContain('main__modal--edit-form-name__save-btn');
        expect(modal).toContain('data-dismiss="modal"');
        expect(modal).toContain('class="modal-body"');
    });

    it('uses accessible tab and menu semantics', async () => {
        const tabs = await read('src/views/partials/nav-tabs.html');
        expect(tabs).toContain('role="tablist"');
        expect(tabs).toContain('role="tab"');
        expect(tabs).toContain('{{advanced-tab-btn}}');
        expect(tabs).toContain('{{jumps-tab-btn}}');

        const answers = await read('src/views/partials/possible-answers-wrapper.html');
        expect(answers).toContain('role="menu"');
        expect(answers).toContain('role="menuitem"');
        expect(answers).toContain('aria-expanded="false"');
    });
});

describe('theme', () => {
    it('centers the project identity in the toolbar', async () => {
        const layout = await read('src/theme/_layout.scss');

        expect(layout).toContain('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);');
        expect(layout).toContain('justify-self: center;');
        expect(layout).toContain('color: #ffffff;');
    });

    it('uses the larger base typography', async () => {
        const reset = await read('src/theme/_reset.scss');
        const controls = await read('src/theme/_controls.scss');
        const panels = await read('src/theme/_panels.scss');
        const tabs = await read('src/theme/_tabs.scss');

        expect(reset).toContain('font-size: 16px;');
        expect(controls).toContain('font-size: 15px;');
        expect(controls).toContain('font-size: 16px;');
        expect(panels).toMatch(/\.panel\s*\{[^}]*font-size:\s*16px;/);
        expect(panels).toContain('font-size: 16px;');
        expect(tabs).toContain('font-size: 15px;');
        expect(tabs).toContain('font-size: 14px;');
    });

    it('uses larger uppercase labels for the toolbar actions', async () => {
        const layout = await read('src/theme/_layout.scss');

        expect(layout).toMatch(/\.navbar-button-label\s*\{[^}]*font-size:\s*17px;[^}]*text-transform:\s*uppercase;/);
    });

    it('keeps dragged input tiles the same size as resting tiles', async () => {
        const inputs = await read('src/theme/_inputs.scss');

        expect(inputs).toContain('.input.ui-draggable-dragging');
        expect(inputs).toContain('box-sizing: content-box;');
        expect(inputs).toContain('height: auto !important;');
        expect(inputs).not.toContain('transform: rotate(0.4deg);');
    });

    it('uses the app palette secondary role for action buttons', async () => {
        const controls = await read('src/theme/_controls.scss');
        const palette = await read('src/theme/_palette.scss');

        expect(controls).toContain('background: var(--ion-color-secondary);');
        expect(controls).toContain('color: var(--ion-color-secondary-contrast);');
        expect(controls).not.toContain('background: var(--ion-color-primary);');
        expect(palette).toContain('--ion-color-secondary: #87C7A6;');
        expect(palette).toContain('--ion-color-secondary-contrast: #000000;');
    });

    it('derives text and border colours from the app palette', async () => {
        const tokens = await read('src/theme/_tokens.scss');
        const palette = await read('src/theme/_palette.scss');

        expect(tokens).toContain('--fb-text: var(--app-text, #333333);');
        expect(tokens).toContain('--fb-surface: var(--app-surface, #ffffff);');
        expect(tokens).toContain('--fb-muted: #777777;');
        expect(tokens).toContain('--fb-border: var(--app-border, #dddddd);');
        expect(tokens).toContain('--fb-border-strong: var(--app-border, #dddddd);');
        expect(tokens).toContain('--ion-text-color: var(--app-text, #333333);');
        expect(palette).toContain('--app-text: #333333;');
        expect(palette).toContain('--app-border: #dddddd;');
        expect(palette).toContain('--app-surface-muted: #f5f5f5;');
    });

    it('hides advanced property sections outside the Advanced tab', async () => {
        const tabs = await read('src/theme/_tabs.scss');

        expect(tabs).toContain('.input-properties__tabs__content > .input-properties__form__advanced-properties:not(.tab-pane)');
        expect(tabs).toContain('.input-properties__form__advanced-properties.active:not(.tab-pane)');
        expect(tabs).toContain('display: flex;');
    });

    it('keeps both editor panel headers the same height', async () => {
        const panels = await read('src/theme/_panels.scss');

        expect(panels).toContain('.inputs-collection .panel-heading,');
        expect(panels).toContain('.input-properties > .panel > .panel-heading');
        expect(panels).toContain('min-height: 51px;');
    });

    it('keeps the triple-column editor layout', async () => {
        const layout = await read('src/theme/_layout.scss');

        expect(layout).toContain('.main__tabs-content.tab-content > .main__tabs-content-tabpanel.tab-pane.active');
        expect(layout).toContain('grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);');
        expect(layout).toContain('grid-template-columns: minmax(0, 2fr) minmax(0, 10fr);');
    });

    it('is built from Ionic tokens and does not import Bootstrap', async () => {
        const theme = await read('src/theme/ionic-formbuilder.scss');
        const tokens = await read('src/theme/_tokens.scss');

        expect(theme).toContain("@use 'tokens'");
        expect(tokens).toContain('--ion-color-primary');
        expect(tokens).toContain('--ion-font-family');
        expect(theme).not.toContain('bootstrap');
    });
});
