import module from 'module';

const natives = [].concat(
  module.builtinModules,
  'bootstrap_node',
  'node',
).map(n => new RegExp(`(?:\\(${n}\\.js:\\d+:\\d+\\)$|^\\s*at ${n}\\.js:\\d+:\\d+$)`));

natives.push(
  /\(internal\/[^:]+:\d+:\d+\)$/,
  /\s*at internal\/[^:]+:\d+:\d+$/,
  /\/\.node-spawn-wrap-\w+-\w+\/node:\d+:\d+\)?$/
);
