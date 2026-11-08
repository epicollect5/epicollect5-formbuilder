'use strict';

import {FORM_MESSAGES} from '@/config/strings.js';
import {getForms} from '@/models/project-definition.js';
import {
    getSession,
    selectForm
} from '@/services/session.js';
import {areAllInputsValid} from '@/services/validation.js';
import {saveProject} from '@/services/save.js';
import {canUndo, undo} from '@/services/undo.js';
import {
    getChangeRevision,
    bumpChangeRevision,
    getHandlers,
    isSaving,
    setSaving,
    isUnsaved,
    setUnsaved,
    isUnloadGuardBound,
    markUnloadGuardBound,
    setActivePropertyTab
} from '@/ui/state.js';
import {hideLoading, notifyError, notifySuccess, showLoading} from '@/services/notifications.js';

import {renderApp} from '@/ui/shell.js';

const isDevMode = () => {
    return window.__FORMBUILDER_DEV__ === true;
};

export const updateUndoButton = () => {
    const undo_button = document.getElementById('undo');

    if (!undo_button) {
        return;
    }

    const available = canUndo();

    undo_button.disabled = !available;
    undo_button.title = available ? 'Undo the last change' : 'Nothing to undo';
};

export const installUnloadGuard = () => {
    if (isUnloadGuardBound()) {
        return;
    }

    markUnloadGuardBound();

    window.addEventListener('beforeunload', (event) => {
        if (!isUnsaved()) {
            return;
        }

        event.preventDefault();
    });
};

export const performUndo = () => {
    showLoading();

    if (!undo()) {
        hideLoading();
        updateUndoButton();
        return;
    }

    // Undoing an added form leaves the index past the end of the restored list.
    if (getSession().current_form_index >= getForms(getSession().project_definition).length) {
        selectForm(Math.max(getForms(getSession().project_definition).length - 1, 0));
    }

    // the data now differs from any save in flight, so a racing save must not
    // clear the unsaved marker (R-72)
    bumpChangeRevision();

    setActivePropertyTab('basic');
    renderApp(getHandlers());
    // Legacy drops the overlay ANIMATION_SLOW after re-rendering the state.
    hideLoading(500);
};

export const updateSaveButton = () => {
    const button = document.getElementById('save');

    if (!button) {
        return;
    }

    const valid = areAllInputsValid(getSession().project_definition);

    button.disabled = isSaving() || !valid;
    button.title = isSaving() ? FORM_MESSAGES.PROJECT_SAVING : (valid ? 'Save project' : 'Fix the validation errors before saving');
};

export const performSave = async () => {
    if (isSaving()) {
        return;
    }

    const project_definition = getSession().project_definition;
    // the payload is copied synchronously inside saveProject, so this revision
    // is the one the request carries
    const revision_at_start = getChangeRevision();

    setSaving(true);
    updateSaveButton();
    showLoading();

    try {
        await saveProject(project_definition, {dev: isDevMode()});

        // an edit or an undo made while the request was in flight is not in
        // the saved payload, so it stays marked unsaved (R-72)
        setUnsaved(getChangeRevision() !== revision_at_start);

        // Legacy keeps the overlay up for ANIMATION_SLOW after the response;
        // the toast waits for the overlay to clear.
        hideLoading(500);
        setTimeout(() => {
            notifySuccess(FORM_MESSAGES.PROJECT_SAVED);
        }, 500);
    } catch (error) {
        const message = error && error.message ? error.message : '';

        hideLoading();
        notifyError(`${FORM_MESSAGES.PROJECT_NOT_SAVED}${message ? ` ${message}` : ''}`);
    } finally {
        setSaving(false);
        updateSaveButton();
    }
};
