'use strict';

import { version } from '../../package.json';

/*
    Rollbar exception reporting, mirroring the mobile app setup: uncaught
    errors, unhandled promise rejections and Vue component errors are the only
    sources we report, so the browser SDK captures globals once it loads and
    the Vue entry forwards what its own errorHandler swallows.

    Reporting is production-only. The SDK loads through a guarded dynamic
    import: content blockers (uBlock and similar) reject any script URL whose
    path contains "rollbar", and a static import would take the whole module
    graph down with it. If the load or the setup fails for any reason,
    reporting silently stays off and the builder keeps working on the no-op
    instance below. The token is a post_client_item token, which Rollbar
    expects to ship with browser code.
 */
const noOp = () => {};

export const rollbar = {
    error: noOp,
    warning: noOp,
    info: noOp,
    debug: noOp,
    critical: noOp,
    log: noOp
};

if (import.meta.env.PROD) {
    import('rollbar')
        .then(({ default: Rollbar }) => {
            const instance = new Rollbar({
                accessToken: import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN,
                enabled: Boolean(import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN),
                environment: import.meta.env.MODE,
                captureUncaught: true,
                captureUnhandledRejections: true,
                captureIp: false,
                payload: {
                    client: {
                        javascript: {
                            // the same version the release skill bumps in
                            // package.json, so payloads group under the
                            // release they came from
                            code_version: version
                        }
                    }
                }
            });

            // callers keep the exported object, so the real SDK methods are
            // swapped in place once it has loaded
            Object.keys(rollbar).forEach((level) => {
                rollbar[level] = (...args) => instance[level](...args);
            });
        })
        .catch(() => {
            // blocked or failed to load: reporting stays off, the app runs on
        });
}
