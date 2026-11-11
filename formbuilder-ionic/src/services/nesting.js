'use strict';

import { QUESTION_TYPE } from '@/config/question-types.js';
/*
 * Nesting rules from the legacy builder: a branch cannot hold another branch,
 * and a group cannot hold a branch or another group. The form holds anything.
 * The rules are checked before an input is created, never while rendering.
 */
export const canContainInput = (container, type) => {
    if (!container) {
        return true;
    }

    if (container.type === QUESTION_TYPE.BRANCH) {
        return type !== QUESTION_TYPE.BRANCH;
    }

    if (container.type === QUESTION_TYPE.GROUP) {
        return type !== QUESTION_TYPE.BRANCH && type !== QUESTION_TYPE.GROUP;
    }

    return true;
};

/* A branch or group owns its `branch` / `group` array; the form owns `inputs`. */
export const getContainerList = (container) => {
    if (!container) {
        return [];
    }

    return Array.isArray(container[container.type]) ? container[container.type] : [];
};
