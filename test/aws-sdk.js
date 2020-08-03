
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for aws-sdk.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/aws-sdk.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
