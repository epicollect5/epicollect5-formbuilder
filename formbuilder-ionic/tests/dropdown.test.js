import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDropdown, populateDropdown } from '@/ui/dropdown.js';

const OPTIONS = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' }
];

function mount(options) {
    const dropdown = createDropdown(options);

    document.body.append(dropdown);

    return dropdown;
}

function option_values(dropdown) {
    return [...dropdown.querySelectorAll('.dropdown__option')].map((option) => option.dataset.value);
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('dropdown', () => {
    it('renders the trigger, the listbox and the selected label', () => {
        const dropdown = mount({
            options: OPTIONS,
            value: 'b',
            aria_label: 'Pick a value',
            class_name: 'extra'
        });
        const trigger = dropdown.querySelector('.dropdown__trigger');
        const label = dropdown.querySelector('.dropdown__label');
        const options = [...dropdown.querySelectorAll('.dropdown__option')];

        expect(dropdown.classList.contains('dropdown')).toBe(true);
        expect(dropdown.classList.contains('extra')).toBe(true);
        expect(dropdown.querySelector('.dropdown__list').getAttribute('role')).toBe('listbox');
        expect(trigger.getAttribute('aria-label')).toBe('Pick a value');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(label.textContent).toBe('Beta');
        expect(label.classList.contains('dropdown__label--placeholder')).toBe(false);
        expect(option_values(dropdown)).toEqual(['a', 'b']);
        expect(options[0].getAttribute('aria-selected')).toBe('false');
        expect(options[1].getAttribute('aria-selected')).toBe('true');
        expect(dropdown.value).toBe('b');
    });

    it('falls back to the placeholder when no option is selected', () => {
        const dropdown = mount({ options: [] });
        const label = dropdown.querySelector('.dropdown__label');

        expect(label.textContent).toBe('Select');
        expect(label.classList.contains('dropdown__label--placeholder')).toBe(true);

        const with_placeholder = mount({ options: [], placeholder: 'Choose one' });

        expect(with_placeholder.querySelector('.dropdown__label').textContent).toBe('Choose one');
    });

    it('selects an option and emits change and ionChange once', () => {
        const on_change = vi.fn();
        const changes = [];
        const ion_changes = [];
        const dropdown = mount({ options: OPTIONS, value: 'a', on_change });

        dropdown.addEventListener('change', (event) => changes.push(event.detail.value));
        dropdown.addEventListener('ionChange', (event) => ion_changes.push(event.detail.value));

        dropdown.querySelector('.dropdown__option[data-value="b"]').click();

        expect(dropdown.value).toBe('b');
        expect(dropdown.querySelector('.dropdown__label').textContent).toBe('Beta');
        expect(changes).toEqual(['b']);
        expect(ion_changes).toEqual(['b']);
        expect(on_change).toHaveBeenCalledTimes(1);
        expect(on_change).toHaveBeenCalledWith({ value: 'b' });
        expect(dropdown.querySelector('.dropdown__option[data-value="b"]').getAttribute('aria-selected')).toBe('true');
    });

    it('emits only when the value changes', () => {
        const on_change = vi.fn();
        const changes = [];
        const dropdown = mount({ options: OPTIONS, value: 'a', on_change });

        dropdown.addEventListener('change', (event) => changes.push(event.detail.value));

        dropdown.setValue('b', true);
        dropdown.setValue('b', true);
        dropdown.value = 'a';
        dropdown.setValue('a', false);

        expect(changes).toEqual(['b']);

        dropdown.selectValue('b');

        expect(changes).toEqual(['b', 'b']);
        expect(on_change).toHaveBeenCalledTimes(2);
    });

    it('replaces its options and falls back to the first one', () => {
        const dropdown = mount({ options: OPTIONS, value: 'b' });

        dropdown.setOptions([{ value: 'x', label: 'X' }], 'b');
        expect(dropdown.value).toBe('x');
        expect(option_values(dropdown)).toEqual(['x']);
        expect(dropdown.querySelector('.dropdown__label').textContent).toBe('X');

        dropdown.setOptions(OPTIONS, 'b');
        expect(dropdown.value).toBe('b');

        dropdown.setOptions([], 'b');
        expect(dropdown.value).toBe('');
        expect(option_values(dropdown)).toEqual([]);
        expect(dropdown.querySelector('.dropdown__label').classList.contains('dropdown__label--placeholder')).toBe(true);
    });

    it('populateDropdown rebinds the handler and updates the options', () => {
        const dropdown = mount({ options: [] });
        const handler = vi.fn();

        populateDropdown(dropdown, OPTIONS, 'a', handler);

        expect(dropdown.value).toBe('a');

        dropdown.setValue('b', true);

        expect(handler).toHaveBeenCalledWith({ value: 'b' });
    });

    it('populateDropdown fills a plain select fallback', () => {
        const select = document.createElement('select');

        document.body.append(select);
        populateDropdown(select, OPTIONS, 'b', () => {});

        expect([...select.options].map((option) => option.value)).toEqual(['a', 'b']);
        expect(select.value).toBe('b');
    });

    it('ignores a missing dropdown', () => {
        expect(() => {
            populateDropdown(null, OPTIONS, 'a', () => {});
        }).not.toThrow();
    });

    it('disables the trigger and refuses to select while disabled', () => {
        const dropdown = mount({ options: OPTIONS, value: 'a' });
        const trigger = dropdown.querySelector('.dropdown__trigger');

        dropdown.setDisabled(true);

        expect(trigger.disabled).toBe(true);
        expect(trigger.getAttribute('aria-disabled')).toBe('true');
        expect(dropdown.classList.contains('dropdown--disabled')).toBe(true);

        dropdown.querySelector('.dropdown__option[data-value="b"]').click();
        trigger.click();

        expect(dropdown.value).toBe('a');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');

        dropdown.disabled = false;

        expect(trigger.disabled).toBe(false);
        expect(dropdown.classList.contains('dropdown--disabled')).toBe(false);
    });

    it('marks the trigger expanded until the popover dismisses', () => {
        const dropdown = mount({ options: OPTIONS });
        const trigger = dropdown.querySelector('.dropdown__trigger');
        const popover = dropdown.querySelector('ion-popover');

        trigger.click();

        expect(trigger.getAttribute('aria-expanded')).toBe('true');

        popover.dispatchEvent(new CustomEvent('didDismiss'));

        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });
});
