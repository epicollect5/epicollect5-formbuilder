'use strict';

import { PARAMETERS } from '@/config/parameters.js';
import { isMultipleAnswerType } from '@/models/possible-answers.js';

/*
 * Jump creation and condition logic over the shared vocabulary in
 * config/parameters.js (JUMP_WHEN / JUMP_CONDITIONS).
 */

/* Single/open-answer jump UX uses "always" (ALL) with no answer selector. */
export const usesAlwaysJump = (type) => {
    return !isMultipleAnswerType(type);
};

export const jumpNeedsAnswer = (when) => {
    return when === PARAMETERS.JUMP_WHEN.IS || when === PARAMETERS.JUMP_WHEN.IS_NOT;
};

export const createJump = (type, possible_answers) => {
    if (usesAlwaysJump(type)) {
        return {
            to: '',
            when: PARAMETERS.JUMP_WHEN.ALL,
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
