'use strict';

import { resolveIconName } from '@/models/font-awesome-icons.js';

const HOST_CLASS = 'legacy-icon';
const ICON_SELECTOR = 'i.fa';

function isIconHost(element) {
    return element.nodeType === 1 && element.matches && element.matches(ICON_SELECTOR);
}

function iconChildOf(element) {
    return element.querySelector(':scope > ion-icon');
}

/**
 * Add (or refresh) the Ionicons glyph inside a Font Awesome host element.
 * The host element and its classes are preserved on purpose: the legacy
 * modules use them as selectors and as validation state.
 */
export function upgradeIcon(element) {
    if (!isIconHost(element)) {
        return null;
    }

    let icon = iconChildOf(element);

    if (!icon) {
        icon = element.ownerDocument.createElement('ion-icon');
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('role', 'presentation');
        element.appendChild(icon);
        element.classList.add(HOST_CLASS);
    }

    const name = resolveIconName(element.classList);

    if (icon.getAttribute('name') !== name) {
        icon.setAttribute('name', name);
    }

    return icon;
}

export function upgradeIconsWithin(root) {
    const icons = root.querySelectorAll(ICON_SELECTOR);

    for (let index = 0; index < icons.length; index++) {
        upgradeIcon(icons[index]);
    }
}

/**
 * Upgrade every Font Awesome icon under `root`, including markup injected later
 * by the legacy render/template modules and by state changes such as
 * `removeClass('fa-warning').addClass('fa-check')`.
 */
export function startIconBridge(root) {
    upgradeIconsWithin(root);

    const observer = new MutationObserver(function (records) {
        records.forEach(function (record) {
            if (record.type === 'attributes' && isIconHost(record.target)) {
                upgradeIcon(record.target);
                return;
            }

            if (record.type === 'childList') {
                record.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) {
                        return;
                    }

                    if (isIconHost(node)) {
                        upgradeIcon(node);
                    }

                    upgradeIconsWithin(node);
                });
            }
        });
    });

    observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });

    return observer;
}
