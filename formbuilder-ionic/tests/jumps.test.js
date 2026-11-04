'use strict';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { $, build_panel, consts, create_input, jumps } from './support/properties-panel.js';

const LIST = '.input-properties__form__jumps__list';
const ROW = '.input-properties__form__jumps__list-item';
const NO_JUMPS = '.input-properties__form__jumps__no-jumps-message';
const JUMP_STATE = '.inputs-collection .input .input-inner .jump-state';
const WHEN_SELECT = LIST + ' .input-properties__form__jumps__logic--when select';
const ANSWER_WRAPPER = LIST + ' .input-properties__form__jumps__logic--answer';
const ANSWER_SELECT = ANSWER_WRAPPER + ' select';
const GOTO_SELECT = LIST + ' .input-properties__form__jumps__logic--goto select';
const REMOVE_BTN = '.input-properties__form__jumps__remove-jump';

function remove_first_jump(input) {
    jumps.removeJump(input, $(LIST).children('li').first().find(REMOVE_BTN));
}

describe('jumps', function () {
    beforeEach(function () {
        vi.spyOn($.fn, 'fadeIn').mockImplementation(function () {
            return this;
        });
    });

    it('adds a jump row with when, answer and go to selects', function () {
        const input = create_input();

        build_panel(input);
        input.addJump();

        expect($(LIST).children('li').length).toBe(1);
        expect(input.jumps.length).toBe(1);
        expect($(WHEN_SELECT).length).toBe(1);
        expect($(ANSWER_SELECT).length).toBe(1);
        expect($(GOTO_SELECT).length).toBe(1);
        expect($(NO_JUMPS).hasClass('hidden')).toBe(true);
        expect($(JUMP_STATE).hasClass('invisible')).toBe(false);
    });

    it('adds an always jump for question types without possible answers', function () {
        const input = create_input({
            type: consts.TEXT_TYPE,
            possible_answers: []
        });

        build_panel(input);
        input.addJump();

        const when_select = $(WHEN_SELECT);

        expect($(LIST).children('li').length).toBe(1);
        expect(when_select.prop('disabled')).toBe(true);
        expect(when_select.find('option:selected').text()).toBe('always');
        expect($(ANSWER_WRAPPER).length).toBe(0);
    });

    it('stops adding jumps once every possible answer has one', function () {
        const input = create_input();

        build_panel(input);
        input.addJump();
        input.addJump();
        input.addJump();

        expect($(LIST).children('li').length).toBe(2);
        expect(input.jumps.length).toBe(2);
    });

    it('removes the jump row from the panel', function () {
        const input = create_input();

        build_panel(input);
        input.addJump();
        input.addJump();

        expect($(LIST).children('li').length).toBe(2);

        remove_first_jump(input);

        expect($(LIST).children('li').length).toBe(1);
        expect(input.jumps.length).toBe(1);
        expect($(NO_JUMPS).hasClass('hidden')).toBe(true);
    });

    it('restores the empty state after the last jump is removed', function () {
        const input = create_input();

        build_panel(input);
        input.addJump();

        remove_first_jump(input);

        expect($(LIST).children('li').length).toBe(0);
        expect(input.jumps.length).toBe(0);
        expect($(NO_JUMPS).hasClass('hidden')).toBe(false);
        expect($(JUMP_STATE).hasClass('invisible')).toBe(true);
    });

    it('fills the when select with the jump conditions', function () {
        const input = create_input();

        build_panel(input);
        input.addJump();

        const when_select = $(WHEN_SELECT);

        jumps.listJumpConditions(when_select);

        expect(when_select.find('option').length).toBe(consts.JUMP_CONDITIONS.length);
        expect(when_select.find('option').map(function () {
            return $(this).val();
        }).get()).toEqual(consts.JUMP_CONDITIONS.map(function (condition) {
            return condition.key;
        }));
    });

    it('fills the answer select and keeps the current answer selected', function () {
        const input = create_input();

        build_panel(input);
        input.addJump();

        const answer_select = $(ANSWER_SELECT);

        jumps.listJumpPossibleAnswers(answer_select, input);

        expect(answer_select.find('option').length).toBe(2);
        expect(answer_select.find('option').map(function () {
            return $(this).val();
        }).get()).toEqual(input.possible_answers.map(function (possible_answer) {
            return possible_answer.answer_ref;
        }));

        answer_select.val(input.possible_answers[1].answer_ref);
        jumps.listJumpPossibleAnswers(answer_select, input);

        expect(answer_select.val()).toBe(input.possible_answers[1].answer_ref);
    });

    it('locks the answer select for conditions that do not reference an answer', function () {
        const input = create_input();

        build_panel(input);
        input.addJump();

        const when_select = $(WHEN_SELECT);
        const answer_select = $(ANSWER_SELECT);

        jumps.listJumpPossibleAnswers(answer_select, input);
        // the when select only holds the saved option until the conditions are listed
        jumps.listJumpConditions(when_select);

        when_select.val('ALL');
        jumps.toggleJumpAnswerSelect(when_select, input);

        expect(answer_select.prop('disabled')).toBe(true);
        expect(answer_select.find('option').length).toBe(0);

        when_select.val('IS');
        jumps.toggleJumpAnswerSelect(when_select, input);

        expect(answer_select.prop('disabled')).toBe(false);
        expect(answer_select.find('option').length).toBe(2);
    });

    it('fills the go to select with the available destinations', function () {
        const input = create_input();

        build_panel(input);
        input.addJump();

        const goto_select = $(GOTO_SELECT);

        jumps.listJumpDestinations(goto_select, [
            { ref: 'ec5_2', question: 'Second question', type: consts.TEXT_TYPE },
            { ref: 'ec5_3', question: '', type: consts.BRANCH_TYPE }
        ]);

        expect(goto_select.find('option').length).toBe(2);
        expect(goto_select.find('option').map(function () {
            return $(this).val();
        }).get()).toEqual(['ec5_2', 'ec5_3']);
        expect(goto_select.find('option').first().text().trim()).toBe('Second question');
    });
});
