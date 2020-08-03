/**
 * This suite of plugins will be common for trying to bundle
 * a bunch of legacy CJS Node modules to an ESM output.
 */
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';

export default {
  // ESM entry
  input: 'index.mjs',
  // ESM output
  output: {
    file: 'output/bundle.mjs',
    format: 'esm'
  },
  // plugin suite
  plugins: [
    cjs({
      extensions: ['.js', '.cjs', '.mjs'],
    }),
    json(),
    resolve(),
  ],
};