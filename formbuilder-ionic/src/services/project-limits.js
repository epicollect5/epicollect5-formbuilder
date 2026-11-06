'use strict';

import { FORM_MESSAGES } from '@/models/messages.js';
import { getContainerList } from '@/models/nesting.js';
import { isSearchType } from '@/models/possible-answers.js';
import { getForms, getInputs } from '@/models/project-definition.js';
import { PARAMETERS } from '@/models/parameters.js';

/*
 * The limits the JSON schema cannot express (see `schemas/project.schema.json`):
 * total questions across nesting levels, titles per form / branch, and search
 * questions across the project. They gate both saving and form import.
 */
export const INPUTS_MAX_ALLOWED = PARAMETERS.INPUTS_MAX_ALLOWED;
export const TITLES_MAX = PARAMETERS.TITLES_MAX;
export const SEARCH_INPUTS_MAX = PARAMETERS.SEARCH_INPUTS_MAX;

export const eachInput = (inputs, visit) => {
    (inputs || []).forEach((input) => {
        visit(input);

        if (input.type === 'branch' || input.type === 'group') {
            eachInput(getContainerList(input), visit);
        }
    });
};

export const countInputs = (inputs) => {
    let total = 0;

    eachInput(inputs, () => {
        total += 1;
    });

    return total;
};

/* Titles are per list: form inputs and each branch have their own cap. */
export const countTitles = (inputs) => {
    return (inputs || []).reduce((total, input) => {
        const own = input.is_title === true ? 1 : 0;
        const nested = input.type === 'group' ? countTitles(getContainerList(input)) : 0;

        return total + own + nested;
    }, 0);
};

export const countSearchInputs = (inputs) => {
    let total = 0;

    eachInput(inputs, (input) => {
        if (isSearchType(input.type)) {
            total += 1;
        }
    });

    return total;
};

const branchTitlesExceeded = (inputs) => {
    return (inputs || []).some((input) => {
        if (input.type !== 'branch') {
            return false;
        }

        const children = getContainerList(input);

        return countTitles(children) > TITLES_MAX || branchTitlesExceeded(children);
    });
};

/* Returns the first limit error, or null when the project is inside them. */
export const getProjectLimitsError = (project_definition) => {
    const forms = getForms(project_definition);

    const inputs_total = forms.reduce((total, form) => {
        return total + countInputs(getInputs(form));
    }, 0);

    if (inputs_total > INPUTS_MAX_ALLOWED) {
        return FORM_MESSAGES.TOO_MANY_QUESTIONS;
    }

    if (forms.some((form) => {
        return countTitles(getInputs(form)) > TITLES_MAX;
    })) {
        return FORM_MESSAGES.TOO_MANY_TITLES;
    }

    if (forms.some((form) => {
        return branchTitlesExceeded(getInputs(form));
    })) {
        return FORM_MESSAGES.TOO_MANY_TITLES;
    }

    const search_total = forms.reduce((total, form) => {
        return total + countSearchInputs(getInputs(form));
    }, 0);

    if (search_total > SEARCH_INPUTS_MAX) {
        return FORM_MESSAGES.TOO_MANY_SEARCH_QUESTIONS;
    }

    return null;
};
