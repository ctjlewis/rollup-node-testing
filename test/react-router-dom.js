
import test from 'ava';
import shell from 'await-shell';

console.log(`------
react-router-dom.js
------`);
test('Executing bundle for react-router-dom.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/react-router-dom.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
