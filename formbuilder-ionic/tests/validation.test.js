import { describe, expect, it } from 'vitest';
import { areAllInputsValid, areFormInputsValid, getInputErrors, isInputValid } from '@/services/validation.js';
import { PARAMETERS } from '@/config/parameters.js';

const END = PARAMETERS.JUMP_TO_END_OF_FORM_REF;

function input(ref, overrides) {
    return Object.assign({
        ref: ref,
        type: 'text',
        question: 'Question ' + ref,
        is_required: false,
        is_title: false,
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
    }, overrides || {});
}

function form(inputs) {
    return { ref: 'form_1', name: 'Form', type: 'hierarchy', inputs: inputs };
}

function messages(input, inputs) {
    return getInputErrors(input, inputs).map(function (error) {
        return error.message;
    });
}

describe('validation', () => {
    it('rejects an empty question text', () => {
        const empty = input('form_1_a', { question: '   ' });

        expect(isInputValid(empty, [empty])).toBe(false);
        expect(messages(empty, [empty])).toEqual(['This field cannot be empty']);
    });

    it('counts readme characters without the markup', () => {
        const readme = input('form_1_a', { type: 'readme', question: '<p>' + 'x'.repeat(1000) + '</p>' });

        expect(isInputValid(readme, [readme])).toBe(true);

        readme.question = '<p>' + 'x'.repeat(1001) + '</p>';

        expect(messages(readme, [readme])).toContain('Characters limit exceeded');
    });

    it('rejects an empty possible answer for every multiple-answer type', () => {
        const radio = input('form_1_a', {
            type: 'radio',
            possible_answers: [
                { answer: 'Yes', answer_ref: 'a1' },
                { answer: '  ', answer_ref: 'a2' }
            ]
        });

        expect(messages(radio, [radio])).toEqual(['Answer text cannot be empty']);

        radio.possible_answers = [];

        expect(messages(radio, [radio])).toEqual(['Answer text cannot be empty']);
    });

    it('rejects duplicated answer identifiers', () => {
        const radio = input('form_1_a', {
            type: 'radio',
            possible_answers: [
                { answer: 'Yes', answer_ref: 'a1' },
                { answer: 'No', answer_ref: 'a1' }
            ]
        });

        expect(messages(radio, [radio])).toEqual(['Duplicated identifier, please remove']);
    });

    it('validates integer bounds and the initial answer', () => {
        const decimal_bound = input('form_1_a', { type: 'integer', min: '1.5' });
        const reversed = input('form_1_a', { type: 'integer', min: '10', max: '2' });
        const equal_bounds = input('form_1_a', { type: 'integer', min: '5', max: '5' });
        const out_of_range = input('form_1_a', { type: 'integer', min: null, max: '5', default: '10' });
        const valid = input('form_1_a', { type: 'integer', min: '1', max: '5', default: '5' });

        expect(messages(decimal_bound, [decimal_bound])).toEqual(['Value must be an integer']);
        expect(messages(reversed, [reversed])).toEqual(['Min value must be smaller than Max']);
        expect(messages(equal_bounds, [equal_bounds])).toEqual(['Min value must be smaller than Max']);
        // The legacy check only looked at max when min was set.
        expect(messages(out_of_range, [out_of_range])).toEqual(['Value is out of range']);
        expect(messages(valid, [valid])).toEqual([]);
    });

    it('validates decimals and their initial answer', () => {
        const invalid = input('form_1_a', { type: 'decimal', min: 'a' });
        const out_of_range = input('form_1_a', { type: 'decimal', min: '1', max: '2', default: '2.5' });
        const valid = input('form_1_a', { type: 'decimal', min: '1', max: '2', default: '1.5' });
        const regex_default = input('form_1_a', { type: 'decimal', regex: '^[0-9]+$', default: 'abc' });

        expect(messages(invalid, [invalid])).toEqual(['Value must be a number']);
        expect(messages(out_of_range, [out_of_range])).toEqual(['Value is out of range']);
        expect(messages(valid, [valid])).toEqual([]);
        // Legacy applies the regex to numeric defaults too.
        expect(messages(regex_default, [regex_default])).toContain('Value does not match regex');
    });

    it('reports a default that does not match the regex, even a malformed one', () => {
        const mismatch = input('form_1_a', { regex: '^[0-9]+$', default: 'abc' });
        const malformed = input('form_1_a', { regex: '[', default: 'abc' });
        const match = input('form_1_a', { regex: '^[0-9]+$', default: '123' });

        expect(messages(mismatch, [mismatch])).toEqual(['Value does not match regex']);
        expect(messages(malformed, [malformed])).toEqual(['Value does not match regex']);
        expect(messages(match, [match])).toEqual([]);
    });

    it('requires children for a branch and a group', () => {
        const branch = input('form_1_b', { type: 'branch', question: 'Branch' });
        const group = input('form_1_g', { type: 'group', question: 'Group' });

        expect(messages(branch, [branch])).toEqual(['No branch questions found']);
        expect(messages(group, [group])).toEqual(['No group questions found']);
    });

    it('marks a branch invalid when one of its children is invalid', () => {
        const child = input('form_1_b_a', { question: '' });
        const branch = input('form_1_b', { type: 'branch', question: 'Branch', branch: [child] });

        expect(messages(branch, [branch])).toEqual(['There are invalid branch questions']);
        expect(isInputValid(branch, [branch])).toBe(false);
    });

    it('lights the Jumps tab on a branch whose child jump is broken', () => {
        const child = input('form_1_b_a', { question: 'Child' });
        const branch = input('form_1_b', { type: 'branch', question: 'Branch', branch: [child] });

        child.jumps = [{ to: 'missing_ref', when: 'ALL', answer_ref: null }];

        const tabs = getInputErrors(branch, [branch]).map((error) => {
            return error.tab;
        });

        expect(tabs).toContain('properties');
        expect(tabs).toContain('jumps');
    });

    it('validates jump destinations against the current order', () => {
        const first = input('form_1_a');
        const second = input('form_1_b');
        const third = input('form_1_c');
        const list = [first, second, third];

        first.jumps = [{ to: second.ref, when: 'ALL', answer_ref: null }];
        expect(messages(first, list)).toEqual(['Invalid destination']);

        first.jumps = [{ to: third.ref, when: 'ALL', answer_ref: null }];
        expect(messages(first, list)).toEqual([]);

        second.jumps = [{ to: END, when: 'ALL', answer_ref: null }];
        expect(messages(second, list)).toEqual([]);

        first.jumps = [{}];
        expect(messages(first, list)).toEqual(['You must choose a valid destination']);
    });

    it('requires an answer for the answer-based jump conditions', () => {
        const radio = input('form_1_a', {
            type: 'radio',
            possible_answers: [{ answer: 'Yes', answer_ref: 'a1' }]
        });
        const middle = input('form_1_b');
        const target = input('form_1_c');
        // A jump has to skip at least one question to be a valid destination.
        const list = [radio, middle, target];

        radio.jumps = [{ to: target.ref, when: 'IS', answer_ref: null }];
        expect(messages(radio, list)).toEqual(['You must choose an answer']);

        radio.jumps = [{ to: target.ref, when: 'IS', answer_ref: 'a1' }];
        expect(messages(radio, list)).toEqual([]);

        radio.jumps = [{ to: target.ref, when: 'NO_ANSWER_GIVEN', answer_ref: null }];
        expect(messages(radio, list)).toEqual([]);

        radio.jumps = [{ to: target.ref, when: 'WHENEVER', answer_ref: null }];
        expect(messages(radio, list)).toEqual(['You must choose a condition']);
    });

    it('validates forms and the whole project, including nested groups', () => {
        const top = input('form_1_a', { question: 'Top level' });
        const nested_child = input('form_1_b_g_a', { question: '' });
        const nested_group = input('form_1_b_g', { type: 'group', question: 'Members', group: [nested_child] });
        const branch = input('form_1_b', { type: 'branch', question: 'Household', branch: [nested_group] });
        const invalid_form = form([top, branch]);

        expect(areFormInputsValid(invalid_form)).toBe(false);
        expect(areAllInputsValid({ data: { project: { forms: [invalid_form] } } })).toBe(false);

        nested_child.question = 'Age';

        expect(areFormInputsValid(invalid_form)).toBe(true);

        const empty_form = form([]);

        expect(areFormInputsValid(empty_form)).toBe(false);
        expect(areAllInputsValid({ data: { project: { forms: [invalid_form, empty_form] } } })).toBe(false);
        expect(areAllInputsValid({ data: { project: { forms: [invalid_form] } } })).toBe(true);
    });
});
