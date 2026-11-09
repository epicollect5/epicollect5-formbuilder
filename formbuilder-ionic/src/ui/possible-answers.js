'use strict';

import {PARAMETERS} from '@/config/parameters.js';
import {FORM_MESSAGES, VALIDATION_MESSAGES} from '@/config/strings.js';
import {POSSIBLE_ANSWERS_ORDER, getAnswerLimit, getAnswerPage, getAnswerPageCount, sanitizeAnswer} from '@/models/possible-answers.js';
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
import {getCurrentInput, updateCurrentInput} from '@/services/session.js';
import {button, createView, element, icon} from '@/ui/dom.js';
import {createDropdown, createMenu} from '@/ui/dropdown.js';
import {downloadFile} from '@/ui/download.js';
import {installAnswerSortable} from '@/ui/sortable.js';
import {
    hideLoading,
    notifyError,
    notifySuccess,
    showLoading
} from '@/services/notifications.js';
import possible_answers_view from '@/views/possible-answers-card.html?raw';
import csv_import_modal_body_view from '@/views/csv-import-modal-body.html?raw';
import {openModal} from '@/ui/modal.js';
import {getAnswerPages, getAnswerNotices, recordChange} from '@/ui/state.js';
import {renderProperties, updateCurrentQuestionStatus, refreshCurrentProperties} from '@/ui/shell.js';

export const buildPossibleAnswers = (input) => {
    const answers = input.possible_answers;
    const card = createView(possible_answers_view);
    const list = card.querySelector('.builder__answer-list');
    const count_badge = card.querySelector('.builder__answers-count-badge');
    const add_button = card.querySelector('.builder__add-answer');
    const pages_map = getAnswerPages();
    const notices = getAnswerNotices();
    const page = getAnswersPage(input);
    const pages = getAnswerPageCount(answers);
    const page_answers = getAnswerPage(answers, page);
    const at_limit = answers.length >= getAnswerLimit(input.type);
    const notice = notices.get(input.ref);

    count_badge.textContent = String(answers.length);

    page_answers.forEach((answer, index) => {
        list.append(buildAnswerRow(input, answer, (page - 1) * PARAMETERS.ANSWERS_PER_PAGE + index, answers.length));
    });

    add_button.disabled = at_limit;
    add_button.addEventListener('click', () => {
        if (!addPossibleAnswer(input)) {
            return;
        }

        pages_map.set(input.ref, getAnswerPageCount(input.possible_answers));
        recordChange();
        renderProperties();
        updateCurrentQuestionStatus();
    });

    if (notice) {
        notices.delete(input.ref);
        showAnswersNote(card, notice, false);
    }

    installAnswersPager(card, input, page, pages, page_answers);
    installAnswersMenu(card, input);

    return card;
};

/* The visible page is the unit the list sorts and saves. */
const getAnswersPage = (input) => {
    const pages = getAnswerPageCount(input.possible_answers);
    const pages_map = getAnswerPages();
    const page = Math.min(Math.max(pages_map.get(input.ref) || 1, 1), pages);

    pages_map.set(input.ref, page);

    return page;
};

const setAnswersPage = (input, page) => {
    getAnswerPages().set(input.ref, page);
};

const showAnswersNote = (card, message, is_error) => {
    const note = card.querySelector('[data-role="answers-note"]');

    if (!note) {
        return;
    }

    note.textContent = message || '';
    note.classList.toggle('is-error', is_error === true);
    note.hidden = !message;
};

/* Paging is blocked while a visible answer is still empty. */
const canLeaveAnswersPage = (page_answers) => {
    return page_answers.every((answer) => {
        return String(answer.answer || '').trim() !== '';
    });
};

export const installAnswersPager = (card, input, page, pages, page_answers) => {
    const pager = card.querySelector('[data-role="answers-pager"]');

    if (!pager) {
        return;
    }

    if (pages <= 1) {
        pager.setAttribute('hidden', 'hidden');
        return;
    }

    const label = pager.querySelector('[data-role="answers-page"]');
    const total = pager.querySelector('[data-role="answers-pages"]');
    const previous = pager.querySelector('[data-action="page-prev"]');
    const next = pager.querySelector('[data-action="page-next"]');

    pager.removeAttribute('hidden');
    label.textContent = String(page);
    total.textContent = String(pages);
    previous.disabled = page <= 1;
    next.disabled = page >= pages;

    const go_to = (target) => {
        if (!canLeaveAnswersPage(page_answers)) {
            showAnswersNote(card, VALIDATION_MESSAGES.POSSIBLE_ANSWER_EMPTY, true);
            return;
        }

        setAnswersPage(input, target);
        renderProperties();
    };

    previous.addEventListener('click', () => {
        go_to(page - 1);
    });

    next.addEventListener('click', () => {
        go_to(page + 1);
    });
};

export const installAnswersMenu = (card, input) => {
    const trigger = card.querySelector('[data-role="answers-actions-trigger"]');

    if (!trigger) {
        return;
    }

    createMenu(trigger, [
        {
            label: 'Import CSV', data_action: 'import', action: () => {
                pickAnswersCsv(input);
            }
        },
        {
            label: 'Export CSV', data_action: 'export', action: () => {
                downloadFile(getCsvFilename(input), exportCsv(input), 'text/csv;charset=utf-8;');
            }
        },
        {divider: true},
        {
            label: 'Order ascending', data_action: 'order-az', action: () => {
                orderAnswers(input, POSSIBLE_ANSWERS_ORDER.AZ);
            }
        },
        {
            label: 'Order descending', data_action: 'order-za', action: () => {
                orderAnswers(input, POSSIBLE_ANSWERS_ORDER.ZA);
            }
        },
        {
            label: 'Shuffle', data_action: 'shuffle', action: () => {
                orderAnswers(input, POSSIBLE_ANSWERS_ORDER.SHUFFLE);
            }
        },
        {divider: true},
        {
            label: 'Delete all answers', data_action: 'delete-all', action: () => {
                showLoading();

                if (deleteAllAnswers(input)) {
                    setAnswersPage(input, 1);
                    recordChange();
                    renderProperties();
                    updateCurrentQuestionStatus();
                }

                // Legacy keeps the overlay up for ANIMATION_SUPER_SLOW.
                hideLoading(1000);
            }
        }
    ], (item) => {
        item.action();
    });
};

export const orderAnswers = (input, order) => {
    // Legacy reorders behind the overlay and hides it after ANIMATION_SUPER_SLOW.
    showLoading();

    if (!orderPossibleAnswers(input, order)) {
        hideLoading();
        return;
    }

    setAnswersPage(input, 1);
    recordChange();
    renderProperties();
    updateCurrentQuestionStatus();
    hideLoading(1000);
};

export const pickAnswersCsv = (input) => {
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

            openAnswersCsvModal(input, parsed);
        };

        reader.onerror = () => {
            field.remove();
            notifyError(VALIDATION_MESSAGES.CSV_FILE_INVALID);
        };

        reader.readAsText(file);
    });

    document.body.append(field);
    field.click();
};

export const openAnswersCsvModal = (input, parsed) => {
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
            {text: 'Dismiss'},
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
                    getAnswerNotices().delete(input.ref);
                    setAnswersPage(input, 1);
                    recordChange();
                    renderProperties();
                    updateCurrentQuestionStatus();
                    // Legacy hides the overlay after ANIMATION_SUPER_SLOW.
                    hideLoading(1000);
                    setTimeout(() => {
                        notifySuccess(VALIDATION_MESSAGES.POSSIBLE_ANSWERS_IMPORTED);
                    }, 1000);
                }
            }
        ]
    });

    import_button = modal.footer.querySelectorAll('button')[1];
};

/* The list has to be in the document before jQuery UI can hold on to it. */
export const installAnswersSortable = (input) => {
    installAnswerSortable('#properties .builder__answer-list', () => {
        const answers_list = document.querySelector('#properties .builder__answer-list');

        if (!answers_list) {
            return;
        }

        const refs = [...answers_list.querySelectorAll('.builder__answer')].map((row) => {
            return row.getAttribute('data-answer-ref');
        });
        const page = getAnswerPages().get(input.ref) || 1;

        if (!reorderAnswerPage(input, refs, page)) {
            return;
        }

        recordChange();

        setTimeout(() => {
            renderProperties();
        }, 0);
    });
};

export const buildAnswerRow = (input, answer, index, total) => {
    const row = element('li', {
        class: 'builder__answer',
        'data-answer-ref': answer.answer_ref
    });

    const field = element('ion-input', {
        class: 'builder__answer-field',
        'aria-label': `Answer ${index + 1}`,
        fill: 'outline',
        maxlength: String(PARAMETERS.MAX_ANSWER_LENGTH)
    });

    field.value = answer.answer;
    field.placeholder = '';
    field.setAttribute('placeholder', '');
    field.addEventListener('ionInput', (event) => {
        const value = sanitizeAnswer(event.detail.value || '');

        if (field.value !== value) {
            field.value = value;
        }

        renamePossibleAnswer(input, answer.answer_ref, value);
        updateCurrentQuestionStatus();
        refreshCurrentProperties();
        recordChange({throttle: true});
    });

    const remove_button = button({
        type: 'button',
        class: 'builder__answer-remove',
        'aria-label': `Remove answer ${index + 1}`,
        disabled: total === 1 ? 'disabled' : undefined
    }, [icon('close-circle-outline')]);

    remove_button.addEventListener('click', () => {
        if (removePossibleAnswer(input, answer.answer_ref)) {
            recordChange();
            renderProperties();
            updateCurrentQuestionStatus();
        }
    });

    row.append(icon('swap-vertical-outline'));
    row.append(field);
    row.append(remove_button);

    return row;
};
