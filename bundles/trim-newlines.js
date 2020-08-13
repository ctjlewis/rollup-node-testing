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

var trimNewlines = createCommonjsModule(function (module) {

var fn = module.exports = function (x) {
	return fn.end(fn.start(x));
};

fn.start = function (x) {
	return x.replace(/^[\r\n]+/, '');
};

fn.end = function (x) {
	return x.replace(/[\r\n]+$/, '');
};
});
