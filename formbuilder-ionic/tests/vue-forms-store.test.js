import { beforeEach, describe, expect, it } from 'vitest';
import { useBuilderStore } from '@/vue/stores/builder.js';
import { useFormStore } from '@/vue/stores/forms.js';
import { bootStoreTest } from './support/vue-store-fixture.js';

describe('vue forms store', () => {
    beforeEach(() => {
        bootStoreTest();
    });

    it('marks only the last child form as deletable', () => {
        const builder = useBuilderStore();
        const store = useFormStore();

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
        const builder = useBuilderStore();

        builder.chooseInput('form_1_text');
        builder.editQuestion('Original');

        builder.copyQuestion();

        expect(builder.currentInputs).toHaveLength(2);
        expect(builder.currentInputs[1].question).toBe('Original');
        expect(builder.currentInputs[1].ref).not.toBe('form_1_text');
        expect(builder.state.unsaved_changes).toBe(true);
    });

    it('deletes the selected question and records the change', () => {
        const builder = useBuilderStore();

        builder.chooseInput('form_1_text');

        builder.requestDeleteQuestion();

        expect(builder.currentInputs).toHaveLength(0);
        expect(builder.state.unsaved_changes).toBe(true);
    });

    it('delete-all clears the active list', () => {
        const builder = useBuilderStore();
        const store = useFormStore();

        builder.addQuestion('text');
        builder.addQuestion('text');

        store.deleteAllQuestions();

        expect(builder.currentInputs).toHaveLength(0);
        expect(builder.state.unsaved_changes).toBe(true);
    });
});
