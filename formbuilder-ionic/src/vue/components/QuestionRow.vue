<template>
    <ion-item class="builder__question"
              :button="true"
              :data-input-ref="input.ref"
              :aria-current="ariaCurrent"
              :data-valid="dataValid"
              @click="choose()">
        <span class="builder__question-type-icon">
            <ion-icon :name="typeIcon"></ion-icon>
        </span>
        <span class="builder__question-text" :title="label">{{ label }}</span>
        <span class="builder__question-status">
            <span v-if="hasJumps"
                  class="jump-state"
                  aria-label="Question has jumps"
                  title="Has jumps">
                <ion-icon name="arrow-down-circle-outline"></ion-icon>
            </span>
            <span :class="validityClass"
                  :aria-label="validityLabel"
                  :title="validityTitle">
                <ion-icon :name="validityIcon"></ion-icon>
            </span>
        </span>
    </ion-item>
</template>

<script>
import { computed } from 'vue';
import { getQuestionType } from '@/models/question-types.js';
import { getQuestionLabel } from '@/models/question-text.js';
import { isInputValid } from '@/services/validation.js';
import { useBuilderStore } from '@/vue/stores/builder.js';

/*
    One row of the questions list. The row reads its validity straight from the
    reactive definition, replacing the vanilla refreshQuestionRows pass.
 */
export default {
    props: {
        input: {
            type: Object,
            required: true
        },
        inputs: {
            type: Array,
            required: true
        }
    },
    setup(props) {
        const store = useBuilderStore();

        const methods = {
            choose() {
                store.chooseInput(props.input.ref);
            }
        };

        const valid = computed(() => {
            return isInputValid(props.input, props.inputs);
        });

        const computedScope = {
            label: computed(() => {
                return getQuestionLabel(props.input);
            }),
            typeIcon: computed(() => {
                const question_type = getQuestionType(props.input.type);

                return question_type ? question_type.icon : 'help-outline';
            }),
            hasJumps: computed(() => {
                return Array.isArray(props.input.jumps) && props.input.jumps.length > 0;
            }),
            ariaCurrent: computed(() => {
                return props.input.ref === store.state.session.current_input_ref ? 'true' : 'false';
            }),
            dataValid: computed(() => {
                return valid.value ? 'true' : 'false';
            }),
            validityClass: computed(() => {
                return `question-state ${valid.value ? 'is-valid' : 'is-invalid'}`;
            }),
            validityIcon: computed(() => {
                return valid.value ? 'checkmark-circle' : 'warning';
            }),
            validityLabel: computed(() => {
                return valid.value ? 'Valid question' : 'Question has errors';
            }),
            validityTitle: computed(() => {
                return valid.value ? 'Valid' : 'Needs attention';
            })
        };

        return {
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/QuestionRow.scss" lang="scss"></style>
