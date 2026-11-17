<template>
    <div class="builder__csv-import">
        <ion-grid class="builder__csv-dataset-grid">
            <ion-row class="ion-align-items-center">
                <ion-col size="6">
                    <label>Select which dataset to import</label>
                </ion-col>
                <ion-col size="6">
                    <Dropdown :options="csvColumnOptions"
                              :value="csvSelectedColumn"
                              :placeholder="columnPlaceholder"
                              :aria-label="columnLabel"
                              @change="onColumnChange"></Dropdown>
                </ion-col>
            </ion-row>
        </ion-grid>

        <hr>

        <ion-checkbox justify="start"
                      class="builder__checkbox"
                      label-placement="end"
                      :checked="csvHeadersChecked"
                      @ionChange="onHeadersChange">
            <span>First row contains headers</span>
        </ion-checkbox>

        <hr>

        <ion-radio-group class="builder__radio-group builder__csv-mode"
                         :value="csvMode"
                         @ionChange="onModeChange">
            <ion-radio justify="start" value="replace" label-placement="end">
                <span>Replace all existing possible answers</span>
            </ion-radio>
            <ion-radio justify="start" value="append" label-placement="end">
                <span>Append to existing possible answers</span>
            </ion-radio>
        </ion-radio-group>
    </div>
</template>

<script>
import { computed } from 'vue';
import { ANSWERS_MESSAGES } from '@/config/strings.js';
import { usePossibleAnswersStore } from '@/vue/stores/possible-answers-store.js';
import Dropdown from '@/vue/components/Dropdown.vue';

/*
    The CSV import options body, ported from csv-import-modal-body.html: the
    dataset column select (the shared Dropdown), the headers toggle and the
    replace / append mode. The state lives on the answers store; toggling the
    headers resets the selected column like the vanilla binding, and the
    footer's Import button is gated on the selected column through its
    disabled predicate.
 */
export default {
    components: {
        Dropdown
    },
    setup() {
        const store = usePossibleAnswersStore();

        const methods = {
            onColumnChange(detail) {
                store.setCsvColumn(detail.value);
            },
            onHeadersChange(event) {
                store.setCsvHeaders(event.detail.checked);
            },
            onModeChange(event) {
                store.setCsvMode(event.detail.value);
            }
        };

        const computedScope = {
            csvColumnOptions: computed(() => {
                return store.csvColumnOptions;
            }),
            csvSelectedColumn: computed(() => {
                return store.state.csv_import.selected_column;
            }),
            csvHeadersChecked: computed(() => {
                return store.state.csv_import.headers;
            }),
            csvMode: computed(() => {
                return store.state.csv_import.mode;
            }),
            columnPlaceholder: ANSWERS_MESSAGES.CSV_PICK_COLUMN,
            columnLabel: ANSWERS_MESSAGES.CSV_COLUMN_LABEL
        };

        return {
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/CsvImportModalBody.scss" lang="scss"></style>
