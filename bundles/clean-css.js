import os from 'os';
import http from 'http';
import https from 'https';
import url from 'url';
import path from 'path';
import fs from 'fs';

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

function level0Optimize(tokens) {
  // noop as level 0 means no optimizations!
  return tokens;
}

var optimize = level0Optimize;

var COLORS = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#0ff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000',
  blanchedalmond: '#ffebcd',
  blue: '#00f',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#0ff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgreen: '#006400',
  darkgrey: '#a9a9a9',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dimgrey: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#f0f',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  grey: '#808080',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  indianred: '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgray: '#d3d3d3',
  lightgreen: '#90ee90',
  lightgrey: '#d3d3d3',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightslategrey: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#0f0',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370db',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#db7093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#f00',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  slategrey: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#fff',
  whitesmoke: '#f5f5f5',
  yellow: '#ff0',
  yellowgreen: '#9acd32'
};

var toHex = {};
var toName = {};

for (var name in COLORS) {
  var hex = COLORS[name];

  if (name.length < hex.length) {
    toName[hex] = name;
  } else {
    toHex[name] = hex;
  }
}

var toHexPattern = new RegExp('(^| |,|\\))(' + Object.keys(toHex).join('|') + ')( |,|\\)|$)', 'ig');
var toNamePattern = new RegExp('(' + Object.keys(toName).join('|') + ')([^a-f0-9]|$)', 'ig');

function hexConverter(match, prefix, colorValue, suffix) {
  return prefix + toHex[colorValue.toLowerCase()] + suffix;
}

function nameConverter(match, colorValue, suffix) {
  return toName[colorValue.toLowerCase()] + suffix;
}

function shortenHex(value) {
  var hasHex = value.indexOf('#') > -1;
  var shortened = value.replace(toHexPattern, hexConverter);

  if (shortened != value) {
    shortened = shortened.replace(toHexPattern, hexConverter);
  }

  return hasHex ?
    shortened.replace(toNamePattern, nameConverter) :
    shortened;
}

var shortenHex_1 = shortenHex;

// HSL to RGB converter. Both methods adapted from:
// http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript

function hslToRgb(h, s, l) {
  var r, g, b;

  // normalize hue orientation b/w 0 and 360 degrees
  h = h % 360;
  if (h < 0)
    h += 360;
  h = ~~h / 360;

  if (s < 0)
    s = 0;
  else if (s > 100)
    s = 100;
  s = ~~s / 100;

  if (l < 0)
    l = 0;
  else if (l > 100)
    l = 100;
  l = ~~l / 100;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    var q = l < 0.5 ?
      l * (1 + s) :
      l + s - l * s;
    var p = 2 * l - q;
    r = hueToRgb(p, q, h + 1/3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1/3);
  }

  return [~~(r * 255), ~~(g * 255), ~~(b * 255)];
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function shortenHsl(hue, saturation, lightness) {
  var asRgb = hslToRgb(hue, saturation, lightness);
  var redAsHex = asRgb[0].toString(16);
  var greenAsHex = asRgb[1].toString(16);
  var blueAsHex = asRgb[2].toString(16);

  return '#' +
    ((redAsHex.length == 1 ? '0' : '') + redAsHex) +
    ((greenAsHex.length == 1 ? '0' : '') + greenAsHex) +
    ((blueAsHex.length == 1 ? '0' : '') + blueAsHex);
}

var shortenHsl_1 = shortenHsl;

function shortenRgb(red, green, blue) {
  var normalizedRed = Math.max(0, Math.min(parseInt(red), 255));
  var normalizedGreen = Math.max(0, Math.min(parseInt(green), 255));
  var normalizedBlue = Math.max(0, Math.min(parseInt(blue), 255));

  // Credit: Asen  http://jsbin.com/UPUmaGOc/2/edit?js,console
  return '#' + ('00000' + (normalizedRed << 16 | normalizedGreen << 8 | normalizedBlue).toString(16)).slice(-6);
}

var shortenRgb_1 = shortenRgb;

// adapted from http://nedbatchelder.com/blog/200712.html#e20071211T054956

var NUMBER_PATTERN = /([0-9]+)/;

function naturalCompare(value1, value2) {
  var keys1 = ('' + value1).split(NUMBER_PATTERN).map(tryParseInt);
  var keys2 = ('' + value2).split(NUMBER_PATTERN).map(tryParseInt);
  var key1;
  var key2;
  var compareFirst = Math.min(keys1.length, keys2.length);
  var i, l;

  for (i = 0, l = compareFirst; i < l; i++) {
    key1 = keys1[i];
    key2 = keys2[i];

    if (key1 != key2) {
      return key1 > key2 ? 1 : -1;
    }
  }

  return keys1.length > keys2.length ? 1 : (keys1.length == keys2.length ? 0 : -1);
}

function tryParseInt(value) {
  return ('' + parseInt(value)) == value ?
    parseInt(value) :
    value;
}

var naturalCompare_1 = naturalCompare;

function naturalSorter(scope1, scope2) {
  return naturalCompare_1(scope1[1], scope2[1]);
}

function standardSorter(scope1, scope2) {
  return scope1[1] > scope2[1] ? 1 : -1;
}

function sortSelectors(selectors, method) {
  switch (method) {
    case 'natural':
      return selectors.sort(naturalSorter);
    case 'standard':
      return selectors.sort(standardSorter);
    case 'none':
    case false:
      return selectors;
  }
}

var sortSelectors_1 = sortSelectors;

function override(source1, source2) {
  var target = {};
  var key1;
  var key2;
  var item;

  for (key1 in source1) {
    item = source1[key1];

    if (Array.isArray(item)) {
      target[key1] = item.slice(0);
    } else if (typeof item == 'object' && item !== null) {
      target[key1] = override(item, {});
    } else {
      target[key1] = item;
    }
  }

  for (key2 in source2) {
    item = source2[key2];

    if (key2 in target && Array.isArray(item)) {
      target[key2] = item.slice(0);
    } else if (key2 in target && typeof item == 'object' && item !== null) {
      target[key2] = override(target[key2], item);
    } else {
      target[key2] = item;
    }
  }

  return target;
}

var override_1 = override;

var systemLineBreak = os.EOL;



var Breaks = {
  AfterAtRule: 'afterAtRule',
  AfterBlockBegins: 'afterBlockBegins',
  AfterBlockEnds: 'afterBlockEnds',
  AfterComment: 'afterComment',
  AfterProperty: 'afterProperty',
  AfterRuleBegins: 'afterRuleBegins',
  AfterRuleEnds: 'afterRuleEnds',
  BeforeBlockEnds: 'beforeBlockEnds',
  BetweenSelectors: 'betweenSelectors'
};

var BreakWith = {
  CarriageReturnLineFeed: '\r\n',
  LineFeed: '\n',
  System: systemLineBreak
};

var IndentWith = {
  Space: ' ',
  Tab: '\t'
};

var Spaces = {
  AroundSelectorRelation: 'aroundSelectorRelation',
  BeforeBlockBegins: 'beforeBlockBegins',
  BeforeValue: 'beforeValue'
};

var DEFAULTS = {
  breaks: breaks(false),
  breakWith: BreakWith.System,
  indentBy: 0,
  indentWith: IndentWith.Space,
  spaces: spaces(false),
  wrapAt: false,
  semicolonAfterLastProperty: false
};

var BEAUTIFY_ALIAS = 'beautify';
var KEEP_BREAKS_ALIAS = 'keep-breaks';

var OPTION_SEPARATOR = ';';
var OPTION_NAME_VALUE_SEPARATOR = ':';
var HASH_VALUES_OPTION_SEPARATOR = ',';
var HASH_VALUES_NAME_VALUE_SEPARATOR = '=';

var FALSE_KEYWORD_1 = 'false';
var FALSE_KEYWORD_2 = 'off';
var TRUE_KEYWORD_1 = 'true';
var TRUE_KEYWORD_2 = 'on';

function breaks(value) {
  var breakOptions = {};

  breakOptions[Breaks.AfterAtRule] = value;
  breakOptions[Breaks.AfterBlockBegins] = value;
  breakOptions[Breaks.AfterBlockEnds] = value;
  breakOptions[Breaks.AfterComment] = value;
  breakOptions[Breaks.AfterProperty] = value;
  breakOptions[Breaks.AfterRuleBegins] = value;
  breakOptions[Breaks.AfterRuleEnds] = value;
  breakOptions[Breaks.BeforeBlockEnds] = value;
  breakOptions[Breaks.BetweenSelectors] = value;

  return breakOptions;
}

function spaces(value) {
  var spaceOptions = {};

  spaceOptions[Spaces.AroundSelectorRelation] = value;
  spaceOptions[Spaces.BeforeBlockBegins] = value;
  spaceOptions[Spaces.BeforeValue] = value;

  return spaceOptions;
}

function formatFrom(source) {
  if (source === undefined || source === false) {
    return false;
  }

  if (typeof source == 'object' && 'breakWith' in source) {
    source = override_1(source, { breakWith: mapBreakWith(source.breakWith) });
  }

  if (typeof source == 'object' && 'indentBy' in source) {
    source = override_1(source, { indentBy: parseInt(source.indentBy) });
  }

  if (typeof source == 'object' && 'indentWith' in source) {
    source = override_1(source, { indentWith: mapIndentWith(source.indentWith) });
  }

  if (typeof source == 'object') {
    return override_1(DEFAULTS, source);
  }

  if (typeof source == 'object') {
    return override_1(DEFAULTS, source);
  }

  if (typeof source == 'string' && source == BEAUTIFY_ALIAS) {
    return override_1(DEFAULTS, {
      breaks: breaks(true),
      indentBy: 2,
      spaces: spaces(true)
    });
  }

  if (typeof source == 'string' && source == KEEP_BREAKS_ALIAS) {
    return override_1(DEFAULTS, {
      breaks: {
        afterAtRule: true,
        afterBlockBegins: true,
        afterBlockEnds: true,
        afterComment: true,
        afterRuleEnds: true,
        beforeBlockEnds: true
      }
    });
  }

  if (typeof source == 'string') {
    return override_1(DEFAULTS, toHash(source));
  }

  return DEFAULTS;
}

function toHash(string) {
  return string
    .split(OPTION_SEPARATOR)
    .reduce(function (accumulator, directive) {
      var parts = directive.split(OPTION_NAME_VALUE_SEPARATOR);
      var name = parts[0];
      var value = parts[1];

      if (name == 'breaks' || name == 'spaces') {
        accumulator[name] = hashValuesToHash(value);
      } else if (name == 'indentBy' || name == 'wrapAt') {
        accumulator[name] = parseInt(value);
      } else if (name == 'indentWith') {
        accumulator[name] = mapIndentWith(value);
      } else if (name == 'breakWith') {
        accumulator[name] = mapBreakWith(value);
      }

      return accumulator;
    }, {});
}

function hashValuesToHash(string) {
  return string
    .split(HASH_VALUES_OPTION_SEPARATOR)
    .reduce(function (accumulator, directive) {
      var parts = directive.split(HASH_VALUES_NAME_VALUE_SEPARATOR);
      var name = parts[0];
      var value = parts[1];

      accumulator[name] = normalizeValue(value);

      return accumulator;
    }, {});
}


function normalizeValue(value) {
  switch (value) {
    case FALSE_KEYWORD_1:
    case FALSE_KEYWORD_2:
      return false;
    case TRUE_KEYWORD_1:
    case TRUE_KEYWORD_2:
      return true;
    default:
      return value;
  }
}

function mapBreakWith(value) {
  switch (value) {
    case 'windows':
    case 'crlf':
    case BreakWith.CarriageReturnLineFeed:
      return BreakWith.CarriageReturnLineFeed;
    case 'unix':
    case 'lf':
    case BreakWith.LineFeed:
      return BreakWith.LineFeed;
    default:
      return systemLineBreak;
  }
}

function mapIndentWith(value) {
  switch (value) {
    case 'space':
      return IndentWith.Space;
    case 'tab':
      return IndentWith.Tab;
    default:
      return value;
  }
}

var format = {
  Breaks: Breaks,
  Spaces: Spaces,
  formatFrom: formatFrom
};

var Marker = {
  ASTERISK: '*',
  AT: '@',
  BACK_SLASH: '\\',
  CARRIAGE_RETURN: '\r',
  CLOSE_CURLY_BRACKET: '}',
  CLOSE_ROUND_BRACKET: ')',
  CLOSE_SQUARE_BRACKET: ']',
  COLON: ':',
  COMMA: ',',
  DOUBLE_QUOTE: '"',
  EXCLAMATION: '!',
  FORWARD_SLASH: '/',
  INTERNAL: '-clean-css-',
  NEW_LINE_NIX: '\n',
  OPEN_CURLY_BRACKET: '{',
  OPEN_ROUND_BRACKET: '(',
  OPEN_SQUARE_BRACKET: '[',
  SEMICOLON: ';',
  SINGLE_QUOTE: '\'',
  SPACE: ' ',
  TAB: '\t',
  UNDERSCORE: '_'
};

var marker = Marker;

function formatPosition(metadata) {
  var line = metadata[0];
  var column = metadata[1];
  var source = metadata[2];

  return source ?
    source + ':' + line + ':' + column :
    line + ':' + column;
}

var formatPosition_1 = formatPosition;

var Spaces$1 = format.Spaces;



var CASE_ATTRIBUTE_PATTERN = /[\s"'][iI]\s*\]/;
var CASE_RESTORE_PATTERN = /([\d\w])([iI])\]/g;
var DOUBLE_QUOTE_CASE_PATTERN = /="([a-zA-Z][a-zA-Z\d\-_]+)"([iI])/g;
var DOUBLE_QUOTE_PATTERN = /="([a-zA-Z][a-zA-Z\d\-_]+)"(\s|\])/g;
var HTML_COMMENT_PATTERN = /^(?:(?:<!--|-->)\s*)+/;
var SINGLE_QUOTE_CASE_PATTERN = /='([a-zA-Z][a-zA-Z\d\-_]+)'([iI])/g;
var SINGLE_QUOTE_PATTERN = /='([a-zA-Z][a-zA-Z\d\-_]+)'(\s|\])/g;
var RELATION_PATTERN = /[>\+~]/;
var WHITESPACE_PATTERN = /\s/;

var ASTERISK_PLUS_HTML_HACK = '*+html ';
var ASTERISK_FIRST_CHILD_PLUS_HTML_HACK = '*:first-child+html ';
var LESS_THAN = '<';

function hasInvalidCharacters(value) {
  var isEscaped;
  var isInvalid = false;
  var character;
  var isQuote = false;
  var i, l;

  for (i = 0, l = value.length; i < l; i++) {
    character = value[i];

    if (isEscaped) ; else if (character == marker.SINGLE_QUOTE || character == marker.DOUBLE_QUOTE) {
      isQuote = !isQuote;
    } else if (!isQuote && (character == marker.CLOSE_CURLY_BRACKET || character == marker.EXCLAMATION || character == LESS_THAN || character == marker.SEMICOLON)) {
      isInvalid = true;
      break;
    } else if (!isQuote && i === 0 && RELATION_PATTERN.test(character)) {
      isInvalid = true;
      break;
    }

    isEscaped = character == marker.BACK_SLASH;
  }

  return isInvalid;
}

function removeWhitespace(value, format) {
  var stripped = [];
  var character;
  var isNewLineNix;
  var isNewLineWin;
  var isEscaped;
  var wasEscaped;
  var isQuoted;
  var isSingleQuoted;
  var isDoubleQuoted;
  var isAttribute;
  var isRelation;
  var isWhitespace;
  var roundBracketLevel = 0;
  var wasRelation = false;
  var wasWhitespace = false;
  var withCaseAttribute = CASE_ATTRIBUTE_PATTERN.test(value);
  var spaceAroundRelation = format && format.spaces[Spaces$1.AroundSelectorRelation];
  var i, l;

  for (i = 0, l = value.length; i < l; i++) {
    character = value[i];

    isNewLineNix = character == marker.NEW_LINE_NIX;
    isNewLineWin = character == marker.NEW_LINE_NIX && value[i - 1] == marker.CARRIAGE_RETURN;
    isQuoted = isSingleQuoted || isDoubleQuoted;
    isRelation = !isAttribute && !isEscaped && roundBracketLevel === 0 && RELATION_PATTERN.test(character);
    isWhitespace = WHITESPACE_PATTERN.test(character);

    if (wasEscaped && isQuoted && isNewLineWin) {
      // swallow escaped new windows lines in comments
      stripped.pop();
      stripped.pop();
    } else if (isEscaped && isQuoted && isNewLineNix) {
      // swallow escaped new *nix lines in comments
      stripped.pop();
    } else if (isEscaped) {
      stripped.push(character);
    } else if (character == marker.OPEN_SQUARE_BRACKET && !isQuoted) {
      stripped.push(character);
      isAttribute = true;
    } else if (character == marker.CLOSE_SQUARE_BRACKET && !isQuoted) {
      stripped.push(character);
      isAttribute = false;
    } else if (character == marker.OPEN_ROUND_BRACKET && !isQuoted) {
      stripped.push(character);
      roundBracketLevel++;
    } else if (character == marker.CLOSE_ROUND_BRACKET && !isQuoted) {
      stripped.push(character);
      roundBracketLevel--;
    } else if (character == marker.SINGLE_QUOTE && !isQuoted) {
      stripped.push(character);
      isSingleQuoted = true;
    } else if (character == marker.DOUBLE_QUOTE && !isQuoted) {
      stripped.push(character);
      isDoubleQuoted = true;
    } else if (character == marker.SINGLE_QUOTE && isQuoted) {
      stripped.push(character);
      isSingleQuoted = false;
    } else if (character == marker.DOUBLE_QUOTE && isQuoted) {
      stripped.push(character);
      isDoubleQuoted = false;
    } else if (isWhitespace && wasRelation && !spaceAroundRelation) {
      continue;
    } else if (!isWhitespace && wasRelation && spaceAroundRelation) {
      stripped.push(marker.SPACE);
      stripped.push(character);
    } else if (isWhitespace && (isAttribute || roundBracketLevel > 0) && !isQuoted) ; else if (isWhitespace && wasWhitespace && !isQuoted) ; else if ((isNewLineWin || isNewLineNix) && (isAttribute || roundBracketLevel > 0) && isQuoted) ; else if (isRelation && wasWhitespace && !spaceAroundRelation) {
      stripped.pop();
      stripped.push(character);
    } else if (isRelation && !wasWhitespace && spaceAroundRelation) {
      stripped.push(marker.SPACE);
      stripped.push(character);
    } else if (isWhitespace) {
      stripped.push(marker.SPACE);
    } else {
      stripped.push(character);
    }

    wasEscaped = isEscaped;
    isEscaped = character == marker.BACK_SLASH;
    wasRelation = isRelation;
    wasWhitespace = isWhitespace;
  }

  return withCaseAttribute ?
    stripped.join('').replace(CASE_RESTORE_PATTERN, '$1 $2]') :
    stripped.join('');
}

function removeQuotes(value) {
  if (value.indexOf('\'') == -1 && value.indexOf('"') == -1) {
    return value;
  }

  return value
    .replace(SINGLE_QUOTE_CASE_PATTERN, '=$1 $2')
    .replace(SINGLE_QUOTE_PATTERN, '=$1$2')
    .replace(DOUBLE_QUOTE_CASE_PATTERN, '=$1 $2')
    .replace(DOUBLE_QUOTE_PATTERN, '=$1$2');
}

function tidyRules(rules, removeUnsupported, adjacentSpace, format, warnings) {
  var list = [];
  var repeated = [];

  function removeHTMLComment(rule, match) {
    warnings.push('HTML comment \'' + match + '\' at ' + formatPosition_1(rule[2][0]) + '. Removing.');
    return '';
  }

  for (var i = 0, l = rules.length; i < l; i++) {
    var rule = rules[i];
    var reduced = rule[1];

    reduced = reduced.replace(HTML_COMMENT_PATTERN, removeHTMLComment.bind(null, rule));

    if (hasInvalidCharacters(reduced)) {
      warnings.push('Invalid selector \'' + rule[1] + '\' at ' + formatPosition_1(rule[2][0]) + '. Ignoring.');
      continue;
    }

    reduced = removeWhitespace(reduced, format);
    reduced = removeQuotes(reduced);

    if (adjacentSpace && reduced.indexOf('nav') > 0) {
      reduced = reduced.replace(/\+nav(\S|$)/, '+ nav$1');
    }

    if (removeUnsupported && reduced.indexOf(ASTERISK_PLUS_HTML_HACK) > -1) {
      continue;
    }

    if (removeUnsupported && reduced.indexOf(ASTERISK_FIRST_CHILD_PLUS_HTML_HACK) > -1) {
      continue;
    }

    if (reduced.indexOf('*') > -1) {
      reduced = reduced
        .replace(/\*([:#\.\[])/g, '$1')
        .replace(/^(\:first\-child)?\+html/, '*$1+html');
    }

    if (repeated.indexOf(reduced) > -1) {
      continue;
    }

    rule[1] = reduced;
    repeated.push(reduced);
    list.push(rule);
  }

  if (list.length == 1 && list[0][1].length === 0) {
    warnings.push('Empty selector \'' + list[0][1] + '\' at ' + formatPosition_1(list[0][2][0]) + '. Ignoring.');
    list = [];
  }

  return list;
}

var tidyRules_1 = tidyRules;

var SUPPORTED_COMPACT_BLOCK_MATCHER = /^@media\W/;

function tidyBlock(values, spaceAfterClosingBrace) {
  var withoutSpaceAfterClosingBrace;
  var i;

  for (i = values.length - 1; i >= 0; i--) {
    withoutSpaceAfterClosingBrace = !spaceAfterClosingBrace && SUPPORTED_COMPACT_BLOCK_MATCHER.test(values[i][1]);

    values[i][1] = values[i][1]
      .replace(/\n|\r\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/(,|:|\() /g, '$1')
      .replace(/ \)/g, ')')
      .replace(/'([a-zA-Z][a-zA-Z\d\-_]+)'/, '$1')
      .replace(/"([a-zA-Z][a-zA-Z\d\-_]+)"/, '$1')
      .replace(withoutSpaceAfterClosingBrace ? /\) /g : null, ')');
  }

  return values;
}

var tidyBlock_1 = tidyBlock;

function tidyAtRule(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/url\(\s+/g, 'url(')
    .replace(/\s+\)/g, ')')
    .trim();
}

var tidyAtRule_1 = tidyAtRule;

var Hack = {
  ASTERISK: 'asterisk',
  BANG: 'bang',
  BACKSLASH: 'backslash',
  UNDERSCORE: 'underscore'
};

var hack = Hack;

function removeUnused(properties) {
  for (var i = properties.length - 1; i >= 0; i--) {
    var property = properties[i];

    if (property.unused) {
      property.all.splice(property.position, 1);
    }
  }
}

var removeUnused_1 = removeUnused;

var ASTERISK_HACK = '*';
var BACKSLASH_HACK = '\\';
var IMPORTANT_TOKEN = '!important';
var UNDERSCORE_HACK = '_';
var BANG_HACK = '!ie';

function restoreFromOptimizing(properties, restoreCallback) {
  var property;
  var restored;
  var current;
  var i;

  for (i = properties.length - 1; i >= 0; i--) {
    property = properties[i];

    if (property.unused) {
      continue;
    }

    if (!property.dirty && !property.important && !property.hack) {
      continue;
    }

    if (restoreCallback) {
      restored = restoreCallback(property);
      property.value = restored;
    } else {
      restored = property.value;
    }

    if (property.important) {
      restoreImportant(property);
    }

    if (property.hack) {
      restoreHack(property);
    }

    if ('all' in property) {
      current = property.all[property.position];
      current[1][1] = property.name;

      current.splice(2, current.length - 1);
      Array.prototype.push.apply(current, restored);
    }
  }
}

function restoreImportant(property) {
  property.value[property.value.length - 1][1] += IMPORTANT_TOKEN;
}

function restoreHack(property) {
  if (property.hack[0] == hack.UNDERSCORE) {
    property.name = UNDERSCORE_HACK + property.name;
  } else if (property.hack[0] == hack.ASTERISK) {
    property.name = ASTERISK_HACK + property.name;
  } else if (property.hack[0] == hack.BACKSLASH) {
    property.value[property.value.length - 1][1] += BACKSLASH_HACK + property.hack[1];
  } else if (property.hack[0] == hack.BANG) {
    property.value[property.value.length - 1][1] += marker.SPACE + BANG_HACK;
  }
}

var restoreFromOptimizing_1 = restoreFromOptimizing;

var Token = {
  AT_RULE: 'at-rule', // e.g. `@import`, `@charset`
  AT_RULE_BLOCK: 'at-rule-block', // e.g. `@font-face{...}`
  AT_RULE_BLOCK_SCOPE: 'at-rule-block-scope', // e.g. `@font-face`
  COMMENT: 'comment', // e.g. `/* comment */`
  NESTED_BLOCK: 'nested-block', // e.g. `@media screen{...}`, `@keyframes animation {...}`
  NESTED_BLOCK_SCOPE: 'nested-block-scope', // e.g. `@media`, `@keyframes`
  PROPERTY: 'property', // e.g. `color:red`
  PROPERTY_BLOCK: 'property-block', // e.g. `--var:{color:red}`
  PROPERTY_NAME: 'property-name', // e.g. `color`
  PROPERTY_VALUE: 'property-value', // e.g. `red`
  RAW: 'raw', // e.g. anything between /* clean-css ignore:start */ and /* clean-css ignore:end */ comments
  RULE: 'rule', // e.g `div > a{...}`
  RULE_SCOPE: 'rule-scope' // e.g `div > a`
};

var token = Token;

var Match = {
  ASTERISK: '*',
  BACKSLASH: '\\',
  BANG: '!',
  BANG_SUFFIX_PATTERN: /!\w+$/,
  IMPORTANT_TOKEN: '!important',
  IMPORTANT_TOKEN_PATTERN: new RegExp('!important$', 'i'),
  IMPORTANT_WORD: 'important',
  IMPORTANT_WORD_PATTERN: new RegExp('important$', 'i'),
  SUFFIX_BANG_PATTERN: /!$/,
  UNDERSCORE: '_',
  VARIABLE_REFERENCE_PATTERN: /var\(--.+\)$/
};

function wrapAll(properties, includeVariable, skipProperties) {
  var wrapped = [];
  var single;
  var property;
  var i;

  for (i = properties.length - 1; i >= 0; i--) {
    property = properties[i];

    if (property[0] != token.PROPERTY) {
      continue;
    }

    if (!includeVariable && someVariableReferences(property)) {
      continue;
    }

    if (skipProperties && skipProperties.indexOf(property[1][1]) > -1) {
      continue;
    }

    single = wrapSingle(property);
    single.all = properties;
    single.position = i;
    wrapped.unshift(single);
  }

  return wrapped;
}

function someVariableReferences(property) {
  var i, l;
  var value;

  // skipping `property` and property name tokens
  for (i = 2, l = property.length; i < l; i++) {
    value = property[i];

    if (value[0] != token.PROPERTY_VALUE) {
      continue;
    }

    if (isVariableReference(value[1])) {
      return true;
    }
  }

  return false;
}

function isVariableReference(value) {
  return Match.VARIABLE_REFERENCE_PATTERN.test(value);
}

function isMultiplex(property) {
  var value;
  var i, l;

  for (i = 3, l = property.length; i < l; i++) {
    value = property[i];

    if (value[0] == token.PROPERTY_VALUE && (value[1] == marker.COMMA || value[1] == marker.FORWARD_SLASH)) {
      return true;
    }
  }

  return false;
}

function hackFrom(property) {
  var match = false;
  var name = property[1][1];
  var lastValue = property[property.length - 1];

  if (name[0] == Match.UNDERSCORE) {
    match = [hack.UNDERSCORE];
  } else if (name[0] == Match.ASTERISK) {
    match = [hack.ASTERISK];
  } else if (lastValue[1][0] == Match.BANG && !lastValue[1].match(Match.IMPORTANT_WORD_PATTERN)) {
    match = [hack.BANG];
  } else if (lastValue[1].indexOf(Match.BANG) > 0 && !lastValue[1].match(Match.IMPORTANT_WORD_PATTERN) && Match.BANG_SUFFIX_PATTERN.test(lastValue[1])) {
    match = [hack.BANG];
  } else if (lastValue[1].indexOf(Match.BACKSLASH) > 0 && lastValue[1].indexOf(Match.BACKSLASH) == lastValue[1].length - Match.BACKSLASH.length - 1) {
    match = [hack.BACKSLASH, lastValue[1].substring(lastValue[1].indexOf(Match.BACKSLASH) + 1)];
  } else if (lastValue[1].indexOf(Match.BACKSLASH) === 0 && lastValue[1].length == 2) {
    match = [hack.BACKSLASH, lastValue[1].substring(1)];
  }

  return match;
}

function isImportant(property) {
  if (property.length < 3)
    return false;

  var lastValue = property[property.length - 1];
  if (Match.IMPORTANT_TOKEN_PATTERN.test(lastValue[1])) {
    return true;
  } else if (Match.IMPORTANT_WORD_PATTERN.test(lastValue[1]) && Match.SUFFIX_BANG_PATTERN.test(property[property.length - 2][1])) {
    return true;
  }

  return false;
}

function stripImportant(property) {
  var lastValue = property[property.length - 1];
  var oneButLastValue = property[property.length - 2];

  if (Match.IMPORTANT_TOKEN_PATTERN.test(lastValue[1])) {
    lastValue[1] = lastValue[1].replace(Match.IMPORTANT_TOKEN_PATTERN, '');
  } else {
    lastValue[1] = lastValue[1].replace(Match.IMPORTANT_WORD_PATTERN, '');
    oneButLastValue[1] = oneButLastValue[1].replace(Match.SUFFIX_BANG_PATTERN, '');
  }

  if (lastValue[1].length === 0) {
    property.pop();
  }

  if (oneButLastValue[1].length === 0) {
    property.pop();
  }
}

function stripPrefixHack(property) {
  property[1][1] = property[1][1].substring(1);
}

function stripSuffixHack(property, hackFrom) {
  var lastValue = property[property.length - 1];
  lastValue[1] = lastValue[1]
    .substring(0, lastValue[1].indexOf(hackFrom[0] == hack.BACKSLASH ? Match.BACKSLASH : Match.BANG))
    .trim();

  if (lastValue[1].length === 0) {
    property.pop();
  }
}

function wrapSingle(property) {
  var importantProperty = isImportant(property);
  if (importantProperty) {
    stripImportant(property);
  }

  var whichHack = hackFrom(property);
  if (whichHack[0] == hack.ASTERISK || whichHack[0] == hack.UNDERSCORE) {
    stripPrefixHack(property);
  } else if (whichHack[0] == hack.BACKSLASH || whichHack[0] == hack.BANG) {
    stripSuffixHack(property, whichHack);
  }

  return {
    block: property[2] && property[2][0] == token.PROPERTY_BLOCK,
    components: [],
    dirty: false,
    hack: whichHack,
    important: importantProperty,
    name: property[1][1],
    multiplex: property.length > 3 ? isMultiplex(property) : false,
    position: 0,
    shorthand: false,
    unused: false,
    value: property.slice(2)
  };
}

var wrapForOptimizing = {
  all: wrapAll,
  single: wrapSingle
};

var INTEGER_PATTERN = /^\d+$/;

var ALL_UNITS = ['*', 'all'];
var DEFAULT_PRECISION = 'off'; // all precision changes are disabled
var DIRECTIVES_SEPARATOR = ','; // e.g. *=5,px=3
var DIRECTIVE_VALUE_SEPARATOR = '='; // e.g. *=5

function roundingPrecisionFrom(source) {
  return override_1(defaults(DEFAULT_PRECISION), buildPrecisionFrom(source));
}

function defaults(value) {
  return {
    'ch': value,
    'cm': value,
    'em': value,
    'ex': value,
    'in': value,
    'mm': value,
    'pc': value,
    'pt': value,
    'px': value,
    'q': value,
    'rem': value,
    'vh': value,
    'vmax': value,
    'vmin': value,
    'vw': value,
    '%': value
  };
}

function buildPrecisionFrom(source) {
  if (source === null || source === undefined) {
    return {};
  }

  if (typeof source == 'boolean') {
    return {};
  }

  if (typeof source == 'number' && source == -1) {
    return defaults(DEFAULT_PRECISION);
  }

  if (typeof source == 'number') {
    return defaults(source);
  }

  if (typeof source == 'string' && INTEGER_PATTERN.test(source)) {
    return defaults(parseInt(source));
  }

  if (typeof source == 'string' && source == DEFAULT_PRECISION) {
    return defaults(DEFAULT_PRECISION);
  }

  if (typeof source == 'object') {
    return source;
  }

  return source
    .split(DIRECTIVES_SEPARATOR)
    .reduce(function (accumulator, directive) {
      var directiveParts = directive.split(DIRECTIVE_VALUE_SEPARATOR);
      var name = directiveParts[0];
      var value = parseInt(directiveParts[1]);

      if (isNaN(value) || value == -1) {
        value = DEFAULT_PRECISION;
      }

      if (ALL_UNITS.indexOf(name) > -1) {
        accumulator = override_1(accumulator, defaults(value));
      } else {
        accumulator[name] = value;
      }

      return accumulator;
    }, {});
}

var roundingPrecision = {
  DEFAULT: DEFAULT_PRECISION,
  roundingPrecisionFrom: roundingPrecisionFrom
};

var roundingPrecisionFrom$1 = roundingPrecision.roundingPrecisionFrom;



var OptimizationLevel = {
  Zero: '0',
  One: '1',
  Two: '2'
};

var DEFAULTS$1 = {};

DEFAULTS$1[OptimizationLevel.Zero] = {};
DEFAULTS$1[OptimizationLevel.One] = {
  cleanupCharsets: true,
  normalizeUrls: true,
  optimizeBackground: true,
  optimizeBorderRadius: true,
  optimizeFilter: true,
  optimizeFontWeight: true,
  optimizeOutline: true,
  removeEmpty: true,
  removeNegativePaddings: true,
  removeQuotes: true,
  removeWhitespace: true,
  replaceMultipleZeros: true,
  replaceTimeUnits: true,
  replaceZeroUnits: true,
  roundingPrecision: roundingPrecisionFrom$1(undefined),
  selectorsSortingMethod: 'standard',
  specialComments: 'all',
  tidyAtRules: true,
  tidyBlockScopes: true,
  tidySelectors: true,
  transform: noop
};
DEFAULTS$1[OptimizationLevel.Two] = {
  mergeAdjacentRules: true,
  mergeIntoShorthands: true,
  mergeMedia: true,
  mergeNonAdjacentRules: true,
  mergeSemantically: false,
  overrideProperties: true,
  removeEmpty: true,
  reduceNonAdjacentRules: true,
  removeDuplicateFontRules: true,
  removeDuplicateMediaBlocks: true,
  removeDuplicateRules: true,
  removeUnusedAtRules: false,
  restructureRules: false,
  skipProperties: []
};

var ALL_KEYWORD_1 = '*';
var ALL_KEYWORD_2 = 'all';
var FALSE_KEYWORD_1$1 = 'false';
var FALSE_KEYWORD_2$1 = 'off';
var TRUE_KEYWORD_1$1 = 'true';
var TRUE_KEYWORD_2$1 = 'on';

var LIST_VALUE_SEPARATOR = ',';
var OPTION_SEPARATOR$1 = ';';
var OPTION_VALUE_SEPARATOR = ':';

function noop() {}

function optimizationLevelFrom(source) {
  var level = override_1(DEFAULTS$1, {});
  var Zero = OptimizationLevel.Zero;
  var One = OptimizationLevel.One;
  var Two = OptimizationLevel.Two;


  if (undefined === source) {
    delete level[Two];
    return level;
  }

  if (typeof source == 'string') {
    source = parseInt(source);
  }

  if (typeof source == 'number' && source === parseInt(Two)) {
    return level;
  }

  if (typeof source == 'number' && source === parseInt(One)) {
    delete level[Two];
    return level;
  }

  if (typeof source == 'number' && source === parseInt(Zero)) {
    delete level[Two];
    delete level[One];
    return level;
  }

  if (typeof source == 'object') {
    source = covertValuesToHashes(source);
  }

  if (One in source && 'roundingPrecision' in source[One]) {
    source[One].roundingPrecision = roundingPrecisionFrom$1(source[One].roundingPrecision);
  }

  if (Two in source && 'skipProperties' in source[Two] && typeof(source[Two].skipProperties) == 'string') {
    source[Two].skipProperties = source[Two].skipProperties.split(LIST_VALUE_SEPARATOR);
  }

  if (Zero in source || One in source || Two in source) {
    level[Zero] = override_1(level[Zero], source[Zero]);
  }

  if (One in source && ALL_KEYWORD_1 in source[One]) {
    level[One] = override_1(level[One], defaults$1(One, normalizeValue$1(source[One][ALL_KEYWORD_1])));
    delete source[One][ALL_KEYWORD_1];
  }

  if (One in source && ALL_KEYWORD_2 in source[One]) {
    level[One] = override_1(level[One], defaults$1(One, normalizeValue$1(source[One][ALL_KEYWORD_2])));
    delete source[One][ALL_KEYWORD_2];
  }

  if (One in source || Two in source) {
    level[One] = override_1(level[One], source[One]);
  } else {
    delete level[One];
  }

  if (Two in source && ALL_KEYWORD_1 in source[Two]) {
    level[Two] = override_1(level[Two], defaults$1(Two, normalizeValue$1(source[Two][ALL_KEYWORD_1])));
    delete source[Two][ALL_KEYWORD_1];
  }

  if (Two in source && ALL_KEYWORD_2 in source[Two]) {
    level[Two] = override_1(level[Two], defaults$1(Two, normalizeValue$1(source[Two][ALL_KEYWORD_2])));
    delete source[Two][ALL_KEYWORD_2];
  }

  if (Two in source) {
    level[Two] = override_1(level[Two], source[Two]);
  } else {
    delete level[Two];
  }

  return level;
}

function defaults$1(level, value) {
  var options = override_1(DEFAULTS$1[level], {});
  var key;

  for (key in options) {
    if (typeof options[key] == 'boolean') {
      options[key] = value;
    }
  }

  return options;
}

function normalizeValue$1(value) {
  switch (value) {
    case FALSE_KEYWORD_1$1:
    case FALSE_KEYWORD_2$1:
      return false;
    case TRUE_KEYWORD_1$1:
    case TRUE_KEYWORD_2$1:
      return true;
    default:
      return value;
  }
}

function covertValuesToHashes(source) {
  var clonedSource = override_1(source, {});
  var level;
  var i;

  for (i = 0; i <= 2; i++) {
    level = '' + i;

    if (level in clonedSource && (clonedSource[level] === undefined || clonedSource[level] === false)) {
      delete clonedSource[level];
    }

    if (level in clonedSource && clonedSource[level] === true) {
      clonedSource[level] = {};
    }

    if (level in clonedSource && typeof clonedSource[level] == 'string') {
      clonedSource[level] = covertToHash(clonedSource[level], level);
    }
  }

  return clonedSource;
}

function covertToHash(asString, level) {
  return asString
    .split(OPTION_SEPARATOR$1)
    .reduce(function (accumulator, directive) {
      var parts = directive.split(OPTION_VALUE_SEPARATOR);
      var name = parts[0];
      var value = parts[1];
      var normalizedValue = normalizeValue$1(value);

      if (ALL_KEYWORD_1 == name || ALL_KEYWORD_2 == name) {
        accumulator = override_1(accumulator, defaults$1(level, normalizedValue));
      } else {
        accumulator[name] = normalizedValue;
      }

      return accumulator;
    }, {});
}

var optimizationLevel = {
  OptimizationLevel: OptimizationLevel,
  optimizationLevelFrom: optimizationLevelFrom,
};

function split(value, separator) {
  var openLevel = marker.OPEN_ROUND_BRACKET;
  var closeLevel = marker.CLOSE_ROUND_BRACKET;
  var level = 0;
  var cursor = 0;
  var lastStart = 0;
  var lastValue;
  var lastCharacter;
  var len = value.length;
  var parts = [];

  if (value.indexOf(separator) == -1) {
    return [value];
  }

  if (value.indexOf(openLevel) == -1) {
    return value.split(separator);
  }

  while (cursor < len) {
    if (value[cursor] == openLevel) {
      level++;
    } else if (value[cursor] == closeLevel) {
      level--;
    }

    if (level === 0 && cursor > 0 && cursor + 1 < len && value[cursor] == separator) {
      parts.push(value.substring(lastStart, cursor));
      lastStart = cursor + 1;
    }

    cursor++;
  }

  if (lastStart < cursor + 1) {
    lastValue = value.substring(lastStart);
    lastCharacter = lastValue[lastValue.length - 1];
    if (lastCharacter == separator) {
      lastValue = lastValue.substring(0, lastValue.length - 1);
    }

    parts.push(lastValue);
  }

  return parts;
}

var split_1 = split;

var emptyCharacter = '';

var Breaks$1 = format.Breaks;
var Spaces$2 = format.Spaces;




function supportsAfterClosingBrace(token) {
  return token[1][1] == 'background' || token[1][1] == 'transform' || token[1][1] == 'src';
}

function afterClosingBrace(token, valueIndex) {
  return token[valueIndex][1][token[valueIndex][1].length - 1] == marker.CLOSE_ROUND_BRACKET;
}

function afterComma(token, valueIndex) {
  return token[valueIndex][1] == marker.COMMA;
}

function afterSlash(token, valueIndex) {
  return token[valueIndex][1] == marker.FORWARD_SLASH;
}

function beforeComma(token, valueIndex) {
  return token[valueIndex + 1] && token[valueIndex + 1][1] == marker.COMMA;
}

function beforeSlash(token, valueIndex) {
  return token[valueIndex + 1] && token[valueIndex + 1][1] == marker.FORWARD_SLASH;
}

function inFilter(token) {
  return token[1][1] == 'filter' || token[1][1] == '-ms-filter';
}

function disallowsSpace(context, token, valueIndex) {
  return !context.spaceAfterClosingBrace && supportsAfterClosingBrace(token) && afterClosingBrace(token, valueIndex) ||
    beforeSlash(token, valueIndex) ||
    afterSlash(token, valueIndex) ||
    beforeComma(token, valueIndex) ||
    afterComma(token, valueIndex);
}

function rules(context, tokens) {
  var store = context.store;

  for (var i = 0, l = tokens.length; i < l; i++) {
    store(context, tokens[i]);

    if (i < l - 1) {
      store(context, comma(context));
    }
  }
}

function body(context, tokens) {
  var lastPropertyAt = lastPropertyIndex(tokens);

  for (var i = 0, l = tokens.length; i < l; i++) {
    property(context, tokens, i, lastPropertyAt);
  }
}

function lastPropertyIndex(tokens) {
  var index = tokens.length - 1;

  for (; index >= 0; index--) {
    if (tokens[index][0] != token.COMMENT) {
      break;
    }
  }

  return index;
}

function property(context, tokens, position, lastPropertyAt) {
  var store = context.store;
  var token$1 = tokens[position];

  var propertyValue = token$1[2];
  var isPropertyBlock = propertyValue && propertyValue[0] === token.PROPERTY_BLOCK;

  var needsSemicolon;
  if ( context.format ) {
    if ( context.format.semicolonAfterLastProperty || isPropertyBlock ) {
      needsSemicolon = true;
    } else if ( position < lastPropertyAt ) {
      needsSemicolon = true;
    } else {
      needsSemicolon = false;
    }
  } else {
    needsSemicolon = position < lastPropertyAt || isPropertyBlock;
  }

  var isLast = position === lastPropertyAt;

  switch (token$1[0]) {
    case token.AT_RULE:
      store(context, token$1);
      store(context, semicolon(context, Breaks$1.AfterProperty, false));
      break;
    case token.AT_RULE_BLOCK:
      rules(context, token$1[1]);
      store(context, openBrace(context, Breaks$1.AfterRuleBegins, true));
      body(context, token$1[2]);
      store(context, closeBrace(context, Breaks$1.AfterRuleEnds, false, isLast));
      break;
    case token.COMMENT:
      store(context, token$1);
      break;
    case token.PROPERTY:
      store(context, token$1[1]);
      store(context, colon(context));
      if (propertyValue) {
        value(context, token$1);
      }
      store(context, needsSemicolon ? semicolon(context, Breaks$1.AfterProperty, isLast) : emptyCharacter);
      break;
    case token.RAW:
      store(context, token$1);
  }
}

function value(context, token$1) {
  var store = context.store;
  var j, m;

  if (token$1[2][0] == token.PROPERTY_BLOCK) {
    store(context, openBrace(context, Breaks$1.AfterBlockBegins, false));
    body(context, token$1[2][1]);
    store(context, closeBrace(context, Breaks$1.AfterBlockEnds, false, true));
  } else {
    for (j = 2, m = token$1.length; j < m; j++) {
      store(context, token$1[j]);

      if (j < m - 1 && (inFilter(token$1) || !disallowsSpace(context, token$1, j))) {
        store(context, marker.SPACE);
      }
    }
  }
}

function allowsBreak(context, where) {
  return context.format && context.format.breaks[where];
}

function allowsSpace(context, where) {
  return context.format && context.format.spaces[where];
}

function openBrace(context, where, needsPrefixSpace) {
  if (context.format) {
    context.indentBy += context.format.indentBy;
    context.indentWith = context.format.indentWith.repeat(context.indentBy);
    return (needsPrefixSpace && allowsSpace(context, Spaces$2.BeforeBlockBegins) ? marker.SPACE : emptyCharacter) +
      marker.OPEN_CURLY_BRACKET +
      (allowsBreak(context, where) ? context.format.breakWith : emptyCharacter) +
      context.indentWith;
  } else {
    return marker.OPEN_CURLY_BRACKET;
  }
}

function closeBrace(context, where, beforeBlockEnd, isLast) {
  if (context.format) {
    context.indentBy -= context.format.indentBy;
    context.indentWith = context.format.indentWith.repeat(context.indentBy);
    return (allowsBreak(context, Breaks$1.AfterProperty) || beforeBlockEnd && allowsBreak(context, Breaks$1.BeforeBlockEnds) ? context.format.breakWith : emptyCharacter) +
      context.indentWith +
      marker.CLOSE_CURLY_BRACKET +
      (isLast ? emptyCharacter : (allowsBreak(context, where) ? context.format.breakWith : emptyCharacter) + context.indentWith);
  } else {
    return marker.CLOSE_CURLY_BRACKET;
  }
}

function colon(context) {
  return context.format ?
    marker.COLON + (allowsSpace(context, Spaces$2.BeforeValue) ? marker.SPACE : emptyCharacter) :
    marker.COLON;
}

function semicolon(context, where, isLast) {
  return context.format ?
    marker.SEMICOLON + (isLast || !allowsBreak(context, where) ? emptyCharacter : context.format.breakWith + context.indentWith) :
    marker.SEMICOLON;
}

function comma(context) {
  return context.format ?
    marker.COMMA + (allowsBreak(context, Breaks$1.BetweenSelectors) ? context.format.breakWith : emptyCharacter) + context.indentWith :
    marker.COMMA;
}

function all(context, tokens) {
  var store = context.store;
  var token$1;
  var isLast;
  var i, l;

  for (i = 0, l = tokens.length; i < l; i++) {
    token$1 = tokens[i];
    isLast = i == l - 1;

    switch (token$1[0]) {
      case token.AT_RULE:
        store(context, token$1);
        store(context, semicolon(context, Breaks$1.AfterAtRule, isLast));
        break;
      case token.AT_RULE_BLOCK:
        rules(context, token$1[1]);
        store(context, openBrace(context, Breaks$1.AfterRuleBegins, true));
        body(context, token$1[2]);
        store(context, closeBrace(context, Breaks$1.AfterRuleEnds, false, isLast));
        break;
      case token.NESTED_BLOCK:
        rules(context, token$1[1]);
        store(context, openBrace(context, Breaks$1.AfterBlockBegins, true));
        all(context, token$1[2]);
        store(context, closeBrace(context, Breaks$1.AfterBlockEnds, true, isLast));
        break;
      case token.COMMENT:
        store(context, token$1);
        store(context, allowsBreak(context, Breaks$1.AfterComment) ? context.format.breakWith : emptyCharacter);
        break;
      case token.RAW:
        store(context, token$1);
        break;
      case token.RULE:
        rules(context, token$1[1]);
        store(context, openBrace(context, Breaks$1.AfterRuleBegins, true));
        body(context, token$1[2]);
        store(context, closeBrace(context, Breaks$1.AfterRuleEnds, false, isLast));
        break;
    }
  }
}

var helpers = {
  all: all,
  body: body,
  property: property,
  rules: rules,
  value: value
};

function store(serializeContext, token) {
  serializeContext.output.push(typeof token == 'string' ? token : token[1]);
}

function context() {
  var newContext = {
    output: [],
    store: store
  };

  return newContext;
}

function all$1(tokens) {
  var oneTimeContext = context();
  helpers.all(oneTimeContext, tokens);
  return oneTimeContext.output.join('');
}

function body$1(tokens) {
  var oneTimeContext = context();
  helpers.body(oneTimeContext, tokens);
  return oneTimeContext.output.join('');
}

function property$1(tokens, position) {
  var oneTimeContext = context();
  helpers.property(oneTimeContext, tokens, position, true);
  return oneTimeContext.output.join('');
}

function rules$1(tokens) {
  var oneTimeContext = context();
  helpers.rules(oneTimeContext, tokens);
  return oneTimeContext.output.join('');
}

function value$1(tokens) {
  var oneTimeContext = context();
  helpers.value(oneTimeContext, tokens);
  return oneTimeContext.output.join('');
}

var oneTime = {
  all: all$1,
  body: body$1,
  property: property$1,
  rules: rules$1,
  value: value$1
};

var wrapForOptimizing$1 = wrapForOptimizing.all;

var OptimizationLevel$1 = optimizationLevel.OptimizationLevel;







var serializeRules = oneTime.rules;

var IgnoreProperty = 'ignore-property';

var CHARSET_TOKEN = '@charset';
var CHARSET_REGEXP = new RegExp('^' + CHARSET_TOKEN, 'i');

var DEFAULT_ROUNDING_PRECISION = roundingPrecision.DEFAULT;

var WHOLE_PIXEL_VALUE = /(?:^|\s|\()(-?\d+)px/;
var TIME_VALUE = /^(\-?[\d\.]+)(m?s)$/;

var HEX_VALUE_PATTERN = /[0-9a-f]/i;
var PROPERTY_NAME_PATTERN = /^(?:\-chrome\-|\-[\w\-]+\w|\w[\w\-]+\w|\-\-\S+)$/;
var IMPORT_PREFIX_PATTERN = /^@import/i;
var QUOTED_PATTERN = /^('.*'|".*")$/;
var QUOTED_BUT_SAFE_PATTERN = /^['"][a-zA-Z][a-zA-Z\d\-_]+['"]$/;
var URL_PREFIX_PATTERN = /^url\(/i;
var LOCAL_PREFIX_PATTERN = /^local\(/i;
var VARIABLE_NAME_PATTERN = /^--\S+$/;

function isLocal(value){
  return LOCAL_PREFIX_PATTERN.test(value);
}

function isNegative(value) {
  return value && value[1][0] == '-' && parseFloat(value[1]) < 0;
}

function isQuoted(value) {
  return QUOTED_PATTERN.test(value);
}

function isUrl(value) {
  return URL_PREFIX_PATTERN.test(value);
}

function normalizeUrl(value) {
  return value
    .replace(URL_PREFIX_PATTERN, 'url(')
    .replace(/\\?\n|\\?\r\n/g, '');
}

function optimizeBackground(property) {
  var values = property.value;

  if (values.length == 1 && values[0][1] == 'none') {
    values[0][1] = '0 0';
  }

  if (values.length == 1 && values[0][1] == 'transparent') {
    values[0][1] = '0 0';
  }
}

function optimizeBorderRadius(property) {
  var values = property.value;
  var spliceAt;

  if (values.length == 3 && values[1][1] == '/' && values[0][1] == values[2][1]) {
    spliceAt = 1;
  } else if (values.length == 5 && values[2][1] == '/' && values[0][1] == values[3][1] && values[1][1] == values[4][1]) {
    spliceAt = 2;
  } else if (values.length == 7 && values[3][1] == '/' && values[0][1] == values[4][1] && values[1][1] == values[5][1] && values[2][1] == values[6][1]) {
    spliceAt = 3;
  } else if (values.length == 9 && values[4][1] == '/' && values[0][1] == values[5][1] && values[1][1] == values[6][1] && values[2][1] == values[7][1] && values[3][1] == values[8][1]) {
    spliceAt = 4;
  }

  if (spliceAt) {
    property.value.splice(spliceAt);
    property.dirty = true;
  }
}

/**
 * @param {string} name
 * @param {string} value
 * @param {Object} compatibility
 * @return {string}
 */
function optimizeColors(name, value, compatibility) {
  if (!value.match(/#|rgb|hsl/gi)) {
    return shortenHex_1(value);
  }

  value = value
    .replace(/(rgb|hsl)a?\((\-?\d+),(\-?\d+\%?),(\-?\d+\%?),(0*[1-9]+[0-9]*(\.?\d*)?)\)/gi, function (match, colorFn, p1, p2, p3, alpha) {
      return (parseInt(alpha, 10) >= 1 ? colorFn + '(' + [p1,p2,p3].join(',') + ')' : match);
    })
    .replace(/rgb\((\-?\d+),(\-?\d+),(\-?\d+)\)/gi, function (match, red, green, blue) {
      return shortenRgb_1(red, green, blue);
    })
    .replace(/hsl\((-?\d+),(-?\d+)%?,(-?\d+)%?\)/gi, function (match, hue, saturation, lightness) {
      return shortenHsl_1(hue, saturation, lightness);
    })
    .replace(/(^|[^='"])#([0-9a-f]{6})/gi, function (match, prefix, color, at, inputValue) {
      var suffix = inputValue[at + match.length];

      if (suffix && HEX_VALUE_PATTERN.test(suffix)) {
        return match;
      } else if (color[0] == color[1] && color[2] == color[3] && color[4] == color[5]) {
        return (prefix + '#' + color[0] + color[2] + color[4]).toLowerCase();
      } else {
        return (prefix + '#' + color).toLowerCase();
      }
    })
    .replace(/(^|[^='"])#([0-9a-f]{3})/gi, function (match, prefix, color) {
      return prefix + '#' + color.toLowerCase();
    })
    .replace(/(rgb|rgba|hsl|hsla)\(([^\)]+)\)/gi, function (match, colorFunction, colorDef) {
      var tokens = colorDef.split(',');
      var colorFnLowercase = colorFunction && colorFunction.toLowerCase();
      var applies = (colorFnLowercase == 'hsl' && tokens.length == 3) ||
        (colorFnLowercase == 'hsla' && tokens.length == 4) ||
        (colorFnLowercase == 'rgb' && tokens.length === 3 && colorDef.indexOf('%') > 0) ||
        (colorFnLowercase == 'rgba' && tokens.length == 4 && colorDef.indexOf('%') > 0);

      if (!applies) {
        return match;
      }

      if (tokens[1].indexOf('%') == -1) {
        tokens[1] += '%';
      }

      if (tokens[2].indexOf('%') == -1) {
        tokens[2] += '%';
      }

      return colorFunction + '(' + tokens.join(',') + ')';
    });

  if (compatibility.colors.opacity && name.indexOf('background') == -1) {
    value = value.replace(/(?:rgba|hsla)\(0,0%?,0%?,0\)/g, function (match) {
      if (split_1(value, ',').pop().indexOf('gradient(') > -1) {
        return match;
      }

      return 'transparent';
    });
  }

  return shortenHex_1(value);
}

function optimizeFilter(property) {
  if (property.value.length == 1) {
    property.value[0][1] = property.value[0][1].replace(/progid:DXImageTransform\.Microsoft\.(Alpha|Chroma)(\W)/, function (match, filter, suffix) {
      return filter.toLowerCase() + suffix;
    });
  }

  property.value[0][1] = property.value[0][1]
    .replace(/,(\S)/g, ', $1')
    .replace(/ ?= ?/g, '=');
}

function optimizeFontWeight(property, atIndex) {
  var value = property.value[atIndex][1];

  if (value == 'normal') {
    value = '400';
  } else if (value == 'bold') {
    value = '700';
  }

  property.value[atIndex][1] = value;
}

function optimizeMultipleZeros(property) {
  var values = property.value;
  var spliceAt;

  if (values.length == 4 && values[0][1] === '0' && values[1][1] === '0' && values[2][1] === '0' && values[3][1] === '0') {
    if (property.name.indexOf('box-shadow') > -1) {
      spliceAt = 2;
    } else {
      spliceAt = 1;
    }
  }

  if (spliceAt) {
    property.value.splice(spliceAt);
    property.dirty = true;
  }
}

function optimizeOutline(property) {
  var values = property.value;

  if (values.length == 1 && values[0][1] == 'none') {
    values[0][1] = '0';
  }
}

function optimizePixelLengths(_, value, compatibility) {
  if (!WHOLE_PIXEL_VALUE.test(value)) {
    return value;
  }

  return value.replace(WHOLE_PIXEL_VALUE, function (match, val) {
    var newValue;
    var intVal = parseInt(val);

    if (intVal === 0) {
      return match;
    }

    if (compatibility.properties.shorterLengthUnits && compatibility.units.pt && intVal * 3 % 4 === 0) {
      newValue = intVal * 3 / 4 + 'pt';
    }

    if (compatibility.properties.shorterLengthUnits && compatibility.units.pc && intVal % 16 === 0) {
      newValue = intVal / 16 + 'pc';
    }

    if (compatibility.properties.shorterLengthUnits && compatibility.units.in && intVal % 96 === 0) {
      newValue = intVal / 96 + 'in';
    }

    if (newValue) {
      newValue = match.substring(0, match.indexOf(val)) + newValue;
    }

    return newValue && newValue.length < match.length ? newValue : match;
  });
}

function optimizePrecision(_, value, precisionOptions) {
  if (!precisionOptions.enabled || value.indexOf('.') === -1) {
    return value;
  }

  return value
    .replace(precisionOptions.decimalPointMatcher, '$1$2$3')
    .replace(precisionOptions.zeroMatcher, function (match, integerPart, fractionPart, unit) {
      var multiplier = precisionOptions.units[unit].multiplier;
      var parsedInteger = parseInt(integerPart);
      var integer = isNaN(parsedInteger) ? 0 : parsedInteger;
      var fraction = parseFloat(fractionPart);

      return Math.round((integer + fraction) * multiplier) / multiplier + unit;
    });
}

function optimizeTimeUnits(_, value) {
  if (!TIME_VALUE.test(value))
    return value;

  return value.replace(TIME_VALUE, function (match, val, unit) {
    var newValue;

    if (unit == 'ms') {
      newValue = parseInt(val) / 1000 + 's';
    } else if (unit == 's') {
      newValue = parseFloat(val) * 1000 + 'ms';
    }

    return newValue.length < match.length ? newValue : match;
  });
}

function optimizeUnits(name, value, unitsRegexp) {
  if (/^(?:\-moz\-calc|\-webkit\-calc|calc|rgb|hsl|rgba|hsla)\(/.test(value)) {
    return value;
  }

  if (name == 'flex' || name == '-ms-flex' || name == '-webkit-flex' || name == 'flex-basis' || name == '-webkit-flex-basis') {
    return value;
  }

  if (value.indexOf('%') > 0 && (name == 'height' || name == 'max-height' || name == 'width' || name == 'max-width')) {
    return value;
  }

  return value
    .replace(unitsRegexp, '$1' + '0' + '$2')
    .replace(unitsRegexp, '$1' + '0' + '$2');
}

function optimizeWhitespace(name, value) {
  if (name.indexOf('filter') > -1 || value.indexOf(' ') == -1 || value.indexOf('expression') === 0) {
    return value;
  }

  if (value.indexOf(marker.SINGLE_QUOTE) > -1 || value.indexOf(marker.DOUBLE_QUOTE) > -1) {
    return value;
  }

  value = value.replace(/\s+/g, ' ');

  if (value.indexOf('calc') > -1) {
    value = value.replace(/\) ?\/ ?/g, ')/ ');
  }

  return value
    .replace(/(\(;?)\s+/g, '$1')
    .replace(/\s+(;?\))/g, '$1')
    .replace(/, /g, ',');
}

function optimizeZeroDegUnit(_, value) {
  if (value.indexOf('0deg') == -1) {
    return value;
  }

  return value.replace(/\(0deg\)/g, '(0)');
}

function optimizeZeroUnits(name, value) {
  if (value.indexOf('0') == -1) {
    return value;
  }

  if (value.indexOf('-') > -1) {
    value = value
      .replace(/([^\w\d\-]|^)\-0([^\.]|$)/g, '$10$2')
      .replace(/([^\w\d\-]|^)\-0([^\.]|$)/g, '$10$2');
  }

  return value
    .replace(/(^|\s)0+([1-9])/g, '$1$2')
    .replace(/(^|\D)\.0+(\D|$)/g, '$10$2')
    .replace(/(^|\D)\.0+(\D|$)/g, '$10$2')
    .replace(/\.([1-9]*)0+(\D|$)/g, function (match, nonZeroPart, suffix) {
      return (nonZeroPart.length > 0 ? '.' : '') + nonZeroPart + suffix;
    })
    .replace(/(^|\D)0\.(\d)/g, '$1.$2');
}

function removeQuotes$1(name, value) {
  if (name == 'content' || name.indexOf('font-variation-settings') > -1 || name.indexOf('font-feature-settings') > -1 || name == 'grid' || name.indexOf('grid-') > -1) {
    return value;
  }

  return QUOTED_BUT_SAFE_PATTERN.test(value) ?
    value.substring(1, value.length - 1) :
    value;
}

function removeUrlQuotes(value) {
  return /^url\(['"].+['"]\)$/.test(value) && !/^url\(['"].*[\*\s\(\)'"].*['"]\)$/.test(value) && !/^url\(['"]data:[^;]+;charset/.test(value) ?
    value.replace(/["']/g, '') :
    value;
}

function transformValue(propertyName, propertyValue, rule, transformCallback) {
  var selector = serializeRules(rule);
  var transformedValue = transformCallback(propertyName, propertyValue, selector);

  if (transformedValue === undefined) {
    return propertyValue;
  } else if (transformedValue === false) {
    return IgnoreProperty;
  } else {
    return transformedValue;
  }
}

//

function optimizeBody(rule, properties, context) {
  var options = context.options;
  var levelOptions = options.level[OptimizationLevel$1.One];
  var property, name, type, value;
  var valueIsUrl;
  var propertyToken;
  var _properties = wrapForOptimizing$1(properties, true);

  propertyLoop:
  for (var i = 0, l = _properties.length; i < l; i++) {
    property = _properties[i];
    name = property.name;

    if (!PROPERTY_NAME_PATTERN.test(name)) {
      propertyToken = property.all[property.position];
      context.warnings.push('Invalid property name \'' + name + '\' at ' + formatPosition_1(propertyToken[1][2][0]) + '. Ignoring.');
      property.unused = true;
    }

    if (property.value.length === 0) {
      propertyToken = property.all[property.position];
      context.warnings.push('Empty property \'' + name + '\' at ' + formatPosition_1(propertyToken[1][2][0]) + '. Ignoring.');
      property.unused = true;
    }

    if (property.hack && (
        (property.hack[0] == hack.ASTERISK || property.hack[0] == hack.UNDERSCORE) && !options.compatibility.properties.iePrefixHack ||
        property.hack[0] == hack.BACKSLASH && !options.compatibility.properties.ieSuffixHack ||
        property.hack[0] == hack.BANG && !options.compatibility.properties.ieBangHack)) {
      property.unused = true;
    }

    if (levelOptions.removeNegativePaddings && name.indexOf('padding') === 0 && (isNegative(property.value[0]) || isNegative(property.value[1]) || isNegative(property.value[2]) || isNegative(property.value[3]))) {
      property.unused = true;
    }

    if (!options.compatibility.properties.ieFilters && isLegacyFilter(property)) {
      property.unused = true;
    }

    if (property.unused) {
      continue;
    }

    if (property.block) {
      optimizeBody(rule, property.value[0][1], context);
      continue;
    }

    if (VARIABLE_NAME_PATTERN.test(name)) {
      continue;
    }

    for (var j = 0, m = property.value.length; j < m; j++) {
      type = property.value[j][0];
      value = property.value[j][1];
      valueIsUrl = isUrl(value);

      if (type == token.PROPERTY_BLOCK) {
        property.unused = true;
        context.warnings.push('Invalid value token at ' + formatPosition_1(value[0][1][2][0]) + '. Ignoring.');
        break;
      }

      if (valueIsUrl && !context.validator.isUrl(value)) {
        property.unused = true;
        context.warnings.push('Broken URL \'' + value + '\' at ' + formatPosition_1(property.value[j][2][0]) + '. Ignoring.');
        break;
      }

      if (valueIsUrl) {
        value = levelOptions.normalizeUrls ?
          normalizeUrl(value) :
          value;
        value = !options.compatibility.properties.urlQuotes ?
          removeUrlQuotes(value) :
          value;
      } else if (isQuoted(value) || isLocal(value)) {
        value = levelOptions.removeQuotes ?
          removeQuotes$1(name, value) :
          value;
      } else {
        value = levelOptions.removeWhitespace ?
          optimizeWhitespace(name, value) :
          value;
        value = optimizePrecision(name, value, options.precision);
        value = optimizePixelLengths(name, value, options.compatibility);
        value = levelOptions.replaceTimeUnits ?
          optimizeTimeUnits(name, value) :
          value;
        value = levelOptions.replaceZeroUnits ?
          optimizeZeroUnits(name, value) :
          value;

        if (options.compatibility.properties.zeroUnits) {
          value = optimizeZeroDegUnit(name, value);
          value = optimizeUnits(name, value, options.unitsRegexp);
        }

        if (options.compatibility.properties.colors) {
          value = optimizeColors(name, value, options.compatibility);
        }
      }

      value = transformValue(name, value, rule, levelOptions.transform);

      if (value === IgnoreProperty) {
        property.unused = true;
        continue propertyLoop;
      }

      property.value[j][1] = value;
    }

    if (levelOptions.replaceMultipleZeros) {
      optimizeMultipleZeros(property);
    }

    if (name == 'background' && levelOptions.optimizeBackground) {
      optimizeBackground(property);
    } else if (name.indexOf('border') === 0 && name.indexOf('radius') > 0 && levelOptions.optimizeBorderRadius) {
      optimizeBorderRadius(property);
    } else if (name == 'filter'&& levelOptions.optimizeFilter && options.compatibility.properties.ieFilters) {
      optimizeFilter(property);
    } else if (name == 'font-weight' && levelOptions.optimizeFontWeight) {
      optimizeFontWeight(property, 0);
    } else if (name == 'outline' && levelOptions.optimizeOutline) {
      optimizeOutline(property);
    }
  }

  restoreFromOptimizing_1(_properties);
  removeUnused_1(_properties);
  removeComments(properties, options);
}

function removeComments(tokens, options) {
  var token$1;
  var i;

  for (i = 0; i < tokens.length; i++) {
    token$1 = tokens[i];

    if (token$1[0] != token.COMMENT) {
      continue;
    }

    optimizeComment(token$1, options);

    if (token$1[1].length === 0) {
      tokens.splice(i, 1);
      i--;
    }
  }
}

function optimizeComment(token, options) {
  if (token[1][2] == marker.EXCLAMATION && (options.level[OptimizationLevel$1.One].specialComments == 'all' || options.commentsKept < options.level[OptimizationLevel$1.One].specialComments)) {
    options.commentsKept++;
    return;
  }

  token[1] = [];
}

function cleanupCharsets(tokens) {
  var hasCharset = false;

  for (var i = 0, l = tokens.length; i < l; i++) {
    var token$1 = tokens[i];

    if (token$1[0] != token.AT_RULE)
      continue;

    if (!CHARSET_REGEXP.test(token$1[1]))
      continue;

    if (hasCharset || token$1[1].indexOf(CHARSET_TOKEN) == -1) {
      tokens.splice(i, 1);
      i--;
      l--;
    } else {
      hasCharset = true;
      tokens.splice(i, 1);
      tokens.unshift([token.AT_RULE, token$1[1].replace(CHARSET_REGEXP, CHARSET_TOKEN)]);
    }
  }
}

function buildUnitRegexp(options) {
  var units = ['px', 'em', 'ex', 'cm', 'mm', 'in', 'pt', 'pc', '%'];
  var otherUnits = ['ch', 'rem', 'vh', 'vm', 'vmax', 'vmin', 'vw'];

  otherUnits.forEach(function (unit) {
    if (options.compatibility.units[unit]) {
      units.push(unit);
    }
  });

  return new RegExp('(^|\\s|\\(|,)0(?:' + units.join('|') + ')(\\W|$)', 'g');
}

function buildPrecisionOptions(roundingPrecision) {
  var precisionOptions = {
    matcher: null,
    units: {},
  };
  var optimizable = [];
  var unit;
  var value;

  for (unit in roundingPrecision) {
    value = roundingPrecision[unit];

    if (value != DEFAULT_ROUNDING_PRECISION) {
      precisionOptions.units[unit] = {};
      precisionOptions.units[unit].value = value;
      precisionOptions.units[unit].multiplier = Math.pow(10, value);

      optimizable.push(unit);
    }
  }

  if (optimizable.length > 0) {
    precisionOptions.enabled = true;
    precisionOptions.decimalPointMatcher = new RegExp('(\\d)\\.($|' + optimizable.join('|') + ')($|\W)', 'g');
    precisionOptions.zeroMatcher = new RegExp('(\\d*)(\\.\\d+)(' + optimizable.join('|') + ')', 'g');
  }

  return precisionOptions;
}

function isImport(token) {
  return IMPORT_PREFIX_PATTERN.test(token[1]);
}

function isLegacyFilter(property) {
  var value;

  if (property.name == 'filter' || property.name == '-ms-filter') {
    value = property.value[0][1];

    return value.indexOf('progid') > -1 ||
      value.indexOf('alpha') === 0 ||
      value.indexOf('chroma') === 0;
  } else {
    return false;
  }
}

function level1Optimize(tokens, context) {
  var options = context.options;
  var levelOptions = options.level[OptimizationLevel$1.One];
  var ie7Hack = options.compatibility.selectors.ie7Hack;
  var adjacentSpace = options.compatibility.selectors.adjacentSpace;
  var spaceAfterClosingBrace = options.compatibility.properties.spaceAfterClosingBrace;
  var format = options.format;
  var mayHaveCharset = false;
  var afterRules = false;

  options.unitsRegexp = options.unitsRegexp || buildUnitRegexp(options);
  options.precision = options.precision || buildPrecisionOptions(levelOptions.roundingPrecision);
  options.commentsKept = options.commentsKept || 0;

  for (var i = 0, l = tokens.length; i < l; i++) {
    var token$1 = tokens[i];

    switch (token$1[0]) {
      case token.AT_RULE:
        token$1[1] = isImport(token$1) && afterRules ? '' : token$1[1];
        token$1[1] = levelOptions.tidyAtRules ? tidyAtRule_1(token$1[1]) : token$1[1];
        mayHaveCharset = true;
        break;
      case token.AT_RULE_BLOCK:
        optimizeBody(token$1[1], token$1[2], context);
        afterRules = true;
        break;
      case token.NESTED_BLOCK:
        token$1[1] = levelOptions.tidyBlockScopes ? tidyBlock_1(token$1[1], spaceAfterClosingBrace) : token$1[1];
        level1Optimize(token$1[2], context);
        afterRules = true;
        break;
      case token.COMMENT:
        optimizeComment(token$1, options);
        break;
      case token.RULE:
        token$1[1] = levelOptions.tidySelectors ? tidyRules_1(token$1[1], !ie7Hack, adjacentSpace, format, context.warnings) : token$1[1];
        token$1[1] = token$1[1].length > 1 ? sortSelectors_1(token$1[1], levelOptions.selectorsSortingMethod) : token$1[1];
        optimizeBody(token$1[1], token$1[2], context);
        afterRules = true;
        break;
    }

    if (token$1[0] == token.COMMENT && token$1[1].length === 0 || levelOptions.removeEmpty && (token$1[1].length === 0 || (token$1[2] && token$1[2].length === 0))) {
      tokens.splice(i, 1);
      i--;
      l--;
    }
  }

  if (levelOptions.cleanupCharsets && mayHaveCharset) {
    cleanupCharsets(tokens);
  }

  return tokens;
}

var optimize$1 = level1Optimize;

var DEEP_SELECTOR_PATTERN = /\/deep\//;
var DOUBLE_COLON_PATTERN = /^::/;
var NOT_PSEUDO = ':not';
var PSEUDO_CLASSES_WITH_ARGUMENTS = [
  ':dir',
  ':lang',
  ':not',
  ':nth-child',
  ':nth-last-child',
  ':nth-last-of-type',
  ':nth-of-type'
];
var RELATION_PATTERN$1 = /[>\+~]/;
var UNMIXABLE_PSEUDO_CLASSES = [
  ':after',
  ':before',
  ':first-letter',
  ':first-line',
  ':lang'
];
var UNMIXABLE_PSEUDO_ELEMENTS = [
  '::after',
  '::before',
  '::first-letter',
  '::first-line'
];

var Level = {
  DOUBLE_QUOTE: 'double-quote',
  SINGLE_QUOTE: 'single-quote',
  ROOT: 'root'
};

function isMergeable(selector, mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging) {
  var singleSelectors = split_1(selector, marker.COMMA);
  var singleSelector;
  var i, l;

  for (i = 0, l = singleSelectors.length; i < l; i++) {
    singleSelector = singleSelectors[i];

    if (singleSelector.length === 0 ||
        isDeepSelector(singleSelector) ||
        (singleSelector.indexOf(marker.COLON) > -1 && !areMergeable(singleSelector, extractPseudoFrom(singleSelector), mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging))) {
      return false;
    }
  }

  return true;
}

function isDeepSelector(selector) {
  return DEEP_SELECTOR_PATTERN.test(selector);
}

function extractPseudoFrom(selector) {
  var list = [];
  var character;
  var buffer = [];
  var level = Level.ROOT;
  var roundBracketLevel = 0;
  var isQuoted;
  var isEscaped;
  var isPseudo = false;
  var isRelation;
  var wasColon = false;
  var index;
  var len;

  for (index = 0, len = selector.length; index < len; index++) {
    character = selector[index];

    isRelation = !isEscaped && RELATION_PATTERN$1.test(character);
    isQuoted = level == Level.DOUBLE_QUOTE || level == Level.SINGLE_QUOTE;

    if (isEscaped) {
      buffer.push(character);
    } else if (character == marker.DOUBLE_QUOTE && level == Level.ROOT) {
      buffer.push(character);
      level = Level.DOUBLE_QUOTE;
    } else if (character == marker.DOUBLE_QUOTE && level == Level.DOUBLE_QUOTE) {
      buffer.push(character);
      level = Level.ROOT;
    } else if (character == marker.SINGLE_QUOTE && level == Level.ROOT) {
      buffer.push(character);
      level = Level.SINGLE_QUOTE;
    } else if (character == marker.SINGLE_QUOTE && level == Level.SINGLE_QUOTE) {
      buffer.push(character);
      level = Level.ROOT;
    } else if (isQuoted) {
      buffer.push(character);
    } else if (character == marker.OPEN_ROUND_BRACKET) {
      buffer.push(character);
      roundBracketLevel++;
    } else if (character == marker.CLOSE_ROUND_BRACKET && roundBracketLevel == 1 && isPseudo) {
      buffer.push(character);
      list.push(buffer.join(''));
      roundBracketLevel--;
      buffer = [];
      isPseudo = false;
    } else if (character == marker.CLOSE_ROUND_BRACKET) {
      buffer.push(character);
      roundBracketLevel--;
    } else if (character == marker.COLON && roundBracketLevel === 0 && isPseudo && !wasColon) {
      list.push(buffer.join(''));
      buffer = [];
      buffer.push(character);
    } else if (character == marker.COLON && roundBracketLevel === 0 && !wasColon) {
      buffer = [];
      buffer.push(character);
      isPseudo = true;
    } else if (character == marker.SPACE && roundBracketLevel === 0 && isPseudo) {
      list.push(buffer.join(''));
      buffer = [];
      isPseudo = false;
    } else if (isRelation && roundBracketLevel === 0 && isPseudo) {
      list.push(buffer.join(''));
      buffer = [];
      isPseudo = false;
    } else {
      buffer.push(character);
    }

    isEscaped = character == marker.BACK_SLASH;
    wasColon = character == marker.COLON;
  }

  if (buffer.length > 0 && isPseudo) {
    list.push(buffer.join(''));
  }

  return list;
}

function areMergeable(selector, matches, mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging) {
  return areAllowed(matches, mergeablePseudoClasses, mergeablePseudoElements) &&
    needArguments(matches) &&
    (matches.length < 2 || !someIncorrectlyChained(selector, matches)) &&
    (matches.length < 2 || multiplePseudoMerging && allMixable(matches));
}

function areAllowed(matches, mergeablePseudoClasses, mergeablePseudoElements) {
  var match;
  var name;
  var i, l;

  for (i = 0, l = matches.length; i < l; i++) {
    match = matches[i];
    name = match.indexOf(marker.OPEN_ROUND_BRACKET) > -1 ?
      match.substring(0, match.indexOf(marker.OPEN_ROUND_BRACKET)) :
      match;

    if (mergeablePseudoClasses.indexOf(name) === -1 && mergeablePseudoElements.indexOf(name) === -1) {
      return false;
    }
  }

  return true;
}

function needArguments(matches) {
  var match;
  var name;
  var bracketOpensAt;
  var hasArguments;
  var i, l;

  for (i = 0, l = matches.length; i < l; i++) {
    match = matches[i];

    bracketOpensAt = match.indexOf(marker.OPEN_ROUND_BRACKET);
    hasArguments = bracketOpensAt > -1;
    name = hasArguments ?
      match.substring(0, bracketOpensAt) :
      match;

    if (hasArguments && PSEUDO_CLASSES_WITH_ARGUMENTS.indexOf(name) == -1) {
      return false;
    }

    if (!hasArguments && PSEUDO_CLASSES_WITH_ARGUMENTS.indexOf(name) > -1) {
      return false;
    }
  }

  return true;
}

function someIncorrectlyChained(selector, matches) {
  var positionInSelector = 0;
  var match;
  var matchAt;
  var nextMatch;
  var nextMatchAt;
  var name;
  var nextName;
  var areChained;
  var i, l;

  for (i = 0, l = matches.length; i < l; i++) {
    match = matches[i];
    nextMatch = matches[i + 1];

    if (!nextMatch) {
      break;
    }

    matchAt = selector.indexOf(match, positionInSelector);
    nextMatchAt = selector.indexOf(match, matchAt + 1);
    positionInSelector = nextMatchAt;
    areChained = matchAt + match.length == nextMatchAt;

    if (areChained) {
      name = match.indexOf(marker.OPEN_ROUND_BRACKET) > -1 ?
        match.substring(0, match.indexOf(marker.OPEN_ROUND_BRACKET)) :
        match;
      nextName = nextMatch.indexOf(marker.OPEN_ROUND_BRACKET) > -1 ?
        nextMatch.substring(0, nextMatch.indexOf(marker.OPEN_ROUND_BRACKET)) :
        nextMatch;

      if (name != NOT_PSEUDO || nextName != NOT_PSEUDO) {
        return true;
      }
    }
  }

  return false;
}

function allMixable(matches) {
  var unmixableMatches = 0;
  var match;
  var i, l;

  for (i = 0, l = matches.length; i < l; i++) {
    match = matches[i];

    if (isPseudoElement(match)) {
      unmixableMatches += UNMIXABLE_PSEUDO_ELEMENTS.indexOf(match) > -1 ? 1 : 0;
    } else {
      unmixableMatches += UNMIXABLE_PSEUDO_CLASSES.indexOf(match) > -1 ? 1 : 0;
    }

    if (unmixableMatches > 1) {
      return false;
    }
  }

  return true;
}

function isPseudoElement(pseudo) {
  return DOUBLE_COLON_PATTERN.test(pseudo);
}

var isMergeable_1 = isMergeable;

function everyValuesPair(fn, left, right) {
  var leftSize = left.value.length;
  var rightSize = right.value.length;
  var total = Math.max(leftSize, rightSize);
  var lowerBound = Math.min(leftSize, rightSize) - 1;
  var leftValue;
  var rightValue;
  var position;

  for (position = 0; position < total; position++) {
    leftValue = left.value[position] && left.value[position][1] || leftValue;
    rightValue = right.value[position] && right.value[position][1] || rightValue;

    if (leftValue == marker.COMMA || rightValue == marker.COMMA) {
      continue;
    }

    if (!fn(leftValue, rightValue, position, position <= lowerBound)) {
      return false;
    }
  }

  return true;
}

var everyValuesPair_1 = everyValuesPair;

function hasInherit(property) {
  for (var i = property.value.length - 1; i >= 0; i--) {
    if (property.value[i][1] == 'inherit')
      return true;
  }

  return false;
}

var hasInherit_1 = hasInherit;

function InvalidPropertyError(message) {
  this.name = 'InvalidPropertyError';
  this.message = message;
  this.stack = (new Error()).stack;
}

InvalidPropertyError.prototype = Object.create(Error.prototype);
InvalidPropertyError.prototype.constructor = InvalidPropertyError;

var invalidPropertyError = InvalidPropertyError;

var wrapSingle$1 = wrapForOptimizing.single;






function _anyIsInherit(values) {
  var i, l;

  for (i = 0, l = values.length; i < l; i++) {
    if (values[i][1] == 'inherit') {
      return true;
    }
  }

  return false;
}

function _colorFilter(validator) {
  return function (value) {
    return value[1] == 'invert' || validator.isColor(value[1]) || validator.isPrefixed(value[1]);
  };
}

function _styleFilter(validator) {
  return function (value) {
    return value[1] != 'inherit' && validator.isStyleKeyword(value[1]) && !validator.isColorFunction(value[1]);
  };
}

function _wrapDefault(name, property, compactable) {
  var descriptor = compactable[name];
  if (descriptor.doubleValues && descriptor.defaultValue.length == 2) {
    return wrapSingle$1([
      token.PROPERTY,
      [token.PROPERTY_NAME, name],
      [token.PROPERTY_VALUE, descriptor.defaultValue[0]],
      [token.PROPERTY_VALUE, descriptor.defaultValue[1]]
    ]);
  } else if (descriptor.doubleValues && descriptor.defaultValue.length == 1) {
    return wrapSingle$1([
      token.PROPERTY,
      [token.PROPERTY_NAME, name],
      [token.PROPERTY_VALUE, descriptor.defaultValue[0]]
    ]);
  } else {
    return wrapSingle$1([
      token.PROPERTY,
      [token.PROPERTY_NAME, name],
      [token.PROPERTY_VALUE, descriptor.defaultValue]
    ]);
  }
}

function _widthFilter(validator) {
  return function (value) {
    return value[1] != 'inherit' &&
      (validator.isWidth(value[1]) || validator.isUnit(value[1]) && !validator.isDynamicUnit(value[1])) &&
      !validator.isStyleKeyword(value[1]) &&
      !validator.isColorFunction(value[1]);
  };
}

function animation(property, compactable, validator) {
  var duration = _wrapDefault(property.name + '-duration', property, compactable);
  var timing = _wrapDefault(property.name + '-timing-function', property, compactable);
  var delay = _wrapDefault(property.name + '-delay', property, compactable);
  var iteration = _wrapDefault(property.name + '-iteration-count', property, compactable);
  var direction = _wrapDefault(property.name + '-direction', property, compactable);
  var fill = _wrapDefault(property.name + '-fill-mode', property, compactable);
  var play = _wrapDefault(property.name + '-play-state', property, compactable);
  var name = _wrapDefault(property.name + '-name', property, compactable);
  var components = [duration, timing, delay, iteration, direction, fill, play, name];
  var values = property.value;
  var value;
  var durationSet = false;
  var timingSet = false;
  var delaySet = false;
  var iterationSet = false;
  var directionSet = false;
  var fillSet = false;
  var playSet = false;
  var nameSet = false;
  var i;
  var l;

  if (property.value.length == 1 && property.value[0][1] == 'inherit') {
    duration.value = timing.value = delay.value = iteration.value = direction.value = fill.value = play.value = name.value = property.value;
    return components;
  }

  if (values.length > 1 && _anyIsInherit(values)) {
    throw new invalidPropertyError('Invalid animation values at ' + formatPosition_1(values[0][2][0]) + '. Ignoring.');
  }

  for (i = 0, l = values.length; i < l; i++) {
    value = values[i];

    if (validator.isTime(value[1]) && !durationSet) {
      duration.value = [value];
      durationSet = true;
    } else if (validator.isTime(value[1]) && !delaySet) {
      delay.value = [value];
      delaySet = true;
    } else if ((validator.isGlobal(value[1]) || validator.isTimingFunction(value[1])) && !timingSet) {
      timing.value = [value];
      timingSet = true;
    } else if ((validator.isAnimationIterationCountKeyword(value[1]) || validator.isPositiveNumber(value[1])) && !iterationSet) {
      iteration.value = [value];
      iterationSet = true;
    } else if (validator.isAnimationDirectionKeyword(value[1]) && !directionSet) {
      direction.value = [value];
      directionSet = true;
    } else if (validator.isAnimationFillModeKeyword(value[1]) && !fillSet) {
      fill.value = [value];
      fillSet = true;
    } else if (validator.isAnimationPlayStateKeyword(value[1]) && !playSet) {
      play.value = [value];
      playSet = true;
    } else if ((validator.isAnimationNameKeyword(value[1]) || validator.isIdentifier(value[1])) && !nameSet) {
      name.value = [value];
      nameSet = true;
    } else {
      throw new invalidPropertyError('Invalid animation value at ' + formatPosition_1(value[2][0]) + '. Ignoring.');
    }
  }

  return components;
}

function background(property, compactable, validator) {
  var image = _wrapDefault('background-image', property, compactable);
  var position = _wrapDefault('background-position', property, compactable);
  var size = _wrapDefault('background-size', property, compactable);
  var repeat = _wrapDefault('background-repeat', property, compactable);
  var attachment = _wrapDefault('background-attachment', property, compactable);
  var origin = _wrapDefault('background-origin', property, compactable);
  var clip = _wrapDefault('background-clip', property, compactable);
  var color = _wrapDefault('background-color', property, compactable);
  var components = [image, position, size, repeat, attachment, origin, clip, color];
  var values = property.value;

  var positionSet = false;
  var clipSet = false;
  var originSet = false;
  var repeatSet = false;

  var anyValueSet = false;

  if (property.value.length == 1 && property.value[0][1] == 'inherit') {
    // NOTE: 'inherit' is not a valid value for background-attachment
    color.value = image.value =  repeat.value = position.value = size.value = origin.value = clip.value = property.value;
    return components;
  }

  if (property.value.length == 1 && property.value[0][1] == '0 0') {
    return components;
  }

  for (var i = values.length - 1; i >= 0; i--) {
    var value = values[i];

    if (validator.isBackgroundAttachmentKeyword(value[1])) {
      attachment.value = [value];
      anyValueSet = true;
    } else if (validator.isBackgroundClipKeyword(value[1]) || validator.isBackgroundOriginKeyword(value[1])) {
      if (clipSet) {
        origin.value = [value];
        originSet = true;
      } else {
        clip.value = [value];
        clipSet = true;
      }
      anyValueSet = true;
    } else if (validator.isBackgroundRepeatKeyword(value[1])) {
      if (repeatSet) {
        repeat.value.unshift(value);
      } else {
        repeat.value = [value];
        repeatSet = true;
      }
      anyValueSet = true;
    } else if (validator.isBackgroundPositionKeyword(value[1]) || validator.isBackgroundSizeKeyword(value[1]) || validator.isUnit(value[1]) || validator.isDynamicUnit(value[1])) {
      if (i > 0) {
        var previousValue = values[i - 1];

        if (previousValue[1] == marker.FORWARD_SLASH) {
          size.value = [value];
        } else if (i > 1 && values[i - 2][1] == marker.FORWARD_SLASH) {
          size.value = [previousValue, value];
          i -= 2;
        } else {
          if (!positionSet)
            position.value = [];

          position.value.unshift(value);
          positionSet = true;
        }
      } else {
        if (!positionSet)
          position.value = [];

        position.value.unshift(value);
        positionSet = true;
      }
      anyValueSet = true;
    } else if ((color.value[0][1] == compactable[color.name].defaultValue || color.value[0][1] == 'none') && (validator.isColor(value[1]) || validator.isPrefixed(value[1]))) {
      color.value = [value];
      anyValueSet = true;
    } else if (validator.isUrl(value[1]) || validator.isFunction(value[1])) {
      image.value = [value];
      anyValueSet = true;
    }
  }

  if (clipSet && !originSet)
    origin.value = clip.value.slice(0);

  if (!anyValueSet) {
    throw new invalidPropertyError('Invalid background value at ' + formatPosition_1(values[0][2][0]) + '. Ignoring.');
  }

  return components;
}

function borderRadius(property, compactable) {
  var values = property.value;
  var splitAt = -1;

  for (var i = 0, l = values.length; i < l; i++) {
    if (values[i][1] == marker.FORWARD_SLASH) {
      splitAt = i;
      break;
    }
  }

  if (splitAt === 0 || splitAt === values.length - 1) {
    throw new invalidPropertyError('Invalid border-radius value at ' + formatPosition_1(values[0][2][0]) + '. Ignoring.');
  }

  var target = _wrapDefault(property.name, property, compactable);
  target.value = splitAt > -1 ?
    values.slice(0, splitAt) :
    values.slice(0);
  target.components = fourValues(target, compactable);

  var remainder = _wrapDefault(property.name, property, compactable);
  remainder.value = splitAt > -1 ?
    values.slice(splitAt + 1) :
    values.slice(0);
  remainder.components = fourValues(remainder, compactable);

  for (var j = 0; j < 4; j++) {
    target.components[j].multiplex = true;
    target.components[j].value = target.components[j].value.concat(remainder.components[j].value);
  }

  return target.components;
}

function font(property, compactable, validator) {
  var style = _wrapDefault('font-style', property, compactable);
  var variant = _wrapDefault('font-variant', property, compactable);
  var weight = _wrapDefault('font-weight', property, compactable);
  var stretch = _wrapDefault('font-stretch', property, compactable);
  var size = _wrapDefault('font-size', property, compactable);
  var height = _wrapDefault('line-height', property, compactable);
  var family = _wrapDefault('font-family', property, compactable);
  var components = [style, variant, weight, stretch, size, height, family];
  var values = property.value;
  var fuzzyMatched = 4; // style, variant, weight, and stretch
  var index = 0;
  var isStretchSet = false;
  var isStretchValid;
  var isStyleSet = false;
  var isStyleValid;
  var isVariantSet = false;
  var isVariantValid;
  var isWeightSet = false;
  var isWeightValid;
  var isSizeSet = false;
  var appendableFamilyName = false;

  if (!values[index]) {
    throw new invalidPropertyError('Missing font values at ' + formatPosition_1(property.all[property.position][1][2][0]) + '. Ignoring.');
  }

  if (values.length == 1 && values[0][1] == 'inherit') {
    style.value = variant.value = weight.value = stretch.value = size.value = height.value = family.value = values;
    return components;
  }

  if (values.length == 1 && (validator.isFontKeyword(values[0][1]) || validator.isGlobal(values[0][1]) || validator.isPrefixed(values[0][1]))) {
    values[0][1] = marker.INTERNAL + values[0][1];
    style.value = variant.value = weight.value = stretch.value = size.value = height.value = family.value = values;
    return components;
  }

  if (values.length < 2 || !_anyIsFontSize(values, validator) || !_anyIsFontFamily(values, validator)) {
    throw new invalidPropertyError('Invalid font values at ' + formatPosition_1(property.all[property.position][1][2][0]) + '. Ignoring.');
  }

  if (values.length > 1 && _anyIsInherit(values)) {
    throw new invalidPropertyError('Invalid font values at ' + formatPosition_1(values[0][2][0]) + '. Ignoring.');
  }

  // fuzzy match style, variant, weight, and stretch on first elements
  while (index < fuzzyMatched) {
    isStretchValid = validator.isFontStretchKeyword(values[index][1]) || validator.isGlobal(values[index][1]);
    isStyleValid = validator.isFontStyleKeyword(values[index][1]) || validator.isGlobal(values[index][1]);
    isVariantValid = validator.isFontVariantKeyword(values[index][1]) || validator.isGlobal(values[index][1]);
    isWeightValid = validator.isFontWeightKeyword(values[index][1]) || validator.isGlobal(values[index][1]);

    if (isStyleValid && !isStyleSet) {
      style.value = [values[index]];
      isStyleSet = true;
    } else if (isVariantValid && !isVariantSet) {
      variant.value = [values[index]];
      isVariantSet = true;
    } else if (isWeightValid && !isWeightSet) {
      weight.value = [values[index]];
      isWeightSet = true;
    } else if (isStretchValid && !isStretchSet) {
      stretch.value = [values[index]];
      isStretchSet = true;
    } else if (isStyleValid && isStyleSet || isVariantValid && isVariantSet || isWeightValid && isWeightSet || isStretchValid && isStretchSet) {
      throw new invalidPropertyError('Invalid font style / variant / weight / stretch value at ' + formatPosition_1(values[0][2][0]) + '. Ignoring.');
    } else {
      break;
    }

    index++;
  }

  // now comes font-size ...
  if (validator.isFontSizeKeyword(values[index][1]) || validator.isUnit(values[index][1]) && !validator.isDynamicUnit(values[index][1])) {
    size.value = [values[index]];
    isSizeSet = true;
    index++;
  } else {
    throw new invalidPropertyError('Missing font size at ' + formatPosition_1(values[0][2][0]) + '. Ignoring.');
  }

  if (!values[index]) {
    throw new invalidPropertyError('Missing font family at ' + formatPosition_1(values[0][2][0]) + '. Ignoring.');
  }

  // ... and perhaps line-height
  if (isSizeSet && values[index] && values[index][1] == marker.FORWARD_SLASH && values[index + 1] && (validator.isLineHeightKeyword(values[index + 1][1]) || validator.isUnit(values[index + 1][1]) || validator.isNumber(values[index + 1][1]))) {
    height.value = [values[index + 1]];
    index++;
    index++;
  }

  // ... and whatever comes next is font-family
  family.value = [];

  while (values[index]) {
    if (values[index][1] == marker.COMMA) {
      appendableFamilyName = false;
    } else {
      if (appendableFamilyName) {
        family.value[family.value.length - 1][1] += marker.SPACE + values[index][1];
      } else {
        family.value.push(values[index]);
      }

      appendableFamilyName = true;
    }

    index++;
  }

  if (family.value.length === 0) {
    throw new invalidPropertyError('Missing font family at ' + formatPosition_1(values[0][2][0]) + '. Ignoring.');
  }

  return components;
}

function _anyIsFontSize(values, validator) {
  var value;
  var i, l;

  for (i = 0, l = values.length; i < l; i++) {
    value = values[i];

    if (validator.isFontSizeKeyword(value[1]) || validator.isUnit(value[1]) && !validator.isDynamicUnit(value[1]) || validator.isFunction(value[1])) {
      return true;
    }
  }

  return false;
}

function _anyIsFontFamily(values, validator) {
  var value;
  var i, l;

  for (i = 0, l = values.length; i < l; i++) {
    value = values[i];

    if (validator.isIdentifier(value[1])) {
      return true;
    }
  }

  return false;
}

function fourValues(property, compactable) {
  var componentNames = compactable[property.name].components;
  var components = [];
  var value = property.value;

  if (value.length < 1)
    return [];

  if (value.length < 2)
    value[1] = value[0].slice(0);
  if (value.length < 3)
    value[2] = value[0].slice(0);
  if (value.length < 4)
    value[3] = value[1].slice(0);

  for (var i = componentNames.length - 1; i >= 0; i--) {
    var component = wrapSingle$1([
      token.PROPERTY,
      [token.PROPERTY_NAME, componentNames[i]]
    ]);
    component.value = [value[i]];
    components.unshift(component);
  }

  return components;
}

function multiplex(splitWith) {
  return function (property, compactable, validator) {
    var splitsAt = [];
    var values = property.value;
    var i, j, l, m;

    // find split commas
    for (i = 0, l = values.length; i < l; i++) {
      if (values[i][1] == ',')
        splitsAt.push(i);
    }

    if (splitsAt.length === 0)
      return splitWith(property, compactable, validator);

    var splitComponents = [];

    // split over commas, and into components
    for (i = 0, l = splitsAt.length; i <= l; i++) {
      var from = i === 0 ? 0 : splitsAt[i - 1] + 1;
      var to = i < l ? splitsAt[i] : values.length;

      var _property = _wrapDefault(property.name, property, compactable);
      _property.value = values.slice(from, to);

      splitComponents.push(splitWith(_property, compactable, validator));
    }

    var components = splitComponents[0];

    // group component values from each split
    for (i = 0, l = components.length; i < l; i++) {
      components[i].multiplex = true;

      for (j = 1, m = splitComponents.length; j < m; j++) {
        components[i].value.push([token.PROPERTY_VALUE, marker.COMMA]);
        Array.prototype.push.apply(components[i].value, splitComponents[j][i].value);
      }
    }

    return components;
  };
}

function listStyle(property, compactable, validator) {
  var type = _wrapDefault('list-style-type', property, compactable);
  var position = _wrapDefault('list-style-position', property, compactable);
  var image = _wrapDefault('list-style-image', property, compactable);
  var components = [type, position, image];

  if (property.value.length == 1 && property.value[0][1] == 'inherit') {
    type.value = position.value = image.value = [property.value[0]];
    return components;
  }

  var values = property.value.slice(0);
  var total = values.length;
  var index = 0;

  // `image` first...
  for (index = 0, total = values.length; index < total; index++) {
    if (validator.isUrl(values[index][1]) || values[index][1] == '0') {
      image.value = [values[index]];
      values.splice(index, 1);
      break;
    }
  }

  // ... then `position`
  for (index = 0, total = values.length; index < total; index++) {
    if (validator.isListStylePositionKeyword(values[index][1])) {
      position.value = [values[index]];
      values.splice(index, 1);
      break;
    }
  }

  // ... and what's left is a `type`
  if (values.length > 0 && (validator.isListStyleTypeKeyword(values[0][1]) || validator.isIdentifier(values[0][1]))) {
    type.value = [values[0]];
  }

  return components;
}

function transition(property, compactable, validator) {
  var prop = _wrapDefault(property.name + '-property', property, compactable);
  var duration = _wrapDefault(property.name + '-duration', property, compactable);
  var timing = _wrapDefault(property.name + '-timing-function', property, compactable);
  var delay = _wrapDefault(property.name + '-delay', property, compactable);
  var components = [prop, duration, timing, delay];
  var values = property.value;
  var value;
  var durationSet = false;
  var delaySet = false;
  var propSet = false;
  var timingSet = false;
  var i;
  var l;

  if (property.value.length == 1 && property.value[0][1] == 'inherit') {
    prop.value = duration.value = timing.value = delay.value = property.value;
    return components;
  }

  if (values.length > 1 && _anyIsInherit(values)) {
    throw new invalidPropertyError('Invalid animation values at ' + formatPosition_1(values[0][2][0]) + '. Ignoring.');
  }

  for (i = 0, l = values.length; i < l; i++) {
    value = values[i];

    if (validator.isTime(value[1]) && !durationSet) {
      duration.value = [value];
      durationSet = true;
    } else if (validator.isTime(value[1]) && !delaySet) {
      delay.value = [value];
      delaySet = true;
    } else if ((validator.isGlobal(value[1]) || validator.isTimingFunction(value[1])) && !timingSet) {
      timing.value = [value];
      timingSet = true;
    } else if (validator.isIdentifier(value[1]) && !propSet) {
      prop.value = [value];
      propSet = true;
    } else {
      throw new invalidPropertyError('Invalid animation value at ' + formatPosition_1(value[2][0]) + '. Ignoring.');
    }
  }

  return components;
}

function widthStyleColor(property, compactable, validator) {
  var descriptor = compactable[property.name];
  var components = [
    _wrapDefault(descriptor.components[0], property, compactable),
    _wrapDefault(descriptor.components[1], property, compactable),
    _wrapDefault(descriptor.components[2], property, compactable)
  ];
  var color, style, width;

  for (var i = 0; i < 3; i++) {
    var component = components[i];

    if (component.name.indexOf('color') > 0)
      color = component;
    else if (component.name.indexOf('style') > 0)
      style = component;
    else
      width = component;
  }

  if ((property.value.length == 1 && property.value[0][1] == 'inherit') ||
      (property.value.length == 3 && property.value[0][1] == 'inherit' && property.value[1][1] == 'inherit' && property.value[2][1] == 'inherit')) {
    color.value = style.value = width.value = [property.value[0]];
    return components;
  }

  var values = property.value.slice(0);
  var match, matches;

  // NOTE: usually users don't follow the required order of parts in this shorthand,
  // so we'll try to parse it caring as little about order as possible

  if (values.length > 0) {
    matches = values.filter(_widthFilter(validator));
    match = matches.length > 1 && (matches[0][1] == 'none' || matches[0][1] == 'auto') ? matches[1] : matches[0];
    if (match) {
      width.value = [match];
      values.splice(values.indexOf(match), 1);
    }
  }

  if (values.length > 0) {
    match = values.filter(_styleFilter(validator))[0];
    if (match) {
      style.value = [match];
      values.splice(values.indexOf(match), 1);
    }
  }

  if (values.length > 0) {
    match = values.filter(_colorFilter(validator))[0];
    if (match) {
      color.value = [match];
      values.splice(values.indexOf(match), 1);
    }
  }

  return components;
}

var breakUp = {
  animation: animation,
  background: background,
  border: widthStyleColor,
  borderRadius: borderRadius,
  font: font,
  fourValues: fourValues,
  listStyle: listStyle,
  multiplex: multiplex,
  outline: widthStyleColor,
  transition: transition
};

var VENDOR_PREFIX_PATTERN = /(?:^|\W)(\-\w+\-)/g;

function unique(value) {
  var prefixes = [];
  var match;

  while ((match = VENDOR_PREFIX_PATTERN.exec(value)) !== null) {
    if (prefixes.indexOf(match[0]) == -1) {
      prefixes.push(match[0]);
    }
  }

  return prefixes;
}

function same(value1, value2) {
  return unique(value1).sort().join(',') == unique(value2).sort().join(',');
}

var vendorPrefixes = {
  unique: unique,
  same: same
};

var sameVendorPrefixes = vendorPrefixes.same;

function understandable(validator, value1, value2, _position, isPaired) {
  if (!sameVendorPrefixes(value1, value2)) {
    return false;
  }

  if (isPaired && validator.isVariable(value1) !== validator.isVariable(value2)) {
    return false;
  }

  return true;
}

var understandable_1 = understandable;

function animationIterationCount(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !(validator.isAnimationIterationCountKeyword(value2) || validator.isPositiveNumber(value2))) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  }

  return validator.isAnimationIterationCountKeyword(value2) || validator.isPositiveNumber(value2);
}

function animationName(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !(validator.isAnimationNameKeyword(value2) || validator.isIdentifier(value2))) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  }

  return validator.isAnimationNameKeyword(value2) || validator.isIdentifier(value2);
}

function areSameFunction(validator, value1, value2) {
  if (!validator.isFunction(value1) || !validator.isFunction(value2)) {
    return false;
  }

  var function1Name = value1.substring(0, value1.indexOf('('));
  var function2Name = value2.substring(0, value2.indexOf('('));

  return function1Name === function2Name;
}

function backgroundPosition(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !(validator.isBackgroundPositionKeyword(value2) || validator.isGlobal(value2))) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  } else if (validator.isBackgroundPositionKeyword(value2) || validator.isGlobal(value2)) {
    return true;
  }

  return unit(validator, value1, value2);
}

function backgroundSize(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !(validator.isBackgroundSizeKeyword(value2) || validator.isGlobal(value2))) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  } else if (validator.isBackgroundSizeKeyword(value2) || validator.isGlobal(value2)) {
    return true;
  }

  return unit(validator, value1, value2);
}

function color(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !validator.isColor(value2)) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  } else if (!validator.colorOpacity && (validator.isRgbColor(value1) || validator.isHslColor(value1))) {
    return false;
  } else if (!validator.colorOpacity && (validator.isRgbColor(value2) || validator.isHslColor(value2))) {
    return false;
  } else if (validator.isColor(value1) && validator.isColor(value2)) {
    return true;
  }

  return sameFunctionOrValue(validator, value1, value2);
}

function components(overrideCheckers) {
  return function (validator, value1, value2, position) {
    return overrideCheckers[position](validator, value1, value2);
  };
}

function fontFamily(validator, value1, value2) {
  return understandable_1(validator, value1, value2, 0, true);
}

function image(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !validator.isImage(value2)) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  } else if (validator.isImage(value2)) {
    return true;
  } else if (validator.isImage(value1)) {
    return false;
  }

  return sameFunctionOrValue(validator, value1, value2);
}

function keyword(propertyName) {
  return function(validator, value1, value2) {
    if (!understandable_1(validator, value1, value2, 0, true) && !validator.isKeyword(propertyName)(value2)) {
      return false;
    } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
      return true;
    }

    return validator.isKeyword(propertyName)(value2);
  };
}

function keywordWithGlobal(propertyName) {
  return function(validator, value1, value2) {
    if (!understandable_1(validator, value1, value2, 0, true) && !(validator.isKeyword(propertyName)(value2) || validator.isGlobal(value2))) {
      return false;
    } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
      return true;
    }

    return validator.isKeyword(propertyName)(value2) || validator.isGlobal(value2);
  };
}

function propertyName(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !validator.isIdentifier(value2)) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  }

  return validator.isIdentifier(value2);
}

function sameFunctionOrValue(validator, value1, value2) {
  return areSameFunction(validator, value1, value2) ?
    true :
    value1 === value2;
}

function textShadow(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !(validator.isUnit(value2) || validator.isColor(value2) || validator.isGlobal(value2))) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  }

  return validator.isUnit(value2) || validator.isColor(value2) || validator.isGlobal(value2);
}

function time(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !validator.isTime(value2)) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  } else if (validator.isTime(value1) && !validator.isTime(value2)) {
    return false;
  } else if (validator.isTime(value2)) {
    return true;
  } else if (validator.isTime(value1)) {
    return false;
  } else if (validator.isFunction(value1) && !validator.isPrefixed(value1) && validator.isFunction(value2) && !validator.isPrefixed(value2)) {
    return true;
  }

  return sameFunctionOrValue(validator, value1, value2);
}

function timingFunction(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !(validator.isTimingFunction(value2) || validator.isGlobal(value2))) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  }

  return validator.isTimingFunction(value2) || validator.isGlobal(value2);
}

function unit(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !validator.isUnit(value2)) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  } else if (validator.isUnit(value1) && !validator.isUnit(value2)) {
    return false;
  } else if (validator.isUnit(value2)) {
    return true;
  } else if (validator.isUnit(value1)) {
    return false;
  } else if (validator.isFunction(value1) && !validator.isPrefixed(value1) && validator.isFunction(value2) && !validator.isPrefixed(value2)) {
    return true;
  }

  return sameFunctionOrValue(validator, value1, value2);
}

function unitOrKeywordWithGlobal(propertyName) {
  var byKeyword = keywordWithGlobal(propertyName);

  return function(validator, value1, value2) {
    return unit(validator, value1, value2) || byKeyword(validator, value1, value2);
  };
}

function unitOrNumber(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !(validator.isUnit(value2) || validator.isNumber(value2))) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  } else if ((validator.isUnit(value1) || validator.isNumber(value1)) && !(validator.isUnit(value2) || validator.isNumber(value2))) {
    return false;
  } else if (validator.isUnit(value2) || validator.isNumber(value2)) {
    return true;
  } else if (validator.isUnit(value1) || validator.isNumber(value1)) {
    return false;
  } else if (validator.isFunction(value1) && !validator.isPrefixed(value1) && validator.isFunction(value2) && !validator.isPrefixed(value2)) {
    return true;
  }

  return sameFunctionOrValue(validator, value1, value2);
}

function zIndex(validator, value1, value2) {
  if (!understandable_1(validator, value1, value2, 0, true) && !validator.isZIndex(value2)) {
    return false;
  } else if (validator.isVariable(value1) && validator.isVariable(value2)) {
    return true;
  }

  return validator.isZIndex(value2);
}

var canOverride = {
  generic: {
    color: color,
    components: components,
    image: image,
    propertyName: propertyName,
    time: time,
    timingFunction: timingFunction,
    unit: unit,
    unitOrNumber: unitOrNumber
  },
  property: {
    animationDirection: keywordWithGlobal('animation-direction'),
    animationFillMode: keyword('animation-fill-mode'),
    animationIterationCount: animationIterationCount,
    animationName: animationName,
    animationPlayState: keywordWithGlobal('animation-play-state'),
    backgroundAttachment: keyword('background-attachment'),
    backgroundClip: keywordWithGlobal('background-clip'),
    backgroundOrigin: keyword('background-origin'),
    backgroundPosition: backgroundPosition,
    backgroundRepeat: keyword('background-repeat'),
    backgroundSize: backgroundSize,
    bottom: unitOrKeywordWithGlobal('bottom'),
    borderCollapse: keyword('border-collapse'),
    borderStyle: keywordWithGlobal('*-style'),
    clear: keywordWithGlobal('clear'),
    cursor: keywordWithGlobal('cursor'),
    display: keywordWithGlobal('display'),
    float: keywordWithGlobal('float'),
    left: unitOrKeywordWithGlobal('left'),
    fontFamily: fontFamily,
    fontStretch: keywordWithGlobal('font-stretch'),
    fontStyle: keywordWithGlobal('font-style'),
    fontVariant: keywordWithGlobal('font-variant'),
    fontWeight: keywordWithGlobal('font-weight'),
    listStyleType: keywordWithGlobal('list-style-type'),
    listStylePosition: keywordWithGlobal('list-style-position'),
    outlineStyle: keywordWithGlobal('*-style'),
    overflow: keywordWithGlobal('overflow'),
    position: keywordWithGlobal('position'),
    right: unitOrKeywordWithGlobal('right'),
    textAlign: keywordWithGlobal('text-align'),
    textDecoration: keywordWithGlobal('text-decoration'),
    textOverflow: keywordWithGlobal('text-overflow'),
    textShadow: textShadow,
    top: unitOrKeywordWithGlobal('top'),
    transform: sameFunctionOrValue,
    verticalAlign: unitOrKeywordWithGlobal('vertical-align'),
    visibility: keywordWithGlobal('visibility'),
    whiteSpace: keywordWithGlobal('white-space'),
    zIndex: zIndex
  }
};

var wrapSingle$2 = wrapForOptimizing.single;



function deep(property) {
  var cloned = shallow(property);
  for (var i = property.components.length - 1; i >= 0; i--) {
    var component = shallow(property.components[i]);
    component.value = property.components[i].value.slice(0);
    cloned.components.unshift(component);
  }

  cloned.dirty = true;
  cloned.value = property.value.slice(0);

  return cloned;
}

function shallow(property) {
  var cloned = wrapSingle$2([
    token.PROPERTY,
    [token.PROPERTY_NAME, property.name]
  ]);
  cloned.important = property.important;
  cloned.hack = property.hack;
  cloned.unused = false;
  return cloned;
}

var clone = {
  deep: deep,
  shallow: shallow
};

var shallowClone = clone.shallow;




function isInheritOnly(values) {
  for (var i = 0, l = values.length; i < l; i++) {
    var value = values[i][1];

    if (value != 'inherit' && value != marker.COMMA && value != marker.FORWARD_SLASH)
      return false;
  }

  return true;
}

function background$1(property, compactable, lastInMultiplex) {
  var components = property.components;
  var restored = [];
  var needsOne, needsBoth;

  function restoreValue(component) {
    Array.prototype.unshift.apply(restored, component.value);
  }

  function isDefaultValue(component) {
    var descriptor = compactable[component.name];

    if (descriptor.doubleValues && descriptor.defaultValue.length == 1) {
      return component.value[0][1] == descriptor.defaultValue[0] && (component.value[1] ? component.value[1][1] == descriptor.defaultValue[0] : true);
    } else if (descriptor.doubleValues && descriptor.defaultValue.length != 1) {
      return component.value[0][1] == descriptor.defaultValue[0] && (component.value[1] ? component.value[1][1] : component.value[0][1]) == descriptor.defaultValue[1];
    } else {
      return component.value[0][1] == descriptor.defaultValue;
    }
  }

  for (var i = components.length - 1; i >= 0; i--) {
    var component = components[i];
    var isDefault = isDefaultValue(component);

    if (component.name == 'background-clip') {
      var originComponent = components[i - 1];
      var isOriginDefault = isDefaultValue(originComponent);

      needsOne = component.value[0][1] == originComponent.value[0][1];

      needsBoth = !needsOne && (
        (isOriginDefault && !isDefault) ||
        (!isOriginDefault && !isDefault) ||
        (!isOriginDefault && isDefault && component.value[0][1] != originComponent.value[0][1]));

      if (needsOne) {
        restoreValue(originComponent);
      } else if (needsBoth) {
        restoreValue(component);
        restoreValue(originComponent);
      }

      i--;
    } else if (component.name == 'background-size') {
      var positionComponent = components[i - 1];
      var isPositionDefault = isDefaultValue(positionComponent);

      needsOne = !isPositionDefault && isDefault;

      needsBoth = !needsOne &&
        (isPositionDefault && !isDefault || !isPositionDefault && !isDefault);

      if (needsOne) {
        restoreValue(positionComponent);
      } else if (needsBoth) {
        restoreValue(component);
        restored.unshift([token.PROPERTY_VALUE, marker.FORWARD_SLASH]);
        restoreValue(positionComponent);
      } else if (positionComponent.value.length == 1) {
        restoreValue(positionComponent);
      }

      i--;
    } else {
      if (isDefault || compactable[component.name].multiplexLastOnly && !lastInMultiplex)
        continue;

      restoreValue(component);
    }
  }

  if (restored.length === 0 && property.value.length == 1 && property.value[0][1] == '0')
    restored.push(property.value[0]);

  if (restored.length === 0)
    restored.push([token.PROPERTY_VALUE, compactable[property.name].defaultValue]);

  if (isInheritOnly(restored))
    return [restored[0]];

  return restored;
}

function borderRadius$1(property, compactable) {
  if (property.multiplex) {
    var horizontal = shallowClone(property);
    var vertical = shallowClone(property);

    for (var i = 0; i < 4; i++) {
      var component = property.components[i];

      var horizontalComponent = shallowClone(property);
      horizontalComponent.value = [component.value[0]];
      horizontal.components.push(horizontalComponent);

      var verticalComponent = shallowClone(property);
      // FIXME: only shorthand compactor (see breakup#borderRadius) knows that border radius
      // longhands have two values, whereas tokenizer does not care about populating 2nd value
      // if it's missing, hence this fallback
      verticalComponent.value = [component.value[1] || component.value[0]];
      vertical.components.push(verticalComponent);
    }

    var horizontalValues = fourValues$1(horizontal);
    var verticalValues = fourValues$1(vertical);

    if (horizontalValues.length == verticalValues.length &&
        horizontalValues[0][1] == verticalValues[0][1] &&
        (horizontalValues.length > 1 ? horizontalValues[1][1] == verticalValues[1][1] : true) &&
        (horizontalValues.length > 2 ? horizontalValues[2][1] == verticalValues[2][1] : true) &&
        (horizontalValues.length > 3 ? horizontalValues[3][1] == verticalValues[3][1] : true)) {
      return horizontalValues;
    } else {
      return horizontalValues.concat([[token.PROPERTY_VALUE, marker.FORWARD_SLASH]]).concat(verticalValues);
    }
  } else {
    return fourValues$1(property);
  }
}

function font$1(property, compactable) {
  var components = property.components;
  var restored = [];
  var component;
  var componentIndex = 0;
  var fontFamilyIndex = 0;

  if (property.value[0][1].indexOf(marker.INTERNAL) === 0) {
    property.value[0][1] = property.value[0][1].substring(marker.INTERNAL.length);
    return property.value;
  }

  // first four components are optional
  while (componentIndex < 4) {
    component = components[componentIndex];

    if (component.value[0][1] != compactable[component.name].defaultValue) {
      Array.prototype.push.apply(restored, component.value);
    }

    componentIndex++;
  }

  // then comes font-size
  Array.prototype.push.apply(restored, components[componentIndex].value);
  componentIndex++;

  // then may come line-height
  if (components[componentIndex].value[0][1] != compactable[components[componentIndex].name].defaultValue) {
    Array.prototype.push.apply(restored, [[token.PROPERTY_VALUE, marker.FORWARD_SLASH]]);
    Array.prototype.push.apply(restored, components[componentIndex].value);
  }

  componentIndex++;

  // then comes font-family
  while (components[componentIndex].value[fontFamilyIndex]) {
    restored.push(components[componentIndex].value[fontFamilyIndex]);

    if (components[componentIndex].value[fontFamilyIndex + 1]) {
      restored.push([token.PROPERTY_VALUE, marker.COMMA]);
    }

    fontFamilyIndex++;
  }

  if (isInheritOnly(restored)) {
    return [restored[0]];
  }

  return restored;
}

function fourValues$1(property) {
  var components = property.components;
  var value1 = components[0].value[0];
  var value2 = components[1].value[0];
  var value3 = components[2].value[0];
  var value4 = components[3].value[0];

  if (value1[1] == value2[1] && value1[1] == value3[1] && value1[1] == value4[1]) {
    return [value1];
  } else if (value1[1] == value3[1] && value2[1] == value4[1]) {
    return [value1, value2];
  } else if (value2[1] == value4[1]) {
    return [value1, value2, value3];
  } else {
    return [value1, value2, value3, value4];
  }
}

function multiplex$1(restoreWith) {
  return function (property, compactable) {
    if (!property.multiplex)
      return restoreWith(property, compactable, true);

    var multiplexSize = 0;
    var restored = [];
    var componentMultiplexSoFar = {};
    var i, l;

    // At this point we don't know what's the multiplex size, e.g. how many background layers are there
    for (i = 0, l = property.components[0].value.length; i < l; i++) {
      if (property.components[0].value[i][1] == marker.COMMA)
        multiplexSize++;
    }

    for (i = 0; i <= multiplexSize; i++) {
      var _property = shallowClone(property);

      // We split multiplex into parts and restore them one by one
      for (var j = 0, m = property.components.length; j < m; j++) {
        var componentToClone = property.components[j];
        var _component = shallowClone(componentToClone);
        _property.components.push(_component);

        // The trick is some properties has more than one value, so we iterate over values looking for
        // a multiplex separator - a comma
        for (var k = componentMultiplexSoFar[_component.name] || 0, n = componentToClone.value.length; k < n; k++) {
          if (componentToClone.value[k][1] == marker.COMMA) {
            componentMultiplexSoFar[_component.name] = k + 1;
            break;
          }

          _component.value.push(componentToClone.value[k]);
        }
      }

      // No we can restore shorthand value
      var lastInMultiplex = i == multiplexSize;
      var _restored = restoreWith(_property, compactable, lastInMultiplex);
      Array.prototype.push.apply(restored, _restored);

      if (i < multiplexSize)
        restored.push([token.PROPERTY_VALUE, marker.COMMA]);
    }

    return restored;
  };
}

function withoutDefaults(property, compactable) {
  var components = property.components;
  var restored = [];

  for (var i = components.length - 1; i >= 0; i--) {
    var component = components[i];
    var descriptor = compactable[component.name];

    if (component.value[0][1] != descriptor.defaultValue || ('keepUnlessDefault' in descriptor) && !isDefault(components, compactable, descriptor.keepUnlessDefault)) {
      restored.unshift(component.value[0]);
    }
  }

  if (restored.length === 0)
    restored.push([token.PROPERTY_VALUE, compactable[property.name].defaultValue]);

  if (isInheritOnly(restored))
    return [restored[0]];

  return restored;
}

function isDefault(components, compactable, propertyName) {
  var component;
  var i, l;

  for (i = 0, l = components.length; i < l; i++) {
    component = components[i];

    if (component.name == propertyName && component.value[0][1] == compactable[propertyName].defaultValue) {
      return true;
    }
  }

  return false;
}

var restore = {
  background: background$1,
  borderRadius: borderRadius$1,
  font: font$1,
  fourValues: fourValues$1,
  multiplex: multiplex$1,
  withoutDefaults: withoutDefaults
};

// Contains the interpretation of CSS properties, as used by the property optimizer







// Properties to process
// Extend this object in order to add support for more properties in the optimizer.
//
// Each key in this object represents a CSS property and should be an object.
// Such an object contains properties that describe how the represented CSS property should be handled.
// Possible options:
//
// * components: array (Only specify for shorthand properties.)
//   Contains the names of the granular properties this shorthand compacts.
//
// * canOverride: function
//   Returns whether two tokens of this property can be merged with each other.
//   This property has no meaning for shorthands.
//
// * defaultValue: string
//   Specifies the default value of the property according to the CSS standard.
//   For shorthand, this is used when every component is set to its default value, therefore it should be the shortest possible default value of all the components.
//
// * shortestValue: string
//   Specifies the shortest possible value the property can possibly have.
//   (Falls back to defaultValue if unspecified.)
//
// * breakUp: function (Only specify for shorthand properties.)
//   Breaks the shorthand up to its components.
//
// * restore: function (Only specify for shorthand properties.)
//   Puts the shorthand together from its components.
//
var compactable = {
  'animation': {
    canOverride: canOverride.generic.components([
      canOverride.generic.time,
      canOverride.generic.timingFunction,
      canOverride.generic.time,
      canOverride.property.animationIterationCount,
      canOverride.property.animationDirection,
      canOverride.property.animationFillMode,
      canOverride.property.animationPlayState,
      canOverride.property.animationName
    ]),
    components: [
      'animation-duration',
      'animation-timing-function',
      'animation-delay',
      'animation-iteration-count',
      'animation-direction',
      'animation-fill-mode',
      'animation-play-state',
      'animation-name'
    ],
    breakUp: breakUp.multiplex(breakUp.animation),
    defaultValue: 'none',
    restore: restore.multiplex(restore.withoutDefaults),
    shorthand: true,
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'animation-delay': {
    canOverride: canOverride.generic.time,
    componentOf: [
      'animation'
    ],
    defaultValue: '0s',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'animation-direction': {
    canOverride: canOverride.property.animationDirection,
    componentOf: [
      'animation'
    ],
    defaultValue: 'normal',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'animation-duration': {
    canOverride: canOverride.generic.time,
    componentOf: [
      'animation'
    ],
    defaultValue: '0s',
    intoMultiplexMode: 'real',
    keepUnlessDefault: 'animation-delay',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'animation-fill-mode': {
    canOverride: canOverride.property.animationFillMode,
    componentOf: [
      'animation'
    ],
    defaultValue: 'none',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'animation-iteration-count': {
    canOverride: canOverride.property.animationIterationCount,
    componentOf: [
      'animation'
    ],
    defaultValue: '1',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'animation-name': {
    canOverride: canOverride.property.animationName,
    componentOf: [
      'animation'
    ],
    defaultValue: 'none',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'animation-play-state': {
    canOverride: canOverride.property.animationPlayState,
    componentOf: [
      'animation'
    ],
    defaultValue: 'running',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'animation-timing-function': {
    canOverride: canOverride.generic.timingFunction,
    componentOf: [
      'animation'
    ],
    defaultValue: 'ease',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'background': {
    canOverride: canOverride.generic.components([
      canOverride.generic.image,
      canOverride.property.backgroundPosition,
      canOverride.property.backgroundSize,
      canOverride.property.backgroundRepeat,
      canOverride.property.backgroundAttachment,
      canOverride.property.backgroundOrigin,
      canOverride.property.backgroundClip,
      canOverride.generic.color
    ]),
    components: [
      'background-image',
      'background-position',
      'background-size',
      'background-repeat',
      'background-attachment',
      'background-origin',
      'background-clip',
      'background-color'
    ],
    breakUp: breakUp.multiplex(breakUp.background),
    defaultValue: '0 0',
    restore: restore.multiplex(restore.background),
    shortestValue: '0',
    shorthand: true
  },
  'background-attachment': {
    canOverride: canOverride.property.backgroundAttachment,
    componentOf: [
      'background'
    ],
    defaultValue: 'scroll',
    intoMultiplexMode: 'real'
  },
  'background-clip': {
    canOverride: canOverride.property.backgroundClip,
    componentOf: [
      'background'
    ],
    defaultValue: 'border-box',
    intoMultiplexMode: 'real',
    shortestValue: 'border-box'
  },
  'background-color': {
    canOverride: canOverride.generic.color,
    componentOf: [
      'background'
    ],
    defaultValue: 'transparent',
    intoMultiplexMode: 'real', // otherwise real color will turn into default since color appears in last multiplex only
    multiplexLastOnly: true,
    nonMergeableValue: 'none',
    shortestValue: 'red'
  },
  'background-image': {
    canOverride: canOverride.generic.image,
    componentOf: [
      'background'
    ],
    defaultValue: 'none',
    intoMultiplexMode: 'default'
  },
  'background-origin': {
    canOverride: canOverride.property.backgroundOrigin,
    componentOf: [
      'background'
    ],
    defaultValue: 'padding-box',
    intoMultiplexMode: 'real',
    shortestValue: 'border-box'
  },
  'background-position': {
    canOverride: canOverride.property.backgroundPosition,
    componentOf: [
      'background'
    ],
    defaultValue: ['0', '0'],
    doubleValues: true,
    intoMultiplexMode: 'real',
    shortestValue: '0'
  },
  'background-repeat': {
    canOverride: canOverride.property.backgroundRepeat,
    componentOf: [
      'background'
    ],
    defaultValue: ['repeat'],
    doubleValues: true,
    intoMultiplexMode: 'real'
  },
  'background-size': {
    canOverride: canOverride.property.backgroundSize,
    componentOf: [
      'background'
    ],
    defaultValue: ['auto'],
    doubleValues: true,
    intoMultiplexMode: 'real',
    shortestValue: '0 0'
  },
  'bottom': {
    canOverride: canOverride.property.bottom,
    defaultValue: 'auto'
  },
  'border': {
    breakUp: breakUp.border,
    canOverride: canOverride.generic.components([
      canOverride.generic.unit,
      canOverride.property.borderStyle,
      canOverride.generic.color
    ]),
    components: [
      'border-width',
      'border-style',
      'border-color'
    ],
    defaultValue: 'none',
    overridesShorthands: [
      'border-bottom',
      'border-left',
      'border-right',
      'border-top'
    ],
    restore: restore.withoutDefaults,
    shorthand: true,
    shorthandComponents: true
  },
  'border-bottom': {
    breakUp: breakUp.border,
    canOverride: canOverride.generic.components([
      canOverride.generic.unit,
      canOverride.property.borderStyle,
      canOverride.generic.color
    ]),
    components: [
      'border-bottom-width',
      'border-bottom-style',
      'border-bottom-color'
    ],
    defaultValue: 'none',
    restore: restore.withoutDefaults,
    shorthand: true
  },
  'border-bottom-color': {
    canOverride: canOverride.generic.color,
    componentOf: [
      'border-bottom',
      'border-color'
    ],
    defaultValue: 'none'
  },
  'border-bottom-left-radius': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'border-radius'
    ],
    defaultValue: '0',
    vendorPrefixes: [
      '-moz-',
      '-o-'
    ]
  },
  'border-bottom-right-radius': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'border-radius'
    ],
    defaultValue: '0',
    vendorPrefixes: [
      '-moz-',
      '-o-'
    ]
  },
  'border-bottom-style': {
    canOverride: canOverride.property.borderStyle,
    componentOf: [
      'border-bottom',
      'border-style'
    ],
    defaultValue: 'none'
  },
  'border-bottom-width': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'border-bottom',
      'border-width'
    ],
    defaultValue: 'medium',
    oppositeTo: 'border-top-width',
    shortestValue: '0'
  },
  'border-collapse': {
    canOverride: canOverride.property.borderCollapse,
    defaultValue: 'separate'
  },
  'border-color': {
    breakUp: breakUp.fourValues,
    canOverride: canOverride.generic.components([
      canOverride.generic.color,
      canOverride.generic.color,
      canOverride.generic.color,
      canOverride.generic.color
    ]),
    componentOf: [
      'border'
    ],
    components: [
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color'
    ],
    defaultValue: 'none',
    restore: restore.fourValues,
    shortestValue: 'red',
    shorthand: true
  },
  'border-left': {
    breakUp: breakUp.border,
    canOverride: canOverride.generic.components([
      canOverride.generic.unit,
      canOverride.property.borderStyle,
      canOverride.generic.color
    ]),
    components: [
      'border-left-width',
      'border-left-style',
      'border-left-color'
    ],
    defaultValue: 'none',
    restore: restore.withoutDefaults,
    shorthand: true
  },
  'border-left-color': {
    canOverride: canOverride.generic.color,
    componentOf: [
      'border-color',
      'border-left'
    ],
    defaultValue: 'none'
  },
  'border-left-style': {
    canOverride: canOverride.property.borderStyle,
    componentOf: [
      'border-left',
      'border-style'
    ],
    defaultValue: 'none'
  },
  'border-left-width': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'border-left',
      'border-width'
    ],
    defaultValue: 'medium',
    oppositeTo: 'border-right-width',
    shortestValue: '0'
  },
  'border-radius': {
    breakUp: breakUp.borderRadius,
    canOverride: canOverride.generic.components([
      canOverride.generic.unit,
      canOverride.generic.unit,
      canOverride.generic.unit,
      canOverride.generic.unit
    ]),
    components: [
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-right-radius',
      'border-bottom-left-radius'
    ],
    defaultValue: '0',
    restore: restore.borderRadius,
    shorthand: true,
    vendorPrefixes: [
      '-moz-',
      '-o-'
    ]
  },
  'border-right': {
    breakUp: breakUp.border,
    canOverride: canOverride.generic.components([
      canOverride.generic.unit,
      canOverride.property.borderStyle,
      canOverride.generic.color
    ]),
    components: [
      'border-right-width',
      'border-right-style',
      'border-right-color'
    ],
    defaultValue: 'none',
    restore: restore.withoutDefaults,
    shorthand: true
  },
  'border-right-color': {
    canOverride: canOverride.generic.color,
    componentOf: [
      'border-color',
      'border-right'
    ],
    defaultValue: 'none'
  },
  'border-right-style': {
    canOverride: canOverride.property.borderStyle,
    componentOf: [
      'border-right',
      'border-style'
    ],
    defaultValue: 'none'
  },
  'border-right-width': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'border-right',
      'border-width'
    ],
    defaultValue: 'medium',
    oppositeTo: 'border-left-width',
    shortestValue: '0'
  },
  'border-style': {
    breakUp: breakUp.fourValues,
    canOverride: canOverride.generic.components([
      canOverride.property.borderStyle,
      canOverride.property.borderStyle,
      canOverride.property.borderStyle,
      canOverride.property.borderStyle
    ]),
    componentOf: [
      'border'
    ],
    components: [
      'border-top-style',
      'border-right-style',
      'border-bottom-style',
      'border-left-style'
    ],
    defaultValue: 'none',
    restore: restore.fourValues,
    shorthand: true
  },
  'border-top': {
    breakUp: breakUp.border,
    canOverride: canOverride.generic.components([
      canOverride.generic.unit,
      canOverride.property.borderStyle,
      canOverride.generic.color
    ]),
    components: [
      'border-top-width',
      'border-top-style',
      'border-top-color'
    ],
    defaultValue: 'none',
    restore: restore.withoutDefaults,
    shorthand: true
  },
  'border-top-color': {
    canOverride: canOverride.generic.color,
    componentOf: [
      'border-color',
      'border-top'
    ],
    defaultValue: 'none'
  },
  'border-top-left-radius': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'border-radius'
    ],
    defaultValue: '0',
    vendorPrefixes: [
      '-moz-',
      '-o-'
    ]
  },
  'border-top-right-radius': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'border-radius'
    ],
    defaultValue: '0',
    vendorPrefixes: [
      '-moz-',
      '-o-'
    ]
  },
  'border-top-style': {
    canOverride: canOverride.property.borderStyle,
    componentOf: [
      'border-style',
      'border-top'
    ],
    defaultValue: 'none'
  },
  'border-top-width': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'border-top',
      'border-width'
    ],
    defaultValue: 'medium',
    oppositeTo: 'border-bottom-width',
    shortestValue: '0'
  },
  'border-width': {
    breakUp: breakUp.fourValues,
    canOverride: canOverride.generic.components([
      canOverride.generic.unit,
      canOverride.generic.unit,
      canOverride.generic.unit,
      canOverride.generic.unit
    ]),
    componentOf: [
      'border'
    ],
    components: [
      'border-top-width',
      'border-right-width',
      'border-bottom-width',
      'border-left-width'
    ],
    defaultValue: 'medium',
    restore: restore.fourValues,
    shortestValue: '0',
    shorthand: true
  },
  'clear': {
    canOverride: canOverride.property.clear,
    defaultValue: 'none'
  },
  'color': {
    canOverride: canOverride.generic.color,
    defaultValue: 'transparent',
    shortestValue: 'red'
  },
  'cursor': {
    canOverride: canOverride.property.cursor,
    defaultValue: 'auto'
  },
  'display': {
    canOverride: canOverride.property.display,
  },
  'float': {
    canOverride: canOverride.property.float,
    defaultValue: 'none'
  },
  'font': {
    breakUp: breakUp.font,
    canOverride: canOverride.generic.components([
      canOverride.property.fontStyle,
      canOverride.property.fontVariant,
      canOverride.property.fontWeight,
      canOverride.property.fontStretch,
      canOverride.generic.unit,
      canOverride.generic.unit,
      canOverride.property.fontFamily
    ]),
    components: [
      'font-style',
      'font-variant',
      'font-weight',
      'font-stretch',
      'font-size',
      'line-height',
      'font-family'
    ],
    restore: restore.font,
    shorthand: true
  },
  'font-family': {
    canOverride: canOverride.property.fontFamily,
    defaultValue: 'user|agent|specific'
  },
  'font-size': {
    canOverride: canOverride.generic.unit,
    defaultValue: 'medium',
    shortestValue: '0'
  },
  'font-stretch': {
    canOverride: canOverride.property.fontStretch,
    defaultValue: 'normal'
  },
  'font-style': {
    canOverride: canOverride.property.fontStyle,
    defaultValue: 'normal'
  },
  'font-variant': {
    canOverride: canOverride.property.fontVariant,
    defaultValue: 'normal'
  },
  'font-weight': {
    canOverride: canOverride.property.fontWeight,
    defaultValue: 'normal',
    shortestValue: '400'
  },
  'height': {
    canOverride: canOverride.generic.unit,
    defaultValue: 'auto',
    shortestValue: '0'
  },
  'left': {
    canOverride: canOverride.property.left,
    defaultValue: 'auto'
  },
  'line-height': {
    canOverride: canOverride.generic.unitOrNumber,
    defaultValue: 'normal',
    shortestValue: '0'
  },
  'list-style': {
    canOverride: canOverride.generic.components([
      canOverride.property.listStyleType,
      canOverride.property.listStylePosition,
      canOverride.property.listStyleImage
    ]),
    components: [
      'list-style-type',
      'list-style-position',
      'list-style-image'
    ],
    breakUp: breakUp.listStyle,
    restore: restore.withoutDefaults,
    defaultValue: 'outside', // can't use 'disc' because that'd override default 'decimal' for <ol>
    shortestValue: 'none',
    shorthand: true
  },
  'list-style-image' : {
    canOverride: canOverride.generic.image,
    componentOf: [
      'list-style'
    ],
    defaultValue: 'none'
  },
  'list-style-position' : {
    canOverride: canOverride.property.listStylePosition,
    componentOf: [
      'list-style'
    ],
    defaultValue: 'outside',
    shortestValue: 'inside'
  },
  'list-style-type' : {
    canOverride: canOverride.property.listStyleType,
    componentOf: [
      'list-style'
    ],
    // NOTE: we can't tell the real default value here, it's 'disc' for <ul> and 'decimal' for <ol>
    // this is a hack, but it doesn't matter because this value will be either overridden or
    // it will disappear at the final step anyway
    defaultValue: 'decimal|disc',
    shortestValue: 'none'
  },
  'margin': {
    breakUp: breakUp.fourValues,
    canOverride: canOverride.generic.components([
      canOverride.generic.unit,
      canOverride.generic.unit,
      canOverride.generic.unit,
      canOverride.generic.unit
    ]),
    components: [
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left'
    ],
    defaultValue: '0',
    restore: restore.fourValues,
    shorthand: true
  },
  'margin-bottom': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'margin'
    ],
    defaultValue: '0',
    oppositeTo: 'margin-top'
  },
  'margin-left': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'margin'
    ],
    defaultValue: '0',
    oppositeTo: 'margin-right'
  },
  'margin-right': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'margin'
    ],
    defaultValue: '0',
    oppositeTo: 'margin-left'
  },
  'margin-top': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'margin'
    ],
    defaultValue: '0',
    oppositeTo: 'margin-bottom'
  },
  'outline': {
    canOverride: canOverride.generic.components([
      canOverride.generic.color,
      canOverride.property.outlineStyle,
      canOverride.generic.unit
    ]),
    components: [
      'outline-color',
      'outline-style',
      'outline-width'
    ],
    breakUp: breakUp.outline,
    restore: restore.withoutDefaults,
    defaultValue: '0',
    shorthand: true
  },
  'outline-color': {
    canOverride: canOverride.generic.color,
    componentOf: [
      'outline'
    ],
    defaultValue: 'invert',
    shortestValue: 'red'
  },
  'outline-style': {
    canOverride: canOverride.property.outlineStyle,
    componentOf: [
      'outline'
    ],
    defaultValue: 'none'
  },
  'outline-width': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'outline'
    ],
    defaultValue: 'medium',
    shortestValue: '0'
  },
  'overflow': {
    canOverride: canOverride.property.overflow,
    defaultValue: 'visible'
  },
  'overflow-x': {
    canOverride: canOverride.property.overflow,
    defaultValue: 'visible'
  },
  'overflow-y': {
    canOverride: canOverride.property.overflow,
    defaultValue: 'visible'
  },
  'padding': {
    breakUp: breakUp.fourValues,
    canOverride: canOverride.generic.components([
      canOverride.generic.unit,
      canOverride.generic.unit,
      canOverride.generic.unit,
      canOverride.generic.unit
    ]),
    components: [
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left'
    ],
    defaultValue: '0',
    restore: restore.fourValues,
    shorthand: true
  },
  'padding-bottom': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'padding'
    ],
    defaultValue: '0',
    oppositeTo: 'padding-top'
  },
  'padding-left': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'padding'
    ],
    defaultValue: '0',
    oppositeTo: 'padding-right'
  },
  'padding-right': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'padding'
    ],
    defaultValue: '0',
    oppositeTo: 'padding-left'
  },
  'padding-top': {
    canOverride: canOverride.generic.unit,
    componentOf: [
      'padding'
    ],
    defaultValue: '0',
    oppositeTo: 'padding-bottom'
  },
  'position': {
    canOverride: canOverride.property.position,
    defaultValue: 'static'
  },
  'right': {
    canOverride: canOverride.property.right,
    defaultValue: 'auto'
  },
  'text-align': {
    canOverride: canOverride.property.textAlign,
    // NOTE: we can't tell the real default value here, as it depends on default text direction
    // this is a hack, but it doesn't matter because this value will be either overridden or
    // it will disappear anyway
    defaultValue: 'left|right'
  },
  'text-decoration': {
    canOverride: canOverride.property.textDecoration,
    defaultValue: 'none'
  },
  'text-overflow': {
    canOverride: canOverride.property.textOverflow,
    defaultValue: 'none'
  },
  'text-shadow': {
    canOverride: canOverride.property.textShadow,
    defaultValue: 'none'
  },
  'top': {
    canOverride: canOverride.property.top,
    defaultValue: 'auto'
  },
  'transform': {
    canOverride: canOverride.property.transform,
    vendorPrefixes: [
      '-moz-',
      '-ms-',
      '-webkit-'
    ]
  },
  'transition': {
    breakUp: breakUp.multiplex(breakUp.transition),
    canOverride: canOverride.generic.components([
      canOverride.property.transitionProperty,
      canOverride.generic.time,
      canOverride.generic.timingFunction,
      canOverride.generic.time
    ]),
    components: [
      'transition-property',
      'transition-duration',
      'transition-timing-function',
      'transition-delay'
    ],
    defaultValue: 'none',
    restore: restore.multiplex(restore.withoutDefaults),
    shorthand: true,
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'transition-delay': {
    canOverride: canOverride.generic.time,
    componentOf: [
      'transition'
    ],
    defaultValue: '0s',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'transition-duration': {
    canOverride: canOverride.generic.time,
    componentOf: [
      'transition'
    ],
    defaultValue: '0s',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'transition-property': {
    canOverride: canOverride.generic.propertyName,
    componentOf: [
      'transition'
    ],
    defaultValue: 'all',
    intoMultiplexMode: 'placeholder',
    placeholderValue: '_', // it's a short value that won't match any property and still be a valid `transition-property`
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'transition-timing-function': {
    canOverride: canOverride.generic.timingFunction,
    componentOf: [
      'transition'
    ],
    defaultValue: 'ease',
    intoMultiplexMode: 'real',
    vendorPrefixes: [
      '-moz-',
      '-o-',
      '-webkit-'
    ]
  },
  'vertical-align': {
    canOverride: canOverride.property.verticalAlign,
    defaultValue: 'baseline'
  },
  'visibility': {
    canOverride: canOverride.property.visibility,
    defaultValue: 'visible'
  },
  'white-space': {
    canOverride: canOverride.property.whiteSpace,
    defaultValue: 'normal'
  },
  'width': {
    canOverride: canOverride.generic.unit,
    defaultValue: 'auto',
    shortestValue: '0'
  },
  'z-index': {
    canOverride: canOverride.property.zIndex,
    defaultValue: 'auto'
  }
};

function cloneDescriptor(propertyName, prefix) {
  var clonedDescriptor = override_1(compactable[propertyName], {});

  if ('componentOf' in clonedDescriptor) {
    clonedDescriptor.componentOf = clonedDescriptor.componentOf.map(function (shorthandName) {
      return prefix + shorthandName;
    });
  }

  if ('components' in clonedDescriptor) {
    clonedDescriptor.components = clonedDescriptor.components.map(function (longhandName) {
      return prefix + longhandName;
    });
  }

  if ('keepUnlessDefault' in clonedDescriptor) {
    clonedDescriptor.keepUnlessDefault = prefix + clonedDescriptor.keepUnlessDefault;
  }

  return clonedDescriptor;
}

// generate vendor-prefixed properties
var vendorPrefixedCompactable = {};

for (var propertyName$1 in compactable) {
  var descriptor = compactable[propertyName$1];

  if (!('vendorPrefixes' in descriptor)) {
    continue;
  }

  for (var i = 0; i < descriptor.vendorPrefixes.length; i++) {
    var prefix = descriptor.vendorPrefixes[i];
    var clonedDescriptor = cloneDescriptor(propertyName$1, prefix);
    delete clonedDescriptor.vendorPrefixes;

    vendorPrefixedCompactable[prefix + propertyName$1] = clonedDescriptor;
  }

  delete descriptor.vendorPrefixes;
}

var compactable_1 = override_1(compactable, vendorPrefixedCompactable);

function populateComponents(properties, validator, warnings) {
  var component;
  var j, m;

  for (var i = properties.length - 1; i >= 0; i--) {
    var property = properties[i];
    var descriptor = compactable_1[property.name];

    if (descriptor && descriptor.shorthand) {
      property.shorthand = true;
      property.dirty = true;

      try {
        property.components = descriptor.breakUp(property, compactable_1, validator);

        if (descriptor.shorthandComponents) {
          for (j = 0, m = property.components.length; j < m; j++) {
            component = property.components[j];
            component.components = compactable_1[component.name].breakUp(component, compactable_1, validator);
          }
        }
      } catch (e) {
        if (e instanceof invalidPropertyError) {
          property.components = []; // this will set property.unused to true below
          warnings.push(e.message);
        } else {
          throw e;
        }
      }

      if (property.components.length > 0)
        property.multiplex = property.components[0].multiplex;
      else
        property.unused = true;
    }
  }
}

var populateComponents_1 = populateComponents;

function restoreWithComponents(property) {
  var descriptor = compactable_1[property.name];

  if (descriptor && descriptor.shorthand) {
    return descriptor.restore(property, compactable_1);
  } else {
    return property.value;
  }
}

var restoreWithComponents_1 = restoreWithComponents;

var deepClone = clone.deep;



var wrapSingle$3 = wrapForOptimizing.single;

var serializeBody = oneTime.body;


function mergeIntoShorthands(properties, validator) {
  var candidates = {};
  var descriptor;
  var componentOf;
  var property;
  var i, l;
  var j, m;

  // there is no shorthand property made up of less than 3 longhands
  if (properties.length < 3) {
    return;
  }

  for (i = 0, l = properties.length; i < l; i++) {
    property = properties[i];
    descriptor = compactable_1[property.name];

    if (property.unused) {
      continue;
    }

    if (property.hack) {
      continue;
    }

    if (property.block) {
      continue;
    }

    invalidateOrCompact(properties, i, candidates, validator);

    if (descriptor && descriptor.componentOf) {
      for (j = 0, m = descriptor.componentOf.length; j < m; j++) {
        componentOf = descriptor.componentOf[j];

        candidates[componentOf] = candidates[componentOf] || {};
        candidates[componentOf][property.name] = property;
      }
    }
  }

  invalidateOrCompact(properties, i, candidates, validator);
}

function invalidateOrCompact(properties, position, candidates, validator) {
  var invalidatedBy = properties[position];
  var shorthandName;
  var shorthandDescriptor;
  var candidateComponents;

  for (shorthandName in candidates) {
    if (undefined !== invalidatedBy && shorthandName == invalidatedBy.name) {
      continue;
    }

    shorthandDescriptor = compactable_1[shorthandName];
    candidateComponents = candidates[shorthandName];
    if (invalidatedBy && invalidates(candidates, shorthandName, invalidatedBy)) {
      delete candidates[shorthandName];
      continue;
    }

    if (shorthandDescriptor.components.length > Object.keys(candidateComponents).length) {
      continue;
    }

    if (mixedImportance(candidateComponents)) {
      continue;
    }

    if (!overridable(candidateComponents, shorthandName, validator)) {
      continue;
    }

    if (!mergeable(candidateComponents)) {
      continue;
    }

    if (mixedInherit(candidateComponents)) {
      replaceWithInheritBestFit(properties, candidateComponents, shorthandName, validator);
    } else {
      replaceWithShorthand(properties, candidateComponents, shorthandName, validator);
    }
  }
}

function invalidates(candidates, shorthandName, invalidatedBy) {
  var shorthandDescriptor = compactable_1[shorthandName];
  var invalidatedByDescriptor = compactable_1[invalidatedBy.name];
  var componentName;

  if ('overridesShorthands' in shorthandDescriptor && shorthandDescriptor.overridesShorthands.indexOf(invalidatedBy.name) > -1) {
    return true;
  }

  if (invalidatedByDescriptor && 'componentOf' in invalidatedByDescriptor) {
    for (componentName in candidates[shorthandName]) {
      if (invalidatedByDescriptor.componentOf.indexOf(componentName) > -1) {
        return true;
      }
    }
  }

  return false;
}

function mixedImportance(components) {
  var important;
  var componentName;

  for (componentName in components) {
    if (undefined !== important && components[componentName].important != important) {
      return true;
    }

    important = components[componentName].important;
  }

  return false;
}

function overridable(components, shorthandName, validator) {
  var descriptor = compactable_1[shorthandName];
  var newValuePlaceholder = [
    token.PROPERTY,
    [token.PROPERTY_NAME, shorthandName],
    [token.PROPERTY_VALUE, descriptor.defaultValue]
  ];
  var newProperty = wrapSingle$3(newValuePlaceholder);
  var component;
  var mayOverride;
  var i, l;

  populateComponents_1([newProperty], validator, []);

  for (i = 0, l = descriptor.components.length; i < l; i++) {
    component = components[descriptor.components[i]];
    mayOverride = compactable_1[component.name].canOverride;

    if (!everyValuesPair_1(mayOverride.bind(null, validator), newProperty.components[i], component)) {
      return false;
    }
  }

  return true;
}

function mergeable(components) {
  var lastCount = null;
  var currentCount;
  var componentName;
  var component;
  var descriptor;
  var values;

  for (componentName in components) {
    component = components[componentName];
    descriptor = compactable_1[componentName];

    if (!('restore' in descriptor)) {
      continue;
    }

    restoreFromOptimizing_1([component.all[component.position]], restoreWithComponents_1);
    values = descriptor.restore(component, compactable_1);

    currentCount = values.length;

    if (lastCount !== null && currentCount !== lastCount) {
      return false;
    }

    lastCount = currentCount;
  }

  return true;
}

function mixedInherit(components) {
  var componentName;
  var lastValue = null;
  var currentValue;

  for (componentName in components) {
    currentValue = hasInherit_1(components[componentName]);

    if (lastValue !== null && lastValue !== currentValue) {
      return true;
    }

    lastValue = currentValue;
  }

  return false;
}

function replaceWithInheritBestFit(properties, candidateComponents, shorthandName, validator) {
  var viaLonghands = buildSequenceWithInheritLonghands(candidateComponents, shorthandName, validator);
  var viaShorthand = buildSequenceWithInheritShorthand(candidateComponents, shorthandName, validator);
  var longhandTokensSequence = viaLonghands[0];
  var shorthandTokensSequence = viaShorthand[0];
  var isLonghandsShorter = serializeBody(longhandTokensSequence).length < serializeBody(shorthandTokensSequence).length;
  var newTokensSequence = isLonghandsShorter ? longhandTokensSequence : shorthandTokensSequence;
  var newProperty = isLonghandsShorter ? viaLonghands[1] : viaShorthand[1];
  var newComponents = isLonghandsShorter ? viaLonghands[2] : viaShorthand[2];
  var all = candidateComponents[Object.keys(candidateComponents)[0]].all;
  var componentName;
  var oldComponent;
  var newComponent;
  var newToken;

  newProperty.position = all.length;
  newProperty.shorthand = true;
  newProperty.dirty = true;
  newProperty.all = all;
  newProperty.all.push(newTokensSequence[0]);

  properties.push(newProperty);

  for (componentName in candidateComponents) {
    oldComponent = candidateComponents[componentName];
    oldComponent.unused = true;

    if (oldComponent.name in newComponents) {
      newComponent = newComponents[oldComponent.name];
      newToken = findTokenIn(newTokensSequence, componentName);

      newComponent.position = all.length;
      newComponent.all = all;
      newComponent.all.push(newToken);

      properties.push(newComponent);
    }
  }
}

function buildSequenceWithInheritLonghands(components, shorthandName, validator) {
  var tokensSequence = [];
  var inheritComponents = {};
  var nonInheritComponents = {};
  var descriptor = compactable_1[shorthandName];
  var shorthandToken = [
    token.PROPERTY,
    [token.PROPERTY_NAME, shorthandName],
    [token.PROPERTY_VALUE, descriptor.defaultValue]
  ];
  var newProperty = wrapSingle$3(shorthandToken);
  var component;
  var longhandToken;
  var newComponent;
  var nameMetadata;
  var i, l;

  populateComponents_1([newProperty], validator, []);

  for (i = 0, l = descriptor.components.length; i < l; i++) {
    component = components[descriptor.components[i]];

    if (hasInherit_1(component)) {
      longhandToken = component.all[component.position].slice(0, 2);
      Array.prototype.push.apply(longhandToken, component.value);
      tokensSequence.push(longhandToken);

      newComponent = deepClone(component);
      newComponent.value = inferComponentValue(components, newComponent.name);

      newProperty.components[i] = newComponent;
      inheritComponents[component.name] = deepClone(component);
    } else {
      newComponent = deepClone(component);
      newComponent.all = component.all;
      newProperty.components[i] = newComponent;

      nonInheritComponents[component.name] = component;
    }
  }

  nameMetadata = joinMetadata(nonInheritComponents, 1);
  shorthandToken[1].push(nameMetadata);

  restoreFromOptimizing_1([newProperty], restoreWithComponents_1);

  shorthandToken = shorthandToken.slice(0, 2);
  Array.prototype.push.apply(shorthandToken, newProperty.value);

  tokensSequence.unshift(shorthandToken);

  return [tokensSequence, newProperty, inheritComponents];
}

function inferComponentValue(components, propertyName) {
  var descriptor = compactable_1[propertyName];

  if ('oppositeTo' in descriptor) {
    return components[descriptor.oppositeTo].value;
  } else {
    return [[token.PROPERTY_VALUE, descriptor.defaultValue]];
  }
}

function joinMetadata(components, at) {
  var metadata = [];
  var component;
  var originalValue;
  var componentMetadata;
  var componentName;

  for (componentName in components) {
    component = components[componentName];
    originalValue = component.all[component.position];
    componentMetadata = originalValue[at][originalValue[at].length - 1];

    Array.prototype.push.apply(metadata, componentMetadata);
  }

  return metadata.sort(metadataSorter);
}

function metadataSorter(metadata1, metadata2) {
  var line1 = metadata1[0];
  var line2 = metadata2[0];
  var column1 = metadata1[1];
  var column2 = metadata2[1];

  if (line1 < line2) {
    return -1;
  } else if (line1 === line2) {
    return column1 < column2 ? -1 : 1;
  } else {
    return 1;
  }
}

function buildSequenceWithInheritShorthand(components, shorthandName, validator) {
  var tokensSequence = [];
  var inheritComponents = {};
  var nonInheritComponents = {};
  var descriptor = compactable_1[shorthandName];
  var shorthandToken = [
    token.PROPERTY,
    [token.PROPERTY_NAME, shorthandName],
    [token.PROPERTY_VALUE, 'inherit']
  ];
  var newProperty = wrapSingle$3(shorthandToken);
  var component;
  var longhandToken;
  var nameMetadata;
  var valueMetadata;
  var i, l;

  populateComponents_1([newProperty], validator, []);

  for (i = 0, l = descriptor.components.length; i < l; i++) {
    component = components[descriptor.components[i]];

    if (hasInherit_1(component)) {
      inheritComponents[component.name] = component;
    } else {
      longhandToken = component.all[component.position].slice(0, 2);
      Array.prototype.push.apply(longhandToken, component.value);
      tokensSequence.push(longhandToken);

      nonInheritComponents[component.name] = deepClone(component);
    }
  }

  nameMetadata = joinMetadata(inheritComponents, 1);
  shorthandToken[1].push(nameMetadata);

  valueMetadata = joinMetadata(inheritComponents, 2);
  shorthandToken[2].push(valueMetadata);

  tokensSequence.unshift(shorthandToken);

  return [tokensSequence, newProperty, nonInheritComponents];
}

function findTokenIn(tokens, componentName) {
  var i, l;

  for (i = 0, l = tokens.length; i < l; i++) {
    if (tokens[i][1][1] == componentName) {
      return tokens[i];
    }
  }
}

function replaceWithShorthand(properties, candidateComponents, shorthandName, validator) {
  var descriptor = compactable_1[shorthandName];
  var nameMetadata;
  var valueMetadata;
  var newValuePlaceholder = [
    token.PROPERTY,
    [token.PROPERTY_NAME, shorthandName],
    [token.PROPERTY_VALUE, descriptor.defaultValue]
  ];
  var all;

  var newProperty = wrapSingle$3(newValuePlaceholder);
  newProperty.shorthand = true;
  newProperty.dirty = true;

  populateComponents_1([newProperty], validator, []);

  for (var i = 0, l = descriptor.components.length; i < l; i++) {
    var component = candidateComponents[descriptor.components[i]];

    newProperty.components[i] = deepClone(component);
    newProperty.important = component.important;

    all = component.all;
  }

  for (var componentName in candidateComponents) {
    candidateComponents[componentName].unused = true;
  }

  nameMetadata = joinMetadata(candidateComponents, 1);
  newValuePlaceholder[1].push(nameMetadata);

  valueMetadata = joinMetadata(candidateComponents, 2);
  newValuePlaceholder[2].push(valueMetadata);

  newProperty.position = all.length;
  newProperty.all = all;
  newProperty.all.push(newValuePlaceholder);

  properties.push(newProperty);
}

var mergeIntoShorthands_1 = mergeIntoShorthands;

function findComponentIn(shorthand, longhand) {
  var comparator = nameComparator(longhand);

  return findInDirectComponents(shorthand, comparator) || findInSubComponents(shorthand, comparator);
}

function nameComparator(to) {
  return function (property) {
    return to.name === property.name;
  };
}

function findInDirectComponents(shorthand, comparator) {
  return shorthand.components.filter(comparator)[0];
}

function findInSubComponents(shorthand, comparator) {
  var shorthandComponent;
  var longhandMatch;
  var i, l;

  if (!compactable_1[shorthand.name].shorthandComponents) {
    return;
  }

  for (i = 0, l = shorthand.components.length; i < l; i++) {
    shorthandComponent = shorthand.components[i];
    longhandMatch = findInDirectComponents(shorthandComponent, comparator);

    if (longhandMatch) {
      return longhandMatch;
    }
  }

  return;
}

var findComponentIn_1 = findComponentIn;

function isComponentOf(property1, property2, shallow) {
  return isDirectComponentOf(property1, property2) ||
    !shallow && !!compactable_1[property1.name].shorthandComponents && isSubComponentOf(property1, property2);
}

function isDirectComponentOf(property1, property2) {
  var descriptor = compactable_1[property1.name];

  return 'components' in descriptor && descriptor.components.indexOf(property2.name) > -1;
}

function isSubComponentOf(property1, property2) {
  return property1
    .components
    .some(function (component) {
      return isDirectComponentOf(component, property2);
    });
}

var isComponentOf_1 = isComponentOf;

function isMergeableShorthand(shorthand) {
  if (shorthand.name != 'font') {
    return true;
  }

  return shorthand.value[0][1].indexOf(marker.INTERNAL) == -1;
}

var isMergeableShorthand_1 = isMergeableShorthand;

function overridesNonComponentShorthand(property1, property2) {
  return property1.name in compactable_1 &&
    'overridesShorthands' in compactable_1[property1.name] &&
    compactable_1[property1.name].overridesShorthands.indexOf(property2.name) > -1;
}

var overridesNonComponentShorthand_1 = overridesNonComponentShorthand;

var sameVendorPrefixesIn = vendorPrefixes.same;


var deepClone$1 = clone.deep;

var shallowClone$1 = clone.shallow;






var serializeProperty = oneTime.property;

function wouldBreakCompatibility(property, validator) {
  for (var i = 0; i < property.components.length; i++) {
    var component = property.components[i];
    var descriptor = compactable_1[component.name];
    var canOverride = descriptor && descriptor.canOverride || canOverride.sameValue;

    var _component = shallowClone$1(component);
    _component.value = [[token.PROPERTY_VALUE, descriptor.defaultValue]];

    if (!everyValuesPair_1(canOverride.bind(null, validator), _component, component)) {
      return true;
    }
  }

  return false;
}

function overrideIntoMultiplex(property, by) {
  by.unused = true;

  turnIntoMultiplex(by, multiplexSize(property));
  property.value = by.value;
}

function overrideByMultiplex(property, by) {
  by.unused = true;
  property.multiplex = true;
  property.value = by.value;
}

function overrideSimple(property, by) {
  by.unused = true;
  property.value = by.value;
}

function override$1(property, by) {
  if (by.multiplex)
    overrideByMultiplex(property, by);
  else if (property.multiplex)
    overrideIntoMultiplex(property, by);
  else
    overrideSimple(property, by);
}

function overrideShorthand(property, by) {
  by.unused = true;

  for (var i = 0, l = property.components.length; i < l; i++) {
    override$1(property.components[i], by.components[i], property.multiplex);
  }
}

function turnIntoMultiplex(property, size) {
  property.multiplex = true;

  if (compactable_1[property.name].shorthand) {
    turnShorthandValueIntoMultiplex(property, size);
  } else {
    turnLonghandValueIntoMultiplex(property, size);
  }
}

function turnShorthandValueIntoMultiplex(property, size) {
  var component;
  var i, l;

  for (i = 0, l = property.components.length; i < l; i++) {
    component = property.components[i];

    if (!component.multiplex) {
      turnLonghandValueIntoMultiplex(component, size);
    }
  }
}

function turnLonghandValueIntoMultiplex(property, size) {
  var descriptor = compactable_1[property.name];
  var withRealValue = descriptor.intoMultiplexMode == 'real';
  var withValue = descriptor.intoMultiplexMode == 'real' ?
    property.value.slice(0) :
    (descriptor.intoMultiplexMode == 'placeholder' ? descriptor.placeholderValue : descriptor.defaultValue);
  var i = multiplexSize(property);
  var j;
  var m = withValue.length;

  for (; i < size; i++) {
    property.value.push([token.PROPERTY_VALUE, marker.COMMA]);

    if (Array.isArray(withValue)) {
      for (j = 0; j < m; j++) {
        property.value.push(withRealValue ? withValue[j] : [token.PROPERTY_VALUE, withValue[j]]);
      }
    } else {
      property.value.push(withRealValue ? withValue : [token.PROPERTY_VALUE, withValue]);
    }
  }
}

function multiplexSize(component) {
  var size = 0;

  for (var i = 0, l = component.value.length; i < l; i++) {
    if (component.value[i][1] == marker.COMMA)
      size++;
  }

  return size + 1;
}

function lengthOf(property) {
  var fakeAsArray = [
    token.PROPERTY,
    [token.PROPERTY_NAME, property.name]
  ].concat(property.value);
  return serializeProperty([fakeAsArray], 0).length;
}

function moreSameShorthands(properties, startAt, name) {
  // Since we run the main loop in `compactOverrides` backwards, at this point some
  // properties may not be marked as unused.
  // We should consider reverting the order if possible
  var count = 0;

  for (var i = startAt; i >= 0; i--) {
    if (properties[i].name == name && !properties[i].unused)
      count++;
    if (count > 1)
      break;
  }

  return count > 1;
}

function overridingFunction(shorthand, validator) {
  for (var i = 0, l = shorthand.components.length; i < l; i++) {
    if (!anyValue(validator.isUrl, shorthand.components[i]) && anyValue(validator.isFunction, shorthand.components[i])) {
      return true;
    }
  }

  return false;
}

function anyValue(fn, property) {
  for (var i = 0, l = property.value.length; i < l; i++) {
    if (property.value[i][1] == marker.COMMA)
      continue;

    if (fn(property.value[i][1]))
      return true;
  }

  return false;
}

function wouldResultInLongerValue(left, right) {
  if (!left.multiplex && !right.multiplex || left.multiplex && right.multiplex)
    return false;

  var multiplex = left.multiplex ? left : right;
  var simple = left.multiplex ? right : left;
  var component;

  var multiplexClone = deepClone$1(multiplex);
  restoreFromOptimizing_1([multiplexClone], restoreWithComponents_1);

  var simpleClone = deepClone$1(simple);
  restoreFromOptimizing_1([simpleClone], restoreWithComponents_1);

  var lengthBefore = lengthOf(multiplexClone) + 1 + lengthOf(simpleClone);

  if (left.multiplex) {
    component = findComponentIn_1(multiplexClone, simpleClone);
    overrideIntoMultiplex(component, simpleClone);
  } else {
    component = findComponentIn_1(simpleClone, multiplexClone);
    turnIntoMultiplex(simpleClone, multiplexSize(multiplexClone));
    overrideByMultiplex(component, multiplexClone);
  }

  restoreFromOptimizing_1([simpleClone], restoreWithComponents_1);

  var lengthAfter = lengthOf(simpleClone);

  return lengthBefore <= lengthAfter;
}

function isCompactable(property) {
  return property.name in compactable_1;
}

function noneOverrideHack(left, right) {
  return !left.multiplex &&
    (left.name == 'background' || left.name == 'background-image') &&
    right.multiplex &&
    (right.name == 'background' || right.name == 'background-image') &&
    anyLayerIsNone(right.value);
}

function anyLayerIsNone(values) {
  var layers = intoLayers(values);

  for (var i = 0, l = layers.length; i < l; i++) {
    if (layers[i].length == 1 && layers[i][0][1] == 'none')
      return true;
  }

  return false;
}

function intoLayers(values) {
  var layers = [];

  for (var i = 0, layer = [], l = values.length; i < l; i++) {
    var value = values[i];
    if (value[1] == marker.COMMA) {
      layers.push(layer);
      layer = [];
    } else {
      layer.push(value);
    }
  }

  layers.push(layer);
  return layers;
}

function overrideProperties(properties, withMerging, compatibility, validator) {
  var mayOverride, right, left, component;
  var overriddenComponents;
  var overriddenComponent;
  var overridingComponent;
  var overridable;
  var i, j, k;

  propertyLoop:
  for (i = properties.length - 1; i >= 0; i--) {
    right = properties[i];

    if (!isCompactable(right))
      continue;

    if (right.block)
      continue;

    mayOverride = compactable_1[right.name].canOverride;

    traverseLoop:
    for (j = i - 1; j >= 0; j--) {
      left = properties[j];

      if (!isCompactable(left))
        continue;

      if (left.block)
        continue;

      if (left.unused || right.unused)
        continue;

      if (left.hack && !right.hack && !right.important || !left.hack && !left.important && right.hack)
        continue;

      if (left.important == right.important && left.hack[0] != right.hack[0])
        continue;

      if (left.important == right.important && (left.hack[0] != right.hack[0] || (left.hack[1] && left.hack[1] != right.hack[1])))
        continue;

      if (hasInherit_1(right))
        continue;

      if (noneOverrideHack(left, right))
        continue;

      if (right.shorthand && isComponentOf_1(right, left)) {
        // maybe `left` can be overridden by `right` which is a shorthand?
        if (!right.important && left.important)
          continue;

        if (!sameVendorPrefixesIn([left], right.components))
          continue;

        if (!anyValue(validator.isFunction, left) && overridingFunction(right, validator))
          continue;

        if (!isMergeableShorthand_1(right)) {
          left.unused = true;
          continue;
        }

        component = findComponentIn_1(right, left);
        mayOverride = compactable_1[left.name].canOverride;
        if (everyValuesPair_1(mayOverride.bind(null, validator), left, component)) {
          left.unused = true;
        }
      } else if (right.shorthand && overridesNonComponentShorthand_1(right, left)) {
        // `right` is a shorthand while `left` can be overriden by it, think `border` and `border-top`
        if (!right.important && left.important) {
          continue;
        }

        if (!sameVendorPrefixesIn([left], right.components)) {
          continue;
        }

        if (!anyValue(validator.isFunction, left) && overridingFunction(right, validator)) {
          continue;
        }

        overriddenComponents = left.shorthand ?
          left.components:
          [left];

        for (k = overriddenComponents.length - 1; k >= 0; k--) {
          overriddenComponent = overriddenComponents[k];
          overridingComponent = findComponentIn_1(right, overriddenComponent);
          mayOverride = compactable_1[overriddenComponent.name].canOverride;

          if (!everyValuesPair_1(mayOverride.bind(null, validator), left, overridingComponent)) {
            continue traverseLoop;
          }
        }

        left.unused = true;
      } else if (withMerging && left.shorthand && !right.shorthand && isComponentOf_1(left, right, true)) {
        // maybe `right` can be pulled into `left` which is a shorthand?
        if (right.important && !left.important)
          continue;

        if (!right.important && left.important) {
          right.unused = true;
          continue;
        }

        // Pending more clever algorithm in #527
        if (moreSameShorthands(properties, i - 1, left.name))
          continue;

        if (overridingFunction(left, validator))
          continue;

        if (!isMergeableShorthand_1(left))
          continue;

        component = findComponentIn_1(left, right);
        if (everyValuesPair_1(mayOverride.bind(null, validator), component, right)) {
          var disabledBackgroundMerging =
            !compatibility.properties.backgroundClipMerging && component.name.indexOf('background-clip') > -1 ||
            !compatibility.properties.backgroundOriginMerging && component.name.indexOf('background-origin') > -1 ||
            !compatibility.properties.backgroundSizeMerging && component.name.indexOf('background-size') > -1;
          var nonMergeableValue = compactable_1[right.name].nonMergeableValue === right.value[0][1];

          if (disabledBackgroundMerging || nonMergeableValue)
            continue;

          if (!compatibility.properties.merging && wouldBreakCompatibility(left, validator))
            continue;

          if (component.value[0][1] != right.value[0][1] && (hasInherit_1(left) || hasInherit_1(right)))
            continue;

          if (wouldResultInLongerValue(left, right))
            continue;

          if (!left.multiplex && right.multiplex)
            turnIntoMultiplex(left, multiplexSize(right));

          override$1(component, right);
          left.dirty = true;
        }
      } else if (withMerging && left.shorthand && right.shorthand && left.name == right.name) {
        // merge if all components can be merged

        if (!left.multiplex && right.multiplex)
          continue;

        if (!right.important && left.important) {
          right.unused = true;
          continue propertyLoop;
        }

        if (right.important && !left.important) {
          left.unused = true;
          continue;
        }

        if (!isMergeableShorthand_1(right)) {
          left.unused = true;
          continue;
        }

        for (k = left.components.length - 1; k >= 0; k--) {
          var leftComponent = left.components[k];
          var rightComponent = right.components[k];

          mayOverride = compactable_1[leftComponent.name].canOverride;
          if (!everyValuesPair_1(mayOverride.bind(null, validator), leftComponent, rightComponent))
            continue propertyLoop;
        }

        overrideShorthand(left, right);
        left.dirty = true;
      } else if (withMerging && left.shorthand && right.shorthand && isComponentOf_1(left, right)) {
        // border is a shorthand but any of its components is a shorthand too

        if (!left.important && right.important)
          continue;

        component = findComponentIn_1(left, right);
        mayOverride = compactable_1[right.name].canOverride;
        if (!everyValuesPair_1(mayOverride.bind(null, validator), component, right))
          continue;

        if (left.important && !right.important) {
          right.unused = true;
          continue;
        }

        var rightRestored = compactable_1[right.name].restore(right, compactable_1);
        if (rightRestored.length > 1)
          continue;

        component = findComponentIn_1(left, right);
        override$1(component, right);
        right.dirty = true;
      } else if (left.name == right.name) {
        // two non-shorthands should be merged based on understandability
        overridable = true;

        if (right.shorthand) {
          for (k = right.components.length - 1; k >= 0 && overridable; k--) {
            overriddenComponent = left.components[k];
            overridingComponent = right.components[k];
            mayOverride = compactable_1[overridingComponent.name].canOverride;

            overridable = overridable && everyValuesPair_1(mayOverride.bind(null, validator), overriddenComponent, overridingComponent);
          }
        } else {
          mayOverride = compactable_1[right.name].canOverride;
          overridable = everyValuesPair_1(mayOverride.bind(null, validator), left, right);
        }

        if (left.important && !right.important && overridable) {
          right.unused = true;
          continue;
        }

        if (!left.important && right.important && overridable) {
          left.unused = true;
          continue;
        }

        if (!overridable) {
          continue;
        }

        left.unused = true;
      }
    }
  }
}

var overrideProperties_1 = overrideProperties;

var wrapForOptimizing$2 = wrapForOptimizing.all;



var OptimizationLevel$2 = optimizationLevel.OptimizationLevel;

function optimizeProperties(properties, withOverriding, withMerging, context) {
  var levelOptions = context.options.level[OptimizationLevel$2.Two];
  var _properties = wrapForOptimizing$2(properties, false, levelOptions.skipProperties);
  var _property;
  var i, l;

  populateComponents_1(_properties, context.validator, context.warnings);

  for (i = 0, l = _properties.length; i < l; i++) {
    _property = _properties[i];
    if (_property.block) {
      optimizeProperties(_property.value[0][1], withOverriding, withMerging, context);
    }
  }

  if (withMerging && levelOptions.mergeIntoShorthands) {
    mergeIntoShorthands_1(_properties, context.validator);
  }

  if (withOverriding && levelOptions.overrideProperties) {
    overrideProperties_1(_properties, withMerging, context.options.compatibility, context.validator);
  }

  restoreFromOptimizing_1(_properties, restoreWithComponents_1);
  removeUnused_1(_properties);
}

var optimize$2 = optimizeProperties;

var OptimizationLevel$3 = optimizationLevel.OptimizationLevel;

var serializeBody$1 = oneTime.body;
var serializeRules$1 = oneTime.rules;



function mergeAdjacent(tokens, context) {
  var lastToken = [null, [], []];
  var options = context.options;
  var adjacentSpace = options.compatibility.selectors.adjacentSpace;
  var selectorsSortingMethod = options.level[OptimizationLevel$3.One].selectorsSortingMethod;
  var mergeablePseudoClasses = options.compatibility.selectors.mergeablePseudoClasses;
  var mergeablePseudoElements = options.compatibility.selectors.mergeablePseudoElements;
  var mergeLimit = options.compatibility.selectors.mergeLimit;
  var multiplePseudoMerging = options.compatibility.selectors.multiplePseudoMerging;

  for (var i = 0, l = tokens.length; i < l; i++) {
    var token$1 = tokens[i];

    if (token$1[0] != token.RULE) {
      lastToken = [null, [], []];
      continue;
    }

    if (lastToken[0] == token.RULE && serializeRules$1(token$1[1]) == serializeRules$1(lastToken[1])) {
      Array.prototype.push.apply(lastToken[2], token$1[2]);
      optimize$2(lastToken[2], true, true, context);
      token$1[2] = [];
    } else if (lastToken[0] == token.RULE && serializeBody$1(token$1[2]) == serializeBody$1(lastToken[2]) &&
        isMergeable_1(serializeRules$1(token$1[1]), mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging) &&
        isMergeable_1(serializeRules$1(lastToken[1]), mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging) &&
        lastToken[1].length < mergeLimit) {
      lastToken[1] = tidyRules_1(lastToken[1].concat(token$1[1]), false, adjacentSpace, false, context.warnings);
      lastToken[1] = lastToken.length > 1 ? sortSelectors_1(lastToken[1], selectorsSortingMethod) : lastToken[1];
      token$1[2] = [];
    } else {
      lastToken = token$1;
    }
  }
}

var mergeAdjacent_1 = mergeAdjacent;

var MODIFIER_PATTERN = /\-\-.+$/;

function rulesOverlap(rule1, rule2, bemMode) {
  var scope1;
  var scope2;
  var i, l;
  var j, m;

  for (i = 0, l = rule1.length; i < l; i++) {
    scope1 = rule1[i][1];

    for (j = 0, m = rule2.length; j < m; j++) {
      scope2 = rule2[j][1];

      if (scope1 == scope2) {
        return true;
      }

      if (bemMode && withoutModifiers(scope1) == withoutModifiers(scope2)) {
        return true;
      }
    }
  }

  return false;
}

function withoutModifiers(scope) {
  return scope.replace(MODIFIER_PATTERN, '');
}

var rulesOverlap_1 = rulesOverlap;

var Selector = {
  ADJACENT_SIBLING: '+',
  DESCENDANT: '>',
  DOT: '.',
  HASH: '#',
  NON_ADJACENT_SIBLING: '~',
  PSEUDO: ':'
};

var LETTER_PATTERN = /[a-zA-Z]/;
var NOT_PREFIX = ':not(';
var SEPARATOR_PATTERN = /[\s,\(>~\+]/;

function specificity(selector) {
  var result = [0, 0, 0];
  var character;
  var isEscaped;
  var isSingleQuoted;
  var isDoubleQuoted;
  var roundBracketLevel = 0;
  var couldIntroduceNewTypeSelector;
  var withinNotPseudoClass = false;
  var wasPseudoClass = false;
  var i, l;

  for (i = 0, l = selector.length; i < l; i++) {
    character = selector[i];

    if (isEscaped) ; else if (character == marker.SINGLE_QUOTE && !isDoubleQuoted && !isSingleQuoted) {
      isSingleQuoted = true;
    } else if (character == marker.SINGLE_QUOTE && !isDoubleQuoted && isSingleQuoted) {
      isSingleQuoted = false;
    } else if (character == marker.DOUBLE_QUOTE && !isDoubleQuoted && !isSingleQuoted) {
      isDoubleQuoted = true;
    } else if (character == marker.DOUBLE_QUOTE && isDoubleQuoted && !isSingleQuoted) {
      isDoubleQuoted = false;
    } else if (isSingleQuoted || isDoubleQuoted) {
      continue;
    } else if (roundBracketLevel > 0 && !withinNotPseudoClass) ; else if (character == marker.OPEN_ROUND_BRACKET) {
      roundBracketLevel++;
    } else if (character == marker.CLOSE_ROUND_BRACKET && roundBracketLevel == 1) {
      roundBracketLevel--;
      withinNotPseudoClass = false;
    } else if (character == marker.CLOSE_ROUND_BRACKET) {
      roundBracketLevel--;
    } else if (character == Selector.HASH) {
      result[0]++;
    } else if (character == Selector.DOT || character == marker.OPEN_SQUARE_BRACKET) {
      result[1]++;
    } else if (character == Selector.PSEUDO && !wasPseudoClass && !isNotPseudoClass(selector, i)) {
      result[1]++;
      withinNotPseudoClass = false;
    } else if (character == Selector.PSEUDO) {
      withinNotPseudoClass = true;
    } else if ((i === 0 || couldIntroduceNewTypeSelector) && LETTER_PATTERN.test(character)) {
      result[2]++;
    }

    isEscaped = character == marker.BACK_SLASH;
    wasPseudoClass = character == Selector.PSEUDO;
    couldIntroduceNewTypeSelector = !isEscaped && SEPARATOR_PATTERN.test(character);
  }

  return result;
}

function isNotPseudoClass(selector, index) {
  return selector.indexOf(NOT_PREFIX, index) === index;
}

var specificity_1 = specificity;

function specificitiesOverlap(selector1, selector2, cache) {
  var specificity1;
  var specificity2;
  var i, l;
  var j, m;

  for (i = 0, l = selector1.length; i < l; i++) {
    specificity1 = findSpecificity(selector1[i][1], cache);

    for (j = 0, m = selector2.length; j < m; j++) {
      specificity2 = findSpecificity(selector2[j][1], cache);

      if (specificity1[0] === specificity2[0] && specificity1[1] === specificity2[1] && specificity1[2] === specificity2[2]) {
        return true;
      }
    }
  }

  return false;
}

function findSpecificity(selector, cache) {
  var value;

  if (!(selector in cache)) {
    cache[selector] = value = specificity_1(selector);
  }

  return value || cache[selector];
}

var specificitiesOverlap_1 = specificitiesOverlap;

// TODO: it'd be great to merge it with the other canReorder functionality




var FLEX_PROPERTIES = /align\-items|box\-align|box\-pack|flex|justify/;
var BORDER_PROPERTIES = /^border\-(top|right|bottom|left|color|style|width|radius)/;

function canReorder(left, right, cache) {
  for (var i = right.length - 1; i >= 0; i--) {
    for (var j = left.length - 1; j >= 0; j--) {
      if (!canReorderSingle(left[j], right[i], cache))
        return false;
    }
  }

  return true;
}

function canReorderSingle(left, right, cache) {
  var leftName = left[0];
  var leftValue = left[1];
  var leftNameRoot = left[2];
  var leftSelector = left[5];
  var leftInSpecificSelector = left[6];
  var rightName = right[0];
  var rightValue = right[1];
  var rightNameRoot = right[2];
  var rightSelector = right[5];
  var rightInSpecificSelector = right[6];

  if (leftName == 'font' && rightName == 'line-height' || rightName == 'font' && leftName == 'line-height')
    return false;
  if (FLEX_PROPERTIES.test(leftName) && FLEX_PROPERTIES.test(rightName))
    return false;
  if (leftNameRoot == rightNameRoot && unprefixed(leftName) == unprefixed(rightName) && (vendorPrefixed(leftName) ^ vendorPrefixed(rightName)))
    return false;
  if (leftNameRoot == 'border' && BORDER_PROPERTIES.test(rightNameRoot) && (leftName == 'border' || leftName == rightNameRoot || (leftValue != rightValue && sameBorderComponent(leftName, rightName))))
    return false;
  if (rightNameRoot == 'border' && BORDER_PROPERTIES.test(leftNameRoot) && (rightName == 'border' || rightName == leftNameRoot || (leftValue != rightValue && sameBorderComponent(leftName, rightName))))
    return false;
  if (leftNameRoot == 'border' && rightNameRoot == 'border' && leftName != rightName && (isSideBorder(leftName) && isStyleBorder(rightName) || isStyleBorder(leftName) && isSideBorder(rightName)))
    return false;
  if (leftNameRoot != rightNameRoot)
    return true;
  if (leftName == rightName && leftNameRoot == rightNameRoot && (leftValue == rightValue || withDifferentVendorPrefix(leftValue, rightValue)))
    return true;
  if (leftName != rightName && leftNameRoot == rightNameRoot && leftName != leftNameRoot && rightName != rightNameRoot)
    return true;
  if (leftName != rightName && leftNameRoot == rightNameRoot && leftValue == rightValue)
    return true;
  if (rightInSpecificSelector && leftInSpecificSelector && !inheritable(leftNameRoot) && !inheritable(rightNameRoot) && !rulesOverlap_1(rightSelector, leftSelector, false))
    return true;
  if (!specificitiesOverlap_1(leftSelector, rightSelector, cache))
    return true;

  return false;
}

function vendorPrefixed(name) {
  return /^\-(?:moz|webkit|ms|o)\-/.test(name);
}

function unprefixed(name) {
  return name.replace(/^\-(?:moz|webkit|ms|o)\-/, '');
}

function sameBorderComponent(name1, name2) {
  return name1.split('-').pop() == name2.split('-').pop();
}

function isSideBorder(name) {
  return name == 'border-top' || name == 'border-right' || name == 'border-bottom' || name == 'border-left';
}

function isStyleBorder(name) {
  return name == 'border-color' || name == 'border-style' || name == 'border-width';
}

function withDifferentVendorPrefix(value1, value2) {
  return vendorPrefixed(value1) && vendorPrefixed(value2) && value1.split('-')[1] != value2.split('-')[2];
}

function inheritable(name) {
  // According to http://www.w3.org/TR/CSS21/propidx.html
  // Others will be catched by other, preceeding rules
  return name == 'font' || name == 'line-height' || name == 'list-style';
}

var reorderable = {
  canReorder: canReorder,
  canReorderSingle: canReorderSingle
};

// This extractor is used in level 2 optimizations
// IMPORTANT: Mind Token class and this code is not related!
// Properties will be tokenized in one step, see #429


var serializeRules$2 = oneTime.rules;
var serializeValue = oneTime.value;

function extractProperties(token$1) {
  var properties = [];
  var inSpecificSelector;
  var property;
  var name;
  var value;
  var i, l;

  if (token$1[0] == token.RULE) {
    inSpecificSelector = !/[\.\+>~]/.test(serializeRules$2(token$1[1]));

    for (i = 0, l = token$1[2].length; i < l; i++) {
      property = token$1[2][i];

      if (property[0] != token.PROPERTY)
        continue;

      name = property[1][1];
      if (name.length === 0)
        continue;

      if (name.indexOf('--') === 0)
        continue;

      value = serializeValue(property, i);

      properties.push([
        name,
        value,
        findNameRoot(name),
        token$1[2][i],
        name + ':' + value,
        token$1[1],
        inSpecificSelector
      ]);
    }
  } else if (token$1[0] == token.NESTED_BLOCK) {
    for (i = 0, l = token$1[2].length; i < l; i++) {
      properties = properties.concat(extractProperties(token$1[2][i]));
    }
  }

  return properties;
}

function findNameRoot(name) {
  if (name == 'list-style')
    return name;
  if (name.indexOf('-radius') > 0)
    return 'border-radius';
  if (name == 'border-collapse' || name == 'border-spacing' || name == 'border-image')
    return name;
  if (name.indexOf('border-') === 0 && /^border\-\w+\-\w+$/.test(name))
    return name.match(/border\-\w+/)[0];
  if (name.indexOf('border-') === 0 && /^border\-\w+$/.test(name))
    return 'border';
  if (name.indexOf('text-') === 0)
    return name;
  if (name == '-chrome-')
    return name;

  return name.replace(/^\-\w+\-/, '').match(/([a-zA-Z]+)/)[0].toLowerCase();
}

var extractProperties_1 = extractProperties;

var canReorder$1 = reorderable.canReorder;
var canReorderSingle$1 = reorderable.canReorderSingle;



var serializeRules$3 = oneTime.rules;
var OptimizationLevel$4 = optimizationLevel.OptimizationLevel;


function mergeMediaQueries(tokens, context) {
  var mergeSemantically = context.options.level[OptimizationLevel$4.Two].mergeSemantically;
  var specificityCache = context.cache.specificity;
  var candidates = {};
  var reduced = [];

  for (var i = tokens.length - 1; i >= 0; i--) {
    var token$1 = tokens[i];
    if (token$1[0] != token.NESTED_BLOCK) {
      continue;
    }

    var key = serializeRules$3(token$1[1]);
    var candidate = candidates[key];
    if (!candidate) {
      candidate = [];
      candidates[key] = candidate;
    }

    candidate.push(i);
  }

  for (var name in candidates) {
    var positions = candidates[name];

    positionLoop:
    for (var j = positions.length - 1; j > 0; j--) {
      var positionOne = positions[j];
      var tokenOne = tokens[positionOne];
      var positionTwo = positions[j - 1];
      var tokenTwo = tokens[positionTwo];

      directionLoop:
      for (var direction = 1; direction >= -1; direction -= 2) {
        var topToBottom = direction == 1;
        var from = topToBottom ? positionOne + 1 : positionTwo - 1;
        var to = topToBottom ? positionTwo : positionOne;
        var delta = topToBottom ? 1 : -1;
        var source = topToBottom ? tokenOne : tokenTwo;
        var target = topToBottom ? tokenTwo : tokenOne;
        var movedProperties = extractProperties_1(source);

        while (from != to) {
          var traversedProperties = extractProperties_1(tokens[from]);
          from += delta;

          if (mergeSemantically && allSameRulePropertiesCanBeReordered(movedProperties, traversedProperties, specificityCache)) {
            continue;
          }

          if (!canReorder$1(movedProperties, traversedProperties, specificityCache))
            continue directionLoop;
        }

        target[2] = topToBottom ?
          source[2].concat(target[2]) :
          target[2].concat(source[2]);
        source[2] = [];

        reduced.push(target);
        continue positionLoop;
      }
    }
  }

  return reduced;
}

function allSameRulePropertiesCanBeReordered(movedProperties, traversedProperties, specificityCache) {
  var movedProperty;
  var movedRule;
  var traversedProperty;
  var traversedRule;
  var i, l;
  var j, m;

  for (i = 0, l = movedProperties.length; i < l; i++) {
    movedProperty = movedProperties[i];
    movedRule = movedProperty[5];

    for (j = 0, m = traversedProperties.length; j < m; j++) {
      traversedProperty = traversedProperties[j];
      traversedRule = traversedProperty[5];

      if (rulesOverlap_1(movedRule, traversedRule, true) && !canReorderSingle$1(movedProperty, traversedProperty, specificityCache)) {
        return false;
      }
    }
  }

  return true;
}

var mergeMediaQueries_1 = mergeMediaQueries;

var OptimizationLevel$5 = optimizationLevel.OptimizationLevel;

var serializeBody$2 = oneTime.body;
var serializeRules$4 = oneTime.rules;



function unsafeSelector(value) {
  return /\.|\*| :/.test(value);
}

function isBemElement(token) {
  var asString = serializeRules$4(token[1]);
  return asString.indexOf('__') > -1 || asString.indexOf('--') > -1;
}

function withoutModifier(selector) {
  return selector.replace(/--[^ ,>\+~:]+/g, '');
}

function removeAnyUnsafeElements(left, candidates) {
  var leftSelector = withoutModifier(serializeRules$4(left[1]));

  for (var body in candidates) {
    var right = candidates[body];
    var rightSelector = withoutModifier(serializeRules$4(right[1]));

    if (rightSelector.indexOf(leftSelector) > -1 || leftSelector.indexOf(rightSelector) > -1)
      delete candidates[body];
  }
}

function mergeNonAdjacentByBody(tokens, context) {
  var options = context.options;
  var mergeSemantically = options.level[OptimizationLevel$5.Two].mergeSemantically;
  var adjacentSpace = options.compatibility.selectors.adjacentSpace;
  var selectorsSortingMethod = options.level[OptimizationLevel$5.One].selectorsSortingMethod;
  var mergeablePseudoClasses = options.compatibility.selectors.mergeablePseudoClasses;
  var mergeablePseudoElements = options.compatibility.selectors.mergeablePseudoElements;
  var multiplePseudoMerging = options.compatibility.selectors.multiplePseudoMerging;
  var candidates = {};

  for (var i = tokens.length - 1; i >= 0; i--) {
    var token$1 = tokens[i];
    if (token$1[0] != token.RULE)
      continue;

    if (token$1[2].length > 0 && (!mergeSemantically && unsafeSelector(serializeRules$4(token$1[1]))))
      candidates = {};

    if (token$1[2].length > 0 && mergeSemantically && isBemElement(token$1))
      removeAnyUnsafeElements(token$1, candidates);

    var candidateBody = serializeBody$2(token$1[2]);
    var oldToken = candidates[candidateBody];
    if (oldToken &&
        isMergeable_1(serializeRules$4(token$1[1]), mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging) &&
        isMergeable_1(serializeRules$4(oldToken[1]), mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging)) {

      if (token$1[2].length > 0) {
        token$1[1] = tidyRules_1(oldToken[1].concat(token$1[1]), false, adjacentSpace, false, context.warnings);
        token$1[1] = token$1[1].length > 1 ? sortSelectors_1(token$1[1], selectorsSortingMethod) : token$1[1];
      } else {
        token$1[1] = oldToken[1].concat(token$1[1]);
      }

      oldToken[2] = [];
      candidates[candidateBody] = null;
    }

    candidates[serializeBody$2(token$1[2])] = token$1;
  }
}

var mergeNonAdjacentByBody_1 = mergeNonAdjacentByBody;

var canReorder$2 = reorderable.canReorder;




var serializeRules$5 = oneTime.rules;



function mergeNonAdjacentBySelector(tokens, context) {
  var specificityCache = context.cache.specificity;
  var allSelectors = {};
  var repeatedSelectors = [];
  var i;

  for (i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i][0] != token.RULE)
      continue;
    if (tokens[i][2].length === 0)
      continue;

    var selector = serializeRules$5(tokens[i][1]);
    allSelectors[selector] = [i].concat(allSelectors[selector] || []);

    if (allSelectors[selector].length == 2)
      repeatedSelectors.push(selector);
  }

  for (i = repeatedSelectors.length - 1; i >= 0; i--) {
    var positions = allSelectors[repeatedSelectors[i]];

    selectorIterator:
    for (var j = positions.length - 1; j > 0; j--) {
      var positionOne = positions[j - 1];
      var tokenOne = tokens[positionOne];
      var positionTwo = positions[j];
      var tokenTwo = tokens[positionTwo];

      directionIterator:
      for (var direction = 1; direction >= -1; direction -= 2) {
        var topToBottom = direction == 1;
        var from = topToBottom ? positionOne + 1 : positionTwo - 1;
        var to = topToBottom ? positionTwo : positionOne;
        var delta = topToBottom ? 1 : -1;
        var moved = topToBottom ? tokenOne : tokenTwo;
        var target = topToBottom ? tokenTwo : tokenOne;
        var movedProperties = extractProperties_1(moved);

        while (from != to) {
          var traversedProperties = extractProperties_1(tokens[from]);
          from += delta;

          // traversed then moved as we move selectors towards the start
          var reorderable = topToBottom ?
            canReorder$2(movedProperties, traversedProperties, specificityCache) :
            canReorder$2(traversedProperties, movedProperties, specificityCache);

          if (!reorderable && !topToBottom)
            continue selectorIterator;
          if (!reorderable && topToBottom)
            continue directionIterator;
        }

        if (topToBottom) {
          Array.prototype.push.apply(moved[2], target[2]);
          target[2] = moved[2];
        } else {
          Array.prototype.push.apply(target[2], moved[2]);
        }

        optimize$2(target[2], true, true, context);
        moved[2] = [];
      }
    }
  }
}

var mergeNonAdjacentBySelector_1 = mergeNonAdjacentBySelector;

function cloneArray(array) {
  var cloned = array.slice(0);

  for (var i = 0, l = cloned.length; i < l; i++) {
    if (Array.isArray(cloned[i]))
      cloned[i] = cloneArray(cloned[i]);
  }

  return cloned;
}

var cloneArray_1 = cloneArray;

var serializeBody$3 = oneTime.body;
var serializeRules$6 = oneTime.rules;

function reduceNonAdjacent(tokens, context) {
  var options = context.options;
  var mergeablePseudoClasses = options.compatibility.selectors.mergeablePseudoClasses;
  var mergeablePseudoElements = options.compatibility.selectors.mergeablePseudoElements;
  var multiplePseudoMerging = options.compatibility.selectors.multiplePseudoMerging;
  var candidates = {};
  var repeated = [];

  for (var i = tokens.length - 1; i >= 0; i--) {
    var token$1 = tokens[i];

    if (token$1[0] != token.RULE) {
      continue;
    } else if (token$1[2].length === 0) {
      continue;
    }

    var selectorAsString = serializeRules$6(token$1[1]);
    var isComplexAndNotSpecial = token$1[1].length > 1 &&
      isMergeable_1(selectorAsString, mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging);
    var wrappedSelectors = wrappedSelectorsFrom(token$1[1]);
    var selectors = isComplexAndNotSpecial ?
      [selectorAsString].concat(wrappedSelectors) :
      [selectorAsString];

    for (var j = 0, m = selectors.length; j < m; j++) {
      var selector = selectors[j];

      if (!candidates[selector])
        candidates[selector] = [];
      else
        repeated.push(selector);

      candidates[selector].push({
        where: i,
        list: wrappedSelectors,
        isPartial: isComplexAndNotSpecial && j > 0,
        isComplex: isComplexAndNotSpecial && j === 0
      });
    }
  }

  reduceSimpleNonAdjacentCases(tokens, repeated, candidates, options, context);
  reduceComplexNonAdjacentCases(tokens, candidates, options, context);
}

function wrappedSelectorsFrom(list) {
  var wrapped = [];

  for (var i = 0; i < list.length; i++) {
    wrapped.push([list[i][1]]);
  }

  return wrapped;
}

function reduceSimpleNonAdjacentCases(tokens, repeated, candidates, options, context) {
  function filterOut(idx, bodies) {
    return data[idx].isPartial && bodies.length === 0;
  }

  function reduceBody(token, newBody, processedCount, tokenIdx) {
    if (!data[processedCount - tokenIdx - 1].isPartial)
      token[2] = newBody;
  }

  for (var i = 0, l = repeated.length; i < l; i++) {
    var selector = repeated[i];
    var data = candidates[selector];

    reduceSelector(tokens, data, {
      filterOut: filterOut,
      callback: reduceBody
    }, options, context);
  }
}

function reduceComplexNonAdjacentCases(tokens, candidates, options, context) {
  var mergeablePseudoClasses = options.compatibility.selectors.mergeablePseudoClasses;
  var mergeablePseudoElements = options.compatibility.selectors.mergeablePseudoElements;
  var multiplePseudoMerging = options.compatibility.selectors.multiplePseudoMerging;
  var localContext = {};

  function filterOut(idx) {
    return localContext.data[idx].where < localContext.intoPosition;
  }

  function collectReducedBodies(token, newBody, processedCount, tokenIdx) {
    if (tokenIdx === 0)
      localContext.reducedBodies.push(newBody);
  }

  allSelectors:
  for (var complexSelector in candidates) {
    var into = candidates[complexSelector];
    if (!into[0].isComplex)
      continue;

    var intoPosition = into[into.length - 1].where;
    var intoToken = tokens[intoPosition];
    var reducedBodies = [];

    var selectors = isMergeable_1(complexSelector, mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging) ?
      into[0].list :
      [complexSelector];

    localContext.intoPosition = intoPosition;
    localContext.reducedBodies = reducedBodies;

    for (var j = 0, m = selectors.length; j < m; j++) {
      var selector = selectors[j];
      var data = candidates[selector];

      if (data.length < 2)
        continue allSelectors;

      localContext.data = data;

      reduceSelector(tokens, data, {
        filterOut: filterOut,
        callback: collectReducedBodies
      }, options, context);

      if (serializeBody$3(reducedBodies[reducedBodies.length - 1]) != serializeBody$3(reducedBodies[0]))
        continue allSelectors;
    }

    intoToken[2] = reducedBodies[0];
  }
}

function reduceSelector(tokens, data, context, options, outerContext) {
  var bodies = [];
  var bodiesAsList = [];
  var processedTokens = [];

  for (var j = data.length - 1; j >= 0; j--) {
    if (context.filterOut(j, bodies))
      continue;

    var where = data[j].where;
    var token = tokens[where];
    var clonedBody = cloneArray_1(token[2]);

    bodies = bodies.concat(clonedBody);
    bodiesAsList.push(clonedBody);
    processedTokens.push(where);
  }

  optimize$2(bodies, true, false, outerContext);

  var processedCount = processedTokens.length;
  var propertyIdx = bodies.length - 1;
  var tokenIdx = processedCount - 1;

  while (tokenIdx >= 0) {
     if ((tokenIdx === 0 || (bodies[propertyIdx] && bodiesAsList[tokenIdx].indexOf(bodies[propertyIdx]) > -1)) && propertyIdx > -1) {
      propertyIdx--;
      continue;
    }

    var newBody = bodies.splice(propertyIdx + 1);
    context.callback(tokens[processedTokens[tokenIdx]], newBody, processedCount, tokenIdx);

    tokenIdx--;
  }
}

var reduceNonAdjacent_1 = reduceNonAdjacent;

var serializeAll = oneTime.all;

var FONT_FACE_SCOPE = '@font-face';

function removeDuplicateFontAtRules(tokens) {
  var fontAtRules = [];
  var token$1;
  var key;
  var i, l;

  for (i = 0, l = tokens.length; i < l; i++) {
    token$1 = tokens[i];

    if (token$1[0] != token.AT_RULE_BLOCK && token$1[1][0][1] != FONT_FACE_SCOPE) {
      continue;
    }

    key = serializeAll([token$1]);

    if (fontAtRules.indexOf(key) > -1) {
      token$1[2] = [];
    } else {
      fontAtRules.push(key);
    }
  }
}

var removeDuplicateFontAtRules_1 = removeDuplicateFontAtRules;

var serializeAll$1 = oneTime.all;
var serializeRules$7 = oneTime.rules;

function removeDuplicateMediaQueries(tokens) {
  var candidates = {};
  var candidate;
  var token$1;
  var key;
  var i, l;

  for (i = 0, l = tokens.length; i < l; i++) {
    token$1 = tokens[i];
    if (token$1[0] != token.NESTED_BLOCK) {
      continue;
    }

    key = serializeRules$7(token$1[1]) + '%' + serializeAll$1(token$1[2]);
    candidate = candidates[key];

    if (candidate) {
      candidate[2] = [];
    }

    candidates[key] = token$1;
  }
}

var removeDuplicateMediaQueries_1 = removeDuplicateMediaQueries;

var serializeBody$4 = oneTime.body;
var serializeRules$8 = oneTime.rules;

function removeDuplicates(tokens) {
  var matched = {};
  var moreThanOnce = [];
  var id, token$1;
  var body, bodies;

  for (var i = 0, l = tokens.length; i < l; i++) {
    token$1 = tokens[i];
    if (token$1[0] != token.RULE)
      continue;

    id = serializeRules$8(token$1[1]);

    if (matched[id] && matched[id].length == 1)
      moreThanOnce.push(id);
    else
      matched[id] = matched[id] || [];

    matched[id].push(i);
  }

  for (i = 0, l = moreThanOnce.length; i < l; i++) {
    id = moreThanOnce[i];
    bodies = [];

    for (var j = matched[id].length - 1; j >= 0; j--) {
      token$1 = tokens[matched[id][j]];
      body = serializeBody$4(token$1[2]);

      if (bodies.indexOf(body) > -1)
        token$1[2] = [];
      else
        bodies.push(body);
    }
  }
}

var removeDuplicates_1 = removeDuplicates;

var wrapForOptimizing$3 = wrapForOptimizing.single;




var animationNameRegex = /^(\-moz\-|\-o\-|\-webkit\-)?animation-name$/;
var animationRegex = /^(\-moz\-|\-o\-|\-webkit\-)?animation$/;
var keyframeRegex = /^@(\-moz\-|\-o\-|\-webkit\-)?keyframes /;
var importantRegex = /\s{0,31}!important$/;
var optionalMatchingQuotesRegex = /^(['"]?)(.*)\1$/;

function normalize(value) {
  return value
    .replace(optionalMatchingQuotesRegex, '$2')
    .replace(importantRegex, '');
}

function removeUnusedAtRules(tokens, context) {
  removeUnusedAtRule(tokens, matchCounterStyle, markCounterStylesAsUsed, context);
  removeUnusedAtRule(tokens, matchFontFace, markFontFacesAsUsed, context);
  removeUnusedAtRule(tokens, matchKeyframe, markKeyframesAsUsed, context);
  removeUnusedAtRule(tokens, matchNamespace, markNamespacesAsUsed, context);
}

function removeUnusedAtRule(tokens, matchCallback, markCallback, context) {
  var atRules = {};
  var atRule;
  var atRuleTokens;
  var atRuleToken;
  var zeroAt;
  var i, l;

  for (i = 0, l = tokens.length; i < l; i++) {
    matchCallback(tokens[i], atRules);
  }

  if (Object.keys(atRules).length === 0) {
    return;
  }

  markUsedAtRules(tokens, markCallback, atRules, context);

  for (atRule in atRules) {
    atRuleTokens = atRules[atRule];

    for (i = 0, l = atRuleTokens.length; i < l; i++) {
      atRuleToken = atRuleTokens[i];
      zeroAt = atRuleToken[0] == token.AT_RULE ? 1 : 2;
      atRuleToken[zeroAt] = [];
    }
  }
}

function markUsedAtRules(tokens, markCallback, atRules, context) {
  var boundMarkCallback = markCallback(atRules);
  var i, l;

  for (i = 0, l = tokens.length; i < l; i++) {
    switch (tokens[i][0]) {
      case token.RULE:
        boundMarkCallback(tokens[i], context);
        break;
      case token.NESTED_BLOCK:
        markUsedAtRules(tokens[i][2], markCallback, atRules, context);
    }
  }
}

function matchCounterStyle(token$1, atRules) {
  var match;

  if (token$1[0] == token.AT_RULE_BLOCK && token$1[1][0][1].indexOf('@counter-style') === 0) {
    match = token$1[1][0][1].split(' ')[1];
    atRules[match] = atRules[match] || [];
    atRules[match].push(token$1);
  }
}

function markCounterStylesAsUsed(atRules) {
  return function (token, context) {
    var property;
    var wrappedProperty;
    var i, l;

    for (i = 0, l = token[2].length; i < l; i++) {
      property = token[2][i];

      if (property[1][1] == 'list-style') {
        wrappedProperty = wrapForOptimizing$3(property);
        populateComponents_1([wrappedProperty], context.validator, context.warnings);

        if (wrappedProperty.components[0].value[0][1] in atRules) {
          delete atRules[property[2][1]];
        }

        restoreFromOptimizing_1([wrappedProperty]);
      }

      if (property[1][1] == 'list-style-type' && property[2][1] in atRules) {
        delete atRules[property[2][1]];
      }
    }
  };
}

function matchFontFace(token$1, atRules) {
  var property;
  var match;
  var i, l;

  if (token$1[0] == token.AT_RULE_BLOCK && token$1[1][0][1] == '@font-face') {
    for (i = 0, l = token$1[2].length; i < l; i++) {
      property = token$1[2][i];

      if (property[1][1] == 'font-family') {
        match = normalize(property[2][1].toLowerCase());
        atRules[match] = atRules[match] || [];
        atRules[match].push(token$1);
        break;
      }
    }
  }
}

function markFontFacesAsUsed(atRules) {
  return function (token, context) {
    var property;
    var wrappedProperty;
    var component;
    var normalizedMatch;
    var i, l;
    var j, m;

    for (i = 0, l = token[2].length; i < l; i++) {
      property = token[2][i];

      if (property[1][1] == 'font') {
        wrappedProperty = wrapForOptimizing$3(property);
        populateComponents_1([wrappedProperty], context.validator, context.warnings);
        component = wrappedProperty.components[6];

        for (j = 0, m = component.value.length; j < m; j++) {
          normalizedMatch = normalize(component.value[j][1].toLowerCase());

          if (normalizedMatch in atRules) {
            delete atRules[normalizedMatch];
          }
        }

        restoreFromOptimizing_1([wrappedProperty]);
      }

      if (property[1][1] == 'font-family') {
        for (j = 2, m = property.length; j < m; j++) {
          normalizedMatch = normalize(property[j][1].toLowerCase());

          if (normalizedMatch in atRules) {
            delete atRules[normalizedMatch];
          }
        }
      }
    }
  };
}

function matchKeyframe(token$1, atRules) {
  var match;

  if (token$1[0] == token.NESTED_BLOCK && keyframeRegex.test(token$1[1][0][1])) {
    match = token$1[1][0][1].split(' ')[1];
    atRules[match] = atRules[match] || [];
    atRules[match].push(token$1);
  }
}

function markKeyframesAsUsed(atRules) {
  return function (token, context) {
    var property;
    var wrappedProperty;
    var component;
    var i, l;
    var j, m;

    for (i = 0, l = token[2].length; i < l; i++) {
      property = token[2][i];

      if (animationRegex.test(property[1][1])) {
        wrappedProperty = wrapForOptimizing$3(property);
        populateComponents_1([wrappedProperty], context.validator, context.warnings);
        component = wrappedProperty.components[7];

        for (j = 0, m = component.value.length; j < m; j++) {
          if (component.value[j][1] in atRules) {
            delete atRules[component.value[j][1]];
          }
        }

        restoreFromOptimizing_1([wrappedProperty]);
      }

      if (animationNameRegex.test(property[1][1])) {
        for (j = 2, m = property.length; j < m; j++) {
          if (property[j][1] in atRules) {
            delete atRules[property[j][1]];
          }
        }
      }
    }
  };
}

function matchNamespace(token$1, atRules) {
  var match;

  if (token$1[0] == token.AT_RULE && token$1[1].indexOf('@namespace') === 0) {
    match = token$1[1].split(' ')[1];
    atRules[match] = atRules[match] || [];
    atRules[match].push(token$1);
  }
}

function markNamespacesAsUsed(atRules) {
  var namespaceRegex = new RegExp(Object.keys(atRules).join('\\\||') + '\\\|', 'g');

  return function (token) {
    var match;
    var scope;
    var normalizedMatch;
    var i, l;
    var j, m;

    for (i = 0, l = token[1].length; i < l; i++) {
      scope = token[1][i];
      match = scope[1].match(namespaceRegex);

      for (j = 0, m = match.length; j < m; j++) {
        normalizedMatch = match[j].substring(0, match[j].length - 1);

        if (normalizedMatch in atRules) {
          delete atRules[normalizedMatch];
        }
      }
    }
  };
}

var removeUnusedAtRules_1 = removeUnusedAtRules;

function ruleSorter(s1, s2) {
  return s1[1] > s2[1] ? 1 : -1;
}

function tidyRuleDuplicates(rules) {
  var list = [];
  var repeated = [];

  for (var i = 0, l = rules.length; i < l; i++) {
    var rule = rules[i];

    if (repeated.indexOf(rule[1]) == -1) {
      repeated.push(rule[1]);
      list.push(rule);
    }
  }

  return list.sort(ruleSorter);
}

var tidyRuleDuplicates_1 = tidyRuleDuplicates;

var canReorderSingle$2 = reorderable.canReorderSingle;








var serializeBody$5 = oneTime.body;
var serializeRules$9 = oneTime.rules;

function naturalSorter$1(a, b) {
  return a > b ? 1 : -1;
}

function cloneAndMergeSelectors(propertyA, propertyB) {
  var cloned = cloneArray_1(propertyA);
  cloned[5] = cloned[5].concat(propertyB[5]);

  return cloned;
}

function restructure(tokens, context) {
  var options = context.options;
  var mergeablePseudoClasses = options.compatibility.selectors.mergeablePseudoClasses;
  var mergeablePseudoElements = options.compatibility.selectors.mergeablePseudoElements;
  var mergeLimit = options.compatibility.selectors.mergeLimit;
  var multiplePseudoMerging = options.compatibility.selectors.multiplePseudoMerging;
  var specificityCache = context.cache.specificity;
  var movableTokens = {};
  var movedProperties = [];
  var multiPropertyMoveCache = {};
  var movedToBeDropped = [];
  var maxCombinationsLevel = 2;
  var ID_JOIN_CHARACTER = '%';

  function sendToMultiPropertyMoveCache(position, movedProperty, allFits) {
    for (var i = allFits.length - 1; i >= 0; i--) {
      var fit = allFits[i][0];
      var id = addToCache(movedProperty, fit);

      if (multiPropertyMoveCache[id].length > 1 && processMultiPropertyMove(position, multiPropertyMoveCache[id])) {
        removeAllMatchingFromCache(id);
        break;
      }
    }
  }

  function addToCache(movedProperty, fit) {
    var id = cacheId(fit);
    multiPropertyMoveCache[id] = multiPropertyMoveCache[id] || [];
    multiPropertyMoveCache[id].push([movedProperty, fit]);
    return id;
  }

  function removeAllMatchingFromCache(matchId) {
    var matchSelectors = matchId.split(ID_JOIN_CHARACTER);
    var forRemoval = [];
    var i;

    for (var id in multiPropertyMoveCache) {
      var selectors = id.split(ID_JOIN_CHARACTER);
      for (i = selectors.length - 1; i >= 0; i--) {
        if (matchSelectors.indexOf(selectors[i]) > -1) {
          forRemoval.push(id);
          break;
        }
      }
    }

    for (i = forRemoval.length - 1; i >= 0; i--) {
      delete multiPropertyMoveCache[forRemoval[i]];
    }
  }

  function cacheId(cachedTokens) {
    var id = [];
    for (var i = 0, l = cachedTokens.length; i < l; i++) {
      id.push(serializeRules$9(cachedTokens[i][1]));
    }
    return id.join(ID_JOIN_CHARACTER);
  }

  function tokensToMerge(sourceTokens) {
    var uniqueTokensWithBody = [];
    var mergeableTokens = [];

    for (var i = sourceTokens.length - 1; i >= 0; i--) {
      if (!isMergeable_1(serializeRules$9(sourceTokens[i][1]), mergeablePseudoClasses, mergeablePseudoElements, multiplePseudoMerging)) {
        continue;
      }

      mergeableTokens.unshift(sourceTokens[i]);
      if (sourceTokens[i][2].length > 0 && uniqueTokensWithBody.indexOf(sourceTokens[i]) == -1)
        uniqueTokensWithBody.push(sourceTokens[i]);
    }

    return uniqueTokensWithBody.length > 1 ?
      mergeableTokens :
      [];
  }

  function shortenIfPossible(position, movedProperty) {
    var name = movedProperty[0];
    var value = movedProperty[1];
    var key = movedProperty[4];
    var valueSize = name.length + value.length + 1;
    var allSelectors = [];
    var qualifiedTokens = [];

    var mergeableTokens = tokensToMerge(movableTokens[key]);
    if (mergeableTokens.length < 2)
      return;

    var allFits = findAllFits(mergeableTokens, valueSize, 1);
    var bestFit = allFits[0];
    if (bestFit[1] > 0)
      return sendToMultiPropertyMoveCache(position, movedProperty, allFits);

    for (var i = bestFit[0].length - 1; i >=0; i--) {
      allSelectors = bestFit[0][i][1].concat(allSelectors);
      qualifiedTokens.unshift(bestFit[0][i]);
    }

    allSelectors = tidyRuleDuplicates_1(allSelectors);
    dropAsNewTokenAt(position, [movedProperty], allSelectors, qualifiedTokens);
  }

  function fitSorter(fit1, fit2) {
    return fit1[1] > fit2[1] ? 1 : (fit1[1] == fit2[1] ? 0 : -1);
  }

  function findAllFits(mergeableTokens, propertySize, propertiesCount) {
    var combinations = allCombinations(mergeableTokens, propertySize, propertiesCount, maxCombinationsLevel - 1);
    return combinations.sort(fitSorter);
  }

  function allCombinations(tokensVariant, propertySize, propertiesCount, level) {
    var differenceVariants = [[tokensVariant, sizeDifference(tokensVariant, propertySize, propertiesCount)]];
    if (tokensVariant.length > 2 && level > 0) {
      for (var i = tokensVariant.length - 1; i >= 0; i--) {
        var subVariant = Array.prototype.slice.call(tokensVariant, 0);
        subVariant.splice(i, 1);
        differenceVariants = differenceVariants.concat(allCombinations(subVariant, propertySize, propertiesCount, level - 1));
      }
    }

    return differenceVariants;
  }

  function sizeDifference(tokensVariant, propertySize, propertiesCount) {
    var allSelectorsSize = 0;
    for (var i = tokensVariant.length - 1; i >= 0; i--) {
      allSelectorsSize += tokensVariant[i][2].length > propertiesCount ? serializeRules$9(tokensVariant[i][1]).length : -1;
    }
    return allSelectorsSize - (tokensVariant.length - 1) * propertySize + 1;
  }

  function dropAsNewTokenAt(position, properties, allSelectors, mergeableTokens) {
    var i, j, k, m;
    var allProperties = [];

    for (i = mergeableTokens.length - 1; i >= 0; i--) {
      var mergeableToken = mergeableTokens[i];

      for (j = mergeableToken[2].length - 1; j >= 0; j--) {
        var mergeableProperty = mergeableToken[2][j];

        for (k = 0, m = properties.length; k < m; k++) {
          var property = properties[k];

          var mergeablePropertyName = mergeableProperty[1][1];
          var propertyName = property[0];
          var propertyBody = property[4];
          if (mergeablePropertyName == propertyName && serializeBody$5([mergeableProperty]) == propertyBody) {
            mergeableToken[2].splice(j, 1);
            break;
          }
        }
      }
    }

    for (i = properties.length - 1; i >= 0; i--) {
      allProperties.unshift(properties[i][3]);
    }

    var newToken = [token.RULE, allSelectors, allProperties];
    tokens.splice(position, 0, newToken);
  }

  function dropPropertiesAt(position, movedProperty) {
    var key = movedProperty[4];
    var toMove = movableTokens[key];

    if (toMove && toMove.length > 1) {
      if (!shortenMultiMovesIfPossible(position, movedProperty))
        shortenIfPossible(position, movedProperty);
    }
  }

  function shortenMultiMovesIfPossible(position, movedProperty) {
    var candidates = [];
    var propertiesAndMergableTokens = [];
    var key = movedProperty[4];
    var j, k;

    var mergeableTokens = tokensToMerge(movableTokens[key]);
    if (mergeableTokens.length < 2)
      return;

    movableLoop:
    for (var value in movableTokens) {
      var tokensList = movableTokens[value];

      for (j = mergeableTokens.length - 1; j >= 0; j--) {
        if (tokensList.indexOf(mergeableTokens[j]) == -1)
          continue movableLoop;
      }

      candidates.push(value);
    }

    if (candidates.length < 2)
      return false;

    for (j = candidates.length - 1; j >= 0; j--) {
      for (k = movedProperties.length - 1; k >= 0; k--) {
        if (movedProperties[k][4] == candidates[j]) {
          propertiesAndMergableTokens.unshift([movedProperties[k], mergeableTokens]);
          break;
        }
      }
    }

    return processMultiPropertyMove(position, propertiesAndMergableTokens);
  }

  function processMultiPropertyMove(position, propertiesAndMergableTokens) {
    var valueSize = 0;
    var properties = [];
    var property;

    for (var i = propertiesAndMergableTokens.length - 1; i >= 0; i--) {
      property = propertiesAndMergableTokens[i][0];
      var fullValue = property[4];
      valueSize += fullValue.length + (i > 0 ? 1 : 0);

      properties.push(property);
    }

    var mergeableTokens = propertiesAndMergableTokens[0][1];
    var bestFit = findAllFits(mergeableTokens, valueSize, properties.length)[0];
    if (bestFit[1] > 0)
      return false;

    var allSelectors = [];
    var qualifiedTokens = [];
    for (i = bestFit[0].length - 1; i >= 0; i--) {
      allSelectors = bestFit[0][i][1].concat(allSelectors);
      qualifiedTokens.unshift(bestFit[0][i]);
    }

    allSelectors = tidyRuleDuplicates_1(allSelectors);
    dropAsNewTokenAt(position, properties, allSelectors, qualifiedTokens);

    for (i = properties.length - 1; i >= 0; i--) {
      property = properties[i];
      var index = movedProperties.indexOf(property);

      delete movableTokens[property[4]];

      if (index > -1 && movedToBeDropped.indexOf(index) == -1)
        movedToBeDropped.push(index);
    }

    return true;
  }

  function boundToAnotherPropertyInCurrrentToken(property, movedProperty, token) {
    var propertyName = property[0];
    var movedPropertyName = movedProperty[0];
    if (propertyName != movedPropertyName)
      return false;

    var key = movedProperty[4];
    var toMove = movableTokens[key];
    return toMove && toMove.indexOf(token) > -1;
  }

  for (var i = tokens.length - 1; i >= 0; i--) {
    var token$1 = tokens[i];
    var isRule;
    var j, k, m;
    var samePropertyAt;

    if (token$1[0] == token.RULE) {
      isRule = true;
    } else if (token$1[0] == token.NESTED_BLOCK) {
      isRule = false;
    } else {
      continue;
    }

    // We cache movedProperties.length as it may change in the loop
    var movedCount = movedProperties.length;

    var properties = extractProperties_1(token$1);
    movedToBeDropped = [];

    var unmovableInCurrentToken = [];
    for (j = properties.length - 1; j >= 0; j--) {
      for (k = j - 1; k >= 0; k--) {
        if (!canReorderSingle$2(properties[j], properties[k], specificityCache)) {
          unmovableInCurrentToken.push(j);
          break;
        }
      }
    }

    for (j = properties.length - 1; j >= 0; j--) {
      var property = properties[j];
      var movedSameProperty = false;

      for (k = 0; k < movedCount; k++) {
        var movedProperty = movedProperties[k];

        if (movedToBeDropped.indexOf(k) == -1 && (!canReorderSingle$2(property, movedProperty, specificityCache) && !boundToAnotherPropertyInCurrrentToken(property, movedProperty, token$1) ||
            movableTokens[movedProperty[4]] && movableTokens[movedProperty[4]].length === mergeLimit)) {
          dropPropertiesAt(i + 1, movedProperty);

          if (movedToBeDropped.indexOf(k) == -1) {
            movedToBeDropped.push(k);
            delete movableTokens[movedProperty[4]];
          }
        }

        if (!movedSameProperty) {
          movedSameProperty = property[0] == movedProperty[0] && property[1] == movedProperty[1];

          if (movedSameProperty) {
            samePropertyAt = k;
          }
        }
      }

      if (!isRule || unmovableInCurrentToken.indexOf(j) > -1)
        continue;

      var key = property[4];

      if (movedSameProperty && movedProperties[samePropertyAt][5].length + property[5].length > mergeLimit) {
        dropPropertiesAt(i + 1, movedProperties[samePropertyAt]);
        movedProperties.splice(samePropertyAt, 1);
        movableTokens[key] = [token$1];
        movedSameProperty = false;
      } else {
        movableTokens[key] = movableTokens[key] || [];
        movableTokens[key].push(token$1);
      }

      if (movedSameProperty) {
        movedProperties[samePropertyAt] = cloneAndMergeSelectors(movedProperties[samePropertyAt], property);
      } else {
        movedProperties.push(property);
      }
    }

    movedToBeDropped = movedToBeDropped.sort(naturalSorter$1);
    for (j = 0, m = movedToBeDropped.length; j < m; j++) {
      var dropAt = movedToBeDropped[j] - j;
      movedProperties.splice(dropAt, 1);
    }
  }

  var position = tokens[0] && tokens[0][0] == token.AT_RULE && tokens[0][1].indexOf('@charset') === 0 ? 1 : 0;
  for (; position < tokens.length - 1; position++) {
    var isImportRule = tokens[position][0] === token.AT_RULE && tokens[position][1].indexOf('@import') === 0;
    var isComment = tokens[position][0] === token.COMMENT;
    if (!(isImportRule || isComment))
      break;
  }

  for (i = 0; i < movedProperties.length; i++) {
    dropPropertiesAt(position, movedProperties[i]);
  }
}

var restructure_1 = restructure;

var OptimizationLevel$6 = optimizationLevel.OptimizationLevel;



function removeEmpty(tokens) {
  for (var i = 0, l = tokens.length; i < l; i++) {
    var token$1 = tokens[i];
    var isEmpty = false;

    switch (token$1[0]) {
      case token.RULE:
        isEmpty = token$1[1].length === 0 || token$1[2].length === 0;
        break;
      case token.NESTED_BLOCK:
        removeEmpty(token$1[2]);
        isEmpty = token$1[2].length === 0;
        break;
      case token.AT_RULE:
        isEmpty = token$1[1].length === 0;
        break;
      case token.AT_RULE_BLOCK:
        isEmpty = token$1[2].length === 0;
    }

    if (isEmpty) {
      tokens.splice(i, 1);
      i--;
      l--;
    }
  }
}

function recursivelyOptimizeBlocks(tokens, context) {
  for (var i = 0, l = tokens.length; i < l; i++) {
    var token$1 = tokens[i];

    if (token$1[0] == token.NESTED_BLOCK) {
      var isKeyframes = /@(-moz-|-o-|-webkit-)?keyframes/.test(token$1[1][0][1]);
      level2Optimize(token$1[2], context, !isKeyframes);
    }
  }
}

function recursivelyOptimizeProperties(tokens, context) {
  for (var i = 0, l = tokens.length; i < l; i++) {
    var token$1 = tokens[i];

    switch (token$1[0]) {
      case token.RULE:
        optimize$2(token$1[2], true, true, context);
        break;
      case token.NESTED_BLOCK:
        recursivelyOptimizeProperties(token$1[2], context);
    }
  }
}

function level2Optimize(tokens, context, withRestructuring) {
  var levelOptions = context.options.level[OptimizationLevel$6.Two];
  var reduced;
  var i;

  recursivelyOptimizeBlocks(tokens, context);
  recursivelyOptimizeProperties(tokens, context);

  if (levelOptions.removeDuplicateRules) {
    removeDuplicates_1(tokens);
  }

  if (levelOptions.mergeAdjacentRules) {
    mergeAdjacent_1(tokens, context);
  }

  if (levelOptions.reduceNonAdjacentRules) {
    reduceNonAdjacent_1(tokens, context);
  }

  if (levelOptions.mergeNonAdjacentRules && levelOptions.mergeNonAdjacentRules != 'body') {
    mergeNonAdjacentBySelector_1(tokens, context);
  }

  if (levelOptions.mergeNonAdjacentRules && levelOptions.mergeNonAdjacentRules != 'selector') {
    mergeNonAdjacentByBody_1(tokens, context);
  }

  if (levelOptions.restructureRules && levelOptions.mergeAdjacentRules && withRestructuring) {
    restructure_1(tokens, context);
    mergeAdjacent_1(tokens, context);
  }

  if (levelOptions.restructureRules && !levelOptions.mergeAdjacentRules && withRestructuring) {
    restructure_1(tokens, context);
  }

  if (levelOptions.removeDuplicateFontRules) {
    removeDuplicateFontAtRules_1(tokens);
  }

  if (levelOptions.removeDuplicateMediaBlocks) {
    removeDuplicateMediaQueries_1(tokens);
  }

  if (levelOptions.removeUnusedAtRules) {
    removeUnusedAtRules_1(tokens, context);
  }

  if (levelOptions.mergeMedia) {
    reduced = mergeMediaQueries_1(tokens, context);
    for (i = reduced.length - 1; i >= 0; i--) {
      level2Optimize(reduced[i][2], context, false);
    }
  }

  if (levelOptions.removeEmpty) {
    removeEmpty(tokens);
  }

  return tokens;
}

var optimize$3 = level2Optimize;

var functionNoVendorRegexStr = '[A-Z]+(\\-|[A-Z]|[0-9])+\\(.*?\\)';
var functionVendorRegexStr = '\\-(\\-|[A-Z]|[0-9])+\\(.*?\\)';
var variableRegexStr = 'var\\(\\-\\-[^\\)]+\\)';
var functionAnyRegexStr = '(' + variableRegexStr + '|' + functionNoVendorRegexStr + '|' + functionVendorRegexStr + ')';

var calcRegex = new RegExp('^(\\-moz\\-|\\-webkit\\-)?calc\\([^\\)]+\\)$', 'i');
var decimalRegex = /[0-9]/;
var functionAnyRegex = new RegExp('^' + functionAnyRegexStr + '$', 'i');
var hslColorRegex = /^hsl\(\s{0,31}[\-\.]?\d+\s{0,31},\s{0,31}\.?\d+%\s{0,31},\s{0,31}\.?\d+%\s{0,31}\)|hsla\(\s{0,31}[\-\.]?\d+\s{0,31},\s{0,31}\.?\d+%\s{0,31},\s{0,31}\.?\d+%\s{0,31},\s{0,31}\.?\d+\s{0,31}\)$/i;
var identifierRegex = /^(\-[a-z0-9_][a-z0-9\-_]*|[a-z][a-z0-9\-_]*)$/i;
var namedEntityRegex = /^[a-z]+$/i;
var prefixRegex = /^-([a-z0-9]|-)*$/i;
var rgbColorRegex = /^rgb\(\s{0,31}[\d]{1,3}\s{0,31},\s{0,31}[\d]{1,3}\s{0,31},\s{0,31}[\d]{1,3}\s{0,31}\)|rgba\(\s{0,31}[\d]{1,3}\s{0,31},\s{0,31}[\d]{1,3}\s{0,31},\s{0,31}[\d]{1,3}\s{0,31},\s{0,31}[\.\d]+\s{0,31}\)$/i;
var timingFunctionRegex = /^(cubic\-bezier|steps)\([^\)]+\)$/;
var validTimeUnits = ['ms', 's'];
var urlRegex = /^url\([\s\S]+\)$/i;
var variableRegex = new RegExp('^' + variableRegexStr + '$', 'i');

var eightValueColorRegex = /^#[0-9a-f]{8}$/i;
var fourValueColorRegex = /^#[0-9a-f]{4}$/i;
var sixValueColorRegex = /^#[0-9a-f]{6}$/i;
var threeValueColorRegex = /^#[0-9a-f]{3}$/i;

var DECIMAL_DOT = '.';
var MINUS_SIGN = '-';
var PLUS_SIGN = '+';

var Keywords = {
  '^': [
    'inherit',
    'initial',
    'unset'
  ],
  '*-style': [
    'auto',
    'dashed',
    'dotted',
    'double',
    'groove',
    'hidden',
    'inset',
    'none',
    'outset',
    'ridge',
    'solid'
  ],
  '*-timing-function': [
    'ease',
    'ease-in',
    'ease-in-out',
    'ease-out',
    'linear',
    'step-end',
    'step-start'
  ],
  'animation-direction': [
    'alternate',
    'alternate-reverse',
    'normal',
    'reverse'
  ],
  'animation-fill-mode': [
    'backwards',
    'both',
    'forwards',
    'none'
  ],
  'animation-iteration-count': [
    'infinite'
  ],
  'animation-name': [
    'none'
  ],
  'animation-play-state': [
    'paused',
    'running'
  ],
  'background-attachment': [
    'fixed',
    'inherit',
    'local',
    'scroll'
  ],
  'background-clip': [
    'border-box',
    'content-box',
    'inherit',
    'padding-box',
    'text'
  ],
  'background-origin': [
    'border-box',
    'content-box',
    'inherit',
    'padding-box'
  ],
  'background-position': [
    'bottom',
    'center',
    'left',
    'right',
    'top'
  ],
  'background-repeat': [
    'no-repeat',
    'inherit',
    'repeat',
    'repeat-x',
    'repeat-y',
    'round',
    'space'
  ],
  'background-size': [
    'auto',
    'cover',
    'contain'
  ],
  'border-collapse': [
    'collapse',
    'inherit',
    'separate'
  ],
  'bottom': [
    'auto'
  ],
  'clear': [
    'both',
    'left',
    'none',
    'right'
  ],
  'color': [
    'transparent'
  ],
  'cursor': [
    'all-scroll',
    'auto',
    'col-resize',
    'crosshair',
    'default',
    'e-resize',
    'help',
    'move',
    'n-resize',
    'ne-resize',
    'no-drop',
    'not-allowed',
    'nw-resize',
    'pointer',
    'progress',
    'row-resize',
    's-resize',
    'se-resize',
    'sw-resize',
    'text',
    'vertical-text',
    'w-resize',
    'wait'
  ],
  'display': [
    'block',
    'inline',
    'inline-block',
    'inline-table',
    'list-item',
    'none',
    'table',
    'table-caption',
    'table-cell',
    'table-column',
    'table-column-group',
    'table-footer-group',
    'table-header-group',
    'table-row',
    'table-row-group'
  ],
  'float': [
    'left',
    'none',
    'right'
  ],
  'left': [
    'auto'
  ],
  'font': [
    'caption',
    'icon',
    'menu',
    'message-box',
    'small-caption',
    'status-bar',
    'unset'
  ],
  'font-size': [
    'large',
    'larger',
    'medium',
    'small',
    'smaller',
    'x-large',
    'x-small',
    'xx-large',
    'xx-small'
  ],
  'font-stretch': [
    'condensed',
    'expanded',
    'extra-condensed',
    'extra-expanded',
    'normal',
    'semi-condensed',
    'semi-expanded',
    'ultra-condensed',
    'ultra-expanded'
  ],
  'font-style': [
    'italic',
    'normal',
    'oblique'
  ],
  'font-variant': [
    'normal',
    'small-caps'
  ],
  'font-weight': [
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    'bold',
    'bolder',
    'lighter',
    'normal'
  ],
  'line-height': [
    'normal'
  ],
  'list-style-position': [
    'inside',
    'outside'
  ],
  'list-style-type': [
    'armenian',
    'circle',
    'decimal',
    'decimal-leading-zero',
    'disc',
    'decimal|disc', // this is the default value of list-style-type, see comment in compactable.js
    'georgian',
    'lower-alpha',
    'lower-greek',
    'lower-latin',
    'lower-roman',
    'none',
    'square',
    'upper-alpha',
    'upper-latin',
    'upper-roman'
  ],
  'overflow': [
    'auto',
    'hidden',
    'scroll',
    'visible'
  ],
  'position': [
    'absolute',
    'fixed',
    'relative',
    'static'
  ],
  'right': [
    'auto'
  ],
  'text-align': [
    'center',
    'justify',
    'left',
    'left|right', // this is the default value of list-style-type, see comment in compactable.js
    'right'
  ],
  'text-decoration': [
    'line-through',
    'none',
    'overline',
    'underline'
  ],
  'text-overflow': [
    'clip',
    'ellipsis'
  ],
  'top': [
    'auto'
  ],
  'vertical-align': [
    'baseline',
    'bottom',
    'middle',
    'sub',
    'super',
    'text-bottom',
    'text-top',
    'top'
  ],
  'visibility': [
    'collapse',
    'hidden',
    'visible'
  ],
  'white-space': [
    'normal',
    'nowrap',
    'pre'
  ],
  'width': [
    'inherit',
    'initial',
    'medium',
    'thick',
    'thin'
  ]
};

var Units = [
  '%',
  'ch',
  'cm',
  'em',
  'ex',
  'in',
  'mm',
  'pc',
  'pt',
  'px',
  'rem',
  'vh',
  'vm',
  'vmax',
  'vmin',
  'vw'
];

function isColor(value) {
  return value != 'auto' &&
    (
      isKeyword('color')(value) ||
      isHexColor(value) ||
      isColorFunction(value) ||
      isNamedEntity(value)
    );
}

function isColorFunction(value) {
  return isRgbColor(value) || isHslColor(value);
}

function isDynamicUnit(value) {
  return calcRegex.test(value);
}

function isFunction(value) {
  return functionAnyRegex.test(value);
}

function isHexColor(value) {
  return threeValueColorRegex.test(value) || fourValueColorRegex.test(value) || sixValueColorRegex.test(value) || eightValueColorRegex.test(value);
}

function isHslColor(value) {
  return hslColorRegex.test(value);
}

function isIdentifier(value) {
  return identifierRegex.test(value);
}

function isImage(value) {
  return value == 'none' || value == 'inherit' || isUrl$1(value);
}

function isKeyword(propertyName) {
  return function(value) {
    return Keywords[propertyName].indexOf(value) > -1;
  };
}

function isNamedEntity(value) {
  return namedEntityRegex.test(value);
}

function isNumber(value) {
  return scanForNumber(value) == value.length;
}

function isRgbColor(value) {
  return rgbColorRegex.test(value);
}

function isPrefixed(value) {
  return prefixRegex.test(value);
}

function isPositiveNumber(value) {
  return isNumber(value) &&
    parseFloat(value) >= 0;
}

function isVariable(value) {
  return variableRegex.test(value);
}

function isTime(value) {
  var numberUpTo = scanForNumber(value);

  return numberUpTo == value.length && parseInt(value) === 0 ||
    numberUpTo > -1 && validTimeUnits.indexOf(value.slice(numberUpTo + 1)) > -1;
}

function isTimingFunction() {
  var isTimingFunctionKeyword = isKeyword('*-timing-function');

  return function (value) {
    return isTimingFunctionKeyword(value) || timingFunctionRegex.test(value);
  };
}

function isUnit(validUnits, value) {
  var numberUpTo = scanForNumber(value);

  return numberUpTo == value.length && parseInt(value) === 0 ||
    numberUpTo > -1 && validUnits.indexOf(value.slice(numberUpTo + 1)) > -1 ||
    value == 'auto' ||
    value == 'inherit';
}

function isUrl$1(value) {
  return urlRegex.test(value);
}

function isZIndex(value) {
  return value == 'auto' ||
    isNumber(value) ||
    isKeyword('^')(value);
}

function scanForNumber(value) {
  var hasDot = false;
  var hasSign = false;
  var character;
  var i, l;

  for (i = 0, l = value.length; i < l; i++) {
    character = value[i];

    if (i === 0 && (character == PLUS_SIGN || character == MINUS_SIGN)) {
      hasSign = true;
    } else if (i > 0 && hasSign && (character == PLUS_SIGN || character == MINUS_SIGN)) {
      return i - 1;
    } else if (character == DECIMAL_DOT && !hasDot) {
      hasDot = true;
    } else if (character == DECIMAL_DOT && hasDot) {
      return i - 1;
    } else if (decimalRegex.test(character)) {
      continue;
    } else {
      return i - 1;
    }
  }

  return i;
}

function validator(compatibility) {
  var validUnits = Units.slice(0).filter(function (value) {
    return !(value in compatibility.units) || compatibility.units[value] === true;
  });

  return {
    colorOpacity: compatibility.colors.opacity,
    isAnimationDirectionKeyword: isKeyword('animation-direction'),
    isAnimationFillModeKeyword: isKeyword('animation-fill-mode'),
    isAnimationIterationCountKeyword: isKeyword('animation-iteration-count'),
    isAnimationNameKeyword: isKeyword('animation-name'),
    isAnimationPlayStateKeyword: isKeyword('animation-play-state'),
    isTimingFunction: isTimingFunction(),
    isBackgroundAttachmentKeyword: isKeyword('background-attachment'),
    isBackgroundClipKeyword: isKeyword('background-clip'),
    isBackgroundOriginKeyword: isKeyword('background-origin'),
    isBackgroundPositionKeyword: isKeyword('background-position'),
    isBackgroundRepeatKeyword: isKeyword('background-repeat'),
    isBackgroundSizeKeyword: isKeyword('background-size'),
    isColor: isColor,
    isColorFunction: isColorFunction,
    isDynamicUnit: isDynamicUnit,
    isFontKeyword: isKeyword('font'),
    isFontSizeKeyword: isKeyword('font-size'),
    isFontStretchKeyword: isKeyword('font-stretch'),
    isFontStyleKeyword: isKeyword('font-style'),
    isFontVariantKeyword: isKeyword('font-variant'),
    isFontWeightKeyword: isKeyword('font-weight'),
    isFunction: isFunction,
    isGlobal: isKeyword('^'),
    isHslColor: isHslColor,
    isIdentifier: isIdentifier,
    isImage: isImage,
    isKeyword: isKeyword,
    isLineHeightKeyword: isKeyword('line-height'),
    isListStylePositionKeyword: isKeyword('list-style-position'),
    isListStyleTypeKeyword: isKeyword('list-style-type'),
    isNumber: isNumber,
    isPrefixed: isPrefixed,
    isPositiveNumber: isPositiveNumber,
    isRgbColor: isRgbColor,
    isStyleKeyword: isKeyword('*-style'),
    isTime: isTime,
    isUnit: isUnit.bind(null, validUnits),
    isUrl: isUrl$1,
    isVariable: isVariable,
    isWidth: isKeyword('width'),
    isZIndex: isZIndex
  };
}

var validator_1 = validator;

var DEFAULTS$2 = {
  '*': {
    colors: {
      opacity: true // rgba / hsla
    },
    properties: {
      backgroundClipMerging: true, // background-clip to shorthand
      backgroundOriginMerging: true, // background-origin to shorthand
      backgroundSizeMerging: true, // background-size to shorthand
      colors: true, // any kind of color transformations, like `#ff00ff` to `#f0f` or `#fff` into `red`
      ieBangHack: false, // !ie suffix hacks on IE<8
      ieFilters: false, // whether to preserve `filter` and `-ms-filter` properties
      iePrefixHack: false, // underscore / asterisk prefix hacks on IE
      ieSuffixHack: false, // \9 suffix hacks on IE6-9
      merging: true, // merging properties into one
      shorterLengthUnits: false, // optimize pixel units into `pt`, `pc` or `in` units
      spaceAfterClosingBrace: true, // 'url() no-repeat' to 'url()no-repeat'
      urlQuotes: false, // whether to wrap content of `url()` into quotes or not
      zeroUnits: true // 0[unit] -> 0
    },
    selectors: {
      adjacentSpace: false, // div+ nav Android stock browser hack
      ie7Hack: false, // *+html hack
      mergeablePseudoClasses: [
        ':active',
        ':after',
        ':before',
        ':empty',
        ':checked',
        ':disabled',
        ':empty',
        ':enabled',
        ':first-child',
        ':first-letter',
        ':first-line',
        ':first-of-type',
        ':focus',
        ':hover',
        ':lang',
        ':last-child',
        ':last-of-type',
        ':link',
        ':not',
        ':nth-child',
        ':nth-last-child',
        ':nth-last-of-type',
        ':nth-of-type',
        ':only-child',
        ':only-of-type',
        ':root',
        ':target',
        ':visited'
      ], // selectors with these pseudo-classes can be merged as these are universally supported
      mergeablePseudoElements: [
        '::after',
        '::before',
        '::first-letter',
        '::first-line'
      ], // selectors with these pseudo-elements can be merged as these are universally supported
      mergeLimit: 8191, // number of rules that can be safely merged together
      multiplePseudoMerging: true
    },
    units: {
      ch: true,
      in: true,
      pc: true,
      pt: true,
      rem: true,
      vh: true,
      vm: true, // vm is vmin on IE9+ see https://developer.mozilla.org/en-US/docs/Web/CSS/length
      vmax: true,
      vmin: true,
      vw: true
    }
  }
};

DEFAULTS$2.ie11 = DEFAULTS$2['*'];

DEFAULTS$2.ie10 = DEFAULTS$2['*'];

DEFAULTS$2.ie9 = merge(DEFAULTS$2['*'], {
  properties: {
    ieFilters: true,
    ieSuffixHack: true
  }
});

DEFAULTS$2.ie8 = merge(DEFAULTS$2.ie9, {
  colors: {
    opacity: false
  },
  properties: {
    backgroundClipMerging: false,
    backgroundOriginMerging: false,
    backgroundSizeMerging: false,
    iePrefixHack: true,
    merging: false
  },
  selectors: {
    mergeablePseudoClasses: [
      ':after',
      ':before',
      ':first-child',
      ':first-letter',
      ':focus',
      ':hover',
      ':visited'
    ],
    mergeablePseudoElements: []
  },
  units: {
    ch: false,
    rem: false,
    vh: false,
    vm: false,
    vmax: false,
    vmin: false,
    vw: false
  }
});

DEFAULTS$2.ie7 = merge(DEFAULTS$2.ie8, {
  properties: {
    ieBangHack: true
  },
  selectors: {
    ie7Hack: true,
    mergeablePseudoClasses: [
      ':first-child',
      ':first-letter',
      ':hover',
      ':visited'
    ]
  },
});

function compatibilityFrom(source) {
  return merge(DEFAULTS$2['*'], calculateSource(source));
}

function merge(source, target) {
  for (var key in source) {
    var value = source[key];

    if (typeof value === 'object' && !Array.isArray(value)) {
      target[key] = merge(value, target[key] || {});
    } else {
      target[key] = key in target ? target[key] : value;
    }
  }

  return target;
}

function calculateSource(source) {
  if (typeof source == 'object')
    return source;

  if (!/[,\+\-]/.test(source))
    return DEFAULTS$2[source] || DEFAULTS$2['*'];

  var parts = source.split(',');
  var template = parts[0] in DEFAULTS$2 ?
    DEFAULTS$2[parts.shift()] :
    DEFAULTS$2['*'];

  source = {};

  parts.forEach(function (part) {
    var isAdd = part[0] == '+';
    var key = part.substring(1).split('.');
    var group = key[0];
    var option = key[1];

    source[group] = source[group] || {};
    source[group][option] = isAdd;
  });

  return merge(template, source);
}

var compatibility = compatibilityFrom;

var HTTP_RESOURCE_PATTERN = /^http:\/\//;

function isHttpResource(uri) {
  return HTTP_RESOURCE_PATTERN.test(uri);
}

var isHttpResource_1 = isHttpResource;

var HTTPS_RESOURCE_PATTERN = /^https:\/\//;

function isHttpsResource(uri) {
  return HTTPS_RESOURCE_PATTERN.test(uri);
}

var isHttpsResource_1 = isHttpsResource;

var HTTP_PROTOCOL = 'http:';

function loadRemoteResource(uri, inlineRequest, inlineTimeout, callback) {
  var proxyProtocol = inlineRequest.protocol || inlineRequest.hostname;
  var errorHandled = false;
  var requestOptions;
  var fetch;

  requestOptions = override_1(
    url.parse(uri),
    inlineRequest || {}
  );

  if (inlineRequest.hostname !== undefined) {
    // overwrite as we always expect a http proxy currently
    requestOptions.protocol = inlineRequest.protocol || HTTP_PROTOCOL;
    requestOptions.path = requestOptions.href;
  }

  fetch = (proxyProtocol && !isHttpsResource_1(proxyProtocol)) || isHttpResource_1(uri) ?
    http.get :
    https.get;

  fetch(requestOptions, function (res) {
    var chunks = [];
    var movedUri;

    if (errorHandled) {
      return;
    }

    if (res.statusCode < 200 || res.statusCode > 399) {
      return callback(res.statusCode, null);
    } else if (res.statusCode > 299) {
      movedUri = url.resolve(uri, res.headers.location);
      return loadRemoteResource(movedUri, inlineRequest, inlineTimeout, callback);
    }

    res.on('data', function (chunk) {
      chunks.push(chunk.toString());
    });
    res.on('end', function () {
      var body = chunks.join('');
      callback(null, body);
    });
  })
  .on('error', function (res) {
    if (errorHandled) {
      return;
    }

    errorHandled = true;
    callback(res.message, null);
  })
  .on('timeout', function () {
    if (errorHandled) {
      return;
    }

    errorHandled = true;
    callback('timeout', null);
  })
  .setTimeout(inlineTimeout);
}

var loadRemoteResource_1 = loadRemoteResource;

function fetchFrom(callback) {
  return callback || loadRemoteResource_1;
}

var fetch = fetchFrom;

function inlineOptionsFrom(rules) {
  if (Array.isArray(rules)) {
    return rules;
  }

  if (rules === false) {
    return ['none'];
  }

  return undefined === rules ?
    ['local'] :
    rules.split(',');
}

var inline = inlineOptionsFrom;

function inlineRequestFrom(option) {
  return override_1(
    /* jshint camelcase: false */
    proxyOptionsFrom(process.env.HTTP_PROXY || process.env.http_proxy),
    option || {}
  );
}

function proxyOptionsFrom(httpProxy) {
  return httpProxy ?
    {
      hostname: url.parse(httpProxy).hostname,
      port: parseInt(url.parse(httpProxy).port)
    } :
    {};
}

var inlineRequest = inlineRequestFrom;

var DEFAULT_TIMEOUT = 5000;

function inlineTimeoutFrom(option) {
  return option || DEFAULT_TIMEOUT;
}

var inlineTimeout = inlineTimeoutFrom;

function rebaseFrom(rebaseOption) {
  return undefined === rebaseOption ? true : !!rebaseOption;
}

var rebase = rebaseFrom;

function rebaseToFrom(option) {
  return option ? path.resolve(option) : process.cwd();
}

var rebaseTo = rebaseToFrom;

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
var encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
var decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

var base64 = {
	encode: encode,
	decode: decode
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */



// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
var encode$1 = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
var decode$1 = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

var base64Vlq = {
	encode: encode$1,
	decode: decode$1
};

var util = createCommonjsModule(function (module, exports) {
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port;
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
}
exports.parseSourceMapInput = parseSourceMapInput;

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  sourceURL = sourceURL || '';

  if (sourceRoot) {
    // This follows what Chrome does.
    if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
      sourceRoot += '/';
    }
    // The spec says:
    //   Line 4: An optional source root, useful for relocating source
    //   files on a server or removing repeated values in the
    //   “sources” entry.  This value is prepended to the individual
    //   entries in the “source” field.
    sourceURL = sourceRoot + sourceURL;
  }

  // Historically, SourceMapConsumer did not take the sourceMapURL as
  // a parameter.  This mode is still somewhat supported, which is why
  // this code block is conditional.  However, it's preferable to pass
  // the source map URL to SourceMapConsumer, so that this function
  // can implement the source URL resolution algorithm as outlined in
  // the spec.  This block is basically the equivalent of:
  //    new URL(sourceURL, sourceMapURL).toString()
  // ... except it avoids using URL, which wasn't available in the
  // older releases of node still supported by this library.
  //
  // The spec says:
  //   If the sources are not absolute URLs after prepending of the
  //   “sourceRoot”, the sources are resolved relative to the
  //   SourceMap (like resolving script src in a html document).
  if (sourceMapURL) {
    var parsed = urlParse(sourceMapURL);
    if (!parsed) {
      throw new Error("sourceMapURL could not be parsed");
    }
    if (parsed.path) {
      // Strip the last path component, but keep the "/".
      var index = parsed.path.lastIndexOf('/');
      if (index >= 0) {
        parsed.path = parsed.path.substring(0, index + 1);
      }
    }
    sourceURL = join(urlGenerate(parsed), sourceURL);
  }

  return normalize(sourceURL);
}
exports.computeSourceURL = computeSourceURL;
});

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */


var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

var ArraySet_1 = ArraySet;

var arraySet = {
	ArraySet: ArraySet_1
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */



/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

var MappingList_1 = MappingList;

var mappingList = {
	MappingList: MappingList_1
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */



var ArraySet$1 = arraySet.ArraySet;
var MappingList$1 = mappingList.MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util.getArg(aArgs, 'file', null);
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet$1();
  this._names = new ArraySet$1();
  this._mappings = new MappingList$1();
  this._sourcesContents = null;
}

SourceMapGenerator.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet$1();
    var newNames = new ArraySet$1();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source);
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = '';

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64Vlq.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64Vlq.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64Vlq.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64Vlq.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64Vlq.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

var SourceMapGenerator_1 = SourceMapGenerator;

var sourceMapGenerator = {
	SourceMapGenerator: SourceMapGenerator_1
};

var binarySearch = createCommonjsModule(function (module, exports) {
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};
});

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
var quickSort_1 = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

var quickSort = {
	quickSort: quickSort_1
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */



var ArraySet$2 = arraySet.ArraySet;

var quickSort$1 = quickSort.quickSort;

function SourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
    : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
};

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number is 1-based.
 *   - column: Optional. the column number in the original source.
 *    The column number is 0-based.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *    line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *    The column number is 0-based.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

var SourceMapConsumer_1 = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  if (sourceRoot) {
    sourceRoot = util.normalize(sourceRoot);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet$2.fromArray(names.map(String), true);
  this._sources = ArraySet$2.fromArray(sources, true);

  this._absoluteSources = this._sources.toArray().map(function (s) {
    return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Utility function to find the index of a source.  Returns -1 if not
 * found.
 */
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util.relative(this.sourceRoot, relativeSource);
  }

  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }

  // Maybe aSource is an absolute URL as returned by |sources|.  In
  // this case we can't simply undo the transform.
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }

  return -1;
};

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @param String aSourceMapURL
 *        The URL at which the source map can be found (optional)
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet$2.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet$2.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function (s) {
      return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort$1(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._absoluteSources.slice();
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64Vlq.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort$1(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort$1(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

var BasicSourceMapConsumer_1 = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet$2();
  this._names = new ArraySet$2();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'), aSourceMapURL)
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based. 
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort$1(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort$1(this.__originalMappings, util.compareByOriginalPositions);
  };

var IndexedSourceMapConsumer_1 = IndexedSourceMapConsumer;

var sourceMapConsumer = {
	SourceMapConsumer: SourceMapConsumer_1,
	BasicSourceMapConsumer: BasicSourceMapConsumer_1,
	IndexedSourceMapConsumer: IndexedSourceMapConsumer_1
};

/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator$1 = sourceMapGenerator.SourceMapGenerator;


// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex] || '';
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex] || '';
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator$1(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

var SourceNode_1 = SourceNode;

var sourceNode = {
	SourceNode: SourceNode_1
};

/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
var SourceMapGenerator$2 = sourceMapGenerator.SourceMapGenerator;
var SourceMapConsumer$1 = sourceMapConsumer.SourceMapConsumer;
var SourceNode$1 = sourceNode.SourceNode;

var sourceMap = {
	SourceMapGenerator: SourceMapGenerator$2,
	SourceMapConsumer: SourceMapConsumer$1,
	SourceNode: SourceNode$1
};

var SourceMapConsumer$2 = sourceMap.SourceMapConsumer;

function inputSourceMapTracker() {
  var maps = {};

  return {
    all: all$2.bind(null, maps),
    isTracking: isTracking.bind(null, maps),
    originalPositionFor: originalPositionFor.bind(null, maps),
    track: track.bind(null, maps)
  };
}

function all$2(maps) {
  return maps;
}

function isTracking(maps, source) {
  return source in maps;
}

function originalPositionFor(maps, metadata, range, selectorFallbacks) {
  var line = metadata[0];
  var column = metadata[1];
  var source = metadata[2];
  var position = {
    line: line,
    column: column + range
  };
  var originalPosition;

  while (!originalPosition && position.column > column) {
    position.column--;
    originalPosition = maps[source].originalPositionFor(position);
  }

  if (!originalPosition || originalPosition.column < 0) {
    return metadata;
  }

  if (originalPosition.line === null && line > 1 && selectorFallbacks > 0) {
    return originalPositionFor(maps, [line - 1, column, source], range, selectorFallbacks - 1);
  }

  return originalPosition.line !== null ?
    toMetadata(originalPosition) :
    metadata;
}

function toMetadata(asHash) {
  return [asHash.line, asHash.column, asHash.source];
}

function track(maps, source, data) {
  maps[source] = new SourceMapConsumer$2(data);
}

var inputSourceMapTracker_1 = inputSourceMapTracker;

var REMOTE_RESOURCE_PATTERN = /^(\w+:\/\/|\/\/)/;

function isRemoteResource(uri) {
  return REMOTE_RESOURCE_PATTERN.test(uri);
}

var isRemoteResource_1 = isRemoteResource;

var NO_PROTOCOL_RESOURCE_PATTERN = /^\/\//;

function hasProtocol(uri) {
  return !NO_PROTOCOL_RESOURCE_PATTERN.test(uri);
}

var hasProtocol_1 = hasProtocol;

var HTTP_PROTOCOL$1 = 'http:';

function isAllowedResource(uri, isRemote, rules) {
  var match;
  var absoluteUri;
  var allowed = isRemote ? false : true;
  var rule;
  var isNegated;
  var normalizedRule;
  var i;

  if (rules.length === 0) {
    return false;
  }

  if (isRemote && !hasProtocol_1(uri)) {
    uri = HTTP_PROTOCOL$1 + uri;
  }

  match = isRemote ?
    url.parse(uri).host :
    uri;

  absoluteUri = isRemote ?
    uri :
    path.resolve(uri);

  for (i = 0; i < rules.length; i++) {
    rule = rules[i];
    isNegated = rule[0] == '!';
    normalizedRule = rule.substring(1);

    if (isNegated && isRemote && isRemoteRule(normalizedRule)) {
      allowed = allowed && !isAllowedResource(uri, true, [normalizedRule]);
    } else if (isNegated && !isRemote && !isRemoteRule(normalizedRule)) {
      allowed = allowed && !isAllowedResource(uri, false, [normalizedRule]);
    } else if (isNegated) {
      allowed = allowed && true;
    } else if (rule == 'all') {
      allowed = true;
    } else if (isRemote && rule == 'local') {
      allowed = allowed || false;
    } else if (isRemote && rule == 'remote') {
      allowed = true;
    } else if (!isRemote && rule == 'remote') {
      allowed = false;
    } else if (!isRemote && rule == 'local') {
      allowed = true;
    } else if (rule === match) {
      allowed = true;
    } else if (rule === uri) {
      allowed = true;
    } else if (isRemote && absoluteUri.indexOf(rule) === 0) {
      allowed = true;
    } else if (!isRemote && absoluteUri.indexOf(path.resolve(rule)) === 0) {
      allowed = true;
    } else if (isRemote != isRemoteRule(normalizedRule)) {
      allowed = allowed && true;
    } else {
      allowed = false;
    }
  }

  return allowed;
}

function isRemoteRule(rule) {
  return isRemoteResource_1(rule) || url.parse(HTTP_PROTOCOL$1 + '//' + rule).host == rule;
}

var isAllowedResource_1 = isAllowedResource;

var DATA_URI_PATTERN = /^data:(\S*?)?(;charset=[^;]+)?(;[^,]+?)?,(.+)/;

function matchDataUri(uri) {
  return DATA_URI_PATTERN.exec(uri);
}

var matchDataUri_1 = matchDataUri;

function rebaseLocalMap(sourceMap, sourceUri, rebaseTo) {
  var currentPath = path.resolve('');
  var absoluteUri = path.resolve(currentPath, sourceUri);
  var absoluteUriDirectory = path.dirname(absoluteUri);

  sourceMap.sources = sourceMap.sources.map(function(source) {
    return path.relative(rebaseTo, path.resolve(absoluteUriDirectory, source));
  });

  return sourceMap;
}

var rebaseLocalMap_1 = rebaseLocalMap;

function rebaseRemoteMap(sourceMap, sourceUri) {
  var sourceDirectory = path.dirname(sourceUri);

  sourceMap.sources = sourceMap.sources.map(function(source) {
    return url.resolve(sourceDirectory, source);
  });

  return sourceMap;
}

var rebaseRemoteMap_1 = rebaseRemoteMap;

var DATA_URI_PATTERN$1 = /^data:(\S*?)?(;charset=[^;]+)?(;[^,]+?)?,(.+)/;

function isDataUriResource(uri) {
  return DATA_URI_PATTERN$1.test(uri);
}

var isDataUriResource_1 = isDataUriResource;

var MAP_MARKER_PATTERN = /^\/\*# sourceMappingURL=(\S+) \*\/$/;

function applySourceMaps(tokens, context, callback) {
  var applyContext = {
    callback: callback,
    fetch: context.options.fetch,
    index: 0,
    inline: context.options.inline,
    inlineRequest: context.options.inlineRequest,
    inlineTimeout: context.options.inlineTimeout,
    inputSourceMapTracker: context.inputSourceMapTracker,
    localOnly: context.localOnly,
    processedTokens: [],
    rebaseTo: context.options.rebaseTo,
    sourceTokens: tokens,
    warnings: context.warnings
  };

  return context.options.sourceMap && tokens.length > 0 ?
    doApplySourceMaps(applyContext) :
    callback(tokens);
}

function doApplySourceMaps(applyContext) {
  var singleSourceTokens = [];
  var lastSource = findTokenSource(applyContext.sourceTokens[0]);
  var source;
  var token$1;
  var l;

  for (l = applyContext.sourceTokens.length; applyContext.index < l; applyContext.index++) {
    token$1 = applyContext.sourceTokens[applyContext.index];
    source = findTokenSource(token$1);

    if (source != lastSource) {
      singleSourceTokens = [];
      lastSource = source;
    }

    singleSourceTokens.push(token$1);
    applyContext.processedTokens.push(token$1);

    if (token$1[0] == token.COMMENT && MAP_MARKER_PATTERN.test(token$1[1])) {
      return fetchAndApplySourceMap(token$1[1], source, singleSourceTokens, applyContext);
    }
  }

  return applyContext.callback(applyContext.processedTokens);
}

function findTokenSource(token$1) {
  var scope;
  var metadata;

  if (token$1[0] == token.AT_RULE || token$1[0] == token.COMMENT) {
    metadata = token$1[2][0];
  } else {
    scope = token$1[1][0];
    metadata = scope[2][0];
  }

  return metadata[2];
}

function fetchAndApplySourceMap(sourceMapComment, source, singleSourceTokens, applyContext) {
  return extractInputSourceMapFrom(sourceMapComment, applyContext, function (inputSourceMap) {
    if (inputSourceMap) {
      applyContext.inputSourceMapTracker.track(source, inputSourceMap);
      applySourceMapRecursively(singleSourceTokens, applyContext.inputSourceMapTracker);
    }

    applyContext.index++;
    return doApplySourceMaps(applyContext);
  });
}

function extractInputSourceMapFrom(sourceMapComment, applyContext, whenSourceMapReady) {
  var uri = MAP_MARKER_PATTERN.exec(sourceMapComment)[1];
  var absoluteUri;
  var sourceMap;
  var rebasedMap;

  if (isDataUriResource_1(uri)) {
    sourceMap = extractInputSourceMapFromDataUri(uri);
    return whenSourceMapReady(sourceMap);
  } else if (isRemoteResource_1(uri)) {
    return loadInputSourceMapFromRemoteUri(uri, applyContext, function (sourceMap) {
      var parsedMap;

      if (sourceMap) {
        parsedMap = JSON.parse(sourceMap);
        rebasedMap = rebaseRemoteMap_1(parsedMap, uri);
        whenSourceMapReady(rebasedMap);
      } else {
        whenSourceMapReady(null);
      }
    });
  } else {
    // at this point `uri` is already rebased, see lib/reader/rebase.js#rebaseSourceMapComment
    // it is rebased to be consistent with rebasing other URIs
    // however here we need to resolve it back to read it from disk
    absoluteUri = path.resolve(applyContext.rebaseTo, uri);
    sourceMap = loadInputSourceMapFromLocalUri(absoluteUri, applyContext);

    if (sourceMap) {
      rebasedMap = rebaseLocalMap_1(sourceMap, absoluteUri, applyContext.rebaseTo);
      return whenSourceMapReady(rebasedMap);
    } else {
      return whenSourceMapReady(null);
    }
  }
}

function extractInputSourceMapFromDataUri(uri) {
  var dataUriMatch = matchDataUri_1(uri);
  var charset = dataUriMatch[2] ? dataUriMatch[2].split(/[=;]/)[2] : 'us-ascii';
  var encoding = dataUriMatch[3] ? dataUriMatch[3].split(';')[1] : 'utf8';
  var data = encoding == 'utf8' ? commonjsGlobal.unescape(dataUriMatch[4]) : dataUriMatch[4];

  var buffer = new Buffer(data, encoding);
  buffer.charset = charset;

  return JSON.parse(buffer.toString());
}

function loadInputSourceMapFromRemoteUri(uri, applyContext, whenLoaded) {
  var isAllowed = isAllowedResource_1(uri, true, applyContext.inline);
  var isRuntimeResource = !hasProtocol_1(uri);

  if (applyContext.localOnly) {
    applyContext.warnings.push('Cannot fetch remote resource from "' + uri + '" as no callback given.');
    return whenLoaded(null);
  } else if (isRuntimeResource) {
    applyContext.warnings.push('Cannot fetch "' + uri + '" as no protocol given.');
    return whenLoaded(null);
  } else if (!isAllowed) {
    applyContext.warnings.push('Cannot fetch "' + uri + '" as resource is not allowed.');
    return whenLoaded(null);
  }

  applyContext.fetch(uri, applyContext.inlineRequest, applyContext.inlineTimeout, function (error, body) {
    if (error) {
      applyContext.warnings.push('Missing source map at "' + uri + '" - ' + error);
      return whenLoaded(null);
    }

    whenLoaded(body);
  });
}

function loadInputSourceMapFromLocalUri(uri, applyContext) {
  var isAllowed = isAllowedResource_1(uri, false, applyContext.inline);
  var sourceMap;

  if (!fs.existsSync(uri) || !fs.statSync(uri).isFile()) {
    applyContext.warnings.push('Ignoring local source map at "' + uri + '" as resource is missing.');
    return null;
  } else if (!isAllowed) {
    applyContext.warnings.push('Cannot fetch "' + uri + '" as resource is not allowed.');
    return null;
  }

  sourceMap = fs.readFileSync(uri, 'utf-8');
  return JSON.parse(sourceMap);
}

function applySourceMapRecursively(tokens, inputSourceMapTracker) {
  var token$1;
  var i, l;

  for (i = 0, l = tokens.length; i < l; i++) {
    token$1 = tokens[i];

    switch (token$1[0]) {
      case token.AT_RULE:
        applySourceMapTo(token$1, inputSourceMapTracker);
        break;
      case token.AT_RULE_BLOCK:
        applySourceMapRecursively(token$1[1], inputSourceMapTracker);
        applySourceMapRecursively(token$1[2], inputSourceMapTracker);
        break;
      case token.AT_RULE_BLOCK_SCOPE:
        applySourceMapTo(token$1, inputSourceMapTracker);
        break;
      case token.NESTED_BLOCK:
        applySourceMapRecursively(token$1[1], inputSourceMapTracker);
        applySourceMapRecursively(token$1[2], inputSourceMapTracker);
        break;
      case token.NESTED_BLOCK_SCOPE:
        applySourceMapTo(token$1, inputSourceMapTracker);
        break;
      case token.COMMENT:
        applySourceMapTo(token$1, inputSourceMapTracker);
        break;
      case token.PROPERTY:
        applySourceMapRecursively(token$1, inputSourceMapTracker);
        break;
      case token.PROPERTY_BLOCK:
        applySourceMapRecursively(token$1[1], inputSourceMapTracker);
        break;
      case token.PROPERTY_NAME:
        applySourceMapTo(token$1, inputSourceMapTracker);
        break;
      case token.PROPERTY_VALUE:
        applySourceMapTo(token$1, inputSourceMapTracker);
        break;
      case token.RULE:
        applySourceMapRecursively(token$1[1], inputSourceMapTracker);
        applySourceMapRecursively(token$1[2], inputSourceMapTracker);
        break;
      case token.RULE_SCOPE:
        applySourceMapTo(token$1, inputSourceMapTracker);
    }
  }

  return tokens;
}

function applySourceMapTo(token, inputSourceMapTracker) {
  var value = token[1];
  var metadata = token[2];
  var newMetadata = [];
  var i, l;

  for (i = 0, l = metadata.length; i < l; i++) {
    newMetadata.push(inputSourceMapTracker.originalPositionFor(metadata[i], value.length));
  }

  token[2] = newMetadata;
}

var applySourceMaps_1 = applySourceMaps;

var BRACE_PREFIX = /^\(/;
var BRACE_SUFFIX = /\)$/;
var IMPORT_PREFIX_PATTERN$1 = /^@import/i;
var QUOTE_PREFIX_PATTERN = /['"]\s*/;
var QUOTE_SUFFIX_PATTERN = /\s*['"]/;
var URL_PREFIX_PATTERN$1 = /^url\(\s*/i;
var URL_SUFFIX_PATTERN = /\s*\)/i;

function extractImportUrlAndMedia(atRuleValue) {
  var uri;
  var mediaQuery;
  var stripped;
  var parts;

  stripped = atRuleValue
    .replace(IMPORT_PREFIX_PATTERN$1, '')
    .trim()
    .replace(URL_PREFIX_PATTERN$1, '(')
    .replace(URL_SUFFIX_PATTERN, ')')
    .replace(QUOTE_PREFIX_PATTERN, '')
    .replace(QUOTE_SUFFIX_PATTERN, '');

  parts = split_1(stripped, ' ');

  uri = parts[0]
    .replace(BRACE_PREFIX, '')
    .replace(BRACE_SUFFIX, '');
  mediaQuery = parts.slice(1).join(' ');

  return [uri, mediaQuery];
}

var extractImportUrlAndMedia_1 = extractImportUrlAndMedia;

function loadOriginalSources(context, callback) {
  var loadContext = {
    callback: callback,
    fetch: context.options.fetch,
    index: 0,
    inline: context.options.inline,
    inlineRequest: context.options.inlineRequest,
    inlineTimeout: context.options.inlineTimeout,
    localOnly: context.localOnly,
    rebaseTo: context.options.rebaseTo,
    sourcesContent: context.sourcesContent,
    uriToSource: uriToSourceMapping(context.inputSourceMapTracker.all()),
    warnings: context.warnings
  };

  return context.options.sourceMap && context.options.sourceMapInlineSources ?
    doLoadOriginalSources(loadContext) :
    callback();
}

function uriToSourceMapping(allSourceMapConsumers) {
  var mapping = {};
  var consumer;
  var uri;
  var source;
  var i, l;

  for (source in allSourceMapConsumers) {
    consumer = allSourceMapConsumers[source];

    for (i = 0, l = consumer.sources.length; i < l; i++) {
      uri = consumer.sources[i];
      source = consumer.sourceContentFor(uri, true);

      mapping[uri] = source;
    }
  }

  return mapping;
}

function doLoadOriginalSources(loadContext) {
  var uris = Object.keys(loadContext.uriToSource);
  var uri;
  var source;
  var total;

  for (total = uris.length; loadContext.index < total; loadContext.index++) {
    uri = uris[loadContext.index];
    source = loadContext.uriToSource[uri];

    if (source) {
      loadContext.sourcesContent[uri] = source;
    } else {
      return loadOriginalSource(uri, loadContext);
    }
  }

  return loadContext.callback();
}

function loadOriginalSource(uri, loadContext) {
  var content;

  if (isRemoteResource_1(uri)) {
    return loadOriginalSourceFromRemoteUri(uri, loadContext, function (content) {
      loadContext.index++;
      loadContext.sourcesContent[uri] = content;
      return doLoadOriginalSources(loadContext);
    });
  } else {
    content = loadOriginalSourceFromLocalUri(uri, loadContext);
    loadContext.index++;
    loadContext.sourcesContent[uri] = content;
    return doLoadOriginalSources(loadContext);
  }
}

function loadOriginalSourceFromRemoteUri(uri, loadContext, whenLoaded) {
  var isAllowed = isAllowedResource_1(uri, true, loadContext.inline);
  var isRuntimeResource = !hasProtocol_1(uri);

  if (loadContext.localOnly) {
    loadContext.warnings.push('Cannot fetch remote resource from "' + uri + '" as no callback given.');
    return whenLoaded(null);
  } else if (isRuntimeResource) {
    loadContext.warnings.push('Cannot fetch "' + uri + '" as no protocol given.');
    return whenLoaded(null);
  } else if (!isAllowed) {
    loadContext.warnings.push('Cannot fetch "' + uri + '" as resource is not allowed.');
    return whenLoaded(null);
  }

  loadContext.fetch(uri, loadContext.inlineRequest, loadContext.inlineTimeout, function (error, content) {
    if (error) {
      loadContext.warnings.push('Missing original source at "' + uri + '" - ' + error);
    }

    whenLoaded(content);
  });
}

function loadOriginalSourceFromLocalUri(relativeUri, loadContext) {
  var isAllowed = isAllowedResource_1(relativeUri, false, loadContext.inline);
  var absoluteUri = path.resolve(loadContext.rebaseTo, relativeUri);

  if (!fs.existsSync(absoluteUri) || !fs.statSync(absoluteUri).isFile()) {
    loadContext.warnings.push('Ignoring local source map at "' + absoluteUri + '" as resource is missing.');
    return null;
  } else if (!isAllowed) {
    loadContext.warnings.push('Cannot fetch "' + absoluteUri + '" as resource is not allowed.');
    return null;
  }

  return fs.readFileSync(absoluteUri, 'utf8');
}

var loadOriginalSources_1 = loadOriginalSources;

var UNIX_SEPARATOR = '/';
var WINDOWS_SEPARATOR_PATTERN = /\\/g;

function normalizePath(path) {
  return path.replace(WINDOWS_SEPARATOR_PATTERN, UNIX_SEPARATOR);
}

var normalizePath_1 = normalizePath;

function restoreImport(uri, mediaQuery) {
  return ('@import ' + uri + ' ' + mediaQuery).trim();
}

var restoreImport_1 = restoreImport;

var DOUBLE_QUOTE = '"';
var SINGLE_QUOTE = '\'';
var URL_PREFIX = 'url(';
var URL_SUFFIX = ')';

var QUOTE_PREFIX_PATTERN$1 = /^["']/;
var QUOTE_SUFFIX_PATTERN$1 = /["']$/;
var ROUND_BRACKETS_PATTERN = /[\(\)]/;
var URL_PREFIX_PATTERN$2 = /^url\(/i;
var URL_SUFFIX_PATTERN$1 = /\)$/;
var WHITESPACE_PATTERN$1 = /\s/;

var isWindows = process.platform == 'win32';

function rebase$1(uri, rebaseConfig) {
  if (!rebaseConfig) {
    return uri;
  }

  if (isAbsolute(uri) && !isRemote(rebaseConfig.toBase)) {
    return uri;
  }

  if (isRemote(uri) || isSVGMarker(uri) || isInternal(uri)) {
    return uri;
  }

  if (isData(uri)) {
    return '\'' + uri + '\'';
  }

  if (isRemote(rebaseConfig.toBase)) {
    return url.resolve(rebaseConfig.toBase, uri);
  }

  return rebaseConfig.absolute ?
    normalize$1(absolute(uri, rebaseConfig)) :
    normalize$1(relative(uri, rebaseConfig));
}

function isAbsolute(uri) {
  return path.isAbsolute(uri);
}

function isSVGMarker(uri) {
  return uri[0] == '#';
}

function isInternal(uri) {
  return /^\w+:\w+/.test(uri);
}

function isRemote(uri) {
  return /^[^:]+?:\/\//.test(uri) || uri.indexOf('//') === 0;
}

function isData(uri) {
  return uri.indexOf('data:') === 0;
}

function absolute(uri, rebaseConfig) {
  return path
    .resolve(path.join(rebaseConfig.fromBase || '', uri))
    .replace(rebaseConfig.toBase, '');
}

function relative(uri, rebaseConfig) {
  return path.relative(rebaseConfig.toBase, path.join(rebaseConfig.fromBase || '', uri));
}

function normalize$1(uri) {
  return isWindows ? uri.replace(/\\/g, '/') : uri;
}

function quoteFor(unquotedUrl) {
  if (unquotedUrl.indexOf(SINGLE_QUOTE) > -1) {
    return DOUBLE_QUOTE;
  } else if (unquotedUrl.indexOf(DOUBLE_QUOTE) > -1) {
    return SINGLE_QUOTE;
  } else if (hasWhitespace(unquotedUrl) || hasRoundBrackets(unquotedUrl)) {
    return SINGLE_QUOTE;
  } else {
    return '';
  }
}

function hasWhitespace(url) {
  return WHITESPACE_PATTERN$1.test(url);
}

function hasRoundBrackets(url) {
  return ROUND_BRACKETS_PATTERN.test(url);
}

function rewriteUrl(originalUrl, rebaseConfig, pathOnly) {
  var strippedUrl = originalUrl
    .replace(URL_PREFIX_PATTERN$2, '')
    .replace(URL_SUFFIX_PATTERN$1, '')
    .trim();

  var unquotedUrl = strippedUrl
    .replace(QUOTE_PREFIX_PATTERN$1, '')
    .replace(QUOTE_SUFFIX_PATTERN$1, '')
    .trim();

  var quote = strippedUrl[0] == SINGLE_QUOTE || strippedUrl[0] == DOUBLE_QUOTE ?
    strippedUrl[0] :
    quoteFor(unquotedUrl);

  return pathOnly ?
    rebase$1(unquotedUrl, rebaseConfig) :
    URL_PREFIX + quote + rebase$1(unquotedUrl, rebaseConfig) + quote + URL_SUFFIX;
}

var rewriteUrl_1 = rewriteUrl;

var IMPORT_PREFIX_PATTERN$2 = /^@import/i;

function isImport$1(value) {
  return IMPORT_PREFIX_PATTERN$2.test(value);
}

var isImport_1 = isImport$1;

var SOURCE_MAP_COMMENT_PATTERN = /^\/\*# sourceMappingURL=(\S+) \*\/$/;

function rebase$2(tokens, rebaseAll, validator, rebaseConfig) {
  return rebaseAll ?
    rebaseEverything(tokens, validator, rebaseConfig) :
    rebaseAtRules(tokens, validator, rebaseConfig);
}

function rebaseEverything(tokens, validator, rebaseConfig) {
  var token$1;
  var i, l;

  for (i = 0, l = tokens.length; i < l; i++) {
    token$1 = tokens[i];

    switch (token$1[0]) {
      case token.AT_RULE:
        rebaseAtRule(token$1, validator, rebaseConfig);
        break;
      case token.AT_RULE_BLOCK:
        rebaseProperties(token$1[2], validator, rebaseConfig);
        break;
      case token.COMMENT:
        rebaseSourceMapComment(token$1, rebaseConfig);
        break;
      case token.NESTED_BLOCK:
        rebaseEverything(token$1[2], validator, rebaseConfig);
        break;
      case token.RULE:
        rebaseProperties(token$1[2], validator, rebaseConfig);
        break;
    }
  }

  return tokens;
}

function rebaseAtRules(tokens, validator, rebaseConfig) {
  var token$1;
  var i, l;

  for (i = 0, l = tokens.length; i < l; i++) {
    token$1 = tokens[i];

    switch (token$1[0]) {
      case token.AT_RULE:
        rebaseAtRule(token$1, validator, rebaseConfig);
        break;
    }
  }

  return tokens;
}

function rebaseAtRule(token, validator, rebaseConfig) {
  if (!isImport_1(token[1])) {
    return;
  }

  var uriAndMediaQuery = extractImportUrlAndMedia_1(token[1]);
  var newUrl = rewriteUrl_1(uriAndMediaQuery[0], rebaseConfig);
  var mediaQuery = uriAndMediaQuery[1];

  token[1] = restoreImport_1(newUrl, mediaQuery);
}

function rebaseSourceMapComment(token, rebaseConfig) {
  var matches = SOURCE_MAP_COMMENT_PATTERN.exec(token[1]);

  if (matches && matches[1].indexOf('data:') === -1) {
    token[1] = token[1].replace(matches[1], rewriteUrl_1(matches[1], rebaseConfig, true));
  }
}

function rebaseProperties(properties, validator, rebaseConfig) {
  var property;
  var value;
  var i, l;
  var j, m;

  for (i = 0, l = properties.length; i < l; i++) {
    property = properties[i];

    for (j = 2 /* 0 is Token.PROPERTY, 1 is name */, m = property.length; j < m; j++) {
      value = property[j][1];

      if (validator.isUrl(value)) {
        property[j][1] = rewriteUrl_1(value, rebaseConfig);
      }
    }
  }
}

var rebase_1 = rebase$2;

var Level$1 = {
  BLOCK: 'block',
  COMMENT: 'comment',
  DOUBLE_QUOTE: 'double-quote',
  RULE: 'rule',
  SINGLE_QUOTE: 'single-quote'
};

var AT_RULES = [
  '@charset',
  '@import'
];

var BLOCK_RULES = [
  '@-moz-document',
  '@document',
  '@-moz-keyframes',
  '@-ms-keyframes',
  '@-o-keyframes',
  '@-webkit-keyframes',
  '@keyframes',
  '@media',
  '@supports'
];

var IGNORE_END_COMMENT_PATTERN = /\/\* clean\-css ignore:end \*\/$/;
var IGNORE_START_COMMENT_PATTERN = /^\/\* clean\-css ignore:start \*\//;

var PAGE_MARGIN_BOXES = [
  '@bottom-center',
  '@bottom-left',
  '@bottom-left-corner',
  '@bottom-right',
  '@bottom-right-corner',
  '@left-bottom',
  '@left-middle',
  '@left-top',
  '@right-bottom',
  '@right-middle',
  '@right-top',
  '@top-center',
  '@top-left',
  '@top-left-corner',
  '@top-right',
  '@top-right-corner'
];

var EXTRA_PAGE_BOXES = [
  '@footnote',
  '@footnotes',
  '@left',
  '@page-float-bottom',
  '@page-float-top',
  '@right'
];

var REPEAT_PATTERN = /^\[\s{0,31}\d+\s{0,31}\]$/;
var RULE_WORD_SEPARATOR_PATTERN = /[\s\(]/;
var TAIL_BROKEN_VALUE_PATTERN = /[\s|\}]*$/;

function tokenize(source, externalContext) {
  var internalContext = {
    level: Level$1.BLOCK,
    position: {
      source: externalContext.source || undefined,
      line: 1,
      column: 0,
      index: 0
    }
  };

  return intoTokens(source, externalContext, internalContext, false);
}

function intoTokens(source, externalContext, internalContext, isNested) {
  var allTokens = [];
  var newTokens = allTokens;
  var lastToken;
  var ruleToken;
  var ruleTokens = [];
  var propertyToken;
  var metadata;
  var metadatas = [];
  var level = internalContext.level;
  var levels = [];
  var buffer = [];
  var buffers = [];
  var serializedBuffer;
  var serializedBufferPart;
  var roundBracketLevel = 0;
  var isQuoted;
  var isSpace;
  var isNewLineNix;
  var isNewLineWin;
  var isCarriageReturn;
  var isCommentStart;
  var wasCommentStart = false;
  var isCommentEnd;
  var wasCommentEnd = false;
  var isCommentEndMarker;
  var isEscaped;
  var wasEscaped = false;
  var isRaw = false;
  var seekingValue = false;
  var seekingPropertyBlockClosing = false;
  var position = internalContext.position;
  var lastCommentStartAt;

  for (; position.index < source.length; position.index++) {
    var character = source[position.index];

    isQuoted = level == Level$1.SINGLE_QUOTE || level == Level$1.DOUBLE_QUOTE;
    isSpace = character == marker.SPACE || character == marker.TAB;
    isNewLineNix = character == marker.NEW_LINE_NIX;
    isNewLineWin = character == marker.NEW_LINE_NIX && source[position.index - 1] == marker.CARRIAGE_RETURN;
    isCarriageReturn = character == marker.CARRIAGE_RETURN && source[position.index + 1] && source[position.index + 1] != marker.NEW_LINE_NIX;
    isCommentStart = !wasCommentEnd && level != Level$1.COMMENT && !isQuoted && character == marker.ASTERISK && source[position.index - 1] == marker.FORWARD_SLASH;
    isCommentEndMarker = !wasCommentStart && !isQuoted && character == marker.FORWARD_SLASH && source[position.index - 1] == marker.ASTERISK;
    isCommentEnd = level == Level$1.COMMENT && isCommentEndMarker;
    roundBracketLevel = Math.max(roundBracketLevel, 0);

    metadata = buffer.length === 0 ?
      [position.line, position.column, position.source] :
      metadata;

    if (isEscaped) {
      // previous character was a backslash
      buffer.push(character);
    } else if (!isCommentEnd && level == Level$1.COMMENT) {
      buffer.push(character);
    } else if (!isCommentStart && !isCommentEnd && isRaw) {
      buffer.push(character);
    } else if (isCommentStart && (level == Level$1.BLOCK || level == Level$1.RULE) && buffer.length > 1) {
      // comment start within block preceded by some content, e.g. div/*<--
      metadatas.push(metadata);
      buffer.push(character);
      buffers.push(buffer.slice(0, buffer.length - 2));

      buffer = buffer.slice(buffer.length - 2);
      metadata = [position.line, position.column - 1, position.source];

      levels.push(level);
      level = Level$1.COMMENT;
    } else if (isCommentStart) {
      // comment start, e.g. /*<--
      levels.push(level);
      level = Level$1.COMMENT;
      buffer.push(character);
    } else if (isCommentEnd && isIgnoreStartComment(buffer)) {
      // ignore:start comment end, e.g. /* clean-css ignore:start */<--
      serializedBuffer = buffer.join('').trim() + character;
      lastToken = [token.COMMENT, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]];
      newTokens.push(lastToken);

      isRaw = true;
      metadata = metadatas.pop() || null;
      buffer = buffers.pop() || [];
    } else if (isCommentEnd && isIgnoreEndComment(buffer)) {
      // ignore:start comment end, e.g. /* clean-css ignore:end */<--
      serializedBuffer = buffer.join('') + character;
      lastCommentStartAt = serializedBuffer.lastIndexOf(marker.FORWARD_SLASH + marker.ASTERISK);

      serializedBufferPart = serializedBuffer.substring(0, lastCommentStartAt);
      lastToken = [token.RAW, serializedBufferPart, [originalMetadata(metadata, serializedBufferPart, externalContext)]];
      newTokens.push(lastToken);

      serializedBufferPart = serializedBuffer.substring(lastCommentStartAt);
      metadata = [position.line, position.column - serializedBufferPart.length + 1, position.source];
      lastToken = [token.COMMENT, serializedBufferPart, [originalMetadata(metadata, serializedBufferPart, externalContext)]];
      newTokens.push(lastToken);

      isRaw = false;
      level = levels.pop();
      metadata = metadatas.pop() || null;
      buffer = buffers.pop() || [];
    } else if (isCommentEnd) {
      // comment end, e.g. /* comment */<--
      serializedBuffer = buffer.join('').trim() + character;
      lastToken = [token.COMMENT, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]];
      newTokens.push(lastToken);

      level = levels.pop();
      metadata = metadatas.pop() || null;
      buffer = buffers.pop() || [];
    } else if (isCommentEndMarker && source[position.index + 1] != marker.ASTERISK) {
      externalContext.warnings.push('Unexpected \'*/\' at ' + formatPosition_1([position.line, position.column, position.source]) + '.');
      buffer = [];
    } else if (character == marker.SINGLE_QUOTE && !isQuoted) {
      // single quotation start, e.g. a[href^='https<--
      levels.push(level);
      level = Level$1.SINGLE_QUOTE;
      buffer.push(character);
    } else if (character == marker.SINGLE_QUOTE && level == Level$1.SINGLE_QUOTE) {
      // single quotation end, e.g. a[href^='https'<--
      level = levels.pop();
      buffer.push(character);
    } else if (character == marker.DOUBLE_QUOTE && !isQuoted) {
      // double quotation start, e.g. a[href^="<--
      levels.push(level);
      level = Level$1.DOUBLE_QUOTE;
      buffer.push(character);
    } else if (character == marker.DOUBLE_QUOTE && level == Level$1.DOUBLE_QUOTE) {
      // double quotation end, e.g. a[href^="https"<--
      level = levels.pop();
      buffer.push(character);
    } else if (!isCommentStart && !isCommentEnd && character != marker.CLOSE_ROUND_BRACKET && character != marker.OPEN_ROUND_BRACKET && level != Level$1.COMMENT && !isQuoted && roundBracketLevel > 0) {
      // character inside any function, e.g. hsla(.<--
      buffer.push(character);
    } else if (character == marker.OPEN_ROUND_BRACKET && !isQuoted && level != Level$1.COMMENT && !seekingValue) {
      // round open bracket, e.g. @import url(<--
      buffer.push(character);

      roundBracketLevel++;
    } else if (character == marker.CLOSE_ROUND_BRACKET && !isQuoted && level != Level$1.COMMENT && !seekingValue) {
      // round open bracket, e.g. @import url(test.css)<--
      buffer.push(character);

      roundBracketLevel--;
    } else if (character == marker.SEMICOLON && level == Level$1.BLOCK && buffer[0] == marker.AT) {
      // semicolon ending rule at block level, e.g. @import '...';<--
      serializedBuffer = buffer.join('').trim();
      allTokens.push([token.AT_RULE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);

      buffer = [];
    } else if (character == marker.COMMA && level == Level$1.BLOCK && ruleToken) {
      // comma separator at block level, e.g. a,div,<--
      serializedBuffer = buffer.join('').trim();
      ruleToken[1].push([tokenScopeFrom(ruleToken[0]), serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext, ruleToken[1].length)]]);

      buffer = [];
    } else if (character == marker.COMMA && level == Level$1.BLOCK && tokenTypeFrom(buffer) == token.AT_RULE) {
      // comma separator at block level, e.g. @import url(...) screen,<--
      // keep iterating as end semicolon will create the token
      buffer.push(character);
    } else if (character == marker.COMMA && level == Level$1.BLOCK) {
      // comma separator at block level, e.g. a,<--
      ruleToken = [tokenTypeFrom(buffer), [], []];
      serializedBuffer = buffer.join('').trim();
      ruleToken[1].push([tokenScopeFrom(ruleToken[0]), serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext, 0)]]);

      buffer = [];
    } else if (character == marker.OPEN_CURLY_BRACKET && level == Level$1.BLOCK && ruleToken && ruleToken[0] == token.NESTED_BLOCK) {
      // open brace opening at-rule at block level, e.g. @media{<--
      serializedBuffer = buffer.join('').trim();
      ruleToken[1].push([token.NESTED_BLOCK_SCOPE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);
      allTokens.push(ruleToken);

      levels.push(level);
      position.column++;
      position.index++;
      buffer = [];

      ruleToken[2] = intoTokens(source, externalContext, internalContext, true);
      ruleToken = null;
    } else if (character == marker.OPEN_CURLY_BRACKET && level == Level$1.BLOCK && tokenTypeFrom(buffer) == token.NESTED_BLOCK) {
      // open brace opening at-rule at block level, e.g. @media{<--
      serializedBuffer = buffer.join('').trim();
      ruleToken = ruleToken || [token.NESTED_BLOCK, [], []];
      ruleToken[1].push([token.NESTED_BLOCK_SCOPE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);
      allTokens.push(ruleToken);

      levels.push(level);
      position.column++;
      position.index++;
      buffer = [];

      ruleToken[2] = intoTokens(source, externalContext, internalContext, true);
      ruleToken = null;
    } else if (character == marker.OPEN_CURLY_BRACKET && level == Level$1.BLOCK) {
      // open brace opening rule at block level, e.g. div{<--
      serializedBuffer = buffer.join('').trim();
      ruleToken = ruleToken || [tokenTypeFrom(buffer), [], []];
      ruleToken[1].push([tokenScopeFrom(ruleToken[0]), serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext, ruleToken[1].length)]]);
      newTokens = ruleToken[2];
      allTokens.push(ruleToken);

      levels.push(level);
      level = Level$1.RULE;
      buffer = [];
    } else if (character == marker.OPEN_CURLY_BRACKET && level == Level$1.RULE && seekingValue) {
      // open brace opening rule at rule level, e.g. div{--variable:{<--
      ruleTokens.push(ruleToken);
      ruleToken = [token.PROPERTY_BLOCK, []];
      propertyToken.push(ruleToken);
      newTokens = ruleToken[1];

      levels.push(level);
      level = Level$1.RULE;
      seekingValue = false;
    } else if (character == marker.OPEN_CURLY_BRACKET && level == Level$1.RULE && isPageMarginBox(buffer)) {
      // open brace opening page-margin box at rule level, e.g. @page{@top-center{<--
      serializedBuffer = buffer.join('').trim();
      ruleTokens.push(ruleToken);
      ruleToken = [token.AT_RULE_BLOCK, [], []];
      ruleToken[1].push([token.AT_RULE_BLOCK_SCOPE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);
      newTokens.push(ruleToken);
      newTokens = ruleToken[2];

      levels.push(level);
      level = Level$1.RULE;
      buffer = [];
    } else if (character == marker.COLON && level == Level$1.RULE && !seekingValue) {
      // colon at rule level, e.g. a{color:<--
      serializedBuffer = buffer.join('').trim();
      propertyToken = [token.PROPERTY, [token.PROPERTY_NAME, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]];
      newTokens.push(propertyToken);

      seekingValue = true;
      buffer = [];
    } else if (character == marker.SEMICOLON && level == Level$1.RULE && propertyToken && ruleTokens.length > 0 && buffer.length > 0 && buffer[0] == marker.AT) {
      // semicolon at rule level for at-rule, e.g. a{--color:{@apply(--other-color);<--
      serializedBuffer = buffer.join('').trim();
      ruleToken[1].push([token.AT_RULE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);

      buffer = [];
    } else if (character == marker.SEMICOLON && level == Level$1.RULE && propertyToken && buffer.length > 0) {
      // semicolon at rule level, e.g. a{color:red;<--
      serializedBuffer = buffer.join('').trim();
      propertyToken.push([token.PROPERTY_VALUE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);

      propertyToken = null;
      seekingValue = false;
      buffer = [];
    } else if (character == marker.SEMICOLON && level == Level$1.RULE && propertyToken && buffer.length === 0) {
      // semicolon after bracketed value at rule level, e.g. a{color:rgb(...);<--
      propertyToken = null;
      seekingValue = false;
    } else if (character == marker.SEMICOLON && level == Level$1.RULE && buffer.length > 0 && buffer[0] == marker.AT) {
      // semicolon for at-rule at rule level, e.g. a{@apply(--variable);<--
      serializedBuffer = buffer.join('');
      newTokens.push([token.AT_RULE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);

      seekingValue = false;
      buffer = [];
    } else if (character == marker.SEMICOLON && level == Level$1.RULE && seekingPropertyBlockClosing) {
      // close brace after a property block at rule level, e.g. a{--custom:{color:red;};<--
      seekingPropertyBlockClosing = false;
      buffer = [];
    } else if (character == marker.SEMICOLON && level == Level$1.RULE && buffer.length === 0) ; else if (character == marker.CLOSE_CURLY_BRACKET && level == Level$1.RULE && propertyToken && seekingValue && buffer.length > 0 && ruleTokens.length > 0) {
      // close brace at rule level, e.g. a{--color:{color:red}<--
      serializedBuffer = buffer.join('');
      propertyToken.push([token.PROPERTY_VALUE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);
      propertyToken = null;
      ruleToken = ruleTokens.pop();
      newTokens = ruleToken[2];

      level = levels.pop();
      seekingValue = false;
      buffer = [];
    } else if (character == marker.CLOSE_CURLY_BRACKET && level == Level$1.RULE && propertyToken && buffer.length > 0 && buffer[0] == marker.AT && ruleTokens.length > 0) {
      // close brace at rule level for at-rule, e.g. a{--color:{@apply(--other-color)}<--
      serializedBuffer = buffer.join('');
      ruleToken[1].push([token.AT_RULE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);
      propertyToken = null;
      ruleToken = ruleTokens.pop();
      newTokens = ruleToken[2];

      level = levels.pop();
      seekingValue = false;
      buffer = [];
    } else if (character == marker.CLOSE_CURLY_BRACKET && level == Level$1.RULE && propertyToken && ruleTokens.length > 0) {
      // close brace at rule level after space, e.g. a{--color:{color:red }<--
      propertyToken = null;
      ruleToken = ruleTokens.pop();
      newTokens = ruleToken[2];

      level = levels.pop();
      seekingValue = false;
    } else if (character == marker.CLOSE_CURLY_BRACKET && level == Level$1.RULE && propertyToken && buffer.length > 0) {
      // close brace at rule level, e.g. a{color:red}<--
      serializedBuffer = buffer.join('');
      propertyToken.push([token.PROPERTY_VALUE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);
      propertyToken = null;
      ruleToken = ruleTokens.pop();
      newTokens = allTokens;

      level = levels.pop();
      seekingValue = false;
      buffer = [];
    } else if (character == marker.CLOSE_CURLY_BRACKET && level == Level$1.RULE && buffer.length > 0 && buffer[0] == marker.AT) {
      // close brace after at-rule at rule level, e.g. a{@apply(--variable)}<--
      propertyToken = null;
      ruleToken = null;
      serializedBuffer = buffer.join('').trim();
      newTokens.push([token.AT_RULE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);
      newTokens = allTokens;

      level = levels.pop();
      seekingValue = false;
      buffer = [];
    } else if (character == marker.CLOSE_CURLY_BRACKET && level == Level$1.RULE && levels[levels.length - 1] == Level$1.RULE) {
      // close brace after a property block at rule level, e.g. a{--custom:{color:red;}<--
      propertyToken = null;
      ruleToken = ruleTokens.pop();
      newTokens = ruleToken[2];

      level = levels.pop();
      seekingValue = false;
      seekingPropertyBlockClosing = true;
      buffer = [];
    } else if (character == marker.CLOSE_CURLY_BRACKET && level == Level$1.RULE) {
      // close brace after a rule, e.g. a{color:red;}<--
      propertyToken = null;
      ruleToken = null;
      newTokens = allTokens;

      level = levels.pop();
      seekingValue = false;
    } else if (character == marker.CLOSE_CURLY_BRACKET && level == Level$1.BLOCK && !isNested && position.index <= source.length - 1) {
      // stray close brace at block level, e.g. a{color:red}color:blue}<--
      externalContext.warnings.push('Unexpected \'}\' at ' + formatPosition_1([position.line, position.column, position.source]) + '.');
      buffer.push(character);
    } else if (character == marker.CLOSE_CURLY_BRACKET && level == Level$1.BLOCK) {
      // close brace at block level, e.g. @media screen {...}<--
      break;
    } else if (character == marker.OPEN_ROUND_BRACKET && level == Level$1.RULE && seekingValue) {
      // round open bracket, e.g. a{color:hsla(<--
      buffer.push(character);
      roundBracketLevel++;
    } else if (character == marker.CLOSE_ROUND_BRACKET && level == Level$1.RULE && seekingValue && roundBracketLevel == 1) {
      // round close bracket, e.g. a{color:hsla(0,0%,0%)<--
      buffer.push(character);
      serializedBuffer = buffer.join('').trim();
      propertyToken.push([token.PROPERTY_VALUE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);

      roundBracketLevel--;
      buffer = [];
    } else if (character == marker.CLOSE_ROUND_BRACKET && level == Level$1.RULE && seekingValue) {
      // round close bracket within other brackets, e.g. a{width:calc((10rem / 2)<--
      buffer.push(character);
      roundBracketLevel--;
    } else if (character == marker.FORWARD_SLASH && source[position.index + 1] != marker.ASTERISK && level == Level$1.RULE && seekingValue && buffer.length > 0) {
      // forward slash within a property, e.g. a{background:url(image.png) 0 0/<--
      serializedBuffer = buffer.join('').trim();
      propertyToken.push([token.PROPERTY_VALUE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);
      propertyToken.push([token.PROPERTY_VALUE, character, [[position.line, position.column, position.source]]]);

      buffer = [];
    } else if (character == marker.FORWARD_SLASH && source[position.index + 1] != marker.ASTERISK && level == Level$1.RULE && seekingValue) {
      // forward slash within a property after space, e.g. a{background:url(image.png) 0 0 /<--
      propertyToken.push([token.PROPERTY_VALUE, character, [[position.line, position.column, position.source]]]);

      buffer = [];
    } else if (character == marker.COMMA && level == Level$1.RULE && seekingValue && buffer.length > 0) {
      // comma within a property, e.g. a{background:url(image.png),<--
      serializedBuffer = buffer.join('').trim();
      propertyToken.push([token.PROPERTY_VALUE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);
      propertyToken.push([token.PROPERTY_VALUE, character, [[position.line, position.column, position.source]]]);

      buffer = [];
    } else if (character == marker.COMMA && level == Level$1.RULE && seekingValue) {
      // comma within a property after space, e.g. a{background:url(image.png) ,<--
      propertyToken.push([token.PROPERTY_VALUE, character, [[position.line, position.column, position.source]]]);

      buffer = [];
    } else if (character == marker.CLOSE_SQUARE_BRACKET && propertyToken && propertyToken.length > 1 && buffer.length > 0 && isRepeatToken(buffer)) {
      buffer.push(character);
      serializedBuffer = buffer.join('').trim();
      propertyToken[propertyToken.length - 1][1] += serializedBuffer;

      buffer = [];
    } else if ((isSpace || (isNewLineNix && !isNewLineWin)) && level == Level$1.RULE && seekingValue && propertyToken && buffer.length > 0) {
      // space or *nix newline within property, e.g. a{margin:0 <--
      serializedBuffer = buffer.join('').trim();
      propertyToken.push([token.PROPERTY_VALUE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);

      buffer = [];
    } else if (isNewLineWin && level == Level$1.RULE && seekingValue && propertyToken && buffer.length > 1) {
      // win newline within property, e.g. a{margin:0\r\n<--
      serializedBuffer = buffer.join('').trim();
      propertyToken.push([token.PROPERTY_VALUE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);

      buffer = [];
    } else if (isNewLineWin && level == Level$1.RULE && seekingValue) {
      // win newline
      buffer = [];
    } else if (buffer.length == 1 && isNewLineWin) {
      // ignore windows newline which is composed of two characters
      buffer.pop();
    } else if (buffer.length > 0 || !isSpace && !isNewLineNix && !isNewLineWin && !isCarriageReturn) {
      // any character
      buffer.push(character);
    }

    wasEscaped = isEscaped;
    isEscaped = !wasEscaped && character == marker.BACK_SLASH;
    wasCommentStart = isCommentStart;
    wasCommentEnd = isCommentEnd;

    position.line = (isNewLineWin || isNewLineNix || isCarriageReturn) ? position.line + 1 : position.line;
    position.column = (isNewLineWin || isNewLineNix || isCarriageReturn) ? 0 : position.column + 1;
  }

  if (seekingValue) {
    externalContext.warnings.push('Missing \'}\' at ' + formatPosition_1([position.line, position.column, position.source]) + '.');
  }

  if (seekingValue && buffer.length > 0) {
    serializedBuffer = buffer.join('').replace(TAIL_BROKEN_VALUE_PATTERN, '');
    propertyToken.push([token.PROPERTY_VALUE, serializedBuffer, [originalMetadata(metadata, serializedBuffer, externalContext)]]);

    buffer = [];
  }

  if (buffer.length > 0) {
    externalContext.warnings.push('Invalid character(s) \'' + buffer.join('') + '\' at ' + formatPosition_1(metadata) + '. Ignoring.');
  }

  return allTokens;
}

function isIgnoreStartComment(buffer) {
  return IGNORE_START_COMMENT_PATTERN.test(buffer.join('') + marker.FORWARD_SLASH);
}

function isIgnoreEndComment(buffer) {
  return IGNORE_END_COMMENT_PATTERN.test(buffer.join('') + marker.FORWARD_SLASH);
}

function originalMetadata(metadata, value, externalContext, selectorFallbacks) {
  var source = metadata[2];

  return externalContext.inputSourceMapTracker.isTracking(source) ?
    externalContext.inputSourceMapTracker.originalPositionFor(metadata, value.length, selectorFallbacks) :
    metadata;
}

function tokenTypeFrom(buffer) {
  var isAtRule = buffer[0] == marker.AT || buffer[0] == marker.UNDERSCORE;
  var ruleWord = buffer.join('').split(RULE_WORD_SEPARATOR_PATTERN)[0];

  if (isAtRule && BLOCK_RULES.indexOf(ruleWord) > -1) {
    return token.NESTED_BLOCK;
  } else if (isAtRule && AT_RULES.indexOf(ruleWord) > -1) {
    return token.AT_RULE;
  } else if (isAtRule) {
    return token.AT_RULE_BLOCK;
  } else {
    return token.RULE;
  }
}

function tokenScopeFrom(tokenType) {
  if (tokenType == token.RULE) {
    return token.RULE_SCOPE;
  } else if (tokenType == token.NESTED_BLOCK) {
    return token.NESTED_BLOCK_SCOPE;
  } else if (tokenType == token.AT_RULE_BLOCK) {
    return token.AT_RULE_BLOCK_SCOPE;
  }
}

function isPageMarginBox(buffer) {
  var serializedBuffer = buffer.join('').trim();

  return PAGE_MARGIN_BOXES.indexOf(serializedBuffer) > -1 || EXTRA_PAGE_BOXES.indexOf(serializedBuffer) > -1;
}

function isRepeatToken(buffer) {
  return REPEAT_PATTERN.test(buffer.join('') + marker.CLOSE_SQUARE_BRACKET);
}

var tokenize_1 = tokenize;

var UNKNOWN_URI = 'uri:unknown';

function readSources(input, context, callback) {
  return doReadSources(input, context, function (tokens) {
    return applySourceMaps_1(tokens, context, function () {
      return loadOriginalSources_1(context, function () { return callback(tokens); });
    });
  });
}

function doReadSources(input, context, callback) {
  if (typeof input == 'string') {
    return fromString(input, context, callback);
  } else if (Buffer.isBuffer(input)) {
    return fromString(input.toString(), context, callback);
  } else if (Array.isArray(input)) {
    return fromArray(input, context, callback);
  } else if (typeof input == 'object') {
    return fromHash(input, context, callback);
  }
}

function fromString(input, context, callback) {
  context.source = undefined;
  context.sourcesContent[undefined] = input;
  context.stats.originalSize += input.length;

  return fromStyles(input, context, { inline: context.options.inline }, callback);
}

function fromArray(input, context, callback) {
  var inputAsImports = input.reduce(function (accumulator, uriOrHash) {
    if (typeof uriOrHash === 'string') {
      return addStringSource(uriOrHash, accumulator);
    } else {
      return addHashSource(uriOrHash, context, accumulator);
    }

  }, []);

  return fromStyles(inputAsImports.join(''), context, { inline: ['all'] }, callback);
}

function fromHash(input, context, callback) {
  var inputAsImports = addHashSource(input, context, []);
  return fromStyles(inputAsImports.join(''), context, { inline: ['all'] }, callback);
}

function addStringSource(input, imports) {
  imports.push(restoreAsImport(normalizeUri(input)));
  return imports;
}

function addHashSource(input, context, imports) {
  var uri;
  var normalizedUri;
  var source;

  for (uri in input) {
    source = input[uri];
    normalizedUri = normalizeUri(uri);

    imports.push(restoreAsImport(normalizedUri));

    context.sourcesContent[normalizedUri] = source.styles;

    if (source.sourceMap) {
      trackSourceMap(source.sourceMap, normalizedUri, context);
    }
  }

  return imports;
}

function normalizeUri(uri) {
  var currentPath = path.resolve('');
  var absoluteUri;
  var relativeToCurrentPath;
  var normalizedUri;

  if (isRemoteResource_1(uri)) {
    return uri;
  }

  absoluteUri = path.isAbsolute(uri) ?
    uri :
    path.resolve(uri);
  relativeToCurrentPath = path.relative(currentPath, absoluteUri);
  normalizedUri = normalizePath_1(relativeToCurrentPath);

  return normalizedUri;
}

function trackSourceMap(sourceMap, uri, context) {
  var parsedMap = typeof sourceMap == 'string' ?
      JSON.parse(sourceMap) :
      sourceMap;
  var rebasedMap = isRemoteResource_1(uri) ?
    rebaseRemoteMap_1(parsedMap, uri) :
    rebaseLocalMap_1(parsedMap, uri || UNKNOWN_URI, context.options.rebaseTo);

  context.inputSourceMapTracker.track(uri, rebasedMap);
}

function restoreAsImport(uri) {
  return restoreImport_1('url(' + uri + ')', '') + marker.SEMICOLON;
}

function fromStyles(styles, context, parentInlinerContext, callback) {
  var tokens;
  var rebaseConfig = {};

  if (!context.source) {
    rebaseConfig.fromBase = path.resolve('');
    rebaseConfig.toBase = context.options.rebaseTo;
  } else if (isRemoteResource_1(context.source)) {
    rebaseConfig.fromBase = context.source;
    rebaseConfig.toBase = context.source;
  } else if (path.isAbsolute(context.source)) {
    rebaseConfig.fromBase = path.dirname(context.source);
    rebaseConfig.toBase = context.options.rebaseTo;
  } else {
    rebaseConfig.fromBase = path.dirname(path.resolve(context.source));
    rebaseConfig.toBase = context.options.rebaseTo;
  }

  tokens = tokenize_1(styles, context);
  tokens = rebase_1(tokens, context.options.rebase, context.validator, rebaseConfig);

  return allowsAnyImports(parentInlinerContext.inline) ?
    inline$1(tokens, context, parentInlinerContext, callback) :
    callback(tokens);
}

function allowsAnyImports(inline) {
  return !(inline.length == 1 && inline[0] == 'none');
}

function inline$1(tokens, externalContext, parentInlinerContext, callback) {
  var inlinerContext = {
    afterContent: false,
    callback: callback,
    errors: externalContext.errors,
    externalContext: externalContext,
    fetch: externalContext.options.fetch,
    inlinedStylesheets: parentInlinerContext.inlinedStylesheets || externalContext.inlinedStylesheets,
    inline: parentInlinerContext.inline,
    inlineRequest: externalContext.options.inlineRequest,
    inlineTimeout: externalContext.options.inlineTimeout,
    isRemote: parentInlinerContext.isRemote || false,
    localOnly: externalContext.localOnly,
    outputTokens: [],
    rebaseTo: externalContext.options.rebaseTo,
    sourceTokens: tokens,
    warnings: externalContext.warnings
  };

  return doInlineImports(inlinerContext);
}

function doInlineImports(inlinerContext) {
  var token$1;
  var i, l;

  for (i = 0, l = inlinerContext.sourceTokens.length; i < l; i++) {
    token$1 = inlinerContext.sourceTokens[i];

    if (token$1[0] == token.AT_RULE && isImport_1(token$1[1])) {
      inlinerContext.sourceTokens.splice(0, i);
      return inlineStylesheet(token$1, inlinerContext);
    } else if (token$1[0] == token.AT_RULE || token$1[0] == token.COMMENT) {
      inlinerContext.outputTokens.push(token$1);
    } else {
      inlinerContext.outputTokens.push(token$1);
      inlinerContext.afterContent = true;
    }
  }

  inlinerContext.sourceTokens = [];
  return inlinerContext.callback(inlinerContext.outputTokens);
}

function inlineStylesheet(token, inlinerContext) {
  var uriAndMediaQuery = extractImportUrlAndMedia_1(token[1]);
  var uri = uriAndMediaQuery[0];
  var mediaQuery = uriAndMediaQuery[1];
  var metadata = token[2];

  return isRemoteResource_1(uri) ?
    inlineRemoteStylesheet(uri, mediaQuery, metadata, inlinerContext) :
    inlineLocalStylesheet(uri, mediaQuery, metadata, inlinerContext);
}

function inlineRemoteStylesheet(uri, mediaQuery, metadata, inlinerContext) {
  var isAllowed = isAllowedResource_1(uri, true, inlinerContext.inline);
  var originalUri = uri;
  var isLoaded = uri in inlinerContext.externalContext.sourcesContent;
  var isRuntimeResource = !hasProtocol_1(uri);

  if (inlinerContext.inlinedStylesheets.indexOf(uri) > -1) {
    inlinerContext.warnings.push('Ignoring remote @import of "' + uri + '" as it has already been imported.');
    inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);
    return doInlineImports(inlinerContext);
  } else if (inlinerContext.localOnly && inlinerContext.afterContent) {
    inlinerContext.warnings.push('Ignoring remote @import of "' + uri + '" as no callback given and after other content.');
    inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);
    return doInlineImports(inlinerContext);
  } else if (isRuntimeResource) {
    inlinerContext.warnings.push('Skipping remote @import of "' + uri + '" as no protocol given.');
    inlinerContext.outputTokens = inlinerContext.outputTokens.concat(inlinerContext.sourceTokens.slice(0, 1));
    inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);
    return doInlineImports(inlinerContext);
  } else if (inlinerContext.localOnly && !isLoaded) {
    inlinerContext.warnings.push('Skipping remote @import of "' + uri + '" as no callback given.');
    inlinerContext.outputTokens = inlinerContext.outputTokens.concat(inlinerContext.sourceTokens.slice(0, 1));
    inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);
    return doInlineImports(inlinerContext);
  } else if (!isAllowed && inlinerContext.afterContent) {
    inlinerContext.warnings.push('Ignoring remote @import of "' + uri + '" as resource is not allowed and after other content.');
    inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);
    return doInlineImports(inlinerContext);
  } else if (!isAllowed) {
    inlinerContext.warnings.push('Skipping remote @import of "' + uri + '" as resource is not allowed.');
    inlinerContext.outputTokens = inlinerContext.outputTokens.concat(inlinerContext.sourceTokens.slice(0, 1));
    inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);
    return doInlineImports(inlinerContext);
  }

  inlinerContext.inlinedStylesheets.push(uri);

  function whenLoaded(error, importedStyles) {
    if (error) {
      inlinerContext.errors.push('Broken @import declaration of "' + uri + '" - ' + error);

      return process.nextTick(function () {
        inlinerContext.outputTokens = inlinerContext.outputTokens.concat(inlinerContext.sourceTokens.slice(0, 1));
        inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);
        doInlineImports(inlinerContext);
      });
    }

    inlinerContext.inline = inlinerContext.externalContext.options.inline;
    inlinerContext.isRemote = true;

    inlinerContext.externalContext.source = originalUri;
    inlinerContext.externalContext.sourcesContent[uri] = importedStyles;
    inlinerContext.externalContext.stats.originalSize += importedStyles.length;

    return fromStyles(importedStyles, inlinerContext.externalContext, inlinerContext, function (importedTokens) {
      importedTokens = wrapInMedia(importedTokens, mediaQuery, metadata);

      inlinerContext.outputTokens = inlinerContext.outputTokens.concat(importedTokens);
      inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);

      return doInlineImports(inlinerContext);
    });
  }

  return isLoaded ?
    whenLoaded(null, inlinerContext.externalContext.sourcesContent[uri]) :
    inlinerContext.fetch(uri, inlinerContext.inlineRequest, inlinerContext.inlineTimeout, whenLoaded);
}

function inlineLocalStylesheet(uri, mediaQuery, metadata, inlinerContext) {
  var currentPath = path.resolve('');
  var absoluteUri = path.isAbsolute(uri) ?
    path.resolve(currentPath, uri[0] == '/' ? uri.substring(1) : uri) :
    path.resolve(inlinerContext.rebaseTo, uri);
  var relativeToCurrentPath = path.relative(currentPath, absoluteUri);
  var importedStyles;
  var isAllowed = isAllowedResource_1(uri, false, inlinerContext.inline);
  var normalizedPath = normalizePath_1(relativeToCurrentPath);
  var isLoaded = normalizedPath in inlinerContext.externalContext.sourcesContent;

  if (inlinerContext.inlinedStylesheets.indexOf(absoluteUri) > -1) {
    inlinerContext.warnings.push('Ignoring local @import of "' + uri + '" as it has already been imported.');
  } else if (!isLoaded && (!fs.existsSync(absoluteUri) || !fs.statSync(absoluteUri).isFile())) {
    inlinerContext.errors.push('Ignoring local @import of "' + uri + '" as resource is missing.');
  } else if (!isAllowed && inlinerContext.afterContent) {
    inlinerContext.warnings.push('Ignoring local @import of "' + uri + '" as resource is not allowed and after other content.');
  } else if (inlinerContext.afterContent) {
    inlinerContext.warnings.push('Ignoring local @import of "' + uri + '" as after other content.');
  } else if (!isAllowed) {
    inlinerContext.warnings.push('Skipping local @import of "' + uri + '" as resource is not allowed.');
    inlinerContext.outputTokens = inlinerContext.outputTokens.concat(inlinerContext.sourceTokens.slice(0, 1));
  } else {
    importedStyles = isLoaded ?
      inlinerContext.externalContext.sourcesContent[normalizedPath] :
      fs.readFileSync(absoluteUri, 'utf-8');

    inlinerContext.inlinedStylesheets.push(absoluteUri);
    inlinerContext.inline = inlinerContext.externalContext.options.inline;

    inlinerContext.externalContext.source = normalizedPath;
    inlinerContext.externalContext.sourcesContent[normalizedPath] = importedStyles;
    inlinerContext.externalContext.stats.originalSize += importedStyles.length;

    return fromStyles(importedStyles, inlinerContext.externalContext, inlinerContext, function (importedTokens) {
      importedTokens = wrapInMedia(importedTokens, mediaQuery, metadata);

      inlinerContext.outputTokens = inlinerContext.outputTokens.concat(importedTokens);
      inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);

      return doInlineImports(inlinerContext);
    });
  }

  inlinerContext.sourceTokens = inlinerContext.sourceTokens.slice(1);

  return doInlineImports(inlinerContext);
}

function wrapInMedia(tokens, mediaQuery, metadata) {
  if (mediaQuery) {
    return [[token.NESTED_BLOCK, [[token.NESTED_BLOCK_SCOPE, '@media ' + mediaQuery, metadata]], tokens]];
  } else {
    return tokens;
  }
}

var readSources_1 = readSources;

var all$3 = helpers.all;

function store$1(serializeContext, token) {
  var value = typeof token == 'string' ?
    token :
    token[1];
  var wrap = serializeContext.wrap;

  wrap(serializeContext, value);
  track$1(serializeContext, value);
  serializeContext.output.push(value);
}

function wrap(serializeContext, value) {
  if (serializeContext.column + value.length > serializeContext.format.wrapAt) {
    track$1(serializeContext, serializeContext.format.breakWith);
    serializeContext.output.push(serializeContext.format.breakWith);
  }
}

function track$1(serializeContext, value) {
  var parts = value.split('\n');

  serializeContext.line += parts.length - 1;
  serializeContext.column = parts.length > 1 ? 0 : (serializeContext.column + parts.pop().length);
}

function serializeStyles(tokens, context) {
  var serializeContext = {
    column: 0,
    format: context.options.format,
    indentBy: 0,
    indentWith: '',
    line: 1,
    output: [],
    spaceAfterClosingBrace: context.options.compatibility.properties.spaceAfterClosingBrace,
    store: store$1,
    wrap: context.options.format.wrapAt ?
      wrap :
      function () { /* noop */  }
  };

  all$3(serializeContext, tokens);

  return {
    styles: serializeContext.output.join('')
  };
}

var simple = serializeStyles;

var SourceMapGenerator$3 = sourceMap.SourceMapGenerator;
var all$4 = helpers.all;



var isWindows$1 = process.platform == 'win32';

var NIX_SEPARATOR_PATTERN = /\//g;
var UNKNOWN_SOURCE = '$stdin';
var WINDOWS_SEPARATOR = '\\';

function store$2(serializeContext, element) {
  var fromString = typeof element == 'string';
  var value = fromString ? element : element[1];
  var mappings = fromString ? null : element[2];
  var wrap = serializeContext.wrap;

  wrap(serializeContext, value);
  track$2(serializeContext, value, mappings);
  serializeContext.output.push(value);
}

function wrap$1(serializeContext, value) {
  if (serializeContext.column + value.length > serializeContext.format.wrapAt) {
    track$2(serializeContext, serializeContext.format.breakWith, false);
    serializeContext.output.push(serializeContext.format.breakWith);
  }
}

function track$2(serializeContext, value, mappings) {
  var parts = value.split('\n');

  if (mappings) {
    trackAllMappings(serializeContext, mappings);
  }

  serializeContext.line += parts.length - 1;
  serializeContext.column = parts.length > 1 ? 0 : (serializeContext.column + parts.pop().length);
}

function trackAllMappings(serializeContext, mappings) {
  for (var i = 0, l = mappings.length; i < l; i++) {
    trackMapping(serializeContext, mappings[i]);
  }
}

function trackMapping(serializeContext, mapping) {
  var line = mapping[0];
  var column = mapping[1];
  var originalSource = mapping[2];
  var source = originalSource;
  var storedSource = source || UNKNOWN_SOURCE;

  if (isWindows$1 && source && !isRemoteResource_1(source)) {
    storedSource = source.replace(NIX_SEPARATOR_PATTERN, WINDOWS_SEPARATOR);
  }

  serializeContext.outputMap.addMapping({
    generated: {
      line: serializeContext.line,
      column: serializeContext.column
    },
    source: storedSource,
    original: {
      line: line,
      column: column
    }
  });

  if (serializeContext.inlineSources && (originalSource in serializeContext.sourcesContent)) {
    serializeContext.outputMap.setSourceContent(storedSource, serializeContext.sourcesContent[originalSource]);
  }
}

function serializeStylesAndSourceMap(tokens, context) {
  var serializeContext = {
    column: 0,
    format: context.options.format,
    indentBy: 0,
    indentWith: '',
    inlineSources: context.options.sourceMapInlineSources,
    line: 1,
    output: [],
    outputMap: new SourceMapGenerator$3(),
    sourcesContent: context.sourcesContent,
    spaceAfterClosingBrace: context.options.compatibility.properties.spaceAfterClosingBrace,
    store: store$2,
    wrap: context.options.format.wrapAt ?
      wrap$1 :
      function () { /* noop */  }
  };

  all$4(serializeContext, tokens);

  return {
    sourceMap: serializeContext.outputMap,
    styles: serializeContext.output.join('')
  };
}

var sourceMaps = serializeStylesAndSourceMap;

var clean = createCommonjsModule(function (module) {
/**
 * Clean-css - https://github.com/jakubpawlowicz/clean-css
 * Released under the terms of MIT license
 *
 * Copyright (C) 2017 JakubPawlowicz.com
 */








var formatFrom = format.formatFrom;



var OptimizationLevel = optimizationLevel.OptimizationLevel;
var optimizationLevelFrom = optimizationLevel.optimizationLevelFrom;









var CleanCSS = module.exports = function CleanCSS(options) {
  options = options || {};

  this.options = {
    compatibility: compatibility(options.compatibility),
    fetch: fetch(options.fetch),
    format: formatFrom(options.format),
    inline: inline(options.inline),
    inlineRequest: inlineRequest(options.inlineRequest),
    inlineTimeout: inlineTimeout(options.inlineTimeout),
    level: optimizationLevelFrom(options.level),
    rebase: rebase(options.rebase),
    rebaseTo: rebaseTo(options.rebaseTo),
    returnPromise: !!options.returnPromise,
    sourceMap: !!options.sourceMap,
    sourceMapInlineSources: !!options.sourceMapInlineSources
  };
};


// for compatibility with optimize-css-assets-webpack-plugin
CleanCSS.process = function (input, opts) {
  var cleanCss;
  var optsTo = opts.to;

  delete opts.to;
  cleanCss = new CleanCSS(Object.assign({ returnPromise: true, rebaseTo: optsTo }, opts));

  return cleanCss.minify(input)
    .then(function(output) {
      return { css: output.styles };
    });
};


CleanCSS.prototype.minify = function (input, maybeSourceMap, maybeCallback) {
  var options = this.options;

  if (options.returnPromise) {
    return new Promise(function (resolve, reject) {
      minify(input, options, maybeSourceMap, function (errors, output) {
        return errors ?
          reject(errors) :
          resolve(output);
      });
    });
  } else {
    return minify(input, options, maybeSourceMap, maybeCallback);
  }
};

function minify(input, options, maybeSourceMap, maybeCallback) {
  var sourceMap = typeof maybeSourceMap != 'function' ?
    maybeSourceMap :
    null;
  var callback = typeof maybeCallback == 'function' ?
    maybeCallback :
    (typeof maybeSourceMap == 'function' ? maybeSourceMap : null);
  var context = {
    stats: {
      efficiency: 0,
      minifiedSize: 0,
      originalSize: 0,
      startedAt: Date.now(),
      timeSpent: 0
    },
    cache: {
      specificity: {}
    },
    errors: [],
    inlinedStylesheets: [],
    inputSourceMapTracker: inputSourceMapTracker_1(),
    localOnly: !callback,
    options: options,
    source: null,
    sourcesContent: {},
    validator: validator_1(options.compatibility),
    warnings: []
  };

  if (sourceMap) {
    context.inputSourceMapTracker.track(undefined, sourceMap);
  }

  return runner(context.localOnly)(function () {
    return readSources_1(input, context, function (tokens) {
      var serialize = context.options.sourceMap ?
        sourceMaps :
        simple;

      var optimizedTokens = optimize$2(tokens, context);
      var optimizedStyles = serialize(optimizedTokens, context);
      var output = withMetadata(optimizedStyles, context);

      return callback ?
        callback(context.errors.length > 0 ? context.errors : null, output) :
        output;
    });
  });
}

function runner(localOnly) {
  // to always execute code asynchronously when a callback is given
  // more at blog.izs.me/post/59142742143/designing-apis-for-asynchrony
  return localOnly ?
    function (callback) { return callback(); } :
    process.nextTick;
}

function optimize$2(tokens, context) {
  var optimized;

  optimized = optimize(tokens);
  optimized = OptimizationLevel.One in context.options.level ?
    optimize$1(tokens, context) :
    tokens;
  optimized = OptimizationLevel.Two in context.options.level ?
    optimize$3(tokens, context, true) :
    optimized;

  return optimized;
}

function withMetadata(output, context) {
  output.stats = calculateStatsFrom(output.styles, context);
  output.errors = context.errors;
  output.inlinedStylesheets = context.inlinedStylesheets;
  output.warnings = context.warnings;

  return output;
}

function calculateStatsFrom(styles, context) {
  var finishedAt = Date.now();
  var timeSpent = finishedAt - context.stats.startedAt;

  delete context.stats.startedAt;
  context.stats.timeSpent = timeSpent;
  context.stats.efficiency = 1 - styles.length / context.stats.originalSize;
  context.stats.minifiedSize = styles.length;

  return context.stats;
}
});
