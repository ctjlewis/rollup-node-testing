
import test from 'ava';
import shell from 'await-shell';

console.log(`------
moment.js
------`);
test('Executing bundle for moment.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/moment.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
