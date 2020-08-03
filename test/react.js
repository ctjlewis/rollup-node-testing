
import test from 'ava';
import shell from 'await-shell';

console.log(`------
react.js
------`);
test('Executing bundle for react.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/react.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
