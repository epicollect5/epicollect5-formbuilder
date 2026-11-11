import { beforeEach, describe, expect, it } from 'vitest';
import { PARAMETERS } from '@/config/parameters.js';
import { useBuilderStore } from '@/vue/stores/builder.js';
import { usePossibleAnswersStore } from '@/vue/stores/possibleAnswers.js';
import { bootStoreTest } from './support/vue-store-fixture.js';

describe('vue possible answers store', () => {
    beforeEach(() => {
        bootStoreTest();
    });

    it('adds an answer, lands on its page and records the change', () => {
        const builder = useBuilderStore();
        const store = usePossibleAnswersStore();

        builder.addQuestion('radio');

        expect(store.possibleAnswerCount).toBe(1);

        store.addPossibleAnswer();

        expect(store.possibleAnswerCount).toBe(2);
        // the new answer is the last one, so the pager jumps to its page
        expect(store.possibleAnswersCurrentPage).toBe(1);
        expect(builder.state.unsaved_changes).toBe(true);
    });

    it('lists one page of initial answers, follows the default and keeps it listed', () => {
        const builder = useBuilderStore();
        const store = usePossibleAnswersStore();

        builder.addQuestion('searchsingle');

        const input = builder.currentInput;

        while (input.possible_answers.length < 150) {
            input.possible_answers.push({
                answer: 'Answer ' + input.possible_answers.length,
                answer_ref: 'a' + input.possible_answers.length
            });
        }

        expect(store.defaultChoicePageCount).toBe(2);
        expect(store.defaultChoiceOptions).toHaveLength(1 + PARAMETERS.ANSWERS_PER_PAGE);

        const late_ref = input.possible_answers[140].answer_ref;

        store.setDefaultChoice(late_ref);

        // the select opens on the page holding the current default
        expect(store.defaultChoiceCurrentPage).toBe(2);
        expect(store.defaultChoiceOptions).toHaveLength(1 + (150 - PARAMETERS.ANSWERS_PER_PAGE));

        store.goToDefaultChoicePage(1);

        expect(store.defaultChoiceCurrentPage).toBe(1);
        // the default stays selectable from the page it is not on
        expect(store.defaultChoiceOptions.some((option) => {
            return option.value === late_ref;
        })).toBe(true);
    });

    it('sanitises renamed answers through the model', () => {
        const builder = useBuilderStore();
        const store = usePossibleAnswersStore();

        builder.addQuestion('radio');

        const ref = builder.currentInput.possible_answers[0].answer_ref;

        store.renamePossibleAnswer(ref, 'A <b>bold</b> answer');

        expect(builder.currentInput.possible_answers[0].answer).not.toContain('<b>');
        expect(builder.currentInput.possible_answers[0].answer).toContain('bold');
    });

    it('refuses removing the last answer and clears a removed default', () => {
        const builder = useBuilderStore();
        const store = usePossibleAnswersStore();

        builder.addQuestion('radio');

        const answers = builder.currentInput.possible_answers;
        const first_ref = answers[0].answer_ref;

        store.setDefaultChoice(first_ref);
        expect(builder.currentInput.default).toBe(first_ref);

        store.addPossibleAnswer();
        const second_ref = builder.currentInput.possible_answers[1].answer_ref;

        store.removePossibleAnswer(first_ref);

        expect(builder.currentInput.possible_answers).toHaveLength(1);
        expect(builder.currentInput.default).toBeNull();

        store.removePossibleAnswer(second_ref);

        expect(builder.currentInput.possible_answers).toHaveLength(1);
    });

    it('blocks paging while a visible answer is empty', () => {
        const builder = useBuilderStore();
        const store = usePossibleAnswersStore();

        builder.addQuestion('radio');

        // build a second page: 101 answers (each add lands on the last page)
        for (let i = 0; i < 100; i += 1) {
            store.addPossibleAnswer();
        }

        expect(store.goToPossibleAnswersPage(1)).toBe(true);

        // empty one answer on the visible page: paging is refused
        builder.currentInput.possible_answers[5].answer = '';

        expect(store.goToPossibleAnswersPage(2)).toBe(false);
        expect(store.possibleAnswersCurrentPage).toBe(1);

        builder.currentInput.possible_answers[5].answer = 'Filled';

        expect(store.goToPossibleAnswersPage(2)).toBe(true);
        expect(store.possibleAnswersCurrentPage).toBe(2);
    });

    it('orders answers ascending and resets to the first page', () => {
        const builder = useBuilderStore();
        const store = usePossibleAnswersStore();

        builder.addQuestion('radio');
        store.renamePossibleAnswer(builder.currentInput.possible_answers[0].answer_ref, 'Zebra');
        store.addPossibleAnswer();
        store.renamePossibleAnswer(builder.currentInput.possible_answers[1].answer_ref, 'Apple');

        store.orderPossibleAnswers('az');

        expect(builder.currentInput.possible_answers[0].answer).toBe('Apple');
        expect(store.possibleAnswersCurrentPage).toBe(1);
    });

    it('delete-all leaves one placeholder and clears the default', () => {
        const builder = useBuilderStore();
        const store = usePossibleAnswersStore();

        builder.addQuestion('radio');
        store.setDefaultChoice(builder.currentInput.possible_answers[0].answer_ref);
        store.addPossibleAnswer();

        store.deleteAllPossibleAnswers();

        expect(builder.currentInput.possible_answers).toHaveLength(1);
        expect(builder.currentInput.default).toBeNull();
        expect(store.possibleAnswersCurrentPage).toBe(1);
    });
});
