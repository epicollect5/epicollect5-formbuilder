'use strict';

import {PARAMETERS} from '@/config/parameters.js';
import {JUMP_CONDITIONS, jumpNeedsAnswer, usesAlwaysJump} from '@/models/jumps.js';
import {
    addJump,
    canAddJump,
    getJumpAvailableDestinations,
    removeJump,
    updateJump
} from '@/services/jumps.js';
import {getCurrentInputs} from '@/services/session.js';
import {getJumpErrors} from '@/services/validation.js';
import {createView, element} from '@/ui/dom.js';
import {initDropdown} from '@/ui/dropdown.js';
import jump_row_view from '@/views/jump-row.html?raw';
import jump_row_always_view from '@/views/jump-row-always.html?raw';
import {getJumpPages, recordChange} from '@/ui/state.js';
import {renderProperties, renderQuestions, updateCurrentQuestionStatus} from '@/ui/shell.js';

export const getJumpPageCount = (jumps) => {
    return Math.max(1, Math.ceil((jumps || []).length / PARAMETERS.JUMPS_PER_PAGE));
};

export const getJumpsPage = (input, pages) => {
    const pages_map = getJumpPages();
    const page = Math.min(Math.max(pages_map.get(input.ref) || 1, 1), pages);

    pages_map.set(input.ref, page);

    return page;
};

export const setJumpsPage = (input, page) => {
    getJumpPages().set(input.ref, page);
};

export const installJumpsPager = (panel, input, page, pages) => {
    const pager = panel.querySelector('[data-role="jumps-pager"]');

    if (!pager) {
        return;
    }

    if (pages <= 1) {
        pager.hidden = true;
        return;
    }

    pager.hidden = false;
    pager.querySelector('[data-role="jumps-page"]').textContent = String(page);
    pager.querySelector('[data-role="jumps-pages"]').textContent = String(pages);

    const previous = pager.querySelector('[data-action="jumps-page-prev"]');
    const next = pager.querySelector('[data-action="jumps-page-next"]');
    const go_to = (target) => {
        setJumpsPage(input, target);
        renderProperties();
    };

    previous.disabled = page <= 1;
    next.disabled = page >= pages;
    previous.addEventListener('click', () => {
        go_to(page - 1);
    });
    next.addEventListener('click', () => {
        go_to(page + 1);
    });
};

export const buildJumpsPanel = (input, pane) => {
    const panel = pane.querySelector('.builder__jumps-panel');
    const add_button = panel.querySelector('.builder__add-jump');
    const no_jumps = panel.querySelector('[data-role="no-jumps"]');
    const list = panel.querySelector('.builder__jumps-list');
    const jumps = Array.isArray(input.jumps) ? input.jumps : [];
    const destinations = getJumpAvailableDestinations(input, getCurrentInputs());
    const pages = getJumpPageCount(jumps);
    const page = getJumpsPage(input, pages);
    const start_index = (page - 1) * PARAMETERS.JUMPS_PER_PAGE;
    const page_jumps = jumps.slice(start_index, start_index + PARAMETERS.JUMPS_PER_PAGE);

    list.replaceChildren();

    const can_add = canAddJump(input, getCurrentInputs());

    add_button.disabled = !can_add;
    add_button.title = can_add ? 'Add jump' : 'No jump destinations available';
    add_button.addEventListener('click', () => {
        if (addJump(input, getCurrentInputs())) {
            // Show the page holding the newly appended jump.
            setJumpsPage(input, getJumpPageCount(input.jumps));
            recordChange();
            renderProperties();
            renderQuestions();
            updateCurrentQuestionStatus();
        }
    });

    if (jumps.length === 0) {
        no_jumps.removeAttribute('hidden');
        installJumpsPager(panel, input, page, pages);
        return;
    }

    no_jumps.setAttribute('hidden', 'hidden');

    // legacy shows the jump's own error message inside its row, under the
    // offending field
    const jump_errors = getJumpErrors(input, getCurrentInputs());

    page_jumps.forEach((jump, index) => {
        const jump_index = start_index + index;

        list.append(buildJumpRow(input, jump, jump_index, destinations,
            jump_errors.find((error) => {
                return error.index === jump_index;
            }) || null));
    });

    installJumpsPager(panel, input, page, pages);
};

export const buildJumpRow = (input, jump, index, destinations, jump_error) => {
    const always = usesAlwaysJump(input.type);
    const row = createView(always ? jump_row_always_view : jump_row_view);
    const when_placeholder = row.querySelector('.builder__jump-when');
    const answer_placeholder = row.querySelector('.builder__jump-answer');
    const goto_placeholder = row.querySelector('.builder__jump-goto');
    const remove_button = row.querySelector('.builder__jump-remove');

    row.setAttribute('data-jump-index', String(index));

    if (always) {
        initDropdown(when_placeholder, [{value: 'ALL', label: 'always'}], 'ALL', null, true);
    } else {
        initDropdown(when_placeholder, JUMP_CONDITIONS.map((condition) => {
            return {value: condition.key, label: condition.label};
        }), jump.when || 'IS', (detail) => {
            updateJump(input, index, {when: detail.value});
            recordChange();
            renderProperties();
            renderQuestions();
            updateCurrentQuestionStatus();
        }, false);

        if (answer_placeholder) {
            const answer_options = (input.possible_answers || []).map((answer) => {
                return {
                    value: answer.answer_ref,
                    label: answer.answer || 'Untitled answer'
                };
            });
            const needs_answer = jumpNeedsAnswer(jump.when);
            const has_value = answer_options.some((option) => {
                return String(option.value) === String(jump.answer_ref);
            });

            // a stored ref that no longer matches an answer stays visible on the
            // trigger as unavailable (R-30), but is display-only: offering it in
            // the list would let the user re-select a dead ref
            if (needs_answer && jump.answer_ref && !has_value) {
                answer_options.unshift({
                    value: jump.answer_ref,
                    label: 'Unavailable answer',
                    display_only: true
                });
            }

            const answer_value = !needs_answer ?
                '' :
                (jump.answer_ref ? jump.answer_ref : (answer_options[0] ? answer_options[0].value : ''));

            const answer_dropdown = initDropdown(answer_placeholder, answer_options, answer_value, needs_answer ? (detail) => {
                updateJump(input, index, {answer_ref: detail.value || ''});
                recordChange();
                renderProperties();
                renderQuestions();
                updateCurrentQuestionStatus();
            } : null, !needs_answer);

            //a condition that does not reference an answer keeps no selection (legacy empties the select)
            if (answer_dropdown && !needs_answer) {
                answer_dropdown.setValue('');
            }
        }
    }

    const destination_options = destinations.map((destination) => {
        return {
            value: destination.ref,
            label: destination.question
        };
    });
    const has_destination = destination_options.some((option) => {
        return String(option.value) === String(jump.to);
    });

    if (jump.to && !has_destination) {
        // a stored destination that no longer exists stays visible on the
        // trigger as unavailable (R-31), but is display-only: offering it in
        // the list would let the user re-select a dead ref
        destination_options.unshift({
            value: jump.to,
            label: jump.to === PARAMETERS.JUMP_TO_END_OF_FORM_REF ? 'End of form' : 'Unavailable destination',
            display_only: true
        });
    }

    // an empty destination shows the view's placeholder on the trigger; the
    // placeholder itself is not a pickable option
    initDropdown(goto_placeholder, destination_options, jump.to || '', (detail) => {
        updateJump(input, index, {to: detail.value || ''});
        recordChange();
        renderQuestions();
        updateCurrentQuestionStatus();
    }, false);

    remove_button.addEventListener('click', () => {
        if (removeJump(input, index)) {
            recordChange();
            renderProperties();
            renderQuestions();
            updateCurrentQuestionStatus();
        }
    });

    // the jump's own error shows under the offending field, as in legacy
    if (jump_error) {
        const error_slot = row.querySelector(`[data-error-for="${jump_error.field}"]`);

        if (error_slot) {
            error_slot.textContent = jump_error.message;
            error_slot.hidden = false;
        }
    }

    return row;
};
