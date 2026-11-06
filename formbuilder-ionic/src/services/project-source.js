'use strict';

import { PARAMETERS } from '@/config/parameters.js';

export const getProjectUrl = (base_url) => {
    return new URL(PARAMETERS.PROJECT_PATH, base_url || document.baseURI).href;
};

/*
 * The endpoint answers with plain JSON in the standalone build and with a
 * gzipped, base64-encoded body when the Laravel API serves it.
 */
export const decodeProjectPayload = async (payload) => {
    const trimmed = String(payload || '').trim();

    if (!trimmed) {
        throw new Error('The project payload is empty');
    }

    if (trimmed.charAt(0) === '{') {
        return JSON.parse(trimmed);
    }

    if (typeof DecompressionStream === 'undefined') {
        throw new Error('This browser cannot decode a gzipped project definition');
    }

    const bytes = Uint8Array.from(atob(trimmed), (character) => {
        return character.charCodeAt(0);
    });
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));

    return JSON.parse(await new Response(stream).text());
};

export const loadProject = async (base_url, fetch_project) => {
    const fetcher = fetch_project || window.fetch.bind(window);
    const response = await fetcher(`${getProjectUrl(base_url)}?${Date.now()}`, {
        credentials: 'same-origin',
        headers: { accept: 'application/json' }
    });

    if (!response.ok) {
        throw new Error(`The project could not be loaded (HTTP ${response.status})`);
    }

    return decodeProjectPayload(await response.text());
};
