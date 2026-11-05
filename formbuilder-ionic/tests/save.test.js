import { describe, expect, it, vi } from 'vitest';
import form_export from './fixtures/form.json';
import {
    buildFormExport,
    cleanProject,
    encodeProject,
    getFormExportFilename,
    getSaveUrl,
    replaceWordChars,
    saveProject
} from '@/services/save.js';

const FORM_REF = form_export.data.form.ref;
const has_compression = typeof CompressionStream !== 'undefined';

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function project_definition() {
    return {
        data: {
            project: {
                name: 'Save test',
                slug: 'save-test',
                forms: [clone(form_export.data.form)]
            }
        }
    };
}

function firstInput(project) {
    return project.data.project.forms[0].inputs[0];
}

async function read_stream(readable) {
    const reader = readable.getReader();
    const chunks = [];
    let total = 0;

    for (;;) {
        const chunk = await reader.read();

        if (chunk.done) {
            break;
        }

        chunks.push(chunk.value);
        total += chunk.value.length;
    }

    const bytes = new Uint8Array(total);
    let offset = 0;

    chunks.forEach((value) => {
        bytes.set(value, offset);
        offset += value.length;
    });

    return bytes;
}

async function decode(base64) {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const stream = new DecompressionStream('gzip');
    const decompressed = read_stream(stream.readable);
    const writer = stream.writable.getWriter();

    await writer.write(bytes);
    await writer.close();

    return JSON.parse(new TextDecoder().decode(await decompressed));
}

describe('word characters', () => {
    it('replaces the typographic characters the server cannot store', () => {
        expect(replaceWordChars('don\u2019t \u201cquote\u201d \u2013 \u2026'))
            .toBe('don\'t "quote" - ...');
        expect(replaceWordChars(null)).toBe('');
    });
});

describe('cleaning', () => {
    it('strips dom, rebuilds jumps and leaves the live project untouched', () => {
        const project = project_definition();
        const input = firstInput(project);

        input.dom = { node: true };
        input.question = 'It\u2019s fine';
        input.jumps = [{ to: 'END', when: 'ALL', answer_ref: 'stale', extra: true }];

        const result = cleanProject(project);
        const cleaned = result.project_definition.data.project.forms[0].inputs[0];

        expect(cleaned.dom).toBeUndefined();
        expect(cleaned.question).toBe("It's fine");
        expect(cleaned.jumps).toEqual([{ to: 'END', when: 'ALL', answer_ref: null }]);
        expect(result.all_jumps_valid).toBe(true);
        expect(input.dom).toEqual({ node: true });
    });

    it('reports a jump whose destination is not available', () => {
        const project = project_definition();

        firstInput(project).jumps = [{ to: 'missing_ref', when: 'ALL', answer_ref: null }];

        const result = cleanProject(project);

        expect(result.all_jumps_valid).toBe(false);
        expect(result.invalid_jumps_question).toBe('Imported question?');
    });

    it('empties a branch group array', () => {
        const project = project_definition();
        const input = firstInput(project);

        input.type = 'branch';
        input.group = [{ ref: 'stray', type: 'text', question: 'Stray' }];
        input.branch = [];

        const cleaned = cleanProject(project).project_definition.data.project.forms[0].inputs[0];

        expect(cleaned.group).toEqual([]);
    });
});

describe('encoding', () => {
    it.skipIf(!has_compression)('round-trips base64 gzip', async () => {
        const project = { data: { project: { name: 'Compressed' } } };
        const encoded = await encodeProject(project);

        expect(typeof encoded).toBe('string');
        expect(encoded.length).toBeGreaterThan(0);
        expect(await decode(encoded)).toEqual(project);
    });
});

describe('saving', () => {
    it.skipIf(!has_compression)('posts the compressed project and returns the cleaned copy', async () => {
        const project = project_definition();
        const fetch_project = vi.fn().mockResolvedValue({ ok: true, status: 200 });
        const saved = await saveProject(project, {
            fetch_project,
            url: 'https://example.test/api/internal/formbuilder/save-test'
        });

        expect(fetch_project).toHaveBeenCalledTimes(1);

        const [url, init] = fetch_project.mock.calls[0];

        expect(url).toBe('https://example.test/api/internal/formbuilder/save-test');
        expect(init.method).toBe('POST');
        expect(init.credentials).toBe('same-origin');
        expect(await decode(init.body)).toEqual(saved);
    });

    it('refuses an invalid project before touching the network', async () => {
        const project = project_definition();
        const fetch_project = vi.fn();

        project.data.project.forms[0].inputs = [];

        await expect(saveProject(project, { fetch_project })).rejects.toThrow('The project is invalid');
        expect(fetch_project).not.toHaveBeenCalled();
    });

    it('refuses a project over the title limit', async () => {
        const project = project_definition();
        const form = project.data.project.forms[0];
        const input = clone(form.inputs[0]);

        form.inputs = [0, 1, 2, 3].map((index) => {
            const titled = clone(input);

            titled.is_title = true;
            titled.question = 'Title ' + index;

            return titled;
        });

        await expect(saveProject(project, { fetch_project: vi.fn() })).rejects.toThrow('Too many titles');
    });

    it('counts nested questions against the project limit', async () => {
        const project = project_definition();
        const form = project.data.project.forms[0];
        const branch = clone(form.inputs[0]);

        branch.type = 'branch';
        branch.branch = [];

        for (let index = 0; index < 150; index += 1) {
            branch.branch.push(clone(form.inputs[0]));
        }

        form.inputs = [branch];

        for (let index = 0; index < 150; index += 1) {
            form.inputs.push(clone(form.inputs[0]));
        }

        await expect(saveProject(project, { fetch_project: vi.fn() })).rejects.toThrow('Too many questions');
    });

    it('throws when the endpoint answers with an error', async () => {
        const fetch_project = vi.fn().mockResolvedValue({ ok: false, status: 500 });

        await expect(saveProject(project_definition(), { fetch_project })).rejects.toThrow('HTTP 500');
    });

    it('builds the endpoint from the builder url', () => {
        const url = getSaveUrl(project_definition(), 'https://epicollect.test/my-project/formbuilder');

        expect(url).toBe('https://epicollect.test/api/internal/formbuilder/save-test');
    });
});

describe('export', () => {
    it('wraps the form in the import envelope', () => {
        const payload = buildFormExport(project_definition(), 0);

        expect(payload.data.id).toBe(FORM_REF);
        expect(payload.data.type).toBe('form');
        expect(payload.data.form.ref).toBe(FORM_REF);
        expect(payload.data.form.inputs).toHaveLength(1);
    });

    it('refuses an empty or unselected form', () => {
        const project = project_definition();

        project.data.project.forms[0].inputs = [];

        expect(buildFormExport(project, 0)).toBeNull();
        expect(buildFormExport(project_definition(), 4)).toBeNull();
    });

    it('names the file after the project and the form', () => {
        expect(getFormExportFilename(project_definition(), 0)).toBe('save-test__' + form_export.data.form.slug + '.form.epicollect.json');
    });
});
