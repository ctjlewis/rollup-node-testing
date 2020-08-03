
import test from 'ava';
import shell from 'await-shell';

console.log(`------
react-redux.js
------`);
test('Executing bundle for react-redux.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/react-redux.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
