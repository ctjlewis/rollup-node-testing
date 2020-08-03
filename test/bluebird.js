
import test from 'ava';
import shell from 'await-shell';

console.log(`------
bluebird.js
------`);
test('Executing bundle for bluebird.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/bluebird.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
