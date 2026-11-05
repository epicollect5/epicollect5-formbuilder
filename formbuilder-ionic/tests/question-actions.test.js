import { describe, expect, it } from 'vitest';
import { getInputs } from '@/models/project-definition.js';
import {
    duplicateInput
} from '@/services/question-actions.js';
import {
    enterInput,
    getCurrentForm,
    getCurrentInput,
    getCurrentInputs,
    selectInput,
    setProject
} from '@/services/session.js';

function question(ref, type, text, extra) {
    return Object.assign({
        ref: ref,
        type: type,
        question: text,
        is_required: false,
        is_title: false,
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
    }, extra || {});
}

function project_definition() {
    return {
        data: {
            project: {
                name: 'Copy test',
                slug: 'copy-test',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Screening form',
                        type: 'hierarchy',
                        inputs: [
                            question('form_1_radio', 'radio', 'Pick one', {
                                is_title: true,
                                default: 'a2',
                                possible_answers: [
                                    { answer: 'A', answer_ref: 'a1' },
                                    { answer: 'B', answer_ref: 'a2' }
                                ],
                                jumps: [{ to: 'form_1_text', when: 'IS', answer_ref: 'a1' }]
                            }),
                            question('form_1_text', 'text', 'Name'),
                            question('form_1_branch', 'branch', 'Household', {
                                branch: [
                                    question('form_1_branch_a', 'radio', 'Pick inside', {
                                        possible_answers: [{ answer: 'X', answer_ref: 'x1' }],
                                        jumps: [
                                            { to: 'form_1_branch_b', when: 'IS', answer_ref: 'x1' },
                                            { to: 'form_1_text', when: 'ALL', answer_ref: null }
                                        ]
                                    }),
                                    question('form_1_branch_b', 'text', 'Name inside'),
                                    question('form_1_branch_g', 'group', 'Members', {
                                        group: [question('form_1_branch_g_a', 'integer', 'Age')]
                                    })
                                ]
                            })
                        ]
                    }
                ]
            }
        }
    };
}

function inputs() {
    return getInputs(getCurrentForm());
}

describe('question duplication', () => {
    it('appends a copy with a new ref, remapped answers and no title or jumps', () => {
        setProject(project_definition());
        selectInput('form_1_radio');

        const source = inputs()[0];
        const copy = duplicateInput(source);

        expect(copy).not.toBe(source);
        expect(copy.ref).not.toBe(source.ref);
        expect(copy.ref.startsWith('form_1_')).toBe(true);
        expect(inputs()).toHaveLength(4);
        expect(inputs()[3]).toBe(copy);
        expect(getCurrentInput()).toBe(copy);

        expect(copy.is_title).toBe(false);
        expect(copy.question).toBe('Pick one');
        expect(copy.jumps).toEqual([]);
        expect(copy.possible_answers.map(function (answer) {
            return answer.answer;
        })).toEqual(['A', 'B']);

        const answer_refs = copy.possible_answers.map(function (answer) {
            return answer.answer_ref;
        });

        expect(answer_refs).not.toContain('a1');
        expect(answer_refs).not.toContain('a2');
        expect(new Set(answer_refs).size).toBe(2);
        expect(copy.default).toBe(answer_refs[1]);
    });

    it('rebuilds the nested refs and keeps jumps that stay inside the copy', () => {
        setProject(project_definition());
        selectInput('form_1_branch');

        const source = inputs()[2];
        const copy = duplicateInput(source);
        const child_a = copy.branch[0];
        const child_b = copy.branch[1];
        const nested_group = copy.branch[2];

        expect(copy.ref).not.toBe(source.ref);
        expect(child_a.ref.startsWith(copy.ref + '_')).toBe(true);
        expect(child_b.ref.startsWith(copy.ref + '_')).toBe(true);
        expect(nested_group.ref.startsWith(copy.ref + '_')).toBe(true);
        expect(nested_group.group[0].ref.startsWith(nested_group.ref + '_')).toBe(true);

        expect(child_a.possible_answers[0].answer_ref).not.toBe('x1');
        expect(child_a.jumps).toHaveLength(1);
        expect(child_a.jumps[0].to).toBe(child_b.ref);
        expect(child_a.jumps[0].answer_ref).toBe(child_a.possible_answers[0].answer_ref);
    });

    it('adds the copy to the branch being edited, not to the form', () => {
        setProject(project_definition());

        const branch = inputs()[2];

        enterInput(branch.ref);
        selectInput(branch.branch[1].ref);

        const copy = duplicateInput(getCurrentInput());

        expect(branch.branch).toHaveLength(4);
        expect(branch.branch[3]).toBe(copy);
        expect(copy.ref.startsWith(branch.ref + '_')).toBe(true);
        expect(inputs()).toHaveLength(3);
        expect(getCurrentInputs()).toBe(branch.branch);
    });
});
