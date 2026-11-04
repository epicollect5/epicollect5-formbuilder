#!/usr/bin/env node
'use strict';

import * as esbuild from 'esbuild';
import * as sass from 'sass';
import fs from 'node:fs/promises';
import { createReadStream, watch } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(root, '..');
const dist = path.join(root, 'dist');
const args = new Set(process.argv.slice(2));
const is_watch = args.has('--watch');
const is_serve = args.has('--serve');
const port = 5183;

const alias = {
    '@': path.join(root, 'src')
};

const esbuild_common = {
    bundle: true,
    format: 'iife',
    target: ['es2019'],
    alias: alias,
    define: {
        'process.env.NODE_ENV': '"development"'
    },
    legalComments: 'none',
    logLevel: 'silent'
};

const vendor_scripts = [
    ['jquery/dist/jquery.min.js', 'vendor/jquery.min.js'],
    ['jquery-ui/dist/jquery-ui.min.js', 'vendor/jquery-ui.min.js']
];
const vendor_css = ['summernote.css'];

function log(message) {
    console.log('[formbuilder-ionic] ' + message);
}

async function buildScriptsOnce() {
    await esbuild.build({
        ...esbuild_common,
        entryPoints: { 'formbuilder-ionic': path.join(root, 'src/app.js') },
        outdir: path.join(dist, 'js'),
        sourcemap: true
    });
}

async function createScriptContexts() {
    const app = await esbuild.context({
        ...esbuild_common,
        entryPoints: { 'formbuilder-ionic': path.join(root, 'src/app.js') },
        outdir: path.join(dist, 'js'),
        sourcemap: true
    });

    await app.watch();

    return [app];
}

async function buildStyles() {
    const result = sass.compile(path.join(root, 'src/theme/ionic-formbuilder.scss'), {
        style: 'expanded',
        loadPaths: [path.join(root, 'src/theme')],
        quietDeps: true
    });

    await fs.mkdir(path.join(dist, 'css'), { recursive: true });
    await fs.writeFile(path.join(dist, 'css/ionic-formbuilder.css'), result.css);
}

async function copyVendorScripts() {
    await fs.mkdir(path.join(dist, 'vendor'), { recursive: true });

    for (const script of vendor_scripts) {
        await fs.copyFile(
            path.join(root, 'node_modules', script[0]),
            path.join(dist, script[1])
        );
    }
}

async function copyStaticAssets() {
    await fs.copyFile(path.join(root, 'src/index.html'), path.join(dist, 'index.html'));

    await fs.cp(path.join(repo, 'public/favicons'), path.join(dist, 'favicons'), { recursive: true });

    await fs.mkdir(path.join(dist, 'vendor/ionic/css'), { recursive: true });
    await fs.copyFile(
        path.join(root, 'node_modules/@ionic/core/css/ionic.bundle.css'),
        path.join(dist, 'vendor/ionic/css/ionic.bundle.css')
    );

    await fs.mkdir(path.join(dist, 'vendor/css'), { recursive: true });

    for (const file of vendor_css) {
        await fs.copyFile(
            path.join(repo, 'css/vendor', file),
            path.join(dist, 'vendor/css', file)
        );
    }

    const icons_source = path.join(root, 'node_modules/ionicons/dist/ionicons/svg');
    const icons_target = path.join(dist, 'vendor/ionicons/svg');

    try {
        await fs.access(icons_target);
    }
    catch (error) {
        await fs.mkdir(path.dirname(icons_target), { recursive: true });
        await fs.cp(icons_source, icons_target, { recursive: true });
    }
}

async function buildAll() {
    await fs.rm(dist, { recursive: true, force: true });
    await fs.mkdir(dist, { recursive: true });

    await buildScriptsOnce();
    await buildStyles();
    await copyVendorScripts();
    await copyStaticAssets();

    log('built dist/');
}

async function refreshAssets() {
    await buildStyles();
    await copyVendorScripts();
    await copyStaticAssets();
    log('refreshed styles and static assets');
}

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

function resolveWithin(directory, relative_path) {
    const resolved = path.resolve(directory, '.' + path.sep + relative_path);
    const base = path.resolve(directory);

    if (resolved !== base && !resolved.startsWith(base + path.sep)) {
        return null;
    }

    return resolved;
}

function landingPage() {
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

function startServer() {
    const mounts = [
        { prefix: '/epicollect5-formbuilder/ionic/', directory: dist },
        { prefix: '/epicollect5-formbuilder/project/', directory: path.join(repo, 'project') },
        { prefix: '/epicollect5-formbuilder/public/', directory: path.join(repo, 'public') }
    ];

    const server = http.createServer(async function (request, response) {
        const url = new URL(request.url, 'http://localhost');
        const pathname = decodeURIComponent(url.pathname);

        if (pathname === '/' || pathname === '/epicollect5-formbuilder' || pathname === '/epicollect5-formbuilder/') {
            response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
            response.end(landingPage());
            return;
        }

        const mount = mounts.find((item) => pathname.startsWith(item.prefix));

        if (!mount) {
            response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
            response.end('Not found');
            return;
        }

        let relative_path = pathname.slice(mount.prefix.length);

        if (!relative_path || relative_path.endsWith('/')) {
            relative_path += 'index.html';
        }

        let file = resolveWithin(mount.directory, relative_path);

        if (!file) {
            response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
            response.end('Forbidden');
            return;
        }

        try {
            const stat = await fs.stat(file);

            if (stat.isDirectory()) {
                file = path.join(file, 'index.html');
            }
        }
        catch (error) {
            response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
            response.end('Not found');
            return;
        }

        response.writeHead(200, {
            'content-type': mime_types[path.extname(file)] || 'application/octet-stream',
            'cache-control': 'no-store'
        });

        createReadStream(file).pipe(response);
    });

    server.listen(port, '127.0.0.1', function () {
        log('comparison server on http://localhost:' + port + '/epicollect5-formbuilder/');
    });

    return server;
}

function watchSources(onChange) {
    const directories = [
        path.join(root, 'src'),
        path.join(repo, 'css/vendor')
    ];

    let timer = null;

    for (const directory of directories) {
        try {
            watch(directory, { recursive: true }, function () {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    Promise.resolve(onChange()).catch(function (error) {
                        console.error('[formbuilder-ionic] refresh failed', error);
                    });
                }, 150);
            });
        }
        catch (error) {
            console.warn('[formbuilder-ionic] cannot watch ' + directory);
        }
    }
}

async function main() {
    if (!is_watch) {
        await buildAll();

        if (is_serve) {
            startServer();
        }

        return;
    }

    await fs.rm(dist, { recursive: true, force: true });
    await fs.mkdir(dist, { recursive: true });
    await buildStyles();
    await buildVendorBundle();
    await copyStaticAssets();

    const contexts = await createScriptContexts();

    log('watching sources');

    watchSources(refreshAssets);

    if (is_serve) {
        startServer();
    }

    const shutdown = async function () {
        await Promise.all(contexts.map((context) => context.dispose()));
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch(function (error) {
    console.error('[formbuilder-ionic] build failed');
    console.error(error);
    process.exit(1);
});
