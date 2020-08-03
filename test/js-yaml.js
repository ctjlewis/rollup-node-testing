
import test from 'ava';
import shell from 'await-shell';

console.log(`------
js-yaml.js
------`);
test('Executing bundle for js-yaml.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/js-yaml.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
