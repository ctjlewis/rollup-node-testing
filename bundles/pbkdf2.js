import crypto from 'crypto';
import buffer from 'buffer';

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

var MAX_ALLOC = Math.pow(2, 30) - 1; // default in iojs

var precondition = function (iterations, keylen) {
  if (typeof iterations !== 'number') {
    throw new TypeError('Iterations not a number')
  }

  if (iterations < 0) {
    throw new TypeError('Bad iterations')
  }

  if (typeof keylen !== 'number') {
    throw new TypeError('Key length not a number')
  }

  if (keylen < 0 || keylen > MAX_ALLOC || keylen !== keylen) { /* eslint no-self-compare: 0 */
    throw new TypeError('Bad key length')
  }
};

var defaultEncoding;
/* istanbul ignore next */
if (process.browser) {
  defaultEncoding = 'utf-8';
} else if (process.version) {
  var pVersionMajor = parseInt(process.version.split('.')[0].slice(1), 10);

  defaultEncoding = pVersionMajor >= 6 ? 'utf-8' : 'binary';
} else {
  defaultEncoding = 'utf-8';
}
var defaultEncoding_1 = defaultEncoding;

var safeBuffer = createCommonjsModule(function (module, exports) {
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */

var Buffer = buffer.Buffer;

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key];
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer;
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports);
  exports.Buffer = SafeBuffer;
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype);

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer);

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
};

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size);
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding);
    } else {
      buf.fill(fill);
    }
  } else {
    buf.fill(0);
  }
  return buf
};

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
};

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
};
});

var Buffer = safeBuffer.Buffer;

var toBuffer = function (thing, encoding, name) {
  if (Buffer.isBuffer(thing)) {
    return thing
  } else if (typeof thing === 'string') {
    return Buffer.from(thing, encoding)
  } else if (ArrayBuffer.isView(thing)) {
    return Buffer.from(thing.buffer)
  } else {
    throw new TypeError(name + ' must be a string, a Buffer, a typed array or a DataView')
  }
};

var createHmac = crypto.createHmac;

var sizes = {
  md5: 16,
  sha1: 20,
  sha224: 28,
  sha256: 32,
  sha384: 48,
  sha512: 64,
  rmd160: 20,
  ripemd160: 20
};


var Buffer$1 = safeBuffer.Buffer;





function pbkdf2 (password, salt, iterations, keylen, digest) {
  precondition(iterations, keylen);
  password = toBuffer(password, defaultEncoding_1, 'Password');
  salt = toBuffer(salt, defaultEncoding_1, 'Salt');

  digest = digest || 'sha1';

  var DK = Buffer$1.allocUnsafe(keylen);
  var block1 = Buffer$1.allocUnsafe(salt.length + 4);
  salt.copy(block1, 0, 0, salt.length);

  var destPos = 0;
  var hLen = sizes[digest];
  var l = Math.ceil(keylen / hLen);

  for (var i = 1; i <= l; i++) {
    block1.writeUInt32BE(i, salt.length);

    var T = createHmac(digest, password).update(block1).digest();
    var U = T;

    for (var j = 1; j < iterations; j++) {
      U = createHmac(digest, password).update(U).digest();
      for (var k = 0; k < hLen; k++) T[k] ^= U[k];
    }

    T.copy(DK, destPos);
    destPos += hLen;
  }

  return DK
}

var sync = pbkdf2;

var Buffer$2 = safeBuffer.Buffer;






var ZERO_BUF;
var subtle = commonjsGlobal.crypto && commonjsGlobal.crypto.subtle;
var toBrowser = {
  sha: 'SHA-1',
  'sha-1': 'SHA-1',
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  'sha-256': 'SHA-256',
  sha384: 'SHA-384',
  'sha-384': 'SHA-384',
  'sha-512': 'SHA-512',
  sha512: 'SHA-512'
};
var checks = [];
function checkNative (algo) {
  if (commonjsGlobal.process && !commonjsGlobal.process.browser) {
    return Promise.resolve(false)
  }
  if (!subtle || !subtle.importKey || !subtle.deriveBits) {
    return Promise.resolve(false)
  }
  if (checks[algo] !== undefined) {
    return checks[algo]
  }
  ZERO_BUF = ZERO_BUF || Buffer$2.alloc(8);
  var prom = browserPbkdf2(ZERO_BUF, ZERO_BUF, 10, 128, algo)
    .then(function () {
      return true
    }).catch(function () {
      return false
    });
  checks[algo] = prom;
  return prom
}

function browserPbkdf2 (password, salt, iterations, length, algo) {
  return subtle.importKey(
    'raw', password, { name: 'PBKDF2' }, false, ['deriveBits']
  ).then(function (key) {
    return subtle.deriveBits({
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: {
        name: algo
      }
    }, key, length << 3)
  }).then(function (res) {
    return Buffer$2.from(res)
  })
}

function resolvePromise (promise, callback) {
  promise.then(function (out) {
    process.nextTick(function () {
      callback(null, out);
    });
  }, function (e) {
    process.nextTick(function () {
      callback(e);
    });
  });
}
var async = function (password, salt, iterations, keylen, digest, callback) {
  if (typeof digest === 'function') {
    callback = digest;
    digest = undefined;
  }

  digest = digest || 'sha1';
  var algo = toBrowser[digest.toLowerCase()];

  if (!algo || typeof commonjsGlobal.Promise !== 'function') {
    return process.nextTick(function () {
      var out;
      try {
        out = sync(password, salt, iterations, keylen, digest);
      } catch (e) {
        return callback(e)
      }
      callback(null, out);
    })
  }

  precondition(iterations, keylen);
  password = toBuffer(password, defaultEncoding_1, 'Password');
  salt = toBuffer(salt, defaultEncoding_1, 'Salt');
  if (typeof callback !== 'function') throw new Error('No callback provided to pbkdf2')

  resolvePromise(checkNative(algo).then(function (resp) {
    if (resp) return browserPbkdf2(password, salt, iterations, keylen, algo)

    return sync(password, salt, iterations, keylen, digest)
  }), callback);
};

var pbkdf2$1 = createCommonjsModule(function (module, exports) {
function nativePBKDF2 (password, salt, iterations, keylen, digest, callback) {
  precondition(iterations, keylen);
  password = toBuffer(password, defaultEncoding_1, 'Password');
  salt = toBuffer(salt, defaultEncoding_1, 'Salt');

  if (typeof digest === 'function') {
    callback = digest;
    digest = 'sha1';
  }
  if (typeof callback !== 'function') throw new Error('No callback provided to pbkdf2')

  return crypto.pbkdf2(password, salt, iterations, keylen, digest, callback)
}

function nativePBKDF2Sync (password, salt, iterations, keylen, digest) {
  precondition(iterations, keylen);
  password = toBuffer(password, defaultEncoding_1, 'Password');
  salt = toBuffer(salt, defaultEncoding_1, 'Salt');
  digest = digest || 'sha1';
  return crypto.pbkdf2Sync(password, salt, iterations, keylen, digest)
}

/* istanbul ignore next */
if (!crypto.pbkdf2Sync || crypto.pbkdf2Sync.toString().indexOf('keylen, digest') === -1) {
  exports.pbkdf2Sync = sync;
  exports.pbkdf2 = async;

// native
} else {
  exports.pbkdf2Sync = nativePBKDF2Sync;
  exports.pbkdf2 = nativePBKDF2;
}
});
