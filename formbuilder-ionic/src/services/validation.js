'use strict';

import { getForms, getInputs } from '@/models/project-definition.js';
import { getContainerList } from '@/services/nesting.js';
import { hasJumpsTab, isBranchOrGroup } from '@/models/input-properties.js';
import { isMultipleAnswerType } from '@/models/possible-answers.js';
import { jumpNeedsAnswer, JUMP_WHEN } from '@/models/jumps.js';
import { getInputObjectErrors } from '@/models/validation.js';
import { VALIDATION_MESSAGES as M } from '@/config/strings.js';
import { getJumpAvailableDestinations } from '@/services/jumps.js';

/*
 * List-aware validation. A jump can only point forward inside its own list, so
 * jump validity is a function of the order the inputs currently have: every
 * call re-reads the definition instead of caching a result.
 *
 * Errors carry the panel tab they belong to, which drives the tab badges.
 */

export const PROPERTIES_TAB = 'properties';
export const ADVANCED_TAB = 'advanced';
export const JUMPS_TAB = 'jumps';

const destinationRefs = (input, inputs) => {
    return getJumpAvailableDestinations(input, inputs).map((destination) => {
        return destination.ref;
    });
};

export const getJumpErrors = (input, inputs) => {
    if (!input || !hasJumpsTab(input.type)) {
        return [];
    }

    const jumps = Array.isArray(input.jumps) ? input.jumps : [];
    const destinations = destinationRefs(input, inputs).map(String);
    const answers = (input.possible_answers || []).map((answer) => {
        return String(answer.answer_ref);
    });
    const multiple = isMultipleAnswerType(input.type);
    const errors = [];

    jumps.forEach((jump, index) => {
        if (!jump || !jump.to) {
            errors.push({ index, message: M.JUMP_DESTINATION_NOT_SELECTED, tab: JUMPS_TAB });
            return;
        }

        if (destinations.indexOf(String(jump.to)) === -1) {
            errors.push({ index, message: M.JUMP_DESTINATION_INVALID, tab: JUMPS_TAB });
            return;
        }

        if (!multiple) {
            return;
        }

        if (!JUMP_WHEN[jump.when]) {
            errors.push({ index, message: M.JUMP_CONDITION_NOT_SELECTED, tab: JUMPS_TAB });
            return;
        }

        if (jumpNeedsAnswer(jump.when) && answers.indexOf(String(jump.answer_ref)) === -1) {
            errors.push({ index, message: M.JUMP_ANSWER_NOT_SELECTED, tab: JUMPS_TAB });
        }
    });

    return errors;
};

export const getInputErrors = (input, inputs) => {
    if (!input) {
        return [{ message: M.QUESTION_TEXT_EMPTY, tab: PROPERTIES_TAB }];
    }

    const list = Array.isArray(inputs) ? inputs : [];
    const errors = getInputObjectErrors(input);

    getJumpErrors(input, list).forEach((error) => {
        errors.push(error);
    });

    if (isBranchOrGroup(input.type)) {
        const children = getContainerList(input);
        const child_errors = children.reduce((collected, child) => {
            return collected.concat(getInputErrors(child, children));
        }, []);

        if (child_errors.length) {
            errors.push({
                message: input.type === 'branch' ? M.INVALID_BRANCH_INPUTS : M.INVALID_GROUP_INPUTS,
                tab: PROPERTIES_TAB
            });

            // a child's broken jump lights the container's Jumps tab too,
            // instead of hiding behind the generic Properties error (R-32)
            const child_jump_error = child_errors.some((child_error) => {
                return child_error.tab === JUMPS_TAB;
            });

            if (child_jump_error) {
                errors.push({
                    message: input.type === 'branch' ? M.INVALID_BRANCH_INPUTS : M.INVALID_GROUP_INPUTS,
                    tab: JUMPS_TAB
                });
            }
        }
    }

    return errors;
};

export const isInputValid = (input, inputs) => {
    return !!input && getInputErrors(input, inputs).length === 0;
};

/* A form is valid only when it has questions and every one of them is valid. */
export const areFormInputsValid = (form) => {
    const inputs = getInputs(form);

    if (!inputs.length) {
        return false;
    }

    return inputs.every((input) => {
        return isInputValid(input, inputs);
    });
};

export const areAllInputsValid = (project_definition) => {
    const forms = getForms(project_definition);

    return forms.length > 0 && forms.every(areFormInputsValid);
};
