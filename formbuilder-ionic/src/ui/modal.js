'use strict';

import { createView, element } from '@/ui/dom.js';
import modal_view from '@/views/modal.html?raw';

/*
 * One legacy-styled modal at a time, rendered inside an ion-modal host so the
 * backdrop, focus trap and dismissal come from Ionic while the panel keeps the
 * Bootstrap markup and `_modals.scss` styling.
 */
let active_modal = null;

export const openModal = (options) => {
    const config = options || {};
    const modal = document.createElement('ion-modal');

    dismissModal();

    modal.className = `legacy-modal-host${config.class_name ? ` ${config.class_name}` : ''}`;

    const shell = createView(modal_view);
    const body = shell.querySelector('.builder__modal-body');
    const footer = shell.querySelector('.builder__modal-footer');

    shell.querySelector('.builder__modal-title').textContent = config.title || '';

    if (config.body) {
        body.append(config.body);
    }

    const remove = () => {
        modal.remove();
    };

    const close = () => {
        if (active_modal === modal) {
            active_modal = null;
        }

        // Ionic re-attaches the host while its dismissal animates, so remove
        // once more after the transition settles.
        if (typeof modal.dismiss === 'function') {
            Promise.resolve(modal.dismiss()).then(remove, remove);
        }

        remove();
    };

    shell.querySelector('.builder__modal-close').addEventListener('click', close);

    (config.buttons || []).forEach((button_config) => {
        // Use Ionic button with clear fill and uppercase text to match mobile app
        // Use Ionic button with clear fill and uppercase text for all modal actions
        const control = element('ion-button', {
            type: 'button',
            fill: 'clear',
            // No class-based styling – ensure uniform appearance
            class: '',
            disabled: button_config.disabled ? true : undefined,
            style: 'text-transform: uppercase;'
        }, [button_config.text || '']);

        control.addEventListener('click', () => {
            if (typeof button_config.on_click === 'function') {
                button_config.on_click(close);
                return;
            }

            close();
        });

        footer.append(control);
    });

    if (!config.buttons || config.buttons.length === 0) {
        footer.remove();
    }

    modal.append(shell);
    document.body.append(modal);

    modal.addEventListener('ionModalDidDismiss', () => {
        if (active_modal === modal) {
            active_modal = null;
        }

        modal.remove();
    });

    if (typeof modal.present === 'function') {
        modal.present();
    }

    active_modal = modal;

    if (typeof config.on_present === 'function') {
        config.on_present({ modal, body, footer, close });
    }

    return { modal, body, footer, close };
};

export const dismissModal = () => {
    if (!active_modal) {
        return;
    }

    const modal = active_modal;

    active_modal = null;

    if (typeof modal.dismiss === 'function') {
        Promise.resolve(modal.dismiss()).then(() => { modal.remove(); }, () => { modal.remove(); });
    }

    modal.remove();
};
