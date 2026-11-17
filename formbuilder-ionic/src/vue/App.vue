<template>
    <ion-app>
        <ion-header>
            <ion-toolbar color="primary">
                <ion-buttons slot="start">
                    <ion-button data-action="back" @click="goBack()">
                        <ion-icon slot="start" name="chevron-back-outline"></ion-icon>
                        Back
                    </ion-button>
                </ion-buttons>
                <ion-title>
                    <span class="builder__toolbar-project">
                        <ion-avatar class="builder__project-avatar">
                            <img id="project-logo" alt="" :src="logoUrl">
                        </ion-avatar>
                        <span id="project-name">{{ projectName }}</span>
                    </span>
                </ion-title>
                <ion-buttons slot="end">
                    <ion-button data-action="exit" @click="goBack()">
                        <ion-icon slot="start" name="power"></ion-icon>
                        Exit
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="formbuilder-content">
            <BuilderNotice variant="warning" class="screen-resolution">
                <p>The formbuilder does not support the current screen resolution</p>
                <p>Please use a screen with a resolution of at least 1024x768</p>
            </BuilderNotice>

            <div class="builder" id="builder">
                <VueDraggable tag="section"
                              class="builder__tools"
                              id="tools"
                              aria-label="Question types"
                              v-model="builderTools"
                              :group="builderQuestions"
                              :force-fallback="true"
                              :fallback-on-body="true"
                              :sort="false"
                              @start="startDrag()"
                              @end="endDrag()">
                    <button v-for="tool in builderTools"
                            :key="tool.type"
                            type="button"
                            class="builder__tool"
                            :data-type="tool.type"
                            :aria-label="tool.ariaLabel"
                            :hidden="!tool.allowed"
                            :disabled="!tool.allowed"
                            @click="blurTool($event)">
                        <ion-icon :name="tool.icon" aria-hidden="true"></ion-icon>
                        <span class="builder__tool-label">{{ tool.label }}</span>
                    </button>
                </VueDraggable>

                <section class="builder__workspace">
                    <div class="builder__forms-row">
                        <FormTabsStrip></FormTabsStrip>

                        <button type="button"
                                class="builder__add-form"
                                id="add-form"
                                :disabled="!addFormEnabled"
                                :title="addFormTitle"
                                @click="openFormNameModal()">
                            <ion-icon name="add-outline" aria-hidden="true"></ion-icon>
                            <span>Add Form</span>
                        </button>

                        <div class="builder__form-actions">
                            <button type="button"
                                    class="builder__action"
                                    id="undo"
                                    :title="undoTitle"
                                    :disabled="!canUndo"
                                    @click="performUndo()">
                                <ion-icon name="arrow-undo-outline" aria-hidden="true"></ion-icon>
                                <span>Undo</span>
                            </button>
                            <button type="button"
                                    class="builder__action"
                                    id="save"
                                    :title="saveTitle"
                                    :disabled="!saveEnabled"
                                    @click="onSave()">
                                <ion-icon name="cloud-upload" aria-hidden="true"></ion-icon>
                                <span>Save Project</span>
                            </button>
                        </div>
                    </div>

                    <div class="builder__columns">
                        <QuestionsList></QuestionsList>
                        <PropertiesPanel></PropertiesPanel>
                    </div>
                </section>
            </div>
        </ion-content>

        <Modal></Modal>
    </ion-app>
</template>

<script>
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { getProject } from '@/models/project-definition.js';
import { goBack } from '@/services/navigation.js';
import { getProjectLogoUrl } from '@/services/project-media.js';
import { useRootStore } from '@/vue/stores/root-store.js';
import { useFormsStore } from '@/vue/stores/forms-store.js';
import FormTabsStrip from '@/vue/components/FormTabsStrip.vue';
import QuestionsList from '@/vue/components/QuestionsList.vue';
import PropertiesPanel from '@/vue/components/PropertiesPanel.vue';
import Modal from '@/vue/components/Modal.vue';
import BuilderNotice from '@/vue/components/BuilderNotice.vue';

export default {
    components: {
        FormTabsStrip,
        QuestionsList,
        PropertiesPanel,
        Modal,
        BuilderNotice,
        VueDraggable
    },
    setup() {
        const store = useRootStore();
        const forms = useFormsStore();

        const methods = {
            goBack() {
                goBack();
            },
            onSave() {
                store.performSave();
            },
            performUndo() {
                store.performUndo();
            },
            openFormNameModal() {
                forms.openFormNameModal(null);
            },
            startDrag() {
                store.beginDrag();
            },
            endDrag() {
                store.endDrag();
            },
            /* The vanilla builder tools blur the clicked tool; keep the behaviour. */
            blurTool(event) {
                if (event.currentTarget && typeof event.currentTarget.blur === 'function') {
                    event.currentTarget.blur();
                }
            }
        };

        /*
         * The builder tools are a menu, not a list: their drag group is clone-only
         * (pull: 'clone', put: false) and never mutates, so the v-model
         * setter is a no-op.
         */
        const builderTools = computed({
            get: () => {
                return store.tools.map((tool) => {
                    return Object.assign({}, tool, {
                        ariaLabel: `Add a ${tool.label} question`
                    });
                });
            },
            set: () => {}
        });

        const builderQuestions = {
            name: 'builder-questions',
            pull: 'clone',
            put: false
        };

        const computedScope = {
            builderTools,
            builderQuestions,
            addFormEnabled: computed(() => {
                return forms.addFormEnabled;
            }),
            addFormTitle: computed(() => {
                return forms.addFormTitle;
            }),
            projectName: computed(() => {
                const project = getProject(store.state.session.project_definition);

                return project ? project.name : '';
            }),
            logoUrl: computed(() => {
                return getProjectLogoUrl(getProject(store.state.session.project_definition), store.state.app_base_url);
            }),
            canUndo: computed(() => {
                return store.canUndo;
            }),
            undoTitle: computed(() => {
                return store.canUndo ? 'Undo the last change' : 'Nothing to undo';
            }),
            saveEnabled: computed(() => {
                return store.saveEnabled;
            }),
            saveTitle: computed(() => {
                return store.saveTitle;
            })
        };

        return {
            ...methods,
            ...computedScope
        };
    }
};
</script>

<style src="@/vue/theme/App.scss" lang="scss"></style>
