<template>
    <section class="builder__properties" id="properties" aria-label="Question properties">
        <!--
            The card fades on selection, as the legacy builder did: the previous
            form was hidden and the new one faded in (ANIMATION_NORMAL = 150ms,
            its buttons ANIMATION_FAST = 100ms). The key is the selection, so
            tab switches inside one question do not re-trigger the fade.
        -->
        <Transition name="builder-properties-fade" mode="out-in">
            <ion-card class="builder__properties-card" :key="panelKey">
                <ion-card-header class="builder__panel-heading builder__properties-header">
                    <div class="builder__properties-heading">
                        <span class="builder__panel-title builder__properties-title" :title="panelTitle">{{ panelTitle }}</span>

                        <div class="builder__heading-actions builder__answers-btn-group builder__form-actions-group builder__properties-actions-group"
                             :style="actionsVisibility">
                            <button type="button"
                                    class="builder__answers-more-btn builder__form-action-btn"
                                    data-action="copy"
                                    aria-label="Copy question"
                                    :disabled="!copyEnabled"
                                    @click="copyQuestion()">
                                <ion-icon name="copy-outline" aria-hidden="true"></ion-icon>
                            </button>
                            <button type="button"
                                    class="builder__answers-more-btn builder__form-action-btn builder__icon-btn--danger"
                                    data-action="delete"
                                    aria-label="Delete question"
                                    @click="requestDeleteQuestion()">
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
                    <BuilderNotice variant="info"
                                   class="builder__empty ion-text-center"
                                   v-if="!currentInput"
                                   data-role="properties-empty">Select a question to edit it.</BuilderNotice>

                    <template v-else>
                        <ion-segment class="builder__property-tabs"
                                     :value="activeTab"
                                     @ionChange="onTabChange($event)">
                            <ion-segment-button v-for="tab in tabs"
                                                :key="tab.value"
                                                :value="tab.value"
                                                :disabled="tab.disabled"
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

                        <div class="builder__properties-body" ref="scrollerRef">
                            <section class="builder__properties-panel" v-if="activeTab === 'basic'">
                                <ReadmeEditor v-if="isReadme"
                                              :key="currentInput.ref"></ReadmeEditor>

                                <template v-else>
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
                                                      :disabled="titleLimitReached"
                                                      @ionChange="onTitleChange($event)">
                                            <span class="builder__title-label">{{ titleToggleLabel }}</span>
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

                                    <ion-grid class="builder__edit-container-grid"
                                              data-role="edit-container-grid"
                                              v-if="isBranchOrGroupType">
                                        <ion-row class="ion-no-padding">
                                            <ion-col size="4" class="ion-no-padding">
                                                <button type="button"
                                                        class="builder__form-button builder__edit-container"
                                                        data-role="edit-container"
                                                        :disabled="editContainerDisabled"
                                                        @click="enterContainer()">
                                                    <ion-icon name="create" aria-hidden="true"></ion-icon>
                                                    <span data-role="edit-container-label">{{ editContainerLabel }}</span>
                                                </button>
                                            </ion-col>
                                        </ion-row>
                                    </ion-grid>
                                </template>

                                <PossibleAnswers v-if="showPossibleAnswers"
                                                 :key="currentInput.ref + '-answers'"></PossibleAnswers>
                            </section>

                            <AdvancedFields v-else-if="activeTab === 'advanced'"
                                            :key="currentInput.ref + '-advanced'"></AdvancedFields>

                            <JumpsPanel v-else
                                        :key="currentInput.ref + '-jumps'"></JumpsPanel>
                        </div>
                    </template>
                </ion-card-content>
            </ion-card>
        </Transition>
    </section>
</template>

<script>
import { computed, provide, reactive, ref } from 'vue';
import { PARAMETERS } from '@/config/parameters.js';
import { QUESTION_TYPE } from '@/config/question-types.js';
import { VALIDATION_MESSAGES } from '@/config/strings.js';
import {
    allowsRequired,
    allowsTitle,
    hasAdvancedTab,
    isBranchOrGroup
} from '@/models/input-properties.js';
import { getQuestionLabel, getQuestionLabelText } from '@/models/question-text.js';
import { countTitles } from '@/models/project-limits.js';
import { PANEL_MESSAGES } from '@/config/strings.js';
import { hideLoading, notifyError, notifySuccess, showLoading } from '@/services/notifications.js';
import { isInputValid } from '@/services/validation.js';
import { useRootStore } from '@/vue/stores/root-store.js';
import { usePossibleAnswersStore } from '@/vue/stores/possible-answers-store.js';
import AdvancedFields from '@/vue/components/AdvancedFields.vue';
import ReadmeEditor from '@/vue/components/ReadmeEditor.vue';
import PossibleAnswers from '@/vue/components/PossibleAnswers.vue';
import JumpsPanel from '@/vue/components/JumpsPanel.vue';
import BuilderNotice from '@/vue/components/BuilderNotice.vue';

/* Legacy disables Jumps for anything edited inside a group; branch and group
   parents keep the tab, so they can take an "always" jump. */
const canUseJumpsTab = (editingTrail) => {
    return !editingTrail.some((node) => {
        return node.type === QUESTION_TYPE.GROUP;
    });
};

/*
    The properties card. The basic tab carries the question field (or the
    Tiptap readme editor) with the required / title toggles; the advanced tab
    renders the per-type fields; jumps lands in its own phase.
 */
export default {
    components: {
        AdvancedFields,
        ReadmeEditor,
        PossibleAnswers,
        JumpsPanel,
        BuilderNotice
    },
    setup() {
        const store = useRootStore();
        const possibleAnswers = usePossibleAnswersStore();

        /*
         * The panel owns the scroll container; the answers card pages inside
         * it and anchors its pager scroll there. The scroller element is
         * provided as a ref, the declared contract between the two
         * components, instead of a class-name lookup from below.
         */
        const scrollerRef = ref(null);

        provide('propertiesScroller', scrollerRef);

        const state = reactive({
            // the vanilla refuses a fourth title and resets the checkbox (R-12);
            // a key bump forces the ion-checkbox back to the model value
            title_toggle_nonce: 0
        });

        const methods = {
            onQuestionInput(event) {
                store.editQuestion(event.detail.value || '');
            },
            enterContainer() {
                store.enterContainer(store.currentInput.ref);
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

                // as in the vanilla tab binding, tabs a type cannot use stay
                // closed: snap the segment back to the active tab, or the
                // Ionic segment would visually sit on the blocked tab while
                // the panel keeps showing the previous content
                if ((value === 'advanced' && !hasAdvancedTab(store.currentInput.type)) ||
                    (value === 'jumps' && !canUseJumpsTab(store.editingTrail))) {
                    event.target.value = store.state.active_property_tab;
                    return;
                }

                store.setPropertyTab(value);
            },
            copyQuestion() {
                store.copyQuestion();
            },
            requestDeleteQuestion() {
                store.requestDeleteQuestion();
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

        /*
         * Legacy disables the title checkbox and swaps its label once three
         * titles are checked and the edited question is not one of them.
         */
        const titleLimitReached = computed(() => {
            return !!(currentInput.value && !currentInput.value.is_title &&
                countTitles(store.currentInputs) >= PARAMETERS.TITLES_MAX);
        });

        const computedScope = {
            currentInput,
            /* The fade re-triggers per selection; the ref (or the empty state) is its key. */
            panelKey: computed(() => {
                return currentInput.value ? currentInput.value.ref : 'none';
            }),
            panelTitle: computed(() => {
                return currentInput.value ? getQuestionLabel(currentInput.value) : PANEL_MESSAGES.PANEL_TITLE;
            }),
            actionsVisibility: computed(() => {
                // keep the actions group in layout but invisible without a
                // selection, as the vanilla render does
                return currentInput.value ? {} : { visibility: 'hidden' };
            }),
            /*
             * Tabs a type cannot use are disabled, not just refused on
             * change: the closed tab reads as unavailable in the strip.
             */
            tabs: computed(() => {
                const errors = store.propertyTabErrors;
                const type = currentInput.value ? currentInput.value.type : null;

                return [
                    { value: 'basic', label: 'Properties', invalid: errors.basic, disabled: false },
                    { value: 'advanced', label: 'Advanced', invalid: errors.advanced, disabled: !type || !hasAdvancedTab(type) },
                    { value: 'jumps', label: 'Jumps', invalid: errors.jumps, disabled: !canUseJumpsTab(store.editingTrail) }
                ];
            }),
            activeTab: computed(() => {
                return store.state.active_property_tab;
            }),
            isReadme: computed(() => {
                return !!currentInput.value && currentInput.value.type === QUESTION_TYPE.README;
            }),
            isBranchOrGroupType: computed(() => {
                return !!currentInput.value && isBranchOrGroup(currentInput.value.type);
            }),
            editContainerLabel: computed(() => {
                return currentInput.value && currentInput.value.type === QUESTION_TYPE.BRANCH ? PANEL_MESSAGES.EDIT_BRANCH : PANEL_MESSAGES.EDIT_GROUP;
            }),
            /* Legacy disables Edit while a branch/group header is empty. */
            editContainerDisabled: computed(() => {
                return !currentInput.value || String(currentInput.value.question || '').trim() === '';
            }),
            showPossibleAnswers: computed(() => {
                return possibleAnswers.showPossibleAnswers;
            }),
            questionLabel: computed(() => {
                if (!currentInput.value) {
                    return PANEL_MESSAGES.QUESTION_LABEL;
                }

                return getQuestionLabelText(currentInput.value.type);
            }),
            questionPlaceholder: computed(() => {
                return currentInput.value && isBranchOrGroup(currentInput.value.type) ?
                    PANEL_MESSAGES.HEADER_PLACEHOLDER : PANEL_MESSAGES.QUESTION_PLACEHOLDER;
            }),
            /*
             * Every type caps its text at QUESTION_MAX_LENGTH — the sanitizer
             * stores nothing longer. Ionic turns a null maxlength into 0, which
             * made the media fields refuse every keystroke.
             */
            questionMaxLength: PARAMETERS.QUESTION_MAX_LENGTH,
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
            titleLimitReached,
            titleToggleLabel: computed(() => {
                return titleLimitReached.value ? PANEL_MESSAGES.TITLE_LIMIT_REACHED : PANEL_MESSAGES.TITLE_LABEL;
            }),
            titleToggleKey: computed(() => {
                return `${currentInput.value ? currentInput.value.ref : 'none'}-${state.title_toggle_nonce}`;
            }),
            copyEnabled: computed(() => {
                return currentInput.value ? isInputValid(currentInput.value, store.currentInputs) : false;
            })
        };

        return {
            scrollerRef,
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/PropertiesPanel.scss" lang="scss"></style>
