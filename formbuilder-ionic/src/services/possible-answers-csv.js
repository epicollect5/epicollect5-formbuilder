'use strict';

import {
    createAnswer,
    getAnswerLimit,
    sanitizeAnswer
} from '@/models/possible-answers.js';

/*
 * CSV import / export for possible answers. The legacy builder used PapaParse
 * and a Bootstrap modal; this port keeps the same rules (pick a column, first
 * row may hold headers, replace or append) with a small RFC 4180 parser.
 */

function stripMarkup(value) {
    return String(value === undefined || value === null ? '' : value).replace(/<[^>]*>/g, ' ');
}

function plainQuestion(input) {
    return stripMarkup(input && input.question ? input.question : '').trim();
}

/* Accepts quoted fields, escaped quotes, commas and CRLF / LF row endings. */
export function parseCsv(text) {
    const source = String(text === undefined || text === null ? '' : text).replace(/^\ufeff/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    let index = 0;

    while (index < source.length) {
        const character = source[index];

        if (quoted) {
            if (character === '"') {
                if (source[index + 1] === '"') {
                    field += '"';
                    index += 2;
                    continue;
                }

                quoted = false;
                index += 1;
                continue;
            }

            field += character;
            index += 1;
            continue;
        }

        if (character === '"') {
            quoted = true;
            index += 1;
            continue;
        }

        if (character === ',') {
            row.push(field);
            field = '';
            index += 1;
            continue;
        }

        if (character === '\n' || character === '\r') {
            index += character === '\r' && source[index + 1] === '\n' ? 2 : 1;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
            continue;
        }

        field += character;
        index += 1;
    }

    row.push(field);
    rows.push(row);

    const filled = rows.filter(function (csv_row) {
        return csv_row.some(function (value) {
            return String(value).trim() !== '';
        });
    });
    const width = filled.reduce(function (max, csv_row) {
        return Math.max(max, csv_row.length);
    }, 0);

    return { rows: filled, width: width };
}

/* Column labels come from the header row when the file has one. */
export function getCsvColumns(parsed, has_headers) {
    const first_row = parsed && parsed.rows.length ? parsed.rows[0] : [];
    const columns = [];

    for (let index = 0; index < (parsed ? parsed.width : 0); index += 1) {
        const header = has_headers ? String(first_row[index] || '').trim() : '';

        columns.push({
            value: String(index),
            label: header || 'Column ' + (index + 1)
        });
    }

    return columns;
}

/*
 * Adds the selected column to the question. Answers are stripped of markup,
 * trimmed, skipped when empty and capped at the question's limit; `replace`
 * swaps the whole list, otherwise the imported rows are appended.
 */
export function importAnswers(input, parsed, options) {
    const settings = options || {};
    const column = Number(settings.column_index);
    const replace = settings.replace === true;
    const has_headers = settings.has_headers === true;

    if (!input || !parsed || !Number.isInteger(column) || column < 0) {
        return { ok: false, imported: 0, skipped: 0 };
    }

    const rows = has_headers ? parsed.rows.slice(1) : parsed.rows;
    const limit = getAnswerLimit(input.type);
    const answers = replace ? [] : (Array.isArray(input.possible_answers) ? input.possible_answers.slice() : []);
    let imported = 0;
    let skipped = 0;

    rows.forEach(function (csv_row) {
        if (csv_row[column] === undefined) {
            return;
        }

        const value = sanitizeAnswer(stripMarkup(csv_row[column]).trim());

        if (!value) {
            return;
        }

        if (answers.length >= limit) {
            skipped += 1;
            return;
        }

        answers.push(createAnswer(value));
        imported += 1;
    });

    if (answers.length === 0) {
        answers.push(createAnswer());
    }

    input.possible_answers = answers;

    if (replace) {
        input.default = null;
    }

    return { ok: imported > 0, imported: imported, skipped: skipped };
}

function quoteCsv(value) {
    const text = String(value === undefined || value === null ? '' : value);

    if (!/[",\r\n]/.test(text)) {
        return text;
    }

    return '"' + text.replace(/"/g, '""') + '"';
}

/* One column, headed by the question text — the shape the legacy export had. */
export function exportCsv(input) {
    const rows = [plainQuestion(input)].concat((input && input.possible_answers || []).map(function (answer) {
        return String(answer.answer || '');
    }));

    return rows.map(quoteCsv).join('\r\n');
}

export function getCsvFilename(input) {
    const name = plainQuestion(input).slice(0, 20).trim() || 'possible_answers';

    return name + '__possible_answers.csv';
}
