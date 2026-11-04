'use strict';

/*
 * PHP `uniqid()`-compatible ids: the legacy refs are 13 hex characters built
 * from the current time in seconds plus an incrementing seed. Refs are part of
 * the project-definition contract, so the format has to match.
 */

let seed = Math.floor(Math.random() * 0x75bcd15);

function format_seed(value, width) {
    const hex = parseInt(value, 10).toString(16);

    if (width < hex.length) {
        return hex.slice(hex.length - width);
    }

    return Array(1 + (width - hex.length)).join('0') + hex;
}

export function generateUniqID() {
    seed += 1;

    return format_seed(Math.floor(Date.now() / 1000), 8) + format_seed(seed, 5);
}

export function generateInputRef(form_ref) {
    return form_ref + '_' + generateUniqID();
}
