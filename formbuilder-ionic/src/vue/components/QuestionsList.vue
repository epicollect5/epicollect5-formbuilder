<template>
    <section class="builder__questions" id="questions" aria-label="Questions">
        <ion-card class="builder__questions-card">
            <ion-card-header class="builder__panel-heading builder__questions-header">
                <div class="builder__questions-heading">
                    <ion-card-title class="builder__panel-title builder__questions-title" :title="titleAttr">
                        <span class="builder__questions-title-prefix">Form</span><span class="builder__questions-title-sep" aria-hidden="true"> &gt; </span><span class="builder__questions-title-name">{{ formName }}</span><template v-for="crumb in crumbs" :key="crumb.ref"><span class="builder__questions-title-sep" aria-hidden="true"> &gt; </span><span :class="crumb.class">{{ crumb.label }}</span></template>
                    </ion-card-title>

                    <div class="builder__heading-actions builder__answers-btn-group builder__form-actions-group">
                        <button type="button"
                                class="builder__answers-more-btn builder__form-action-btn builder__form-action-btn--delete"
                                aria-label="Delete form"
                                title="Delete form"
                                disabled>
                            <ion-icon name="trash-outline" aria-hidden="true"></ion-icon>
                        </button>
                        <button type="button"
                                class="builder__answers-more-btn builder__form-action-btn builder__form-action-btn--edit"
                                aria-label="Edit form name"
                                title="Edit form name"
                                disabled>
                            <ion-icon name="create-outline" aria-hidden="true"></ion-icon>
                        </button>
                        <button type="button"
                                class="builder__answers-more-btn builder__form-action-btn builder__form-action-btn--more"
                                aria-label="Form actions"
                                title="Form actions"
                                disabled>
                            <ion-icon name="chevron-down-outline" aria-hidden="true"></ion-icon>
                        </button>
                    </div>
                </div>
            </ion-card-header>

            <ion-toolbar class="builder__editing-toolbar" v-if="editing" data-role="editing-toolbar">
                <button slot="start"
                        type="button"
                        class="builder__form-button"
                        data-role="exit-editing"
                        @click="exitContainer()">
                    <ion-icon name="chevron-back-outline" aria-hidden="true"></ion-icon>
                    Exit Editing
                </button>
                <span slot="end" class="builder__editing-status" data-role="editing-status">
                    <span :class="editingStatus.class"
                          :aria-label="editingStatus.label"
                          :title="editingStatus.title">
                        <ion-icon :name="editingStatus.icon"></ion-icon>
                    </span>
                </span>
            </ion-toolbar>

            <ion-card-content class="builder__questions-content">
                <div class="builder__notice builder__notice--warning builder__title-warning"
                     v-if="showTitleWarning"
                     data-role="title-warning">
                    <span data-role="title-warning-text">{{ titleWarningText }}</span>
                    <a class="builder__info-button"
                       data-role="title-info"
                       aria-label="What is a title?"
                       href="https://docs.epicollect.net/formbuilder/title"
                       target="_blank"
                       rel="noopener noreferrer">
                        <ion-icon name="help-circle" aria-hidden="true"></ion-icon>
                    </a>
                </div>

                <input type="file"
                       class="builder__form-file"
                       data-role="form-file"
                       accept=".json,application/json"
                       hidden>

                <VueDraggable tag="ion-list"
                              class="builder__question-list"
                              v-model="activeInputs"
                              :group="builderQuestions"
                              ghost-class="builder__question-placeholder"
                              filter=".builder__empty"
                              @start="onDragStart($event)"
                              @end="onDragEnd($event)">
                    <div class="builder__empty builder__notice builder__notice--info ion-text-center"
                         v-if="!currentInputs.length">
                        <span>Drag and drop questions from the sidebar <br/> (or import an Epicollect5 form file)</span>
                        <button type="button"
                                class="builder__import-btn builder__import-form"
                                disabled>
                            <ion-icon name="cloud-upload" aria-hidden="true"></ion-icon>
                            Import
                        </button>
                    </div>

                    <QuestionRow v-for="input in currentInputs"
                                 :key="input.ref"
                                 :input="input"
                                 :inputs="currentInputs"></QuestionRow>
                </VueDraggable>
            </ion-card-content>
        </ion-card>
    </section>
</template>

<script>
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { countTitles } from '@/models/project-limits.js';
import { getQuestionLabel } from '@/models/question-text.js';
import { isInputValid } from '@/services/validation.js';
import { useBuilderStore } from '@/vue/stores/builder.js';
import QuestionRow from '@/vue/components/QuestionRow.vue';

export default {
    components: {
        QuestionRow,
        VueDraggable
    },
    setup() {
        const store = useBuilderStore();

        const methods = {
            exitContainer() {
                store.exitContainer();
            },
            /*
             * Dragging selects the row immediately and shows its properties,
             * as in the vanilla list. The ref comes from the dragged element,
             * not the index: the marker event does not always line up with
             * the model order.
             */
            onDragStart(event) {
                const ref = event.item ? event.item.getAttribute('data-input-ref') : null;

                if (ref) {
                    store.chooseInput(ref);
                }

                // a previous full click left the row focused; the native drag
                // image would carry that focus outline
                if (document.activeElement && document.activeElement !== document.body && typeof document.activeElement.blur === 'function') {
                    document.activeElement.blur();
                }
            },
            /* SortableJS does not always strip the ghost class at drop. */
            onDragEnd(event) {
                if (event.item) {
                    event.item.classList.remove('builder__question-placeholder');
                }
            }
        };

        /*
         * The draggable reports its list through v-model; the store routes
         * reorder and palette drops through the session services.
         */
        const activeInputs = computed({
            get: () => {
                return store.currentInputs;
            },
            set: (value) => {
                store.setActiveInputs(value);
            }
        });

        const builderQuestions = {
            name: 'builder-questions',
            put: true
        };

        const computedScope = {
            currentInputs: computed(() => {
                return store.currentInputs;
            }),
            editing: computed(() => {
                return store.editing;
            }),
            formName: computed(() => {
                const form = store.currentForm;

                return form && form.name ? form.name : 'Form';
            }),
            crumbs: computed(() => {
                return store.editingTrail.map((node, index) => {
                    return {
                        ref: node.ref,
                        label: getQuestionLabel(node),
                        class: `builder__questions-title-crumb${index === store.editingTrail.length - 1 ? ' is-current' : ''}`
                    };
                });
            }),
            titleAttr: computed(() => {
                const trail = [store.formName];

                store.editingTrail.forEach((node) => {
                    trail.push(getQuestionLabel(node));
                });

                return trail.join(' > ');
            }),
            editingStatus: computed(() => {
                const container = store.editingTrail.length ? store.editingTrail[store.editingTrail.length - 1] : null;
                const valid = container ? isInputValid(container, store.currentInputs) : false;

                return {
                    class: `question-state ${valid ? 'is-valid' : 'is-invalid'}`,
                    icon: valid ? 'checkmark-circle' : 'warning',
                    label: valid ? 'All questions are valid' : 'Questions have errors',
                    title: valid ? 'All questions are valid' : 'Some questions need attention'
                };
            }),
            showTitleWarning: computed(() => {
                return store.currentInputs.length > 0 && countTitles(store.currentInputs) === 0;
            }),
            titleWarningText: computed(() => {
                const trail = store.editingTrail;
                const container = trail.length ? trail[trail.length - 1] : null;

                if (!container) {
                    return 'No title set for this form yet';
                }

                return container.type === 'branch' ? 'No title set for this branch yet' : 'No title set for this group yet';
            })
        };

        return {
            activeInputs,
            builderQuestions,
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/QuestionsList.scss" lang="scss"></style>
