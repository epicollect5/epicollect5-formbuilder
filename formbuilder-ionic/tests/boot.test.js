import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/ionic-runtime.js', () => ({
    setupIonic: vi.fn()
}));

import { bootFormbuilder } from '@/app.js';
import { getSession } from '@/services/session.js';
import { setupIonic } from '@/services/ionic-runtime.js';

function build_markup() {
    document.body.innerHTML = [
        '<ion-toolbar><ion-buttons slot="start"><ion-button data-action="back">Back</ion-button></ion-buttons><ion-title><img id="project-logo" alt=""><span id="project-name"></span></ion-title><ion-buttons slot="end"><ion-button data-action="exit">Exit</ion-button></ion-buttons></ion-toolbar>',
        '<section id="tools"></section>',
        '<nav id="form-tabs" role="tablist"><ion-segment class="builder__forms-segment" value="0" scrollable="true"></ion-segment></nav>',
        '<button type="button" id="add-form">Add Form</button>',
        '<button type="button" id="undo" disabled>Undo</button>',
        '<button type="button" id="save" disabled>Save project</button>',
        '<section id="questions"></section>',
        '<section id="properties"></section>'
    ].join('');
}

function project_definition() {
    return {
        data: {
            project: {
                name: 'Boot test',
                slug: 'boot-test',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Screening form',
                        slug: 'screening-form',
                        type: 'hierarchy',
                        inputs: [
                            {
                                ref: 'form_1_input_1',
                                type: 'text',
                                question: 'Your name',
                                is_title: false,
                                is_required: false,
                                uniqueness: 'none',
                                regex: null,
                                default: null,
                                verify: false,
                                max: null,
                                min: null,
                                datetime_format: null,
                                set_to_current_datetime: false,
                                possible_answers: [],
                                jumps: [],
                                branch: [],
                                group: []
                            }
                        ]
                    }
                ]
            }
        }
    };
}

function payload_response(project) {
    return {
        ok: true,
        text: async () => JSON.stringify(project)
    };
}

describe('formbuilder boot', () => {
    beforeEach(() => {
        build_markup();
        vi.clearAllMocks();
    });

    it('loads the shared project and renders the shell', async () => {
        const project = project_definition();
        const fetch_project = vi.fn().mockResolvedValue(payload_response(project));

        const loaded = await bootFormbuilder({
            base_url: 'https://example.test/project/formbuilder',
            fetch_project
        });

        expect(loaded).toStrictEqual(project);
        expect(setupIonic).toHaveBeenCalledTimes(1);
        expect(fetch_project).toHaveBeenCalledTimes(1);

        const [url, init] = fetch_project.mock.calls[0];

        expect(url).toContain('project/project.json');
        expect(url).toContain('?');
        expect(init.credentials).toBe('same-origin');
        expect(init.headers.accept).toBe('application/json');

        expect(getSession().project_definition).toStrictEqual(project);
        expect(document.getElementById('project-name').textContent).toBe('Boot test');
        expect(document.querySelectorAll('#form-tabs .builder__form-tab')).toHaveLength(1);
        expect(document.querySelectorAll('#questions .builder__question')).toHaveLength(1);
    });

    it('rejects when the project endpoint fails', async () => {
        const fetch_project = vi.fn().mockResolvedValue({ ok: false, status: 503 });

        await expect(bootFormbuilder({ fetch_project })).rejects.toThrow('HTTP 503');
        expect(document.getElementById('project-name').textContent).toBe('');
    });
});
