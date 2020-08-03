
import test from 'ava';
import shell from 'await-shell';

console.log(`------
postcss-loader.js
------`);
test('Executing bundle for postcss-loader.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/postcss-loader.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
