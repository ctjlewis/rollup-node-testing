import fs from 'fs';
import path from 'path';
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

var globalDirs = createCommonjsModule(function (module, exports) {





const isWindows = process.platform === 'win32';

const readRc = filePath => {
	try {
		return ini.parse(fs.readFileSync(filePath, 'utf8')).prefix;
	} catch (_) {}
};

const getEnvNpmPrefix = () => {
	return Object.keys(process.env).reduce((prefix, name) => {
		return (/^npm_config_prefix$/i).test(name) ? process.env[name] : prefix;
	}, undefined);
};

const getGlobalNpmrc = () => {
	if (isWindows && process.env.APPDATA) {
		// Hardcoded contents of `c:\Program Files\nodejs\node_modules\npm\npmrc`
		return path.join(process.env.APPDATA, '/npm/etc/npmrc');
	}

	// Homebrew special case: `$(brew --prefix)/lib/node_modules/npm/npmrc`
	if (process.execPath.includes('/Cellar/node')) {
		const homebrewPrefix = process.execPath.slice(0, process.execPath.indexOf('/Cellar/node'));
		return path.join(homebrewPrefix, '/lib/node_modules/npm/npmrc');
	}

	if (process.execPath.endsWith('/bin/node')) {
		const installDir = path.dirname(path.dirname(process.execPath));
		return path.join(installDir, '/etc/npmrc');
	}
};

const getDefaultNpmPrefix = () => {
	if (isWindows) {
		// `c:\node\node.exe` → `prefix=c:\node\`
		return path.dirname(process.execPath);
	}

	// `/usr/local/bin/node` → `prefix=/usr/local`
	return path.dirname(path.dirname(process.execPath));
};

const getNpmPrefix = () => {
	const envPrefix = getEnvNpmPrefix();
	if (envPrefix) {
		return envPrefix;
	}

	const homePrefix = readRc(path.join(os.homedir(), '.npmrc'));
	if (homePrefix) {
		return homePrefix;
	}

	if (process.env.PREFIX) {
		return process.env.PREFIX;
	}

	const globalPrefix = readRc(getGlobalNpmrc());
	if (globalPrefix) {
		return globalPrefix;
	}

	return getDefaultNpmPrefix();
};

const npmPrefix = path.resolve(getNpmPrefix());

const getYarnWindowsDirectory = () => {
	if (isWindows && process.env.LOCALAPPDATA) {
		const dir = path.join(process.env.LOCALAPPDATA, 'Yarn');
		if (fs.existsSync(dir)) {
			return dir;
		}
	}

	return false;
};

const getYarnPrefix = () => {
	if (process.env.PREFIX) {
		return process.env.PREFIX;
	}

	const windowsPrefix = getYarnWindowsDirectory();
	if (windowsPrefix) {
		return windowsPrefix;
	}

	const configPrefix = path.join(os.homedir(), '.config/yarn');
	if (fs.existsSync(configPrefix)) {
		return configPrefix;
	}

	const homePrefix = path.join(os.homedir(), '.yarn-config');
	if (fs.existsSync(homePrefix)) {
		return homePrefix;
	}

	// Yarn supports the npm conventions but the inverse is not true
	return npmPrefix;
};

exports.npm = {};
exports.npm.prefix = npmPrefix;
exports.npm.packages = path.join(npmPrefix, isWindows ? 'node_modules' : 'lib/node_modules');
exports.npm.binaries = isWindows ? npmPrefix : path.join(npmPrefix, 'bin');

const yarnPrefix = path.resolve(getYarnPrefix());
exports.yarn = {};
exports.yarn.prefix = yarnPrefix;
exports.yarn.packages = path.join(yarnPrefix, getYarnWindowsDirectory() ? 'Data/global/node_modules' : 'global/node_modules');
exports.yarn.binaries = path.join(exports.yarn.packages, '.bin');
});

var isPathInside = (childPath, parentPath) => {
	childPath = path.resolve(childPath);
	parentPath = path.resolve(parentPath);

	if (process.platform === 'win32') {
		childPath = childPath.toLowerCase();
		parentPath = parentPath.toLowerCase();
	}

	if (childPath === parentPath) {
		return false;
	}

	childPath += path.sep;
	parentPath += path.sep;

	return childPath.startsWith(parentPath);
};

var isInstalledGlobally = (() => {
	try {
		return (
			isPathInside(__dirname, globalDirs.yarn.packages) ||
			isPathInside(__dirname, fs.realpathSync(globalDirs.npm.packages))
		);
	} catch (_) {
		return false;
	}
})();
