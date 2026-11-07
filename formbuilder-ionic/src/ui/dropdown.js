'use strict';

import { element, icon } from '@/ui/dom.js';

let dropdown_id = 0;

const SEARCH_THRESHOLD = 50;

/*
 * Reusable dropdown: a trigger button + an ion-popover listbox. It replaces
 * ion-select where we need full control over the caret position and popover
 * alignment. The public shape mirrors what the jump/select bindings need:
 * `.options`, `.value`, `.disabled`, and a `change` CustomEvent with
 * `event.detail.value`.
 */
export const createDropdown = (options) => {
    const id = `fb-dropdown-${dropdown_id += 1}`;
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
    const search_input = element('input', {
        type: 'search',
        class: 'dropdown__search-input',
        placeholder: 'Search',
        'aria-label': 'Search options',
        'aria-controls': id + '-listbox',
        autocomplete: 'off',
        spellcheck: 'false'
    });
    const search = element('div', {
        class: 'dropdown__search',
        role: 'search'
    }, [
        icon('search-outline'),
        search_input
    ]);
    const no_results = element('p', {
        class: 'dropdown__list-empty'
    }, ['No matching options']);

    search.hidden = true;
    no_results.hidden = true;

    const popover = element('ion-popover', {
        class: 'dropdown-popover',
        'no-router': '',
        tabindex: '-1',
        trigger: trigger_id,
        reference: 'trigger',
        side: 'bottom',
        alignment: 'start',
        size: 'cover',
        'show-backdrop': 'true'
    }, [search, list, no_results]);

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
    let options_rendered = false;

    const find_item = (value) => {
        return items.find((item) => {
            return String(item.value) === String(value);
        }) || null;
    };

    const render_label = () => {
        const label = trigger.querySelector('.dropdown__label');
        const selected = find_item(selected_value);
        //an explicitly empty placeholder keeps the trigger blank, e.g. a locked
        //jump "answer" select that references no answer
        const placeholder_text = typeof config.placeholder === 'string' ? config.placeholder : 'Select';

        label.textContent = selected ? selected.label : placeholder_text;
        label.classList.toggle('dropdown__label--placeholder', !selected);
    };

    const visible_items = () => {
        const query = search_input.value.trim().toLowerCase();
        const matches = [];

        items.forEach((item, index) => {
            // A display-only item labels the current selection (an answer that
            // no longer exists); it must not be offered as a choice.
            if (item.display_only) {
                return;
            }

            if (!query || String(item.label).toLowerCase().includes(query)) {
                matches.push({item, index});
            }
        });

        return matches;
    };

    const render_options = () => {
        list.replaceChildren();

        const matches = visible_items();

        matches.forEach(({item, index}) => {
            const selected = String(item.value) === String(selected_value);
            const option = element('button', {
                type: 'button',
                class: `dropdown__option${selected ? ' dropdown__option--selected' : ''}`,
                role: 'option',
                'aria-selected': selected ? 'true' : 'false',
                'data-value': item.value,
                'data-option-index': String(index)
            }, [item.label || '']);

            list.append(option);
        });

        list.hidden = matches.length === 0;
        no_results.hidden = matches.length > 0 || !search_input.value.trim();
        options_rendered = true;
        render_label();
    };

    // Building the option buttons is deferred until the popover opens.
    const ensure_options = () => {
        if (!options_rendered) {
            render_options();
        }
    };

    const reset_options = () => {
        search_input.value = '';
        no_results.hidden = true;
        options_rendered = false;
        list.replaceChildren();
    };

    const set_value = (value, emit) => {
        const next = value === undefined || value === null ? '' : value;
        const changed = String(selected_value) !== String(next);

        selected_value = next;
        render_label();

        if (options_rendered) {
            render_options();
        }

        if (emit && changed) {
            const detail = { value: selected_value };
            root.dispatchEvent(new CustomEvent('change', { detail, bubbles: true }));
            root.dispatchEvent(new CustomEvent('ionChange', { detail, bubbles: true }));

            if (on_change) {
                on_change(detail);
            }
        }
    };

    const set_options = (next_options, value) => {
        items = (next_options || []).map((item) => {
            return {
                value: item.value === undefined || item.value === null ? '' : item.value,
                label: item.label === undefined || item.label === null ? '' : String(item.label),
                display_only: item.display_only === true
            };
        });

        const has_value = items.some((item) => {
            return String(item.value) === String(value);
        });
        const selectable_count = items.filter((item) => {
            return !item.display_only;
        }).length;

        selected_value = has_value ? value : (items[0] ? items[0].value : '');
        search.hidden = selectable_count <= SEARCH_THRESHOLD;
        reset_options();
        render_label();

        // Rebuild an open list immediately; a closed one rebuilds on next open.
        if (popover.presented) {
            render_options();
        }
    };

    search_input.addEventListener('input', () => {
        render_options();
        list.scrollTop = 0;
    });

    // One delegated listener for every option, no matter how often the list is rebuilt.
    list.addEventListener('click', (event) => {
        const option = event.target.closest('.dropdown__option');

        if (!option || is_disabled) {
            return;
        }

        const item = items[Number(option.getAttribute('data-option-index'))];

        if (!item) {
            return;
        }

        set_value(item.value, true);

        if (popover.dismiss) {
            popover.dismiss();
        }
    });

    const set_disabled = (disabled) => {
        is_disabled = !!disabled;
        trigger.disabled = is_disabled;
        trigger.setAttribute('aria-disabled', is_disabled ? 'true' : 'false');
        root.classList.toggle('dropdown--disabled', is_disabled);
    };

    trigger.addEventListener('click', async (event) => {
        if (is_disabled) {
            return;
        }

        event.preventDefault();
        ensure_options();
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

    // Covers Ionic's own trigger interaction (keyboard/activation) too.
    popover.addEventListener('ionPopoverWillPresent', ensure_options);

    popover.addEventListener('didDismiss', () => {
        trigger.setAttribute('aria-expanded', 'false');
        reset_options();
    });

    root.setOptions = (next_options, value) => {
        set_options(next_options, value);
    };
    root.setValue = (value, emit) => {
        set_value(value, !!emit);
    };
    root.selectValue = (value) => {
        set_value(value, true);
    };
    root.getValue = () => {
        return selected_value;
    };
    root.setDisabled = (disabled) => {
        set_disabled(disabled);
    };
    root.onChange = (handler) => {
        on_change = typeof handler === 'function' ? handler : null;
    };

    Object.defineProperty(root, 'value', {
        get: () => { return selected_value; },
        set: (value) => { set_value(value, false); }
    });
    Object.defineProperty(root, 'disabled', {
        get: () => { return is_disabled; },
        set: (disabled) => { set_disabled(disabled); }
    });

    set_disabled(is_disabled);
    set_options(config.options || [], config.value || '');

    return root;
};

/*
 * Action menu sharing the dropdown list surface: same popover, option padding
 * and hover state as the selection dropdowns, but without a selected value.
 */
export const createMenu = (trigger, items, on_select) => {
    if (!trigger) {
        return null;
    }

    const id = trigger.id || `fb-menu-${dropdown_id += 1}`;
    const list = element('div', { class: 'dropdown__list', role: 'menu' });
    const popover = element('ion-popover', {
        class: 'dropdown-popover builder__action-popover',
        'no-router': '',
        tabindex: '-1',
        trigger: id,
        reference: 'trigger',
        side: 'bottom',
        alignment: 'end',
        'show-backdrop': 'true',
        'dismiss-on-select': 'true'
    }, [list]);

    trigger.id = id;
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');

    const menu_actions = [];

    (items || []).forEach((item) => {
        if (item.divider) {
            list.append(element('div', { class: 'builder__answers-dropdown-divider' }));
            return;
        }

        const option = element('button', {
            type: 'button',
            class: 'dropdown__option',
            role: 'menuitem',
            'data-action': item.data_action,
            'data-menu-index': String(menu_actions.length),
            disabled: item.disabled ? 'disabled' : undefined
        }, [item.label]);

        menu_actions.push(item);
        list.append(option);
    });

    // A menu has one delegated listener rather than one per action.
    list.addEventListener('click', (event) => {
        const option = event.target.closest('.dropdown__option');

        if (!option) {
            return;
        }

        const item = menu_actions[Number(option.getAttribute('data-menu-index'))];

        if (!item || item.disabled) {
            return;
        }

        if (popover.dismiss) {
            popover.dismiss();
        }

        if (typeof on_select === 'function') {
            on_select(item);
        }
    });

    if (!trigger.parentNode) {
        return popover;
    }

    trigger.parentNode.append(popover);
    popover.trigger = id;
    popover.reference = 'trigger';
    popover.side = 'bottom';
    popover.alignment = 'end';

    trigger.addEventListener('click', async (event) => {
        event.preventDefault();
        trigger.setAttribute('aria-expanded', 'true');
        popover.trigger = id;
        popover.style.setProperty('--width', Math.max(trigger.offsetWidth, 200) + 'px');

        if (popover.present) {
            await popover.present();
        }
    });

    popover.addEventListener('didDismiss', () => {
        trigger.setAttribute('aria-expanded', 'false');
    });

    return popover;
};

export const populateDropdown = (dropdown, options, value, on_change) => {
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
    (options || []).forEach((option_data) => {
        const option = element('option', { value: option_data.value });
        option.textContent = option_data.label;
        dropdown.append(option);
    });
    dropdown.value = value;
};
