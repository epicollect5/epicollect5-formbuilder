import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBuilderStore } from '@/vue/stores/builder.js';
import { getSession, setProject, updateCurrentInput } from '@/services/session.js';

function project_definition() {
    return {
        data: {
            project: {
                ref: 'proj_1',
                name: 'Vue store test',
                slug: 'vue-store-test',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Form 1',
                        slug: 'form-1',
                        type: 'hierarchy',
                        inputs: [
                            {
                                ref: 'form_1_text',
                                type: 'text',
                                question: '',
                                is_title: false,
                                is_required: false,
                                uniqueness: 'none',
                                regex: '',
                                default: '',
                                verify: false,
                                max: '',
                                min: '',
                                datetime_format: '',
                                set_to_current_datetime: false,
                                possible_answers: [],
                                jumps: [],
                                branch: [],
                                group: []
                            }
                        ]
                    },
                    {
                        ref: 'form_2',
                        name: 'Form 2',
                        slug: 'form-2',
                        type: 'hierarchy',
                        inputs: []
                    }
                ]
            }
        }
    };
}

describe('vue builder store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        setProject(project_definition());
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

    it('stores null for an emptied advanced field and keeps the typed value', () => {
        const store = useBuilderStore();

        store.addQuestion('text');
        store.chooseInput(store.currentInputs[1].ref);

        store.editAdvancedField('default', 'My default');

        expect(store.currentInput.default).toBe('My default');

        store.editAdvancedField('default', '');

        expect(store.currentInput.default).toBeNull();
    });

    it('switches the numeric type and ignores unknown values', () => {
        const store = useBuilderStore();

        store.addQuestion('integer');
        store.chooseInput(store.currentInputs[1].ref);

        store.setNumericType('decimal');

        expect(store.currentInput.type).toBe('decimal');
        expect(store.numericType).toBe('decimal');

        const revision = store.state.change_revision;

        store.setNumericType('date');

        expect(store.currentInput.type).toBe('decimal');
        expect(store.state.change_revision).toBe(revision);
    });

    it('repairs a null datetime format when the advanced panel opens', () => {
        const store = useBuilderStore();

        store.addQuestion('date');
        store.chooseInput(store.currentInputs[1].ref);

        // imported questions can arrive with a null format (the factory fills
        // new ones); the panel build repairs it like the vanilla build does
        updateCurrentInput({ datetime_format: null });

        expect(store.currentInput.datetime_format).toBeNull();

        store.ensureDatetimeFormat();

        expect(store.currentInput.datetime_format).toBe('dd/MM/YYYY');
    });

    it('lists the branch-scoped uniqueness options inside a branch', () => {
        const store = useBuilderStore();

        store.addQuestion('branch');
        store.enterContainer(store.currentInputs[1].ref);

        expect(store.uniquenessOptions.map((option) => {
            return option.value;
        })).toEqual(['none', 'form']);
        expect(store.uniquenessOptions[1].label).toContain('branch');
    });

    it('adds an answer, lands on its page and records the change', () => {
        const store = useBuilderStore();

        store.addQuestion('radio');

        expect(store.answerCount).toBe(1);

        store.addAnswer();

        expect(store.answerCount).toBe(2);
        // the new answer is the last one, so the pager jumps to its page
        expect(store.answerCurrentPage).toBe(1);
        expect(store.state.unsaved_changes).toBe(true);
    });

    it('sanitises renamed answers through the model', () => {
        const store = useBuilderStore();

        store.addQuestion('radio');

        const ref = store.currentInput.possible_answers[0].answer_ref;

        store.renameAnswer(ref, 'A <b>bold</b> answer');

        expect(store.currentInput.possible_answers[0].answer).not.toContain('<b>');
        expect(store.currentInput.possible_answers[0].answer).toContain('bold');
    });

    it('refuses removing the last answer and clears a removed default', () => {
        const store = useBuilderStore();

        store.addQuestion('radio');

        const answers = store.currentInput.possible_answers;
        const first_ref = answers[0].answer_ref;

        store.setDefaultChoice(first_ref);
        expect(store.currentInput.default).toBe(first_ref);

        store.addAnswer();
        const second_ref = store.currentInput.possible_answers[1].answer_ref;

        store.removeAnswer(first_ref);

        expect(store.currentInput.possible_answers).toHaveLength(1);
        expect(store.currentInput.default).toBeNull();

        store.removeAnswer(second_ref);

        expect(store.currentInput.possible_answers).toHaveLength(1);
    });

    it('blocks paging while a visible answer is empty', () => {
        const store = useBuilderStore();

        store.addQuestion('radio');

        // build a second page: 101 answers (each add lands on the last page)
        for (let i = 0; i < 100; i += 1) {
            store.addAnswer();
        }

        expect(store.goToAnswersPage(1)).toBe(true);

        // empty one answer on the visible page: paging is refused
        store.currentInput.possible_answers[5].answer = '';

        expect(store.goToAnswersPage(2)).toBe(false);
        expect(store.answerCurrentPage).toBe(1);

        store.currentInput.possible_answers[5].answer = 'Filled';

        expect(store.goToAnswersPage(2)).toBe(true);
        expect(store.answerCurrentPage).toBe(2);
    });

    it('orders answers ascending and resets to the first page', () => {
        const store = useBuilderStore();

        store.addQuestion('radio');
        store.renameAnswer(store.currentInput.possible_answers[0].answer_ref, 'Zebra');
        store.addAnswer();
        store.renameAnswer(store.currentInput.possible_answers[1].answer_ref, 'Apple');

        store.orderAnswers('az');

        expect(store.currentInput.possible_answers[0].answer).toBe('Apple');
        expect(store.answerCurrentPage).toBe(1);
    });

    it('delete-all leaves one placeholder and clears the default', () => {
        const store = useBuilderStore();

        store.addQuestion('radio');
        store.setDefaultChoice(store.currentInput.possible_answers[0].answer_ref);
        store.addAnswer();

        store.deleteAllCurrentAnswers();

        expect(store.currentInput.possible_answers).toHaveLength(1);
        expect(store.currentInput.default).toBeNull();
        expect(store.answerCurrentPage).toBe(1);
    });
});
