'use strict';

/*
 * The 18 question types the legacy formbuilder offers, in toolbar order.
 * `type` is the project-definition value and must never change: the server,
 * the mobile app and the dataviewer read it.
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

export function getQuestionType(type) {
    return QUESTION_TYPES.find(function (question_type) {
        return question_type.type === type;
    }) || null;
}
