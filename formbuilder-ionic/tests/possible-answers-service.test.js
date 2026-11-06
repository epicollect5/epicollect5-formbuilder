import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '@/config/parameters.js';
import { POSSIBLE_ANSWERS_ORDER } from '@/models/possible-answers.js';
import {
    addPossibleAnswer,
    deleteAllAnswers,
    movePossibleAnswer,
    orderPossibleAnswers,
    removePossibleAnswer,
    renamePossibleAnswer,
    reorderAnswerPage,
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
        const answers = Array.from({ length: PARAMETERS.MAX_ANSWERS }, function (value, index) {
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

    it('sanitises answer text and caps it at the answer length', () => {
        const input = create_input();

        renamePossibleAnswer(input, 'answer_1', ' <b>Yes</b> ');

        expect(input.possible_answers[0].answer).toBe(' \ufe64b\ufe65Yes\ufe64/b\ufe65 ');

        renamePossibleAnswer(input, 'answer_1', 'x'.repeat(300));

        expect(input.possible_answers[0].answer).toHaveLength(PARAMETERS.MAX_ANSWER_LENGTH);
    });

    it('orders answers ascending and descending, keeping the refs', () => {
        const input = create_input({
            possible_answers: [
                { answer: 'banana', answer_ref: 'answer_1' },
                { answer: 'apple', answer_ref: 'answer_2' },
                { answer: 'cherry', answer_ref: 'answer_3' }
            ]
        });

        expect(orderPossibleAnswers(input, POSSIBLE_ANSWERS_ORDER.AZ)).toBe(true);
        expect(input.possible_answers.map((answer) => answer.answer)).toEqual(['apple', 'banana', 'cherry']);
        expect(input.possible_answers[0].answer_ref).toBe('answer_2');

        orderPossibleAnswers(input, POSSIBLE_ANSWERS_ORDER.ZA);

        expect(input.possible_answers.map((answer) => answer.answer)).toEqual(['cherry', 'banana', 'apple']);
    });

    it('shuffles without losing or duplicating an answer', () => {
        const input = create_input();

        expect(orderPossibleAnswers(input, POSSIBLE_ANSWERS_ORDER.SHUFFLE)).toBe(true);
        expect(input.possible_answers.map((answer) => answer.answer_ref).sort()).toEqual(['answer_1', 'answer_2']);
        expect(orderPossibleAnswers(create_input({ type: 'text', possible_answers: [] }), 'az')).toBe(false);
    });

    it('deletes every answer but one placeholder and clears the default', () => {
        const input = create_input({ default: 'answer_1' });

        expect(deleteAllAnswers(input)).toBe(true);
        expect(input.possible_answers).toHaveLength(1);
        expect(input.possible_answers[0].answer).toBe('I am a placeholder answer');
        expect(input.default).toBeNull();
        expect(deleteAllAnswers(create_input({ type: 'text', possible_answers: [] }))).toBe(false);
    });

    it('reorders only the answers on the visible page', () => {
        const answers = Array.from({ length: 150 }, function (value, index) {
            return { answer: 'Answer ' + index, answer_ref: 'answer_' + index };
        });
        const input = create_input({ possible_answers: answers });
        const page_two = answers.slice(100).map((answer) => answer.answer_ref).reverse();

        expect(reorderAnswerPage(input, page_two.slice(1), 2)).toBe(false);
        expect(reorderAnswerPage(input, page_two, 2)).toBe(true);
        expect(input.possible_answers[100].answer_ref).toBe('answer_149');
        expect(input.possible_answers[0].answer_ref).toBe('answer_0');
        expect(input.possible_answers).toHaveLength(150);
    });
});
