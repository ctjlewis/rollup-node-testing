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

var browserProcessHrtime = process.hrtime || hrtime;

// polyfil for window.performance.now
var performance = commonjsGlobal.performance || {};
var performanceNow =
  performance.now        ||
  performance.mozNow     ||
  performance.msNow      ||
  performance.oNow       ||
  performance.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp){
  var clocktime = performanceNow.call(performance)*1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor((clocktime%1)*1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds,nanoseconds]
}

// Browserify's process implementation doesn't have hrtime, and this package is small so not much of a burden for
// Node.js users.


function toMS([sec, nanosec]) {
  return sec * 1e3 + nanosec / 1e6;
}

var utils = { hrtime: browserProcessHrtime, toMS };

const { hrtime: hrtime$1, toMS: toMS$1 } = utils;

// Returns the DOMHighResTimeStamp representing the high resolution time value of the global monotonic clock.
function getGlobalMonotonicClockMS() {
  return toMS$1(hrtime$1());
}

var globalMonotonicClock = { getGlobalMonotonicClockMS };

const { hrtime: hrtime$2 } = utils;

// The HR-TIME spec calls for 5-μs accuracy. Check that we have that in both hrtime() and Date.now().

function testClockAccuracy() {
  // Test hrtime() first. The check is simpler and more stable, and we use hrtime() to measure Date.now()'s performance.
  const roundTrip = hrtime$2(hrtime$2());
  if (roundTrip[0] > 1 || roundTrip[1] > 5e3 * 2) {
    return false;
  }
  let start;
  let end;
  start = hrtime$2();
  end = hrtime$2(start);
  if ((end[0] * 1e9 + end[1]) > 1000000) {
    return false;
  }
  start = hrtime$2();
  end = hrtime$2(start);
  if ((end[0] * 1e9 + end[1]) > 50000000) {
    return false;
  }

  return true;
}

// Warm up the function.
testClockAccuracy();
testClockAccuracy();
testClockAccuracy();

const TIMES = 5;
const THRESHOLD = 0.6 * TIMES;
let accurates = 0;
for (let i = 0; i < TIMES; i++) {
  if (testClockAccuracy()) {
    accurates++;
  }
}

const isAccurate = accurates >= THRESHOLD;

var clockIsAccurate = isAccurate;

var calculateClockOffset_1 = createCommonjsModule(function (module) {

// This files implements the calculation of the offset between the global monotonic clock and UNIX time. This value is
// known as |t1| in the calculation of "time origin timestamp" in the spec. This value needs to be calculated once and
// can be used in all subsequent Performance instances.
//
// However, if the clock is not fast enough, the export is undefined to signify that we should use Date.now() to get the
// time origin timestamp with millisecond accuracy, per spec.

const { getGlobalMonotonicClockMS } = globalMonotonicClock;


// This function assumes the clock is accurate.
function calculateClockOffset() {
  const start = Date.now();
  let cur = start;
  // Limit the iterations, just in case we're running in an environment where Date.now() has been mocked and is
  // constant.
  for (let i = 0; i < 1e6 && cur === start; i++) {
    cur = Date.now();
  }

  // At this point |cur| "just" became equal to the next millisecond -- the unseen digits after |cur| are approximately
  // all 0, and |cur| is the closest to the actual value of the UNIX time. Now, get the current global monotonic clock
  // value and do the remaining calculations.

  return cur - getGlobalMonotonicClockMS();
}

if (clockIsAccurate) {
  // Warm up the function.
  calculateClockOffset();
  calculateClockOffset();
  calculateClockOffset();

  module.exports = calculateClockOffset;
} else {
  module.exports = undefined;
}
});
