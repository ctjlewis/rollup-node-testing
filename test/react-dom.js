
import test from 'ava';
import shell from 'await-shell';

console.log(`------
react-dom.js
------`);
test('Executing bundle for react-dom.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/react-dom.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
