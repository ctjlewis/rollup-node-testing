
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@angular-router.js
------`);
test('Executing bundle for @angular-router.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@angular-router.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
