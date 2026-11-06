import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    IONIC_PREFIX,
    DEV_PROJECT_SAVE_PATH,
    landingMiddleware,
    projectSaveMiddleware,
    staticMiddleware
} from '@/../scripts/comparison-server.mjs';

function request_response(options) {
    const listeners = {};
    const chunks = [];
    let finished;
    const done = new Promise((resolve) => {
        finished = resolve;
    });
    const response = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            callback();
        }
    });

    response.status = null;
    response.headers = null;
    response.body = null;
    response.writeHead = (status, headers) => {
        response.status = status;
        response.headers = headers;
    };
    response.end = ((end) => (body) => {
        if (body !== undefined) {
            chunks.push(Buffer.isBuffer(body) ? body : Buffer.from(body));
        }

        response.body = Buffer.concat(chunks).toString('utf8');
        end.call(response);
        finished();
    })(response.end);
    const request = {
        method: options.method || 'GET',
        url: options.url,
        on(event, handler) {
            listeners[event] = handler;
        },
        emit(event, ...args) {
            listeners[event]?.(...args);
        }
    };

    return { done, request, response };
}

async function run(middleware, options) {
    const { done, request, response } = request_response(options);
    const next = vi.fn();

    const result = middleware(request, response, next);

    if (result && typeof result.then === 'function') {
        await result;
    }

    if (options.body !== undefined) {
        request.emit('data', Buffer.from(options.body));
        request.emit('end');

        await done;
    }

    return { next, response };
}

describe('comparison server middleware', () => {
    it('serves the landing page at the comparison root', async () => {
        for (const url of ['/', '/epicollect5-formbuilder', '/epicollect5-formbuilder/']) {
            const { next, response } = await run(landingMiddleware(), { url });

            expect(next).not.toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body).toContain('/epicollect5-formbuilder/ionic/');
            expect(response.body).toContain('/epicollect5-formbuilder/public/index.html');
        }
    });

    it('passes non-landing requests through', async () => {
        const { next } = await run(landingMiddleware(), { url: '/epicollect5-formbuilder/ionic/' });

        expect(next).toHaveBeenCalledTimes(1);
    });

    it('serves a static file with a no-store cache header', async () => {
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ionic-static-'));

        await fs.writeFile(path.join(directory, 'index.html'), '<h1>Ionic</h1>');

        const { next, response } = await run(staticMiddleware('/static/', directory), { url: '/static/' });

        expect(next).not.toHaveBeenCalled();
        expect(response.status).toBe(200);
        expect(response.headers['cache-control']).toBe('no-store');
    });

    it('returns 404 for a missing file and 403 for a path escape', async () => {
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ionic-static-'));

        const missing = await run(staticMiddleware('/static/', directory), { url: '/static/nope.html' });

        expect(missing.response.status).toBe(404);

        const escape = await run(staticMiddleware('/static/', directory), { url: '/static/../secret' });

        expect(escape.response.status).toBe(403);
    });

    it('ignores requests outside its prefix', async () => {
        const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'ionic-static-'));
        const { next } = await run(staticMiddleware('/static/', directory), { url: '/other/file.js' });

        expect(next).toHaveBeenCalledTimes(1);
    });

    describe('project save endpoint', () => {
        let repo_root;
        let project_file;

        beforeEach(async () => {
            repo_root = await fs.mkdtemp(path.join(os.tmpdir(), 'ionic-project-'));
            project_file = path.join(repo_root, 'project', 'project.json');

            await fs.mkdir(path.join(repo_root, 'project'), { recursive: true });
            await fs.writeFile(project_file, '{"data":{"ping":false}}\n');
        });

        afterEach(async () => {
            await fs.rm(repo_root, { recursive: true, force: true });
        });

        it('writes the posted definition to the shared project file', async () => {
            const { next, response } = await run(projectSaveMiddleware(repo_root), {
                method: 'POST',
                url: DEV_PROJECT_SAVE_PATH,
                body: '{"data":{"ping":true}}'
            });

            expect(next).not.toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(response.body).toBe('{"ok":true}');
            expect(JSON.parse(await fs.readFile(project_file, 'utf8'))).toEqual({ data: { ping: true } });
        });

        it('rejects an invalid payload without touching the file', async () => {
            const { response } = await run(projectSaveMiddleware(repo_root), {
                method: 'POST',
                url: DEV_PROJECT_SAVE_PATH,
                body: 'not json'
            });

            expect(response.status).toBe(400);
            expect(response.body).toBe('{"ok":false}');
            expect(await fs.readFile(project_file, 'utf8')).toBe('{"data":{"ping":false}}\n');
        });

        it('passes other requests through', async () => {
            const { next } = await run(projectSaveMiddleware(repo_root), {
                method: 'GET',
                url: DEV_PROJECT_SAVE_PATH
            });

            expect(next).toHaveBeenCalledTimes(1);
        });
    });

    it('keeps the ionicon svg prefix distinct from the ionic app prefix', () => {
        expect(IONIC_PREFIX + 'vendor/ionicons/svg/').toBe('/epicollect5-formbuilder/ionic/vendor/ionicons/svg/');
    });
});
