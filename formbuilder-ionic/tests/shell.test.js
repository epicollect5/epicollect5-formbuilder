import { beforeEach, describe, expect, it } from 'vitest';
import { getCurrentInput, getCurrentInputs, getSession, setProject } from '@/services/session.js';
import { renderApp } from '@/ui/shell.js';

function build_markup() {
    document.body.innerHTML = [
        '<span id="project-name"></span>',
        '<button type="button" data-action="back"></button>',
        '<button type="button" data-action="exit"></button>',
        '<section id="tools"></section>',
        '<nav id="form-tabs" role="tablist"></nav>',
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

    it('lists the current form questions', () => {
        const rows = document.querySelectorAll('#questions .builder__question');

        expect(rows).toHaveLength(2);
        expect(rows[0].querySelector('.builder__question-text').textContent).toBe('Do you have children');
        expect(rows[1].querySelector('.builder__question-text').textContent).toBe('Your name');
        expect(document.querySelectorAll('#tools .builder__tool')).toHaveLength(18);
        expect(rows[0].getAttribute('data-input-ref')).toBe('input_1');
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

    it('shows disabled copy and validate actions plus a working delete', () => {
        select_first_question();

        const buttons = [...document.querySelectorAll('#properties .builder__icon-btn')];

        expect(buttons).toHaveLength(3);
        expect(buttons[0].disabled).toBe(true);
        expect(buttons[1].disabled).toBe(true);
        expect(buttons[2].disabled).toBe(false);
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

    it('deletes the selected question', () => {
        select_first_question();
        document.querySelector('#properties .builder__icon-btn--danger').click();

        expect(getCurrentInputs()).toHaveLength(1);
        expect(getSession().current_input_ref).toBeNull();
        expect(document.querySelectorAll('#questions .builder__question')).toHaveLength(1);
        expect(document.querySelector('#properties .builder__empty')).not.toBeNull();
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
