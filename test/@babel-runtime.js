
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for @babel-runtime.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@babel-runtime.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
