
import test from 'ava';
import shell from 'await-shell';

console.log(`------
body-parser.js
------`);
test('Executing bundle for body-parser.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/body-parser.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
