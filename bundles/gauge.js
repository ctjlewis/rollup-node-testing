import util from 'util';
import os from 'os';
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

// These tables borrowed from `ansi`

var prefix = '\x1b[';

var up = function up (num) {
  return prefix + (num || '') + 'A'
};

var down = function down (num) {
  return prefix + (num || '') + 'B'
};

var forward = function forward (num) {
  return prefix + (num || '') + 'C'
};

var back = function back (num) {
  return prefix + (num || '') + 'D'
};

var nextLine = function nextLine (num) {
  return prefix + (num || '') + 'E'
};

var previousLine = function previousLine (num) {
  return prefix + (num || '') + 'F'
};

var horizontalAbsolute = function horizontalAbsolute (num) {
  if (num == null) throw new Error('horizontalAboslute requires a column to position to')
  return prefix + num + 'G'
};

var eraseData = function eraseData () {
  return prefix + 'J'
};

var eraseLine = function eraseLine () {
  return prefix + 'K'
};

var goto_1 = function (x, y) {
  return prefix + y + ';' + x + 'H'
};

var gotoSOL = function () {
  return '\r'
};

var beep = function () {
  return '\x07'
};

var hideCursor = function hideCursor () {
  return prefix + '?25l'
};

var showCursor = function showCursor () {
  return prefix + '?25h'
};

var colors = {
  reset: 0,
// styles
  bold: 1,
  italic: 3,
  underline: 4,
  inverse: 7,
// resets
  stopBold: 22,
  stopItalic: 23,
  stopUnderline: 24,
  stopInverse: 27,
// colors
  white: 37,
  black: 30,
  blue: 34,
  cyan: 36,
  green: 32,
  magenta: 35,
  red: 31,
  yellow: 33,
  bgWhite: 47,
  bgBlack: 40,
  bgBlue: 44,
  bgCyan: 46,
  bgGreen: 42,
  bgMagenta: 45,
  bgRed: 41,
  bgYellow: 43,

  grey: 90,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,

  bgGrey: 100,
  bgBrightBlack: 100,
  bgBrightRed: 101,
  bgBrightGreen: 102,
  bgBrightYellow: 103,
  bgBrightBlue: 104,
  bgBrightMagenta: 105,
  bgBrightCyan: 106,
  bgBrightWhite: 107
};

var color = function color (colorWith) {
  if (arguments.length !== 1 || !Array.isArray(colorWith)) {
    colorWith = Array.prototype.slice.call(arguments);
  }
  return prefix + colorWith.map(colorNameToCode).join(';') + 'm'
};

function colorNameToCode (color) {
  if (colors[color] != null) return colors[color]
  throw new Error('Unknown color or style name: ' + color)
}

var consoleControlStrings = {
	up: up,
	down: down,
	forward: forward,
	back: back,
	nextLine: nextLine,
	previousLine: previousLine,
	horizontalAbsolute: horizontalAbsolute,
	eraseData: eraseData,
	eraseLine: eraseLine,
	goto: goto_1,
	gotoSOL: gotoSOL,
	beep: beep,
	hideCursor: hideCursor,
	showCursor: showCursor,
	color: color
};

var ansiRegex = () => {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, 'g');
};

var stripAnsi = input => typeof input === 'string' ? input.replace(ansiRegex(), '') : input;

/* eslint-disable yoda */
var isFullwidthCodePoint = x => {
	if (Number.isNaN(x)) {
		return false;
	}

	// code points are derived from:
	// http://www.unix.org/Public/UNIDATA/EastAsianWidth.txt
	if (
		x >= 0x1100 && (
			x <= 0x115f ||  // Hangul Jamo
			x === 0x2329 || // LEFT-POINTING ANGLE BRACKET
			x === 0x232a || // RIGHT-POINTING ANGLE BRACKET
			// CJK Radicals Supplement .. Enclosed CJK Letters and Months
			(0x2e80 <= x && x <= 0x3247 && x !== 0x303f) ||
			// Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
			(0x3250 <= x && x <= 0x4dbf) ||
			// CJK Unified Ideographs .. Yi Radicals
			(0x4e00 <= x && x <= 0xa4c6) ||
			// Hangul Jamo Extended-A
			(0xa960 <= x && x <= 0xa97c) ||
			// Hangul Syllables
			(0xac00 <= x && x <= 0xd7a3) ||
			// CJK Compatibility Ideographs
			(0xf900 <= x && x <= 0xfaff) ||
			// Vertical Forms
			(0xfe10 <= x && x <= 0xfe19) ||
			// CJK Compatibility Forms .. Small Form Variants
			(0xfe30 <= x && x <= 0xfe6b) ||
			// Halfwidth and Fullwidth Forms
			(0xff01 <= x && x <= 0xff60) ||
			(0xffe0 <= x && x <= 0xffe6) ||
			// Kana Supplement
			(0x1b000 <= x && x <= 0x1b001) ||
			// Enclosed Ideographic Supplement
			(0x1f200 <= x && x <= 0x1f251) ||
			// CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
			(0x20000 <= x && x <= 0x3fffd)
		)
	) {
		return true;
	}

	return false;
};

var stringWidth = str => {
	if (typeof str !== 'string' || str.length === 0) {
		return 0;
	}

	str = stripAnsi(str);

	let width = 0;

	for (let i = 0; i < str.length; i++) {
		const code = str.codePointAt(i);

		// Ignore control characters
		if (code <= 0x1F || (code >= 0x7F && code <= 0x9F)) {
			continue;
		}

		// Ignore combining characters
		if (code >= 0x300 && code <= 0x36F) {
			continue;
		}

		// Surrogates
		if (code > 0xFFFF) {
			i++;
		}

		width += isFullwidthCodePoint(code) ? 2 : 1;
	}

	return width;
};

var center = alignCenter;
var left = alignLeft;
var right = alignRight;

// lodash's way of generating pad characters.

function createPadding (width) {
  var result = '';
  var string = ' ';
  var n = width;
  do {
    if (n % 2) {
      result += string;
    }
    n = Math.floor(n / 2);
    string += string;
  } while (n);

  return result;
}

function alignLeft (str, width) {
  var trimmed = str.trimRight();
  if (trimmed.length === 0 && str.length >= width) return str
  var padding = '';
  var strWidth = stringWidth(trimmed);

  if (strWidth < width) {
    padding = createPadding(width - strWidth);
  }

  return trimmed + padding
}

function alignRight (str, width) {
  var trimmed = str.trimLeft();
  if (trimmed.length === 0 && str.length >= width) return str
  var padding = '';
  var strWidth = stringWidth(trimmed);

  if (strWidth < width) {
    padding = createPadding(width - strWidth);
  }

  return padding + trimmed
}

function alignCenter (str, width) {
  var trimmed = str.trim();
  if (trimmed.length === 0 && str.length >= width) return str
  var padLeft = '';
  var padRight = '';
  var strWidth = stringWidth(trimmed);

  if (strWidth < width) {
    var padLeftBy = parseInt((width - strWidth) / 2, 10); 
    padLeft = createPadding(padLeftBy);
    padRight = createPadding(width - (strWidth + padLeftBy));
  }

  return padLeft + trimmed + padRight
}

var align = {
	center: center,
	left: left,
	right: right
};

var aproba = createCommonjsModule(function (module) {

function isArguments (thingy) {
  return thingy != null && typeof thingy === 'object' && thingy.hasOwnProperty('callee')
}

var types = {
  '*': {label: 'any', check: function () { return true }},
  A: {label: 'array', check: function (thingy) { return Array.isArray(thingy) || isArguments(thingy) }},
  S: {label: 'string', check: function (thingy) { return typeof thingy === 'string' }},
  N: {label: 'number', check: function (thingy) { return typeof thingy === 'number' }},
  F: {label: 'function', check: function (thingy) { return typeof thingy === 'function' }},
  O: {label: 'object', check: function (thingy) { return typeof thingy === 'object' && thingy != null && !types.A.check(thingy) && !types.E.check(thingy) }},
  B: {label: 'boolean', check: function (thingy) { return typeof thingy === 'boolean' }},
  E: {label: 'error', check: function (thingy) { return thingy instanceof Error }},
  Z: {label: 'null', check: function (thingy) { return thingy == null }}
};

function addSchema (schema, arity) {
  var group = arity[schema.length] = arity[schema.length] || [];
  if (group.indexOf(schema) === -1) group.push(schema);
}

var validate = module.exports = function (rawSchemas, args) {
  if (arguments.length !== 2) throw wrongNumberOfArgs(['SA'], arguments.length)
  if (!rawSchemas) throw missingRequiredArg(0)
  if (!args) throw missingRequiredArg(1)
  if (!types.S.check(rawSchemas)) throw invalidType(0, ['string'], rawSchemas)
  if (!types.A.check(args)) throw invalidType(1, ['array'], args)
  var schemas = rawSchemas.split('|');
  var arity = {};

  schemas.forEach(function (schema) {
    for (var ii = 0; ii < schema.length; ++ii) {
      var type = schema[ii];
      if (!types[type]) throw unknownType(ii, type)
    }
    if (/E.*E/.test(schema)) throw moreThanOneError(schema)
    addSchema(schema, arity);
    if (/E/.test(schema)) {
      addSchema(schema.replace(/E.*$/, 'E'), arity);
      addSchema(schema.replace(/E/, 'Z'), arity);
      if (schema.length === 1) addSchema('', arity);
    }
  });
  var matching = arity[args.length];
  if (!matching) {
    throw wrongNumberOfArgs(Object.keys(arity), args.length)
  }
  for (var ii = 0; ii < args.length; ++ii) {
    var newMatching = matching.filter(function (schema) {
      var type = schema[ii];
      var typeCheck = types[type].check;
      return typeCheck(args[ii])
    });
    if (!newMatching.length) {
      var labels = matching.map(function (schema) {
        return types[schema[ii]].label
      }).filter(function (schema) { return schema != null });
      throw invalidType(ii, labels, args[ii])
    }
    matching = newMatching;
  }
};

function missingRequiredArg (num) {
  return newException('EMISSINGARG', 'Missing required argument #' + (num + 1))
}

function unknownType (num, type) {
  return newException('EUNKNOWNTYPE', 'Unknown type ' + type + ' in argument #' + (num + 1))
}

function invalidType (num, expectedTypes, value) {
  var valueType;
  Object.keys(types).forEach(function (typeCode) {
    if (types[typeCode].check(value)) valueType = types[typeCode].label;
  });
  return newException('EINVALIDTYPE', 'Argument #' + (num + 1) + ': Expected ' +
    englishList(expectedTypes) + ' but got ' + valueType)
}

function englishList (list) {
  return list.join(', ').replace(/, ([^,]+)$/, ' or $1')
}

function wrongNumberOfArgs (expected, got) {
  var english = englishList(expected);
  var args = expected.every(function (ex) { return ex.length === 1 })
    ? 'argument'
    : 'arguments';
  return newException('EWRONGARGCOUNT', 'Expected ' + english + ' ' + args + ' but got ' + got)
}

function moreThanOneError (schema) {
  return newException('ETOOMANYERRORTYPES',
    'Only one error type per argument signature is allowed, more than one found in "' + schema + '"')
}

function newException (code, msg) {
  var e = new Error(msg);
  e.code = code;
  if (Error.captureStackTrace) Error.captureStackTrace(e, validate);
  return e
}
});

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

var ansiRegex$1 = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;
};

var ansiRegex$2 = ansiRegex$1();

var stripAnsi$1 = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex$2, '') : str;
};

/* eslint-disable babel/new-cap, xo/throw-new-error */
var codePointAt = function (str, pos) {
	if (str === null || str === undefined) {
		throw TypeError();
	}

	str = String(str);

	var size = str.length;
	var i = pos ? Number(pos) : 0;

	if (Number.isNaN(i)) {
		i = 0;
	}

	if (i < 0 || i >= size) {
		return undefined;
	}

	var first = str.charCodeAt(i);

	if (first >= 0xD800 && first <= 0xDBFF && size > i + 1) {
		var second = str.charCodeAt(i + 1);

		if (second >= 0xDC00 && second <= 0xDFFF) {
			return ((first - 0xD800) * 0x400) + second - 0xDC00 + 0x10000;
		}
	}

	return first;
};

var numberIsNan = Number.isNaN || function (x) {
	return x !== x;
};

var isFullwidthCodePoint$1 = function (x) {
	if (numberIsNan(x)) {
		return false;
	}

	// https://github.com/nodejs/io.js/blob/cff7300a578be1b10001f2d967aaedc88aee6402/lib/readline.js#L1369

	// code points are derived from:
	// http://www.unix.org/Public/UNIDATA/EastAsianWidth.txt
	if (x >= 0x1100 && (
		x <= 0x115f ||  // Hangul Jamo
		0x2329 === x || // LEFT-POINTING ANGLE BRACKET
		0x232a === x || // RIGHT-POINTING ANGLE BRACKET
		// CJK Radicals Supplement .. Enclosed CJK Letters and Months
		(0x2e80 <= x && x <= 0x3247 && x !== 0x303f) ||
		// Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
		0x3250 <= x && x <= 0x4dbf ||
		// CJK Unified Ideographs .. Yi Radicals
		0x4e00 <= x && x <= 0xa4c6 ||
		// Hangul Jamo Extended-A
		0xa960 <= x && x <= 0xa97c ||
		// Hangul Syllables
		0xac00 <= x && x <= 0xd7a3 ||
		// CJK Compatibility Ideographs
		0xf900 <= x && x <= 0xfaff ||
		// Vertical Forms
		0xfe10 <= x && x <= 0xfe19 ||
		// CJK Compatibility Forms .. Small Form Variants
		0xfe30 <= x && x <= 0xfe6b ||
		// Halfwidth and Fullwidth Forms
		0xff01 <= x && x <= 0xff60 ||
		0xffe0 <= x && x <= 0xffe6 ||
		// Kana Supplement
		0x1b000 <= x && x <= 0x1b001 ||
		// Enclosed Ideographic Supplement
		0x1f200 <= x && x <= 0x1f251 ||
		// CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
		0x20000 <= x && x <= 0x3fffd)) {
		return true;
	}

	return false;
};

// https://github.com/nodejs/io.js/blob/cff7300a578be1b10001f2d967aaedc88aee6402/lib/readline.js#L1345
var stringWidth$1 = function (str) {
	if (typeof str !== 'string' || str.length === 0) {
		return 0;
	}

	var width = 0;

	str = stripAnsi$1(str);

	for (var i = 0; i < str.length; i++) {
		var code = codePointAt(str, i);

		// ignore control characters
		if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
			continue;
		}

		// surrogates
		if (code >= 0x10000) {
			i++;
		}

		if (isFullwidthCodePoint$1(code)) {
			width += 2;
		} else {
			width++;
		}
	}

	return width;
};

var wideTruncate_1 = wideTruncate;

function wideTruncate (str, target) {
  if (stringWidth$1(str) === 0) return str
  if (target <= 0) return ''
  if (stringWidth$1(str) <= target) return str

  // We compute the number of bytes of ansi sequences here and add
  // that to our initial truncation to ensure that we don't slice one
  // that we want to keep in half.
  var noAnsi = stripAnsi$1(str);
  var ansiSize = str.length + noAnsi.length;
  var truncated = str.slice(0, target + ansiSize);

  // we have to shrink the result to account for our ansi sequence buffer
  // (if an ansi sequence was truncated) and double width characters.
  while (stringWidth$1(truncated) > target) {
    truncated = truncated.slice(0, -1);
  }
  return truncated
}

var error = createCommonjsModule(function (module, exports) {


var User = exports.User = function User (msg) {
  var err = new Error(msg);
  Error.captureStackTrace(err, User);
  err.code = 'EGAUGE';
  return err
};

exports.MissingTemplateValue = function MissingTemplateValue (item, values) {
  var err = new User(util.format('Missing template value "%s"', item.type));
  Error.captureStackTrace(err, MissingTemplateValue);
  err.template = item;
  err.values = values;
  return err
};

exports.Internal = function Internal (msg) {
  var err = new Error(msg);
  Error.captureStackTrace(err, Internal);
  err.code = 'EGAUGEINTERNAL';
  return err
};
});

var templateItem = TemplateItem;

function isPercent (num) {
  if (typeof num !== 'string') return false
  return num.slice(-1) === '%'
}

function percent (num) {
  return Number(num.slice(0, -1)) / 100
}

function TemplateItem (values, outputLength) {
  this.overallOutputLength = outputLength;
  this.finished = false;
  this.type = null;
  this.value = null;
  this.length = null;
  this.maxLength = null;
  this.minLength = null;
  this.kerning = null;
  this.align = 'left';
  this.padLeft = 0;
  this.padRight = 0;
  this.index = null;
  this.first = null;
  this.last = null;
  if (typeof values === 'string') {
    this.value = values;
  } else {
    for (var prop in values) this[prop] = values[prop];
  }
  // Realize percents
  if (isPercent(this.length)) {
    this.length = Math.round(this.overallOutputLength * percent(this.length));
  }
  if (isPercent(this.minLength)) {
    this.minLength = Math.round(this.overallOutputLength * percent(this.minLength));
  }
  if (isPercent(this.maxLength)) {
    this.maxLength = Math.round(this.overallOutputLength * percent(this.maxLength));
  }
  return this
}

TemplateItem.prototype = {};

TemplateItem.prototype.getBaseLength = function () {
  var length = this.length;
  if (length == null && typeof this.value === 'string' && this.maxLength == null && this.minLength == null) {
    length = stringWidth$1(this.value);
  }
  return length
};

TemplateItem.prototype.getLength = function () {
  var length = this.getBaseLength();
  if (length == null) return null
  return length + this.padLeft + this.padRight
};

TemplateItem.prototype.getMaxLength = function () {
  if (this.maxLength == null) return null
  return this.maxLength + this.padLeft + this.padRight
};

TemplateItem.prototype.getMinLength = function () {
  if (this.minLength == null) return null
  return this.minLength + this.padLeft + this.padRight
};

var renderTemplate_1 = createCommonjsModule(function (module) {







function renderValueWithValues (values) {
  return function (item) {
    return renderValue(item, values)
  }
}

var renderTemplate = module.exports = function (width, template, values) {
  var items = prepareItems(width, template, values);
  var rendered = items.map(renderValueWithValues(values)).join('');
  return align.left(wideTruncate_1(rendered, width), width)
};

function preType (item) {
  var cappedTypeName = item.type[0].toUpperCase() + item.type.slice(1);
  return 'pre' + cappedTypeName
}

function postType (item) {
  var cappedTypeName = item.type[0].toUpperCase() + item.type.slice(1);
  return 'post' + cappedTypeName
}

function hasPreOrPost (item, values) {
  if (!item.type) return
  return values[preType(item)] || values[postType(item)]
}

function generatePreAndPost (baseItem, parentValues) {
  var item = objectAssign({}, baseItem);
  var values = Object.create(parentValues);
  var template = [];
  var pre = preType(item);
  var post = postType(item);
  if (values[pre]) {
    template.push({value: values[pre]});
    values[pre] = null;
  }
  item.minLength = null;
  item.length = null;
  item.maxLength = null;
  template.push(item);
  values[item.type] = values[item.type];
  if (values[post]) {
    template.push({value: values[post]});
    values[post] = null;
  }
  return function ($1, $2, length) {
    return renderTemplate(length, template, values)
  }
}

function prepareItems (width, template, values) {
  function cloneAndObjectify (item, index, arr) {
    var cloned = new templateItem(item, width);
    var type = cloned.type;
    if (cloned.value == null) {
      if (!(type in values)) {
        if (cloned.default == null) {
          throw new error.MissingTemplateValue(cloned, values)
        } else {
          cloned.value = cloned.default;
        }
      } else {
        cloned.value = values[type];
      }
    }
    if (cloned.value == null || cloned.value === '') return null
    cloned.index = index;
    cloned.first = index === 0;
    cloned.last = index === arr.length - 1;
    if (hasPreOrPost(cloned, values)) cloned.value = generatePreAndPost(cloned, values);
    return cloned
  }

  var output = template.map(cloneAndObjectify).filter(function (item) { return item != null });
  var remainingSpace = width;
  var variableCount = output.length;

  function consumeSpace (length) {
    if (length > remainingSpace) length = remainingSpace;
    remainingSpace -= length;
  }

  function finishSizing (item, length) {
    if (item.finished) throw new error.Internal('Tried to finish template item that was already finished')
    if (length === Infinity) throw new error.Internal('Length of template item cannot be infinity')
    if (length != null) item.length = length;
    item.minLength = null;
    item.maxLength = null;
    --variableCount;
    item.finished = true;
    if (item.length == null) item.length = item.getBaseLength();
    if (item.length == null) throw new error.Internal('Finished template items must have a length')
    consumeSpace(item.getLength());
  }

  output.forEach(function (item) {
    if (!item.kerning) return
    var prevPadRight = item.first ? 0 : output[item.index - 1].padRight;
    if (!item.first && prevPadRight < item.kerning) item.padLeft = item.kerning - prevPadRight;
    if (!item.last) item.padRight = item.kerning;
  });

  // Finish any that have a fixed (literal or intuited) length
  output.forEach(function (item) {
    if (item.getBaseLength() == null) return
    finishSizing(item);
  });

  var resized = 0;
  var resizing;
  var hunkSize;
  do {
    resizing = false;
    hunkSize = Math.round(remainingSpace / variableCount);
    output.forEach(function (item) {
      if (item.finished) return
      if (!item.maxLength) return
      if (item.getMaxLength() < hunkSize) {
        finishSizing(item, item.maxLength);
        resizing = true;
      }
    });
  } while (resizing && resized++ < output.length)
  if (resizing) throw new error.Internal('Resize loop iterated too many times while determining maxLength')

  resized = 0;
  do {
    resizing = false;
    hunkSize = Math.round(remainingSpace / variableCount);
    output.forEach(function (item) {
      if (item.finished) return
      if (!item.minLength) return
      if (item.getMinLength() >= hunkSize) {
        finishSizing(item, item.minLength);
        resizing = true;
      }
    });
  } while (resizing && resized++ < output.length)
  if (resizing) throw new error.Internal('Resize loop iterated too many times while determining minLength')

  hunkSize = Math.round(remainingSpace / variableCount);
  output.forEach(function (item) {
    if (item.finished) return
    finishSizing(item, hunkSize);
  });

  return output
}

function renderFunction (item, values, length) {
  aproba('OON', arguments);
  if (item.type) {
    return item.value(values, values[item.type + 'Theme'] || {}, length)
  } else {
    return item.value(values, {}, length)
  }
}

function renderValue (item, values) {
  var length = item.getBaseLength();
  var value = typeof item.value === 'function' ? renderFunction(item, values, length) : item.value;
  if (value == null || value === '') return ''
  var alignWith = align[item.align] || align.left;
  var leftPadding = item.padLeft ? align.left('', item.padLeft) : '';
  var rightPadding = item.padRight ? align.right('', item.padRight) : '';
  var truncated = wideTruncate_1(String(value), length);
  var aligned = alignWith(truncated, length);
  return leftPadding + aligned + rightPadding
}
});

var plumbing = createCommonjsModule(function (module) {




var Plumbing = module.exports = function (theme, template, width) {
  if (!width) width = 80;
  aproba('OAN', [theme, template, width]);
  this.showing = false;
  this.theme = theme;
  this.width = width;
  this.template = template;
};
Plumbing.prototype = {};

Plumbing.prototype.setTheme = function (theme) {
  aproba('O', [theme]);
  this.theme = theme;
};

Plumbing.prototype.setTemplate = function (template) {
  aproba('A', [template]);
  this.template = template;
};

Plumbing.prototype.setWidth = function (width) {
  aproba('N', [width]);
  this.width = width;
};

Plumbing.prototype.hide = function () {
  return consoleControlStrings.gotoSOL() + consoleControlStrings.eraseLine()
};

Plumbing.prototype.hideCursor = consoleControlStrings.hideCursor;

Plumbing.prototype.showCursor = consoleControlStrings.showCursor;

Plumbing.prototype.show = function (status) {
  var values = Object.create(this.theme);
  for (var key in status) {
    values[key] = status[key];
  }

  return renderTemplate_1(this.width, this.template, values).trim() +
         consoleControlStrings.color('reset') +
         consoleControlStrings.eraseLine() + consoleControlStrings.gotoSOL()
};
});

var hasUnicode_1 = createCommonjsModule(function (module) {


var hasUnicode = module.exports = function () {
  // Recent Win32 platforms (>XP) CAN support unicode in the console but
  // don't have to, and in non-english locales often use traditional local
  // code pages. There's no way, short of windows system calls or execing
  // the chcp command line program to figure this out. As such, we default
  // this to false and encourage your users to override it via config if
  // appropriate.
  if (os.type() == "Windows_NT") { return false }

  var isUTF8 = /UTF-?8$/i;
  var ctype = process.env.LC_ALL || process.env.LC_CTYPE || process.env.LANG;
  return isUTF8.test(ctype)
};
});

var hasColor = isWin32() || isColorTerm();

function isWin32 () {
  return process.platform === 'win32'
}

function isColorTerm () {
  var termHasColor = /^screen|^xterm|^vt100|color|ansi|cygwin|linux/i;
  return !!process.env.COLORTERM || termHasColor.test(process.env.TERM)
}

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

var spin = function spin (spinstr, spun) {
  return spinstr[spun % spinstr.length]
};

var progressBar = function (theme, width, completed) {
  aproba('ONN', [theme, width, completed]);
  if (completed < 0) completed = 0;
  if (completed > 1) completed = 1;
  if (width <= 0) return ''
  var sofar = Math.round(width * completed);
  var rest = width - sofar;
  var template = [
    {type: 'complete', value: repeat(theme.complete, sofar), length: sofar},
    {type: 'remaining', value: repeat(theme.remaining, rest), length: rest}
  ];
  return renderTemplate_1(width, template, theme)
};

// lodash's way of repeating
function repeat (string, width) {
  var result = '';
  var n = width;
  do {
    if (n % 2) {
      result += string;
    }
    n = Math.floor(n / 2);
    /*eslint no-self-assign: 0*/
    string += string;
  } while (n && stringWidth$1(result) < width)

  return wideTruncate_1(result, width)
}

var baseTheme = {
  activityIndicator: function (values, theme, width) {
    if (values.spun == null) return
    return spin(theme, values.spun)
  },
  progressbar: function (values, theme, width) {
    if (values.completed == null) return
    return progressBar(theme, width, values.completed)
  }
};

var themeSet = function () {
  return ThemeSetProto.newThemeSet()
};

var ThemeSetProto = {};

ThemeSetProto.baseTheme = baseTheme;

ThemeSetProto.newTheme = function (parent, theme) {
  if (!theme) {
    theme = parent;
    parent = this.baseTheme;
  }
  return objectAssign({}, parent, theme)
};

ThemeSetProto.getThemeNames = function () {
  return Object.keys(this.themes)
};

ThemeSetProto.addTheme = function (name, parent, theme) {
  this.themes[name] = this.newTheme(parent, theme);
};

ThemeSetProto.addToAllThemes = function (theme) {
  var themes = this.themes;
  Object.keys(themes).forEach(function (name) {
    objectAssign(themes[name], theme);
  });
  objectAssign(this.baseTheme, theme);
};

ThemeSetProto.getTheme = function (name) {
  if (!this.themes[name]) throw this.newMissingThemeError(name)
  return this.themes[name]
};

ThemeSetProto.setDefault = function (opts, name) {
  if (name == null) {
    name = opts;
    opts = {};
  }
  var platform = opts.platform == null ? 'fallback' : opts.platform;
  var hasUnicode = !!opts.hasUnicode;
  var hasColor = !!opts.hasColor;
  if (!this.defaults[platform]) this.defaults[platform] = {true: {}, false: {}};
  this.defaults[platform][hasUnicode][hasColor] = name;
};

ThemeSetProto.getDefault = function (opts) {
  if (!opts) opts = {};
  var platformName = opts.platform || process.platform;
  var platform = this.defaults[platformName] || this.defaults.fallback;
  var hasUnicode = !!opts.hasUnicode;
  var hasColor = !!opts.hasColor;
  if (!platform) throw this.newMissingDefaultThemeError(platformName, hasUnicode, hasColor)
  if (!platform[hasUnicode][hasColor]) {
    if (hasUnicode && hasColor && platform[!hasUnicode][hasColor]) {
      hasUnicode = false;
    } else if (hasUnicode && hasColor && platform[hasUnicode][!hasColor]) {
      hasColor = false;
    } else if (hasUnicode && hasColor && platform[!hasUnicode][!hasColor]) {
      hasUnicode = false;
      hasColor = false;
    } else if (hasUnicode && !hasColor && platform[!hasUnicode][hasColor]) {
      hasUnicode = false;
    } else if (!hasUnicode && hasColor && platform[hasUnicode][!hasColor]) {
      hasColor = false;
    } else if (platform === this.defaults.fallback) {
      throw this.newMissingDefaultThemeError(platformName, hasUnicode, hasColor)
    }
  }
  if (platform[hasUnicode][hasColor]) {
    return this.getTheme(platform[hasUnicode][hasColor])
  } else {
    return this.getDefault(objectAssign({}, opts, {platform: 'fallback'}))
  }
};

ThemeSetProto.newMissingThemeError = function newMissingThemeError (name) {
  var err = new Error('Could not find a gauge theme named "' + name + '"');
  Error.captureStackTrace.call(err, newMissingThemeError);
  err.theme = name;
  err.code = 'EMISSINGTHEME';
  return err
};

ThemeSetProto.newMissingDefaultThemeError = function newMissingDefaultThemeError (platformName, hasUnicode, hasColor) {
  var err = new Error(
    'Could not find a gauge theme for your platform/unicode/color use combo:\n' +
    '    platform = ' + platformName + '\n' +
    '    hasUnicode = ' + hasUnicode + '\n' +
    '    hasColor = ' + hasColor);
  Error.captureStackTrace.call(err, newMissingDefaultThemeError);
  err.platform = platformName;
  err.hasUnicode = hasUnicode;
  err.hasColor = hasColor;
  err.code = 'EMISSINGTHEME';
  return err
};

ThemeSetProto.newThemeSet = function () {
  var themeset = function (opts) {
    return themeset.getDefault(opts)
  };
  return objectAssign(themeset, ThemeSetProto, {
    themes: objectAssign({}, this.themes),
    baseTheme: objectAssign({}, this.baseTheme),
    defaults: JSON.parse(JSON.stringify(this.defaults || {}))
  })
};

var themes_1 = createCommonjsModule(function (module) {



var themes = module.exports = new themeSet();

themes.addTheme('ASCII', {
  preProgressbar: '[',
  postProgressbar: ']',
  progressbarTheme: {
    complete: '#',
    remaining: '.'
  },
  activityIndicatorTheme: '-\\|/',
  preSubsection: '>'
});

themes.addTheme('colorASCII', themes.getTheme('ASCII'), {
  progressbarTheme: {
    preComplete: consoleControlStrings.color('inverse'),
    complete: ' ',
    postComplete: consoleControlStrings.color('stopInverse'),
    preRemaining: consoleControlStrings.color('brightBlack'),
    remaining: '.',
    postRemaining: consoleControlStrings.color('reset')
  }
});

themes.addTheme('brailleSpinner', {
  preProgressbar: '⸨',
  postProgressbar: '⸩',
  progressbarTheme: {
    complete: '░',
    remaining: '⠂'
  },
  activityIndicatorTheme: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
  preSubsection: '>'
});

themes.addTheme('colorBrailleSpinner', themes.getTheme('brailleSpinner'), {
  progressbarTheme: {
    preComplete: consoleControlStrings.color('inverse'),
    complete: ' ',
    postComplete: consoleControlStrings.color('stopInverse'),
    preRemaining: consoleControlStrings.color('brightBlack'),
    remaining: '░',
    postRemaining: consoleControlStrings.color('reset')
  }
});

themes.setDefault({}, 'ASCII');
themes.setDefault({hasColor: true}, 'colorASCII');
themes.setDefault({platform: 'darwin', hasUnicode: true}, 'brailleSpinner');
themes.setDefault({platform: 'darwin', hasUnicode: true, hasColor: true}, 'colorBrailleSpinner');
});

// this exists so we can replace it during testing
var setInterval_1 = setInterval;

// this exists so we can replace it during testing
var process_1 = process;

var setImmediate_1 = createCommonjsModule(function (module) {

try {
  module.exports = setImmediate;
} catch (ex) {
  module.exports = process_1.nextTick;
}
});

function callWith (obj, method) {
  return function () {
    return method.call(obj)
  }
}

function Gauge (arg1, arg2) {
  var options, writeTo;
  if (arg1 && arg1.write) {
    writeTo = arg1;
    options = arg2 || {};
  } else if (arg2 && arg2.write) {
    writeTo = arg2;
    options = arg1 || {};
  } else {
    writeTo = process_1.stderr;
    options = arg1 || arg2 || {};
  }

  this._status = {
    spun: 0,
    section: '',
    subsection: ''
  };
  this._paused = false; // are we paused for back pressure?
  this._disabled = true; // are all progress bar updates disabled?
  this._showing = false; // do we WANT the progress bar on screen
  this._onScreen = false; // IS the progress bar on screen
  this._needsRedraw = false; // should we print something at next tick?
  this._hideCursor = options.hideCursor == null ? true : options.hideCursor;
  this._fixedFramerate = options.fixedFramerate == null
    ? !(/^v0\.8\./.test(process_1.version))
    : options.fixedFramerate;
  this._lastUpdateAt = null;
  this._updateInterval = options.updateInterval == null ? 50 : options.updateInterval;

  this._themes = options.themes || themes_1;
  this._theme = options.theme;
  var theme = this._computeTheme(options.theme);
  var template = options.template || [
    {type: 'progressbar', length: 20},
    {type: 'activityIndicator', kerning: 1, length: 1},
    {type: 'section', kerning: 1, default: ''},
    {type: 'subsection', kerning: 1, default: ''}
  ];
  this.setWriteTo(writeTo, options.tty);
  var PlumbingClass = options.Plumbing || plumbing;
  this._gauge = new PlumbingClass(theme, template, this.getWidth());

  this._$$doRedraw = callWith(this, this._doRedraw);
  this._$$handleSizeChange = callWith(this, this._handleSizeChange);

  this._cleanupOnExit = options.cleanupOnExit == null || options.cleanupOnExit;
  this._removeOnExit = null;

  if (options.enabled || (options.enabled == null && this._tty && this._tty.isTTY)) {
    this.enable();
  } else {
    this.disable();
  }
}
Gauge.prototype = {};

Gauge.prototype.isEnabled = function () {
  return !this._disabled
};

Gauge.prototype.setTemplate = function (template) {
  this._gauge.setTemplate(template);
  if (this._showing) this._requestRedraw();
};

Gauge.prototype._computeTheme = function (theme) {
  if (!theme) theme = {};
  if (typeof theme === 'string') {
    theme = this._themes.getTheme(theme);
  } else if (theme && (Object.keys(theme).length === 0 || theme.hasUnicode != null || theme.hasColor != null)) {
    var useUnicode = theme.hasUnicode == null ? hasUnicode_1() : theme.hasUnicode;
    var useColor = theme.hasColor == null ? hasColor : theme.hasColor;
    theme = this._themes.getDefault({hasUnicode: useUnicode, hasColor: useColor, platform: theme.platform});
  }
  return theme
};

Gauge.prototype.setThemeset = function (themes) {
  this._themes = themes;
  this.setTheme(this._theme);
};

Gauge.prototype.setTheme = function (theme) {
  this._gauge.setTheme(this._computeTheme(theme));
  if (this._showing) this._requestRedraw();
  this._theme = theme;
};

Gauge.prototype._requestRedraw = function () {
  this._needsRedraw = true;
  if (!this._fixedFramerate) this._doRedraw();
};

Gauge.prototype.getWidth = function () {
  return ((this._tty && this._tty.columns) || 80) - 1
};

Gauge.prototype.setWriteTo = function (writeTo, tty) {
  var enabled = !this._disabled;
  if (enabled) this.disable();
  this._writeTo = writeTo;
  this._tty = tty ||
    (writeTo === process_1.stderr && process_1.stdout.isTTY && process_1.stdout) ||
    (writeTo.isTTY && writeTo) ||
    this._tty;
  if (this._gauge) this._gauge.setWidth(this.getWidth());
  if (enabled) this.enable();
};

Gauge.prototype.enable = function () {
  if (!this._disabled) return
  this._disabled = false;
  if (this._tty) this._enableEvents();
  if (this._showing) this.show();
};

Gauge.prototype.disable = function () {
  if (this._disabled) return
  if (this._showing) {
    this._lastUpdateAt = null;
    this._showing = false;
    this._doRedraw();
    this._showing = true;
  }
  this._disabled = true;
  if (this._tty) this._disableEvents();
};

Gauge.prototype._enableEvents = function () {
  if (this._cleanupOnExit) {
    this._removeOnExit = signalExit(callWith(this, this.disable));
  }
  this._tty.on('resize', this._$$handleSizeChange);
  if (this._fixedFramerate) {
    this.redrawTracker = setInterval_1(this._$$doRedraw, this._updateInterval);
    if (this.redrawTracker.unref) this.redrawTracker.unref();
  }
};

Gauge.prototype._disableEvents = function () {
  this._tty.removeListener('resize', this._$$handleSizeChange);
  if (this._fixedFramerate) clearInterval(this.redrawTracker);
  if (this._removeOnExit) this._removeOnExit();
};

Gauge.prototype.hide = function (cb) {
  if (this._disabled) return cb && process_1.nextTick(cb)
  if (!this._showing) return cb && process_1.nextTick(cb)
  this._showing = false;
  this._doRedraw();
  cb && setImmediate_1(cb);
};

Gauge.prototype.show = function (section, completed) {
  this._showing = true;
  if (typeof section === 'string') {
    this._status.section = section;
  } else if (typeof section === 'object') {
    var sectionKeys = Object.keys(section);
    for (var ii = 0; ii < sectionKeys.length; ++ii) {
      var key = sectionKeys[ii];
      this._status[key] = section[key];
    }
  }
  if (completed != null) this._status.completed = completed;
  if (this._disabled) return
  this._requestRedraw();
};

Gauge.prototype.pulse = function (subsection) {
  this._status.subsection = subsection || '';
  this._status.spun ++;
  if (this._disabled) return
  if (!this._showing) return
  this._requestRedraw();
};

Gauge.prototype._handleSizeChange = function () {
  this._gauge.setWidth(this._tty.columns - 1);
  this._requestRedraw();
};

Gauge.prototype._doRedraw = function () {
  if (this._disabled || this._paused) return
  if (!this._fixedFramerate) {
    var now = Date.now();
    if (this._lastUpdateAt && now - this._lastUpdateAt < this._updateInterval) return
    this._lastUpdateAt = now;
  }
  if (!this._showing && this._onScreen) {
    this._onScreen = false;
    var result = this._gauge.hide();
    if (this._hideCursor) {
      result += this._gauge.showCursor();
    }
    return this._writeTo.write(result)
  }
  if (!this._showing && !this._onScreen) return
  if (this._showing && !this._onScreen) {
    this._onScreen = true;
    this._needsRedraw = true;
    if (this._hideCursor) {
      this._writeTo.write(this._gauge.hideCursor());
    }
  }
  if (!this._needsRedraw) return
  if (!this._writeTo.write(this._gauge.show(this._status))) {
    this._paused = true;
    this._writeTo.on('drain', callWith(this, function () {
      this._paused = false;
      this._doRedraw();
    }));
  }
};
