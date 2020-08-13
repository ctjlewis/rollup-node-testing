import fs from 'fs';
import path from 'path';

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

var ini = createCommonjsModule(function (module, exports) {
exports.parse = exports.decode = decode;

exports.stringify = exports.encode = encode;

exports.safe = safe;
exports.unsafe = unsafe;

var eol = typeof process !== 'undefined' &&
  process.platform === 'win32' ? '\r\n' : '\n';

function encode (obj, opt) {
  var children = [];
  var out = '';

  if (typeof opt === 'string') {
    opt = {
      section: opt,
      whitespace: false
    };
  } else {
    opt = opt || {};
    opt.whitespace = opt.whitespace === true;
  }

  var separator = opt.whitespace ? ' = ' : '=';

  Object.keys(obj).forEach(function (k, _, __) {
    var val = obj[k];
    if (val && Array.isArray(val)) {
      val.forEach(function (item) {
        out += safe(k + '[]') + separator + safe(item) + '\n';
      });
    } else if (val && typeof val === 'object') {
      children.push(k);
    } else {
      out += safe(k) + separator + safe(val) + eol;
    }
  });

  if (opt.section && out.length) {
    out = '[' + safe(opt.section) + ']' + eol + out;
  }

  children.forEach(function (k, _, __) {
    var nk = dotSplit(k).join('\\.');
    var section = (opt.section ? opt.section + '.' : '') + nk;
    var child = encode(obj[k], {
      section: section,
      whitespace: opt.whitespace
    });
    if (out.length && child.length) {
      out += eol;
    }
    out += child;
  });

  return out
}

function dotSplit (str) {
  return str.replace(/\1/g, '\u0002LITERAL\\1LITERAL\u0002')
    .replace(/\\\./g, '\u0001')
    .split(/\./).map(function (part) {
      return part.replace(/\1/g, '\\.')
      .replace(/\2LITERAL\\1LITERAL\2/g, '\u0001')
    })
}

function decode (str) {
  var out = {};
  var p = out;
  var section = null;
  //          section     |key      = value
  var re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i;
  var lines = str.split(/[\r\n]+/g);

  lines.forEach(function (line, _, __) {
    if (!line || line.match(/^\s*[;#]/)) return
    var match = line.match(re);
    if (!match) return
    if (match[1] !== undefined) {
      section = unsafe(match[1]);
      p = out[section] = out[section] || {};
      return
    }
    var key = unsafe(match[2]);
    var value = match[3] ? unsafe(match[4]) : true;
    switch (value) {
      case 'true':
      case 'false':
      case 'null': value = JSON.parse(value);
    }

    // Convert keys with '[]' suffix to an array
    if (key.length > 2 && key.slice(-2) === '[]') {
      key = key.substring(0, key.length - 2);
      if (!p[key]) {
        p[key] = [];
      } else if (!Array.isArray(p[key])) {
        p[key] = [p[key]];
      }
    }

    // safeguard against resetting a previously defined
    // array by accidentally forgetting the brackets
    if (Array.isArray(p[key])) {
      p[key].push(value);
    } else {
      p[key] = value;
    }
  });

  // {a:{y:1},"a.b":{x:2}} --> {a:{y:1,b:{x:2}}}
  // use a filter to return the keys that have to be deleted.
  Object.keys(out).filter(function (k, _, __) {
    if (!out[k] ||
      typeof out[k] !== 'object' ||
      Array.isArray(out[k])) {
      return false
    }
    // see if the parent section is also an object.
    // if so, add it to that, and mark this one for deletion
    var parts = dotSplit(k);
    var p = out;
    var l = parts.pop();
    var nl = l.replace(/\\\./g, '.');
    parts.forEach(function (part, _, __) {
      if (!p[part] || typeof p[part] !== 'object') p[part] = {};
      p = p[part];
    });
    if (p === out && nl === l) {
      return false
    }
    p[nl] = out[k];
    return true
  }).forEach(function (del, _, __) {
    delete out[del];
  });

  return out
}

function isQuoted (val) {
  return (val.charAt(0) === '"' && val.slice(-1) === '"') ||
    (val.charAt(0) === "'" && val.slice(-1) === "'")
}

function safe (val) {
  return (typeof val !== 'string' ||
    val.match(/[=\r\n]/) ||
    val.match(/^\[/) ||
    (val.length > 1 &&
     isQuoted(val)) ||
    val !== val.trim())
      ? JSON.stringify(val)
      : val.replace(/;/g, '\\;').replace(/#/g, '\\#')
}

function unsafe (val, doUnesc) {
  val = (val || '').trim();
  if (isQuoted(val)) {
    // remove the single quotes before calling JSON.parse
    if (val.charAt(0) === "'") {
      val = val.substr(1, val.length - 2);
    }
    try { val = JSON.parse(val); } catch (_) {}
  } else {
    // walk the val to find the first not-escaped ; character
    var esc = false;
    var unesc = '';
    for (var i = 0, l = val.length; i < l; i++) {
      var c = val.charAt(i);
      if (esc) {
        if ('\\;#'.indexOf(c) !== -1) {
          unesc += c;
        } else {
          unesc += '\\' + c;
        }
        esc = false;
      } else if (';#'.indexOf(c) !== -1) {
        break
      } else if (c === '\\') {
        esc = true;
      } else {
        unesc += c;
      }
    }
    if (esc) {
      unesc += '\\';
    }
    return unesc.trim()
  }
  return val
}
});

var singleComment = 1;
var multiComment = 2;

function stripWithoutWhitespace() {
	return '';
}

function stripWithWhitespace(str, start, end) {
	return str.slice(start, end).replace(/\S/g, ' ');
}

var stripJsonComments = function (str, opts) {
	opts = opts || {};

	var currentChar;
	var nextChar;
	var insideString = false;
	var insideComment = false;
	var offset = 0;
	var ret = '';
	var strip = opts.whitespace === false ? stripWithoutWhitespace : stripWithWhitespace;

	for (var i = 0; i < str.length; i++) {
		currentChar = str[i];
		nextChar = str[i + 1];

		if (!insideComment && currentChar === '"') {
			var escaped = str[i - 1] === '\\' && str[i - 2] !== '\\';
			if (!escaped) {
				insideString = !insideString;
			}
		}

		if (insideString) {
			continue;
		}

		if (!insideComment && currentChar + nextChar === '//') {
			ret += str.slice(offset, i);
			offset = i;
			insideComment = singleComment;
			i++;
		} else if (insideComment === singleComment && currentChar + nextChar === '\r\n') {
			i++;
			insideComment = false;
			ret += strip(str, offset, i);
			offset = i;
			continue;
		} else if (insideComment === singleComment && currentChar === '\n') {
			insideComment = false;
			ret += strip(str, offset, i);
			offset = i;
		} else if (!insideComment && currentChar + nextChar === '/*') {
			ret += str.slice(offset, i);
			offset = i;
			insideComment = multiComment;
			i++;
			continue;
		} else if (insideComment === multiComment && currentChar + nextChar === '*/') {
			i++;
			insideComment = false;
			ret += strip(str, offset, i + 1);
			offset = i + 1;
			continue;
		}
	}

	return ret + (insideComment ? strip(str.substr(offset)) : str.substr(offset));
};

var utils = createCommonjsModule(function (module, exports) {





var parse = exports.parse = function (content) {

  //if it ends in .json or starts with { then it must be json.
  //must be done this way, because ini accepts everything.
  //can't just try and parse it and let it throw if it's not ini.
  //everything is ini. even json with a syntax error.

  if(/^\s*{/.test(content))
    return JSON.parse(stripJsonComments(content))
  return ini.parse(content)

};

var file = exports.file = function () {
  var args = [].slice.call(arguments).filter(function (arg) { return arg != null });

  //path.join breaks if it's a not a string, so just skip this.
  for(var i in args)
    if('string' !== typeof args[i])
      return

  var file = path.join.apply(null, args);
  try {
    return fs.readFileSync(file,'utf-8')
  } catch (err) {
    return
  }
};

var json = exports.json = function () {
  var content = file.apply(null, arguments);
  return content ? parse(content) : null
};

var env = exports.env = function (prefix, env) {
  env = env || process.env;
  var obj = {};
  var l = prefix.length;
  for(var k in env) {
    if(k.toLowerCase().indexOf(prefix.toLowerCase()) === 0) {

      var keypath = k.substring(l).split('__');

      // Trim empty strings from keypath array
      var _emptyStringIndex;
      while ((_emptyStringIndex=keypath.indexOf('')) > -1) {
        keypath.splice(_emptyStringIndex, 1);
      }

      var cursor = obj;
      keypath.forEach(function _buildSubObj(_subkey,i){

        // (check for _subkey first so we ignore empty strings)
        // (check for cursor to avoid assignment to primitive objects)
        if (!_subkey || typeof cursor !== 'object')
          return

        // If this is the last key, just stuff the value in there
        // Assigns actual value from env variable to final key
        // (unless it's just an empty string- in that case use the last valid key)
        if (i === keypath.length-1)
          cursor[_subkey] = env[k];


        // Build sub-object if nothing already exists at the keypath
        if (cursor[_subkey] === undefined)
          cursor[_subkey] = {};

        // Increment cursor used to track the object at the current depth
        cursor = cursor[_subkey];

      });

    }

  }

  return obj
};

var find = exports.find = function () {
  var rel = path.join.apply(null, [].slice.call(arguments));

  function find(start, rel) {
    var file = path.join(start, rel);
    try {
      fs.statSync(file);
      return file
    } catch (err) {
      if(path.dirname(start) !== start) // root
        return find(path.dirname(start), rel)
    }
  }
  return find(process.cwd(), rel)
};
});

var deepExtend_1 = createCommonjsModule(function (module) {

function isSpecificValue(val) {
	return (
		val instanceof Buffer
		|| val instanceof Date
		|| val instanceof RegExp
	) ? true : false;
}

function cloneSpecificValue(val) {
	if (val instanceof Buffer) {
		var x = Buffer.alloc
			? Buffer.alloc(val.length)
			: new Buffer(val.length);
		val.copy(x);
		return x;
	} else if (val instanceof Date) {
		return new Date(val.getTime());
	} else if (val instanceof RegExp) {
		return new RegExp(val);
	} else {
		throw new Error('Unexpected situation');
	}
}

/**
 * Recursive cloning array.
 */
function deepCloneArray(arr) {
	var clone = [];
	arr.forEach(function (item, index) {
		if (typeof item === 'object' && item !== null) {
			if (Array.isArray(item)) {
				clone[index] = deepCloneArray(item);
			} else if (isSpecificValue(item)) {
				clone[index] = cloneSpecificValue(item);
			} else {
				clone[index] = deepExtend({}, item);
			}
		} else {
			clone[index] = item;
		}
	});
	return clone;
}

function safeGetProperty(object, property) {
	return property === '__proto__' ? undefined : object[property];
}

/**
 * Extening object that entered in first argument.
 *
 * Returns extended object or false if have no target object or incorrect type.
 *
 * If you wish to clone source object (without modify it), just use empty new
 * object as first argument, like this:
 *   deepExtend({}, yourObj_1, [yourObj_N]);
 */
var deepExtend = module.exports = function (/*obj_1, [obj_2], [obj_N]*/) {
	if (arguments.length < 1 || typeof arguments[0] !== 'object') {
		return false;
	}

	if (arguments.length < 2) {
		return arguments[0];
	}

	var target = arguments[0];

	// convert arguments to array and cut off target object
	var args = Array.prototype.slice.call(arguments, 1);

	var val, src;

	args.forEach(function (obj) {
		// skip argument if isn't an object, is null, or is an array
		if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
			return;
		}

		Object.keys(obj).forEach(function (key) {
			src = safeGetProperty(target, key); // source value
			val = safeGetProperty(obj, key); // new value

			// recursion prevention
			if (val === target) {
				return;

			/**
			 * if new value isn't object then just overwrite by new value
			 * instead of extending.
			 */
			} else if (typeof val !== 'object' || val === null) {
				target[key] = val;
				return;

			// just clone arrays (and recursive clone objects inside)
			} else if (Array.isArray(val)) {
				target[key] = deepCloneArray(val);
				return;

			// custom cloning and overwrite for specific objects
			} else if (isSpecificValue(val)) {
				target[key] = cloneSpecificValue(val);
				return;

			// overwrite by new value if source isn't object or array
			} else if (typeof src !== 'object' || src === null || Array.isArray(src)) {
				target[key] = deepExtend({}, val);
				return;

			// source value and new value is objects both, extending...
			} else {
				target[key] = deepExtend(src, val);
				return;
			}
		});
	});

	return target;
};
});

var join = path.join;
var win = process.platform === "win32";
var home = win
           ? process.env.USERPROFILE
           : process.env.HOME;
