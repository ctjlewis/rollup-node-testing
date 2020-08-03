
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for async.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/async.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
