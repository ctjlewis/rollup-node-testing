
import test from 'ava';
import shell from 'await-shell';

console.log(`------
minimist.js
------`);
test('Executing bundle for minimist.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/minimist.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
