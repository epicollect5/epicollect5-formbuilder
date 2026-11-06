'use strict';

import './jquery.js';
import 'jquery-ui/dist/jquery-ui.min.js';

import { bootFormbuilder } from '@/pages/formbuilder.page.js';

bootFormbuilder().catch((error) => {
    console.error('[formbuilder-ionic] boot failed', error);

    const loader = document.querySelector('.loader');

    if (loader) {
        loader.replaceChildren();
        const message = document.createElement('div');
        message.textContent = 'The formbuilder could not be loaded.';
        loader.append(message);
    }
});
