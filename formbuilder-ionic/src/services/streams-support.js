'use strict';

/*
 * Compression Streams support for Safari < 16.4 and Firefox < 113, where the
 * native API is missing but TransformStream exists (Safari 14.1+, Firefox
 * 103+): the fflate-based ponyfill installs lazily on first use, so evergreen
 * browsers never download it (R-66). Browsers without TransformStream either
 * keep the hard failure.
 */
let installed = false;

export const ensureCompressionStreams = async () => {
    if (installed || typeof CompressionStream !== 'undefined') {
        installed = true;
        return;
    }

    if (typeof TransformStream === 'undefined') {
        throw new Error('This browser supports neither CompressionStream nor TransformStream');
    }

    const { makeCompressionStream, makeDecompressionStream } = await import('compression-streams-polyfill/ponyfill');

    window.CompressionStream = makeCompressionStream(TransformStream);
    window.DecompressionStream = makeDecompressionStream(TransformStream);
    installed = true;
};
