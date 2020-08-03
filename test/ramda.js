
import test from 'ava';
import shell from 'await-shell';

console.log(`------
ramda.js
------`);
test('Executing bundle for ramda.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/ramda.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
