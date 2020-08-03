
import test from 'ava';
import shell from 'await-shell';

console.log(`------
object-assign.js
------`);
test('Executing bundle for object-assign.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/object-assign.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
