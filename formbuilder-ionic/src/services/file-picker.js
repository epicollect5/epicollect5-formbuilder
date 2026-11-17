'use strict';

/*
 * The hidden file-input picker shared by the import flows (form JSON, answers
 * CSV). It owns the input creation, the change wiring and the FileReader
 * read; the caller owns the validation messages, the wait overlay timing and
 * the parsed continuation. Resolves `{ ok: false, reason }` for a cancelled
 * dialog, a rejected extension/size/read, or `{ ok: true, name, text }` for
 * a validated read. `on_validated` runs after the checks and before the
 * read, so a caller can show its overlay at the exact vanilla point.
 */
export const pickTextFile = (options) => {
    const config = options || {};

    return new Promise((resolve) => {
        const field = document.createElement('input');

        field.type = 'file';
        field.accept = config.accept || '';
        field.hidden = true;

        field.addEventListener('change', () => {
            const file = field.files && field.files[0];

            if (!file) {
                field.remove();
                resolve({ ok: false, reason: 'cancelled' });
                return;
            }

            if (config.extension_pattern && !config.extension_pattern.test(file.name)) {
                field.remove();
                resolve({ ok: false, reason: 'invalid' });
                return;
            }

            if (file.size > config.max_bytes) {
                field.remove();
                resolve({ ok: false, reason: 'too_large' });
                return;
            }

            if (typeof config.on_validated === 'function') {
                config.on_validated(file);
            }

            const reader = new FileReader();

            reader.onload = () => {
                field.remove();
                resolve({ ok: true, name: file.name, text: reader.result });
            };

            reader.onerror = () => {
                field.remove();
                resolve({ ok: false, reason: 'read_error' });
            };

            reader.readAsText(file);
        });

        document.body.append(field);
        field.click();
    });
};
