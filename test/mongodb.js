
import test from 'ava';
import shell from 'await-shell';

console.log(`------
mongodb.js
------`);
test('Executing bundle for mongodb.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/mongodb.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
