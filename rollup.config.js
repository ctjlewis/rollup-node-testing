/**
 * This suite of plugins will be common for trying to bundle
 * a bunch of legacy CJS Node modules to an ESM output.
 */
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';

import fs from 'fs';
import path from 'path';
import glob from 'glob';

const humanReadable = (dir) => path.basename(dir).replace(/[^a-z]/ig, '');

const IGNORE = glob.sync('./bundles/*').map(
    (f) => `./imports/${path.basename(f)}`,
);

const dirs = glob.sync('./imports/*', {
  ignore: IGNORE,
});

const excludes = fs.readFileSync(
    './packages_exclude.txt',
    'utf-8',
).split(/\s/).map((f) => `./imports/${humanReadable(f)}.js`);

export default dirs
    .filter((f) => !excludes.includes(f))
    .map(
        (dir) => ({
          // ESM entry
          input: dir,
          // ESM output
          output: {
            file: `./bundles/${path.basename(dir)}`,
            format: 'esm',
          },
          // plugin suite
          plugins: [
            cjs({
              transformMixedEsModules: true,
              extensions: ['.js', '.cjs'],
            }),
            json(),
            resolve({
              extensions: ['.js', '.cjs', '.mjs', '.json', '.node'],
              preferBuiltins: true,
            }),
          ],
        }),
    );

// export default {
//   // ESM entry
//   input: `./imports/gulp.js`,
//   // ESM output
//   output: {
//     file: `./bundles/gulp.js`,
//     format: 'esm'
//   },
//   // plugin suite
//   plugins: [
//     cjs({
//       extensions: ['.js', '.cjs'],
//     }),
//     json(),
//     resolve({
//       extensions: ['.js', '.cjs', '.mjs', '.json', '.node'],
//       preferBuiltins: true,
//     }),
//   ],
// };
