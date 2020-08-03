
import test from 'ava';
import shell from 'await-shell';

console.log(`------
file-loader.js
------`);
test('Executing bundle for file-loader.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/file-loader.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
