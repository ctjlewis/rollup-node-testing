
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@angular-common.js
------`);
test('Executing bundle for @angular-common.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@angular-common.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
