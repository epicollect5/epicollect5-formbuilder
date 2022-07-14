'use strict';
var options = {
    closeButton: true,
    positionClass: 'toast-top-center',
    preventDuplicates: true,
    onclick: null,
    showDuration: 500,
    hideDuration: 500,
    extendedTimeOut: 0,
    showMethod: 'fadeIn',
    hideMethod: 'fadeOut'
};

var toast = {
    showSuccess: function (message) {
        options.timeOut = 2000;
        window.toastr.options = options;
        window.toastr.success(message);
    },

    showError: function (message, timeout) {
        options.timeOut = timeout || 0;
        window.toastr.options = options;
        window.toastr.error(message);
    },

    showWarning: function (message, timeout) {
        options.timeOut = timeout || 0;
        window.toastr.options = options;
        window.toastr.warning(message);
    },

    clear: function () {
        window.toastr.clear();
    }
};

module.exports = toast;

