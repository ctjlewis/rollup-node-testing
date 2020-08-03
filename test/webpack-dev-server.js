
import test from 'ava';
import shell from 'await-shell';

console.log(`------
webpack-dev-server.js
------`);
test('Executing bundle for webpack-dev-server.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/webpack-dev-server.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
