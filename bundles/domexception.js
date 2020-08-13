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

var lib = createCommonjsModule(function (module, exports) {

function _(message, opts) {
    return `${opts && opts.context ? opts.context : "Value"} ${message}.`;
}

function type(V) {
    if (V === null) {
        return "Null";
    }
    switch (typeof V) {
        case "undefined":
            return "Undefined";
        case "boolean":
            return "Boolean";
        case "number":
            return "Number";
        case "string":
            return "String";
        case "symbol":
            return "Symbol";
        case "object":
            // Falls through
        case "function":
            // Falls through
        default:
            // Per ES spec, typeof returns an implemention-defined value that is not any of the existing ones for
            // uncallable non-standard exotic objects. Yet Type() which the Web IDL spec depends on returns Object for
            // such cases. So treat the default case as an object.
            return "Object";
    }
}

// Round x to the nearest integer, choosing the even integer if it lies halfway between two.
function evenRound(x) {
    // There are four cases for numbers with fractional part being .5:
    //
    // case |     x     | floor(x) | round(x) | expected | x <> 0 | x % 1 | x & 1 |   example
    //   1  |  2n + 0.5 |  2n      |  2n + 1  |  2n      |   >    |  0.5  |   0   |  0.5 ->  0
    //   2  |  2n + 1.5 |  2n + 1  |  2n + 2  |  2n + 2  |   >    |  0.5  |   1   |  1.5 ->  2
    //   3  | -2n - 0.5 | -2n - 1  | -2n      | -2n      |   <    | -0.5  |   0   | -0.5 ->  0
    //   4  | -2n - 1.5 | -2n - 2  | -2n - 1  | -2n - 2  |   <    | -0.5  |   1   | -1.5 -> -2
    // (where n is a non-negative integer)
    //
    // Branch here for cases 1 and 4
    if ((x > 0 && (x % 1) === +0.5 && (x & 1) === 0) ||
        (x < 0 && (x % 1) === -0.5 && (x & 1) === 1)) {
        return censorNegativeZero(Math.floor(x));
    }

    return censorNegativeZero(Math.round(x));
}

function integerPart(n) {
    return censorNegativeZero(Math.trunc(n));
}

function sign(x) {
    return x < 0 ? -1 : 1;
}

function modulo(x, y) {
    // https://tc39.github.io/ecma262/#eqn-modulo
    // Note that http://stackoverflow.com/a/4467559/3191 does NOT work for large modulos
    const signMightNotMatch = x % y;
    if (sign(y) !== sign(signMightNotMatch)) {
        return signMightNotMatch + y;
    }
    return signMightNotMatch;
}

function censorNegativeZero(x) {
    return x === 0 ? 0 : x;
}

function createIntegerConversion(bitLength, typeOpts) {
    const isSigned = !typeOpts.unsigned;

    let lowerBound;
    let upperBound;
    if (bitLength === 64) {
        upperBound = Math.pow(2, 53) - 1;
        lowerBound = !isSigned ? 0 : -Math.pow(2, 53) + 1;
    } else if (!isSigned) {
        lowerBound = 0;
        upperBound = Math.pow(2, bitLength) - 1;
    } else {
        lowerBound = -Math.pow(2, bitLength - 1);
        upperBound = Math.pow(2, bitLength - 1) - 1;
    }

    const twoToTheBitLength = Math.pow(2, bitLength);
    const twoToOneLessThanTheBitLength = Math.pow(2, bitLength - 1);

    return (V, opts) => {
        if (opts === undefined) {
            opts = {};
        }

        let x = +V;
        x = censorNegativeZero(x); // Spec discussion ongoing: https://github.com/heycam/webidl/issues/306

        if (opts.enforceRange) {
            if (!Number.isFinite(x)) {
                throw new TypeError(_("is not a finite number", opts));
            }

            x = integerPart(x);

            if (x < lowerBound || x > upperBound) {
                throw new TypeError(_(
                    `is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`, opts));
            }

            return x;
        }

        if (!Number.isNaN(x) && opts.clamp) {
            x = Math.min(Math.max(x, lowerBound), upperBound);
            x = evenRound(x);
            return x;
        }

        if (!Number.isFinite(x) || x === 0) {
            return 0;
        }
        x = integerPart(x);

        // Math.pow(2, 64) is not accurately representable in JavaScript, so try to avoid these per-spec operations if
        // possible. Hopefully it's an optimization for the non-64-bitLength cases too.
        if (x >= lowerBound && x <= upperBound) {
            return x;
        }

        // These will not work great for bitLength of 64, but oh well. See the README for more details.
        x = modulo(x, twoToTheBitLength);
        if (isSigned && x >= twoToOneLessThanTheBitLength) {
            return x - twoToTheBitLength;
        }
        return x;
    };
}

exports.any = V => {
    return V;
};

exports.void = function () {
    return undefined;
};

exports.boolean = function (val) {
    return !!val;
};

exports.byte = createIntegerConversion(8, { unsigned: false });
exports.octet = createIntegerConversion(8, { unsigned: true });

exports.short = createIntegerConversion(16, { unsigned: false });
exports["unsigned short"] = createIntegerConversion(16, { unsigned: true });

exports.long = createIntegerConversion(32, { unsigned: false });
exports["unsigned long"] = createIntegerConversion(32, { unsigned: true });

exports["long long"] = createIntegerConversion(64, { unsigned: false });
exports["unsigned long long"] = createIntegerConversion(64, { unsigned: true });

exports.double = (V, opts) => {
    const x = +V;

    if (!Number.isFinite(x)) {
        throw new TypeError(_("is not a finite floating-point value", opts));
    }

    return x;
};

exports["unrestricted double"] = V => {
    const x = +V;

    return x;
};

exports.float = (V, opts) => {
    const x = +V;

    if (!Number.isFinite(x)) {
        throw new TypeError(_("is not a finite floating-point value", opts));
    }

    if (Object.is(x, -0)) {
        return x;
    }

    const y = Math.fround(x);

    if (!Number.isFinite(y)) {
        throw new TypeError(_("is outside the range of a single-precision floating-point value", opts));
    }

    return y;
};

exports["unrestricted float"] = V => {
    const x = +V;

    if (isNaN(x)) {
        return x;
    }

    if (Object.is(x, -0)) {
        return x;
    }

    return Math.fround(x);
};

exports.DOMString = function (V, opts) {
    if (opts === undefined) {
        opts = {};
    }

    if (opts.treatNullAsEmptyString && V === null) {
        return "";
    }

    if (typeof V === "symbol") {
        throw new TypeError(_("is a symbol, which cannot be converted to a string", opts));
    }

    return String(V);
};

exports.ByteString = (V, opts) => {
    const x = exports.DOMString(V, opts);
    let c;
    for (let i = 0; (c = x.codePointAt(i)) !== undefined; ++i) {
        if (c > 255) {
            throw new TypeError(_("is not a valid ByteString", opts));
        }
    }

    return x;
};

exports.USVString = (V, opts) => {
    const S = exports.DOMString(V, opts);
    const n = S.length;
    const U = [];
    for (let i = 0; i < n; ++i) {
        const c = S.charCodeAt(i);
        if (c < 0xD800 || c > 0xDFFF) {
            U.push(String.fromCodePoint(c));
        } else if (0xDC00 <= c && c <= 0xDFFF) {
            U.push(String.fromCodePoint(0xFFFD));
        } else if (i === n - 1) {
            U.push(String.fromCodePoint(0xFFFD));
        } else {
            const d = S.charCodeAt(i + 1);
            if (0xDC00 <= d && d <= 0xDFFF) {
                const a = c & 0x3FF;
                const b = d & 0x3FF;
                U.push(String.fromCodePoint((2 << 15) + ((2 << 9) * a) + b));
                ++i;
            } else {
                U.push(String.fromCodePoint(0xFFFD));
            }
        }
    }

    return U.join("");
};

exports.object = (V, opts) => {
    if (type(V) !== "Object") {
        throw new TypeError(_("is not an object", opts));
    }

    return V;
};

// Not exported, but used in Function and VoidFunction.

// Neither Function nor VoidFunction is defined with [TreatNonObjectAsNull], so
// handling for that is omitted.
function convertCallbackFunction(V, opts) {
    if (typeof V !== "function") {
        throw new TypeError(_("is not a function", opts));
    }
    return V;
}

const abByteLengthGetter =
    Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get;

function isArrayBuffer(V) {
    try {
        abByteLengthGetter.call(V);
        return true;
    } catch (e) {
        return false;
    }
}

// I don't think we can reliably detect detached ArrayBuffers.
exports.ArrayBuffer = (V, opts) => {
    if (!isArrayBuffer(V)) {
        throw new TypeError(_("is not a view on an ArrayBuffer object", opts));
    }
    return V;
};

const dvByteLengthGetter =
    Object.getOwnPropertyDescriptor(DataView.prototype, "byteLength").get;
exports.DataView = (V, opts) => {
    try {
        dvByteLengthGetter.call(V);
        return V;
    } catch (e) {
        throw new TypeError(_("is not a view on an DataView object", opts));
    }
};

[
    Int8Array, Int16Array, Int32Array, Uint8Array,
    Uint16Array, Uint32Array, Uint8ClampedArray, Float32Array, Float64Array
].forEach(func => {
    const name = func.name;
    const article = /^[AEIOU]/.test(name) ? "an" : "a";
    exports[name] = (V, opts) => {
        if (!ArrayBuffer.isView(V) || V.constructor.name !== name) {
            throw new TypeError(_(`is not ${article} ${name} object`, opts));
        }

        return V;
    };
});

// Common definitions

exports.ArrayBufferView = (V, opts) => {
    if (!ArrayBuffer.isView(V)) {
        throw new TypeError(_("is not a view on an ArrayBuffer object", opts));
    }

    return V;
};

exports.BufferSource = (V, opts) => {
    if (!ArrayBuffer.isView(V) && !isArrayBuffer(V)) {
        throw new TypeError(_("is not an ArrayBuffer object or a view on one", opts));
    }

    return V;
};

exports.DOMTimeStamp = exports["unsigned long long"];

exports.Function = convertCallbackFunction;

exports.VoidFunction = convertCallbackFunction;
});

var utils = createCommonjsModule(function (module, exports) {

// Returns "Type(value) is Object" in ES terminology.
function isObject(value) {
  return typeof value === "object" && value !== null || typeof value === "function";
}

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

const wrapperSymbol = Symbol("wrapper");
const implSymbol = Symbol("impl");
const sameObjectCaches = Symbol("SameObject caches");
const ctorRegistrySymbol = Symbol.for("[webidl2js]  constructor registry");

function getSameObject(wrapper, prop, creator) {
  if (!wrapper[sameObjectCaches]) {
    wrapper[sameObjectCaches] = Object.create(null);
  }

  if (prop in wrapper[sameObjectCaches]) {
    return wrapper[sameObjectCaches][prop];
  }

  wrapper[sameObjectCaches][prop] = creator();
  return wrapper[sameObjectCaches][prop];
}

function wrapperForImpl(impl) {
  return impl ? impl[wrapperSymbol] : null;
}

function implForWrapper(wrapper) {
  return wrapper ? wrapper[implSymbol] : null;
}

function tryWrapperForImpl(impl) {
  const wrapper = wrapperForImpl(impl);
  return wrapper ? wrapper : impl;
}

function tryImplForWrapper(wrapper) {
  const impl = implForWrapper(wrapper);
  return impl ? impl : wrapper;
}

const iterInternalSymbol = Symbol("internal");
const IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));

function isArrayIndexPropName(P) {
  if (typeof P !== "string") {
    return false;
  }
  const i = P >>> 0;
  if (i === Math.pow(2, 32) - 1) {
    return false;
  }
  const s = `${i}`;
  if (P !== s) {
    return false;
  }
  return true;
}

const byteLengthGetter =
    Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get;
function isArrayBuffer(value) {
  try {
    byteLengthGetter.call(value);
    return true;
  } catch (e) {
    return false;
  }
}

const supportsPropertyIndex = Symbol("supports property index");
const supportedPropertyIndices = Symbol("supported property indices");
const supportsPropertyName = Symbol("supports property name");
const supportedPropertyNames = Symbol("supported property names");
const indexedGet = Symbol("indexed property get");
const indexedSetNew = Symbol("indexed property set new");
const indexedSetExisting = Symbol("indexed property set existing");
const namedGet = Symbol("named property get");
const namedSetNew = Symbol("named property set new");
const namedSetExisting = Symbol("named property set existing");
const namedDelete = Symbol("named property delete");

module.exports = exports = {
  isObject,
  hasOwn,
  wrapperSymbol,
  implSymbol,
  getSameObject,
  ctorRegistrySymbol,
  wrapperForImpl,
  implForWrapper,
  tryWrapperForImpl,
  tryImplForWrapper,
  iterInternalSymbol,
  IteratorPrototype,
  isArrayBuffer,
  isArrayIndexPropName,
  supportsPropertyIndex,
  supportedPropertyIndices,
  supportsPropertyName,
  supportedPropertyNames,
  indexedGet,
  indexedSetNew,
  indexedSetExisting,
  namedGet,
  namedSetNew,
  namedSetExisting,
  namedDelete
};
});

var IndexSizeError = 1;
var DOMStringSizeError = 2;
var HierarchyRequestError = 3;
var WrongDocumentError = 4;
var InvalidCharacterError = 5;
var NoDataAllowedError = 6;
var NoModificationAllowedError = 7;
var NotFoundError = 8;
var NotSupportedError = 9;
var InUseAttributeError = 10;
var InvalidStateError = 11;
var InvalidModificationError = 13;
var NamespaceError = 14;
var InvalidAccessError = 15;
var ValidationError = 16;
var TypeMismatchError = 17;
var SecurityError = 18;
var NetworkError = 19;
var AbortError = 20;
var URLMismatchError = 21;
var QuotaExceededError = 22;
var TimeoutError = 23;
var InvalidNodeTypeError = 24;
var DataCloneError = 25;
var legacyErrorCodes = {
	IndexSizeError: IndexSizeError,
	DOMStringSizeError: DOMStringSizeError,
	HierarchyRequestError: HierarchyRequestError,
	WrongDocumentError: WrongDocumentError,
	InvalidCharacterError: InvalidCharacterError,
	NoDataAllowedError: NoDataAllowedError,
	NoModificationAllowedError: NoModificationAllowedError,
	NotFoundError: NotFoundError,
	NotSupportedError: NotSupportedError,
	InUseAttributeError: InUseAttributeError,
	InvalidStateError: InvalidStateError,
	"SyntaxError": 12,
	InvalidModificationError: InvalidModificationError,
	NamespaceError: NamespaceError,
	InvalidAccessError: InvalidAccessError,
	ValidationError: ValidationError,
	TypeMismatchError: TypeMismatchError,
	SecurityError: SecurityError,
	NetworkError: NetworkError,
	AbortError: AbortError,
	URLMismatchError: URLMismatchError,
	QuotaExceededError: QuotaExceededError,
	TimeoutError: TimeoutError,
	InvalidNodeTypeError: InvalidNodeTypeError,
	DataCloneError: DataCloneError
};

var legacyErrorCodes$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	IndexSizeError: IndexSizeError,
	DOMStringSizeError: DOMStringSizeError,
	HierarchyRequestError: HierarchyRequestError,
	WrongDocumentError: WrongDocumentError,
	InvalidCharacterError: InvalidCharacterError,
	NoDataAllowedError: NoDataAllowedError,
	NoModificationAllowedError: NoModificationAllowedError,
	NotFoundError: NotFoundError,
	NotSupportedError: NotSupportedError,
	InUseAttributeError: InUseAttributeError,
	InvalidStateError: InvalidStateError,
	InvalidModificationError: InvalidModificationError,
	NamespaceError: NamespaceError,
	InvalidAccessError: InvalidAccessError,
	ValidationError: ValidationError,
	TypeMismatchError: TypeMismatchError,
	SecurityError: SecurityError,
	NetworkError: NetworkError,
	AbortError: AbortError,
	URLMismatchError: URLMismatchError,
	QuotaExceededError: QuotaExceededError,
	TimeoutError: TimeoutError,
	InvalidNodeTypeError: InvalidNodeTypeError,
	DataCloneError: DataCloneError,
	'default': legacyErrorCodes
});

var legacyErrorCodes$2 = getCjsExportFromNamespace(legacyErrorCodes$1);

var implementation = class DOMExceptionImpl {
  constructor(globalObject, [message, name]) {
    this.name = name;
    this.message = message;
  }

  get code() {
    return legacyErrorCodes$2[this.name] || 0;
  }
};

// A proprietary V8 extension that causes the stack property to appear.
var init = impl => {
  if (Error.captureStackTrace) {
    const wrapper = utils.wrapperForImpl(impl);
    Error.captureStackTrace(wrapper, wrapper.constructor);
  }
};

var DOMExceptionImpl_1 = {
	implementation: implementation,
	init: init
};

var DOMException = createCommonjsModule(function (module) {




const impl = utils.implSymbol;
const ctorRegistry = utils.ctorRegistrySymbol;

const iface = {
  // When an interface-module that implements this interface as a mixin is loaded, it will append its own `.is()`
  // method into this array. It allows objects that directly implements *those* interfaces to be recognized as
  // implementing this mixin interface.
  _mixedIntoPredicates: [],
  is(obj) {
    if (obj) {
      if (utils.hasOwn(obj, impl) && obj[impl] instanceof DOMExceptionImpl_1.implementation) {
        return true;
      }
      for (const isMixedInto of module.exports._mixedIntoPredicates) {
        if (isMixedInto(obj)) {
          return true;
        }
      }
    }
    return false;
  },
  isImpl(obj) {
    if (obj) {
      if (obj instanceof DOMExceptionImpl_1.implementation) {
        return true;
      }

      const wrapper = utils.wrapperForImpl(obj);
      for (const isMixedInto of module.exports._mixedIntoPredicates) {
        if (isMixedInto(wrapper)) {
          return true;
        }
      }
    }
    return false;
  },
  convert(obj, { context = "The provided value" } = {}) {
    if (module.exports.is(obj)) {
      return utils.implForWrapper(obj);
    }
    throw new TypeError(`${context} is not of type 'DOMException'.`);
  },

  create(globalObject, constructorArgs, privateData) {
    if (globalObject[ctorRegistry] === undefined) {
      throw new Error("Internal error: invalid global object");
    }

    const ctor = globalObject[ctorRegistry]["DOMException"];
    if (ctor === undefined) {
      throw new Error("Internal error: constructor DOMException is not installed on the passed global object");
    }

    let obj = Object.create(ctor.prototype);
    obj = iface.setup(obj, globalObject, constructorArgs, privateData);
    return obj;
  },
  createImpl(globalObject, constructorArgs, privateData) {
    const obj = iface.create(globalObject, constructorArgs, privateData);
    return utils.implForWrapper(obj);
  },
  _internalSetup(obj) {},
  setup(obj, globalObject, constructorArgs = [], privateData = {}) {
    privateData.wrapper = obj;

    iface._internalSetup(obj);
    Object.defineProperty(obj, impl, {
      value: new DOMExceptionImpl_1.implementation(globalObject, constructorArgs, privateData),
      configurable: true
    });

    obj[impl][utils.wrapperSymbol] = obj;
    if (DOMExceptionImpl_1.init) {
      DOMExceptionImpl_1.init(obj[impl], privateData);
    }
    return obj;
  },

  install(globalObject) {
    class DOMException {
      constructor() {
        const args = [];
        {
          let curArg = arguments[0];
          if (curArg !== undefined) {
            curArg = lib["DOMString"](curArg, { context: "Failed to construct 'DOMException': parameter 1" });
          } else {
            curArg = "";
          }
          args.push(curArg);
        }
        {
          let curArg = arguments[1];
          if (curArg !== undefined) {
            curArg = lib["DOMString"](curArg, { context: "Failed to construct 'DOMException': parameter 2" });
          } else {
            curArg = "Error";
          }
          args.push(curArg);
        }
        return iface.setup(Object.create(new.target.prototype), globalObject, args);
      }

      get name() {
        if (!this || !module.exports.is(this)) {
          throw new TypeError("Illegal invocation");
        }

        return this[impl]["name"];
      }

      get message() {
        if (!this || !module.exports.is(this)) {
          throw new TypeError("Illegal invocation");
        }

        return this[impl]["message"];
      }

      get code() {
        if (!this || !module.exports.is(this)) {
          throw new TypeError("Illegal invocation");
        }

        return this[impl]["code"];
      }
    }
    Object.defineProperties(DOMException.prototype, {
      name: { enumerable: true },
      message: { enumerable: true },
      code: { enumerable: true },
      [Symbol.toStringTag]: { value: "DOMException", configurable: true },
      INDEX_SIZE_ERR: { value: 1, enumerable: true },
      DOMSTRING_SIZE_ERR: { value: 2, enumerable: true },
      HIERARCHY_REQUEST_ERR: { value: 3, enumerable: true },
      WRONG_DOCUMENT_ERR: { value: 4, enumerable: true },
      INVALID_CHARACTER_ERR: { value: 5, enumerable: true },
      NO_DATA_ALLOWED_ERR: { value: 6, enumerable: true },
      NO_MODIFICATION_ALLOWED_ERR: { value: 7, enumerable: true },
      NOT_FOUND_ERR: { value: 8, enumerable: true },
      NOT_SUPPORTED_ERR: { value: 9, enumerable: true },
      INUSE_ATTRIBUTE_ERR: { value: 10, enumerable: true },
      INVALID_STATE_ERR: { value: 11, enumerable: true },
      SYNTAX_ERR: { value: 12, enumerable: true },
      INVALID_MODIFICATION_ERR: { value: 13, enumerable: true },
      NAMESPACE_ERR: { value: 14, enumerable: true },
      INVALID_ACCESS_ERR: { value: 15, enumerable: true },
      VALIDATION_ERR: { value: 16, enumerable: true },
      TYPE_MISMATCH_ERR: { value: 17, enumerable: true },
      SECURITY_ERR: { value: 18, enumerable: true },
      NETWORK_ERR: { value: 19, enumerable: true },
      ABORT_ERR: { value: 20, enumerable: true },
      URL_MISMATCH_ERR: { value: 21, enumerable: true },
      QUOTA_EXCEEDED_ERR: { value: 22, enumerable: true },
      TIMEOUT_ERR: { value: 23, enumerable: true },
      INVALID_NODE_TYPE_ERR: { value: 24, enumerable: true },
      DATA_CLONE_ERR: { value: 25, enumerable: true }
    });
    Object.defineProperties(DOMException, {
      INDEX_SIZE_ERR: { value: 1, enumerable: true },
      DOMSTRING_SIZE_ERR: { value: 2, enumerable: true },
      HIERARCHY_REQUEST_ERR: { value: 3, enumerable: true },
      WRONG_DOCUMENT_ERR: { value: 4, enumerable: true },
      INVALID_CHARACTER_ERR: { value: 5, enumerable: true },
      NO_DATA_ALLOWED_ERR: { value: 6, enumerable: true },
      NO_MODIFICATION_ALLOWED_ERR: { value: 7, enumerable: true },
      NOT_FOUND_ERR: { value: 8, enumerable: true },
      NOT_SUPPORTED_ERR: { value: 9, enumerable: true },
      INUSE_ATTRIBUTE_ERR: { value: 10, enumerable: true },
      INVALID_STATE_ERR: { value: 11, enumerable: true },
      SYNTAX_ERR: { value: 12, enumerable: true },
      INVALID_MODIFICATION_ERR: { value: 13, enumerable: true },
      NAMESPACE_ERR: { value: 14, enumerable: true },
      INVALID_ACCESS_ERR: { value: 15, enumerable: true },
      VALIDATION_ERR: { value: 16, enumerable: true },
      TYPE_MISMATCH_ERR: { value: 17, enumerable: true },
      SECURITY_ERR: { value: 18, enumerable: true },
      NETWORK_ERR: { value: 19, enumerable: true },
      ABORT_ERR: { value: 20, enumerable: true },
      URL_MISMATCH_ERR: { value: 21, enumerable: true },
      QUOTA_EXCEEDED_ERR: { value: 22, enumerable: true },
      TIMEOUT_ERR: { value: 23, enumerable: true },
      INVALID_NODE_TYPE_ERR: { value: 24, enumerable: true },
      DATA_CLONE_ERR: { value: 25, enumerable: true }
    });
    if (globalObject[ctorRegistry] === undefined) {
      globalObject[ctorRegistry] = Object.create(null);
    }
    globalObject[ctorRegistry]["DOMException"] = DOMException;

    Object.defineProperty(globalObject, "DOMException", {
      configurable: true,
      writable: true,
      value: DOMException
    });
  }
}; // iface
module.exports = iface;
});

// Special install function to make the DOMException inherit from Error.
// https://heycam.github.io/webidl/#es-DOMException-specialness
function installOverride(globalObject) {
  if (typeof globalObject.Error !== "function") {
    throw new Error("Internal error: Error constructor is not present on the given global object.");
  }

  DOMException.install(globalObject);
  Object.setPrototypeOf(globalObject.DOMException.prototype, globalObject.Error.prototype);
}

var webidl2jsWrapper = {...DOMException, install: installOverride };

const sharedGlobalObject = { Error };
webidl2jsWrapper.install(sharedGlobalObject);
