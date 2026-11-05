import { afterEach, describe, expect, it, vi } from 'vitest';
import { hideLoading, showLoading } from '@/ui/loading.js';

function waitOverlay() {
    return document.querySelector('.wait-overlay');
}

afterEach(() => {
    vi.useRealTimers();
    hideLoading();
    document.body.innerHTML = '';
});

describe('wait overlay', () => {
    it('creates the legacy overlay and shows it', () => {
        const loading = showLoading();

        expect(loading).toBe(waitOverlay());
        expect(loading.classList.contains('is-visible')).toBe(true);
        expect(loading.getAttribute('aria-hidden')).toBe('true');
    });

    it('reuses a single overlay', () => {
        showLoading();
        showLoading();

        expect(document.querySelectorAll('.wait-overlay')).toHaveLength(1);
    });

    it('hides immediately without a delay', () => {
        showLoading();
        hideLoading();

        expect(waitOverlay().classList.contains('is-visible')).toBe(false);
    });

    it('hides after the given delay, as the legacy setTimeout does', () => {
        vi.useFakeTimers();
        showLoading();
        hideLoading(1000);

        vi.advanceTimersByTime(999);
        expect(waitOverlay().classList.contains('is-visible')).toBe(true);

        vi.advanceTimersByTime(1);
        expect(waitOverlay().classList.contains('is-visible')).toBe(false);
    });

    it('cancels a pending hide when shown again', () => {
        vi.useFakeTimers();
        showLoading();
        hideLoading(500);
        showLoading();

        vi.advanceTimersByTime(500);
        expect(waitOverlay().classList.contains('is-visible')).toBe(true);
    });
});
