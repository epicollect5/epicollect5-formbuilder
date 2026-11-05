import { afterEach, describe, expect, it } from 'vitest';
import { dismissToast, showToast } from '@/ui/toast.js';

afterEach(() => {
    dismissToast();
    document.body.innerHTML = '';
});

describe('toasts', () => {
    it('presents a single toast at the top with the message', () => {
        const toast = showToast('Project saved!', 'success');

        expect(toast.position).toBe('top');
        expect(toast.message).toBe('Project saved!');
        expect(toast.cssClass).toContain('fb-toast--success');
        expect(document.querySelectorAll('ion-toast')).toHaveLength(1);
    });

    it('maps errors and warnings to the packaged classes', () => {
        expect(showToast('Failed', 'error').cssClass).toContain('fb-toast--danger');
        expect(showToast('Heads up', 'warning').cssClass).toContain('fb-toast--warning');
    });

    it('replaces the previous toast instead of stacking them', () => {
        showToast('First', 'success');
        showToast('Second', 'error');

        const toasts = [...document.querySelectorAll('ion-toast')];

        expect(toasts).toHaveLength(1);
        expect(toasts[0].message).toBe('Second');
    });

    it('ignores an empty message and can be dismissed', () => {
        expect(showToast('', 'error')).toBeNull();

        showToast('Saved', 'success');
        dismissToast();

        expect(document.querySelectorAll('ion-toast')).toHaveLength(0);
    });
});
