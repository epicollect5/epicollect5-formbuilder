'use strict';

import { bootFormbuilder } from '@/pages/formbuilder.page.js';

bootFormbuilder().catch(function (error) {
    console.error('[formbuilder-ionic] boot failed', error);

    const loader = document.querySelector('.loader');

    if (loader) {
        loader.textContent = 'The formbuilder could not be loaded.';
    }
});
