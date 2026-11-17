'use strict';

import { computed, reactive } from 'vue';
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
import { pickTextFile } from '@/services/file-picker.js';
import { hideLoading, notifyError, notifySuccess, notifyWarning, showLoading } from '@/services/notifications.js';
import { downloadFile } from '@/ui/download.js';
import { printForm } from '@/ui/print.js';
import { useRootStore } from '@/vue/stores/root-store.js';
import { useModalStore } from '@/vue/stores/modal-store.js';

/*
 * Form management and the project IO flows: add / rename / delete forms,
 * delete-all questions, form export and print, and the form file import.
 * Mutations go through the session services and the builder store's
 * recordChange (the composed-store pattern).
 */
export const useFormsStore = defineStore('forms', () => {
    const builder = useRootStore();
    const modal = useModalStore();

    const state = reactive({
        /*
         * The form-name modal body: the field value and the validation error.
         * adding mirrors the modal's mode (no form passed = add a form).
         */
        form_name_modal: {
            value: '',
            error: '',
            adding: true
        }
    });

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
         * and Save adds a form), renaming passes the current one. The body is
         * FormNameModalBody, bound to the form_name_modal state below.
         */
        openFormNameModal(form) {
            state.form_name_modal.value = form ? form.name || '' : '';
            state.form_name_modal.error = '';
            state.form_name_modal.adding = !form;

            modal.openModal({
                title: FORMS_MESSAGES.FORM_NAME_MODAL,
                kind: 'form-name',
                buttons: [
                    { text: FORM_MESSAGES.DISMISS_BUTTON, align: 'start' },
                    {
                        text: FORMS_MESSAGES.SAVE_CHANGES,
                        action: () => {
                            methods.saveFormName();
                        }
                    }
                ]
            });
        },
        setFormNameValue(value) {
            state.form_name_modal.value = value === undefined || value === null ? '' : value;
            state.form_name_modal.error = '';
        },
        saveFormName() {
            const session = builder.state.session;
            const adding = state.form_name_modal.adding;
            const forms = getForms(session.project_definition);
            const form_index = session.current_form_index;
            const validation_error = getFormNameError(forms, state.form_name_modal.value, adding ? -1 : form_index);

            if (validation_error) {
                state.form_name_modal.error = validation_error;
                return;
            }

            if (adding) {
                if (!addForm(state.form_name_modal.value)) {
                    return;
                }
            } else {
                renameForm(form_index, state.form_name_modal.value);
            }

            builder.recordChange();
            modal.closeModal();
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

            pickTextFile({
                accept: '.json,application/json',
                extension_pattern: /\.json$/i,
                max_bytes: PARAMETERS.IMPORT_MAX_BYTES,
                on_validated: () => {
                    showLoading();
                }
            }).then((result) => {
                if (!result.ok) {
                    if (result.reason === 'invalid') {
                        notifyError(FORM_MESSAGES.FORM_FILE_INVALID);
                    } else if (result.reason === 'too_large') {
                        notifyError(FORM_MESSAGES.FORM_FILE_TOO_LARGE);
                    } else if (result.reason === 'read_error') {
                        hideLoading();
                        notifyError(FORM_MESSAGES.FORM_FILE_INVALID);
                    }
                    return;
                }

                let import_result;

                try {
                    import_result = prepareImportedForm(result.text, builder.state.session.project_definition, builder.state.session.current_form_index);
                } catch (error) {
                    // Never leave the overlay up if the parser itself throws.
                    import_result = { ok: false, error: FORM_MESSAGES.FORM_FILE_INVALID };
                }

                if (!import_result.ok) {
                    hideLoading();
                    notifyError(import_result.error);
                    return;
                }

                getCurrentForm().inputs = import_result.inputs;
                builder.state.session.current_input_ref = null;
                builder.recordChange();

                // Legacy hides the overlay ANIMATION_SLOW after the import.
                hideLoading(500);
                setTimeout(() => {
                    // the import itself was valid, but the whole project may
                    // still hold runtime errors the import checks do not
                    // cover (R-67)
                    if (!import_result.project_valid) {
                        notifyWarning(`${FORM_MESSAGES.FORM_IMPORTED} ${FORM_MESSAGES.PROJECT_INVALID}`);
                    } else if (countProjectSearchInputs(builder.state.session.project_definition) >= PARAMETERS.SEARCH_INPUTS_MAX) {
                        // legacy warns when an import fills the search cap
                        notifyWarning(FORM_MESSAGES.SEARCH_INPUTS_LIMIT_REACHED);
                    } else {
                        notifySuccess(FORM_MESSAGES.FORM_IMPORTED);
                    }
                }, 500);
            });
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
        state,
        ...methods,
        ...computedScope
    };
});
