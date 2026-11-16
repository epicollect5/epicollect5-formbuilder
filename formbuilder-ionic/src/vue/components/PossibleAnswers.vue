<template>
    <ion-card class="builder__answers-card">
        <ion-card-header class="builder__answers-header">
            <div class="builder__answers-heading">
                <div class="builder__answers-title-group">
                    <ion-card-title class="builder__answers-title">Possible answers</ion-card-title>

                    <ion-badge class="builder__question-count-badge builder__answers-count-badge"
                               title="Possible answers for this question">{{ possibleAnswerCount }}</ion-badge>
                </div>

                <div class="builder__answers-btn-group">
                    <button type="button"
                            class="builder__add-answer builder__answers-add-btn"
                            :disabled="possibleAnswerAtLimit"
                            @click="addPossibleAnswer()">
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
            <Transition name="builder-answers-page-fade"
                        mode="out-in"
                        @enter="onPageShown">
                <VueDraggable tag="ul"
                              :key="possibleAnswersCurrentPage"
                              class="builder__answer-list"
                              v-model="pageAnswersModel"
                              ghost-class="builder__answer-placeholder"
                              filter="ion-input, input, textarea, button, a"
                              :prevent-on-filter="false"
                              :group="answersGroup"
                              :force-fallback="true"
                              :fallback-on-body="true"
                              :on-move="onDragMove"
                              @start="onDragStart($event)"
                              @end="onDragEnd()">
                    <li v-for="row in possibleAnswerRows"
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
                                @click="removePossibleAnswer(row.answer.answer_ref)">
                            <ion-icon name="close-circle-outline"></ion-icon>
                        </button>
                    </li>
                </VueDraggable>
            </Transition>

            <p class="builder__answers-note"
               data-role="answers-note"
               role="status"
               v-if="note.message"
               :class="{ 'is-error': note.is_error }">{{ note.message }}</p>

            <div class="builder__answers-pager"
                 data-role="answers-pager"
                 v-if="possibleAnswersPageCount > 1">
                <button type="button"
                        class="builder__answers-pager-button"
                        data-action="page-prev"
                        aria-label="Previous answers page"
                        :disabled="!canGoPrevious"
                        @click="onPageChange(possibleAnswersCurrentPage - 1)">
                    <ion-icon name="chevron-back-outline"
                              aria-hidden="true"></ion-icon>
                </button>

                <span class="builder__answers-pager-label">
                    Page
                    <span data-role="answers-page">{{ possibleAnswersCurrentPage }}</span>
                    of
                    <span data-role="answers-pages">{{ possibleAnswersPageCount }}</span>
                </span>

                <button type="button"
                        class="builder__answers-pager-button"
                        data-action="page-next"
                        aria-label="Next answers page"
                        :disabled="!canGoNext"
                        @click="onPageChange(possibleAnswersCurrentPage + 1)">
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

import { useRootStore } from '@/vue/stores/root-store.js';
import { usePossibleAnswersStore } from '@/vue/stores/possible-answers-store.js';
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
        const builder = useRootStore();
        const store = usePossibleAnswersStore();
        let menu = null;
        // the panel scroll anchor captured at the pager click, restored when
        // the incoming page enters (see onPageChange and onPageShown)
        let scroll_anchor = 0;

        const note = reactive({
            message: '',
            is_error: false
        });

        /*
         * The answers reorder inside their own list only: nothing is pulled
         * out of the card and nothing is accepted into it.
         */
        const answersGroup = {
            name: 'builder-answers',
            pull: false,
            put: false
        };

        const methods = {
            addPossibleAnswer() {
                store.addPossibleAnswer();
            },
            removePossibleAnswer(answer_ref) {
                store.removePossibleAnswer(answer_ref);
            },
            onRenameInput(answer, event) {
                store.renamePossibleAnswer(answer.answer_ref, event.detail.value || '');
            },
            onDragStart() {
                builder.beginDrag('.builder__answer-list');
            },
            onDragEnd() {
                builder.endDrag();
            },
            /*
             * SortableJS has no containment option: the insertion is refused
             * unless the pointer is vertically inside the answers list, so the
             * rows can only be reordered along it (the horizontal position is
             * irrelevant for a vertical list, hence Y only). The pointer event
             * is the second argument (and mirrored on the first, `move` event).
             */
            onDragMove(event, original_event) {
                const pointer = original_event || event.originalEvent;

                if (!pointer) {
                    return true;
                }

                const list = document.querySelector('.builder__answer-list');

                if (!list) {
                    return false;
                }

                const rect = list.getBoundingClientRect();

                return pointer.clientY >= rect.top && pointer.clientY <= rect.bottom;
            },

            /*
             * Paging is blocked while a visible answer is still empty. The
             * pages differ in height (the last one holds the remainder), so
             * the pixel scroll the panel keeps across a page change lands at
             * a different place in the new page and the pager drops out of
             * view — the list appears to scroll away from the user. Capture
             * the scroll relative to the panel's bottom: the out-in page fade
             * holds the outgoing page's height until it is gone, and the
             * anchor is restored in onPageShown, between the fades.
             */
            onPageChange(target) {
                const scroller = document.querySelector('.builder__properties-body');

                scroll_anchor = scroller ?
                    scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight :
                    0;

                if (!store.goToPossibleAnswersPage(target)) {
                    note.message = VALIDATION_MESSAGES.POSSIBLE_ANSWER_EMPTY;
                    note.is_error = true;
                    return;
                }

                note.message = '';
                note.is_error = false;
            },

            /*
             * The incoming page is in the DOM and still transparent: Vue
             * calls this hook after the insertion, before the fade-in
             * paints. Restore the bottom-anchored scroll here, so the pager
             * never moves: pages of equal height keep their scroll position
             * untouched. (@before-enter would be too early — the old page is
             * already gone and the new one is not inserted yet.)
             */
            onPageShown() {
                const scroller = document.querySelector('.builder__properties-body');

                if (scroller) {
                    scroller.scrollTop = scroller.scrollHeight - scroller.clientHeight - scroll_anchor;
                }
            },
            onExportCsv() {
                store.exportPossibleAnswersCsv();
            }
        };

        /*
         * The draggable reports the reordered page slice; the store commits it
         * page-locally through the session-mutating service.
         */
        const pageAnswersModel = computed({
            get: () => {
                return store.possibleAnswerRows.map((row) => {
                    return row.answer;
                });
            },
            set: (value) => {
                store.commitPossibleAnswersReorder(value.map((answer) => {
                    return answer.answer_ref;
                }));
            }
        });

        const computedScope = {
            possibleAnswerCount: computed(() => {
                return store.possibleAnswerCount;
            }),
            possibleAnswerAtLimit: computed(() => {
                return store.possibleAnswerAtLimit;
            }),
            possibleAnswerRows: computed(() => {
                return store.possibleAnswerRows;
            }),
            possibleAnswersCurrentPage: computed(() => {
                return store.possibleAnswersCurrentPage;
            }),
            possibleAnswersPageCount: computed(() => {
                return store.possibleAnswersPageCount;
            }),
            pageAnswersModel,
            answersGroup,
            note,
            isOnlyAnswer: computed(() => {
                return store.possibleAnswerCount === 1;
            }),
            canGoPrevious: computed(() => {
                return store.possibleAnswersCurrentPage > 1;
            }),
            canGoNext: computed(() => {
                return store.possibleAnswersCurrentPage < store.possibleAnswersPageCount;
            }),
            maxAnswerLength: PARAMETERS.MAX_ANSWER_LENGTH
        };

        onMounted(() => {
            menu = createMenu(document.querySelector('[data-role="answers-actions-trigger"]'), [
                {
                    label: 'Import CSV',
                    action: () => {
                        store.pickPossibleAnswersCsv();
                    }
                },
                {
                    label: 'Export CSV',
                    action: () => {
                        store.exportPossibleAnswersCsv();
                    }
                },
                { divider: true },
                {
                    label: 'Order ascending',
                    action: () => {
                        store.orderPossibleAnswers(PARAMETERS.POSSIBLE_ANSWERS_ORDER.AZ);
                    }
                },
                {
                    label: 'Order descending',
                    action: () => {
                        store.orderPossibleAnswers(PARAMETERS.POSSIBLE_ANSWERS_ORDER.ZA);
                    }
                },
                {
                    label: 'Shuffle',
                    action: () => {
                        store.orderPossibleAnswers(PARAMETERS.POSSIBLE_ANSWERS_ORDER.SHUFFLE);
                    }
                },
                { divider: true },
                {
                    label: 'Delete all answers',
                    action: () => {
                        store.deleteAllPossibleAnswers();
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
