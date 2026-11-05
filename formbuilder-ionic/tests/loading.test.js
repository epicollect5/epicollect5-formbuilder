import { afterEach, describe, expect, it } from 'vitest';
import { hideLoading, showLoading } from '@/ui/loading.js';

afterEach(() => {
    hideLoading();
    document.body.innerHTML = '';
});

describe('busy overlay', () => {
    it('covers the page with a blocking backdrop and a spinner', () => {
        const loading = showLoading('Saving…');

        expect(loading.message).toBe('Saving…');
        expect(loading.showBackdrop).toBe(true);
        expect(loading.backdropDismiss).toBe(false);
        expect(loading.spinner).toBe('crescent');
        expect(document.querySelectorAll('ion-loading')).toHaveLength(1);
    });

    it('replaces an existing overlay', () => {
        showLoading('Saving…');
        showLoading('Importing form…');

        const overlays = [...document.querySelectorAll('ion-loading')];

        expect(overlays).toHaveLength(1);
        expect(overlays[0].message).toBe('Importing form…');
    });

    it('removes the overlay when hidden', () => {
        showLoading('Saving…');
        hideLoading();

        expect(document.querySelectorAll('ion-loading')).toHaveLength(0);
    });
});
