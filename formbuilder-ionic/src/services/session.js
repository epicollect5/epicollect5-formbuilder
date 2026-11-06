'use strict';

import { findInput, getForm, getForms, getInputs, getProject } from '@/models/project-definition.js';
import { createInput } from '@/models/input-factory.js';
import { canContainInput, getContainerList } from '@/models/nesting.js';
import { generateFormRef } from '@/models/refs.js';
import { FORM_NAME_MAX_LENGTH, MAX_FORMS } from '@/services/form-management.js';

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

export const getSession = () => {
    return session;
};

export const setProject = (project_definition) => {
    session.project_definition = project_definition;
    session.current_form_index = 0;
    session.current_input_ref = null;
    session.editing = [];
};

export const getCurrentForm = () => {
    return getForm(session.project_definition, session.current_form_index);
};

const findInList = (inputs, input_ref) => {
    if (!input_ref) {
        return null;
    }

    return inputs.find((input) => {
        return input.ref === input_ref;
    }) || null;
};

/* The containers being edited, outermost first, resolved from the definition. */
export const getEditingTrail = () => {
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
};

export const isEditing = () => {
    return session.editing.length > 0;
};

export const getEditingContainer = () => {
    const trail = getEditingTrail();

    return trail.length ? trail[trail.length - 1] : null;
};

/* The list the question panel shows: a branch / group array or form inputs. */
const getActiveInputs = () => {
    const container = getEditingContainer();

    return container ? getContainerList(container) : getInputs(getCurrentForm());
};

export const getCurrentInputs = () => {
    return getActiveInputs();
};

export const getCurrentInput = () => {
    return findInList(getActiveInputs(), session.current_input_ref);
};

export const selectForm = (form_index) => {
    if (!getForms(session.project_definition)[form_index]) {
        return null;
    }

    session.current_form_index = form_index;
    session.current_input_ref = null;
    session.editing = [];

    return getCurrentForm();
};

export const selectInput = (input_ref) => {
    const input = findInList(getActiveInputs(), input_ref);

    session.current_input_ref = input ? input.ref : null;

    return input;
};

/* Enters a branch or group; the list then shows that container's children. */
export const enterInput = (input_ref) => {
    const input = findInList(getActiveInputs(), input_ref);

    if (!input || (input.type !== 'branch' && input.type !== 'group')) {
        return null;
    }

    session.editing.push({ kind: input.type, ref: input.ref });
    session.current_input_ref = null;

    return input;
};

/* Leaves the innermost container and selects it again, as in the legacy app. */
export const exitEditing = () => {
    const entry = session.editing.pop();

    if (!entry) {
        return null;
    }

    session.current_input_ref = entry.ref;

    return getCurrentInput();
};

export const canAddInput = (type) => {
    return canContainInput(getEditingContainer(), type);
};

export const updateCurrentInput = (changes) => {
    const input = getCurrentInput();

    if (!input) {
        return null;
    }

    Object.keys(changes).forEach((key) => {
        input[key] = changes[key];
    });

    return input;
};

export const addInput = (type) => {
    return insertInput(type, getActiveInputs().length);
};

/* Appends an already-built input (a duplicate) to the active list. */
export const addInputObject = (input) => {
    if (!input) {
        return null;
    }

    getActiveInputs().push(input);
    session.current_input_ref = input.ref;

    return input;
};

export const insertInput = (type, index) => {
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
};

/* Applies the order the sortable produced; refuses a partial list. */
export const reorderInputs = (refs) => {
    const form = getCurrentForm();

    if (!form) {
        return false;
    }

    const inputs = getActiveInputs();
    const by_ref = new Map(inputs.map((input) => {
        return [input.ref, input];
    }));
    const ordered = refs.map((ref) => {
        return by_ref.get(ref);
    }).filter(Boolean);

    if (ordered.length !== inputs.length) {
        return false;
    }

    inputs.splice(0, inputs.length, ...ordered);

    return true;
};

export const addForm = (name) => {
    const project = getProject(session.project_definition);

    if (!project || project.forms.length >= MAX_FORMS) {
        return null;
    }

    const form_name = String(name === undefined || name === null || String(name).trim() === '' ? 'New form' : name)
        .trim()
        .slice(0, FORM_NAME_MAX_LENGTH);
    const form = {
        ref: generateFormRef(project.ref),
        name: form_name,
        slug: slugify(`${form_name}-${project.forms.length + 1}`),
        type: 'hierarchy',
        inputs: []
    };

    project.forms.push(form);
    session.current_form_index = project.forms.length - 1;
    session.current_input_ref = null;
    session.editing = [];

    return form;
};

const slugify = (text) => {
    return String(text).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
};

export const renameForm = (form_index, name) => {
    const form = getForms(session.project_definition)[form_index];
    const trimmed = String(name === undefined || name === null ? '' : name).trim().slice(0, FORM_NAME_MAX_LENGTH);

    if (!form || !trimmed) {
        return null;
    }

    form.name = trimmed;
    form.slug = slugify(trimmed);

    return form;
};

/* Legacy deletes only the last child form; the first form is the root. */
export const deleteForm = (form_index) => {
    const forms = getForms(session.project_definition);

    if (form_index <= 0 || form_index !== forms.length - 1) {
        return false;
    }

    forms.splice(form_index, 1);
    selectForm(form_index - 1);

    return true;
};

/* Delete all questions of the active list (form inputs or a container). */
export const removeAllInputs = () => {
    const inputs = getActiveInputs();

    if (!inputs.length) {
        return false;
    }

    inputs.splice(0, inputs.length);
    session.current_input_ref = null;

    return true;
};

export const removeInput = (input_ref) => {
    const inputs = getActiveInputs();
    const index = inputs.findIndex((input) => {
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
};

export const moveInput = (from_index, to_index) => {
    const inputs = getActiveInputs();

    if (from_index === to_index || from_index < 0 || to_index < 0 || from_index >= inputs.length || to_index >= inputs.length) {
        return false;
    }

    const input = inputs.splice(from_index, 1)[0];

    inputs.splice(to_index, 0, input);

    return true;
};
