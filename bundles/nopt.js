import url from 'url';
import path from 'path';
import stream from 'stream';

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

var abbrev_1 = createCommonjsModule(function (module, exports) {
module.exports = exports = abbrev.abbrev = abbrev;

abbrev.monkeyPatch = monkeyPatch;

function monkeyPatch () {
  Object.defineProperty(Array.prototype, 'abbrev', {
    value: function () { return abbrev(this) },
    enumerable: false, configurable: true, writable: true
  });

  Object.defineProperty(Object.prototype, 'abbrev', {
    value: function () { return abbrev(Object.keys(this)) },
    enumerable: false, configurable: true, writable: true
  });
}

function abbrev (list) {
  if (arguments.length !== 1 || !Array.isArray(list)) {
    list = Array.prototype.slice.call(arguments, 0);
  }
  for (var i = 0, l = list.length, args = [] ; i < l ; i ++) {
    args[i] = typeof list[i] === "string" ? list[i] : String(list[i]);
  }

  // sort them lexicographically, so that they're next to their nearest kin
  args = args.sort(lexSort);

  // walk through each, seeing how much it has in common with the next and previous
  var abbrevs = {}
    , prev = "";
  for (var i = 0, l = args.length ; i < l ; i ++) {
    var current = args[i]
      , next = args[i + 1] || ""
      , nextMatches = true
      , prevMatches = true;
    if (current === next) continue
    for (var j = 0, cl = current.length ; j < cl ; j ++) {
      var curChar = current.charAt(j);
      nextMatches = nextMatches && curChar === next.charAt(j);
      prevMatches = prevMatches && curChar === prev.charAt(j);
      if (!nextMatches && !prevMatches) {
        j ++;
        break
      }
    }
    prev = current;
    if (j === cl) {
      abbrevs[current] = current;
      continue
    }
    for (var a = current.substr(0, j) ; j <= cl ; j ++) {
      abbrevs[a] = current;
      a += current.charAt(j);
    }
  }
  return abbrevs
}

function lexSort (a, b) {
  return a === b ? 0 : a > b ? 1 : -1
}
});

var nopt_1 = createCommonjsModule(function (module, exports) {
// info about each config option.

var debug = process.env.DEBUG_NOPT || process.env.NOPT_DEBUG
  ? function () { console.error.apply(console, arguments); }
  : function () {};

var Stream = stream.Stream;

module.exports = exports = nopt;
exports.clean = clean;

exports.typeDefs =
  { String  : { type: String,  validate: validateString  }
  , Boolean : { type: Boolean, validate: validateBoolean }
  , url     : { type: url,     validate: validateUrl     }
  , Number  : { type: Number,  validate: validateNumber  }
  , path    : { type: path,    validate: validatePath    }
  , Stream  : { type: Stream,  validate: validateStream  }
  , Date    : { type: Date,    validate: validateDate    }
  };

function nopt (types, shorthands, args, slice) {
  args = args || process.argv;
  types = types || {};
  shorthands = shorthands || {};
  if (typeof slice !== "number") slice = 2;

  debug(types, shorthands, args, slice);

  args = args.slice(slice);
  var data = {}
    , remain = []
    , cooked = args
    , original = args.slice(0);

  parse(args, data, remain, types, shorthands);
  // now data is full
  clean(data, types, exports.typeDefs);
  data.argv = {remain:remain,cooked:cooked,original:original};
  Object.defineProperty(data.argv, 'toString', { value: function () {
    return this.original.map(JSON.stringify).join(" ")
  }, enumerable: false });
  return data
}

function clean (data, types, typeDefs) {
  typeDefs = typeDefs || exports.typeDefs;
  var remove = {}
    , typeDefault = [false, true, null, String, Array];

  Object.keys(data).forEach(function (k) {
    if (k === "argv") return
    var val = data[k]
      , isArray = Array.isArray(val)
      , type = types[k];
    if (!isArray) val = [val];
    if (!type) type = typeDefault;
    if (type === Array) type = typeDefault.concat(Array);
    if (!Array.isArray(type)) type = [type];

    debug("val=%j", val);
    debug("types=", type);
    val = val.map(function (val) {
      // if it's an unknown value, then parse false/true/null/numbers/dates
      if (typeof val === "string") {
        debug("string %j", val);
        val = val.trim();
        if ((val === "null" && ~type.indexOf(null))
            || (val === "true" &&
               (~type.indexOf(true) || ~type.indexOf(Boolean)))
            || (val === "false" &&
               (~type.indexOf(false) || ~type.indexOf(Boolean)))) {
          val = JSON.parse(val);
          debug("jsonable %j", val);
        } else if (~type.indexOf(Number) && !isNaN(val)) {
          debug("convert to number", val);
          val = +val;
        } else if (~type.indexOf(Date) && !isNaN(Date.parse(val))) {
          debug("convert to date", val);
          val = new Date(val);
        }
      }

      if (!types.hasOwnProperty(k)) {
        return val
      }

      // allow `--no-blah` to set 'blah' to null if null is allowed
      if (val === false && ~type.indexOf(null) &&
          !(~type.indexOf(false) || ~type.indexOf(Boolean))) {
        val = null;
      }

      var d = {};
      d[k] = val;
      debug("prevalidated val", d, val, types[k]);
      if (!validate(d, k, val, types[k], typeDefs)) {
        if (exports.invalidHandler) {
          exports.invalidHandler(k, val, types[k], data);
        } else if (exports.invalidHandler !== false) {
          debug("invalid: "+k+"="+val, types[k]);
        }
        return remove
      }
      debug("validated val", d, val, types[k]);
      return d[k]
    }).filter(function (val) { return val !== remove });

    if (!val.length) delete data[k];
    else if (isArray) {
      debug(isArray, data[k], val);
      data[k] = val;
    } else data[k] = val[0];

    debug("k=%s val=%j", k, val, data[k]);
  });
}

function validateString (data, k, val) {
  data[k] = String(val);
}

function validatePath (data, k, val) {
  if (val === true) return false
  if (val === null) return true

  val = String(val);
  var homePattern = process.platform === 'win32' ? /^~(\/|\\)/ : /^~\//;
  if (val.match(homePattern) && process.env.HOME) {
    val = path.resolve(process.env.HOME, val.substr(2));
  }
  data[k] = path.resolve(String(val));
  return true
}

function validateNumber (data, k, val) {
  debug("validate Number %j %j %j", k, val, isNaN(val));
  if (isNaN(val)) return false
  data[k] = +val;
}

function validateDate (data, k, val) {
  debug("validate Date %j %j %j", k, val, Date.parse(val));
  var s = Date.parse(val);
  if (isNaN(s)) return false
  data[k] = new Date(val);
}

function validateBoolean (data, k, val) {
  if (val instanceof Boolean) val = val.valueOf();
  else if (typeof val === "string") {
    if (!isNaN(val)) val = !!(+val);
    else if (val === "null" || val === "false") val = false;
    else val = true;
  } else val = !!val;
  data[k] = val;
}

function validateUrl (data, k, val) {
  val = url.parse(String(val));
  if (!val.host) return false
  data[k] = val.href;
}

function validateStream (data, k, val) {
  if (!(val instanceof Stream)) return false
  data[k] = val;
}

function validate (data, k, val, type, typeDefs) {
  // arrays are lists of types.
  if (Array.isArray(type)) {
    for (var i = 0, l = type.length; i < l; i ++) {
      if (type[i] === Array) continue
      if (validate(data, k, val, type[i], typeDefs)) return true
    }
    delete data[k];
    return false
  }

  // an array of anything?
  if (type === Array) return true

  // NaN is poisonous.  Means that something is not allowed.
  if (type !== type) {
    debug("Poison NaN", k, val, type);
    delete data[k];
    return false
  }

  // explicit list of values
  if (val === type) {
    debug("Explicitly allowed %j", val);
    // if (isArray) (data[k] = data[k] || []).push(val)
    // else data[k] = val
    data[k] = val;
    return true
  }

  // now go through the list of typeDefs, validate against each one.
  var ok = false
    , types = Object.keys(typeDefs);
  for (var i = 0, l = types.length; i < l; i ++) {
    debug("test type %j %j %j", k, val, types[i]);
    var t = typeDefs[types[i]];
    if (t &&
      ((type && type.name && t.type && t.type.name) ? (type.name === t.type.name) : (type === t.type))) {
      var d = {};
      ok = false !== t.validate(d, k, val);
      val = d[k];
      if (ok) {
        // if (isArray) (data[k] = data[k] || []).push(val)
        // else data[k] = val
        data[k] = val;
        break
      }
    }
  }
  debug("OK? %j (%j %j %j)", ok, k, val, types[i]);

  if (!ok) delete data[k];
  return ok
}

function parse (args, data, remain, types, shorthands) {
  debug("parse", args, data, remain);

  var abbrevs = abbrev_1(Object.keys(types))
    , shortAbbr = abbrev_1(Object.keys(shorthands));

  for (var i = 0; i < args.length; i ++) {
    var arg = args[i];
    debug("arg", arg);

    if (arg.match(/^-{2,}$/)) {
      // done with keys.
      // the rest are args.
      remain.push.apply(remain, args.slice(i + 1));
      args[i] = "--";
      break
    }
    var hadEq = false;
    if (arg.charAt(0) === "-" && arg.length > 1) {
      if (arg.indexOf("=") !== -1) {
        hadEq = true;
        var v = arg.split("=");
        arg = v.shift();
        v = v.join("=");
        args.splice.apply(args, [i, 1].concat([arg, v]));
      }

      // see if it's a shorthand
      // if so, splice and back up to re-parse it.
      var shRes = resolveShort(arg, shorthands, shortAbbr, abbrevs);
      debug("arg=%j shRes=%j", arg, shRes);
      if (shRes) {
        debug(arg, shRes);
        args.splice.apply(args, [i, 1].concat(shRes));
        if (arg !== shRes[0]) {
          i --;
          continue
        }
      }
      arg = arg.replace(/^-+/, "");
      var no = null;
      while (arg.toLowerCase().indexOf("no-") === 0) {
        no = !no;
        arg = arg.substr(3);
      }

      if (abbrevs[arg]) arg = abbrevs[arg];

      var isArray = types[arg] === Array ||
        Array.isArray(types[arg]) && types[arg].indexOf(Array) !== -1;

      // allow unknown things to be arrays if specified multiple times.
      if (!types.hasOwnProperty(arg) && data.hasOwnProperty(arg)) {
        if (!Array.isArray(data[arg]))
          data[arg] = [data[arg]];
        isArray = true;
      }

      var val
        , la = args[i + 1];

      var isBool = typeof no === 'boolean' ||
        types[arg] === Boolean ||
        Array.isArray(types[arg]) && types[arg].indexOf(Boolean) !== -1 ||
        (typeof types[arg] === 'undefined' && !hadEq) ||
        (la === "false" &&
         (types[arg] === null ||
          Array.isArray(types[arg]) && ~types[arg].indexOf(null)));

      if (isBool) {
        // just set and move along
        val = !no;
        // however, also support --bool true or --bool false
        if (la === "true" || la === "false") {
          val = JSON.parse(la);
          la = null;
          if (no) val = !val;
          i ++;
        }

        // also support "foo":[Boolean, "bar"] and "--foo bar"
        if (Array.isArray(types[arg]) && la) {
          if (~types[arg].indexOf(la)) {
            // an explicit type
            val = la;
            i ++;
          } else if ( la === "null" && ~types[arg].indexOf(null) ) {
            // null allowed
            val = null;
            i ++;
          } else if ( !la.match(/^-{2,}[^-]/) &&
                      !isNaN(la) &&
                      ~types[arg].indexOf(Number) ) {
            // number
            val = +la;
            i ++;
          } else if ( !la.match(/^-[^-]/) && ~types[arg].indexOf(String) ) {
            // string
            val = la;
            i ++;
          }
        }

        if (isArray) (data[arg] = data[arg] || []).push(val);
        else data[arg] = val;

        continue
      }

      if (types[arg] === String && la === undefined)
        la = "";

      if (la && la.match(/^-{2,}$/)) {
        la = undefined;
        i --;
      }

      val = la === undefined ? true : la;
      if (isArray) (data[arg] = data[arg] || []).push(val);
      else data[arg] = val;

      i ++;
      continue
    }
    remain.push(arg);
  }
}

function resolveShort (arg, shorthands, shortAbbr, abbrevs) {
  // handle single-char shorthands glommed together, like
  // npm ls -glp, but only if there is one dash, and only if
  // all of the chars are single-char shorthands, and it's
  // not a match to some other abbrev.
  arg = arg.replace(/^-+/, '');

  // if it's an exact known option, then don't go any further
  if (abbrevs[arg] === arg)
    return null

  // if it's an exact known shortopt, same deal
  if (shorthands[arg]) {
    // make it an array, if it's a list of words
    if (shorthands[arg] && !Array.isArray(shorthands[arg]))
      shorthands[arg] = shorthands[arg].split(/\s+/);

    return shorthands[arg]
  }

  // first check to see if this arg is a set of single-char shorthands
  var singles = shorthands.___singles;
  if (!singles) {
    singles = Object.keys(shorthands).filter(function (s) {
      return s.length === 1
    }).reduce(function (l,r) {
      l[r] = true;
      return l
    }, {});
    shorthands.___singles = singles;
    debug('shorthand singles', singles);
  }

  var chrs = arg.split("").filter(function (c) {
    return singles[c]
  });

  if (chrs.join("") === arg) return chrs.map(function (c) {
    return shorthands[c]
  }).reduce(function (l, r) {
    return l.concat(r)
  }, [])


  // if it's an arg abbrev, and not a literal shorthand, then prefer the arg
  if (abbrevs[arg] && !shorthands[arg])
    return null

  // if it's an abbr for a shorthand, then use that
  if (shortAbbr[arg])
    arg = shortAbbr[arg];

  // make it an array, if it's a list of words
  if (shorthands[arg] && !Array.isArray(shorthands[arg]))
    shorthands[arg] = shorthands[arg].split(/\s+/);

  return shorthands[arg]
}
});
