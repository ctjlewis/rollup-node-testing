
import test from 'ava';
import shell from 'await-shell';

console.log(`------
yargs.js
------`);
test('Executing bundle for yargs.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/yargs.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
