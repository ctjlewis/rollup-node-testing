
import test from 'ava';
import shell from 'await-shell';

console.log(`------
handlebars.js
------`);
test('Executing bundle for handlebars.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/handlebars.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
