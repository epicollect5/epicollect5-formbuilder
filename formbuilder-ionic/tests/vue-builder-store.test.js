import { beforeEach, describe, expect, it } from 'vitest';
import { useBuilderStore } from '@/vue/stores/builder.js';
import { getSession, setProject } from '@/services/session.js';
import { bootStoreTest, project_definition } from './support/vue-store-fixture.js';

describe('vue builder store', () => {
    beforeEach(() => {
        bootStoreTest();
    });

    it('exposes the shared reactive session as its state', () => {
        const store = useBuilderStore();

        expect(store.state.session.project_definition).toBeDefined();
        // the store holds the same object the services mutate, not a copy
        expect(store.state.session).toBe(getSession());
    });

    it('selects a question and derives the current input', () => {
        const store = useBuilderStore();

        store.chooseInput('form_1_text');

        expect(store.state.session.current_input_ref).toBe('form_1_text');
        expect(store.currentInput.ref).toBe('form_1_text');
        expect(store.currentInputs).toHaveLength(1);
    });

    it('derives the form tabs with counts and validity', () => {
        const store = useBuilderStore();

        expect(store.formTabs).toHaveLength(2);
        expect(store.formTabs[0].count).toBe(1);
        // an empty question text is invalid, so both forms start invalid
        expect(store.formTabs[0].valid).toBe(false);
        // a form without questions is invalid as well
        expect(store.formTabs[1].valid).toBe(false);
    });

    it('keeps the save gate closed for an invalid project and opens it after a valid edit', () => {
        const store = useBuilderStore();

        // an empty form is always invalid, so the gate test uses one form only
        const single_form = project_definition();

        single_form.data.project.forms.pop();
        bootStoreTest();
        setProject(single_form);

        store.chooseInput('form_1_text');

        expect(store.saveEnabled).toBe(false);

        store.editQuestion('What is your name?');

        expect(store.currentInput.question).toBe('What is your name?');
        expect(store.saveEnabled).toBe(true);
        expect(store.state.unsaved_changes).toBe(true);
        expect(store.state.change_revision).toBe(1);
    });

    it('records an undo step per discrete change and exposes the undo gate', () => {
        const store = useBuilderStore();

        expect(store.canUndo).toBe(false);

        store.chooseInput('form_1_text');
        store.editQuestion('First');
        store.editQuestion('Second');

        // typing coalesces through the throttle; a discrete action pushes one step
        store.toggleRequired(true);

        expect(store.state.unsaved_changes).toBe(true);
        expect(store.currentInput.is_required).toBe(true);
        expect(store.canUndo).toBe(true);
    });

    it('switches forms and resets the selection', () => {
        const store = useBuilderStore();

        store.chooseInput('form_1_text');
        store.chooseForm(1);

        expect(store.state.session.current_form_index).toBe(1);
        expect(store.currentInput).toBeNull();
        expect(store.currentInputs).toHaveLength(0);
    });

    it('gates the palette tools by the container nesting rules', () => {
        const store = useBuilderStore();

        const by_type = {};
        store.tools.forEach((tool) => {
            by_type[tool.type] = tool.allowed;
        });

        // the form list accepts branches and groups
        expect(by_type.branch).toBe(true);
        expect(by_type.group).toBe(true);
    });

    it('refuses a fourth title like the vanilla toggle (R-12)', () => {
        const store = useBuilderStore();

        store.addQuestion('text');
        store.addQuestion('text');
        store.addQuestion('text');

        const inputs = store.currentInputs;

        expect(store.toggleTitle(true)).toBe(true);
        store.chooseInput(inputs[1].ref);
        expect(store.toggleTitle(true)).toBe(true);
        store.chooseInput(inputs[2].ref);
        expect(store.toggleTitle(true)).toBe(true);
        store.chooseInput(inputs[0].ref);
        expect(store.toggleTitle(true)).toBe(false);
        expect(store.currentInput.is_title).toBe(false);
    });

    it('adds a question and selects it with a recorded change', () => {
        const store = useBuilderStore();

        store.addQuestion('radio');

        expect(store.currentInputs).toHaveLength(2);
        expect(store.state.session.current_input_ref).toBe(store.currentInputs[1].ref);
        expect(store.state.change_revision).toBe(1);
        expect(store.state.unsaved_changes).toBe(true);
    });

    it('applies a sortable reorder through the session service', () => {
        const store = useBuilderStore();

        store.addQuestion('text');

        const refs = store.currentInputs.map((input) => {
            return input.ref;
        });
        const reordered = [refs[1], refs[0]];

        store.setActiveInputs([...store.currentInputs].sort((a, b) => {
            return reordered.indexOf(a.ref) - reordered.indexOf(b.ref);
        }));

        expect(store.currentInputs.map((input) => {
            return input.ref;
        })).toEqual(reordered);
        expect(store.state.unsaved_changes).toBe(true);
    });

    it('refuses a partial reorder without recording a change', () => {
        const store = useBuilderStore();

        store.addQuestion('text');

        const partial = [store.currentInputs[0]];

        store.setActiveInputs(partial);

        expect(store.currentInputs).toHaveLength(2);
        expect(store.state.change_revision).toBe(1);
    });

    it('inserts a dropped palette tool at the drop index', () => {
        const store = useBuilderStore();

        store.addQuestion('text');

        const inputs = store.currentInputs;
        // the draggable reports the list with the cloned tool object inserted
        const with_tool = [
            inputs[0],
            { type: 'radio', label: 'Radio', icon: 'radio-button-on-outline' },
            inputs[1]
        ];

        store.setActiveInputs(with_tool);

        expect(store.currentInputs).toHaveLength(3);
        expect(store.currentInputs[1].type).toBe('radio');
        expect(store.currentInputs[1].ref).not.toBeUndefined();
        expect(store.state.session.current_input_ref).toBe(store.currentInputs[1].ref);
        expect(store.state.unsaved_changes).toBe(true);
    });
});
