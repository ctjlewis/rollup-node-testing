
import test from 'ava';
import shell from 'await-shell';

console.log(`------
inquirer.js
------`);
test('Executing bundle for inquirer.js should not throw', async (t) => {
  try {
    await shell('node ./bundles/inquirer.js');
  } catch (e) {
    t.log(e);
    return t.fail();
  }
  t.pass();
});
