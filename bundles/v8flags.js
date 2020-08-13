import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import child_process from 'child_process';

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

/**
 * Parse the content of a passwd file into a list of user objects.
 * This function ignores blank lines and comments.
 *
 * ```js
 * // assuming '/etc/passwd' contains:
 * // doowb:*:123:123:Brian Woodward:/Users/doowb:/bin/bash
 * console.log(parse(fs.readFileSync('/etc/passwd', 'utf8')));
 *
 * //=> [
 * //=>   {
 * //=>     username: 'doowb',
 * //=>     password: '*',
 * //=>     uid: '123',
 * //=>     gid: '123',
 * //=>     gecos: 'Brian Woodward',
 * //=>     homedir: '/Users/doowb',
 * //=>     shell: '/bin/bash'
 * //=>   }
 * //=> ]
 * ```
 * @param  {String} `content` Content of a passwd file to parse.
 * @return {Array} Array of user objects parsed from the content.
 * @api public
 */

var parsePasswd = function(content) {
  if (typeof content !== 'string') {
    throw new Error('expected a string');
  }
  return content
    .split('\n')
    .map(user)
    .filter(Boolean);
};

function user(line, i) {
  if (!line || !line.length || line.charAt(0) === '#') {
    return null;
  }

  // see https://en.wikipedia.org/wiki/Passwd for field descriptions
  var fields = line.split(':');
  return {
    username: fields[0],
    password: fields[1],
    uid: fields[2],
    gid: fields[3],
    // see https://en.wikipedia.org/wiki/Gecos_field for GECOS field descriptions
    gecos: fields[4],
    homedir: fields[5],
    shell: fields[6]
  };
}

function homedir() {
  // The following logic is from looking at logic used in the different platform
  // versions of the uv_os_homedir function found in https://github.com/libuv/libuv
  // This is the function used in modern versions of node.js

  if (process.platform === 'win32') {
    // check the USERPROFILE first
    if (process.env.USERPROFILE) {
      return process.env.USERPROFILE;
    }

    // check HOMEDRIVE and HOMEPATH
    if (process.env.HOMEDRIVE && process.env.HOMEPATH) {
      return process.env.HOMEDRIVE + process.env.HOMEPATH;
    }

    // fallback to HOME
    if (process.env.HOME) {
      return process.env.HOME;
    }

    return null;
  }

  // check HOME environment variable first
  if (process.env.HOME) {
    return process.env.HOME;
  }

  // on linux platforms (including OSX) find the current user and get their homedir from the /etc/passwd file
  var passwd = tryReadFileSync('/etc/passwd');
  var home = find(parsePasswd(passwd), getuid());
  if (home) {
    return home;
  }

  // fallback to using user environment variables
  var user = process.env.LOGNAME || process.env.USER || process.env.LNAME || process.env.USERNAME;

  if (!user) {
    return null;
  }

  if (process.platform === 'darwin') {
    return '/Users/' + user;
  }

  return '/home/' + user;
}

function find(arr, uid) {
  var len = arr.length;
  for (var i = 0; i < len; i++) {
    if (+arr[i].uid === uid) {
      return arr[i].homedir;
    }
  }
}

function getuid() {
  if (typeof process.geteuid === 'function') {
    return process.geteuid();
  }
  return process.getuid();
}

function tryReadFileSync(fp) {
  try {
    return fs.readFileSync(fp, 'utf8');
  } catch (err) {
    return '';
  }
}

var polyfill = homedir;

var homedirPolyfill = createCommonjsModule(function (module) {


if (typeof os.homedir !== 'undefined') {
  module.exports = os.homedir;
} else {
  module.exports = polyfill;
}
});

var userHome = homedirPolyfill();

var env = process.env;
var name = 'js-v8flags';

function macos() {
  var library = path.join(userHome, 'Library');
  return path.join(library, 'Caches', name);
}

function windows() {
  var appData = env.LOCALAPPDATA || path.join(userHome, 'AppData', 'Local');
  return path.join(appData, name);
}

// https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
function linux() {
  var username = path.basename(userHome);
  return path.join(env.XDG_CACHE_HOME || path.join(userHome, '.cache'), name);
}

var configPath = function(platform) {
  if (!userHome) {
    return os.tmpdir();
  }

  if (platform === 'darwin') {
    return macos();
  }

  if (platform === 'win32') {
    return windows();
  }

  return linux();
};

var name$1 = "v8flags";
var version = "3.2.0";
var description = "Get available v8 and Node.js flags.";
var author = "Gulp Team <team@gulpjs.com> (http://gulpjs.com/)";
var contributors = [
	"Tyler Kellen <tyler@sleekcode.net>",
	"Blaine Bublitz <blaine.bublitz@gmail.com>",
	"Nicolò Ribaudo <nicolo.ribaudo@gmail.com>",
	"Selwyn <talk@selwyn.cc>",
	"Leo Zhang <leo@leozhang.me>"
];
var repository = "gulpjs/v8flags";
var license = "MIT";
var engines = {
	node: ">= 0.10"
};
var main = "index.js";
var files = [
	"index.js",
	"config-path.js",
	"LICENSE"
];
var scripts = {
	lint: "eslint .",
	pretest: "npm run lint",
	test: "mocha --async-only",
	cover: "istanbul cover _mocha --report lcovonly",
	coveralls: "npm run cover && istanbul-coveralls"
};
var dependencies = {
	"homedir-polyfill": "^1.0.1"
};
var devDependencies = {
	async: "^2.5.0",
	eslint: "^2.13.0",
	"eslint-config-gulp": "^3.0.1",
	expect: "^1.20.2",
	istanbul: "^0.4.3",
	"istanbul-coveralls": "^1.0.3",
	mocha: "^3.5.3",
	proxyquire: "^1.8.0"
};
var keywords = [
	"v8 flags",
	"harmony flags"
];
var _package = {
	name: name$1,
	version: version,
	description: description,
	author: author,
	contributors: contributors,
	repository: repository,
	license: license,
	engines: engines,
	main: main,
	files: files,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies,
	keywords: keywords
};

var _package$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	name: name$1,
	version: version,
	description: description,
	author: author,
	contributors: contributors,
	repository: repository,
	license: license,
	engines: engines,
	main: main,
	files: files,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies,
	keywords: keywords,
	'default': _package
});

var require$$2 = getCjsExportFromNamespace(_package$1);

// this entire module is depressing. i should have spent my time learning
// how to patch v8 so that these options would just be available on the
// process object.





var execFile = child_process.execFile;
var configPath$1 = configPath(process.platform);
var version$1 = require$$2.version;
var env$1 = process.env;
var user$1 = env$1.LOGNAME || env$1.USER || env$1.LNAME || env$1.USERNAME || '';

// This number must be incremented whenever the generated cache file changes.
var CACHE_VERSION = 2;

var configfile = '.v8flags-' + CACHE_VERSION + '-' + process.versions.v8 + '.' + crypto.createHash('md5').update(user$1).digest('hex') + '.json';
