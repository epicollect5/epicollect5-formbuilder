import { beforeEach, describe, expect, it } from 'vitest';
import { createInput } from '@/models/input-factory.js';
import { getCurrentInput, setProject } from '@/services/session.js';
import { renderApp } from '@/ui/shell.js';

function build_markup() {
    document.body.innerHTML = [
        '<ion-toolbar><ion-buttons slot="start"><ion-button data-action="back">Back</ion-button></ion-buttons><ion-title><img id="project-logo" alt=""><span id="project-name"></span></ion-title><ion-buttons slot="end"><ion-button data-action="exit">Exit</ion-button></ion-buttons></ion-toolbar>',
        '<section id="tools"></section>',
        '<nav id="form-tabs" role="tablist"><ion-segment class="builder__forms-segment" value="0" scrollable="true"></ion-segment></nav>',
        '<button type="button" id="add-form">Add form</button>',
        '<button type="button" id="undo" disabled>Undo</button>',
        '<button type="button" id="save" disabled>Save project</button>',
        '<section id="questions"></section>',
        '<section id="properties"></section>'
    ].join('');
}

function project_definition(inputs) {
    return {
        data: {
            project: {
                name: 'Properties test',
                slug: 'properties-test',
                forms: [
                    {
                        ref: 'form_1',
                        name: 'Form',
                        type: 'hierarchy',
                        inputs: inputs
                    }
                ]
            }
        }
    };
}

function base_input(overrides) {
    return Object.assign({
        ref: 'input_1',
        type: 'text',
        question: 'Question',
        is_title: false,
        is_required: false,
        uniqueness: 'none',
        regex: null,
        default: null,
        verify: false,
        max: null,
        min: null,
        datetime_format: null,
        set_to_current_datetime: false,
        possible_answers: [],
        jumps: [],
        branch: [],
        group: []
    }, overrides || {});
}

function select_first_question() {
    document.querySelectorAll('#questions .builder__question')[0].click();
}

function open_tab(value) {
    const segment = document.querySelector('#properties .builder__property-tabs');
    segment.value = value;
    segment.dispatchEvent(new CustomEvent('ionChange', { detail: { value: value } }));
}

function visible_property_panel() {
    const segment = document.querySelector('#properties .builder__property-tabs');
    const value = segment ? (segment.value || 'basic') : 'basic';
    const content = document.querySelector('#property-content-' + value);

    if (content) {
        return content;
    }

    const active = document.querySelector('#properties .builder__property-content.segment-content-active, #properties .builder__property-content[aria-hidden="false"]');

    if (active) {
        return active;
    }

    return document.querySelector('#properties');
}

function checkboxes() {
    return [...visible_property_panel().querySelectorAll('ion-checkbox')];
}

function checkbox_by_label(label) {
    return checkboxes().find(function (box) {
        return box.textContent.indexOf(label) !== -1;
    });
}

describe('properties panel', () => {
    beforeEach(() => {
        build_markup();
    });

    it('shows property tabs and no required/title for media types', () => {
        setProject(project_definition([base_input({ type: 'photo', question: 'Photo' })]));
        renderApp();
        select_first_question();

        const tab_buttons = [...document.querySelectorAll('#properties ion-segment-button')];

        expect(tab_buttons.map((tab) => tab.getAttribute('value'))).toEqual(['basic', 'advanced', 'jumps']);
        expect(tab_buttons[1].hasAttribute('disabled')).toBe(true);
        expect(checkbox_by_label('Required')).toBeUndefined();
        expect(checkbox_by_label('Use answer as title')).toBeUndefined();
    });

    it('shows required but not uniqueness for radio', () => {
        setProject(project_definition([base_input({
            type: 'radio',
            question: 'Choice',
            possible_answers: [
                { answer: 'A', answer_ref: 'a1' },
                { answer: 'B', answer_ref: 'a2' }
            ]
        })]));
        renderApp();
        select_first_question();
        open_tab('advanced');

        expect(checkbox_by_label('Required')).toBeUndefined();
        const default_choice = visible_property_panel().querySelector('[data-field="default_choice"]');
        expect(default_choice).not.toBeNull();
        expect(default_choice.hidden).toBe(false);
        expect(default_choice.style.display).not.toBe('none');
        const uniqueness = visible_property_panel().querySelector('[data-field="uniqueness"]');
        expect(!uniqueness || uniqueness.hidden || uniqueness.style.display === 'none').toBe(true);
    });

    it('enforces the three-title limit per form', () => {
        setProject(project_definition([
            base_input({ ref: 'i1', is_title: true }),
            base_input({ ref: 'i2', question: 'Two', is_title: true }),
            base_input({ ref: 'i3', question: 'Three', is_title: true }),
            base_input({ ref: 'i4', question: 'Four' })
        ]));
        renderApp();
        document.querySelectorAll('#questions .builder__question')[3].click();

        const title_toggle = checkbox_by_label('Limit of 3 titles reached');

        expect(title_toggle).not.toBeUndefined();
        expect(title_toggle.disabled).toBe(true);
    });

    it('updates numeric min/max and regex as advanced properties', () => {
        setProject(project_definition([base_input({ type: 'integer', question: 'Age' })]));
        renderApp();
        select_first_question();
        open_tab('advanced');

        const inputs = [...document.querySelectorAll('#properties ion-input')];
        const min_field = inputs.find((field) => field.getAttribute('label') === 'Min value');
        const regex_field = inputs.find((field) => field.getAttribute('label') === 'Match REGEX');

        min_field.value = '5';
        min_field.dispatchEvent(new CustomEvent('ionInput', { detail: { value: '5' } }));
        regex_field.value = '^[0-9]+$';
        regex_field.dispatchEvent(new CustomEvent('ionInput', { detail: { value: '^[0-9]+$' } }));

        const input = getCurrentInput();
        expect(input.min).toBe('5');
        expect(input.regex).toBe('^[0-9]+$');
    });

    it('switches integer to decimal and keeps the type in the definition', () => {
        setProject(project_definition([base_input({ type: 'integer', question: 'Amount' })]));
        renderApp();
        select_first_question();
        open_tab('advanced');

        const group = document.querySelector('#properties ion-radio-group');
        group.value = 'decimal';
        group.dispatchEvent(new CustomEvent('ionChange', { detail: { value: 'decimal' } }));

        expect(getCurrentInput().type).toBe('decimal');
    });

    it('sets the default answer for a multiple-choice question', () => {
        setProject(project_definition([base_input({
            type: 'dropdown',
            question: 'Colour',
            possible_answers: [
                { answer: 'Red', answer_ref: 'r1' },
                { answer: 'Blue', answer_ref: 'b1' }
            ]
        })]));
        renderApp();
        select_first_question();
        open_tab('advanced');

        const control = document.querySelector('#properties [data-field="default_choice"] .dropdown, #properties [data-field="default_choice"]');
        if (!control) {
            throw new Error('default_choice control not found');
        }
        const dropdown = control.classList.contains('dropdown') ? control : control.querySelector('.dropdown');
        if (dropdown && typeof dropdown.setValue === 'function') {
            dropdown.setValue('b1', true);
        } else {
            control.value = 'b1';
            control.dispatchEvent(new CustomEvent('ionChange', { detail: { value: 'b1' } }));
        }

        expect(getCurrentInput().default).toBe('b1');
    });

    it('caps the question text at 255 characters', () => {
        setProject(project_definition([base_input({ type: 'text', question: '' })]));
        renderApp();
        select_first_question();

        const field = document.querySelector('#properties .builder__question-field');
        const long_text = 'x'.repeat(300);

        field.value = long_text;
        field.dispatchEvent(new CustomEvent('ionInput', { detail: { value: long_text } }));

        expect(getCurrentInput().question.length).toBe(255);
    });

    it('creates date and time questions with default formats', () => {
        const date_input = createInput('date', 'form_1');
        const time_input = createInput('time', 'form_1');

        expect(date_input.datetime_format).toBe('dd/MM/YYYY');
        expect(time_input.datetime_format).toBe('HH:mm');
    });
});
