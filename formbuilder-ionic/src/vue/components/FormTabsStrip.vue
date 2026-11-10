<template>
    <nav class="builder__forms" id="form-tabs" role="tablist" aria-label="Forms">
        <ion-segment class="builder__forms-segment"
                     :value="activeValue"
                     :disabled="editing"
                     @ionChange="onSegmentChange($event)">
            <ion-segment-button v-for="tab in formTabs"
                                :key="tab.index"
                                class="builder__form-tab"
                                role="tab"
                                :value="tab.value"
                                :aria-selected="tab.selected"
                                :title="tab.name">
                <ion-label>
                    <ion-badge class="builder__question-count-badge" title="Questions in this form">{{ tab.count }}</ion-badge>
                    <span class="builder__form-tab-name">{{ tab.name }}</span>
                    <ion-icon v-if="tab.invalid"
                              class="builder__form-tab-state"
                              name="warning"
                              aria-label="Form has validation errors"></ion-icon>
                </ion-label>
            </ion-segment-button>
        </ion-segment>
    </nav>
</template>

<script>
import { computed } from 'vue';
import { useBuilderStore } from '@/vue/stores/builder.js';

export default {
    setup() {
        const store = useBuilderStore();

        const methods = {
            onSegmentChange(event) {
                store.chooseForm(parseInt(event.detail.value, 10));
            }
        };

        const activeIndex = computed(() => {
            return store.state.session.current_form_index;
        });

        const computedScope = {
            editing: computed(() => {
                return store.editing;
            }),
            activeValue: computed(() => {
                return String(activeIndex.value);
            }),
            formTabs: computed(() => {
                return store.formTabs.map((tab) => {
                    return Object.assign({}, tab, {
                        value: String(tab.index),
                        selected: tab.index === activeIndex.value ? 'true' : 'false',
                        invalid: !tab.valid
                    });
                });
            })
        };

        return {
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/FormTabsStrip.scss" lang="scss"></style>
