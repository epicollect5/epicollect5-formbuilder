'use strict';

/*
 * Fixed markup lives in src/views/*.html. These helpers turn a view into
 * nodes; the views never carry project data, which is always set afterwards.
 */
export const parseView = (html) => {
    const template = document.createElement('template');

    template.innerHTML = html.trim();

    return template.content;
};

export const createView = (html) => {
    return parseView(html).firstElementChild;
};

export const element = (tag, attributes, children) => {
    const node = document.createElement(tag);

    Object.keys(attributes || {}).forEach((name) => {
        const value = attributes[name];

        // an absent attribute must stay absent: setting `undefined` would
        // write the string "undefined" (and disable buttons that are enabled)
        if (value === undefined || value === null) {
            return;
        }

        node.setAttribute(name, value);
    });

    (children || []).forEach((child) => {
        node.append(child);
    });

    return node;
};

export const icon = (name) => {
    return element('ion-icon', {name, 'aria-hidden': 'true'});
};

export const button = (attributes, children) => {
    return element('button', attributes, children);
};
