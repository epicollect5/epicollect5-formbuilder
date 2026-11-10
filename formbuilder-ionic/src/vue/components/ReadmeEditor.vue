<template>
    <div class="builder__readme-host" ref="editorHost"></div>
</template>

<script>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { createReadmeEditor } from '@/ui/readme-editor.js';
import { useBuilderStore } from '@/vue/stores/builder.js';

/*
    The Tiptap readme editor. The vanilla editor factory (ui/readme-editor.js)
    is reused as-is: it builds the toolbar and editable content element, and
    reports (html, plainText) on every update. The component owns only the
    lifecycle — created on mount, destroyed on unmount; the :key on the host
    rebuilds it per selected question, like the vanilla re-render did.
 */
export default {
    setup() {
        const store = useBuilderStore();
        const editorHost = ref(null);
        let editor = null;

        onMounted(() => {
            const input = store.currentInput;

            editor = createReadmeEditor(store.readmeValue, (question) => {
                // the selection may have changed since mount; the rebuild key
                // guards this, but the vanilla checked the ref too
                const current = store.currentInput;

                if (!current || !editor || current.ref !== editor.inputRef) {
                    return;
                }

                store.editReadme(question);
            });

            editor.inputRef = input ? input.ref : null;

            if (editorHost.value) {
                editorHost.value.appendChild(editor.element);
            }
        });

        onBeforeUnmount(() => {
            if (editor) {
                editor.destroy();
                editor = null;
            }
        });

        return {
            editorHost
        };
    }
};
</script>

<style src="@/vue/theme/components/ReadmeEditor.scss" lang="scss"></style>
