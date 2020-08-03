
import test from 'ava';
import shell from 'await-shell';

console.log(`------
q.js
------`);
test('Executing bundle for q.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/q.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
