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

var propName_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = propName;
/**
 * Returns the name of the prop given the JSXAttribute object.
 */
function propName() {
  var prop = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!prop.type || prop.type !== 'JSXAttribute') {
    throw new Error('The prop must be a JSXAttribute collected by the AST parser.');
  }

  if (prop.name.type === 'JSXNamespacedName') {
    return prop.name.namespace.name + ':' + prop.name.name.name;
  }

  return prop.name.name;
}
});

var hasProp_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = hasProp;
exports.hasAnyProp = hasAnyProp;
exports.hasEveryProp = hasEveryProp;



var _propName2 = _interopRequireDefault(propName_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_OPTIONS = {
  spreadStrict: true,
  ignoreCase: true
};

/**
 * Returns boolean indicating whether an prop exists on the props
 * property of a JSX element node.
 */
function hasProp() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var prop = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_OPTIONS;

  var propToCheck = options.ignoreCase ? prop.toUpperCase() : prop;

  return props.some(function (attribute) {
    // If the props contain a spread prop, then refer to strict param.
    if (attribute.type === 'JSXSpreadAttribute') {
      return !options.spreadStrict;
    }

    var currentProp = options.ignoreCase ? (0, _propName2.default)(attribute).toUpperCase() : (0, _propName2.default)(attribute);

    return propToCheck === currentProp;
  });
}

/**
 * Given the props on a node and a list of props to check, this returns a boolean
 * indicating if any of them exist on the node.
 */
function hasAnyProp() {
  var nodeProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_OPTIONS;

  var propsToCheck = typeof props === 'string' ? props.split(' ') : props;

  return propsToCheck.some(function (prop) {
    return hasProp(nodeProps, prop, options);
  });
}

/**
 * Given the props on a node and a list of props to check, this returns a boolean
 * indicating if all of them exist on the node
 */
function hasEveryProp() {
  var nodeProps = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_OPTIONS;

  var propsToCheck = typeof props === 'string' ? props.split(' ') : props;

  return propsToCheck.every(function (prop) {
    return hasProp(nodeProps, prop, options);
  });
}
});

var elementType_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = elementType;
function resolveMemberExpressions() {
  var object = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var property = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (object.type === 'JSXMemberExpression') {
    return resolveMemberExpressions(object.object, object.property) + '.' + property.name;
  }

  return object.name + '.' + property.name;
}

/**
 * Returns the tagName associated with a JSXElement.
 */
function elementType() {
  var node = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var name = node.name;


  if (!name) {
    throw new Error('The argument provided is not a JSXElement node.');
  }

  if (name.type === 'JSXMemberExpression') {
    var _name$object = name.object,
        object = _name$object === undefined ? {} : _name$object,
        _name$property = name.property,
        property = _name$property === undefined ? {} : _name$property;

    return resolveMemberExpressions(object, property);
  }

  if (name.type === 'JSXNamespacedName') {
    return name.namespace.name + ':' + name.name.name;
  }

  return node.name.name;
}
});

var eventHandlers_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * Common event handlers for JSX element event binding.
 */

var eventHandlersByType = {
  clipboard: ['onCopy', 'onCut', 'onPaste'],
  composition: ['onCompositionEnd', 'onCompositionStart', 'onCompositionUpdate'],
  keyboard: ['onKeyDown', 'onKeyPress', 'onKeyUp'],
  focus: ['onFocus', 'onBlur'],
  form: ['onChange', 'onInput', 'onSubmit'],
  mouse: ['onClick', 'onContextMenu', 'onDblClick', 'onDoubleClick', 'onDrag', 'onDragEnd', 'onDragEnter', 'onDragExit', 'onDragLeave', 'onDragOver', 'onDragStart', 'onDrop', 'onMouseDown', 'onMouseEnter', 'onMouseLeave', 'onMouseMove', 'onMouseOut', 'onMouseOver', 'onMouseUp'],
  selection: ['onSelect'],
  touch: ['onTouchCancel', 'onTouchEnd', 'onTouchMove', 'onTouchStart'],
  ui: ['onScroll'],
  wheel: ['onWheel'],
  media: ['onAbort', 'onCanPlay', 'onCanPlayThrough', 'onDurationChange', 'onEmptied', 'onEncrypted', 'onEnded', 'onError', 'onLoadedData', 'onLoadedMetadata', 'onLoadStart', 'onPause', 'onPlay', 'onPlaying', 'onProgress', 'onRateChange', 'onSeeked', 'onSeeking', 'onStalled', 'onSuspend', 'onTimeUpdate', 'onVolumeChange', 'onWaiting'],
  image: ['onLoad', 'onError'],
  animation: ['onAnimationStart', 'onAnimationEnd', 'onAnimationIteration'],
  transition: ['onTransitionEnd']
};

var eventHandlers = Object.keys(eventHandlersByType).reduce(function (accumulator, type) {
  return accumulator.concat(eventHandlersByType[type]);
}, []);

exports.default = eventHandlers;
exports.eventHandlersByType = eventHandlersByType;
});

var getProp_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = getProp;



var _propName2 = _interopRequireDefault(propName_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var DEFAULT_OPTIONS = {
  ignoreCase: true
};

/**
 * Returns the JSXAttribute itself or undefined, indicating the prop
 * is not present on the JSXOpeningElement.
 *
 */
function getProp() {
  var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var prop = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : DEFAULT_OPTIONS;

  function getName(name) {
    return options.ignoreCase ? name.toUpperCase() : name;
  }
  var propToFind = getName(prop);
  function isPropToFind(property) {
    return property.type === 'Property' && property.key.type === 'Identifier' && propToFind === getName(property.key.name);
  }

  var foundAttribute = props.find(function (attribute) {
    // If the props contain a spread prop, try to find the property in the object expression.
    if (attribute.type === 'JSXSpreadAttribute') {
      return attribute.argument.type === 'ObjectExpression' && propToFind !== getName('key') // https://github.com/reactjs/rfcs/pull/107
      && attribute.argument.properties.some(isPropToFind);
    }

    return propToFind === getName((0, _propName2.default)(attribute));
  });

  if (foundAttribute && foundAttribute.type === 'JSXSpreadAttribute') {
    return propertyToJSXAttribute(foundAttribute.argument.properties.find(isPropToFind));
  }

  return foundAttribute;
}

function propertyToJSXAttribute(node) {
  var key = node.key,
      value = node.value;

  return _extends({
    type: 'JSXAttribute',
    name: _extends({ type: 'JSXIdentifier', name: key.name }, getBaseProps(key)),
    value: value.type === 'Literal' ? adjustRangeStartAndEndOfNode(value) : _extends({
      type: 'JSXExpressionContainer',
      expression: adjustExpressionRangeStartAndEnd(value)
    }, getBaseProps(value))
  }, getBaseProps(node));
}

function adjustRangeStartAndEndOfNode(node) {
  var _ref = node.range || [node.start, node.end],
      _ref2 = _slicedToArray(_ref, 2),
      start = _ref2[0],
      end = _ref2[1];

  return _extends({}, node, {
    end: end,
    range: [start, end],
    start: start
  });
}

function adjustExpressionRangeStartAndEnd(_ref3) {
  var expressions = _ref3.expressions,
      quasis = _ref3.quasis,
      expression = _objectWithoutProperties(_ref3, ['expressions', 'quasis']);

  return _extends({}, adjustRangeStartAndEndOfNode(expression), expressions ? { expressions: expressions.map(adjustRangeStartAndEndOfNode) } : {}, quasis ? { quasis: quasis.map(adjustRangeStartAndEndOfNode) } : {});
}

function getBaseProps(_ref4) {
  var loc = _ref4.loc,
      node = _objectWithoutProperties(_ref4, ['loc']);

  var _adjustRangeStartAndE = adjustRangeStartAndEndOfNode(node),
      end = _adjustRangeStartAndE.end,
      range = _adjustRangeStartAndE.range,
      start = _adjustRangeStartAndE.start;

  return {
    end: end,
    loc: getBaseLocation(loc),
    range: range,
    start: start
  };
}

function getBaseLocation(_ref5) {
  var start = _ref5.start,
      end = _ref5.end,
      source = _ref5.source,
      filename = _ref5.filename;

  return _extends({
    start: start,
    end: end
  }, source !== undefined ? { source: source } : {}, filename !== undefined ? { filename: filename } : {});
}
});

var Literal = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromLiteral;
/**
 * Extractor function for a Literal type value node.
 *
 * @param - value - AST Value object with type `Literal`
 * @returns { String|Boolean } - The extracted value converted to correct type.
 */
function extractValueFromLiteral(value) {
  var extractedValue = value.value;


  var normalizedStringValue = typeof extractedValue === 'string' && extractedValue.toLowerCase();
  if (normalizedStringValue === 'true') {
    return true;
  }

  if (normalizedStringValue === 'false') {
    return false;
  }

  return extractedValue;
}
});

var JSXElement = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromJSXElement;
/**
 * Extractor function for a JSXElement type value node.
 *
 * Returns self-closing element with correct name.
 */
function extractValueFromJSXElement(value) {
  return "<" + value.openingElement.name.name + " />";
}
});

var Identifier = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromIdentifier;
var JS_RESERVED = {
  Array: Array,
  Date: Date,
  Infinity: Infinity,
  Math: Math,
  Number: Number,
  Object: Object,
  String: String,
  undefined: undefined
};

/**
 * Extractor function for a Identifier type value node.
 * An Identifier is usually a reference to a variable.
 * Just return variable name to determine its existence.
 *
 * @param - value - AST Value object with type `Identifier`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromIdentifier(value) {
  var name = value.name;


  if (Object.hasOwnProperty.call(JS_RESERVED, name)) {
    return JS_RESERVED[name];
  }

  return name;
}
});

var TemplateLiteral = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromTemplateLiteral;
function sortStarts(a, b) {
  return (a.range ? a.range[0] : a.start) - (b.range ? b.range[0] : b.start);
}

/**
 * Returns the string value of a template literal object.
 * Tries to build it as best as it can based on the passed
 * prop. For instance `This is a ${prop}` will return 'This is a {prop}'.
 *
 * If the template literal builds to undefined (`${undefined}`), then
 * this should return "undefined".
 */
function extractValueFromTemplateLiteral(value) {
  var quasis = value.quasis,
      expressions = value.expressions;

  var partitions = quasis.concat(expressions);

  return partitions.sort(sortStarts).reduce(function (raw, part) {
    var type = part.type;

    if (type === 'TemplateElement') {
      return raw + part.value.raw;
    }

    if (type === 'Identifier') {
      return part.name === 'undefined' ? '' + raw + part.name : raw + '{' + part.name + '}';
    }

    if (type.indexOf('Expression') > -1) {
      return raw + '{' + type + '}';
    }

    return raw;
  }, '');
}
});

var TaggedTemplateExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromTaggedTemplateExpression;



var _TemplateLiteral2 = _interopRequireDefault(TemplateLiteral);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns the string value of a tagged template literal object.
 * Redirects the bulk of the work to `TemplateLiteral`.
 */
function extractValueFromTaggedTemplateExpression(value) {
  return (0, _TemplateLiteral2.default)(value.quasi);
}
});

var FunctionExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromFunctionExpression;
/**
 * Extractor function for a FunctionExpression type value node.
 * Statically, we can't execute the given function, so just return a function
 * to indicate that the value is present.
 *
 * @param - value - AST Value object with type `FunctionExpression`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromFunctionExpression(value) {
  return function () {
    return value;
  };
}
});

var LogicalExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromLogicalExpression;
/**
 * Extractor function for a LogicalExpression type value node.
 * A logical expression is `a && b` or `a || b`, so we evaluate both sides
 * and return the extracted value of the expression.
 *
 * @param - value - AST Value object with type `LogicalExpression`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromLogicalExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  var operator = value.operator,
      left = value.left,
      right = value.right;

  var leftVal = getValue(left);
  var rightVal = getValue(right);

  if (operator === '&&') {
    return leftVal && rightVal;
  }
  if (operator === '??') {
    // return leftVal ?? rightVal; // TODO: update to babel 7
    return leftVal === null || typeof leftVal === 'undefined' ? rightVal : leftVal;
  }
  return leftVal || rightVal;
}
});

var MemberExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromMemberExpression;
/**
 * Extractor function for a MemberExpression type value node.
 * A member expression is accessing a property on an object `obj.property`.
 *
 * @param - value - AST Value object with type `MemberExpression`
 * @returns - The extracted value converted to correct type
 *  and maintaing `obj.property` convention.
 */
function extractValueFromMemberExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  return getValue(value.object) + '.' + getValue(value.property);
}
});

var OptionalCallExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromOptionalCallExpression;
/**
 * Extractor function for a OptionalCallExpression type value node.
 * A member expression is accessing a property on an object `obj.property` and invoking it.
 *
 * @param - value - AST Value object with type `OptionalCallExpression`
 * @returns - The extracted value converted to correct type
 *  and maintaing `obj.property?.()` convention.
 */
function extractValueFromOptionalCallExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  return getValue(value.callee) + '?.(' + value.arguments.map(function (x) {
    return getValue(x);
  }).join(', ') + ')';
}
});

var OptionalMemberExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromOptionalMemberExpression;
/**
 * Extractor function for a OptionalMemberExpression type value node.
 * A member expression is accessing a property on an object `obj.property`.
 *
 * @param - value - AST Value object with type `OptionalMemberExpression`
 * @returns - The extracted value converted to correct type
 *  and maintaing `obj?.property` convention.
 */
function extractValueFromOptionalMemberExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  return getValue(value.object) + '?.' + getValue(value.property);
}
});

var CallExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromCallExpression;
/**
 * Extractor function for a CallExpression type value node.
 * A call expression looks like `bar()`
 * This will return `bar` as the value to indicate its existence,
 * since we can not execute the function bar in a static environment.
 *
 * @param - value - AST Value object with type `CallExpression`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromCallExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  return getValue(value.callee);
}
});

var UnaryExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromUnaryExpression;
/**
 * Extractor function for a UnaryExpression type value node.
 * A unary expression is an expression with a unary operator.
 * For example, !"foobar" will evaluate to false, so this will return false.
 *
 * @param - value - AST Value object with type `UnaryExpression`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromUnaryExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  var operator = value.operator,
      argument = value.argument;


  switch (operator) {
    case '-':
      return -getValue(argument);
    case '+':
      return +getValue(argument); // eslint-disable-line no-implicit-coercion
    case '!':
      return !getValue(argument);
    case '~':
      return ~getValue(argument); // eslint-disable-line no-bitwise
    case 'delete':
      // I believe delete statements evaluate to true.
      return true;
    case 'typeof':
    case 'void':
    default:
      return undefined;
  }
}
});

var ThisExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromThisExpression;
/**
 * Extractor function for a ThisExpression type value node.
 * A this expression is using `this` as an identifier.
 *
 * @returns - 'this' as a string.
 */
function extractValueFromThisExpression() {
  return 'this';
}
});

var ConditionalExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromConditionalExpression;
/**
 * Extractor function for a ConditionalExpression type value node.
 *
 * @param - value - AST Value object with type `ConditionalExpression`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromConditionalExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  var test = value.test,
      alternate = value.alternate,
      consequent = value.consequent;


  return getValue(test) ? getValue(consequent) : getValue(alternate);
}
});

var BinaryExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromBinaryExpression;
/**
 * Extractor function for a BinaryExpression type value node.
 * A binary expression has a left and right side separated by an operator
 * such as `a + b`.
 *
 * @param - value - AST Value object with type `BinaryExpression`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromBinaryExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  var operator = value.operator,
      left = value.left,
      right = value.right;

  var leftVal = getValue(left);
  var rightVal = getValue(right);

  switch (operator) {
    case '==':
      return leftVal == rightVal; // eslint-disable-line
    case '!=':
      return leftVal != rightVal; // eslint-disable-line
    case '===':
      return leftVal === rightVal;
    case '!==':
      return leftVal !== rightVal;
    case '<':
      return leftVal < rightVal;
    case '<=':
      return leftVal <= rightVal;
    case '>':
      return leftVal > rightVal;
    case '>=':
      return leftVal >= rightVal;
    case '<<':
      return leftVal << rightVal; // eslint-disable-line no-bitwise
    case '>>':
      return leftVal >> rightVal; // eslint-disable-line no-bitwise
    case '>>>':
      return leftVal >>> rightVal; // eslint-disable-line no-bitwise
    case '+':
      return leftVal + rightVal;
    case '-':
      return leftVal - rightVal;
    case '*':
      return leftVal * rightVal;
    case '/':
      return leftVal / rightVal;
    case '%':
      return leftVal % rightVal;
    case '|':
      return leftVal | rightVal; // eslint-disable-line no-bitwise
    case '^':
      return leftVal ^ rightVal; // eslint-disable-line no-bitwise
    case '&':
      return leftVal & rightVal; // eslint-disable-line no-bitwise
    case 'in':
      try {
        return leftVal in rightVal;
      } catch (err) {
        return false;
      }
    case 'instanceof':
      if (typeof rightVal !== 'function') {
        return false;
      }
      return leftVal instanceof rightVal;
    default:
      return undefined;
  }
}
});

var toStr = Object.prototype.toString;

var isArguments = function isArguments(value) {
	var str = toStr.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

var keysShim;
if (!Object.keys) {
	// modified from https://github.com/es-shims/es5-shim
	var has = Object.prototype.hasOwnProperty;
	var toStr$1 = Object.prototype.toString;
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
		var isFunction = toStr$1.call(object) === '[object Function]';
		var isArguments = isArgs(object);
		var isString = isObject && toStr$1.call(object) === '[object String]';
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
var implementation = keysShim;

var slice = Array.prototype.slice;


var origKeys = Object.keys;
var keysShim$1 = origKeys ? function keys(o) { return origKeys(o); } : implementation;

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
					return originalKeys(slice.call(object));
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

var hasSymbols = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

var toStr$2 = Object.prototype.toString;
var concat = Array.prototype.concat;
var origDefineProperty = Object.defineProperty;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr$2.call(fn) === '[object Function]';
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
	if (hasSymbols) {
		props = concat.call(props, Object.getOwnPropertySymbols(map));
	}
	for (var i = 0; i < props.length; i += 1) {
		defineProperty(object, props[i], map[props[i]], predicates[props[i]]);
	}
};

defineProperties.supportsDescriptors = !!supportsDescriptors;

var defineProperties_1 = defineProperties;

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice$1 = Array.prototype.slice;
var toStr$3 = Object.prototype.toString;
var funcType = '[object Function]';

var implementation$1 = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$3.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice$1.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice$1.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice$1.call(arguments))
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

var functionBind = Function.prototype.bind || implementation$1;

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

// modified from https://github.com/es-shims/es6-shim


var canBeObject = function (obj) {
	return typeof obj !== 'undefined' && obj !== null;
};
var hasSymbols$1 = shams();
var toObject = Object;
var push = functionBind.call(Function.call, Array.prototype.push);
var propIsEnumerable = functionBind.call(Function.call, Object.prototype.propertyIsEnumerable);
var originalGetSymbols = hasSymbols$1 ? Object.getOwnPropertySymbols : null;

var implementation$2 = function assign(target, source1) {
	if (!canBeObject(target)) { throw new TypeError('target must be an object'); }
	var objTarget = toObject(target);
	var s, source, i, props, syms, value, key;
	for (s = 1; s < arguments.length; ++s) {
		source = toObject(arguments[s]);
		props = objectKeys(source);
		var getSymbols = hasSymbols$1 && (Object.getOwnPropertySymbols || originalGetSymbols);
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

var ObjectExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = extractValueFromObjectExpression;



var _object2 = _interopRequireDefault(object_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Extractor function for an ObjectExpression type value node.
 * An object expression is using {}.
 *
 * @returns - a representation of the object
 */
function extractValueFromObjectExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  return value.properties.reduce(function (obj, property) {
    var object = _extends({}, obj);
    // Support types: SpreadProperty and ExperimentalSpreadProperty
    if (/^(?:Experimental)?Spread(?:Property|Element)$/.test(property.type)) {
      if (property.argument.type === 'ObjectExpression') {
        return (0, _object2.default)(object, extractValueFromObjectExpression(property.argument));
      }
    } else {
      object[getValue(property.key)] = getValue(property.value);
    }
    return object;
  }, {});
}
});

var NewExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromNewExpression;
/**
 * Extractor function for a NewExpression type value node.
 * A new expression instantiates an object with `new` keyword.
 *
 * @returns - an empty object.
 */
function extractValueFromNewExpression() {
  return new Object(); // eslint-disable-line
}
});

var UpdateExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromUpdateExpression;
/**
 * Extractor function for an UpdateExpression type value node.
 * An update expression is an expression with an update operator.
 * For example, foo++ will evaluate to foo + 1.
 *
 * @param - value - AST Value object with type `UpdateExpression`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromUpdateExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  var operator = value.operator,
      argument = value.argument,
      prefix = value.prefix;


  var val = getValue(argument);

  switch (operator) {
    case '++':
      return prefix ? ++val : val++; // eslint-disable-line no-plusplus
    case '--':
      return prefix ? --val : val--; // eslint-disable-line no-plusplus
    default:
      return undefined;
  }
}
});

var ArrayExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromArrayExpression;
/**
 * Extractor function for an ArrayExpression type value node.
 * An array expression is an expression with [] syntax.
 *
 * @returns - An array of the extracted elements.
 */
function extractValueFromArrayExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  return value.elements.map(function (element) {
    return getValue(element);
  });
}
});

var BindExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromBindExpression;
/**
 * Extractor function for a BindExpression type value node.
 * A bind expression looks like `::this.foo`
 * This will return `this.foo.bind(this)` as the value to indicate its existence,
 * since we can not execute the function this.foo.bind(this) in a static environment.
 *
 * @param - value - AST Value object with type `BindExpression`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromBindExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  var callee = getValue(value.callee);

  // If value.object === null, the callee must be a MemberExpression.
  // https://github.com/babel/babylon/blob/master/ast/spec.md#bindexpression
  var object = value.object === null ? getValue(value.callee.object) : getValue(value.object);

  if (value.object && value.object.property) {
    return object + '.' + callee + '.bind(' + object + ')';
  }

  return callee + '.bind(' + object + ')';
}
});

var SpreadElement = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromSpreadElement;
/**
 * Extractor function for a SpreadElement type value node.
 * We can't statically evaluate an array spread, so just return
 * undefined.
 *
 * @param - value - AST Value object with type `SpreadElement`
 * @returns - An prototypeless object.
 */
function extractValueFromSpreadElement() {
  return undefined;
}
});

var TypeCastExpression = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extractValueFromTypeCastExpression;
/**
 * Extractor function for a TypeCastExpression type value node.
 * A type cast expression looks like `(this.handleClick: (event: MouseEvent) => void))`
 * This will return the expression `this.handleClick`.
 *
 * @param - value - AST Value object with type `TypeCastExpression`
 * @returns - The extracted value converted to correct type.
 */
function extractValueFromTypeCastExpression(value) {
  // eslint-disable-next-line global-require
  var getValue = expressions.default;
  return getValue(value.expression);
}
});

var expressions = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = extract;
exports.extractLiteral = extractLiteral;



var _Literal2 = _interopRequireDefault(Literal);



var _JSXElement2 = _interopRequireDefault(JSXElement);



var _Identifier2 = _interopRequireDefault(Identifier);



var _TaggedTemplateExpression2 = _interopRequireDefault(TaggedTemplateExpression);



var _TemplateLiteral2 = _interopRequireDefault(TemplateLiteral);



var _FunctionExpression2 = _interopRequireDefault(FunctionExpression);



var _LogicalExpression2 = _interopRequireDefault(LogicalExpression);



var _MemberExpression2 = _interopRequireDefault(MemberExpression);



var _OptionalCallExpression2 = _interopRequireDefault(OptionalCallExpression);



var _OptionalMemberExpression2 = _interopRequireDefault(OptionalMemberExpression);



var _CallExpression2 = _interopRequireDefault(CallExpression);



var _UnaryExpression2 = _interopRequireDefault(UnaryExpression);



var _ThisExpression2 = _interopRequireDefault(ThisExpression);



var _ConditionalExpression2 = _interopRequireDefault(ConditionalExpression);



var _BinaryExpression2 = _interopRequireDefault(BinaryExpression);



var _ObjectExpression2 = _interopRequireDefault(ObjectExpression);



var _NewExpression2 = _interopRequireDefault(NewExpression);



var _UpdateExpression2 = _interopRequireDefault(UpdateExpression);



var _ArrayExpression2 = _interopRequireDefault(ArrayExpression);



var _BindExpression2 = _interopRequireDefault(BindExpression);



var _SpreadElement2 = _interopRequireDefault(SpreadElement);



var _TypeCastExpression2 = _interopRequireDefault(TypeCastExpression);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Composition map of types to their extractor functions.
var TYPES = {
  Identifier: _Identifier2.default,
  Literal: _Literal2.default,
  JSXElement: _JSXElement2.default,
  TaggedTemplateExpression: _TaggedTemplateExpression2.default,
  TemplateLiteral: _TemplateLiteral2.default,
  ArrowFunctionExpression: _FunctionExpression2.default,
  FunctionExpression: _FunctionExpression2.default,
  LogicalExpression: _LogicalExpression2.default,
  MemberExpression: _MemberExpression2.default,
  OptionalCallExpression: _OptionalCallExpression2.default,
  OptionalMemberExpression: _OptionalMemberExpression2.default,
  CallExpression: _CallExpression2.default,
  UnaryExpression: _UnaryExpression2.default,
  ThisExpression: _ThisExpression2.default,
  ConditionalExpression: _ConditionalExpression2.default,
  BinaryExpression: _BinaryExpression2.default,
  ObjectExpression: _ObjectExpression2.default,
  NewExpression: _NewExpression2.default,
  UpdateExpression: _UpdateExpression2.default,
  ArrayExpression: _ArrayExpression2.default,
  BindExpression: _BindExpression2.default,
  SpreadElement: _SpreadElement2.default,
  TypeCastExpression: _TypeCastExpression2.default
};

var noop = function noop() {
  return null;
};

var errorMessage = function errorMessage(expression) {
  return 'The prop value with an expression type of ' + expression + ' could not be resolved. Please file issue to get this fixed immediately.';
};

/**
 * This function maps an AST value node
 * to its correct extractor function for its
 * given type.
 *
 * This will map correctly for *all* possible expression types.
 *
 * @param - value - AST Value object with type `JSXExpressionContainer`
 * @returns The extracted value.
 */
function extract(value) {
  // Value will not have the expression property when we recurse.
  // The type for expression on ArrowFunctionExpression is a boolean.
  var expression = void 0;
  if (typeof value.expression !== 'boolean' && value.expression) {
    expression = value.expression; // eslint-disable-line prefer-destructuring
  } else {
    expression = value;
  }
  var _expression = expression,
      type = _expression.type;


  while (type === 'TSNonNullExpression' || type === 'TSAsExpression') {
    var _expression2 = expression;
    type = _expression2.type;

    if (expression.expression) {
      var _expression3 = expression;
      expression = _expression3.expression;
    }
  }

  if (TYPES[type] === undefined) {
    // eslint-disable-next-line no-console
    console.error(errorMessage(type));
    return null;
  }

  return TYPES[type](expression);
}

// Composition map of types to their extractor functions to handle literals.
var LITERAL_TYPES = _extends({}, TYPES, {
  Literal: function Literal(value) {
    var extractedVal = TYPES.Literal.call(undefined, value);
    var isNull = extractedVal === null;
    // This will be convention for attributes that have null
    // value explicitly defined (<div prop={null} /> maps to 'null').
    return isNull ? 'null' : extractedVal;
  },
  Identifier: function Identifier(value) {
    var isUndefined = TYPES.Identifier.call(undefined, value) === undefined;
    return isUndefined ? undefined : null;
  },
  JSXElement: noop,
  ArrowFunctionExpression: noop,
  FunctionExpression: noop,
  LogicalExpression: noop,
  MemberExpression: noop,
  OptionalCallExpression: noop,
  OptionalMemberExpression: noop,
  CallExpression: noop,
  UnaryExpression: function UnaryExpression(value) {
    var extractedVal = TYPES.UnaryExpression.call(undefined, value);
    return extractedVal === undefined ? null : extractedVal;
  },
  UpdateExpression: function UpdateExpression(value) {
    var extractedVal = TYPES.UpdateExpression.call(undefined, value);
    return extractedVal === undefined ? null : extractedVal;
  },
  ThisExpression: noop,
  ConditionalExpression: noop,
  BinaryExpression: noop,
  ObjectExpression: noop,
  NewExpression: noop,
  ArrayExpression: function ArrayExpression(value) {
    var extractedVal = TYPES.ArrayExpression.call(undefined, value);
    return extractedVal.filter(function (val) {
      return val !== null;
    });
  },
  BindExpression: noop,
  SpreadElement: noop,
  TSNonNullExpression: noop,
  TSAsExpression: noop,
  TypeCastExpression: noop
});

/**
 * This function maps an AST value node
 * to its correct extractor function for its
 * given type.
 *
 * This will map correctly for *some* possible types that map to literals.
 *
 * @param - value - AST Value object with type `JSXExpressionContainer`
 * @returns The extracted value.
 */
function extractLiteral(value) {
  // Value will not have the expression property when we recurse.
  var expression = value.expression || value;
  var type = expression.type;


  if (LITERAL_TYPES[type] === undefined) {
    // eslint-disable-next-line no-console
    console.error(errorMessage(type));
    return null;
  }

  return LITERAL_TYPES[type](expression);
}
});

var values = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = getValue;
exports.getLiteralValue = getLiteralValue;



var _Literal2 = _interopRequireDefault(Literal);



var _JSXElement2 = _interopRequireDefault(JSXElement);



var _expressions2 = _interopRequireDefault(expressions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Composition map of types to their extractor functions.
var TYPES = {
  Literal: _Literal2.default,
  JSXElement: _JSXElement2.default,
  JSXExpressionContainer: _expressions2.default
};

// Composition map of types to their extractor functions to handle literals.
var LITERAL_TYPES = _extends({}, TYPES, {
  JSXElement: function JSXElement() {
    return null;
  },
  JSXExpressionContainer: expressions.extractLiteral
});

/**
 * This function maps an AST value node
 * to its correct extractor function for its
 * given type.
 *
 * This will map correctly for *all* possible types.
 *
 * @param value - AST Value object on a JSX Attribute.
 */
function getValue(value) {
  return TYPES[value.type](value);
}

/**
 * This function maps an AST value node
 * to its correct extractor function for its
 * given type.
 *
 * This will map correctly for *some* possible types that map to literals.
 *
 * @param value - AST Value object on a JSX Attribute.
 */
function getLiteralValue(value) {
  return LITERAL_TYPES[value.type](value);
}
});

var getPropValue_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getPropValue;
exports.getLiteralPropValue = getLiteralPropValue;



var _values2 = _interopRequireDefault(values);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var extractValue = function extractValue(attribute, extractor) {
  if (attribute && attribute.type === 'JSXAttribute') {
    if (attribute.value === null) {
      // Null valued attributes imply truthiness.
      // For example: <div aria-hidden />
      // See: https://facebook.github.io/react/docs/jsx-in-depth.html#boolean-attributes
      return true;
    }

    return extractor(attribute.value);
  }

  return undefined;
};

/**
 * Returns the value of a given attribute.
 * Different types of attributes have their associated
 * values in different properties on the object.
 *
 * This function should return the most *closely* associated
 * value with the intention of the JSX.
 *
 * @param attribute - The JSXAttribute collected by AST parser.
 */
function getPropValue(attribute) {
  return extractValue(attribute, _values2.default);
}

/**
 * Returns the value of a given attribute.
 * Different types of attributes have their associated
 * values in different properties on the object.
 *
 * This function should return a value only if we can extract
 * a literal value from its attribute (i.e. values that have generic
 * types in JavaScript - strings, numbers, booleans, etc.)
 *
 * @param attribute - The JSXAttribute collected by AST parser.
 */
function getLiteralPropValue(attribute) {
  return extractValue(attribute, values.getLiteralValue);
}
});

var lib = createCommonjsModule(function (module) {



var _hasProp2 = _interopRequireDefault(hasProp_1);



var _elementType2 = _interopRequireDefault(elementType_1);



var _eventHandlers2 = _interopRequireDefault(eventHandlers_1);



var _getProp2 = _interopRequireDefault(getProp_1);



var _getPropValue2 = _interopRequireDefault(getPropValue_1);



var _propName2 = _interopRequireDefault(propName_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  hasProp: _hasProp2.default,
  hasAnyProp: hasProp_1.hasAnyProp,
  hasEveryProp: hasProp_1.hasEveryProp,
  elementType: _elementType2.default,
  eventHandlers: _eventHandlers2.default,
  eventHandlersByType: eventHandlers_1.eventHandlersByType,
  getProp: _getProp2.default,
  getPropValue: _getPropValue2.default,
  getLiteralPropValue: getPropValue_1.getLiteralPropValue,
  propName: _propName2.default
};
});
