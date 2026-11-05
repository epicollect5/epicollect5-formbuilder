'use strict';

import { FORM_MESSAGES } from '@/models/messages.js';
import { getContainerList } from '@/models/nesting.js';
import { getForms } from '@/models/project-definition.js';
import {
    countInputs,
    countSearchInputs,
    countTitles,
    eachInput,
    INPUTS_MAX_ALLOWED,
    SEARCH_INPUTS_MAX,
    TITLES_MAX
} from '@/services/project-limits.js';
import {
    areJumpsDestinationsValid,
    hasValidFormStructure,
    isValidInput,
    sanitizeLegacyInvalidEndJumps
} from '@/services/import-form-validation.js';

/*
 * Port of `import-form-click-callback.js` minus the DOM work.
 *
 * The import replaces the inputs of the current form. Every imported ref is
 * rewritten to the current form ref, so jumps keep pointing inside the form.
 * The legacy flow ran a string replace over the serialized JSON; this walks the
 * refs instead, so a question containing the imported ref as text is untouched.
 */

/* Re-exported so callers and tests keep one import point for the limits. */
export {
    countInputs,
    countSearchInputs,
    countTitles,
    INPUTS_MAX_ALLOWED,
    SEARCH_INPUTS_MAX,
    TITLES_MAX
};

function remapRefs(inputs, imported_ref, current_ref) {
    const remap = function (value) {
        const ref = String(value);

        return ref.indexOf(imported_ref) === 0 ? current_ref + ref.slice(imported_ref.length) : ref;
    };

    eachInput(inputs, function (input) {
        input.ref = remap(input.ref);

        (input.jumps || []).forEach(function (jump) {
            if (jump.to && jump.to !== 'END') {
                jump.to = remap(jump.to);
            }
        });
    });

    return inputs;
}

export function prepareImportedForm(text, project_definition, form_index) {
    let payload;

    try {
        payload = JSON.parse(text);
    }
    catch (error) {
        return { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
    }

    if (!hasValidFormStructure(payload)) {
        return { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
    }

    const inputs = payload.data.form.inputs;

    if (!Array.isArray(inputs) || inputs.length === 0) {
        return { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
    }

    sanitizeLegacyInvalidEndJumps(inputs);

    const forms = getForms(project_definition);
    const form = forms[form_index];

    if (!form) {
        return { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
    }

    const imported = remapRefs(JSON.parse(JSON.stringify(inputs)), payload.data.form.ref, form.ref);

    if (imported.some(function (input) {
        return !isValidInput(form.ref, input, false, false);
    })) {
        return { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
    }

    if (!areJumpsDestinationsValid(imported)) {
        return { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
    }

    const inputs_total = forms.reduce(function (total, candidate, index) {
        return total + countInputs(index === form_index ? imported : candidate.inputs);
    }, 0);

    if (inputs_total > INPUTS_MAX_ALLOWED) {
        return { ok: false, error: FORM_MESSAGES.FORM_IS_INVALID };
    }

    if (countTitles(imported) > TITLES_MAX) {
        return { ok: false, error: FORM_MESSAGES.FORM_IS_INVALID };
    }

    const branch_titles_exceeded = imported.some(function (input) {
        return input.type === 'branch' && countTitles(getContainerList(input)) > TITLES_MAX;
    });

    if (branch_titles_exceeded) {
        return { ok: false, error: FORM_MESSAGES.FORM_IS_INVALID };
    }

    const search_total = forms.reduce(function (total, candidate, index) {
        return total + countSearchInputs(index === form_index ? imported : candidate.inputs);
    }, 0);

    if (search_total > SEARCH_INPUTS_MAX) {
        return { ok: false, error: FORM_MESSAGES.FORM_IS_INVALID };
    }

    return { ok: true, inputs: imported };
}
