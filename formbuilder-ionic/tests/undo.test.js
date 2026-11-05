import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession, selectForm, setProject } from '@/services/session.js';
import {
    MAX_UNDO_STATES,
    UNDO_THROTTLE_MS,
    canUndo,
    pushUndoState,
    resetUndoHistory,
    undo
} from '@/services/undo.js';

function project_definition() {
    return {
        data: {
            project: {
                name: 'Undo',
                slug: 'undo',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'One',
                        type: 'hierarchy',
                        inputs: [
                            { ref: 'input_1', type: 'text', question: 'First', is_required: false, is_title: false }
                        ]
                    },
                    { ref: 'form_2', name: 'Two', type: 'hierarchy', inputs: [] }
                ]
            }
        }
    };
}

function first_question() {
    return getSession().project_definition.data.project.forms[0].inputs[0];
}

describe('undo history', () => {
    beforeEach(() => {
        setProject(project_definition());
        resetUndoHistory();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts with the baseline and cannot undo it', () => {
        expect(canUndo()).toBe(false);
        expect(undo()).toBe(false);
    });

    it('restores the project definition from before the last push', () => {
        first_question().question = 'Changed';
        pushUndoState();

        expect(canUndo()).toBe(true);
        expect(undo()).toBe(true);
        expect(first_question().question).toBe('First');
        expect(canUndo()).toBe(false);
    });

    it('skips a push that matches the current state', () => {
        pushUndoState();

        expect(canUndo()).toBe(false);
    });

    it('keeps at most ten states', () => {
        for (let index = 0; index < MAX_UNDO_STATES + 4; index += 1) {
            first_question().question = 'Q' + index;
            pushUndoState();
        }

        let undos = 0;

        while (undo()) {
            undos += 1;
        }

        expect(undos).toBe(MAX_UNDO_STATES - 1);
        expect(first_question().question).not.toBe('First');
    });

    it('coalesces typing into one throttled state', () => {
        vi.useFakeTimers();
        first_question().question = 'Typed';
        pushUndoState({ throttle: true });

        expect(canUndo()).toBe(false);

        vi.advanceTimersByTime(UNDO_THROTTLE_MS);

        expect(canUndo()).toBe(true);
        expect(undo()).toBe(true);
        expect(first_question().question).toBe('First');
    });

    it('cancels a pending throttled push when an immediate one lands', () => {
        vi.useFakeTimers();
        first_question().question = 'Typed';
        pushUndoState({ throttle: true });
        first_question().question = 'Typed more';
        pushUndoState();

        vi.advanceTimersByTime(UNDO_THROTTLE_MS);

        expect(undo()).toBe(true);
        expect(first_question().question).toBe('First');
    });

    it('stays on the form that was being edited', () => {
        selectForm(1);
        pushUndoState();
        getSession().project_definition.data.project.forms[1].inputs.push({
            ref: 'input_2',
            type: 'text',
            question: 'Two'
        });
        pushUndoState();

        expect(undo()).toBe(true);
        expect(getSession().current_form_index).toBe(1);
        expect(getSession().project_definition.data.project.forms[1].inputs).toHaveLength(0);
    });

    it('starts a new history when the project is replaced', () => {
        first_question().question = 'Changed';
        pushUndoState();

        expect(canUndo()).toBe(true);

        setProject(project_definition());

        expect(canUndo()).toBe(false);
    });
});
