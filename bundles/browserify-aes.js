import crypto from 'crypto';

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

var browserifyAes = createCommonjsModule(function (module, exports) {
exports.createCipher = exports.Cipher = crypto.createCipher;
exports.createCipheriv = exports.Cipheriv = crypto.createCipheriv;
exports.createDecipher = exports.Decipher = crypto.createDecipher;
exports.createDecipheriv = exports.Decipheriv = crypto.createDecipheriv;
exports.listCiphers = exports.getCiphers = crypto.getCiphers;
});
