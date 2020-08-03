
import test from 'ava';
import shell from 'await-shell';

console.log(`------
tslib.js
------`);
test('Executing bundle for tslib.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/tslib.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
