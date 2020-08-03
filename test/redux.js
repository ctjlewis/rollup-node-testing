
import test from 'ava';
import shell from 'await-shell';

console.log(`------
redux.js
------`);
test('Executing bundle for redux.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/redux.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
