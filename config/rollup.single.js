/**
 * This suite of plugins will be common for trying to bundle
 * a bunch of legacy CJS Node modules to an ESM output.
 */
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';

export default {
  // ESM entry
  // ESM output
  output: {
    path: `./bundles/`,
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
};
