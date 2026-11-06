import { afterEach, describe, expect, it } from 'vitest';
import { dismissToast, notifyError, notifySuccess, notifyWarning } from '@/services/notifications.js';
import { PARAMETERS } from '@/config/parameters.js';
import { countProjectSearchInputs } from '@/models/project-limits.js';

afterEach(() => {
    dismissToast();
    document.body.innerHTML = '';
});

describe('notification service', () => {
    it('maps success, warning and error to the toast colors', () => {
        expect(notifySuccess('Project saved!').cssClass).toContain('fb-toast--success');
        expect(notifyWarning('Form deleted').cssClass).toContain('fb-toast--warning');
        expect(notifyError('Project error!').cssClass).toContain('fb-toast--danger');
    });

    it('renders one toast at a time at the top of the page', () => {
        notifySuccess('First');
        notifyError('Second');

        const toasts = [...document.querySelectorAll('ion-toast')];

        expect(toasts).toHaveLength(1);
        expect(toasts[0].position).toBe('top');
        expect(toasts[0].message).toBe('Second');
    });

    it('counts search questions across every form of the project', () => {
        const project_definition = {
            data: {
                project: {
                    forms: [
                        { inputs: [{ type: 'searchsingle' }, { type: 'text' }] },
                        { inputs: [{ type: 'searchmultiple' }] }
                    ]
                }
            }
        };

        expect(PARAMETERS.SEARCH_INPUTS_MAX).toBe(5);
        expect(countProjectSearchInputs(project_definition)).toBe(2);
        expect(countProjectSearchInputs({ data: { project: { forms: [] } } })).toBe(0);
    });
});
