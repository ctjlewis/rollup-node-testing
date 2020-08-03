
import test from 'ava';
import shell from 'await-shell';

console.log(`------
cors.js
------`);
test('Executing bundle for cors.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/cors.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
