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

var openParentheses = "(".charCodeAt(0);
var closeParentheses = ")".charCodeAt(0);
var singleQuote = "'".charCodeAt(0);
var doubleQuote = '"'.charCodeAt(0);
var backslash = "\\".charCodeAt(0);
var slash = "/".charCodeAt(0);
var comma = ",".charCodeAt(0);
var colon = ":".charCodeAt(0);
var star = "*".charCodeAt(0);
var uLower = "u".charCodeAt(0);
var uUpper = "U".charCodeAt(0);
var plus = "+".charCodeAt(0);
var isUnicodeRange = /^[a-f0-9?-]+$/i;

var parse = function(input) {
  var tokens = [];
  var value = input;

  var next,
    quote,
    prev,
    token,
    escape,
    escapePos,
    whitespacePos,
    parenthesesOpenPos;
  var pos = 0;
  var code = value.charCodeAt(pos);
  var max = value.length;
  var stack = [{ nodes: tokens }];
  var balanced = 0;
  var parent;

  var name = "";
  var before = "";
  var after = "";

  while (pos < max) {
    // Whitespaces
    if (code <= 32) {
      next = pos;
      do {
        next += 1;
        code = value.charCodeAt(next);
      } while (code <= 32);
      token = value.slice(pos, next);

      prev = tokens[tokens.length - 1];
      if (code === closeParentheses && balanced) {
        after = token;
      } else if (prev && prev.type === "div") {
        prev.after = token;
      } else if (
        code === comma ||
        code === colon ||
        (code === slash &&
          value.charCodeAt(next + 1) !== star &&
          (!parent ||
            (parent && parent.type === "function" && parent.value !== "calc")))
      ) {
        before = token;
      } else {
        tokens.push({
          type: "space",
          sourceIndex: pos,
          value: token
        });
      }

      pos = next;

      // Quotes
    } else if (code === singleQuote || code === doubleQuote) {
      next = pos;
      quote = code === singleQuote ? "'" : '"';
      token = {
        type: "string",
        sourceIndex: pos,
        quote: quote
      };
      do {
        escape = false;
        next = value.indexOf(quote, next + 1);
        if (~next) {
          escapePos = next;
          while (value.charCodeAt(escapePos - 1) === backslash) {
            escapePos -= 1;
            escape = !escape;
          }
        } else {
          value += quote;
          next = value.length - 1;
          token.unclosed = true;
        }
      } while (escape);
      token.value = value.slice(pos + 1, next);

      tokens.push(token);
      pos = next + 1;
      code = value.charCodeAt(pos);

      // Comments
    } else if (code === slash && value.charCodeAt(pos + 1) === star) {
      token = {
        type: "comment",
        sourceIndex: pos
      };

      next = value.indexOf("*/", pos);
      if (next === -1) {
        token.unclosed = true;
        next = value.length;
      }

      token.value = value.slice(pos + 2, next);
      tokens.push(token);

      pos = next + 2;
      code = value.charCodeAt(pos);

      // Operation within calc
    } else if (
      (code === slash || code === star) &&
      parent &&
      parent.type === "function" &&
      parent.value === "calc"
    ) {
      token = value[pos];
      tokens.push({
        type: "word",
        sourceIndex: pos - before.length,
        value: token
      });
      pos += 1;
      code = value.charCodeAt(pos);

      // Dividers
    } else if (code === slash || code === comma || code === colon) {
      token = value[pos];

      tokens.push({
        type: "div",
        sourceIndex: pos - before.length,
        value: token,
        before: before,
        after: ""
      });
      before = "";

      pos += 1;
      code = value.charCodeAt(pos);

      // Open parentheses
    } else if (openParentheses === code) {
      // Whitespaces after open parentheses
      next = pos;
      do {
        next += 1;
        code = value.charCodeAt(next);
      } while (code <= 32);
      parenthesesOpenPos = pos;
      token = {
        type: "function",
        sourceIndex: pos - name.length,
        value: name,
        before: value.slice(parenthesesOpenPos + 1, next)
      };
      pos = next;

      if (name === "url" && code !== singleQuote && code !== doubleQuote) {
        next -= 1;
        do {
          escape = false;
          next = value.indexOf(")", next + 1);
          if (~next) {
            escapePos = next;
            while (value.charCodeAt(escapePos - 1) === backslash) {
              escapePos -= 1;
              escape = !escape;
            }
          } else {
            value += ")";
            next = value.length - 1;
            token.unclosed = true;
          }
        } while (escape);
        // Whitespaces before closed
        whitespacePos = next;
        do {
          whitespacePos -= 1;
          code = value.charCodeAt(whitespacePos);
        } while (code <= 32);
        if (parenthesesOpenPos < whitespacePos) {
          if (pos !== whitespacePos + 1) {
            token.nodes = [
              {
                type: "word",
                sourceIndex: pos,
                value: value.slice(pos, whitespacePos + 1)
              }
            ];
          } else {
            token.nodes = [];
          }
          if (token.unclosed && whitespacePos + 1 !== next) {
            token.after = "";
            token.nodes.push({
              type: "space",
              sourceIndex: whitespacePos + 1,
              value: value.slice(whitespacePos + 1, next)
            });
          } else {
            token.after = value.slice(whitespacePos + 1, next);
          }
        } else {
          token.after = "";
          token.nodes = [];
        }
        pos = next + 1;
        code = value.charCodeAt(pos);
        tokens.push(token);
      } else {
        balanced += 1;
        token.after = "";
        tokens.push(token);
        stack.push(token);
        tokens = token.nodes = [];
        parent = token;
      }
      name = "";

      // Close parentheses
    } else if (closeParentheses === code && balanced) {
      pos += 1;
      code = value.charCodeAt(pos);

      parent.after = after;
      after = "";
      balanced -= 1;
      stack.pop();
      parent = stack[balanced];
      tokens = parent.nodes;

      // Words
    } else {
      next = pos;
      do {
        if (code === backslash) {
          next += 1;
        }
        next += 1;
        code = value.charCodeAt(next);
      } while (
        next < max &&
        !(
          code <= 32 ||
          code === singleQuote ||
          code === doubleQuote ||
          code === comma ||
          code === colon ||
          code === slash ||
          code === openParentheses ||
          (code === star &&
            parent &&
            parent.type === "function" &&
            parent.value === "calc") ||
          (code === slash &&
            parent.type === "function" &&
            parent.value === "calc") ||
          (code === closeParentheses && balanced)
        )
      );
      token = value.slice(pos, next);

      if (openParentheses === code) {
        name = token;
      } else if (
        (uLower === token.charCodeAt(0) || uUpper === token.charCodeAt(0)) &&
        plus === token.charCodeAt(1) &&
        isUnicodeRange.test(token.slice(2))
      ) {
        tokens.push({
          type: "unicode-range",
          sourceIndex: pos,
          value: token
        });
      } else {
        tokens.push({
          type: "word",
          sourceIndex: pos,
          value: token
        });
      }

      pos = next;
    }
  }

  for (pos = stack.length - 1; pos; pos -= 1) {
    stack[pos].unclosed = true;
  }

  return stack[0].nodes;
};

var walk = function walk(nodes, cb, bubble) {
  var i, max, node, result;

  for (i = 0, max = nodes.length; i < max; i += 1) {
    node = nodes[i];
    if (!bubble) {
      result = cb(node, i, nodes);
    }

    if (
      result !== false &&
      node.type === "function" &&
      Array.isArray(node.nodes)
    ) {
      walk(node.nodes, cb, bubble);
    }

    if (bubble) {
      cb(node, i, nodes);
    }
  }
};

function stringifyNode(node, custom) {
  var type = node.type;
  var value = node.value;
  var buf;
  var customResult;

  if (custom && (customResult = custom(node)) !== undefined) {
    return customResult;
  } else if (type === "word" || type === "space") {
    return value;
  } else if (type === "string") {
    buf = node.quote || "";
    return buf + value + (node.unclosed ? "" : buf);
  } else if (type === "comment") {
    return "/*" + value + (node.unclosed ? "" : "*/");
  } else if (type === "div") {
    return (node.before || "") + value + (node.after || "");
  } else if (Array.isArray(node.nodes)) {
    buf = stringify(node.nodes, custom);
    if (type !== "function") {
      return buf;
    }
    return (
      value +
      "(" +
      (node.before || "") +
      buf +
      (node.after || "") +
      (node.unclosed ? "" : ")")
    );
  }
  return value;
}

function stringify(nodes, custom) {
  var result, i;

  if (Array.isArray(nodes)) {
    result = "";
    for (i = nodes.length - 1; ~i; i -= 1) {
      result = stringifyNode(nodes[i], custom) + result;
    }
    return result;
  }
  return stringifyNode(nodes, custom);
}

var stringify_1 = stringify;

var minus = "-".charCodeAt(0);
var plus$1 = "+".charCodeAt(0);
var dot = ".".charCodeAt(0);
var exp = "e".charCodeAt(0);
var EXP = "E".charCodeAt(0);

// Check if three code points would start a number
// https://www.w3.org/TR/css-syntax-3/#starts-with-a-number
function likeNumber(value) {
  var code = value.charCodeAt(0);
  var nextCode;

  if (code === plus$1 || code === minus) {
    nextCode = value.charCodeAt(1);

    if (nextCode >= 48 && nextCode <= 57) {
      return true;
    }

    var nextNextCode = value.charCodeAt(2);

    if (nextCode === dot && nextNextCode >= 48 && nextNextCode <= 57) {
      return true;
    }

    return false;
  }

  if (code === dot) {
    nextCode = value.charCodeAt(1);

    if (nextCode >= 48 && nextCode <= 57) {
      return true;
    }

    return false;
  }

  if (code >= 48 && code <= 57) {
    return true;
  }

  return false;
}

// Consume a number
// https://www.w3.org/TR/css-syntax-3/#consume-number
var unit = function(value) {
  var pos = 0;
  var length = value.length;
  var code;
  var nextCode;
  var nextNextCode;

  if (length === 0 || !likeNumber(value)) {
    return false;
  }

  code = value.charCodeAt(pos);

  if (code === plus$1 || code === minus) {
    pos++;
  }

  while (pos < length) {
    code = value.charCodeAt(pos);

    if (code < 48 || code > 57) {
      break;
    }

    pos += 1;
  }

  code = value.charCodeAt(pos);
  nextCode = value.charCodeAt(pos + 1);

  if (code === dot && nextCode >= 48 && nextCode <= 57) {
    pos += 2;

    while (pos < length) {
      code = value.charCodeAt(pos);

      if (code < 48 || code > 57) {
        break;
      }

      pos += 1;
    }
  }

  code = value.charCodeAt(pos);
  nextCode = value.charCodeAt(pos + 1);
  nextNextCode = value.charCodeAt(pos + 2);

  if (
    (code === exp || code === EXP) &&
    ((nextCode >= 48 && nextCode <= 57) ||
      ((nextCode === plus$1 || nextCode === minus) &&
        nextNextCode >= 48 &&
        nextNextCode <= 57))
  ) {
    pos += nextCode === plus$1 || nextCode === minus ? 3 : 2;

    while (pos < length) {
      code = value.charCodeAt(pos);

      if (code < 48 || code > 57) {
        break;
      }

      pos += 1;
    }
  }

  return {
    number: value.slice(0, pos),
    unit: value.slice(pos)
  };
};

function ValueParser(value) {
  if (this instanceof ValueParser) {
    this.nodes = parse(value);
    return this;
  }
  return new ValueParser(value);
}

ValueParser.prototype.toString = function() {
  return Array.isArray(this.nodes) ? stringify_1(this.nodes) : "";
};

ValueParser.prototype.walk = function(cb, bubble) {
  walk(this.nodes, cb, bubble);
  return this;
};

ValueParser.unit = unit;

ValueParser.walk = walk;

ValueParser.stringify = stringify_1;

var lib = ValueParser;

var camelize = function(obj) {
    if (typeof obj === 'string') return camelCase(obj);
    return walk$1(obj);
};

function walk$1 (obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (isDate(obj) || isRegex(obj)) return obj;
    if (isArray(obj)) return map(obj, walk$1);
    return reduce(objectKeys(obj), function (acc, key) {
        var camel = camelCase(key);
        acc[camel] = walk$1(obj[key]);
        return acc;
    }, {});
}

function camelCase(str) {
    return str.replace(/[_.-](\w|$)/g, function (_,x) {
        return x.toUpperCase();
    });
}

var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

var isDate = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
};

var isRegex = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var has = Object.prototype.hasOwnProperty;
var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

function map (xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        res.push(f(xs[i], i));
    }
    return res;
}

function reduce (xs, f, acc) {
    if (xs.reduce) return xs.reduce(f, acc);
    for (var i = 0; i < xs.length; i++) {
        acc = f(acc, xs[i], i);
    }
    return acc;
}

var black = "#000000";
var silver = "#c0c0c0";
var gray = "#808080";
var white = "#ffffff";
var maroon = "#800000";
var red = "#ff0000";
var purple = "#800080";
var fuchsia = "#ff00ff";
var green = "#008000";
var lime = "#00ff00";
var olive = "#808000";
var yellow = "#ffff00";
var navy = "#000080";
var blue = "#0000ff";
var teal = "#008080";
var aqua = "#00ffff";
var orange = "#ffa500";
var aliceblue = "#f0f8ff";
var antiquewhite = "#faebd7";
var aquamarine = "#7fffd4";
var azure = "#f0ffff";
var beige = "#f5f5dc";
var bisque = "#ffe4c4";
var blanchedalmond = "#ffebcd";
var blueviolet = "#8a2be2";
var brown = "#a52a2a";
var burlywood = "#deb887";
var cadetblue = "#5f9ea0";
var chartreuse = "#7fff00";
var chocolate = "#d2691e";
var coral = "#ff7f50";
var cornflowerblue = "#6495ed";
var cornsilk = "#fff8dc";
var crimson = "#dc143c";
var darkblue = "#00008b";
var darkcyan = "#008b8b";
var darkgoldenrod = "#b8860b";
var darkgray = "#a9a9a9";
var darkgreen = "#006400";
var darkgrey = "#a9a9a9";
var darkkhaki = "#bdb76b";
var darkmagenta = "#8b008b";
var darkolivegreen = "#556b2f";
var darkorange = "#ff8c00";
var darkorchid = "#9932cc";
var darkred = "#8b0000";
var darksalmon = "#e9967a";
var darkseagreen = "#8fbc8f";
var darkslateblue = "#483d8b";
var darkslategray = "#2f4f4f";
var darkslategrey = "#2f4f4f";
var darkturquoise = "#00ced1";
var darkviolet = "#9400d3";
var deeppink = "#ff1493";
var deepskyblue = "#00bfff";
var dimgray = "#696969";
var dimgrey = "#696969";
var dodgerblue = "#1e90ff";
var firebrick = "#b22222";
var floralwhite = "#fffaf0";
var forestgreen = "#228b22";
var gainsboro = "#dcdcdc";
var ghostwhite = "#f8f8ff";
var gold = "#ffd700";
var goldenrod = "#daa520";
var greenyellow = "#adff2f";
var grey = "#808080";
var honeydew = "#f0fff0";
var hotpink = "#ff69b4";
var indianred = "#cd5c5c";
var indigo = "#4b0082";
var ivory = "#fffff0";
var khaki = "#f0e68c";
var lavender = "#e6e6fa";
var lavenderblush = "#fff0f5";
var lawngreen = "#7cfc00";
var lemonchiffon = "#fffacd";
var lightblue = "#add8e6";
var lightcoral = "#f08080";
var lightcyan = "#e0ffff";
var lightgoldenrodyellow = "#fafad2";
var lightgray = "#d3d3d3";
var lightgreen = "#90ee90";
var lightgrey = "#d3d3d3";
var lightpink = "#ffb6c1";
var lightsalmon = "#ffa07a";
var lightseagreen = "#20b2aa";
var lightskyblue = "#87cefa";
var lightslategray = "#778899";
var lightslategrey = "#778899";
var lightsteelblue = "#b0c4de";
var lightyellow = "#ffffe0";
var limegreen = "#32cd32";
var linen = "#faf0e6";
var mediumaquamarine = "#66cdaa";
var mediumblue = "#0000cd";
var mediumorchid = "#ba55d3";
var mediumpurple = "#9370db";
var mediumseagreen = "#3cb371";
var mediumslateblue = "#7b68ee";
var mediumspringgreen = "#00fa9a";
var mediumturquoise = "#48d1cc";
var mediumvioletred = "#c71585";
var midnightblue = "#191970";
var mintcream = "#f5fffa";
var mistyrose = "#ffe4e1";
var moccasin = "#ffe4b5";
var navajowhite = "#ffdead";
var oldlace = "#fdf5e6";
var olivedrab = "#6b8e23";
var orangered = "#ff4500";
var orchid = "#da70d6";
var palegoldenrod = "#eee8aa";
var palegreen = "#98fb98";
var paleturquoise = "#afeeee";
var palevioletred = "#db7093";
var papayawhip = "#ffefd5";
var peachpuff = "#ffdab9";
var peru = "#cd853f";
var pink = "#ffc0cb";
var plum = "#dda0dd";
var powderblue = "#b0e0e6";
var rosybrown = "#bc8f8f";
var royalblue = "#4169e1";
var saddlebrown = "#8b4513";
var salmon = "#fa8072";
var sandybrown = "#f4a460";
var seagreen = "#2e8b57";
var seashell = "#fff5ee";
var sienna = "#a0522d";
var skyblue = "#87ceeb";
var slateblue = "#6a5acd";
var slategray = "#708090";
var slategrey = "#708090";
var snow = "#fffafa";
var springgreen = "#00ff7f";
var steelblue = "#4682b4";
var tan = "#d2b48c";
var thistle = "#d8bfd8";
var tomato = "#ff6347";
var turquoise = "#40e0d0";
var violet = "#ee82ee";
var wheat = "#f5deb3";
var whitesmoke = "#f5f5f5";
var yellowgreen = "#9acd32";
var rebeccapurple = "#663399";
var colors = {
	black: black,
	silver: silver,
	gray: gray,
	white: white,
	maroon: maroon,
	red: red,
	purple: purple,
	fuchsia: fuchsia,
	green: green,
	lime: lime,
	olive: olive,
	yellow: yellow,
	navy: navy,
	blue: blue,
	teal: teal,
	aqua: aqua,
	orange: orange,
	aliceblue: aliceblue,
	antiquewhite: antiquewhite,
	aquamarine: aquamarine,
	azure: azure,
	beige: beige,
	bisque: bisque,
	blanchedalmond: blanchedalmond,
	blueviolet: blueviolet,
	brown: brown,
	burlywood: burlywood,
	cadetblue: cadetblue,
	chartreuse: chartreuse,
	chocolate: chocolate,
	coral: coral,
	cornflowerblue: cornflowerblue,
	cornsilk: cornsilk,
	crimson: crimson,
	darkblue: darkblue,
	darkcyan: darkcyan,
	darkgoldenrod: darkgoldenrod,
	darkgray: darkgray,
	darkgreen: darkgreen,
	darkgrey: darkgrey,
	darkkhaki: darkkhaki,
	darkmagenta: darkmagenta,
	darkolivegreen: darkolivegreen,
	darkorange: darkorange,
	darkorchid: darkorchid,
	darkred: darkred,
	darksalmon: darksalmon,
	darkseagreen: darkseagreen,
	darkslateblue: darkslateblue,
	darkslategray: darkslategray,
	darkslategrey: darkslategrey,
	darkturquoise: darkturquoise,
	darkviolet: darkviolet,
	deeppink: deeppink,
	deepskyblue: deepskyblue,
	dimgray: dimgray,
	dimgrey: dimgrey,
	dodgerblue: dodgerblue,
	firebrick: firebrick,
	floralwhite: floralwhite,
	forestgreen: forestgreen,
	gainsboro: gainsboro,
	ghostwhite: ghostwhite,
	gold: gold,
	goldenrod: goldenrod,
	greenyellow: greenyellow,
	grey: grey,
	honeydew: honeydew,
	hotpink: hotpink,
	indianred: indianred,
	indigo: indigo,
	ivory: ivory,
	khaki: khaki,
	lavender: lavender,
	lavenderblush: lavenderblush,
	lawngreen: lawngreen,
	lemonchiffon: lemonchiffon,
	lightblue: lightblue,
	lightcoral: lightcoral,
	lightcyan: lightcyan,
	lightgoldenrodyellow: lightgoldenrodyellow,
	lightgray: lightgray,
	lightgreen: lightgreen,
	lightgrey: lightgrey,
	lightpink: lightpink,
	lightsalmon: lightsalmon,
	lightseagreen: lightseagreen,
	lightskyblue: lightskyblue,
	lightslategray: lightslategray,
	lightslategrey: lightslategrey,
	lightsteelblue: lightsteelblue,
	lightyellow: lightyellow,
	limegreen: limegreen,
	linen: linen,
	mediumaquamarine: mediumaquamarine,
	mediumblue: mediumblue,
	mediumorchid: mediumorchid,
	mediumpurple: mediumpurple,
	mediumseagreen: mediumseagreen,
	mediumslateblue: mediumslateblue,
	mediumspringgreen: mediumspringgreen,
	mediumturquoise: mediumturquoise,
	mediumvioletred: mediumvioletred,
	midnightblue: midnightblue,
	mintcream: mintcream,
	mistyrose: mistyrose,
	moccasin: moccasin,
	navajowhite: navajowhite,
	oldlace: oldlace,
	olivedrab: olivedrab,
	orangered: orangered,
	orchid: orchid,
	palegoldenrod: palegoldenrod,
	palegreen: palegreen,
	paleturquoise: paleturquoise,
	palevioletred: palevioletred,
	papayawhip: papayawhip,
	peachpuff: peachpuff,
	peru: peru,
	pink: pink,
	plum: plum,
	powderblue: powderblue,
	rosybrown: rosybrown,
	royalblue: royalblue,
	saddlebrown: saddlebrown,
	salmon: salmon,
	sandybrown: sandybrown,
	seagreen: seagreen,
	seashell: seashell,
	sienna: sienna,
	skyblue: skyblue,
	slateblue: slateblue,
	slategray: slategray,
	slategrey: slategrey,
	snow: snow,
	springgreen: springgreen,
	steelblue: steelblue,
	tan: tan,
	thistle: thistle,
	tomato: tomato,
	turquoise: turquoise,
	violet: violet,
	wheat: wheat,
	whitesmoke: whitesmoke,
	yellowgreen: yellowgreen,
	rebeccapurple: rebeccapurple
};

var colors$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	black: black,
	silver: silver,
	gray: gray,
	white: white,
	maroon: maroon,
	red: red,
	purple: purple,
	fuchsia: fuchsia,
	green: green,
	lime: lime,
	olive: olive,
	yellow: yellow,
	navy: navy,
	blue: blue,
	teal: teal,
	aqua: aqua,
	orange: orange,
	aliceblue: aliceblue,
	antiquewhite: antiquewhite,
	aquamarine: aquamarine,
	azure: azure,
	beige: beige,
	bisque: bisque,
	blanchedalmond: blanchedalmond,
	blueviolet: blueviolet,
	brown: brown,
	burlywood: burlywood,
	cadetblue: cadetblue,
	chartreuse: chartreuse,
	chocolate: chocolate,
	coral: coral,
	cornflowerblue: cornflowerblue,
	cornsilk: cornsilk,
	crimson: crimson,
	darkblue: darkblue,
	darkcyan: darkcyan,
	darkgoldenrod: darkgoldenrod,
	darkgray: darkgray,
	darkgreen: darkgreen,
	darkgrey: darkgrey,
	darkkhaki: darkkhaki,
	darkmagenta: darkmagenta,
	darkolivegreen: darkolivegreen,
	darkorange: darkorange,
	darkorchid: darkorchid,
	darkred: darkred,
	darksalmon: darksalmon,
	darkseagreen: darkseagreen,
	darkslateblue: darkslateblue,
	darkslategray: darkslategray,
	darkslategrey: darkslategrey,
	darkturquoise: darkturquoise,
	darkviolet: darkviolet,
	deeppink: deeppink,
	deepskyblue: deepskyblue,
	dimgray: dimgray,
	dimgrey: dimgrey,
	dodgerblue: dodgerblue,
	firebrick: firebrick,
	floralwhite: floralwhite,
	forestgreen: forestgreen,
	gainsboro: gainsboro,
	ghostwhite: ghostwhite,
	gold: gold,
	goldenrod: goldenrod,
	greenyellow: greenyellow,
	grey: grey,
	honeydew: honeydew,
	hotpink: hotpink,
	indianred: indianred,
	indigo: indigo,
	ivory: ivory,
	khaki: khaki,
	lavender: lavender,
	lavenderblush: lavenderblush,
	lawngreen: lawngreen,
	lemonchiffon: lemonchiffon,
	lightblue: lightblue,
	lightcoral: lightcoral,
	lightcyan: lightcyan,
	lightgoldenrodyellow: lightgoldenrodyellow,
	lightgray: lightgray,
	lightgreen: lightgreen,
	lightgrey: lightgrey,
	lightpink: lightpink,
	lightsalmon: lightsalmon,
	lightseagreen: lightseagreen,
	lightskyblue: lightskyblue,
	lightslategray: lightslategray,
	lightslategrey: lightslategrey,
	lightsteelblue: lightsteelblue,
	lightyellow: lightyellow,
	limegreen: limegreen,
	linen: linen,
	mediumaquamarine: mediumaquamarine,
	mediumblue: mediumblue,
	mediumorchid: mediumorchid,
	mediumpurple: mediumpurple,
	mediumseagreen: mediumseagreen,
	mediumslateblue: mediumslateblue,
	mediumspringgreen: mediumspringgreen,
	mediumturquoise: mediumturquoise,
	mediumvioletred: mediumvioletred,
	midnightblue: midnightblue,
	mintcream: mintcream,
	mistyrose: mistyrose,
	moccasin: moccasin,
	navajowhite: navajowhite,
	oldlace: oldlace,
	olivedrab: olivedrab,
	orangered: orangered,
	orchid: orchid,
	palegoldenrod: palegoldenrod,
	palegreen: palegreen,
	paleturquoise: paleturquoise,
	palevioletred: palevioletred,
	papayawhip: papayawhip,
	peachpuff: peachpuff,
	peru: peru,
	pink: pink,
	plum: plum,
	powderblue: powderblue,
	rosybrown: rosybrown,
	royalblue: royalblue,
	saddlebrown: saddlebrown,
	salmon: salmon,
	sandybrown: sandybrown,
	seagreen: seagreen,
	seashell: seashell,
	sienna: sienna,
	skyblue: skyblue,
	slateblue: slateblue,
	slategray: slategray,
	slategrey: slategrey,
	snow: snow,
	springgreen: springgreen,
	steelblue: steelblue,
	tan: tan,
	thistle: thistle,
	tomato: tomato,
	turquoise: turquoise,
	violet: violet,
	wheat: wheat,
	whitesmoke: whitesmoke,
	yellowgreen: yellowgreen,
	rebeccapurple: rebeccapurple,
	'default': colors
});

var require$$0 = getCjsExportFromNamespace(colors$1);

var cssColorKeywords = require$$0;

var cssToReactNative = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}



var parse__default = _interopDefault(lib);

var camelizeStyleName = _interopDefault(camelize);

var cssColorKeywords$1 = _interopDefault(cssColorKeywords);

var matchString = function matchString(node) {
  if (node.type !== 'string') return null;
  return node.value.replace(/\\([0-9a-f]{1,6})(?:\s|$)/gi, function (match, charCode) {
    return String.fromCharCode(parseInt(charCode, 16));
  }).replace(/\\/g, '');
};

var hexColorRe = /^(#(?:[0-9a-f]{3,4}){1,2})$/i;
var cssFunctionNameRe = /^(rgba?|hsla?|hwb|lab|lch|gray|color)$/;

var matchColor = function matchColor(node) {
  if (node.type === 'word' && (hexColorRe.test(node.value) || node.value in cssColorKeywords$1 || node.value === 'transparent')) {
    return node.value;
  } else if (node.type === 'function' && cssFunctionNameRe.test(node.value)) {
    return lib.stringify(node);
  }

  return null;
};

var noneRe = /^(none)$/i;
var autoRe = /^(auto)$/i;
var identRe = /(^-?[_a-z][_a-z0-9-]*$)/i; // Note if these are wrong, you'll need to change index.js too

var numberRe = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)$/i; // Note lengthRe is sneaky: you can omit units for 0

var lengthRe = /^(0$|(?:[+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)(?=px$))/i;
var unsupportedUnitRe = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?(ch|em|ex|rem|vh|vw|vmin|vmax|cm|mm|in|pc|pt))$/i;
var angleRe = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?(?:deg|rad))$/i;
var percentRe = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?%)$/i;

var noopToken = function noopToken(predicate) {
  return function (node) {
    return predicate(node) ? '<token>' : null;
  };
};

var valueForTypeToken = function valueForTypeToken(type) {
  return function (node) {
    return node.type === type ? node.value : null;
  };
};

var regExpToken = function regExpToken(regExp, transform) {
  if (transform === void 0) {
    transform = String;
  }

  return function (node) {
    if (node.type !== 'word') return null;
    var match = node.value.match(regExp);
    if (match === null) return null;
    var value = transform(match[1]);
    return value;
  };
};

var SPACE = noopToken(function (node) {
  return node.type === 'space';
});
var SLASH = noopToken(function (node) {
  return node.type === 'div' && node.value === '/';
});
var COMMA = noopToken(function (node) {
  return node.type === 'div' && node.value === ',';
});
var WORD = valueForTypeToken('word');
var NONE = regExpToken(noneRe);
var AUTO = regExpToken(autoRe);
var NUMBER = regExpToken(numberRe, Number);
var LENGTH = regExpToken(lengthRe, Number);
var UNSUPPORTED_LENGTH_UNIT = regExpToken(unsupportedUnitRe);
var ANGLE = regExpToken(angleRe, function (angle) {
  return angle.toLowerCase();
});
var PERCENT = regExpToken(percentRe);
var IDENT = regExpToken(identRe);
var STRING = matchString;
var COLOR = matchColor;
var LINE = regExpToken(/^(none|underline|line-through)$/i);
var BORDER_STYLE = regExpToken(/^(solid|dashed|dotted)$/);
var defaultBorderWidth = 1;
var defaultBorderColor = 'black';
var defaultBorderStyle = 'solid';

var border = function border(tokenStream) {
  var borderWidth;
  var borderColor;
  var borderStyle;

  if (tokenStream.matches(NONE)) {
    tokenStream.expectEmpty();
    return {
      borderWidth: 0,
      borderColor: 'black',
      borderStyle: 'solid'
    };
  }

  var partsParsed = 0;

  while (partsParsed < 3 && tokenStream.hasTokens()) {
    if (partsParsed !== 0) tokenStream.expect(SPACE);

    if (borderWidth === undefined && tokenStream.matches(LENGTH, UNSUPPORTED_LENGTH_UNIT)) {
      borderWidth = tokenStream.lastValue;
    } else if (borderColor === undefined && tokenStream.matches(COLOR)) {
      borderColor = tokenStream.lastValue;
    } else if (borderStyle === undefined && tokenStream.matches(BORDER_STYLE)) {
      borderStyle = tokenStream.lastValue;
    } else {
      tokenStream["throw"]();
    }

    partsParsed += 1;
  }

  tokenStream.expectEmpty();
  if (borderWidth === undefined) borderWidth = defaultBorderWidth;
  if (borderColor === undefined) borderColor = defaultBorderColor;
  if (borderStyle === undefined) borderStyle = defaultBorderStyle;
  return {
    borderWidth: borderWidth,
    borderColor: borderColor,
    borderStyle: borderStyle
  };
};

var directionFactory = function directionFactory(_ref) {
  var _ref$types = _ref.types,
      types = _ref$types === void 0 ? [LENGTH, UNSUPPORTED_LENGTH_UNIT, PERCENT] : _ref$types,
      _ref$directions = _ref.directions,
      directions = _ref$directions === void 0 ? ['Top', 'Right', 'Bottom', 'Left'] : _ref$directions,
      _ref$prefix = _ref.prefix,
      prefix = _ref$prefix === void 0 ? '' : _ref$prefix,
      _ref$suffix = _ref.suffix,
      suffix = _ref$suffix === void 0 ? '' : _ref$suffix;
  return function (tokenStream) {
    var _ref2;

    var values = []; // borderWidth doesn't currently allow a percent value, but may do in the future

    values.push(tokenStream.expect.apply(tokenStream, types));

    while (values.length < 4 && tokenStream.hasTokens()) {
      tokenStream.expect(SPACE);
      values.push(tokenStream.expect.apply(tokenStream, types));
    }

    tokenStream.expectEmpty();
    var top = values[0],
        _values$ = values[1],
        right = _values$ === void 0 ? top : _values$,
        _values$2 = values[2],
        bottom = _values$2 === void 0 ? top : _values$2,
        _values$3 = values[3],
        left = _values$3 === void 0 ? right : _values$3;

    var keyFor = function keyFor(n) {
      return "" + prefix + directions[n] + suffix;
    };

    return _ref2 = {}, _ref2[keyFor(0)] = top, _ref2[keyFor(1)] = right, _ref2[keyFor(2)] = bottom, _ref2[keyFor(3)] = left, _ref2;
  };
};

var parseShadowOffset = function parseShadowOffset(tokenStream) {
  var width = tokenStream.expect(LENGTH);
  var height = tokenStream.matches(SPACE) ? tokenStream.expect(LENGTH) : width;
  tokenStream.expectEmpty();
  return {
    width: width,
    height: height
  };
};

var parseShadow = function parseShadow(tokenStream) {
  var offsetX;
  var offsetY;
  var radius;
  var color;

  if (tokenStream.matches(NONE)) {
    tokenStream.expectEmpty();
    return {
      offset: {
        width: 0,
        height: 0
      },
      radius: 0,
      color: 'black'
    };
  }

  var didParseFirst = false;

  while (tokenStream.hasTokens()) {
    if (didParseFirst) tokenStream.expect(SPACE);

    if (offsetX === undefined && tokenStream.matches(LENGTH, UNSUPPORTED_LENGTH_UNIT)) {
      offsetX = tokenStream.lastValue;
      tokenStream.expect(SPACE);
      offsetY = tokenStream.expect(LENGTH, UNSUPPORTED_LENGTH_UNIT);
      tokenStream.saveRewindPoint();

      if (tokenStream.matches(SPACE) && tokenStream.matches(LENGTH, UNSUPPORTED_LENGTH_UNIT)) {
        radius = tokenStream.lastValue;
      } else {
        tokenStream.rewind();
      }
    } else if (color === undefined && tokenStream.matches(COLOR)) {
      color = tokenStream.lastValue;
    } else {
      tokenStream["throw"]();
    }

    didParseFirst = true;
  }

  if (offsetX === undefined) tokenStream["throw"]();
  return {
    offset: {
      width: offsetX,
      height: offsetY
    },
    radius: radius !== undefined ? radius : 0,
    color: color !== undefined ? color : 'black'
  };
};

var boxShadow = function boxShadow(tokenStream) {
  var _parseShadow = parseShadow(tokenStream),
      offset = _parseShadow.offset,
      radius = _parseShadow.radius,
      color = _parseShadow.color;

  return {
    shadowOffset: offset,
    shadowRadius: radius,
    shadowColor: color,
    shadowOpacity: 1
  };
};

var defaultFlexGrow = 1;
var defaultFlexShrink = 1;
var defaultFlexBasis = 0;

var flex = function flex(tokenStream) {
  var flexGrow;
  var flexShrink;
  var flexBasis;

  if (tokenStream.matches(NONE)) {
    tokenStream.expectEmpty();
    return {
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto'
    };
  }

  tokenStream.saveRewindPoint();

  if (tokenStream.matches(AUTO) && !tokenStream.hasTokens()) {
    return {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 'auto'
    };
  }

  tokenStream.rewind();
  var partsParsed = 0;

  while (partsParsed < 2 && tokenStream.hasTokens()) {
    if (partsParsed !== 0) tokenStream.expect(SPACE);

    if (flexGrow === undefined && tokenStream.matches(NUMBER)) {
      flexGrow = tokenStream.lastValue;
      tokenStream.saveRewindPoint();

      if (tokenStream.matches(SPACE) && tokenStream.matches(NUMBER)) {
        flexShrink = tokenStream.lastValue;
      } else {
        tokenStream.rewind();
      }
    } else if (flexBasis === undefined && tokenStream.matches(LENGTH, UNSUPPORTED_LENGTH_UNIT, PERCENT)) {
      flexBasis = tokenStream.lastValue;
    } else if (flexBasis === undefined && tokenStream.matches(AUTO)) {
      flexBasis = 'auto';
    } else {
      tokenStream["throw"]();
    }

    partsParsed += 1;
  }

  tokenStream.expectEmpty();
  if (flexGrow === undefined) flexGrow = defaultFlexGrow;
  if (flexShrink === undefined) flexShrink = defaultFlexShrink;
  if (flexBasis === undefined) flexBasis = defaultFlexBasis;
  return {
    flexGrow: flexGrow,
    flexShrink: flexShrink,
    flexBasis: flexBasis
  };
};

var FLEX_WRAP = regExpToken(/(nowrap|wrap|wrap-reverse)/);
var FLEX_DIRECTION = regExpToken(/(row|row-reverse|column|column-reverse)/);
var defaultFlexWrap = 'nowrap';
var defaultFlexDirection = 'row';

var flexFlow = function flexFlow(tokenStream) {
  var flexWrap;
  var flexDirection;
  var partsParsed = 0;

  while (partsParsed < 2 && tokenStream.hasTokens()) {
    if (partsParsed !== 0) tokenStream.expect(SPACE);

    if (flexWrap === undefined && tokenStream.matches(FLEX_WRAP)) {
      flexWrap = tokenStream.lastValue;
    } else if (flexDirection === undefined && tokenStream.matches(FLEX_DIRECTION)) {
      flexDirection = tokenStream.lastValue;
    } else {
      tokenStream["throw"]();
    }

    partsParsed += 1;
  }

  tokenStream.expectEmpty();
  if (flexWrap === undefined) flexWrap = defaultFlexWrap;
  if (flexDirection === undefined) flexDirection = defaultFlexDirection;
  return {
    flexWrap: flexWrap,
    flexDirection: flexDirection
  };
};

var fontFamily = function fontFamily(tokenStream) {
  var fontFamily;

  if (tokenStream.matches(STRING)) {
    fontFamily = tokenStream.lastValue;
  } else {
    fontFamily = tokenStream.expect(IDENT);

    while (tokenStream.hasTokens()) {
      tokenStream.expect(SPACE);
      var nextIdent = tokenStream.expect(IDENT);
      fontFamily += " " + nextIdent;
    }
  }

  tokenStream.expectEmpty();
  return {
    fontFamily: fontFamily
  };
};

var NORMAL = regExpToken(/^(normal)$/);
var STYLE = regExpToken(/^(italic)$/);
var WEIGHT = regExpToken(/^([1-9]00|bold)$/);
var VARIANT = regExpToken(/^(small-caps)$/);
var defaultFontStyle = 'normal';
var defaultFontWeight = 'normal';
var defaultFontVariant = [];

var font = function font(tokenStream) {
  var fontStyle;
  var fontWeight;
  var fontVariant; // let fontSize;

  var lineHeight; // let fontFamily;

  var numStyleWeightVariantMatched = 0;

  while (numStyleWeightVariantMatched < 3 && tokenStream.hasTokens()) {
    if (tokenStream.matches(NORMAL)) ;else if (fontStyle === undefined && tokenStream.matches(STYLE)) {
      fontStyle = tokenStream.lastValue;
    } else if (fontWeight === undefined && tokenStream.matches(WEIGHT)) {
      fontWeight = tokenStream.lastValue;
    } else if (fontVariant === undefined && tokenStream.matches(VARIANT)) {
      fontVariant = [tokenStream.lastValue];
    } else {
      break;
    }
    tokenStream.expect(SPACE);
    numStyleWeightVariantMatched += 1;
  }

  var fontSize = tokenStream.expect(LENGTH, UNSUPPORTED_LENGTH_UNIT);

  if (tokenStream.matches(SLASH)) {
    lineHeight = tokenStream.expect(LENGTH, UNSUPPORTED_LENGTH_UNIT);
  }

  tokenStream.expect(SPACE);

  var _fontFamily = fontFamily(tokenStream),
      fontFamily$1 = _fontFamily.fontFamily;

  if (fontStyle === undefined) fontStyle = defaultFontStyle;
  if (fontWeight === undefined) fontWeight = defaultFontWeight;
  if (fontVariant === undefined) fontVariant = defaultFontVariant;
  var out = {
    fontStyle: fontStyle,
    fontWeight: fontWeight,
    fontVariant: fontVariant,
    fontSize: fontSize,
    fontFamily: fontFamily$1
  };
  if (lineHeight !== undefined) out.lineHeight = lineHeight;
  return out;
};

var ALIGN_CONTENT = regExpToken(/(flex-(?:start|end)|center|stretch|space-(?:between|around))/);
var JUSTIFY_CONTENT = regExpToken(/(flex-(?:start|end)|center|space-(?:between|around|evenly))/);

var placeContent = function placeContent(tokenStream) {
  var alignContent = tokenStream.expect(ALIGN_CONTENT);
  var justifyContent;

  if (tokenStream.hasTokens()) {
    tokenStream.expect(SPACE);
    justifyContent = tokenStream.expect(JUSTIFY_CONTENT);
  } else {
    justifyContent = 'stretch';
  }

  tokenStream.expectEmpty();
  return {
    alignContent: alignContent,
    justifyContent: justifyContent
  };
};

var STYLE$1 = regExpToken(/^(solid|double|dotted|dashed)$/);
var defaultTextDecorationLine = 'none';
var defaultTextDecorationStyle = 'solid';
var defaultTextDecorationColor = 'black';

var textDecoration = function textDecoration(tokenStream) {
  var line;
  var style;
  var color;
  var didParseFirst = false;

  while (tokenStream.hasTokens()) {
    if (didParseFirst) tokenStream.expect(SPACE);

    if (line === undefined && tokenStream.matches(LINE)) {
      var lines = [tokenStream.lastValue.toLowerCase()];
      tokenStream.saveRewindPoint();

      if (lines[0] !== 'none' && tokenStream.matches(SPACE) && tokenStream.matches(LINE)) {
        lines.push(tokenStream.lastValue.toLowerCase()); // Underline comes before line-through

        lines.sort().reverse();
      } else {
        tokenStream.rewind();
      }

      line = lines.join(' ');
    } else if (style === undefined && tokenStream.matches(STYLE$1)) {
      style = tokenStream.lastValue;
    } else if (color === undefined && tokenStream.matches(COLOR)) {
      color = tokenStream.lastValue;
    } else {
      tokenStream["throw"]();
    }

    didParseFirst = true;
  }

  return {
    textDecorationLine: line !== undefined ? line : defaultTextDecorationLine,
    textDecorationColor: color !== undefined ? color : defaultTextDecorationColor,
    textDecorationStyle: style !== undefined ? style : defaultTextDecorationStyle
  };
};

var textDecorationLine = function textDecorationLine(tokenStream) {
  var lines = [];
  var didParseFirst = false;

  while (tokenStream.hasTokens()) {
    if (didParseFirst) tokenStream.expect(SPACE);
    lines.push(tokenStream.expect(LINE).toLowerCase());
    didParseFirst = true;
  }

  lines.sort().reverse();
  return {
    textDecorationLine: lines.join(' ')
  };
};

var textShadow = function textShadow(tokenStream) {
  var _parseShadow2 = parseShadow(tokenStream),
      offset = _parseShadow2.offset,
      radius = _parseShadow2.radius,
      color = _parseShadow2.color;

  return {
    textShadowOffset: offset,
    textShadowRadius: radius,
    textShadowColor: color
  };
};

var oneOfType = function oneOfType(tokenType) {
  return function (functionStream) {
    var value = functionStream.expect(tokenType);
    functionStream.expectEmpty();
    return value;
  };
};

var singleNumber = oneOfType(NUMBER);
var singleLength = oneOfType(LENGTH);
var singleAngle = oneOfType(ANGLE);

var xyTransformFactory = function xyTransformFactory(tokenType) {
  return function (key, valueIfOmitted) {
    return function (functionStream) {
      var _ref3, _ref4;

      var x = functionStream.expect(tokenType);
      var y;

      if (functionStream.hasTokens()) {
        functionStream.expect(COMMA);
        y = functionStream.expect(tokenType);
      } else if (valueIfOmitted !== undefined) {
        y = valueIfOmitted;
      } else {
        // Assumption, if x === y, then we can omit XY
        // I.e. scale(5) => [{ scale: 5 }] rather than [{ scaleX: 5 }, { scaleY: 5 }]
        return x;
      }

      functionStream.expectEmpty();
      return [(_ref3 = {}, _ref3[key + "Y"] = y, _ref3), (_ref4 = {}, _ref4[key + "X"] = x, _ref4)];
    };
  };
};

var xyNumber = xyTransformFactory(NUMBER);
var xyLength = xyTransformFactory(LENGTH);
var xyAngle = xyTransformFactory(ANGLE);
var partTransforms = {
  perspective: singleNumber,
  scale: xyNumber('scale'),
  scaleX: singleNumber,
  scaleY: singleNumber,
  translate: xyLength('translate', 0),
  translateX: singleLength,
  translateY: singleLength,
  rotate: singleAngle,
  rotateX: singleAngle,
  rotateY: singleAngle,
  rotateZ: singleAngle,
  skewX: singleAngle,
  skewY: singleAngle,
  skew: xyAngle('skew', '0deg')
};

var transform = function transform(tokenStream) {
  var transforms = [];
  var didParseFirst = false;

  while (tokenStream.hasTokens()) {
    if (didParseFirst) tokenStream.expect(SPACE);
    var functionStream = tokenStream.expectFunction();
    var functionName = functionStream.functionName;
    var transformedValues = partTransforms[functionName](functionStream);

    if (!Array.isArray(transformedValues)) {
      var _ref5;

      transformedValues = [(_ref5 = {}, _ref5[functionName] = transformedValues, _ref5)];
    }

    transforms = transformedValues.concat(transforms);
    didParseFirst = true;
  }

  return {
    transform: transforms
  };
};

var background = function background(tokenStream) {
  return {
    backgroundColor: tokenStream.expect(COLOR)
  };
};

var borderColor = directionFactory({
  types: [COLOR],
  prefix: 'border',
  suffix: 'Color'
});
var borderRadius = directionFactory({
  directions: ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'],
  prefix: 'border',
  suffix: 'Radius'
});
var borderWidth = directionFactory({
  prefix: 'border',
  suffix: 'Width'
});
var margin = directionFactory({
  types: [LENGTH, UNSUPPORTED_LENGTH_UNIT, PERCENT, AUTO],
  prefix: 'margin'
});
var padding = directionFactory({
  prefix: 'padding'
});

var fontVariant = function fontVariant(tokenStream) {
  return {
    fontVariant: [tokenStream.expect(IDENT)]
  };
};

var fontWeight = function fontWeight(tokenStream) {
  return {
    fontWeight: tokenStream.expect(WORD) // Also match numbers as strings

  };
};

var shadowOffset = function shadowOffset(tokenStream) {
  return {
    shadowOffset: parseShadowOffset(tokenStream)
  };
};

var textShadowOffset = function textShadowOffset(tokenStream) {
  return {
    textShadowOffset: parseShadowOffset(tokenStream)
  };
};

var transforms = {
  background: background,
  border: border,
  borderColor: borderColor,
  borderRadius: borderRadius,
  borderWidth: borderWidth,
  boxShadow: boxShadow,
  flex: flex,
  flexFlow: flexFlow,
  font: font,
  fontFamily: fontFamily,
  fontVariant: fontVariant,
  fontWeight: fontWeight,
  margin: margin,
  padding: padding,
  placeContent: placeContent,
  shadowOffset: shadowOffset,
  textShadow: textShadow,
  textShadowOffset: textShadowOffset,
  textDecoration: textDecoration,
  textDecorationLine: textDecorationLine,
  transform: transform
};
var propertiesWithoutUnits;

if (process.env.NODE_ENV !== 'production') {
  propertiesWithoutUnits = ['aspectRatio', 'elevation', 'flexGrow', 'flexShrink', 'opacity', 'shadowOpacity', 'zIndex'];
}

var devPropertiesWithUnitsRegExp = propertiesWithoutUnits != null ? new RegExp(propertiesWithoutUnits.join('|')) : null;
var SYMBOL_MATCH = 'SYMBOL_MATCH';

var TokenStream =
/*#__PURE__*/
function () {
  function TokenStream(nodes, parent) {
    this.index = 0;
    this.nodes = nodes;
    this.functionName = parent != null ? parent.value : null;
    this.lastValue = null;
    this.rewindIndex = -1;
  }

  var _proto = TokenStream.prototype;

  _proto.hasTokens = function hasTokens() {
    return this.index <= this.nodes.length - 1;
  };

  _proto[SYMBOL_MATCH] = function () {
    if (!this.hasTokens()) return null;
    var node = this.nodes[this.index];

    for (var i = 0; i < arguments.length; i += 1) {
      var tokenDescriptor = i < 0 || arguments.length <= i ? undefined : arguments[i];
      var value = tokenDescriptor(node);

      if (value !== null) {
        this.index += 1;
        this.lastValue = value;
        return value;
      }
    }

    return null;
  };

  _proto.matches = function matches() {
    return this[SYMBOL_MATCH].apply(this, arguments) !== null;
  };

  _proto.expect = function expect() {
    var value = this[SYMBOL_MATCH].apply(this, arguments);
    return value !== null ? value : this["throw"]();
  };

  _proto.matchesFunction = function matchesFunction() {
    var node = this.nodes[this.index];
    if (node.type !== 'function') return null;
    var value = new TokenStream(node.nodes, node);
    this.index += 1;
    this.lastValue = null;
    return value;
  };

  _proto.expectFunction = function expectFunction() {
    var value = this.matchesFunction();
    return value !== null ? value : this["throw"]();
  };

  _proto.expectEmpty = function expectEmpty() {
    if (this.hasTokens()) this["throw"]();
  };

  _proto["throw"] = function _throw() {
    throw new Error("Unexpected token type: " + this.nodes[this.index].type);
  };

  _proto.saveRewindPoint = function saveRewindPoint() {
    this.rewindIndex = this.index;
  };

  _proto.rewind = function rewind() {
    if (this.rewindIndex === -1) throw new Error('Internal error');
    this.index = this.rewindIndex;
    this.lastValue = null;
  };

  return TokenStream;
}();
/* eslint-disable no-param-reassign */
// Note if this is wrong, you'll need to change tokenTypes.js too


var numberOrLengthRe = /^([+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?)(?:px)?$/i;
var numberOnlyRe = /^[+-]?(?:\d*\.\d*|[1-9]\d*)(?:e[+-]?\d+)?$/i;
var boolRe = /^true|false$/i;
var nullRe = /^null$/i;
var undefinedRe = /^undefined$/i; // Undocumented export

var transformRawValue = function transformRawValue(propName, value) {
  if (process.env.NODE_ENV !== 'production') {
    var needsUnit = !devPropertiesWithUnitsRegExp.test(propName);
    var isNumberWithoutUnit = numberOnlyRe.test(value);

    if (needsUnit && isNumberWithoutUnit) {
      // eslint-disable-next-line no-console
      console.warn("Expected style \"" + propName + ": " + value + "\" to contain units");
    }

    if (!needsUnit && value !== '0' && !isNumberWithoutUnit) {
      // eslint-disable-next-line no-console
      console.warn("Expected style \"" + propName + ": " + value + "\" to be unitless");
    }
  }

  var numberMatch = value.match(numberOrLengthRe);
  if (numberMatch !== null) return Number(numberMatch[1]);
  var boolMatch = value.match(boolRe);
  if (boolMatch !== null) return boolMatch[0].toLowerCase() === 'true';
  var nullMatch = value.match(nullRe);
  if (nullMatch !== null) return null;
  var undefinedMatch = value.match(undefinedRe);
  if (undefinedMatch !== null) return undefined;
  return value;
};

var baseTransformShorthandValue = function baseTransformShorthandValue(propName, value) {
  var ast = parse__default(value);
  var tokenStream = new TokenStream(ast.nodes);
  return transforms[propName](tokenStream);
};

var transformShorthandValue = process.env.NODE_ENV === 'production' ? baseTransformShorthandValue : function (propName, value) {
  try {
    return baseTransformShorthandValue(propName, value);
  } catch (e) {
    throw new Error("Failed to parse declaration \"" + propName + ": " + value + "\"");
  }
};

var getStylesForProperty = function getStylesForProperty(propName, inputValue, allowShorthand) {
  var _ref6;

  var isRawValue = allowShorthand === false || !(propName in transforms);
  var value = inputValue.trim();
  var propValues = isRawValue ? (_ref6 = {}, _ref6[propName] = transformRawValue(propName, value), _ref6) : transformShorthandValue(propName, value);
  return propValues;
};

var getPropertyName = function getPropertyName(propName) {
  var isCustomProp = /^--\w+/.test(propName);

  if (isCustomProp) {
    return propName;
  }

  return camelizeStyleName(propName);
};

var index = function index(rules, shorthandBlacklist) {
  if (shorthandBlacklist === void 0) {
    shorthandBlacklist = [];
  }

  return rules.reduce(function (accum, rule) {
    var propertyName = getPropertyName(rule[0]);
    var value = rule[1];
    var allowShorthand = shorthandBlacklist.indexOf(propertyName) === -1;
    return Object.assign(accum, getStylesForProperty(propertyName, value, allowShorthand));
  }, {});
};

exports["default"] = index;
exports.getPropertyName = getPropertyName;
exports.getStylesForProperty = getStylesForProperty;
exports.transformRawValue = transformRawValue;
});
