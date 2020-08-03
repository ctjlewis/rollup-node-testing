
import test from 'ava';
import shell from 'await-shell';

console.log(`------
dotenv.js
------`);
test('Executing bundle for dotenv.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/dotenv.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
