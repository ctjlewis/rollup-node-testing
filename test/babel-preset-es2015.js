
import test from 'ava';
import shell from 'await-shell';

console.log(`------
babel-preset-es2015.js
------`);
test('Executing bundle for babel-preset-es2015.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/babel-preset-es2015.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
