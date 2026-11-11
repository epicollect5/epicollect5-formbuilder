'use strict';

import { PARAMETERS } from '@/config/parameters.js';
import {
    BRANCH_GROUP_TYPES,
    MEDIA_TYPES,
    REQUIRED_ALLOWED_TYPES,
    UNIQUENESS_ALLOWED_TYPES,
    VERIFY_ALLOWED_TYPES,
    QUESTION_TYPE,
} from '@/config/question-types.js';

/*
 * Per-type property gating over the shared taxonomy in
 * config/question-types.js: which capabilities each question type allows and
 * which default datetime format it starts with.
 */

export const allowsRequired = (type) => {
    return REQUIRED_ALLOWED_TYPES.indexOf(type) !== -1;
};

export const allowsTitle = (type) => {
    return !isMediaType(type) && !isBranchOrGroup(type) && type !== QUESTION_TYPE.README;
};

export const allowsUniqueness = (type) => {
    return UNIQUENESS_ALLOWED_TYPES.indexOf(type) !== -1;
};

export const isMediaType = (type) => {
    return MEDIA_TYPES.indexOf(type) !== -1;
};

export const isBranchOrGroup = (type) => {
    return BRANCH_GROUP_TYPES.indexOf(type) !== -1;
};

export const hasAdvancedTab = (type) => {
    if (type === QUESTION_TYPE.README) {
        return false;
    }

    // noinspection RedundantIfStatementJS
    if (isMediaType(type) || isBranchOrGroup(type)) {
        return false;
    }

    return true;
};

export const getDefaultDatetimeFormat = (type) => {
    if (type === QUESTION_TYPE.DATE) {
        return PARAMETERS.DATE_FORMATS_DEFAULT;
    }

    if (type === QUESTION_TYPE.TIME) {
        return PARAMETERS.TIME_FORMATS_DEFAULT;
    }

    return null;
};
