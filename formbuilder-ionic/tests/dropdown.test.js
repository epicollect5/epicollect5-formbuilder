import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDropdown, populateDropdown } from '@/ui/dropdown.js';

const OPTIONS = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' }
];

function many_options(count) {
    return Array.from({ length: count }, (_, index) => {
        return { value: 'value-' + index, label: 'Option ' + (index + 1) };
    });
}

function mount(options) {
    const dropdown = createDropdown(options);

    document.body.append(dropdown);

    return dropdown;
}

function option_values(dropdown) {
    return [...dropdown.querySelectorAll('.dropdown__option')].map((option) => option.dataset.value);
}

function open_options(dropdown) {
    dropdown.querySelector('.dropdown__trigger').click();
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('dropdown', () => {
    it('renders the trigger and label, then builds options when opened', () => {
        const dropdown = mount({
            options: OPTIONS,
            value: 'b',
            aria_label: 'Pick a value',
            class_name: 'extra'
        });
        const trigger = dropdown.querySelector('.dropdown__trigger');
        const label = dropdown.querySelector('.dropdown__label');

        expect(dropdown.classList.contains('dropdown')).toBe(true);
        expect(dropdown.classList.contains('extra')).toBe(true);
        expect(dropdown.querySelector('.dropdown__list').getAttribute('role')).toBe('listbox');
        expect(trigger.getAttribute('aria-label')).toBe('Pick a value');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(label.textContent).toBe('Beta');
        expect(label.classList.contains('dropdown__label--placeholder')).toBe(false);
        expect(dropdown.value).toBe('b');
        expect(option_values(dropdown)).toEqual([]);

        trigger.click();

        const options = [...dropdown.querySelectorAll('.dropdown__option')];

        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(option_values(dropdown)).toEqual(['a', 'b']);
        expect(options[0].getAttribute('aria-selected')).toBe('false');
        expect(options[1].getAttribute('aria-selected')).toBe('true');
    });

    it('falls back to the placeholder when no option is selected', () => {
        const dropdown = mount({ options: [] });
        const label = dropdown.querySelector('.dropdown__label');

        expect(label.textContent).toBe('Select');
        expect(label.classList.contains('dropdown__label--placeholder')).toBe(true);

        const with_placeholder = mount({ options: [], placeholder: 'Choose one' });

        expect(with_placeholder.querySelector('.dropdown__label').textContent).toBe('Choose one');
    });

    it('shows the search field only when the list exceeds the threshold', () => {
        const short = mount({ options: many_options(50) });

        open_options(short);
        expect(short.querySelector('.dropdown__search').hidden).toBe(true);

        const long = mount({ options: many_options(51) });

        open_options(long);
        expect(long.querySelector('.dropdown__search').hidden).toBe(false);
    });

    it('filters long lists and keeps the original option value', () => {
        const dropdown = mount({ options: many_options(60), value: 'value-0' });

        open_options(dropdown);

        const input = dropdown.querySelector('.dropdown__search-input');

        input.value = 'option 60';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        expect(option_values(dropdown)).toEqual(['value-59']);

        dropdown.querySelector('.dropdown__option').click();

        expect(dropdown.value).toBe('value-59');
        expect(dropdown.querySelector('.dropdown__label').textContent).toBe('Option 60');
    });

    it('reports no matches and clears the search when the popover closes', () => {
        const dropdown = mount({ options: many_options(60), value: 'value-0' });

        open_options(dropdown);

        const input = dropdown.querySelector('.dropdown__search-input');
        const empty = dropdown.querySelector('.dropdown__list-empty');

        input.value = 'missing';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        expect(option_values(dropdown)).toEqual([]);
        expect(empty.hidden).toBe(false);
        expect(empty.textContent).toBe('No matching options');

        dropdown.querySelector('ion-popover').dispatchEvent(new CustomEvent('didDismiss'));

        expect(input.value).toBe('');
        expect(empty.hidden).toBe(true);

        open_options(dropdown);

        expect(option_values(dropdown)).toHaveLength(60);
        expect(input.value).toBe('');
    });

    it('selects an option and emits change and ionChange once', () => {
        const on_change = vi.fn();
        const changes = [];
        const ion_changes = [];
        const dropdown = mount({ options: OPTIONS, value: 'a', on_change });

        dropdown.addEventListener('change', (event) => changes.push(event.detail.value));
        dropdown.addEventListener('ionChange', (event) => ion_changes.push(event.detail.value));

        open_options(dropdown);
        dropdown.querySelector('.dropdown__option[data-value="b"]').click();

        expect(dropdown.value).toBe('b');
        expect(dropdown.querySelector('.dropdown__label').textContent).toBe('Beta');
        expect(changes).toEqual(['b']);
        expect(ion_changes).toEqual(['b']);
        expect(on_change).toHaveBeenCalledTimes(1);
        expect(on_change).toHaveBeenCalledWith({ value: 'b' });
        expect(dropdown.querySelector('.dropdown__option[data-value="b"]').getAttribute('aria-selected')).toBe('true');
    });

    it('delegates option clicks to the list instead of each option', () => {
        const dropdown = mount({ options: OPTIONS, value: 'a' });

        open_options(dropdown);

        const option = dropdown.querySelector('.dropdown__option[data-value="b"]');
        const replacement = option.cloneNode(true);

        option.replaceWith(replacement);
        replacement.click();

        expect(dropdown.value).toBe('b');
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

        open_options(dropdown);
        expect(option_values(dropdown)).toEqual(['a', 'b']);

        dropdown.setOptions([{ value: 'x', label: 'X' }], 'b');
        expect(dropdown.value).toBe('x');
        expect(dropdown.querySelector('.dropdown__label').textContent).toBe('X');
        expect(option_values(dropdown)).toEqual([]);

        open_options(dropdown);
        expect(option_values(dropdown)).toEqual(['x']);

        dropdown.setOptions(OPTIONS, 'b');
        expect(dropdown.value).toBe('b');

        open_options(dropdown);
        expect(option_values(dropdown)).toEqual(['a', 'b']);

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

        open_options(dropdown);
        dropdown.setDisabled(true);

        expect(trigger.disabled).toBe(true);
        expect(trigger.getAttribute('aria-disabled')).toBe('true');
        expect(dropdown.classList.contains('dropdown--disabled')).toBe(true);

        dropdown.querySelector('.dropdown__option[data-value="b"]').click();
        trigger.click();

        expect(dropdown.value).toBe('a');

        dropdown.querySelector('ion-popover').dispatchEvent(new CustomEvent('didDismiss'));

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
