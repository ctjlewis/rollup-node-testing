import assert from 'assert';
import events from 'events';

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

const mimicFn = (to, from) => {
	for (const prop of Reflect.ownKeys(from)) {
		Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));
	}

	return to;
};

var mimicFn_1 = mimicFn;
// TODO: Remove this for the next major release
var _default = mimicFn;
mimicFn_1.default = _default;

const calledFunctions = new WeakMap();

const oneTime = (function_, options = {}) => {
	if (typeof function_ !== 'function') {
		throw new TypeError('Expected a function');
	}

	let returnValue;
	let callCount = 0;
	const functionName = function_.displayName || function_.name || '<anonymous>';

	const onetime = function (...arguments_) {
		calledFunctions.set(onetime, ++callCount);

		if (callCount === 1) {
			returnValue = function_.apply(this, arguments_);
			function_ = null;
		} else if (options.throw === true) {
			throw new Error(`Function \`${functionName}\` can only be called once`);
		}

		return returnValue;
	};

	mimicFn_1(onetime, function_);
	calledFunctions.set(onetime, callCount);

	return onetime;
};

var onetime = oneTime;
// TODO: Remove this for the next major release
var _default$1 = oneTime;

var callCount = function_ => {
	if (!calledFunctions.has(function_)) {
		throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
	}

	return calledFunctions.get(function_);
};
onetime.default = _default$1;
onetime.callCount = callCount;

var signals = createCommonjsModule(function (module) {
// This is not the set of all possible signals.
//
// It IS, however, the set of all signals that trigger
// an exit on either Linux or BSD systems.  Linux is a
// superset of the signal names supported on BSD, and
// the unknown signals just fail to register, so we can
// catch that easily enough.
//
// Don't bother with SIGKILL.  It's uncatchable, which
// means that we can't fire any callbacks anyway.
//
// If a user does happen to register a handler on a non-
// fatal signal like SIGWINCH or something, and then
// exit, it'll end up firing `process.emit('exit')`, so
// the handler will be fired anyway.
//
// SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
// artificially, inherently leave the process in a
// state from which it is not safe to try and enter JS
// listeners.
module.exports = [
  'SIGABRT',
  'SIGALRM',
  'SIGHUP',
  'SIGINT',
  'SIGTERM'
];

if (process.platform !== 'win32') {
  module.exports.push(
    'SIGVTALRM',
    'SIGXCPU',
    'SIGXFSZ',
    'SIGUSR2',
    'SIGTRAP',
    'SIGSYS',
    'SIGQUIT',
    'SIGIOT'
    // should detect profiler and enable/disable accordingly.
    // see #21
    // 'SIGPROF'
  );
}

if (process.platform === 'linux') {
  module.exports.push(
    'SIGIO',
    'SIGPOLL',
    'SIGPWR',
    'SIGSTKFLT',
    'SIGUNUSED'
  );
}
});

// Note: since nyc uses this module to output coverage, any lines
// that are in the direct sync flow of nyc's outputCoverage are
// ignored, since we can never get coverage for them.

var signals$1 = signals;
var isWin = /^win/i.test(process.platform);

var EE = events;
/* istanbul ignore if */
if (typeof EE !== 'function') {
  EE = EE.EventEmitter;
}

var emitter;
if (process.__signal_exit_emitter__) {
  emitter = process.__signal_exit_emitter__;
} else {
  emitter = process.__signal_exit_emitter__ = new EE();
  emitter.count = 0;
  emitter.emitted = {};
}

// Because this emitter is a global, we have to check to see if a
// previous version of this library failed to enable infinite listeners.
// I know what you're about to say.  But literally everything about
// signal-exit is a compromise with evil.  Get used to it.
if (!emitter.infinite) {
  emitter.setMaxListeners(Infinity);
  emitter.infinite = true;
}

var signalExit = function (cb, opts) {
  assert.equal(typeof cb, 'function', 'a callback must be provided for exit handler');

  if (loaded === false) {
    load();
  }

  var ev = 'exit';
  if (opts && opts.alwaysLast) {
    ev = 'afterexit';
  }

  var remove = function () {
    emitter.removeListener(ev, cb);
    if (emitter.listeners('exit').length === 0 &&
        emitter.listeners('afterexit').length === 0) {
      unload();
    }
  };
  emitter.on(ev, cb);

  return remove
};

var unload_1 = unload;
function unload () {
  if (!loaded) {
    return
  }
  loaded = false;

  signals$1.forEach(function (sig) {
    try {
      process.removeListener(sig, sigListeners[sig]);
    } catch (er) {}
  });
  process.emit = originalProcessEmit;
  process.reallyExit = originalProcessReallyExit;
  emitter.count -= 1;
}

function emit (event, code, signal) {
  if (emitter.emitted[event]) {
    return
  }
  emitter.emitted[event] = true;
  emitter.emit(event, code, signal);
}

// { <signal>: <listener fn>, ... }
var sigListeners = {};
signals$1.forEach(function (sig) {
  sigListeners[sig] = function listener () {
    // If there are no other listeners, an exit is coming!
    // Simplest way: remove us and then re-send the signal.
    // We know that this will kill the process, so we can
    // safely emit now.
    var listeners = process.listeners(sig);
    if (listeners.length === emitter.count) {
      unload();
      emit('exit', null, sig);
      /* istanbul ignore next */
      emit('afterexit', null, sig);
      /* istanbul ignore next */
      if (isWin && sig === 'SIGHUP') {
        // "SIGHUP" throws an `ENOSYS` error on Windows,
        // so use a supported signal instead
        sig = 'SIGINT';
      }
      process.kill(process.pid, sig);
    }
  };
});

var signals_1 = function () {
  return signals$1
};

var load_1 = load;

var loaded = false;

function load () {
  if (loaded) {
    return
  }
  loaded = true;

  // This is the number of onSignalExit's that are in play.
  // It's important so that we can count the correct number of
  // listeners on signals, and don't wait for the other one to
  // handle it instead of us.
  emitter.count += 1;

  signals$1 = signals$1.filter(function (sig) {
    try {
      process.on(sig, sigListeners[sig]);
      return true
    } catch (er) {
      return false
    }
  });

  process.emit = processEmit;
  process.reallyExit = processReallyExit;
}

var originalProcessReallyExit = process.reallyExit;
function processReallyExit (code) {
  process.exitCode = code || 0;
  emit('exit', process.exitCode, null);
  /* istanbul ignore next */
  emit('afterexit', process.exitCode, null);
  /* istanbul ignore next */
  originalProcessReallyExit.call(process, process.exitCode);
}

var originalProcessEmit = process.emit;
function processEmit (ev, arg) {
  if (ev === 'exit') {
    if (arg !== undefined) {
      process.exitCode = arg;
    }
    var ret = originalProcessEmit.apply(this, arguments);
    emit('exit', process.exitCode, null);
    /* istanbul ignore next */
    emit('afterexit', process.exitCode, null);
    return ret
  } else {
    return originalProcessEmit.apply(this, arguments)
  }
}
signalExit.unload = unload_1;
signalExit.signals = signals_1;
signalExit.load = load_1;

var restoreCursor = onetime(() => {
	signalExit(() => {
		process.stderr.write('\u001B[?25h');
	}, {alwaysLast: true});
});

var cliCursor = createCommonjsModule(function (module, exports) {


let isHidden = false;

exports.show = (writableStream = process.stderr) => {
	if (!writableStream.isTTY) {
		return;
	}

	isHidden = false;
	writableStream.write('\u001B[?25h');
};

exports.hide = (writableStream = process.stderr) => {
	if (!writableStream.isTTY) {
		return;
	}

	restoreCursor();
	isHidden = true;
	writableStream.write('\u001B[?25l');
};

exports.toggle = (force, writableStream) => {
	if (force !== undefined) {
		isHidden = force;
	}

	if (isHidden) {
		exports.show(writableStream);
	} else {
		exports.hide(writableStream);
	}
};
});
