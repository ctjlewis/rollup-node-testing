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

var chunkd_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
function chunkd(array, index, total) {
    let length = array.length;
    let size = Math.floor(length / total);
    let remainder = length % total;
    let offset = Math.min(index, remainder) + index * size;
    let chunk = size + (index < remainder ? 1 : 0);
    return array.slice(offset, offset + chunk);
}
exports.default = chunkd;
module.exports = chunkd;

});
