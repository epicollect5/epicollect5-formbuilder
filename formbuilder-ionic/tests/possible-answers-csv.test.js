import { describe, expect, it } from 'vitest';
import { MAX_ANSWERS } from '@/models/possible-answers.js';
import {
    exportCsv,
    getCsvColumns,
    getCsvFilename,
    importAnswers,
    parseCsv
} from '@/services/possible-answers-csv.js';

function create_input(overrides) {
    return Object.assign({
        ref: 'form_1_input_1',
        type: 'radio',
        question: 'Pick one',
        default: 'answer_2',
        possible_answers: [
            { answer: 'Yes', answer_ref: 'answer_1' },
            { answer: 'No', answer_ref: 'answer_2' }
        ]
    }, overrides || {});
}

describe('possible answers CSV', () => {
    it('parses quoted fields, escaped quotes and both row endings', () => {
        const parsed = parseCsv('name,answer\r\n"Smith, John","Yes"\r\n"say ""hi""",No\r\n\r\n');

        expect(parsed.width).toBe(2);
        expect(parsed.rows).toEqual([
            ['name', 'answer'],
            ['Smith, John', 'Yes'],
            ['say "hi"', 'No']
        ]);
    });

    it('drops blank lines and a byte order mark', () => {
        const parsed = parseCsv('\ufeffYes\n\nNo\n   \n');

        expect(parsed.rows).toEqual([['Yes'], ['No']]);
        expect(parsed.width).toBe(1);
    });

    it('labels columns from the header row or by position', () => {
        const parsed = parseCsv('name,answer\nA,B');

        expect(getCsvColumns(parsed, true).map((column) => column.label)).toEqual(['name', 'answer']);
        expect(getCsvColumns(parsed, false).map((column) => column.label)).toEqual(['Column 1', 'Column 2']);
        expect(getCsvColumns(parsed, true)[0].value).toBe('0');
    });

    it('replaces the answers with the chosen column', () => {
        const input = create_input();
        const parsed = parseCsv('name,answer\nA,<b>Maybe</b>\nB,   \nC,Yes\n');
        const result = importAnswers(input, parsed, {
            column_index: '1',
            has_headers: true,
            replace: true
        });

        expect(result).toEqual({ ok: true, imported: 2, skipped: 0 });
        expect(input.possible_answers.map((answer) => answer.answer)).toEqual(['Maybe', 'Yes']);
        expect(input.default).toBeNull();
        expect(input.possible_answers[0].answer_ref).toMatch(/^[0-9a-f]{13}$/);
    });

    it('appends the chosen column and keeps the existing answers', () => {
        const input = create_input();
        const parsed = parseCsv('Yes\nNo');
        const result = importAnswers(input, parsed, { column_index: 0, replace: false });

        expect(result).toEqual({ ok: true, imported: 2, skipped: 0 });
        expect(input.possible_answers.map((answer) => answer.answer)).toEqual(['Yes', 'No', 'Yes', 'No']);
        expect(input.possible_answers[0].answer_ref).toBe('answer_1');
        expect(input.default).toBe('answer_2');
    });

    it('treats the first row as data when there are no headers', () => {
        const input = create_input({ possible_answers: [] });
        const parsed = parseCsv('Yes\nNo');
        const result = importAnswers(input, parsed, { column_index: 0, has_headers: false });

        expect(result.imported).toBe(2);
        expect(input.possible_answers.map((answer) => answer.answer)).toEqual(['Yes', 'No']);
    });

    it('truncates long answers and stops at the question limit', () => {
        const answers = Array.from({ length: MAX_ANSWERS - 1 }, function (value, index) {
            return { answer: 'Answer ' + index, answer_ref: 'answer_' + index };
        });
        const input = create_input({ possible_answers: answers });
        const parsed = parseCsv('a\nb\nc');
        const result = importAnswers(input, parsed, { column_index: 0, replace: false });

        expect(result.imported).toBe(1);
        expect(result.skipped).toBe(2);
        expect(input.possible_answers).toHaveLength(MAX_ANSWERS);

        const long = create_input({ possible_answers: [] });
        importAnswers(long, parseCsv('x'.repeat(300)), { column_index: 0 });
        expect(long.possible_answers[0].answer).toHaveLength(250);
    });

    it('keeps one placeholder when a replace import has no usable rows', () => {
        const input = create_input();
        const result = importAnswers(input, parseCsv(' , \n , '), { column_index: 0, replace: true });

        expect(result.ok).toBe(false);
        expect(input.possible_answers).toHaveLength(1);
        expect(input.possible_answers[0].answer).toBe('I am a placeholder answer');
        expect(input.default).toBeNull();
    });

    it('refuses a missing column or file', () => {
        expect(importAnswers(create_input(), parseCsv('Yes'), { column_index: -1 })).toEqual({
            ok: false,
            imported: 0,
            skipped: 0
        });
        expect(importAnswers(create_input(), null, { column_index: 0 }).ok).toBe(false);
    });

    it('exports the question as the header and quotes when needed', () => {
        const input = create_input({
            possible_answers: [
                { answer: 'Yes', answer_ref: 'answer_1' },
                { answer: 'No, thanks', answer_ref: 'answer_2' },
                { answer: 'say "hi"', answer_ref: 'answer_3' }
            ]
        });

        expect(exportCsv(input)).toBe('Pick one\r\nYes\r\n"No, thanks"\r\n"say ""hi"""');
    });

    it('strips markup from the exported header', () => {
        expect(exportCsv(create_input({ question: '<p>Pick one</p>' }))).toContain('Pick one');
    });

    it('builds the filename from the question text', () => {
        expect(getCsvFilename(create_input())).toBe('Pick one__possible_answers.csv');
        expect(getCsvFilename({ question: 'A very long question text here' }))
            .toBe('A very long question__possible_answers.csv');
        expect(getCsvFilename({ question: '   ' })).toBe('possible_answers__possible_answers.csv');
    });
});
