
import test from 'ava';
import shell from 'await-shell';

console.log(`------
graphql.js
------`);
test('Executing bundle for graphql.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/graphql.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
