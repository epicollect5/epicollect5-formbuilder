import { describe, expect, it } from 'vitest';
import { FORM_MESSAGES } from '@/config/strings.js';
import { PARAMETERS } from '@/config/parameters.js';
import { getFormNameError } from '@/services/form-management.js';

const FORMS = [{ name: 'Screening form' }, { name: 'Second form' }];

describe('form names', () => {
    it('keeps the legacy constants', () => {
        expect(PARAMETERS.MAX_FORMS).toBe(5);
        expect(PARAMETERS.FORM_NAME_MAX_LENGTH).toBe(50);
    });

    it('rejects empty and whitespace-only names', () => {
        expect(getFormNameError(FORMS, '')).toBe(FORM_MESSAGES.FORM_NAME_EMPTY);
        expect(getFormNameError(FORMS, '   ')).toBe(FORM_MESSAGES.FORM_NAME_EMPTY);
        expect(getFormNameError(FORMS, null)).toBe(FORM_MESSAGES.FORM_NAME_EMPTY);
    });

    it('rejects names that are too long or hold invalid characters', () => {
        expect(getFormNameError(FORMS, 'a'.repeat(PARAMETERS.FORM_NAME_MAX_LENGTH + 1))).toBe(FORM_MESSAGES.FORM_NAME_LENGTH);
        expect(getFormNameError(FORMS, 'Form!')).toBe(FORM_MESSAGES.FORM_NAME_INVALID);
    });

    it('rejects a duplicate name regardless of case', () => {
        expect(getFormNameError(FORMS, 'second FORM')).toBe(FORM_MESSAGES.FORM_NAME_EXISTS);
        expect(getFormNameError(FORMS, 'Third form')).toBeNull();
    });

    it('lets a form keep its own name on rename', () => {
        expect(getFormNameError(FORMS, 'Screening form', 0)).toBeNull();
    });
});
