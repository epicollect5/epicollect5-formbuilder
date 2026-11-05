'use strict';

import { getForms, getProject } from '@/models/project-definition.js';
import { areAllInputsValid } from '@/services/validation.js';
import { getJumpAvailableDestinations } from '@/services/jumps.js';

/*
 * Port of `actions/save/**` plus the export half of the form callbacks.
 *
 * Cleaning happens on a deep copy: the live project definition is never
 * mutated, so a save (or a failed save) cannot change what is on screen.
 * On the wire the project is still `base64(gzip(JSON))`, posted as the raw
 * request body like the legacy `$.ajax` call.
 */

const PROJECT_SAVE_PATH = 'api/internal/formbuilder/';

export function replaceWordChars(text) {
    return String(text === undefined || text === null ? '' : text)
        .replace(/[\u2018\u2019\u201A]/g, "'")
        .replace(/[\u201C\u201D\u201E]/g, '"')
        .replace(/\u2026/g, '...')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/\u02C6/g, '^')
        .replace(/\u2039/g, ' ')
        .replace(/\u203A/g, ' ')
        .replace(/[\u02DC\u00A0]/g, ' ')
        .replace(/\uFFFD/g, ' ');
}

function cleanJumpList(jumps, input, inputs, state) {
    const destinations = new Set(getJumpAvailableDestinations(input, inputs).map(function (destination) {
        return String(destination.ref);
    }));

    return (Array.isArray(jumps) ? jumps : []).map(function (jump) {
        const to = jump && jump.to !== undefined && jump.to !== null ? String(jump.to) : '';
        const when = jump && jump.when ? jump.when : 'ALL';
        const answer_ref = when === 'ALL' || when === 'NO_ANSWER_GIVEN' ? null : (jump && jump.answer_ref ? jump.answer_ref : null);

        // END is a valid destination; it is not a question ref.
        if (to !== 'END' && !destinations.has(to)) {
            state.all_jumps_valid = false;
            state.invalid_jumps_question = input.question || '';
        }

        // Rebuilt, so stray properties never reach the server.
        return { to: to, when: when, answer_ref: answer_ref };
    });
}

function cleanInput(input, inputs, state) {
    if (!input || typeof input !== 'object') {
        return;
    }

    if (typeof input.question === 'string') {
        input.question = replaceWordChars(input.question);
    }

    delete input.dom;
    input.jumps = cleanJumpList(input.jumps, input, inputs, state);

    // The legacy contract has no group[] on a branch, even if one was loaded.
    if (input.type === 'branch') {
        input.group = [];
    }

    if (input.type === 'branch') {
        (input.branch || []).forEach(function (child) {
            cleanInput(child, input.branch, state);
        });
    }

    if (input.type === 'group') {
        (input.group || []).forEach(function (child) {
            cleanInput(child, input.group, state);
        });
    }
}

export function cleanProject(project_definition) {
    const cleaned = JSON.parse(JSON.stringify(project_definition));
    const state = { all_jumps_valid: true, invalid_jumps_question: '' };

    getForms(cleaned).forEach(function (form) {
        (form.inputs || []).forEach(function (input) {
            cleanInput(input, form.inputs, state);
        });
    });

    return {
        project_definition: cleaned,
        all_jumps_valid: state.all_jumps_valid,
        invalid_jumps_question: state.invalid_jumps_question
    };
}

/* Reads a stream by hand: Blob.stream() and Response are not available in every
   environment the builder runs in (and not in jsdom). */
async function readStream(readable) {
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

    chunks.forEach(function (value) {
        bytes.set(value, offset);
        offset += value.length;
    });

    return bytes;
}

/* base64(gzip(JSON)), the body the Laravel endpoint decodes. */
export async function encodeProject(project_definition) {
    if (typeof CompressionStream === 'undefined') {
        throw new Error('This browser cannot compress the project definition');
    }

    const stream = new CompressionStream('gzip');
    const compressed = readStream(stream.readable);
    const writer = stream.writable.getWriter();

    await writer.write(new TextEncoder().encode(JSON.stringify(project_definition)));
    await writer.close();

    const bytes = await compressed;
    let binary = '';

    bytes.forEach(function (byte) {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary);
}

/* Laravel's internal formbuilder endpoint, derived from the builder's origin. */
export function getSaveUrl(project_definition, base_url) {
    const project = getProject(project_definition);
    const url = new URL(base_url || document.baseURI);
    const segments = url.pathname.split('/').filter(Boolean);

    // Drop the builder page and the project slug from the path.
    segments.splice(Math.max(segments.length - 2, 0), 2);

    return url.origin + '/' + segments.concat(['api', 'internal', 'formbuilder', project ? project.slug : '']).join('/');
}

export async function saveProject(project_definition, options) {
    const config = options || {};

    if (!areAllInputsValid(project_definition)) {
        throw new Error('The project is invalid');
    }

    const cleaned = cleanProject(project_definition);

    if (!cleaned.all_jumps_valid) {
        throw new Error('Invalid jump on question: ' + cleaned.invalid_jumps_question);
    }

    const payload = await encodeProject(cleaned.project_definition);
    const fetcher = config.fetch_project || window.fetch.bind(window);
    const response = await fetcher(config.url || getSaveUrl(project_definition), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: payload
    });

    if (!response.ok) {
        throw new Error('The project could not be saved (HTTP ' + response.status + ')');
    }

    return cleaned.project_definition;
}

/* `{ data: { id, type: 'form', form } }`, the shape the import expects back. */
export function buildFormExport(project_definition, form_index) {
    const project = getProject(project_definition);
    const form = project && project.forms ? project.forms[form_index] : null;

    if (!form || !Array.isArray(form.inputs) || form.inputs.length === 0) {
        return null;
    }

    if (!areAllInputsValid({ data: { project: { forms: [form] } } })) {
        return null;
    }

    const cleaned = cleanProject(project_definition).project_definition;
    const cleaned_form = getForms(cleaned)[form_index];

    return {
        data: {
            id: cleaned_form.ref,
            type: 'form',
            form: cleaned_form
        }
    };
}

export function getFormExportFilename(project_definition, form_index) {
    const project = getProject(project_definition);
    const form = project && project.forms ? project.forms[form_index] : null;

    if (!project || !form) {
        return 'form.epicollect.json';
    }

    return project.slug + '__' + form.slug + '.form.epicollect.json';
}
