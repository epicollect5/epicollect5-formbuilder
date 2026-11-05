'use strict';

/*
 * jQuery UI owns drag and drop, as in the legacy builder. The question list is
 * a sortable, and the tool buttons are draggables that drop into it.
 *
 * The tools are buttons on purpose: jQuery UI cancels drags that start on
 * button/input elements unless the cancel selector is narrowed, so it is set
 * to an attribute nothing uses.
 *
 * connectToSortable is deliberately not used: the connected sortable never
 * receives the helper in this setup, so the drop is resolved from the pointer
 * in `drag`/`stop` instead. The placeholder keeps the legacy preview.
 */

export function getJQuery() {
    return window.jQuery || null;
}

export function installToolDrag(tools_selector, list_selector, on_drop) {
    const $ = getJQuery();

    if (!$) {
        return;
    }

    const $tools = $(tools_selector);

    if ($tools.hasClass('ui-draggable')) {
        $tools.draggable('destroy');
    }

    let placeholder = null;
    let current_drop = null;

    const clear_placeholder = function () {
        if (placeholder) {
            placeholder.remove();
            placeholder = null;
        }
    };

    const show_placeholder = function (drop) {
        if (!placeholder) {
            // match the question rows, so jQuery UI's own placeholder and this
            // one are the same element type
            const row = drop.list.querySelector('.builder__question');

            placeholder = document.createElement(row ? row.nodeName.toLowerCase() : 'ion-item');
            placeholder.className = 'builder__question-placeholder';
        }

        const rows = drop.list.querySelectorAll('.builder__question');
        const target = rows[drop.index] || null;

        // Keep the placeholder in place while the pointer stays in the same
        // slot. Re-inserting it on every drag event shifts the rows repeatedly
        // and makes the first drop position flicker near the list's top edge.
        if (placeholder.parentNode === drop.list && placeholder.nextElementSibling === target) {
            return;
        }

        placeholder.remove();

        if (drop.index >= rows.length) {
            drop.list.append(placeholder);
        }
        else {
            drop.list.insertBefore(placeholder, target);
        }
    };

    $tools.draggable({
        cancel: '[data-no-drag]',
        helper: function () {
            const $tool = $(this);

            // Keep the tool's own shape while dragging instead of stretching
            // it to the question list width.
            return $('<div class="builder__question builder__question--helper"></div>')
                .attr('data-type', $tool.attr('data-type'))
                .css({ width: $tool.outerWidth(), height: $tool.outerHeight() })
                .append($tool.children().clone());
        },
        revert: false,
        cursor: 'grabbing',
        distance: 4,
        zIndex: 2000,
        drag: function (event, ui) {
            current_drop = resolveDrop(list_selector, getPointer(event, ui));

            if (current_drop) {
                show_placeholder(current_drop);
            }
            else {
                clear_placeholder();
            }
        },
        stop: function () {
            // The stop event does not carry the release coordinates, and the
            // helper has already started reverting, so the last drag position
            // is the drop the user saw.
            const drop = current_drop;

            current_drop = null;
            clear_placeholder();

            if (drop) {
                on_drop($(this).attr('data-type'), drop.index);
            }
        }
    });
}

export function installQuestionSortable(list_selector, on_sync) {
    const $ = getJQuery();

    if (!$) {
        return;
    }

    const $list = $(list_selector);

    if (!$list.length) {
        return;
    }

    if ($list.hasClass('ui-sortable')) {
        $list.sortable('destroy');
    }

    $list.sortable({
        items: '> .builder__question',
        placeholder: 'builder__question-placeholder',
        forcePlaceholderSize: true,
        tolerance: 'pointer',
        axis: 'y',
        stop: function () {
            on_sync();
        }
    });
}

export function installAnswerSortable(list_selector, on_sync) {
    const $ = getJQuery();

    if (!$) {
        return;
    }

    const $list = $(list_selector);

    if (!$list.length) {
        return;
    }

    if ($list.hasClass('ui-sortable')) {
        $list.sortable('destroy');
    }

    $list.sortable({
        items: '> .builder__answer',
        // Text fields keep their own pointer behaviour; drag from the grip.
        cancel: 'ion-input, ion-checkbox, input, textarea, button, a',
        placeholder: 'builder__answer-placeholder',
        forcePlaceholderSize: true,
        tolerance: 'pointer',
        axis: 'y',
        stop: function () {
            on_sync();
        }
    });
}

function getPointer(event, ui) {
    const original = event.originalEvent || event;

    if (original && (original.clientX || original.clientY)) {
        return { x: original.clientX, y: original.clientY };
    }

    const helper = ui.helper && ui.helper[0];

    if (!helper) {
        return null;
    }

    const rect = helper.getBoundingClientRect();

    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/*
 * Resolved against the rows, not the list box: the list scrolls, so its own
 * rect can be smaller than the rows it shows.
 */
function resolveDrop(list_selector, pointer) {
    if (!pointer) {
        return null;
    }

    const list = document.querySelector(list_selector);

    if (!list) {
        return null;
    }

    const list_rect = list.getBoundingClientRect();
    const rows = [...list.querySelectorAll('.builder__question')];

    if (!rows.length) {
        return pointer.y >= list_rect.top && pointer.y <= list_rect.bottom ? { list: list, index: 0 } : null;
    }

    const first_rect = rows[0].getBoundingClientRect();
    const last_rect = rows[rows.length - 1].getBoundingClientRect();
    const left = Math.min(first_rect.left, list_rect.left);
    const right = Math.max(first_rect.right, list_rect.right);

    if (pointer.x < left || pointer.x > right || pointer.y < list_rect.top || pointer.y > last_rect.bottom) {
        return null;
    }

    let index = rows.length;

    for (let i = 0; i < rows.length; i += 1) {
        const row_rect = rows[i].getBoundingClientRect();

        if (pointer.y < row_rect.top + row_rect.height / 2) {
            index = i;
            break;
        }
    }

    return { list: list, index: index };
}
