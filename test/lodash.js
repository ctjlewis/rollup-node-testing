
import test from 'ava';
import shell from 'await-shell';

console.log(`------
lodash.js
------`);
test('Executing bundle for lodash.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/lodash.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
