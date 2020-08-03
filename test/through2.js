
import test from 'ava';
import shell from 'await-shell';

console.log(`------
through2.js
------`);
test('Executing bundle for through2.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/through2.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
