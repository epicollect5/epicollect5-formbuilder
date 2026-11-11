'use strict';

/*
 * The question-type taxonomy as shared constants. The `type` values are part
 * of the project-definition contract and must never change: the server, the
 * mobile app and the dataviewer read them. Models import these; only the
 * logic over them lives in models/.
 */

/*
 * The 18 question types the legacy formbuilder offers, in toolbar order.
 */
export const QUESTION_TYPES = [
    { type: 'text', label: 'Text', icon: 'text-outline' },
    { type: 'integer', label: 'Numeric', icon: 'calculator-outline' },
    { type: 'phone', label: 'Phone', icon: 'call-outline' },
    { type: 'date', label: 'Date', icon: 'calendar-outline' },
    { type: 'time', label: 'Time', icon: 'time-outline' },
    { type: 'dropdown', label: 'Dropdown', icon: 'chevron-down-circle-outline' },
    { type: 'radio', label: 'Radio', icon: 'radio-button-on-outline' },
    { type: 'checkbox', label: 'Checkbox', icon: 'checkbox-outline' },
    { type: 'searchsingle', label: 'Search', icon: 'search-outline' },
    { type: 'textarea', label: 'Text Box', icon: 'document-text-outline' },
    { type: 'readme', label: 'Readme', icon: 'reader-outline' },
    { type: 'location', label: 'Location', icon: 'location-outline' },
    { type: 'photo', label: 'Photo', icon: 'camera-outline' },
    { type: 'audio', label: 'Audio', icon: 'mic-outline' },
    { type: 'video', label: 'Video', icon: 'videocam-outline' },
    { type: 'barcode', label: 'Barcode', icon: 'barcode-outline' },
    { type: 'branch', label: 'Branch', icon: 'copy-outline' },
    { type: 'group', label: 'Group', icon: 'list-outline' }
];

/*
 * Named access to the contract type values: comparisons and assignments read
 * QUESTION_TYPE instead of repeating the string literals.
 */
export const QUESTION_TYPE = {
    TEXT: 'text',
    TEXTAREA: 'textarea',
    INTEGER: 'integer',
    DECIMAL: 'decimal',
    PHONE: 'phone',
    DATE: 'date',
    TIME: 'time',
    DROPDOWN: 'dropdown',
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
    SEARCH_SINGLE: 'searchsingle',
    SEARCH_MULTIPLE: 'searchmultiple',
    README: 'readme',
    LOCATION: 'location',
    PHOTO: 'photo',
    AUDIO: 'audio',
    VIDEO: 'video',
    BARCODE: 'barcode',
    BRANCH: 'branch',
    GROUP: 'group'
};

/* A numeric/search question can switch its contract type; the row keeps the icon. */
export const TYPE_ALIASES = {
    decimal: 'integer',
    searchmultiple: 'searchsingle'
};

export const MULTIPLE_ANSWER_TYPES = [
    'radio',
    'checkbox',
    'dropdown',
    'searchsingle',
    'searchmultiple'
];

export const NUMERIC_TYPES = ['integer', 'decimal'];

export const MEDIA_TYPES = ['photo', 'audio', 'video', 'location'];
export const BRANCH_GROUP_TYPES = ['branch', 'group'];

export const REQUIRED_ALLOWED_TYPES = [
    'text',
    'textarea',
    'date',
    'time',
    'integer',
    'decimal',
    'barcode',
    'phone',
    'radio',
    'checkbox',
    'dropdown',
    'searchmultiple',
    'searchsingle'
];

export const UNIQUENESS_ALLOWED_TYPES = [
    'text',
    'textarea',
    'date',
    'time',
    'integer',
    'decimal',
    'barcode',
    'phone'
];

export const VERIFY_ALLOWED_TYPES = [
    'text',
    'textarea',
    'integer',
    'decimal',
    'barcode',
    'phone'
];
