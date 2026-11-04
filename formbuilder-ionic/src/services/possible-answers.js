'use strict';

import {
    createAnswer,
    getAnswerLimit,
    isMultipleAnswerType
} from '@/models/possible-answers.js';

/*
 * Possible answers are part of the input object, so these helpers mutate the
 * array in place and never touch the DOM. The last answer cannot be removed and
 * a removed answer clears the default when it pointed at it.
 */

export function addPossibleAnswer(input) {
    if (!input || !isMultipleAnswerType(input.type)) {
        return null;
    }

    if (input.possible_answers.length >= getAnswerLimit(input.type)) {
        return null;
    }

    const answer = createAnswer();

    input.possible_answers.push(answer);

    return answer;
}

export function removePossibleAnswer(input, answer_ref) {
    if (!input || !isMultipleAnswerType(input.type) || input.possible_answers.length <= 1) {
        return false;
    }

    const index = input.possible_answers.findIndex(function (answer) {
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
}

export function renamePossibleAnswer(input, answer_ref, value) {
    if (!input) {
        return false;
    }

    const answer = input.possible_answers.find(function (possible_answer) {
        return possible_answer.answer_ref === answer_ref;
    });

    if (!answer) {
        return false;
    }

    answer.answer = value;

    return true;
}

/* Applies the order the sortable produced; refuses a partial list. */
export function reorderPossibleAnswers(input, refs) {
    const answers = input ? input.possible_answers : [];
    const by_ref = new Map(answers.map(function (answer) {
        return [answer.answer_ref, answer];
    }));
    const ordered = refs.map(function (ref) {
        return by_ref.get(ref);
    }).filter(Boolean);

    if (ordered.length !== answers.length) {
        return false;
    }

    answers.splice.apply(answers, [0, answers.length].concat(ordered));

    return true;
}

export function movePossibleAnswer(input, from_index, to_index) {
    const answers = input ? input.possible_answers : [];

    if (from_index === to_index || from_index < 0 || to_index < 0 || from_index >= answers.length || to_index >= answers.length) {
        return false;
    }

    const answer = answers.splice(from_index, 1)[0];

    answers.splice(to_index, 0, answer);

    return true;
}
