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

var randombytes = crypto.randomBytes;

var browser = createCommonjsModule(function (module, exports) {

function oldBrowser () {
  throw new Error('secure random number generation not supported by this browser\nuse chrome, FireFox or Internet Explorer 11')
}


var Buffer = safeBuffer.Buffer;
var kBufferMaxLength = safeBuffer.kMaxLength;
var crypto = commonjsGlobal.crypto || commonjsGlobal.msCrypto;
var kMaxUint32 = Math.pow(2, 32) - 1;
function assertOffset (offset, length) {
  if (typeof offset !== 'number' || offset !== offset) { // eslint-disable-line no-self-compare
    throw new TypeError('offset must be a number')
  }

  if (offset > kMaxUint32 || offset < 0) {
    throw new TypeError('offset must be a uint32')
  }

  if (offset > kBufferMaxLength || offset > length) {
    throw new RangeError('offset out of range')
  }
}

function assertSize (size, offset, length) {
  if (typeof size !== 'number' || size !== size) { // eslint-disable-line no-self-compare
    throw new TypeError('size must be a number')
  }

  if (size > kMaxUint32 || size < 0) {
    throw new TypeError('size must be a uint32')
  }

  if (size + offset > length || size > kBufferMaxLength) {
    throw new RangeError('buffer too small')
  }
}
if ((crypto && crypto.getRandomValues) || !process.browser) {
  exports.randomFill = randomFill;
  exports.randomFillSync = randomFillSync;
} else {
  exports.randomFill = oldBrowser;
  exports.randomFillSync = oldBrowser;
}
function randomFill (buf, offset, size, cb) {
  if (!Buffer.isBuffer(buf) && !(buf instanceof commonjsGlobal.Uint8Array)) {
    throw new TypeError('"buf" argument must be a Buffer or Uint8Array')
  }

  if (typeof offset === 'function') {
    cb = offset;
    offset = 0;
    size = buf.length;
  } else if (typeof size === 'function') {
    cb = size;
    size = buf.length - offset;
  } else if (typeof cb !== 'function') {
    throw new TypeError('"cb" argument must be a function')
  }
  assertOffset(offset, buf.length);
  assertSize(size, offset, buf.length);
  return actualFill(buf, offset, size, cb)
}

function actualFill (buf, offset, size, cb) {
  if (process.browser) {
    var ourBuf = buf.buffer;
    var uint = new Uint8Array(ourBuf, offset, size);
    crypto.getRandomValues(uint);
    if (cb) {
      process.nextTick(function () {
        cb(null, buf);
      });
      return
    }
    return buf
  }
  if (cb) {
    randombytes(size, function (err, bytes) {
      if (err) {
        return cb(err)
      }
      bytes.copy(buf, offset);
      cb(null, buf);
    });
    return
  }
  var bytes = randombytes(size);
  bytes.copy(buf, offset);
  return buf
}
function randomFillSync (buf, offset, size) {
  if (typeof offset === 'undefined') {
    offset = 0;
  }
  if (!Buffer.isBuffer(buf) && !(buf instanceof commonjsGlobal.Uint8Array)) {
    throw new TypeError('"buf" argument must be a Buffer or Uint8Array')
  }

  assertOffset(offset, buf.length);

  if (size === undefined) size = buf.length - offset;

  assertSize(size, offset, buf.length);

  return actualFill(buf, offset, size)
}
});

var randomfill = createCommonjsModule(function (module, exports) {
if (typeof crypto.randomFill === 'function' && typeof crypto.randomFillSync === 'function') {
  exports.randomFill = crypto.randomFill;
  exports.randomFillSync = crypto.randomFillSync;
} else {
  module.exports = browser;
}
});
