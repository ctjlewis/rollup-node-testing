import 'path';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

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

var isWindows = createCommonjsModule(function (module, exports) {
/*!
 * is-windows <https://github.com/jonschlinkert/is-windows>
 *
 * Copyright © 2015-2018, Jon Schlinkert.
 * Released under the MIT License.
 */

(function(factory) {
  if (exports && 'object' === 'object' && 'object' !== 'undefined') {
    module.exports = factory();
  } else if (typeof window !== 'undefined') {
    window.isWindows = factory();
  } else if (typeof commonjsGlobal !== 'undefined') {
    commonjsGlobal.isWindows = factory();
  } else if (typeof self !== 'undefined') {
    self.isWindows = factory();
  } else {
    this.isWindows = factory();
  }
})(function() {
  return function isWindows() {
    return process && (process.platform === 'win32' || /^(msys|cygwin)$/.test(process.env.OSTYPE));
  };
});
});
