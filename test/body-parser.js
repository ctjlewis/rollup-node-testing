
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for body-parser.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/body-parser.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
