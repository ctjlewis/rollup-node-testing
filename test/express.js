
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for express.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/express.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
