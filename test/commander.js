
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for commander.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/commander.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
