
import test from 'ava';
import shell from 'await-shell';

console.log(`------
cheerio.js
------`);
test('Executing bundle for cheerio.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/cheerio.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
