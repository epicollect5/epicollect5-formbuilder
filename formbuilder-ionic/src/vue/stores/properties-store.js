'use strict';

import { QUESTION_TYPE } from '@/config/question-types.js';
import { computed } from 'vue';
import { defineStore } from 'pinia';
import { getForms } from '@/models/project-definition.js';
import { getDefaultDatetimeFormat } from '@/models/input-properties.js';
import { getAdvancedFields } from '@/services/properties.js';
import { getCurrentForm, getCurrentInput, getEditingTrail, updateCurrentInput } from '@/services/session.js';
import { PANEL_MESSAGES } from '@/config/strings.js';
import { useRootStore } from '@/vue/stores/root-store.js';

/* Vanilla parity: the double-entry label wording per question type. */
const DOUBLE_ENTRY_VERIFICATION_TYPES = [QUESTION_TYPE.TEXT, QUESTION_TYPE.PHONE];

/*
 * The advanced properties panel's actions and derived fields. The per-type
 * field list comes from services/properties.js; mutations go through the
 * session services and the builder store's recordChange (the composed-store
 * pattern), so the undo and save gates stay in one place.
 */
export const usePropertiesStore = defineStore('properties', () => {
    const builder = useRootStore();

    const methods = {
        /* Advanced-panel text/number fields: an empty input stores null. */
        editAdvancedField(property, value) {
            const next = {};

            next[property] = value === '' ? null : value;
            updateCurrentInput(next);
            builder.recordChange({ throttle: true });
        },
        toggleVerify(checked) {
            updateCurrentInput({ verify: !!checked });
            builder.recordChange();
        },
        toggleSetToCurrentDatetime(checked) {
            updateCurrentInput({ set_to_current_datetime: !!checked });
            builder.recordChange();
        },
        setNumericType(next_type) {
            if (next_type !== QUESTION_TYPE.INTEGER && next_type !== QUESTION_TYPE.DECIMAL) {
                return;
            }

            updateCurrentInput({ type: next_type });
            builder.recordChange();
        },
        setSearchType(next_type) {
            if (next_type !== QUESTION_TYPE.SEARCH_SINGLE && next_type !== QUESTION_TYPE.SEARCH_MULTIPLE) {
                return;
            }

            updateCurrentInput({ type: next_type });
            builder.recordChange();
        },
        setDatetimeFormat(value) {
            updateCurrentInput({ datetime_format: value });
            builder.recordChange();
        },
        setUniqueness(value) {
            updateCurrentInput({ uniqueness: value || 'none' });
            builder.recordChange();
        },
        /*
         * Imported date/time questions can arrive with a null format; legacy
         * checks its default radio, so the definition must carry it too. The
         * vanilla applies this when the advanced panel builds, unrecorded —
         * the same timing and semantics apply here.
         */
        ensureDatetimeFormat() {
            const input = getCurrentInput();

            if (!input || (input.type !== QUESTION_TYPE.DATE && input.type !== QUESTION_TYPE.TIME)) {
                return;
            }

            if (!input.datetime_format) {
                updateCurrentInput({ datetime_format: getDefaultDatetimeFormat(input.type) });
            }
        }
    };

    /*
     * The uniqueness option list is referenced by its value computed, so it
     * is declared before the grouped scope.
     */
    const uniquenessOptions = computed(() => {
        const form = getCurrentForm();
        const form_name = form ? form.name : 'this form';
        const forms = getForms(builder.state.session.project_definition);
        const form_index = form ? forms.indexOf(form) : 0;
        const branch_container = getEditingTrail().find((node) => {
            return node.type === QUESTION_TYPE.BRANCH;
        });
        const branch_header = branch_container && branch_container.question ? branch_container.question : 'branch';
        const options = [{ value: 'none', label: PANEL_MESSAGES.NO_UNIQUENESS }];

        if (branch_container) {
            options.push({
                value: 'form',
                label: `Make answer unique to all ${branch_header} entries of a ${form_name} entry`
            });
        } else if (form_index > 0) {
            const parent_name = forms[form_index - 1] ? forms[form_index - 1].name : 'parent form';

            options.push({ value: 'form', label: `All ${form_name} entries` });
            options.push({ value: 'hierarchy', label: `Only ${form_name} children of a ${parent_name} parent entry` });
        } else {
            options.push({ value: 'form', label: `Make answer unique to all ${form_name} entries` });
        }

        return options;
    });

    const computedScope = {
        /*
         * The advanced panel: which fields the current question type shows
         * (services/properties.js owns the per-type list).
         */
        advancedFields: computed(() => {
            const input = getCurrentInput();

            return input ? getAdvancedFields(input.type) : [];
        }),
        verifyLabel: computed(() => {
            const input = getCurrentInput();

            return input && DOUBLE_ENTRY_VERIFICATION_TYPES.indexOf(input.type) !== -1 ?
                PANEL_MESSAGES.VERIFY_DOUBLE_LABEL : PANEL_MESSAGES.VERIFY_LABEL;
        }),
        numericType: computed(() => {
            const input = getCurrentInput();

            return input && input.type === QUESTION_TYPE.DECIMAL ? QUESTION_TYPE.DECIMAL : QUESTION_TYPE.INTEGER;
        }),
        datetimeLabel: computed(() => {
            const input = getCurrentInput();

            return input && input.type === QUESTION_TYPE.TIME ? PANEL_MESSAGES.TIME_FORMAT_LABEL : PANEL_MESSAGES.DATE_FORMAT_LABEL;
        }),
        currentDatetimeLabel: computed(() => {
            const input = getCurrentInput();

            return input && input.type === QUESTION_TYPE.DATE ?
                PANEL_MESSAGES.SET_CURRENT_DATE_LABEL : PANEL_MESSAGES.SET_CURRENT_TIME_LABEL;
        }),
        defaultNumberValue: computed(() => {
            const input = getCurrentInput();

            return input && input.default !== null && input.default !== undefined ? String(input.default) : '';
        }),
        minValue: computed(() => {
            const input = getCurrentInput();

            return input && input.min !== null && input.min !== undefined ? String(input.min) : '';
        }),
        maxValue: computed(() => {
            const input = getCurrentInput();

            return input && input.max !== null && input.max !== undefined ? String(input.max) : '';
        }),
        defaultTextValue: computed(() => {
            const input = getCurrentInput();

            return input && input.default ? input.default : '';
        }),
        regexValue: computed(() => {
            const input = getCurrentInput();

            return input && input.regex ? input.regex : '';
        }),
        /*
         * The uniqueness dropdown options, branch-scoped like the legacy
         * builder: inside a branch, 'form' means unique to the branch entries.
         */
        uniquenessOptions: computed(() => {
            return uniquenessOptions.value;
        }),
        uniquenessValue: computed(() => {
            const input = getCurrentInput();
            const current = input ? (input.uniqueness || 'none') : 'none';

            return uniquenessOptions.value.some((option) => {
                return option.value === current;
            }) ? current : 'none';
        })
    };

    return {
        ...methods,
        ...computedScope
    };
});
