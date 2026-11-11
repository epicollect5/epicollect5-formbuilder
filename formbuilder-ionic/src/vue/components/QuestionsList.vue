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
                                :title="formDeletable ? 'Delete form' : cannotDeleteTitle"
                                :disabled="!formDeletable"
                                @click="deleteForm()">
                            <ion-icon name="trash-outline" aria-hidden="true"></ion-icon>
                        </button>
                        <button type="button"
                                class="builder__answers-more-btn builder__form-action-btn builder__form-action-btn--edit"
                                aria-label="Edit form name"
                                title="Edit form name"
                                @click="editFormName()">
                            <ion-icon name="create-outline" aria-hidden="true"></ion-icon>
                        </button>
                        <button type="button"
                                class="builder__answers-more-btn builder__form-action-btn builder__form-action-btn--more"
                                data-role="form-actions-trigger"
                                aria-label="Form actions"
                                title="Form actions">
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

                <VueDraggable tag="ion-list"
                              class="builder__question-list"
                              v-model="activeInputs"
                              :group="builderQuestions"
                              ghost-class="builder__question-placeholder"
                              filter=".builder__empty"
                              :force-fallback="true"
                              :fallback-on-body="true"
                              :on-move="onMove"
                              @start="onDragStart($event)"
                              @end="onDragEnd()">
                    <div class="builder__empty builder__notice builder__notice--info ion-text-center"
                         v-if="!currentInputs.length">
                        <span>Drag and drop questions from the sidebar <br/> (or import an Epicollect5 form file)</span>
                        <button type="button"
                                class="builder__import-btn builder__import-form"
                                :disabled="editing"
                                :title="editing ? 'Return to the form to import' : 'Import form'"
                                @click="importForm()">
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
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { FORM_MESSAGES } from '@/config/strings.js';
import { countTitles } from '@/models/project-limits.js';
import { getQuestionLabel } from '@/models/question-text.js';
import { areFormInputsValid, isInputValid } from '@/services/validation.js';
import { useBuilderStore } from '@/vue/stores/builder.js';
import { useFormStore } from '@/vue/stores/forms.js';
import { createMenu } from '@/ui/dropdown.js';
import QuestionRow from '@/vue/components/QuestionRow.vue';

export default {
    components: {
        QuestionRow,
        VueDraggable
    },
    setup() {
        const store = useBuilderStore();
        const forms = useFormStore();
        let menu = null;

        const methods = {
            exitContainer() {
                store.exitContainer();
            },
            deleteForm() {
                forms.deleteCurrentForm();
            },
            editFormName() {
                forms.openFormNameModal(store.currentForm);
            },
            importForm() {
                forms.importFormFile();
            },
            /*
             * Dragging selects the row immediately and shows its properties,
             * as in the vanilla list. The ref comes from the dragged element,
             * not the index: the marker event does not always line up with
             * the model order.
             */
            onDragStart(event) {
                store.beginDrag('.builder__question-list');

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
            onDragEnd() {
                store.endDrag();
            },
            /*
             * The vanilla sortable locked the drag to the list (axis y +
             * containment parent). SortableJS has no containment option, so
             * any insertion while the pointer is outside the list box is
             * refused here — the drop can only land within the list. The
             * pointer event is the second argument (and mirrored on the first,
             * the `move` event); bound as :on-move, which is the Sortable
             * option it needs to be.
             */
            onMove(event, original_event) {
                const pointer = original_event || event.originalEvent;

                if (!pointer) {
                    return true;
                }

                const list = document.querySelector('.builder__question-list');

                if (!list) {
                    return false;
                }

                const rect = list.getBoundingClientRect();

                return pointer.clientY >= rect.top && pointer.clientY <= rect.bottom &&
                    pointer.clientX >= rect.left && pointer.clientX <= rect.right;
            },
            /*
             * The form actions menu: export and print wait for a valid form,
             * delete-all is always offered. The menu carries disabled states,
             * so it is rebuilt whenever the form's validity or identity
             * changes (the vanilla rebuilt it on every render).
             */
            rebuildMenu() {
                if (menu) {
                    menu.remove();
                    menu = null;
                }

                const form_valid = areFormInputsValid(store.currentForm);

                menu = createMenu(document.querySelector('[data-role="form-actions-trigger"]'), [
                    { label: 'Export form', action: () => { forms.exportForm(); }, disabled: !form_valid },
                    { label: 'Print form', action: () => { forms.printCurrentForm(); }, disabled: !form_valid },
                    { divider: true },
                    { label: 'Delete all questions', action: () => { forms.deleteAllQuestions(); } }
                ], (item) => {
                    item.action();
                });
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

        /*
         * Only the palette's cloned tools may be dropped in: the name is the
         * palette's group, and the explicit list keeps a row dragged out of
         * another list from landing here.
         */
        const builderQuestions = {
            name: 'builder-questions',
            put: ['builder-questions']
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
                const form = store.currentForm;
                const trail = [form && form.name ? form.name : 'Form'];

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
            }),
            formDeletable: computed(() => {
                return forms.formDeletable();
            }),
            cannotDeleteTitle: FORM_MESSAGES.FORM_CANNOT_BE_DELETED
        };

        onMounted(() => {
            methods.rebuildMenu();
        });

        onBeforeUnmount(() => {
            if (menu) {
                menu.remove();
                menu = null;
            }
        });

        // the menu carries the form's validity in its disabled states, so it
        // is rebuilt whenever the form's validity or identity changes
        watch([
            () => areFormInputsValid(store.currentForm),
            () => store.currentForm,
            () => store.editing
        ], () => {
            methods.rebuildMenu();
        });

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
