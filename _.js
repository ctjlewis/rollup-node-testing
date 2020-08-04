// import test from 'ava';
// import fs from 'fs';
// import glob from 'glob';
// import shell from 'await-shell';

// const dirs = glob.sync('./node_modules/*/');

// (async () => {
//   await Promise.all(dirs.map(
//       (dir) => {
//         test(
//             `source/bundle exit codes should be identical for ${dir}`,
//             async (t) => {
//               let sourcePass; let buildPass;

//               try {
//                 await shell(`node ${dir}`);
//                 sourcePass = true;
//               } catch (e) {
//                 sourcePass = false;
//               }

//               /** TODO: Bundle pass here. */

//               t.pass();
//             },
//         );
//       },
//   ));
// })();
