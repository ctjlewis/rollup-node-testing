
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@babel-core.js
------`);
test('Executing bundle for @babel-core.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@babel-core.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
