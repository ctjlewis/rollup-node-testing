
import test from 'ava';
import shell from 'await-shell';

console.log(`------
semver.js
------`);
test('Executing bundle for semver.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/semver.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
