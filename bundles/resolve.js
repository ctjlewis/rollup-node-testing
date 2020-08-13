import fs$1 from 'fs';
import path$1 from 'path';

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

var pathParse = createCommonjsModule(function (module) {

var isWindows = process.platform === 'win32';

// Regex to split a windows path into three parts: [*, device, slash,
// tail] windows-only
var splitDeviceRe =
    /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

// Regex to split the tail part of the above into [*, dir, basename, ext]
var splitTailRe =
    /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

var win32 = {};

// Function to split a filename into [root, dir, basename, ext]
function win32SplitPath(filename) {
  // Separate device+slash from tail
  var result = splitDeviceRe.exec(filename),
      device = (result[1] || '') + (result[2] || ''),
      tail = result[3] || '';
  // Split the tail into dir, basename and extension
  var result2 = splitTailRe.exec(tail),
      dir = result2[1],
      basename = result2[2],
      ext = result2[3];
  return [device, dir, basename, ext];
}

win32.parse = function(pathString) {
  if (typeof pathString !== 'string') {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = win32SplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};



// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var posix = {};


function posixSplitPath(filename) {
  return splitPathRe.exec(filename).slice(1);
}


posix.parse = function(pathString) {
  if (typeof pathString !== 'string') {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = posixSplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  allParts[1] = allParts[1] || '';
  allParts[2] = allParts[2] || '';
  allParts[3] = allParts[3] || '';

  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};


if (isWindows)
  module.exports = win32.parse;
else /* posix */
  module.exports = posix.parse;

module.exports.posix = posix.parse;
module.exports.win32 = win32.parse;
});

var parse = path$1.parse || pathParse;

var assert = true;
var async_hooks = ">= 8";
var buffer_ieee754 = "< 0.9.7";
var buffer = true;
var child_process = true;
var cluster = true;
var console = true;
var constants = true;
var crypto = true;
var _debug_agent = ">= 1 && < 8";
var _debugger = "< 8";
var dgram = true;
var dns = true;
var domain = true;
var events = true;
var freelist = "< 6";
var fs = true;
var _http_agent = ">= 0.11.1";
var _http_client = ">= 0.11.1";
var _http_common = ">= 0.11.1";
var _http_incoming = ">= 0.11.1";
var _http_outgoing = ">= 0.11.1";
var _http_server = ">= 0.11.1";
var http = true;
var http2 = ">= 8.8";
var https = true;
var inspector = ">= 8.0.0";
var _linklist = "< 8";
var module = true;
var net = true;
var os = true;
var path = true;
var perf_hooks = ">= 8.5";
var process$1 = ">= 1";
var punycode = true;
var querystring = true;
var readline = true;
var repl = true;
var smalloc = ">= 0.11.5 && < 3";
var _stream_duplex = ">= 0.9.4";
var _stream_transform = ">= 0.9.4";
var _stream_wrap = ">= 1.4.1";
var _stream_passthrough = ">= 0.9.4";
var _stream_readable = ">= 0.9.4";
var _stream_writable = ">= 0.9.4";
var stream = true;
var string_decoder = true;
var sys = true;
var timers = true;
var _tls_common = ">= 0.11.13";
var _tls_legacy = ">= 0.11.3 && < 10";
var _tls_wrap = ">= 0.11.3";
var tls = true;
var trace_events = ">= 10";
var tty = true;
var url = true;
var util = true;
var v8 = ">= 1";
var vm = true;
var wasi = ">= 13.4 && < 13.5";
var worker_threads = ">= 11.7";
var zlib = true;
var core = {
	assert: assert,
	async_hooks: async_hooks,
	buffer_ieee754: buffer_ieee754,
	buffer: buffer,
	child_process: child_process,
	cluster: cluster,
	console: console,
	constants: constants,
	crypto: crypto,
	_debug_agent: _debug_agent,
	_debugger: _debugger,
	dgram: dgram,
	dns: dns,
	domain: domain,
	events: events,
	freelist: freelist,
	fs: fs,
	"fs/promises": [
	">= 10 && < 10.1",
	">= 14"
],
	_http_agent: _http_agent,
	_http_client: _http_client,
	_http_common: _http_common,
	_http_incoming: _http_incoming,
	_http_outgoing: _http_outgoing,
	_http_server: _http_server,
	http: http,
	http2: http2,
	https: https,
	inspector: inspector,
	_linklist: _linklist,
	module: module,
	net: net,
	"node-inspect/lib/_inspect": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_client": ">= 7.6.0 && < 12",
	"node-inspect/lib/internal/inspect_repl": ">= 7.6.0 && < 12",
	os: os,
	path: path,
	perf_hooks: perf_hooks,
	process: process$1,
	punycode: punycode,
	querystring: querystring,
	readline: readline,
	repl: repl,
	smalloc: smalloc,
	_stream_duplex: _stream_duplex,
	_stream_transform: _stream_transform,
	_stream_wrap: _stream_wrap,
	_stream_passthrough: _stream_passthrough,
	_stream_readable: _stream_readable,
	_stream_writable: _stream_writable,
	stream: stream,
	string_decoder: string_decoder,
	sys: sys,
	timers: timers,
	_tls_common: _tls_common,
	_tls_legacy: _tls_legacy,
	_tls_wrap: _tls_wrap,
	tls: tls,
	trace_events: trace_events,
	tty: tty,
	url: url,
	util: util,
	"v8/tools/arguments": ">= 10 && < 12",
	"v8/tools/codemap": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/consarray": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/csvparser": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/logreader": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/profile_view": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	"v8/tools/splaytree": [
	">= 4.4.0 && < 5",
	">= 5.2.0 && < 12"
],
	v8: v8,
	vm: vm,
	wasi: wasi,
	worker_threads: worker_threads,
	zlib: zlib
};

var core$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	assert: assert,
	async_hooks: async_hooks,
	buffer_ieee754: buffer_ieee754,
	buffer: buffer,
	child_process: child_process,
	cluster: cluster,
	console: console,
	constants: constants,
	crypto: crypto,
	_debug_agent: _debug_agent,
	_debugger: _debugger,
	dgram: dgram,
	dns: dns,
	domain: domain,
	events: events,
	freelist: freelist,
	fs: fs,
	_http_agent: _http_agent,
	_http_client: _http_client,
	_http_common: _http_common,
	_http_incoming: _http_incoming,
	_http_outgoing: _http_outgoing,
	_http_server: _http_server,
	http: http,
	http2: http2,
	https: https,
	inspector: inspector,
	_linklist: _linklist,
	module: module,
	net: net,
	os: os,
	path: path,
	perf_hooks: perf_hooks,
	process: process$1,
	punycode: punycode,
	querystring: querystring,
	readline: readline,
	repl: repl,
	smalloc: smalloc,
	_stream_duplex: _stream_duplex,
	_stream_transform: _stream_transform,
	_stream_wrap: _stream_wrap,
	_stream_passthrough: _stream_passthrough,
	_stream_readable: _stream_readable,
	_stream_writable: _stream_writable,
	stream: stream,
	string_decoder: string_decoder,
	sys: sys,
	timers: timers,
	_tls_common: _tls_common,
	_tls_legacy: _tls_legacy,
	_tls_wrap: _tls_wrap,
	tls: tls,
	trace_events: trace_events,
	tty: tty,
	url: url,
	util: util,
	v8: v8,
	vm: vm,
	wasi: wasi,
	worker_threads: worker_threads,
	zlib: zlib,
	'default': core
});

var data = getCjsExportFromNamespace(core$1);

var current = (process.versions && process.versions.node && process.versions.node.split('.')) || [];

function specifierIncluded(specifier) {
    var parts = specifier.split(' ');
    var op = parts.length > 1 ? parts[0] : '=';
    var versionParts = (parts.length > 1 ? parts[1] : parts[0]).split('.');

    for (var i = 0; i < 3; ++i) {
        var cur = Number(current[i] || 0);
        var ver = Number(versionParts[i] || 0);
        if (cur === ver) {
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        }
        if (op === '<') {
            return cur < ver;
        } else if (op === '>=') {
            return cur >= ver;
        } else {
            return false;
        }
    }
    return op === '>=';
}

function matchesRange(range) {
    var specifiers = range.split(/ ?&& ?/);
    if (specifiers.length === 0) { return false; }
    for (var i = 0; i < specifiers.length; ++i) {
        if (!specifierIncluded(specifiers[i])) { return false; }
    }
    return true;
}

function versionIncluded(specifierValue) {
    if (typeof specifierValue === 'boolean') { return specifierValue; }
    if (specifierValue && typeof specifierValue === 'object') {
        for (var i = 0; i < specifierValue.length; ++i) {
            if (matchesRange(specifierValue[i])) { return true; }
        }
        return false;
    }
    return matchesRange(specifierValue);
}



var core$2 = {};
for (var mod in data) { // eslint-disable-line no-restricted-syntax
    if (Object.prototype.hasOwnProperty.call(data, mod)) {
        core$2[mod] = versionIncluded(data[mod]);
    }
}

var realpathFS = fs$1.realpath && typeof fs$1.realpath.native === 'function' ? fs$1.realpath.native : fs$1.realpath;

var realpathFS$1 = fs$1.realpathSync && typeof fs$1.realpathSync.native === 'function' ? fs$1.realpathSync.native : fs$1.realpathSync;
