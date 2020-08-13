import os from 'os';

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var defaultGateway = createCommonjsModule(function (module) {


const platform = os.platform();

if ([
  "android",
  "darwin",
  "freebsd",
  "linux",
  "openbsd",
  "sunos",
  "win32",
  "aix",
].indexOf(platform) !== -1) {
  let file;
  if (platform === "aix") {
    // AIX `netstat` output is compatible with Solaris
    file = `${os.type() === "OS400" ? "ibmi" : "sunos"}.js`;
  } else {
    file = `${platform}.js`;
  }

  const m = commonjsRequire();
  module.exports.v4 = () => m.v4();
  module.exports.v6 = () => m.v6();
  module.exports.v4.sync = () => m.v4.sync();
  module.exports.v6.sync = () => m.v6.sync();
} else {
  const unsupported = () => { throw new Error(`Unsupported Platform: ${platform}`); };
  module.exports.v4 = unsupported;
  module.exports.v6 = unsupported;
  module.exports.v4.sync = unsupported;
  module.exports.v6.sync = unsupported;
}
});
