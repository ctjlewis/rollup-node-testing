
import test from 'ava';
import shell from 'await-shell';

console.log(`------
node-sass.js
------`);
test('Executing bundle for node-sass.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/node-sass.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
