
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for colors.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/colors.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
