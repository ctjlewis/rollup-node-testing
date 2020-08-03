
import test from 'ava';
import shell from 'await-shell';

test('Executing bundle for react-dom.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/react-dom.js');
  } catch (e) {
    return t.fail(e);
  }
  t.pass();
});
