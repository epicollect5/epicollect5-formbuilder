'use strict';

import { setupIonic } from '@/services/ionic-runtime.js';
import { loadProject } from '@/services/project-source.js';
import { setProject } from '@/services/session.js';
import { renderApp } from '@/ui/shell.js';

/*
 * Boot the native builder: Ionic components first, then the shared project
 * definition, then the shell. Every render reads the definition; no view keeps
 * its own copy of the data.
 */
export async function bootFormbuilder(options) {
    const settings = options || {};

    setupIonic();

    const project_definition = await loadProject(settings.base_url, settings.fetch_project);

    setProject(project_definition);
    renderApp(settings.handlers || {});

    return project_definition;
}
