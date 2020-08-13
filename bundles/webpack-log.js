import 'crypto';

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

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

var symbols = createCommonjsModule(function (module) {

const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const windows = {
  bullet: '•',
  check: '√',
  cross: '×',
  ellipsis: '...',
  heart: '❤',
  info: 'i',
  line: '─',
  middot: '·',
  minus: '－',
  plus: '＋',
  question: '?',
  questionSmall: '﹖',
  pointer: '>',
  pointerSmall: '»',
  warning: '‼'
};

const other = {
  ballotCross: '✘',
  bullet: '•',
  check: '✔',
  cross: '✖',
  ellipsis: '…',
  heart: '❤',
  info: 'ℹ',
  line: '─',
  middot: '·',
  minus: '－',
  plus: '＋',
  question: '?',
  questionFull: '？',
  questionSmall: '﹖',
  pointer: isLinux ? '▸' : '❯',
  pointerSmall: isLinux ? '‣' : '›',
  warning: '⚠'
};

module.exports = isWindows ? windows : other;
Reflect.defineProperty(module.exports, 'windows', { enumerable: false, value: windows });
Reflect.defineProperty(module.exports, 'other', { enumerable: false, value: other });
});

const colors = { enabled: true, visible: true, styles: {}, keys: {} };

if ('FORCE_COLOR' in process.env) {
  colors.enabled = process.env.FORCE_COLOR !== '0';
}

const ansi = style => {
  style.open = `\u001b[${style.codes[0]}m`;
  style.close = `\u001b[${style.codes[1]}m`;
  style.regex = new RegExp(`\\u001b\\[${style.codes[1]}m`, 'g');
  return style;
};

const wrap = (style, str, nl) => {
  let { open, close, regex } = style;
  str = open + (str.includes(close) ? str.replace(regex, close + open) : str) + close;
  // see https://github.com/chalk/chalk/pull/92, thanks to the
  // chalk contributors for this fix. However, we've confirmed that
  // this issue is also present in Windows terminals
  return nl ? str.replace(/\r?\n/g, `${close}$&${open}`) : str;
};

const style = (input, stack) => {
  if (input === '' || input == null) return '';
  if (colors.enabled === false) return input;
  if (colors.visible === false) return '';
  let str = '' + input;
  let nl = str.includes('\n');
  let n = stack.length;
  while (n-- > 0) str = wrap(colors.styles[stack[n]], str, nl);
  return str;
};

const define = (name, codes, type) => {
  colors.styles[name] = ansi({ name, codes });
  let t = colors.keys[type] || (colors.keys[type] = []);
  t.push(name);

  Reflect.defineProperty(colors, name, {
    get() {
      let color = input => style(input, color.stack);
      Reflect.setPrototypeOf(color, colors);
      color.stack = this.stack ? this.stack.concat(name) : [name];
      return color;
    }
  });
};

define('reset', [0, 0], 'modifier');
define('bold', [1, 22], 'modifier');
define('dim', [2, 22], 'modifier');
define('italic', [3, 23], 'modifier');
define('underline', [4, 24], 'modifier');
define('inverse', [7, 27], 'modifier');
define('hidden', [8, 28], 'modifier');
define('strikethrough', [9, 29], 'modifier');

define('black', [30, 39], 'color');
define('red', [31, 39], 'color');
define('green', [32, 39], 'color');
define('yellow', [33, 39], 'color');
define('blue', [34, 39], 'color');
define('magenta', [35, 39], 'color');
define('cyan', [36, 39], 'color');
define('white', [37, 39], 'color');
define('gray', [90, 39], 'color');
define('grey', [90, 39], 'color');

define('bgBlack', [40, 49], 'bg');
define('bgRed', [41, 49], 'bg');
define('bgGreen', [42, 49], 'bg');
define('bgYellow', [43, 49], 'bg');
define('bgBlue', [44, 49], 'bg');
define('bgMagenta', [45, 49], 'bg');
define('bgCyan', [46, 49], 'bg');
define('bgWhite', [47, 49], 'bg');

define('blackBright', [90, 39], 'bright');
define('redBright', [91, 39], 'bright');
define('greenBright', [92, 39], 'bright');
define('yellowBright', [93, 39], 'bright');
define('blueBright', [94, 39], 'bright');
define('magentaBright', [95, 39], 'bright');
define('cyanBright', [96, 39], 'bright');
define('whiteBright', [97, 39], 'bright');

define('bgBlackBright', [100, 49], 'bgBright');
define('bgRedBright', [101, 49], 'bgBright');
define('bgGreenBright', [102, 49], 'bgBright');
define('bgYellowBright', [103, 49], 'bgBright');
define('bgBlueBright', [104, 49], 'bgBright');
define('bgMagentaBright', [105, 49], 'bgBright');
define('bgCyanBright', [106, 49], 'bgBright');
define('bgWhiteBright', [107, 49], 'bgBright');

/* eslint-disable no-control-regex */
// this is a modified, optimized version of
// https://github.com/chalk/ansi-regex (MIT License)
const re = colors.ansiRegex = /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g;

colors.hasColor = colors.hasAnsi = str => {
  re.lastIndex = 0;
  return !!str && typeof str === 'string' && re.test(str);
};

colors.unstyle = str => {
  re.lastIndex = 0;
  return typeof str === 'string' ? str.replace(re, '') : str;
};

colors.none = colors.clear = colors.noop = str => str; // no-op, for programmatic usage
colors.stripColor = colors.unstyle;
colors.symbols = symbols;
colors.define = define;
var ansiColors = colors;

/* eslint-disable
  arrow-parens,
  multiline-ternary,
  consistent-return,
  no-param-reassign,
  prefer-destructuring
*/
const noop = () => {};

const levels = Symbol('levels');
const instance = Symbol('instance');

class MethodFactory {
  constructor(logger) {
    this[levels] = {
      TRACE: 0,
      DEBUG: 1,
      INFO: 2,
      WARN: 3,
      ERROR: 4,
      SILENT: 5
    };

    this[instance] = logger;
  }

  set logger(logger) {
    this[instance] = logger;
  }

  get logger() {
    return this[instance];
  }

  get levels() {
    return this[levels];
  }

  get methods() {
    return Object.keys(this.levels)
      .map((key) => key.toLowerCase())
      .filter((key) => key !== 'silent');
  }

  distillLevel(level) {
    let result = level;

    if (
      typeof result === 'string' &&
      typeof this.levels[result.toUpperCase()] !== 'undefined'
    ) {
      result = this.levels[result.toUpperCase()];
    }

    if (this.levelValid(result)) {
      return result;
    }
  }

  levelValid(level) {
    if (
      typeof level === 'number' && level >= 0 &&
      level <= this.levels.SILENT
    ) {
      return true;
    }

    return false;
  }
  /**
   * Build the best logging method possible for this env
   * Wherever possible we want to bind, not wrap, to preserve stack traces.
   * Since we're targeting modern browsers, there's no need to wait for the
   * console to become available.
   */
  // eslint-disable-next-line class-methods-use-this
  make(method) {
    if (method === 'debug') {
      method = 'log';
    }

    /* eslint-disable no-console */
    if (typeof console[method] !== 'undefined') {
      return this.bindMethod(console, method);
    } else if (typeof console.log !== 'undefined') {
      return this.bindMethod(console, 'log');
    }

    /* eslint-enable no-console */
    return noop;
  }

  // eslint-disable-next-line class-methods-use-this
  bindMethod(obj, name) {
    const method = obj[name];

    if (typeof method.bind === 'function') {
      return method.bind(obj);
    }

    try {
      return Function.prototype.bind.call(method, obj);
    } catch (err) {
      // Missing bind shim or IE8 + Modernizr, fallback to wrapping
      return function result() {
        // eslint-disable-next-line prefer-rest-params
        return Function.prototype.apply.apply(method, [obj, arguments]);
      };
    }
  }

  replaceMethods(logLevel) {
    const level = this.distillLevel(logLevel);

    if (level == null) {
      throw new Error(
        `loglevel: replaceMethods() called with invalid level: ${logLevel}`
      );
    }

    if (!this.logger || this.logger.type !== 'LogLevel') {
      throw new TypeError(
        'loglevel: Logger is undefined or invalid. Please specify a valid Logger instance.'
      );
    }

    this.methods.forEach((method) => {
      this.logger[method] = (this.levels[method.toUpperCase()] < level)
        ? noop
        : this.make(method);
    });

    // Define log.log as an alias for log.debug
    this.logger.log = this.logger.debug;
  }
}

var MethodFactory_1 = MethodFactory;

/* eslint-disable
  no-param-reassign,
  space-before-function-paren
*/


const defaults = {
  name (options) {
    return options.logger.name;
  },
  time () {
    return new Date().toTimeString().split(' ')[0];
  },
  level (options) {
    return `[${options.level}]`;
  },
  template: '{{time}} {{level}} '
};

class PrefixFactory extends MethodFactory_1 {
  constructor(logger, options) {
    super(logger);

    this.options = Object.assign({}, defaults, options);
  }

  interpolate(level) {
    return this.options.template.replace(/{{([^{}]*)}}/g, (stache, prop) => {
      const fn = this.options[prop];

      if (fn) {
        return fn({ level, logger: this.logger });
      }

      return stache;
    });
  }

  make(method) {
    const og = super.make(method);

    return (...args) => {
      const [first] = args;

      const output = this.interpolate(method);

      if (typeof first === 'string') {
        args[0] = output + first;
      } else {
        args.unshift(output);
      }

      og(...args);
    };
  }
}

var PrefixFactory_1 = PrefixFactory;

/* global window: true */
/* eslint-disable
  multiline-ternary,
  no-param-reassign
*/



const defaults$1 = {
  name: +new Date(),
  level: 'warn',
  prefix: null,
  factory: null
};

class LogLevel {
  constructor(options) {
    // implement for some _very_ loose type checking. avoids getting into a
    // circular require between MethodFactory and LogLevel
    this.type = 'LogLevel';
    this.options = Object.assign({}, defaults$1, options);
    this.methodFactory = options.factory;

    if (!this.methodFactory) {
      const factory = options.prefix
        ? new PrefixFactory_1(this, options.prefix)
        : new MethodFactory_1(this);

      this.methodFactory = factory;
    }

    if (!this.methodFactory.logger) {
      this.methodFactory.logger = this;
    }

    this.name = options.name || '<unknown>';
    // this.level is a setter, do this after setting up the factory
    this.level = this.options.level;
  }

  get factory() {
    return this.methodFactory;
  }

  set factory(factory) {
    factory.logger = this;

    this.methodFactory = factory;
    this.methodFactory.replaceMethods(this.level);
  }

  enable() {
    this.level = this.levels.TRACE;
  }

  disable() {
    this.level = this.levels.SILENT;
  }

  get level() {
    return this.currentLevel;
  }

  set level(logLevel) {
    const level = this.methodFactory.distillLevel(logLevel);

    if (level == null) {
      throw new Error(
        `loglevel: setLevel() called with invalid level: ${logLevel}`
      );
    }

    this.currentLevel = level;
    this.methodFactory.replaceMethods(level);

    if (typeof console === 'undefined' && level < this.levels.SILENT) {
      // eslint-disable-next-line no-console
      console.warn(
        'loglevel: console is undefined. The log will produce no output'
      );
    }
  }

  get levels() { // eslint-disable-line class-methods-use-this
    return this.methodFactory.levels;
  }
}

var LogLevel_1 = LogLevel;

/* global window: true */
/* eslint-disable
  no-shadow,
  no-param-reassign,
  space-before-function-paren
*/




const defaultLogger = new LogLevel_1({ name: 'default' });
const cache = { default: defaultLogger };

// Grab the current global log variable in case of overwrite
const existing = (typeof window !== 'undefined') ? window.log : null;

const loglevel = Object.assign(defaultLogger, {
  get factories() {
    return {
      MethodFactory: MethodFactory_1,
      PrefixFactory: PrefixFactory_1
    };
  },
  get loggers() {
    return cache;
  },
  getLogger(options) {
    if (typeof options === 'string') {
      options = { name: options };
    }

    if (!options.id) {
      options.id = options.name;
    }

    const { name, id } = options;
    const defaults = { level: defaultLogger.level };

    if (typeof name !== 'string' || !name || !name.length) {
      throw new TypeError('You must supply a name when creating a logger');
    }

    let logger = cache[id];

    if (!logger) {
      logger = new LogLevel_1(Object.assign({}, defaults, options));

      cache[id] = logger;
    }

    return logger;
  },
  noConflict() {
    if (typeof window !== 'undefined' && window.log === defaultLogger) {
      window.log = existing;
    }

    return defaultLogger;
  }
});

var loglevel_1 = loglevel;

/* global window: true */
/* eslint-disable
  no-shadow,
  no-param-reassign,
  space-before-function-paren
*/




const symbols$1 = {
  trace: ansiColors.grey('₸'),
  debug: ansiColors.cyan('➤'),
  info: ansiColors.blue(ansiColors.symbols.info),
  warn: ansiColors.yellow(ansiColors.symbols.warning),
  error: ansiColors.red(ansiColors.symbols.cross)
};

const prefix = {
  level (options) {
    return symbols$1[options.level];
  },
  template: `{{level}} ${ansiColors.gray('｢{{name}}｣')}: `
};

var factories = loglevel_1.factories;
