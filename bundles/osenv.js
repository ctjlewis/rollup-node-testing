import 'path';
import child_process from 'child_process';
import os from 'os';

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

var isWindows = process.platform === 'win32';
var trailingSlashRe = isWindows ? /[^:]\\$/ : /.\/$/;

// https://github.com/nodejs/node/blob/3e7a14381497a3b73dda68d05b5130563cdab420/lib/os.js#L25-L43
var osTmpdir = function () {
	var path;

	if (isWindows) {
		path = process.env.TEMP ||
			process.env.TMP ||
			(process.env.SystemRoot || process.env.windir) + '\\temp';
	} else {
		path = process.env.TMPDIR ||
			process.env.TMP ||
			process.env.TEMP ||
			'/tmp';
	}

	if (trailingSlashRe.test(path)) {
		path = path.slice(0, -1);
	}

	return path;
};

function homedir() {
	var env = process.env;
	var home = env.HOME;
	var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

	if (process.platform === 'win32') {
		return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
	}

	if (process.platform === 'darwin') {
		return home || (user ? '/Users/' + user : null);
	}

	if (process.platform === 'linux') {
		return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
	}

	return home || null;
}

var osHomedir = typeof os.homedir === 'function' ? os.homedir : homedir;

var osenv = createCommonjsModule(function (module, exports) {
var isWindows = process.platform === 'win32';

var exec = child_process.exec;



// looking up envs is a bit costly.
// Also, sometimes we want to have a fallback
// Pass in a callback to wait for the fallback on failures
// After the first lookup, always returns the same thing.
function memo (key, lookup, fallback) {
  var fell = false;
  var falling = false;
  exports[key] = function (cb) {
    var val = lookup();
    if (!val && !fell && !falling && fallback) {
      fell = true;
      falling = true;
      exec(fallback, function (er, output, stderr) {
        falling = false;
        if (er) return // oh well, we tried
        val = output.trim();
      });
    }
    exports[key] = function (cb) {
      if (cb) process.nextTick(cb.bind(null, null, val));
      return val
    };
    if (cb && !falling) process.nextTick(cb.bind(null, null, val));
    return val
  };
}

memo('user', function () {
  return ( isWindows
         ? process.env.USERDOMAIN + '\\' + process.env.USERNAME
         : process.env.USER
         )
}, 'whoami');

memo('prompt', function () {
  return isWindows ? process.env.PROMPT : process.env.PS1
});

memo('hostname', function () {
  return isWindows ? process.env.COMPUTERNAME : process.env.HOSTNAME
}, 'hostname');

memo('tmpdir', function () {
  return osTmpdir()
});

memo('home', function () {
  return osHomedir()
});

memo('path', function () {
  return (process.env.PATH ||
          process.env.Path ||
          process.env.path).split(isWindows ? ';' : ':')
});

memo('editor', function () {
  return process.env.EDITOR ||
         process.env.VISUAL ||
         (isWindows ? 'notepad.exe' : 'vi')
});

memo('shell', function () {
  return isWindows ? process.env.ComSpec || 'cmd'
         : process.env.SHELL || 'bash'
});
});
