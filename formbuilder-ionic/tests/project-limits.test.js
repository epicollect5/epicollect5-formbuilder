import { describe, expect, it } from 'vitest';
import { PARAMETERS } from '@/config/parameters.js';
import {
    countInputs,
    countSearchInputs,
    countTitles,
    getProjectLimitsError
} from '@/models/project-limits.js';
import { FORM_MESSAGES } from '@/config/strings.js';

function input(overrides) {
    return Object.assign({
        ref: 'input_1',
        type: 'text',
        question: 'Question',
        is_title: false
    }, overrides || {});
}

function form(inputs) {
    return {
        ref: 'form_1',
        name: 'Form',
        slug: 'form',
        type: 'hierarchy',
        inputs
    };
}

function project(forms) {
    return {
        data: {
            project: {
                name: 'Limits',
                slug: 'limits',
                forms
            }
        }
    };
}

function many(count, overrides) {
    return Array.from({ length: count }, (_, index) => input(Object.assign({
        ref: 'input_' + index
    }, overrides || {})));
}

describe('project limit counts', () => {
    it('walks nested branches and groups', () => {
        const branch = input({
            ref: 'branch',
            type: 'branch',
            branch: [
                input({ ref: 'child' }),
                input({
                    ref: 'group',
                    type: 'group',
                    group: [input({ ref: 'grandchild' })]
                })
            ]
        });

        expect(countInputs([branch])).toBe(4);
        expect(countInputs(undefined)).toBe(0);
    });

    it('counts search questions at every nesting level', () => {
        const group = input({
            ref: 'group',
            type: 'group',
            group: [
                input({ ref: 'search', type: 'searchsingle' }),
                input({ ref: 'nested', type: 'searchmultiple' })
            ]
        });

        expect(countSearchInputs([group, input({ type: 'searchsingle' })])).toBe(3);
    });

    it('counts titles per list, not through a branch', () => {
        const branch = input({
            ref: 'branch',
            type: 'branch',
            branch: [input({ is_title: true }), input({ is_title: true })]
        });
        const group = input({
            ref: 'group',
            type: 'group',
            group: [input({ is_title: true })]
        });

        expect(countTitles([input({ is_title: true }), branch, group])).toBe(2);
    });
});

describe('project limits', () => {
    it('accepts a project with no forms', () => {
        expect(getProjectLimitsError(undefined)).toBeNull();
        expect(getProjectLimitsError(project([]))).toBeNull();
    });

    it('allows exactly the question limit and rejects one more', () => {
        expect(PARAMETERS.INPUTS_MAX_ALLOWED).toBe(300);
        expect(getProjectLimitsError(project([form(many(PARAMETERS.INPUTS_MAX_ALLOWED))]))).toBeNull();
        expect(getProjectLimitsError(project([form(many(PARAMETERS.INPUTS_MAX_ALLOWED + 1))])))
            .toBe(FORM_MESSAGES.TOO_MANY_QUESTIONS);
    });

    it('applies the question limit across forms and nesting', () => {
        const branch = input({ ref: 'branch', type: 'branch', branch: many(99, { ref: 'child' }) });

        expect(getProjectLimitsError(project([
            form([branch].concat(many(100, { ref: 'first' }))),
            form(many(100, { ref: 'second' }))
        ]))).toBeNull();

        expect(getProjectLimitsError(project([
            form([branch].concat(many(101, { ref: 'first' }))),
            form(many(100, { ref: 'second' }))
        ]))).toBe(FORM_MESSAGES.TOO_MANY_QUESTIONS);
    });

    it('allows three titles per form and rejects four', () => {
        expect(PARAMETERS.TITLES_MAX).toBe(3);
        expect(getProjectLimitsError(project([form(many(3, { is_title: true }))]))).toBeNull();
        expect(getProjectLimitsError(project([form(many(4, { is_title: true }))])))
            .toBe(FORM_MESSAGES.TOO_MANY_TITLES);
    });

    it('applies the title limit per form, not per project', () => {
        expect(getProjectLimitsError(project([
            form(many(3, { is_title: true })),
            form(many(3, { is_title: true }))
        ]))).toBeNull();
    });

    it('applies the title limit to branch children', () => {
        const branch_with = (titles) => input({
            ref: 'branch',
            type: 'branch',
            branch: many(titles, { ref: 'child', is_title: true })
        });

        expect(getProjectLimitsError(project([form([branch_with(3)])]))).toBeNull();
        expect(getProjectLimitsError(project([form([branch_with(4)])])))
            .toBe(FORM_MESSAGES.TOO_MANY_TITLES);
    });

    it('counts titles nested in a group against the form', () => {
        const group = input({
            ref: 'group',
            type: 'group',
            group: many(4, { ref: 'child', is_title: true })
        });

        expect(getProjectLimitsError(project([form([group])])))
            .toBe(FORM_MESSAGES.TOO_MANY_TITLES);
    });

    it('allows five search questions and rejects six', () => {
        expect(PARAMETERS.SEARCH_INPUTS_MAX).toBe(5);
        expect(getProjectLimitsError(project([form(many(5, { type: 'searchsingle' }))]))).toBeNull();
        expect(getProjectLimitsError(project([form(many(6, { type: 'searchmultiple' }))])))
            .toBe(FORM_MESSAGES.TOO_MANY_SEARCH_QUESTIONS);
    });

    it('counts search questions nested in groups and across forms', () => {
        const group = input({
            ref: 'group',
            type: 'group',
            group: many(3, { ref: 'child', type: 'searchsingle' })
        });

        expect(getProjectLimitsError(project([
            form([group, input({ type: 'searchmultiple' })]),
            form(many(1, { type: 'searchsingle' }))
        ]))).toBeNull();

        expect(getProjectLimitsError(project([
            form([group, input({ type: 'searchmultiple' })]),
            form(many(2, { ref: 'extra', type: 'searchsingle' }))
        ]))).toBe(FORM_MESSAGES.TOO_MANY_SEARCH_QUESTIONS);
    });
});
