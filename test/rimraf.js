
import test from 'ava';
import shell from 'await-shell';

console.log(`------
rimraf.js
------`);
test('Executing bundle for rimraf.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/rimraf.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
