
import test from 'ava';
import shell from 'await-shell';

console.log(`------
bootstrap.js
------`);
test('Executing bundle for bootstrap.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/bootstrap.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
