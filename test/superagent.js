
import test from 'ava';
import shell from 'await-shell';

console.log(`------
superagent.js
------`);
test('Executing bundle for superagent.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/superagent.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
