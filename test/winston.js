
import test from 'ava';
import shell from 'await-shell';

console.log(`------
winston.js
------`);
test('Executing bundle for winston.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/winston.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
