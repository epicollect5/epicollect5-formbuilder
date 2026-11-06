'use strict';

import { createJump, jumpNeedsAnswer, JUMP_TO_END_OF_FORM_LABEL, JUMP_WHEN, usesAlwaysJump } from '@/models/jumps.js';
import { hasJumpsTab } from '@/models/input-properties.js';
import { isMultipleAnswerType } from '@/models/possible-answers.js';
import { PARAMETERS } from '@/config/parameters.js';

/*
 * Phase 3 scope: top-level form inputs. `inputs` is the active list so Phase 2
 * can pass branch-scoped children later without changing the contract.
 */
const decodeHtml = (text) => {
    if (!text) {
        return '';
    }

    const textarea = document.createElement('textarea');

    textarea.innerHTML = text;

    return textarea.value;
};

const stripTags = (text) => {
    return String(text || '').replace(/<[^>]*>/g, '');
};

const trunc = (text, length) => {
    const value = String(text || '');

    if (value.length <= length) {
        return value;
    }

    return value.slice(0, length);
};

const destinationLabel = (input) => {
    if (!input) {
        return '';
    }

    if (!input.question) {
        if (input.type === 'branch') {
            return 'No branch header yet';
        }

        return 'No question text yet';
    }

    if (input.type === 'readme') {
        return trunc(stripTags(decodeHtml(input.question)).trim(), PARAMETERS.QUESTION_PREVIEW_LENGTH) || 'Readme';
    }

    return trunc(input.question, PARAMETERS.QUESTION_PREVIEW_LENGTH);
};

export const getJumpAvailableDestinations = (input, inputs) => {
    const list = Array.isArray(inputs) ? inputs : [];
    const current_input_index = list.findIndex((available_input) => {
        return available_input && input && available_input.ref === input.ref;
    });

    if (current_input_index === -1) {
        return [];
    }

    const destinations = list.slice(current_input_index + 2).map((available_input) => {
        return {
            ref: available_input.ref,
            question: destinationLabel(available_input),
            type: available_input.type
        };
    });

    if (current_input_index < list.length - 1) {
        destinations.push({
            ref: PARAMETERS.JUMP_TO_END_OF_FORM_REF,
            question: JUMP_TO_END_OF_FORM_LABEL,
            type: null
        });
    }

    return destinations;
};

const normalizeJump = (jump, input) => {
    const next = {
        to: jump && jump.to !== undefined && jump.to !== null ? String(jump.to) : '',
        when: jump && jump.when ? jump.when : (usesAlwaysJump(input && input.type) ? JUMP_WHEN.ALL : JUMP_WHEN.IS),
        answer_ref: jump && jump.answer_ref !== undefined ? jump.answer_ref : null
    };

    if (usesAlwaysJump(input && input.type)) {
        next.when = JUMP_WHEN.ALL;
        next.answer_ref = null;
        return next;
    }

    if (!jumpNeedsAnswer(next.when)) {
        next.answer_ref = null;
        return next;
    }

    if (next.when !== JUMP_WHEN.IS && next.when !== JUMP_WHEN.IS_NOT) {
        next.when = JUMP_WHEN.IS;
    }

    const possible_answers = input && Array.isArray(input.possible_answers) ? input.possible_answers : [];

    // a ref that no longer matches an answer is kept, not silently retargeted:
    // the row shows it as unavailable and validation flags it, as with jump
    // destinations. Only a missing ref defaults to the first answer.
    if (next.answer_ref === null || next.answer_ref === undefined || next.answer_ref === '') {
        next.answer_ref = possible_answers.length ? (possible_answers[0].answer_ref || '') : '';
    }

    return next;
};

export const sanitizeJump = (jump, input) => {
    return normalizeJump(jump, input);
};

export const canAddJump = (input, inputs) => {
    if (!input || !hasJumpsTab(input.type)) {
        return false;
    }

    // A jump always has to skip at least one question, so the last question of
    // a list has nowhere to go and cannot take a new jump.
    if (getJumpAvailableDestinations(input, inputs).length === 0) {
        return false;
    }

    const jumps = Array.isArray(input.jumps) ? input.jumps : [];

    if (isMultipleAnswerType(input.type)) {
        const possible_answers = Array.isArray(input.possible_answers) ? input.possible_answers : [];

        return possible_answers.length > 0 && jumps.length < possible_answers.length;
    }

    // A single-answer question can only follow one unconditional jump.
    return jumps.length === 0;
};

export const addJump = (input, inputs) => {
    if (!canAddJump(input, inputs)) {
        return null;
    }

    const jump = createJump(input.type, input.possible_answers);

    input.jumps.push(jump);

    return jump;
};

export const removeJump = (input, index) => {
    if (!input || !Array.isArray(input.jumps) || index < 0 || index >= input.jumps.length) {
        return false;
    }

    input.jumps.splice(index, 1);

    return true;
};

export const updateJump = (input, index, patch) => {
    if (!input || !Array.isArray(input.jumps) || index < 0 || index >= input.jumps.length) {
        return false;
    }

    const current = input.jumps[index] || {};
    const next = {
        to: patch && Object.prototype.hasOwnProperty.call(patch, 'to') ? patch.to : current.to,
        when: patch && Object.prototype.hasOwnProperty.call(patch, 'when') ? patch.when : current.when,
        answer_ref: patch && Object.prototype.hasOwnProperty.call(patch, 'answer_ref') ? patch.answer_ref : current.answer_ref
    };

    input.jumps[index] = normalizeJump(next, input);

    return true;
};

