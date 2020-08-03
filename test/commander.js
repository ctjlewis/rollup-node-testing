
import test from 'ava';
import shell from 'await-shell';

console.log(`------
commander.js
------`);
test('Executing bundle for commander.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/commander.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
