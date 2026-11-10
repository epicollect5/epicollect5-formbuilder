'use strict';

import { createPinia, setActivePinia } from 'pinia';
import { setProject } from '@/services/session.js';

/*
 * Shared fixture for the Vue store tests: a minimal two-form project with one
 * empty text question, plus the pinia/session boot every store test needs.
 */
export const project_definition = () => {
    return {
        data: {
            project: {
                ref: 'proj_1',
                name: 'Vue store test',
                slug: 'vue-store-test',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Form 1',
                        slug: 'form-1',
                        type: 'hierarchy',
                        inputs: [
                            {
                                ref: 'form_1_text',
                                type: 'text',
                                question: '',
                                is_title: false,
                                is_required: false,
                                uniqueness: 'none',
                                regex: '',
                                default: '',
                                verify: false,
                                max: '',
                                min: '',
                                datetime_format: '',
                                set_to_current_datetime: false,
                                possible_answers: [],
                                jumps: [],
                                branch: [],
                                group: []
                            }
                        ]
                    },
                    {
                        ref: 'form_2',
                        name: 'Form 2',
                        slug: 'form-2',
                        type: 'hierarchy',
                        inputs: []
                    }
                ]
            }
        }
    };
};

export const bootStoreTest = () => {
    setActivePinia(createPinia());
    setProject(project_definition());
};
