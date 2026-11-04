'use strict';

export function element(tag, attributes, children) {
    const node = document.createElement(tag);

    Object.keys(attributes || {}).forEach(function (name) {
        node.setAttribute(name, attributes[name]);
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
