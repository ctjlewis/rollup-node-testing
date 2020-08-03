
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for fs-extra.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/fs-extra.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
