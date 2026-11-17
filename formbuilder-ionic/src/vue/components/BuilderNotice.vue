<template>
    <component :is="tag"
               class="builder__notice"
               :class="variantClass">
        <slot></slot>
    </component>
</template>

<script>
import { computed } from 'vue';

/*
    The shared inline notice box (the .builder__notice surface in
    src/theme/_reset.scss): an info / warning / danger wash with the shared
    padding and radius. Usage-specific hook classes, data-role attributes and
    the ion-text-center utility flow through attribute fallthrough, so each
    call site keeps its exact selector surface. `tag` preserves the block
    element the vanilla markup used (p vs div), since the user-agent margins
    differ.
 */
export default {
    props: {
        variant: {
            type: String,
            default: 'info'
        },
        tag: {
            type: String,
            default: 'div'
        }
    },
    setup(props) {
        const computedScope = {
            variantClass: computed(() => {
                return `builder__notice--${props.variant}`;
            })
        };

        return {
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/BuilderNotice.scss" lang="scss"></style>
