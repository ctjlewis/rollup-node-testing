
import test from 'ava';
import shell from 'await-shell';

console.log(`------
aws-sdk.js
------`);
test('Executing bundle for aws-sdk.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/aws-sdk.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
