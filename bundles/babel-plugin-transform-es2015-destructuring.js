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

var classCallCheck = createCommonjsModule(function (module, exports) {

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
});

var _iterStep = function (done, value) {
  return { value: value, done: !!done };
};

var _iterators = {};

var toString = {}.toString;

var _cof = function (it) {
  return toString.call(it).slice(8, -1);
};

// fallback for non-array-like ES3 and non-enumerable old V8 strings

// eslint-disable-next-line no-prototype-builtins
var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return _cof(it) == 'String' ? it.split('') : Object(it);
};

// 7.2.1 RequireObjectCoercible(argument)
var _defined = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

// to indexed object, toObject with fallback for non-array-like ES3 strings


var _toIobject = function (it) {
  return _iobject(_defined(it));
};

var _global = createCommonjsModule(function (module) {
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
});

var _core = createCommonjsModule(function (module) {
var core = module.exports = { version: '2.6.11' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
});

var _aFunction = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

// optional / simple context binding

var _ctx = function (fn, that, length) {
  _aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

var _isObject = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

var _anObject = function (it) {
  if (!_isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

var _fails = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var _descriptors = !_fails(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

var document = _global.document;
// typeof document.createElement is 'object' in old IE
var is = _isObject(document) && _isObject(document.createElement);
var _domCreate = function (it) {
  return is ? document.createElement(it) : {};
};

var _ie8DomDefine = !_descriptors && !_fails(function () {
  return Object.defineProperty(_domCreate('div'), 'a', { get: function () { return 7; } }).a != 7;
});

// 7.1.1 ToPrimitive(input [, PreferredType])

// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var _toPrimitive = function (it, S) {
  if (!_isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !_isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

var dP = Object.defineProperty;

var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  _anObject(O);
  P = _toPrimitive(P, true);
  _anObject(Attributes);
  if (_ie8DomDefine) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var _objectDp = {
	f: f
};

var _propertyDesc = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var _hide = _descriptors ? function (object, key, value) {
  return _objectDp.f(object, key, _propertyDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var hasOwnProperty = {}.hasOwnProperty;
var _has = function (it, key) {
  return hasOwnProperty.call(it, key);
};

var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var IS_WRAP = type & $export.W;
  var exports = IS_GLOBAL ? _core : _core[name] || (_core[name] = {});
  var expProto = exports[PROTOTYPE];
  var target = IS_GLOBAL ? _global : IS_STATIC ? _global[name] : (_global[name] || {})[PROTOTYPE];
  var key, own, out;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if (own && _has(exports, key)) continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? _ctx(out, _global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function (C) {
      var F = function (a, b, c) {
        if (this instanceof C) {
          switch (arguments.length) {
            case 0: return new C();
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? _ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if (IS_PROTO) {
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if (type & $export.R && expProto && !expProto[key]) _hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
var _export = $export;

var _redefine = _hide;

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
var _toInteger = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

// 7.1.15 ToLength

var min = Math.min;
var _toLength = function (it) {
  return it > 0 ? min(_toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

var max = Math.max;
var min$1 = Math.min;
var _toAbsoluteIndex = function (index, length) {
  index = _toInteger(index);
  return index < 0 ? max(index + length, 0) : min$1(index, length);
};

// false -> Array#indexOf
// true  -> Array#includes



var _arrayIncludes = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = _toIobject($this);
    var length = _toLength(O.length);
    var index = _toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var _shared = createCommonjsModule(function (module) {
var SHARED = '__core-js_shared__';
var store = _global[SHARED] || (_global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: _core.version,
  mode:  'pure' ,
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});
});

var id = 0;
var px = Math.random();
var _uid = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

var shared = _shared('keys');

var _sharedKey = function (key) {
  return shared[key] || (shared[key] = _uid(key));
};

var arrayIndexOf = _arrayIncludes(false);
var IE_PROTO = _sharedKey('IE_PROTO');

var _objectKeysInternal = function (object, names) {
  var O = _toIobject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) _has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (_has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

// IE 8- don't enum bug keys
var _enumBugKeys = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

// 19.1.2.14 / 15.2.3.14 Object.keys(O)



var _objectKeys = Object.keys || function keys(O) {
  return _objectKeysInternal(O, _enumBugKeys);
};

var _objectDps = _descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
  _anObject(O);
  var keys = _objectKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) _objectDp.f(O, P = keys[i++], Properties[P]);
  return O;
};

var document$1 = _global.document;
var _html = document$1 && document$1.documentElement;

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])



var IE_PROTO$1 = _sharedKey('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE$1 = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = _domCreate('iframe');
  var i = _enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  _html.appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE$1][_enumBugKeys[i]];
  return createDict();
};

var _objectCreate = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE$1] = _anObject(O);
    result = new Empty();
    Empty[PROTOTYPE$1] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO$1] = O;
  } else result = createDict();
  return Properties === undefined ? result : _objectDps(result, Properties);
};

var _wks = createCommonjsModule(function (module) {
var store = _shared('wks');

var Symbol = _global.Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : _uid)('Symbol.' + name));
};

$exports.store = store;
});

var def = _objectDp.f;

var TAG = _wks('toStringTag');

var _setToStringTag = function (it, tag, stat) {
  if (it && !_has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
_hide(IteratorPrototype, _wks('iterator'), function () { return this; });

var _iterCreate = function (Constructor, NAME, next) {
  Constructor.prototype = _objectCreate(IteratorPrototype, { next: _propertyDesc(1, next) });
  _setToStringTag(Constructor, NAME + ' Iterator');
};

// 7.1.13 ToObject(argument)

var _toObject = function (it) {
  return Object(_defined(it));
};

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)


var IE_PROTO$2 = _sharedKey('IE_PROTO');
var ObjectProto = Object.prototype;

var _objectGpo = Object.getPrototypeOf || function (O) {
  O = _toObject(O);
  if (_has(O, IE_PROTO$2)) return O[IE_PROTO$2];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

var ITERATOR = _wks('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

var _iterDefine = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  _iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = _objectGpo($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      _setToStringTag(IteratorPrototype, TAG, true);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if (( FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    _hide(proto, ITERATOR, $default);
  }
  // Plug for library
  _iterators[NAME] = $default;
  _iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) _redefine(proto, key, methods[key]);
    } else _export(_export.P + _export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
var es6_array_iterator = _iterDefine(Array, 'Array', function (iterated, kind) {
  this._t = _toIobject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return _iterStep(1);
  }
  if (kind == 'keys') return _iterStep(0, index);
  if (kind == 'values') return _iterStep(0, O[index]);
  return _iterStep(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
_iterators.Arguments = _iterators.Array;

var TO_STRING_TAG = _wks('toStringTag');

var DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +
  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +
  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +
  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +
  'TextTrackList,TouchList').split(',');

for (var i = 0; i < DOMIterables.length; i++) {
  var NAME = DOMIterables[i];
  var Collection = _global[NAME];
  var proto = Collection && Collection.prototype;
  if (proto && !proto[TO_STRING_TAG]) _hide(proto, TO_STRING_TAG, NAME);
  _iterators[NAME] = _iterators.Array;
}

// true  -> String#at
// false -> String#codePointAt
var _stringAt = function (TO_STRING) {
  return function (that, pos) {
    var s = String(_defined(that));
    var i = _toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

var $at = _stringAt(true);

// 21.1.3.27 String.prototype[@@iterator]()
_iterDefine(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});

// getting tag from 19.1.3.6 Object.prototype.toString()

var TAG$1 = _wks('toStringTag');
// ES3 wrong here
var ARG = _cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

var _classof = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG$1)) == 'string' ? T
    // builtinTag case
    : ARG ? _cof(O)
    // ES3 arguments fallback
    : (B = _cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

var ITERATOR$1 = _wks('iterator');

var core_getIteratorMethod = _core.getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR$1]
    || it['@@iterator']
    || _iterators[_classof(it)];
};

var core_getIterator = _core.getIterator = function (it) {
  var iterFn = core_getIteratorMethod(it);
  if (typeof iterFn != 'function') throw TypeError(it + ' is not iterable!');
  return _anObject(iterFn.call(it));
};

var getIterator = core_getIterator;

var getIterator$1 = createCommonjsModule(function (module) {
module.exports = { "default": getIterator, __esModule: true };
});

var lib = createCommonjsModule(function (module, exports) {

exports.__esModule = true;



var _classCallCheck3 = _interopRequireDefault(classCallCheck);



var _getIterator3 = _interopRequireDefault(getIterator$1);

exports.default = function (_ref) {
  var t = _ref.types;


  function variableDeclarationHasPattern(node) {
    for (var _iterator = node.declarations, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
      var _ref2;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref2 = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref2 = _i.value;
      }

      var declar = _ref2;

      if (t.isPattern(declar.id)) {
        return true;
      }
    }
    return false;
  }

  function hasRest(pattern) {
    for (var _iterator2 = pattern.elements, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : (0, _getIterator3.default)(_iterator2);;) {
      var _ref3;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref3 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref3 = _i2.value;
      }

      var elem = _ref3;

      if (t.isRestElement(elem)) {
        return true;
      }
    }
    return false;
  }

  var arrayUnpackVisitor = {
    ReferencedIdentifier: function ReferencedIdentifier(path, state) {
      if (state.bindings[path.node.name]) {
        state.deopt = true;
        path.stop();
      }
    }
  };

  var DestructuringTransformer = function () {
    function DestructuringTransformer(opts) {
      (0, _classCallCheck3.default)(this, DestructuringTransformer);

      this.blockHoist = opts.blockHoist;
      this.operator = opts.operator;
      this.arrays = {};
      this.nodes = opts.nodes || [];
      this.scope = opts.scope;
      this.file = opts.file;
      this.kind = opts.kind;
    }

    DestructuringTransformer.prototype.buildVariableAssignment = function buildVariableAssignment(id, init) {
      var op = this.operator;
      if (t.isMemberExpression(id)) op = "=";

      var node = void 0;

      if (op) {
        node = t.expressionStatement(t.assignmentExpression(op, id, init));
      } else {
        node = t.variableDeclaration(this.kind, [t.variableDeclarator(id, init)]);
      }

      node._blockHoist = this.blockHoist;

      return node;
    };

    DestructuringTransformer.prototype.buildVariableDeclaration = function buildVariableDeclaration(id, init) {
      var declar = t.variableDeclaration("var", [t.variableDeclarator(id, init)]);
      declar._blockHoist = this.blockHoist;
      return declar;
    };

    DestructuringTransformer.prototype.push = function push(id, init) {
      if (t.isObjectPattern(id)) {
        this.pushObjectPattern(id, init);
      } else if (t.isArrayPattern(id)) {
        this.pushArrayPattern(id, init);
      } else if (t.isAssignmentPattern(id)) {
        this.pushAssignmentPattern(id, init);
      } else {
        this.nodes.push(this.buildVariableAssignment(id, init));
      }
    };

    DestructuringTransformer.prototype.toArray = function toArray(node, count) {
      if (this.file.opts.loose || t.isIdentifier(node) && this.arrays[node.name]) {
        return node;
      } else {
        return this.scope.toArray(node, count);
      }
    };

    DestructuringTransformer.prototype.pushAssignmentPattern = function pushAssignmentPattern(pattern, valueRef) {

      var tempValueRef = this.scope.generateUidIdentifierBasedOnNode(valueRef);

      var declar = t.variableDeclaration("var", [t.variableDeclarator(tempValueRef, valueRef)]);
      declar._blockHoist = this.blockHoist;
      this.nodes.push(declar);

      var tempConditional = t.conditionalExpression(t.binaryExpression("===", tempValueRef, t.identifier("undefined")), pattern.right, tempValueRef);

      var left = pattern.left;
      if (t.isPattern(left)) {
        var tempValueDefault = t.expressionStatement(t.assignmentExpression("=", tempValueRef, tempConditional));
        tempValueDefault._blockHoist = this.blockHoist;

        this.nodes.push(tempValueDefault);
        this.push(left, tempValueRef);
      } else {
        this.nodes.push(this.buildVariableAssignment(left, tempConditional));
      }
    };

    DestructuringTransformer.prototype.pushObjectRest = function pushObjectRest(pattern, objRef, spreadProp, spreadPropIndex) {

      var keys = [];

      for (var i = 0; i < pattern.properties.length; i++) {
        var prop = pattern.properties[i];

        if (i >= spreadPropIndex) break;

        if (t.isRestProperty(prop)) continue;

        var key = prop.key;
        if (t.isIdentifier(key) && !prop.computed) key = t.stringLiteral(prop.key.name);
        keys.push(key);
      }

      keys = t.arrayExpression(keys);

      var value = t.callExpression(this.file.addHelper("objectWithoutProperties"), [objRef, keys]);
      this.nodes.push(this.buildVariableAssignment(spreadProp.argument, value));
    };

    DestructuringTransformer.prototype.pushObjectProperty = function pushObjectProperty(prop, propRef) {
      if (t.isLiteral(prop.key)) prop.computed = true;

      var pattern = prop.value;
      var objRef = t.memberExpression(propRef, prop.key, prop.computed);

      if (t.isPattern(pattern)) {
        this.push(pattern, objRef);
      } else {
        this.nodes.push(this.buildVariableAssignment(pattern, objRef));
      }
    };

    DestructuringTransformer.prototype.pushObjectPattern = function pushObjectPattern(pattern, objRef) {

      if (!pattern.properties.length) {
        this.nodes.push(t.expressionStatement(t.callExpression(this.file.addHelper("objectDestructuringEmpty"), [objRef])));
      }

      if (pattern.properties.length > 1 && !this.scope.isStatic(objRef)) {
        var temp = this.scope.generateUidIdentifierBasedOnNode(objRef);
        this.nodes.push(this.buildVariableDeclaration(temp, objRef));
        objRef = temp;
      }

      for (var i = 0; i < pattern.properties.length; i++) {
        var prop = pattern.properties[i];
        if (t.isRestProperty(prop)) {
          this.pushObjectRest(pattern, objRef, prop, i);
        } else {
          this.pushObjectProperty(prop, objRef);
        }
      }
    };

    DestructuringTransformer.prototype.canUnpackArrayPattern = function canUnpackArrayPattern(pattern, arr) {
      if (!t.isArrayExpression(arr)) return false;

      if (pattern.elements.length > arr.elements.length) return;
      if (pattern.elements.length < arr.elements.length && !hasRest(pattern)) return false;

      for (var _iterator3 = pattern.elements, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : (0, _getIterator3.default)(_iterator3);;) {
        var _ref4;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref4 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref4 = _i3.value;
        }

        var elem = _ref4;

        if (!elem) return false;

        if (t.isMemberExpression(elem)) return false;
      }

      for (var _iterator4 = arr.elements, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : (0, _getIterator3.default)(_iterator4);;) {
        var _ref5;

        if (_isArray4) {
          if (_i4 >= _iterator4.length) break;
          _ref5 = _iterator4[_i4++];
        } else {
          _i4 = _iterator4.next();
          if (_i4.done) break;
          _ref5 = _i4.value;
        }

        var _elem = _ref5;

        if (t.isSpreadElement(_elem)) return false;

        if (t.isCallExpression(_elem)) return false;

        if (t.isMemberExpression(_elem)) return false;
      }

      var bindings = t.getBindingIdentifiers(pattern);
      var state = { deopt: false, bindings: bindings };
      this.scope.traverse(arr, arrayUnpackVisitor, state);
      return !state.deopt;
    };

    DestructuringTransformer.prototype.pushUnpackedArrayPattern = function pushUnpackedArrayPattern(pattern, arr) {
      for (var i = 0; i < pattern.elements.length; i++) {
        var elem = pattern.elements[i];
        if (t.isRestElement(elem)) {
          this.push(elem.argument, t.arrayExpression(arr.elements.slice(i)));
        } else {
          this.push(elem, arr.elements[i]);
        }
      }
    };

    DestructuringTransformer.prototype.pushArrayPattern = function pushArrayPattern(pattern, arrayRef) {
      if (!pattern.elements) return;

      if (this.canUnpackArrayPattern(pattern, arrayRef)) {
        return this.pushUnpackedArrayPattern(pattern, arrayRef);
      }

      var count = !hasRest(pattern) && pattern.elements.length;

      var toArray = this.toArray(arrayRef, count);

      if (t.isIdentifier(toArray)) {
        arrayRef = toArray;
      } else {
        arrayRef = this.scope.generateUidIdentifierBasedOnNode(arrayRef);
        this.arrays[arrayRef.name] = true;
        this.nodes.push(this.buildVariableDeclaration(arrayRef, toArray));
      }

      for (var i = 0; i < pattern.elements.length; i++) {
        var elem = pattern.elements[i];

        if (!elem) continue;

        var elemRef = void 0;

        if (t.isRestElement(elem)) {
          elemRef = this.toArray(arrayRef);
          elemRef = t.callExpression(t.memberExpression(elemRef, t.identifier("slice")), [t.numericLiteral(i)]);

          elem = elem.argument;
        } else {
          elemRef = t.memberExpression(arrayRef, t.numericLiteral(i), true);
        }

        this.push(elem, elemRef);
      }
    };

    DestructuringTransformer.prototype.init = function init(pattern, ref) {

      if (!t.isArrayExpression(ref) && !t.isMemberExpression(ref)) {
        var memo = this.scope.maybeGenerateMemoised(ref, true);
        if (memo) {
          this.nodes.push(this.buildVariableDeclaration(memo, ref));
          ref = memo;
        }
      }

      this.push(pattern, ref);

      return this.nodes;
    };

    return DestructuringTransformer;
  }();

  return {
    visitor: {
      ExportNamedDeclaration: function ExportNamedDeclaration(path) {
        var declaration = path.get("declaration");
        if (!declaration.isVariableDeclaration()) return;
        if (!variableDeclarationHasPattern(declaration.node)) return;

        var specifiers = [];

        for (var name in path.getOuterBindingIdentifiers(path)) {
          var id = t.identifier(name);
          specifiers.push(t.exportSpecifier(id, id));
        }

        path.replaceWith(declaration.node);
        path.insertAfter(t.exportNamedDeclaration(null, specifiers));
      },
      ForXStatement: function ForXStatement(path, file) {
        var node = path.node,
            scope = path.scope;

        var left = node.left;

        if (t.isPattern(left)) {

          var temp = scope.generateUidIdentifier("ref");

          node.left = t.variableDeclaration("var", [t.variableDeclarator(temp)]);

          path.ensureBlock();

          node.body.body.unshift(t.variableDeclaration("var", [t.variableDeclarator(left, temp)]));

          return;
        }

        if (!t.isVariableDeclaration(left)) return;

        var pattern = left.declarations[0].id;
        if (!t.isPattern(pattern)) return;

        var key = scope.generateUidIdentifier("ref");
        node.left = t.variableDeclaration(left.kind, [t.variableDeclarator(key, null)]);

        var nodes = [];

        var destructuring = new DestructuringTransformer({
          kind: left.kind,
          file: file,
          scope: scope,
          nodes: nodes
        });

        destructuring.init(pattern, key);

        path.ensureBlock();

        var block = node.body;
        block.body = nodes.concat(block.body);
      },
      CatchClause: function CatchClause(_ref6, file) {
        var node = _ref6.node,
            scope = _ref6.scope;

        var pattern = node.param;
        if (!t.isPattern(pattern)) return;

        var ref = scope.generateUidIdentifier("ref");
        node.param = ref;

        var nodes = [];

        var destructuring = new DestructuringTransformer({
          kind: "let",
          file: file,
          scope: scope,
          nodes: nodes
        });
        destructuring.init(pattern, ref);

        node.body.body = nodes.concat(node.body.body);
      },
      AssignmentExpression: function AssignmentExpression(path, file) {
        var node = path.node,
            scope = path.scope;

        if (!t.isPattern(node.left)) return;

        var nodes = [];

        var destructuring = new DestructuringTransformer({
          operator: node.operator,
          file: file,
          scope: scope,
          nodes: nodes
        });

        var ref = void 0;
        if (path.isCompletionRecord() || !path.parentPath.isExpressionStatement()) {
          ref = scope.generateUidIdentifierBasedOnNode(node.right, "ref");

          nodes.push(t.variableDeclaration("var", [t.variableDeclarator(ref, node.right)]));

          if (t.isArrayExpression(node.right)) {
            destructuring.arrays[ref.name] = true;
          }
        }

        destructuring.init(node.left, ref || node.right);

        if (ref) {
          nodes.push(t.expressionStatement(ref));
        }

        path.replaceWithMultiple(nodes);
      },
      VariableDeclaration: function VariableDeclaration(path, file) {
        var node = path.node,
            scope = path.scope,
            parent = path.parent;

        if (t.isForXStatement(parent)) return;
        if (!parent || !path.container) return;
        if (!variableDeclarationHasPattern(node)) return;

        var nodes = [];
        var declar = void 0;

        for (var i = 0; i < node.declarations.length; i++) {
          declar = node.declarations[i];

          var patternId = declar.init;
          var pattern = declar.id;

          var destructuring = new DestructuringTransformer({
            blockHoist: node._blockHoist,
            nodes: nodes,
            scope: scope,
            kind: node.kind,
            file: file
          });

          if (t.isPattern(pattern)) {
            destructuring.init(pattern, patternId);

            if (+i !== node.declarations.length - 1) {
              t.inherits(nodes[nodes.length - 1], declar);
            }
          } else {
            nodes.push(t.inherits(destructuring.buildVariableAssignment(declar.id, declar.init), declar));
          }
        }

        var nodesOut = [];
        for (var _iterator5 = nodes, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : (0, _getIterator3.default)(_iterator5);;) {
          var _ref7;

          if (_isArray5) {
            if (_i5 >= _iterator5.length) break;
            _ref7 = _iterator5[_i5++];
          } else {
            _i5 = _iterator5.next();
            if (_i5.done) break;
            _ref7 = _i5.value;
          }

          var _node = _ref7;

          var tail = nodesOut[nodesOut.length - 1];
          if (tail && t.isVariableDeclaration(tail) && t.isVariableDeclaration(_node) && tail.kind === _node.kind) {
            var _tail$declarations;

            (_tail$declarations = tail.declarations).push.apply(_tail$declarations, _node.declarations);
          } else {
            nodesOut.push(_node);
          }
        }

        for (var _iterator6 = nodesOut, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : (0, _getIterator3.default)(_iterator6);;) {
          var _ref8;

          if (_isArray6) {
            if (_i6 >= _iterator6.length) break;
            _ref8 = _iterator6[_i6++];
          } else {
            _i6 = _iterator6.next();
            if (_i6.done) break;
            _ref8 = _i6.value;
          }

          var nodeOut = _ref8;

          if (!nodeOut.declarations) continue;
          for (var _iterator7 = nodeOut.declarations, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : (0, _getIterator3.default)(_iterator7);;) {
            var _ref9;

            if (_isArray7) {
              if (_i7 >= _iterator7.length) break;
              _ref9 = _iterator7[_i7++];
            } else {
              _i7 = _iterator7.next();
              if (_i7.done) break;
              _ref9 = _i7.value;
            }

            var declaration = _ref9;
            var name = declaration.id.name;

            if (scope.bindings[name]) {
              scope.bindings[name].kind = nodeOut.kind;
            }
          }
        }

        if (nodesOut.length === 1) {
          path.replaceWith(nodesOut[0]);
        } else {
          path.replaceWithMultiple(nodesOut);
        }
      }
    }
  };
};

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports["default"];
});
