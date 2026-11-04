'use strict';

import { installModals } from '@/components/legacy-modals/legacy-modals.js';
import { installTabs } from '@/components/legacy-tabs/legacy-tabs.js';
import { installMenus } from '@/components/legacy-menus/legacy-menus.js';
import { installHelp } from '@/components/legacy-help/legacy-help.js';

const INSTALL_FLAG = '__formbuilderIonicUiInstalled';

/**
 * Install the Ionic-backed replacements for the Bootstrap JavaScript plugins the
 * legacy modules call (modal/tab/dropdown/tooltip/popover).
 */
export function installLegacyUi($, root) {
    if (window[INSTALL_FLAG]) {
        return;
    }

    window[INSTALL_FLAG] = true;

    installModals($, root || document);
    installTabs($, root || document);
    installMenus($, root || document);
    installHelp($);
}
