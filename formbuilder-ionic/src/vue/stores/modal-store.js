'use strict';

import { reactive } from 'vue';
import { defineStore } from 'pinia';

/*
 * The shared modal host's state: one modal at a time, replacing the
 * ui/modal.js openModal flow for the Vue tree. The owning store sets the
 * presentation config and builds the footer buttons; the buttons carry their
 * `action` closures and an optional `disabled` predicate so live gates (the
 * CSV import button waits for a column) stay reactive. `kind` selects the
 * body component rendered inside Modal.vue.
 */
export const useModalStore = defineStore('modal', () => {
    const state = reactive({
        open: false,
        title: '',
        class_name: '',
        kind: '',
        buttons: []
    });

    const methods = {
        openModal(config) {
            const next = config || {};

            // one modal at a time: a new config replaces the open one, like
            // ui/modal.js's dismissModal() on re-open
            state.title = next.title || '';
            state.class_name = next.class_name || '';
            state.kind = next.kind || '';
            state.buttons = next.buttons || [];
            state.open = true;
        },
        closeModal() {
            state.open = false;
        }
    };

    return {
        state,
        ...methods
    };
});
