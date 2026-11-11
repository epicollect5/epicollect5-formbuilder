'use strict';

import { computed } from 'vue';
import { defineStore } from 'pinia';
import { PARAMETERS } from '@/config/parameters.js';
import { FORM_MESSAGES, FORMS_MESSAGES } from '@/config/strings.js';
import { getForms } from '@/models/project-definition.js';
import { countProjectSearchInputs } from '@/models/project-limits.js';
import { getFormNameError } from '@/services/form-management.js';
import { prepareImportedForm } from '@/services/form-import.js';
import { areFormInputsValid } from '@/services/validation.js';
import {
    addForm,
    deleteForm,
    getCurrentForm,
    getSession,
    isEditing,
    removeAllInputs,
    renameForm
} from '@/services/session.js';
import { buildFormExport, getFormExportFilename } from '@/services/save.js';
import { hideLoading, notifyError, notifySuccess, notifyWarning, showLoading } from '@/services/notifications.js';
import { createView } from '@/ui/dom.js';
import { openModal } from '@/ui/modal.js';
import { downloadFile } from '@/ui/download.js';
import { printForm } from '@/ui/print.js';
import form_name_modal_body_view from '@/views/form-name-modal-body.html?raw';
import { useRootStore } from '@/vue/stores/root-store.js';

/*
 * Form management and the project IO flows: add / rename / delete forms,
 * delete-all questions, form export and print, and the form file import.
 * Mutations go through the session services and the builder store's
 * recordChange (the composed-store pattern).
 */
export const useFormsStore = defineStore('forms', () => {
    const builder = useRootStore();

    const methods = {
        /* The header delete button's gate: only the last child form goes. */
        formDeletable() {
            const session = builder.state.session;
            const forms = getForms(session.project_definition);

            return !isEditing() && session.current_form_index > 0 && session.current_form_index === forms.length - 1;
        },
        formValid() {
            return areFormInputsValid(getCurrentForm());
        },
        /*
         * The form name modal: adding passes no form (the prefill stays empty
         * and Save adds a form), renaming passes the current one.
         */
        openFormNameModal(form) {
            const session = builder.state.session;
            const adding = !form;
            const body = createView(form_name_modal_body_view);
            const field = body.querySelector('ion-input');
            const error = body.querySelector('[data-role="form-name-error"]');

            field.setAttribute('maxlength', String(PARAMETERS.FORM_NAME_MAX_LENGTH));
            field.addEventListener('ionInput', () => {
                error.hidden = true;
            });

            openModal({
                title: FORMS_MESSAGES.FORM_NAME_MODAL,
                body,
                buttons: [
                    { text: FORM_MESSAGES.DISMISS_BUTTON, align: 'start' },
                    {
                        text: FORMS_MESSAGES.SAVE_CHANGES,
                        on_click: (close) => {
                            const forms = getForms(session.project_definition);
                            const form_index = session.current_form_index;
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

                            builder.recordChange();
                            close();
                        }
                    }
                ]
            });

            // The prefill must land after the field is in the document: a value
            // set on the not-yet-upgraded element is dropped when the component
            // upgrades.
            field.value = form ? form.name || '' : '';

            if (typeof field.setFocus === 'function') {
                field.setFocus();
            } else {
                field.focus();
            }
        },
        deleteCurrentForm() {
            const session = builder.state.session;

            if (!methods.formDeletable() || !deleteForm(session.current_form_index)) {
                return;
            }

            builder.recordChange();
            notifyWarning(FORM_MESSAGES.FORM_DELETED);
        },
        exportForm() {
            const session = builder.state.session;
            const payload = buildFormExport(session.project_definition, session.current_form_index);

            if (!payload) {
                notifyError(FORM_MESSAGES.FORM_IS_INVALID);
                return;
            }

            downloadFile(
                getFormExportFilename(session.project_definition, session.current_form_index),
                JSON.stringify(payload),
                'application/json'
            );
        },
        printCurrentForm() {
            const session = builder.state.session;

            if (!printForm(session.project_definition, session.current_form_index)) {
                notifyError(FORM_MESSAGES.FORM_IS_INVALID);
            }
        },
        deleteAllQuestions() {
            if (!removeAllInputs()) {
                return;
            }

            builder.recordChange();

            // Legacy deletes behind the busy overlay and drops it after 1s.
            showLoading();
            hideLoading(1000);
        },
        importFormFile() {
            if (isEditing()) {
                notifyWarning('Return to the form to import');
                return;
            }

            const field = document.createElement('input');

            field.type = 'file';
            field.accept = '.json,application/json';
            field.hidden = true;

            field.addEventListener('change', () => {
                const file = field.files && field.files[0];

                if (!file) {
                    field.remove();
                    return;
                }

                if (!/\.json$/i.test(file.name)) {
                    field.remove();
                    notifyError(FORM_MESSAGES.FORM_FILE_INVALID);
                    return;
                }

                if (file.size > PARAMETERS.IMPORT_MAX_BYTES) {
                    field.remove();
                    notifyError(FORM_MESSAGES.FORM_FILE_TOO_LARGE);
                    return;
                }

                const reader = new FileReader();

                showLoading();

                reader.onload = () => {
                    let result;

                    try {
                        result = prepareImportedForm(reader.result, builder.state.session.project_definition, builder.state.session.current_form_index);
                    } catch (error) {
                        // Never leave the overlay up if the parser itself throws.
                        result = { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
                    }

                    if (!result.ok) {
                        hideLoading();
                        notifyError(result.error);
                        return;
                    }

                    getCurrentForm().inputs = result.inputs;
                    builder.state.session.current_input_ref = null;
                    builder.recordChange();

                    // Legacy hides the overlay ANIMATION_SLOW after the import.
                    hideLoading(500);
                    setTimeout(() => {
                        // the import itself was valid, but the whole project may
                        // still hold runtime errors the import checks do not
                        // cover (R-67)
                        if (!result.project_valid) {
                            notifyWarning(`${FORM_MESSAGES.FORM_IMPORTED} ${FORM_MESSAGES.PROJECT_INVALID}`);
                        } else if (countProjectSearchInputs(builder.state.session.project_definition) >= PARAMETERS.SEARCH_INPUTS_MAX) {
                            // legacy warns when an import fills the search cap
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
            });

            document.body.append(field);
            field.click();
        }
    };

    const computedScope = {
        addFormEnabled: computed(() => {
            const session = builder.state.session;
            const forms = getForms(session.project_definition);

            return !isEditing() && forms.length < PARAMETERS.MAX_FORMS;
        }),
        addFormTitle: computed(() => {
            const session = builder.state.session;
            const forms = getForms(session.project_definition);

            return forms.length >= PARAMETERS.MAX_FORMS ? FORMS_MESSAGES.ADD_FORM_LIMIT : FORMS_MESSAGES.ADD_FORM;
        })
    };

    return {
        ...methods,
        ...computedScope
    };
});
