'use strict';

import { initialize, setAssetPath } from '@ionic/core/components';
import { defineCustomElement as defineIonApp } from '@ionic/core/components/ion-app.js';
import { defineCustomElement as defineIonHeader } from '@ionic/core/components/ion-header.js';
import { defineCustomElement as defineIonToolbar } from '@ionic/core/components/ion-toolbar.js';
import { defineCustomElement as defineIonButtons } from '@ionic/core/components/ion-buttons.js';
import { defineCustomElement as defineIonButton } from '@ionic/core/components/ion-button.js';
import { defineCustomElement as defineIonContent } from '@ionic/core/components/ion-content.js';
import { defineCustomElement as defineIonCard } from '@ionic/core/components/ion-card.js';
import { defineCustomElement as defineIonCardHeader } from '@ionic/core/components/ion-card-header.js';
import { defineCustomElement as defineIonCardTitle } from '@ionic/core/components/ion-card-title.js';
import { defineCustomElement as defineIonCardContent } from '@ionic/core/components/ion-card-content.js';
import { defineCustomElement as defineIonNote } from '@ionic/core/components/ion-note.js';
import { defineCustomElement as defineIonModal } from '@ionic/core/components/ion-modal.js';
import { defineCustomElement as defineIonToast } from '@ionic/core/components/ion-toast.js';
import { setAssetPath as setIoniconAssetPath } from 'ionicons/components';
import { defineCustomElement as defineIonIcon } from 'ionicons/components/ion-icon.js';

const IONIC_COMPONENTS = [
    defineIonApp,
    defineIonHeader,
    defineIonToolbar,
    defineIonButtons,
    defineIonButton,
    defineIonContent,
    defineIonCard,
    defineIonCardHeader,
    defineIonCardTitle,
    defineIonCardContent,
    defineIonNote,
    defineIonModal,
    defineIonToast,
    defineIonIcon
];

/**
 * Register the Ionic Core components used by the prototype and point ion-icon at
 * the pinned Ionicons assets copied into dist/vendor/ionicons/svg by the build.
 */
export function setupIonic() {
    initialize();

    IONIC_COMPONENTS.forEach(function (defineComponent) {
        defineComponent();
    });

    const asset_path = new URL('vendor/ionicons/svg', document.baseURI).href;

    // `initialize()` registers ion-icon from Ionic core's own ionicons build, which
    // keeps its asset path on a different platform object than the standalone
    // `ionicons` package, so both copies need pointing at the copied svg folder.
    setAssetPath(asset_path);
    setIoniconAssetPath(asset_path);
}
