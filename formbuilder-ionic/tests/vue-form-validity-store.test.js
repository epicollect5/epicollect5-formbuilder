import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * The real validation wrapped in a spy, so the shared-validity computed can be
 * asserted by call count: one pass per revision, not one per consumer (S-03).
 */
vi.mock('@/services/validation.js', async (importOriginal) => {
    const actual = await importOriginal();

    return Object.assign({}, actual, {
        areFormInputsValid: vi.fn(actual.areFormInputsValid)
    });
});

import { areFormInputsValid } from '@/services/validation.js';
import { setProject } from '@/services/session.js';
import { useRootStore } from '@/vue/stores/root-store.js';
import { bootStoreTest } from './support/vue-store-fixture.js';

describe('vue builder shared form validity', () => {
    beforeEach(() => {
        bootStoreTest();
        areFormInputsValid.mockClear();
    });

    it('runs one validity pass for the save gate, the title and the tab strip', () => {
        const store = useRootStore();

        expect(store.saveEnabled).toBe(false);
        expect(store.saveTitle).toBe('Fix the validation errors before saving');
        expect(store.formTabs.map((tab) => {
            return tab.valid;
        })).toEqual([false, false]);

        // one call per form, not one per consumer (3 consumers x 2 forms)
        expect(areFormInputsValid).toHaveBeenCalledTimes(2);
    });

    it('re-runs the pass once per revision and keeps the three gates in agreement', () => {
        const store = useRootStore();

        store.chooseInput('form_1_text');
        store.editQuestion('What is your name?');

        // the computeds are lazy: the first read after the edit is the pass
        expect(store.formTabs.map((tab) => {
            return tab.valid;
        })).toEqual([true, false]);
        expect(store.saveEnabled).toBe(false);
        expect(store.saveTitle).toBe('Fix the validation errors before saving');
        expect(areFormInputsValid).toHaveBeenCalledTimes(2);

        // re-reading the gates without an edit costs nothing
        expect(store.saveEnabled).toBe(false);
        expect(store.formTabs[1].valid).toBe(false);
        expect(areFormInputsValid).toHaveBeenCalledTimes(2);

        store.chooseForm(1);
        store.addQuestion('text');
        store.editQuestion('Second question');

        expect(store.formTabs.map((tab) => {
            return tab.valid;
        })).toEqual([true, true]);
        expect(store.saveEnabled).toBe(true);
        expect(store.saveTitle).toBe('Save project');
        expect(areFormInputsValid).toHaveBeenCalledTimes(4);
    });

    it('closes the save gate for a project without forms', () => {
        const store = useRootStore();

        setProject({ data: { project: { ref: 'proj_x', name: 'Empty', slug: 'empty', forms: [] } } });

        expect(store.formTabs).toEqual([]);
        expect(store.saveEnabled).toBe(false);
        expect(store.saveTitle).toBe('Fix the validation errors before saving');
    });
});
