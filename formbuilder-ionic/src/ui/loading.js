'use strict';

/*
 * Busy overlay, replacing `.wait-overlay`:
 * `ion-loading` renders a full-viewport backdrop with a spinner and blocks
 * pointer interaction while it is presented. `backdropDismiss` stays false so a
 * click cannot close it; the app closes it when the work settles.
 */
let active_loading = null;

export function showLoading(message) {
    hideLoading();

    const loading = document.createElement('ion-loading');

    loading.message = message || '';
    loading.spinner = 'crescent';
    loading.showBackdrop = true;
    loading.backdropDismiss = false;
    loading.cssClass = 'fb-loading';

    document.body.append(loading);

    if (typeof loading.present === 'function') {
        loading.present();
    }

    active_loading = loading;

    return loading;
}

export function hideLoading() {
    if (!active_loading) {
        return;
    }

    const loading = active_loading;

    active_loading = null;

    if (typeof loading.dismiss === 'function') {
        loading.dismiss();
    }

    loading.remove();
}
