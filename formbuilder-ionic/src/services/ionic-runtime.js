'use strict';

import { initialize, setAssetPath } from '@ionic/core/components';
import { defineCustomElement as defineIonApp } from '@ionic/core/components/ion-app.js';
import { defineCustomElement as defineIonButtons } from '@ionic/core/components/ion-buttons.js';
import { defineCustomElement as defineIonHeader } from '@ionic/core/components/ion-header.js';
import { defineCustomElement as defineIonTitle } from '@ionic/core/components/ion-title.js';
import { defineCustomElement as defineIonToolbar } from '@ionic/core/components/ion-toolbar.js';
import { defineCustomElement as defineIonContent } from '@ionic/core/components/ion-content.js';
import { defineCustomElement as defineIonCard } from '@ionic/core/components/ion-card.js';
import { defineCustomElement as defineIonCardHeader } from '@ionic/core/components/ion-card-header.js';
import { defineCustomElement as defineIonCardTitle } from '@ionic/core/components/ion-card-title.js';
import { defineCustomElement as defineIonCardContent } from '@ionic/core/components/ion-card-content.js';
import { defineCustomElement as defineIonCol } from '@ionic/core/components/ion-col.js';
import { defineCustomElement as defineIonGrid } from '@ionic/core/components/ion-grid.js';
import { defineCustomElement as defineIonItem } from '@ionic/core/components/ion-item.js';
import { defineCustomElement as defineIonList } from '@ionic/core/components/ion-list.js';
import { defineCustomElement as defineIonRow } from '@ionic/core/components/ion-row.js';
import { defineCustomElement as defineIonButton } from '@ionic/core/components/ion-button.js';
import { defineCustomElement as defineIonIcon } from '@ionic/core/components/ion-icon.js';
import { defineCustomElement as defineIonInput } from '@ionic/core/components/ion-input.js';
import { defineCustomElement as defineIonCheckbox } from '@ionic/core/components/ion-checkbox.js';
import { defineCustomElement as defineIonNote } from '@ionic/core/components/ion-note.js';
import { defineCustomElement as defineIonPopover } from '@ionic/core/components/ion-popover.js';
import { defineCustomElement as defineIonSegment } from '@ionic/core/components/ion-segment.js';
import { defineCustomElement as defineIonSegmentButton } from '@ionic/core/components/ion-segment-button.js';
import { defineCustomElement as defineIonSegmentContent } from '@ionic/core/components/ion-segment-content.js';
import { defineCustomElement as defineIonSegmentView } from '@ionic/core/components/ion-segment-view.js';
import { defineCustomElement as defineIonSelect } from '@ionic/core/components/ion-select.js';
import { defineCustomElement as defineIonSelectOption } from '@ionic/core/components/ion-select-option.js';
import { defineCustomElement as defineIonRadio } from '@ionic/core/components/ion-radio.js';
import { defineCustomElement as defineIonRadioGroup } from '@ionic/core/components/ion-radio-group.js';
import { setAssetPath as setIoniconAssetPath } from 'ionicons/components';
import { defineCustomElement as defineIoniconIcon } from 'ionicons/components/ion-icon.js';

const IONIC_COMPONENTS = [
    defineIonApp,
    defineIonButtons,
    defineIonHeader,
    defineIonTitle,
    defineIonToolbar,
    defineIonContent,
    defineIonCard,
    defineIonCardHeader,
    defineIonCardTitle,
    defineIonCardContent,
    defineIonCol,
    defineIonGrid,
    defineIonItem,
    defineIonList,
    defineIonRow,
    defineIonButton,
    defineIonIcon,
    defineIonInput,
    defineIonCheckbox,
    defineIonNote,
    defineIonPopover,
    defineIonSegment,
    defineIonSegmentButton,
    defineIonSegmentContent,
    defineIonSegmentView,
    defineIonSelect,
    defineIonSelectOption,
    defineIonRadio,
    defineIonRadioGroup,
    defineIoniconIcon
];

/*
 * Register the Ionic Core components this UI renders and point ion-icon at the
 * pinned Ionicons assets copied into dist/vendor/ionicons/svg by the build.
 * The asset path comes first: defining ion-icon upgrades the ion-icon elements
 * already in the document and loads their svg immediately, and Ionic core and
 * the standalone `ionicons` package keep that path on separate platform
 * objects, so both copies need it.
 */
export function setupIonic() {
    const asset_path = new URL('vendor/ionicons/svg', document.baseURI).href;

    setAssetPath(asset_path);
    setIoniconAssetPath(asset_path);

    initialize();

    IONIC_COMPONENTS.forEach(function (defineComponent) {
        defineComponent();
    });
}
