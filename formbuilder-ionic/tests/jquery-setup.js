import jQuery from 'jquery';

/*
 * The app entry imports jQuery and jQuery UI, but most jsdom suites render the
 * shell directly. Drag and drop now fails loudly without the global, so give
 * those suites the same jQuery instance and no-op widgets. tests/sortable.test.js
 * loads the real jQuery UI build over these stubs.
 */
window.jQuery = jQuery;
window.$ = jQuery;

jQuery.fn.draggable = jQuery.fn.draggable || function () {
    return this;
};

jQuery.fn.sortable = jQuery.fn.sortable || function () {
    return this;
};
