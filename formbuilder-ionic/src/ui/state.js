'use strict';

import {pushUndoState} from '@/services/undo.js';

/*
    The shared mutable state of the builder UI.

    Area modules never import each other — they import this module, the
    services and the models, and reach the other areas through ui/shell.js
    (the hub that re-exports the render surfaces) or through the callbacks
    registered here (onMutation).
 */
let handlers = {};
const answer_pages = new Map();
const answer_notices = new Map();
const jump_pages = new Map();
let active_readme_editor = null;
let active_property_tab = 'basic';
let unsaved_changes = false;
let saving = false;
let change_revision = 0;
let tracked_project = null;
let unload_guard_bound = false;

const mutation_listeners = new Set();

export const onMutation = (listener) => {
    mutation_listeners.add(listener);
};

const fireMutation = () => {
    mutation_listeners.forEach((listener) => {
        listener();
    });
};

export const getHandlers = () => handlers;
export const setHandlers = (app_handlers) => {
    handlers = app_handlers || {};
};

export const getAnswerPages = () => answer_pages;
export const getAnswerNotices = () => answer_notices;
export const getJumpPages = () => jump_pages;

export const getActiveReadmeEditor = () => active_readme_editor;
export const setActiveReadmeEditor = (editor) => {
    active_readme_editor = editor;
};

export const getActivePropertyTab = () => active_property_tab;
export const setActivePropertyTab = (value) => {
    active_property_tab = value;
};

export const isUnsaved = () => unsaved_changes;
export const setUnsaved = (value) => {
    unsaved_changes = !!value;
};

export const isSaving = () => saving;
export const setSaving = (value) => {
    saving = !!value;
};

export const getChangeRevision = () => change_revision;
export const bumpChangeRevision = () => {
    change_revision += 1;
};

export const getTrackedProject = () => tracked_project;
export const setTrackedProject = (project) => {
    tracked_project = project;
};

export const isUnloadGuardBound = () => unload_guard_bound;
export const markUnloadGuardBound = () => {
    unload_guard_bound = true;
};

/*
    Every mutation goes through here: the undo push (matching the legacy push
    points, with the throttled snapshot firing the same listeners), the
    revision bump, the unsaved flag and the registered UI refreshes.
 */
export const recordChange = (options) => {
    pushUndoState(Object.assign({on_change: () => {
        fireMutation();
    }}, options || {}));
    change_revision += 1;
    unsaved_changes = true;
    fireMutation();
};
