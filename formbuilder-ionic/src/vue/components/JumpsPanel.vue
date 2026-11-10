<template>
    <section class="builder__properties-panel builder__jumps-panel">
        <ion-toolbar class="builder__jumps-actions">
            <button type="button"
                    slot="end"
                    class="input-properties__form__jumps__add-jump builder__add-jump"
                    aria-label="Add jump"
                    :disabled="!canAdd"
                    :title="canAdd ? 'Add jump' : 'No jump destinations available'"
                    @click="addJump()">
                <ion-icon name="add-outline"
                          aria-hidden="true"></ion-icon>
                <span>Add jump</span>
            </button>
        </ion-toolbar>

        <p class="input-properties__form__jumps__no-jumps-message builder__empty builder__notice builder__notice--info builder__jumps-empty"
           data-role="no-jumps"
           v-if="!hasJumps">No jumps set yet</p>

        <ul class="input-properties__form__jumps__list builder__jumps-list"
            v-else>
            <JumpRow v-for="row in rows"
                     :key="row.signature"
                     :row="row"></JumpRow>
        </ul>

        <div class="builder__answers-pager builder__jumps-pager"
             data-role="jumps-pager"
             v-if="pageCount > 1">
            <button type="button"
                    class="builder__answers-pager-button"
                    data-action="jumps-page-prev"
                    aria-label="Previous jumps page"
                    :disabled="currentPage <= 1"
                    @click="goToPage(currentPage - 1)">
                <ion-icon name="chevron-back-outline"
                          aria-hidden="true"></ion-icon>
            </button>

            <span class="builder__answers-pager-label">
                Page
                <span data-role="jumps-page">{{ currentPage }}</span>
                of
                <span data-role="jumps-pages">{{ pageCount }}</span>
            </span>

            <button type="button"
                    class="builder__answers-pager-button"
                    data-action="jumps-page-next"
                    aria-label="Next jumps page"
                    :disabled="currentPage >= pageCount"
                    @click="goToPage(currentPage + 1)">
                <ion-icon name="chevron-forward-outline"
                          aria-hidden="true"></ion-icon>
            </button>
        </div>
    </section>
</template>

<script>
import { computed } from 'vue';
import { useJumpsStore } from '@/vue/stores/jumps.js';
import JumpRow from '@/vue/components/JumpRow.vue';

/*
    The jumps tab: rows with the When / Answer / Go to custom dropdowns, the
    single-answer "always" variant, the per-row error messages and the pager.
    The rows come precomputed from the jumps store (the vanilla buildJumpRow
    parity); every change routes through the jumps services.
 */
export default {
    components: {
        JumpRow
    },
    setup() {
        const store = useJumpsStore();

        const methods = {
            addJump() {
                store.addJumpToCurrentInput();
            },
            goToPage(target) {
                store.setJumpsPage(target);
            }
        };

        const computedScope = {
            rows: computed(() => {
                return store.jumpsPanel.rows;
            }),
            canAdd: computed(() => {
                return store.jumpsPanel.canAdd;
            }),
            hasJumps: computed(() => {
                return store.jumpsPanel.hasJumps;
            }),
            currentPage: computed(() => {
                return store.jumpsPanel.currentPage;
            }),
            pageCount: computed(() => {
                return store.jumpsPanel.pageCount;
            })
        };

        return {
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/JumpsPanel.scss" lang="scss"></style>
