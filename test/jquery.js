
import test from 'ava';
import shell from 'await-shell';

console.log(`------
jquery.js
------`);
test('Executing bundle for jquery.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/jquery.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
