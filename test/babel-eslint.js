
import test from 'ava';
import shell from 'await-shell';

console.log(`------
babel-eslint.js
------`);
test('Executing bundle for babel-eslint.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/babel-eslint.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
