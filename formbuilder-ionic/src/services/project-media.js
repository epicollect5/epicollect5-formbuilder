'use strict';

/*
 * Same source as the legacy navbar: the project logo, else the media endpoint.
 * Moved out of ui/primary-toolbar.js so the Vue app shares it without
 * importing the vanilla render layer. The optional base_url lets the Vue entry
 * (one level deeper than the vanilla page) derive the endpoint from the Ionic
 * app root instead of its own page location.
 */
export const getProjectLogoUrl = (project, base_url) => {
    if (!project) {
        return '';
    }

    if (project.logo_url) {
        return project.logo_url;
    }

    const page_url = base_url || document.baseURI;
    const protocol = new URL(page_url).protocol;
    const parts = page_url.split('?')[0].split('#')[0].replace(protocol + '//', '').split('/');

    parts.pop();

    return `${protocol}//${parts.join('/')}/api/internal/media/${project.slug}` +
        '?type=photo&name=logo.jpg&format=project_mobile_logo';
};
