'use strict';

const OPEN_CLASS = 'open';
const GROUP_SELECTOR = '.btn-group';
const TOGGLE_SELECTOR = '[data-toggle="dropdown"]';

function closeMenus($, except_group) {
    $(GROUP_SELECTOR + '.' + OPEN_CLASS)
        .not(except_group)
        .removeClass(OPEN_CLASS)
        .children(TOGGLE_SELECTOR)
        .attr('aria-expanded', 'false');

    $(GROUP_SELECTOR + '.' + OPEN_CLASS)
        .find('.dropdown-menu')
        .attr('aria-hidden', 'true');
}

/**
 * Accessible replacement for Bootstrap dropdowns.
 *
 * The menu stays in its original DOM position so delegated legacy click
 * handlers keep receiving its events. Visibility is driven by the `.open`
 * class, ARIA attributes and the Ionic theme.
 */
export function installMenus($, document) {
    function setState($group, is_open) {
        $group.toggleClass(OPEN_CLASS, is_open);
        $group.children(TOGGLE_SELECTOR).attr('aria-expanded', String(is_open));

        const $menu = $group.children('.dropdown-menu');

        $menu
            .attr('role', 'menu')
            .attr('aria-hidden', String(!is_open));

        $menu.children('li').children('a').attr('role', 'menuitem');
    }

    function toggle(toggle_element) {
        const $toggle = $(toggle_element);
        const $group = $toggle.closest(GROUP_SELECTOR);
        const is_open = $group.hasClass(OPEN_CLASS);

        closeMenus($, $group);
        setState($group, !is_open);
    }

    $.fn.dropdown = function (action) {
        const command = action || 'toggle';

        return this.each(function () {
            const $group = $(this).closest(GROUP_SELECTOR).length ? $(this).closest(GROUP_SELECTOR) : $(this);

            if (command === 'toggle') {
                toggle($group.children(TOGGLE_SELECTOR)[0] || this);
            }

            if (command === 'open') {
                closeMenus($, $group);
                setState($group, true);
            }

            if (command === 'close') {
                setState($group, false);
            }
        });
    };

    $(document).on('click.ionicLegacy.dropdown', TOGGLE_SELECTOR, function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggle(this);
    });

    $(document).on('click.ionicLegacy.dropdown-outside', function (event) {
        const $group = $(event.target).closest(GROUP_SELECTOR);

        if (!$group.hasClass(OPEN_CLASS)) {
            closeMenus($);
        }
    });

    $(document).on('click.ionicLegacy.dropdown-item', '.dropdown-menu a', function () {
        closeMenus($);
    });

    $(document).on('keydown.ionicLegacy.dropdown', function (event) {
        if (event.key === 'Escape' || event.key === 'Esc') {
            closeMenus($);
        }
    });
}
