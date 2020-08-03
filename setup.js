/**
 * @file
 * For each dependency in `packages.txt`, generate a file in the `test/`
 * directory for Ava.
 */

import fs from 'fs';
import shell from 'await-shell';

const excludes = fs.readFileSync('./packages_exclude.txt', 'utf-8').split(' ');

const getImportTemplate = (dependency) => {
  const ecmaSafe = /[a-z]+/i.exec(dependency)[0];
  return `import ${ecmaSafe} from '${dependency}';`;
};

const getTestTemplate = (filename) => `
import test from 'ava';
import shell from 'await-shell';

console.log(\`------\n${filename}\n------\`);
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

(async () => {
  const dependencies = fs.readFileSync('./packages_include.txt', 'utf-8').split(' ');
  console.log(excludes);
  await Promise.all(
    dependencies
      .filter(dependency => !excludes.includes(dependency))
      .map(
        async (dependency) => {
          const filename = dependency.replace('/', '-') + '.js';

          return Promise.all([
            /**
             * Write import files that Rollup will bundle.
             */
            fs.promises.writeFile(
              `./imports/${filename}`,
              getImportTemplate(dependency)
            ),
            /**
             * Write AVA tests, which will read compiled bundles and verify there
             * are no errors.
             */
            fs.promises.writeFile(
              `./test/${filename}`,
              getTestTemplate(filename)
            )
          ]);
        }
      )
    );

  await shell('yarn bundle');

})();