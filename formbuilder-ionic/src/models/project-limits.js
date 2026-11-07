'use strict';

import { FORM_MESSAGES } from '@/config/strings.js';
import { getContainerList } from '@/services/nesting.js';
import { isSearchType } from '@/models/possible-answers.js';
import { getForms, getInputs } from '@/models/project-definition.js';
import { PARAMETERS } from '@/config/parameters.js';

/*
 * The limits the JSON schema cannot express (see `schemas/project.schema.json`):
 * total questions across nesting levels, titles per form / branch, and search
 * questions across the project. They gate both saving and form import.
 */
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

/* Search questions across every form of the project. */
export const countProjectSearchInputs = (project_definition) => {
    return getForms(project_definition).reduce((total, form) => {
        return total + countSearchInputs(getInputs(form));
    }, 0);
};

const branchTitlesExceeded = (inputs) => {
    return (inputs || []).some((input) => {
        if (input.type !== 'branch') {
            return false;
        }

        const children = getContainerList(input);

        return countTitles(children) > PARAMETERS.TITLES_MAX || branchTitlesExceeded(children);
    });
};

/* Returns the first limit error, or null when the project is inside them. */
export const getProjectLimitsError = (project_definition) => {
    const forms = getForms(project_definition);

    // the question cap is per form, as in legacy (the current form's inputs
    // are counted against INPUTS_MAX_ALLOWED, nesting included)
    const form_over_limit = forms.some((form) => {
        return countInputs(getInputs(form)) > PARAMETERS.INPUTS_MAX_ALLOWED;
    });

    if (form_over_limit) {
        return FORM_MESSAGES.TOO_MANY_QUESTIONS;
    }

    if (forms.some((form) => {
        return countTitles(getInputs(form)) > PARAMETERS.TITLES_MAX;
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

    if (search_total > PARAMETERS.SEARCH_INPUTS_MAX) {
        return FORM_MESSAGES.TOO_MANY_SEARCH_QUESTIONS;
    }

    return null;
};
