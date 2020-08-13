import os from 'os';
import path from 'path';
import stream from 'stream';
import worker_threads from 'worker_threads';
import child_process from 'child_process';
import tty from 'tty';

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

const { PassThrough } = stream;

var mergeStream = function (/*streams...*/) {
  var sources = [];
  var output  = new PassThrough({objectMode: true});

  output.setMaxListeners(0);

  output.add = add;
  output.isEmpty = isEmpty;

  output.on('unpipe', remove);

  Array.prototype.slice.call(arguments).forEach(add);

  return output

  function add (source) {
    if (Array.isArray(source)) {
      source.forEach(add);
      return this
    }

    sources.push(source);
    source.once('end', remove.bind(null, source));
    source.once('error', output.emit.bind(output, 'error'));
    source.pipe(output, {end: false});
    return this
  }

  function isEmpty () {
    return sources.length == 0;
  }

  function remove (source) {
    sources = sources.filter(function (it) { return it !== source });
    if (!sources.length && output.readable) { output.end(); }
  }
};

var types = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.PARENT_MESSAGE_CUSTOM = exports.PARENT_MESSAGE_SETUP_ERROR = exports.PARENT_MESSAGE_CLIENT_ERROR = exports.PARENT_MESSAGE_OK = exports.CHILD_MESSAGE_END = exports.CHILD_MESSAGE_CALL = exports.CHILD_MESSAGE_INITIALIZE = void 0;

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// import type {ResourceLimits} from 'worker_threads';
// This is not present in the Node 12 typings
// Because of the dynamic nature of a worker communication process, all messages
// coming from any of the other processes cannot be typed. Thus, many types
// include "unknown" as a TS type, which is (unfortunately) correct here.
const CHILD_MESSAGE_INITIALIZE = 0;
exports.CHILD_MESSAGE_INITIALIZE = CHILD_MESSAGE_INITIALIZE;
const CHILD_MESSAGE_CALL = 1;
exports.CHILD_MESSAGE_CALL = CHILD_MESSAGE_CALL;
const CHILD_MESSAGE_END = 2;
exports.CHILD_MESSAGE_END = CHILD_MESSAGE_END;
const PARENT_MESSAGE_OK = 0;
exports.PARENT_MESSAGE_OK = PARENT_MESSAGE_OK;
const PARENT_MESSAGE_CLIENT_ERROR = 1;
exports.PARENT_MESSAGE_CLIENT_ERROR = PARENT_MESSAGE_CLIENT_ERROR;
const PARENT_MESSAGE_SETUP_ERROR = 2;
exports.PARENT_MESSAGE_SETUP_ERROR = PARENT_MESSAGE_SETUP_ERROR;
const PARENT_MESSAGE_CUSTOM = 3;
exports.PARENT_MESSAGE_CUSTOM = PARENT_MESSAGE_CUSTOM;
});

var BaseWorkerPool_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function path$1() {
  const data = _interopRequireWildcard(path);

  path$1 = function () {
    return data;
  };

  return data;
}

function _mergeStream() {
  const data = _interopRequireDefault(mergeStream);

  _mergeStream = function () {
    return data;
  };

  return data;
}

function _types() {
  const data = types;

  _types = function () {
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

// How long to wait for the child process to terminate
// after CHILD_MESSAGE_END before sending force exiting.
const FORCE_EXIT_DELAY = 500;
/* istanbul ignore next */

const emptyMethod = () => {};

class BaseWorkerPool {
  constructor(workerPath, options) {
    _defineProperty(this, '_stderr', void 0);

    _defineProperty(this, '_stdout', void 0);

    _defineProperty(this, '_options', void 0);

    _defineProperty(this, '_workers', void 0);

    this._options = options;
    this._workers = new Array(options.numWorkers);

    if (!path$1().isAbsolute(workerPath)) {
      workerPath = require.resolve(workerPath);
    }

    const stdout = (0, _mergeStream().default)();
    const stderr = (0, _mergeStream().default)();
    const {forkOptions, maxRetries, resourceLimits, setupArgs} = options;

    for (let i = 0; i < options.numWorkers; i++) {
      const workerOptions = {
        forkOptions,
        maxRetries,
        resourceLimits,
        setupArgs,
        workerId: i,
        workerPath
      };
      const worker = this.createWorker(workerOptions);
      const workerStdout = worker.getStdout();
      const workerStderr = worker.getStderr();

      if (workerStdout) {
        stdout.add(workerStdout);
      }

      if (workerStderr) {
        stderr.add(workerStderr);
      }

      this._workers[i] = worker;
    }

    this._stdout = stdout;
    this._stderr = stderr;
  }

  getStderr() {
    return this._stderr;
  }

  getStdout() {
    return this._stdout;
  }

  getWorkers() {
    return this._workers;
  }

  getWorkerById(workerId) {
    return this._workers[workerId];
  }

  createWorker(_workerOptions) {
    throw Error('Missing method createWorker in WorkerPool');
  }

  async end() {
    // We do not cache the request object here. If so, it would only be only
    // processed by one of the workers, and we want them all to close.
    const workerExitPromises = this._workers.map(async worker => {
      worker.send(
        [_types().CHILD_MESSAGE_END, false],
        emptyMethod,
        emptyMethod,
        emptyMethod
      ); // Schedule a force exit in case worker fails to exit gracefully so
      // await worker.waitForExit() never takes longer than FORCE_EXIT_DELAY

      let forceExited = false;
      const forceExitTimeout = setTimeout(() => {
        worker.forceExit();
        forceExited = true;
      }, FORCE_EXIT_DELAY);
      await worker.waitForExit(); // Worker ideally exited gracefully, don't send force exit then

      clearTimeout(forceExitTimeout);
      return forceExited;
    });

    const workerExits = await Promise.all(workerExitPromises);
    return workerExits.reduce(
      (result, forceExited) => ({
        forceExited: result.forceExited || forceExited
      }),
      {
        forceExited: false
      }
    );
  }
}

exports.default = BaseWorkerPool;
});

var NodeThreadsWorker = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function path$1() {
  const data = _interopRequireWildcard(path);

  path$1 = function () {
    return data;
  };

  return data;
}

function _stream() {
  const data = stream;

  _stream = function () {
    return data;
  };

  return data;
}

function _worker_threads() {
  const data = worker_threads;

  _worker_threads = function () {
    return data;
  };

  return data;
}

function _mergeStream() {
  const data = _interopRequireDefault(mergeStream);

  _mergeStream = function () {
    return data;
  };

  return data;
}

function _types() {
  const data = types;

  _types = function () {
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

class ExperimentalWorker {
  constructor(options) {
    _defineProperty(this, '_worker', void 0);

    _defineProperty(this, '_options', void 0);

    _defineProperty(this, '_request', void 0);

    _defineProperty(this, '_retries', void 0);

    _defineProperty(this, '_onProcessEnd', void 0);

    _defineProperty(this, '_onCustomMessage', void 0);

    _defineProperty(this, '_fakeStream', void 0);

    _defineProperty(this, '_stdout', void 0);

    _defineProperty(this, '_stderr', void 0);

    _defineProperty(this, '_exitPromise', void 0);

    _defineProperty(this, '_resolveExitPromise', void 0);

    _defineProperty(this, '_forceExited', void 0);

    this._options = options;
    this._request = null;
    this._fakeStream = null;
    this._stdout = null;
    this._stderr = null;
    this._exitPromise = new Promise(resolve => {
      this._resolveExitPromise = resolve;
    });
    this._forceExited = false;
    this.initialize();
  }

  initialize() {
    this._worker = new (_worker_threads().Worker)(
      path$1().resolve(__dirname, './threadChild.js'),
      {
        eval: false,
        // @ts-expect-error: added in newer versions
        resourceLimits: this._options.resourceLimits,
        stderr: true,
        stdout: true,
        workerData: {
          cwd: process.cwd(),
          env: {
            ...process.env,
            JEST_WORKER_ID: String(this._options.workerId + 1) // 0-indexed workerId, 1-indexed JEST_WORKER_ID
          },
          // Suppress --debug / --inspect flags while preserving others (like --harmony).
          execArgv: process.execArgv.filter(v => !/^--(debug|inspect)/.test(v)),
          silent: true,
          ...this._options.forkOptions
        }
      }
    );

    if (this._worker.stdout) {
      if (!this._stdout) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stdout = (0, _mergeStream().default)(this._getFakeStream());
      }

      this._stdout.add(this._worker.stdout);
    }

    if (this._worker.stderr) {
      if (!this._stderr) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stderr = (0, _mergeStream().default)(this._getFakeStream());
      }

      this._stderr.add(this._worker.stderr);
    }

    this._worker.on('message', this._onMessage.bind(this));

    this._worker.on('exit', this._onExit.bind(this));

    this._worker.postMessage([
      _types().CHILD_MESSAGE_INITIALIZE,
      false,
      this._options.workerPath,
      this._options.setupArgs
    ]);

    this._retries++; // If we exceeded the amount of retries, we will emulate an error reply
    // coming from the child. This avoids code duplication related with cleaning
    // the queue, and scheduling the next call.

    if (this._retries > this._options.maxRetries) {
      const error = new Error('Call retries were exceeded');

      this._onMessage([
        _types().PARENT_MESSAGE_CLIENT_ERROR,
        error.name,
        error.message,
        error.stack,
        {
          type: 'WorkerError'
        }
      ]);
    }
  }

  _shutdown() {
    // End the permanent stream so the merged stream end too
    if (this._fakeStream) {
      this._fakeStream.end();

      this._fakeStream = null;
    }

    this._resolveExitPromise();
  }

  _onMessage(response) {
    let error;

    switch (response[0]) {
      case _types().PARENT_MESSAGE_OK:
        this._onProcessEnd(null, response[1]);

        break;

      case _types().PARENT_MESSAGE_CLIENT_ERROR:
        error = response[4];

        if (error != null && typeof error === 'object') {
          const extra = error; // @ts-expect-error: no index

          const NativeCtor = commonjsGlobal[response[1]];
          const Ctor = typeof NativeCtor === 'function' ? NativeCtor : Error;
          error = new Ctor(response[2]);
          error.type = response[1];
          error.stack = response[3];

          for (const key in extra) {
            // @ts-expect-error: no index
            error[key] = extra[key];
          }
        }

        this._onProcessEnd(error, null);

        break;

      case _types().PARENT_MESSAGE_SETUP_ERROR:
        error = new Error('Error when calling setup: ' + response[2]); // @ts-expect-error: adding custom properties to errors.

        error.type = response[1];
        error.stack = response[3];

        this._onProcessEnd(error, null);

        break;

      case _types().PARENT_MESSAGE_CUSTOM:
        this._onCustomMessage(response[1]);

        break;

      default:
        throw new TypeError('Unexpected response from worker: ' + response[0]);
    }
  }

  _onExit(exitCode) {
    if (exitCode !== 0 && !this._forceExited) {
      this.initialize();

      if (this._request) {
        this._worker.postMessage(this._request);
      }
    } else {
      this._shutdown();
    }
  }

  waitForExit() {
    return this._exitPromise;
  }

  forceExit() {
    this._forceExited = true;

    this._worker.terminate();
  }

  send(request, onProcessStart, onProcessEnd, onCustomMessage) {
    onProcessStart(this);

    this._onProcessEnd = (...args) => {
      // Clean the request to avoid sending past requests to workers that fail
      // while waiting for a new request (timers, unhandled rejections...)
      this._request = null;
      return onProcessEnd(...args);
    };

    this._onCustomMessage = (...arg) => onCustomMessage(...arg);

    this._request = request;
    this._retries = 0;

    this._worker.postMessage(request);
  }

  getWorkerId() {
    return this._options.workerId;
  }

  getStdout() {
    return this._stdout;
  }

  getStderr() {
    return this._stderr;
  }

  _getFakeStream() {
    if (!this._fakeStream) {
      this._fakeStream = new (_stream().PassThrough)();
    }

    return this._fakeStream;
  }
}

exports.default = ExperimentalWorker;
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
		const osRelease = os.release().split('.');
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
	stdout: translateLevel(supportsColor(true, tty.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty.isatty(2)))
};

var ChildProcessWorker_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function _child_process() {
  const data = child_process;

  _child_process = function () {
    return data;
  };

  return data;
}

function _stream() {
  const data = stream;

  _stream = function () {
    return data;
  };

  return data;
}

function _mergeStream() {
  const data = _interopRequireDefault(mergeStream);

  _mergeStream = function () {
    return data;
  };

  return data;
}

function _supportsColor() {
  const data = supportsColor_1;

  _supportsColor = function () {
    return data;
  };

  return data;
}

function _types() {
  const data = types;

  _types = function () {
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

const SIGNAL_BASE_EXIT_CODE = 128;
const SIGKILL_EXIT_CODE = SIGNAL_BASE_EXIT_CODE + 9;
const SIGTERM_EXIT_CODE = SIGNAL_BASE_EXIT_CODE + 15; // How long to wait after SIGTERM before sending SIGKILL

const SIGKILL_DELAY = 500;
/**
 * This class wraps the child process and provides a nice interface to
 * communicate with. It takes care of:
 *
 *  - Re-spawning the process if it dies.
 *  - Queues calls while the worker is busy.
 *  - Re-sends the requests if the worker blew up.
 *
 * The reason for queueing them here (since childProcess.send also has an
 * internal queue) is because the worker could be doing asynchronous work, and
 * this would lead to the child process to read its receiving buffer and start a
 * second call. By queueing calls here, we don't send the next call to the
 * children until we receive the result of the previous one.
 *
 * As soon as a request starts to be processed by a worker, its "processed"
 * field is changed to "true", so that other workers which might encounter the
 * same call skip it.
 */

class ChildProcessWorker {
  constructor(options) {
    _defineProperty(this, '_child', void 0);

    _defineProperty(this, '_options', void 0);

    _defineProperty(this, '_request', void 0);

    _defineProperty(this, '_retries', void 0);

    _defineProperty(this, '_onProcessEnd', void 0);

    _defineProperty(this, '_onCustomMessage', void 0);

    _defineProperty(this, '_fakeStream', void 0);

    _defineProperty(this, '_stdout', void 0);

    _defineProperty(this, '_stderr', void 0);

    _defineProperty(this, '_exitPromise', void 0);

    _defineProperty(this, '_resolveExitPromise', void 0);

    this._options = options;
    this._request = null;
    this._fakeStream = null;
    this._stdout = null;
    this._stderr = null;
    this._exitPromise = new Promise(resolve => {
      this._resolveExitPromise = resolve;
    });
    this.initialize();
  }

  initialize() {
    const forceColor = _supportsColor().stdout
      ? {
          FORCE_COLOR: '1'
        }
      : {};
    const child = (0, _child_process().fork)(
      require.resolve('./processChild'),
      [],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          JEST_WORKER_ID: String(this._options.workerId + 1),
          // 0-indexed workerId, 1-indexed JEST_WORKER_ID
          ...forceColor
        },
        // Suppress --debug / --inspect flags while preserving others (like --harmony).
        execArgv: process.execArgv.filter(v => !/^--(debug|inspect)/.test(v)),
        silent: true,
        ...this._options.forkOptions
      }
    );

    if (child.stdout) {
      if (!this._stdout) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stdout = (0, _mergeStream().default)(this._getFakeStream());
      }

      this._stdout.add(child.stdout);
    }

    if (child.stderr) {
      if (!this._stderr) {
        // We need to add a permanent stream to the merged stream to prevent it
        // from ending when the subprocess stream ends
        this._stderr = (0, _mergeStream().default)(this._getFakeStream());
      }

      this._stderr.add(child.stderr);
    }

    child.on('message', this._onMessage.bind(this));
    child.on('exit', this._onExit.bind(this));
    child.send([
      _types().CHILD_MESSAGE_INITIALIZE,
      false,
      this._options.workerPath,
      this._options.setupArgs
    ]);
    this._child = child;
    this._retries++; // If we exceeded the amount of retries, we will emulate an error reply
    // coming from the child. This avoids code duplication related with cleaning
    // the queue, and scheduling the next call.

    if (this._retries > this._options.maxRetries) {
      const error = new Error('Call retries were exceeded');

      this._onMessage([
        _types().PARENT_MESSAGE_CLIENT_ERROR,
        error.name,
        error.message,
        error.stack,
        {
          type: 'WorkerError'
        }
      ]);
    }
  }

  _shutdown() {
    // End the temporary streams so the merged streams end too
    if (this._fakeStream) {
      this._fakeStream.end();

      this._fakeStream = null;
    }

    this._resolveExitPromise();
  }

  _onMessage(response) {
    // TODO: Add appropriate type check
    let error;

    switch (response[0]) {
      case _types().PARENT_MESSAGE_OK:
        this._onProcessEnd(null, response[1]);

        break;

      case _types().PARENT_MESSAGE_CLIENT_ERROR:
        error = response[4];

        if (error != null && typeof error === 'object') {
          const extra = error; // @ts-expect-error: no index

          const NativeCtor = commonjsGlobal[response[1]];
          const Ctor = typeof NativeCtor === 'function' ? NativeCtor : Error;
          error = new Ctor(response[2]);
          error.type = response[1];
          error.stack = response[3];

          for (const key in extra) {
            error[key] = extra[key];
          }
        }

        this._onProcessEnd(error, null);

        break;

      case _types().PARENT_MESSAGE_SETUP_ERROR:
        error = new Error('Error when calling setup: ' + response[2]);
        error.type = response[1];
        error.stack = response[3];

        this._onProcessEnd(error, null);

        break;

      case _types().PARENT_MESSAGE_CUSTOM:
        this._onCustomMessage(response[1]);

        break;

      default:
        throw new TypeError('Unexpected response from worker: ' + response[0]);
    }
  }

  _onExit(exitCode) {
    if (
      exitCode !== 0 &&
      exitCode !== SIGTERM_EXIT_CODE &&
      exitCode !== SIGKILL_EXIT_CODE
    ) {
      this.initialize();

      if (this._request) {
        this._child.send(this._request);
      }
    } else {
      this._shutdown();
    }
  }

  send(request, onProcessStart, onProcessEnd, onCustomMessage) {
    onProcessStart(this);

    this._onProcessEnd = (...args) => {
      // Clean the request to avoid sending past requests to workers that fail
      // while waiting for a new request (timers, unhandled rejections...)
      this._request = null;
      return onProcessEnd(...args);
    };

    this._onCustomMessage = (...arg) => onCustomMessage(...arg);

    this._request = request;
    this._retries = 0;

    this._child.send(request);
  }

  waitForExit() {
    return this._exitPromise;
  }

  forceExit() {
    this._child.kill('SIGTERM');

    const sigkillTimeout = setTimeout(
      () => this._child.kill('SIGKILL'),
      SIGKILL_DELAY
    );

    this._exitPromise.then(() => clearTimeout(sigkillTimeout));
  }

  getWorkerId() {
    return this._options.workerId;
  }

  getStdout() {
    return this._stdout;
  }

  getStderr() {
    return this._stderr;
  }

  _getFakeStream() {
    if (!this._fakeStream) {
      this._fakeStream = new (_stream().PassThrough)();
    }

    return this._fakeStream;
  }
}

exports.default = ChildProcessWorker;
});

var WorkerPool_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

var _BaseWorkerPool = _interopRequireDefault(BaseWorkerPool_1);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const canUseWorkerThreads = () => {
  try {
    

    return true;
  } catch {
    return false;
  }
};

class WorkerPool extends _BaseWorkerPool.default {
  send(workerId, request, onStart, onEnd, onCustomMessage) {
    this.getWorkerById(workerId).send(request, onStart, onEnd, onCustomMessage);
  }

  createWorker(workerOptions) {
    let Worker;

    if (this._options.enableWorkerThreads && canUseWorkerThreads()) {
      Worker = NodeThreadsWorker.default;
    } else {
      Worker = ChildProcessWorker_1.default;
    }

    return new Worker(workerOptions);
  }
}

var _default = WorkerPool;
exports.default = _default;
});

var Farm_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;



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

class Farm {
  constructor(numOfWorkers, callback, computeWorkerKey) {
    _defineProperty(this, '_computeWorkerKey', void 0);

    _defineProperty(this, '_cacheKeys', void 0);

    _defineProperty(this, '_callback', void 0);

    _defineProperty(this, '_last', void 0);

    _defineProperty(this, '_locks', void 0);

    _defineProperty(this, '_numOfWorkers', void 0);

    _defineProperty(this, '_offset', void 0);

    _defineProperty(this, '_queue', void 0);

    this._cacheKeys = Object.create(null);
    this._callback = callback;
    this._last = [];
    this._locks = [];
    this._numOfWorkers = numOfWorkers;
    this._offset = 0;
    this._queue = [];

    if (computeWorkerKey) {
      this._computeWorkerKey = computeWorkerKey;
    }
  }

  doWork(method, ...args) {
    const customMessageListeners = new Set();

    const addCustomMessageListener = listener => {
      customMessageListeners.add(listener);
      return () => {
        customMessageListeners.delete(listener);
      };
    };

    const onCustomMessage = message => {
      customMessageListeners.forEach(listener => listener(message));
    };

    const promise = new Promise((resolve, reject) => {
      const computeWorkerKey = this._computeWorkerKey;
      const request = [types.CHILD_MESSAGE_CALL, false, method, args];
      let worker = null;
      let hash = null;

      if (computeWorkerKey) {
        hash = computeWorkerKey.call(this, method, ...args);
        worker = hash == null ? null : this._cacheKeys[hash];
      }

      const onStart = worker => {
        if (hash != null) {
          this._cacheKeys[hash] = worker;
        }
      };

      const onEnd = (error, result) => {
        customMessageListeners.clear();

        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };

      const task = {
        onCustomMessage,
        onEnd,
        onStart,
        request
      };

      if (worker) {
        this._enqueue(task, worker.getWorkerId());
      } else {
        this._push(task);
      }
    });
    promise.UNSTABLE_onCustomMessage = addCustomMessageListener;
    return promise;
  }

  _getNextTask(workerId) {
    let queueHead = this._queue[workerId];

    while (queueHead && queueHead.task.request[1]) {
      queueHead = queueHead.next || null;
    }

    this._queue[workerId] = queueHead;
    return queueHead && queueHead.task;
  }

  _process(workerId) {
    if (this._isLocked(workerId)) {
      return this;
    }

    const task = this._getNextTask(workerId);

    if (!task) {
      return this;
    }

    const onEnd = (error, result) => {
      task.onEnd(error, result);

      this._unlock(workerId);

      this._process(workerId);
    };

    task.request[1] = true;

    this._lock(workerId);

    this._callback(
      workerId,
      task.request,
      task.onStart,
      onEnd,
      task.onCustomMessage
    );

    return this;
  }

  _enqueue(task, workerId) {
    const item = {
      next: null,
      task
    };

    if (task.request[1]) {
      return this;
    }

    if (this._queue[workerId]) {
      this._last[workerId].next = item;
    } else {
      this._queue[workerId] = item;
    }

    this._last[workerId] = item;

    this._process(workerId);

    return this;
  }

  _push(task) {
    for (let i = 0; i < this._numOfWorkers; i++) {
      this._enqueue(task, (this._offset + i) % this._numOfWorkers);
    }

    this._offset++;
    return this;
  }

  _lock(workerId) {
    this._locks[workerId] = true;
  }

  _unlock(workerId) {
    this._locks[workerId] = false;
  }

  _isLocked(workerId) {
    return this._locks[workerId];
  }
}

exports.default = Farm;
});

var messageParent_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = void 0;

function _types() {
  const data = types;

  _types = function () {
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
const isWorkerThread = () => {
  try {
    // `Require` here to support Node v10
    const {isMainThread, parentPort} = worker_threads;

    return !isMainThread && parentPort;
  } catch {
    return false;
  }
};

const messageParent = (message, parentProcess = process) => {
  try {
    if (isWorkerThread()) {
      // `Require` here to support Node v10
      const {parentPort} = worker_threads;

      parentPort.postMessage([_types().PARENT_MESSAGE_CUSTOM, message]);
    } else if (typeof parentProcess.send === 'function') {
      parentProcess.send([_types().PARENT_MESSAGE_CUSTOM, message]);
    }
  } catch (error) {
    throw new Error('"messageParent" can only be used inside a worker');
  }
};

var _default = messageParent;
exports.default = _default;
});

var build = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});
Object.defineProperty(exports, 'messageParent', {
  enumerable: true,
  get: function () {
    return _messageParent.default;
  }
});
exports.default = void 0;

function _os() {
  const data = os;

  _os = function () {
    return data;
  };

  return data;
}

var _WorkerPool = _interopRequireDefault(WorkerPool_1);

var _Farm = _interopRequireDefault(Farm_1);

var _messageParent = _interopRequireDefault(messageParent_1);

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

function getExposedMethods(workerPath, options) {
  let exposedMethods = options.exposedMethods; // If no methods list is given, try getting it by auto-requiring the module.

  if (!exposedMethods) {
    const module = commonjsRequire();

    exposedMethods = Object.keys(module).filter(
      // @ts-expect-error: no index
      name => typeof module[name] === 'function'
    );

    if (typeof module === 'function') {
      exposedMethods = [...exposedMethods, 'default'];
    }
  }

  return exposedMethods;
}
/**
 * The Jest farm (publicly called "Worker") is a class that allows you to queue
 * methods across multiple child processes, in order to parallelize work. This
 * is done by providing an absolute path to a module that will be loaded on each
 * of the child processes, and bridged to the main process.
 *
 * Bridged methods are specified by using the "exposedMethods" property of the
 * "options" object. This is an array of strings, where each of them corresponds
 * to the exported name in the loaded module.
 *
 * You can also control the amount of workers by using the "numWorkers" property
 * of the "options" object, and the settings passed to fork the process through
 * the "forkOptions" property. The amount of workers defaults to the amount of
 * CPUS minus one.
 *
 * Queueing calls can be done in two ways:
 *   - Standard method: calls will be redirected to the first available worker,
 *     so they will get executed as soon as they can.
 *
 *   - Sticky method: if a "computeWorkerKey" method is provided within the
 *     config, the resulting string of this method will be used as a key.
 *     Every time this key is returned, it is guaranteed that your job will be
 *     processed by the same worker. This is specially useful if your workers
 *     are caching results.
 */

class JestWorker {
  constructor(workerPath, options) {
    var _this$_options$enable,
      _this$_options$forkOp,
      _this$_options$maxRet,
      _this$_options$numWor,
      _this$_options$resour,
      _this$_options$setupA;

    _defineProperty(this, '_ending', void 0);

    _defineProperty(this, '_farm', void 0);

    _defineProperty(this, '_options', void 0);

    _defineProperty(this, '_workerPool', void 0);

    this._options = {...options};
    this._ending = false;
    const workerPoolOptions = {
      enableWorkerThreads:
        (_this$_options$enable = this._options.enableWorkerThreads) !== null &&
        _this$_options$enable !== void 0
          ? _this$_options$enable
          : false,
      forkOptions:
        (_this$_options$forkOp = this._options.forkOptions) !== null &&
        _this$_options$forkOp !== void 0
          ? _this$_options$forkOp
          : {},
      maxRetries:
        (_this$_options$maxRet = this._options.maxRetries) !== null &&
        _this$_options$maxRet !== void 0
          ? _this$_options$maxRet
          : 3,
      numWorkers:
        (_this$_options$numWor = this._options.numWorkers) !== null &&
        _this$_options$numWor !== void 0
          ? _this$_options$numWor
          : Math.max((0, _os().cpus)().length - 1, 1),
      resourceLimits:
        (_this$_options$resour = this._options.resourceLimits) !== null &&
        _this$_options$resour !== void 0
          ? _this$_options$resour
          : {},
      setupArgs:
        (_this$_options$setupA = this._options.setupArgs) !== null &&
        _this$_options$setupA !== void 0
          ? _this$_options$setupA
          : []
    };

    if (this._options.WorkerPool) {
      // @ts-expect-error: constructor target any?
      this._workerPool = new this._options.WorkerPool(
        workerPath,
        workerPoolOptions
      );
    } else {
      this._workerPool = new _WorkerPool.default(workerPath, workerPoolOptions);
    }

    this._farm = new _Farm.default(
      workerPoolOptions.numWorkers,
      this._workerPool.send.bind(this._workerPool),
      this._options.computeWorkerKey
    );

    this._bindExposedWorkerMethods(workerPath, this._options);
  }

  _bindExposedWorkerMethods(workerPath, options) {
    getExposedMethods(workerPath, options).forEach(name => {
      if (name.startsWith('_')) {
        return;
      }

      if (this.constructor.prototype.hasOwnProperty(name)) {
        throw new TypeError('Cannot define a method called ' + name);
      } // @ts-expect-error: dynamic extension of the class instance is expected.

      this[name] = this._callFunctionWithArgs.bind(this, name);
    });
  }

  _callFunctionWithArgs(method, ...args) {
    if (this._ending) {
      throw new Error('Farm is ended, no more calls can be done to it');
    }

    return this._farm.doWork(method, ...args);
  }

  getStderr() {
    return this._workerPool.getStderr();
  }

  getStdout() {
    return this._workerPool.getStdout();
  }

  async end() {
    if (this._ending) {
      throw new Error('Farm is ended, no more calls can be done to it');
    }

    this._ending = true;
    return this._workerPool.end();
  }
}

exports.default = JestWorker;
});
