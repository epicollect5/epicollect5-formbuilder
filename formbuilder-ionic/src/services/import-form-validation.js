'use strict';

import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import project_schema from '../../schemas/project.schema.json';

const PROJECT_SCHEMA_ID = 'epicollect5-project';
const JUMP_TO_END_OF_FORM_REF = 'END';
const CHOICE_TYPES = ['dropdown', 'radio', 'checkbox', 'searchsingle', 'searchmultiple'];
const SEARCH_TYPES = ['searchsingle', 'searchmultiple'];
const POSSIBLE_ANSWERS_MAX = 300;
const POSSIBLE_ANSWERS_MAX_SEARCH = 1000;

const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    allowUnionTypes: true
});

addFormats(ajv);
ajv.addSchema(project_schema, PROJECT_SCHEMA_ID);

const validate_form = ajv.getSchema(PROJECT_SCHEMA_ID + '#/$defs/form');
const validate_input = ajv.getSchema(PROJECT_SCHEMA_ID + '#/$defs/input');
const validate_jump = ajv.getSchema(PROJECT_SCHEMA_ID + '#/$defs/jump');
const validate_possible_answer = ajv.getSchema(PROJECT_SCHEMA_ID + '#/$defs/possibleAnswer');

function isChoiceType(type) {
    return CHOICE_TYPES.indexOf(type) > -1;
}

function expiresWithoutAnswer(jump) {
    return jump.when === 'ALL' || jump.when === 'NO_ANSWER_GIVEN';
}

/**
 * Jump/answer combinations the schema cannot express: a conditional jump must
 * point at one of the input's possible answers, and single-answer inputs can
 * only jump unconditionally.
 */
function jumpsMatchPossibleAnswers(input) {
    return input.jumps.every(function (jump) {
        if (jump.when === 'ALL') {
            return !jump.answer_ref;
        }

        if (!isChoiceType(input.type)) {
            return false;
        }

        if (jump.when === 'NO_ANSWER_GIVEN') {
            return !jump.answer_ref;
        }

        return input.possible_answers.some(function (possible_answer) {
            return possible_answer.answer_ref === jump.answer_ref;
        });
    });
}

function defaultMatchesPossibleAnswer(input) {
    if (!input.default || !isChoiceType(input.type)) {
        return true;
    }

    return input.possible_answers.some(function (possible_answer) {
        return possible_answer.answer_ref === input.default;
    });
}

function numericRangeIsValid(input) {
    if (input.type !== 'integer' && input.type !== 'decimal') {
        return true;
    }

    if (input.min === null || input.min === '' || input.max === null || input.max === '') {
        return true;
    }

    return Number(input.min) < Number(input.max);
}

/**
 * Form import envelope: `{ data: { id, type: 'form', form } }`.
 */
export function hasValidFormStructure(form) {
    if (!form || typeof form !== 'object' || !form.data || typeof form.data !== 'object') {
        return false;
    }

    if (typeof form.data.id !== 'string' || form.data.type !== 'form') {
        return false;
    }

    return Boolean(validate_form(form.data.form));
}

export function areJumpsValid(input) {
    if (!Array.isArray(input.jumps)) {
        return false;
    }

    return input.jumps.every(function (jump) {
        if (!validate_jump(jump)) {
            return false;
        }

        return !(expiresWithoutAnswer(jump) && jump.answer_ref);
    });
}

/**
 * Jump destinations are cross-references, so they stay application logic. The
 * legacy rule is preserved: a jump must skip at least one question, and END is
 * only available when there is a following question.
 */
function availableDestinations(current_input_index, inputs) {
    const destinations = new Set();

    if (current_input_index === undefined || current_input_index < 0) {
        return destinations;
    }

    inputs.slice(current_input_index + 2).forEach(function (input) {
        destinations.add(input.ref);
    });

    if (current_input_index < inputs.length - 1) {
        destinations.add(JUMP_TO_END_OF_FORM_REF);
    }

    return destinations;
}

export function areJumpsDestinationsValid(inputs) {
    if (!Array.isArray(inputs)) {
        return false;
    }

    return inputs.every(function (input, index) {
        const destinations = availableDestinations(index, inputs);

        if (input.jumps.some(function (jump) {
            return !destinations.has(jump.to);
        })) {
            return false;
        }

        return input.branch.every(function (branch_input, branch_index) {
            const branch_destinations = availableDestinations(branch_index, input.branch);

            return branch_input.jumps.every(function (jump) {
                return branch_destinations.has(jump.to);
            });
        });
    });
}

/**
 * The last question of a form or branch cannot jump anywhere, so legacy exports
 * may still carry a jump there. Drop it before validating.
 */
export function sanitizeLegacyInvalidEndJumps(inputs) {
    if (!Array.isArray(inputs) || inputs.length === 0) {
        return inputs;
    }

    const last_input = inputs[inputs.length - 1];

    if (Array.isArray(last_input.jumps)) {
        last_input.jumps = [];
    }

    inputs.forEach(function (input) {
        if (!Array.isArray(input.branch) || input.branch.length === 0) {
            return;
        }

        const last_branch_input = input.branch[input.branch.length - 1];

        if (Array.isArray(last_branch_input.jumps)) {
            last_branch_input.jumps = [];
        }
    });

    return inputs;
}

export function arePossibleAnswersValid(possible_answers, input_type) {
    if (!Array.isArray(possible_answers) || possible_answers.length === 0) {
        return false;
    }

    const max_answers = SEARCH_TYPES.indexOf(input_type) > -1
        ? POSSIBLE_ANSWERS_MAX_SEARCH
        : POSSIBLE_ANSWERS_MAX;

    if (possible_answers.length > max_answers) {
        return false;
    }

    const answer_refs = new Set();

    return possible_answers.every(function (possible_answer) {
        if (!validate_possible_answer(possible_answer)) {
            return false;
        }

        if (answer_refs.has(possible_answer.answer_ref)) {
            return false;
        }

        answer_refs.add(possible_answer.answer_ref);

        return true;
    });
}

export function isValidInput(form_ref, input, is_branch, is_group) {
    if (!validate_input(input)) {
        return false;
    }

    if (!input.ref.startsWith(form_ref)) {
        return false;
    }

    if (is_branch && input.branch.length > 0) {
        return false;
    }

    if (is_group && (input.group.length > 0 || input.jumps.length > 0)) {
        return false;
    }

    if (!jumpsMatchPossibleAnswers(input)) {
        return false;
    }

    if (!defaultMatchesPossibleAnswer(input)) {
        return false;
    }

    return numericRangeIsValid(input);
}

const import_form_validation = {
    hasValidFormStructure: hasValidFormStructure,
    areJumpsValid: areJumpsValid,
    areJumpsDestinationsValid: areJumpsDestinationsValid,
    sanitizeLegacyInvalidEndJumps: sanitizeLegacyInvalidEndJumps,
    arePossibleAnswersValid: arePossibleAnswersValid,
    isValidInput: isValidInput
};

export default import_form_validation;
