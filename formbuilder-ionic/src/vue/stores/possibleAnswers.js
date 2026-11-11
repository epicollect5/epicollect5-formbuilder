'use strict';

import { computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import { PARAMETERS } from '@/config/parameters.js';
import { VALIDATION_MESSAGES } from '@/config/strings.js';
import { getForms } from '@/models/project-definition.js';
import {
    POSSIBLE_ANSWERS_ORDER,
    getAnswerLimit,
    getAnswerPage,
    getAnswerPageCount,
    isMultipleAnswerType
} from '@/models/possible-answers.js';
import {
    addPossibleAnswer,
    deleteAllAnswers,
    orderPossibleAnswers,
    removePossibleAnswer,
    renamePossibleAnswer,
    reorderAnswerPage
} from '@/services/possible-answers.js';
import {
    exportCsv,
    getCsvColumns,
    getCsvFilename,
    importAnswers,
    parseCsv
} from '@/services/possible-answers-csv.js';
import { getCurrentInput, updateCurrentInput } from '@/services/session.js';
import { hideLoading, notifyError, notifySuccess, showLoading } from '@/services/notifications.js';
import { downloadFile } from '@/ui/download.js';
import { createDropdown } from '@/ui/dropdown.js';
import { openModal } from '@/ui/modal.js';
import { createView } from '@/ui/dom.js';
import csv_import_modal_body_view from '@/views/csv-import-modal-body.html?raw';
import { useBuilderStore } from '@/vue/stores/builder.js';

/*
 * The possible answers card's state and actions: the page slice, the drag
 * reorder, the CSV flows and the ordering menu. Mutations go through the
 * answers services; the change recording is the builder store's recordChange
 * (the composed-store pattern), so the undo and save gates stay in one place.
 */
export const usePossibleAnswersStore = defineStore("possibleAnswers", () => {
    const builder = useBuilderStore();

    const state = reactive({
        // the visible answers page per input ref (ui/state.js parity); page
        // state is not undoable, as in the vanilla app
        possible_answers_pages: new Map(),
        // the advanced panel's initial-answer select page, per input ref
        default_choice_pages: new Map()
    });

    const methods = {
        addPossibleAnswer() {
            const input = getCurrentInput();

            if (!input || !addPossibleAnswer(input)) {
                return;
            }

            // the new answer is on the last page
            state.possible_answers_pages.set(input.ref, getAnswerPageCount(input.possible_answers));
            builder.recordChange();
        },
        renamePossibleAnswer(answer_ref, value) {
            const input = getCurrentInput();

            if (!input || !renamePossibleAnswer(input, answer_ref, value)) {
                return;
            }

            builder.recordChange({ throttle: true });
        },
        removePossibleAnswer(answer_ref) {
            const input = getCurrentInput();

            if (!input || !removePossibleAnswer(input, answer_ref)) {
                return;
            }

            builder.recordChange();
        },
        /* The sortable reports the reordered page; commit it page-locally. */
        commitPossibleAnswersReorder(refs) {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            if (reorderAnswerPage(input, refs, methods.currentPossibleAnswersPage())) {
                builder.recordChange();
            }
        },
        currentPossibleAnswersPage() {
            const input = getCurrentInput();

            if (!input) {
                return 1;
            }

            const page = state.possible_answers_pages.get(input.ref) || 1;

            return Math.min(Math.max(page, 1), getAnswerPageCount(input.possible_answers));
        },
        /* Paging is blocked while a visible answer is still empty. */
        goToPossibleAnswersPage(target) {
            const input = getCurrentInput();

            if (!input) {
                return false;
            }

            const page_answers = getAnswerPage(input.possible_answers, methods.currentPossibleAnswersPage());
            const blocked = page_answers.some((answer) => {
                return String(answer.answer || '').trim() === '';
            });

            if (blocked) {
                return false;
            }

            state.possible_answers_pages.set(input.ref, Math.min(Math.max(target, 1), getAnswerPageCount(input.possible_answers)));

            return true;
        },
        orderPossibleAnswers(order) {
            const input = getCurrentInput();

            // Legacy reorders behind the overlay and hides it after ANIMATION_SUPER_SLOW.
            showLoading();

            if (!input || !orderPossibleAnswers(input, order)) {
                hideLoading();
                return;
            }

            state.possible_answers_pages.set(input.ref, 1);
            builder.recordChange();
            hideLoading(1000);
        },
        deleteAllPossibleAnswers() {
            const input = getCurrentInput();

            showLoading();

            if (!input || !deleteAllAnswers(input)) {
                hideLoading();
                return;
            }

            state.possible_answers_pages.set(input.ref, 1);
            builder.recordChange();

            // Legacy keeps the overlay up for ANIMATION_SUPER_SLOW.
            hideLoading(1000);
        },
        /* The advanced panel's initial answer select. */
        setDefaultChoice(value) {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            updateCurrentInput({ default: value ? value : null });
            builder.recordChange();
        },
        /*
         * The initial answer select lists one page of answers at a time: a
         * search question can hold MAX_SEARCH_ANSWERS options, and a thousand
         * option elements for one control is the single largest render in the
         * panel (S-05). Until the user pages, the select follows the current
         * default so the control opens on the answer it is showing.
         */
        currentDefaultChoicePage() {
            const input = getCurrentInput();

            if (!input) {
                return 1;
            }

            const pages = getAnswerPageCount(input.possible_answers);
            const stored = state.default_choice_pages.get(input.ref);

            if (stored) {
                return Math.min(Math.max(stored, 1), pages);
            }

            const index = (input.possible_answers || []).findIndex((answer) => {
                return String(answer.answer_ref) === String(input.default);
            });

            return index === -1 ? 1 : Math.floor(index / PARAMETERS.ANSWERS_PER_PAGE) + 1;
        },
        goToDefaultChoicePage(target) {
            const input = getCurrentInput();

            if (!input) {
                return false;
            }

            const pages = getAnswerPageCount(input.possible_answers);

            state.default_choice_pages.set(input.ref, Math.min(Math.max(target, 1), pages));

            return true;
        },
        exportPossibleAnswersCsv() {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            downloadFile(getCsvFilename(input), exportCsv(input), 'text/csv;charset=utf-8;');
        },
        pickPossibleAnswersCsv() {
            const field = document.createElement('input');

            field.type = 'file';
            field.accept = '.csv,text/csv';
            field.hidden = true;

            field.addEventListener('change', () => {
                const file = field.files && field.files[0];

                if (!file) {
                    field.remove();
                    return;
                }

                if (!/\.csv$/i.test(file.name)) {
                    field.remove();
                    notifyError(VALIDATION_MESSAGES.CSV_FILE_INVALID);
                    return;
                }

                // the same bound as the form import bounds the synchronous parse (R-51)
                if (file.size > PARAMETERS.IMPORT_MAX_BYTES) {
                    field.remove();
                    notifyError(VALIDATION_MESSAGES.CSV_FILE_TOO_LARGE);
                    return;
                }

                const reader = new FileReader();

                reader.onload = () => {
                    const parsed = parseCsv(reader.result);

                    field.remove();

                    if (!parsed.rows.length) {
                        notifyError(VALIDATION_MESSAGES.CSV_FILE_INVALID);
                        return;
                    }

                    methods.openPossibleAnswersCsvModal(parsed);
                };

                reader.onerror = () => {
                    field.remove();
                    notifyError(VALIDATION_MESSAGES.CSV_FILE_INVALID);
                };

                reader.readAsText(file);
            });

            document.body.append(field);
            field.click();
        },
        openPossibleAnswersCsvModal(parsed) {
            const input = getCurrentInput();

            if (!input) {
                return;
            }

            const body = createView(csv_import_modal_body_view);
            const headers = body.querySelector('[data-role="csv-headers"]');
            const mode = body.querySelector('[data-role="csv-mode"]');
            const column_placeholder = body.querySelector('[data-role="csv-column"]');
            let selected_column = '';
            let import_button = null;

            headers.checked = true;
            mode.value = 'replace';

            const column_dropdown = createDropdown({
                class_name: 'builder__csv-column-select',
                aria_label: 'Column to import',
                placeholder: 'Pick column',
                options: [...getCsvColumns(parsed, true)],
                value: '',
                on_change: (detail) => {
                    selected_column = detail.value;

                    if (import_button) {
                        import_button.disabled = !selected_column;
                    }
                }
            });

            column_dropdown.setAttribute('data-role', 'csv-column');
            column_placeholder.replaceWith(column_dropdown);

            headers.addEventListener('ionChange', () => {
                selected_column = '';
                column_dropdown.setOptions(
                    [...getCsvColumns(parsed, headers.checked === true)],
                    ''
                );

                if (import_button) {
                    import_button.disabled = true;
                }
            });

            const modal = openModal({
                title: 'Possible answers csv import options',
                body,
                buttons: [
                    { text: 'Dismiss', align: 'start' },
                    {
                        text: 'Import',
                        disabled: true,
                        on_click: (close) => {
                            if (!selected_column) {
                                return;
                            }

                            // Legacy imports the answers behind the wait overlay.
                            showLoading();

                            const result = importAnswers(input, parsed, {
                                column_index: Number(selected_column),
                                has_headers: headers.checked === true,
                                replace: mode.value !== 'append'
                            });

                            if (!result.ok) {
                                hideLoading();
                                notifyError(VALIDATION_MESSAGES.POSSIBLE_ANSWER_EMPTY);
                                return;
                            }

                            close();
                            state.possible_answers_pages.set(input.ref, 1);
                            builder.recordChange();

                            // Legacy hides the overlay after ANIMATION_SUPER_SLOW.
                            hideLoading(1000);
                            setTimeout(() => {
                                notifySuccess(VALIDATION_MESSAGES.POSSIBLE_ANSWERS_IMPORTED);
                            }, 1000);
                        }
                    }
                ]
            });

            // Footer actions are ion-button elements, not <button> tags.
            import_button = modal.footer.querySelectorAll('ion-button')[1];
        }
    };

    const computedScope = {
        /*
         * The possible answers card. The page slice is what the list shows
         * and reorders; the default select lives in the advanced fields.
         */
        showPossibleAnswers: computed(() => {
            const input = getCurrentInput();

            return !!input && isMultipleAnswerType(input.type);
        }),
        possibleAnswerCount: computed(() => {
            const input = getCurrentInput();

            return input && input.possible_answers ? input.possible_answers.length : 0;
        }),
        possibleAnswerAtLimit: computed(() => {
            const input = getCurrentInput();

            return !!input && input.possible_answers.length >= getAnswerLimit(input.type);
        }),
        possibleAnswersPageCount: computed(() => {
            const input = getCurrentInput();

            return getAnswerPageCount(input ? input.possible_answers : []);
        }),
        possibleAnswersCurrentPage: computed(() => {
            return methods.currentPossibleAnswersPage();
        }),
        possibleAnswerRows: computed(() => {
            const input = getCurrentInput();

            if (!input) {
                return [];
            }

            const offset = (methods.currentPossibleAnswersPage() - 1) * PARAMETERS.ANSWERS_PER_PAGE;

            return getAnswerPage(input.possible_answers, methods.currentPossibleAnswersPage()).map((answer, index) => {
                return {
                    answer,
                    ariaLabel: `Answer ${offset + index + 1}`,
                    removeLabel: `Remove answer ${offset + index + 1}`
                };
            });
        }),
        defaultChoicePageCount: computed(() => {
            const input = getCurrentInput();

            return getAnswerPageCount(input ? input.possible_answers : []);
        }),
        defaultChoiceCurrentPage: computed(() => {
            return methods.currentDefaultChoicePage();
        }),
        defaultChoiceOptions: computed(() => {
            const input = getCurrentInput();

            if (!input) {
                return [{ value: '', label: 'None' }];
            }

            const answers = input.possible_answers || [];
            const page = methods.currentDefaultChoicePage();
            const page_answers = getAnswerPage(answers, page);
            const selected = answers.find((answer) => {
                return String(answer.answer_ref) === String(input.default);
            });
            const options = [{ value: '', label: 'None' }];

            /* keep the current default selectable when the user pages away */
            if (selected && page_answers.indexOf(selected) === -1) {
                options.push({ value: selected.answer_ref, label: selected.answer || 'Untitled answer' });
            }

            page_answers.forEach((answer) => {
                options.push({
                    value: answer.answer_ref,
                    label: answer.answer || 'Untitled answer'
                });
            });

            return options;
        }),
        defaultChoiceValue: computed(() => {
            const input = getCurrentInput();

            if (!input) {
                return '';
            }

            const has_default = (input.possible_answers || []).some((answer) => {
                return String(answer.answer_ref) === String(input.default);
            });

            return has_default ? input.default : '';
        })
    };

    return {
        state,
        ...methods,
        ...computedScope
    };
});
