import { describe, expect, it } from 'vitest';
import form_export from './fixtures/form.json';
import {
    areJumpsDestinationsValid,
    areJumpsValid,
    arePossibleAnswersValid,
    hasValidFormStructure,
    isValidInput,
    sanitizeLegacyInvalidEndJumps
} from '@/services/import-form-validation.js';

const FORM_REF = form_export.data.form.ref;
const INPUT_REF = form_export.data.form.inputs[0].ref;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function formWith(input) {
    const form = clone(form_export);

    form.data.form.inputs = [input];

    return form;
}

describe('form envelope', () => {
    it('accepts a form that matches the project schema', () => {
        expect(hasValidFormStructure(form_export)).toBe(true);
    });

    it('rejects a project envelope and a malformed form', () => {
        const project = clone(form_export);

        project.data.type = 'project';
        expect(hasValidFormStructure(project)).toBe(false);

        const missing_key = clone(form_export);

        delete missing_key.data.form.inputs[0].uniqueness;
        expect(hasValidFormStructure(missing_key)).toBe(false);

        expect(hasValidFormStructure(null)).toBe(false);
    });
});

describe('input validation', () => {
    it('accepts a schema-valid input with the form ref prefix', () => {
        expect(isValidInput(FORM_REF, form_export.data.form.inputs[0], false, false)).toBe(true);
    });

    it('rejects an input ref outside the form', () => {
        const input = clone(form_export.data.form.inputs[0]);

        input.ref = 'c'.repeat(32) + '_' + 'b'.repeat(13) + '_' + 'c'.repeat(13);
        expect(isValidInput(FORM_REF, input, false, false)).toBe(false);
    });

    it('rejects unknown properties and invalid ranges', () => {
        const extra = clone(form_export.data.form.inputs[0]);

        extra.unexpected = true;
        expect(isValidInput(FORM_REF, extra, false, false)).toBe(false);

        const integer = clone(form_export.data.form.inputs[0]);

        integer.type = 'integer';
        integer.min = '9';
        integer.max = '2';
        expect(isValidInput(FORM_REF, integer, false, false)).toBe(false);

        integer.min = '2';
        integer.max = '9';
        expect(isValidInput(FORM_REF, integer, false, false)).toBe(true);
    });

    it('rejects jumps inside a group', () => {
        const group = clone(form_export.data.form.inputs[0]);

        group.type = 'group';
        group.group = [clone(form_export.data.form.inputs[0])];
        group.jumps = [{ to: 'END', when: 'ALL', answer_ref: null }];

        expect(isValidInput(FORM_REF, group, false, true)).toBe(false);
    });
});

describe('jumps', () => {
    it('validates jump shape and unconditional rules', () => {
        expect(areJumpsValid({ jumps: [] })).toBe(true);
        expect(areJumpsValid({ jumps: [{ to: 'END', when: 'ALL', answer_ref: null }] })).toBe(true);
        expect(areJumpsValid({ jumps: [{ to: 'END', when: 'SOMETIMES', answer_ref: null }] })).toBe(false);
        expect(areJumpsValid({ jumps: [{ to: 'END', when: 'ALL', answer_ref: 'd'.repeat(13) }] })).toBe(false);
        expect(areJumpsValid({ jumps: 'nope' })).toBe(false);
    });

    it('requires conditional answers to exist and jumps to skip a question', () => {
        const answer_ref = 'd'.repeat(13);
        const choice = clone(form_export.data.form.inputs[0]);

        choice.type = 'radio';
        choice.possible_answers = [{ answer: 'One', answer_ref: answer_ref }];
        choice.default = null;
        choice.jumps = [{ to: 'END', when: 'IS', answer_ref: answer_ref }];

        expect(isValidInput(FORM_REF, choice, false, false)).toBe(true);

        choice.jumps = [{ to: 'END', when: 'IS', answer_ref: 'e'.repeat(13) }];
        expect(isValidInput(FORM_REF, choice, false, false)).toBe(false);

        const text = clone(form_export.data.form.inputs[0]);
        const next_text = clone(form_export.data.form.inputs[0]);

        next_text.ref = INPUT_REF.replace(/_c{13}$/, '_' + 'd'.repeat(13));
        text.jumps = [{ to: next_text.ref, when: 'ALL', answer_ref: null }];

        expect(areJumpsDestinationsValid([text, next_text])).toBe(false);

        text.jumps = [{ to: 'END', when: 'ALL', answer_ref: null }];
        expect(areJumpsDestinationsValid([text, next_text])).toBe(true);
    });

    it('drops jumps on the last question of a form and its branches', () => {
        const last = clone(form_export.data.form.inputs[0]);
        const branch_owner = clone(form_export.data.form.inputs[0]);
        const last_branch_input = clone(form_export.data.form.inputs[0]);

        last.jumps = [{ to: 'END', when: 'ALL', answer_ref: null }];
        branch_owner.type = 'branch';
        branch_owner.branch = [last_branch_input];
        last_branch_input.jumps = [{ to: 'END', when: 'ALL', answer_ref: null }];

        sanitizeLegacyInvalidEndJumps([branch_owner, last]);

        expect(last.jumps).toEqual([]);
        expect(last_branch_input.jumps).toEqual([]);
    });
});

describe('possible answers', () => {
    it('validates answer refs and uniqueness', () => {
        const answers = [
            { answer: 'One', answer_ref: 'd'.repeat(13) },
            { answer: 'Two', answer_ref: 'e'.repeat(13) }
        ];

        expect(arePossibleAnswersValid(answers, 'radio')).toBe(true);
        expect(arePossibleAnswersValid([], 'radio')).toBe(false);
        expect(arePossibleAnswersValid([answers[0], answers[0]], 'radio')).toBe(false);
        expect(arePossibleAnswersValid([{ answer: 'One', answer_ref: 'XYZ' }], 'radio')).toBe(false);
        expect(arePossibleAnswersValid(answers.slice(0, 1), 'text')).toBe(true);
    });

    it('rejects a default answer that is not one of the possible answers', () => {
        const radio = clone(form_export.data.form.inputs[0]);

        radio.type = 'radio';
        radio.possible_answers = [{ answer: 'One', answer_ref: 'd'.repeat(13) }];
        radio.default = 'e'.repeat(13);

        expect(isValidInput(FORM_REF, radio, false, false)).toBe(false);

        radio.default = 'd'.repeat(13);
        expect(isValidInput(FORM_REF, radio, false, false)).toBe(true);
    });
});

describe('generated form fixture', () => {
    it('stays inside the schema when cloned', () => {
        const form = formWith(clone(form_export.data.form.inputs[0]));

        expect(hasValidFormStructure(form)).toBe(true);
    });
});
