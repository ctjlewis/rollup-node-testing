/**
 * @file
 * For each dependency in `packages.txt`, generate a file in the `test/`
 * directory for Ava.
 */

import fs from 'fs';
import glob from 'glob';
import path from 'path';

const dirs = glob.sync('./node_modules/*/', {
  ignore: ['./node_modules/@*/'],
});

const excludes = fs.readFileSync(
    './config/exclude.txt',
    'utf-8',
).split(/\s/).map((f) => `./node_modules/${f}/`);

const getImportTemplate = (dependency) => {
  return `import ${humanReadable(dependency)} from '${dependency}';`;
};

const getTestTemplate = (dependency) => `
import test from 'ava';
import shell from 'await-shell';

test('Source and bundle should have similar exit codes', async (t) => {
  let sourceNonzero, bundleNonzero;

  try {
    await shell('node ./bundles/${dependency}');
    bundleNonzero = false;
  } catch (e) {
    bundleNonzero = true;
  }

  try {
    await shell('node ./node_modules/${dependency}');
    sourceNonzero = false;
  } catch (e) {
    sourceNonzero = true;
  }

  if (sourceNonzero == bundleNonzero) t.pass();
  else {
    await shell('echo ${dependency} >> results/failures');
    t.fail(
        \`SOURCE nonzero exit: \${sourceNonzero}\\n\`
      + \`BUNDLE nonzero exit: \${bundleNonzero}\`,
    );
  }
});
`;

const humanReadable = (dir) => path.basename(dir).replace(/[^a-z]/ig, '');

(async () => {
  await Promise.all(
      dirs
          .filter((dir) => !excludes.includes(dir))
          .map(
              (dir) => {
                const dependencyName = path.basename(dir);
                return Promise.all([
                  /**
                   * Write import files that Rollup will bundle.
                   */
                  fs.promises.writeFile(
                      `./imports/${dependencyName}.js`,
                      getImportTemplate(dependencyName),
                  ),
                  /**
                   * Write AVA tests, which will read compiled bundles and
                   * verify there are no errors.
                   */
                  fs.promises.writeFile(
                      `./test/${dependencyName}.js`,
                      getTestTemplate(dependencyName),
                  ),
                ]);
              },
          ),
  );
  console.log('Built files at imports/ and test/.');
})();
