import glob from 'glob';
import shell from 'await-shell';
import path from 'path';

const IGNORE_MODULES = glob.sync('./bundles/*').map(
    (f) => `./imports/${path.basename(f)}`,
);

const NODE_MODULES = glob.sync('./node_modules/*/', {
  /** exclude @vendor/packages for now */
  ignore: ['./node_modules/@*/'],
});

(async () => {
  NODE_MODULES
      .filter((f) => !IGNORE_MODULES.includes(f))
      .map(
          async (nodeModule) => await shell(
              `yarn bundle ${nodeModule} -o bundles/${nodeModule}.js`,
          ),
      );
})();
