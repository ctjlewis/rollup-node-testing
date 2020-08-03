
import test from 'ava';
import shell from 'await-shell';

console.log(`------
classnames.js
------`);
test('Executing bundle for classnames.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/classnames.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
