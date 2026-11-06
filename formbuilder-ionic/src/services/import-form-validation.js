'use strict';

import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import project_schema from '../../schemas/project.schema.json';
import { PARAMETERS } from '@/config/parameters.js';

const CHOICE_TYPES = ['dropdown', 'radio', 'checkbox', 'searchsingle', 'searchmultiple'];
const SEARCH_TYPES = ['searchsingle', 'searchmultiple'];

const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    allowUnionTypes: true
});

addFormats(ajv);
ajv.addSchema(project_schema, PARAMETERS.PROJECT_SCHEMA_ID);

const validate_form = ajv.getSchema(`${PARAMETERS.PROJECT_SCHEMA_ID}#/$defs/form`);
const validate_input = ajv.getSchema(`${PARAMETERS.PROJECT_SCHEMA_ID}#/$defs/input`);
const validate_jump = ajv.getSchema(`${PARAMETERS.PROJECT_SCHEMA_ID}#/$defs/jump`);
const validate_possible_answer = ajv.getSchema(`${PARAMETERS.PROJECT_SCHEMA_ID}#/$defs/possibleAnswer`);

const isChoiceType = (type) => {
    return CHOICE_TYPES.indexOf(type) > -1;
};

const expiresWithoutAnswer = (jump) => {
    return jump.when === 'ALL' || jump.when === 'NO_ANSWER_GIVEN';
};

/**
 * Jump/answer combinations the schema cannot express: a conditional jump must
 * point at one of the input's possible answers, and single-answer inputs can
 * only jump unconditionally.
 */
const jumpsMatchPossibleAnswers = (input) => {
    return input.jumps.every((jump) => {
        if (jump.when === 'ALL') {
            return !jump.answer_ref;
        }

        if (!isChoiceType(input.type)) {
            return false;
        }

        if (jump.when === 'NO_ANSWER_GIVEN') {
            return !jump.answer_ref;
        }

        return input.possible_answers.some((possible_answer) => {
            return possible_answer.answer_ref === jump.answer_ref;
        });
    });
};

const defaultMatchesPossibleAnswer = (input) => {
    if (!input.default || !isChoiceType(input.type)) {
        return true;
    }

    return input.possible_answers.some((possible_answer) => {
        return possible_answer.answer_ref === input.default;
    });
};

const numericRangeIsValid = (input) => {
    if (input.type !== 'integer' && input.type !== 'decimal') {
        return true;
    }

    if (input.min === null || input.min === '' || input.max === null || input.max === '') {
        return true;
    }

    return Number(input.min) < Number(input.max);
};

/**
 * Form import envelope: `{ data: { id, type: 'form', form } }`.
 */
export const hasValidFormStructure = (form) => {
    if (!form || typeof form !== 'object' || !form.data || typeof form.data !== 'object') {
        return false;
    }

    if (typeof form.data.id !== 'string' || form.data.type !== 'form') {
        return false;
    }

    return Boolean(validate_form(form.data.form));
};

export const areJumpsValid = (input) => {
    if (!Array.isArray(input.jumps)) {
        return false;
    }

    return input.jumps.every((jump) => {
        if (!validate_jump(jump)) {
            return false;
        }

        return !(expiresWithoutAnswer(jump) && jump.answer_ref);
    });
};

/**
 * Jump destinations are cross-references, so they stay application logic. The
 * legacy rule is preserved: a jump must skip at least one question, and END is
 * only available when there is a following question.
 */
const availableDestinations = (current_input_index, inputs) => {
    const destinations = new Set();

    if (current_input_index === undefined || current_input_index < 0) {
        return destinations;
    }

    inputs.slice(current_input_index + 2).forEach((input) => {
        destinations.add(input.ref);
    });

    if (current_input_index < inputs.length - 1) {
        destinations.add(PARAMETERS.JUMP_TO_END_OF_FORM_REF);
    }

    return destinations;
};

export const areJumpsDestinationsValid = (inputs) => {
    if (!Array.isArray(inputs)) {
        return false;
    }

    return inputs.every((input, index) => {
        const destinations = availableDestinations(index, inputs);

        if (input.jumps.some((jump) => {
            return !destinations.has(jump.to);
        })) {
            return false;
        }

        return input.branch.every((branch_input, branch_index) => {
            const branch_destinations = availableDestinations(branch_index, input.branch);

            return branch_input.jumps.every((jump) => {
                return branch_destinations.has(jump.to);
            });
        });
    });
};

/**
 * The last question of a form or branch cannot jump anywhere, so legacy exports
 * may still carry a jump there. Drop it before validating.
 */
export const sanitizeLegacyInvalidEndJumps = (inputs) => {
    if (!Array.isArray(inputs) || inputs.length === 0) {
        return inputs;
    }

    const last_input = inputs[inputs.length - 1];

    if (Array.isArray(last_input.jumps)) {
        last_input.jumps = [];
    }

    inputs.forEach((input) => {
        if (!Array.isArray(input.branch) || input.branch.length === 0) {
            return;
        }

        const last_branch_input = input.branch[input.branch.length - 1];

        if (Array.isArray(last_branch_input.jumps)) {
            last_branch_input.jumps = [];
        }
    });

    return inputs;
};

export const arePossibleAnswersValid = (possible_answers, input_type) => {
    if (!Array.isArray(possible_answers) || possible_answers.length === 0) {
        return false;
    }

    const max_answers = SEARCH_TYPES.indexOf(input_type) > -1
        ? PARAMETERS.MAX_SEARCH_ANSWERS
        : PARAMETERS.MAX_ANSWERS;

    if (possible_answers.length > max_answers) {
        return false;
    }

    const answer_refs = new Set();

    return possible_answers.every((possible_answer) => {
        if (!validate_possible_answer(possible_answer)) {
            return false;
        }

        if (answer_refs.has(possible_answer.answer_ref)) {
            return false;
        }

        answer_refs.add(possible_answer.answer_ref);

        return true;
    });
};

export const isValidInput = (form_ref, input, is_branch, is_group) => {
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
};

const import_form_validation = {
    hasValidFormStructure,
    areJumpsValid,
    areJumpsDestinationsValid,
    sanitizeLegacyInvalidEndJumps,
    arePossibleAnswersValid,
    isValidInput: isValidInput
};

export default import_form_validation;
