<template>
    <div class="dropdown">
        <button type="button"
                :id="triggerId"
                ref="triggerRef"
                class="dropdown__trigger"
                aria-haspopup="listbox"
                :aria-expanded="ariaExpanded"
                :aria-label="ariaLabel"
                :disabled="disabled"
                @click="onTriggerClick">
            <span class="dropdown__label"
                  :class="{ 'dropdown__label--placeholder': isPlaceholder }">{{ selectedLabel }}</span>
            <ion-icon class="dropdown__icon"
                      name="chevron-down-outline"
                      aria-hidden="true"></ion-icon>
        </button>

        <ion-popover class="dropdown-popover"
                     ref="popoverRef"
                     no-router
                     tabindex="-1"
                     :is-open="state.open"
                     :keep-contents-mounted="true"
                     :trigger="triggerId"
                     reference="trigger"
                     side="bottom"
                     alignment="start"
                     size="cover"
                     :show-backdrop="true"
                     @ionPopoverDidDismiss="onDismiss">
            <template v-if="state.everOpened">
                <div class="dropdown__search" role="search" v-if="hasSearch">
                    <ion-icon name="search-outline" aria-hidden="true"></ion-icon>
                    <input type="search"
                           class="dropdown__search-input"
                           placeholder="Search"
                           aria-label="Search options"
                           autocomplete="off"
                           spellcheck="false"
                           :value="state.query"
                           @input="onSearch">
                </div>

                <div class="dropdown__list" role="listbox">
                    <button type="button"
                            class="dropdown__option"
                            :class="{ 'dropdown__option--selected': option.selected }"
                            role="option"
                            v-for="option in visibleOptions"
                            :key="option.value"
                            :aria-selected="option.ariaSelected"
                            :data-value="option.value"
                            @click="onSelect(option)">{{ option.label }}</button>
                </div>

                <p class="dropdown__list-empty" v-if="showEmpty">No matching options</p>
            </template>
        </ion-popover>
    </div>
</template>

<script>
import { computed, reactive, ref } from 'vue';

const SEARCH_THRESHOLD = 50;
let dropdown_id = 0;

/*
    The shared value select: a trigger button plus an ion-popover listbox,
    the Vue component form of ui/dropdown.js's createDropdown. The popover
    carries the same surface (search past the threshold, selected state,
    placeholder label) and emits `change` with `{ value }`, the detail shape
    the vanilla bindings and the store actions already consume. display_only
    options label the current selection but are never offered as choices.
    Store-driven option and value changes flow through the props, so no
    rebuild passes are needed. The option list renders at first open and
    clears on dismiss (state.everOpened), the vanilla ensure/reset_options
    lifecycle: a closed jump Answer dropdown costs no option DOM.
 */
export default {
    props: {
        options: {
            type: Array,
            default: () => []
        },
        value: {
            default: ''
        },
        disabled: {
            type: Boolean,
            default: false
        },
        placeholder: {
            type: String,
            default: 'Select'
        },
        ariaLabel: {
            type: String,
            default: 'Select option'
        }
    },
    emits: ['change'],
    setup(props, { emit }) {
        const triggerRef = ref(null);
        const popoverRef = ref(null);
        const triggerId = `fb-dropdown-${dropdown_id += 1}`;

        const state = reactive({
            open: false,
            /*
             * The option list mounts at first open and clears on dismiss —
             * the vanilla ensure_options/reset_options lifecycle. A closed
             * dropdown (e.g. every jump row's Answer select) carries no
             * option DOM; the empty popover shell costs nothing.
             */
            everOpened: false,
            query: ''
        });

        const methods = {
            onTriggerClick() {
                if (props.disabled || state.open) {
                    return;
                }

                // cover the trigger width like the vanilla popover does; the
                // factory read offsetWidth at open time for the same reason
                const trigger = triggerRef.value;
                const popover = popoverRef.value && popoverRef.value.$el ? popoverRef.value.$el : popoverRef.value;

                if (trigger && popover && popover.style) {
                    popover.style.setProperty('--width', (trigger.offsetWidth || 0) + 'px');
                }

                state.everOpened = true;
                state.open = true;
            },
            onSearch(event) {
                state.query = event.target.value;
            },
            onSelect(option) {
                state.open = false;
                emit('change', { value: option.value });
            },
            onDismiss() {
                state.open = false;
                state.everOpened = false;
                state.query = '';
            }
        };

        const visibleOptions = computed(() => {
            const query = state.query.trim().toLowerCase();

            return props.options.filter((option) => {
                // display-only items label the current selection (an answer
                // that no longer exists); not offered as choices
                if (option.display_only) {
                    return false;
                }

                return !query || String(option.label).toLowerCase().includes(query);
            }).map((option) => {
                const selected = String(option.value) === String(props.value);

                return {
                    value: option.value,
                    label: option.label,
                    selected,
                    ariaSelected: selected ? 'true' : 'false'
                };
            });
        });

        const hasSearch = computed(() => {
            return props.options.filter((option) => {
                return !option.display_only;
            }).length > SEARCH_THRESHOLD;
        });

        const computedScope = {
            triggerId,
            ariaExpanded: computed(() => {
                return state.open ? 'true' : 'false';
            }),
            isPlaceholder: computed(() => {
                return !findSelected(props.options, props.value);
            }),
            selectedLabel: computed(() => {
                const selected = findSelected(props.options, props.value);

                return selected ? selected.label : props.placeholder;
            }),
            visibleOptions,
            hasSearch,
            showEmpty: computed(() => {
                return hasSearch.value && state.query.trim() !== '' && visibleOptions.value.length === 0;
            })
        };

        function findSelected(options, value) {
            return (options || []).find((option) => {
                return String(option.value) === String(value);
            }) || null;
        }

        return {
            triggerRef,
            popoverRef,
            state,
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/Dropdown.scss" lang="scss"></style>
