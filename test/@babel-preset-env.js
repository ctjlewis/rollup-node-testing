
import test from 'ava';
import shell from 'await-shell';

console.log(`------
@babel-preset-env.js
------`);
test('Executing bundle for @babel-preset-env.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/@babel-preset-env.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
