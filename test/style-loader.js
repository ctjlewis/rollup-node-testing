
import test from 'ava';
import shell from 'await-shell';

console.log(`------
style-loader.js
------`);
test('Executing bundle for style-loader.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/style-loader.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
