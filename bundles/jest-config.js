import path$3 from 'path';
import fs$1 from 'fs';
import constants$4 from 'constants';
import stream$1 from 'stream';
import util$2 from 'util';
import assert$1 from 'assert';
import process$2 from 'process';
import os$1 from 'os';
import tty$1 from 'tty';
import module$1 from 'module';
import pnpapi from 'pnpapi';
import default_resolver from 'jest-resolve/build/default_resolver';
import vm$1 from 'vm';
import url$1 from 'url';
import crypto$1 from 'crypto';
import events$1 from 'events';
import file from 'file';

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

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var origCwd = process.cwd;
var cwd = null;

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd
};
try {
  process.cwd();
} catch (er) {}

var chdir = process.chdir;
process.chdir = function(d) {
  cwd = null;
  chdir.call(process, d);
};

var polyfills = patch;

function patch (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants$4.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs);
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);

  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);

  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);

  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);

  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);

  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync);

  // if lchmod/lchown do not exist, then make them no-ops
  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchmodSync = function () {};
  }
  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchownSync = function () {};
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = (function (fs$rename) { return function (from, to, cb) {
      var start = Date.now();
      var backoff = 0;
      fs$rename(from, to, function CB (er) {
        if (er
            && (er.code === "EACCES" || er.code === "EPERM")
            && Date.now() - start < 60000) {
          setTimeout(function() {
            fs.stat(to, function (stater, st) {
              if (stater && stater.code === "ENOENT")
                fs$rename(from, to, CB);
              else
                cb(er);
            });
          }, backoff);
          if (backoff < 100)
            backoff += 10;
          return;
        }
        if (cb) cb(er);
      });
    }})(fs.rename);
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = (function (fs$read) {
    function read (fd, buffer, offset, length, position, callback_) {
      var callback;
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0;
        callback = function (er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter ++;
            return fs$read.call(fs, fd, buffer, offset, length, position, callback)
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, callback)
    }

    // This ensures `util.promisify` works as it does for native `fs.read`.
    read.__proto__ = fs$read;
    return read
  })(fs.read);

  fs.readSync = (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0;
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++;
          continue
        }
        throw er
      }
    }
  }})(fs.readSync);

  function patchLchmod (fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open( path
             , constants$4.O_WRONLY | constants$4.O_SYMLINK
             , mode
             , function (err, fd) {
        if (err) {
          if (callback) callback(err);
          return
        }
        // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.
        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function(err2) {
            if (callback) callback(err || err2);
          });
        });
      });
    };

    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants$4.O_WRONLY | constants$4.O_SYMLINK, mode);

      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      var threw = true;
      var ret;
      try {
        ret = fs.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }
      return ret
    };
  }

  function patchLutimes (fs) {
    if (constants$4.hasOwnProperty("O_SYMLINK")) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants$4.O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er);
            return
          }
          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2);
            });
          });
        });
      };

      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants$4.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd);
            } catch (er) {}
          } else {
            fs.closeSync(fd);
          }
        }
        return ret
      };

    } else {
      fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb); };
      fs.lutimesSync = function () {};
    }
  }

  function chmodFix (orig) {
    if (!orig) return orig
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chmodFixSync (orig) {
    if (!orig) return orig
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }


  function chownFix (orig) {
    if (!orig) return orig
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chownFixSync (orig) {
    if (!orig) return orig
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }

  function statFix (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = null;
      }
      function callback (er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 0x100000000;
          if (stats.gid < 0) stats.gid += 0x100000000;
        }
        if (cb) cb.apply(this, arguments);
      }
      return options ? orig.call(fs, target, options, callback)
        : orig.call(fs, target, callback)
    }
  }

  function statFixSync (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options) {
      var stats = options ? orig.call(fs, target, options)
        : orig.call(fs, target);
      if (stats.uid < 0) stats.uid += 0x100000000;
      if (stats.gid < 0) stats.gid += 0x100000000;
      return stats;
    }
  }

  // ENOSYS means that the fs doesn't support the op. Just ignore
  // that, because it doesn't matter.
  //
  // if there's no getuid, or if getuid() is something other
  // than 0, and the error is EINVAL or EPERM, then just ignore
  // it.
  //
  // This specific case is a silent failure in cp, install, tar,
  // and most other unix tools that manage permissions.
  //
  // When running as root, or if other types of errors are
  // encountered, then it's strict.
  function chownErOk (er) {
    if (!er)
      return true

    if (er.code === "ENOSYS")
      return true

    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true
    }

    return false
  }
}

var Stream = stream$1.Stream;

var legacyStreams = legacy;

function legacy (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    });
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

var clone_1 = clone;

function clone (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: obj.__proto__ };
  else
    var copy = Object.create(null);

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });

  return copy
}

var gracefulFs = createCommonjsModule(function (module) {
/* istanbul ignore next - node 0.x polyfill */
var gracefulQueue;
var previousSymbol;

/* istanbul ignore else - node 0.x polyfill */
if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  gracefulQueue = Symbol.for('graceful-fs.queue');
  // This is used in testing by future versions
  previousSymbol = Symbol.for('graceful-fs.previous');
} else {
  gracefulQueue = '___graceful-fs.queue';
  previousSymbol = '___graceful-fs.previous';
}

function noop () {}

function publishQueue(context, queue) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue
    }
  });
}

var debug = noop;
if (util$2.debuglog)
  debug = util$2.debuglog('gfs4');
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util$2.format.apply(util$2, arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
  };

// Once time initialization
if (!fs$1[gracefulQueue]) {
  // This queue can be shared by multiple loaded instances
  var queue = commonjsGlobal[gracefulQueue] || [];
  publishQueue(fs$1, queue);

  // Patch fs.close/closeSync to shared queue version, because we need
  // to retry() whenever a close happens *anywhere* in the program.
  // This is essential when multiple graceful-fs instances are
  // in play at the same time.
  fs$1.close = (function (fs$close) {
    function close (fd, cb) {
      return fs$close.call(fs$1, fd, function (err) {
        // This function uses the graceful-fs shared queue
        if (!err) {
          retry();
        }

        if (typeof cb === 'function')
          cb.apply(this, arguments);
      })
    }

    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    });
    return close
  })(fs$1.close);

  fs$1.closeSync = (function (fs$closeSync) {
    function closeSync (fd) {
      // This function uses the graceful-fs shared queue
      fs$closeSync.apply(fs$1, arguments);
      retry();
    }

    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    });
    return closeSync
  })(fs$1.closeSync);

  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', function() {
      debug(fs$1[gracefulQueue]);
      assert$1.equal(fs$1[gracefulQueue].length, 0);
    });
  }
}

if (!commonjsGlobal[gracefulQueue]) {
  publishQueue(commonjsGlobal, fs$1[gracefulQueue]);
}

module.exports = patch(clone_1(fs$1));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs$1.__patched) {
    module.exports = patch(fs$1);
    fs$1.__patched = true;
}

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs);
  fs.gracefulify = patch;

  fs.createReadStream = createReadStream;
  fs.createWriteStream = createWriteStream;
  var fs$readFile = fs.readFile;
  fs.readFile = readFile;
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile;
  fs.writeFile = writeFile;
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile;
  if (fs$appendFile)
    fs.appendFile = appendFile;
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  var fs$readdir = fs.readdir;
  fs.readdir = readdir;
  function readdir (path, options, cb) {
    var args = [path];
    if (typeof options !== 'function') {
      args.push(options);
    } else {
      cb = options;
    }
    args.push(go$readdir$cb);

    return go$readdir(args)

    function go$readdir$cb (err, files) {
      if (files && files.sort)
        files.sort();

      if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
        enqueue([go$readdir, [args]]);

      else {
        if (typeof cb === 'function')
          cb.apply(this, arguments);
        retry();
      }
    }
  }

  function go$readdir (args) {
    return fs$readdir.apply(fs, args)
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacyStreams(fs);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }

  var fs$ReadStream = fs.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = ReadStream$open;
  }

  var fs$WriteStream = fs.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = WriteStream$open;
  }

  Object.defineProperty(fs, 'ReadStream', {
    get: function () {
      return ReadStream
    },
    set: function (val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs, 'WriteStream', {
    get: function () {
      return WriteStream
    },
    set: function (val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  // legacy names
  var FileReadStream = ReadStream;
  Object.defineProperty(fs, 'FileReadStream', {
    get: function () {
      return FileReadStream
    },
    set: function (val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileWriteStream = WriteStream;
  Object.defineProperty(fs, 'FileWriteStream', {
    get: function () {
      return FileWriteStream
    },
    set: function (val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();

        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
        that.read();
      }
    });
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy();
        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
      }
    });
  }

  function createReadStream (path, options) {
    return new fs.ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new fs.WriteStream(path, options)
  }

  var fs$open = fs.open;
  fs.open = open;
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null;

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1]);
  fs$1[gracefulQueue].push(elem);
}

function retry () {
  var elem = fs$1[gracefulQueue].shift();
  if (elem) {
    debug('RETRY', elem[0].name, elem[1]);
    elem[0].apply(null, elem[1]);
  }
}
});

var clearLine_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = clearLine;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function clearLine(stream) {
  if (stream.isTTY) {
    stream.write('\x1b[999D\x1b[K');
  }
}
});

var createDirectory_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = createDirectory;

function fs() {
  const data = _interopRequireWildcard(gracefulFs);

  fs = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function createDirectory(path) {
  try {
    fs().mkdirSync(path, {
      recursive: true
    });
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}
});

var ErrorWithStack_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
class ErrorWithStack extends Error {
  constructor(message, callsite) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, callsite);
    }
  }
}

exports.default = ErrorWithStack;
});

var deepCyclicCopy_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = deepCyclicCopy;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const EMPTY = new Set();

function deepCyclicCopy(
  value,
  options = {
    blacklist: EMPTY,
    keepPrototype: false
  },
  cycles = new WeakMap()
) {
  if (typeof value !== 'object' || value === null) {
    return value;
  } else if (cycles.has(value)) {
    return cycles.get(value);
  } else if (Array.isArray(value)) {
    return deepCyclicCopyArray(value, options, cycles);
  } else {
    return deepCyclicCopyObject(value, options, cycles);
  }
}

function deepCyclicCopyObject(object, options, cycles) {
  const newObject = options.keepPrototype
    ? Object.create(Object.getPrototypeOf(object))
    : {};
  const descriptors = Object.getOwnPropertyDescriptors(object);
  cycles.set(object, newObject);
  Object.keys(descriptors).forEach(key => {
    if (options.blacklist && options.blacklist.has(key)) {
      delete descriptors[key];
      return;
    }

    const descriptor = descriptors[key];

    if (typeof descriptor.value !== 'undefined') {
      descriptor.value = deepCyclicCopy(
        descriptor.value,
        {
          blacklist: EMPTY,
          keepPrototype: options.keepPrototype
        },
        cycles
      );
    }

    descriptor.configurable = true;
  });
  return Object.defineProperties(newObject, descriptors);
}

function deepCyclicCopyArray(array, options, cycles) {
  const newArray = options.keepPrototype
    ? new (Object.getPrototypeOf(array).constructor)(array.length)
    : [];
  const length = array.length;
  cycles.set(array, newArray);

  for (let i = 0; i < length; i++) {
    newArray[i] = deepCyclicCopy(
      array[i],
      {
        blacklist: EMPTY,
        keepPrototype: options.keepPrototype
      },
      cycles
    );
  }

  return newArray;
}
});

var createProcessObject = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = _default;

var _deepCyclicCopy = _interopRequireDefault(deepCyclicCopy_1);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const BLACKLIST = new Set(['env', 'mainModule', '_events']);
const isWin32 = process.platform === 'win32';
const proto = Object.getPrototypeOf(process.env); // The "process.env" object has a bunch of particularities: first, it does not
// directly extend from Object; second, it converts any assigned value to a
// string; and third, it is case-insensitive in Windows. We use a proxy here to
// mimic it (see https://nodejs.org/api/process.html#process_process_env).

function createProcessEnv() {
  const real = Object.create(proto);
  const lookup = {};

  function deletePropertyWin32(_target, key) {
    for (const name in real) {
      if (real.hasOwnProperty(name)) {
        if (typeof key === 'string') {
          if (name.toLowerCase() === key.toLowerCase()) {
            delete real[name];
            delete lookup[name.toLowerCase()];
          }
        } else {
          if (key === name) {
            delete real[name];
            delete lookup[name];
          }
        }
      }
    }

    return true;
  }

  function deleteProperty(_target, key) {
    delete real[key];
    delete lookup[key];
    return true;
  }

  function getProperty(_target, key) {
    return real[key];
  }

  function getPropertyWin32(_target, key) {
    if (typeof key === 'string') {
      return lookup[key in proto ? key : key.toLowerCase()];
    } else {
      return real[key];
    }
  }

  const proxy = new Proxy(real, {
    deleteProperty: isWin32 ? deletePropertyWin32 : deleteProperty,
    get: isWin32 ? getPropertyWin32 : getProperty,

    set(_target, key, value) {
      const strValue = '' + value;

      if (typeof key === 'string') {
        lookup[key.toLowerCase()] = strValue;
      }

      real[key] = strValue;
      return true;
    }
  });
  return Object.assign(proxy, process.env);
}

function _default() {
  const process = process$2;

  const newProcess = (0, _deepCyclicCopy.default)(process, {
    blacklist: BLACKLIST,
    keepPrototype: true
  });

  try {
    // This fails on Node 12, but it's already set to 'process'
    newProcess[Symbol.toStringTag] = 'process';
  } catch (e) {
    // Make sure it's actually set instead of potentially ignoring errors
    if (newProcess[Symbol.toStringTag] !== 'process') {
      e.message =
        'Unable to set toStringTag on process. Please open up an issue at https://github.com/facebook/jest\n\n' +
        e.message;
      throw e;
    }
  } // Sequentially execute all constructors over the object.

  let proto = process;

  while ((proto = Object.getPrototypeOf(proto))) {
    if (typeof proto.constructor === 'function') {
      proto.constructor.call(newProcess);
    }
  }

  newProcess.env = createProcessEnv();

  newProcess.send = () => {};

  const domainPropertyDescriptor = Object.getOwnPropertyDescriptor(
    newProcess,
    'domain'
  );

  if (domainPropertyDescriptor && !domainPropertyDescriptor.enumerable) {
    Object.defineProperty(newProcess, 'domain', {
      get() {
        return process.domain;
      }
    });
  }

  return newProcess;
}
});

var installCommonGlobals = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = _default;

function fs() {
  const data = _interopRequireWildcard(gracefulFs);

  fs = function () {
    return data;
  };

  return data;
}

var _createProcessObject = _interopRequireDefault(
  createProcessObject
);

var _deepCyclicCopy = _interopRequireDefault(deepCyclicCopy_1);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const DTRACE = Object.keys(commonjsGlobal).filter(key => key.startsWith('DTRACE'));

function _default(globalObject, globals) {
  globalObject.process = (0, _createProcessObject.default)();
  const symbol = globalObject.Symbol; // Keep a reference to some globals that Jest needs

  Object.defineProperties(globalObject, {
    [symbol.for('jest-native-promise')]: {
      enumerable: false,
      value: Promise,
      writable: false
    },
    [symbol.for('jest-native-now')]: {
      enumerable: false,
      value: globalObject.Date.now.bind(globalObject.Date),
      writable: false
    },
    [symbol.for('jest-native-read-file')]: {
      enumerable: false,
      value: fs().readFileSync.bind(fs()),
      writable: false
    },
    [symbol.for('jest-native-write-file')]: {
      enumerable: false,
      value: fs().writeFileSync.bind(fs()),
      writable: false
    },
    [symbol.for('jest-native-exists-file')]: {
      enumerable: false,
      value: fs().existsSync.bind(fs()),
      writable: false
    },
    'jest-symbol-do-not-touch': {
      enumerable: false,
      value: symbol,
      writable: false
    }
  }); // Forward some APIs.

  DTRACE.forEach(dtrace => {
    // @ts-expect-error: no index
    globalObject[dtrace] = function (...args) {
      // @ts-expect-error: no index
      return commonjsGlobal[dtrace].apply(this, args);
    };
  }); // Forward some others (this breaks the sandbox but for now it's OK).

  globalObject.Buffer = commonjsGlobal.Buffer;
  globalObject.setImmediate = commonjsGlobal.setImmediate;
  globalObject.clearImmediate = commonjsGlobal.clearImmediate;
  return Object.assign(globalObject, (0, _deepCyclicCopy.default)(globals));
}
});

var interopRequireDefault_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = interopRequireDefault;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// copied from https://github.com/babel/babel/blob/56044c7851d583d498f919e9546caddf8f80a72f/packages/babel-helpers/src/helpers.js#L558-L562
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function interopRequireDefault(obj) {
  return obj && obj.__esModule
    ? obj
    : {
        default: obj
      };
}
});

var vendors = [
	{
		name: "AppVeyor",
		constant: "APPVEYOR",
		env: "APPVEYOR",
		pr: "APPVEYOR_PULL_REQUEST_NUMBER"
	},
	{
		name: "Azure Pipelines",
		constant: "AZURE_PIPELINES",
		env: "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI",
		pr: "SYSTEM_PULLREQUEST_PULLREQUESTID"
	},
	{
		name: "Bamboo",
		constant: "BAMBOO",
		env: "bamboo_planKey"
	},
	{
		name: "Bitbucket Pipelines",
		constant: "BITBUCKET",
		env: "BITBUCKET_COMMIT",
		pr: "BITBUCKET_PR_ID"
	},
	{
		name: "Bitrise",
		constant: "BITRISE",
		env: "BITRISE_IO",
		pr: "BITRISE_PULL_REQUEST"
	},
	{
		name: "Buddy",
		constant: "BUDDY",
		env: "BUDDY_WORKSPACE_ID",
		pr: "BUDDY_EXECUTION_PULL_REQUEST_ID"
	},
	{
		name: "Buildkite",
		constant: "BUILDKITE",
		env: "BUILDKITE",
		pr: {
			env: "BUILDKITE_PULL_REQUEST",
			ne: "false"
		}
	},
	{
		name: "CircleCI",
		constant: "CIRCLE",
		env: "CIRCLECI",
		pr: "CIRCLE_PULL_REQUEST"
	},
	{
		name: "Cirrus CI",
		constant: "CIRRUS",
		env: "CIRRUS_CI",
		pr: "CIRRUS_PR"
	},
	{
		name: "AWS CodeBuild",
		constant: "CODEBUILD",
		env: "CODEBUILD_BUILD_ARN"
	},
	{
		name: "Codeship",
		constant: "CODESHIP",
		env: {
			CI_NAME: "codeship"
		}
	},
	{
		name: "Drone",
		constant: "DRONE",
		env: "DRONE",
		pr: {
			DRONE_BUILD_EVENT: "pull_request"
		}
	},
	{
		name: "dsari",
		constant: "DSARI",
		env: "DSARI"
	},
	{
		name: "GitLab CI",
		constant: "GITLAB",
		env: "GITLAB_CI"
	},
	{
		name: "GoCD",
		constant: "GOCD",
		env: "GO_PIPELINE_LABEL"
	},
	{
		name: "Hudson",
		constant: "HUDSON",
		env: "HUDSON_URL"
	},
	{
		name: "Jenkins",
		constant: "JENKINS",
		env: [
			"JENKINS_URL",
			"BUILD_ID"
		],
		pr: {
			any: [
				"ghprbPullId",
				"CHANGE_ID"
			]
		}
	},
	{
		name: "Magnum CI",
		constant: "MAGNUM",
		env: "MAGNUM"
	},
	{
		name: "Netlify CI",
		constant: "NETLIFY",
		env: "NETLIFY_BUILD_BASE",
		pr: {
			env: "PULL_REQUEST",
			ne: "false"
		}
	},
	{
		name: "Sail CI",
		constant: "SAIL",
		env: "SAILCI",
		pr: "SAIL_PULL_REQUEST_NUMBER"
	},
	{
		name: "Semaphore",
		constant: "SEMAPHORE",
		env: "SEMAPHORE",
		pr: "PULL_REQUEST_NUMBER"
	},
	{
		name: "Shippable",
		constant: "SHIPPABLE",
		env: "SHIPPABLE",
		pr: {
			IS_PULL_REQUEST: "true"
		}
	},
	{
		name: "Solano CI",
		constant: "SOLANO",
		env: "TDDIUM",
		pr: "TDDIUM_PR_ID"
	},
	{
		name: "Strider CD",
		constant: "STRIDER",
		env: "STRIDER"
	},
	{
		name: "TaskCluster",
		constant: "TASKCLUSTER",
		env: [
			"TASK_ID",
			"RUN_ID"
		]
	},
	{
		name: "TeamCity",
		constant: "TEAMCITY",
		env: "TEAMCITY_VERSION"
	},
	{
		name: "Travis CI",
		constant: "TRAVIS",
		env: "TRAVIS",
		pr: {
			env: "TRAVIS_PULL_REQUEST",
			ne: "false"
		}
	}
];

var vendors$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': vendors
});

var vendors$2 = getCjsExportFromNamespace(vendors$1);

var ciInfo = createCommonjsModule(function (module, exports) {



var env = process.env;

// Used for testing only
Object.defineProperty(exports, '_vendors', {
  value: vendors$2.map(function (v) { return v.constant })
});

exports.name = null;
exports.isPR = null;

vendors$2.forEach(function (vendor) {
  var envs = Array.isArray(vendor.env) ? vendor.env : [vendor.env];
  var isCI = envs.every(function (obj) {
    return checkEnv(obj)
  });

  exports[vendor.constant] = isCI;

  if (isCI) {
    exports.name = vendor.name;

    switch (typeof vendor.pr) {
      case 'string':
        // "pr": "CIRRUS_PR"
        exports.isPR = !!env[vendor.pr];
        break
      case 'object':
        if ('env' in vendor.pr) {
          // "pr": { "env": "BUILDKITE_PULL_REQUEST", "ne": "false" }
          exports.isPR = vendor.pr.env in env && env[vendor.pr.env] !== vendor.pr.ne;
        } else if ('any' in vendor.pr) {
          // "pr": { "any": ["ghprbPullId", "CHANGE_ID"] }
          exports.isPR = vendor.pr.any.some(function (key) {
            return !!env[key]
          });
        } else {
          // "pr": { "DRONE_BUILD_EVENT": "pull_request" }
          exports.isPR = checkEnv(vendor.pr);
        }
        break
      default:
        // PR detection not supported for this vendor
        exports.isPR = null;
    }
  }
});

exports.isCI = !!(
  env.CI || // Travis CI, CircleCI, Cirrus CI, Gitlab CI, Appveyor, CodeShip, dsari
  env.CONTINUOUS_INTEGRATION || // Travis CI, Cirrus CI
  env.BUILD_NUMBER || // Jenkins, TeamCity
  env.RUN_ID || // TaskCluster, dsari
  exports.name ||
  false
);

function checkEnv (obj) {
  if (typeof obj === 'string') return !!env[obj]
  return Object.keys(obj).every(function (k) {
    return env[k] === obj[k]
  })
}
});

var isCi = ciInfo.isCI;

var isInteractive = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function _isCi() {
  const data = _interopRequireDefault(isCi);

  _isCi = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var _default =
  !!process.stdout.isTTY && process.env.TERM !== 'dumb' && !_isCi().default;

exports.default = _default;
});

var isPromise_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// capture global.Promise before it may potentially be overwritten
const Promise = commonjsGlobal.Promise; // see ES2015 spec 25.4.4.5, https://stackoverflow.com/a/38339199

const isPromise = candidate => Promise.resolve(candidate) === candidate;

var _default = isPromise;
exports.default = _default;
});

var setGlobal = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var _default = (globalToMutate, key, value) => {
  // @ts-expect-error: no index
  globalToMutate[key] = value;
};

exports.default = _default;
});

var convertDescriptorToString_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = convertDescriptorToString;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// See: https://github.com/facebook/jest/pull/5154
function convertDescriptorToString(descriptor) {
  if (
    typeof descriptor === 'string' ||
    typeof descriptor === 'number' ||
    descriptor === undefined
  ) {
    return descriptor;
  }

  if (typeof descriptor !== 'function') {
    throw new Error('describe expects a class, function, number, or string.');
  }

  if (descriptor.name !== undefined) {
    return descriptor.name;
  } // Fallback for old browsers, pardon Flow

  const stringified = descriptor.toString();
  const typeDescriptorMatch = stringified.match(/class|function/);
  const indexOfNameSpace = // @ts-expect-error: typeDescriptorMatch exists
    typeDescriptorMatch.index + typeDescriptorMatch[0].length;
  const indexOfNameAfterSpace = stringified.search(/\(|\{/);
  const name = stringified.substring(indexOfNameSpace, indexOfNameAfterSpace);
  return name.trim();
}
});

var specialChars = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.CLEAR = exports.ICONS = exports.ARROW = void 0;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const isWindows = process.platform === 'win32';
const ARROW = ' \u203A ';
exports.ARROW = ARROW;
const ICONS = {
  failed: isWindows ? '\u00D7' : '\u2715',
  pending: '\u25CB',
  success: isWindows ? '\u221A' : '\u2713',
  todo: '\u270E'
};
exports.ICONS = ICONS;
const CLEAR = isWindows ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H';
exports.CLEAR = CLEAR;
});

var replacePathSepForGlob_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = replacePathSepForGlob;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function replacePathSepForGlob(path) {
  return path.replace(/\\(?![{}()+?.^$])/g, '/');
}
});

var testPathPatternToRegExp = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Because we serialize/deserialize globalConfig when we spawn workers,
// we can't pass regular expression. Using this shared function on both sides
// will ensure that we produce consistent regexp for testPathPattern.
var _default = testPathPattern => new RegExp(testPathPattern, 'i');

exports.default = _default;
});

var utils = createCommonjsModule(function (module, exports) {

exports.isInteger = num => {
  if (typeof num === 'number') {
    return Number.isInteger(num);
  }
  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isInteger(Number(num));
  }
  return false;
};

/**
 * Find a node of the given type
 */

exports.find = (node, type) => node.nodes.find(node => node.type === type);

/**
 * Find a node of the given type
 */

exports.exceedsLimit = (min, max, step = 1, limit) => {
  if (limit === false) return false;
  if (!exports.isInteger(min) || !exports.isInteger(max)) return false;
  return ((Number(max) - Number(min)) / Number(step)) >= limit;
};

/**
 * Escape the given node with '\\' before node.value
 */

exports.escapeNode = (block, n = 0, type) => {
  let node = block.nodes[n];
  if (!node) return;

  if ((type && node.type === type) || node.type === 'open' || node.type === 'close') {
    if (node.escaped !== true) {
      node.value = '\\' + node.value;
      node.escaped = true;
    }
  }
};

/**
 * Returns true if the given brace node should be enclosed in literal braces
 */

exports.encloseBrace = node => {
  if (node.type !== 'brace') return false;
  if ((node.commas >> 0 + node.ranges >> 0) === 0) {
    node.invalid = true;
    return true;
  }
  return false;
};

/**
 * Returns true if a brace node is invalid.
 */

exports.isInvalidBrace = block => {
  if (block.type !== 'brace') return false;
  if (block.invalid === true || block.dollar) return true;
  if ((block.commas >> 0 + block.ranges >> 0) === 0) {
    block.invalid = true;
    return true;
  }
  if (block.open !== true || block.close !== true) {
    block.invalid = true;
    return true;
  }
  return false;
};

/**
 * Returns true if a node is an open or close node
 */

exports.isOpenOrClose = node => {
  if (node.type === 'open' || node.type === 'close') {
    return true;
  }
  return node.open === true || node.close === true;
};

/**
 * Reduce an array of text nodes.
 */

exports.reduce = nodes => nodes.reduce((acc, node) => {
  if (node.type === 'text') acc.push(node.value);
  if (node.type === 'range') node.type = 'text';
  return acc;
}, []);

/**
 * Flatten an array
 */

exports.flatten = (...args) => {
  const result = [];
  const flat = arr => {
    for (let i = 0; i < arr.length; i++) {
      let ele = arr[i];
      Array.isArray(ele) ? flat(ele) : ele !== void 0 && result.push(ele);
    }
    return result;
  };
  flat(args);
  return result;
};
});

var stringify = (ast, options = {}) => {
  let stringify = (node, parent = {}) => {
    let invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
    let invalidNode = node.invalid === true && options.escapeInvalid === true;
    let output = '';

    if (node.value) {
      if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
        return '\\' + node.value;
      }
      return node.value;
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes) {
      for (let child of node.nodes) {
        output += stringify(child);
      }
    }
    return output;
  };

  return stringify(ast);
};

/*!
 * is-number <https://github.com/jonschlinkert/is-number>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Released under the MIT License.
 */

var isNumber = function(num) {
  if (typeof num === 'number') {
    return num - num === 0;
  }
  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
};

const toRegexRange = (min, max, options) => {
  if (isNumber(min) === false) {
    throw new TypeError('toRegexRange: expected the first argument to be a number');
  }

  if (max === void 0 || min === max) {
    return String(min);
  }

  if (isNumber(max) === false) {
    throw new TypeError('toRegexRange: expected the second argument to be a number.');
  }

  let opts = { relaxZeros: true, ...options };
  if (typeof opts.strictZeros === 'boolean') {
    opts.relaxZeros = opts.strictZeros === false;
  }

  let relax = String(opts.relaxZeros);
  let shorthand = String(opts.shorthand);
  let capture = String(opts.capture);
  let wrap = String(opts.wrap);
  let cacheKey = min + ':' + max + '=' + relax + shorthand + capture + wrap;

  if (toRegexRange.cache.hasOwnProperty(cacheKey)) {
    return toRegexRange.cache[cacheKey].result;
  }

  let a = Math.min(min, max);
  let b = Math.max(min, max);

  if (Math.abs(a - b) === 1) {
    let result = min + '|' + max;
    if (opts.capture) {
      return `(${result})`;
    }
    if (opts.wrap === false) {
      return result;
    }
    return `(?:${result})`;
  }

  let isPadded = hasPadding(min) || hasPadding(max);
  let state = { min, max, a, b };
  let positives = [];
  let negatives = [];

  if (isPadded) {
    state.isPadded = isPadded;
    state.maxLen = String(state.max).length;
  }

  if (a < 0) {
    let newMin = b < 0 ? Math.abs(b) : 1;
    negatives = splitToPatterns(newMin, Math.abs(a), state, opts);
    a = state.a = 0;
  }

  if (b >= 0) {
    positives = splitToPatterns(a, b, state, opts);
  }

  state.negatives = negatives;
  state.positives = positives;
  state.result = collatePatterns(negatives, positives);

  if (opts.capture === true) {
    state.result = `(${state.result})`;
  } else if (opts.wrap !== false && (positives.length + negatives.length) > 1) {
    state.result = `(?:${state.result})`;
  }

  toRegexRange.cache[cacheKey] = state;
  return state.result;
};

function collatePatterns(neg, pos, options) {
  let onlyNegative = filterPatterns(neg, pos, '-', false) || [];
  let onlyPositive = filterPatterns(pos, neg, '', false) || [];
  let intersected = filterPatterns(neg, pos, '-?', true) || [];
  let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
  return subpatterns.join('|');
}

function splitToRanges(min, max) {
  let nines = 1;
  let zeros = 1;

  let stop = countNines(min, nines);
  let stops = new Set([max]);

  while (min <= stop && stop <= max) {
    stops.add(stop);
    nines += 1;
    stop = countNines(min, nines);
  }

  stop = countZeros(max + 1, zeros) - 1;

  while (min < stop && stop <= max) {
    stops.add(stop);
    zeros += 1;
    stop = countZeros(max + 1, zeros) - 1;
  }

  stops = [...stops];
  stops.sort(compare);
  return stops;
}

/**
 * Convert a range to a regex pattern
 * @param {Number} `start`
 * @param {Number} `stop`
 * @return {String}
 */

function rangeToPattern(start, stop, options) {
  if (start === stop) {
    return { pattern: start, count: [], digits: 0 };
  }

  let zipped = zip(start, stop);
  let digits = zipped.length;
  let pattern = '';
  let count = 0;

  for (let i = 0; i < digits; i++) {
    let [startDigit, stopDigit] = zipped[i];

    if (startDigit === stopDigit) {
      pattern += startDigit;

    } else if (startDigit !== '0' || stopDigit !== '9') {
      pattern += toCharacterClass(startDigit, stopDigit);

    } else {
      count++;
    }
  }

  if (count) {
    pattern += options.shorthand === true ? '\\d' : '[0-9]';
  }

  return { pattern, count: [count], digits };
}

function splitToPatterns(min, max, tok, options) {
  let ranges = splitToRanges(min, max);
  let tokens = [];
  let start = min;
  let prev;

  for (let i = 0; i < ranges.length; i++) {
    let max = ranges[i];
    let obj = rangeToPattern(String(start), String(max), options);
    let zeros = '';

    if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
      if (prev.count.length > 1) {
        prev.count.pop();
      }

      prev.count.push(obj.count[0]);
      prev.string = prev.pattern + toQuantifier(prev.count);
      start = max + 1;
      continue;
    }

    if (tok.isPadded) {
      zeros = padZeros(max, tok, options);
    }

    obj.string = zeros + obj.pattern + toQuantifier(obj.count);
    tokens.push(obj);
    start = max + 1;
    prev = obj;
  }

  return tokens;
}

function filterPatterns(arr, comparison, prefix, intersection, options) {
  let result = [];

  for (let ele of arr) {
    let { string } = ele;

    // only push if _both_ are negative...
    if (!intersection && !contains(comparison, 'string', string)) {
      result.push(prefix + string);
    }

    // or _both_ are positive
    if (intersection && contains(comparison, 'string', string)) {
      result.push(prefix + string);
    }
  }
  return result;
}

/**
 * Zip strings
 */

function zip(a, b) {
  let arr = [];
  for (let i = 0; i < a.length; i++) arr.push([a[i], b[i]]);
  return arr;
}

function compare(a, b) {
  return a > b ? 1 : b > a ? -1 : 0;
}

function contains(arr, key, val) {
  return arr.some(ele => ele[key] === val);
}

function countNines(min, len) {
  return Number(String(min).slice(0, -len) + '9'.repeat(len));
}

function countZeros(integer, zeros) {
  return integer - (integer % Math.pow(10, zeros));
}

function toQuantifier(digits) {
  let [start = 0, stop = ''] = digits;
  if (stop || start > 1) {
    return `{${start + (stop ? ',' + stop : '')}}`;
  }
  return '';
}

function toCharacterClass(a, b, options) {
  return `[${a}${(b - a === 1) ? '' : '-'}${b}]`;
}

function hasPadding(str) {
  return /^-?(0+)\d/.test(str);
}

function padZeros(value, tok, options) {
  if (!tok.isPadded) {
    return value;
  }

  let diff = Math.abs(tok.maxLen - String(value).length);
  let relax = options.relaxZeros !== false;

  switch (diff) {
    case 0:
      return '';
    case 1:
      return relax ? '0?' : '0';
    case 2:
      return relax ? '0{0,2}' : '00';
    default: {
      return relax ? `0{0,${diff}}` : `0{${diff}}`;
    }
  }
}

/**
 * Cache
 */

toRegexRange.cache = {};
toRegexRange.clearCache = () => (toRegexRange.cache = {});

/**
 * Expose `toRegexRange`
 */

var toRegexRange_1 = toRegexRange;

const isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);

const transform = toNumber => {
  return value => toNumber === true ? Number(value) : String(value);
};

const isValidValue = value => {
  return typeof value === 'number' || (typeof value === 'string' && value !== '');
};

const isNumber$1 = num => Number.isInteger(+num);

const zeros = input => {
  let value = `${input}`;
  let index = -1;
  if (value[0] === '-') value = value.slice(1);
  if (value === '0') return false;
  while (value[++index] === '0');
  return index > 0;
};

const stringify$1 = (start, end, options) => {
  if (typeof start === 'string' || typeof end === 'string') {
    return true;
  }
  return options.stringify === true;
};

const pad = (input, maxLength, toNumber) => {
  if (maxLength > 0) {
    let dash = input[0] === '-' ? '-' : '';
    if (dash) input = input.slice(1);
    input = (dash + input.padStart(dash ? maxLength - 1 : maxLength, '0'));
  }
  if (toNumber === false) {
    return String(input);
  }
  return input;
};

const toMaxLen = (input, maxLength) => {
  let negative = input[0] === '-' ? '-' : '';
  if (negative) {
    input = input.slice(1);
    maxLength--;
  }
  while (input.length < maxLength) input = '0' + input;
  return negative ? ('-' + input) : input;
};

const toSequence = (parts, options) => {
  parts.negatives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  parts.positives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);

  let prefix = options.capture ? '' : '?:';
  let positives = '';
  let negatives = '';
  let result;

  if (parts.positives.length) {
    positives = parts.positives.join('|');
  }

  if (parts.negatives.length) {
    negatives = `-(${prefix}${parts.negatives.join('|')})`;
  }

  if (positives && negatives) {
    result = `${positives}|${negatives}`;
  } else {
    result = positives || negatives;
  }

  if (options.wrap) {
    return `(${prefix}${result})`;
  }

  return result;
};

const toRange = (a, b, isNumbers, options) => {
  if (isNumbers) {
    return toRegexRange_1(a, b, { wrap: false, ...options });
  }

  let start = String.fromCharCode(a);
  if (a === b) return start;

  let stop = String.fromCharCode(b);
  return `[${start}-${stop}]`;
};

const toRegex = (start, end, options) => {
  if (Array.isArray(start)) {
    let wrap = options.wrap === true;
    let prefix = options.capture ? '' : '?:';
    return wrap ? `(${prefix}${start.join('|')})` : start.join('|');
  }
  return toRegexRange_1(start, end, options);
};

const rangeError = (...args) => {
  return new RangeError('Invalid range arguments: ' + util$2.inspect(...args));
};

const invalidRange = (start, end, options) => {
  if (options.strictRanges === true) throw rangeError([start, end]);
  return [];
};

const invalidStep = (step, options) => {
  if (options.strictRanges === true) {
    throw new TypeError(`Expected step "${step}" to be a number`);
  }
  return [];
};

const fillNumbers = (start, end, step = 1, options = {}) => {
  let a = Number(start);
  let b = Number(end);

  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    if (options.strictRanges === true) throw rangeError([start, end]);
    return [];
  }

  // fix negative zero
  if (a === 0) a = 0;
  if (b === 0) b = 0;

  let descending = a > b;
  let startString = String(start);
  let endString = String(end);
  let stepString = String(step);
  step = Math.max(Math.abs(step), 1);

  let padded = zeros(startString) || zeros(endString) || zeros(stepString);
  let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
  let toNumber = padded === false && stringify$1(start, end, options) === false;
  let format = options.transform || transform(toNumber);

  if (options.toRegex && step === 1) {
    return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options);
  }

  let parts = { negatives: [], positives: [] };
  let push = num => parts[num < 0 ? 'negatives' : 'positives'].push(Math.abs(num));
  let range = [];
  let index = 0;

  while (descending ? a >= b : a <= b) {
    if (options.toRegex === true && step > 1) {
      push(a);
    } else {
      range.push(pad(format(a, index), maxLen, toNumber));
    }
    a = descending ? a - step : a + step;
    index++;
  }

  if (options.toRegex === true) {
    return step > 1
      ? toSequence(parts, options)
      : toRegex(range, null, { wrap: false, ...options });
  }

  return range;
};

const fillLetters = (start, end, step = 1, options = {}) => {
  if ((!isNumber$1(start) && start.length > 1) || (!isNumber$1(end) && end.length > 1)) {
    return invalidRange(start, end, options);
  }


  let format = options.transform || (val => String.fromCharCode(val));
  let a = `${start}`.charCodeAt(0);
  let b = `${end}`.charCodeAt(0);

  let descending = a > b;
  let min = Math.min(a, b);
  let max = Math.max(a, b);

  if (options.toRegex && step === 1) {
    return toRange(min, max, false, options);
  }

  let range = [];
  let index = 0;

  while (descending ? a >= b : a <= b) {
    range.push(format(a, index));
    a = descending ? a - step : a + step;
    index++;
  }

  if (options.toRegex === true) {
    return toRegex(range, null, { wrap: false, options });
  }

  return range;
};

const fill = (start, end, step, options = {}) => {
  if (end == null && isValidValue(start)) {
    return [start];
  }

  if (!isValidValue(start) || !isValidValue(end)) {
    return invalidRange(start, end, options);
  }

  if (typeof step === 'function') {
    return fill(start, end, 1, { transform: step });
  }

  if (isObject(step)) {
    return fill(start, end, 0, step);
  }

  let opts = { ...options };
  if (opts.capture === true) opts.wrap = true;
  step = step || opts.step || 1;

  if (!isNumber$1(step)) {
    if (step != null && !isObject(step)) return invalidStep(step, opts);
    return fill(start, end, 1, step);
  }

  if (isNumber$1(start) && isNumber$1(end)) {
    return fillNumbers(start, end, step, opts);
  }

  return fillLetters(start, end, Math.max(Math.abs(step), 1), opts);
};

var fillRange = fill;

const compile = (ast, options = {}) => {
  let walk = (node, parent = {}) => {
    let invalidBlock = utils.isInvalidBrace(parent);
    let invalidNode = node.invalid === true && options.escapeInvalid === true;
    let invalid = invalidBlock === true || invalidNode === true;
    let prefix = options.escapeInvalid === true ? '\\' : '';
    let output = '';

    if (node.isOpen === true) {
      return prefix + node.value;
    }
    if (node.isClose === true) {
      return prefix + node.value;
    }

    if (node.type === 'open') {
      return invalid ? (prefix + node.value) : '(';
    }

    if (node.type === 'close') {
      return invalid ? (prefix + node.value) : ')';
    }

    if (node.type === 'comma') {
      return node.prev.type === 'comma' ? '' : (invalid ? node.value : '|');
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes && node.ranges > 0) {
      let args = utils.reduce(node.nodes);
      let range = fillRange(...args, { ...options, wrap: false, toRegex: true });

      if (range.length !== 0) {
        return args.length > 1 && range.length > 1 ? `(${range})` : range;
      }
    }

    if (node.nodes) {
      for (let child of node.nodes) {
        output += walk(child, node);
      }
    }
    return output;
  };

  return walk(ast);
};

var compile_1 = compile;

const append = (queue = '', stash = '', enclose = false) => {
  let result = [];

  queue = [].concat(queue);
  stash = [].concat(stash);

  if (!stash.length) return queue;
  if (!queue.length) {
    return enclose ? utils.flatten(stash).map(ele => `{${ele}}`) : stash;
  }

  for (let item of queue) {
    if (Array.isArray(item)) {
      for (let value of item) {
        result.push(append(value, stash, enclose));
      }
    } else {
      for (let ele of stash) {
        if (enclose === true && typeof ele === 'string') ele = `{${ele}}`;
        result.push(Array.isArray(ele) ? append(item, ele, enclose) : (item + ele));
      }
    }
  }
  return utils.flatten(result);
};

const expand = (ast, options = {}) => {
  let rangeLimit = options.rangeLimit === void 0 ? 1000 : options.rangeLimit;

  let walk = (node, parent = {}) => {
    node.queue = [];

    let p = parent;
    let q = parent.queue;

    while (p.type !== 'brace' && p.type !== 'root' && p.parent) {
      p = p.parent;
      q = p.queue;
    }

    if (node.invalid || node.dollar) {
      q.push(append(q.pop(), stringify(node, options)));
      return;
    }

    if (node.type === 'brace' && node.invalid !== true && node.nodes.length === 2) {
      q.push(append(q.pop(), ['{}']));
      return;
    }

    if (node.nodes && node.ranges > 0) {
      let args = utils.reduce(node.nodes);

      if (utils.exceedsLimit(...args, options.step, rangeLimit)) {
        throw new RangeError('expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.');
      }

      let range = fillRange(...args, options);
      if (range.length === 0) {
        range = stringify(node, options);
      }

      q.push(append(q.pop(), range));
      node.nodes = [];
      return;
    }

    let enclose = utils.encloseBrace(node);
    let queue = node.queue;
    let block = node;

    while (block.type !== 'brace' && block.type !== 'root' && block.parent) {
      block = block.parent;
      queue = block.queue;
    }

    for (let i = 0; i < node.nodes.length; i++) {
      let child = node.nodes[i];

      if (child.type === 'comma' && node.type === 'brace') {
        if (i === 1) queue.push('');
        queue.push('');
        continue;
      }

      if (child.type === 'close') {
        q.push(append(q.pop(), queue, enclose));
        continue;
      }

      if (child.value && child.type !== 'open') {
        queue.push(append(queue.pop(), child.value));
        continue;
      }

      if (child.nodes) {
        walk(child, node);
      }
    }

    return queue;
  };

  return utils.flatten(walk(ast));
};

var expand_1 = expand;

var constants = {
  MAX_LENGTH: 1024 * 64,

  // Digits
  CHAR_0: '0', /* 0 */
  CHAR_9: '9', /* 9 */

  // Alphabet chars.
  CHAR_UPPERCASE_A: 'A', /* A */
  CHAR_LOWERCASE_A: 'a', /* a */
  CHAR_UPPERCASE_Z: 'Z', /* Z */
  CHAR_LOWERCASE_Z: 'z', /* z */

  CHAR_LEFT_PARENTHESES: '(', /* ( */
  CHAR_RIGHT_PARENTHESES: ')', /* ) */

  CHAR_ASTERISK: '*', /* * */

  // Non-alphabetic chars.
  CHAR_AMPERSAND: '&', /* & */
  CHAR_AT: '@', /* @ */
  CHAR_BACKSLASH: '\\', /* \ */
  CHAR_BACKTICK: '`', /* ` */
  CHAR_CARRIAGE_RETURN: '\r', /* \r */
  CHAR_CIRCUMFLEX_ACCENT: '^', /* ^ */
  CHAR_COLON: ':', /* : */
  CHAR_COMMA: ',', /* , */
  CHAR_DOLLAR: '$', /* . */
  CHAR_DOT: '.', /* . */
  CHAR_DOUBLE_QUOTE: '"', /* " */
  CHAR_EQUAL: '=', /* = */
  CHAR_EXCLAMATION_MARK: '!', /* ! */
  CHAR_FORM_FEED: '\f', /* \f */
  CHAR_FORWARD_SLASH: '/', /* / */
  CHAR_HASH: '#', /* # */
  CHAR_HYPHEN_MINUS: '-', /* - */
  CHAR_LEFT_ANGLE_BRACKET: '<', /* < */
  CHAR_LEFT_CURLY_BRACE: '{', /* { */
  CHAR_LEFT_SQUARE_BRACKET: '[', /* [ */
  CHAR_LINE_FEED: '\n', /* \n */
  CHAR_NO_BREAK_SPACE: '\u00A0', /* \u00A0 */
  CHAR_PERCENT: '%', /* % */
  CHAR_PLUS: '+', /* + */
  CHAR_QUESTION_MARK: '?', /* ? */
  CHAR_RIGHT_ANGLE_BRACKET: '>', /* > */
  CHAR_RIGHT_CURLY_BRACE: '}', /* } */
  CHAR_RIGHT_SQUARE_BRACKET: ']', /* ] */
  CHAR_SEMICOLON: ';', /* ; */
  CHAR_SINGLE_QUOTE: '\'', /* ' */
  CHAR_SPACE: ' ', /*   */
  CHAR_TAB: '\t', /* \t */
  CHAR_UNDERSCORE: '_', /* _ */
  CHAR_VERTICAL_LINE: '|', /* | */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: '\uFEFF' /* \uFEFF */
};

/**
 * Constants
 */

const {
  MAX_LENGTH,
  CHAR_BACKSLASH, /* \ */
  CHAR_BACKTICK, /* ` */
  CHAR_COMMA, /* , */
  CHAR_DOT, /* . */
  CHAR_LEFT_PARENTHESES, /* ( */
  CHAR_RIGHT_PARENTHESES, /* ) */
  CHAR_LEFT_CURLY_BRACE, /* { */
  CHAR_RIGHT_CURLY_BRACE, /* } */
  CHAR_LEFT_SQUARE_BRACKET, /* [ */
  CHAR_RIGHT_SQUARE_BRACKET, /* ] */
  CHAR_DOUBLE_QUOTE, /* " */
  CHAR_SINGLE_QUOTE, /* ' */
  CHAR_NO_BREAK_SPACE,
  CHAR_ZERO_WIDTH_NOBREAK_SPACE
} = constants;

/**
 * parse
 */

const parse = (input, options = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  let opts = options || {};
  let max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  if (input.length > max) {
    throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
  }

  let ast = { type: 'root', input, nodes: [] };
  let stack = [ast];
  let block = ast;
  let prev = ast;
  let brackets = 0;
  let length = input.length;
  let index = 0;
  let depth = 0;
  let value;

  /**
   * Helpers
   */

  const advance = () => input[index++];
  const push = node => {
    if (node.type === 'text' && prev.type === 'dot') {
      prev.type = 'text';
    }

    if (prev && prev.type === 'text' && node.type === 'text') {
      prev.value += node.value;
      return;
    }

    block.nodes.push(node);
    node.parent = block;
    node.prev = prev;
    prev = node;
    return node;
  };

  push({ type: 'bos' });

  while (index < length) {
    block = stack[stack.length - 1];
    value = advance();

    /**
     * Invalid chars
     */

    if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
      continue;
    }

    /**
     * Escaped chars
     */

    if (value === CHAR_BACKSLASH) {
      push({ type: 'text', value: (options.keepEscaping ? value : '') + advance() });
      continue;
    }

    /**
     * Right square bracket (literal): ']'
     */

    if (value === CHAR_RIGHT_SQUARE_BRACKET) {
      push({ type: 'text', value: '\\' + value });
      continue;
    }

    /**
     * Left square bracket: '['
     */

    if (value === CHAR_LEFT_SQUARE_BRACKET) {
      brackets++;
      let next;

      while (index < length && (next = advance())) {
        value += next;

        if (next === CHAR_LEFT_SQUARE_BRACKET) {
          brackets++;
          continue;
        }

        if (next === CHAR_BACKSLASH) {
          value += advance();
          continue;
        }

        if (next === CHAR_RIGHT_SQUARE_BRACKET) {
          brackets--;

          if (brackets === 0) {
            break;
          }
        }
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Parentheses
     */

    if (value === CHAR_LEFT_PARENTHESES) {
      block = push({ type: 'paren', nodes: [] });
      stack.push(block);
      push({ type: 'text', value });
      continue;
    }

    if (value === CHAR_RIGHT_PARENTHESES) {
      if (block.type !== 'paren') {
        push({ type: 'text', value });
        continue;
      }
      block = stack.pop();
      push({ type: 'text', value });
      block = stack[stack.length - 1];
      continue;
    }

    /**
     * Quotes: '|"|`
     */

    if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
      let open = value;
      let next;

      if (options.keepQuotes !== true) {
        value = '';
      }

      while (index < length && (next = advance())) {
        if (next === CHAR_BACKSLASH) {
          value += next + advance();
          continue;
        }

        if (next === open) {
          if (options.keepQuotes === true) value += next;
          break;
        }

        value += next;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Left curly brace: '{'
     */

    if (value === CHAR_LEFT_CURLY_BRACE) {
      depth++;

      let dollar = prev.value && prev.value.slice(-1) === '$' || block.dollar === true;
      let brace = {
        type: 'brace',
        open: true,
        close: false,
        dollar,
        depth,
        commas: 0,
        ranges: 0,
        nodes: []
      };

      block = push(brace);
      stack.push(block);
      push({ type: 'open', value });
      continue;
    }

    /**
     * Right curly brace: '}'
     */

    if (value === CHAR_RIGHT_CURLY_BRACE) {
      if (block.type !== 'brace') {
        push({ type: 'text', value });
        continue;
      }

      let type = 'close';
      block = stack.pop();
      block.close = true;

      push({ type, value });
      depth--;

      block = stack[stack.length - 1];
      continue;
    }

    /**
     * Comma: ','
     */

    if (value === CHAR_COMMA && depth > 0) {
      if (block.ranges > 0) {
        block.ranges = 0;
        let open = block.nodes.shift();
        block.nodes = [open, { type: 'text', value: stringify(block) }];
      }

      push({ type: 'comma', value });
      block.commas++;
      continue;
    }

    /**
     * Dot: '.'
     */

    if (value === CHAR_DOT && depth > 0 && block.commas === 0) {
      let siblings = block.nodes;

      if (depth === 0 || siblings.length === 0) {
        push({ type: 'text', value });
        continue;
      }

      if (prev.type === 'dot') {
        block.range = [];
        prev.value += value;
        prev.type = 'range';

        if (block.nodes.length !== 3 && block.nodes.length !== 5) {
          block.invalid = true;
          block.ranges = 0;
          prev.type = 'text';
          continue;
        }

        block.ranges++;
        block.args = [];
        continue;
      }

      if (prev.type === 'range') {
        siblings.pop();

        let before = siblings[siblings.length - 1];
        before.value += prev.value + value;
        prev = before;
        block.ranges--;
        continue;
      }

      push({ type: 'dot', value });
      continue;
    }

    /**
     * Text
     */

    push({ type: 'text', value });
  }

  // Mark imbalanced braces and brackets as invalid
  do {
    block = stack.pop();

    if (block.type !== 'root') {
      block.nodes.forEach(node => {
        if (!node.nodes) {
          if (node.type === 'open') node.isOpen = true;
          if (node.type === 'close') node.isClose = true;
          if (!node.nodes) node.type = 'text';
          node.invalid = true;
        }
      });

      // get the location of the block on parent.nodes (block's siblings)
      let parent = stack[stack.length - 1];
      let index = parent.nodes.indexOf(block);
      // replace the (invalid) block with it's nodes
      parent.nodes.splice(index, 1, ...block.nodes);
    }
  } while (stack.length > 0);

  push({ type: 'eos' });
  return ast;
};

var parse_1 = parse;

/**
 * Expand the given pattern or create a regex-compatible string.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces('{a,b,c}', { compile: true })); //=> ['(a|b|c)']
 * console.log(braces('{a,b,c}')); //=> ['a', 'b', 'c']
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {String}
 * @api public
 */

const braces = (input, options = {}) => {
  let output = [];

  if (Array.isArray(input)) {
    for (let pattern of input) {
      let result = braces.create(pattern, options);
      if (Array.isArray(result)) {
        output.push(...result);
      } else {
        output.push(result);
      }
    }
  } else {
    output = [].concat(braces.create(input, options));
  }

  if (options && options.expand === true && options.nodupes === true) {
    output = [...new Set(output)];
  }
  return output;
};

/**
 * Parse the given `str` with the given `options`.
 *
 * ```js
 * // braces.parse(pattern, [, options]);
 * const ast = braces.parse('a/{b,c}/d');
 * console.log(ast);
 * ```
 * @param {String} pattern Brace pattern to parse
 * @param {Object} options
 * @return {Object} Returns an AST
 * @api public
 */

braces.parse = (input, options = {}) => parse_1(input, options);

/**
 * Creates a braces string from an AST, or an AST node.
 *
 * ```js
 * const braces = require('braces');
 * let ast = braces.parse('foo/{a,b}/bar');
 * console.log(stringify(ast.nodes[2])); //=> '{a,b}'
 * ```
 * @param {String} `input` Brace pattern or AST.
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces.stringify = (input, options = {}) => {
  if (typeof input === 'string') {
    return stringify(braces.parse(input, options), options);
  }
  return stringify(input, options);
};

/**
 * Compiles a brace pattern into a regex-compatible, optimized string.
 * This method is called by the main [braces](#braces) function by default.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.compile('a/{b,c}/d'));
 * //=> ['a/(b|c)/d']
 * ```
 * @param {String} `input` Brace pattern or AST.
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces.compile = (input, options = {}) => {
  if (typeof input === 'string') {
    input = braces.parse(input, options);
  }
  return compile_1(input, options);
};

/**
 * Expands a brace pattern into an array. This method is called by the
 * main [braces](#braces) function when `options.expand` is true. Before
 * using this method it's recommended that you read the [performance notes](#performance))
 * and advantages of using [.compile](#compile) instead.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.expand('a/{b,c}/d'));
 * //=> ['a/b/d', 'a/c/d'];
 * ```
 * @param {String} `pattern` Brace pattern
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces.expand = (input, options = {}) => {
  if (typeof input === 'string') {
    input = braces.parse(input, options);
  }

  let result = expand_1(input, options);

  // filter out empty strings if specified
  if (options.noempty === true) {
    result = result.filter(Boolean);
  }

  // filter out duplicates if specified
  if (options.nodupes === true) {
    result = [...new Set(result)];
  }

  return result;
};

/**
 * Processes a brace pattern and returns either an expanded array
 * (if `options.expand` is true), a highly optimized regex-compatible string.
 * This method is called by the main [braces](#braces) function.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.create('user-{200..300}/project-{a,b,c}-{1..10}'))
 * //=> 'user-(20[0-9]|2[1-9][0-9]|300)/project-(a|b|c)-([1-9]|10)'
 * ```
 * @param {String} `pattern` Brace pattern
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces.create = (input, options = {}) => {
  if (input === '' || input.length < 3) {
    return [input];
  }

 return options.expand !== true
    ? braces.compile(input, options)
    : braces.expand(input, options);
};

/**
 * Expose "braces"
 */

var braces_1 = braces;

const WIN_SLASH = '\\\\/';
const WIN_NO_SLASH = `[^${WIN_SLASH}]`;

/**
 * Posix glob regex
 */

const DOT_LITERAL = '\\.';
const PLUS_LITERAL = '\\+';
const QMARK_LITERAL = '\\?';
const SLASH_LITERAL = '\\/';
const ONE_CHAR = '(?=.)';
const QMARK = '[^/]';
const END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
const START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
const DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
const NO_DOT = `(?!${DOT_LITERAL})`;
const NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
const NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
const NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
const QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
const STAR = `${QMARK}*?`;

const POSIX_CHARS = {
  DOT_LITERAL,
  PLUS_LITERAL,
  QMARK_LITERAL,
  SLASH_LITERAL,
  ONE_CHAR,
  QMARK,
  END_ANCHOR,
  DOTS_SLASH,
  NO_DOT,
  NO_DOTS,
  NO_DOT_SLASH,
  NO_DOTS_SLASH,
  QMARK_NO_DOT,
  STAR,
  START_ANCHOR
};

/**
 * Windows glob regex
 */

const WINDOWS_CHARS = {
  ...POSIX_CHARS,

  SLASH_LITERAL: `[${WIN_SLASH}]`,
  QMARK: WIN_NO_SLASH,
  STAR: `${WIN_NO_SLASH}*?`,
  DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
  NO_DOT: `(?!${DOT_LITERAL})`,
  NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
  NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
  START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
  END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
};

/**
 * POSIX Bracket Regex
 */

const POSIX_REGEX_SOURCE = {
  alnum: 'a-zA-Z0-9',
  alpha: 'a-zA-Z',
  ascii: '\\x00-\\x7F',
  blank: ' \\t',
  cntrl: '\\x00-\\x1F\\x7F',
  digit: '0-9',
  graph: '\\x21-\\x7E',
  lower: 'a-z',
  print: '\\x20-\\x7E ',
  punct: '\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
  space: ' \\t\\r\\n\\v\\f',
  upper: 'A-Z',
  word: 'A-Za-z0-9_',
  xdigit: 'A-Fa-f0-9'
};

var constants$1 = {
  MAX_LENGTH: 1024 * 64,
  POSIX_REGEX_SOURCE,

  // regular expressions
  REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
  REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
  REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
  REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
  REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
  REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,

  // Replace globs with equivalent patterns to reduce parsing time.
  REPLACEMENTS: {
    '***': '*',
    '**/**': '**',
    '**/**/**': '**'
  },

  // Digits
  CHAR_0: 48, /* 0 */
  CHAR_9: 57, /* 9 */

  // Alphabet chars.
  CHAR_UPPERCASE_A: 65, /* A */
  CHAR_LOWERCASE_A: 97, /* a */
  CHAR_UPPERCASE_Z: 90, /* Z */
  CHAR_LOWERCASE_Z: 122, /* z */

  CHAR_LEFT_PARENTHESES: 40, /* ( */
  CHAR_RIGHT_PARENTHESES: 41, /* ) */

  CHAR_ASTERISK: 42, /* * */

  // Non-alphabetic chars.
  CHAR_AMPERSAND: 38, /* & */
  CHAR_AT: 64, /* @ */
  CHAR_BACKWARD_SLASH: 92, /* \ */
  CHAR_CARRIAGE_RETURN: 13, /* \r */
  CHAR_CIRCUMFLEX_ACCENT: 94, /* ^ */
  CHAR_COLON: 58, /* : */
  CHAR_COMMA: 44, /* , */
  CHAR_DOT: 46, /* . */
  CHAR_DOUBLE_QUOTE: 34, /* " */
  CHAR_EQUAL: 61, /* = */
  CHAR_EXCLAMATION_MARK: 33, /* ! */
  CHAR_FORM_FEED: 12, /* \f */
  CHAR_FORWARD_SLASH: 47, /* / */
  CHAR_GRAVE_ACCENT: 96, /* ` */
  CHAR_HASH: 35, /* # */
  CHAR_HYPHEN_MINUS: 45, /* - */
  CHAR_LEFT_ANGLE_BRACKET: 60, /* < */
  CHAR_LEFT_CURLY_BRACE: 123, /* { */
  CHAR_LEFT_SQUARE_BRACKET: 91, /* [ */
  CHAR_LINE_FEED: 10, /* \n */
  CHAR_NO_BREAK_SPACE: 160, /* \u00A0 */
  CHAR_PERCENT: 37, /* % */
  CHAR_PLUS: 43, /* + */
  CHAR_QUESTION_MARK: 63, /* ? */
  CHAR_RIGHT_ANGLE_BRACKET: 62, /* > */
  CHAR_RIGHT_CURLY_BRACE: 125, /* } */
  CHAR_RIGHT_SQUARE_BRACKET: 93, /* ] */
  CHAR_SEMICOLON: 59, /* ; */
  CHAR_SINGLE_QUOTE: 39, /* ' */
  CHAR_SPACE: 32, /*   */
  CHAR_TAB: 9, /* \t */
  CHAR_UNDERSCORE: 95, /* _ */
  CHAR_VERTICAL_LINE: 124, /* | */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279, /* \uFEFF */

  SEP: path$3.sep,

  /**
   * Create EXTGLOB_CHARS
   */

  extglobChars(chars) {
    return {
      '!': { type: 'negate', open: '(?:(?!(?:', close: `))${chars.STAR})` },
      '?': { type: 'qmark', open: '(?:', close: ')?' },
      '+': { type: 'plus', open: '(?:', close: ')+' },
      '*': { type: 'star', open: '(?:', close: ')*' },
      '@': { type: 'at', open: '(?:', close: ')' }
    };
  },

  /**
   * Create GLOB_CHARS
   */

  globChars(win32) {
    return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
  }
};

var utils$1 = createCommonjsModule(function (module, exports) {


const win32 = process.platform === 'win32';
const {
  REGEX_BACKSLASH,
  REGEX_REMOVE_BACKSLASH,
  REGEX_SPECIAL_CHARS,
  REGEX_SPECIAL_CHARS_GLOBAL
} = constants$1;

exports.isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);
exports.hasRegexChars = str => REGEX_SPECIAL_CHARS.test(str);
exports.isRegexChar = str => str.length === 1 && exports.hasRegexChars(str);
exports.escapeRegex = str => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, '\\$1');
exports.toPosixSlashes = str => str.replace(REGEX_BACKSLASH, '/');

exports.removeBackslashes = str => {
  return str.replace(REGEX_REMOVE_BACKSLASH, match => {
    return match === '\\' ? '' : match;
  });
};

exports.supportsLookbehinds = () => {
  const segs = process.version.slice(1).split('.').map(Number);
  if (segs.length === 3 && segs[0] >= 9 || (segs[0] === 8 && segs[1] >= 10)) {
    return true;
  }
  return false;
};

exports.isWindows = options => {
  if (options && typeof options.windows === 'boolean') {
    return options.windows;
  }
  return win32 === true || path$3.sep === '\\';
};

exports.escapeLast = (input, char, lastIdx) => {
  const idx = input.lastIndexOf(char, lastIdx);
  if (idx === -1) return input;
  if (input[idx - 1] === '\\') return exports.escapeLast(input, char, idx - 1);
  return `${input.slice(0, idx)}\\${input.slice(idx)}`;
};

exports.removePrefix = (input, state = {}) => {
  let output = input;
  if (output.startsWith('./')) {
    output = output.slice(2);
    state.prefix = './';
  }
  return output;
};

exports.wrapOutput = (input, state = {}, options = {}) => {
  const prepend = options.contains ? '' : '^';
  const append = options.contains ? '' : '$';

  let output = `${prepend}(?:${input})${append}`;
  if (state.negated === true) {
    output = `(?:^(?!${output}).*$)`;
  }
  return output;
};
});

const {
  CHAR_ASTERISK,             /* * */
  CHAR_AT,                   /* @ */
  CHAR_BACKWARD_SLASH,       /* \ */
  CHAR_COMMA: CHAR_COMMA$1,                /* , */
  CHAR_DOT: CHAR_DOT$1,                  /* . */
  CHAR_EXCLAMATION_MARK,     /* ! */
  CHAR_FORWARD_SLASH,        /* / */
  CHAR_LEFT_CURLY_BRACE: CHAR_LEFT_CURLY_BRACE$1,     /* { */
  CHAR_LEFT_PARENTHESES: CHAR_LEFT_PARENTHESES$1,     /* ( */
  CHAR_LEFT_SQUARE_BRACKET: CHAR_LEFT_SQUARE_BRACKET$1,  /* [ */
  CHAR_PLUS,                 /* + */
  CHAR_QUESTION_MARK,        /* ? */
  CHAR_RIGHT_CURLY_BRACE: CHAR_RIGHT_CURLY_BRACE$1,    /* } */
  CHAR_RIGHT_PARENTHESES: CHAR_RIGHT_PARENTHESES$1,    /* ) */
  CHAR_RIGHT_SQUARE_BRACKET: CHAR_RIGHT_SQUARE_BRACKET$1  /* ] */
} = constants$1;

const isPathSeparator = code => {
  return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
};

const depth = token => {
  if (token.isPrefix !== true) {
    token.depth = token.isGlobstar ? Infinity : 1;
  }
};

/**
 * Quickly scans a glob pattern and returns an object with a handful of
 * useful properties, like `isGlob`, `path` (the leading non-glob, if it exists),
 * `glob` (the actual pattern), and `negated` (true if the path starts with `!`).
 *
 * ```js
 * const pm = require('picomatch');
 * console.log(pm.scan('foo/bar/*.js'));
 * { isGlob: true, input: 'foo/bar/*.js', base: 'foo/bar', glob: '*.js' }
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {Object} Returns an object with tokens and regex source string.
 * @api public
 */

const scan = (input, options) => {
  const opts = options || {};

  const length = input.length - 1;
  const scanToEnd = opts.parts === true || opts.scanToEnd === true;
  const slashes = [];
  const tokens = [];
  const parts = [];

  let str = input;
  let index = -1;
  let start = 0;
  let lastIndex = 0;
  let isBrace = false;
  let isBracket = false;
  let isGlob = false;
  let isExtglob = false;
  let isGlobstar = false;
  let braceEscaped = false;
  let backslashes = false;
  let negated = false;
  let finished = false;
  let braces = 0;
  let prev;
  let code;
  let token = { value: '', depth: 0, isGlob: false };

  const eos = () => index >= length;
  const peek = () => str.charCodeAt(index + 1);
  const advance = () => {
    prev = code;
    return str.charCodeAt(++index);
  };

  while (index < length) {
    code = advance();
    let next;

    if (code === CHAR_BACKWARD_SLASH) {
      backslashes = token.backslashes = true;
      code = advance();

      if (code === CHAR_LEFT_CURLY_BRACE$1) {
        braceEscaped = true;
      }
      continue;
    }

    if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE$1) {
      braces++;

      while (eos() !== true && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (code === CHAR_LEFT_CURLY_BRACE$1) {
          braces++;
          continue;
        }

        if (braceEscaped !== true && code === CHAR_DOT$1 && (code = advance()) === CHAR_DOT$1) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (braceEscaped !== true && code === CHAR_COMMA$1) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (code === CHAR_RIGHT_CURLY_BRACE$1) {
          braces--;

          if (braces === 0) {
            braceEscaped = false;
            isBrace = token.isBrace = true;
            finished = true;
            break;
          }
        }
      }

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (code === CHAR_FORWARD_SLASH) {
      slashes.push(index);
      tokens.push(token);
      token = { value: '', depth: 0, isGlob: false };

      if (finished === true) continue;
      if (prev === CHAR_DOT$1 && index === (start + 1)) {
        start += 2;
        continue;
      }

      lastIndex = index + 1;
      continue;
    }

    if (opts.noext !== true) {
      const isExtglobChar = code === CHAR_PLUS
        || code === CHAR_AT
        || code === CHAR_ASTERISK
        || code === CHAR_QUESTION_MARK
        || code === CHAR_EXCLAMATION_MARK;

      if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES$1) {
        isGlob = token.isGlob = true;
        isExtglob = token.isExtglob = true;
        finished = true;

        if (scanToEnd === true) {
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              code = advance();
              continue;
            }

            if (code === CHAR_RIGHT_PARENTHESES$1) {
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          continue;
        }
        break;
      }
    }

    if (code === CHAR_ASTERISK) {
      if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }
      break;
    }

    if (code === CHAR_QUESTION_MARK) {
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }
      break;
    }

    if (code === CHAR_LEFT_SQUARE_BRACKET$1) {
      while (eos() !== true && (next = advance())) {
        if (next === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (next === CHAR_RIGHT_SQUARE_BRACKET$1) {
          isBracket = token.isBracket = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }
          break;
        }
      }
    }

    if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
      negated = token.negated = true;
      start++;
      continue;
    }

    if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES$1) {
      isGlob = token.isGlob = true;

      if (scanToEnd === true) {
        while (eos() !== true && (code = advance())) {
          if (code === CHAR_LEFT_PARENTHESES$1) {
            backslashes = token.backslashes = true;
            code = advance();
            continue;
          }

          if (code === CHAR_RIGHT_PARENTHESES$1) {
            finished = true;
            break;
          }
        }
        continue;
      }
      break;
    }

    if (isGlob === true) {
      finished = true;

      if (scanToEnd === true) {
        continue;
      }

      break;
    }
  }

  if (opts.noext === true) {
    isExtglob = false;
    isGlob = false;
  }

  let base = str;
  let prefix = '';
  let glob = '';

  if (start > 0) {
    prefix = str.slice(0, start);
    str = str.slice(start);
    lastIndex -= start;
  }

  if (base && isGlob === true && lastIndex > 0) {
    base = str.slice(0, lastIndex);
    glob = str.slice(lastIndex);
  } else if (isGlob === true) {
    base = '';
    glob = str;
  } else {
    base = str;
  }

  if (base && base !== '' && base !== '/' && base !== str) {
    if (isPathSeparator(base.charCodeAt(base.length - 1))) {
      base = base.slice(0, -1);
    }
  }

  if (opts.unescape === true) {
    if (glob) glob = utils$1.removeBackslashes(glob);

    if (base && backslashes === true) {
      base = utils$1.removeBackslashes(base);
    }
  }

  const state = {
    prefix,
    input,
    start,
    base,
    glob,
    isBrace,
    isBracket,
    isGlob,
    isExtglob,
    isGlobstar,
    negated
  };

  if (opts.tokens === true) {
    state.maxDepth = 0;
    if (!isPathSeparator(code)) {
      tokens.push(token);
    }
    state.tokens = tokens;
  }

  if (opts.parts === true || opts.tokens === true) {
    let prevIndex;

    for (let idx = 0; idx < slashes.length; idx++) {
      const n = prevIndex ? prevIndex + 1 : start;
      const i = slashes[idx];
      const value = input.slice(n, i);
      if (opts.tokens) {
        if (idx === 0 && start !== 0) {
          tokens[idx].isPrefix = true;
          tokens[idx].value = prefix;
        } else {
          tokens[idx].value = value;
        }
        depth(tokens[idx]);
        state.maxDepth += tokens[idx].depth;
      }
      if (idx !== 0 || value !== '') {
        parts.push(value);
      }
      prevIndex = i;
    }

    if (prevIndex && prevIndex + 1 < input.length) {
      const value = input.slice(prevIndex + 1);
      parts.push(value);

      if (opts.tokens) {
        tokens[tokens.length - 1].value = value;
        depth(tokens[tokens.length - 1]);
        state.maxDepth += tokens[tokens.length - 1].depth;
      }
    }

    state.slashes = slashes;
    state.parts = parts;
  }

  return state;
};

var scan_1 = scan;

/**
 * Constants
 */

const {
  MAX_LENGTH: MAX_LENGTH$1,
  POSIX_REGEX_SOURCE: POSIX_REGEX_SOURCE$1,
  REGEX_NON_SPECIAL_CHARS,
  REGEX_SPECIAL_CHARS_BACKREF,
  REPLACEMENTS
} = constants$1;

/**
 * Helpers
 */

const expandRange = (args, options) => {
  if (typeof options.expandRange === 'function') {
    return options.expandRange(...args, options);
  }

  args.sort();
  const value = `[${args.join('-')}]`;

  try {
    /* eslint-disable-next-line no-new */
    new RegExp(value);
  } catch (ex) {
    return args.map(v => utils$1.escapeRegex(v)).join('..');
  }

  return value;
};

/**
 * Create the message for a syntax error
 */

const syntaxError = (type, char) => {
  return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
};

/**
 * Parse the given input string.
 * @param {String} input
 * @param {Object} options
 * @return {Object}
 */

const parse$1 = (input, options) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  input = REPLACEMENTS[input] || input;

  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH$1, opts.maxLength) : MAX_LENGTH$1;

  let len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  const bos = { type: 'bos', value: '', output: opts.prepend || '' };
  const tokens = [bos];

  const capture = opts.capture ? '' : '?:';
  const win32 = utils$1.isWindows(options);

  // create constants based on platform, for windows or posix
  const PLATFORM_CHARS = constants$1.globChars(win32);
  const EXTGLOB_CHARS = constants$1.extglobChars(PLATFORM_CHARS);

  const {
    DOT_LITERAL,
    PLUS_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOT_SLASH,
    NO_DOTS_SLASH,
    QMARK,
    QMARK_NO_DOT,
    STAR,
    START_ANCHOR
  } = PLATFORM_CHARS;

  const globstar = (opts) => {
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const nodot = opts.dot ? '' : NO_DOT;
  const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
  let star = opts.bash === true ? globstar(opts) : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  // minimatch options support
  if (typeof opts.noext === 'boolean') {
    opts.noextglob = opts.noext;
  }

  const state = {
    input,
    index: -1,
    start: 0,
    dot: opts.dot === true,
    consumed: '',
    output: '',
    prefix: '',
    backtrack: false,
    negated: false,
    brackets: 0,
    braces: 0,
    parens: 0,
    quotes: 0,
    globstar: false,
    tokens
  };

  input = utils$1.removePrefix(input, state);
  len = input.length;

  const extglobs = [];
  const braces = [];
  const stack = [];
  let prev = bos;
  let value;

  /**
   * Tokenizing helpers
   */

  const eos = () => state.index === len - 1;
  const peek = state.peek = (n = 1) => input[state.index + n];
  const advance = state.advance = () => input[++state.index];
  const remaining = () => input.slice(state.index + 1);
  const consume = (value = '', num = 0) => {
    state.consumed += value;
    state.index += num;
  };
  const append = token => {
    state.output += token.output != null ? token.output : token.value;
    consume(token.value);
  };

  const negate = () => {
    let count = 1;

    while (peek() === '!' && (peek(2) !== '(' || peek(3) === '?')) {
      advance();
      state.start++;
      count++;
    }

    if (count % 2 === 0) {
      return false;
    }

    state.negated = true;
    state.start++;
    return true;
  };

  const increment = type => {
    state[type]++;
    stack.push(type);
  };

  const decrement = type => {
    state[type]--;
    stack.pop();
  };

  /**
   * Push tokens onto the tokens array. This helper speeds up
   * tokenizing by 1) helping us avoid backtracking as much as possible,
   * and 2) helping us avoid creating extra tokens when consecutive
   * characters are plain text. This improves performance and simplifies
   * lookbehinds.
   */

  const push = tok => {
    if (prev.type === 'globstar') {
      const isBrace = state.braces > 0 && (tok.type === 'comma' || tok.type === 'brace');
      const isExtglob = tok.extglob === true || (extglobs.length && (tok.type === 'pipe' || tok.type === 'paren'));

      if (tok.type !== 'slash' && tok.type !== 'paren' && !isBrace && !isExtglob) {
        state.output = state.output.slice(0, -prev.output.length);
        prev.type = 'star';
        prev.value = '*';
        prev.output = star;
        state.output += prev.output;
      }
    }

    if (extglobs.length && tok.type !== 'paren' && !EXTGLOB_CHARS[tok.value]) {
      extglobs[extglobs.length - 1].inner += tok.value;
    }

    if (tok.value || tok.output) append(tok);
    if (prev && prev.type === 'text' && tok.type === 'text') {
      prev.value += tok.value;
      prev.output = (prev.output || '') + tok.value;
      return;
    }

    tok.prev = prev;
    tokens.push(tok);
    prev = tok;
  };

  const extglobOpen = (type, value) => {
    const token = { ...EXTGLOB_CHARS[value], conditions: 1, inner: '' };

    token.prev = prev;
    token.parens = state.parens;
    token.output = state.output;
    const output = (opts.capture ? '(' : '') + token.open;

    increment('parens');
    push({ type, value, output: state.output ? '' : ONE_CHAR });
    push({ type: 'paren', extglob: true, value: advance(), output });
    extglobs.push(token);
  };

  const extglobClose = token => {
    let output = token.close + (opts.capture ? ')' : '');

    if (token.type === 'negate') {
      let extglobStar = star;

      if (token.inner && token.inner.length > 1 && token.inner.includes('/')) {
        extglobStar = globstar(opts);
      }

      if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
        output = token.close = `)$))${extglobStar}`;
      }

      if (token.prev.type === 'bos' && eos()) {
        state.negatedExtglob = true;
      }
    }

    push({ type: 'paren', extglob: true, value, output });
    decrement('parens');
  };

  /**
   * Fast paths
   */

  if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
    let backslashes = false;

    let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
      if (first === '\\') {
        backslashes = true;
        return m;
      }

      if (first === '?') {
        if (esc) {
          return esc + first + (rest ? QMARK.repeat(rest.length) : '');
        }
        if (index === 0) {
          return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : '');
        }
        return QMARK.repeat(chars.length);
      }

      if (first === '.') {
        return DOT_LITERAL.repeat(chars.length);
      }

      if (first === '*') {
        if (esc) {
          return esc + first + (rest ? star : '');
        }
        return star;
      }
      return esc ? m : `\\${m}`;
    });

    if (backslashes === true) {
      if (opts.unescape === true) {
        output = output.replace(/\\/g, '');
      } else {
        output = output.replace(/\\+/g, m => {
          return m.length % 2 === 0 ? '\\\\' : (m ? '\\' : '');
        });
      }
    }

    if (output === input && opts.contains === true) {
      state.output = input;
      return state;
    }

    state.output = utils$1.wrapOutput(output, state, options);
    return state;
  }

  /**
   * Tokenize input until we reach end-of-string
   */

  while (!eos()) {
    value = advance();

    if (value === '\u0000') {
      continue;
    }

    /**
     * Escaped characters
     */

    if (value === '\\') {
      const next = peek();

      if (next === '/' && opts.bash !== true) {
        continue;
      }

      if (next === '.' || next === ';') {
        continue;
      }

      if (!next) {
        value += '\\';
        push({ type: 'text', value });
        continue;
      }

      // collapse slashes to reduce potential for exploits
      const match = /^\\+/.exec(remaining());
      let slashes = 0;

      if (match && match[0].length > 2) {
        slashes = match[0].length;
        state.index += slashes;
        if (slashes % 2 !== 0) {
          value += '\\';
        }
      }

      if (opts.unescape === true) {
        value = advance() || '';
      } else {
        value += advance() || '';
      }

      if (state.brackets === 0) {
        push({ type: 'text', value });
        continue;
      }
    }

    /**
     * If we're inside a regex character class, continue
     * until we reach the closing bracket.
     */

    if (state.brackets > 0 && (value !== ']' || prev.value === '[' || prev.value === '[^')) {
      if (opts.posix !== false && value === ':') {
        const inner = prev.value.slice(1);
        if (inner.includes('[')) {
          prev.posix = true;

          if (inner.includes(':')) {
            const idx = prev.value.lastIndexOf('[');
            const pre = prev.value.slice(0, idx);
            const rest = prev.value.slice(idx + 2);
            const posix = POSIX_REGEX_SOURCE$1[rest];
            if (posix) {
              prev.value = pre + posix;
              state.backtrack = true;
              advance();

              if (!bos.output && tokens.indexOf(prev) === 1) {
                bos.output = ONE_CHAR;
              }
              continue;
            }
          }
        }
      }

      if ((value === '[' && peek() !== ':') || (value === '-' && peek() === ']')) {
        value = `\\${value}`;
      }

      if (value === ']' && (prev.value === '[' || prev.value === '[^')) {
        value = `\\${value}`;
      }

      if (opts.posix === true && value === '!' && prev.value === '[') {
        value = '^';
      }

      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * If we're inside a quoted string, continue
     * until we reach the closing double quote.
     */

    if (state.quotes === 1 && value !== '"') {
      value = utils$1.escapeRegex(value);
      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * Double quotes
     */

    if (value === '"') {
      state.quotes = state.quotes === 1 ? 0 : 1;
      if (opts.keepQuotes === true) {
        push({ type: 'text', value });
      }
      continue;
    }

    /**
     * Parentheses
     */

    if (value === '(') {
      increment('parens');
      push({ type: 'paren', value });
      continue;
    }

    if (value === ')') {
      if (state.parens === 0 && opts.strictBrackets === true) {
        throw new SyntaxError(syntaxError('opening', '('));
      }

      const extglob = extglobs[extglobs.length - 1];
      if (extglob && state.parens === extglob.parens + 1) {
        extglobClose(extglobs.pop());
        continue;
      }

      push({ type: 'paren', value, output: state.parens ? ')' : '\\)' });
      decrement('parens');
      continue;
    }

    /**
     * Square brackets
     */

    if (value === '[') {
      if (opts.nobracket === true || !remaining().includes(']')) {
        if (opts.nobracket !== true && opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('closing', ']'));
        }

        value = `\\${value}`;
      } else {
        increment('brackets');
      }

      push({ type: 'bracket', value });
      continue;
    }

    if (value === ']') {
      if (opts.nobracket === true || (prev && prev.type === 'bracket' && prev.value.length === 1)) {
        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      if (state.brackets === 0) {
        if (opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('opening', '['));
        }

        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      decrement('brackets');

      const prevValue = prev.value.slice(1);
      if (prev.posix !== true && prevValue[0] === '^' && !prevValue.includes('/')) {
        value = `/${value}`;
      }

      prev.value += value;
      append({ value });

      // when literal brackets are explicitly disabled
      // assume we should match with a regex character class
      if (opts.literalBrackets === false || utils$1.hasRegexChars(prevValue)) {
        continue;
      }

      const escaped = utils$1.escapeRegex(prev.value);
      state.output = state.output.slice(0, -prev.value.length);

      // when literal brackets are explicitly enabled
      // assume we should escape the brackets to match literal characters
      if (opts.literalBrackets === true) {
        state.output += escaped;
        prev.value = escaped;
        continue;
      }

      // when the user specifies nothing, try to match both
      prev.value = `(${capture}${escaped}|${prev.value})`;
      state.output += prev.value;
      continue;
    }

    /**
     * Braces
     */

    if (value === '{' && opts.nobrace !== true) {
      increment('braces');

      const open = {
        type: 'brace',
        value,
        output: '(',
        outputIndex: state.output.length,
        tokensIndex: state.tokens.length
      };

      braces.push(open);
      push(open);
      continue;
    }

    if (value === '}') {
      const brace = braces[braces.length - 1];

      if (opts.nobrace === true || !brace) {
        push({ type: 'text', value, output: value });
        continue;
      }

      let output = ')';

      if (brace.dots === true) {
        const arr = tokens.slice();
        const range = [];

        for (let i = arr.length - 1; i >= 0; i--) {
          tokens.pop();
          if (arr[i].type === 'brace') {
            break;
          }
          if (arr[i].type !== 'dots') {
            range.unshift(arr[i].value);
          }
        }

        output = expandRange(range, opts);
        state.backtrack = true;
      }

      if (brace.comma !== true && brace.dots !== true) {
        const out = state.output.slice(0, brace.outputIndex);
        const toks = state.tokens.slice(brace.tokensIndex);
        brace.value = brace.output = '\\{';
        value = output = '\\}';
        state.output = out;
        for (const t of toks) {
          state.output += (t.output || t.value);
        }
      }

      push({ type: 'brace', value, output });
      decrement('braces');
      braces.pop();
      continue;
    }

    /**
     * Pipes
     */

    if (value === '|') {
      if (extglobs.length > 0) {
        extglobs[extglobs.length - 1].conditions++;
      }
      push({ type: 'text', value });
      continue;
    }

    /**
     * Commas
     */

    if (value === ',') {
      let output = value;

      const brace = braces[braces.length - 1];
      if (brace && stack[stack.length - 1] === 'braces') {
        brace.comma = true;
        output = '|';
      }

      push({ type: 'comma', value, output });
      continue;
    }

    /**
     * Slashes
     */

    if (value === '/') {
      // if the beginning of the glob is "./", advance the start
      // to the current index, and don't add the "./" characters
      // to the state. This greatly simplifies lookbehinds when
      // checking for BOS characters like "!" and "." (not "./")
      if (prev.type === 'dot' && state.index === state.start + 1) {
        state.start = state.index + 1;
        state.consumed = '';
        state.output = '';
        tokens.pop();
        prev = bos; // reset "prev" to the first token
        continue;
      }

      push({ type: 'slash', value, output: SLASH_LITERAL });
      continue;
    }

    /**
     * Dots
     */

    if (value === '.') {
      if (state.braces > 0 && prev.type === 'dot') {
        if (prev.value === '.') prev.output = DOT_LITERAL;
        const brace = braces[braces.length - 1];
        prev.type = 'dots';
        prev.output += value;
        prev.value += value;
        brace.dots = true;
        continue;
      }

      if ((state.braces + state.parens) === 0 && prev.type !== 'bos' && prev.type !== 'slash') {
        push({ type: 'text', value, output: DOT_LITERAL });
        continue;
      }

      push({ type: 'dot', value, output: DOT_LITERAL });
      continue;
    }

    /**
     * Question marks
     */

    if (value === '?') {
      const isGroup = prev && prev.value === '(';
      if (!isGroup && opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('qmark', value);
        continue;
      }

      if (prev && prev.type === 'paren') {
        const next = peek();
        let output = value;

        if (next === '<' && !utils$1.supportsLookbehinds()) {
          throw new Error('Node.js v10 or higher is required for regex lookbehinds');
        }

        if ((prev.value === '(' && !/[!=<:]/.test(next)) || (next === '<' && !/<([!=]|\w+>)/.test(remaining()))) {
          output = `\\${value}`;
        }

        push({ type: 'text', value, output });
        continue;
      }

      if (opts.dot !== true && (prev.type === 'slash' || prev.type === 'bos')) {
        push({ type: 'qmark', value, output: QMARK_NO_DOT });
        continue;
      }

      push({ type: 'qmark', value, output: QMARK });
      continue;
    }

    /**
     * Exclamation
     */

    if (value === '!') {
      if (opts.noextglob !== true && peek() === '(') {
        if (peek(2) !== '?' || !/[!=<:]/.test(peek(3))) {
          extglobOpen('negate', value);
          continue;
        }
      }

      if (opts.nonegate !== true && state.index === 0) {
        negate();
        continue;
      }
    }

    /**
     * Plus
     */

    if (value === '+') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('plus', value);
        continue;
      }

      if ((prev && prev.value === '(') || opts.regex === false) {
        push({ type: 'plus', value, output: PLUS_LITERAL });
        continue;
      }

      if ((prev && (prev.type === 'bracket' || prev.type === 'paren' || prev.type === 'brace')) || state.parens > 0) {
        push({ type: 'plus', value });
        continue;
      }

      push({ type: 'plus', value: PLUS_LITERAL });
      continue;
    }

    /**
     * Plain text
     */

    if (value === '@') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        push({ type: 'at', extglob: true, value, output: '' });
        continue;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Plain text
     */

    if (value !== '*') {
      if (value === '$' || value === '^') {
        value = `\\${value}`;
      }

      const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
      if (match) {
        value += match[0];
        state.index += match[0].length;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Stars
     */

    if (prev && (prev.type === 'globstar' || prev.star === true)) {
      prev.type = 'star';
      prev.star = true;
      prev.value += value;
      prev.output = star;
      state.backtrack = true;
      state.globstar = true;
      consume(value);
      continue;
    }

    let rest = remaining();
    if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
      extglobOpen('star', value);
      continue;
    }

    if (prev.type === 'star') {
      if (opts.noglobstar === true) {
        consume(value);
        continue;
      }

      const prior = prev.prev;
      const before = prior.prev;
      const isStart = prior.type === 'slash' || prior.type === 'bos';
      const afterStar = before && (before.type === 'star' || before.type === 'globstar');

      if (opts.bash === true && (!isStart || (rest[0] && rest[0] !== '/'))) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      const isBrace = state.braces > 0 && (prior.type === 'comma' || prior.type === 'brace');
      const isExtglob = extglobs.length && (prior.type === 'pipe' || prior.type === 'paren');
      if (!isStart && prior.type !== 'paren' && !isBrace && !isExtglob) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      // strip consecutive `/**/`
      while (rest.slice(0, 3) === '/**') {
        const after = input[state.index + 4];
        if (after && after !== '/') {
          break;
        }
        rest = rest.slice(3);
        consume('/**', 3);
      }

      if (prior.type === 'bos' && eos()) {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = globstar(opts);
        state.output = prev.output;
        state.globstar = true;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && !afterStar && eos()) {
        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = globstar(opts) + (opts.strictSlashes ? ')' : '|$)');
        prev.value += value;
        state.globstar = true;
        state.output += prior.output + prev.output;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && rest[0] === '/') {
        const end = rest[1] !== void 0 ? '|$' : '';

        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
        prev.value += value;

        state.output += prior.output + prev.output;
        state.globstar = true;

        consume(value + advance());

        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      if (prior.type === 'bos' && rest[0] === '/') {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
        state.output = prev.output;
        state.globstar = true;
        consume(value + advance());
        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      // remove single star from output
      state.output = state.output.slice(0, -prev.output.length);

      // reset previous token to globstar
      prev.type = 'globstar';
      prev.output = globstar(opts);
      prev.value += value;

      // reset output with globstar
      state.output += prev.output;
      state.globstar = true;
      consume(value);
      continue;
    }

    const token = { type: 'star', value, output: star };

    if (opts.bash === true) {
      token.output = '.*?';
      if (prev.type === 'bos' || prev.type === 'slash') {
        token.output = nodot + token.output;
      }
      push(token);
      continue;
    }

    if (prev && (prev.type === 'bracket' || prev.type === 'paren') && opts.regex === true) {
      token.output = value;
      push(token);
      continue;
    }

    if (state.index === state.start || prev.type === 'slash' || prev.type === 'dot') {
      if (prev.type === 'dot') {
        state.output += NO_DOT_SLASH;
        prev.output += NO_DOT_SLASH;

      } else if (opts.dot === true) {
        state.output += NO_DOTS_SLASH;
        prev.output += NO_DOTS_SLASH;

      } else {
        state.output += nodot;
        prev.output += nodot;
      }

      if (peek() !== '*') {
        state.output += ONE_CHAR;
        prev.output += ONE_CHAR;
      }
    }

    push(token);
  }

  while (state.brackets > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ']'));
    state.output = utils$1.escapeLast(state.output, '[');
    decrement('brackets');
  }

  while (state.parens > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ')'));
    state.output = utils$1.escapeLast(state.output, '(');
    decrement('parens');
  }

  while (state.braces > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', '}'));
    state.output = utils$1.escapeLast(state.output, '{');
    decrement('braces');
  }

  if (opts.strictSlashes !== true && (prev.type === 'star' || prev.type === 'bracket')) {
    push({ type: 'maybe_slash', value: '', output: `${SLASH_LITERAL}?` });
  }

  // rebuild the output if we had to backtrack at any point
  if (state.backtrack === true) {
    state.output = '';

    for (const token of state.tokens) {
      state.output += token.output != null ? token.output : token.value;

      if (token.suffix) {
        state.output += token.suffix;
      }
    }
  }

  return state;
};

/**
 * Fast paths for creating regular expressions for common glob patterns.
 * This can significantly speed up processing and has very little downside
 * impact when none of the fast paths match.
 */

parse$1.fastpaths = (input, options) => {
  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH$1, opts.maxLength) : MAX_LENGTH$1;
  const len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  input = REPLACEMENTS[input] || input;
  const win32 = utils$1.isWindows(options);

  // create constants based on platform, for windows or posix
  const {
    DOT_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOTS,
    NO_DOTS_SLASH,
    STAR,
    START_ANCHOR
  } = constants$1.globChars(win32);

  const nodot = opts.dot ? NO_DOTS : NO_DOT;
  const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
  const capture = opts.capture ? '' : '?:';
  const state = { negated: false, prefix: '' };
  let star = opts.bash === true ? '.*?' : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  const globstar = (opts) => {
    if (opts.noglobstar === true) return star;
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const create = str => {
    switch (str) {
      case '*':
        return `${nodot}${ONE_CHAR}${star}`;

      case '.*':
        return `${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*.*':
        return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*/*':
        return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;

      case '**':
        return nodot + globstar(opts);

      case '**/*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;

      case '**/*.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '**/.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;

      default: {
        const match = /^(.*?)\.(\w+)$/.exec(str);
        if (!match) return;

        const source = create(match[1]);
        if (!source) return;

        return source + DOT_LITERAL + match[2];
      }
    }
  };

  const output = utils$1.removePrefix(input, state);
  let source = create(output);

  if (source && opts.strictSlashes !== true) {
    source += `${SLASH_LITERAL}?`;
  }

  return source;
};

var parse_1$1 = parse$1;

const isObject$1 = val => val && typeof val === 'object' && !Array.isArray(val);

/**
 * Creates a matcher function from one or more glob patterns. The
 * returned function takes a string to match as its first argument,
 * and returns true if the string is a match. The returned matcher
 * function also takes a boolean as the second argument that, when true,
 * returns an object with additional information.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch(glob[, options]);
 *
 * const isMatch = picomatch('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @name picomatch
 * @param {String|Array} `globs` One or more glob patterns.
 * @param {Object=} `options`
 * @return {Function=} Returns a matcher function.
 * @api public
 */

const picomatch = (glob, options, returnState = false) => {
  if (Array.isArray(glob)) {
    const fns = glob.map(input => picomatch(input, options, returnState));
    const arrayMatcher = str => {
      for (const isMatch of fns) {
        const state = isMatch(str);
        if (state) return state;
      }
      return false;
    };
    return arrayMatcher;
  }

  const isState = isObject$1(glob) && glob.tokens && glob.input;

  if (glob === '' || (typeof glob !== 'string' && !isState)) {
    throw new TypeError('Expected pattern to be a non-empty string');
  }

  const opts = options || {};
  const posix = utils$1.isWindows(options);
  const regex = isState
    ? picomatch.compileRe(glob, options)
    : picomatch.makeRe(glob, options, false, true);

  const state = regex.state;
  delete regex.state;

  let isIgnored = () => false;
  if (opts.ignore) {
    const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
    isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
  }

  const matcher = (input, returnObject = false) => {
    const { isMatch, match, output } = picomatch.test(input, regex, options, { glob, posix });
    const result = { glob, state, regex, posix, input, output, match, isMatch };

    if (typeof opts.onResult === 'function') {
      opts.onResult(result);
    }

    if (isMatch === false) {
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (isIgnored(input)) {
      if (typeof opts.onIgnore === 'function') {
        opts.onIgnore(result);
      }
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (typeof opts.onMatch === 'function') {
      opts.onMatch(result);
    }
    return returnObject ? result : true;
  };

  if (returnState) {
    matcher.state = state;
  }

  return matcher;
};

/**
 * Test `input` with the given `regex`. This is used by the main
 * `picomatch()` function to test the input string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.test(input, regex[, options]);
 *
 * console.log(picomatch.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
 * // { isMatch: true, match: [ 'foo/', 'foo', 'bar' ], output: 'foo/bar' }
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp} `regex`
 * @return {Object} Returns an object with matching info.
 * @api public
 */

picomatch.test = (input, regex, options, { glob, posix } = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  if (input === '') {
    return { isMatch: false, output: '' };
  }

  const opts = options || {};
  const format = opts.format || (posix ? utils$1.toPosixSlashes : null);
  let match = input === glob;
  let output = (match && format) ? format(input) : input;

  if (match === false) {
    output = format ? format(input) : input;
    match = output === glob;
  }

  if (match === false || opts.capture === true) {
    if (opts.matchBase === true || opts.basename === true) {
      match = picomatch.matchBase(input, regex, options, posix);
    } else {
      match = regex.exec(output);
    }
  }

  return { isMatch: Boolean(match), match, output };
};

/**
 * Match the basename of a filepath.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.matchBase(input, glob[, options]);
 * console.log(picomatch.matchBase('foo/bar.js', '*.js'); // true
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp|String} `glob` Glob pattern or regex created by [.makeRe](#makeRe).
 * @return {Boolean}
 * @api public
 */

picomatch.matchBase = (input, glob, options, posix = utils$1.isWindows(options)) => {
  const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
  return regex.test(path$3.basename(input));
};

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.isMatch(string, patterns[, options]);
 *
 * console.log(picomatch.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(picomatch.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String|Array} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const result = picomatch.parse(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as a regex source string.
 * @api public
 */

picomatch.parse = (pattern, options) => {
  if (Array.isArray(pattern)) return pattern.map(p => picomatch.parse(p, options));
  return parse_1$1(pattern, { ...options, fastpaths: false });
};

/**
 * Scan a glob pattern to separate the pattern into segments.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.scan(input[, options]);
 *
 * const result = picomatch.scan('!./foo/*.js');
 * console.log(result);
 * { prefix: '!./',
 *   input: '!./foo/*.js',
 *   start: 3,
 *   base: 'foo',
 *   glob: '*.js',
 *   isBrace: false,
 *   isBracket: false,
 *   isGlob: true,
 *   isExtglob: false,
 *   isGlobstar: false,
 *   negated: true }
 * ```
 * @param {String} `input` Glob pattern to scan.
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

picomatch.scan = (input, options) => scan_1(input, options);

/**
 * Create a regular expression from a parsed glob pattern.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const state = picomatch.parse('*.js');
 * // picomatch.compileRe(state[, options]);
 *
 * console.log(picomatch.compileRe(state));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `state` The object returned from the `.parse` method.
 * @param {Object} `options`
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

picomatch.compileRe = (parsed, options, returnOutput = false, returnState = false) => {
  if (returnOutput === true) {
    return parsed.output;
  }

  const opts = options || {};
  const prepend = opts.contains ? '' : '^';
  const append = opts.contains ? '' : '$';

  let source = `${prepend}(?:${parsed.output})${append}`;
  if (parsed && parsed.negated === true) {
    source = `^(?!${source}).*$`;
  }

  const regex = picomatch.toRegex(source, options);
  if (returnState === true) {
    regex.state = parsed;
  }

  return regex;
};

picomatch.makeRe = (input, options, returnOutput = false, returnState = false) => {
  if (!input || typeof input !== 'string') {
    throw new TypeError('Expected a non-empty string');
  }

  const opts = options || {};
  let parsed = { negated: false, fastpaths: true };
  let prefix = '';
  let output;

  if (input.startsWith('./')) {
    input = input.slice(2);
    prefix = parsed.prefix = './';
  }

  if (opts.fastpaths !== false && (input[0] === '.' || input[0] === '*')) {
    output = parse_1$1.fastpaths(input, options);
  }

  if (output === undefined) {
    parsed = parse_1$1(input, options);
    parsed.prefix = prefix + (parsed.prefix || '');
  } else {
    parsed.output = output;
  }

  return picomatch.compileRe(parsed, options, returnOutput, returnState);
};

/**
 * Create a regular expression from the given regex source string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.toRegex(source[, options]);
 *
 * const { output } = picomatch.parse('*.js');
 * console.log(picomatch.toRegex(output));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `source` Regular expression source string.
 * @param {Object} `options`
 * @return {RegExp}
 * @api public
 */

picomatch.toRegex = (source, options) => {
  try {
    const opts = options || {};
    return new RegExp(source, opts.flags || (opts.nocase ? 'i' : ''));
  } catch (err) {
    if (options && options.debug === true) throw err;
    return /$^/;
  }
};

/**
 * Picomatch constants.
 * @return {Object}
 */

picomatch.constants = constants$1;

/**
 * Expose "picomatch"
 */

var picomatch_1 = picomatch;

var picomatch$1 = picomatch_1;

const isEmptyString = val => typeof val === 'string' && (val === '' || val === './');

/**
 * Returns an array of strings that match one or more glob patterns.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm(list, patterns[, options]);
 *
 * console.log(mm(['a.js', 'a.txt'], ['*.js']));
 * //=> [ 'a.js' ]
 * ```
 * @param {String|Array<string>} list List of strings to match.
 * @param {String|Array<string>} patterns One or more glob patterns to use for matching.
 * @param {Object} options See available [options](#options)
 * @return {Array} Returns an array of matches
 * @summary false
 * @api public
 */

const micromatch = (list, patterns, options) => {
  patterns = [].concat(patterns);
  list = [].concat(list);

  let omit = new Set();
  let keep = new Set();
  let items = new Set();
  let negatives = 0;

  let onResult = state => {
    items.add(state.output);
    if (options && options.onResult) {
      options.onResult(state);
    }
  };

  for (let i = 0; i < patterns.length; i++) {
    let isMatch = picomatch$1(String(patterns[i]), { ...options, onResult }, true);
    let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
    if (negated) negatives++;

    for (let item of list) {
      let matched = isMatch(item, true);

      let match = negated ? !matched.isMatch : matched.isMatch;
      if (!match) continue;

      if (negated) {
        omit.add(matched.output);
      } else {
        omit.delete(matched.output);
        keep.add(matched.output);
      }
    }
  }

  let result = negatives === patterns.length ? [...items] : [...keep];
  let matches = result.filter(item => !omit.has(item));

  if (options && matches.length === 0) {
    if (options.failglob === true) {
      throw new Error(`No matches found for "${patterns.join(', ')}"`);
    }

    if (options.nonull === true || options.nullglob === true) {
      return options.unescape ? patterns.map(p => p.replace(/\\/g, '')) : patterns;
    }
  }

  return matches;
};

/**
 * Backwards compatibility
 */

micromatch.match = micromatch;

/**
 * Returns a matcher function from the given glob `pattern` and `options`.
 * The returned function takes a string to match as its only argument and returns
 * true if the string is a match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matcher(pattern[, options]);
 *
 * const isMatch = mm.matcher('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Function} Returns a matcher function.
 * @api public
 */

micromatch.matcher = (pattern, options) => picomatch$1(pattern, options);

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.isMatch(string, patterns[, options]);
 *
 * console.log(mm.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(mm.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch.isMatch = (str, patterns, options) => picomatch$1(patterns, options)(str);

/**
 * Backwards compatibility
 */

micromatch.any = micromatch.isMatch;

/**
 * Returns a list of strings that _**do not match any**_ of the given `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.not(list, patterns[, options]);
 *
 * console.log(mm.not(['a.a', 'b.b', 'c.c'], '*.a'));
 * //=> ['b.b', 'c.c']
 * ```
 * @param {Array} `list` Array of strings to match.
 * @param {String|Array} `patterns` One or more glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Array} Returns an array of strings that **do not match** the given patterns.
 * @api public
 */

micromatch.not = (list, patterns, options = {}) => {
  patterns = [].concat(patterns).map(String);
  let result = new Set();
  let items = [];

  let onResult = state => {
    if (options.onResult) options.onResult(state);
    items.push(state.output);
  };

  let matches = micromatch(list, patterns, { ...options, onResult });

  for (let item of items) {
    if (!matches.includes(item)) {
      result.add(item);
    }
  }
  return [...result];
};

/**
 * Returns true if the given `string` contains the given pattern. Similar
 * to [.isMatch](#isMatch) but the pattern can match any part of the string.
 *
 * ```js
 * var mm = require('micromatch');
 * // mm.contains(string, pattern[, options]);
 *
 * console.log(mm.contains('aa/bb/cc', '*b'));
 * //=> true
 * console.log(mm.contains('aa/bb/cc', '*d'));
 * //=> false
 * ```
 * @param {String} `str` The string to match.
 * @param {String|Array} `patterns` Glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if the patter matches any part of `str`.
 * @api public
 */

micromatch.contains = (str, pattern, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util$2.inspect(str)}"`);
  }

  if (Array.isArray(pattern)) {
    return pattern.some(p => micromatch.contains(str, p, options));
  }

  if (typeof pattern === 'string') {
    if (isEmptyString(str) || isEmptyString(pattern)) {
      return false;
    }

    if (str.includes(pattern) || (str.startsWith('./') && str.slice(2).includes(pattern))) {
      return true;
    }
  }

  return micromatch.isMatch(str, pattern, { ...options, contains: true });
};

/**
 * Filter the keys of the given object with the given `glob` pattern
 * and `options`. Does not attempt to match nested keys. If you need this feature,
 * use [glob-object][] instead.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matchKeys(object, patterns[, options]);
 *
 * const obj = { aa: 'a', ab: 'b', ac: 'c' };
 * console.log(mm.matchKeys(obj, '*b'));
 * //=> { ab: 'b' }
 * ```
 * @param {Object} `object` The object with keys to filter.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Object} Returns an object with only keys that match the given patterns.
 * @api public
 */

micromatch.matchKeys = (obj, patterns, options) => {
  if (!utils$1.isObject(obj)) {
    throw new TypeError('Expected the first argument to be an object');
  }
  let keys = micromatch(Object.keys(obj), patterns, options);
  let res = {};
  for (let key of keys) res[key] = obj[key];
  return res;
};

/**
 * Returns true if some of the strings in the given `list` match any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.some(list, patterns[, options]);
 *
 * console.log(mm.some(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // true
 * console.log(mm.some(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test. Returns as soon as the first match is found.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch.some = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch$1(String(pattern), options);
    if (items.some(item => isMatch(item))) {
      return true;
    }
  }
  return false;
};

/**
 * Returns true if every string in the given `list` matches
 * any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.every(list, patterns[, options]);
 *
 * console.log(mm.every('foo.js', ['foo.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // false
 * console.log(mm.every(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch.every = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch$1(String(pattern), options);
    if (!items.every(item => isMatch(item))) {
      return false;
    }
  }
  return true;
};

/**
 * Returns true if **all** of the given `patterns` match
 * the specified string.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.all(string, patterns[, options]);
 *
 * console.log(mm.all('foo.js', ['foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', '!foo.js']));
 * // false
 *
 * console.log(mm.all('foo.js', ['*.js', 'foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', 'f*', '*o*', '*o.js']));
 * // true
 * ```
 * @param {String|Array} `str` The string to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch.all = (str, patterns, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util$2.inspect(str)}"`);
  }

  return [].concat(patterns).every(p => picomatch$1(p, options)(str));
};

/**
 * Returns an array of matches captured by `pattern` in `string, or `null` if the pattern did not match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.capture(pattern, string[, options]);
 *
 * console.log(mm.capture('test/*.js', 'test/foo.js'));
 * //=> ['foo']
 * console.log(mm.capture('test/*.js', 'foo/bar.css'));
 * //=> null
 * ```
 * @param {String} `glob` Glob pattern to use for matching.
 * @param {String} `input` String to match
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns an array of captures if the input matches the glob pattern, otherwise `null`.
 * @api public
 */

micromatch.capture = (glob, input, options) => {
  let posix = utils$1.isWindows(options);
  let regex = picomatch$1.makeRe(String(glob), { ...options, capture: true });
  let match = regex.exec(posix ? utils$1.toPosixSlashes(input) : input);

  if (match) {
    return match.slice(1).map(v => v === void 0 ? '' : v);
  }
};

/**
 * Create a regular expression from the given glob `pattern`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.makeRe(pattern[, options]);
 *
 * console.log(mm.makeRe('*.js'));
 * //=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
 * ```
 * @param {String} `pattern` A glob pattern to convert to regex.
 * @param {Object} `options`
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

micromatch.makeRe = (...args) => picomatch$1.makeRe(...args);

/**
 * Scan a glob pattern to separate the pattern into segments. Used
 * by the [split](#split) method.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm.scan(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

micromatch.scan = (...args) => picomatch$1.scan(...args);

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm(pattern[, options]);
 * ```
 * @param {String} `glob`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as regex source string.
 * @api public
 */

micromatch.parse = (patterns, options) => {
  let res = [];
  for (let pattern of [].concat(patterns || [])) {
    for (let str of braces_1(String(pattern), options)) {
      res.push(picomatch$1.parse(str, options));
    }
  }
  return res;
};

/**
 * Process the given brace `pattern`.
 *
 * ```js
 * const { braces } = require('micromatch');
 * console.log(braces('foo/{a,b,c}/bar'));
 * //=> [ 'foo/(a|b|c)/bar' ]
 *
 * console.log(braces('foo/{a,b,c}/bar', { expand: true }));
 * //=> [ 'foo/a/bar', 'foo/b/bar', 'foo/c/bar' ]
 * ```
 * @param {String} `pattern` String with brace pattern to process.
 * @param {Object} `options` Any [options](#options) to change how expansion is performed. See the [braces][] library for all available options.
 * @return {Array}
 * @api public
 */

micromatch.braces = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');
  if ((options && options.nobrace === true) || !/\{.*\}/.test(pattern)) {
    return [pattern];
  }
  return braces_1(pattern, options);
};

/**
 * Expand braces
 */

micromatch.braceExpand = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');
  return micromatch.braces(pattern, { ...options, expand: true });
};

/**
 * Expose micromatch
 */

var micromatch_1 = micromatch;

var globsToMatcher_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = globsToMatcher;

function _micromatch() {
  const data = _interopRequireDefault(micromatch_1);

  _micromatch = function () {
    return data;
  };

  return data;
}

var _replacePathSepForGlob = _interopRequireDefault(
  replacePathSepForGlob_1
);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const globsToMatchersMap = new Map();
const micromatchOptions = {
  dot: true
};
/**
 * Converts a list of globs into a function that matches a path against the
 * globs.
 *
 * Every time micromatch is called, it will parse the glob strings and turn
 * them into regexp instances. Instead of calling micromatch repeatedly with
 * the same globs, we can use this function which will build the micromatch
 * matchers ahead of time and then have an optimized path for determining
 * whether an individual path matches.
 *
 * This function is intended to match the behavior of `micromatch()`.
 *
 * @example
 * const isMatch = globsToMatcher(['*.js', '!*.test.js']);
 * isMatch('pizza.js'); // true
 * isMatch('pizza.test.js'); // false
 */

function globsToMatcher(globs) {
  if (globs.length === 0) {
    // Since there were no globs given, we can simply have a fast path here and
    // return with a very simple function.
    return _ => false;
  }

  const matchers = globs.map(glob => {
    if (!globsToMatchersMap.has(glob)) {
      // Matchers that are negated have different behavior than matchers that
      // are not negated, so we need to store this information ahead of time.
      const {negated} = _micromatch().default.scan(glob, micromatchOptions);

      const matcher = {
        isMatch: _micromatch().default.matcher(glob, micromatchOptions),
        negated
      };
      globsToMatchersMap.set(glob, matcher);
    }

    return globsToMatchersMap.get(glob);
  });
  return path => {
    const replacedPath = (0, _replacePathSepForGlob.default)(path);
    let kept = undefined;
    let negatives = 0;

    for (let i = 0; i < matchers.length; i++) {
      const {isMatch, negated} = matchers[i];

      if (negated) {
        negatives++;
      }

      const matched = isMatch(replacedPath);

      if (!matched && negated) {
        // The path was not matched, and the matcher is a negated matcher, so we
        // want to omit the path. This means that the negative matcher is
        // filtering the path out.
        kept = false;
      } else if (matched && !negated) {
        // The path was matched, and the matcher is not a negated matcher, so we
        // want to keep the path.
        kept = true;
      }
    } // If all of the globs were negative globs, then we want to include the path
    // as long as it was not explicitly not kept. Otherwise only include
    // the path if it was kept. This allows sets of globs that are all negated
    // to allow some paths to be matched, while sets of globs that are mixed
    // negated and non-negated to cause the negated matchers to only omit paths
    // and not keep them.

    return negatives === matchers.length ? kept !== false : !!kept;
  };
}
});

var colorName = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};

/* MIT license */
/* eslint-disable no-mixed-operators */


// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

const reverseKeywords = {};
for (const key of Object.keys(colorName)) {
	reverseKeywords[colorName[key]] = key;
}

const convert = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

var conversions = convert;

// Hide .channels and .labels properties
for (const model of Object.keys(convert)) {
	if (!('channels' in convert[model])) {
		throw new Error('missing channels property: ' + model);
	}

	if (!('labels' in convert[model])) {
		throw new Error('missing channel labels property: ' + model);
	}

	if (convert[model].labels.length !== convert[model].channels) {
		throw new Error('channel and label counts mismatch: ' + model);
	}

	const {channels, labels} = convert[model];
	delete convert[model].channels;
	delete convert[model].labels;
	Object.defineProperty(convert[model], 'channels', {value: channels});
	Object.defineProperty(convert[model], 'labels', {value: labels});
}

convert.rgb.hsl = function (rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const min = Math.min(r, g, b);
	const max = Math.max(r, g, b);
	const delta = max - min;
	let h;
	let s;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	const l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	let rdif;
	let gdif;
	let bdif;
	let h;
	let s;

	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const v = Math.max(r, g, b);
	const diff = v - Math.min(r, g, b);
	const diffc = function (c) {
		return (v - c) / 6 / diff + 1 / 2;
	};

	if (diff === 0) {
		h = 0;
		s = 0;
	} else {
		s = diff / v;
		rdif = diffc(r);
		gdif = diffc(g);
		bdif = diffc(b);

		if (r === v) {
			h = bdif - gdif;
		} else if (g === v) {
			h = (1 / 3) + rdif - bdif;
		} else if (b === v) {
			h = (2 / 3) + gdif - rdif;
		}

		if (h < 0) {
			h += 1;
		} else if (h > 1) {
			h -= 1;
		}
	}

	return [
		h * 360,
		s * 100,
		v * 100
	];
};

convert.rgb.hwb = function (rgb) {
	const r = rgb[0];
	const g = rgb[1];
	let b = rgb[2];
	const h = convert.rgb.hsl(rgb)[0];
	const w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;

	const k = Math.min(1 - r, 1 - g, 1 - b);
	const c = (1 - r - k) / (1 - k) || 0;
	const m = (1 - g - k) / (1 - k) || 0;
	const y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

function comparativeDistance(x, y) {
	/*
		See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
	*/
	return (
		((x[0] - y[0]) ** 2) +
		((x[1] - y[1]) ** 2) +
		((x[2] - y[2]) ** 2)
	);
}

convert.rgb.keyword = function (rgb) {
	const reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	let currentClosestDistance = Infinity;
	let currentClosestKeyword;

	for (const keyword of Object.keys(colorName)) {
		const value = colorName[keyword];

		// Compute comparative distance
		const distance = comparativeDistance(rgb, value);

		// Check if its less, if so set as closest
		if (distance < currentClosestDistance) {
			currentClosestDistance = distance;
			currentClosestKeyword = keyword;
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return colorName[keyword];
};

convert.rgb.xyz = function (rgb) {
	let r = rgb[0] / 255;
	let g = rgb[1] / 255;
	let b = rgb[2] / 255;

	// Assume sRGB
	r = r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92);
	g = g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92);
	b = b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92);

	const x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	const y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	const z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	const xyz = convert.rgb.xyz(rgb);
	let x = xyz[0];
	let y = xyz[1];
	let z = xyz[2];

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

	const l = (116 * y) - 16;
	const a = 500 * (x - y);
	const b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	const h = hsl[0] / 360;
	const s = hsl[1] / 100;
	const l = hsl[2] / 100;
	let t2;
	let t3;
	let val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	const t1 = 2 * l - t2;

	const rgb = [0, 0, 0];
	for (let i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}

		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	const h = hsl[0];
	let s = hsl[1] / 100;
	let l = hsl[2] / 100;
	let smin = s;
	const lmin = Math.max(l, 0.01);

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	const v = (l + s) / 2;
	const sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	const h = hsv[0] / 60;
	const s = hsv[1] / 100;
	let v = hsv[2] / 100;
	const hi = Math.floor(h) % 6;

	const f = h - Math.floor(h);
	const p = 255 * v * (1 - s);
	const q = 255 * v * (1 - (s * f));
	const t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	const h = hsv[0];
	const s = hsv[1] / 100;
	const v = hsv[2] / 100;
	const vmin = Math.max(v, 0.01);
	let sl;
	let l;

	l = (2 - s) * v;
	const lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	const h = hwb[0] / 360;
	let wh = hwb[1] / 100;
	let bl = hwb[2] / 100;
	const ratio = wh + bl;
	let f;

	// Wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	const i = Math.floor(6 * h);
	const v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	const n = wh + f * (v - wh); // Linear interpolation

	let r;
	let g;
	let b;
	/* eslint-disable max-statements-per-line,no-multi-spaces */
	switch (i) {
		default:
		case 6:
		case 0: r = v;  g = n;  b = wh; break;
		case 1: r = n;  g = v;  b = wh; break;
		case 2: r = wh; g = v;  b = n; break;
		case 3: r = wh; g = n;  b = v; break;
		case 4: r = n;  g = wh; b = v; break;
		case 5: r = v;  g = wh; b = n; break;
	}
	/* eslint-enable max-statements-per-line,no-multi-spaces */

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	const c = cmyk[0] / 100;
	const m = cmyk[1] / 100;
	const y = cmyk[2] / 100;
	const k = cmyk[3] / 100;

	const r = 1 - Math.min(1, c * (1 - k) + k);
	const g = 1 - Math.min(1, m * (1 - k) + k);
	const b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	const x = xyz[0] / 100;
	const y = xyz[1] / 100;
	const z = xyz[2] / 100;
	let r;
	let g;
	let b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// Assume sRGB
	r = r > 0.0031308
		? ((1.055 * (r ** (1.0 / 2.4))) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * (g ** (1.0 / 2.4))) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * (b ** (1.0 / 2.4))) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	let x = xyz[0];
	let y = xyz[1];
	let z = xyz[2];

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

	const l = (116 * y) - 16;
	const a = 500 * (x - y);
	const b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	const l = lab[0];
	const a = lab[1];
	const b = lab[2];
	let x;
	let y;
	let z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	const y2 = y ** 3;
	const x2 = x ** 3;
	const z2 = z ** 3;
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	const l = lab[0];
	const a = lab[1];
	const b = lab[2];
	let h;

	const hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	const c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	const l = lch[0];
	const c = lch[1];
	const h = lch[2];

	const hr = h / 360 * 2 * Math.PI;
	const a = c * Math.cos(hr);
	const b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args, saturation = null) {
	const [r, g, b] = args;
	let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation; // Hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	let ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// Optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	const r = args[0];
	const g = args[1];
	const b = args[2];

	// We use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	const ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	let color = args % 10;

	// Handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	const mult = (~~(args > 50) + 1) * 0.5;
	const r = ((color & 1) * mult) * 255;
	const g = (((color >> 1) & 1) * mult) * 255;
	const b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// Handle greyscale
	if (args >= 232) {
		const c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	let rem;
	const r = Math.floor(args / 36) / 5 * 255;
	const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	const b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	const integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	const string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	let colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(char => {
			return char + char;
		}).join('');
	}

	const integer = parseInt(colorString, 16);
	const r = (integer >> 16) & 0xFF;
	const g = (integer >> 8) & 0xFF;
	const b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const max = Math.max(Math.max(r, g), b);
	const min = Math.min(Math.min(r, g), b);
	const chroma = (max - min);
	let grayscale;
	let hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	const s = hsl[1] / 100;
	const l = hsl[2] / 100;

	const c = l < 0.5 ? (2.0 * s * l) : (2.0 * s * (1.0 - l));

	let f = 0;
	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	const s = hsv[1] / 100;
	const v = hsv[2] / 100;

	const c = s * v;
	let f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	const h = hcg[0] / 360;
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	const pure = [0, 0, 0];
	const hi = (h % 1) * 6;
	const v = hi % 1;
	const w = 1 - v;
	let mg = 0;

	/* eslint-disable max-statements-per-line */
	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}
	/* eslint-enable max-statements-per-line */

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;

	const v = c + g * (1.0 - c);
	let f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;

	const l = g * (1.0 - c) + 0.5 * c;
	let s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	const c = hcg[1] / 100;
	const g = hcg[2] / 100;
	const v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	const w = hwb[1] / 100;
	const b = hwb[2] / 100;
	const v = 1 - b;
	const c = v - w;
	let g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hsv = convert.gray.hsl;

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	const val = Math.round(gray[0] / 100 * 255) & 0xFF;
	const integer = (val << 16) + (val << 8) + val;

	const string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};

/*
	This function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph() {
	const graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	const models = Object.keys(conversions);

	for (let len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS(fromModel) {
	const graph = buildGraph();
	const queue = [fromModel]; // Unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		const current = queue.pop();
		const adjacents = Object.keys(conversions[current]);

		for (let len = adjacents.length, i = 0; i < len; i++) {
			const adjacent = adjacents[i];
			const node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion(toModel, graph) {
	const path = [graph[toModel].parent, toModel];
	let fn = conversions[graph[toModel].parent][toModel];

	let cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link(conversions[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

var route = function (fromModel) {
	const graph = deriveBFS(fromModel);
	const conversion = {};

	const models = Object.keys(graph);
	for (let len = models.length, i = 0; i < len; i++) {
		const toModel = models[i];
		const node = graph[toModel];

		if (node.parent === null) {
			// No possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion(toModel, graph);
	}

	return conversion;
};

const convert$1 = {};

const models = Object.keys(conversions);

function wrapRaw(fn) {
	const wrappedFn = function (...args) {
		const arg0 = args[0];
		if (arg0 === undefined || arg0 === null) {
			return arg0;
		}

		if (arg0.length > 1) {
			args = arg0;
		}

		return fn(args);
	};

	// Preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded(fn) {
	const wrappedFn = function (...args) {
		const arg0 = args[0];

		if (arg0 === undefined || arg0 === null) {
			return arg0;
		}

		if (arg0.length > 1) {
			args = arg0;
		}

		const result = fn(args);

		// We're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (let len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// Preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models.forEach(fromModel => {
	convert$1[fromModel] = {};

	Object.defineProperty(convert$1[fromModel], 'channels', {value: conversions[fromModel].channels});
	Object.defineProperty(convert$1[fromModel], 'labels', {value: conversions[fromModel].labels});

	const routes = route(fromModel);
	const routeModels = Object.keys(routes);

	routeModels.forEach(toModel => {
		const fn = routes[toModel];

		convert$1[fromModel][toModel] = wrapRounded(fn);
		convert$1[fromModel][toModel].raw = wrapRaw(fn);
	});
});

var colorConvert = convert$1;

var ansiStyles = createCommonjsModule(function (module) {

const wrapAnsi16 = (fn, offset) => (...args) => {
	const code = fn(...args);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => (...args) => {
	const code = fn(...args);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => (...args) => {
	const rgb = fn(...args);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

const ansi2ansi = n => n;
const rgb2rgb = (r, g, b) => [r, g, b];

const setLazyProperty = (object, property, get) => {
	Object.defineProperty(object, property, {
		get: () => {
			const value = get();

			Object.defineProperty(object, property, {
				value,
				enumerable: true,
				configurable: true
			});

			return value;
		},
		enumerable: true,
		configurable: true
	});
};

/** @type {typeof import('color-convert')} */
let colorConvert$1;
const makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
	if (colorConvert$1 === undefined) {
		colorConvert$1 = colorConvert;
	}

	const offset = isBackground ? 10 : 0;
	const styles = {};

	for (const [sourceSpace, suite] of Object.entries(colorConvert$1)) {
		const name = sourceSpace === 'ansi16' ? 'ansi' : sourceSpace;
		if (sourceSpace === targetSpace) {
			styles[name] = wrap(identity, offset);
		} else if (typeof suite === 'object') {
			styles[name] = wrap(suite[targetSpace], offset);
		}
	}

	return styles;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],

			// Bright color
			blackBright: [90, 39],
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Alias bright black as gray (and grey)
	styles.color.gray = styles.color.blackBright;
	styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
	styles.color.grey = styles.color.blackBright;
	styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;

	for (const [groupName, group] of Object.entries(styles)) {
		for (const [styleName, style] of Object.entries(group)) {
			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	}

	Object.defineProperty(styles, 'codes', {
		value: codes,
		enumerable: false
	});

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	setLazyProperty(styles.color, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, false));
	setLazyProperty(styles.color, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, false));
	setLazyProperty(styles.color, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, false));
	setLazyProperty(styles.bgColor, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, true));
	setLazyProperty(styles.bgColor, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, true));
	setLazyProperty(styles.bgColor, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, true));

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});
});

var hasFlag = (flag, argv = process.argv) => {
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf('--');
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};

const {env} = process;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false') ||
	hasFlag('color=never')) {
	forceColor = 0;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = 1;
}

if ('FORCE_COLOR' in env) {
	if (env.FORCE_COLOR === 'true') {
		forceColor = 1;
	} else if (env.FORCE_COLOR === 'false') {
		forceColor = 0;
	} else {
		forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(haveStream, streamIsTTY) {
	if (forceColor === 0) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (haveStream && !streamIsTTY && forceColor === undefined) {
		return 0;
	}

	const min = forceColor || 0;

	if (env.TERM === 'dumb') {
		return min;
	}

	if (process.platform === 'win32') {
		// Windows 10 build 10586 is the first Windows release that supports 256 colors.
		// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
		const osRelease = os$1.release().split('.');
		if (
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if ('GITHUB_ACTIONS' in env) {
		return 1;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream, stream && stream.isTTY);
	return translateLevel(level);
}

var supportsColor_1 = {
	supportsColor: getSupportLevel,
	stdout: translateLevel(supportsColor(true, tty$1.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty$1.isatty(2)))
};

const stringReplaceAll = (string, substring, replacer) => {
	let index = string.indexOf(substring);
	if (index === -1) {
		return string;
	}

	const substringLength = substring.length;
	let endIndex = 0;
	let returnValue = '';
	do {
		returnValue += string.substr(endIndex, index - endIndex) + substring + replacer;
		endIndex = index + substringLength;
		index = string.indexOf(substring, endIndex);
	} while (index !== -1);

	returnValue += string.substr(endIndex);
	return returnValue;
};

const stringEncaseCRLFWithFirstIndex = (string, prefix, postfix, index) => {
	let endIndex = 0;
	let returnValue = '';
	do {
		const gotCR = string[index - 1] === '\r';
		returnValue += string.substr(endIndex, (gotCR ? index - 1 : index) - endIndex) + prefix + (gotCR ? '\r\n' : '\n') + postfix;
		endIndex = index + 1;
		index = string.indexOf('\n', endIndex);
	} while (index !== -1);

	returnValue += string.substr(endIndex);
	return returnValue;
};

var util = {
	stringReplaceAll,
	stringEncaseCRLFWithFirstIndex
};

const TEMPLATE_REGEX = /(?:\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u(?:[a-f\d]{4}|{[a-f\d]{1,6}})|x[a-f\d]{2}|.)|([^\\])/gi;

const ESCAPES = new Map([
	['n', '\n'],
	['r', '\r'],
	['t', '\t'],
	['b', '\b'],
	['f', '\f'],
	['v', '\v'],
	['0', '\0'],
	['\\', '\\'],
	['e', '\u001B'],
	['a', '\u0007']
]);

function unescape(c) {
	const u = c[0] === 'u';
	const bracket = c[1] === '{';

	if ((u && !bracket && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
		return String.fromCharCode(parseInt(c.slice(1), 16));
	}

	if (u && bracket) {
		return String.fromCodePoint(parseInt(c.slice(2, -1), 16));
	}

	return ESCAPES.get(c) || c;
}

function parseArguments(name, arguments_) {
	const results = [];
	const chunks = arguments_.trim().split(/\s*,\s*/g);
	let matches;

	for (const chunk of chunks) {
		const number = Number(chunk);
		if (!Number.isNaN(number)) {
			results.push(number);
		} else if ((matches = chunk.match(STRING_REGEX))) {
			results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, character) => escape ? unescape(escape) : character));
		} else {
			throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
		}
	}

	return results;
}

function parseStyle(style) {
	STYLE_REGEX.lastIndex = 0;

	const results = [];
	let matches;

	while ((matches = STYLE_REGEX.exec(style)) !== null) {
		const name = matches[1];

		if (matches[2]) {
			const args = parseArguments(name, matches[2]);
			results.push([name].concat(args));
		} else {
			results.push([name]);
		}
	}

	return results;
}

function buildStyle(chalk, styles) {
	const enabled = {};

	for (const layer of styles) {
		for (const style of layer.styles) {
			enabled[style[0]] = layer.inverse ? null : style.slice(1);
		}
	}

	let current = chalk;
	for (const [styleName, styles] of Object.entries(enabled)) {
		if (!Array.isArray(styles)) {
			continue;
		}

		if (!(styleName in current)) {
			throw new Error(`Unknown Chalk style: ${styleName}`);
		}

		current = styles.length > 0 ? current[styleName](...styles) : current[styleName];
	}

	return current;
}

var templates = (chalk, temporary) => {
	const styles = [];
	const chunks = [];
	let chunk = [];

	// eslint-disable-next-line max-params
	temporary.replace(TEMPLATE_REGEX, (m, escapeCharacter, inverse, style, close, character) => {
		if (escapeCharacter) {
			chunk.push(unescape(escapeCharacter));
		} else if (style) {
			const string = chunk.join('');
			chunk = [];
			chunks.push(styles.length === 0 ? string : buildStyle(chalk, styles)(string));
			styles.push({inverse, styles: parseStyle(style)});
		} else if (close) {
			if (styles.length === 0) {
				throw new Error('Found extraneous } in Chalk template literal');
			}

			chunks.push(buildStyle(chalk, styles)(chunk.join('')));
			chunk = [];
			styles.pop();
		} else {
			chunk.push(character);
		}
	});

	chunks.push(chunk.join(''));

	if (styles.length > 0) {
		const errMessage = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
		throw new Error(errMessage);
	}

	return chunks.join('');
};

const {stdout: stdoutColor, stderr: stderrColor} = supportsColor_1;
const {
	stringReplaceAll: stringReplaceAll$1,
	stringEncaseCRLFWithFirstIndex: stringEncaseCRLFWithFirstIndex$1
} = util;

const {isArray} = Array;

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = [
	'ansi',
	'ansi',
	'ansi256',
	'ansi16m'
];

const styles = Object.create(null);

const applyOptions = (object, options = {}) => {
	if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
		throw new Error('The `level` option should be an integer from 0 to 3');
	}

	// Detect level if not set manually
	const colorLevel = stdoutColor ? stdoutColor.level : 0;
	object.level = options.level === undefined ? colorLevel : options.level;
};

class ChalkClass {
	constructor(options) {
		// eslint-disable-next-line no-constructor-return
		return chalkFactory(options);
	}
}

const chalkFactory = options => {
	const chalk = {};
	applyOptions(chalk, options);

	chalk.template = (...arguments_) => chalkTag(chalk.template, ...arguments_);

	Object.setPrototypeOf(chalk, Chalk.prototype);
	Object.setPrototypeOf(chalk.template, chalk);

	chalk.template.constructor = () => {
		throw new Error('`chalk.constructor()` is deprecated. Use `new chalk.Instance()` instead.');
	};

	chalk.template.Instance = ChalkClass;

	return chalk.template;
};

function Chalk(options) {
	return chalkFactory(options);
}

for (const [styleName, style] of Object.entries(ansiStyles)) {
	styles[styleName] = {
		get() {
			const builder = createBuilder(this, createStyler(style.open, style.close, this._styler), this._isEmpty);
			Object.defineProperty(this, styleName, {value: builder});
			return builder;
		}
	};
}

styles.visible = {
	get() {
		const builder = createBuilder(this, this._styler, true);
		Object.defineProperty(this, 'visible', {value: builder});
		return builder;
	}
};

const usedModels = ['rgb', 'hex', 'keyword', 'hsl', 'hsv', 'hwb', 'ansi', 'ansi256'];

for (const model of usedModels) {
	styles[model] = {
		get() {
			const {level} = this;
			return function (...arguments_) {
				const styler = createStyler(ansiStyles.color[levelMapping[level]][model](...arguments_), ansiStyles.color.close, this._styler);
				return createBuilder(this, styler, this._isEmpty);
			};
		}
	};
}

for (const model of usedModels) {
	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const {level} = this;
			return function (...arguments_) {
				const styler = createStyler(ansiStyles.bgColor[levelMapping[level]][model](...arguments_), ansiStyles.bgColor.close, this._styler);
				return createBuilder(this, styler, this._isEmpty);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, {
	...styles,
	level: {
		enumerable: true,
		get() {
			return this._generator.level;
		},
		set(level) {
			this._generator.level = level;
		}
	}
});

const createStyler = (open, close, parent) => {
	let openAll;
	let closeAll;
	if (parent === undefined) {
		openAll = open;
		closeAll = close;
	} else {
		openAll = parent.openAll + open;
		closeAll = close + parent.closeAll;
	}

	return {
		open,
		close,
		openAll,
		closeAll,
		parent
	};
};

const createBuilder = (self, _styler, _isEmpty) => {
	const builder = (...arguments_) => {
		if (isArray(arguments_[0]) && isArray(arguments_[0].raw)) {
			// Called as a template literal, for example: chalk.red`2 + 3 = {bold ${2+3}}`
			return applyStyle(builder, chalkTag(builder, ...arguments_));
		}

		// Single argument is hot path, implicit coercion is faster than anything
		// eslint-disable-next-line no-implicit-coercion
		return applyStyle(builder, (arguments_.length === 1) ? ('' + arguments_[0]) : arguments_.join(' '));
	};

	// We alter the prototype because we must return a function, but there is
	// no way to create a function with a different prototype
	Object.setPrototypeOf(builder, proto);

	builder._generator = self;
	builder._styler = _styler;
	builder._isEmpty = _isEmpty;

	return builder;
};

const applyStyle = (self, string) => {
	if (self.level <= 0 || !string) {
		return self._isEmpty ? '' : string;
	}

	let styler = self._styler;

	if (styler === undefined) {
		return string;
	}

	const {openAll, closeAll} = styler;
	if (string.indexOf('\u001B') !== -1) {
		while (styler !== undefined) {
			// Replace any instances already present with a re-opening code
			// otherwise only the part of the string until said closing code
			// will be colored, and the rest will simply be 'plain'.
			string = stringReplaceAll$1(string, styler.close, styler.open);

			styler = styler.parent;
		}
	}

	// We can move both next actions out of loop, because remaining actions in loop won't have
	// any/visible effect on parts we add here. Close the styling before a linebreak and reopen
	// after next line to fix a bleed issue on macOS: https://github.com/chalk/chalk/pull/92
	const lfIndex = string.indexOf('\n');
	if (lfIndex !== -1) {
		string = stringEncaseCRLFWithFirstIndex$1(string, closeAll, openAll, lfIndex);
	}

	return openAll + string + closeAll;
};

let template;
const chalkTag = (chalk, ...strings) => {
	const [firstString] = strings;

	if (!isArray(firstString) || !isArray(firstString.raw)) {
		// If chalk() was called by itself or with a string,
		// return the string itself as a string.
		return strings.join(' ');
	}

	const arguments_ = strings.slice(1);
	const parts = [firstString.raw[0]];

	for (let i = 1; i < firstString.length; i++) {
		parts.push(
			String(arguments_[i - 1]).replace(/[{}\\]/g, '\\$&'),
			String(firstString.raw[i])
		);
	}

	if (template === undefined) {
		template = templates;
	}

	return template(chalk, parts.join(''));
};

Object.defineProperties(Chalk.prototype, styles);

const chalk = Chalk(); // eslint-disable-line new-cap
chalk.supportsColor = stdoutColor;
chalk.stderr = Chalk({level: stderrColor ? stderrColor.level : 0}); // eslint-disable-line new-cap
chalk.stderr.supportsColor = stderrColor;

var source = chalk;

var preRunMessage = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.remove = exports.print = void 0;

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}

var _clearLine = _interopRequireDefault(clearLine_1);

var _isInteractive = _interopRequireDefault(isInteractive);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const print = stream => {
  if (_isInteractive.default) {
    stream.write(
      _chalk().default.bold.dim('Determining test suites to run...')
    );
  }
};

exports.print = print;

const remove = stream => {
  if (_isInteractive.default) {
    (0, _clearLine.default)(stream);
  }
};

exports.remove = remove;
});

var pluralize_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = pluralize;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function pluralize(word, count) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
});

var formatTime_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = formatTime;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function formatTime(time, prefixPower = -3, padLeftLength = 0) {
  const prefixes = ['n', 'μ', 'm', ''];
  const prefixIndex = Math.max(
    0,
    Math.min(
      Math.trunc(prefixPower / 3) + prefixes.length - 1,
      prefixes.length - 1
    )
  );
  return `${String(time).padStart(padLeftLength)} ${prefixes[prefixIndex]}s`;
}
});

var tryRealpath_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = tryRealpath;

function _gracefulFs() {
  const data = gracefulFs;

  _gracefulFs = function () {
    return data;
  };

  return data;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function tryRealpath(path) {
  try {
    path = _gracefulFs().realpathSync.native(path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return path;
}
});

var build = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
Object.defineProperty(exports, 'clearLine', {
  enumerable: true,
  get: function () {
    return _clearLine.default;
  }
});
Object.defineProperty(exports, 'createDirectory', {
  enumerable: true,
  get: function () {
    return _createDirectory.default;
  }
});
Object.defineProperty(exports, 'ErrorWithStack', {
  enumerable: true,
  get: function () {
    return _ErrorWithStack.default;
  }
});
Object.defineProperty(exports, 'installCommonGlobals', {
  enumerable: true,
  get: function () {
    return _installCommonGlobals.default;
  }
});
Object.defineProperty(exports, 'interopRequireDefault', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault.default;
  }
});
Object.defineProperty(exports, 'isInteractive', {
  enumerable: true,
  get: function () {
    return _isInteractive.default;
  }
});
Object.defineProperty(exports, 'isPromise', {
  enumerable: true,
  get: function () {
    return _isPromise.default;
  }
});
Object.defineProperty(exports, 'setGlobal', {
  enumerable: true,
  get: function () {
    return _setGlobal.default;
  }
});
Object.defineProperty(exports, 'deepCyclicCopy', {
  enumerable: true,
  get: function () {
    return _deepCyclicCopy.default;
  }
});
Object.defineProperty(exports, 'convertDescriptorToString', {
  enumerable: true,
  get: function () {
    return _convertDescriptorToString.default;
  }
});
Object.defineProperty(exports, 'replacePathSepForGlob', {
  enumerable: true,
  get: function () {
    return _replacePathSepForGlob.default;
  }
});
Object.defineProperty(exports, 'testPathPatternToRegExp', {
  enumerable: true,
  get: function () {
    return _testPathPatternToRegExp.default;
  }
});
Object.defineProperty(exports, 'globsToMatcher', {
  enumerable: true,
  get: function () {
    return _globsToMatcher.default;
  }
});
Object.defineProperty(exports, 'pluralize', {
  enumerable: true,
  get: function () {
    return _pluralize.default;
  }
});
Object.defineProperty(exports, 'formatTime', {
  enumerable: true,
  get: function () {
    return _formatTime.default;
  }
});
Object.defineProperty(exports, 'tryRealpath', {
  enumerable: true,
  get: function () {
    return _tryRealpath.default;
  }
});
exports.preRunMessage = exports.specialChars = void 0;

var _clearLine = _interopRequireDefault2(clearLine_1);

var _createDirectory = _interopRequireDefault2(createDirectory_1);

var _ErrorWithStack = _interopRequireDefault2(ErrorWithStack_1);

var _installCommonGlobals = _interopRequireDefault2(
  installCommonGlobals
);

var _interopRequireDefault = _interopRequireDefault2(
  interopRequireDefault_1
);

var _isInteractive = _interopRequireDefault2(isInteractive);

var _isPromise = _interopRequireDefault2(isPromise_1);

var _setGlobal = _interopRequireDefault2(setGlobal);

var _deepCyclicCopy = _interopRequireDefault2(deepCyclicCopy_1);

var _convertDescriptorToString = _interopRequireDefault2(
  convertDescriptorToString_1
);

var specialChars$1 = _interopRequireWildcard(specialChars);

exports.specialChars = specialChars$1;

var _replacePathSepForGlob = _interopRequireDefault2(
  replacePathSepForGlob_1
);

var _testPathPatternToRegExp = _interopRequireDefault2(
  testPathPatternToRegExp
);

var _globsToMatcher = _interopRequireDefault2(globsToMatcher_1);

var preRunMessage$1 = _interopRequireWildcard(preRunMessage);

exports.preRunMessage = preRunMessage$1;

var _pluralize = _interopRequireDefault2(pluralize_1);

var _formatTime = _interopRequireDefault2(formatTime_1);

var _tryRealpath = _interopRequireDefault2(tryRealpath_1);

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

function _interopRequireDefault2(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}
});

var collections = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.printIteratorEntries = printIteratorEntries;
exports.printIteratorValues = printIteratorValues;
exports.printListItems = printListItems;
exports.printObjectProperties = printObjectProperties;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const getKeysOfEnumerableProperties = object => {
  const keys = Object.keys(object).sort();

  if (Object.getOwnPropertySymbols) {
    Object.getOwnPropertySymbols(object).forEach(symbol => {
      if (Object.getOwnPropertyDescriptor(object, symbol).enumerable) {
        keys.push(symbol);
      }
    });
  }

  return keys;
};
/**
 * Return entries (for example, of a map)
 * with spacing, indentation, and comma
 * without surrounding punctuation (for example, braces)
 */

function printIteratorEntries(
  iterator,
  config,
  indentation,
  depth,
  refs,
  printer, // Too bad, so sad that separator for ECMAScript Map has been ' => '
  // What a distracting diff if you change a data structure to/from
  // ECMAScript Object or Immutable.Map/OrderedMap which use the default.
  separator = ': '
) {
  let result = '';
  let current = iterator.next();

  if (!current.done) {
    result += config.spacingOuter;
    const indentationNext = indentation + config.indent;

    while (!current.done) {
      const name = printer(
        current.value[0],
        config,
        indentationNext,
        depth,
        refs
      );
      const value = printer(
        current.value[1],
        config,
        indentationNext,
        depth,
        refs
      );
      result += indentationNext + name + separator + value;
      current = iterator.next();

      if (!current.done) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}
/**
 * Return values (for example, of a set)
 * with spacing, indentation, and comma
 * without surrounding punctuation (braces or brackets)
 */

function printIteratorValues(
  iterator,
  config,
  indentation,
  depth,
  refs,
  printer
) {
  let result = '';
  let current = iterator.next();

  if (!current.done) {
    result += config.spacingOuter;
    const indentationNext = indentation + config.indent;

    while (!current.done) {
      result +=
        indentationNext +
        printer(current.value, config, indentationNext, depth, refs);
      current = iterator.next();

      if (!current.done) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}
/**
 * Return items (for example, of an array)
 * with spacing, indentation, and comma
 * without surrounding punctuation (for example, brackets)
 **/

function printListItems(list, config, indentation, depth, refs, printer) {
  let result = '';

  if (list.length) {
    result += config.spacingOuter;
    const indentationNext = indentation + config.indent;

    for (let i = 0; i < list.length; i++) {
      result +=
        indentationNext +
        printer(list[i], config, indentationNext, depth, refs);

      if (i < list.length - 1) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}
/**
 * Return properties of an object
 * with spacing, indentation, and comma
 * without surrounding punctuation (for example, braces)
 */

function printObjectProperties(val, config, indentation, depth, refs, printer) {
  let result = '';
  const keys = getKeysOfEnumerableProperties(val);

  if (keys.length) {
    result += config.spacingOuter;
    const indentationNext = indentation + config.indent;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const name = printer(key, config, indentationNext, depth, refs);
      const value = printer(val[key], config, indentationNext, depth, refs);
      result += indentationNext + name + ': ' + value;

      if (i < keys.length - 1) {
        result += ',' + config.spacingInner;
      } else if (!config.min) {
        result += ',';
      }
    }

    result += config.spacingOuter + indentation;
  }

  return result;
}
});

var AsymmetricMatcher = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.test = exports.serialize = void 0;



var Symbol = commonjsGlobal['jest-symbol-do-not-touch'] || commonjsGlobal.Symbol;
const asymmetricMatcher =
  typeof Symbol === 'function' && Symbol.for
    ? Symbol.for('jest.asymmetricMatcher')
    : 0x1357a5;
const SPACE = ' ';

const serialize = (val, config, indentation, depth, refs, printer) => {
  const stringedValue = val.toString();

  if (
    stringedValue === 'ArrayContaining' ||
    stringedValue === 'ArrayNotContaining'
  ) {
    if (++depth > config.maxDepth) {
      return '[' + stringedValue + ']';
    }

    return (
      stringedValue +
      SPACE +
      '[' +
      (0, collections.printListItems)(
        val.sample,
        config,
        indentation,
        depth,
        refs,
        printer
      ) +
      ']'
    );
  }

  if (
    stringedValue === 'ObjectContaining' ||
    stringedValue === 'ObjectNotContaining'
  ) {
    if (++depth > config.maxDepth) {
      return '[' + stringedValue + ']';
    }

    return (
      stringedValue +
      SPACE +
      '{' +
      (0, collections.printObjectProperties)(
        val.sample,
        config,
        indentation,
        depth,
        refs,
        printer
      ) +
      '}'
    );
  }

  if (
    stringedValue === 'StringMatching' ||
    stringedValue === 'StringNotMatching'
  ) {
    return (
      stringedValue +
      SPACE +
      printer(val.sample, config, indentation, depth, refs)
    );
  }

  if (
    stringedValue === 'StringContaining' ||
    stringedValue === 'StringNotContaining'
  ) {
    return (
      stringedValue +
      SPACE +
      printer(val.sample, config, indentation, depth, refs)
    );
  }

  return val.toAsymmetricMatcher();
};

exports.serialize = serialize;

const test = val => val && val.$$typeof === asymmetricMatcher;

exports.test = test;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var ansiRegex = ({onlyFirst = false} = {}) => {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
};

var ConvertAnsi = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.serialize = exports.test = void 0;

var _ansiRegex = _interopRequireDefault(ansiRegex);

var _ansiStyles = _interopRequireDefault(ansiStyles);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const toHumanReadableAnsi = text =>
  text.replace((0, _ansiRegex.default)(), match => {
    switch (match) {
      case _ansiStyles.default.red.close:
      case _ansiStyles.default.green.close:
      case _ansiStyles.default.cyan.close:
      case _ansiStyles.default.gray.close:
      case _ansiStyles.default.white.close:
      case _ansiStyles.default.yellow.close:
      case _ansiStyles.default.bgRed.close:
      case _ansiStyles.default.bgGreen.close:
      case _ansiStyles.default.bgYellow.close:
      case _ansiStyles.default.inverse.close:
      case _ansiStyles.default.dim.close:
      case _ansiStyles.default.bold.close:
      case _ansiStyles.default.reset.open:
      case _ansiStyles.default.reset.close:
        return '</>';

      case _ansiStyles.default.red.open:
        return '<red>';

      case _ansiStyles.default.green.open:
        return '<green>';

      case _ansiStyles.default.cyan.open:
        return '<cyan>';

      case _ansiStyles.default.gray.open:
        return '<gray>';

      case _ansiStyles.default.white.open:
        return '<white>';

      case _ansiStyles.default.yellow.open:
        return '<yellow>';

      case _ansiStyles.default.bgRed.open:
        return '<bgRed>';

      case _ansiStyles.default.bgGreen.open:
        return '<bgGreen>';

      case _ansiStyles.default.bgYellow.open:
        return '<bgYellow>';

      case _ansiStyles.default.inverse.open:
        return '<inverse>';

      case _ansiStyles.default.dim.open:
        return '<dim>';

      case _ansiStyles.default.bold.open:
        return '<bold>';

      default:
        return '';
    }
  });

const test = val =>
  typeof val === 'string' && !!val.match((0, _ansiRegex.default)());

exports.test = test;

const serialize = (val, config, indentation, depth, refs, printer) =>
  printer(toHumanReadableAnsi(val), config, indentation, depth, refs);

exports.serialize = serialize;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var DOMCollection = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.serialize = exports.test = void 0;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const SPACE = ' ';
const OBJECT_NAMES = ['DOMStringMap', 'NamedNodeMap'];
const ARRAY_REGEXP = /^(HTML\w*Collection|NodeList)$/;

const testName = name =>
  OBJECT_NAMES.indexOf(name) !== -1 || ARRAY_REGEXP.test(name);

const test = val =>
  val &&
  val.constructor &&
  !!val.constructor.name &&
  testName(val.constructor.name);

exports.test = test;

const isNamedNodeMap = collection =>
  collection.constructor.name === 'NamedNodeMap';

const serialize = (collection, config, indentation, depth, refs, printer) => {
  const name = collection.constructor.name;

  if (++depth > config.maxDepth) {
    return '[' + name + ']';
  }

  return (
    (config.min ? '' : name + SPACE) +
    (OBJECT_NAMES.indexOf(name) !== -1
      ? '{' +
        (0, collections.printObjectProperties)(
          isNamedNodeMap(collection)
            ? Array.from(collection).reduce((props, attribute) => {
                props[attribute.name] = attribute.value;
                return props;
              }, {})
            : {...collection},
          config,
          indentation,
          depth,
          refs,
          printer
        ) +
        '}'
      : '[' +
        (0, collections.printListItems)(
          Array.from(collection),
          config,
          indentation,
          depth,
          refs,
          printer
        ) +
        ']')
  );
};

exports.serialize = serialize;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var escapeHTML_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = escapeHTML;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function escapeHTML(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
});

var markup = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.printElementAsLeaf = exports.printElement = exports.printComment = exports.printText = exports.printChildren = exports.printProps = void 0;

var _escapeHTML = _interopRequireDefault(escapeHTML_1);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Return empty string if keys is empty.
const printProps = (keys, props, config, indentation, depth, refs, printer) => {
  const indentationNext = indentation + config.indent;
  const colors = config.colors;
  return keys
    .map(key => {
      const value = props[key];
      let printed = printer(value, config, indentationNext, depth, refs);

      if (typeof value !== 'string') {
        if (printed.indexOf('\n') !== -1) {
          printed =
            config.spacingOuter +
            indentationNext +
            printed +
            config.spacingOuter +
            indentation;
        }

        printed = '{' + printed + '}';
      }

      return (
        config.spacingInner +
        indentation +
        colors.prop.open +
        key +
        colors.prop.close +
        '=' +
        colors.value.open +
        printed +
        colors.value.close
      );
    })
    .join('');
}; // Return empty string if children is empty.

exports.printProps = printProps;

const printChildren = (children, config, indentation, depth, refs, printer) =>
  children
    .map(
      child =>
        config.spacingOuter +
        indentation +
        (typeof child === 'string'
          ? printText(child, config)
          : printer(child, config, indentation, depth, refs))
    )
    .join('');

exports.printChildren = printChildren;

const printText = (text, config) => {
  const contentColor = config.colors.content;
  return (
    contentColor.open + (0, _escapeHTML.default)(text) + contentColor.close
  );
};

exports.printText = printText;

const printComment = (comment, config) => {
  const commentColor = config.colors.comment;
  return (
    commentColor.open +
    '<!--' +
    (0, _escapeHTML.default)(comment) +
    '-->' +
    commentColor.close
  );
}; // Separate the functions to format props, children, and element,
// so a plugin could override a particular function, if needed.
// Too bad, so sad: the traditional (but unnecessary) space
// in a self-closing tagColor requires a second test of printedProps.

exports.printComment = printComment;

const printElement = (
  type,
  printedProps,
  printedChildren,
  config,
  indentation
) => {
  const tagColor = config.colors.tag;
  return (
    tagColor.open +
    '<' +
    type +
    (printedProps &&
      tagColor.close +
        printedProps +
        config.spacingOuter +
        indentation +
        tagColor.open) +
    (printedChildren
      ? '>' +
        tagColor.close +
        printedChildren +
        config.spacingOuter +
        indentation +
        tagColor.open +
        '</' +
        type
      : (printedProps && !config.min ? '' : ' ') + '/') +
    '>' +
    tagColor.close
  );
};

exports.printElement = printElement;

const printElementAsLeaf = (type, config) => {
  const tagColor = config.colors.tag;
  return (
    tagColor.open +
    '<' +
    type +
    tagColor.close +
    ' …' +
    tagColor.open +
    ' />' +
    tagColor.close
  );
};

exports.printElementAsLeaf = printElementAsLeaf;
});

var DOMElement = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.serialize = exports.test = void 0;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const FRAGMENT_NODE = 11;
const ELEMENT_REGEXP = /^((HTML|SVG)\w*)?Element$/;

const testNode = val => {
  var _val$hasAttribute;

  const constructorName = val.constructor.name;
  const {nodeType, tagName = ''} = val;
  const isCustomElement =
    tagName.includes('-') ||
    ((_val$hasAttribute = val.hasAttribute) === null ||
    _val$hasAttribute === void 0
      ? void 0
      : _val$hasAttribute.call(val, 'is'));
  return (
    (nodeType === ELEMENT_NODE &&
      (ELEMENT_REGEXP.test(constructorName) || isCustomElement)) ||
    (nodeType === TEXT_NODE && constructorName === 'Text') ||
    (nodeType === COMMENT_NODE && constructorName === 'Comment') ||
    (nodeType === FRAGMENT_NODE && constructorName === 'DocumentFragment')
  );
};

const test = val => {
  var _val$constructor;

  return (
    (val === null || val === void 0
      ? void 0
      : (_val$constructor = val.constructor) === null ||
        _val$constructor === void 0
      ? void 0
      : _val$constructor.name) && testNode(val)
  );
};

exports.test = test;

function nodeIsText(node) {
  return node.nodeType === TEXT_NODE;
}

function nodeIsComment(node) {
  return node.nodeType === COMMENT_NODE;
}

function nodeIsFragment(node) {
  return node.nodeType === FRAGMENT_NODE;
}

const serialize = (node, config, indentation, depth, refs, printer) => {
  if (nodeIsText(node)) {
    return (0, markup.printText)(node.data, config);
  }

  if (nodeIsComment(node)) {
    return (0, markup.printComment)(node.data, config);
  }

  const type = nodeIsFragment(node)
    ? `DocumentFragment`
    : node.tagName.toLowerCase();

  if (++depth > config.maxDepth) {
    return (0, markup.printElementAsLeaf)(type, config);
  }

  return (0, markup.printElement)(
    type,
    (0, markup.printProps)(
      nodeIsFragment(node)
        ? []
        : Array.from(node.attributes)
            .map(attr => attr.name)
            .sort(),
      nodeIsFragment(node)
        ? {}
        : Array.from(node.attributes).reduce((props, attribute) => {
            props[attribute.name] = attribute.value;
            return props;
          }, {}),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer
    ),
    (0, markup.printChildren)(
      Array.prototype.slice.call(node.childNodes || node.children),
      config,
      indentation + config.indent,
      depth,
      refs,
      printer
    ),
    config,
    indentation
  );
};

exports.serialize = serialize;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var Immutable = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.test = exports.serialize = void 0;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// SENTINEL constants are from https://github.com/facebook/immutable-js
const IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
const IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';
const IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
const IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
const IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';
const IS_RECORD_SENTINEL = '@@__IMMUTABLE_RECORD__@@'; // immutable v4

const IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';
const IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';
const IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

const getImmutableName = name => 'Immutable.' + name;

const printAsLeaf = name => '[' + name + ']';

const SPACE = ' ';
const LAZY = '…'; // Seq is lazy if it calls a method like filter

const printImmutableEntries = (
  val,
  config,
  indentation,
  depth,
  refs,
  printer,
  type
) =>
  ++depth > config.maxDepth
    ? printAsLeaf(getImmutableName(type))
    : getImmutableName(type) +
      SPACE +
      '{' +
      (0, collections.printIteratorEntries)(
        val.entries(),
        config,
        indentation,
        depth,
        refs,
        printer
      ) +
      '}'; // Record has an entries method because it is a collection in immutable v3.
// Return an iterator for Immutable Record from version v3 or v4.

function getRecordEntries(val) {
  let i = 0;
  return {
    next() {
      if (i < val._keys.length) {
        const key = val._keys[i++];
        return {
          done: false,
          value: [key, val.get(key)]
        };
      }

      return {
        done: true,
        value: undefined
      };
    }
  };
}

const printImmutableRecord = (
  val,
  config,
  indentation,
  depth,
  refs,
  printer
) => {
  // _name property is defined only for an Immutable Record instance
  // which was constructed with a second optional descriptive name arg
  const name = getImmutableName(val._name || 'Record');
  return ++depth > config.maxDepth
    ? printAsLeaf(name)
    : name +
        SPACE +
        '{' +
        (0, collections.printIteratorEntries)(
          getRecordEntries(val),
          config,
          indentation,
          depth,
          refs,
          printer
        ) +
        '}';
};

const printImmutableSeq = (val, config, indentation, depth, refs, printer) => {
  const name = getImmutableName('Seq');

  if (++depth > config.maxDepth) {
    return printAsLeaf(name);
  }

  if (val[IS_KEYED_SENTINEL]) {
    return (
      name +
      SPACE +
      '{' + // from Immutable collection of entries or from ECMAScript object
      (val._iter || val._object
        ? (0, collections.printIteratorEntries)(
            val.entries(),
            config,
            indentation,
            depth,
            refs,
            printer
          )
        : LAZY) +
      '}'
    );
  }

  return (
    name +
    SPACE +
    '[' +
    (val._iter || // from Immutable collection of values
    val._array || // from ECMAScript array
    val._collection || // from ECMAScript collection in immutable v4
    val._iterable // from ECMAScript collection in immutable v3
      ? (0, collections.printIteratorValues)(
          val.values(),
          config,
          indentation,
          depth,
          refs,
          printer
        )
      : LAZY) +
    ']'
  );
};

const printImmutableValues = (
  val,
  config,
  indentation,
  depth,
  refs,
  printer,
  type
) =>
  ++depth > config.maxDepth
    ? printAsLeaf(getImmutableName(type))
    : getImmutableName(type) +
      SPACE +
      '[' +
      (0, collections.printIteratorValues)(
        val.values(),
        config,
        indentation,
        depth,
        refs,
        printer
      ) +
      ']';

const serialize = (val, config, indentation, depth, refs, printer) => {
  if (val[IS_MAP_SENTINEL]) {
    return printImmutableEntries(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      val[IS_ORDERED_SENTINEL] ? 'OrderedMap' : 'Map'
    );
  }

  if (val[IS_LIST_SENTINEL]) {
    return printImmutableValues(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      'List'
    );
  }

  if (val[IS_SET_SENTINEL]) {
    return printImmutableValues(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      val[IS_ORDERED_SENTINEL] ? 'OrderedSet' : 'Set'
    );
  }

  if (val[IS_STACK_SENTINEL]) {
    return printImmutableValues(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      'Stack'
    );
  }

  if (val[IS_SEQ_SENTINEL]) {
    return printImmutableSeq(val, config, indentation, depth, refs, printer);
  } // For compatibility with immutable v3 and v4, let record be the default.

  return printImmutableRecord(val, config, indentation, depth, refs, printer);
}; // Explicitly comparing sentinel properties to true avoids false positive
// when mock identity-obj-proxy returns the key as the value for any key.

exports.serialize = serialize;

const test = val =>
  val &&
  (val[IS_ITERABLE_SENTINEL] === true || val[IS_RECORD_SENTINEL] === true);

exports.test = test;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var b="function"===typeof Symbol&&Symbol.for,c=b?Symbol.for("react.element"):60103,d=b?Symbol.for("react.portal"):60106,e=b?Symbol.for("react.fragment"):60107,f=b?Symbol.for("react.strict_mode"):60108,g=b?Symbol.for("react.profiler"):60114,h=b?Symbol.for("react.provider"):60109,k=b?Symbol.for("react.context"):60110,l=b?Symbol.for("react.async_mode"):60111,m=b?Symbol.for("react.concurrent_mode"):60111,n=b?Symbol.for("react.forward_ref"):60112,p=b?Symbol.for("react.suspense"):60113,q=b?
Symbol.for("react.suspense_list"):60120,r=b?Symbol.for("react.memo"):60115,t=b?Symbol.for("react.lazy"):60116,v=b?Symbol.for("react.block"):60121,w=b?Symbol.for("react.fundamental"):60117,x=b?Symbol.for("react.responder"):60118,y=b?Symbol.for("react.scope"):60119;
function z(a){if("object"===typeof a&&null!==a){var u=a.$$typeof;switch(u){case c:switch(a=a.type,a){case l:case m:case e:case g:case f:case p:return a;default:switch(a=a&&a.$$typeof,a){case k:case n:case t:case r:case h:return a;default:return u}}case d:return u}}}function A(a){return z(a)===m}var AsyncMode=l;var ConcurrentMode=m;var ContextConsumer=k;var ContextProvider=h;var Element=c;var ForwardRef=n;var Fragment=e;var Lazy=t;var Memo=r;var Portal=d;
var Profiler=g;var StrictMode=f;var Suspense=p;var isAsyncMode=function(a){return A(a)||z(a)===l};var isConcurrentMode=A;var isContextConsumer=function(a){return z(a)===k};var isContextProvider=function(a){return z(a)===h};var isElement=function(a){return "object"===typeof a&&null!==a&&a.$$typeof===c};var isForwardRef=function(a){return z(a)===n};var isFragment=function(a){return z(a)===e};var isLazy=function(a){return z(a)===t};
var isMemo=function(a){return z(a)===r};var isPortal=function(a){return z(a)===d};var isProfiler=function(a){return z(a)===g};var isStrictMode=function(a){return z(a)===f};var isSuspense=function(a){return z(a)===p};
var isValidElementType=function(a){return "string"===typeof a||"function"===typeof a||a===e||a===m||a===g||a===f||a===p||a===q||"object"===typeof a&&null!==a&&(a.$$typeof===t||a.$$typeof===r||a.$$typeof===h||a.$$typeof===k||a.$$typeof===n||a.$$typeof===w||a.$$typeof===x||a.$$typeof===y||a.$$typeof===v)};var typeOf=z;

var reactIs_production_min = {
	AsyncMode: AsyncMode,
	ConcurrentMode: ConcurrentMode,
	ContextConsumer: ContextConsumer,
	ContextProvider: ContextProvider,
	Element: Element,
	ForwardRef: ForwardRef,
	Fragment: Fragment,
	Lazy: Lazy,
	Memo: Memo,
	Portal: Portal,
	Profiler: Profiler,
	StrictMode: StrictMode,
	Suspense: Suspense,
	isAsyncMode: isAsyncMode,
	isConcurrentMode: isConcurrentMode,
	isContextConsumer: isContextConsumer,
	isContextProvider: isContextProvider,
	isElement: isElement,
	isForwardRef: isForwardRef,
	isFragment: isFragment,
	isLazy: isLazy,
	isMemo: isMemo,
	isPortal: isPortal,
	isProfiler: isProfiler,
	isStrictMode: isStrictMode,
	isSuspense: isSuspense,
	isValidElementType: isValidElementType,
	typeOf: typeOf
};

var reactIs_development = createCommonjsModule(function (module, exports) {



if (process.env.NODE_ENV !== "production") {
  (function() {

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
// (unstable) APIs that have been removed. Can we remove the symbols?

var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;

function isValidElementType(type) {
  return typeof type === 'string' || typeof type === 'function' || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
  type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
}

function typeOf(object) {
  if (typeof object === 'object' && object !== null) {
    var $$typeof = object.$$typeof;

    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        var type = object.type;

        switch (type) {
          case REACT_ASYNC_MODE_TYPE:
          case REACT_CONCURRENT_MODE_TYPE:
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
            return type;

          default:
            var $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
              case REACT_PROVIDER_TYPE:
                return $$typeofType;

              default:
                return $$typeof;
            }

        }

      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }

  return undefined;
} // AsyncMode is deprecated along with isAsyncMode

var AsyncMode = REACT_ASYNC_MODE_TYPE;
var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
var ContextConsumer = REACT_CONTEXT_TYPE;
var ContextProvider = REACT_PROVIDER_TYPE;
var Element = REACT_ELEMENT_TYPE;
var ForwardRef = REACT_FORWARD_REF_TYPE;
var Fragment = REACT_FRAGMENT_TYPE;
var Lazy = REACT_LAZY_TYPE;
var Memo = REACT_MEMO_TYPE;
var Portal = REACT_PORTAL_TYPE;
var Profiler = REACT_PROFILER_TYPE;
var StrictMode = REACT_STRICT_MODE_TYPE;
var Suspense = REACT_SUSPENSE_TYPE;
var hasWarnedAboutDeprecatedIsAsyncMode = false; // AsyncMode should be deprecated

function isAsyncMode(object) {
  {
    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
      hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

      console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
    }
  }

  return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
}
function isConcurrentMode(object) {
  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
}
function isContextConsumer(object) {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}
function isContextProvider(object) {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}
function isElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}
function isForwardRef(object) {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
function isFragment(object) {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
function isLazy(object) {
  return typeOf(object) === REACT_LAZY_TYPE;
}
function isMemo(object) {
  return typeOf(object) === REACT_MEMO_TYPE;
}
function isPortal(object) {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
function isProfiler(object) {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
function isStrictMode(object) {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
function isSuspense(object) {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}

exports.AsyncMode = AsyncMode;
exports.ConcurrentMode = ConcurrentMode;
exports.ContextConsumer = ContextConsumer;
exports.ContextProvider = ContextProvider;
exports.Element = Element;
exports.ForwardRef = ForwardRef;
exports.Fragment = Fragment;
exports.Lazy = Lazy;
exports.Memo = Memo;
exports.Portal = Portal;
exports.Profiler = Profiler;
exports.StrictMode = StrictMode;
exports.Suspense = Suspense;
exports.isAsyncMode = isAsyncMode;
exports.isConcurrentMode = isConcurrentMode;
exports.isContextConsumer = isContextConsumer;
exports.isContextProvider = isContextProvider;
exports.isElement = isElement;
exports.isForwardRef = isForwardRef;
exports.isFragment = isFragment;
exports.isLazy = isLazy;
exports.isMemo = isMemo;
exports.isPortal = isPortal;
exports.isProfiler = isProfiler;
exports.isStrictMode = isStrictMode;
exports.isSuspense = isSuspense;
exports.isValidElementType = isValidElementType;
exports.typeOf = typeOf;
  })();
}
});

var reactIs = createCommonjsModule(function (module) {

if (process.env.NODE_ENV === 'production') {
  module.exports = reactIs_production_min;
} else {
  module.exports = reactIs_development;
}
});

var ReactElement = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.test = exports.serialize = void 0;

var ReactIs = _interopRequireWildcard(reactIs);



function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Given element.props.children, or subtree during recursive traversal,
// return flattened array of children.
const getChildren = (arg, children = []) => {
  if (Array.isArray(arg)) {
    arg.forEach(item => {
      getChildren(item, children);
    });
  } else if (arg != null && arg !== false) {
    children.push(arg);
  }

  return children;
};

const getType = element => {
  const type = element.type;

  if (typeof type === 'string') {
    return type;
  }

  if (typeof type === 'function') {
    return type.displayName || type.name || 'Unknown';
  }

  if (ReactIs.isFragment(element)) {
    return 'React.Fragment';
  }

  if (ReactIs.isSuspense(element)) {
    return 'React.Suspense';
  }

  if (typeof type === 'object' && type !== null) {
    if (ReactIs.isContextProvider(element)) {
      return 'Context.Provider';
    }

    if (ReactIs.isContextConsumer(element)) {
      return 'Context.Consumer';
    }

    if (ReactIs.isForwardRef(element)) {
      if (type.displayName) {
        return type.displayName;
      }

      const functionName = type.render.displayName || type.render.name || '';
      return functionName !== ''
        ? 'ForwardRef(' + functionName + ')'
        : 'ForwardRef';
    }

    if (ReactIs.isMemo(element)) {
      const functionName =
        type.displayName || type.type.displayName || type.type.name || '';
      return functionName !== '' ? 'Memo(' + functionName + ')' : 'Memo';
    }
  }

  return 'UNDEFINED';
};

const getPropKeys = element => {
  const {props} = element;
  return Object.keys(props)
    .filter(key => key !== 'children' && props[key] !== undefined)
    .sort();
};

const serialize = (element, config, indentation, depth, refs, printer) =>
  ++depth > config.maxDepth
    ? (0, markup.printElementAsLeaf)(getType(element), config)
    : (0, markup.printElement)(
        getType(element),
        (0, markup.printProps)(
          getPropKeys(element),
          element.props,
          config,
          indentation + config.indent,
          depth,
          refs,
          printer
        ),
        (0, markup.printChildren)(
          getChildren(element.props.children),
          config,
          indentation + config.indent,
          depth,
          refs,
          printer
        ),
        config,
        indentation
      );

exports.serialize = serialize;

const test = val => val && ReactIs.isElement(val);

exports.test = test;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var ReactTestComponent = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = exports.test = exports.serialize = void 0;



var Symbol = commonjsGlobal['jest-symbol-do-not-touch'] || commonjsGlobal.Symbol;
const testSymbol =
  typeof Symbol === 'function' && Symbol.for
    ? Symbol.for('react.test.json')
    : 0xea71357;

const getPropKeys = object => {
  const {props} = object;
  return props
    ? Object.keys(props)
        .filter(key => props[key] !== undefined)
        .sort()
    : [];
};

const serialize = (object, config, indentation, depth, refs, printer) =>
  ++depth > config.maxDepth
    ? (0, markup.printElementAsLeaf)(object.type, config)
    : (0, markup.printElement)(
        object.type,
        object.props
          ? (0, markup.printProps)(
              getPropKeys(object),
              object.props,
              config,
              indentation + config.indent,
              depth,
              refs,
              printer
            )
          : '',
        object.children
          ? (0, markup.printChildren)(
              object.children,
              config,
              indentation + config.indent,
              depth,
              refs,
              printer
            )
          : '',
        config,
        indentation
      );

exports.serialize = serialize;

const test = val => val && val.$$typeof === testSymbol;

exports.test = test;
const plugin = {
  serialize,
  test
};
var _default = plugin;
exports.default = _default;
});

var build$1 = createCommonjsModule(function (module) {

var _ansiStyles = _interopRequireDefault(ansiStyles);



var _AsymmetricMatcher = _interopRequireDefault(
  AsymmetricMatcher
);

var _ConvertAnsi = _interopRequireDefault(ConvertAnsi);

var _DOMCollection = _interopRequireDefault(DOMCollection);

var _DOMElement = _interopRequireDefault(DOMElement);

var _Immutable = _interopRequireDefault(Immutable);

var _ReactElement = _interopRequireDefault(ReactElement);

var _ReactTestComponent = _interopRequireDefault(
  ReactTestComponent
);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const toString = Object.prototype.toString;
const toISOString = Date.prototype.toISOString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
/**
 * Explicitly comparing typeof constructor to function avoids undefined as name
 * when mock identity-obj-proxy returns the key as the value for any key.
 */

const getConstructorName = val =>
  (typeof val.constructor === 'function' && val.constructor.name) || 'Object';
/* global window */

/** Is val is equal to global window object? Works even if it does not exist :) */

const isWindow = val => typeof window !== 'undefined' && val === window;

const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;
const NEWLINE_REGEXP = /\n/gi;

class PrettyFormatPluginError extends Error {
  constructor(message, stack) {
    super(message);
    this.stack = stack;
    this.name = this.constructor.name;
  }
}

function isToStringedArrayType(toStringed) {
  return (
    toStringed === '[object Array]' ||
    toStringed === '[object ArrayBuffer]' ||
    toStringed === '[object DataView]' ||
    toStringed === '[object Float32Array]' ||
    toStringed === '[object Float64Array]' ||
    toStringed === '[object Int8Array]' ||
    toStringed === '[object Int16Array]' ||
    toStringed === '[object Int32Array]' ||
    toStringed === '[object Uint8Array]' ||
    toStringed === '[object Uint8ClampedArray]' ||
    toStringed === '[object Uint16Array]' ||
    toStringed === '[object Uint32Array]'
  );
}

function printNumber(val) {
  return Object.is(val, -0) ? '-0' : String(val);
}

function printBigInt(val) {
  return String(`${val}n`);
}

function printFunction(val, printFunctionName) {
  if (!printFunctionName) {
    return '[Function]';
  }

  return '[Function ' + (val.name || 'anonymous') + ']';
}

function printSymbol(val) {
  return String(val).replace(SYMBOL_REGEXP, 'Symbol($1)');
}

function printError(val) {
  return '[' + errorToString.call(val) + ']';
}
/**
 * The first port of call for printing an object, handles most of the
 * data-types in JS.
 */

function printBasicValue(val, printFunctionName, escapeRegex, escapeString) {
  if (val === true || val === false) {
    return '' + val;
  }

  if (val === undefined) {
    return 'undefined';
  }

  if (val === null) {
    return 'null';
  }

  const typeOf = typeof val;

  if (typeOf === 'number') {
    return printNumber(val);
  }

  if (typeOf === 'bigint') {
    return printBigInt(val);
  }

  if (typeOf === 'string') {
    if (escapeString) {
      return '"' + val.replace(/"|\\/g, '\\$&') + '"';
    }

    return '"' + val + '"';
  }

  if (typeOf === 'function') {
    return printFunction(val, printFunctionName);
  }

  if (typeOf === 'symbol') {
    return printSymbol(val);
  }

  const toStringed = toString.call(val);

  if (toStringed === '[object WeakMap]') {
    return 'WeakMap {}';
  }

  if (toStringed === '[object WeakSet]') {
    return 'WeakSet {}';
  }

  if (
    toStringed === '[object Function]' ||
    toStringed === '[object GeneratorFunction]'
  ) {
    return printFunction(val, printFunctionName);
  }

  if (toStringed === '[object Symbol]') {
    return printSymbol(val);
  }

  if (toStringed === '[object Date]') {
    return isNaN(+val) ? 'Date { NaN }' : toISOString.call(val);
  }

  if (toStringed === '[object Error]') {
    return printError(val);
  }

  if (toStringed === '[object RegExp]') {
    if (escapeRegex) {
      // https://github.com/benjamingr/RegExp.escape/blob/master/polyfill.js
      return regExpToString.call(val).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    return regExpToString.call(val);
  }

  if (val instanceof Error) {
    return printError(val);
  }

  return null;
}
/**
 * Handles more complex objects ( such as objects with circular references.
 * maps and sets etc )
 */

function printComplexValue(
  val,
  config,
  indentation,
  depth,
  refs,
  hasCalledToJSON
) {
  if (refs.indexOf(val) !== -1) {
    return '[Circular]';
  }

  refs = refs.slice();
  refs.push(val);
  const hitMaxDepth = ++depth > config.maxDepth;
  const min = config.min;

  if (
    config.callToJSON &&
    !hitMaxDepth &&
    val.toJSON &&
    typeof val.toJSON === 'function' &&
    !hasCalledToJSON
  ) {
    return printer(val.toJSON(), config, indentation, depth, refs, true);
  }

  const toStringed = toString.call(val);

  if (toStringed === '[object Arguments]') {
    return hitMaxDepth
      ? '[Arguments]'
      : (min ? '' : 'Arguments ') +
          '[' +
          (0, collections.printListItems)(
            val,
            config,
            indentation,
            depth,
            refs,
            printer
          ) +
          ']';
  }

  if (isToStringedArrayType(toStringed)) {
    return hitMaxDepth
      ? '[' + val.constructor.name + ']'
      : (min ? '' : val.constructor.name + ' ') +
          '[' +
          (0, collections.printListItems)(
            val,
            config,
            indentation,
            depth,
            refs,
            printer
          ) +
          ']';
  }

  if (toStringed === '[object Map]') {
    return hitMaxDepth
      ? '[Map]'
      : 'Map {' +
          (0, collections.printIteratorEntries)(
            val.entries(),
            config,
            indentation,
            depth,
            refs,
            printer,
            ' => '
          ) +
          '}';
  }

  if (toStringed === '[object Set]') {
    return hitMaxDepth
      ? '[Set]'
      : 'Set {' +
          (0, collections.printIteratorValues)(
            val.values(),
            config,
            indentation,
            depth,
            refs,
            printer
          ) +
          '}';
  } // Avoid failure to serialize global window object in jsdom test environment.
  // For example, not even relevant if window is prop of React element.

  return hitMaxDepth || isWindow(val)
    ? '[' + getConstructorName(val) + ']'
    : (min ? '' : getConstructorName(val) + ' ') +
        '{' +
        (0, collections.printObjectProperties)(
          val,
          config,
          indentation,
          depth,
          refs,
          printer
        ) +
        '}';
}

function isNewPlugin(plugin) {
  return plugin.serialize != null;
}

function printPlugin(plugin, val, config, indentation, depth, refs) {
  let printed;

  try {
    printed = isNewPlugin(plugin)
      ? plugin.serialize(val, config, indentation, depth, refs, printer)
      : plugin.print(
          val,
          valChild => printer(valChild, config, indentation, depth, refs),
          str => {
            const indentationNext = indentation + config.indent;
            return (
              indentationNext +
              str.replace(NEWLINE_REGEXP, '\n' + indentationNext)
            );
          },
          {
            edgeSpacing: config.spacingOuter,
            min: config.min,
            spacing: config.spacingInner
          },
          config.colors
        );
  } catch (error) {
    throw new PrettyFormatPluginError(error.message, error.stack);
  }

  if (typeof printed !== 'string') {
    throw new Error(
      `pretty-format: Plugin must return type "string" but instead returned "${typeof printed}".`
    );
  }

  return printed;
}

function findPlugin(plugins, val) {
  for (let p = 0; p < plugins.length; p++) {
    try {
      if (plugins[p].test(val)) {
        return plugins[p];
      }
    } catch (error) {
      throw new PrettyFormatPluginError(error.message, error.stack);
    }
  }

  return null;
}

function printer(val, config, indentation, depth, refs, hasCalledToJSON) {
  const plugin = findPlugin(config.plugins, val);

  if (plugin !== null) {
    return printPlugin(plugin, val, config, indentation, depth, refs);
  }

  const basicResult = printBasicValue(
    val,
    config.printFunctionName,
    config.escapeRegex,
    config.escapeString
  );

  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(
    val,
    config,
    indentation,
    depth,
    refs,
    hasCalledToJSON
  );
}

const DEFAULT_THEME = {
  comment: 'gray',
  content: 'reset',
  prop: 'yellow',
  tag: 'cyan',
  value: 'green'
};
const DEFAULT_THEME_KEYS = Object.keys(DEFAULT_THEME);
const DEFAULT_OPTIONS = {
  callToJSON: true,
  escapeRegex: false,
  escapeString: true,
  highlight: false,
  indent: 2,
  maxDepth: Infinity,
  min: false,
  plugins: [],
  printFunctionName: true,
  theme: DEFAULT_THEME
};

function validateOptions(options) {
  Object.keys(options).forEach(key => {
    if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
      throw new Error(`pretty-format: Unknown option "${key}".`);
    }
  });

  if (options.min && options.indent !== undefined && options.indent !== 0) {
    throw new Error(
      'pretty-format: Options "min" and "indent" cannot be used together.'
    );
  }

  if (options.theme !== undefined) {
    if (options.theme === null) {
      throw new Error(`pretty-format: Option "theme" must not be null.`);
    }

    if (typeof options.theme !== 'object') {
      throw new Error(
        `pretty-format: Option "theme" must be of type "object" but instead received "${typeof options.theme}".`
      );
    }
  }
}

const getColorsHighlight = options =>
  DEFAULT_THEME_KEYS.reduce((colors, key) => {
    const value =
      options.theme && options.theme[key] !== undefined
        ? options.theme[key]
        : DEFAULT_THEME[key];
    const color = value && _ansiStyles.default[value];

    if (
      color &&
      typeof color.close === 'string' &&
      typeof color.open === 'string'
    ) {
      colors[key] = color;
    } else {
      throw new Error(
        `pretty-format: Option "theme" has a key "${key}" whose value "${value}" is undefined in ansi-styles.`
      );
    }

    return colors;
  }, Object.create(null));

const getColorsEmpty = () =>
  DEFAULT_THEME_KEYS.reduce((colors, key) => {
    colors[key] = {
      close: '',
      open: ''
    };
    return colors;
  }, Object.create(null));

const getPrintFunctionName = options =>
  options && options.printFunctionName !== undefined
    ? options.printFunctionName
    : DEFAULT_OPTIONS.printFunctionName;

const getEscapeRegex = options =>
  options && options.escapeRegex !== undefined
    ? options.escapeRegex
    : DEFAULT_OPTIONS.escapeRegex;

const getEscapeString = options =>
  options && options.escapeString !== undefined
    ? options.escapeString
    : DEFAULT_OPTIONS.escapeString;

const getConfig = options => ({
  callToJSON:
    options && options.callToJSON !== undefined
      ? options.callToJSON
      : DEFAULT_OPTIONS.callToJSON,
  colors:
    options && options.highlight
      ? getColorsHighlight(options)
      : getColorsEmpty(),
  escapeRegex: getEscapeRegex(options),
  escapeString: getEscapeString(options),
  indent:
    options && options.min
      ? ''
      : createIndent(
          options && options.indent !== undefined
            ? options.indent
            : DEFAULT_OPTIONS.indent
        ),
  maxDepth:
    options && options.maxDepth !== undefined
      ? options.maxDepth
      : DEFAULT_OPTIONS.maxDepth,
  min: options && options.min !== undefined ? options.min : DEFAULT_OPTIONS.min,
  plugins:
    options && options.plugins !== undefined
      ? options.plugins
      : DEFAULT_OPTIONS.plugins,
  printFunctionName: getPrintFunctionName(options),
  spacingInner: options && options.min ? ' ' : '\n',
  spacingOuter: options && options.min ? '' : '\n'
});

function createIndent(indent) {
  return new Array(indent + 1).join(' ');
}
/**
 * Returns a presentation string of your `val` object
 * @param val any potential JavaScript object
 * @param options Custom settings
 */

function prettyFormat(val, options) {
  if (options) {
    validateOptions(options);

    if (options.plugins) {
      const plugin = findPlugin(options.plugins, val);

      if (plugin !== null) {
        return printPlugin(plugin, val, getConfig(options), '', 0, []);
      }
    }
  }

  const basicResult = printBasicValue(
    val,
    getPrintFunctionName(options),
    getEscapeRegex(options),
    getEscapeString(options)
  );

  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(val, getConfig(options), '', 0, []);
}

prettyFormat.plugins = {
  AsymmetricMatcher: _AsymmetricMatcher.default,
  ConvertAnsi: _ConvertAnsi.default,
  DOMCollection: _DOMCollection.default,
  DOMElement: _DOMElement.default,
  Immutable: _Immutable.default,
  ReactElement: _ReactElement.default,
  ReactTestComponent: _ReactTestComponent.default
}; // eslint-disable-next-line no-redeclare

module.exports = prettyFormat;
});

const array = [];
const charCodeCache = [];

const leven = (left, right) => {
	if (left === right) {
		return 0;
	}

	const swap = left;

	// Swapping the strings if `a` is longer than `b` so we know which one is the
	// shortest & which one is the longest
	if (left.length > right.length) {
		left = right;
		right = swap;
	}

	let leftLength = left.length;
	let rightLength = right.length;

	// Performing suffix trimming:
	// We can linearly drop suffix common to both strings since they
	// don't increase distance at all
	// Note: `~-` is the bitwise way to perform a `- 1` operation
	while (leftLength > 0 && (left.charCodeAt(~-leftLength) === right.charCodeAt(~-rightLength))) {
		leftLength--;
		rightLength--;
	}

	// Performing prefix trimming
	// We can linearly drop prefix common to both strings since they
	// don't increase distance at all
	let start = 0;

	while (start < leftLength && (left.charCodeAt(start) === right.charCodeAt(start))) {
		start++;
	}

	leftLength -= start;
	rightLength -= start;

	if (leftLength === 0) {
		return rightLength;
	}

	let bCharCode;
	let result;
	let temp;
	let temp2;
	let i = 0;
	let j = 0;

	while (i < leftLength) {
		charCodeCache[i] = left.charCodeAt(start + i);
		array[i] = ++i;
	}

	while (j < rightLength) {
		bCharCode = right.charCodeAt(start + j);
		temp = j++;
		result = j;

		for (i = 0; i < leftLength; i++) {
			temp2 = bCharCode === charCodeCache[i] ? temp : temp + 1;
			temp = array[i];
			// eslint-disable-next-line no-multi-assign
			result = array[i] = temp > result ? temp2 > result ? result + 1 : temp2 : temp2 > temp ? temp + 1 : temp2;
		}
	}

	return result;
};

var leven_1 = leven;
// TODO: Remove this for the next major release
var _default = leven;
leven_1.default = _default;

var utils$2 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.createDidYouMeanMessage = exports.logValidationWarning = exports.ValidationError = exports.formatPrettyObject = exports.format = exports.WARNING = exports.ERROR = exports.DEPRECATION = void 0;

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}

function _prettyFormat() {
  const data = _interopRequireDefault(build$1);

  _prettyFormat = function () {
    return data;
  };

  return data;
}

function _leven() {
  const data = _interopRequireDefault(leven_1);

  _leven = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

const BULLET = _chalk().default.bold('\u25cf');

const DEPRECATION = `${BULLET} Deprecation Warning`;
exports.DEPRECATION = DEPRECATION;
const ERROR = `${BULLET} Validation Error`;
exports.ERROR = ERROR;
const WARNING = `${BULLET} Validation Warning`;
exports.WARNING = WARNING;

const format = value =>
  typeof value === 'function'
    ? value.toString()
    : (0, _prettyFormat().default)(value, {
        min: true
      });

exports.format = format;

const formatPrettyObject = value =>
  typeof value === 'function'
    ? value.toString()
    : JSON.stringify(value, null, 2).split('\n').join('\n    ');

exports.formatPrettyObject = formatPrettyObject;

class ValidationError extends Error {
  constructor(name, message, comment) {
    super();

    _defineProperty(this, 'name', void 0);

    _defineProperty(this, 'message', void 0);

    comment = comment ? '\n\n' + comment : '\n';
    this.name = '';
    this.message = _chalk().default.red(
      _chalk().default.bold(name) + ':\n\n' + message + comment
    );
    Error.captureStackTrace(this, () => {});
  }
}

exports.ValidationError = ValidationError;

const logValidationWarning = (name, message, comment) => {
  comment = comment ? '\n\n' + comment : '\n';
  console.warn(
    _chalk().default.yellow(
      _chalk().default.bold(name) + ':\n\n' + message + comment
    )
  );
};

exports.logValidationWarning = logValidationWarning;

const createDidYouMeanMessage = (unrecognized, allowedOptions) => {
  const suggestion = allowedOptions.find(option => {
    const steps = (0, _leven().default)(option, unrecognized);
    return steps < 3;
  });
  return suggestion
    ? `Did you mean ${_chalk().default.bold(format(suggestion))}?`
    : '';
};

exports.createDidYouMeanMessage = createDidYouMeanMessage;
});

var deprecated = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.deprecationWarning = void 0;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const deprecationMessage = (message, options) => {
  const comment = options.comment;
  const name =
    (options.title && options.title.deprecation) || utils$2.DEPRECATION;
  (0, utils$2.logValidationWarning)(name, message, comment);
};

const deprecationWarning = (config, option, deprecatedOptions, options) => {
  if (option in deprecatedOptions) {
    deprecationMessage(deprecatedOptions[option](config), options);
    return true;
  }

  return false;
};

exports.deprecationWarning = deprecationWarning;
});

var warnings = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.unknownOptionWarning = void 0;

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}



function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const unknownOptionWarning = (config, exampleConfig, option, options, path) => {
  const didYouMean = (0, utils$2.createDidYouMeanMessage)(
    option,
    Object.keys(exampleConfig)
  );
  const message =
    `  Unknown option ${_chalk().default.bold(
      `"${path && path.length > 0 ? path.join('.') + '.' : ''}${option}"`
    )} with value ${_chalk().default.bold(
      (0, utils$2.format)(config[option])
    )} was found.` +
    (didYouMean && ` ${didYouMean}`) +
    `\n  This is probably a typing mistake. Fixing it will remove this message.`;
  const comment = options.comment;
  const name = (options.title && options.title.warning) || utils$2.WARNING;
  (0, utils$2.logValidationWarning)(name, message, comment);
};

exports.unknownOptionWarning = unknownOptionWarning;
});

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// get the type of a value with handling the edge cases like `typeof []`
// and `typeof null`
function getType(value) {
  if (value === undefined) {
    return 'undefined';
  } else if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  } else if (typeof value === 'function') {
    return 'function';
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'string') {
    return 'string';
  } else if (typeof value === 'bigint') {
    return 'bigint';
  } else if (typeof value === 'object') {
    if (value != null) {
      if (value.constructor === RegExp) {
        return 'regexp';
      } else if (value.constructor === Map) {
        return 'map';
      } else if (value.constructor === Set) {
        return 'set';
      } else if (value.constructor === Date) {
        return 'date';
      }
    }

    return 'object';
  } else if (typeof value === 'symbol') {
    return 'symbol';
  }

  throw new Error(`value of unknown type: ${value}`);
}

getType.isPrimitive = value => Object(value) !== value;

var build$2 = getType;

var condition = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getValues = getValues;
exports.validationCondition = validationCondition;
exports.multipleValidOptions = multipleValidOptions;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const toString = Object.prototype.toString;
const MULTIPLE_VALID_OPTIONS_SYMBOL = Symbol('JEST_MULTIPLE_VALID_OPTIONS');

function validationConditionSingle(option, validOption) {
  return (
    option === null ||
    option === undefined ||
    (typeof option === 'function' && typeof validOption === 'function') ||
    toString.call(option) === toString.call(validOption)
  );
}

function getValues(validOption) {
  if (
    Array.isArray(validOption) && // @ts-expect-error
    validOption[MULTIPLE_VALID_OPTIONS_SYMBOL]
  ) {
    return validOption;
  }

  return [validOption];
}

function validationCondition(option, validOption) {
  return getValues(validOption).some(e => validationConditionSingle(option, e));
}

function multipleValidOptions(...args) {
  const options = [...args]; // @ts-expect-error

  options[MULTIPLE_VALID_OPTIONS_SYMBOL] = true;
  return options;
}
});

var errors = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.errorMessage = void 0;

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}

function _jestGetType() {
  const data = _interopRequireDefault(build$2);

  _jestGetType = function () {
    return data;
  };

  return data;
}





function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const errorMessage = (option, received, defaultValue, options, path) => {
  const conditions = (0, condition.getValues)(defaultValue);
  const validTypes = Array.from(
    new Set(conditions.map(_jestGetType().default))
  );
  const message = `  Option ${_chalk().default.bold(
    `"${path && path.length > 0 ? path.join('.') + '.' : ''}${option}"`
  )} must be of type:
    ${validTypes.map(e => _chalk().default.bold.green(e)).join(' or ')}
  but instead received:
    ${_chalk().default.bold.red((0, _jestGetType().default)(received))}

  Example:
${formatExamples(option, conditions)}`;
  const comment = options.comment;
  const name = (options.title && options.title.error) || utils$2.ERROR;
  throw new utils$2.ValidationError(name, message, comment);
};

exports.errorMessage = errorMessage;

function formatExamples(option, examples) {
  return examples.map(
    e => `  {
    ${_chalk().default.bold(`"${option}"`)}: ${_chalk().default.bold(
      (0, utils$2.formatPrettyObject)(e)
    )}
  }`
  ).join(`

  or

`);
}
});

var defaultConfig = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;











/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const validationOptions = {
  comment: '',
  condition: condition.validationCondition,
  deprecate: deprecated.deprecationWarning,
  deprecatedConfig: {},
  error: errors.errorMessage,
  exampleConfig: {},
  recursive: true,
  // Allow NPM-sanctioned comments in package.json. Use a "//" key.
  recursiveBlacklist: ['//'],
  title: {
    deprecation: utils$2.DEPRECATION,
    error: utils$2.ERROR,
    warning: utils$2.WARNING
  },
  unknown: warnings.unknownOptionWarning
};
var _default = validationOptions;
exports.default = _default;
});

var validate_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

var _defaultConfig = _interopRequireDefault(defaultConfig);



function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
let hasDeprecationWarnings = false;

const shouldSkipValidationForPath = (path, key, blacklist) =>
  blacklist ? blacklist.includes([...path, key].join('.')) : false;

const _validate = (config, exampleConfig, options, path = []) => {
  if (
    typeof config !== 'object' ||
    config == null ||
    typeof exampleConfig !== 'object' ||
    exampleConfig == null
  ) {
    return {
      hasDeprecationWarnings
    };
  }

  for (const key in config) {
    if (
      options.deprecatedConfig &&
      key in options.deprecatedConfig &&
      typeof options.deprecate === 'function'
    ) {
      const isDeprecatedKey = options.deprecate(
        config,
        key,
        options.deprecatedConfig,
        options
      );
      hasDeprecationWarnings = hasDeprecationWarnings || isDeprecatedKey;
    } else if (allowsMultipleTypes(key)) {
      const value = config[key];

      if (
        typeof options.condition === 'function' &&
        typeof options.error === 'function'
      ) {
        if (key === 'maxWorkers' && !isOfTypeStringOrNumber(value)) {
          throw new utils$2.ValidationError(
            'Validation Error',
            `${key} has to be of type string or number`,
            `maxWorkers=50% or\nmaxWorkers=3`
          );
        }
      }
    } else if (Object.hasOwnProperty.call(exampleConfig, key)) {
      if (
        typeof options.condition === 'function' &&
        typeof options.error === 'function' &&
        !options.condition(config[key], exampleConfig[key])
      ) {
        options.error(key, config[key], exampleConfig[key], options, path);
      }
    } else if (
      shouldSkipValidationForPath(path, key, options.recursiveBlacklist)
    ) ; else {
      options.unknown &&
        options.unknown(config, exampleConfig, key, options, path);
    }

    if (
      options.recursive &&
      !Array.isArray(exampleConfig[key]) &&
      options.recursiveBlacklist &&
      !shouldSkipValidationForPath(path, key, options.recursiveBlacklist)
    ) {
      _validate(config[key], exampleConfig[key], options, [...path, key]);
    }
  }

  return {
    hasDeprecationWarnings
  };
};

const allowsMultipleTypes = key => key === 'maxWorkers';

const isOfTypeStringOrNumber = value =>
  typeof value === 'number' || typeof value === 'string';

const validate = (config, options) => {
  hasDeprecationWarnings = false; // Preserve default blacklist entries even with user-supplied blacklist

  const combinedBlacklist = [
    ...(_defaultConfig.default.recursiveBlacklist || []),
    ...(options.recursiveBlacklist || [])
  ];
  const defaultedOptions = Object.assign({
    ..._defaultConfig.default,
    ...options,
    recursiveBlacklist: combinedBlacklist,
    title: options.title || _defaultConfig.default.title
  });

  const {hasDeprecationWarnings: hdw} = _validate(
    config,
    options.exampleConfig,
    defaultedOptions
  );

  return {
    hasDeprecationWarnings: hdw,
    isValid: true
  };
};

var _default = validate;
exports.default = _default;
});

const preserveCamelCase = string => {
	let isLastCharLower = false;
	let isLastCharUpper = false;
	let isLastLastCharUpper = false;

	for (let i = 0; i < string.length; i++) {
		const character = string[i];

		if (isLastCharLower && /[\p{Lu}]/u.test(character)) {
			string = string.slice(0, i) + '-' + string.slice(i);
			isLastCharLower = false;
			isLastLastCharUpper = isLastCharUpper;
			isLastCharUpper = true;
			i++;
		} else if (isLastCharUpper && isLastLastCharUpper && /[\p{Ll}]/u.test(character)) {
			string = string.slice(0, i - 1) + '-' + string.slice(i - 1);
			isLastLastCharUpper = isLastCharUpper;
			isLastCharUpper = false;
			isLastCharLower = true;
		} else {
			isLastCharLower = character.toLocaleLowerCase() === character && character.toLocaleUpperCase() !== character;
			isLastLastCharUpper = isLastCharUpper;
			isLastCharUpper = character.toLocaleUpperCase() === character && character.toLocaleLowerCase() !== character;
		}
	}

	return string;
};

const camelCase = (input, options) => {
	if (!(typeof input === 'string' || Array.isArray(input))) {
		throw new TypeError('Expected the input to be `string | string[]`');
	}

	options = {
		...{pascalCase: false},
		...options
	};

	const postProcess = x => options.pascalCase ? x.charAt(0).toLocaleUpperCase() + x.slice(1) : x;

	if (Array.isArray(input)) {
		input = input.map(x => x.trim())
			.filter(x => x.length)
			.join('-');
	} else {
		input = input.trim();
	}

	if (input.length === 0) {
		return '';
	}

	if (input.length === 1) {
		return options.pascalCase ? input.toLocaleUpperCase() : input.toLocaleLowerCase();
	}

	const hasUpperCase = input !== input.toLocaleLowerCase();

	if (hasUpperCase) {
		input = preserveCamelCase(input);
	}

	input = input
		.replace(/^[_.\- ]+/, '')
		.toLocaleLowerCase()
		.replace(/[_.\- ]+([\p{Alpha}\p{N}_]|$)/gu, (_, p1) => p1.toLocaleUpperCase())
		.replace(/\d+([\p{Alpha}\p{N}_]|$)/gu, m => m.toLocaleUpperCase());

	return postProcess(input);
};

var camelcase = camelCase;
// TODO: Remove this for the next major release
var _default$1 = camelCase;
camelcase.default = _default$1;

var validateCLIOptions_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = validateCLIOptions;
exports.DOCUMENTATION_NOTE = void 0;

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}

function _camelcase() {
  const data = _interopRequireDefault(camelcase);

  _camelcase = function () {
    return data;
  };

  return data;
}





var _defaultConfig = _interopRequireDefault(defaultConfig);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const BULLET = _chalk().default.bold('\u25cf');

const DOCUMENTATION_NOTE = `  ${_chalk().default.bold(
  'CLI Options Documentation:'
)}
  https://jestjs.io/docs/en/cli.html
`;
exports.DOCUMENTATION_NOTE = DOCUMENTATION_NOTE;

const createCLIValidationError = (unrecognizedOptions, allowedOptions) => {
  let title = `${BULLET} Unrecognized CLI Parameter`;
  let message;
  const comment =
    `  ${_chalk().default.bold('CLI Options Documentation')}:\n` +
    `  https://jestjs.io/docs/en/cli.html\n`;

  if (unrecognizedOptions.length === 1) {
    const unrecognized = unrecognizedOptions[0];
    const didYouMeanMessage = (0, utils$2.createDidYouMeanMessage)(
      unrecognized,
      Array.from(allowedOptions)
    );
    message =
      `  Unrecognized option ${_chalk().default.bold(
        (0, utils$2.format)(unrecognized)
      )}.` + (didYouMeanMessage ? ` ${didYouMeanMessage}` : '');
  } else {
    title += 's';
    message =
      `  Following options were not recognized:\n` +
      `  ${_chalk().default.bold((0, utils$2.format)(unrecognizedOptions))}`;
  }

  return new utils$2.ValidationError(title, message, comment);
};

const logDeprecatedOptions = (deprecatedOptions, deprecationEntries, argv) => {
  deprecatedOptions.forEach(opt => {
    (0, deprecated.deprecationWarning)(argv, opt, deprecationEntries, {
      ..._defaultConfig.default,
      comment: DOCUMENTATION_NOTE
    });
  });
};

function validateCLIOptions(argv, options, rawArgv = []) {
  const yargsSpecialOptions = ['$0', '_', 'help', 'h'];
  const deprecationEntries = options.deprecationEntries || {};
  const allowedOptions = Object.keys(options).reduce(
    (acc, option) => acc.add(option).add(options[option].alias || option),
    new Set(yargsSpecialOptions)
  );
  const unrecognizedOptions = Object.keys(argv).filter(
    arg =>
      !allowedOptions.has((0, _camelcase().default)(arg)) &&
      (!rawArgv.length || rawArgv.includes(arg)),
    []
  );

  if (unrecognizedOptions.length) {
    throw createCLIValidationError(unrecognizedOptions, allowedOptions);
  }

  const CLIDeprecations = Object.keys(deprecationEntries).reduce(
    (acc, entry) => {
      if (options[entry]) {
        acc[entry] = deprecationEntries[entry];
        const alias = options[entry].alias;

        if (alias) {
          acc[alias] = deprecationEntries[entry];
        }
      }

      return acc;
    },
    {}
  );
  const deprecations = new Set(Object.keys(CLIDeprecations));
  const deprecatedOptions = Object.keys(argv).filter(
    arg => deprecations.has(arg) && argv[arg] != null
  );

  if (deprecatedOptions.length) {
    logDeprecatedOptions(deprecatedOptions, CLIDeprecations, argv);
  }

  return true;
}
});

var build$3 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
Object.defineProperty(exports, 'ValidationError', {
  enumerable: true,
  get: function () {
    return utils$2.ValidationError;
  }
});
Object.defineProperty(exports, 'createDidYouMeanMessage', {
  enumerable: true,
  get: function () {
    return utils$2.createDidYouMeanMessage;
  }
});
Object.defineProperty(exports, 'format', {
  enumerable: true,
  get: function () {
    return utils$2.format;
  }
});
Object.defineProperty(exports, 'logValidationWarning', {
  enumerable: true,
  get: function () {
    return utils$2.logValidationWarning;
  }
});
Object.defineProperty(exports, 'validate', {
  enumerable: true,
  get: function () {
    return _validate.default;
  }
});
Object.defineProperty(exports, 'validateCLIOptions', {
  enumerable: true,
  get: function () {
    return _validateCLIOptions.default;
  }
});
Object.defineProperty(exports, 'multipleValidOptions', {
  enumerable: true,
  get: function () {
    return condition.multipleValidOptions;
  }
});



var _validate = _interopRequireDefault(validate_1);

var _validateCLIOptions = _interopRequireDefault(
  validateCLIOptions_1
);



function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}
});

var slash = path => {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return path;
	}

	return path.replace(/\\/g, '/');
};

var nodeModulesPaths_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = nodeModulesPaths;

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function _jestUtil() {
  const data = build;

  _jestUtil = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Adapted from: https://github.com/substack/node-resolve
 */
function nodeModulesPaths(basedir, options) {
  const modules =
    options && options.moduleDirectory
      ? Array.from(options.moduleDirectory)
      : ['node_modules']; // ensure that `basedir` is an absolute path at this point,
  // resolving against the process' current working directory

  const basedirAbs = path().resolve(basedir);
  let prefix = '/';

  if (/^([A-Za-z]:)/.test(basedirAbs)) {
    prefix = '';
  } else if (/^\\\\/.test(basedirAbs)) {
    prefix = '\\\\';
  } // The node resolution algorithm (as implemented by NodeJS and TypeScript)
  // traverses parents of the physical path, not the symlinked path

  let physicalBasedir;

  try {
    physicalBasedir = (0, _jestUtil().tryRealpath)(basedirAbs);
  } catch (err) {
    // realpath can throw, e.g. on mapped drives
    physicalBasedir = basedirAbs;
  }

  const paths = [physicalBasedir];
  let parsed = path().parse(physicalBasedir);

  while (parsed.dir !== paths[paths.length - 1]) {
    paths.push(parsed.dir);
    parsed = path().parse(parsed.dir);
  }

  const dirs = paths
    .reduce(
      (dirs, aPath) =>
        dirs.concat(
          modules.map(moduleDir =>
            path().isAbsolute(moduleDir)
              ? aPath === basedirAbs
                ? moduleDir
                : ''
              : path().join(prefix, aPath, moduleDir)
          )
        ),
      []
    )
    .filter(dir => dir !== '');
  return options.paths ? dirs.concat(options.paths) : dirs;
}
});

var isBuiltinModule_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = isBuiltinModule;

function _module() {
  const data = _interopRequireDefault(module$1);

  _module = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const EXPERIMENTAL_MODULES = ['worker_threads'];
const BUILTIN_MODULES = new Set(
  _module().default.builtinModules
    ? _module().default.builtinModules.concat(EXPERIMENTAL_MODULES)
    : Object.keys(process.binding('natives'))
        .filter(module => !/^internal\//.test(module))
        .concat(EXPERIMENTAL_MODULES)
);

function isBuiltinModule(module) {
  return BUILTIN_MODULES.has(module);
}
});

var caller = function () {
    // see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    var origPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) { return stack; };
    var stack = (new Error()).stack;
    Error.prepareStackTrace = origPrepareStackTrace;
    return stack[2].getFileName();
};

var pathParse = createCommonjsModule(function (module) {

var isWindows = process.platform === 'win32';

// Regex to split a windows path into three parts: [*, device, slash,
// tail] windows-only
var splitDeviceRe =
    /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

// Regex to split the tail part of the above into [*, dir, basename, ext]
var splitTailRe =
    /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

var win32 = {};

// Function to split a filename into [root, dir, basename, ext]
function win32SplitPath(filename) {
  // Separate device+slash from tail
  var result = splitDeviceRe.exec(filename),
      device = (result[1] || '') + (result[2] || ''),
      tail = result[3] || '';
  // Split the tail into dir, basename and extension
  var result2 = splitTailRe.exec(tail),
      dir = result2[1],
      basename = result2[2],
      ext = result2[3];
  return [device, dir, basename, ext];
}

win32.parse = function(pathString) {
  if (typeof pathString !== 'string') {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = win32SplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};



// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var posix = {};


function posixSplitPath(filename) {
  return splitPathRe.exec(filename).slice(1);
}


posix.parse = function(pathString) {
  if (typeof pathString !== 'string') {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = posixSplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  allParts[1] = allParts[1] || '';
  allParts[2] = allParts[2] || '';
  allParts[3] = allParts[3] || '';

  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};


if (isWindows)
  module.exports = win32.parse;
else /* posix */
  module.exports = posix.parse;

module.exports.posix = posix.parse;
module.exports.win32 = win32.parse;
});

var parse$2 = path$3.parse || pathParse;

var getNodeModulesDirs = function getNodeModulesDirs(absoluteStart, modules) {
    var prefix = '/';
    if ((/^([A-Za-z]:)/).test(absoluteStart)) {
        prefix = '';
    } else if ((/^\\\\/).test(absoluteStart)) {
        prefix = '\\\\';
    }

    var paths = [absoluteStart];
    var parsed = parse$2(absoluteStart);
    while (parsed.dir !== paths[paths.length - 1]) {
        paths.push(parsed.dir);
        parsed = parse$2(parsed.dir);
    }

    return paths.reduce(function (dirs, aPath) {
        return dirs.concat(modules.map(function (moduleDir) {
            return path$3.resolve(prefix, aPath, moduleDir);
        }));
    }, []);
};

var nodeModulesPaths = function nodeModulesPaths(start, opts, request) {
    var modules = opts && opts.moduleDirectory
        ? [].concat(opts.moduleDirectory)
        : ['node_modules'];

    if (opts && typeof opts.paths === 'function') {
        return opts.paths(
            request,
            start,
            function () { return getNodeModulesDirs(start, modules); },
            opts
        );
    }

    var dirs = getNodeModulesDirs(start, modules);
    return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
};

var normalizeOptions = function (x, opts) {
    /**
     * This file is purposefully a passthrough. It's expected that third-party
     * environments will override it at runtime in order to inject special logic
     * into `resolve` (by manipulating the options). One such example is the PnP
     * code path in Yarn.
     */

    return opts || {};
};

var assert = true;
var async_hooks = ">= 8";
var buffer_ieee754 = "< 0.9.7";
var buffer = true;
var child_process = true;
var cluster = true;
var console$1 = true;
var constants$2 = true;
var crypto = true;
var _debug_agent = ">= 1 && < 8";
var _debugger = "< 8";
var dgram = true;
var dns = true;
var domain = true;
var events = true;
var freelist = "< 6";
var fs = true;
var _http_agent = ">= 0.11.1";
var _http_client = ">= 0.11.1";
var _http_common = ">= 0.11.1";
var _http_incoming = ">= 0.11.1";
var _http_outgoing = ">= 0.11.1";
var _http_server = ">= 0.11.1";
var http = true;
var http2 = ">= 8.8";
var https = true;
var inspector = ">= 8.0.0";
var _linklist = "< 8";
var module = true;
var net = true;
var os = true;
var path$1 = true;
var perf_hooks = ">= 8.5";
var process$1 = ">= 1";
var punycode = true;
var querystring = true;
var readline = true;
var repl = true;
var smalloc = ">= 0.11.5 && < 3";
var _stream_duplex = ">= 0.9.4";
var _stream_transform = ">= 0.9.4";
var _stream_wrap = ">= 1.4.1";
var _stream_passthrough = ">= 0.9.4";
var _stream_readable = ">= 0.9.4";
var _stream_writable = ">= 0.9.4";
var stream = true;
var string_decoder = true;
var sys = true;
var timers = true;
var _tls_common = ">= 0.11.13";
var _tls_legacy = ">= 0.11.3 && < 10";
var _tls_wrap = ">= 0.11.3";
var tls = true;
var trace_events = ">= 10";
var tty = true;
var url = true;
var util$1 = true;
var v8 = ">= 1";
var vm = true;
var wasi = ">= 13.4 && < 13.5";
var worker_threads = ">= 11.7";
var zlib = true;
var core = {
	assert: assert,
	async_hooks: async_hooks,
	buffer_ieee754: buffer_ieee754,
	buffer: buffer,
	child_process: child_process,
	cluster: cluster,
	console: console$1,
	constants: constants$2,
	crypto: crypto,
	_debug_agent: _debug_agent,
	_debugger: _debugger,
	dgram: dgram,
	dns: dns,
	domain: domain,
	events: events,
	freelist: freelist,
	fs: fs,
	"fs/promises": [
	">= 10 && < 10.1",
	">= 14"
],
	_http_agent: _http_agent,
	_http_client: _http_client,
	_http_common: _http_common,
	_http_incoming: _http_incoming,
	_http_outgoing: _http_outgoing,
	_http_server: _http_server,
	http: http,
	http2: http2,
	https: https,
	inspector: inspector,
	_linklist: _linklist,
	module: module,
	net: net,
	"node-inspect/lib/_inspect": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_client": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_repl": ">= 7.6.0 && < 12",
	os: os,
	path: path$1,
	perf_hooks: perf_hooks,
	process: process$1,
	punycode: punycode,
	querystring: querystring,
	readline: readline,
	repl: repl,
	smalloc: smalloc,
	_stream_duplex: _stream_duplex,
	_stream_transform: _stream_transform,
	_stream_wrap: _stream_wrap,
	_stream_passthrough: _stream_passthrough,
	_stream_readable: _stream_readable,
	_stream_writable: _stream_writable,
	stream: stream,
	string_decoder: string_decoder,
	sys: sys,
	timers: timers,
	_tls_common: _tls_common,
	_tls_legacy: _tls_legacy,
	_tls_wrap: _tls_wrap,
	tls: tls,
	trace_events: trace_events,
	tty: tty,
	url: url,
	util: util$1,
	"v8/tools/arguments": ">= 10 && < 12",
	"v8/tools/codemap": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/consarray": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/csvparser": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/logreader": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/profile_view": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/splaytree": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	v8: v8,
	vm: vm,
	wasi: wasi,
	worker_threads: worker_threads,
	zlib: zlib
};

var core$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	assert: assert,
	async_hooks: async_hooks,
	buffer_ieee754: buffer_ieee754,
	buffer: buffer,
	child_process: child_process,
	cluster: cluster,
	console: console$1,
	constants: constants$2,
	crypto: crypto,
	_debug_agent: _debug_agent,
	_debugger: _debugger,
	dgram: dgram,
	dns: dns,
	domain: domain,
	events: events,
	freelist: freelist,
	fs: fs,
	_http_agent: _http_agent,
	_http_client: _http_client,
	_http_common: _http_common,
	_http_incoming: _http_incoming,
	_http_outgoing: _http_outgoing,
	_http_server: _http_server,
	http: http,
	http2: http2,
	https: https,
	inspector: inspector,
	_linklist: _linklist,
	module: module,
	net: net,
	os: os,
	path: path$1,
	perf_hooks: perf_hooks,
	process: process$1,
	punycode: punycode,
	querystring: querystring,
	readline: readline,
	repl: repl,
	smalloc: smalloc,
	_stream_duplex: _stream_duplex,
	_stream_transform: _stream_transform,
	_stream_wrap: _stream_wrap,
	_stream_passthrough: _stream_passthrough,
	_stream_readable: _stream_readable,
	_stream_writable: _stream_writable,
	stream: stream,
	string_decoder: string_decoder,
	sys: sys,
	timers: timers,
	_tls_common: _tls_common,
	_tls_legacy: _tls_legacy,
	_tls_wrap: _tls_wrap,
	tls: tls,
	trace_events: trace_events,
	tty: tty,
	url: url,
	util: util$1,
	v8: v8,
	vm: vm,
	wasi: wasi,
	worker_threads: worker_threads,
	zlib: zlib,
	'default': core
});

var data = getCjsExportFromNamespace(core$1);

var current = (process.versions && process.versions.node && process.versions.node.split('.')) || [];

function specifierIncluded(specifier) {
    var parts = specifier.split(' ');
    var op = parts.length > 1 ? parts[0] : '=';
    var versionParts = (parts.length > 1 ? parts[1] : parts[0]).split('.');

    for (var i = 0; i < 3; ++i) {
        var cur = Number(current[i] || 0);
        var ver = Number(versionParts[i] || 0);
        if (cur === ver) {
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        }
        if (op === '<') {
            return cur < ver;
        } else if (op === '>=') {
            return cur >= ver;
        } else {
            return false;
        }
    }
    return op === '>=';
}

function matchesRange(range) {
    var specifiers = range.split(/ ?&& ?/);
    if (specifiers.length === 0) { return false; }
    for (var i = 0; i < specifiers.length; ++i) {
        if (!specifierIncluded(specifiers[i])) { return false; }
    }
    return true;
}

function versionIncluded(specifierValue) {
    if (typeof specifierValue === 'boolean') { return specifierValue; }
    if (specifierValue && typeof specifierValue === 'object') {
        for (var i = 0; i < specifierValue.length; ++i) {
            if (matchesRange(specifierValue[i])) { return true; }
        }
        return false;
    }
    return matchesRange(specifierValue);
}



var core$2 = {};
for (var mod in data) { // eslint-disable-line no-restricted-syntax
    if (Object.prototype.hasOwnProperty.call(data, mod)) {
        core$2[mod] = versionIncluded(data[mod]);
    }
}
var core_1 = core$2;

var isCore = function isCore(x) {
    return Object.prototype.hasOwnProperty.call(core_1, x);
};

var realpathFS = fs$1.realpath && typeof fs$1.realpath.native === 'function' ? fs$1.realpath.native : fs$1.realpath;

var defaultIsFile = function isFile(file, cb) {
    fs$1.stat(file, function (err, stat) {
        if (!err) {
            return cb(null, stat.isFile() || stat.isFIFO());
        }
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
        return cb(err);
    });
};

var defaultIsDir = function isDirectory(dir, cb) {
    fs$1.stat(dir, function (err, stat) {
        if (!err) {
            return cb(null, stat.isDirectory());
        }
        if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
        return cb(err);
    });
};

var defaultRealpath = function realpath(x, cb) {
    realpathFS(x, function (realpathErr, realPath) {
        if (realpathErr && realpathErr.code !== 'ENOENT') cb(realpathErr);
        else cb(null, realpathErr ? x : realPath);
    });
};

var maybeRealpath = function maybeRealpath(realpath, x, opts, cb) {
    if (opts && opts.preserveSymlinks === false) {
        realpath(x, cb);
    } else {
        cb(null, x);
    }
};

var getPackageCandidates = function getPackageCandidates(x, start, opts) {
    var dirs = nodeModulesPaths(start, opts, x);
    for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path$3.join(dirs[i], x);
    }
    return dirs;
};

var async = function resolve(x, options, callback) {
    var cb = callback;
    var opts = options;
    if (typeof options === 'function') {
        cb = opts;
        opts = {};
    }
    if (typeof x !== 'string') {
        var err = new TypeError('Path must be a string.');
        return process.nextTick(function () {
            cb(err);
        });
    }

    opts = normalizeOptions(x, opts);

    var isFile = opts.isFile || defaultIsFile;
    var isDirectory = opts.isDirectory || defaultIsDir;
    var readFile = opts.readFile || fs$1.readFile;
    var realpath = opts.realpath || defaultRealpath;
    var packageIterator = opts.packageIterator;

    var extensions = opts.extensions || ['.js'];
    var basedir = opts.basedir || path$3.dirname(caller());
    var parent = opts.filename || basedir;

    opts.paths = opts.paths || [];

    // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory
    var absoluteStart = path$3.resolve(basedir);

    maybeRealpath(
        realpath,
        absoluteStart,
        opts,
        function (err, realStart) {
            if (err) cb(err);
            else init(realStart);
        }
    );

    var res;
    function init(basedir) {
        if ((/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/).test(x)) {
            res = path$3.resolve(basedir, x);
            if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';
            if ((/\/$/).test(x) && res === basedir) {
                loadAsDirectory(res, opts.package, onfile);
            } else loadAsFile(res, opts.package, onfile);
        } else if (isCore(x)) {
            return cb(null, x);
        } else loadNodeModules(x, basedir, function (err, n, pkg) {
            if (err) cb(err);
            else if (n) {
                return maybeRealpath(realpath, n, opts, function (err, realN) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, realN, pkg);
                    }
                });
            } else {
                var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
                moduleError.code = 'MODULE_NOT_FOUND';
                cb(moduleError);
            }
        });
    }

    function onfile(err, m, pkg) {
        if (err) cb(err);
        else if (m) cb(null, m, pkg);
        else loadAsDirectory(res, function (err, d, pkg) {
            if (err) cb(err);
            else if (d) {
                maybeRealpath(realpath, d, opts, function (err, realD) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, realD, pkg);
                    }
                });
            } else {
                var moduleError = new Error("Cannot find module '" + x + "' from '" + parent + "'");
                moduleError.code = 'MODULE_NOT_FOUND';
                cb(moduleError);
            }
        });
    }

    function loadAsFile(x, thePackage, callback) {
        var loadAsFilePackage = thePackage;
        var cb = callback;
        if (typeof loadAsFilePackage === 'function') {
            cb = loadAsFilePackage;
            loadAsFilePackage = undefined;
        }

        var exts = [''].concat(extensions);
        load(exts, x, loadAsFilePackage);

        function load(exts, x, loadPackage) {
            if (exts.length === 0) return cb(null, undefined, loadPackage);
            var file = x + exts[0];

            var pkg = loadPackage;
            if (pkg) onpkg(null, pkg);
            else loadpkg(path$3.dirname(file), onpkg);

            function onpkg(err, pkg_, dir) {
                pkg = pkg_;
                if (err) return cb(err);
                if (dir && pkg && opts.pathFilter) {
                    var rfile = path$3.relative(dir, file);
                    var rel = rfile.slice(0, rfile.length - exts[0].length);
                    var r = opts.pathFilter(pkg, x, rel);
                    if (r) return load(
                        [''].concat(extensions.slice()),
                        path$3.resolve(dir, r),
                        pkg
                    );
                }
                isFile(file, onex);
            }
            function onex(err, ex) {
                if (err) return cb(err);
                if (ex) return cb(null, file, pkg);
                load(exts.slice(1), x, pkg);
            }
        }
    }

    function loadpkg(dir, cb) {
        if (dir === '' || dir === '/') return cb(null);
        if (process.platform === 'win32' && (/^\w:[/\\]*$/).test(dir)) {
            return cb(null);
        }
        if ((/[/\\]node_modules[/\\]*$/).test(dir)) return cb(null);

        maybeRealpath(realpath, dir, opts, function (unwrapErr, pkgdir) {
            if (unwrapErr) return loadpkg(path$3.dirname(dir), cb);
            var pkgfile = path$3.join(pkgdir, 'package.json');
            isFile(pkgfile, function (err, ex) {
                // on err, ex is false
                if (!ex) return loadpkg(path$3.dirname(dir), cb);

                readFile(pkgfile, function (err, body) {
                    if (err) cb(err);
                    try { var pkg = JSON.parse(body); } catch (jsonErr) {}

                    if (pkg && opts.packageFilter) {
                        pkg = opts.packageFilter(pkg, pkgfile);
                    }
                    cb(null, pkg, dir);
                });
            });
        });
    }

    function loadAsDirectory(x, loadAsDirectoryPackage, callback) {
        var cb = callback;
        var fpkg = loadAsDirectoryPackage;
        if (typeof fpkg === 'function') {
            cb = fpkg;
            fpkg = opts.package;
        }

        maybeRealpath(realpath, x, opts, function (unwrapErr, pkgdir) {
            if (unwrapErr) return cb(unwrapErr);
            var pkgfile = path$3.join(pkgdir, 'package.json');
            isFile(pkgfile, function (err, ex) {
                if (err) return cb(err);
                if (!ex) return loadAsFile(path$3.join(x, 'index'), fpkg, cb);

                readFile(pkgfile, function (err, body) {
                    if (err) return cb(err);
                    try {
                        var pkg = JSON.parse(body);
                    } catch (jsonErr) {}

                    if (pkg && opts.packageFilter) {
                        pkg = opts.packageFilter(pkg, pkgfile);
                    }

                    if (pkg && pkg.main) {
                        if (typeof pkg.main !== 'string') {
                            var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
                            mainError.code = 'INVALID_PACKAGE_MAIN';
                            return cb(mainError);
                        }
                        if (pkg.main === '.' || pkg.main === './') {
                            pkg.main = 'index';
                        }
                        loadAsFile(path$3.resolve(x, pkg.main), pkg, function (err, m, pkg) {
                            if (err) return cb(err);
                            if (m) return cb(null, m, pkg);
                            if (!pkg) return loadAsFile(path$3.join(x, 'index'), pkg, cb);

                            var dir = path$3.resolve(x, pkg.main);
                            loadAsDirectory(dir, pkg, function (err, n, pkg) {
                                if (err) return cb(err);
                                if (n) return cb(null, n, pkg);
                                loadAsFile(path$3.join(x, 'index'), pkg, cb);
                            });
                        });
                        return;
                    }

                    loadAsFile(path$3.join(x, '/index'), pkg, cb);
                });
            });
        });
    }

    function processDirs(cb, dirs) {
        if (dirs.length === 0) return cb(null, undefined);
        var dir = dirs[0];

        isDirectory(path$3.dirname(dir), isdir);

        function isdir(err, isdir) {
            if (err) return cb(err);
            if (!isdir) return processDirs(cb, dirs.slice(1));
            loadAsFile(dir, opts.package, onfile);
        }

        function onfile(err, m, pkg) {
            if (err) return cb(err);
            if (m) return cb(null, m, pkg);
            loadAsDirectory(dir, opts.package, ondir);
        }

        function ondir(err, n, pkg) {
            if (err) return cb(err);
            if (n) return cb(null, n, pkg);
            processDirs(cb, dirs.slice(1));
        }
    }
    function loadNodeModules(x, start, cb) {
        var thunk = function () { return getPackageCandidates(x, start, opts); };
        processDirs(
            cb,
            packageIterator ? packageIterator(x, start, thunk, opts) : thunk()
        );
    }
};

var realpathFS$1 = fs$1.realpathSync && typeof fs$1.realpathSync.native === 'function' ? fs$1.realpathSync.native : fs$1.realpathSync;

var defaultIsFile$1 = function isFile(file) {
    try {
        var stat = fs$1.statSync(file);
    } catch (e) {
        if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
        throw e;
    }
    return stat.isFile() || stat.isFIFO();
};

var defaultIsDir$1 = function isDirectory(dir) {
    try {
        var stat = fs$1.statSync(dir);
    } catch (e) {
        if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
        throw e;
    }
    return stat.isDirectory();
};

var defaultRealpathSync = function realpathSync(x) {
    try {
        return realpathFS$1(x);
    } catch (realpathErr) {
        if (realpathErr.code !== 'ENOENT') {
            throw realpathErr;
        }
    }
    return x;
};

var maybeRealpathSync = function maybeRealpathSync(realpathSync, x, opts) {
    if (opts && opts.preserveSymlinks === false) {
        return realpathSync(x);
    }
    return x;
};

var getPackageCandidates$1 = function getPackageCandidates(x, start, opts) {
    var dirs = nodeModulesPaths(start, opts, x);
    for (var i = 0; i < dirs.length; i++) {
        dirs[i] = path$3.join(dirs[i], x);
    }
    return dirs;
};

var sync = function resolveSync(x, options) {
    if (typeof x !== 'string') {
        throw new TypeError('Path must be a string.');
    }
    var opts = normalizeOptions(x, options);

    var isFile = opts.isFile || defaultIsFile$1;
    var readFileSync = opts.readFileSync || fs$1.readFileSync;
    var isDirectory = opts.isDirectory || defaultIsDir$1;
    var realpathSync = opts.realpathSync || defaultRealpathSync;
    var packageIterator = opts.packageIterator;

    var extensions = opts.extensions || ['.js'];
    var basedir = opts.basedir || path$3.dirname(caller());
    var parent = opts.filename || basedir;

    opts.paths = opts.paths || [];

    // ensure that `basedir` is an absolute path at this point, resolving against the process' current working directory
    var absoluteStart = maybeRealpathSync(realpathSync, path$3.resolve(basedir), opts);

    if ((/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/).test(x)) {
        var res = path$3.resolve(absoluteStart, x);
        if (x === '.' || x === '..' || x.slice(-1) === '/') res += '/';
        var m = loadAsFileSync(res) || loadAsDirectorySync(res);
        if (m) return maybeRealpathSync(realpathSync, m, opts);
    } else if (isCore(x)) {
        return x;
    } else {
        var n = loadNodeModulesSync(x, absoluteStart);
        if (n) return maybeRealpathSync(realpathSync, n, opts);
    }

    var err = new Error("Cannot find module '" + x + "' from '" + parent + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;

    function loadAsFileSync(x) {
        var pkg = loadpkg(path$3.dirname(x));

        if (pkg && pkg.dir && pkg.pkg && opts.pathFilter) {
            var rfile = path$3.relative(pkg.dir, x);
            var r = opts.pathFilter(pkg.pkg, x, rfile);
            if (r) {
                x = path$3.resolve(pkg.dir, r); // eslint-disable-line no-param-reassign
            }
        }

        if (isFile(x)) {
            return x;
        }

        for (var i = 0; i < extensions.length; i++) {
            var file = x + extensions[i];
            if (isFile(file)) {
                return file;
            }
        }
    }

    function loadpkg(dir) {
        if (dir === '' || dir === '/') return;
        if (process.platform === 'win32' && (/^\w:[/\\]*$/).test(dir)) {
            return;
        }
        if ((/[/\\]node_modules[/\\]*$/).test(dir)) return;

        var pkgfile = path$3.join(maybeRealpathSync(realpathSync, dir, opts), 'package.json');

        if (!isFile(pkgfile)) {
            return loadpkg(path$3.dirname(dir));
        }

        var body = readFileSync(pkgfile);

        try {
            var pkg = JSON.parse(body);
        } catch (jsonErr) {}

        if (pkg && opts.packageFilter) {
            // v2 will pass pkgfile
            pkg = opts.packageFilter(pkg, /*pkgfile,*/ dir); // eslint-disable-line spaced-comment
        }

        return { pkg: pkg, dir: dir };
    }

    function loadAsDirectorySync(x) {
        var pkgfile = path$3.join(maybeRealpathSync(realpathSync, x, opts), '/package.json');
        if (isFile(pkgfile)) {
            try {
                var body = readFileSync(pkgfile, 'UTF8');
                var pkg = JSON.parse(body);
            } catch (e) {}

            if (pkg && opts.packageFilter) {
                // v2 will pass pkgfile
                pkg = opts.packageFilter(pkg, /*pkgfile,*/ x); // eslint-disable-line spaced-comment
            }

            if (pkg && pkg.main) {
                if (typeof pkg.main !== 'string') {
                    var mainError = new TypeError('package “' + pkg.name + '” `main` must be a string');
                    mainError.code = 'INVALID_PACKAGE_MAIN';
                    throw mainError;
                }
                if (pkg.main === '.' || pkg.main === './') {
                    pkg.main = 'index';
                }
                try {
                    var m = loadAsFileSync(path$3.resolve(x, pkg.main));
                    if (m) return m;
                    var n = loadAsDirectorySync(path$3.resolve(x, pkg.main));
                    if (n) return n;
                } catch (e) {}
            }
        }

        return loadAsFileSync(path$3.join(x, '/index'));
    }

    function loadNodeModulesSync(x, start) {
        var thunk = function () { return getPackageCandidates$1(x, start, opts); };
        var dirs = packageIterator ? packageIterator(x, start, thunk, opts) : thunk();

        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            if (isDirectory(path$3.dirname(dir))) {
                var m = loadAsFileSync(dir);
                if (m) return m;
                var n = loadAsDirectorySync(dir);
                if (n) return n;
            }
        }
    }
};

async.core = core_1;
async.isCore = isCore;
async.sync = sync;

var resolve = async;

var createRequire = (filename) => {
  // Added in Node v12.2.0
  if (module$1.createRequire) {
    return module$1.createRequire(filename);
  }

  // Added in Node v10.12.0 and deprecated since Node v12.2.0
  if (module$1.createRequireFromPath) {
    return module$1.createRequireFromPath(filename);
  }

  // Polyfill
  return _createRequire(filename);
};

// Polyfill
function _createRequire (filename) {
  const mod = new module$1.Module(filename, null);
  mod.filename = filename;
  mod.paths = module$1.Module._nodeModulePaths(path.dirname(filename));
  mod._compile(`module.exports = require;`, filename);
  return mod.exports
}

let defaultResolver;

var getDefaultResolver = () => {
  if (!defaultResolver) {
    try {
      defaultResolver = defaultResolver_1.default;
    } catch (error) {
      defaultResolver = default_resolver.default;
    }
  }

  return defaultResolver;
};

let globalPnpApi;
try {
    globalPnpApi = pnpapi;
} catch {
    // Just ignore if we don't have a global PnP instance - perhaps
    // we'll eventually find one at runtime due to multi-tree
}




var jestPnpResolver = (request, options) => {
  const {basedir, defaultResolver, extensions} = options;

  if (process.versions.pnp) {
    let pnpApi = globalPnpApi;

    // While technically it would be more correct to run this code
    // everytime (since they file being run *may* belong to a
    // different dependency tree than the one owning Jest), in
    // practice this doesn't happen anywhere else than on the Jest
    // repository itself (in the test env). So in order to preserve
    // the performances, we can afford a slight incoherence here.
    if (!pnpApi) {
      try {
        const baseReq = createRequire(`${basedir}/internal.js`);
        pnpApi = baseReq(`pnpapi`);
      } catch {
        // The file isn't part of a PnP dependency tree, so we can
        // just use the default Jest resolver.
      }
    }

    if (pnpApi) {
      const resolution = pnpApi.resolveRequest(request, `${basedir}/`, {extensions});

      // When the request is a native module, Jest expects to get the string back unmodified, but pnp returns null instead.
      if (resolution === null)
        return request;

      return resolution;
    }
  }

  if (!defaultResolver)
    defaultResolver = getDefaultResolver();

  return defaultResolver(request, {...options, allowPnp: false});
};

var defaultResolver_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = defaultResolver;
exports.clearDefaultResolverCache = clearDefaultResolverCache;

function fs() {
  const data = _interopRequireWildcard(gracefulFs);

  fs = function () {
    return data;
  };

  return data;
}

function _resolve() {
  const data = resolve;

  _resolve = function () {
    return data;
  };

  return data;
}

function _jestPnpResolver() {
  const data = _interopRequireDefault(jestPnpResolver);

  _jestPnpResolver = function () {
    return data;
  };

  return data;
}

function _jestUtil() {
  const data = build;

  _jestUtil = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function defaultResolver(path, options) {
  if (process.versions.pnp && options.allowPnp !== false) {
    return (0, _jestPnpResolver().default)(path, options);
  }

  const result = (0, _resolve().sync)(path, {
    basedir: options.basedir,
    extensions: options.extensions,
    isDirectory,
    isFile,
    moduleDirectory: options.moduleDirectory,
    paths: options.paths,
    preserveSymlinks: false,
    realpathSync
  }); // Dereference symlinks to ensure we don't create a separate
  // module instance depending on how it was referenced.

  return realpathSync(result);
}

function clearDefaultResolverCache() {
  checkedPaths.clear();
  checkedRealpathPaths.clear();
}

var IPathType;

(function (IPathType) {
  IPathType[(IPathType['FILE'] = 1)] = 'FILE';
  IPathType[(IPathType['DIRECTORY'] = 2)] = 'DIRECTORY';
  IPathType[(IPathType['OTHER'] = 3)] = 'OTHER';
})(IPathType || (IPathType = {}));

const checkedPaths = new Map();

function statSyncCached(path) {
  const result = checkedPaths.get(path);

  if (result !== undefined) {
    return result;
  }

  let stat;

  try {
    stat = fs().statSync(path);
  } catch (e) {
    if (!(e && (e.code === 'ENOENT' || e.code === 'ENOTDIR'))) {
      throw e;
    }
  }

  if (stat) {
    if (stat.isFile() || stat.isFIFO()) {
      checkedPaths.set(path, IPathType.FILE);
      return IPathType.FILE;
    } else if (stat.isDirectory()) {
      checkedPaths.set(path, IPathType.DIRECTORY);
      return IPathType.DIRECTORY;
    }
  }

  checkedPaths.set(path, IPathType.OTHER);
  return IPathType.OTHER;
}

const checkedRealpathPaths = new Map();

function realpathCached(path) {
  let result = checkedRealpathPaths.get(path);

  if (result !== undefined) {
    return result;
  }

  result = (0, _jestUtil().tryRealpath)(path);
  checkedRealpathPaths.set(path, result);

  if (path !== result) {
    // also cache the result in case it's ever referenced directly - no reason to `realpath` that as well
    checkedRealpathPaths.set(result, result);
  }

  return result;
}
/*
 * helper functions
 */

function isFile(file) {
  return statSyncCached(file) === IPathType.FILE;
}

function isDirectory(dir) {
  return statSyncCached(dir) === IPathType.DIRECTORY;
}

function realpathSync(file) {
  return realpathCached(file);
}
});

var ModuleNotFoundError_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function _slash() {
  const data = _interopRequireDefault(slash);

  _slash = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

class ModuleNotFoundError extends Error {
  constructor(message, moduleName) {
    super(message);

    _defineProperty(this, 'code', 'MODULE_NOT_FOUND');

    _defineProperty(this, 'hint', void 0);

    _defineProperty(this, 'requireStack', void 0);

    _defineProperty(this, 'siblingWithSimilarExtensionFound', void 0);

    _defineProperty(this, 'moduleName', void 0);

    _defineProperty(this, '_originalMessage', void 0);

    this._originalMessage = message;
    this.moduleName = moduleName;
  }

  buildMessage(rootDir) {
    var _this$requireStack;

    if (!this._originalMessage) {
      this._originalMessage = this.message || '';
    }

    let message = this._originalMessage;

    if (
      ((_this$requireStack = this.requireStack) === null ||
      _this$requireStack === void 0
        ? void 0
        : _this$requireStack.length) &&
      this.requireStack.length > 1
    ) {
      message += `

Require stack:
  ${this.requireStack
    .map(p => p.replace(`${rootDir}${path().sep}`, ''))
    .map(_slash().default)
    .join('\n  ')}
`;
    }

    if (this.hint) {
      message += this.hint;
    }

    this.message = message;
  }

  static duckType(error) {
    error.buildMessage = ModuleNotFoundError.prototype.buildMessage;
    return error;
  }
}

exports.default = ModuleNotFoundError;
});

const pTry = (fn, ...arguments_) => new Promise(resolve => {
	resolve(fn(...arguments_));
});

var pTry_1 = pTry;
// TODO: remove this in the next major version
var _default$2 = pTry;
pTry_1.default = _default$2;

const pLimit = concurrency => {
	if (!((Number.isInteger(concurrency) || concurrency === Infinity) && concurrency > 0)) {
		return Promise.reject(new TypeError('Expected `concurrency` to be a number from 1 and up'));
	}

	const queue = [];
	let activeCount = 0;

	const next = () => {
		activeCount--;

		if (queue.length > 0) {
			queue.shift()();
		}
	};

	const run = (fn, resolve, ...args) => {
		activeCount++;

		const result = pTry_1(fn, ...args);

		resolve(result);

		result.then(next, next);
	};

	const enqueue = (fn, resolve, ...args) => {
		if (activeCount < concurrency) {
			run(fn, resolve, ...args);
		} else {
			queue.push(run.bind(null, fn, resolve, ...args));
		}
	};

	const generator = (fn, ...args) => new Promise(resolve => enqueue(fn, resolve, ...args));
	Object.defineProperties(generator, {
		activeCount: {
			get: () => activeCount
		},
		pendingCount: {
			get: () => queue.length
		},
		clearQueue: {
			value: () => {
				queue.length = 0;
			}
		}
	});

	return generator;
};

var pLimit_1 = pLimit;
var _default$3 = pLimit;
pLimit_1.default = _default$3;

class EndError extends Error {
	constructor(value) {
		super();
		this.value = value;
	}
}

// The input can also be a promise, so we await it
const testElement = async (element, tester) => tester(await element);

// The input can also be a promise, so we `Promise.all()` them both
const finder = async element => {
	const values = await Promise.all(element);
	if (values[1] === true) {
		throw new EndError(values[0]);
	}

	return false;
};

const pLocate = async (iterable, tester, options) => {
	options = {
		concurrency: Infinity,
		preserveOrder: true,
		...options
	};

	const limit = pLimit_1(options.concurrency);

	// Start all the promises concurrently with optional limit
	const items = [...iterable].map(element => [element, limit(testElement, element, tester)]);

	// Check the promises either serially or concurrently
	const checkLimit = pLimit_1(options.preserveOrder ? 1 : Infinity);

	try {
		await Promise.all(items.map(element => checkLimit(finder, element)));
	} catch (error) {
		if (error instanceof EndError) {
			return error.value;
		}

		throw error;
	}
};

var pLocate_1 = pLocate;
// TODO: Remove this for the next major release
var _default$4 = pLocate;
pLocate_1.default = _default$4;

const {promisify} = util$2;


const fsStat = promisify(fs$1.stat);
const fsLStat = promisify(fs$1.lstat);

const typeMappings = {
	directory: 'isDirectory',
	file: 'isFile'
};

function checkType({type}) {
	if (type in typeMappings) {
		return;
	}

	throw new Error(`Invalid type specified: ${type}`);
}

const matchType = (type, stat) => type === undefined || stat[typeMappings[type]]();

var locatePath = async (paths, options) => {
	options = {
		cwd: process.cwd(),
		type: 'file',
		allowSymlinks: true,
		...options
	};
	checkType(options);
	const statFn = options.allowSymlinks ? fsStat : fsLStat;

	return pLocate_1(paths, async path_ => {
		try {
			const stat = await statFn(path$3.resolve(options.cwd, path_));
			return matchType(options.type, stat);
		} catch (_) {
			return false;
		}
	}, options);
};

var sync$1 = (paths, options) => {
	options = {
		cwd: process.cwd(),
		allowSymlinks: true,
		type: 'file',
		...options
	};
	checkType(options);
	const statFn = options.allowSymlinks ? fs$1.statSync : fs$1.lstatSync;

	for (const path_ of paths) {
		try {
			const stat = statFn(path$3.resolve(options.cwd, path_));

			if (matchType(options.type, stat)) {
				return path_;
			}
		} catch (_) {
		}
	}
};
locatePath.sync = sync$1;

const {promisify: promisify$1} = util$2;

const pAccess = promisify$1(fs$1.access);

var pathExists = async path => {
	try {
		await pAccess(path);
		return true;
	} catch (_) {
		return false;
	}
};

var sync$2 = path => {
	try {
		fs$1.accessSync(path);
		return true;
	} catch (_) {
		return false;
	}
};
pathExists.sync = sync$2;

var findUp = createCommonjsModule(function (module) {




const stop = Symbol('findUp.stop');

module.exports = async (name, options = {}) => {
	let directory = path$3.resolve(options.cwd || '');
	const {root} = path$3.parse(directory);
	const paths = [].concat(name);

	const runMatcher = async locateOptions => {
		if (typeof name !== 'function') {
			return locatePath(paths, locateOptions);
		}

		const foundPath = await name(locateOptions.cwd);
		if (typeof foundPath === 'string') {
			return locatePath([foundPath], locateOptions);
		}

		return foundPath;
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		const foundPath = await runMatcher({...options, cwd: directory});

		if (foundPath === stop) {
			return;
		}

		if (foundPath) {
			return path$3.resolve(directory, foundPath);
		}

		if (directory === root) {
			return;
		}

		directory = path$3.dirname(directory);
	}
};

module.exports.sync = (name, options = {}) => {
	let directory = path$3.resolve(options.cwd || '');
	const {root} = path$3.parse(directory);
	const paths = [].concat(name);

	const runMatcher = locateOptions => {
		if (typeof name !== 'function') {
			return locatePath.sync(paths, locateOptions);
		}

		const foundPath = name(locateOptions.cwd);
		if (typeof foundPath === 'string') {
			return locatePath.sync([foundPath], locateOptions);
		}

		return foundPath;
	};

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const foundPath = runMatcher({...options, cwd: directory});

		if (foundPath === stop) {
			return;
		}

		if (foundPath) {
			return path$3.resolve(directory, foundPath);
		}

		if (directory === root) {
			return;
		}

		directory = path$3.dirname(directory);
	}
};

module.exports.exists = pathExists;

module.exports.sync.exists = pathExists.sync;

module.exports.stop = stop;
});

var isArrayish = function isArrayish(obj) {
	if (!obj) {
		return false;
	}

	return obj instanceof Array || Array.isArray(obj) ||
		(obj.length >= 0 && obj.splice instanceof Function);
};

var errorEx = function errorEx(name, properties) {
	if (!name || name.constructor !== String) {
		properties = name || {};
		name = Error.name;
	}

	var errorExError = function ErrorEXError(message) {
		if (!this) {
			return new ErrorEXError(message);
		}

		message = message instanceof Error
			? message.message
			: (message || this.message);

		Error.call(this, message);
		Error.captureStackTrace(this, errorExError);

		this.name = name;

		Object.defineProperty(this, 'message', {
			configurable: true,
			enumerable: false,
			get: function () {
				var newMessage = message.split(/\r?\n/g);

				for (var key in properties) {
					if (!properties.hasOwnProperty(key)) {
						continue;
					}

					var modifier = properties[key];

					if ('message' in modifier) {
						newMessage = modifier.message(this[key], newMessage) || newMessage;
						if (!isArrayish(newMessage)) {
							newMessage = [newMessage];
						}
					}
				}

				return newMessage.join('\n');
			},
			set: function (v) {
				message = v;
			}
		});

		var overwrittenStack = null;

		var stackDescriptor = Object.getOwnPropertyDescriptor(this, 'stack');
		var stackGetter = stackDescriptor.get;
		var stackValue = stackDescriptor.value;
		delete stackDescriptor.value;
		delete stackDescriptor.writable;

		stackDescriptor.set = function (newstack) {
			overwrittenStack = newstack;
		};

		stackDescriptor.get = function () {
			var stack = (overwrittenStack || ((stackGetter)
				? stackGetter.call(this)
				: stackValue)).split(/\r?\n+/g);

			// starting in Node 7, the stack builder caches the message.
			// just replace it.
			if (!overwrittenStack) {
				stack[0] = this.name + ': ' + this.message;
			}

			var lineCount = 1;
			for (var key in properties) {
				if (!properties.hasOwnProperty(key)) {
					continue;
				}

				var modifier = properties[key];

				if ('line' in modifier) {
					var line = modifier.line(this[key]);
					if (line) {
						stack.splice(lineCount++, 0, '    ' + line);
					}
				}

				if ('stack' in modifier) {
					modifier.stack(this[key], stack);
				}
			}

			return stack.join('\n');
		};

		Object.defineProperty(this, 'stack', stackDescriptor);
	};

	if (Object.setPrototypeOf) {
		Object.setPrototypeOf(errorExError.prototype, Error.prototype);
		Object.setPrototypeOf(errorExError, Error);
	} else {
		util$2.inherits(errorExError, Error);
	}

	return errorExError;
};

errorEx.append = function (str, def) {
	return {
		message: function (v, message) {
			v = v || def;

			if (v) {
				message[0] += ' ' + str.replace('%s', v.toString());
			}

			return message;
		}
	};
};

errorEx.line = function (str, def) {
	return {
		line: function (v) {
			v = v || def;

			if (v) {
				return str.replace('%s', v.toString());
			}

			return null;
		}
	};
};

var errorEx_1 = errorEx;

var jsonParseBetterErrors = parseJson;
function parseJson (txt, reviver, context) {
  context = context || 20;
  try {
    return JSON.parse(txt, reviver)
  } catch (e) {
    if (typeof txt !== 'string') {
      const isEmptyArray = Array.isArray(txt) && txt.length === 0;
      const errorMessage = 'Cannot parse ' +
      (isEmptyArray ? 'an empty array' : String(txt));
      throw new TypeError(errorMessage)
    }
    const syntaxErr = e.message.match(/^Unexpected token.*position\s+(\d+)/i);
    const errIdx = syntaxErr
    ? +syntaxErr[1]
    : e.message.match(/^Unexpected end of JSON.*/i)
    ? txt.length - 1
    : null;
    if (errIdx != null) {
      const start = errIdx <= context
      ? 0
      : errIdx - context;
      const end = errIdx + context >= txt.length
      ? txt.length
      : errIdx + context;
      e.message += ` while parsing near '${
        start === 0 ? '' : '...'
      }${txt.slice(start, end)}${
        end === txt.length ? '' : '...'
      }'`;
    } else {
      e.message += ` while parsing '${txt.slice(0, context * 2)}'`;
    }
    throw e
  }
}

var LF = '\n';
var CR = '\r';
var LinesAndColumns = (function () {
    function LinesAndColumns(string) {
        this.string = string;
        var offsets = [0];
        for (var offset = 0; offset < string.length;) {
            switch (string[offset]) {
                case LF:
                    offset += LF.length;
                    offsets.push(offset);
                    break;
                case CR:
                    offset += CR.length;
                    if (string[offset] === LF) {
                        offset += LF.length;
                    }
                    offsets.push(offset);
                    break;
                default:
                    offset++;
                    break;
            }
        }
        this.offsets = offsets;
    }
    LinesAndColumns.prototype.locationForIndex = function (index) {
        if (index < 0 || index > this.string.length) {
            return null;
        }
        var line = 0;
        var offsets = this.offsets;
        while (offsets[line + 1] <= index) {
            line++;
        }
        var column = index - offsets[line];
        return { line: line, column: column };
    };
    LinesAndColumns.prototype.indexForLocation = function (location) {
        var line = location.line, column = location.column;
        if (line < 0 || line >= this.offsets.length) {
            return null;
        }
        if (column < 0 || column > this.lengthOfLine(line)) {
            return null;
        }
        return this.offsets[line] + column;
    };
    LinesAndColumns.prototype.lengthOfLine = function (line) {
        var offset = this.offsets[line];
        var nextOffset = line === this.offsets.length - 1 ? this.string.length : this.offsets[line + 1];
        return nextOffset - offset;
    };
    return LinesAndColumns;
}());

var dist = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': LinesAndColumns
});

var jsTokens = createCommonjsModule(function (module, exports) {
// Copyright 2014, 2015, 2016, 2017, 2018 Simon Lydell
// License: MIT. (See LICENSE.)

Object.defineProperty(exports, "__esModule", {
  value: true
});

// This regex comes from regex.coffee, and is inserted here by generate-index.js
// (run `npm run build`).
exports.default = /((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyus]{1,6}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g;

exports.matchToToken = function(match) {
  var token = {type: "invalid", value: match[0], closed: undefined};
       if (match[ 1]) token.type = "string" , token.closed = !!(match[3] || match[4]);
  else if (match[ 5]) token.type = "comment";
  else if (match[ 6]) token.type = "comment", token.closed = !!match[7];
  else if (match[ 8]) token.type = "regex";
  else if (match[ 9]) token.type = "number";
  else if (match[10]) token.type = "name";
  else if (match[11]) token.type = "punctuator";
  else if (match[12]) token.type = "whitespace";
  return token
};
});

var identifier = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isIdentifierStart = isIdentifierStart;
exports.isIdentifierChar = isIdentifierChar;
exports.isIdentifierName = isIdentifierName;
let nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08c7\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d04-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9ffc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7bf\ua7c2-\ua7ca\ua7f5-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab69\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
let nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d3-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b55-\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d81-\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1abf\u1ac0\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1df9\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua82c\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
const nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
const nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;
const astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 349, 41, 7, 1, 79, 28, 11, 0, 9, 21, 107, 20, 28, 22, 13, 52, 76, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 85, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 159, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 230, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 35, 56, 264, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 328, 18, 190, 0, 80, 921, 103, 110, 18, 195, 2749, 1070, 4050, 582, 8634, 568, 8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 689, 63, 129, 74, 6, 0, 67, 12, 65, 1, 2, 0, 29, 6135, 9, 1237, 43, 8, 8952, 286, 50, 2, 18, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 2357, 44, 11, 6, 17, 0, 370, 43, 1301, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42717, 35, 4148, 12, 221, 3, 5761, 15, 7472, 3104, 541, 1507, 4938];
const astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 370, 1, 154, 10, 176, 2, 54, 14, 32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 161, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 193, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 84, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 406, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 330, 3, 19306, 9, 135, 4, 60, 6, 26, 9, 1014, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 262, 6, 10, 9, 419, 13, 1495, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];

function isInAstralSet(code, set) {
  let pos = 0x10000;

  for (let i = 0, length = set.length; i < length; i += 2) {
    pos += set[i];
    if (pos > code) return false;
    pos += set[i + 1];
    if (pos >= code) return true;
  }

  return false;
}

function isIdentifierStart(code) {
  if (code < 65) return code === 36;
  if (code <= 90) return true;
  if (code < 97) return code === 95;
  if (code <= 122) return true;

  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }

  return isInAstralSet(code, astralIdentifierStartCodes);
}

function isIdentifierChar(code) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code <= 90) return true;
  if (code < 97) return code === 95;
  if (code <= 122) return true;

  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  }

  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}

function isIdentifierName(name) {
  let isFirst = true;

  for (let _i = 0, _Array$from = Array.from(name); _i < _Array$from.length; _i++) {
    const char = _Array$from[_i];
    const cp = char.codePointAt(0);

    if (isFirst) {
      if (!isIdentifierStart(cp)) {
        return false;
      }

      isFirst = false;
    } else if (!isIdentifierChar(cp)) {
      return false;
    }
  }

  return !isFirst;
}
});

var keyword = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isReservedWord = isReservedWord;
exports.isStrictReservedWord = isStrictReservedWord;
exports.isStrictBindOnlyReservedWord = isStrictBindOnlyReservedWord;
exports.isStrictBindReservedWord = isStrictBindReservedWord;
exports.isKeyword = isKeyword;
const reservedWords = {
  keyword: ["break", "case", "catch", "continue", "debugger", "default", "do", "else", "finally", "for", "function", "if", "return", "switch", "throw", "try", "var", "const", "while", "with", "new", "this", "super", "class", "extends", "export", "import", "null", "true", "false", "in", "instanceof", "typeof", "void", "delete"],
  strict: ["implements", "interface", "let", "package", "private", "protected", "public", "static", "yield"],
  strictBind: ["eval", "arguments"]
};
const keywords = new Set(reservedWords.keyword);
const reservedWordsStrictSet = new Set(reservedWords.strict);
const reservedWordsStrictBindSet = new Set(reservedWords.strictBind);

function isReservedWord(word, inModule) {
  return inModule && word === "await" || word === "enum";
}

function isStrictReservedWord(word, inModule) {
  return isReservedWord(word, inModule) || reservedWordsStrictSet.has(word);
}

function isStrictBindOnlyReservedWord(word) {
  return reservedWordsStrictBindSet.has(word);
}

function isStrictBindReservedWord(word, inModule) {
  return isStrictReservedWord(word, inModule) || isStrictBindOnlyReservedWord(word);
}

function isKeyword(word) {
  return keywords.has(word);
}
});

var lib = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "isIdentifierName", {
  enumerable: true,
  get: function () {
    return identifier.isIdentifierName;
  }
});
Object.defineProperty(exports, "isIdentifierChar", {
  enumerable: true,
  get: function () {
    return identifier.isIdentifierChar;
  }
});
Object.defineProperty(exports, "isIdentifierStart", {
  enumerable: true,
  get: function () {
    return identifier.isIdentifierStart;
  }
});
Object.defineProperty(exports, "isReservedWord", {
  enumerable: true,
  get: function () {
    return keyword.isReservedWord;
  }
});
Object.defineProperty(exports, "isStrictBindOnlyReservedWord", {
  enumerable: true,
  get: function () {
    return keyword.isStrictBindOnlyReservedWord;
  }
});
Object.defineProperty(exports, "isStrictBindReservedWord", {
  enumerable: true,
  get: function () {
    return keyword.isStrictBindReservedWord;
  }
});
Object.defineProperty(exports, "isStrictReservedWord", {
  enumerable: true,
  get: function () {
    return keyword.isStrictReservedWord;
  }
});
Object.defineProperty(exports, "isKeyword", {
  enumerable: true,
  get: function () {
    return keyword.isKeyword;
  }
});
});

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

var escapeStringRegexp = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

var colorName$1 = {
	"aliceblue": [240, 248, 255],
	"antiquewhite": [250, 235, 215],
	"aqua": [0, 255, 255],
	"aquamarine": [127, 255, 212],
	"azure": [240, 255, 255],
	"beige": [245, 245, 220],
	"bisque": [255, 228, 196],
	"black": [0, 0, 0],
	"blanchedalmond": [255, 235, 205],
	"blue": [0, 0, 255],
	"blueviolet": [138, 43, 226],
	"brown": [165, 42, 42],
	"burlywood": [222, 184, 135],
	"cadetblue": [95, 158, 160],
	"chartreuse": [127, 255, 0],
	"chocolate": [210, 105, 30],
	"coral": [255, 127, 80],
	"cornflowerblue": [100, 149, 237],
	"cornsilk": [255, 248, 220],
	"crimson": [220, 20, 60],
	"cyan": [0, 255, 255],
	"darkblue": [0, 0, 139],
	"darkcyan": [0, 139, 139],
	"darkgoldenrod": [184, 134, 11],
	"darkgray": [169, 169, 169],
	"darkgreen": [0, 100, 0],
	"darkgrey": [169, 169, 169],
	"darkkhaki": [189, 183, 107],
	"darkmagenta": [139, 0, 139],
	"darkolivegreen": [85, 107, 47],
	"darkorange": [255, 140, 0],
	"darkorchid": [153, 50, 204],
	"darkred": [139, 0, 0],
	"darksalmon": [233, 150, 122],
	"darkseagreen": [143, 188, 143],
	"darkslateblue": [72, 61, 139],
	"darkslategray": [47, 79, 79],
	"darkslategrey": [47, 79, 79],
	"darkturquoise": [0, 206, 209],
	"darkviolet": [148, 0, 211],
	"deeppink": [255, 20, 147],
	"deepskyblue": [0, 191, 255],
	"dimgray": [105, 105, 105],
	"dimgrey": [105, 105, 105],
	"dodgerblue": [30, 144, 255],
	"firebrick": [178, 34, 34],
	"floralwhite": [255, 250, 240],
	"forestgreen": [34, 139, 34],
	"fuchsia": [255, 0, 255],
	"gainsboro": [220, 220, 220],
	"ghostwhite": [248, 248, 255],
	"gold": [255, 215, 0],
	"goldenrod": [218, 165, 32],
	"gray": [128, 128, 128],
	"green": [0, 128, 0],
	"greenyellow": [173, 255, 47],
	"grey": [128, 128, 128],
	"honeydew": [240, 255, 240],
	"hotpink": [255, 105, 180],
	"indianred": [205, 92, 92],
	"indigo": [75, 0, 130],
	"ivory": [255, 255, 240],
	"khaki": [240, 230, 140],
	"lavender": [230, 230, 250],
	"lavenderblush": [255, 240, 245],
	"lawngreen": [124, 252, 0],
	"lemonchiffon": [255, 250, 205],
	"lightblue": [173, 216, 230],
	"lightcoral": [240, 128, 128],
	"lightcyan": [224, 255, 255],
	"lightgoldenrodyellow": [250, 250, 210],
	"lightgray": [211, 211, 211],
	"lightgreen": [144, 238, 144],
	"lightgrey": [211, 211, 211],
	"lightpink": [255, 182, 193],
	"lightsalmon": [255, 160, 122],
	"lightseagreen": [32, 178, 170],
	"lightskyblue": [135, 206, 250],
	"lightslategray": [119, 136, 153],
	"lightslategrey": [119, 136, 153],
	"lightsteelblue": [176, 196, 222],
	"lightyellow": [255, 255, 224],
	"lime": [0, 255, 0],
	"limegreen": [50, 205, 50],
	"linen": [250, 240, 230],
	"magenta": [255, 0, 255],
	"maroon": [128, 0, 0],
	"mediumaquamarine": [102, 205, 170],
	"mediumblue": [0, 0, 205],
	"mediumorchid": [186, 85, 211],
	"mediumpurple": [147, 112, 219],
	"mediumseagreen": [60, 179, 113],
	"mediumslateblue": [123, 104, 238],
	"mediumspringgreen": [0, 250, 154],
	"mediumturquoise": [72, 209, 204],
	"mediumvioletred": [199, 21, 133],
	"midnightblue": [25, 25, 112],
	"mintcream": [245, 255, 250],
	"mistyrose": [255, 228, 225],
	"moccasin": [255, 228, 181],
	"navajowhite": [255, 222, 173],
	"navy": [0, 0, 128],
	"oldlace": [253, 245, 230],
	"olive": [128, 128, 0],
	"olivedrab": [107, 142, 35],
	"orange": [255, 165, 0],
	"orangered": [255, 69, 0],
	"orchid": [218, 112, 214],
	"palegoldenrod": [238, 232, 170],
	"palegreen": [152, 251, 152],
	"paleturquoise": [175, 238, 238],
	"palevioletred": [219, 112, 147],
	"papayawhip": [255, 239, 213],
	"peachpuff": [255, 218, 185],
	"peru": [205, 133, 63],
	"pink": [255, 192, 203],
	"plum": [221, 160, 221],
	"powderblue": [176, 224, 230],
	"purple": [128, 0, 128],
	"rebeccapurple": [102, 51, 153],
	"red": [255, 0, 0],
	"rosybrown": [188, 143, 143],
	"royalblue": [65, 105, 225],
	"saddlebrown": [139, 69, 19],
	"salmon": [250, 128, 114],
	"sandybrown": [244, 164, 96],
	"seagreen": [46, 139, 87],
	"seashell": [255, 245, 238],
	"sienna": [160, 82, 45],
	"silver": [192, 192, 192],
	"skyblue": [135, 206, 235],
	"slateblue": [106, 90, 205],
	"slategray": [112, 128, 144],
	"slategrey": [112, 128, 144],
	"snow": [255, 250, 250],
	"springgreen": [0, 255, 127],
	"steelblue": [70, 130, 180],
	"tan": [210, 180, 140],
	"teal": [0, 128, 128],
	"thistle": [216, 191, 216],
	"tomato": [255, 99, 71],
	"turquoise": [64, 224, 208],
	"violet": [238, 130, 238],
	"wheat": [245, 222, 179],
	"white": [255, 255, 255],
	"whitesmoke": [245, 245, 245],
	"yellow": [255, 255, 0],
	"yellowgreen": [154, 205, 50]
};

var conversions$1 = createCommonjsModule(function (module) {
/* MIT license */


// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

var reverseKeywords = {};
for (var key in colorName$1) {
	if (colorName$1.hasOwnProperty(key)) {
		reverseKeywords[colorName$1[key]] = key;
	}
}

var convert = module.exports = {
	rgb: {channels: 3, labels: 'rgb'},
	hsl: {channels: 3, labels: 'hsl'},
	hsv: {channels: 3, labels: 'hsv'},
	hwb: {channels: 3, labels: 'hwb'},
	cmyk: {channels: 4, labels: 'cmyk'},
	xyz: {channels: 3, labels: 'xyz'},
	lab: {channels: 3, labels: 'lab'},
	lch: {channels: 3, labels: 'lch'},
	hex: {channels: 1, labels: ['hex']},
	keyword: {channels: 1, labels: ['keyword']},
	ansi16: {channels: 1, labels: ['ansi16']},
	ansi256: {channels: 1, labels: ['ansi256']},
	hcg: {channels: 3, labels: ['h', 'c', 'g']},
	apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
	gray: {channels: 1, labels: ['gray']}
};

// hide .channels and .labels properties
for (var model in convert) {
	if (convert.hasOwnProperty(model)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		var channels = convert[model].channels;
		var labels = convert[model].labels;
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}
}

convert.rgb.hsl = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var min = Math.min(r, g, b);
	var max = Math.max(r, g, b);
	var delta = max - min;
	var h;
	var s;
	var l;

	if (max === min) {
		h = 0;
	} else if (r === max) {
		h = (g - b) / delta;
	} else if (g === max) {
		h = 2 + (b - r) / delta;
	} else if (b === max) {
		h = 4 + (r - g) / delta;
	}

	h = Math.min(h * 60, 360);

	if (h < 0) {
		h += 360;
	}

	l = (min + max) / 2;

	if (max === min) {
		s = 0;
	} else if (l <= 0.5) {
		s = delta / (max + min);
	} else {
		s = delta / (2 - max - min);
	}

	return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
	var rdif;
	var gdif;
	var bdif;
	var h;
	var s;

	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var v = Math.max(r, g, b);
	var diff = v - Math.min(r, g, b);
	var diffc = function (c) {
		return (v - c) / 6 / diff + 1 / 2;
	};

	if (diff === 0) {
		h = s = 0;
	} else {
		s = diff / v;
		rdif = diffc(r);
		gdif = diffc(g);
		bdif = diffc(b);

		if (r === v) {
			h = bdif - gdif;
		} else if (g === v) {
			h = (1 / 3) + rdif - bdif;
		} else if (b === v) {
			h = (2 / 3) + gdif - rdif;
		}
		if (h < 0) {
			h += 1;
		} else if (h > 1) {
			h -= 1;
		}
	}

	return [
		h * 360,
		s * 100,
		v * 100
	];
};

convert.rgb.hwb = function (rgb) {
	var r = rgb[0];
	var g = rgb[1];
	var b = rgb[2];
	var h = convert.rgb.hsl(rgb)[0];
	var w = 1 / 255 * Math.min(r, Math.min(g, b));

	b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

	return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var c;
	var m;
	var y;
	var k;

	k = Math.min(1 - r, 1 - g, 1 - b);
	c = (1 - r - k) / (1 - k) || 0;
	m = (1 - g - k) / (1 - k) || 0;
	y = (1 - b - k) / (1 - k) || 0;

	return [c * 100, m * 100, y * 100, k * 100];
};

/**
 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
 * */
function comparativeDistance(x, y) {
	return (
		Math.pow(x[0] - y[0], 2) +
		Math.pow(x[1] - y[1], 2) +
		Math.pow(x[2] - y[2], 2)
	);
}

convert.rgb.keyword = function (rgb) {
	var reversed = reverseKeywords[rgb];
	if (reversed) {
		return reversed;
	}

	var currentClosestDistance = Infinity;
	var currentClosestKeyword;

	for (var keyword in colorName$1) {
		if (colorName$1.hasOwnProperty(keyword)) {
			var value = colorName$1[keyword];

			// Compute comparative distance
			var distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}
	}

	return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
	return colorName$1[keyword];
};

convert.rgb.xyz = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;

	// assume sRGB
	r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
	g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
	b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

	var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
	var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
	var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

	return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
	var xyz = convert.rgb.xyz(rgb);
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
	var h = hsl[0] / 360;
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var t1;
	var t2;
	var t3;
	var rgb;
	var val;

	if (s === 0) {
		val = l * 255;
		return [val, val, val];
	}

	if (l < 0.5) {
		t2 = l * (1 + s);
	} else {
		t2 = l + s - l * s;
	}

	t1 = 2 * l - t2;

	rgb = [0, 0, 0];
	for (var i = 0; i < 3; i++) {
		t3 = h + 1 / 3 * -(i - 1);
		if (t3 < 0) {
			t3++;
		}
		if (t3 > 1) {
			t3--;
		}

		if (6 * t3 < 1) {
			val = t1 + (t2 - t1) * 6 * t3;
		} else if (2 * t3 < 1) {
			val = t2;
		} else if (3 * t3 < 2) {
			val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
		} else {
			val = t1;
		}

		rgb[i] = val * 255;
	}

	return rgb;
};

convert.hsl.hsv = function (hsl) {
	var h = hsl[0];
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var smin = s;
	var lmin = Math.max(l, 0.01);
	var sv;
	var v;

	l *= 2;
	s *= (l <= 1) ? l : 2 - l;
	smin *= lmin <= 1 ? lmin : 2 - lmin;
	v = (l + s) / 2;
	sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

	return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
	var h = hsv[0] / 60;
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var hi = Math.floor(h) % 6;

	var f = h - Math.floor(h);
	var p = 255 * v * (1 - s);
	var q = 255 * v * (1 - (s * f));
	var t = 255 * v * (1 - (s * (1 - f)));
	v *= 255;

	switch (hi) {
		case 0:
			return [v, t, p];
		case 1:
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
};

convert.hsv.hsl = function (hsv) {
	var h = hsv[0];
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;
	var vmin = Math.max(v, 0.01);
	var lmin;
	var sl;
	var l;

	l = (2 - s) * v;
	lmin = (2 - s) * vmin;
	sl = s * vmin;
	sl /= (lmin <= 1) ? lmin : 2 - lmin;
	sl = sl || 0;
	l /= 2;

	return [h, sl * 100, l * 100];
};

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
convert.hwb.rgb = function (hwb) {
	var h = hwb[0] / 360;
	var wh = hwb[1] / 100;
	var bl = hwb[2] / 100;
	var ratio = wh + bl;
	var i;
	var v;
	var f;
	var n;

	// wh + bl cant be > 1
	if (ratio > 1) {
		wh /= ratio;
		bl /= ratio;
	}

	i = Math.floor(6 * h);
	v = 1 - bl;
	f = 6 * h - i;

	if ((i & 0x01) !== 0) {
		f = 1 - f;
	}

	n = wh + f * (v - wh); // linear interpolation

	var r;
	var g;
	var b;
	switch (i) {
		default:
		case 6:
		case 0: r = v; g = n; b = wh; break;
		case 1: r = n; g = v; b = wh; break;
		case 2: r = wh; g = v; b = n; break;
		case 3: r = wh; g = n; b = v; break;
		case 4: r = n; g = wh; b = v; break;
		case 5: r = v; g = wh; b = n; break;
	}

	return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
	var c = cmyk[0] / 100;
	var m = cmyk[1] / 100;
	var y = cmyk[2] / 100;
	var k = cmyk[3] / 100;
	var r;
	var g;
	var b;

	r = 1 - Math.min(1, c * (1 - k) + k);
	g = 1 - Math.min(1, m * (1 - k) + k);
	b = 1 - Math.min(1, y * (1 - k) + k);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
	var x = xyz[0] / 100;
	var y = xyz[1] / 100;
	var z = xyz[2] / 100;
	var r;
	var g;
	var b;

	r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
	g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
	b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

	// assume sRGB
	r = r > 0.0031308
		? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
		: r * 12.92;

	g = g > 0.0031308
		? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
		: g * 12.92;

	b = b > 0.0031308
		? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
		: b * 12.92;

	r = Math.min(Math.max(0, r), 1);
	g = Math.min(Math.max(0, g), 1);
	b = Math.min(Math.max(0, b), 1);

	return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
	var x = xyz[0];
	var y = xyz[1];
	var z = xyz[2];
	var l;
	var a;
	var b;

	x /= 95.047;
	y /= 100;
	z /= 108.883;

	x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
	y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
	z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

	l = (116 * y) - 16;
	a = 500 * (x - y);
	b = 200 * (y - z);

	return [l, a, b];
};

convert.lab.xyz = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var x;
	var y;
	var z;

	y = (l + 16) / 116;
	x = a / 500 + y;
	z = y - b / 200;

	var y2 = Math.pow(y, 3);
	var x2 = Math.pow(x, 3);
	var z2 = Math.pow(z, 3);
	y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
	x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
	z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

	x *= 95.047;
	y *= 100;
	z *= 108.883;

	return [x, y, z];
};

convert.lab.lch = function (lab) {
	var l = lab[0];
	var a = lab[1];
	var b = lab[2];
	var hr;
	var h;
	var c;

	hr = Math.atan2(b, a);
	h = hr * 360 / 2 / Math.PI;

	if (h < 0) {
		h += 360;
	}

	c = Math.sqrt(a * a + b * b);

	return [l, c, h];
};

convert.lch.lab = function (lch) {
	var l = lch[0];
	var c = lch[1];
	var h = lch[2];
	var a;
	var b;
	var hr;

	hr = h / 360 * 2 * Math.PI;
	a = c * Math.cos(hr);
	b = c * Math.sin(hr);

	return [l, a, b];
};

convert.rgb.ansi16 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];
	var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

	value = Math.round(value / 50);

	if (value === 0) {
		return 30;
	}

	var ansi = 30
		+ ((Math.round(b / 255) << 2)
		| (Math.round(g / 255) << 1)
		| Math.round(r / 255));

	if (value === 2) {
		ansi += 60;
	}

	return ansi;
};

convert.hsv.ansi16 = function (args) {
	// optimization here; we already know the value and don't need to get
	// it converted for us.
	return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
	var r = args[0];
	var g = args[1];
	var b = args[2];

	// we use the extended greyscale palette here, with the exception of
	// black and white. normal palette only has 4 greyscale shades.
	if (r === g && g === b) {
		if (r < 8) {
			return 16;
		}

		if (r > 248) {
			return 231;
		}

		return Math.round(((r - 8) / 247) * 24) + 232;
	}

	var ansi = 16
		+ (36 * Math.round(r / 255 * 5))
		+ (6 * Math.round(g / 255 * 5))
		+ Math.round(b / 255 * 5);

	return ansi;
};

convert.ansi16.rgb = function (args) {
	var color = args % 10;

	// handle greyscale
	if (color === 0 || color === 7) {
		if (args > 50) {
			color += 3.5;
		}

		color = color / 10.5 * 255;

		return [color, color, color];
	}

	var mult = (~~(args > 50) + 1) * 0.5;
	var r = ((color & 1) * mult) * 255;
	var g = (((color >> 1) & 1) * mult) * 255;
	var b = (((color >> 2) & 1) * mult) * 255;

	return [r, g, b];
};

convert.ansi256.rgb = function (args) {
	// handle greyscale
	if (args >= 232) {
		var c = (args - 232) * 10 + 8;
		return [c, c, c];
	}

	args -= 16;

	var rem;
	var r = Math.floor(args / 36) / 5 * 255;
	var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
	var b = (rem % 6) / 5 * 255;

	return [r, g, b];
};

convert.rgb.hex = function (args) {
	var integer = ((Math.round(args[0]) & 0xFF) << 16)
		+ ((Math.round(args[1]) & 0xFF) << 8)
		+ (Math.round(args[2]) & 0xFF);

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
	var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
	if (!match) {
		return [0, 0, 0];
	}

	var colorString = match[0];

	if (match[0].length === 3) {
		colorString = colorString.split('').map(function (char) {
			return char + char;
		}).join('');
	}

	var integer = parseInt(colorString, 16);
	var r = (integer >> 16) & 0xFF;
	var g = (integer >> 8) & 0xFF;
	var b = integer & 0xFF;

	return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
	var r = rgb[0] / 255;
	var g = rgb[1] / 255;
	var b = rgb[2] / 255;
	var max = Math.max(Math.max(r, g), b);
	var min = Math.min(Math.min(r, g), b);
	var chroma = (max - min);
	var grayscale;
	var hue;

	if (chroma < 1) {
		grayscale = min / (1 - chroma);
	} else {
		grayscale = 0;
	}

	if (chroma <= 0) {
		hue = 0;
	} else
	if (max === r) {
		hue = ((g - b) / chroma) % 6;
	} else
	if (max === g) {
		hue = 2 + (b - r) / chroma;
	} else {
		hue = 4 + (r - g) / chroma + 4;
	}

	hue /= 6;
	hue %= 1;

	return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
	var s = hsl[1] / 100;
	var l = hsl[2] / 100;
	var c = 1;
	var f = 0;

	if (l < 0.5) {
		c = 2.0 * s * l;
	} else {
		c = 2.0 * s * (1.0 - l);
	}

	if (c < 1.0) {
		f = (l - 0.5 * c) / (1.0 - c);
	}

	return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
	var s = hsv[1] / 100;
	var v = hsv[2] / 100;

	var c = s * v;
	var f = 0;

	if (c < 1.0) {
		f = (v - c) / (1 - c);
	}

	return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
	var h = hcg[0] / 360;
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	if (c === 0.0) {
		return [g * 255, g * 255, g * 255];
	}

	var pure = [0, 0, 0];
	var hi = (h % 1) * 6;
	var v = hi % 1;
	var w = 1 - v;
	var mg = 0;

	switch (Math.floor(hi)) {
		case 0:
			pure[0] = 1; pure[1] = v; pure[2] = 0; break;
		case 1:
			pure[0] = w; pure[1] = 1; pure[2] = 0; break;
		case 2:
			pure[0] = 0; pure[1] = 1; pure[2] = v; break;
		case 3:
			pure[0] = 0; pure[1] = w; pure[2] = 1; break;
		case 4:
			pure[0] = v; pure[1] = 0; pure[2] = 1; break;
		default:
			pure[0] = 1; pure[1] = 0; pure[2] = w;
	}

	mg = (1.0 - c) * g;

	return [
		(c * pure[0] + mg) * 255,
		(c * pure[1] + mg) * 255,
		(c * pure[2] + mg) * 255
	];
};

convert.hcg.hsv = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var v = c + g * (1.0 - c);
	var f = 0;

	if (v > 0.0) {
		f = c / v;
	}

	return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;

	var l = g * (1.0 - c) + 0.5 * c;
	var s = 0;

	if (l > 0.0 && l < 0.5) {
		s = c / (2 * l);
	} else
	if (l >= 0.5 && l < 1.0) {
		s = c / (2 * (1 - l));
	}

	return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
	var c = hcg[1] / 100;
	var g = hcg[2] / 100;
	var v = c + g * (1.0 - c);
	return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
	var w = hwb[1] / 100;
	var b = hwb[2] / 100;
	var v = 1 - b;
	var c = v - w;
	var g = 0;

	if (c < 1) {
		g = (v - c) / (1 - c);
	}

	return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
	return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
};

convert.rgb.apple = function (rgb) {
	return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
};

convert.gray.rgb = function (args) {
	return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = convert.gray.hsv = function (args) {
	return [0, 0, args[0]];
};

convert.gray.hwb = function (gray) {
	return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
	return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
	return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
	var val = Math.round(gray[0] / 100 * 255) & 0xFF;
	var integer = (val << 16) + (val << 8) + val;

	var string = integer.toString(16).toUpperCase();
	return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
	var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
	return [val / 255 * 100];
};
});

/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/

function buildGraph$1() {
	var graph = {};
	// https://jsperf.com/object-keys-vs-for-in-with-closure/3
	var models = Object.keys(conversions$1);

	for (var len = models.length, i = 0; i < len; i++) {
		graph[models[i]] = {
			// http://jsperf.com/1-vs-infinity
			// micro-opt, but this is simple.
			distance: -1,
			parent: null
		};
	}

	return graph;
}

// https://en.wikipedia.org/wiki/Breadth-first_search
function deriveBFS$1(fromModel) {
	var graph = buildGraph$1();
	var queue = [fromModel]; // unshift -> queue -> pop

	graph[fromModel].distance = 0;

	while (queue.length) {
		var current = queue.pop();
		var adjacents = Object.keys(conversions$1[current]);

		for (var len = adjacents.length, i = 0; i < len; i++) {
			var adjacent = adjacents[i];
			var node = graph[adjacent];

			if (node.distance === -1) {
				node.distance = graph[current].distance + 1;
				node.parent = current;
				queue.unshift(adjacent);
			}
		}
	}

	return graph;
}

function link$1(from, to) {
	return function (args) {
		return to(from(args));
	};
}

function wrapConversion$1(toModel, graph) {
	var path = [graph[toModel].parent, toModel];
	var fn = conversions$1[graph[toModel].parent][toModel];

	var cur = graph[toModel].parent;
	while (graph[cur].parent) {
		path.unshift(graph[cur].parent);
		fn = link$1(conversions$1[graph[cur].parent][cur], fn);
		cur = graph[cur].parent;
	}

	fn.conversion = path;
	return fn;
}

var route$1 = function (fromModel) {
	var graph = deriveBFS$1(fromModel);
	var conversion = {};

	var models = Object.keys(graph);
	for (var len = models.length, i = 0; i < len; i++) {
		var toModel = models[i];
		var node = graph[toModel];

		if (node.parent === null) {
			// no possible conversion, or this node is the source model.
			continue;
		}

		conversion[toModel] = wrapConversion$1(toModel, graph);
	}

	return conversion;
};

var convert$2 = {};

var models$1 = Object.keys(conversions$1);

function wrapRaw$1(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		return fn(args);
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

function wrapRounded$1(fn) {
	var wrappedFn = function (args) {
		if (args === undefined || args === null) {
			return args;
		}

		if (arguments.length > 1) {
			args = Array.prototype.slice.call(arguments);
		}

		var result = fn(args);

		// we're assuming the result is an array here.
		// see notice in conversions.js; don't use box types
		// in conversion functions.
		if (typeof result === 'object') {
			for (var len = result.length, i = 0; i < len; i++) {
				result[i] = Math.round(result[i]);
			}
		}

		return result;
	};

	// preserve .conversion property if there is one
	if ('conversion' in fn) {
		wrappedFn.conversion = fn.conversion;
	}

	return wrappedFn;
}

models$1.forEach(function (fromModel) {
	convert$2[fromModel] = {};

	Object.defineProperty(convert$2[fromModel], 'channels', {value: conversions$1[fromModel].channels});
	Object.defineProperty(convert$2[fromModel], 'labels', {value: conversions$1[fromModel].labels});

	var routes = route$1(fromModel);
	var routeModels = Object.keys(routes);

	routeModels.forEach(function (toModel) {
		var fn = routes[toModel];

		convert$2[fromModel][toModel] = wrapRounded$1(fn);
		convert$2[fromModel][toModel].raw = wrapRaw$1(fn);
	});
});

var colorConvert$1 = convert$2;

var ansiStyles$1 = createCommonjsModule(function (module) {


const wrapAnsi16 = (fn, offset) => function () {
	const code = fn.apply(colorConvert$1, arguments);
	return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => function () {
	const code = fn.apply(colorConvert$1, arguments);
	return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => function () {
	const rgb = fn.apply(colorConvert$1, arguments);
	return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

function assembleStyles() {
	const codes = new Map();
	const styles = {
		modifier: {
			reset: [0, 0],
			// 21 isn't widely supported and 22 does the same thing
			bold: [1, 22],
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		color: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39],

			// Bright color
			redBright: [91, 39],
			greenBright: [92, 39],
			yellowBright: [93, 39],
			blueBright: [94, 39],
			magentaBright: [95, 39],
			cyanBright: [96, 39],
			whiteBright: [97, 39]
		},
		bgColor: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49],

			// Bright color
			bgBlackBright: [100, 49],
			bgRedBright: [101, 49],
			bgGreenBright: [102, 49],
			bgYellowBright: [103, 49],
			bgBlueBright: [104, 49],
			bgMagentaBright: [105, 49],
			bgCyanBright: [106, 49],
			bgWhiteBright: [107, 49]
		}
	};

	// Fix humans
	styles.color.grey = styles.color.gray;

	for (const groupName of Object.keys(styles)) {
		const group = styles[groupName];

		for (const styleName of Object.keys(group)) {
			const style = group[styleName];

			styles[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};

			group[styleName] = styles[styleName];

			codes.set(style[0], style[1]);
		}

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});

		Object.defineProperty(styles, 'codes', {
			value: codes,
			enumerable: false
		});
	}

	const ansi2ansi = n => n;
	const rgb2rgb = (r, g, b) => [r, g, b];

	styles.color.close = '\u001B[39m';
	styles.bgColor.close = '\u001B[49m';

	styles.color.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 0)
	};
	styles.color.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 0)
	};
	styles.color.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 0)
	};

	styles.bgColor.ansi = {
		ansi: wrapAnsi16(ansi2ansi, 10)
	};
	styles.bgColor.ansi256 = {
		ansi256: wrapAnsi256(ansi2ansi, 10)
	};
	styles.bgColor.ansi16m = {
		rgb: wrapAnsi16m(rgb2rgb, 10)
	};

	for (let key of Object.keys(colorConvert$1)) {
		if (typeof colorConvert$1[key] !== 'object') {
			continue;
		}

		const suite = colorConvert$1[key];

		if (key === 'ansi16') {
			key = 'ansi';
		}

		if ('ansi16' in suite) {
			styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
			styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
		}

		if ('ansi256' in suite) {
			styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
			styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
		}

		if ('rgb' in suite) {
			styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
			styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
		}
	}

	return styles;
}

// Make the export immutable
Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});
});

var hasFlag$1 = (flag, argv) => {
	argv = argv || process.argv;
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const pos = argv.indexOf(prefix + flag);
	const terminatorPos = argv.indexOf('--');
	return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};

const env$1 = process.env;

let forceColor$1;
if (hasFlag$1('no-color') ||
	hasFlag$1('no-colors') ||
	hasFlag$1('color=false')) {
	forceColor$1 = false;
} else if (hasFlag$1('color') ||
	hasFlag$1('colors') ||
	hasFlag$1('color=true') ||
	hasFlag$1('color=always')) {
	forceColor$1 = true;
}
if ('FORCE_COLOR' in env$1) {
	forceColor$1 = env$1.FORCE_COLOR.length === 0 || parseInt(env$1.FORCE_COLOR, 10) !== 0;
}

function translateLevel$1(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor$1(stream) {
	if (forceColor$1 === false) {
		return 0;
	}

	if (hasFlag$1('color=16m') ||
		hasFlag$1('color=full') ||
		hasFlag$1('color=truecolor')) {
		return 3;
	}

	if (hasFlag$1('color=256')) {
		return 2;
	}

	if (stream && !stream.isTTY && forceColor$1 !== true) {
		return 0;
	}

	const min = forceColor$1 ? 1 : 0;

	if (process.platform === 'win32') {
		// Node.js 7.5.0 is the first version of Node.js to include a patch to
		// libuv that enables 256 color output on Windows. Anything earlier and it
		// won't work. However, here we target Node.js 8 at minimum as it is an LTS
		// release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
		// release that supports 256 colors. Windows 10 build 14931 is the first release
		// that supports 16m/TrueColor.
		const osRelease = os$1.release().split('.');
		if (
			Number(process.versions.node.split('.')[0]) >= 8 &&
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env$1) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env$1) || env$1.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env$1) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env$1.TEAMCITY_VERSION) ? 1 : 0;
	}

	if (env$1.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env$1) {
		const version = parseInt((env$1.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env$1.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env$1.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env$1.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env$1) {
		return 1;
	}

	if (env$1.TERM === 'dumb') {
		return min;
	}

	return min;
}

function getSupportLevel$1(stream) {
	const level = supportsColor$1(stream);
	return translateLevel$1(level);
}

var supportsColor_1$1 = {
	supportsColor: getSupportLevel$1,
	stdout: getSupportLevel$1(process.stdout),
	stderr: getSupportLevel$1(process.stderr)
};

const TEMPLATE_REGEX$1 = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX$1 = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX$1 = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX$1 = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;

const ESCAPES$1 = new Map([
	['n', '\n'],
	['r', '\r'],
	['t', '\t'],
	['b', '\b'],
	['f', '\f'],
	['v', '\v'],
	['0', '\0'],
	['\\', '\\'],
	['e', '\u001B'],
	['a', '\u0007']
]);

function unescape$1(c) {
	if ((c[0] === 'u' && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
		return String.fromCharCode(parseInt(c.slice(1), 16));
	}

	return ESCAPES$1.get(c) || c;
}

function parseArguments$1(name, args) {
	const results = [];
	const chunks = args.trim().split(/\s*,\s*/g);
	let matches;

	for (const chunk of chunks) {
		if (!isNaN(chunk)) {
			results.push(Number(chunk));
		} else if ((matches = chunk.match(STRING_REGEX$1))) {
			results.push(matches[2].replace(ESCAPE_REGEX$1, (m, escape, chr) => escape ? unescape$1(escape) : chr));
		} else {
			throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
		}
	}

	return results;
}

function parseStyle$1(style) {
	STYLE_REGEX$1.lastIndex = 0;

	const results = [];
	let matches;

	while ((matches = STYLE_REGEX$1.exec(style)) !== null) {
		const name = matches[1];

		if (matches[2]) {
			const args = parseArguments$1(name, matches[2]);
			results.push([name].concat(args));
		} else {
			results.push([name]);
		}
	}

	return results;
}

function buildStyle$1(chalk, styles) {
	const enabled = {};

	for (const layer of styles) {
		for (const style of layer.styles) {
			enabled[style[0]] = layer.inverse ? null : style.slice(1);
		}
	}

	let current = chalk;
	for (const styleName of Object.keys(enabled)) {
		if (Array.isArray(enabled[styleName])) {
			if (!(styleName in current)) {
				throw new Error(`Unknown Chalk style: ${styleName}`);
			}

			if (enabled[styleName].length > 0) {
				current = current[styleName].apply(current, enabled[styleName]);
			} else {
				current = current[styleName];
			}
		}
	}

	return current;
}

var templates$1 = (chalk, tmp) => {
	const styles = [];
	const chunks = [];
	let chunk = [];

	// eslint-disable-next-line max-params
	tmp.replace(TEMPLATE_REGEX$1, (m, escapeChar, inverse, style, close, chr) => {
		if (escapeChar) {
			chunk.push(unescape$1(escapeChar));
		} else if (style) {
			const str = chunk.join('');
			chunk = [];
			chunks.push(styles.length === 0 ? str : buildStyle$1(chalk, styles)(str));
			styles.push({inverse, styles: parseStyle$1(style)});
		} else if (close) {
			if (styles.length === 0) {
				throw new Error('Found extraneous } in Chalk template literal');
			}

			chunks.push(buildStyle$1(chalk, styles)(chunk.join('')));
			chunk = [];
			styles.pop();
		} else {
			chunk.push(chr);
		}
	});

	chunks.push(chunk.join(''));

	if (styles.length > 0) {
		const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
		throw new Error(errMsg);
	}

	return chunks.join('');
};

var chalk$1 = createCommonjsModule(function (module) {


const stdoutColor = supportsColor_1$1.stdout;



const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm');

// `supportsColor.level` → `ansiStyles.color[name]` mapping
const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m'];

// `color-convert` models to exclude from the Chalk API due to conflicts and such
const skipModels = new Set(['gray']);

const styles = Object.create(null);

function applyOptions(obj, options) {
	options = options || {};

	// Detect level if not set manually
	const scLevel = stdoutColor ? stdoutColor.level : 0;
	obj.level = options.level === undefined ? scLevel : options.level;
	obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
	// We check for this.template here since calling `chalk.constructor()`
	// by itself will have a `this` of a previously constructed chalk object
	if (!this || !(this instanceof Chalk) || this.template) {
		const chalk = {};
		applyOptions(chalk, options);

		chalk.template = function () {
			const args = [].slice.call(arguments);
			return chalkTag.apply(null, [chalk.template].concat(args));
		};

		Object.setPrototypeOf(chalk, Chalk.prototype);
		Object.setPrototypeOf(chalk.template, chalk);

		chalk.template.constructor = Chalk;

		return chalk.template;
	}

	applyOptions(this, options);
}

// Use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles$1.blue.open = '\u001B[94m';
}

for (const key of Object.keys(ansiStyles$1)) {
	ansiStyles$1[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles$1[key].close), 'g');

	styles[key] = {
		get() {
			const codes = ansiStyles$1[key];
			return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
		}
	};
}

styles.visible = {
	get() {
		return build.call(this, this._styles || [], true, 'visible');
	}
};

ansiStyles$1.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles$1.color.close), 'g');
for (const model of Object.keys(ansiStyles$1.color.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	styles[model] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles$1.color[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles$1.color.close,
					closeRe: ansiStyles$1.color.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

ansiStyles$1.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles$1.bgColor.close), 'g');
for (const model of Object.keys(ansiStyles$1.bgColor.ansi)) {
	if (skipModels.has(model)) {
		continue;
	}

	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = {
		get() {
			const level = this.level;
			return function () {
				const open = ansiStyles$1.bgColor[levelMapping[level]][model].apply(null, arguments);
				const codes = {
					open,
					close: ansiStyles$1.bgColor.close,
					closeRe: ansiStyles$1.bgColor.closeRe
				};
				return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
			};
		}
	};
}

const proto = Object.defineProperties(() => {}, styles);

function build(_styles, _empty, key) {
	const builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder._empty = _empty;

	const self = this;

	Object.defineProperty(builder, 'level', {
		enumerable: true,
		get() {
			return self.level;
		},
		set(level) {
			self.level = level;
		}
	});

	Object.defineProperty(builder, 'enabled', {
		enumerable: true,
		get() {
			return self.enabled;
		},
		set(enabled) {
			self.enabled = enabled;
		}
	});

	// See below for fix regarding invisible grey/dim combination on Windows
	builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey';

	// `__proto__` is used because we must return a function, but there is
	// no way to create a function with a different prototype
	builder.__proto__ = proto; // eslint-disable-line no-proto

	return builder;
}

function applyStyle() {
	// Support varags, but simply cast to string in case there's only one arg
	const args = arguments;
	const argsLen = args.length;
	let str = String(arguments[0]);

	if (argsLen === 0) {
		return '';
	}

	if (argsLen > 1) {
		// Don't slice `arguments`, it prevents V8 optimizations
		for (let a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || this.level <= 0 || !str) {
		return this._empty ? '' : str;
	}

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	const originalDim = ansiStyles$1.dim.open;
	if (isSimpleWindowsTerm && this.hasGrey) {
		ansiStyles$1.dim.open = '';
	}

	for (const code of this._styles.slice().reverse()) {
		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;

		// Close the styling before a linebreak and reopen
		// after next line to fix a bleed issue on macOS
		// https://github.com/chalk/chalk/pull/92
		str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
	}

	// Reset the original `dim` if we changed it to work around the Windows dimmed gray issue
	ansiStyles$1.dim.open = originalDim;

	return str;
}

function chalkTag(chalk, strings) {
	if (!Array.isArray(strings)) {
		// If chalk() was called by itself or with a string,
		// return the string itself as a string.
		return [].slice.call(arguments, 1).join(' ');
	}

	const args = [].slice.call(arguments, 2);
	const parts = [strings.raw[0]];

	for (let i = 1; i < strings.length; i++) {
		parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
		parts.push(String(strings.raw[i]));
	}

	return templates$1(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);

module.exports = Chalk(); // eslint-disable-line new-cap
module.exports.supportsColor = stdoutColor;
module.exports.default = module.exports; // For TypeScript
});

var lib$1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shouldHighlight = shouldHighlight;
exports.getChalk = getChalk;
exports.default = highlight;

var _jsTokens = _interopRequireWildcard(jsTokens);



var _chalk = _interopRequireDefault(chalk$1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function getDefs(chalk) {
  return {
    keyword: chalk.cyan,
    capitalized: chalk.yellow,
    jsx_tag: chalk.yellow,
    punctuator: chalk.yellow,
    number: chalk.magenta,
    string: chalk.green,
    regex: chalk.magenta,
    comment: chalk.grey,
    invalid: chalk.white.bgRed.bold
  };
}

const NEWLINE = /\r\n|[\n\r\u2028\u2029]/;
const JSX_TAG = /^[a-z][\w-]*$/i;
const BRACKET = /^[()[\]{}]$/;

function getTokenType(match) {
  const [offset, text] = match.slice(-2);
  const token = (0, _jsTokens.matchToToken)(match);

  if (token.type === "name") {
    if ((0, lib.isKeyword)(token.value) || (0, lib.isReservedWord)(token.value)) {
      return "keyword";
    }

    if (JSX_TAG.test(token.value) && (text[offset - 1] === "<" || text.substr(offset - 2, 2) == "</")) {
      return "jsx_tag";
    }

    if (token.value[0] !== token.value[0].toLowerCase()) {
      return "capitalized";
    }
  }

  if (token.type === "punctuator" && BRACKET.test(token.value)) {
    return "bracket";
  }

  if (token.type === "invalid" && (token.value === "@" || token.value === "#")) {
    return "punctuator";
  }

  return token.type;
}

function highlightTokens(defs, text) {
  return text.replace(_jsTokens.default, function (...args) {
    const type = getTokenType(args);
    const colorize = defs[type];

    if (colorize) {
      return args[0].split(NEWLINE).map(str => colorize(str)).join("\n");
    } else {
      return args[0];
    }
  });
}

function shouldHighlight(options) {
  return _chalk.default.supportsColor || options.forceColor;
}

function getChalk(options) {
  let chalk = _chalk.default;

  if (options.forceColor) {
    chalk = new _chalk.default.constructor({
      enabled: true,
      level: 1
    });
  }

  return chalk;
}

function highlight(code, options = {}) {
  if (shouldHighlight(options)) {
    const chalk = getChalk(options);
    const defs = getDefs(chalk);
    return highlightTokens(defs, code);
  } else {
    return code;
  }
}
});

var lib$2 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.codeFrameColumns = codeFrameColumns;
exports.default = _default;

var _highlight = _interopRequireWildcard(lib$1);

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

let deprecationWarningShown = false;

function getDefs(chalk) {
  return {
    gutter: chalk.grey,
    marker: chalk.red.bold,
    message: chalk.red.bold
  };
}

const NEWLINE = /\r\n|[\n\r\u2028\u2029]/;

function getMarkerLines(loc, source, opts) {
  const startLoc = Object.assign({
    column: 0,
    line: -1
  }, loc.start);
  const endLoc = Object.assign({}, startLoc, loc.end);
  const {
    linesAbove = 2,
    linesBelow = 3
  } = opts || {};
  const startLine = startLoc.line;
  const startColumn = startLoc.column;
  const endLine = endLoc.line;
  const endColumn = endLoc.column;
  let start = Math.max(startLine - (linesAbove + 1), 0);
  let end = Math.min(source.length, endLine + linesBelow);

  if (startLine === -1) {
    start = 0;
  }

  if (endLine === -1) {
    end = source.length;
  }

  const lineDiff = endLine - startLine;
  const markerLines = {};

  if (lineDiff) {
    for (let i = 0; i <= lineDiff; i++) {
      const lineNumber = i + startLine;

      if (!startColumn) {
        markerLines[lineNumber] = true;
      } else if (i === 0) {
        const sourceLength = source[lineNumber - 1].length;
        markerLines[lineNumber] = [startColumn, sourceLength - startColumn + 1];
      } else if (i === lineDiff) {
        markerLines[lineNumber] = [0, endColumn];
      } else {
        const sourceLength = source[lineNumber - i].length;
        markerLines[lineNumber] = [0, sourceLength];
      }
    }
  } else {
    if (startColumn === endColumn) {
      if (startColumn) {
        markerLines[startLine] = [startColumn, 0];
      } else {
        markerLines[startLine] = true;
      }
    } else {
      markerLines[startLine] = [startColumn, endColumn - startColumn];
    }
  }

  return {
    start,
    end,
    markerLines
  };
}

function codeFrameColumns(rawLines, loc, opts = {}) {
  const highlighted = (opts.highlightCode || opts.forceColor) && (0, _highlight.shouldHighlight)(opts);
  const chalk = (0, _highlight.getChalk)(opts);
  const defs = getDefs(chalk);

  const maybeHighlight = (chalkFn, string) => {
    return highlighted ? chalkFn(string) : string;
  };

  const lines = rawLines.split(NEWLINE);
  const {
    start,
    end,
    markerLines
  } = getMarkerLines(loc, lines, opts);
  const hasColumns = loc.start && typeof loc.start.column === "number";
  const numberMaxWidth = String(end).length;
  const highlightedLines = highlighted ? (0, _highlight.default)(rawLines, opts) : rawLines;
  let frame = highlightedLines.split(NEWLINE).slice(start, end).map((line, index) => {
    const number = start + 1 + index;
    const paddedNumber = ` ${number}`.slice(-numberMaxWidth);
    const gutter = ` ${paddedNumber} | `;
    const hasMarker = markerLines[number];
    const lastMarkerLine = !markerLines[number + 1];

    if (hasMarker) {
      let markerLine = "";

      if (Array.isArray(hasMarker)) {
        const markerSpacing = line.slice(0, Math.max(hasMarker[0] - 1, 0)).replace(/[^\t]/g, " ");
        const numberOfMarkers = hasMarker[1] || 1;
        markerLine = ["\n ", maybeHighlight(defs.gutter, gutter.replace(/\d/g, " ")), markerSpacing, maybeHighlight(defs.marker, "^").repeat(numberOfMarkers)].join("");

        if (lastMarkerLine && opts.message) {
          markerLine += " " + maybeHighlight(defs.message, opts.message);
        }
      }

      return [maybeHighlight(defs.marker, ">"), maybeHighlight(defs.gutter, gutter), line, markerLine].join("");
    } else {
      return ` ${maybeHighlight(defs.gutter, gutter)}${line}`;
    }
  }).join("\n");

  if (opts.message && !hasColumns) {
    frame = `${" ".repeat(numberMaxWidth + 1)}${opts.message}\n${frame}`;
  }

  if (highlighted) {
    return chalk.reset(frame);
  } else {
    return frame;
  }
}

function _default(rawLines, lineNumber, colNumber, opts = {}) {
  if (!deprecationWarningShown) {
    deprecationWarningShown = true;
    const message = "Passing lineNumber and colNumber is deprecated to @babel/code-frame. Please use `codeFrameColumns`.";

    if (process.emitWarning) {
      process.emitWarning(message, "DeprecationWarning");
    } else {
      const deprecationError = new Error(message);
      deprecationError.name = "DeprecationWarning";
      console.warn(new Error(message));
    }
  }

  colNumber = Math.max(colNumber, 0);
  const location = {
    start: {
      column: colNumber,
      line: lineNumber
    }
  };
  return codeFrameColumns(rawLines, location, opts);
}
});

var require$$0 = getCjsExportFromNamespace(dist);

const {default: LinesAndColumns$1} = require$$0;
const {codeFrameColumns} = lib$2;

const JSONError = errorEx_1('JSONError', {
	fileName: errorEx_1.append('in %s'),
	codeFrame: errorEx_1.append('\n\n%s\n')
});

var parseJson$1 = (string, reviver, filename) => {
	if (typeof reviver === 'string') {
		filename = reviver;
		reviver = null;
	}

	try {
		try {
			return JSON.parse(string, reviver);
		} catch (error) {
			jsonParseBetterErrors(string, reviver);
			throw error;
		}
	} catch (error) {
		error.message = error.message.replace(/\n/g, '');
		const indexMatch = error.message.match(/in JSON at position (\d+) while parsing/);

		const jsonError = new JSONError(error);
		if (filename) {
			jsonError.fileName = filename;
		}

		if (indexMatch && indexMatch.length > 0) {
			const lines = new LinesAndColumns$1(string);
			const index = Number(indexMatch[1]);
			const location = lines.locationForIndex(index);

			const codeFrame = codeFrameColumns(
				string,
				{start: {line: location.line + 1, column: location.column + 1}},
				{highlightCode: true}
			);

			jsonError.codeFrame = codeFrame;
		}

		throw jsonError;
	}
};

var semver = createCommonjsModule(function (module, exports) {
exports = module.exports = SemVer;

var debug;
/* istanbul ignore next */
if (typeof process === 'object' &&
    process.env &&
    process.env.NODE_DEBUG &&
    /\bsemver\b/i.test(process.env.NODE_DEBUG)) {
  debug = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift('SEMVER');
    console.log.apply(console, args);
  };
} else {
  debug = function () {};
}

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = '2.0.0';

var MAX_LENGTH = 256;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
  /* istanbul ignore next */ 9007199254740991;

// Max safe segment length for coercion.
var MAX_SAFE_COMPONENT_LENGTH = 16;

// The actual regexps go on exports.re
var re = exports.re = [];
var src = exports.src = [];
var R = 0;

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

var NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
var NUMERICIDENTIFIERLOOSE = R++;
src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

var NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';

// ## Main Version
// Three dot-separated numeric identifiers.

var MAINVERSION = R++;
src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')';

var MAINVERSIONLOOSE = R++;
src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

var PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
                            '|' + src[NONNUMERICIDENTIFIER] + ')';

var PRERELEASEIDENTIFIERLOOSE = R++;
src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
                                 '|' + src[NONNUMERICIDENTIFIER] + ')';

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

var PRERELEASE = R++;
src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

var PRERELEASELOOSE = R++;
src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

var BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

var BUILD = R++;
src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

var FULL = R++;
var FULLPLAIN = 'v?' + src[MAINVERSION] +
                src[PRERELEASE] + '?' +
                src[BUILD] + '?';

src[FULL] = '^' + FULLPLAIN + '$';

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
                 src[PRERELEASELOOSE] + '?' +
                 src[BUILD] + '?';

var LOOSE = R++;
src[LOOSE] = '^' + LOOSEPLAIN + '$';

var GTLT = R++;
src[GTLT] = '((?:<|>)?=?)';

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
var XRANGEIDENTIFIERLOOSE = R++;
src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
var XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

var XRANGEPLAIN = R++;
src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:' + src[PRERELEASE] + ')?' +
                   src[BUILD] + '?' +
                   ')?)?';

var XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:' + src[PRERELEASELOOSE] + ')?' +
                        src[BUILD] + '?' +
                        ')?)?';

var XRANGE = R++;
src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
var XRANGELOOSE = R++;
src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

// Coercion.
// Extract anything that could conceivably be a part of a valid semver
var COERCE = R++;
src[COERCE] = '(?:^|[^\\d])' +
              '(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '})' +
              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
              '(?:$|[^\\d])';

// Tilde ranges.
// Meaning is "reasonably at or greater than"
var LONETILDE = R++;
src[LONETILDE] = '(?:~>?)';

var TILDETRIM = R++;
src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
var tildeTrimReplace = '$1~';

var TILDE = R++;
src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
var TILDELOOSE = R++;
src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

// Caret ranges.
// Meaning is "at least and backwards compatible with"
var LONECARET = R++;
src[LONECARET] = '(?:\\^)';

var CARETTRIM = R++;
src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
var caretTrimReplace = '$1^';

var CARET = R++;
src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
var CARETLOOSE = R++;
src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

// A simple gt/lt/eq thing, or just "" to indicate "any version"
var COMPARATORLOOSE = R++;
src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
var COMPARATOR = R++;
src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';

// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
var COMPARATORTRIM = R++;
src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

// this one has to use the /g flag
re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
var comparatorTrimReplace = '$1$2$3';

// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
var HYPHENRANGE = R++;
src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
                   '\\s+-\\s+' +
                   '(' + src[XRANGEPLAIN] + ')' +
                   '\\s*$';

var HYPHENRANGELOOSE = R++;
src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s+-\\s+' +
                        '(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s*$';

// Star ranges basically just allow anything at all.
var STAR = R++;
src[STAR] = '(<|>)?=?\\s*\\*';

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (var i = 0; i < R; i++) {
  debug(i, src[i]);
  if (!re[i]) {
    re[i] = new RegExp(src[i]);
  }
}

exports.parse = parse;
function parse (version, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  if (version instanceof SemVer) {
    return version
  }

  if (typeof version !== 'string') {
    return null
  }

  if (version.length > MAX_LENGTH) {
    return null
  }

  var r = options.loose ? re[LOOSE] : re[FULL];
  if (!r.test(version)) {
    return null
  }

  try {
    return new SemVer(version, options)
  } catch (er) {
    return null
  }
}

exports.valid = valid;
function valid (version, options) {
  var v = parse(version, options);
  return v ? v.version : null
}

exports.clean = clean;
function clean (version, options) {
  var s = parse(version.trim().replace(/^[=v]+/, ''), options);
  return s ? s.version : null
}

exports.SemVer = SemVer;

function SemVer (version, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }
  if (version instanceof SemVer) {
    if (version.loose === options.loose) {
      return version
    } else {
      version = version.version;
    }
  } else if (typeof version !== 'string') {
    throw new TypeError('Invalid Version: ' + version)
  }

  if (version.length > MAX_LENGTH) {
    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')
  }

  if (!(this instanceof SemVer)) {
    return new SemVer(version, options)
  }

  debug('SemVer', version, options);
  this.options = options;
  this.loose = !!options.loose;

  var m = version.trim().match(options.loose ? re[LOOSE] : re[FULL]);

  if (!m) {
    throw new TypeError('Invalid Version: ' + version)
  }

  this.raw = version;

  // these are actually numbers
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
    throw new TypeError('Invalid major version')
  }

  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
    throw new TypeError('Invalid minor version')
  }

  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
    throw new TypeError('Invalid patch version')
  }

  // numberify any prerelease numeric ids
  if (!m[4]) {
    this.prerelease = [];
  } else {
    this.prerelease = m[4].split('.').map(function (id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id;
        if (num >= 0 && num < MAX_SAFE_INTEGER) {
          return num
        }
      }
      return id
    });
  }

  this.build = m[5] ? m[5].split('.') : [];
  this.format();
}

SemVer.prototype.format = function () {
  this.version = this.major + '.' + this.minor + '.' + this.patch;
  if (this.prerelease.length) {
    this.version += '-' + this.prerelease.join('.');
  }
  return this.version
};

SemVer.prototype.toString = function () {
  return this.version
};

SemVer.prototype.compare = function (other) {
  debug('SemVer.compare', this.version, this.options, other);
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options);
  }

  return this.compareMain(other) || this.comparePre(other)
};

SemVer.prototype.compareMain = function (other) {
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options);
  }

  return compareIdentifiers(this.major, other.major) ||
         compareIdentifiers(this.minor, other.minor) ||
         compareIdentifiers(this.patch, other.patch)
};

SemVer.prototype.comparePre = function (other) {
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options);
  }

  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length) {
    return -1
  } else if (!this.prerelease.length && other.prerelease.length) {
    return 1
  } else if (!this.prerelease.length && !other.prerelease.length) {
    return 0
  }

  var i = 0;
  do {
    var a = this.prerelease[i];
    var b = other.prerelease[i];
    debug('prerelease compare', i, a, b);
    if (a === undefined && b === undefined) {
      return 0
    } else if (b === undefined) {
      return 1
    } else if (a === undefined) {
      return -1
    } else if (a === b) {
      continue
    } else {
      return compareIdentifiers(a, b)
    }
  } while (++i)
};

// preminor will bump the version up to the next minor release, and immediately
// down to pre-release. premajor and prepatch work the same way.
SemVer.prototype.inc = function (release, identifier) {
  switch (release) {
    case 'premajor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor = 0;
      this.major++;
      this.inc('pre', identifier);
      break
    case 'preminor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor++;
      this.inc('pre', identifier);
      break
    case 'prepatch':
      // If this is already a prerelease, it will bump to the next version
      // drop any prereleases that might already exist, since they are not
      // relevant at this point.
      this.prerelease.length = 0;
      this.inc('patch', identifier);
      this.inc('pre', identifier);
      break
    // If the input is a non-prerelease version, this acts the same as
    // prepatch.
    case 'prerelease':
      if (this.prerelease.length === 0) {
        this.inc('patch', identifier);
      }
      this.inc('pre', identifier);
      break

    case 'major':
      // If this is a pre-major version, bump up to the same major version.
      // Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      if (this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0) {
        this.major++;
      }
      this.minor = 0;
      this.patch = 0;
      this.prerelease = [];
      break
    case 'minor':
      // If this is a pre-minor version, bump up to the same minor version.
      // Otherwise increment minor.
      // 1.2.0-5 bumps to 1.2.0
      // 1.2.1 bumps to 1.3.0
      if (this.patch !== 0 || this.prerelease.length === 0) {
        this.minor++;
      }
      this.patch = 0;
      this.prerelease = [];
      break
    case 'patch':
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (this.prerelease.length === 0) {
        this.patch++;
      }
      this.prerelease = [];
      break
    // This probably shouldn't be used publicly.
    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
    case 'pre':
      if (this.prerelease.length === 0) {
        this.prerelease = [0];
      } else {
        var i = this.prerelease.length;
        while (--i >= 0) {
          if (typeof this.prerelease[i] === 'number') {
            this.prerelease[i]++;
            i = -2;
          }
        }
        if (i === -1) {
          // didn't increment anything
          this.prerelease.push(0);
        }
      }
      if (identifier) {
        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
        if (this.prerelease[0] === identifier) {
          if (isNaN(this.prerelease[1])) {
            this.prerelease = [identifier, 0];
          }
        } else {
          this.prerelease = [identifier, 0];
        }
      }
      break

    default:
      throw new Error('invalid increment argument: ' + release)
  }
  this.format();
  this.raw = this.version;
  return this
};

exports.inc = inc;
function inc (version, release, loose, identifier) {
  if (typeof (loose) === 'string') {
    identifier = loose;
    loose = undefined;
  }

  try {
    return new SemVer(version, loose).inc(release, identifier).version
  } catch (er) {
    return null
  }
}

exports.diff = diff;
function diff (version1, version2) {
  if (eq(version1, version2)) {
    return null
  } else {
    var v1 = parse(version1);
    var v2 = parse(version2);
    var prefix = '';
    if (v1.prerelease.length || v2.prerelease.length) {
      prefix = 'pre';
      var defaultResult = 'prerelease';
    }
    for (var key in v1) {
      if (key === 'major' || key === 'minor' || key === 'patch') {
        if (v1[key] !== v2[key]) {
          return prefix + key
        }
      }
    }
    return defaultResult // may be undefined
  }
}

exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;
function compareIdentifiers (a, b) {
  var anum = numeric.test(a);
  var bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
}

exports.rcompareIdentifiers = rcompareIdentifiers;
function rcompareIdentifiers (a, b) {
  return compareIdentifiers(b, a)
}

exports.major = major;
function major (a, loose) {
  return new SemVer(a, loose).major
}

exports.minor = minor;
function minor (a, loose) {
  return new SemVer(a, loose).minor
}

exports.patch = patch;
function patch (a, loose) {
  return new SemVer(a, loose).patch
}

exports.compare = compare;
function compare (a, b, loose) {
  return new SemVer(a, loose).compare(new SemVer(b, loose))
}

exports.compareLoose = compareLoose;
function compareLoose (a, b) {
  return compare(a, b, true)
}

exports.rcompare = rcompare;
function rcompare (a, b, loose) {
  return compare(b, a, loose)
}

exports.sort = sort;
function sort (list, loose) {
  return list.sort(function (a, b) {
    return exports.compare(a, b, loose)
  })
}

exports.rsort = rsort;
function rsort (list, loose) {
  return list.sort(function (a, b) {
    return exports.rcompare(a, b, loose)
  })
}

exports.gt = gt;
function gt (a, b, loose) {
  return compare(a, b, loose) > 0
}

exports.lt = lt;
function lt (a, b, loose) {
  return compare(a, b, loose) < 0
}

exports.eq = eq;
function eq (a, b, loose) {
  return compare(a, b, loose) === 0
}

exports.neq = neq;
function neq (a, b, loose) {
  return compare(a, b, loose) !== 0
}

exports.gte = gte;
function gte (a, b, loose) {
  return compare(a, b, loose) >= 0
}

exports.lte = lte;
function lte (a, b, loose) {
  return compare(a, b, loose) <= 0
}

exports.cmp = cmp;
function cmp (a, op, b, loose) {
  switch (op) {
    case '===':
      if (typeof a === 'object')
        a = a.version;
      if (typeof b === 'object')
        b = b.version;
      return a === b

    case '!==':
      if (typeof a === 'object')
        a = a.version;
      if (typeof b === 'object')
        b = b.version;
      return a !== b

    case '':
    case '=':
    case '==':
      return eq(a, b, loose)

    case '!=':
      return neq(a, b, loose)

    case '>':
      return gt(a, b, loose)

    case '>=':
      return gte(a, b, loose)

    case '<':
      return lt(a, b, loose)

    case '<=':
      return lte(a, b, loose)

    default:
      throw new TypeError('Invalid operator: ' + op)
  }
}

exports.Comparator = Comparator;
function Comparator (comp, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  if (comp instanceof Comparator) {
    if (comp.loose === !!options.loose) {
      return comp
    } else {
      comp = comp.value;
    }
  }

  if (!(this instanceof Comparator)) {
    return new Comparator(comp, options)
  }

  debug('comparator', comp, options);
  this.options = options;
  this.loose = !!options.loose;
  this.parse(comp);

  if (this.semver === ANY) {
    this.value = '';
  } else {
    this.value = this.operator + this.semver.version;
  }

  debug('comp', this);
}

var ANY = {};
Comparator.prototype.parse = function (comp) {
  var r = this.options.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var m = comp.match(r);

  if (!m) {
    throw new TypeError('Invalid comparator: ' + comp)
  }

  this.operator = m[1];
  if (this.operator === '=') {
    this.operator = '';
  }

  // if it literally is just '>' or '' then allow anything.
  if (!m[2]) {
    this.semver = ANY;
  } else {
    this.semver = new SemVer(m[2], this.options.loose);
  }
};

Comparator.prototype.toString = function () {
  return this.value
};

Comparator.prototype.test = function (version) {
  debug('Comparator.test', version, this.options.loose);

  if (this.semver === ANY) {
    return true
  }

  if (typeof version === 'string') {
    version = new SemVer(version, this.options);
  }

  return cmp(version, this.operator, this.semver, this.options)
};

Comparator.prototype.intersects = function (comp, options) {
  if (!(comp instanceof Comparator)) {
    throw new TypeError('a Comparator is required')
  }

  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  var rangeTmp;

  if (this.operator === '') {
    rangeTmp = new Range(comp.value, options);
    return satisfies(this.value, rangeTmp, options)
  } else if (comp.operator === '') {
    rangeTmp = new Range(this.value, options);
    return satisfies(comp.semver, rangeTmp, options)
  }

  var sameDirectionIncreasing =
    (this.operator === '>=' || this.operator === '>') &&
    (comp.operator === '>=' || comp.operator === '>');
  var sameDirectionDecreasing =
    (this.operator === '<=' || this.operator === '<') &&
    (comp.operator === '<=' || comp.operator === '<');
  var sameSemVer = this.semver.version === comp.semver.version;
  var differentDirectionsInclusive =
    (this.operator === '>=' || this.operator === '<=') &&
    (comp.operator === '>=' || comp.operator === '<=');
  var oppositeDirectionsLessThan =
    cmp(this.semver, '<', comp.semver, options) &&
    ((this.operator === '>=' || this.operator === '>') &&
    (comp.operator === '<=' || comp.operator === '<'));
  var oppositeDirectionsGreaterThan =
    cmp(this.semver, '>', comp.semver, options) &&
    ((this.operator === '<=' || this.operator === '<') &&
    (comp.operator === '>=' || comp.operator === '>'));

  return sameDirectionIncreasing || sameDirectionDecreasing ||
    (sameSemVer && differentDirectionsInclusive) ||
    oppositeDirectionsLessThan || oppositeDirectionsGreaterThan
};

exports.Range = Range;
function Range (range, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  if (range instanceof Range) {
    if (range.loose === !!options.loose &&
        range.includePrerelease === !!options.includePrerelease) {
      return range
    } else {
      return new Range(range.raw, options)
    }
  }

  if (range instanceof Comparator) {
    return new Range(range.value, options)
  }

  if (!(this instanceof Range)) {
    return new Range(range, options)
  }

  this.options = options;
  this.loose = !!options.loose;
  this.includePrerelease = !!options.includePrerelease;

  // First, split based on boolean or ||
  this.raw = range;
  this.set = range.split(/\s*\|\|\s*/).map(function (range) {
    return this.parseRange(range.trim())
  }, this).filter(function (c) {
    // throw out any that are not relevant for whatever reason
    return c.length
  });

  if (!this.set.length) {
    throw new TypeError('Invalid SemVer Range: ' + range)
  }

  this.format();
}

Range.prototype.format = function () {
  this.range = this.set.map(function (comps) {
    return comps.join(' ').trim()
  }).join('||').trim();
  return this.range
};

Range.prototype.toString = function () {
  return this.range
};

Range.prototype.parseRange = function (range) {
  var loose = this.options.loose;
  range = range.trim();
  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
  var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);
  debug('hyphen replace', range);
  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
  range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
  debug('comparator trim', range, re[COMPARATORTRIM]);

  // `~ 1.2.3` => `~1.2.3`
  range = range.replace(re[TILDETRIM], tildeTrimReplace);

  // `^ 1.2.3` => `^1.2.3`
  range = range.replace(re[CARETTRIM], caretTrimReplace);

  // normalize spaces
  range = range.split(/\s+/).join(' ');

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.

  var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var set = range.split(' ').map(function (comp) {
    return parseComparator(comp, this.options)
  }, this).join(' ').split(/\s+/);
  if (this.options.loose) {
    // in loose mode, throw out any that are not valid comparators
    set = set.filter(function (comp) {
      return !!comp.match(compRe)
    });
  }
  set = set.map(function (comp) {
    return new Comparator(comp, this.options)
  }, this);

  return set
};

Range.prototype.intersects = function (range, options) {
  if (!(range instanceof Range)) {
    throw new TypeError('a Range is required')
  }

  return this.set.some(function (thisComparators) {
    return thisComparators.every(function (thisComparator) {
      return range.set.some(function (rangeComparators) {
        return rangeComparators.every(function (rangeComparator) {
          return thisComparator.intersects(rangeComparator, options)
        })
      })
    })
  })
};

// Mostly just for testing and legacy API reasons
exports.toComparators = toComparators;
function toComparators (range, options) {
  return new Range(range, options).set.map(function (comp) {
    return comp.map(function (c) {
      return c.value
    }).join(' ').trim().split(' ')
  })
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator (comp, options) {
  debug('comp', comp, options);
  comp = replaceCarets(comp, options);
  debug('caret', comp);
  comp = replaceTildes(comp, options);
  debug('tildes', comp);
  comp = replaceXRanges(comp, options);
  debug('xrange', comp);
  comp = replaceStars(comp, options);
  debug('stars', comp);
  return comp
}

function isX (id) {
  return !id || id.toLowerCase() === 'x' || id === '*'
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes (comp, options) {
  return comp.trim().split(/\s+/).map(function (comp) {
    return replaceTilde(comp, options)
  }).join(' ')
}

function replaceTilde (comp, options) {
  var r = options.loose ? re[TILDELOOSE] : re[TILDE];
  return comp.replace(r, function (_, M, m, p, pr) {
    debug('tilde', comp, _, M, m, p, pr);
    var ret;

    if (isX(M)) {
      ret = '';
    } else if (isX(m)) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    } else if (isX(p)) {
      // ~1.2 == >=1.2.0 <1.3.0
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    } else if (pr) {
      debug('replaceTilde pr', pr);
      ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
            ' <' + M + '.' + (+m + 1) + '.0';
    } else {
      // ~1.2.3 == >=1.2.3 <1.3.0
      ret = '>=' + M + '.' + m + '.' + p +
            ' <' + M + '.' + (+m + 1) + '.0';
    }

    debug('tilde return', ret);
    return ret
  })
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets (comp, options) {
  return comp.trim().split(/\s+/).map(function (comp) {
    return replaceCaret(comp, options)
  }).join(' ')
}

function replaceCaret (comp, options) {
  debug('caret', comp, options);
  var r = options.loose ? re[CARETLOOSE] : re[CARET];
  return comp.replace(r, function (_, M, m, p, pr) {
    debug('caret', comp, _, M, m, p, pr);
    var ret;

    if (isX(M)) {
      ret = '';
    } else if (isX(m)) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    } else if (isX(p)) {
      if (M === '0') {
        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
      } else {
        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
      }
    } else if (pr) {
      debug('replaceCaret pr', pr);
      if (M === '0') {
        if (m === '0') {
          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
                ' <' + M + '.' + m + '.' + (+p + 1);
        } else {
          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
                ' <' + M + '.' + (+m + 1) + '.0';
        }
      } else {
        ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
              ' <' + (+M + 1) + '.0.0';
      }
    } else {
      debug('no pr');
      if (M === '0') {
        if (m === '0') {
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + m + '.' + (+p + 1);
        } else {
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + (+m + 1) + '.0';
        }
      } else {
        ret = '>=' + M + '.' + m + '.' + p +
              ' <' + (+M + 1) + '.0.0';
      }
    }

    debug('caret return', ret);
    return ret
  })
}

function replaceXRanges (comp, options) {
  debug('replaceXRanges', comp, options);
  return comp.split(/\s+/).map(function (comp) {
    return replaceXRange(comp, options)
  }).join(' ')
}

function replaceXRange (comp, options) {
  comp = comp.trim();
  var r = options.loose ? re[XRANGELOOSE] : re[XRANGE];
  return comp.replace(r, function (ret, gtlt, M, m, p, pr) {
    debug('xRange', comp, ret, gtlt, M, m, p, pr);
    var xM = isX(M);
    var xm = xM || isX(m);
    var xp = xm || isX(p);
    var anyX = xp;

    if (gtlt === '=' && anyX) {
      gtlt = '';
    }

    if (xM) {
      if (gtlt === '>' || gtlt === '<') {
        // nothing is allowed
        ret = '<0.0.0';
      } else {
        // nothing is forbidden
        ret = '*';
      }
    } else if (gtlt && anyX) {
      // we know patch is an x, because we have any x at all.
      // replace X with 0
      if (xm) {
        m = 0;
      }
      p = 0;

      if (gtlt === '>') {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        // >1.2.3 => >= 1.2.4
        gtlt = '>=';
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === '<=') {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = '<';
        if (xm) {
          M = +M + 1;
        } else {
          m = +m + 1;
        }
      }

      ret = gtlt + M + '.' + m + '.' + p;
    } else if (xm) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    } else if (xp) {
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    }

    debug('xRange return', ret);

    return ret
  })
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars (comp, options) {
  debug('replaceStars', comp, options);
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[STAR], '')
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace ($0,
  from, fM, fm, fp, fpr, fb,
  to, tM, tm, tp, tpr, tb) {
  if (isX(fM)) {
    from = '';
  } else if (isX(fm)) {
    from = '>=' + fM + '.0.0';
  } else if (isX(fp)) {
    from = '>=' + fM + '.' + fm + '.0';
  } else {
    from = '>=' + from;
  }

  if (isX(tM)) {
    to = '';
  } else if (isX(tm)) {
    to = '<' + (+tM + 1) + '.0.0';
  } else if (isX(tp)) {
    to = '<' + tM + '.' + (+tm + 1) + '.0';
  } else if (tpr) {
    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
  } else {
    to = '<=' + to;
  }

  return (from + ' ' + to).trim()
}

// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function (version) {
  if (!version) {
    return false
  }

  if (typeof version === 'string') {
    version = new SemVer(version, this.options);
  }

  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this.set[i], version, this.options)) {
      return true
    }
  }
  return false
};

function testSet (set, version, options) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version)) {
      return false
    }
  }

  if (version.prerelease.length && !options.includePrerelease) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (i = 0; i < set.length; i++) {
      debug(set[i].semver);
      if (set[i].semver === ANY) {
        continue
      }

      if (set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver;
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch) {
          return true
        }
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false
  }

  return true
}

exports.satisfies = satisfies;
function satisfies (version, range, options) {
  try {
    range = new Range(range, options);
  } catch (er) {
    return false
  }
  return range.test(version)
}

exports.maxSatisfying = maxSatisfying;
function maxSatisfying (versions, range, options) {
  var max = null;
  var maxSV = null;
  try {
    var rangeObj = new Range(range, options);
  } catch (er) {
    return null
  }
  versions.forEach(function (v) {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!max || maxSV.compare(v) === -1) {
        // compare(max, v, true)
        max = v;
        maxSV = new SemVer(max, options);
      }
    }
  });
  return max
}

exports.minSatisfying = minSatisfying;
function minSatisfying (versions, range, options) {
  var min = null;
  var minSV = null;
  try {
    var rangeObj = new Range(range, options);
  } catch (er) {
    return null
  }
  versions.forEach(function (v) {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!min || minSV.compare(v) === 1) {
        // compare(min, v, true)
        min = v;
        minSV = new SemVer(min, options);
      }
    }
  });
  return min
}

exports.minVersion = minVersion;
function minVersion (range, loose) {
  range = new Range(range, loose);

  var minver = new SemVer('0.0.0');
  if (range.test(minver)) {
    return minver
  }

  minver = new SemVer('0.0.0-0');
  if (range.test(minver)) {
    return minver
  }

  minver = null;
  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i];

    comparators.forEach(function (comparator) {
      // Clone to avoid manipulating the comparator's semver object.
      var compver = new SemVer(comparator.semver.version);
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++;
          } else {
            compver.prerelease.push(0);
          }
          compver.raw = compver.format();
          /* fallthrough */
        case '':
        case '>=':
          if (!minver || gt(minver, compver)) {
            minver = compver;
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error('Unexpected operation: ' + comparator.operator)
      }
    });
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
}

exports.validRange = validRange;
function validRange (range, options) {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range(range, options).range || '*'
  } catch (er) {
    return null
  }
}

// Determine if version is less than all the versions possible in the range
exports.ltr = ltr;
function ltr (version, range, options) {
  return outside(version, range, '<', options)
}

// Determine if version is greater than all the versions possible in the range.
exports.gtr = gtr;
function gtr (version, range, options) {
  return outside(version, range, '>', options)
}

exports.outside = outside;
function outside (version, range, hilo, options) {
  version = new SemVer(version, options);
  range = new Range(range, options);

  var gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt;
      ltefn = lte;
      ltfn = lt;
      comp = '>';
      ecomp = '>=';
      break
    case '<':
      gtfn = lt;
      ltefn = gte;
      ltfn = gt;
      comp = '<';
      ecomp = '<=';
      break
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"')
  }

  // If it satisifes the range it is not outside
  if (satisfies(version, range, options)) {
    return false
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i];

    var high = null;
    var low = null;

    comparators.forEach(function (comparator) {
      if (comparator.semver === ANY) {
        comparator = new Comparator('>=0.0.0');
      }
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, options)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, options)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false
    }
  }
  return true
}

exports.prerelease = prerelease;
function prerelease (version, options) {
  var parsed = parse(version, options);
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
}

exports.intersects = intersects;
function intersects (r1, r2, options) {
  r1 = new Range(r1, options);
  r2 = new Range(r2, options);
  return r1.intersects(r2)
}

exports.coerce = coerce;
function coerce (version) {
  if (version instanceof SemVer) {
    return version
  }

  if (typeof version !== 'string') {
    return null
  }

  var match = version.match(re[COERCE]);

  if (match == null) {
    return null
  }

  return parse(match[1] +
    '.' + (match[2] || '0') +
    '.' + (match[3] || '0'))
}
});

var index = [
	"0BSD",
	"AAL",
	"ADSL",
	"AFL-1.1",
	"AFL-1.2",
	"AFL-2.0",
	"AFL-2.1",
	"AFL-3.0",
	"AGPL-1.0-only",
	"AGPL-1.0-or-later",
	"AGPL-3.0-only",
	"AGPL-3.0-or-later",
	"AMDPLPA",
	"AML",
	"AMPAS",
	"ANTLR-PD",
	"APAFML",
	"APL-1.0",
	"APSL-1.0",
	"APSL-1.1",
	"APSL-1.2",
	"APSL-2.0",
	"Abstyles",
	"Adobe-2006",
	"Adobe-Glyph",
	"Afmparse",
	"Aladdin",
	"Apache-1.0",
	"Apache-1.1",
	"Apache-2.0",
	"Artistic-1.0",
	"Artistic-1.0-Perl",
	"Artistic-1.0-cl8",
	"Artistic-2.0",
	"BSD-1-Clause",
	"BSD-2-Clause",
	"BSD-2-Clause-FreeBSD",
	"BSD-2-Clause-NetBSD",
	"BSD-2-Clause-Patent",
	"BSD-3-Clause",
	"BSD-3-Clause-Attribution",
	"BSD-3-Clause-Clear",
	"BSD-3-Clause-LBNL",
	"BSD-3-Clause-No-Nuclear-License",
	"BSD-3-Clause-No-Nuclear-License-2014",
	"BSD-3-Clause-No-Nuclear-Warranty",
	"BSD-3-Clause-Open-MPI",
	"BSD-4-Clause",
	"BSD-4-Clause-UC",
	"BSD-Protection",
	"BSD-Source-Code",
	"BSL-1.0",
	"Bahyph",
	"Barr",
	"Beerware",
	"BitTorrent-1.0",
	"BitTorrent-1.1",
	"BlueOak-1.0.0",
	"Borceux",
	"CATOSL-1.1",
	"CC-BY-1.0",
	"CC-BY-2.0",
	"CC-BY-2.5",
	"CC-BY-3.0",
	"CC-BY-4.0",
	"CC-BY-NC-1.0",
	"CC-BY-NC-2.0",
	"CC-BY-NC-2.5",
	"CC-BY-NC-3.0",
	"CC-BY-NC-4.0",
	"CC-BY-NC-ND-1.0",
	"CC-BY-NC-ND-2.0",
	"CC-BY-NC-ND-2.5",
	"CC-BY-NC-ND-3.0",
	"CC-BY-NC-ND-4.0",
	"CC-BY-NC-SA-1.0",
	"CC-BY-NC-SA-2.0",
	"CC-BY-NC-SA-2.5",
	"CC-BY-NC-SA-3.0",
	"CC-BY-NC-SA-4.0",
	"CC-BY-ND-1.0",
	"CC-BY-ND-2.0",
	"CC-BY-ND-2.5",
	"CC-BY-ND-3.0",
	"CC-BY-ND-4.0",
	"CC-BY-SA-1.0",
	"CC-BY-SA-2.0",
	"CC-BY-SA-2.5",
	"CC-BY-SA-3.0",
	"CC-BY-SA-4.0",
	"CC-PDDC",
	"CC0-1.0",
	"CDDL-1.0",
	"CDDL-1.1",
	"CDLA-Permissive-1.0",
	"CDLA-Sharing-1.0",
	"CECILL-1.0",
	"CECILL-1.1",
	"CECILL-2.0",
	"CECILL-2.1",
	"CECILL-B",
	"CECILL-C",
	"CERN-OHL-1.1",
	"CERN-OHL-1.2",
	"CNRI-Jython",
	"CNRI-Python",
	"CNRI-Python-GPL-Compatible",
	"CPAL-1.0",
	"CPL-1.0",
	"CPOL-1.02",
	"CUA-OPL-1.0",
	"Caldera",
	"ClArtistic",
	"Condor-1.1",
	"Crossword",
	"CrystalStacker",
	"Cube",
	"D-FSL-1.0",
	"DOC",
	"DSDP",
	"Dotseqn",
	"ECL-1.0",
	"ECL-2.0",
	"EFL-1.0",
	"EFL-2.0",
	"EPL-1.0",
	"EPL-2.0",
	"EUDatagrid",
	"EUPL-1.0",
	"EUPL-1.1",
	"EUPL-1.2",
	"Entessa",
	"ErlPL-1.1",
	"Eurosym",
	"FSFAP",
	"FSFUL",
	"FSFULLR",
	"FTL",
	"Fair",
	"Frameworx-1.0",
	"FreeImage",
	"GFDL-1.1-only",
	"GFDL-1.1-or-later",
	"GFDL-1.2-only",
	"GFDL-1.2-or-later",
	"GFDL-1.3-only",
	"GFDL-1.3-or-later",
	"GL2PS",
	"GPL-1.0-only",
	"GPL-1.0-or-later",
	"GPL-2.0-only",
	"GPL-2.0-or-later",
	"GPL-3.0-only",
	"GPL-3.0-or-later",
	"Giftware",
	"Glide",
	"Glulxe",
	"HPND",
	"HPND-sell-variant",
	"HaskellReport",
	"IBM-pibs",
	"ICU",
	"IJG",
	"IPA",
	"IPL-1.0",
	"ISC",
	"ImageMagick",
	"Imlib2",
	"Info-ZIP",
	"Intel",
	"Intel-ACPI",
	"Interbase-1.0",
	"JPNIC",
	"JSON",
	"JasPer-2.0",
	"LAL-1.2",
	"LAL-1.3",
	"LGPL-2.0-only",
	"LGPL-2.0-or-later",
	"LGPL-2.1-only",
	"LGPL-2.1-or-later",
	"LGPL-3.0-only",
	"LGPL-3.0-or-later",
	"LGPLLR",
	"LPL-1.0",
	"LPL-1.02",
	"LPPL-1.0",
	"LPPL-1.1",
	"LPPL-1.2",
	"LPPL-1.3a",
	"LPPL-1.3c",
	"Latex2e",
	"Leptonica",
	"LiLiQ-P-1.1",
	"LiLiQ-R-1.1",
	"LiLiQ-Rplus-1.1",
	"Libpng",
	"Linux-OpenIB",
	"MIT",
	"MIT-0",
	"MIT-CMU",
	"MIT-advertising",
	"MIT-enna",
	"MIT-feh",
	"MITNFA",
	"MPL-1.0",
	"MPL-1.1",
	"MPL-2.0",
	"MPL-2.0-no-copyleft-exception",
	"MS-PL",
	"MS-RL",
	"MTLL",
	"MakeIndex",
	"MirOS",
	"Motosoto",
	"Multics",
	"Mup",
	"NASA-1.3",
	"NBPL-1.0",
	"NCSA",
	"NGPL",
	"NLOD-1.0",
	"NLPL",
	"NOSL",
	"NPL-1.0",
	"NPL-1.1",
	"NPOSL-3.0",
	"NRL",
	"NTP",
	"Naumen",
	"Net-SNMP",
	"NetCDF",
	"Newsletr",
	"Nokia",
	"Noweb",
	"OCCT-PL",
	"OCLC-2.0",
	"ODC-By-1.0",
	"ODbL-1.0",
	"OFL-1.0",
	"OFL-1.1",
	"OGL-UK-1.0",
	"OGL-UK-2.0",
	"OGL-UK-3.0",
	"OGTSL",
	"OLDAP-1.1",
	"OLDAP-1.2",
	"OLDAP-1.3",
	"OLDAP-1.4",
	"OLDAP-2.0",
	"OLDAP-2.0.1",
	"OLDAP-2.1",
	"OLDAP-2.2",
	"OLDAP-2.2.1",
	"OLDAP-2.2.2",
	"OLDAP-2.3",
	"OLDAP-2.4",
	"OLDAP-2.5",
	"OLDAP-2.6",
	"OLDAP-2.7",
	"OLDAP-2.8",
	"OML",
	"OPL-1.0",
	"OSET-PL-2.1",
	"OSL-1.0",
	"OSL-1.1",
	"OSL-2.0",
	"OSL-2.1",
	"OSL-3.0",
	"OpenSSL",
	"PDDL-1.0",
	"PHP-3.0",
	"PHP-3.01",
	"Parity-6.0.0",
	"Plexus",
	"PostgreSQL",
	"Python-2.0",
	"QPL-1.0",
	"Qhull",
	"RHeCos-1.1",
	"RPL-1.1",
	"RPL-1.5",
	"RPSL-1.0",
	"RSA-MD",
	"RSCPL",
	"Rdisc",
	"Ruby",
	"SAX-PD",
	"SCEA",
	"SGI-B-1.0",
	"SGI-B-1.1",
	"SGI-B-2.0",
	"SHL-0.5",
	"SHL-0.51",
	"SISSL",
	"SISSL-1.2",
	"SMLNJ",
	"SMPPL",
	"SNIA",
	"SPL-1.0",
	"SSPL-1.0",
	"SWL",
	"Saxpath",
	"Sendmail",
	"Sendmail-8.23",
	"SimPL-2.0",
	"Sleepycat",
	"Spencer-86",
	"Spencer-94",
	"Spencer-99",
	"SugarCRM-1.1.3",
	"TAPR-OHL-1.0",
	"TCL",
	"TCP-wrappers",
	"TMate",
	"TORQUE-1.1",
	"TOSL",
	"TU-Berlin-1.0",
	"TU-Berlin-2.0",
	"UPL-1.0",
	"Unicode-DFS-2015",
	"Unicode-DFS-2016",
	"Unicode-TOU",
	"Unlicense",
	"VOSTROM",
	"VSL-1.0",
	"Vim",
	"W3C",
	"W3C-19980720",
	"W3C-20150513",
	"WTFPL",
	"Watcom-1.0",
	"Wsuipa",
	"X11",
	"XFree86-1.1",
	"XSkat",
	"Xerox",
	"Xnet",
	"YPL-1.0",
	"YPL-1.1",
	"ZPL-1.1",
	"ZPL-2.0",
	"ZPL-2.1",
	"Zed",
	"Zend-2.0",
	"Zimbra-1.3",
	"Zimbra-1.4",
	"Zlib",
	"blessing",
	"bzip2-1.0.5",
	"bzip2-1.0.6",
	"copyleft-next-0.3.0",
	"copyleft-next-0.3.1",
	"curl",
	"diffmark",
	"dvipdfm",
	"eGenix",
	"gSOAP-1.3b",
	"gnuplot",
	"iMatix",
	"libpng-2.0",
	"libtiff",
	"mpich2",
	"psfrag",
	"psutils",
	"xinetd",
	"xpp",
	"zlib-acknowledgement"
];

var spdxLicenseIds = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': index
});

var deprecated$1 = [
	"AGPL-1.0",
	"AGPL-3.0",
	"GFDL-1.1",
	"GFDL-1.2",
	"GFDL-1.3",
	"GPL-1.0",
	"GPL-2.0",
	"GPL-2.0-with-GCC-exception",
	"GPL-2.0-with-autoconf-exception",
	"GPL-2.0-with-bison-exception",
	"GPL-2.0-with-classpath-exception",
	"GPL-2.0-with-font-exception",
	"GPL-3.0",
	"GPL-3.0-with-GCC-exception",
	"GPL-3.0-with-autoconf-exception",
	"LGPL-2.0",
	"LGPL-2.1",
	"LGPL-3.0",
	"Nunit",
	"StandardML-NJ",
	"eCos-2.0",
	"wxWindows"
];

var deprecated$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': deprecated$1
});

var index$1 = [
	"389-exception",
	"Autoconf-exception-2.0",
	"Autoconf-exception-3.0",
	"Bison-exception-2.2",
	"Bootloader-exception",
	"Classpath-exception-2.0",
	"CLISP-exception-2.0",
	"DigiRule-FOSS-exception",
	"eCos-exception-2.0",
	"Fawkes-Runtime-exception",
	"FLTK-exception",
	"Font-exception-2.0",
	"freertos-exception-2.0",
	"GCC-exception-2.0",
	"GCC-exception-3.1",
	"gnu-javamail-exception",
	"GPL-3.0-linking-exception",
	"GPL-3.0-linking-source-exception",
	"GPL-CC-1.0",
	"i2p-gpl-java-exception",
	"Libtool-exception",
	"Linux-syscall-note",
	"LLVM-exception",
	"LZMA-exception",
	"mif-exception",
	"Nokia-Qt-exception-1.1",
	"OCaml-LGPL-linking-exception",
	"OCCT-exception-1.0",
	"OpenJDK-assembly-exception-1.0",
	"openvpn-openssl-exception",
	"PS-or-PDF-font-exception-20170817",
	"Qt-GPL-exception-1.0",
	"Qt-LGPL-exception-1.1",
	"Qwt-exception-1.0",
	"Swift-exception",
	"u-boot-exception-2.0",
	"Universal-FOSS-exception-1.0",
	"WxWindows-exception-3.1"
];

var spdxExceptions = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': index$1
});

var spdxLicenseIds$1 = getCjsExportFromNamespace(spdxLicenseIds);

var require$$1 = getCjsExportFromNamespace(deprecated$2);

var exceptions = getCjsExportFromNamespace(spdxExceptions);

var licenses = []
  .concat(spdxLicenseIds$1)
  .concat(require$$1);


var scan$1 = function (source) {
  var index = 0;

  function hasMore () {
    return index < source.length
  }

  // `value` can be a regexp or a string.
  // If it is recognized, the matching source string is returned and
  // the index is incremented. Otherwise `undefined` is returned.
  function read (value) {
    if (value instanceof RegExp) {
      var chars = source.slice(index);
      var match = chars.match(value);
      if (match) {
        index += match[0].length;
        return match[0]
      }
    } else {
      if (source.indexOf(value, index) === index) {
        index += value.length;
        return value
      }
    }
  }

  function skipWhitespace () {
    read(/[ ]*/);
  }

  function operator () {
    var string;
    var possibilities = ['WITH', 'AND', 'OR', '(', ')', ':', '+'];
    for (var i = 0; i < possibilities.length; i++) {
      string = read(possibilities[i]);
      if (string) {
        break
      }
    }

    if (string === '+' && index > 1 && source[index - 2] === ' ') {
      throw new Error('Space before `+`')
    }

    return string && {
      type: 'OPERATOR',
      string: string
    }
  }

  function idstring () {
    return read(/[A-Za-z0-9-.]+/)
  }

  function expectIdstring () {
    var string = idstring();
    if (!string) {
      throw new Error('Expected idstring at offset ' + index)
    }
    return string
  }

  function documentRef () {
    if (read('DocumentRef-')) {
      var string = expectIdstring();
      return { type: 'DOCUMENTREF', string: string }
    }
  }

  function licenseRef () {
    if (read('LicenseRef-')) {
      var string = expectIdstring();
      return { type: 'LICENSEREF', string: string }
    }
  }

  function identifier () {
    var begin = index;
    var string = idstring();

    if (licenses.indexOf(string) !== -1) {
      return {
        type: 'LICENSE',
        string: string
      }
    } else if (exceptions.indexOf(string) !== -1) {
      return {
        type: 'EXCEPTION',
        string: string
      }
    }

    index = begin;
  }

  // Tries to read the next token. Returns `undefined` if no token is
  // recognized.
  function parseToken () {
    // Ordering matters
    return (
      operator() ||
      documentRef() ||
      licenseRef() ||
      identifier()
    )
  }

  var tokens = [];
  while (hasMore()) {
    skipWhitespace();
    if (!hasMore()) {
      break
    }

    var token = parseToken();
    if (!token) {
      throw new Error('Unexpected `' + source[index] +
                      '` at offset ' + index)
    }

    tokens.push(token);
  }
  return tokens
};

// The ABNF grammar in the spec is totally ambiguous.
//
// This parser follows the operator precedence defined in the
// `Order of Precedence and Parentheses` section.

var parse$3 = function (tokens) {
  var index = 0;

  function hasMore () {
    return index < tokens.length
  }

  function token () {
    return hasMore() ? tokens[index] : null
  }

  function next () {
    if (!hasMore()) {
      throw new Error()
    }
    index++;
  }

  function parseOperator (operator) {
    var t = token();
    if (t && t.type === 'OPERATOR' && operator === t.string) {
      next();
      return t.string
    }
  }

  function parseWith () {
    if (parseOperator('WITH')) {
      var t = token();
      if (t && t.type === 'EXCEPTION') {
        next();
        return t.string
      }
      throw new Error('Expected exception after `WITH`')
    }
  }

  function parseLicenseRef () {
    // TODO: Actually, everything is concatenated into one string
    // for backward-compatibility but it could be better to return
    // a nice structure.
    var begin = index;
    var string = '';
    var t = token();
    if (t.type === 'DOCUMENTREF') {
      next();
      string += 'DocumentRef-' + t.string + ':';
      if (!parseOperator(':')) {
        throw new Error('Expected `:` after `DocumentRef-...`')
      }
    }
    t = token();
    if (t.type === 'LICENSEREF') {
      next();
      string += 'LicenseRef-' + t.string;
      return { license: string }
    }
    index = begin;
  }

  function parseLicense () {
    var t = token();
    if (t && t.type === 'LICENSE') {
      next();
      var node = { license: t.string };
      if (parseOperator('+')) {
        node.plus = true;
      }
      var exception = parseWith();
      if (exception) {
        node.exception = exception;
      }
      return node
    }
  }

  function parseParenthesizedExpression () {
    var left = parseOperator('(');
    if (!left) {
      return
    }

    var expr = parseExpression();

    if (!parseOperator(')')) {
      throw new Error('Expected `)`')
    }

    return expr
  }

  function parseAtom () {
    return (
      parseParenthesizedExpression() ||
      parseLicenseRef() ||
      parseLicense()
    )
  }

  function makeBinaryOpParser (operator, nextParser) {
    return function parseBinaryOp () {
      var left = nextParser();
      if (!left) {
        return
      }

      if (!parseOperator(operator)) {
        return left
      }

      var right = parseBinaryOp();
      if (!right) {
        throw new Error('Expected expression')
      }
      return {
        left: left,
        conjunction: operator.toLowerCase(),
        right: right
      }
    }
  }

  var parseAnd = makeBinaryOpParser('AND', parseAtom);
  var parseExpression = makeBinaryOpParser('OR', parseAnd);

  var node = parseExpression();
  if (!node || hasMore()) {
    throw new Error('Syntax error')
  }
  return node
};

var spdxExpressionParse = function (source) {
  return parse$3(scan$1(source))
};

/*
Copyright spdx-correct.js contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/



function valid (string) {
  try {
    spdxExpressionParse(string);
    return true
  } catch (error) {
    return false
  }
}

// Common transpositions of license identifier acronyms
var transpositions = [
  ['APGL', 'AGPL'],
  ['Gpl', 'GPL'],
  ['GLP', 'GPL'],
  ['APL', 'Apache'],
  ['ISD', 'ISC'],
  ['GLP', 'GPL'],
  ['IST', 'ISC'],
  ['Claude', 'Clause'],
  [' or later', '+'],
  [' International', ''],
  ['GNU', 'GPL'],
  ['GUN', 'GPL'],
  ['+', ''],
  ['GNU GPL', 'GPL'],
  ['GNU/GPL', 'GPL'],
  ['GNU GLP', 'GPL'],
  ['GNU General Public License', 'GPL'],
  ['Gnu public license', 'GPL'],
  ['GNU Public License', 'GPL'],
  ['GNU GENERAL PUBLIC LICENSE', 'GPL'],
  ['MTI', 'MIT'],
  ['Mozilla Public License', 'MPL'],
  ['Universal Permissive License', 'UPL'],
  ['WTH', 'WTF'],
  ['-License', '']
];

var TRANSPOSED = 0;
var CORRECT = 1;

// Simple corrections to nearly valid identifiers.
var transforms = [
  // e.g. 'mit'
  function (argument) {
    return argument.toUpperCase()
  },
  // e.g. 'MIT '
  function (argument) {
    return argument.trim()
  },
  // e.g. 'M.I.T.'
  function (argument) {
    return argument.replace(/\./g, '')
  },
  // e.g. 'Apache- 2.0'
  function (argument) {
    return argument.replace(/\s+/g, '')
  },
  // e.g. 'CC BY 4.0''
  function (argument) {
    return argument.replace(/\s+/g, '-')
  },
  // e.g. 'LGPLv2.1'
  function (argument) {
    return argument.replace('v', '-')
  },
  // e.g. 'Apache 2.0'
  function (argument) {
    return argument.replace(/,?\s*(\d)/, '-$1')
  },
  // e.g. 'GPL 2'
  function (argument) {
    return argument.replace(/,?\s*(\d)/, '-$1.0')
  },
  // e.g. 'Apache Version 2.0'
  function (argument) {
    return argument
      .replace(/,?\s*(V\.|v\.|V|v|Version|version)\s*(\d)/, '-$2')
  },
  // e.g. 'Apache Version 2'
  function (argument) {
    return argument
      .replace(/,?\s*(V\.|v\.|V|v|Version|version)\s*(\d)/, '-$2.0')
  },
  // e.g. 'ZLIB'
  function (argument) {
    return argument[0].toUpperCase() + argument.slice(1)
  },
  // e.g. 'MPL/2.0'
  function (argument) {
    return argument.replace('/', '-')
  },
  // e.g. 'Apache 2'
  function (argument) {
    return argument
      .replace(/\s*V\s*(\d)/, '-$1')
      .replace(/(\d)$/, '$1.0')
  },
  // e.g. 'GPL-2.0', 'GPL-3.0'
  function (argument) {
    if (argument.indexOf('3.0') !== -1) {
      return argument + '-or-later'
    } else {
      return argument + '-only'
    }
  },
  // e.g. 'GPL-2.0-'
  function (argument) {
    return argument + 'only'
  },
  // e.g. 'GPL2'
  function (argument) {
    return argument.replace(/(\d)$/, '-$1.0')
  },
  // e.g. 'BSD 3'
  function (argument) {
    return argument.replace(/(-| )?(\d)$/, '-$2-Clause')
  },
  // e.g. 'BSD clause 3'
  function (argument) {
    return argument.replace(/(-| )clause(-| )(\d)/, '-$3-Clause')
  },
  // e.g. 'New BSD license'
  function (argument) {
    return argument.replace(/\b(Modified|New|Revised)(-| )?BSD((-| )License)?/i, 'BSD-3-Clause')
  },
  // e.g. 'Simplified BSD license'
  function (argument) {
    return argument.replace(/\bSimplified(-| )?BSD((-| )License)?/i, 'BSD-2-Clause')
  },
  // e.g. 'Free BSD license'
  function (argument) {
    return argument.replace(/\b(Free|Net)(-| )?BSD((-| )License)?/i, 'BSD-2-Clause-$1BSD')
  },
  // e.g. 'Clear BSD license'
  function (argument) {
    return argument.replace(/\bClear(-| )?BSD((-| )License)?/i, 'BSD-3-Clause-Clear')
  },
  // e.g. 'Old BSD License'
  function (argument) {
    return argument.replace(/\b(Old|Original)(-| )?BSD((-| )License)?/i, 'BSD-4-Clause')
  },
  // e.g. 'BY-NC-4.0'
  function (argument) {
    return 'CC-' + argument
  },
  // e.g. 'BY-NC'
  function (argument) {
    return 'CC-' + argument + '-4.0'
  },
  // e.g. 'Attribution-NonCommercial'
  function (argument) {
    return argument
      .replace('Attribution', 'BY')
      .replace('NonCommercial', 'NC')
      .replace('NoDerivatives', 'ND')
      .replace(/ (\d)/, '-$1')
      .replace(/ ?International/, '')
  },
  // e.g. 'Attribution-NonCommercial'
  function (argument) {
    return 'CC-' +
      argument
        .replace('Attribution', 'BY')
        .replace('NonCommercial', 'NC')
        .replace('NoDerivatives', 'ND')
        .replace(/ (\d)/, '-$1')
        .replace(/ ?International/, '') +
      '-4.0'
  }
];

var licensesWithVersions = spdxLicenseIds$1
  .map(function (id) {
    var match = /^(.*)-\d+\.\d+$/.exec(id);
    return match
      ? [match[0], match[1]]
      : [id, null]
  })
  .reduce(function (objectMap, item) {
    var key = item[1];
    objectMap[key] = objectMap[key] || [];
    objectMap[key].push(item[0]);
    return objectMap
  }, {});

var licensesWithOneVersion = Object.keys(licensesWithVersions)
  .map(function makeEntries (key) {
    return [key, licensesWithVersions[key]]
  })
  .filter(function identifySoleVersions (item) {
    return (
      // Licenses has just one valid version suffix.
      item[1].length === 1 &&
      item[0] !== null &&
      // APL will be considered Apache, rather than APL-1.0
      item[0] !== 'APL'
    )
  })
  .map(function createLastResorts (item) {
    return [item[0], item[1][0]]
  });

licensesWithVersions = undefined;

// If all else fails, guess that strings containing certain substrings
// meant to identify certain licenses.
var lastResorts = [
  ['UNLI', 'Unlicense'],
  ['WTF', 'WTFPL'],
  ['2 CLAUSE', 'BSD-2-Clause'],
  ['2-CLAUSE', 'BSD-2-Clause'],
  ['3 CLAUSE', 'BSD-3-Clause'],
  ['3-CLAUSE', 'BSD-3-Clause'],
  ['AFFERO', 'AGPL-3.0-or-later'],
  ['AGPL', 'AGPL-3.0-or-later'],
  ['APACHE', 'Apache-2.0'],
  ['ARTISTIC', 'Artistic-2.0'],
  ['Affero', 'AGPL-3.0-or-later'],
  ['BEER', 'Beerware'],
  ['BOOST', 'BSL-1.0'],
  ['BSD', 'BSD-2-Clause'],
  ['CDDL', 'CDDL-1.1'],
  ['ECLIPSE', 'EPL-1.0'],
  ['FUCK', 'WTFPL'],
  ['GNU', 'GPL-3.0-or-later'],
  ['LGPL', 'LGPL-3.0-or-later'],
  ['GPLV1', 'GPL-1.0-only'],
  ['GPL-1', 'GPL-1.0-only'],
  ['GPLV2', 'GPL-2.0-only'],
  ['GPL-2', 'GPL-2.0-only'],
  ['GPL', 'GPL-3.0-or-later'],
  ['MIT +NO-FALSE-ATTRIBS', 'MITNFA'],
  ['MIT', 'MIT'],
  ['MPL', 'MPL-2.0'],
  ['X11', 'X11'],
  ['ZLIB', 'Zlib']
].concat(licensesWithOneVersion);

var SUBSTRING = 0;
var IDENTIFIER = 1;

var validTransformation = function (identifier) {
  for (var i = 0; i < transforms.length; i++) {
    var transformed = transforms[i](identifier).trim();
    if (transformed !== identifier && valid(transformed)) {
      return transformed
    }
  }
  return null
};

var validLastResort = function (identifier) {
  var upperCased = identifier.toUpperCase();
  for (var i = 0; i < lastResorts.length; i++) {
    var lastResort = lastResorts[i];
    if (upperCased.indexOf(lastResort[SUBSTRING]) > -1) {
      return lastResort[IDENTIFIER]
    }
  }
  return null
};

var anyCorrection = function (identifier, check) {
  for (var i = 0; i < transpositions.length; i++) {
    var transposition = transpositions[i];
    var transposed = transposition[TRANSPOSED];
    if (identifier.indexOf(transposed) > -1) {
      var corrected = identifier.replace(
        transposed,
        transposition[CORRECT]
      );
      var checked = check(corrected);
      if (checked !== null) {
        return checked
      }
    }
  }
  return null
};

var spdxCorrect = function (identifier, options) {
  options = options || {};
  var upgrade = options.upgrade === undefined ? true : !!options.upgrade;
  function postprocess (value) {
    return upgrade ? upgradeGPLs(value) : value
  }
  var validArugment = (
    typeof identifier === 'string' &&
    identifier.trim().length !== 0
  );
  if (!validArugment) {
    throw Error('Invalid argument. Expected non-empty string.')
  }
  identifier = identifier.trim();
  if (valid(identifier)) {
    return postprocess(identifier)
  }
  var noPlus = identifier.replace(/\+$/, '').trim();
  if (valid(noPlus)) {
    return postprocess(noPlus)
  }
  var transformed = validTransformation(identifier);
  if (transformed !== null) {
    return postprocess(transformed)
  }
  transformed = anyCorrection(identifier, function (argument) {
    if (valid(argument)) {
      return argument
    }
    return validTransformation(argument)
  });
  if (transformed !== null) {
    return postprocess(transformed)
  }
  transformed = validLastResort(identifier);
  if (transformed !== null) {
    return postprocess(transformed)
  }
  transformed = anyCorrection(identifier, validLastResort);
  if (transformed !== null) {
    return postprocess(transformed)
  }
  return null
};

function upgradeGPLs (value) {
  if ([
    'GPL-1.0', 'LGPL-1.0', 'AGPL-1.0',
    'GPL-2.0', 'LGPL-2.0', 'AGPL-2.0',
    'LGPL-2.1'
  ].indexOf(value) !== -1) {
    return value + '-only'
  } else if ([
    'GPL-1.0+', 'GPL-2.0+', 'GPL-3.0+',
    'LGPL-2.0+', 'LGPL-2.1+', 'LGPL-3.0+',
    'AGPL-1.0+', 'AGPL-3.0+'
  ].indexOf(value) !== -1) {
    return value.replace(/\+$/, '-or-later')
  } else if (['GPL-3.0', 'LGPL-3.0', 'AGPL-3.0'].indexOf(value) !== -1) {
    return value + '-or-later'
  } else {
    return value
  }
}

var genericWarning = (
  'license should be ' +
  'a valid SPDX license expression (without "LicenseRef"), ' +
  '"UNLICENSED", or ' +
  '"SEE LICENSE IN <filename>"'
);

var fileReferenceRE = /^SEE LICEN[CS]E IN (.+)$/;

function startsWith(prefix, string) {
  return string.slice(0, prefix.length) === prefix;
}

function usesLicenseRef(ast) {
  if (ast.hasOwnProperty('license')) {
    var license = ast.license;
    return (
      startsWith('LicenseRef', license) ||
      startsWith('DocumentRef', license)
    );
  } else {
    return (
      usesLicenseRef(ast.left) ||
      usesLicenseRef(ast.right)
    );
  }
}

var validateNpmPackageLicense = function(argument) {
  var ast;

  try {
    ast = spdxExpressionParse(argument);
  } catch (e) {
    var match;
    if (
      argument === 'UNLICENSED' ||
      argument === 'UNLICENCED'
    ) {
      return {
        validForOldPackages: true,
        validForNewPackages: true,
        unlicensed: true
      };
    } else if (match = fileReferenceRE.exec(argument)) {
      return {
        validForOldPackages: true,
        validForNewPackages: true,
        inFile: match[1]
      };
    } else {
      var result = {
        validForOldPackages: false,
        validForNewPackages: false,
        warnings: [genericWarning]
      };
      if (argument.trim().length !== 0) {
        var corrected = spdxCorrect(argument);
        if (corrected) {
          result.warnings.push(
            'license is similar to the valid expression "' + corrected + '"'
          );
        }
      }
      return result;
    }
  }

  if (usesLicenseRef(ast)) {
    return {
      validForNewPackages: false,
      validForOldPackages: false,
      spdx: true,
      warnings: [genericWarning]
    };
  } else {
    return {
      validForNewPackages: true,
      validForOldPackages: true,
      spdx: true
    };
  }
};

var gitHostInfo = createCommonjsModule(function (module) {

var gitHosts = module.exports = {
  github: {
    // First two are insecure and generally shouldn't be used any more, but
    // they are still supported.
    'protocols': [ 'git', 'http', 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'github.com',
    'treepath': 'tree',
    'filetemplate': 'https://{auth@}raw.githubusercontent.com/{user}/{project}/{committish}/{path}',
    'bugstemplate': 'https://{domain}/{user}/{project}/issues',
    'gittemplate': 'git://{auth@}{domain}/{user}/{project}.git{#committish}',
    'tarballtemplate': 'https://codeload.{domain}/{user}/{project}/tar.gz/{committish}'
  },
  bitbucket: {
    'protocols': [ 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'bitbucket.org',
    'treepath': 'src',
    'tarballtemplate': 'https://{domain}/{user}/{project}/get/{committish}.tar.gz'
  },
  gitlab: {
    'protocols': [ 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'gitlab.com',
    'treepath': 'tree',
    'bugstemplate': 'https://{domain}/{user}/{project}/issues',
    'httpstemplate': 'git+https://{auth@}{domain}/{user}/{projectPath}.git{#committish}',
    'tarballtemplate': 'https://{domain}/{user}/{project}/repository/archive.tar.gz?ref={committish}',
    'pathmatch': /^[/]([^/]+)[/]((?!.*(\/-\/|\/repository\/archive\.tar\.gz\?=.*|\/repository\/[^/]+\/archive.tar.gz$)).*?)(?:[.]git|[/])?$/
  },
  gist: {
    'protocols': [ 'git', 'git+ssh', 'git+https', 'ssh', 'https' ],
    'domain': 'gist.github.com',
    'pathmatch': /^[/](?:([^/]+)[/])?([a-z0-9]{32,})(?:[.]git)?$/,
    'filetemplate': 'https://gist.githubusercontent.com/{user}/{project}/raw{/committish}/{path}',
    'bugstemplate': 'https://{domain}/{project}',
    'gittemplate': 'git://{domain}/{project}.git{#committish}',
    'sshtemplate': 'git@{domain}:/{project}.git{#committish}',
    'sshurltemplate': 'git+ssh://git@{domain}/{project}.git{#committish}',
    'browsetemplate': 'https://{domain}/{project}{/committish}',
    'browsefiletemplate': 'https://{domain}/{project}{/committish}{#path}',
    'docstemplate': 'https://{domain}/{project}{/committish}',
    'httpstemplate': 'git+https://{domain}/{project}.git{#committish}',
    'shortcuttemplate': '{type}:{project}{#committish}',
    'pathtemplate': '{project}{#committish}',
    'tarballtemplate': 'https://codeload.github.com/gist/{project}/tar.gz/{committish}',
    'hashformat': function (fragment) {
      return 'file-' + formatHashFragment(fragment)
    }
  }
};

var gitHostDefaults = {
  'sshtemplate': 'git@{domain}:{user}/{project}.git{#committish}',
  'sshurltemplate': 'git+ssh://git@{domain}/{user}/{project}.git{#committish}',
  'browsetemplate': 'https://{domain}/{user}/{project}{/tree/committish}',
  'browsefiletemplate': 'https://{domain}/{user}/{project}/{treepath}/{committish}/{path}{#fragment}',
  'docstemplate': 'https://{domain}/{user}/{project}{/tree/committish}#readme',
  'httpstemplate': 'git+https://{auth@}{domain}/{user}/{project}.git{#committish}',
  'filetemplate': 'https://{domain}/{user}/{project}/raw/{committish}/{path}',
  'shortcuttemplate': '{type}:{user}/{project}{#committish}',
  'pathtemplate': '{user}/{project}{#committish}',
  'pathmatch': /^[/]([^/]+)[/]([^/]+?)(?:[.]git|[/])?$/,
  'hashformat': formatHashFragment
};

Object.keys(gitHosts).forEach(function (name) {
  Object.keys(gitHostDefaults).forEach(function (key) {
    if (gitHosts[name][key]) return
    gitHosts[name][key] = gitHostDefaults[key];
  });
  gitHosts[name].protocols_re = RegExp('^(' +
    gitHosts[name].protocols.map(function (protocol) {
      return protocol.replace(/([\\+*{}()[\]$^|])/g, '\\$1')
    }).join('|') + '):$');
});

function formatHashFragment (fragment) {
  return fragment.toLowerCase().replace(/^\W+|\/|\W+$/g, '').replace(/\W+/g, '-')
}
});

/* eslint-disable node/no-deprecated-api */

// copy-pasta util._extend from node's source, to avoid pulling
// the whole util module into peoples' webpack bundles.
/* istanbul ignore next */
var extend = Object.assign || function _extend (target, source) {
  // Don't do anything if source isn't an object
  if (source === null || typeof source !== 'object') return target

  var keys = Object.keys(source);
  var i = keys.length;
  while (i--) {
    target[keys[i]] = source[keys[i]];
  }
  return target
};

var gitHost = GitHost;
function GitHost (type, user, auth, project, committish, defaultRepresentation, opts) {
  var gitHostInfo$1 = this;
  gitHostInfo$1.type = type;
  Object.keys(gitHostInfo[type]).forEach(function (key) {
    gitHostInfo$1[key] = gitHostInfo[type][key];
  });
  gitHostInfo$1.user = user;
  gitHostInfo$1.auth = auth;
  gitHostInfo$1.project = project;
  gitHostInfo$1.committish = committish;
  gitHostInfo$1.default = defaultRepresentation;
  gitHostInfo$1.opts = opts || {};
}

GitHost.prototype.hash = function () {
  return this.committish ? '#' + this.committish : ''
};

GitHost.prototype._fill = function (template, opts) {
  if (!template) return
  var vars = extend({}, opts);
  vars.path = vars.path ? vars.path.replace(/^[/]+/g, '') : '';
  opts = extend(extend({}, this.opts), opts);
  var self = this;
  Object.keys(this).forEach(function (key) {
    if (self[key] != null && vars[key] == null) vars[key] = self[key];
  });
  var rawAuth = vars.auth;
  var rawcommittish = vars.committish;
  var rawFragment = vars.fragment;
  var rawPath = vars.path;
  var rawProject = vars.project;
  Object.keys(vars).forEach(function (key) {
    var value = vars[key];
    if ((key === 'path' || key === 'project') && typeof value === 'string') {
      vars[key] = value.split('/').map(function (pathComponent) {
        return encodeURIComponent(pathComponent)
      }).join('/');
    } else {
      vars[key] = encodeURIComponent(value);
    }
  });
  vars['auth@'] = rawAuth ? rawAuth + '@' : '';
  vars['#fragment'] = rawFragment ? '#' + this.hashformat(rawFragment) : '';
  vars.fragment = vars.fragment ? vars.fragment : '';
  vars['#path'] = rawPath ? '#' + this.hashformat(rawPath) : '';
  vars['/path'] = vars.path ? '/' + vars.path : '';
  vars.projectPath = rawProject.split('/').map(encodeURIComponent).join('/');
  if (opts.noCommittish) {
    vars['#committish'] = '';
    vars['/tree/committish'] = '';
    vars['/committish'] = '';
    vars.committish = '';
  } else {
    vars['#committish'] = rawcommittish ? '#' + rawcommittish : '';
    vars['/tree/committish'] = vars.committish
      ? '/' + vars.treepath + '/' + vars.committish
      : '';
    vars['/committish'] = vars.committish ? '/' + vars.committish : '';
    vars.committish = vars.committish || 'master';
  }
  var res = template;
  Object.keys(vars).forEach(function (key) {
    res = res.replace(new RegExp('[{]' + key + '[}]', 'g'), vars[key]);
  });
  if (opts.noGitPlus) {
    return res.replace(/^git[+]/, '')
  } else {
    return res
  }
};

GitHost.prototype.ssh = function (opts) {
  return this._fill(this.sshtemplate, opts)
};

GitHost.prototype.sshurl = function (opts) {
  return this._fill(this.sshurltemplate, opts)
};

GitHost.prototype.browse = function (P, F, opts) {
  if (typeof P === 'string') {
    if (typeof F !== 'string') {
      opts = F;
      F = null;
    }
    return this._fill(this.browsefiletemplate, extend({
      fragment: F,
      path: P
    }, opts))
  } else {
    return this._fill(this.browsetemplate, P)
  }
};

GitHost.prototype.docs = function (opts) {
  return this._fill(this.docstemplate, opts)
};

GitHost.prototype.bugs = function (opts) {
  return this._fill(this.bugstemplate, opts)
};

GitHost.prototype.https = function (opts) {
  return this._fill(this.httpstemplate, opts)
};

GitHost.prototype.git = function (opts) {
  return this._fill(this.gittemplate, opts)
};

GitHost.prototype.shortcut = function (opts) {
  return this._fill(this.shortcuttemplate, opts)
};

GitHost.prototype.path = function (opts) {
  return this._fill(this.pathtemplate, opts)
};

GitHost.prototype.tarball = function (opts_) {
  var opts = extend({}, opts_, { noCommittish: false });
  return this._fill(this.tarballtemplate, opts)
};

GitHost.prototype.file = function (P, opts) {
  return this._fill(this.filetemplate, extend({ path: P }, opts))
};

GitHost.prototype.getDefaultRepresentation = function () {
  return this.default
};

GitHost.prototype.toString = function (opts) {
  if (this.default && typeof this[this.default] === 'function') return this[this.default](opts)
  return this.sshurl(opts)
};

var hostedGitInfo = createCommonjsModule(function (module) {


var GitHost = module.exports = gitHost;

var protocolToRepresentationMap = {
  'git+ssh:': 'sshurl',
  'git+https:': 'https',
  'ssh:': 'sshurl',
  'git:': 'git'
};

function protocolToRepresentation (protocol) {
  return protocolToRepresentationMap[protocol] || protocol.slice(0, -1)
}

var authProtocols = {
  'git:': true,
  'https:': true,
  'git+https:': true,
  'http:': true,
  'git+http:': true
};

var cache = {};

module.exports.fromUrl = function (giturl, opts) {
  if (typeof giturl !== 'string') return
  var key = giturl + JSON.stringify(opts || {});

  if (!(key in cache)) {
    cache[key] = fromUrl(giturl, opts);
  }

  return cache[key]
};

function fromUrl (giturl, opts) {
  if (giturl == null || giturl === '') return
  var url = fixupUnqualifiedGist(
    isGitHubShorthand(giturl) ? 'github:' + giturl : giturl
  );
  var parsed = parseGitUrl(url);
  var shortcutMatch = url.match(new RegExp('^([^:]+):(?:(?:[^@:]+(?:[^@]+)?@)?([^/]*))[/](.+?)(?:[.]git)?($|#)'));
  var matches = Object.keys(gitHostInfo).map(function (gitHostName) {
    try {
      var gitHostInfo$1 = gitHostInfo[gitHostName];
      var auth = null;
      if (parsed.auth && authProtocols[parsed.protocol]) {
        auth = parsed.auth;
      }
      var committish = parsed.hash ? decodeURIComponent(parsed.hash.substr(1)) : null;
      var user = null;
      var project = null;
      var defaultRepresentation = null;
      if (shortcutMatch && shortcutMatch[1] === gitHostName) {
        user = shortcutMatch[2] && decodeURIComponent(shortcutMatch[2]);
        project = decodeURIComponent(shortcutMatch[3]);
        defaultRepresentation = 'shortcut';
      } else {
        if (parsed.host && parsed.host !== gitHostInfo$1.domain && parsed.host.replace(/^www[.]/, '') !== gitHostInfo$1.domain) return
        if (!gitHostInfo$1.protocols_re.test(parsed.protocol)) return
        if (!parsed.path) return
        var pathmatch = gitHostInfo$1.pathmatch;
        var matched = parsed.path.match(pathmatch);
        if (!matched) return
        /* istanbul ignore else */
        if (matched[1] !== null && matched[1] !== undefined) {
          user = decodeURIComponent(matched[1].replace(/^:/, ''));
        }
        project = decodeURIComponent(matched[2]);
        defaultRepresentation = protocolToRepresentation(parsed.protocol);
      }
      return new GitHost(gitHostName, user, auth, project, committish, defaultRepresentation, opts)
    } catch (ex) {
      /* istanbul ignore else */
      if (ex instanceof URIError) ; else throw ex
    }
  }).filter(function (gitHostInfo) { return gitHostInfo });
  if (matches.length !== 1) return
  return matches[0]
}

function isGitHubShorthand (arg) {
  // Note: This does not fully test the git ref format.
  // See https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html
  //
  // The only way to do this properly would be to shell out to
  // git-check-ref-format, and as this is a fast sync function,
  // we don't want to do that.  Just let git fail if it turns
  // out that the commit-ish is invalid.
  // GH usernames cannot start with . or -
  return /^[^:@%/\s.-][^:@%/\s]*[/][^:@\s/%]+(?:#.*)?$/.test(arg)
}

function fixupUnqualifiedGist (giturl) {
  // necessary for round-tripping gists
  var parsed = url$1.parse(giturl);
  if (parsed.protocol === 'gist:' && parsed.host && !parsed.path) {
    return parsed.protocol + '/' + parsed.host
  } else {
    return giturl
  }
}

function parseGitUrl (giturl) {
  var matched = giturl.match(/^([^@]+)@([^:/]+):[/]?((?:[^/]+[/])?[^/]+?)(?:[.]git)?(#.*)?$/);
  if (!matched) {
    var legacy = url$1.parse(giturl);
    // If we don't have url.URL, then sorry, this is just not fixable.
    // This affects Node <= 6.12.
    if (legacy.auth && typeof url$1.URL === 'function') {
      // git urls can be in the form of scp-style/ssh-connect strings, like
      // git+ssh://user@host.com:some/path, which the legacy url parser
      // supports, but WhatWG url.URL class does not.  However, the legacy
      // parser de-urlencodes the username and password, so something like
      // https://user%3An%40me:p%40ss%3Aword@x.com/ becomes
      // https://user:n@me:p@ss:word@x.com/ which is all kinds of wrong.
      // Pull off just the auth and host, so we dont' get the confusing
      // scp-style URL, then pass that to the WhatWG parser to get the
      // auth properly escaped.
      var authmatch = giturl.match(/[^@]+@[^:/]+/);
      /* istanbul ignore else - this should be impossible */
      if (authmatch) {
        var whatwg = new url$1.URL(authmatch[0]);
        legacy.auth = whatwg.username || '';
        if (whatwg.password) legacy.auth += ':' + whatwg.password;
      }
    }
    return legacy
  }
  return {
    protocol: 'git+ssh:',
    slashes: true,
    auth: matched[1],
    host: matched[2],
    port: null,
    hostname: matched[2],
    hash: matched[4],
    search: null,
    query: null,
    pathname: '/' + matched[3],
    path: '/' + matched[3],
    href: 'git+ssh://' + matched[1] + '@' + matched[2] +
          '/' + matched[3] + (matched[4] || '')
  }
}
});

var extract_description = extractDescription;

// Extracts description from contents of a readme file in markdown format
function extractDescription (d) {
  if (!d) return;
  if (d === "ERROR: No README data found!") return;
  // the first block of text before the first heading
  // that isn't the first line heading
  d = d.trim().split('\n');
  for (var s = 0; d[s] && d[s].trim().match(/^(#|$)/); s ++);
  var l = d.length;
  for (var e = s + 1; e < l && d[e].trim(); e ++);
  return d.slice(s, e).join(' ').trim()
}

var topLevel = {
	dependancies: "dependencies",
	dependecies: "dependencies",
	depdenencies: "dependencies",
	devEependencies: "devDependencies",
	depends: "dependencies",
	"dev-dependencies": "devDependencies",
	devDependences: "devDependencies",
	devDepenencies: "devDependencies",
	devdependencies: "devDependencies",
	repostitory: "repository",
	repo: "repository",
	prefereGlobal: "preferGlobal",
	hompage: "homepage",
	hampage: "homepage",
	autohr: "author",
	autor: "author",
	contributers: "contributors",
	publicationConfig: "publishConfig",
	script: "scripts"
};
var bugs = {
	web: "url",
	name: "url"
};
var script = {
	server: "start",
	tests: "test"
};
var typos = {
	topLevel: topLevel,
	bugs: bugs,
	script: script
};

var typos$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	topLevel: topLevel,
	bugs: bugs,
	script: script,
	'default': typos
});

var typos$2 = getCjsExportFromNamespace(typos$1);

var fixer_1 = createCommonjsModule(function (module) {
var isBuiltinModule = resolve.isCore;
var depTypes = ["dependencies","devDependencies","optionalDependencies"];




var fixer = module.exports = {
  // default warning function
  warn: function() {},

  fixRepositoryField: function(data) {
    if (data.repositories) {
      this.warn("repositories");
      data.repository = data.repositories[0];
    }
    if (!data.repository) return this.warn("missingRepository")
    if (typeof data.repository === "string") {
      data.repository = {
        type: "git",
        url: data.repository
      };
    }
    var r = data.repository.url || "";
    if (r) {
      var hosted = hostedGitInfo.fromUrl(r);
      if (hosted) {
        r = data.repository.url
          = hosted.getDefaultRepresentation() == "shortcut" ? hosted.https() : hosted.toString();
      }
    }

    if (r.match(/github.com\/[^\/]+\/[^\/]+\.git\.git$/)) {
      this.warn("brokenGitUrl", r);
    }
  }

, fixTypos: function(data) {
    Object.keys(typos$2.topLevel).forEach(function (d) {
      if (data.hasOwnProperty(d)) {
        this.warn("typo", d, typos$2.topLevel[d]);
      }
    }, this);
  }

, fixScriptsField: function(data) {
    if (!data.scripts) return
    if (typeof data.scripts !== "object") {
      this.warn("nonObjectScripts");
      delete data.scripts;
      return
    }
    Object.keys(data.scripts).forEach(function (k) {
      if (typeof data.scripts[k] !== "string") {
        this.warn("nonStringScript");
        delete data.scripts[k];
      } else if (typos$2.script[k] && !data.scripts[typos$2.script[k]]) {
        this.warn("typo", k, typos$2.script[k], "scripts");
      }
    }, this);
  }

, fixFilesField: function(data) {
    var files = data.files;
    if (files && !Array.isArray(files)) {
      this.warn("nonArrayFiles");
      delete data.files;
    } else if (data.files) {
      data.files = data.files.filter(function(file) {
        if (!file || typeof file !== "string") {
          this.warn("invalidFilename", file);
          return false
        } else {
          return true
        }
      }, this);
    }
  }

, fixBinField: function(data) {
    if (!data.bin) return;
    if (typeof data.bin === "string") {
      var b = {};
      var match;
      if (match = data.name.match(/^@[^/]+[/](.*)$/)) {
        b[match[1]] = data.bin;
      } else {
        b[data.name] = data.bin;
      }
      data.bin = b;
    }
  }

, fixManField: function(data) {
    if (!data.man) return;
    if (typeof data.man === "string") {
      data.man = [ data.man ];
    }
  }
, fixBundleDependenciesField: function(data) {
    var bdd = "bundledDependencies";
    var bd = "bundleDependencies";
    if (data[bdd] && !data[bd]) {
      data[bd] = data[bdd];
      delete data[bdd];
    }
    if (data[bd] && !Array.isArray(data[bd])) {
      this.warn("nonArrayBundleDependencies");
      delete data[bd];
    } else if (data[bd]) {
      data[bd] = data[bd].filter(function(bd) {
        if (!bd || typeof bd !== 'string') {
          this.warn("nonStringBundleDependency", bd);
          return false
        } else {
          if (!data.dependencies) {
            data.dependencies = {};
          }
          if (!data.dependencies.hasOwnProperty(bd)) {
            this.warn("nonDependencyBundleDependency", bd);
            data.dependencies[bd] = "*";
          }
          return true
        }
      }, this);
    }
  }

, fixDependencies: function(data, strict) {
    objectifyDeps(data, this.warn);
    addOptionalDepsToDeps(data, this.warn);
    this.fixBundleDependenciesField(data)

    ;['dependencies','devDependencies'].forEach(function(deps) {
      if (!(deps in data)) return
      if (!data[deps] || typeof data[deps] !== "object") {
        this.warn("nonObjectDependencies", deps);
        delete data[deps];
        return
      }
      Object.keys(data[deps]).forEach(function (d) {
        var r = data[deps][d];
        if (typeof r !== 'string') {
          this.warn("nonStringDependency", d, JSON.stringify(r));
          delete data[deps][d];
        }
        var hosted = hostedGitInfo.fromUrl(data[deps][d]);
        if (hosted) data[deps][d] = hosted.toString();
      }, this);
    }, this);
  }

, fixModulesField: function (data) {
    if (data.modules) {
      this.warn("deprecatedModules");
      delete data.modules;
    }
  }

, fixKeywordsField: function (data) {
    if (typeof data.keywords === "string") {
      data.keywords = data.keywords.split(/,\s+/);
    }
    if (data.keywords && !Array.isArray(data.keywords)) {
      delete data.keywords;
      this.warn("nonArrayKeywords");
    } else if (data.keywords) {
      data.keywords = data.keywords.filter(function(kw) {
        if (typeof kw !== "string" || !kw) {
          this.warn("nonStringKeyword");
          return false
        } else {
          return true
        }
      }, this);
    }
  }

, fixVersionField: function(data, strict) {
    // allow "loose" semver 1.0 versions in non-strict mode
    // enforce strict semver 2.0 compliance in strict mode
    var loose = !strict;
    if (!data.version) {
      data.version = "";
      return true
    }
    if (!semver.valid(data.version, loose)) {
      throw new Error('Invalid version: "'+ data.version + '"')
    }
    data.version = semver.clean(data.version, loose);
    return true
  }

, fixPeople: function(data) {
    modifyPeople(data, unParsePerson);
    modifyPeople(data, parsePerson);
  }

, fixNameField: function(data, options) {
    if (typeof options === "boolean") options = {strict: options};
    else if (typeof options === "undefined") options = {};
    var strict = options.strict;
    if (!data.name && !strict) {
      data.name = "";
      return
    }
    if (typeof data.name !== "string") {
      throw new Error("name field must be a string.")
    }
    if (!strict)
      data.name = data.name.trim();
    ensureValidName(data.name, strict, options.allowLegacyCase);
    if (isBuiltinModule(data.name))
      this.warn("conflictingName", data.name);
  }


, fixDescriptionField: function (data) {
    if (data.description && typeof data.description !== 'string') {
      this.warn("nonStringDescription");
      delete data.description;
    }
    if (data.readme && !data.description)
      data.description = extract_description(data.readme);
      if(data.description === undefined) delete data.description;
    if (!data.description) this.warn("missingDescription");
  }

, fixReadmeField: function (data) {
    if (!data.readme) {
      this.warn("missingReadme");
      data.readme = "ERROR: No README data found!";
    }
  }

, fixBugsField: function(data) {
    if (!data.bugs && data.repository && data.repository.url) {
      var hosted = hostedGitInfo.fromUrl(data.repository.url);
      if(hosted && hosted.bugs()) {
        data.bugs = {url: hosted.bugs()};
      }
    }
    else if(data.bugs) {
      var emailRe = /^.+@.*\..+$/;
      if(typeof data.bugs == "string") {
        if(emailRe.test(data.bugs))
          data.bugs = {email:data.bugs};
        else if(url$1.parse(data.bugs).protocol)
          data.bugs = {url: data.bugs};
        else
          this.warn("nonEmailUrlBugsString");
      }
      else {
        bugsTypos(data.bugs, this.warn);
        var oldBugs = data.bugs;
        data.bugs = {};
        if(oldBugs.url) {
          if(typeof(oldBugs.url) == "string" && url$1.parse(oldBugs.url).protocol)
            data.bugs.url = oldBugs.url;
          else
            this.warn("nonUrlBugsUrlField");
        }
        if(oldBugs.email) {
          if(typeof(oldBugs.email) == "string" && emailRe.test(oldBugs.email))
            data.bugs.email = oldBugs.email;
          else
            this.warn("nonEmailBugsEmailField");
        }
      }
      if(!data.bugs.email && !data.bugs.url) {
        delete data.bugs;
        this.warn("emptyNormalizedBugs");
      }
    }
  }

, fixHomepageField: function(data) {
    if (!data.homepage && data.repository && data.repository.url) {
      var hosted = hostedGitInfo.fromUrl(data.repository.url);
      if (hosted && hosted.docs()) data.homepage = hosted.docs();
    }
    if (!data.homepage) return

    if(typeof data.homepage !== "string") {
      this.warn("nonUrlHomepage");
      return delete data.homepage
    }
    if(!url$1.parse(data.homepage).protocol) {
      data.homepage = "http://" + data.homepage;
    }
  }

, fixLicenseField: function(data) {
    if (!data.license) {
      return this.warn("missingLicense")
    } else {
      if (
        typeof(data.license) !== 'string' ||
        data.license.length < 1 ||
        data.license.trim() === ''
      ) {
        this.warn("invalidLicense");
      } else {
        if (!validateNpmPackageLicense(data.license).validForNewPackages)
          this.warn("invalidLicense");
      }
    }
  }
};

function isValidScopedPackageName(spec) {
  if (spec.charAt(0) !== '@') return false

  var rest = spec.slice(1).split('/');
  if (rest.length !== 2) return false

  return rest[0] && rest[1] &&
    rest[0] === encodeURIComponent(rest[0]) &&
    rest[1] === encodeURIComponent(rest[1])
}

function isCorrectlyEncodedName(spec) {
  return !spec.match(/[\/@\s\+%:]/) &&
    spec === encodeURIComponent(spec)
}

function ensureValidName (name, strict, allowLegacyCase) {
  if (name.charAt(0) === "." ||
      !(isValidScopedPackageName(name) || isCorrectlyEncodedName(name)) ||
      (strict && (!allowLegacyCase) && name !== name.toLowerCase()) ||
      name.toLowerCase() === "node_modules" ||
      name.toLowerCase() === "favicon.ico") {
        throw new Error("Invalid name: " + JSON.stringify(name))
  }
}

function modifyPeople (data, fn) {
  if (data.author) data.author = fn(data.author)
  ;["maintainers", "contributors"].forEach(function (set) {
    if (!Array.isArray(data[set])) return;
    data[set] = data[set].map(fn);
  });
  return data
}

function unParsePerson (person) {
  if (typeof person === "string") return person
  var name = person.name || "";
  var u = person.url || person.web;
  var url = u ? (" ("+u+")") : "";
  var e = person.email || person.mail;
  var email = e ? (" <"+e+">") : "";
  return name+email+url
}

function parsePerson (person) {
  if (typeof person !== "string") return person
  var name = person.match(/^([^\(<]+)/);
  var url = person.match(/\(([^\)]+)\)/);
  var email = person.match(/<([^>]+)>/);
  var obj = {};
  if (name && name[0].trim()) obj.name = name[0].trim();
  if (email) obj.email = email[1];
  if (url) obj.url = url[1];
  return obj
}

function addOptionalDepsToDeps (data, warn) {
  var o = data.optionalDependencies;
  if (!o) return;
  var d = data.dependencies || {};
  Object.keys(o).forEach(function (k) {
    d[k] = o[k];
  });
  data.dependencies = d;
}

function depObjectify (deps, type, warn) {
  if (!deps) return {}
  if (typeof deps === "string") {
    deps = deps.trim().split(/[\n\r\s\t ,]+/);
  }
  if (!Array.isArray(deps)) return deps
  warn("deprecatedArrayDependencies", type);
  var o = {};
  deps.filter(function (d) {
    return typeof d === "string"
  }).forEach(function(d) {
    d = d.trim().split(/(:?[@\s><=])/);
    var dn = d.shift();
    var dv = d.join("");
    dv = dv.trim();
    dv = dv.replace(/^@/, "");
    o[dn] = dv;
  });
  return o
}

function objectifyDeps (data, warn) {
  depTypes.forEach(function (type) {
    if (!data[type]) return;
    data[type] = depObjectify(data[type], type, warn);
  });
}

function bugsTypos(bugs, warn) {
  if (!bugs) return
  Object.keys(bugs).forEach(function (k) {
    if (typos$2.bugs[k]) {
      warn("typo", k, typos$2.bugs[k], "bugs");
      bugs[typos$2.bugs[k]] = bugs[k];
      delete bugs[k];
    }
  });
}
});

var repositories = "'repositories' (plural) Not supported. Please pick one as the 'repository' field";
var missingRepository = "No repository field.";
var brokenGitUrl = "Probably broken git url: %s";
var nonObjectScripts = "scripts must be an object";
var nonStringScript = "script values must be string commands";
var nonArrayFiles = "Invalid 'files' member";
var invalidFilename = "Invalid filename in 'files' list: %s";
var nonArrayBundleDependencies = "Invalid 'bundleDependencies' list. Must be array of package names";
var nonStringBundleDependency = "Invalid bundleDependencies member: %s";
var nonDependencyBundleDependency = "Non-dependency in bundleDependencies: %s";
var nonObjectDependencies = "%s field must be an object";
var nonStringDependency = "Invalid dependency: %s %s";
var deprecatedArrayDependencies = "specifying %s as array is deprecated";
var deprecatedModules = "modules field is deprecated";
var nonArrayKeywords = "keywords should be an array of strings";
var nonStringKeyword = "keywords should be an array of strings";
var conflictingName = "%s is also the name of a node core module.";
var nonStringDescription = "'description' field should be a string";
var missingDescription = "No description";
var missingReadme = "No README data";
var missingLicense = "No license field.";
var nonEmailUrlBugsString = "Bug string field must be url, email, or {email,url}";
var nonUrlBugsUrlField = "bugs.url field must be a string url. Deleted.";
var nonEmailBugsEmailField = "bugs.email field must be a string email. Deleted.";
var emptyNormalizedBugs = "Normalized value of bugs field is an empty object. Deleted.";
var nonUrlHomepage = "homepage field must be a string url. Deleted.";
var invalidLicense = "license should be a valid SPDX license expression";
var typo = "%s should probably be %s.";
var warning_messages = {
	repositories: repositories,
	missingRepository: missingRepository,
	brokenGitUrl: brokenGitUrl,
	nonObjectScripts: nonObjectScripts,
	nonStringScript: nonStringScript,
	nonArrayFiles: nonArrayFiles,
	invalidFilename: invalidFilename,
	nonArrayBundleDependencies: nonArrayBundleDependencies,
	nonStringBundleDependency: nonStringBundleDependency,
	nonDependencyBundleDependency: nonDependencyBundleDependency,
	nonObjectDependencies: nonObjectDependencies,
	nonStringDependency: nonStringDependency,
	deprecatedArrayDependencies: deprecatedArrayDependencies,
	deprecatedModules: deprecatedModules,
	nonArrayKeywords: nonArrayKeywords,
	nonStringKeyword: nonStringKeyword,
	conflictingName: conflictingName,
	nonStringDescription: nonStringDescription,
	missingDescription: missingDescription,
	missingReadme: missingReadme,
	missingLicense: missingLicense,
	nonEmailUrlBugsString: nonEmailUrlBugsString,
	nonUrlBugsUrlField: nonUrlBugsUrlField,
	nonEmailBugsEmailField: nonEmailBugsEmailField,
	emptyNormalizedBugs: emptyNormalizedBugs,
	nonUrlHomepage: nonUrlHomepage,
	invalidLicense: invalidLicense,
	typo: typo
};

var warning_messages$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	repositories: repositories,
	missingRepository: missingRepository,
	brokenGitUrl: brokenGitUrl,
	nonObjectScripts: nonObjectScripts,
	nonStringScript: nonStringScript,
	nonArrayFiles: nonArrayFiles,
	invalidFilename: invalidFilename,
	nonArrayBundleDependencies: nonArrayBundleDependencies,
	nonStringBundleDependency: nonStringBundleDependency,
	nonDependencyBundleDependency: nonDependencyBundleDependency,
	nonObjectDependencies: nonObjectDependencies,
	nonStringDependency: nonStringDependency,
	deprecatedArrayDependencies: deprecatedArrayDependencies,
	deprecatedModules: deprecatedModules,
	nonArrayKeywords: nonArrayKeywords,
	nonStringKeyword: nonStringKeyword,
	conflictingName: conflictingName,
	nonStringDescription: nonStringDescription,
	missingDescription: missingDescription,
	missingReadme: missingReadme,
	missingLicense: missingLicense,
	nonEmailUrlBugsString: nonEmailUrlBugsString,
	nonUrlBugsUrlField: nonUrlBugsUrlField,
	nonEmailBugsEmailField: nonEmailBugsEmailField,
	emptyNormalizedBugs: emptyNormalizedBugs,
	nonUrlHomepage: nonUrlHomepage,
	invalidLicense: invalidLicense,
	typo: typo,
	'default': warning_messages
});

var messages = getCjsExportFromNamespace(warning_messages$1);

var make_warning = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  var warningName = args.shift();
  if (warningName == "typo") {
    return makeTypoWarning.apply(null,args)
  }
  else {
    var msgTemplate = messages[warningName] ? messages[warningName] : warningName + ": '%s'";
    args.unshift(msgTemplate);
    return util$2.format.apply(null, args)
  }
};

function makeTypoWarning (providedName, probableName, field) {
  if (field) {
    providedName = field + "['" + providedName + "']";
    probableName = field + "['" + probableName + "']";
  }
  return util$2.format(messages.typo, providedName, probableName)
}

var normalize_1 = normalize;


normalize.fixer = fixer_1;



var fieldsToFix = ['name','version','description','repository','modules','scripts'
                  ,'files','bin','man','bugs','keywords','readme','homepage','license'];
var otherThingsToFix = ['dependencies','people', 'typos'];

var thingsToFix = fieldsToFix.map(function(fieldName) {
  return ucFirst(fieldName) + "Field"
});
// two ways to do this in CoffeeScript on only one line, sub-70 chars:
// thingsToFix = fieldsToFix.map (name) -> ucFirst(name) + "Field"
// thingsToFix = (ucFirst(name) + "Field" for name in fieldsToFix)
thingsToFix = thingsToFix.concat(otherThingsToFix);

function normalize (data, warn, strict) {
  if(warn === true) warn = null, strict = true;
  if(!strict) strict = false;
  if(!warn || data.private) warn = function(msg) { /* noop */ };

  if (data.scripts &&
      data.scripts.install === "node-gyp rebuild" &&
      !data.scripts.preinstall) {
    data.gypfile = true;
  }
  fixer_1.warn = function() { warn(make_warning.apply(null, arguments)); };
  thingsToFix.forEach(function(thingName) {
    fixer_1["fix" + ucFirst(thingName)](data, strict);
  });
  data._id = data.name + "@" + data.version;
}

function ucFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const {promisify: promisify$2} = util$2;




const readFileAsync = promisify$2(fs$1.readFile);

var readPkg = async options => {
	options = {
		cwd: process.cwd(),
		normalize: true,
		...options
	};

	const filePath = path$3.resolve(options.cwd, 'package.json');
	const json = parseJson$1(await readFileAsync(filePath, 'utf8'));

	if (options.normalize) {
		normalize_1(json);
	}

	return json;
};

var sync$3 = options => {
	options = {
		cwd: process.cwd(),
		normalize: true,
		...options
	};

	const filePath = path$3.resolve(options.cwd, 'package.json');
	const json = parseJson$1(fs$1.readFileSync(filePath, 'utf8'));

	if (options.normalize) {
		normalize_1(json);
	}

	return json;
};
readPkg.sync = sync$3;

var readPkgUp = async options => {
	const filePath = await findUp('package.json', options);

	if (!filePath) {
		return;
	}

	return {
		packageJson: await readPkg({...options, cwd: path$3.dirname(filePath)}),
		path: filePath
	};
};

var sync$4 = options => {
	const filePath = findUp.sync('package.json', options);

	if (!filePath) {
		return;
	}

	return {
		packageJson: readPkg.sync({...options, cwd: path$3.dirname(filePath)}),
		path: filePath
	};
};
readPkgUp.sync = sync$4;

var shouldLoadAsEsm_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.clearCachedLookups = clearCachedLookups;
exports.default = cachedShouldLoadAsEsm;

function _path() {
  const data = path$3;

  _path = function () {
    return data;
  };

  return data;
}

function _vm() {
  const data = vm$1;

  _vm = function () {
    return data;
  };

  return data;
}

function _readPkgUp() {
  const data = _interopRequireDefault(readPkgUp);

  _readPkgUp = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @ts-expect-error: experimental, not added to the types
const runtimeSupportsVmModules = typeof _vm().SyntheticModule === 'function';
const cachedFileLookups = new Map();
const cachedDirLookups = new Map();

function clearCachedLookups() {
  cachedFileLookups.clear();
  cachedDirLookups.clear();
}

function cachedShouldLoadAsEsm(path) {
  let cachedLookup = cachedFileLookups.get(path);

  if (cachedLookup === undefined) {
    cachedLookup = shouldLoadAsEsm(path);
    cachedFileLookups.set(path, cachedLookup);
  }

  return cachedLookup;
} // this is a bad version of what https://github.com/nodejs/modules/issues/393 would provide

function shouldLoadAsEsm(path) {
  if (!runtimeSupportsVmModules) {
    return false;
  }

  const extension = (0, _path().extname)(path);

  if (extension === '.mjs') {
    return true;
  }

  if (extension === '.cjs') {
    return false;
  } // this isn't correct - we might wanna load any file as a module (using synthetic module)
  // do we need an option to Jest so people can opt in to ESM for non-js?

  if (extension !== '.js') {
    return false;
  }

  const cwd = (0, _path().dirname)(path);
  let cachedLookup = cachedDirLookups.get(cwd);

  if (cachedLookup === undefined) {
    cachedLookup = cachedPkgCheck(cwd);
    cachedFileLookups.set(cwd, cachedLookup);
  }

  return cachedLookup;
}

function cachedPkgCheck(cwd) {
  // TODO: can we cache lookups somehow?
  const pkg = _readPkgUp().default.sync({
    cwd,
    normalize: false
  });

  if (!pkg) {
    return false;
  }

  return pkg.packageJson.type === 'module';
}
});

var build$4 = createCommonjsModule(function (module) {

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function _jestUtil() {
  const data = build;

  _jestUtil = function () {
    return data;
  };

  return data;
}

function _slash() {
  const data = _interopRequireDefault(slash);

  _slash = function () {
    return data;
  };

  return data;
}

var _nodeModulesPaths = _interopRequireDefault(nodeModulesPaths_1);

var _isBuiltinModule = _interopRequireDefault(isBuiltinModule_1);

var _defaultResolver = _interopRequireWildcard(defaultResolver_1);

var _ModuleNotFoundError = _interopRequireDefault(
  ModuleNotFoundError_1
);

var _shouldLoadAsEsm = _interopRequireWildcard(shouldLoadAsEsm_1);

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

const NATIVE_PLATFORM = 'native'; // We might be inside a symlink.

const resolvedCwd = (0, _jestUtil().tryRealpath)(process.cwd());
const {NODE_PATH} = process.env;
const nodePaths = NODE_PATH
  ? NODE_PATH.split(path().delimiter)
      .filter(Boolean) // The resolver expects absolute paths.
      .map(p => path().resolve(resolvedCwd, p))
  : undefined;
/* eslint-disable-next-line no-redeclare */

class Resolver {
  constructor(moduleMap, options) {
    _defineProperty(this, '_options', void 0);

    _defineProperty(this, '_moduleMap', void 0);

    _defineProperty(this, '_moduleIDCache', void 0);

    _defineProperty(this, '_moduleNameCache', void 0);

    _defineProperty(this, '_modulePathCache', void 0);

    _defineProperty(this, '_supportsNativePlatform', void 0);

    this._options = {
      defaultPlatform: options.defaultPlatform,
      extensions: options.extensions,
      hasCoreModules:
        options.hasCoreModules === undefined ? true : options.hasCoreModules,
      moduleDirectories: options.moduleDirectories || ['node_modules'],
      moduleNameMapper: options.moduleNameMapper,
      modulePaths: options.modulePaths,
      platforms: options.platforms,
      resolver: options.resolver,
      rootDir: options.rootDir
    };
    this._supportsNativePlatform = options.platforms
      ? options.platforms.includes(NATIVE_PLATFORM)
      : false;
    this._moduleMap = moduleMap;
    this._moduleIDCache = new Map();
    this._moduleNameCache = new Map();
    this._modulePathCache = new Map();
  }

  static tryCastModuleNotFoundError(error) {
    if (error instanceof _ModuleNotFoundError.default) {
      return error;
    }

    const casted = error;

    if (casted.code === 'MODULE_NOT_FOUND') {
      return _ModuleNotFoundError.default.duckType(casted);
    }

    return null;
  }

  static clearDefaultResolverCache() {
    (0, _defaultResolver.clearDefaultResolverCache)();
    (0, _shouldLoadAsEsm.clearCachedLookups)();
  }

  static findNodeModule(path, options) {
    const resolver = options.resolver
      ? commonjsRequire(options.resolver)
      : _defaultResolver.default;
    const paths = options.paths;

    try {
      return resolver(path, {
        basedir: options.basedir,
        browser: options.browser,
        defaultResolver: _defaultResolver.default,
        extensions: options.extensions,
        moduleDirectory: options.moduleDirectory,
        paths: paths ? (nodePaths || []).concat(paths) : nodePaths,
        rootDir: options.rootDir
      });
    } catch (e) {
      if (options.throwIfNotFound) {
        throw e;
      }
    }

    return null;
  } // unstable as it should be replaced by https://github.com/nodejs/modules/issues/393, and we don't want people to use it

  resolveModuleFromDirIfExists(dirname, moduleName, options) {
    const paths = (options && options.paths) || this._options.modulePaths;
    const moduleDirectory = this._options.moduleDirectories;
    const key = dirname + path().delimiter + moduleName;
    const defaultPlatform = this._options.defaultPlatform;

    const extensions = this._options.extensions.slice();

    let module;

    if (this._supportsNativePlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => '.' + NATIVE_PLATFORM + ext)
      );
    }

    if (defaultPlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => '.' + defaultPlatform + ext)
      );
    } // 1. If we have already resolved this module for this directory name,
    // return a value from the cache.

    const cacheResult = this._moduleNameCache.get(key);

    if (cacheResult) {
      return cacheResult;
    } // 2. Check if the module is a haste module.

    module = this.getModule(moduleName);

    if (module) {
      this._moduleNameCache.set(key, module);

      return module;
    } // 3. Check if the module is a node module and resolve it based on
    // the node module resolution algorithm. If skipNodeResolution is given we
    // ignore all modules that look like node modules (ie. are not relative
    // requires). This enables us to speed up resolution when we build a
    // dependency graph because we don't have to look at modules that may not
    // exist and aren't mocked.

    const skipResolution =
      options && options.skipNodeResolution && !moduleName.includes(path().sep);

    const resolveNodeModule = (name, throwIfNotFound = false) =>
      Resolver.findNodeModule(name, {
        basedir: dirname,
        extensions,
        moduleDirectory,
        paths,
        resolver: this._options.resolver,
        rootDir: this._options.rootDir,
        throwIfNotFound
      });

    if (!skipResolution) {
      module = resolveNodeModule(moduleName, Boolean(process.versions.pnp));

      if (module) {
        this._moduleNameCache.set(key, module);

        return module;
      }
    } // 4. Resolve "haste packages" which are `package.json` files outside of
    // `node_modules` folders anywhere in the file system.

    const parts = moduleName.split('/');
    const hastePackage = this.getPackage(parts.shift());

    if (hastePackage) {
      try {
        const module = path().join.apply(
          path(),
          [path().dirname(hastePackage)].concat(parts)
        ); // try resolving with custom resolver first to support extensions,
        // then fallback to require.resolve

        const resolvedModule =
          resolveNodeModule(module) || require.resolve(module);

        this._moduleNameCache.set(key, resolvedModule);

        return resolvedModule;
      } catch {}
    }

    return null;
  }

  resolveModule(from, moduleName, options) {
    const dirname = path().dirname(from);
    const module =
      this.resolveStubModuleName(from, moduleName) ||
      this.resolveModuleFromDirIfExists(dirname, moduleName, options);
    if (module) return module; // 5. Throw an error if the module could not be found. `resolve.sync` only
    // produces an error based on the dirname but we have the actual current
    // module name available.

    const relativePath =
      (0, _slash().default)(path().relative(this._options.rootDir, from)) ||
      '.';
    throw new _ModuleNotFoundError.default(
      `Cannot find module '${moduleName}' from '${relativePath}'`,
      moduleName
    );
  }

  _isAliasModule(moduleName) {
    const moduleNameMapper = this._options.moduleNameMapper;

    if (!moduleNameMapper) {
      return false;
    }

    return moduleNameMapper.some(({regex}) => regex.test(moduleName));
  }

  isCoreModule(moduleName) {
    return (
      this._options.hasCoreModules &&
      (0, _isBuiltinModule.default)(moduleName) &&
      !this._isAliasModule(moduleName)
    );
  }

  getModule(name) {
    return this._moduleMap.getModule(
      name,
      this._options.defaultPlatform,
      this._supportsNativePlatform
    );
  }

  getModulePath(from, moduleName) {
    if (moduleName[0] !== '.' || path().isAbsolute(moduleName)) {
      return moduleName;
    }

    return path().normalize(path().dirname(from) + '/' + moduleName);
  }

  getPackage(name) {
    return this._moduleMap.getPackage(
      name,
      this._options.defaultPlatform,
      this._supportsNativePlatform
    );
  }

  getMockModule(from, name) {
    const mock = this._moduleMap.getMockModule(name);

    if (mock) {
      return mock;
    } else {
      const moduleName = this.resolveStubModuleName(from, name);

      if (moduleName) {
        return this.getModule(moduleName) || moduleName;
      }
    }

    return null;
  }

  getModulePaths(from) {
    const cachedModule = this._modulePathCache.get(from);

    if (cachedModule) {
      return cachedModule;
    }

    const moduleDirectory = this._options.moduleDirectories;
    const paths = (0, _nodeModulesPaths.default)(from, {
      moduleDirectory
    });

    if (paths[paths.length - 1] === undefined) {
      // circumvent node-resolve bug that adds `undefined` as last item.
      paths.pop();
    }

    this._modulePathCache.set(from, paths);

    return paths;
  }

  getModuleID(virtualMocks, from, _moduleName) {
    const moduleName = _moduleName || '';
    const key = from + path().delimiter + moduleName;

    const cachedModuleID = this._moduleIDCache.get(key);

    if (cachedModuleID) {
      return cachedModuleID;
    }

    const moduleType = this._getModuleType(moduleName);

    const absolutePath = this._getAbsolutePath(virtualMocks, from, moduleName);

    const mockPath = this._getMockPath(from, moduleName);

    const sep = path().delimiter;
    const id =
      moduleType +
      sep +
      (absolutePath ? absolutePath + sep : '') +
      (mockPath ? mockPath + sep : '');

    this._moduleIDCache.set(key, id);

    return id;
  }

  _getModuleType(moduleName) {
    return this.isCoreModule(moduleName) ? 'node' : 'user';
  }

  _getAbsolutePath(virtualMocks, from, moduleName) {
    if (this.isCoreModule(moduleName)) {
      return moduleName;
    }

    return this._isModuleResolved(from, moduleName)
      ? this.getModule(moduleName)
      : this._getVirtualMockPath(virtualMocks, from, moduleName);
  }

  _getMockPath(from, moduleName) {
    return !this.isCoreModule(moduleName)
      ? this.getMockModule(from, moduleName)
      : null;
  }

  _getVirtualMockPath(virtualMocks, from, moduleName) {
    const virtualMockPath = this.getModulePath(from, moduleName);
    return virtualMocks[virtualMockPath]
      ? virtualMockPath
      : moduleName
      ? this.resolveModule(from, moduleName)
      : from;
  }

  _isModuleResolved(from, moduleName) {
    return !!(
      this.getModule(moduleName) || this.getMockModule(from, moduleName)
    );
  }

  resolveStubModuleName(from, moduleName) {
    const dirname = path().dirname(from);
    const paths = this._options.modulePaths;

    const extensions = this._options.extensions.slice();

    const moduleDirectory = this._options.moduleDirectories;
    const moduleNameMapper = this._options.moduleNameMapper;
    const resolver = this._options.resolver;
    const defaultPlatform = this._options.defaultPlatform;

    if (this._supportsNativePlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => '.' + NATIVE_PLATFORM + ext)
      );
    }

    if (defaultPlatform) {
      extensions.unshift(
        ...this._options.extensions.map(ext => '.' + defaultPlatform + ext)
      );
    }

    if (moduleNameMapper) {
      for (const {moduleName: mappedModuleName, regex} of moduleNameMapper) {
        if (regex.test(moduleName)) {
          // Note: once a moduleNameMapper matches the name, it must result
          // in a module, or else an error is thrown.
          const matches = moduleName.match(regex);
          const mapModuleName = matches
            ? moduleName =>
                moduleName.replace(
                  /\$([0-9]+)/g,
                  (_, index) => matches[parseInt(index, 10)]
                )
            : moduleName => moduleName;
          const possibleModuleNames = Array.isArray(mappedModuleName)
            ? mappedModuleName
            : [mappedModuleName];
          let module = null;

          for (const possibleModuleName of possibleModuleNames) {
            const updatedName = mapModuleName(possibleModuleName);
            module =
              this.getModule(updatedName) ||
              Resolver.findNodeModule(updatedName, {
                basedir: dirname,
                extensions,
                moduleDirectory,
                paths,
                resolver,
                rootDir: this._options.rootDir
              });

            if (module) {
              break;
            }
          }

          if (!module) {
            throw createNoMappedModuleFoundError(
              moduleName,
              mapModuleName,
              mappedModuleName,
              regex,
              resolver
            );
          }

          return module;
        }
      }
    }

    return null;
  }
}

_defineProperty(Resolver, 'ModuleNotFoundError', _ModuleNotFoundError.default);

_defineProperty(Resolver, 'unstable_shouldLoadAsEsm', _shouldLoadAsEsm.default);

const createNoMappedModuleFoundError = (
  moduleName,
  mapModuleName,
  mappedModuleName,
  regex,
  resolver
) => {
  const mappedAs = Array.isArray(mappedModuleName)
    ? JSON.stringify(mappedModuleName.map(mapModuleName), null, 2)
    : mappedModuleName;
  const original = Array.isArray(mappedModuleName)
    ? JSON.stringify(mappedModuleName, null, 6) // using 6 because of misalignment when nested below
        .slice(0, -1) + '    ]' /// align last bracket correctly as well
    : mappedModuleName;
  const error = new Error(
    _chalk().default.red(`${_chalk().default.bold('Configuration error')}:

Could not locate module ${_chalk().default.bold(moduleName)} mapped as:
${_chalk().default.bold(mappedAs)}.

Please check your configuration for these entries:
{
  "moduleNameMapper": {
    "${regex.toString()}": "${_chalk().default.bold(original)}"
  },
  "resolver": ${_chalk().default.bold(String(resolver))}
}`)
  );
  error.name = '';
  return error;
};

module.exports = Resolver;
});

var utils$3 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getSequencer = exports.isJSONString = exports.getRunner = exports.getWatchPlugin = exports.getTestEnvironment = exports.resolveWithPrefix = exports._replaceRootDirTags = exports.replaceRootDirInPath = exports.escapeGlobCharacters = exports.resolve = exports.DOCUMENTATION_NOTE = exports.BULLET = void 0;

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function _jestValidate() {
  const data = build$3;

  _jestValidate = function () {
    return data;
  };

  return data;
}

function _jestResolve() {
  const data = _interopRequireDefault(build$4);

  _jestResolve = function () {
    return data;
  };

  return data;
}

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const BULLET = _chalk().default.bold('\u25cf ');

exports.BULLET = BULLET;
const DOCUMENTATION_NOTE = `  ${_chalk().default.bold(
  'Configuration Documentation:'
)}
  https://jestjs.io/docs/configuration.html
`;
exports.DOCUMENTATION_NOTE = DOCUMENTATION_NOTE;

const createValidationError = message =>
  new (_jestValidate().ValidationError)(
    `${BULLET}Validation Error`,
    message,
    DOCUMENTATION_NOTE
  );

const resolve = (resolver, {key, filePath, rootDir, optional}) => {
  const module = _jestResolve().default.findNodeModule(
    replaceRootDirInPath(rootDir, filePath),
    {
      basedir: rootDir,
      resolver: resolver || undefined
    }
  );

  if (!module && !optional) {
    throw createValidationError(`  Module ${_chalk().default.bold(
      filePath
    )} in the ${_chalk().default.bold(key)} option was not found.
         ${_chalk().default.bold('<rootDir>')} is: ${rootDir}`);
  } /// can cast as string since nulls will be thrown

  return module;
};

exports.resolve = resolve;

const escapeGlobCharacters = path => path.replace(/([()*{}\[\]!?\\])/g, '\\$1');

exports.escapeGlobCharacters = escapeGlobCharacters;

const replaceRootDirInPath = (rootDir, filePath) => {
  if (!/^<rootDir>/.test(filePath)) {
    return filePath;
  }

  return path().resolve(
    rootDir,
    path().normalize('./' + filePath.substr('<rootDir>'.length))
  );
};

exports.replaceRootDirInPath = replaceRootDirInPath;

const _replaceRootDirInObject = (rootDir, config) => {
  const newConfig = {};

  for (const configKey in config) {
    newConfig[configKey] =
      configKey === 'rootDir'
        ? config[configKey]
        : _replaceRootDirTags(rootDir, config[configKey]);
  }

  return newConfig;
};

const _replaceRootDirTags = (rootDir, config) => {
  if (config == null) {
    return config;
  }

  switch (typeof config) {
    case 'object':
      if (Array.isArray(config)) {
        /// can be string[] or {}[]
        return config.map(item => _replaceRootDirTags(rootDir, item));
      }

      if (config instanceof RegExp) {
        return config;
      }

      return _replaceRootDirInObject(rootDir, config);

    case 'string':
      return replaceRootDirInPath(rootDir, config);
  }

  return config;
};

exports._replaceRootDirTags = _replaceRootDirTags;

const resolveWithPrefix = (
  resolver,
  {filePath, humanOptionName, optionName, prefix, rootDir}
) => {
  const fileName = replaceRootDirInPath(rootDir, filePath);

  let module = _jestResolve().default.findNodeModule(`${prefix}${fileName}`, {
    basedir: rootDir,
    resolver: resolver || undefined
  });

  if (module) {
    return module;
  }

  try {
    return require.resolve(`${prefix}${fileName}`);
  } catch (e) {}

  module = _jestResolve().default.findNodeModule(fileName, {
    basedir: rootDir,
    resolver: resolver || undefined
  });

  if (module) {
    return module;
  }

  try {
    return require.resolve(fileName);
  } catch (e) {}

  throw createValidationError(
    `  ${humanOptionName} ${_chalk().default.bold(
      fileName
    )} cannot be found. Make sure the ${_chalk().default.bold(
      optionName
    )} configuration option points to an existing node module.`
  );
};
/**
 * Finds the test environment to use:
 *
 * 1. looks for jest-environment-<name> relative to project.
 * 1. looks for jest-environment-<name> relative to Jest.
 * 1. looks for <name> relative to project.
 * 1. looks for <name> relative to Jest.
 */

exports.resolveWithPrefix = resolveWithPrefix;

const getTestEnvironment = ({rootDir, testEnvironment: filePath}) =>
  resolveWithPrefix(undefined, {
    filePath,
    humanOptionName: 'Test environment',
    optionName: 'testEnvironment',
    prefix: 'jest-environment-',
    rootDir
  });
/**
 * Finds the watch plugins to use:
 *
 * 1. looks for jest-watch-<name> relative to project.
 * 1. looks for jest-watch-<name> relative to Jest.
 * 1. looks for <name> relative to project.
 * 1. looks for <name> relative to Jest.
 */

exports.getTestEnvironment = getTestEnvironment;

const getWatchPlugin = (resolver, {filePath, rootDir}) =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Watch plugin',
    optionName: 'watchPlugins',
    prefix: 'jest-watch-',
    rootDir
  });
/**
 * Finds the runner to use:
 *
 * 1. looks for jest-runner-<name> relative to project.
 * 1. looks for jest-runner-<name> relative to Jest.
 * 1. looks for <name> relative to project.
 * 1. looks for <name> relative to Jest.
 */

exports.getWatchPlugin = getWatchPlugin;

const getRunner = (resolver, {filePath, rootDir}) =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Jest Runner',
    optionName: 'runner',
    prefix: 'jest-runner-',
    rootDir
  });

exports.getRunner = getRunner;

// newtype
const isJSONString = text =>
  text != null &&
  typeof text === 'string' &&
  text.startsWith('{') &&
  text.endsWith('}');

exports.isJSONString = isJSONString;

const getSequencer = (resolver, {filePath, rootDir}) =>
  resolveWithPrefix(resolver, {
    filePath,
    humanOptionName: 'Jest Sequencer',
    optionName: 'testSequencer',
    prefix: 'jest-sequencer-',
    rootDir
  });

exports.getSequencer = getSequencer;
});

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


var isWindows = process.platform === 'win32';


// JavaScript implementation of realpath, ported from node pre-v6

var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);

function rethrow() {
  // Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
  // is fairly slow to generate.
  var callback;
  if (DEBUG) {
    var backtrace = new Error;
    callback = debugCallback;
  } else
    callback = missingCallback;

  return callback;

  function debugCallback(err) {
    if (err) {
      backtrace.message = err.message;
      err = backtrace;
      missingCallback(err);
    }
  }

  function missingCallback(err) {
    if (err) {
      if (process.throwDeprecation)
        throw err;  // Forgot a callback but don't know where? Use NODE_DEBUG=fs
      else if (!process.noDeprecation) {
        var msg = 'fs: missing callback ' + (err.stack || err.message);
        if (process.traceDeprecation)
          console.trace(msg);
        else
          console.error(msg);
      }
    }
  }
}

function maybeCallback(cb) {
  return typeof cb === 'function' ? cb : rethrow();
}

var normalize$1 = path$3.normalize;

// Regexp that finds the next partion of a (partial) path
// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
if (isWindows) {
  var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
} else {
  var nextPartRe = /(.*?)(?:[\/]+|$)/g;
}

// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
if (isWindows) {
  var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
} else {
  var splitRootRe = /^[\/]*/;
}

var realpathSync = function realpathSync(p, cache) {
  // make p is absolute
  p = path$3.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return cache[p];
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs$1.lstatSync(base);
      knownHard[base] = true;
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  // NB: p.length changes.
  while (pos < p.length) {
    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      continue;
    }

    var resolvedLink;
    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // some known symbolic link.  no need to stat again.
      resolvedLink = cache[base];
    } else {
      var stat = fs$1.lstatSync(base);
      if (!stat.isSymbolicLink()) {
        knownHard[base] = true;
        if (cache) cache[base] = base;
        continue;
      }

      // read the link if it wasn't read before
      // dev/ino always return 0 on windows, so skip the check.
      var linkTarget = null;
      if (!isWindows) {
        var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
        if (seenLinks.hasOwnProperty(id)) {
          linkTarget = seenLinks[id];
        }
      }
      if (linkTarget === null) {
        fs$1.statSync(base);
        linkTarget = fs$1.readlinkSync(base);
      }
      resolvedLink = path$3.resolve(previous, linkTarget);
      // track this, if given a cache.
      if (cache) cache[base] = resolvedLink;
      if (!isWindows) seenLinks[id] = linkTarget;
    }

    // resolve the link, then start over
    p = path$3.resolve(resolvedLink, p.slice(pos));
    start();
  }

  if (cache) cache[original] = p;

  return p;
};


var realpath = function realpath(p, cache, cb) {
  if (typeof cb !== 'function') {
    cb = maybeCallback(cache);
    cache = null;
  }

  // make p is absolute
  p = path$3.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return process.nextTick(cb.bind(null, null, cache[p]));
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs$1.lstat(base, function(err) {
        if (err) return cb(err);
        knownHard[base] = true;
        LOOP();
      });
    } else {
      process.nextTick(LOOP);
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  function LOOP() {
    // stop if scanned past end of path
    if (pos >= p.length) {
      if (cache) cache[original] = p;
      return cb(null, p);
    }

    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      return process.nextTick(LOOP);
    }

    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // known symbolic link.  no need to stat again.
      return gotResolvedLink(cache[base]);
    }

    return fs$1.lstat(base, gotStat);
  }

  function gotStat(err, stat) {
    if (err) return cb(err);

    // if not a symlink, skip to the next path part
    if (!stat.isSymbolicLink()) {
      knownHard[base] = true;
      if (cache) cache[base] = base;
      return process.nextTick(LOOP);
    }

    // stat & read the link if not read before
    // call gotTarget as soon as the link target is known
    // dev/ino always return 0 on windows, so skip the check.
    if (!isWindows) {
      var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
      if (seenLinks.hasOwnProperty(id)) {
        return gotTarget(null, seenLinks[id], base);
      }
    }
    fs$1.stat(base, function(err) {
      if (err) return cb(err);

      fs$1.readlink(base, function(err, target) {
        if (!isWindows) seenLinks[id] = target;
        gotTarget(err, target);
      });
    });
  }

  function gotTarget(err, target, base) {
    if (err) return cb(err);

    var resolvedLink = path$3.resolve(previous, target);
    if (cache) cache[base] = resolvedLink;
    gotResolvedLink(resolvedLink);
  }

  function gotResolvedLink(resolvedLink) {
    // resolve the link, then start over
    p = path$3.resolve(resolvedLink, p.slice(pos));
    start();
  }
};

var old = {
	realpathSync: realpathSync,
	realpath: realpath
};

var fs_realpath = realpath$1;
realpath$1.realpath = realpath$1;
realpath$1.sync = realpathSync$1;
realpath$1.realpathSync = realpathSync$1;
realpath$1.monkeypatch = monkeypatch;
realpath$1.unmonkeypatch = unmonkeypatch;


var origRealpath = fs$1.realpath;
var origRealpathSync = fs$1.realpathSync;

var version = process.version;
var ok = /^v[0-5]\./.test(version);


function newError (er) {
  return er && er.syscall === 'realpath' && (
    er.code === 'ELOOP' ||
    er.code === 'ENOMEM' ||
    er.code === 'ENAMETOOLONG'
  )
}

function realpath$1 (p, cache, cb) {
  if (ok) {
    return origRealpath(p, cache, cb)
  }

  if (typeof cache === 'function') {
    cb = cache;
    cache = null;
  }
  origRealpath(p, cache, function (er, result) {
    if (newError(er)) {
      old.realpath(p, cache, cb);
    } else {
      cb(er, result);
    }
  });
}

function realpathSync$1 (p, cache) {
  if (ok) {
    return origRealpathSync(p, cache)
  }

  try {
    return origRealpathSync(p, cache)
  } catch (er) {
    if (newError(er)) {
      return old.realpathSync(p, cache)
    } else {
      throw er
    }
  }
}

function monkeypatch () {
  fs$1.realpath = realpath$1;
  fs$1.realpathSync = realpathSync$1;
}

function unmonkeypatch () {
  fs$1.realpath = origRealpath;
  fs$1.realpathSync = origRealpathSync;
}

var concatMap = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray$1(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray$1 = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var balancedMatch = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}

var braceExpansion = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balancedMatch('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand$1(escapeBraces(str), true).map(unescapeBraces);
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand$1(str, isTop) {
  var expansions = [];

  var m = balancedMatch('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand$1(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand$1(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand$1(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand$1(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length);
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand$1(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}

var minimatch_1 = minimatch;
minimatch.Minimatch = Minimatch;

var path$2 = { sep: '/' };
try {
  path$2 = path$3;
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {};


var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
};

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]';

// * => any number of characters
var star = qmark + '*?';

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?';

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?';

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!');

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true;
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/;

minimatch.filter = filter;
function filter (pattern, options) {
  options = options || {};
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {};
  b = b || {};
  var t = {};
  Object.keys(b).forEach(function (k) {
    t[k] = b[k];
  });
  Object.keys(a).forEach(function (k) {
    t[k] = a[k];
  });
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch;

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  };

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  };

  return m
};

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
};

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {};

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {};
  pattern = pattern.trim();

  // windows support: need to use /, not \
  if (path$2.sep !== '/') {
    pattern = pattern.split(path$2.sep).join('/');
  }

  this.options = options;
  this.set = [];
  this.pattern = pattern;
  this.regexp = null;
  this.negate = false;
  this.comment = false;
  this.empty = false;

  // make the set of regexps etc.
  this.make();
}

Minimatch.prototype.debug = function () {};

Minimatch.prototype.make = make;
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern;
  var options = this.options;

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true;
    return
  }
  if (!pattern) {
    this.empty = true;
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate();

  // step 2: expand braces
  var set = this.globSet = this.braceExpand();

  if (options.debug) this.debug = console.error;

  this.debug(this.pattern, set);

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  });

  this.debug(this.pattern, set);

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this);

  this.debug(this.pattern, set);

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  });

  this.debug(this.pattern, set);

  this.set = set;
}

Minimatch.prototype.parseNegate = parseNegate;
function parseNegate () {
  var pattern = this.pattern;
  var negate = false;
  var options = this.options;
  var negateOffset = 0;

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate;
    negateOffset++;
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset);
  this.negate = negate;
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
};

Minimatch.prototype.braceExpand = braceExpand;

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options;
    } else {
      options = {};
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern;

  if (typeof pattern === 'undefined') {
    throw new TypeError('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return braceExpansion(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse$4;
var SUBPARSE = {};
function parse$4 (pattern, isSub) {
  if (pattern.length > 1024 * 64) {
    throw new TypeError('pattern is too long')
  }

  var options = this.options;

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = '';
  var hasMagic = !!options.nocase;
  var escaping = false;
  // ? => one single character
  var patternListStack = [];
  var negativeLists = [];
  var stateChar;
  var inClass = false;
  var reClassStart = -1;
  var classStart = -1;
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)';
  var self = this;

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star;
          hasMagic = true;
        break
        case '?':
          re += qmark;
          hasMagic = true;
        break
        default:
          re += '\\' + stateChar;
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re);
      stateChar = false;
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c);

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c;
      escaping = false;
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar();
        escaping = true;
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c);

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class');
          if (c === '!' && i === classStart + 1) c = '^';
          re += c;
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar);
        clearStateChar();
        stateChar = c;
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar();
      continue

      case '(':
        if (inClass) {
          re += '(';
          continue
        }

        if (!stateChar) {
          re += '\\(';
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        });
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:';
        this.debug('plType %j %j', stateChar, re);
        stateChar = false;
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)';
          continue
        }

        clearStateChar();
        hasMagic = true;
        var pl = patternListStack.pop();
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close;
        if (pl.type === '!') {
          negativeLists.push(pl);
        }
        pl.reEnd = re.length;
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|';
          escaping = false;
          continue
        }

        clearStateChar();
        re += '|';
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar();

        if (inClass) {
          re += '\\' + c;
          continue
        }

        inClass = true;
        classStart = i;
        reClassStart = re.length;
        re += c;
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c;
          escaping = false;
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i);
          try {
            RegExp('[' + cs + ']');
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE);
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]';
            hasMagic = hasMagic || sp[1];
            inClass = false;
            continue
          }
        }

        // finish up the class.
        hasMagic = true;
        inClass = false;
        re += c;
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar();

        if (escaping) {
          // no need
          escaping = false;
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\';
        }

        re += c;

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1);
    sp = this.parse(cs, SUBPARSE);
    re = re.substr(0, reClassStart) + '\\[' + sp[0];
    hasMagic = hasMagic || sp[1];
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length);
    this.debug('setting tail', re, pl);
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\';
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    });

    this.debug('tail=%j\n   %s', tail, tail, pl, re);
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type;

    hasMagic = true;
    re = re.slice(0, pl.reStart) + t + '\\(' + tail;
  }

  // handle trailing things that only matter at the very end.
  clearStateChar();
  if (escaping) {
    // trailing \\
    re += '\\\\';
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false;
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true;
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n];

    var nlBefore = re.slice(0, nl.reStart);
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd);
    var nlAfter = re.slice(nl.reEnd);

    nlLast += nlAfter;

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1;
    var cleanAfter = nlAfter;
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '');
    }
    nlAfter = cleanAfter;

    var dollar = '';
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$';
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast;
    re = newRe;
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re;
  }

  if (addPatternStart) {
    re = patternStart + re;
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : '';
  try {
    var regExp = new RegExp('^' + re + '$', flags);
  } catch (er) {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern;
  regExp._src = re;

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
};

Minimatch.prototype.makeRe = makeRe;
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set;

  if (!set.length) {
    this.regexp = false;
    return this.regexp
  }
  var options = this.options;

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot;
  var flags = options.nocase ? 'i' : '';

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|');

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$';

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$';

  try {
    this.regexp = new RegExp(re, flags);
  } catch (ex) {
    this.regexp = false;
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {};
  var mm = new Minimatch(pattern, options);
  list = list.filter(function (f) {
    return mm.match(f)
  });
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list
};

Minimatch.prototype.match = match;
function match (f, partial) {
  this.debug('match', f, this.pattern);
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options;

  // windows: need to use /, not \
  if (path$2.sep !== '/') {
    f = f.split(path$2.sep).join('/');
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit);
  this.debug(this.pattern, 'split', f);

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set;
  this.debug(this.pattern, 'set', set);

  // Find the basename of the path by looking for the last non-empty segment
  var filename;
  var i;
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i];
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i];
    var file = f;
    if (options.matchBase && pattern.length === 1) {
      file = [filename];
    }
    var hit = this.matchOne(file, pattern, partial);
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options;

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern });

  this.debug('matchOne', file.length, pattern.length);

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop');
    var p = pattern[pi];
    var f = file[fi];

    this.debug(pattern, p, f);

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f]);

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi;
      var pr = pi + 1;
      if (pr === pl) {
        this.debug('** at the end');
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr];

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee);
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr);
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue');
          fr++;
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit;
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase();
      } else {
        hit = f === p;
      }
      this.debug('string match', p, f, hit);
    } else {
      hit = f.match(p);
      this.debug('pattern match', p, f, hit);
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '');
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
};

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

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
  var util = util$2;
  /* istanbul ignore next */
  if (typeof util.inherits !== 'function') throw '';
  module.exports = util.inherits;
} catch (e) {
  /* istanbul ignore next */
  module.exports = inherits_browser;
}
});

function posix(path) {
	return path.charAt(0) === '/';
}

function win32(path) {
	// https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
	var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
	var result = splitDeviceRe.exec(path);
	var device = result[1] || '';
	var isUnc = Boolean(device && device.charAt(1) !== ':');

	// UNC paths are always absolute
	return Boolean(result[2] || isUnc);
}

var pathIsAbsolute = process.platform === 'win32' ? win32 : posix;
var posix_1 = posix;
var win32_1 = win32;
pathIsAbsolute.posix = posix_1;
pathIsAbsolute.win32 = win32_1;

var alphasort_1 = alphasort;
var alphasorti_1 = alphasorti;
var setopts_1 = setopts;
var ownProp_1 = ownProp;
var makeAbs_1 = makeAbs;
var finish_1 = finish;
var mark_1 = mark;
var isIgnored_1 = isIgnored;
var childrenIgnored_1 = childrenIgnored;

function ownProp (obj, field) {
  return Object.prototype.hasOwnProperty.call(obj, field)
}




var Minimatch$1 = minimatch_1.Minimatch;

function alphasorti (a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase())
}

function alphasort (a, b) {
  return a.localeCompare(b)
}

function setupIgnores (self, options) {
  self.ignore = options.ignore || [];

  if (!Array.isArray(self.ignore))
    self.ignore = [self.ignore];

  if (self.ignore.length) {
    self.ignore = self.ignore.map(ignoreMap);
  }
}

// ignore patterns are always in dot:true mode.
function ignoreMap (pattern) {
  var gmatcher = null;
  if (pattern.slice(-3) === '/**') {
    var gpattern = pattern.replace(/(\/\*\*)+$/, '');
    gmatcher = new Minimatch$1(gpattern, { dot: true });
  }

  return {
    matcher: new Minimatch$1(pattern, { dot: true }),
    gmatcher: gmatcher
  }
}

function setopts (self, pattern, options) {
  if (!options)
    options = {};

  // base-matching: just use globstar for that.
  if (options.matchBase && -1 === pattern.indexOf("/")) {
    if (options.noglobstar) {
      throw new Error("base matching requires globstar")
    }
    pattern = "**/" + pattern;
  }

  self.silent = !!options.silent;
  self.pattern = pattern;
  self.strict = options.strict !== false;
  self.realpath = !!options.realpath;
  self.realpathCache = options.realpathCache || Object.create(null);
  self.follow = !!options.follow;
  self.dot = !!options.dot;
  self.mark = !!options.mark;
  self.nodir = !!options.nodir;
  if (self.nodir)
    self.mark = true;
  self.sync = !!options.sync;
  self.nounique = !!options.nounique;
  self.nonull = !!options.nonull;
  self.nosort = !!options.nosort;
  self.nocase = !!options.nocase;
  self.stat = !!options.stat;
  self.noprocess = !!options.noprocess;
  self.absolute = !!options.absolute;

  self.maxLength = options.maxLength || Infinity;
  self.cache = options.cache || Object.create(null);
  self.statCache = options.statCache || Object.create(null);
  self.symlinks = options.symlinks || Object.create(null);

  setupIgnores(self, options);

  self.changedCwd = false;
  var cwd = process.cwd();
  if (!ownProp(options, "cwd"))
    self.cwd = cwd;
  else {
    self.cwd = path$3.resolve(options.cwd);
    self.changedCwd = self.cwd !== cwd;
  }

  self.root = options.root || path$3.resolve(self.cwd, "/");
  self.root = path$3.resolve(self.root);
  if (process.platform === "win32")
    self.root = self.root.replace(/\\/g, "/");

  // TODO: is an absolute `cwd` supposed to be resolved against `root`?
  // e.g. { cwd: '/test', root: __dirname } === path.join(__dirname, '/test')
  self.cwdAbs = pathIsAbsolute(self.cwd) ? self.cwd : makeAbs(self, self.cwd);
  if (process.platform === "win32")
    self.cwdAbs = self.cwdAbs.replace(/\\/g, "/");
  self.nomount = !!options.nomount;

  // disable comments and negation in Minimatch.
  // Note that they are not supported in Glob itself anyway.
  options.nonegate = true;
  options.nocomment = true;

  self.minimatch = new Minimatch$1(pattern, options);
  self.options = self.minimatch.options;
}

function finish (self) {
  var nou = self.nounique;
  var all = nou ? [] : Object.create(null);

  for (var i = 0, l = self.matches.length; i < l; i ++) {
    var matches = self.matches[i];
    if (!matches || Object.keys(matches).length === 0) {
      if (self.nonull) {
        // do like the shell, and spit out the literal glob
        var literal = self.minimatch.globSet[i];
        if (nou)
          all.push(literal);
        else
          all[literal] = true;
      }
    } else {
      // had matches
      var m = Object.keys(matches);
      if (nou)
        all.push.apply(all, m);
      else
        m.forEach(function (m) {
          all[m] = true;
        });
    }
  }

  if (!nou)
    all = Object.keys(all);

  if (!self.nosort)
    all = all.sort(self.nocase ? alphasorti : alphasort);

  // at *some* point we statted all of these
  if (self.mark) {
    for (var i = 0; i < all.length; i++) {
      all[i] = self._mark(all[i]);
    }
    if (self.nodir) {
      all = all.filter(function (e) {
        var notDir = !(/\/$/.test(e));
        var c = self.cache[e] || self.cache[makeAbs(self, e)];
        if (notDir && c)
          notDir = c !== 'DIR' && !Array.isArray(c);
        return notDir
      });
    }
  }

  if (self.ignore.length)
    all = all.filter(function(m) {
      return !isIgnored(self, m)
    });

  self.found = all;
}

function mark (self, p) {
  var abs = makeAbs(self, p);
  var c = self.cache[abs];
  var m = p;
  if (c) {
    var isDir = c === 'DIR' || Array.isArray(c);
    var slash = p.slice(-1) === '/';

    if (isDir && !slash)
      m += '/';
    else if (!isDir && slash)
      m = m.slice(0, -1);

    if (m !== p) {
      var mabs = makeAbs(self, m);
      self.statCache[mabs] = self.statCache[abs];
      self.cache[mabs] = self.cache[abs];
    }
  }

  return m
}

// lotta situps...
function makeAbs (self, f) {
  var abs = f;
  if (f.charAt(0) === '/') {
    abs = path$3.join(self.root, f);
  } else if (pathIsAbsolute(f) || f === '') {
    abs = f;
  } else if (self.changedCwd) {
    abs = path$3.resolve(self.cwd, f);
  } else {
    abs = path$3.resolve(f);
  }

  if (process.platform === 'win32')
    abs = abs.replace(/\\/g, '/');

  return abs
}


// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
function isIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
  })
}

function childrenIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return !!(item.gmatcher && item.gmatcher.match(path))
  })
}

var common = {
	alphasort: alphasort_1,
	alphasorti: alphasorti_1,
	setopts: setopts_1,
	ownProp: ownProp_1,
	makeAbs: makeAbs_1,
	finish: finish_1,
	mark: mark_1,
	isIgnored: isIgnored_1,
	childrenIgnored: childrenIgnored_1
};

var sync$5 = globSync;
globSync.GlobSync = GlobSync;
var setopts$1 = common.setopts;
var ownProp$1 = common.ownProp;
var childrenIgnored$1 = common.childrenIgnored;
var isIgnored$1 = common.isIgnored;

function globSync (pattern, options) {
  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  return new GlobSync(pattern, options).found
}

function GlobSync (pattern, options) {
  if (!pattern)
    throw new Error('must provide pattern')

  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  if (!(this instanceof GlobSync))
    return new GlobSync(pattern, options)

  setopts$1(this, pattern, options);

  if (this.noprocess)
    return this

  var n = this.minimatch.set.length;
  this.matches = new Array(n);
  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false);
  }
  this._finish();
}

GlobSync.prototype._finish = function () {
  assert$1(this instanceof GlobSync);
  if (this.realpath) {
    var self = this;
    this.matches.forEach(function (matchset, index) {
      var set = self.matches[index] = Object.create(null);
      for (var p in matchset) {
        try {
          p = self._makeAbs(p);
          var real = fs_realpath.realpathSync(p, self.realpathCache);
          set[real] = true;
        } catch (er) {
          if (er.syscall === 'stat')
            set[self._makeAbs(p)] = true;
          else
            throw er
        }
      }
    });
  }
  common.finish(this);
};


GlobSync.prototype._process = function (pattern, index, inGlobStar) {
  assert$1(this instanceof GlobSync);

  // Get the first [n] parts of pattern that are all strings.
  var n = 0;
  while (typeof pattern[n] === 'string') {
    n ++;
  }
  // now n is the index of the first one that is *not* a string.

  // See if there's anything else
  var prefix;
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index);
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null;
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/');
      break
  }

  var remain = pattern.slice(n);

  // get the list of entries.
  var read;
  if (prefix === null)
    read = '.';
  else if (pathIsAbsolute(prefix) || pathIsAbsolute(pattern.join('/'))) {
    if (!prefix || !pathIsAbsolute(prefix))
      prefix = '/' + prefix;
    read = prefix;
  } else
    read = prefix;

  var abs = this._makeAbs(read);

  //if ignored, skip processing
  if (childrenIgnored$1(this, read))
    return

  var isGlobStar = remain[0] === minimatch_1.GLOBSTAR;
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar);
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar);
};


GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
  var entries = this._readdir(abs, inGlobStar);

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0];
  var negate = !!this.minimatch.negate;
  var rawGlob = pn._glob;
  var dotOk = this.dot || rawGlob.charAt(0) === '.';

  var matchedEntries = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (e.charAt(0) !== '.' || dotOk) {
      var m;
      if (negate && !prefix) {
        m = !e.match(pn);
      } else {
        m = e.match(pn);
      }
      if (m)
        matchedEntries.push(e);
    }
  }

  var len = matchedEntries.length;
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null);

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i];
      if (prefix) {
        if (prefix.slice(-1) !== '/')
          e = prefix + '/' + e;
        else
          e = prefix + e;
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path$3.join(this.root, e);
      }
      this._emitMatch(index, e);
    }
    // This was the last one, and no stats were needed
    return
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift();
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i];
    var newPattern;
    if (prefix)
      newPattern = [prefix, e];
    else
      newPattern = [e];
    this._process(newPattern.concat(remain), index, inGlobStar);
  }
};


GlobSync.prototype._emitMatch = function (index, e) {
  if (isIgnored$1(this, e))
    return

  var abs = this._makeAbs(e);

  if (this.mark)
    e = this._mark(e);

  if (this.absolute) {
    e = abs;
  }

  if (this.matches[index][e])
    return

  if (this.nodir) {
    var c = this.cache[abs];
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  this.matches[index][e] = true;

  if (this.stat)
    this._stat(e);
};


GlobSync.prototype._readdirInGlobStar = function (abs) {
  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false)

  var entries;
  var lstat;
  try {
    lstat = fs$1.lstatSync(abs);
  } catch (er) {
    if (er.code === 'ENOENT') {
      // lstat failed, doesn't exist
      return null
    }
  }

  var isSym = lstat && lstat.isSymbolicLink();
  this.symlinks[abs] = isSym;

  // If it's not a symlink or a dir, then it's definitely a regular file.
  // don't bother doing a readdir in that case.
  if (!isSym && lstat && !lstat.isDirectory())
    this.cache[abs] = 'FILE';
  else
    entries = this._readdir(abs, false);

  return entries
};

GlobSync.prototype._readdir = function (abs, inGlobStar) {

  if (inGlobStar && !ownProp$1(this.symlinks, abs))
    return this._readdirInGlobStar(abs)

  if (ownProp$1(this.cache, abs)) {
    var c = this.cache[abs];
    if (!c || c === 'FILE')
      return null

    if (Array.isArray(c))
      return c
  }

  try {
    return this._readdirEntries(abs, fs$1.readdirSync(abs))
  } catch (er) {
    this._readdirError(abs, er);
    return null
  }
};

GlobSync.prototype._readdirEntries = function (abs, entries) {
  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i];
      if (abs === '/')
        e = abs + e;
      else
        e = abs + '/' + e;
      this.cache[e] = true;
    }
  }

  this.cache[abs] = entries;

  // mark and cache dir-ness
  return entries
};

GlobSync.prototype._readdirError = function (f, er) {
  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
    case 'ENOTDIR': // totally normal. means it *does* exist.
      var abs = this._makeAbs(f);
      this.cache[abs] = 'FILE';
      if (abs === this.cwdAbs) {
        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
        error.path = this.cwd;
        error.code = er.code;
        throw error
      }
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false;
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false;
      if (this.strict)
        throw er
      if (!this.silent)
        console.error('glob error', er);
      break
  }
};

GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {

  var entries = this._readdir(abs, inGlobStar);

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1);
  var gspref = prefix ? [ prefix ] : [];
  var noGlobStar = gspref.concat(remainWithoutGlobStar);

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false);

  var len = entries.length;
  var isSym = this.symlinks[abs];

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return

  for (var i = 0; i < len; i++) {
    var e = entries[i];
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
    this._process(instead, index, true);

    var below = gspref.concat(entries[i], remain);
    this._process(below, index, true);
  }
};

GlobSync.prototype._processSimple = function (prefix, index) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var exists = this._stat(prefix);

  if (!this.matches[index])
    this.matches[index] = Object.create(null);

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return

  if (prefix && pathIsAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix);
    if (prefix.charAt(0) === '/') {
      prefix = path$3.join(this.root, prefix);
    } else {
      prefix = path$3.resolve(this.root, prefix);
      if (trail)
        prefix += '/';
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/');

  // Mark this as a match
  this._emitMatch(index, prefix);
};

// Returns either 'DIR', 'FILE', or false
GlobSync.prototype._stat = function (f) {
  var abs = this._makeAbs(f);
  var needDir = f.slice(-1) === '/';

  if (f.length > this.maxLength)
    return false

  if (!this.stat && ownProp$1(this.cache, abs)) {
    var c = this.cache[abs];

    if (Array.isArray(c))
      c = 'DIR';

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return c

    if (needDir && c === 'FILE')
      return false

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }
  var stat = this.statCache[abs];
  if (!stat) {
    var lstat;
    try {
      lstat = fs$1.lstatSync(abs);
    } catch (er) {
      if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
        this.statCache[abs] = false;
        return false
      }
    }

    if (lstat && lstat.isSymbolicLink()) {
      try {
        stat = fs$1.statSync(abs);
      } catch (er) {
        stat = lstat;
      }
    } else {
      stat = lstat;
    }
  }

  this.statCache[abs] = stat;

  var c = true;
  if (stat)
    c = stat.isDirectory() ? 'DIR' : 'FILE';

  this.cache[abs] = this.cache[abs] || c;

  if (needDir && c === 'FILE')
    return false

  return c
};

GlobSync.prototype._mark = function (p) {
  return common.mark(this, p)
};

GlobSync.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
};

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
var wrappy_1 = wrappy;
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k];
  });

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    var ret = fn.apply(this, args);
    var cb = args[args.length-1];
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k];
      });
    }
    return ret
  }
}

var once_1 = wrappy_1(once);
var strict = wrappy_1(onceStrict);

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  });

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  });
});

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  f.called = false;
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true;
    return f.value = fn.apply(this, arguments)
  };
  var name = fn.name || 'Function wrapped with `once`';
  f.onceError = name + " shouldn't be called more than once";
  f.called = false;
  return f
}
once_1.strict = strict;

var reqs = Object.create(null);


var inflight_1 = wrappy_1(inflight);

function inflight (key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb);
    return null
  } else {
    reqs[key] = [cb];
    return makeres(key)
  }
}

function makeres (key) {
  return once_1(function RES () {
    var cbs = reqs[key];
    var len = cbs.length;
    var args = slice(arguments);

    // XXX It's somewhat ambiguous whether a new callback added in this
    // pass should be queued for later execution if something in the
    // list of callbacks throws, or if it should just be discarded.
    // However, it's such an edge case that it hardly matters, and either
    // choice is likely as surprising as the other.
    // As it happens, we do go ahead and schedule it for later execution.
    try {
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args);
      }
    } finally {
      if (cbs.length > len) {
        // added more in the interim.
        // de-zalgo, just in case, but don't call again.
        cbs.splice(0, len);
        process.nextTick(function () {
          RES.apply(null, args);
        });
      } else {
        delete reqs[key];
      }
    }
  })
}

function slice (args) {
  var length = args.length;
  var array = [];

  for (var i = 0; i < length; i++) array[i] = args[i];
  return array
}

// Approach:
//
// 1. Get the minimatch set
// 2. For each pattern in the set, PROCESS(pattern, false)
// 3. Store matches per-set, then uniq them
//
// PROCESS(pattern, inGlobStar)
// Get the first [n] items from pattern that are all strings
// Join these together.  This is PREFIX.
//   If there is no more remaining, then stat(PREFIX) and
//   add to matches if it succeeds.  END.
//
// If inGlobStar and PREFIX is symlink and points to dir
//   set ENTRIES = []
// else readdir(PREFIX) as ENTRIES
//   If fail, END
//
// with ENTRIES
//   If pattern[n] is GLOBSTAR
//     // handle the case where the globstar match is empty
//     // by pruning it out, and testing the resulting pattern
//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
//     // handle other cases.
//     for ENTRY in ENTRIES (not dotfiles)
//       // attach globstar + tail onto the entry
//       // Mark that this entry is a globstar match
//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
//
//   else // not globstar
//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
//       Test ENTRY against pattern[n]
//       If fails, continue
//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
//
// Caveat:
//   Cache all stats and readdirs results to minimize syscall.  Since all
//   we ever care about is existence and directory-ness, we can just keep
//   `true` for files, and [children,...] for directories, or `false` for
//   things that don't exist.

var glob_1 = glob;

var EE = events$1.EventEmitter;
var setopts$2 = common.setopts;
var ownProp$2 = common.ownProp;


var childrenIgnored$2 = common.childrenIgnored;
var isIgnored$2 = common.isIgnored;



function glob (pattern, options, cb) {
  if (typeof options === 'function') cb = options, options = {};
  if (!options) options = {};

  if (options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return sync$5(pattern, options)
  }

  return new Glob(pattern, options, cb)
}

glob.sync = sync$5;
var GlobSync$1 = glob.GlobSync = sync$5.GlobSync;

// old api surface
glob.glob = glob;

function extend$1 (origin, add) {
  if (add === null || typeof add !== 'object') {
    return origin
  }

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin
}

glob.hasMagic = function (pattern, options_) {
  var options = extend$1({}, options_);
  options.noprocess = true;

  var g = new Glob(pattern, options);
  var set = g.minimatch.set;

  if (!pattern)
    return false

  if (set.length > 1)
    return true

  for (var j = 0; j < set[0].length; j++) {
    if (typeof set[0][j] !== 'string')
      return true
  }

  return false
};

glob.Glob = Glob;
inherits(Glob, EE);
function Glob (pattern, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = null;
  }

  if (options && options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return new GlobSync$1(pattern, options)
  }

  if (!(this instanceof Glob))
    return new Glob(pattern, options, cb)

  setopts$2(this, pattern, options);
  this._didRealPath = false;

  // process each pattern in the minimatch set
  var n = this.minimatch.set.length;

  // The matches are stored as {<filename>: true,...} so that
  // duplicates are automagically pruned.
  // Later, we do an Object.keys() on these.
  // Keep them as a list so we can fill in when nonull is set.
  this.matches = new Array(n);

  if (typeof cb === 'function') {
    cb = once_1(cb);
    this.on('error', cb);
    this.on('end', function (matches) {
      cb(null, matches);
    });
  }

  var self = this;
  this._processing = 0;

  this._emitQueue = [];
  this._processQueue = [];
  this.paused = false;

  if (this.noprocess)
    return this

  if (n === 0)
    return done()

  var sync = true;
  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false, done);
  }
  sync = false;

  function done () {
    --self._processing;
    if (self._processing <= 0) {
      if (sync) {
        process.nextTick(function () {
          self._finish();
        });
      } else {
        self._finish();
      }
    }
  }
}

Glob.prototype._finish = function () {
  assert$1(this instanceof Glob);
  if (this.aborted)
    return

  if (this.realpath && !this._didRealpath)
    return this._realpath()

  common.finish(this);
  this.emit('end', this.found);
};

Glob.prototype._realpath = function () {
  if (this._didRealpath)
    return

  this._didRealpath = true;

  var n = this.matches.length;
  if (n === 0)
    return this._finish()

  var self = this;
  for (var i = 0; i < this.matches.length; i++)
    this._realpathSet(i, next);

  function next () {
    if (--n === 0)
      self._finish();
  }
};

Glob.prototype._realpathSet = function (index, cb) {
  var matchset = this.matches[index];
  if (!matchset)
    return cb()

  var found = Object.keys(matchset);
  var self = this;
  var n = found.length;

  if (n === 0)
    return cb()

  var set = this.matches[index] = Object.create(null);
  found.forEach(function (p, i) {
    // If there's a problem with the stat, then it means that
    // one or more of the links in the realpath couldn't be
    // resolved.  just return the abs value in that case.
    p = self._makeAbs(p);
    fs_realpath.realpath(p, self.realpathCache, function (er, real) {
      if (!er)
        set[real] = true;
      else if (er.syscall === 'stat')
        set[p] = true;
      else
        self.emit('error', er); // srsly wtf right here

      if (--n === 0) {
        self.matches[index] = set;
        cb();
      }
    });
  });
};

Glob.prototype._mark = function (p) {
  return common.mark(this, p)
};

Glob.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
};

Glob.prototype.abort = function () {
  this.aborted = true;
  this.emit('abort');
};

Glob.prototype.pause = function () {
  if (!this.paused) {
    this.paused = true;
    this.emit('pause');
  }
};

Glob.prototype.resume = function () {
  if (this.paused) {
    this.emit('resume');
    this.paused = false;
    if (this._emitQueue.length) {
      var eq = this._emitQueue.slice(0);
      this._emitQueue.length = 0;
      for (var i = 0; i < eq.length; i ++) {
        var e = eq[i];
        this._emitMatch(e[0], e[1]);
      }
    }
    if (this._processQueue.length) {
      var pq = this._processQueue.slice(0);
      this._processQueue.length = 0;
      for (var i = 0; i < pq.length; i ++) {
        var p = pq[i];
        this._processing--;
        this._process(p[0], p[1], p[2], p[3]);
      }
    }
  }
};

Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
  assert$1(this instanceof Glob);
  assert$1(typeof cb === 'function');

  if (this.aborted)
    return

  this._processing++;
  if (this.paused) {
    this._processQueue.push([pattern, index, inGlobStar, cb]);
    return
  }

  //console.error('PROCESS %d', this._processing, pattern)

  // Get the first [n] parts of pattern that are all strings.
  var n = 0;
  while (typeof pattern[n] === 'string') {
    n ++;
  }
  // now n is the index of the first one that is *not* a string.

  // see if there's anything else
  var prefix;
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index, cb);
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null;
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/');
      break
  }

  var remain = pattern.slice(n);

  // get the list of entries.
  var read;
  if (prefix === null)
    read = '.';
  else if (pathIsAbsolute(prefix) || pathIsAbsolute(pattern.join('/'))) {
    if (!prefix || !pathIsAbsolute(prefix))
      prefix = '/' + prefix;
    read = prefix;
  } else
    read = prefix;

  var abs = this._makeAbs(read);

  //if ignored, skip _processing
  if (childrenIgnored$2(this, read))
    return cb()

  var isGlobStar = remain[0] === minimatch_1.GLOBSTAR;
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb);
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb);
};

Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this;
  this._readdir(abs, inGlobStar, function (er, entries) {
    return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
  });
};

Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return cb()

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0];
  var negate = !!this.minimatch.negate;
  var rawGlob = pn._glob;
  var dotOk = this.dot || rawGlob.charAt(0) === '.';

  var matchedEntries = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    if (e.charAt(0) !== '.' || dotOk) {
      var m;
      if (negate && !prefix) {
        m = !e.match(pn);
      } else {
        m = e.match(pn);
      }
      if (m)
        matchedEntries.push(e);
    }
  }

  //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

  var len = matchedEntries.length;
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return cb()

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null);

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i];
      if (prefix) {
        if (prefix !== '/')
          e = prefix + '/' + e;
        else
          e = prefix + e;
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path$3.join(this.root, e);
      }
      this._emitMatch(index, e);
    }
    // This was the last one, and no stats were needed
    return cb()
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift();
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i];
    if (prefix) {
      if (prefix !== '/')
        e = prefix + '/' + e;
      else
        e = prefix + e;
    }
    this._process([e].concat(remain), index, inGlobStar, cb);
  }
  cb();
};

Glob.prototype._emitMatch = function (index, e) {
  if (this.aborted)
    return

  if (isIgnored$2(this, e))
    return

  if (this.paused) {
    this._emitQueue.push([index, e]);
    return
  }

  var abs = pathIsAbsolute(e) ? e : this._makeAbs(e);

  if (this.mark)
    e = this._mark(e);

  if (this.absolute)
    e = abs;

  if (this.matches[index][e])
    return

  if (this.nodir) {
    var c = this.cache[abs];
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  this.matches[index][e] = true;

  var st = this.statCache[abs];
  if (st)
    this.emit('stat', e, st);

  this.emit('match', e);
};

Glob.prototype._readdirInGlobStar = function (abs, cb) {
  if (this.aborted)
    return

  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false, cb)

  var lstatkey = 'lstat\0' + abs;
  var self = this;
  var lstatcb = inflight_1(lstatkey, lstatcb_);

  if (lstatcb)
    fs$1.lstat(abs, lstatcb);

  function lstatcb_ (er, lstat) {
    if (er && er.code === 'ENOENT')
      return cb()

    var isSym = lstat && lstat.isSymbolicLink();
    self.symlinks[abs] = isSym;

    // If it's not a symlink or a dir, then it's definitely a regular file.
    // don't bother doing a readdir in that case.
    if (!isSym && lstat && !lstat.isDirectory()) {
      self.cache[abs] = 'FILE';
      cb();
    } else
      self._readdir(abs, false, cb);
  }
};

Glob.prototype._readdir = function (abs, inGlobStar, cb) {
  if (this.aborted)
    return

  cb = inflight_1('readdir\0'+abs+'\0'+inGlobStar, cb);
  if (!cb)
    return

  //console.error('RD %j %j', +inGlobStar, abs)
  if (inGlobStar && !ownProp$2(this.symlinks, abs))
    return this._readdirInGlobStar(abs, cb)

  if (ownProp$2(this.cache, abs)) {
    var c = this.cache[abs];
    if (!c || c === 'FILE')
      return cb()

    if (Array.isArray(c))
      return cb(null, c)
  }
  fs$1.readdir(abs, readdirCb(this, abs, cb));
};

function readdirCb (self, abs, cb) {
  return function (er, entries) {
    if (er)
      self._readdirError(abs, er, cb);
    else
      self._readdirEntries(abs, entries, cb);
  }
}

Glob.prototype._readdirEntries = function (abs, entries, cb) {
  if (this.aborted)
    return

  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i];
      if (abs === '/')
        e = abs + e;
      else
        e = abs + '/' + e;
      this.cache[e] = true;
    }
  }

  this.cache[abs] = entries;
  return cb(null, entries)
};

Glob.prototype._readdirError = function (f, er, cb) {
  if (this.aborted)
    return

  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
    case 'ENOTDIR': // totally normal. means it *does* exist.
      var abs = this._makeAbs(f);
      this.cache[abs] = 'FILE';
      if (abs === this.cwdAbs) {
        var error = new Error(er.code + ' invalid cwd ' + this.cwd);
        error.path = this.cwd;
        error.code = er.code;
        this.emit('error', error);
        this.abort();
      }
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false;
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false;
      if (this.strict) {
        this.emit('error', er);
        // If the error is handled, then we abort
        // if not, we threw out of here
        this.abort();
      }
      if (!this.silent)
        console.error('glob error', er);
      break
  }

  return cb()
};

Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this;
  this._readdir(abs, inGlobStar, function (er, entries) {
    self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb);
  });
};


Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
  //console.error('pgs2', prefix, remain[0], entries)

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return cb()

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1);
  var gspref = prefix ? [ prefix ] : [];
  var noGlobStar = gspref.concat(remainWithoutGlobStar);

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false, cb);

  var isSym = this.symlinks[abs];
  var len = entries.length;

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return cb()

  for (var i = 0; i < len; i++) {
    var e = entries[i];
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar);
    this._process(instead, index, true, cb);

    var below = gspref.concat(entries[i], remain);
    this._process(below, index, true, cb);
  }

  cb();
};

Glob.prototype._processSimple = function (prefix, index, cb) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var self = this;
  this._stat(prefix, function (er, exists) {
    self._processSimple2(prefix, index, er, exists, cb);
  });
};
Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {

  //console.error('ps2', prefix, exists)

  if (!this.matches[index])
    this.matches[index] = Object.create(null);

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return cb()

  if (prefix && pathIsAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix);
    if (prefix.charAt(0) === '/') {
      prefix = path$3.join(this.root, prefix);
    } else {
      prefix = path$3.resolve(this.root, prefix);
      if (trail)
        prefix += '/';
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/');

  // Mark this as a match
  this._emitMatch(index, prefix);
  cb();
};

// Returns either 'DIR', 'FILE', or false
Glob.prototype._stat = function (f, cb) {
  var abs = this._makeAbs(f);
  var needDir = f.slice(-1) === '/';

  if (f.length > this.maxLength)
    return cb()

  if (!this.stat && ownProp$2(this.cache, abs)) {
    var c = this.cache[abs];

    if (Array.isArray(c))
      c = 'DIR';

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return cb(null, c)

    if (needDir && c === 'FILE')
      return cb()

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }
  var stat = this.statCache[abs];
  if (stat !== undefined) {
    if (stat === false)
      return cb(null, stat)
    else {
      var type = stat.isDirectory() ? 'DIR' : 'FILE';
      if (needDir && type === 'FILE')
        return cb()
      else
        return cb(null, type, stat)
    }
  }

  var self = this;
  var statcb = inflight_1('stat\0' + abs, lstatcb_);
  if (statcb)
    fs$1.lstat(abs, statcb);

  function lstatcb_ (er, lstat) {
    if (lstat && lstat.isSymbolicLink()) {
      // If it's a symlink, then treat it as the target, unless
      // the target does not exist, then treat it as a file.
      return fs$1.stat(abs, function (er, stat) {
        if (er)
          self._stat2(f, abs, null, lstat, cb);
        else
          self._stat2(f, abs, er, stat, cb);
      })
    } else {
      self._stat2(f, abs, er, lstat, cb);
    }
  }
};

Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
  if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
    this.statCache[abs] = false;
    return cb()
  }

  var needDir = f.slice(-1) === '/';
  this.statCache[abs] = stat;

  if (abs.slice(-1) === '/' && stat && !stat.isDirectory())
    return cb(null, false, stat)

  var c = true;
  if (stat)
    c = stat.isDirectory() ? 'DIR' : 'FILE';
  this.cache[abs] = this.cache[abs] || c;

  if (needDir && c === 'FILE')
    return cb()

  return cb(null, c, stat)
};

const isEmptyString$1 = val => typeof val === 'string' && (val === '' || val === './');

/**
 * Returns an array of strings that match one or more glob patterns.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm(list, patterns[, options]);
 *
 * console.log(mm(['a.js', 'a.txt'], ['*.js']));
 * //=> [ 'a.js' ]
 * ```
 * @param {String|Array<string>} list List of strings to match.
 * @param {String|Array<string>} patterns One or more glob patterns to use for matching.
 * @param {Object} options See available [options](#options)
 * @return {Array} Returns an array of matches
 * @summary false
 * @api public
 */

const micromatch$1 = (list, patterns, options) => {
  patterns = [].concat(patterns);
  list = [].concat(list);

  let omit = new Set();
  let keep = new Set();
  let items = new Set();
  let negatives = 0;

  let onResult = state => {
    items.add(state.output);
    if (options && options.onResult) {
      options.onResult(state);
    }
  };

  for (let i = 0; i < patterns.length; i++) {
    let isMatch = picomatch$1(String(patterns[i]), { ...options, onResult }, true);
    let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
    if (negated) negatives++;

    for (let item of list) {
      let matched = isMatch(item, true);

      let match = negated ? !matched.isMatch : matched.isMatch;
      if (!match) continue;

      if (negated) {
        omit.add(matched.output);
      } else {
        omit.delete(matched.output);
        keep.add(matched.output);
      }
    }
  }

  let result = negatives === patterns.length ? [...items] : [...keep];
  let matches = result.filter(item => !omit.has(item));

  if (options && matches.length === 0) {
    if (options.failglob === true) {
      throw new Error(`No matches found for "${patterns.join(', ')}"`);
    }

    if (options.nonull === true || options.nullglob === true) {
      return options.unescape ? patterns.map(p => p.replace(/\\/g, '')) : patterns;
    }
  }

  return matches;
};

/**
 * Backwards compatibility
 */

micromatch$1.match = micromatch$1;

/**
 * Returns a matcher function from the given glob `pattern` and `options`.
 * The returned function takes a string to match as its only argument and returns
 * true if the string is a match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matcher(pattern[, options]);
 *
 * const isMatch = mm.matcher('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Function} Returns a matcher function.
 * @api public
 */

micromatch$1.matcher = (pattern, options) => picomatch$1(pattern, options);

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.isMatch(string, patterns[, options]);
 *
 * console.log(mm.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(mm.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch$1.isMatch = (str, patterns, options) => picomatch$1(patterns, options)(str);

/**
 * Backwards compatibility
 */

micromatch$1.any = micromatch$1.isMatch;

/**
 * Returns a list of strings that _**do not match any**_ of the given `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.not(list, patterns[, options]);
 *
 * console.log(mm.not(['a.a', 'b.b', 'c.c'], '*.a'));
 * //=> ['b.b', 'c.c']
 * ```
 * @param {Array} `list` Array of strings to match.
 * @param {String|Array} `patterns` One or more glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Array} Returns an array of strings that **do not match** the given patterns.
 * @api public
 */

micromatch$1.not = (list, patterns, options = {}) => {
  patterns = [].concat(patterns).map(String);
  let result = new Set();
  let items = [];

  let onResult = state => {
    if (options.onResult) options.onResult(state);
    items.push(state.output);
  };

  let matches = micromatch$1(list, patterns, { ...options, onResult });

  for (let item of items) {
    if (!matches.includes(item)) {
      result.add(item);
    }
  }
  return [...result];
};

/**
 * Returns true if the given `string` contains the given pattern. Similar
 * to [.isMatch](#isMatch) but the pattern can match any part of the string.
 *
 * ```js
 * var mm = require('micromatch');
 * // mm.contains(string, pattern[, options]);
 *
 * console.log(mm.contains('aa/bb/cc', '*b'));
 * //=> true
 * console.log(mm.contains('aa/bb/cc', '*d'));
 * //=> false
 * ```
 * @param {String} `str` The string to match.
 * @param {String|Array} `patterns` Glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if the patter matches any part of `str`.
 * @api public
 */

micromatch$1.contains = (str, pattern, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util$2.inspect(str)}"`);
  }

  if (Array.isArray(pattern)) {
    return pattern.some(p => micromatch$1.contains(str, p, options));
  }

  if (typeof pattern === 'string') {
    if (isEmptyString$1(str) || isEmptyString$1(pattern)) {
      return false;
    }

    if (str.includes(pattern) || (str.startsWith('./') && str.slice(2).includes(pattern))) {
      return true;
    }
  }

  return micromatch$1.isMatch(str, pattern, { ...options, contains: true });
};

/**
 * Filter the keys of the given object with the given `glob` pattern
 * and `options`. Does not attempt to match nested keys. If you need this feature,
 * use [glob-object][] instead.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matchKeys(object, patterns[, options]);
 *
 * const obj = { aa: 'a', ab: 'b', ac: 'c' };
 * console.log(mm.matchKeys(obj, '*b'));
 * //=> { ab: 'b' }
 * ```
 * @param {Object} `object` The object with keys to filter.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Object} Returns an object with only keys that match the given patterns.
 * @api public
 */

micromatch$1.matchKeys = (obj, patterns, options) => {
  if (!utils$1.isObject(obj)) {
    throw new TypeError('Expected the first argument to be an object');
  }
  let keys = micromatch$1(Object.keys(obj), patterns, options);
  let res = {};
  for (let key of keys) res[key] = obj[key];
  return res;
};

/**
 * Returns true if some of the strings in the given `list` match any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.some(list, patterns[, options]);
 *
 * console.log(mm.some(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // true
 * console.log(mm.some(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test. Returns as soon as the first match is found.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch$1.some = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch$1(String(pattern), options);
    if (items.some(item => isMatch(item))) {
      return true;
    }
  }
  return false;
};

/**
 * Returns true if every string in the given `list` matches
 * any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.every(list, patterns[, options]);
 *
 * console.log(mm.every('foo.js', ['foo.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // false
 * console.log(mm.every(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch$1.every = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch$1(String(pattern), options);
    if (!items.every(item => isMatch(item))) {
      return false;
    }
  }
  return true;
};

/**
 * Returns true if **all** of the given `patterns` match
 * the specified string.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.all(string, patterns[, options]);
 *
 * console.log(mm.all('foo.js', ['foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', '!foo.js']));
 * // false
 *
 * console.log(mm.all('foo.js', ['*.js', 'foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', 'f*', '*o*', '*o.js']));
 * // true
 * ```
 * @param {String|Array} `str` The string to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch$1.all = (str, patterns, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util$2.inspect(str)}"`);
  }

  return [].concat(patterns).every(p => picomatch$1(p, options)(str));
};

/**
 * Returns an array of matches captured by `pattern` in `string, or `null` if the pattern did not match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.capture(pattern, string[, options]);
 *
 * console.log(mm.capture('test/*.js', 'test/foo.js'));
 * //=> ['foo']
 * console.log(mm.capture('test/*.js', 'foo/bar.css'));
 * //=> null
 * ```
 * @param {String} `glob` Glob pattern to use for matching.
 * @param {String} `input` String to match
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns an array of captures if the input matches the glob pattern, otherwise `null`.
 * @api public
 */

micromatch$1.capture = (glob, input, options) => {
  let posix = utils$1.isWindows(options);
  let regex = picomatch$1.makeRe(String(glob), { ...options, capture: true });
  let match = regex.exec(posix ? utils$1.toPosixSlashes(input) : input);

  if (match) {
    return match.slice(1).map(v => v === void 0 ? '' : v);
  }
};

/**
 * Create a regular expression from the given glob `pattern`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.makeRe(pattern[, options]);
 *
 * console.log(mm.makeRe('*.js'));
 * //=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
 * ```
 * @param {String} `pattern` A glob pattern to convert to regex.
 * @param {Object} `options`
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

micromatch$1.makeRe = (...args) => picomatch$1.makeRe(...args);

/**
 * Scan a glob pattern to separate the pattern into segments. Used
 * by the [split](#split) method.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm.scan(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

micromatch$1.scan = (...args) => picomatch$1.scan(...args);

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm(pattern[, options]);
 * ```
 * @param {String} `glob`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as regex source string.
 * @api public
 */

micromatch$1.parse = (patterns, options) => {
  let res = [];
  for (let pattern of [].concat(patterns || [])) {
    for (let str of braces_1(String(pattern), options)) {
      res.push(picomatch$1.parse(str, options));
    }
  }
  return res;
};

/**
 * Process the given brace `pattern`.
 *
 * ```js
 * const { braces } = require('micromatch');
 * console.log(braces('foo/{a,b,c}/bar'));
 * //=> [ 'foo/(a|b|c)/bar' ]
 *
 * console.log(braces('foo/{a,b,c}/bar', { expand: true }));
 * //=> [ 'foo/a/bar', 'foo/b/bar', 'foo/c/bar' ]
 * ```
 * @param {String} `pattern` String with brace pattern to process.
 * @param {Object} `options` Any [options](#options) to change how expansion is performed. See the [braces][] library for all available options.
 * @return {Array}
 * @api public
 */

micromatch$1.braces = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');
  if ((options && options.nobrace === true) || !/\{.*\}/.test(pattern)) {
    return [pattern];
  }
  return braces_1(pattern, options);
};

/**
 * Expand braces
 */

micromatch$1.braceExpand = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');
  return micromatch$1.braces(pattern, { ...options, expand: true });
};

/**
 * Expose micromatch
 */

var micromatch_1$1 = micromatch$1;

var build$5 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.replacePathSepForRegex = exports.escapeStrForRegex = exports.escapePathForRegex = void 0;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
const escapePathForRegex = dir => {
  if (path$3.sep === '\\') {
    // Replace "\" with "/" so it's not escaped by escapeStrForRegex.
    // replacePathSepForRegex will convert it back.
    dir = dir.replace(/\\/g, '/');
  }

  return replacePathSepForRegex(escapeStrForRegex(dir));
};

exports.escapePathForRegex = escapePathForRegex;

const escapeStrForRegex = string =>
  string.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');

exports.escapeStrForRegex = escapeStrForRegex;

const replacePathSepForRegex = string => {
  if (path$3.sep === '\\') {
    return string.replace(
      /(\/|(.)?\\(?![[\]{}()*+?.^$|\\]))/g,
      (_match, _, p2) => (p2 && p2 !== '\\' ? p2 + '\\\\' : '\\\\')
    );
  }

  return string;
};

exports.replacePathSepForRegex = replacePathSepForRegex;
});

var isMergeableObject = function isMergeableObject(value) {
	return isNonNullObject(value)
		&& !isSpecial(value)
};

function isNonNullObject(value) {
	return !!value && typeof value === 'object'
}

function isSpecial(value) {
	var stringValue = Object.prototype.toString.call(value);

	return stringValue === '[object RegExp]'
		|| stringValue === '[object Date]'
		|| isReactElement(value)
}

// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
	return value.$$typeof === REACT_ELEMENT_TYPE
}

function emptyTarget(val) {
	return Array.isArray(val) ? [] : {}
}

function cloneUnlessOtherwiseSpecified(value, options) {
	return (options.clone !== false && options.isMergeableObject(value))
		? deepmerge(emptyTarget(value), value, options)
		: value
}

function defaultArrayMerge(target, source, options) {
	return target.concat(source).map(function(element) {
		return cloneUnlessOtherwiseSpecified(element, options)
	})
}

function getMergeFunction(key, options) {
	if (!options.customMerge) {
		return deepmerge
	}
	var customMerge = options.customMerge(key);
	return typeof customMerge === 'function' ? customMerge : deepmerge
}

function getEnumerableOwnPropertySymbols(target) {
	return Object.getOwnPropertySymbols
		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return target.propertyIsEnumerable(symbol)
		})
		: []
}

function getKeys(target) {
	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
}

function propertyIsOnObject(object, property) {
	try {
		return property in object
	} catch(_) {
		return false
	}
}

// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
	return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
			&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
}

function mergeObject(target, source, options) {
	var destination = {};
	if (options.isMergeableObject(target)) {
		getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
	}
	getKeys(source).forEach(function(key) {
		if (propertyIsUnsafe(target, key)) {
			return
		}

		if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
		} else {
			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		}
	});
	return destination
}

function deepmerge(target, source, options) {
	options = options || {};
	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
	options.isMergeableObject = options.isMergeableObject || isMergeableObject;
	// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
	// implementations can use it. The caller may not replace it.
	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

	var sourceIsArray = Array.isArray(source);
	var targetIsArray = Array.isArray(target);
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source, options)
	} else if (sourceIsArray) {
		return options.arrayMerge(target, source, options)
	} else {
		return mergeObject(target, source, options)
	}
}

deepmerge.all = function deepmergeAll(array, options) {
	if (!Array.isArray(array)) {
		throw new Error('first argument should be an array')
	}

	return array.reduce(function(prev, next) {
		return deepmerge(prev, next, options)
	}, {})
};

var deepmerge_1 = deepmerge;

var cjs = deepmerge_1;

var validatePattern_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = validatePattern;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function validatePattern(pattern) {
  if (pattern) {
    try {
      // eslint-disable-next-line no-new
      new RegExp(pattern, 'i');
    } catch (e) {
      return false;
    }
  }

  return true;
}
});

var getMaxWorkers_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = getMaxWorkers;

function _os() {
  const data = os$1;

  _os = function () {
    return data;
  };

  return data;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function getMaxWorkers(argv, defaultOptions) {
  if (argv.runInBand) {
    return 1;
  } else if (argv.maxWorkers) {
    return parseWorkers(argv.maxWorkers);
  } else if (defaultOptions && defaultOptions.maxWorkers) {
    return parseWorkers(defaultOptions.maxWorkers);
  } else {
    // In watch mode, Jest should be unobtrusive and not use all available CPUs.
    const numCpus = (0, _os().cpus)() ? (0, _os().cpus)().length : 1;
    const isWatchModeEnabled = argv.watch || argv.watchAll;
    return Math.max(
      isWatchModeEnabled ? Math.floor(numCpus / 2) : numCpus - 1,
      1
    );
  }
}

const parseWorkers = maxWorkers => {
  const parsed = parseInt(maxWorkers.toString(), 10);

  if (
    typeof maxWorkers === 'string' &&
    maxWorkers.trim().endsWith('%') &&
    parsed > 0 &&
    parsed <= 100
  ) {
    const numCpus = (0, _os().cpus)().length;
    const workers = Math.floor((parsed / 100) * numCpus);
    return workers >= 1 ? workers : 1;
  }

  return parsed > 0 ? parsed : 1;
};
});

var constants$3 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.JEST_CONFIG_EXT_ORDER = exports.JEST_CONFIG_EXT_JSON = exports.JEST_CONFIG_EXT_JS = exports.JEST_CONFIG_EXT_MJS = exports.JEST_CONFIG_EXT_CJS = exports.JEST_CONFIG_BASE_NAME = exports.PACKAGE_JSON = exports.DEFAULT_REPORTER_LABEL = exports.DEFAULT_JS_PATTERN = exports.NODE_MODULES = void 0;

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const NODE_MODULES = path().sep + 'node_modules' + path().sep;
exports.NODE_MODULES = NODE_MODULES;
const DEFAULT_JS_PATTERN = '^.+\\.[jt]sx?$';
exports.DEFAULT_JS_PATTERN = DEFAULT_JS_PATTERN;
const DEFAULT_REPORTER_LABEL = 'default';
exports.DEFAULT_REPORTER_LABEL = DEFAULT_REPORTER_LABEL;
const PACKAGE_JSON = 'package.json';
exports.PACKAGE_JSON = PACKAGE_JSON;
const JEST_CONFIG_BASE_NAME = 'jest.config';
exports.JEST_CONFIG_BASE_NAME = JEST_CONFIG_BASE_NAME;
const JEST_CONFIG_EXT_CJS = '.cjs';
exports.JEST_CONFIG_EXT_CJS = JEST_CONFIG_EXT_CJS;
const JEST_CONFIG_EXT_MJS = '.mjs';
exports.JEST_CONFIG_EXT_MJS = JEST_CONFIG_EXT_MJS;
const JEST_CONFIG_EXT_JS = '.js';
exports.JEST_CONFIG_EXT_JS = JEST_CONFIG_EXT_JS;
const JEST_CONFIG_EXT_JSON = '.json';
exports.JEST_CONFIG_EXT_JSON = JEST_CONFIG_EXT_JSON;
const JEST_CONFIG_EXT_ORDER = Object.freeze([
  JEST_CONFIG_EXT_JS,
  JEST_CONFIG_EXT_MJS,
  JEST_CONFIG_EXT_CJS,
  JEST_CONFIG_EXT_JSON
]);
exports.JEST_CONFIG_EXT_ORDER = JEST_CONFIG_EXT_ORDER;
});

var ReporterValidationErrors = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.createReporterError = createReporterError;
exports.createArrayReporterError = createArrayReporterError;
exports.validateReporters = validateReporters;

function _jestValidate() {
  const data = build$3;

  _jestValidate = function () {
    return data;
  };

  return data;
}

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}

function _jestGetType() {
  const data = _interopRequireDefault(build$2);

  _jestGetType = function () {
    return data;
  };

  return data;
}



function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const validReporterTypes = ['array', 'string'];
const ERROR = `${utils$3.BULLET}Reporter Validation Error`;
/**
 * Reporter Validation Error is thrown if the given arguments
 * within the reporter are not valid.
 *
 * This is a highly specific reporter error and in the future will be
 * merged with jest-validate. Till then, we can make use of it. It works
 * and that's what counts most at this time.
 */

function createReporterError(reporterIndex, reporterValue) {
  const errorMessage =
    `  Reporter at index ${reporterIndex} must be of type:\n` +
    `    ${_chalk().default.bold.green(validReporterTypes.join(' or '))}\n` +
    `  but instead received:\n` +
    `    ${_chalk().default.bold.red(
      (0, _jestGetType().default)(reporterValue)
    )}`;
  return new (_jestValidate().ValidationError)(
    ERROR,
    errorMessage,
    utils$3.DOCUMENTATION_NOTE
  );
}

function createArrayReporterError(
  arrayReporter,
  reporterIndex,
  valueIndex,
  value,
  expectedType,
  valueName
) {
  const errorMessage =
    `  Unexpected value for ${valueName} ` +
    `at index ${valueIndex} of reporter at index ${reporterIndex}\n` +
    '  Expected:\n' +
    `    ${_chalk().default.bold.red(expectedType)}\n` +
    '  Got:\n' +
    `    ${_chalk().default.bold.green((0, _jestGetType().default)(value))}\n` +
    `  Reporter configuration:\n` +
    `    ${_chalk().default.bold.green(
      JSON.stringify(arrayReporter, null, 2).split('\n').join('\n    ')
    )}`;
  return new (_jestValidate().ValidationError)(
    ERROR,
    errorMessage,
    utils$3.DOCUMENTATION_NOTE
  );
}

function validateReporters(reporterConfig) {
  return reporterConfig.every((reporter, index) => {
    if (Array.isArray(reporter)) {
      validateArrayReporter(reporter, index);
    } else if (typeof reporter !== 'string') {
      throw createReporterError(index, reporter);
    }

    return true;
  });
}

function validateArrayReporter(arrayReporter, reporterIndex) {
  const [path, options] = arrayReporter;

  if (typeof path !== 'string') {
    throw createArrayReporterError(
      arrayReporter,
      reporterIndex,
      0,
      path,
      'string',
      'Path'
    );
  } else if (typeof options !== 'object') {
    throw createArrayReporterError(
      arrayReporter,
      reporterIndex,
      1,
      options,
      'object',
      'Reporter Configuration'
    );
  }
}
});

var getCacheDirectory_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function _os() {
  const data = os$1;

  _os = function () {
    return data;
  };

  return data;
}

function _jestUtil() {
  const data = build;

  _jestUtil = function () {
    return data;
  };

  return data;
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const getCacheDirectory = () => {
  const {getuid} = process;
  const tmpdirPath = path().join(
    (0, _jestUtil().tryRealpath)((0, _os().tmpdir)()),
    'jest'
  );

  if (getuid == null) {
    return tmpdirPath;
  } else {
    // On some platforms tmpdir() is `/tmp`, causing conflicts between different
    // users and permission issues. Adding an additional subdivision by UID can
    // help.
    return `${tmpdirPath}_${getuid.call(process).toString(36)}`;
  }
};

var _default = getCacheDirectory;
exports.default = _default;
});

var Defaults = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function _jestRegexUtil() {
  const data = build$5;

  _jestRegexUtil = function () {
    return data;
  };

  return data;
}



var _getCacheDirectory = _interopRequireDefault(getCacheDirectory_1);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const NODE_MODULES_REGEXP = (0, _jestRegexUtil().replacePathSepForRegex)(
  constants$3.NODE_MODULES
);
const defaultOptions = {
  automock: false,
  bail: 0,
  cache: true,
  cacheDirectory: (0, _getCacheDirectory.default)(),
  changedFilesWithAncestor: false,
  clearMocks: false,
  collectCoverage: false,
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageProvider: 'babel',
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  errorOnDeprecated: false,
  expand: false,
  forceCoverageMatch: [],
  globals: {},
  haste: {
    computeSha1: false,
    throwOnModuleCollision: false
  },
  maxConcurrency: 5,
  maxWorkers: '50%',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  moduleNameMapper: {},
  modulePathIgnorePatterns: [],
  noStackTrace: false,
  notify: false,
  notifyMode: 'failure-change',
  prettierPath: 'prettier',
  resetMocks: false,
  resetModules: false,
  restoreMocks: false,
  roots: ['<rootDir>'],
  runTestsByPath: false,
  runner: 'jest-runner',
  setupFiles: [],
  setupFilesAfterEnv: [],
  skipFilter: false,
  slowTestThreshold: 5,
  snapshotSerializers: [],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {},
  testFailureExitCode: 1,
  testLocationInResults: false,
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: [],
  testRunner: 'jasmine2',
  testSequencer: '@jest/test-sequencer',
  testURL: 'http://localhost',
  timers: 'real',
  transformIgnorePatterns: [NODE_MODULES_REGEXP],
  useStderr: false,
  watch: false,
  watchPathIgnorePatterns: [],
  watchman: true
};
var _default = defaultOptions;
exports.default = _default;
});

var Deprecated = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}

function _prettyFormat() {
  const data = _interopRequireDefault(build$1);

  _prettyFormat = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const format = value =>
  (0, _prettyFormat().default)(value, {
    min: true
  });

var _default = {
  browser: () => `  Option ${_chalk().default.bold(
    '"browser"'
  )} has been deprecated. Please install "browser-resolve" and use the "resolver" option in Jest configuration as follows:
  {
    ${_chalk().default.bold('"resolver"')}: ${_chalk().default.bold(
    '"browser-resolve"'
  )}
  }
  `,
  mapCoverage: () => `  Option ${_chalk().default.bold(
    '"mapCoverage"'
  )} has been removed, as it's no longer necessary.

  Please update your configuration.`,
  preprocessorIgnorePatterns: options => `  Option ${_chalk().default.bold(
    '"preprocessorIgnorePatterns"'
  )} was replaced by ${_chalk().default.bold(
    '"transformIgnorePatterns"'
  )}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${_chalk().default.bold(
      '"transformIgnorePatterns"'
    )}: ${_chalk().default.bold(format(options.preprocessorIgnorePatterns))}
  }

  Please update your configuration.`,
  scriptPreprocessor: options => `  Option ${_chalk().default.bold(
    '"scriptPreprocessor"'
  )} was replaced by ${_chalk().default.bold(
    '"transform"'
  )}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${_chalk().default.bold('"transform"')}: ${_chalk().default.bold(
    `{".*": ${format(options.scriptPreprocessor)}}`
  )}
  }

  Please update your configuration.`,
  setupTestFrameworkScriptFile: _options => `  Option ${_chalk().default.bold(
    '"setupTestFrameworkScriptFile"'
  )} was replaced by configuration ${_chalk().default.bold(
    '"setupFilesAfterEnv"'
  )}, which supports multiple paths.

  Please update your configuration.`,
  testPathDirs: options => `  Option ${_chalk().default.bold(
    '"testPathDirs"'
  )} was replaced by ${_chalk().default.bold('"roots"')}.

  Jest now treats your current configuration as:
  {
    ${_chalk().default.bold('"roots"')}: ${_chalk().default.bold(
    format(options.testPathDirs)
  )}
  }

  Please update your configuration.
  `
};
exports.default = _default;
});

var setFromArgv_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = setFromArgv;



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const specialArgs = ['_', '$0', 'h', 'help', 'config'];

function setFromArgv(options, argv) {
  const argvToOptions = Object.keys(argv)
    .filter(key => argv[key] !== undefined && specialArgs.indexOf(key) === -1)
    .reduce((options, key) => {
      switch (key) {
        case 'coverage':
          options.collectCoverage = argv[key];
          break;

        case 'json':
          options.useStderr = argv[key];
          break;

        case 'watchAll':
          options.watch = false;
          options.watchAll = argv[key];
          break;

        case 'env':
          options.testEnvironment = argv[key];
          break;

        case 'config':
          break;

        case 'coverageThreshold':
        case 'globals':
        case 'moduleNameMapper':
        case 'transform':
        case 'haste':
          const str = argv[key];

          if ((0, utils$3.isJSONString)(str)) {
            options[key] = JSON.parse(str);
          }

          break;

        default:
          options[key] = argv[key];
      }

      return options;
    }, {});
  return {
    ...options,
    ...((0, utils$3.isJSONString)(argv.config) ? JSON.parse(argv.config) : null),
    ...argvToOptions
  };
}
});

var ValidConfig = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function _jestRegexUtil() {
  const data = build$5;

  _jestRegexUtil = function () {
    return data;
  };

  return data;
}

function _jestValidate() {
  const data = build$3;

  _jestValidate = function () {
    return data;
  };

  return data;
}



/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const NODE_MODULES_REGEXP = (0, _jestRegexUtil().replacePathSepForRegex)(
  constants$3.NODE_MODULES
);
const initialOptions = {
  automock: false,
  bail: (0, _jestValidate().multipleValidOptions)(false, 0),
  cache: true,
  cacheDirectory: '/tmp/user/jest',
  changedFilesWithAncestor: false,
  changedSince: 'master',
  clearMocks: false,
  collectCoverage: true,
  collectCoverageFrom: ['src', '!public'],
  collectCoverageOnlyFrom: {
    '<rootDir>/this-directory-is-covered/Covered.js': true
  },
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageProvider: 'v8',
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  dependencyExtractor: '<rootDir>/dependencyExtractor.js',
  displayName: (0, _jestValidate().multipleValidOptions)('test-config', {
    color: 'blue',
    name: 'test-config'
  }),
  errorOnDeprecated: false,
  expand: false,
  extraGlobals: [],
  filter: '<rootDir>/filter.js',
  forceCoverageMatch: ['**/*.t.js'],
  forceExit: false,
  globalSetup: 'setup.js',
  globalTeardown: 'teardown.js',
  globals: {
    __DEV__: true
  },
  haste: {
    computeSha1: true,
    defaultPlatform: 'ios',
    hasteImplModulePath: '<rootDir>/haste_impl.js',
    platforms: ['ios', 'android'],
    throwOnModuleCollision: false
  },
  json: false,
  lastCommit: false,
  logHeapUsage: true,
  maxConcurrency: 5,
  maxWorkers: '50%',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  moduleLoader: '<rootDir>',
  moduleNameMapper: {
    '^React$': '<rootDir>/node_modules/react'
  },
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  modulePaths: ['/shared/vendor/modules'],
  name: 'string',
  noStackTrace: false,
  notify: false,
  notifyMode: 'failure-change',
  onlyChanged: false,
  preset: 'react-native',
  prettierPath: '<rootDir>/node_modules/prettier',
  projects: ['project-a', 'project-b/'],
  reporters: [
    'default',
    'custom-reporter-1',
    [
      'custom-reporter-2',
      {
        configValue: true
      }
    ]
  ],
  resetMocks: false,
  resetModules: false,
  resolver: '<rootDir>/resolver.js',
  restoreMocks: false,
  rootDir: '/',
  roots: ['<rootDir>'],
  runTestsByPath: false,
  runner: 'jest-runner',
  setupFiles: ['<rootDir>/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/testSetupFile.js'],
  silent: true,
  skipFilter: false,
  skipNodeResolution: false,
  slowTestThreshold: 5,
  snapshotResolver: '<rootDir>/snapshotResolver.js',
  snapshotSerializers: ['my-serializer-module'],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    userAgent: 'Agent/007'
  },
  testFailureExitCode: 1,
  testLocationInResults: false,
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testNamePattern: 'test signature',
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: (0, _jestValidate()
    .multipleValidOptions)('(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$', [
    '/__tests__/\\.test\\.[jt]sx?$',
    '/__tests__/\\.spec\\.[jt]sx?$'
  ]),
  testResultsProcessor: 'processor-node-module',
  testRunner: 'jasmine2',
  testSequencer: '@jest/test-sequencer',
  testTimeout: 5000,
  testURL: 'http://localhost',
  timers: 'real',
  transform: {
    '^.+\\.js$': '<rootDir>/preprocessor.js'
  },
  transformIgnorePatterns: [NODE_MODULES_REGEXP],
  unmockedModulePathPatterns: ['mock'],
  updateSnapshot: true,
  useStderr: false,
  verbose: false,
  watch: false,
  watchPathIgnorePatterns: ['<rootDir>/e2e/'],
  watchPlugins: [
    'path/to/yourWatchPlugin',
    [
      'jest-watch-typeahead/filename',
      {
        key: 'k',
        prompt: 'do something with my custom prompt'
      }
    ]
  ],
  watchman: true
};
var _default = initialOptions;
exports.default = _default;
});

var color = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getDisplayNameColor = void 0;

function _crypto() {
  const data = crypto$1;

  _crypto = function () {
    return data;
  };

  return data;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

const getDisplayNameColor = seed => {
  if (seed === undefined) {
    return 'white';
  }

  const hash = (0, _crypto().createHash)('sha256');
  hash.update(seed);
  const num = hash.digest().readUInt32LE(0);
  return colors[num % colors.length];
};

exports.getDisplayNameColor = getDisplayNameColor;
});

var normalize_1$1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = normalize;

function _crypto() {
  const data = crypto$1;

  _crypto = function () {
    return data;
  };

  return data;
}

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function _gracefulFs() {
  const data = gracefulFs;

  _gracefulFs = function () {
    return data;
  };

  return data;
}

function _glob() {
  const data = glob_1;

  _glob = function () {
    return data;
  };

  return data;
}

function _jestValidate() {
  const data = build$3;

  _jestValidate = function () {
    return data;
  };

  return data;
}

function _jestUtil() {
  const data = build;

  _jestUtil = function () {
    return data;
  };

  return data;
}

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}

function _micromatch() {
  const data = _interopRequireDefault(micromatch_1$1);

  _micromatch = function () {
    return data;
  };

  return data;
}

function _jestResolve() {
  const data = _interopRequireDefault(build$4);

  _jestResolve = function () {
    return data;
  };

  return data;
}

function _jestRegexUtil() {
  const data = build$5;

  _jestRegexUtil = function () {
    return data;
  };

  return data;
}

function _deepmerge() {
  const data = _interopRequireDefault(cjs);

  _deepmerge = function () {
    return data;
  };

  return data;
}

var _validatePattern = _interopRequireDefault(validatePattern_1);

var _getMaxWorkers = _interopRequireDefault(getMaxWorkers_1);







var _Defaults = _interopRequireDefault(Defaults);

var _Deprecated = _interopRequireDefault(Deprecated);

var _setFromArgv = _interopRequireDefault(setFromArgv_1);

var _ValidConfig = _interopRequireDefault(ValidConfig);



function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const ERROR = `${utils$3.BULLET}Validation Error`;
const PRESET_EXTENSIONS = ['.json', '.js'];
const PRESET_NAME = 'jest-preset';

const createConfigError = message =>
  new (_jestValidate().ValidationError)(
    ERROR,
    message,
    utils$3.DOCUMENTATION_NOTE
  );

function verifyDirectoryExists(path, key) {
  try {
    const rootStat = (0, _gracefulFs().statSync)(path);

    if (!rootStat.isDirectory()) {
      throw createConfigError(
        `  ${_chalk().default.bold(path)} in the ${_chalk().default.bold(
          key
        )} option is not a directory.`
      );
    }
  } catch (err) {
    if (err instanceof _jestValidate().ValidationError) {
      throw err;
    }

    if (err.code === 'ENOENT') {
      throw createConfigError(
        `  Directory ${_chalk().default.bold(
          path
        )} in the ${_chalk().default.bold(key)} option was not found.`
      );
    } // Not sure in which cases `statSync` can throw, so let's just show the underlying error to the user

    throw createConfigError(
      `  Got an error trying to find ${_chalk().default.bold(
        path
      )} in the ${_chalk().default.bold(key)} option.\n\n  Error was: ${
        err.message
      }`
    );
  }
} // TS 3.5 forces us to split these into 2

const mergeModuleNameMapperWithPreset = (options, preset) => {
  if (options['moduleNameMapper'] && preset['moduleNameMapper']) {
    options['moduleNameMapper'] = {
      ...options['moduleNameMapper'],
      ...preset['moduleNameMapper'],
      ...options['moduleNameMapper']
    };
  }
};

const mergeTransformWithPreset = (options, preset) => {
  if (options['transform'] && preset['transform']) {
    options['transform'] = {
      ...options['transform'],
      ...preset['transform'],
      ...options['transform']
    };
  }
};

const mergeGlobalsWithPreset = (options, preset) => {
  if (options['globals'] && preset['globals']) {
    options['globals'] = (0, _deepmerge().default)(
      preset['globals'],
      options['globals']
    );
  }
};

const setupPreset = (options, optionsPreset) => {
  let preset;
  const presetPath = (0, utils$3.replaceRootDirInPath)(
    options.rootDir,
    optionsPreset
  );

  const presetModule = _jestResolve().default.findNodeModule(
    presetPath.startsWith('.')
      ? presetPath
      : path().join(presetPath, PRESET_NAME),
    {
      basedir: options.rootDir,
      extensions: PRESET_EXTENSIONS
    }
  );

  try {
    // Force re-evaluation to support multiple projects
    try {
      if (presetModule) {
        delete require.cache[require.resolve(presetModule)];
      }
    } catch (e) {} // @ts-expect-error: `presetModule` can be null?

    preset = commonjsRequire(presetModule);
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      throw createConfigError(
        `  Preset ${_chalk().default.bold(presetPath)} is invalid:\n\n  ${
          error.message
        }\n  ${error.stack}`
      );
    }

    if (error.message.includes('Cannot find module')) {
      if (error.message.includes(presetPath)) {
        const preset = _jestResolve().default.findNodeModule(presetPath, {
          basedir: options.rootDir
        });

        if (preset) {
          throw createConfigError(
            `  Module ${_chalk().default.bold(
              presetPath
            )} should have "jest-preset.js" or "jest-preset.json" file at the root.`
          );
        }

        throw createConfigError(
          `  Preset ${_chalk().default.bold(presetPath)} not found.`
        );
      }

      throw createConfigError(
        `  Missing dependency in ${_chalk().default.bold(presetPath)}:\n\n  ${
          error.message
        }\n  ${error.stack}`
      );
    }

    throw createConfigError(
      `  An unknown error occurred in ${_chalk().default.bold(
        presetPath
      )}:\n\n  ${error.message}\n  ${error.stack}`
    );
  }

  if (options.setupFiles) {
    options.setupFiles = (preset.setupFiles || []).concat(options.setupFiles);
  }

  if (options.setupFilesAfterEnv) {
    options.setupFilesAfterEnv = (preset.setupFilesAfterEnv || []).concat(
      options.setupFilesAfterEnv
    );
  }

  if (options.modulePathIgnorePatterns && preset.modulePathIgnorePatterns) {
    options.modulePathIgnorePatterns = preset.modulePathIgnorePatterns.concat(
      options.modulePathIgnorePatterns
    );
  }

  mergeModuleNameMapperWithPreset(options, preset);
  mergeTransformWithPreset(options, preset);
  mergeGlobalsWithPreset(options, preset);
  return {...preset, ...options};
};

const setupBabelJest = options => {
  const transform = options.transform;
  let babelJest;

  if (transform) {
    const customJSPattern = Object.keys(transform).find(pattern => {
      const regex = new RegExp(pattern);
      return regex.test('a.js') || regex.test('a.jsx');
    });
    const customTSPattern = Object.keys(transform).find(pattern => {
      const regex = new RegExp(pattern);
      return regex.test('a.ts') || regex.test('a.tsx');
    });
    [customJSPattern, customTSPattern].forEach(pattern => {
      if (pattern) {
        const customTransformer = transform[pattern];

        if (Array.isArray(customTransformer)) {
          if (customTransformer[0] === 'babel-jest') {
            babelJest = require.resolve('babel-jest');
            customTransformer[0] = babelJest;
          } else if (customTransformer[0].includes('babel-jest')) {
            babelJest = customTransformer[0];
          }
        } else {
          if (customTransformer === 'babel-jest') {
            babelJest = require.resolve('babel-jest');
            transform[pattern] = babelJest;
          } else if (customTransformer.includes('babel-jest')) {
            babelJest = customTransformer;
          }
        }
      }
    });
  } else {
    babelJest = require.resolve('babel-jest');
    options.transform = {
      [constants$3.DEFAULT_JS_PATTERN]: babelJest
    };
  }
};

const normalizeCollectCoverageOnlyFrom = (options, key) => {
  const initialCollectCoverageFrom = options[key];
  const collectCoverageOnlyFrom = Array.isArray(initialCollectCoverageFrom)
    ? initialCollectCoverageFrom // passed from argv
    : Object.keys(initialCollectCoverageFrom); // passed from options

  return collectCoverageOnlyFrom.reduce((map, filePath) => {
    filePath = path().resolve(
      options.rootDir,
      (0, utils$3.replaceRootDirInPath)(options.rootDir, filePath)
    );
    map[filePath] = true;
    return map;
  }, Object.create(null));
};

const normalizeCollectCoverageFrom = (options, key) => {
  const initialCollectCoverageFrom = options[key];
  let value;

  if (!initialCollectCoverageFrom) {
    value = [];
  }

  if (!Array.isArray(initialCollectCoverageFrom)) {
    try {
      value = JSON.parse(initialCollectCoverageFrom);
    } catch (e) {}

    if (options[key] && !Array.isArray(value)) {
      value = [initialCollectCoverageFrom];
    }
  } else {
    value = initialCollectCoverageFrom;
  }

  if (value) {
    value = value.map(filePath =>
      filePath.replace(/^(!?)(<rootDir>\/)(.*)/, '$1$3')
    );
  }

  return value;
};

const normalizeUnmockedModulePathPatterns = (
  options,
  key // _replaceRootDirTags is specifically well-suited for substituting
) =>
  // <rootDir> in paths (it deals with properly interpreting relative path
  // separators, etc).
  //
  // For patterns, direct global substitution is far more ideal, so we
  // special case substitutions for patterns here.
  options[key].map(pattern =>
    (0, _jestRegexUtil().replacePathSepForRegex)(
      pattern.replace(/<rootDir>/g, options.rootDir)
    )
  );

const normalizePreprocessor = options => {
  if (options.scriptPreprocessor && options.transform) {
    throw createConfigError(`  Options: ${_chalk().default.bold(
      'scriptPreprocessor'
    )} and ${_chalk().default.bold('transform')} cannot be used together.
  Please change your configuration to only use ${_chalk().default.bold(
    'transform'
  )}.`);
  }

  if (options.preprocessorIgnorePatterns && options.transformIgnorePatterns) {
    throw createConfigError(`  Options ${_chalk().default.bold(
      'preprocessorIgnorePatterns'
    )} and ${_chalk().default.bold(
      'transformIgnorePatterns'
    )} cannot be used together.
  Please change your configuration to only use ${_chalk().default.bold(
    'transformIgnorePatterns'
  )}.`);
  }

  if (options.scriptPreprocessor) {
    options.transform = {
      '.*': options.scriptPreprocessor
    };
  }

  if (options.preprocessorIgnorePatterns) {
    options.transformIgnorePatterns = options.preprocessorIgnorePatterns;
  }

  delete options.scriptPreprocessor;
  delete options.preprocessorIgnorePatterns;
  return options;
};

const normalizeMissingOptions = (options, configPath, projectIndex) => {
  if (!options.name) {
    options.name = (0, _crypto().createHash)('md5')
      .update(options.rootDir) // In case we load config from some path that has the same root dir
      .update(configPath || '')
      .update(String(projectIndex))
      .digest('hex');
  }

  if (!options.setupFiles) {
    options.setupFiles = [];
  }

  return options;
};

const normalizeRootDir = options => {
  // Assert that there *is* a rootDir
  if (!options.rootDir) {
    throw createConfigError(
      `  Configuration option ${_chalk().default.bold(
        'rootDir'
      )} must be specified.`
    );
  }

  options.rootDir = path().normalize(options.rootDir);

  try {
    // try to resolve windows short paths, ignoring errors (permission errors, mostly)
    options.rootDir = (0, _jestUtil().tryRealpath)(options.rootDir);
  } catch (e) {
    // ignored
  }

  verifyDirectoryExists(options.rootDir, 'rootDir');
  return {...options, rootDir: options.rootDir};
};

const normalizeReporters = options => {
  const reporters = options.reporters;

  if (!reporters || !Array.isArray(reporters)) {
    return options;
  }

  (0, ReporterValidationErrors.validateReporters)(reporters);
  options.reporters = reporters.map(reporterConfig => {
    const normalizedReporterConfig =
      typeof reporterConfig === 'string' // if reporter config is a string, we wrap it in an array
        ? // and pass an empty object for options argument, to normalize
          // the shape.
          [reporterConfig, {}]
        : reporterConfig;
    const reporterPath = (0, utils$3.replaceRootDirInPath)(
      options.rootDir,
      normalizedReporterConfig[0]
    );

    if (reporterPath !== constants$3.DEFAULT_REPORTER_LABEL) {
      const reporter = _jestResolve().default.findNodeModule(reporterPath, {
        basedir: options.rootDir
      });

      if (!reporter) {
        throw new (_jestResolve().default.ModuleNotFoundError)(
          `Could not resolve a module for a custom reporter.\n` +
            `  Module name: ${reporterPath}`
        );
      }

      normalizedReporterConfig[0] = reporter;
    }

    return normalizedReporterConfig;
  });
  return options;
};

const buildTestPathPattern = argv => {
  const patterns = [];

  if (argv._) {
    patterns.push(...argv._);
  }

  if (argv.testPathPattern) {
    patterns.push(...argv.testPathPattern);
  }

  const replacePosixSep = pattern => {
    // yargs coerces positional args into numbers
    const patternAsString = pattern.toString();

    if (path().sep === '/') {
      return patternAsString;
    }

    return patternAsString.replace(/\//g, '\\\\');
  };

  const testPathPattern = patterns.map(replacePosixSep).join('|');

  if ((0, _validatePattern.default)(testPathPattern)) {
    return testPathPattern;
  } else {
    showTestPathPatternError(testPathPattern);
    return '';
  }
};

const showTestPathPatternError = testPathPattern => {
  (0, _jestUtil().clearLine)(process.stdout);
  console.log(
    _chalk().default.red(
      `  Invalid testPattern ${testPathPattern} supplied. ` +
        `Running all tests instead.`
    )
  );
};

function normalize(initialOptions, argv, configPath, projectIndex = Infinity) {
  const {hasDeprecationWarnings} = (0, _jestValidate().validate)(
    initialOptions,
    {
      comment: utils$3.DOCUMENTATION_NOTE,
      deprecatedConfig: _Deprecated.default,
      exampleConfig: _ValidConfig.default,
      recursiveBlacklist: [
        'collectCoverageOnlyFrom', // 'coverageThreshold' allows to use 'global' and glob strings on the same
        // level, there's currently no way we can deal with such config
        'coverageThreshold',
        'globals',
        'moduleNameMapper',
        'testEnvironmentOptions',
        'transform'
      ]
    }
  );
  let options = normalizePreprocessor(
    normalizeReporters(
      normalizeMissingOptions(
        normalizeRootDir((0, _setFromArgv.default)(initialOptions, argv)),
        configPath,
        projectIndex
      )
    )
  );

  if (options.preset) {
    options = setupPreset(options, options.preset);
  }

  if (!options.setupFilesAfterEnv) {
    options.setupFilesAfterEnv = [];
  }

  if (
    options.setupTestFrameworkScriptFile &&
    options.setupFilesAfterEnv.length > 0
  ) {
    throw createConfigError(`  Options: ${_chalk().default.bold(
      'setupTestFrameworkScriptFile'
    )} and ${_chalk().default.bold(
      'setupFilesAfterEnv'
    )} cannot be used together.
  Please change your configuration to only use ${_chalk().default.bold(
    'setupFilesAfterEnv'
  )}.`);
  }

  if (options.setupTestFrameworkScriptFile) {
    options.setupFilesAfterEnv.push(options.setupTestFrameworkScriptFile);
  }

  options.testEnvironment = (0, utils$3.getTestEnvironment)({
    rootDir: options.rootDir,
    testEnvironment:
      options.testEnvironment || _Defaults.default.testEnvironment
  });

  if (!options.roots && options.testPathDirs) {
    options.roots = options.testPathDirs;
    delete options.testPathDirs;
  }

  if (!options.roots) {
    options.roots = [options.rootDir];
  }

  if (!options.testRunner || options.testRunner === 'jasmine2') {
    options.testRunner = require.resolve('jest-jasmine2');
  }

  if (!options.coverageDirectory) {
    options.coverageDirectory = path().resolve(options.rootDir, 'coverage');
  }

  setupBabelJest(options); // TODO: Type this properly

  const newOptions = {..._Defaults.default};

  if (options.resolver) {
    newOptions.resolver = (0, utils$3.resolve)(null, {
      filePath: options.resolver,
      key: 'resolver',
      rootDir: options.rootDir
    });
  }

  const optionKeys = Object.keys(options);
  optionKeys.reduce((newOptions, key) => {
    // The resolver has been resolved separately; skip it
    if (key === 'resolver') {
      return newOptions;
    } // This is cheating, because it claims that all keys of InitialOptions are Required.
    // We only really know it's Required for oldOptions[key], not for oldOptions.someOtherKey,
    // so oldOptions[key] is the only way it should be used.

    const oldOptions = options;
    let value;

    switch (key) {
      case 'collectCoverageOnlyFrom':
        value = normalizeCollectCoverageOnlyFrom(oldOptions, key);
        break;

      case 'setupFiles':
      case 'setupFilesAfterEnv':
      case 'snapshotSerializers':
        {
          const option = oldOptions[key];
          value =
            option &&
            option.map(filePath =>
              (0, utils$3.resolve)(newOptions.resolver, {
                filePath,
                key,
                rootDir: options.rootDir
              })
            );
        }
        break;

      case 'modulePaths':
      case 'roots':
        {
          const option = oldOptions[key];
          value =
            option &&
            option.map(filePath =>
              path().resolve(
                options.rootDir,
                (0, utils$3.replaceRootDirInPath)(options.rootDir, filePath)
              )
            );
        }
        break;

      case 'collectCoverageFrom':
        value = normalizeCollectCoverageFrom(oldOptions, key);
        break;

      case 'cacheDirectory':
      case 'coverageDirectory':
        {
          const option = oldOptions[key];
          value =
            option &&
            path().resolve(
              options.rootDir,
              (0, utils$3.replaceRootDirInPath)(options.rootDir, option)
            );
        }
        break;

      case 'dependencyExtractor':
      case 'globalSetup':
      case 'globalTeardown':
      case 'moduleLoader':
      case 'snapshotResolver':
      case 'testResultsProcessor':
      case 'testRunner':
      case 'filter':
        {
          const option = oldOptions[key];
          value =
            option &&
            (0, utils$3.resolve)(newOptions.resolver, {
              filePath: option,
              key,
              rootDir: options.rootDir
            });
        }
        break;

      case 'runner':
        {
          const option = oldOptions[key];
          value =
            option &&
            (0, utils$3.getRunner)(newOptions.resolver, {
              filePath: option,
              rootDir: options.rootDir
            });
        }
        break;

      case 'prettierPath':
        {
          // We only want this to throw if "prettierPath" is explicitly passed
          // from config or CLI, and the requested path isn't found. Otherwise we
          // set it to null and throw an error lazily when it is used.
          const option = oldOptions[key];
          value =
            option &&
            (0, utils$3.resolve)(newOptions.resolver, {
              filePath: option,
              key,
              optional: option === _Defaults.default[key],
              rootDir: options.rootDir
            });
        }
        break;

      case 'moduleNameMapper':
        const moduleNameMapper = oldOptions[key];
        value =
          moduleNameMapper &&
          Object.keys(moduleNameMapper).map(regex => {
            const item = moduleNameMapper && moduleNameMapper[regex];
            return (
              item && [
                regex,
                (0, utils$3._replaceRootDirTags)(options.rootDir, item)
              ]
            );
          });
        break;

      case 'transform':
        const transform = oldOptions[key];
        value =
          transform &&
          Object.keys(transform).map(regex => {
            const transformElement = transform[regex];
            return [
              regex,
              (0, utils$3.resolve)(newOptions.resolver, {
                filePath: Array.isArray(transformElement)
                  ? transformElement[0]
                  : transformElement,
                key,
                rootDir: options.rootDir
              }),
              Array.isArray(transformElement) ? transformElement[1] : {}
            ];
          });
        break;

      case 'coveragePathIgnorePatterns':
      case 'modulePathIgnorePatterns':
      case 'testPathIgnorePatterns':
      case 'transformIgnorePatterns':
      case 'watchPathIgnorePatterns':
      case 'unmockedModulePathPatterns':
        value = normalizeUnmockedModulePathPatterns(oldOptions, key);
        break;

      case 'haste':
        value = {...oldOptions[key]};

        if (value.hasteImplModulePath != null) {
          const resolvedHasteImpl = (0, utils$3.resolve)(newOptions.resolver, {
            filePath: (0, utils$3.replaceRootDirInPath)(
              options.rootDir,
              value.hasteImplModulePath
            ),
            key: 'haste.hasteImplModulePath',
            rootDir: options.rootDir
          });
          value.hasteImplModulePath = resolvedHasteImpl || undefined;
        }

        break;

      case 'projects':
        value = (oldOptions[key] || [])
          .map(project =>
            typeof project === 'string'
              ? (0, utils$3._replaceRootDirTags)(options.rootDir, project)
              : project
          )
          .reduce((projects, project) => {
            // Project can be specified as globs. If a glob matches any files,
            // We expand it to these paths. If not, we keep the original path
            // for the future resolution.
            const globMatches =
              typeof project === 'string' ? (0, _glob().sync)(project) : [];
            return projects.concat(globMatches.length ? globMatches : project);
          }, []);
        break;

      case 'moduleDirectories':
      case 'testMatch':
        {
          const replacedRootDirTags = (0, utils$3._replaceRootDirTags)(
            (0, utils$3.escapeGlobCharacters)(options.rootDir),
            oldOptions[key]
          );

          if (replacedRootDirTags) {
            value = Array.isArray(replacedRootDirTags)
              ? replacedRootDirTags.map(_jestUtil().replacePathSepForGlob)
              : (0, _jestUtil().replacePathSepForGlob)(replacedRootDirTags);
          } else {
            value = replacedRootDirTags;
          }
        }
        break;

      case 'testRegex':
        {
          const option = oldOptions[key];
          value = option
            ? (Array.isArray(option) ? option : [option]).map(
                _jestRegexUtil().replacePathSepForRegex
              )
            : [];
        }
        break;

      case 'moduleFileExtensions': {
        value = oldOptions[key];

        if (
          Array.isArray(value) && // If it's the wrong type, it can throw at a later time
          (options.runner === undefined ||
            options.runner === _Defaults.default.runner) && // Only require 'js' for the default jest-runner
          !value.includes('js')
        ) {
          const errorMessage =
            `  moduleFileExtensions must include 'js':\n` +
            `  but instead received:\n` +
            `    ${_chalk().default.bold.red(JSON.stringify(value))}`; // If `js` is not included, any dependency Jest itself injects into
          // the environment, like jasmine or sourcemap-support, will need to
          // `require` its modules with a file extension. This is not plausible
          // in the long run, so it's way easier to just fail hard early.
          // We might consider throwing if `json` is missing as well, as it's a
          // fair assumption from modules that they can do
          // `require('some-package/package') without the trailing `.json` as it
          // works in Node normally.

          throw createConfigError(
            errorMessage +
              "\n  Please change your configuration to include 'js'."
          );
        }

        break;
      }

      case 'bail': {
        const bail = oldOptions[key];

        if (typeof bail === 'boolean') {
          value = bail ? 1 : 0;
        } else if (typeof bail === 'string') {
          value = 1; // If Jest is invoked as `jest --bail someTestPattern` then need to
          // move the pattern from the `bail` configuration and into `argv._`
          // to be processed as an extra parameter

          argv._.push(bail);
        } else {
          value = oldOptions[key];
        }

        break;
      }

      case 'displayName': {
        const displayName = oldOptions[key];
        /**
         * Ensuring that displayName shape is correct here so that the
         * reporters can trust the shape of the data
         */

        if (typeof displayName === 'object') {
          const {name, color} = displayName;

          if (
            !name ||
            !color ||
            typeof name !== 'string' ||
            typeof color !== 'string'
          ) {
            const errorMessage =
              `  Option "${_chalk().default.bold(
                'displayName'
              )}" must be of type:\n\n` +
              '  {\n' +
              '    name: string;\n' +
              '    color: string;\n' +
              '  }\n';
            throw createConfigError(errorMessage);
          }

          value = oldOptions[key];
        } else {
          value = {
            color: (0, color.getDisplayNameColor)(options.runner),
            name: displayName
          };
        }

        break;
      }

      case 'testTimeout': {
        if (oldOptions[key] < 0) {
          throw createConfigError(
            `  Option "${_chalk().default.bold(
              'testTimeout'
            )}" must be a natural number.`
          );
        }

        value = oldOptions[key];
        break;
      }

      case 'automock':
      case 'cache':
      case 'changedSince':
      case 'changedFilesWithAncestor':
      case 'clearMocks':
      case 'collectCoverage':
      case 'coverageProvider':
      case 'coverageReporters':
      case 'coverageThreshold':
      case 'detectLeaks':
      case 'detectOpenHandles':
      case 'errorOnDeprecated':
      case 'expand':
      case 'extraGlobals':
      case 'globals':
      case 'findRelatedTests':
      case 'forceCoverageMatch':
      case 'forceExit':
      case 'lastCommit':
      case 'listTests':
      case 'logHeapUsage':
      case 'maxConcurrency':
      case 'mapCoverage':
      case 'name':
      case 'noStackTrace':
      case 'notify':
      case 'notifyMode':
      case 'onlyChanged':
      case 'outputFile':
      case 'passWithNoTests':
      case 'replname':
      case 'reporters':
      case 'resetMocks':
      case 'resetModules':
      case 'restoreMocks':
      case 'rootDir':
      case 'runTestsByPath':
      case 'silent':
      case 'skipFilter':
      case 'skipNodeResolution':
      case 'slowTestThreshold':
      case 'testEnvironment':
      case 'testEnvironmentOptions':
      case 'testFailureExitCode':
      case 'testLocationInResults':
      case 'testNamePattern':
      case 'testURL':
      case 'timers':
      case 'useStderr':
      case 'verbose':
      case 'watch':
      case 'watchAll':
      case 'watchman':
        value = oldOptions[key];
        break;

      case 'watchPlugins':
        value = (oldOptions[key] || []).map(watchPlugin => {
          if (typeof watchPlugin === 'string') {
            return {
              config: {},
              path: (0, utils$3.getWatchPlugin)(newOptions.resolver, {
                filePath: watchPlugin,
                rootDir: options.rootDir
              })
            };
          } else {
            return {
              config: watchPlugin[1] || {},
              path: (0, utils$3.getWatchPlugin)(newOptions.resolver, {
                filePath: watchPlugin[0],
                rootDir: options.rootDir
              })
            };
          }
        });
        break;
    } // @ts-expect-error: automock is missing in GlobalConfig, so what

    newOptions[key] = value;
    return newOptions;
  }, newOptions);
  newOptions.roots.forEach((root, i) => {
    verifyDirectoryExists(root, `roots[${i}]`);
  });

  try {
    // try to resolve windows short paths, ignoring errors (permission errors, mostly)
    newOptions.cwd = (0, _jestUtil().tryRealpath)(process.cwd());
  } catch (e) {
    // ignored
  }

  newOptions.testSequencer = (0, utils$3.getSequencer)(newOptions.resolver, {
    filePath: options.testSequencer || _Defaults.default.testSequencer,
    rootDir: options.rootDir
  });
  newOptions.nonFlagArgs = argv._;
  newOptions.testPathPattern = buildTestPathPattern(argv);
  newOptions.json = !!argv.json;
  newOptions.testFailureExitCode = parseInt(newOptions.testFailureExitCode, 10);

  if (
    newOptions.lastCommit ||
    newOptions.changedFilesWithAncestor ||
    newOptions.changedSince
  ) {
    newOptions.onlyChanged = true;
  }

  if (argv.all) {
    newOptions.onlyChanged = false;
  } else if (newOptions.testPathPattern) {
    // When passing a test path pattern we don't want to only monitor changed
    // files unless `--watch` is also passed.
    newOptions.onlyChanged = newOptions.watch;
  }

  if (!newOptions.onlyChanged) {
    newOptions.onlyChanged = false;
  }

  if (!newOptions.lastCommit) {
    newOptions.lastCommit = false;
  }

  if (!newOptions.onlyFailures) {
    newOptions.onlyFailures = false;
  }

  if (!newOptions.watchAll) {
    newOptions.watchAll = false;
  } // as any since it can happen. We really need to fix the types here

  if (newOptions.moduleNameMapper === _Defaults.default.moduleNameMapper) {
    newOptions.moduleNameMapper = [];
  }

  newOptions.updateSnapshot =
    argv.ci && !argv.updateSnapshot
      ? 'none'
      : argv.updateSnapshot
      ? 'all'
      : 'new';
  newOptions.maxConcurrency = parseInt(newOptions.maxConcurrency, 10);
  newOptions.maxWorkers = (0, _getMaxWorkers.default)(argv, options);

  if (newOptions.testRegex.length && options.testMatch) {
    throw createConfigError(
      `  Configuration options ${_chalk().default.bold('testMatch')} and` +
        ` ${_chalk().default.bold('testRegex')} cannot be used together.`
    );
  }

  if (newOptions.testRegex.length && !options.testMatch) {
    // Prevent the default testMatch conflicting with any explicitly
    // configured `testRegex` value
    newOptions.testMatch = [];
  } // If argv.json is set, coverageReporters shouldn't print a text report.

  if (argv.json) {
    newOptions.coverageReporters = (newOptions.coverageReporters || []).filter(
      reporter => reporter !== 'text'
    );
  } // If collectCoverage is enabled while using --findRelatedTests we need to
  // avoid having false negatives in the generated coverage report.
  // The following: `--findRelatedTests '/rootDir/file1.js' --coverage`
  // Is transformed to: `--findRelatedTests '/rootDir/file1.js' --coverage --collectCoverageFrom 'file1.js'`
  // where arguments to `--collectCoverageFrom` should be globs (or relative
  // paths to the rootDir)

  if (newOptions.collectCoverage && argv.findRelatedTests) {
    let collectCoverageFrom = argv._.map(filename => {
      filename = (0, utils$3.replaceRootDirInPath)(options.rootDir, filename);
      return path().isAbsolute(filename)
        ? path().relative(options.rootDir, filename)
        : filename;
    }); // Don't override existing collectCoverageFrom options

    if (newOptions.collectCoverageFrom) {
      collectCoverageFrom = collectCoverageFrom.reduce((patterns, filename) => {
        if (
          (0, _micromatch().default)(
            [
              (0, _jestUtil().replacePathSepForGlob)(
                path().relative(options.rootDir, filename)
              )
            ],
            newOptions.collectCoverageFrom
          ).length === 0
        ) {
          return patterns;
        }

        return [...patterns, filename];
      }, newOptions.collectCoverageFrom);
    }

    newOptions.collectCoverageFrom = collectCoverageFrom;
  } else if (!newOptions.collectCoverageFrom) {
    newOptions.collectCoverageFrom = [];
  }

  if (!newOptions.findRelatedTests) {
    newOptions.findRelatedTests = false;
  }

  if (!newOptions.projects) {
    newOptions.projects = [];
  }

  if (!newOptions.extraGlobals) {
    newOptions.extraGlobals = [];
  }

  if (!newOptions.forceExit) {
    newOptions.forceExit = false;
  }

  if (!newOptions.logHeapUsage) {
    newOptions.logHeapUsage = false;
  }

  return {
    hasDeprecationWarnings,
    options: newOptions
  };
}
});

var resolveConfigPath = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function fs() {
  const data = _interopRequireWildcard(gracefulFs);

  fs = function () {
    return data;
  };

  return data;
}



function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const isFile = filePath =>
  fs().existsSync(filePath) && !fs().lstatSync(filePath).isDirectory();

const getConfigFilename = ext => constants$3.JEST_CONFIG_BASE_NAME + ext;

var _default = (pathToResolve, cwd) => {
  if (!path().isAbsolute(cwd)) {
    throw new Error(`"cwd" must be an absolute path. cwd: ${cwd}`);
  }

  const absolutePath = path().isAbsolute(pathToResolve)
    ? pathToResolve
    : path().resolve(cwd, pathToResolve);

  if (isFile(absolutePath)) {
    return absolutePath;
  } // This is a guard against passing non existing path as a project/config,
  // that will otherwise result in a very confusing situation.
  // e.g.
  // With a directory structure like this:
  //   my_project/
  //     packcage.json
  //
  // Passing a `my_project/some_directory_that_doesnt_exist` as a project
  // name will resolve into a (possibly empty) `my_project/package.json` and
  // try to run all tests it finds under `my_project` directory.

  if (!fs().existsSync(absolutePath)) {
    throw new Error(
      `Can't find a root directory while resolving a config file path.\n` +
        `Provided path to resolve: ${pathToResolve}\n` +
        `cwd: ${cwd}`
    );
  }

  return resolveConfigPathByTraversing(absolutePath, pathToResolve, cwd);
};

exports.default = _default;

const resolveConfigPathByTraversing = (pathToResolve, initialPath, cwd) => {
  const jestConfig = constants$3.JEST_CONFIG_EXT_ORDER.map(ext =>
    path().resolve(pathToResolve, getConfigFilename(ext))
  ).find(isFile);

  if (jestConfig) {
    return jestConfig;
  }

  const packageJson = path().resolve(pathToResolve, constants$3.PACKAGE_JSON);

  if (isFile(packageJson)) {
    return packageJson;
  } // This is the system root.
  // We tried everything, config is nowhere to be found ¯\_(ツ)_/¯

  if (pathToResolve === path().dirname(pathToResolve)) {
    throw new Error(makeResolutionErrorMessage(initialPath, cwd));
  } // go up a level and try it again

  return resolveConfigPathByTraversing(
    path().dirname(pathToResolve),
    initialPath,
    cwd
  );
};

const makeResolutionErrorMessage = (initialPath, cwd) =>
  'Could not find a config file based on provided values:\n' +
  `path: "${initialPath}"\n` +
  `cwd: "${cwd}"\n` +
  'Config paths must be specified by either a direct path to a config\n' +
  'file, or a path to a directory. If directory is given, Jest will try to\n' +
  `traverse directory tree up, until it finds one of those files in exact order: ${constants$3.JEST_CONFIG_EXT_ORDER.map(
    ext => `"${getConfigFilename(ext)}"`
  ).join(' or ')}.`;
});

var jsonlint_1 = createCommonjsModule(function (module, exports) {

// From: https://github.com/zaach/jsonlint
// Vendored in Jest to avoid jsonlint's transitive dependencies.

/* eslint-disable */
var jsonlint = (function () {
  var parser = {
    trace: function trace() {},
    yy: {},
    symbols_: {
      error: 2,
      JSONString: 3,
      STRING: 4,
      JSONNumber: 5,
      NUMBER: 6,
      JSONNullLiteral: 7,
      NULL: 8,
      JSONBooleanLiteral: 9,
      TRUE: 10,
      FALSE: 11,
      JSONText: 12,
      JSONValue: 13,
      EOF: 14,
      JSONObject: 15,
      JSONArray: 16,
      '{': 17,
      '}': 18,
      JSONMemberList: 19,
      JSONMember: 20,
      ':': 21,
      ',': 22,
      '[': 23,
      ']': 24,
      JSONElementList: 25,
      $accept: 0,
      $end: 1
    },
    terminals_: {
      2: 'error',
      4: 'STRING',
      6: 'NUMBER',
      8: 'NULL',
      10: 'TRUE',
      11: 'FALSE',
      14: 'EOF',
      17: '{',
      18: '}',
      21: ':',
      22: ',',
      23: '[',
      24: ']'
    },
    productions_: [
      0,
      [3, 1],
      [5, 1],
      [7, 1],
      [9, 1],
      [9, 1],
      [12, 2],
      [13, 1],
      [13, 1],
      [13, 1],
      [13, 1],
      [13, 1],
      [13, 1],
      [15, 2],
      [15, 3],
      [20, 3],
      [19, 1],
      [19, 3],
      [16, 2],
      [16, 3],
      [25, 1],
      [25, 3]
    ],
    performAction: function anonymous(
      yytext,
      yyleng,
      yylineno,
      yy,
      yystate,
      $$,
      _$
    ) {
      var $0 = $$.length - 1;

      switch (yystate) {
        case 1:
          // replace escaped characters with actual character
          this.$ = yytext
            .replace(/\\(\\|")/g, '$' + '1')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\v/g, '\v')
            .replace(/\\f/g, '\f')
            .replace(/\\b/g, '\b');
          break;

        case 2:
          this.$ = Number(yytext);
          break;

        case 3:
          this.$ = null;
          break;

        case 4:
          this.$ = true;
          break;

        case 5:
          this.$ = false;
          break;

        case 6:
          return (this.$ = $$[$0 - 1]);

        case 13:
          this.$ = {};
          break;

        case 14:
          this.$ = $$[$0 - 1];
          break;

        case 15:
          this.$ = [$$[$0 - 2], $$[$0]];
          break;

        case 16:
          this.$ = {};
          this.$[$$[$0][0]] = $$[$0][1];
          break;

        case 17:
          this.$ = $$[$0 - 2];
          $$[$0 - 2][$$[$0][0]] = $$[$0][1];
          break;

        case 18:
          this.$ = [];
          break;

        case 19:
          this.$ = $$[$0 - 1];
          break;

        case 20:
          this.$ = [$$[$0]];
          break;

        case 21:
          this.$ = $$[$0 - 2];
          $$[$0 - 2].push($$[$0]);
          break;
      }
    },
    table: [
      {
        3: 5,
        4: [1, 12],
        5: 6,
        6: [1, 13],
        7: 3,
        8: [1, 9],
        9: 4,
        10: [1, 10],
        11: [1, 11],
        12: 1,
        13: 2,
        15: 7,
        16: 8,
        17: [1, 14],
        23: [1, 15]
      },
      {
        1: [3]
      },
      {
        14: [1, 16]
      },
      {
        14: [2, 7],
        18: [2, 7],
        22: [2, 7],
        24: [2, 7]
      },
      {
        14: [2, 8],
        18: [2, 8],
        22: [2, 8],
        24: [2, 8]
      },
      {
        14: [2, 9],
        18: [2, 9],
        22: [2, 9],
        24: [2, 9]
      },
      {
        14: [2, 10],
        18: [2, 10],
        22: [2, 10],
        24: [2, 10]
      },
      {
        14: [2, 11],
        18: [2, 11],
        22: [2, 11],
        24: [2, 11]
      },
      {
        14: [2, 12],
        18: [2, 12],
        22: [2, 12],
        24: [2, 12]
      },
      {
        14: [2, 3],
        18: [2, 3],
        22: [2, 3],
        24: [2, 3]
      },
      {
        14: [2, 4],
        18: [2, 4],
        22: [2, 4],
        24: [2, 4]
      },
      {
        14: [2, 5],
        18: [2, 5],
        22: [2, 5],
        24: [2, 5]
      },
      {
        14: [2, 1],
        18: [2, 1],
        21: [2, 1],
        22: [2, 1],
        24: [2, 1]
      },
      {
        14: [2, 2],
        18: [2, 2],
        22: [2, 2],
        24: [2, 2]
      },
      {
        3: 20,
        4: [1, 12],
        18: [1, 17],
        19: 18,
        20: 19
      },
      {
        3: 5,
        4: [1, 12],
        5: 6,
        6: [1, 13],
        7: 3,
        8: [1, 9],
        9: 4,
        10: [1, 10],
        11: [1, 11],
        13: 23,
        15: 7,
        16: 8,
        17: [1, 14],
        23: [1, 15],
        24: [1, 21],
        25: 22
      },
      {
        1: [2, 6]
      },
      {
        14: [2, 13],
        18: [2, 13],
        22: [2, 13],
        24: [2, 13]
      },
      {
        18: [1, 24],
        22: [1, 25]
      },
      {
        18: [2, 16],
        22: [2, 16]
      },
      {
        21: [1, 26]
      },
      {
        14: [2, 18],
        18: [2, 18],
        22: [2, 18],
        24: [2, 18]
      },
      {
        22: [1, 28],
        24: [1, 27]
      },
      {
        22: [2, 20],
        24: [2, 20]
      },
      {
        14: [2, 14],
        18: [2, 14],
        22: [2, 14],
        24: [2, 14]
      },
      {
        3: 20,
        4: [1, 12],
        20: 29
      },
      {
        3: 5,
        4: [1, 12],
        5: 6,
        6: [1, 13],
        7: 3,
        8: [1, 9],
        9: 4,
        10: [1, 10],
        11: [1, 11],
        13: 30,
        15: 7,
        16: 8,
        17: [1, 14],
        23: [1, 15]
      },
      {
        14: [2, 19],
        18: [2, 19],
        22: [2, 19],
        24: [2, 19]
      },
      {
        3: 5,
        4: [1, 12],
        5: 6,
        6: [1, 13],
        7: 3,
        8: [1, 9],
        9: 4,
        10: [1, 10],
        11: [1, 11],
        13: 31,
        15: 7,
        16: 8,
        17: [1, 14],
        23: [1, 15]
      },
      {
        18: [2, 17],
        22: [2, 17]
      },
      {
        18: [2, 15],
        22: [2, 15]
      },
      {
        22: [2, 21],
        24: [2, 21]
      }
    ],
    defaultActions: {
      16: [2, 6]
    },
    parseError: function parseError(str, hash) {
      throw new Error(str);
    },
    parse: function parse(input) {
      var self = this,
        stack = [0],
        vstack = [null],
        // semantic value stack
        lstack = [],
        // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1; //this.reductionCount = this.shiftCount = 0;

      this.lexer.setInput(input);
      this.lexer.yy = this.yy;
      this.yy.lexer = this.lexer;
      if (typeof this.lexer.yylloc == 'undefined') this.lexer.yylloc = {};
      var yyloc = this.lexer.yylloc;
      lstack.push(yyloc);
      if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

      function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
      }

      function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert

        if (typeof token !== 'number') {
          token = self.symbols_[token] || token;
        }

        return token;
      }

      var symbol,
        preErrorSymbol,
        state,
        action,
        r,
        yyval = {},
        p,
        len,
        newState,
        expected;

      while (true) {
        // retrieve state number from top of stack
        state = stack[stack.length - 1]; // use default actions if available

        if (this.defaultActions[state]) {
          action = this.defaultActions[state];
        } else {
          if (symbol == null) symbol = lex(); // read action for current state and first input

          action = table[state] && table[state][symbol];
        } // handle parse error

         if (
          typeof action === 'undefined' ||
          !action.length ||
          !action[0]
        ) {
          if (!recovering) {
            // Report error
            expected = [];

            for (p in table[state])
              if (this.terminals_[p] && p > 2) {
                expected.push("'" + this.terminals_[p] + "'");
              }

            var errStr = '';

            if (this.lexer.showPosition) {
              errStr =
                'Parse error on line ' +
                (yylineno + 1) +
                ':\n' +
                this.lexer.showPosition() +
                '\nExpecting ' +
                expected.join(', ') +
                ", got '" +
                this.terminals_[symbol] +
                "'";
            } else {
              errStr =
                'Parse error on line ' +
                (yylineno + 1) +
                ': Unexpected ' +
                (symbol == 1
                  ? /*EOF*/
                    'end of input'
                  : "'" + (this.terminals_[symbol] || symbol) + "'");
            }

            this.parseError(errStr, {
              text: this.lexer.match,
              token: this.terminals_[symbol] || symbol,
              line: this.lexer.yylineno,
              loc: yyloc,
              expected: expected
            });
          } // just recovered from another error

          if (recovering == 3) {
            if (symbol == EOF) {
              throw new Error(errStr || 'Parsing halted.');
            } // discard current lookahead and grab another

            yyleng = this.lexer.yyleng;
            yytext = this.lexer.yytext;
            yylineno = this.lexer.yylineno;
            yyloc = this.lexer.yylloc;
            symbol = lex();
          } // try to recover from error

          while (1) {
            // check for error recovery rule in this state
            if (TERROR.toString() in table[state]) {
              break;
            }

            if (state == 0) {
              throw new Error(errStr || 'Parsing halted.');
            }

            popStack(1);
            state = stack[stack.length - 1];
          }

          preErrorSymbol = symbol; // save the lookahead token

          symbol = TERROR; // insert generic error symbol as new lookahead

          state = stack[stack.length - 1];
          action = table[state] && table[state][TERROR];
          recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        } // this shouldn't happen, unless resolve defaults are off

        if (action[0] instanceof Array && action.length > 1) {
          throw new Error(
            'Parse Error: multiple actions possible at state: ' +
              state +
              ', token: ' +
              symbol
          );
        }

        switch (action[0]) {
          case 1:
            // shift
            //this.shiftCount++;
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]); // push state

            symbol = null;

            if (!preErrorSymbol) {
              // normal execution/no error
              yyleng = this.lexer.yyleng;
              yytext = this.lexer.yytext;
              yylineno = this.lexer.yylineno;
              yyloc = this.lexer.yylloc;
              if (recovering > 0) recovering--;
            } else {
              // error just occurred, resume old lookahead f/ before error
              symbol = preErrorSymbol;
              preErrorSymbol = null;
            }

            break;

          case 2:
            // reduce
            //this.reductionCount++;
            len = this.productions_[action[1]][1]; // perform semantic action

            yyval.$ = vstack[vstack.length - len]; // default to $$ = $1
            // default location, uses first token for firsts, last for lasts

            yyval._$ = {
              first_line: lstack[lstack.length - (len || 1)].first_line,
              last_line: lstack[lstack.length - 1].last_line,
              first_column: lstack[lstack.length - (len || 1)].first_column,
              last_column: lstack[lstack.length - 1].last_column
            };
            r = this.performAction.call(
              yyval,
              yytext,
              yyleng,
              yylineno,
              this.yy,
              action[1],
              vstack,
              lstack
            );

            if (typeof r !== 'undefined') {
              return r;
            } // pop off stack

            if (len) {
              stack = stack.slice(0, -1 * len * 2);
              vstack = vstack.slice(0, -1 * len);
              lstack = lstack.slice(0, -1 * len);
            }

            stack.push(this.productions_[action[1]][0]); // push nonterminal (reduce)

            vstack.push(yyval.$);
            lstack.push(yyval._$); // goto new state = table[STATE][NONTERMINAL]

            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;

          case 3:
            // accept
            return true;
        }
      }

      return true;
    }
  };
  /* Jison generated lexer */

  var lexer = (function () {
    var lexer = {
      EOF: 1,
      parseError: function parseError(str, hash) {
        if (this.yy.parseError) {
          this.yy.parseError(str, hash);
        } else {
          throw new Error(str);
        }
      },
      setInput: function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
          first_line: 1,
          first_column: 0,
          last_line: 1,
          last_column: 0
        };
        return this;
      },
      input: function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
      },
      unput: function (ch) {
        this._input = ch + this._input;
        return this;
      },
      more: function () {
        this._more = true;
        return this;
      },
      less: function (n) {
        this._input = this.match.slice(n) + this._input;
      },
      pastInput: function () {
        var past = this.matched.substr(
          0,
          this.matched.length - this.match.length
        );
        return (
          (past.length > 20 ? '...' : '') + past.substr(-20).replace(/\n/g, '')
        );
      },
      upcomingInput: function () {
        var next = this.match;

        if (next.length < 20) {
          next += this._input.substr(0, 20 - next.length);
        }

        return (next.substr(0, 20) + (next.length > 20 ? '...' : '')).replace(
          /\n/g,
          ''
        );
      },
      showPosition: function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join('-');
        return pre + this.upcomingInput() + '\n' + c + '^';
      },
      next: function () {
        if (this.done) {
          return this.EOF;
        }

        if (!this._input) this.done = true;
        var token, match, tempMatch, index, lines;

        if (!this._more) {
          this.yytext = '';
          this.match = '';
        }

        var rules = this._currentRules();

        for (var i = 0; i < rules.length; i++) {
          tempMatch = this._input.match(this.rules[rules[i]]);

          if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
            match = tempMatch;
            index = i;
            if (!this.options.flex) break;
          }
        }

        if (match) {
          lines = match[0].match(/\n.*/g);
          if (lines) this.yylineno += lines.length;
          this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines
              ? lines[lines.length - 1].length - 1
              : this.yylloc.last_column + match[0].length
          };
          this.yytext += match[0];
          this.match += match[0];
          this.yyleng = this.yytext.length;
          this._more = false;
          this._input = this._input.slice(match[0].length);
          this.matched += match[0];
          token = this.performAction.call(
            this,
            this.yy,
            this,
            rules[index],
            this.conditionStack[this.conditionStack.length - 1]
          );
          if (this.done && this._input) this.done = false;
          if (token) return token;
          else return;
        }

        if (this._input === '') {
          return this.EOF;
        } else {
          this.parseError(
            'Lexical error on line ' +
              (this.yylineno + 1) +
              '. Unrecognized text.\n' +
              this.showPosition(),
            {
              text: '',
              token: null,
              line: this.yylineno
            }
          );
        }
      },
      lex: function lex() {
        var r = this.next();

        if (typeof r !== 'undefined') {
          return r;
        } else {
          return this.lex();
        }
      },
      begin: function begin(condition) {
        this.conditionStack.push(condition);
      },
      popState: function popState() {
        return this.conditionStack.pop();
      },
      _currentRules: function _currentRules() {
        return this.conditions[
          this.conditionStack[this.conditionStack.length - 1]
        ].rules;
      },
      topState: function () {
        return this.conditionStack[this.conditionStack.length - 2];
      },
      pushState: function begin(condition) {
        this.begin(condition);
      }
    };
    lexer.options = {};

    lexer.performAction = function anonymous(
      yy,
      yy_,
      $avoiding_name_collisions,
      YY_START
    ) {

      switch ($avoiding_name_collisions) {
        case 0:
          /* skip whitespace */
          break;

        case 1:
          return 6;

        case 2:
          yy_.yytext = yy_.yytext.substr(1, yy_.yyleng - 2);
          return 4;

        case 3:
          return 17;

        case 4:
          return 18;

        case 5:
          return 23;

        case 6:
          return 24;

        case 7:
          return 22;

        case 8:
          return 21;

        case 9:
          return 10;

        case 10:
          return 11;

        case 11:
          return 8;

        case 12:
          return 14;

        case 13:
          return 'INVALID';
      }
    };

    lexer.rules = [
      /^(?:\s+)/,
      /^(?:(-?([0-9]|[1-9][0-9]+))(\.[0-9]+)?([eE][-+]?[0-9]+)?\b)/,
      /^(?:"(?:\\[\\"bfnrt/]|\\u[a-fA-F0-9]{4}|[^\\\0-\x09\x0a-\x1f"])*")/,
      /^(?:\{)/,
      /^(?:\})/,
      /^(?:\[)/,
      /^(?:\])/,
      /^(?:,)/,
      /^(?::)/,
      /^(?:true\b)/,
      /^(?:false\b)/,
      /^(?:null\b)/,
      /^(?:$)/,
      /^(?:.)/
    ];
    lexer.conditions = {
      INITIAL: {
        rules: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        inclusive: true
      }
    };
    return lexer;
  })();

  parser.lexer = lexer;
  return parser;
})();

exports.parser = jsonlint;

exports.errors = function (input) {
  try {
    this.parse(input);
  } catch (e) {
    return e.stack;
  }
};

exports.parse = function () {
  return jsonlint.parse.apply(jsonlint, arguments);
};

exports.main = function commonjsMain(args) {
  if (!args[1]) throw new Error('Usage: ' + args[0] + ' FILE');

  if (typeof process !== 'undefined') {
    var source = fs$1.readFileSync(
      path$3.join(process.cwd(), args[1]),
      'utf8'
    );
  } else {
    var cwd = file.path(file.cwd());

    var source = cwd.join(args[1]).read({
      charset: 'utf-8'
    });
  }

  return exports.parser.parse(source);
};
});

var readConfigFileAndSetRootDir_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = readConfigFileAndSetRootDir;

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function _url() {
  const data = url$1;

  _url = function () {
    return data;
  };

  return data;
}

function fs() {
  const data = _interopRequireWildcard(gracefulFs);

  fs = function () {
    return data;
  };

  return data;
}

var _jsonlint = _interopRequireDefault(jsonlint_1);



function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @ts-expect-error: vendored
// Read the configuration and set its `rootDir`
// 1. If it's a `package.json` file, we look into its "jest" property
// 2. For any other file, we just require it. If we receive an 'ERR_REQUIRE_ESM'
//    from node, perform a dynamic import instead.
async function readConfigFileAndSetRootDir(configPath) {
  const isJSON = configPath.endsWith(constants$3.JEST_CONFIG_EXT_JSON);
  let configObject;

  try {
    configObject = commonjsRequire(configPath);
  } catch (error) {
    if (error.code === 'ERR_REQUIRE_ESM') {
      try {
        const configUrl = (0, _url().pathToFileURL)(configPath); // node `import()` supports URL, but TypeScript doesn't know that

        const importedConfig = await import(configUrl.href);

        if (!importedConfig.default) {
          throw new Error(
            `Jest: Failed to load mjs config file ${configPath} - did you use a default export?`
          );
        }

        configObject = importedConfig.default;
      } catch (innerError) {
        if (innerError.message === 'Not supported') {
          throw new Error(
            `Jest: Your version of Node does not support dynamic import - please enable it or use a .cjs file extension for file ${configPath}`
          );
        }

        throw innerError;
      }
    } else if (isJSON) {
      throw new Error(
        `Jest: Failed to parse config file ${configPath}\n` +
          `  ${_jsonlint.default.errors(fs().readFileSync(configPath, 'utf8'))}`
      );
    } else {
      throw error;
    }
  }

  if (configPath.endsWith(constants$3.PACKAGE_JSON)) {
    // Event if there's no "jest" property in package.json we will still use
    // an empty object.
    configObject = configObject.jest || {};
  }

  if (configObject.rootDir) {
    // We don't touch it if it has an absolute path specified
    if (!path().isAbsolute(configObject.rootDir)) {
      // otherwise, we'll resolve it relative to the file's __dirname
      configObject.rootDir = path().resolve(
        path().dirname(configPath),
        configObject.rootDir
      );
    }
  } else {
    // If rootDir is not there, we'll set it to this file's __dirname
    configObject.rootDir = path().dirname(configPath);
  }

  return configObject;
}
});

var Descriptions = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const descriptions = {
  automock: 'All imported modules in your tests should be mocked automatically',
  bail: 'Stop running tests after `n` failures',
  cacheDirectory:
    'The directory where Jest should store its cached dependency information',
  clearMocks: 'Automatically clear mock calls and instances between every test',
  collectCoverage:
    'Indicates whether the coverage information should be collected while executing the test',
  collectCoverageFrom:
    'An array of glob patterns indicating a set of files for which coverage information should be collected',
  coverageDirectory:
    'The directory where Jest should output its coverage files',
  coveragePathIgnorePatterns:
    'An array of regexp pattern strings used to skip coverage collection',
  coverageProvider:
    'Indicates which provider should be used to instrument code for coverage',
  coverageReporters:
    'A list of reporter names that Jest uses when writing coverage reports',
  coverageThreshold:
    'An object that configures minimum threshold enforcement for coverage results',
  dependencyExtractor: 'A path to a custom dependency extractor',
  errorOnDeprecated:
    'Make calling deprecated APIs throw helpful error messages',
  forceCoverageMatch:
    'Force coverage collection from ignored files using an array of glob patterns',
  globalSetup:
    'A path to a module which exports an async function that is triggered once before all test suites',
  globalTeardown:
    'A path to a module which exports an async function that is triggered once after all test suites',
  globals:
    'A set of global variables that need to be available in all test environments',
  maxWorkers:
    'The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.',
  moduleDirectories:
    "An array of directory names to be searched recursively up from the requiring module's location",
  moduleFileExtensions: 'An array of file extensions your modules use',
  moduleNameMapper:
    'A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module',
  modulePathIgnorePatterns:
    "An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader",
  notify: 'Activates notifications for test results',
  notifyMode:
    'An enum that specifies notification mode. Requires { notify: true }',
  preset: "A preset that is used as a base for Jest's configuration",
  projects: 'Run tests from one or more projects',
  reporters: 'Use this configuration option to add custom reporters to Jest',
  resetMocks: 'Automatically reset mock state between every test',
  resetModules: 'Reset the module registry before running each individual test',
  resolver: 'A path to a custom resolver',
  restoreMocks: 'Automatically restore mock state between every test',
  rootDir:
    'The root directory that Jest should scan for tests and modules within',
  roots:
    'A list of paths to directories that Jest should use to search for files in',
  runner:
    "Allows you to use a custom runner instead of Jest's default test runner",
  setupFiles:
    'The paths to modules that run some code to configure or set up the testing environment before each test',
  setupFilesAfterEnv:
    'A list of paths to modules that run some code to configure or set up the testing framework before each test',
  slowTestThreshold:
    'The number of seconds after which a test is considered as slow and reported as such in the results.',
  snapshotSerializers:
    'A list of paths to snapshot serializer modules Jest should use for snapshot testing',
  testEnvironment: 'The test environment that will be used for testing',
  testEnvironmentOptions: 'Options that will be passed to the testEnvironment',
  testLocationInResults: 'Adds a location field to test results',
  testMatch: 'The glob patterns Jest uses to detect test files',
  testPathIgnorePatterns:
    'An array of regexp pattern strings that are matched against all test paths, matched tests are skipped',
  testRegex:
    'The regexp pattern or array of patterns that Jest uses to detect test files',
  testResultsProcessor:
    'This option allows the use of a custom results processor',
  testRunner: 'This option allows use of a custom test runner',
  testURL:
    'This option sets the URL for the jsdom environment. It is reflected in properties such as location.href',
  timers:
    'Setting this value to "fake" allows the use of fake timers for functions such as "setTimeout"',
  transform: 'A map from regular expressions to paths to transformers',
  transformIgnorePatterns:
    'An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation',
  unmockedModulePathPatterns:
    'An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them',
  verbose:
    'Indicates whether each individual test should be reported during the run',
  watchPathIgnorePatterns:
    'An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode',
  watchman: 'Whether to use watchman for file crawling'
};
var _default = descriptions;
exports.default = _default;
});

var build$6 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.readConfig = readConfig;
exports.readConfigs = readConfigs;
Object.defineProperty(exports, 'getTestEnvironment', {
  enumerable: true,
  get: function () {
    return utils$3.getTestEnvironment;
  }
});
Object.defineProperty(exports, 'isJSONString', {
  enumerable: true,
  get: function () {
    return utils$3.isJSONString;
  }
});
Object.defineProperty(exports, 'replaceRootDirInPath', {
  enumerable: true,
  get: function () {
    return utils$3.replaceRootDirInPath;
  }
});
Object.defineProperty(exports, 'normalize', {
  enumerable: true,
  get: function () {
    return _normalize.default;
  }
});
Object.defineProperty(exports, 'deprecationEntries', {
  enumerable: true,
  get: function () {
    return _Deprecated.default;
  }
});
Object.defineProperty(exports, 'defaults', {
  enumerable: true,
  get: function () {
    return _Defaults.default;
  }
});
Object.defineProperty(exports, 'descriptions', {
  enumerable: true,
  get: function () {
    return _Descriptions.default;
  }
});
exports.constants = void 0;

function path() {
  const data = _interopRequireWildcard(path$3);

  path = function () {
    return data;
  };

  return data;
}

function fs() {
  const data = _interopRequireWildcard(gracefulFs);

  fs = function () {
    return data;
  };

  return data;
}

function _jestUtil() {
  const data = build;

  _jestUtil = function () {
    return data;
  };

  return data;
}

function _chalk() {
  const data = _interopRequireDefault(source);

  _chalk = function () {
    return data;
  };

  return data;
}



var _normalize = _interopRequireDefault(normalize_1$1);

var _resolveConfigPath = _interopRequireDefault(resolveConfigPath);

var _readConfigFileAndSetRootDir = _interopRequireDefault(
  readConfigFileAndSetRootDir_1
);

var _Deprecated = _interopRequireDefault(Deprecated);

var _Defaults = _interopRequireDefault(Defaults);

var _Descriptions = _interopRequireDefault(Descriptions);

var constants = _interopRequireWildcard(constants$3);

exports.constants = constants;

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _getRequireWildcardCache() {
  if (typeof WeakMap !== 'function') return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function () {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {default: obj};
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
async function readConfig(
  argv,
  packageRootOrConfig, // Whether it needs to look into `--config` arg passed to CLI.
  // It only used to read initial config. If the initial config contains
  // `project` property, we don't want to read `--config` value and rather
  // read individual configs for every project.
  skipArgvConfigOption,
  parentConfigPath,
  projectIndex = Infinity
) {
  let rawOptions;
  let configPath = null;

  if (typeof packageRootOrConfig !== 'string') {
    if (parentConfigPath) {
      const parentConfigDirname = path().dirname(parentConfigPath);
      rawOptions = packageRootOrConfig;
      rawOptions.rootDir = rawOptions.rootDir
        ? (0, utils$3.replaceRootDirInPath)(
            parentConfigDirname,
            rawOptions.rootDir
          )
        : parentConfigDirname;
    } else {
      throw new Error(
        'Jest: Cannot use configuration as an object without a file path.'
      );
    }
  } else if ((0, utils$3.isJSONString)(argv.config)) {
    // A JSON string was passed to `--config` argument and we can parse it
    // and use as is.
    let config;

    try {
      config = JSON.parse(argv.config);
    } catch (e) {
      throw new Error(
        'There was an error while parsing the `--config` argument as a JSON string.'
      );
    } // NOTE: we might need to resolve this dir to an absolute path in the future

    config.rootDir = config.rootDir || packageRootOrConfig;
    rawOptions = config; // A string passed to `--config`, which is either a direct path to the config
    // or a path to directory containing `package.json` or `jest.config.js`
  } else if (!skipArgvConfigOption && typeof argv.config == 'string') {
    configPath = (0, _resolveConfigPath.default)(argv.config, process.cwd());
    rawOptions = await (0, _readConfigFileAndSetRootDir.default)(configPath);
  } else {
    // Otherwise just try to find config in the current rootDir.
    configPath = (0, _resolveConfigPath.default)(
      packageRootOrConfig,
      process.cwd()
    );
    rawOptions = await (0, _readConfigFileAndSetRootDir.default)(configPath);
  }

  if (typeof rawOptions === 'function') {
    rawOptions = await rawOptions();
  }

  const {options, hasDeprecationWarnings} = (0, _normalize.default)(
    rawOptions,
    argv,
    configPath,
    projectIndex
  );
  const {globalConfig, projectConfig} = groupOptions(options);
  return {
    configPath,
    globalConfig,
    hasDeprecationWarnings,
    projectConfig
  };
}

const groupOptions = options => ({
  globalConfig: Object.freeze({
    bail: options.bail,
    changedFilesWithAncestor: options.changedFilesWithAncestor,
    changedSince: options.changedSince,
    collectCoverage: options.collectCoverage,
    collectCoverageFrom: options.collectCoverageFrom,
    collectCoverageOnlyFrom: options.collectCoverageOnlyFrom,
    coverageDirectory: options.coverageDirectory,
    coverageProvider: options.coverageProvider,
    coverageReporters: options.coverageReporters,
    coverageThreshold: options.coverageThreshold,
    detectLeaks: options.detectLeaks,
    detectOpenHandles: options.detectOpenHandles,
    enabledTestsMap: options.enabledTestsMap,
    errorOnDeprecated: options.errorOnDeprecated,
    expand: options.expand,
    filter: options.filter,
    findRelatedTests: options.findRelatedTests,
    forceExit: options.forceExit,
    globalSetup: options.globalSetup,
    globalTeardown: options.globalTeardown,
    json: options.json,
    lastCommit: options.lastCommit,
    listTests: options.listTests,
    logHeapUsage: options.logHeapUsage,
    maxConcurrency: options.maxConcurrency,
    maxWorkers: options.maxWorkers,
    noSCM: undefined,
    noStackTrace: options.noStackTrace,
    nonFlagArgs: options.nonFlagArgs,
    notify: options.notify,
    notifyMode: options.notifyMode,
    onlyChanged: options.onlyChanged,
    onlyFailures: options.onlyFailures,
    outputFile: options.outputFile,
    passWithNoTests: options.passWithNoTests,
    projects: options.projects,
    replname: options.replname,
    reporters: options.reporters,
    rootDir: options.rootDir,
    runTestsByPath: options.runTestsByPath,
    silent: options.silent,
    skipFilter: options.skipFilter,
    testFailureExitCode: options.testFailureExitCode,
    testNamePattern: options.testNamePattern,
    testPathPattern: options.testPathPattern,
    testResultsProcessor: options.testResultsProcessor,
    testSequencer: options.testSequencer,
    testTimeout: options.testTimeout,
    updateSnapshot: options.updateSnapshot,
    useStderr: options.useStderr,
    verbose: options.verbose,
    watch: options.watch,
    watchAll: options.watchAll,
    watchPlugins: options.watchPlugins,
    watchman: options.watchman
  }),
  projectConfig: Object.freeze({
    automock: options.automock,
    cache: options.cache,
    cacheDirectory: options.cacheDirectory,
    clearMocks: options.clearMocks,
    coveragePathIgnorePatterns: options.coveragePathIgnorePatterns,
    cwd: options.cwd,
    dependencyExtractor: options.dependencyExtractor,
    detectLeaks: options.detectLeaks,
    detectOpenHandles: options.detectOpenHandles,
    displayName: options.displayName,
    errorOnDeprecated: options.errorOnDeprecated,
    extraGlobals: options.extraGlobals,
    filter: options.filter,
    forceCoverageMatch: options.forceCoverageMatch,
    globalSetup: options.globalSetup,
    globalTeardown: options.globalTeardown,
    globals: options.globals,
    haste: options.haste,
    moduleDirectories: options.moduleDirectories,
    moduleFileExtensions: options.moduleFileExtensions,
    moduleLoader: options.moduleLoader,
    moduleNameMapper: options.moduleNameMapper,
    modulePathIgnorePatterns: options.modulePathIgnorePatterns,
    modulePaths: options.modulePaths,
    name: options.name,
    prettierPath: options.prettierPath,
    resetMocks: options.resetMocks,
    resetModules: options.resetModules,
    resolver: options.resolver,
    restoreMocks: options.restoreMocks,
    rootDir: options.rootDir,
    roots: options.roots,
    runner: options.runner,
    setupFiles: options.setupFiles,
    setupFilesAfterEnv: options.setupFilesAfterEnv,
    skipFilter: options.skipFilter,
    skipNodeResolution: options.skipNodeResolution,
    slowTestThreshold: options.slowTestThreshold,
    snapshotResolver: options.snapshotResolver,
    snapshotSerializers: options.snapshotSerializers,
    testEnvironment: options.testEnvironment,
    testEnvironmentOptions: options.testEnvironmentOptions,
    testLocationInResults: options.testLocationInResults,
    testMatch: options.testMatch,
    testPathIgnorePatterns: options.testPathIgnorePatterns,
    testRegex: options.testRegex,
    testRunner: options.testRunner,
    testURL: options.testURL,
    timers: options.timers,
    transform: options.transform,
    transformIgnorePatterns: options.transformIgnorePatterns,
    unmockedModulePathPatterns: options.unmockedModulePathPatterns,
    watchPathIgnorePatterns: options.watchPathIgnorePatterns
  })
});

const ensureNoDuplicateConfigs = (parsedConfigs, projects) => {
  if (projects.length <= 1) {
    return;
  }

  const configPathMap = new Map();

  for (const config of parsedConfigs) {
    const {configPath} = config;

    if (configPathMap.has(configPath)) {
      const message = `Whoops! Two projects resolved to the same config path: ${_chalk().default.bold(
        String(configPath)
      )}:

  Project 1: ${_chalk().default.bold(
    projects[parsedConfigs.findIndex(x => x === config)]
  )}
  Project 2: ${_chalk().default.bold(
    projects[parsedConfigs.findIndex(x => x === configPathMap.get(configPath))]
  )}

This usually means that your ${_chalk().default.bold(
        '"projects"'
      )} config includes a directory that doesn't have any configuration recognizable by Jest. Please fix it.
`;
      throw new Error(message);
    }

    if (configPath !== null) {
      configPathMap.set(configPath, config);
    }
  }
}; // Possible scenarios:
//  1. jest --config config.json
//  2. jest --projects p1 p2
//  3. jest --projects p1 p2 --config config.json
//  4. jest --projects p1
//  5. jest
//
// If no projects are specified, process.cwd() will be used as the default
// (and only) project.

async function readConfigs(argv, projectPaths) {
  let globalConfig;
  let hasDeprecationWarnings;
  let configs = [];
  let projects = projectPaths;
  let configPath;

  if (projectPaths.length === 1) {
    const parsedConfig = await readConfig(argv, projects[0]);
    configPath = parsedConfig.configPath;
    hasDeprecationWarnings = parsedConfig.hasDeprecationWarnings;
    globalConfig = parsedConfig.globalConfig;
    configs = [parsedConfig.projectConfig];

    if (globalConfig.projects && globalConfig.projects.length) {
      // Even though we had one project in CLI args, there might be more
      // projects defined in the config.
      // In other words, if this was a single project,
      // and its config has `projects` settings, use that value instead.
      projects = globalConfig.projects;
    }
  }

  if (projects.length > 0) {
    const projectIsCwd =
      process.platform === 'win32'
        ? projects[0] === (0, _jestUtil().tryRealpath)(process.cwd())
        : projects[0] === process.cwd();
    const parsedConfigs = await Promise.all(
      projects
        .filter(root => {
          // Ignore globbed files that cannot be `require`d.
          if (
            typeof root === 'string' &&
            fs().existsSync(root) &&
            !fs().lstatSync(root).isDirectory() &&
            !constants.JEST_CONFIG_EXT_ORDER.some(ext => root.endsWith(ext))
          ) {
            return false;
          }

          return true;
        })
        .map((root, projectIndex) => {
          const projectIsTheOnlyProject =
            projectIndex === 0 && projects.length === 1;
          const skipArgvConfigOption = !(
            projectIsTheOnlyProject && projectIsCwd
          );
          return readConfig(
            argv,
            root,
            skipArgvConfigOption,
            configPath,
            projectIndex
          );
        })
    );
    ensureNoDuplicateConfigs(parsedConfigs, projects);
    configs = parsedConfigs.map(({projectConfig}) => projectConfig);

    if (!hasDeprecationWarnings) {
      hasDeprecationWarnings = parsedConfigs.some(
        ({hasDeprecationWarnings}) => !!hasDeprecationWarnings
      );
    } // If no config was passed initially, use the one from the first project

    if (!globalConfig) {
      globalConfig = parsedConfigs[0].globalConfig;
    }
  }

  if (!globalConfig || !configs.length) {
    throw new Error('jest: No configuration found for any project.');
  }

  return {
    configs,
    globalConfig,
    hasDeprecationWarnings: !!hasDeprecationWarnings
  };
}
});
