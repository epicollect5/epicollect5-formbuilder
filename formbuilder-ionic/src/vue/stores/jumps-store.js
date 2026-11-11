'use strict';

import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { PARAMETERS } from '@/config/parameters.js';
import { JUMPS_MESSAGES, PANEL_MESSAGES } from '@/config/strings.js';
import { jumpNeedsAnswer, usesAlwaysJump } from '@/models/jumps.js';
import {
    addJump,
    canAddJump,
    getJumpAvailableDestinations,
    removeJump,
    updateJump
} from '@/services/jumps.js';
import { getCurrentInput, getCurrentInputs } from '@/services/session.js';
import { getJumpErrors } from '@/services/validation.js';
import { useRootStore } from '@/vue/stores/root-store.js';

/*
 * The jumps tab's state and actions: the per-input page state, the row
 * mutations and the derived rows the panel renders (options, per-row errors
 * and the always-jump variant included). Mutations go through the jumps
 * services and the builder store's recordChange (the composed-store pattern).
 */
export const useJumpsStore = defineStore('jumps', () => {
    const builder = useRootStore();

    const state = reactive({
        // the visible jumps page per input ref (ui/state.js parity); page
        // state is not undoable, as in the vanilla app
        jumps_pages: new Map()
    });

    const methods = {
        currentJumpsPage(input, pages) {
            const page = state.jumps_pages.get(input.ref) || 1;

            return Math.min(Math.max(page, 1), pages);
        },
        setJumpsPage(target) {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            const pages = Math.max(1, Math.ceil((Array.isArray(input.jumps) ? input.jumps.length : 0) / PARAMETERS.JUMPS_PER_PAGE));

            state.jumps_pages.set(input.ref, Math.min(Math.max(target, 1), pages));
        },
        addJumpToCurrentInput() {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            if (addJump(input, getCurrentInputs())) {
                // Show the page holding the newly appended jump.
                methods.setJumpsPage(Math.max(1, Math.ceil(input.jumps.length / PARAMETERS.JUMPS_PER_PAGE)));
                builder.recordChange();
            }
        },
        removeJumpFromCurrentInput(index) {
            const input = getCurrentInput();

            if (!input || !removeJump(input, index)) {
                return;
            }

            builder.recordChange();
        },
        updateCurrentInputJump(index, patch) {
            const input = getCurrentInput();

            if (!input || !updateJump(input, index, patch)) {
                return;
            }

            builder.recordChange();
        }
    };

    const computedScope = {
        /*
         * Everything the jumps panel renders for the selected question: the
         * page slice with its select options, the always-jump variant and the
         * row's own error message (the vanilla buildJumpRow parity).
         */
        jumpsPanel: computed(() => {
            const input = getCurrentInput();

            if (!input) {
                return { rows: [], canAdd: false, pageCount: 1, currentPage: 1, hasJumps: false };
            }

            const jumps = Array.isArray(input.jumps) ? input.jumps : [];
            const inputs = getCurrentInputs();
            const destinations = getJumpAvailableDestinations(input, inputs);
            const pages = Math.max(1, Math.ceil(jumps.length / PARAMETERS.JUMPS_PER_PAGE));
            const page = methods.currentJumpsPage(input, pages);
            const start_index = (page - 1) * PARAMETERS.JUMPS_PER_PAGE;
            const always = usesAlwaysJump(input.type);
            const errors = getJumpErrors(input, inputs);

            const rows = jumps.slice(start_index, start_index + PARAMETERS.JUMPS_PER_PAGE).map((jump, index) => {
                const jump_index = start_index + index;
                const needs_answer = !always && jumpNeedsAnswer(jump.when);
                const error = errors.find((jump_error) => {
                    return jump_error.index === jump_index;
                }) || null;

                // When: the always variant is a fixed unconditional jump
                const whenOptions = always ?
                    [{ value: 'ALL', label: 'always' }] :
                    PARAMETERS.JUMP_CONDITIONS.map((condition) => {
                        return { value: condition.key, label: condition.label };
                    });

                // Answer: only for multi-answer conditions; a stored ref that
                // no longer matches an answer stays visible as unavailable
                // (R-30) but re-selecting it just re-saves the same dead ref
                const answerOptions = [];
                let answerValue = '';

                if (!always) {
                    const options = (input.possible_answers || []).map((answer) => {
                        return {
                            value: answer.answer_ref,
                            label: answer.answer || PANEL_MESSAGES.UNTITLED_ANSWER
                        };
                    });
                    const has_value = options.some((option) => {
                        return String(option.value) === String(jump.answer_ref);
                    });

                    if (needs_answer && jump.answer_ref && !has_value) {
                        options.unshift({
                            value: jump.answer_ref,
                            label: JUMPS_MESSAGES.UNAVAILABLE_ANSWER
                        });
                    }

                    answerValue = !needs_answer ?
                        '' :
                        (jump.answer_ref ? jump.answer_ref : (options[0] ? options[0].value : ''));
                    options.forEach((option) => {
                        answerOptions.push(option);
                    });
                }

                // Go to: a stored destination that no longer exists stays
                // visible as unavailable (R-31)
                const destinationOptions = destinations.map((destination) => {
                    return { value: destination.ref, label: destination.question };
                });
                const has_destination = destinationOptions.some((option) => {
                    return String(option.value) === String(jump.to);
                });

                if (jump.to && !has_destination) {
                    destinationOptions.unshift({
                        value: jump.to,
                        label: jump.to === PARAMETERS.JUMP_TO_END_OF_FORM_REF ? PARAMETERS.JUMP_TO_END_OF_FORM_LABEL : JUMPS_MESSAGES.UNAVAILABLE_DESTINATION
                    });
                }

                /*
                 * The dropdowns are vanilla components rebuilt when the row's
                 * option set changes (the vanilla rebuilt the whole panel on
                 * every mutation); the signature drives the row's remount key.
                 */
                const signature = [
                    always ? 'always' : jump.when,
                    jump.to,
                    jump.answer_ref,
                    answerOptions.map((option) => {
                        return option.label;
                    }).join('|'),
                    destinationOptions.map((option) => {
                        return option.value + ':' + option.label;
                    }).join('|')
                ].join('~');

                return {
                    jump,
                    index: jump_index,
                    signature,
                    always,
                    whenValue: always ? 'ALL' : (jump.when || ''),
                    whenOptions,
                    needsAnswer: needs_answer,
                    answerOptions,
                    answerValue,
                    destinationOptions,
                    destinationValue: jump.to || '',
                    error
                };
            });

            return {
                rows,
                canAdd: canAddJump(input, inputs),
                pageCount: pages,
                currentPage: page,
                hasJumps: jumps.length > 0
            };
        })
    };

    return {
        state,
        ...methods,
        ...computedScope
    };
});
