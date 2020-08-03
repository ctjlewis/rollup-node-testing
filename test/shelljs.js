
import test from 'ava';
import shell from 'await-shell';

console.log(`------
shelljs.js
------`);
test('Executing bundle for shelljs.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/shelljs.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
