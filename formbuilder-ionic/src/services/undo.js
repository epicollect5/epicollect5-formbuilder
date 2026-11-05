'use strict';

import { getForms } from '@/models/project-definition.js';
import { getSession, selectForm, setProject } from '@/services/session.js';

/*
 * Port of `actions/undo.js`.
 *
 * The legacy stack keeps one snapshot per user action, taken *after* the
 * mutation, with the baseline at index 0: undo pops the top and renders the one
 * below it. States are deep JSON copies of the project definition; the port
 * also records the form index so undoing stays on the form being edited
 * (the legacy `execute` had a `//todo` to stop forcing form 0).
 *
 * Typing pushes are throttled by 500ms, as in legacy `pushState(true)`, so a
 * burst of keystrokes is one undo step. An immediate push cancels a pending
 * throttled one and captures the whole state, so nothing typed is lost.
 *
 * The baseline follows the project-definition object identity: replacing the
 * project (load, import) starts a fresh history, while in-place edits and undo
 * restores keep the current one.
 */

export const MAX_UNDO_STATES = 10;
export const UNDO_THROTTLE_MS = 500;

let states = [];
let keys = [];
let pending = null;
let baseline = null;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function capture() {
    const session = getSession();

    return {
        project_definition: clone(session.project_definition),
        current_form_index: session.current_form_index
    };
}

function clearPending() {
    if (pending !== null) {
        clearTimeout(pending);
        pending = null;
    }
}

/* Identical consecutive states would be an undo step that changes nothing. */
function store(state) {
    const key = JSON.stringify(state);

    if (keys.length && keys[keys.length - 1] === key) {
        return false;
    }

    if (states.length >= MAX_UNDO_STATES) {
        states.shift();
        keys.shift();
    }

    states.push(state);
    keys.push(key);

    return true;
}

/* Lets the caller refresh its undo gate when a throttled push lands. */
function notify(config) {
    if (typeof config.on_change === 'function') {
        config.on_change();
    }
}

export function ensureUndoBaseline() {
    const project = getSession().project_definition;

    if (!project) {
        return false;
    }

    if (project !== baseline) {
        clearPending();
        states = [];
        keys = [];
        baseline = project;
        store(capture());
    }

    return states.length > 0;
}

export function resetUndoHistory() {
    clearPending();
    baseline = null;
    states = [];
    keys = [];

    return ensureUndoBaseline();
}

export function pushUndoState(options) {
    const config = options || {};

    ensureUndoBaseline();

    if (!getSession().project_definition) {
        return false;
    }

    if (config.throttle === true) {
        clearPending();
        pending = setTimeout(function () {
            pending = null;
            store(capture());
            notify(config);
        }, UNDO_THROTTLE_MS);

        return true;
    }

    clearPending();

    const stored = store(capture());

    notify(config);

    return stored;
}

export function canUndo() {
    ensureUndoBaseline();

    return states.length > 1;
}

/* Restores the state below the current one; the session is reset to it. */
export function undo() {
    ensureUndoBaseline();

    if (states.length <= 1) {
        return false;
    }

    clearPending();
    states.pop();
    keys.pop();

    const state = states[states.length - 1];
    const project = clone(state.project_definition);

    setProject(project);
    baseline = getSession().project_definition;

    const forms = getForms(project);
    const index = Math.min(Math.max(state.current_form_index, 0), Math.max(forms.length - 1, 0));

    if (index > 0) {
        selectForm(index);
    }

    return true;
}
