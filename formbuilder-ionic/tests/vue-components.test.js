import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
    IonModal,
    IonPopover,
    IonRadio,
    IonRadioGroup,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar
} from '@ionic/vue';
import FormTabsStrip from '@/vue/components/FormTabsStrip.vue';
import QuestionsList from '@/vue/components/QuestionsList.vue';
import QuestionRow from '@/vue/components/QuestionRow.vue';
import PropertiesPanel from '@/vue/components/PropertiesPanel.vue';
import PossibleAnswers from '@/vue/components/PossibleAnswers.vue';
import AdvancedFields from '@/vue/components/AdvancedFields.vue';
import ReadmeEditor from '@/vue/components/ReadmeEditor.vue';
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

/* Three titles are already checked, so a fourth question is at the cap. */
function title_limit_definition() {
    const definition = project_definition();
    const base = definition.data.project.forms[0].inputs[0];

    definition.data.project.forms[0].inputs = [
        Object.assign({}, base, { ref: 'form_1_title_1', question: 'Title one', is_title: true }),
        Object.assign({}, base, { ref: 'form_1_title_2', question: 'Title two', is_title: true }),
        Object.assign({}, base, { ref: 'form_1_title_3', question: 'Title three', is_title: true }),
        Object.assign({}, base, { ref: 'form_1_plain', question: 'Plain question', is_title: false })
    ];

    return definition;
}

const mountOptions = (pinia) => {
    return {
        global: {
            plugins: [pinia || createPinia()],
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
                IonModal,
                IonPopover,
                IonRadio,
                IonRadioGroup,
                IonSelect,
                IonSelectOption,
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
        // a valid form shows the green check, as the legacy tab did
        const valid_icon = tabs[0].find('.builder__form-tab-state');

        expect(valid_icon.exists()).toBe(true);
        expect(valid_icon.classes()).toContain('is-valid');
        expect(valid_icon.attributes('aria-label')).toBe('Form is valid');
    });

    it('shows the warning icon once the form is invalid', async () => {
        const wrapper = mount(FormTabsStrip, mountOptions());

        selectInput('form_1_text');

        const { useRootStore } = await import('@/vue/stores/root-store.js');
        const store = useRootStore(wrapper.vm.$.appContext.config.globalProperties.$pinia);

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

    it('disables the title toggle with the limit label once three titles are set', () => {
        setProject(title_limit_definition());
        selectInput('form_1_plain');

        const wrapper = mount(PropertiesPanel, mountOptions());

        const toggle = wrapper.find('.builder__title-toggle');

        expect(toggle.element.disabled).toBe(true);
        expect(wrapper.find('.builder__title-label').text()).toBe('Limit of 3 titles reached');
    });

    it('keeps the title toggle enabled and labelled while under the limit', () => {
        setProject(title_limit_definition());
        selectInput('form_1_title_1');

        const wrapper = mount(PropertiesPanel, mountOptions());

        const toggle = wrapper.find('.builder__title-toggle');

        expect(toggle.element.disabled).toBe(false);
        expect(wrapper.find('.builder__title-label').text()).toBe('Use answer as title');
    });
});

describe('vue advanced fields', () => {
    beforeEach(() => {
        setProject(project_definition());
    });

    it('shows the empty message without a selection', () => {
        const wrapper = mount(AdvancedFields, mountOptions());

        expect(wrapper.find('.builder__empty').text()).toBe('No advanced properties for this question type.');
    });

    it('shows the text-like fields for a text question', () => {
        selectInput('form_1_text');

        const wrapper = mount(AdvancedFields, mountOptions());

        expect(wrapper.find('.builder__empty').exists()).toBe(false);
        expect(wrapper.find('.builder__regex-field').exists()).toBe(true);
        expect(wrapper.find('[data-role="verify-label"]').text()).toBe('Require double entry verification');
        // text has no numeric type radios and no search type
        expect(wrapper.find('.builder__radio-group').exists()).toBe(false);
    });

    it('shows the numeric fields for an integer question', async () => {
        const pinia = createPinia();
        const { useRootStore } = await import('@/vue/stores/root-store.js');
        const store = useRootStore(pinia);
        const wrapper = mount(AdvancedFields, mountOptions(pinia));

        store.addQuestion('integer');

        await nextTick();

        expect(wrapper.find('.builder__regex-field').exists()).toBe(true);
        expect(wrapper.find('.builder__radio-group').exists()).toBe(true);
        expect(wrapper.findAll('.builder__radio-group').length).toBe(1);
    });

    it('renders the date format radios for a date question', async () => {
        const pinia = createPinia();
        const { useRootStore } = await import('@/vue/stores/root-store.js');
        const store = useRootStore(pinia);
        const wrapper = mount(AdvancedFields, mountOptions(pinia));

        store.addQuestion('date');

        await nextTick();

        const radios = wrapper.findAll('ion-radio');

        // five date formats; the time-format group stays hidden
        expect(radios.length).toBe(5);
        expect(wrapper.text()).toContain('Day/Month/Year');
        expect(wrapper.text()).not.toContain('Hours:Minutes:Seconds (24 hours)');
    });

    /* A closed dropdown carries no option DOM; the option list mounts when
       the overlay wrapper sees the presentation start, which jsdom never
       completes — simulate the ionMount signal Ionic fires at present. */
    const openDropdown = async (wrapper, field) => {
        await wrapper.find(`[data-field="${field}"] .dropdown__trigger`).trigger('click');
        await nextTick();

        const popover = wrapper.find(`[data-field="${field}"] ion-popover`);
        popover.element.dispatchEvent(new CustomEvent('ionMount'));
        await nextTick();
        await nextTick();
    };

    it('lists the possible answers in the default choice dropdown', async () => {
        const pinia = createPinia();
        const { useRootStore } = await import('@/vue/stores/root-store.js');
        const store = useRootStore(pinia);
        const wrapper = mount(AdvancedFields, mountOptions(pinia));

        store.addQuestion('radio');

        await nextTick();

        // closed: the popover carries no option DOM
        expect(wrapper.findAll('[data-field="default_choice"] .dropdown__option').length).toBe(0);

        await openDropdown(wrapper, 'default_choice');

        const options = wrapper.findAll('[data-field="default_choice"] .dropdown__option');

        // None + the new radio's starter answer
        expect(options.length).toBe(2);
        expect(options[0].text()).toBe('None');

        // selecting an option emits through to the store
        await options[1].trigger('click');

        expect(store.currentInput.default).toBe(options[1].attributes('data-value'));

        wrapper.unmount();
    });

    it('labels the uniqueness dropdown with the branch-scoped wording', async () => {
        const pinia = createPinia();
        const { useRootStore } = await import('@/vue/stores/root-store.js');
        const store = useRootStore(pinia);
        const wrapper = mount(AdvancedFields, mountOptions(pinia));

        store.addQuestion('text');

        await nextTick();

        await openDropdown(wrapper, 'uniqueness');

        const options = wrapper.findAll('[data-field="uniqueness"] .dropdown__option');

        expect(options.length).toBe(2);
        expect(options[0].text()).toBe('No uniqueness');
        expect(options[1].text()).toBe('Make answer unique to all Form 1 entries');

        await options[1].trigger('click');

        expect(store.currentInput.uniqueness).toBe('form');

        wrapper.unmount();
    });
});

describe('vue readme editor', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    /* A readme question mounted into the document, like the panel does.
       The readme content lives in `question` (the contract shape). */
    const mountReadme = async (readme_html) => {
        const definition = project_definition();

        definition.data.project.forms[0].inputs = [{
            ref: 'form_1_readme',
            type: 'readme',
            question: readme_html || '',
            is_title: false,
            is_required: false,
            possible_answers: [],
            jumps: [],
            branch: [],
            group: []
        }];

        setProject(definition);
        selectInput('form_1_readme');

        const pinia = createPinia();
        const options = mountOptions(pinia);

        options.attachTo = document.body;

        const wrapper = mount(ReadmeEditor, options);

        await nextTick();
        await nextTick();

        return wrapper;
    };

    it('renders the toolbar into the component markup and wires the editor', async () => {
        const wrapper = await mountReadme('<p>Hello</p>');

        const buttons = wrapper.findAll('.builder__readme-toolbar-button');

        expect(buttons.length).toBe(3);
        expect(buttons[0].text()).toBe('B');
        expect(buttons[0].attributes('aria-pressed')).toBe('false');

        // the editable content mounts inside the component's own element
        const content = wrapper.find('.builder__readme-content');
        expect(content.exists()).toBe(true);
        expect(content.element.querySelector('.ProseMirror')).not.toBeNull();

        // a prefilled editor is not in the empty placeholder state
        expect(content.classes()).not.toContain('is-empty');

        wrapper.unmount();
    });

    it('keeps the toolbar pressed state reactive', async () => {
        const wrapper = await mountReadme('');

        const bold = wrapper.find('[data-format="bold"]');
        const italic = wrapper.find('[data-format="italic"]');

        // an empty editor shows the empty placeholder state
        expect(wrapper.find('.builder__readme-content').classes()).toContain('is-empty');

        await bold.trigger('click');
        await nextTick();

        expect(bold.attributes('aria-pressed')).toBe('true');
        expect(italic.attributes('aria-pressed')).toBe('false');

        await italic.trigger('click');
        await nextTick();

        expect(bold.attributes('aria-pressed')).toBe('true');
        expect(italic.attributes('aria-pressed')).toBe('true');

        wrapper.unmount();
    });
});

/* Enough answers for three pages of 100, all named so paging is not blocked. */
function pager_definition() {
    const definition = project_definition();
    const possible_answers = [];

    for (let i = 1; i <= 250; i++) {
        possible_answers.push({ answer: 'Answer ' + i, answer_ref: 'answer_ref_' + i });
    }

    definition.data.project.forms[0].inputs[0] = Object.assign({}, definition.data.project.forms[0].inputs[0], {
        type: 'radio',
        question: 'Pick one',
        possible_answers
    });

    return definition;
}

/* A radio whose visible page holds an empty answer and a duplicated ref. */
function answer_error_definition() {
    const definition = project_definition();

    definition.data.project.forms[0].inputs[0] = Object.assign({}, definition.data.project.forms[0].inputs[0], {
        type: 'radio',
        question: 'Pick one',
        possible_answers: [
            { answer: '', answer_ref: 'answer_ref_empty' },
            { answer: 'Filled', answer_ref: 'answer_ref_dup' },
            { answer: 'Also filled', answer_ref: 'answer_ref_dup' }
        ]
    });

    return definition;
}

describe('vue possible answer row errors', () => {
    beforeEach(() => {
        setProject(answer_error_definition());
        selectInput('form_1_text');
    });

    it('flags the empty and duplicated rows with the inline messages', async () => {
        const wrapper = mount(PossibleAnswers, mountOptions());

        const rows = wrapper.findAll('.builder__answer');
        const emptyRow = rows[0];
        const duplicatedRows = [rows[1], rows[2]];

        expect(emptyRow.classes()).toContain('builder__answer--error');
        expect(emptyRow.find('.builder__answer-error').text()).toBe('Answer text cannot be empty');

        // both rows sharing the duplicated ref are flagged
        duplicatedRows.forEach((row) => {
            expect(row.classes()).toContain('builder__answer--error');
            expect(row.find('.builder__answer-error').text()).toBe('Duplicated identifier, please remove');
        });

        wrapper.unmount();
    });

    it('clears the flag as soon as the answer gets text', async () => {
        const wrapper = mount(PossibleAnswers, mountOptions());

        const emptyInput = wrapper.findAll('.builder__answer-field')[0];

        await emptyInput.trigger('ionInput', { detail: { value: 'Now filled' } });
        await nextTick();

        const emptyRow = wrapper.findAll('.builder__answer')[0];

        expect(emptyRow.classes()).not.toContain('builder__answer--error');
        expect(emptyRow.find('.builder__answer-error').exists()).toBe(false);

        wrapper.unmount();
    });
});

describe('vue possible answers pager', () => {
    beforeEach(() => {
        setProject(pager_definition());    });

    /*
     * The panel is attached to the document so the pager finds the scroll
     * container it restores. The attached tree hydrates the Ionic wrappers,
     * and ion-icon's asset loader cannot resolve SVG URLs in jsdom, so the
     * icon renders as a stub. VTU stubs <Transition> by default, which would
     * skip the page fade and its scroll restore, so the real one renders.
     */
    const pagerMountOptions = () => {
        const options = mountOptions();

        options.global.components.IonIcon = { render: () => null };
        options.global.stubs = { transition: false };

        return options;
    };

    /*
     * jsdom has no layout, so the panel scroll geometry is stubbed. The
     * scrollHeight follows the current page like the rendered list does: a
     * full page of 100 answers is taller than the 50-answer last page.
     */
    const stubPanelScroll = (wrapper, store) => {
        const scroller = wrapper.find('.builder__properties-body').element;
        const page_heights = { 1: 5290, 2: 5290, 3: 2640 };
        const panel = { scroll_top: 0 };

        Object.defineProperty(scroller, 'scrollHeight', {
            get: () => page_heights[store.possibleAnswersCurrentPage],
            configurable: true
        });
        Object.defineProperty(scroller, 'clientHeight', {
            get: () => 454,
            configurable: true
        });
        Object.defineProperty(scroller, 'scrollTop', {
            get: () => panel.scroll_top,
            set: (value) => {
                panel.scroll_top = value;
            },
            configurable: true
        });

        return panel;
    };

    const pageButton = (wrapper, action) => {
        return wrapper.find(`[data-action="page-${action}"]`);
    };

    /* The out-in swap completes a frame or two after the click in jsdom. */
    const flushPageSwap = async () => {
        await nextTick();
        await new Promise((resolve) => {
            setTimeout(resolve, 60);
        });
        await nextTick();
    };

    it('keeps the pager in view when navigating back from the last page', async () => {
        selectInput('form_1_text');

        const wrapper = mount(PropertiesPanel, Object.assign({}, pagerMountOptions(), {
            attachTo: document.body
        }));

        const { usePossibleAnswersStore } = await import('@/vue/stores/possible-answers-store.js');
        const store = usePossibleAnswersStore(wrapper.vm.$.appContext.config.globalProperties.$pinia);
        const panel = stubPanelScroll(wrapper, store);

        store.goToPossibleAnswersPage(3);

        await nextTick();

        // the user scrolled to the pager at the bottom of the short last page
        panel.scroll_top = 2640 - 454;

        await pageButton(wrapper, 'prev').trigger('click');
        await flushPageSwap();

        // the pager stays in view: the scroll follows the taller page 2,
        // instead of keeping the pixel offset into its middle
        expect(panel.scroll_top).toBe(5290 - 454);
        expect(store.possibleAnswersCurrentPage).toBe(2);

        wrapper.unmount();
    });

    it('keeps the scroll anchored while paging back and forth', async () => {
        selectInput('form_1_text');

        const wrapper = mount(PropertiesPanel, Object.assign({}, pagerMountOptions(), {
            attachTo: document.body
        }));

        const { usePossibleAnswersStore } = await import('@/vue/stores/possible-answers-store.js');
        const store = usePossibleAnswersStore(wrapper.vm.$.appContext.config.globalProperties.$pinia);
        const panel = stubPanelScroll(wrapper, store);

        // pages 1 and 2 are the same height: the scroll position is untouched
        panel.scroll_top = 5290 - 454;

        await pageButton(wrapper, 'next').trigger('click');
        await flushPageSwap();

        expect(panel.scroll_top).toBe(5290 - 454);
        expect(store.possibleAnswersCurrentPage).toBe(2);

        await pageButton(wrapper, 'next').trigger('click');
        await flushPageSwap();

        // the short last page clamps the scroll at its own bottom
        expect(panel.scroll_top).toBe(2640 - 454);
        expect(store.possibleAnswersCurrentPage).toBe(3);

        await pageButton(wrapper, 'prev').trigger('click');
        await flushPageSwap();

        expect(panel.scroll_top).toBe(5290 - 454);
        expect(store.possibleAnswersCurrentPage).toBe(2);

        await pageButton(wrapper, 'prev').trigger('click');
        await flushPageSwap();

        expect(panel.scroll_top).toBe(5290 - 454);
        expect(store.possibleAnswersCurrentPage).toBe(1);

        wrapper.unmount();
    });
});
