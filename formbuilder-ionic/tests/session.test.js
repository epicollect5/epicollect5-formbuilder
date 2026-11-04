import { describe, expect, it } from 'vitest';
import { getInputs, getProject } from '@/models/project-definition.js';
import {
    getCurrentForm,
    getCurrentInput,
    getCurrentInputs,
    getSession,
    selectForm,
    selectInput,
    setProject,
    updateCurrentInput
} from '@/services/session.js';

const DEFINITION = {
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

describe('session', () => {
    it('keeps one project definition and resets the selection on load', () => {
        selectInput('input_1');
        setProject(DEFINITION);

        expect(getSession().project_definition).toBe(DEFINITION);
        expect(getCurrentForm().ref).toBe('form_1');
        expect(getSession().current_form_index).toBe(0);
        expect(getSession().current_input_ref).toBeNull();
        expect(getProject(getSession().project_definition)).toBe(DEFINITION.data.project);
    });

    it('selects a form and clears the selected question', () => {
        setProject(DEFINITION);
        selectInput('input_1');
        expect(getCurrentInputs()).toHaveLength(1);

        selectForm(1);

        expect(getCurrentForm().ref).toBe('form_2');
        expect(getSession().current_input_ref).toBeNull();
        expect(selectForm(5)).toBeNull();
    });

    it('updates the selected question in place', () => {
        setProject(DEFINITION);
        selectInput('input_1');
        updateCurrentInput({ is_required: true, question: 'Renamed' });

        const input = getInputs(getCurrentForm())[0];

        expect(input.question).toBe('Renamed');
        expect(input.is_required).toBe(true);
        expect(getCurrentInput()).toBe(input);
    });
});
