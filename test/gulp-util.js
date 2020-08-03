
import test from 'ava';
import shell from 'await-shell';

console.log(`------
gulp-util.js
------`);
test('Executing bundle for gulp-util.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/gulp-util.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
