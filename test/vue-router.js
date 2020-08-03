
import test from 'ava';
import shell from 'await-shell';

console.log(`------
vue-router.js
------`);
test('Executing bundle for vue-router.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/vue-router.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
