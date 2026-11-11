<template>
    <li class="input-properties__form__jumps__list-item builder__jump-row"
        :class="{ 'builder__jump-row--always': row.always }">
        <ion-grid class="builder__jump-grid">
            <ion-row class="builder__jump-row-inner">
                <ion-col class="builder__jump-col builder__jump-col--logic" size="9">
                    <div class="builder__jump-logic">
                        <div class="builder__jump-field">
                            <label class="builder__jump-label">When</label>
                            <div class="dropdown builder__jump-select builder__jump-when"
                                 data-dropdown
                                 data-dropdown-placeholder="Select"
                                 aria-label="When"
                                 ref="whenRef"></div>
                            <p class="builder__jump-row-error"
                               data-error-for="when"
                               v-if="row.error && row.error.field === 'when'">{{ row.error.message }}</p>
                        </div>

                        <div class="builder__jump-field builder__jump-answer-field"
                             v-if="!row.always">
                            <label class="builder__jump-label">Answer</label>
                            <div class="dropdown builder__jump-select builder__jump-answer"
                                 data-dropdown
                                 data-dropdown-placeholder=""
                                 aria-label="Answer"
                                 ref="answerRef"></div>
                            <p class="builder__jump-row-error"
                               data-error-for="answer"
                               v-if="row.error && row.error.field === 'answer'">{{ row.error.message }}</p>
                        </div>

                        <div class="builder__jump-field">
                            <label class="builder__jump-label">Go to</label>
                            <div class="dropdown builder__jump-select builder__jump-goto"
                                 data-dropdown
                                 data-dropdown-placeholder="Select destination"
                                 aria-label="Go to"
                                 ref="gotoRef"></div>
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
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { initDropdown } from '@/ui/dropdown.js';
import { useJumpsStore } from '@/vue/stores/jumps-store.js';

/*
    One jump row, using the vanilla custom dropdown component (ui/dropdown.js)
    exactly like the vanilla buildJumpRow: the placeholders are replaced by
    the built dropdowns on mount, the always variant locks When to "always",
    and a stored ref/destination that no longer exists shows as a
    display-only "Unavailable" entry (R-30 / R-31). The parent remounts the
    row when its option set changes (the row's signature), which is the
    vanilla's rebuild-on-mutation behaviour scoped to one row.
 */
export default {
    props: {
        row: {
            type: Object,
            required: true
        }
    },
    setup(props) {
        const store = useJumpsStore();
        const whenRef = ref(null);
        const answerRef = ref(null);
        const gotoRef = ref(null);
        const built = [];

        const methods = {
            remove() {
                store.removeJumpFromCurrentInput(props.row.index);
            }
        };

        onMounted(() => {
            const row = props.row;

            if (row.always) {
                built.push(initDropdown(whenRef.value, [{ value: 'ALL', label: 'always' }], 'ALL', null, true));
            } else {
                built.push(initDropdown(whenRef.value, row.whenOptions, row.whenValue, (detail) => {
                    store.updateCurrentInputJump(row.index, { when: detail.value });
                }, false));

                if (answerRef.value) {
                    built.push(initDropdown(answerRef.value, row.answerOptions, row.answerValue, row.needsAnswer ? (detail) => {
                        store.updateCurrentInputJump(row.index, { answer_ref: detail.value || '' });
                    } : null, !row.needsAnswer));
                }
            }

            built.push(initDropdown(gotoRef.value, row.destinationOptions, row.destinationValue, (detail) => {
                store.updateCurrentInputJump(row.index, { to: detail.value || '' });
            }, false));
        });

        onBeforeUnmount(() => {
            // the built dropdowns replaced the placeholders inside the row;
            // Vue only removes its own nodes, so the replacements go too
            built.forEach((dropdown) => {
                if (dropdown && dropdown.parentNode) {
                    dropdown.parentNode.removeChild(dropdown);
                }
            });
            built.length = 0;
        });

        return {
            whenRef,
            answerRef,
            gotoRef,
            ...methods
        };
    }
};
</script>

<style src="@/vue/theme/components/JumpRow.scss" lang="scss"></style>
