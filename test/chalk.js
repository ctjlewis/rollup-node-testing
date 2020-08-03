
import test from 'ava';
import shell from 'await-shell';

console.log(`------
chalk.js
------`);
test('Executing bundle for chalk.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/chalk.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
