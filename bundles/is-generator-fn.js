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

var isGeneratorFn = createCommonjsModule(function (module) {
const {toString} = Object.prototype;

module.exports = value => {
	if (typeof value !== 'function') {
		return false;
	}

	return (value.constructor && value.constructor.name === 'GeneratorFunction') ||
		toString.call(value) === '[object GeneratorFunction]';
};

// TODO: Remove this for the next major release
module.exports.default = module.exports;
});
