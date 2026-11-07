'use strict';

import { FORM_MESSAGES } from '@/config/strings.js';
import { getContainerList } from '@/services/nesting.js';
import { areFormInputsValid } from '@/services/validation.js';
import { getForms } from '@/models/project-definition.js';
import {
    countInputs,
    countTitles,
    eachInput
} from '@/models/project-limits.js';
import { PARAMETERS } from '@/config/parameters.js';
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

const remapRefs = (inputs, imported_ref, current_ref) => {
    const remap = (value) => {
        const ref = String(value);

        return ref.indexOf(imported_ref) === 0 ? current_ref + ref.slice(imported_ref.length) : ref;
    };

    eachInput(inputs, (input) => {
        input.ref = remap(input.ref);

        (input.jumps || []).forEach((jump) => {
            if (jump.to && jump.to !== 'END') {
                jump.to = remap(jump.to);
            }
        });
    });

    return inputs;
};

export const prepareImportedForm = (text, project_definition, form_index) => {
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

    if (imported.some((input) => {
        return !isValidInput(form.ref, input, false, false);
    })) {
        return { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
    }

    if (!areJumpsDestinationsValid(imported)) {
        return { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
    }

    /*
     * Legacy import limits (import-form-click-callback.js): the imported form's
     * own totals are refused, but the project-level caps are not — the search
     * cap only raises a warning after a successful import. The project caps
     * stay enforced on save (a deliberate port divergence).
     */
    if (countInputs(imported) > PARAMETERS.INPUTS_MAX_ALLOWED) {
        return { ok: false, error: FORM_MESSAGES.FORM_IS_INVALID };
    }

    if (countTitles(imported) > PARAMETERS.TITLES_MAX) {
        return { ok: false, error: FORM_MESSAGES.FORM_IS_INVALID };
    }

    const branch_titles_exceeded = imported.some((input) => {
        return input.type === 'branch' && countTitles(getContainerList(input)) > PARAMETERS.TITLES_MAX;
    });

    if (branch_titles_exceeded) {
        return { ok: false, error: FORM_MESSAGES.FORM_IS_INVALID };
    }

    /*
     * The checks above only cover the imported list and the project caps. The
     * runtime rules the schema leaves to the app (readme length, branch
     * children, question text) can still fail, so report the whole-project
     * state after the swap instead of letting the save gate surface it (R-67).
     */
    const project_valid = forms.every((candidate, index) => {
        return areFormInputsValid(index === form_index ?
            Object.assign({}, candidate, { inputs: imported }) :
            candidate);
    });

    return { ok: true, inputs: imported, project_valid };
};
