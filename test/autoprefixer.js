
import test from 'ava';
import shell from 'await-shell';

console.log(`------
autoprefixer.js
------`);
test('Executing bundle for autoprefixer.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/autoprefixer.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
