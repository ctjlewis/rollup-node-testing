
import test from 'ava';
import shell from 'await-shell';

console.log(`------
axios.js
------`);
test('Executing bundle for axios.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/axios.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
