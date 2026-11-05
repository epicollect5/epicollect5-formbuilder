'use strict';

import { element, icon } from '@/ui/dom.js';

let dropdown_id = 0;

/*
 * Reusable dropdown: a trigger button + an ion-popover listbox. It replaces
 * ion-select where we need full control over the caret position and popover
 * alignment. The public shape mirrors what the jump/select bindings need:
 * `.options`, `.value`, `.disabled`, and a `change` CustomEvent with
 * `event.detail.value`.
 */
export function createDropdown(options) {
    const id = 'fb-dropdown-' + (dropdown_id += 1);
    const trigger_id = id + '-trigger';
    const config = options || {};
    const trigger = element('button', {
        type: 'button',
        id: trigger_id,
        class: 'dropdown__trigger',
        'aria-haspopup': 'listbox',
        'aria-expanded': 'false',
        'aria-label': config.aria_label || 'Select option'
    }, [
        element('span', { class: 'dropdown__label' }, ['']),
        icon('chevron-down-outline')
    ]);
    trigger.lastElementChild.classList.add('dropdown__icon');

    const list = element('div', {
        id: id + '-listbox',
        class: 'dropdown__list',
        role: 'listbox'
    });
    const popover = element('ion-popover', {
        class: 'dropdown-popover',
        'no-router': '',
        tabindex: '-1',
        trigger: trigger_id,
        reference: 'trigger',
        side: 'bottom',
        alignment: 'start',
        size: 'cover',
        'show-backdrop': 'true',
        'dismiss-on-select': 'true'
    }, [list]);

    popover.trigger = trigger_id;
    popover.reference = 'trigger';
    popover.side = 'bottom';
    popover.alignment = 'start';
    popover.size = 'cover';

    const root = element('div', {
        class: (config.class_name ? config.class_name + ' ' : '') + 'dropdown',
        'data-dropdown': ''
    }, [trigger, popover]);

    let items = [];
    let selected_value = config.value || '';
    let is_disabled = !!config.disabled;
    let on_change = typeof config.on_change === 'function' ? config.on_change : null;

    function find_item(value) {
        return items.find(function (item) {
            return String(item.value) === String(value);
        }) || null;
    }

    function render_label() {
        const label = trigger.querySelector('.dropdown__label');
        const selected = find_item(selected_value);

        label.textContent = selected ? selected.label : (config.placeholder || 'Select');
        label.classList.toggle('dropdown__label--placeholder', !selected);
    }

    function render_options() {
        list.replaceChildren();

        items.forEach(function (item) {
            const selected = String(item.value) === String(selected_value);
            const option = element('button', {
                type: 'button',
                class: 'dropdown__option' + (selected ? ' dropdown__option--selected' : ''),
                role: 'option',
                'aria-selected': selected ? 'true' : 'false',
                'data-value': item.value
            }, [item.label || '']);

            option.addEventListener('click', function () {
                if (is_disabled) {
                    return;
                }

                set_value(item.value, true);
                if (popover.dismiss) {
                    popover.dismiss();
                }
            });

            list.append(option);
        });

        render_label();
    }

    function set_value(value, emit) {
        const next = value === undefined || value === null ? '' : value;
        const changed = String(selected_value) !== String(next);

        selected_value = next;
        render_options();

        if (emit && changed) {
            const detail = { value: selected_value };
            root.dispatchEvent(new CustomEvent('change', { detail: detail, bubbles: true }));
            root.dispatchEvent(new CustomEvent('ionChange', { detail: detail, bubbles: true }));

            if (on_change) {
                on_change(detail);
            }
        }
    }

    function set_options(next_options, value) {
        items = (next_options || []).map(function (item) {
            return {
                value: item.value === undefined || item.value === null ? '' : item.value,
                label: item.label === undefined || item.label === null ? '' : String(item.label)
            };
        });

        const has_value = items.some(function (item) {
            return String(item.value) === String(value);
        });
        selected_value = has_value ? value : (items[0] ? items[0].value : '');
        render_options();
    }

    function set_disabled(disabled) {
        is_disabled = !!disabled;
        trigger.disabled = is_disabled;
        trigger.setAttribute('aria-disabled', is_disabled ? 'true' : 'false');
        root.classList.toggle('dropdown--disabled', is_disabled);
    }

    trigger.addEventListener('click', async function (event) {
        if (is_disabled) {
            return;
        }

        event.preventDefault();
        trigger.setAttribute('aria-expanded', 'true');
        // Anchor to the trigger button (not the click point) so horizontal
        // alignment matches the control; size:'cover' matches trigger width.
        popover.trigger = trigger_id;
        popover.reference = 'trigger';
        popover.side = 'bottom';
        popover.alignment = 'start';
        popover.size = 'cover';
        popover.style.setProperty('--width', trigger.offsetWidth + 'px');
        if (popover.present) {
            await popover.present();
        }
    });

    popover.addEventListener('didDismiss', function () {
        trigger.setAttribute('aria-expanded', 'false');
    });

    root.setOptions = function (next_options, value) {
        set_options(next_options, value);
    };
    root.setValue = function (value, emit) {
        set_value(value, !!emit);
    };
    root.selectValue = function (value) {
        set_value(value, true);
    };
    root.getValue = function () {
        return selected_value;
    };
    root.setDisabled = function (disabled) {
        set_disabled(disabled);
    };
    root.onChange = function (handler) {
        on_change = typeof handler === 'function' ? handler : null;
    };

    Object.defineProperty(root, 'value', {
        get: function () { return selected_value; },
        set: function (value) { set_value(value, false); }
    });
    Object.defineProperty(root, 'disabled', {
        get: function () { return is_disabled; },
        set: function (disabled) { set_disabled(disabled); }
    });

    set_disabled(is_disabled);
    set_options(config.options || [], config.value || '');

    return root;
}

export function populateDropdown(dropdown, options, value, on_change) {
    if (!dropdown) {
        return;
    }

    if (typeof dropdown.setOptions === 'function') {
        if (on_change) {
            dropdown.onChange(on_change);
        }
        dropdown.setOptions(options, value);
        return;
    }

    // fallback for any remaining plain selects during transition
    dropdown.replaceChildren();
    (options || []).forEach(function (option_data) {
        const option = element('option', { value: option_data.value });
        option.textContent = option_data.label;
        dropdown.append(option);
    });
    dropdown.value = value;
}
