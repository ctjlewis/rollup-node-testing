
import test from 'ava';
import shell from 'await-shell';

console.log(`------
css-loader.js
------`);
test('Executing bundle for css-loader.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/css-loader.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
