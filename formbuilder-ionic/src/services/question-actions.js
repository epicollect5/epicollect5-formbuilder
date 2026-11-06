'use strict';

import { isBranchOrGroup } from '@/models/input-properties.js';
import { getContainerList } from '@/services/nesting.js';
import { isMultipleAnswerType } from '@/models/possible-answers.js';
import { generateUniqID } from '@/factory/refs-factory.js';
import { addInputObject, getCurrentForm, getEditingContainer } from '@/services/session.js';
import { PARAMETERS } from '@/config/parameters.js';

/*
 * Question duplication, ported from `actions/input-duplicator.js`.
 *
 * The copy belongs to the same parent, so its ref is rebuilt from that parent
 * and every nested child ref from the copied parent: the 3 / 4 / 5-segment ref
 * format is part of the contract. Possible answers get new answer_refs and the
 * default answer is remapped; jumps are dropped unless both ends live inside
 * the copy, because a copied destination never exists at the original ref.
 */

const clone = (value) => {
    return JSON.parse(JSON.stringify(value));
};

const regenerateAnswers = (input, answer_refs) => {
    if (!isMultipleAnswerType(input.type)) {
        return;
    }

    const answers = Array.isArray(input.possible_answers) ? input.possible_answers : [];

    input.possible_answers = answers.map((answer) => {
        const answer_ref = generateUniqID();

        answer_refs.set(String(answer.answer_ref), answer_ref);

        return { answer: answer.answer, answer_ref };
    });

    if (!input.default) {
        return;
    }

    const remapped = answer_refs.get(String(input.default));

    input.default = remapped === undefined ? null : remapped;
};

const regenerateRefs = (input, parent_ref, input_refs, answer_refs) => {
    const old_ref = String(input.ref);

    input.ref = `${parent_ref}_${generateUniqID()}`;
    input_refs.set(old_ref, input.ref);

    regenerateAnswers(input, answer_refs);

    if (isBranchOrGroup(input.type)) {
        getContainerList(input).forEach((child) => {
            regenerateRefs(child, input.ref, input_refs, answer_refs);
        });
    }

    return input;
};

const remapJumps = (input, input_refs, answer_refs) => {
    const jumps = Array.isArray(input.jumps) ? input.jumps : [];

    input.jumps = jumps.map((jump) => {
        const to = jump.to === PARAMETERS.JUMP_TO_END_OF_FORM_REF ? PARAMETERS.JUMP_TO_END_OF_FORM_REF : input_refs.get(String(jump.to));

        if (!to) {
            return null;
        }

        return {
            to,
            when: jump.when,
            answer_ref: jump.answer_ref ? (answer_refs.get(String(jump.answer_ref)) || null) : null
        };
    }).filter(Boolean);

    if (isBranchOrGroup(input.type)) {
        getContainerList(input).forEach((child) => {
            remapJumps(child, input_refs, answer_refs);
        });
    }
};

/* Appends the copy to the active list (form inputs or the container edited). */
export const duplicateInput = (input) => {
    const form = getCurrentForm();

    if (!form || !input) {
        return null;
    }

    const container = getEditingContainer();
    const parent_ref = container ? container.ref : form.ref;
    const copy = clone(input);
    const input_refs = new Map();
    const answer_refs = new Map();

    regenerateRefs(copy, parent_ref, input_refs, answer_refs);

    // A copied question never counts as a title (the 3-title limit is per form).
    copy.is_title = false;
    copy.jumps = [];

    if (isBranchOrGroup(copy.type)) {
        getContainerList(copy).forEach((child) => {
            remapJumps(child, input_refs, answer_refs);
        });
    }

    return addInputObject(copy);
};
