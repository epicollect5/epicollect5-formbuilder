import { describe, expect, it } from 'vitest';
import form_export from './fixtures/form.json';
import { FORM_MESSAGES } from '@/config/strings.js';
import { PARAMETERS } from '@/config/parameters.js';
import {
    countInputs,
    countSearchInputs,
    countTitles
} from '@/models/project-limits.js';
import { prepareImportedForm } from '@/services/form-import.js';

const IMPORTED_REF = form_export.data.form.ref;
// Refs are hex: a letter outside [a-f] fails the schema's ref pattern.
const CURRENT_REF = 'f'.repeat(32) + '_' + 'e'.repeat(13);

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function project_definition() {
    return {
        data: {
            project: {
                name: 'Import test',
                slug: 'import-test',
                forms: [
                    {
                        ref: CURRENT_REF,
                        name: 'Target form',
                        slug: 'target-form',
                        type: 'hierarchy',
                        inputs: [
                            {
                                ref: CURRENT_REF + '_' + 'd'.repeat(13),
                                type: 'text',
                                question: 'Existing question',
                                is_required: false,
                                is_title: false
                            }
                        ]
                    }
                ]
            }
        }
    };
}

function input_with_ref(ref) {
    const input = clone(form_export.data.form.inputs[0]);

    input.ref = ref;

    return input;
}

function payload_with(inputs) {
    const payload = clone(form_export);

    payload.data.form.inputs = inputs;

    return payload;
}

// Refs are hex, so the suffixes must stay inside [a-f0-9].
function suffix(number) {
    return number.toString(16).padStart(13, '0');
}

describe('preparing an import', () => {
    it('rewrites the imported refs onto the current form', () => {
        const result = prepareImportedForm(JSON.stringify(form_export), project_definition(), 0);

        expect(result.ok).toBe(true);
        expect(result.inputs).toHaveLength(1);
        expect(result.inputs[0].ref).toBe(CURRENT_REF + '_ccccccccccccc');
        expect(result.inputs[0].question).toBe('Imported question?');
    });

    it('rewrites jump destinations with the refs', () => {
        // A jump has to skip a question, so the destination is the third input.
        const destination_ref = IMPORTED_REF + '_' + 'a'.repeat(13);
        const first = input_with_ref(IMPORTED_REF + '_ccccccccccccc');
        const second = input_with_ref(IMPORTED_REF + '_' + 'b'.repeat(13));
        const third = input_with_ref(destination_ref);

        first.jumps = [{ to: destination_ref, when: 'ALL', answer_ref: null }];

        const result = prepareImportedForm(
            JSON.stringify(payload_with([first, second, third])),
            project_definition(),
            0
        );

        expect(result.ok).toBe(true);
        expect(result.inputs[0].jumps[0].to).toBe(CURRENT_REF + '_' + 'a'.repeat(13));
    });

    it('rejects malformed and invalid payloads', () => {
        expect(prepareImportedForm('not json', project_definition(), 0)).toEqual({
            ok: false,
            error: FORM_MESSAGES.FORM_FILE_INVALID
        });

        const project_envelope = clone(form_export);

        project_envelope.data.type = 'project';
        expect(prepareImportedForm(JSON.stringify(project_envelope), project_definition(), 0).ok).toBe(false);

        expect(prepareImportedForm(JSON.stringify(payload_with([])), project_definition(), 0).ok).toBe(false);
        expect(prepareImportedForm(JSON.stringify(form_export), project_definition(), 3).ok).toBe(false);
    });

    it('counts nested questions against the project input limit', () => {
        // Every list stays under the schema's maxItems, the total does not.
        const branch = input_with_ref(IMPORTED_REF + '_' + suffix(0));

        branch.type = 'branch';
        branch.branch = [];

        for (let index = 0; index < 150; index += 1) {
            branch.branch.push(input_with_ref(branch.ref + '_' + suffix(index)));
        }

        const inputs = [branch];

        for (let index = 1; index <= 150; index += 1) {
            inputs.push(input_with_ref(IMPORTED_REF + '_' + suffix(index)));
        }

        expect(countInputs(inputs)).toBe(PARAMETERS.INPUTS_MAX_ALLOWED + 1);
        expect(prepareImportedForm(JSON.stringify(payload_with(inputs)), project_definition(), 0)).toEqual({
            ok: false,
            error: FORM_MESSAGES.FORM_IS_INVALID
        });
    });

    it('enforces the title limit', () => {
        const inputs = [];

        for (let index = 0; index < 4; index += 1) {
            const input = input_with_ref(IMPORTED_REF + '_' + suffix(index));

            input.is_title = true;
            inputs.push(input);
        }

        const result = prepareImportedForm(JSON.stringify(payload_with(inputs)), project_definition(), 0);

        expect(result).toEqual({ ok: false, error: FORM_MESSAGES.FORM_IS_INVALID });
    });

    it('reports a valid project after a clean import', () => {
        const result = prepareImportedForm(JSON.stringify(form_export), project_definition(), 0);

        expect(result.ok).toBe(true);
        expect(result.project_valid).toBe(true);
    });

    it('reports an invalid project when another form is invalid', () => {
        const definition = project_definition();
        const other_ref = 'e'.repeat(32) + '_' + 'd'.repeat(13);

        definition.data.project.forms.push({
            ref: other_ref,
            name: 'Other form',
            slug: 'other-form',
            type: 'hierarchy',
            inputs: [
                {
                    ref: other_ref + '_' + 'c'.repeat(13),
                    type: 'text',
                    question: ''
                }
            ]
        });

        const result = prepareImportedForm(JSON.stringify(form_export), definition, 0);

        expect(result.ok).toBe(true);
        expect(result.project_valid).toBe(false);
    });

    it('reports an invalid project when the import passes the schema but not the runtime rules', () => {
        const payload = clone(form_export);

        // the schema leaves the readme length to the app logic
        payload.data.form.inputs[0].type = 'readme';
        payload.data.form.inputs[0].question = 'x'.repeat(1001);

        const result = prepareImportedForm(JSON.stringify(payload), project_definition(), 0);

        expect(result.ok).toBe(true);
        expect(result.project_valid).toBe(false);
    });
});

describe('counts', () => {
    it('counts nested questions and search questions', () => {
        const nested = input_with_ref(IMPORTED_REF + '_' + suffix(1));

        nested.type = 'group';
        nested.group = [input_with_ref(IMPORTED_REF + '_' + suffix(2))];

        const search = input_with_ref(IMPORTED_REF + '_' + suffix(3));

        search.type = 'searchsingle';
        search.possible_answers = [{ answer: 'One', answer_ref: 'd'.repeat(13) }];

        const inputs = [input_with_ref(IMPORTED_REF + '_' + suffix(0)), nested, search];

        expect(countInputs(inputs)).toBe(4);
        expect(countSearchInputs(inputs)).toBe(1);
    });

    it('counts titles per list, not through branches', () => {
        const titled = input_with_ref(IMPORTED_REF + '_' + suffix(0));
        const branch = input_with_ref(IMPORTED_REF + '_' + suffix(1));
        const group = input_with_ref(IMPORTED_REF + '_' + suffix(2));
        const grouped_title = input_with_ref(IMPORTED_REF + '_' + suffix(3));

        titled.is_title = true;
        branch.type = 'branch';
        branch.branch = [input_with_ref(IMPORTED_REF + '_' + suffix(4))];
        group.type = 'group';
        grouped_title.is_title = true;
        group.group = [grouped_title];

        expect(countTitles([titled, branch])).toBe(1);
        expect(countTitles([group])).toBe(1);
    });
});
