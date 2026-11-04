'use strict';

function helpText($element) {
    return $element.attr('title') ||
        $element.attr('data-original-title') ||
        $element.attr('data-content') ||
        '';
}

/**
 * Brief-help replacement: no Bootstrap tooltip/popover layers, only accessible
 * labels plus the native title affordance. The plan explicitly allows
 * accessible alternatives for brief help.
 */
export function installHelp($) {
    function applyLabel(element) {
        const $element = $(element);
        const text = helpText($element).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        if (!text) {
            return;
        }

        $element.attr('aria-label', text);
        $element.attr('data-ionic-help', 'true');

        if (!$element.is('a, button, input, select, textarea')) {
            $element.attr('tabindex', '0');
        }
    }

    $.fn.tooltip = function () {
        return this.each(function () {
            applyLabel(this);
        });
    };

    $.fn.popover = function () {
        return this.each(function () {
            applyLabel(this);
        });
    };

    // Minimal stubs for vendors (Summernote) that expect Bootstrap plugins.
    $.fn.collapse = function (action) {
        const command = action || 'toggle';

        return this.each(function () {
            const $element = $(this);
            const is_open = $element.hasClass('in');

            if (command === 'hide' || (command === 'toggle' && is_open)) {
                $element.removeClass('in').attr('aria-expanded', 'false');
            }

            if (command === 'show' || (command === 'toggle' && !is_open)) {
                $element.addClass('in').attr('aria-expanded', 'true');
            }
        });
    };

    $.fn.button = function (state) {
        return this.each(function () {
            const $element = $(this);

            if (state === 'toggle') {
                $element.toggleClass('active').attr('aria-pressed', String($element.hasClass('active')));
            }
        });
    };
}
