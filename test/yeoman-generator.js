
import test from 'ava';
import shell from 'await-shell';

console.log(`------
yeoman-generator.js
------`);
test('Executing bundle for yeoman-generator.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/yeoman-generator.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
