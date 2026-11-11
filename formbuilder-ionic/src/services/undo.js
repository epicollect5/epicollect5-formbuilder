'use strict';

import { toRaw } from 'vue';

import { getForms } from '@/models/project-definition.js';
import { PARAMETERS } from '@/config/parameters.js';
import { getSession, selectForm, setProject } from '@/services/session.js';

/*
 * Port of `actions/undo.js`.
 *
 * The legacy stack keeps one snapshot per user action, taken *after* the
 * mutation, with the baseline at index 0: undo pops the top and renders the one
 * below it. The port also records the form index so undoing stays on the form
 * being edited (the legacy `execute` had a `//todo` to stop forcing form 0).
 *
 * A snapshot is the serialized project definition, not a parsed clone: one
 * string per state instead of a clone plus a stringified dedupe key (R-62).
 * `undo` re-parses that string, which is the single pass the clone used to cost
 * on restore, and consecutive states are compared as text, so the history keeps
 * no second copy of anything.
 *
 * History is bounded twice, by `MAX_UNDO_STATES` and by `MAX_UNDO_BYTES`, so a
 * project near the schema limits keeps fewer steps instead of exhausting the
 * tab. A state is accounted at two bytes per character, the UTF-16 upper bound,
 * so the byte budget is never under-estimated. The newest state is always kept,
 * even when it alone exceeds the budget, so the stack cannot lose its only
 * entry.
 *
 * Typing pushes are throttled by 500ms, as in legacy `pushState(true)`, so a
 * burst of keystrokes is one undo step. An immediate push cancels a pending
 * throttled one and captures the whole state, so nothing typed is lost.
 *
 * The baseline follows the project-definition object identity: replacing the
 * project (load, import) starts a fresh history, while in-place edits and undo
 * restores keep the current one.
 */

let states = [];
let state_bytes = 0;
let pending = null;
let baseline = null;

/*
 * The definition sits behind `reactive()`, so serializing it directly pays a
 * proxy trap on every property read: several times the cost of the same bytes
 * read from the plain graph. `toRaw` returns the live target - writes through
 * the proxy land on it - so the snapshot is identical, only cheaper (S-09).
 */
const capture = () => {
    const session = getSession();
    const json = JSON.stringify(toRaw(session.project_definition));

    return {
        json,
        current_form_index: session.current_form_index,
        bytes: json.length * 2
    };
};

const clearPending = () => {
    if (pending !== null) {
        clearTimeout(pending);
        pending = null;
    }
};

/* Drops the oldest states until both ceilings hold; never drops the newest. */
const trim = () => {
    while (states.length > 1 && (states.length > PARAMETERS.MAX_UNDO_STATES || state_bytes > PARAMETERS.MAX_UNDO_BYTES)) {
        state_bytes -= states.shift().bytes;
    }
};

const store = (state) => {
    const previous = states[states.length - 1];

    /* Identical consecutive states would be an undo step that changes nothing. */
    if (previous && previous.json === state.json && previous.current_form_index === state.current_form_index) {
        return false;
    }

    states.push(state);
    state_bytes += state.bytes;
    trim();

    return true;
};

/* Lets the caller refresh its undo gate when a throttled push lands. */
const notify = (config) => {
    if (typeof config.on_change === 'function') {
        config.on_change();
    }
};

export const ensureUndoBaseline = () => {
    const project = getSession().project_definition;

    if (!project) {
        return false;
    }

    if (project !== baseline) {
        clearPending();
        states = [];
        state_bytes = 0;
        baseline = project;
        store(capture());
    }

    return states.length > 0;
};

export const resetUndoHistory = () => {
    clearPending();
    baseline = null;
    states = [];
    state_bytes = 0;

    return ensureUndoBaseline();
};

export const pushUndoState = (options) => {
    const config = options || {};

    ensureUndoBaseline();

    if (!getSession().project_definition) {
        return false;
    }

    if (config.throttle === true) {
        clearPending();
        pending = setTimeout(() => {
            pending = null;
            store(capture());
            notify(config);
        }, PARAMETERS.UNDO_THROTTLE_MS);

        return true;
    }

    clearPending();

    const stored = store(capture());

    notify(config);

    return stored;
};

export const canUndo = () => {
    ensureUndoBaseline();

    return states.length > 1;
};

/* Restores the state below the current one; the session is reset to it. */
export const undo = () => {
    ensureUndoBaseline();

    if (states.length <= 1) {
        return false;
    }

    clearPending();
    state_bytes -= states.pop().bytes;

    const state = states[states.length - 1];
    const project = JSON.parse(state.json);

    setProject(project);
    baseline = getSession().project_definition;

    const forms = getForms(project);
    const index = Math.min(Math.max(state.current_form_index, 0), Math.max(forms.length - 1, 0));

    if (index > 0) {
        selectForm(index);
    }

    return true;
};
