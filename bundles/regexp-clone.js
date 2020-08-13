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

var regexpClone = createCommonjsModule(function (module, exports) {
const toString = Object.prototype.toString;

function isRegExp (o) {
  return 'object' == typeof o
      && '[object RegExp]' == toString.call(o);
}

module.exports = exports = function (regexp) {
  if (!isRegExp(regexp)) {
    throw new TypeError('Not a RegExp');
  }

  const flags = [];
  if (regexp.global) flags.push('g');
  if (regexp.multiline) flags.push('m');
  if (regexp.ignoreCase) flags.push('i');
  if (regexp.dotAll) flags.push('s');
  if (regexp.unicode) flags.push('u');
  if (regexp.sticky) flags.push('y');
  const result = new RegExp(regexp.source, flags.join(''));
  if (typeof regexp.lastIndex === 'number') {
    result.lastIndex = regexp.lastIndex;
  }
  return result;
};
});
