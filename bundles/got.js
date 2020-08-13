import events from 'events';
import http from 'http';
import https from 'https';
import stream from 'stream';
import url from 'url';
import querystring from 'querystring';
import zlib from 'zlib';
import buffer$1 from 'buffer';

function DuplexWrapper(options, writable, readable) {
  if (typeof readable === "undefined") {
    readable = writable;
    writable = options;
    options = null;
  }

  stream.Duplex.call(this, options);

  if (typeof readable.read !== "function") {
    readable = (new stream.Readable(options)).wrap(readable);
  }

  this._writable = writable;
  this._readable = readable;
  this._waiting = false;

  var self = this;

  writable.once("finish", function() {
    self.end();
  });

  this.once("finish", function() {
    writable.end();
  });

  readable.on("readable", function() {
    if (self._waiting) {
      self._waiting = false;
      self._read();
    }
  });

  readable.once("end", function() {
    self.push(null);
  });

  if (!options || typeof options.bubbleErrors === "undefined" || options.bubbleErrors) {
    writable.on("error", function(err) {
      self.emit("error", err);
    });

    readable.on("error", function(err) {
      self.emit("error", err);
    });
  }
}

DuplexWrapper.prototype = Object.create(stream.Duplex.prototype, {constructor: {value: DuplexWrapper}});

DuplexWrapper.prototype._write = function _write(input, encoding, done) {
  this._writable.write(input, encoding, done);
};

DuplexWrapper.prototype._read = function _read() {
  var buf;
  var reads = 0;
  while ((buf = this._readable.read()) !== null) {
    this.push(buf);
    reads++;
  }
  if (reads === 0) {
    this._waiting = true;
  }
};

var duplexer3 = function duplex2(options, writable, readable) {
  return new DuplexWrapper(options, writable, readable);
};

var DuplexWrapper_1 = DuplexWrapper;
duplexer3.DuplexWrapper = DuplexWrapper_1;

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

var isStream_1 = createCommonjsModule(function (module) {

var isStream = module.exports = function (stream) {
	return stream !== null && typeof stream === 'object' && typeof stream.pipe === 'function';
};

isStream.writable = function (stream) {
	return isStream(stream) && stream.writable !== false && typeof stream._write === 'function' && typeof stream._writableState === 'object';
};

isStream.readable = function (stream) {
	return isStream(stream) && stream.readable !== false && typeof stream._read === 'function' && typeof stream._readableState === 'object';
};

isStream.duplex = function (stream) {
	return isStream.writable(stream) && isStream.readable(stream);
};

isStream.transform = function (stream) {
	return isStream.duplex(stream) && typeof stream._transform === 'function' && typeof stream._transformState === 'object';
};
});

const PassThrough = stream.PassThrough;

var bufferStream = opts => {
	opts = Object.assign({}, opts);

	const array = opts.array;
	let encoding = opts.encoding;
	const buffer = encoding === 'buffer';
	let objectMode = false;

	if (array) {
		objectMode = !(encoding || buffer);
	} else {
		encoding = encoding || 'utf8';
	}

	if (buffer) {
		encoding = null;
	}

	let len = 0;
	const ret = [];
	const stream = new PassThrough({objectMode});

	if (encoding) {
		stream.setEncoding(encoding);
	}

	stream.on('data', chunk => {
		ret.push(chunk);

		if (objectMode) {
			len = ret.length;
		} else {
			len += chunk.length;
		}
	});

	stream.getBufferedValue = () => {
		if (array) {
			return ret;
		}

		return buffer ? Buffer.concat(ret, len) : ret.join('');
	};

	stream.getBufferedLength = () => len;

	return stream;
};

function getStream(inputStream, opts) {
	if (!inputStream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	opts = Object.assign({maxBuffer: Infinity}, opts);

	const maxBuffer = opts.maxBuffer;
	let stream;
	let clean;

	const p = new Promise((resolve, reject) => {
		const error = err => {
			if (err) { // null check
				err.bufferedData = stream.getBufferedValue();
			}

			reject(err);
		};

		stream = bufferStream(opts);
		inputStream.once('error', error);
		inputStream.pipe(stream);

		stream.on('data', () => {
			if (stream.getBufferedLength() > maxBuffer) {
				reject(new Error('maxBuffer exceeded'));
			}
		});
		stream.once('error', error);
		stream.on('end', resolve);

		clean = () => {
			// some streams doesn't implement the `stream.Readable` interface correctly
			if (inputStream.unpipe) {
				inputStream.unpipe(stream);
			}
		};
	});

	p.then(clean, clean);

	return p.then(() => stream.getBufferedValue());
}

var getStream_1 = getStream;
var buffer = (stream, opts) => getStream(stream, Object.assign({}, opts, {encoding: 'buffer'}));
var array = (stream, opts) => getStream(stream, Object.assign({}, opts, {array: true}));
getStream_1.buffer = buffer;
getStream_1.array = array;

var timedOut = function (req, time) {
	if (req.timeoutTimer) {
		return req;
	}

	var delays = isNaN(time) ? time : {socket: time, connect: time};
	var host = req._headers ? (' to ' + req._headers.host) : '';

	if (delays.connect !== undefined) {
		req.timeoutTimer = setTimeout(function timeoutHandler() {
			req.abort();
			var e = new Error('Connection timed out on request' + host);
			e.code = 'ETIMEDOUT';
			req.emit('error', e);
		}, delays.connect);
	}

	// Clear the connection timeout timer once a socket is assigned to the
	// request and is connected.
	req.on('socket', function assign(socket) {
		// Socket may come from Agent pool and may be already connected.
		if (!(socket.connecting || socket._connecting)) {
			connect();
			return;
		}

		socket.once('connect', connect);
	});

	function clear() {
		if (req.timeoutTimer) {
			clearTimeout(req.timeoutTimer);
			req.timeoutTimer = null;
		}
	}

	function connect() {
		clear();

		if (delays.socket !== undefined) {
			// Abort the request if there is no activity on the socket for more
			// than `delays.socket` milliseconds.
			req.setTimeout(delays.socket, function socketTimeoutHandler() {
				req.abort();
				var e = new Error('Socket timed out on request' + host);
				e.code = 'ESOCKETTIMEDOUT';
				req.emit('error', e);
			});
		}
	}

	return req.on('error', clear);
};

var prependHttp = function (url) {
	if (typeof url !== 'string') {
		throw new TypeError('Expected a string, got ' + typeof url);
	}

	url = url.trim();

	if (/^\.*\/|^(?!localhost)\w+:/.test(url)) {
		return url;
	}

	return url.replace(/^(?!(?:\w+:)?\/\/)/, 'http://');
};

var urlParseLax = function (x) {
	var withProtocol = prependHttp(x);
	var parsed = url.parse(withProtocol);

	if (withProtocol !== x) {
		parsed.protocol = null;
	}

	return parsed;
};

var lowercaseKeys = function (obj) {
	var ret = {};
	var keys = Object.keys(Object(obj));

	for (var i = 0; i < keys.length; i++) {
		ret[keys[i].toLowerCase()] = obj[keys[i]];
	}

	return ret;
};

var isRedirect = function (x) {
	if (typeof x !== 'number') {
		throw new TypeError('Expected a number');
	}

	return x === 300 ||
		x === 301 ||
		x === 302 ||
		x === 303 ||
		x === 305 ||
		x === 307 ||
		x === 308;
};

const PassThrough$1 = stream.PassThrough;


var unzipResponse = res => {
	// TODO: use Array#includes when targeting Node.js 6
	if (['gzip', 'deflate'].indexOf(res.headers['content-encoding']) === -1) {
		return res;
	}

	const unzip = zlib.createUnzip();
	const stream = new PassThrough$1();

	stream.httpVersion = res.httpVersion;
	stream.headers = res.headers;
	stream.rawHeaders = res.rawHeaders;
	stream.trailers = res.trailers;
	stream.rawTrailers = res.rawTrailers;
	stream.setTimeout = res.setTimeout.bind(res);
	stream.statusCode = res.statusCode;
	stream.statusMessage = res.statusMessage;
	stream.socket = res.socket;

	unzip.on('error', err => {
		if (err.code === 'Z_BUF_ERROR') {
			stream.end();
			return;
		}

		stream.emit('error', err);
	});

	res.pipe(unzip).pipe(stream);

	return stream;
};

var captureStackTrace = Error.captureStackTrace || function (error) {
	var container = new Error();

	Object.defineProperty(error, 'stack', {
		configurable: true,
		get: function getStack() {
			var stack = container.stack;

			Object.defineProperty(this, 'stack', {
				value: stack
			});

			return stack;
		}
	});
};

function inherits(ctor, superCtor) {
	ctor.super_ = superCtor;
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false,
			writable: true,
			configurable: true
		}
	});
}

var createErrorClass = function createErrorClass(className, setup) {
	if (typeof className !== 'string') {
		throw new TypeError('Expected className to be a string');
	}

	if (/[^0-9a-zA-Z_$]/.test(className)) {
		throw new Error('className contains invalid characters');
	}

	setup = setup || function (message) {
		this.message = message;
	};

	var ErrorClass = function () {
		Object.defineProperty(this, 'name', {
			configurable: true,
			value: className,
			writable: true
		});

		captureStackTrace(this, this.constructor);

		setup.apply(this, arguments);
	};

	inherits(ErrorClass, Error);

	return ErrorClass;
};

var WHITELIST = [
	'ETIMEDOUT',
	'ECONNRESET',
	'EADDRINUSE',
	'ESOCKETTIMEDOUT',
	'ECONNREFUSED',
	'EPIPE',
	'EHOSTUNREACH',
	'EAI_AGAIN'
];

var BLACKLIST = [
	'ENOTFOUND',
	'ENETUNREACH',

	// SSL errors from https://github.com/nodejs/node/blob/ed3d8b13ee9a705d89f9e0397d9e96519e7e47ac/src/node_crypto.cc#L1950
	'UNABLE_TO_GET_ISSUER_CERT',
	'UNABLE_TO_GET_CRL',
	'UNABLE_TO_DECRYPT_CERT_SIGNATURE',
	'UNABLE_TO_DECRYPT_CRL_SIGNATURE',
	'UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY',
	'CERT_SIGNATURE_FAILURE',
	'CRL_SIGNATURE_FAILURE',
	'CERT_NOT_YET_VALID',
	'CERT_HAS_EXPIRED',
	'CRL_NOT_YET_VALID',
	'CRL_HAS_EXPIRED',
	'ERROR_IN_CERT_NOT_BEFORE_FIELD',
	'ERROR_IN_CERT_NOT_AFTER_FIELD',
	'ERROR_IN_CRL_LAST_UPDATE_FIELD',
	'ERROR_IN_CRL_NEXT_UPDATE_FIELD',
	'OUT_OF_MEM',
	'DEPTH_ZERO_SELF_SIGNED_CERT',
	'SELF_SIGNED_CERT_IN_CHAIN',
	'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
	'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
	'CERT_CHAIN_TOO_LONG',
	'CERT_REVOKED',
	'INVALID_CA',
	'PATH_LENGTH_EXCEEDED',
	'INVALID_PURPOSE',
	'CERT_UNTRUSTED',
	'CERT_REJECTED'
];

var isRetryAllowed = function (err) {
	if (!err || !err.code) {
		return true;
	}

	if (WHITELIST.indexOf(err.code) !== -1) {
		return true;
	}

	if (BLACKLIST.indexOf(err.code) !== -1) {
		return false;
	}

	return true;
};

var safeBuffer = createCommonjsModule(function (module, exports) {
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */

var Buffer = buffer$1.Buffer;

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key];
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer$1;
} else {
  // Copy properties from require('buffer')
  copyProps(buffer$1, exports);
  exports.Buffer = SafeBuffer;
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype);

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer);

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
};

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size);
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding);
    } else {
      buf.fill(fill);
    }
  } else {
    buf.fill(0);
  }
  return buf
};

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
};

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer$1.SlowBuffer(size)
};
});

var name = "got";
var version = "6.7.1";
var description = "Simplified HTTP requests";
var license = "MIT";
var repository = "sindresorhus/got";
var maintainers = [
	{
		name: "Sindre Sorhus",
		email: "sindresorhus@gmail.com",
		url: "sindresorhus.com"
	},
	{
		name: "Vsevolod Strukchinsky",
		email: "floatdrop@gmail.com",
		url: "github.com/floatdrop"
	}
];
var engines = {
	node: ">=4"
};
var browser = {
	"unzip-response": false
};
var scripts = {
	test: "xo && nyc ava",
	coveralls: "nyc report --reporter=text-lcov | coveralls"
};
var files = [
	"index.js"
];
var keywords = [
	"http",
	"https",
	"get",
	"got",
	"url",
	"uri",
	"request",
	"util",
	"utility",
	"simple",
	"curl",
	"wget",
	"fetch"
];
var dependencies = {
	"create-error-class": "^3.0.0",
	duplexer3: "^0.1.4",
	"get-stream": "^3.0.0",
	"is-redirect": "^1.0.0",
	"is-retry-allowed": "^1.0.0",
	"is-stream": "^1.0.0",
	"lowercase-keys": "^1.0.0",
	"safe-buffer": "^5.0.1",
	"timed-out": "^4.0.0",
	"unzip-response": "^2.0.1",
	"url-parse-lax": "^1.0.0"
};
var devDependencies = {
	ava: "^0.17.0",
	coveralls: "^2.11.4",
	"form-data": "^2.1.1",
	"get-port": "^2.0.0",
	"into-stream": "^3.0.0",
	nyc: "^10.0.0",
	pem: "^1.4.4",
	pify: "^2.3.0",
	tempfile: "^1.1.1",
	xo: "*"
};
var xo = {
	esnext: true
};
var ava = {
	concurrency: 4
};
var _package = {
	name: name,
	version: version,
	description: description,
	license: license,
	repository: repository,
	maintainers: maintainers,
	engines: engines,
	browser: browser,
	scripts: scripts,
	files: files,
	keywords: keywords,
	dependencies: dependencies,
	devDependencies: devDependencies,
	xo: xo,
	ava: ava
};

var _package$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  name: name,
  version: version,
  description: description,
  license: license,
  repository: repository,
  maintainers: maintainers,
  engines: engines,
  browser: browser,
  scripts: scripts,
  files: files,
  keywords: keywords,
  dependencies: dependencies,
  devDependencies: devDependencies,
  xo: xo,
  ava: ava,
  'default': _package
});

var pkg = getCjsExportFromNamespace(_package$1);

const PassThrough$2 = stream.PassThrough;












const Buffer$1 = safeBuffer.Buffer;


function requestAsEventEmitter(opts) {
	opts = opts || {};

	const ee = new events();
	const requestUrl = opts.href || url.resolve(url.format(opts), opts.path);
	let redirectCount = 0;
	let retryCount = 0;
	let redirectUrl;

	const get = opts => {
		const fn = opts.protocol === 'https:' ? https : http;

		const req = fn.request(opts, res => {
			const statusCode = res.statusCode;

			if (isRedirect(statusCode) && opts.followRedirect && 'location' in res.headers && (opts.method === 'GET' || opts.method === 'HEAD')) {
				res.resume();

				if (++redirectCount > 10) {
					ee.emit('error', new got.MaxRedirectsError(statusCode, opts), null, res);
					return;
				}

				const bufferString = Buffer$1.from(res.headers.location, 'binary').toString();

				redirectUrl = url.resolve(url.format(opts), bufferString);
				const redirectOpts = Object.assign({}, opts, url.parse(redirectUrl));

				ee.emit('redirect', res, redirectOpts);

				get(redirectOpts);

				return;
			}

			setImmediate(() => {
				const response = typeof unzipResponse === 'function' && req.method !== 'HEAD' ? unzipResponse(res) : res;
				response.url = redirectUrl || requestUrl;
				response.requestUrl = requestUrl;

				ee.emit('response', response);
			});
		});

		req.once('error', err => {
			const backoff = opts.retries(++retryCount, err);

			if (backoff) {
				setTimeout(get, backoff, opts);
				return;
			}

			ee.emit('error', new got.RequestError(err, opts));
		});

		if (opts.gotTimeout) {
			timedOut(req, opts.gotTimeout);
		}

		setImmediate(() => {
			ee.emit('request', req);
		});
	};

	get(opts);
	return ee;
}

function asPromise(opts) {
	return new Promise((resolve, reject) => {
		const ee = requestAsEventEmitter(opts);

		ee.on('request', req => {
			if (isStream_1(opts.body)) {
				opts.body.pipe(req);
				opts.body = undefined;
				return;
			}

			req.end(opts.body);
		});

		ee.on('response', res => {
			const stream = opts.encoding === null ? getStream_1.buffer(res) : getStream_1(res, opts);

			stream
				.catch(err => reject(new got.ReadError(err, opts)))
				.then(data => {
					const statusCode = res.statusCode;
					const limitStatusCode = opts.followRedirect ? 299 : 399;

					res.body = data;

					if (opts.json && res.body) {
						try {
							res.body = JSON.parse(res.body);
						} catch (e) {
							throw new got.ParseError(e, statusCode, opts, data);
						}
					}

					if (statusCode < 200 || statusCode > limitStatusCode) {
						throw new got.HTTPError(statusCode, opts);
					}

					resolve(res);
				})
				.catch(err => {
					Object.defineProperty(err, 'response', {value: res});
					reject(err);
				});
		});

		ee.on('error', reject);
	});
}

function asStream(opts) {
	const input = new PassThrough$2();
	const output = new PassThrough$2();
	const proxy = duplexer3(input, output);

	if (opts.json) {
		throw new Error('got can not be used as stream when options.json is used');
	}

	if (opts.body) {
		proxy.write = () => {
			throw new Error('got\'s stream is not writable when options.body is used');
		};
	}

	const ee = requestAsEventEmitter(opts);

	ee.on('request', req => {
		proxy.emit('request', req);

		if (isStream_1(opts.body)) {
			opts.body.pipe(req);
			return;
		}

		if (opts.body) {
			req.end(opts.body);
			return;
		}

		if (opts.method === 'POST' || opts.method === 'PUT' || opts.method === 'PATCH') {
			input.pipe(req);
			return;
		}

		req.end();
	});

	ee.on('response', res => {
		const statusCode = res.statusCode;

		res.pipe(output);

		if (statusCode < 200 || statusCode > 299) {
			proxy.emit('error', new got.HTTPError(statusCode, opts), null, res);
			return;
		}

		proxy.emit('response', res);
	});

	ee.on('redirect', proxy.emit.bind(proxy, 'redirect'));
	ee.on('error', proxy.emit.bind(proxy, 'error'));

	return proxy;
}

function normalizeArguments(url, opts) {
	if (typeof url !== 'string' && typeof url !== 'object') {
		throw new Error(`Parameter \`url\` must be a string or object, not ${typeof url}`);
	}

	if (typeof url === 'string') {
		url = url.replace(/^unix:/, 'http://$&');
		url = urlParseLax(url);

		if (url.auth) {
			throw new Error('Basic authentication must be done with auth option');
		}
	}

	opts = Object.assign(
		{
			protocol: 'http:',
			path: '',
			retries: 5
		},
		url,
		opts
	);

	opts.headers = Object.assign({
		'user-agent': `${pkg.name}/${pkg.version} (https://github.com/sindresorhus/got)`,
		'accept-encoding': 'gzip,deflate'
	}, lowercaseKeys(opts.headers));

	const query = opts.query;

	if (query) {
		if (typeof query !== 'string') {
			opts.query = querystring.stringify(query);
		}

		opts.path = `${opts.path.split('?')[0]}?${opts.query}`;
		delete opts.query;
	}

	if (opts.json && opts.headers.accept === undefined) {
		opts.headers.accept = 'application/json';
	}

	let body = opts.body;

	if (body) {
		if (typeof body !== 'string' && !(body !== null && typeof body === 'object')) {
			throw new Error('options.body must be a ReadableStream, string, Buffer or plain Object');
		}

		opts.method = opts.method || 'POST';

		if (isStream_1(body) && typeof body.getBoundary === 'function') {
			// Special case for https://github.com/form-data/form-data
			opts.headers['content-type'] = opts.headers['content-type'] || `multipart/form-data; boundary=${body.getBoundary()}`;
		} else if (body !== null && typeof body === 'object' && !Buffer$1.isBuffer(body) && !isStream_1(body)) {
			opts.headers['content-type'] = opts.headers['content-type'] || 'application/x-www-form-urlencoded';
			body = opts.body = querystring.stringify(body);
		}

		if (opts.headers['content-length'] === undefined && opts.headers['transfer-encoding'] === undefined && !isStream_1(body)) {
			const length = typeof body === 'string' ? Buffer$1.byteLength(body) : body.length;
			opts.headers['content-length'] = length;
		}
	}

	opts.method = (opts.method || 'GET').toUpperCase();

	if (opts.hostname === 'unix') {
		const matches = /(.+):(.+)/.exec(opts.path);

		if (matches) {
			opts.socketPath = matches[1];
			opts.path = matches[2];
			opts.host = null;
		}
	}

	if (typeof opts.retries !== 'function') {
		const retries = opts.retries;

		opts.retries = (iter, err) => {
			if (iter > retries || !isRetryAllowed(err)) {
				return 0;
			}

			const noise = Math.random() * 100;

			return ((1 << iter) * 1000) + noise;
		};
	}

	if (opts.followRedirect === undefined) {
		opts.followRedirect = true;
	}

	if (opts.timeout) {
		opts.gotTimeout = opts.timeout;
		delete opts.timeout;
	}

	return opts;
}

function got(url, opts) {
	try {
		return asPromise(normalizeArguments(url, opts));
	} catch (err) {
		return Promise.reject(err);
	}
}

const helpers = [
	'get',
	'post',
	'put',
	'patch',
	'head',
	'delete'
];

helpers.forEach(el => {
	got[el] = (url, opts) => got(url, Object.assign({}, opts, {method: el}));
});

got.stream = (url, opts) => asStream(normalizeArguments(url, opts));

for (const el of helpers) {
	got.stream[el] = (url, opts) => got.stream(url, Object.assign({}, opts, {method: el}));
}

function stdError(error, opts) {
	if (error.code !== undefined) {
		this.code = error.code;
	}

	Object.assign(this, {
		message: error.message,
		host: opts.host,
		hostname: opts.hostname,
		method: opts.method,
		path: opts.path
	});
}

got.RequestError = createErrorClass('RequestError', stdError);
got.ReadError = createErrorClass('ReadError', stdError);
got.ParseError = createErrorClass('ParseError', function (e, statusCode, opts, data) {
	stdError.call(this, e, opts);
	this.statusCode = statusCode;
	this.statusMessage = http.STATUS_CODES[this.statusCode];
	this.message = `${e.message} in "${url.format(opts)}": \n${data.slice(0, 77)}...`;
});

got.HTTPError = createErrorClass('HTTPError', function (statusCode, opts) {
	stdError.call(this, {}, opts);
	this.statusCode = statusCode;
	this.statusMessage = http.STATUS_CODES[this.statusCode];
	this.message = `Response code ${this.statusCode} (${this.statusMessage})`;
});

got.MaxRedirectsError = createErrorClass('MaxRedirectsError', function (statusCode, opts) {
	stdError.call(this, {}, opts);
	this.statusCode = statusCode;
	this.statusMessage = http.STATUS_CODES[this.statusCode];
	this.message = 'Redirected 10 times. Aborting.';
});
