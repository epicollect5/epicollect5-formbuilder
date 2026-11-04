'use strict';

/*
 * Port of the legacy "back to project" navigation: the formbuilder runs either
 * under a project slug (Laravel) or as the standalone comparison build, and in
 * both cases the project page sits one level above the entry point.
 */
export function getBackUrl(href) {
    const location_href = href || window.location.href;
    const without_query = location_href.split('?')[0].split('#')[0];
    const scheme = without_query.match(/^[a-z][a-z0-9+.-]*:\/\//i);
    const prefix = scheme ? scheme[0] : '';
    const parts = (scheme ? without_query.slice(prefix.length) : without_query).split('/');

    while (parts.length && parts[parts.length - 1] === '') {
        parts.pop();
    }

    parts.pop();

    return prefix + parts.join('/');
}

export function goBack(href) {
    window.location.replace(getBackUrl(href));
}
