'use strict';

import { findInput, getForm, getForms, getInputs } from '@/models/project-definition.js';

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
