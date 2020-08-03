
import test from 'ava';
import shell from 'await-shell';

console.log(`------
babel-loader.js
------`);
test('Executing bundle for babel-loader.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/babel-loader.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
