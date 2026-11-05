'use strict';

import { isMultipleAnswerType } from '@/models/possible-answers.js';

/* Legacy-equivalent condition keys/text (contract keys are frozen). */
export const JUMP_CONDITIONS = [
    { key: 'NO_ANSWER_GIVEN', label: 'no answer given' },
    { key: 'IS', label: 'answer is' },
    { key: 'IS_NOT', label: 'answer is NOT' },
    { key: 'ALL', label: 'always' }
];

export const JUMP_WHEN = {
    NO_ANSWER_GIVEN: 'NO_ANSWER_GIVEN',
    IS: 'IS',
    IS_NOT: 'IS_NOT',
    ALL: 'ALL'
};

export const JUMP_TO_END_OF_FORM_LABEL = 'End of form';

/* Single/open-answer jump UX uses "always" (ALL) with no answer selector. */
export function usesAlwaysJump(type) {
    return !isMultipleAnswerType(type);
}

export function jumpNeedsAnswer(when) {
    return when === JUMP_WHEN.IS || when === JUMP_WHEN.IS_NOT;
}

function firstAnswerRef(possible_answers) {
    if (!Array.isArray(possible_answers) || possible_answers.length === 0) {
        return '';
    }

    return possible_answers[0].answer_ref || '';
}

export function createJump(type, possible_answers) {
    if (usesAlwaysJump(type)) {
        return {
            to: '',
            when: JUMP_WHEN.ALL,
            answer_ref: null
        };
    }

    return {
        to: '',
        when: JUMP_WHEN.IS,
        answer_ref: firstAnswerRef(possible_answers)
    };
}
