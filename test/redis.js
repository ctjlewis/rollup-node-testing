
import test from 'ava';
import shell from 'await-shell';

console.log(`------
redis.js
------`);
test('Executing bundle for redis.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/redis.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
