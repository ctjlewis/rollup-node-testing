
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@angular-platform-browser.js
------`);
test('Executing bundle for @angular-platform-browser.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@angular-platform-browser.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
