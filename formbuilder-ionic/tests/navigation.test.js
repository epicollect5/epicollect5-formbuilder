import { describe, expect, it } from 'vitest';
import { getBackUrl } from '@/services/navigation.js';

describe('navigation', () => {
    it('drops the entry point and returns to the project page', () => {
        expect(getBackUrl('https://epicollect5.org/projects/123/formbuilder/?ref=abc')).toBe('https://epicollect5.org/projects/123');
        expect(getBackUrl('https://epicollect5.org/projects/123/formbuilder/')).toBe('https://epicollect5.org/projects/123');
    });

    it('returns to the host root when the entry point sits at the top level', () => {
        expect(getBackUrl('https://epicollect5.org/formbuilder/')).toBe('https://epicollect5.org');
    });

    it('keeps the comparison build one level above the ionic entry', () => {
        expect(getBackUrl('http://localhost:5183/epicollect5-formbuilder/ionic/')).toBe('http://localhost:5183/epicollect5-formbuilder');
    });
});
