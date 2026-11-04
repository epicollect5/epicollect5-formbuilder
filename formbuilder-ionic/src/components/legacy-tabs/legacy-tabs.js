'use strict';

const SIBLING_PANES = '.tab-pane, .main__tabs-content-tabpanel, .input-properties__form__advanced-properties';

function previousTab($item) {
    return $item.parent().children('li.active').first().find('a[role="tab"]').first();
}

/**
 * Accessible tab controller used instead of Bootstrap's tab plugin.
 *
 * It preserves the legacy markup contract (`[role="tablist"]`, `li.active`,
 * `a[data-toggle="tab"]`, `.tab-pane.active.in`) and the
 * `show.bs.tab` / `shown.bs.tab` events that the legacy callbacks listen to.
 */
export function installTabs($, document) {
    function show(anchor) {
        const $anchor = $(anchor);
        const href = $anchor.attr('href');
        const $item = $anchor.closest('li');

        if (!href || href.charAt(0) !== '#') {
            return;
        }

        const $target = $(href);

        if (!$target.length || $item.hasClass('disabled')) {
            return;
        }

        const $related = previousTab($item);

        $anchor.trigger($.Event('show.bs.tab', { relatedTarget: $related[0] }));

        $item.parent().children('li').removeClass('active');
        $item.addClass('active');

        $target
            .siblings(SIBLING_PANES)
            .removeClass('active in')
            .attr('aria-hidden', 'true');

        $target.addClass('active in').removeAttr('aria-hidden');

        $anchor.attr('aria-selected', 'true');
        $item.siblings().find('a[role="tab"]').attr('aria-selected', 'false');

        $anchor.trigger($.Event('shown.bs.tab', { relatedTarget: $related[0] }));
    }

    $.fn.tab = function (action) {
        const command = action || 'show';

        return this.each(function () {
            if (command === 'show') {
                show(this);
            }
        });
    };

    $(document).on('click.ionicLegacy.tab', 'a[data-toggle="tab"]', function (event) {
        const $item = $(this).closest('li');

        event.preventDefault();

        if ($item.hasClass('disabled') || $item.hasClass('active')) {
            return;
        }

        show(this);
    });
}
