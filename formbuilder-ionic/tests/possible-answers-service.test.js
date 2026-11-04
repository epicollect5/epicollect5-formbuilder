import { describe, expect, it } from 'vitest';
import { MAX_ANSWERS } from '@/models/possible-answers.js';
import {
    addPossibleAnswer,
    movePossibleAnswer,
    removePossibleAnswer,
    renamePossibleAnswer,
    reorderPossibleAnswers
} from '@/services/possible-answers.js';

function create_input(overrides) {
    return Object.assign({
        ref: 'form_1_input_1',
        type: 'radio',
        default: null,
        possible_answers: [
            { answer: 'Yes', answer_ref: 'answer_1' },
            { answer: 'No', answer_ref: 'answer_2' }
        ]
    }, overrides || {});
}

describe('possible answers', () => {
    it('appends a placeholder answer to a multiple-answer question', () => {
        const input = create_input();
        const answer = addPossibleAnswer(input);

        expect(input.possible_answers).toHaveLength(3);
        expect(answer.answer).toBe('I am a placeholder answer');
        expect(answer.answer_ref).toMatch(/^[0-9a-f]{13}$/);
        expect(input.possible_answers[2]).toBe(answer);
    });

    it('does not add answers to single-answer questions', () => {
        const input = create_input({ type: 'text', possible_answers: [] });

        expect(addPossibleAnswer(input)).toBeNull();
        expect(input.possible_answers).toEqual([]);
    });

    it('stops adding at the answer limit', () => {
        const answers = Array.from({ length: MAX_ANSWERS }, function (value, index) {
            return { answer: 'Answer ' + index, answer_ref: 'answer_' + index };
        });

        expect(addPossibleAnswer(create_input({ possible_answers: answers }))).toBeNull();
    });

    it('removes an answer but keeps the last one', () => {
        const input = create_input();

        expect(removePossibleAnswer(input, 'answer_1')).toBe(true);
        expect(input.possible_answers.map((answer) => answer.answer)).toEqual(['No']);
        expect(removePossibleAnswer(input, 'answer_2')).toBe(false);
        expect(input.possible_answers).toHaveLength(1);
    });

    it('clears the default answer when its answer is removed', () => {
        const input = create_input({ default: 'answer_1' });

        removePossibleAnswer(input, 'answer_1');

        expect(input.default).toBeNull();
    });

    it('keeps the default when another answer is removed', () => {
        const input = create_input({ default: 'answer_1' });

        removePossibleAnswer(input, 'answer_2');

        expect(input.default).toBe('answer_1');
    });

    it('renames one answer in place', () => {
        const input = create_input();

        expect(renamePossibleAnswer(input, 'answer_2', 'Nope')).toBe(true);
        expect(input.possible_answers[1].answer).toBe('Nope');
        expect(input.possible_answers[0].answer).toBe('Yes');
        expect(renamePossibleAnswer(input, 'missing', 'Nope')).toBe(false);
    });

    it('applies a new answer order and refuses a partial one', () => {
        const input = create_input();

        expect(reorderPossibleAnswers(input, ['answer_2'])).toBe(false);
        expect(reorderPossibleAnswers(input, ['answer_2', 'answer_1'])).toBe(true);
        expect(input.possible_answers.map((answer) => answer.answer)).toEqual(['No', 'Yes']);
    });

    it('reorders answers within the input', () => {
        const input = create_input();

        expect(movePossibleAnswer(input, 0, 1)).toBe(true);
        expect(input.possible_answers.map((answer) => answer.answer)).toEqual(['No', 'Yes']);
        expect(movePossibleAnswer(input, 0, 9)).toBe(false);
        expect(movePossibleAnswer(input, 1, 1)).toBe(false);
    });
});
