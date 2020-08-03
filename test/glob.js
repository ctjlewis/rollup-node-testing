
import test from 'ava';
import shell from 'await-shell';

console.log(`------
glob.js
------`);
test('Executing bundle for glob.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/glob.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
