
import test from 'ava';
import shell from 'await-shell';

console.log(`------
sass-loader.js
------`);
test('Executing bundle for sass-loader.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/sass-loader.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
