
import test from 'ava';
import shell from 'await-shell';

console.log(`------
chokidar.js
------`);
test('Executing bundle for chokidar.js should not throw', async (t) => {
  try {
    process.stderr.on('data', chunk => captured += chunk)
    await shell('node ./bundles/chokidar.js');
  } catch (e) {
    t.log(captured);
    return t.fail();
  }
  t.pass();
});
