'use strict';

/**
 * toastr stand-in rendered with Ionic's toast.
 *
 * The legacy modules call window.toastr.success / error / warning and assign
 * window.toastr.options, so that surface is preserved while the notifications
 * use the prototype's own design instead of the Bootstrap toastr theme.
 */

import { toastController } from '@ionic/core/components';

const DEFAULT_DURATION = 2000;
const TOAST_CLASSES = {
    success: 'fb-toast--success',
    error: 'fb-toast--danger',
    warning: 'fb-toast--warning',
    info: 'fb-toast--primary'
};

let current_toast = null;

/**
 * The legacy messages are plain strings, but a few of them embed <br/> and html.
 * Ionic renders the message as text, so flatten it first.
 */
function message_text(message) {
    return String(message === undefined || message === null ? '' : message)
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * toastr treats a 0 timeout as "stay until dismissed", which is how the legacy
 * config (config/toast.js) shows errors and warnings.
 */
function duration_of(options) {
    const time_out = Number(options && options.timeOut);

    if (!options || options.timeOut === undefined || Number.isNaN(time_out)) {
        return DEFAULT_DURATION;
    }

    return time_out > 0 ? time_out : 0;
}

async function dismiss_current_toast() {
    const toast = current_toast;

    current_toast = null;

    if (!toast) {
        return;
    }

    try {
        await toast.dismiss();
    }
    catch (error) {
        // the toast is already gone (auto hide or tap)
    }
}

async function show_toast(toastr, type, message) {
    const text = message_text(message);

    if (text === '') {
        return;
    }

    const duration = duration_of(toastr.options);

    await dismiss_current_toast();

    const toast = await toastController.create({
        message: text,
        duration: duration,
        position: 'top',
        cssClass: 'fb-toast ' + (TOAST_CLASSES[type] || 'fb-toast--primary'),
        buttons: duration === 0 ? [{ text: 'Dismiss', role: 'cancel' }] : []
    });

    current_toast = toast;

    await toast.present();
}

/**
 * Replace the toastr global with the Ionic toast implementation.
 */
export function installLegacyToast(target_window) {
    const toastr = {
        options: {},
        success: function (message) {
            return show_toast(toastr, 'success', message);
        },
        error: function (message) {
            return show_toast(toastr, 'error', message);
        },
        warning: function (message) {
            return show_toast(toastr, 'warning', message);
        },
        info: function (message) {
            return show_toast(toastr, 'info', message);
        },
        clear: function () {
            return dismiss_current_toast();
        }
    };

    target_window.toastr = toastr;

    return toastr;
}
