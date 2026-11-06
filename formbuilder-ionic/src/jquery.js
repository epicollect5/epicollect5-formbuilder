'use strict';

import jQuery from 'jquery';

/*
 * jQuery UI extends the global jQuery object, so publish it here: importers
 * of this module are guaranteed the global exists before jQuery UI evaluates.
 */
window.jQuery = jQuery;
window.$ = jQuery;

export default jQuery;
