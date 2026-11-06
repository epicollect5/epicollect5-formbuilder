'use strict';

/*
 * Confirmation dialog replacing the Bootstrap `warning-delete-question` modal.
 * One alert at a time; the confirm handler runs only from the confirm button.
 */
let active_alert = null;

export const confirmAlert = (options) => {
    const config = options || {};

    dismissAlert();

    const dialog = document.createElement('ion-alert');

    dialog.header = config.header || 'Warning';
    dialog.message = config.message || '';
    dialog.backdropDismiss = true;
    dialog.buttons = [
        { text: config.cancel_text || 'Cancel', role: 'cancel' },
        {
            text: config.confirm_text || 'Confirm',
            role: 'confirm',
            handler: config.on_confirm
        }
    ];

    document.body.append(dialog);

    dialog.addEventListener('ionAlertDidDismiss', () => {
        if (active_alert === dialog) {
            active_alert = null;
        }

        dialog.remove();
    });

    if (typeof dialog.present === 'function') {
        dialog.present();
    }

    active_alert = dialog;

    return dialog;
};

export const dismissAlert = () => {
    if (!active_alert) {
        return;
    }

    const dialog = active_alert;

    active_alert = null;

    if (typeof dialog.dismiss === 'function') {
        dialog.dismiss();
    }

    dialog.remove();
};
