
import test from 'ava';
import shell from 'await-shell';

console.log(`------
qs.js
------`);
test('Executing bundle for qs.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/qs.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
