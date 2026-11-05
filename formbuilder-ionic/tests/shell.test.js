import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentForm, getCurrentInput, getCurrentInputs, getSession, setProject } from '@/services/session.js';
import { UNDO_THROTTLE_MS } from '@/services/undo.js';
import { renderApp } from '@/ui/shell.js';

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
                name: 'Test mapping issue',
                slug: 'test-mapping-issue',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Screening form',
                        type: 'hierarchy',
                        inputs: [
                            {
                                ref: 'input_1',
                                type: 'radio',
                                question: 'Do you have children',
                                is_required: false,
                                is_title: false,
                                possible_answers: [
                                    { answer: 'Yes', answer_ref: 'answer_1' },
                                    { answer: 'No', answer_ref: 'answer_2' }
                                ]
                            },
                            { ref: 'input_2', type: 'text', question: 'Your name', is_required: false, is_title: false }
                        ]
                    },
                    { ref: 'form_2', name: 'Second form', type: 'hierarchy', inputs: [] }
                ]
            }
        }
    };
}

function valid_text_input(form_ref, ref, question) {
    return {
        ref: form_ref + '_' + ref,
        type: 'text',
        question: question,
        is_title: false,
        is_required: false,
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
    };
}

function savable_project() {
    const project = project_definition();
    const forms = project.data.project.forms;

    forms[0].inputs = [valid_text_input('form_1', 'input_1', 'Screening question')];
    forms[1].inputs = [valid_text_input('form_2', 'input_2', 'Second question')];

    return project;
}

function select_first_question() {
    document.querySelectorAll('#questions .builder__question')[0].click();
}

function answer_rows() {
    return [...document.querySelectorAll('#properties .builder__answer')];
}

describe('builder shell', () => {
    beforeEach(() => {
        build_markup();
        setProject(project_definition());
        renderApp();
    });

    it('shows the project name and one tab per form', () => {
        expect(document.getElementById('project-name').textContent).toBe('Test mapping issue');

        const tabs = document.querySelectorAll('#form-tabs .builder__form-tab');

        expect(tabs).toHaveLength(2);
        expect(tabs[0].textContent).toBe('Screening form');
        expect(tabs[0].getAttribute('aria-selected')).toBe('true');
        expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    });

    it('keeps the builder chrome', () => {
        expect(document.querySelector('[data-action="back"]')).not.toBeNull();
        expect(document.querySelector('[data-action="exit"]')).not.toBeNull();
        expect(document.getElementById('add-form')).not.toBeNull();
        expect(document.getElementById('undo').disabled).toBe(true);
        expect(document.getElementById('save').disabled).toBe(true);
    });

    it('shows the project logo beside the project name', () => {
        const logo = document.getElementById('project-logo');

        expect(document.getElementById('project-name').textContent).toBe('Test mapping issue');
        expect(logo.src).toContain('api/internal/media/test-mapping-issue');
    });

    it('puts the form actions in the questions heading', () => {
        const actions = document.querySelectorAll('#questions .builder__heading-actions .builder__form-action-btn');

        expect(actions).toHaveLength(3);
        // The root form cannot be deleted; rename and the menu are available.
        expect([...actions].map((action) => action.disabled)).toEqual([true, false, false]);
    });

    it('lists the current form questions', () => {
        const rows = document.querySelectorAll('#questions .builder__question');

        expect(rows).toHaveLength(2);
        expect(rows[0].querySelector('.builder__question-text').textContent).toBe('Do you have children');
        expect(rows[1].querySelector('.builder__question-text').textContent).toBe('Your name');
        expect(document.querySelectorAll('#tools .builder__tool')).toHaveLength(18);
        expect(rows[0].getAttribute('data-input-ref')).toBe('input_1');
        expect(rows[0].querySelectorAll('.builder__question-type-icon ion-icon')).toHaveLength(1);
        expect(rows[0].querySelector('.builder__question-status .question-state')).not.toBeNull();
    });

    it('selects a question and opens its properties', () => {
        const rows = document.querySelectorAll('#questions .builder__question');

        rows[1].click();

        expect(getSession().current_input_ref).toBe('input_2');
        expect(getCurrentInput().question).toBe('Your name');
        expect(rows[1].getAttribute('aria-current')).toBe('true');
        expect(rows[0].getAttribute('aria-current')).toBe('false');
        expect(document.querySelector('#properties ion-input').value).toBe('Your name');
    });

    it('shows working copy and validate actions plus a working delete', () => {
        select_first_question();

        const buttons = [...document.querySelectorAll('#properties .builder__heading-actions button')];

        expect(buttons).toHaveLength(3);
        expect(buttons[0].disabled).toBe(false);
        expect(buttons[1].disabled).toBe(false);
        expect(buttons[2].disabled).toBe(false);
        expect(buttons[2].classList.contains('builder__icon-btn--danger')).toBe(true);
    });

    it('adds a question from the tools and selects it', () => {
        const tools = [...document.querySelectorAll('#tools .builder__tool')];

        tools.find((tool) => tool.getAttribute('data-type') === 'radio').click();

        const inputs = getCurrentInputs();

        expect(inputs).toHaveLength(3);
        expect(inputs[2].type).toBe('radio');
        expect(getSession().current_input_ref).toBe(inputs[2].ref);
        expect(document.querySelectorAll('#questions .builder__question')).toHaveLength(3);
        expect(document.querySelector('#questions .builder__question[aria-current="true"] .builder__question-text').textContent).toBe('Untitled question');
    });

    it('deletes the selected question after confirmation', () => {
        select_first_question();
        document.querySelector('#properties .builder__icon-btn--danger').click();

        expect(getCurrentInputs()).toHaveLength(2);

        document.querySelector('ion-alert').buttons[1].handler();

        expect(getCurrentInputs()).toHaveLength(1);
        expect(getSession().current_input_ref).toBeNull();
        expect(document.querySelectorAll('#questions .builder__question')).toHaveLength(1);
        expect(document.querySelector('#properties .builder__empty')).not.toBeNull();
    });

    it('enables save only when every form is valid and filled', () => {
        expect(document.getElementById('save').disabled).toBe(true);

        setProject(savable_project());
        renderApp();

        expect(document.getElementById('save').disabled).toBe(false);
    });

    it('warns before unload once the project changed', () => {
        const clean = new Event('beforeunload', { cancelable: true });

        window.dispatchEvent(clean);
        expect(clean.defaultPrevented).toBe(false);

        [...document.querySelectorAll('#tools .builder__tool')]
            .find((tool) => tool.getAttribute('data-type') === 'text')
            .click();

        const dirty = new Event('beforeunload', { cancelable: true });

        window.dispatchEvent(dirty);
        expect(dirty.defaultPrevented).toBe(true);
    });

    it('marks an invalid form in the tab strip', () => {
        const tabs = document.querySelectorAll('#form-tabs .builder__form-tab');

        expect(tabs[0].querySelector('.builder__form-tab-state')).toBeNull();
        expect(tabs[1].querySelector('.builder__form-tab-state')).not.toBeNull();
        expect(tabs[1].getAttribute('aria-label')).toBeNull();
    });

    it('adds a form and switches to it', () => {
        document.getElementById('add-form').click();

        expect(getSession().current_form_index).toBe(2);
        expect(document.querySelectorAll('#form-tabs .builder__form-tab')).toHaveLength(3);
        expect(document.querySelectorAll('#form-tabs .builder__form-tab')[2].getAttribute('aria-selected')).toBe('true');
        expect(document.querySelector('#questions .builder__empty')).not.toBeNull();
    });

    it('switches form and clears the selection', () => {
        select_first_question();
        document.querySelectorAll('#form-tabs .builder__form-tab')[1].click();

        expect(getSession().current_form_index).toBe(1);
        expect(getSession().current_input_ref).toBeNull();
        expect(document.querySelector('#questions .builder__empty')).not.toBeNull();
        expect(document.querySelector('#properties .builder__empty')).not.toBeNull();
    });
});

describe('possible answers', () => {
    beforeEach(() => {
        build_markup();
        setProject(project_definition());
        renderApp();
        select_first_question();
    });

    it('lists the answers of a multiple-answer question', () => {
        const fields = [...document.querySelectorAll('#properties .builder__answer ion-input')];

        expect(answer_rows()).toHaveLength(2);
        expect(fields.map((field) => field.value)).toEqual(['Yes', 'No']);
        expect(document.querySelector('#properties .builder__add-answer')).not.toBeNull();
    });

    it('does not list answers for a single-answer question', () => {
        document.querySelectorAll('#questions .builder__question')[1].click();

        expect(answer_rows()).toHaveLength(0);
        expect(document.querySelector('#properties .builder__add-answer')).toBeNull();
    });

    it('adds a placeholder answer', () => {
        document.querySelector('#properties .builder__add-answer').click();

        const answers = getCurrentInput().possible_answers;

        expect(answers).toHaveLength(3);
        expect(answers[2].answer).toBe('I am a placeholder answer');
        expect(answer_rows()).toHaveLength(3);
    });

    it('renames an answer in place', () => {
        const field = document.querySelector('#properties .builder__answer ion-input');

        field.value = 'Yep';
        field.dispatchEvent(new CustomEvent('ionInput', { detail: { value: 'Yep' } }));

        expect(getCurrentInput().possible_answers[0].answer).toBe('Yep');
    });

    it('removes an answer and disables removing the last one', () => {
        answer_rows()[0].querySelector('.builder__answer-remove').click();

        expect(getCurrentInput().possible_answers.map((answer) => answer.answer)).toEqual(['No']);
        expect(answer_rows()).toHaveLength(1);

        const remove_button = answer_rows()[0].querySelector('.builder__answer-remove');

        expect(remove_button.disabled).toBe(true);
        remove_button.click();
        expect(getCurrentInput().possible_answers).toHaveLength(1);
    });
});

describe('undo', () => {
    beforeEach(() => {
        build_markup();
        setProject(project_definition());
        renderApp();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts disabled and restores the question list after an add', () => {
        const undo_button = document.getElementById('undo');

        expect(undo_button.disabled).toBe(true);

        [...document.querySelectorAll('#tools .builder__tool')]
            .find((tool) => tool.getAttribute('data-type') === 'text')
            .click();

        expect(getCurrentInputs()).toHaveLength(3);
        expect(undo_button.disabled).toBe(false);

        undo_button.click();

        expect(getCurrentInputs()).toHaveLength(2);
        expect(document.querySelectorAll('#questions .builder__question')).toHaveLength(2);
        expect(undo_button.disabled).toBe(true);
    });

    it('restores a deleted question', () => {
        select_first_question();
        document.querySelector('#properties .builder__icon-btn--danger').click();
        document.querySelector('ion-alert').buttons[1].handler();

        expect(getCurrentInputs()).toHaveLength(1);

        document.getElementById('undo').click();

        expect(getCurrentInputs()).toHaveLength(2);
        expect(getCurrentInputs()[0].question).toBe('Do you have children');
    });

    it('clamps the form index when an added form is undone', () => {
        document.getElementById('add-form').click();

        expect(getSession().current_form_index).toBe(2);

        document.getElementById('undo').click();

        expect(document.querySelectorAll('#form-tabs .builder__form-tab')).toHaveLength(2);
        // The snapshot also restores the index it was taken with.
        expect(getSession().current_form_index).toBe(0);
        expect(document.querySelector('#form-tabs .builder__form-tab[aria-selected="true"]')).not.toBeNull();
    });

    it('undoes an answer addition', () => {
        select_first_question();
        document.querySelector('#properties .builder__add-answer').click();

        expect(getCurrentInput().possible_answers).toHaveLength(3);

        document.getElementById('undo').click();
        select_first_question();

        expect(getCurrentInput().possible_answers).toHaveLength(2);
    });

    it('enables undo after typing once the throttled snapshot lands', () => {
        vi.useFakeTimers();
        select_first_question();

        const field = document.querySelector('#properties .builder__question-field');

        field.value = 'Changed';
        field.dispatchEvent(new CustomEvent('ionInput', { detail: { value: 'Changed' } }));

        expect(document.getElementById('undo').disabled).toBe(true);

        vi.advanceTimersByTime(UNDO_THROTTLE_MS);

        expect(document.getElementById('undo').disabled).toBe(false);
    });
});

describe('form actions', () => {
    beforeEach(() => {
        build_markup();
        setProject(project_definition());
        renderApp();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renames the current form from the edit button', () => {
        document.querySelector('#questions .builder__form-action-btn--edit').click();

        const panel = document.querySelector('#questions [data-role="form-rename"]');

        expect(panel.hidden).toBe(false);

        const field = panel.querySelector('[data-role="form-name-input"]');

        expect(field.value).toBe('Screening form');

        field.value = 'Renamed form';
        panel.querySelector('[data-action="form-rename-save"]').click();

        expect(getCurrentForm().name).toBe('Renamed form');
        expect(document.querySelectorAll('#form-tabs .builder__form-tab')[0].textContent).toBe('Renamed form');
        expect(document.querySelector('#questions [data-role="form-rename"]').hidden).toBe(true);
    });

    it('refuses a duplicate form name and shows why', () => {
        document.querySelector('#questions .builder__form-action-btn--edit').click();

        const panel = document.querySelector('#questions [data-role="form-rename"]');
        const field = panel.querySelector('[data-role="form-name-input"]');

        field.value = 'Second form';
        panel.querySelector('[data-action="form-rename-save"]').click();

        const toast = document.querySelector('ion-toast');

        expect(getCurrentForm().name).toBe('Screening form');
        expect(toast.message).toBe('Form name exists');
        expect(toast.cssClass).toContain('fb-toast--danger');
    });

    it('deletes only the last child form, after confirmation', () => {
        const delete_button = document.querySelector('#questions .builder__form-action-btn--delete');

        expect(delete_button.disabled).toBe(true);

        document.querySelectorAll('#form-tabs .builder__form-tab')[1].click();

        const last_delete = document.querySelector('#questions .builder__form-action-btn--delete');

        expect(last_delete.disabled).toBe(false);

        last_delete.click();

        const confirm_panel = document.querySelector('#questions [data-role="form-confirm"]');

        expect(confirm_panel.hidden).toBe(false);

        confirm_panel.querySelector('[data-action="form-confirm-yes"]').click();

        expect(document.querySelectorAll('#form-tabs .builder__form-tab')).toHaveLength(1);
        expect(getSession().current_form_index).toBe(0);
    });

    it('deletes all questions of the active form after confirmation', () => {
        document.querySelector('#questions [data-action="form-delete-all"]').click();

        const confirm_panel = document.querySelector('#questions [data-role="form-confirm"]');

        expect(confirm_panel.hidden).toBe(false);
        expect(confirm_panel.querySelector('[data-role="form-confirm-message"]').textContent).toBe('Delete all questions?');

        confirm_panel.querySelector('[data-action="form-confirm-yes"]').click();

        expect(getCurrentInputs()).toHaveLength(0);
        expect(document.querySelector('#questions .builder__empty')).not.toBeNull();
    });

    it('caps the project at five forms and asks for the new name', () => {
        for (let index = 0; index < 3; index += 1) {
            document.getElementById('add-form').click();
        }

        expect(document.querySelectorAll('#form-tabs .builder__form-tab')).toHaveLength(5);
        expect(getSession().current_form_index).toBe(4);
        expect(document.querySelector('#questions [data-role="form-rename"]').hidden).toBe(false);
        expect(document.getElementById('add-form').disabled).toBe(true);
    });

    it.skipIf(typeof CompressionStream === 'undefined')('saves a valid project and reports it', async () => {
        const fetch_mock = vi.fn().mockResolvedValue({ ok: true, status: 200 });

        vi.stubGlobal('fetch', fetch_mock);
        setProject(savable_project());
        renderApp();

        const save_button = document.getElementById('save');

        expect(save_button.disabled).toBe(false);
        save_button.click();

        await vi.waitFor(() => {
            expect(document.querySelector('ion-toast')?.message).toBe('Project saved!');
        });

        expect(document.querySelector('ion-toast').cssClass).toContain('fb-toast--success');
        expect(fetch_mock).toHaveBeenCalledTimes(1);

        const unload = new Event('beforeunload', { cancelable: true });

        window.dispatchEvent(unload);
        expect(unload.defaultPrevented).toBe(false);
    });

    it('reports a failed save without losing the project', async () => {
        const fetch_mock = vi.fn().mockRejectedValue(new Error('offline'));

        vi.stubGlobal('fetch', fetch_mock);
        setProject(savable_project());
        renderApp();

        document.getElementById('save').click();

        await vi.waitFor(() => {
            expect(document.querySelector('ion-toast')?.message).toContain('Project error!');
        });

        expect(document.querySelector('ion-toast').cssClass).toContain('fb-toast--danger');
        expect(getSession().project_definition.data.project.forms).toHaveLength(2);
    });
});
