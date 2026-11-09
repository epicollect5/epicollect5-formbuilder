'use strict';

import {PARAMETERS} from '@/config/parameters.js';
import {FORM_MESSAGES} from '@/config/strings.js';
import {getForms, getProject} from '@/models/project-definition.js';
import {
    addForm,
    deleteForm,
    getCurrentForm,
    getSession,
    isEditing,
    removeAllInputs,
    removeInput,
    renameForm
} from '@/services/session.js';
import {getFormNameError} from '@/services/form-management.js';
import {prepareImportedForm} from '@/services/form-import.js';
import {areFormInputsValid} from '@/services/validation.js';
import {countProjectSearchInputs} from '@/models/project-limits.js';
import {createView} from '@/ui/dom.js';
import {createMenu} from '@/ui/dropdown.js';
import {
    hideLoading,
    notifyError,
    notifySuccess,
    notifyWarning,
    showLoading
} from '@/services/notifications.js';
import form_name_modal_body_view from '@/views/form-name-modal-body.html?raw';
import delete_question_modal_body_view from '@/views/delete-question-modal-body.html?raw';
import {openModal} from '@/ui/modal.js';
import {downloadFile} from '@/ui/download.js';
import {printForm} from '@/ui/print.js';
import {buildFormExport, getFormExportFilename} from '@/services/save.js';
import {getHandlers, recordChange} from '@/ui/state.js';
import {renderApp} from '@/ui/shell.js';

export const isDevMode = () => {
    return window.__FORMBUILDER_DEV__ === true;
};

export const installFormActions = (card, form) => {
    if (!form) {
        return;
    }

    const forms = getForms(getSession().project_definition);
    const form_index = getSession().current_form_index;
    const deletable = !isEditing() && form_index > 0 && form_index === forms.length - 1;
    const delete_button = card.querySelector('.builder__form-action-btn--delete');
    const edit_button = card.querySelector('.builder__form-action-btn--edit');
    const import_buttons = [...card.querySelectorAll('[data-action="form-import"]')];

    if (delete_button) {
        delete_button.disabled = !deletable;
        delete_button.title = deletable ? 'Delete form' : FORM_MESSAGES.FORM_CANNOT_BE_DELETED;
        delete_button.onclick = () => {
            if (deleteForm(form_index)) {
                recordChange();
                renderApp(getHandlers());
                notifyWarning(FORM_MESSAGES.FORM_DELETED);
            }
        };
    }

    if (edit_button) {
        edit_button.onclick = () => {
            openFormNameModal(form);
        };
    }

    import_buttons.forEach((import_button) => {
        import_button.disabled = isEditing();
        import_button.title = isEditing() ? 'Return to the form to import' : 'Import form';
    });

    const actions = {
        'form-export': () => {
            const payload = buildFormExport(getSession().project_definition, form_index);

            if (!payload) {
                notifyError(FORM_MESSAGES.FORM_IS_INVALID);
                return;
            }

            downloadFile(getFormExportFilename(getSession().project_definition, form_index), JSON.stringify(payload), 'application/json');
        },
        'form-print': () => {
            if (!printForm(getSession().project_definition, form_index)) {
                notifyError(FORM_MESSAGES.FORM_IS_INVALID);
            }
        },
        'form-import': () => {
            if (!isEditing()) {
                importFormFile(card);
            }
        },
        'form-delete-all': () => {
            if (!removeAllInputs()) {
                return;
            }

            recordChange();
            renderApp(getHandlers());
            // Legacy deletes behind the busy overlay and drops it after 1s.
            showLoading();
            hideLoading(1000);
        }
    };

    Object.keys(actions).forEach((action) => {
        card.querySelectorAll(`[data-action="${action}"]`).forEach((control) => {
            control.onclick = (event) => {
                event.preventDefault();
                actions[action]();
            };
        });
    });

    const menu_trigger = card.querySelector('[data-role="form-actions-trigger"]');

    if (menu_trigger) {
        // the legacy menu: export and print wait for a valid form, rename and
        // import live on their own controls
        const form_valid = areFormInputsValid(form);

        createMenu(menu_trigger, [
            {label: 'Export form', data_action: 'form-export', action: actions['form-export'], disabled: !form_valid},
            {label: 'Print form', data_action: 'form-print', action: actions['form-print'], disabled: !form_valid},
            {divider: true},
            {label: 'Delete all questions', data_action: 'form-delete-all', action: actions['form-delete-all']}
        ], (item) => {
            item.action();
        });
    }
};

/* The legacy menu: export and print wait for a valid form, rename and
   import live on their own controls. */
export const openFormNameModal = (form) => {
    const adding = !form;
    const body = createView(form_name_modal_body_view);
    const field = body.querySelector('input');
    const error = body.querySelector('[data-role="form-name-error"]');

    field.maxLength = PARAMETERS.FORM_NAME_MAX_LENGTH;
    field.value = form ? form.name || '' : '';
    field.addEventListener('input', () => {
        error.hidden = true;
    });

    const modal = openModal({
        title: 'Form name',
        body,
        buttons: [
            {text: 'Close'},
            {
                text: 'Save changes',
                on_click: (close) => {
                    const forms = getForms(getSession().project_definition);
                    const form_index = getSession().current_form_index;
                    const validation_error = getFormNameError(forms, field.value, adding ? -1 : form_index);

                    if (validation_error) {
                        error.textContent = validation_error;
                        error.removeAttribute('hidden');
                        return;
                    }

                    if (adding) {
                        if (!addForm(field.value)) {
                            return;
                        }
                    } else {
                        renameForm(form_index, field.value);
                    }

                    recordChange();
                    close();
                    renderApp(getHandlers());
                }
            }
        ]
    });

    field.focus();

    return modal;
};

const getTotalEntries = () => {
    const legacy_counter = document.querySelector('.total-entries');
    const data_value = legacy_counter ? legacy_counter.getAttribute('data-total-entries') : null;

    if (data_value !== null && data_value !== undefined) {
        return parseInt(data_value, 10) || 0;
    }

    const project = getProject(getSession().project_definition);

    return Number(project && (project.total_entries || project.entries) || 0);
};

export const deleteQuestion = (input) => {
    if (!removeInput(input.ref)) {
        return;
    }

    recordChange();
    renderApp(getHandlers());
    notifyWarning(FORM_MESSAGES.INPUT_DELETED);
};

export const openDeleteQuestion = (input) => {
    // With entries on the server, legacy warns before dropping their data.
    if (getTotalEntries() === 0) {
        deleteQuestion(input);
        return;
    }

    openModal({
        title: 'Warning',
        class_name: 'builder__delete-question-modal',
        body: createView(delete_question_modal_body_view),
        buttons: [{
            text: 'Confirm',
            on_click: (close) => {
                close();
                deleteQuestion(input);
            }
        }]
    });
};

export const importFormFile = (card) => {
    const field = card.querySelector('[data-role="form-file"]');

    if (!field) {
        return;
    }

    field.value = '';
    field.onchange = () => {
        const file = field.files && field.files[0];

        if (!file) {
            return;
        }

        if (!/\.json$/i.test(file.name)) {
            notifyError(FORM_MESSAGES.FORM_FILE_INVALID);
            return;
        }

        if (file.size > PARAMETERS.IMPORT_MAX_BYTES) {
            notifyError(FORM_MESSAGES.FORM_FILE_TOO_LARGE);
            return;
        }

        const reader = new FileReader();

        showLoading();

        reader.onload = () => {
            let result;

            try {
                result = prepareImportedForm(reader.result, getSession().project_definition, getSession().current_form_index);
            } catch (error) {
                // Never leave the overlay up if the parser itself throws.
                result = {ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID};
            }

            if (!result.ok) {
                hideLoading();
                notifyError(result.error);
                return;
            }

            getCurrentForm().inputs = result.inputs;
            getSession().current_input_ref = null;
            recordChange();
            renderApp(getHandlers());
            // Legacy hides the overlay ANIMATION_SLOW after the import.
            hideLoading(500);
            setTimeout(() => {
                // the import itself was valid, but the whole project may still
                // hold runtime errors the import checks do not cover (R-67)
                if (!result.project_valid) {
                    notifyWarning(`${FORM_MESSAGES.FORM_IMPORTED} ${FORM_MESSAGES.PROJECT_INVALID}`);
                } else if (countProjectSearchInputs(getSession().project_definition) >= PARAMETERS.SEARCH_INPUTS_MAX) {
                    // legacy warns when an import fills the search-question cap
                    notifyWarning(FORM_MESSAGES.SEARCH_INPUTS_LIMIT_REACHED);
                } else {
                    notifySuccess(FORM_MESSAGES.FORM_IMPORTED);
                }
            }, 500);
        };

        reader.onerror = () => {
            hideLoading();
            notifyError(FORM_MESSAGES.FORM_FILE_INVALID);
        };

        reader.readAsText(file);
    };

    field.click();
};
