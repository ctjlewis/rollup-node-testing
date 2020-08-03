
import test from 'ava';
import shell from 'await-shell';

console.log(`------
mongoose.js
------`);
test('Executing bundle for mongoose.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/mongoose.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
