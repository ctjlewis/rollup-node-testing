
import test from 'ava';
import shell from 'await-shell';

console.log(`------
socket.io.js
------`);
test('Executing bundle for socket.io.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/socket.io.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
