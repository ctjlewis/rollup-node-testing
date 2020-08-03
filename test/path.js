
import test from 'ava';
import shell from 'await-shell';

console.log(`------
path.js
------`);
test('Executing bundle for path.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/path.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
