import { describe, expect, it } from 'vitest';
import { updateJump } from '@/services/jumps.js';

/*
 * Jump normalisation on user edits: a stored answer_ref that no longer matches
 * a possible answer must survive (the row shows it as unavailable and
 * validation flags it), instead of being silently retargeted to the first
 * answer (risks R-30 / R-33).
 */

function input(overrides) {
    return Object.assign({
        ref: 'form_1_a',
        type: 'radio',
        question: 'Radio',
        possible_answers: [
            { answer: 'Yes', answer_ref: 'a1' },
            { answer: 'No', answer_ref: 'a2' }
        ],
        jumps: []
    }, overrides || {});
}

describe('jump updates', () => {
    it('keeps a stored answer ref that no longer matches an answer', () => {
        const radio = input();
        radio.jumps = [{ to: 'form_1_c', when: 'IS', answer_ref: 'deleted_ref' }];

        updateJump(radio, 0, { to: 'form_1_d' });

        expect(radio.jumps[0].answer_ref).toBe('deleted_ref');
    });

    it('defaults a missing answer ref to the first possible answer', () => {
        const radio = input();
        radio.jumps = [{ to: 'form_1_c', when: 'IS', answer_ref: null }];

        updateJump(radio, 0, {});

        expect(radio.jumps[0].answer_ref).toBe('a1');
    });

    it('defaults the answer ref when the condition starts using answers', () => {
        const radio = input();
        radio.jumps = [{ to: 'form_1_c', when: 'NO_ANSWER_GIVEN', answer_ref: null }];

        updateJump(radio, 0, { when: 'IS' });

        expect(radio.jumps[0].answer_ref).toBe('a1');
    });

    it('clears the answer ref when the condition stops using answers', () => {
        const radio = input();
        radio.jumps = [{ to: 'form_1_c', when: 'IS', answer_ref: 'a1' }];

        updateJump(radio, 0, { when: 'NO_ANSWER_GIVEN' });

        expect(radio.jumps[0].when).toBe('NO_ANSWER_GIVEN');
        expect(radio.jumps[0].answer_ref).toBe(null);
    });
});
