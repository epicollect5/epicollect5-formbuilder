<template>
    <button type="button"
            :id="triggerId"
            ref="triggerRef"
            class="builder__answers-more-btn"
            :class="triggerClass"
            aria-haspopup="menu"
            :aria-expanded="ariaExpanded"
            :aria-label="ariaLabel"
            :title="title"
            @click="onTriggerClick">
        <ion-icon :name="icon" aria-hidden="true"></ion-icon>
    </button>

    <ion-popover class="dropdown-popover builder__action-popover"
                 ref="popoverRef"
                 no-router
                 tabindex="-1"
                 :is-open="state.open"
                 :trigger="triggerId"
                 reference="trigger"
                 side="bottom"
                 alignment="end"
                 :show-backdrop="true"
                 @ionPopoverDidDismiss="onDismiss">
        <div class="dropdown__list" role="menu">
            <template v-for="(item, index) in items" :key="index">
                <div class="builder__answers-dropdown-divider" v-if="item.divider"></div>
                <button type="button"
                        class="dropdown__option"
                        role="menuitem"
                        v-else
                        :disabled="item.disabled"
                        @click="onSelect(item)">{{ item.label }}</button>
            </template>
        </div>
    </ion-popover>
</template>

<script>
import { computed, onBeforeUnmount, reactive, ref } from 'vue';

let menu_id = 0;

/* A template ref on a Vue component returns the instance; $el is its root node. */
const resolvePopover = (component_ref) => {
    const value = component_ref && component_ref.value;

    if (!value) {
        return null;
    }

    return value.$el || value;
};

/*
    The shared action menu: a trigger button plus an ion-popover list, the
    Vue component form of ui/dropdown.js's createMenu. It shares the dropdown
    list surface (same popover classes, option padding and hover state) but
    has no selected value: items carry their own `action` closures and an
    optional `disabled` flag, with `{ divider: true }` entries between groups.
 */
export default {
    props: {
        items: {
            type: Array,
            default: () => []
        },
        ariaLabel: {
            type: String,
            default: 'More actions'
        },
        title: {
            type: String,
            default: ''
        },
        icon: {
            type: String,
            default: 'chevron-down-outline'
        },
        triggerClass: {
            type: String,
            default: ''
        }
    },
    setup() {
        const triggerRef = ref(null);
        const popoverRef = ref(null);
        const triggerId = `fb-menu-${menu_id += 1}`;

        const state = reactive({
            open: false
        });

        const methods = {
            onTriggerClick() {
                if (state.open) {
                    return;
                }

                // the action popover keeps the vanilla minimum width
                const trigger = triggerRef.value;
                const popover = popoverRef.value && popoverRef.value.$el ? popoverRef.value.$el : popoverRef.value;

                if (trigger && popover && popover.style) {
                    popover.style.setProperty('--width', Math.max(trigger.offsetWidth || 0, 200) + 'px');
                }

                state.open = true;
            },
            onSelect(item) {
                if (item.disabled) {
                    return;
                }

                state.open = false;

                if (typeof item.action === 'function') {
                    item.action();
                }
            },
            onDismiss() {
                state.open = false;
            }
        };

        const computedScope = {
            ariaExpanded: computed(() => {
                return state.open ? 'true' : 'false';
            })
        };

        onBeforeUnmount(() => {
            // the inline @ionic/vue overlay wrapper never dismisses on
            // unmount, and a presented popover is reparented to the app
            // root: dismiss it and detach the element, which Vue cannot
            // remove from the position it rendered it in
            const popover = resolvePopover(popoverRef);

            if (!popover || typeof popover.dismiss !== 'function') {
                return;
            }

            if (popover.presented) {
                Promise.resolve(popover.dismiss()).then(() => { popover.remove(); }, () => { popover.remove(); });
            }

            popover.remove();
        });

        return {
            triggerRef,
            popoverRef,
            triggerId,
            state,
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/ContextMenu.scss" lang="scss"></style>
