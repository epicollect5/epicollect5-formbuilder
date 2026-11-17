<template>
    <ion-modal class="legacy-modal-host"
              :class="state.class_name"
              :is-open="state.open"
              @ionModalDidDismiss="onDismiss">
        <div class="builder__modal" role="document">
            <div class="builder__modal-dialog">
                <div class="builder__modal-content">
                    <div class="builder__modal-header">
                        <button type="button"
                                class="builder__modal-close"
                                aria-label="Close"
                                @click="closeModal()">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 class="builder__modal-title">{{ state.title }}</h4>
                    </div>
                    <div class="builder__modal-body">
                        <FormNameModalBody v-if="state.kind === 'form-name'"></FormNameModalBody>
                        <DeleteQuestionModalBody v-else-if="state.kind === 'delete-question'"></DeleteQuestionModalBody>
                        <CsvImportModalBody v-else-if="state.kind === 'csv-import'"></CsvImportModalBody>
                    </div>
                    <div class="builder__modal-footer" v-if="buttons.length > 0">
                        <ion-button type="button"
                                    fill="clear"
                                    class="builder__modal-btn"
                                    :class="{ 'builder__modal-btn--start': button.align === 'start' }"
                                    :disabled="isButtonDisabled(button)"
                                    v-for="(button, index) in buttons"
                                    :key="state.kind + '-' + index"
                                    @click="onButtonClick(button)">{{ button.text }}</ion-button>
                    </div>
                </div>
            </div>
        </div>
    </ion-modal>
</template>

<script>
import { computed } from 'vue';
import { useModalStore } from '@/vue/stores/modal-store.js';
import FormNameModalBody from '@/vue/components/FormNameModalBody.vue';
import DeleteQuestionModalBody from '@/vue/components/DeleteQuestionModalBody.vue';
import CsvImportModalBody from '@/vue/components/CsvImportModalBody.vue';

/*
    The shared modal host, the Vue component form of ui/modal.js's openModal:
    the legacy-styled shell (title, close, body, footer) inside an ion-modal,
    with the backdrop, focus trap and dismissal from Ionic. One instance is
    mounted at the app root; the stores drive it through the modal store, and
    the body per `kind` keeps its own interactions (see the body components).
 */
export default {
    components: {
        FormNameModalBody,
        DeleteQuestionModalBody,
        CsvImportModalBody
    },
    setup() {
        const modal = useModalStore();

        const methods = {
            onButtonClick(button) {
                const disabled = methods.isButtonDisabled(button);

                if (disabled) {
                    return;
                }

                if (typeof button.action === 'function') {
                    button.action();
                    return;
                }

                modal.closeModal();
            },
            isButtonDisabled(button) {
                if (typeof button.disabled === 'function') {
                    return !!button.disabled();
                }

                return !!button.disabled;
            }
        };

        const computedScope = {
            buttons: computed(() => {
                return modal.state.buttons;
            })
        };

        return {
            state: modal.state,
            closeModal: modal.closeModal,
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/Modal.scss" lang="scss"></style>
