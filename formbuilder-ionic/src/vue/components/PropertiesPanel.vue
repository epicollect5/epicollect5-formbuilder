<template>
    <section class="builder__properties" id="properties" aria-label="Question properties">
        <ion-card class="builder__properties-card">
            <ion-card-header class="builder__panel-heading builder__properties-header">
                <div class="builder__properties-heading">
                    <span class="builder__panel-title builder__properties-title" :title="panelTitle">{{ panelTitle }}</span>

                    <div class="builder__heading-actions builder__answers-btn-group builder__form-actions-group builder__properties-actions-group"
                         :style="actionsVisibility">
                        <button type="button"
                                class="builder__answers-more-btn builder__form-action-btn"
                                data-action="copy"
                                aria-label="Copy question"
                                :disabled="!copyEnabled">
                            <ion-icon name="copy-outline" aria-hidden="true"></ion-icon>
                        </button>
                        <button type="button"
                                class="builder__answers-more-btn builder__form-action-btn builder__icon-btn--danger"
                                data-action="delete"
                                aria-label="Delete question"
                                disabled>
                            <ion-icon name="trash-outline" aria-hidden="true"></ion-icon>
                        </button>
                        <button type="button"
                                class="builder__answers-more-btn builder__form-action-btn"
                                data-action="validate"
                                aria-label="Validate question"
                                @click="validateQuestion()">
                            <ion-icon name="checkmark-circle-outline" aria-hidden="true"></ion-icon>
                        </button>
                    </div>
                </div>
            </ion-card-header>

            <ion-card-content class="builder__properties-content">
                <div class="builder__empty builder__notice builder__notice--info ion-text-center"
                     v-if="!currentInput"
                     data-role="properties-empty">Select a question to edit it.</div>

                <template v-else>
                    <ion-segment class="builder__property-tabs"
                                 :value="activeTab"
                                 @ionChange="onTabChange($event)">
                        <ion-segment-button v-for="tab in tabs"
                                            :key="tab.value"
                                            :value="tab.value"
                                            :class="{ 'is-invalid': tab.invalid }"
                                            :aria-invalid="tab.invalid ? 'true' : null">
                            <ion-label>{{ tab.label }}
                                <ion-icon v-if="tab.invalid"
                                          class="builder__property-tab-state"
                                          name="alert"
                                          aria-label="Tab has validation errors"></ion-icon>
                            </ion-label>
                        </ion-segment-button>
                    </ion-segment>

                    <div class="builder__properties-body">
                        <section class="builder__properties-panel" v-if="activeTab === 'basic'">
                            <div class="builder__question-field-group">
                                <label class="builder__field-label" data-role="question-label">{{ questionLabel }}</label>

                                <ion-input class="builder__field builder__question-field"
                                           aria-label="Question"
                                           fill="outline"
                                           :placeholder="questionPlaceholder"
                                           :maxlength="questionMaxLength"
                                           :value="questionValue"
                                           @ionInput="onQuestionInput($event)"></ion-input>

                                <p class="builder__property-error"
                                   data-role="properties-error"
                                   role="status"
                                   v-if="basicErrorMessage">{{ basicErrorMessage }}</p>
                            </div>

                            <ion-checkbox v-if="allowsRequired"
                                          justify="start"
                                          class="builder__checkbox"
                                          label-placement="end"
                                          data-field="required"
                                          :checked="requiredValue"
                                          @ionChange="onRequiredChange($event)">
                                <span>Answer is required</span>
                            </ion-checkbox>

                            <div class="builder__title-row" v-if="allowsTitle" data-field="title">
                                <ion-checkbox class="builder__checkbox builder__title-toggle"
                                              label-placement="end"
                                              :key="titleToggleKey"
                                              :checked="titleValue"
                                              @ionChange="onTitleChange($event)">
                                    <span class="builder__title-label">Use answer as title</span>
                                </ion-checkbox>
                                <a class="builder__info-button"
                                   data-role="title-info"
                                   aria-label="What is a title?"
                                   href="https://docs.epicollect.net/formbuilder/title"
                                   target="_blank"
                                   rel="noopener noreferrer">
                                    <ion-icon name="help-circle" aria-hidden="true"></ion-icon>
                                </a>
                            </div>
                        </section>

                        <section class="builder__properties-panel" v-else>
                            <p class="builder__empty">The {{ tabLabel }} tab is ported in the next phase.</p>
                        </section>
                    </div>
                </template>
            </ion-card-content>
        </ion-card>
    </section>
</template>

<script>
import { computed, reactive } from 'vue';
import { PARAMETERS } from '@/config/parameters.js';
import { VALIDATION_MESSAGES } from '@/config/strings.js';
import {
    allowsRequired,
    allowsTitle,
    hasAdvancedTab,
    isBranchOrGroup,
    isMediaType
} from '@/models/input-properties.js';
import { getQuestionLabelText, getQuestionLabel } from '@/models/question-text.js';
import { hideLoading, notifyError, notifySuccess, showLoading } from '@/services/notifications.js';
import { isInputValid } from '@/services/validation.js';
import { useBuilderStore } from '@/vue/stores/builder.js';

/* Legacy disables Jumps for anything edited inside a group; branch and group
   parents keep the tab, so they can take an "always" jump. */
const canUseJumpsTab = (editingTrail) => {
    return !editingTrail.some((node) => {
        return node.type === 'group';
    });
};

/*
    The properties card. The spike ports the basic tab (question field,
    required / title toggles, the basic-tab error message); the advanced and
    jumps panes follow in phase B, where the per-type panels are grouped by
    shape.
 */
export default {
    setup() {
        const store = useBuilderStore();

        const state = reactive({
            // the vanilla refuses a fourth title and resets the checkbox (R-12);
            // a key bump forces the ion-checkbox back to the model value
            title_toggle_nonce: 0
        });

        const methods = {
            onQuestionInput(event) {
                store.editQuestion(event.detail.value || '');
            },
            onRequiredChange(event) {
                store.toggleRequired(event.detail.checked);
            },
            onTitleChange(event) {
                const accepted = store.toggleTitle(event.detail.checked);

                if (!accepted) {
                    event.target.checked = false;
                    state.title_toggle_nonce += 1;
                }
            },
            onTabChange(event) {
                const value = event.detail.value;

                if (!value || value === store.state.active_property_tab) {
                    return;
                }

                // as in the vanilla tab binding, tabs a type cannot use stay closed
                if (value === 'advanced' && !hasAdvancedTab(store.currentInput.type)) {
                    return;
                }

                if (value === 'jumps' && !canUseJumpsTab(store.editingTrail)) {
                    return;
                }

                store.setPropertyTab(value);
            },
            validateQuestion() {
                if (!store.currentInput) {
                    return;
                }

                showLoading();

                // The overlay makes the pass, and the icons it refreshes, visible.
                setTimeout(() => {
                    hideLoading();

                    const valid = store.currentInput ? isInputValid(store.currentInput, store.currentInputs) : false;

                    if (valid) {
                        notifySuccess(VALIDATION_MESSAGES.INPUT_VALID);
                    } else {
                        notifyError(VALIDATION_MESSAGES.INPUT_NOT_VALID);
                    }
                }, 600);
            }
        };

        const currentInput = computed(() => {
            return store.currentInput;
        });

        const computedScope = {
            currentInput,
            panelTitle: computed(() => {
                return currentInput.value ? getQuestionLabel(currentInput.value) : 'Question properties';
            }),
            actionsVisibility: computed(() => {
                // keep the actions group in layout but invisible without a
                // selection, as the vanilla render does
                return currentInput.value ? {} : { visibility: 'hidden' };
            }),
            tabs: computed(() => {
                const errors = store.propertyTabErrors;

                return [
                    { value: 'basic', label: 'Properties', invalid: errors.basic },
                    { value: 'advanced', label: 'Advanced', invalid: errors.advanced },
                    { value: 'jumps', label: 'Jumps', invalid: errors.jumps }
                ];
            }),
            activeTab: computed(() => {
                return store.state.active_property_tab;
            }),
            tabLabel: computed(() => {
                return store.state.active_property_tab === 'advanced' ? 'Advanced' : 'Jumps';
            }),
            questionLabel: computed(() => {
                return currentInput.value ? getQuestionLabelText(currentInput.value.type) : 'Question';
            }),
            questionPlaceholder: computed(() => {
                return currentInput.value && isBranchOrGroup(currentInput.value.type) ?
                    'Type header here...' : 'Type question here...';
            }),
            questionMaxLength: computed(() => {
                return currentInput.value && isMediaType(currentInput.value.type) ?
                    null : PARAMETERS.QUESTION_MAX_LENGTH;
            }),
            questionValue: computed(() => {
                return currentInput.value ? (currentInput.value.question || '') : '';
            }),
            basicErrorMessage: computed(() => {
                return store.basicErrorMessage;
            }),
            allowsRequired: computed(() => {
                return currentInput.value ? allowsRequired(currentInput.value.type) : false;
            }),
            allowsTitle: computed(() => {
                return currentInput.value ? allowsTitle(currentInput.value.type) : false;
            }),
            requiredValue: computed(() => {
                return !!(currentInput.value && currentInput.value.is_required);
            }),
            titleValue: computed(() => {
                return !!(currentInput.value && currentInput.value.is_title);
            }),
            titleToggleKey: computed(() => {
                return `${currentInput.value ? currentInput.value.ref : 'none'}-${state.title_toggle_nonce}`;
            }),
            copyEnabled: computed(() => {
                return currentInput.value ? isInputValid(currentInput.value, store.currentInputs) : false;
            })
        };

        return {
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/PropertiesPanel.scss" lang="scss"></style>
