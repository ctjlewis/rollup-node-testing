# Rollup 🤝 Node
### Stress-testing against the most depended-on npm packages
This is a small project to integrate Rollup with third party NodeJS packages,
inspired by a bug encountered when rolling up a module that depends on
`chokidar` (which is manually included for this reason).

This `package.json` contains dependencies for the top 109 npm packages. An ES6
import is generated for each package in `node_modules/`, and then bundled with
Rollup. The test passes for a module if the bundle produces roughly the same
error code as the source module (0 or nonzero).

Note: The test is run against all modules in `node_modules/` - i.e. not just the top
~100 NPM packages, but *all* packages in their dependency tree, or roughly 1,300
modules in total.

## Get started with `yarn start`.
**1112 / 1286 (86%) TESTS PASSING. [View Failures](/results/failures)**

| Command     | Result      |
| ----------- | ----------- |
| `yarn add-packages` | Add yarn dependencies from `config/include.txt`. |
| `yarn clean` | Remove all built tests and import files. |
| `yarn start` | Add all needed yarn depdendencies, build tests and imports, start the test suite. |
| `yarn setup` | Build test and import files (this will take a while!) |
| `yarn test`  | Run tests in `tests/` directory. |