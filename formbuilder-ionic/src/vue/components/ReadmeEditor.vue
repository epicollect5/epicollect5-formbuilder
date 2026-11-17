<template>
    <div class="builder__readme-editor">
        <div class="builder__readme-toolbar"
             role="toolbar"
             aria-label="Readme formatting">
            <button type="button"
                    class="builder__readme-toolbar-button"
                    v-for="format in toolbarFormats"
                    :key="format.format"
                    :data-format="format.format"
                    :aria-label="format.ariaLabel"
                    :aria-pressed="format.pressed"
                    :title="format.title"
                    @mousedown.prevent
                    @click="toggleFormat(format.format)">{{ format.label }}</button>
        </div>

        <div class="builder__readme-content"
             ref="contentRef"
             data-placeholder="Type here..."
             :class="{ 'is-empty': editorEmpty }"
             @mousedown="onContentMousedown($event)"></div>
    </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { ReadmeLength, sanitizeEditorHTML } from '@/ui/readme-editor.js';
import { useRootStore } from '@/vue/stores/root-store.js';

/*
    The Tiptap readme editor. The component owns the toolbar and editable
    content markup (the vanilla factory built them from a ?raw view) and the
    editor lifecycle: created on mount, destroyed on unmount; the :key on the
    host rebuilds it per selected question, like the vanilla re-render did.
    Only the contract-pure helpers stay shared with the vanilla factory:
    the ReadmeLength extension and the HTML sanitiser (ui/readme-editor.js).
    Toolbar state and the empty placeholder are reactive, not imperative
    attribute writes.
 */
const TOOLBAR_FORMATS = [
    { format: 'bold', label: 'B', ariaLabel: 'Bold', title: 'Bold' },
    { format: 'italic', label: 'I', ariaLabel: 'Italic', title: 'Italic' },
    { format: 'underline', label: 'U', ariaLabel: 'Underline', title: 'Underline' }
];

export default {
    setup() {
        const store = useRootStore();
        const contentRef = ref(null);
        const editorEmpty = ref(true);
        const pressedFormats = reactive({
            bold: false,
            italic: false,
            underline: false
        });

        // the ProseMirror editor carries its own state; it stays outside
        // the reactive graph and is reached through the closures
        let editor = null;
        let input_ref = null;

        const methods = {
            toggleFormat(format) {
                const toggle = `toggle${format[0].toUpperCase()}${format.slice(1)}`;

                editor.chain().focus()[toggle]().run();
            },
            onContentMousedown(mouse_event) {
                // clicks on the wrapper's padding land outside the editable;
                // prevent the mousedown default (which blurs) and focus it
                if (mouse_event.target === contentRef.value) {
                    mouse_event.preventDefault();
                    editor.commands.focus('end');
                }
            },
            refreshToolbarState() {
                TOOLBAR_FORMATS.forEach((format) => {
                    pressedFormats[format.format] = editor.isActive(format.format);
                });
            },
            refreshEmptyState() {
                editorEmpty.value = editor.isEmpty;
            }
        };

        const computedScope = {
            toolbarFormats: computed(() => {
                return TOOLBAR_FORMATS.map((format) => {
                    return Object.assign({}, format, {
                        pressed: pressedFormats[format.format] ? 'true' : 'false'
                    });
                });
            }),
            editorEmpty
        };

        onMounted(() => {
            const input = store.currentInput;

            input_ref = input ? input.ref : null;

            editor = new Editor({
                element: contentRef.value,
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
                content: store.readmeValue || '<p></p>',
                editorProps: {
                    attributes: {
                        'aria-label': 'Readme text',
                        'aria-multiline': 'true'
                    }
                },
                onUpdate: (event) => {
                    const plain_text = event.editor.getText();
                    const html = plain_text === '' ? '' : sanitizeEditorHTML(event.editor.getHTML());

                    // the selection may have changed since mount; the rebuild
                    // key guards this, but the vanilla checked the ref too
                    const current = store.currentInput;

                    if (!current || current.ref !== input_ref) {
                        return;
                    }

                    store.editReadme(html);
                }
            });

            methods.refreshToolbarState();
            methods.refreshEmptyState();

            editor.on('selectionUpdate', methods.refreshToolbarState);
            editor.on('transaction', methods.refreshToolbarState);
            editor.on('update', methods.refreshEmptyState);
        });

        onBeforeUnmount(() => {
            if (editor) {
                editor.destroy();
                editor = null;
            }
        });

        return {
            contentRef,
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/components/ReadmeEditor.scss" lang="scss"></style>
