
import test from 'ava';
import shell from 'await-shell';

console.log(`------
xml2js.js
------`);
test('Executing bundle for xml2js.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/xml2js.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
