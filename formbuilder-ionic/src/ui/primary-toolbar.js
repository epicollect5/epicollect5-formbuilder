'use strict';

import {PARAMETERS} from '@/config/parameters.js';
import {getForms, getProject} from '@/models/project-definition.js';
import {goBack} from '@/services/navigation.js';
import {getSession} from '@/services/session.js';
import {
    performSave,
    performUndo,
    updateSaveButton,
    updateUndoButton,
    openFormNameModal
} from '@/ui/shell.js';

export const renderProjectName = () => {
    const project = getProject(getSession().project_definition);
    const title = document.querySelector('ion-title #project-name, ion-title') || document.getElementById('project-name');
    const name = document.getElementById('project-name');
    const logo = document.getElementById('project-logo');

    if (name) {
        name.textContent = project ? project.name : '';
    } else if (title && title.tagName && title.tagName.toLowerCase() === 'ion-title') {
        title.textContent = project ? project.name : '';
    }

    if (logo) {
        logo.src = getProjectLogoUrl(project);
    }
};

/* Same source as the legacy navbar: the project logo, else the media endpoint. */
const getProjectLogoUrl = (project) => {
    if (!project) {
        return '';
    }

    if (project.logo_url) {
        return project.logo_url;
    }

    const protocol = window.location.protocol;
    const parts = window.location.href.split('?')[0].split('#')[0].replace(protocol + '//', '').split('/');

    parts.pop();

    return `${protocol}//${parts.join('/')}/api/internal/media/${project.slug}` +
        '?type=photo&name=logo.jpg&format=project_mobile_logo';
};

export const revealBuilder = () => {
    const loader = document.querySelector('.loader');
    const builder = document.getElementById('builder');

    if (loader) {
        loader.remove();
    }

    if (builder) {
        builder.hidden = false;
    }
};

/* Chrome controls are static, so assigning handlers keeps re-renders from
   stacking duplicate listeners. */
export const bindPrimaryToolbar = () => {
    document.querySelectorAll('[data-action="back"], [data-action="exit"]').forEach((control) => {
        control.onclick = () => {
            goBack();
        };
    });

    const undo_button = document.getElementById('undo');

    if (undo_button) {
        undo_button.onclick = () => {
            performUndo();
        };
    }

    const save_button = document.getElementById('save');

    if (save_button) {
        save_button.onclick = () => {
            performSave().catch((error) => {
                console.error('[formbuilder-ionic] unexpected save error', error);
            });
        };
    }

    const add_form = document.getElementById('add-form');
    const forms = getForms(getSession().project_definition);
    const at_form_cap = forms.length >= PARAMETERS.MAX_FORMS;

    if (add_form) {
        add_form.disabled = at_form_cap;
        add_form.title = at_form_cap ? `A project can have at most ${PARAMETERS.MAX_FORMS} forms` : 'Add form';
        add_form.onclick = () => {
            if (at_form_cap) {
                return;
            }

            // The legacy flow asks for the new form's name before adding it.
            openFormNameModal(null);
        };
    }

    updateUndoButton();
    updateSaveButton();
};
