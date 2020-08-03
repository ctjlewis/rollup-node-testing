
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for request.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/request.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
