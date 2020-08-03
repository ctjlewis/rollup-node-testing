
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for @types-node.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@types-node.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
