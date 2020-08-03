
import test from 'ava';
import shell from 'await-shell';

console.log(`------
uuid.js
------`);
test('Executing bundle for uuid.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/uuid.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
