
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@angular-compiler.js
------`);
test('Executing bundle for @angular-compiler.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@angular-compiler.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
