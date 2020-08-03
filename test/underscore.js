
import test from 'ava';
import shell from 'await-shell';

console.log(`------
underscore.js
------`);
test('Executing bundle for underscore.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/underscore.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
