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
export const usesAlwaysJump = (type) => {
    return !isMultipleAnswerType(type);
};

export const jumpNeedsAnswer = (when) => {
    return when === JUMP_WHEN.IS || when === JUMP_WHEN.IS_NOT;
};

export const createJump = (type, possible_answers) => {
    if (usesAlwaysJump(type)) {
        return {
            to: '',
            when: JUMP_WHEN.ALL,
            answer_ref: null
        };
    }

    /*
     * A new jump starts neutral: no condition and no answer pre-selected, so
     * the row is only valid once the user completes it. Deliberate divergence
     * from the legacy pre-fill (which picked "answer is" + the first answer).
     */
    return {
        to: '',
        when: '',
        answer_ref: null
    };
};
