import { describe, expect, it } from 'vitest';
import { decodeProjectPayload, getProjectUrl, loadProject } from '@/services/project-source.js';

describe('project source', () => {
    it('resolves the shared project file from the Ionic entry', () => {
        expect(getProjectUrl('http://localhost/epicollect5-formbuilder/ionic/'))
            .toBe('http://localhost/epicollect5-formbuilder/project/project.json');
    });

    it('decodes a plain JSON payload', async () => {
        const payload = await decodeProjectPayload('{"data":{"project":{"name":"Test"}}}');

        expect(payload.data.project.name).toBe('Test');
    });

    it('rejects an empty payload', async () => {
        await expect(decodeProjectPayload('   ')).rejects.toThrow('The project payload is empty');
    });

    it('loads the definition through fetch', async () => {
        const requested = [];
        const fetcher = async function (url) {
            requested.push(url);

            return {
                ok: true,
                status: 200,
                text: async () => '{'
            };
        };

        await expect(loadProject('http://localhost/epicollect5-formbuilder/ionic/', fetcher)).rejects.toThrow();

        expect(requested[0]).toContain('/epicollect5-formbuilder/project/project.json?');
    });

    it('surfaces an HTTP failure', async () => {
        const fetcher = async function () {
            return { ok: false, status: 500, text: async () => '' };
        };

        await expect(loadProject('http://localhost/epicollect5-formbuilder/ionic/', fetcher))
            .rejects.toThrow('HTTP 500');
    });
});
