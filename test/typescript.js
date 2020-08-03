
import test from 'ava';
import shell from 'await-shell';

console.log(`------
typescript.js
------`);
test('Executing bundle for typescript.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/typescript.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
