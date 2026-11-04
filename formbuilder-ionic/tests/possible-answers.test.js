'use strict';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    $,
    build_panel,
    consts,
    create_input,
    possible_answers,
    toastr
} from './support/properties-panel.js';

const LIST = '.input-properties__form__possible-answers__list';
const ROW = LIST + ' li';
const ANSWER_FIELD = ROW + ' div input';
const REMOVE_BTN = '.input-properties__form__possible-answers__list__remove-answer';
const DEFAULT_SELECT = '.input-properties__form__advanced-properties__default select';

function three_answers() {
    return [
        { answer: 'Yes', answer_ref: 'ec5_1_answer_1' },
        { answer: 'Maybe', answer_ref: 'ec5_1_answer_2' },
        { answer: 'No', answer_ref: 'ec5_1_answer_3' }
    ];
}

describe('possible answers', function () {
    beforeEach(function () {
        vi.spyOn($.fn, 'fadeIn').mockImplementation(function () {
            return this;
        });

        // jsdom has no animation frames; run the removal callback straight away
        vi.spyOn($.fn, 'fadeOut').mockImplementation(function (duration, callback) {
            if (typeof callback === 'function') {
                callback.call(this);
            }

            return this;
        });

        toastr.error.mockClear();
    });

    it('appends an answer row and saves the list', function () {
        const input = create_input();

        build_panel(input);
        possible_answers.addPossibleAnswer(input);

        expect($(ROW).length).toBe(3);
        expect($(ANSWER_FIELD).last().val()).toBe(consts.POSSIBILE_ANSWER_PLACEHOLDER);
        expect(input.savePossibleAnswers).toHaveBeenCalled();
        expect(input.possible_answers.length).toBe(3);
        expect(input.possible_answers[2].answer).toBe(consts.POSSIBILE_ANSWER_PLACEHOLDER);
    });

    it('does not append an answer while an existing one is empty', function () {
        const input = create_input();

        build_panel(input);
        $(ANSWER_FIELD).first().val('');

        possible_answers.addPossibleAnswer(input);

        expect($(ROW).length).toBe(2);
        expect(toastr.error).toHaveBeenCalledTimes(1);
        expect(input.savePossibleAnswers).not.toHaveBeenCalled();
    });

    it('removes the answer row and the matching project entry', function () {
        const input = create_input({ possible_answers: three_answers() });

        build_panel(input);
        possible_answers.removePossibleAnswer(input, 1);

        expect($(ROW).length).toBe(2);
        expect($(ANSWER_FIELD).map(function () {
            return $(this).val();
        }).get()).toEqual(['Yes', 'No']);
        expect(input.possible_answers.map(function (possible_answer) {
            return possible_answer.answer;
        })).toEqual(['Yes', 'No']);
    });

    it('keeps the last answer in place', function () {
        const input = create_input({
            possible_answers: [
                { answer: 'Yes', answer_ref: 'ec5_1_answer_1' }
            ]
        });

        build_panel(input);
        possible_answers.removePossibleAnswer(input, 0);

        expect($(ROW).length).toBe(1);
        expect(input.possible_answers.length).toBe(1);
        expect($(REMOVE_BTN).prop('disabled')).toBe(true);
    });

    it('fills the default answer select with the answers and the saved default', function () {
        const input = create_input({
            possible_answers: three_answers(),
            default: 'ec5_1_answer_2'
        });

        build_panel(input);
        possible_answers.listPossibleInitialAnswers(input);

        const default_select = $(DEFAULT_SELECT);

        expect(default_select.find('option').length).toBe(4);
        expect(default_select.find('option').first().val()).toBe('');
        expect(default_select.find('option:selected').val()).toBe('ec5_1_answer_2');
        expect(default_select.find('option:selected').text()).toBe('Maybe');
    });
});
