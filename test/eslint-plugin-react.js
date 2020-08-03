
import test from 'ava';
import shell from 'await-shell';

console.log(`------
eslint-plugin-react.js
------`);
test('Executing bundle for eslint-plugin-react.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/eslint-plugin-react.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
