'use strict';

import { QUESTION_TYPES, TYPE_ALIASES } from '@/config/question-types.js';

/*
 * Lookup over the shared type taxonomy in config/question-types.js: the
 * toolbar list and the alias resolution for the switchable contract types.
 */

export const getQuestionType = (type) => {
    const resolved_type = TYPE_ALIASES[type] || type;

    return QUESTION_TYPES.find((question_type) => {
        return question_type.type === resolved_type;
    }) || null;
};
