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
    'fa-align-justify': 'albums-outline',
    'fa-arrow-circle-o-down': 'arrow-down-circle-outline',
    'fa-arrows-v': 'swap-vertical-outline',
    'fa-barcode': 'barcode-outline',
    'fa-calendar': 'calendar-outline',
    'fa-camera-retro': 'camera-outline',
    'fa-caret-square-o-down': 'chevron-down-circle-outline',
    'fa-check': 'checkmark',
    'fa-check-square-o': 'checkbox-outline',
    'fa-chevron-left': 'chevron-back',
    'fa-chevron-right': 'chevron-forward',
    'fa-clock-o': 'time-outline',
    'fa-clone': 'copy-outline',
    'fa-dot-circle-o': 'radio-button-on-outline',
    'fa-edit': 'create-outline',
    'fa-exclamation': 'alert-outline',
    'fa-exclamation-triangle': 'warning-outline',
    'fa-file': 'document-outline',
    'fa-file-text-o': 'document-text-outline',
    'fa-files-o': 'documents-outline',
    'fa-hashtag': 'calculator-outline',
    'fa-map-marker': 'location-outline',
    'fa-microphone': 'mic-outline',
    'fa-phone': 'call-outline',
    'fa-plus': 'add',
    'fa-power-off': 'power-outline',
    'fa-question-circle': 'help-circle-outline',
    'fa-search': 'search-outline',
    'fa-sticky-note-o': 'chatbox-ellipses-outline',
    'fa-text-width': 'text-outline',
    'fa-times': 'close',
    'fa-trash-o': 'trash-outline',
    'fa-upload': 'cloud-upload-outline',
    'fa-video-camera': 'videocam-outline',
    'fa-warning': 'warning-outline'
};

export const FALLBACK_ICON = 'ellipse-outline';

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
