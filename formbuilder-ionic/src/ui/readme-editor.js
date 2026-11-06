'use strict';

import { Editor, Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { PARAMETERS } from '@/models/parameters.js';
import { createView } from '@/ui/dom.js';
import readme_editor_view from '@/views/readme-editor.html?raw';

export const README_MAX_LENGTH = PARAMETERS.README_MAX_LENGTH;
const ALLOWED_TAGS = new Set(['p', 'br', 'b', 'strong', 'i', 'em', 'u']);
const DISCARDED_TAGS = new Set(['script', 'style', 'iframe', 'object']);

export const ReadmeLength = Extension.create({
    name: 'readmeLength',

    addProseMirrorPlugins: () => {
        return [new Plugin({
            filterTransaction: (transaction, state) => {
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

export const createReadmeEditor = (value, on_change) => {
    const element = createView(readme_editor_view);
    const content = element.querySelector('.builder__readme-content');
    const toolbar_buttons = [...element.querySelectorAll('.builder__readme-toolbar-button')];

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
        onUpdate: (event) => {
            const plain_text = event.editor.getText();
            const html = plain_text === '' ? '' : sanitizeEditorHTML(event.editor.getHTML());

            on_change(html, plain_text);
        }
    });

    toolbar_buttons.forEach((toolbar_button) => {
        const format = toolbar_button.getAttribute('data-format');

        toolbar_button.addEventListener('mousedown', (mouse_event) => {
            mouse_event.preventDefault();
        });

        toolbar_button.addEventListener('click', () => {
            const toggle = `toggle${format[0].toUpperCase()}${format.slice(1)}`;

            editor.chain().focus()[toggle]().run();
        });
    });

    const updateToolbarState = () => {
        toolbar_buttons.forEach((toolbar_button) => {
            const format = toolbar_button.getAttribute('data-format');

            toolbar_button.setAttribute('aria-pressed', String(editor.isActive(format)));
        });
    };

    editor.on('selectionUpdate', updateToolbarState);
    editor.on('transaction', updateToolbarState);
    updateToolbarState();
    updatePlaceholderState(content, editor);
    editor.on('update', () => {
        updatePlaceholderState(content, editor);
    });

    return {
        element,
        destroy: () => {
            editor.destroy();
        }
    };
};

const getDocumentTextLength = (document) => {
    return document.textBetween(0, document.content.size, ' ').length;
};

/* Persist only the readme tags supported by the project-definition contract. */
export const sanitizeEditorHTML = (html) => {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const safe_container = document.createElement('div');

    Array.from(parsed.body.childNodes).forEach((node) => {
        appendSafeNode(safe_container, node);
    });

    return safe_container.innerHTML;
};

const appendSafeNode = (parent, node) => {
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
        Array.from(node.childNodes).forEach((child) => {
            appendSafeNode(parent, child);
        });
        return;
    }

    const safe_element = document.createElement(tag_name);

    Array.from(node.childNodes).forEach((child) => {
        appendSafeNode(safe_element, child);
    });

    parent.appendChild(safe_element);
};

const updatePlaceholderState = (content, editor) => {
    content.classList.toggle('is-empty', editor.isEmpty);
};
