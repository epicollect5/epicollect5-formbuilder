'use strict';

/*
 * Read helpers over the project-definition contract. They never mutate the
 * definition and never touch the DOM: the JSON is the only shared shape
 * between this UI, the server, the mobile app and the dataviewer.
 */

export function getProject(project_definition) {
    if (!project_definition || !project_definition.data) {
        return null;
    }

    return project_definition.data.project || null;
}

export function getForms(project_definition) {
    const project = getProject(project_definition);

    return project && Array.isArray(project.forms) ? project.forms : [];
}

export function getForm(project_definition, form_index) {
    return getForms(project_definition)[form_index] || null;
}

export function getInputs(form) {
    return form && Array.isArray(form.inputs) ? form.inputs : [];
}

export function findInput(form, input_ref) {
    if (!input_ref) {
        return null;
    }

    return getInputs(form).find(function (input) {
        return input.ref === input_ref;
    }) || null;
}

export function getInputIndex(form, input_ref) {
    return getInputs(form).findIndex(function (input) {
        return input.ref === input_ref;
    });
}

/*
 * `dom` is runtime-only state the legacy renderer attached to input objects;
 * it must never reach the server.
 */
export function serializeProject(project_definition) {
    return JSON.parse(JSON.stringify(project_definition, function (key, value) {
        return key === 'dom' ? undefined : value;
    }));
}
