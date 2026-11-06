'use strict';

import { PARAMETERS } from '@/config/parameters.js';
import {
    createAnswer,
    getAnswerLimit,
    isMultipleAnswerType,
    sanitizeAnswer,
    sortAnswers
} from '@/models/possible-answers.js';

/*
 * Possible answers are part of the input object, so these helpers mutate the
 * array in place and never touch the DOM. The last answer cannot be removed and
 * a removed answer clears the default when it pointed at it.
 */

export const addPossibleAnswer = (input) => {
    if (!input || !isMultipleAnswerType(input.type)) {
        return null;
    }

    if (input.possible_answers.length >= getAnswerLimit(input.type)) {
        return null;
    }

    const answer = createAnswer();

    input.possible_answers.push(answer);

    return answer;
};

export const removePossibleAnswer = (input, answer_ref) => {
    if (!input || !isMultipleAnswerType(input.type) || input.possible_answers.length <= 1) {
        return false;
    }

    const index = input.possible_answers.findIndex((answer) => {
        return answer.answer_ref === answer_ref;
    });

    if (index === -1) {
        return false;
    }

    const removed = input.possible_answers.splice(index, 1)[0];

    if (input.default === removed.answer_ref) {
        input.default = null;
    }

    return true;
};

export const renamePossibleAnswer = (input, answer_ref, value) => {
    if (!input) {
        return false;
    }

    const answer = input.possible_answers.find((possible_answer) => {
        return possible_answer.answer_ref === answer_ref;
    });

    if (!answer) {
        return false;
    }

    answer.answer = sanitizeAnswer(value);

    return true;
};

/* Applies the order the sortable produced; refuses a partial list. */
export const reorderPossibleAnswers = (input, refs) => {
    const answers = input ? input.possible_answers : [];
    const by_ref = new Map(answers.map((answer) => {
        return [answer.answer_ref, answer];
    }));
    const ordered = refs.map((ref) => {
        return by_ref.get(ref);
    }).filter(Boolean);

    if (ordered.length !== answers.length) {
        return false;
    }

    answers.splice(0, answers.length, ...ordered);

    return true;
};

/* Paged lists sort one page at a time, so only that slice changes order. */
export const reorderAnswerPage = (input, refs, page) => {
    const answers = input ? input.possible_answers : [];
    const start = (Math.max(page, 1) - 1) * PARAMETERS.ANSWERS_PER_PAGE;
    const page_answers = answers.slice(start, start + PARAMETERS.ANSWERS_PER_PAGE);
    const by_ref = new Map(page_answers.map((answer) => {
        return [answer.answer_ref, answer];
    }));
    const ordered = refs.map((ref) => {
        return by_ref.get(ref);
    }).filter(Boolean);

    if (ordered.length !== page_answers.length) {
        return false;
    }

    answers.splice(start, page_answers.length, ...ordered);

    return true;
};

export const movePossibleAnswer = (input, from_index, to_index) => {
    const answers = input ? input.possible_answers : [];

    if (from_index === to_index || from_index < 0 || to_index < 0 || from_index >= answers.length || to_index >= answers.length) {
        return false;
    }

    const answer = answers.splice(from_index, 1)[0];

    answers.splice(to_index, 0, answer);

    return true;
};

/* Alphabetical or shuffled in place; refs stay with their answer. */
export const orderPossibleAnswers = (input, order) => {
    if (!input || !isMultipleAnswerType(input.type)) {
        return false;
    }

    const ordered = sortAnswers(input.possible_answers, order);

    input.possible_answers.splice(0, ordered.length, ...ordered);

    return true;
};

/* One placeholder answer is the minimum the contract allows. */
export const deleteAllAnswers = (input) => {
    if (!input || !isMultipleAnswerType(input.type)) {
        return false;
    }

    input.possible_answers = [createAnswer()];
    input.default = null;

    return true;
};
