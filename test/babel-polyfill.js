
import test from 'ava';
import shell from 'await-shell';

console.log(`------
babel-polyfill.js
------`);
test('Executing bundle for babel-polyfill.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/babel-polyfill.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
