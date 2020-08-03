
import test from 'ava';
import shell from 'await-shell';

console.log(`------
chai.js
------`);
test('Executing bundle for chai.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/chai.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
