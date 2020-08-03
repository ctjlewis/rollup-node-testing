
import test from 'ava';
import shell from 'await-shell';

console.log(`------
ws.js
------`);
test('Executing bundle for ws.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/ws.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
