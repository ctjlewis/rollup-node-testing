/**
 * This suite of plugins will be common for trying to bundle
 * a bunch of legacy CJS Node modules to an ESM output.
 */
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';

import fs from 'fs';

const EXPORTS = fs.readdirSync('./imports').map(
  file => ({
    // ESM entry
    input: `./imports/${file}`,
    // ESM output
    output: {
      file: `./bundles/${file}`,
      format: 'esm'
    },
    // plugin suite
    plugins: [
      cjs({
        extensions: ['.js', '.cjs'],
      }),
      json(),
      resolve(),
    ],
  })
);

export default EXPORTS;