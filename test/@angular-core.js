
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@angular-core.js
------`);
test('Executing bundle for @angular-core.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@angular-core.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
