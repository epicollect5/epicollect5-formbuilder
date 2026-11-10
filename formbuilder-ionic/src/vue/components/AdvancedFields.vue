<template>
    <section class="builder__properties-panel builder__properties-panel--advanced">
        <p class="builder__empty" v-if="!advancedFields.length">No advanced properties for this question type.</p>

        <template v-else>
            <div class="builder__field-group" v-if="hasField('numeric_type')">
                <div class="builder__field-label">Number type</div>
                <ion-radio-group class="builder__radio-group"
                                 :value="numericType"
                                 @ionChange="onNumericTypeChange($event)">
                    <ion-radio justify="start" value="integer" label-placement="end">
                        <span>Integer</span>
                    </ion-radio>
                    <ion-radio justify="start" value="decimal" label-placement="end">
                        <span>Decimal</span>
                    </ion-radio>
                </ion-radio-group>
            </div>

            <div class="builder__field-group" v-if="hasField('default_number')">
                <div class="builder__field-label">Initial answer</div>
                <ion-input class="builder__field"
                           aria-label="Initial answer"
                           fill="outline"
                           type="text"
                           inputmode="decimal"
                           :maxlength="questionMaxLength"
                           :value="defaultNumberValue"
                           @ionInput="onFieldInput('default', $event)"></ion-input>
            </div>

            <div class="builder__field-group" v-if="hasField('min')">
                <div class="builder__field-label">Min value</div>
                <ion-input class="builder__field"
                           aria-label="Min value"
                           fill="outline"
                           type="text"
                           inputmode="decimal"
                           :maxlength="minMaxLength"
                           :value="minValue"
                           @ionInput="onFieldInput('min', $event)"></ion-input>
            </div>

            <div class="builder__field-group" v-if="hasField('max')">
                <div class="builder__field-label">Max value</div>
                <ion-input class="builder__field"
                           aria-label="Max value"
                           fill="outline"
                           type="text"
                           inputmode="decimal"
                           :maxlength="minMaxLength"
                           :value="maxValue"
                           @ionInput="onFieldInput('max', $event)"></ion-input>
            </div>

            <div class="builder__field-group" v-if="hasField('default_text')">
                <div class="builder__field-label">Initial answer</div>
                <ion-input class="builder__field"
                           aria-label="Initial answer"
                           fill="outline"
                           :maxlength="questionMaxLength"
                           :value="defaultTextValue"
                           @ionInput="onFieldInput('default', $event)"></ion-input>
            </div>

            <div class="builder__regex-field" v-if="hasField('regex')">
                <div class="builder__field-group">
                    <div class="builder__field-label">Match REGEX</div>
                    <ion-input class="builder__field"
                               aria-label="Match REGEX"
                               fill="outline"
                               :maxlength="regexMaxLength"
                               :value="regexValue"
                               @ionInput="onFieldInput('regex', $event)"></ion-input>
                </div>
            </div>

            <ion-checkbox justify="start"
                          class="builder__checkbox"
                          label-placement="end"
                          v-if="hasField('verify')"
                          :checked="verifyValue"
                          @ionChange="onVerifyChange($event)">
                <span data-role="verify-label">{{ verifyLabel }}</span>
            </ion-checkbox>

            <div class="builder__field-group" v-if="hasField('datetime_format')">
                <div class="builder__field-label">{{ datetimeLabel }}</div>
                <ion-radio-group class="builder__radio-group"
                                 v-if="currentType === 'date'"
                                 :value="datetimeValue"
                                 @ionChange="onDatetimeFormatChange($event)">
                    <ion-radio v-for="format in dateFormats"
                               :key="format.value"
                               justify="start"
                               :value="format.value"
                               label-placement="end">
                        <span>{{ format.label }}</span>
                    </ion-radio>
                </ion-radio-group>
                <ion-radio-group class="builder__radio-group"
                                 v-if="currentType === 'time'"
                                 :value="datetimeValue"
                                 @ionChange="onDatetimeFormatChange($event)">
                    <ion-radio v-for="format in timeFormats"
                               :key="format.value"
                               justify="start"
                               :value="format.value"
                               label-placement="end">
                        <span>{{ format.label }}</span>
                    </ion-radio>
                </ion-radio-group>
            </div>

            <ion-checkbox justify="start"
                          class="builder__checkbox"
                          label-placement="end"
                          v-if="hasField('set_to_current_datetime')"
                          :checked="setCurrentDatetimeValue"
                          @ionChange="onSetCurrentDatetimeChange($event)">
                <span data-role="datetime-label">{{ currentDatetimeLabel }}</span>
            </ion-checkbox>

            <div class="builder__field-group builder__select-group" v-if="hasField('uniqueness')">
                <label class="builder__field-label">Uniqueness</label>
                <ion-select class="builder__select"
                            aria-label="Uniqueness"
                            :value="uniquenessValue"
                            @ionChange="onUniquenessChange($event)">
                    <ion-select-option v-for="option in uniquenessOptions"
                                       :key="option.value"
                                       :value="option.value">{{ option.label }}</ion-select-option>
                </ion-select>
            </div>

            <div class="builder__field-group builder__select-group" v-if="hasField('default_choice')">
                <label class="builder__field-label">Initial answer</label>
                <ion-select class="builder__select"
                            aria-label="Initial answer"
                            :value="defaultChoiceValue"
                            @ionChange="onDefaultChoiceChange($event)">
                    <ion-select-option v-for="option in defaultChoiceOptions"
                                       :key="option.value"
                                       :value="option.value">{{ option.label }}</ion-select-option>
                </ion-select>
            </div>

            <div class="builder__field-group" v-if="hasField('search_type')">
                <div class="builder__field-label">Search type</div>
                <ion-radio-group class="builder__radio-group"
                                 :value="currentType"
                                 @ionChange="onSearchTypeChange($event)">
                    <ion-radio justify="start" value="searchsingle" label-placement="end">
                        <span>Single answer</span>
                    </ion-radio>
                    <ion-radio justify="start" value="searchmultiple" label-placement="end">
                        <span>Multiple answers</span>
                    </ion-radio>
                </ion-radio-group>
            </div>
        </template>
    </section>
</template>

<script>
import { computed } from 'vue';
import { PARAMETERS } from '@/config/parameters.js';
import { DATE_FORMATS, TIME_FORMATS } from '@/models/input-properties.js';
import { useBuilderStore } from '@/vue/stores/builder.js';
import { usePropertiesStore } from '@/vue/stores/properties.js';
import { usePossibleAnswersStore } from '@/vue/stores/possibleAnswers.js';

/*
    The advanced panel fields, gated per question type by the properties
    store's advancedFields list (services/properties.js). The radio-group,
    select and checkbox bindings replace the vanilla bind* helpers; reactivity
    replaces their refresh passes. The initial-answer select comes from the
    answers store.
 */
export default {
    setup() {
        const builder = useBuilderStore();
        const properties = usePropertiesStore();
        const answers = usePossibleAnswersStore();

        const methods = {
            hasField(name) {
                return properties.advancedFields.indexOf(name) !== -1;
            },
            onFieldInput(property, event) {
                properties.editAdvancedField(property, event.detail.value || '');
            },
            onVerifyChange(event) {
                properties.toggleVerify(event.detail.checked);
            },
            onSetCurrentDatetimeChange(event) {
                properties.toggleSetToCurrentDatetime(event.detail.checked);
            },
            onNumericTypeChange(event) {
                properties.setNumericType(event.detail.value);
            },
            onSearchTypeChange(event) {
                properties.setSearchType(event.detail.value);
            },
            onDatetimeFormatChange(event) {
                properties.setDatetimeFormat(event.detail.value);
            },
            onUniquenessChange(event) {
                properties.setUniqueness(event.detail.value);
            },
            onDefaultChoiceChange(event) {
                answers.setDefaultChoice(event.detail.value);
            }
        };

        const currentInput = computed(() => {
            return builder.currentInput;
        });

        const currentType = computed(() => {
            return currentInput.value ? currentInput.value.type : null;
        });

        const computedScope = {
            advancedFields: computed(() => {
                return properties.advancedFields;
            }),
            currentType,
            numericType: computed(() => {
                return properties.numericType;
            }),
            verifyLabel: computed(() => {
                return properties.verifyLabel;
            }),
            verifyValue: computed(() => {
                return !!(currentInput.value && currentInput.value.verify === true);
            }),
            datetimeLabel: computed(() => {
                return properties.datetimeLabel;
            }),
            currentDatetimeLabel: computed(() => {
                return properties.currentDatetimeLabel;
            }),
            setCurrentDatetimeValue: computed(() => {
                return !!(currentInput.value && currentInput.value.set_to_current_datetime === true);
            }),
            datetimeValue: computed(() => {
                return currentInput.value ? (currentInput.value.datetime_format || '') : '';
            }),
            dateFormats: DATE_FORMATS,
            timeFormats: TIME_FORMATS,
            defaultNumberValue: computed(() => {
                return properties.defaultNumberValue;
            }),
            minValue: computed(() => {
                return properties.minValue;
            }),
            maxValue: computed(() => {
                return properties.maxValue;
            }),
            defaultTextValue: computed(() => {
                return properties.defaultTextValue;
            }),
            regexValue: computed(() => {
                return properties.regexValue;
            }),
            uniquenessOptions: computed(() => {
                return properties.uniquenessOptions;
            }),
            uniquenessValue: computed(() => {
                return properties.uniquenessValue;
            }),
            defaultChoiceOptions: computed(() => {
                return answers.defaultChoiceOptions;
            }),
            defaultChoiceValue: computed(() => {
                return answers.defaultChoiceValue;
            }),
            questionMaxLength: PARAMETERS.QUESTION_MAX_LENGTH,
            minMaxLength: PARAMETERS.MIN_MAX_LENGTH,
            regexMaxLength: PARAMETERS.REGEX_MAX_LENGTH
        };

        return {
            ...methods,
            ...computedScope
        };
    },
    mounted() {
        // the null-format repair runs when the panel builds, as in the vanilla
        usePropertiesStore().ensureDatetimeFormat();
    }
};
</script>

<style src="@/vue/theme/components/AdvancedFields.scss" lang="scss"></style>
