
import test from 'ava';
import shell from 'await-shell';

console.log(`------
morgan.js
------`);
test('Executing bundle for morgan.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/morgan.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
