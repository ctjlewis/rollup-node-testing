
import test from 'ava';
import shell from 'await-shell';

console.log(`------
request.js
------`);
test('Executing bundle for request.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/request.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
