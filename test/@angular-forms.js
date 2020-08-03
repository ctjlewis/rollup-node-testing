
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@angular-forms.js
------`);
test('Executing bundle for @angular-forms.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@angular-forms.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
