import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import {
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar
} from '@ionic/vue';
import FormTabsStrip from '@/vue/components/FormTabsStrip.vue';
import QuestionsList from '@/vue/components/QuestionsList.vue';
import QuestionRow from '@/vue/components/QuestionRow.vue';
import PropertiesPanel from '@/vue/components/PropertiesPanel.vue';
import { setProject, selectInput } from '@/services/session.js';

/*
    Component tests for the Vue spike surfaces. The Ionic Vue wrappers are
    registered explicitly (the IonicVue plugin is app boot only), so the event
    bridges and prop writes behave as they do in the browser.
 */

function project_definition() {
    return {
        data: {
            project: {
                ref: 'proj_1',
                name: 'Vue components test',
                slug: 'vue-components-test',
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
                                question: 'What is your name?',
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
                    }
                ]
            }
        }
    };
}

const mountOptions = () => {
    return {
        global: {
            plugins: [createPinia()],
            components: {
                IonBadge,
                IonButton,
                IonButtons,
                IonCard,
                IonCardContent,
                IonCardHeader,
                IonCardTitle,
                IonCheckbox,
                IonContent,
                IonHeader,
                IonIcon,
                IonInput,
                IonItem,
                IonLabel,
                IonList,
                IonSegment,
                IonSegmentButton,
                IonTitle,
                IonToolbar
            }
        }
    };
};

const fireIonEvent = (wrapper, selector, event_name, detail) => {
    const target = wrapper.find(selector);

    target.element.dispatchEvent(new CustomEvent(event_name, { detail }));
    return nextTick();
};

describe('vue form tab strip', () => {
    beforeEach(() => {
        setProject(project_definition());
    });

    it('renders one tab per form with its count badge and name', async () => {
        const wrapper = mount(FormTabsStrip, mountOptions());

        const tabs = wrapper.findAll('.builder__form-tab');

        expect(tabs).toHaveLength(1);
        expect(tabs[0].attributes('title')).toBe('Form 1');
        // the value travels as a stencil property, not a reflected attribute
        expect(tabs[0].element.value).toBe('0');
        expect(tabs[0].attributes('aria-selected')).toBe('true');
        expect(tabs[0].find('.builder__question-count-badge').text()).toBe('1');
        // a valid form shows no warning icon
        expect(tabs[0].find('.builder__form-tab-state').exists()).toBe(false);
    });

    it('shows the warning icon once the form is invalid', async () => {
        const wrapper = mount(FormTabsStrip, mountOptions());

        selectInput('form_1_text');

        const { useBuilderStore } = await import('@/vue/stores/builder.js');
        const store = useBuilderStore(wrapper.vm.$.appContext.config.globalProperties.$pinia);

        store.editQuestion('');

        await nextTick();

        expect(wrapper.find('.builder__form-tab-state').exists()).toBe(true);
    });
});

describe('vue question row', () => {
    beforeEach(() => {
        setProject(project_definition());
    });

    it('renders the row markup with the type icon and validity state', async () => {
        const { getCurrentInputs } = await import('@/services/session.js');
        const inputs = getCurrentInputs();

        const wrapper = mount(QuestionRow, Object.assign({}, mountOptions(), {
            props: {
                input: inputs[0],
                inputs
            }
        }));

        expect(wrapper.classes()).toContain('builder__question');
        expect(wrapper.attributes('data-input-ref')).toBe('form_1_text');
        // the fixture question is non-empty text: valid
        expect(wrapper.attributes('data-valid')).toBe('true');
        expect(wrapper.find('.builder__question-text').text()).toBe('What is your name?');
        expect(wrapper.find('.question-state.is-valid').exists()).toBe(true);
    });

    it('selects the question on click', async () => {
        const { getCurrentInputs, getSession } = await import('@/services/session.js');
        const inputs = getCurrentInputs();

        const wrapper = mount(QuestionRow, Object.assign({}, mountOptions(), {
            props: {
                input: inputs[0],
                inputs
            }
        }));

        await wrapper.trigger('click');

        expect(getSession().current_input_ref).toBe('form_1_text');
        expect(wrapper.attributes('aria-current')).toBe('true');
    });
});

describe('vue questions list', () => {
    beforeEach(() => {
        setProject(project_definition());
    });

    it('renders the card title and the question rows', async () => {
        const wrapper = mount(QuestionsList, mountOptions());

        expect(wrapper.find('.builder__questions-title-name').text()).toBe('Form 1');
        expect(wrapper.findAll('.builder__question')).toHaveLength(1);
        expect(wrapper.find('.builder__empty').exists()).toBe(false);
    });

    it('shows the empty state when the form has no questions', async () => {
        const { removeInput } = await import('@/services/session.js');
        const wrapper = mount(QuestionsList, mountOptions());

        removeInput('form_1_text');

        await nextTick();

        expect(wrapper.findAll('.builder__question')).toHaveLength(0);
        expect(wrapper.find('.builder__empty').exists()).toBe(true);
        expect(wrapper.find('.builder__empty .builder__import-form').exists()).toBe(true);
    });

    it('shows the no-title warning when questions exist without a title', async () => {
        const wrapper = mount(QuestionsList, mountOptions());

        expect(wrapper.find('[data-role="title-warning"]').exists()).toBe(true);
        expect(wrapper.find('[data-role="title-warning-text"]').text()).toBe('No title set for this form yet');
    });
});

describe('vue properties panel', () => {
    beforeEach(() => {
        setProject(project_definition());
    });

    it('shows the empty state without a selection', async () => {
        const wrapper = mount(PropertiesPanel, mountOptions());

        expect(wrapper.find('[data-role="properties-empty"]').exists()).toBe(true);
        expect(wrapper.find('.builder__property-tabs').exists()).toBe(false);
    });

    it('renders the basic panel for the selected question', async () => {
        selectInput('form_1_text');

        const wrapper = mount(PropertiesPanel, mountOptions());

        expect(wrapper.find('[data-role="properties-empty"]').exists()).toBe(false);
        expect(wrapper.find('.builder__panel-title').text()).toBe('What is your name?');
        expect(wrapper.find('[data-role="question-label"]').text()).toBe('Question');

        const field = wrapper.find('.builder__question-field');

        expect(field.element.maxlength).toBe(255);
    });

    it('round-trips a keystroke through the store and surfaces the error message', async () => {
        selectInput('form_1_text');

        const wrapper = mount(PropertiesPanel, mountOptions());

        // the fixture question is valid, so no error shows
        expect(wrapper.find('.builder__property-error').exists()).toBe(false);

        await fireIonEvent(wrapper, '.builder__question-field', 'ionInput', { value: '' });

        // an empty question text invalidates the basic tab: badge and message
        expect(wrapper.find('.builder__property-error').exists()).toBe(true);
        expect(wrapper.find('.builder__property-error').text()).toBe('This field cannot be empty');

        const basic_tab = wrapper.findAll('.builder__property-tabs ion-segment-button')[0];

        expect(basic_tab.classes()).toContain('is-invalid');
    });

    it('toggles required through the checkbox event', async () => {
        selectInput('form_1_text');

        const { getCurrentInput } = await import('@/services/session.js');
        const wrapper = mount(PropertiesPanel, mountOptions());

        await fireIonEvent(wrapper, '[data-field="required"]', 'ionChange', { checked: true });

        expect(getCurrentInput().is_required).toBe(true);
    });
});
