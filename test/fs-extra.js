
import test from 'ava';
import shell from 'await-shell';

console.log(`------
fs-extra.js
------`);
test('Executing bundle for fs-extra.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/fs-extra.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
