import console$1 from 'console';

// call it on itself so we can test the export val for basic stuff
var colorSupport_1 = colorSupport({ alwaysReturn: true }, colorSupport);

function hasNone (obj, options) {
  obj.level = 0;
  obj.hasBasic = false;
  obj.has256 = false;
  obj.has16m = false;
  if (!options.alwaysReturn) {
    return false
  }
  return obj
}

function hasBasic (obj) {
  obj.hasBasic = true;
  obj.has256 = false;
  obj.has16m = false;
  obj.level = 1;
  return obj
}

function has256 (obj) {
  obj.hasBasic = true;
  obj.has256 = true;
  obj.has16m = false;
  obj.level = 2;
  return obj
}

function has16m (obj) {
  obj.hasBasic = true;
  obj.has256 = true;
  obj.has16m = true;
  obj.level = 3;
  return obj
}

function colorSupport (options, obj) {
  options = options || {};

  obj = obj || {};

  // if just requesting a specific level, then return that.
  if (typeof options.level === 'number') {
    switch (options.level) {
      case 0:
        return hasNone(obj, options)
      case 1:
        return hasBasic(obj)
      case 2:
        return has256(obj)
      case 3:
        return has16m(obj)
    }
  }

  obj.level = 0;
  obj.hasBasic = false;
  obj.has256 = false;
  obj.has16m = false;

  if (typeof process === 'undefined' ||
      !process ||
      !process.stdout ||
      !process.env ||
      !process.platform) {
    return hasNone(obj, options)
  }

  var env = options.env || process.env;
  var stream = options.stream || process.stdout;
  var term = options.term || env.TERM || '';
  var platform = options.platform || process.platform;

  if (!options.ignoreTTY && !stream.isTTY) {
    return hasNone(obj, options)
  }

  if (!options.ignoreDumb && term === 'dumb' && !env.COLORTERM) {
    return hasNone(obj, options)
  }

  if (platform === 'win32') {
    return hasBasic(obj)
  }

  if (env.TMUX) {
    return has256(obj)
  }

  if (!options.ignoreCI && (env.CI || env.TEAMCITY_VERSION)) {
    if (env.TRAVIS) {
      return has256(obj)
    } else {
      return hasNone(obj, options)
    }
  }

  // TODO: add more term programs
  switch (env.TERM_PROGRAM) {
    case 'iTerm.app':
      var ver = env.TERM_PROGRAM_VERSION || '0.';
      if (/^[0-2]\./.test(ver)) {
        return has256(obj)
      } else {
        return has16m(obj)
      }

    case 'HyperTerm':
    case 'Hyper':
      return has16m(obj)

    case 'MacTerm':
      return has16m(obj)

    case 'Apple_Terminal':
      return has256(obj)
  }

  if (/^xterm-256/.test(term)) {
    return has256(obj)
  }

  if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(term)) {
    return hasBasic(obj)
  }

  if (env.COLORTERM) {
    return hasBasic(obj)
  }

  return hasNone(obj, options)
}

function parseNodeVersion(version) {
  var match = version.match(/^v(\d{1,2})\.(\d{1,2})\.(\d{1,2})(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/); // eslint-disable-line max-len
  if (!match) {
    throw new Error('Unable to parse: ' + version);
  }

  var res = {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    pre: match[4] || '',
    build: match[5] || '',
  };

  return res;
}

var parseNodeVersion_1 = parseNodeVersion;

var Console = console$1.Console;



var nodeVersion = parseNodeVersion_1(process.version);

var colorDetectionOptions = {
  // If on Windows, ignore the isTTY check
  // This is due to AppVeyor (and thus probably common Windows platforms?) failing the check
  // TODO: If this is too broad, we can reduce it to an APPVEYOR env check
  ignoreTTY: (process.platform === 'win32'),
};

// Needed to add this because node 10 decided to start coloring log output randomly
var console;
if (nodeVersion.major >= 10) {
  // Node 10 also changed the way this is constructed
  console = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
    colorMode: false,
  });
} else {
  console = new Console(process.stdout, process.stderr);
}
