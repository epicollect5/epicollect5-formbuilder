import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';

export const COMPARISON_BASE = '/epicollect5-formbuilder';
export const IONIC_PREFIX = COMPARISON_BASE + '/ionic/';
export const PUBLIC_PREFIX = COMPARISON_BASE + '/public/';
export const PROJECT_PREFIX = COMPARISON_BASE + '/project/';
export const DEV_PROJECT_SAVE_PATH = COMPARISON_BASE + '/project/project.json';

const mime_types = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

export function resolveWithin(directory, relative_path) {
    const resolved = path.resolve(directory, '.' + path.sep + relative_path);
    const base = path.resolve(directory);

    if (resolved !== base && !resolved.startsWith(base + path.sep)) {
        return null;
    }

    return resolved;
}

export function landingPage() {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Formbuilder — Ionic prototype comparison</title>
<style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 40px; background: #f6f5f8; color: #1f1b24; }
    main { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 18px; padding: 32px; box-shadow: 0 12px 34px rgba(28,18,40,.08); }
    h1 { margin-top: 0; color: #673b91; }
    a { color: #673b91; }
    ul { line-height: 2; }
    code { background: #f6f5f8; border-radius: 5px; padding: 2px 6px; }
</style>
</head>
<body>
<main>
    <h1>Formbuilder comparison</h1>
    <p>Both entries read <code>project/project.json</code> from this origin and share the same session.</p>
    <ul>
        <li><a href="/epicollect5-formbuilder/ionic/">Ionic prototype</a></li>
        <li><a href="/epicollect5-formbuilder/public/index.html">Legacy baseline</a></li>
    </ul>
</main>
</body>
</html>`;
}

export function landingMiddleware() {
    return (request, response, next) => {
        const pathname = decodeURIComponent(String(request.url || '').split('?')[0]);

        if (request.method !== 'GET' || (pathname !== '/' && pathname !== COMPARISON_BASE && pathname !== COMPARISON_BASE + '/')) {
            next();
            return;
        }

        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end(landingPage());
    };
}

export function projectSaveMiddleware(repo_root) {
    return (request, response, next) => {
        const pathname = decodeURIComponent(String(request.url || '').split('?')[0]);

        // Local development save: write the project definition back to the
        // file both comparison entries read, if the request came from the
        // local comparison server.
        if (request.method !== 'POST' || pathname !== DEV_PROJECT_SAVE_PATH) {
            next();
            return;
        }

        const chunks = [];

        request.on('data', (chunk) => {
            chunks.push(chunk);
        });

        request.on('end', async () => {
            try {
                const project = JSON.parse(Buffer.concat(chunks).toString('utf8'));

                await fs.writeFile(
                    path.join(repo_root, 'project', 'project.json'),
                    JSON.stringify(project, null, 2) + '\n'
                );

                response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
                response.end('{"ok":true}');
            }
            catch (error) {
                response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
                response.end('{"ok":false}');
            }
        });
    };
}

export function staticMiddleware(prefix, directory) {
    return async (request, response, next) => {
        if ((request.method !== 'GET' && request.method !== 'HEAD') || !String(request.url || '').startsWith(prefix)) {
            next();
            return;
        }

        try {
            let relative_path = decodeURIComponent(String(request.url).split('?')[0].slice(prefix.length));

            if (!relative_path || relative_path.endsWith('/')) {
                relative_path += 'index.html';
            }

            const file = resolveWithin(directory, relative_path);

            if (!file) {
                response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
                response.end('Forbidden');
                return;
            }

            let target = file;

            try {
                const stat = await fs.stat(target);

                if (stat.isDirectory()) {
                    target = path.join(target, 'index.html');
                    await fs.stat(target);
                }
            }
            catch (error) {
                response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
                response.end('Not found');
                return;
            }

            response.writeHead(200, {
                'content-type': mime_types[path.extname(target)] || 'application/octet-stream',
                'cache-control': 'no-store'
            });

            if (request.method === 'HEAD') {
                response.end();
                return;
            }

            createReadStream(target).pipe(response);
        }
        catch (error) {
            next(error);
        }
    };
}
