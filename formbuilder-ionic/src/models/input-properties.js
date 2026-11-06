'use strict';

import { isMultipleAnswerType } from '@/models/possible-answers.js';

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

export const MEDIA_TYPES = ['photo', 'audio', 'video', 'location'];
export const BRANCH_GROUP_TYPES = ['branch', 'group'];
export const READONLY_PANEL_TYPES = [...MEDIA_TYPES, ...BRANCH_GROUP_TYPES, 'readme'];

export const DATE_FORMATS = [
    { value: 'dd/MM/YYYY', label: 'Day/Month/Year' },
    { value: 'MM/dd/YYYY', label: 'Month/Day/Year' },
    { value: 'YYYY/MM/dd', label: 'Year/Month/Day' },
    { value: 'MM/YYYY', label: 'Month/Year' },
    { value: 'dd/MM', label: 'Day/Month' }
];

export const TIME_FORMATS = [
    { value: 'HH:mm:ss', label: 'Hours:Minutes:Seconds (24 hours)' },
    { value: 'hh:mm:ss', label: 'Hours:Minutes:Seconds (12 hours)' },
    { value: 'HH:mm', label: 'Hours:Minutes (24 hours)' },
    { value: 'hh:mm', label: 'Hours:Minutes (12 hours)' },
    { value: 'mm:ss', label: 'Minutes:Seconds' }
];

export const allowsRequired = (type) => {
    return REQUIRED_ALLOWED_TYPES.indexOf(type) !== -1;
};

export const allowsTitle = (type) => {
    return !isMediaType(type) && !isBranchOrGroup(type) && type !== 'readme';
};

export const allowsUniqueness = (type) => {
    return UNIQUENESS_ALLOWED_TYPES.indexOf(type) !== -1;
};

export const allowsVerify = (type) => {
    return VERIFY_ALLOWED_TYPES.indexOf(type) !== -1;
};

export const isMediaType = (type) => {
    return MEDIA_TYPES.indexOf(type) !== -1;
};

export const isBranchOrGroup = (type) => {
    return BRANCH_GROUP_TYPES.indexOf(type) !== -1;
};

export const hasAdvancedTab = (type) => {
    if (type === 'readme') {
        return false;
    }

    if (isMediaType(type) || isBranchOrGroup(type)) {
        return false;
    }

    return true;
};

export const hasJumpsTab = (type) => {
    return isBranchOrGroup(type) ? false : true;
};

export const getDefaultDatetimeFormat = (type) => {
    if (type === 'date') {
        return 'dd/MM/YYYY';
    }

    if (type === 'time') {
        return 'HH:mm';
    }

    return null;
};
