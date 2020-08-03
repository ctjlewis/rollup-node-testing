
import test from 'ava';
import shell from 'await-shell';

console.log(`------
rxjs.js
------`);
test('Executing bundle for rxjs.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/rxjs.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
