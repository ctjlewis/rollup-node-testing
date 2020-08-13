import path from 'path';
import fs from 'fs';

const debug = (
  typeof process === 'object' &&
  process.env &&
  process.env.NODE_DEBUG &&
  /\bsemver\b/i.test(process.env.NODE_DEBUG)
) ? (...args) => console.error('SEMVER', ...args)
  : () => {};

var debug_1 = debug;

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
const SEMVER_SPEC_VERSION = '2.0.0';

const MAX_LENGTH = 256;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER ||
  /* istanbul ignore next */ 9007199254740991;

// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16;

var constants = {
  SEMVER_SPEC_VERSION,
  MAX_LENGTH,
  MAX_SAFE_INTEGER,
  MAX_SAFE_COMPONENT_LENGTH
};

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

var re_1 = createCommonjsModule(function (module, exports) {
const { MAX_SAFE_COMPONENT_LENGTH } = constants;

exports = module.exports = {};

// The actual regexps go on exports.re
const re = exports.re = [];
const src = exports.src = [];
const t = exports.t = {};
let R = 0;

const createToken = (name, value, isGlobal) => {
  const index = R++;
  debug_1(index, value);
  t[name] = index;
  src[index] = value;
  re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
};

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
createToken('NUMERICIDENTIFIERLOOSE', '[0-9]+');

// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

createToken('NONNUMERICIDENTIFIER', '\\d*[a-zA-Z-][a-zA-Z0-9-]*');

// ## Main Version
// Three dot-separated numeric identifiers.

createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
                   `(${src[t.NUMERICIDENTIFIER]})`);

createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`);

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NUMERICIDENTIFIER]
}|${src[t.NONNUMERICIDENTIFIER]})`);

createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NUMERICIDENTIFIERLOOSE]
}|${src[t.NONNUMERICIDENTIFIER]})`);

// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);

createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

createToken('BUILDIDENTIFIER', '[0-9A-Za-z-]+');

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);

// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
}${src[t.PRERELEASE]}?${
  src[t.BUILD]}?`);

createToken('FULL', `^${src[t.FULLPLAIN]}$`);

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
}${src[t.PRERELEASELOOSE]}?${
  src[t.BUILD]}?`);

createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);

createToken('GTLT', '((?:<|>)?=?)');

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);

createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
                   `(?:${src[t.PRERELEASE]})?${
                     src[t.BUILD]}?` +
                   `)?)?`);

createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
                        `(?:${src[t.PRERELEASELOOSE]})?${
                          src[t.BUILD]}?` +
                        `)?)?`);

createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);

// Coercion.
// Extract anything that could conceivably be a part of a valid semver
createToken('COERCE', `${'(^|[^\\d])' +
              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
              `(?:$|[^\\d])`);
createToken('COERCERTL', src[t.COERCE], true);

// Tilde ranges.
// Meaning is "reasonably at or greater than"
createToken('LONETILDE', '(?:~>?)');

createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
exports.tildeTrimReplace = '$1~';

createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);

// Caret ranges.
// Meaning is "at least and backwards compatible with"
createToken('LONECARET', '(?:\\^)');

createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
exports.caretTrimReplace = '$1^';

createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);

// A simple gt/lt/eq thing, or just "" to indicate "any version"
createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);

// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
exports.comparatorTrimReplace = '$1$2$3';

// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
                   `\\s+-\\s+` +
                   `(${src[t.XRANGEPLAIN]})` +
                   `\\s*$`);

createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
                        `\\s+-\\s+` +
                        `(${src[t.XRANGEPLAINLOOSE]})` +
                        `\\s*$`);

// Star ranges basically just allow anything at all.
createToken('STAR', '(<|>)?=?\\s*\\*');
});

const numeric = /^[0-9]+$/;
const compareIdentifiers = (a, b) => {
  const anum = numeric.test(a);
  const bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
};

const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);

var identifiers = {
  compareIdentifiers,
  rcompareIdentifiers
};

const { MAX_LENGTH: MAX_LENGTH$1, MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1 } = constants;
const { re, t } = re_1;

const { compareIdentifiers: compareIdentifiers$1 } = identifiers;
class SemVer {
  constructor (version, options) {
    if (!options || typeof options !== 'object') {
      options = {
        loose: !!options,
        includePrerelease: false
      };
    }
    if (version instanceof SemVer) {
      if (version.loose === !!options.loose &&
          version.includePrerelease === !!options.includePrerelease) {
        return version
      } else {
        version = version.version;
      }
    } else if (typeof version !== 'string') {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    if (version.length > MAX_LENGTH$1) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH$1} characters`
      )
    }

    debug_1('SemVer', version, options);
    this.options = options;
    this.loose = !!options.loose;
    // this isn't actually relevant for versions, but keep it so that we
    // don't run into trouble passing this.options around.
    this.includePrerelease = !!options.includePrerelease;

    const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);

    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    this.raw = version;

    // these are actually numbers
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];

    if (this.major > MAX_SAFE_INTEGER$1 || this.major < 0) {
      throw new TypeError('Invalid major version')
    }

    if (this.minor > MAX_SAFE_INTEGER$1 || this.minor < 0) {
      throw new TypeError('Invalid minor version')
    }

    if (this.patch > MAX_SAFE_INTEGER$1 || this.patch < 0) {
      throw new TypeError('Invalid patch version')
    }

    // numberify any prerelease numeric ids
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split('.').map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER$1) {
            return num
          }
        }
        return id
      });
    }

    this.build = m[5] ? m[5].split('.') : [];
    this.format();
  }

  format () {
    this.version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join('.')}`;
    }
    return this.version
  }

  toString () {
    return this.version
  }

  compare (other) {
    debug_1('SemVer.compare', this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === 'string' && other === this.version) {
        return 0
      }
      other = new SemVer(other, this.options);
    }

    if (other.version === this.version) {
      return 0
    }

    return this.compareMain(other) || this.comparePre(other)
  }

  compareMain (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    return (
      compareIdentifiers$1(this.major, other.major) ||
      compareIdentifiers$1(this.minor, other.minor) ||
      compareIdentifiers$1(this.patch, other.patch)
    )
  }

  comparePre (other) {
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

    let i = 0;
    do {
      const a = this.prerelease[i];
      const b = other.prerelease[i];
      debug_1('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers$1(a, b)
      }
    } while (++i)
  }

  compareBuild (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    let i = 0;
    do {
      const a = this.build[i];
      const b = other.build[i];
      debug_1('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers$1(a, b)
      }
    } while (++i)
  }

  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc (release, identifier) {
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
        if (
          this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0
        ) {
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
      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
      case 'pre':
        if (this.prerelease.length === 0) {
          this.prerelease = [0];
        } else {
          let i = this.prerelease.length;
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
        throw new Error(`invalid increment argument: ${release}`)
    }
    this.format();
    this.raw = this.version;
    return this
  }
}

var semver = SemVer;

const compare = (a, b, loose) =>
  new semver(a, loose).compare(new semver(b, loose));

var compare_1 = compare;

const eq = (a, b, loose) => compare_1(a, b, loose) === 0;
var eq_1 = eq;

const neq = (a, b, loose) => compare_1(a, b, loose) !== 0;
var neq_1 = neq;

const gt = (a, b, loose) => compare_1(a, b, loose) > 0;
var gt_1 = gt;

const gte = (a, b, loose) => compare_1(a, b, loose) >= 0;
var gte_1 = gte;

const lt = (a, b, loose) => compare_1(a, b, loose) < 0;
var lt_1 = lt;

const lte = (a, b, loose) => compare_1(a, b, loose) <= 0;
var lte_1 = lte;

const cmp = (a, op, b, loose) => {
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
      return eq_1(a, b, loose)

    case '!=':
      return neq_1(a, b, loose)

    case '>':
      return gt_1(a, b, loose)

    case '>=':
      return gte_1(a, b, loose)

    case '<':
      return lt_1(a, b, loose)

    case '<=':
      return lte_1(a, b, loose)

    default:
      throw new TypeError(`Invalid operator: ${op}`)
  }
};
var cmp_1 = cmp;

const {MAX_LENGTH: MAX_LENGTH$2} = constants;
const { re: re$1, t: t$1 } = re_1;


const parse = (version, options) => {
  if (!options || typeof options !== 'object') {
    options = {
      loose: !!options,
      includePrerelease: false
    };
  }

  if (version instanceof semver) {
    return version
  }

  if (typeof version !== 'string') {
    return null
  }

  if (version.length > MAX_LENGTH$2) {
    return null
  }

  const r = options.loose ? re$1[t$1.LOOSE] : re$1[t$1.FULL];
  if (!r.test(version)) {
    return null
  }

  try {
    return new semver(version, options)
  } catch (er) {
    return null
  }
};

var parse_1 = parse;

const {re: re$2, t: t$2} = re_1;

const coerce = (version, options) => {
  if (version instanceof semver) {
    return version
  }

  if (typeof version === 'number') {
    version = String(version);
  }

  if (typeof version !== 'string') {
    return null
  }

  options = options || {};

  let match = null;
  if (!options.rtl) {
    match = version.match(re$2[t$2.COERCE]);
  } else {
    // Find the right-most coercible string that does not share
    // a terminus with a more left-ward coercible string.
    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
    //
    // Walk through the string checking with a /g regexp
    // Manually set the index so as to pick up overlapping matches.
    // Stop when we get a match that ends at the string end, since no
    // coercible string can be more right-ward without the same terminus.
    let next;
    while ((next = re$2[t$2.COERCERTL].exec(version)) &&
        (!match || match.index + match[0].length !== version.length)
    ) {
      if (!match ||
            next.index + next[0].length !== match.index + match[0].length) {
        match = next;
      }
      re$2[t$2.COERCERTL].lastIndex = next.index + next[1].length + next[2].length;
    }
    // leave it in a clean state
    re$2[t$2.COERCERTL].lastIndex = -1;
  }

  if (match === null)
    return null

  return parse_1(`${match[2]}.${match[3] || '0'}.${match[4] || '0'}`, options)
};
var coerce_1 = coerce;

const has = Function.call.bind({}.hasOwnProperty);

function compare$1(a, operator, b) {
  return cmp_1(coerce_1(a), operator, coerce_1(b));
}

function intersection(list, order) {
  const set = list instanceof Set ? list : new Set(list);
  return order.filter(name => set.has(name));
}

function sortObjectByKey(object, fn) {
  return Object.keys(object).sort(fn).reduce((memo, key) => {
    memo[key] = object[key];
    return memo;
  }, {});
}

var helpers = {
  compare: compare$1,
  has,
  intersection,
  semver: coerce_1,
  sortObjectByKey,
};

var data = {
	"es.symbol": {
	chrome: "49",
	edge: "15",
	electron: "0.37",
	firefox: "51",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.description": {
	chrome: "70",
	edge: "74",
	electron: "5.0",
	firefox: "63",
	ios: "12.2",
	node: "11.0",
	opera: "57",
	opera_mobile: "49",
	safari: "12.1",
	samsung: "10.0"
},
	"es.symbol.async-iterator": {
	chrome: "63",
	edge: "74",
	electron: "3.0",
	firefox: "55",
	ios: "12.0",
	node: "10.0",
	opera: "50",
	opera_mobile: "46",
	safari: "12.0",
	samsung: "8.0"
},
	"es.symbol.has-instance": {
	chrome: "50",
	edge: "15",
	electron: "1.1",
	firefox: "49",
	ios: "10.0",
	node: "6.0",
	opera: "37",
	opera_mobile: "37",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.is-concat-spreadable": {
	chrome: "48",
	edge: "15",
	electron: "0.37",
	firefox: "48",
	ios: "10.0",
	node: "6.0",
	opera: "35",
	opera_mobile: "35",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.iterator": {
	chrome: "39",
	edge: "13",
	electron: "0.20",
	firefox: "36",
	ios: "9.0",
	node: "1.0",
	opera: "26",
	opera_mobile: "26",
	safari: "9.0",
	samsung: "3.4"
},
	"es.symbol.match": {
	chrome: "50",
	edge: "74",
	electron: "1.1",
	firefox: "40",
	ios: "10.0",
	node: "6.0",
	opera: "37",
	opera_mobile: "37",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.match-all": {
	chrome: "73",
	edge: "74",
	electron: "5.0",
	firefox: "67",
	ios: "13.0",
	node: "12.0",
	opera: "60",
	opera_mobile: "52",
	safari: "13",
	samsung: "11.0"
},
	"es.symbol.replace": {
	chrome: "50",
	edge: "74",
	electron: "1.1",
	firefox: "49",
	ios: "10.0",
	node: "6.0",
	opera: "37",
	opera_mobile: "37",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.search": {
	chrome: "50",
	edge: "74",
	electron: "1.1",
	firefox: "49",
	ios: "10.0",
	node: "6.0",
	opera: "37",
	opera_mobile: "37",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.species": {
	chrome: "51",
	edge: "13",
	electron: "1.2",
	firefox: "41",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.split": {
	chrome: "50",
	edge: "74",
	electron: "1.1",
	firefox: "49",
	ios: "10.0",
	node: "6.0",
	opera: "37",
	opera_mobile: "37",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.to-primitive": {
	chrome: "47",
	edge: "15",
	electron: "0.36",
	firefox: "44",
	ios: "10.0",
	node: "6.0",
	opera: "34",
	opera_mobile: "34",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.to-string-tag": {
	chrome: "49",
	edge: "15",
	electron: "0.37",
	firefox: "51",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.symbol.unscopables": {
	chrome: "39",
	edge: "13",
	electron: "0.20",
	firefox: "48",
	ios: "9.0",
	node: "1.0",
	opera: "26",
	opera_mobile: "26",
	safari: "9.0",
	samsung: "3.4"
},
	"es.array.concat": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "48",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.array.copy-within": {
	chrome: "45",
	edge: "12",
	electron: "0.31",
	firefox: "48",
	ios: "9.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.every": {
	chrome: "48",
	edge: "15",
	electron: "0.37",
	firefox: "50",
	ios: "9.0",
	node: "6.0",
	opera: "35",
	opera_mobile: "35",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.fill": {
	chrome: "45",
	edge: "12",
	electron: "0.31",
	firefox: "48",
	ios: "9.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.filter": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "48",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.array.find": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "48",
	ios: "9.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.find-index": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "48",
	ios: "9.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.flat": {
	chrome: "69",
	edge: "74",
	electron: "4.0",
	firefox: "62",
	ios: "12.0",
	node: "11.0",
	opera: "56",
	opera_mobile: "48",
	safari: "12.0",
	samsung: "10.0"
},
	"es.array.flat-map": {
	chrome: "69",
	edge: "74",
	electron: "4.0",
	firefox: "62",
	ios: "12.0",
	node: "11.0",
	opera: "56",
	opera_mobile: "48",
	safari: "12.0",
	samsung: "10.0"
},
	"es.array.for-each": {
	chrome: "48",
	edge: "15",
	electron: "0.37",
	firefox: "50",
	ios: "9.0",
	node: "6.0",
	opera: "35",
	opera_mobile: "35",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.from": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "53",
	ios: "9.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.includes": {
	chrome: "53",
	edge: "15",
	electron: "1.4",
	firefox: "48",
	ios: "10.0",
	node: "7.0",
	opera: "40",
	opera_mobile: "40",
	safari: "10.0",
	samsung: "6.0"
},
	"es.array.index-of": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "50",
	ios: "11.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "11.0",
	samsung: "5.0"
},
	"es.array.is-array": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "4",
	ie: "9",
	ios: "3.2",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "4.0",
	samsung: "1.0"
},
	"es.array.iterator": {
	chrome: "66",
	edge: "15",
	electron: "3.0",
	firefox: "60",
	ios: "10.0",
	node: "10.0",
	opera: "53",
	opera_mobile: "47",
	safari: "10.0",
	samsung: "9.0"
},
	"es.array.join": {
	android: "4.4",
	chrome: "26",
	edge: "13",
	electron: "0.20",
	firefox: "4",
	ios: "8.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "7.1",
	samsung: "1.5"
},
	"es.array.last-index-of": {
	chrome: "51",
	edge: "13",
	electron: "1.2",
	firefox: "50",
	ios: "11.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "11.0",
	samsung: "5.0"
},
	"es.array.map": {
	chrome: "51",
	edge: "13",
	electron: "1.2",
	firefox: "50",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.array.of": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "25",
	ios: "9.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.reduce": {
	chrome: "48",
	edge: "15",
	electron: "0.37",
	firefox: "50",
	ios: "9.0",
	node: "6.0",
	opera: "35",
	opera_mobile: "35",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.reduce-right": {
	chrome: "48",
	edge: "15",
	electron: "0.37",
	firefox: "50",
	ios: "9.0",
	node: "6.0",
	opera: "35",
	opera_mobile: "35",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.reverse": {
	android: "3.0",
	chrome: "1",
	edge: "12",
	electron: "0.20",
	firefox: "1",
	ie: "5.5",
	ios: "12.2",
	node: "0.0.3",
	opera: "10.50",
	opera_mobile: "10.50",
	safari: "12.0.2",
	samsung: "1.0"
},
	"es.array.slice": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "48",
	ios: "11.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "11.0",
	samsung: "5.0"
},
	"es.array.some": {
	chrome: "48",
	edge: "15",
	electron: "0.37",
	firefox: "50",
	ios: "9.0",
	node: "6.0",
	opera: "35",
	opera_mobile: "35",
	safari: "9.0",
	samsung: "5.0"
},
	"es.array.sort": {
	chrome: "63",
	edge: "12",
	electron: "3.0",
	firefox: "4",
	ie: "9",
	ios: "12.0",
	node: "10.0",
	opera: "50",
	opera_mobile: "46",
	safari: "12.0",
	samsung: "8.0"
},
	"es.array.species": {
	chrome: "51",
	edge: "13",
	electron: "1.2",
	firefox: "48",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.array.splice": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "49",
	ios: "11.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "11.0",
	samsung: "5.0"
},
	"es.array.unscopables.flat": {
	chrome: "73",
	edge: "74",
	electron: "5.0",
	firefox: "67",
	ios: "13.0",
	node: "12.0",
	opera: "60",
	opera_mobile: "52",
	safari: "13",
	samsung: "11.0"
},
	"es.array.unscopables.flat-map": {
	chrome: "73",
	edge: "74",
	electron: "5.0",
	firefox: "67",
	ios: "13.0",
	node: "12.0",
	opera: "60",
	opera_mobile: "52",
	safari: "13",
	samsung: "11.0"
},
	"es.array-buffer.constructor": {
	android: "4.4",
	chrome: "26",
	edge: "14",
	electron: "0.20",
	firefox: "44",
	ios: "12.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "12.0",
	samsung: "1.5"
},
	"es.array-buffer.is-view": {
	android: "4.4.3",
	chrome: "32",
	edge: "12",
	electron: "0.20",
	firefox: "29",
	ie: "11",
	ios: "8.0",
	node: "0.11.9",
	opera: "19",
	opera_mobile: "19",
	safari: "7.1",
	samsung: "2.0"
},
	"es.array-buffer.slice": {
	android: "4.4.3",
	chrome: "31",
	edge: "12",
	electron: "0.20",
	firefox: "46",
	ie: "11",
	ios: "12.2",
	node: "0.11.8",
	opera: "18",
	opera_mobile: "18",
	safari: "12.1",
	samsung: "2.0"
},
	"es.data-view": {
	android: "4.4",
	chrome: "26",
	edge: "12",
	electron: "0.20",
	firefox: "15",
	ie: "10",
	ios: "8.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "7.1",
	samsung: "1.5"
},
	"es.date.now": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ie: "9",
	ios: "3.2",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "4.0",
	samsung: "1.0"
},
	"es.date.to-iso-string": {
	android: "4.4",
	chrome: "26",
	edge: "12",
	electron: "0.20",
	firefox: "7",
	ie: "9",
	ios: "8.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "7.1",
	samsung: "1.5"
},
	"es.date.to-json": {
	android: "4.4",
	chrome: "26",
	edge: "12",
	electron: "0.20",
	firefox: "4",
	ie: "9",
	ios: "10.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "10.0",
	samsung: "1.5"
},
	"es.date.to-primitive": {
	chrome: "47",
	edge: "15",
	electron: "0.36",
	firefox: "44",
	ios: "10.0",
	node: "6.0",
	opera: "34",
	opera_mobile: "34",
	safari: "10.0",
	samsung: "5.0"
},
	"es.date.to-string": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ie: "9",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.function.bind": {
	android: "3.0",
	chrome: "7",
	edge: "12",
	electron: "0.20",
	firefox: "4",
	ie: "9",
	ios: "5.1",
	node: "0.1.101",
	opera: "12",
	opera_mobile: "12",
	phantom: "2.0",
	safari: "5.1",
	samsung: "1.0"
},
	"es.function.has-instance": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "50",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.function.name": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "3.2",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "4.0",
	samsung: "1.0"
},
	"es.global-this": {
	chrome: "71",
	edge: "74",
	electron: "5.0",
	firefox: "65",
	ios: "12.2",
	node: "12.0",
	opera: "58",
	opera_mobile: "50",
	safari: "12.1",
	samsung: "10.0"
},
	"es.json.stringify": {
	chrome: "72",
	edge: "74",
	electron: "5.0",
	firefox: "64",
	ios: "12.2",
	node: "12.0",
	opera: "59",
	opera_mobile: "51",
	safari: "12.1",
	samsung: "11.0"
},
	"es.json.to-string-tag": {
	chrome: "50",
	edge: "15",
	electron: "1.1",
	firefox: "51",
	ios: "10.0",
	node: "6.0",
	opera: "37",
	opera_mobile: "37",
	safari: "10.0",
	samsung: "5.0"
},
	"es.map": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "53",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.math.acosh": {
	chrome: "54",
	edge: "13",
	electron: "1.4",
	firefox: "25",
	ios: "8.0",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	safari: "7.1",
	samsung: "6.0"
},
	"es.math.asinh": {
	chrome: "38",
	edge: "13",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "7.1",
	samsung: "3.0"
},
	"es.math.atanh": {
	chrome: "38",
	edge: "13",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "7.1",
	samsung: "3.0"
},
	"es.math.cbrt": {
	chrome: "38",
	edge: "12",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "7.1",
	samsung: "3.0"
},
	"es.math.clz32": {
	chrome: "38",
	edge: "12",
	electron: "0.20",
	firefox: "31",
	ios: "9.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "9.0",
	samsung: "3.0"
},
	"es.math.cosh": {
	chrome: "39",
	edge: "13",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "1.0",
	opera: "26",
	opera_mobile: "26",
	safari: "7.1",
	samsung: "3.4"
},
	"es.math.expm1": {
	chrome: "39",
	edge: "13",
	electron: "0.20",
	firefox: "46",
	ios: "8.0",
	node: "1.0",
	opera: "26",
	opera_mobile: "26",
	safari: "7.1",
	samsung: "3.4"
},
	"es.math.fround": {
	chrome: "38",
	edge: "12",
	electron: "0.20",
	firefox: "26",
	ios: "8.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "7.1",
	samsung: "3.0"
},
	"es.math.hypot": {
	chrome: "78",
	edge: "12",
	electron: "7.0",
	firefox: "27",
	ios: "8.0",
	node: "13.0",
	opera: "65",
	safari: "7.1"
},
	"es.math.imul": {
	android: "4.4",
	chrome: "28",
	edge: "13",
	electron: "0.20",
	firefox: "20",
	ios: "9.0",
	node: "0.11.1",
	opera: "16",
	opera_mobile: "16",
	safari: "9.0",
	samsung: "1.5"
},
	"es.math.log10": {
	chrome: "38",
	edge: "12",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "7.1",
	samsung: "3.0"
},
	"es.math.log1p": {
	chrome: "38",
	edge: "12",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "7.1",
	samsung: "3.0"
},
	"es.math.log2": {
	chrome: "38",
	edge: "12",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "7.1",
	samsung: "3.0"
},
	"es.math.sign": {
	chrome: "38",
	edge: "12",
	electron: "0.20",
	firefox: "25",
	ios: "9.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "9.0",
	samsung: "3.0"
},
	"es.math.sinh": {
	chrome: "39",
	edge: "13",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "1.0",
	opera: "26",
	opera_mobile: "26",
	safari: "7.1",
	samsung: "3.4"
},
	"es.math.tanh": {
	chrome: "38",
	edge: "12",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "7.1",
	samsung: "3.0"
},
	"es.math.to-string-tag": {
	chrome: "50",
	edge: "15",
	electron: "1.1",
	firefox: "51",
	ios: "10.0",
	node: "6.0",
	opera: "37",
	opera_mobile: "37",
	safari: "10.0",
	samsung: "5.0"
},
	"es.math.trunc": {
	chrome: "38",
	edge: "12",
	electron: "0.20",
	firefox: "25",
	ios: "8.0",
	node: "0.11.15",
	opera: "25",
	opera_mobile: "25",
	safari: "7.1",
	samsung: "3.0"
},
	"es.number.constructor": {
	chrome: "41",
	edge: "13",
	electron: "0.21",
	firefox: "46",
	ios: "9.0",
	node: "1.0",
	opera: "28",
	opera_mobile: "28",
	safari: "9.0",
	samsung: "3.4"
},
	"es.number.epsilon": {
	chrome: "34",
	edge: "12",
	electron: "0.20",
	firefox: "25",
	ios: "9.0",
	node: "0.11.13",
	opera: "21",
	opera_mobile: "21",
	safari: "9.0",
	samsung: "2.0"
},
	"es.number.is-finite": {
	android: "4.1",
	chrome: "19",
	edge: "12",
	electron: "0.20",
	firefox: "16",
	ios: "9.0",
	node: "0.7.3",
	opera: "15",
	opera_mobile: "15",
	safari: "9.0",
	samsung: "1.5"
},
	"es.number.is-integer": {
	chrome: "34",
	edge: "12",
	electron: "0.20",
	firefox: "16",
	ios: "9.0",
	node: "0.11.13",
	opera: "21",
	opera_mobile: "21",
	safari: "9.0",
	samsung: "2.0"
},
	"es.number.is-nan": {
	android: "4.1",
	chrome: "19",
	edge: "12",
	electron: "0.20",
	firefox: "15",
	ios: "9.0",
	node: "0.7.3",
	opera: "15",
	opera_mobile: "15",
	safari: "9.0",
	samsung: "1.5"
},
	"es.number.is-safe-integer": {
	chrome: "34",
	edge: "12",
	electron: "0.20",
	firefox: "32",
	ios: "9.0",
	node: "0.11.13",
	opera: "21",
	opera_mobile: "21",
	safari: "9.0",
	samsung: "2.0"
},
	"es.number.max-safe-integer": {
	chrome: "34",
	edge: "12",
	electron: "0.20",
	firefox: "31",
	ios: "9.0",
	node: "0.11.13",
	opera: "21",
	opera_mobile: "21",
	safari: "9.0",
	samsung: "2.0"
},
	"es.number.min-safe-integer": {
	chrome: "34",
	edge: "12",
	electron: "0.20",
	firefox: "31",
	ios: "9.0",
	node: "0.11.13",
	opera: "21",
	opera_mobile: "21",
	safari: "9.0",
	samsung: "2.0"
},
	"es.number.parse-float": {
	chrome: "35",
	edge: "13",
	electron: "0.20",
	firefox: "39",
	ios: "11.0",
	node: "0.11.13",
	opera: "22",
	opera_mobile: "22",
	safari: "11.0",
	samsung: "3.0"
},
	"es.number.parse-int": {
	chrome: "35",
	edge: "13",
	electron: "0.20",
	firefox: "39",
	ios: "9.0",
	node: "0.11.13",
	opera: "22",
	opera_mobile: "22",
	safari: "9.0",
	samsung: "3.0"
},
	"es.number.to-fixed": {
	android: "4.4",
	chrome: "26",
	edge: "74",
	electron: "0.20",
	firefox: "4",
	ios: "8.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "7.1",
	samsung: "1.5"
},
	"es.number.to-precision": {
	android: "4.4",
	chrome: "26",
	edge: "12",
	electron: "0.20",
	firefox: "4",
	ie: "8",
	ios: "8.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "7.1",
	samsung: "1.5"
},
	"es.object.assign": {
	chrome: "49",
	edge: "74",
	electron: "0.37",
	firefox: "36",
	ios: "9.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "9.0",
	samsung: "5.0"
},
	"es.object.create": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "4",
	ie: "9",
	ios: "3.2",
	node: "0.1.27",
	opera: "12",
	opera_mobile: "12",
	phantom: "1.9",
	safari: "4.0",
	samsung: "1.0"
},
	"es.object.define-getter": {
	chrome: "62",
	edge: "16",
	electron: "3.0",
	firefox: "48",
	ios: "8.0",
	node: "8.10",
	opera: "49",
	opera_mobile: "46",
	safari: "7.1",
	samsung: "8.0"
},
	"es.object.define-properties": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "4",
	ie: "9",
	ios: "5.1",
	node: "0.1.27",
	opera: "12",
	opera_mobile: "12",
	phantom: "2.0",
	safari: "5.1",
	samsung: "1.0"
},
	"es.object.define-property": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "4",
	ie: "9",
	ios: "5.1",
	node: "0.1.27",
	opera: "12",
	opera_mobile: "12",
	phantom: "2.0",
	safari: "5.1",
	samsung: "1.0"
},
	"es.object.define-setter": {
	chrome: "62",
	edge: "16",
	electron: "3.0",
	firefox: "48",
	ios: "8.0",
	node: "8.10",
	opera: "49",
	opera_mobile: "46",
	safari: "7.1",
	samsung: "8.0"
},
	"es.object.entries": {
	chrome: "54",
	edge: "14",
	electron: "1.4",
	firefox: "47",
	ios: "10.3",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	safari: "10.1",
	samsung: "6.0"
},
	"es.object.freeze": {
	chrome: "44",
	edge: "13",
	electron: "0.30",
	firefox: "35",
	ios: "9.0",
	node: "3.0",
	opera: "31",
	opera_mobile: "31",
	safari: "9.0",
	samsung: "4.0"
},
	"es.object.from-entries": {
	chrome: "73",
	edge: "74",
	electron: "5.0",
	firefox: "63",
	ios: "12.2",
	node: "12.0",
	opera: "60",
	opera_mobile: "52",
	safari: "12.1",
	samsung: "11.0"
},
	"es.object.get-own-property-descriptor": {
	chrome: "44",
	edge: "13",
	electron: "0.30",
	firefox: "35",
	ios: "9.0",
	node: "3.0",
	opera: "31",
	opera_mobile: "31",
	safari: "9.0",
	samsung: "4.0"
},
	"es.object.get-own-property-descriptors": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "50",
	ios: "10.0",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	safari: "10.0",
	samsung: "6.0"
},
	"es.object.get-own-property-names": {
	chrome: "40",
	edge: "13",
	electron: "0.21",
	firefox: "34",
	ios: "9.0",
	node: "1.0",
	opera: "27",
	opera_mobile: "27",
	safari: "9.0",
	samsung: "3.4"
},
	"es.object.get-prototype-of": {
	chrome: "44",
	edge: "13",
	electron: "0.30",
	firefox: "35",
	ios: "9.0",
	node: "3.0",
	opera: "31",
	opera_mobile: "31",
	safari: "9.0",
	samsung: "4.0"
},
	"es.object.is": {
	android: "4.1",
	chrome: "19",
	edge: "12",
	electron: "0.20",
	firefox: "22",
	ios: "9.0",
	node: "0.7.3",
	opera: "15",
	opera_mobile: "15",
	safari: "9.0",
	samsung: "1.5"
},
	"es.object.is-extensible": {
	chrome: "44",
	edge: "13",
	electron: "0.30",
	firefox: "35",
	ios: "9.0",
	node: "3.0",
	opera: "31",
	opera_mobile: "31",
	safari: "9.0",
	samsung: "4.0"
},
	"es.object.is-frozen": {
	chrome: "44",
	edge: "13",
	electron: "0.30",
	firefox: "35",
	ios: "9.0",
	node: "3.0",
	opera: "31",
	opera_mobile: "31",
	safari: "9.0",
	samsung: "4.0"
},
	"es.object.is-sealed": {
	chrome: "44",
	edge: "13",
	electron: "0.30",
	firefox: "35",
	ios: "9.0",
	node: "3.0",
	opera: "31",
	opera_mobile: "31",
	safari: "9.0",
	samsung: "4.0"
},
	"es.object.keys": {
	chrome: "40",
	edge: "13",
	electron: "0.21",
	firefox: "35",
	ios: "9.0",
	node: "1.0",
	opera: "27",
	opera_mobile: "27",
	safari: "9.0",
	samsung: "3.4"
},
	"es.object.lookup-getter": {
	chrome: "62",
	edge: "16",
	electron: "3.0",
	firefox: "48",
	ios: "8.0",
	node: "8.10",
	opera: "49",
	opera_mobile: "46",
	safari: "7.1",
	samsung: "8.0"
},
	"es.object.lookup-setter": {
	chrome: "62",
	edge: "16",
	electron: "3.0",
	firefox: "48",
	ios: "8.0",
	node: "8.10",
	opera: "49",
	opera_mobile: "46",
	safari: "7.1",
	samsung: "8.0"
},
	"es.object.prevent-extensions": {
	chrome: "44",
	edge: "13",
	electron: "0.30",
	firefox: "35",
	ios: "9.0",
	node: "3.0",
	opera: "31",
	opera_mobile: "31",
	safari: "9.0",
	samsung: "4.0"
},
	"es.object.seal": {
	chrome: "44",
	edge: "13",
	electron: "0.30",
	firefox: "35",
	ios: "9.0",
	node: "3.0",
	opera: "31",
	opera_mobile: "31",
	safari: "9.0",
	samsung: "4.0"
},
	"es.object.set-prototype-of": {
	chrome: "34",
	edge: "12",
	electron: "0.20",
	firefox: "31",
	ie: "11",
	ios: "9.0",
	node: "0.11.13",
	opera: "21",
	opera_mobile: "21",
	safari: "9.0",
	samsung: "2.0"
},
	"es.object.to-string": {
	chrome: "49",
	edge: "15",
	electron: "0.37",
	firefox: "51",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.object.values": {
	chrome: "54",
	edge: "14",
	electron: "1.4",
	firefox: "47",
	ios: "10.3",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	safari: "10.1",
	samsung: "6.0"
},
	"es.parse-float": {
	chrome: "35",
	edge: "12",
	electron: "0.20",
	firefox: "8",
	ie: "8",
	ios: "8.0",
	node: "0.11.13",
	opera: "22",
	opera_mobile: "22",
	safari: "7.1",
	samsung: "3.0"
},
	"es.parse-int": {
	chrome: "35",
	edge: "12",
	electron: "0.20",
	firefox: "21",
	ie: "9",
	ios: "8.0",
	node: "0.11.13",
	opera: "22",
	opera_mobile: "22",
	safari: "7.1",
	samsung: "3.0"
},
	"es.promise": {
	chrome: "67",
	edge: "74",
	electron: "4.0",
	firefox: "69",
	ios: "11.0",
	node: "10.4",
	opera: "54",
	opera_mobile: "48",
	safari: "11.0",
	samsung: "9.0"
},
	"es.promise.all-settled": {
	chrome: "76",
	edge: "76",
	electron: "6.0",
	firefox: "71",
	ios: "13.0",
	node: "12.9",
	opera: "63",
	opera_mobile: "54",
	safari: "13"
},
	"es.promise.finally": {
	chrome: "67",
	edge: "74",
	electron: "4.0",
	firefox: "69",
	ios: "13.2.3",
	node: "10.4",
	opera: "54",
	opera_mobile: "48",
	safari: "13.0.3",
	samsung: "9.0"
},
	"es.reflect.apply": {
	chrome: "49",
	edge: "15",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.construct": {
	chrome: "49",
	edge: "15",
	electron: "0.37",
	firefox: "44",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.define-property": {
	chrome: "49",
	edge: "13",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.delete-property": {
	chrome: "49",
	edge: "12",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.get": {
	chrome: "49",
	edge: "12",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.get-own-property-descriptor": {
	chrome: "49",
	edge: "12",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.get-prototype-of": {
	chrome: "49",
	edge: "12",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.has": {
	chrome: "49",
	edge: "12",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.is-extensible": {
	chrome: "49",
	edge: "12",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.own-keys": {
	chrome: "49",
	edge: "12",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.prevent-extensions": {
	chrome: "49",
	edge: "12",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.set": {
	chrome: "49",
	edge: "74",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.reflect.set-prototype-of": {
	chrome: "49",
	edge: "12",
	electron: "0.37",
	firefox: "42",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.regexp.constructor": {
	chrome: "51",
	edge: "74",
	electron: "1.2",
	firefox: "49",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.regexp.exec": {
	android: "4.4",
	chrome: "26",
	edge: "13",
	electron: "0.20",
	firefox: "44",
	ios: "10.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "10.0",
	samsung: "1.5"
},
	"es.regexp.flags": {
	chrome: "49",
	edge: "74",
	electron: "0.37",
	firefox: "37",
	ios: "9.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "9.0",
	samsung: "5.0"
},
	"es.regexp.sticky": {
	chrome: "49",
	edge: "13",
	electron: "0.37",
	firefox: "3",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.regexp.test": {
	chrome: "51",
	edge: "74",
	electron: "1.2",
	firefox: "46",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.regexp.to-string": {
	chrome: "50",
	edge: "74",
	electron: "1.1",
	firefox: "46",
	ios: "10.0",
	node: "6.0",
	opera: "37",
	opera_mobile: "37",
	safari: "10.0",
	samsung: "5.0"
},
	"es.set": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "53",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.string.code-point-at": {
	chrome: "41",
	edge: "13",
	electron: "0.21",
	firefox: "29",
	ios: "9.0",
	node: "1.0",
	opera: "28",
	opera_mobile: "28",
	safari: "9.0",
	samsung: "3.4"
},
	"es.string.ends-with": {
	chrome: "51",
	edge: "74",
	electron: "1.2",
	firefox: "40",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.string.from-code-point": {
	chrome: "41",
	edge: "13",
	electron: "0.21",
	firefox: "29",
	ios: "9.0",
	node: "1.0",
	opera: "28",
	opera_mobile: "28",
	safari: "9.0",
	samsung: "3.4"
},
	"es.string.includes": {
	chrome: "51",
	edge: "74",
	electron: "1.2",
	firefox: "40",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.string.iterator": {
	chrome: "39",
	edge: "13",
	electron: "0.20",
	firefox: "36",
	ios: "9.0",
	node: "1.0",
	opera: "26",
	opera_mobile: "26",
	safari: "9.0",
	samsung: "3.4"
},
	"es.string.match": {
	chrome: "51",
	edge: "74",
	electron: "1.2",
	firefox: "49",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.string.match-all": {
	chrome: "80",
	edge: "80",
	electron: "8.0",
	firefox: "73",
	opera: "67",
	safari: "13.1"
},
	"es.string.pad-end": {
	chrome: "57",
	edge: "15",
	electron: "1.7",
	firefox: "48",
	ios: "11.0",
	node: "8.0",
	opera: "44",
	opera_mobile: "43",
	safari: "11.0",
	samsung: "7.0"
},
	"es.string.pad-start": {
	chrome: "57",
	edge: "15",
	electron: "1.7",
	firefox: "48",
	ios: "11.0",
	node: "8.0",
	opera: "44",
	opera_mobile: "43",
	safari: "11.0",
	samsung: "7.0"
},
	"es.string.raw": {
	chrome: "41",
	edge: "13",
	electron: "0.21",
	firefox: "34",
	ios: "9.0",
	node: "1.0",
	opera: "28",
	opera_mobile: "28",
	safari: "9.0",
	samsung: "3.4"
},
	"es.string.repeat": {
	chrome: "41",
	edge: "13",
	electron: "0.21",
	firefox: "24",
	ios: "9.0",
	node: "1.0",
	opera: "28",
	opera_mobile: "28",
	safari: "9.0",
	samsung: "3.4"
},
	"es.string.replace": {
	chrome: "64",
	edge: "74",
	electron: "3.0",
	node: "10.0",
	opera: "51",
	opera_mobile: "47",
	samsung: "9.0"
},
	"es.string.search": {
	chrome: "51",
	edge: "74",
	electron: "1.2",
	firefox: "49",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.string.split": {
	chrome: "54",
	edge: "74",
	electron: "1.4",
	firefox: "49",
	ios: "10.0",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	safari: "10.0",
	samsung: "6.0"
},
	"es.string.starts-with": {
	chrome: "51",
	edge: "74",
	electron: "1.2",
	firefox: "40",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.string.trim": {
	chrome: "59",
	edge: "15",
	electron: "1.8",
	firefox: "52",
	ios: "12.2",
	node: "8.3",
	opera: "46",
	opera_mobile: "43",
	safari: "12.1",
	samsung: "7.0"
},
	"es.string.trim-end": {
	chrome: "66",
	edge: "74",
	electron: "3.0",
	firefox: "61",
	ios: "12.2",
	node: "10.0",
	opera: "53",
	opera_mobile: "47",
	safari: "12.1",
	samsung: "9.0"
},
	"es.string.trim-start": {
	chrome: "66",
	edge: "74",
	electron: "3.0",
	firefox: "61",
	ios: "12.0",
	node: "10.0",
	opera: "53",
	opera_mobile: "47",
	safari: "12.0",
	samsung: "9.0"
},
	"es.string.anchor": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "17",
	ios: "6.0",
	node: "0.1.27",
	opera: "15",
	opera_mobile: "15",
	phantom: "2.0",
	safari: "6.0",
	samsung: "1.0"
},
	"es.string.big": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.string.blink": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.string.bold": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.string.fixed": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.string.fontcolor": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "17",
	ios: "6.0",
	node: "0.1.27",
	opera: "15",
	opera_mobile: "15",
	phantom: "2.0",
	safari: "6.0",
	samsung: "1.0"
},
	"es.string.fontsize": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "17",
	ios: "6.0",
	node: "0.1.27",
	opera: "15",
	opera_mobile: "15",
	phantom: "2.0",
	safari: "6.0",
	samsung: "1.0"
},
	"es.string.italics": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.string.link": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "17",
	ios: "6.0",
	node: "0.1.27",
	opera: "15",
	opera_mobile: "15",
	phantom: "2.0",
	safari: "6.0",
	samsung: "1.0"
},
	"es.string.small": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.string.strike": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.string.sub": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.string.sup": {
	android: "3.0",
	chrome: "5",
	edge: "12",
	electron: "0.20",
	firefox: "2",
	ios: "2.0",
	node: "0.1.27",
	opera: "10.50",
	opera_mobile: "10.50",
	phantom: "1.9",
	safari: "3.1",
	samsung: "1.0"
},
	"es.typed-array.float32-array": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.float64-array": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.int8-array": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.int16-array": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.int32-array": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.uint8-array": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.uint8-clamped-array": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.uint16-array": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.uint32-array": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.copy-within": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "34",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.every": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.fill": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.filter": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "38",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.find": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.find-index": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.for-each": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "38",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.from": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.includes": {
	chrome: "49",
	edge: "14",
	electron: "0.37",
	firefox: "43",
	ios: "10.0",
	node: "6.0",
	opera: "36",
	opera_mobile: "36",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.index-of": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.iterator": {
	chrome: "47",
	edge: "13",
	electron: "0.36",
	firefox: "37",
	ios: "10.0",
	node: "6.0",
	opera: "34",
	opera_mobile: "34",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.join": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.last-index-of": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.map": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "38",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.of": {
	chrome: "54",
	edge: "15",
	electron: "1.4",
	firefox: "55",
	node: "7.0",
	opera: "41",
	opera_mobile: "41",
	samsung: "6.0"
},
	"es.typed-array.reduce": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.reduce-right": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.reverse": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.set": {
	android: "4.4",
	chrome: "26",
	edge: "13",
	electron: "0.20",
	firefox: "15",
	ios: "8.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "7.1",
	samsung: "1.5"
},
	"es.typed-array.slice": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "38",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.some": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "37",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.sort": {
	chrome: "45",
	edge: "13",
	electron: "0.31",
	firefox: "46",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.subarray": {
	android: "4.4",
	chrome: "26",
	edge: "13",
	electron: "0.20",
	firefox: "15",
	ios: "8.0",
	node: "0.11.0",
	opera: "16",
	opera_mobile: "16",
	safari: "7.1",
	samsung: "1.5"
},
	"es.typed-array.to-locale-string": {
	chrome: "45",
	edge: "74",
	electron: "0.31",
	firefox: "51",
	ios: "10.0",
	node: "4.0",
	opera: "32",
	opera_mobile: "32",
	safari: "10.0",
	samsung: "5.0"
},
	"es.typed-array.to-string": {
	chrome: "51",
	edge: "13",
	electron: "1.2",
	firefox: "51",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.weak-map": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "53",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"es.weak-set": {
	chrome: "51",
	edge: "15",
	electron: "1.2",
	firefox: "53",
	ios: "10.0",
	node: "6.5",
	opera: "38",
	opera_mobile: "38",
	safari: "10.0",
	samsung: "5.0"
},
	"esnext.aggregate-error": {
},
	"esnext.array.is-template-object": {
},
	"esnext.array.last-index": {
},
	"esnext.array.last-item": {
},
	"esnext.async-iterator.constructor": {
},
	"esnext.async-iterator.as-indexed-pairs": {
},
	"esnext.async-iterator.drop": {
},
	"esnext.async-iterator.every": {
},
	"esnext.async-iterator.filter": {
},
	"esnext.async-iterator.find": {
},
	"esnext.async-iterator.flat-map": {
},
	"esnext.async-iterator.for-each": {
},
	"esnext.async-iterator.from": {
},
	"esnext.async-iterator.map": {
},
	"esnext.async-iterator.reduce": {
},
	"esnext.async-iterator.some": {
},
	"esnext.async-iterator.take": {
},
	"esnext.async-iterator.to-array": {
},
	"esnext.composite-key": {
},
	"esnext.composite-symbol": {
},
	"esnext.global-this": {
	chrome: "71",
	edge: "74",
	electron: "5.0",
	firefox: "65",
	ios: "12.2",
	node: "12.0",
	opera: "58",
	opera_mobile: "50",
	safari: "12.1",
	samsung: "10.0"
},
	"esnext.iterator.constructor": {
},
	"esnext.iterator.as-indexed-pairs": {
},
	"esnext.iterator.drop": {
},
	"esnext.iterator.every": {
},
	"esnext.iterator.filter": {
},
	"esnext.iterator.find": {
},
	"esnext.iterator.flat-map": {
},
	"esnext.iterator.for-each": {
},
	"esnext.iterator.from": {
},
	"esnext.iterator.map": {
},
	"esnext.iterator.reduce": {
},
	"esnext.iterator.some": {
},
	"esnext.iterator.take": {
},
	"esnext.iterator.to-array": {
},
	"esnext.map.delete-all": {
},
	"esnext.map.every": {
},
	"esnext.map.filter": {
},
	"esnext.map.find": {
},
	"esnext.map.find-key": {
},
	"esnext.map.from": {
},
	"esnext.map.group-by": {
},
	"esnext.map.includes": {
},
	"esnext.map.key-by": {
},
	"esnext.map.key-of": {
},
	"esnext.map.map-keys": {
},
	"esnext.map.map-values": {
},
	"esnext.map.merge": {
},
	"esnext.map.of": {
},
	"esnext.map.reduce": {
},
	"esnext.map.some": {
},
	"esnext.map.update": {
},
	"esnext.map.update-or-insert": {
},
	"esnext.map.upsert": {
},
	"esnext.math.clamp": {
},
	"esnext.math.deg-per-rad": {
},
	"esnext.math.degrees": {
},
	"esnext.math.fscale": {
},
	"esnext.math.iaddh": {
},
	"esnext.math.imulh": {
},
	"esnext.math.isubh": {
},
	"esnext.math.rad-per-deg": {
},
	"esnext.math.radians": {
},
	"esnext.math.scale": {
},
	"esnext.math.seeded-prng": {
},
	"esnext.math.signbit": {
},
	"esnext.math.umulh": {
},
	"esnext.number.from-string": {
},
	"esnext.object.iterate-entries": {
},
	"esnext.object.iterate-keys": {
},
	"esnext.object.iterate-values": {
},
	"esnext.observable": {
},
	"esnext.promise.all-settled": {
	chrome: "76",
	edge: "76",
	electron: "6.0",
	firefox: "71",
	ios: "13.0",
	node: "12.9",
	opera: "63",
	opera_mobile: "54",
	safari: "13"
},
	"esnext.promise.any": {
},
	"esnext.promise.try": {
},
	"esnext.reflect.define-metadata": {
},
	"esnext.reflect.delete-metadata": {
},
	"esnext.reflect.get-metadata": {
},
	"esnext.reflect.get-metadata-keys": {
},
	"esnext.reflect.get-own-metadata": {
},
	"esnext.reflect.get-own-metadata-keys": {
},
	"esnext.reflect.has-metadata": {
},
	"esnext.reflect.has-own-metadata": {
},
	"esnext.reflect.metadata": {
},
	"esnext.set.add-all": {
},
	"esnext.set.delete-all": {
},
	"esnext.set.difference": {
},
	"esnext.set.every": {
},
	"esnext.set.filter": {
},
	"esnext.set.find": {
},
	"esnext.set.from": {
},
	"esnext.set.intersection": {
},
	"esnext.set.is-disjoint-from": {
},
	"esnext.set.is-subset-of": {
},
	"esnext.set.is-superset-of": {
},
	"esnext.set.join": {
},
	"esnext.set.map": {
},
	"esnext.set.of": {
},
	"esnext.set.reduce": {
},
	"esnext.set.some": {
},
	"esnext.set.symmetric-difference": {
},
	"esnext.set.union": {
},
	"esnext.string.at": {
},
	"esnext.string.code-points": {
},
	"esnext.string.match-all": {
	chrome: "80",
	edge: "80",
	electron: "8.0",
	firefox: "73",
	opera: "67",
	safari: "13.1"
},
	"esnext.string.replace-all": {
},
	"esnext.symbol.async-dispose": {
},
	"esnext.symbol.dispose": {
},
	"esnext.symbol.observable": {
},
	"esnext.symbol.pattern-match": {
},
	"esnext.symbol.replace-all": {
},
	"esnext.weak-map.delete-all": {
},
	"esnext.weak-map.from": {
},
	"esnext.weak-map.of": {
},
	"esnext.weak-map.upsert": {
},
	"esnext.weak-set.add-all": {
},
	"esnext.weak-set.delete-all": {
},
	"esnext.weak-set.from": {
},
	"esnext.weak-set.of": {
},
	"web.dom-collections.for-each": {
	chrome: "58",
	edge: "16",
	electron: "1.7",
	firefox: "50",
	ios: "10.0",
	node: "0.0.1",
	opera: "45",
	opera_mobile: "43",
	safari: "10.0",
	samsung: "7.0"
},
	"web.dom-collections.iterator": {
	chrome: "66",
	edge: "74",
	electron: "3.0",
	firefox: "60",
	node: "0.0.1",
	opera: "53",
	opera_mobile: "47",
	safari: "13.1",
	samsung: "9.0"
},
	"web.immediate": {
	ie: "10",
	node: "0.9.1"
},
	"web.queue-microtask": {
	chrome: "71",
	edge: "74",
	electron: "5.0",
	firefox: "69",
	ios: "12.2",
	node: "12.0",
	opera: "58",
	opera_mobile: "50",
	safari: "12.1",
	samsung: "10.0"
},
	"web.timers": {
	android: "1.5",
	chrome: "1",
	edge: "12",
	electron: "0.20",
	firefox: "1",
	ie: "10",
	ios: "1.0",
	node: "0.0.1",
	opera: "7",
	opera_mobile: "7",
	phantom: "1.9",
	safari: "1.0",
	samsung: "1.0"
},
	"web.url": {
	chrome: "67",
	edge: "74",
	electron: "4.0",
	firefox: "57",
	node: "10.0",
	opera: "54",
	opera_mobile: "48",
	samsung: "9.0"
},
	"web.url.to-json": {
	chrome: "71",
	edge: "74",
	electron: "5.0",
	firefox: "57",
	node: "10.0",
	opera: "58",
	opera_mobile: "50",
	samsung: "10.0"
},
	"web.url-search-params": {
	chrome: "67",
	edge: "74",
	electron: "4.0",
	firefox: "57",
	node: "10.0",
	opera: "54",
	opera_mobile: "48",
	samsung: "9.0"
}
};

var data$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': data
});

var modulesByVersions = {
	"3.0": [
	"es.symbol",
	"es.symbol.description",
	"es.symbol.async-iterator",
	"es.symbol.has-instance",
	"es.symbol.is-concat-spreadable",
	"es.symbol.iterator",
	"es.symbol.match",
	"es.symbol.replace",
	"es.symbol.search",
	"es.symbol.species",
	"es.symbol.split",
	"es.symbol.to-primitive",
	"es.symbol.to-string-tag",
	"es.symbol.unscopables",
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.from",
	"es.array.includes",
	"es.array.index-of",
	"es.array.is-array",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.of",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map",
	"es.array-buffer.constructor",
	"es.array-buffer.is-view",
	"es.array-buffer.slice",
	"es.data-view",
	"es.date.now",
	"es.date.to-iso-string",
	"es.date.to-json",
	"es.date.to-primitive",
	"es.date.to-string",
	"es.function.bind",
	"es.function.has-instance",
	"es.function.name",
	"es.json.to-string-tag",
	"es.map",
	"es.math.acosh",
	"es.math.asinh",
	"es.math.atanh",
	"es.math.cbrt",
	"es.math.clz32",
	"es.math.cosh",
	"es.math.expm1",
	"es.math.fround",
	"es.math.hypot",
	"es.math.imul",
	"es.math.log10",
	"es.math.log1p",
	"es.math.log2",
	"es.math.sign",
	"es.math.sinh",
	"es.math.tanh",
	"es.math.to-string-tag",
	"es.math.trunc",
	"es.number.constructor",
	"es.number.epsilon",
	"es.number.is-finite",
	"es.number.is-integer",
	"es.number.is-nan",
	"es.number.is-safe-integer",
	"es.number.max-safe-integer",
	"es.number.min-safe-integer",
	"es.number.parse-float",
	"es.number.parse-int",
	"es.number.to-fixed",
	"es.number.to-precision",
	"es.object.assign",
	"es.object.create",
	"es.object.define-getter",
	"es.object.define-properties",
	"es.object.define-property",
	"es.object.define-setter",
	"es.object.entries",
	"es.object.freeze",
	"es.object.from-entries",
	"es.object.get-own-property-descriptor",
	"es.object.get-own-property-descriptors",
	"es.object.get-own-property-names",
	"es.object.get-prototype-of",
	"es.object.is",
	"es.object.is-extensible",
	"es.object.is-frozen",
	"es.object.is-sealed",
	"es.object.keys",
	"es.object.lookup-getter",
	"es.object.lookup-setter",
	"es.object.prevent-extensions",
	"es.object.seal",
	"es.object.set-prototype-of",
	"es.object.to-string",
	"es.object.values",
	"es.parse-float",
	"es.parse-int",
	"es.promise",
	"es.promise.finally",
	"es.reflect.apply",
	"es.reflect.construct",
	"es.reflect.define-property",
	"es.reflect.delete-property",
	"es.reflect.get",
	"es.reflect.get-own-property-descriptor",
	"es.reflect.get-prototype-of",
	"es.reflect.has",
	"es.reflect.is-extensible",
	"es.reflect.own-keys",
	"es.reflect.prevent-extensions",
	"es.reflect.set",
	"es.reflect.set-prototype-of",
	"es.regexp.constructor",
	"es.regexp.exec",
	"es.regexp.flags",
	"es.regexp.to-string",
	"es.set",
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.from-code-point",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.raw",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup",
	"es.typed-array.float32-array",
	"es.typed-array.float64-array",
	"es.typed-array.int8-array",
	"es.typed-array.int16-array",
	"es.typed-array.int32-array",
	"es.typed-array.uint8-array",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.uint16-array",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string",
	"es.weak-map",
	"es.weak-set",
	"esnext.aggregate-error",
	"esnext.array.last-index",
	"esnext.array.last-item",
	"esnext.composite-key",
	"esnext.composite-symbol",
	"esnext.global-this",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.math.umulh",
	"esnext.number.from-string",
	"esnext.observable",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"esnext.reflect.define-metadata",
	"esnext.reflect.delete-metadata",
	"esnext.reflect.get-metadata",
	"esnext.reflect.get-metadata-keys",
	"esnext.reflect.get-own-metadata",
	"esnext.reflect.get-own-metadata-keys",
	"esnext.reflect.has-metadata",
	"esnext.reflect.has-own-metadata",
	"esnext.reflect.metadata",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of",
	"web.dom-collections.for-each",
	"web.dom-collections.iterator",
	"web.immediate",
	"web.queue-microtask",
	"web.timers",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"3.1": [
	"es.string.match-all",
	"es.symbol.match-all",
	"esnext.symbol.replace-all"
],
	"3.2": [
	"es.promise.all-settled",
	"esnext.array.is-template-object",
	"esnext.map.update-or-insert",
	"esnext.symbol.async-dispose"
],
	"3.3": [
	"es.global-this",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.upsert",
	"esnext.weak-map.upsert"
],
	"3.4": [
	"es.json.stringify"
],
	"3.5": [
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values"
],
	"3.6": [
	"es.regexp.sticky",
	"es.regexp.test"
]
};

var modulesByVersions$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': modulesByVersions
});

var modules = [
	"es.symbol",
	"es.symbol.description",
	"es.symbol.async-iterator",
	"es.symbol.has-instance",
	"es.symbol.is-concat-spreadable",
	"es.symbol.iterator",
	"es.symbol.match",
	"es.symbol.match-all",
	"es.symbol.replace",
	"es.symbol.search",
	"es.symbol.species",
	"es.symbol.split",
	"es.symbol.to-primitive",
	"es.symbol.to-string-tag",
	"es.symbol.unscopables",
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.from",
	"es.array.includes",
	"es.array.index-of",
	"es.array.is-array",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.of",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map",
	"es.array-buffer.constructor",
	"es.array-buffer.is-view",
	"es.array-buffer.slice",
	"es.data-view",
	"es.date.now",
	"es.date.to-iso-string",
	"es.date.to-json",
	"es.date.to-primitive",
	"es.date.to-string",
	"es.function.bind",
	"es.function.has-instance",
	"es.function.name",
	"es.global-this",
	"es.json.stringify",
	"es.json.to-string-tag",
	"es.map",
	"es.math.acosh",
	"es.math.asinh",
	"es.math.atanh",
	"es.math.cbrt",
	"es.math.clz32",
	"es.math.cosh",
	"es.math.expm1",
	"es.math.fround",
	"es.math.hypot",
	"es.math.imul",
	"es.math.log10",
	"es.math.log1p",
	"es.math.log2",
	"es.math.sign",
	"es.math.sinh",
	"es.math.tanh",
	"es.math.to-string-tag",
	"es.math.trunc",
	"es.number.constructor",
	"es.number.epsilon",
	"es.number.is-finite",
	"es.number.is-integer",
	"es.number.is-nan",
	"es.number.is-safe-integer",
	"es.number.max-safe-integer",
	"es.number.min-safe-integer",
	"es.number.parse-float",
	"es.number.parse-int",
	"es.number.to-fixed",
	"es.number.to-precision",
	"es.object.assign",
	"es.object.create",
	"es.object.define-getter",
	"es.object.define-properties",
	"es.object.define-property",
	"es.object.define-setter",
	"es.object.entries",
	"es.object.freeze",
	"es.object.from-entries",
	"es.object.get-own-property-descriptor",
	"es.object.get-own-property-descriptors",
	"es.object.get-own-property-names",
	"es.object.get-prototype-of",
	"es.object.is",
	"es.object.is-extensible",
	"es.object.is-frozen",
	"es.object.is-sealed",
	"es.object.keys",
	"es.object.lookup-getter",
	"es.object.lookup-setter",
	"es.object.prevent-extensions",
	"es.object.seal",
	"es.object.set-prototype-of",
	"es.object.to-string",
	"es.object.values",
	"es.parse-float",
	"es.parse-int",
	"es.promise",
	"es.promise.all-settled",
	"es.promise.finally",
	"es.reflect.apply",
	"es.reflect.construct",
	"es.reflect.define-property",
	"es.reflect.delete-property",
	"es.reflect.get",
	"es.reflect.get-own-property-descriptor",
	"es.reflect.get-prototype-of",
	"es.reflect.has",
	"es.reflect.is-extensible",
	"es.reflect.own-keys",
	"es.reflect.prevent-extensions",
	"es.reflect.set",
	"es.reflect.set-prototype-of",
	"es.regexp.constructor",
	"es.regexp.exec",
	"es.regexp.flags",
	"es.regexp.sticky",
	"es.regexp.test",
	"es.regexp.to-string",
	"es.set",
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.from-code-point",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.raw",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup",
	"es.typed-array.float32-array",
	"es.typed-array.float64-array",
	"es.typed-array.int8-array",
	"es.typed-array.int16-array",
	"es.typed-array.int32-array",
	"es.typed-array.uint8-array",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.uint16-array",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string",
	"es.weak-map",
	"es.weak-set",
	"esnext.aggregate-error",
	"esnext.array.is-template-object",
	"esnext.array.last-index",
	"esnext.array.last-item",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.composite-key",
	"esnext.composite-symbol",
	"esnext.global-this",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.math.umulh",
	"esnext.number.from-string",
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values",
	"esnext.observable",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"esnext.reflect.define-metadata",
	"esnext.reflect.delete-metadata",
	"esnext.reflect.get-metadata",
	"esnext.reflect.get-metadata-keys",
	"esnext.reflect.get-own-metadata",
	"esnext.reflect.get-own-metadata-keys",
	"esnext.reflect.has-metadata",
	"esnext.reflect.has-own-metadata",
	"esnext.reflect.metadata",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.symbol.replace-all",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-map.upsert",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of",
	"web.dom-collections.for-each",
	"web.dom-collections.iterator",
	"web.immediate",
	"web.queue-microtask",
	"web.timers",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
];

var modules$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': modules
});

var modulesByVersions$2 = getCjsExportFromNamespace(modulesByVersions$1);

var modules$2 = getCjsExportFromNamespace(modules$1);

const { compare: compare$2, intersection: intersection$1, semver: semver$1 } = helpers;



var getModulesListForTargetVersion = function (raw) {
  const corejs = semver$1(raw);
  if (corejs.major !== 3) {
    throw RangeError('This version of `core-js-compat` works only with `core-js@3`.');
  }
  const result = [];
  for (const version of Object.keys(modulesByVersions$2)) {
    if (compare$2(version, '<=', corejs)) {
      result.push(...modulesByVersions$2[version]);
    }
  }
  return intersection$1(result, modules$2);
};

var envs = [
	{
		name: "nodejs",
		version: "0.2.0",
		date: "2011-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.3.0",
		date: "2011-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.4.0",
		date: "2011-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.5.0",
		date: "2011-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.6.0",
		date: "2011-11-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.7.0",
		date: "2012-01-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.8.0",
		date: "2012-06-22",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.9.0",
		date: "2012-07-20",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.10.0",
		date: "2013-03-11",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.11.0",
		date: "2013-03-28",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "0.12.0",
		date: "2015-02-06",
		lts: false,
		security: false
	},
	{
		name: "iojs",
		version: "1.0.0",
		date: "2015-01-14"
	},
	{
		name: "iojs",
		version: "1.1.0",
		date: "2015-02-03"
	},
	{
		name: "iojs",
		version: "1.2.0",
		date: "2015-02-11"
	},
	{
		name: "iojs",
		version: "1.3.0",
		date: "2015-02-20"
	},
	{
		name: "iojs",
		version: "1.5.0",
		date: "2015-03-06"
	},
	{
		name: "iojs",
		version: "1.6.0",
		date: "2015-03-20"
	},
	{
		name: "iojs",
		version: "2.0.0",
		date: "2015-05-04"
	},
	{
		name: "iojs",
		version: "2.1.0",
		date: "2015-05-24"
	},
	{
		name: "iojs",
		version: "2.2.0",
		date: "2015-06-01"
	},
	{
		name: "iojs",
		version: "2.3.0",
		date: "2015-06-13"
	},
	{
		name: "iojs",
		version: "2.4.0",
		date: "2015-07-17"
	},
	{
		name: "iojs",
		version: "2.5.0",
		date: "2015-07-28"
	},
	{
		name: "iojs",
		version: "3.0.0",
		date: "2015-08-04"
	},
	{
		name: "iojs",
		version: "3.1.0",
		date: "2015-08-19"
	},
	{
		name: "iojs",
		version: "3.2.0",
		date: "2015-08-25"
	},
	{
		name: "iojs",
		version: "3.3.0",
		date: "2015-09-02"
	},
	{
		name: "nodejs",
		version: "4.0.0",
		date: "2015-09-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "4.1.0",
		date: "2015-09-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "4.2.0",
		date: "2015-10-12",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.3.0",
		date: "2016-02-09",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.4.0",
		date: "2016-03-08",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.5.0",
		date: "2016-08-16",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.6.0",
		date: "2016-09-27",
		lts: "Argon",
		security: true
	},
	{
		name: "nodejs",
		version: "4.7.0",
		date: "2016-12-06",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.8.0",
		date: "2017-02-21",
		lts: "Argon",
		security: false
	},
	{
		name: "nodejs",
		version: "4.9.0",
		date: "2018-03-28",
		lts: "Argon",
		security: true
	},
	{
		name: "nodejs",
		version: "5.0.0",
		date: "2015-10-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.1.0",
		date: "2015-11-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.2.0",
		date: "2015-12-09",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.3.0",
		date: "2015-12-15",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.4.0",
		date: "2016-01-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.5.0",
		date: "2016-01-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.6.0",
		date: "2016-02-09",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.7.0",
		date: "2016-02-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.8.0",
		date: "2016-03-09",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.9.0",
		date: "2016-03-16",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.10.0",
		date: "2016-04-01",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.11.0",
		date: "2016-04-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "5.12.0",
		date: "2016-06-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.0.0",
		date: "2016-04-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.1.0",
		date: "2016-05-05",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.2.0",
		date: "2016-05-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.3.0",
		date: "2016-07-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.4.0",
		date: "2016-08-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.5.0",
		date: "2016-08-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.6.0",
		date: "2016-09-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.7.0",
		date: "2016-09-27",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "6.8.0",
		date: "2016-10-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "6.9.0",
		date: "2016-10-18",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.10.0",
		date: "2017-02-21",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.11.0",
		date: "2017-06-06",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.12.0",
		date: "2017-11-06",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.13.0",
		date: "2018-02-10",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.14.0",
		date: "2018-03-28",
		lts: "Boron",
		security: true
	},
	{
		name: "nodejs",
		version: "6.15.0",
		date: "2018-11-27",
		lts: "Boron",
		security: true
	},
	{
		name: "nodejs",
		version: "6.16.0",
		date: "2018-12-26",
		lts: "Boron",
		security: false
	},
	{
		name: "nodejs",
		version: "6.17.0",
		date: "2019-02-28",
		lts: "Boron",
		security: true
	},
	{
		name: "nodejs",
		version: "7.0.0",
		date: "2016-10-25",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.1.0",
		date: "2016-11-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.2.0",
		date: "2016-11-22",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.3.0",
		date: "2016-12-20",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.4.0",
		date: "2017-01-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.5.0",
		date: "2017-01-31",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.6.0",
		date: "2017-02-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.7.0",
		date: "2017-02-28",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.8.0",
		date: "2017-03-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.9.0",
		date: "2017-04-11",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "7.10.0",
		date: "2017-05-02",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.0.0",
		date: "2017-05-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.1.0",
		date: "2017-06-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.2.0",
		date: "2017-07-19",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.3.0",
		date: "2017-08-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.4.0",
		date: "2017-08-15",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.5.0",
		date: "2017-09-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.6.0",
		date: "2017-09-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.7.0",
		date: "2017-10-11",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.8.0",
		date: "2017-10-24",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "8.9.0",
		date: "2017-10-31",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.10.0",
		date: "2018-03-06",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.11.0",
		date: "2018-03-28",
		lts: "Carbon",
		security: true
	},
	{
		name: "nodejs",
		version: "8.12.0",
		date: "2018-09-10",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.13.0",
		date: "2018-11-20",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.14.0",
		date: "2018-11-27",
		lts: "Carbon",
		security: true
	},
	{
		name: "nodejs",
		version: "8.15.0",
		date: "2018-12-26",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.16.0",
		date: "2019-04-16",
		lts: "Carbon",
		security: false
	},
	{
		name: "nodejs",
		version: "8.17.0",
		date: "2019-12-17",
		lts: "Carbon",
		security: true
	},
	{
		name: "nodejs",
		version: "9.0.0",
		date: "2017-10-31",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.1.0",
		date: "2017-11-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.2.0",
		date: "2017-11-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.3.0",
		date: "2017-12-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.4.0",
		date: "2018-01-10",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.5.0",
		date: "2018-01-31",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.6.0",
		date: "2018-02-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.7.0",
		date: "2018-03-01",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.8.0",
		date: "2018-03-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.9.0",
		date: "2018-03-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "9.10.0",
		date: "2018-03-28",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "9.11.0",
		date: "2018-04-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.0.0",
		date: "2018-04-24",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.1.0",
		date: "2018-05-08",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.2.0",
		date: "2018-05-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.3.0",
		date: "2018-05-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.4.0",
		date: "2018-06-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.5.0",
		date: "2018-06-20",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.6.0",
		date: "2018-07-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.7.0",
		date: "2018-07-18",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.8.0",
		date: "2018-08-01",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.9.0",
		date: "2018-08-15",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.10.0",
		date: "2018-09-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.11.0",
		date: "2018-09-19",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.12.0",
		date: "2018-10-10",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "10.13.0",
		date: "2018-10-30",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.14.0",
		date: "2018-11-27",
		lts: "Dubnium",
		security: true
	},
	{
		name: "nodejs",
		version: "10.15.0",
		date: "2018-12-26",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.16.0",
		date: "2019-05-28",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.17.0",
		date: "2019-10-21",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.18.0",
		date: "2019-12-16",
		lts: "Dubnium",
		security: true
	},
	{
		name: "nodejs",
		version: "10.19.0",
		date: "2020-02-05",
		lts: "Dubnium",
		security: true
	},
	{
		name: "nodejs",
		version: "10.20.0",
		date: "2020-03-24",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "10.21.0",
		date: "2020-06-02",
		lts: "Dubnium",
		security: true
	},
	{
		name: "nodejs",
		version: "10.22.0",
		date: "2020-07-21",
		lts: "Dubnium",
		security: false
	},
	{
		name: "nodejs",
		version: "11.0.0",
		date: "2018-10-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.1.0",
		date: "2018-10-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.2.0",
		date: "2018-11-15",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.3.0",
		date: "2018-11-27",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "11.4.0",
		date: "2018-12-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.5.0",
		date: "2018-12-18",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.6.0",
		date: "2018-12-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.7.0",
		date: "2019-01-17",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.8.0",
		date: "2019-01-24",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.9.0",
		date: "2019-01-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.10.0",
		date: "2019-02-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.11.0",
		date: "2019-03-05",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.12.0",
		date: "2019-03-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.13.0",
		date: "2019-03-28",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.14.0",
		date: "2019-04-10",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "11.15.0",
		date: "2019-04-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.0.0",
		date: "2019-04-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.1.0",
		date: "2019-04-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.2.0",
		date: "2019-05-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.3.0",
		date: "2019-05-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.4.0",
		date: "2019-06-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.5.0",
		date: "2019-06-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.6.0",
		date: "2019-07-03",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.7.0",
		date: "2019-07-23",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.8.0",
		date: "2019-08-06",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.9.0",
		date: "2019-08-20",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.10.0",
		date: "2019-09-04",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.11.0",
		date: "2019-09-25",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.12.0",
		date: "2019-10-11",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "12.13.0",
		date: "2019-10-21",
		lts: "Erbium",
		security: false
	},
	{
		name: "nodejs",
		version: "12.14.0",
		date: "2019-12-16",
		lts: "Erbium",
		security: true
	},
	{
		name: "nodejs",
		version: "12.15.0",
		date: "2020-02-05",
		lts: "Erbium",
		security: true
	},
	{
		name: "nodejs",
		version: "12.16.0",
		date: "2020-02-11",
		lts: "Erbium",
		security: false
	},
	{
		name: "nodejs",
		version: "12.17.0",
		date: "2020-05-26",
		lts: "Erbium",
		security: false
	},
	{
		name: "nodejs",
		version: "12.18.0",
		date: "2020-06-02",
		lts: "Erbium",
		security: true
	},
	{
		name: "nodejs",
		version: "13.0.0",
		date: "2019-10-10",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.1.0",
		date: "2019-11-05",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.2.0",
		date: "2019-11-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.3.0",
		date: "2019-12-03",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.4.0",
		date: "2019-12-17",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "13.5.0",
		date: "2019-12-18",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.6.0",
		date: "2020-01-07",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.7.0",
		date: "2020-01-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.8.0",
		date: "2020-02-05",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "13.9.0",
		date: "2020-02-18",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.10.0",
		date: "2020-03-03",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.11.0",
		date: "2020-03-12",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.12.0",
		date: "2020-03-26",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.13.0",
		date: "2020-04-14",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "13.14.0",
		date: "2020-04-28",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.0.0",
		date: "2020-04-21",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.1.0",
		date: "2020-04-29",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.2.0",
		date: "2020-05-05",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.3.0",
		date: "2020-05-19",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.4.0",
		date: "2020-06-02",
		lts: false,
		security: true
	},
	{
		name: "nodejs",
		version: "14.5.0",
		date: "2020-06-30",
		lts: false,
		security: false
	},
	{
		name: "nodejs",
		version: "14.6.0",
		date: "2020-07-15",
		lts: false,
		security: false
	}
];

var envs$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': envs
});

var browsers={A:"ie",B:"edge",C:"firefox",D:"chrome",E:"safari",F:"opera",G:"ios_saf",H:"op_mini",I:"android",J:"bb",K:"op_mob",L:"and_chr",M:"and_ff",N:"ie_mob",O:"and_uc",P:"samsung",Q:"and_qq",R:"baidu",S:"kaios"};

var browsers_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
var browsers$1 = exports.browsers = browsers;
});

var browserVersions={"0":"48","1":"49","2":"50","3":"51","4":"52","5":"53","6":"54","7":"55","8":"56","9":"57",A:"10",B:"11",C:"12",D:"7",E:"9",F:"8",G:"4",H:"14",I:"6",J:"16",K:"17",L:"18",M:"81",N:"68",O:"13",P:"46",Q:"15",R:"11.1",S:"84",T:"69",U:"67",V:"79",W:"5",X:"19",Y:"20",Z:"21",a:"22",b:"23",c:"24",d:"25",e:"26",f:"27",g:"28",h:"29",i:"30",j:"31",k:"32",l:"33",m:"34",n:"35",o:"36",p:"37",q:"38",r:"39",s:"40",t:"41",u:"42",v:"43",w:"44",x:"45",y:"80",z:"47",AB:"58",BB:"12.1",CB:"60",DB:"66",EB:"62",FB:"63",GB:"64",HB:"65",IB:"4.2-4.3",JB:"61",KB:"3",LB:"59",MB:"70",NB:"71",OB:"72",PB:"73",QB:"74",RB:"75",SB:"76",TB:"77",UB:"78",VB:"11.5",WB:"83",XB:"10.1",YB:"3.2",ZB:"10.3",aB:"87",bB:"86",cB:"5.1",dB:"6.1",eB:"7.1",fB:"9.1",gB:"85",hB:"3.6",iB:"5.5",jB:"13.1",kB:"TP",lB:"9.5-9.6",mB:"10.0-10.1",nB:"10.5",oB:"10.6",pB:"3.5",qB:"11.6",rB:"4.0-4.1",sB:"2",tB:"5.0-5.1",uB:"6.0-6.1",vB:"7.0-7.1",wB:"8.1-8.4",xB:"9.0-9.2",yB:"9.3",zB:"10.0-10.2","0B":"3.1","1B":"11.0-11.2","2B":"11.3-11.4","3B":"12.0-12.1","4B":"12.2-12.4","5B":"13.0-13.1","6B":"13.2","7B":"13.3","8B":"13.4-13.5","9B":"14.0",AC:"all",BC:"2.1",CC:"2.2",DC:"2.3",EC:"4.1",FC:"4.4",GC:"4.4.3-4.4.4",HC:"12.12",IC:"5.0-5.4",JC:"6.2-6.4",KC:"7.2-7.4",LC:"8.2",MC:"9.2",NC:"11.1-11.2",OC:"12.0",PC:"10.4",QC:"7.12",RC:"2.5"};

var browserVersions_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
var browserVersions$1 = exports.browserVersions = browserVersions;
});

var agents={A:{A:{I:0.00595864,D:0.00595864,F:0.0715037,E:0.232387,A:0.0178759,B:1.30494,iB:0.009298},B:"ms",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","iB","I","D","F","E","A","B","","",""],E:"IE",F:{iB:962323200,I:998870400,D:1161129600,F:1237420800,E:1300060800,A:1346716800,B:1381968000}},B:{A:{C:0.009284,O:0.004642,H:0.013926,Q:0.009284,J:0.02321,K:0.088198,L:0.770572,V:0,y:0.004711,M:0.041778,WB:0.99803,S:0},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","C","O","H","Q","J","K","L","V","y","M","WB","S","","",""],E:"Edge",F:{C:1438128000,O:1447286400,H:1470096000,Q:1491868800,J:1508198400,K:1525046400,L:1542067200,V:1579046400,y:1581033600,M:1586736000,WB:1590019200,S:1594857600},D:{C:"ms",O:"ms",H:"ms",Q:"ms",J:"ms",K:"ms",L:"ms"}},C:{A:{"0":0.018568,"1":0.004538,"2":0.004642,"3":0.004642,"4":0.11605,"5":0.004335,"6":0.009284,"7":0.009284,"8":0.018568,"9":0.009284,sB:0.004827,KB:0.004538,G:0.013926,W:0.004879,I:0.020136,D:0.005725,F:0.004525,E:0.00533,A:0.004283,B:0.004711,C:0.004471,O:0.004486,H:0.00453,Q:0.004465,J:0.004417,K:0.008922,L:0.004393,X:0.004443,Y:0.004283,Z:0.013596,a:0.013698,b:0.013614,c:0.008786,d:0.004403,e:0.004317,f:0.004393,g:0.004418,h:0.008834,i:0.004403,j:0.008928,k:0.004471,l:0.009284,m:0.004707,n:0.009076,o:0.004465,p:0.004783,q:0.004642,r:0.004783,s:0.00487,t:0.005029,u:0.0047,v:0.041778,w:0.004642,x:0.009284,P:0.004525,z:0.009284,AB:0.004642,LB:0.009284,CB:0.018568,JB:0.009284,EB:0.009284,FB:0.037136,GB:0.027852,HB:0.027852,DB:0.02321,U:0.009284,N:0.13926,T:0.009284,MB:0.009284,NB:0.009284,OB:0.032494,PB:0.009284,QB:0.018568,RB:0.018568,SB:0.051062,TB:0.645238,UB:2.36742,V:0.148544,y:0,M:0,pB:0.008786,hB:0.00487},B:"moz",C:["sB","KB","pB","hB","G","W","I","D","F","E","A","B","C","O","H","Q","J","K","L","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","P","z","0","1","2","3","4","5","6","7","8","9","AB","LB","CB","JB","EB","FB","GB","HB","DB","U","N","T","MB","NB","OB","PB","QB","RB","SB","TB","UB","V","y","M",""],E:"Firefox",F:{"0":1470096000,"1":1474329600,"2":1479168000,"3":1485216000,"4":1488844800,"5":1492560000,"6":1497312000,"7":1502150400,"8":1506556800,"9":1510617600,sB:1161648000,KB:1213660800,pB:1246320000,hB:1264032000,G:1300752000,W:1308614400,I:1313452800,D:1317081600,F:1317081600,E:1320710400,A:1324339200,B:1327968000,C:1331596800,O:1335225600,H:1338854400,Q:1342483200,J:1346112000,K:1349740800,L:1353628800,X:1357603200,Y:1361232000,Z:1364860800,a:1368489600,b:1372118400,c:1375747200,d:1379376000,e:1386633600,f:1391472000,g:1395100800,h:1398729600,i:1402358400,j:1405987200,k:1409616000,l:1413244800,m:1417392000,n:1421107200,o:1424736000,p:1428278400,q:1431475200,r:1435881600,s:1439251200,t:1442880000,u:1446508800,v:1450137600,w:1453852800,x:1457395200,P:1461628800,z:1465257600,AB:1516665600,LB:1520985600,CB:1525824000,JB:1529971200,EB:1536105600,FB:1540252800,GB:1544486400,HB:1548720000,DB:1552953600,U:1558396800,N:1562630400,T:1567468800,MB:1571788800,NB:1575331200,OB:1578355200,PB:1581379200,QB:1583798400,RB:1586304000,SB:1588636800,TB:1591056000,UB:1593475200,V:1595894400,y:null,M:null}},D:{A:{"0":0.02321,"1":0.311014,"2":0.004642,"3":0.009284,"4":0.004642,"5":0.041778,"6":0.018568,"7":0.013926,"8":0.027852,"9":0.027852,G:0.004706,W:0.004879,I:0.004879,D:0.005591,F:0.005591,E:0.005591,A:0.004534,B:0.004464,C:0.010424,O:0.009284,H:0.004706,Q:0.015087,J:0.004393,K:0.004393,L:0.008652,X:0.004418,Y:0.004393,Z:0.004317,a:0.013926,b:0.008786,c:0.004538,d:0.004461,e:0.004711,f:0.004326,g:0.0047,h:0.004538,i:0.004335,j:0.009284,k:0.004566,l:0.009422,m:0.009284,n:0.004335,o:0.004335,p:0.004464,q:0.027852,r:0.004464,s:0.013926,t:0.032494,u:0.004403,v:0.013926,w:0.004465,x:0.004642,P:0.004642,z:0.009284,AB:0.027852,LB:0.009284,CB:0.013926,JB:0.037136,EB:0.018568,FB:0.051062,GB:0.018568,HB:0.04642,DB:0.032494,U:0.04642,N:0.027852,T:0.088198,MB:0.181038,NB:0.218174,OB:0.213532,PB:0.120692,QB:0.111408,RB:0.09284,SB:0.102124,TB:0.083556,UB:0.125334,V:0.218174,y:0.37136,M:0.450274,WB:17.3472,S:10.4074,gB:0.027852,bB:0.018568,aB:0},B:"webkit",C:["G","W","I","D","F","E","A","B","C","O","H","Q","J","K","L","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","P","z","0","1","2","3","4","5","6","7","8","9","AB","LB","CB","JB","EB","FB","GB","HB","DB","U","N","T","MB","NB","OB","PB","QB","RB","SB","TB","UB","V","y","M","WB","S","gB","bB","aB"],E:"Chrome",F:{"0":1453248000,"1":1456963200,"2":1460592000,"3":1464134400,"4":1469059200,"5":1472601600,"6":1476230400,"7":1480550400,"8":1485302400,"9":1489017600,G:1264377600,W:1274745600,I:1283385600,D:1287619200,F:1291248000,E:1296777600,A:1299542400,B:1303862400,C:1307404800,O:1312243200,H:1316131200,Q:1316131200,J:1319500800,K:1323734400,L:1328659200,X:1332892800,Y:1337040000,Z:1340668800,a:1343692800,b:1348531200,c:1352246400,d:1357862400,e:1361404800,f:1364428800,g:1369094400,h:1374105600,i:1376956800,j:1384214400,k:1389657600,l:1392940800,m:1397001600,n:1400544000,o:1405468800,p:1409011200,q:1412640000,r:1416268800,s:1421798400,t:1425513600,u:1429401600,v:1432080000,w:1437523200,x:1441152000,P:1444780800,z:1449014400,AB:1492560000,LB:1496707200,CB:1500940800,JB:1504569600,EB:1508198400,FB:1512518400,GB:1516752000,HB:1520294400,DB:1523923200,U:1527552000,N:1532390400,T:1536019200,MB:1539648000,NB:1543968000,OB:1548720000,PB:1552348800,QB:1555977600,RB:1559606400,SB:1564444800,TB:1568073600,UB:1571702400,V:1575936000,y:1580860800,M:1586304000,WB:1589846400,S:1594684800,gB:null,bB:null,aB:null}},E:{A:{G:0,W:0.004566,I:0.004656,D:0.004465,F:0.004642,E:0.004642,A:0.009284,B:0.018568,C:0.055704,O:0.357434,H:0.013926,"0B":0,YB:0.008692,cB:0.148544,dB:0.00456,eB:0.004283,fB:0.037136,XB:0.051062,R:0.11605,BB:0.199606,jB:2.82698,kB:0},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","0B","YB","G","W","cB","I","dB","D","eB","F","E","fB","A","XB","B","R","C","BB","O","jB","H","kB",""],E:"Safari",F:{"0B":1205798400,YB:1226534400,G:1244419200,W:1275868800,cB:1311120000,I:1343174400,dB:1382400000,D:1382400000,eB:1410998400,F:1413417600,E:1443657600,fB:1458518400,A:1474329600,XB:1490572800,B:1505779200,R:1522281600,C:1537142400,BB:1553472000,O:1568851200,jB:1585008000,H:null,kB:null}},F:{A:{"0":0.004707,"1":0.004827,"2":0.004707,"3":0.004707,"4":0.004326,"5":0.008922,"6":0.014349,"7":0.004725,"8":0.009284,"9":0.009284,E:0.0082,B:0.016581,C:0.004317,Q:0.00685,J:0.00685,K:0.00685,L:0.005014,X:0.006015,Y:0.004879,Z:0.006597,a:0.006597,b:0.013434,c:0.006702,d:0.006015,e:0.005595,f:0.004393,g:0.008652,h:0.004879,i:0.004879,j:0.004711,k:0.005152,l:0.005014,m:0.009758,n:0.004879,o:0.009284,p:0.004283,q:0.004367,r:0.004534,s:0.004367,t:0.004227,u:0.004418,v:0.009042,w:0.004227,x:0.004725,P:0.004417,z:0.008942,AB:0.013926,CB:0.004403,EB:0.004532,FB:0.004566,GB:0.02283,HB:0.00867,DB:0.004656,U:0.004642,N:0.64988,T:0.32494,lB:0.00685,mB:0,nB:0.008392,oB:0.004706,R:0.006229,VB:0.004879,qB:0.008786,BB:0.009284},B:"webkit",C:["","","","","","","","","","","","","","","","","E","lB","mB","nB","oB","B","R","VB","qB","C","BB","Q","J","K","L","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","P","z","0","1","2","3","4","5","6","7","8","9","AB","CB","EB","FB","GB","HB","DB","U","N","T","","",""],E:"Opera",F:{"0":1506470400,"1":1510099200,"2":1515024000,"3":1517961600,"4":1521676800,"5":1525910400,"6":1530144000,"7":1534982400,"8":1537833600,"9":1543363200,E:1150761600,lB:1223424000,mB:1251763200,nB:1267488000,oB:1277942400,B:1292457600,R:1302566400,VB:1309219200,qB:1323129600,C:1323129600,BB:1352073600,Q:1372723200,J:1377561600,K:1381104000,L:1386288000,X:1390867200,Y:1393891200,Z:1399334400,a:1401753600,b:1405987200,c:1409616000,d:1413331200,e:1417132800,f:1422316800,g:1425945600,h:1430179200,i:1433808000,j:1438646400,k:1442448000,l:1445904000,m:1449100800,n:1454371200,o:1457308800,p:1462320000,q:1465344000,r:1470096000,s:1474329600,t:1477267200,u:1481587200,v:1486425600,w:1490054400,x:1494374400,P:1498003200,z:1502236800,AB:1548201600,CB:1554768000,EB:1561593600,FB:1566259200,GB:1570406400,HB:1573689600,DB:1578441600,U:1583971200,N:1587513600,T:1592956800},D:{E:"o",B:"o",C:"o",lB:"o",mB:"o",nB:"o",oB:"o",R:"o",VB:"o",qB:"o",BB:"o"}},G:{A:{F:0,YB:0.00306541,rB:0.00306541,IB:0.00306541,tB:0.00919623,uB:0.00306541,vB:0.0122616,wB:0.0183925,xB:0.0245233,yB:0.202317,zB:0.052112,ZB:0.245233,"1B":0.180859,"2B":0.285083,"3B":0.386242,"4B":2.35117,"5B":0.438354,"6B":0.214579,"7B":2.14272,"8B":5.18054,"9B":0},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","YB","rB","IB","tB","uB","vB","F","wB","xB","yB","zB","ZB","1B","2B","3B","4B","5B","6B","7B","8B","9B","",""],E:"iOS Safari",F:{YB:1270252800,rB:1283904000,IB:1299628800,tB:1331078400,uB:1359331200,vB:1394409600,F:1410912000,wB:1413763200,xB:1442361600,yB:1458518400,zB:1473724800,ZB:1490572800,"1B":1505779200,"2B":1522281600,"3B":1537142400,"4B":1553472000,"5B":1568851200,"6B":1572220800,"7B":1580169600,"8B":1585008000,"9B":null}},H:{A:{AC:0.907827},B:"o",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","AC","","",""],E:"Opera Mini",F:{AC:1426464000}},I:{A:{KB:0,G:0.00758717,M:0,BC:0,CC:0,DC:0.000758717,EC:0.0128982,IB:0.0212441,FC:0,GC:0.134293},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","BC","CC","DC","KB","G","EC","IB","FC","GC","M","","",""],E:"Android Browser",F:{BC:1256515200,CC:1274313600,DC:1291593600,KB:1298332800,G:1318896000,EC:1341792000,IB:1374624000,FC:1386547200,GC:1401667200,M:1587427200}},J:{A:{D:0,A:0.005357},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","D","A","","",""],E:"Blackberry Browser",F:{D:1325376000,A:1359504000}},K:{A:{A:0,B:0,C:0,P:0.0111391,R:0,VB:0,BB:0},B:"o",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","A","B","R","VB","C","BB","P","","",""],E:"Opera Mobile",F:{A:1287100800,B:1300752000,R:1314835200,VB:1318291200,C:1330300800,BB:1349740800,P:1474588800},D:{P:"webkit"}},L:{A:{S:35.3789},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","S","","",""],E:"Chrome for Android",F:{S:1594684800}},M:{A:{N:0.257136},B:"moz",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","N","","",""],E:"Firefox for Android",F:{N:1567468800}},N:{A:{A:0.0115934,B:0.022664},B:"ms",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","A","B","","",""],E:"IE Mobile",F:{A:1340150400,B:1353456000}},O:{A:{HC:1.47318},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","HC","","",""],E:"UC Browser for Android",F:{HC:1471392000},D:{HC:"webkit"}},P:{A:{G:0.300468,IC:0.010361,JC:0.010361,KC:0.0932486,LC:0.0207219,MC:0.176136,XB:0.145053,NC:0.600936,OC:2.25869},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","G","IC","JC","KC","LC","MC","XB","NC","OC","","",""],E:"Samsung Internet",F:{G:1461024000,IC:1481846400,JC:1509408000,KC:1528329600,LC:1546128000,MC:1554163200,XB:1567900800,NC:1582588800,OC:1593475200}},Q:{A:{PC:0.219637},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","PC","","",""],E:"QQ Browser",F:{PC:1589846400}},R:{A:{QC:0},B:"webkit",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","QC","","",""],E:"Baidu Browser",F:{QC:1491004800}},S:{A:{RC:0.05357},B:"moz",C:["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","RC","","",""],E:"KaiOS Browser",F:{RC:1527811200}}};

var agents_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.agents = undefined;







function unpackBrowserVersions(versionsData) {
    return Object.keys(versionsData).reduce(function (usage, version) {
        usage[browserVersions_1.browserVersions[version]] = versionsData[version];
        return usage;
    }, {});
}

var agents$1 = exports.agents = Object.keys(agents).reduce(function (map, key) {
    var versionsData = agents[key];
    map[browsers_1.browsers[key]] = Object.keys(versionsData).reduce(function (data, entry) {
        if (entry === 'A') {
            data.usage_global = unpackBrowserVersions(versionsData[entry]);
        } else if (entry === 'C') {
            data.versions = versionsData[entry].reduce(function (list, version) {
                if (version === '') {
                    list.push(null);
                } else {
                    list.push(browserVersions_1.browserVersions[version]);
                }
                return list;
            }, []);
        } else if (entry === 'D') {
            data.prefix_exceptions = unpackBrowserVersions(versionsData[entry]);
        } else if (entry === 'E') {
            data.browser = versionsData[entry];
        } else if (entry === 'F') {
            data.release_date = Object.keys(versionsData[entry]).reduce(function (map, key) {
                map[browserVersions_1.browserVersions[key]] = versionsData[entry][key];
                return map;
            }, {});
        } else {
            // entry is B
            data.prefix = versionsData[entry];
        }
        return data;
    }, {});
    return map;
}, {});
});

var v4 = {
	start: "2015-09-08",
	lts: "2015-10-12",
	maintenance: "2017-04-01",
	end: "2018-04-30",
	codename: "Argon"
};
var v5 = {
	start: "2015-10-29",
	maintenance: "2016-04-30",
	end: "2016-06-30"
};
var v6 = {
	start: "2016-04-26",
	lts: "2016-10-18",
	maintenance: "2018-04-30",
	end: "2019-04-30",
	codename: "Boron"
};
var v7 = {
	start: "2016-10-25",
	maintenance: "2017-04-30",
	end: "2017-06-30"
};
var v8 = {
	start: "2017-05-30",
	lts: "2017-10-31",
	maintenance: "2019-01-01",
	end: "2019-12-31",
	codename: "Carbon"
};
var v9 = {
	start: "2017-10-01",
	maintenance: "2018-04-01",
	end: "2018-06-30"
};
var v10 = {
	start: "2018-04-24",
	lts: "2018-10-30",
	maintenance: "2020-05-19",
	end: "2021-04-30",
	codename: "Dubnium"
};
var v11 = {
	start: "2018-10-23",
	maintenance: "2019-04-22",
	end: "2019-06-01"
};
var v12 = {
	start: "2019-04-23",
	lts: "2019-10-21",
	maintenance: "2020-10-20",
	end: "2022-04-30",
	codename: "Erbium"
};
var v13 = {
	start: "2019-10-22",
	maintenance: "2020-04-01",
	end: "2020-06-01"
};
var v14 = {
	start: "2020-04-21",
	lts: "2020-10-20",
	maintenance: "2021-10-19",
	end: "2023-04-30",
	codename: ""
};
var v15 = {
	start: "2020-10-21",
	maintenance: "2021-04-01",
	end: "2021-06-01"
};
var releaseSchedule = {
	"v0.10": {
	start: "2013-03-11",
	end: "2016-10-31"
},
	"v0.12": {
	start: "2015-02-06",
	end: "2016-12-31"
},
	v4: v4,
	v5: v5,
	v6: v6,
	v7: v7,
	v8: v8,
	v9: v9,
	v10: v10,
	v11: v11,
	v12: v12,
	v13: v13,
	v14: v14,
	v15: v15
};

var releaseSchedule$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  v4: v4,
  v5: v5,
  v6: v6,
  v7: v7,
  v8: v8,
  v9: v9,
  v10: v10,
  v11: v11,
  v12: v12,
  v13: v13,
  v14: v14,
  v15: v15,
  'default': releaseSchedule
});

var versions = {
	"0.20": "39",
	"0.21": "41",
	"0.22": "41",
	"0.23": "41",
	"0.24": "41",
	"0.25": "42",
	"0.26": "42",
	"0.27": "43",
	"0.28": "43",
	"0.29": "43",
	"0.30": "44",
	"0.31": "45",
	"0.32": "45",
	"0.33": "45",
	"0.34": "45",
	"0.35": "45",
	"0.36": "47",
	"0.37": "49",
	"1.0": "49",
	"1.1": "50",
	"1.2": "51",
	"1.3": "52",
	"1.4": "53",
	"1.5": "54",
	"1.6": "56",
	"1.7": "58",
	"1.8": "59",
	"2.0": "61",
	"2.1": "61",
	"3.0": "66",
	"3.1": "66",
	"4.0": "69",
	"4.1": "69",
	"4.2": "69",
	"5.0": "73",
	"6.0": "76",
	"6.1": "76",
	"7.0": "78",
	"7.1": "78",
	"7.2": "78",
	"7.3": "78",
	"8.0": "80",
	"8.1": "80",
	"8.2": "80",
	"8.3": "80",
	"8.4": "80",
	"8.5": "80",
	"9.0": "83",
	"9.1": "83",
	"9.2": "83",
	"10.0": "85"
};

function BrowserslistError (message) {
  this.name = 'BrowserslistError';
  this.message = message;
  this.browserslist = true;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, BrowserslistError);
  }
}

BrowserslistError.prototype = Error.prototype;

var error = BrowserslistError;

var statuses = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    1: "ls", // WHATWG Living Standard
    2: "rec", // W3C Recommendation
    3: "pr", // W3C Proposed Recommendation
    4: "cr", // W3C Candidate Recommendation
    5: "wd", // W3C Working Draft
    6: "other", // Non-W3C, but reputable
    7: "unoff" // Unofficial, Editor's Draft or W3C "Note"
};
});

var supported = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    y: 1 << 0,
    n: 1 << 1,
    a: 1 << 2,
    p: 1 << 3,
    u: 1 << 4,
    x: 1 << 5,
    d: 1 << 6
};
});

var feature = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = unpackFeature;



var _statuses2 = _interopRequireDefault(statuses);



var _supported2 = _interopRequireDefault(supported);





function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MATH2LOG = Math.log(2);

function unpackSupport(cipher) {
    // bit flags
    var stats = Object.keys(_supported2.default).reduce(function (list, support) {
        if (cipher & _supported2.default[support]) list.push(support);
        return list;
    }, []);

    // notes
    var notes = cipher >> 7;
    var notesArray = [];
    while (notes) {
        var note = Math.floor(Math.log(notes) / MATH2LOG) + 1;
        notesArray.unshift('#' + note);
        notes -= Math.pow(2, note - 1);
    }

    return stats.concat(notesArray).join(' ');
}

function unpackFeature(packed) {
    var unpacked = { status: _statuses2.default[packed.B], title: packed.C };
    unpacked.stats = Object.keys(packed.A).reduce(function (browserStats, key) {
        var browser = packed.A[key];
        browserStats[browsers_1.browsers[key]] = Object.keys(browser).reduce(function (stats, support) {
            var packedVersions = browser[support].split(' ');
            var unpacked = unpackSupport(support);
            packedVersions.forEach(function (v) {
                return stats[browserVersions_1.browserVersions[v]] = unpacked;
            });
            return stats;
        }, {});
        return browserStats;
    }, {});
    return unpacked;
}
});

var region = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = unpackRegion;



function unpackRegion(packed) {
    return Object.keys(packed).reduce(function (list, browser) {
        var data = packed[browser];
        list[browsers_1.browsers[browser]] = Object.keys(data).reduce(function (memo, key) {
            var stats = data[key];
            if (key === '_') {
                stats.split(' ').forEach(function (version) {
                    return memo[version] = null;
                });
            } else {
                memo[key] = stats;
            }
            return memo;
        }, {});
        return list;
    }, {});
}
});

var node = createCommonjsModule(function (module) {
var feature$1 = feature.default;
var region$1 = region.default;





var IS_SECTION = /^\s*\[(.+)]\s*$/;
var CONFIG_PATTERN = /^browserslist-config-/;
var SCOPED_CONFIG__PATTERN = /@[^/]+\/browserslist-config(-|$|\/)/;
var TIME_TO_UPDATE_CANIUSE = 6 * 30 * 24 * 60 * 60 * 1000;
var FORMAT = 'Browserslist config should be a string or an array ' +
             'of strings with browser queries';

var dataTimeChecked = false;
var filenessCache = { };
var configCache = { };
function checkExtend (name) {
  var use = ' Use `dangerousExtend` option to disable.';
  if (!CONFIG_PATTERN.test(name) && !SCOPED_CONFIG__PATTERN.test(name)) {
    throw new error(
      'Browserslist config needs `browserslist-config-` prefix. ' + use)
  }
  if (name.replace(/^@[^/]+\//, '').indexOf('.') !== -1) {
    throw new error(
      '`.` not allowed in Browserslist config name. ' + use)
  }
  if (name.indexOf('node_modules') !== -1) {
    throw new error(
      '`node_modules` not allowed in Browserslist config.' + use)
  }
}

function isFile (file) {
  if (file in filenessCache) {
    return filenessCache[file]
  }
  var result = fs.existsSync(file) && fs.statSync(file).isFile();
  if (!process.env.BROWSERSLIST_DISABLE_CACHE) {
    filenessCache[file] = result;
  }
  return result
}

function eachParent (file, callback) {
  var dir = isFile(file) ? path.dirname(file) : file;
  var loc = path.resolve(dir);
  do {
    var result = callback(loc);
    if (typeof result !== 'undefined') return result
  } while (loc !== (loc = path.dirname(loc)))
  return undefined
}

function check (section) {
  if (Array.isArray(section)) {
    for (var i = 0; i < section.length; i++) {
      if (typeof section[i] !== 'string') {
        throw new error(FORMAT)
      }
    }
  } else if (typeof section !== 'string') {
    throw new error(FORMAT)
  }
}

function pickEnv (config, opts) {
  if (typeof config !== 'object') return config

  var name;
  if (typeof opts.env === 'string') {
    name = opts.env;
  } else if (process.env.BROWSERSLIST_ENV) {
    name = process.env.BROWSERSLIST_ENV;
  } else if (process.env.NODE_ENV) {
    name = process.env.NODE_ENV;
  } else {
    name = 'production';
  }

  return config[name] || config.defaults
}

function parsePackage (file) {
  var config = JSON.parse(fs.readFileSync(file));
  if (config.browserlist && !config.browserslist) {
    throw new error(
      '`browserlist` key instead of `browserslist` in ' + file
    )
  }
  var list = config.browserslist;
  if (Array.isArray(list) || typeof list === 'string') {
    list = { defaults: list };
  }
  for (var i in list) {
    check(list[i]);
  }

  return list
}

function latestReleaseTime (agents) {
  var latest = 0;
  for (var name in agents) {
    var dates = agents[name].releaseDate || { };
    for (var key in dates) {
      if (latest < dates[key]) {
        latest = dates[key];
      }
    }
  }
  return latest * 1000
}

function normalizeStats (data, stats) {
  if (stats && 'dataByBrowser' in stats) {
    stats = stats.dataByBrowser;
  }

  if (typeof stats !== 'object') return undefined

  var normalized = { };
  for (var i in stats) {
    var versions = Object.keys(stats[i]);
    if (
      versions.length === 1 &&
      data[i] &&
      data[i].versions.length === 1
    ) {
      var normal = Object.keys(data[i].versions)[0];
      normalized[i] = { };
      normalized[i][normal] = stats[i][versions[0]];
    } else {
      normalized[i] = stats[i];
    }
  }

  return normalized
}

function normalizeUsageData (usageData, data) {
  for (var browser in usageData) {
    var browserUsage = usageData[browser];
    // eslint-disable-next-line max-len
    // https://github.com/browserslist/browserslist/issues/431#issuecomment-565230615
    // caniuse-db returns { 0: "percentage" } for `and_*` regional stats
    if ('0' in browserUsage) {
      var versions = data[browser].versions;
      browserUsage[versions[versions.length - 1]] = browserUsage[0];
      delete browserUsage[0];
    }
  }
}

module.exports = {
  loadQueries: function loadQueries (context, name) {
    if (!context.dangerousExtend) checkExtend(name);
    // eslint-disable-next-line security/detect-non-literal-require
    var queries = commonjsRequire(require.resolve(name, { paths: ['.'] }));
    if (queries) {
      if (Array.isArray(queries)) {
        return queries
      } else if (typeof queries === 'object') {
        if (!queries.defaults) queries.defaults = [];
        return pickEnv(queries, context)
      }
    }
    throw new error(
      '`' + name + '` config exports not an array of queries' +
      ' or an object of envs'
    )
  },

  loadStat: function loadStat (context, name, data) {
    if (!context.dangerousExtend) checkExtend(name);
    // eslint-disable-next-line security/detect-non-literal-require
    var stats = commonjsRequire(
      require.resolve(
        path.join(name, 'browserslist-stats.json'),
        { paths: ['.'] }
      )
    );
    return normalizeStats(data, stats)
  },

  getStat: function getStat (opts, data) {
    var stats;
    if (opts.stats) {
      stats = opts.stats;
    } else if (process.env.BROWSERSLIST_STATS) {
      stats = process.env.BROWSERSLIST_STATS;
    } else if (opts.path && path.resolve && fs.existsSync) {
      stats = eachParent(opts.path, function (dir) {
        var file = path.join(dir, 'browserslist-stats.json');
        return isFile(file) ? file : undefined
      });
    }
    if (typeof stats === 'string') {
      try {
        stats = JSON.parse(fs.readFileSync(stats));
      } catch (e) {
        throw new error('Can\'t read ' + stats)
      }
    }
    return normalizeStats(data, stats)
  },

  loadConfig: function loadConfig (opts) {
    if (process.env.BROWSERSLIST) {
      return process.env.BROWSERSLIST
    } else if (opts.config || process.env.BROWSERSLIST_CONFIG) {
      var file = opts.config || process.env.BROWSERSLIST_CONFIG;
      if (path.basename(file) === 'package.json') {
        return pickEnv(parsePackage(file), opts)
      } else {
        return pickEnv(module.exports.readConfig(file), opts)
      }
    } else if (opts.path) {
      return pickEnv(module.exports.findConfig(opts.path), opts)
    } else {
      return undefined
    }
  },

  loadCountry: function loadCountry (usage, country, data) {
    var code = country.replace(/[^\w-]/g, '');
    if (!usage[code]) {
      // eslint-disable-next-line security/detect-non-literal-require
      var compressed = commonjsRequire();
      var usageData = region$1(compressed);
      normalizeUsageData(usageData, data);
      usage[country] = { };
      for (var i in usageData) {
        for (var j in usageData[i]) {
          usage[country][i + ' ' + j] = usageData[i][j];
        }
      }
    }
  },

  loadFeature: function loadFeature (features, name) {
    name = name.replace(/[^\w-]/g, '');
    if (features[name]) return

    // eslint-disable-next-line security/detect-non-literal-require
    var compressed = commonjsRequire();
    var stats = feature$1(compressed).stats;
    features[name] = { };
    for (var i in stats) {
      for (var j in stats[i]) {
        features[name][i + ' ' + j] = stats[i][j];
      }
    }
  },

  parseConfig: function parseConfig (string) {
    var result = { defaults: [] };
    var sections = ['defaults'];

    string.toString()
      .replace(/#[^\n]*/g, '')
      .split(/\n|,/)
      .map(function (line) {
        return line.trim()
      })
      .filter(function (line) {
        return line !== ''
      })
      .forEach(function (line) {
        if (IS_SECTION.test(line)) {
          sections = line.match(IS_SECTION)[1].trim().split(' ');
          sections.forEach(function (section) {
            if (result[section]) {
              throw new error(
                'Duplicate section ' + section + ' in Browserslist config'
              )
            }
            result[section] = [];
          });
        } else {
          sections.forEach(function (section) {
            result[section].push(line);
          });
        }
      });

    return result
  },

  readConfig: function readConfig (file) {
    if (!isFile(file)) {
      throw new error('Can\'t read ' + file + ' config')
    }
    return module.exports.parseConfig(fs.readFileSync(file))
  },

  findConfig: function findConfig (from) {
    from = path.resolve(from);

    var passed = [];
    var resolved = eachParent(from, function (dir) {
      if (dir in configCache) {
        return configCache[dir]
      }

      passed.push(dir);

      var config = path.join(dir, 'browserslist');
      var pkg = path.join(dir, 'package.json');
      var rc = path.join(dir, '.browserslistrc');

      var pkgBrowserslist;
      if (isFile(pkg)) {
        try {
          pkgBrowserslist = parsePackage(pkg);
        } catch (e) {
          if (e.name === 'BrowserslistError') throw e
          console.warn(
            '[Browserslist] Could not parse ' + pkg + '. Ignoring it.'
          );
        }
      }

      if (isFile(config) && pkgBrowserslist) {
        throw new error(
          dir + ' contains both browserslist and package.json with browsers'
        )
      } else if (isFile(rc) && pkgBrowserslist) {
        throw new error(
          dir + ' contains both .browserslistrc and package.json with browsers'
        )
      } else if (isFile(config) && isFile(rc)) {
        throw new error(
          dir + ' contains both .browserslistrc and browserslist'
        )
      } else if (isFile(config)) {
        return module.exports.readConfig(config)
      } else if (isFile(rc)) {
        return module.exports.readConfig(rc)
      } else {
        return pkgBrowserslist
      }
    });
    if (!process.env.BROWSERSLIST_DISABLE_CACHE) {
      passed.forEach(function (dir) {
        configCache[dir] = resolved;
      });
    }
    return resolved
  },

  clearCaches: function clearCaches () {
    dataTimeChecked = false;
    filenessCache = { };
    configCache = { };

    this.cache = { };
  },

  oldDataWarning: function oldDataWarning (agentsObj) {
    if (dataTimeChecked) return
    dataTimeChecked = true;
    if (process.env.BROWSERSLIST_IGNORE_OLD_DATA) return

    var latest = latestReleaseTime(agentsObj);
    var halfYearAgo = Date.now() - TIME_TO_UPDATE_CANIUSE;

    if (latest !== 0 && latest < halfYearAgo) {
      console.warn(
        'Browserslist: caniuse-lite is outdated. Please run:\n' +
        'npx browserslist@latest --update-db'
      );
    }
  },

  currentNode: function currentNode () {
    return 'node ' + process.versions.node
  }
};
});

var jsReleases = getCjsExportFromNamespace(envs$1);

var jsEOL = getCjsExportFromNamespace(releaseSchedule$1);

var agents$1 = agents_1.agents;





 // Will load browser.js in webpack

var YEAR = 365.259641 * 24 * 60 * 60 * 1000;
var ANDROID_EVERGREEN_FIRST = 37;

var QUERY_OR = 1;
var QUERY_AND = 2;

function isVersionsMatch (versionA, versionB) {
  return (versionA + '.').indexOf(versionB + '.') === 0
}

function isEolReleased (name) {
  var version = name.slice(1);
  return jsReleases.some(function (i) {
    return isVersionsMatch(i.version, version)
  })
}

function normalize (versions) {
  return versions.filter(function (version) {
    return typeof version === 'string'
  })
}

function normalizeElectron (version) {
  var versionToUse = version;
  if (version.split('.').length === 3) {
    versionToUse = version
      .split('.')
      .slice(0, -1)
      .join('.');
  }
  return versionToUse
}

function nameMapper (name) {
  return function mapName (version) {
    return name + ' ' + version
  }
}

function getMajor (version) {
  return parseInt(version.split('.')[0])
}

function getMajorVersions (released, number) {
  if (released.length === 0) return []
  var majorVersions = uniq(released.map(getMajor));
  var minimum = majorVersions[majorVersions.length - number];
  if (!minimum) {
    return released
  }
  var selected = [];
  for (var i = released.length - 1; i >= 0; i--) {
    if (minimum > getMajor(released[i])) break
    selected.unshift(released[i]);
  }
  return selected
}

function uniq (array) {
  var filtered = [];
  for (var i = 0; i < array.length; i++) {
    if (filtered.indexOf(array[i]) === -1) filtered.push(array[i]);
  }
  return filtered
}

// Helpers

function fillUsage (result, name, data) {
  for (var i in data) {
    result[name + ' ' + i] = data[i];
  }
}

function generateFilter (sign, version) {
  version = parseFloat(version);
  if (sign === '>') {
    return function (v) {
      return parseFloat(v) > version
    }
  } else if (sign === '>=') {
    return function (v) {
      return parseFloat(v) >= version
    }
  } else if (sign === '<') {
    return function (v) {
      return parseFloat(v) < version
    }
  } else {
    return function (v) {
      return parseFloat(v) <= version
    }
  }
}

function generateSemverFilter (sign, version) {
  version = version.split('.').map(parseSimpleInt);
  version[1] = version[1] || 0;
  version[2] = version[2] || 0;
  if (sign === '>') {
    return function (v) {
      v = v.split('.').map(parseSimpleInt);
      return compareSemver(v, version) > 0
    }
  } else if (sign === '>=') {
    return function (v) {
      v = v.split('.').map(parseSimpleInt);
      return compareSemver(v, version) >= 0
    }
  } else if (sign === '<') {
    return function (v) {
      v = v.split('.').map(parseSimpleInt);
      return compareSemver(version, v) > 0
    }
  } else {
    return function (v) {
      v = v.split('.').map(parseSimpleInt);
      return compareSemver(version, v) >= 0
    }
  }
}

function parseSimpleInt (x) {
  return parseInt(x)
}

function compare$3 (a, b) {
  if (a < b) return -1
  if (a > b) return +1
  return 0
}

function compareSemver (a, b) {
  return (
    compare$3(parseInt(a[0]), parseInt(b[0])) ||
    compare$3(parseInt(a[1] || '0'), parseInt(b[1] || '0')) ||
    compare$3(parseInt(a[2] || '0'), parseInt(b[2] || '0'))
  )
}

// this follows the npm-like semver behavior
function semverFilterLoose (operator, range) {
  range = range.split('.').map(parseSimpleInt);
  if (typeof range[1] === 'undefined') {
    range[1] = 'x';
  }
  // ignore any patch version because we only return minor versions
  // range[2] = 'x'
  switch (operator) {
    case '<=':
      return function (version) {
        version = version.split('.').map(parseSimpleInt);
        return compareSemverLoose(version, range) <= 0
      }
    default:
    case '>=':
      return function (version) {
        version = version.split('.').map(parseSimpleInt);
        return compareSemverLoose(version, range) >= 0
      }
  }
}

// this follows the npm-like semver behavior
function compareSemverLoose (version, range) {
  if (version[0] !== range[0]) {
    return version[0] < range[0] ? -1 : +1
  }
  if (range[1] === 'x') {
    return 0
  }
  if (version[1] !== range[1]) {
    return version[1] < range[1] ? -1 : +1
  }
  return 0
}

function resolveVersion (data, version) {
  if (data.versions.indexOf(version) !== -1) {
    return version
  } else if (browserslist.versionAliases[data.name][version]) {
    return browserslist.versionAliases[data.name][version]
  } else {
    return false
  }
}

function normalizeVersion (data, version) {
  var resolved = resolveVersion(data, version);
  if (resolved) {
    return resolved
  } else if (data.versions.length === 1) {
    return data.versions[0]
  } else {
    return false
  }
}

function filterByYear (since, context) {
  since = since / 1000;
  return Object.keys(agents$1).reduce(function (selected, name) {
    var data = byName(name, context);
    if (!data) return selected
    var versions = Object.keys(data.releaseDate).filter(function (v) {
      return data.releaseDate[v] >= since
    });
    return selected.concat(versions.map(nameMapper(data.name)))
  }, [])
}

function cloneData (data) {
  return {
    name: data.name,
    versions: data.versions,
    released: data.released,
    releaseDate: data.releaseDate
  }
}

function mapVersions (data, map) {
  data.versions = data.versions.map(function (i) {
    return map[i] || i
  });
  data.released = data.versions.map(function (i) {
    return map[i] || i
  });
  var fixedDate = { };
  for (var i in data.releaseDate) {
    fixedDate[map[i] || i] = data.releaseDate[i];
  }
  data.releaseDate = fixedDate;
  return data
}

function byName (name, context) {
  name = name.toLowerCase();
  name = browserslist.aliases[name] || name;
  if (context.mobileToDesktop && browserslist.desktopNames[name]) {
    var desktop = browserslist.data[browserslist.desktopNames[name]];
    if (name === 'android') {
      return normalizeAndroidData(cloneData(browserslist.data[name]), desktop)
    } else {
      var cloned = cloneData(desktop);
      cloned.name = name;
      if (name === 'op_mob') {
        cloned = mapVersions(cloned, { '10.0-10.1': '10' });
      }
      return cloned
    }
  }
  return browserslist.data[name]
}

function normalizeAndroidVersions (androidVersions, chromeVersions) {
  var firstEvergreen = ANDROID_EVERGREEN_FIRST;
  var last = chromeVersions[chromeVersions.length - 1];
  return androidVersions
    .filter(function (version) { return /^(?:[2-4]\.|[34]$)/.test(version) })
    .concat(chromeVersions.slice(firstEvergreen - last - 1))
}

function normalizeAndroidData (android, chrome) {
  android.released = normalizeAndroidVersions(android.released, chrome.released);
  android.versions = normalizeAndroidVersions(android.versions, chrome.versions);
  return android
}

function checkName (name, context) {
  var data = byName(name, context);
  if (!data) throw new error('Unknown browser ' + name)
  return data
}

function unknownQuery (query) {
  return new error(
    'Unknown browser query `' + query + '`. ' +
    'Maybe you are using old Browserslist or made typo in query.'
  )
}

function filterAndroid (list, versions, context) {
  if (context.mobileToDesktop) return list
  var released = browserslist.data.android.released;
  var last = released[released.length - 1];
  var diff = last - ANDROID_EVERGREEN_FIRST - versions;
  if (diff > 0) {
    return list.slice(-1)
  } else {
    return list.slice(diff - 1)
  }
}

/**
 * Resolves queries into a browser list.
 * @param {string|string[]} queries Queries to combine.
 * Either an array of queries or a long string of queries.
 * @param {object} [context] Optional arguments to
 * the select function in `queries`.
 * @returns {string[]} A list of browsers
 */
function resolve (queries, context) {
  if (Array.isArray(queries)) {
    queries = flatten(queries.map(parse$1));
  } else {
    queries = parse$1(queries);
  }

  return queries.reduce(function (result, query, index) {
    var selection = query.queryString;

    var isExclude = selection.indexOf('not ') === 0;
    if (isExclude) {
      if (index === 0) {
        throw new error(
          'Write any browsers query (for instance, `defaults`) ' +
          'before `' + selection + '`')
      }
      selection = selection.slice(4);
    }

    for (var i = 0; i < QUERIES.length; i++) {
      var type = QUERIES[i];
      var match = selection.match(type.regexp);
      if (match) {
        var args = [context].concat(match.slice(1));
        var array = type.select.apply(browserslist, args).map(function (j) {
          var parts = j.split(' ');
          if (parts[1] === '0') {
            return parts[0] + ' ' + byName(parts[0], context).versions[0]
          } else {
            return j
          }
        });

        switch (query.type) {
          case QUERY_AND:
            if (isExclude) {
              return result.filter(function (j) {
                return array.indexOf(j) === -1
              })
            } else {
              return result.filter(function (j) {
                return array.indexOf(j) !== -1
              })
            }
          case QUERY_OR:
          default:
            if (isExclude) {
              var filter = { };
              array.forEach(function (j) {
                filter[j] = true;
              });
              return result.filter(function (j) {
                return !filter[j]
              })
            }
            return result.concat(array)
        }
      }
    }

    throw unknownQuery(selection)
  }, [])
}

var cache = { };

/**
 * Return array of browsers by selection queries.
 *
 * @param {(string|string[])} [queries=browserslist.defaults] Browser queries.
 * @param {object} [opts] Options.
 * @param {string} [opts.path="."] Path to processed file.
 *                                 It will be used to find config files.
 * @param {string} [opts.env="production"] Processing environment.
 *                                         It will be used to take right
 *                                         queries from config file.
 * @param {string} [opts.config] Path to config file with queries.
 * @param {object} [opts.stats] Custom browser usage statistics
 *                              for "> 1% in my stats" query.
 * @param {boolean} [opts.ignoreUnknownVersions=false] Do not throw on unknown
 *                                                     version in direct query.
 * @param {boolean} [opts.dangerousExtend] Disable security checks
 *                                         for extend query.
 * @param {boolean} [opts.mobileToDesktop] Alias mobile browsers to the desktop
 *                                         version when Can I Use doesn't have
 *                                         data about the specified version.
 * @returns {string[]} Array with browser names in Can I Use.
 *
 * @example
 * browserslist('IE >= 10, IE 8') //=> ['ie 11', 'ie 10', 'ie 8']
 */
function browserslist (queries, opts) {
  if (typeof opts === 'undefined') opts = { };

  if (typeof opts.path === 'undefined') {
    opts.path = path.resolve ? path.resolve('.') : '.';
  }

  if (typeof queries === 'undefined' || queries === null) {
    var config = browserslist.loadConfig(opts);
    if (config) {
      queries = config;
    } else {
      queries = browserslist.defaults;
    }
  }

  if (!(typeof queries === 'string' || Array.isArray(queries))) {
    throw new error(
      'Browser queries must be an array or string. Got ' + typeof queries + '.')
  }

  var context = {
    ignoreUnknownVersions: opts.ignoreUnknownVersions,
    dangerousExtend: opts.dangerousExtend,
    mobileToDesktop: opts.mobileToDesktop,
    env: opts.env
  };

  node.oldDataWarning(browserslist.data);
  var stats = node.getStat(opts, browserslist.data);
  if (stats) {
    context.customUsage = { };
    for (var browser in stats) {
      fillUsage(context.customUsage, browser, stats[browser]);
    }
  }

  var cacheKey = JSON.stringify([queries, context]);
  if (cache[cacheKey]) return cache[cacheKey]

  var result = uniq(resolve(queries, context)).sort(function (name1, name2) {
    name1 = name1.split(' ');
    name2 = name2.split(' ');
    if (name1[0] === name2[0]) {
      // assumptions on caniuse data
      // 1) version ranges never overlaps
      // 2) if version is not a range, it never contains `-`
      var version1 = name1[1].split('-')[0];
      var version2 = name2[1].split('-')[0];
      return compareSemver(version2.split('.'), version1.split('.'))
    } else {
      return compare$3(name1[0], name2[0])
    }
  });
  if (!process.env.BROWSERSLIST_DISABLE_CACHE) {
    cache[cacheKey] = result;
  }
  return result
}

function parse$1 (queries) {
  var qs = [];
  do {
    queries = doMatch(queries, qs);
  } while (queries)
  return qs
}

function doMatch (string, qs) {
  var or = /^(?:,\s*|\s+or\s+)(.*)/i;
  var and = /^\s+and\s+(.*)/i;

  return find(string, function (parsed, n, max) {
    if (and.test(parsed)) {
      qs.unshift({ type: QUERY_AND, queryString: parsed.match(and)[1] });
      return true
    } else if (or.test(parsed)) {
      qs.unshift({ type: QUERY_OR, queryString: parsed.match(or)[1] });
      return true
    } else if (n === max) {
      qs.unshift({ type: QUERY_OR, queryString: parsed.trim() });
      return true
    }
    return false
  })
}

function find (string, predicate) {
  for (var n = 1, max = string.length; n <= max; n++) {
    var parsed = string.substr(-n, n);
    if (predicate(parsed, n, max)) {
      return string.slice(0, -n)
    }
  }
  return ''
}

function flatten (array) {
  if (!Array.isArray(array)) return [array]
  return array.reduce(function (a, b) {
    return a.concat(flatten(b))
  }, [])
}

// Will be filled by Can I Use data below
browserslist.cache = { };
browserslist.data = { };
browserslist.usage = {
  global: { },
  custom: null
};

// Default browsers query
browserslist.defaults = [
  '> 0.5%',
  'last 2 versions',
  'Firefox ESR',
  'not dead'
];

// Browser names aliases
browserslist.aliases = {
  fx: 'firefox',
  ff: 'firefox',
  ios: 'ios_saf',
  explorer: 'ie',
  blackberry: 'bb',
  explorermobile: 'ie_mob',
  operamini: 'op_mini',
  operamobile: 'op_mob',
  chromeandroid: 'and_chr',
  firefoxandroid: 'and_ff',
  ucandroid: 'and_uc',
  qqandroid: 'and_qq'
};

// Can I Use only provides a few versions for some browsers (e.g. and_chr).
// Fallback to a similar browser for unknown versions
browserslist.desktopNames = {
  and_chr: 'chrome',
  and_ff: 'firefox',
  ie_mob: 'ie',
  op_mob: 'opera',
  android: 'chrome' // has extra processing logic
};

// Aliases to work with joined versions like `ios_saf 7.0-7.1`
browserslist.versionAliases = { };

browserslist.clearCaches = node.clearCaches;
browserslist.parseConfig = node.parseConfig;
browserslist.readConfig = node.readConfig;
browserslist.findConfig = node.findConfig;
browserslist.loadConfig = node.loadConfig;

/**
 * Return browsers market coverage.
 *
 * @param {string[]} browsers Browsers names in Can I Use.
 * @param {string|object} [stats="global"] Which statistics should be used.
 *                                         Country code or custom statistics.
 *                                         Pass `"my stats"` to load statistics
 *                                         from Browserslist files.
 *
 * @return {number} Total market coverage for all selected browsers.
 *
 * @example
 * browserslist.coverage(browserslist('> 1% in US'), 'US') //=> 83.1
 */
browserslist.coverage = function (browsers, stats) {
  var data;
  if (typeof stats === 'undefined') {
    data = browserslist.usage.global;
  } else if (stats === 'my stats') {
    var opts = {};
    opts.path = path.resolve ? path.resolve('.') : '.';
    var customStats = node.getStat(opts);
    if (!customStats) {
      throw new error('Custom usage statistics was not provided')
    }
    data = {};
    for (var browser in customStats) {
      fillUsage(data, browser, customStats[browser]);
    }
  } else if (typeof stats === 'string') {
    if (stats.length > 2) {
      stats = stats.toLowerCase();
    } else {
      stats = stats.toUpperCase();
    }
    node.loadCountry(browserslist.usage, stats, browserslist.data);
    data = browserslist.usage[stats];
  } else {
    if ('dataByBrowser' in stats) {
      stats = stats.dataByBrowser;
    }
    data = { };
    for (var name in stats) {
      for (var version in stats[name]) {
        data[name + ' ' + version] = stats[name][version];
      }
    }
  }

  return browsers.reduce(function (all, i) {
    var usage = data[i];
    if (usage === undefined) {
      usage = data[i.replace(/ \S+$/, ' 0')];
    }
    return all + (usage || 0)
  }, 0)
};

var QUERIES = [
  {
    regexp: /^last\s+(\d+)\s+major\s+versions?$/i,
    select: function (context, versions) {
      return Object.keys(agents$1).reduce(function (selected, name) {
        var data = byName(name, context);
        if (!data) return selected
        var list = getMajorVersions(data.released, versions);
        list = list.map(nameMapper(data.name));
        if (data.name === 'android') {
          list = filterAndroid(list, versions, context);
        }
        return selected.concat(list)
      }, [])
    }
  },
  {
    regexp: /^last\s+(\d+)\s+versions?$/i,
    select: function (context, versions) {
      return Object.keys(agents$1).reduce(function (selected, name) {
        var data = byName(name, context);
        if (!data) return selected
        var list = data.released.slice(-versions);
        list = list.map(nameMapper(data.name));
        if (data.name === 'android') {
          list = filterAndroid(list, versions, context);
        }
        return selected.concat(list)
      }, [])
    }
  },
  {
    regexp: /^last\s+(\d+)\s+electron\s+major\s+versions?$/i,
    select: function (context, versions$1) {
      var validVersions = getMajorVersions(Object.keys(versions), versions$1);
      return validVersions.map(function (i) {
        return 'chrome ' + versions[i]
      })
    }
  },
  {
    regexp: /^last\s+(\d+)\s+(\w+)\s+major\s+versions?$/i,
    select: function (context, versions, name) {
      var data = checkName(name, context);
      var validVersions = getMajorVersions(data.released, versions);
      var list = validVersions.map(nameMapper(data.name));
      if (data.name === 'android') {
        list = filterAndroid(list, versions, context);
      }
      return list
    }
  },
  {
    regexp: /^last\s+(\d+)\s+electron\s+versions?$/i,
    select: function (context, versions$1) {
      return Object.keys(versions).reverse().slice(-versions$1).map(function (i) {
        return 'chrome ' + versions[i]
      })
    }
  },
  {
    regexp: /^last\s+(\d+)\s+(\w+)\s+versions?$/i,
    select: function (context, versions, name) {
      var data = checkName(name, context);
      var list = data.released.slice(-versions).map(nameMapper(data.name));
      if (data.name === 'android') {
        list = filterAndroid(list, versions, context);
      }
      return list
    }
  },
  {
    regexp: /^unreleased\s+versions$/i,
    select: function (context) {
      return Object.keys(agents$1).reduce(function (selected, name) {
        var data = byName(name, context);
        if (!data) return selected
        var list = data.versions.filter(function (v) {
          return data.released.indexOf(v) === -1
        });
        list = list.map(nameMapper(data.name));
        return selected.concat(list)
      }, [])
    }
  },
  {
    regexp: /^unreleased\s+electron\s+versions?$/i,
    select: function () {
      return []
    }
  },
  {
    regexp: /^unreleased\s+(\w+)\s+versions?$/i,
    select: function (context, name) {
      var data = checkName(name, context);
      return data.versions.filter(function (v) {
        return data.released.indexOf(v) === -1
      }).map(nameMapper(data.name))
    }
  },
  {
    regexp: /^last\s+(\d*.?\d+)\s+years?$/i,
    select: function (context, years) {
      return filterByYear(Date.now() - YEAR * years, context)
    }
  },
  {
    regexp: /^since (\d+)(?:-(\d+))?(?:-(\d+))?$/i,
    select: function (context, year, month, date) {
      year = parseInt(year);
      month = parseInt(month || '01') - 1;
      date = parseInt(date || '01');
      return filterByYear(Date.UTC(year, month, date, 0, 0, 0), context)
    }
  },
  {
    regexp: /^(>=?|<=?)\s*(\d*\.?\d+)%$/,
    select: function (context, sign, popularity) {
      popularity = parseFloat(popularity);
      var usage = browserslist.usage.global;
      return Object.keys(usage).reduce(function (result, version) {
        if (sign === '>') {
          if (usage[version] > popularity) {
            result.push(version);
          }
        } else if (sign === '<') {
          if (usage[version] < popularity) {
            result.push(version);
          }
        } else if (sign === '<=') {
          if (usage[version] <= popularity) {
            result.push(version);
          }
        } else if (usage[version] >= popularity) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^(>=?|<=?)\s*(\d*\.?\d+)%\s+in\s+my\s+stats$/,
    select: function (context, sign, popularity) {
      popularity = parseFloat(popularity);
      if (!context.customUsage) {
        throw new error('Custom usage statistics was not provided')
      }
      var usage = context.customUsage;
      return Object.keys(usage).reduce(function (result, version) {
        if (sign === '>') {
          if (usage[version] > popularity) {
            result.push(version);
          }
        } else if (sign === '<') {
          if (usage[version] < popularity) {
            result.push(version);
          }
        } else if (sign === '<=') {
          if (usage[version] <= popularity) {
            result.push(version);
          }
        } else if (usage[version] >= popularity) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^(>=?|<=?)\s*(\d*\.?\d+)%\s+in\s+(\S+)\s+stats$/,
    select: function (context, sign, popularity, name) {
      popularity = parseFloat(popularity);
      var stats = node.loadStat(context, name, browserslist.data);
      if (stats) {
        context.customUsage = { };
        for (var browser in stats) {
          fillUsage(context.customUsage, browser, stats[browser]);
        }
      }
      if (!context.customUsage) {
        throw new error('Custom usage statistics was not provided')
      }
      var usage = context.customUsage;
      return Object.keys(usage).reduce(function (result, version) {
        if (sign === '>') {
          if (usage[version] > popularity) {
            result.push(version);
          }
        } else if (sign === '<') {
          if (usage[version] < popularity) {
            result.push(version);
          }
        } else if (sign === '<=') {
          if (usage[version] <= popularity) {
            result.push(version);
          }
        } else if (usage[version] >= popularity) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^(>=?|<=?)\s*(\d*\.?\d+)%\s+in\s+((alt-)?\w\w)$/,
    select: function (context, sign, popularity, place) {
      popularity = parseFloat(popularity);
      if (place.length === 2) {
        place = place.toUpperCase();
      } else {
        place = place.toLowerCase();
      }
      node.loadCountry(browserslist.usage, place, browserslist.data);
      var usage = browserslist.usage[place];
      return Object.keys(usage).reduce(function (result, version) {
        if (sign === '>') {
          if (usage[version] > popularity) {
            result.push(version);
          }
        } else if (sign === '<') {
          if (usage[version] < popularity) {
            result.push(version);
          }
        } else if (sign === '<=') {
          if (usage[version] <= popularity) {
            result.push(version);
          }
        } else if (usage[version] >= popularity) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^cover\s+(\d*\.?\d+)%(\s+in\s+(my\s+stats|(alt-)?\w\w))?$/,
    select: function (context, coverage, statMode) {
      coverage = parseFloat(coverage);
      var usage = browserslist.usage.global;
      if (statMode) {
        if (statMode.match(/^\s+in\s+my\s+stats$/)) {
          if (!context.customUsage) {
            throw new error(
              'Custom usage statistics was not provided'
            )
          }
          usage = context.customUsage;
        } else {
          var match = statMode.match(/\s+in\s+((alt-)?\w\w)/);
          var place = match[1];
          if (place.length === 2) {
            place = place.toUpperCase();
          } else {
            place = place.toLowerCase();
          }
          node.loadCountry(browserslist.usage, place, browserslist.data);
          usage = browserslist.usage[place];
        }
      }
      var versions = Object.keys(usage).sort(function (a, b) {
        return usage[b] - usage[a]
      });
      var coveraged = 0;
      var result = [];
      var version;
      for (var i = 0; i <= versions.length; i++) {
        version = versions[i];
        if (usage[version] === 0) break
        coveraged += usage[version];
        result.push(version);
        if (coveraged >= coverage) break
      }
      return result
    }
  },
  {
    regexp: /^supports\s+([\w-]+)$/,
    select: function (context, feature) {
      node.loadFeature(browserslist.cache, feature);
      var features = browserslist.cache[feature];
      return Object.keys(features).reduce(function (result, version) {
        var flags = features[version];
        if (flags.indexOf('y') >= 0 || flags.indexOf('a') >= 0) {
          result.push(version);
        }
        return result
      }, [])
    }
  },
  {
    regexp: /^electron\s+([\d.]+)\s*-\s*([\d.]+)$/i,
    select: function (context, from, to) {
      var fromToUse = normalizeElectron(from);
      var toToUse = normalizeElectron(to);
      if (!versions[fromToUse]) {
        throw new error('Unknown version ' + from + ' of electron')
      }
      if (!versions[toToUse]) {
        throw new error('Unknown version ' + to + ' of electron')
      }
      from = parseFloat(from);
      to = parseFloat(to);
      return Object.keys(versions).filter(function (i) {
        var parsed = parseFloat(i);
        return parsed >= from && parsed <= to
      }).map(function (i) {
        return 'chrome ' + versions[i]
      })
    }
  },
  {
    regexp: /^node\s+([\d.]+)\s*-\s*([\d.]+)$/i,
    select: function (context, from, to) {
      var nodeVersions = jsReleases.filter(function (i) {
        return i.name === 'nodejs'
      }).map(function (i) {
        return i.version
      });
      var semverRegExp = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,2}$/;
      if (!semverRegExp.test(from)) {
        throw new error(
          'Unknown version ' + from + ' of Node.js')
      }
      if (!semverRegExp.test(to)) {
        throw new error(
          'Unknown version ' + to + ' of Node.js')
      }
      return nodeVersions
        .filter(semverFilterLoose('>=', from))
        .filter(semverFilterLoose('<=', to))
        .map(function (v) {
          return 'node ' + v
        })
    }
  },
  {
    regexp: /^(\w+)\s+([\d.]+)\s*-\s*([\d.]+)$/i,
    select: function (context, name, from, to) {
      var data = checkName(name, context);
      from = parseFloat(normalizeVersion(data, from) || from);
      to = parseFloat(normalizeVersion(data, to) || to);
      function filter (v) {
        var parsed = parseFloat(v);
        return parsed >= from && parsed <= to
      }
      return data.released.filter(filter).map(nameMapper(data.name))
    }
  },
  {
    regexp: /^electron\s*(>=?|<=?)\s*([\d.]+)$/i,
    select: function (context, sign, version) {
      var versionToUse = normalizeElectron(version);
      return Object.keys(versions)
        .filter(generateFilter(sign, versionToUse))
        .map(function (i) {
          return 'chrome ' + versions[i]
        })
    }
  },
  {
    regexp: /^node\s*(>=?|<=?)\s*([\d.]+)$/i,
    select: function (context, sign, version) {
      var nodeVersions = jsReleases.filter(function (i) {
        return i.name === 'nodejs'
      }).map(function (i) {
        return i.version
      });
      return nodeVersions
        .filter(generateSemverFilter(sign, version))
        .map(function (v) {
          return 'node ' + v
        })
    }
  },
  {
    regexp: /^(\w+)\s*(>=?|<=?)\s*([\d.]+)$/,
    select: function (context, name, sign, version) {
      var data = checkName(name, context);
      var alias = browserslist.versionAliases[data.name][version];
      if (alias) {
        version = alias;
      }
      return data.released
        .filter(generateFilter(sign, version))
        .map(function (v) {
          return data.name + ' ' + v
        })
    }
  },
  {
    regexp: /^(firefox|ff|fx)\s+esr$/i,
    select: function () {
      return ['firefox 68', 'firefox 78']
    }
  },
  {
    regexp: /(operamini|op_mini)\s+all/i,
    select: function () {
      return ['op_mini all']
    }
  },
  {
    regexp: /^electron\s+([\d.]+)$/i,
    select: function (context, version) {
      var versionToUse = normalizeElectron(version);
      var chrome = versions[versionToUse];
      if (!chrome) {
        throw new error(
          'Unknown version ' + version + ' of electron')
      }
      return ['chrome ' + chrome]
    }
  },
  {
    regexp: /^node\s+(\d+(\.\d+)?(\.\d+)?)$/i,
    select: function (context, version) {
      var nodeReleases = jsReleases.filter(function (i) {
        return i.name === 'nodejs'
      });
      var matched = nodeReleases.filter(function (i) {
        return isVersionsMatch(i.version, version)
      });
      if (matched.length === 0) {
        if (context.ignoreUnknownVersions) {
          return []
        } else {
          throw new error(
            'Unknown version ' + version + ' of Node.js')
        }
      }
      return ['node ' + matched[matched.length - 1].version]
    }
  },
  {
    regexp: /^current\s+node$/i,
    select: function (context) {
      return [node.currentNode(resolve, context)]
    }
  },
  {
    regexp: /^maintained\s+node\s+versions$/i,
    select: function (context) {
      var now = Date.now();
      var queries = Object.keys(jsEOL).filter(function (key) {
        return now < Date.parse(jsEOL[key].end) &&
          now > Date.parse(jsEOL[key].start) &&
          isEolReleased(key)
      }).map(function (key) {
        return 'node ' + key.slice(1)
      });
      return resolve(queries, context)
    }
  },
  {
    regexp: /^phantomjs\s+1.9$/i,
    select: function () {
      return ['safari 5']
    }
  },
  {
    regexp: /^phantomjs\s+2.1$/i,
    select: function () {
      return ['safari 6']
    }
  },
  {
    regexp: /^(\w+)\s+(tp|[\d.]+)$/i,
    select: function (context, name, version) {
      if (/^tp$/i.test(version)) version = 'TP';
      var data = checkName(name, context);
      var alias = normalizeVersion(data, version);
      if (alias) {
        version = alias;
      } else {
        if (version.indexOf('.') === -1) {
          alias = version + '.0';
        } else {
          alias = version.replace(/\.0$/, '');
        }
        alias = normalizeVersion(data, alias);
        if (alias) {
          version = alias;
        } else if (context.ignoreUnknownVersions) {
          return []
        } else {
          throw new error(
            'Unknown version ' + version + ' of ' + name)
        }
      }
      return [data.name + ' ' + version]
    }
  },
  {
    regexp: /^extends (.+)$/i,
    select: function (context, name) {
      return resolve(node.loadQueries(context, name), context)
    }
  },
  {
    regexp: /^defaults$/i,
    select: function (context) {
      return resolve(browserslist.defaults, context)
    }
  },
  {
    regexp: /^dead$/i,
    select: function (context) {
      var dead = [
        'ie <= 10',
        'ie_mob <= 11',
        'bb <= 10',
        'op_mob <= 12.1',
        'samsung 4'
      ];
      return resolve(dead, context)
    }
  },
  {
    regexp: /^(\w+)$/i,
    select: function (context, name) {
      if (byName(name, context)) {
        throw new error(
          'Specify versions in Browserslist query for browser ' + name)
      } else {
        throw unknownQuery(name)
      }
    }
  }
];

// Get and convert Can I Use data

(function () {
  for (var name in agents$1) {
    var browser = agents$1[name];
    browserslist.data[name] = {
      name: name,
      versions: normalize(agents$1[name].versions),
      released: normalize(agents$1[name].versions.slice(0, -3)),
      releaseDate: agents$1[name].release_date
    };
    fillUsage(browserslist.usage.global, name, browser.usage_global);

    browserslist.versionAliases[name] = { };
    for (var i = 0; i < browser.versions.length; i++) {
      var full = browser.versions[i];
      if (!full) continue

      if (full.indexOf('-') !== -1) {
        var interval = full.split('-');
        for (var j = 0; j < interval.length; j++) {
          browserslist.versionAliases[name][interval[j]] = full;
        }
      }
    }
  }
}());

var browserslist_1 = browserslist;

var modules$3 = {
	chrome: "61",
	edge: "16",
	firefox: "60",
	ios: "10.3",
	opera: "48",
	opera_mobile: "45",
	safari: "10.1",
	samsung: "8.0"
};
var external = {
	modules: modules$3
};

var external$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  modules: modules$3,
  'default': external
});

var external$2 = getCjsExportFromNamespace(external$1);

const { compare: compare$4, has: has$1 } = helpers;


const aliases = new Map([
  ['and_chr', 'chrome'],
  ['and_ff', 'firefox'],
  ['ie_mob', 'ie'],
  ['ios_saf', 'ios'],
  ['op_mob', 'opera_mobile'],
]);

const validTargets = new Set([
  'android',
  'chrome',
  'edge',
  'electron',
  'firefox',
  'ie',
  'ios',
  'node',
  'opera',
  'opera_mobile',
  'phantom',
  'safari',
  'samsung',
]);

var targetsParser = function (targets) {
  if (typeof targets !== 'object' || Array.isArray(targets)) {
    targets = { browsers: targets };
  }

  const { browsers, esmodules, node, ...rest } = targets;
  const list = Object.entries(rest);

  if (browsers) {
    list.push(...browserslist_1(browsers).map(it => it.split(' ')));
  }
  if (esmodules) {
    list.push(...Object.entries(external$2.modules));
  }
  if (node) {
    list.push(['node', node === 'current' ? process.versions.node : node]);
  }

  const normalized = list.map(([engine, version]) => {
    if (has$1(browserslist_1.aliases, engine)) {
      engine = browserslist_1.aliases[engine];
    }
    if (aliases.has(engine)) {
      engine = aliases.get(engine);
    } else if (engine === 'android' && compare$4(version, '>', '4.4.4')) {
      engine = 'chrome';
    }
    return [engine, String(version)];
  }).filter(([engine]) => {
    return validTargets.has(engine);
  }).sort(([a], [b]) => {
    return a < b ? -1 : a > b ? 1 : 0;
  });

  const reducedByMinVersion = new Map();
  for (const [engine, version] of normalized) {
    if (!reducedByMinVersion.has(engine) || compare$4(version, '<=', reducedByMinVersion.get(engine))) {
      reducedByMinVersion.set(engine, version);
    }
  }

  return reducedByMinVersion;
};

var data$2 = getCjsExportFromNamespace(data$1);

const { compare: compare$5, has: has$2, intersection: intersection$2 } = helpers;





function checkModule(name, targets) {
  if (!has$2(data$2, name)) throw new TypeError(`Incorrect module: ${ name }`);

  const requirements = data$2[name];
  const result = {
    required: false,
    targets: {},
  };

  for (const [engine, version] of targets) {
    if (!has$2(requirements, engine) || compare$5(version, '<', requirements[engine])) {
      result.required = true;
      result.targets[engine] = version;
    }
  }

  return result;
}

var compat = function ({ targets, filter, version }) {
  const parsedTargets = targetsParser(targets);

  const result = {
    list: [],
    targets: {},
  };

  let $modules = Array.isArray(filter) ? filter : modules$2;

  if (filter instanceof RegExp) {
    $modules = $modules.filter(it => filter.test(it));
  } else if (typeof filter == 'string') {
    $modules = $modules.filter(it => it.startsWith(filter));
  }

  if (version) {
    $modules = intersection$2($modules, getModulesListForTargetVersion(version));
  }

  for (const key of $modules) {
    const check = checkModule(key, parsedTargets);
    if (check.required) {
      result.list.push(key);
      result.targets[key] = check.targets;
    }
  }

  return result;
};

var entries = {
	"core-js": [
	"es.symbol",
	"es.symbol.description",
	"es.symbol.async-iterator",
	"es.symbol.has-instance",
	"es.symbol.is-concat-spreadable",
	"es.symbol.iterator",
	"es.symbol.match",
	"es.symbol.match-all",
	"es.symbol.replace",
	"es.symbol.search",
	"es.symbol.species",
	"es.symbol.split",
	"es.symbol.to-primitive",
	"es.symbol.to-string-tag",
	"es.symbol.unscopables",
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.from",
	"es.array.includes",
	"es.array.index-of",
	"es.array.is-array",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.of",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map",
	"es.array-buffer.constructor",
	"es.array-buffer.is-view",
	"es.array-buffer.slice",
	"es.data-view",
	"es.date.now",
	"es.date.to-iso-string",
	"es.date.to-json",
	"es.date.to-primitive",
	"es.date.to-string",
	"es.function.bind",
	"es.function.has-instance",
	"es.function.name",
	"es.global-this",
	"es.json.stringify",
	"es.json.to-string-tag",
	"es.map",
	"es.math.acosh",
	"es.math.asinh",
	"es.math.atanh",
	"es.math.cbrt",
	"es.math.clz32",
	"es.math.cosh",
	"es.math.expm1",
	"es.math.fround",
	"es.math.hypot",
	"es.math.imul",
	"es.math.log10",
	"es.math.log1p",
	"es.math.log2",
	"es.math.sign",
	"es.math.sinh",
	"es.math.tanh",
	"es.math.to-string-tag",
	"es.math.trunc",
	"es.number.constructor",
	"es.number.epsilon",
	"es.number.is-finite",
	"es.number.is-integer",
	"es.number.is-nan",
	"es.number.is-safe-integer",
	"es.number.max-safe-integer",
	"es.number.min-safe-integer",
	"es.number.parse-float",
	"es.number.parse-int",
	"es.number.to-fixed",
	"es.number.to-precision",
	"es.object.assign",
	"es.object.create",
	"es.object.define-getter",
	"es.object.define-properties",
	"es.object.define-property",
	"es.object.define-setter",
	"es.object.entries",
	"es.object.freeze",
	"es.object.from-entries",
	"es.object.get-own-property-descriptor",
	"es.object.get-own-property-descriptors",
	"es.object.get-own-property-names",
	"es.object.get-prototype-of",
	"es.object.is",
	"es.object.is-extensible",
	"es.object.is-frozen",
	"es.object.is-sealed",
	"es.object.keys",
	"es.object.lookup-getter",
	"es.object.lookup-setter",
	"es.object.prevent-extensions",
	"es.object.seal",
	"es.object.set-prototype-of",
	"es.object.to-string",
	"es.object.values",
	"es.parse-float",
	"es.parse-int",
	"es.promise",
	"es.promise.all-settled",
	"es.promise.finally",
	"es.reflect.apply",
	"es.reflect.construct",
	"es.reflect.define-property",
	"es.reflect.delete-property",
	"es.reflect.get",
	"es.reflect.get-own-property-descriptor",
	"es.reflect.get-prototype-of",
	"es.reflect.has",
	"es.reflect.is-extensible",
	"es.reflect.own-keys",
	"es.reflect.prevent-extensions",
	"es.reflect.set",
	"es.reflect.set-prototype-of",
	"es.regexp.constructor",
	"es.regexp.exec",
	"es.regexp.flags",
	"es.regexp.sticky",
	"es.regexp.test",
	"es.regexp.to-string",
	"es.set",
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.from-code-point",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.raw",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup",
	"es.typed-array.float32-array",
	"es.typed-array.float64-array",
	"es.typed-array.int8-array",
	"es.typed-array.int16-array",
	"es.typed-array.int32-array",
	"es.typed-array.uint8-array",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.uint16-array",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string",
	"es.weak-map",
	"es.weak-set",
	"esnext.aggregate-error",
	"esnext.array.is-template-object",
	"esnext.array.last-index",
	"esnext.array.last-item",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.composite-key",
	"esnext.composite-symbol",
	"esnext.global-this",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.math.umulh",
	"esnext.number.from-string",
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values",
	"esnext.observable",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"esnext.reflect.define-metadata",
	"esnext.reflect.delete-metadata",
	"esnext.reflect.get-metadata",
	"esnext.reflect.get-metadata-keys",
	"esnext.reflect.get-own-metadata",
	"esnext.reflect.get-own-metadata-keys",
	"esnext.reflect.has-metadata",
	"esnext.reflect.has-own-metadata",
	"esnext.reflect.metadata",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.symbol.replace-all",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-map.upsert",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of",
	"web.dom-collections.for-each",
	"web.dom-collections.iterator",
	"web.immediate",
	"web.queue-microtask",
	"web.timers",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/es": [
	"es.symbol",
	"es.symbol.description",
	"es.symbol.async-iterator",
	"es.symbol.has-instance",
	"es.symbol.is-concat-spreadable",
	"es.symbol.iterator",
	"es.symbol.match",
	"es.symbol.match-all",
	"es.symbol.replace",
	"es.symbol.search",
	"es.symbol.species",
	"es.symbol.split",
	"es.symbol.to-primitive",
	"es.symbol.to-string-tag",
	"es.symbol.unscopables",
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.from",
	"es.array.includes",
	"es.array.index-of",
	"es.array.is-array",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.of",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map",
	"es.array-buffer.constructor",
	"es.array-buffer.is-view",
	"es.array-buffer.slice",
	"es.data-view",
	"es.date.now",
	"es.date.to-iso-string",
	"es.date.to-json",
	"es.date.to-primitive",
	"es.date.to-string",
	"es.function.bind",
	"es.function.has-instance",
	"es.function.name",
	"es.global-this",
	"es.json.stringify",
	"es.json.to-string-tag",
	"es.map",
	"es.math.acosh",
	"es.math.asinh",
	"es.math.atanh",
	"es.math.cbrt",
	"es.math.clz32",
	"es.math.cosh",
	"es.math.expm1",
	"es.math.fround",
	"es.math.hypot",
	"es.math.imul",
	"es.math.log10",
	"es.math.log1p",
	"es.math.log2",
	"es.math.sign",
	"es.math.sinh",
	"es.math.tanh",
	"es.math.to-string-tag",
	"es.math.trunc",
	"es.number.constructor",
	"es.number.epsilon",
	"es.number.is-finite",
	"es.number.is-integer",
	"es.number.is-nan",
	"es.number.is-safe-integer",
	"es.number.max-safe-integer",
	"es.number.min-safe-integer",
	"es.number.parse-float",
	"es.number.parse-int",
	"es.number.to-fixed",
	"es.number.to-precision",
	"es.object.assign",
	"es.object.create",
	"es.object.define-getter",
	"es.object.define-properties",
	"es.object.define-property",
	"es.object.define-setter",
	"es.object.entries",
	"es.object.freeze",
	"es.object.from-entries",
	"es.object.get-own-property-descriptor",
	"es.object.get-own-property-descriptors",
	"es.object.get-own-property-names",
	"es.object.get-prototype-of",
	"es.object.is",
	"es.object.is-extensible",
	"es.object.is-frozen",
	"es.object.is-sealed",
	"es.object.keys",
	"es.object.lookup-getter",
	"es.object.lookup-setter",
	"es.object.prevent-extensions",
	"es.object.seal",
	"es.object.set-prototype-of",
	"es.object.to-string",
	"es.object.values",
	"es.parse-float",
	"es.parse-int",
	"es.promise",
	"es.promise.all-settled",
	"es.promise.finally",
	"es.reflect.apply",
	"es.reflect.construct",
	"es.reflect.define-property",
	"es.reflect.delete-property",
	"es.reflect.get",
	"es.reflect.get-own-property-descriptor",
	"es.reflect.get-prototype-of",
	"es.reflect.has",
	"es.reflect.is-extensible",
	"es.reflect.own-keys",
	"es.reflect.prevent-extensions",
	"es.reflect.set",
	"es.reflect.set-prototype-of",
	"es.regexp.constructor",
	"es.regexp.exec",
	"es.regexp.flags",
	"es.regexp.sticky",
	"es.regexp.test",
	"es.regexp.to-string",
	"es.set",
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.from-code-point",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.raw",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup",
	"es.typed-array.float32-array",
	"es.typed-array.float64-array",
	"es.typed-array.int8-array",
	"es.typed-array.int16-array",
	"es.typed-array.int32-array",
	"es.typed-array.uint8-array",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.uint16-array",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string",
	"es.weak-map",
	"es.weak-set"
],
	"core-js/es/array": [
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.from",
	"es.array.includes",
	"es.array.index-of",
	"es.array.is-array",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.of",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map",
	"es.string.iterator"
],
	"core-js/es/array-buffer": [
	"es.array-buffer.constructor",
	"es.array-buffer.is-view",
	"es.array-buffer.slice",
	"es.object.to-string"
],
	"core-js/es/array-buffer/constructor": [
	"es.array-buffer.constructor",
	"es.object.to-string"
],
	"core-js/es/array-buffer/is-view": [
	"es.array-buffer.is-view"
],
	"core-js/es/array-buffer/slice": [
	"es.array-buffer.slice"
],
	"core-js/es/array/concat": [
	"es.array.concat"
],
	"core-js/es/array/copy-within": [
	"es.array.copy-within"
],
	"core-js/es/array/entries": [
	"es.array.iterator"
],
	"core-js/es/array/every": [
	"es.array.every"
],
	"core-js/es/array/fill": [
	"es.array.fill"
],
	"core-js/es/array/filter": [
	"es.array.filter"
],
	"core-js/es/array/find": [
	"es.array.find"
],
	"core-js/es/array/find-index": [
	"es.array.find-index"
],
	"core-js/es/array/flat": [
	"es.array.flat",
	"es.array.unscopables.flat"
],
	"core-js/es/array/flat-map": [
	"es.array.flat-map",
	"es.array.unscopables.flat-map"
],
	"core-js/es/array/for-each": [
	"es.array.for-each"
],
	"core-js/es/array/from": [
	"es.array.from",
	"es.string.iterator"
],
	"core-js/es/array/includes": [
	"es.array.includes"
],
	"core-js/es/array/index-of": [
	"es.array.index-of"
],
	"core-js/es/array/is-array": [
	"es.array.is-array"
],
	"core-js/es/array/iterator": [
	"es.array.iterator"
],
	"core-js/es/array/join": [
	"es.array.join"
],
	"core-js/es/array/keys": [
	"es.array.iterator"
],
	"core-js/es/array/last-index-of": [
	"es.array.last-index-of"
],
	"core-js/es/array/map": [
	"es.array.map"
],
	"core-js/es/array/of": [
	"es.array.of"
],
	"core-js/es/array/reduce": [
	"es.array.reduce"
],
	"core-js/es/array/reduce-right": [
	"es.array.reduce-right"
],
	"core-js/es/array/reverse": [
	"es.array.reverse"
],
	"core-js/es/array/slice": [
	"es.array.slice"
],
	"core-js/es/array/some": [
	"es.array.some"
],
	"core-js/es/array/sort": [
	"es.array.sort"
],
	"core-js/es/array/splice": [
	"es.array.splice"
],
	"core-js/es/array/values": [
	"es.array.iterator"
],
	"core-js/es/array/virtual": [
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.includes",
	"es.array.index-of",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map"
],
	"core-js/es/array/virtual/concat": [
	"es.array.concat"
],
	"core-js/es/array/virtual/copy-within": [
	"es.array.copy-within"
],
	"core-js/es/array/virtual/entries": [
	"es.array.iterator"
],
	"core-js/es/array/virtual/every": [
	"es.array.every"
],
	"core-js/es/array/virtual/fill": [
	"es.array.fill"
],
	"core-js/es/array/virtual/filter": [
	"es.array.filter"
],
	"core-js/es/array/virtual/find": [
	"es.array.find"
],
	"core-js/es/array/virtual/find-index": [
	"es.array.find-index"
],
	"core-js/es/array/virtual/flat": [
	"es.array.flat",
	"es.array.unscopables.flat"
],
	"core-js/es/array/virtual/flat-map": [
	"es.array.flat-map",
	"es.array.unscopables.flat-map"
],
	"core-js/es/array/virtual/for-each": [
	"es.array.for-each"
],
	"core-js/es/array/virtual/includes": [
	"es.array.includes"
],
	"core-js/es/array/virtual/index-of": [
	"es.array.index-of"
],
	"core-js/es/array/virtual/iterator": [
	"es.array.iterator"
],
	"core-js/es/array/virtual/join": [
	"es.array.join"
],
	"core-js/es/array/virtual/keys": [
	"es.array.iterator"
],
	"core-js/es/array/virtual/last-index-of": [
	"es.array.last-index-of"
],
	"core-js/es/array/virtual/map": [
	"es.array.map"
],
	"core-js/es/array/virtual/reduce": [
	"es.array.reduce"
],
	"core-js/es/array/virtual/reduce-right": [
	"es.array.reduce-right"
],
	"core-js/es/array/virtual/reverse": [
	"es.array.reverse"
],
	"core-js/es/array/virtual/slice": [
	"es.array.slice"
],
	"core-js/es/array/virtual/some": [
	"es.array.some"
],
	"core-js/es/array/virtual/sort": [
	"es.array.sort"
],
	"core-js/es/array/virtual/splice": [
	"es.array.splice"
],
	"core-js/es/array/virtual/values": [
	"es.array.iterator"
],
	"core-js/es/data-view": [
	"es.data-view",
	"es.object.to-string"
],
	"core-js/es/date": [
	"es.date.now",
	"es.date.to-iso-string",
	"es.date.to-json",
	"es.date.to-primitive",
	"es.date.to-string"
],
	"core-js/es/date/now": [
	"es.date.now"
],
	"core-js/es/date/to-iso-string": [
	"es.date.to-iso-string",
	"es.date.to-json"
],
	"core-js/es/date/to-json": [
	"es.date.to-json"
],
	"core-js/es/date/to-primitive": [
	"es.date.to-primitive"
],
	"core-js/es/date/to-string": [
	"es.date.to-string"
],
	"core-js/es/function": [
	"es.function.bind",
	"es.function.has-instance",
	"es.function.name"
],
	"core-js/es/function/bind": [
	"es.function.bind"
],
	"core-js/es/function/has-instance": [
	"es.function.has-instance"
],
	"core-js/es/function/name": [
	"es.function.name"
],
	"core-js/es/function/virtual": [
	"es.function.bind"
],
	"core-js/es/function/virtual/bind": [
	"es.function.bind"
],
	"core-js/es/global-this": [
	"es.global-this"
],
	"core-js/es/instance/bind": [
	"es.function.bind"
],
	"core-js/es/instance/code-point-at": [
	"es.string.code-point-at"
],
	"core-js/es/instance/concat": [
	"es.array.concat"
],
	"core-js/es/instance/copy-within": [
	"es.array.copy-within"
],
	"core-js/es/instance/ends-with": [
	"es.string.ends-with"
],
	"core-js/es/instance/entries": [
	"es.array.iterator"
],
	"core-js/es/instance/every": [
	"es.array.every"
],
	"core-js/es/instance/fill": [
	"es.array.fill"
],
	"core-js/es/instance/filter": [
	"es.array.filter"
],
	"core-js/es/instance/find": [
	"es.array.find"
],
	"core-js/es/instance/find-index": [
	"es.array.find-index"
],
	"core-js/es/instance/flags": [
	"es.regexp.flags"
],
	"core-js/es/instance/flat": [
	"es.array.flat",
	"es.array.unscopables.flat"
],
	"core-js/es/instance/flat-map": [
	"es.array.flat-map",
	"es.array.unscopables.flat-map"
],
	"core-js/es/instance/for-each": [
	"es.array.for-each"
],
	"core-js/es/instance/includes": [
	"es.array.includes",
	"es.string.includes"
],
	"core-js/es/instance/index-of": [
	"es.array.index-of"
],
	"core-js/es/instance/keys": [
	"es.array.iterator"
],
	"core-js/es/instance/last-index-of": [
	"es.array.last-index-of"
],
	"core-js/es/instance/map": [
	"es.array.map"
],
	"core-js/es/instance/match-all": [
	"es.string.match-all"
],
	"core-js/es/instance/pad-end": [
	"es.string.pad-end"
],
	"core-js/es/instance/pad-start": [
	"es.string.pad-start"
],
	"core-js/es/instance/reduce": [
	"es.array.reduce"
],
	"core-js/es/instance/reduce-right": [
	"es.array.reduce-right"
],
	"core-js/es/instance/repeat": [
	"es.string.repeat"
],
	"core-js/es/instance/reverse": [
	"es.array.reverse"
],
	"core-js/es/instance/slice": [
	"es.array.slice"
],
	"core-js/es/instance/some": [
	"es.array.some"
],
	"core-js/es/instance/sort": [
	"es.array.sort"
],
	"core-js/es/instance/splice": [
	"es.array.splice"
],
	"core-js/es/instance/starts-with": [
	"es.string.starts-with"
],
	"core-js/es/instance/trim": [
	"es.string.trim"
],
	"core-js/es/instance/trim-end": [
	"es.string.trim-end"
],
	"core-js/es/instance/trim-left": [
	"es.string.trim-start"
],
	"core-js/es/instance/trim-right": [
	"es.string.trim-end"
],
	"core-js/es/instance/trim-start": [
	"es.string.trim-start"
],
	"core-js/es/instance/values": [
	"es.array.iterator"
],
	"core-js/es/json": [
	"es.json.stringify",
	"es.json.to-string-tag"
],
	"core-js/es/json/stringify": [
	"es.json.stringify"
],
	"core-js/es/json/to-string-tag": [
	"es.json.to-string-tag"
],
	"core-js/es/map": [
	"es.map",
	"es.object.to-string",
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/es/math": [
	"es.math.acosh",
	"es.math.asinh",
	"es.math.atanh",
	"es.math.cbrt",
	"es.math.clz32",
	"es.math.cosh",
	"es.math.expm1",
	"es.math.fround",
	"es.math.hypot",
	"es.math.imul",
	"es.math.log10",
	"es.math.log1p",
	"es.math.log2",
	"es.math.sign",
	"es.math.sinh",
	"es.math.tanh",
	"es.math.to-string-tag",
	"es.math.trunc"
],
	"core-js/es/math/acosh": [
	"es.math.acosh"
],
	"core-js/es/math/asinh": [
	"es.math.asinh"
],
	"core-js/es/math/atanh": [
	"es.math.atanh"
],
	"core-js/es/math/cbrt": [
	"es.math.cbrt"
],
	"core-js/es/math/clz32": [
	"es.math.clz32"
],
	"core-js/es/math/cosh": [
	"es.math.cosh"
],
	"core-js/es/math/expm1": [
	"es.math.expm1"
],
	"core-js/es/math/fround": [
	"es.math.fround"
],
	"core-js/es/math/hypot": [
	"es.math.hypot"
],
	"core-js/es/math/imul": [
	"es.math.imul"
],
	"core-js/es/math/log10": [
	"es.math.log10"
],
	"core-js/es/math/log1p": [
	"es.math.log1p"
],
	"core-js/es/math/log2": [
	"es.math.log2"
],
	"core-js/es/math/sign": [
	"es.math.sign"
],
	"core-js/es/math/sinh": [
	"es.math.sinh"
],
	"core-js/es/math/tanh": [
	"es.math.tanh"
],
	"core-js/es/math/to-string-tag": [
	"es.math.to-string-tag"
],
	"core-js/es/math/trunc": [
	"es.math.trunc"
],
	"core-js/es/number": [
	"es.number.constructor",
	"es.number.epsilon",
	"es.number.is-finite",
	"es.number.is-integer",
	"es.number.is-nan",
	"es.number.is-safe-integer",
	"es.number.max-safe-integer",
	"es.number.min-safe-integer",
	"es.number.parse-float",
	"es.number.parse-int",
	"es.number.to-fixed",
	"es.number.to-precision"
],
	"core-js/es/number/constructor": [
	"es.number.constructor"
],
	"core-js/es/number/epsilon": [
	"es.number.epsilon"
],
	"core-js/es/number/is-finite": [
	"es.number.is-finite"
],
	"core-js/es/number/is-integer": [
	"es.number.is-integer"
],
	"core-js/es/number/is-nan": [
	"es.number.is-nan"
],
	"core-js/es/number/is-safe-integer": [
	"es.number.is-safe-integer"
],
	"core-js/es/number/max-safe-integer": [
	"es.number.max-safe-integer"
],
	"core-js/es/number/min-safe-integer": [
	"es.number.min-safe-integer"
],
	"core-js/es/number/parse-float": [
	"es.number.parse-float"
],
	"core-js/es/number/parse-int": [
	"es.number.parse-int"
],
	"core-js/es/number/to-fixed": [
	"es.number.to-fixed"
],
	"core-js/es/number/to-precision": [
	"es.number.to-precision"
],
	"core-js/es/number/virtual": [
	"es.number.to-fixed",
	"es.number.to-precision"
],
	"core-js/es/number/virtual/to-fixed": [
	"es.number.to-fixed"
],
	"core-js/es/number/virtual/to-precision": [
	"es.number.to-precision"
],
	"core-js/es/object": [
	"es.symbol",
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.assign",
	"es.object.create",
	"es.object.define-getter",
	"es.object.define-properties",
	"es.object.define-property",
	"es.object.define-setter",
	"es.object.entries",
	"es.object.freeze",
	"es.object.from-entries",
	"es.object.get-own-property-descriptor",
	"es.object.get-own-property-descriptors",
	"es.object.get-own-property-names",
	"es.object.get-prototype-of",
	"es.object.is",
	"es.object.is-extensible",
	"es.object.is-frozen",
	"es.object.is-sealed",
	"es.object.keys",
	"es.object.lookup-getter",
	"es.object.lookup-setter",
	"es.object.prevent-extensions",
	"es.object.seal",
	"es.object.set-prototype-of",
	"es.object.to-string",
	"es.object.values"
],
	"core-js/es/object/assign": [
	"es.object.assign"
],
	"core-js/es/object/create": [
	"es.object.create"
],
	"core-js/es/object/define-getter": [
	"es.object.define-getter"
],
	"core-js/es/object/define-properties": [
	"es.object.define-properties"
],
	"core-js/es/object/define-property": [
	"es.object.define-property"
],
	"core-js/es/object/define-setter": [
	"es.object.define-setter"
],
	"core-js/es/object/entries": [
	"es.object.entries"
],
	"core-js/es/object/freeze": [
	"es.object.freeze"
],
	"core-js/es/object/from-entries": [
	"es.array.iterator",
	"es.object.from-entries"
],
	"core-js/es/object/get-own-property-descriptor": [
	"es.object.get-own-property-descriptor"
],
	"core-js/es/object/get-own-property-descriptors": [
	"es.object.get-own-property-descriptors"
],
	"core-js/es/object/get-own-property-names": [
	"es.object.get-own-property-names"
],
	"core-js/es/object/get-own-property-symbols": [
	"es.symbol"
],
	"core-js/es/object/get-prototype-of": [
	"es.object.get-prototype-of"
],
	"core-js/es/object/is": [
	"es.object.is"
],
	"core-js/es/object/is-extensible": [
	"es.object.is-extensible"
],
	"core-js/es/object/is-frozen": [
	"es.object.is-frozen"
],
	"core-js/es/object/is-sealed": [
	"es.object.is-sealed"
],
	"core-js/es/object/keys": [
	"es.object.keys"
],
	"core-js/es/object/lookup-getter": [
	"es.object.lookup-setter"
],
	"core-js/es/object/lookup-setter": [
	"es.object.lookup-setter"
],
	"core-js/es/object/prevent-extensions": [
	"es.object.prevent-extensions"
],
	"core-js/es/object/seal": [
	"es.object.seal"
],
	"core-js/es/object/set-prototype-of": [
	"es.object.set-prototype-of"
],
	"core-js/es/object/to-string": [
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.to-string"
],
	"core-js/es/object/values": [
	"es.object.values"
],
	"core-js/es/parse-float": [
	"es.parse-float"
],
	"core-js/es/parse-int": [
	"es.parse-int"
],
	"core-js/es/promise": [
	"es.object.to-string",
	"es.promise",
	"es.promise.all-settled",
	"es.promise.finally",
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/es/promise/all-settled": [
	"es.promise",
	"es.promise.all-settled"
],
	"core-js/es/promise/finally": [
	"es.promise",
	"es.promise.finally"
],
	"core-js/es/reflect": [
	"es.reflect.apply",
	"es.reflect.construct",
	"es.reflect.define-property",
	"es.reflect.delete-property",
	"es.reflect.get",
	"es.reflect.get-own-property-descriptor",
	"es.reflect.get-prototype-of",
	"es.reflect.has",
	"es.reflect.is-extensible",
	"es.reflect.own-keys",
	"es.reflect.prevent-extensions",
	"es.reflect.set",
	"es.reflect.set-prototype-of"
],
	"core-js/es/reflect/apply": [
	"es.reflect.apply"
],
	"core-js/es/reflect/construct": [
	"es.reflect.construct"
],
	"core-js/es/reflect/define-property": [
	"es.reflect.define-property"
],
	"core-js/es/reflect/delete-property": [
	"es.reflect.delete-property"
],
	"core-js/es/reflect/get": [
	"es.reflect.get"
],
	"core-js/es/reflect/get-own-property-descriptor": [
	"es.reflect.get-own-property-descriptor"
],
	"core-js/es/reflect/get-prototype-of": [
	"es.reflect.get-prototype-of"
],
	"core-js/es/reflect/has": [
	"es.reflect.has"
],
	"core-js/es/reflect/is-extensible": [
	"es.reflect.is-extensible"
],
	"core-js/es/reflect/own-keys": [
	"es.reflect.own-keys"
],
	"core-js/es/reflect/prevent-extensions": [
	"es.reflect.prevent-extensions"
],
	"core-js/es/reflect/set": [
	"es.reflect.set"
],
	"core-js/es/reflect/set-prototype-of": [
	"es.reflect.set-prototype-of"
],
	"core-js/es/regexp": [
	"es.regexp.constructor",
	"es.regexp.exec",
	"es.regexp.flags",
	"es.regexp.sticky",
	"es.regexp.test",
	"es.regexp.to-string",
	"es.string.match",
	"es.string.replace",
	"es.string.search",
	"es.string.split"
],
	"core-js/es/regexp/constructor": [
	"es.regexp.constructor"
],
	"core-js/es/regexp/flags": [
	"es.regexp.flags"
],
	"core-js/es/regexp/match": [
	"es.string.match"
],
	"core-js/es/regexp/replace": [
	"es.string.replace"
],
	"core-js/es/regexp/search": [
	"es.string.search"
],
	"core-js/es/regexp/split": [
	"es.string.split"
],
	"core-js/es/regexp/sticky": [
	"es.regexp.sticky"
],
	"core-js/es/regexp/test": [
	"es.regexp.exec",
	"es.regexp.test"
],
	"core-js/es/regexp/to-string": [
	"es.regexp.to-string"
],
	"core-js/es/set": [
	"es.object.to-string",
	"es.set",
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/es/string": [
	"es.regexp.exec",
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.from-code-point",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.raw",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup"
],
	"core-js/es/string/anchor": [
	"es.string.anchor"
],
	"core-js/es/string/big": [
	"es.string.big"
],
	"core-js/es/string/blink": [
	"es.string.blink"
],
	"core-js/es/string/bold": [
	"es.string.bold"
],
	"core-js/es/string/code-point-at": [
	"es.string.code-point-at"
],
	"core-js/es/string/ends-with": [
	"es.string.ends-with"
],
	"core-js/es/string/fixed": [
	"es.string.fixed"
],
	"core-js/es/string/fontcolor": [
	"es.string.fontcolor"
],
	"core-js/es/string/fontsize": [
	"es.string.fontsize"
],
	"core-js/es/string/from-code-point": [
	"es.string.from-code-point"
],
	"core-js/es/string/includes": [
	"es.string.includes"
],
	"core-js/es/string/italics": [
	"es.string.italics"
],
	"core-js/es/string/iterator": [
	"es.string.iterator"
],
	"core-js/es/string/link": [
	"es.string.link"
],
	"core-js/es/string/match": [
	"es.regexp.exec",
	"es.string.match"
],
	"core-js/es/string/match-all": [
	"es.string.match-all"
],
	"core-js/es/string/pad-end": [
	"es.string.pad-end"
],
	"core-js/es/string/pad-start": [
	"es.string.pad-start"
],
	"core-js/es/string/raw": [
	"es.string.raw"
],
	"core-js/es/string/repeat": [
	"es.string.repeat"
],
	"core-js/es/string/replace": [
	"es.regexp.exec",
	"es.string.replace"
],
	"core-js/es/string/search": [
	"es.regexp.exec",
	"es.string.search"
],
	"core-js/es/string/small": [
	"es.string.small"
],
	"core-js/es/string/split": [
	"es.regexp.exec",
	"es.string.split"
],
	"core-js/es/string/starts-with": [
	"es.string.starts-with"
],
	"core-js/es/string/strike": [
	"es.string.strike"
],
	"core-js/es/string/sub": [
	"es.string.sub"
],
	"core-js/es/string/sup": [
	"es.string.sup"
],
	"core-js/es/string/trim": [
	"es.string.trim"
],
	"core-js/es/string/trim-end": [
	"es.string.trim-end"
],
	"core-js/es/string/trim-left": [
	"es.string.trim-start"
],
	"core-js/es/string/trim-right": [
	"es.string.trim-end"
],
	"core-js/es/string/trim-start": [
	"es.string.trim-start"
],
	"core-js/es/string/virtual": [
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup"
],
	"core-js/es/string/virtual/anchor": [
	"es.string.anchor"
],
	"core-js/es/string/virtual/big": [
	"es.string.big"
],
	"core-js/es/string/virtual/blink": [
	"es.string.blink"
],
	"core-js/es/string/virtual/bold": [
	"es.string.bold"
],
	"core-js/es/string/virtual/code-point-at": [
	"es.string.code-point-at"
],
	"core-js/es/string/virtual/ends-with": [
	"es.string.ends-with"
],
	"core-js/es/string/virtual/fixed": [
	"es.string.fixed"
],
	"core-js/es/string/virtual/fontcolor": [
	"es.string.fontcolor"
],
	"core-js/es/string/virtual/fontsize": [
	"es.string.fontsize"
],
	"core-js/es/string/virtual/includes": [
	"es.string.includes"
],
	"core-js/es/string/virtual/italics": [
	"es.string.italics"
],
	"core-js/es/string/virtual/iterator": [
	"es.string.iterator"
],
	"core-js/es/string/virtual/link": [
	"es.string.link"
],
	"core-js/es/string/virtual/match-all": [
	"es.string.match-all"
],
	"core-js/es/string/virtual/pad-end": [
	"es.string.pad-end"
],
	"core-js/es/string/virtual/pad-start": [
	"es.string.pad-start"
],
	"core-js/es/string/virtual/repeat": [
	"es.string.repeat"
],
	"core-js/es/string/virtual/small": [
	"es.string.small"
],
	"core-js/es/string/virtual/starts-with": [
	"es.string.starts-with"
],
	"core-js/es/string/virtual/strike": [
	"es.string.strike"
],
	"core-js/es/string/virtual/sub": [
	"es.string.sub"
],
	"core-js/es/string/virtual/sup": [
	"es.string.sup"
],
	"core-js/es/string/virtual/trim": [
	"es.string.trim"
],
	"core-js/es/string/virtual/trim-end": [
	"es.string.trim-end"
],
	"core-js/es/string/virtual/trim-left": [
	"es.string.trim-start"
],
	"core-js/es/string/virtual/trim-right": [
	"es.string.trim-end"
],
	"core-js/es/string/virtual/trim-start": [
	"es.string.trim-start"
],
	"core-js/es/symbol": [
	"es.symbol",
	"es.symbol.description",
	"es.symbol.async-iterator",
	"es.symbol.has-instance",
	"es.symbol.is-concat-spreadable",
	"es.symbol.iterator",
	"es.symbol.match",
	"es.symbol.match-all",
	"es.symbol.replace",
	"es.symbol.search",
	"es.symbol.species",
	"es.symbol.split",
	"es.symbol.to-primitive",
	"es.symbol.to-string-tag",
	"es.symbol.unscopables",
	"es.array.concat",
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.to-string"
],
	"core-js/es/symbol/async-iterator": [
	"es.symbol.async-iterator"
],
	"core-js/es/symbol/description": [
	"es.symbol.description"
],
	"core-js/es/symbol/for": [
	"es.symbol"
],
	"core-js/es/symbol/has-instance": [
	"es.symbol.has-instance",
	"es.function.has-instance"
],
	"core-js/es/symbol/is-concat-spreadable": [
	"es.symbol.is-concat-spreadable",
	"es.array.concat"
],
	"core-js/es/symbol/iterator": [
	"es.symbol.iterator",
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/es/symbol/key-for": [
	"es.symbol"
],
	"core-js/es/symbol/match": [
	"es.symbol.match",
	"es.string.match"
],
	"core-js/es/symbol/match-all": [
	"es.symbol.match-all",
	"es.string.match-all"
],
	"core-js/es/symbol/replace": [
	"es.symbol.replace",
	"es.string.replace"
],
	"core-js/es/symbol/search": [
	"es.symbol.search",
	"es.string.search"
],
	"core-js/es/symbol/species": [
	"es.symbol.species"
],
	"core-js/es/symbol/split": [
	"es.symbol.split",
	"es.string.split"
],
	"core-js/es/symbol/to-primitive": [
	"es.symbol.to-primitive"
],
	"core-js/es/symbol/to-string-tag": [
	"es.symbol.to-string-tag",
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.to-string"
],
	"core-js/es/symbol/unscopables": [
	"es.symbol.unscopables"
],
	"core-js/es/typed-array": [
	"es.object.to-string",
	"es.typed-array.float32-array",
	"es.typed-array.float64-array",
	"es.typed-array.int8-array",
	"es.typed-array.int16-array",
	"es.typed-array.int32-array",
	"es.typed-array.uint8-array",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.uint16-array",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/copy-within": [
	"es.typed-array.copy-within"
],
	"core-js/es/typed-array/entries": [
	"es.typed-array.iterator"
],
	"core-js/es/typed-array/every": [
	"es.typed-array.every"
],
	"core-js/es/typed-array/fill": [
	"es.typed-array.fill"
],
	"core-js/es/typed-array/filter": [
	"es.typed-array.filter"
],
	"core-js/es/typed-array/find": [
	"es.typed-array.find"
],
	"core-js/es/typed-array/find-index": [
	"es.typed-array.find-index"
],
	"core-js/es/typed-array/float32-array": [
	"es.object.to-string",
	"es.typed-array.float32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/float64-array": [
	"es.object.to-string",
	"es.typed-array.float64-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/for-each": [
	"es.typed-array.for-each"
],
	"core-js/es/typed-array/from": [
	"es.typed-array.from"
],
	"core-js/es/typed-array/includes": [
	"es.typed-array.includes"
],
	"core-js/es/typed-array/index-of": [
	"es.typed-array.index-of"
],
	"core-js/es/typed-array/int16-array": [
	"es.object.to-string",
	"es.typed-array.int16-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/int32-array": [
	"es.object.to-string",
	"es.typed-array.int32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/int8-array": [
	"es.object.to-string",
	"es.typed-array.int8-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/iterator": [
	"es.typed-array.iterator"
],
	"core-js/es/typed-array/join": [
	"es.typed-array.join"
],
	"core-js/es/typed-array/keys": [
	"es.typed-array.iterator"
],
	"core-js/es/typed-array/last-index-of": [
	"es.typed-array.last-index-of"
],
	"core-js/es/typed-array/map": [
	"es.typed-array.map"
],
	"core-js/es/typed-array/methods": [
	"es.object.to-string",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/of": [
	"es.typed-array.of"
],
	"core-js/es/typed-array/reduce": [
	"es.typed-array.reduce"
],
	"core-js/es/typed-array/reduce-right": [
	"es.typed-array.reduce-right"
],
	"core-js/es/typed-array/reverse": [
	"es.typed-array.reverse"
],
	"core-js/es/typed-array/set": [
	"es.typed-array.set"
],
	"core-js/es/typed-array/slice": [
	"es.typed-array.slice"
],
	"core-js/es/typed-array/some": [
	"es.typed-array.some"
],
	"core-js/es/typed-array/sort": [
	"es.typed-array.sort"
],
	"core-js/es/typed-array/subarray": [
	"es.typed-array.subarray"
],
	"core-js/es/typed-array/to-locale-string": [
	"es.typed-array.to-locale-string"
],
	"core-js/es/typed-array/to-string": [
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/uint16-array": [
	"es.object.to-string",
	"es.typed-array.uint16-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/uint32-array": [
	"es.object.to-string",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/uint8-array": [
	"es.object.to-string",
	"es.typed-array.uint8-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/uint8-clamped-array": [
	"es.object.to-string",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/es/typed-array/values": [
	"es.typed-array.iterator"
],
	"core-js/es/weak-map": [
	"es.object.to-string",
	"es.weak-map",
	"web.dom-collections.iterator"
],
	"core-js/es/weak-set": [
	"es.object.to-string",
	"es.weak-set",
	"web.dom-collections.iterator"
],
	"core-js/features": [
	"es.symbol",
	"es.symbol.description",
	"es.symbol.async-iterator",
	"es.symbol.has-instance",
	"es.symbol.is-concat-spreadable",
	"es.symbol.iterator",
	"es.symbol.match",
	"es.symbol.match-all",
	"es.symbol.replace",
	"es.symbol.search",
	"es.symbol.species",
	"es.symbol.split",
	"es.symbol.to-primitive",
	"es.symbol.to-string-tag",
	"es.symbol.unscopables",
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.from",
	"es.array.includes",
	"es.array.index-of",
	"es.array.is-array",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.of",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map",
	"es.array-buffer.constructor",
	"es.array-buffer.is-view",
	"es.array-buffer.slice",
	"es.data-view",
	"es.date.now",
	"es.date.to-iso-string",
	"es.date.to-json",
	"es.date.to-primitive",
	"es.date.to-string",
	"es.function.bind",
	"es.function.has-instance",
	"es.function.name",
	"es.global-this",
	"es.json.stringify",
	"es.json.to-string-tag",
	"es.map",
	"es.math.acosh",
	"es.math.asinh",
	"es.math.atanh",
	"es.math.cbrt",
	"es.math.clz32",
	"es.math.cosh",
	"es.math.expm1",
	"es.math.fround",
	"es.math.hypot",
	"es.math.imul",
	"es.math.log10",
	"es.math.log1p",
	"es.math.log2",
	"es.math.sign",
	"es.math.sinh",
	"es.math.tanh",
	"es.math.to-string-tag",
	"es.math.trunc",
	"es.number.constructor",
	"es.number.epsilon",
	"es.number.is-finite",
	"es.number.is-integer",
	"es.number.is-nan",
	"es.number.is-safe-integer",
	"es.number.max-safe-integer",
	"es.number.min-safe-integer",
	"es.number.parse-float",
	"es.number.parse-int",
	"es.number.to-fixed",
	"es.number.to-precision",
	"es.object.assign",
	"es.object.create",
	"es.object.define-getter",
	"es.object.define-properties",
	"es.object.define-property",
	"es.object.define-setter",
	"es.object.entries",
	"es.object.freeze",
	"es.object.from-entries",
	"es.object.get-own-property-descriptor",
	"es.object.get-own-property-descriptors",
	"es.object.get-own-property-names",
	"es.object.get-prototype-of",
	"es.object.is",
	"es.object.is-extensible",
	"es.object.is-frozen",
	"es.object.is-sealed",
	"es.object.keys",
	"es.object.lookup-getter",
	"es.object.lookup-setter",
	"es.object.prevent-extensions",
	"es.object.seal",
	"es.object.set-prototype-of",
	"es.object.to-string",
	"es.object.values",
	"es.parse-float",
	"es.parse-int",
	"es.promise",
	"es.promise.all-settled",
	"es.promise.finally",
	"es.reflect.apply",
	"es.reflect.construct",
	"es.reflect.define-property",
	"es.reflect.delete-property",
	"es.reflect.get",
	"es.reflect.get-own-property-descriptor",
	"es.reflect.get-prototype-of",
	"es.reflect.has",
	"es.reflect.is-extensible",
	"es.reflect.own-keys",
	"es.reflect.prevent-extensions",
	"es.reflect.set",
	"es.reflect.set-prototype-of",
	"es.regexp.constructor",
	"es.regexp.exec",
	"es.regexp.flags",
	"es.regexp.sticky",
	"es.regexp.test",
	"es.regexp.to-string",
	"es.set",
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.from-code-point",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.raw",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup",
	"es.typed-array.float32-array",
	"es.typed-array.float64-array",
	"es.typed-array.int8-array",
	"es.typed-array.int16-array",
	"es.typed-array.int32-array",
	"es.typed-array.uint8-array",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.uint16-array",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string",
	"es.weak-map",
	"es.weak-set",
	"esnext.aggregate-error",
	"esnext.array.is-template-object",
	"esnext.array.last-index",
	"esnext.array.last-item",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.composite-key",
	"esnext.composite-symbol",
	"esnext.global-this",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.math.umulh",
	"esnext.number.from-string",
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values",
	"esnext.observable",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"esnext.reflect.define-metadata",
	"esnext.reflect.delete-metadata",
	"esnext.reflect.get-metadata",
	"esnext.reflect.get-metadata-keys",
	"esnext.reflect.get-own-metadata",
	"esnext.reflect.get-own-metadata-keys",
	"esnext.reflect.has-metadata",
	"esnext.reflect.has-own-metadata",
	"esnext.reflect.metadata",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.symbol.replace-all",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-map.upsert",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of",
	"web.dom-collections.for-each",
	"web.dom-collections.iterator",
	"web.immediate",
	"web.queue-microtask",
	"web.timers",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/features/aggregate-error": [
	"es.string.iterator",
	"esnext.aggregate-error",
	"web.dom-collections.iterator"
],
	"core-js/features/array": [
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.from",
	"es.array.includes",
	"es.array.index-of",
	"es.array.is-array",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.of",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map",
	"es.string.iterator",
	"esnext.array.is-template-object",
	"esnext.array.last-index",
	"esnext.array.last-item"
],
	"core-js/features/array-buffer": [
	"es.array-buffer.constructor",
	"es.array-buffer.is-view",
	"es.array-buffer.slice",
	"es.object.to-string"
],
	"core-js/features/array-buffer/constructor": [
	"es.array-buffer.constructor",
	"es.object.to-string"
],
	"core-js/features/array-buffer/is-view": [
	"es.array-buffer.is-view"
],
	"core-js/features/array-buffer/slice": [
	"es.array-buffer.slice"
],
	"core-js/features/array/concat": [
	"es.array.concat"
],
	"core-js/features/array/copy-within": [
	"es.array.copy-within"
],
	"core-js/features/array/entries": [
	"es.array.iterator"
],
	"core-js/features/array/every": [
	"es.array.every"
],
	"core-js/features/array/fill": [
	"es.array.fill"
],
	"core-js/features/array/filter": [
	"es.array.filter"
],
	"core-js/features/array/find": [
	"es.array.find"
],
	"core-js/features/array/find-index": [
	"es.array.find-index"
],
	"core-js/features/array/flat": [
	"es.array.flat",
	"es.array.unscopables.flat"
],
	"core-js/features/array/flat-map": [
	"es.array.flat-map",
	"es.array.unscopables.flat-map"
],
	"core-js/features/array/for-each": [
	"es.array.for-each"
],
	"core-js/features/array/from": [
	"es.array.from",
	"es.string.iterator"
],
	"core-js/features/array/includes": [
	"es.array.includes"
],
	"core-js/features/array/index-of": [
	"es.array.index-of"
],
	"core-js/features/array/is-array": [
	"es.array.is-array"
],
	"core-js/features/array/is-template-object": [
	"esnext.array.is-template-object"
],
	"core-js/features/array/iterator": [
	"es.array.iterator"
],
	"core-js/features/array/join": [
	"es.array.join"
],
	"core-js/features/array/keys": [
	"es.array.iterator"
],
	"core-js/features/array/last-index": [
	"esnext.array.last-index"
],
	"core-js/features/array/last-index-of": [
	"es.array.last-index-of"
],
	"core-js/features/array/last-item": [
	"esnext.array.last-item"
],
	"core-js/features/array/map": [
	"es.array.map"
],
	"core-js/features/array/of": [
	"es.array.of"
],
	"core-js/features/array/reduce": [
	"es.array.reduce"
],
	"core-js/features/array/reduce-right": [
	"es.array.reduce-right"
],
	"core-js/features/array/reverse": [
	"es.array.reverse"
],
	"core-js/features/array/slice": [
	"es.array.slice"
],
	"core-js/features/array/some": [
	"es.array.some"
],
	"core-js/features/array/sort": [
	"es.array.sort"
],
	"core-js/features/array/splice": [
	"es.array.splice"
],
	"core-js/features/array/values": [
	"es.array.iterator"
],
	"core-js/features/array/virtual": [
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.includes",
	"es.array.index-of",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map"
],
	"core-js/features/array/virtual/concat": [
	"es.array.concat"
],
	"core-js/features/array/virtual/copy-within": [
	"es.array.copy-within"
],
	"core-js/features/array/virtual/entries": [
	"es.array.iterator"
],
	"core-js/features/array/virtual/every": [
	"es.array.every"
],
	"core-js/features/array/virtual/fill": [
	"es.array.fill"
],
	"core-js/features/array/virtual/filter": [
	"es.array.filter"
],
	"core-js/features/array/virtual/find": [
	"es.array.find"
],
	"core-js/features/array/virtual/find-index": [
	"es.array.find-index"
],
	"core-js/features/array/virtual/flat": [
	"es.array.flat",
	"es.array.unscopables.flat"
],
	"core-js/features/array/virtual/flat-map": [
	"es.array.flat-map",
	"es.array.unscopables.flat-map"
],
	"core-js/features/array/virtual/for-each": [
	"es.array.for-each"
],
	"core-js/features/array/virtual/includes": [
	"es.array.includes"
],
	"core-js/features/array/virtual/index-of": [
	"es.array.index-of"
],
	"core-js/features/array/virtual/iterator": [
	"es.array.iterator"
],
	"core-js/features/array/virtual/join": [
	"es.array.join"
],
	"core-js/features/array/virtual/keys": [
	"es.array.iterator"
],
	"core-js/features/array/virtual/last-index-of": [
	"es.array.last-index-of"
],
	"core-js/features/array/virtual/map": [
	"es.array.map"
],
	"core-js/features/array/virtual/reduce": [
	"es.array.reduce"
],
	"core-js/features/array/virtual/reduce-right": [
	"es.array.reduce-right"
],
	"core-js/features/array/virtual/reverse": [
	"es.array.reverse"
],
	"core-js/features/array/virtual/slice": [
	"es.array.slice"
],
	"core-js/features/array/virtual/some": [
	"es.array.some"
],
	"core-js/features/array/virtual/sort": [
	"es.array.sort"
],
	"core-js/features/array/virtual/splice": [
	"es.array.splice"
],
	"core-js/features/array/virtual/values": [
	"es.array.iterator"
],
	"core-js/features/async-iterator": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/as-indexed-pairs": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/drop": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.drop",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/every": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.every",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/filter": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.filter",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/find": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.find",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/flat-map": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.flat-map",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/for-each": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.for-each",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/from": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.from",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/map": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.map",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/reduce": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.reduce",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/some": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.some",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/take": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.take",
	"web.dom-collections.iterator"
],
	"core-js/features/async-iterator/to-array": [
	"es.object.to-string",
	"es.promise",
	"es.string.iterator",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.to-array",
	"web.dom-collections.iterator"
],
	"core-js/features/clear-immediate": [
	"web.immediate"
],
	"core-js/features/composite-key": [
	"esnext.composite-key"
],
	"core-js/features/composite-symbol": [
	"es.symbol",
	"esnext.composite-symbol"
],
	"core-js/features/data-view": [
	"es.data-view",
	"es.object.to-string"
],
	"core-js/features/date": [
	"es.date.now",
	"es.date.to-iso-string",
	"es.date.to-json",
	"es.date.to-primitive",
	"es.date.to-string"
],
	"core-js/features/date/now": [
	"es.date.now"
],
	"core-js/features/date/to-iso-string": [
	"es.date.to-iso-string",
	"es.date.to-json"
],
	"core-js/features/date/to-json": [
	"es.date.to-json"
],
	"core-js/features/date/to-primitive": [
	"es.date.to-primitive"
],
	"core-js/features/date/to-string": [
	"es.date.to-string"
],
	"core-js/features/dom-collections": [
	"es.array.iterator",
	"web.dom-collections.for-each",
	"web.dom-collections.iterator"
],
	"core-js/features/dom-collections/for-each": [
	"web.dom-collections.for-each"
],
	"core-js/features/dom-collections/iterator": [
	"web.dom-collections.iterator"
],
	"core-js/features/function": [
	"es.function.bind",
	"es.function.has-instance",
	"es.function.name"
],
	"core-js/features/function/bind": [
	"es.function.bind"
],
	"core-js/features/function/has-instance": [
	"es.function.has-instance"
],
	"core-js/features/function/name": [
	"es.function.name"
],
	"core-js/features/function/virtual": [
	"es.function.bind"
],
	"core-js/features/function/virtual/bind": [
	"es.function.bind"
],
	"core-js/features/get-iterator": [
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/features/get-iterator-method": [
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/features/global-this": [
	"es.global-this",
	"esnext.global-this"
],
	"core-js/features/instance/at": [
	"esnext.string.at"
],
	"core-js/features/instance/bind": [
	"es.function.bind"
],
	"core-js/features/instance/code-point-at": [
	"es.string.code-point-at"
],
	"core-js/features/instance/code-points": [
	"esnext.string.code-points"
],
	"core-js/features/instance/concat": [
	"es.array.concat"
],
	"core-js/features/instance/copy-within": [
	"es.array.copy-within"
],
	"core-js/features/instance/ends-with": [
	"es.string.ends-with"
],
	"core-js/features/instance/entries": [
	"es.array.iterator",
	"web.dom-collections.iterator"
],
	"core-js/features/instance/every": [
	"es.array.every"
],
	"core-js/features/instance/fill": [
	"es.array.fill"
],
	"core-js/features/instance/filter": [
	"es.array.filter"
],
	"core-js/features/instance/find": [
	"es.array.find"
],
	"core-js/features/instance/find-index": [
	"es.array.find-index"
],
	"core-js/features/instance/flags": [
	"es.regexp.flags"
],
	"core-js/features/instance/flat": [
	"es.array.flat",
	"es.array.unscopables.flat"
],
	"core-js/features/instance/flat-map": [
	"es.array.flat-map",
	"es.array.unscopables.flat-map"
],
	"core-js/features/instance/for-each": [
	"es.array.for-each",
	"web.dom-collections.iterator"
],
	"core-js/features/instance/includes": [
	"es.array.includes",
	"es.string.includes"
],
	"core-js/features/instance/index-of": [
	"es.array.index-of"
],
	"core-js/features/instance/keys": [
	"es.array.iterator",
	"web.dom-collections.iterator"
],
	"core-js/features/instance/last-index-of": [
	"es.array.last-index-of"
],
	"core-js/features/instance/map": [
	"es.array.map"
],
	"core-js/features/instance/match-all": [
	"es.string.match-all",
	"esnext.string.match-all"
],
	"core-js/features/instance/pad-end": [
	"es.string.pad-end"
],
	"core-js/features/instance/pad-start": [
	"es.string.pad-start"
],
	"core-js/features/instance/reduce": [
	"es.array.reduce"
],
	"core-js/features/instance/reduce-right": [
	"es.array.reduce-right"
],
	"core-js/features/instance/repeat": [
	"es.string.repeat"
],
	"core-js/features/instance/replace-all": [
	"esnext.string.replace-all"
],
	"core-js/features/instance/reverse": [
	"es.array.reverse"
],
	"core-js/features/instance/slice": [
	"es.array.slice"
],
	"core-js/features/instance/some": [
	"es.array.some"
],
	"core-js/features/instance/sort": [
	"es.array.sort"
],
	"core-js/features/instance/splice": [
	"es.array.splice"
],
	"core-js/features/instance/starts-with": [
	"es.string.starts-with"
],
	"core-js/features/instance/trim": [
	"es.string.trim"
],
	"core-js/features/instance/trim-end": [
	"es.string.trim-end"
],
	"core-js/features/instance/trim-left": [
	"es.string.trim-start"
],
	"core-js/features/instance/trim-right": [
	"es.string.trim-end"
],
	"core-js/features/instance/trim-start": [
	"es.string.trim-start"
],
	"core-js/features/instance/values": [
	"es.array.iterator",
	"web.dom-collections.iterator"
],
	"core-js/features/is-iterable": [
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/as-indexed-pairs": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/drop": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.drop",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/every": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.every",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/filter": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.filter",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/find": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.find",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/flat-map": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.flat-map",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/for-each": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.for-each",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/from": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.from",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/map": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.map",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/reduce": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.reduce",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/some": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.some",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/take": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.take",
	"web.dom-collections.iterator"
],
	"core-js/features/iterator/to-array": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.iterator.constructor",
	"esnext.iterator.to-array",
	"web.dom-collections.iterator"
],
	"core-js/features/json": [
	"es.json.stringify",
	"es.json.to-string-tag"
],
	"core-js/features/json/stringify": [
	"es.json.stringify"
],
	"core-js/features/json/to-string-tag": [
	"es.json.to-string-tag"
],
	"core-js/features/map": [
	"es.map",
	"es.object.to-string",
	"es.string.iterator",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"web.dom-collections.iterator"
],
	"core-js/features/map/delete-all": [
	"es.map",
	"esnext.map.delete-all"
],
	"core-js/features/map/every": [
	"es.map",
	"esnext.map.every"
],
	"core-js/features/map/filter": [
	"es.map",
	"esnext.map.filter"
],
	"core-js/features/map/find": [
	"es.map",
	"esnext.map.find"
],
	"core-js/features/map/find-key": [
	"es.map",
	"esnext.map.find-key"
],
	"core-js/features/map/from": [
	"es.map",
	"es.string.iterator",
	"esnext.map.from",
	"web.dom-collections.iterator"
],
	"core-js/features/map/group-by": [
	"es.map",
	"esnext.map.group-by"
],
	"core-js/features/map/includes": [
	"es.map",
	"esnext.map.includes"
],
	"core-js/features/map/key-by": [
	"es.map",
	"esnext.map.key-by"
],
	"core-js/features/map/key-of": [
	"es.map",
	"esnext.map.key-of"
],
	"core-js/features/map/map-keys": [
	"es.map",
	"esnext.map.map-keys"
],
	"core-js/features/map/map-values": [
	"es.map",
	"esnext.map.map-values"
],
	"core-js/features/map/merge": [
	"es.map",
	"esnext.map.merge"
],
	"core-js/features/map/of": [
	"es.map",
	"es.string.iterator",
	"esnext.map.of",
	"web.dom-collections.iterator"
],
	"core-js/features/map/reduce": [
	"es.map",
	"esnext.map.reduce"
],
	"core-js/features/map/some": [
	"es.map",
	"esnext.map.some"
],
	"core-js/features/map/update": [
	"es.map",
	"esnext.map.update"
],
	"core-js/features/map/update-or-insert": [
	"es.map",
	"esnext.map.update-or-insert"
],
	"core-js/features/map/upsert": [
	"es.map",
	"esnext.map.upsert"
],
	"core-js/features/math": [
	"es.math.acosh",
	"es.math.asinh",
	"es.math.atanh",
	"es.math.cbrt",
	"es.math.clz32",
	"es.math.cosh",
	"es.math.expm1",
	"es.math.fround",
	"es.math.hypot",
	"es.math.imul",
	"es.math.log10",
	"es.math.log1p",
	"es.math.log2",
	"es.math.sign",
	"es.math.sinh",
	"es.math.tanh",
	"es.math.to-string-tag",
	"es.math.trunc",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.math.umulh"
],
	"core-js/features/math/acosh": [
	"es.math.acosh"
],
	"core-js/features/math/asinh": [
	"es.math.asinh"
],
	"core-js/features/math/atanh": [
	"es.math.atanh"
],
	"core-js/features/math/cbrt": [
	"es.math.cbrt"
],
	"core-js/features/math/clamp": [
	"esnext.math.clamp"
],
	"core-js/features/math/clz32": [
	"es.math.clz32"
],
	"core-js/features/math/cosh": [
	"es.math.cosh"
],
	"core-js/features/math/deg-per-rad": [
	"esnext.math.deg-per-rad"
],
	"core-js/features/math/degrees": [
	"esnext.math.degrees"
],
	"core-js/features/math/expm1": [
	"es.math.expm1"
],
	"core-js/features/math/fround": [
	"es.math.fround"
],
	"core-js/features/math/fscale": [
	"esnext.math.fscale"
],
	"core-js/features/math/hypot": [
	"es.math.hypot"
],
	"core-js/features/math/iaddh": [
	"esnext.math.iaddh"
],
	"core-js/features/math/imul": [
	"es.math.imul"
],
	"core-js/features/math/imulh": [
	"esnext.math.imulh"
],
	"core-js/features/math/isubh": [
	"esnext.math.isubh"
],
	"core-js/features/math/log10": [
	"es.math.log10"
],
	"core-js/features/math/log1p": [
	"es.math.log1p"
],
	"core-js/features/math/log2": [
	"es.math.log2"
],
	"core-js/features/math/rad-per-deg": [
	"esnext.math.rad-per-deg"
],
	"core-js/features/math/radians": [
	"esnext.math.radians"
],
	"core-js/features/math/scale": [
	"esnext.math.scale"
],
	"core-js/features/math/seeded-prng": [
	"esnext.math.seeded-prng"
],
	"core-js/features/math/sign": [
	"es.math.sign"
],
	"core-js/features/math/signbit": [
	"esnext.math.signbit"
],
	"core-js/features/math/sinh": [
	"es.math.sinh"
],
	"core-js/features/math/tanh": [
	"es.math.tanh"
],
	"core-js/features/math/to-string-tag": [
	"es.math.to-string-tag"
],
	"core-js/features/math/trunc": [
	"es.math.trunc"
],
	"core-js/features/math/umulh": [
	"esnext.math.umulh"
],
	"core-js/features/number": [
	"es.number.constructor",
	"es.number.epsilon",
	"es.number.is-finite",
	"es.number.is-integer",
	"es.number.is-nan",
	"es.number.is-safe-integer",
	"es.number.max-safe-integer",
	"es.number.min-safe-integer",
	"es.number.parse-float",
	"es.number.parse-int",
	"es.number.to-fixed",
	"es.number.to-precision",
	"esnext.number.from-string"
],
	"core-js/features/number/constructor": [
	"es.number.constructor"
],
	"core-js/features/number/epsilon": [
	"es.number.epsilon"
],
	"core-js/features/number/from-string": [
	"esnext.number.from-string"
],
	"core-js/features/number/is-finite": [
	"es.number.is-finite"
],
	"core-js/features/number/is-integer": [
	"es.number.is-integer"
],
	"core-js/features/number/is-nan": [
	"es.number.is-nan"
],
	"core-js/features/number/is-safe-integer": [
	"es.number.is-safe-integer"
],
	"core-js/features/number/max-safe-integer": [
	"es.number.max-safe-integer"
],
	"core-js/features/number/min-safe-integer": [
	"es.number.min-safe-integer"
],
	"core-js/features/number/parse-float": [
	"es.number.parse-float"
],
	"core-js/features/number/parse-int": [
	"es.number.parse-int"
],
	"core-js/features/number/to-fixed": [
	"es.number.to-fixed"
],
	"core-js/features/number/to-precision": [
	"es.number.to-precision"
],
	"core-js/features/number/virtual": [
	"es.number.to-fixed",
	"es.number.to-precision"
],
	"core-js/features/number/virtual/to-fixed": [
	"es.number.to-fixed"
],
	"core-js/features/number/virtual/to-precision": [
	"es.number.to-precision"
],
	"core-js/features/object": [
	"es.symbol",
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.assign",
	"es.object.create",
	"es.object.define-getter",
	"es.object.define-properties",
	"es.object.define-property",
	"es.object.define-setter",
	"es.object.entries",
	"es.object.freeze",
	"es.object.from-entries",
	"es.object.get-own-property-descriptor",
	"es.object.get-own-property-descriptors",
	"es.object.get-own-property-names",
	"es.object.get-prototype-of",
	"es.object.is",
	"es.object.is-extensible",
	"es.object.is-frozen",
	"es.object.is-sealed",
	"es.object.keys",
	"es.object.lookup-getter",
	"es.object.lookup-setter",
	"es.object.prevent-extensions",
	"es.object.seal",
	"es.object.set-prototype-of",
	"es.object.to-string",
	"es.object.values",
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values"
],
	"core-js/features/object/assign": [
	"es.object.assign"
],
	"core-js/features/object/create": [
	"es.object.create"
],
	"core-js/features/object/define-getter": [
	"es.object.define-getter"
],
	"core-js/features/object/define-properties": [
	"es.object.define-properties"
],
	"core-js/features/object/define-property": [
	"es.object.define-property"
],
	"core-js/features/object/define-setter": [
	"es.object.define-setter"
],
	"core-js/features/object/entries": [
	"es.object.entries"
],
	"core-js/features/object/freeze": [
	"es.object.freeze"
],
	"core-js/features/object/from-entries": [
	"es.array.iterator",
	"es.object.from-entries"
],
	"core-js/features/object/get-own-property-descriptor": [
	"es.object.get-own-property-descriptor"
],
	"core-js/features/object/get-own-property-descriptors": [
	"es.object.get-own-property-descriptors"
],
	"core-js/features/object/get-own-property-names": [
	"es.object.get-own-property-names"
],
	"core-js/features/object/get-own-property-symbols": [
	"es.symbol"
],
	"core-js/features/object/get-prototype-of": [
	"es.object.get-prototype-of"
],
	"core-js/features/object/is": [
	"es.object.is"
],
	"core-js/features/object/is-extensible": [
	"es.object.is-extensible"
],
	"core-js/features/object/is-frozen": [
	"es.object.is-frozen"
],
	"core-js/features/object/is-sealed": [
	"es.object.is-sealed"
],
	"core-js/features/object/iterate-entries": [
	"esnext.object.iterate-entries"
],
	"core-js/features/object/iterate-keys": [
	"esnext.object.iterate-keys"
],
	"core-js/features/object/iterate-values": [
	"esnext.object.iterate-values"
],
	"core-js/features/object/keys": [
	"es.object.keys"
],
	"core-js/features/object/lookup-getter": [
	"es.object.lookup-setter"
],
	"core-js/features/object/lookup-setter": [
	"es.object.lookup-setter"
],
	"core-js/features/object/prevent-extensions": [
	"es.object.prevent-extensions"
],
	"core-js/features/object/seal": [
	"es.object.seal"
],
	"core-js/features/object/set-prototype-of": [
	"es.object.set-prototype-of"
],
	"core-js/features/object/to-string": [
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.to-string"
],
	"core-js/features/object/values": [
	"es.object.values"
],
	"core-js/features/observable": [
	"es.object.to-string",
	"es.string.iterator",
	"esnext.observable",
	"esnext.symbol.observable",
	"web.dom-collections.iterator"
],
	"core-js/features/parse-float": [
	"es.parse-float"
],
	"core-js/features/parse-int": [
	"es.parse-int"
],
	"core-js/features/promise": [
	"es.object.to-string",
	"es.promise",
	"es.promise.all-settled",
	"es.promise.finally",
	"es.string.iterator",
	"esnext.aggregate-error",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"web.dom-collections.iterator"
],
	"core-js/features/promise/all-settled": [
	"es.promise",
	"es.promise.all-settled",
	"esnext.promise.all-settled"
],
	"core-js/features/promise/any": [
	"es.promise",
	"esnext.aggregate-error",
	"esnext.promise.any"
],
	"core-js/features/promise/finally": [
	"es.promise",
	"es.promise.finally"
],
	"core-js/features/promise/try": [
	"es.promise",
	"esnext.promise.try"
],
	"core-js/features/queue-microtask": [
	"web.queue-microtask"
],
	"core-js/features/reflect": [
	"es.reflect.apply",
	"es.reflect.construct",
	"es.reflect.define-property",
	"es.reflect.delete-property",
	"es.reflect.get",
	"es.reflect.get-own-property-descriptor",
	"es.reflect.get-prototype-of",
	"es.reflect.has",
	"es.reflect.is-extensible",
	"es.reflect.own-keys",
	"es.reflect.prevent-extensions",
	"es.reflect.set",
	"es.reflect.set-prototype-of",
	"esnext.reflect.define-metadata",
	"esnext.reflect.delete-metadata",
	"esnext.reflect.get-metadata",
	"esnext.reflect.get-metadata-keys",
	"esnext.reflect.get-own-metadata",
	"esnext.reflect.get-own-metadata-keys",
	"esnext.reflect.has-metadata",
	"esnext.reflect.has-own-metadata",
	"esnext.reflect.metadata"
],
	"core-js/features/reflect/apply": [
	"es.reflect.apply"
],
	"core-js/features/reflect/construct": [
	"es.reflect.construct"
],
	"core-js/features/reflect/define-metadata": [
	"esnext.reflect.define-metadata"
],
	"core-js/features/reflect/define-property": [
	"es.reflect.define-property"
],
	"core-js/features/reflect/delete-metadata": [
	"esnext.reflect.delete-metadata"
],
	"core-js/features/reflect/delete-property": [
	"es.reflect.delete-property"
],
	"core-js/features/reflect/get": [
	"es.reflect.get"
],
	"core-js/features/reflect/get-metadata": [
	"esnext.reflect.get-metadata"
],
	"core-js/features/reflect/get-metadata-keys": [
	"esnext.reflect.get-metadata-keys"
],
	"core-js/features/reflect/get-own-metadata": [
	"esnext.reflect.get-own-metadata"
],
	"core-js/features/reflect/get-own-metadata-keys": [
	"esnext.reflect.get-own-metadata-keys"
],
	"core-js/features/reflect/get-own-property-descriptor": [
	"es.reflect.get-own-property-descriptor"
],
	"core-js/features/reflect/get-prototype-of": [
	"es.reflect.get-prototype-of"
],
	"core-js/features/reflect/has": [
	"es.reflect.has"
],
	"core-js/features/reflect/has-metadata": [
	"esnext.reflect.has-metadata"
],
	"core-js/features/reflect/has-own-metadata": [
	"esnext.reflect.has-own-metadata"
],
	"core-js/features/reflect/is-extensible": [
	"es.reflect.is-extensible"
],
	"core-js/features/reflect/metadata": [
	"esnext.reflect.metadata"
],
	"core-js/features/reflect/own-keys": [
	"es.reflect.own-keys"
],
	"core-js/features/reflect/prevent-extensions": [
	"es.reflect.prevent-extensions"
],
	"core-js/features/reflect/set": [
	"es.reflect.set"
],
	"core-js/features/reflect/set-prototype-of": [
	"es.reflect.set-prototype-of"
],
	"core-js/features/regexp": [
	"es.regexp.constructor",
	"es.regexp.exec",
	"es.regexp.flags",
	"es.regexp.sticky",
	"es.regexp.test",
	"es.regexp.to-string",
	"es.string.match",
	"es.string.replace",
	"es.string.search",
	"es.string.split"
],
	"core-js/features/regexp/constructor": [
	"es.regexp.constructor"
],
	"core-js/features/regexp/flags": [
	"es.regexp.flags"
],
	"core-js/features/regexp/match": [
	"es.string.match"
],
	"core-js/features/regexp/replace": [
	"es.string.replace"
],
	"core-js/features/regexp/search": [
	"es.string.search"
],
	"core-js/features/regexp/split": [
	"es.string.split"
],
	"core-js/features/regexp/sticky": [
	"es.regexp.sticky"
],
	"core-js/features/regexp/test": [
	"es.regexp.exec",
	"es.regexp.test"
],
	"core-js/features/regexp/to-string": [
	"es.regexp.to-string"
],
	"core-js/features/set": [
	"es.object.to-string",
	"es.set",
	"es.string.iterator",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"web.dom-collections.iterator"
],
	"core-js/features/set-immediate": [
	"web.immediate"
],
	"core-js/features/set-interval": [
	"web.timers"
],
	"core-js/features/set-timeout": [
	"web.timers"
],
	"core-js/features/set/add-all": [
	"es.set",
	"esnext.set.add-all"
],
	"core-js/features/set/delete-all": [
	"es.set",
	"esnext.set.delete-all"
],
	"core-js/features/set/difference": [
	"es.set",
	"es.string.iterator",
	"esnext.set.difference",
	"web.dom-collections.iterator"
],
	"core-js/features/set/every": [
	"es.set",
	"esnext.set.every"
],
	"core-js/features/set/filter": [
	"es.set",
	"esnext.set.filter"
],
	"core-js/features/set/find": [
	"es.set",
	"esnext.set.find"
],
	"core-js/features/set/from": [
	"es.set",
	"es.string.iterator",
	"esnext.set.from",
	"web.dom-collections.iterator"
],
	"core-js/features/set/intersection": [
	"es.set",
	"esnext.set.intersection"
],
	"core-js/features/set/is-disjoint-from": [
	"es.set",
	"esnext.set.is-disjoint-from"
],
	"core-js/features/set/is-subset-of": [
	"es.set",
	"es.string.iterator",
	"esnext.set.is-subset-of",
	"web.dom-collections.iterator"
],
	"core-js/features/set/is-superset-of": [
	"es.set",
	"esnext.set.is-superset-of"
],
	"core-js/features/set/join": [
	"es.set",
	"esnext.set.join"
],
	"core-js/features/set/map": [
	"es.set",
	"esnext.set.map"
],
	"core-js/features/set/of": [
	"es.set",
	"es.string.iterator",
	"esnext.set.of",
	"web.dom-collections.iterator"
],
	"core-js/features/set/reduce": [
	"es.set",
	"esnext.set.reduce"
],
	"core-js/features/set/some": [
	"es.set",
	"esnext.set.some"
],
	"core-js/features/set/symmetric-difference": [
	"es.set",
	"es.string.iterator",
	"esnext.set.symmetric-difference",
	"web.dom-collections.iterator"
],
	"core-js/features/set/union": [
	"es.set",
	"es.string.iterator",
	"esnext.set.union",
	"web.dom-collections.iterator"
],
	"core-js/features/string": [
	"es.regexp.exec",
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.from-code-point",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.raw",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all"
],
	"core-js/features/string/anchor": [
	"es.string.anchor"
],
	"core-js/features/string/at": [
	"esnext.string.at"
],
	"core-js/features/string/big": [
	"es.string.big"
],
	"core-js/features/string/blink": [
	"es.string.blink"
],
	"core-js/features/string/bold": [
	"es.string.bold"
],
	"core-js/features/string/code-point-at": [
	"es.string.code-point-at"
],
	"core-js/features/string/code-points": [
	"esnext.string.code-points"
],
	"core-js/features/string/ends-with": [
	"es.string.ends-with"
],
	"core-js/features/string/fixed": [
	"es.string.fixed"
],
	"core-js/features/string/fontcolor": [
	"es.string.fontcolor"
],
	"core-js/features/string/fontsize": [
	"es.string.fontsize"
],
	"core-js/features/string/from-code-point": [
	"es.string.from-code-point"
],
	"core-js/features/string/includes": [
	"es.string.includes"
],
	"core-js/features/string/italics": [
	"es.string.italics"
],
	"core-js/features/string/iterator": [
	"es.string.iterator"
],
	"core-js/features/string/link": [
	"es.string.link"
],
	"core-js/features/string/match": [
	"es.regexp.exec",
	"es.string.match"
],
	"core-js/features/string/match-all": [
	"es.string.match-all",
	"esnext.string.match-all"
],
	"core-js/features/string/pad-end": [
	"es.string.pad-end"
],
	"core-js/features/string/pad-start": [
	"es.string.pad-start"
],
	"core-js/features/string/raw": [
	"es.string.raw"
],
	"core-js/features/string/repeat": [
	"es.string.repeat"
],
	"core-js/features/string/replace": [
	"es.regexp.exec",
	"es.string.replace"
],
	"core-js/features/string/replace-all": [
	"esnext.string.replace-all"
],
	"core-js/features/string/search": [
	"es.regexp.exec",
	"es.string.search"
],
	"core-js/features/string/small": [
	"es.string.small"
],
	"core-js/features/string/split": [
	"es.regexp.exec",
	"es.string.split"
],
	"core-js/features/string/starts-with": [
	"es.string.starts-with"
],
	"core-js/features/string/strike": [
	"es.string.strike"
],
	"core-js/features/string/sub": [
	"es.string.sub"
],
	"core-js/features/string/sup": [
	"es.string.sup"
],
	"core-js/features/string/trim": [
	"es.string.trim"
],
	"core-js/features/string/trim-end": [
	"es.string.trim-end"
],
	"core-js/features/string/trim-left": [
	"es.string.trim-start"
],
	"core-js/features/string/trim-right": [
	"es.string.trim-end"
],
	"core-js/features/string/trim-start": [
	"es.string.trim-start"
],
	"core-js/features/string/virtual": [
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all"
],
	"core-js/features/string/virtual/anchor": [
	"es.string.anchor"
],
	"core-js/features/string/virtual/at": [
	"esnext.string.at"
],
	"core-js/features/string/virtual/big": [
	"es.string.big"
],
	"core-js/features/string/virtual/blink": [
	"es.string.blink"
],
	"core-js/features/string/virtual/bold": [
	"es.string.bold"
],
	"core-js/features/string/virtual/code-point-at": [
	"es.string.code-point-at"
],
	"core-js/features/string/virtual/code-points": [
	"esnext.string.code-points"
],
	"core-js/features/string/virtual/ends-with": [
	"es.string.ends-with"
],
	"core-js/features/string/virtual/fixed": [
	"es.string.fixed"
],
	"core-js/features/string/virtual/fontcolor": [
	"es.string.fontcolor"
],
	"core-js/features/string/virtual/fontsize": [
	"es.string.fontsize"
],
	"core-js/features/string/virtual/includes": [
	"es.string.includes"
],
	"core-js/features/string/virtual/italics": [
	"es.string.italics"
],
	"core-js/features/string/virtual/iterator": [
	"es.string.iterator"
],
	"core-js/features/string/virtual/link": [
	"es.string.link"
],
	"core-js/features/string/virtual/match-all": [
	"es.string.match-all",
	"esnext.string.match-all"
],
	"core-js/features/string/virtual/pad-end": [
	"es.string.pad-end"
],
	"core-js/features/string/virtual/pad-start": [
	"es.string.pad-start"
],
	"core-js/features/string/virtual/repeat": [
	"es.string.repeat"
],
	"core-js/features/string/virtual/replace-all": [
	"esnext.string.replace-all"
],
	"core-js/features/string/virtual/small": [
	"es.string.small"
],
	"core-js/features/string/virtual/starts-with": [
	"es.string.starts-with"
],
	"core-js/features/string/virtual/strike": [
	"es.string.strike"
],
	"core-js/features/string/virtual/sub": [
	"es.string.sub"
],
	"core-js/features/string/virtual/sup": [
	"es.string.sup"
],
	"core-js/features/string/virtual/trim": [
	"es.string.trim"
],
	"core-js/features/string/virtual/trim-end": [
	"es.string.trim-end"
],
	"core-js/features/string/virtual/trim-left": [
	"es.string.trim-start"
],
	"core-js/features/string/virtual/trim-right": [
	"es.string.trim-end"
],
	"core-js/features/string/virtual/trim-start": [
	"es.string.trim-start"
],
	"core-js/features/symbol": [
	"es.symbol",
	"es.symbol.description",
	"es.symbol.async-iterator",
	"es.symbol.has-instance",
	"es.symbol.is-concat-spreadable",
	"es.symbol.iterator",
	"es.symbol.match",
	"es.symbol.match-all",
	"es.symbol.replace",
	"es.symbol.search",
	"es.symbol.species",
	"es.symbol.split",
	"es.symbol.to-primitive",
	"es.symbol.to-string-tag",
	"es.symbol.unscopables",
	"es.array.concat",
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.to-string",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.symbol.replace-all"
],
	"core-js/features/symbol/async-dispose": [
	"esnext.symbol.async-dispose"
],
	"core-js/features/symbol/async-iterator": [
	"es.symbol.async-iterator"
],
	"core-js/features/symbol/description": [
	"es.symbol.description"
],
	"core-js/features/symbol/dispose": [
	"esnext.symbol.dispose"
],
	"core-js/features/symbol/for": [
	"es.symbol"
],
	"core-js/features/symbol/has-instance": [
	"es.symbol.has-instance",
	"es.function.has-instance"
],
	"core-js/features/symbol/is-concat-spreadable": [
	"es.symbol.is-concat-spreadable",
	"es.array.concat"
],
	"core-js/features/symbol/iterator": [
	"es.symbol.iterator",
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/features/symbol/key-for": [
	"es.symbol"
],
	"core-js/features/symbol/match": [
	"es.symbol.match",
	"es.string.match"
],
	"core-js/features/symbol/match-all": [
	"es.symbol.match-all",
	"es.string.match-all"
],
	"core-js/features/symbol/observable": [
	"esnext.symbol.observable"
],
	"core-js/features/symbol/pattern-match": [
	"esnext.symbol.pattern-match"
],
	"core-js/features/symbol/replace": [
	"es.symbol.replace",
	"es.string.replace"
],
	"core-js/features/symbol/replace-all": [
	"esnext.symbol.replace-all"
],
	"core-js/features/symbol/search": [
	"es.symbol.search",
	"es.string.search"
],
	"core-js/features/symbol/species": [
	"es.symbol.species"
],
	"core-js/features/symbol/split": [
	"es.symbol.split",
	"es.string.split"
],
	"core-js/features/symbol/to-primitive": [
	"es.symbol.to-primitive"
],
	"core-js/features/symbol/to-string-tag": [
	"es.symbol.to-string-tag",
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.to-string"
],
	"core-js/features/symbol/unscopables": [
	"es.symbol.unscopables"
],
	"core-js/features/typed-array": [
	"es.object.to-string",
	"es.typed-array.float32-array",
	"es.typed-array.float64-array",
	"es.typed-array.int8-array",
	"es.typed-array.int16-array",
	"es.typed-array.int32-array",
	"es.typed-array.uint8-array",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.uint16-array",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/copy-within": [
	"es.typed-array.copy-within"
],
	"core-js/features/typed-array/entries": [
	"es.typed-array.iterator"
],
	"core-js/features/typed-array/every": [
	"es.typed-array.every"
],
	"core-js/features/typed-array/fill": [
	"es.typed-array.fill"
],
	"core-js/features/typed-array/filter": [
	"es.typed-array.filter"
],
	"core-js/features/typed-array/find": [
	"es.typed-array.find"
],
	"core-js/features/typed-array/find-index": [
	"es.typed-array.find-index"
],
	"core-js/features/typed-array/float32-array": [
	"es.object.to-string",
	"es.typed-array.float32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/float64-array": [
	"es.object.to-string",
	"es.typed-array.float64-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/for-each": [
	"es.typed-array.for-each"
],
	"core-js/features/typed-array/from": [
	"es.typed-array.from"
],
	"core-js/features/typed-array/includes": [
	"es.typed-array.includes"
],
	"core-js/features/typed-array/index-of": [
	"es.typed-array.index-of"
],
	"core-js/features/typed-array/int16-array": [
	"es.object.to-string",
	"es.typed-array.int16-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/int32-array": [
	"es.object.to-string",
	"es.typed-array.int32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/int8-array": [
	"es.object.to-string",
	"es.typed-array.int8-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/iterator": [
	"es.typed-array.iterator"
],
	"core-js/features/typed-array/join": [
	"es.typed-array.join"
],
	"core-js/features/typed-array/keys": [
	"es.typed-array.iterator"
],
	"core-js/features/typed-array/last-index-of": [
	"es.typed-array.last-index-of"
],
	"core-js/features/typed-array/map": [
	"es.typed-array.map"
],
	"core-js/features/typed-array/of": [
	"es.typed-array.of"
],
	"core-js/features/typed-array/reduce": [
	"es.typed-array.reduce"
],
	"core-js/features/typed-array/reduce-right": [
	"es.typed-array.reduce-right"
],
	"core-js/features/typed-array/reverse": [
	"es.typed-array.reverse"
],
	"core-js/features/typed-array/set": [
	"es.typed-array.set"
],
	"core-js/features/typed-array/slice": [
	"es.typed-array.slice"
],
	"core-js/features/typed-array/some": [
	"es.typed-array.some"
],
	"core-js/features/typed-array/sort": [
	"es.typed-array.sort"
],
	"core-js/features/typed-array/subarray": [
	"es.typed-array.subarray"
],
	"core-js/features/typed-array/to-locale-string": [
	"es.typed-array.to-locale-string"
],
	"core-js/features/typed-array/to-string": [
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/uint16-array": [
	"es.object.to-string",
	"es.typed-array.uint16-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/uint32-array": [
	"es.object.to-string",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/uint8-array": [
	"es.object.to-string",
	"es.typed-array.uint8-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/uint8-clamped-array": [
	"es.object.to-string",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/features/typed-array/values": [
	"es.typed-array.iterator"
],
	"core-js/features/url": [
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/features/url-search-params": [
	"web.url-search-params"
],
	"core-js/features/url/to-json": [
	"web.url.to-json"
],
	"core-js/features/weak-map": [
	"es.object.to-string",
	"es.weak-map",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-map.upsert",
	"web.dom-collections.iterator"
],
	"core-js/features/weak-map/delete-all": [
	"es.weak-map",
	"esnext.weak-map.delete-all"
],
	"core-js/features/weak-map/from": [
	"es.string.iterator",
	"es.weak-map",
	"esnext.weak-map.from",
	"web.dom-collections.iterator"
],
	"core-js/features/weak-map/of": [
	"es.string.iterator",
	"es.weak-map",
	"esnext.weak-map.of",
	"web.dom-collections.iterator"
],
	"core-js/features/weak-map/upsert": [
	"es.weak-map",
	"esnext.weak-map.upsert"
],
	"core-js/features/weak-set": [
	"es.object.to-string",
	"es.weak-set",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of",
	"web.dom-collections.iterator"
],
	"core-js/features/weak-set/add-all": [
	"es.weak-set",
	"esnext.weak-set.add-all"
],
	"core-js/features/weak-set/delete-all": [
	"es.weak-set",
	"esnext.weak-set.delete-all"
],
	"core-js/features/weak-set/from": [
	"es.string.iterator",
	"es.weak-set",
	"esnext.weak-set.from",
	"web.dom-collections.iterator"
],
	"core-js/features/weak-set/of": [
	"es.string.iterator",
	"es.weak-set",
	"esnext.weak-set.of",
	"web.dom-collections.iterator"
],
	"core-js/modules/es.array-buffer.constructor": [
	"es.array-buffer.constructor"
],
	"core-js/modules/es.array-buffer.is-view": [
	"es.array-buffer.is-view"
],
	"core-js/modules/es.array-buffer.slice": [
	"es.array-buffer.slice"
],
	"core-js/modules/es.array.concat": [
	"es.array.concat"
],
	"core-js/modules/es.array.copy-within": [
	"es.array.copy-within"
],
	"core-js/modules/es.array.every": [
	"es.array.every"
],
	"core-js/modules/es.array.fill": [
	"es.array.fill"
],
	"core-js/modules/es.array.filter": [
	"es.array.filter"
],
	"core-js/modules/es.array.find": [
	"es.array.find"
],
	"core-js/modules/es.array.find-index": [
	"es.array.find-index"
],
	"core-js/modules/es.array.flat": [
	"es.array.flat"
],
	"core-js/modules/es.array.flat-map": [
	"es.array.flat-map"
],
	"core-js/modules/es.array.for-each": [
	"es.array.for-each"
],
	"core-js/modules/es.array.from": [
	"es.array.from"
],
	"core-js/modules/es.array.includes": [
	"es.array.includes"
],
	"core-js/modules/es.array.index-of": [
	"es.array.index-of"
],
	"core-js/modules/es.array.is-array": [
	"es.array.is-array"
],
	"core-js/modules/es.array.iterator": [
	"es.array.iterator"
],
	"core-js/modules/es.array.join": [
	"es.array.join"
],
	"core-js/modules/es.array.last-index-of": [
	"es.array.last-index-of"
],
	"core-js/modules/es.array.map": [
	"es.array.map"
],
	"core-js/modules/es.array.of": [
	"es.array.of"
],
	"core-js/modules/es.array.reduce": [
	"es.array.reduce"
],
	"core-js/modules/es.array.reduce-right": [
	"es.array.reduce-right"
],
	"core-js/modules/es.array.reverse": [
	"es.array.reverse"
],
	"core-js/modules/es.array.slice": [
	"es.array.slice"
],
	"core-js/modules/es.array.some": [
	"es.array.some"
],
	"core-js/modules/es.array.sort": [
	"es.array.sort"
],
	"core-js/modules/es.array.species": [
	"es.array.species"
],
	"core-js/modules/es.array.splice": [
	"es.array.splice"
],
	"core-js/modules/es.array.unscopables.flat": [
	"es.array.unscopables.flat"
],
	"core-js/modules/es.array.unscopables.flat-map": [
	"es.array.unscopables.flat-map"
],
	"core-js/modules/es.data-view": [
	"es.data-view"
],
	"core-js/modules/es.date.now": [
	"es.date.now"
],
	"core-js/modules/es.date.to-iso-string": [
	"es.date.to-iso-string"
],
	"core-js/modules/es.date.to-json": [
	"es.date.to-json"
],
	"core-js/modules/es.date.to-primitive": [
	"es.date.to-primitive"
],
	"core-js/modules/es.date.to-string": [
	"es.date.to-string"
],
	"core-js/modules/es.function.bind": [
	"es.function.bind"
],
	"core-js/modules/es.function.has-instance": [
	"es.function.has-instance"
],
	"core-js/modules/es.function.name": [
	"es.function.name"
],
	"core-js/modules/es.global-this": [
	"es.global-this"
],
	"core-js/modules/es.json.stringify": [
	"es.json.stringify"
],
	"core-js/modules/es.json.to-string-tag": [
	"es.json.to-string-tag"
],
	"core-js/modules/es.map": [
	"es.map"
],
	"core-js/modules/es.math.acosh": [
	"es.math.acosh"
],
	"core-js/modules/es.math.asinh": [
	"es.math.asinh"
],
	"core-js/modules/es.math.atanh": [
	"es.math.atanh"
],
	"core-js/modules/es.math.cbrt": [
	"es.math.cbrt"
],
	"core-js/modules/es.math.clz32": [
	"es.math.clz32"
],
	"core-js/modules/es.math.cosh": [
	"es.math.cosh"
],
	"core-js/modules/es.math.expm1": [
	"es.math.expm1"
],
	"core-js/modules/es.math.fround": [
	"es.math.fround"
],
	"core-js/modules/es.math.hypot": [
	"es.math.hypot"
],
	"core-js/modules/es.math.imul": [
	"es.math.imul"
],
	"core-js/modules/es.math.log10": [
	"es.math.log10"
],
	"core-js/modules/es.math.log1p": [
	"es.math.log1p"
],
	"core-js/modules/es.math.log2": [
	"es.math.log2"
],
	"core-js/modules/es.math.sign": [
	"es.math.sign"
],
	"core-js/modules/es.math.sinh": [
	"es.math.sinh"
],
	"core-js/modules/es.math.tanh": [
	"es.math.tanh"
],
	"core-js/modules/es.math.to-string-tag": [
	"es.math.to-string-tag"
],
	"core-js/modules/es.math.trunc": [
	"es.math.trunc"
],
	"core-js/modules/es.number.constructor": [
	"es.number.constructor"
],
	"core-js/modules/es.number.epsilon": [
	"es.number.epsilon"
],
	"core-js/modules/es.number.is-finite": [
	"es.number.is-finite"
],
	"core-js/modules/es.number.is-integer": [
	"es.number.is-integer"
],
	"core-js/modules/es.number.is-nan": [
	"es.number.is-nan"
],
	"core-js/modules/es.number.is-safe-integer": [
	"es.number.is-safe-integer"
],
	"core-js/modules/es.number.max-safe-integer": [
	"es.number.max-safe-integer"
],
	"core-js/modules/es.number.min-safe-integer": [
	"es.number.min-safe-integer"
],
	"core-js/modules/es.number.parse-float": [
	"es.number.parse-float"
],
	"core-js/modules/es.number.parse-int": [
	"es.number.parse-int"
],
	"core-js/modules/es.number.to-fixed": [
	"es.number.to-fixed"
],
	"core-js/modules/es.number.to-precision": [
	"es.number.to-precision"
],
	"core-js/modules/es.object.assign": [
	"es.object.assign"
],
	"core-js/modules/es.object.create": [
	"es.object.create"
],
	"core-js/modules/es.object.define-getter": [
	"es.object.define-getter"
],
	"core-js/modules/es.object.define-properties": [
	"es.object.define-properties"
],
	"core-js/modules/es.object.define-property": [
	"es.object.define-property"
],
	"core-js/modules/es.object.define-setter": [
	"es.object.define-setter"
],
	"core-js/modules/es.object.entries": [
	"es.object.entries"
],
	"core-js/modules/es.object.freeze": [
	"es.object.freeze"
],
	"core-js/modules/es.object.from-entries": [
	"es.object.from-entries"
],
	"core-js/modules/es.object.get-own-property-descriptor": [
	"es.object.get-own-property-descriptor"
],
	"core-js/modules/es.object.get-own-property-descriptors": [
	"es.object.get-own-property-descriptors"
],
	"core-js/modules/es.object.get-own-property-names": [
	"es.object.get-own-property-names"
],
	"core-js/modules/es.object.get-prototype-of": [
	"es.object.get-prototype-of"
],
	"core-js/modules/es.object.is": [
	"es.object.is"
],
	"core-js/modules/es.object.is-extensible": [
	"es.object.is-extensible"
],
	"core-js/modules/es.object.is-frozen": [
	"es.object.is-frozen"
],
	"core-js/modules/es.object.is-sealed": [
	"es.object.is-sealed"
],
	"core-js/modules/es.object.keys": [
	"es.object.keys"
],
	"core-js/modules/es.object.lookup-getter": [
	"es.object.lookup-getter"
],
	"core-js/modules/es.object.lookup-setter": [
	"es.object.lookup-setter"
],
	"core-js/modules/es.object.prevent-extensions": [
	"es.object.prevent-extensions"
],
	"core-js/modules/es.object.seal": [
	"es.object.seal"
],
	"core-js/modules/es.object.set-prototype-of": [
	"es.object.set-prototype-of"
],
	"core-js/modules/es.object.to-string": [
	"es.object.to-string"
],
	"core-js/modules/es.object.values": [
	"es.object.values"
],
	"core-js/modules/es.parse-float": [
	"es.parse-float"
],
	"core-js/modules/es.parse-int": [
	"es.parse-int"
],
	"core-js/modules/es.promise": [
	"es.promise"
],
	"core-js/modules/es.promise.all-settled": [
	"es.promise.all-settled"
],
	"core-js/modules/es.promise.finally": [
	"es.promise.finally"
],
	"core-js/modules/es.reflect.apply": [
	"es.reflect.apply"
],
	"core-js/modules/es.reflect.construct": [
	"es.reflect.construct"
],
	"core-js/modules/es.reflect.define-property": [
	"es.reflect.define-property"
],
	"core-js/modules/es.reflect.delete-property": [
	"es.reflect.delete-property"
],
	"core-js/modules/es.reflect.get": [
	"es.reflect.get"
],
	"core-js/modules/es.reflect.get-own-property-descriptor": [
	"es.reflect.get-own-property-descriptor"
],
	"core-js/modules/es.reflect.get-prototype-of": [
	"es.reflect.get-prototype-of"
],
	"core-js/modules/es.reflect.has": [
	"es.reflect.has"
],
	"core-js/modules/es.reflect.is-extensible": [
	"es.reflect.is-extensible"
],
	"core-js/modules/es.reflect.own-keys": [
	"es.reflect.own-keys"
],
	"core-js/modules/es.reflect.prevent-extensions": [
	"es.reflect.prevent-extensions"
],
	"core-js/modules/es.reflect.set": [
	"es.reflect.set"
],
	"core-js/modules/es.reflect.set-prototype-of": [
	"es.reflect.set-prototype-of"
],
	"core-js/modules/es.regexp.constructor": [
	"es.regexp.constructor"
],
	"core-js/modules/es.regexp.exec": [
	"es.regexp.exec"
],
	"core-js/modules/es.regexp.flags": [
	"es.regexp.flags"
],
	"core-js/modules/es.regexp.sticky": [
	"es.regexp.sticky"
],
	"core-js/modules/es.regexp.test": [
	"es.regexp.test"
],
	"core-js/modules/es.regexp.to-string": [
	"es.regexp.to-string"
],
	"core-js/modules/es.set": [
	"es.set"
],
	"core-js/modules/es.string.anchor": [
	"es.string.anchor"
],
	"core-js/modules/es.string.big": [
	"es.string.big"
],
	"core-js/modules/es.string.blink": [
	"es.string.blink"
],
	"core-js/modules/es.string.bold": [
	"es.string.bold"
],
	"core-js/modules/es.string.code-point-at": [
	"es.string.code-point-at"
],
	"core-js/modules/es.string.ends-with": [
	"es.string.ends-with"
],
	"core-js/modules/es.string.fixed": [
	"es.string.fixed"
],
	"core-js/modules/es.string.fontcolor": [
	"es.string.fontcolor"
],
	"core-js/modules/es.string.fontsize": [
	"es.string.fontsize"
],
	"core-js/modules/es.string.from-code-point": [
	"es.string.from-code-point"
],
	"core-js/modules/es.string.includes": [
	"es.string.includes"
],
	"core-js/modules/es.string.italics": [
	"es.string.italics"
],
	"core-js/modules/es.string.iterator": [
	"es.string.iterator"
],
	"core-js/modules/es.string.link": [
	"es.string.link"
],
	"core-js/modules/es.string.match": [
	"es.string.match"
],
	"core-js/modules/es.string.match-all": [
	"es.string.match-all"
],
	"core-js/modules/es.string.pad-end": [
	"es.string.pad-end"
],
	"core-js/modules/es.string.pad-start": [
	"es.string.pad-start"
],
	"core-js/modules/es.string.raw": [
	"es.string.raw"
],
	"core-js/modules/es.string.repeat": [
	"es.string.repeat"
],
	"core-js/modules/es.string.replace": [
	"es.string.replace"
],
	"core-js/modules/es.string.search": [
	"es.string.search"
],
	"core-js/modules/es.string.small": [
	"es.string.small"
],
	"core-js/modules/es.string.split": [
	"es.string.split"
],
	"core-js/modules/es.string.starts-with": [
	"es.string.starts-with"
],
	"core-js/modules/es.string.strike": [
	"es.string.strike"
],
	"core-js/modules/es.string.sub": [
	"es.string.sub"
],
	"core-js/modules/es.string.sup": [
	"es.string.sup"
],
	"core-js/modules/es.string.trim": [
	"es.string.trim"
],
	"core-js/modules/es.string.trim-end": [
	"es.string.trim-end"
],
	"core-js/modules/es.string.trim-start": [
	"es.string.trim-start"
],
	"core-js/modules/es.symbol": [
	"es.symbol"
],
	"core-js/modules/es.symbol.async-iterator": [
	"es.symbol.async-iterator"
],
	"core-js/modules/es.symbol.description": [
	"es.symbol.description"
],
	"core-js/modules/es.symbol.has-instance": [
	"es.symbol.has-instance"
],
	"core-js/modules/es.symbol.is-concat-spreadable": [
	"es.symbol.is-concat-spreadable"
],
	"core-js/modules/es.symbol.iterator": [
	"es.symbol.iterator"
],
	"core-js/modules/es.symbol.match": [
	"es.symbol.match"
],
	"core-js/modules/es.symbol.match-all": [
	"es.symbol.match-all"
],
	"core-js/modules/es.symbol.replace": [
	"es.symbol.replace"
],
	"core-js/modules/es.symbol.search": [
	"es.symbol.search"
],
	"core-js/modules/es.symbol.species": [
	"es.symbol.species"
],
	"core-js/modules/es.symbol.split": [
	"es.symbol.split"
],
	"core-js/modules/es.symbol.to-primitive": [
	"es.symbol.to-primitive"
],
	"core-js/modules/es.symbol.to-string-tag": [
	"es.symbol.to-string-tag"
],
	"core-js/modules/es.symbol.unscopables": [
	"es.symbol.unscopables"
],
	"core-js/modules/es.typed-array.copy-within": [
	"es.typed-array.copy-within"
],
	"core-js/modules/es.typed-array.every": [
	"es.typed-array.every"
],
	"core-js/modules/es.typed-array.fill": [
	"es.typed-array.fill"
],
	"core-js/modules/es.typed-array.filter": [
	"es.typed-array.filter"
],
	"core-js/modules/es.typed-array.find": [
	"es.typed-array.find"
],
	"core-js/modules/es.typed-array.find-index": [
	"es.typed-array.find-index"
],
	"core-js/modules/es.typed-array.float32-array": [
	"es.typed-array.float32-array"
],
	"core-js/modules/es.typed-array.float64-array": [
	"es.typed-array.float64-array"
],
	"core-js/modules/es.typed-array.for-each": [
	"es.typed-array.for-each"
],
	"core-js/modules/es.typed-array.from": [
	"es.typed-array.from"
],
	"core-js/modules/es.typed-array.includes": [
	"es.typed-array.includes"
],
	"core-js/modules/es.typed-array.index-of": [
	"es.typed-array.index-of"
],
	"core-js/modules/es.typed-array.int16-array": [
	"es.typed-array.int16-array"
],
	"core-js/modules/es.typed-array.int32-array": [
	"es.typed-array.int32-array"
],
	"core-js/modules/es.typed-array.int8-array": [
	"es.typed-array.int8-array"
],
	"core-js/modules/es.typed-array.iterator": [
	"es.typed-array.iterator"
],
	"core-js/modules/es.typed-array.join": [
	"es.typed-array.join"
],
	"core-js/modules/es.typed-array.last-index-of": [
	"es.typed-array.last-index-of"
],
	"core-js/modules/es.typed-array.map": [
	"es.typed-array.map"
],
	"core-js/modules/es.typed-array.of": [
	"es.typed-array.of"
],
	"core-js/modules/es.typed-array.reduce": [
	"es.typed-array.reduce"
],
	"core-js/modules/es.typed-array.reduce-right": [
	"es.typed-array.reduce-right"
],
	"core-js/modules/es.typed-array.reverse": [
	"es.typed-array.reverse"
],
	"core-js/modules/es.typed-array.set": [
	"es.typed-array.set"
],
	"core-js/modules/es.typed-array.slice": [
	"es.typed-array.slice"
],
	"core-js/modules/es.typed-array.some": [
	"es.typed-array.some"
],
	"core-js/modules/es.typed-array.sort": [
	"es.typed-array.sort"
],
	"core-js/modules/es.typed-array.subarray": [
	"es.typed-array.subarray"
],
	"core-js/modules/es.typed-array.to-locale-string": [
	"es.typed-array.to-locale-string"
],
	"core-js/modules/es.typed-array.to-string": [
	"es.typed-array.to-string"
],
	"core-js/modules/es.typed-array.uint16-array": [
	"es.typed-array.uint16-array"
],
	"core-js/modules/es.typed-array.uint32-array": [
	"es.typed-array.uint32-array"
],
	"core-js/modules/es.typed-array.uint8-array": [
	"es.typed-array.uint8-array"
],
	"core-js/modules/es.typed-array.uint8-clamped-array": [
	"es.typed-array.uint8-clamped-array"
],
	"core-js/modules/es.weak-map": [
	"es.weak-map"
],
	"core-js/modules/es.weak-set": [
	"es.weak-set"
],
	"core-js/modules/esnext.aggregate-error": [
	"esnext.aggregate-error"
],
	"core-js/modules/esnext.array.is-template-object": [
	"esnext.array.is-template-object"
],
	"core-js/modules/esnext.array.last-index": [
	"esnext.array.last-index"
],
	"core-js/modules/esnext.array.last-item": [
	"esnext.array.last-item"
],
	"core-js/modules/esnext.async-iterator.as-indexed-pairs": [
	"esnext.async-iterator.as-indexed-pairs"
],
	"core-js/modules/esnext.async-iterator.constructor": [
	"esnext.async-iterator.constructor"
],
	"core-js/modules/esnext.async-iterator.drop": [
	"esnext.async-iterator.drop"
],
	"core-js/modules/esnext.async-iterator.every": [
	"esnext.async-iterator.every"
],
	"core-js/modules/esnext.async-iterator.filter": [
	"esnext.async-iterator.filter"
],
	"core-js/modules/esnext.async-iterator.find": [
	"esnext.async-iterator.find"
],
	"core-js/modules/esnext.async-iterator.flat-map": [
	"esnext.async-iterator.flat-map"
],
	"core-js/modules/esnext.async-iterator.for-each": [
	"esnext.async-iterator.for-each"
],
	"core-js/modules/esnext.async-iterator.from": [
	"esnext.async-iterator.from"
],
	"core-js/modules/esnext.async-iterator.map": [
	"esnext.async-iterator.map"
],
	"core-js/modules/esnext.async-iterator.reduce": [
	"esnext.async-iterator.reduce"
],
	"core-js/modules/esnext.async-iterator.some": [
	"esnext.async-iterator.some"
],
	"core-js/modules/esnext.async-iterator.take": [
	"esnext.async-iterator.take"
],
	"core-js/modules/esnext.async-iterator.to-array": [
	"esnext.async-iterator.to-array"
],
	"core-js/modules/esnext.composite-key": [
	"esnext.composite-key"
],
	"core-js/modules/esnext.composite-symbol": [
	"esnext.composite-symbol"
],
	"core-js/modules/esnext.global-this": [
	"esnext.global-this"
],
	"core-js/modules/esnext.iterator.as-indexed-pairs": [
	"esnext.iterator.as-indexed-pairs"
],
	"core-js/modules/esnext.iterator.constructor": [
	"esnext.iterator.constructor"
],
	"core-js/modules/esnext.iterator.drop": [
	"esnext.iterator.drop"
],
	"core-js/modules/esnext.iterator.every": [
	"esnext.iterator.every"
],
	"core-js/modules/esnext.iterator.filter": [
	"esnext.iterator.filter"
],
	"core-js/modules/esnext.iterator.find": [
	"esnext.iterator.find"
],
	"core-js/modules/esnext.iterator.flat-map": [
	"esnext.iterator.flat-map"
],
	"core-js/modules/esnext.iterator.for-each": [
	"esnext.iterator.for-each"
],
	"core-js/modules/esnext.iterator.from": [
	"esnext.iterator.from"
],
	"core-js/modules/esnext.iterator.map": [
	"esnext.iterator.map"
],
	"core-js/modules/esnext.iterator.reduce": [
	"esnext.iterator.reduce"
],
	"core-js/modules/esnext.iterator.some": [
	"esnext.iterator.some"
],
	"core-js/modules/esnext.iterator.take": [
	"esnext.iterator.take"
],
	"core-js/modules/esnext.iterator.to-array": [
	"esnext.iterator.to-array"
],
	"core-js/modules/esnext.map.delete-all": [
	"esnext.map.delete-all"
],
	"core-js/modules/esnext.map.every": [
	"esnext.map.every"
],
	"core-js/modules/esnext.map.filter": [
	"esnext.map.filter"
],
	"core-js/modules/esnext.map.find": [
	"esnext.map.find"
],
	"core-js/modules/esnext.map.find-key": [
	"esnext.map.find-key"
],
	"core-js/modules/esnext.map.from": [
	"esnext.map.from"
],
	"core-js/modules/esnext.map.group-by": [
	"esnext.map.group-by"
],
	"core-js/modules/esnext.map.includes": [
	"esnext.map.includes"
],
	"core-js/modules/esnext.map.key-by": [
	"esnext.map.key-by"
],
	"core-js/modules/esnext.map.key-of": [
	"esnext.map.key-of"
],
	"core-js/modules/esnext.map.map-keys": [
	"esnext.map.map-keys"
],
	"core-js/modules/esnext.map.map-values": [
	"esnext.map.map-values"
],
	"core-js/modules/esnext.map.merge": [
	"esnext.map.merge"
],
	"core-js/modules/esnext.map.of": [
	"esnext.map.of"
],
	"core-js/modules/esnext.map.reduce": [
	"esnext.map.reduce"
],
	"core-js/modules/esnext.map.some": [
	"esnext.map.some"
],
	"core-js/modules/esnext.map.update": [
	"esnext.map.update"
],
	"core-js/modules/esnext.map.update-or-insert": [
	"esnext.map.update-or-insert"
],
	"core-js/modules/esnext.map.upsert": [
	"esnext.map.upsert"
],
	"core-js/modules/esnext.math.clamp": [
	"esnext.math.clamp"
],
	"core-js/modules/esnext.math.deg-per-rad": [
	"esnext.math.deg-per-rad"
],
	"core-js/modules/esnext.math.degrees": [
	"esnext.math.degrees"
],
	"core-js/modules/esnext.math.fscale": [
	"esnext.math.fscale"
],
	"core-js/modules/esnext.math.iaddh": [
	"esnext.math.iaddh"
],
	"core-js/modules/esnext.math.imulh": [
	"esnext.math.imulh"
],
	"core-js/modules/esnext.math.isubh": [
	"esnext.math.isubh"
],
	"core-js/modules/esnext.math.rad-per-deg": [
	"esnext.math.rad-per-deg"
],
	"core-js/modules/esnext.math.radians": [
	"esnext.math.radians"
],
	"core-js/modules/esnext.math.scale": [
	"esnext.math.scale"
],
	"core-js/modules/esnext.math.seeded-prng": [
	"esnext.math.seeded-prng"
],
	"core-js/modules/esnext.math.signbit": [
	"esnext.math.signbit"
],
	"core-js/modules/esnext.math.umulh": [
	"esnext.math.umulh"
],
	"core-js/modules/esnext.number.from-string": [
	"esnext.number.from-string"
],
	"core-js/modules/esnext.object.iterate-entries": [
	"esnext.object.iterate-entries"
],
	"core-js/modules/esnext.object.iterate-keys": [
	"esnext.object.iterate-keys"
],
	"core-js/modules/esnext.object.iterate-values": [
	"esnext.object.iterate-values"
],
	"core-js/modules/esnext.observable": [
	"esnext.observable"
],
	"core-js/modules/esnext.promise.all-settled": [
	"esnext.promise.all-settled"
],
	"core-js/modules/esnext.promise.any": [
	"esnext.promise.any"
],
	"core-js/modules/esnext.promise.try": [
	"esnext.promise.try"
],
	"core-js/modules/esnext.reflect.define-metadata": [
	"esnext.reflect.define-metadata"
],
	"core-js/modules/esnext.reflect.delete-metadata": [
	"esnext.reflect.delete-metadata"
],
	"core-js/modules/esnext.reflect.get-metadata": [
	"esnext.reflect.get-metadata"
],
	"core-js/modules/esnext.reflect.get-metadata-keys": [
	"esnext.reflect.get-metadata-keys"
],
	"core-js/modules/esnext.reflect.get-own-metadata": [
	"esnext.reflect.get-own-metadata"
],
	"core-js/modules/esnext.reflect.get-own-metadata-keys": [
	"esnext.reflect.get-own-metadata-keys"
],
	"core-js/modules/esnext.reflect.has-metadata": [
	"esnext.reflect.has-metadata"
],
	"core-js/modules/esnext.reflect.has-own-metadata": [
	"esnext.reflect.has-own-metadata"
],
	"core-js/modules/esnext.reflect.metadata": [
	"esnext.reflect.metadata"
],
	"core-js/modules/esnext.set.add-all": [
	"esnext.set.add-all"
],
	"core-js/modules/esnext.set.delete-all": [
	"esnext.set.delete-all"
],
	"core-js/modules/esnext.set.difference": [
	"esnext.set.difference"
],
	"core-js/modules/esnext.set.every": [
	"esnext.set.every"
],
	"core-js/modules/esnext.set.filter": [
	"esnext.set.filter"
],
	"core-js/modules/esnext.set.find": [
	"esnext.set.find"
],
	"core-js/modules/esnext.set.from": [
	"esnext.set.from"
],
	"core-js/modules/esnext.set.intersection": [
	"esnext.set.intersection"
],
	"core-js/modules/esnext.set.is-disjoint-from": [
	"esnext.set.is-disjoint-from"
],
	"core-js/modules/esnext.set.is-subset-of": [
	"esnext.set.is-subset-of"
],
	"core-js/modules/esnext.set.is-superset-of": [
	"esnext.set.is-superset-of"
],
	"core-js/modules/esnext.set.join": [
	"esnext.set.join"
],
	"core-js/modules/esnext.set.map": [
	"esnext.set.map"
],
	"core-js/modules/esnext.set.of": [
	"esnext.set.of"
],
	"core-js/modules/esnext.set.reduce": [
	"esnext.set.reduce"
],
	"core-js/modules/esnext.set.some": [
	"esnext.set.some"
],
	"core-js/modules/esnext.set.symmetric-difference": [
	"esnext.set.symmetric-difference"
],
	"core-js/modules/esnext.set.union": [
	"esnext.set.union"
],
	"core-js/modules/esnext.string.at": [
	"esnext.string.at"
],
	"core-js/modules/esnext.string.code-points": [
	"esnext.string.code-points"
],
	"core-js/modules/esnext.string.match-all": [
	"esnext.string.match-all"
],
	"core-js/modules/esnext.string.replace-all": [
	"esnext.string.replace-all"
],
	"core-js/modules/esnext.symbol.async-dispose": [
	"esnext.symbol.async-dispose"
],
	"core-js/modules/esnext.symbol.dispose": [
	"esnext.symbol.dispose"
],
	"core-js/modules/esnext.symbol.observable": [
	"esnext.symbol.observable"
],
	"core-js/modules/esnext.symbol.pattern-match": [
	"esnext.symbol.pattern-match"
],
	"core-js/modules/esnext.symbol.replace-all": [
	"esnext.symbol.replace-all"
],
	"core-js/modules/esnext.weak-map.delete-all": [
	"esnext.weak-map.delete-all"
],
	"core-js/modules/esnext.weak-map.from": [
	"esnext.weak-map.from"
],
	"core-js/modules/esnext.weak-map.of": [
	"esnext.weak-map.of"
],
	"core-js/modules/esnext.weak-map.upsert": [
	"esnext.weak-map.upsert"
],
	"core-js/modules/esnext.weak-set.add-all": [
	"esnext.weak-set.add-all"
],
	"core-js/modules/esnext.weak-set.delete-all": [
	"esnext.weak-set.delete-all"
],
	"core-js/modules/esnext.weak-set.from": [
	"esnext.weak-set.from"
],
	"core-js/modules/esnext.weak-set.of": [
	"esnext.weak-set.of"
],
	"core-js/modules/web.dom-collections.for-each": [
	"web.dom-collections.for-each"
],
	"core-js/modules/web.dom-collections.iterator": [
	"web.dom-collections.iterator"
],
	"core-js/modules/web.immediate": [
	"web.immediate"
],
	"core-js/modules/web.queue-microtask": [
	"web.queue-microtask"
],
	"core-js/modules/web.timers": [
	"web.timers"
],
	"core-js/modules/web.url": [
	"web.url"
],
	"core-js/modules/web.url-search-params": [
	"web.url-search-params"
],
	"core-js/modules/web.url.to-json": [
	"web.url.to-json"
],
	"core-js/proposals": [
	"esnext.aggregate-error",
	"esnext.array.is-template-object",
	"esnext.array.last-index",
	"esnext.array.last-item",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.composite-key",
	"esnext.composite-symbol",
	"esnext.global-this",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.math.umulh",
	"esnext.number.from-string",
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values",
	"esnext.observable",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"esnext.reflect.define-metadata",
	"esnext.reflect.delete-metadata",
	"esnext.reflect.get-metadata",
	"esnext.reflect.get-metadata-keys",
	"esnext.reflect.get-own-metadata",
	"esnext.reflect.get-own-metadata-keys",
	"esnext.reflect.has-metadata",
	"esnext.reflect.has-own-metadata",
	"esnext.reflect.metadata",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.symbol.replace-all",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-map.upsert",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/proposals/array-is-template-object": [
	"esnext.array.is-template-object"
],
	"core-js/proposals/array-last": [
	"esnext.array.last-index",
	"esnext.array.last-item"
],
	"core-js/proposals/collection-methods": [
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.weak-map.delete-all",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all"
],
	"core-js/proposals/collection-of-from": [
	"esnext.map.from",
	"esnext.map.of",
	"esnext.set.from",
	"esnext.set.of",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-set.from",
	"esnext.weak-set.of"
],
	"core-js/proposals/efficient-64-bit-arithmetic": [
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.umulh"
],
	"core-js/proposals/global-this": [
	"esnext.global-this"
],
	"core-js/proposals/iterator-helpers": [
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array"
],
	"core-js/proposals/keys-composition": [
	"esnext.composite-key",
	"esnext.composite-symbol"
],
	"core-js/proposals/map-update-or-insert": [
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.weak-map.upsert"
],
	"core-js/proposals/map-upsert": [
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.weak-map.upsert"
],
	"core-js/proposals/math-extensions": [
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale"
],
	"core-js/proposals/math-signbit": [
	"esnext.math.signbit"
],
	"core-js/proposals/number-from-string": [
	"esnext.number.from-string"
],
	"core-js/proposals/object-iteration": [
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values"
],
	"core-js/proposals/observable": [
	"esnext.observable",
	"esnext.symbol.observable"
],
	"core-js/proposals/pattern-matching": [
	"esnext.symbol.pattern-match"
],
	"core-js/proposals/promise-all-settled": [
	"esnext.promise.all-settled"
],
	"core-js/proposals/promise-any": [
	"esnext.aggregate-error",
	"esnext.promise.any"
],
	"core-js/proposals/promise-try": [
	"esnext.promise.try"
],
	"core-js/proposals/reflect-metadata": [
	"esnext.reflect.define-metadata",
	"esnext.reflect.delete-metadata",
	"esnext.reflect.get-metadata",
	"esnext.reflect.get-metadata-keys",
	"esnext.reflect.get-own-metadata",
	"esnext.reflect.get-own-metadata-keys",
	"esnext.reflect.has-metadata",
	"esnext.reflect.has-own-metadata",
	"esnext.reflect.metadata"
],
	"core-js/proposals/seeded-random": [
	"esnext.math.seeded-prng"
],
	"core-js/proposals/set-methods": [
	"esnext.set.difference",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.symmetric-difference",
	"esnext.set.union"
],
	"core-js/proposals/string-at": [
	"esnext.string.at"
],
	"core-js/proposals/string-code-points": [
	"esnext.string.code-points"
],
	"core-js/proposals/string-match-all": [
	"esnext.string.match-all"
],
	"core-js/proposals/string-replace-all": [
	"esnext.string.replace-all",
	"esnext.symbol.replace-all"
],
	"core-js/proposals/url": [
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/proposals/using-statement": [
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose"
],
	"core-js/stable": [
	"es.symbol",
	"es.symbol.description",
	"es.symbol.async-iterator",
	"es.symbol.has-instance",
	"es.symbol.is-concat-spreadable",
	"es.symbol.iterator",
	"es.symbol.match",
	"es.symbol.match-all",
	"es.symbol.replace",
	"es.symbol.search",
	"es.symbol.species",
	"es.symbol.split",
	"es.symbol.to-primitive",
	"es.symbol.to-string-tag",
	"es.symbol.unscopables",
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.from",
	"es.array.includes",
	"es.array.index-of",
	"es.array.is-array",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.of",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map",
	"es.array-buffer.constructor",
	"es.array-buffer.is-view",
	"es.array-buffer.slice",
	"es.data-view",
	"es.date.now",
	"es.date.to-iso-string",
	"es.date.to-json",
	"es.date.to-primitive",
	"es.date.to-string",
	"es.function.bind",
	"es.function.has-instance",
	"es.function.name",
	"es.global-this",
	"es.json.stringify",
	"es.json.to-string-tag",
	"es.map",
	"es.math.acosh",
	"es.math.asinh",
	"es.math.atanh",
	"es.math.cbrt",
	"es.math.clz32",
	"es.math.cosh",
	"es.math.expm1",
	"es.math.fround",
	"es.math.hypot",
	"es.math.imul",
	"es.math.log10",
	"es.math.log1p",
	"es.math.log2",
	"es.math.sign",
	"es.math.sinh",
	"es.math.tanh",
	"es.math.to-string-tag",
	"es.math.trunc",
	"es.number.constructor",
	"es.number.epsilon",
	"es.number.is-finite",
	"es.number.is-integer",
	"es.number.is-nan",
	"es.number.is-safe-integer",
	"es.number.max-safe-integer",
	"es.number.min-safe-integer",
	"es.number.parse-float",
	"es.number.parse-int",
	"es.number.to-fixed",
	"es.number.to-precision",
	"es.object.assign",
	"es.object.create",
	"es.object.define-getter",
	"es.object.define-properties",
	"es.object.define-property",
	"es.object.define-setter",
	"es.object.entries",
	"es.object.freeze",
	"es.object.from-entries",
	"es.object.get-own-property-descriptor",
	"es.object.get-own-property-descriptors",
	"es.object.get-own-property-names",
	"es.object.get-prototype-of",
	"es.object.is",
	"es.object.is-extensible",
	"es.object.is-frozen",
	"es.object.is-sealed",
	"es.object.keys",
	"es.object.lookup-getter",
	"es.object.lookup-setter",
	"es.object.prevent-extensions",
	"es.object.seal",
	"es.object.set-prototype-of",
	"es.object.to-string",
	"es.object.values",
	"es.parse-float",
	"es.parse-int",
	"es.promise",
	"es.promise.all-settled",
	"es.promise.finally",
	"es.reflect.apply",
	"es.reflect.construct",
	"es.reflect.define-property",
	"es.reflect.delete-property",
	"es.reflect.get",
	"es.reflect.get-own-property-descriptor",
	"es.reflect.get-prototype-of",
	"es.reflect.has",
	"es.reflect.is-extensible",
	"es.reflect.own-keys",
	"es.reflect.prevent-extensions",
	"es.reflect.set",
	"es.reflect.set-prototype-of",
	"es.regexp.constructor",
	"es.regexp.exec",
	"es.regexp.flags",
	"es.regexp.sticky",
	"es.regexp.test",
	"es.regexp.to-string",
	"es.set",
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.from-code-point",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.raw",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup",
	"es.typed-array.float32-array",
	"es.typed-array.float64-array",
	"es.typed-array.int8-array",
	"es.typed-array.int16-array",
	"es.typed-array.int32-array",
	"es.typed-array.uint8-array",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.uint16-array",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string",
	"es.weak-map",
	"es.weak-set",
	"web.dom-collections.for-each",
	"web.dom-collections.iterator",
	"web.immediate",
	"web.queue-microtask",
	"web.timers",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/stable/array": [
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.from",
	"es.array.includes",
	"es.array.index-of",
	"es.array.is-array",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.of",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map",
	"es.string.iterator"
],
	"core-js/stable/array-buffer": [
	"es.array-buffer.constructor",
	"es.array-buffer.is-view",
	"es.array-buffer.slice",
	"es.object.to-string"
],
	"core-js/stable/array-buffer/constructor": [
	"es.array-buffer.constructor",
	"es.object.to-string"
],
	"core-js/stable/array-buffer/is-view": [
	"es.array-buffer.is-view"
],
	"core-js/stable/array-buffer/slice": [
	"es.array-buffer.slice"
],
	"core-js/stable/array/concat": [
	"es.array.concat"
],
	"core-js/stable/array/copy-within": [
	"es.array.copy-within"
],
	"core-js/stable/array/entries": [
	"es.array.iterator"
],
	"core-js/stable/array/every": [
	"es.array.every"
],
	"core-js/stable/array/fill": [
	"es.array.fill"
],
	"core-js/stable/array/filter": [
	"es.array.filter"
],
	"core-js/stable/array/find": [
	"es.array.find"
],
	"core-js/stable/array/find-index": [
	"es.array.find-index"
],
	"core-js/stable/array/flat": [
	"es.array.flat",
	"es.array.unscopables.flat"
],
	"core-js/stable/array/flat-map": [
	"es.array.flat-map",
	"es.array.unscopables.flat-map"
],
	"core-js/stable/array/for-each": [
	"es.array.for-each"
],
	"core-js/stable/array/from": [
	"es.array.from",
	"es.string.iterator"
],
	"core-js/stable/array/includes": [
	"es.array.includes"
],
	"core-js/stable/array/index-of": [
	"es.array.index-of"
],
	"core-js/stable/array/is-array": [
	"es.array.is-array"
],
	"core-js/stable/array/iterator": [
	"es.array.iterator"
],
	"core-js/stable/array/join": [
	"es.array.join"
],
	"core-js/stable/array/keys": [
	"es.array.iterator"
],
	"core-js/stable/array/last-index-of": [
	"es.array.last-index-of"
],
	"core-js/stable/array/map": [
	"es.array.map"
],
	"core-js/stable/array/of": [
	"es.array.of"
],
	"core-js/stable/array/reduce": [
	"es.array.reduce"
],
	"core-js/stable/array/reduce-right": [
	"es.array.reduce-right"
],
	"core-js/stable/array/reverse": [
	"es.array.reverse"
],
	"core-js/stable/array/slice": [
	"es.array.slice"
],
	"core-js/stable/array/some": [
	"es.array.some"
],
	"core-js/stable/array/sort": [
	"es.array.sort"
],
	"core-js/stable/array/splice": [
	"es.array.splice"
],
	"core-js/stable/array/values": [
	"es.array.iterator"
],
	"core-js/stable/array/virtual": [
	"es.array.concat",
	"es.array.copy-within",
	"es.array.every",
	"es.array.fill",
	"es.array.filter",
	"es.array.find",
	"es.array.find-index",
	"es.array.flat",
	"es.array.flat-map",
	"es.array.for-each",
	"es.array.includes",
	"es.array.index-of",
	"es.array.iterator",
	"es.array.join",
	"es.array.last-index-of",
	"es.array.map",
	"es.array.reduce",
	"es.array.reduce-right",
	"es.array.reverse",
	"es.array.slice",
	"es.array.some",
	"es.array.sort",
	"es.array.species",
	"es.array.splice",
	"es.array.unscopables.flat",
	"es.array.unscopables.flat-map"
],
	"core-js/stable/array/virtual/concat": [
	"es.array.concat"
],
	"core-js/stable/array/virtual/copy-within": [
	"es.array.copy-within"
],
	"core-js/stable/array/virtual/entries": [
	"es.array.iterator"
],
	"core-js/stable/array/virtual/every": [
	"es.array.every"
],
	"core-js/stable/array/virtual/fill": [
	"es.array.fill"
],
	"core-js/stable/array/virtual/filter": [
	"es.array.filter"
],
	"core-js/stable/array/virtual/find": [
	"es.array.find"
],
	"core-js/stable/array/virtual/find-index": [
	"es.array.find-index"
],
	"core-js/stable/array/virtual/flat": [
	"es.array.flat",
	"es.array.unscopables.flat"
],
	"core-js/stable/array/virtual/flat-map": [
	"es.array.flat-map",
	"es.array.unscopables.flat-map"
],
	"core-js/stable/array/virtual/for-each": [
	"es.array.for-each"
],
	"core-js/stable/array/virtual/includes": [
	"es.array.includes"
],
	"core-js/stable/array/virtual/index-of": [
	"es.array.index-of"
],
	"core-js/stable/array/virtual/iterator": [
	"es.array.iterator"
],
	"core-js/stable/array/virtual/join": [
	"es.array.join"
],
	"core-js/stable/array/virtual/keys": [
	"es.array.iterator"
],
	"core-js/stable/array/virtual/last-index-of": [
	"es.array.last-index-of"
],
	"core-js/stable/array/virtual/map": [
	"es.array.map"
],
	"core-js/stable/array/virtual/reduce": [
	"es.array.reduce"
],
	"core-js/stable/array/virtual/reduce-right": [
	"es.array.reduce-right"
],
	"core-js/stable/array/virtual/reverse": [
	"es.array.reverse"
],
	"core-js/stable/array/virtual/slice": [
	"es.array.slice"
],
	"core-js/stable/array/virtual/some": [
	"es.array.some"
],
	"core-js/stable/array/virtual/sort": [
	"es.array.sort"
],
	"core-js/stable/array/virtual/splice": [
	"es.array.splice"
],
	"core-js/stable/array/virtual/values": [
	"es.array.iterator"
],
	"core-js/stable/clear-immediate": [
	"web.immediate"
],
	"core-js/stable/data-view": [
	"es.data-view",
	"es.object.to-string"
],
	"core-js/stable/date": [
	"es.date.now",
	"es.date.to-iso-string",
	"es.date.to-json",
	"es.date.to-primitive",
	"es.date.to-string"
],
	"core-js/stable/date/now": [
	"es.date.now"
],
	"core-js/stable/date/to-iso-string": [
	"es.date.to-iso-string",
	"es.date.to-json"
],
	"core-js/stable/date/to-json": [
	"es.date.to-json"
],
	"core-js/stable/date/to-primitive": [
	"es.date.to-primitive"
],
	"core-js/stable/date/to-string": [
	"es.date.to-string"
],
	"core-js/stable/dom-collections": [
	"es.array.iterator",
	"web.dom-collections.for-each",
	"web.dom-collections.iterator"
],
	"core-js/stable/dom-collections/for-each": [
	"web.dom-collections.for-each"
],
	"core-js/stable/dom-collections/iterator": [
	"web.dom-collections.iterator"
],
	"core-js/stable/function": [
	"es.function.bind",
	"es.function.has-instance",
	"es.function.name"
],
	"core-js/stable/function/bind": [
	"es.function.bind"
],
	"core-js/stable/function/has-instance": [
	"es.function.has-instance"
],
	"core-js/stable/function/name": [
	"es.function.name"
],
	"core-js/stable/function/virtual": [
	"es.function.bind"
],
	"core-js/stable/function/virtual/bind": [
	"es.function.bind"
],
	"core-js/stable/global-this": [
	"es.global-this"
],
	"core-js/stable/instance/bind": [
	"es.function.bind"
],
	"core-js/stable/instance/code-point-at": [
	"es.string.code-point-at"
],
	"core-js/stable/instance/concat": [
	"es.array.concat"
],
	"core-js/stable/instance/copy-within": [
	"es.array.copy-within"
],
	"core-js/stable/instance/ends-with": [
	"es.string.ends-with"
],
	"core-js/stable/instance/entries": [
	"es.array.iterator",
	"web.dom-collections.iterator"
],
	"core-js/stable/instance/every": [
	"es.array.every"
],
	"core-js/stable/instance/fill": [
	"es.array.fill"
],
	"core-js/stable/instance/filter": [
	"es.array.filter"
],
	"core-js/stable/instance/find": [
	"es.array.find"
],
	"core-js/stable/instance/find-index": [
	"es.array.find-index"
],
	"core-js/stable/instance/flags": [
	"es.regexp.flags"
],
	"core-js/stable/instance/flat": [
	"es.array.flat",
	"es.array.unscopables.flat"
],
	"core-js/stable/instance/flat-map": [
	"es.array.flat-map",
	"es.array.unscopables.flat-map"
],
	"core-js/stable/instance/for-each": [
	"es.array.for-each",
	"web.dom-collections.iterator"
],
	"core-js/stable/instance/includes": [
	"es.array.includes",
	"es.string.includes"
],
	"core-js/stable/instance/index-of": [
	"es.array.index-of"
],
	"core-js/stable/instance/keys": [
	"es.array.iterator",
	"web.dom-collections.iterator"
],
	"core-js/stable/instance/last-index-of": [
	"es.array.last-index-of"
],
	"core-js/stable/instance/map": [
	"es.array.map"
],
	"core-js/stable/instance/match-all": [
	"es.string.match-all"
],
	"core-js/stable/instance/pad-end": [
	"es.string.pad-end"
],
	"core-js/stable/instance/pad-start": [
	"es.string.pad-start"
],
	"core-js/stable/instance/reduce": [
	"es.array.reduce"
],
	"core-js/stable/instance/reduce-right": [
	"es.array.reduce-right"
],
	"core-js/stable/instance/repeat": [
	"es.string.repeat"
],
	"core-js/stable/instance/reverse": [
	"es.array.reverse"
],
	"core-js/stable/instance/slice": [
	"es.array.slice"
],
	"core-js/stable/instance/some": [
	"es.array.some"
],
	"core-js/stable/instance/sort": [
	"es.array.sort"
],
	"core-js/stable/instance/splice": [
	"es.array.splice"
],
	"core-js/stable/instance/starts-with": [
	"es.string.starts-with"
],
	"core-js/stable/instance/trim": [
	"es.string.trim"
],
	"core-js/stable/instance/trim-end": [
	"es.string.trim-end"
],
	"core-js/stable/instance/trim-left": [
	"es.string.trim-start"
],
	"core-js/stable/instance/trim-right": [
	"es.string.trim-end"
],
	"core-js/stable/instance/trim-start": [
	"es.string.trim-start"
],
	"core-js/stable/instance/values": [
	"es.array.iterator",
	"web.dom-collections.iterator"
],
	"core-js/stable/json": [
	"es.json.stringify",
	"es.json.to-string-tag"
],
	"core-js/stable/json/stringify": [
	"es.json.stringify"
],
	"core-js/stable/json/to-string-tag": [
	"es.json.to-string-tag"
],
	"core-js/stable/map": [
	"es.map",
	"es.object.to-string",
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/stable/math": [
	"es.math.acosh",
	"es.math.asinh",
	"es.math.atanh",
	"es.math.cbrt",
	"es.math.clz32",
	"es.math.cosh",
	"es.math.expm1",
	"es.math.fround",
	"es.math.hypot",
	"es.math.imul",
	"es.math.log10",
	"es.math.log1p",
	"es.math.log2",
	"es.math.sign",
	"es.math.sinh",
	"es.math.tanh",
	"es.math.to-string-tag",
	"es.math.trunc"
],
	"core-js/stable/math/acosh": [
	"es.math.acosh"
],
	"core-js/stable/math/asinh": [
	"es.math.asinh"
],
	"core-js/stable/math/atanh": [
	"es.math.atanh"
],
	"core-js/stable/math/cbrt": [
	"es.math.cbrt"
],
	"core-js/stable/math/clz32": [
	"es.math.clz32"
],
	"core-js/stable/math/cosh": [
	"es.math.cosh"
],
	"core-js/stable/math/expm1": [
	"es.math.expm1"
],
	"core-js/stable/math/fround": [
	"es.math.fround"
],
	"core-js/stable/math/hypot": [
	"es.math.hypot"
],
	"core-js/stable/math/imul": [
	"es.math.imul"
],
	"core-js/stable/math/log10": [
	"es.math.log10"
],
	"core-js/stable/math/log1p": [
	"es.math.log1p"
],
	"core-js/stable/math/log2": [
	"es.math.log2"
],
	"core-js/stable/math/sign": [
	"es.math.sign"
],
	"core-js/stable/math/sinh": [
	"es.math.sinh"
],
	"core-js/stable/math/tanh": [
	"es.math.tanh"
],
	"core-js/stable/math/to-string-tag": [
	"es.math.to-string-tag"
],
	"core-js/stable/math/trunc": [
	"es.math.trunc"
],
	"core-js/stable/number": [
	"es.number.constructor",
	"es.number.epsilon",
	"es.number.is-finite",
	"es.number.is-integer",
	"es.number.is-nan",
	"es.number.is-safe-integer",
	"es.number.max-safe-integer",
	"es.number.min-safe-integer",
	"es.number.parse-float",
	"es.number.parse-int",
	"es.number.to-fixed",
	"es.number.to-precision"
],
	"core-js/stable/number/constructor": [
	"es.number.constructor"
],
	"core-js/stable/number/epsilon": [
	"es.number.epsilon"
],
	"core-js/stable/number/is-finite": [
	"es.number.is-finite"
],
	"core-js/stable/number/is-integer": [
	"es.number.is-integer"
],
	"core-js/stable/number/is-nan": [
	"es.number.is-nan"
],
	"core-js/stable/number/is-safe-integer": [
	"es.number.is-safe-integer"
],
	"core-js/stable/number/max-safe-integer": [
	"es.number.max-safe-integer"
],
	"core-js/stable/number/min-safe-integer": [
	"es.number.min-safe-integer"
],
	"core-js/stable/number/parse-float": [
	"es.number.parse-float"
],
	"core-js/stable/number/parse-int": [
	"es.number.parse-int"
],
	"core-js/stable/number/to-fixed": [
	"es.number.to-fixed"
],
	"core-js/stable/number/to-precision": [
	"es.number.to-precision"
],
	"core-js/stable/number/virtual": [
	"es.number.to-fixed",
	"es.number.to-precision"
],
	"core-js/stable/number/virtual/to-fixed": [
	"es.number.to-fixed"
],
	"core-js/stable/number/virtual/to-precision": [
	"es.number.to-precision"
],
	"core-js/stable/object": [
	"es.symbol",
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.assign",
	"es.object.create",
	"es.object.define-getter",
	"es.object.define-properties",
	"es.object.define-property",
	"es.object.define-setter",
	"es.object.entries",
	"es.object.freeze",
	"es.object.from-entries",
	"es.object.get-own-property-descriptor",
	"es.object.get-own-property-descriptors",
	"es.object.get-own-property-names",
	"es.object.get-prototype-of",
	"es.object.is",
	"es.object.is-extensible",
	"es.object.is-frozen",
	"es.object.is-sealed",
	"es.object.keys",
	"es.object.lookup-getter",
	"es.object.lookup-setter",
	"es.object.prevent-extensions",
	"es.object.seal",
	"es.object.set-prototype-of",
	"es.object.to-string",
	"es.object.values"
],
	"core-js/stable/object/assign": [
	"es.object.assign"
],
	"core-js/stable/object/create": [
	"es.object.create"
],
	"core-js/stable/object/define-getter": [
	"es.object.define-getter"
],
	"core-js/stable/object/define-properties": [
	"es.object.define-properties"
],
	"core-js/stable/object/define-property": [
	"es.object.define-property"
],
	"core-js/stable/object/define-setter": [
	"es.object.define-setter"
],
	"core-js/stable/object/entries": [
	"es.object.entries"
],
	"core-js/stable/object/freeze": [
	"es.object.freeze"
],
	"core-js/stable/object/from-entries": [
	"es.array.iterator",
	"es.object.from-entries"
],
	"core-js/stable/object/get-own-property-descriptor": [
	"es.object.get-own-property-descriptor"
],
	"core-js/stable/object/get-own-property-descriptors": [
	"es.object.get-own-property-descriptors"
],
	"core-js/stable/object/get-own-property-names": [
	"es.object.get-own-property-names"
],
	"core-js/stable/object/get-own-property-symbols": [
	"es.symbol"
],
	"core-js/stable/object/get-prototype-of": [
	"es.object.get-prototype-of"
],
	"core-js/stable/object/is": [
	"es.object.is"
],
	"core-js/stable/object/is-extensible": [
	"es.object.is-extensible"
],
	"core-js/stable/object/is-frozen": [
	"es.object.is-frozen"
],
	"core-js/stable/object/is-sealed": [
	"es.object.is-sealed"
],
	"core-js/stable/object/keys": [
	"es.object.keys"
],
	"core-js/stable/object/lookup-getter": [
	"es.object.lookup-setter"
],
	"core-js/stable/object/lookup-setter": [
	"es.object.lookup-setter"
],
	"core-js/stable/object/prevent-extensions": [
	"es.object.prevent-extensions"
],
	"core-js/stable/object/seal": [
	"es.object.seal"
],
	"core-js/stable/object/set-prototype-of": [
	"es.object.set-prototype-of"
],
	"core-js/stable/object/to-string": [
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.to-string"
],
	"core-js/stable/object/values": [
	"es.object.values"
],
	"core-js/stable/parse-float": [
	"es.parse-float"
],
	"core-js/stable/parse-int": [
	"es.parse-int"
],
	"core-js/stable/promise": [
	"es.object.to-string",
	"es.promise",
	"es.promise.all-settled",
	"es.promise.finally",
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/stable/promise/all-settled": [
	"es.promise",
	"es.promise.all-settled"
],
	"core-js/stable/promise/finally": [
	"es.promise",
	"es.promise.finally"
],
	"core-js/stable/queue-microtask": [
	"web.queue-microtask"
],
	"core-js/stable/reflect": [
	"es.reflect.apply",
	"es.reflect.construct",
	"es.reflect.define-property",
	"es.reflect.delete-property",
	"es.reflect.get",
	"es.reflect.get-own-property-descriptor",
	"es.reflect.get-prototype-of",
	"es.reflect.has",
	"es.reflect.is-extensible",
	"es.reflect.own-keys",
	"es.reflect.prevent-extensions",
	"es.reflect.set",
	"es.reflect.set-prototype-of"
],
	"core-js/stable/reflect/apply": [
	"es.reflect.apply"
],
	"core-js/stable/reflect/construct": [
	"es.reflect.construct"
],
	"core-js/stable/reflect/define-property": [
	"es.reflect.define-property"
],
	"core-js/stable/reflect/delete-property": [
	"es.reflect.delete-property"
],
	"core-js/stable/reflect/get": [
	"es.reflect.get"
],
	"core-js/stable/reflect/get-own-property-descriptor": [
	"es.reflect.get-own-property-descriptor"
],
	"core-js/stable/reflect/get-prototype-of": [
	"es.reflect.get-prototype-of"
],
	"core-js/stable/reflect/has": [
	"es.reflect.has"
],
	"core-js/stable/reflect/is-extensible": [
	"es.reflect.is-extensible"
],
	"core-js/stable/reflect/own-keys": [
	"es.reflect.own-keys"
],
	"core-js/stable/reflect/prevent-extensions": [
	"es.reflect.prevent-extensions"
],
	"core-js/stable/reflect/set": [
	"es.reflect.set"
],
	"core-js/stable/reflect/set-prototype-of": [
	"es.reflect.set-prototype-of"
],
	"core-js/stable/regexp": [
	"es.regexp.constructor",
	"es.regexp.exec",
	"es.regexp.flags",
	"es.regexp.sticky",
	"es.regexp.test",
	"es.regexp.to-string",
	"es.string.match",
	"es.string.replace",
	"es.string.search",
	"es.string.split"
],
	"core-js/stable/regexp/constructor": [
	"es.regexp.constructor"
],
	"core-js/stable/regexp/flags": [
	"es.regexp.flags"
],
	"core-js/stable/regexp/match": [
	"es.string.match"
],
	"core-js/stable/regexp/replace": [
	"es.string.replace"
],
	"core-js/stable/regexp/search": [
	"es.string.search"
],
	"core-js/stable/regexp/split": [
	"es.string.split"
],
	"core-js/stable/regexp/sticky": [
	"es.regexp.sticky"
],
	"core-js/stable/regexp/test": [
	"es.regexp.exec",
	"es.regexp.test"
],
	"core-js/stable/regexp/to-string": [
	"es.regexp.to-string"
],
	"core-js/stable/set": [
	"es.object.to-string",
	"es.set",
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/stable/set-immediate": [
	"web.immediate"
],
	"core-js/stable/set-interval": [
	"web.timers"
],
	"core-js/stable/set-timeout": [
	"web.timers"
],
	"core-js/stable/string": [
	"es.regexp.exec",
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.from-code-point",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.raw",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup"
],
	"core-js/stable/string/anchor": [
	"es.string.anchor"
],
	"core-js/stable/string/big": [
	"es.string.big"
],
	"core-js/stable/string/blink": [
	"es.string.blink"
],
	"core-js/stable/string/bold": [
	"es.string.bold"
],
	"core-js/stable/string/code-point-at": [
	"es.string.code-point-at"
],
	"core-js/stable/string/ends-with": [
	"es.string.ends-with"
],
	"core-js/stable/string/fixed": [
	"es.string.fixed"
],
	"core-js/stable/string/fontcolor": [
	"es.string.fontcolor"
],
	"core-js/stable/string/fontsize": [
	"es.string.fontsize"
],
	"core-js/stable/string/from-code-point": [
	"es.string.from-code-point"
],
	"core-js/stable/string/includes": [
	"es.string.includes"
],
	"core-js/stable/string/italics": [
	"es.string.italics"
],
	"core-js/stable/string/iterator": [
	"es.string.iterator"
],
	"core-js/stable/string/link": [
	"es.string.link"
],
	"core-js/stable/string/match": [
	"es.regexp.exec",
	"es.string.match"
],
	"core-js/stable/string/match-all": [
	"es.string.match-all"
],
	"core-js/stable/string/pad-end": [
	"es.string.pad-end"
],
	"core-js/stable/string/pad-start": [
	"es.string.pad-start"
],
	"core-js/stable/string/raw": [
	"es.string.raw"
],
	"core-js/stable/string/repeat": [
	"es.string.repeat"
],
	"core-js/stable/string/replace": [
	"es.regexp.exec",
	"es.string.replace"
],
	"core-js/stable/string/search": [
	"es.regexp.exec",
	"es.string.search"
],
	"core-js/stable/string/small": [
	"es.string.small"
],
	"core-js/stable/string/split": [
	"es.regexp.exec",
	"es.string.split"
],
	"core-js/stable/string/starts-with": [
	"es.string.starts-with"
],
	"core-js/stable/string/strike": [
	"es.string.strike"
],
	"core-js/stable/string/sub": [
	"es.string.sub"
],
	"core-js/stable/string/sup": [
	"es.string.sup"
],
	"core-js/stable/string/trim": [
	"es.string.trim"
],
	"core-js/stable/string/trim-end": [
	"es.string.trim-end"
],
	"core-js/stable/string/trim-left": [
	"es.string.trim-start"
],
	"core-js/stable/string/trim-right": [
	"es.string.trim-end"
],
	"core-js/stable/string/trim-start": [
	"es.string.trim-start"
],
	"core-js/stable/string/virtual": [
	"es.string.code-point-at",
	"es.string.ends-with",
	"es.string.includes",
	"es.string.iterator",
	"es.string.match",
	"es.string.match-all",
	"es.string.pad-end",
	"es.string.pad-start",
	"es.string.repeat",
	"es.string.replace",
	"es.string.search",
	"es.string.split",
	"es.string.starts-with",
	"es.string.trim",
	"es.string.trim-end",
	"es.string.trim-start",
	"es.string.anchor",
	"es.string.big",
	"es.string.blink",
	"es.string.bold",
	"es.string.fixed",
	"es.string.fontcolor",
	"es.string.fontsize",
	"es.string.italics",
	"es.string.link",
	"es.string.small",
	"es.string.strike",
	"es.string.sub",
	"es.string.sup"
],
	"core-js/stable/string/virtual/anchor": [
	"es.string.anchor"
],
	"core-js/stable/string/virtual/big": [
	"es.string.big"
],
	"core-js/stable/string/virtual/blink": [
	"es.string.blink"
],
	"core-js/stable/string/virtual/bold": [
	"es.string.bold"
],
	"core-js/stable/string/virtual/code-point-at": [
	"es.string.code-point-at"
],
	"core-js/stable/string/virtual/ends-with": [
	"es.string.ends-with"
],
	"core-js/stable/string/virtual/fixed": [
	"es.string.fixed"
],
	"core-js/stable/string/virtual/fontcolor": [
	"es.string.fontcolor"
],
	"core-js/stable/string/virtual/fontsize": [
	"es.string.fontsize"
],
	"core-js/stable/string/virtual/includes": [
	"es.string.includes"
],
	"core-js/stable/string/virtual/italics": [
	"es.string.italics"
],
	"core-js/stable/string/virtual/iterator": [
	"es.string.iterator"
],
	"core-js/stable/string/virtual/link": [
	"es.string.link"
],
	"core-js/stable/string/virtual/match-all": [
	"es.string.match-all"
],
	"core-js/stable/string/virtual/pad-end": [
	"es.string.pad-end"
],
	"core-js/stable/string/virtual/pad-start": [
	"es.string.pad-start"
],
	"core-js/stable/string/virtual/repeat": [
	"es.string.repeat"
],
	"core-js/stable/string/virtual/small": [
	"es.string.small"
],
	"core-js/stable/string/virtual/starts-with": [
	"es.string.starts-with"
],
	"core-js/stable/string/virtual/strike": [
	"es.string.strike"
],
	"core-js/stable/string/virtual/sub": [
	"es.string.sub"
],
	"core-js/stable/string/virtual/sup": [
	"es.string.sup"
],
	"core-js/stable/string/virtual/trim": [
	"es.string.trim"
],
	"core-js/stable/string/virtual/trim-end": [
	"es.string.trim-end"
],
	"core-js/stable/string/virtual/trim-left": [
	"es.string.trim-start"
],
	"core-js/stable/string/virtual/trim-right": [
	"es.string.trim-end"
],
	"core-js/stable/string/virtual/trim-start": [
	"es.string.trim-start"
],
	"core-js/stable/symbol": [
	"es.symbol",
	"es.symbol.description",
	"es.symbol.async-iterator",
	"es.symbol.has-instance",
	"es.symbol.is-concat-spreadable",
	"es.symbol.iterator",
	"es.symbol.match",
	"es.symbol.match-all",
	"es.symbol.replace",
	"es.symbol.search",
	"es.symbol.species",
	"es.symbol.split",
	"es.symbol.to-primitive",
	"es.symbol.to-string-tag",
	"es.symbol.unscopables",
	"es.array.concat",
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.to-string"
],
	"core-js/stable/symbol/async-iterator": [
	"es.symbol.async-iterator"
],
	"core-js/stable/symbol/description": [
	"es.symbol.description"
],
	"core-js/stable/symbol/for": [
	"es.symbol"
],
	"core-js/stable/symbol/has-instance": [
	"es.symbol.has-instance",
	"es.function.has-instance"
],
	"core-js/stable/symbol/is-concat-spreadable": [
	"es.symbol.is-concat-spreadable",
	"es.array.concat"
],
	"core-js/stable/symbol/iterator": [
	"es.symbol.iterator",
	"es.string.iterator",
	"web.dom-collections.iterator"
],
	"core-js/stable/symbol/key-for": [
	"es.symbol"
],
	"core-js/stable/symbol/match": [
	"es.symbol.match",
	"es.string.match"
],
	"core-js/stable/symbol/match-all": [
	"es.symbol.match-all",
	"es.string.match-all"
],
	"core-js/stable/symbol/replace": [
	"es.symbol.replace",
	"es.string.replace"
],
	"core-js/stable/symbol/search": [
	"es.symbol.search",
	"es.string.search"
],
	"core-js/stable/symbol/species": [
	"es.symbol.species"
],
	"core-js/stable/symbol/split": [
	"es.symbol.split",
	"es.string.split"
],
	"core-js/stable/symbol/to-primitive": [
	"es.symbol.to-primitive"
],
	"core-js/stable/symbol/to-string-tag": [
	"es.symbol.to-string-tag",
	"es.json.to-string-tag",
	"es.math.to-string-tag",
	"es.object.to-string"
],
	"core-js/stable/symbol/unscopables": [
	"es.symbol.unscopables"
],
	"core-js/stable/typed-array": [
	"es.object.to-string",
	"es.typed-array.float32-array",
	"es.typed-array.float64-array",
	"es.typed-array.int8-array",
	"es.typed-array.int16-array",
	"es.typed-array.int32-array",
	"es.typed-array.uint8-array",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.uint16-array",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/copy-within": [
	"es.typed-array.copy-within"
],
	"core-js/stable/typed-array/entries": [
	"es.typed-array.iterator"
],
	"core-js/stable/typed-array/every": [
	"es.typed-array.every"
],
	"core-js/stable/typed-array/fill": [
	"es.typed-array.fill"
],
	"core-js/stable/typed-array/filter": [
	"es.typed-array.filter"
],
	"core-js/stable/typed-array/find": [
	"es.typed-array.find"
],
	"core-js/stable/typed-array/find-index": [
	"es.typed-array.find-index"
],
	"core-js/stable/typed-array/float32-array": [
	"es.object.to-string",
	"es.typed-array.float32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/float64-array": [
	"es.object.to-string",
	"es.typed-array.float64-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/for-each": [
	"es.typed-array.for-each"
],
	"core-js/stable/typed-array/from": [
	"es.typed-array.from"
],
	"core-js/stable/typed-array/includes": [
	"es.typed-array.includes"
],
	"core-js/stable/typed-array/index-of": [
	"es.typed-array.index-of"
],
	"core-js/stable/typed-array/int16-array": [
	"es.object.to-string",
	"es.typed-array.int16-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/int32-array": [
	"es.object.to-string",
	"es.typed-array.int32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/int8-array": [
	"es.object.to-string",
	"es.typed-array.int8-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/iterator": [
	"es.typed-array.iterator"
],
	"core-js/stable/typed-array/join": [
	"es.typed-array.join"
],
	"core-js/stable/typed-array/keys": [
	"es.typed-array.iterator"
],
	"core-js/stable/typed-array/last-index-of": [
	"es.typed-array.last-index-of"
],
	"core-js/stable/typed-array/map": [
	"es.typed-array.map"
],
	"core-js/stable/typed-array/of": [
	"es.typed-array.of"
],
	"core-js/stable/typed-array/reduce": [
	"es.typed-array.reduce"
],
	"core-js/stable/typed-array/reduce-right": [
	"es.typed-array.reduce-right"
],
	"core-js/stable/typed-array/reverse": [
	"es.typed-array.reverse"
],
	"core-js/stable/typed-array/set": [
	"es.typed-array.set"
],
	"core-js/stable/typed-array/slice": [
	"es.typed-array.slice"
],
	"core-js/stable/typed-array/some": [
	"es.typed-array.some"
],
	"core-js/stable/typed-array/sort": [
	"es.typed-array.sort"
],
	"core-js/stable/typed-array/subarray": [
	"es.typed-array.subarray"
],
	"core-js/stable/typed-array/to-locale-string": [
	"es.typed-array.to-locale-string"
],
	"core-js/stable/typed-array/to-string": [
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/uint16-array": [
	"es.object.to-string",
	"es.typed-array.uint16-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/uint32-array": [
	"es.object.to-string",
	"es.typed-array.uint32-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/uint8-array": [
	"es.object.to-string",
	"es.typed-array.uint8-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/uint8-clamped-array": [
	"es.object.to-string",
	"es.typed-array.uint8-clamped-array",
	"es.typed-array.copy-within",
	"es.typed-array.every",
	"es.typed-array.fill",
	"es.typed-array.filter",
	"es.typed-array.find",
	"es.typed-array.find-index",
	"es.typed-array.for-each",
	"es.typed-array.from",
	"es.typed-array.includes",
	"es.typed-array.index-of",
	"es.typed-array.iterator",
	"es.typed-array.join",
	"es.typed-array.last-index-of",
	"es.typed-array.map",
	"es.typed-array.of",
	"es.typed-array.reduce",
	"es.typed-array.reduce-right",
	"es.typed-array.reverse",
	"es.typed-array.set",
	"es.typed-array.slice",
	"es.typed-array.some",
	"es.typed-array.sort",
	"es.typed-array.subarray",
	"es.typed-array.to-locale-string",
	"es.typed-array.to-string"
],
	"core-js/stable/typed-array/values": [
	"es.typed-array.iterator"
],
	"core-js/stable/url": [
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/stable/url-search-params": [
	"web.url-search-params"
],
	"core-js/stable/url/to-json": [
	"web.url.to-json"
],
	"core-js/stable/weak-map": [
	"es.object.to-string",
	"es.weak-map",
	"web.dom-collections.iterator"
],
	"core-js/stable/weak-set": [
	"es.object.to-string",
	"es.weak-set",
	"web.dom-collections.iterator"
],
	"core-js/stage": [
	"esnext.aggregate-error",
	"esnext.array.is-template-object",
	"esnext.array.last-index",
	"esnext.array.last-item",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.composite-key",
	"esnext.composite-symbol",
	"esnext.global-this",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.math.umulh",
	"esnext.number.from-string",
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values",
	"esnext.observable",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"esnext.reflect.define-metadata",
	"esnext.reflect.delete-metadata",
	"esnext.reflect.get-metadata",
	"esnext.reflect.get-metadata-keys",
	"esnext.reflect.get-own-metadata",
	"esnext.reflect.get-own-metadata-keys",
	"esnext.reflect.has-metadata",
	"esnext.reflect.has-own-metadata",
	"esnext.reflect.metadata",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.symbol.replace-all",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-map.upsert",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/stage/0": [
	"esnext.aggregate-error",
	"esnext.array.is-template-object",
	"esnext.array.last-index",
	"esnext.array.last-item",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.composite-key",
	"esnext.composite-symbol",
	"esnext.global-this",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.math.umulh",
	"esnext.number.from-string",
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values",
	"esnext.observable",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.symbol.replace-all",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-map.upsert",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/stage/1": [
	"esnext.aggregate-error",
	"esnext.array.is-template-object",
	"esnext.array.last-index",
	"esnext.array.last-item",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.composite-key",
	"esnext.composite-symbol",
	"esnext.global-this",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.number.from-string",
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values",
	"esnext.observable",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.symbol.replace-all",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-map.upsert",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of"
],
	"core-js/stage/2": [
	"esnext.aggregate-error",
	"esnext.array.is-template-object",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.global-this",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.set.difference",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.replace-all",
	"esnext.weak-map.upsert"
],
	"core-js/stage/3": [
	"esnext.aggregate-error",
	"esnext.global-this",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.replace-all"
],
	"core-js/stage/4": [
	"esnext.global-this",
	"esnext.promise.all-settled",
	"esnext.string.match-all"
],
	"core-js/stage/pre": [
	"esnext.aggregate-error",
	"esnext.array.is-template-object",
	"esnext.array.last-index",
	"esnext.array.last-item",
	"esnext.async-iterator.constructor",
	"esnext.async-iterator.as-indexed-pairs",
	"esnext.async-iterator.drop",
	"esnext.async-iterator.every",
	"esnext.async-iterator.filter",
	"esnext.async-iterator.find",
	"esnext.async-iterator.flat-map",
	"esnext.async-iterator.for-each",
	"esnext.async-iterator.from",
	"esnext.async-iterator.map",
	"esnext.async-iterator.reduce",
	"esnext.async-iterator.some",
	"esnext.async-iterator.take",
	"esnext.async-iterator.to-array",
	"esnext.composite-key",
	"esnext.composite-symbol",
	"esnext.global-this",
	"esnext.iterator.constructor",
	"esnext.iterator.as-indexed-pairs",
	"esnext.iterator.drop",
	"esnext.iterator.every",
	"esnext.iterator.filter",
	"esnext.iterator.find",
	"esnext.iterator.flat-map",
	"esnext.iterator.for-each",
	"esnext.iterator.from",
	"esnext.iterator.map",
	"esnext.iterator.reduce",
	"esnext.iterator.some",
	"esnext.iterator.take",
	"esnext.iterator.to-array",
	"esnext.map.delete-all",
	"esnext.map.every",
	"esnext.map.filter",
	"esnext.map.find",
	"esnext.map.find-key",
	"esnext.map.from",
	"esnext.map.group-by",
	"esnext.map.includes",
	"esnext.map.key-by",
	"esnext.map.key-of",
	"esnext.map.map-keys",
	"esnext.map.map-values",
	"esnext.map.merge",
	"esnext.map.of",
	"esnext.map.reduce",
	"esnext.map.some",
	"esnext.map.update",
	"esnext.map.update-or-insert",
	"esnext.map.upsert",
	"esnext.math.clamp",
	"esnext.math.deg-per-rad",
	"esnext.math.degrees",
	"esnext.math.fscale",
	"esnext.math.iaddh",
	"esnext.math.imulh",
	"esnext.math.isubh",
	"esnext.math.rad-per-deg",
	"esnext.math.radians",
	"esnext.math.scale",
	"esnext.math.seeded-prng",
	"esnext.math.signbit",
	"esnext.math.umulh",
	"esnext.number.from-string",
	"esnext.object.iterate-entries",
	"esnext.object.iterate-keys",
	"esnext.object.iterate-values",
	"esnext.observable",
	"esnext.promise.all-settled",
	"esnext.promise.any",
	"esnext.promise.try",
	"esnext.reflect.define-metadata",
	"esnext.reflect.delete-metadata",
	"esnext.reflect.get-metadata",
	"esnext.reflect.get-metadata-keys",
	"esnext.reflect.get-own-metadata",
	"esnext.reflect.get-own-metadata-keys",
	"esnext.reflect.has-metadata",
	"esnext.reflect.has-own-metadata",
	"esnext.reflect.metadata",
	"esnext.set.add-all",
	"esnext.set.delete-all",
	"esnext.set.difference",
	"esnext.set.every",
	"esnext.set.filter",
	"esnext.set.find",
	"esnext.set.from",
	"esnext.set.intersection",
	"esnext.set.is-disjoint-from",
	"esnext.set.is-subset-of",
	"esnext.set.is-superset-of",
	"esnext.set.join",
	"esnext.set.map",
	"esnext.set.of",
	"esnext.set.reduce",
	"esnext.set.some",
	"esnext.set.symmetric-difference",
	"esnext.set.union",
	"esnext.string.at",
	"esnext.string.code-points",
	"esnext.string.match-all",
	"esnext.string.replace-all",
	"esnext.symbol.async-dispose",
	"esnext.symbol.dispose",
	"esnext.symbol.observable",
	"esnext.symbol.pattern-match",
	"esnext.symbol.replace-all",
	"esnext.weak-map.delete-all",
	"esnext.weak-map.from",
	"esnext.weak-map.of",
	"esnext.weak-map.upsert",
	"esnext.weak-set.add-all",
	"esnext.weak-set.delete-all",
	"esnext.weak-set.from",
	"esnext.weak-set.of",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/web": [
	"web.dom-collections.for-each",
	"web.dom-collections.iterator",
	"web.immediate",
	"web.queue-microtask",
	"web.timers",
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/web/dom-collections": [
	"web.dom-collections.for-each",
	"web.dom-collections.iterator"
],
	"core-js/web/immediate": [
	"web.immediate"
],
	"core-js/web/queue-microtask": [
	"web.queue-microtask"
],
	"core-js/web/timers": [
	"web.timers"
],
	"core-js/web/url": [
	"web.url",
	"web.url.to-json",
	"web.url-search-params"
],
	"core-js/web/url-search-params": [
	"web.url-search-params"
]
};

var entries$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': entries
});

var entries$2 = getCjsExportFromNamespace(entries$1);

var coreJsCompat = Object.assign(compat, {
  compat,
  data: data$2,
  entries: entries$2,
  getModulesListForTargetVersion,
  modules: modules$2,
});
