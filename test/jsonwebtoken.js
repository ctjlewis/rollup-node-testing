
import test from 'ava';
import shell from 'await-shell';

console.log(`------
jsonwebtoken.js
------`);
test('Executing bundle for jsonwebtoken.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/jsonwebtoken.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
