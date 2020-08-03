
import test from 'ava';
import shell from 'await-shell';

console.log(`------
eslint-plugin-import.js
------`);
test('Executing bundle for eslint-plugin-import.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/eslint-plugin-import.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
