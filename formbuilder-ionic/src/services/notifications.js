'use strict';

import { confirmAlert, dismissAlert } from '@/ui/alert.js';
import { dismissModal, openModal } from '@/ui/modal.js';
import { hideLoading, showLoading } from '@/ui/loading.js';
import { dismissToast, showToast } from '@/ui/toast.js';

/*
 * Single entry for user-facing feedback: toasts for transient messages
 * (success / warning / error map to the toast color, no icons), the alert for
 * confirmations, the modal for panels that need buttons, and the busy overlay
 * for actions that render. The ui/* modules own the Ionic elements; this only
 * routes calls so pages import one service.
 */
const notify = (message, type) => {
    return showToast(message, type);
};

export const notifySuccess = (message) => {
    return notify(message, 'success');
};

export const notifyWarning = (message) => {
    return notify(message, 'warning');
};

export const notifyError = (message) => {
    return notify(message, 'error');
};

export {
    confirmAlert,
    dismissAlert,
    dismissModal,
    dismissToast,
    hideLoading,
    openModal,
    showLoading,
    showToast
};
