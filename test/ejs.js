
import test from 'ava';
import shell from 'await-shell';

console.log(`------
ejs.js
------`);
test('Executing bundle for ejs.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/ejs.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
