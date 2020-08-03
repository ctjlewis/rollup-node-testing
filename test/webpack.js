
import test from 'ava';
import shell from 'await-shell';

console.log(`------
webpack.js
------`);
test('Executing bundle for webpack.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/webpack.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
