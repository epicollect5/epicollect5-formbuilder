import { beforeEach, describe, expect, it } from 'vitest';
import { getInputs } from '@/models/project-definition.js';
import {
    addInput,
    canAddInput,
    enterInput,
    exitEditing,
    getCurrentForm,
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
        '<span id="project-name"><img id="project-logo" alt=""><span class="builder-bar__project-name"></span></span>',
        '<button type="button" data-action="back"></button>',
        '<button type="button" data-action="exit"></button>',
        '<section id="tools"></section>',
        '<nav id="form-tabs" role="tablist"><ion-segment class="builder__forms-segment" value="0" scrollable="true"></ion-segment></nav>',
        '<button type="button" id="add-form">Add form</button>',
        '<button type="button" id="undo" disabled>Undo</button>',
        '<button type="button" id="save" disabled>Save project</button>',
        '<section id="questions"></section>',
        '<section id="properties"></section>'
    ].join('');
}

function rows() {
    return [...document.querySelectorAll('#questions .builder__question')];
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

    it('labels a container row with its child count and an edit control', () => {
        expect(rows()[0].querySelector('.builder__question-count').textContent).toBe('2');
        expect(rows()[1].querySelector('.builder__question-count').textContent).toBe('1');
        expect(rows()[0].querySelector('.builder__question-enter').getAttribute('aria-label'))
            .toBe('Edit branch: Household');
        expect(rows()[1].querySelector('.builder__question-enter').getAttribute('aria-label'))
            .toBe('Edit group: Visit');
        expect(rows()[2].querySelector('.builder__question-enter')).toBeNull();
    });

    it('enters a branch and shows its children plus a breadcrumb', () => {
        rows()[0].querySelector('.builder__question-enter').click();

        expect(isEditing()).toBe(true);
        expect(rows()).toHaveLength(2);
        expect(rows()[0].querySelector('.builder__question-text').textContent).toBe('Name');

        const title = document.querySelector('#questions .builder__questions-title');

        expect(title.textContent).toContain('Screening form');
        expect(title.querySelector('.builder__questions-title-crumb.is-current').textContent).toBe('Household');

        const exit = document.querySelector('#questions .builder__questions-exit');

        expect(exit.hidden).toBe(false);
        expect(exit.textContent).toContain('Back to form');

        const branch_tool = [...document.querySelectorAll('#tools .builder__tool')]
            .find((tool) => tool.getAttribute('data-type') === 'branch');

        expect(branch_tool.hidden).toBe(true);
        expect(document.querySelector('#form-tabs .builder__forms-segment').disabled).toBe(true);
    });

    it('edits a nested group inside its branch', () => {
        rows()[0].querySelector('.builder__question-enter').click();
        rows()[1].querySelector('.builder__question-enter').click();

        expect(getEditingTrail().map((node) => node.question)).toEqual(['Household', 'Members']);
        expect(rows()).toHaveLength(1);
        expect(document.querySelector('#questions .builder__questions-title-crumb.is-current').textContent).toBe('Members');
        expect(document.querySelector('#questions .builder__questions-exit').textContent).toContain('Back to branch');
    });

    it('labels form uniqueness as branch-scoped inside a branch', () => {
        rows()[0].querySelector('.builder__question-enter').click();
        rows()[0].click();

        expect(getSession().current_input_ref).toBe('form_1_branch_1_a');
        expect(document.querySelector('#properties ion-select-option[value="form"]').textContent)
            .toBe('Unique within this branch');
    });

    it('exits back to the form list and reselects the branch', () => {
        const branch_ref = rows()[0].getAttribute('data-input-ref');

        rows()[0].querySelector('.builder__question-enter').click();
        document.querySelector('#questions .builder__questions-exit').click();

        expect(isEditing()).toBe(false);
        expect(rows()).toHaveLength(3);
        expect(getSession().current_input_ref).toBe(branch_ref);
        expect(document.querySelector('#questions .builder__questions-exit').hidden).toBe(true);
        expect(document.querySelector('#properties .builder__properties-title').textContent).toBe('Household');
    });

    it('shows the container empty state', () => {
        enterInput('form_1_branch_1');
        removeInput('form_1_branch_1_a');
        removeInput('form_1_branch_1_b');
        renderApp();

        expect(document.querySelector('#questions .builder__empty').textContent)
            .toBe('No questions in this branch yet.');
        expect(document.querySelectorAll('#questions .builder__question')).toHaveLength(0);
    });
});
