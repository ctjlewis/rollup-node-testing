
import test from 'ava';
import shell from 'await-shell';

console.log(`------
html-webpack-plugin.js
------`);
test('Executing bundle for html-webpack-plugin.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/html-webpack-plugin.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
