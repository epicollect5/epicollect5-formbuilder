import { beforeEach, describe, expect, it } from 'vitest';
import { useRootStore } from '@/vue/stores/root-store.js';
import { useFormsStore } from '@/vue/stores/forms-store.js';
import { bootStoreTest } from './support/vue-store-fixture.js';

describe('vue forms store', () => {
    beforeEach(() => {
        bootStoreTest();
    });

    it('marks only the last child form as deletable', () => {
        const builder = useRootStore();
        const store = useFormsStore();

        // the root form (index 0) can never be deleted
        expect(store.formDeletable()).toBe(false);

        builder.chooseForm(1);

        // the last child form is deletable
        expect(store.formDeletable()).toBe(true);

        // editing a container blocks the delete
        builder.addQuestion('branch');
        builder.enterContainer(builder.currentInputs[0].ref);
        expect(store.formDeletable()).toBe(false);
    });

    it('copies the selected question to the end with a new ref', () => {
        const builder = useRootStore();

        builder.chooseInput('form_1_text');
        builder.editQuestion('Original');

        builder.copyQuestion();

        expect(builder.currentInputs).toHaveLength(2);
        expect(builder.currentInputs[1].question).toBe('Original');
        expect(builder.currentInputs[1].ref).not.toBe('form_1_text');
        expect(builder.state.unsaved_changes).toBe(true);
    });

    it('deletes the selected question and records the change', () => {
        const builder = useRootStore();

        builder.chooseInput('form_1_text');

        builder.requestDeleteQuestion();

        expect(builder.currentInputs).toHaveLength(0);
        expect(builder.state.unsaved_changes).toBe(true);
    });

    it('delete-all clears the active list', () => {
        const builder = useRootStore();
        const store = useFormsStore();

        builder.addQuestion('text');
        builder.addQuestion('text');

        store.deleteAllQuestions();

        expect(builder.currentInputs).toHaveLength(0);
        expect(builder.state.unsaved_changes).toBe(true);
    });
});
