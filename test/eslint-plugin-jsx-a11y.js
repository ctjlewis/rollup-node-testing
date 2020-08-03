
import test from 'ava';
import shell from 'await-shell';

console.log(`------
eslint-plugin-jsx-a11y.js
------`);
test('Executing bundle for eslint-plugin-jsx-a11y.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/eslint-plugin-jsx-a11y.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
