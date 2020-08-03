
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@angular-animations.js
------`);
test('Executing bundle for @angular-animations.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@angular-animations.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
