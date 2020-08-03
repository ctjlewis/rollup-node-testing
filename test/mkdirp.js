
import test from 'ava';
import shell from 'await-shell';

console.log(`------
mkdirp.js
------`);
test('Executing bundle for mkdirp.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/mkdirp.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
