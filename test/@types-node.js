
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@types-node.js
------`);
test('Executing bundle for @types-node.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@types-node.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
