
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for core-js.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/core-js.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
