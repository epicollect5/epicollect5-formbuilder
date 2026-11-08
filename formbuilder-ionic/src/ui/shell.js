'use strict';

import {getSession} from '@/services/session.js';
import {ensureUndoBaseline} from '@/services/undo.js';
import {
    getHandlers,
    getTrackedProject,
    isUnsaved,
    onMutation,
    setHandlers,
    setTrackedProject,
    setUnsaved
} from '@/ui/state.js';
import {bindPrimaryToolbar, renderProjectName, revealBuilder} from '@/ui/primary-toolbar.js';
import {renderTools} from '@/ui/input-tools.js';
import {refreshFormMenuGates, refreshFormTabs, renderForms} from '@/ui/forms-tabs.js';
import {refreshQuestionRows, renderQuestions} from '@/ui/questions-list.js';
import {refreshCurrentProperties, renderProperties} from '@/ui/properties.js';
import {installUnloadGuard, updateSaveButton, updateUndoButton} from '@/ui/save.js';

let save_gate_timer = null;

/* The save gate recomputes the whole project (R-41); typing only needs the
   result after the pause, so the keystroke path debounces it. Every other
   caller keeps the immediate update, and performSave re-validates anyway. */
const scheduleSaveButtonRefresh = () => {
    if (save_gate_timer) {
        clearTimeout(save_gate_timer);
    }

    save_gate_timer = setTimeout(() => {
        save_gate_timer = null;
        updateSaveButton();
    }, 300);
};

export const renderApp = (app_handlers) => {
    setHandlers(app_handlers);

    if (getSession().project_definition !== getTrackedProject()) {
        setTrackedProject(getSession().project_definition);
        setUnsaved(false);
    }

    installUnloadGuard();
    ensureUndoBaseline();
    renderProjectName();
    revealBuilder();
    bindPrimaryToolbar();
    renderTools();
    renderForms();
    renderQuestions();
    renderProperties();
};

/*
 * Background pass: reordering changes jump validity and selecting another
 * question must show the result of edits made since the last render. It
 * updates the icons and gates in place and never toasts, so only the explicit
 * Validate action reports a result.
 */
export const runBackgroundValidation = () => {
    refreshQuestionRows();
    refreshFormTabs();
    refreshFormMenuGates();
    updateSaveButton();
    refreshCurrentProperties();
};

/*
 * recordChange (ui/state.js) fans every mutation out through here: the undo
 * button follows the push, the save gate is debounced, and the active form tab
 * re-checks its validity while its questions are edited.
 */
onMutation(() => {
    updateUndoButton();
    scheduleSaveButtonRefresh();
    refreshFormTabs(getSession().current_form_index);
});

/*
    The area modules never import each other; this hub is the only place their
    render surfaces meet. Re-exports keep the cross-area calls (question list
    to properties, properties fields to the question list, and so on) in one
    reviewable place.
 */
export {renderForms, refreshFormTabs, refreshFormMenuGates} from '@/ui/forms-tabs.js';
export {
    renderQuestions,
    refreshQuestionRows,
    updateCurrentQuestionStatus,
    updateQuestionText,
    bindQuestionField,
    getQuestionLabelText,
    sanitizeQuestion,
    getQuestionLabel
} from '@/ui/questions-list.js';
export {renderProperties, refreshCurrentProperties} from '@/ui/properties.js';
export {installFormActions, openFormNameModal} from '@/ui/form-actions.js';
export {performSave, performUndo, updateSaveButton, updateUndoButton, installUnloadGuard} from '@/ui/save.js';
