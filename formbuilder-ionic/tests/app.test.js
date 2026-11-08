import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/project-source.js', () => ({
    loadProject: () => Promise.reject(new Error('offline'))
}));

describe('app bootstrap', () => {
    it('replaces the loader when boot fails', async () => {
        document.body.innerHTML = '<div class="loader"><span>Loading</span></div>';

        const error = vi.spyOn(console, 'error').mockImplementation(() => {});

        await import('@/app.js');

        await vi.waitFor(() => {
            expect(document.querySelector('.loader').textContent).toBe('The formbuilder could not be loaded.');
        });

        expect(error).toHaveBeenCalledTimes(1);
        expect(error.mock.calls[0][0]).toContain('[formbuilder-ionic] boot failed');
    });
});
