'use strict';

/**
 * Font Awesome class -> Ionicons name.
 *
 * The legacy modules use Font Awesome class names both as glyphs and as state
 * (`.fa-check` means valid, `.fa-exclamation-triangle` means invalid) and as
 * delegated event selectors. The classes are never removed; only the glyph
 * implementation changes.
 */
export const FONT_AWESOME_ICONS = {
    'fa-align-justify': 'albums',
    'fa-arrow-circle-o-down': 'arrow-down-circle',
    'fa-arrows-v': 'swap-vertical',
    'fa-barcode': 'barcode',
    'fa-calendar': 'calendar',
    'fa-camera-retro': 'camera',
    'fa-caret-square-o-down': 'chevron-down-circle',
    'fa-check': 'checkmark',
    'fa-check-square-o': 'checkbox',
    'fa-chevron-left': 'chevron-back',
    'fa-chevron-right': 'chevron-forward',
    'fa-clock-o': 'time',
    'fa-clone': 'copy',
    'fa-dot-circle-o': 'radio-button-on',
    'fa-edit': 'create',
    'fa-exclamation': 'alert',
    'fa-exclamation-triangle': 'warning',
    'fa-file': 'document',
    'fa-file-text-o': 'document-text',
    'fa-files-o': 'documents',
    'fa-hashtag': 'calculator',
    'fa-map-marker': 'location',
    'fa-microphone': 'mic',
    'fa-phone': 'call',
    'fa-plus': 'add',
    'fa-power-off': 'power',
    'fa-question-circle': 'help-circle',
    'fa-search': 'search',
    'fa-sticky-note-o': 'chatbox-ellipses',
    'fa-text-width': 'text',
    'fa-times': 'close',
    'fa-trash-o': 'trash',
    'fa-undo': 'arrow-undo',
    'fa-upload': 'cloud-upload',
    'fa-video-camera': 'videocam',
    'fa-warning': 'warning'
};

export const FALLBACK_ICON = 'ellipse';

export function resolveIconName(class_list) {
    const classes = Array.from(class_list);

    for (let index = 0; index < classes.length; index++) {
        const name = FONT_AWESOME_ICONS[classes[index]];

        if (name) {
            return name;
        }
    }

    return FALLBACK_ICON;
}
