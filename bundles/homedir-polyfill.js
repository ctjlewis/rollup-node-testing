import os from 'os';
import fs from 'fs';

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
