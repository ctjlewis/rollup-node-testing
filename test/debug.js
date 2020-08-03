
import test from 'ava';
import shell from 'await-shell';

console.log(`------
debug.js
------`);
test('Executing bundle for debug.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/debug.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
