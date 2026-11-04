'use strict';

import { setupIonic } from '@/services/ionic-runtime.js';
import { installLegacyUi } from '@/services/legacy-ui.js';
import { startIconBridge } from '@/components/legacy-icons/legacy-icons.js';
import { installLegacyToast } from '@/components/legacy-toast/legacy-toast.js';

/**
 * Boot order matters: Ionic must be registered before the legacy app presents
 * overlays, the jQuery plugins must exist before `config/init` calls them, and
 * the icon bridge must observe the document before the first render.
 */
export function bootIonicPrototype($, root) {
    setupIonic();
    installLegacyUi($, document);
    installLegacyToast(window);
    startIconBridge(root);
}
