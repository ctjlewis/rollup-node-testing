
import test from 'ava';
import shell from 'await-shell';

console.log(`------
express.js
------`);
test('Executing bundle for express.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/express.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
