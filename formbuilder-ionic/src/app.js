'use strict';

import './jquery.js';
import 'jquery-ui/dist/jquery-ui.min.js';

import { setupIonic } from '@/services/ionic-runtime.js';
import { loadProject } from '@/services/project-source.js';
import { setProject } from '@/services/session.js';
import { renderApp } from '@/ui/shell.js';

/*
    Boot the native builder: Ionic components first, then the shared project
    definition, then the shell. Every render reads the definition; no view keeps
    its own copy of the data.
 */
export const bootFormbuilder = async (options) => {
    const settings = options || {};

    setupIonic();

    const project_definition = await loadProject(settings.base_url, settings.fetch_project);

    setProject(project_definition);
    renderApp(settings.handlers || {});

    return project_definition;
};

/*
    Boot only where the shell's loader exists: the boot tests import this
    module for the exported function and drive it with injected inputs.
 */
if (document.querySelector('.loader')) {
    bootFormbuilder().catch((error) => {
        console.error('[formbuilder-ionic] boot failed', error);

        const loader = document.querySelector('.loader');

        if (loader) {
            loader.replaceChildren();
            const message = document.createElement('div');
            message.textContent = 'The formbuilder could not be loaded.';
            loader.append(message);
        }
    });
}
