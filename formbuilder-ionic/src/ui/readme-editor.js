'use strict';

import { Editor, Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';

const README_MAX_LENGTH = 1000;
const ALLOWED_TAGS = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u']);
const DISCARDED_TAGS = new Set(['script', 'style', 'iframe', 'object']);
const FORMATS = [
    { name: 'bold', label: 'Bold', text: 'B' },
    { name: 'italic', label: 'Italic', text: 'I' },
    { name: 'underline', label: 'Underline', text: 'U' }
];

const ReadmeLength = Extension.create({
    name: 'readmeLength',

    addProseMirrorPlugins: function () {
        return [new Plugin({
            filterTransaction: function (transaction, state) {
                if (!transaction.docChanged) {
                    return true;
                }

                const next_length = getDocumentTextLength(transaction.doc);
                const current_length = getDocumentTextLength(state.doc);

                return next_length <= README_MAX_LENGTH || next_length < current_length;
            }
        })];
    }
});

export function createReadmeEditor(value, on_change) {
    const container = document.createElement('div');
    const toolbar = document.createElement('div');
    const content = document.createElement('div');

    container.className = 'builder__readme-editor';
    toolbar.className = 'builder__readme-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Readme formatting');
    content.className = 'builder__readme-content';
    content.setAttribute('data-placeholder', 'Type here...');

    container.append(toolbar, content);

    const editor = new Editor({
        element: content,
        extensions: [
            StarterKit.configure({
                blockquote: false,
                bulletList: false,
                code: false,
                codeBlock: false,
                heading: false,
                horizontalRule: false,
                link: false,
                listItem: false,
                orderedList: false,
                strike: false
            }),
            ReadmeLength
        ],
        content: value || '<p></p>',
        editorProps: {
            attributes: {
                'aria-label': 'Readme text',
                'aria-multiline': 'true'
            }
        },
        onUpdate: function (event) {
            const plain_text = event.editor.getText();
            const html = plain_text === '' ? '' : sanitizeEditorHTML(event.editor.getHTML());

            on_change(html, plain_text);
        }
    });

    FORMATS.forEach(function (format) {
        const toolbar_button = document.createElement('button');

        toolbar_button.type = 'button';
        toolbar_button.className = 'builder__readme-toolbar-button';
        toolbar_button.setAttribute('aria-label', format.label);
        toolbar_button.setAttribute('aria-pressed', 'false');
        toolbar_button.setAttribute('title', format.label);
        toolbar_button.textContent = format.text;

        toolbar_button.addEventListener('mousedown', function (mouse_event) {
            mouse_event.preventDefault();
        });

        toolbar_button.addEventListener('click', function () {
            editor.chain().focus()['toggle' + format.name[0].toUpperCase() + format.name.slice(1)]().run();
        });

        toolbar.appendChild(toolbar_button);
    });

    function updateToolbarState() {
        FORMATS.forEach(function (format) {
            const toolbar_button = toolbar.querySelector('[aria-label="' + format.label + '"]');

            if (toolbar_button) {
                toolbar_button.setAttribute('aria-pressed', String(editor.isActive(format.name)));
            }
        });
    }

    editor.on('selectionUpdate', updateToolbarState);
    editor.on('transaction', updateToolbarState);
    updateToolbarState();
    updatePlaceholderState(content, editor);
    editor.on('update', function () {
        updatePlaceholderState(content, editor);
    });

    return {
        element: container,
        destroy: function () {
            editor.destroy();
        }
    };
}

function getDocumentTextLength(document) {
    return document.textBetween(0, document.content.size, ' ').length;
}

/* Persist only the readme tags supported by the project-definition contract. */
function sanitizeEditorHTML(html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const safe_container = document.createElement('div');

    Array.from(parsed.body.childNodes).forEach(function (node) {
        appendSafeNode(safe_container, node);
    });

    return safe_container.innerHTML;
}

function appendSafeNode(parent, node) {
    if (node.nodeType === Node.TEXT_NODE) {
        parent.appendChild(document.createTextNode(node.nodeValue || ''));
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    const tag_name = node.tagName.toLowerCase();

    if (DISCARDED_TAGS.has(tag_name)) {
        return;
    }

    if (!ALLOWED_TAGS.has(tag_name)) {
        Array.from(node.childNodes).forEach(function (child) {
            appendSafeNode(parent, child);
        });
        return;
    }

    const safe_element = document.createElement(tag_name);

    Array.from(node.childNodes).forEach(function (child) {
        appendSafeNode(safe_element, child);
    });

    parent.appendChild(safe_element);
}

function updatePlaceholderState(content, editor) {
    content.classList.toggle('is-empty', editor.isEmpty);
}
