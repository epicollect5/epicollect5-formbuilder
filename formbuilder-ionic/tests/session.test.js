import { describe, expect, it } from 'vitest';
import { getInputs, getProject } from '@/models/project-definition.js';
import {
    addInput,
    getCurrentForm,
    getCurrentInput,
    getCurrentInputs,
    getSession,
    moveInput,
    removeInput,
    selectForm,
    selectInput,
    setProject,
    updateCurrentInput
} from '@/services/session.js';

function createDefinition() {
    return {
        data: {
            project: {
                name: 'Test mapping issue',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Screening form',
                        inputs: [{ ref: 'input_1', type: 'radio', question: 'Q1', is_required: false, is_title: false }]
                    },
                    { ref: 'form_2', name: 'Second form', inputs: [] }
                ]
            }
        }
    };
}

describe('session', () => {
    it('keeps one project definition and resets the selection on load', () => {
        const definition = createDefinition();

        selectInput('input_1');
        setProject(definition);

        expect(getSession().project_definition).toBe(definition);
        expect(getCurrentForm().ref).toBe('form_1');
        expect(getSession().current_form_index).toBe(0);
        expect(getSession().current_input_ref).toBeNull();
        expect(getProject(getSession().project_definition)).toBe(definition.data.project);
    });

    it('selects a form and clears the selected question', () => {
        setProject(createDefinition());
        selectInput('input_1');
        expect(getCurrentInputs()).toHaveLength(1);

        selectForm(1);

        expect(getCurrentForm().ref).toBe('form_2');
        expect(getSession().current_input_ref).toBeNull();
        expect(selectForm(5)).toBeNull();
    });

    it('updates the selected question in place', () => {
        setProject(createDefinition());
        selectInput('input_1');
        updateCurrentInput({ is_required: true, question: 'Renamed' });

        const input = getInputs(getCurrentForm())[0];

        expect(input.question).toBe('Renamed');
        expect(input.is_required).toBe(true);
        expect(getCurrentInput()).toBe(input);
    });

    it('appends a question and selects it', () => {
        setProject(createDefinition());

        const input = addInput('radio');

        expect(getCurrentInputs()).toHaveLength(2);
        expect(getCurrentInputs()[1]).toBe(input);
        expect(getSession().current_input_ref).toBe(input.ref);
        expect(input.possible_answers).toHaveLength(1);
    });

    it('removes a question and clears the selection', () => {
        setProject(createDefinition());
        selectInput('input_1');

        expect(removeInput('input_1')).toBe(true);
        expect(getCurrentInputs()).toHaveLength(0);
        expect(getSession().current_input_ref).toBeNull();
        expect(removeInput('missing')).toBe(false);
    });

    it('moves a question within the form', () => {
        setProject(createDefinition());
        addInput('text');

        const [first, second] = getCurrentInputs();

        expect(moveInput(0, 1)).toBe(true);
        expect(getCurrentInputs()[0]).toBe(second);
        expect(getCurrentInputs()[1]).toBe(first);
        expect(moveInput(0, 9)).toBe(false);
        expect(moveInput(0, 0)).toBe(false);
    });
});
