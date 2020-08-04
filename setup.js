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
    './packages_exclude.txt',
    'utf-8',
).split(/\s/).map((f) => `./node_modules/${f}/`);

const getImportTemplate = (dependency) => {
  return `import ${humanReadable(dependency)} from '${dependency}';`;
};

const getTestTemplate = (filename) => `
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for ${filename} should not throw', async (t) => {
  try {
    await shell('node ./bundles/${filename}');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
`;

const humanReadable = (dir) => path.basename(dir).replace(/[^a-z]/ig, '');

(async () => {
  await Promise.all(
      dirs
          .filter((dependency) => !excludes.includes(dependency))
          .map(
              (dependency) => {
                const filename = humanReadable(dependency);
                return Promise.all([
                  /**
                   * Write import files that Rollup will bundle.
                   */
                  fs.promises.writeFile(
                      `./imports/${filename}.js`,
                      getImportTemplate(path.basename(dependency)),
                  ),
                  /**
                   * Write AVA tests, which will read compiled bundles and
                   * verify there are no errors.
                   */
                  fs.promises.writeFile(
                      `./test/${filename}.js`,
                      getTestTemplate(filename),
                  ),
                ]);
              },
          ),
  );
  console.log('Built files at imports/ and test/.');
})();
