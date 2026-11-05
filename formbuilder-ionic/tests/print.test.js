import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildPrintHtml, printForm } from '@/ui/print.js';

function text_input(overrides) {
    return Object.assign({
        ref: 'input_1',
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
    }, overrides || {});
}

function project_definition(inputs) {
    return {
        data: {
            project: {
                name: 'Field survey',
                slug: 'field-survey',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Screening form',
                        slug: 'screening-form',
                        type: 'hierarchy',
                        inputs
                    }
                ]
            }
        }
    };
}

afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
});

describe('print preview', () => {
    it('writes the project, form and open questions', () => {
        const html = buildPrintHtml(project_definition([
            text_input()
        ]), 0);

        expect(html).toContain('<h2>Field survey</h2>');
        expect(html).toContain('<h3>Screening form</h3>');
        expect(html).toContain('<h4 class="question">Your name</h4>');
        expect(html).toContain('<table border="1" width="100%"><tr><td></td></tr></table>');
    });

    it('renders choice answers as inputs and readme as plain text', () => {
        const radio = text_input({
            ref: 'input_2',
            type: 'radio',
            question: 'Pick one',
            possible_answers: [
                { answer: 'Yes', answer_ref: 'a'.repeat(13) },
                { answer: 'No', answer_ref: 'b'.repeat(13) }
            ]
        });
        const readme = text_input({
            ref: 'input_3',
            type: 'readme',
            question: '<p>Read <strong>this</strong></p>'
        });

        const html = buildPrintHtml(project_definition([radio, readme]), 0);

        expect(html).toContain('type="radio"');
        expect(html).toContain('Pick one');
        expect(html).toContain('Read this');
        expect(html).not.toContain('<strong>');
    });

    it('wraps a branch in a table and keeps its children', () => {
        const branch = text_input({
            ref: 'input_4',
            type: 'branch',
            question: 'Only for adults',
            branch: [text_input({ ref: 'input_5', question: 'Age' })]
        });

        const html = buildPrintHtml(project_definition([branch]), 0);

        expect(html).toContain('<h4 class="branch-header">Only for adults</h4>');
        expect(html).toContain('<h4 class="question">Age</h4>');
    });

    it('refuses an empty or invalid form', () => {
        expect(buildPrintHtml(project_definition([]), 0)).toBeNull();
        expect(buildPrintHtml(project_definition([text_input({ question: '' })]), 0)).toBeNull();
        expect(buildPrintHtml(project_definition([text_input()]), 4)).toBeNull();
    });

    it('fills the wrapper and calls window.print', () => {
        const print = vi.spyOn(window, 'print').mockImplementation(() => {});
        const wrapper = document.createElement('div');

        wrapper.className = 'print-preview-wrapper';
        document.body.append(wrapper);

        expect(printForm(project_definition([text_input()]), 0)).toBe(true);
        expect(wrapper.innerHTML).toContain('Your name');
        expect(print).toHaveBeenCalledTimes(1);
    });

    it('does not call window.print for an invalid form', () => {
        const print = vi.spyOn(window, 'print').mockImplementation(() => {});
        const wrapper = document.createElement('div');

        wrapper.className = 'print-preview-wrapper';
        document.body.append(wrapper);

        expect(printForm(project_definition([]), 0)).toBe(false);
        expect(wrapper.innerHTML).toBe('');
        expect(print).not.toHaveBeenCalled();
    });
});
