<template>
    <ion-card class="builder__answers-card">
        <ion-card-header class="builder__answers-header">
            <div class="builder__answers-heading">
                <div class="builder__answers-title-group">
                    <ion-card-title class="builder__answers-title">Possible answers</ion-card-title>

                    <ion-badge class="builder__question-count-badge builder__answers-count-badge"
                               title="Possible answers for this question">{{ answerCount }}</ion-badge>
                </div>

                <div class="builder__answers-btn-group">
                    <button type="button"
                            class="builder__add-answer builder__answers-add-btn"
                            :disabled="answerAtLimit"
                            @click="addAnswer()">
                        Add answer
                    </button>

                    <div class="builder__answers-menu">
                        <button type="button"
                                class="builder__answers-more-btn"
                                data-role="answers-actions-trigger"
                                aria-label="More possible answer actions">
                            <ion-icon name="chevron-down-outline"
                                      aria-hidden="true"></ion-icon>
                        </button>
                    </div>
                </div>
            </div>
        </ion-card-header>

        <ion-card-content class="builder__answers-content">
                <VueDraggable tag="ul"
                              class="builder__answer-list"
                              v-model="pageAnswersModel"
                              ghost-class="builder__answer-placeholder"
                              filter="ion-input, input, textarea, button, a"
                              :prevent-on-filter="false"
                              @end="onDragEnd($event)">
                <li v-for="row in answerRows"
                    :key="row.answer.answer_ref"
                    class="builder__answer"
                    :data-answer-ref="row.answer.answer_ref">
                    <ion-icon name="swap-vertical-outline" aria-hidden="true"></ion-icon>

                    <ion-input class="builder__answer-field"
                               :aria-label="row.ariaLabel"
                               fill="outline"
                               :maxlength="maxAnswerLength"
                               :value="row.answer.answer"
                               @ionInput="onRenameInput(row.answer, $event)"></ion-input>

                    <button type="button"
                            class="builder__answer-remove"
                            :aria-label="row.removeLabel"
                            :disabled="isOnlyAnswer"
                            @click="removeAnswer(row.answer.answer_ref)">
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </button>
                </li>
            </VueDraggable>

            <p class="builder__answers-note"
               data-role="answers-note"
               role="status"
               v-if="note.message"
               :class="{ 'is-error': note.is_error }">{{ note.message }}</p>

            <div class="builder__answers-pager"
                 data-role="answers-pager"
                 v-if="answerPageCount > 1">
                <button type="button"
                        class="builder__answers-pager-button"
                        data-action="page-prev"
                        aria-label="Previous answers page"
                        :disabled="!canGoPrevious"
                        @click="onPageChange(answerCurrentPage - 1)">
                    <ion-icon name="chevron-back-outline"
                              aria-hidden="true"></ion-icon>
                </button>

                <span class="builder__answers-pager-label">
                    Page
                    <span data-role="answers-page">{{ answerCurrentPage }}</span>
                    of
                    <span data-role="answers-pages">{{ answerPageCount }}</span>
                </span>

                <button type="button"
                        class="builder__answers-pager-button"
                        data-action="page-next"
                        aria-label="Next answers page"
                        :disabled="!canGoNext"
                        @click="onPageChange(answerCurrentPage + 1)">
                    <ion-icon name="chevron-forward-outline"
                              aria-hidden="true"></ion-icon>
                </button>
            </div>
        </ion-card-content>
    </ion-card>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { PARAMETERS } from '@/config/parameters.js';
import { VALIDATION_MESSAGES } from '@/config/strings.js';
import { POSSIBLE_ANSWERS_ORDER } from '@/models/possible-answers.js';
import { useBuilderStore } from '@/vue/stores/builder.js';
import { createMenu } from '@/ui/dropdown.js';

/*
    The possible answers card. The list shows one page at a time; the drag
    reorder commits through the store's page-local service call. Import,
    export, ordering and delete-all live in the answers menu; the CSV options
    modal is the vanilla one (ui/modal.js + ui/dropdown.js), driven by the
    store actions.
 */
export default {
    components: {
        VueDraggable
    },
    setup() {
        const store = useBuilderStore();
        let menu = null;

        const note = reactive({
            message: '',
            is_error: false
        });

        const methods = {
            addAnswer() {
                store.addAnswer();
            },
            removeAnswer(answer_ref) {
                store.removeAnswer(answer_ref);
            },
            onRenameInput(answer, event) {
                store.renameAnswer(answer.answer_ref, event.detail.value || '');
            },
            /*
             * SortableJS does not always strip the ghost class from the
             * dropped row; a leftover would leave it visibility:hidden and
             * uneditable, so the class is removed explicitly.
             */
            onDragEnd(event) {
                if (event.item) {
                    event.item.classList.remove('builder__answer-placeholder');
                }
            },
            /* Paging is blocked while a visible answer is still empty. */
            onPageChange(target) {
                if (!store.goToAnswersPage(target)) {
                    note.message = VALIDATION_MESSAGES.POSSIBLE_ANSWER_EMPTY;
                    note.is_error = true;
                    return;
                }

                note.message = '';
                note.is_error = false;
            },
            onExportCsv() {
                store.exportAnswersCsv();
            }
        };

        /*
         * The draggable reports the reordered page slice; the store commits it
         * page-locally through the session-mutating service.
         */
        const pageAnswersModel = computed({
            get: () => {
                return store.answerRows.map((row) => {
                    return row.answer;
                });
            },
            set: (value) => {
                store.commitAnswerReorder(value.map((answer) => {
                    return answer.answer_ref;
                }));
            }
        });

        const computedScope = {
            answerCount: computed(() => {
                return store.answerCount;
            }),
            answerAtLimit: computed(() => {
                return store.answerAtLimit;
            }),
            answerRows: computed(() => {
                return store.answerRows;
            }),
            answerCurrentPage: computed(() => {
                return store.answerCurrentPage;
            }),
            answerPageCount: computed(() => {
                return store.answerPageCount;
            }),
            pageAnswersModel,
            note,
            isOnlyAnswer: computed(() => {
                return store.answerCount === 1;
            }),
            canGoPrevious: computed(() => {
                return store.answerCurrentPage > 1;
            }),
            canGoNext: computed(() => {
                return store.answerCurrentPage < store.answerPageCount;
            }),
            maxAnswerLength: PARAMETERS.MAX_ANSWER_LENGTH
        };

        onMounted(() => {
            menu = createMenu(document.querySelector('[data-role="answers-actions-trigger"]'), [
                {
                    label: 'Import CSV',
                    action: () => {
                        store.pickAnswersCsv();
                    }
                },
                {
                    label: 'Export CSV',
                    action: () => {
                        store.exportAnswersCsv();
                    }
                },
                { divider: true },
                {
                    label: 'Order ascending',
                    action: () => {
                        store.orderAnswers(POSSIBLE_ANSWERS_ORDER.AZ);
                    }
                },
                {
                    label: 'Order descending',
                    action: () => {
                        store.orderAnswers(POSSIBLE_ANSWERS_ORDER.ZA);
                    }
                },
                {
                    label: 'Shuffle',
                    action: () => {
                        store.orderAnswers(POSSIBLE_ANSWERS_ORDER.SHUFFLE);
                    }
                },
                { divider: true },
                {
                    label: 'Delete all answers',
                    action: () => {
                        store.deleteAllCurrentAnswers();
                    }
                }
            ], (item) => {
                item.action();
            });
        });

        onBeforeUnmount(() => {
            if (menu) {
                menu.remove();
                menu = null;
            }
        });

        return {
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/PossibleAnswers.scss" lang="scss"></style>
