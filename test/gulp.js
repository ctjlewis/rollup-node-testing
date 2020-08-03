
import test from 'ava';
import shell from 'await-shell';

console.log(`------
gulp.js
------`);
test('Executing bundle for gulp.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/gulp.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
