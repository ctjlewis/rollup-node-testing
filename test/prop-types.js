
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for prop-types.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/prop-types.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
