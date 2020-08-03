
import test from 'ava';
import shell from 'await-shell';

console.log(`------
reflect-metadata.js
------`);
test('Executing bundle for reflect-metadata.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/reflect-metadata.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
