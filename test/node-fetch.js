
import test from 'ava';
import shell from 'await-shell';

console.log(`------
node-fetch.js
------`);
test('Executing bundle for node-fetch.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/node-fetch.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
