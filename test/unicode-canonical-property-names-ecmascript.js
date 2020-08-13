
import test from 'ava';
import shell from 'await-shell';

test('Source and bundle should have similar exit codes', async (t) => {
  let sourceNonzero, bundleNonzero;

  try {
    await shell('node ./bundles/unicode-canonical-property-names-ecmascript');
    bundleNonzero = false;
  } catch (e) {
    bundleNonzero = true;
  }

  try {
    await shell('node ./node_modules/unicode-canonical-property-names-ecmascript');
    sourceNonzero = false;
  } catch (e) {
    sourceNonzero = true;
  }

  if (sourceNonzero == bundleNonzero) t.pass();
  else {
    await shell('echo unicode-canonical-property-names-ecmascript >> results/failures');
    t.fail(
        `SOURCE nonzero exit: ${sourceNonzero}\n`
      + `BUNDLE nonzero exit: ${bundleNonzero}`,
    );
  }
});
