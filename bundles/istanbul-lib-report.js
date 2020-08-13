import fs from 'fs';
import path from 'path';
import util from 'util';
import os from 'os';
import tty from 'tty';

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

var semver = createCommonjsModule(function (module, exports) {
exports = module.exports = SemVer;

var debug;
/* istanbul ignore next */
if (typeof process === 'object' &&
    process.env &&
    process.env.NODE_DEBUG &&
    /\bsemver\b/i.test(process.env.NODE_DEBUG)) {
  debug = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift('SEMVER');
    console.log.apply(console, args);
  };
} else {
  debug = function () {};
}

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = '2.0.0';

var MAX_LENGTH = 256;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
  /* istanbul ignore next */ 9007199254740991;

// Max safe segment length for coercion.
var MAX_SAFE_COMPONENT_LENGTH = 16;

// The actual regexps go on exports.re
var re = exports.re = [];
var src = exports.src = [];
var t = exports.tokens = {};
var R = 0;

function tok (n) {
  t[n] = R++;
}

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

tok('NUMERICIDENTIFIER');
src[t.NUMERICIDENTIFIER] = '0|[1-9]\\d*';
tok('NUMERICIDENTIFIERLOOSE');
src[t.NUMERICIDENTIFIERLOOSE] = '[0-9]+';

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

tok('NONNUMERICIDENTIFIER');
src[t.NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';

// ## Main Version
// Three dot-separated numeric identifiers.

tok('MAINVERSION');
src[t.MAINVERSION] = '(' + src[t.NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[t.NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[t.NUMERICIDENTIFIER] + ')';

tok('MAINVERSIONLOOSE');
src[t.MAINVERSIONLOOSE] = '(' + src[t.NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[t.NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[t.NUMERICIDENTIFIERLOOSE] + ')';

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

tok('PRERELEASEIDENTIFIER');
src[t.PRERELEASEIDENTIFIER] = '(?:' + src[t.NUMERICIDENTIFIER] +
                            '|' + src[t.NONNUMERICIDENTIFIER] + ')';

tok('PRERELEASEIDENTIFIERLOOSE');
src[t.PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[t.NUMERICIDENTIFIERLOOSE] +
                                 '|' + src[t.NONNUMERICIDENTIFIER] + ')';

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

tok('PRERELEASE');
src[t.PRERELEASE] = '(?:-(' + src[t.PRERELEASEIDENTIFIER] +
                  '(?:\\.' + src[t.PRERELEASEIDENTIFIER] + ')*))';

tok('PRERELEASELOOSE');
src[t.PRERELEASELOOSE] = '(?:-?(' + src[t.PRERELEASEIDENTIFIERLOOSE] +
                       '(?:\\.' + src[t.PRERELEASEIDENTIFIERLOOSE] + ')*))';

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

tok('BUILDIDENTIFIER');
src[t.BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

tok('BUILD');
src[t.BUILD] = '(?:\\+(' + src[t.BUILDIDENTIFIER] +
             '(?:\\.' + src[t.BUILDIDENTIFIER] + ')*))';

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

tok('FULL');
tok('FULLPLAIN');
src[t.FULLPLAIN] = 'v?' + src[t.MAINVERSION] +
                  src[t.PRERELEASE] + '?' +
                  src[t.BUILD] + '?';

src[t.FULL] = '^' + src[t.FULLPLAIN] + '$';

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
tok('LOOSEPLAIN');
src[t.LOOSEPLAIN] = '[v=\\s]*' + src[t.MAINVERSIONLOOSE] +
                  src[t.PRERELEASELOOSE] + '?' +
                  src[t.BUILD] + '?';

tok('LOOSE');
src[t.LOOSE] = '^' + src[t.LOOSEPLAIN] + '$';

tok('GTLT');
src[t.GTLT] = '((?:<|>)?=?)';

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
tok('XRANGEIDENTIFIERLOOSE');
src[t.XRANGEIDENTIFIERLOOSE] = src[t.NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
tok('XRANGEIDENTIFIER');
src[t.XRANGEIDENTIFIER] = src[t.NUMERICIDENTIFIER] + '|x|X|\\*';

tok('XRANGEPLAIN');
src[t.XRANGEPLAIN] = '[v=\\s]*(' + src[t.XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[t.XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[t.XRANGEIDENTIFIER] + ')' +
                   '(?:' + src[t.PRERELEASE] + ')?' +
                   src[t.BUILD] + '?' +
                   ')?)?';

tok('XRANGEPLAINLOOSE');
src[t.XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[t.XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[t.XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[t.XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:' + src[t.PRERELEASELOOSE] + ')?' +
                        src[t.BUILD] + '?' +
                        ')?)?';

tok('XRANGE');
src[t.XRANGE] = '^' + src[t.GTLT] + '\\s*' + src[t.XRANGEPLAIN] + '$';
tok('XRANGELOOSE');
src[t.XRANGELOOSE] = '^' + src[t.GTLT] + '\\s*' + src[t.XRANGEPLAINLOOSE] + '$';

// Coercion.
// Extract anything that could conceivably be a part of a valid semver
tok('COERCE');
src[t.COERCE] = '(^|[^\\d])' +
              '(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '})' +
              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
              '(?:\\.(\\d{1,' + MAX_SAFE_COMPONENT_LENGTH + '}))?' +
              '(?:$|[^\\d])';
tok('COERCERTL');
re[t.COERCERTL] = new RegExp(src[t.COERCE], 'g');

// Tilde ranges.
// Meaning is "reasonably at or greater than"
tok('LONETILDE');
src[t.LONETILDE] = '(?:~>?)';

tok('TILDETRIM');
src[t.TILDETRIM] = '(\\s*)' + src[t.LONETILDE] + '\\s+';
re[t.TILDETRIM] = new RegExp(src[t.TILDETRIM], 'g');
var tildeTrimReplace = '$1~';

tok('TILDE');
src[t.TILDE] = '^' + src[t.LONETILDE] + src[t.XRANGEPLAIN] + '$';
tok('TILDELOOSE');
src[t.TILDELOOSE] = '^' + src[t.LONETILDE] + src[t.XRANGEPLAINLOOSE] + '$';

// Caret ranges.
// Meaning is "at least and backwards compatible with"
tok('LONECARET');
src[t.LONECARET] = '(?:\\^)';

tok('CARETTRIM');
src[t.CARETTRIM] = '(\\s*)' + src[t.LONECARET] + '\\s+';
re[t.CARETTRIM] = new RegExp(src[t.CARETTRIM], 'g');
var caretTrimReplace = '$1^';

tok('CARET');
src[t.CARET] = '^' + src[t.LONECARET] + src[t.XRANGEPLAIN] + '$';
tok('CARETLOOSE');
src[t.CARETLOOSE] = '^' + src[t.LONECARET] + src[t.XRANGEPLAINLOOSE] + '$';

// A simple gt/lt/eq thing, or just "" to indicate "any version"
tok('COMPARATORLOOSE');
src[t.COMPARATORLOOSE] = '^' + src[t.GTLT] + '\\s*(' + src[t.LOOSEPLAIN] + ')$|^$';
tok('COMPARATOR');
src[t.COMPARATOR] = '^' + src[t.GTLT] + '\\s*(' + src[t.FULLPLAIN] + ')$|^$';

// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
tok('COMPARATORTRIM');
src[t.COMPARATORTRIM] = '(\\s*)' + src[t.GTLT] +
                      '\\s*(' + src[t.LOOSEPLAIN] + '|' + src[t.XRANGEPLAIN] + ')';

// this one has to use the /g flag
re[t.COMPARATORTRIM] = new RegExp(src[t.COMPARATORTRIM], 'g');
var comparatorTrimReplace = '$1$2$3';

// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
tok('HYPHENRANGE');
src[t.HYPHENRANGE] = '^\\s*(' + src[t.XRANGEPLAIN] + ')' +
                   '\\s+-\\s+' +
                   '(' + src[t.XRANGEPLAIN] + ')' +
                   '\\s*$';

tok('HYPHENRANGELOOSE');
src[t.HYPHENRANGELOOSE] = '^\\s*(' + src[t.XRANGEPLAINLOOSE] + ')' +
                        '\\s+-\\s+' +
                        '(' + src[t.XRANGEPLAINLOOSE] + ')' +
                        '\\s*$';

// Star ranges basically just allow anything at all.
tok('STAR');
src[t.STAR] = '(<|>)?=?\\s*\\*';

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (var i = 0; i < R; i++) {
  debug(i, src[i]);
  if (!re[i]) {
    re[i] = new RegExp(src[i]);
  }
}

exports.parse = parse;
function parse (version, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  if (version instanceof SemVer) {
    return version
  }

  if (typeof version !== 'string') {
    return null
  }

  if (version.length > MAX_LENGTH) {
    return null
  }

  var r = options.loose ? re[t.LOOSE] : re[t.FULL];
  if (!r.test(version)) {
    return null
  }

  try {
    return new SemVer(version, options)
  } catch (er) {
    return null
  }
}

exports.valid = valid;
function valid (version, options) {
  var v = parse(version, options);
  return v ? v.version : null
}

exports.clean = clean;
function clean (version, options) {
  var s = parse(version.trim().replace(/^[=v]+/, ''), options);
  return s ? s.version : null
}

exports.SemVer = SemVer;

function SemVer (version, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }
  if (version instanceof SemVer) {
    if (version.loose === options.loose) {
      return version
    } else {
      version = version.version;
    }
  } else if (typeof version !== 'string') {
    throw new TypeError('Invalid Version: ' + version)
  }

  if (version.length > MAX_LENGTH) {
    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')
  }

  if (!(this instanceof SemVer)) {
    return new SemVer(version, options)
  }

  debug('SemVer', version, options);
  this.options = options;
  this.loose = !!options.loose;

  var m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);

  if (!m) {
    throw new TypeError('Invalid Version: ' + version)
  }

  this.raw = version;

  // these are actually numbers
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
    throw new TypeError('Invalid major version')
  }

  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
    throw new TypeError('Invalid minor version')
  }

  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
    throw new TypeError('Invalid patch version')
  }

  // numberify any prerelease numeric ids
  if (!m[4]) {
    this.prerelease = [];
  } else {
    this.prerelease = m[4].split('.').map(function (id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id;
        if (num >= 0 && num < MAX_SAFE_INTEGER) {
          return num
        }
      }
      return id
    });
  }

  this.build = m[5] ? m[5].split('.') : [];
  this.format();
}

SemVer.prototype.format = function () {
  this.version = this.major + '.' + this.minor + '.' + this.patch;
  if (this.prerelease.length) {
    this.version += '-' + this.prerelease.join('.');
  }
  return this.version
};

SemVer.prototype.toString = function () {
  return this.version
};

SemVer.prototype.compare = function (other) {
  debug('SemVer.compare', this.version, this.options, other);
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options);
  }

  return this.compareMain(other) || this.comparePre(other)
};

SemVer.prototype.compareMain = function (other) {
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options);
  }

  return compareIdentifiers(this.major, other.major) ||
         compareIdentifiers(this.minor, other.minor) ||
         compareIdentifiers(this.patch, other.patch)
};

SemVer.prototype.comparePre = function (other) {
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options);
  }

  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length) {
    return -1
  } else if (!this.prerelease.length && other.prerelease.length) {
    return 1
  } else if (!this.prerelease.length && !other.prerelease.length) {
    return 0
  }

  var i = 0;
  do {
    var a = this.prerelease[i];
    var b = other.prerelease[i];
    debug('prerelease compare', i, a, b);
    if (a === undefined && b === undefined) {
      return 0
    } else if (b === undefined) {
      return 1
    } else if (a === undefined) {
      return -1
    } else if (a === b) {
      continue
    } else {
      return compareIdentifiers(a, b)
    }
  } while (++i)
};

SemVer.prototype.compareBuild = function (other) {
  if (!(other instanceof SemVer)) {
    other = new SemVer(other, this.options);
  }

  var i = 0;
  do {
    var a = this.build[i];
    var b = other.build[i];
    debug('prerelease compare', i, a, b);
    if (a === undefined && b === undefined) {
      return 0
    } else if (b === undefined) {
      return 1
    } else if (a === undefined) {
      return -1
    } else if (a === b) {
      continue
    } else {
      return compareIdentifiers(a, b)
    }
  } while (++i)
};

// preminor will bump the version up to the next minor release, and immediately
// down to pre-release. premajor and prepatch work the same way.
SemVer.prototype.inc = function (release, identifier) {
  switch (release) {
    case 'premajor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor = 0;
      this.major++;
      this.inc('pre', identifier);
      break
    case 'preminor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor++;
      this.inc('pre', identifier);
      break
    case 'prepatch':
      // If this is already a prerelease, it will bump to the next version
      // drop any prereleases that might already exist, since they are not
      // relevant at this point.
      this.prerelease.length = 0;
      this.inc('patch', identifier);
      this.inc('pre', identifier);
      break
    // If the input is a non-prerelease version, this acts the same as
    // prepatch.
    case 'prerelease':
      if (this.prerelease.length === 0) {
        this.inc('patch', identifier);
      }
      this.inc('pre', identifier);
      break

    case 'major':
      // If this is a pre-major version, bump up to the same major version.
      // Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      if (this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0) {
        this.major++;
      }
      this.minor = 0;
      this.patch = 0;
      this.prerelease = [];
      break
    case 'minor':
      // If this is a pre-minor version, bump up to the same minor version.
      // Otherwise increment minor.
      // 1.2.0-5 bumps to 1.2.0
      // 1.2.1 bumps to 1.3.0
      if (this.patch !== 0 || this.prerelease.length === 0) {
        this.minor++;
      }
      this.patch = 0;
      this.prerelease = [];
      break
    case 'patch':
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (this.prerelease.length === 0) {
        this.patch++;
      }
      this.prerelease = [];
      break
    // This probably shouldn't be used publicly.
    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
    case 'pre':
      if (this.prerelease.length === 0) {
        this.prerelease = [0];
      } else {
        var i = this.prerelease.length;
        while (--i >= 0) {
          if (typeof this.prerelease[i] === 'number') {
            this.prerelease[i]++;
            i = -2;
          }
        }
        if (i === -1) {
          // didn't increment anything
          this.prerelease.push(0);
        }
      }
      if (identifier) {
        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
        if (this.prerelease[0] === identifier) {
          if (isNaN(this.prerelease[1])) {
            this.prerelease = [identifier, 0];
          }
        } else {
          this.prerelease = [identifier, 0];
        }
      }
      break

    default:
      throw new Error('invalid increment argument: ' + release)
  }
  this.format();
  this.raw = this.version;
  return this
};

exports.inc = inc;
function inc (version, release, loose, identifier) {
  if (typeof (loose) === 'string') {
    identifier = loose;
    loose = undefined;
  }

  try {
    return new SemVer(version, loose).inc(release, identifier).version
  } catch (er) {
    return null
  }
}

exports.diff = diff;
function diff (version1, version2) {
  if (eq(version1, version2)) {
    return null
  } else {
    var v1 = parse(version1);
    var v2 = parse(version2);
    var prefix = '';
    if (v1.prerelease.length || v2.prerelease.length) {
      prefix = 'pre';
      var defaultResult = 'prerelease';
    }
    for (var key in v1) {
      if (key === 'major' || key === 'minor' || key === 'patch') {
        if (v1[key] !== v2[key]) {
          return prefix + key
        }
      }
    }
    return defaultResult // may be undefined
  }
}

exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;
function compareIdentifiers (a, b) {
  var anum = numeric.test(a);
  var bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
}

exports.rcompareIdentifiers = rcompareIdentifiers;
function rcompareIdentifiers (a, b) {
  return compareIdentifiers(b, a)
}

exports.major = major;
function major (a, loose) {
  return new SemVer(a, loose).major
}

exports.minor = minor;
function minor (a, loose) {
  return new SemVer(a, loose).minor
}

exports.patch = patch;
function patch (a, loose) {
  return new SemVer(a, loose).patch
}

exports.compare = compare;
function compare (a, b, loose) {
  return new SemVer(a, loose).compare(new SemVer(b, loose))
}

exports.compareLoose = compareLoose;
function compareLoose (a, b) {
  return compare(a, b, true)
}

exports.compareBuild = compareBuild;
function compareBuild (a, b, loose) {
  var versionA = new SemVer(a, loose);
  var versionB = new SemVer(b, loose);
  return versionA.compare(versionB) || versionA.compareBuild(versionB)
}

exports.rcompare = rcompare;
function rcompare (a, b, loose) {
  return compare(b, a, loose)
}

exports.sort = sort;
function sort (list, loose) {
  return list.sort(function (a, b) {
    return exports.compareBuild(a, b, loose)
  })
}

exports.rsort = rsort;
function rsort (list, loose) {
  return list.sort(function (a, b) {
    return exports.compareBuild(b, a, loose)
  })
}

exports.gt = gt;
function gt (a, b, loose) {
  return compare(a, b, loose) > 0
}

exports.lt = lt;
function lt (a, b, loose) {
  return compare(a, b, loose) < 0
}

exports.eq = eq;
function eq (a, b, loose) {
  return compare(a, b, loose) === 0
}

exports.neq = neq;
function neq (a, b, loose) {
  return compare(a, b, loose) !== 0
}

exports.gte = gte;
function gte (a, b, loose) {
  return compare(a, b, loose) >= 0
}

exports.lte = lte;
function lte (a, b, loose) {
  return compare(a, b, loose) <= 0
}

exports.cmp = cmp;
function cmp (a, op, b, loose) {
  switch (op) {
    case '===':
      if (typeof a === 'object')
        a = a.version;
      if (typeof b === 'object')
        b = b.version;
      return a === b

    case '!==':
      if (typeof a === 'object')
        a = a.version;
      if (typeof b === 'object')
        b = b.version;
      return a !== b

    case '':
    case '=':
    case '==':
      return eq(a, b, loose)

    case '!=':
      return neq(a, b, loose)

    case '>':
      return gt(a, b, loose)

    case '>=':
      return gte(a, b, loose)

    case '<':
      return lt(a, b, loose)

    case '<=':
      return lte(a, b, loose)

    default:
      throw new TypeError('Invalid operator: ' + op)
  }
}

exports.Comparator = Comparator;
function Comparator (comp, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  if (comp instanceof Comparator) {
    if (comp.loose === !!options.loose) {
      return comp
    } else {
      comp = comp.value;
    }
  }

  if (!(this instanceof Comparator)) {
    return new Comparator(comp, options)
  }

  debug('comparator', comp, options);
  this.options = options;
  this.loose = !!options.loose;
  this.parse(comp);

  if (this.semver === ANY) {
    this.value = '';
  } else {
    this.value = this.operator + this.semver.version;
  }

  debug('comp', this);
}

var ANY = {};
Comparator.prototype.parse = function (comp) {
  var r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
  var m = comp.match(r);

  if (!m) {
    throw new TypeError('Invalid comparator: ' + comp)
  }

  this.operator = m[1] !== undefined ? m[1] : '';
  if (this.operator === '=') {
    this.operator = '';
  }

  // if it literally is just '>' or '' then allow anything.
  if (!m[2]) {
    this.semver = ANY;
  } else {
    this.semver = new SemVer(m[2], this.options.loose);
  }
};

Comparator.prototype.toString = function () {
  return this.value
};

Comparator.prototype.test = function (version) {
  debug('Comparator.test', version, this.options.loose);

  if (this.semver === ANY || version === ANY) {
    return true
  }

  if (typeof version === 'string') {
    try {
      version = new SemVer(version, this.options);
    } catch (er) {
      return false
    }
  }

  return cmp(version, this.operator, this.semver, this.options)
};

Comparator.prototype.intersects = function (comp, options) {
  if (!(comp instanceof Comparator)) {
    throw new TypeError('a Comparator is required')
  }

  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  var rangeTmp;

  if (this.operator === '') {
    if (this.value === '') {
      return true
    }
    rangeTmp = new Range(comp.value, options);
    return satisfies(this.value, rangeTmp, options)
  } else if (comp.operator === '') {
    if (comp.value === '') {
      return true
    }
    rangeTmp = new Range(this.value, options);
    return satisfies(comp.semver, rangeTmp, options)
  }

  var sameDirectionIncreasing =
    (this.operator === '>=' || this.operator === '>') &&
    (comp.operator === '>=' || comp.operator === '>');
  var sameDirectionDecreasing =
    (this.operator === '<=' || this.operator === '<') &&
    (comp.operator === '<=' || comp.operator === '<');
  var sameSemVer = this.semver.version === comp.semver.version;
  var differentDirectionsInclusive =
    (this.operator === '>=' || this.operator === '<=') &&
    (comp.operator === '>=' || comp.operator === '<=');
  var oppositeDirectionsLessThan =
    cmp(this.semver, '<', comp.semver, options) &&
    ((this.operator === '>=' || this.operator === '>') &&
    (comp.operator === '<=' || comp.operator === '<'));
  var oppositeDirectionsGreaterThan =
    cmp(this.semver, '>', comp.semver, options) &&
    ((this.operator === '<=' || this.operator === '<') &&
    (comp.operator === '>=' || comp.operator === '>'));

  return sameDirectionIncreasing || sameDirectionDecreasing ||
    (sameSemVer && differentDirectionsInclusive) ||
    oppositeDirectionsLessThan || oppositeDirectionsGreaterThan
};

exports.Range = Range;
function Range (range, options) {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  if (range instanceof Range) {
    if (range.loose === !!options.loose &&
        range.includePrerelease === !!options.includePrerelease) {
      return range
    } else {
      return new Range(range.raw, options)
    }
  }

  if (range instanceof Comparator) {
    return new Range(range.value, options)
  }

  if (!(this instanceof Range)) {
    return new Range(range, options)
  }

  this.options = options;
  this.loose = !!options.loose;
  this.includePrerelease = !!options.includePrerelease;

  // First, split based on boolean or ||
  this.raw = range;
  this.set = range.split(/\s*\|\|\s*/).map(function (range) {
    return this.parseRange(range.trim())
  }, this).filter(function (c) {
    // throw out any that are not relevant for whatever reason
    return c.length
  });

  if (!this.set.length) {
    throw new TypeError('Invalid SemVer Range: ' + range)
  }

  this.format();
}

Range.prototype.format = function () {
  this.range = this.set.map(function (comps) {
    return comps.join(' ').trim()
  }).join('||').trim();
  return this.range
};

Range.prototype.toString = function () {
  return this.range
};

Range.prototype.parseRange = function (range) {
  var loose = this.options.loose;
  range = range.trim();
  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
  var hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);
  debug('hyphen replace', range);
  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
  range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
  debug('comparator trim', range, re[t.COMPARATORTRIM]);

  // `~ 1.2.3` => `~1.2.3`
  range = range.replace(re[t.TILDETRIM], tildeTrimReplace);

  // `^ 1.2.3` => `^1.2.3`
  range = range.replace(re[t.CARETTRIM], caretTrimReplace);

  // normalize spaces
  range = range.split(/\s+/).join(' ');

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.

  var compRe = loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
  var set = range.split(' ').map(function (comp) {
    return parseComparator(comp, this.options)
  }, this).join(' ').split(/\s+/);
  if (this.options.loose) {
    // in loose mode, throw out any that are not valid comparators
    set = set.filter(function (comp) {
      return !!comp.match(compRe)
    });
  }
  set = set.map(function (comp) {
    return new Comparator(comp, this.options)
  }, this);

  return set
};

Range.prototype.intersects = function (range, options) {
  if (!(range instanceof Range)) {
    throw new TypeError('a Range is required')
  }

  return this.set.some(function (thisComparators) {
    return (
      isSatisfiable(thisComparators, options) &&
      range.set.some(function (rangeComparators) {
        return (
          isSatisfiable(rangeComparators, options) &&
          thisComparators.every(function (thisComparator) {
            return rangeComparators.every(function (rangeComparator) {
              return thisComparator.intersects(rangeComparator, options)
            })
          })
        )
      })
    )
  })
};

// take a set of comparators and determine whether there
// exists a version which can satisfy it
function isSatisfiable (comparators, options) {
  var result = true;
  var remainingComparators = comparators.slice();
  var testComparator = remainingComparators.pop();

  while (result && remainingComparators.length) {
    result = remainingComparators.every(function (otherComparator) {
      return testComparator.intersects(otherComparator, options)
    });

    testComparator = remainingComparators.pop();
  }

  return result
}

// Mostly just for testing and legacy API reasons
exports.toComparators = toComparators;
function toComparators (range, options) {
  return new Range(range, options).set.map(function (comp) {
    return comp.map(function (c) {
      return c.value
    }).join(' ').trim().split(' ')
  })
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator (comp, options) {
  debug('comp', comp, options);
  comp = replaceCarets(comp, options);
  debug('caret', comp);
  comp = replaceTildes(comp, options);
  debug('tildes', comp);
  comp = replaceXRanges(comp, options);
  debug('xrange', comp);
  comp = replaceStars(comp, options);
  debug('stars', comp);
  return comp
}

function isX (id) {
  return !id || id.toLowerCase() === 'x' || id === '*'
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes (comp, options) {
  return comp.trim().split(/\s+/).map(function (comp) {
    return replaceTilde(comp, options)
  }).join(' ')
}

function replaceTilde (comp, options) {
  var r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
  return comp.replace(r, function (_, M, m, p, pr) {
    debug('tilde', comp, _, M, m, p, pr);
    var ret;

    if (isX(M)) {
      ret = '';
    } else if (isX(m)) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    } else if (isX(p)) {
      // ~1.2 == >=1.2.0 <1.3.0
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    } else if (pr) {
      debug('replaceTilde pr', pr);
      ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
            ' <' + M + '.' + (+m + 1) + '.0';
    } else {
      // ~1.2.3 == >=1.2.3 <1.3.0
      ret = '>=' + M + '.' + m + '.' + p +
            ' <' + M + '.' + (+m + 1) + '.0';
    }

    debug('tilde return', ret);
    return ret
  })
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets (comp, options) {
  return comp.trim().split(/\s+/).map(function (comp) {
    return replaceCaret(comp, options)
  }).join(' ')
}

function replaceCaret (comp, options) {
  debug('caret', comp, options);
  var r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
  return comp.replace(r, function (_, M, m, p, pr) {
    debug('caret', comp, _, M, m, p, pr);
    var ret;

    if (isX(M)) {
      ret = '';
    } else if (isX(m)) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    } else if (isX(p)) {
      if (M === '0') {
        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
      } else {
        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
      }
    } else if (pr) {
      debug('replaceCaret pr', pr);
      if (M === '0') {
        if (m === '0') {
          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
                ' <' + M + '.' + m + '.' + (+p + 1);
        } else {
          ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
                ' <' + M + '.' + (+m + 1) + '.0';
        }
      } else {
        ret = '>=' + M + '.' + m + '.' + p + '-' + pr +
              ' <' + (+M + 1) + '.0.0';
      }
    } else {
      debug('no pr');
      if (M === '0') {
        if (m === '0') {
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + m + '.' + (+p + 1);
        } else {
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + (+m + 1) + '.0';
        }
      } else {
        ret = '>=' + M + '.' + m + '.' + p +
              ' <' + (+M + 1) + '.0.0';
      }
    }

    debug('caret return', ret);
    return ret
  })
}

function replaceXRanges (comp, options) {
  debug('replaceXRanges', comp, options);
  return comp.split(/\s+/).map(function (comp) {
    return replaceXRange(comp, options)
  }).join(' ')
}

function replaceXRange (comp, options) {
  comp = comp.trim();
  var r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
  return comp.replace(r, function (ret, gtlt, M, m, p, pr) {
    debug('xRange', comp, ret, gtlt, M, m, p, pr);
    var xM = isX(M);
    var xm = xM || isX(m);
    var xp = xm || isX(p);
    var anyX = xp;

    if (gtlt === '=' && anyX) {
      gtlt = '';
    }

    // if we're including prereleases in the match, then we need
    // to fix this to -0, the lowest possible prerelease value
    pr = options.includePrerelease ? '-0' : '';

    if (xM) {
      if (gtlt === '>' || gtlt === '<') {
        // nothing is allowed
        ret = '<0.0.0-0';
      } else {
        // nothing is forbidden
        ret = '*';
      }
    } else if (gtlt && anyX) {
      // we know patch is an x, because we have any x at all.
      // replace X with 0
      if (xm) {
        m = 0;
      }
      p = 0;

      if (gtlt === '>') {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        // >1.2.3 => >= 1.2.4
        gtlt = '>=';
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === '<=') {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = '<';
        if (xm) {
          M = +M + 1;
        } else {
          m = +m + 1;
        }
      }

      ret = gtlt + M + '.' + m + '.' + p + pr;
    } else if (xm) {
      ret = '>=' + M + '.0.0' + pr + ' <' + (+M + 1) + '.0.0' + pr;
    } else if (xp) {
      ret = '>=' + M + '.' + m + '.0' + pr +
        ' <' + M + '.' + (+m + 1) + '.0' + pr;
    }

    debug('xRange return', ret);

    return ret
  })
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars (comp, options) {
  debug('replaceStars', comp, options);
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[t.STAR], '')
}

// This function is passed to string.replace(re[t.HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace ($0,
  from, fM, fm, fp, fpr, fb,
  to, tM, tm, tp, tpr, tb) {
  if (isX(fM)) {
    from = '';
  } else if (isX(fm)) {
    from = '>=' + fM + '.0.0';
  } else if (isX(fp)) {
    from = '>=' + fM + '.' + fm + '.0';
  } else {
    from = '>=' + from;
  }

  if (isX(tM)) {
    to = '';
  } else if (isX(tm)) {
    to = '<' + (+tM + 1) + '.0.0';
  } else if (isX(tp)) {
    to = '<' + tM + '.' + (+tm + 1) + '.0';
  } else if (tpr) {
    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
  } else {
    to = '<=' + to;
  }

  return (from + ' ' + to).trim()
}

// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function (version) {
  if (!version) {
    return false
  }

  if (typeof version === 'string') {
    try {
      version = new SemVer(version, this.options);
    } catch (er) {
      return false
    }
  }

  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this.set[i], version, this.options)) {
      return true
    }
  }
  return false
};

function testSet (set, version, options) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version)) {
      return false
    }
  }

  if (version.prerelease.length && !options.includePrerelease) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (i = 0; i < set.length; i++) {
      debug(set[i].semver);
      if (set[i].semver === ANY) {
        continue
      }

      if (set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver;
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch) {
          return true
        }
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false
  }

  return true
}

exports.satisfies = satisfies;
function satisfies (version, range, options) {
  try {
    range = new Range(range, options);
  } catch (er) {
    return false
  }
  return range.test(version)
}

exports.maxSatisfying = maxSatisfying;
function maxSatisfying (versions, range, options) {
  var max = null;
  var maxSV = null;
  try {
    var rangeObj = new Range(range, options);
  } catch (er) {
    return null
  }
  versions.forEach(function (v) {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!max || maxSV.compare(v) === -1) {
        // compare(max, v, true)
        max = v;
        maxSV = new SemVer(max, options);
      }
    }
  });
  return max
}

exports.minSatisfying = minSatisfying;
function minSatisfying (versions, range, options) {
  var min = null;
  var minSV = null;
  try {
    var rangeObj = new Range(range, options);
  } catch (er) {
    return null
  }
  versions.forEach(function (v) {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!min || minSV.compare(v) === 1) {
        // compare(min, v, true)
        min = v;
        minSV = new SemVer(min, options);
      }
    }
  });
  return min
}

exports.minVersion = minVersion;
function minVersion (range, loose) {
  range = new Range(range, loose);

  var minver = new SemVer('0.0.0');
  if (range.test(minver)) {
    return minver
  }

  minver = new SemVer('0.0.0-0');
  if (range.test(minver)) {
    return minver
  }

  minver = null;
  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i];

    comparators.forEach(function (comparator) {
      // Clone to avoid manipulating the comparator's semver object.
      var compver = new SemVer(comparator.semver.version);
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++;
          } else {
            compver.prerelease.push(0);
          }
          compver.raw = compver.format();
          /* fallthrough */
        case '':
        case '>=':
          if (!minver || gt(minver, compver)) {
            minver = compver;
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error('Unexpected operation: ' + comparator.operator)
      }
    });
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
}

exports.validRange = validRange;
function validRange (range, options) {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range(range, options).range || '*'
  } catch (er) {
    return null
  }
}

// Determine if version is less than all the versions possible in the range
exports.ltr = ltr;
function ltr (version, range, options) {
  return outside(version, range, '<', options)
}

// Determine if version is greater than all the versions possible in the range.
exports.gtr = gtr;
function gtr (version, range, options) {
  return outside(version, range, '>', options)
}

exports.outside = outside;
function outside (version, range, hilo, options) {
  version = new SemVer(version, options);
  range = new Range(range, options);

  var gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt;
      ltefn = lte;
      ltfn = lt;
      comp = '>';
      ecomp = '>=';
      break
    case '<':
      gtfn = lt;
      ltefn = gte;
      ltfn = gt;
      comp = '<';
      ecomp = '<=';
      break
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"')
  }

  // If it satisifes the range it is not outside
  if (satisfies(version, range, options)) {
    return false
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i];

    var high = null;
    var low = null;

    comparators.forEach(function (comparator) {
      if (comparator.semver === ANY) {
        comparator = new Comparator('>=0.0.0');
      }
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, options)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, options)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false
    }
  }
  return true
}

exports.prerelease = prerelease;
function prerelease (version, options) {
  var parsed = parse(version, options);
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
}

exports.intersects = intersects;
function intersects (r1, r2, options) {
  r1 = new Range(r1, options);
  r2 = new Range(r2, options);
  return r1.intersects(r2)
}

exports.coerce = coerce;
function coerce (version, options) {
  if (version instanceof SemVer) {
    return version
  }

  if (typeof version === 'number') {
    version = String(version);
  }

  if (typeof version !== 'string') {
    return null
  }

  options = options || {};

  var match = null;
  if (!options.rtl) {
    match = version.match(re[t.COERCE]);
  } else {
    // Find the right-most coercible string that does not share
    // a terminus with a more left-ward coercible string.
    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
    //
    // Walk through the string checking with a /g regexp
    // Manually set the index so as to pick up overlapping matches.
    // Stop when we get a match that ends at the string end, since no
    // coercible string can be more right-ward without the same terminus.
    var next;
    while ((next = re[t.COERCERTL].exec(version)) &&
      (!match || match.index + match[0].length !== version.length)
    ) {
      if (!match ||
          next.index + next[0].length !== match.index + match[0].length) {
        match = next;
      }
      re[t.COERCERTL].lastIndex = next.index + next[1].length + next[2].length;
    }
    // leave it in a clean state
    re[t.COERCERTL].lastIndex = -1;
  }

  if (match === null) {
    return null
  }

  return parse(match[2] +
    '.' + (match[3] || '0') +
    '.' + (match[4] || '0'), options)
}
});

const {promisify} = util;


const useNativeRecursiveOption = semver.satisfies(process.version, '>=10.12.0');

// https://github.com/nodejs/node/issues/8987
// https://github.com/libuv/libuv/pull/1088
const checkPath = pth => {
	if (process.platform === 'win32') {
		const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path.parse(pth).root, ''));

		if (pathHasInvalidWinCharacters) {
			const error = new Error(`Path contains invalid characters: ${pth}`);
			error.code = 'EINVAL';
			throw error;
		}
	}
};

const processOptions = options => {
	// https://github.com/sindresorhus/make-dir/issues/18
	const defaults = {
		mode: 0o777,
		fs
	};

	return {
		...defaults,
		...options
	};
};

const permissionError = pth => {
	// This replicates the exception of `fs.mkdir` with native the
	// `recusive` option when run on an invalid drive under Windows.
	const error = new Error(`operation not permitted, mkdir '${pth}'`);
	error.code = 'EPERM';
	error.errno = -4048;
	error.path = pth;
	error.syscall = 'mkdir';
	return error;
};

const makeDir = async (input, options) => {
	checkPath(input);
	options = processOptions(options);

	const mkdir = promisify(options.fs.mkdir);
	const stat = promisify(options.fs.stat);

	if (useNativeRecursiveOption && options.fs.mkdir === fs.mkdir) {
		const pth = path.resolve(input);

		await mkdir(pth, {
			mode: options.mode,
			recursive: true
		});

		return pth;
	}

	const make = async pth => {
		try {
			await mkdir(pth, options.mode);

			return pth;
		} catch (error) {
			if (error.code === 'EPERM') {
				throw error;
			}

			if (error.code === 'ENOENT') {
				if (path.dirname(pth) === pth) {
					throw permissionError(pth);
				}

				if (error.message.includes('null bytes')) {
					throw error;
				}

				await make(path.dirname(pth));

				return make(pth);
			}

			try {
				const stats = await stat(pth);
				if (!stats.isDirectory()) {
					throw new Error('The path is not a directory');
				}
			} catch (_) {
				throw error;
			}

			return pth;
		}
	};

	return make(path.resolve(input));
};

var makeDir_1 = makeDir;

var sync = (input, options) => {
	checkPath(input);
	options = processOptions(options);

	if (useNativeRecursiveOption && options.fs.mkdirSync === fs.mkdirSync) {
		const pth = path.resolve(input);

		fs.mkdirSync(pth, {
			mode: options.mode,
			recursive: true
		});

		return pth;
	}

	const make = pth => {
		try {
			options.fs.mkdirSync(pth, options.mode);
		} catch (error) {
			if (error.code === 'EPERM') {
				throw error;
			}

			if (error.code === 'ENOENT') {
				if (path.dirname(pth) === pth) {
					throw permissionError(pth);
				}

				if (error.message.includes('null bytes')) {
					throw error;
				}

				make(path.dirname(pth));
				return make(pth);
			}

			try {
				if (!options.fs.statSync(pth).isDirectory()) {
					throw new Error('The path is not a directory');
				}
			} catch (_) {
				throw error;
			}
		}

		return pth;
	};

	return make(path.resolve(input));
};
makeDir_1.sync = sync;

var hasFlag = (flag, argv = process.argv) => {
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf('--');
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};

const {env} = process;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false') ||
	hasFlag('color=never')) {
	forceColor = 0;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = 1;
}

if ('FORCE_COLOR' in env) {
	if (env.FORCE_COLOR === 'true') {
		forceColor = 1;
	} else if (env.FORCE_COLOR === 'false') {
		forceColor = 0;
	} else {
		forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(haveStream, streamIsTTY) {
	if (forceColor === 0) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (haveStream && !streamIsTTY && forceColor === undefined) {
		return 0;
	}

	const min = forceColor || 0;

	if (env.TERM === 'dumb') {
		return min;
	}

	if (process.platform === 'win32') {
		// Windows 10 build 10586 is the first Windows release that supports 256 colors.
		// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if ('GITHUB_ACTIONS' in env) {
		return 1;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream, stream && stream.isTTY);
	return translateLevel(level);
}

var supportsColor_1 = {
	supportsColor: getSupportLevel,
	stdout: translateLevel(supportsColor(true, tty.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty.isatty(2)))
};

/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */





/**
 * Base class for writing content
 * @class ContentWriter
 * @constructor
 */
class ContentWriter {
    /**
     * returns the colorized version of a string. Typically,
     * content writers that write to files will return the
     * same string and ones writing to a tty will wrap it in
     * appropriate escape sequences.
     * @param {String} str the string to colorize
     * @param {String} clazz one of `high`, `medium` or `low`
     * @returns {String} the colorized form of the string
     */
    colorize(str /*, clazz*/) {
        return str;
    }

    /**
     * writes a string appended with a newline to the destination
     * @param {String} str the string to write
     */
    println(str) {
        this.write(`${str}\n`);
    }

    /**
     * closes this content writer. Should be called after all writes are complete.
     */
    close() {}
}

/**
 * a content writer that writes to a file
 * @param {Number} fd - the file descriptor
 * @extends ContentWriter
 * @constructor
 */
class FileContentWriter extends ContentWriter {
    constructor(fd) {
        super();

        this.fd = fd;
    }

    write(str) {
        fs.writeSync(this.fd, str);
    }

    close() {
        fs.closeSync(this.fd);
    }
}

// allow stdout to be captured for tests.
let capture = false;
let output = '';

/**
 * a content writer that writes to the console
 * @extends ContentWriter
 * @constructor
 */
class ConsoleWriter extends ContentWriter {
    write(str) {
        if (capture) {
            output += str;
        } else {
            process.stdout.write(str);
        }
    }

    colorize(str, clazz) {
        const colors = {
            low: '31;1',
            medium: '33;1',
            high: '32;1'
        };

        /* istanbul ignore next: different modes for CI and local */
        if (supportsColor_1.stdout && colors[clazz]) {
            return `\u001b[${colors[clazz]}m${str}\u001b[0m`;
        }
        return str;
    }
}

/**
 * utility for writing files under a specific directory
 * @class FileWriter
 * @param {String} baseDir the base directory under which files should be written
 * @constructor
 */
class FileWriter {
    constructor(baseDir) {
        if (!baseDir) {
            throw new Error('baseDir must be specified');
        }
        this.baseDir = baseDir;
    }

    /**
     * static helpers for capturing stdout report output;
     * super useful for tests!
     */
    static startCapture() {
        capture = true;
    }

    static stopCapture() {
        capture = false;
    }

    static getOutput() {
        return output;
    }

    static resetOutput() {
        output = '';
    }

    /**
     * returns a FileWriter that is rooted at the supplied subdirectory
     * @param {String} subdir the subdirectory under which to root the
     *  returned FileWriter
     * @returns {FileWriter}
     */
    writerForDir(subdir) {
        if (path.isAbsolute(subdir)) {
            throw new Error(
                `Cannot create subdir writer for absolute path: ${subdir}`
            );
        }
        return new FileWriter(`${this.baseDir}/${subdir}`);
    }

    /**
     * copies a file from a source directory to a destination name
     * @param {String} source path to source file
     * @param {String} dest relative path to destination file
     * @param {String} [header=undefined] optional text to prepend to destination
     *  (e.g., an "this file is autogenerated" comment, copyright notice, etc.)
     */
    copyFile(source, dest, header) {
        if (path.isAbsolute(dest)) {
            throw new Error(`Cannot write to absolute path: ${dest}`);
        }
        dest = path.resolve(this.baseDir, dest);
        makeDir_1.sync(path.dirname(dest));
        let contents;
        if (header) {
            contents = header + fs.readFileSync(source, 'utf8');
        } else {
            contents = fs.readFileSync(source);
        }
        fs.writeFileSync(dest, contents);
    }

    /**
     * returns a content writer for writing content to the supplied file.
     * @param {String|null} file the relative path to the file or the special
     *  values `"-"` or `null` for writing to the console
     * @returns {ContentWriter}
     */
    writeFile(file) {
        if (file === null || file === '-') {
            return new ConsoleWriter();
        }
        if (path.isAbsolute(file)) {
            throw new Error(`Cannot write to absolute path: ${file}`);
        }
        file = path.resolve(this.baseDir, file);
        makeDir_1.sync(path.dirname(file));
        return new FileContentWriter(fs.openSync(file, 'w'));
    }
}

var fileWriter = FileWriter;

/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
const INDENT = '  ';

function attrString(attrs) {
    return Object.entries(attrs || {})
        .map(([k, v]) => ` ${k}="${v}"`)
        .join('');
}

/**
 * a utility class to produce well-formed, indented XML
 * @param {ContentWriter} contentWriter the content writer that this utility wraps
 * @constructor
 */
class XMLWriter {
    constructor(contentWriter) {
        this.cw = contentWriter;
        this.stack = [];
    }

    indent(str) {
        return this.stack.map(() => INDENT).join('') + str;
    }

    /**
     * writes the opening XML tag with the supplied attributes
     * @param {String} name tag name
     * @param {Object} [attrs=null] attrs attributes for the tag
     */
    openTag(name, attrs) {
        const str = this.indent(`<${name + attrString(attrs)}>`);
        this.cw.println(str);
        this.stack.push(name);
    }

    /**
     * closes an open XML tag.
     * @param {String} name - tag name to close. This must match the writer's
     *  notion of the tag that is currently open.
     */
    closeTag(name) {
        if (this.stack.length === 0) {
            throw new Error(`Attempt to close tag ${name} when not opened`);
        }
        const stashed = this.stack.pop();
        const str = `</${name}>`;

        if (stashed !== name) {
            throw new Error(
                `Attempt to close tag ${name} when ${stashed} was the one open`
            );
        }
        this.cw.println(this.indent(str));
    }

    /**
     * writes a tag and its value opening and closing it at the same time
     * @param {String} name tag name
     * @param {Object} [attrs=null] attrs tag attributes
     * @param {String} [content=null] content optional tag content
     */
    inlineTag(name, attrs, content) {
        let str = '<' + name + attrString(attrs);
        if (content) {
            str += `>${content}</${name}>`;
        } else {
            str += '/>';
        }
        str = this.indent(str);
        this.cw.println(str);
    }

    /**
     * closes all open tags and ends the document
     */
    closeAll() {
        this.stack
            .slice()
            .reverse()
            .forEach(name => {
                this.closeTag(name);
            });
    }
}

var xmlWriter = XMLWriter;

/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/**
 * An object with methods that are called during the traversal of the coverage tree.
 * A visitor has the following methods that are called during tree traversal.
 *
 *   * `onStart(root, state)` - called before traversal begins
 *   * `onSummary(node, state)` - called for every summary node
 *   * `onDetail(node, state)` - called for every detail node
 *   * `onSummaryEnd(node, state)` - called after all children have been visited for
 *      a summary node.
 *   * `onEnd(root, state)` - called after traversal ends
 *
 * @param delegate - a partial visitor that only implements the methods of interest
 *  The visitor object supplies the missing methods as noops. For example, reports
 *  that only need the final coverage summary need implement `onStart` and nothing
 *  else. Reports that use only detailed coverage information need implement `onDetail`
 *  and nothing else.
 * @constructor
 */
class Visitor {
    constructor(delegate) {
        this.delegate = delegate;
    }
}

['Start', 'End', 'Summary', 'SummaryEnd', 'Detail']
    .map(k => `on${k}`)
    .forEach(fn => {
        Object.defineProperty(Visitor.prototype, fn, {
            writable: true,
            value(node, state) {
                if (typeof this.delegate[fn] === 'function') {
                    this.delegate[fn](node, state);
                }
            }
        });
    });

class CompositeVisitor extends Visitor {
    constructor(visitors) {
        super();

        if (!Array.isArray(visitors)) {
            visitors = [visitors];
        }
        this.visitors = visitors.map(v => {
            if (v instanceof Visitor) {
                return v;
            }
            return new Visitor(v);
        });
    }
}

['Start', 'Summary', 'SummaryEnd', 'Detail', 'End']
    .map(k => `on${k}`)
    .forEach(fn => {
        Object.defineProperty(CompositeVisitor.prototype, fn, {
            value(node, state) {
                this.visitors.forEach(v => {
                    v[fn](node, state);
                });
            }
        });
    });

class BaseNode {
    isRoot() {
        return !this.getParent();
    }

    /**
     * visit all nodes depth-first from this node down. Note that `onStart`
     * and `onEnd` are never called on the visitor even if the current
     * node is the root of the tree.
     * @param visitor a full visitor that is called during tree traversal
     * @param state optional state that is passed around
     */
    visit(visitor, state) {
        if (this.isSummary()) {
            visitor.onSummary(this, state);
        } else {
            visitor.onDetail(this, state);
        }

        this.getChildren().forEach(child => {
            child.visit(visitor, state);
        });

        if (this.isSummary()) {
            visitor.onSummaryEnd(this, state);
        }
    }
}

/**
 * abstract base class for a coverage tree.
 * @constructor
 */
class BaseTree {
    constructor(root) {
        this.root = root;
    }

    /**
     * returns the root node of the tree
     */
    getRoot() {
        return this.root;
    }

    /**
     * visits the tree depth-first with the supplied partial visitor
     * @param visitor - a potentially partial visitor
     * @param state - the state to be passed around during tree traversal
     */
    visit(visitor, state) {
        if (!(visitor instanceof Visitor)) {
            visitor = new Visitor(visitor);
        }
        visitor.onStart(this.getRoot(), state);
        this.getRoot().visit(visitor, state);
        visitor.onEnd(this.getRoot(), state);
    }
}

var tree = {
    BaseTree,
    BaseNode,
    Visitor,
    CompositeVisitor
};

/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var watermarks = {
    getDefault() {
        return {
            statements: [50, 80],
            functions: [50, 80],
            branches: [50, 80],
            lines: [50, 80]
        };
    }
};

/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var percent = function percent(covered, total) {
    let tmp;
    if (total > 0) {
        tmp = (1000 * 100 * covered) / total + 5;
        return Math.floor(tmp / 10) / 100;
    } else {
        return 100.0;
    }
};

var dataProperties = function dataProperties(klass, properties) {
    properties.forEach(p => {
        Object.defineProperty(klass.prototype, p, {
            enumerable: true,
            get() {
                return this.data[p];
            }
        });
    });
};

function blankSummary() {
    const empty = () => ({
        total: 0,
        covered: 0,
        skipped: 0,
        pct: 'Unknown'
    });

    return {
        lines: empty(),
        statements: empty(),
        functions: empty(),
        branches: empty()
    };
}

// asserts that a data object "looks like" a summary coverage object
function assertValidSummary(obj) {
    const valid =
        obj && obj.lines && obj.statements && obj.functions && obj.branches;
    if (!valid) {
        throw new Error(
            'Invalid summary coverage object, missing keys, found:' +
                Object.keys(obj).join(',')
        );
    }
}

/**
 * CoverageSummary provides a summary of code coverage . It exposes 4 properties,
 * `lines`, `statements`, `branches`, and `functions`. Each of these properties
 * is an object that has 4 keys `total`, `covered`, `skipped` and `pct`.
 * `pct` is a percentage number (0-100).
 */
class CoverageSummary {
    /**
     * @constructor
     * @param {Object|CoverageSummary} [obj=undefined] an optional data object or
     * another coverage summary to initialize this object with.
     */
    constructor(obj) {
        if (!obj) {
            this.data = blankSummary();
        } else if (obj instanceof CoverageSummary) {
            this.data = obj.data;
        } else {
            this.data = obj;
        }
        assertValidSummary(this.data);
    }

    /**
     * merges a second summary coverage object into this one
     * @param {CoverageSummary} obj - another coverage summary object
     */
    merge(obj) {
        const keys = ['lines', 'statements', 'branches', 'functions'];
        keys.forEach(key => {
            this[key].total += obj[key].total;
            this[key].covered += obj[key].covered;
            this[key].skipped += obj[key].skipped;
            this[key].pct = percent(this[key].covered, this[key].total);
        });

        return this;
    }

    /**
     * returns a POJO that is JSON serializable. May be used to get the raw
     * summary object.
     */
    toJSON() {
        return this.data;
    }

    /**
     * return true if summary has no lines of code
     */
    isEmpty() {
        return this.lines.total === 0;
    }
}

dataProperties(CoverageSummary, [
    'lines',
    'statements',
    'functions',
    'branches'
]);

var coverageSummary = {
    CoverageSummary
};

const { CoverageSummary: CoverageSummary$1 } = coverageSummary;

// returns a data object that represents empty coverage
function emptyCoverage(filePath) {
    return {
        path: filePath,
        statementMap: {},
        fnMap: {},
        branchMap: {},
        s: {},
        f: {},
        b: {}
    };
}

// asserts that a data object "looks like" a coverage object
function assertValidObject(obj) {
    const valid =
        obj &&
        obj.path &&
        obj.statementMap &&
        obj.fnMap &&
        obj.branchMap &&
        obj.s &&
        obj.f &&
        obj.b;
    if (!valid) {
        throw new Error(
            'Invalid file coverage object, missing keys, found:' +
                Object.keys(obj).join(',')
        );
    }
}

/**
 * provides a read-only view of coverage for a single file.
 * The deep structure of this object is documented elsewhere. It has the following
 * properties:
 *
 * * `path` - the file path for which coverage is being tracked
 * * `statementMap` - map of statement locations keyed by statement index
 * * `fnMap` - map of function metadata keyed by function index
 * * `branchMap` - map of branch metadata keyed by branch index
 * * `s` - hit counts for statements
 * * `f` - hit count for functions
 * * `b` - hit count for branches
 */
class FileCoverage {
    /**
     * @constructor
     * @param {Object|FileCoverage|String} pathOrObj is a string that initializes
     * and empty coverage object with the specified file path or a data object that
     * has all the required properties for a file coverage object.
     */
    constructor(pathOrObj) {
        if (!pathOrObj) {
            throw new Error(
                'Coverage must be initialized with a path or an object'
            );
        }
        if (typeof pathOrObj === 'string') {
            this.data = emptyCoverage(pathOrObj);
        } else if (pathOrObj instanceof FileCoverage) {
            this.data = pathOrObj.data;
        } else if (typeof pathOrObj === 'object') {
            this.data = pathOrObj;
        } else {
            throw new Error('Invalid argument to coverage constructor');
        }
        assertValidObject(this.data);
    }

    /**
     * returns computed line coverage from statement coverage.
     * This is a map of hits keyed by line number in the source.
     */
    getLineCoverage() {
        const statementMap = this.data.statementMap;
        const statements = this.data.s;
        const lineMap = Object.create(null);

        Object.entries(statements).forEach(([st, count]) => {
            /* istanbul ignore if: is this even possible? */
            if (!statementMap[st]) {
                return;
            }
            const { line } = statementMap[st].start;
            const prevVal = lineMap[line];
            if (prevVal === undefined || prevVal < count) {
                lineMap[line] = count;
            }
        });
        return lineMap;
    }

    /**
     * returns an array of uncovered line numbers.
     * @returns {Array} an array of line numbers for which no hits have been
     *  collected.
     */
    getUncoveredLines() {
        const lc = this.getLineCoverage();
        const ret = [];
        Object.entries(lc).forEach(([l, hits]) => {
            if (hits === 0) {
                ret.push(l);
            }
        });
        return ret;
    }

    /**
     * returns a map of branch coverage by source line number.
     * @returns {Object} an object keyed by line number. Each object
     * has a `covered`, `total` and `coverage` (percentage) property.
     */
    getBranchCoverageByLine() {
        const branchMap = this.branchMap;
        const branches = this.b;
        const ret = {};
        Object.entries(branchMap).forEach(([k, map]) => {
            const line = map.line || map.loc.start.line;
            const branchData = branches[k];
            ret[line] = ret[line] || [];
            ret[line].push(...branchData);
        });
        Object.entries(ret).forEach(([k, dataArray]) => {
            const covered = dataArray.filter(item => item > 0);
            const coverage = (covered.length / dataArray.length) * 100;
            ret[k] = {
                covered: covered.length,
                total: dataArray.length,
                coverage
            };
        });
        return ret;
    }

    /**
     * return a JSON-serializable POJO for this file coverage object
     */
    toJSON() {
        return this.data;
    }

    /**
     * merges a second coverage object into this one, updating hit counts
     * @param {FileCoverage} other - the coverage object to be merged into this one.
     *  Note that the other object should have the same structure as this one (same file).
     */
    merge(other) {
        if (other.all === true) {
            return;
        }

        if (this.all === true) {
            this.data = other.data;
            return;
        }

        Object.entries(other.s).forEach(([k, v]) => {
            this.data.s[k] += v;
        });
        Object.entries(other.f).forEach(([k, v]) => {
            this.data.f[k] += v;
        });
        Object.entries(other.b).forEach(([k, v]) => {
            let i;
            const retArray = this.data.b[k];
            /* istanbul ignore if: is this even possible? */
            if (!retArray) {
                this.data.b[k] = v;
                return;
            }
            for (i = 0; i < retArray.length; i += 1) {
                retArray[i] += v[i];
            }
        });
    }

    computeSimpleTotals(property) {
        let stats = this[property];

        if (typeof stats === 'function') {
            stats = stats.call(this);
        }

        const ret = {
            total: Object.keys(stats).length,
            covered: Object.values(stats).filter(v => !!v).length,
            skipped: 0
        };
        ret.pct = percent(ret.covered, ret.total);
        return ret;
    }

    computeBranchTotals() {
        const stats = this.b;
        const ret = { total: 0, covered: 0, skipped: 0 };

        Object.values(stats).forEach(branches => {
            ret.covered += branches.filter(hits => hits > 0).length;
            ret.total += branches.length;
        });
        ret.pct = percent(ret.covered, ret.total);
        return ret;
    }

    /**
     * resets hit counts for all statements, functions and branches
     * in this coverage object resulting in zero coverage.
     */
    resetHits() {
        const statements = this.s;
        const functions = this.f;
        const branches = this.b;
        Object.keys(statements).forEach(s => {
            statements[s] = 0;
        });
        Object.keys(functions).forEach(f => {
            functions[f] = 0;
        });
        Object.keys(branches).forEach(b => {
            branches[b].fill(0);
        });
    }

    /**
     * returns a CoverageSummary for this file coverage object
     * @returns {CoverageSummary}
     */
    toSummary() {
        const ret = {};
        ret.lines = this.computeSimpleTotals('getLineCoverage');
        ret.functions = this.computeSimpleTotals('f', 'fnMap');
        ret.statements = this.computeSimpleTotals('s', 'statementMap');
        ret.branches = this.computeBranchTotals();
        return new CoverageSummary$1(ret);
    }
}

// expose coverage data attributes
dataProperties(FileCoverage, [
    'path',
    'statementMap',
    'fnMap',
    'branchMap',
    's',
    'f',
    'b',
    'all'
]);

var fileCoverage = {
    FileCoverage
};

const { FileCoverage: FileCoverage$1 } = fileCoverage;
const { CoverageSummary: CoverageSummary$2 } = coverageSummary;

function maybeConstruct(obj, klass) {
    if (obj instanceof klass) {
        return obj;
    }

    return new klass(obj);
}

function loadMap(source) {
    const data = Object.create(null);
    if (!source) {
        return data;
    }

    Object.entries(source).forEach(([k, cov]) => {
        data[k] = maybeConstruct(cov, FileCoverage$1);
    });

    return data;
}

/** CoverageMap is a map of `FileCoverage` objects keyed by file paths. */
class CoverageMap {
    /**
     * @constructor
     * @param {Object} [obj=undefined] obj A coverage map from which to initialize this
     * map's contents. This can be the raw global coverage object.
     */
    constructor(obj) {
        if (obj instanceof CoverageMap) {
            this.data = obj.data;
        } else {
            this.data = loadMap(obj);
        }
    }

    /**
     * merges a second coverage map into this one
     * @param {CoverageMap} obj - a CoverageMap or its raw data. Coverage is merged
     *  correctly for the same files and additional file coverage keys are created
     *  as needed.
     */
    merge(obj) {
        const other = maybeConstruct(obj, CoverageMap);
        Object.values(other.data).forEach(fc => {
            this.addFileCoverage(fc);
        });
    }

    /**
     * filter the coveragemap based on the callback provided
     * @param {Function (filename)} callback - Returns true if the path
     *  should be included in the coveragemap. False if it should be
     *  removed.
     */
    filter(callback) {
        Object.keys(this.data).forEach(k => {
            if (!callback(k)) {
                delete this.data[k];
            }
        });
    }

    /**
     * returns a JSON-serializable POJO for this coverage map
     * @returns {Object}
     */
    toJSON() {
        return this.data;
    }

    /**
     * returns an array for file paths for which this map has coverage
     * @returns {Array{string}} - array of files
     */
    files() {
        return Object.keys(this.data);
    }

    /**
     * returns the file coverage for the specified file.
     * @param {String} file
     * @returns {FileCoverage}
     */
    fileCoverageFor(file) {
        const fc = this.data[file];
        if (!fc) {
            throw new Error(`No file coverage available for: ${file}`);
        }
        return fc;
    }

    /**
     * adds a file coverage object to this map. If the path for the object,
     * already exists in the map, it is merged with the existing coverage
     * otherwise a new key is added to the map.
     * @param {FileCoverage} fc the file coverage to add
     */
    addFileCoverage(fc) {
        const cov = new FileCoverage$1(fc);
        const { path } = cov;
        if (this.data[path]) {
            this.data[path].merge(cov);
        } else {
            this.data[path] = cov;
        }
    }

    /**
     * returns the coverage summary for all the file coverage objects in this map.
     * @returns {CoverageSummary}
     */
    getCoverageSummary() {
        const ret = new CoverageSummary$2();
        Object.values(this.data).forEach(fc => {
            ret.merge(fc.toSummary());
        });

        return ret;
    }
}

var coverageMap = {
    CoverageMap
};

/**
 * istanbul-lib-coverage exports an API that allows you to create and manipulate
 * file coverage, coverage maps (a set of file coverage objects) and summary
 * coverage objects. File coverage for the same file can be merged as can
 * entire coverage maps.
 *
 * @module Exports
 */
const { FileCoverage: FileCoverage$2 } = fileCoverage;
const { CoverageMap: CoverageMap$1 } = coverageMap;
const { CoverageSummary: CoverageSummary$3 } = coverageSummary;

var istanbulLibCoverage = {
    /**
     * creates a coverage summary object
     * @param {Object} obj an argument with the same semantics
     *  as the one passed to the `CoverageSummary` constructor
     * @returns {CoverageSummary}
     */
    createCoverageSummary(obj) {
        if (obj && obj instanceof CoverageSummary$3) {
            return obj;
        }
        return new CoverageSummary$3(obj);
    },
    /**
     * creates a CoverageMap object
     * @param {Object} obj optional - an argument with the same semantics
     *  as the one passed to the CoverageMap constructor.
     * @returns {CoverageMap}
     */
    createCoverageMap(obj) {
        if (obj && obj instanceof CoverageMap$1) {
            return obj;
        }
        return new CoverageMap$1(obj);
    },
    /**
     * creates a FileCoverage object
     * @param {Object} obj optional - an argument with the same semantics
     *  as the one passed to the FileCoverage constructor.
     * @returns {FileCoverage}
     */
    createFileCoverage(obj) {
        if (obj && obj instanceof FileCoverage$2) {
            return obj;
        }
        return new FileCoverage$2(obj);
    }
};

/** classes exported for reuse */
var classes = {
    /**
     * the file coverage constructor
     */
    FileCoverage: FileCoverage$2
};
istanbulLibCoverage.classes = classes;

let parsePath = path.parse;
let SEP = path.sep;
const origParser = parsePath;
const origSep = SEP;

function makeRelativeNormalizedPath(str, sep) {
    const parsed = parsePath(str);
    let root = parsed.root;
    let dir;
    let file = parsed.base;
    let quoted;
    let pos;

    // handle a weird windows case separately
    if (sep === '\\') {
        pos = root.indexOf(':\\');
        if (pos >= 0) {
            root = root.substring(0, pos + 2);
        }
    }
    dir = parsed.dir.substring(root.length);

    if (str === '') {
        return [];
    }

    if (sep !== '/') {
        quoted = new RegExp(sep.replace(/\W/g, '\\$&'), 'g');
        dir = dir.replace(quoted, '/');
        file = file.replace(quoted, '/'); // excessively paranoid?
    }

    if (dir !== '') {
        dir = `${dir}/${file}`;
    } else {
        dir = file;
    }
    if (dir.substring(0, 1) === '/') {
        dir = dir.substring(1);
    }
    dir = dir.split(/\/+/);
    return dir;
}

class Path {
    constructor(strOrArray) {
        if (Array.isArray(strOrArray)) {
            this.v = strOrArray;
        } else if (typeof strOrArray === 'string') {
            this.v = makeRelativeNormalizedPath(strOrArray, SEP);
        } else {
            throw new Error(
                `Invalid Path argument must be string or array:${strOrArray}`
            );
        }
    }

    toString() {
        return this.v.join('/');
    }

    hasParent() {
        return this.v.length > 0;
    }

    parent() {
        if (!this.hasParent()) {
            throw new Error('Unable to get parent for 0 elem path');
        }
        const p = this.v.slice();
        p.pop();
        return new Path(p);
    }

    elements() {
        return this.v.slice();
    }

    name() {
        return this.v.slice(-1)[0];
    }

    contains(other) {
        let i;
        if (other.length > this.length) {
            return false;
        }
        for (i = 0; i < other.length; i += 1) {
            if (this.v[i] !== other.v[i]) {
                return false;
            }
        }
        return true;
    }

    ancestorOf(other) {
        return other.contains(this) && other.length !== this.length;
    }

    descendantOf(other) {
        return this.contains(other) && other.length !== this.length;
    }

    commonPrefixPath(other) {
        const len = this.length > other.length ? other.length : this.length;
        let i;
        const ret = [];

        for (i = 0; i < len; i += 1) {
            if (this.v[i] === other.v[i]) {
                ret.push(this.v[i]);
            } else {
                break;
            }
        }
        return new Path(ret);
    }

    static compare(a, b) {
        const al = a.length;
        const bl = b.length;

        if (al < bl) {
            return -1;
        }

        if (al > bl) {
            return 1;
        }

        const astr = a.toString();
        const bstr = b.toString();
        return astr < bstr ? -1 : astr > bstr ? 1 : 0;
    }
}

['push', 'pop', 'shift', 'unshift', 'splice'].forEach(fn => {
    Object.defineProperty(Path.prototype, fn, {
        value(...args) {
            return this.v[fn](...args);
        }
    });
});

Object.defineProperty(Path.prototype, 'length', {
    enumerable: true,
    get() {
        return this.v.length;
    }
});

var path_1 = Path;
Path.tester = {
    setParserAndSep(p, sep) {
        parsePath = p;
        SEP = sep;
    },
    reset() {
        parsePath = origParser;
        SEP = origSep;
    }
};

const { BaseNode: BaseNode$1, BaseTree: BaseTree$1 } = tree;

class ReportNode extends BaseNode$1 {
    constructor(path, fileCoverage) {
        super();

        this.path = path;
        this.parent = null;
        this.fileCoverage = fileCoverage;
        this.children = [];
    }

    static createRoot(children) {
        const root = new ReportNode(new path_1([]));

        children.forEach(child => {
            root.addChild(child);
        });

        return root;
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    asRelative(p) {
        if (p.substring(0, 1) === '/') {
            return p.substring(1);
        }
        return p;
    }

    getQualifiedName() {
        return this.asRelative(this.path.toString());
    }

    getRelativeName() {
        const parent = this.getParent();
        const myPath = this.path;
        let relPath;
        let i;
        const parentPath = parent ? parent.path : new path_1([]);
        if (parentPath.ancestorOf(myPath)) {
            relPath = new path_1(myPath.elements());
            for (i = 0; i < parentPath.length; i += 1) {
                relPath.shift();
            }
            return this.asRelative(relPath.toString());
        }
        return this.asRelative(this.path.toString());
    }

    getParent() {
        return this.parent;
    }

    getChildren() {
        return this.children;
    }

    isSummary() {
        return !this.fileCoverage;
    }

    getFileCoverage() {
        return this.fileCoverage;
    }

    getCoverageSummary(filesOnly) {
        const cacheProp = `c_${filesOnly ? 'files' : 'full'}`;
        let summary;

        if (Object.prototype.hasOwnProperty.call(this, cacheProp)) {
            return this[cacheProp];
        }

        if (!this.isSummary()) {
            summary = this.getFileCoverage().toSummary();
        } else {
            let count = 0;
            summary = istanbulLibCoverage.createCoverageSummary();
            this.getChildren().forEach(child => {
                if (filesOnly && child.isSummary()) {
                    return;
                }
                count += 1;
                summary.merge(child.getCoverageSummary(filesOnly));
            });
            if (count === 0 && filesOnly) {
                summary = null;
            }
        }
        this[cacheProp] = summary;
        return summary;
    }
}

class ReportTree extends BaseTree$1 {
    constructor(root, childPrefix) {
        super(root);

        const maybePrefix = node => {
            if (childPrefix && !node.isRoot()) {
                node.path.unshift(childPrefix);
            }
        };
        this.visit({
            onDetail: maybePrefix,
            onSummary(node) {
                maybePrefix(node);
                node.children.sort((a, b) => {
                    const astr = a.path.toString();
                    const bstr = b.path.toString();
                    return astr < bstr
                        ? -1
                        : astr > bstr
                        ? 1
                        : /* istanbul ignore next */ 0;
                });
            }
        });
    }
}

function findCommonParent(paths) {
    return paths.reduce(
        (common, path) => common.commonPrefixPath(path),
        paths[0] || new path_1([])
    );
}

function findOrCreateParent(parentPath, nodeMap, created = () => {}) {
    let parent = nodeMap[parentPath.toString()];

    if (!parent) {
        parent = new ReportNode(parentPath);
        nodeMap[parentPath.toString()] = parent;
        created(parentPath, parent);
    }

    return parent;
}

function toDirParents(list) {
    const nodeMap = Object.create(null);
    list.forEach(o => {
        const parent = findOrCreateParent(o.path.parent(), nodeMap);
        parent.addChild(new ReportNode(o.path, o.fileCoverage));
    });

    return Object.values(nodeMap);
}

function addAllPaths(topPaths, nodeMap, path, node) {
    const parent = findOrCreateParent(
        path.parent(),
        nodeMap,
        (parentPath, parent) => {
            if (parentPath.hasParent()) {
                addAllPaths(topPaths, nodeMap, parentPath, parent);
            } else {
                topPaths.push(parent);
            }
        }
    );

    parent.addChild(node);
}

function foldIntoOneDir(node, parent) {
    const { children } = node;
    if (children.length === 1 && !children[0].fileCoverage) {
        children[0].parent = parent;
        return foldIntoOneDir(children[0], parent);
    }
    node.children = children.map(child => foldIntoOneDir(child, node));
    return node;
}

function pkgSummaryPrefix(dirParents, commonParent) {
    if (!dirParents.some(dp => dp.path.length === 0)) {
        return;
    }

    if (commonParent.length === 0) {
        return 'root';
    }

    return commonParent.name();
}

class SummarizerFactory {
    constructor(coverageMap, defaultSummarizer = 'pkg') {
        this._coverageMap = coverageMap;
        this._defaultSummarizer = defaultSummarizer;
        this._initialList = coverageMap.files().map(filePath => ({
            filePath,
            path: new path_1(filePath),
            fileCoverage: coverageMap.fileCoverageFor(filePath)
        }));
        this._commonParent = findCommonParent(
            this._initialList.map(o => o.path.parent())
        );
        if (this._commonParent.length > 0) {
            this._initialList.forEach(o => {
                o.path.splice(0, this._commonParent.length);
            });
        }
    }

    get defaultSummarizer() {
        return this[this._defaultSummarizer];
    }

    get flat() {
        if (!this._flat) {
            this._flat = new ReportTree(
                ReportNode.createRoot(
                    this._initialList.map(
                        node => new ReportNode(node.path, node.fileCoverage)
                    )
                )
            );
        }

        return this._flat;
    }

    _createPkg() {
        const dirParents = toDirParents(this._initialList);
        if (dirParents.length === 1) {
            return new ReportTree(dirParents[0]);
        }

        return new ReportTree(
            ReportNode.createRoot(dirParents),
            pkgSummaryPrefix(dirParents, this._commonParent)
        );
    }

    get pkg() {
        if (!this._pkg) {
            this._pkg = this._createPkg();
        }

        return this._pkg;
    }

    _createNested() {
        const nodeMap = Object.create(null);
        const topPaths = [];
        this._initialList.forEach(o => {
            const node = new ReportNode(o.path, o.fileCoverage);
            addAllPaths(topPaths, nodeMap, o.path, node);
        });

        const topNodes = topPaths.map(node => foldIntoOneDir(node));
        if (topNodes.length === 1) {
            return new ReportTree(topNodes[0]);
        }

        return new ReportTree(ReportNode.createRoot(topNodes));
    }

    get nested() {
        if (!this._nested) {
            this._nested = this._createNested();
        }

        return this._nested;
    }
}

var summarizerFactory = SummarizerFactory;

/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */







function defaultSourceLookup(path) {
    try {
        return fs.readFileSync(path, 'utf8');
    } catch (ex) {
        throw new Error(`Unable to lookup source: ${path} (${ex.message})`);
    }
}

function normalizeWatermarks(specified = {}) {
    Object.entries(watermarks.getDefault()).forEach(([k, value]) => {
        const specValue = specified[k];
        if (!Array.isArray(specValue) || specValue.length !== 2) {
            specified[k] = value;
        }
    });

    return specified;
}

/**
 * A reporting context that is passed to report implementations
 * @param {Object} [opts=null] opts options
 * @param {String} [opts.dir='coverage'] opts.dir the reporting directory
 * @param {Object} [opts.watermarks=null] opts.watermarks watermarks for
 *  statements, lines, branches and functions
 * @param {Function} [opts.sourceFinder=fsLookup] opts.sourceFinder a
 *  function that returns source code given a file path. Defaults to
 *  filesystem lookups based on path.
 * @constructor
 */
class Context {
    constructor(opts) {
        this.dir = opts.dir || 'coverage';
        this.watermarks = normalizeWatermarks(opts.watermarks);
        this.sourceFinder = opts.sourceFinder || defaultSourceLookup;
        this._summarizerFactory = new summarizerFactory(
            opts.coverageMap,
            opts.defaultSummarizer
        );
        this.data = {};
    }

    /**
     * returns a FileWriter implementation for reporting use. Also available
     * as the `writer` property on the context.
     * @returns {Writer}
     */
    getWriter() {
        return this.writer;
    }

    /**
     * returns the source code for the specified file path or throws if
     * the source could not be found.
     * @param {String} filePath the file path as found in a file coverage object
     * @returns {String} the source code
     */
    getSource(filePath) {
        return this.sourceFinder(filePath);
    }

    /**
     * returns the coverage class given a coverage
     * types and a percentage value.
     * @param {String} type - the coverage type, one of `statements`, `functions`,
     *  `branches`, or `lines`
     * @param {Number} value - the percentage value
     * @returns {String} one of `high`, `medium` or `low`
     */
    classForPercent(type, value) {
        const watermarks = this.watermarks[type];
        if (!watermarks) {
            return 'unknown';
        }
        if (value < watermarks[0]) {
            return 'low';
        }
        if (value >= watermarks[1]) {
            return 'high';
        }
        return 'medium';
    }

    /**
     * returns an XML writer for the supplied content writer
     * @param {ContentWriter} contentWriter the content writer to which the returned XML writer
     *  writes data
     * @returns {XMLWriter}
     */
    getXMLWriter(contentWriter) {
        return new xmlWriter(contentWriter);
    }

    /**
     * returns a full visitor given a partial one.
     * @param {Object} partialVisitor a partial visitor only having the functions of
     *  interest to the caller. These functions are called with a scope that is the
     *  supplied object.
     * @returns {Visitor}
     */
    getVisitor(partialVisitor) {
        return new tree.Visitor(partialVisitor);
    }

    getTree(name = 'defaultSummarizer') {
        return this._summarizerFactory[name];
    }
}

Object.defineProperty(Context.prototype, 'writer', {
    enumerable: true,
    get() {
        if (!this.data.writer) {
            this.data.writer = new fileWriter(this.dir);
        }
        return this.data.writer;
    }
});
