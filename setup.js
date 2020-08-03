/**
 * @file
 * For each dependency in `packages.txt`, generate a file in the `test/`
 * directory for Ava.
 */

import fs from 'fs';

const TEST_TEMPLATE = `
import test from 'ava';

test('Testing the test process', (t) => {
  t.pass();
});
`;

(async () => {
  const dependencies = fs.readFileSync('./packages.txt', 'utf-8').split(' ');
  await Promise.all(
    dependencies.map(
      dependency => fs.promises.writeFile(
        `./test/${dependency.replace('/', '-')}.js`,
        TEST_TEMPLATE
      )
    )
  );
})();