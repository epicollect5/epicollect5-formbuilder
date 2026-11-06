'use strict';

/*
 * Read helpers over the project-definition contract. They never mutate the
 * definition and never touch the DOM: the JSON is the only shared shape
 * between this UI, the server, the mobile app and the dataviewer.
 */

export const getProject = (project_definition) => {
    if (!project_definition || !project_definition.data) {
        return null;
    }

    return project_definition.data.project || null;
};

export const getForms = (project_definition) => {
    const project = getProject(project_definition);

    return project && Array.isArray(project.forms) ? project.forms : [];
};

export const getForm = (project_definition, form_index) => {
    return getForms(project_definition)[form_index] || null;
};

export const getInputs = (form) => {
    return form && Array.isArray(form.inputs) ? form.inputs : [];
};

export const findInput = (form, input_ref) => {
    if (!input_ref) {
        return null;
    }

    return getInputs(form).find((input) => {
        return input.ref === input_ref;
    }) || null;
};

export const getInputIndex = (form, input_ref) => {
    return getInputs(form).findIndex((input) => {
        return input.ref === input_ref;
    });
};

/*
 * `dom` is runtime-only state the legacy renderer attached to input objects;
 * it must never reach the server.
 */
export const serializeProject = (project_definition) => {
    return JSON.parse(JSON.stringify(project_definition, (key, value) => {
        return key === 'dom' ? undefined : value;
    }));
};
