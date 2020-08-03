
import test from 'ava';
import shell from 'await-shell';

console.log(`------
colors.js
------`);
test('Executing bundle for colors.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/colors.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
