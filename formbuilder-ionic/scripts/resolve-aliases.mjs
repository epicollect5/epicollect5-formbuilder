import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const package_root = path.resolve(here, '..');
const repo_root = path.resolve(package_root, '..');
const src_root = path.join(package_root, 'src');

/*
    The port imports nothing from js/app_modules (all behaviour is ported into
    src/), so the only alias left is the @/ src alias.
 */
export function resolveAliases() {
    return [
        {
            find: /^@(?=\/|$)/,
            replacement: src_root
        }
    ];
}

export const paths = {
    package_root,
    repo_root,
    src_root,
    dist_root: path.join(package_root, 'dist')
};
