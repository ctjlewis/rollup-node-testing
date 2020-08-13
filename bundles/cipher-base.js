import buffer from 'buffer';
import stream from 'stream';
import string_decoder from 'string_decoder';
import util from 'util';

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

var inherits_browser = createCommonjsModule(function (module) {
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function () {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    }
  };
}
});

var inherits = createCommonjsModule(function (module) {
try {
  var util$1 = util;
  /* istanbul ignore next */
  if (typeof util$1.inherits !== 'function') throw '';
  module.exports = util$1.inherits;
} catch (e) {
  /* istanbul ignore next */
  module.exports = inherits_browser;
}
});

var Buffer = safeBuffer.Buffer;
var Transform = stream.Transform;
var StringDecoder = string_decoder.StringDecoder;


function CipherBase (hashMode) {
  Transform.call(this);
  this.hashMode = typeof hashMode === 'string';
  if (this.hashMode) {
    this[hashMode] = this._finalOrDigest;
  } else {
    this.final = this._finalOrDigest;
  }
  if (this._final) {
    this.__final = this._final;
    this._final = null;
  }
  this._decoder = null;
  this._encoding = null;
}
inherits(CipherBase, Transform);

CipherBase.prototype.update = function (data, inputEnc, outputEnc) {
  if (typeof data === 'string') {
    data = Buffer.from(data, inputEnc);
  }

  var outData = this._update(data);
  if (this.hashMode) return this

  if (outputEnc) {
    outData = this._toString(outData, outputEnc);
  }

  return outData
};

CipherBase.prototype.setAutoPadding = function () {};
CipherBase.prototype.getAuthTag = function () {
  throw new Error('trying to get auth tag in unsupported state')
};

CipherBase.prototype.setAuthTag = function () {
  throw new Error('trying to set auth tag in unsupported state')
};

CipherBase.prototype.setAAD = function () {
  throw new Error('trying to set aad in unsupported state')
};

CipherBase.prototype._transform = function (data, _, next) {
  var err;
  try {
    if (this.hashMode) {
      this._update(data);
    } else {
      this.push(this._update(data));
    }
  } catch (e) {
    err = e;
  } finally {
    next(err);
  }
};
CipherBase.prototype._flush = function (done) {
  var err;
  try {
    this.push(this.__final());
  } catch (e) {
    err = e;
  }

  done(err);
};
CipherBase.prototype._finalOrDigest = function (outputEnc) {
  var outData = this.__final() || Buffer.alloc(0);
  if (outputEnc) {
    outData = this._toString(outData, outputEnc, true);
  }
  return outData
};

CipherBase.prototype._toString = function (value, enc, fin) {
  if (!this._decoder) {
    this._decoder = new StringDecoder(enc);
    this._encoding = enc;
  }

  if (this._encoding !== enc) throw new Error('can\'t switch encodings')

  var out = this._decoder.write(value);
  if (fin) {
    out += this._decoder.end();
  }

  return out
};
