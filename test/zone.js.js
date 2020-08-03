
import test from 'ava';
import shell from 'await-shell';

console.log(`------
zone.js.js
------`);
test('Executing bundle for zone.js.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/zone.js.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
