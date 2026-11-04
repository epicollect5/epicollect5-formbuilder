'use strict';

const HOST_CLASS = 'legacy-modal-host';
const OPEN_KEY = 'legacyIonicModal';

function createHost(document) {
    const host = document.createElement('ion-modal');
    host.classList.add(HOST_CLASS);
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-modal', 'true');
    return host;
}

function restore($, element, record) {
    if (record.parent) {
        record.parent.insertBefore(element, record.next_sibling);
    }

    $(element).data(OPEN_KEY, null);
    $(element).trigger('hidden.bs.modal');

    // Ionic re-attaches the overlay host while it finishes its dismissal, so the
    // host we created is removed on the next tick instead of leaving an empty
    // hidden ion-modal behind for every modal the formbuilder opens.
    setTimeout(function () {
        if (record.host.parentNode) {
            record.host.parentNode.removeChild(record.host);
        }
    }, 0);
}

/**
 * Bootstrap modal API replaced by ion-modal presentation.
 *
 * The legacy modal element itself is moved inside the Ionic overlay so that
 * existing `.find(...)` lookups inside callbacks keep working. It is restored to
 * its original position on dismissal.
 */
export function installModals($, document) {
    function show(element, related_target) {
        if ($(element).data(OPEN_KEY)) {
            return;
        }

        const $element = $(element);

        $element.trigger($.Event('show.bs.modal', { relatedTarget: related_target }));

        const record = {
            parent: element.parentNode,
            next_sibling: element.nextSibling,
            host: createHost(document)
        };

        record.host.appendChild(element);
        document.body.appendChild(record.host);
        $element.data(OPEN_KEY, record);

        record.host.addEventListener('didDismiss', function () {
            restore($, element, record);
        }, { once: true });

        if (typeof record.host.present === 'function') {
            Promise.resolve(record.host.present()).then(function () {
                $element.trigger('shown.bs.modal');
            });
        }
        else {
            $element.trigger('shown.bs.modal');
        }
    }

    function hide(element) {
        const $element = $(element);
        const record = $element.data(OPEN_KEY);

        if (!record) {
            return;
        }

        $element.trigger('hide.bs.modal');

        if (typeof record.host.dismiss === 'function') {
            Promise.resolve(record.host.dismiss()).catch(function () {
                restore($, element, record);
            });
            return;
        }

        restore($, element, record);
    }

    function isOpen(element) {
        return Boolean($(element).data(OPEN_KEY));
    }

    $.fn.modal = function (action, related_target) {
        const command = action || 'show';

        return this.each(function () {
            if (command === 'show') {
                show(this, related_target);
            }

            if (command === 'hide') {
                hide(this);
            }

            if (command === 'toggle') {
                if (isOpen(this)) {
                    hide(this);
                }
                else {
                    show(this, related_target);
                }
            }
        });
    };

    $(document).on('click.ionicLegacy.modal', '[data-toggle="modal"]', function (event) {
        const target = $(this).attr('data-target') || $(this).attr('href');
        const $target = $(target);

        event.preventDefault();

        if ($target.length) {
            $target.modal('show', this);
        }
    });

    $(document).on('click.ionicLegacy.modal', '[data-dismiss="modal"]', function (event) {
        const $modal = $(this).closest('.modal');

        event.preventDefault();

        if ($modal.length) {
            $modal.modal('hide');
        }
    });
}
