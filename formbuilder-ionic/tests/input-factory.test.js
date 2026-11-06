import { describe, expect, it } from 'vitest';
import { createInput } from '@/factory/input-factory.js';

const BASE_KEYS = [
    'ref', 'type', 'question', 'is_title', 'is_required', 'uniqueness', 'regex',
    'default', 'verify', 'max', 'min', 'datetime_format', 'set_to_current_datetime',
    'possible_answers', 'jumps', 'branch', 'group'
];

describe('input factory', () => {
    it('creates a full project-definition input', () => {
        const input = createInput('text', 'form_1');

        expect(Object.keys(input).sort()).toEqual(BASE_KEYS.slice().sort());
        expect(input.type).toBe('text');
        expect(input.question).toBe('');
        expect(input.is_title).toBe(false);
        expect(input.is_required).toBe(false);
        expect(input.uniqueness).toBe('none');
        expect(input.possible_answers).toEqual([]);
        expect(input.jumps).toEqual([]);
        expect(input.branch).toEqual([]);
        expect(input.group).toEqual([]);
    });

    it('generates a form-scoped, PHP-style ref', () => {
        const input = createInput('text', 'form_1');

        expect(input.ref.startsWith('form_1_')).toBe(true);
        expect(input.ref.slice('form_1_'.length)).toMatch(/^[0-9a-f]{13}$/);
    });

    it('gives every new question a distinct ref', () => {
        const refs = [createInput('text', 'form_1'), createInput('text', 'form_1')].map((input) => input.ref);

        expect(new Set(refs).size).toBe(2);
    });

    it('starts multiple-answer types with one placeholder answer', () => {
        ['radio', 'checkbox', 'dropdown', 'searchsingle'].forEach((type) => {
            const input = createInput(type, 'form_1');

            expect(input.possible_answers).toHaveLength(1);
            expect(input.possible_answers[0].answer).toBe('I am a placeholder answer');
            expect(input.possible_answers[0].answer_ref).toMatch(/^[0-9a-f]{13}$/);
        });
    });

    it('does not add answers to single-answer types', () => {
        ['text', 'integer', 'date', 'photo', 'branch', 'group'].forEach((type) => {
            expect(createInput(type, 'form_1').possible_answers).toEqual([]);
        });
    });
});
