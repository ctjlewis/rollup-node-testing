import util from 'util';

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

/* eslint complexity: [2, 18], max-statements: [2, 33] */
var shams = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

var origSymbol = commonjsGlobal.Symbol;


var hasSymbols = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return shams();
};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

var implementation = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var functionBind = Function.prototype.bind || implementation;

/* globals
	Atomics,
	SharedArrayBuffer,
*/

var undefined$1;

var $TypeError = TypeError;

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () { throw new $TypeError(); };
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols$1 = hasSymbols();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto
var generatorFunction =  undefined$1;
var asyncFunction =  undefined$1;
var asyncGenFunction =  undefined$1;

var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto(Uint8Array);

var INTRINSICS = {
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
	'%ArrayBufferPrototype%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer.prototype,
	'%ArrayIteratorPrototype%': hasSymbols$1 ? getProto([][Symbol.iterator]()) : undefined$1,
	'%ArrayPrototype%': Array.prototype,
	'%ArrayProto_entries%': Array.prototype.entries,
	'%ArrayProto_forEach%': Array.prototype.forEach,
	'%ArrayProto_keys%': Array.prototype.keys,
	'%ArrayProto_values%': Array.prototype.values,
	'%AsyncFromSyncIteratorPrototype%': undefined$1,
	'%AsyncFunction%': asyncFunction,
	'%AsyncFunctionPrototype%':  undefined$1,
	'%AsyncGenerator%':  undefined$1,
	'%AsyncGeneratorFunction%': asyncGenFunction,
	'%AsyncGeneratorPrototype%':  undefined$1,
	'%AsyncIteratorPrototype%':  undefined$1,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
	'%Boolean%': Boolean,
	'%BooleanPrototype%': Boolean.prototype,
	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
	'%DataViewPrototype%': typeof DataView === 'undefined' ? undefined$1 : DataView.prototype,
	'%Date%': Date,
	'%DatePrototype%': Date.prototype,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%ErrorPrototype%': Error.prototype,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%EvalErrorPrototype%': EvalError.prototype,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
	'%Float32ArrayPrototype%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array.prototype,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
	'%Float64ArrayPrototype%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array.prototype,
	'%Function%': Function,
	'%FunctionPrototype%': Function.prototype,
	'%Generator%':  undefined$1,
	'%GeneratorFunction%': generatorFunction,
	'%GeneratorPrototype%':  undefined$1,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
	'%Int8ArrayPrototype%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array.prototype,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
	'%Int16ArrayPrototype%': typeof Int16Array === 'undefined' ? undefined$1 : Int8Array.prototype,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
	'%Int32ArrayPrototype%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array.prototype,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols$1 ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
	'%JSONParse%': typeof JSON === 'object' ? JSON.parse : undefined$1,
	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$1 ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
	'%MapPrototype%': typeof Map === 'undefined' ? undefined$1 : Map.prototype,
	'%Math%': Math,
	'%Number%': Number,
	'%NumberPrototype%': Number.prototype,
	'%Object%': Object,
	'%ObjectPrototype%': Object.prototype,
	'%ObjProto_toString%': Object.prototype.toString,
	'%ObjProto_valueOf%': Object.prototype.valueOf,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
	'%PromisePrototype%': typeof Promise === 'undefined' ? undefined$1 : Promise.prototype,
	'%PromiseProto_then%': typeof Promise === 'undefined' ? undefined$1 : Promise.prototype.then,
	'%Promise_all%': typeof Promise === 'undefined' ? undefined$1 : Promise.all,
	'%Promise_reject%': typeof Promise === 'undefined' ? undefined$1 : Promise.reject,
	'%Promise_resolve%': typeof Promise === 'undefined' ? undefined$1 : Promise.resolve,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
	'%RangeError%': RangeError,
	'%RangeErrorPrototype%': RangeError.prototype,
	'%ReferenceError%': ReferenceError,
	'%ReferenceErrorPrototype%': ReferenceError.prototype,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
	'%RegExp%': RegExp,
	'%RegExpPrototype%': RegExp.prototype,
	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$1 ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
	'%SetPrototype%': typeof Set === 'undefined' ? undefined$1 : Set.prototype,
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
	'%SharedArrayBufferPrototype%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer.prototype,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols$1 ? getProto(''[Symbol.iterator]()) : undefined$1,
	'%StringPrototype%': String.prototype,
	'%Symbol%': hasSymbols$1 ? Symbol : undefined$1,
	'%SymbolPrototype%': hasSymbols$1 ? Symbol.prototype : undefined$1,
	'%SyntaxError%': SyntaxError,
	'%SyntaxErrorPrototype%': SyntaxError.prototype,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypedArrayPrototype%': TypedArray ? TypedArray.prototype : undefined$1,
	'%TypeError%': $TypeError,
	'%TypeErrorPrototype%': $TypeError.prototype,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
	'%Uint8ArrayPrototype%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array.prototype,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
	'%Uint8ClampedArrayPrototype%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray.prototype,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
	'%Uint16ArrayPrototype%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array.prototype,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
	'%Uint32ArrayPrototype%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array.prototype,
	'%URIError%': URIError,
	'%URIErrorPrototype%': URIError.prototype,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
	'%WeakMapPrototype%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap.prototype,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet,
	'%WeakSetPrototype%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet.prototype
};


var $replace = functionBind.call(Function.call, String.prototype.replace);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : (number || match);
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	if (!(name in INTRINSICS)) {
		throw new SyntaxError('intrinsic ' + name + ' does not exist!');
	}

	// istanbul ignore if // hopefully this is impossible to test :-)
	if (typeof INTRINSICS[name] === 'undefined' && !allowMissing) {
		throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
	}

	return INTRINSICS[name];
};

var GetIntrinsic = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);

	var value = getBaseIntrinsic('%' + (parts.length > 0 ? parts[0] : '') + '%', allowMissing);
	for (var i = 1; i < parts.length; i += 1) {
		if (value != null) {
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, parts[i]);
				if (!allowMissing && !(parts[i] in value)) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				value = desc ? (desc.get || desc.value) : value[parts[i]];
			} else {
				value = value[parts[i]];
			}
		}
	}
	return value;
};

var src = functionBind.call(Function.call, Object.prototype.hasOwnProperty);

var $assign = GetIntrinsic('%Object%').assign;

var assign = function assign(target, source) {
	if ($assign) {
		return $assign(target, source);
	}

	// eslint-disable-next-line no-restricted-syntax
	for (var key in source) {
		if (src(source, key)) {
			// eslint-disable-next-line no-param-reassign
			target[key] = source[key];
		}
	}
	return target;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.3

var ToNumber = function ToNumber(value) {
	return +value; // eslint-disable-line no-implicit-coercion
};

var isPrimitive = function isPrimitive(value) {
	return value === null || (typeof value !== 'function' && typeof value !== 'object');
};

var fnToStr = Function.prototype.toString;
var reflectApply = typeof Reflect === 'object' && Reflect !== null && Reflect.apply;
var badArrayLike;
var isCallableMarker;
if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
	try {
		badArrayLike = Object.defineProperty({}, 'length', {
			get: function () {
				throw isCallableMarker;
			}
		});
		isCallableMarker = {};
	} catch (_) {
		reflectApply = null;
	}
} else {
	reflectApply = null;
}

var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
	try {
		var fnStr = fnToStr.call(value);
		return constructorRegex.test(fnStr);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionToStr(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr$1 = Object.prototype.toString;
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

var isCallable = reflectApply
	? function isCallable(value) {
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		try {
			reflectApply(value, null, badArrayLike);
		} catch (e) {
			if (e !== isCallableMarker) { return false; }
		}
		return !isES6ClassFn(value);
	}
	: function isCallable(value) {
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (typeof value === 'function' && !value.prototype) { return true; }
		if (hasToStringTag) { return tryFunctionObject(value); }
		if (isES6ClassFn(value)) { return false; }
		var strClass = toStr$1.call(value);
		return strClass === fnClass || strClass === genClass;
	};

var toStr$2 = Object.prototype.toString;





// http://ecma-international.org/ecma-262/5.1/#sec-8.12.8
var ES5internalSlots = {
	'[[DefaultValue]]': function (O) {
		var actualHint;
		if (arguments.length > 1) {
			actualHint = arguments[1];
		} else {
			actualHint = toStr$2.call(O) === '[object Date]' ? String : Number;
		}

		if (actualHint === String || actualHint === Number) {
			var methods = actualHint === String ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
			var value, i;
			for (i = 0; i < methods.length; ++i) {
				if (isCallable(O[methods[i]])) {
					value = O[methods[i]]();
					if (isPrimitive(value)) {
						return value;
					}
				}
			}
			throw new TypeError('No default value');
		}
		throw new TypeError('invalid [[DefaultValue]] hint supplied');
	}
};

// http://ecma-international.org/ecma-262/5.1/#sec-9.1
var es5 = function ToPrimitive(input) {
	if (isPrimitive(input)) {
		return input;
	}
	if (arguments.length > 1) {
		return ES5internalSlots['[[DefaultValue]]'](input, arguments[1]);
	}
	return ES5internalSlots['[[DefaultValue]]'](input);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.1

var ToPrimitive = es5;

// https://www.ecma-international.org/ecma-262/5.1/#sec-8

var Type = function Type(x) {
	if (x === null) {
		return 'Null';
	}
	if (typeof x === 'undefined') {
		return 'Undefined';
	}
	if (typeof x === 'function' || typeof x === 'object') {
		return 'Object';
	}
	if (typeof x === 'number') {
		return 'Number';
	}
	if (typeof x === 'boolean') {
		return 'Boolean';
	}
	if (typeof x === 'string') {
		return 'String';
	}
};

// https://www.ecma-international.org/ecma-262/5.1/#sec-11.9.3

var AbstractEqualityComparison = function AbstractEqualityComparison(x, y) {
	var xType = Type(x);
	var yType = Type(y);
	if (xType === yType) {
		return x === y; // ES6+ specified this shortcut anyways.
	}
	if (x == null && y == null) {
		return true;
	}
	if (xType === 'Number' && yType === 'String') {
		return AbstractEqualityComparison(x, ToNumber(y));
	}
	if (xType === 'String' && yType === 'Number') {
		return AbstractEqualityComparison(ToNumber(x), y);
	}
	if (xType === 'Boolean') {
		return AbstractEqualityComparison(ToNumber(x), y);
	}
	if (yType === 'Boolean') {
		return AbstractEqualityComparison(x, ToNumber(y));
	}
	if ((xType === 'String' || xType === 'Number') && yType === 'Object') {
		return AbstractEqualityComparison(x, ToPrimitive(y));
	}
	if (xType === 'Object' && (yType === 'String' || yType === 'Number')) {
		return AbstractEqualityComparison(ToPrimitive(x), y);
	}
	return false;
};

var _isNaN = Number.isNaN || function isNaN(a) {
	return a !== a;
};

var $isNaN = Number.isNaN || function (a) { return a !== a; };

var _isFinite = Number.isFinite || function (x) { return typeof x === 'number' && !$isNaN(x) && x !== Infinity && x !== -Infinity; };

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || functionBind.call($call, $apply);

var callBind = function callBind() {
	return $reflectApply(functionBind, $call, arguments);
};

var apply = function applyBind() {
	return $reflectApply(functionBind, $apply, arguments);
};
callBind.apply = apply;

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

var callBound = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.')) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

var $strSlice = callBound('String.prototype.slice');

var isPrefixOf = function isPrefixOf(prefix, string) {
	if (prefix === string) {
		return true;
	}
	if (prefix.length > string.length) {
		return false;
	}
	return $strSlice(string, 0, prefix.length) === prefix;
};

var $Number = GetIntrinsic('%Number%');
var $TypeError$1 = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/5.1/#sec-11.8.5

// eslint-disable-next-line max-statements
var AbstractRelationalComparison = function AbstractRelationalComparison(x, y, LeftFirst) {
	if (Type(LeftFirst) !== 'Boolean') {
		throw new $TypeError$1('Assertion failed: LeftFirst argument must be a Boolean');
	}
	var px;
	var py;
	if (LeftFirst) {
		px = ToPrimitive(x, $Number);
		py = ToPrimitive(y, $Number);
	} else {
		py = ToPrimitive(y, $Number);
		px = ToPrimitive(x, $Number);
	}
	var bothStrings = Type(px) === 'String' && Type(py) === 'String';
	if (!bothStrings) {
		var nx = ToNumber(px);
		var ny = ToNumber(py);
		if (_isNaN(nx) || _isNaN(ny)) {
			return undefined;
		}
		if (_isFinite(nx) && _isFinite(ny) && nx === ny) {
			return false;
		}
		if (nx === 0 && ny === 0) {
			return false;
		}
		if (nx === Infinity) {
			return false;
		}
		if (ny === Infinity) {
			return true;
		}
		if (ny === -Infinity) {
			return false;
		}
		if (nx === -Infinity) {
			return true;
		}
		return nx < ny; // by now, these are both nonzero, finite, and not equal
	}
	if (isPrefixOf(py, px)) {
		return false;
	}
	if (isPrefixOf(px, py)) {
		return true;
	}
	return px < py; // both strings, neither a prefix of the other. shortcut for steps c-f
};

// https://www.ecma-international.org/ecma-262/5.1/#sec-11.9.6

var StrictEqualityComparison = function StrictEqualityComparison(x, y) {
	var xType = Type(x);
	var yType = Type(y);
	if (xType !== yType) {
		return false;
	}
	if (xType === 'Undefined' || xType === 'Null') {
		return true;
	}
	return x === y; // shortcut for steps 4-7
};

var $TypeError$2 = GetIntrinsic('%TypeError%');

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.10

var CheckObjectCoercible = function CheckObjectCoercible(value, optMessage) {
	if (value == null) {
		throw new $TypeError$2(optMessage || ('Cannot call method on ' + value));
	}
	return value;
};

var HoursPerDay = 24;
var MinutesPerHour = 60;
var SecondsPerMinute = 60;
var msPerSecond = 1e3;
var msPerMinute = msPerSecond * SecondsPerMinute;
var msPerHour = msPerMinute * MinutesPerHour;
var msPerDay = 86400000;

var timeConstants = {
	HoursPerDay: HoursPerDay,
	MinutesPerHour: MinutesPerHour,
	SecondsPerMinute: SecondsPerMinute,
	msPerSecond: msPerSecond,
	msPerMinute: msPerMinute,
	msPerHour: msPerHour,
	msPerDay: msPerDay
};

var $floor = GetIntrinsic('%Math.floor%');

var msPerDay$1 = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var Day = function Day(t) {
	return $floor(t / msPerDay$1);
};

var $floor$1 = GetIntrinsic('%Math.floor%');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DayFromYear = function DayFromYear(y) {
	return (365 * (y - 1970)) + $floor$1((y - 1969) / 4) - $floor$1((y - 1901) / 100) + $floor$1((y - 1601) / 400);
};

var $Date = GetIntrinsic('%Date%');



var $getUTCFullYear = callBound('Date.prototype.getUTCFullYear');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var YearFromTime = function YearFromTime(t) {
	// largest y such that this.TimeFromYear(y) <= t
	return $getUTCFullYear(new $Date(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var DayWithinYear = function DayWithinYear(t) {
	return Day(t) - DayFromYear(YearFromTime(t));
};

var $floor$2 = Math.floor;

var mod = function mod(number, modulo) {
	var remain = number % modulo;
	return $floor$2(remain >= 0 ? remain : remain + modulo);
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DaysInYear = function DaysInYear(y) {
	if (mod(y, 4) !== 0) {
		return 365;
	}
	if (mod(y, 100) !== 0) {
		return 366;
	}
	if (mod(y, 400) !== 0) {
		return 365;
	}
	return 366;
};

var $EvalError = GetIntrinsic('%EvalError%');




// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var InLeapYear = function InLeapYear(t) {
	var days = DaysInYear(YearFromTime(t));
	if (days === 365) {
		return 0;
	}
	if (days === 366) {
		return 1;
	}
	throw new $EvalError('Assertion failed: there are not 365 or 366 days in a year, got: ' + days);
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var MonthFromTime = function MonthFromTime(t) {
	var day = DayWithinYear(t);
	if (0 <= day && day < 31) {
		return 0;
	}
	var leap = InLeapYear(t);
	if (31 <= day && day < (59 + leap)) {
		return 1;
	}
	if ((59 + leap) <= day && day < (90 + leap)) {
		return 2;
	}
	if ((90 + leap) <= day && day < (120 + leap)) {
		return 3;
	}
	if ((120 + leap) <= day && day < (151 + leap)) {
		return 4;
	}
	if ((151 + leap) <= day && day < (181 + leap)) {
		return 5;
	}
	if ((181 + leap) <= day && day < (212 + leap)) {
		return 6;
	}
	if ((212 + leap) <= day && day < (243 + leap)) {
		return 7;
	}
	if ((243 + leap) <= day && day < (273 + leap)) {
		return 8;
	}
	if ((273 + leap) <= day && day < (304 + leap)) {
		return 9;
	}
	if ((304 + leap) <= day && day < (334 + leap)) {
		return 10;
	}
	if ((334 + leap) <= day && day < (365 + leap)) {
		return 11;
	}
};

var $EvalError$1 = GetIntrinsic('%EvalError%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.5

var DateFromTime = function DateFromTime(t) {
	var m = MonthFromTime(t);
	var d = DayWithinYear(t);
	if (m === 0) {
		return d + 1;
	}
	if (m === 1) {
		return d - 30;
	}
	var leap = InLeapYear(t);
	if (m === 2) {
		return d - 58 - leap;
	}
	if (m === 3) {
		return d - 89 - leap;
	}
	if (m === 4) {
		return d - 119 - leap;
	}
	if (m === 5) {
		return d - 150 - leap;
	}
	if (m === 6) {
		return d - 180 - leap;
	}
	if (m === 7) {
		return d - 211 - leap;
	}
	if (m === 8) {
		return d - 242 - leap;
	}
	if (m === 9) {
		return d - 272 - leap;
	}
	if (m === 10) {
		return d - 303 - leap;
	}
	if (m === 11) {
		return d - 333 - leap;
	}
	throw new $EvalError$1('Assertion failed: MonthFromTime returned an impossible value: ' + m);
};

var $TypeError$3 = GetIntrinsic('%TypeError%');
var $SyntaxError = GetIntrinsic('%SyntaxError%');



var predicates = {
	// https://ecma-international.org/ecma-262/6.0/#sec-property-descriptor-specification-type
	'Property Descriptor': function isPropertyDescriptor(Type, Desc) {
		if (Type(Desc) !== 'Object') {
			return false;
		}
		var allowed = {
			'[[Configurable]]': true,
			'[[Enumerable]]': true,
			'[[Get]]': true,
			'[[Set]]': true,
			'[[Value]]': true,
			'[[Writable]]': true
		};

		for (var key in Desc) { // eslint-disable-line
			if (src(Desc, key) && !allowed[key]) {
				return false;
			}
		}

		var isData = src(Desc, '[[Value]]');
		var IsAccessor = src(Desc, '[[Get]]') || src(Desc, '[[Set]]');
		if (isData && IsAccessor) {
			throw new $TypeError$3('Property Descriptors may not be both accessor and data descriptors');
		}
		return true;
	}
};

var assertRecord = function assertRecord(Type, recordType, argumentName, value) {
	var predicate = predicates[recordType];
	if (typeof predicate !== 'function') {
		throw new $SyntaxError('unknown record type: ' + recordType);
	}
	if (!predicate(Type, value)) {
		throw new $TypeError$3(argumentName + ' must be a ' + recordType);
	}
};

// https://ecma-international.org/ecma-262/5.1/#sec-8.10.2

var IsDataDescriptor = function IsDataDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Value]]') && !src(Desc, '[[Writable]]')) {
		return false;
	}

	return true;
};

// https://ecma-international.org/ecma-262/5.1/#sec-8.10.1

var IsAccessorDescriptor = function IsAccessorDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Get]]') && !src(Desc, '[[Set]]')) {
		return false;
	}

	return true;
};

var $TypeError$4 = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/5.1/#sec-8.10.4

var FromPropertyDescriptor = function FromPropertyDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return Desc;
	}

	assertRecord(Type, 'Property Descriptor', 'Desc', Desc);

	if (IsDataDescriptor(Desc)) {
		return {
			value: Desc['[[Value]]'],
			writable: !!Desc['[[Writable]]'],
			enumerable: !!Desc['[[Enumerable]]'],
			configurable: !!Desc['[[Configurable]]']
		};
	} else if (IsAccessorDescriptor(Desc)) {
		return {
			get: Desc['[[Get]]'],
			set: Desc['[[Set]]'],
			enumerable: !!Desc['[[Enumerable]]'],
			configurable: !!Desc['[[Configurable]]']
		};
	} else {
		throw new $TypeError$4('FromPropertyDescriptor must be called with a fully populated Property Descriptor');
	}
};

var $floor$3 = GetIntrinsic('%Math.floor%');



var msPerHour$1 = timeConstants.msPerHour;
var HoursPerDay$1 = timeConstants.HoursPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var HourFromTime = function HourFromTime(t) {
	return mod($floor$3(t / msPerHour$1), HoursPerDay$1);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.11

var IsCallable = isCallable;

// https://ecma-international.org/ecma-262/5.1/#sec-8.10.3

var IsGenericDescriptor = function IsGenericDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type, 'Property Descriptor', 'Desc', Desc);

	if (!IsAccessorDescriptor(Desc) && !IsDataDescriptor(Desc)) {
		return true;
	}

	return false;
};

var $TypeError$5 = GetIntrinsic('%TypeError%');

var isPropertyDescriptor = function IsPropertyDescriptor(ES, Desc) {
	if (ES.Type(Desc) !== 'Object') {
		return false;
	}
	var allowed = {
		'[[Configurable]]': true,
		'[[Enumerable]]': true,
		'[[Get]]': true,
		'[[Set]]': true,
		'[[Value]]': true,
		'[[Writable]]': true
	};

	for (var key in Desc) { // eslint-disable-line no-restricted-syntax
		if (src(Desc, key) && !allowed[key]) {
			return false;
		}
	}

	if (ES.IsDataDescriptor(Desc) && ES.IsAccessorDescriptor(Desc)) {
		throw new $TypeError$5('Property Descriptors may not be both accessor and data descriptors');
	}
	return true;
};

// https://ecma-international.org/ecma-262/6.0/#sec-property-descriptor-specification-type

var IsPropertyDescriptor = function IsPropertyDescriptor(Desc) {
	return isPropertyDescriptor({
		IsDataDescriptor: IsDataDescriptor,
		IsAccessorDescriptor: IsAccessorDescriptor,
		Type: Type
	}, Desc);
};

var msPerDay$2 = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.13

var MakeDate = function MakeDate(day, time) {
	if (!_isFinite(day) || !_isFinite(time)) {
		return NaN;
	}
	return (day * msPerDay$2) + time;
};

var sign = function sign(number) {
	return number >= 0 ? 1 : -1;
};

var $Math = GetIntrinsic('%Math%');






var $floor$4 = $Math.floor;
var $abs = $Math.abs;

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.4

var ToInteger = function ToInteger(value) {
	var number = ToNumber(value);
	if (_isNaN(number)) { return 0; }
	if (number === 0 || !_isFinite(number)) { return number; }
	return sign(number) * $floor$4($abs(number));
};

var $floor$5 = GetIntrinsic('%Math.floor%');
var $DateUTC = GetIntrinsic('%Date.UTC%');










// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.12

var MakeDay = function MakeDay(year, month, date) {
	if (!_isFinite(year) || !_isFinite(month) || !_isFinite(date)) {
		return NaN;
	}
	var y = ToInteger(year);
	var m = ToInteger(month);
	var dt = ToInteger(date);
	var ym = y + $floor$5(m / 12);
	var mn = mod(m, 12);
	var t = $DateUTC(ym, mn, 1);
	if (YearFromTime(t) !== ym || MonthFromTime(t) !== mn || DateFromTime(t) !== 1) {
		return NaN;
	}
	return Day(t) + dt - 1;
};

var msPerSecond$1 = timeConstants.msPerSecond;
var msPerMinute$1 = timeConstants.msPerMinute;
var msPerHour$2 = timeConstants.msPerHour;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.11

var MakeTime = function MakeTime(hour, min, sec, ms) {
	if (!_isFinite(hour) || !_isFinite(min) || !_isFinite(sec) || !_isFinite(ms)) {
		return NaN;
	}
	var h = ToInteger(hour);
	var m = ToInteger(min);
	var s = ToInteger(sec);
	var milli = ToInteger(ms);
	var t = (h * msPerHour$2) + (m * msPerMinute$1) + (s * msPerSecond$1) + milli;
	return t;
};

var $floor$6 = GetIntrinsic('%Math.floor%');



var msPerMinute$2 = timeConstants.msPerMinute;
var MinutesPerHour$1 = timeConstants.MinutesPerHour;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var MinFromTime = function MinFromTime(t) {
	return mod($floor$6(t / msPerMinute$2), MinutesPerHour$1);
};

// https://ecma-international.org/ecma-262/5.1/#sec-5.2

var modulo = function modulo(x, y) {
	return mod(x, y);
};

var msPerSecond$2 = timeConstants.msPerSecond;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var msFromTime = function msFromTime(t) {
	return mod(t, msPerSecond$2);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.12

var SameValue = function SameValue(x, y) {
	if (x === y) { // 0 === -0, but they are not identical.
		if (x === 0) { return 1 / x === 1 / y; }
		return true;
	}
	return _isNaN(x) && _isNaN(y);
};

var $floor$7 = GetIntrinsic('%Math.floor%');



var msPerSecond$3 = timeConstants.msPerSecond;
var SecondsPerMinute$1 = timeConstants.SecondsPerMinute;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var SecFromTime = function SecFromTime(t) {
	return mod($floor$7(t / msPerSecond$3), SecondsPerMinute$1);
};

var $Date$1 = GetIntrinsic('%Date%');
var $Number$1 = GetIntrinsic('%Number%');
var $abs$1 = GetIntrinsic('%Math.abs%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.14

var TimeClip = function TimeClip(time) {
	if (!_isFinite(time) || $abs$1(time) > 8.64e15) {
		return NaN;
	}
	return $Number$1(new $Date$1(ToNumber(time)));
};

var msPerDay$3 = timeConstants.msPerDay;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var TimeFromYear = function TimeFromYear(y) {
	return msPerDay$3 * DayFromYear(y);
};

var msPerDay$4 = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var TimeWithinDay = function TimeWithinDay(t) {
	return mod(t, msPerDay$4);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.2

var ToBoolean = function ToBoolean(value) { return !!value; };

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.5

var ToInt32 = function ToInt32(x) {
	return ToNumber(x) >> 0;
};

var $Object = GetIntrinsic('%Object%');



// http://www.ecma-international.org/ecma-262/5.1/#sec-9.9

var ToObject = function ToObject(value) {
	CheckObjectCoercible(value);
	return $Object(value);
};

var $TypeError$6 = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/5.1/#sec-8.10.5

var ToPropertyDescriptor = function ToPropertyDescriptor(Obj) {
	if (Type(Obj) !== 'Object') {
		throw new $TypeError$6('ToPropertyDescriptor requires an object');
	}

	var desc = {};
	if (src(Obj, 'enumerable')) {
		desc['[[Enumerable]]'] = ToBoolean(Obj.enumerable);
	}
	if (src(Obj, 'configurable')) {
		desc['[[Configurable]]'] = ToBoolean(Obj.configurable);
	}
	if (src(Obj, 'value')) {
		desc['[[Value]]'] = Obj.value;
	}
	if (src(Obj, 'writable')) {
		desc['[[Writable]]'] = ToBoolean(Obj.writable);
	}
	if (src(Obj, 'get')) {
		var getter = Obj.get;
		if (typeof getter !== 'undefined' && !IsCallable(getter)) {
			throw new TypeError('getter must be a function');
		}
		desc['[[Get]]'] = getter;
	}
	if (src(Obj, 'set')) {
		var setter = Obj.set;
		if (typeof setter !== 'undefined' && !IsCallable(setter)) {
			throw new $TypeError$6('setter must be a function');
		}
		desc['[[Set]]'] = setter;
	}

	if ((src(desc, '[[Get]]') || src(desc, '[[Set]]')) && (src(desc, '[[Value]]') || src(desc, '[[Writable]]'))) {
		throw new $TypeError$6('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
	}
	return desc;
};

var $String = GetIntrinsic('%String%');

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.8

var ToString = function ToString(value) {
	return $String(value);
};

var $Math$1 = GetIntrinsic('%Math%');








var $floor$8 = $Math$1.floor;
var $abs$2 = $Math$1.abs;

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.7

var ToUint16 = function ToUint16(value) {
	var number = ToNumber(value);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$8($abs$2(number));
	return mod(posInt, 0x10000);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.6

var ToUint32 = function ToUint32(x) {
	return ToNumber(x) >>> 0;
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.6

var WeekDay = function WeekDay(t) {
	return mod(Day(t) + 4, 7);
};

/* eslint global-require: 0 */

// https://es5.github.io/#x9
var es5$1 = {
	'Abstract Equality Comparison': AbstractEqualityComparison,
	'Abstract Relational Comparison': AbstractRelationalComparison,
	'Strict Equality Comparison': StrictEqualityComparison,
	CheckObjectCoercible: CheckObjectCoercible,
	DateFromTime: DateFromTime,
	Day: Day,
	DayFromYear: DayFromYear,
	DaysInYear: DaysInYear,
	DayWithinYear: DayWithinYear,
	FromPropertyDescriptor: FromPropertyDescriptor,
	HourFromTime: HourFromTime,
	InLeapYear: InLeapYear,
	IsAccessorDescriptor: IsAccessorDescriptor,
	IsCallable: IsCallable,
	IsDataDescriptor: IsDataDescriptor,
	IsGenericDescriptor: IsGenericDescriptor,
	IsPropertyDescriptor: IsPropertyDescriptor,
	MakeDate: MakeDate,
	MakeDay: MakeDay,
	MakeTime: MakeTime,
	MinFromTime: MinFromTime,
	modulo: modulo,
	MonthFromTime: MonthFromTime,
	msFromTime: msFromTime,
	SameValue: SameValue,
	SecFromTime: SecFromTime,
	TimeClip: TimeClip,
	TimeFromYear: TimeFromYear,
	TimeWithinDay: TimeWithinDay,
	ToBoolean: ToBoolean,
	ToInt32: ToInt32,
	ToInteger: ToInteger,
	ToNumber: ToNumber,
	ToObject: ToObject,
	ToPrimitive: ToPrimitive,
	ToPropertyDescriptor: ToPropertyDescriptor,
	ToString: ToString,
	ToUint16: ToUint16,
	ToUint32: ToUint32,
	Type: Type,
	WeekDay: WeekDay,
	YearFromTime: YearFromTime
};

var $test = GetIntrinsic('RegExp.prototype.test');



var regexTester = function regexTester(regex) {
	return callBind($test, regex);
};

var isPrimitive$1 = function isPrimitive(value) {
	return value === null || (typeof value !== 'function' && typeof value !== 'object');
};

var getDay = Date.prototype.getDay;
var tryDateObject = function tryDateGetDayCall(value) {
	try {
		getDay.call(value);
		return true;
	} catch (e) {
		return false;
	}
};

var toStr$3 = Object.prototype.toString;
var dateClass = '[object Date]';
var hasToStringTag$1 = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

var isDateObject = function isDateObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	return hasToStringTag$1 ? tryDateObject(value) : toStr$3.call(value) === dateClass;
};

var isSymbol = createCommonjsModule(function (module) {

var toStr = Object.prototype.toString;
var hasSymbols$1 = hasSymbols();

if (hasSymbols$1) {
	var symToStr = Symbol.prototype.toString;
	var symStringRegex = /^Symbol\(.*\)$/;
	var isSymbolObject = function isRealSymbolObject(value) {
		if (typeof value.valueOf() !== 'symbol') {
			return false;
		}
		return symStringRegex.test(symToStr.call(value));
	};

	module.exports = function isSymbol(value) {
		if (typeof value === 'symbol') {
			return true;
		}
		if (toStr.call(value) !== '[object Symbol]') {
			return false;
		}
		try {
			return isSymbolObject(value);
		} catch (e) {
			return false;
		}
	};
} else {

	module.exports = function isSymbol(value) {
		// this environment does not support Symbols.
		return false ;
	};
}
});

var hasSymbols$2 = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol';






var ordinaryToPrimitive = function OrdinaryToPrimitive(O, hint) {
	if (typeof O === 'undefined' || O === null) {
		throw new TypeError('Cannot call method on ' + O);
	}
	if (typeof hint !== 'string' || (hint !== 'number' && hint !== 'string')) {
		throw new TypeError('hint must be "string" or "number"');
	}
	var methodNames = hint === 'string' ? ['toString', 'valueOf'] : ['valueOf', 'toString'];
	var method, result, i;
	for (i = 0; i < methodNames.length; ++i) {
		method = O[methodNames[i]];
		if (isCallable(method)) {
			result = method.call(O);
			if (isPrimitive(result)) {
				return result;
			}
		}
	}
	throw new TypeError('No default value');
};

var GetMethod = function GetMethod(O, P) {
	var func = O[P];
	if (func !== null && typeof func !== 'undefined') {
		if (!isCallable(func)) {
			throw new TypeError(func + ' returned for property ' + P + ' of object ' + O + ' is not a function');
		}
		return func;
	}
	return void 0;
};

// http://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive
var es2015 = function ToPrimitive(input) {
	if (isPrimitive(input)) {
		return input;
	}
	var hint = 'default';
	if (arguments.length > 1) {
		if (arguments[1] === String) {
			hint = 'string';
		} else if (arguments[1] === Number) {
			hint = 'number';
		}
	}

	var exoticToPrim;
	if (hasSymbols$2) {
		if (Symbol.toPrimitive) {
			exoticToPrim = GetMethod(input, Symbol.toPrimitive);
		} else if (isSymbol(input)) {
			exoticToPrim = Symbol.prototype.valueOf;
		}
	}
	if (typeof exoticToPrim !== 'undefined') {
		var result = exoticToPrim.call(input, hint);
		if (isPrimitive(result)) {
			return result;
		}
		throw new TypeError('unable to convert exotic object to primitive');
	}
	if (hint === 'default' && (isDateObject(input) || isSymbol(input))) {
		hint = 'string';
	}
	return ordinaryToPrimitive(input, hint === 'default' ? 'number' : hint);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive

var ToPrimitive$1 = function ToPrimitive(input) {
	if (arguments.length > 1) {
		return es2015(input, arguments[1]);
	}
	return es2015(input);
};

var $TypeError$7 = GetIntrinsic('%TypeError%');
var $Number$2 = GetIntrinsic('%Number%');
var $RegExp = GetIntrinsic('%RegExp%');
var $parseInteger = GetIntrinsic('%parseInt%');





var $strSlice$1 = callBound('String.prototype.slice');
var isBinary = regexTester(/^0b[01]+$/i);
var isOctal = regexTester(/^0o[0-7]+$/i);
var isInvalidHexLiteral = regexTester(/^[-+]0x[0-9a-f]+$/i);
var nonWS = ['\u0085', '\u200b', '\ufffe'].join('');
var nonWSregex = new $RegExp('[' + nonWS + ']', 'g');
var hasNonWS = regexTester(nonWSregex);

// whitespace from: https://es5.github.io/#x15.5.4.20
// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
var ws = [
	'\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003',
	'\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028',
	'\u2029\uFEFF'
].join('');
var trimRegex = new RegExp('(^[' + ws + ']+)|([' + ws + ']+$)', 'g');
var $replace$1 = callBound('String.prototype.replace');
var $trim = function (value) {
	return $replace$1(value, trimRegex, '');
};



// https://www.ecma-international.org/ecma-262/6.0/#sec-tonumber

var ToNumber$1 = function ToNumber(argument) {
	var value = isPrimitive$1(argument) ? argument : ToPrimitive$1(argument, $Number$2);
	if (typeof value === 'symbol') {
		throw new $TypeError$7('Cannot convert a Symbol value to a number');
	}
	if (typeof value === 'string') {
		if (isBinary(value)) {
			return ToNumber($parseInteger($strSlice$1(value, 2), 2));
		} else if (isOctal(value)) {
			return ToNumber($parseInteger($strSlice$1(value, 2), 8));
		} else if (hasNonWS(value) || isInvalidHexLiteral(value)) {
			return NaN;
		} else {
			var trimmed = $trim(value);
			if (trimmed !== value) {
				return ToNumber(trimmed);
			}
		}
	}
	return $Number$2(value);
};

// https://ecma-international.org/ecma-262/6.0/#sec-ecmascript-data-types-and-values

var Type$1 = function Type$1(x) {
	if (typeof x === 'symbol') {
		return 'Symbol';
	}
	return Type(x);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-abstract-equality-comparison

var AbstractEqualityComparison$1 = function AbstractEqualityComparison(x, y) {
	var xType = Type$1(x);
	var yType = Type$1(y);
	if (xType === yType) {
		return x === y; // ES6+ specified this shortcut anyways.
	}
	if (x == null && y == null) {
		return true;
	}
	if (xType === 'Number' && yType === 'String') {
		return AbstractEqualityComparison(x, ToNumber$1(y));
	}
	if (xType === 'String' && yType === 'Number') {
		return AbstractEqualityComparison(ToNumber$1(x), y);
	}
	if (xType === 'Boolean') {
		return AbstractEqualityComparison(ToNumber$1(x), y);
	}
	if (yType === 'Boolean') {
		return AbstractEqualityComparison(x, ToNumber$1(y));
	}
	if ((xType === 'String' || xType === 'Number' || xType === 'Symbol') && yType === 'Object') {
		return AbstractEqualityComparison(x, ToPrimitive$1(y));
	}
	if (xType === 'Object' && (yType === 'String' || yType === 'Number' || yType === 'Symbol')) {
		return AbstractEqualityComparison(ToPrimitive$1(x), y);
	}
	return false;
};

var $Number$3 = GetIntrinsic('%Number%');
var $TypeError$8 = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/5.1/#sec-11.8.5

// eslint-disable-next-line max-statements
var AbstractRelationalComparison$1 = function AbstractRelationalComparison(x, y, LeftFirst) {
	if (Type$1(LeftFirst) !== 'Boolean') {
		throw new $TypeError$8('Assertion failed: LeftFirst argument must be a Boolean');
	}
	var px;
	var py;
	if (LeftFirst) {
		px = ToPrimitive$1(x, $Number$3);
		py = ToPrimitive$1(y, $Number$3);
	} else {
		py = ToPrimitive$1(y, $Number$3);
		px = ToPrimitive$1(x, $Number$3);
	}
	var bothStrings = Type$1(px) === 'String' && Type$1(py) === 'String';
	if (!bothStrings) {
		var nx = ToNumber$1(px);
		var ny = ToNumber$1(py);
		if (_isNaN(nx) || _isNaN(ny)) {
			return undefined;
		}
		if (_isFinite(nx) && _isFinite(ny) && nx === ny) {
			return false;
		}
		if (nx === 0 && ny === 0) {
			return false;
		}
		if (nx === Infinity) {
			return false;
		}
		if (ny === Infinity) {
			return true;
		}
		if (ny === -Infinity) {
			return false;
		}
		if (nx === -Infinity) {
			return true;
		}
		return nx < ny; // by now, these are both nonzero, finite, and not equal
	}
	if (isPrefixOf(py, px)) {
		return false;
	}
	if (isPrefixOf(px, py)) {
		return true;
	}
	return px < py; // both strings, neither a prefix of the other. shortcut for steps c-f
};

// https://www.ecma-international.org/ecma-262/5.1/#sec-11.9.6

var StrictEqualityComparison$1 = function StrictEqualityComparison(x, y) {
	var xType = Type$1(x);
	var yType = Type$1(y);
	if (xType !== yType) {
		return false;
	}
	if (xType === 'Undefined' || xType === 'Null') {
		return true;
	}
	return x === y; // shortcut for steps 4-7
};

var $Math$2 = GetIntrinsic('%Math%');

var $floor$9 = $Math$2.floor;
var $abs$3 = $Math$2.abs;




// https://www.ecma-international.org/ecma-262/6.0/#sec-isinteger

var IsInteger = function IsInteger(argument) {
	if (typeof argument !== 'number' || _isNaN(argument) || !_isFinite(argument)) {
		return false;
	}
	var abs = $abs$3(argument);
	return $floor$9(abs) === abs;
};

var $Math$3 = GetIntrinsic('%Math%');
var $Number$4 = GetIntrinsic('%Number%');

var maxSafeInteger = $Number$4.MAX_SAFE_INTEGER || $Math$3.pow(2, 53) - 1;

var $TypeError$9 = GetIntrinsic('%TypeError%');

var $charCodeAt = callBound('String.prototype.charCodeAt');

// https://ecma-international.org/ecma-262/6.0/#sec-advancestringindex

var AdvanceStringIndex = function AdvanceStringIndex(S, index, unicode) {
	if (Type$1(S) !== 'String') {
		throw new $TypeError$9('Assertion failed: `S` must be a String');
	}
	if (!IsInteger(index) || index < 0 || index > maxSafeInteger) {
		throw new $TypeError$9('Assertion failed: `length` must be an integer >= 0 and <= 2**53');
	}
	if (Type$1(unicode) !== 'Boolean') {
		throw new $TypeError$9('Assertion failed: `unicode` must be a Boolean');
	}
	if (!unicode) {
		return index + 1;
	}
	var length = S.length;
	if ((index + 1) >= length) {
		return index + 1;
	}

	var first = $charCodeAt(S, index);
	if (first < 0xD800 || first > 0xDBFF) {
		return index + 1;
	}

	var second = $charCodeAt(S, index + 1);
	if (second < 0xDC00 || second > 0xDFFF) {
		return index + 1;
	}

	return index + 2;
};

var $ArrayPrototype = GetIntrinsic('%Array.prototype%');
var $RangeError = GetIntrinsic('%RangeError%');
var $SyntaxError$1 = GetIntrinsic('%SyntaxError%');
var $TypeError$a = GetIntrinsic('%TypeError%');



var MAX_ARRAY_LENGTH = Math.pow(2, 32) - 1;

var $setProto = GetIntrinsic('%Object.setPrototypeOf%', true) || (
	// eslint-disable-next-line no-proto, no-negated-condition
	[].__proto__ !== $ArrayPrototype
		? null
		: function (O, proto) {
			O.__proto__ = proto; // eslint-disable-line no-proto, no-param-reassign
			return O;
		}
);

// https://www.ecma-international.org/ecma-262/6.0/#sec-arraycreate

var ArrayCreate = function ArrayCreate(length) {
	if (!IsInteger(length) || length < 0) {
		throw new $TypeError$a('Assertion failed: `length` must be an integer Number >= 0');
	}
	if (length > MAX_ARRAY_LENGTH) {
		throw new $RangeError('length is greater than (2**32 - 1)');
	}
	var proto = arguments.length > 1 ? arguments[1] : $ArrayPrototype;
	var A = []; // steps 5 - 7, and 9
	if (proto !== $ArrayPrototype) { // step 8
		if (!$setProto) {
			throw new $SyntaxError$1('ArrayCreate: a `proto` argument that is not `Array.prototype` is not supported in an environment that does not support setting the [[Prototype]]');
		}
		$setProto(A, proto);
	}
	if (length !== 0) { // bypasses the need for step 2
		A.length = length;
	}
	/* step 10, the above as a shortcut for the below
    OrdinaryDefineOwnProperty(A, 'length', {
        '[[Configurable]]': false,
        '[[Enumerable]]': false,
        '[[Value]]': length,
        '[[Writable]]': true
    });
    */
	return A;
};

var toStr$4 = Object.prototype.toString;

var isArguments = function isArguments(value) {
	var str = toStr$4.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr$4.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

var keysShim;
if (!Object.keys) {
	// modified from https://github.com/es-shims/es5-shim
	var has = Object.prototype.hasOwnProperty;
	var toStr$5 = Object.prototype.toString;
	var isArgs = isArguments; // eslint-disable-line global-require
	var isEnumerable = Object.prototype.propertyIsEnumerable;
	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
	var dontEnums = [
		'toString',
		'toLocaleString',
		'valueOf',
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'constructor'
	];
	var equalsConstructorPrototype = function (o) {
		var ctor = o.constructor;
		return ctor && ctor.prototype === o;
	};
	var excludedKeys = {
		$applicationCache: true,
		$console: true,
		$external: true,
		$frame: true,
		$frameElement: true,
		$frames: true,
		$innerHeight: true,
		$innerWidth: true,
		$onmozfullscreenchange: true,
		$onmozfullscreenerror: true,
		$outerHeight: true,
		$outerWidth: true,
		$pageXOffset: true,
		$pageYOffset: true,
		$parent: true,
		$scrollLeft: true,
		$scrollTop: true,
		$scrollX: true,
		$scrollY: true,
		$self: true,
		$webkitIndexedDB: true,
		$webkitStorageInfo: true,
		$window: true
	};
	var hasAutomationEqualityBug = (function () {
		/* global window */
		if (typeof window === 'undefined') { return false; }
		for (var k in window) {
			try {
				if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
					try {
						equalsConstructorPrototype(window[k]);
					} catch (e) {
						return true;
					}
				}
			} catch (e) {
				return true;
			}
		}
		return false;
	}());
	var equalsConstructorPrototypeIfNotBuggy = function (o) {
		/* global window */
		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
			return equalsConstructorPrototype(o);
		}
		try {
			return equalsConstructorPrototype(o);
		} catch (e) {
			return false;
		}
	};

	keysShim = function keys(object) {
		var isObject = object !== null && typeof object === 'object';
		var isFunction = toStr$5.call(object) === '[object Function]';
		var isArguments = isArgs(object);
		var isString = isObject && toStr$5.call(object) === '[object String]';
		var theKeys = [];

		if (!isObject && !isFunction && !isArguments) {
			throw new TypeError('Object.keys called on a non-object');
		}

		var skipProto = hasProtoEnumBug && isFunction;
		if (isString && object.length > 0 && !has.call(object, 0)) {
			for (var i = 0; i < object.length; ++i) {
				theKeys.push(String(i));
			}
		}

		if (isArguments && object.length > 0) {
			for (var j = 0; j < object.length; ++j) {
				theKeys.push(String(j));
			}
		} else {
			for (var name in object) {
				if (!(skipProto && name === 'prototype') && has.call(object, name)) {
					theKeys.push(String(name));
				}
			}
		}

		if (hasDontEnumBug) {
			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

			for (var k = 0; k < dontEnums.length; ++k) {
				if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
					theKeys.push(dontEnums[k]);
				}
			}
		}
		return theKeys;
	};
}
var implementation$1 = keysShim;

var slice$1 = Array.prototype.slice;


var origKeys = Object.keys;
var keysShim$1 = origKeys ? function keys(o) { return origKeys(o); } : implementation$1;

var originalKeys = Object.keys;

keysShim$1.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			var args = Object.keys(arguments);
			return args && args.length === arguments.length;
		}(1, 2));
		if (!keysWorksWithArguments) {
			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
				if (isArguments(object)) {
					return originalKeys(slice$1.call(object));
				}
				return originalKeys(object);
			};
		}
	} else {
		Object.keys = keysShim$1;
	}
	return Object.keys || keysShim$1;
};

var objectKeys = keysShim$1;

var hasSymbols$3 = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

var toStr$6 = Object.prototype.toString;
var concat = Array.prototype.concat;
var origDefineProperty = Object.defineProperty;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr$6.call(fn) === '[object Function]';
};

var arePropertyDescriptorsSupported = function () {
	var obj = {};
	try {
		origDefineProperty(obj, 'x', { enumerable: false, value: obj });
		// eslint-disable-next-line no-unused-vars, no-restricted-syntax
		for (var _ in obj) { // jscs:ignore disallowUnusedVariables
			return false;
		}
		return obj.x === obj;
	} catch (e) { /* this is IE 8. */
		return false;
	}
};
var supportsDescriptors = origDefineProperty && arePropertyDescriptorsSupported();

var defineProperty = function (object, name, value, predicate) {
	if (name in object && (!isFunction(predicate) || !predicate())) {
		return;
	}
	if (supportsDescriptors) {
		origDefineProperty(object, name, {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		});
	} else {
		object[name] = value;
	}
};

var defineProperties = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = objectKeys(map);
	if (hasSymbols$3) {
		props = concat.call(props, Object.getOwnPropertySymbols(map));
	}
	for (var i = 0; i < props.length; i += 1) {
		defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
	}
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

var defineProperties_1 = defineProperties;

// modified from https://github.com/es-shims/es6-shim


var canBeObject = function (obj) {
	return typeof obj !== 'undefined' && obj !== null;
};
var hasSymbols$4 = shams();
var toObject = Object;
var push = functionBind.call(Function.call, Array.prototype.push);
var propIsEnumerable = functionBind.call(Function.call, Object.prototype.propertyIsEnumerable);
var originalGetSymbols = hasSymbols$4 ? Object.getOwnPropertySymbols : null;

var implementation$2 = function assign(target, source1) {
	if (!canBeObject(target)) { throw new TypeError('target must be an object'); }
	var objTarget = toObject(target);
	var s, source, i, props, syms, value, key;
	for (s = 1; s < arguments.length; ++s) {
		source = toObject(arguments[s]);
		props = objectKeys(source);
		var getSymbols = hasSymbols$4 && (Object.getOwnPropertySymbols || originalGetSymbols);
		if (getSymbols) {
			syms = getSymbols(source);
			for (i = 0; i < syms.length; ++i) {
				key = syms[i];
				if (propIsEnumerable(source, key)) {
					push(props, key);
				}
			}
		}
		for (i = 0; i < props.length; ++i) {
			key = props[i];
			value = source[key];
			if (propIsEnumerable(source, key)) {
				objTarget[key] = value;
			}
		}
	}
	return objTarget;
};

var lacksProperEnumerationOrder = function () {
	if (!Object.assign) {
		return false;
	}
	// v8, specifically in node 4.x, has a bug with incorrect property enumeration order
	// note: this does not detect the bug unless there's 20 characters
	var str = 'abcdefghijklmnopqrst';
	var letters = str.split('');
	var map = {};
	for (var i = 0; i < letters.length; ++i) {
		map[letters[i]] = letters[i];
	}
	var obj = Object.assign({}, map);
	var actual = '';
	for (var k in obj) {
		actual += k;
	}
	return str !== actual;
};

var assignHasPendingExceptions = function () {
	if (!Object.assign || !Object.preventExtensions) {
		return false;
	}
	// Firefox 37 still has "pending exception" logic in its Object.assign implementation,
	// which is 72% slower than our shim, and Firefox 40's native implementation.
	var thrower = Object.preventExtensions({ 1: 2 });
	try {
		Object.assign(thrower, 'xy');
	} catch (e) {
		return thrower[1] === 'y';
	}
	return false;
};

var polyfill = function getPolyfill() {
	if (!Object.assign) {
		return implementation$2;
	}
	if (lacksProperEnumerationOrder()) {
		return implementation$2;
	}
	if (assignHasPendingExceptions()) {
		return implementation$2;
	}
	return Object.assign;
};

var shim = function shimAssign() {
	var polyfill$1 = polyfill();
	defineProperties_1(
		Object,
		{ assign: polyfill$1 },
		{ assign: function () { return Object.assign !== polyfill$1; } }
	);
	return polyfill$1;
};

var polyfill$1 = polyfill();

defineProperties_1(polyfill$1, {
	getPolyfill: polyfill,
	implementation: implementation$2,
	shim: shim
});

var object_assign = polyfill$1;

var $Array = GetIntrinsic('%Array%');

// eslint-disable-next-line global-require
var toStr$7 = !$Array.isArray && callBound('Object.prototype.toString');

// https://www.ecma-international.org/ecma-262/6.0/#sec-isarray

var IsArray = $Array.isArray || function IsArray(argument) {
	return toStr$7(argument) === '[object Array]';
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isaccessordescriptor

var IsAccessorDescriptor$1 = function IsAccessorDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$1, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Get]]') && !src(Desc, '[[Set]]')) {
		return false;
	}

	return true;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isdatadescriptor

var IsDataDescriptor$1 = function IsDataDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$1, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Value]]') && !src(Desc, '[[Writable]]')) {
		return false;
	}

	return true;
};

var $gOPD$1 = GetIntrinsic('%Object.getOwnPropertyDescriptor%');
if ($gOPD$1) {
	try {
		$gOPD$1([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD$1 = null;
	}
}

var getOwnPropertyDescriptor = $gOPD$1;

var $Object$1 = GetIntrinsic('%Object%');



var $preventExtensions = $Object$1.preventExtensions;
var $isExtensible = $Object$1.isExtensible;

// https://www.ecma-international.org/ecma-262/6.0/#sec-isextensible-o

var IsExtensible = $preventExtensions
	? function IsExtensible(obj) {
		return !isPrimitive$1(obj) && $isExtensible(obj);
	}
	: function IsExtensible(obj) {
		return !isPrimitive$1(obj);
	};

// https://www.ecma-international.org/ecma-262/6.0/#sec-ispropertykey

var IsPropertyKey = function IsPropertyKey(argument) {
	return typeof argument === 'string' || typeof argument === 'symbol';
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.2

var ToBoolean$1 = function ToBoolean(value) { return !!value; };

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.11

var IsCallable$1 = isCallable;

var $TypeError$b = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/5.1/#sec-8.10.5

var ToPropertyDescriptor$1 = function ToPropertyDescriptor(Obj) {
	if (Type$1(Obj) !== 'Object') {
		throw new $TypeError$b('ToPropertyDescriptor requires an object');
	}

	var desc = {};
	if (src(Obj, 'enumerable')) {
		desc['[[Enumerable]]'] = ToBoolean$1(Obj.enumerable);
	}
	if (src(Obj, 'configurable')) {
		desc['[[Configurable]]'] = ToBoolean$1(Obj.configurable);
	}
	if (src(Obj, 'value')) {
		desc['[[Value]]'] = Obj.value;
	}
	if (src(Obj, 'writable')) {
		desc['[[Writable]]'] = ToBoolean$1(Obj.writable);
	}
	if (src(Obj, 'get')) {
		var getter = Obj.get;
		if (typeof getter !== 'undefined' && !IsCallable$1(getter)) {
			throw new TypeError('getter must be a function');
		}
		desc['[[Get]]'] = getter;
	}
	if (src(Obj, 'set')) {
		var setter = Obj.set;
		if (typeof setter !== 'undefined' && !IsCallable$1(setter)) {
			throw new $TypeError$b('setter must be a function');
		}
		desc['[[Set]]'] = setter;
	}

	if ((src(desc, '[[Get]]') || src(desc, '[[Set]]')) && (src(desc, '[[Value]]') || src(desc, '[[Writable]]'))) {
		throw new $TypeError$b('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
	}
	return desc;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.12

var SameValue$1 = function SameValue(x, y) {
	if (x === y) { // 0 === -0, but they are not identical.
		if (x === 0) { return 1 / x === 1 / y; }
		return true;
	}
	return _isNaN(x) && _isNaN(y);
};

var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}



var $isEnumerable = callBound('Object.prototype.propertyIsEnumerable');

// eslint-disable-next-line max-params
var DefineOwnProperty = function DefineOwnProperty(IsDataDescriptor, SameValue, FromPropertyDescriptor, O, P, desc) {
	if (!$defineProperty) {
		if (!IsDataDescriptor(desc)) {
			// ES3 does not support getters/setters
			return false;
		}
		if (!desc['[[Configurable]]'] || !desc['[[Writable]]']) {
			return false;
		}

		// fallback for ES3
		if (P in O && $isEnumerable(O, P) !== !!desc['[[Enumerable]]']) {
			// a non-enumerable existing property
			return false;
		}

		// property does not exist at all, or exists but is enumerable
		var V = desc['[[Value]]'];
		// eslint-disable-next-line no-param-reassign
		O[P] = V; // will use [[Define]]
		return SameValue(O[P], V);
	}
	$defineProperty(O, P, FromPropertyDescriptor(desc));
	return true;
};

var every = function every(array, predicate) {
	for (var i = 0; i < array.length; i += 1) {
		if (!predicate(array[i], i, array)) {
			return false;
		}
	}
	return true;
};

var isSamePropertyDescriptor = function isSamePropertyDescriptor(ES, D1, D2) {
	var fields = [
		'[[Configurable]]',
		'[[Enumerable]]',
		'[[Get]]',
		'[[Set]]',
		'[[Value]]',
		'[[Writable]]'
	];
	return every(fields, function (field) {
		if ((field in D1) !== (field in D2)) {
			return false;
		}
		return ES.SameValue(D1[field], D2[field]);
	});
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-frompropertydescriptor

var FromPropertyDescriptor$1 = function FromPropertyDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return Desc;
	}

	assertRecord(Type$1, 'Property Descriptor', 'Desc', Desc);

	var obj = {};
	if ('[[Value]]' in Desc) {
		obj.value = Desc['[[Value]]'];
	}
	if ('[[Writable]]' in Desc) {
		obj.writable = Desc['[[Writable]]'];
	}
	if ('[[Get]]' in Desc) {
		obj.get = Desc['[[Get]]'];
	}
	if ('[[Set]]' in Desc) {
		obj.set = Desc['[[Set]]'];
	}
	if ('[[Enumerable]]' in Desc) {
		obj.enumerable = Desc['[[Enumerable]]'];
	}
	if ('[[Configurable]]' in Desc) {
		obj.configurable = Desc['[[Configurable]]'];
	}
	return obj;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isgenericdescriptor

var IsGenericDescriptor$1 = function IsGenericDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$1, 'Property Descriptor', 'Desc', Desc);

	if (!IsAccessorDescriptor$1(Desc) && !IsDataDescriptor$1(Desc)) {
		return true;
	}

	return false;
};

var $TypeError$c = GetIntrinsic('%TypeError%');













// https://www.ecma-international.org/ecma-262/6.0/#sec-validateandapplypropertydescriptor
// https://www.ecma-international.org/ecma-262/8.0/#sec-validateandapplypropertydescriptor

// eslint-disable-next-line max-lines-per-function, max-statements, max-params
var ValidateAndApplyPropertyDescriptor = function ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current) {
	// this uses the ES2017+ logic, since it fixes a number of bugs in the ES2015 logic.
	var oType = Type$1(O);
	if (oType !== 'Undefined' && oType !== 'Object') {
		throw new $TypeError$c('Assertion failed: O must be undefined or an Object');
	}
	if (Type$1(extensible) !== 'Boolean') {
		throw new $TypeError$c('Assertion failed: extensible must be a Boolean');
	}
	if (!isPropertyDescriptor({
		Type: Type$1,
		IsDataDescriptor: IsDataDescriptor$1,
		IsAccessorDescriptor: IsAccessorDescriptor$1
	}, Desc)) {
		throw new $TypeError$c('Assertion failed: Desc must be a Property Descriptor');
	}
	if (Type$1(current) !== 'Undefined' && !isPropertyDescriptor({
		Type: Type$1,
		IsDataDescriptor: IsDataDescriptor$1,
		IsAccessorDescriptor: IsAccessorDescriptor$1
	}, current)) {
		throw new $TypeError$c('Assertion failed: current must be a Property Descriptor, or undefined');
	}
	if (oType !== 'Undefined' && !IsPropertyKey(P)) {
		throw new $TypeError$c('Assertion failed: if O is not undefined, P must be a Property Key');
	}
	if (Type$1(current) === 'Undefined') {
		if (!extensible) {
			return false;
		}
		if (IsGenericDescriptor$1(Desc) || IsDataDescriptor$1(Desc)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$1,
					SameValue$1,
					FromPropertyDescriptor$1,
					O,
					P,
					{
						'[[Configurable]]': Desc['[[Configurable]]'],
						'[[Enumerable]]': Desc['[[Enumerable]]'],
						'[[Value]]': Desc['[[Value]]'],
						'[[Writable]]': Desc['[[Writable]]']
					}
				);
			}
		} else {
			if (!IsAccessorDescriptor$1(Desc)) {
				throw new $TypeError$c('Assertion failed: Desc is not an accessor descriptor');
			}
			if (oType !== 'Undefined') {
				return DefineOwnProperty(
					IsDataDescriptor$1,
					SameValue$1,
					FromPropertyDescriptor$1,
					O,
					P,
					Desc
				);
			}
		}
		return true;
	}
	if (IsGenericDescriptor$1(Desc) && !('[[Configurable]]' in Desc) && !('[[Enumerable]]' in Desc)) {
		return true;
	}
	if (isSamePropertyDescriptor({ SameValue: SameValue$1 }, Desc, current)) {
		return true; // removed by ES2017, but should still be correct
	}
	// "if every field in Desc is absent, return true" can't really match the assertion that it's a Property Descriptor
	if (!current['[[Configurable]]']) {
		if (Desc['[[Configurable]]']) {
			return false;
		}
		if ('[[Enumerable]]' in Desc && !Desc['[[Enumerable]]'] === !!current['[[Enumerable]]']) {
			return false;
		}
	}
	if (IsGenericDescriptor$1(Desc)) ; else if (IsDataDescriptor$1(current) !== IsDataDescriptor$1(Desc)) {
		if (!current['[[Configurable]]']) {
			return false;
		}
		if (IsDataDescriptor$1(current)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$1,
					SameValue$1,
					FromPropertyDescriptor$1,
					O,
					P,
					{
						'[[Configurable]]': current['[[Configurable]]'],
						'[[Enumerable]]': current['[[Enumerable]]'],
						'[[Get]]': undefined
					}
				);
			}
		} else if (oType !== 'Undefined') {
			DefineOwnProperty(
				IsDataDescriptor$1,
				SameValue$1,
				FromPropertyDescriptor$1,
				O,
				P,
				{
					'[[Configurable]]': current['[[Configurable]]'],
					'[[Enumerable]]': current['[[Enumerable]]'],
					'[[Value]]': undefined
				}
			);
		}
	} else if (IsDataDescriptor$1(current) && IsDataDescriptor$1(Desc)) {
		if (!current['[[Configurable]]'] && !current['[[Writable]]']) {
			if ('[[Writable]]' in Desc && Desc['[[Writable]]']) {
				return false;
			}
			if ('[[Value]]' in Desc && !SameValue$1(Desc['[[Value]]'], current['[[Value]]'])) {
				return false;
			}
			return true;
		}
	} else if (IsAccessorDescriptor$1(current) && IsAccessorDescriptor$1(Desc)) {
		if (!current['[[Configurable]]']) {
			if ('[[Set]]' in Desc && !SameValue$1(Desc['[[Set]]'], current['[[Set]]'])) {
				return false;
			}
			if ('[[Get]]' in Desc && !SameValue$1(Desc['[[Get]]'], current['[[Get]]'])) {
				return false;
			}
			return true;
		}
	} else {
		throw new $TypeError$c('Assertion failed: current and Desc are not both data, both accessors, or one accessor and one data.');
	}
	if (oType !== 'Undefined') {
		return DefineOwnProperty(
			IsDataDescriptor$1,
			SameValue$1,
			FromPropertyDescriptor$1,
			O,
			P,
			Desc
		);
	}
	return true;
};

var $SyntaxError$2 = GetIntrinsic('%SyntaxError%');
var $TypeError$d = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarydefineownproperty

var OrdinaryDefineOwnProperty = function OrdinaryDefineOwnProperty(O, P, Desc) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$d('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$d('Assertion failed: P must be a Property Key');
	}
	if (!isPropertyDescriptor({
		Type: Type$1,
		IsDataDescriptor: IsDataDescriptor$1,
		IsAccessorDescriptor: IsAccessorDescriptor$1
	}, Desc)) {
		throw new $TypeError$d('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!getOwnPropertyDescriptor) {
		// ES3/IE 8 fallback
		if (IsAccessorDescriptor$1(Desc)) {
			throw new $SyntaxError$2('This environment does not support accessor property descriptors.');
		}
		var creatingNormalDataProperty = !(P in O)
			&& Desc['[[Writable]]']
			&& Desc['[[Enumerable]]']
			&& Desc['[[Configurable]]']
			&& '[[Value]]' in Desc;
		var settingExistingDataProperty = (P in O)
			&& (!('[[Configurable]]' in Desc) || Desc['[[Configurable]]'])
			&& (!('[[Enumerable]]' in Desc) || Desc['[[Enumerable]]'])
			&& (!('[[Writable]]' in Desc) || Desc['[[Writable]]'])
			&& '[[Value]]' in Desc;
		if (creatingNormalDataProperty || settingExistingDataProperty) {
			O[P] = Desc['[[Value]]']; // eslint-disable-line no-param-reassign
			return SameValue$1(O[P], Desc['[[Value]]']);
		}
		throw new $SyntaxError$2('This environment does not support defining non-writable, non-enumerable, or non-configurable properties');
	}
	var desc = getOwnPropertyDescriptor(O, P);
	var current = desc && ToPropertyDescriptor$1(desc);
	var extensible = IsExtensible(O);
	return ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current);
};

var hasSymbols$5 = hasSymbols();
var hasToStringTag$2 = hasSymbols$5 && typeof Symbol.toStringTag === 'symbol';
var hasOwnProperty;
var regexExec;
var isRegexMarker;
var badStringifier;

if (hasToStringTag$2) {
	hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
	regexExec = Function.call.bind(RegExp.prototype.exec);
	isRegexMarker = {};

	var throwRegexMarker = function () {
		throw isRegexMarker;
	};
	badStringifier = {
		toString: throwRegexMarker,
		valueOf: throwRegexMarker
	};

	if (typeof Symbol.toPrimitive === 'symbol') {
		badStringifier[Symbol.toPrimitive] = throwRegexMarker;
	}
}

var toStr$8 = Object.prototype.toString;
var gOPD = Object.getOwnPropertyDescriptor;
var regexClass = '[object RegExp]';

var isRegex = hasToStringTag$2
	// eslint-disable-next-line consistent-return
	? function isRegex(value) {
		if (!value || typeof value !== 'object') {
			return false;
		}

		var descriptor = gOPD(value, 'lastIndex');
		var hasLastIndexDataProperty = descriptor && hasOwnProperty(descriptor, 'value');
		if (!hasLastIndexDataProperty) {
			return false;
		}

		try {
			regexExec(value, badStringifier);
		} catch (e) {
			return e === isRegexMarker;
		}
	}
	: function isRegex(value) {
		// In older browsers, typeof regex incorrectly returns 'function'
		if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
			return false;
		}

		return toStr$8.call(value) === regexClass;
	};

var $match = GetIntrinsic('%Symbol.match%', true);





// https://ecma-international.org/ecma-262/6.0/#sec-isregexp

var IsRegExp = function IsRegExp(argument) {
	if (!argument || typeof argument !== 'object') {
		return false;
	}
	if ($match) {
		var isRegExp = argument[$match];
		if (typeof isRegExp !== 'undefined') {
			return ToBoolean$1(isRegExp);
		}
	}
	return isRegex(argument);
};

var $TypeError$e = GetIntrinsic('%TypeError%');



var $isEnumerable$1 = callBound('Object.prototype.propertyIsEnumerable');









// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarygetownproperty

var OrdinaryGetOwnProperty = function OrdinaryGetOwnProperty(O, P) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$e('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$e('Assertion failed: P must be a Property Key');
	}
	if (!src(O, P)) {
		return void 0;
	}
	if (!getOwnPropertyDescriptor) {
		// ES3 / IE 8 fallback
		var arrayLength = IsArray(O) && P === 'length';
		var regexLastIndex = IsRegExp(O) && P === 'lastIndex';
		return {
			'[[Configurable]]': !(arrayLength || regexLastIndex),
			'[[Enumerable]]': $isEnumerable$1(O, P),
			'[[Value]]': O[P],
			'[[Writable]]': true
		};
	}
	return ToPropertyDescriptor$1(getOwnPropertyDescriptor(O, P));
};

var $String$1 = GetIntrinsic('%String%');
var $TypeError$f = GetIntrinsic('%TypeError%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-tostring

var ToString$1 = function ToString(argument) {
	if (typeof argument === 'symbol') {
		throw new $TypeError$f('Cannot convert a Symbol value to a string');
	}
	return $String$1(argument);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.6

var ToUint32$1 = function ToUint32(x) {
	return ToNumber$1(x) >>> 0;
};

var $RangeError$1 = GetIntrinsic('%RangeError%');
var $TypeError$g = GetIntrinsic('%TypeError%');















// https://www.ecma-international.org/ecma-262/6.0/#sec-arraysetlength

// eslint-disable-next-line max-statements, max-lines-per-function
var ArraySetLength = function ArraySetLength(A, Desc) {
	if (!IsArray(A)) {
		throw new $TypeError$g('Assertion failed: A must be an Array');
	}
	if (!isPropertyDescriptor({
		Type: Type$1,
		IsDataDescriptor: IsDataDescriptor$1,
		IsAccessorDescriptor: IsAccessorDescriptor$1
	}, Desc)) {
		throw new $TypeError$g('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!('[[Value]]' in Desc)) {
		return OrdinaryDefineOwnProperty(A, 'length', Desc);
	}
	var newLenDesc = object_assign({}, Desc);
	var newLen = ToUint32$1(Desc['[[Value]]']);
	var numberLen = ToNumber$1(Desc['[[Value]]']);
	if (newLen !== numberLen) {
		throw new $RangeError$1('Invalid array length');
	}
	newLenDesc['[[Value]]'] = newLen;
	var oldLenDesc = OrdinaryGetOwnProperty(A, 'length');
	if (!IsDataDescriptor$1(oldLenDesc)) {
		throw new $TypeError$g('Assertion failed: an array had a non-data descriptor on `length`');
	}
	var oldLen = oldLenDesc['[[Value]]'];
	if (newLen >= oldLen) {
		return OrdinaryDefineOwnProperty(A, 'length', newLenDesc);
	}
	if (!oldLenDesc['[[Writable]]']) {
		return false;
	}
	var newWritable;
	if (!('[[Writable]]' in newLenDesc) || newLenDesc['[[Writable]]']) {
		newWritable = true;
	} else {
		newWritable = false;
		newLenDesc['[[Writable]]'] = true;
	}
	var succeeded = OrdinaryDefineOwnProperty(A, 'length', newLenDesc);
	if (!succeeded) {
		return false;
	}
	while (newLen < oldLen) {
		oldLen -= 1;
		// eslint-disable-next-line no-param-reassign
		var deleteSucceeded = delete A[ToString$1(oldLen)];
		if (!deleteSucceeded) {
			newLenDesc['[[Value]]'] = oldLen + 1;
			if (!newWritable) {
				newLenDesc['[[Writable]]'] = false;
				OrdinaryDefineOwnProperty(A, 'length', newLenDesc);
				return false;
			}
		}
	}
	if (!newWritable) {
		return OrdinaryDefineOwnProperty(A, 'length', { '[[Writable]]': false });
	}
	return true;
};

var util_inspect = util.inspect;

var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var match = String.prototype.match;
var bigIntValueOf = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;

var inspectCustom = util_inspect.custom;
var inspectSymbol = inspectCustom && isSymbol$1(inspectCustom) ? inspectCustom : null;

var objectInspect = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has$1(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has$1(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has$1(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean') {
        throw new TypeError('option "customInspect", if provided, must be `true` or `false`');
    }

    if (
        has$1(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('options "indent" must be "\\t", an integer > 0, or `null`');
    }

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        return String(obj);
    }
    if (typeof obj === 'bigint') { // eslint-disable-line valid-typeof
        return String(obj) + 'n';
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = seen.slice();
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has$1(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function') {
        var name = nameOf(obj);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']';
    }
    if (isSymbol$1(obj)) {
        var symString = Symbol.prototype.toString.call(obj);
        return typeof obj === 'object' ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + String(obj.nodeName).toLowerCase();
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + String(obj.nodeName).toLowerCase() + '>';
        return s;
    }
    if (isArray(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + xs.join(', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + parts.join(', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function') {
            return obj[inspectSymbol]();
        } else if (typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap(obj)) {
        var mapParts = [];
        mapForEach.call(obj, function (value, key) {
            mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
        });
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet(obj)) {
        var setParts = [];
        setForEach.call(obj, function (value) {
            setParts.push(inspect(value, obj));
        });
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isNumber(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt(obj)) {
        return markBoxed(inspect(bigIntValueOf.call(obj)));
    }
    if (isBoolean(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        if (ys.length === 0) { return '{}'; }
        if (indent) {
            return '{' + indentedJoin(ys, indent) + '}';
        }
        return '{ ' + ys.join(', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return String(s).replace(/"/g, '&quot;');
}

function isArray(obj) { return toStr$9(obj) === '[object Array]'; }
function isDate(obj) { return toStr$9(obj) === '[object Date]'; }
function isRegExp(obj) { return toStr$9(obj) === '[object RegExp]'; }
function isError(obj) { return toStr$9(obj) === '[object Error]'; }
function isSymbol$1(obj) { return toStr$9(obj) === '[object Symbol]'; }
function isString(obj) { return toStr$9(obj) === '[object String]'; }
function isNumber(obj) { return toStr$9(obj) === '[object Number]'; }
function isBigInt(obj) { return toStr$9(obj) === '[object BigInt]'; }
function isBoolean(obj) { return toStr$9(obj) === '[object Boolean]'; }

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has$1(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr$9(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isSet(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString(str.slice(0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = str.replace(/(['\\])/g, '\\$1').replace(/[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b', 9: 't', 10: 'n', 12: 'f', 13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + n.toString(16);
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : entries.join(', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = Array(opts.indent + 1).join(' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: Array(depth + 1).join(baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + xs.join(',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has$1(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has$1(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if ((/[^\w$]/).test(key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    return xs;
}

var $TypeError$h = GetIntrinsic('%TypeError%');






/**
 * 7.3.1 Get (O, P) - https://ecma-international.org/ecma-262/6.0/#sec-get-o-p
 * 1. Assert: Type(O) is Object.
 * 2. Assert: IsPropertyKey(P) is true.
 * 3. Return O.[[Get]](P, O).
 */

var Get = function Get(O, P) {
	// 7.3.1.1
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$h('Assertion failed: Type(O) is not Object');
	}
	// 7.3.1.2
	if (!IsPropertyKey(P)) {
		throw new $TypeError$h('Assertion failed: IsPropertyKey(P) is not true, got ' + objectInspect(P));
	}
	// 7.3.1.3
	return O[P];
};

var $TypeError$i = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-definepropertyorthrow

var DefinePropertyOrThrow = function DefinePropertyOrThrow(O, P, desc) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$i('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey(P)) {
		throw new $TypeError$i('Assertion failed: IsPropertyKey(P) is not true');
	}

	var Desc = isPropertyDescriptor({
		Type: Type$1,
		IsDataDescriptor: IsDataDescriptor$1,
		IsAccessorDescriptor: IsAccessorDescriptor$1
	}, desc) ? desc : ToPropertyDescriptor$1(desc);
	if (!isPropertyDescriptor({
		Type: Type$1,
		IsDataDescriptor: IsDataDescriptor$1,
		IsAccessorDescriptor: IsAccessorDescriptor$1
	}, Desc)) {
		throw new $TypeError$i('Assertion failed: Desc is not a valid Property Descriptor');
	}

	return DefineOwnProperty(
		IsDataDescriptor$1,
		SameValue$1,
		FromPropertyDescriptor$1,
		O,
		P,
		Desc
	);
};

var IsConstructor = createCommonjsModule(function (module) {



var $construct = GetIntrinsic('%Reflect.construct%', true);

var DefinePropertyOrThrow$1 = DefinePropertyOrThrow;
try {
	DefinePropertyOrThrow$1({}, '', { '[[Get]]': function () {} });
} catch (e) {
	// Accessor properties aren't supported
	DefinePropertyOrThrow$1 = null;
}

// https://www.ecma-international.org/ecma-262/6.0/#sec-isconstructor

if (DefinePropertyOrThrow$1 && $construct) {
	var isConstructorMarker = {};
	var badArrayLike = {};
	DefinePropertyOrThrow$1(badArrayLike, 'length', {
		'[[Get]]': function () {
			throw isConstructorMarker;
		},
		'[[Enumerable]]': true
	});

	module.exports = function IsConstructor(argument) {
		try {
			// `Reflect.construct` invokes `IsConstructor(target)` before `Get(args, 'length')`:
			$construct(argument, badArrayLike);
		} catch (err) {
			return err === isConstructorMarker;
		}
	};
} else {
	module.exports = function IsConstructor(argument) {
		// unfortunately there's no way to truly check this without try/catch `new argument` in old environments
		return typeof argument === 'function' && !!argument.prototype;
	};
}
});

var $Array$1 = GetIntrinsic('%Array%');
var $species = GetIntrinsic('%Symbol.species%', true);
var $TypeError$j = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-arrayspeciescreate

var ArraySpeciesCreate = function ArraySpeciesCreate(originalArray, length) {
	if (!IsInteger(length) || length < 0) {
		throw new $TypeError$j('Assertion failed: length must be an integer >= 0');
	}
	var len = length === 0 ? 0 : length;
	var C;
	var isArray = IsArray(originalArray);
	if (isArray) {
		C = Get(originalArray, 'constructor');
		// TODO: figure out how to make a cross-realm normal Array, a same-realm Array
		// if (IsConstructor(C)) {
		// 	if C is another realm's Array, C = undefined
		// 	Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(Array))) === null ?
		// }
		if ($species && Type$1(C) === 'Object') {
			C = Get(C, $species);
			if (C === null) {
				C = void 0;
			}
		}
	}
	if (typeof C === 'undefined') {
		return $Array$1(len);
	}
	if (!IsConstructor(C)) {
		throw new $TypeError$j('C must be a constructor');
	}
	return new C(len); // Construct(C, len);
};

var $apply$1 = GetIntrinsic('%Reflect.apply%', true) || callBound('%Function.prototype.apply%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-call

var Call = function Call(F, V) {
	var args = arguments.length > 2 ? arguments[2] : [];
	return $apply$1(F, V, args);
};

var $TypeError$k = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring

var CanonicalNumericIndexString = function CanonicalNumericIndexString(argument) {
	if (Type$1(argument) !== 'String') {
		throw new $TypeError$k('Assertion failed: `argument` must be a String');
	}
	if (argument === '-0') { return -0; }
	var n = ToNumber$1(argument);
	if (SameValue$1(ToString$1(n), argument)) { return n; }
	return void 0;
};

// https://ecma-international.org/ecma-262/6.0/#sec-completepropertydescriptor

var CompletePropertyDescriptor = function CompletePropertyDescriptor(Desc) {
	/* eslint no-param-reassign: 0 */
	assertRecord(Type$1, 'Property Descriptor', 'Desc', Desc);

	if (IsGenericDescriptor$1(Desc) || IsDataDescriptor$1(Desc)) {
		if (!src(Desc, '[[Value]]')) {
			Desc['[[Value]]'] = void 0;
		}
		if (!src(Desc, '[[Writable]]')) {
			Desc['[[Writable]]'] = false;
		}
	} else {
		if (!src(Desc, '[[Get]]')) {
			Desc['[[Get]]'] = void 0;
		}
		if (!src(Desc, '[[Set]]')) {
			Desc['[[Set]]'] = void 0;
		}
	}
	if (!src(Desc, '[[Enumerable]]')) {
		Desc['[[Enumerable]]'] = false;
	}
	if (!src(Desc, '[[Configurable]]')) {
		Desc['[[Configurable]]'] = false;
	}
	return Desc;
};

var $TypeError$l = GetIntrinsic('%TypeError%');











// https://www.ecma-international.org/ecma-262/6.0/#sec-createdataproperty

var CreateDataProperty = function CreateDataProperty(O, P, V) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$l('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$l('Assertion failed: IsPropertyKey(P) is not true');
	}
	var oldDesc = OrdinaryGetOwnProperty(O, P);
	var extensible = !oldDesc || IsExtensible(O);
	var immutable = oldDesc && (!oldDesc['[[Writable]]'] || !oldDesc['[[Configurable]]']);
	if (immutable || !extensible) {
		return false;
	}
	return DefineOwnProperty(
		IsDataDescriptor$1,
		SameValue$1,
		FromPropertyDescriptor$1,
		O,
		P,
		{
			'[[Configurable]]': true,
			'[[Enumerable]]': true,
			'[[Value]]': V,
			'[[Writable]]': true
		}
	);
};

var $TypeError$m = GetIntrinsic('%TypeError%');





// // https://ecma-international.org/ecma-262/6.0/#sec-createdatapropertyorthrow

var CreateDataPropertyOrThrow = function CreateDataPropertyOrThrow(O, P, V) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$m('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$m('Assertion failed: IsPropertyKey(P) is not true');
	}
	var success = CreateDataProperty(O, P, V);
	if (!success) {
		throw new $TypeError$m('unable to create data property');
	}
	return success;
};

var RequireObjectCoercible = CheckObjectCoercible;

var $TypeError$n = GetIntrinsic('%TypeError%');



var $replace$2 = callBound('String.prototype.replace');





// https://www.ecma-international.org/ecma-262/6.0/#sec-createhtml

var CreateHTML = function CreateHTML(string, tag, attribute, value) {
	if (Type$1(tag) !== 'String' || Type$1(attribute) !== 'String') {
		throw new $TypeError$n('Assertion failed: `tag` and `attribute` must be strings');
	}
	var str = RequireObjectCoercible(string);
	var S = ToString$1(str);
	var p1 = '<' + tag;
	if (attribute !== '') {
		var V = ToString$1(value);
		var escapedV = $replace$2(V, /\x22/g, '&quot;');
		p1 += '\x20' + attribute + '\x3D\x22' + escapedV + '\x22';
	}
	return p1 + '>' + S + '</' + tag + '>';
};

var $TypeError$o = GetIntrinsic('%TypeError%');



// https://ecma-international.org/ecma-262/6.0/#sec-createiterresultobject

var CreateIterResultObject = function CreateIterResultObject(value, done) {
	if (Type$1(done) !== 'Boolean') {
		throw new $TypeError$o('Assertion failed: Type(done) is not Boolean');
	}
	return {
		value: value,
		done: done
	};
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-tointeger

var ToInteger$1 = function ToInteger$1(value) {
	var number = ToNumber$1(value);
	return ToInteger(number);
};

var ToLength = function ToLength(argument) {
	var len = ToInteger$1(argument);
	if (len <= 0) { return 0; } // includes converting -0 to +0
	if (len > maxSafeInteger) { return maxSafeInteger; }
	return len;
};

var $TypeError$p = GetIntrinsic('%TypeError%');
var $indexOf$1 = callBound('Array.prototype.indexOf', true) || callBound('String.prototype.indexOf');
var $push = callBound('Array.prototype.push');







// https://ecma-international.org/ecma-262/6.0/#sec-createlistfromarraylike
var CreateListFromArrayLike = function CreateListFromArrayLike(obj) {
	var elementTypes = arguments.length > 1
		? arguments[1]
		: ['Undefined', 'Null', 'Boolean', 'String', 'Symbol', 'Number', 'Object'];

	if (Type$1(obj) !== 'Object') {
		throw new $TypeError$p('Assertion failed: `obj` must be an Object');
	}
	if (!IsArray(elementTypes)) {
		throw new $TypeError$p('Assertion failed: `elementTypes`, if provided, must be an array');
	}
	var len = ToLength(Get(obj, 'length'));
	var list = [];
	var index = 0;
	while (index < len) {
		var indexName = ToString$1(index);
		var next = Get(obj, indexName);
		var nextType = Type$1(next);
		if ($indexOf$1(elementTypes, nextType) < 0) {
			throw new $TypeError$p('item type ' + nextType + ' is not a valid elementType');
		}
		$push(list, next);
		index += 1;
	}
	return list;
};

var $TypeError$q = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/6.0/#sec-createmethodproperty

var CreateMethodProperty = function CreateMethodProperty(O, P, V) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$q('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey(P)) {
		throw new $TypeError$q('Assertion failed: IsPropertyKey(P) is not true');
	}

	var newDesc = {
		'[[Configurable]]': true,
		'[[Enumerable]]': false,
		'[[Value]]': V,
		'[[Writable]]': true
	};
	return DefineOwnProperty(
		IsDataDescriptor$1,
		SameValue$1,
		FromPropertyDescriptor$1,
		O,
		P,
		newDesc
	);
};

var $floor$a = GetIntrinsic('%Math.floor%');

var msPerDay$5 = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var Day$1 = function Day(t) {
	return $floor$a(t / msPerDay$5);
};

var $floor$b = GetIntrinsic('%Math.floor%');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DayFromYear$1 = function DayFromYear(y) {
	return (365 * (y - 1970)) + $floor$b((y - 1969) / 4) - $floor$b((y - 1901) / 100) + $floor$b((y - 1601) / 400);
};

var $Date$2 = GetIntrinsic('%Date%');



var $getUTCFullYear$1 = callBound('Date.prototype.getUTCFullYear');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var YearFromTime$1 = function YearFromTime(t) {
	// largest y such that this.TimeFromYear(y) <= t
	return $getUTCFullYear$1(new $Date$2(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var DayWithinYear$1 = function DayWithinYear(t) {
	return Day$1(t) - DayFromYear$1(YearFromTime$1(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DaysInYear$1 = function DaysInYear(y) {
	if (mod(y, 4) !== 0) {
		return 365;
	}
	if (mod(y, 100) !== 0) {
		return 366;
	}
	if (mod(y, 400) !== 0) {
		return 365;
	}
	return 366;
};

var $EvalError$2 = GetIntrinsic('%EvalError%');




// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var InLeapYear$1 = function InLeapYear(t) {
	var days = DaysInYear$1(YearFromTime$1(t));
	if (days === 365) {
		return 0;
	}
	if (days === 366) {
		return 1;
	}
	throw new $EvalError$2('Assertion failed: there are not 365 or 366 days in a year, got: ' + days);
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var MonthFromTime$1 = function MonthFromTime(t) {
	var day = DayWithinYear$1(t);
	if (0 <= day && day < 31) {
		return 0;
	}
	var leap = InLeapYear$1(t);
	if (31 <= day && day < (59 + leap)) {
		return 1;
	}
	if ((59 + leap) <= day && day < (90 + leap)) {
		return 2;
	}
	if ((90 + leap) <= day && day < (120 + leap)) {
		return 3;
	}
	if ((120 + leap) <= day && day < (151 + leap)) {
		return 4;
	}
	if ((151 + leap) <= day && day < (181 + leap)) {
		return 5;
	}
	if ((181 + leap) <= day && day < (212 + leap)) {
		return 6;
	}
	if ((212 + leap) <= day && day < (243 + leap)) {
		return 7;
	}
	if ((243 + leap) <= day && day < (273 + leap)) {
		return 8;
	}
	if ((273 + leap) <= day && day < (304 + leap)) {
		return 9;
	}
	if ((304 + leap) <= day && day < (334 + leap)) {
		return 10;
	}
	if ((334 + leap) <= day && day < (365 + leap)) {
		return 11;
	}
};

var $EvalError$3 = GetIntrinsic('%EvalError%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.5

var DateFromTime$1 = function DateFromTime(t) {
	var m = MonthFromTime$1(t);
	var d = DayWithinYear$1(t);
	if (m === 0) {
		return d + 1;
	}
	if (m === 1) {
		return d - 30;
	}
	var leap = InLeapYear$1(t);
	if (m === 2) {
		return d - 58 - leap;
	}
	if (m === 3) {
		return d - 89 - leap;
	}
	if (m === 4) {
		return d - 119 - leap;
	}
	if (m === 5) {
		return d - 150 - leap;
	}
	if (m === 6) {
		return d - 180 - leap;
	}
	if (m === 7) {
		return d - 211 - leap;
	}
	if (m === 8) {
		return d - 242 - leap;
	}
	if (m === 9) {
		return d - 272 - leap;
	}
	if (m === 10) {
		return d - 303 - leap;
	}
	if (m === 11) {
		return d - 333 - leap;
	}
	throw new $EvalError$3('Assertion failed: MonthFromTime returned an impossible value: ' + m);
};

var $TypeError$r = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-deletepropertyorthrow

var DeletePropertyOrThrow = function DeletePropertyOrThrow(O, P) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$r('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey(P)) {
		throw new $TypeError$r('Assertion failed: IsPropertyKey(P) is not true');
	}

	// eslint-disable-next-line no-param-reassign
	var success = delete O[P];
	if (!success) {
		throw new $TypeError$r('Attempt to delete property failed.');
	}
	return success;
};

var $TypeError$s = GetIntrinsic('%TypeError%');





// https://www.ecma-international.org/ecma-262/6.0/#sec-enumerableownnames

var EnumerableOwnNames = function EnumerableOwnNames(O) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$s('Assertion failed: Type(O) is not Object');
	}

	return objectKeys(O);
};

var hasSymbols$6 = hasSymbols();



var $iterator = GetIntrinsic('%Symbol.iterator%', true);
var $stringSlice = callBound('String.prototype.slice');

var getIteratorMethod = function getIteratorMethod(ES, iterable) {
	var usingIterator;
	if (hasSymbols$6) {
		usingIterator = ES.GetMethod(iterable, $iterator);
	} else if (ES.IsArray(iterable)) {
		usingIterator = function () {
			var i = -1;
			var arr = this; // eslint-disable-line no-invalid-this
			return {
				next: function () {
					i += 1;
					return {
						done: i >= arr.length,
						value: arr[i]
					};
				}
			};
		};
	} else if (ES.Type(iterable) === 'String') {
		usingIterator = function () {
			var i = 0;
			return {
				next: function () {
					var nextIndex = ES.AdvanceStringIndex(iterable, i, true);
					var value = $stringSlice(iterable, i, nextIndex);
					i = nextIndex;
					return {
						done: nextIndex > iterable.length,
						value: value
					};
				}
			};
		};
	}
	return usingIterator;
};

var $Object$2 = GetIntrinsic('%Object%');



// https://www.ecma-international.org/ecma-262/6.0/#sec-toobject

var ToObject$1 = function ToObject(value) {
	RequireObjectCoercible(value);
	return $Object$2(value);
};

var $TypeError$t = GetIntrinsic('%TypeError%');




/**
 * 7.3.2 GetV (V, P)
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let O be ToObject(V).
 * 3. ReturnIfAbrupt(O).
 * 4. Return O.[[Get]](P, V).
 */

var GetV = function GetV(V, P) {
	// 7.3.2.1
	if (!IsPropertyKey(P)) {
		throw new $TypeError$t('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.2.2-3
	var O = ToObject$1(V);

	// 7.3.2.4
	return O[P];
};

var $TypeError$u = GetIntrinsic('%TypeError%');





/**
 * 7.3.9 - https://ecma-international.org/ecma-262/6.0/#sec-getmethod
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let func be GetV(O, P).
 * 3. ReturnIfAbrupt(func).
 * 4. If func is either undefined or null, return undefined.
 * 5. If IsCallable(func) is false, throw a TypeError exception.
 * 6. Return func.
 */

var GetMethod$1 = function GetMethod(O, P) {
	// 7.3.9.1
	if (!IsPropertyKey(P)) {
		throw new $TypeError$u('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.9.2
	var func = GetV(O, P);

	// 7.3.9.4
	if (func == null) {
		return void 0;
	}

	// 7.3.9.5
	if (!IsCallable$1(func)) {
		throw new $TypeError$u(P + 'is not a function');
	}

	// 7.3.9.6
	return func;
};

var $TypeError$v = GetIntrinsic('%TypeError%');








// https://ecma-international.org/ecma-262/6.0/#sec-getiterator

var GetIterator = function GetIterator(obj, method) {
	var actualMethod = method;
	if (arguments.length < 2) {
		actualMethod = getIteratorMethod(
			{
				AdvanceStringIndex: AdvanceStringIndex,
				GetMethod: GetMethod$1,
				IsArray: IsArray,
				Type: Type$1
			},
			obj
		);
	}
	var iterator = Call(actualMethod, obj);
	if (Type$1(iterator) !== 'Object') {
		throw new $TypeError$v('iterator must return an object');
	}

	return iterator;
};

var hasSymbols$7 = hasSymbols();

var $TypeError$w = GetIntrinsic('%TypeError%');

var $gOPN = GetIntrinsic('%Object.getOwnPropertyNames%');
var $gOPS = hasSymbols$7 && GetIntrinsic('%Object.getOwnPropertySymbols%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-getownpropertykeys

var GetOwnPropertyKeys = function GetOwnPropertyKeys(O, Type) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$w('Assertion failed: Type(O) is not Object');
	}
	if (Type === 'Symbol') {
		return $gOPS ? $gOPS(O) : [];
	}
	if (Type === 'String') {
		if (!$gOPN) {
			return objectKeys(O);
		}
		return $gOPN(O);
	}
	throw new $TypeError$w('Assertion failed: `Type` must be `"String"` or `"Symbol"`');
};

var $Function = GetIntrinsic('%Function%');
var $TypeError$x = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-getprototypefromconstructor

var GetPrototypeFromConstructor = function GetPrototypeFromConstructor(constructor, intrinsicDefaultProto) {
	var intrinsic = GetIntrinsic(intrinsicDefaultProto); // throws if not a valid intrinsic
	if (!IsConstructor(constructor)) {
		throw new $TypeError$x('Assertion failed: `constructor` must be a constructor');
	}
	var proto = Get(constructor, 'prototype');
	if (Type$1(proto) !== 'Object') {
		if (!(constructor instanceof $Function)) {
			// ignore other realms, for now
			throw new $TypeError$x('cross-realm constructors not currently supported');
		}
		proto = intrinsic;
	}
	return proto;
};

var $TypeError$y = GetIntrinsic('%TypeError%');
var $parseInt = GetIntrinsic('%parseInt%');







var isDigit = regexTester(/^[0-9]$/);

var $charAt = callBound('String.prototype.charAt');
var $strSlice$2 = callBound('String.prototype.slice');





var canDistinguishSparseFromUndefined = 0 in [undefined]; // IE 6 - 8 have a bug where this returns false

var isStringOrHole = function (capture, index, arr) {
	return Type$1(capture) === 'String' || (canDistinguishSparseFromUndefined ? !(index in arr) : Type$1(capture) === 'Undefined');
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-getsubstitution

// eslint-disable-next-line max-statements, max-params, max-lines-per-function
var GetSubstitution = function GetSubstitution(matched, str, position, captures, replacement) {
	if (Type$1(matched) !== 'String') {
		throw new $TypeError$y('Assertion failed: `matched` must be a String');
	}
	var matchLength = matched.length;

	if (Type$1(str) !== 'String') {
		throw new $TypeError$y('Assertion failed: `str` must be a String');
	}
	var stringLength = str.length;

	if (!IsInteger(position) || position < 0 || position > stringLength) {
		throw new $TypeError$y('Assertion failed: `position` must be a nonnegative integer, and less than or equal to the length of `string`, got ' + objectInspect(position));
	}

	if (!IsArray(captures) || !every(captures, isStringOrHole)) {
		throw new $TypeError$y('Assertion failed: `captures` must be a List of Strings, got ' + objectInspect(captures));
	}

	if (Type$1(replacement) !== 'String') {
		throw new $TypeError$y('Assertion failed: `replacement` must be a String');
	}

	var tailPos = position + matchLength;
	var m = captures.length;

	var result = '';
	for (var i = 0; i < replacement.length; i += 1) {
		// if this is a $, and it's not the end of the replacement
		var current = $charAt(replacement, i);
		var isLast = (i + 1) >= replacement.length;
		var nextIsLast = (i + 2) >= replacement.length;
		if (current === '$' && !isLast) {
			var next = $charAt(replacement, i + 1);
			if (next === '$') {
				result += '$';
				i += 1;
			} else if (next === '&') {
				result += matched;
				i += 1;
			} else if (next === '`') {
				result += position === 0 ? '' : $strSlice$2(str, 0, position - 1);
				i += 1;
			} else if (next === "'") {
				result += tailPos >= stringLength ? '' : $strSlice$2(str, tailPos);
				i += 1;
			} else {
				var nextNext = nextIsLast ? null : $charAt(replacement, i + 2);
				if (isDigit(next) && next !== '0' && (nextIsLast || !isDigit(nextNext))) {
					// $1 through $9, and not followed by a digit
					var n = $parseInt(next, 10);
					// if (n > m, impl-defined)
					result += (n <= m && Type$1(captures[n - 1]) === 'Undefined') ? '' : captures[n - 1];
					i += 1;
				} else if (isDigit(next) && (nextIsLast || isDigit(nextNext))) {
					// $00 through $99
					var nn = next + nextNext;
					var nnI = $parseInt(nn, 10) - 1;
					// if nn === '00' or nn > m, impl-defined
					result += (nn <= m && Type$1(captures[nnI]) === 'Undefined') ? '' : captures[nnI];
					i += 2;
				} else {
					result += '$';
				}
			}
		} else {
			// the final $, or else not a $
			result += $charAt(replacement, i);
		}
	}
	return result;
};

var $TypeError$z = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-hasownproperty

var HasOwnProperty = function HasOwnProperty(O, P) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$z('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$z('Assertion failed: `P` must be a Property Key');
	}
	return src(O, P);
};

var $TypeError$A = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-hasproperty

var HasProperty = function HasProperty(O, P) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$A('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$A('Assertion failed: `P` must be a Property Key');
	}
	return P in O;
};

var $floor$c = GetIntrinsic('%Math.floor%');



var msPerHour$3 = timeConstants.msPerHour;
var HoursPerDay$2 = timeConstants.HoursPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var HourFromTime$1 = function HourFromTime(t) {
	return mod($floor$c(t / msPerHour$3), HoursPerDay$2);
};

var $TypeError$B = GetIntrinsic('%TypeError%');





// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasinstance

var OrdinaryHasInstance = function OrdinaryHasInstance(C, O) {
	if (IsCallable$1(C) === false) {
		return false;
	}
	if (Type$1(O) !== 'Object') {
		return false;
	}
	var P = Get(C, 'prototype');
	if (Type$1(P) !== 'Object') {
		throw new $TypeError$B('OrdinaryHasInstance called on an object with an invalid prototype property.');
	}
	return O instanceof C;
};

var $TypeError$C = GetIntrinsic('%TypeError%');

var $hasInstance = GetIntrinsic('Symbol.hasInstance', true);








// https://www.ecma-international.org/ecma-262/6.0/#sec-instanceofoperator

var InstanceofOperator = function InstanceofOperator(O, C) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$C('Assertion failed: Type(O) is not Object');
	}
	var instOfHandler = $hasInstance ? GetMethod$1(C, $hasInstance) : void 0;
	if (typeof instOfHandler !== 'undefined') {
		return ToBoolean$1(Call(instOfHandler, C, [O]));
	}
	if (!IsCallable$1(C)) {
		throw new $TypeError$C('`C` is not Callable');
	}
	return OrdinaryHasInstance(C, O);
};

var $TypeError$D = GetIntrinsic('%TypeError%');

var $arraySlice = callBound('Array.prototype.slice');





// https://ecma-international.org/ecma-262/6.0/#sec-invoke

var Invoke = function Invoke(O, P) {
	if (!IsPropertyKey(P)) {
		throw new $TypeError$D('P must be a Property Key');
	}
	var argumentsList = $arraySlice(arguments, 2);
	var func = GetV(O, P);
	return Call(func, O, argumentsList);
};

var $isConcatSpreadable = GetIntrinsic('%Symbol.isConcatSpreadable%', true);






// https://ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable

var IsConcatSpreadable = function IsConcatSpreadable(O) {
	if (Type$1(O) !== 'Object') {
		return false;
	}
	if ($isConcatSpreadable) {
		var spreadable = Get(O, $isConcatSpreadable);
		if (typeof spreadable !== 'undefined') {
			return ToBoolean$1(spreadable);
		}
	}
	return IsArray(O);
};

var $PromiseThen = callBound('Promise.prototype.then', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-ispromise

var IsPromise = function IsPromise(x) {
	if (Type$1(x) !== 'Object') {
		return false;
	}
	if (!$PromiseThen) { // Promises are not supported
		return false;
	}
	try {
		$PromiseThen(x); // throws if not a promise
	} catch (e) {
		return false;
	}
	return true;
};

// https://ecma-international.org/ecma-262/6.0/#sec-property-descriptor-specification-type

var IsPropertyDescriptor$1 = function IsPropertyDescriptor(Desc) {
	return isPropertyDescriptor({
		IsDataDescriptor: IsDataDescriptor$1,
		IsAccessorDescriptor: IsAccessorDescriptor$1,
		Type: Type$1
	}, Desc);
};

var $TypeError$E = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-iteratorclose

var IteratorClose = function IteratorClose(iterator, completion) {
	if (Type$1(iterator) !== 'Object') {
		throw new $TypeError$E('Assertion failed: Type(iterator) is not Object');
	}
	if (!IsCallable$1(completion)) {
		throw new $TypeError$E('Assertion failed: completion is not a thunk for a Completion Record');
	}
	var completionThunk = completion;

	var iteratorReturn = GetMethod$1(iterator, 'return');

	if (typeof iteratorReturn === 'undefined') {
		return completionThunk();
	}

	var completionRecord;
	try {
		var innerResult = Call(iteratorReturn, iterator, []);
	} catch (e) {
		// if we hit here, then "e" is the innerResult completion that needs re-throwing

		// if the completion is of type "throw", this will throw.
		completionThunk();
		completionThunk = null; // ensure it's not called twice.

		// if not, then return the innerResult completion
		throw e;
	}
	completionRecord = completionThunk(); // if innerResult worked, then throw if the completion does
	completionThunk = null; // ensure it's not called twice.

	if (Type$1(innerResult) !== 'Object') {
		throw new $TypeError$E('iterator .return must return an object');
	}

	return completionRecord;
};

var $TypeError$F = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-iteratorcomplete

var IteratorComplete = function IteratorComplete(iterResult) {
	if (Type$1(iterResult) !== 'Object') {
		throw new $TypeError$F('Assertion failed: Type(iterResult) is not Object');
	}
	return ToBoolean$1(Get(iterResult, 'done'));
};

var $TypeError$G = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratornext

var IteratorNext = function IteratorNext(iterator, value) {
	var result = Invoke(iterator, 'next', arguments.length < 2 ? [] : [value]);
	if (Type$1(result) !== 'Object') {
		throw new $TypeError$G('iterator next must return an object');
	}
	return result;
};

// https://ecma-international.org/ecma-262/6.0/#sec-iteratorstep

var IteratorStep = function IteratorStep(iterator) {
	var result = IteratorNext(iterator);
	var done = IteratorComplete(result);
	return done === true ? false : result;
};

var $TypeError$H = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratorvalue

var IteratorValue = function IteratorValue(iterResult) {
	if (Type$1(iterResult) !== 'Object') {
		throw new $TypeError$H('Assertion failed: Type(iterResult) is not Object');
	}
	return Get(iterResult, 'value');
};

var msPerDay$6 = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.13

var MakeDate$1 = function MakeDate(day, time) {
	if (!_isFinite(day) || !_isFinite(time)) {
		return NaN;
	}
	return (day * msPerDay$6) + time;
};

var $floor$d = GetIntrinsic('%Math.floor%');
var $DateUTC$1 = GetIntrinsic('%Date.UTC%');










// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.12

var MakeDay$1 = function MakeDay(year, month, date) {
	if (!_isFinite(year) || !_isFinite(month) || !_isFinite(date)) {
		return NaN;
	}
	var y = ToInteger$1(year);
	var m = ToInteger$1(month);
	var dt = ToInteger$1(date);
	var ym = y + $floor$d(m / 12);
	var mn = mod(m, 12);
	var t = $DateUTC$1(ym, mn, 1);
	if (YearFromTime$1(t) !== ym || MonthFromTime$1(t) !== mn || DateFromTime$1(t) !== 1) {
		return NaN;
	}
	return Day$1(t) + dt - 1;
};

var msPerSecond$4 = timeConstants.msPerSecond;
var msPerMinute$3 = timeConstants.msPerMinute;
var msPerHour$4 = timeConstants.msPerHour;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.11

var MakeTime$1 = function MakeTime(hour, min, sec, ms) {
	if (!_isFinite(hour) || !_isFinite(min) || !_isFinite(sec) || !_isFinite(ms)) {
		return NaN;
	}
	var h = ToInteger$1(hour);
	var m = ToInteger$1(min);
	var s = ToInteger$1(sec);
	var milli = ToInteger$1(ms);
	var t = (h * msPerHour$4) + (m * msPerMinute$3) + (s * msPerSecond$4) + milli;
	return t;
};

var $floor$e = GetIntrinsic('%Math.floor%');



var msPerMinute$4 = timeConstants.msPerMinute;
var MinutesPerHour$2 = timeConstants.MinutesPerHour;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var MinFromTime$1 = function MinFromTime(t) {
	return mod($floor$e(t / msPerMinute$4), MinutesPerHour$2);
};

// https://ecma-international.org/ecma-262/5.1/#sec-5.2

var modulo$1 = function modulo(x, y) {
	return mod(x, y);
};

var msPerSecond$5 = timeConstants.msPerSecond;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var msFromTime$1 = function msFromTime(t) {
	return mod(t, msPerSecond$5);
};

var $ObjectCreate = GetIntrinsic('%Object.create%', true);
var $TypeError$I = GetIntrinsic('%TypeError%');
var $SyntaxError$3 = GetIntrinsic('%SyntaxError%');



var hasProto = !({ __proto__: null } instanceof Object);

// https://www.ecma-international.org/ecma-262/6.0/#sec-objectcreate

var ObjectCreate = function ObjectCreate(proto, internalSlotsList) {
	if (proto !== null && Type$1(proto) !== 'Object') {
		throw new $TypeError$I('Assertion failed: `proto` must be null or an object');
	}
	var slots = arguments.length < 2 ? [] : internalSlotsList;
	if (slots.length > 0) {
		throw new $SyntaxError$3('es-abstract does not yet support internal slots');
	}

	if ($ObjectCreate) {
		return $ObjectCreate(proto);
	}
	if (hasProto) {
		return { __proto__: proto };
	}

	if (proto === null) {
		throw new $SyntaxError$3('native Object.create support is required to create null objects');
	}
	var T = function T() {};
	T.prototype = proto;
	return new T();
};

var $TypeError$J = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasproperty

var OrdinaryHasProperty = function OrdinaryHasProperty(O, P) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$J('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$J('Assertion failed: P must be a Property Key');
	}
	return P in O;
};

var $TypeError$K = GetIntrinsic('%TypeError%');

var regexExec$1 = callBound('RegExp.prototype.exec');






// https://ecma-international.org/ecma-262/6.0/#sec-regexpexec

var RegExpExec = function RegExpExec(R, S) {
	if (Type$1(R) !== 'Object') {
		throw new $TypeError$K('Assertion failed: `R` must be an Object');
	}
	if (Type$1(S) !== 'String') {
		throw new $TypeError$K('Assertion failed: `S` must be a String');
	}
	var exec = Get(R, 'exec');
	if (IsCallable$1(exec)) {
		var result = Call(exec, R, [S]);
		if (result === null || Type$1(result) === 'Object') {
			return result;
		}
		throw new $TypeError$K('"exec" method must return `null` or an Object');
	}
	return regexExec$1(R, S);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-samevaluezero

var SameValueZero = function SameValueZero(x, y) {
	return (x === y) || (_isNaN(x) && _isNaN(y));
};

var $floor$f = GetIntrinsic('%Math.floor%');



var msPerSecond$6 = timeConstants.msPerSecond;
var SecondsPerMinute$2 = timeConstants.SecondsPerMinute;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var SecFromTime$1 = function SecFromTime(t) {
	return mod($floor$f(t / msPerSecond$6), SecondsPerMinute$2);
};

var $TypeError$L = GetIntrinsic('%TypeError%');





// IE 9 does not throw in strict mode when writability/configurability/extensibility is violated
var noThrowOnStrictViolation = (function () {
	try {
		delete [].length;
		return true;
	} catch (e) {
		return false;
	}
}());

// https://ecma-international.org/ecma-262/6.0/#sec-set-o-p-v-throw

var _Set = function Set(O, P, V, Throw) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$L('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeError$L('Assertion failed: `P` must be a Property Key');
	}
	if (Type$1(Throw) !== 'Boolean') {
		throw new $TypeError$L('Assertion failed: `Throw` must be a Boolean');
	}
	if (Throw) {
		O[P] = V; // eslint-disable-line no-param-reassign
		if (noThrowOnStrictViolation && !SameValue$1(O[P], V)) {
			throw new $TypeError$L('Attempted to assign to readonly property.');
		}
		return true;
	} else {
		try {
			O[P] = V; // eslint-disable-line no-param-reassign
			return noThrowOnStrictViolation ? SameValue$1(O[P], V) : true;
		} catch (e) {
			return false;
		}
	}
};

var getInferredName;
try {
	// eslint-disable-next-line no-new-func
	getInferredName = Function('s', 'return { [s]() {} }[s].name;');
} catch (e) {}

var inferred = function () {};
var getInferredName_1 = getInferredName && inferred.name === 'inferred' ? getInferredName : null;

var $SyntaxError$4 = GetIntrinsic('%SyntaxError%');
var getGlobalSymbolDescription = GetIntrinsic('%Symbol.keyFor%', true);
var thisSymbolValue = callBound('%Symbol.prototype.valueOf%', true);
var symToStr = callBound('Symbol.prototype.toString', true);



/* eslint-disable consistent-return */
var getSymbolDescription = callBound('%Symbol.prototype.description%', true) || function getSymbolDescription(symbol) {
	if (!thisSymbolValue) {
		throw new $SyntaxError$4('Symbols are not supported in this environment');
	}

	// will throw if not a symbol primitive or wrapper object
	var sym = thisSymbolValue(symbol);

	if (getInferredName_1) {
		var name = getInferredName_1(sym);
		if (name === '') { return; }
		return name.slice(1, -1); // name.slice('['.length, -']'.length);
	}

	var desc;
	if (getGlobalSymbolDescription) {
		desc = getGlobalSymbolDescription(sym);
		if (typeof desc === 'string') {
			return desc;
		}
	}

	desc = symToStr(sym).slice(7, -1); // str.slice('Symbol('.length, -')'.length);
	if (desc) {
		return desc;
	}
};

var $TypeError$M = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-setfunctionname

var SetFunctionName = function SetFunctionName(F, name) {
	if (typeof F !== 'function') {
		throw new $TypeError$M('Assertion failed: `F` must be a function');
	}
	if (!IsExtensible(F) || src(F, 'name')) {
		throw new $TypeError$M('Assertion failed: `F` must be extensible, and must not have a `name` own property');
	}
	var nameType = Type$1(name);
	if (nameType !== 'Symbol' && nameType !== 'String') {
		throw new $TypeError$M('Assertion failed: `name` must be a Symbol or a String');
	}
	if (nameType === 'Symbol') {
		var description = getSymbolDescription(name);
		// eslint-disable-next-line no-param-reassign
		name = typeof description === 'undefined' ? '' : '[' + description + ']';
	}
	if (arguments.length > 2) {
		var prefix = arguments[2];
		// eslint-disable-next-line no-param-reassign
		name = prefix + ' ' + name;
	}
	return DefinePropertyOrThrow(F, 'name', {
		'[[Value]]': name,
		'[[Writable]]': false,
		'[[Enumerable]]': false,
		'[[Configurable]]': true
	});
};

var forEach = function forEach(array, callback) {
	for (var i = 0; i < array.length; i += 1) {
		callback(array[i], i, array); // eslint-disable-line callback-return
	}
};

var $SyntaxError$5 = GetIntrinsic('%SyntaxError%');
var $TypeError$N = GetIntrinsic('%TypeError%');
var $preventExtensions$1 = GetIntrinsic('%Object.preventExtensions%');

var $gOPN$1 = GetIntrinsic('%Object.getOwnPropertyNames%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-setintegritylevel

var SetIntegrityLevel = function SetIntegrityLevel(O, level) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$N('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$N('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	if (!$preventExtensions$1) {
		throw new $SyntaxError$5('SetIntegrityLevel requires native `Object.preventExtensions` support');
	}
	var status = $preventExtensions$1(O);
	if (!status) {
		return false;
	}
	if (!$gOPN$1) {
		throw new $SyntaxError$5('SetIntegrityLevel requires native `Object.getOwnPropertyNames` support');
	}
	var theKeys = $gOPN$1(O);
	if (level === 'sealed') {
		forEach(theKeys, function (k) {
			DefinePropertyOrThrow(O, k, { configurable: false });
		});
	} else if (level === 'frozen') {
		forEach(theKeys, function (k) {
			var currentDesc = getOwnPropertyDescriptor(O, k);
			if (typeof currentDesc !== 'undefined') {
				var desc;
				if (IsAccessorDescriptor$1(ToPropertyDescriptor$1(currentDesc))) {
					desc = { configurable: false };
				} else {
					desc = { configurable: false, writable: false };
				}
				DefinePropertyOrThrow(O, k, desc);
			}
		});
	}
	return true;
};

var $species$1 = GetIntrinsic('%Symbol.species%', true);
var $TypeError$O = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-speciesconstructor

var SpeciesConstructor = function SpeciesConstructor(O, defaultConstructor) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$O('Assertion failed: Type(O) is not Object');
	}
	var C = O.constructor;
	if (typeof C === 'undefined') {
		return defaultConstructor;
	}
	if (Type$1(C) !== 'Object') {
		throw new $TypeError$O('O.constructor is not an Object');
	}
	var S = $species$1 ? C[$species$1] : void 0;
	if (S == null) {
		return defaultConstructor;
	}
	if (IsConstructor(S)) {
		return S;
	}
	throw new $TypeError$O('no constructor found');
};

var $TypeError$P = GetIntrinsic('%TypeError%');



var $SymbolToString = callBound('Symbol.prototype.toString', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-symboldescriptivestring

var SymbolDescriptiveString = function SymbolDescriptiveString(sym) {
	if (Type$1(sym) !== 'Symbol') {
		throw new $TypeError$P('Assertion failed: `sym` must be a Symbol');
	}
	return $SymbolToString(sym);
};

var $gOPN$2 = GetIntrinsic('%Object.getOwnPropertyNames%');
var $TypeError$Q = GetIntrinsic('%TypeError%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-testintegritylevel

var TestIntegrityLevel = function TestIntegrityLevel(O, level) {
	if (Type$1(O) !== 'Object') {
		throw new $TypeError$Q('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$Q('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	var status = IsExtensible(O);
	if (status) {
		return false;
	}
	var theKeys = $gOPN$2(O);
	return theKeys.length === 0 || every(theKeys, function (k) {
		var currentDesc = getOwnPropertyDescriptor(O, k);
		if (typeof currentDesc !== 'undefined') {
			if (currentDesc.configurable) {
				return false;
			}
			if (level === 'frozen' && IsDataDescriptor$1(ToPropertyDescriptor$1(currentDesc)) && currentDesc.writable) {
				return false;
			}
		}
		return true;
	});
};

var $BooleanValueOf = callBound('Boolean.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-boolean-prototype-object

var thisBooleanValue = function thisBooleanValue(value) {
	if (Type$1(value) === 'Boolean') {
		return value;
	}

	return $BooleanValueOf(value);
};

var $NumberValueOf = callBound('Number.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-number-prototype-object

var thisNumberValue = function thisNumberValue(value) {
	if (Type$1(value) === 'Number') {
		return value;
	}

	return $NumberValueOf(value);
};

var $StringValueOf = callBound('String.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-string-prototype-object

var thisStringValue = function thisStringValue(value) {
	if (Type$1(value) === 'String') {
		return value;
	}

	return $StringValueOf(value);
};

var $DateValueOf = callBound('Date.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-date-prototype-object

var thisTimeValue = function thisTimeValue(value) {
	return $DateValueOf(value);
};

var $Date$3 = GetIntrinsic('%Date%');
var $Number$5 = GetIntrinsic('%Number%');
var $abs$4 = GetIntrinsic('%Math.abs%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.14

var TimeClip$1 = function TimeClip(time) {
	if (!_isFinite(time) || $abs$4(time) > 8.64e15) {
		return NaN;
	}
	return $Number$5(new $Date$3(ToNumber$1(time)));
};

var msPerDay$7 = timeConstants.msPerDay;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var TimeFromYear$1 = function TimeFromYear(y) {
	return msPerDay$7 * DayFromYear$1(y);
};

var msPerDay$8 = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var TimeWithinDay$1 = function TimeWithinDay(t) {
	return mod(t, msPerDay$8);
};

var $TypeError$R = GetIntrinsic('%TypeError%');
var $Date$4 = GetIntrinsic('%Date%');





// https://ecma-international.org/ecma-262/6.0/#sec-todatestring

var ToDateString = function ToDateString(tv) {
	if (Type$1(tv) !== 'Number') {
		throw new $TypeError$R('Assertion failed: `tv` must be a Number');
	}
	if (_isNaN(tv)) {
		return 'Invalid Date';
	}
	return $Date$4(tv);
};

var $Math$4 = GetIntrinsic('%Math%');








var $floor$g = $Math$4.floor;
var $abs$5 = $Math$4.abs;

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.7

var ToUint16$1 = function ToUint16(value) {
	var number = ToNumber$1(value);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$g($abs$5(number));
	return mod(posInt, 0x10000);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint16

var ToInt16 = function ToInt16(argument) {
	var int16bit = ToUint16$1(argument);
	return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.5

var ToInt32$1 = function ToInt32(x) {
	return ToNumber$1(x) >> 0;
};

var $Math$5 = GetIntrinsic('%Math%');








var $floor$h = $Math$5.floor;
var $abs$6 = $Math$5.abs;

var ToUint8 = function ToUint8(argument) {
	var number = ToNumber$1(argument);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$h($abs$6(number));
	return mod(posInt, 0x100);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint8

var ToInt8 = function ToInt8(argument) {
	var int8bit = ToUint8(argument);
	return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
};

var $String$2 = GetIntrinsic('%String%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-topropertykey

var ToPropertyKey = function ToPropertyKey(argument) {
	var key = ToPrimitive$1(argument, $String$2);
	return typeof key === 'symbol' ? key : ToString$1(key);
};

var $Math$6 = GetIntrinsic('%Math%');





var $floor$i = $Math$6.floor;

// https://www.ecma-international.org/ecma-262/6.0/#sec-touint8clamp

var ToUint8Clamp = function ToUint8Clamp(argument) {
	var number = ToNumber$1(argument);
	if (_isNaN(number) || number <= 0) { return 0; }
	if (number >= 0xFF) { return 0xFF; }
	var f = $floor$i(argument);
	if (f + 0.5 < number) { return f + 1; }
	if (number < f + 0.5) { return f; }
	if (f % 2 !== 0) { return f + 1; }
	return f;
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.6

var WeekDay$1 = function WeekDay(t) {
	return mod(Day$1(t) + 4, 7);
};

/* eslint global-require: 0 */
// https://www.ecma-international.org/ecma-262/6.0/#sec-abstract-operations
var ES6 = {
	'Abstract Equality Comparison': AbstractEqualityComparison$1,
	'Abstract Relational Comparison': AbstractRelationalComparison$1,
	'Strict Equality Comparison': StrictEqualityComparison$1,
	AdvanceStringIndex: AdvanceStringIndex,
	ArrayCreate: ArrayCreate,
	ArraySetLength: ArraySetLength,
	ArraySpeciesCreate: ArraySpeciesCreate,
	Call: Call,
	CanonicalNumericIndexString: CanonicalNumericIndexString,
	CompletePropertyDescriptor: CompletePropertyDescriptor,
	CreateDataProperty: CreateDataProperty,
	CreateDataPropertyOrThrow: CreateDataPropertyOrThrow,
	CreateHTML: CreateHTML,
	CreateIterResultObject: CreateIterResultObject,
	CreateListFromArrayLike: CreateListFromArrayLike,
	CreateMethodProperty: CreateMethodProperty,
	DateFromTime: DateFromTime$1,
	Day: Day$1,
	DayFromYear: DayFromYear$1,
	DaysInYear: DaysInYear$1,
	DayWithinYear: DayWithinYear$1,
	DefinePropertyOrThrow: DefinePropertyOrThrow,
	DeletePropertyOrThrow: DeletePropertyOrThrow,
	EnumerableOwnNames: EnumerableOwnNames,
	FromPropertyDescriptor: FromPropertyDescriptor$1,
	Get: Get,
	GetIterator: GetIterator,
	GetMethod: GetMethod$1,
	GetOwnPropertyKeys: GetOwnPropertyKeys,
	GetPrototypeFromConstructor: GetPrototypeFromConstructor,
	GetSubstitution: GetSubstitution,
	GetV: GetV,
	HasOwnProperty: HasOwnProperty,
	HasProperty: HasProperty,
	HourFromTime: HourFromTime$1,
	InLeapYear: InLeapYear$1,
	InstanceofOperator: InstanceofOperator,
	Invoke: Invoke,
	IsAccessorDescriptor: IsAccessorDescriptor$1,
	IsArray: IsArray,
	IsCallable: IsCallable$1,
	IsConcatSpreadable: IsConcatSpreadable,
	IsConstructor: IsConstructor,
	IsDataDescriptor: IsDataDescriptor$1,
	IsExtensible: IsExtensible,
	IsGenericDescriptor: IsGenericDescriptor$1,
	IsInteger: IsInteger,
	IsPromise: IsPromise,
	IsPropertyDescriptor: IsPropertyDescriptor$1,
	IsPropertyKey: IsPropertyKey,
	IsRegExp: IsRegExp,
	IteratorClose: IteratorClose,
	IteratorComplete: IteratorComplete,
	IteratorNext: IteratorNext,
	IteratorStep: IteratorStep,
	IteratorValue: IteratorValue,
	MakeDate: MakeDate$1,
	MakeDay: MakeDay$1,
	MakeTime: MakeTime$1,
	MinFromTime: MinFromTime$1,
	modulo: modulo$1,
	MonthFromTime: MonthFromTime$1,
	msFromTime: msFromTime$1,
	ObjectCreate: ObjectCreate,
	OrdinaryDefineOwnProperty: OrdinaryDefineOwnProperty,
	OrdinaryGetOwnProperty: OrdinaryGetOwnProperty,
	OrdinaryHasInstance: OrdinaryHasInstance,
	OrdinaryHasProperty: OrdinaryHasProperty,
	RegExpExec: RegExpExec,
	RequireObjectCoercible: RequireObjectCoercible,
	SameValue: SameValue$1,
	SameValueZero: SameValueZero,
	SecFromTime: SecFromTime$1,
	Set: _Set,
	SetFunctionName: SetFunctionName,
	SetIntegrityLevel: SetIntegrityLevel,
	SpeciesConstructor: SpeciesConstructor,
	SymbolDescriptiveString: SymbolDescriptiveString,
	TestIntegrityLevel: TestIntegrityLevel,
	thisBooleanValue: thisBooleanValue,
	thisNumberValue: thisNumberValue,
	thisStringValue: thisStringValue,
	thisTimeValue: thisTimeValue,
	TimeClip: TimeClip$1,
	TimeFromYear: TimeFromYear$1,
	TimeWithinDay: TimeWithinDay$1,
	ToBoolean: ToBoolean$1,
	ToDateString: ToDateString,
	ToInt16: ToInt16,
	ToInt32: ToInt32$1,
	ToInt8: ToInt8,
	ToInteger: ToInteger$1,
	ToLength: ToLength,
	ToNumber: ToNumber$1,
	ToObject: ToObject$1,
	ToPrimitive: ToPrimitive$1,
	ToPropertyDescriptor: ToPropertyDescriptor$1,
	ToPropertyKey: ToPropertyKey,
	ToString: ToString$1,
	ToUint16: ToUint16$1,
	ToUint32: ToUint32$1,
	ToUint8: ToUint8,
	ToUint8Clamp: ToUint8Clamp,
	Type: Type$1,
	ValidateAndApplyPropertyDescriptor: ValidateAndApplyPropertyDescriptor,
	WeekDay: WeekDay$1,
	YearFromTime: YearFromTime$1
};

var es2015$1 = ES6;

// https://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive

var ToPrimitive$2 = function ToPrimitive(input) {
	if (arguments.length > 1) {
		return es2015(input, arguments[1]);
	}
	return es2015(input);
};

var $TypeError$S = GetIntrinsic('%TypeError%');
var $Number$6 = GetIntrinsic('%Number%');
var $RegExp$1 = GetIntrinsic('%RegExp%');
var $parseInteger$1 = GetIntrinsic('%parseInt%');





var $strSlice$3 = callBound('String.prototype.slice');
var isBinary$1 = regexTester(/^0b[01]+$/i);
var isOctal$1 = regexTester(/^0o[0-7]+$/i);
var isInvalidHexLiteral$1 = regexTester(/^[-+]0x[0-9a-f]+$/i);
var nonWS$1 = ['\u0085', '\u200b', '\ufffe'].join('');
var nonWSregex$1 = new $RegExp$1('[' + nonWS$1 + ']', 'g');
var hasNonWS$1 = regexTester(nonWSregex$1);

// whitespace from: https://es5.github.io/#x15.5.4.20
// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
var ws$1 = [
	'\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003',
	'\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028',
	'\u2029\uFEFF'
].join('');
var trimRegex$1 = new RegExp('(^[' + ws$1 + ']+)|([' + ws$1 + ']+$)', 'g');
var $replace$3 = callBound('String.prototype.replace');
var $trim$1 = function (value) {
	return $replace$3(value, trimRegex$1, '');
};



// https://www.ecma-international.org/ecma-262/6.0/#sec-tonumber

var ToNumber$2 = function ToNumber(argument) {
	var value = isPrimitive$1(argument) ? argument : ToPrimitive$2(argument, $Number$6);
	if (typeof value === 'symbol') {
		throw new $TypeError$S('Cannot convert a Symbol value to a number');
	}
	if (typeof value === 'string') {
		if (isBinary$1(value)) {
			return ToNumber($parseInteger$1($strSlice$3(value, 2), 2));
		} else if (isOctal$1(value)) {
			return ToNumber($parseInteger$1($strSlice$3(value, 2), 8));
		} else if (hasNonWS$1(value) || isInvalidHexLiteral$1(value)) {
			return NaN;
		} else {
			var trimmed = $trim$1(value);
			if (trimmed !== value) {
				return ToNumber(trimmed);
			}
		}
	}
	return $Number$6(value);
};

// https://ecma-international.org/ecma-262/6.0/#sec-ecmascript-data-types-and-values

var Type$2 = function Type$1(x) {
	if (typeof x === 'symbol') {
		return 'Symbol';
	}
	return Type(x);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-abstract-equality-comparison

var AbstractEqualityComparison$2 = function AbstractEqualityComparison(x, y) {
	var xType = Type$2(x);
	var yType = Type$2(y);
	if (xType === yType) {
		return x === y; // ES6+ specified this shortcut anyways.
	}
	if (x == null && y == null) {
		return true;
	}
	if (xType === 'Number' && yType === 'String') {
		return AbstractEqualityComparison(x, ToNumber$2(y));
	}
	if (xType === 'String' && yType === 'Number') {
		return AbstractEqualityComparison(ToNumber$2(x), y);
	}
	if (xType === 'Boolean') {
		return AbstractEqualityComparison(ToNumber$2(x), y);
	}
	if (yType === 'Boolean') {
		return AbstractEqualityComparison(x, ToNumber$2(y));
	}
	if ((xType === 'String' || xType === 'Number' || xType === 'Symbol') && yType === 'Object') {
		return AbstractEqualityComparison(x, ToPrimitive$2(y));
	}
	if (xType === 'Object' && (yType === 'String' || yType === 'Number' || yType === 'Symbol')) {
		return AbstractEqualityComparison(ToPrimitive$2(x), y);
	}
	return false;
};

var $Number$7 = GetIntrinsic('%Number%');
var $TypeError$T = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/5.1/#sec-11.8.5

// eslint-disable-next-line max-statements
var AbstractRelationalComparison$2 = function AbstractRelationalComparison(x, y, LeftFirst) {
	if (Type$2(LeftFirst) !== 'Boolean') {
		throw new $TypeError$T('Assertion failed: LeftFirst argument must be a Boolean');
	}
	var px;
	var py;
	if (LeftFirst) {
		px = ToPrimitive$2(x, $Number$7);
		py = ToPrimitive$2(y, $Number$7);
	} else {
		py = ToPrimitive$2(y, $Number$7);
		px = ToPrimitive$2(x, $Number$7);
	}
	var bothStrings = Type$2(px) === 'String' && Type$2(py) === 'String';
	if (!bothStrings) {
		var nx = ToNumber$2(px);
		var ny = ToNumber$2(py);
		if (_isNaN(nx) || _isNaN(ny)) {
			return undefined;
		}
		if (_isFinite(nx) && _isFinite(ny) && nx === ny) {
			return false;
		}
		if (nx === 0 && ny === 0) {
			return false;
		}
		if (nx === Infinity) {
			return false;
		}
		if (ny === Infinity) {
			return true;
		}
		if (ny === -Infinity) {
			return false;
		}
		if (nx === -Infinity) {
			return true;
		}
		return nx < ny; // by now, these are both nonzero, finite, and not equal
	}
	if (isPrefixOf(py, px)) {
		return false;
	}
	if (isPrefixOf(px, py)) {
		return true;
	}
	return px < py; // both strings, neither a prefix of the other. shortcut for steps c-f
};

// https://www.ecma-international.org/ecma-262/5.1/#sec-11.9.6

var StrictEqualityComparison$2 = function StrictEqualityComparison(x, y) {
	var xType = Type$2(x);
	var yType = Type$2(y);
	if (xType !== yType) {
		return false;
	}
	if (xType === 'Undefined' || xType === 'Null') {
		return true;
	}
	return x === y; // shortcut for steps 4-7
};

var $Math$7 = GetIntrinsic('%Math%');

var $floor$j = $Math$7.floor;
var $abs$7 = $Math$7.abs;




// https://www.ecma-international.org/ecma-262/6.0/#sec-isinteger

var IsInteger$1 = function IsInteger(argument) {
	if (typeof argument !== 'number' || _isNaN(argument) || !_isFinite(argument)) {
		return false;
	}
	var abs = $abs$7(argument);
	return $floor$j(abs) === abs;
};

var $TypeError$U = GetIntrinsic('%TypeError%');

var $charCodeAt$1 = callBound('String.prototype.charCodeAt');

// https://ecma-international.org/ecma-262/6.0/#sec-advancestringindex

var AdvanceStringIndex$1 = function AdvanceStringIndex(S, index, unicode) {
	if (Type$2(S) !== 'String') {
		throw new $TypeError$U('Assertion failed: `S` must be a String');
	}
	if (!IsInteger$1(index) || index < 0 || index > maxSafeInteger) {
		throw new $TypeError$U('Assertion failed: `length` must be an integer >= 0 and <= 2**53');
	}
	if (Type$2(unicode) !== 'Boolean') {
		throw new $TypeError$U('Assertion failed: `unicode` must be a Boolean');
	}
	if (!unicode) {
		return index + 1;
	}
	var length = S.length;
	if ((index + 1) >= length) {
		return index + 1;
	}

	var first = $charCodeAt$1(S, index);
	if (first < 0xD800 || first > 0xDBFF) {
		return index + 1;
	}

	var second = $charCodeAt$1(S, index + 1);
	if (second < 0xDC00 || second > 0xDFFF) {
		return index + 1;
	}

	return index + 2;
};

var $ArrayPrototype$1 = GetIntrinsic('%Array.prototype%');
var $RangeError$2 = GetIntrinsic('%RangeError%');
var $SyntaxError$6 = GetIntrinsic('%SyntaxError%');
var $TypeError$V = GetIntrinsic('%TypeError%');



var MAX_ARRAY_LENGTH$1 = Math.pow(2, 32) - 1;

var $setProto$1 = GetIntrinsic('%Object.setPrototypeOf%', true) || (
	// eslint-disable-next-line no-proto, no-negated-condition
	[].__proto__ !== $ArrayPrototype$1
		? null
		: function (O, proto) {
			O.__proto__ = proto; // eslint-disable-line no-proto, no-param-reassign
			return O;
		}
);

// https://www.ecma-international.org/ecma-262/6.0/#sec-arraycreate

var ArrayCreate$1 = function ArrayCreate(length) {
	if (!IsInteger$1(length) || length < 0) {
		throw new $TypeError$V('Assertion failed: `length` must be an integer Number >= 0');
	}
	if (length > MAX_ARRAY_LENGTH$1) {
		throw new $RangeError$2('length is greater than (2**32 - 1)');
	}
	var proto = arguments.length > 1 ? arguments[1] : $ArrayPrototype$1;
	var A = []; // steps 5 - 7, and 9
	if (proto !== $ArrayPrototype$1) { // step 8
		if (!$setProto$1) {
			throw new $SyntaxError$6('ArrayCreate: a `proto` argument that is not `Array.prototype` is not supported in an environment that does not support setting the [[Prototype]]');
		}
		$setProto$1(A, proto);
	}
	if (length !== 0) { // bypasses the need for step 2
		A.length = length;
	}
	/* step 10, the above as a shortcut for the below
    OrdinaryDefineOwnProperty(A, 'length', {
        '[[Configurable]]': false,
        '[[Enumerable]]': false,
        '[[Value]]': length,
        '[[Writable]]': true
    });
    */
	return A;
};

var $Array$2 = GetIntrinsic('%Array%');

// eslint-disable-next-line global-require
var toStr$a = !$Array$2.isArray && callBound('Object.prototype.toString');

// https://www.ecma-international.org/ecma-262/6.0/#sec-isarray

var IsArray$1 = $Array$2.isArray || function IsArray(argument) {
	return toStr$a(argument) === '[object Array]';
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isaccessordescriptor

var IsAccessorDescriptor$2 = function IsAccessorDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$2, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Get]]') && !src(Desc, '[[Set]]')) {
		return false;
	}

	return true;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isdatadescriptor

var IsDataDescriptor$2 = function IsDataDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$2, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Value]]') && !src(Desc, '[[Writable]]')) {
		return false;
	}

	return true;
};

var $Object$3 = GetIntrinsic('%Object%');



var $preventExtensions$2 = $Object$3.preventExtensions;
var $isExtensible$1 = $Object$3.isExtensible;

// https://www.ecma-international.org/ecma-262/6.0/#sec-isextensible-o

var IsExtensible$1 = $preventExtensions$2
	? function IsExtensible(obj) {
		return !isPrimitive$1(obj) && $isExtensible$1(obj);
	}
	: function IsExtensible(obj) {
		return !isPrimitive$1(obj);
	};

// https://www.ecma-international.org/ecma-262/6.0/#sec-ispropertykey

var IsPropertyKey$1 = function IsPropertyKey(argument) {
	return typeof argument === 'string' || typeof argument === 'symbol';
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.2

var ToBoolean$2 = function ToBoolean(value) { return !!value; };

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.11

var IsCallable$2 = isCallable;

var $TypeError$W = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/5.1/#sec-8.10.5

var ToPropertyDescriptor$2 = function ToPropertyDescriptor(Obj) {
	if (Type$2(Obj) !== 'Object') {
		throw new $TypeError$W('ToPropertyDescriptor requires an object');
	}

	var desc = {};
	if (src(Obj, 'enumerable')) {
		desc['[[Enumerable]]'] = ToBoolean$2(Obj.enumerable);
	}
	if (src(Obj, 'configurable')) {
		desc['[[Configurable]]'] = ToBoolean$2(Obj.configurable);
	}
	if (src(Obj, 'value')) {
		desc['[[Value]]'] = Obj.value;
	}
	if (src(Obj, 'writable')) {
		desc['[[Writable]]'] = ToBoolean$2(Obj.writable);
	}
	if (src(Obj, 'get')) {
		var getter = Obj.get;
		if (typeof getter !== 'undefined' && !IsCallable$2(getter)) {
			throw new TypeError('getter must be a function');
		}
		desc['[[Get]]'] = getter;
	}
	if (src(Obj, 'set')) {
		var setter = Obj.set;
		if (typeof setter !== 'undefined' && !IsCallable$2(setter)) {
			throw new $TypeError$W('setter must be a function');
		}
		desc['[[Set]]'] = setter;
	}

	if ((src(desc, '[[Get]]') || src(desc, '[[Set]]')) && (src(desc, '[[Value]]') || src(desc, '[[Writable]]'))) {
		throw new $TypeError$W('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
	}
	return desc;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.12

var SameValue$2 = function SameValue(x, y) {
	if (x === y) { // 0 === -0, but they are not identical.
		if (x === 0) { return 1 / x === 1 / y; }
		return true;
	}
	return _isNaN(x) && _isNaN(y);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-frompropertydescriptor

var FromPropertyDescriptor$2 = function FromPropertyDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return Desc;
	}

	assertRecord(Type$2, 'Property Descriptor', 'Desc', Desc);

	var obj = {};
	if ('[[Value]]' in Desc) {
		obj.value = Desc['[[Value]]'];
	}
	if ('[[Writable]]' in Desc) {
		obj.writable = Desc['[[Writable]]'];
	}
	if ('[[Get]]' in Desc) {
		obj.get = Desc['[[Get]]'];
	}
	if ('[[Set]]' in Desc) {
		obj.set = Desc['[[Set]]'];
	}
	if ('[[Enumerable]]' in Desc) {
		obj.enumerable = Desc['[[Enumerable]]'];
	}
	if ('[[Configurable]]' in Desc) {
		obj.configurable = Desc['[[Configurable]]'];
	}
	return obj;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isgenericdescriptor

var IsGenericDescriptor$2 = function IsGenericDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$2, 'Property Descriptor', 'Desc', Desc);

	if (!IsAccessorDescriptor$2(Desc) && !IsDataDescriptor$2(Desc)) {
		return true;
	}

	return false;
};

var $TypeError$X = GetIntrinsic('%TypeError%');













// https://www.ecma-international.org/ecma-262/6.0/#sec-validateandapplypropertydescriptor
// https://www.ecma-international.org/ecma-262/8.0/#sec-validateandapplypropertydescriptor

// eslint-disable-next-line max-lines-per-function, max-statements, max-params
var ValidateAndApplyPropertyDescriptor$1 = function ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current) {
	// this uses the ES2017+ logic, since it fixes a number of bugs in the ES2015 logic.
	var oType = Type$2(O);
	if (oType !== 'Undefined' && oType !== 'Object') {
		throw new $TypeError$X('Assertion failed: O must be undefined or an Object');
	}
	if (Type$2(extensible) !== 'Boolean') {
		throw new $TypeError$X('Assertion failed: extensible must be a Boolean');
	}
	if (!isPropertyDescriptor({
		Type: Type$2,
		IsDataDescriptor: IsDataDescriptor$2,
		IsAccessorDescriptor: IsAccessorDescriptor$2
	}, Desc)) {
		throw new $TypeError$X('Assertion failed: Desc must be a Property Descriptor');
	}
	if (Type$2(current) !== 'Undefined' && !isPropertyDescriptor({
		Type: Type$2,
		IsDataDescriptor: IsDataDescriptor$2,
		IsAccessorDescriptor: IsAccessorDescriptor$2
	}, current)) {
		throw new $TypeError$X('Assertion failed: current must be a Property Descriptor, or undefined');
	}
	if (oType !== 'Undefined' && !IsPropertyKey$1(P)) {
		throw new $TypeError$X('Assertion failed: if O is not undefined, P must be a Property Key');
	}
	if (Type$2(current) === 'Undefined') {
		if (!extensible) {
			return false;
		}
		if (IsGenericDescriptor$2(Desc) || IsDataDescriptor$2(Desc)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$2,
					SameValue$2,
					FromPropertyDescriptor$2,
					O,
					P,
					{
						'[[Configurable]]': Desc['[[Configurable]]'],
						'[[Enumerable]]': Desc['[[Enumerable]]'],
						'[[Value]]': Desc['[[Value]]'],
						'[[Writable]]': Desc['[[Writable]]']
					}
				);
			}
		} else {
			if (!IsAccessorDescriptor$2(Desc)) {
				throw new $TypeError$X('Assertion failed: Desc is not an accessor descriptor');
			}
			if (oType !== 'Undefined') {
				return DefineOwnProperty(
					IsDataDescriptor$2,
					SameValue$2,
					FromPropertyDescriptor$2,
					O,
					P,
					Desc
				);
			}
		}
		return true;
	}
	if (IsGenericDescriptor$2(Desc) && !('[[Configurable]]' in Desc) && !('[[Enumerable]]' in Desc)) {
		return true;
	}
	if (isSamePropertyDescriptor({ SameValue: SameValue$2 }, Desc, current)) {
		return true; // removed by ES2017, but should still be correct
	}
	// "if every field in Desc is absent, return true" can't really match the assertion that it's a Property Descriptor
	if (!current['[[Configurable]]']) {
		if (Desc['[[Configurable]]']) {
			return false;
		}
		if ('[[Enumerable]]' in Desc && !Desc['[[Enumerable]]'] === !!current['[[Enumerable]]']) {
			return false;
		}
	}
	if (IsGenericDescriptor$2(Desc)) ; else if (IsDataDescriptor$2(current) !== IsDataDescriptor$2(Desc)) {
		if (!current['[[Configurable]]']) {
			return false;
		}
		if (IsDataDescriptor$2(current)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$2,
					SameValue$2,
					FromPropertyDescriptor$2,
					O,
					P,
					{
						'[[Configurable]]': current['[[Configurable]]'],
						'[[Enumerable]]': current['[[Enumerable]]'],
						'[[Get]]': undefined
					}
				);
			}
		} else if (oType !== 'Undefined') {
			DefineOwnProperty(
				IsDataDescriptor$2,
				SameValue$2,
				FromPropertyDescriptor$2,
				O,
				P,
				{
					'[[Configurable]]': current['[[Configurable]]'],
					'[[Enumerable]]': current['[[Enumerable]]'],
					'[[Value]]': undefined
				}
			);
		}
	} else if (IsDataDescriptor$2(current) && IsDataDescriptor$2(Desc)) {
		if (!current['[[Configurable]]'] && !current['[[Writable]]']) {
			if ('[[Writable]]' in Desc && Desc['[[Writable]]']) {
				return false;
			}
			if ('[[Value]]' in Desc && !SameValue$2(Desc['[[Value]]'], current['[[Value]]'])) {
				return false;
			}
			return true;
		}
	} else if (IsAccessorDescriptor$2(current) && IsAccessorDescriptor$2(Desc)) {
		if (!current['[[Configurable]]']) {
			if ('[[Set]]' in Desc && !SameValue$2(Desc['[[Set]]'], current['[[Set]]'])) {
				return false;
			}
			if ('[[Get]]' in Desc && !SameValue$2(Desc['[[Get]]'], current['[[Get]]'])) {
				return false;
			}
			return true;
		}
	} else {
		throw new $TypeError$X('Assertion failed: current and Desc are not both data, both accessors, or one accessor and one data.');
	}
	if (oType !== 'Undefined') {
		return DefineOwnProperty(
			IsDataDescriptor$2,
			SameValue$2,
			FromPropertyDescriptor$2,
			O,
			P,
			Desc
		);
	}
	return true;
};

var $SyntaxError$7 = GetIntrinsic('%SyntaxError%');
var $TypeError$Y = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarydefineownproperty

var OrdinaryDefineOwnProperty$1 = function OrdinaryDefineOwnProperty(O, P, Desc) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$Y('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$Y('Assertion failed: P must be a Property Key');
	}
	if (!isPropertyDescriptor({
		Type: Type$2,
		IsDataDescriptor: IsDataDescriptor$2,
		IsAccessorDescriptor: IsAccessorDescriptor$2
	}, Desc)) {
		throw new $TypeError$Y('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!getOwnPropertyDescriptor) {
		// ES3/IE 8 fallback
		if (IsAccessorDescriptor$2(Desc)) {
			throw new $SyntaxError$7('This environment does not support accessor property descriptors.');
		}
		var creatingNormalDataProperty = !(P in O)
			&& Desc['[[Writable]]']
			&& Desc['[[Enumerable]]']
			&& Desc['[[Configurable]]']
			&& '[[Value]]' in Desc;
		var settingExistingDataProperty = (P in O)
			&& (!('[[Configurable]]' in Desc) || Desc['[[Configurable]]'])
			&& (!('[[Enumerable]]' in Desc) || Desc['[[Enumerable]]'])
			&& (!('[[Writable]]' in Desc) || Desc['[[Writable]]'])
			&& '[[Value]]' in Desc;
		if (creatingNormalDataProperty || settingExistingDataProperty) {
			O[P] = Desc['[[Value]]']; // eslint-disable-line no-param-reassign
			return SameValue$2(O[P], Desc['[[Value]]']);
		}
		throw new $SyntaxError$7('This environment does not support defining non-writable, non-enumerable, or non-configurable properties');
	}
	var desc = getOwnPropertyDescriptor(O, P);
	var current = desc && ToPropertyDescriptor$2(desc);
	var extensible = IsExtensible$1(O);
	return ValidateAndApplyPropertyDescriptor$1(O, P, extensible, Desc, current);
};

var $match$1 = GetIntrinsic('%Symbol.match%', true);





// https://ecma-international.org/ecma-262/6.0/#sec-isregexp

var IsRegExp$1 = function IsRegExp(argument) {
	if (!argument || typeof argument !== 'object') {
		return false;
	}
	if ($match$1) {
		var isRegExp = argument[$match$1];
		if (typeof isRegExp !== 'undefined') {
			return ToBoolean$2(isRegExp);
		}
	}
	return isRegex(argument);
};

var $TypeError$Z = GetIntrinsic('%TypeError%');



var $isEnumerable$2 = callBound('Object.prototype.propertyIsEnumerable');









// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarygetownproperty

var OrdinaryGetOwnProperty$1 = function OrdinaryGetOwnProperty(O, P) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$Z('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$Z('Assertion failed: P must be a Property Key');
	}
	if (!src(O, P)) {
		return void 0;
	}
	if (!getOwnPropertyDescriptor) {
		// ES3 / IE 8 fallback
		var arrayLength = IsArray$1(O) && P === 'length';
		var regexLastIndex = IsRegExp$1(O) && P === 'lastIndex';
		return {
			'[[Configurable]]': !(arrayLength || regexLastIndex),
			'[[Enumerable]]': $isEnumerable$2(O, P),
			'[[Value]]': O[P],
			'[[Writable]]': true
		};
	}
	return ToPropertyDescriptor$2(getOwnPropertyDescriptor(O, P));
};

var $String$3 = GetIntrinsic('%String%');
var $TypeError$_ = GetIntrinsic('%TypeError%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-tostring

var ToString$2 = function ToString(argument) {
	if (typeof argument === 'symbol') {
		throw new $TypeError$_('Cannot convert a Symbol value to a string');
	}
	return $String$3(argument);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.6

var ToUint32$2 = function ToUint32(x) {
	return ToNumber$2(x) >>> 0;
};

var $RangeError$3 = GetIntrinsic('%RangeError%');
var $TypeError$$ = GetIntrinsic('%TypeError%');















// https://www.ecma-international.org/ecma-262/6.0/#sec-arraysetlength

// eslint-disable-next-line max-statements, max-lines-per-function
var ArraySetLength$1 = function ArraySetLength(A, Desc) {
	if (!IsArray$1(A)) {
		throw new $TypeError$$('Assertion failed: A must be an Array');
	}
	if (!isPropertyDescriptor({
		Type: Type$2,
		IsDataDescriptor: IsDataDescriptor$2,
		IsAccessorDescriptor: IsAccessorDescriptor$2
	}, Desc)) {
		throw new $TypeError$$('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!('[[Value]]' in Desc)) {
		return OrdinaryDefineOwnProperty$1(A, 'length', Desc);
	}
	var newLenDesc = object_assign({}, Desc);
	var newLen = ToUint32$2(Desc['[[Value]]']);
	var numberLen = ToNumber$2(Desc['[[Value]]']);
	if (newLen !== numberLen) {
		throw new $RangeError$3('Invalid array length');
	}
	newLenDesc['[[Value]]'] = newLen;
	var oldLenDesc = OrdinaryGetOwnProperty$1(A, 'length');
	if (!IsDataDescriptor$2(oldLenDesc)) {
		throw new $TypeError$$('Assertion failed: an array had a non-data descriptor on `length`');
	}
	var oldLen = oldLenDesc['[[Value]]'];
	if (newLen >= oldLen) {
		return OrdinaryDefineOwnProperty$1(A, 'length', newLenDesc);
	}
	if (!oldLenDesc['[[Writable]]']) {
		return false;
	}
	var newWritable;
	if (!('[[Writable]]' in newLenDesc) || newLenDesc['[[Writable]]']) {
		newWritable = true;
	} else {
		newWritable = false;
		newLenDesc['[[Writable]]'] = true;
	}
	var succeeded = OrdinaryDefineOwnProperty$1(A, 'length', newLenDesc);
	if (!succeeded) {
		return false;
	}
	while (newLen < oldLen) {
		oldLen -= 1;
		// eslint-disable-next-line no-param-reassign
		var deleteSucceeded = delete A[ToString$2(oldLen)];
		if (!deleteSucceeded) {
			newLenDesc['[[Value]]'] = oldLen + 1;
			if (!newWritable) {
				newLenDesc['[[Writable]]'] = false;
				OrdinaryDefineOwnProperty$1(A, 'length', newLenDesc);
				return false;
			}
		}
	}
	if (!newWritable) {
		return OrdinaryDefineOwnProperty$1(A, 'length', { '[[Writable]]': false });
	}
	return true;
};

var $TypeError$10 = GetIntrinsic('%TypeError%');






/**
 * 7.3.1 Get (O, P) - https://ecma-international.org/ecma-262/6.0/#sec-get-o-p
 * 1. Assert: Type(O) is Object.
 * 2. Assert: IsPropertyKey(P) is true.
 * 3. Return O.[[Get]](P, O).
 */

var Get$1 = function Get(O, P) {
	// 7.3.1.1
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$10('Assertion failed: Type(O) is not Object');
	}
	// 7.3.1.2
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$10('Assertion failed: IsPropertyKey(P) is not true, got ' + objectInspect(P));
	}
	// 7.3.1.3
	return O[P];
};

var $TypeError$11 = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-definepropertyorthrow

var DefinePropertyOrThrow$1 = function DefinePropertyOrThrow(O, P, desc) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$11('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$11('Assertion failed: IsPropertyKey(P) is not true');
	}

	var Desc = isPropertyDescriptor({
		Type: Type$2,
		IsDataDescriptor: IsDataDescriptor$2,
		IsAccessorDescriptor: IsAccessorDescriptor$2
	}, desc) ? desc : ToPropertyDescriptor$2(desc);
	if (!isPropertyDescriptor({
		Type: Type$2,
		IsDataDescriptor: IsDataDescriptor$2,
		IsAccessorDescriptor: IsAccessorDescriptor$2
	}, Desc)) {
		throw new $TypeError$11('Assertion failed: Desc is not a valid Property Descriptor');
	}

	return DefineOwnProperty(
		IsDataDescriptor$2,
		SameValue$2,
		FromPropertyDescriptor$2,
		O,
		P,
		Desc
	);
};

var IsConstructor$1 = createCommonjsModule(function (module) {



var $construct = GetIntrinsic('%Reflect.construct%', true);

var DefinePropertyOrThrow = DefinePropertyOrThrow$1;
try {
	DefinePropertyOrThrow({}, '', { '[[Get]]': function () {} });
} catch (e) {
	// Accessor properties aren't supported
	DefinePropertyOrThrow = null;
}

// https://www.ecma-international.org/ecma-262/6.0/#sec-isconstructor

if (DefinePropertyOrThrow && $construct) {
	var isConstructorMarker = {};
	var badArrayLike = {};
	DefinePropertyOrThrow(badArrayLike, 'length', {
		'[[Get]]': function () {
			throw isConstructorMarker;
		},
		'[[Enumerable]]': true
	});

	module.exports = function IsConstructor(argument) {
		try {
			// `Reflect.construct` invokes `IsConstructor(target)` before `Get(args, 'length')`:
			$construct(argument, badArrayLike);
		} catch (err) {
			return err === isConstructorMarker;
		}
	};
} else {
	module.exports = function IsConstructor(argument) {
		// unfortunately there's no way to truly check this without try/catch `new argument` in old environments
		return typeof argument === 'function' && !!argument.prototype;
	};
}
});

var $Array$3 = GetIntrinsic('%Array%');
var $species$2 = GetIntrinsic('%Symbol.species%', true);
var $TypeError$12 = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-arrayspeciescreate

var ArraySpeciesCreate$1 = function ArraySpeciesCreate(originalArray, length) {
	if (!IsInteger$1(length) || length < 0) {
		throw new $TypeError$12('Assertion failed: length must be an integer >= 0');
	}
	var len = length === 0 ? 0 : length;
	var C;
	var isArray = IsArray$1(originalArray);
	if (isArray) {
		C = Get$1(originalArray, 'constructor');
		// TODO: figure out how to make a cross-realm normal Array, a same-realm Array
		// if (IsConstructor(C)) {
		// 	if C is another realm's Array, C = undefined
		// 	Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(Array))) === null ?
		// }
		if ($species$2 && Type$2(C) === 'Object') {
			C = Get$1(C, $species$2);
			if (C === null) {
				C = void 0;
			}
		}
	}
	if (typeof C === 'undefined') {
		return $Array$3(len);
	}
	if (!IsConstructor$1(C)) {
		throw new $TypeError$12('C must be a constructor');
	}
	return new C(len); // Construct(C, len);
};

var $apply$2 = GetIntrinsic('%Reflect.apply%', true) || callBound('%Function.prototype.apply%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-call

var Call$1 = function Call(F, V) {
	var args = arguments.length > 2 ? arguments[2] : [];
	return $apply$2(F, V, args);
};

var $TypeError$13 = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring

var CanonicalNumericIndexString$1 = function CanonicalNumericIndexString(argument) {
	if (Type$2(argument) !== 'String') {
		throw new $TypeError$13('Assertion failed: `argument` must be a String');
	}
	if (argument === '-0') { return -0; }
	var n = ToNumber$2(argument);
	if (SameValue$2(ToString$2(n), argument)) { return n; }
	return void 0;
};

// https://ecma-international.org/ecma-262/6.0/#sec-completepropertydescriptor

var CompletePropertyDescriptor$1 = function CompletePropertyDescriptor(Desc) {
	/* eslint no-param-reassign: 0 */
	assertRecord(Type$2, 'Property Descriptor', 'Desc', Desc);

	if (IsGenericDescriptor$2(Desc) || IsDataDescriptor$2(Desc)) {
		if (!src(Desc, '[[Value]]')) {
			Desc['[[Value]]'] = void 0;
		}
		if (!src(Desc, '[[Writable]]')) {
			Desc['[[Writable]]'] = false;
		}
	} else {
		if (!src(Desc, '[[Get]]')) {
			Desc['[[Get]]'] = void 0;
		}
		if (!src(Desc, '[[Set]]')) {
			Desc['[[Set]]'] = void 0;
		}
	}
	if (!src(Desc, '[[Enumerable]]')) {
		Desc['[[Enumerable]]'] = false;
	}
	if (!src(Desc, '[[Configurable]]')) {
		Desc['[[Configurable]]'] = false;
	}
	return Desc;
};

var $TypeError$14 = GetIntrinsic('%TypeError%');











// https://www.ecma-international.org/ecma-262/6.0/#sec-createdataproperty

var CreateDataProperty$1 = function CreateDataProperty(O, P, V) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$14('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$14('Assertion failed: IsPropertyKey(P) is not true');
	}
	var oldDesc = OrdinaryGetOwnProperty$1(O, P);
	var extensible = !oldDesc || IsExtensible$1(O);
	var immutable = oldDesc && (!oldDesc['[[Writable]]'] || !oldDesc['[[Configurable]]']);
	if (immutable || !extensible) {
		return false;
	}
	return DefineOwnProperty(
		IsDataDescriptor$2,
		SameValue$2,
		FromPropertyDescriptor$2,
		O,
		P,
		{
			'[[Configurable]]': true,
			'[[Enumerable]]': true,
			'[[Value]]': V,
			'[[Writable]]': true
		}
	);
};

var $TypeError$15 = GetIntrinsic('%TypeError%');





// // https://ecma-international.org/ecma-262/6.0/#sec-createdatapropertyorthrow

var CreateDataPropertyOrThrow$1 = function CreateDataPropertyOrThrow(O, P, V) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$15('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$15('Assertion failed: IsPropertyKey(P) is not true');
	}
	var success = CreateDataProperty$1(O, P, V);
	if (!success) {
		throw new $TypeError$15('unable to create data property');
	}
	return success;
};

var RequireObjectCoercible$1 = CheckObjectCoercible;

var $TypeError$16 = GetIntrinsic('%TypeError%');



var $replace$4 = callBound('String.prototype.replace');





// https://www.ecma-international.org/ecma-262/6.0/#sec-createhtml

var CreateHTML$1 = function CreateHTML(string, tag, attribute, value) {
	if (Type$2(tag) !== 'String' || Type$2(attribute) !== 'String') {
		throw new $TypeError$16('Assertion failed: `tag` and `attribute` must be strings');
	}
	var str = RequireObjectCoercible$1(string);
	var S = ToString$2(str);
	var p1 = '<' + tag;
	if (attribute !== '') {
		var V = ToString$2(value);
		var escapedV = $replace$4(V, /\x22/g, '&quot;');
		p1 += '\x20' + attribute + '\x3D\x22' + escapedV + '\x22';
	}
	return p1 + '>' + S + '</' + tag + '>';
};

var $TypeError$17 = GetIntrinsic('%TypeError%');



// https://ecma-international.org/ecma-262/6.0/#sec-createiterresultobject

var CreateIterResultObject$1 = function CreateIterResultObject(value, done) {
	if (Type$2(done) !== 'Boolean') {
		throw new $TypeError$17('Assertion failed: Type(done) is not Boolean');
	}
	return {
		value: value,
		done: done
	};
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-tointeger

var ToInteger$2 = function ToInteger$1(value) {
	var number = ToNumber$2(value);
	return ToInteger(number);
};

var ToLength$1 = function ToLength(argument) {
	var len = ToInteger$2(argument);
	if (len <= 0) { return 0; } // includes converting -0 to +0
	if (len > maxSafeInteger) { return maxSafeInteger; }
	return len;
};

var $TypeError$18 = GetIntrinsic('%TypeError%');
var $indexOf$2 = callBound('Array.prototype.indexOf', true) || callBound('String.prototype.indexOf');
var $push$1 = callBound('Array.prototype.push');







// https://ecma-international.org/ecma-262/6.0/#sec-createlistfromarraylike
var CreateListFromArrayLike$1 = function CreateListFromArrayLike(obj) {
	var elementTypes = arguments.length > 1
		? arguments[1]
		: ['Undefined', 'Null', 'Boolean', 'String', 'Symbol', 'Number', 'Object'];

	if (Type$2(obj) !== 'Object') {
		throw new $TypeError$18('Assertion failed: `obj` must be an Object');
	}
	if (!IsArray$1(elementTypes)) {
		throw new $TypeError$18('Assertion failed: `elementTypes`, if provided, must be an array');
	}
	var len = ToLength$1(Get$1(obj, 'length'));
	var list = [];
	var index = 0;
	while (index < len) {
		var indexName = ToString$2(index);
		var next = Get$1(obj, indexName);
		var nextType = Type$2(next);
		if ($indexOf$2(elementTypes, nextType) < 0) {
			throw new $TypeError$18('item type ' + nextType + ' is not a valid elementType');
		}
		$push$1(list, next);
		index += 1;
	}
	return list;
};

var $TypeError$19 = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/6.0/#sec-createmethodproperty

var CreateMethodProperty$1 = function CreateMethodProperty(O, P, V) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$19('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$19('Assertion failed: IsPropertyKey(P) is not true');
	}

	var newDesc = {
		'[[Configurable]]': true,
		'[[Enumerable]]': false,
		'[[Value]]': V,
		'[[Writable]]': true
	};
	return DefineOwnProperty(
		IsDataDescriptor$2,
		SameValue$2,
		FromPropertyDescriptor$2,
		O,
		P,
		newDesc
	);
};

var $floor$k = GetIntrinsic('%Math.floor%');

var msPerDay$9 = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var Day$2 = function Day(t) {
	return $floor$k(t / msPerDay$9);
};

var $floor$l = GetIntrinsic('%Math.floor%');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DayFromYear$2 = function DayFromYear(y) {
	return (365 * (y - 1970)) + $floor$l((y - 1969) / 4) - $floor$l((y - 1901) / 100) + $floor$l((y - 1601) / 400);
};

var $Date$5 = GetIntrinsic('%Date%');



var $getUTCFullYear$2 = callBound('Date.prototype.getUTCFullYear');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var YearFromTime$2 = function YearFromTime(t) {
	// largest y such that this.TimeFromYear(y) <= t
	return $getUTCFullYear$2(new $Date$5(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var DayWithinYear$2 = function DayWithinYear(t) {
	return Day$2(t) - DayFromYear$2(YearFromTime$2(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DaysInYear$2 = function DaysInYear(y) {
	if (mod(y, 4) !== 0) {
		return 365;
	}
	if (mod(y, 100) !== 0) {
		return 366;
	}
	if (mod(y, 400) !== 0) {
		return 365;
	}
	return 366;
};

var $EvalError$4 = GetIntrinsic('%EvalError%');




// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var InLeapYear$2 = function InLeapYear(t) {
	var days = DaysInYear$2(YearFromTime$2(t));
	if (days === 365) {
		return 0;
	}
	if (days === 366) {
		return 1;
	}
	throw new $EvalError$4('Assertion failed: there are not 365 or 366 days in a year, got: ' + days);
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var MonthFromTime$2 = function MonthFromTime(t) {
	var day = DayWithinYear$2(t);
	if (0 <= day && day < 31) {
		return 0;
	}
	var leap = InLeapYear$2(t);
	if (31 <= day && day < (59 + leap)) {
		return 1;
	}
	if ((59 + leap) <= day && day < (90 + leap)) {
		return 2;
	}
	if ((90 + leap) <= day && day < (120 + leap)) {
		return 3;
	}
	if ((120 + leap) <= day && day < (151 + leap)) {
		return 4;
	}
	if ((151 + leap) <= day && day < (181 + leap)) {
		return 5;
	}
	if ((181 + leap) <= day && day < (212 + leap)) {
		return 6;
	}
	if ((212 + leap) <= day && day < (243 + leap)) {
		return 7;
	}
	if ((243 + leap) <= day && day < (273 + leap)) {
		return 8;
	}
	if ((273 + leap) <= day && day < (304 + leap)) {
		return 9;
	}
	if ((304 + leap) <= day && day < (334 + leap)) {
		return 10;
	}
	if ((334 + leap) <= day && day < (365 + leap)) {
		return 11;
	}
};

var $EvalError$5 = GetIntrinsic('%EvalError%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.5

var DateFromTime$2 = function DateFromTime(t) {
	var m = MonthFromTime$2(t);
	var d = DayWithinYear$2(t);
	if (m === 0) {
		return d + 1;
	}
	if (m === 1) {
		return d - 30;
	}
	var leap = InLeapYear$2(t);
	if (m === 2) {
		return d - 58 - leap;
	}
	if (m === 3) {
		return d - 89 - leap;
	}
	if (m === 4) {
		return d - 119 - leap;
	}
	if (m === 5) {
		return d - 150 - leap;
	}
	if (m === 6) {
		return d - 180 - leap;
	}
	if (m === 7) {
		return d - 211 - leap;
	}
	if (m === 8) {
		return d - 242 - leap;
	}
	if (m === 9) {
		return d - 272 - leap;
	}
	if (m === 10) {
		return d - 303 - leap;
	}
	if (m === 11) {
		return d - 333 - leap;
	}
	throw new $EvalError$5('Assertion failed: MonthFromTime returned an impossible value: ' + m);
};

var $TypeError$1a = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-deletepropertyorthrow

var DeletePropertyOrThrow$1 = function DeletePropertyOrThrow(O, P) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1a('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$1a('Assertion failed: IsPropertyKey(P) is not true');
	}

	// eslint-disable-next-line no-param-reassign
	var success = delete O[P];
	if (!success) {
		throw new $TypeError$1a('Attempt to delete property failed.');
	}
	return success;
};

var $TypeError$1b = GetIntrinsic('%TypeError%');





// https://www.ecma-international.org/ecma-262/6.0/#sec-enumerableownnames

var EnumerableOwnNames$1 = function EnumerableOwnNames(O) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1b('Assertion failed: Type(O) is not Object');
	}

	return objectKeys(O);
};

var $Object$4 = GetIntrinsic('%Object%');



// https://www.ecma-international.org/ecma-262/6.0/#sec-toobject

var ToObject$2 = function ToObject(value) {
	RequireObjectCoercible$1(value);
	return $Object$4(value);
};

var $TypeError$1c = GetIntrinsic('%TypeError%');




/**
 * 7.3.2 GetV (V, P)
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let O be ToObject(V).
 * 3. ReturnIfAbrupt(O).
 * 4. Return O.[[Get]](P, V).
 */

var GetV$1 = function GetV(V, P) {
	// 7.3.2.1
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$1c('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.2.2-3
	var O = ToObject$2(V);

	// 7.3.2.4
	return O[P];
};

var $TypeError$1d = GetIntrinsic('%TypeError%');





/**
 * 7.3.9 - https://ecma-international.org/ecma-262/6.0/#sec-getmethod
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let func be GetV(O, P).
 * 3. ReturnIfAbrupt(func).
 * 4. If func is either undefined or null, return undefined.
 * 5. If IsCallable(func) is false, throw a TypeError exception.
 * 6. Return func.
 */

var GetMethod$2 = function GetMethod(O, P) {
	// 7.3.9.1
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$1d('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.9.2
	var func = GetV$1(O, P);

	// 7.3.9.4
	if (func == null) {
		return void 0;
	}

	// 7.3.9.5
	if (!IsCallable$2(func)) {
		throw new $TypeError$1d(P + 'is not a function');
	}

	// 7.3.9.6
	return func;
};

var $TypeError$1e = GetIntrinsic('%TypeError%');








// https://ecma-international.org/ecma-262/6.0/#sec-getiterator

var GetIterator$1 = function GetIterator(obj, method) {
	var actualMethod = method;
	if (arguments.length < 2) {
		actualMethod = getIteratorMethod(
			{
				AdvanceStringIndex: AdvanceStringIndex$1,
				GetMethod: GetMethod$2,
				IsArray: IsArray$1,
				Type: Type$2
			},
			obj
		);
	}
	var iterator = Call$1(actualMethod, obj);
	if (Type$2(iterator) !== 'Object') {
		throw new $TypeError$1e('iterator must return an object');
	}

	return iterator;
};

var hasSymbols$8 = hasSymbols();

var $TypeError$1f = GetIntrinsic('%TypeError%');

var $gOPN$3 = GetIntrinsic('%Object.getOwnPropertyNames%');
var $gOPS$1 = hasSymbols$8 && GetIntrinsic('%Object.getOwnPropertySymbols%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-getownpropertykeys

var GetOwnPropertyKeys$1 = function GetOwnPropertyKeys(O, Type) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1f('Assertion failed: Type(O) is not Object');
	}
	if (Type === 'Symbol') {
		return $gOPS$1 ? $gOPS$1(O) : [];
	}
	if (Type === 'String') {
		if (!$gOPN$3) {
			return objectKeys(O);
		}
		return $gOPN$3(O);
	}
	throw new $TypeError$1f('Assertion failed: `Type` must be `"String"` or `"Symbol"`');
};

var $Function$1 = GetIntrinsic('%Function%');
var $TypeError$1g = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-getprototypefromconstructor

var GetPrototypeFromConstructor$1 = function GetPrototypeFromConstructor(constructor, intrinsicDefaultProto) {
	var intrinsic = GetIntrinsic(intrinsicDefaultProto); // throws if not a valid intrinsic
	if (!IsConstructor$1(constructor)) {
		throw new $TypeError$1g('Assertion failed: `constructor` must be a constructor');
	}
	var proto = Get$1(constructor, 'prototype');
	if (Type$2(proto) !== 'Object') {
		if (!(constructor instanceof $Function$1)) {
			// ignore other realms, for now
			throw new $TypeError$1g('cross-realm constructors not currently supported');
		}
		proto = intrinsic;
	}
	return proto;
};

var $TypeError$1h = GetIntrinsic('%TypeError%');
var $parseInt$1 = GetIntrinsic('%parseInt%');







var isDigit$1 = regexTester(/^[0-9]$/);

var $charAt$1 = callBound('String.prototype.charAt');
var $strSlice$4 = callBound('String.prototype.slice');





var canDistinguishSparseFromUndefined$1 = 0 in [undefined]; // IE 6 - 8 have a bug where this returns false

var isStringOrHole$1 = function (capture, index, arr) {
	return Type$2(capture) === 'String' || (canDistinguishSparseFromUndefined$1 ? !(index in arr) : Type$2(capture) === 'Undefined');
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-getsubstitution

// eslint-disable-next-line max-statements, max-params, max-lines-per-function
var GetSubstitution$1 = function GetSubstitution(matched, str, position, captures, replacement) {
	if (Type$2(matched) !== 'String') {
		throw new $TypeError$1h('Assertion failed: `matched` must be a String');
	}
	var matchLength = matched.length;

	if (Type$2(str) !== 'String') {
		throw new $TypeError$1h('Assertion failed: `str` must be a String');
	}
	var stringLength = str.length;

	if (!IsInteger$1(position) || position < 0 || position > stringLength) {
		throw new $TypeError$1h('Assertion failed: `position` must be a nonnegative integer, and less than or equal to the length of `string`, got ' + objectInspect(position));
	}

	if (!IsArray$1(captures) || !every(captures, isStringOrHole$1)) {
		throw new $TypeError$1h('Assertion failed: `captures` must be a List of Strings, got ' + objectInspect(captures));
	}

	if (Type$2(replacement) !== 'String') {
		throw new $TypeError$1h('Assertion failed: `replacement` must be a String');
	}

	var tailPos = position + matchLength;
	var m = captures.length;

	var result = '';
	for (var i = 0; i < replacement.length; i += 1) {
		// if this is a $, and it's not the end of the replacement
		var current = $charAt$1(replacement, i);
		var isLast = (i + 1) >= replacement.length;
		var nextIsLast = (i + 2) >= replacement.length;
		if (current === '$' && !isLast) {
			var next = $charAt$1(replacement, i + 1);
			if (next === '$') {
				result += '$';
				i += 1;
			} else if (next === '&') {
				result += matched;
				i += 1;
			} else if (next === '`') {
				result += position === 0 ? '' : $strSlice$4(str, 0, position - 1);
				i += 1;
			} else if (next === "'") {
				result += tailPos >= stringLength ? '' : $strSlice$4(str, tailPos);
				i += 1;
			} else {
				var nextNext = nextIsLast ? null : $charAt$1(replacement, i + 2);
				if (isDigit$1(next) && next !== '0' && (nextIsLast || !isDigit$1(nextNext))) {
					// $1 through $9, and not followed by a digit
					var n = $parseInt$1(next, 10);
					// if (n > m, impl-defined)
					result += (n <= m && Type$2(captures[n - 1]) === 'Undefined') ? '' : captures[n - 1];
					i += 1;
				} else if (isDigit$1(next) && (nextIsLast || isDigit$1(nextNext))) {
					// $00 through $99
					var nn = next + nextNext;
					var nnI = $parseInt$1(nn, 10) - 1;
					// if nn === '00' or nn > m, impl-defined
					result += (nn <= m && Type$2(captures[nnI]) === 'Undefined') ? '' : captures[nnI];
					i += 2;
				} else {
					result += '$';
				}
			}
		} else {
			// the final $, or else not a $
			result += $charAt$1(replacement, i);
		}
	}
	return result;
};

var $TypeError$1i = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-hasownproperty

var HasOwnProperty$1 = function HasOwnProperty(O, P) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1i('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$1i('Assertion failed: `P` must be a Property Key');
	}
	return src(O, P);
};

var $TypeError$1j = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-hasproperty

var HasProperty$1 = function HasProperty(O, P) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1j('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$1j('Assertion failed: `P` must be a Property Key');
	}
	return P in O;
};

var $floor$m = GetIntrinsic('%Math.floor%');



var msPerHour$5 = timeConstants.msPerHour;
var HoursPerDay$3 = timeConstants.HoursPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var HourFromTime$2 = function HourFromTime(t) {
	return mod($floor$m(t / msPerHour$5), HoursPerDay$3);
};

var $TypeError$1k = GetIntrinsic('%TypeError%');





// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasinstance

var OrdinaryHasInstance$1 = function OrdinaryHasInstance(C, O) {
	if (IsCallable$2(C) === false) {
		return false;
	}
	if (Type$2(O) !== 'Object') {
		return false;
	}
	var P = Get$1(C, 'prototype');
	if (Type$2(P) !== 'Object') {
		throw new $TypeError$1k('OrdinaryHasInstance called on an object with an invalid prototype property.');
	}
	return O instanceof C;
};

var $TypeError$1l = GetIntrinsic('%TypeError%');

var $hasInstance$1 = GetIntrinsic('Symbol.hasInstance', true);








// https://www.ecma-international.org/ecma-262/6.0/#sec-instanceofoperator

var InstanceofOperator$1 = function InstanceofOperator(O, C) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1l('Assertion failed: Type(O) is not Object');
	}
	var instOfHandler = $hasInstance$1 ? GetMethod$2(C, $hasInstance$1) : void 0;
	if (typeof instOfHandler !== 'undefined') {
		return ToBoolean$2(Call$1(instOfHandler, C, [O]));
	}
	if (!IsCallable$2(C)) {
		throw new $TypeError$1l('`C` is not Callable');
	}
	return OrdinaryHasInstance$1(C, O);
};

var $TypeError$1m = GetIntrinsic('%TypeError%');

var $arraySlice$1 = callBound('Array.prototype.slice');





// https://ecma-international.org/ecma-262/6.0/#sec-invoke

var Invoke$1 = function Invoke(O, P) {
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$1m('P must be a Property Key');
	}
	var argumentsList = $arraySlice$1(arguments, 2);
	var func = GetV$1(O, P);
	return Call$1(func, O, argumentsList);
};

var $isConcatSpreadable$1 = GetIntrinsic('%Symbol.isConcatSpreadable%', true);






// https://ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable

var IsConcatSpreadable$1 = function IsConcatSpreadable(O) {
	if (Type$2(O) !== 'Object') {
		return false;
	}
	if ($isConcatSpreadable$1) {
		var spreadable = Get$1(O, $isConcatSpreadable$1);
		if (typeof spreadable !== 'undefined') {
			return ToBoolean$2(spreadable);
		}
	}
	return IsArray$1(O);
};

var $PromiseThen$1 = callBound('Promise.prototype.then', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-ispromise

var IsPromise$1 = function IsPromise(x) {
	if (Type$2(x) !== 'Object') {
		return false;
	}
	if (!$PromiseThen$1) { // Promises are not supported
		return false;
	}
	try {
		$PromiseThen$1(x); // throws if not a promise
	} catch (e) {
		return false;
	}
	return true;
};

// https://ecma-international.org/ecma-262/6.0/#sec-property-descriptor-specification-type

var IsPropertyDescriptor$2 = function IsPropertyDescriptor(Desc) {
	return isPropertyDescriptor({
		IsDataDescriptor: IsDataDescriptor$2,
		IsAccessorDescriptor: IsAccessorDescriptor$2,
		Type: Type$2
	}, Desc);
};

var $TypeError$1n = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-iteratorcomplete

var IteratorComplete$1 = function IteratorComplete(iterResult) {
	if (Type$2(iterResult) !== 'Object') {
		throw new $TypeError$1n('Assertion failed: Type(iterResult) is not Object');
	}
	return ToBoolean$2(Get$1(iterResult, 'done'));
};

var $TypeError$1o = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratornext

var IteratorNext$1 = function IteratorNext(iterator, value) {
	var result = Invoke$1(iterator, 'next', arguments.length < 2 ? [] : [value]);
	if (Type$2(result) !== 'Object') {
		throw new $TypeError$1o('iterator next must return an object');
	}
	return result;
};

// https://ecma-international.org/ecma-262/6.0/#sec-iteratorstep

var IteratorStep$1 = function IteratorStep(iterator) {
	var result = IteratorNext$1(iterator);
	var done = IteratorComplete$1(result);
	return done === true ? false : result;
};

var $TypeError$1p = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratorvalue

var IteratorValue$1 = function IteratorValue(iterResult) {
	if (Type$2(iterResult) !== 'Object') {
		throw new $TypeError$1p('Assertion failed: Type(iterResult) is not Object');
	}
	return Get$1(iterResult, 'value');
};

var $arrayPush = callBound('Array.prototype.push');










var ES = {
	AdvanceStringIndex: AdvanceStringIndex$1,
	GetMethod: GetMethod$2,
	IsArray: IsArray$1,
	Type: Type$2
};

// https://www.ecma-international.org/ecma-262/7.0/#sec-iterabletoarraylike
/**
 * 1. Let usingIterator be ? GetMethod(items, @@iterator).
 * 2. If usingIterator is not undefined, then
 *    1. Let iterator be ? GetIterator(items, usingIterator).
 *    2. Let values be a new empty List.
 *    3. Let next be true.
 *    4. Repeat, while next is not false
 *       1. Let next be ? IteratorStep(iterator).
 *       2. If next is not false, then
 *          1. Let nextValue be ? IteratorValue(next).
 *          2. Append nextValue to the end of the List values.
 *    5. Return CreateArrayFromList(values).
 * 3. NOTE: items is not an Iterable so assume it is already an array-like object.
 * 4. Return ! ToObject(items).
 */

var IterableToArrayLike = function IterableToArrayLike(items) {
	var usingIterator = getIteratorMethod(ES, items);
	if (typeof usingIterator !== 'undefined') {
		var iterator = GetIterator$1(items, usingIterator);
		var values = [];
		var next = true;
		while (next) {
			next = IteratorStep$1(iterator);
			if (next) {
				var nextValue = IteratorValue$1(next);
				$arrayPush(values, nextValue);
			}
		}
		return values;
	}

	return ToObject$2(items);
};

var $TypeError$1q = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-iteratorclose

var IteratorClose$1 = function IteratorClose(iterator, completion) {
	if (Type$2(iterator) !== 'Object') {
		throw new $TypeError$1q('Assertion failed: Type(iterator) is not Object');
	}
	if (!IsCallable$2(completion)) {
		throw new $TypeError$1q('Assertion failed: completion is not a thunk for a Completion Record');
	}
	var completionThunk = completion;

	var iteratorReturn = GetMethod$2(iterator, 'return');

	if (typeof iteratorReturn === 'undefined') {
		return completionThunk();
	}

	var completionRecord;
	try {
		var innerResult = Call$1(iteratorReturn, iterator, []);
	} catch (e) {
		// if we hit here, then "e" is the innerResult completion that needs re-throwing

		// if the completion is of type "throw", this will throw.
		completionThunk();
		completionThunk = null; // ensure it's not called twice.

		// if not, then return the innerResult completion
		throw e;
	}
	completionRecord = completionThunk(); // if innerResult worked, then throw if the completion does
	completionThunk = null; // ensure it's not called twice.

	if (Type$2(innerResult) !== 'Object') {
		throw new $TypeError$1q('iterator .return must return an object');
	}

	return completionRecord;
};

var msPerDay$a = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.13

var MakeDate$2 = function MakeDate(day, time) {
	if (!_isFinite(day) || !_isFinite(time)) {
		return NaN;
	}
	return (day * msPerDay$a) + time;
};

var $floor$n = GetIntrinsic('%Math.floor%');
var $DateUTC$2 = GetIntrinsic('%Date.UTC%');










// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.12

var MakeDay$2 = function MakeDay(year, month, date) {
	if (!_isFinite(year) || !_isFinite(month) || !_isFinite(date)) {
		return NaN;
	}
	var y = ToInteger$2(year);
	var m = ToInteger$2(month);
	var dt = ToInteger$2(date);
	var ym = y + $floor$n(m / 12);
	var mn = mod(m, 12);
	var t = $DateUTC$2(ym, mn, 1);
	if (YearFromTime$2(t) !== ym || MonthFromTime$2(t) !== mn || DateFromTime$2(t) !== 1) {
		return NaN;
	}
	return Day$2(t) + dt - 1;
};

var msPerSecond$7 = timeConstants.msPerSecond;
var msPerMinute$5 = timeConstants.msPerMinute;
var msPerHour$6 = timeConstants.msPerHour;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.11

var MakeTime$2 = function MakeTime(hour, min, sec, ms) {
	if (!_isFinite(hour) || !_isFinite(min) || !_isFinite(sec) || !_isFinite(ms)) {
		return NaN;
	}
	var h = ToInteger$2(hour);
	var m = ToInteger$2(min);
	var s = ToInteger$2(sec);
	var milli = ToInteger$2(ms);
	var t = (h * msPerHour$6) + (m * msPerMinute$5) + (s * msPerSecond$7) + milli;
	return t;
};

var $floor$o = GetIntrinsic('%Math.floor%');



var msPerMinute$6 = timeConstants.msPerMinute;
var MinutesPerHour$3 = timeConstants.MinutesPerHour;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var MinFromTime$2 = function MinFromTime(t) {
	return mod($floor$o(t / msPerMinute$6), MinutesPerHour$3);
};

// https://ecma-international.org/ecma-262/5.1/#sec-5.2

var modulo$2 = function modulo(x, y) {
	return mod(x, y);
};

var msPerSecond$8 = timeConstants.msPerSecond;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var msFromTime$2 = function msFromTime(t) {
	return mod(t, msPerSecond$8);
};

var $ObjectCreate$1 = GetIntrinsic('%Object.create%', true);
var $TypeError$1r = GetIntrinsic('%TypeError%');
var $SyntaxError$8 = GetIntrinsic('%SyntaxError%');



var hasProto$1 = !({ __proto__: null } instanceof Object);

// https://www.ecma-international.org/ecma-262/6.0/#sec-objectcreate

var ObjectCreate$1 = function ObjectCreate(proto, internalSlotsList) {
	if (proto !== null && Type$2(proto) !== 'Object') {
		throw new $TypeError$1r('Assertion failed: `proto` must be null or an object');
	}
	var slots = arguments.length < 2 ? [] : internalSlotsList;
	if (slots.length > 0) {
		throw new $SyntaxError$8('es-abstract does not yet support internal slots');
	}

	if ($ObjectCreate$1) {
		return $ObjectCreate$1(proto);
	}
	if (hasProto$1) {
		return { __proto__: proto };
	}

	if (proto === null) {
		throw new $SyntaxError$8('native Object.create support is required to create null objects');
	}
	var T = function T() {};
	T.prototype = proto;
	return new T();
};

var originalGetProto = GetIntrinsic('%Object.getPrototypeOf%', true);
var $ArrayProto = GetIntrinsic('%Array.prototype%');

var getProto$1 = originalGetProto || (
	// eslint-disable-next-line no-proto
	[].__proto__ === $ArrayProto
		? function (O) {
			return O.__proto__; // eslint-disable-line no-proto
		}
		: null
);

var $TypeError$1s = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/7.0/#sec-ordinarygetprototypeof

var OrdinaryGetPrototypeOf = function OrdinaryGetPrototypeOf(O) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1s('Assertion failed: O must be an Object');
	}
	if (!getProto$1) {
		throw new $TypeError$1s('This environment does not support fetching prototypes.');
	}
	return getProto$1(O);
};

var originalSetProto = GetIntrinsic('%Object.setPrototypeOf%', true);
var $ArrayProto$1 = GetIntrinsic('%Array.prototype%');

var setProto = originalSetProto || (
	// eslint-disable-next-line no-proto, no-negated-condition
	[].__proto__ !== $ArrayProto$1
		? null
		: function (O, proto) {
			O.__proto__ = proto; // eslint-disable-line no-proto, no-param-reassign
			return O;
		}
);

var $TypeError$1t = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/7.0/#sec-ordinarysetprototypeof

var OrdinarySetPrototypeOf = function OrdinarySetPrototypeOf(O, V) {
	if (Type$2(V) !== 'Object' && Type$2(V) !== 'Null') {
		throw new $TypeError$1t('Assertion failed: V must be Object or Null');
	}
	/*
    var extensible = IsExtensible(O);
    var current = OrdinaryGetPrototypeOf(O);
    if (SameValue(V, current)) {
        return true;
    }
    if (!extensible) {
        return false;
    }
    */
	try {
		setProto(O, V);
	} catch (e) {
		return false;
	}
	return OrdinaryGetPrototypeOf(O) === V;
	/*
    var p = V;
    var done = false;
    while (!done) {
        if (p === null) {
            done = true;
        } else if (SameValue(p, O)) {
            return false;
        } else {
            if (wat) {
                done = true;
            } else {
                p = p.[[Prototype]];
            }
        }
     }
     O.[[Prototype]] = V;
     return true;
     */
};

var $TypeError$1u = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasproperty

var OrdinaryHasProperty$1 = function OrdinaryHasProperty(O, P) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1u('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$1u('Assertion failed: P must be a Property Key');
	}
	return P in O;
};

var $TypeError$1v = GetIntrinsic('%TypeError%');

var regexExec$2 = callBound('RegExp.prototype.exec');






// https://ecma-international.org/ecma-262/6.0/#sec-regexpexec

var RegExpExec$1 = function RegExpExec(R, S) {
	if (Type$2(R) !== 'Object') {
		throw new $TypeError$1v('Assertion failed: `R` must be an Object');
	}
	if (Type$2(S) !== 'String') {
		throw new $TypeError$1v('Assertion failed: `S` must be a String');
	}
	var exec = Get$1(R, 'exec');
	if (IsCallable$2(exec)) {
		var result = Call$1(exec, R, [S]);
		if (result === null || Type$2(result) === 'Object') {
			return result;
		}
		throw new $TypeError$1v('"exec" method must return `null` or an Object');
	}
	return regexExec$2(R, S);
};

var $TypeError$1w = GetIntrinsic('%TypeError%');



// https://www.ecma-international.org/ecma-262/7.0/#sec-samevaluenonnumber

var SameValueNonNumber = function SameValueNonNumber(x, y) {
	if (typeof x === 'number' || typeof x !== typeof y) {
		throw new $TypeError$1w('SameValueNonNumber requires two non-number values of the same type.');
	}
	return SameValue$2(x, y);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-samevaluezero

var SameValueZero$1 = function SameValueZero(x, y) {
	return (x === y) || (_isNaN(x) && _isNaN(y));
};

var $floor$p = GetIntrinsic('%Math.floor%');



var msPerSecond$9 = timeConstants.msPerSecond;
var SecondsPerMinute$3 = timeConstants.SecondsPerMinute;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var SecFromTime$2 = function SecFromTime(t) {
	return mod($floor$p(t / msPerSecond$9), SecondsPerMinute$3);
};

var $TypeError$1x = GetIntrinsic('%TypeError%');





// IE 9 does not throw in strict mode when writability/configurability/extensibility is violated
var noThrowOnStrictViolation$1 = (function () {
	try {
		delete [].length;
		return true;
	} catch (e) {
		return false;
	}
}());

// https://ecma-international.org/ecma-262/6.0/#sec-set-o-p-v-throw

var _Set$1 = function Set(O, P, V, Throw) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1x('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$1(P)) {
		throw new $TypeError$1x('Assertion failed: `P` must be a Property Key');
	}
	if (Type$2(Throw) !== 'Boolean') {
		throw new $TypeError$1x('Assertion failed: `Throw` must be a Boolean');
	}
	if (Throw) {
		O[P] = V; // eslint-disable-line no-param-reassign
		if (noThrowOnStrictViolation$1 && !SameValue$2(O[P], V)) {
			throw new $TypeError$1x('Attempted to assign to readonly property.');
		}
		return true;
	} else {
		try {
			O[P] = V; // eslint-disable-line no-param-reassign
			return noThrowOnStrictViolation$1 ? SameValue$2(O[P], V) : true;
		} catch (e) {
			return false;
		}
	}
};

var $TypeError$1y = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-setfunctionname

var SetFunctionName$1 = function SetFunctionName(F, name) {
	if (typeof F !== 'function') {
		throw new $TypeError$1y('Assertion failed: `F` must be a function');
	}
	if (!IsExtensible$1(F) || src(F, 'name')) {
		throw new $TypeError$1y('Assertion failed: `F` must be extensible, and must not have a `name` own property');
	}
	var nameType = Type$2(name);
	if (nameType !== 'Symbol' && nameType !== 'String') {
		throw new $TypeError$1y('Assertion failed: `name` must be a Symbol or a String');
	}
	if (nameType === 'Symbol') {
		var description = getSymbolDescription(name);
		// eslint-disable-next-line no-param-reassign
		name = typeof description === 'undefined' ? '' : '[' + description + ']';
	}
	if (arguments.length > 2) {
		var prefix = arguments[2];
		// eslint-disable-next-line no-param-reassign
		name = prefix + ' ' + name;
	}
	return DefinePropertyOrThrow$1(F, 'name', {
		'[[Value]]': name,
		'[[Writable]]': false,
		'[[Enumerable]]': false,
		'[[Configurable]]': true
	});
};

var $SyntaxError$9 = GetIntrinsic('%SyntaxError%');
var $TypeError$1z = GetIntrinsic('%TypeError%');
var $preventExtensions$3 = GetIntrinsic('%Object.preventExtensions%');

var $gOPN$4 = GetIntrinsic('%Object.getOwnPropertyNames%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-setintegritylevel

var SetIntegrityLevel$1 = function SetIntegrityLevel(O, level) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1z('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$1z('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	if (!$preventExtensions$3) {
		throw new $SyntaxError$9('SetIntegrityLevel requires native `Object.preventExtensions` support');
	}
	var status = $preventExtensions$3(O);
	if (!status) {
		return false;
	}
	if (!$gOPN$4) {
		throw new $SyntaxError$9('SetIntegrityLevel requires native `Object.getOwnPropertyNames` support');
	}
	var theKeys = $gOPN$4(O);
	if (level === 'sealed') {
		forEach(theKeys, function (k) {
			DefinePropertyOrThrow$1(O, k, { configurable: false });
		});
	} else if (level === 'frozen') {
		forEach(theKeys, function (k) {
			var currentDesc = getOwnPropertyDescriptor(O, k);
			if (typeof currentDesc !== 'undefined') {
				var desc;
				if (IsAccessorDescriptor$2(ToPropertyDescriptor$2(currentDesc))) {
					desc = { configurable: false };
				} else {
					desc = { configurable: false, writable: false };
				}
				DefinePropertyOrThrow$1(O, k, desc);
			}
		});
	}
	return true;
};

var $species$3 = GetIntrinsic('%Symbol.species%', true);
var $TypeError$1A = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-speciesconstructor

var SpeciesConstructor$1 = function SpeciesConstructor(O, defaultConstructor) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1A('Assertion failed: Type(O) is not Object');
	}
	var C = O.constructor;
	if (typeof C === 'undefined') {
		return defaultConstructor;
	}
	if (Type$2(C) !== 'Object') {
		throw new $TypeError$1A('O.constructor is not an Object');
	}
	var S = $species$3 ? C[$species$3] : void 0;
	if (S == null) {
		return defaultConstructor;
	}
	if (IsConstructor$1(S)) {
		return S;
	}
	throw new $TypeError$1A('no constructor found');
};

var $TypeError$1B = GetIntrinsic('%TypeError%');



var $SymbolToString$1 = callBound('Symbol.prototype.toString', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-symboldescriptivestring

var SymbolDescriptiveString$1 = function SymbolDescriptiveString(sym) {
	if (Type$2(sym) !== 'Symbol') {
		throw new $TypeError$1B('Assertion failed: `sym` must be a Symbol');
	}
	return $SymbolToString$1(sym);
};

var $gOPN$5 = GetIntrinsic('%Object.getOwnPropertyNames%');
var $TypeError$1C = GetIntrinsic('%TypeError%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-testintegritylevel

var TestIntegrityLevel$1 = function TestIntegrityLevel(O, level) {
	if (Type$2(O) !== 'Object') {
		throw new $TypeError$1C('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$1C('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	var status = IsExtensible$1(O);
	if (status) {
		return false;
	}
	var theKeys = $gOPN$5(O);
	return theKeys.length === 0 || every(theKeys, function (k) {
		var currentDesc = getOwnPropertyDescriptor(O, k);
		if (typeof currentDesc !== 'undefined') {
			if (currentDesc.configurable) {
				return false;
			}
			if (level === 'frozen' && IsDataDescriptor$2(ToPropertyDescriptor$2(currentDesc)) && currentDesc.writable) {
				return false;
			}
		}
		return true;
	});
};

var $BooleanValueOf$1 = callBound('Boolean.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-boolean-prototype-object

var thisBooleanValue$1 = function thisBooleanValue(value) {
	if (Type$2(value) === 'Boolean') {
		return value;
	}

	return $BooleanValueOf$1(value);
};

var $NumberValueOf$1 = callBound('Number.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-number-prototype-object

var thisNumberValue$1 = function thisNumberValue(value) {
	if (Type$2(value) === 'Number') {
		return value;
	}

	return $NumberValueOf$1(value);
};

var $StringValueOf$1 = callBound('String.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-string-prototype-object

var thisStringValue$1 = function thisStringValue(value) {
	if (Type$2(value) === 'String') {
		return value;
	}

	return $StringValueOf$1(value);
};

var $DateValueOf$1 = callBound('Date.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-date-prototype-object

var thisTimeValue$1 = function thisTimeValue(value) {
	return $DateValueOf$1(value);
};

var $Date$6 = GetIntrinsic('%Date%');
var $Number$8 = GetIntrinsic('%Number%');
var $abs$8 = GetIntrinsic('%Math.abs%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.14

var TimeClip$2 = function TimeClip(time) {
	if (!_isFinite(time) || $abs$8(time) > 8.64e15) {
		return NaN;
	}
	return $Number$8(new $Date$6(ToNumber$2(time)));
};

var msPerDay$b = timeConstants.msPerDay;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var TimeFromYear$2 = function TimeFromYear(y) {
	return msPerDay$b * DayFromYear$2(y);
};

var msPerDay$c = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var TimeWithinDay$2 = function TimeWithinDay(t) {
	return mod(t, msPerDay$c);
};

var $TypeError$1D = GetIntrinsic('%TypeError%');
var $Date$7 = GetIntrinsic('%Date%');





// https://ecma-international.org/ecma-262/6.0/#sec-todatestring

var ToDateString$1 = function ToDateString(tv) {
	if (Type$2(tv) !== 'Number') {
		throw new $TypeError$1D('Assertion failed: `tv` must be a Number');
	}
	if (_isNaN(tv)) {
		return 'Invalid Date';
	}
	return $Date$7(tv);
};

var $Math$8 = GetIntrinsic('%Math%');








var $floor$q = $Math$8.floor;
var $abs$9 = $Math$8.abs;

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.7

var ToUint16$2 = function ToUint16(value) {
	var number = ToNumber$2(value);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$q($abs$9(number));
	return mod(posInt, 0x10000);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint16

var ToInt16$1 = function ToInt16(argument) {
	var int16bit = ToUint16$2(argument);
	return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.5

var ToInt32$2 = function ToInt32(x) {
	return ToNumber$2(x) >> 0;
};

var $Math$9 = GetIntrinsic('%Math%');








var $floor$r = $Math$9.floor;
var $abs$a = $Math$9.abs;

var ToUint8$1 = function ToUint8(argument) {
	var number = ToNumber$2(argument);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$r($abs$a(number));
	return mod(posInt, 0x100);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint8

var ToInt8$1 = function ToInt8(argument) {
	var int8bit = ToUint8$1(argument);
	return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
};

var $String$4 = GetIntrinsic('%String%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-topropertykey

var ToPropertyKey$1 = function ToPropertyKey(argument) {
	var key = ToPrimitive$2(argument, $String$4);
	return typeof key === 'symbol' ? key : ToString$2(key);
};

var $Math$a = GetIntrinsic('%Math%');





var $floor$s = $Math$a.floor;

// https://www.ecma-international.org/ecma-262/6.0/#sec-touint8clamp

var ToUint8Clamp$1 = function ToUint8Clamp(argument) {
	var number = ToNumber$2(argument);
	if (_isNaN(number) || number <= 0) { return 0; }
	if (number >= 0xFF) { return 0xFF; }
	var f = $floor$s(argument);
	if (f + 0.5 < number) { return f + 1; }
	if (number < f + 0.5) { return f; }
	if (f % 2 !== 0) { return f + 1; }
	return f;
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.6

var WeekDay$2 = function WeekDay(t) {
	return mod(Day$2(t) + 4, 7);
};

/* eslint global-require: 0 */
// https://www.ecma-international.org/ecma-262/7.0/#sec-abstract-operations
var ES2016 = {
	'Abstract Equality Comparison': AbstractEqualityComparison$2,
	'Abstract Relational Comparison': AbstractRelationalComparison$2,
	'Strict Equality Comparison': StrictEqualityComparison$2,
	AdvanceStringIndex: AdvanceStringIndex$1,
	ArrayCreate: ArrayCreate$1,
	ArraySetLength: ArraySetLength$1,
	ArraySpeciesCreate: ArraySpeciesCreate$1,
	Call: Call$1,
	CanonicalNumericIndexString: CanonicalNumericIndexString$1,
	CompletePropertyDescriptor: CompletePropertyDescriptor$1,
	CreateDataProperty: CreateDataProperty$1,
	CreateDataPropertyOrThrow: CreateDataPropertyOrThrow$1,
	CreateHTML: CreateHTML$1,
	CreateIterResultObject: CreateIterResultObject$1,
	CreateListFromArrayLike: CreateListFromArrayLike$1,
	CreateMethodProperty: CreateMethodProperty$1,
	DateFromTime: DateFromTime$2,
	Day: Day$2,
	DayFromYear: DayFromYear$2,
	DaysInYear: DaysInYear$2,
	DayWithinYear: DayWithinYear$2,
	DefinePropertyOrThrow: DefinePropertyOrThrow$1,
	DeletePropertyOrThrow: DeletePropertyOrThrow$1,
	EnumerableOwnNames: EnumerableOwnNames$1,
	FromPropertyDescriptor: FromPropertyDescriptor$2,
	Get: Get$1,
	GetIterator: GetIterator$1,
	GetMethod: GetMethod$2,
	GetOwnPropertyKeys: GetOwnPropertyKeys$1,
	GetPrototypeFromConstructor: GetPrototypeFromConstructor$1,
	GetSubstitution: GetSubstitution$1,
	GetV: GetV$1,
	HasOwnProperty: HasOwnProperty$1,
	HasProperty: HasProperty$1,
	HourFromTime: HourFromTime$2,
	InLeapYear: InLeapYear$2,
	InstanceofOperator: InstanceofOperator$1,
	Invoke: Invoke$1,
	IsAccessorDescriptor: IsAccessorDescriptor$2,
	IsArray: IsArray$1,
	IsCallable: IsCallable$2,
	IsConcatSpreadable: IsConcatSpreadable$1,
	IsConstructor: IsConstructor$1,
	IsDataDescriptor: IsDataDescriptor$2,
	IsExtensible: IsExtensible$1,
	IsGenericDescriptor: IsGenericDescriptor$2,
	IsInteger: IsInteger$1,
	IsPromise: IsPromise$1,
	IsPropertyDescriptor: IsPropertyDescriptor$2,
	IsPropertyKey: IsPropertyKey$1,
	IsRegExp: IsRegExp$1,
	IterableToArrayLike: IterableToArrayLike,
	IteratorClose: IteratorClose$1,
	IteratorComplete: IteratorComplete$1,
	IteratorNext: IteratorNext$1,
	IteratorStep: IteratorStep$1,
	IteratorValue: IteratorValue$1,
	MakeDate: MakeDate$2,
	MakeDay: MakeDay$2,
	MakeTime: MakeTime$2,
	MinFromTime: MinFromTime$2,
	modulo: modulo$2,
	MonthFromTime: MonthFromTime$2,
	msFromTime: msFromTime$2,
	ObjectCreate: ObjectCreate$1,
	OrdinaryDefineOwnProperty: OrdinaryDefineOwnProperty$1,
	OrdinaryGetOwnProperty: OrdinaryGetOwnProperty$1,
	OrdinaryGetPrototypeOf: OrdinaryGetPrototypeOf,
	OrdinarySetPrototypeOf: OrdinarySetPrototypeOf,
	OrdinaryHasInstance: OrdinaryHasInstance$1,
	OrdinaryHasProperty: OrdinaryHasProperty$1,
	RegExpExec: RegExpExec$1,
	RequireObjectCoercible: RequireObjectCoercible$1,
	SameValue: SameValue$2,
	SameValueNonNumber: SameValueNonNumber,
	SameValueZero: SameValueZero$1,
	SecFromTime: SecFromTime$2,
	Set: _Set$1,
	SetFunctionName: SetFunctionName$1,
	SetIntegrityLevel: SetIntegrityLevel$1,
	SpeciesConstructor: SpeciesConstructor$1,
	SymbolDescriptiveString: SymbolDescriptiveString$1,
	TestIntegrityLevel: TestIntegrityLevel$1,
	thisBooleanValue: thisBooleanValue$1,
	thisNumberValue: thisNumberValue$1,
	thisStringValue: thisStringValue$1,
	thisTimeValue: thisTimeValue$1,
	TimeClip: TimeClip$2,
	TimeFromYear: TimeFromYear$2,
	TimeWithinDay: TimeWithinDay$2,
	ToBoolean: ToBoolean$2,
	ToDateString: ToDateString$1,
	ToInt16: ToInt16$1,
	ToInt32: ToInt32$2,
	ToInt8: ToInt8$1,
	ToInteger: ToInteger$2,
	ToLength: ToLength$1,
	ToNumber: ToNumber$2,
	ToObject: ToObject$2,
	ToPrimitive: ToPrimitive$2,
	ToPropertyDescriptor: ToPropertyDescriptor$2,
	ToPropertyKey: ToPropertyKey$1,
	ToString: ToString$2,
	ToUint16: ToUint16$2,
	ToUint32: ToUint32$2,
	ToUint8: ToUint8$1,
	ToUint8Clamp: ToUint8Clamp$1,
	Type: Type$2,
	ValidateAndApplyPropertyDescriptor: ValidateAndApplyPropertyDescriptor$1,
	WeekDay: WeekDay$2,
	YearFromTime: YearFromTime$2
};

var es2016 = ES2016;

// https://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive

var ToPrimitive$3 = function ToPrimitive(input) {
	if (arguments.length > 1) {
		return es2015(input, arguments[1]);
	}
	return es2015(input);
};

var $TypeError$1E = GetIntrinsic('%TypeError%');
var $Number$9 = GetIntrinsic('%Number%');
var $RegExp$2 = GetIntrinsic('%RegExp%');
var $parseInteger$2 = GetIntrinsic('%parseInt%');





var $strSlice$5 = callBound('String.prototype.slice');
var isBinary$2 = regexTester(/^0b[01]+$/i);
var isOctal$2 = regexTester(/^0o[0-7]+$/i);
var isInvalidHexLiteral$2 = regexTester(/^[-+]0x[0-9a-f]+$/i);
var nonWS$2 = ['\u0085', '\u200b', '\ufffe'].join('');
var nonWSregex$2 = new $RegExp$2('[' + nonWS$2 + ']', 'g');
var hasNonWS$2 = regexTester(nonWSregex$2);

// whitespace from: https://es5.github.io/#x15.5.4.20
// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
var ws$2 = [
	'\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003',
	'\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028',
	'\u2029\uFEFF'
].join('');
var trimRegex$2 = new RegExp('(^[' + ws$2 + ']+)|([' + ws$2 + ']+$)', 'g');
var $replace$5 = callBound('String.prototype.replace');
var $trim$2 = function (value) {
	return $replace$5(value, trimRegex$2, '');
};



// https://www.ecma-international.org/ecma-262/6.0/#sec-tonumber

var ToNumber$3 = function ToNumber(argument) {
	var value = isPrimitive$1(argument) ? argument : ToPrimitive$3(argument, $Number$9);
	if (typeof value === 'symbol') {
		throw new $TypeError$1E('Cannot convert a Symbol value to a number');
	}
	if (typeof value === 'string') {
		if (isBinary$2(value)) {
			return ToNumber($parseInteger$2($strSlice$5(value, 2), 2));
		} else if (isOctal$2(value)) {
			return ToNumber($parseInteger$2($strSlice$5(value, 2), 8));
		} else if (hasNonWS$2(value) || isInvalidHexLiteral$2(value)) {
			return NaN;
		} else {
			var trimmed = $trim$2(value);
			if (trimmed !== value) {
				return ToNumber(trimmed);
			}
		}
	}
	return $Number$9(value);
};

// https://ecma-international.org/ecma-262/6.0/#sec-ecmascript-data-types-and-values

var Type$3 = function Type$1(x) {
	if (typeof x === 'symbol') {
		return 'Symbol';
	}
	return Type(x);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-abstract-equality-comparison

var AbstractEqualityComparison$3 = function AbstractEqualityComparison(x, y) {
	var xType = Type$3(x);
	var yType = Type$3(y);
	if (xType === yType) {
		return x === y; // ES6+ specified this shortcut anyways.
	}
	if (x == null && y == null) {
		return true;
	}
	if (xType === 'Number' && yType === 'String') {
		return AbstractEqualityComparison(x, ToNumber$3(y));
	}
	if (xType === 'String' && yType === 'Number') {
		return AbstractEqualityComparison(ToNumber$3(x), y);
	}
	if (xType === 'Boolean') {
		return AbstractEqualityComparison(ToNumber$3(x), y);
	}
	if (yType === 'Boolean') {
		return AbstractEqualityComparison(x, ToNumber$3(y));
	}
	if ((xType === 'String' || xType === 'Number' || xType === 'Symbol') && yType === 'Object') {
		return AbstractEqualityComparison(x, ToPrimitive$3(y));
	}
	if (xType === 'Object' && (yType === 'String' || yType === 'Number' || yType === 'Symbol')) {
		return AbstractEqualityComparison(ToPrimitive$3(x), y);
	}
	return false;
};

var $Number$a = GetIntrinsic('%Number%');
var $TypeError$1F = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/5.1/#sec-11.8.5

// eslint-disable-next-line max-statements
var AbstractRelationalComparison$3 = function AbstractRelationalComparison(x, y, LeftFirst) {
	if (Type$3(LeftFirst) !== 'Boolean') {
		throw new $TypeError$1F('Assertion failed: LeftFirst argument must be a Boolean');
	}
	var px;
	var py;
	if (LeftFirst) {
		px = ToPrimitive$3(x, $Number$a);
		py = ToPrimitive$3(y, $Number$a);
	} else {
		py = ToPrimitive$3(y, $Number$a);
		px = ToPrimitive$3(x, $Number$a);
	}
	var bothStrings = Type$3(px) === 'String' && Type$3(py) === 'String';
	if (!bothStrings) {
		var nx = ToNumber$3(px);
		var ny = ToNumber$3(py);
		if (_isNaN(nx) || _isNaN(ny)) {
			return undefined;
		}
		if (_isFinite(nx) && _isFinite(ny) && nx === ny) {
			return false;
		}
		if (nx === 0 && ny === 0) {
			return false;
		}
		if (nx === Infinity) {
			return false;
		}
		if (ny === Infinity) {
			return true;
		}
		if (ny === -Infinity) {
			return false;
		}
		if (nx === -Infinity) {
			return true;
		}
		return nx < ny; // by now, these are both nonzero, finite, and not equal
	}
	if (isPrefixOf(py, px)) {
		return false;
	}
	if (isPrefixOf(px, py)) {
		return true;
	}
	return px < py; // both strings, neither a prefix of the other. shortcut for steps c-f
};

// https://www.ecma-international.org/ecma-262/5.1/#sec-11.9.6

var StrictEqualityComparison$3 = function StrictEqualityComparison(x, y) {
	var xType = Type$3(x);
	var yType = Type$3(y);
	if (xType !== yType) {
		return false;
	}
	if (xType === 'Undefined' || xType === 'Null') {
		return true;
	}
	return x === y; // shortcut for steps 4-7
};

var $Math$b = GetIntrinsic('%Math%');

var $floor$t = $Math$b.floor;
var $abs$b = $Math$b.abs;




// https://www.ecma-international.org/ecma-262/6.0/#sec-isinteger

var IsInteger$2 = function IsInteger(argument) {
	if (typeof argument !== 'number' || _isNaN(argument) || !_isFinite(argument)) {
		return false;
	}
	var abs = $abs$b(argument);
	return $floor$t(abs) === abs;
};

var $TypeError$1G = GetIntrinsic('%TypeError%');

var $charCodeAt$2 = callBound('String.prototype.charCodeAt');

// https://ecma-international.org/ecma-262/6.0/#sec-advancestringindex

var AdvanceStringIndex$2 = function AdvanceStringIndex(S, index, unicode) {
	if (Type$3(S) !== 'String') {
		throw new $TypeError$1G('Assertion failed: `S` must be a String');
	}
	if (!IsInteger$2(index) || index < 0 || index > maxSafeInteger) {
		throw new $TypeError$1G('Assertion failed: `length` must be an integer >= 0 and <= 2**53');
	}
	if (Type$3(unicode) !== 'Boolean') {
		throw new $TypeError$1G('Assertion failed: `unicode` must be a Boolean');
	}
	if (!unicode) {
		return index + 1;
	}
	var length = S.length;
	if ((index + 1) >= length) {
		return index + 1;
	}

	var first = $charCodeAt$2(S, index);
	if (first < 0xD800 || first > 0xDBFF) {
		return index + 1;
	}

	var second = $charCodeAt$2(S, index + 1);
	if (second < 0xDC00 || second > 0xDFFF) {
		return index + 1;
	}

	return index + 2;
};

var $ArrayPrototype$2 = GetIntrinsic('%Array.prototype%');
var $RangeError$4 = GetIntrinsic('%RangeError%');
var $SyntaxError$a = GetIntrinsic('%SyntaxError%');
var $TypeError$1H = GetIntrinsic('%TypeError%');



var MAX_ARRAY_LENGTH$2 = Math.pow(2, 32) - 1;

var $setProto$2 = GetIntrinsic('%Object.setPrototypeOf%', true) || (
	// eslint-disable-next-line no-proto, no-negated-condition
	[].__proto__ !== $ArrayPrototype$2
		? null
		: function (O, proto) {
			O.__proto__ = proto; // eslint-disable-line no-proto, no-param-reassign
			return O;
		}
);

// https://www.ecma-international.org/ecma-262/6.0/#sec-arraycreate

var ArrayCreate$2 = function ArrayCreate(length) {
	if (!IsInteger$2(length) || length < 0) {
		throw new $TypeError$1H('Assertion failed: `length` must be an integer Number >= 0');
	}
	if (length > MAX_ARRAY_LENGTH$2) {
		throw new $RangeError$4('length is greater than (2**32 - 1)');
	}
	var proto = arguments.length > 1 ? arguments[1] : $ArrayPrototype$2;
	var A = []; // steps 5 - 7, and 9
	if (proto !== $ArrayPrototype$2) { // step 8
		if (!$setProto$2) {
			throw new $SyntaxError$a('ArrayCreate: a `proto` argument that is not `Array.prototype` is not supported in an environment that does not support setting the [[Prototype]]');
		}
		$setProto$2(A, proto);
	}
	if (length !== 0) { // bypasses the need for step 2
		A.length = length;
	}
	/* step 10, the above as a shortcut for the below
    OrdinaryDefineOwnProperty(A, 'length', {
        '[[Configurable]]': false,
        '[[Enumerable]]': false,
        '[[Value]]': length,
        '[[Writable]]': true
    });
    */
	return A;
};

var $Array$4 = GetIntrinsic('%Array%');

// eslint-disable-next-line global-require
var toStr$b = !$Array$4.isArray && callBound('Object.prototype.toString');

// https://www.ecma-international.org/ecma-262/6.0/#sec-isarray

var IsArray$2 = $Array$4.isArray || function IsArray(argument) {
	return toStr$b(argument) === '[object Array]';
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isaccessordescriptor

var IsAccessorDescriptor$3 = function IsAccessorDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$3, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Get]]') && !src(Desc, '[[Set]]')) {
		return false;
	}

	return true;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isdatadescriptor

var IsDataDescriptor$3 = function IsDataDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$3, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Value]]') && !src(Desc, '[[Writable]]')) {
		return false;
	}

	return true;
};

var $Object$5 = GetIntrinsic('%Object%');



var $preventExtensions$4 = $Object$5.preventExtensions;
var $isExtensible$2 = $Object$5.isExtensible;

// https://www.ecma-international.org/ecma-262/6.0/#sec-isextensible-o

var IsExtensible$2 = $preventExtensions$4
	? function IsExtensible(obj) {
		return !isPrimitive$1(obj) && $isExtensible$2(obj);
	}
	: function IsExtensible(obj) {
		return !isPrimitive$1(obj);
	};

// https://www.ecma-international.org/ecma-262/6.0/#sec-ispropertykey

var IsPropertyKey$2 = function IsPropertyKey(argument) {
	return typeof argument === 'string' || typeof argument === 'symbol';
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.2

var ToBoolean$3 = function ToBoolean(value) { return !!value; };

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.11

var IsCallable$3 = isCallable;

var $TypeError$1I = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/5.1/#sec-8.10.5

var ToPropertyDescriptor$3 = function ToPropertyDescriptor(Obj) {
	if (Type$3(Obj) !== 'Object') {
		throw new $TypeError$1I('ToPropertyDescriptor requires an object');
	}

	var desc = {};
	if (src(Obj, 'enumerable')) {
		desc['[[Enumerable]]'] = ToBoolean$3(Obj.enumerable);
	}
	if (src(Obj, 'configurable')) {
		desc['[[Configurable]]'] = ToBoolean$3(Obj.configurable);
	}
	if (src(Obj, 'value')) {
		desc['[[Value]]'] = Obj.value;
	}
	if (src(Obj, 'writable')) {
		desc['[[Writable]]'] = ToBoolean$3(Obj.writable);
	}
	if (src(Obj, 'get')) {
		var getter = Obj.get;
		if (typeof getter !== 'undefined' && !IsCallable$3(getter)) {
			throw new TypeError('getter must be a function');
		}
		desc['[[Get]]'] = getter;
	}
	if (src(Obj, 'set')) {
		var setter = Obj.set;
		if (typeof setter !== 'undefined' && !IsCallable$3(setter)) {
			throw new $TypeError$1I('setter must be a function');
		}
		desc['[[Set]]'] = setter;
	}

	if ((src(desc, '[[Get]]') || src(desc, '[[Set]]')) && (src(desc, '[[Value]]') || src(desc, '[[Writable]]'))) {
		throw new $TypeError$1I('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
	}
	return desc;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.12

var SameValue$3 = function SameValue(x, y) {
	if (x === y) { // 0 === -0, but they are not identical.
		if (x === 0) { return 1 / x === 1 / y; }
		return true;
	}
	return _isNaN(x) && _isNaN(y);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-frompropertydescriptor

var FromPropertyDescriptor$3 = function FromPropertyDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return Desc;
	}

	assertRecord(Type$3, 'Property Descriptor', 'Desc', Desc);

	var obj = {};
	if ('[[Value]]' in Desc) {
		obj.value = Desc['[[Value]]'];
	}
	if ('[[Writable]]' in Desc) {
		obj.writable = Desc['[[Writable]]'];
	}
	if ('[[Get]]' in Desc) {
		obj.get = Desc['[[Get]]'];
	}
	if ('[[Set]]' in Desc) {
		obj.set = Desc['[[Set]]'];
	}
	if ('[[Enumerable]]' in Desc) {
		obj.enumerable = Desc['[[Enumerable]]'];
	}
	if ('[[Configurable]]' in Desc) {
		obj.configurable = Desc['[[Configurable]]'];
	}
	return obj;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isgenericdescriptor

var IsGenericDescriptor$3 = function IsGenericDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$3, 'Property Descriptor', 'Desc', Desc);

	if (!IsAccessorDescriptor$3(Desc) && !IsDataDescriptor$3(Desc)) {
		return true;
	}

	return false;
};

var $TypeError$1J = GetIntrinsic('%TypeError%');













// https://www.ecma-international.org/ecma-262/6.0/#sec-validateandapplypropertydescriptor
// https://www.ecma-international.org/ecma-262/8.0/#sec-validateandapplypropertydescriptor

// eslint-disable-next-line max-lines-per-function, max-statements, max-params
var ValidateAndApplyPropertyDescriptor$2 = function ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current) {
	// this uses the ES2017+ logic, since it fixes a number of bugs in the ES2015 logic.
	var oType = Type$3(O);
	if (oType !== 'Undefined' && oType !== 'Object') {
		throw new $TypeError$1J('Assertion failed: O must be undefined or an Object');
	}
	if (Type$3(extensible) !== 'Boolean') {
		throw new $TypeError$1J('Assertion failed: extensible must be a Boolean');
	}
	if (!isPropertyDescriptor({
		Type: Type$3,
		IsDataDescriptor: IsDataDescriptor$3,
		IsAccessorDescriptor: IsAccessorDescriptor$3
	}, Desc)) {
		throw new $TypeError$1J('Assertion failed: Desc must be a Property Descriptor');
	}
	if (Type$3(current) !== 'Undefined' && !isPropertyDescriptor({
		Type: Type$3,
		IsDataDescriptor: IsDataDescriptor$3,
		IsAccessorDescriptor: IsAccessorDescriptor$3
	}, current)) {
		throw new $TypeError$1J('Assertion failed: current must be a Property Descriptor, or undefined');
	}
	if (oType !== 'Undefined' && !IsPropertyKey$2(P)) {
		throw new $TypeError$1J('Assertion failed: if O is not undefined, P must be a Property Key');
	}
	if (Type$3(current) === 'Undefined') {
		if (!extensible) {
			return false;
		}
		if (IsGenericDescriptor$3(Desc) || IsDataDescriptor$3(Desc)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$3,
					SameValue$3,
					FromPropertyDescriptor$3,
					O,
					P,
					{
						'[[Configurable]]': Desc['[[Configurable]]'],
						'[[Enumerable]]': Desc['[[Enumerable]]'],
						'[[Value]]': Desc['[[Value]]'],
						'[[Writable]]': Desc['[[Writable]]']
					}
				);
			}
		} else {
			if (!IsAccessorDescriptor$3(Desc)) {
				throw new $TypeError$1J('Assertion failed: Desc is not an accessor descriptor');
			}
			if (oType !== 'Undefined') {
				return DefineOwnProperty(
					IsDataDescriptor$3,
					SameValue$3,
					FromPropertyDescriptor$3,
					O,
					P,
					Desc
				);
			}
		}
		return true;
	}
	if (IsGenericDescriptor$3(Desc) && !('[[Configurable]]' in Desc) && !('[[Enumerable]]' in Desc)) {
		return true;
	}
	if (isSamePropertyDescriptor({ SameValue: SameValue$3 }, Desc, current)) {
		return true; // removed by ES2017, but should still be correct
	}
	// "if every field in Desc is absent, return true" can't really match the assertion that it's a Property Descriptor
	if (!current['[[Configurable]]']) {
		if (Desc['[[Configurable]]']) {
			return false;
		}
		if ('[[Enumerable]]' in Desc && !Desc['[[Enumerable]]'] === !!current['[[Enumerable]]']) {
			return false;
		}
	}
	if (IsGenericDescriptor$3(Desc)) ; else if (IsDataDescriptor$3(current) !== IsDataDescriptor$3(Desc)) {
		if (!current['[[Configurable]]']) {
			return false;
		}
		if (IsDataDescriptor$3(current)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$3,
					SameValue$3,
					FromPropertyDescriptor$3,
					O,
					P,
					{
						'[[Configurable]]': current['[[Configurable]]'],
						'[[Enumerable]]': current['[[Enumerable]]'],
						'[[Get]]': undefined
					}
				);
			}
		} else if (oType !== 'Undefined') {
			DefineOwnProperty(
				IsDataDescriptor$3,
				SameValue$3,
				FromPropertyDescriptor$3,
				O,
				P,
				{
					'[[Configurable]]': current['[[Configurable]]'],
					'[[Enumerable]]': current['[[Enumerable]]'],
					'[[Value]]': undefined
				}
			);
		}
	} else if (IsDataDescriptor$3(current) && IsDataDescriptor$3(Desc)) {
		if (!current['[[Configurable]]'] && !current['[[Writable]]']) {
			if ('[[Writable]]' in Desc && Desc['[[Writable]]']) {
				return false;
			}
			if ('[[Value]]' in Desc && !SameValue$3(Desc['[[Value]]'], current['[[Value]]'])) {
				return false;
			}
			return true;
		}
	} else if (IsAccessorDescriptor$3(current) && IsAccessorDescriptor$3(Desc)) {
		if (!current['[[Configurable]]']) {
			if ('[[Set]]' in Desc && !SameValue$3(Desc['[[Set]]'], current['[[Set]]'])) {
				return false;
			}
			if ('[[Get]]' in Desc && !SameValue$3(Desc['[[Get]]'], current['[[Get]]'])) {
				return false;
			}
			return true;
		}
	} else {
		throw new $TypeError$1J('Assertion failed: current and Desc are not both data, both accessors, or one accessor and one data.');
	}
	if (oType !== 'Undefined') {
		return DefineOwnProperty(
			IsDataDescriptor$3,
			SameValue$3,
			FromPropertyDescriptor$3,
			O,
			P,
			Desc
		);
	}
	return true;
};

var $SyntaxError$b = GetIntrinsic('%SyntaxError%');
var $TypeError$1K = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarydefineownproperty

var OrdinaryDefineOwnProperty$2 = function OrdinaryDefineOwnProperty(O, P, Desc) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$1K('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1K('Assertion failed: P must be a Property Key');
	}
	if (!isPropertyDescriptor({
		Type: Type$3,
		IsDataDescriptor: IsDataDescriptor$3,
		IsAccessorDescriptor: IsAccessorDescriptor$3
	}, Desc)) {
		throw new $TypeError$1K('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!getOwnPropertyDescriptor) {
		// ES3/IE 8 fallback
		if (IsAccessorDescriptor$3(Desc)) {
			throw new $SyntaxError$b('This environment does not support accessor property descriptors.');
		}
		var creatingNormalDataProperty = !(P in O)
			&& Desc['[[Writable]]']
			&& Desc['[[Enumerable]]']
			&& Desc['[[Configurable]]']
			&& '[[Value]]' in Desc;
		var settingExistingDataProperty = (P in O)
			&& (!('[[Configurable]]' in Desc) || Desc['[[Configurable]]'])
			&& (!('[[Enumerable]]' in Desc) || Desc['[[Enumerable]]'])
			&& (!('[[Writable]]' in Desc) || Desc['[[Writable]]'])
			&& '[[Value]]' in Desc;
		if (creatingNormalDataProperty || settingExistingDataProperty) {
			O[P] = Desc['[[Value]]']; // eslint-disable-line no-param-reassign
			return SameValue$3(O[P], Desc['[[Value]]']);
		}
		throw new $SyntaxError$b('This environment does not support defining non-writable, non-enumerable, or non-configurable properties');
	}
	var desc = getOwnPropertyDescriptor(O, P);
	var current = desc && ToPropertyDescriptor$3(desc);
	var extensible = IsExtensible$2(O);
	return ValidateAndApplyPropertyDescriptor$2(O, P, extensible, Desc, current);
};

var $match$2 = GetIntrinsic('%Symbol.match%', true);





// https://ecma-international.org/ecma-262/6.0/#sec-isregexp

var IsRegExp$2 = function IsRegExp(argument) {
	if (!argument || typeof argument !== 'object') {
		return false;
	}
	if ($match$2) {
		var isRegExp = argument[$match$2];
		if (typeof isRegExp !== 'undefined') {
			return ToBoolean$3(isRegExp);
		}
	}
	return isRegex(argument);
};

var $TypeError$1L = GetIntrinsic('%TypeError%');



var $isEnumerable$3 = callBound('Object.prototype.propertyIsEnumerable');









// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarygetownproperty

var OrdinaryGetOwnProperty$2 = function OrdinaryGetOwnProperty(O, P) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$1L('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1L('Assertion failed: P must be a Property Key');
	}
	if (!src(O, P)) {
		return void 0;
	}
	if (!getOwnPropertyDescriptor) {
		// ES3 / IE 8 fallback
		var arrayLength = IsArray$2(O) && P === 'length';
		var regexLastIndex = IsRegExp$2(O) && P === 'lastIndex';
		return {
			'[[Configurable]]': !(arrayLength || regexLastIndex),
			'[[Enumerable]]': $isEnumerable$3(O, P),
			'[[Value]]': O[P],
			'[[Writable]]': true
		};
	}
	return ToPropertyDescriptor$3(getOwnPropertyDescriptor(O, P));
};

var $String$5 = GetIntrinsic('%String%');
var $TypeError$1M = GetIntrinsic('%TypeError%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-tostring

var ToString$3 = function ToString(argument) {
	if (typeof argument === 'symbol') {
		throw new $TypeError$1M('Cannot convert a Symbol value to a string');
	}
	return $String$5(argument);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.6

var ToUint32$3 = function ToUint32(x) {
	return ToNumber$3(x) >>> 0;
};

var $RangeError$5 = GetIntrinsic('%RangeError%');
var $TypeError$1N = GetIntrinsic('%TypeError%');















// https://www.ecma-international.org/ecma-262/6.0/#sec-arraysetlength

// eslint-disable-next-line max-statements, max-lines-per-function
var ArraySetLength$2 = function ArraySetLength(A, Desc) {
	if (!IsArray$2(A)) {
		throw new $TypeError$1N('Assertion failed: A must be an Array');
	}
	if (!isPropertyDescriptor({
		Type: Type$3,
		IsDataDescriptor: IsDataDescriptor$3,
		IsAccessorDescriptor: IsAccessorDescriptor$3
	}, Desc)) {
		throw new $TypeError$1N('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!('[[Value]]' in Desc)) {
		return OrdinaryDefineOwnProperty$2(A, 'length', Desc);
	}
	var newLenDesc = object_assign({}, Desc);
	var newLen = ToUint32$3(Desc['[[Value]]']);
	var numberLen = ToNumber$3(Desc['[[Value]]']);
	if (newLen !== numberLen) {
		throw new $RangeError$5('Invalid array length');
	}
	newLenDesc['[[Value]]'] = newLen;
	var oldLenDesc = OrdinaryGetOwnProperty$2(A, 'length');
	if (!IsDataDescriptor$3(oldLenDesc)) {
		throw new $TypeError$1N('Assertion failed: an array had a non-data descriptor on `length`');
	}
	var oldLen = oldLenDesc['[[Value]]'];
	if (newLen >= oldLen) {
		return OrdinaryDefineOwnProperty$2(A, 'length', newLenDesc);
	}
	if (!oldLenDesc['[[Writable]]']) {
		return false;
	}
	var newWritable;
	if (!('[[Writable]]' in newLenDesc) || newLenDesc['[[Writable]]']) {
		newWritable = true;
	} else {
		newWritable = false;
		newLenDesc['[[Writable]]'] = true;
	}
	var succeeded = OrdinaryDefineOwnProperty$2(A, 'length', newLenDesc);
	if (!succeeded) {
		return false;
	}
	while (newLen < oldLen) {
		oldLen -= 1;
		// eslint-disable-next-line no-param-reassign
		var deleteSucceeded = delete A[ToString$3(oldLen)];
		if (!deleteSucceeded) {
			newLenDesc['[[Value]]'] = oldLen + 1;
			if (!newWritable) {
				newLenDesc['[[Writable]]'] = false;
				OrdinaryDefineOwnProperty$2(A, 'length', newLenDesc);
				return false;
			}
		}
	}
	if (!newWritable) {
		return OrdinaryDefineOwnProperty$2(A, 'length', { '[[Writable]]': false });
	}
	return true;
};

var $TypeError$1O = GetIntrinsic('%TypeError%');






/**
 * 7.3.1 Get (O, P) - https://ecma-international.org/ecma-262/6.0/#sec-get-o-p
 * 1. Assert: Type(O) is Object.
 * 2. Assert: IsPropertyKey(P) is true.
 * 3. Return O.[[Get]](P, O).
 */

var Get$2 = function Get(O, P) {
	// 7.3.1.1
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$1O('Assertion failed: Type(O) is not Object');
	}
	// 7.3.1.2
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1O('Assertion failed: IsPropertyKey(P) is not true, got ' + objectInspect(P));
	}
	// 7.3.1.3
	return O[P];
};

var $TypeError$1P = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-definepropertyorthrow

var DefinePropertyOrThrow$2 = function DefinePropertyOrThrow(O, P, desc) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$1P('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1P('Assertion failed: IsPropertyKey(P) is not true');
	}

	var Desc = isPropertyDescriptor({
		Type: Type$3,
		IsDataDescriptor: IsDataDescriptor$3,
		IsAccessorDescriptor: IsAccessorDescriptor$3
	}, desc) ? desc : ToPropertyDescriptor$3(desc);
	if (!isPropertyDescriptor({
		Type: Type$3,
		IsDataDescriptor: IsDataDescriptor$3,
		IsAccessorDescriptor: IsAccessorDescriptor$3
	}, Desc)) {
		throw new $TypeError$1P('Assertion failed: Desc is not a valid Property Descriptor');
	}

	return DefineOwnProperty(
		IsDataDescriptor$3,
		SameValue$3,
		FromPropertyDescriptor$3,
		O,
		P,
		Desc
	);
};

var IsConstructor$2 = createCommonjsModule(function (module) {



var $construct = GetIntrinsic('%Reflect.construct%', true);

var DefinePropertyOrThrow = DefinePropertyOrThrow$2;
try {
	DefinePropertyOrThrow({}, '', { '[[Get]]': function () {} });
} catch (e) {
	// Accessor properties aren't supported
	DefinePropertyOrThrow = null;
}

// https://www.ecma-international.org/ecma-262/6.0/#sec-isconstructor

if (DefinePropertyOrThrow && $construct) {
	var isConstructorMarker = {};
	var badArrayLike = {};
	DefinePropertyOrThrow(badArrayLike, 'length', {
		'[[Get]]': function () {
			throw isConstructorMarker;
		},
		'[[Enumerable]]': true
	});

	module.exports = function IsConstructor(argument) {
		try {
			// `Reflect.construct` invokes `IsConstructor(target)` before `Get(args, 'length')`:
			$construct(argument, badArrayLike);
		} catch (err) {
			return err === isConstructorMarker;
		}
	};
} else {
	module.exports = function IsConstructor(argument) {
		// unfortunately there's no way to truly check this without try/catch `new argument` in old environments
		return typeof argument === 'function' && !!argument.prototype;
	};
}
});

var $Array$5 = GetIntrinsic('%Array%');
var $species$4 = GetIntrinsic('%Symbol.species%', true);
var $TypeError$1Q = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-arrayspeciescreate

var ArraySpeciesCreate$2 = function ArraySpeciesCreate(originalArray, length) {
	if (!IsInteger$2(length) || length < 0) {
		throw new $TypeError$1Q('Assertion failed: length must be an integer >= 0');
	}
	var len = length === 0 ? 0 : length;
	var C;
	var isArray = IsArray$2(originalArray);
	if (isArray) {
		C = Get$2(originalArray, 'constructor');
		// TODO: figure out how to make a cross-realm normal Array, a same-realm Array
		// if (IsConstructor(C)) {
		// 	if C is another realm's Array, C = undefined
		// 	Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(Array))) === null ?
		// }
		if ($species$4 && Type$3(C) === 'Object') {
			C = Get$2(C, $species$4);
			if (C === null) {
				C = void 0;
			}
		}
	}
	if (typeof C === 'undefined') {
		return $Array$5(len);
	}
	if (!IsConstructor$2(C)) {
		throw new $TypeError$1Q('C must be a constructor');
	}
	return new C(len); // Construct(C, len);
};

var $apply$3 = GetIntrinsic('%Reflect.apply%', true) || callBound('%Function.prototype.apply%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-call

var Call$2 = function Call(F, V) {
	var args = arguments.length > 2 ? arguments[2] : [];
	return $apply$3(F, V, args);
};

var $TypeError$1R = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring

var CanonicalNumericIndexString$2 = function CanonicalNumericIndexString(argument) {
	if (Type$3(argument) !== 'String') {
		throw new $TypeError$1R('Assertion failed: `argument` must be a String');
	}
	if (argument === '-0') { return -0; }
	var n = ToNumber$3(argument);
	if (SameValue$3(ToString$3(n), argument)) { return n; }
	return void 0;
};

// https://ecma-international.org/ecma-262/6.0/#sec-completepropertydescriptor

var CompletePropertyDescriptor$2 = function CompletePropertyDescriptor(Desc) {
	/* eslint no-param-reassign: 0 */
	assertRecord(Type$3, 'Property Descriptor', 'Desc', Desc);

	if (IsGenericDescriptor$3(Desc) || IsDataDescriptor$3(Desc)) {
		if (!src(Desc, '[[Value]]')) {
			Desc['[[Value]]'] = void 0;
		}
		if (!src(Desc, '[[Writable]]')) {
			Desc['[[Writable]]'] = false;
		}
	} else {
		if (!src(Desc, '[[Get]]')) {
			Desc['[[Get]]'] = void 0;
		}
		if (!src(Desc, '[[Set]]')) {
			Desc['[[Set]]'] = void 0;
		}
	}
	if (!src(Desc, '[[Enumerable]]')) {
		Desc['[[Enumerable]]'] = false;
	}
	if (!src(Desc, '[[Configurable]]')) {
		Desc['[[Configurable]]'] = false;
	}
	return Desc;
};

var $TypeError$1S = GetIntrinsic('%TypeError%');











// https://www.ecma-international.org/ecma-262/6.0/#sec-createdataproperty

var CreateDataProperty$2 = function CreateDataProperty(O, P, V) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$1S('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1S('Assertion failed: IsPropertyKey(P) is not true');
	}
	var oldDesc = OrdinaryGetOwnProperty$2(O, P);
	var extensible = !oldDesc || IsExtensible$2(O);
	var immutable = oldDesc && (!oldDesc['[[Writable]]'] || !oldDesc['[[Configurable]]']);
	if (immutable || !extensible) {
		return false;
	}
	return DefineOwnProperty(
		IsDataDescriptor$3,
		SameValue$3,
		FromPropertyDescriptor$3,
		O,
		P,
		{
			'[[Configurable]]': true,
			'[[Enumerable]]': true,
			'[[Value]]': V,
			'[[Writable]]': true
		}
	);
};

var $TypeError$1T = GetIntrinsic('%TypeError%');





// // https://ecma-international.org/ecma-262/6.0/#sec-createdatapropertyorthrow

var CreateDataPropertyOrThrow$2 = function CreateDataPropertyOrThrow(O, P, V) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$1T('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1T('Assertion failed: IsPropertyKey(P) is not true');
	}
	var success = CreateDataProperty$2(O, P, V);
	if (!success) {
		throw new $TypeError$1T('unable to create data property');
	}
	return success;
};

var RequireObjectCoercible$2 = CheckObjectCoercible;

var $TypeError$1U = GetIntrinsic('%TypeError%');



var $replace$6 = callBound('String.prototype.replace');





// https://www.ecma-international.org/ecma-262/6.0/#sec-createhtml

var CreateHTML$2 = function CreateHTML(string, tag, attribute, value) {
	if (Type$3(tag) !== 'String' || Type$3(attribute) !== 'String') {
		throw new $TypeError$1U('Assertion failed: `tag` and `attribute` must be strings');
	}
	var str = RequireObjectCoercible$2(string);
	var S = ToString$3(str);
	var p1 = '<' + tag;
	if (attribute !== '') {
		var V = ToString$3(value);
		var escapedV = $replace$6(V, /\x22/g, '&quot;');
		p1 += '\x20' + attribute + '\x3D\x22' + escapedV + '\x22';
	}
	return p1 + '>' + S + '</' + tag + '>';
};

var $TypeError$1V = GetIntrinsic('%TypeError%');



// https://ecma-international.org/ecma-262/6.0/#sec-createiterresultobject

var CreateIterResultObject$2 = function CreateIterResultObject(value, done) {
	if (Type$3(done) !== 'Boolean') {
		throw new $TypeError$1V('Assertion failed: Type(done) is not Boolean');
	}
	return {
		value: value,
		done: done
	};
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-tointeger

var ToInteger$3 = function ToInteger$1(value) {
	var number = ToNumber$3(value);
	return ToInteger(number);
};

var ToLength$2 = function ToLength(argument) {
	var len = ToInteger$3(argument);
	if (len <= 0) { return 0; } // includes converting -0 to +0
	if (len > maxSafeInteger) { return maxSafeInteger; }
	return len;
};

var $TypeError$1W = GetIntrinsic('%TypeError%');
var $indexOf$3 = callBound('Array.prototype.indexOf', true) || callBound('String.prototype.indexOf');
var $push$2 = callBound('Array.prototype.push');







// https://ecma-international.org/ecma-262/6.0/#sec-createlistfromarraylike
var CreateListFromArrayLike$2 = function CreateListFromArrayLike(obj) {
	var elementTypes = arguments.length > 1
		? arguments[1]
		: ['Undefined', 'Null', 'Boolean', 'String', 'Symbol', 'Number', 'Object'];

	if (Type$3(obj) !== 'Object') {
		throw new $TypeError$1W('Assertion failed: `obj` must be an Object');
	}
	if (!IsArray$2(elementTypes)) {
		throw new $TypeError$1W('Assertion failed: `elementTypes`, if provided, must be an array');
	}
	var len = ToLength$2(Get$2(obj, 'length'));
	var list = [];
	var index = 0;
	while (index < len) {
		var indexName = ToString$3(index);
		var next = Get$2(obj, indexName);
		var nextType = Type$3(next);
		if ($indexOf$3(elementTypes, nextType) < 0) {
			throw new $TypeError$1W('item type ' + nextType + ' is not a valid elementType');
		}
		$push$2(list, next);
		index += 1;
	}
	return list;
};

var $TypeError$1X = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/6.0/#sec-createmethodproperty

var CreateMethodProperty$2 = function CreateMethodProperty(O, P, V) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$1X('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1X('Assertion failed: IsPropertyKey(P) is not true');
	}

	var newDesc = {
		'[[Configurable]]': true,
		'[[Enumerable]]': false,
		'[[Value]]': V,
		'[[Writable]]': true
	};
	return DefineOwnProperty(
		IsDataDescriptor$3,
		SameValue$3,
		FromPropertyDescriptor$3,
		O,
		P,
		newDesc
	);
};

var $floor$u = GetIntrinsic('%Math.floor%');

var msPerDay$d = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var Day$3 = function Day(t) {
	return $floor$u(t / msPerDay$d);
};

var $floor$v = GetIntrinsic('%Math.floor%');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DayFromYear$3 = function DayFromYear(y) {
	return (365 * (y - 1970)) + $floor$v((y - 1969) / 4) - $floor$v((y - 1901) / 100) + $floor$v((y - 1601) / 400);
};

var $Date$8 = GetIntrinsic('%Date%');



var $getUTCFullYear$3 = callBound('Date.prototype.getUTCFullYear');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var YearFromTime$3 = function YearFromTime(t) {
	// largest y such that this.TimeFromYear(y) <= t
	return $getUTCFullYear$3(new $Date$8(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var DayWithinYear$3 = function DayWithinYear(t) {
	return Day$3(t) - DayFromYear$3(YearFromTime$3(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DaysInYear$3 = function DaysInYear(y) {
	if (mod(y, 4) !== 0) {
		return 365;
	}
	if (mod(y, 100) !== 0) {
		return 366;
	}
	if (mod(y, 400) !== 0) {
		return 365;
	}
	return 366;
};

var $EvalError$6 = GetIntrinsic('%EvalError%');




// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var InLeapYear$3 = function InLeapYear(t) {
	var days = DaysInYear$3(YearFromTime$3(t));
	if (days === 365) {
		return 0;
	}
	if (days === 366) {
		return 1;
	}
	throw new $EvalError$6('Assertion failed: there are not 365 or 366 days in a year, got: ' + days);
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var MonthFromTime$3 = function MonthFromTime(t) {
	var day = DayWithinYear$3(t);
	if (0 <= day && day < 31) {
		return 0;
	}
	var leap = InLeapYear$3(t);
	if (31 <= day && day < (59 + leap)) {
		return 1;
	}
	if ((59 + leap) <= day && day < (90 + leap)) {
		return 2;
	}
	if ((90 + leap) <= day && day < (120 + leap)) {
		return 3;
	}
	if ((120 + leap) <= day && day < (151 + leap)) {
		return 4;
	}
	if ((151 + leap) <= day && day < (181 + leap)) {
		return 5;
	}
	if ((181 + leap) <= day && day < (212 + leap)) {
		return 6;
	}
	if ((212 + leap) <= day && day < (243 + leap)) {
		return 7;
	}
	if ((243 + leap) <= day && day < (273 + leap)) {
		return 8;
	}
	if ((273 + leap) <= day && day < (304 + leap)) {
		return 9;
	}
	if ((304 + leap) <= day && day < (334 + leap)) {
		return 10;
	}
	if ((334 + leap) <= day && day < (365 + leap)) {
		return 11;
	}
};

var $EvalError$7 = GetIntrinsic('%EvalError%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.5

var DateFromTime$3 = function DateFromTime(t) {
	var m = MonthFromTime$3(t);
	var d = DayWithinYear$3(t);
	if (m === 0) {
		return d + 1;
	}
	if (m === 1) {
		return d - 30;
	}
	var leap = InLeapYear$3(t);
	if (m === 2) {
		return d - 58 - leap;
	}
	if (m === 3) {
		return d - 89 - leap;
	}
	if (m === 4) {
		return d - 119 - leap;
	}
	if (m === 5) {
		return d - 150 - leap;
	}
	if (m === 6) {
		return d - 180 - leap;
	}
	if (m === 7) {
		return d - 211 - leap;
	}
	if (m === 8) {
		return d - 242 - leap;
	}
	if (m === 9) {
		return d - 272 - leap;
	}
	if (m === 10) {
		return d - 303 - leap;
	}
	if (m === 11) {
		return d - 333 - leap;
	}
	throw new $EvalError$7('Assertion failed: MonthFromTime returned an impossible value: ' + m);
};

var $TypeError$1Y = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-deletepropertyorthrow

var DeletePropertyOrThrow$2 = function DeletePropertyOrThrow(O, P) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$1Y('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1Y('Assertion failed: IsPropertyKey(P) is not true');
	}

	// eslint-disable-next-line no-param-reassign
	var success = delete O[P];
	if (!success) {
		throw new $TypeError$1Y('Attempt to delete property failed.');
	}
	return success;
};

var $TypeError$1Z = GetIntrinsic('%TypeError%');







var $isEnumerable$4 = callBound('Object.prototype.propertyIsEnumerable');
var $pushApply = callBind.apply(GetIntrinsic('%Array.prototype.push%'));





// https://www.ecma-international.org/ecma-262/8.0/#sec-enumerableownproperties

var EnumerableOwnProperties = function EnumerableOwnProperties(O, kind) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$1Z('Assertion failed: Type(O) is not Object');
	}

	var keys = objectKeys(O);
	if (kind === 'key') {
		return keys;
	}
	if (kind === 'value' || kind === 'key+value') {
		var results = [];
		forEach(keys, function (key) {
			if ($isEnumerable$4(O, key)) {
				$pushApply(results, [
					kind === 'value' ? O[key] : [key, O[key]]
				]);
			}
		});
		return results;
	}
	throw new $TypeError$1Z('Assertion failed: "kind" is not "key", "value", or "key+value": ' + kind);
};

var $Object$6 = GetIntrinsic('%Object%');



// https://www.ecma-international.org/ecma-262/6.0/#sec-toobject

var ToObject$3 = function ToObject(value) {
	RequireObjectCoercible$2(value);
	return $Object$6(value);
};

var $TypeError$1_ = GetIntrinsic('%TypeError%');




/**
 * 7.3.2 GetV (V, P)
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let O be ToObject(V).
 * 3. ReturnIfAbrupt(O).
 * 4. Return O.[[Get]](P, V).
 */

var GetV$2 = function GetV(V, P) {
	// 7.3.2.1
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1_('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.2.2-3
	var O = ToObject$3(V);

	// 7.3.2.4
	return O[P];
};

var $TypeError$1$ = GetIntrinsic('%TypeError%');





/**
 * 7.3.9 - https://ecma-international.org/ecma-262/6.0/#sec-getmethod
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let func be GetV(O, P).
 * 3. ReturnIfAbrupt(func).
 * 4. If func is either undefined or null, return undefined.
 * 5. If IsCallable(func) is false, throw a TypeError exception.
 * 6. Return func.
 */

var GetMethod$3 = function GetMethod(O, P) {
	// 7.3.9.1
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$1$('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.9.2
	var func = GetV$2(O, P);

	// 7.3.9.4
	if (func == null) {
		return void 0;
	}

	// 7.3.9.5
	if (!IsCallable$3(func)) {
		throw new $TypeError$1$(P + 'is not a function');
	}

	// 7.3.9.6
	return func;
};

var $TypeError$20 = GetIntrinsic('%TypeError%');








// https://ecma-international.org/ecma-262/6.0/#sec-getiterator

var GetIterator$2 = function GetIterator(obj, method) {
	var actualMethod = method;
	if (arguments.length < 2) {
		actualMethod = getIteratorMethod(
			{
				AdvanceStringIndex: AdvanceStringIndex$2,
				GetMethod: GetMethod$3,
				IsArray: IsArray$2,
				Type: Type$3
			},
			obj
		);
	}
	var iterator = Call$2(actualMethod, obj);
	if (Type$3(iterator) !== 'Object') {
		throw new $TypeError$20('iterator must return an object');
	}

	return iterator;
};

var hasSymbols$9 = hasSymbols();

var $TypeError$21 = GetIntrinsic('%TypeError%');

var $gOPN$6 = GetIntrinsic('%Object.getOwnPropertyNames%');
var $gOPS$2 = hasSymbols$9 && GetIntrinsic('%Object.getOwnPropertySymbols%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-getownpropertykeys

var GetOwnPropertyKeys$2 = function GetOwnPropertyKeys(O, Type) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$21('Assertion failed: Type(O) is not Object');
	}
	if (Type === 'Symbol') {
		return $gOPS$2 ? $gOPS$2(O) : [];
	}
	if (Type === 'String') {
		if (!$gOPN$6) {
			return objectKeys(O);
		}
		return $gOPN$6(O);
	}
	throw new $TypeError$21('Assertion failed: `Type` must be `"String"` or `"Symbol"`');
};

var $Function$2 = GetIntrinsic('%Function%');
var $TypeError$22 = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-getprototypefromconstructor

var GetPrototypeFromConstructor$2 = function GetPrototypeFromConstructor(constructor, intrinsicDefaultProto) {
	var intrinsic = GetIntrinsic(intrinsicDefaultProto); // throws if not a valid intrinsic
	if (!IsConstructor$2(constructor)) {
		throw new $TypeError$22('Assertion failed: `constructor` must be a constructor');
	}
	var proto = Get$2(constructor, 'prototype');
	if (Type$3(proto) !== 'Object') {
		if (!(constructor instanceof $Function$2)) {
			// ignore other realms, for now
			throw new $TypeError$22('cross-realm constructors not currently supported');
		}
		proto = intrinsic;
	}
	return proto;
};

var $TypeError$23 = GetIntrinsic('%TypeError%');
var $parseInt$2 = GetIntrinsic('%parseInt%');







var isDigit$2 = regexTester(/^[0-9]$/);

var $charAt$2 = callBound('String.prototype.charAt');
var $strSlice$6 = callBound('String.prototype.slice');





var canDistinguishSparseFromUndefined$2 = 0 in [undefined]; // IE 6 - 8 have a bug where this returns false

var isStringOrHole$2 = function (capture, index, arr) {
	return Type$3(capture) === 'String' || (canDistinguishSparseFromUndefined$2 ? !(index in arr) : Type$3(capture) === 'Undefined');
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-getsubstitution

// eslint-disable-next-line max-statements, max-params, max-lines-per-function
var GetSubstitution$2 = function GetSubstitution(matched, str, position, captures, replacement) {
	if (Type$3(matched) !== 'String') {
		throw new $TypeError$23('Assertion failed: `matched` must be a String');
	}
	var matchLength = matched.length;

	if (Type$3(str) !== 'String') {
		throw new $TypeError$23('Assertion failed: `str` must be a String');
	}
	var stringLength = str.length;

	if (!IsInteger$2(position) || position < 0 || position > stringLength) {
		throw new $TypeError$23('Assertion failed: `position` must be a nonnegative integer, and less than or equal to the length of `string`, got ' + objectInspect(position));
	}

	if (!IsArray$2(captures) || !every(captures, isStringOrHole$2)) {
		throw new $TypeError$23('Assertion failed: `captures` must be a List of Strings, got ' + objectInspect(captures));
	}

	if (Type$3(replacement) !== 'String') {
		throw new $TypeError$23('Assertion failed: `replacement` must be a String');
	}

	var tailPos = position + matchLength;
	var m = captures.length;

	var result = '';
	for (var i = 0; i < replacement.length; i += 1) {
		// if this is a $, and it's not the end of the replacement
		var current = $charAt$2(replacement, i);
		var isLast = (i + 1) >= replacement.length;
		var nextIsLast = (i + 2) >= replacement.length;
		if (current === '$' && !isLast) {
			var next = $charAt$2(replacement, i + 1);
			if (next === '$') {
				result += '$';
				i += 1;
			} else if (next === '&') {
				result += matched;
				i += 1;
			} else if (next === '`') {
				result += position === 0 ? '' : $strSlice$6(str, 0, position - 1);
				i += 1;
			} else if (next === "'") {
				result += tailPos >= stringLength ? '' : $strSlice$6(str, tailPos);
				i += 1;
			} else {
				var nextNext = nextIsLast ? null : $charAt$2(replacement, i + 2);
				if (isDigit$2(next) && next !== '0' && (nextIsLast || !isDigit$2(nextNext))) {
					// $1 through $9, and not followed by a digit
					var n = $parseInt$2(next, 10);
					// if (n > m, impl-defined)
					result += (n <= m && Type$3(captures[n - 1]) === 'Undefined') ? '' : captures[n - 1];
					i += 1;
				} else if (isDigit$2(next) && (nextIsLast || isDigit$2(nextNext))) {
					// $00 through $99
					var nn = next + nextNext;
					var nnI = $parseInt$2(nn, 10) - 1;
					// if nn === '00' or nn > m, impl-defined
					result += (nn <= m && Type$3(captures[nnI]) === 'Undefined') ? '' : captures[nnI];
					i += 2;
				} else {
					result += '$';
				}
			}
		} else {
			// the final $, or else not a $
			result += $charAt$2(replacement, i);
		}
	}
	return result;
};

var $TypeError$24 = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-hasownproperty

var HasOwnProperty$2 = function HasOwnProperty(O, P) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$24('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$24('Assertion failed: `P` must be a Property Key');
	}
	return src(O, P);
};

var $TypeError$25 = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-hasproperty

var HasProperty$2 = function HasProperty(O, P) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$25('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$25('Assertion failed: `P` must be a Property Key');
	}
	return P in O;
};

var $floor$w = GetIntrinsic('%Math.floor%');



var msPerHour$7 = timeConstants.msPerHour;
var HoursPerDay$4 = timeConstants.HoursPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var HourFromTime$3 = function HourFromTime(t) {
	return mod($floor$w(t / msPerHour$7), HoursPerDay$4);
};

var $TypeError$26 = GetIntrinsic('%TypeError%');





// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasinstance

var OrdinaryHasInstance$2 = function OrdinaryHasInstance(C, O) {
	if (IsCallable$3(C) === false) {
		return false;
	}
	if (Type$3(O) !== 'Object') {
		return false;
	}
	var P = Get$2(C, 'prototype');
	if (Type$3(P) !== 'Object') {
		throw new $TypeError$26('OrdinaryHasInstance called on an object with an invalid prototype property.');
	}
	return O instanceof C;
};

var $TypeError$27 = GetIntrinsic('%TypeError%');

var $hasInstance$2 = GetIntrinsic('Symbol.hasInstance', true);








// https://www.ecma-international.org/ecma-262/6.0/#sec-instanceofoperator

var InstanceofOperator$2 = function InstanceofOperator(O, C) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$27('Assertion failed: Type(O) is not Object');
	}
	var instOfHandler = $hasInstance$2 ? GetMethod$3(C, $hasInstance$2) : void 0;
	if (typeof instOfHandler !== 'undefined') {
		return ToBoolean$3(Call$2(instOfHandler, C, [O]));
	}
	if (!IsCallable$3(C)) {
		throw new $TypeError$27('`C` is not Callable');
	}
	return OrdinaryHasInstance$2(C, O);
};

var $TypeError$28 = GetIntrinsic('%TypeError%');

var $arraySlice$2 = callBound('Array.prototype.slice');





// https://ecma-international.org/ecma-262/6.0/#sec-invoke

var Invoke$2 = function Invoke(O, P) {
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$28('P must be a Property Key');
	}
	var argumentsList = $arraySlice$2(arguments, 2);
	var func = GetV$2(O, P);
	return Call$2(func, O, argumentsList);
};

var $isConcatSpreadable$2 = GetIntrinsic('%Symbol.isConcatSpreadable%', true);






// https://ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable

var IsConcatSpreadable$2 = function IsConcatSpreadable(O) {
	if (Type$3(O) !== 'Object') {
		return false;
	}
	if ($isConcatSpreadable$2) {
		var spreadable = Get$2(O, $isConcatSpreadable$2);
		if (typeof spreadable !== 'undefined') {
			return ToBoolean$3(spreadable);
		}
	}
	return IsArray$2(O);
};

var $PromiseThen$2 = callBound('Promise.prototype.then', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-ispromise

var IsPromise$2 = function IsPromise(x) {
	if (Type$3(x) !== 'Object') {
		return false;
	}
	if (!$PromiseThen$2) { // Promises are not supported
		return false;
	}
	try {
		$PromiseThen$2(x); // throws if not a promise
	} catch (e) {
		return false;
	}
	return true;
};

// https://ecma-international.org/ecma-262/6.0/#sec-property-descriptor-specification-type

var IsPropertyDescriptor$3 = function IsPropertyDescriptor(Desc) {
	return isPropertyDescriptor({
		IsDataDescriptor: IsDataDescriptor$3,
		IsAccessorDescriptor: IsAccessorDescriptor$3,
		Type: Type$3
	}, Desc);
};

var $TypeError$29 = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-iteratorcomplete

var IteratorComplete$2 = function IteratorComplete(iterResult) {
	if (Type$3(iterResult) !== 'Object') {
		throw new $TypeError$29('Assertion failed: Type(iterResult) is not Object');
	}
	return ToBoolean$3(Get$2(iterResult, 'done'));
};

var $TypeError$2a = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratornext

var IteratorNext$2 = function IteratorNext(iterator, value) {
	var result = Invoke$2(iterator, 'next', arguments.length < 2 ? [] : [value]);
	if (Type$3(result) !== 'Object') {
		throw new $TypeError$2a('iterator next must return an object');
	}
	return result;
};

// https://ecma-international.org/ecma-262/6.0/#sec-iteratorstep

var IteratorStep$2 = function IteratorStep(iterator) {
	var result = IteratorNext$2(iterator);
	var done = IteratorComplete$2(result);
	return done === true ? false : result;
};

var $TypeError$2b = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratorvalue

var IteratorValue$2 = function IteratorValue(iterResult) {
	if (Type$3(iterResult) !== 'Object') {
		throw new $TypeError$2b('Assertion failed: Type(iterResult) is not Object');
	}
	return Get$2(iterResult, 'value');
};

var $arrayPush$1 = callBound('Array.prototype.push');





// https://www.ecma-international.org/ecma-262/8.0/#sec-iterabletolist

var IterableToList = function IterableToList(items, method) {
	var iterator = GetIterator$2(items, method);
	var values = [];
	var next = true;
	while (next) {
		next = IteratorStep$2(iterator);
		if (next) {
			var nextValue = IteratorValue$2(next);
			$arrayPush$1(values, nextValue);
		}
	}
	return values;
};

var $TypeError$2c = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-iteratorclose

var IteratorClose$2 = function IteratorClose(iterator, completion) {
	if (Type$3(iterator) !== 'Object') {
		throw new $TypeError$2c('Assertion failed: Type(iterator) is not Object');
	}
	if (!IsCallable$3(completion)) {
		throw new $TypeError$2c('Assertion failed: completion is not a thunk for a Completion Record');
	}
	var completionThunk = completion;

	var iteratorReturn = GetMethod$3(iterator, 'return');

	if (typeof iteratorReturn === 'undefined') {
		return completionThunk();
	}

	var completionRecord;
	try {
		var innerResult = Call$2(iteratorReturn, iterator, []);
	} catch (e) {
		// if we hit here, then "e" is the innerResult completion that needs re-throwing

		// if the completion is of type "throw", this will throw.
		completionThunk();
		completionThunk = null; // ensure it's not called twice.

		// if not, then return the innerResult completion
		throw e;
	}
	completionRecord = completionThunk(); // if innerResult worked, then throw if the completion does
	completionThunk = null; // ensure it's not called twice.

	if (Type$3(innerResult) !== 'Object') {
		throw new $TypeError$2c('iterator .return must return an object');
	}

	return completionRecord;
};

var msPerDay$e = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.13

var MakeDate$3 = function MakeDate(day, time) {
	if (!_isFinite(day) || !_isFinite(time)) {
		return NaN;
	}
	return (day * msPerDay$e) + time;
};

var $floor$x = GetIntrinsic('%Math.floor%');
var $DateUTC$3 = GetIntrinsic('%Date.UTC%');










// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.12

var MakeDay$3 = function MakeDay(year, month, date) {
	if (!_isFinite(year) || !_isFinite(month) || !_isFinite(date)) {
		return NaN;
	}
	var y = ToInteger$3(year);
	var m = ToInteger$3(month);
	var dt = ToInteger$3(date);
	var ym = y + $floor$x(m / 12);
	var mn = mod(m, 12);
	var t = $DateUTC$3(ym, mn, 1);
	if (YearFromTime$3(t) !== ym || MonthFromTime$3(t) !== mn || DateFromTime$3(t) !== 1) {
		return NaN;
	}
	return Day$3(t) + dt - 1;
};

var msPerSecond$a = timeConstants.msPerSecond;
var msPerMinute$7 = timeConstants.msPerMinute;
var msPerHour$8 = timeConstants.msPerHour;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.11

var MakeTime$3 = function MakeTime(hour, min, sec, ms) {
	if (!_isFinite(hour) || !_isFinite(min) || !_isFinite(sec) || !_isFinite(ms)) {
		return NaN;
	}
	var h = ToInteger$3(hour);
	var m = ToInteger$3(min);
	var s = ToInteger$3(sec);
	var milli = ToInteger$3(ms);
	var t = (h * msPerHour$8) + (m * msPerMinute$7) + (s * msPerSecond$a) + milli;
	return t;
};

var $floor$y = GetIntrinsic('%Math.floor%');



var msPerMinute$8 = timeConstants.msPerMinute;
var MinutesPerHour$4 = timeConstants.MinutesPerHour;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var MinFromTime$3 = function MinFromTime(t) {
	return mod($floor$y(t / msPerMinute$8), MinutesPerHour$4);
};

// https://ecma-international.org/ecma-262/5.1/#sec-5.2

var modulo$3 = function modulo(x, y) {
	return mod(x, y);
};

var msPerSecond$b = timeConstants.msPerSecond;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var msFromTime$3 = function msFromTime(t) {
	return mod(t, msPerSecond$b);
};

var $ObjectCreate$2 = GetIntrinsic('%Object.create%', true);
var $TypeError$2d = GetIntrinsic('%TypeError%');
var $SyntaxError$c = GetIntrinsic('%SyntaxError%');



var hasProto$2 = !({ __proto__: null } instanceof Object);

// https://www.ecma-international.org/ecma-262/6.0/#sec-objectcreate

var ObjectCreate$2 = function ObjectCreate(proto, internalSlotsList) {
	if (proto !== null && Type$3(proto) !== 'Object') {
		throw new $TypeError$2d('Assertion failed: `proto` must be null or an object');
	}
	var slots = arguments.length < 2 ? [] : internalSlotsList;
	if (slots.length > 0) {
		throw new $SyntaxError$c('es-abstract does not yet support internal slots');
	}

	if ($ObjectCreate$2) {
		return $ObjectCreate$2(proto);
	}
	if (hasProto$2) {
		return { __proto__: proto };
	}

	if (proto === null) {
		throw new $SyntaxError$c('native Object.create support is required to create null objects');
	}
	var T = function T() {};
	T.prototype = proto;
	return new T();
};

var $TypeError$2e = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/7.0/#sec-ordinarygetprototypeof

var OrdinaryGetPrototypeOf$1 = function OrdinaryGetPrototypeOf(O) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$2e('Assertion failed: O must be an Object');
	}
	if (!getProto$1) {
		throw new $TypeError$2e('This environment does not support fetching prototypes.');
	}
	return getProto$1(O);
};

var $TypeError$2f = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/7.0/#sec-ordinarysetprototypeof

var OrdinarySetPrototypeOf$1 = function OrdinarySetPrototypeOf(O, V) {
	if (Type$3(V) !== 'Object' && Type$3(V) !== 'Null') {
		throw new $TypeError$2f('Assertion failed: V must be Object or Null');
	}
	/*
    var extensible = IsExtensible(O);
    var current = OrdinaryGetPrototypeOf(O);
    if (SameValue(V, current)) {
        return true;
    }
    if (!extensible) {
        return false;
    }
    */
	try {
		setProto(O, V);
	} catch (e) {
		return false;
	}
	return OrdinaryGetPrototypeOf$1(O) === V;
	/*
    var p = V;
    var done = false;
    while (!done) {
        if (p === null) {
            done = true;
        } else if (SameValue(p, O)) {
            return false;
        } else {
            if (wat) {
                done = true;
            } else {
                p = p.[[Prototype]];
            }
        }
     }
     O.[[Prototype]] = V;
     return true;
     */
};

var $TypeError$2g = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasproperty

var OrdinaryHasProperty$2 = function OrdinaryHasProperty(O, P) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$2g('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$2g('Assertion failed: P must be a Property Key');
	}
	return P in O;
};

var $TypeError$2h = GetIntrinsic('%TypeError%');

var regexExec$3 = callBound('RegExp.prototype.exec');






// https://ecma-international.org/ecma-262/6.0/#sec-regexpexec

var RegExpExec$2 = function RegExpExec(R, S) {
	if (Type$3(R) !== 'Object') {
		throw new $TypeError$2h('Assertion failed: `R` must be an Object');
	}
	if (Type$3(S) !== 'String') {
		throw new $TypeError$2h('Assertion failed: `S` must be a String');
	}
	var exec = Get$2(R, 'exec');
	if (IsCallable$3(exec)) {
		var result = Call$2(exec, R, [S]);
		if (result === null || Type$3(result) === 'Object') {
			return result;
		}
		throw new $TypeError$2h('"exec" method must return `null` or an Object');
	}
	return regexExec$3(R, S);
};

var $TypeError$2i = GetIntrinsic('%TypeError%');



// https://www.ecma-international.org/ecma-262/7.0/#sec-samevaluenonnumber

var SameValueNonNumber$1 = function SameValueNonNumber(x, y) {
	if (typeof x === 'number' || typeof x !== typeof y) {
		throw new $TypeError$2i('SameValueNonNumber requires two non-number values of the same type.');
	}
	return SameValue$3(x, y);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-samevaluezero

var SameValueZero$2 = function SameValueZero(x, y) {
	return (x === y) || (_isNaN(x) && _isNaN(y));
};

var $floor$z = GetIntrinsic('%Math.floor%');



var msPerSecond$c = timeConstants.msPerSecond;
var SecondsPerMinute$4 = timeConstants.SecondsPerMinute;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var SecFromTime$3 = function SecFromTime(t) {
	return mod($floor$z(t / msPerSecond$c), SecondsPerMinute$4);
};

var $TypeError$2j = GetIntrinsic('%TypeError%');





// IE 9 does not throw in strict mode when writability/configurability/extensibility is violated
var noThrowOnStrictViolation$2 = (function () {
	try {
		delete [].length;
		return true;
	} catch (e) {
		return false;
	}
}());

// https://ecma-international.org/ecma-262/6.0/#sec-set-o-p-v-throw

var _Set$2 = function Set(O, P, V, Throw) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$2j('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$2(P)) {
		throw new $TypeError$2j('Assertion failed: `P` must be a Property Key');
	}
	if (Type$3(Throw) !== 'Boolean') {
		throw new $TypeError$2j('Assertion failed: `Throw` must be a Boolean');
	}
	if (Throw) {
		O[P] = V; // eslint-disable-line no-param-reassign
		if (noThrowOnStrictViolation$2 && !SameValue$3(O[P], V)) {
			throw new $TypeError$2j('Attempted to assign to readonly property.');
		}
		return true;
	} else {
		try {
			O[P] = V; // eslint-disable-line no-param-reassign
			return noThrowOnStrictViolation$2 ? SameValue$3(O[P], V) : true;
		} catch (e) {
			return false;
		}
	}
};

var $TypeError$2k = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-setfunctionname

var SetFunctionName$2 = function SetFunctionName(F, name) {
	if (typeof F !== 'function') {
		throw new $TypeError$2k('Assertion failed: `F` must be a function');
	}
	if (!IsExtensible$2(F) || src(F, 'name')) {
		throw new $TypeError$2k('Assertion failed: `F` must be extensible, and must not have a `name` own property');
	}
	var nameType = Type$3(name);
	if (nameType !== 'Symbol' && nameType !== 'String') {
		throw new $TypeError$2k('Assertion failed: `name` must be a Symbol or a String');
	}
	if (nameType === 'Symbol') {
		var description = getSymbolDescription(name);
		// eslint-disable-next-line no-param-reassign
		name = typeof description === 'undefined' ? '' : '[' + description + ']';
	}
	if (arguments.length > 2) {
		var prefix = arguments[2];
		// eslint-disable-next-line no-param-reassign
		name = prefix + ' ' + name;
	}
	return DefinePropertyOrThrow$2(F, 'name', {
		'[[Value]]': name,
		'[[Writable]]': false,
		'[[Enumerable]]': false,
		'[[Configurable]]': true
	});
};

var $SyntaxError$d = GetIntrinsic('%SyntaxError%');
var $TypeError$2l = GetIntrinsic('%TypeError%');
var $preventExtensions$5 = GetIntrinsic('%Object.preventExtensions%');

var $gOPN$7 = GetIntrinsic('%Object.getOwnPropertyNames%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-setintegritylevel

var SetIntegrityLevel$2 = function SetIntegrityLevel(O, level) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$2l('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$2l('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	if (!$preventExtensions$5) {
		throw new $SyntaxError$d('SetIntegrityLevel requires native `Object.preventExtensions` support');
	}
	var status = $preventExtensions$5(O);
	if (!status) {
		return false;
	}
	if (!$gOPN$7) {
		throw new $SyntaxError$d('SetIntegrityLevel requires native `Object.getOwnPropertyNames` support');
	}
	var theKeys = $gOPN$7(O);
	if (level === 'sealed') {
		forEach(theKeys, function (k) {
			DefinePropertyOrThrow$2(O, k, { configurable: false });
		});
	} else if (level === 'frozen') {
		forEach(theKeys, function (k) {
			var currentDesc = getOwnPropertyDescriptor(O, k);
			if (typeof currentDesc !== 'undefined') {
				var desc;
				if (IsAccessorDescriptor$3(ToPropertyDescriptor$3(currentDesc))) {
					desc = { configurable: false };
				} else {
					desc = { configurable: false, writable: false };
				}
				DefinePropertyOrThrow$2(O, k, desc);
			}
		});
	}
	return true;
};

var $species$5 = GetIntrinsic('%Symbol.species%', true);
var $TypeError$2m = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-speciesconstructor

var SpeciesConstructor$2 = function SpeciesConstructor(O, defaultConstructor) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$2m('Assertion failed: Type(O) is not Object');
	}
	var C = O.constructor;
	if (typeof C === 'undefined') {
		return defaultConstructor;
	}
	if (Type$3(C) !== 'Object') {
		throw new $TypeError$2m('O.constructor is not an Object');
	}
	var S = $species$5 ? C[$species$5] : void 0;
	if (S == null) {
		return defaultConstructor;
	}
	if (IsConstructor$2(S)) {
		return S;
	}
	throw new $TypeError$2m('no constructor found');
};

var $TypeError$2n = GetIntrinsic('%TypeError%');



var $SymbolToString$2 = callBound('Symbol.prototype.toString', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-symboldescriptivestring

var SymbolDescriptiveString$2 = function SymbolDescriptiveString(sym) {
	if (Type$3(sym) !== 'Symbol') {
		throw new $TypeError$2n('Assertion failed: `sym` must be a Symbol');
	}
	return $SymbolToString$2(sym);
};

var $gOPN$8 = GetIntrinsic('%Object.getOwnPropertyNames%');
var $TypeError$2o = GetIntrinsic('%TypeError%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-testintegritylevel

var TestIntegrityLevel$2 = function TestIntegrityLevel(O, level) {
	if (Type$3(O) !== 'Object') {
		throw new $TypeError$2o('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$2o('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	var status = IsExtensible$2(O);
	if (status) {
		return false;
	}
	var theKeys = $gOPN$8(O);
	return theKeys.length === 0 || every(theKeys, function (k) {
		var currentDesc = getOwnPropertyDescriptor(O, k);
		if (typeof currentDesc !== 'undefined') {
			if (currentDesc.configurable) {
				return false;
			}
			if (level === 'frozen' && IsDataDescriptor$3(ToPropertyDescriptor$3(currentDesc)) && currentDesc.writable) {
				return false;
			}
		}
		return true;
	});
};

var $BooleanValueOf$2 = callBound('Boolean.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-boolean-prototype-object

var thisBooleanValue$2 = function thisBooleanValue(value) {
	if (Type$3(value) === 'Boolean') {
		return value;
	}

	return $BooleanValueOf$2(value);
};

var $NumberValueOf$2 = callBound('Number.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-number-prototype-object

var thisNumberValue$2 = function thisNumberValue(value) {
	if (Type$3(value) === 'Number') {
		return value;
	}

	return $NumberValueOf$2(value);
};

var $StringValueOf$2 = callBound('String.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-string-prototype-object

var thisStringValue$2 = function thisStringValue(value) {
	if (Type$3(value) === 'String') {
		return value;
	}

	return $StringValueOf$2(value);
};

var $DateValueOf$2 = callBound('Date.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-date-prototype-object

var thisTimeValue$2 = function thisTimeValue(value) {
	return $DateValueOf$2(value);
};

var $Date$9 = GetIntrinsic('%Date%');
var $Number$b = GetIntrinsic('%Number%');
var $abs$c = GetIntrinsic('%Math.abs%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.14

var TimeClip$3 = function TimeClip(time) {
	if (!_isFinite(time) || $abs$c(time) > 8.64e15) {
		return NaN;
	}
	return $Number$b(new $Date$9(ToNumber$3(time)));
};

var msPerDay$f = timeConstants.msPerDay;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var TimeFromYear$3 = function TimeFromYear(y) {
	return msPerDay$f * DayFromYear$3(y);
};

var msPerDay$g = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var TimeWithinDay$3 = function TimeWithinDay(t) {
	return mod(t, msPerDay$g);
};

var $TypeError$2p = GetIntrinsic('%TypeError%');
var $Date$a = GetIntrinsic('%Date%');





// https://ecma-international.org/ecma-262/6.0/#sec-todatestring

var ToDateString$2 = function ToDateString(tv) {
	if (Type$3(tv) !== 'Number') {
		throw new $TypeError$2p('Assertion failed: `tv` must be a Number');
	}
	if (_isNaN(tv)) {
		return 'Invalid Date';
	}
	return $Date$a(tv);
};

var $RangeError$6 = GetIntrinsic('%RangeError%');





// https://www.ecma-international.org/ecma-262/8.0/#sec-toindex

var ToIndex = function ToIndex(value) {
	if (typeof value === 'undefined') {
		return 0;
	}
	var integerIndex = ToInteger$3(value);
	if (integerIndex < 0) {
		throw new $RangeError$6('index must be >= 0');
	}
	var index = ToLength$2(integerIndex);
	if (!SameValueZero$2(integerIndex, index)) {
		throw new $RangeError$6('index must be >= 0 and < 2 ** 53 - 1');
	}
	return index;
};

var $Math$c = GetIntrinsic('%Math%');








var $floor$A = $Math$c.floor;
var $abs$d = $Math$c.abs;

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.7

var ToUint16$3 = function ToUint16(value) {
	var number = ToNumber$3(value);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$A($abs$d(number));
	return mod(posInt, 0x10000);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint16

var ToInt16$2 = function ToInt16(argument) {
	var int16bit = ToUint16$3(argument);
	return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.5

var ToInt32$3 = function ToInt32(x) {
	return ToNumber$3(x) >> 0;
};

var $Math$d = GetIntrinsic('%Math%');








var $floor$B = $Math$d.floor;
var $abs$e = $Math$d.abs;

var ToUint8$2 = function ToUint8(argument) {
	var number = ToNumber$3(argument);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$B($abs$e(number));
	return mod(posInt, 0x100);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint8

var ToInt8$2 = function ToInt8(argument) {
	var int8bit = ToUint8$2(argument);
	return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
};

var $String$6 = GetIntrinsic('%String%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-topropertykey

var ToPropertyKey$2 = function ToPropertyKey(argument) {
	var key = ToPrimitive$3(argument, $String$6);
	return typeof key === 'symbol' ? key : ToString$3(key);
};

var $Math$e = GetIntrinsic('%Math%');





var $floor$C = $Math$e.floor;

// https://www.ecma-international.org/ecma-262/6.0/#sec-touint8clamp

var ToUint8Clamp$2 = function ToUint8Clamp(argument) {
	var number = ToNumber$3(argument);
	if (_isNaN(number) || number <= 0) { return 0; }
	if (number >= 0xFF) { return 0xFF; }
	var f = $floor$C(argument);
	if (f + 0.5 < number) { return f + 1; }
	if (number < f + 0.5) { return f; }
	if (f % 2 !== 0) { return f + 1; }
	return f;
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.6

var WeekDay$3 = function WeekDay(t) {
	return mod(Day$3(t) + 4, 7);
};

/* eslint global-require: 0 */
// https://www.ecma-international.org/ecma-262/8.0/#sec-abstract-operations
var ES2017 = {
	'Abstract Equality Comparison': AbstractEqualityComparison$3,
	'Abstract Relational Comparison': AbstractRelationalComparison$3,
	'Strict Equality Comparison': StrictEqualityComparison$3,
	AdvanceStringIndex: AdvanceStringIndex$2,
	ArrayCreate: ArrayCreate$2,
	ArraySetLength: ArraySetLength$2,
	ArraySpeciesCreate: ArraySpeciesCreate$2,
	Call: Call$2,
	CanonicalNumericIndexString: CanonicalNumericIndexString$2,
	CompletePropertyDescriptor: CompletePropertyDescriptor$2,
	CreateDataProperty: CreateDataProperty$2,
	CreateDataPropertyOrThrow: CreateDataPropertyOrThrow$2,
	CreateHTML: CreateHTML$2,
	CreateIterResultObject: CreateIterResultObject$2,
	CreateListFromArrayLike: CreateListFromArrayLike$2,
	CreateMethodProperty: CreateMethodProperty$2,
	DateFromTime: DateFromTime$3,
	Day: Day$3,
	DayFromYear: DayFromYear$3,
	DaysInYear: DaysInYear$3,
	DayWithinYear: DayWithinYear$3,
	DefinePropertyOrThrow: DefinePropertyOrThrow$2,
	DeletePropertyOrThrow: DeletePropertyOrThrow$2,
	EnumerableOwnProperties: EnumerableOwnProperties,
	FromPropertyDescriptor: FromPropertyDescriptor$3,
	Get: Get$2,
	GetIterator: GetIterator$2,
	GetMethod: GetMethod$3,
	GetOwnPropertyKeys: GetOwnPropertyKeys$2,
	GetPrototypeFromConstructor: GetPrototypeFromConstructor$2,
	GetSubstitution: GetSubstitution$2,
	GetV: GetV$2,
	HasOwnProperty: HasOwnProperty$2,
	HasProperty: HasProperty$2,
	HourFromTime: HourFromTime$3,
	InLeapYear: InLeapYear$3,
	InstanceofOperator: InstanceofOperator$2,
	Invoke: Invoke$2,
	IsAccessorDescriptor: IsAccessorDescriptor$3,
	IsArray: IsArray$2,
	IsCallable: IsCallable$3,
	IsConcatSpreadable: IsConcatSpreadable$2,
	IsConstructor: IsConstructor$2,
	IsDataDescriptor: IsDataDescriptor$3,
	IsExtensible: IsExtensible$2,
	IsGenericDescriptor: IsGenericDescriptor$3,
	IsInteger: IsInteger$2,
	IsPromise: IsPromise$2,
	IsPropertyDescriptor: IsPropertyDescriptor$3,
	IsPropertyKey: IsPropertyKey$2,
	IsRegExp: IsRegExp$2,
	IterableToList: IterableToList,
	IteratorClose: IteratorClose$2,
	IteratorComplete: IteratorComplete$2,
	IteratorNext: IteratorNext$2,
	IteratorStep: IteratorStep$2,
	IteratorValue: IteratorValue$2,
	MakeDate: MakeDate$3,
	MakeDay: MakeDay$3,
	MakeTime: MakeTime$3,
	MinFromTime: MinFromTime$3,
	modulo: modulo$3,
	MonthFromTime: MonthFromTime$3,
	msFromTime: msFromTime$3,
	ObjectCreate: ObjectCreate$2,
	OrdinaryDefineOwnProperty: OrdinaryDefineOwnProperty$2,
	OrdinaryGetOwnProperty: OrdinaryGetOwnProperty$2,
	OrdinarySetPrototypeOf: OrdinarySetPrototypeOf$1,
	OrdinaryGetPrototypeOf: OrdinaryGetPrototypeOf$1,
	OrdinaryHasInstance: OrdinaryHasInstance$2,
	OrdinaryHasProperty: OrdinaryHasProperty$2,
	RegExpExec: RegExpExec$2,
	RequireObjectCoercible: RequireObjectCoercible$2,
	SameValue: SameValue$3,
	SameValueNonNumber: SameValueNonNumber$1,
	SameValueZero: SameValueZero$2,
	SecFromTime: SecFromTime$3,
	Set: _Set$2,
	SetFunctionName: SetFunctionName$2,
	SetIntegrityLevel: SetIntegrityLevel$2,
	SpeciesConstructor: SpeciesConstructor$2,
	SymbolDescriptiveString: SymbolDescriptiveString$2,
	TestIntegrityLevel: TestIntegrityLevel$2,
	thisBooleanValue: thisBooleanValue$2,
	thisNumberValue: thisNumberValue$2,
	thisStringValue: thisStringValue$2,
	thisTimeValue: thisTimeValue$2,
	TimeClip: TimeClip$3,
	TimeFromYear: TimeFromYear$3,
	TimeWithinDay: TimeWithinDay$3,
	ToBoolean: ToBoolean$3,
	ToDateString: ToDateString$2,
	ToIndex: ToIndex,
	ToInt16: ToInt16$2,
	ToInt32: ToInt32$3,
	ToInt8: ToInt8$2,
	ToInteger: ToInteger$3,
	ToLength: ToLength$2,
	ToNumber: ToNumber$3,
	ToObject: ToObject$3,
	ToPrimitive: ToPrimitive$3,
	ToPropertyDescriptor: ToPropertyDescriptor$3,
	ToPropertyKey: ToPropertyKey$2,
	ToString: ToString$3,
	ToUint16: ToUint16$3,
	ToUint32: ToUint32$3,
	ToUint8: ToUint8$2,
	ToUint8Clamp: ToUint8Clamp$2,
	Type: Type$3,
	ValidateAndApplyPropertyDescriptor: ValidateAndApplyPropertyDescriptor$2,
	WeekDay: WeekDay$3,
	YearFromTime: YearFromTime$3
};

var es2017 = ES2017;

// https://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive

var ToPrimitive$4 = function ToPrimitive(input) {
	if (arguments.length > 1) {
		return es2015(input, arguments[1]);
	}
	return es2015(input);
};

var $TypeError$2q = GetIntrinsic('%TypeError%');
var $Number$c = GetIntrinsic('%Number%');
var $RegExp$3 = GetIntrinsic('%RegExp%');
var $parseInteger$3 = GetIntrinsic('%parseInt%');





var $strSlice$7 = callBound('String.prototype.slice');
var isBinary$3 = regexTester(/^0b[01]+$/i);
var isOctal$3 = regexTester(/^0o[0-7]+$/i);
var isInvalidHexLiteral$3 = regexTester(/^[-+]0x[0-9a-f]+$/i);
var nonWS$3 = ['\u0085', '\u200b', '\ufffe'].join('');
var nonWSregex$3 = new $RegExp$3('[' + nonWS$3 + ']', 'g');
var hasNonWS$3 = regexTester(nonWSregex$3);

// whitespace from: https://es5.github.io/#x15.5.4.20
// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
var ws$3 = [
	'\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003',
	'\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028',
	'\u2029\uFEFF'
].join('');
var trimRegex$3 = new RegExp('(^[' + ws$3 + ']+)|([' + ws$3 + ']+$)', 'g');
var $replace$7 = callBound('String.prototype.replace');
var $trim$3 = function (value) {
	return $replace$7(value, trimRegex$3, '');
};



// https://www.ecma-international.org/ecma-262/6.0/#sec-tonumber

var ToNumber$4 = function ToNumber(argument) {
	var value = isPrimitive$1(argument) ? argument : ToPrimitive$4(argument, $Number$c);
	if (typeof value === 'symbol') {
		throw new $TypeError$2q('Cannot convert a Symbol value to a number');
	}
	if (typeof value === 'string') {
		if (isBinary$3(value)) {
			return ToNumber($parseInteger$3($strSlice$7(value, 2), 2));
		} else if (isOctal$3(value)) {
			return ToNumber($parseInteger$3($strSlice$7(value, 2), 8));
		} else if (hasNonWS$3(value) || isInvalidHexLiteral$3(value)) {
			return NaN;
		} else {
			var trimmed = $trim$3(value);
			if (trimmed !== value) {
				return ToNumber(trimmed);
			}
		}
	}
	return $Number$c(value);
};

// https://ecma-international.org/ecma-262/6.0/#sec-ecmascript-data-types-and-values

var Type$4 = function Type$1(x) {
	if (typeof x === 'symbol') {
		return 'Symbol';
	}
	return Type(x);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-abstract-equality-comparison

var AbstractEqualityComparison$4 = function AbstractEqualityComparison(x, y) {
	var xType = Type$4(x);
	var yType = Type$4(y);
	if (xType === yType) {
		return x === y; // ES6+ specified this shortcut anyways.
	}
	if (x == null && y == null) {
		return true;
	}
	if (xType === 'Number' && yType === 'String') {
		return AbstractEqualityComparison(x, ToNumber$4(y));
	}
	if (xType === 'String' && yType === 'Number') {
		return AbstractEqualityComparison(ToNumber$4(x), y);
	}
	if (xType === 'Boolean') {
		return AbstractEqualityComparison(ToNumber$4(x), y);
	}
	if (yType === 'Boolean') {
		return AbstractEqualityComparison(x, ToNumber$4(y));
	}
	if ((xType === 'String' || xType === 'Number' || xType === 'Symbol') && yType === 'Object') {
		return AbstractEqualityComparison(x, ToPrimitive$4(y));
	}
	if (xType === 'Object' && (yType === 'String' || yType === 'Number' || yType === 'Symbol')) {
		return AbstractEqualityComparison(ToPrimitive$4(x), y);
	}
	return false;
};

var $Number$d = GetIntrinsic('%Number%');
var $TypeError$2r = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/5.1/#sec-11.8.5

// eslint-disable-next-line max-statements
var AbstractRelationalComparison$4 = function AbstractRelationalComparison(x, y, LeftFirst) {
	if (Type$4(LeftFirst) !== 'Boolean') {
		throw new $TypeError$2r('Assertion failed: LeftFirst argument must be a Boolean');
	}
	var px;
	var py;
	if (LeftFirst) {
		px = ToPrimitive$4(x, $Number$d);
		py = ToPrimitive$4(y, $Number$d);
	} else {
		py = ToPrimitive$4(y, $Number$d);
		px = ToPrimitive$4(x, $Number$d);
	}
	var bothStrings = Type$4(px) === 'String' && Type$4(py) === 'String';
	if (!bothStrings) {
		var nx = ToNumber$4(px);
		var ny = ToNumber$4(py);
		if (_isNaN(nx) || _isNaN(ny)) {
			return undefined;
		}
		if (_isFinite(nx) && _isFinite(ny) && nx === ny) {
			return false;
		}
		if (nx === 0 && ny === 0) {
			return false;
		}
		if (nx === Infinity) {
			return false;
		}
		if (ny === Infinity) {
			return true;
		}
		if (ny === -Infinity) {
			return false;
		}
		if (nx === -Infinity) {
			return true;
		}
		return nx < ny; // by now, these are both nonzero, finite, and not equal
	}
	if (isPrefixOf(py, px)) {
		return false;
	}
	if (isPrefixOf(px, py)) {
		return true;
	}
	return px < py; // both strings, neither a prefix of the other. shortcut for steps c-f
};

// https://www.ecma-international.org/ecma-262/5.1/#sec-11.9.6

var StrictEqualityComparison$4 = function StrictEqualityComparison(x, y) {
	var xType = Type$4(x);
	var yType = Type$4(y);
	if (xType !== yType) {
		return false;
	}
	if (xType === 'Undefined' || xType === 'Null') {
		return true;
	}
	return x === y; // shortcut for steps 4-7
};

var $Math$f = GetIntrinsic('%Math%');

var $floor$D = $Math$f.floor;
var $abs$f = $Math$f.abs;




// https://www.ecma-international.org/ecma-262/6.0/#sec-isinteger

var IsInteger$3 = function IsInteger(argument) {
	if (typeof argument !== 'number' || _isNaN(argument) || !_isFinite(argument)) {
		return false;
	}
	var abs = $abs$f(argument);
	return $floor$D(abs) === abs;
};

var $TypeError$2s = GetIntrinsic('%TypeError%');

var $charCodeAt$3 = callBound('String.prototype.charCodeAt');

// https://ecma-international.org/ecma-262/6.0/#sec-advancestringindex

var AdvanceStringIndex$3 = function AdvanceStringIndex(S, index, unicode) {
	if (Type$4(S) !== 'String') {
		throw new $TypeError$2s('Assertion failed: `S` must be a String');
	}
	if (!IsInteger$3(index) || index < 0 || index > maxSafeInteger) {
		throw new $TypeError$2s('Assertion failed: `length` must be an integer >= 0 and <= 2**53');
	}
	if (Type$4(unicode) !== 'Boolean') {
		throw new $TypeError$2s('Assertion failed: `unicode` must be a Boolean');
	}
	if (!unicode) {
		return index + 1;
	}
	var length = S.length;
	if ((index + 1) >= length) {
		return index + 1;
	}

	var first = $charCodeAt$3(S, index);
	if (first < 0xD800 || first > 0xDBFF) {
		return index + 1;
	}

	var second = $charCodeAt$3(S, index + 1);
	if (second < 0xDC00 || second > 0xDFFF) {
		return index + 1;
	}

	return index + 2;
};

var $ArrayPrototype$3 = GetIntrinsic('%Array.prototype%');
var $RangeError$7 = GetIntrinsic('%RangeError%');
var $SyntaxError$e = GetIntrinsic('%SyntaxError%');
var $TypeError$2t = GetIntrinsic('%TypeError%');



var MAX_ARRAY_LENGTH$3 = Math.pow(2, 32) - 1;

var $setProto$3 = GetIntrinsic('%Object.setPrototypeOf%', true) || (
	// eslint-disable-next-line no-proto, no-negated-condition
	[].__proto__ !== $ArrayPrototype$3
		? null
		: function (O, proto) {
			O.__proto__ = proto; // eslint-disable-line no-proto, no-param-reassign
			return O;
		}
);

// https://www.ecma-international.org/ecma-262/6.0/#sec-arraycreate

var ArrayCreate$3 = function ArrayCreate(length) {
	if (!IsInteger$3(length) || length < 0) {
		throw new $TypeError$2t('Assertion failed: `length` must be an integer Number >= 0');
	}
	if (length > MAX_ARRAY_LENGTH$3) {
		throw new $RangeError$7('length is greater than (2**32 - 1)');
	}
	var proto = arguments.length > 1 ? arguments[1] : $ArrayPrototype$3;
	var A = []; // steps 5 - 7, and 9
	if (proto !== $ArrayPrototype$3) { // step 8
		if (!$setProto$3) {
			throw new $SyntaxError$e('ArrayCreate: a `proto` argument that is not `Array.prototype` is not supported in an environment that does not support setting the [[Prototype]]');
		}
		$setProto$3(A, proto);
	}
	if (length !== 0) { // bypasses the need for step 2
		A.length = length;
	}
	/* step 10, the above as a shortcut for the below
    OrdinaryDefineOwnProperty(A, 'length', {
        '[[Configurable]]': false,
        '[[Enumerable]]': false,
        '[[Value]]': length,
        '[[Writable]]': true
    });
    */
	return A;
};

var $Array$6 = GetIntrinsic('%Array%');

// eslint-disable-next-line global-require
var toStr$c = !$Array$6.isArray && callBound('Object.prototype.toString');

// https://www.ecma-international.org/ecma-262/6.0/#sec-isarray

var IsArray$3 = $Array$6.isArray || function IsArray(argument) {
	return toStr$c(argument) === '[object Array]';
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isaccessordescriptor

var IsAccessorDescriptor$4 = function IsAccessorDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$4, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Get]]') && !src(Desc, '[[Set]]')) {
		return false;
	}

	return true;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isdatadescriptor

var IsDataDescriptor$4 = function IsDataDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$4, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Value]]') && !src(Desc, '[[Writable]]')) {
		return false;
	}

	return true;
};

var $Object$7 = GetIntrinsic('%Object%');



var $preventExtensions$6 = $Object$7.preventExtensions;
var $isExtensible$3 = $Object$7.isExtensible;

// https://www.ecma-international.org/ecma-262/6.0/#sec-isextensible-o

var IsExtensible$3 = $preventExtensions$6
	? function IsExtensible(obj) {
		return !isPrimitive$1(obj) && $isExtensible$3(obj);
	}
	: function IsExtensible(obj) {
		return !isPrimitive$1(obj);
	};

// https://www.ecma-international.org/ecma-262/6.0/#sec-ispropertykey

var IsPropertyKey$3 = function IsPropertyKey(argument) {
	return typeof argument === 'string' || typeof argument === 'symbol';
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.2

var ToBoolean$4 = function ToBoolean(value) { return !!value; };

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.11

var IsCallable$4 = isCallable;

var $TypeError$2u = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/5.1/#sec-8.10.5

var ToPropertyDescriptor$4 = function ToPropertyDescriptor(Obj) {
	if (Type$4(Obj) !== 'Object') {
		throw new $TypeError$2u('ToPropertyDescriptor requires an object');
	}

	var desc = {};
	if (src(Obj, 'enumerable')) {
		desc['[[Enumerable]]'] = ToBoolean$4(Obj.enumerable);
	}
	if (src(Obj, 'configurable')) {
		desc['[[Configurable]]'] = ToBoolean$4(Obj.configurable);
	}
	if (src(Obj, 'value')) {
		desc['[[Value]]'] = Obj.value;
	}
	if (src(Obj, 'writable')) {
		desc['[[Writable]]'] = ToBoolean$4(Obj.writable);
	}
	if (src(Obj, 'get')) {
		var getter = Obj.get;
		if (typeof getter !== 'undefined' && !IsCallable$4(getter)) {
			throw new TypeError('getter must be a function');
		}
		desc['[[Get]]'] = getter;
	}
	if (src(Obj, 'set')) {
		var setter = Obj.set;
		if (typeof setter !== 'undefined' && !IsCallable$4(setter)) {
			throw new $TypeError$2u('setter must be a function');
		}
		desc['[[Set]]'] = setter;
	}

	if ((src(desc, '[[Get]]') || src(desc, '[[Set]]')) && (src(desc, '[[Value]]') || src(desc, '[[Writable]]'))) {
		throw new $TypeError$2u('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
	}
	return desc;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.12

var SameValue$4 = function SameValue(x, y) {
	if (x === y) { // 0 === -0, but they are not identical.
		if (x === 0) { return 1 / x === 1 / y; }
		return true;
	}
	return _isNaN(x) && _isNaN(y);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-frompropertydescriptor

var FromPropertyDescriptor$4 = function FromPropertyDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return Desc;
	}

	assertRecord(Type$4, 'Property Descriptor', 'Desc', Desc);

	var obj = {};
	if ('[[Value]]' in Desc) {
		obj.value = Desc['[[Value]]'];
	}
	if ('[[Writable]]' in Desc) {
		obj.writable = Desc['[[Writable]]'];
	}
	if ('[[Get]]' in Desc) {
		obj.get = Desc['[[Get]]'];
	}
	if ('[[Set]]' in Desc) {
		obj.set = Desc['[[Set]]'];
	}
	if ('[[Enumerable]]' in Desc) {
		obj.enumerable = Desc['[[Enumerable]]'];
	}
	if ('[[Configurable]]' in Desc) {
		obj.configurable = Desc['[[Configurable]]'];
	}
	return obj;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isgenericdescriptor

var IsGenericDescriptor$4 = function IsGenericDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$4, 'Property Descriptor', 'Desc', Desc);

	if (!IsAccessorDescriptor$4(Desc) && !IsDataDescriptor$4(Desc)) {
		return true;
	}

	return false;
};

var $TypeError$2v = GetIntrinsic('%TypeError%');













// https://www.ecma-international.org/ecma-262/6.0/#sec-validateandapplypropertydescriptor
// https://www.ecma-international.org/ecma-262/8.0/#sec-validateandapplypropertydescriptor

// eslint-disable-next-line max-lines-per-function, max-statements, max-params
var ValidateAndApplyPropertyDescriptor$3 = function ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current) {
	// this uses the ES2017+ logic, since it fixes a number of bugs in the ES2015 logic.
	var oType = Type$4(O);
	if (oType !== 'Undefined' && oType !== 'Object') {
		throw new $TypeError$2v('Assertion failed: O must be undefined or an Object');
	}
	if (Type$4(extensible) !== 'Boolean') {
		throw new $TypeError$2v('Assertion failed: extensible must be a Boolean');
	}
	if (!isPropertyDescriptor({
		Type: Type$4,
		IsDataDescriptor: IsDataDescriptor$4,
		IsAccessorDescriptor: IsAccessorDescriptor$4
	}, Desc)) {
		throw new $TypeError$2v('Assertion failed: Desc must be a Property Descriptor');
	}
	if (Type$4(current) !== 'Undefined' && !isPropertyDescriptor({
		Type: Type$4,
		IsDataDescriptor: IsDataDescriptor$4,
		IsAccessorDescriptor: IsAccessorDescriptor$4
	}, current)) {
		throw new $TypeError$2v('Assertion failed: current must be a Property Descriptor, or undefined');
	}
	if (oType !== 'Undefined' && !IsPropertyKey$3(P)) {
		throw new $TypeError$2v('Assertion failed: if O is not undefined, P must be a Property Key');
	}
	if (Type$4(current) === 'Undefined') {
		if (!extensible) {
			return false;
		}
		if (IsGenericDescriptor$4(Desc) || IsDataDescriptor$4(Desc)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$4,
					SameValue$4,
					FromPropertyDescriptor$4,
					O,
					P,
					{
						'[[Configurable]]': Desc['[[Configurable]]'],
						'[[Enumerable]]': Desc['[[Enumerable]]'],
						'[[Value]]': Desc['[[Value]]'],
						'[[Writable]]': Desc['[[Writable]]']
					}
				);
			}
		} else {
			if (!IsAccessorDescriptor$4(Desc)) {
				throw new $TypeError$2v('Assertion failed: Desc is not an accessor descriptor');
			}
			if (oType !== 'Undefined') {
				return DefineOwnProperty(
					IsDataDescriptor$4,
					SameValue$4,
					FromPropertyDescriptor$4,
					O,
					P,
					Desc
				);
			}
		}
		return true;
	}
	if (IsGenericDescriptor$4(Desc) && !('[[Configurable]]' in Desc) && !('[[Enumerable]]' in Desc)) {
		return true;
	}
	if (isSamePropertyDescriptor({ SameValue: SameValue$4 }, Desc, current)) {
		return true; // removed by ES2017, but should still be correct
	}
	// "if every field in Desc is absent, return true" can't really match the assertion that it's a Property Descriptor
	if (!current['[[Configurable]]']) {
		if (Desc['[[Configurable]]']) {
			return false;
		}
		if ('[[Enumerable]]' in Desc && !Desc['[[Enumerable]]'] === !!current['[[Enumerable]]']) {
			return false;
		}
	}
	if (IsGenericDescriptor$4(Desc)) ; else if (IsDataDescriptor$4(current) !== IsDataDescriptor$4(Desc)) {
		if (!current['[[Configurable]]']) {
			return false;
		}
		if (IsDataDescriptor$4(current)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$4,
					SameValue$4,
					FromPropertyDescriptor$4,
					O,
					P,
					{
						'[[Configurable]]': current['[[Configurable]]'],
						'[[Enumerable]]': current['[[Enumerable]]'],
						'[[Get]]': undefined
					}
				);
			}
		} else if (oType !== 'Undefined') {
			DefineOwnProperty(
				IsDataDescriptor$4,
				SameValue$4,
				FromPropertyDescriptor$4,
				O,
				P,
				{
					'[[Configurable]]': current['[[Configurable]]'],
					'[[Enumerable]]': current['[[Enumerable]]'],
					'[[Value]]': undefined
				}
			);
		}
	} else if (IsDataDescriptor$4(current) && IsDataDescriptor$4(Desc)) {
		if (!current['[[Configurable]]'] && !current['[[Writable]]']) {
			if ('[[Writable]]' in Desc && Desc['[[Writable]]']) {
				return false;
			}
			if ('[[Value]]' in Desc && !SameValue$4(Desc['[[Value]]'], current['[[Value]]'])) {
				return false;
			}
			return true;
		}
	} else if (IsAccessorDescriptor$4(current) && IsAccessorDescriptor$4(Desc)) {
		if (!current['[[Configurable]]']) {
			if ('[[Set]]' in Desc && !SameValue$4(Desc['[[Set]]'], current['[[Set]]'])) {
				return false;
			}
			if ('[[Get]]' in Desc && !SameValue$4(Desc['[[Get]]'], current['[[Get]]'])) {
				return false;
			}
			return true;
		}
	} else {
		throw new $TypeError$2v('Assertion failed: current and Desc are not both data, both accessors, or one accessor and one data.');
	}
	if (oType !== 'Undefined') {
		return DefineOwnProperty(
			IsDataDescriptor$4,
			SameValue$4,
			FromPropertyDescriptor$4,
			O,
			P,
			Desc
		);
	}
	return true;
};

var $SyntaxError$f = GetIntrinsic('%SyntaxError%');
var $TypeError$2w = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarydefineownproperty

var OrdinaryDefineOwnProperty$3 = function OrdinaryDefineOwnProperty(O, P, Desc) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2w('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2w('Assertion failed: P must be a Property Key');
	}
	if (!isPropertyDescriptor({
		Type: Type$4,
		IsDataDescriptor: IsDataDescriptor$4,
		IsAccessorDescriptor: IsAccessorDescriptor$4
	}, Desc)) {
		throw new $TypeError$2w('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!getOwnPropertyDescriptor) {
		// ES3/IE 8 fallback
		if (IsAccessorDescriptor$4(Desc)) {
			throw new $SyntaxError$f('This environment does not support accessor property descriptors.');
		}
		var creatingNormalDataProperty = !(P in O)
			&& Desc['[[Writable]]']
			&& Desc['[[Enumerable]]']
			&& Desc['[[Configurable]]']
			&& '[[Value]]' in Desc;
		var settingExistingDataProperty = (P in O)
			&& (!('[[Configurable]]' in Desc) || Desc['[[Configurable]]'])
			&& (!('[[Enumerable]]' in Desc) || Desc['[[Enumerable]]'])
			&& (!('[[Writable]]' in Desc) || Desc['[[Writable]]'])
			&& '[[Value]]' in Desc;
		if (creatingNormalDataProperty || settingExistingDataProperty) {
			O[P] = Desc['[[Value]]']; // eslint-disable-line no-param-reassign
			return SameValue$4(O[P], Desc['[[Value]]']);
		}
		throw new $SyntaxError$f('This environment does not support defining non-writable, non-enumerable, or non-configurable properties');
	}
	var desc = getOwnPropertyDescriptor(O, P);
	var current = desc && ToPropertyDescriptor$4(desc);
	var extensible = IsExtensible$3(O);
	return ValidateAndApplyPropertyDescriptor$3(O, P, extensible, Desc, current);
};

var $match$3 = GetIntrinsic('%Symbol.match%', true);





// https://ecma-international.org/ecma-262/6.0/#sec-isregexp

var IsRegExp$3 = function IsRegExp(argument) {
	if (!argument || typeof argument !== 'object') {
		return false;
	}
	if ($match$3) {
		var isRegExp = argument[$match$3];
		if (typeof isRegExp !== 'undefined') {
			return ToBoolean$4(isRegExp);
		}
	}
	return isRegex(argument);
};

var $TypeError$2x = GetIntrinsic('%TypeError%');



var $isEnumerable$5 = callBound('Object.prototype.propertyIsEnumerable');









// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarygetownproperty

var OrdinaryGetOwnProperty$3 = function OrdinaryGetOwnProperty(O, P) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2x('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2x('Assertion failed: P must be a Property Key');
	}
	if (!src(O, P)) {
		return void 0;
	}
	if (!getOwnPropertyDescriptor) {
		// ES3 / IE 8 fallback
		var arrayLength = IsArray$3(O) && P === 'length';
		var regexLastIndex = IsRegExp$3(O) && P === 'lastIndex';
		return {
			'[[Configurable]]': !(arrayLength || regexLastIndex),
			'[[Enumerable]]': $isEnumerable$5(O, P),
			'[[Value]]': O[P],
			'[[Writable]]': true
		};
	}
	return ToPropertyDescriptor$4(getOwnPropertyDescriptor(O, P));
};

var $String$7 = GetIntrinsic('%String%');
var $TypeError$2y = GetIntrinsic('%TypeError%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-tostring

var ToString$4 = function ToString(argument) {
	if (typeof argument === 'symbol') {
		throw new $TypeError$2y('Cannot convert a Symbol value to a string');
	}
	return $String$7(argument);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.6

var ToUint32$4 = function ToUint32(x) {
	return ToNumber$4(x) >>> 0;
};

var $RangeError$8 = GetIntrinsic('%RangeError%');
var $TypeError$2z = GetIntrinsic('%TypeError%');















// https://www.ecma-international.org/ecma-262/6.0/#sec-arraysetlength

// eslint-disable-next-line max-statements, max-lines-per-function
var ArraySetLength$3 = function ArraySetLength(A, Desc) {
	if (!IsArray$3(A)) {
		throw new $TypeError$2z('Assertion failed: A must be an Array');
	}
	if (!isPropertyDescriptor({
		Type: Type$4,
		IsDataDescriptor: IsDataDescriptor$4,
		IsAccessorDescriptor: IsAccessorDescriptor$4
	}, Desc)) {
		throw new $TypeError$2z('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!('[[Value]]' in Desc)) {
		return OrdinaryDefineOwnProperty$3(A, 'length', Desc);
	}
	var newLenDesc = object_assign({}, Desc);
	var newLen = ToUint32$4(Desc['[[Value]]']);
	var numberLen = ToNumber$4(Desc['[[Value]]']);
	if (newLen !== numberLen) {
		throw new $RangeError$8('Invalid array length');
	}
	newLenDesc['[[Value]]'] = newLen;
	var oldLenDesc = OrdinaryGetOwnProperty$3(A, 'length');
	if (!IsDataDescriptor$4(oldLenDesc)) {
		throw new $TypeError$2z('Assertion failed: an array had a non-data descriptor on `length`');
	}
	var oldLen = oldLenDesc['[[Value]]'];
	if (newLen >= oldLen) {
		return OrdinaryDefineOwnProperty$3(A, 'length', newLenDesc);
	}
	if (!oldLenDesc['[[Writable]]']) {
		return false;
	}
	var newWritable;
	if (!('[[Writable]]' in newLenDesc) || newLenDesc['[[Writable]]']) {
		newWritable = true;
	} else {
		newWritable = false;
		newLenDesc['[[Writable]]'] = true;
	}
	var succeeded = OrdinaryDefineOwnProperty$3(A, 'length', newLenDesc);
	if (!succeeded) {
		return false;
	}
	while (newLen < oldLen) {
		oldLen -= 1;
		// eslint-disable-next-line no-param-reassign
		var deleteSucceeded = delete A[ToString$4(oldLen)];
		if (!deleteSucceeded) {
			newLenDesc['[[Value]]'] = oldLen + 1;
			if (!newWritable) {
				newLenDesc['[[Writable]]'] = false;
				OrdinaryDefineOwnProperty$3(A, 'length', newLenDesc);
				return false;
			}
		}
	}
	if (!newWritable) {
		return OrdinaryDefineOwnProperty$3(A, 'length', { '[[Writable]]': false });
	}
	return true;
};

var $TypeError$2A = GetIntrinsic('%TypeError%');






/**
 * 7.3.1 Get (O, P) - https://ecma-international.org/ecma-262/6.0/#sec-get-o-p
 * 1. Assert: Type(O) is Object.
 * 2. Assert: IsPropertyKey(P) is true.
 * 3. Return O.[[Get]](P, O).
 */

var Get$3 = function Get(O, P) {
	// 7.3.1.1
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2A('Assertion failed: Type(O) is not Object');
	}
	// 7.3.1.2
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2A('Assertion failed: IsPropertyKey(P) is not true, got ' + objectInspect(P));
	}
	// 7.3.1.3
	return O[P];
};

var $TypeError$2B = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-definepropertyorthrow

var DefinePropertyOrThrow$3 = function DefinePropertyOrThrow(O, P, desc) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2B('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2B('Assertion failed: IsPropertyKey(P) is not true');
	}

	var Desc = isPropertyDescriptor({
		Type: Type$4,
		IsDataDescriptor: IsDataDescriptor$4,
		IsAccessorDescriptor: IsAccessorDescriptor$4
	}, desc) ? desc : ToPropertyDescriptor$4(desc);
	if (!isPropertyDescriptor({
		Type: Type$4,
		IsDataDescriptor: IsDataDescriptor$4,
		IsAccessorDescriptor: IsAccessorDescriptor$4
	}, Desc)) {
		throw new $TypeError$2B('Assertion failed: Desc is not a valid Property Descriptor');
	}

	return DefineOwnProperty(
		IsDataDescriptor$4,
		SameValue$4,
		FromPropertyDescriptor$4,
		O,
		P,
		Desc
	);
};

var IsConstructor$3 = createCommonjsModule(function (module) {



var $construct = GetIntrinsic('%Reflect.construct%', true);

var DefinePropertyOrThrow = DefinePropertyOrThrow$3;
try {
	DefinePropertyOrThrow({}, '', { '[[Get]]': function () {} });
} catch (e) {
	// Accessor properties aren't supported
	DefinePropertyOrThrow = null;
}

// https://www.ecma-international.org/ecma-262/6.0/#sec-isconstructor

if (DefinePropertyOrThrow && $construct) {
	var isConstructorMarker = {};
	var badArrayLike = {};
	DefinePropertyOrThrow(badArrayLike, 'length', {
		'[[Get]]': function () {
			throw isConstructorMarker;
		},
		'[[Enumerable]]': true
	});

	module.exports = function IsConstructor(argument) {
		try {
			// `Reflect.construct` invokes `IsConstructor(target)` before `Get(args, 'length')`:
			$construct(argument, badArrayLike);
		} catch (err) {
			return err === isConstructorMarker;
		}
	};
} else {
	module.exports = function IsConstructor(argument) {
		// unfortunately there's no way to truly check this without try/catch `new argument` in old environments
		return typeof argument === 'function' && !!argument.prototype;
	};
}
});

var $Array$7 = GetIntrinsic('%Array%');
var $species$6 = GetIntrinsic('%Symbol.species%', true);
var $TypeError$2C = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-arrayspeciescreate

var ArraySpeciesCreate$3 = function ArraySpeciesCreate(originalArray, length) {
	if (!IsInteger$3(length) || length < 0) {
		throw new $TypeError$2C('Assertion failed: length must be an integer >= 0');
	}
	var len = length === 0 ? 0 : length;
	var C;
	var isArray = IsArray$3(originalArray);
	if (isArray) {
		C = Get$3(originalArray, 'constructor');
		// TODO: figure out how to make a cross-realm normal Array, a same-realm Array
		// if (IsConstructor(C)) {
		// 	if C is another realm's Array, C = undefined
		// 	Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(Array))) === null ?
		// }
		if ($species$6 && Type$4(C) === 'Object') {
			C = Get$3(C, $species$6);
			if (C === null) {
				C = void 0;
			}
		}
	}
	if (typeof C === 'undefined') {
		return $Array$7(len);
	}
	if (!IsConstructor$3(C)) {
		throw new $TypeError$2C('C must be a constructor');
	}
	return new C(len); // Construct(C, len);
};

var $apply$4 = GetIntrinsic('%Reflect.apply%', true) || callBound('%Function.prototype.apply%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-call

var Call$3 = function Call(F, V) {
	var args = arguments.length > 2 ? arguments[2] : [];
	return $apply$4(F, V, args);
};

var $TypeError$2D = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring

var CanonicalNumericIndexString$3 = function CanonicalNumericIndexString(argument) {
	if (Type$4(argument) !== 'String') {
		throw new $TypeError$2D('Assertion failed: `argument` must be a String');
	}
	if (argument === '-0') { return -0; }
	var n = ToNumber$4(argument);
	if (SameValue$4(ToString$4(n), argument)) { return n; }
	return void 0;
};

// https://ecma-international.org/ecma-262/6.0/#sec-completepropertydescriptor

var CompletePropertyDescriptor$3 = function CompletePropertyDescriptor(Desc) {
	/* eslint no-param-reassign: 0 */
	assertRecord(Type$4, 'Property Descriptor', 'Desc', Desc);

	if (IsGenericDescriptor$4(Desc) || IsDataDescriptor$4(Desc)) {
		if (!src(Desc, '[[Value]]')) {
			Desc['[[Value]]'] = void 0;
		}
		if (!src(Desc, '[[Writable]]')) {
			Desc['[[Writable]]'] = false;
		}
	} else {
		if (!src(Desc, '[[Get]]')) {
			Desc['[[Get]]'] = void 0;
		}
		if (!src(Desc, '[[Set]]')) {
			Desc['[[Set]]'] = void 0;
		}
	}
	if (!src(Desc, '[[Enumerable]]')) {
		Desc['[[Enumerable]]'] = false;
	}
	if (!src(Desc, '[[Configurable]]')) {
		Desc['[[Configurable]]'] = false;
	}
	return Desc;
};

var $ownKeys = GetIntrinsic('%Reflect.ownKeys%', true);
var $pushApply$1 = callBind.apply(GetIntrinsic('%Array.prototype.push%'));
var $SymbolValueOf = callBound('Symbol.prototype.valueOf', true);
var $gOPN$9 = GetIntrinsic('%Object.getOwnPropertyNames%', true);
var $gOPS$3 = $SymbolValueOf ? GetIntrinsic('%Object.getOwnPropertySymbols%') : null;



var OwnPropertyKeys = $ownKeys || function OwnPropertyKeys(source) {
	var ownKeys = ($gOPN$9 || objectKeys)(source);
	if ($gOPS$3) {
		$pushApply$1(ownKeys, $gOPS$3(source));
	}
	return ownKeys;
};

var $TypeError$2E = GetIntrinsic('%TypeError%');











// https://www.ecma-international.org/ecma-262/6.0/#sec-createdataproperty

var CreateDataProperty$3 = function CreateDataProperty(O, P, V) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2E('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2E('Assertion failed: IsPropertyKey(P) is not true');
	}
	var oldDesc = OrdinaryGetOwnProperty$3(O, P);
	var extensible = !oldDesc || IsExtensible$3(O);
	var immutable = oldDesc && (!oldDesc['[[Writable]]'] || !oldDesc['[[Configurable]]']);
	if (immutable || !extensible) {
		return false;
	}
	return DefineOwnProperty(
		IsDataDescriptor$4,
		SameValue$4,
		FromPropertyDescriptor$4,
		O,
		P,
		{
			'[[Configurable]]': true,
			'[[Enumerable]]': true,
			'[[Value]]': V,
			'[[Writable]]': true
		}
	);
};

var RequireObjectCoercible$3 = CheckObjectCoercible;

var $Object$8 = GetIntrinsic('%Object%');



// https://www.ecma-international.org/ecma-262/6.0/#sec-toobject

var ToObject$4 = function ToObject(value) {
	RequireObjectCoercible$3(value);
	return $Object$8(value);
};

var $isEnumerable$6 = callBound('Object.prototype.propertyIsEnumerable');











// https://www.ecma-international.org/ecma-262/9.0/#sec-copydataproperties

var CopyDataProperties = function CopyDataProperties(target, source, excludedItems) {
	if (Type$4(target) !== 'Object') {
		throw new TypeError('Assertion failed: "target" must be an Object');
	}

	if (!IsArray$3(excludedItems)) {
		throw new TypeError('Assertion failed: "excludedItems" must be a List of Property Keys');
	}
	for (var i = 0; i < excludedItems.length; i += 1) {
		if (!IsPropertyKey$3(excludedItems[i])) {
			throw new TypeError('Assertion failed: "excludedItems" must be a List of Property Keys');
		}
	}

	if (typeof source === 'undefined' || source === null) {
		return target;
	}

	var fromObj = ToObject$4(source);

	var sourceKeys = OwnPropertyKeys(fromObj);
	forEach(sourceKeys, function (nextKey) {
		var excluded = false;

		forEach(excludedItems, function (e) {
			if (SameValue$4(e, nextKey) === true) {
				excluded = true;
			}
		});

		var enumerable = $isEnumerable$6(fromObj, nextKey) || (
		// this is to handle string keys being non-enumerable in older engines
			typeof source === 'string'
            && nextKey >= 0
            && IsInteger$3(ToNumber$4(nextKey))
		);
		if (excluded === false && enumerable) {
			var propValue = Get$3(fromObj, nextKey);
			CreateDataProperty$3(target, nextKey, propValue);
		}
	});

	return target;
};

var $TypeError$2F = GetIntrinsic('%TypeError%');





// // https://ecma-international.org/ecma-262/6.0/#sec-createdatapropertyorthrow

var CreateDataPropertyOrThrow$3 = function CreateDataPropertyOrThrow(O, P, V) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2F('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2F('Assertion failed: IsPropertyKey(P) is not true');
	}
	var success = CreateDataProperty$3(O, P, V);
	if (!success) {
		throw new $TypeError$2F('unable to create data property');
	}
	return success;
};

var $TypeError$2G = GetIntrinsic('%TypeError%');



var $replace$8 = callBound('String.prototype.replace');





// https://www.ecma-international.org/ecma-262/6.0/#sec-createhtml

var CreateHTML$3 = function CreateHTML(string, tag, attribute, value) {
	if (Type$4(tag) !== 'String' || Type$4(attribute) !== 'String') {
		throw new $TypeError$2G('Assertion failed: `tag` and `attribute` must be strings');
	}
	var str = RequireObjectCoercible$3(string);
	var S = ToString$4(str);
	var p1 = '<' + tag;
	if (attribute !== '') {
		var V = ToString$4(value);
		var escapedV = $replace$8(V, /\x22/g, '&quot;');
		p1 += '\x20' + attribute + '\x3D\x22' + escapedV + '\x22';
	}
	return p1 + '>' + S + '</' + tag + '>';
};

var $TypeError$2H = GetIntrinsic('%TypeError%');



// https://ecma-international.org/ecma-262/6.0/#sec-createiterresultobject

var CreateIterResultObject$3 = function CreateIterResultObject(value, done) {
	if (Type$4(done) !== 'Boolean') {
		throw new $TypeError$2H('Assertion failed: Type(done) is not Boolean');
	}
	return {
		value: value,
		done: done
	};
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-tointeger

var ToInteger$4 = function ToInteger$1(value) {
	var number = ToNumber$4(value);
	return ToInteger(number);
};

var ToLength$3 = function ToLength(argument) {
	var len = ToInteger$4(argument);
	if (len <= 0) { return 0; } // includes converting -0 to +0
	if (len > maxSafeInteger) { return maxSafeInteger; }
	return len;
};

var $TypeError$2I = GetIntrinsic('%TypeError%');
var $indexOf$4 = callBound('Array.prototype.indexOf', true) || callBound('String.prototype.indexOf');
var $push$3 = callBound('Array.prototype.push');







// https://ecma-international.org/ecma-262/6.0/#sec-createlistfromarraylike
var CreateListFromArrayLike$3 = function CreateListFromArrayLike(obj) {
	var elementTypes = arguments.length > 1
		? arguments[1]
		: ['Undefined', 'Null', 'Boolean', 'String', 'Symbol', 'Number', 'Object'];

	if (Type$4(obj) !== 'Object') {
		throw new $TypeError$2I('Assertion failed: `obj` must be an Object');
	}
	if (!IsArray$3(elementTypes)) {
		throw new $TypeError$2I('Assertion failed: `elementTypes`, if provided, must be an array');
	}
	var len = ToLength$3(Get$3(obj, 'length'));
	var list = [];
	var index = 0;
	while (index < len) {
		var indexName = ToString$4(index);
		var next = Get$3(obj, indexName);
		var nextType = Type$4(next);
		if ($indexOf$4(elementTypes, nextType) < 0) {
			throw new $TypeError$2I('item type ' + nextType + ' is not a valid elementType');
		}
		$push$3(list, next);
		index += 1;
	}
	return list;
};

var $TypeError$2J = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/6.0/#sec-createmethodproperty

var CreateMethodProperty$3 = function CreateMethodProperty(O, P, V) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2J('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2J('Assertion failed: IsPropertyKey(P) is not true');
	}

	var newDesc = {
		'[[Configurable]]': true,
		'[[Enumerable]]': false,
		'[[Value]]': V,
		'[[Writable]]': true
	};
	return DefineOwnProperty(
		IsDataDescriptor$4,
		SameValue$4,
		FromPropertyDescriptor$4,
		O,
		P,
		newDesc
	);
};

var $floor$E = GetIntrinsic('%Math.floor%');

var msPerDay$h = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var Day$4 = function Day(t) {
	return $floor$E(t / msPerDay$h);
};

var $floor$F = GetIntrinsic('%Math.floor%');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DayFromYear$4 = function DayFromYear(y) {
	return (365 * (y - 1970)) + $floor$F((y - 1969) / 4) - $floor$F((y - 1901) / 100) + $floor$F((y - 1601) / 400);
};

var $Date$b = GetIntrinsic('%Date%');



var $getUTCFullYear$4 = callBound('Date.prototype.getUTCFullYear');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var YearFromTime$4 = function YearFromTime(t) {
	// largest y such that this.TimeFromYear(y) <= t
	return $getUTCFullYear$4(new $Date$b(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var DayWithinYear$4 = function DayWithinYear(t) {
	return Day$4(t) - DayFromYear$4(YearFromTime$4(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DaysInYear$4 = function DaysInYear(y) {
	if (mod(y, 4) !== 0) {
		return 365;
	}
	if (mod(y, 100) !== 0) {
		return 366;
	}
	if (mod(y, 400) !== 0) {
		return 365;
	}
	return 366;
};

var $EvalError$8 = GetIntrinsic('%EvalError%');




// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var InLeapYear$4 = function InLeapYear(t) {
	var days = DaysInYear$4(YearFromTime$4(t));
	if (days === 365) {
		return 0;
	}
	if (days === 366) {
		return 1;
	}
	throw new $EvalError$8('Assertion failed: there are not 365 or 366 days in a year, got: ' + days);
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var MonthFromTime$4 = function MonthFromTime(t) {
	var day = DayWithinYear$4(t);
	if (0 <= day && day < 31) {
		return 0;
	}
	var leap = InLeapYear$4(t);
	if (31 <= day && day < (59 + leap)) {
		return 1;
	}
	if ((59 + leap) <= day && day < (90 + leap)) {
		return 2;
	}
	if ((90 + leap) <= day && day < (120 + leap)) {
		return 3;
	}
	if ((120 + leap) <= day && day < (151 + leap)) {
		return 4;
	}
	if ((151 + leap) <= day && day < (181 + leap)) {
		return 5;
	}
	if ((181 + leap) <= day && day < (212 + leap)) {
		return 6;
	}
	if ((212 + leap) <= day && day < (243 + leap)) {
		return 7;
	}
	if ((243 + leap) <= day && day < (273 + leap)) {
		return 8;
	}
	if ((273 + leap) <= day && day < (304 + leap)) {
		return 9;
	}
	if ((304 + leap) <= day && day < (334 + leap)) {
		return 10;
	}
	if ((334 + leap) <= day && day < (365 + leap)) {
		return 11;
	}
};

var $EvalError$9 = GetIntrinsic('%EvalError%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.5

var DateFromTime$4 = function DateFromTime(t) {
	var m = MonthFromTime$4(t);
	var d = DayWithinYear$4(t);
	if (m === 0) {
		return d + 1;
	}
	if (m === 1) {
		return d - 30;
	}
	var leap = InLeapYear$4(t);
	if (m === 2) {
		return d - 58 - leap;
	}
	if (m === 3) {
		return d - 89 - leap;
	}
	if (m === 4) {
		return d - 119 - leap;
	}
	if (m === 5) {
		return d - 150 - leap;
	}
	if (m === 6) {
		return d - 180 - leap;
	}
	if (m === 7) {
		return d - 211 - leap;
	}
	if (m === 8) {
		return d - 242 - leap;
	}
	if (m === 9) {
		return d - 272 - leap;
	}
	if (m === 10) {
		return d - 303 - leap;
	}
	if (m === 11) {
		return d - 333 - leap;
	}
	throw new $EvalError$9('Assertion failed: MonthFromTime returned an impossible value: ' + m);
};

var $strSlice$8 = callBound('String.prototype.slice');

var padTimeComponent = function padTimeComponent(c, count) {
	return $strSlice$8('00' + c, -(count || 2));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.6

var WeekDay$4 = function WeekDay(t) {
	return mod(Day$4(t) + 4, 7);
};

var $TypeError$2K = GetIntrinsic('%TypeError%');

var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];










// https://www.ecma-international.org/ecma-262/9.0/#sec-datestring

var DateString = function DateString(tv) {
	if (Type$4(tv) !== 'Number' || _isNaN(tv)) {
		throw new $TypeError$2K('Assertion failed: `tv` must be a non-NaN Number');
	}
	var weekday = weekdays[WeekDay$4(tv)];
	var month = months[MonthFromTime$4(tv)];
	var day = padTimeComponent(DateFromTime$4(tv));
	var year = padTimeComponent(YearFromTime$4(tv), 4);
	return weekday + '\x20' + month + '\x20' + day + '\x20' + year;
};

var $TypeError$2L = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-deletepropertyorthrow

var DeletePropertyOrThrow$3 = function DeletePropertyOrThrow(O, P) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2L('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2L('Assertion failed: IsPropertyKey(P) is not true');
	}

	// eslint-disable-next-line no-param-reassign
	var success = delete O[P];
	if (!success) {
		throw new $TypeError$2L('Attempt to delete property failed.');
	}
	return success;
};

var $TypeError$2M = GetIntrinsic('%TypeError%');







var $isEnumerable$7 = callBound('Object.prototype.propertyIsEnumerable');
var $pushApply$2 = callBind.apply(GetIntrinsic('%Array.prototype.push%'));





// https://www.ecma-international.org/ecma-262/8.0/#sec-enumerableownproperties

var EnumerableOwnPropertyNames = function EnumerableOwnProperties(O, kind) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2M('Assertion failed: Type(O) is not Object');
	}

	var keys = objectKeys(O);
	if (kind === 'key') {
		return keys;
	}
	if (kind === 'value' || kind === 'key+value') {
		var results = [];
		forEach(keys, function (key) {
			if ($isEnumerable$7(O, key)) {
				$pushApply$2(results, [
					kind === 'value' ? O[key] : [key, O[key]]
				]);
			}
		});
		return results;
	}
	throw new $TypeError$2M('Assertion failed: "kind" is not "key", "value", or "key+value": ' + kind);
};

var $TypeError$2N = GetIntrinsic('%TypeError%');




/**
 * 7.3.2 GetV (V, P)
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let O be ToObject(V).
 * 3. ReturnIfAbrupt(O).
 * 4. Return O.[[Get]](P, V).
 */

var GetV$3 = function GetV(V, P) {
	// 7.3.2.1
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2N('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.2.2-3
	var O = ToObject$4(V);

	// 7.3.2.4
	return O[P];
};

var $TypeError$2O = GetIntrinsic('%TypeError%');





/**
 * 7.3.9 - https://ecma-international.org/ecma-262/6.0/#sec-getmethod
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let func be GetV(O, P).
 * 3. ReturnIfAbrupt(func).
 * 4. If func is either undefined or null, return undefined.
 * 5. If IsCallable(func) is false, throw a TypeError exception.
 * 6. Return func.
 */

var GetMethod$4 = function GetMethod(O, P) {
	// 7.3.9.1
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2O('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.9.2
	var func = GetV$3(O, P);

	// 7.3.9.4
	if (func == null) {
		return void 0;
	}

	// 7.3.9.5
	if (!IsCallable$4(func)) {
		throw new $TypeError$2O(P + 'is not a function');
	}

	// 7.3.9.6
	return func;
};

var $TypeError$2P = GetIntrinsic('%TypeError%');








// https://ecma-international.org/ecma-262/6.0/#sec-getiterator

var GetIterator$3 = function GetIterator(obj, method) {
	var actualMethod = method;
	if (arguments.length < 2) {
		actualMethod = getIteratorMethod(
			{
				AdvanceStringIndex: AdvanceStringIndex$3,
				GetMethod: GetMethod$4,
				IsArray: IsArray$3,
				Type: Type$4
			},
			obj
		);
	}
	var iterator = Call$3(actualMethod, obj);
	if (Type$4(iterator) !== 'Object') {
		throw new $TypeError$2P('iterator must return an object');
	}

	return iterator;
};

var hasSymbols$a = hasSymbols();

var $TypeError$2Q = GetIntrinsic('%TypeError%');

var $gOPN$a = GetIntrinsic('%Object.getOwnPropertyNames%');
var $gOPS$4 = hasSymbols$a && GetIntrinsic('%Object.getOwnPropertySymbols%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-getownpropertykeys

var GetOwnPropertyKeys$3 = function GetOwnPropertyKeys(O, Type) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2Q('Assertion failed: Type(O) is not Object');
	}
	if (Type === 'Symbol') {
		return $gOPS$4 ? $gOPS$4(O) : [];
	}
	if (Type === 'String') {
		if (!$gOPN$a) {
			return objectKeys(O);
		}
		return $gOPN$a(O);
	}
	throw new $TypeError$2Q('Assertion failed: `Type` must be `"String"` or `"Symbol"`');
};

var $Function$3 = GetIntrinsic('%Function%');
var $TypeError$2R = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-getprototypefromconstructor

var GetPrototypeFromConstructor$3 = function GetPrototypeFromConstructor(constructor, intrinsicDefaultProto) {
	var intrinsic = GetIntrinsic(intrinsicDefaultProto); // throws if not a valid intrinsic
	if (!IsConstructor$3(constructor)) {
		throw new $TypeError$2R('Assertion failed: `constructor` must be a constructor');
	}
	var proto = Get$3(constructor, 'prototype');
	if (Type$4(proto) !== 'Object') {
		if (!(constructor instanceof $Function$3)) {
			// ignore other realms, for now
			throw new $TypeError$2R('cross-realm constructors not currently supported');
		}
		proto = intrinsic;
	}
	return proto;
};

var $TypeError$2S = GetIntrinsic('%TypeError%');





var $charAt$3 = callBound('String.prototype.charAt');
var $strSlice$9 = callBound('String.prototype.slice');
var $indexOf$5 = callBound('String.prototype.indexOf');
var $parseInt$3 = parseInt;

var isDigit$3 = regexTester(/^[0-9]$/);










var canDistinguishSparseFromUndefined$3 = 0 in [undefined]; // IE 6 - 8 have a bug where this returns false

var isStringOrHole$3 = function (capture, index, arr) {
	return Type$4(capture) === 'String' || (canDistinguishSparseFromUndefined$3 ? !(index in arr) : Type$4(capture) === 'Undefined');
};

// http://www.ecma-international.org/ecma-262/9.0/#sec-getsubstitution

// eslint-disable-next-line max-statements, max-params, max-lines-per-function
var GetSubstitution$3 = function GetSubstitution(matched, str, position, captures, namedCaptures, replacement) {
	if (Type$4(matched) !== 'String') {
		throw new $TypeError$2S('Assertion failed: `matched` must be a String');
	}
	var matchLength = matched.length;

	if (Type$4(str) !== 'String') {
		throw new $TypeError$2S('Assertion failed: `str` must be a String');
	}
	var stringLength = str.length;

	if (!IsInteger$3(position) || position < 0 || position > stringLength) {
		throw new $TypeError$2S('Assertion failed: `position` must be a nonnegative integer, and less than or equal to the length of `string`, got ' + objectInspect(position));
	}

	if (!IsArray$3(captures) || !every(captures, isStringOrHole$3)) {
		throw new $TypeError$2S('Assertion failed: `captures` must be a List of Strings, got ' + objectInspect(captures));
	}

	if (Type$4(replacement) !== 'String') {
		throw new $TypeError$2S('Assertion failed: `replacement` must be a String');
	}

	var tailPos = position + matchLength;
	var m = captures.length;
	if (Type$4(namedCaptures) !== 'Undefined') {
		namedCaptures = ToObject$4(namedCaptures); // eslint-disable-line no-param-reassign
	}

	var result = '';
	for (var i = 0; i < replacement.length; i += 1) {
		// if this is a $, and it's not the end of the replacement
		var current = $charAt$3(replacement, i);
		var isLast = (i + 1) >= replacement.length;
		var nextIsLast = (i + 2) >= replacement.length;
		if (current === '$' && !isLast) {
			var next = $charAt$3(replacement, i + 1);
			if (next === '$') {
				result += '$';
				i += 1;
			} else if (next === '&') {
				result += matched;
				i += 1;
			} else if (next === '`') {
				result += position === 0 ? '' : $strSlice$9(str, 0, position - 1);
				i += 1;
			} else if (next === "'") {
				result += tailPos >= stringLength ? '' : $strSlice$9(str, tailPos);
				i += 1;
			} else {
				var nextNext = nextIsLast ? null : $charAt$3(replacement, i + 2);
				if (isDigit$3(next) && next !== '0' && (nextIsLast || !isDigit$3(nextNext))) {
					// $1 through $9, and not followed by a digit
					var n = $parseInt$3(next, 10);
					// if (n > m, impl-defined)
					result += (n <= m && Type$4(captures[n - 1]) === 'Undefined') ? '' : captures[n - 1];
					i += 1;
				} else if (isDigit$3(next) && (nextIsLast || isDigit$3(nextNext))) {
					// $00 through $99
					var nn = next + nextNext;
					var nnI = $parseInt$3(nn, 10) - 1;
					// if nn === '00' or nn > m, impl-defined
					result += (nn <= m && Type$4(captures[nnI]) === 'Undefined') ? '' : captures[nnI];
					i += 2;
				} else if (next === '<') {
					// eslint-disable-next-line max-depth
					if (Type$4(namedCaptures) === 'Undefined') {
						result += '$<';
						i += 2;
					} else {
						var endIndex = $indexOf$5(replacement, '>', i);
						// eslint-disable-next-line max-depth
						if (endIndex > -1) {
							var groupName = $strSlice$9(replacement, i, endIndex);
							var capture = Get$3(namedCaptures, groupName);
							// eslint-disable-next-line max-depth
							if (Type$4(capture) !== 'Undefined') {
								result += ToString$4(capture);
							}
							i += '$<' + groupName + '>'.length;
						}
					}
				} else {
					result += '$';
				}
			}
		} else {
			// the final $, or else not a $
			result += $charAt$3(replacement, i);
		}
	}
	return result;
};

var $TypeError$2T = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-hasownproperty

var HasOwnProperty$3 = function HasOwnProperty(O, P) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2T('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2T('Assertion failed: `P` must be a Property Key');
	}
	return src(O, P);
};

var $TypeError$2U = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-hasproperty

var HasProperty$3 = function HasProperty(O, P) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2U('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2U('Assertion failed: `P` must be a Property Key');
	}
	return P in O;
};

var $floor$G = GetIntrinsic('%Math.floor%');



var msPerHour$9 = timeConstants.msPerHour;
var HoursPerDay$5 = timeConstants.HoursPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var HourFromTime$4 = function HourFromTime(t) {
	return mod($floor$G(t / msPerHour$9), HoursPerDay$5);
};

var $TypeError$2V = GetIntrinsic('%TypeError%');





// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasinstance

var OrdinaryHasInstance$3 = function OrdinaryHasInstance(C, O) {
	if (IsCallable$4(C) === false) {
		return false;
	}
	if (Type$4(O) !== 'Object') {
		return false;
	}
	var P = Get$3(C, 'prototype');
	if (Type$4(P) !== 'Object') {
		throw new $TypeError$2V('OrdinaryHasInstance called on an object with an invalid prototype property.');
	}
	return O instanceof C;
};

var $TypeError$2W = GetIntrinsic('%TypeError%');

var $hasInstance$3 = GetIntrinsic('Symbol.hasInstance', true);








// https://www.ecma-international.org/ecma-262/6.0/#sec-instanceofoperator

var InstanceofOperator$3 = function InstanceofOperator(O, C) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$2W('Assertion failed: Type(O) is not Object');
	}
	var instOfHandler = $hasInstance$3 ? GetMethod$4(C, $hasInstance$3) : void 0;
	if (typeof instOfHandler !== 'undefined') {
		return ToBoolean$4(Call$3(instOfHandler, C, [O]));
	}
	if (!IsCallable$4(C)) {
		throw new $TypeError$2W('`C` is not Callable');
	}
	return OrdinaryHasInstance$3(C, O);
};

var $TypeError$2X = GetIntrinsic('%TypeError%');

var $arraySlice$3 = callBound('Array.prototype.slice');





// https://ecma-international.org/ecma-262/6.0/#sec-invoke

var Invoke$3 = function Invoke(O, P) {
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$2X('P must be a Property Key');
	}
	var argumentsList = $arraySlice$3(arguments, 2);
	var func = GetV$3(O, P);
	return Call$3(func, O, argumentsList);
};

var $isConcatSpreadable$3 = GetIntrinsic('%Symbol.isConcatSpreadable%', true);






// https://ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable

var IsConcatSpreadable$3 = function IsConcatSpreadable(O) {
	if (Type$4(O) !== 'Object') {
		return false;
	}
	if ($isConcatSpreadable$3) {
		var spreadable = Get$3(O, $isConcatSpreadable$3);
		if (typeof spreadable !== 'undefined') {
			return ToBoolean$4(spreadable);
		}
	}
	return IsArray$3(O);
};

var $PromiseThen$3 = callBound('Promise.prototype.then', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-ispromise

var IsPromise$3 = function IsPromise(x) {
	if (Type$4(x) !== 'Object') {
		return false;
	}
	if (!$PromiseThen$3) { // Promises are not supported
		return false;
	}
	try {
		$PromiseThen$3(x); // throws if not a promise
	} catch (e) {
		return false;
	}
	return true;
};

var $TypeError$2Y = GetIntrinsic('%TypeError%');



// var callBound = require('../helpers/callBound');

// var $charAt = callBound('String.prototype.charAt');



// https://www.ecma-international.org/ecma-262/9.0/#sec-isstringprefix

var IsStringPrefix = function IsStringPrefix(p, q) {
	if (Type$4(p) !== 'String') {
		throw new $TypeError$2Y('Assertion failed: "p" must be a String');
	}

	if (Type$4(q) !== 'String') {
		throw new $TypeError$2Y('Assertion failed: "q" must be a String');
	}

	return isPrefixOf(p, q);
	/*
	if (p === q || p === '') {
		return true;
	}

	var pLength = p.length;
	var qLength = q.length;
	if (pLength >= qLength) {
		return false;
	}

	// assert: pLength < qLength

	for (var i = 0; i < pLength; i += 1) {
		if ($charAt(p, i) !== $charAt(q, i)) {
			return false;
		}
	}
	return true;
	*/
};

var $TypeError$2Z = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-iteratorcomplete

var IteratorComplete$3 = function IteratorComplete(iterResult) {
	if (Type$4(iterResult) !== 'Object') {
		throw new $TypeError$2Z('Assertion failed: Type(iterResult) is not Object');
	}
	return ToBoolean$4(Get$3(iterResult, 'done'));
};

var $TypeError$2_ = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratornext

var IteratorNext$3 = function IteratorNext(iterator, value) {
	var result = Invoke$3(iterator, 'next', arguments.length < 2 ? [] : [value]);
	if (Type$4(result) !== 'Object') {
		throw new $TypeError$2_('iterator next must return an object');
	}
	return result;
};

// https://ecma-international.org/ecma-262/6.0/#sec-iteratorstep

var IteratorStep$3 = function IteratorStep(iterator) {
	var result = IteratorNext$3(iterator);
	var done = IteratorComplete$3(result);
	return done === true ? false : result;
};

var $TypeError$2$ = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratorvalue

var IteratorValue$3 = function IteratorValue(iterResult) {
	if (Type$4(iterResult) !== 'Object') {
		throw new $TypeError$2$('Assertion failed: Type(iterResult) is not Object');
	}
	return Get$3(iterResult, 'value');
};

var $arrayPush$2 = callBound('Array.prototype.push');





// https://www.ecma-international.org/ecma-262/8.0/#sec-iterabletolist

var IterableToList$1 = function IterableToList(items, method) {
	var iterator = GetIterator$3(items, method);
	var values = [];
	var next = true;
	while (next) {
		next = IteratorStep$3(iterator);
		if (next) {
			var nextValue = IteratorValue$3(next);
			$arrayPush$2(values, nextValue);
		}
	}
	return values;
};

var $TypeError$30 = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-iteratorclose

var IteratorClose$3 = function IteratorClose(iterator, completion) {
	if (Type$4(iterator) !== 'Object') {
		throw new $TypeError$30('Assertion failed: Type(iterator) is not Object');
	}
	if (!IsCallable$4(completion)) {
		throw new $TypeError$30('Assertion failed: completion is not a thunk for a Completion Record');
	}
	var completionThunk = completion;

	var iteratorReturn = GetMethod$4(iterator, 'return');

	if (typeof iteratorReturn === 'undefined') {
		return completionThunk();
	}

	var completionRecord;
	try {
		var innerResult = Call$3(iteratorReturn, iterator, []);
	} catch (e) {
		// if we hit here, then "e" is the innerResult completion that needs re-throwing

		// if the completion is of type "throw", this will throw.
		completionThunk();
		completionThunk = null; // ensure it's not called twice.

		// if not, then return the innerResult completion
		throw e;
	}
	completionRecord = completionThunk(); // if innerResult worked, then throw if the completion does
	completionThunk = null; // ensure it's not called twice.

	if (Type$4(innerResult) !== 'Object') {
		throw new $TypeError$30('iterator .return must return an object');
	}

	return completionRecord;
};

var msPerDay$i = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.13

var MakeDate$4 = function MakeDate(day, time) {
	if (!_isFinite(day) || !_isFinite(time)) {
		return NaN;
	}
	return (day * msPerDay$i) + time;
};

var $floor$H = GetIntrinsic('%Math.floor%');
var $DateUTC$4 = GetIntrinsic('%Date.UTC%');










// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.12

var MakeDay$4 = function MakeDay(year, month, date) {
	if (!_isFinite(year) || !_isFinite(month) || !_isFinite(date)) {
		return NaN;
	}
	var y = ToInteger$4(year);
	var m = ToInteger$4(month);
	var dt = ToInteger$4(date);
	var ym = y + $floor$H(m / 12);
	var mn = mod(m, 12);
	var t = $DateUTC$4(ym, mn, 1);
	if (YearFromTime$4(t) !== ym || MonthFromTime$4(t) !== mn || DateFromTime$4(t) !== 1) {
		return NaN;
	}
	return Day$4(t) + dt - 1;
};

var msPerSecond$d = timeConstants.msPerSecond;
var msPerMinute$9 = timeConstants.msPerMinute;
var msPerHour$a = timeConstants.msPerHour;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.11

var MakeTime$4 = function MakeTime(hour, min, sec, ms) {
	if (!_isFinite(hour) || !_isFinite(min) || !_isFinite(sec) || !_isFinite(ms)) {
		return NaN;
	}
	var h = ToInteger$4(hour);
	var m = ToInteger$4(min);
	var s = ToInteger$4(sec);
	var milli = ToInteger$4(ms);
	var t = (h * msPerHour$a) + (m * msPerMinute$9) + (s * msPerSecond$d) + milli;
	return t;
};

var $floor$I = GetIntrinsic('%Math.floor%');



var msPerMinute$a = timeConstants.msPerMinute;
var MinutesPerHour$5 = timeConstants.MinutesPerHour;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var MinFromTime$4 = function MinFromTime(t) {
	return mod($floor$I(t / msPerMinute$a), MinutesPerHour$5);
};

// https://ecma-international.org/ecma-262/5.1/#sec-5.2

var modulo$4 = function modulo(x, y) {
	return mod(x, y);
};

var msPerSecond$e = timeConstants.msPerSecond;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var msFromTime$4 = function msFromTime(t) {
	return mod(t, msPerSecond$e);
};

var $String$8 = GetIntrinsic('%String%');



// https://www.ecma-international.org/ecma-262/9.0/#sec-tostring-applied-to-the-number-type

var NumberToString = function NumberToString(m) {
	if (Type$4(m) !== 'Number') {
		throw new TypeError('Assertion failed: "m" must be a String');
	}

	return $String$8(m);
};

var $ObjectCreate$3 = GetIntrinsic('%Object.create%', true);
var $TypeError$31 = GetIntrinsic('%TypeError%');
var $SyntaxError$g = GetIntrinsic('%SyntaxError%');



var hasProto$3 = !({ __proto__: null } instanceof Object);

// https://www.ecma-international.org/ecma-262/6.0/#sec-objectcreate

var ObjectCreate$3 = function ObjectCreate(proto, internalSlotsList) {
	if (proto !== null && Type$4(proto) !== 'Object') {
		throw new $TypeError$31('Assertion failed: `proto` must be null or an object');
	}
	var slots = arguments.length < 2 ? [] : internalSlotsList;
	if (slots.length > 0) {
		throw new $SyntaxError$g('es-abstract does not yet support internal slots');
	}

	if ($ObjectCreate$3) {
		return $ObjectCreate$3(proto);
	}
	if (hasProto$3) {
		return { __proto__: proto };
	}

	if (proto === null) {
		throw new $SyntaxError$g('native Object.create support is required to create null objects');
	}
	var T = function T() {};
	T.prototype = proto;
	return new T();
};

var $TypeError$32 = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/7.0/#sec-ordinarygetprototypeof

var OrdinaryGetPrototypeOf$2 = function OrdinaryGetPrototypeOf(O) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$32('Assertion failed: O must be an Object');
	}
	if (!getProto$1) {
		throw new $TypeError$32('This environment does not support fetching prototypes.');
	}
	return getProto$1(O);
};

var $TypeError$33 = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/7.0/#sec-ordinarysetprototypeof

var OrdinarySetPrototypeOf$2 = function OrdinarySetPrototypeOf(O, V) {
	if (Type$4(V) !== 'Object' && Type$4(V) !== 'Null') {
		throw new $TypeError$33('Assertion failed: V must be Object or Null');
	}
	/*
    var extensible = IsExtensible(O);
    var current = OrdinaryGetPrototypeOf(O);
    if (SameValue(V, current)) {
        return true;
    }
    if (!extensible) {
        return false;
    }
    */
	try {
		setProto(O, V);
	} catch (e) {
		return false;
	}
	return OrdinaryGetPrototypeOf$2(O) === V;
	/*
    var p = V;
    var done = false;
    while (!done) {
        if (p === null) {
            done = true;
        } else if (SameValue(p, O)) {
            return false;
        } else {
            if (wat) {
                done = true;
            } else {
                p = p.[[Prototype]];
            }
        }
     }
     O.[[Prototype]] = V;
     return true;
     */
};

var $TypeError$34 = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasproperty

var OrdinaryHasProperty$3 = function OrdinaryHasProperty(O, P) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$34('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$34('Assertion failed: P must be a Property Key');
	}
	return P in O;
};

var $PromiseResolve = callBound('Promise.resolve', true);

// https://ecma-international.org/ecma-262/9.0/#sec-promise-resolve

var PromiseResolve = function PromiseResolve(C, x) {
	if (!$PromiseResolve) {
		throw new SyntaxError('This environment does not support Promises.');
	}
	return $PromiseResolve(C, x);
};

var $TypeError$35 = GetIntrinsic('%TypeError%');

var regexExec$4 = callBound('RegExp.prototype.exec');






// https://ecma-international.org/ecma-262/6.0/#sec-regexpexec

var RegExpExec$3 = function RegExpExec(R, S) {
	if (Type$4(R) !== 'Object') {
		throw new $TypeError$35('Assertion failed: `R` must be an Object');
	}
	if (Type$4(S) !== 'String') {
		throw new $TypeError$35('Assertion failed: `S` must be a String');
	}
	var exec = Get$3(R, 'exec');
	if (IsCallable$4(exec)) {
		var result = Call$3(exec, R, [S]);
		if (result === null || Type$4(result) === 'Object') {
			return result;
		}
		throw new $TypeError$35('"exec" method must return `null` or an Object');
	}
	return regexExec$4(R, S);
};

var $TypeError$36 = GetIntrinsic('%TypeError%');



// https://www.ecma-international.org/ecma-262/7.0/#sec-samevaluenonnumber

var SameValueNonNumber$2 = function SameValueNonNumber(x, y) {
	if (typeof x === 'number' || typeof x !== typeof y) {
		throw new $TypeError$36('SameValueNonNumber requires two non-number values of the same type.');
	}
	return SameValue$4(x, y);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-samevaluezero

var SameValueZero$3 = function SameValueZero(x, y) {
	return (x === y) || (_isNaN(x) && _isNaN(y));
};

var $floor$J = GetIntrinsic('%Math.floor%');



var msPerSecond$f = timeConstants.msPerSecond;
var SecondsPerMinute$5 = timeConstants.SecondsPerMinute;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var SecFromTime$4 = function SecFromTime(t) {
	return mod($floor$J(t / msPerSecond$f), SecondsPerMinute$5);
};

var $TypeError$37 = GetIntrinsic('%TypeError%');





// IE 9 does not throw in strict mode when writability/configurability/extensibility is violated
var noThrowOnStrictViolation$3 = (function () {
	try {
		delete [].length;
		return true;
	} catch (e) {
		return false;
	}
}());

// https://ecma-international.org/ecma-262/6.0/#sec-set-o-p-v-throw

var _Set$3 = function Set(O, P, V, Throw) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$37('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$3(P)) {
		throw new $TypeError$37('Assertion failed: `P` must be a Property Key');
	}
	if (Type$4(Throw) !== 'Boolean') {
		throw new $TypeError$37('Assertion failed: `Throw` must be a Boolean');
	}
	if (Throw) {
		O[P] = V; // eslint-disable-line no-param-reassign
		if (noThrowOnStrictViolation$3 && !SameValue$4(O[P], V)) {
			throw new $TypeError$37('Attempted to assign to readonly property.');
		}
		return true;
	} else {
		try {
			O[P] = V; // eslint-disable-line no-param-reassign
			return noThrowOnStrictViolation$3 ? SameValue$4(O[P], V) : true;
		} catch (e) {
			return false;
		}
	}
};

var $TypeError$38 = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-setfunctionname

var SetFunctionName$3 = function SetFunctionName(F, name) {
	if (typeof F !== 'function') {
		throw new $TypeError$38('Assertion failed: `F` must be a function');
	}
	if (!IsExtensible$3(F) || src(F, 'name')) {
		throw new $TypeError$38('Assertion failed: `F` must be extensible, and must not have a `name` own property');
	}
	var nameType = Type$4(name);
	if (nameType !== 'Symbol' && nameType !== 'String') {
		throw new $TypeError$38('Assertion failed: `name` must be a Symbol or a String');
	}
	if (nameType === 'Symbol') {
		var description = getSymbolDescription(name);
		// eslint-disable-next-line no-param-reassign
		name = typeof description === 'undefined' ? '' : '[' + description + ']';
	}
	if (arguments.length > 2) {
		var prefix = arguments[2];
		// eslint-disable-next-line no-param-reassign
		name = prefix + ' ' + name;
	}
	return DefinePropertyOrThrow$3(F, 'name', {
		'[[Value]]': name,
		'[[Writable]]': false,
		'[[Enumerable]]': false,
		'[[Configurable]]': true
	});
};

var $SyntaxError$h = GetIntrinsic('%SyntaxError%');
var $TypeError$39 = GetIntrinsic('%TypeError%');
var $preventExtensions$7 = GetIntrinsic('%Object.preventExtensions%');

var $gOPN$b = GetIntrinsic('%Object.getOwnPropertyNames%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-setintegritylevel

var SetIntegrityLevel$3 = function SetIntegrityLevel(O, level) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$39('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$39('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	if (!$preventExtensions$7) {
		throw new $SyntaxError$h('SetIntegrityLevel requires native `Object.preventExtensions` support');
	}
	var status = $preventExtensions$7(O);
	if (!status) {
		return false;
	}
	if (!$gOPN$b) {
		throw new $SyntaxError$h('SetIntegrityLevel requires native `Object.getOwnPropertyNames` support');
	}
	var theKeys = $gOPN$b(O);
	if (level === 'sealed') {
		forEach(theKeys, function (k) {
			DefinePropertyOrThrow$3(O, k, { configurable: false });
		});
	} else if (level === 'frozen') {
		forEach(theKeys, function (k) {
			var currentDesc = getOwnPropertyDescriptor(O, k);
			if (typeof currentDesc !== 'undefined') {
				var desc;
				if (IsAccessorDescriptor$4(ToPropertyDescriptor$4(currentDesc))) {
					desc = { configurable: false };
				} else {
					desc = { configurable: false, writable: false };
				}
				DefinePropertyOrThrow$3(O, k, desc);
			}
		});
	}
	return true;
};

var $species$7 = GetIntrinsic('%Symbol.species%', true);
var $TypeError$3a = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-speciesconstructor

var SpeciesConstructor$3 = function SpeciesConstructor(O, defaultConstructor) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$3a('Assertion failed: Type(O) is not Object');
	}
	var C = O.constructor;
	if (typeof C === 'undefined') {
		return defaultConstructor;
	}
	if (Type$4(C) !== 'Object') {
		throw new $TypeError$3a('O.constructor is not an Object');
	}
	var S = $species$7 ? C[$species$7] : void 0;
	if (S == null) {
		return defaultConstructor;
	}
	if (IsConstructor$3(S)) {
		return S;
	}
	throw new $TypeError$3a('no constructor found');
};

var $TypeError$3b = GetIntrinsic('%TypeError%');



var $SymbolToString$3 = callBound('Symbol.prototype.toString', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-symboldescriptivestring

var SymbolDescriptiveString$3 = function SymbolDescriptiveString(sym) {
	if (Type$4(sym) !== 'Symbol') {
		throw new $TypeError$3b('Assertion failed: `sym` must be a Symbol');
	}
	return $SymbolToString$3(sym);
};

var $gOPN$c = GetIntrinsic('%Object.getOwnPropertyNames%');
var $TypeError$3c = GetIntrinsic('%TypeError%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-testintegritylevel

var TestIntegrityLevel$3 = function TestIntegrityLevel(O, level) {
	if (Type$4(O) !== 'Object') {
		throw new $TypeError$3c('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$3c('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	var status = IsExtensible$3(O);
	if (status) {
		return false;
	}
	var theKeys = $gOPN$c(O);
	return theKeys.length === 0 || every(theKeys, function (k) {
		var currentDesc = getOwnPropertyDescriptor(O, k);
		if (typeof currentDesc !== 'undefined') {
			if (currentDesc.configurable) {
				return false;
			}
			if (level === 'frozen' && IsDataDescriptor$4(ToPropertyDescriptor$4(currentDesc)) && currentDesc.writable) {
				return false;
			}
		}
		return true;
	});
};

var $BooleanValueOf$3 = callBound('Boolean.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-boolean-prototype-object

var thisBooleanValue$3 = function thisBooleanValue(value) {
	if (Type$4(value) === 'Boolean') {
		return value;
	}

	return $BooleanValueOf$3(value);
};

var $NumberValueOf$3 = callBound('Number.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-number-prototype-object

var thisNumberValue$3 = function thisNumberValue(value) {
	if (Type$4(value) === 'Number') {
		return value;
	}

	return $NumberValueOf$3(value);
};

var $StringValueOf$3 = callBound('String.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-string-prototype-object

var thisStringValue$3 = function thisStringValue(value) {
	if (Type$4(value) === 'String') {
		return value;
	}

	return $StringValueOf$3(value);
};

var $SymbolValueOf$1 = callBound('Symbol.prototype.valueOf', true);



// https://ecma-international.org/ecma-262/9.0/#sec-thissymbolvalue

var thisSymbolValue$1 = function thisSymbolValue(value) {
	if (!$SymbolValueOf$1) {
		throw new SyntaxError('Symbols are not supported; thisSymbolValue requires that `value` be a Symbol or a Symbol object');
	}
	if (Type$4(value) === 'Symbol') {
		return value;
	}
	return $SymbolValueOf$1(value);
};

var $DateValueOf$3 = callBound('Date.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-date-prototype-object

var thisTimeValue$3 = function thisTimeValue(value) {
	return $DateValueOf$3(value);
};

var $Date$c = GetIntrinsic('%Date%');
var $Number$e = GetIntrinsic('%Number%');
var $abs$g = GetIntrinsic('%Math.abs%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.14

var TimeClip$4 = function TimeClip(time) {
	if (!_isFinite(time) || $abs$g(time) > 8.64e15) {
		return NaN;
	}
	return $Number$e(new $Date$c(ToNumber$4(time)));
};

var msPerDay$j = timeConstants.msPerDay;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var TimeFromYear$4 = function TimeFromYear(y) {
	return msPerDay$j * DayFromYear$4(y);
};

var $TypeError$3d = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/9.0/#sec-timestring

var TimeString = function TimeString(tv) {
	if (Type$4(tv) !== 'Number' || _isNaN(tv)) {
		throw new $TypeError$3d('Assertion failed: `tv` must be a non-NaN Number');
	}
	var hour = HourFromTime$4(tv);
	var minute = MinFromTime$4(tv);
	var second = SecFromTime$4(tv);
	return padTimeComponent(hour) + ':' + padTimeComponent(minute) + ':' + padTimeComponent(second) + '\x20GMT';
};

var msPerDay$k = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var TimeWithinDay$4 = function TimeWithinDay(t) {
	return mod(t, msPerDay$k);
};

var $TypeError$3e = GetIntrinsic('%TypeError%');
var $Date$d = GetIntrinsic('%Date%');





// https://ecma-international.org/ecma-262/6.0/#sec-todatestring

var ToDateString$3 = function ToDateString(tv) {
	if (Type$4(tv) !== 'Number') {
		throw new $TypeError$3e('Assertion failed: `tv` must be a Number');
	}
	if (_isNaN(tv)) {
		return 'Invalid Date';
	}
	return $Date$d(tv);
};

var $RangeError$9 = GetIntrinsic('%RangeError%');





// https://www.ecma-international.org/ecma-262/8.0/#sec-toindex

var ToIndex$1 = function ToIndex(value) {
	if (typeof value === 'undefined') {
		return 0;
	}
	var integerIndex = ToInteger$4(value);
	if (integerIndex < 0) {
		throw new $RangeError$9('index must be >= 0');
	}
	var index = ToLength$3(integerIndex);
	if (!SameValueZero$3(integerIndex, index)) {
		throw new $RangeError$9('index must be >= 0 and < 2 ** 53 - 1');
	}
	return index;
};

var $Math$g = GetIntrinsic('%Math%');








var $floor$K = $Math$g.floor;
var $abs$h = $Math$g.abs;

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.7

var ToUint16$4 = function ToUint16(value) {
	var number = ToNumber$4(value);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$K($abs$h(number));
	return mod(posInt, 0x10000);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint16

var ToInt16$3 = function ToInt16(argument) {
	var int16bit = ToUint16$4(argument);
	return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.5

var ToInt32$4 = function ToInt32(x) {
	return ToNumber$4(x) >> 0;
};

var $Math$h = GetIntrinsic('%Math%');








var $floor$L = $Math$h.floor;
var $abs$i = $Math$h.abs;

var ToUint8$3 = function ToUint8(argument) {
	var number = ToNumber$4(argument);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$L($abs$i(number));
	return mod(posInt, 0x100);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint8

var ToInt8$3 = function ToInt8(argument) {
	var int8bit = ToUint8$3(argument);
	return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
};

var $String$9 = GetIntrinsic('%String%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-topropertykey

var ToPropertyKey$3 = function ToPropertyKey(argument) {
	var key = ToPrimitive$4(argument, $String$9);
	return typeof key === 'symbol' ? key : ToString$4(key);
};

var $Math$i = GetIntrinsic('%Math%');





var $floor$M = $Math$i.floor;

// https://www.ecma-international.org/ecma-262/6.0/#sec-touint8clamp

var ToUint8Clamp$3 = function ToUint8Clamp(argument) {
	var number = ToNumber$4(argument);
	if (_isNaN(number) || number <= 0) { return 0; }
	if (number >= 0xFF) { return 0xFF; }
	var f = $floor$M(argument);
	if (f + 0.5 < number) { return f + 1; }
	if (number < f + 0.5) { return f; }
	if (f % 2 !== 0) { return f + 1; }
	return f;
};

/* eslint global-require: 0 */
// https://www.ecma-international.org/ecma-262/9.0/#sec-abstract-operations
var ES2018 = {
	'Abstract Equality Comparison': AbstractEqualityComparison$4,
	'Abstract Relational Comparison': AbstractRelationalComparison$4,
	'Strict Equality Comparison': StrictEqualityComparison$4,
	AdvanceStringIndex: AdvanceStringIndex$3,
	ArrayCreate: ArrayCreate$3,
	ArraySetLength: ArraySetLength$3,
	ArraySpeciesCreate: ArraySpeciesCreate$3,
	Call: Call$3,
	CanonicalNumericIndexString: CanonicalNumericIndexString$3,
	CompletePropertyDescriptor: CompletePropertyDescriptor$3,
	CopyDataProperties: CopyDataProperties,
	CreateDataProperty: CreateDataProperty$3,
	CreateDataPropertyOrThrow: CreateDataPropertyOrThrow$3,
	CreateHTML: CreateHTML$3,
	CreateIterResultObject: CreateIterResultObject$3,
	CreateListFromArrayLike: CreateListFromArrayLike$3,
	CreateMethodProperty: CreateMethodProperty$3,
	DateFromTime: DateFromTime$4,
	DateString: DateString,
	Day: Day$4,
	DayFromYear: DayFromYear$4,
	DaysInYear: DaysInYear$4,
	DayWithinYear: DayWithinYear$4,
	DefinePropertyOrThrow: DefinePropertyOrThrow$3,
	DeletePropertyOrThrow: DeletePropertyOrThrow$3,
	EnumerableOwnPropertyNames: EnumerableOwnPropertyNames,
	FromPropertyDescriptor: FromPropertyDescriptor$4,
	Get: Get$3,
	GetIterator: GetIterator$3,
	GetMethod: GetMethod$4,
	GetOwnPropertyKeys: GetOwnPropertyKeys$3,
	GetPrototypeFromConstructor: GetPrototypeFromConstructor$3,
	GetSubstitution: GetSubstitution$3,
	GetV: GetV$3,
	HasOwnProperty: HasOwnProperty$3,
	HasProperty: HasProperty$3,
	HourFromTime: HourFromTime$4,
	InLeapYear: InLeapYear$4,
	InstanceofOperator: InstanceofOperator$3,
	Invoke: Invoke$3,
	IsAccessorDescriptor: IsAccessorDescriptor$4,
	IsArray: IsArray$3,
	IsCallable: IsCallable$4,
	IsConcatSpreadable: IsConcatSpreadable$3,
	IsConstructor: IsConstructor$3,
	IsDataDescriptor: IsDataDescriptor$4,
	IsExtensible: IsExtensible$3,
	IsGenericDescriptor: IsGenericDescriptor$4,
	IsInteger: IsInteger$3,
	IsPromise: IsPromise$3,
	IsPropertyKey: IsPropertyKey$3,
	IsRegExp: IsRegExp$3,
	IsStringPrefix: IsStringPrefix,
	IterableToList: IterableToList$1,
	IteratorClose: IteratorClose$3,
	IteratorComplete: IteratorComplete$3,
	IteratorNext: IteratorNext$3,
	IteratorStep: IteratorStep$3,
	IteratorValue: IteratorValue$3,
	MakeDate: MakeDate$4,
	MakeDay: MakeDay$4,
	MakeTime: MakeTime$4,
	MinFromTime: MinFromTime$4,
	modulo: modulo$4,
	MonthFromTime: MonthFromTime$4,
	msFromTime: msFromTime$4,
	NumberToString: NumberToString,
	ObjectCreate: ObjectCreate$3,
	OrdinaryDefineOwnProperty: OrdinaryDefineOwnProperty$3,
	OrdinaryGetOwnProperty: OrdinaryGetOwnProperty$3,
	OrdinaryGetPrototypeOf: OrdinaryGetPrototypeOf$2,
	OrdinarySetPrototypeOf: OrdinarySetPrototypeOf$2,
	OrdinaryHasInstance: OrdinaryHasInstance$3,
	OrdinaryHasProperty: OrdinaryHasProperty$3,
	PromiseResolve: PromiseResolve,
	RegExpExec: RegExpExec$3,
	RequireObjectCoercible: RequireObjectCoercible$3,
	SameValue: SameValue$4,
	SameValueNonNumber: SameValueNonNumber$2,
	SameValueZero: SameValueZero$3,
	SecFromTime: SecFromTime$4,
	Set: _Set$3,
	SetFunctionName: SetFunctionName$3,
	SetIntegrityLevel: SetIntegrityLevel$3,
	SpeciesConstructor: SpeciesConstructor$3,
	SymbolDescriptiveString: SymbolDescriptiveString$3,
	TestIntegrityLevel: TestIntegrityLevel$3,
	thisBooleanValue: thisBooleanValue$3,
	thisNumberValue: thisNumberValue$3,
	thisStringValue: thisStringValue$3,
	thisSymbolValue: thisSymbolValue$1,
	thisTimeValue: thisTimeValue$3,
	TimeClip: TimeClip$4,
	TimeFromYear: TimeFromYear$4,
	TimeString: TimeString,
	TimeWithinDay: TimeWithinDay$4,
	ToBoolean: ToBoolean$4,
	ToDateString: ToDateString$3,
	ToIndex: ToIndex$1,
	ToInt16: ToInt16$3,
	ToInt32: ToInt32$4,
	ToInt8: ToInt8$3,
	ToInteger: ToInteger$4,
	ToLength: ToLength$3,
	ToNumber: ToNumber$4,
	ToObject: ToObject$4,
	ToPrimitive: ToPrimitive$4,
	ToPropertyDescriptor: ToPropertyDescriptor$4,
	ToPropertyKey: ToPropertyKey$3,
	ToString: ToString$4,
	ToUint16: ToUint16$4,
	ToUint32: ToUint32$4,
	ToUint8: ToUint8$3,
	ToUint8Clamp: ToUint8Clamp$3,
	Type: Type$4,
	ValidateAndApplyPropertyDescriptor: ValidateAndApplyPropertyDescriptor$3,
	WeekDay: WeekDay$4,
	YearFromTime: YearFromTime$4
};

var es2018 = ES2018;

// https://www.ecma-international.org/ecma-262/6.0/#sec-toprimitive

var ToPrimitive$5 = function ToPrimitive(input) {
	if (arguments.length > 1) {
		return es2015(input, arguments[1]);
	}
	return es2015(input);
};

var $TypeError$3f = GetIntrinsic('%TypeError%');
var $Number$f = GetIntrinsic('%Number%');
var $RegExp$4 = GetIntrinsic('%RegExp%');
var $parseInteger$4 = GetIntrinsic('%parseInt%');





var $strSlice$a = callBound('String.prototype.slice');
var isBinary$4 = regexTester(/^0b[01]+$/i);
var isOctal$4 = regexTester(/^0o[0-7]+$/i);
var isInvalidHexLiteral$4 = regexTester(/^[-+]0x[0-9a-f]+$/i);
var nonWS$4 = ['\u0085', '\u200b', '\ufffe'].join('');
var nonWSregex$4 = new $RegExp$4('[' + nonWS$4 + ']', 'g');
var hasNonWS$4 = regexTester(nonWSregex$4);

// whitespace from: https://es5.github.io/#x15.5.4.20
// implementation from https://github.com/es-shims/es5-shim/blob/v3.4.0/es5-shim.js#L1304-L1324
var ws$4 = [
	'\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003',
	'\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028',
	'\u2029\uFEFF'
].join('');
var trimRegex$4 = new RegExp('(^[' + ws$4 + ']+)|([' + ws$4 + ']+$)', 'g');
var $replace$9 = callBound('String.prototype.replace');
var $trim$4 = function (value) {
	return $replace$9(value, trimRegex$4, '');
};



// https://www.ecma-international.org/ecma-262/6.0/#sec-tonumber

var ToNumber$5 = function ToNumber(argument) {
	var value = isPrimitive$1(argument) ? argument : ToPrimitive$5(argument, $Number$f);
	if (typeof value === 'symbol') {
		throw new $TypeError$3f('Cannot convert a Symbol value to a number');
	}
	if (typeof value === 'string') {
		if (isBinary$4(value)) {
			return ToNumber($parseInteger$4($strSlice$a(value, 2), 2));
		} else if (isOctal$4(value)) {
			return ToNumber($parseInteger$4($strSlice$a(value, 2), 8));
		} else if (hasNonWS$4(value) || isInvalidHexLiteral$4(value)) {
			return NaN;
		} else {
			var trimmed = $trim$4(value);
			if (trimmed !== value) {
				return ToNumber(trimmed);
			}
		}
	}
	return $Number$f(value);
};

// https://ecma-international.org/ecma-262/6.0/#sec-ecmascript-data-types-and-values

var Type$5 = function Type$1(x) {
	if (typeof x === 'symbol') {
		return 'Symbol';
	}
	return Type(x);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-abstract-equality-comparison

var AbstractEqualityComparison$5 = function AbstractEqualityComparison(x, y) {
	var xType = Type$5(x);
	var yType = Type$5(y);
	if (xType === yType) {
		return x === y; // ES6+ specified this shortcut anyways.
	}
	if (x == null && y == null) {
		return true;
	}
	if (xType === 'Number' && yType === 'String') {
		return AbstractEqualityComparison(x, ToNumber$5(y));
	}
	if (xType === 'String' && yType === 'Number') {
		return AbstractEqualityComparison(ToNumber$5(x), y);
	}
	if (xType === 'Boolean') {
		return AbstractEqualityComparison(ToNumber$5(x), y);
	}
	if (yType === 'Boolean') {
		return AbstractEqualityComparison(x, ToNumber$5(y));
	}
	if ((xType === 'String' || xType === 'Number' || xType === 'Symbol') && yType === 'Object') {
		return AbstractEqualityComparison(x, ToPrimitive$5(y));
	}
	if (xType === 'Object' && (yType === 'String' || yType === 'Number' || yType === 'Symbol')) {
		return AbstractEqualityComparison(ToPrimitive$5(x), y);
	}
	return false;
};

var $Number$g = GetIntrinsic('%Number%');
var $TypeError$3g = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/5.1/#sec-11.8.5

// eslint-disable-next-line max-statements
var AbstractRelationalComparison$5 = function AbstractRelationalComparison(x, y, LeftFirst) {
	if (Type$5(LeftFirst) !== 'Boolean') {
		throw new $TypeError$3g('Assertion failed: LeftFirst argument must be a Boolean');
	}
	var px;
	var py;
	if (LeftFirst) {
		px = ToPrimitive$5(x, $Number$g);
		py = ToPrimitive$5(y, $Number$g);
	} else {
		py = ToPrimitive$5(y, $Number$g);
		px = ToPrimitive$5(x, $Number$g);
	}
	var bothStrings = Type$5(px) === 'String' && Type$5(py) === 'String';
	if (!bothStrings) {
		var nx = ToNumber$5(px);
		var ny = ToNumber$5(py);
		if (_isNaN(nx) || _isNaN(ny)) {
			return undefined;
		}
		if (_isFinite(nx) && _isFinite(ny) && nx === ny) {
			return false;
		}
		if (nx === 0 && ny === 0) {
			return false;
		}
		if (nx === Infinity) {
			return false;
		}
		if (ny === Infinity) {
			return true;
		}
		if (ny === -Infinity) {
			return false;
		}
		if (nx === -Infinity) {
			return true;
		}
		return nx < ny; // by now, these are both nonzero, finite, and not equal
	}
	if (isPrefixOf(py, px)) {
		return false;
	}
	if (isPrefixOf(px, py)) {
		return true;
	}
	return px < py; // both strings, neither a prefix of the other. shortcut for steps c-f
};

// https://www.ecma-international.org/ecma-262/5.1/#sec-11.9.6

var StrictEqualityComparison$5 = function StrictEqualityComparison(x, y) {
	var xType = Type$5(x);
	var yType = Type$5(y);
	if (xType !== yType) {
		return false;
	}
	if (xType === 'Undefined' || xType === 'Null') {
		return true;
	}
	return x === y; // shortcut for steps 4-7
};

var $apply$5 = GetIntrinsic('%Reflect.apply%', true) || callBound('%Function.prototype.apply%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-call

var Call$4 = function Call(F, V) {
	var args = arguments.length > 2 ? arguments[2] : [];
	return $apply$5(F, V, args);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-ispropertykey

var IsPropertyKey$4 = function IsPropertyKey(argument) {
	return typeof argument === 'string' || typeof argument === 'symbol';
};

var $TypeError$3h = GetIntrinsic('%TypeError%');






/**
 * 7.3.1 Get (O, P) - https://ecma-international.org/ecma-262/6.0/#sec-get-o-p
 * 1. Assert: Type(O) is Object.
 * 2. Assert: IsPropertyKey(P) is true.
 * 3. Return O.[[Get]](P, O).
 */

var Get$4 = function Get(O, P) {
	// 7.3.1.1
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3h('Assertion failed: Type(O) is not Object');
	}
	// 7.3.1.2
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3h('Assertion failed: IsPropertyKey(P) is not true, got ' + objectInspect(P));
	}
	// 7.3.1.3
	return O[P];
};

var $Math$j = GetIntrinsic('%Math%');

var $floor$N = $Math$j.floor;
var $abs$j = $Math$j.abs;




// https://www.ecma-international.org/ecma-262/6.0/#sec-isinteger

var IsInteger$4 = function IsInteger(argument) {
	if (typeof argument !== 'number' || _isNaN(argument) || !_isFinite(argument)) {
		return false;
	}
	var abs = $abs$j(argument);
	return $floor$N(abs) === abs;
};

var $TypeError$3i = GetIntrinsic('%TypeError%');

var $charCodeAt$4 = callBound('String.prototype.charCodeAt');

// https://ecma-international.org/ecma-262/6.0/#sec-advancestringindex

var AdvanceStringIndex$4 = function AdvanceStringIndex(S, index, unicode) {
	if (Type$5(S) !== 'String') {
		throw new $TypeError$3i('Assertion failed: `S` must be a String');
	}
	if (!IsInteger$4(index) || index < 0 || index > maxSafeInteger) {
		throw new $TypeError$3i('Assertion failed: `length` must be an integer >= 0 and <= 2**53');
	}
	if (Type$5(unicode) !== 'Boolean') {
		throw new $TypeError$3i('Assertion failed: `unicode` must be a Boolean');
	}
	if (!unicode) {
		return index + 1;
	}
	var length = S.length;
	if ((index + 1) >= length) {
		return index + 1;
	}

	var first = $charCodeAt$4(S, index);
	if (first < 0xD800 || first > 0xDBFF) {
		return index + 1;
	}

	var second = $charCodeAt$4(S, index + 1);
	if (second < 0xDC00 || second > 0xDFFF) {
		return index + 1;
	}

	return index + 2;
};

var RequireObjectCoercible$4 = CheckObjectCoercible;

var $Object$9 = GetIntrinsic('%Object%');



// https://www.ecma-international.org/ecma-262/6.0/#sec-toobject

var ToObject$5 = function ToObject(value) {
	RequireObjectCoercible$4(value);
	return $Object$9(value);
};

var $TypeError$3j = GetIntrinsic('%TypeError%');




/**
 * 7.3.2 GetV (V, P)
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let O be ToObject(V).
 * 3. ReturnIfAbrupt(O).
 * 4. Return O.[[Get]](P, V).
 */

var GetV$4 = function GetV(V, P) {
	// 7.3.2.1
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3j('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.2.2-3
	var O = ToObject$5(V);

	// 7.3.2.4
	return O[P];
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.11

var IsCallable$5 = isCallable;

var $TypeError$3k = GetIntrinsic('%TypeError%');





/**
 * 7.3.9 - https://ecma-international.org/ecma-262/6.0/#sec-getmethod
 * 1. Assert: IsPropertyKey(P) is true.
 * 2. Let func be GetV(O, P).
 * 3. ReturnIfAbrupt(func).
 * 4. If func is either undefined or null, return undefined.
 * 5. If IsCallable(func) is false, throw a TypeError exception.
 * 6. Return func.
 */

var GetMethod$5 = function GetMethod(O, P) {
	// 7.3.9.1
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3k('Assertion failed: IsPropertyKey(P) is not true');
	}

	// 7.3.9.2
	var func = GetV$4(O, P);

	// 7.3.9.4
	if (func == null) {
		return void 0;
	}

	// 7.3.9.5
	if (!IsCallable$5(func)) {
		throw new $TypeError$3k(P + 'is not a function');
	}

	// 7.3.9.6
	return func;
};

var $Array$8 = GetIntrinsic('%Array%');

// eslint-disable-next-line global-require
var toStr$d = !$Array$8.isArray && callBound('Object.prototype.toString');

// https://www.ecma-international.org/ecma-262/6.0/#sec-isarray

var IsArray$4 = $Array$8.isArray || function IsArray(argument) {
	return toStr$d(argument) === '[object Array]';
};

var $TypeError$3l = GetIntrinsic('%TypeError%');








// https://ecma-international.org/ecma-262/6.0/#sec-getiterator

var GetIterator$4 = function GetIterator(obj, method) {
	var actualMethod = method;
	if (arguments.length < 2) {
		actualMethod = getIteratorMethod(
			{
				AdvanceStringIndex: AdvanceStringIndex$4,
				GetMethod: GetMethod$5,
				IsArray: IsArray$4,
				Type: Type$5
			},
			obj
		);
	}
	var iterator = Call$4(actualMethod, obj);
	if (Type$5(iterator) !== 'Object') {
		throw new $TypeError$3l('iterator must return an object');
	}

	return iterator;
};

var $TypeError$3m = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-iteratorclose

var IteratorClose$4 = function IteratorClose(iterator, completion) {
	if (Type$5(iterator) !== 'Object') {
		throw new $TypeError$3m('Assertion failed: Type(iterator) is not Object');
	}
	if (!IsCallable$5(completion)) {
		throw new $TypeError$3m('Assertion failed: completion is not a thunk for a Completion Record');
	}
	var completionThunk = completion;

	var iteratorReturn = GetMethod$5(iterator, 'return');

	if (typeof iteratorReturn === 'undefined') {
		return completionThunk();
	}

	var completionRecord;
	try {
		var innerResult = Call$4(iteratorReturn, iterator, []);
	} catch (e) {
		// if we hit here, then "e" is the innerResult completion that needs re-throwing

		// if the completion is of type "throw", this will throw.
		completionThunk();
		completionThunk = null; // ensure it's not called twice.

		// if not, then return the innerResult completion
		throw e;
	}
	completionRecord = completionThunk(); // if innerResult worked, then throw if the completion does
	completionThunk = null; // ensure it's not called twice.

	if (Type$5(innerResult) !== 'Object') {
		throw new $TypeError$3m('iterator .return must return an object');
	}

	return completionRecord;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.2

var ToBoolean$5 = function ToBoolean(value) { return !!value; };

var $TypeError$3n = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-iteratorcomplete

var IteratorComplete$4 = function IteratorComplete(iterResult) {
	if (Type$5(iterResult) !== 'Object') {
		throw new $TypeError$3n('Assertion failed: Type(iterResult) is not Object');
	}
	return ToBoolean$5(Get$4(iterResult, 'done'));
};

var $TypeError$3o = GetIntrinsic('%TypeError%');

var $arraySlice$4 = callBound('Array.prototype.slice');





// https://ecma-international.org/ecma-262/6.0/#sec-invoke

var Invoke$4 = function Invoke(O, P) {
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3o('P must be a Property Key');
	}
	var argumentsList = $arraySlice$4(arguments, 2);
	var func = GetV$4(O, P);
	return Call$4(func, O, argumentsList);
};

var $TypeError$3p = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratornext

var IteratorNext$4 = function IteratorNext(iterator, value) {
	var result = Invoke$4(iterator, 'next', arguments.length < 2 ? [] : [value]);
	if (Type$5(result) !== 'Object') {
		throw new $TypeError$3p('iterator next must return an object');
	}
	return result;
};

// https://ecma-international.org/ecma-262/6.0/#sec-iteratorstep

var IteratorStep$4 = function IteratorStep(iterator) {
	var result = IteratorNext$4(iterator);
	var done = IteratorComplete$4(result);
	return done === true ? false : result;
};

var $TypeError$3q = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-iteratorvalue

var IteratorValue$4 = function IteratorValue(iterResult) {
	if (Type$5(iterResult) !== 'Object') {
		throw new $TypeError$3q('Assertion failed: Type(iterResult) is not Object');
	}
	return Get$4(iterResult, 'value');
};

var $TypeError$3r = GetIntrinsic('%TypeError%');










// https://tc39.es/ecma262/#sec-add-entries-from-iterable

var AddEntriesFromIterable = function AddEntriesFromIterable(target, iterable, adder) {
	if (!IsCallable$5(adder)) {
		throw new $TypeError$3r('Assertion failed: `adder` is not callable');
	}
	if (iterable == null) {
		throw new $TypeError$3r('Assertion failed: `iterable` is present, and not nullish');
	}
	var iteratorRecord = GetIterator$4(iterable);
	while (true) { // eslint-disable-line no-constant-condition
		var next = IteratorStep$4(iteratorRecord);
		if (!next) {
			return target;
		}
		var nextItem = IteratorValue$4(next);
		if (Type$5(nextItem) !== 'Object') {
			var error = new $TypeError$3r('iterator next must return an Object, got ' + objectInspect(nextItem));
			return IteratorClose$4(
				iteratorRecord,
				function () { throw error; } // eslint-disable-line no-loop-func
			);
		}
		try {
			var k = Get$4(nextItem, '0');
			var v = Get$4(nextItem, '1');
			Call$4(adder, target, [k, v]);
		} catch (e) {
			return IteratorClose$4(
				iteratorRecord,
				function () { throw e; }
			);
		}
	}
};

var $ArrayPrototype$4 = GetIntrinsic('%Array.prototype%');
var $RangeError$a = GetIntrinsic('%RangeError%');
var $SyntaxError$i = GetIntrinsic('%SyntaxError%');
var $TypeError$3s = GetIntrinsic('%TypeError%');



var MAX_ARRAY_LENGTH$4 = Math.pow(2, 32) - 1;

var $setProto$4 = GetIntrinsic('%Object.setPrototypeOf%', true) || (
	// eslint-disable-next-line no-proto, no-negated-condition
	[].__proto__ !== $ArrayPrototype$4
		? null
		: function (O, proto) {
			O.__proto__ = proto; // eslint-disable-line no-proto, no-param-reassign
			return O;
		}
);

// https://www.ecma-international.org/ecma-262/6.0/#sec-arraycreate

var ArrayCreate$4 = function ArrayCreate(length) {
	if (!IsInteger$4(length) || length < 0) {
		throw new $TypeError$3s('Assertion failed: `length` must be an integer Number >= 0');
	}
	if (length > MAX_ARRAY_LENGTH$4) {
		throw new $RangeError$a('length is greater than (2**32 - 1)');
	}
	var proto = arguments.length > 1 ? arguments[1] : $ArrayPrototype$4;
	var A = []; // steps 5 - 7, and 9
	if (proto !== $ArrayPrototype$4) { // step 8
		if (!$setProto$4) {
			throw new $SyntaxError$i('ArrayCreate: a `proto` argument that is not `Array.prototype` is not supported in an environment that does not support setting the [[Prototype]]');
		}
		$setProto$4(A, proto);
	}
	if (length !== 0) { // bypasses the need for step 2
		A.length = length;
	}
	/* step 10, the above as a shortcut for the below
    OrdinaryDefineOwnProperty(A, 'length', {
        '[[Configurable]]': false,
        '[[Enumerable]]': false,
        '[[Value]]': length,
        '[[Writable]]': true
    });
    */
	return A;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isaccessordescriptor

var IsAccessorDescriptor$5 = function IsAccessorDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$5, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Get]]') && !src(Desc, '[[Set]]')) {
		return false;
	}

	return true;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isdatadescriptor

var IsDataDescriptor$5 = function IsDataDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$5, 'Property Descriptor', 'Desc', Desc);

	if (!src(Desc, '[[Value]]') && !src(Desc, '[[Writable]]')) {
		return false;
	}

	return true;
};

var $Object$a = GetIntrinsic('%Object%');



var $preventExtensions$8 = $Object$a.preventExtensions;
var $isExtensible$4 = $Object$a.isExtensible;

// https://www.ecma-international.org/ecma-262/6.0/#sec-isextensible-o

var IsExtensible$4 = $preventExtensions$8
	? function IsExtensible(obj) {
		return !isPrimitive$1(obj) && $isExtensible$4(obj);
	}
	: function IsExtensible(obj) {
		return !isPrimitive$1(obj);
	};

var $TypeError$3t = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/5.1/#sec-8.10.5

var ToPropertyDescriptor$5 = function ToPropertyDescriptor(Obj) {
	if (Type$5(Obj) !== 'Object') {
		throw new $TypeError$3t('ToPropertyDescriptor requires an object');
	}

	var desc = {};
	if (src(Obj, 'enumerable')) {
		desc['[[Enumerable]]'] = ToBoolean$5(Obj.enumerable);
	}
	if (src(Obj, 'configurable')) {
		desc['[[Configurable]]'] = ToBoolean$5(Obj.configurable);
	}
	if (src(Obj, 'value')) {
		desc['[[Value]]'] = Obj.value;
	}
	if (src(Obj, 'writable')) {
		desc['[[Writable]]'] = ToBoolean$5(Obj.writable);
	}
	if (src(Obj, 'get')) {
		var getter = Obj.get;
		if (typeof getter !== 'undefined' && !IsCallable$5(getter)) {
			throw new TypeError('getter must be a function');
		}
		desc['[[Get]]'] = getter;
	}
	if (src(Obj, 'set')) {
		var setter = Obj.set;
		if (typeof setter !== 'undefined' && !IsCallable$5(setter)) {
			throw new $TypeError$3t('setter must be a function');
		}
		desc['[[Set]]'] = setter;
	}

	if ((src(desc, '[[Get]]') || src(desc, '[[Set]]')) && (src(desc, '[[Value]]') || src(desc, '[[Writable]]'))) {
		throw new $TypeError$3t('Invalid property descriptor. Cannot both specify accessors and a value or writable attribute');
	}
	return desc;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.12

var SameValue$5 = function SameValue(x, y) {
	if (x === y) { // 0 === -0, but they are not identical.
		if (x === 0) { return 1 / x === 1 / y; }
		return true;
	}
	return _isNaN(x) && _isNaN(y);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-frompropertydescriptor

var FromPropertyDescriptor$5 = function FromPropertyDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return Desc;
	}

	assertRecord(Type$5, 'Property Descriptor', 'Desc', Desc);

	var obj = {};
	if ('[[Value]]' in Desc) {
		obj.value = Desc['[[Value]]'];
	}
	if ('[[Writable]]' in Desc) {
		obj.writable = Desc['[[Writable]]'];
	}
	if ('[[Get]]' in Desc) {
		obj.get = Desc['[[Get]]'];
	}
	if ('[[Set]]' in Desc) {
		obj.set = Desc['[[Set]]'];
	}
	if ('[[Enumerable]]' in Desc) {
		obj.enumerable = Desc['[[Enumerable]]'];
	}
	if ('[[Configurable]]' in Desc) {
		obj.configurable = Desc['[[Configurable]]'];
	}
	return obj;
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-isgenericdescriptor

var IsGenericDescriptor$5 = function IsGenericDescriptor(Desc) {
	if (typeof Desc === 'undefined') {
		return false;
	}

	assertRecord(Type$5, 'Property Descriptor', 'Desc', Desc);

	if (!IsAccessorDescriptor$5(Desc) && !IsDataDescriptor$5(Desc)) {
		return true;
	}

	return false;
};

var $TypeError$3u = GetIntrinsic('%TypeError%');













// https://www.ecma-international.org/ecma-262/6.0/#sec-validateandapplypropertydescriptor
// https://www.ecma-international.org/ecma-262/8.0/#sec-validateandapplypropertydescriptor

// eslint-disable-next-line max-lines-per-function, max-statements, max-params
var ValidateAndApplyPropertyDescriptor$4 = function ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current) {
	// this uses the ES2017+ logic, since it fixes a number of bugs in the ES2015 logic.
	var oType = Type$5(O);
	if (oType !== 'Undefined' && oType !== 'Object') {
		throw new $TypeError$3u('Assertion failed: O must be undefined or an Object');
	}
	if (Type$5(extensible) !== 'Boolean') {
		throw new $TypeError$3u('Assertion failed: extensible must be a Boolean');
	}
	if (!isPropertyDescriptor({
		Type: Type$5,
		IsDataDescriptor: IsDataDescriptor$5,
		IsAccessorDescriptor: IsAccessorDescriptor$5
	}, Desc)) {
		throw new $TypeError$3u('Assertion failed: Desc must be a Property Descriptor');
	}
	if (Type$5(current) !== 'Undefined' && !isPropertyDescriptor({
		Type: Type$5,
		IsDataDescriptor: IsDataDescriptor$5,
		IsAccessorDescriptor: IsAccessorDescriptor$5
	}, current)) {
		throw new $TypeError$3u('Assertion failed: current must be a Property Descriptor, or undefined');
	}
	if (oType !== 'Undefined' && !IsPropertyKey$4(P)) {
		throw new $TypeError$3u('Assertion failed: if O is not undefined, P must be a Property Key');
	}
	if (Type$5(current) === 'Undefined') {
		if (!extensible) {
			return false;
		}
		if (IsGenericDescriptor$5(Desc) || IsDataDescriptor$5(Desc)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$5,
					SameValue$5,
					FromPropertyDescriptor$5,
					O,
					P,
					{
						'[[Configurable]]': Desc['[[Configurable]]'],
						'[[Enumerable]]': Desc['[[Enumerable]]'],
						'[[Value]]': Desc['[[Value]]'],
						'[[Writable]]': Desc['[[Writable]]']
					}
				);
			}
		} else {
			if (!IsAccessorDescriptor$5(Desc)) {
				throw new $TypeError$3u('Assertion failed: Desc is not an accessor descriptor');
			}
			if (oType !== 'Undefined') {
				return DefineOwnProperty(
					IsDataDescriptor$5,
					SameValue$5,
					FromPropertyDescriptor$5,
					O,
					P,
					Desc
				);
			}
		}
		return true;
	}
	if (IsGenericDescriptor$5(Desc) && !('[[Configurable]]' in Desc) && !('[[Enumerable]]' in Desc)) {
		return true;
	}
	if (isSamePropertyDescriptor({ SameValue: SameValue$5 }, Desc, current)) {
		return true; // removed by ES2017, but should still be correct
	}
	// "if every field in Desc is absent, return true" can't really match the assertion that it's a Property Descriptor
	if (!current['[[Configurable]]']) {
		if (Desc['[[Configurable]]']) {
			return false;
		}
		if ('[[Enumerable]]' in Desc && !Desc['[[Enumerable]]'] === !!current['[[Enumerable]]']) {
			return false;
		}
	}
	if (IsGenericDescriptor$5(Desc)) ; else if (IsDataDescriptor$5(current) !== IsDataDescriptor$5(Desc)) {
		if (!current['[[Configurable]]']) {
			return false;
		}
		if (IsDataDescriptor$5(current)) {
			if (oType !== 'Undefined') {
				DefineOwnProperty(
					IsDataDescriptor$5,
					SameValue$5,
					FromPropertyDescriptor$5,
					O,
					P,
					{
						'[[Configurable]]': current['[[Configurable]]'],
						'[[Enumerable]]': current['[[Enumerable]]'],
						'[[Get]]': undefined
					}
				);
			}
		} else if (oType !== 'Undefined') {
			DefineOwnProperty(
				IsDataDescriptor$5,
				SameValue$5,
				FromPropertyDescriptor$5,
				O,
				P,
				{
					'[[Configurable]]': current['[[Configurable]]'],
					'[[Enumerable]]': current['[[Enumerable]]'],
					'[[Value]]': undefined
				}
			);
		}
	} else if (IsDataDescriptor$5(current) && IsDataDescriptor$5(Desc)) {
		if (!current['[[Configurable]]'] && !current['[[Writable]]']) {
			if ('[[Writable]]' in Desc && Desc['[[Writable]]']) {
				return false;
			}
			if ('[[Value]]' in Desc && !SameValue$5(Desc['[[Value]]'], current['[[Value]]'])) {
				return false;
			}
			return true;
		}
	} else if (IsAccessorDescriptor$5(current) && IsAccessorDescriptor$5(Desc)) {
		if (!current['[[Configurable]]']) {
			if ('[[Set]]' in Desc && !SameValue$5(Desc['[[Set]]'], current['[[Set]]'])) {
				return false;
			}
			if ('[[Get]]' in Desc && !SameValue$5(Desc['[[Get]]'], current['[[Get]]'])) {
				return false;
			}
			return true;
		}
	} else {
		throw new $TypeError$3u('Assertion failed: current and Desc are not both data, both accessors, or one accessor and one data.');
	}
	if (oType !== 'Undefined') {
		return DefineOwnProperty(
			IsDataDescriptor$5,
			SameValue$5,
			FromPropertyDescriptor$5,
			O,
			P,
			Desc
		);
	}
	return true;
};

var $SyntaxError$j = GetIntrinsic('%SyntaxError%');
var $TypeError$3v = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarydefineownproperty

var OrdinaryDefineOwnProperty$4 = function OrdinaryDefineOwnProperty(O, P, Desc) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3v('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3v('Assertion failed: P must be a Property Key');
	}
	if (!isPropertyDescriptor({
		Type: Type$5,
		IsDataDescriptor: IsDataDescriptor$5,
		IsAccessorDescriptor: IsAccessorDescriptor$5
	}, Desc)) {
		throw new $TypeError$3v('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!getOwnPropertyDescriptor) {
		// ES3/IE 8 fallback
		if (IsAccessorDescriptor$5(Desc)) {
			throw new $SyntaxError$j('This environment does not support accessor property descriptors.');
		}
		var creatingNormalDataProperty = !(P in O)
			&& Desc['[[Writable]]']
			&& Desc['[[Enumerable]]']
			&& Desc['[[Configurable]]']
			&& '[[Value]]' in Desc;
		var settingExistingDataProperty = (P in O)
			&& (!('[[Configurable]]' in Desc) || Desc['[[Configurable]]'])
			&& (!('[[Enumerable]]' in Desc) || Desc['[[Enumerable]]'])
			&& (!('[[Writable]]' in Desc) || Desc['[[Writable]]'])
			&& '[[Value]]' in Desc;
		if (creatingNormalDataProperty || settingExistingDataProperty) {
			O[P] = Desc['[[Value]]']; // eslint-disable-line no-param-reassign
			return SameValue$5(O[P], Desc['[[Value]]']);
		}
		throw new $SyntaxError$j('This environment does not support defining non-writable, non-enumerable, or non-configurable properties');
	}
	var desc = getOwnPropertyDescriptor(O, P);
	var current = desc && ToPropertyDescriptor$5(desc);
	var extensible = IsExtensible$4(O);
	return ValidateAndApplyPropertyDescriptor$4(O, P, extensible, Desc, current);
};

var $match$4 = GetIntrinsic('%Symbol.match%', true);





// https://ecma-international.org/ecma-262/6.0/#sec-isregexp

var IsRegExp$4 = function IsRegExp(argument) {
	if (!argument || typeof argument !== 'object') {
		return false;
	}
	if ($match$4) {
		var isRegExp = argument[$match$4];
		if (typeof isRegExp !== 'undefined') {
			return ToBoolean$5(isRegExp);
		}
	}
	return isRegex(argument);
};

var $TypeError$3w = GetIntrinsic('%TypeError%');



var $isEnumerable$8 = callBound('Object.prototype.propertyIsEnumerable');









// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinarygetownproperty

var OrdinaryGetOwnProperty$4 = function OrdinaryGetOwnProperty(O, P) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3w('Assertion failed: O must be an Object');
	}
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3w('Assertion failed: P must be a Property Key');
	}
	if (!src(O, P)) {
		return void 0;
	}
	if (!getOwnPropertyDescriptor) {
		// ES3 / IE 8 fallback
		var arrayLength = IsArray$4(O) && P === 'length';
		var regexLastIndex = IsRegExp$4(O) && P === 'lastIndex';
		return {
			'[[Configurable]]': !(arrayLength || regexLastIndex),
			'[[Enumerable]]': $isEnumerable$8(O, P),
			'[[Value]]': O[P],
			'[[Writable]]': true
		};
	}
	return ToPropertyDescriptor$5(getOwnPropertyDescriptor(O, P));
};

var $String$a = GetIntrinsic('%String%');
var $TypeError$3x = GetIntrinsic('%TypeError%');

// https://www.ecma-international.org/ecma-262/6.0/#sec-tostring

var ToString$5 = function ToString(argument) {
	if (typeof argument === 'symbol') {
		throw new $TypeError$3x('Cannot convert a Symbol value to a string');
	}
	return $String$a(argument);
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.6

var ToUint32$5 = function ToUint32(x) {
	return ToNumber$5(x) >>> 0;
};

var $RangeError$b = GetIntrinsic('%RangeError%');
var $TypeError$3y = GetIntrinsic('%TypeError%');















// https://www.ecma-international.org/ecma-262/6.0/#sec-arraysetlength

// eslint-disable-next-line max-statements, max-lines-per-function
var ArraySetLength$4 = function ArraySetLength(A, Desc) {
	if (!IsArray$4(A)) {
		throw new $TypeError$3y('Assertion failed: A must be an Array');
	}
	if (!isPropertyDescriptor({
		Type: Type$5,
		IsDataDescriptor: IsDataDescriptor$5,
		IsAccessorDescriptor: IsAccessorDescriptor$5
	}, Desc)) {
		throw new $TypeError$3y('Assertion failed: Desc must be a Property Descriptor');
	}
	if (!('[[Value]]' in Desc)) {
		return OrdinaryDefineOwnProperty$4(A, 'length', Desc);
	}
	var newLenDesc = object_assign({}, Desc);
	var newLen = ToUint32$5(Desc['[[Value]]']);
	var numberLen = ToNumber$5(Desc['[[Value]]']);
	if (newLen !== numberLen) {
		throw new $RangeError$b('Invalid array length');
	}
	newLenDesc['[[Value]]'] = newLen;
	var oldLenDesc = OrdinaryGetOwnProperty$4(A, 'length');
	if (!IsDataDescriptor$5(oldLenDesc)) {
		throw new $TypeError$3y('Assertion failed: an array had a non-data descriptor on `length`');
	}
	var oldLen = oldLenDesc['[[Value]]'];
	if (newLen >= oldLen) {
		return OrdinaryDefineOwnProperty$4(A, 'length', newLenDesc);
	}
	if (!oldLenDesc['[[Writable]]']) {
		return false;
	}
	var newWritable;
	if (!('[[Writable]]' in newLenDesc) || newLenDesc['[[Writable]]']) {
		newWritable = true;
	} else {
		newWritable = false;
		newLenDesc['[[Writable]]'] = true;
	}
	var succeeded = OrdinaryDefineOwnProperty$4(A, 'length', newLenDesc);
	if (!succeeded) {
		return false;
	}
	while (newLen < oldLen) {
		oldLen -= 1;
		// eslint-disable-next-line no-param-reassign
		var deleteSucceeded = delete A[ToString$5(oldLen)];
		if (!deleteSucceeded) {
			newLenDesc['[[Value]]'] = oldLen + 1;
			if (!newWritable) {
				newLenDesc['[[Writable]]'] = false;
				OrdinaryDefineOwnProperty$4(A, 'length', newLenDesc);
				return false;
			}
		}
	}
	if (!newWritable) {
		return OrdinaryDefineOwnProperty$4(A, 'length', { '[[Writable]]': false });
	}
	return true;
};

var $TypeError$3z = GetIntrinsic('%TypeError%');












// https://www.ecma-international.org/ecma-262/6.0/#sec-definepropertyorthrow

var DefinePropertyOrThrow$4 = function DefinePropertyOrThrow(O, P, desc) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3z('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3z('Assertion failed: IsPropertyKey(P) is not true');
	}

	var Desc = isPropertyDescriptor({
		Type: Type$5,
		IsDataDescriptor: IsDataDescriptor$5,
		IsAccessorDescriptor: IsAccessorDescriptor$5
	}, desc) ? desc : ToPropertyDescriptor$5(desc);
	if (!isPropertyDescriptor({
		Type: Type$5,
		IsDataDescriptor: IsDataDescriptor$5,
		IsAccessorDescriptor: IsAccessorDescriptor$5
	}, Desc)) {
		throw new $TypeError$3z('Assertion failed: Desc is not a valid Property Descriptor');
	}

	return DefineOwnProperty(
		IsDataDescriptor$5,
		SameValue$5,
		FromPropertyDescriptor$5,
		O,
		P,
		Desc
	);
};

var IsConstructor$4 = createCommonjsModule(function (module) {



var $construct = GetIntrinsic('%Reflect.construct%', true);

var DefinePropertyOrThrow = DefinePropertyOrThrow$4;
try {
	DefinePropertyOrThrow({}, '', { '[[Get]]': function () {} });
} catch (e) {
	// Accessor properties aren't supported
	DefinePropertyOrThrow = null;
}

// https://www.ecma-international.org/ecma-262/6.0/#sec-isconstructor

if (DefinePropertyOrThrow && $construct) {
	var isConstructorMarker = {};
	var badArrayLike = {};
	DefinePropertyOrThrow(badArrayLike, 'length', {
		'[[Get]]': function () {
			throw isConstructorMarker;
		},
		'[[Enumerable]]': true
	});

	module.exports = function IsConstructor(argument) {
		try {
			// `Reflect.construct` invokes `IsConstructor(target)` before `Get(args, 'length')`:
			$construct(argument, badArrayLike);
		} catch (err) {
			return err === isConstructorMarker;
		}
	};
} else {
	module.exports = function IsConstructor(argument) {
		// unfortunately there's no way to truly check this without try/catch `new argument` in old environments
		return typeof argument === 'function' && !!argument.prototype;
	};
}
});

var $Array$9 = GetIntrinsic('%Array%');
var $species$8 = GetIntrinsic('%Symbol.species%', true);
var $TypeError$3A = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-arrayspeciescreate

var ArraySpeciesCreate$4 = function ArraySpeciesCreate(originalArray, length) {
	if (!IsInteger$4(length) || length < 0) {
		throw new $TypeError$3A('Assertion failed: length must be an integer >= 0');
	}
	var len = length === 0 ? 0 : length;
	var C;
	var isArray = IsArray$4(originalArray);
	if (isArray) {
		C = Get$4(originalArray, 'constructor');
		// TODO: figure out how to make a cross-realm normal Array, a same-realm Array
		// if (IsConstructor(C)) {
		// 	if C is another realm's Array, C = undefined
		// 	Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(Array))) === null ?
		// }
		if ($species$8 && Type$5(C) === 'Object') {
			C = Get$4(C, $species$8);
			if (C === null) {
				C = void 0;
			}
		}
	}
	if (typeof C === 'undefined') {
		return $Array$9(len);
	}
	if (!IsConstructor$4(C)) {
		throw new $TypeError$3A('C must be a constructor');
	}
	return new C(len); // Construct(C, len);
};

var $TypeError$3B = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-canonicalnumericindexstring

var CanonicalNumericIndexString$4 = function CanonicalNumericIndexString(argument) {
	if (Type$5(argument) !== 'String') {
		throw new $TypeError$3B('Assertion failed: `argument` must be a String');
	}
	if (argument === '-0') { return -0; }
	var n = ToNumber$5(argument);
	if (SameValue$5(ToString$5(n), argument)) { return n; }
	return void 0;
};

// https://ecma-international.org/ecma-262/6.0/#sec-completepropertydescriptor

var CompletePropertyDescriptor$4 = function CompletePropertyDescriptor(Desc) {
	/* eslint no-param-reassign: 0 */
	assertRecord(Type$5, 'Property Descriptor', 'Desc', Desc);

	if (IsGenericDescriptor$5(Desc) || IsDataDescriptor$5(Desc)) {
		if (!src(Desc, '[[Value]]')) {
			Desc['[[Value]]'] = void 0;
		}
		if (!src(Desc, '[[Writable]]')) {
			Desc['[[Writable]]'] = false;
		}
	} else {
		if (!src(Desc, '[[Get]]')) {
			Desc['[[Get]]'] = void 0;
		}
		if (!src(Desc, '[[Set]]')) {
			Desc['[[Set]]'] = void 0;
		}
	}
	if (!src(Desc, '[[Enumerable]]')) {
		Desc['[[Enumerable]]'] = false;
	}
	if (!src(Desc, '[[Configurable]]')) {
		Desc['[[Configurable]]'] = false;
	}
	return Desc;
};

var $TypeError$3C = GetIntrinsic('%TypeError%');











// https://www.ecma-international.org/ecma-262/6.0/#sec-createdataproperty

var CreateDataProperty$4 = function CreateDataProperty(O, P, V) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3C('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3C('Assertion failed: IsPropertyKey(P) is not true');
	}
	var oldDesc = OrdinaryGetOwnProperty$4(O, P);
	var extensible = !oldDesc || IsExtensible$4(O);
	var immutable = oldDesc && (!oldDesc['[[Writable]]'] || !oldDesc['[[Configurable]]']);
	if (immutable || !extensible) {
		return false;
	}
	return DefineOwnProperty(
		IsDataDescriptor$5,
		SameValue$5,
		FromPropertyDescriptor$5,
		O,
		P,
		{
			'[[Configurable]]': true,
			'[[Enumerable]]': true,
			'[[Value]]': V,
			'[[Writable]]': true
		}
	);
};

var $isEnumerable$9 = callBound('Object.prototype.propertyIsEnumerable');











// https://www.ecma-international.org/ecma-262/9.0/#sec-copydataproperties

var CopyDataProperties$1 = function CopyDataProperties(target, source, excludedItems) {
	if (Type$5(target) !== 'Object') {
		throw new TypeError('Assertion failed: "target" must be an Object');
	}

	if (!IsArray$4(excludedItems)) {
		throw new TypeError('Assertion failed: "excludedItems" must be a List of Property Keys');
	}
	for (var i = 0; i < excludedItems.length; i += 1) {
		if (!IsPropertyKey$4(excludedItems[i])) {
			throw new TypeError('Assertion failed: "excludedItems" must be a List of Property Keys');
		}
	}

	if (typeof source === 'undefined' || source === null) {
		return target;
	}

	var fromObj = ToObject$5(source);

	var sourceKeys = OwnPropertyKeys(fromObj);
	forEach(sourceKeys, function (nextKey) {
		var excluded = false;

		forEach(excludedItems, function (e) {
			if (SameValue$5(e, nextKey) === true) {
				excluded = true;
			}
		});

		var enumerable = $isEnumerable$9(fromObj, nextKey) || (
		// this is to handle string keys being non-enumerable in older engines
			typeof source === 'string'
            && nextKey >= 0
            && IsInteger$4(ToNumber$5(nextKey))
		);
		if (excluded === false && enumerable) {
			var propValue = Get$4(fromObj, nextKey);
			CreateDataProperty$4(target, nextKey, propValue);
		}
	});

	return target;
};

var $TypeError$3D = GetIntrinsic('%TypeError%');





// // https://ecma-international.org/ecma-262/6.0/#sec-createdatapropertyorthrow

var CreateDataPropertyOrThrow$4 = function CreateDataPropertyOrThrow(O, P, V) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3D('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3D('Assertion failed: IsPropertyKey(P) is not true');
	}
	var success = CreateDataProperty$4(O, P, V);
	if (!success) {
		throw new $TypeError$3D('unable to create data property');
	}
	return success;
};

var $TypeError$3E = GetIntrinsic('%TypeError%');



var $replace$a = callBound('String.prototype.replace');





// https://www.ecma-international.org/ecma-262/6.0/#sec-createhtml

var CreateHTML$4 = function CreateHTML(string, tag, attribute, value) {
	if (Type$5(tag) !== 'String' || Type$5(attribute) !== 'String') {
		throw new $TypeError$3E('Assertion failed: `tag` and `attribute` must be strings');
	}
	var str = RequireObjectCoercible$4(string);
	var S = ToString$5(str);
	var p1 = '<' + tag;
	if (attribute !== '') {
		var V = ToString$5(value);
		var escapedV = $replace$a(V, /\x22/g, '&quot;');
		p1 += '\x20' + attribute + '\x3D\x22' + escapedV + '\x22';
	}
	return p1 + '>' + S + '</' + tag + '>';
};

var $TypeError$3F = GetIntrinsic('%TypeError%');



// https://ecma-international.org/ecma-262/6.0/#sec-createiterresultobject

var CreateIterResultObject$4 = function CreateIterResultObject(value, done) {
	if (Type$5(done) !== 'Boolean') {
		throw new $TypeError$3F('Assertion failed: Type(done) is not Boolean');
	}
	return {
		value: value,
		done: done
	};
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-tointeger

var ToInteger$5 = function ToInteger$1(value) {
	var number = ToNumber$5(value);
	return ToInteger(number);
};

var ToLength$4 = function ToLength(argument) {
	var len = ToInteger$5(argument);
	if (len <= 0) { return 0; } // includes converting -0 to +0
	if (len > maxSafeInteger) { return maxSafeInteger; }
	return len;
};

var $TypeError$3G = GetIntrinsic('%TypeError%');
var $indexOf$6 = callBound('Array.prototype.indexOf', true) || callBound('String.prototype.indexOf');
var $push$4 = callBound('Array.prototype.push');







// https://ecma-international.org/ecma-262/6.0/#sec-createlistfromarraylike
var CreateListFromArrayLike$4 = function CreateListFromArrayLike(obj) {
	var elementTypes = arguments.length > 1
		? arguments[1]
		: ['Undefined', 'Null', 'Boolean', 'String', 'Symbol', 'Number', 'Object'];

	if (Type$5(obj) !== 'Object') {
		throw new $TypeError$3G('Assertion failed: `obj` must be an Object');
	}
	if (!IsArray$4(elementTypes)) {
		throw new $TypeError$3G('Assertion failed: `elementTypes`, if provided, must be an array');
	}
	var len = ToLength$4(Get$4(obj, 'length'));
	var list = [];
	var index = 0;
	while (index < len) {
		var indexName = ToString$5(index);
		var next = Get$4(obj, indexName);
		var nextType = Type$5(next);
		if ($indexOf$6(elementTypes, nextType) < 0) {
			throw new $TypeError$3G('item type ' + nextType + ' is not a valid elementType');
		}
		$push$4(list, next);
		index += 1;
	}
	return list;
};

var $TypeError$3H = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/6.0/#sec-createmethodproperty

var CreateMethodProperty$4 = function CreateMethodProperty(O, P, V) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3H('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3H('Assertion failed: IsPropertyKey(P) is not true');
	}

	var newDesc = {
		'[[Configurable]]': true,
		'[[Enumerable]]': false,
		'[[Value]]': V,
		'[[Writable]]': true
	};
	return DefineOwnProperty(
		IsDataDescriptor$5,
		SameValue$5,
		FromPropertyDescriptor$5,
		O,
		P,
		newDesc
	);
};

var $floor$O = GetIntrinsic('%Math.floor%');

var msPerDay$l = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var Day$5 = function Day(t) {
	return $floor$O(t / msPerDay$l);
};

var $floor$P = GetIntrinsic('%Math.floor%');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DayFromYear$5 = function DayFromYear(y) {
	return (365 * (y - 1970)) + $floor$P((y - 1969) / 4) - $floor$P((y - 1901) / 100) + $floor$P((y - 1601) / 400);
};

var $Date$e = GetIntrinsic('%Date%');



var $getUTCFullYear$5 = callBound('Date.prototype.getUTCFullYear');

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var YearFromTime$5 = function YearFromTime(t) {
	// largest y such that this.TimeFromYear(y) <= t
	return $getUTCFullYear$5(new $Date$e(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var DayWithinYear$5 = function DayWithinYear(t) {
	return Day$5(t) - DayFromYear$5(YearFromTime$5(t));
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var DaysInYear$5 = function DaysInYear(y) {
	if (mod(y, 4) !== 0) {
		return 365;
	}
	if (mod(y, 100) !== 0) {
		return 366;
	}
	if (mod(y, 400) !== 0) {
		return 365;
	}
	return 366;
};

var $EvalError$a = GetIntrinsic('%EvalError%');




// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var InLeapYear$5 = function InLeapYear(t) {
	var days = DaysInYear$5(YearFromTime$5(t));
	if (days === 365) {
		return 0;
	}
	if (days === 366) {
		return 1;
	}
	throw new $EvalError$a('Assertion failed: there are not 365 or 366 days in a year, got: ' + days);
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.4

var MonthFromTime$5 = function MonthFromTime(t) {
	var day = DayWithinYear$5(t);
	if (0 <= day && day < 31) {
		return 0;
	}
	var leap = InLeapYear$5(t);
	if (31 <= day && day < (59 + leap)) {
		return 1;
	}
	if ((59 + leap) <= day && day < (90 + leap)) {
		return 2;
	}
	if ((90 + leap) <= day && day < (120 + leap)) {
		return 3;
	}
	if ((120 + leap) <= day && day < (151 + leap)) {
		return 4;
	}
	if ((151 + leap) <= day && day < (181 + leap)) {
		return 5;
	}
	if ((181 + leap) <= day && day < (212 + leap)) {
		return 6;
	}
	if ((212 + leap) <= day && day < (243 + leap)) {
		return 7;
	}
	if ((243 + leap) <= day && day < (273 + leap)) {
		return 8;
	}
	if ((273 + leap) <= day && day < (304 + leap)) {
		return 9;
	}
	if ((304 + leap) <= day && day < (334 + leap)) {
		return 10;
	}
	if ((334 + leap) <= day && day < (365 + leap)) {
		return 11;
	}
};

var $EvalError$b = GetIntrinsic('%EvalError%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.5

var DateFromTime$5 = function DateFromTime(t) {
	var m = MonthFromTime$5(t);
	var d = DayWithinYear$5(t);
	if (m === 0) {
		return d + 1;
	}
	if (m === 1) {
		return d - 30;
	}
	var leap = InLeapYear$5(t);
	if (m === 2) {
		return d - 58 - leap;
	}
	if (m === 3) {
		return d - 89 - leap;
	}
	if (m === 4) {
		return d - 119 - leap;
	}
	if (m === 5) {
		return d - 150 - leap;
	}
	if (m === 6) {
		return d - 180 - leap;
	}
	if (m === 7) {
		return d - 211 - leap;
	}
	if (m === 8) {
		return d - 242 - leap;
	}
	if (m === 9) {
		return d - 272 - leap;
	}
	if (m === 10) {
		return d - 303 - leap;
	}
	if (m === 11) {
		return d - 333 - leap;
	}
	throw new $EvalError$b('Assertion failed: MonthFromTime returned an impossible value: ' + m);
};

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.6

var WeekDay$5 = function WeekDay(t) {
	return mod(Day$5(t) + 4, 7);
};

var $TypeError$3I = GetIntrinsic('%TypeError%');

var weekdays$1 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var months$1 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];










// https://www.ecma-international.org/ecma-262/9.0/#sec-datestring

var DateString$1 = function DateString(tv) {
	if (Type$5(tv) !== 'Number' || _isNaN(tv)) {
		throw new $TypeError$3I('Assertion failed: `tv` must be a non-NaN Number');
	}
	var weekday = weekdays$1[WeekDay$5(tv)];
	var month = months$1[MonthFromTime$5(tv)];
	var day = padTimeComponent(DateFromTime$5(tv));
	var year = padTimeComponent(YearFromTime$5(tv), 4);
	return weekday + '\x20' + month + '\x20' + day + '\x20' + year;
};

var $TypeError$3J = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-deletepropertyorthrow

var DeletePropertyOrThrow$4 = function DeletePropertyOrThrow(O, P) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3J('Assertion failed: Type(O) is not Object');
	}

	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3J('Assertion failed: IsPropertyKey(P) is not true');
	}

	// eslint-disable-next-line no-param-reassign
	var success = delete O[P];
	if (!success) {
		throw new $TypeError$3J('Attempt to delete property failed.');
	}
	return success;
};

var $TypeError$3K = GetIntrinsic('%TypeError%');







var $isEnumerable$a = callBound('Object.prototype.propertyIsEnumerable');
var $pushApply$3 = callBind.apply(GetIntrinsic('%Array.prototype.push%'));





// https://www.ecma-international.org/ecma-262/8.0/#sec-enumerableownproperties

var EnumerableOwnPropertyNames$1 = function EnumerableOwnProperties(O, kind) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3K('Assertion failed: Type(O) is not Object');
	}

	var keys = objectKeys(O);
	if (kind === 'key') {
		return keys;
	}
	if (kind === 'value' || kind === 'key+value') {
		var results = [];
		forEach(keys, function (key) {
			if ($isEnumerable$a(O, key)) {
				$pushApply$3(results, [
					kind === 'value' ? O[key] : [key, O[key]]
				]);
			}
		});
		return results;
	}
	throw new $TypeError$3K('Assertion failed: "kind" is not "key", "value", or "key+value": ' + kind);
};

var $TypeError$3L = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-hasproperty

var HasProperty$4 = function HasProperty(O, P) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3L('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3L('Assertion failed: `P` must be a Property Key');
	}
	return P in O;
};

var $TypeError$3M = GetIntrinsic('%TypeError%');











// https://ecma-international.org/ecma-262/10.0/#sec-flattenintoarray

// eslint-disable-next-line max-params, max-statements
var FlattenIntoArray = function FlattenIntoArray(target, source, sourceLen, start, depth) {
	var mapperFunction;
	if (arguments.length > 5) {
		mapperFunction = arguments[5];
	}

	var targetIndex = start;
	var sourceIndex = 0;
	while (sourceIndex < sourceLen) {
		var P = ToString$5(sourceIndex);
		var exists = HasProperty$4(source, P);
		if (exists === true) {
			var element = Get$4(source, P);
			if (typeof mapperFunction !== 'undefined') {
				if (arguments.length <= 6) {
					throw new $TypeError$3M('Assertion failed: thisArg is required when mapperFunction is provided');
				}
				element = Call$4(mapperFunction, arguments[6], [element, sourceIndex, source]);
			}
			var shouldFlatten = false;
			if (depth > 0) {
				shouldFlatten = IsArray$4(element);
			}
			if (shouldFlatten) {
				var elementLen = ToLength$4(Get$4(element, 'length'));
				targetIndex = FlattenIntoArray(target, element, elementLen, targetIndex, depth - 1);
			} else {
				if (targetIndex >= maxSafeInteger) {
					throw new $TypeError$3M('index too large');
				}
				CreateDataPropertyOrThrow$4(target, ToString$5(targetIndex), element);
				targetIndex += 1;
			}
		}
		sourceIndex += 1;
	}

	return targetIndex;
};

var hasSymbols$b = hasSymbols();

var $TypeError$3N = GetIntrinsic('%TypeError%');

var $gOPN$d = GetIntrinsic('%Object.getOwnPropertyNames%');
var $gOPS$5 = hasSymbols$b && GetIntrinsic('%Object.getOwnPropertySymbols%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-getownpropertykeys

var GetOwnPropertyKeys$4 = function GetOwnPropertyKeys(O, Type) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3N('Assertion failed: Type(O) is not Object');
	}
	if (Type === 'Symbol') {
		return $gOPS$5 ? $gOPS$5(O) : [];
	}
	if (Type === 'String') {
		if (!$gOPN$d) {
			return objectKeys(O);
		}
		return $gOPN$d(O);
	}
	throw new $TypeError$3N('Assertion failed: `Type` must be `"String"` or `"Symbol"`');
};

var $Function$4 = GetIntrinsic('%Function%');
var $TypeError$3O = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/6.0/#sec-getprototypefromconstructor

var GetPrototypeFromConstructor$4 = function GetPrototypeFromConstructor(constructor, intrinsicDefaultProto) {
	var intrinsic = GetIntrinsic(intrinsicDefaultProto); // throws if not a valid intrinsic
	if (!IsConstructor$4(constructor)) {
		throw new $TypeError$3O('Assertion failed: `constructor` must be a constructor');
	}
	var proto = Get$4(constructor, 'prototype');
	if (Type$5(proto) !== 'Object') {
		if (!(constructor instanceof $Function$4)) {
			// ignore other realms, for now
			throw new $TypeError$3O('cross-realm constructors not currently supported');
		}
		proto = intrinsic;
	}
	return proto;
};

var $TypeError$3P = GetIntrinsic('%TypeError%');





var $charAt$4 = callBound('String.prototype.charAt');
var $strSlice$b = callBound('String.prototype.slice');
var $indexOf$7 = callBound('String.prototype.indexOf');
var $parseInt$4 = parseInt;

var isDigit$4 = regexTester(/^[0-9]$/);










var canDistinguishSparseFromUndefined$4 = 0 in [undefined]; // IE 6 - 8 have a bug where this returns false

var isStringOrHole$4 = function (capture, index, arr) {
	return Type$5(capture) === 'String' || (canDistinguishSparseFromUndefined$4 ? !(index in arr) : Type$5(capture) === 'Undefined');
};

// http://www.ecma-international.org/ecma-262/9.0/#sec-getsubstitution

// eslint-disable-next-line max-statements, max-params, max-lines-per-function
var GetSubstitution$4 = function GetSubstitution(matched, str, position, captures, namedCaptures, replacement) {
	if (Type$5(matched) !== 'String') {
		throw new $TypeError$3P('Assertion failed: `matched` must be a String');
	}
	var matchLength = matched.length;

	if (Type$5(str) !== 'String') {
		throw new $TypeError$3P('Assertion failed: `str` must be a String');
	}
	var stringLength = str.length;

	if (!IsInteger$4(position) || position < 0 || position > stringLength) {
		throw new $TypeError$3P('Assertion failed: `position` must be a nonnegative integer, and less than or equal to the length of `string`, got ' + objectInspect(position));
	}

	if (!IsArray$4(captures) || !every(captures, isStringOrHole$4)) {
		throw new $TypeError$3P('Assertion failed: `captures` must be a List of Strings, got ' + objectInspect(captures));
	}

	if (Type$5(replacement) !== 'String') {
		throw new $TypeError$3P('Assertion failed: `replacement` must be a String');
	}

	var tailPos = position + matchLength;
	var m = captures.length;
	if (Type$5(namedCaptures) !== 'Undefined') {
		namedCaptures = ToObject$5(namedCaptures); // eslint-disable-line no-param-reassign
	}

	var result = '';
	for (var i = 0; i < replacement.length; i += 1) {
		// if this is a $, and it's not the end of the replacement
		var current = $charAt$4(replacement, i);
		var isLast = (i + 1) >= replacement.length;
		var nextIsLast = (i + 2) >= replacement.length;
		if (current === '$' && !isLast) {
			var next = $charAt$4(replacement, i + 1);
			if (next === '$') {
				result += '$';
				i += 1;
			} else if (next === '&') {
				result += matched;
				i += 1;
			} else if (next === '`') {
				result += position === 0 ? '' : $strSlice$b(str, 0, position - 1);
				i += 1;
			} else if (next === "'") {
				result += tailPos >= stringLength ? '' : $strSlice$b(str, tailPos);
				i += 1;
			} else {
				var nextNext = nextIsLast ? null : $charAt$4(replacement, i + 2);
				if (isDigit$4(next) && next !== '0' && (nextIsLast || !isDigit$4(nextNext))) {
					// $1 through $9, and not followed by a digit
					var n = $parseInt$4(next, 10);
					// if (n > m, impl-defined)
					result += (n <= m && Type$5(captures[n - 1]) === 'Undefined') ? '' : captures[n - 1];
					i += 1;
				} else if (isDigit$4(next) && (nextIsLast || isDigit$4(nextNext))) {
					// $00 through $99
					var nn = next + nextNext;
					var nnI = $parseInt$4(nn, 10) - 1;
					// if nn === '00' or nn > m, impl-defined
					result += (nn <= m && Type$5(captures[nnI]) === 'Undefined') ? '' : captures[nnI];
					i += 2;
				} else if (next === '<') {
					// eslint-disable-next-line max-depth
					if (Type$5(namedCaptures) === 'Undefined') {
						result += '$<';
						i += 2;
					} else {
						var endIndex = $indexOf$7(replacement, '>', i);
						// eslint-disable-next-line max-depth
						if (endIndex > -1) {
							var groupName = $strSlice$b(replacement, i, endIndex);
							var capture = Get$4(namedCaptures, groupName);
							// eslint-disable-next-line max-depth
							if (Type$5(capture) !== 'Undefined') {
								result += ToString$5(capture);
							}
							i += '$<' + groupName + '>'.length;
						}
					}
				} else {
					result += '$';
				}
			}
		} else {
			// the final $, or else not a $
			result += $charAt$4(replacement, i);
		}
	}
	return result;
};

var $TypeError$3Q = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/6.0/#sec-hasownproperty

var HasOwnProperty$4 = function HasOwnProperty(O, P) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3Q('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3Q('Assertion failed: `P` must be a Property Key');
	}
	return src(O, P);
};

var $floor$Q = GetIntrinsic('%Math.floor%');



var msPerHour$b = timeConstants.msPerHour;
var HoursPerDay$6 = timeConstants.HoursPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var HourFromTime$5 = function HourFromTime(t) {
	return mod($floor$Q(t / msPerHour$b), HoursPerDay$6);
};

var $TypeError$3R = GetIntrinsic('%TypeError%');





// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasinstance

var OrdinaryHasInstance$4 = function OrdinaryHasInstance(C, O) {
	if (IsCallable$5(C) === false) {
		return false;
	}
	if (Type$5(O) !== 'Object') {
		return false;
	}
	var P = Get$4(C, 'prototype');
	if (Type$5(P) !== 'Object') {
		throw new $TypeError$3R('OrdinaryHasInstance called on an object with an invalid prototype property.');
	}
	return O instanceof C;
};

var $TypeError$3S = GetIntrinsic('%TypeError%');

var $hasInstance$4 = GetIntrinsic('Symbol.hasInstance', true);








// https://www.ecma-international.org/ecma-262/6.0/#sec-instanceofoperator

var InstanceofOperator$4 = function InstanceofOperator(O, C) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3S('Assertion failed: Type(O) is not Object');
	}
	var instOfHandler = $hasInstance$4 ? GetMethod$5(C, $hasInstance$4) : void 0;
	if (typeof instOfHandler !== 'undefined') {
		return ToBoolean$5(Call$4(instOfHandler, C, [O]));
	}
	if (!IsCallable$5(C)) {
		throw new $TypeError$3S('`C` is not Callable');
	}
	return OrdinaryHasInstance$4(C, O);
};

var $isConcatSpreadable$4 = GetIntrinsic('%Symbol.isConcatSpreadable%', true);






// https://ecma-international.org/ecma-262/6.0/#sec-isconcatspreadable

var IsConcatSpreadable$4 = function IsConcatSpreadable(O) {
	if (Type$5(O) !== 'Object') {
		return false;
	}
	if ($isConcatSpreadable$4) {
		var spreadable = Get$4(O, $isConcatSpreadable$4);
		if (typeof spreadable !== 'undefined') {
			return ToBoolean$5(spreadable);
		}
	}
	return IsArray$4(O);
};

var $PromiseThen$4 = callBound('Promise.prototype.then', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-ispromise

var IsPromise$4 = function IsPromise(x) {
	if (Type$5(x) !== 'Object') {
		return false;
	}
	if (!$PromiseThen$4) { // Promises are not supported
		return false;
	}
	try {
		$PromiseThen$4(x); // throws if not a promise
	} catch (e) {
		return false;
	}
	return true;
};

var $TypeError$3T = GetIntrinsic('%TypeError%');



// var callBound = require('../helpers/callBound');

// var $charAt = callBound('String.prototype.charAt');



// https://www.ecma-international.org/ecma-262/9.0/#sec-isstringprefix

var IsStringPrefix$1 = function IsStringPrefix(p, q) {
	if (Type$5(p) !== 'String') {
		throw new $TypeError$3T('Assertion failed: "p" must be a String');
	}

	if (Type$5(q) !== 'String') {
		throw new $TypeError$3T('Assertion failed: "q" must be a String');
	}

	return isPrefixOf(p, q);
	/*
	if (p === q || p === '') {
		return true;
	}

	var pLength = p.length;
	var qLength = q.length;
	if (pLength >= qLength) {
		return false;
	}

	// assert: pLength < qLength

	for (var i = 0; i < pLength; i += 1) {
		if ($charAt(p, i) !== $charAt(q, i)) {
			return false;
		}
	}
	return true;
	*/
};

var $arrayPush$3 = callBound('Array.prototype.push');





// https://www.ecma-international.org/ecma-262/8.0/#sec-iterabletolist

var IterableToList$2 = function IterableToList(items, method) {
	var iterator = GetIterator$4(items, method);
	var values = [];
	var next = true;
	while (next) {
		next = IteratorStep$4(iterator);
		if (next) {
			var nextValue = IteratorValue$4(next);
			$arrayPush$3(values, nextValue);
		}
	}
	return values;
};

var msPerDay$m = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.13

var MakeDate$5 = function MakeDate(day, time) {
	if (!_isFinite(day) || !_isFinite(time)) {
		return NaN;
	}
	return (day * msPerDay$m) + time;
};

var $floor$R = GetIntrinsic('%Math.floor%');
var $DateUTC$5 = GetIntrinsic('%Date.UTC%');










// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.12

var MakeDay$5 = function MakeDay(year, month, date) {
	if (!_isFinite(year) || !_isFinite(month) || !_isFinite(date)) {
		return NaN;
	}
	var y = ToInteger$5(year);
	var m = ToInteger$5(month);
	var dt = ToInteger$5(date);
	var ym = y + $floor$R(m / 12);
	var mn = mod(m, 12);
	var t = $DateUTC$5(ym, mn, 1);
	if (YearFromTime$5(t) !== ym || MonthFromTime$5(t) !== mn || DateFromTime$5(t) !== 1) {
		return NaN;
	}
	return Day$5(t) + dt - 1;
};

var msPerSecond$g = timeConstants.msPerSecond;
var msPerMinute$b = timeConstants.msPerMinute;
var msPerHour$c = timeConstants.msPerHour;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.11

var MakeTime$5 = function MakeTime(hour, min, sec, ms) {
	if (!_isFinite(hour) || !_isFinite(min) || !_isFinite(sec) || !_isFinite(ms)) {
		return NaN;
	}
	var h = ToInteger$5(hour);
	var m = ToInteger$5(min);
	var s = ToInteger$5(sec);
	var milli = ToInteger$5(ms);
	var t = (h * msPerHour$c) + (m * msPerMinute$b) + (s * msPerSecond$g) + milli;
	return t;
};

var $floor$S = GetIntrinsic('%Math.floor%');



var msPerMinute$c = timeConstants.msPerMinute;
var MinutesPerHour$6 = timeConstants.MinutesPerHour;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var MinFromTime$5 = function MinFromTime(t) {
	return mod($floor$S(t / msPerMinute$c), MinutesPerHour$6);
};

// https://ecma-international.org/ecma-262/5.1/#sec-5.2

var modulo$5 = function modulo(x, y) {
	return mod(x, y);
};

var msPerSecond$h = timeConstants.msPerSecond;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var msFromTime$5 = function msFromTime(t) {
	return mod(t, msPerSecond$h);
};

var $String$b = GetIntrinsic('%String%');



// https://www.ecma-international.org/ecma-262/9.0/#sec-tostring-applied-to-the-number-type

var NumberToString$1 = function NumberToString(m) {
	if (Type$5(m) !== 'Number') {
		throw new TypeError('Assertion failed: "m" must be a String');
	}

	return $String$b(m);
};

var $ObjectCreate$4 = GetIntrinsic('%Object.create%', true);
var $TypeError$3U = GetIntrinsic('%TypeError%');
var $SyntaxError$k = GetIntrinsic('%SyntaxError%');



var hasProto$4 = !({ __proto__: null } instanceof Object);

// https://www.ecma-international.org/ecma-262/6.0/#sec-objectcreate

var ObjectCreate$4 = function ObjectCreate(proto, internalSlotsList) {
	if (proto !== null && Type$5(proto) !== 'Object') {
		throw new $TypeError$3U('Assertion failed: `proto` must be null or an object');
	}
	var slots = arguments.length < 2 ? [] : internalSlotsList;
	if (slots.length > 0) {
		throw new $SyntaxError$k('es-abstract does not yet support internal slots');
	}

	if ($ObjectCreate$4) {
		return $ObjectCreate$4(proto);
	}
	if (hasProto$4) {
		return { __proto__: proto };
	}

	if (proto === null) {
		throw new $SyntaxError$k('native Object.create support is required to create null objects');
	}
	var T = function T() {};
	T.prototype = proto;
	return new T();
};

var $TypeError$3V = GetIntrinsic('%TypeError%');





// https://ecma-international.org/ecma-262/7.0/#sec-ordinarygetprototypeof

var OrdinaryGetPrototypeOf$3 = function OrdinaryGetPrototypeOf(O) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3V('Assertion failed: O must be an Object');
	}
	if (!getProto$1) {
		throw new $TypeError$3V('This environment does not support fetching prototypes.');
	}
	return getProto$1(O);
};

var $TypeError$3W = GetIntrinsic('%TypeError%');






// https://ecma-international.org/ecma-262/7.0/#sec-ordinarysetprototypeof

var OrdinarySetPrototypeOf$3 = function OrdinarySetPrototypeOf(O, V) {
	if (Type$5(V) !== 'Object' && Type$5(V) !== 'Null') {
		throw new $TypeError$3W('Assertion failed: V must be Object or Null');
	}
	/*
    var extensible = IsExtensible(O);
    var current = OrdinaryGetPrototypeOf(O);
    if (SameValue(V, current)) {
        return true;
    }
    if (!extensible) {
        return false;
    }
    */
	try {
		setProto(O, V);
	} catch (e) {
		return false;
	}
	return OrdinaryGetPrototypeOf$3(O) === V;
	/*
    var p = V;
    var done = false;
    while (!done) {
        if (p === null) {
            done = true;
        } else if (SameValue(p, O)) {
            return false;
        } else {
            if (wat) {
                done = true;
            } else {
                p = p.[[Prototype]];
            }
        }
     }
     O.[[Prototype]] = V;
     return true;
     */
};

var $TypeError$3X = GetIntrinsic('%TypeError%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-ordinaryhasproperty

var OrdinaryHasProperty$4 = function OrdinaryHasProperty(O, P) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3X('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3X('Assertion failed: P must be a Property Key');
	}
	return P in O;
};

var $PromiseResolve$1 = callBound('Promise.resolve', true);

// https://ecma-international.org/ecma-262/9.0/#sec-promise-resolve

var PromiseResolve$1 = function PromiseResolve(C, x) {
	if (!$PromiseResolve$1) {
		throw new SyntaxError('This environment does not support Promises.');
	}
	return $PromiseResolve$1(C, x);
};

var $TypeError$3Y = GetIntrinsic('%TypeError%');

var regexExec$5 = callBound('RegExp.prototype.exec');






// https://ecma-international.org/ecma-262/6.0/#sec-regexpexec

var RegExpExec$4 = function RegExpExec(R, S) {
	if (Type$5(R) !== 'Object') {
		throw new $TypeError$3Y('Assertion failed: `R` must be an Object');
	}
	if (Type$5(S) !== 'String') {
		throw new $TypeError$3Y('Assertion failed: `S` must be a String');
	}
	var exec = Get$4(R, 'exec');
	if (IsCallable$5(exec)) {
		var result = Call$4(exec, R, [S]);
		if (result === null || Type$5(result) === 'Object') {
			return result;
		}
		throw new $TypeError$3Y('"exec" method must return `null` or an Object');
	}
	return regexExec$5(R, S);
};

var $TypeError$3Z = GetIntrinsic('%TypeError%');



// https://www.ecma-international.org/ecma-262/7.0/#sec-samevaluenonnumber

var SameValueNonNumber$3 = function SameValueNonNumber(x, y) {
	if (typeof x === 'number' || typeof x !== typeof y) {
		throw new $TypeError$3Z('SameValueNonNumber requires two non-number values of the same type.');
	}
	return SameValue$5(x, y);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-samevaluezero

var SameValueZero$4 = function SameValueZero(x, y) {
	return (x === y) || (_isNaN(x) && _isNaN(y));
};

var $floor$T = GetIntrinsic('%Math.floor%');



var msPerSecond$i = timeConstants.msPerSecond;
var SecondsPerMinute$6 = timeConstants.SecondsPerMinute;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.10

var SecFromTime$5 = function SecFromTime(t) {
	return mod($floor$T(t / msPerSecond$i), SecondsPerMinute$6);
};

var $TypeError$3_ = GetIntrinsic('%TypeError%');





// IE 9 does not throw in strict mode when writability/configurability/extensibility is violated
var noThrowOnStrictViolation$4 = (function () {
	try {
		delete [].length;
		return true;
	} catch (e) {
		return false;
	}
}());

// https://ecma-international.org/ecma-262/6.0/#sec-set-o-p-v-throw

var _Set$4 = function Set(O, P, V, Throw) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$3_('Assertion failed: `O` must be an Object');
	}
	if (!IsPropertyKey$4(P)) {
		throw new $TypeError$3_('Assertion failed: `P` must be a Property Key');
	}
	if (Type$5(Throw) !== 'Boolean') {
		throw new $TypeError$3_('Assertion failed: `Throw` must be a Boolean');
	}
	if (Throw) {
		O[P] = V; // eslint-disable-line no-param-reassign
		if (noThrowOnStrictViolation$4 && !SameValue$5(O[P], V)) {
			throw new $TypeError$3_('Attempted to assign to readonly property.');
		}
		return true;
	} else {
		try {
			O[P] = V; // eslint-disable-line no-param-reassign
			return noThrowOnStrictViolation$4 ? SameValue$5(O[P], V) : true;
		} catch (e) {
			return false;
		}
	}
};

var $TypeError$3$ = GetIntrinsic('%TypeError%');







// https://ecma-international.org/ecma-262/6.0/#sec-setfunctionname

var SetFunctionName$4 = function SetFunctionName(F, name) {
	if (typeof F !== 'function') {
		throw new $TypeError$3$('Assertion failed: `F` must be a function');
	}
	if (!IsExtensible$4(F) || src(F, 'name')) {
		throw new $TypeError$3$('Assertion failed: `F` must be extensible, and must not have a `name` own property');
	}
	var nameType = Type$5(name);
	if (nameType !== 'Symbol' && nameType !== 'String') {
		throw new $TypeError$3$('Assertion failed: `name` must be a Symbol or a String');
	}
	if (nameType === 'Symbol') {
		var description = getSymbolDescription(name);
		// eslint-disable-next-line no-param-reassign
		name = typeof description === 'undefined' ? '' : '[' + description + ']';
	}
	if (arguments.length > 2) {
		var prefix = arguments[2];
		// eslint-disable-next-line no-param-reassign
		name = prefix + ' ' + name;
	}
	return DefinePropertyOrThrow$4(F, 'name', {
		'[[Value]]': name,
		'[[Writable]]': false,
		'[[Enumerable]]': false,
		'[[Configurable]]': true
	});
};

var $SyntaxError$l = GetIntrinsic('%SyntaxError%');
var $TypeError$40 = GetIntrinsic('%TypeError%');
var $preventExtensions$9 = GetIntrinsic('%Object.preventExtensions%');

var $gOPN$e = GetIntrinsic('%Object.getOwnPropertyNames%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-setintegritylevel

var SetIntegrityLevel$4 = function SetIntegrityLevel(O, level) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$40('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$40('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	if (!$preventExtensions$9) {
		throw new $SyntaxError$l('SetIntegrityLevel requires native `Object.preventExtensions` support');
	}
	var status = $preventExtensions$9(O);
	if (!status) {
		return false;
	}
	if (!$gOPN$e) {
		throw new $SyntaxError$l('SetIntegrityLevel requires native `Object.getOwnPropertyNames` support');
	}
	var theKeys = $gOPN$e(O);
	if (level === 'sealed') {
		forEach(theKeys, function (k) {
			DefinePropertyOrThrow$4(O, k, { configurable: false });
		});
	} else if (level === 'frozen') {
		forEach(theKeys, function (k) {
			var currentDesc = getOwnPropertyDescriptor(O, k);
			if (typeof currentDesc !== 'undefined') {
				var desc;
				if (IsAccessorDescriptor$5(ToPropertyDescriptor$5(currentDesc))) {
					desc = { configurable: false };
				} else {
					desc = { configurable: false, writable: false };
				}
				DefinePropertyOrThrow$4(O, k, desc);
			}
		});
	}
	return true;
};

var $species$9 = GetIntrinsic('%Symbol.species%', true);
var $TypeError$41 = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/6.0/#sec-speciesconstructor

var SpeciesConstructor$4 = function SpeciesConstructor(O, defaultConstructor) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$41('Assertion failed: Type(O) is not Object');
	}
	var C = O.constructor;
	if (typeof C === 'undefined') {
		return defaultConstructor;
	}
	if (Type$5(C) !== 'Object') {
		throw new $TypeError$41('O.constructor is not an Object');
	}
	var S = $species$9 ? C[$species$9] : void 0;
	if (S == null) {
		return defaultConstructor;
	}
	if (IsConstructor$4(S)) {
		return S;
	}
	throw new $TypeError$41('no constructor found');
};

var $TypeError$42 = GetIntrinsic('%TypeError%');



var $SymbolToString$4 = callBound('Symbol.prototype.toString', true);



// https://www.ecma-international.org/ecma-262/6.0/#sec-symboldescriptivestring

var SymbolDescriptiveString$4 = function SymbolDescriptiveString(sym) {
	if (Type$5(sym) !== 'Symbol') {
		throw new $TypeError$42('Assertion failed: `sym` must be a Symbol');
	}
	return $SymbolToString$4(sym);
};

var $gOPN$f = GetIntrinsic('%Object.getOwnPropertyNames%');
var $TypeError$43 = GetIntrinsic('%TypeError%');








// https://www.ecma-international.org/ecma-262/6.0/#sec-testintegritylevel

var TestIntegrityLevel$4 = function TestIntegrityLevel(O, level) {
	if (Type$5(O) !== 'Object') {
		throw new $TypeError$43('Assertion failed: Type(O) is not Object');
	}
	if (level !== 'sealed' && level !== 'frozen') {
		throw new $TypeError$43('Assertion failed: `level` must be `"sealed"` or `"frozen"`');
	}
	var status = IsExtensible$4(O);
	if (status) {
		return false;
	}
	var theKeys = $gOPN$f(O);
	return theKeys.length === 0 || every(theKeys, function (k) {
		var currentDesc = getOwnPropertyDescriptor(O, k);
		if (typeof currentDesc !== 'undefined') {
			if (currentDesc.configurable) {
				return false;
			}
			if (level === 'frozen' && IsDataDescriptor$5(ToPropertyDescriptor$5(currentDesc)) && currentDesc.writable) {
				return false;
			}
		}
		return true;
	});
};

var $BooleanValueOf$4 = callBound('Boolean.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-boolean-prototype-object

var thisBooleanValue$4 = function thisBooleanValue(value) {
	if (Type$5(value) === 'Boolean') {
		return value;
	}

	return $BooleanValueOf$4(value);
};

var $NumberValueOf$4 = callBound('Number.prototype.valueOf');

// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-number-prototype-object

var thisNumberValue$4 = function thisNumberValue(value) {
	if (Type$5(value) === 'Number') {
		return value;
	}

	return $NumberValueOf$4(value);
};

var $StringValueOf$4 = callBound('String.prototype.valueOf');



// https://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-string-prototype-object

var thisStringValue$4 = function thisStringValue(value) {
	if (Type$5(value) === 'String') {
		return value;
	}

	return $StringValueOf$4(value);
};

var $SymbolValueOf$2 = callBound('Symbol.prototype.valueOf', true);



// https://ecma-international.org/ecma-262/9.0/#sec-thissymbolvalue

var thisSymbolValue$2 = function thisSymbolValue(value) {
	if (!$SymbolValueOf$2) {
		throw new SyntaxError('Symbols are not supported; thisSymbolValue requires that `value` be a Symbol or a Symbol object');
	}
	if (Type$5(value) === 'Symbol') {
		return value;
	}
	return $SymbolValueOf$2(value);
};

var thisTimeValue$4 = thisTimeValue$3;

var $Date$f = GetIntrinsic('%Date%');
var $Number$h = GetIntrinsic('%Number%');
var $abs$k = GetIntrinsic('%Math.abs%');





// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.14

var TimeClip$5 = function TimeClip(time) {
	if (!_isFinite(time) || $abs$k(time) > 8.64e15) {
		return NaN;
	}
	return $Number$h(new $Date$f(ToNumber$5(time)));
};

var msPerDay$n = timeConstants.msPerDay;



// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.3

var TimeFromYear$5 = function TimeFromYear(y) {
	return msPerDay$n * DayFromYear$5(y);
};

var $TypeError$44 = GetIntrinsic('%TypeError%');









// https://www.ecma-international.org/ecma-262/9.0/#sec-timestring

var TimeString$1 = function TimeString(tv) {
	if (Type$5(tv) !== 'Number' || _isNaN(tv)) {
		throw new $TypeError$44('Assertion failed: `tv` must be a non-NaN Number');
	}
	var hour = HourFromTime$5(tv);
	var minute = MinFromTime$5(tv);
	var second = SecFromTime$5(tv);
	return padTimeComponent(hour) + ':' + padTimeComponent(minute) + ':' + padTimeComponent(second) + '\x20GMT';
};

var msPerDay$o = timeConstants.msPerDay;

// https://ecma-international.org/ecma-262/5.1/#sec-15.9.1.2

var TimeWithinDay$5 = function TimeWithinDay(t) {
	return mod(t, msPerDay$o);
};

var $TypeError$45 = GetIntrinsic('%TypeError%');
var $Date$g = GetIntrinsic('%Date%');





// https://ecma-international.org/ecma-262/6.0/#sec-todatestring

var ToDateString$4 = function ToDateString(tv) {
	if (Type$5(tv) !== 'Number') {
		throw new $TypeError$45('Assertion failed: `tv` must be a Number');
	}
	if (_isNaN(tv)) {
		return 'Invalid Date';
	}
	return $Date$g(tv);
};

var $RangeError$c = GetIntrinsic('%RangeError%');





// https://www.ecma-international.org/ecma-262/8.0/#sec-toindex

var ToIndex$2 = function ToIndex(value) {
	if (typeof value === 'undefined') {
		return 0;
	}
	var integerIndex = ToInteger$5(value);
	if (integerIndex < 0) {
		throw new $RangeError$c('index must be >= 0');
	}
	var index = ToLength$4(integerIndex);
	if (!SameValueZero$4(integerIndex, index)) {
		throw new $RangeError$c('index must be >= 0 and < 2 ** 53 - 1');
	}
	return index;
};

var $Math$k = GetIntrinsic('%Math%');








var $floor$U = $Math$k.floor;
var $abs$l = $Math$k.abs;

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.7

var ToUint16$5 = function ToUint16(value) {
	var number = ToNumber$5(value);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$U($abs$l(number));
	return mod(posInt, 0x10000);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint16

var ToInt16$4 = function ToInt16(argument) {
	var int16bit = ToUint16$5(argument);
	return int16bit >= 0x8000 ? int16bit - 0x10000 : int16bit;
};

// http://www.ecma-international.org/ecma-262/5.1/#sec-9.5

var ToInt32$5 = function ToInt32(x) {
	return ToNumber$5(x) >> 0;
};

var $Math$l = GetIntrinsic('%Math%');








var $floor$V = $Math$l.floor;
var $abs$m = $Math$l.abs;

var ToUint8$4 = function ToUint8(argument) {
	var number = ToNumber$5(argument);
	if (_isNaN(number) || number === 0 || !_isFinite(number)) { return 0; }
	var posInt = sign(number) * $floor$V($abs$m(number));
	return mod(posInt, 0x100);
};

// https://www.ecma-international.org/ecma-262/6.0/#sec-toint8

var ToInt8$4 = function ToInt8(argument) {
	var int8bit = ToUint8$4(argument);
	return int8bit >= 0x80 ? int8bit - 0x100 : int8bit;
};

var $String$c = GetIntrinsic('%String%');




// https://www.ecma-international.org/ecma-262/6.0/#sec-topropertykey

var ToPropertyKey$4 = function ToPropertyKey(argument) {
	var key = ToPrimitive$5(argument, $String$c);
	return typeof key === 'symbol' ? key : ToString$5(key);
};

var $Math$m = GetIntrinsic('%Math%');





var $floor$W = $Math$m.floor;

// https://www.ecma-international.org/ecma-262/6.0/#sec-touint8clamp

var ToUint8Clamp$4 = function ToUint8Clamp(argument) {
	var number = ToNumber$5(argument);
	if (_isNaN(number) || number <= 0) { return 0; }
	if (number >= 0xFF) { return 0xFF; }
	var f = $floor$W(argument);
	if (f + 0.5 < number) { return f + 1; }
	if (number < f + 0.5) { return f; }
	if (f % 2 !== 0) { return f + 1; }
	return f;
};

var replace = callBind(String.prototype.replace);

/* eslint-disable no-control-regex */
var startWhitespace = /^[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]*/;
/* eslint-enable no-control-regex */

var implementation$3 = function trimStart() {
	return replace(this, startWhitespace, '');
};

var polyfill$2 = function getPolyfill() {
	if (!String.prototype.trimStart && !String.prototype.trimLeft) {
		return implementation$3;
	}
	var zeroWidthSpace = '\u200b';
	var trimmed = zeroWidthSpace.trimStart ? zeroWidthSpace.trimStart() : zeroWidthSpace.trimLeft();
	if (trimmed !== zeroWidthSpace) {
		return implementation$3;
	}
	return String.prototype.trimStart || String.prototype.trimLeft;
};

var shim$1 = function shimTrimStart() {
	var polyfill = polyfill$2();
	defineProperties_1(
		String.prototype,
		{ trimStart: polyfill },
		{ trimStart: function () { return String.prototype.trimStart !== polyfill; } }
	);
	return polyfill;
};

var bound = callBind(polyfill$2());

defineProperties_1(bound, {
	getPolyfill: polyfill$2,
	implementation: implementation$3,
	shim: shim$1
});

var string_prototype_trimstart = bound;

var $replace$b = callBound('String.prototype.replace');

/* eslint-disable no-control-regex */
var endWhitespace = /[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]*$/;
/* eslint-enable no-control-regex */

var implementation$4 = function trimEnd() {
	return $replace$b(this, endWhitespace, '');
};

var polyfill$3 = function getPolyfill() {
	if (!String.prototype.trimEnd && !String.prototype.trimRight) {
		return implementation$4;
	}
	var zeroWidthSpace = '\u200b';
	var trimmed = zeroWidthSpace.trimEnd ? zeroWidthSpace.trimEnd() : zeroWidthSpace.trimRight();
	if (trimmed !== zeroWidthSpace) {
		return implementation$4;
	}
	return String.prototype.trimEnd || String.prototype.trimRight;
};

var shim$2 = function shimTrimEnd() {
	var polyfill = polyfill$3();
	defineProperties_1(
		String.prototype,
		{ trimEnd: polyfill },
		{ trimEnd: function () { return String.prototype.trimEnd !== polyfill; } }
	);
	return polyfill;
};

var bound$1 = callBind(polyfill$3());

defineProperties_1(bound$1, {
	getPolyfill: polyfill$3,
	implementation: implementation$4,
	shim: shim$2
});

var string_prototype_trimend = bound$1;

var $TypeError$46 = GetIntrinsic('%TypeError%');




// https://ecma-international.org/ecma-262/10.0/#sec-trimstring

var TrimString = function TrimString(string, where) {
	var str = RequireObjectCoercible$4(string);
	var S = ToString$5(str);
	var T;
	if (where === 'start') {
		T = string_prototype_trimstart(S);
	} else if (where === 'end') {
		T = string_prototype_trimend(S);
	} else if (where === 'start+end') {
		T = string_prototype_trimstart(string_prototype_trimend(S));
	} else {
		throw new $TypeError$46('Assertion failed: invalid `where` value; must be "start", "end", or "start+end"');
	}
	return T;
};

/* eslint global-require: 0 */
// https://www.ecma-international.org/ecma-262/10.0/#sec-abstract-operations
var ES2019 = {
	'Abstract Equality Comparison': AbstractEqualityComparison$5,
	'Abstract Relational Comparison': AbstractRelationalComparison$5,
	'Strict Equality Comparison': StrictEqualityComparison$5,
	AddEntriesFromIterable: AddEntriesFromIterable,
	AdvanceStringIndex: AdvanceStringIndex$4,
	ArrayCreate: ArrayCreate$4,
	ArraySetLength: ArraySetLength$4,
	ArraySpeciesCreate: ArraySpeciesCreate$4,
	Call: Call$4,
	CanonicalNumericIndexString: CanonicalNumericIndexString$4,
	CompletePropertyDescriptor: CompletePropertyDescriptor$4,
	CopyDataProperties: CopyDataProperties$1,
	CreateDataProperty: CreateDataProperty$4,
	CreateDataPropertyOrThrow: CreateDataPropertyOrThrow$4,
	CreateHTML: CreateHTML$4,
	CreateIterResultObject: CreateIterResultObject$4,
	CreateListFromArrayLike: CreateListFromArrayLike$4,
	CreateMethodProperty: CreateMethodProperty$4,
	DateFromTime: DateFromTime$5,
	DateString: DateString$1,
	Day: Day$5,
	DayFromYear: DayFromYear$5,
	DaysInYear: DaysInYear$5,
	DayWithinYear: DayWithinYear$5,
	DefinePropertyOrThrow: DefinePropertyOrThrow$4,
	DeletePropertyOrThrow: DeletePropertyOrThrow$4,
	EnumerableOwnPropertyNames: EnumerableOwnPropertyNames$1,
	FlattenIntoArray: FlattenIntoArray,
	FromPropertyDescriptor: FromPropertyDescriptor$5,
	Get: Get$4,
	GetIterator: GetIterator$4,
	GetMethod: GetMethod$5,
	GetOwnPropertyKeys: GetOwnPropertyKeys$4,
	GetPrototypeFromConstructor: GetPrototypeFromConstructor$4,
	GetSubstitution: GetSubstitution$4,
	GetV: GetV$4,
	HasOwnProperty: HasOwnProperty$4,
	HasProperty: HasProperty$4,
	HourFromTime: HourFromTime$5,
	InLeapYear: InLeapYear$5,
	InstanceofOperator: InstanceofOperator$4,
	Invoke: Invoke$4,
	IsAccessorDescriptor: IsAccessorDescriptor$5,
	IsArray: IsArray$4,
	IsCallable: IsCallable$5,
	IsConcatSpreadable: IsConcatSpreadable$4,
	IsConstructor: IsConstructor$4,
	IsDataDescriptor: IsDataDescriptor$5,
	IsExtensible: IsExtensible$4,
	IsGenericDescriptor: IsGenericDescriptor$5,
	IsInteger: IsInteger$4,
	IsPromise: IsPromise$4,
	IsPropertyKey: IsPropertyKey$4,
	IsRegExp: IsRegExp$4,
	IsStringPrefix: IsStringPrefix$1,
	IterableToList: IterableToList$2,
	IteratorClose: IteratorClose$4,
	IteratorComplete: IteratorComplete$4,
	IteratorNext: IteratorNext$4,
	IteratorStep: IteratorStep$4,
	IteratorValue: IteratorValue$4,
	MakeDate: MakeDate$5,
	MakeDay: MakeDay$5,
	MakeTime: MakeTime$5,
	MinFromTime: MinFromTime$5,
	modulo: modulo$5,
	MonthFromTime: MonthFromTime$5,
	msFromTime: msFromTime$5,
	NumberToString: NumberToString$1,
	ObjectCreate: ObjectCreate$4,
	OrdinaryDefineOwnProperty: OrdinaryDefineOwnProperty$4,
	OrdinaryGetOwnProperty: OrdinaryGetOwnProperty$4,
	OrdinaryGetPrototypeOf: OrdinaryGetPrototypeOf$3,
	OrdinarySetPrototypeOf: OrdinarySetPrototypeOf$3,
	OrdinaryHasInstance: OrdinaryHasInstance$4,
	OrdinaryHasProperty: OrdinaryHasProperty$4,
	PromiseResolve: PromiseResolve$1,
	RegExpExec: RegExpExec$4,
	RequireObjectCoercible: RequireObjectCoercible$4,
	SameValue: SameValue$5,
	SameValueNonNumber: SameValueNonNumber$3,
	SameValueZero: SameValueZero$4,
	SecFromTime: SecFromTime$5,
	Set: _Set$4,
	SetFunctionName: SetFunctionName$4,
	SetIntegrityLevel: SetIntegrityLevel$4,
	SpeciesConstructor: SpeciesConstructor$4,
	SymbolDescriptiveString: SymbolDescriptiveString$4,
	TestIntegrityLevel: TestIntegrityLevel$4,
	thisBooleanValue: thisBooleanValue$4,
	thisNumberValue: thisNumberValue$4,
	thisStringValue: thisStringValue$4,
	thisSymbolValue: thisSymbolValue$2,
	thisTimeValue: thisTimeValue$4,
	TimeClip: TimeClip$5,
	TimeFromYear: TimeFromYear$5,
	TimeString: TimeString$1,
	TimeWithinDay: TimeWithinDay$5,
	ToBoolean: ToBoolean$5,
	ToDateString: ToDateString$4,
	ToIndex: ToIndex$2,
	ToInt16: ToInt16$4,
	ToInt32: ToInt32$5,
	ToInt8: ToInt8$4,
	ToInteger: ToInteger$5,
	ToLength: ToLength$4,
	ToNumber: ToNumber$5,
	ToObject: ToObject$5,
	ToPrimitive: ToPrimitive$5,
	ToPropertyDescriptor: ToPropertyDescriptor$5,
	ToPropertyKey: ToPropertyKey$4,
	ToString: ToString$5,
	ToUint16: ToUint16$5,
	ToUint32: ToUint32$5,
	ToUint8: ToUint8$4,
	ToUint8Clamp: ToUint8Clamp$4,
	TrimString: TrimString,
	Type: Type$5,
	ValidateAndApplyPropertyDescriptor: ValidateAndApplyPropertyDescriptor$4,
	WeekDay: WeekDay$5,
	YearFromTime: YearFromTime$5
};

var es2019 = ES2019;

var ES$1 = {
	ES5: es5$1,
	ES6: es2015$1,
	ES2015: es2015$1,
	ES7: es2016,
	ES2016: es2016,
	ES2017: es2017,
	ES2018: es2018,
	ES2019: es2019
};
assign(ES$1, es5$1);
delete ES$1.CheckObjectCoercible; // renamed in ES6 to RequireObjectCoercible
assign(ES$1, es2015$1);
