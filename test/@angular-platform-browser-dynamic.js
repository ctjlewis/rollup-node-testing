
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@angular-platform-browser-dynamic.js
------`);
test('Executing bundle for @angular-platform-browser-dynamic.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@angular-platform-browser-dynamic.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
