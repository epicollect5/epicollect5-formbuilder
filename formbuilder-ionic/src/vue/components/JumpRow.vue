<template>
    <li class="input-properties__form__jumps__list-item builder__jump-row"
        :class="{ 'builder__jump-row--always': row.always }">
        <ion-grid class="builder__jump-grid">
            <ion-row class="builder__jump-row-inner">
                <ion-col class="builder__jump-col builder__jump-col--logic" size="9">
                    <div class="builder__jump-logic">
                        <div class="builder__jump-field">
                            <label class="builder__jump-label">When</label>
                            <Dropdown :options="whenOptions"
                                      :value="whenValue"
                                      :disabled="whenDisabled"
                                      aria-label="When"
                                      placeholder="Select"
                                      @change="onWhenChange($event)"></Dropdown>
                            <p class="builder__jump-row-error"
                               data-error-for="when"
                               v-if="row.error && row.error.field === 'when'">{{ row.error.message }}</p>
                        </div>

                        <div class="builder__jump-field builder__jump-answer-field"
                             v-if="!row.always">
                            <label class="builder__jump-label">Answer</label>
                            <Dropdown :options="row.answerOptions"
                                      :value="row.answerValue"
                                      :disabled="!row.needsAnswer"
                                      aria-label="Answer"
                                      placeholder=""
                                      @change="onAnswerChange($event)"></Dropdown>
                            <p class="builder__jump-row-error"
                               data-error-for="answer"
                               v-if="row.error && row.error.field === 'answer'">{{ row.error.message }}</p>
                        </div>

                        <div class="builder__jump-field">
                            <label class="builder__jump-label">Go to</label>
                            <Dropdown :options="row.destinationOptions"
                                      :value="row.destinationValue"
                                      aria-label="Go to"
                                      placeholder="Select destination"
                                      @change="onGotoChange($event)"></Dropdown>
                            <p class="builder__jump-row-error"
                               data-error-for="to"
                               v-if="row.error && row.error.field === 'to'">{{ row.error.message }}</p>
                        </div>
                    </div>
                </ion-col>
                <ion-col class="builder__jump-col builder__jump-col--remove" size="3">
                    <button type="button"
                            class="builder__jump-remove"
                            aria-label="Remove jump"
                            @click="remove()">
                        <ion-icon name="close-outline"
                                  aria-hidden="true"></ion-icon>
                        <span>Remove</span>
                    </button>
                </ion-col>
            </ion-row>
        </ion-grid>
    </li>
</template>

<script>
import { computed } from 'vue';
import { useJumpsStore } from '@/vue/stores/jumps-store.js';
import Dropdown from '@/vue/components/Dropdown.vue';

/*
    One jump row, using the shared Dropdown component: the When / Answer /
    destination selects are reactive props on the row, replacing the vanilla
    buildJumpRow's placeholder-and-initDropdown choreography. The always
    variant locks When to "always", and a stored ref/destination that no
    longer exists shows as a display-only "Unavailable" entry (R-30 / R-31)
    carried by the row's option lists.
 */
const ALWAYS_WHEN_OPTIONS = [{ value: 'ALL', label: 'always' }];

export default {
    props: {
        row: {
            type: Object,
            required: true
        }
    },
    components: {
        Dropdown
    },
    setup(props) {
        const store = useJumpsStore();

        const methods = {
            remove() {
                store.removeJumpFromCurrentInput(props.row.index);
            },
            onWhenChange(detail) {
                store.updateCurrentInputJump(props.row.index, { when: detail.value });
            },
            onAnswerChange(detail) {
                store.updateCurrentInputJump(props.row.index, { answer_ref: detail.value || '' });
            },
            onGotoChange(detail) {
                store.updateCurrentInputJump(props.row.index, { to: detail.value || '' });
            }
        };

        const computedScope = {
            whenOptions: computed(() => {
                return props.row.always ? ALWAYS_WHEN_OPTIONS : props.row.whenOptions;
            }),
            whenValue: computed(() => {
                return props.row.always ? 'ALL' : props.row.whenValue;
            }),
            whenDisabled: computed(() => {
                return props.row.always;
            })
        };

        return {
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/JumpRow.scss" lang="scss"></style>
