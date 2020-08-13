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

/**
 * cli.js: Config that conform to commonly used CLI logging levels.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

/**
 * Default levels for the CLI configuration.
 * @type {Object}
 */
var levels = {
  error: 0,
  warn: 1,
  help: 2,
  data: 3,
  info: 4,
  debug: 5,
  prompt: 6,
  verbose: 7,
  input: 8,
  silly: 9
};

/**
 * Default colors for the CLI configuration.
 * @type {Object}
 */
var colors = {
  error: 'red',
  warn: 'yellow',
  help: 'cyan',
  data: 'grey',
  info: 'green',
  debug: 'blue',
  prompt: 'grey',
  verbose: 'cyan',
  input: 'grey',
  silly: 'magenta'
};

var cli = {
	levels: levels,
	colors: colors
};

/**
 * npm.js: Config that conform to npm logging levels.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

/**
 * Default levels for the npm configuration.
 * @type {Object}
 */
var levels$1 = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

/**
 * Default levels for the npm configuration.
 * @type {Object}
 */
var colors$1 = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'green',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'magenta'
};

var npm = {
	levels: levels$1,
	colors: colors$1
};

/**
 * syslog.js: Config that conform to syslog logging levels.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 */

/**
 * Default levels for the syslog configuration.
 * @type {Object}
 */
var levels$2 = {
  emerg: 0,
  alert: 1,
  crit: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
};

/**
 * Default levels for the syslog configuration.
 * @type {Object}
 */
var colors$2 = {
  emerg: 'red',
  alert: 'yellow',
  crit: 'red',
  error: 'red',
  warning: 'red',
  notice: 'yellow',
  info: 'green',
  debug: 'blue'
};

var syslog = {
	levels: levels$2,
	colors: colors$2
};

var config = createCommonjsModule(function (module, exports) {

/**
 * Export config set for the CLI.
 * @type {Object}
 */
Object.defineProperty(exports, 'cli', {
  value: cli
});

/**
 * Export config set for npm.
 * @type {Object}
 */
Object.defineProperty(exports, 'npm', {
  value: npm
});

/**
 * Export config set for the syslog.
 * @type {Object}
 */
Object.defineProperty(exports, 'syslog', {
  value: syslog
});
});

var tripleBeam = createCommonjsModule(function (module, exports) {

/**
 * A shareable symbol constant that can be used
 * as a non-enumerable / semi-hidden level identifier
 * to allow the readable level property to be mutable for
 * operations like colorization
 *
 * @type {Symbol}
 */
Object.defineProperty(exports, 'LEVEL', {
  value: Symbol.for('level')
});

/**
 * A shareable symbol constant that can be used
 * as a non-enumerable / semi-hidden message identifier
 * to allow the final message property to not have
 * side effects on another.
 *
 * @type {Symbol}
 */
Object.defineProperty(exports, 'MESSAGE', {
  value: Symbol.for('message')
});

/**
 * A shareable symbol constant that can be used
 * as a non-enumerable / semi-hidden message identifier
 * to allow the extracted splat property be hidden
 *
 * @type {Symbol}
 */
Object.defineProperty(exports, 'SPLAT', {
  value: Symbol.for('splat')
});

/**
 * A shareable object constant  that can be used
 * as a standard configuration for winston@3.
 *
 * @type {Object}
 */
Object.defineProperty(exports, 'configs', {
  value: config
});
});
