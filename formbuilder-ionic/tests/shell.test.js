import { beforeEach, describe, expect, it } from 'vitest';
import { getCurrentInput, getCurrentInputs, getSession, setProject } from '@/services/session.js';
import { renderApp } from '@/ui/shell.js';

function build_markup() {
    document.body.innerHTML = [
        '<span id="project-name"></span>',
        '<section id="tools"></section>',
        '<nav id="form-tabs" role="tablist"></nav>',
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
                        inputs: [
                            { ref: 'input_1', type: 'radio', question: 'Do you have children', is_required: false, is_title: false },
                            { ref: 'input_2', type: 'text', question: 'Your name', is_required: false, is_title: false }
                        ]
                    },
                    { ref: 'form_2', name: 'Second form', inputs: [] }
                ]
            }
        }
    };
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

    it('lists the current form questions', () => {
        const rows = document.querySelectorAll('#questions .builder__question');

        expect(rows).toHaveLength(2);
        expect(rows[0].querySelector('.builder__question-text').textContent).toBe('Do you have children');
        expect(rows[1].querySelector('.builder__question-text').textContent).toBe('Your name');
        expect(document.querySelectorAll('#tools .builder__tool')).toHaveLength(18);
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
        document.querySelectorAll('#questions .builder__question')[0].click();
        document.querySelector('#properties .builder__delete').click();

        expect(getCurrentInputs()).toHaveLength(1);
        expect(getSession().current_input_ref).toBeNull();
        expect(document.querySelectorAll('#questions .builder__question')).toHaveLength(1);
        expect(document.querySelector('#properties .builder__empty')).not.toBeNull();
    });

    it('reorders questions with a drag', () => {
        const rows = [...document.querySelectorAll('#questions .builder__question')];

        rows[0].dispatchEvent(new Event('dragstart', { bubbles: true }));
        rows[1].dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }));
        rows[1].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));

        expect(getCurrentInputs().map((input) => input.ref)).toEqual(['input_2', 'input_1']);
        expect(document.querySelectorAll('#questions .builder__question')[0].getAttribute('data-input-ref')).toBe('input_2');
    });

    it('switches form and clears the selection', () => {
        document.querySelectorAll('#questions .builder__question')[0].click();
        document.querySelectorAll('#form-tabs .builder__form-tab')[1].click();

        expect(getSession().current_form_index).toBe(1);
        expect(getSession().current_input_ref).toBeNull();
        expect(document.querySelector('#questions .builder__empty')).not.toBeNull();
        expect(document.querySelector('#properties .builder__empty')).not.toBeNull();
    });
});
