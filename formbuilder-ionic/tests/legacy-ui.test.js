import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import $ from 'jquery';
import { installLegacyUi } from '@/services/legacy-ui.js';

function flush() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeAll(() => {
    if (!window.customElements.get('ion-modal')) {
        window.customElements.define('ion-modal', class extends window.HTMLElement {
            present() {
                this.presented = true;
                return Promise.resolve();
            }

            dismiss() {
                this.presented = false;
                this.dispatchEvent(new window.CustomEvent('didDismiss'));
                return Promise.resolve();
            }
        });
    }

    installLegacyUi($, document);
});

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('modal replacement', () => {
    it('presents the legacy modal element inside an ion-modal and restores it on hide', async () => {
        document.body.innerHTML = `
            <button id="trigger" data-toggle="modal" data-target="#demo-modal">Open</button>
            <div id="demo-modal" class="modal fade"><div class="modal-body">Content</div></div>
        `;

        const shown = vi.fn();
        const hidden = vi.fn();
        const modal = document.getElementById('demo-modal');

        $(modal).on('shown.bs.modal', shown);
        $(modal).on('hidden.bs.modal', hidden);

        $('#trigger').trigger('click');
        await flush();

        const host = document.querySelector('ion-modal');

        expect(host).not.toBeNull();
        expect(host.presented).toBe(true);
        expect(modal.parentElement).toBe(host);
        expect(shown).toHaveBeenCalledTimes(1);

        $(modal).modal('hide');
        await flush();

        expect(modal.parentElement).toBe(document.body);
        expect(document.querySelector('ion-modal')).toBeNull();
        expect(hidden).toHaveBeenCalledTimes(1);
    });

    it('closes through the legacy data-dismiss hook', async () => {
        document.body.innerHTML = `
            <button id="trigger" data-toggle="modal" data-target="#demo-modal">Open</button>
            <div id="demo-modal" class="modal fade">
                <div class="modal-footer"><button id="close" data-dismiss="modal">Close</button></div>
            </div>
        `;

        $('#trigger').trigger('click');
        await flush();

        expect(document.querySelector('ion-modal')).not.toBeNull();

        $('#close').trigger('click');
        await flush();

        expect(document.querySelector('ion-modal')).toBeNull();
        expect(document.getElementById('demo-modal').parentElement).toBe(document.body);
    });

    it('passes the triggering element as relatedTarget to show.bs.modal', async () => {
        document.body.innerHTML = `
            <a id="add-form" class="main__tabs_add-form" data-toggle="modal" data-target="#demo-modal">Add form</a>
            <div id="demo-modal" class="modal fade"></div>
        `;

        const handler = vi.fn();
        $('#demo-modal').on('show.bs.modal', handler);

        $('#add-form').trigger('click');
        await flush();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].relatedTarget).toBe(document.getElementById('add-form'));

        $('#demo-modal').modal('hide');
        await flush();
    });
});

describe('tab replacement', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <ul class="nav nav-tabs" role="tablist">
                <li class="active nav-tabs__tab-btn-item">
                    <a id="tab-one" href="#pane-one" role="tab" data-toggle="tab" aria-selected="true">One</a>
                </li>
                <li class="nav-tabs__tab-btn-item">
                    <a id="tab-two" href="#pane-two" role="tab" data-toggle="tab">Two</a>
                </li>
                <li class="disabled nav-tabs__tab-btn-item">
                    <a id="tab-three" href="#pane-three" role="tab" data-toggle="tab">Three</a>
                </li>
            </ul>
            <div class="tab-content">
                <div id="pane-one" class="tab-pane active in"></div>
                <div id="pane-two" class="tab-pane"></div>
                <div id="pane-three" class="tab-pane"></div>
            </div>
        `;
    });

    it('activates the pane and fires show/shown events', () => {
        const show = vi.fn();
        const shown = vi.fn();

        $('#tab-two').on('show.bs.tab', show);
        $('#tab-two').on('shown.bs.tab', shown);

        $('#tab-two').tab('show');

        expect($('#tab-two').closest('li').hasClass('active')).toBe(true);
        expect($('#tab-one').closest('li').hasClass('active')).toBe(false);
        expect($('#pane-two').hasClass('active')).toBe(true);
        expect($('#pane-two').hasClass('in')).toBe(true);
        expect($('#pane-one').hasClass('active')).toBe(false);
        expect($('#tab-two').attr('aria-selected')).toBe('true');
        expect(show).toHaveBeenCalledTimes(1);
        expect(shown).toHaveBeenCalledTimes(1);
    });

    it('deactivates advanced property panels without the tab-pane class', () => {
        document.body.innerHTML = `
            <ul class="nav nav-tabs" role="tablist">
                <li class="active nav-tabs__tab-btn-item">
                    <a id="basic-tab" href="#basic-pane" role="tab" data-toggle="tab">Properties</a>
                </li>
                <li class="nav-tabs__tab-btn-item">
                    <a id="advanced-tab" href="#advanced-pane" role="tab" data-toggle="tab">Advanced</a>
                </li>
            </ul>
            <div class="tab-content input-properties__tabs__content">
                <div id="basic-pane" class="tab-pane active in"></div>
                <div id="advanced-pane" class="input-properties__form__advanced-properties panel"></div>
            </div>
        `;

        $('#advanced-tab').trigger('click');

        expect($('#advanced-pane').hasClass('active')).toBe(true);
        expect($('#basic-pane').hasClass('active')).toBe(false);

        $('#basic-tab').trigger('click');

        expect($('#advanced-pane').hasClass('active')).toBe(false);
        expect($('#basic-pane').hasClass('active')).toBe(true);
    });

    it('activates tabs through the data API and ignores disabled tabs', () => {
        $('#tab-two').trigger('click');

        expect($('#tab-two').closest('li').hasClass('active')).toBe(true);
        expect($('#pane-two').hasClass('active')).toBe(true);

        $('#tab-three').trigger('click');

        expect($('#tab-three').closest('li').hasClass('active')).toBe(false);
        expect($('#pane-three').hasClass('active')).toBe(false);
    });
});

describe('dropdown replacement', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div class="btn-group">
                <button id="more" data-toggle="dropdown" aria-expanded="false">More</button>
                <ul class="dropdown-menu">
                    <li><a id="export" href="#">Export form</a></li>
                </ul>
            </div>
        `;
    });

    it('opens an accessible menu and closes it with Escape', () => {
        $('#more').trigger('click');

        const group = document.getElementById('more').closest('.btn-group');

        expect(group.classList.contains('open')).toBe(true);
        expect($('#more').attr('aria-expanded')).toBe('true');
        expect($('.dropdown-menu').attr('role')).toBe('menu');
        expect($('.dropdown-menu').attr('aria-hidden')).toBe('false');
        expect($('#export').attr('role')).toBe('menuitem');

        $(document).trigger($.Event('keydown', { key: 'Escape' }));

        expect(group.classList.contains('open')).toBe(false);
        expect($('#more').attr('aria-expanded')).toBe('false');
    });

    it('closes the menu after an item is clicked', () => {
        $('#more').trigger('click');
        $('#export').trigger('click');

        expect(document.getElementById('more').closest('.btn-group').classList.contains('open')).toBe(false);
    });
});

describe('help replacement', () => {
    it('turns tooltip titles into accessible labels', () => {
        document.body.innerHTML = '<button id="copy" data-toggle="tooltip" title="Copy input"></button>';

        $('#copy').tooltip();

        expect($('#copy').attr('aria-label')).toBe('Copy input');
        expect($('#copy').attr('data-ionic-help')).toBe('true');
    });

    it('turns popover content into an accessible label', () => {
        document.body.innerHTML = '<span id="help" data-toggle="popover" data-content="<b>Title</b> help"></span>';

        $('#help').popover();

        expect($('#help').attr('aria-label')).toBe('Title help');
        expect($('#help').attr('tabindex')).toBe('0');
    });
});
