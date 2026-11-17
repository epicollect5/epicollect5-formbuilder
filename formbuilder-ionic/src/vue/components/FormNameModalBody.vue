<template>
    <div class="builder__modal-field-group">
        <ion-input class="builder__modal-input"
                   ref="fieldRef"
                   aria-label="Form name"
                   placeholder="Type form name here..."
                   fill="outline"
                   :maxlength="maxLength"
                   :value="formNameValue"
                   @ionInput="onFieldInput"></ion-input>
        <span class="builder__field-error"
              role="status"
              :hidden="!formNameError">{{ formNameError }}</span>
    </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue';
import { PARAMETERS } from '@/config/parameters.js';
import { useFormsStore } from '@/vue/stores/forms-store.js';

/*
    The form-name modal body: the name field and its validation error. The
    field value and the error live on the forms store; the Save button in the
    shared footer runs saveFormName(). The prefill arrives with the modal
    state, so the upgrade-timing hack of the vanilla body (set the value after
    present) is unnecessary.
 */
export default {
    setup() {
        const forms = useFormsStore();
        const fieldRef = ref(null);

        const methods = {
            onFieldInput(event) {
                forms.setFormNameValue(event.detail ? event.detail.value : '');
            }
        };

        const computedScope = {
            formNameValue: computed(() => {
                return forms.state.form_name_modal.value;
            }),
            formNameError: computed(() => {
                return forms.state.form_name_modal.error;
            }),
            maxLength: PARAMETERS.FORM_NAME_MAX_LENGTH
        };

        onMounted(() => {
            const field = fieldRef.value;
            const target = field && field.$el ? field.$el : field;

            if (field && typeof field.setFocus === 'function') {
                field.setFocus();
            } else if (target && typeof target.focus === 'function') {
                target.focus();
            }
        });

        return {
            fieldRef,
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/FormNameModalBody.scss" lang="scss"></style>
