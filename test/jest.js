
import test from 'ava';
import shell from 'await-shell';

console.log(`------
jest.js
------`);
test('Executing bundle for jest.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/jest.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
