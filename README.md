# Rollup 🤝 Node
### Stress-testing against the most depended-on npm packages
This is a small project to integrate Rollup with third party NodeJS packages,
inspired by a bug encountered when rolling up a module that depends on
`chokidar` (which is manually included for this reason).

This `package.json` contains dependencies for the top 109 npm packages. An ES6
import is generated for each package and then bundled with Rollup. The test
passes for a module if the bundle is generated without errors and produces the
same output as the source module.

**Get started with `yarn cold-start`.**

| Command     | Result      |
| ----------- | ----------- |
| `yarn add-packages` | Add yarn dependencies from `packages_include.txt`. |
| `yarn clean` | Remove all built tests and import files. |
| `yarn cold-start` | Add all needed yarn depdendencies, build tests and imports, start the test suite. |
| `yarn setup` | Build test and import files (this will take a while!) |
| `yarn test`  | Run tests in `tests/` directory. |