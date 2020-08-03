
import test from 'ava';
import shell from 'await-shell';

console.log(`------
mocha.js
------`);
test('Executing bundle for mocha.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/mocha.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
