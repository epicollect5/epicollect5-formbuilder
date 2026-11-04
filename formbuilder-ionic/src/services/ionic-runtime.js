'use strict';

import { initialize, setAssetPath } from '@ionic/core/components';
import { defineCustomElement as defineIonApp } from '@ionic/core/components/ion-app.js';
import { defineCustomElement as defineIonHeader } from '@ionic/core/components/ion-header.js';
import { defineCustomElement as defineIonToolbar } from '@ionic/core/components/ion-toolbar.js';
import { defineCustomElement as defineIonContent } from '@ionic/core/components/ion-content.js';
import { defineCustomElement as defineIonButton } from '@ionic/core/components/ion-button.js';
import { defineCustomElement as defineIonIcon } from '@ionic/core/components/ion-icon.js';
import { defineCustomElement as defineIonInput } from '@ionic/core/components/ion-input.js';
import { defineCustomElement as defineIonCheckbox } from '@ionic/core/components/ion-checkbox.js';
import { defineCustomElement as defineIonNote } from '@ionic/core/components/ion-note.js';
import { setAssetPath as setIoniconAssetPath } from 'ionicons/components';
import { defineCustomElement as defineIoniconIcon } from 'ionicons/components/ion-icon.js';

const IONIC_COMPONENTS = [
    defineIonApp,
    defineIonHeader,
    defineIonToolbar,
    defineIonContent,
    defineIonButton,
    defineIonIcon,
    defineIonInput,
    defineIonCheckbox,
    defineIonNote,
    defineIoniconIcon
];

/*
 * Register the Ionic Core components this UI renders and point ion-icon at the
 * pinned Ionicons assets copied into dist/vendor/ionicons/svg by the build.
 */
export function setupIonic() {
    initialize();

    IONIC_COMPONENTS.forEach(function (defineComponent) {
        defineComponent();
    });

    const asset_path = new URL('vendor/ionicons/svg', document.baseURI).href;

    // `initialize()` registers ion-icon from Ionic core's own ionicons build,
    // which keeps its asset path on a different platform object than the
    // standalone `ionicons` package, so both copies need the same path.
    setAssetPath(asset_path);
    setIoniconAssetPath(asset_path);
}
