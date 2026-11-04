import { describe, expect, it } from 'vitest';
import { FALLBACK_ICON, resolveIconName } from '@/models/font-awesome-icons.js';
import { startIconBridge, upgradeIcon } from '@/components/legacy-icons/legacy-icons.js';

describe('font awesome icon model', () => {
    it('maps validation state classes to Ionicons', () => {
        expect(resolveIconName(['fa', 'fa-check', 'fa-2x'])).toBe('checkmark');
        expect(resolveIconName(['fa', 'fa-exclamation-triangle'])).toBe('warning');
        expect(resolveIconName(['fa', 'fa-clone'])).toBe('copy');
        expect(resolveIconName(['fa', 'fa-hashtag'])).toBe('calculator');
    });

    it('falls back for unknown icons', () => {
        expect(resolveIconName(['fa', 'fa-not-a-real-icon'])).toBe(FALLBACK_ICON);
    });
});

describe('legacy icon bridge', () => {
    it('adds an ion-icon child without replacing the host or its classes', () => {
        document.body.innerHTML = '<i class="fa fa-hashtag fa-2x question-state"></i>';

        const host = document.querySelector('i.fa');
        const icon = upgradeIcon(host);

        expect(host.tagName).toBe('I');
        expect(host.classList.contains('fa-hashtag')).toBe(true);
        expect(host.classList.contains('legacy-icon')).toBe(true);
        expect(icon.getAttribute('name')).toBe('calculator');
    });

    it('refreshes the glyph when the state class changes', async () => {
        document.body.innerHTML = '<i class="fa fa-warning form-state"></i>';

        const host = document.querySelector('i.fa');
        startIconBridge(document.body);
        expect(host.querySelector('ion-icon').getAttribute('name')).toBe('warning');

        host.classList.remove('fa-warning');
        host.classList.add('fa-check');

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(host.querySelector('ion-icon').getAttribute('name')).toBe('checkmark');
        expect(host.querySelectorAll('ion-icon')).toHaveLength(1);
    });

    it('upgrades markup injected after the bridge starts', async () => {
        document.body.innerHTML = '';

        startIconBridge(document.body);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = '<i class="fa fa-plus"></i>';
        document.body.appendChild(wrapper);

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(wrapper.querySelector('ion-icon').getAttribute('name')).toBe('add');
    });
});
