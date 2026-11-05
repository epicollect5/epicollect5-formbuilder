'use strict';

/*
 * Toastr replacement: one ion-toast at the top of the page.
 *
 * A single toast is kept on screen at a time, so a burst of messages (or a
 * success followed by an error) cannot stack. The styles live in
 * `theme/components/legacy-toast.scss`.
 */
const TOAST_DURATION = 3200;

const TOAST_CLASSES = {
    success: 'fb-toast--success',
    error: 'fb-toast--danger',
    warning: 'fb-toast--warning'
};

let active_toast = null;

export function showToast(message, type) {
    if (!message) {
        return null;
    }

    dismissToast();

    const toast = document.createElement('ion-toast');

    toast.cssClass = 'fb-toast ' + (TOAST_CLASSES[type] || TOAST_CLASSES.success);
    toast.position = 'top';
    toast.duration = TOAST_DURATION;
    toast.message = String(message);
    toast.buttons = [{ text: 'Dismiss', role: 'cancel' }];

    // The custom element is not upgraded in jsdom, so only remove on the event.
    toast.addEventListener('ionToastDidDismiss', function () {
        if (active_toast === toast) {
            active_toast = null;
        }

        toast.remove();
    });

    document.body.append(toast);

    if (typeof toast.present === 'function') {
        toast.present();
    }

    active_toast = toast;

    return toast;
}

export function dismissToast() {
    if (!active_toast) {
        return;
    }

    const toast = active_toast;

    active_toast = null;

    if (typeof toast.dismiss === 'function') {
        toast.dismiss();
    }

    toast.remove();
}
