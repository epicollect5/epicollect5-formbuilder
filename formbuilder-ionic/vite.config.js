import fs from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from 'vite';
import { checkSchemaParameters } from './scripts/check-schema-parameters.mjs';
import { IONIC_PREFIX, PROJECT_PREFIX, PUBLIC_PREFIX, landingMiddleware, projectSaveMiddleware, staticMiddleware } from './scripts/comparison-server.mjs';
import { paths, resolveAliases } from './scripts/resolve-aliases.mjs';

const repo_root = paths.repo_root;
const src_root = paths.src_root;
const dist_root = paths.dist_root;
const here = paths.package_root;

async function copyStaticIntoDist(out_dir) {
    await fs.cp(path.join(repo_root, 'public', 'favicons'), path.join(out_dir, 'favicons'), { recursive: true });
    await fs.mkdir(path.join(out_dir, 'vendor', 'ionicons'), { recursive: true });
    await fs.cp(
        path.join(here, 'node_modules', 'ionicons', 'dist', 'ionicons', 'svg'),
        path.join(out_dir, 'vendor', 'ionicons', 'svg'),
        {
            recursive: true,
            filter: (source) => !source.endsWith('.npmignore')
        }
    );
}

function comparisonPlugin() {
    let schema_checked = false;

    return {
        name: 'formbuilder-comparison',
        async buildStart() {
            if (!schema_checked) {
                schema_checked = true;
                await checkSchemaParameters();
            }
        },
        configureServer(server) {
            server.middlewares.use(projectSaveMiddleware(repo_root));
            server.middlewares.use(landingMiddleware());
            server.middlewares.use(staticMiddleware(PUBLIC_PREFIX, path.join(repo_root, 'public')));
            server.middlewares.use(staticMiddleware(PROJECT_PREFIX, path.join(repo_root, 'project')));
            server.middlewares.use(staticMiddleware(
                IONIC_PREFIX + 'vendor/ionicons/svg/',
                path.join(here, 'node_modules', 'ionicons', 'dist', 'ionicons', 'svg')
            ));
            server.middlewares.use(staticMiddleware(
                IONIC_PREFIX + 'favicons/',
                path.join(repo_root, 'public', 'favicons')
            ));
        },
        async writeBundle() {
            await copyStaticIntoDist(dist_root);
        }
    };
}

export default defineConfig({
    root: src_root,
    base: '/epicollect5-formbuilder/ionic/',
    define: {
        'window.__FORMBUILDER_DEV__': 'true'
    },
    resolve: {
        alias: resolveAliases()
    },
    build: {
        outDir: dist_root,
        emptyOutDir: true,
        target: 'es2020',
        sourcemap: true,
        cssCodeSplit: false,
        rollupOptions: {
            input: {
                app: path.join(src_root, 'index.html')
            },
            output: {
                entryFileNames: 'js/[name].js',
                chunkFileNames: 'js/[name].js',
                assetFileNames: (asset_info) => {
                    if (asset_info.name && asset_info.name.endsWith('.css')) {
                        return 'css/ionic-formbuilder.css';
                    }

                    return 'assets/[name][extname]';
                },
                manualChunks: (id) => {
                    if (id.includes('@ionic/core') || id.includes('ionicons')) {
                        return 'ionic';
                    }

                    // jQuery and jQuery UI stay in the app entry: jQuery UI
                    // extends the global jQuery object at import time, so it
                    // must evaluate after src/jquery.js publishes it.
                    if (id.includes('node_modules/jquery') || id.includes('node_modules/jquery-ui')) {
                        return undefined;
                    }

                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                }
            }
        }
    },
    server: {
        host: '127.0.0.1',
        port: 5183,
        strictPort: true,
        fs: {
            allow: [repo_root]
        }
    },
    plugins: [comparisonPlugin()]
});
