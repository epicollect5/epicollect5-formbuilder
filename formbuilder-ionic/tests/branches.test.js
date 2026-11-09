import { beforeEach, describe, expect, it } from 'vitest';
import { getInputs } from '@/models/project-definition.js';
import {
    addInput,
    canAddInput,
    enterInput,
    exitEditing,
    getCurrentForm,
    getCurrentInput,
    getCurrentInputs,
    getEditingTrail,
    getSession,
    insertInput,
    isEditing,
    removeInput,
    reorderInputs,
    selectForm,
    selectInput,
    setProject
} from '@/services/session.js';
import { renderApp } from '@/ui/shell.js';

function question(ref, type, text, extra) {
    return Object.assign({
        ref: ref,
        type: type,
        question: text,
        is_required: false,
        is_title: false,
        jumps: [],
        branch: [],
        group: []
    }, extra || {});
}

function project_definition() {
    return {
        data: {
            project: {
                name: 'Branch test',
                slug: 'branch-test',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Screening form',
                        type: 'hierarchy',
                        inputs: [
                            question('form_1_branch_1', 'branch', 'Household', {
                                branch: [
                                    question('form_1_branch_1_a', 'text', 'Name'),
                                    question('form_1_branch_1_b', 'group', 'Members', {
                                        group: [question('form_1_branch_1_b_a', 'integer', 'Age')]
                                    })
                                ]
                            }),
                            question('form_1_group_1', 'group', 'Visit', {
                                group: [question('form_1_group_1_a', 'integer', 'Count')]
                            }),
                            question('input_3', 'text', 'Top level')
                        ]
                    }
                ]
            }
        }
    };
}

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

function rows() {
    return [...document.querySelectorAll('#questions .builder__question')];
}

function open_tab(value) {
    const segment = document.querySelector('#properties .builder__property-tabs');
    segment.value = value;
    segment.dispatchEvent(new CustomEvent('ionChange', { detail: { value: value } }));
}

describe('branch and group model', () => {
    beforeEach(() => {
        setProject(project_definition());
    });

    it('enters a branch and scopes the current list to its children', () => {
        const branch = getCurrentInputs()[0];

        expect(enterInput(branch.ref)).toBe(branch);
        expect(isEditing()).toBe(true);
        expect(getEditingTrail().map((node) => node.ref)).toEqual([branch.ref]);
        expect(getCurrentInputs()).toHaveLength(2);
        expect(getSession().current_input_ref).toBeNull();
    });

    it('adds a child with one more ref segment', () => {
        const branch = getCurrentInputs()[0];

        enterInput(branch.ref);

        const child = insertInput('text', 0);

        expect(child.ref.startsWith(branch.ref + '_')).toBe(true);
        expect(child.ref.split('_').length).toBe(branch.ref.split('_').length + 1);
        expect(getCurrentInputs()).toHaveLength(3);
        expect(getInputs(getCurrentForm())).toHaveLength(3);
    });

    it('enters a nested group and adds a deeper child', () => {
        const branch = getCurrentInputs()[0];
        const group = branch.branch[1];

        enterInput(branch.ref);

        expect(enterInput(group.ref)).toBe(group);
        expect(getEditingTrail().map((node) => node.ref)).toEqual([branch.ref, group.ref]);

        const child = insertInput('text', 0);

        expect(child.ref.split('_').length).toBe(group.ref.split('_').length + 1);
        expect(group.group[0]).toBe(child);
    });

    it('refuses the nesting the legacy builder refuses', () => {
        const branch = getCurrentInputs()[0];
        const group = getCurrentInputs()[1];

        enterInput(branch.ref);

        expect(canAddInput('branch')).toBe(false);
        expect(canAddInput('group')).toBe(true);
        expect(insertInput('branch', 0)).toBeNull();
        expect(getCurrentInputs()).toHaveLength(2);

        exitEditing();
        enterInput(group.ref);

        expect(canAddInput('branch')).toBe(false);
        expect(canAddInput('group')).toBe(false);
        expect(canAddInput('text')).toBe(true);
        expect(addInput('group')).toBeNull();
        expect(addInput('text')).not.toBeNull();
    });

    it('reorders and removes inside the container only', () => {
        const branch = getCurrentInputs()[0];

        enterInput(branch.ref);

        const refs = getCurrentInputs().map((input) => input.ref);

        expect(reorderInputs([refs[1], refs[0]])).toBe(true);
        expect(branch.branch[0].ref).toBe(refs[1]);

        expect(removeInput('input_3')).toBe(false);
        expect(removeInput(refs[1])).toBe(true);
        expect(getCurrentInputs()).toHaveLength(1);
        expect(getInputs(getCurrentForm())).toHaveLength(3);
    });

    it('ignores a top-level ref while editing a container', () => {
        enterInput('form_1_branch_1');

        expect(selectInput('input_3')).toBeNull();
        expect(getSession().current_input_ref).toBeNull();
    });

    it('exits one level at a time and reselects the container', () => {
        const branch = getCurrentInputs()[0];
        const group = branch.branch[1];

        enterInput(branch.ref);
        enterInput(group.ref);
        exitEditing();

        expect(isEditing()).toBe(true);
        expect(getEditingTrail().map((node) => node.ref)).toEqual([branch.ref]);
        expect(getSession().current_input_ref).toBe(group.ref);

        exitEditing();

        expect(isEditing()).toBe(false);
        expect(getSession().current_input_ref).toBe(branch.ref);
        expect(getCurrentInputs()).toHaveLength(3);
    });

    it('clears the editing stack when the form changes', () => {
        enterInput('form_1_branch_1');
        selectForm(0);

        expect(isEditing()).toBe(false);
        expect(getSession().editing).toEqual([]);
    });
});

describe('branch and group rows', () => {
    beforeEach(() => {
        build_markup();
        setProject(project_definition());
        renderApp();
    });

    it('keeps container editing in the properties panel, not the row', () => {
        expect(rows()[0].querySelector('.builder__question-count')).toBeNull();
        expect(rows()[0].querySelector('.builder__question-enter')).toBeNull();

        rows()[0].click();

        const branch_edit = document.querySelector('#properties [data-role="edit-container"]');

        expect(branch_edit.hidden).toBe(false);
        expect(branch_edit.disabled).toBe(false);
        expect(branch_edit.textContent).toContain('Edit Branch');
        expect(branch_edit.querySelector('ion-icon[name="create"]')).not.toBeNull();

        rows()[1].click();

        const group_edit = document.querySelector('#properties [data-role="edit-container"]');

        expect(group_edit.textContent).toContain('Edit Group');

        rows()[2].click();

        expect(document.querySelector('#properties [data-role="edit-container"]')).toBeNull();
    });

    it('disables Edit while a branch or group header is empty', () => {
        rows()[0].click();

        const field = document.querySelector('#properties .builder__question-field');
        const edit = document.querySelector('#properties [data-role="edit-container"]');

        field.value = '';
        field.dispatchEvent(new CustomEvent('ionInput', { detail: { value: '' } }));

        expect(edit.disabled).toBe(true);

        field.value = 'Household';
        field.dispatchEvent(new CustomEvent('ionInput', { detail: { value: 'Household' } }));

        expect(edit.disabled).toBe(false);
    });

    it('enters a branch and shows its children plus a breadcrumb', () => {
        rows()[0].click();
        document.querySelector('#properties [data-role="edit-container"]').click();

        expect(isEditing()).toBe(true);
        expect(rows()).toHaveLength(2);
        expect(rows()[0].querySelector('.builder__question-text').textContent).toBe('Name');

        const title = document.querySelector('#questions .builder__questions-title');

        expect(title.textContent).toContain('Screening form');
        expect(title.querySelector('.builder__questions-title-crumb.is-current').textContent).toBe('Household');

        const exit = document.querySelector('#questions [data-role="exit-editing"]');

        expect(exit).not.toBeNull();
        expect(exit.textContent).toContain('Exit Editing');
        expect(document.querySelector('#questions [data-role="editing-status"] .question-state')).not.toBeNull();

        const branch_tool = [...document.querySelectorAll('#tools .builder__tool')]
            .find((tool) => tool.getAttribute('data-type') === 'branch');

        expect(branch_tool.hidden).toBe(true);
        expect(document.querySelector('#form-tabs .builder__forms-segment').disabled).toBe(true);
    });

    it('shows Branch and Group tools only where the active container allows them', () => {
        const tool = (type) => {
            return [...document.querySelectorAll('#tools .builder__tool')]
                .find((candidate) => candidate.getAttribute('data-type') === type);
        };
        const expect_visible = (type, visible) => {
            expect(tool(type).hidden).toBe(!visible);
            expect(tool(type).disabled).toBe(!visible);
        };

        expect_visible('branch', true);
        expect_visible('group', true);

        rows()[0].click();
        document.querySelector('#properties [data-role="edit-container"]').click();

        expect_visible('branch', false);
        expect_visible('group', true);

        rows()[1].click();
        document.querySelector('#properties [data-role="edit-container"]').click();

        expect_visible('branch', false);
        expect_visible('group', false);

        document.querySelector('#questions [data-role="exit-editing"]').click();

        expect_visible('branch', false);
        expect_visible('group', true);

        document.querySelector('#questions [data-role="exit-editing"]').click();

        expect_visible('branch', true);
        expect_visible('group', true);
    });

    it('edits a nested group inside its branch', () => {
        rows()[0].click();
        document.querySelector('#properties [data-role="edit-container"]').click();
        rows()[1].click();
        document.querySelector('#properties [data-role="edit-container"]').click();

        expect(getEditingTrail().map((node) => node.question)).toEqual(['Household', 'Members']);
        expect(rows()).toHaveLength(1);
        expect(document.querySelector('#questions .builder__questions-title-crumb.is-current').textContent).toBe('Members');
        expect(document.querySelector('#questions [data-role="exit-editing"]')).not.toBeNull();
    });

    it('warns about a missing title inside a group with questions', () => {
        rows()[1].click();
        document.querySelector('#properties [data-role="edit-container"]').click();

        // a group starts with a question, so the warning shows
        const warning = document.querySelector('#questions [data-role="title-warning"]');

        expect(warning.hidden).toBe(false);
        expect(warning.textContent).toContain('No title set for this group yet');
    });

    it('labels form uniqueness as branch-scoped inside a branch', async () => {
        rows()[0].click();
        document.querySelector('#properties [data-role="edit-container"]').click();
        rows()[0].click();

        expect(getSession().current_input_ref).toBe('form_1_branch_1_a');
        open_tab('advanced');
        const uniqueness = document.querySelector('#properties [data-field="uniqueness"] .dropdown');
        expect(uniqueness).not.toBeNull();
        uniqueness.querySelector('.dropdown__trigger').click();
        const form_option = uniqueness.querySelector('.dropdown__option[data-value="form"]');
        expect(form_option).not.toBeNull();
        expect(form_option.textContent.trim())
            .toBe('Make answer unique to all Household entries of a Screening form entry');
    });

    it('disables the Jumps tab for questions inside a group', () => {
        rows()[1].click();
        document.querySelector('#properties [data-role="edit-container"]').click();
        rows()[0].click();

        const jumps_tab = document.querySelector('#properties .builder__property-tabs ion-segment-button[value="jumps"]');

        expect(jumps_tab.hasAttribute('disabled')).toBe(true);

        const segment = document.querySelector('#properties .builder__property-tabs');

        segment.dispatchEvent(new CustomEvent('ionChange', { detail: { value: 'jumps' } }));

        expect(document.querySelector('#property-content-jumps').getAttribute('aria-hidden')).toBe('true');
    });

    it('keeps the Jumps tab on the branch parent for an always jump', () => {
        rows()[0].click();

        const jumps_tab = document.querySelector('#properties .builder__property-tabs ion-segment-button[value="jumps"]');

        expect(jumps_tab.hasAttribute('disabled')).toBe(false);

        open_tab('jumps');

        document.querySelector('#properties [data-role="jumps-add"], #properties .builder__add-jump').click();

        const jump = getCurrentInput().jumps[0];

        expect(jump).toEqual({ to: '', when: 'ALL', answer_ref: null });
    });

    it('exits back to the form list and reselects the branch', () => {
        const branch_ref = rows()[0].getAttribute('data-input-ref');

        rows()[0].click();
        document.querySelector('#properties [data-role="edit-container"]').click();
        document.querySelector('#questions [data-role="exit-editing"]').click();

        expect(isEditing()).toBe(false);
        expect(rows()).toHaveLength(3);
        expect(getSession().current_input_ref).toBe(branch_ref);
        expect(document.querySelector('#questions [data-role="exit-editing"]')).toBeNull();
        expect(document.querySelector('#questions [data-role="editing-toolbar"]')).toBeNull();
    });

    it('shows the container empty state', () => {
        enterInput('form_1_branch_1');
        removeInput('form_1_branch_1_a');
        removeInput('form_1_branch_1_b');
        renderApp();

        expect(document.querySelector('#questions .builder__empty').textContent)
            .toBe('No questions in this branch yet.');
        expect(document.querySelectorAll('#questions .builder__question')).toHaveLength(0);

        const warning = document.querySelector('#questions [data-role="title-warning"]');

        // an empty list has nothing to title, so the warning waits for a question
        expect(warning.hidden).toBe(true);
    });

    it('hides the branch no-title well when a branch child is checked as title', () => {
        rows()[0].click();
        document.querySelector('#properties [data-role="edit-container"]').click();

        const warning = () => document.querySelector('#questions [data-role="title-warning"]');

        expect(warning().hidden).toBe(false);
        expect(warning().textContent).toContain('No title set for this branch yet');

        document.querySelectorAll('#questions .builder__question')[0].click();

        const toggle = [...document.querySelectorAll('#properties ion-checkbox')]
            .find((box) => box.textContent.indexOf('Use answer as title') !== -1);

        expect(toggle).not.toBeUndefined();

        toggle.checked = true;
        toggle.dispatchEvent(new CustomEvent('ionChange', { detail: { checked: true } }));

        expect(getCurrentInput().is_title).toBe(true);
        expect(warning().hidden).toBe(true);
    });
});
