import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getForms } from '@/models/project-definition.js';
import { selectForm, setProject } from '@/services/session.js';
import { renderApp } from '@/ui/shell.js';
import { readCsvRows } from './stream-csv.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const package_root = path.resolve(here, '..');
const csv_path = process.env.AUDIT_CSV
    ? path.resolve(process.env.AUDIT_CSV)
    : path.join(package_root, 'legacy_projects.csv');
const report_path = process.env.AUDIT_REPORT
    ? path.resolve(process.env.AUDIT_REPORT)
    : path.join(package_root, 'legacy-projects-audit.jsonl');
const limit = Number(process.env.AUDIT_LIMIT || 0);

/* The same shell the app boots into. Rebuilt for every project so a failed
   render cannot leave DOM state behind for the next one. */
const build_markup = () => {
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
};

/* The export stores the API payload (`{id, type, project}`), while the app's
   project source exposes it under `data`; accept both shapes. */
const normalizeProjectDefinition = (parsed) => {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
    }

    if (parsed.data && typeof parsed.data === 'object' && parsed.data.project) {
        return parsed;
    }

    if (parsed.project && typeof parsed.project === 'object') {
        return { data: parsed };
    }

    return null;
};

const errorDetails = (error) => {
    const message = error && error.message ? String(error.message) : String(error);
    const stack = error && error.stack ? String(error.stack).split('\n').slice(0, 8).join('\n') : null;

    return { message, stack };
};

describe('legacy project load audit', () => {
    it('streams and loads every row without throwing', async () => {
        if (!fs.existsSync(csv_path)) {
            throw new Error(`Audit CSV not found: ${csv_path}`);
        }

        const report = fs.createWriteStream(report_path, { flags: 'w' });
        let report_error = null;

        report.on('error', (error) => {
            report_error = error;
        });

        const by_phase = new Map();
        const examples = [];
        let total = 0;
        let failures = 0;
        let header_checked = false;
        let last_log = Date.now();
        const started = last_log;

        const write_failure = async (record) => {
            failures += 1;
            by_phase.set(record.phase, (by_phase.get(record.phase) || 0) + 1);

            if (examples.length < 20) {
                examples.push(record);
            }

            if (report_error) {
                throw report_error;
            }

            if (!report.write(`${JSON.stringify(record)}\n`)) {
                await once(report, 'drain');
            }
        };

        try {
            const stream = fs.createReadStream(csv_path, {
                encoding: 'utf8',
                highWaterMark: 1024 * 1024
            });

            for await (const row of readCsvRows(stream)) {
                if (!header_checked) {
                    const header = row.map((value) => value.replace(/^\uFEFF/, '').trim());

                    if (header.length !== 2 || header[0] !== 'slug' || header[1] !== 'project_definition') {
                        throw new Error(`Unexpected CSV header: ${JSON.stringify(row)}`);
                    }

                    header_checked = true;
                    continue;
                }

                if (limit > 0 && total >= limit) {
                    break;
                }

                total += 1;
                const slug = row[0] || '';
                const record = { index: total, slug };

                if (row.length !== 2) {
                    await write_failure({
                        ...record,
                        phase: 'csv-columns',
                        error: `Expected 2 columns, found ${row.length}`
                    });
                    continue;
                }

                let parsed;

                try {
                    parsed = JSON.parse(row[1]);
                } catch (error) {
                    await write_failure({
                        ...record,
                        phase: 'json-parse',
                        error: errorDetails(error).message,
                        stack: errorDetails(error).stack
                    });
                    continue;
                }

                const project_definition = normalizeProjectDefinition(parsed);

                if (!project_definition) {
                    await write_failure({
                        ...record,
                        phase: 'project-shape',
                        error: 'Expected an API payload with a project object, or a project definition with data.project'
                    });
                    continue;
                }

                if (!Array.isArray(project_definition.data.project.forms)) {
                    await write_failure({
                        ...record,
                        phase: 'project-shape',
                        error: 'project.forms is not an array'
                    });
                    continue;
                }

                build_markup();

                let form_index = 0;

                try {
                    setProject(project_definition);
                    renderApp();

                    const forms = getForms(project_definition);

                    // The first render validates every form in the tab strip;
                    // render each one as well to exercise its question list.
                    for (form_index = 1; form_index < forms.length; form_index += 1) {
                        selectForm(form_index);
                        renderApp();
                    }
                } catch (error) {
                    const details = errorDetails(error);

                    await write_failure({
                        ...record,
                        phase: form_index === 0 ? 'initial-render' : `form-render:${form_index}`,
                        error: details.message,
                        stack: details.stack
                    });
                }

                const now = Date.now();

                if (total % 1000 === 0 || now - last_log >= 15000) {
                    const elapsed = (now - started) / 1000;
                    const rate = elapsed > 0 ? (total / elapsed).toFixed(1) : '0';

                    console.log(`[audit] ${total.toLocaleString()} projects, ${failures.toLocaleString()} failures, ${rate}/s`);

                    last_log = now;
                }
            }

            if (!header_checked) {
                throw new Error('The audit CSV is empty');
            }
        } finally {
            await new Promise((resolve, reject) => {
                report.end((error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        }

        const elapsed = (Date.now() - started) / 1000;
        const rate = elapsed > 0 ? (total / elapsed).toFixed(1) : '0';

        console.log(`[audit] complete: ${total.toLocaleString()} projects in ${elapsed.toFixed(1)}s (${rate}/s), ${failures.toLocaleString()} failures`);
        console.log(`[audit] report: ${report_path}`);

        if (by_phase.size) {
            console.log('[audit] failures by phase:', Object.fromEntries(by_phase));
        }

        examples.forEach((example) => {
            console.log(`[audit] failure ${example.index} ${JSON.stringify(example.slug)} (${example.phase}): ${example.error}`);
        });

        expect(failures).toBe(0);
    });
});
