'use strict';

import { createApp } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import {
    IonicVue,
    IonApp,
    IonAvatar,
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
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonTitle,
    IonToolbar
} from '@ionic/vue';
import { setAssetPath } from '@ionic/core/components';
import { defineCustomElement as defineIonToast } from '@ionic/core/components/ion-toast.js';
import { setAssetPath as setIoniconAssetPath } from 'ionicons/components';
import '../ionic.css';
import '../theme/ionic-formbuilder.scss';
import { loadProject } from '@/services/project-source.js';
import { setProject } from '@/services/session.js';
import { ensureUndoBaseline } from '@/services/undo.js';
import { useBuilderStore } from '@/vue/stores/builder.js';
import App from '@/vue/App.vue';

/*
    IonicVue.install does not register the components: every ion-* tag must
    resolve to its wrapper, which defines the underlying custom element and
    bridges the props and events.
 */
const ION_COMPONENTS = {
    IonApp,
    IonAvatar,
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
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonTitle,
    IonToolbar
};

/*
 * The toast layer (services/notifications.js → ui/toast.js) creates ion-toast
 * elements imperatively, outside any Vue template, so the custom element must
 * be defined at boot — the IonicVue plugin only defines the components that
 * actually render in templates.
 */
defineIonToast();

/*
    Boot the Vue builder. IonicVue calls initialize() itself (its install runs
    the same config the vanilla setupIonic does), so only the ionicons asset
    paths are set here: ion-icon loads its SVGs by URL at runtime, and the
    pinned SVGs are served from node_modules in dev and copied to
    dist/vendor/ionicons/svg in production. The path is one level up because
    this page serves under /ionic/vue/.
 */
export const bootVueFormbuilder = async (options) => {
    const settings = options || {};
    const asset_path = new URL('../vendor/ionicons/svg', document.baseURI).href;
    // this entry sits one level under the Ionic app root, which the vanilla
    // page serves directly: derive /epicollect5-formbuilder/ionic/ from here
    const app_base_url = new URL('../', document.baseURI).href;

    setAssetPath(asset_path);
    setIoniconAssetPath(asset_path);

    const pinia = createPinia();
    const app = createApp(App)
        .use(pinia)
        .use(IonicVue, { mode: 'md' });

    Object.keys(ION_COMPONENTS).forEach((name) => {
        app.component(name, ION_COMPONENTS[name]);
    });

    setActivePinia(pinia);

    const store = useBuilderStore();

    store.setAppBaseUrl(app_base_url);
    store.installUnloadGuard();

    const project_definition = await loadProject(settings.base_url || app_base_url, settings.fetch_project);

    setProject(project_definition);
    ensureUndoBaseline();

    app.mount('#app');

    const loader = document.querySelector('.loader');

    if (loader) {
        loader.remove();
    }

    return project_definition;
};

/*
    Boot only where the loader exists, as in the vanilla app.js: the boot tests
    import this module for the exported function and drive it with injected
    inputs.
 */
if (document.querySelector('.loader')) {
    bootVueFormbuilder().catch((error) => {
        console.error('[formbuilder-ionic] vue boot failed', error);

        const loader = document.querySelector('.loader');

        if (loader) {
            loader.replaceChildren();
            const message = document.createElement('div');
            message.textContent = 'The formbuilder could not be loaded.';
            loader.append(message);
        }
    });
}
