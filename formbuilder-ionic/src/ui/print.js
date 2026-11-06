'use strict';

import { isMultipleAnswerType } from '@/models/possible-answers.js';
import { getForms, getProject } from '@/models/project-definition.js';
import { areFormInputsValid } from '@/services/validation.js';

/*
 * Port of `print-as-pdf-click-callback.js`: build a paper-friendly copy of the
 * current form, put it in `.print-preview-wrapper` and let the browser print it.
 *
 * The legacy flow checked `input.dom.is_valid`; this uses the list-aware
 * validation instead, and it escapes the text it writes because the project
 * definition comes from the server.
 */
const escapeHtml = (text) => {
    return String(text === undefined || text === null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

/* The readme is rich text; print it as plain text, like the legacy builder. */
const readmeText = (html) => {
    const node = document.createElement('div');

    node.innerHTML = String(html === undefined || html === null ? '' : html);

    return node.textContent;
};

const renderAnswers = (input) => {
    return (input.possible_answers || []).map((answer) => {
        const label = escapeHtml(answer.answer);

        if (input.type === 'searchsingle' || input.type === 'searchmultiple') {
            return `<li><h5>${label}</h5></li>`;
        }

        const kind = input.type === 'checkbox' ? 'checkbox' : 'radio';

        return `<div class="${kind}-type"><h5>` +
            `<input type="${kind}" value="${label}">` +
            `<label>${label}</label>` +
            '</h5></div>';
    }).join('');
};

const renderQuestion = (input) => {
    const question = escapeHtml(input.question);

    if (input.type === 'readme') {
        return `<hr/><h4 class="question">${escapeHtml(readmeText(input.question))}</h4><hr/>`;
    }

    if (input.type === 'textarea') {
        return `<h4 class="question">${question}</h4>` +
            '<table border="1" width="100%">' +
            '<tr><td></td></tr><tr><td></td></tr><tr><td></td></tr><tr><td></td></tr>' +
            '</table>';
    }

    return `<h4 class="question">${question}</h4>` +
        '<table border="1" width="100%"><tr><td></td></tr></table>';
};

const renderContainer = (input) => {
    const children = (input.type === 'branch' ? input.branch : input.group) || [];

    return `<h4 class="${input.type}-header">${escapeHtml(input.question)}</h4>` +
        '<table border="1" cellpadding="10" cellspacing="10"><tr><td>' +
        children.map(renderInput).join('') +
        '</td></tr></table>';
};

const renderInput = (input) => {
    if (input.type === 'branch' || input.type === 'group') {
        return renderContainer(input);
    }

    if (isMultipleAnswerType(input.type)) {
        const list = input.type === 'searchsingle' || input.type === 'searchmultiple'
            ? `<ul class="possible-answers-list">${renderAnswers(input)}</ul>`
            : renderAnswers(input);

        return `<h4 class="question">${escapeHtml(input.question)}</h4>${list}`;
    }

    return renderQuestion(input);
};

/* Returns null when the form is empty or invalid, so the caller can toast. */
export const buildPrintHtml = (project_definition, form_index) => {
    const project = getProject(project_definition);
    const form = getForms(project_definition)[form_index];

    if (!project || !form || !areFormInputsValid(form)) {
        return null;
    }

    return `<h2>${escapeHtml(project.name)}</h2>` +
        `<h3>${escapeHtml(form.name)}</h3>` +
        form.inputs.map(renderInput).join('');
};

export const printForm = (project_definition, form_index) => {
    const html = buildPrintHtml(project_definition, form_index);
    const wrapper = document.querySelector('.print-preview-wrapper');

    if (html === null || !wrapper) {
        return false;
    }

    wrapper.innerHTML = html;
    window.print();

    return true;
};
