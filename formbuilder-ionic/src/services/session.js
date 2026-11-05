'use strict';

import { findInput, getForm, getForms, getInputs, getProject } from '@/models/project-definition.js';
import { createInput } from '@/models/input-factory.js';
import { canContainInput, getContainerList } from '@/models/nesting.js';
import { generateFormRef } from '@/models/refs.js';

/*
 * The project definition is the state. This module only holds the reference to
 * it plus the current selection and the branch / group being edited; there is
 * no store and no derived copy.
 *
 * The editing stack is a list of container refs, not a list of objects, so the
 * definition stays the single source of truth: every read walks it again.
 */
const session = {
    project_definition: null,
    current_form_index: 0,
    current_input_ref: null,
    editing: []
};

export function getSession() {
    return session;
}

export function setProject(project_definition) {
    session.project_definition = project_definition;
    session.current_form_index = 0;
    session.current_input_ref = null;
    session.editing = [];
}

export function getCurrentForm() {
    return getForm(session.project_definition, session.current_form_index);
}

function findInList(inputs, input_ref) {
    if (!input_ref) {
        return null;
    }

    return inputs.find(function (input) {
        return input.ref === input_ref;
    }) || null;
}

/* The containers being edited, outermost first, resolved from the definition. */
export function getEditingTrail() {
    const trail = [];
    let inputs = getInputs(getCurrentForm());

    for (let i = 0; i < session.editing.length; i += 1) {
        const container = findInList(inputs, session.editing[i].ref);

        if (!container) {
            break;
        }

        trail.push(container);
        inputs = getContainerList(container);
    }

    return trail;
}

export function isEditing() {
    return session.editing.length > 0;
}

export function getEditingContainer() {
    const trail = getEditingTrail();

    return trail.length ? trail[trail.length - 1] : null;
}

/* The list the question panel shows: a branch / group array or form inputs. */
function getActiveInputs() {
    const container = getEditingContainer();

    return container ? getContainerList(container) : getInputs(getCurrentForm());
}

export function getCurrentInputs() {
    return getActiveInputs();
}

export function getCurrentInput() {
    return findInList(getActiveInputs(), session.current_input_ref);
}

export function selectForm(form_index) {
    if (!getForms(session.project_definition)[form_index]) {
        return null;
    }

    session.current_form_index = form_index;
    session.current_input_ref = null;
    session.editing = [];

    return getCurrentForm();
}

export function selectInput(input_ref) {
    const input = findInList(getActiveInputs(), input_ref);

    session.current_input_ref = input ? input.ref : null;

    return input;
}

/* Enters a branch or group; the list then shows that container's children. */
export function enterInput(input_ref) {
    const input = findInList(getActiveInputs(), input_ref);

    if (!input || (input.type !== 'branch' && input.type !== 'group')) {
        return null;
    }

    session.editing.push({ kind: input.type, ref: input.ref });
    session.current_input_ref = null;

    return input;
}

/* Leaves the innermost container and selects it again, as in the legacy app. */
export function exitEditing() {
    const entry = session.editing.pop();

    if (!entry) {
        return null;
    }

    session.current_input_ref = entry.ref;

    return getCurrentInput();
}

export function canAddInput(type) {
    return canContainInput(getEditingContainer(), type);
}

export function updateCurrentInput(changes) {
    const input = getCurrentInput();

    if (!input) {
        return null;
    }

    Object.keys(changes).forEach(function (key) {
        input[key] = changes[key];
    });

    return input;
}

export function addInput(type) {
    return insertInput(type, getActiveInputs().length);
}

export function insertInput(type, index) {
    const form = getCurrentForm();

    if (!form || !canAddInput(type)) {
        return null;
    }

    const inputs = getActiveInputs();
    const container = getEditingContainer();
    const input = createInput(type, container ? container.ref : form.ref);
    const bounded_index = Math.max(0, Math.min(index, inputs.length));

    inputs.splice(bounded_index, 0, input);
    session.current_input_ref = input.ref;

    return input;
}

/* Applies the order the sortable produced; refuses a partial list. */
export function reorderInputs(refs) {
    const form = getCurrentForm();

    if (!form) {
        return false;
    }

    const inputs = getActiveInputs();
    const by_ref = new Map(inputs.map(function (input) {
        return [input.ref, input];
    }));
    const ordered = refs.map(function (ref) {
        return by_ref.get(ref);
    }).filter(Boolean);

    if (ordered.length !== inputs.length) {
        return false;
    }

    inputs.splice.apply(inputs, [0, inputs.length].concat(ordered));

    return true;
}

export function addForm() {
    const project = getProject(session.project_definition);

    if (!project) {
        return null;
    }

    const name = 'New form';
    const form = {
        ref: generateFormRef(project.ref),
        name: name,
        slug: slugify(name + '-' + (project.forms.length + 1)),
        type: 'hierarchy',
        inputs: []
    };

    project.forms.push(form);
    session.current_form_index = project.forms.length - 1;
    session.current_input_ref = null;
    session.editing = [];

    return form;
}

function slugify(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function removeInput(input_ref) {
    const inputs = getActiveInputs();
    const index = inputs.findIndex(function (input) {
        return input.ref === input_ref;
    });

    if (index === -1) {
        return false;
    }

    inputs.splice(index, 1);

    if (session.current_input_ref === input_ref) {
        session.current_input_ref = null;
    }

    return true;
}

export function moveInput(from_index, to_index) {
    const inputs = getActiveInputs();

    if (from_index === to_index || from_index < 0 || to_index < 0 || from_index >= inputs.length || to_index >= inputs.length) {
        return false;
    }

    const input = inputs.splice(from_index, 1)[0];

    inputs.splice(to_index, 0, input);

    return true;
}
