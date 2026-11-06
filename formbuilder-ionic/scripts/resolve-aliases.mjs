import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const package_root = path.resolve(here, '..');
const repo_root = path.resolve(package_root, '..');
const src_root = path.join(package_root, 'src');
const legacy_root = path.join(repo_root, 'js', 'app_modules');

export const LEGACY_TREES = ['actions', 'config', 'factory', 'helpers', 'inputs', 'loaders', 'template', 'ui-handlers'];

export function resolveAliases() {
    const aliases = LEGACY_TREES.map((tree) => ({
        find: new RegExp('^' + tree + '(?=/|$)'),
        replacement: path.join(legacy_root, tree)
    }));

    // The Ajv validator in src replaces the legacy
    // helpers/import-form-validation specifier. It must sort before the
    // helpers/ tree alias so the bare specifier wins over the tree prefix.
    aliases.unshift({
        find: /^helpers\/import-form-validation$/,
        replacement: path.join(src_root, 'services', 'import-form-validation.js')
    });
    aliases.unshift({
        find: /^legacy(?=\/|$)/,
        replacement: path.join(repo_root, 'js')
    });
    aliases.push({
        find: /^@(?=\/|$)/,
        replacement: src_root
    });

    return aliases;
}

export const paths = {
    package_root,
    repo_root,
    src_root,
    legacy_root,
    dist_root: path.join(package_root, 'dist')
};
