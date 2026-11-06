import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it } from 'vitest';
import { PARAMETERS } from '@/config/parameters.js';
import {
    createReadmeEditor,
    ReadmeLength,
    sanitizeEditorHTML
} from '@/ui/readme-editor.js';

const editors = [];

function length_editor(content) {
    const element = document.createElement('div');

    document.body.append(element);

    const editor = new Editor({
        element,
        extensions: [StarterKit, ReadmeLength],
        content
    });

    editors.push(editor);

    return editor;
}

afterEach(() => {
    editors.splice(0).forEach((editor) => {
        editor.destroy();
    });
    document.body.innerHTML = '';
});

describe('readme sanitising', () => {
    it('keeps the tags the project definition supports', () => {
        expect(sanitizeEditorHTML('<p><b>bold</b> <strong>strong</strong> <i>it</i> <em>em</em> <u>u</u><br></p>'))
            .toBe('<p><b>bold</b> <strong>strong</strong> <i>it</i> <em>em</em> <u>u</u><br></p>');
    });

    it('strips attributes and removes executable elements', () => {
        expect(sanitizeEditorHTML('<p onclick="alert(1)" style="color:red">Hi</p>')).toBe('<p>Hi</p>');
        expect(sanitizeEditorHTML('<script>alert(1)</script><p>Safe</p>')).toBe('<p>Safe</p>');
        expect(sanitizeEditorHTML('<style>p{}</style><iframe src="x"></iframe><p>Safe</p>')).toBe('<p>Safe</p>');
    });

    it('unwraps unsupported elements but keeps their text', () => {
        expect(sanitizeEditorHTML('<h1>Title</h1><p>Body</p>')).toBe('Title<p>Body</p>');
        expect(sanitizeEditorHTML('<ul><li>One</li><li>Two</li></ul>')).toBe('OneTwo');
        expect(sanitizeEditorHTML('<p><a href="https://example.test">link</a></p>')).toBe('<p>link</p>');
    });

    it('returns an empty string for empty content', () => {
        expect(sanitizeEditorHTML('')).toBe('');
    });
});

describe('readme length limit', () => {
    it('blocks an insertion that would pass the limit', () => {
        const editor = length_editor('<p>' + 'x'.repeat(PARAMETERS.README_MAX_LENGTH) + '</p>');

        expect(editor.getText()).toHaveLength(PARAMETERS.README_MAX_LENGTH);

        editor.commands.insertContent('y');

        expect(editor.getText()).toHaveLength(PARAMETERS.README_MAX_LENGTH);
    });

    it('allows replacing characters at the limit and shrinking the text', () => {
        const editor = length_editor('<p>' + 'x'.repeat(PARAMETERS.README_MAX_LENGTH) + '</p>');

        editor.commands.insertContentAt({ from: 1, to: 2 }, 'y');
        expect(editor.getText()).toHaveLength(PARAMETERS.README_MAX_LENGTH);
        expect(editor.getText().charAt(0)).toBe('y');

        editor.commands.deleteRange({ from: 1, to: 2 });
        expect(editor.getText()).toHaveLength(PARAMETERS.README_MAX_LENGTH - 1);

        editor.commands.insertContentAt(PARAMETERS.README_MAX_LENGTH - 1, 'z');
        expect(editor.getText()).toHaveLength(PARAMETERS.README_MAX_LENGTH);
    });
});

describe('readme editor', () => {
    it('mounts the toolbar and the editor content', () => {
        const editor = createReadmeEditor('<p>Hello <strong>world</strong></p>', () => {});

        expect(editor.element.classList.contains('builder__readme-editor')).toBe(true);
        expect(editor.element.querySelectorAll('.builder__readme-toolbar-button')).toHaveLength(3);
        expect(editor.element.querySelector('.ProseMirror').textContent).toContain('Hello world');

        editor.destroy();
    });

    it('toggles formatting from the toolbar and keeps aria-pressed in sync', () => {
        const editor = createReadmeEditor('<p>Hello</p>', () => {});
        const bold = editor.element.querySelector('[data-format="bold"]');
        const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

        bold.dispatchEvent(mousedown);
        expect(mousedown.defaultPrevented).toBe(true);

        bold.click();

        expect(bold.getAttribute('aria-pressed')).toBe('true');

        editor.destroy();
    });
});
