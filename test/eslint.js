
import test from 'ava';
import shell from 'await-shell';

console.log(`------
eslint.js
------`);
test('Executing bundle for eslint.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/eslint.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
