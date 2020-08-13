import buffer from 'buffer';
import util$6 from 'util';
import stream$1 from 'stream';
import events from 'events';

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

var assert = function assert(cond, text) {
  if (!cond)
    throw new Error(text);
};

var stringify = function stringify(arr) {
  var res = '';
  for (var i = 0; i < arr.length; i++)
    res += String.fromCharCode(arr[i]);
  return res;
};

var toArray = function toArray(str) {
  var res = [];
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    var hi = c >>> 8;
    var lo = c & 0xff;
    if (hi)
      res.push(hi, lo);
    else
      res.push(lo);
  }
  return res;
};

var utils = {
	assert: assert,
	stringify: stringify,
	toArray: toArray
};

var decode =
    [2608,2609,2610,2657,2659,2661,2665,2671,2675,2676,0,0,0,0,0,0,0,0,0,0,
    3104,3109,3117,3118,3119,3123,3124,3125,3126,3127,3128,3129,3133,3137,3167,
    3170,3172,3174,3175,3176,3180,3181,3182,3184,3186,3189,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    3642,3650,3651,3652,3653,3654,3655,3656,3657,3658,3659,3660,3661,3662,3663,
    3664,3665,3666,3667,3668,3669,3670,3671,3673,3690,3691,3697,3702,3703,3704,
    3705,3706,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4134,4138,4140,4155,4184,4186,[1057,
    1058,1064,1065,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1087,0,1575,1579,1660,0,0,0,0,0,2083,2110,0,0,0,0,0,0,0,0,0,0,0,0,2560,
    2596,2624,2651,2653,2686,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,3166,3197,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3644,
    3680,3707,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,[1628,1731,1744,0,0,0,2176,2178,
    2179,2210,2232,2242,2272,2274,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2713,2721,2727,
    2732,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0],[2736,2737,2739,2769,2776,2777,2787,2789,2790,0,0,0,0,0,0,0,0,0,
    3201,3204,3205,3206,3208,3218,3226,3228,3232,3235,3236,3241,3242,3245,3250,
    3253,3257,3258,3259,3261,3262,3268,3270,3300,3304,3305,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3585,
    3719,3721,3722,3723,3724,3725,3727,3731,3733,3734,3735,3736,3739,3741,3742,
    3749,3750,3752,3758,3759,3764,3766,3767,3772,3775,3781,3815,3823,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,4105,4238,4240,4241,4244,4255,4267,4302,4311,4321,4332,4333,[711,719,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[746,747,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1216,1217,
    1224,1225,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1226,1229,1234,1237,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0],[1242,1243,1262,1264,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0],[1266,1267,1279,0,0,0,1739,1740,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0],[1747,1748,1750,1757,1758,1759,1777,1780,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1781,1782,1783,1784,1786,
    1787,1788,1789,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1790,0,
    2050,2051,2052,2053,2054,2055,2056,2059,2060,2062,2063,2064,2065,2066,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[2067,2068,2069,2071,2072,2073,2074,2075,
    2076,2077,2078,2079,2175,2268,2297,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3082,3085,3094,3328,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0]]]];
var encode =
    [[13,8184],[23,8388568],[28,268435426],[28,268435427],[28,268435428],[28,
    268435429],[28,268435430],[28,268435431],[28,268435432],[24,16777194],[30,
    1073741820],[28,268435433],[28,268435434],[30,1073741821],[28,268435435],
    [28,268435436],[28,268435437],[28,268435438],[28,268435439],[28,268435440],
    [28,268435441],[28,268435442],[30,1073741822],[28,268435443],[28,
    268435444],[28,268435445],[28,268435446],[28,268435447],[28,268435448],[28,
    268435449],[28,268435450],[28,268435451],[6,20],[10,1016],[10,1017],[12,
    4090],[13,8185],[6,21],[8,248],[11,2042],[10,1018],[10,1019],[8,249],[11,
    2043],[8,250],[6,22],[6,23],[6,24],[5,0],[5,1],[5,2],[6,25],[6,26],[6,27],
    [6,28],[6,29],[6,30],[6,31],[7,92],[8,251],[15,32764],[6,32],[12,4091],[10,
    1020],[13,8186],[6,33],[7,93],[7,94],[7,95],[7,96],[7,97],[7,98],[7,99],[7,
    100],[7,101],[7,102],[7,103],[7,104],[7,105],[7,106],[7,107],[7,108],[7,
    109],[7,110],[7,111],[7,112],[7,113],[7,114],[8,252],[7,115],[8,253],[13,
    8187],[19,524272],[13,8188],[14,16380],[6,34],[15,32765],[5,3],[6,35],[5,
    4],[6,36],[5,5],[6,37],[6,38],[6,39],[5,6],[7,116],[7,117],[6,40],[6,41],
    [6,42],[5,7],[6,43],[7,118],[6,44],[5,8],[5,9],[6,45],[7,119],[7,120],[7,
    121],[7,122],[7,123],[15,32766],[11,2044],[14,16381],[13,8189],[28,
    268435452],[20,1048550],[22,4194258],[20,1048551],[20,1048552],[22,
    4194259],[22,4194260],[22,4194261],[23,8388569],[22,4194262],[23,8388570],
    [23,8388571],[23,8388572],[23,8388573],[23,8388574],[24,16777195],[23,
    8388575],[24,16777196],[24,16777197],[22,4194263],[23,8388576],[24,
    16777198],[23,8388577],[23,8388578],[23,8388579],[23,8388580],[21,2097116],
    [22,4194264],[23,8388581],[22,4194265],[23,8388582],[23,8388583],[24,
    16777199],[22,4194266],[21,2097117],[20,1048553],[22,4194267],[22,4194268],
    [23,8388584],[23,8388585],[21,2097118],[23,8388586],[22,4194269],[22,
    4194270],[24,16777200],[21,2097119],[22,4194271],[23,8388587],[23,8388588],
    [21,2097120],[21,2097121],[22,4194272],[21,2097122],[23,8388589],[22,
    4194273],[23,8388590],[23,8388591],[20,1048554],[22,4194274],[22,4194275],
    [22,4194276],[23,8388592],[22,4194277],[22,4194278],[23,8388593],[26,
    67108832],[26,67108833],[20,1048555],[19,524273],[22,4194279],[23,8388594],
    [22,4194280],[25,33554412],[26,67108834],[26,67108835],[26,67108836],[27,
    134217694],[27,134217695],[26,67108837],[24,16777201],[25,33554413],[19,
    524274],[21,2097123],[26,67108838],[27,134217696],[27,134217697],[26,
    67108839],[27,134217698],[24,16777202],[21,2097124],[21,2097125],[26,
    67108840],[26,67108841],[28,268435453],[27,134217699],[27,134217700],[27,
    134217701],[20,1048556],[24,16777203],[20,1048557],[21,2097126],[22,
    4194281],[21,2097127],[21,2097128],[23,8388595],[22,4194282],[22,4194283],
    [25,33554414],[25,33554415],[24,16777204],[24,16777205],[26,67108842],[23,
    8388596],[26,67108843],[27,134217702],[26,67108844],[26,67108845],[27,
    134217703],[27,134217704],[27,134217705],[27,134217706],[27,134217707],[28,
    268435454],[27,134217708],[27,134217709],[27,134217710],[27,134217711],[27,
    134217712],[26,67108846],[30,1073741823]];

var huffman = {
	decode: decode,
	encode: encode
};

var table = [
  {
    "name": ":authority",
    "value": "",
    "nameSize": 10,
    "totalSize": 42
  },
  {
    "name": ":method",
    "value": "GET",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":method",
    "value": "POST",
    "nameSize": 7,
    "totalSize": 43
  },
  {
    "name": ":path",
    "value": "/",
    "nameSize": 5,
    "totalSize": 38
  },
  {
    "name": ":path",
    "value": "/index.html",
    "nameSize": 5,
    "totalSize": 48
  },
  {
    "name": ":scheme",
    "value": "http",
    "nameSize": 7,
    "totalSize": 43
  },
  {
    "name": ":scheme",
    "value": "https",
    "nameSize": 7,
    "totalSize": 44
  },
  {
    "name": ":status",
    "value": "200",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "204",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "206",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "304",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "400",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "404",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "500",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": "accept-charset",
    "value": "",
    "nameSize": 14,
    "totalSize": 46
  },
  {
    "name": "accept-encoding",
    "value": "gzip, deflate",
    "nameSize": 15,
    "totalSize": 60
  },
  {
    "name": "accept-language",
    "value": "",
    "nameSize": 15,
    "totalSize": 47
  },
  {
    "name": "accept-ranges",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "accept",
    "value": "",
    "nameSize": 6,
    "totalSize": 38
  },
  {
    "name": "access-control-allow-origin",
    "value": "",
    "nameSize": 27,
    "totalSize": 59
  },
  {
    "name": "age",
    "value": "",
    "nameSize": 3,
    "totalSize": 35
  },
  {
    "name": "allow",
    "value": "",
    "nameSize": 5,
    "totalSize": 37
  },
  {
    "name": "authorization",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "cache-control",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "content-disposition",
    "value": "",
    "nameSize": 19,
    "totalSize": 51
  },
  {
    "name": "content-encoding",
    "value": "",
    "nameSize": 16,
    "totalSize": 48
  },
  {
    "name": "content-language",
    "value": "",
    "nameSize": 16,
    "totalSize": 48
  },
  {
    "name": "content-length",
    "value": "",
    "nameSize": 14,
    "totalSize": 46
  },
  {
    "name": "content-location",
    "value": "",
    "nameSize": 16,
    "totalSize": 48
  },
  {
    "name": "content-range",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "content-type",
    "value": "",
    "nameSize": 12,
    "totalSize": 44
  },
  {
    "name": "cookie",
    "value": "",
    "nameSize": 6,
    "totalSize": 38
  },
  {
    "name": "date",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "etag",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "expect",
    "value": "",
    "nameSize": 6,
    "totalSize": 38
  },
  {
    "name": "expires",
    "value": "",
    "nameSize": 7,
    "totalSize": 39
  },
  {
    "name": "from",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "host",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "if-match",
    "value": "",
    "nameSize": 8,
    "totalSize": 40
  },
  {
    "name": "if-modified-since",
    "value": "",
    "nameSize": 17,
    "totalSize": 49
  },
  {
    "name": "if-none-match",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "if-range",
    "value": "",
    "nameSize": 8,
    "totalSize": 40
  },
  {
    "name": "if-unmodified-since",
    "value": "",
    "nameSize": 19,
    "totalSize": 51
  },
  {
    "name": "last-modified",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "link",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "location",
    "value": "",
    "nameSize": 8,
    "totalSize": 40
  },
  {
    "name": "max-forwards",
    "value": "",
    "nameSize": 12,
    "totalSize": 44
  },
  {
    "name": "proxy-authenticate",
    "value": "",
    "nameSize": 18,
    "totalSize": 50
  },
  {
    "name": "proxy-authorization",
    "value": "",
    "nameSize": 19,
    "totalSize": 51
  },
  {
    "name": "range",
    "value": "",
    "nameSize": 5,
    "totalSize": 37
  },
  {
    "name": "referer",
    "value": "",
    "nameSize": 7,
    "totalSize": 39
  },
  {
    "name": "refresh",
    "value": "",
    "nameSize": 7,
    "totalSize": 39
  },
  {
    "name": "retry-after",
    "value": "",
    "nameSize": 11,
    "totalSize": 43
  },
  {
    "name": "server",
    "value": "",
    "nameSize": 6,
    "totalSize": 38
  },
  {
    "name": "set-cookie",
    "value": "",
    "nameSize": 10,
    "totalSize": 42
  },
  {
    "name": "strict-transport-security",
    "value": "",
    "nameSize": 25,
    "totalSize": 57
  },
  {
    "name": "transfer-encoding",
    "value": "",
    "nameSize": 17,
    "totalSize": 49
  },
  {
    "name": "user-agent",
    "value": "",
    "nameSize": 10,
    "totalSize": 42
  },
  {
    "name": "vary",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "via",
    "value": "",
    "nameSize": 3,
    "totalSize": 35
  },
  {
    "name": "www-authenticate",
    "value": "",
    "nameSize": 16,
    "totalSize": 48
  }
];
var map = {
  ":authority": {
    "index": 1,
    "values": {
      "": 1
    }
  },
  ":method": {
    "index": 2,
    "values": {
      "GET": 2,
      "POST": 3
    }
  },
  ":path": {
    "index": 4,
    "values": {
      "/": 4,
      "/index.html": 5
    }
  },
  ":scheme": {
    "index": 6,
    "values": {
      "http": 6,
      "https": 7
    }
  },
  ":status": {
    "index": 8,
    "values": {
      "200": 8,
      "204": 9,
      "206": 10,
      "304": 11,
      "400": 12,
      "404": 13,
      "500": 14
    }
  },
  "accept-charset": {
    "index": 15,
    "values": {
      "": 15
    }
  },
  "accept-encoding": {
    "index": 16,
    "values": {
      "gzip, deflate": 16
    }
  },
  "accept-language": {
    "index": 17,
    "values": {
      "": 17
    }
  },
  "accept-ranges": {
    "index": 18,
    "values": {
      "": 18
    }
  },
  "accept": {
    "index": 19,
    "values": {
      "": 19
    }
  },
  "access-control-allow-origin": {
    "index": 20,
    "values": {
      "": 20
    }
  },
  "age": {
    "index": 21,
    "values": {
      "": 21
    }
  },
  "allow": {
    "index": 22,
    "values": {
      "": 22
    }
  },
  "authorization": {
    "index": 23,
    "values": {
      "": 23
    }
  },
  "cache-control": {
    "index": 24,
    "values": {
      "": 24
    }
  },
  "content-disposition": {
    "index": 25,
    "values": {
      "": 25
    }
  },
  "content-encoding": {
    "index": 26,
    "values": {
      "": 26
    }
  },
  "content-language": {
    "index": 27,
    "values": {
      "": 27
    }
  },
  "content-length": {
    "index": 28,
    "values": {
      "": 28
    }
  },
  "content-location": {
    "index": 29,
    "values": {
      "": 29
    }
  },
  "content-range": {
    "index": 30,
    "values": {
      "": 30
    }
  },
  "content-type": {
    "index": 31,
    "values": {
      "": 31
    }
  },
  "cookie": {
    "index": 32,
    "values": {
      "": 32
    }
  },
  "date": {
    "index": 33,
    "values": {
      "": 33
    }
  },
  "etag": {
    "index": 34,
    "values": {
      "": 34
    }
  },
  "expect": {
    "index": 35,
    "values": {
      "": 35
    }
  },
  "expires": {
    "index": 36,
    "values": {
      "": 36
    }
  },
  "from": {
    "index": 37,
    "values": {
      "": 37
    }
  },
  "host": {
    "index": 38,
    "values": {
      "": 38
    }
  },
  "if-match": {
    "index": 39,
    "values": {
      "": 39
    }
  },
  "if-modified-since": {
    "index": 40,
    "values": {
      "": 40
    }
  },
  "if-none-match": {
    "index": 41,
    "values": {
      "": 41
    }
  },
  "if-range": {
    "index": 42,
    "values": {
      "": 42
    }
  },
  "if-unmodified-since": {
    "index": 43,
    "values": {
      "": 43
    }
  },
  "last-modified": {
    "index": 44,
    "values": {
      "": 44
    }
  },
  "link": {
    "index": 45,
    "values": {
      "": 45
    }
  },
  "location": {
    "index": 46,
    "values": {
      "": 46
    }
  },
  "max-forwards": {
    "index": 47,
    "values": {
      "": 47
    }
  },
  "proxy-authenticate": {
    "index": 48,
    "values": {
      "": 48
    }
  },
  "proxy-authorization": {
    "index": 49,
    "values": {
      "": 49
    }
  },
  "range": {
    "index": 50,
    "values": {
      "": 50
    }
  },
  "referer": {
    "index": 51,
    "values": {
      "": 51
    }
  },
  "refresh": {
    "index": 52,
    "values": {
      "": 52
    }
  },
  "retry-after": {
    "index": 53,
    "values": {
      "": 53
    }
  },
  "server": {
    "index": 54,
    "values": {
      "": 54
    }
  },
  "set-cookie": {
    "index": 55,
    "values": {
      "": 55
    }
  },
  "strict-transport-security": {
    "index": 56,
    "values": {
      "": 56
    }
  },
  "transfer-encoding": {
    "index": 57,
    "values": {
      "": 57
    }
  },
  "user-agent": {
    "index": 58,
    "values": {
      "": 58
    }
  },
  "vary": {
    "index": 59,
    "values": {
      "": 59
    }
  },
  "via": {
    "index": 60,
    "values": {
      "": 60
    }
  },
  "www-authenticate": {
    "index": 61,
    "values": {
      "": 61
    }
  }
};

var staticTable = {
	table: table,
	map: map
};

var utils$1 = hpack_1.utils;
var assert$1 = utils$1.assert;

function Table(options) {
  this['static'] = hpack_1['static-table'];
  this.dynamic = [];
  this.size = 0;
  this.maxSize = 0;
  this.length = this['static'].table.length;
  this.protocolMaxSize = options.maxSize;
  this.maxSize = this.protocolMaxSize;
  this.lookupDepth = options.lookupDepth || 32;
}
var table$1 = Table;

Table.create = function create(options) {
  return new Table(options);
};

Table.prototype.lookup = function lookup(index) {
  assert$1(index !== 0, 'Zero indexed field');
  assert$1(index <= this.length, 'Indexed field OOB');

  if (index <= this['static'].table.length)
    return this['static'].table[index - 1];
  else
    return this.dynamic[this.length - index];
};

Table.prototype.reverseLookup = function reverseLookup(name, value) {
  var staticEntry = this['static'].map[name];
  if (staticEntry && staticEntry.values[value])
    return staticEntry.values[value];

  // Reverse search dynamic table (new items are at the end of it)
  var limit = Math.max(0, this.dynamic.length - this.lookupDepth);
  for (var i = this.dynamic.length - 1; i >= limit; i--) {
    var entry = this.dynamic[i];
    if (entry.name === name && entry.value === value)
      return this.length - i;

    if (entry.name === name) {
      // Prefer smaller index
      if (staticEntry)
        break;
      return -(this.length - i);
    }
  }

  if (staticEntry)
    return -staticEntry.index;

  return 0;
};

Table.prototype.add = function add(name, value, nameSize, valueSize) {
  var totalSize = nameSize + valueSize + 32;

  this.dynamic.push({
    name: name,
    value: value,
    nameSize: nameSize,
    totalSize: totalSize
  });
  this.size += totalSize;
  this.length++;

  this.evict();
};

Table.prototype.evict = function evict() {
  while (this.size > this.maxSize) {
    var entry = this.dynamic.shift();
    this.size -= entry.totalSize;
    this.length--;
  }
  assert$1(this.size >= 0, 'Table size sanity check failed');
};

Table.prototype.updateSize = function updateSize(size) {
  assert$1(size <= this.protocolMaxSize, 'Table size bigger than maximum');
  this.maxSize = size;
  this.evict();
};

var Buffer$1 = buffer.Buffer;

function OffsetBuffer() {
  this.offset = 0;
  this.size = 0;
  this.buffers = [];
}
var obuf = OffsetBuffer;

OffsetBuffer.prototype.isEmpty = function isEmpty() {
  return this.size === 0;
};

OffsetBuffer.prototype.clone = function clone(size) {
  var r = new OffsetBuffer();
  r.offset = this.offset;
  r.size = size;
  r.buffers = this.buffers.slice();
  return r;
};

OffsetBuffer.prototype.toChunks = function toChunks() {
  if (this.size === 0)
    return [];

  // We are going to slice it anyway
  if (this.offset !== 0) {
    this.buffers[0] = this.buffers[0].slice(this.offset);
    this.offset = 0;
  }

  var chunks = [ ];
  var off = 0;
  for (var i = 0; off <= this.size && i < this.buffers.length; i++) {
    var buf = this.buffers[i];
    off += buf.length;

    // Slice off last buffer
    if (off > this.size) {
      buf = buf.slice(0, buf.length - (off - this.size));
      this.buffers[i] = buf;
    }

    chunks.push(buf);
  }

  // If some buffers were skipped - trim length
  if (i < this.buffers.length)
    this.buffers.length = i;

  return chunks;
};

OffsetBuffer.prototype.toString = function toString(enc) {
  return this.toChunks().map(function(c) {
    return c.toString(enc);
  }).join('');
};

OffsetBuffer.prototype.use = function use(buf, off, n) {
  this.buffers = [ buf ];
  this.offset = off;
  this.size = n;
};

OffsetBuffer.prototype.push = function push(data) {
  // Ignore empty writes
  if (data.length === 0)
    return;

  this.size += data.length;
  this.buffers.push(data);
};

OffsetBuffer.prototype.has = function has(n) {
  return this.size >= n;
};

OffsetBuffer.prototype.skip = function skip(n) {
  if (this.size === 0)
    return;

  this.size -= n;

  // Fast case, skip bytes in a first buffer
  if (this.offset + n < this.buffers[0].length) {
    this.offset += n;
    return;
  }

  var left = n - (this.buffers[0].length - this.offset);
  this.offset = 0;

  for (var shift = 1; left > 0 && shift < this.buffers.length; shift++) {
    var buf = this.buffers[shift];
    if (buf.length > left) {
      this.offset = left;
      break;
    }
    left -= buf.length;
  }
  this.buffers = this.buffers.slice(shift);
};

OffsetBuffer.prototype.copy = function copy(target, targetOff, off, n) {
  if (this.size === 0)
    return;
  if (off !== 0)
    throw new Error('Unsupported offset in .copy()');

  var toff = targetOff;
  var first = this.buffers[0];
  var toCopy = Math.min(n, first.length - this.offset);
  first.copy(target, toff, this.offset, this.offset + toCopy);

  toff += toCopy;
  var left = n - toCopy;
  for (var i = 1; left > 0 && i < this.buffers.length; i++) {
    var buf = this.buffers[i];
    var toCopy = Math.min(left, buf.length);

    buf.copy(target, toff, 0, toCopy);

    toff += toCopy;
    left -= toCopy;
  }
};

OffsetBuffer.prototype.take = function take(n) {
  if (n === 0)
    return new Buffer$1(0);

  this.size -= n;

  // Fast cases
  var first = this.buffers[0].length - this.offset;
  if (first === n) {
    var r = this.buffers.shift();
    if (this.offset !== 0) {
      r = r.slice(this.offset);
      this.offset = 0;
    }
    return r;
  } else if (first > n) {
    var r = this.buffers[0].slice(this.offset, this.offset + n);
    this.offset += n;
    return r;
  }

  // Allocate and fill buffer
  var out = new Buffer$1(n);
  var toOff = 0;
  var startOff = this.offset;
  for (var i = 0; toOff !== n && i < this.buffers.length; i++) {
    var buf = this.buffers[i];
    var toCopy = Math.min(buf.length - startOff, n - toOff);

    buf.copy(out, toOff, startOff, startOff + toCopy);
    if (startOff + toCopy < buf.length) {
      this.offset = startOff + toCopy;
      break;
    } else {
      toOff += toCopy;
      startOff = 0;
    }
  }

  this.buffers = this.buffers.slice(i);
  if (this.buffers.length === 0)
    this.offset = 0;

  return out;
};

OffsetBuffer.prototype.peekUInt8 = function peekUInt8() {
  return this.buffers[0][this.offset];
};

OffsetBuffer.prototype.readUInt8 = function readUInt8() {
  this.size -= 1;
  var first = this.buffers[0];
  var r = first[this.offset];
  if (++this.offset === first.length) {
    this.offset = 0;
    this.buffers.shift();
  }

  return r;
};

OffsetBuffer.prototype.readUInt16LE = function readUInt16LE() {
  var first = this.buffers[0];
  this.size -= 2;

  var r;
  var shift;

  // Fast case - first buffer has all bytes
  if (first.length - this.offset >= 2) {
    r = first.readUInt16LE(this.offset);
    shift = 0;
    this.offset += 2;

  // One byte here - one byte there
  } else {
    r = first[this.offset] | (this.buffers[1][0] << 8);
    shift = 1;
    this.offset = 1;
  }

  if (this.offset === this.buffers[shift].length) {
    this.offset = 0;
    shift++;
  }
  if (shift !== 0)
    this.buffers = this.buffers.slice(shift);

  return r;
};

OffsetBuffer.prototype.readUInt24LE = function readUInt24LE() {
  var first = this.buffers[0];

  var r;
  var shift;
  var firstHas = first.length - this.offset;

  // Fast case - first buffer has all bytes
  if (firstHas >= 3) {
    r = first.readUInt16LE(this.offset) | (first[this.offset + 2] << 16);
    shift = 0;
    this.offset += 3;

  // First buffer has 2 of 3 bytes
  } else if (firstHas >= 2) {
    r = first.readUInt16LE(this.offset) | (this.buffers[1][0] << 16);
    shift = 1;
    this.offset = 1;

  // Slow case: First buffer has 1 of 3 bytes
  } else {
    r = first[this.offset];
    this.offset = 0;
    this.buffers.shift();
    this.size -= 1;

    r |= this.readUInt16LE() << 8;
    return r;
  }

  this.size -= 3;
  if (this.offset === this.buffers[shift].length) {
    this.offset = 0;
    shift++;
  }
  if (shift !== 0)
    this.buffers = this.buffers.slice(shift);

  return r;
};

OffsetBuffer.prototype.readUInt32LE = function readUInt32LE() {
  var first = this.buffers[0];

  var r;
  var shift;
  var firstHas = first.length - this.offset;

  // Fast case - first buffer has all bytes
  if (firstHas >= 4) {
    r = first.readUInt32LE(this.offset);
    shift = 0;
    this.offset += 4;

  // First buffer has 3 of 4 bytes
  } else if (firstHas >= 3) {
    r = (first.readUInt16LE(this.offset) |
         (first[this.offset + 2] << 16)) +
        (this.buffers[1][0] * 0x1000000);
    shift = 1;
    this.offset = 1;

  // Slow case: First buffer has 2 of 4 bytes
  } else if (firstHas >= 2) {
    r = first.readUInt16LE(this.offset);
    this.offset = 0;
    this.buffers.shift();
    this.size -= 2;

    r += this.readUInt16LE() * 0x10000;
    return r;

  // Slow case: First buffer has 1 of 4 bytes
  } else {
    r = first[this.offset];
    this.offset = 0;
    this.buffers.shift();
    this.size -= 1;

    r += this.readUInt24LE() * 0x100;
    return r;
  }

  this.size -= 4;
  if (this.offset === this.buffers[shift].length) {
    this.offset = 0;
    shift++;
  }
  if (shift !== 0)
    this.buffers = this.buffers.slice(shift);

  return r;
};

OffsetBuffer.prototype.readUInt16BE = function readUInt16BE() {
  var r = this.readUInt16LE();

  return ((r & 0xff) << 8) | (r >> 8);
};

OffsetBuffer.prototype.readUInt24BE = function readUInt24BE() {
  var r = this.readUInt24LE();

  return ((r & 0xff) << 16) | (((r >> 8) & 0xff) << 8) | (r >> 16);
};

OffsetBuffer.prototype.readUInt32BE = function readUInt32BE() {
  var r = this.readUInt32LE();

  return (((r & 0xff) << 24) |
          (((r >>> 8) & 0xff) << 16) |
          (((r >>> 16) & 0xff) << 8) |
          (r >>> 24)) >>> 0;
};

// Signed number APIs

function signedInt8(num) {
  if (num >= 0x80)
    return -(0xff ^ num) - 1;
  else
    return num;
}

OffsetBuffer.prototype.peekInt8 = function peekInt8() {
  return signedInt8(this.peekUInt8());
};

OffsetBuffer.prototype.readInt8 = function readInt8() {
  return signedInt8(this.readUInt8());
};

function signedInt16(num) {
  if (num >= 0x8000)
    return -(0xffff ^ num) - 1;
  else
    return num;
}

OffsetBuffer.prototype.readInt16BE = function readInt16BE() {
  return signedInt16(this.readUInt16BE());
};

OffsetBuffer.prototype.readInt16LE = function readInt16LE() {
  return signedInt16(this.readUInt16LE());
};

function signedInt24(num) {
  if (num >= 0x800000)
    return -(0xffffff ^ num) - 1;
  else
    return num;
}

OffsetBuffer.prototype.readInt24BE = function readInt24BE() {
  return signedInt24(this.readUInt24BE());
};

OffsetBuffer.prototype.readInt24LE = function readInt24LE() {
  return signedInt24(this.readUInt24LE());
};

function signedInt32(num) {
  if (num >= 0x80000000)
    return -(0xffffffff ^ num) - 1;
  else
    return num;
}

OffsetBuffer.prototype.readInt32BE = function readInt32BE() {
  return signedInt32(this.readUInt32BE());
};

OffsetBuffer.prototype.readInt32LE = function readInt32LE() {
  return signedInt32(this.readUInt32LE());
};

var utils$2 = hpack_1.utils;
var huffman$1 = hpack_1.huffman.decode;
var assert$2 = utils$2.assert;



function Decoder() {
  this.buffer = new obuf();
  this.bitOffset = 0;

  // Used internally in decodeStr
  this._huffmanNode = null;
}
var decoder = Decoder;

Decoder.create = function create() {
  return new Decoder();
};

Decoder.prototype.isEmpty = function isEmpty() {
  return this.buffer.isEmpty();
};

Decoder.prototype.push = function push(chunk) {
  this.buffer.push(chunk);
};

Decoder.prototype.decodeBit = function decodeBit() {
  // Need at least one octet
  assert$2(this.buffer.has(1), 'Buffer too small for an int');

  var octet;
  var offset = this.bitOffset;

  if (++this.bitOffset === 8) {
    octet = this.buffer.readUInt8();
    this.bitOffset = 0;
  } else {
    octet = this.buffer.peekUInt8();
  }
  return (octet >>> (7 - offset)) & 1;
};

// Just for testing
Decoder.prototype.skipBits = function skipBits(n) {
  this.bitOffset += n;
  this.buffer.skip(this.bitOffset >> 3);
  this.bitOffset &= 0x7;
};

Decoder.prototype.decodeInt = function decodeInt() {
  // Need at least one octet
  assert$2(this.buffer.has(1), 'Buffer too small for an int');

  var prefix = 8 - this.bitOffset;

  // We are going to end up octet-aligned
  this.bitOffset = 0;

  var max = (1 << prefix) - 1;
  var octet = this.buffer.readUInt8() & max;

  // Fast case - int fits into the prefix
  if (octet !== max)
    return octet;

  // TODO(indutny): what about > 32bit numbers?
  var res = 0;
  var isLast = false;
  var len = 0;
  do {
    octet = this.buffer.readUInt8();
    isLast = (octet & 0x80) === 0;

    res <<= 7;
    res |= octet & 0x7f;
    len++;
  } while (!isLast);
  assert$2(isLast, 'Incomplete data for multi-octet integer');
  assert$2(len <= 4, 'Integer does not fit into 32 bits');

  // Reverse bits
  res = (res >>> 21) |
        (((res >> 14) & 0x7f) << 7) |
        (((res >> 7) & 0x7f) << 14) |
        ((res & 0x7f) << 21);
  res >>= (4 - len) * 7;

  // Append prefix max
  res += max;

  return res;
};

Decoder.prototype.decodeHuffmanWord = function decodeHuffmanWord(input,
                                                                 inputBits,
                                                                 out) {
  var root = huffman$1;
  var node = this._huffmanNode;
  var word = input;
  var bits = inputBits;

  for (; bits > 0; word &= (1 << bits) - 1) {
    // Nudge the word bit length to match it
    for (var i = Math.max(0, bits - 8); i < bits; i++) {
      var subnode = node[word >>> i];
      if (typeof subnode !== 'number') {
        node = subnode;
        bits = i;
        break;
      }

      if (subnode === 0)
        continue;

      // Word bit length should match
      if ((subnode >>> 9) !== bits - i) {
        subnode = 0;
        continue;
      }

      var octet = subnode & 0x1ff;
      assert$2(octet !== 256, 'EOS in encoding');
      out.push(octet);
      node = root;

      bits = i;
      break;
    }
    if (subnode === 0)
      break;
  }
  this._huffmanNode = node;

  return bits;
};

Decoder.prototype.decodeStr = function decodeStr() {
  var isHuffman = this.decodeBit();
  var len = this.decodeInt();
  assert$2(this.buffer.has(len), 'Not enough octets for string');

  if (!isHuffman)
    return this.buffer.take(len);

  this._huffmanNode = huffman$1;

  var out = [];

  var word = 0;
  var bits = 0;
  for (var i = 0; i < len; i++) {
    word <<= 8;
    word |= this.buffer.readUInt8();
    bits += 8;

    bits = this.decodeHuffmanWord(word, bits, out);
    word &= (1 << bits) - 1;
  }
  assert$2(this._huffmanNode === huffman$1, '8-bit EOS');
  assert$2(word + 1 === (1 << bits), 'Final sequence is not EOS');

  this._huffmanNode = null;

  return out;
};

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
  var util = util$6;
  /* istanbul ignore next */
  if (typeof util.inherits !== 'function') throw '';
  module.exports = util.inherits;
} catch (e) {
  /* istanbul ignore next */
  module.exports = inherits_browser;
}
});

var processNextickArgs = createCommonjsModule(function (module) {

if (typeof process === 'undefined' ||
    !process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}
});

var toString = {}.toString;

var isarray = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

var stream = stream$1;

var safeBuffer = createCommonjsModule(function (module, exports) {
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

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
var isArray_1 = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
var isBoolean_1 = isBoolean;

function isNull(arg) {
  return arg === null;
}
var isNull_1 = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
var isNullOrUndefined_1 = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
var isNumber_1 = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
var isString_1 = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
var isSymbol_1 = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
var isUndefined_1 = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
var isRegExp_1 = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
var isObject_1 = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
var isDate_1 = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
var isError_1 = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
var isFunction_1 = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
var isPrimitive_1 = isPrimitive;

var isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

var util = {
	isArray: isArray_1,
	isBoolean: isBoolean_1,
	isNull: isNull_1,
	isNullOrUndefined: isNullOrUndefined_1,
	isNumber: isNumber_1,
	isString: isString_1,
	isSymbol: isSymbol_1,
	isUndefined: isUndefined_1,
	isRegExp: isRegExp_1,
	isObject: isObject_1,
	isDate: isDate_1,
	isError: isError_1,
	isFunction: isFunction_1,
	isPrimitive: isPrimitive_1,
	isBuffer: isBuffer
};

var BufferList = createCommonjsModule(function (module) {

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = safeBuffer.Buffer;


function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util$6 && util$6.inspect && util$6.inspect.custom) {
  module.exports.prototype[util$6.inspect.custom] = function () {
    var obj = util$6.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
});

/*<replacement>*/


/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      processNextickArgs.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      processNextickArgs.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

var destroy_1 = {
  destroy: destroy,
  undestroy: undestroy
};

/**
 * For Node.js, simply re-export the core `util.deprecate` function.
 */

var node = util$6.deprecate;

/*<replacement>*/


/*</replacement>*/

var _stream_writable = Writable;

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextickArgs.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util$1 = Object.create(util);
util$1.inherits = inherits;
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: node
};
/*</replacement>*/

/*<replacement>*/

/*</replacement>*/

/*<replacement>*/

var Buffer$2 = safeBuffer.Buffer;
var OurUint8Array = commonjsGlobal.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer$2.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer$2.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/



util$1.inherits(Writable, stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || _stream_duplex;

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || _stream_duplex;

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextickArgs.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    processNextickArgs.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer$2.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer$2.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    processNextickArgs.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    processNextickArgs.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      processNextickArgs.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextickArgs.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroy_1.destroy;
Writable.prototype._undestroy = destroy_1.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};

/*<replacement>*/


/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

var _stream_duplex = Duplex$1;

/*<replacement>*/
var util$2 = Object.create(util);
util$2.inherits = inherits;
/*</replacement>*/




util$2.inherits(Duplex$1, _stream_readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(_stream_writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex$1.prototype[method]) Duplex$1.prototype[method] = _stream_writable.prototype[method];
  }
}

function Duplex$1(options) {
  if (!(this instanceof Duplex$1)) return new Duplex$1(options);

  _stream_readable.call(this, options);
  _stream_writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex$1.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextickArgs.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex$1.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex$1.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  processNextickArgs.nextTick(cb, err);
};

/*<replacement>*/

var Buffer$3 = safeBuffer.Buffer;
/*</replacement>*/

var isEncoding = Buffer$3.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
}
// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer$3.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
var StringDecoder_1 = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer$3.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}

var string_decoder = {
	StringDecoder: StringDecoder_1
};

/*<replacement>*/


/*</replacement>*/

var _stream_readable = Readable;

/*<replacement>*/

/*</replacement>*/

/*<replacement>*/
var Duplex$2;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = events.EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/

/*</replacement>*/

/*<replacement>*/

var Buffer$4 = safeBuffer.Buffer;
var OurUint8Array$1 = commonjsGlobal.Uint8Array || function () {};
function _uint8ArrayToBuffer$1(chunk) {
  return Buffer$4.from(chunk);
}
function _isUint8Array$1(obj) {
  return Buffer$4.isBuffer(obj) || obj instanceof OurUint8Array$1;
}

/*</replacement>*/

/*<replacement>*/
var util$3 = Object.create(util);
util$3.inherits = inherits;
/*</replacement>*/

/*<replacement>*/

var debug = void 0;
if (util$6 && util$6.debuglog) {
  debug = util$6.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/



var StringDecoder$1;

util$3.inherits(Readable, stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isarray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex$2 = Duplex$2 || _stream_duplex;

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex$2;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder$1) StringDecoder$1 = string_decoder.StringDecoder;
    this.decoder = new StringDecoder$1(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex$2 = Duplex$2 || _stream_duplex;

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroy_1.destroy;
Readable.prototype._undestroy = destroy_1.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer$4.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer$4.prototype) {
        chunk = _uint8ArrayToBuffer$1(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array$1(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder$1) StringDecoder$1 = string_decoder.StringDecoder;
  this._readableState.decoder = new StringDecoder$1(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextickArgs.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextickArgs.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) processNextickArgs.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        processNextickArgs.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextickArgs.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer$4.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextickArgs.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

var _stream_transform = Transform;



/*<replacement>*/
var util$4 = Object.create(util);
util$4.inherits = inherits;
/*</replacement>*/

util$4.inherits(Transform, _stream_duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  _stream_duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish$1);
}

function prefinish$1() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return _stream_duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  _stream_duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}

var _stream_passthrough = PassThrough;



/*<replacement>*/
var util$5 = Object.create(util);
util$5.inherits = inherits;
/*</replacement>*/

util$5.inherits(PassThrough, _stream_transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  _stream_transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

var readable = createCommonjsModule(function (module, exports) {
if (process.env.READABLE_STREAM === 'disable' && stream$1) {
  module.exports = stream$1;
  exports = module.exports = stream$1.Readable;
  exports.Readable = stream$1.Readable;
  exports.Writable = stream$1.Writable;
  exports.Duplex = stream$1.Duplex;
  exports.Transform = stream$1.Transform;
  exports.PassThrough = stream$1.PassThrough;
  exports.Stream = stream$1;
} else {
  exports = module.exports = _stream_readable;
  exports.Stream = stream$1 || exports;
  exports.Readable = exports;
  exports.Writable = _stream_writable;
  exports.Duplex = _stream_duplex;
  exports.Transform = _stream_transform;
  exports.PassThrough = _stream_passthrough;
}
});

var utils$3 = hpack_1.utils;
var decoder$1 = hpack_1.decoder;
var table$2 = hpack_1.table;
var assert$3 = utils$3.assert;


var Duplex$3 = readable.Duplex;

function Decompressor(options) {
  Duplex$3.call(this, {
    readableObjectMode: true
  });

  this._decoder = decoder$1.create();
  this._table = table$2.create(options.table);
}
inherits(Decompressor, Duplex$3);
var decompressor = Decompressor;

Decompressor.create = function create(options) {
  return new Decompressor(options);
};

Decompressor.prototype._read = function _read() {
  // We only push!
};

Decompressor.prototype._write = function _write(data, enc, cb) {
  this._decoder.push(data);

  cb(null);
};

Decompressor.prototype.execute = function execute(cb) {
  while (!this._decoder.isEmpty()) {
    try {
      this._execute();
    } catch (err) {
      if (cb)
        return done(err);
      else
        return this.emit('error', err);
    }
  }

  if (cb)
    done(null);

  function done(err) {
    process.nextTick(function() {
      cb(err);
    });
  }
};

Decompressor.prototype.updateTableSize = function updateTableSize(size) {
  this._table.updateSize(size);
};

Decompressor.prototype._execute = function _execute() {
  var isIndexed = this._decoder.decodeBit();
  if (isIndexed)
    return this._processIndexed();

  var isIncremental = this._decoder.decodeBit();
  var neverIndex = 0;
  if (!isIncremental) {
    var isUpdate = this._decoder.decodeBit();
    if (isUpdate)
      return this._processUpdate();

    neverIndex = this._decoder.decodeBit();
  }

  this._processLiteral(isIncremental, neverIndex);
};

Decompressor.prototype._processIndexed = function _processIndexed() {
  var index = this._decoder.decodeInt();

  var lookup = this._table.lookup(index);
  this.push({ name: lookup.name, value: lookup.value, neverIndex: false });
};

Decompressor.prototype._processLiteral = function _processLiteral(inc, never) {
  var index = this._decoder.decodeInt();

  var name;
  var nameSize;

  // Literal header-name too
  if (index === 0) {
    name = this._decoder.decodeStr();
    nameSize = name.length;
    name = utils$3.stringify(name);
  } else {
    var lookup = this._table.lookup(index);
    nameSize = lookup.nameSize;
    name = lookup.name;
  }

  var value = this._decoder.decodeStr();
  var valueSize = value.length;
  value = utils$3.stringify(value);

  if (inc)
    this._table.add(name, value, nameSize, valueSize);

  this.push({ name: name, value: value, neverIndex: never !== 0});
};

Decompressor.prototype._processUpdate = function _processUpdate() {
  var size = this._decoder.decodeInt();
  this.updateTableSize(size);
};

var minimalisticAssert = assert$4;

function assert$4(val, msg) {
  if (!val)
    throw new Error(msg || 'Assertion failed');
}

assert$4.equal = function assertEqual(l, r, msg) {
  if (l != r)
    throw new Error(msg || ('Assertion failed: ' + l + ' != ' + r));
};

var Buffer$5 = buffer.Buffer;

function WBuf() {
  this.buffers = [];
  this.toReserve = 0;
  this.size = 0;
  this.maxSize = 0;
  this.avail = 0;

  this.last = null;
  this.offset = 0;

  // Used in slicing
  this.sliceQueue = null;

  this.forceReserve = false;

  // Mostly a constant
  this.reserveRate = 64;
}
var wbuf = WBuf;

WBuf.prototype.reserve = function reserve(n) {
  this.toReserve += n;

  // Force reservation of extra bytes
  if (this.forceReserve)
    this.toReserve = Math.max(this.toReserve, this.reserveRate);
};

WBuf.prototype._ensure = function _ensure(n) {
  if (this.avail >= n)
    return;

  if (this.toReserve === 0)
    this.toReserve = this.reserveRate;

  this.toReserve = Math.max(n - this.avail, this.toReserve);

  if (this.avail === 0)
    this._next();
};

WBuf.prototype._next = function _next() {
  var buf;
  if (this.sliceQueue === null) {
    // Most common case
    buf = new Buffer$5(this.toReserve);
  } else {
    // Only for `.slice()` results
    buf = this.sliceQueue.shift();
    if (this.sliceQueue.length === 0)
      this.sliceQueue = null;
  }

  this.toReserve = 0;

  this.buffers.push(buf);
  this.avail = buf.length;
  this.offset = 0;
  this.last = buf;
};

WBuf.prototype._rangeCheck = function _rangeCheck() {
  if (this.maxSize !== 0 && this.size > this.maxSize)
    throw new RangeError('WBuf overflow');
};

WBuf.prototype._move = function _move(n) {
  this.size += n;
  if (this.avail === 0)
    this.last = null;

  this._rangeCheck();
};

WBuf.prototype.slice = function slice(start, end) {
  minimalisticAssert(0 <= start && start <= this.size);
  minimalisticAssert(0 <= end && end <= this.size);

  if (this.last === null)
    this._next();

  var res = new WBuf();

  // Only last chunk is requested
  if (start >= this.size - this.offset) {
    res.buffers.push(this.last);
    res.last = this.last;
    res.offset = start - this.size + this.offset;
    res.maxSize = end - start;
    res.avail = res.maxSize;

    return res;
  }

  var startIndex = -1;
  var startOffset = 0;
  var endIndex = -1;

  // Find buffer indices
  var offset = 0;
  for (var i = 0; i < this.buffers.length; i++) {
    var buf = this.buffers[i];
    var next = offset + buf.length;

    // Found the start
    if (start >= offset && start <= next) {
      startIndex = i;
      startOffset = start - offset;
      if (endIndex !== -1)
        break;
    }
    if (end >= offset && end <= next) {
      endIndex = i;
      if (startIndex !== -1)
        break;
    }

    offset = next;
  }

  res.last = this.buffers[startIndex];
  res.offset = startOffset;
  res.maxSize = end - start;

  // Multi-buffer slice
  if (startIndex < endIndex) {
    res.sliceQueue = this.buffers.slice(startIndex + 1, endIndex + 1);

    res.last = res.last.slice(res.offset);
    res.offset = 0;
  }

  res.avail = res.last.length - res.offset;
  res.buffers.push(res.last);

  return res;
};

WBuf.prototype.skip = function skip(n) {
  if (n === 0)
    return this.slice(this.size, this.size);

  this._ensure(n);

  var left = n;
  while (left > 0) {
    var toSkip = Math.min(left, this.avail);
    left -= toSkip;
    this.size += toSkip;
    if (toSkip === this.avail) {
      if (left !== 0) {
        this._next();
      } else {
        this.avail -= toSkip;
        this.offset += toSkip;
      }
    } else {
      this.offset += toSkip;
      this.avail -= toSkip;
    }
  }

  this._rangeCheck();

  return this.slice(this.size - n, this.size);
};

WBuf.prototype.write = function write(str) {
  var len = 0;
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c > 255)
      len += 2;
    else
      len += 1;
  }
  this.reserve(len);
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    var hi = c >>> 8;
    var lo = c & 0xff;

    if (hi)
      this.writeUInt8(hi);
    this.writeUInt8(lo);
  }
};

WBuf.prototype.copyFrom = function copyFrom(buf, start, end) {
  var off = start === undefined ? 0 : start;
  var len = end === undefined ? buf.length : end;
  if (off === len)
    return;

  this._ensure(len - off);
  while (off < len) {
    var toCopy = Math.min(len - off, this.avail);
    buf.copy(this.last, this.offset, off, off + toCopy);
    off += toCopy;
    this.size += toCopy;
    if (toCopy === this.avail) {
      if (off !== len) {
        this._next();
      } else {
        this.avail = 0;
        this.offset += toCopy;
      }
    } else {
      this.offset += toCopy;
      this.avail -= toCopy;
    }
  }

  this._rangeCheck();
};

WBuf.prototype.writeUInt8 = function writeUInt8(v) {
  this._ensure(1);

  this.last[this.offset++] = v;
  this.avail--;
  this._move(1);
};

WBuf.prototype.writeUInt16BE = function writeUInt16BE(v) {
  this._ensure(2);

  // Fast case - everything fits into the last buffer
  if (this.avail >= 2) {
    this.last.writeUInt16BE(v, this.offset);
    this.offset += 2;
    this.avail -= 2;

  // One byte here, one byte there
  } else {
    this.last[this.offset] = (v >>> 8);
    this._next();
    this.last[this.offset++] = v & 0xff;
    this.avail--;
  }

  this._move(2);
};

WBuf.prototype.writeUInt24BE = function writeUInt24BE(v) {
  this._ensure(3);

  // Fast case - everything fits into the last buffer
  if (this.avail >= 3) {
    this.last.writeUInt16BE(v >>> 8, this.offset);
    this.last[this.offset + 2] = v & 0xff;
    this.offset += 3;
    this.avail -= 3;
    this._move(3);

  // Two bytes here
  } else if (this.avail >= 2) {
    this.last.writeUInt16BE(v >>> 8, this.offset);
    this._next();
    this.last[this.offset++] = v & 0xff;
    this.avail--;
    this._move(3);

  // Just one byte here
  } else {
    this.last[this.offset] = v >>> 16;
    this._move(1);
    this._next();
    this.writeUInt16BE(v & 0xffff);
  }
};

WBuf.prototype.writeUInt32BE = function writeUInt32BE(v) {
  this._ensure(4);

  // Fast case - everything fits into the last buffer
  if (this.avail >= 4) {
    this.last.writeUInt32BE(v, this.offset);
    this.offset += 4;
    this.avail -= 4;
    this._move(4);

  // Three bytes here
  } else if (this.avail >= 3) {
    this.writeUInt24BE(v >>> 8);
    this._next();
    this.last[this.offset++] = v & 0xff;
    this.avail--;
    this._move(1);

  // Slow case, who cares
  } else {
    this.writeUInt16BE(v >>> 16);
    this.writeUInt16BE(v & 0xffff);
  }
};

WBuf.prototype.writeUInt16LE = function writeUInt16LE(num) {
  var r = ((num & 0xff) << 8) | (num >>> 8);
  this.writeUInt16BE(r);
};

WBuf.prototype.writeUInt24LE = function writeUInt24LE(num) {
  var r = ((num & 0xff) << 16) | (((num >>> 8) & 0xff) << 8) | (num >>> 16);
  this.writeUInt24BE(r);
};

WBuf.prototype.writeUInt32LE = function writeUInt32LE(num) {
  this._ensure(4);

  // Fast case - everything fits into the last buffer
  if (this.avail >= 4) {
    this.last.writeUInt32LE(num, this.offset);
    this.offset += 4;
    this.avail -= 4;
    this._move(4);

  // Three bytes here
  } else if (this.avail >= 3) {
    this.writeUInt24LE(num & 0xffffff);
    this._next();
    this.last[this.offset++] = num >>> 24;
    this.avail--;
    this._move(1);

  // Slow case, who cares
  } else {
    this.writeUInt16LE(num & 0xffff);
    this.writeUInt16LE(num >>> 16);
  }
};

WBuf.prototype.render = function render() {
  var left = this.size;
  var out = [];

  for (var i = 0; i < this.buffers.length && left >= 0; i++) {
    var buf = this.buffers[i];
    left -= buf.length;
    if (left >= 0) {
      out.push(buf);
    } else {
      out.push(buf.slice(0, buf.length + left));
    }
  }

  return out;
};

// Signed APIs
WBuf.prototype.writeInt8 = function writeInt8(num) {
  if (num < 0)
    return this.writeUInt8(0x100 + num);
  else
    return this.writeUInt8(num);
};

function toUnsigned16(num) {
  if (num < 0)
    return 0x10000 + num;
  else
    return num;
}

WBuf.prototype.writeInt16LE = function writeInt16LE(num) {
  this.writeUInt16LE(toUnsigned16(num));
};

WBuf.prototype.writeInt16BE = function writeInt16BE(num) {
  this.writeUInt16BE(toUnsigned16(num));
};

function toUnsigned24(num) {
  if (num < 0)
    return 0x1000000 + num;
  else
    return num;
}

WBuf.prototype.writeInt24LE = function writeInt24LE(num) {
  this.writeUInt24LE(toUnsigned24(num));
};

WBuf.prototype.writeInt24BE = function writeInt24BE(num) {
  this.writeUInt24BE(toUnsigned24(num));
};

function toUnsigned32(num) {
  if (num < 0)
    return (0xffffffff + num) + 1;
  else
    return num;
}

WBuf.prototype.writeInt32LE = function writeInt32LE(num) {
  this.writeUInt32LE(toUnsigned32(num));
};

WBuf.prototype.writeInt32BE = function writeInt32BE(num) {
  this.writeUInt32BE(toUnsigned32(num));
};

WBuf.prototype.writeComb = function writeComb(size, endian, value) {
  if (size === 1)
    return this.writeUInt8(value);

  if (endian === 'le') {
    if (size === 2)
      this.writeUInt16LE(value);
    else if (size === 3)
      this.writeUInt24LE(value);
    else if (size === 4)
      this.writeUInt32LE(value);
  } else {
    if (size === 2)
      this.writeUInt16BE(value);
    else if (size === 3)
      this.writeUInt24BE(value);
    else if (size === 4)
      this.writeUInt32BE(value);
  }
};

var utils$4 = hpack_1.utils;
var huffman$2 = hpack_1.huffman.encode;
var assert$5 = utils$4.assert;



function Encoder() {
  this.buffer = new wbuf();
  this.word = 0;
  this.bitOffset = 0;
}
var encoder = Encoder;

Encoder.create = function create() {
  return new Encoder();
};

Encoder.prototype.render = function render() {
  return this.buffer.render();
};

Encoder.prototype.encodeBit = function encodeBit(bit) {

  this.word <<= 1;
  this.word |= bit;
  this.bitOffset++;

  if (this.bitOffset === 8) {
    this.buffer.writeUInt8(this.word);
    this.word = 0;
    this.bitOffset = 0;
  }
};

Encoder.prototype.encodeBits = function encodeBits(bits, len) {
  var left = bits;
  var leftLen = len;

  while (leftLen > 0) {
    var avail = Math.min(leftLen, 8 - this.bitOffset);
    var toWrite = left >>> (leftLen - avail);

    if (avail === 8) {
      this.buffer.writeUInt8(toWrite);
    } else {
      this.word <<= avail;
      this.word |= toWrite;
      this.bitOffset += avail;
      if (this.bitOffset === 8) {
        this.buffer.writeUInt8(this.word);
        this.word = 0;
        this.bitOffset = 0;
      }
    }

    leftLen -= avail;
    left &= (1 << leftLen) - 1;
  }
};

// Just for testing
Encoder.prototype.skipBits = function skipBits(num) {
  this.bitOffset += num;
  this.buffer.skip(this.bitOffset >> 3);
  this.bitOffset &= 0x7;
};

Encoder.prototype.encodeInt = function encodeInt(num) {
  var prefix = 8 - this.bitOffset;

  // We are going to end up octet-aligned
  this.bitOffset = 0;

  var max = (1 << prefix) - 1;

  // Fast case - int fits into the prefix
  if (num < max) {
    this.buffer.writeUInt8((this.word << prefix) | num);
    return octet;
  }

  var left = num - max;
  this.buffer.writeUInt8((this.word << prefix) | max);
  do {
    var octet = left & 0x7f;
    left >>= 7;
    if (left !== 0)
      octet |= 0x80;

    this.buffer.writeUInt8(octet);
  } while (left !== 0);
};

Encoder.prototype.encodeStr = function encodeStr(value, isHuffman) {
  this.encodeBit(isHuffman ? 1 : 0);

  if (!isHuffman) {
    this.buffer.reserve(value.length + 1);
    this.encodeInt(value.length);
    for (var i = 0; i < value.length; i++)
      this.buffer.writeUInt8(value[i]);
    return;
  }

  var codes = [];
  var len = 0;
  var pad = 0;

  for (var i = 0; i < value.length; i++) {
    var code = huffman$2[value[i]];
    codes.push(code);
    len += code[0];
  }
  if (len % 8 !== 0)
    pad = 8 - (len % 8);
  len += pad;

  this.buffer.reserve((len / 8) + 1);
  this.encodeInt(len / 8);
  for (var i = 0; i < codes.length; i++) {
    var code = codes[i];
    this.encodeBits(code[1], code[0]);
  }

  // Append padding
  this.encodeBits(0xff >>> (8 - pad), pad);
};

var utils$5 = hpack_1.utils;
var encoder$1 = hpack_1.encoder;
var table$3 = hpack_1.table;
var assert$6 = utils$5.assert;


var Duplex$4 = readable.Duplex;

function Compressor(options) {
  Duplex$4.call(this, {
    writableObjectMode: true
  });

  this._encoder = null;
  this._table = table$3.create(options.table);
}
inherits(Compressor, Duplex$4);
var compressor = Compressor;

Compressor.create = function create(options) {
  return new Compressor(options);
};

Compressor.prototype._read = function _read() {
  // We only push!
};

Compressor.prototype._write = function _write(data, enc, cb) {
  assert$6(Array.isArray(data), 'Compressor.write() expects list of headers');

  this._encoder = encoder$1.create();
  for (var i = 0; i < data.length; i++)
    this._encodeHeader(data[i]);

  var data = this._encoder.render();
  this._encoder = null;

  cb(null);
  for (var i = 0; i < data.length; i++)
    this.push(data[i]);
};

Compressor.prototype.updateTableSize = function updateTableSize(size) {
  if (size >= this._table.protocolMaxSize) {
    size = this._table.protocolMaxSize;

    var enc = encoder$1.create();

    // indexed = 0
    // incremental = 0
    // update = 1
    enc.encodeBits(1, 3);
    enc.encodeInt(size);

    var data = enc.render();
    for (var i = 0; i < data.length; i++)
      this.push(data[i]);
  }

  this._table.updateSize(size);
};

Compressor.prototype.reset = function reset() {
  var enc = encoder$1.create();
  var size = this._table.maxSize;

  // indexed = 0
  // incremental = 0
  // update = 1
  enc.encodeBits(1, 3);
  enc.encodeInt(0);

  // Evict everything
  this._table.updateSize(0);

  // indexed = 0
  // incremental = 0
  // update = 1
  enc.encodeBits(1, 3);
  enc.encodeInt(size);

  // Revert size
  this._table.updateSize(size);

  var data = enc.render();
  for (var i = 0; i < data.length; i++)
    this.push(data[i]);
};

Compressor.prototype._encodeHeader = function _encodeHeader(header) {
  if (header.neverIndex) {
    var index = 0;
    var neverIndex = 1;
    var isIndexed = 0;
    var isIncremental = 0;
  } else {
    var index = this._table.reverseLookup(header.name, header.value);
    var isIndexed = index > 0;
    var isIncremental = header.incremental !== false;
    var neverIndex = 0;
  }

  this._encoder.encodeBit(isIndexed);
  if (isIndexed) {
    this._encoder.encodeInt(index);
    return;
  }

  var name = utils$5.toArray(header.name);
  var value = utils$5.toArray(header.value);

  this._encoder.encodeBit(isIncremental);
  if (isIncremental) {
    this._table.add(header.name, header.value, name.length, value.length);
  } else {
    // Update = false
    this._encoder.encodeBit(0);
    this._encoder.encodeBit(neverIndex);
  }

  // index is negative for `name`-only headers
  this._encoder.encodeInt(-index);
  if (index === 0)
    this._encoder.encodeStr(name, header.huffman !== false);
  this._encoder.encodeStr(value, header.huffman !== false);
};

var hpack_1 = createCommonjsModule(function (module, exports) {
var hpack = exports;

hpack.utils = utils;
hpack.huffman = huffman;
hpack['static-table'] = staticTable;
hpack.table = table$1;

hpack.decoder = decoder;
hpack.decompressor = decompressor;

hpack.encoder = encoder;
hpack.compressor = compressor;
});
