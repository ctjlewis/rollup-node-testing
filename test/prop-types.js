
import test from 'ava';
import shell from 'await-shell';

console.log(`------
prop-types.js
------`);
test('Executing bundle for prop-types.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/prop-types.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
