import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmAlert, dismissAlert } from '@/ui/alert.js';

afterEach(() => {
    dismissAlert();
    document.body.innerHTML = '';
});

describe('confirmations', () => {
    it('presents one alert with cancel and confirm buttons', () => {
        const on_confirm = vi.fn();
        const dialog = confirmAlert({
            header: 'Warning',
            message: 'Delete this question?',
            confirm_text: 'Confirm',
            on_confirm
        });

        expect(dialog.header).toBe('Warning');
        expect(dialog.message).toBe('Delete this question?');
        expect(dialog.buttons.map((button) => button.role)).toEqual(['cancel', 'confirm']);
        expect(dialog.buttons[1].text).toBe('Confirm');
        expect(document.querySelectorAll('ion-alert')).toHaveLength(1);

        dialog.buttons[1].handler();

        expect(on_confirm).toHaveBeenCalledTimes(1);
    });

    it('replaces an open alert instead of stacking them', () => {
        confirmAlert({ message: 'First' });
        confirmAlert({ message: 'Second' });

        const dialogs = [...document.querySelectorAll('ion-alert')];

        expect(dialogs).toHaveLength(1);
        expect(dialogs[0].message).toBe('Second');
    });

    it('can be dismissed', () => {
        confirmAlert({ message: 'Delete?' });
        dismissAlert();

        expect(document.querySelectorAll('ion-alert')).toHaveLength(0);
    });
});
