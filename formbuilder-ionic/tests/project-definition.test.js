import { describe, expect, it } from 'vitest';
import {
    findInput,
    getForm,
    getForms,
    getInputIndex,
    getInputs,
    getProject,
    serializeProject
} from '@/models/project-definition.js';

const DEFINITION = {
    data: {
        project: {
            name: 'Test mapping issue',
            forms: [
                {
                    ref: 'form_1',
                    name: 'Screening form',
                    inputs: [
                        { ref: 'input_1', type: 'radio', question: 'Q1', possible_answers: [] },
                        { ref: 'input_2', type: 'text', question: 'q2', possible_answers: [] }
                    ]
                }
            ]
        }
    }
};

describe('project definition helpers', () => {
    it('reads the project, forms and inputs without copying them', () => {
        expect(getProject(DEFINITION)).toBe(DEFINITION.data.project);
        expect(getForms(DEFINITION)[0]).toBe(DEFINITION.data.project.forms[0]);
        expect(getForm(DEFINITION, 0).ref).toBe('form_1');
        expect(getInputs(getForm(DEFINITION, 0))).toHaveLength(2);
        expect(findInput(getForm(DEFINITION, 0), 'input_2').question).toBe('q2');
        expect(getInputIndex(getForm(DEFINITION, 0), 'input_2')).toBe(1);
    });

    it('returns empty values instead of throwing on a missing project', () => {
        expect(getProject(null)).toBeNull();
        expect(getForms(null)).toEqual([]);
        expect(getForm(DEFINITION, 9)).toBeNull();
        expect(getInputs(null)).toEqual([]);
        expect(findInput(null, 'input_1')).toBeNull();
    });
});

describe('serialisation', () => {
    it('drops runtime-only dom handles', () => {
        const definition = JSON.parse(JSON.stringify(DEFINITION));

        definition.data.project.forms[0].inputs[0].dom = { question: {} };

        const serialized = serializeProject(definition);

        expect(serialized.data.project.forms[0].inputs[0].dom).toBeUndefined();
        expect(serialized.data.project.forms[0].inputs[1].question).toBe('q2');
        expect(definition.data.project.forms[0].inputs[0].dom).toBeDefined();
    });
});
