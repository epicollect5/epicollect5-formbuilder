'use strict';

/*
 * Port of the legacy `.wait-overlay` (`css/sass/_mixins.scss`): a fixed,
 * translucent sheet with a wait cursor that covers the builder while an action
 * renders. It is a plain div, not `ion-loading`, because this entry only
 * registers the Ionic components it renders: `ion-loading` was never defined,
 * so the overlay never appeared.
 *
 * Legacy shows the overlay synchronously and hides it from the action's
 * `setTimeout`, so hiding takes the delay and has no animation of its own.
 */
const OVERLAY_CLASS = 'wait-overlay';
let hide_timer = null;

const getOverlay = () => {
    let overlay = document.querySelector(`.${OVERLAY_CLASS}`);

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = OVERLAY_CLASS;
        overlay.setAttribute('aria-hidden', 'true');
        document.body.append(overlay);
    }

    return overlay;
};

export const showLoading = () => {
    if (hide_timer !== null) {
        clearTimeout(hide_timer);
        hide_timer = null;
    }

    const overlay = getOverlay();

    overlay.classList.add('is-visible');

    return overlay;
};

/* Delay in milliseconds, matching the legacy `setTimeout(overlay.fadeOut, …)`. */
export const hideLoading = (delay) => {
    const wait = Number(delay);

    if (hide_timer !== null) {
        clearTimeout(hide_timer);
        hide_timer = null;
    }

    const overlay = document.querySelector(`.${OVERLAY_CLASS}`);

    if (!overlay) {
        return;
    }

    if (!(wait > 0)) {
        overlay.classList.remove('is-visible');
        return;
    }

    hide_timer = setTimeout(() => {
        hide_timer = null;
        overlay.classList.remove('is-visible');
    }, wait);
};
