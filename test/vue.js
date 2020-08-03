
import test from 'ava';
import shell from 'await-shell';

console.log(`------
vue.js
------`);
test('Executing bundle for vue.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/vue.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
