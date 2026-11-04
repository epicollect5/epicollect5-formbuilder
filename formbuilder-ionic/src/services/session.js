'use strict';

import { findInput, getForm, getForms, getInputs, getProject } from '@/models/project-definition.js';
import { createInput } from '@/models/input-factory.js';
import { generateFormRef } from '@/models/refs.js';

/*
 * The project definition is the state. This module only holds the reference to
 * it plus the current selection; there is no store and no derived copy.
 */
const session = {
    project_definition: null,
    current_form_index: 0,
    current_input_ref: null
};

export function getSession() {
    return session;
}

export function setProject(project_definition) {
    session.project_definition = project_definition;
    session.current_form_index = 0;
    session.current_input_ref = null;
}

export function getCurrentForm() {
    return getForm(session.project_definition, session.current_form_index);
}

export function getCurrentInputs() {
    return getInputs(getCurrentForm());
}

export function getCurrentInput() {
    return findInput(getCurrentForm(), session.current_input_ref);
}

export function selectForm(form_index) {
    if (!getForms(session.project_definition)[form_index]) {
        return null;
    }

    session.current_form_index = form_index;
    session.current_input_ref = null;

    return getCurrentForm();
}

export function selectInput(input_ref) {
    const input = findInput(getCurrentForm(), input_ref);

    session.current_input_ref = input ? input.ref : null;

    return input;
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
    const form = getCurrentForm();

    if (!form) {
        return null;
    }

    return insertInput(type, form.inputs.length);
}

export function insertInput(type, index) {
    const form = getCurrentForm();

    if (!form) {
        return null;
    }

    const input = createInput(type, form.ref);
    const bounded_index = Math.max(0, Math.min(index, form.inputs.length));

    form.inputs.splice(bounded_index, 0, input);
    session.current_input_ref = input.ref;

    return input;
}

/* Applies the order the sortable produced; refuses a partial list. */
export function reorderInputs(refs) {
    const form = getCurrentForm();

    if (!form) {
        return false;
    }

    const by_ref = new Map(form.inputs.map(function (input) {
        return [input.ref, input];
    }));
    const ordered = refs.map(function (ref) {
        return by_ref.get(ref);
    }).filter(Boolean);

    if (ordered.length !== form.inputs.length) {
        return false;
    }

    form.inputs.splice.apply(form.inputs, [0, form.inputs.length].concat(ordered));

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

    return form;
}

function slugify(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function removeInput(input_ref) {
    const form = getCurrentForm();
    const inputs = getInputs(form);
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
    const inputs = getCurrentInputs();

    if (from_index === to_index || from_index < 0 || to_index < 0 || from_index >= inputs.length || to_index >= inputs.length) {
        return false;
    }

    const input = inputs.splice(from_index, 1)[0];

    inputs.splice(to_index, 0, input);

    return true;
}
