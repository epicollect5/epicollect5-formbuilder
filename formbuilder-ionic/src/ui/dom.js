'use strict';

/*
 * Fixed markup lives in src/views/*.html. These helpers turn a view into
 * nodes; the views never carry project data, which is always set afterwards.
 */
export function parseView(html) {
    const template = document.createElement('template');

    template.innerHTML = html.trim();

    return template.content;
}

export function createView(html) {
    return parseView(html).firstElementChild;
}

export function element(tag, attributes, children) {
    const node = document.createElement(tag);

    Object.keys(attributes || {}).forEach(function (name) {
        const value = attributes[name];

        // an absent attribute must stay absent: setting `undefined` would
        // write the string "undefined" (and disable buttons that are enabled)
        if (value === undefined || value === null) {
            return;
        }

        node.setAttribute(name, value);
    });

    (children || []).forEach(function (child) {
        node.append(child);
    });

    return node;
}

export function icon(name) {
    const node = element('ion-icon', { name: name, 'aria-hidden': 'true' });

    return node;
}

export function button(attributes, children) {
    return element('button', attributes, children);
}
