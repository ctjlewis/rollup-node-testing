
import test from 'ava';
import shell from 'await-shell';

console.log(`------
request-promise.js
------`);
test('Executing bundle for request-promise.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/request-promise.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
