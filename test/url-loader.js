
import test from 'ava';
import shell from 'await-shell';

console.log(`------
url-loader.js
------`);
test('Executing bundle for url-loader.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/url-loader.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
