import { beforeEach, describe, expect, it } from 'vitest';
import { useBuilderStore } from '@/vue/stores/builder.js';
import { usePropertiesStore } from '@/vue/stores/properties.js';
import { updateCurrentInput } from '@/services/session.js';
import { bootStoreTest } from './support/vue-store-fixture.js';

describe('vue properties store', () => {
    beforeEach(() => {
        bootStoreTest();
    });

    it('stores null for an emptied advanced field and keeps the typed value', () => {
        const builder = useBuilderStore();
        const store = usePropertiesStore();

        builder.addQuestion('text');
        builder.chooseInput(builder.currentInputs[1].ref);

        store.editAdvancedField('default', 'My default');

        expect(builder.currentInput.default).toBe('My default');

        store.editAdvancedField('default', '');

        expect(builder.currentInput.default).toBeNull();
    });

    it('switches the numeric type and ignores unknown values', () => {
        const builder = useBuilderStore();
        const store = usePropertiesStore();

        builder.addQuestion('integer');
        builder.chooseInput(builder.currentInputs[1].ref);

        store.setNumericType('decimal');

        expect(builder.currentInput.type).toBe('decimal');
        expect(store.numericType).toBe('decimal');

        const revision = builder.state.change_revision;

        store.setNumericType('date');

        expect(builder.currentInput.type).toBe('decimal');
        expect(builder.state.change_revision).toBe(revision);
    });

    it('repairs a null datetime format when the advanced panel opens', () => {
        const builder = useBuilderStore();
        const store = usePropertiesStore();

        builder.addQuestion('date');
        builder.chooseInput(builder.currentInputs[1].ref);

        // imported questions can arrive with a null format (the factory fills
        // new ones); the panel build repairs it like the vanilla build does
        updateCurrentInput({ datetime_format: null });

        expect(builder.currentInput.datetime_format).toBeNull();

        store.ensureDatetimeFormat();

        expect(builder.currentInput.datetime_format).toBe('dd/MM/YYYY');
    });

    it('lists the branch-scoped uniqueness options inside a branch', () => {
        const builder = useBuilderStore();
        const store = usePropertiesStore();

        builder.addQuestion('branch');
        builder.enterContainer(builder.currentInputs[1].ref);

        expect(store.uniquenessOptions.map((option) => {
            return option.value;
        })).toEqual(['none', 'form']);
        expect(store.uniquenessOptions[1].label).toContain('branch');
    });
});
