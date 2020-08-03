
import test from 'ava';
import shell from 'await-shell';

console.log(`------
babel-runtime.js
------`);
test('Executing bundle for babel-runtime.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/babel-runtime.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
