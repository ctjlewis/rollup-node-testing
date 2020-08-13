import assert$7 from 'assert';
import util$6 from 'util';
import events from 'events';
import buffer from 'buffer';
import net from 'net';
import http from 'http';
import https from 'https';
import tty from 'tty';
import os from 'os';
import stream$3 from 'stream';
import zlib from 'zlib';
import tls from 'tls';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

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

function Queue () {
  this.head = new Item('head', null);
}
var queue = Queue;

Queue.prototype.append = function append (kind, value) {
  var item = new Item(kind, value);
  this.head.prepend(item);
  return item
};

Queue.prototype.isEmpty = function isEmpty () {
  return this.head.prev === this.head
};

Queue.prototype.first = function first () {
  return this.head.next
};

function Item (kind, value) {
  this.prev = this;
  this.next = this;
  this.kind = kind;
  this.value = value;
}

Item.prototype.prepend = function prepend (other) {
  other.prev = this.prev;
  other.next = this;
  other.prev.next = other;
  other.next.prev = other;
};

Item.prototype.dequeue = function dequeue () {
  var prev = this.prev;
  var next = this.next;

  prev.next = next;
  next.prev = prev;
  this.prev = this;
  this.next = this;

  return this.value
};

Item.prototype.isEmpty = function isEmpty () {
  return this.prev === this
};

var EventEmitter = events.EventEmitter;
var Buffer$1 = buffer.Buffer;



// Node.js version
var match = /^v(\d+)\.(\d+)\./.exec(process.version);
var version = match ? Number(match[1]) + Number('0.' + match[2]) : 11;
var onreadMode = version >= 11.1 ? 2 : 1;
var mode = 'modern';

var setNRead;
if (onreadMode === 2) {
  var sw = process.binding('stream_wrap');
  setNRead = function (nread) {
    sw.streamBaseState[sw.kReadBytesOrError] = nread;
  };
}

function Handle (stream, options) {
  EventEmitter.call(this);

  this._stream = stream;
  this._flowing = false;
  this._reading = false;
  this._options = options || {};

  this.onread = null;

  // Pending requests
  this.pending = new queue();
}
util$6.inherits(Handle, EventEmitter);
var handle = Handle;

Handle.mode = mode;

Handle.create = function create (stream, options) {
  return new Handle(stream, options)
};

Handle.prototype._onread = function _onread (nread, buffer) {
  if (onreadMode === 1) {
    this.onread(nread, buffer);
  } else {
    setNRead(nread);
    this.onread(buffer);
  }
};

Handle.prototype._queueReq = function _queueReq (type, req) {
  return this.pending.append(type, req)
};

Handle.prototype._pendingList = function _pendingList () {
  var list = [];
  while (!this.pending.isEmpty()) { list.push(this.pending.first().dequeue()); }
  return list
};

Handle.prototype.setStream = function setStream (stream) {
  assert$7(this._stream === null, 'Can\'t set stream two times');
  this._stream = stream;

  this.emit('stream', stream);
};

Handle.prototype.readStart = function readStart () {
  this._reading = true;

  if (!this._stream) {
    this.once('stream', this.readStart);
    return 0
  }

  if (!this._flowing) {
    this._flowing = true;
    this._flow();
  }

  this._stream.resume();
  return 0
};

Handle.prototype.readStop = function readStop () {
  this._reading = false;

  if (!this._stream) {
    this.once('stream', this.readStop);
    return 0
  }
  this._stream.pause();
  return 0
};

var uv = process.binding('uv');

Handle.prototype._flow = function flow () {
  var self = this;
  this._stream.on('data', function (chunk) {
    self._onread(chunk.length, chunk);
  });

  this._stream.on('end', function () {
    self._onread(uv.UV_EOF, Buffer$1.alloc(0));
  });

  this._stream.on('close', function () {
    setImmediate(function () {
      if (self._reading) {
        self._onread(uv.UV_ECONNRESET, Buffer$1.alloc(0));
      }
    });
  });
};

Handle.prototype._close = function _close () {
  var list = this._pendingList();

  var self = this;
  setImmediate(function () {
    for (var i = 0; i < list.length; i++) {
      var req = list[i];
      req.oncomplete(uv.UV_ECANCELED, self, req);
    }
  });

  this.readStop();
};

Handle.prototype.shutdown = function shutdown (req) {
  var wrap = this._queueReq('shutdown', req);

  if (!this._stream) {
    this.once('stream', function () {
      this._shutdown(wrap);
    });
    return 0
  }

  return this._shutdown(wrap)
};

Handle.prototype._shutdown = function _shutdown (wrap) {
  var self = this;
  this._stream.end(function () {
    var req = wrap.dequeue();
    if (!req) { return }

    req.oncomplete(0, self, req);
  });
  return 0
};

Handle.prototype.close = function close (callback) {
  this._close();

  if (!this._stream) {
    this.once('stream', function () {
      this.close(callback);
    });
    return 0
  }

  if (this._options.close) {
    this._options.close(callback);
  } else {
    process.nextTick(callback);
  }

  return 0
};

Handle.prototype.writeEnc = function writeEnc (req, data, enc) {
  var wrap = this._queueReq('write', req);

  if (!this._stream) {
    this.once('stream', function () {
      this._writeEnc(wrap, req, data, enc);
    });

    return 0
  }

  return this._writeEnc(wrap, req, data, enc)
};

Handle.prototype._writeEnc = function _writeEnc (wrap, req, data, enc) {
  var self = this;

  req.async = true;
  req.bytes = data.length;

  if (wrap.isEmpty()) {
    return 0
  }

  this._stream.write(data, enc, function () {
    var req = wrap.dequeue();
    if (!req) { return }
    req.oncomplete(0, self, req);
  });

  return 0
};

/**
 * @param {WriteWrap} req
 * @param {string[]} chunks
 * @param {Boolean} allBuffers
 */
Handle.prototype.writev = function _writev (req, chunks, allBuffers) {
  while (chunks.length > 0) {
    this._stream.write(chunks.shift(), chunks.shift());
  }
  return 0
};

Handle.prototype.writeBuffer = function writeBuffer (req, data) {
  return this.writeEnc(req, data, null)
};

Handle.prototype.writeAsciiString = function writeAsciiString (req, data) {
  return this.writeEnc(req, data, 'ascii')
};

Handle.prototype.writeUtf8String = function writeUtf8String (req, data) {
  return this.writeEnc(req, data, 'utf8')
};

Handle.prototype.writeUcs2String = function writeUcs2String (req, data) {
  return this.writeEnc(req, data, 'ucs2')
};

Handle.prototype.writeBinaryString = function writeBinaryString (req, data) {
  return this.writeEnc(req, data, 'binary')
};

Handle.prototype.writeLatin1String = function writeLatin1String (req, data) {
  return this.writeEnc(req, data, 'binary')
};

// v0.8
Handle.prototype.getsockname = function getsockname () {
  if (this._options.getPeerName) {
    return this._options.getPeerName()
  }
  return null
};

Handle.prototype.getpeername = function getpeername (out) {
  var res = this.getsockname();
  if (!res) { return -1 }

  Object.keys(res).forEach(function (key) {
    out[key] = res[key];
  });

  return 0
};

var Buffer$2 = buffer.Buffer;

// Node.js version
var mode$1 = /^v0\.8\./.test(process.version) ? 'rusty' :
           /^v0\.(9|10)\./.test(process.version) ? 'old' :
           /^v0\.12\./.test(process.version) ? 'normal' :
           'modern';

var HTTPParser;

var methods;
var reverseMethods;

var kOnHeaders;
var kOnHeadersComplete;
var kOnMessageComplete;
var kOnBody;
if (mode$1 === 'normal' || mode$1 === 'modern') {
  HTTPParser = process.binding('http_parser').HTTPParser;
  methods = HTTPParser.methods;

  // v6
  if (!methods)
    methods = process.binding('http_parser').methods;

  reverseMethods = {};

  methods.forEach(function(method, index) {
    reverseMethods[method] = index;
  });

  kOnHeaders = HTTPParser.kOnHeaders | 0;
  kOnHeadersComplete = HTTPParser.kOnHeadersComplete | 0;
  kOnMessageComplete = HTTPParser.kOnMessageComplete | 0;
  kOnBody = HTTPParser.kOnBody | 0;
} else {
  kOnHeaders = 'onHeaders';
  kOnHeadersComplete = 'onHeadersComplete';
  kOnMessageComplete = 'onMessageComplete';
  kOnBody = 'onBody';
}

function Deceiver(socket, options) {
  this.socket = socket;
  this.options = options || {};
  this.isClient = this.options.isClient;
}
var deceiver = Deceiver;

Deceiver.create = function create(stream, options) {
  return new Deceiver(stream, options);
};

Deceiver.prototype._toHeaderList = function _toHeaderList(object) {
  var out = [];
  var keys = Object.keys(object);

  for (var i = 0; i < keys.length; i++)
    out.push(keys[i], object[keys[i]]);

  return out;
};

Deceiver.prototype._isUpgrade = function _isUpgrade(request) {
  return request.method === 'CONNECT' ||
         request.headers.upgrade ||
         request.headers.connection &&
            /(^|\W)upgrade(\W|$)/i.test(request.headers.connection);
};

// TODO(indutny): support CONNECT
if (mode$1 === 'modern') {
  /*
  function parserOnHeadersComplete(versionMajor, versionMinor, headers, method,
                                   url, statusCode, statusMessage, upgrade,
                                   shouldKeepAlive) {
   */
  Deceiver.prototype.emitRequest = function emitRequest(request) {
    var parser = this.socket.parser;
    assert$7(parser, 'No parser present');

    parser.execute = null;

    var self = this;
    var method = reverseMethods[request.method];
    parser.execute = function execute() {
      self._skipExecute(this);
      this[kOnHeadersComplete](1,
                               1,
                               self._toHeaderList(request.headers),
                               method,
                               request.path,
                               0,
                               '',
                               self._isUpgrade(request),
                               true);
      return 0;
    };

    this._emitEmpty();
  };

  Deceiver.prototype.emitResponse = function emitResponse(response) {
    var parser = this.socket.parser;
    assert$7(parser, 'No parser present');

    parser.execute = null;

    var self = this;
    parser.execute = function execute() {
      self._skipExecute(this);
      this[kOnHeadersComplete](1,
                               1,
                               self._toHeaderList(response.headers),
                               response.path,
                               response.code,
                               response.status,
                               response.reason || '',
                               self._isUpgrade(response),
                               true);
      return 0;
    };

    this._emitEmpty();
  };
} else {
  /*
    `function parserOnHeadersComplete(info) {`

    info = { .versionMajor, .versionMinor, .url, .headers, .method,
             .statusCode, .statusMessage, .upgrade, .shouldKeepAlive }
   */
  Deceiver.prototype.emitRequest = function emitRequest(request) {
    var parser = this.socket.parser;
    assert$7(parser, 'No parser present');

    var method = request.method;
    if (reverseMethods)
      method = reverseMethods[method];

    var info = {
      versionMajor: 1,
      versionMinor: 1,
      url: request.path,
      headers: this._toHeaderList(request.headers),
      method: method,
      statusCode: 0,
      statusMessage: '',
      upgrade: this._isUpgrade(request),
      shouldKeepAlive: true
    };

    var self = this;
    parser.execute = function execute() {
      self._skipExecute(this);
      this[kOnHeadersComplete](info);
      return 0;
    };

    this._emitEmpty();
  };

  Deceiver.prototype.emitResponse = function emitResponse(response) {
    var parser = this.socket.parser;
    assert$7(parser, 'No parser present');

    var info = {
      versionMajor: 1,
      versionMinor: 1,
      url: response.path,
      headers: this._toHeaderList(response.headers),
      method: false,
      statusCode: response.status,
      statusMessage: response.reason || '',
      upgrade: this._isUpgrade(response),
      shouldKeepAlive: true
    };

    var self = this;
    parser.execute = function execute() {
      self._skipExecute(this);
      this[kOnHeadersComplete](info);
      return 0;
    };

    this._emitEmpty();
  };
}

Deceiver.prototype._skipExecute = function _skipExecute(parser) {
  var self = this;
  var oldExecute = parser.constructor.prototype.execute;
  var oldFinish = parser.constructor.prototype.finish;

  parser.execute = null;
  parser.finish = null;

  parser.execute = function execute(buffer, start, len) {
    // Parser reuse
    if (this.socket !== self.socket) {
      this.execute = oldExecute;
      this.finish = oldFinish;
      return this.execute(buffer, start, len);
    }

    if (start !== undefined)
      buffer = buffer.slice(start, start + len);
    self.emitBody(buffer);
    return len;
  };

  parser.finish = function finish() {
    // Parser reuse
    if (this.socket !== self.socket) {
      this.execute = oldExecute;
      this.finish = oldFinish;
      return this.finish();
    }

    this.execute = oldExecute;
    this.finish = oldFinish;
    self.emitMessageComplete();
  };
};

Deceiver.prototype.emitBody = function emitBody(buffer) {
  var parser = this.socket.parser;
  assert$7(parser, 'No parser present');

  parser[kOnBody](buffer, 0, buffer.length);
};

Deceiver.prototype._emitEmpty = function _emitEmpty() {
  // Emit data to force out handling of UPGRADE
  var empty = new Buffer$2(0);
  if (this.socket.ondata)
    this.socket.ondata(empty, 0, 0);
  else
    this.socket.emit('data', empty);
};

Deceiver.prototype.emitMessageComplete = function emitMessageComplete() {
  var parser = this.socket.parser;
  assert$7(parser, 'No parser present');

  parser[kOnMessageComplete]();
};

function Handle$1 (options, stream, socket) {
  var state = {};
  this._spdyState = state;

  state.options = options || {};

  state.stream = stream;
  state.socket = null;
  state.rawSocket = socket || stream.connection.socket;
  state.deceiver = null;
  state.ending = false;

  var self = this;
  handle.call(this, stream, {
    getPeerName: function () {
      return self._getPeerName()
    },
    close: function (callback) {
      return self._closeCallback(callback)
    }
  });

  if (!state.stream) {
    this.on('stream', function (stream) {
      state.stream = stream;
    });
  }
}
util$6.inherits(Handle$1, handle);
var handle$1 = Handle$1;

Handle$1.create = function create (options, stream, socket) {
  return new Handle$1(options, stream, socket)
};

Handle$1.prototype._getPeerName = function _getPeerName () {
  var state = this._spdyState;

  if (state.rawSocket._getpeername) {
    return state.rawSocket._getpeername()
  }

  return null
};

Handle$1.prototype._closeCallback = function _closeCallback (callback) {
  var state = this._spdyState;
  var stream = state.stream;

  if (state.ending) {
    // The .end() method of the stream may be called by us or by the
    // .shutdown() method in our super-class. If the latter has already been
    // called, then calling the .end() method below will have no effect, with
    // the result that the callback will never get executed, leading to an ever
    // so subtle memory leak.
    if (stream._writableState.finished) {
      // NOTE: it is important to call `setImmediate` instead of `nextTick`,
      // since this is how regular `handle.close()` works in node.js core.
      //
      // Using `nextTick` will lead to `net.Socket` emitting `close` before
      // `end` on UV_EOF. This results in aborted request without `end` event.
      setImmediate(callback);
    } else if (stream._writableState.ending) {
      stream.once('finish', function () {
        callback(null);
      });
    } else {
      stream.end(callback);
    }
  } else {
    stream.abort(callback);
  }

  // Only a single end is allowed
  state.ending = false;
};

Handle$1.prototype.getStream = function getStream (callback) {
  var state = this._spdyState;

  if (!callback) {
    assert$7(state.stream);
    return state.stream
  }

  if (state.stream) {
    process.nextTick(function () {
      callback(state.stream);
    });
    return
  }

  this.on('stream', callback);
};

Handle$1.prototype.assignSocket = function assignSocket (socket, options) {
  var state = this._spdyState;

  state.socket = socket;
  state.deceiver = deceiver.create(socket, options);

  function onStreamError (err) {
    state.socket.emit('error', err);
  }

  this.getStream(function (stream) {
    stream.on('error', onStreamError);
  });
};

Handle$1.prototype.assignClientRequest = function assignClientRequest (req) {
  var state = this._spdyState;
  var oldEnd = req.end;
  var oldSend = req._send;

  // Catch the headers before request will be sent
  var self = this;

  // For old nodes
  if (handle.mode !== 'modern') {
    req.end = function end () {
      this.end = oldEnd;

      this._send('');

      return this.end.apply(this, arguments)
    };
  }

  req._send = function send (data) {
    this._headerSent = true;

    // for v0.10 and below, otherwise it will set `hot = false` and include
    // headers in first write
    this._header = 'ignore me';

    // To prevent exception
    this.connection = state.socket;

    // It is very important to leave this here, otherwise it will be executed
    // on a next tick, after `_send` will perform write
    self.getStream(function (stream) {
      if (!stream.connection._isGoaway(stream.id)) {
        stream.send();
      }
    });

    // We are ready to create stream
    self.emit('needStream');

    // Ensure that the connection is still ok to use
    if (state.stream && state.stream.connection._isGoaway(state.stream.id)) {
      return
    }

    req._send = oldSend;

    // Ignore empty writes
    if (req.method === 'GET' && data.length === 0) {
      return
    }

    return req._send.apply(this, arguments)
  };

  // No chunked encoding
  req.useChunkedEncodingByDefault = false;

  req.on('finish', function () {
    req.socket.end();
  });
};

Handle$1.prototype.assignRequest = function assignRequest (req) {
  // Emit trailing headers
  this.getStream(function (stream) {
    stream.on('headers', function (headers) {
      req.emit('trailers', headers);
    });
  });
};

Handle$1.prototype.assignResponse = function assignResponse (res) {
  var self = this;

  res.addTrailers = function addTrailers (headers) {
    self.getStream(function (stream) {
      stream.sendHeaders(headers);
    });
  };
};

Handle$1.prototype._transformHeaders = function _transformHeaders (kind, headers) {
  var state = this._spdyState;

  var res = {};
  var keys = Object.keys(headers);

  if (kind === 'request' && state.options['x-forwarded-for']) {
    var xforwarded = state.stream.connection.getXForwardedFor();
    if (xforwarded !== null) {
      res['x-forwarded-for'] = xforwarded;
    }
  }

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = headers[key];

    if (key === ':authority') {
      res.host = value;
    }
    if (/^:/.test(key)) {
      continue
    }

    res[key] = value;
  }
  return res
};

Handle$1.prototype.emitRequest = function emitRequest () {
  var state = this._spdyState;
  var stream = state.stream;

  state.deceiver.emitRequest({
    method: stream.method,
    path: stream.path,
    headers: this._transformHeaders('request', stream.headers)
  });
};

Handle$1.prototype.emitResponse = function emitResponse (status, headers) {
  var state = this._spdyState;

  state.deceiver.emitResponse({
    status: status,
    headers: this._transformHeaders('response', headers)
  });
};

function attachPush (req) {
  var handle = req.socket._handle;

  handle.getStream(function (stream) {
    stream.on('pushPromise', function (push) {
      req.emit('push', push);
    });
  });
}

var onNewListener = function onNewListener (type) {
  var req = this;

  if (type !== 'push') {
    return
  }

  // Not first listener
  if (req.listeners('push').length !== 0) {
    return
  }

  if (!req.socket) {
    req.on('socket', function () {
      attachPush(req);
    });
    return
  }

  attachPush(req);
};

var request = {
	onNewListener: onNewListener
};

// NOTE: Mostly copy paste from node
var writeHead = function writeHead (statusCode, reason, obj) {
  var headers;

  if (typeof reason === 'string') {
    // writeHead(statusCode, reasonPhrase[, headers])
    this.statusMessage = reason;
  } else {
    // writeHead(statusCode[, headers])
    this.statusMessage =
      this.statusMessage || 'unknown';
    obj = reason;
  }
  this.statusCode = statusCode;

  if (this._headers) {
    // Slow-case: when progressive API and header fields are passed.
    if (obj) {
      var keys = Object.keys(obj);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (k) this.setHeader(k, obj[k]);
      }
    }
    // only progressive api is used
    headers = this._renderHeaders();
  } else {
    // only writeHead() called
    headers = obj;
  }

  if (statusCode === 204 || statusCode === 304 ||
      (statusCode >= 100 && statusCode <= 199)) {
    // RFC 2616, 10.2.5:
    // The 204 response MUST NOT include a message-body, and thus is always
    // terminated by the first empty line after the header fields.
    // RFC 2616, 10.3.5:
    // The 304 response MUST NOT contain a message-body, and thus is always
    // terminated by the first empty line after the header fields.
    // RFC 2616, 10.1 Informational 1xx:
    // This class of status code indicates a provisional response,
    // consisting only of the Status-Line and optional headers, and is
    // terminated by an empty line.
    this._hasBody = false;
  }

  // don't keep alive connections where the client expects 100 Continue
  // but we sent a final status; they may put extra bytes on the wire.
  if (this._expect_continue && !this._sent100) {
    this.shouldKeepAlive = false;
  }

  // Implicit headers sent!
  this._header = true;
  this._headerSent = true;

  if (this.socket._handle) { this.socket._handle._spdyState.stream.respond(this.statusCode, headers); }
};

var end = function end (data, encoding, callback) {
  if (!this._headerSent) {
    this.writeHead(this.statusCode);
  }

  if (!this.socket._handle) {
    return
  }

  // Compatibility with Node.js core
  this.finished = true;

  var self = this;
  var handle = this.socket._handle;
  handle._spdyState.ending = true;
  this.socket.end(data, encoding, function () {
    self.constructor.prototype.end.call(self, '', 'utf8', callback);
  });
};

var push = function push (path, headers, callback) {
  var frame = {
    path: path,
    method: headers.method ? headers.method.toString() : 'GET',
    status: headers.status ? parseInt(headers.status, 10) : 200,
    host: this._req.headers.host,
    headers: headers.request,
    response: headers.response
  };

  var stream = this.spdyStream;
  return stream.pushPromise(frame, callback)
};

var writeContinue = function writeContinue (callback) {
  if (this.socket._handle) {
    this.socket._handle._spdyState.stream.respond(100, {}, callback);
  }
};

var response = {
	writeHead: writeHead,
	end: end,
	push: push,
	writeContinue: writeContinue
};

function Socket (parent, options) {
  net.Socket.call(this, options);

  var state = {};

  this._spdyState = state;

  state.parent = parent;

  this.servername = parent.servername;
  this.npnProtocol = parent.npnProtocol;
  this.alpnProtocol = parent.alpnProtocol;
  this.authorized = parent.authorized;
  this.authorizationError = parent.authorizationError;
  this.encrypted = true;
  this.allowHalfOpen = true;
}

util$6.inherits(Socket, net.Socket);

var socket = Socket;

var methods$1 = [
  'renegotiate', 'setMaxSendFragment', 'getTLSTicket', 'setServername',
  'setSession', 'getPeerCertificate', 'getSession', 'isSessionReused',
  'getCipher', 'getEphemeralKeyInfo'
];

methods$1.forEach(function (method) {
  Socket.prototype[method] = function methodWrap () {
    var parent = this._spdyState.parent;
    return parent[method].apply(parent, arguments)
  };
});

// Only Node.JS has a process variable that is of [[Class]] process
var detectNode = Object.prototype.toString.call(typeof process !== 'undefined' ? process : 0) === '[object process]';

// Node.js 0.8, 0.10 and 0.12 support
Object.assign = (process.versions.modules >= 46 || !detectNode)
  ? Object.assign // eslint-disable-next-line
  : util$6._extend;

function QueueItem () {
  this.prev = null;
  this.next = null;
}
var QueueItem_1 = QueueItem;

function Queue$1 () {
  QueueItem.call(this);

  this.prev = this;
  this.next = this;
}
util$6.inherits(Queue$1, QueueItem);
var Queue_1 = Queue$1;

Queue$1.prototype.insertTail = function insertTail (item) {
  item.prev = this.prev;
  item.next = this;
  item.prev.next = item;
  item.next.prev = item;
};

Queue$1.prototype.remove = function remove (item) {
  var next = item.next;
  var prev = item.prev;

  item.next = item;
  item.prev = item;
  next.prev = prev;
  prev.next = next;
};

Queue$1.prototype.head = function head () {
  return this.next
};

Queue$1.prototype.tail = function tail () {
  return this.prev
};

Queue$1.prototype.isEmpty = function isEmpty () {
  return this.next === this
};

Queue$1.prototype.isRoot = function isRoot (item) {
  return this === item
};

function LockStream (stream) {
  this.locked = false;
  this.queue = [];
  this.stream = stream;
}
var LockStream_1 = LockStream;

LockStream.prototype.write = function write (chunks, callback) {
  var self = this;

  // Do not let it interleave
  if (this.locked) {
    this.queue.push(function () {
      return self.write(chunks, callback)
    });
    return
  }

  this.locked = true;

  function done (err, chunks) {
    self.stream.removeListener('error', done);

    self.locked = false;
    if (self.queue.length > 0) { self.queue.shift()(); }
    callback(err, chunks);
  }

  this.stream.on('error', done);

  // Accumulate all output data
  var output = [];
  function onData (chunk) {
    output.push(chunk);
  }
  this.stream.on('data', onData);

  function next (err) {
    self.stream.removeListener('data', onData);
    if (err) {
      return done(err)
    }

    done(null, output);
  }

  for (var i = 0; i < chunks.length - 1; i++) { this.stream.write(chunks[i]); }

  if (chunks.length > 0) {
    this.stream.write(chunks[i], next);
  } else { process.nextTick(next); }

  if (this.stream.execute) {
    this.stream.execute(function (err) {
      if (err) { return done(err) }
    });
  }
};

// Just finds the place in array to insert
function binaryLookup (list, item, compare) {
  var start = 0;
  var end = list.length;

  while (start < end) {
    var pos = (start + end) >> 1;
    var cmp = compare(item, list[pos]);

    if (cmp === 0) {
      start = pos;
      end = pos;
      break
    } else if (cmp < 0) {
      end = pos;
    } else {
      start = pos + 1;
    }
  }

  return start
}
var binaryLookup_1 = binaryLookup;

function binaryInsert (list, item, compare) {
  var index = binaryLookup(list, item, compare);

  list.splice(index, 0, item);
}
var binaryInsert_1 = binaryInsert;

function binarySearch (list, item, compare) {
  var index = binaryLookup(list, item, compare);

  if (index >= list.length) {
    return -1
  }

  if (compare(item, list[index]) === 0) {
    return index
  }

  return -1
}
var binarySearch_1 = binarySearch;

function Timeout (object) {
  this.delay = 0;
  this.timer = null;
  this.object = object;
}
var Timeout_1 = Timeout;

Timeout.prototype.set = function set (delay, callback) {
  this.delay = delay;
  this.reset();
  if (!callback) { return }

  if (this.delay === 0) {
    this.object.removeListener('timeout', callback);
  } else {
    this.object.once('timeout', callback);
  }
};

Timeout.prototype.reset = function reset () {
  if (this.timer !== null) {
    clearTimeout(this.timer);
    this.timer = null;
  }

  if (this.delay === 0) { return }

  var self = this;
  this.timer = setTimeout(function () {
    self.timer = null;
    self.object.emit('timeout');
  }, this.delay);
};

var utils = {
	QueueItem: QueueItem_1,
	Queue: Queue_1,
	LockStream: LockStream_1,
	binaryLookup: binaryLookup_1,
	binaryInsert: binaryInsert_1,
	binarySearch: binarySearch_1,
	Timeout: Timeout_1
};

var utils_1 = createCommonjsModule(function (module, exports) {

var utils = exports;



function ProtocolError (code, message) {
  this.code = code;
  this.message = message;
}
util$6.inherits(ProtocolError, Error);
utils.ProtocolError = ProtocolError;

utils.error = function error (code, message) {
  return new ProtocolError(code, message)
};

utils.reverse = function reverse (object) {
  var result = [];

  Object.keys(object).forEach(function (key) {
    result[object[key] | 0] = key;
  });

  return result
};

// weight [1, 36] <=> priority [0, 7]
// This way weight=16 is preserved and has priority=3
utils.weightToPriority = function weightToPriority (weight) {
  return ((Math.min(35, (weight - 1)) / 35) * 7) | 0
};

utils.priorityToWeight = function priorityToWeight (priority) {
  return (((priority / 7) * 35) | 0) + 1
};

// Copy-Paste from node
exports.addHeaderLine = function addHeaderLine (field, value, dest) {
  field = field.toLowerCase();
  if (/^:/.test(field)) {
    dest[field] = value;
    return
  }

  switch (field) {
    // Array headers:
    case 'set-cookie':
      if (dest[field] !== undefined) {
        dest[field].push(value);
      } else {
        dest[field] = [ value ];
      }
      break

    /* eslint-disable max-len */
    // list is taken from:
    /* eslint-enable max-len */
    case 'content-type':
    case 'content-length':
    case 'user-agent':
    case 'referer':
    case 'host':
    case 'authorization':
    case 'proxy-authorization':
    case 'if-modified-since':
    case 'if-unmodified-since':
    case 'from':
    case 'location':
    case 'max-forwards':
      // drop duplicates
      if (dest[field] === undefined) {
        dest[field] = value;
      }
      break

    case 'cookie':
      // make semicolon-separated list
      if (dest[field] !== undefined) {
        dest[field] += '; ' + value;
      } else {
        dest[field] = value;
      }
      break

    default:
      // make comma-separated list
      if (dest[field] !== undefined) {
        dest[field] += ', ' + value;
      } else {
        dest[field] = value;
      }
  }
};
});

var DEFAULT_METHOD = 'GET';
var DEFAULT_HOST = 'localhost';
var MAX_PRIORITY_STREAMS = 100;
var DEFAULT_MAX_CHUNK = 8 * 1024;

var constants = {
	DEFAULT_METHOD: DEFAULT_METHOD,
	DEFAULT_HOST: DEFAULT_HOST,
	MAX_PRIORITY_STREAMS: MAX_PRIORITY_STREAMS,
	DEFAULT_MAX_CHUNK: DEFAULT_MAX_CHUNK
};

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

var ms = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = ms;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* Active `debug` instances.
	*/
	createDebug.instances = [];

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return match;
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.enabled = createDebug.enabled(namespace);
		debug.useColors = createDebug.useColors();
		debug.color = selectColor(namespace);
		debug.destroy = destroy;
		debug.extend = extend;
		// Debug.formatArgs = formatArgs;
		// debug.rawLog = rawLog;

		// env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		createDebug.instances.push(debug);

		return debug;
	}

	function destroy() {
		const index = createDebug.instances.indexOf(this);
		if (index !== -1) {
			createDebug.instances.splice(index, 1);
			return true;
		}
		return false;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);

		createDebug.names = [];
		createDebug.skips = [];

		let i;
		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
		const len = split.length;

		for (i = 0; i < len; i++) {
			if (!split[i]) {
				// ignore empty strings
				continue;
			}

			namespaces = split[i].replace(/\*/g, '.*?');

			if (namespaces[0] === '-') {
				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
			} else {
				createDebug.names.push(new RegExp('^' + namespaces + '$'));
			}
		}

		for (i = 0; i < createDebug.instances.length; i++) {
			const instance = createDebug.instances[i];
			instance.enabled = createDebug.enabled(instance.namespace);
		}
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names.map(toNamespace),
			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		if (name[name.length - 1] === '*') {
			return true;
		}

		let i;
		let len;

		for (i = 0, len = createDebug.skips.length; i < len; i++) {
			if (createDebug.skips[i].test(name)) {
				return false;
			}
		}

		for (i = 0, len = createDebug.names.length; i < len; i++) {
			if (createDebug.names[i].test(name)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Convert regexp to namespace
	*
	* @param {RegExp} regxep
	* @return {String} namespace
	* @api private
	*/
	function toNamespace(regexp) {
		return regexp.toString()
			.substring(2, regexp.toString().length - 2)
			.replace(/\.\*\?$/, '*');
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

var common = setup;

var browser = createCommonjsModule(function (module, exports) {
/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */
function log(...args) {
	// This hackery is required for IE8/9, where
	// the `console.log` function doesn't have 'apply'
	return typeof console === 'object' &&
		console.log &&
		console.log(...args);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug');
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = process.env.DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = common(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};
});

var hasFlag = (flag, argv = process.argv) => {
	const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf('--');
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};

const {env} = process;

let forceColor;
if (hasFlag('no-color') ||
	hasFlag('no-colors') ||
	hasFlag('color=false') ||
	hasFlag('color=never')) {
	forceColor = 0;
} else if (hasFlag('color') ||
	hasFlag('colors') ||
	hasFlag('color=true') ||
	hasFlag('color=always')) {
	forceColor = 1;
}

if ('FORCE_COLOR' in env) {
	if (env.FORCE_COLOR === 'true') {
		forceColor = 1;
	} else if (env.FORCE_COLOR === 'false') {
		forceColor = 0;
	} else {
		forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
	}
}

function translateLevel(level) {
	if (level === 0) {
		return false;
	}

	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}

function supportsColor(haveStream, streamIsTTY) {
	if (forceColor === 0) {
		return 0;
	}

	if (hasFlag('color=16m') ||
		hasFlag('color=full') ||
		hasFlag('color=truecolor')) {
		return 3;
	}

	if (hasFlag('color=256')) {
		return 2;
	}

	if (haveStream && !streamIsTTY && forceColor === undefined) {
		return 0;
	}

	const min = forceColor || 0;

	if (env.TERM === 'dumb') {
		return min;
	}

	if (process.platform === 'win32') {
		// Windows 10 build 10586 is the first Windows release that supports 256 colors.
		// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
		const osRelease = os.release().split('.');
		if (
			Number(osRelease[0]) >= 10 &&
			Number(osRelease[2]) >= 10586
		) {
			return Number(osRelease[2]) >= 14931 ? 3 : 2;
		}

		return 1;
	}

	if ('CI' in env) {
		if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
			return 1;
		}

		return min;
	}

	if ('TEAMCITY_VERSION' in env) {
		return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	}

	if ('GITHUB_ACTIONS' in env) {
		return 1;
	}

	if (env.COLORTERM === 'truecolor') {
		return 3;
	}

	if ('TERM_PROGRAM' in env) {
		const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

		switch (env.TERM_PROGRAM) {
			case 'iTerm.app':
				return version >= 3 ? 3 : 2;
			case 'Apple_Terminal':
				return 2;
			// No default
		}
	}

	if (/-256(color)?$/i.test(env.TERM)) {
		return 2;
	}

	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
		return 1;
	}

	if ('COLORTERM' in env) {
		return 1;
	}

	return min;
}

function getSupportLevel(stream) {
	const level = supportsColor(stream, stream && stream.isTTY);
	return translateLevel(level);
}

var supportsColor_1 = {
	supportsColor: getSupportLevel,
	stdout: translateLevel(supportsColor(true, tty.isatty(1))),
	stderr: translateLevel(supportsColor(true, tty.isatty(2)))
};

var node = createCommonjsModule(function (module, exports) {
/**
 * Module dependencies.
 */




/**
 * This is the Node.js implementation of `debug()`.
 */

exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

try {
	// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
	// eslint-disable-next-line import/no-extraneous-dependencies
	const supportsColor = supportsColor_1;

	if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
		exports.colors = [
			20,
			21,
			26,
			27,
			32,
			33,
			38,
			39,
			40,
			41,
			42,
			43,
			44,
			45,
			56,
			57,
			62,
			63,
			68,
			69,
			74,
			75,
			76,
			77,
			78,
			79,
			80,
			81,
			92,
			93,
			98,
			99,
			112,
			113,
			128,
			129,
			134,
			135,
			148,
			149,
			160,
			161,
			162,
			163,
			164,
			165,
			166,
			167,
			168,
			169,
			170,
			171,
			172,
			173,
			178,
			179,
			184,
			185,
			196,
			197,
			198,
			199,
			200,
			201,
			202,
			203,
			204,
			205,
			206,
			207,
			208,
			209,
			214,
			215,
			220,
			221
		];
	}
} catch (error) {
	// Swallow - we only care if `supports-color` is available; it doesn't have to be.
}

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(key => {
	return /^debug_/i.test(key);
}).reduce((obj, key) => {
	// Camel-case
	const prop = key
		.substring(6)
		.toLowerCase()
		.replace(/_([a-z])/g, (_, k) => {
			return k.toUpperCase();
		});

	// Coerce string value into JS value
	let val = process.env[key];
	if (/^(yes|on|true|enabled)$/i.test(val)) {
		val = true;
	} else if (/^(no|off|false|disabled)$/i.test(val)) {
		val = false;
	} else if (val === 'null') {
		val = null;
	} else {
		val = Number(val);
	}

	obj[prop] = val;
	return obj;
}, {});

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
	return 'colors' in exports.inspectOpts ?
		Boolean(exports.inspectOpts.colors) :
		tty.isatty(process.stderr.fd);
}

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	const {namespace: name, useColors} = this;

	if (useColors) {
		const c = this.color;
		const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
		const prefix = `  ${colorCode};1m${name} \u001B[0m`;

		args[0] = prefix + args[0].split('\n').join('\n' + prefix);
		args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
	} else {
		args[0] = getDate() + name + ' ' + args[0];
	}
}

function getDate() {
	if (exports.inspectOpts.hideDate) {
		return '';
	}
	return new Date().toISOString() + ' ';
}

/**
 * Invokes `util.format()` with the specified arguments and writes to stderr.
 */

function log(...args) {
	return process.stderr.write(util$6.format(...args) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	if (namespaces) {
		process.env.DEBUG = namespaces;
	} else {
		// If you set a process.env field to null or undefined, it gets cast to the
		// string 'null' or 'undefined'. Just delete instead.
		delete process.env.DEBUG;
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
	return process.env.DEBUG;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init(debug) {
	debug.inspectOpts = {};

	const keys = Object.keys(exports.inspectOpts);
	for (let i = 0; i < keys.length; i++) {
		debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
	}
}

module.exports = common(exports);

const {formatters} = module.exports;

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

formatters.o = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util$6.inspect(v, this.inspectOpts)
		.replace(/\s*\n\s*/g, ' ');
};

/**
 * Map %O to `util.inspect()`, allowing multiple lines if needed.
 */

formatters.O = function (v) {
	this.inspectOpts.colors = this.useColors;
	return util$6.inspect(v, this.inspectOpts);
};
});

var src = createCommonjsModule(function (module) {
/**
 * Detect Electron renderer / nwjs process, which is node, but we should
 * treat as a browser.
 */

if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
	module.exports = browser;
} else {
	module.exports = node;
}
});

var stream = stream$3;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Buffer$3 = buffer.Buffer;

var inspect = util$6.inspect;

var custom = inspect && inspect.custom || 'inspect';

function copyBuffer(src, target, offset) {
  Buffer$3.prototype.copy.call(src, target, offset);
}

var buffer_list =
/*#__PURE__*/
function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  _createClass(BufferList, [{
    key: "push",
    value: function push(v) {
      var entry = {
        data: v,
        next: null
      };
      if (this.length > 0) this.tail.next = entry;else this.head = entry;
      this.tail = entry;
      ++this.length;
    }
  }, {
    key: "unshift",
    value: function unshift(v) {
      var entry = {
        data: v,
        next: this.head
      };
      if (this.length === 0) this.tail = entry;
      this.head = entry;
      ++this.length;
    }
  }, {
    key: "shift",
    value: function shift() {
      if (this.length === 0) return;
      var ret = this.head.data;
      if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
      --this.length;
      return ret;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.head = this.tail = null;
      this.length = 0;
    }
  }, {
    key: "join",
    value: function join(s) {
      if (this.length === 0) return '';
      var p = this.head;
      var ret = '' + p.data;

      while (p = p.next) {
        ret += s + p.data;
      }

      return ret;
    }
  }, {
    key: "concat",
    value: function concat(n) {
      if (this.length === 0) return Buffer$3.alloc(0);
      var ret = Buffer$3.allocUnsafe(n >>> 0);
      var p = this.head;
      var i = 0;

      while (p) {
        copyBuffer(p.data, ret, i);
        i += p.data.length;
        p = p.next;
      }

      return ret;
    } // Consumes a specified amount of bytes or characters from the buffered data.

  }, {
    key: "consume",
    value: function consume(n, hasStrings) {
      var ret;

      if (n < this.head.data.length) {
        // `slice` is the same for buffers and strings.
        ret = this.head.data.slice(0, n);
        this.head.data = this.head.data.slice(n);
      } else if (n === this.head.data.length) {
        // First chunk is a perfect match.
        ret = this.shift();
      } else {
        // Result spans more than one buffer.
        ret = hasStrings ? this._getString(n) : this._getBuffer(n);
      }

      return ret;
    }
  }, {
    key: "first",
    value: function first() {
      return this.head.data;
    } // Consumes a specified amount of characters from the buffered data.

  }, {
    key: "_getString",
    value: function _getString(n) {
      var p = this.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;

      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;else ret += str.slice(0, n);
        n -= nb;

        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = str.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Consumes a specified amount of bytes from the buffered data.

  }, {
    key: "_getBuffer",
    value: function _getBuffer(n) {
      var ret = Buffer$3.allocUnsafe(n);
      var p = this.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;

      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;

        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) this.head = p.next;else this.head = this.tail = null;
          } else {
            this.head = p;
            p.data = buf.slice(nb);
          }

          break;
        }

        ++c;
      }

      this.length -= c;
      return ret;
    } // Make sure the linked list only shows the minimal necessary information.

  }, {
    key: custom,
    value: function value(_, options) {
      return inspect(this, _objectSpread({}, options, {
        // Only inspect one level.
        depth: 0,
        // It should not recurse.
        customInspect: false
      }));
    }
  }]);

  return BufferList;
}();

function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err) {
      if (!this._writableState) {
        process.nextTick(emitErrorNT, this, err);
      } else if (!this._writableState.errorEmitted) {
        this._writableState.errorEmitted = true;
        process.nextTick(emitErrorNT, this, err);
      }
    }

    return this;
  } // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks


  if (this._readableState) {
    this._readableState.destroyed = true;
  } // if this is a duplex stream mark the writable part as destroyed as well


  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      if (!_this._writableState) {
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else if (!_this._writableState.errorEmitted) {
        _this._writableState.errorEmitted = true;
        process.nextTick(emitErrorAndCloseNT, _this, err);
      } else {
        process.nextTick(emitCloseNT, _this);
      }
    } else if (cb) {
      process.nextTick(emitCloseNT, _this);
      cb(err);
    } else {
      process.nextTick(emitCloseNT, _this);
    }
  });

  return this;
}

function emitErrorAndCloseNT(self, err) {
  emitErrorNT(self, err);
  emitCloseNT(self);
}

function emitCloseNT(self) {
  if (self._writableState && !self._writableState.emitClose) return;
  if (self._readableState && !self._readableState.emitClose) return;
  self.emit('close');
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finalCalled = false;
    this._writableState.prefinished = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

function errorOrDestroy(stream, err) {
  // We have tests that rely on errors being emitted
  // in the same tick, so changing this is semver major.
  // For now when you opt-in to autoDestroy we allow
  // the error to be emitted nextTick. In a future
  // semver major update we should change the default to this.
  var rState = stream._readableState;
  var wState = stream._writableState;
  if (rState && rState.autoDestroy || wState && wState.autoDestroy) stream.destroy(err);else stream.emit('error', err);
}

var destroy_1 = {
  destroy: destroy,
  undestroy: undestroy,
  errorOrDestroy: errorOrDestroy
};

const codes = {};

function createErrorType(code, message, Base) {
  if (!Base) {
    Base = Error;
  }

  function getMessage (arg1, arg2, arg3) {
    if (typeof message === 'string') {
      return message
    } else {
      return message(arg1, arg2, arg3)
    }
  }

  class NodeError extends Base {
    constructor (arg1, arg2, arg3) {
      super(getMessage(arg1, arg2, arg3));
    }
  }

  NodeError.prototype.name = Base.name;
  NodeError.prototype.code = code;

  codes[code] = NodeError;
}

// https://github.com/nodejs/node/blob/v10.8.0/lib/internal/errors.js
function oneOf(expected, thing) {
  if (Array.isArray(expected)) {
    const len = expected.length;
    expected = expected.map((i) => String(i));
    if (len > 2) {
      return `one of ${thing} ${expected.slice(0, len - 1).join(', ')}, or ` +
             expected[len - 1];
    } else if (len === 2) {
      return `one of ${thing} ${expected[0]} or ${expected[1]}`;
    } else {
      return `of ${thing} ${expected[0]}`;
    }
  } else {
    return `of ${thing} ${String(expected)}`;
  }
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
function startsWith(str, search, pos) {
	return str.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
function endsWith(str, search, this_len) {
	if (this_len === undefined || this_len > str.length) {
		this_len = str.length;
	}
	return str.substring(this_len - search.length, this_len) === search;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
function includes(str, search, start) {
  if (typeof start !== 'number') {
    start = 0;
  }

  if (start + search.length > str.length) {
    return false;
  } else {
    return str.indexOf(search, start) !== -1;
  }
}

createErrorType('ERR_INVALID_OPT_VALUE', function (name, value) {
  return 'The value "' + value + '" is invalid for option "' + name + '"'
}, TypeError);
createErrorType('ERR_INVALID_ARG_TYPE', function (name, expected, actual) {
  // determiner: 'must be' or 'must not be'
  let determiner;
  if (typeof expected === 'string' && startsWith(expected, 'not ')) {
    determiner = 'must not be';
    expected = expected.replace(/^not /, '');
  } else {
    determiner = 'must be';
  }

  let msg;
  if (endsWith(name, ' argument')) {
    // For cases like 'first argument'
    msg = `The ${name} ${determiner} ${oneOf(expected, 'type')}`;
  } else {
    const type = includes(name, '.') ? 'property' : 'argument';
    msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, 'type')}`;
  }

  msg += `. Received type ${typeof actual}`;
  return msg;
}, TypeError);
createErrorType('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF');
createErrorType('ERR_METHOD_NOT_IMPLEMENTED', function (name) {
  return 'The ' + name + ' method is not implemented'
});
createErrorType('ERR_STREAM_PREMATURE_CLOSE', 'Premature close');
createErrorType('ERR_STREAM_DESTROYED', function (name) {
  return 'Cannot call ' + name + ' after a stream was destroyed';
});
createErrorType('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times');
createErrorType('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable');
createErrorType('ERR_STREAM_WRITE_AFTER_END', 'write after end');
createErrorType('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError);
createErrorType('ERR_UNKNOWN_ENCODING', function (arg) {
  return 'Unknown encoding: ' + arg
}, TypeError);
createErrorType('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event');

var codes_1 = codes;

var errors = {
	codes: codes_1
};

var ERR_INVALID_OPT_VALUE = errors.codes.ERR_INVALID_OPT_VALUE;

function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null;
}

function getHighWaterMark(state, options, duplexKey, isDuplex) {
  var hwm = highWaterMarkFrom(options, isDuplex, duplexKey);

  if (hwm != null) {
    if (!(isFinite(hwm) && Math.floor(hwm) === hwm) || hwm < 0) {
      var name = isDuplex ? duplexKey : 'highWaterMark';
      throw new ERR_INVALID_OPT_VALUE(name, hwm);
    }

    return Math.floor(hwm);
  } // Default value


  return state.objectMode ? 16 : 16 * 1024;
}

var state = {
  getHighWaterMark: getHighWaterMark
};

var inherits_browser = createCommonjsModule(function (module) {
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
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
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function () {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    }
  };
}
});

var inherits = createCommonjsModule(function (module) {
try {
  var util = util$6;
  /* istanbul ignore next */
  if (typeof util.inherits !== 'function') throw '';
  module.exports = util.inherits;
} catch (e) {
  /* istanbul ignore next */
  module.exports = inherits_browser;
}
});

/**
 * For Node.js, simply re-export the core `util.deprecate` function.
 */

var node$1 = util$6.deprecate;

var _stream_writable = Writable;
// there will be only 2 of these for each stream


function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/


var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;
/*<replacement>*/

var internalUtil = {
  deprecate: node$1
};
/*</replacement>*/

/*<replacement>*/


/*</replacement>*/


var Buffer$4 = buffer.Buffer;

var OurUint8Array = commonjsGlobal.Uint8Array || function () {};

function _uint8ArrayToBuffer(chunk) {
  return Buffer$4.from(chunk);
}

function _isUint8Array(obj) {
  return Buffer$4.isBuffer(obj) || obj instanceof OurUint8Array;
}



var getHighWaterMark$1 = state.getHighWaterMark;

var _require$codes = errors.codes,
    ERR_INVALID_ARG_TYPE = _require$codes.ERR_INVALID_ARG_TYPE,
    ERR_METHOD_NOT_IMPLEMENTED = _require$codes.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK = _require$codes.ERR_MULTIPLE_CALLBACK,
    ERR_STREAM_CANNOT_PIPE = _require$codes.ERR_STREAM_CANNOT_PIPE,
    ERR_STREAM_DESTROYED = _require$codes.ERR_STREAM_DESTROYED,
    ERR_STREAM_NULL_VALUES = _require$codes.ERR_STREAM_NULL_VALUES,
    ERR_STREAM_WRITE_AFTER_END = _require$codes.ERR_STREAM_WRITE_AFTER_END,
    ERR_UNKNOWN_ENCODING = _require$codes.ERR_UNKNOWN_ENCODING;

var errorOrDestroy$1 = destroy_1.errorOrDestroy;

inherits(Writable, stream);

function nop() {}

function WritableState(options, stream, isDuplex) {
  Duplex = Duplex || _stream_duplex;
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream,
  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex; // object stream flag to indicate whether or not this stream
  // contains buffers or objects.

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()

  this.highWaterMark = getHighWaterMark$1(this, options, 'writableHighWaterMark', isDuplex); // if _final has been called

  this.finalCalled = false; // drain event flag.

  this.needDrain = false; // at the start of calling end()

  this.ending = false; // when end() has been called, and returned

  this.ended = false; // when 'finish' is emitted

  this.finished = false; // has it been destroyed

  this.destroyed = false; // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.

  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.

  this.length = 0; // a flag to see when we're in the middle of a write.

  this.writing = false; // when true all writes will be buffered until .uncork() call

  this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.

  this.sync = true; // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.

  this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)

  this.onwrite = function (er) {
    onwrite(stream, er);
  }; // the callback that the user supplies to write(chunk,encoding,cb)


  this.writecb = null; // the amount that is being written when _write is called.

  this.writelen = 0;
  this.bufferedRequest = null;
  this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted

  this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams

  this.prefinished = false; // True if the error was already emitted and should not be thrown again

  this.errorEmitted = false; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'finish' (and potentially 'end')

  this.autoDestroy = !!options.autoDestroy; // count buffered requests

  this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two

  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];

  while (current) {
    out.push(current);
    current = current.next;
  }

  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function writableStateBufferGetter() {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})(); // Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.


var realHasInstance;

if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function value(object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;
      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function realHasInstance(object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || _stream_duplex; // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.
  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the WritableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex;
  if (!isDuplex && !realHasInstance.call(Writable, this)) return new Writable(options);
  this._writableState = new WritableState(options, this, isDuplex); // legacy.

  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;
    if (typeof options.writev === 'function') this._writev = options.writev;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
    if (typeof options.final === 'function') this._final = options.final;
  }

  stream.call(this);
} // Otherwise people can pipe Writable streams, which is just wrong.


Writable.prototype.pipe = function () {
  errorOrDestroy$1(this, new ERR_STREAM_CANNOT_PIPE());
};

function writeAfterEnd(stream, cb) {
  var er = new ERR_STREAM_WRITE_AFTER_END(); // TODO: defer error events consistently everywhere, not just the cb

  errorOrDestroy$1(stream, er);
  process.nextTick(cb, er);
} // Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.


function validChunk(stream, state, chunk, cb) {
  var er;

  if (chunk === null) {
    er = new ERR_STREAM_NULL_VALUES();
  } else if (typeof chunk !== 'string' && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer'], chunk);
  }

  if (er) {
    errorOrDestroy$1(stream, er);
    process.nextTick(cb, er);
    return false;
  }

  return true;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer$4.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
  if (typeof cb !== 'function') cb = nop;
  if (state.ending) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }
  return ret;
};

Writable.prototype.cork = function () {
  this._writableState.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;
    if (!state.writing && !state.corked && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new ERR_UNKNOWN_ENCODING(encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

Object.defineProperty(Writable.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer$4.from(chunk, encoding);
  }

  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
}); // if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.

function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);

    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }

  var len = state.objectMode ? 1 : chunk.length;
  state.length += len;
  var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.

  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };

    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }

    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'));else if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    process.nextTick(cb, er); // this can emit finish, and it will always happen
    // after error

    process.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    errorOrDestroy$1(stream, er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    errorOrDestroy$1(stream, er); // this can emit finish, but finish must
    // always follow error

    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;
  if (typeof cb !== 'function') throw new ERR_MULTIPLE_CALLBACK();
  onwriteStateUpdate(state);
  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state) || stream.destroyed;

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(afterWrite, stream, state, finished, cb);
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
} // Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.


function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
} // if there's something in the buffer waiting, then process it


function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;
    var count = 0;
    var allBuffers = true;

    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }

    buffer.allBuffers = allBuffers;
    doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite

    state.pendingcb++;
    state.lastBufferedRequest = null;

    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }

    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;
      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--; // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.

      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED('_write()'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks

  if (state.corked) {
    state.corked = 1;
    this.uncork();
  } // ignore unnecessary end() calls.


  if (!state.ending) endWritable(this, state, cb);
  return this;
};

Object.defineProperty(Writable.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
});

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;

    if (err) {
      errorOrDestroy$1(stream, err);
    }

    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}

function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function' && !state.destroyed) {
      state.pendingcb++;
      state.finalCalled = true;
      process.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);

  if (need) {
    prefinish(stream, state);

    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');

      if (state.autoDestroy) {
        // In case of duplex streams we need a way to detect
        // if the readable side is ready for autoDestroy as well
        var rState = stream._readableState;

        if (!rState || rState.autoDestroy && rState.endEmitted) {
          stream.destroy();
        }
      }
    }
  }

  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);

  if (cb) {
    if (state.finished) process.nextTick(cb);else stream.once('finish', cb);
  }

  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;

  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  } // reuse the free corkReq.


  state.corkedRequestsFree.next = corkReq;
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._writableState === undefined) {
      return false;
    }

    return this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._writableState.destroyed = value;
  }
});
Writable.prototype.destroy = destroy_1.destroy;
Writable.prototype._undestroy = destroy_1.undestroy;

Writable.prototype._destroy = function (err, cb) {
  cb(err);
};

/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];

  for (var key in obj) {
    keys.push(key);
  }

  return keys;
};
/*</replacement>*/


var _stream_duplex = Duplex$1;





inherits(Duplex$1, _stream_readable);

{
  // Allow the keys array to be GC'ed.
  var keys = objectKeys(_stream_writable.prototype);

  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex$1.prototype[method]) Duplex$1.prototype[method] = _stream_writable.prototype[method];
  }
}

function Duplex$1(options) {
  if (!(this instanceof Duplex$1)) return new Duplex$1(options);
  _stream_readable.call(this, options);
  _stream_writable.call(this, options);
  this.allowHalfOpen = true;

  if (options) {
    if (options.readable === false) this.readable = false;
    if (options.writable === false) this.writable = false;

    if (options.allowHalfOpen === false) {
      this.allowHalfOpen = false;
      this.once('end', onend);
    }
  }
}

Object.defineProperty(Duplex$1.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.highWaterMark;
  }
});
Object.defineProperty(Duplex$1.prototype, 'writableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState && this._writableState.getBuffer();
  }
});
Object.defineProperty(Duplex$1.prototype, 'writableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._writableState.length;
  }
}); // the no-half-open enforcer

function onend() {
  // If the writable side ended, then we're ok.
  if (this._writableState.ended) return; // no more data can be written.
  // But allow more writes to happen in this tick.

  process.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex$1.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }

    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

var safeBuffer = createCommonjsModule(function (module, exports) {
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */

var Buffer = buffer.Buffer;

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key];
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer;
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports);
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
  return buffer.SlowBuffer(size)
};
});

/*<replacement>*/

var Buffer$5 = safeBuffer.Buffer;
/*</replacement>*/

var isEncoding = Buffer$5.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
}
// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer$5.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
var StringDecoder_1 = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer$5.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}

var string_decoder = {
	StringDecoder: StringDecoder_1
};

var ERR_STREAM_PREMATURE_CLOSE = errors.codes.ERR_STREAM_PREMATURE_CLOSE;

function once(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    callback.apply(this, args);
  };
}

function noop() {}

function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function eos(stream, opts, callback) {
  if (typeof opts === 'function') return eos(stream, null, opts);
  if (!opts) opts = {};
  callback = once(callback || noop);
  var readable = opts.readable || opts.readable !== false && stream.readable;
  var writable = opts.writable || opts.writable !== false && stream.writable;

  var onlegacyfinish = function onlegacyfinish() {
    if (!stream.writable) onfinish();
  };

  var writableEnded = stream._writableState && stream._writableState.finished;

  var onfinish = function onfinish() {
    writable = false;
    writableEnded = true;
    if (!readable) callback.call(stream);
  };

  var readableEnded = stream._readableState && stream._readableState.endEmitted;

  var onend = function onend() {
    readable = false;
    readableEnded = true;
    if (!writable) callback.call(stream);
  };

  var onerror = function onerror(err) {
    callback.call(stream, err);
  };

  var onclose = function onclose() {
    var err;

    if (readable && !readableEnded) {
      if (!stream._readableState || !stream._readableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }

    if (writable && !writableEnded) {
      if (!stream._writableState || !stream._writableState.ended) err = new ERR_STREAM_PREMATURE_CLOSE();
      return callback.call(stream, err);
    }
  };

  var onrequest = function onrequest() {
    stream.req.on('finish', onfinish);
  };

  if (isRequest(stream)) {
    stream.on('complete', onfinish);
    stream.on('abort', onclose);
    if (stream.req) onrequest();else stream.on('request', onrequest);
  } else if (writable && !stream._writableState) {
    // legacy streams
    stream.on('end', onlegacyfinish);
    stream.on('close', onlegacyfinish);
  }

  stream.on('end', onend);
  stream.on('finish', onfinish);
  if (opts.error !== false) stream.on('error', onerror);
  stream.on('close', onclose);
  return function () {
    stream.removeListener('complete', onfinish);
    stream.removeListener('abort', onclose);
    stream.removeListener('request', onrequest);
    if (stream.req) stream.req.removeListener('finish', onfinish);
    stream.removeListener('end', onlegacyfinish);
    stream.removeListener('close', onlegacyfinish);
    stream.removeListener('finish', onfinish);
    stream.removeListener('end', onend);
    stream.removeListener('error', onerror);
    stream.removeListener('close', onclose);
  };
}

var endOfStream = eos;

var _Object$setPrototypeO;

function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



var kLastResolve = Symbol('lastResolve');
var kLastReject = Symbol('lastReject');
var kError = Symbol('error');
var kEnded = Symbol('ended');
var kLastPromise = Symbol('lastPromise');
var kHandlePromise = Symbol('handlePromise');
var kStream = Symbol('stream');

function createIterResult(value, done) {
  return {
    value: value,
    done: done
  };
}

function readAndResolve(iter) {
  var resolve = iter[kLastResolve];

  if (resolve !== null) {
    var data = iter[kStream].read(); // we defer if data is null
    // we can be expecting either 'end' or
    // 'error'

    if (data !== null) {
      iter[kLastPromise] = null;
      iter[kLastResolve] = null;
      iter[kLastReject] = null;
      resolve(createIterResult(data, false));
    }
  }
}

function onReadable(iter) {
  // we wait for the next tick, because it might
  // emit an error with process.nextTick
  process.nextTick(readAndResolve, iter);
}

function wrapForNext(lastPromise, iter) {
  return function (resolve, reject) {
    lastPromise.then(function () {
      if (iter[kEnded]) {
        resolve(createIterResult(undefined, true));
        return;
      }

      iter[kHandlePromise](resolve, reject);
    }, reject);
  };
}

var AsyncIteratorPrototype = Object.getPrototypeOf(function () {});
var ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf((_Object$setPrototypeO = {
  get stream() {
    return this[kStream];
  },

  next: function next() {
    var _this = this;

    // if we have detected an error in the meanwhile
    // reject straight away
    var error = this[kError];

    if (error !== null) {
      return Promise.reject(error);
    }

    if (this[kEnded]) {
      return Promise.resolve(createIterResult(undefined, true));
    }

    if (this[kStream].destroyed) {
      // We need to defer via nextTick because if .destroy(err) is
      // called, the error will be emitted via nextTick, and
      // we cannot guarantee that there is no error lingering around
      // waiting to be emitted.
      return new Promise(function (resolve, reject) {
        process.nextTick(function () {
          if (_this[kError]) {
            reject(_this[kError]);
          } else {
            resolve(createIterResult(undefined, true));
          }
        });
      });
    } // if we have multiple next() calls
    // we will wait for the previous Promise to finish
    // this logic is optimized to support for await loops,
    // where next() is only called once at a time


    var lastPromise = this[kLastPromise];
    var promise;

    if (lastPromise) {
      promise = new Promise(wrapForNext(lastPromise, this));
    } else {
      // fast path needed to support multiple this.push()
      // without triggering the next() queue
      var data = this[kStream].read();

      if (data !== null) {
        return Promise.resolve(createIterResult(data, false));
      }

      promise = new Promise(this[kHandlePromise]);
    }

    this[kLastPromise] = promise;
    return promise;
  }
}, _defineProperty$1(_Object$setPrototypeO, Symbol.asyncIterator, function () {
  return this;
}), _defineProperty$1(_Object$setPrototypeO, "return", function _return() {
  var _this2 = this;

  // destroy(err, cb) is a private API
  // we can guarantee we have that here, because we control the
  // Readable class this is attached to
  return new Promise(function (resolve, reject) {
    _this2[kStream].destroy(null, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(createIterResult(undefined, true));
    });
  });
}), _Object$setPrototypeO), AsyncIteratorPrototype);

var createReadableStreamAsyncIterator = function createReadableStreamAsyncIterator(stream) {
  var _Object$create;

  var iterator = Object.create(ReadableStreamAsyncIteratorPrototype, (_Object$create = {}, _defineProperty$1(_Object$create, kStream, {
    value: stream,
    writable: true
  }), _defineProperty$1(_Object$create, kLastResolve, {
    value: null,
    writable: true
  }), _defineProperty$1(_Object$create, kLastReject, {
    value: null,
    writable: true
  }), _defineProperty$1(_Object$create, kError, {
    value: null,
    writable: true
  }), _defineProperty$1(_Object$create, kEnded, {
    value: stream._readableState.endEmitted,
    writable: true
  }), _defineProperty$1(_Object$create, kHandlePromise, {
    value: function value(resolve, reject) {
      var data = iterator[kStream].read();

      if (data) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        resolve(createIterResult(data, false));
      } else {
        iterator[kLastResolve] = resolve;
        iterator[kLastReject] = reject;
      }
    },
    writable: true
  }), _Object$create));
  iterator[kLastPromise] = null;
  endOfStream(stream, function (err) {
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      var reject = iterator[kLastReject]; // reject if we are waiting for data in the Promise
      // returned by next() and store the error

      if (reject !== null) {
        iterator[kLastPromise] = null;
        iterator[kLastResolve] = null;
        iterator[kLastReject] = null;
        reject(err);
      }

      iterator[kError] = err;
      return;
    }

    var resolve = iterator[kLastResolve];

    if (resolve !== null) {
      iterator[kLastPromise] = null;
      iterator[kLastResolve] = null;
      iterator[kLastReject] = null;
      resolve(createIterResult(undefined, true));
    }

    iterator[kEnded] = true;
  });
  stream.on('readable', onReadable.bind(null, iterator));
  return iterator;
};

var async_iterator = createReadableStreamAsyncIterator;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ERR_INVALID_ARG_TYPE$1 = errors.codes.ERR_INVALID_ARG_TYPE;

function from(Readable, iterable, opts) {
  var iterator;

  if (iterable && typeof iterable.next === 'function') {
    iterator = iterable;
  } else if (iterable && iterable[Symbol.asyncIterator]) iterator = iterable[Symbol.asyncIterator]();else if (iterable && iterable[Symbol.iterator]) iterator = iterable[Symbol.iterator]();else throw new ERR_INVALID_ARG_TYPE$1('iterable', ['Iterable'], iterable);

  var readable = new Readable(_objectSpread$1({
    objectMode: true
  }, opts)); // Reading boolean to protect against _read
  // being called before last iteration completion.

  var reading = false;

  readable._read = function () {
    if (!reading) {
      reading = true;
      next();
    }
  };

  function next() {
    return _next2.apply(this, arguments);
  }

  function _next2() {
    _next2 = _asyncToGenerator(function* () {
      try {
        var _ref = yield iterator.next(),
            value = _ref.value,
            done = _ref.done;

        if (done) {
          readable.push(null);
        } else if (readable.push((yield value))) {
          next();
        } else {
          reading = false;
        }
      } catch (err) {
        readable.destroy(err);
      }
    });
    return _next2.apply(this, arguments);
  }

  return readable;
}

var from_1 = from;

var _stream_readable = Readable;
/*<replacement>*/

var Duplex$2;
/*</replacement>*/

Readable.ReadableState = ReadableState;
/*<replacement>*/

var EE = events.EventEmitter;

var EElistenerCount = function EElistenerCount(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/



/*</replacement>*/


var Buffer$6 = buffer.Buffer;

var OurUint8Array$1 = commonjsGlobal.Uint8Array || function () {};

function _uint8ArrayToBuffer$1(chunk) {
  return Buffer$6.from(chunk);
}

function _isUint8Array$1(obj) {
  return Buffer$6.isBuffer(obj) || obj instanceof OurUint8Array$1;
}
/*<replacement>*/




var debug;

if (util$6 && util$6.debuglog) {
  debug = util$6.debuglog('stream');
} else {
  debug = function debug() {};
}
/*</replacement>*/






var getHighWaterMark$2 = state.getHighWaterMark;

var _require$codes$1 = errors.codes,
    ERR_INVALID_ARG_TYPE$2 = _require$codes$1.ERR_INVALID_ARG_TYPE,
    ERR_STREAM_PUSH_AFTER_EOF = _require$codes$1.ERR_STREAM_PUSH_AFTER_EOF,
    ERR_METHOD_NOT_IMPLEMENTED$1 = _require$codes$1.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT = _require$codes$1.ERR_STREAM_UNSHIFT_AFTER_END_EVENT; // Lazy loaded to improve the startup performance.


var StringDecoder$1;
var createReadableStreamAsyncIterator$1;
var from$1;

inherits(Readable, stream);

var errorOrDestroy$2 = destroy_1.errorOrDestroy;
var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn); // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.

  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream, isDuplex) {
  Duplex$2 = Duplex$2 || _stream_duplex;
  options = options || {}; // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.

  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof Duplex$2; // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away

  this.objectMode = !!options.objectMode;
  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode; // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"

  this.highWaterMark = getHighWaterMark$2(this, options, 'readableHighWaterMark', isDuplex); // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()

  this.buffer = new buffer_list();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false; // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.

  this.sync = true; // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.

  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;
  this.paused = true; // Should close be emitted on destroy. Defaults to true.

  this.emitClose = options.emitClose !== false; // Should .destroy() be called after 'end' (and potentially 'finish')

  this.autoDestroy = !!options.autoDestroy; // has it been destroyed

  this.destroyed = false; // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.

  this.defaultEncoding = options.defaultEncoding || 'utf8'; // the number of writers that are awaiting a drain event in .pipe()s

  this.awaitDrain = 0; // if true, a maybeReadMore has been scheduled

  this.readingMore = false;
  this.decoder = null;
  this.encoding = null;

  if (options.encoding) {
    if (!StringDecoder$1) StringDecoder$1 = string_decoder.StringDecoder;
    this.decoder = new StringDecoder$1(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex$2 = Duplex$2 || _stream_duplex;
  if (!(this instanceof Readable)) return new Readable(options); // Checking for a Stream.Duplex instance is faster here instead of inside
  // the ReadableState constructor, at least with V8 6.5

  var isDuplex = this instanceof Duplex$2;
  this._readableState = new ReadableState(options, this, isDuplex); // legacy

  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;
    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    if (this._readableState === undefined) {
      return false;
    }

    return this._readableState.destroyed;
  },
  set: function set(value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    } // backward compatibility, the user is explicitly
    // managing destroyed


    this._readableState.destroyed = value;
  }
});
Readable.prototype.destroy = destroy_1.destroy;
Readable.prototype._undestroy = destroy_1.undestroy;

Readable.prototype._destroy = function (err, cb) {
  cb(err);
}; // Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.


Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;

      if (encoding !== state.encoding) {
        chunk = Buffer$6.from(chunk, encoding);
        encoding = '';
      }

      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
}; // Unshift should *always* be something directly out of read()


Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  debug('readableAddChunk', chunk);
  var state = stream._readableState;

  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);

    if (er) {
      errorOrDestroy$2(stream, er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer$6.prototype) {
        chunk = _uint8ArrayToBuffer$1(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) errorOrDestroy$2(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT());else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        errorOrDestroy$2(stream, new ERR_STREAM_PUSH_AFTER_EOF());
      } else if (state.destroyed) {
        return false;
      } else {
        state.reading = false;

        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
      maybeReadMore(stream, state);
    }
  } // We can push more data if we are below the highWaterMark.
  // Also, if we have no data yet, we can stand some more bytes.
  // This is to work around cases where hwm=0, such as the repl.


  return !state.ended && (state.length < state.highWaterMark || state.length === 0);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    state.awaitDrain = 0;
    stream.emit('data', chunk);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
    if (state.needReadable) emitReadable(stream);
  }

  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;

  if (!_isUint8Array$1(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new ERR_INVALID_ARG_TYPE$2('chunk', ['string', 'Buffer', 'Uint8Array'], chunk);
  }

  return er;
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
}; // backwards compatibility.


Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder$1) StringDecoder$1 = string_decoder.StringDecoder;
  var decoder = new StringDecoder$1(enc);
  this._readableState.decoder = decoder; // If setEncoding(null), decoder.encoding equals utf8

  this._readableState.encoding = this._readableState.decoder.encoding; // Iterate over current buffer to convert already stored Buffers:

  var p = this._readableState.buffer.head;
  var content = '';

  while (p !== null) {
    content += decoder.write(p.data);
    p = p.next;
  }

  this._readableState.buffer.clear();

  if (content !== '') this._readableState.buffer.push(content);
  this._readableState.length = content.length;
  return this;
}; // Don't raise the hwm > 1GB


var MAX_HWM = 0x40000000;

function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    // TODO(ronag): Throw ERR_VALUE_OUT_OF_RANGE.
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }

  return n;
} // This function is designed to be inlinable, so please take care when making
// changes to the function body.


function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;

  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  } // If we're asking for more than the current hwm, then raise the hwm.


  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n; // Don't have enough

  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }

  return state.length;
} // you can override either this method, or the async _read(n) below.


Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;
  if (n !== 0) state.emittedReadable = false; // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.

  if (n === 0 && state.needReadable && ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state); // if we've ended, and we're now clear, then finish it up.

  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  } // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.
  // if we need a readable event, then we need to do some reading.


  var doRead = state.needReadable;
  debug('need readable', doRead); // if we currently have less than the highWaterMark, then also read some

  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  } // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.


  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true; // if the length is currently zero, then we *need* a readable event.

    if (state.length === 0) state.needReadable = true; // call internal read method

    this._read(state.highWaterMark);

    state.sync = false; // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.

    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = state.length <= state.highWaterMark;
    n = 0;
  } else {
    state.length -= n;
    state.awaitDrain = 0;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true; // If we tried to read() past the EOF, then emit end on the next tick.

    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);
  return ret;
};

function onEofChunk(stream, state) {
  debug('onEofChunk');
  if (state.ended) return;

  if (state.decoder) {
    var chunk = state.decoder.end();

    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }

  state.ended = true;

  if (state.sync) {
    // if we are sync, wait until next tick to emit the data.
    // Otherwise we risk emitting data in the flow()
    // the readable code triggers during a read() call
    emitReadable(stream);
  } else {
    // emit 'readable' now to make sure it gets picked up.
    state.needReadable = false;

    if (!state.emittedReadable) {
      state.emittedReadable = true;
      emitReadable_(stream);
    }
  }
} // Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.


function emitReadable(stream) {
  var state = stream._readableState;
  debug('emitReadable', state.needReadable, state.emittedReadable);
  state.needReadable = false;

  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    process.nextTick(emitReadable_, stream);
  }
}

function emitReadable_(stream) {
  var state = stream._readableState;
  debug('emitReadable_', state.destroyed, state.length, state.ended);

  if (!state.destroyed && (state.length || state.ended)) {
    stream.emit('readable');
    state.emittedReadable = false;
  } // The stream needs another readable event if
  // 1. It is not flowing, as the flow mechanism will take
  //    care of it.
  // 2. It is not ended.
  // 3. It is below the highWaterMark, so we can schedule
  //    another readable later.


  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark;
  flow(stream);
} // at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.


function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  // Attempt to read more data if we should.
  //
  // The conditions for reading more data are (one of):
  // - Not enough data buffered (state.length < state.highWaterMark). The loop
  //   is responsible for filling the buffer with enough data if such data
  //   is available. If highWaterMark is 0 and we are not in the flowing mode
  //   we should _not_ attempt to buffer any extra data. We'll get more data
  //   when the stream consumer calls read() instead.
  // - No data in the buffer, and the stream is in flowing mode. In this mode
  //   the loop below is responsible for ensuring read() is called. Failing to
  //   call read here would abort the flow and there's no other mechanism for
  //   continuing the flow if the stream consumer has just subscribed to the
  //   'data' event.
  //
  // In addition to the above conditions to keep reading data, the following
  // conditions prevent the data from being read:
  // - The stream has ended (state.ended).
  // - There is already a pending 'read' operation (state.reading). This is a
  //   case where the the stream has called the implementation defined _read()
  //   method, but they are processing the call asynchronously and have _not_
  //   called push() with new data. In this case we skip performing more
  //   read()s. The execution ends in this method again after the _read() ends
  //   up calling push() with more data.
  while (!state.reading && !state.ended && (state.length < state.highWaterMark || state.flowing && state.length === 0)) {
    var len = state.length;
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length) // didn't get any data, stop spinning.
      break;
  }

  state.readingMore = false;
} // abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.


Readable.prototype._read = function (n) {
  errorOrDestroy$2(this, new ERR_METHOD_NOT_IMPLEMENTED$1('_read()'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;

    case 1:
      state.pipes = [state.pipes, dest];
      break;

    default:
      state.pipes.push(dest);
      break;
  }

  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) process.nextTick(endFn);else src.once('end', endFn);
  dest.on('unpipe', onunpipe);

  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');

    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  } // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.


  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);
  var cleanedUp = false;

  function cleanup() {
    debug('cleanup'); // cleanup event handlers once the pipe is broken

    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);
    cleanedUp = true; // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.

    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  src.on('data', ondata);

  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    debug('dest.write', ret);

    if (ret === false) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', state.awaitDrain);
        state.awaitDrain++;
      }

      src.pause();
    }
  } // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.


  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) errorOrDestroy$2(dest, er);
  } // Make sure our error handler is attached before userland ones.


  prependListener(dest, 'error', onerror); // Both close and finish should trigger unpipe, but only once.

  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }

  dest.once('close', onclose);

  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }

  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  } // tell the dest that it's being piped to


  dest.emit('pipe', src); // start the flow if it hasn't been started already.

  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function pipeOnDrainFunctionResult() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;

    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = {
    hasUnpiped: false
  }; // if we're not piping anywhere, then do nothing.

  if (state.pipesCount === 0) return this; // just one destination.  most common case.

  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;
    if (!dest) dest = state.pipes; // got a match.

    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  } // slow case. multiple pipe destinations.


  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, {
        hasUnpiped: false
      });
    }

    return this;
  } // try to find the right one.


  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;
  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];
  dest.emit('unpipe', this, unpipeInfo);
  return this;
}; // set up data events if they are asked for
// Ensure readable listeners eventually get something


Readable.prototype.on = function (ev, fn) {
  var res = stream.prototype.on.call(this, ev, fn);
  var state = this._readableState;

  if (ev === 'data') {
    // update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0; // Try start flowing on next tick if stream isn't explicitly paused

    if (state.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.flowing = false;
      state.emittedReadable = false;
      debug('on readable', state.length, state.reading);

      if (state.length) {
        emitReadable(this);
      } else if (!state.reading) {
        process.nextTick(nReadingNextTick, this);
      }
    }
  }

  return res;
};

Readable.prototype.addListener = Readable.prototype.on;

Readable.prototype.removeListener = function (ev, fn) {
  var res = stream.prototype.removeListener.call(this, ev, fn);

  if (ev === 'readable') {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

Readable.prototype.removeAllListeners = function (ev) {
  var res = stream.prototype.removeAllListeners.apply(this, arguments);

  if (ev === 'readable' || ev === undefined) {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this);
  }

  return res;
};

function updateReadableListening(self) {
  var state = self._readableState;
  state.readableListening = self.listenerCount('readable') > 0;

  if (state.resumeScheduled && !state.paused) {
    // flowing needs to be set to true now, otherwise
    // the upcoming resume will not flow.
    state.flowing = true; // crude way to check if we should resume
  } else if (self.listenerCount('data') > 0) {
    self.resume();
  }
}

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
} // pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.


Readable.prototype.resume = function () {
  var state = this._readableState;

  if (!state.flowing) {
    debug('resume'); // we flow only if there is no one listening
    // for readable, but we still have to call
    // resume()

    state.flowing = !state.readableListening;
    resume(this, state);
  }

  state.paused = false;
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  debug('resume', state.reading);

  if (!state.reading) {
    stream.read(0);
  }

  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);

  if (this._readableState.flowing !== false) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }

  this._readableState.paused = true;
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);

  while (state.flowing && stream.read() !== null) {
  }
} // wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.


Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;
  stream.on('end', function () {
    debug('wrapped end');

    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });
  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk); // don't skip over falsy values in objectMode

    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);

    if (!ret) {
      paused = true;
      stream.pause();
    }
  }); // proxy all the other methods.
  // important when wrapping filters and duplexes.

  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function methodWrap(method) {
        return function methodWrapReturnFunction() {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  } // proxy certain important events.


  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  } // when we try to consume some more bytes, simply unpause the
  // underlying stream.


  this._read = function (n) {
    debug('wrapped _read', n);

    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

if (typeof Symbol === 'function') {
  Readable.prototype[Symbol.asyncIterator] = function () {
    if (createReadableStreamAsyncIterator$1 === undefined) {
      createReadableStreamAsyncIterator$1 = async_iterator;
    }

    return createReadableStreamAsyncIterator$1(this);
  };
}

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.highWaterMark;
  }
});
Object.defineProperty(Readable.prototype, 'readableBuffer', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState && this._readableState.buffer;
  }
});
Object.defineProperty(Readable.prototype, 'readableFlowing', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.flowing;
  },
  set: function set(state) {
    if (this._readableState) {
      this._readableState.flowing = state;
    }
  }
}); // exposed for testing purposes only.

Readable._fromList = fromList;
Object.defineProperty(Readable.prototype, 'readableLength', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function get() {
    return this._readableState.length;
  }
}); // Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.

function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;
  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.first();else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = state.buffer.consume(n, state.decoder);
  }
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;
  debug('endReadable', state.endEmitted);

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  debug('endReadableNT', state.endEmitted, state.length); // Check that we didn't get one last unshift.

  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');

    if (state.autoDestroy) {
      // In case of duplex streams we need a way to detect
      // if the writable side is ready for autoDestroy as well
      var wState = stream._writableState;

      if (!wState || wState.autoDestroy && wState.finished) {
        stream.destroy();
      }
    }
  }
}

if (typeof Symbol === 'function') {
  Readable.from = function (iterable, opts) {
    if (from$1 === undefined) {
      from$1 = from_1;
    }

    return from$1(Readable, iterable, opts);
  };
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }

  return -1;
}

var _stream_transform = Transform;

var _require$codes$2 = errors.codes,
    ERR_METHOD_NOT_IMPLEMENTED$2 = _require$codes$2.ERR_METHOD_NOT_IMPLEMENTED,
    ERR_MULTIPLE_CALLBACK$1 = _require$codes$2.ERR_MULTIPLE_CALLBACK,
    ERR_TRANSFORM_ALREADY_TRANSFORMING = _require$codes$2.ERR_TRANSFORM_ALREADY_TRANSFORMING,
    ERR_TRANSFORM_WITH_LENGTH_0 = _require$codes$2.ERR_TRANSFORM_WITH_LENGTH_0;



inherits(Transform, _stream_duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;
  var cb = ts.writecb;

  if (cb === null) {
    return this.emit('error', new ERR_MULTIPLE_CALLBACK$1());
  }

  ts.writechunk = null;
  ts.writecb = null;
  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);
  cb(er);
  var rs = this._readableState;
  rs.reading = false;

  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);
  _stream_duplex.call(this, options);
  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  }; // start out asking for a readable event once data is transformed.

  this._readableState.needReadable = true; // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.

  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;
    if (typeof options.flush === 'function') this._flush = options.flush;
  } // When the writable side finishes, then flush out anything remaining.


  this.on('prefinish', prefinish$1);
}

function prefinish$1() {
  var _this = this;

  if (typeof this._flush === 'function' && !this._readableState.destroyed) {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return _stream_duplex.prototype.push.call(this, chunk, encoding);
}; // This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.


Transform.prototype._transform = function (chunk, encoding, cb) {
  cb(new ERR_METHOD_NOT_IMPLEMENTED$2('_transform()'));
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;

  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
}; // Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.


Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && !ts.transforming) {
    ts.transforming = true;

    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  _stream_duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);
  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data); // TODO(BridgeAR): Write a test for these two error cases
  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided

  if (stream._writableState.length) throw new ERR_TRANSFORM_WITH_LENGTH_0();
  if (stream._transformState.transforming) throw new ERR_TRANSFORM_ALREADY_TRANSFORMING();
  return stream.push(null);
}

var _stream_passthrough = PassThrough;



inherits(PassThrough, _stream_transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);
  _stream_transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

var eos$1;

function once$1(callback) {
  var called = false;
  return function () {
    if (called) return;
    called = true;
    callback.apply(void 0, arguments);
  };
}

var _require$codes$3 = errors.codes,
    ERR_MISSING_ARGS = _require$codes$3.ERR_MISSING_ARGS,
    ERR_STREAM_DESTROYED$1 = _require$codes$3.ERR_STREAM_DESTROYED;

function noop$1(err) {
  // Rethrow the error if it exists to avoid swallowing it
  if (err) throw err;
}

function isRequest$1(stream) {
  return stream.setHeader && typeof stream.abort === 'function';
}

function destroyer(stream, reading, writing, callback) {
  callback = once$1(callback);
  var closed = false;
  stream.on('close', function () {
    closed = true;
  });
  if (eos$1 === undefined) eos$1 = endOfStream;
  eos$1(stream, {
    readable: reading,
    writable: writing
  }, function (err) {
    if (err) return callback(err);
    closed = true;
    callback();
  });
  var destroyed = false;
  return function (err) {
    if (closed) return;
    if (destroyed) return;
    destroyed = true; // request.destroy just do .end - .abort is what we want

    if (isRequest$1(stream)) return stream.abort();
    if (typeof stream.destroy === 'function') return stream.destroy();
    callback(err || new ERR_STREAM_DESTROYED$1('pipe'));
  };
}

function call(fn) {
  fn();
}

function pipe(from, to) {
  return from.pipe(to);
}

function popCallback(streams) {
  if (!streams.length) return noop$1;
  if (typeof streams[streams.length - 1] !== 'function') return noop$1;
  return streams.pop();
}

function pipeline() {
  for (var _len = arguments.length, streams = new Array(_len), _key = 0; _key < _len; _key++) {
    streams[_key] = arguments[_key];
  }

  var callback = popCallback(streams);
  if (Array.isArray(streams[0])) streams = streams[0];

  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS('streams');
  }

  var error;
  var destroys = streams.map(function (stream, i) {
    var reading = i < streams.length - 1;
    var writing = i > 0;
    return destroyer(stream, reading, writing, function (err) {
      if (!error) error = err;
      if (err) destroys.forEach(call);
      if (reading) return;
      destroys.forEach(call);
      callback(error);
    });
  });
  return streams.reduce(pipe);
}

var pipeline_1 = pipeline;

var readable = createCommonjsModule(function (module, exports) {
if (process.env.READABLE_STREAM === 'disable' && stream$3) {
  module.exports = stream$3.Readable;
  Object.assign(module.exports, stream$3);
  module.exports.Stream = stream$3;
} else {
  exports = module.exports = _stream_readable;
  exports.Stream = stream$3 || exports;
  exports.Readable = exports;
  exports.Writable = _stream_writable;
  exports.Duplex = _stream_duplex;
  exports.Transform = _stream_transform;
  exports.PassThrough = _stream_passthrough;
  exports.finished = endOfStream;
  exports.pipeline = pipeline_1;
}
});

var utils$1 = spdyTransport.utils;



var debug$1 = src('spdy:scheduler');
var Readable$1 = readable.Readable;

/*
 * We create following structure in `pending`:
 * [ [ id = 0 ], [ id = 1 ], [ id = 2 ], [ id = 0 ] ]
 *     chunks      chunks      chunks      chunks
 *     chunks                  chunks
 *     chunks
 *
 * Then on the `.tick()` pass we pick one chunks from each item and remove the
 * item if it is empty:
 *
 * [ [ id = 0 ], [ id = 2 ] ]
 *     chunks      chunks
 *     chunks
 *
 * Writing out: chunks for 0, chunks for 1, chunks for 2, chunks for 0
 *
 * This way data is interleaved between the different streams.
 */

function Scheduler (options) {
  Readable$1.call(this);

  // Pretty big window by default
  this.window = 0.25;

  if (options && options.window) { this.window = options.window; }

  this.sync = [];
  this.list = [];
  this.count = 0;
  this.pendingTick = false;
}
util$6.inherits(Scheduler, Readable$1);
var scheduler = Scheduler;

// Just for testing, really
Scheduler.create = function create (options) {
  return new Scheduler(options)
};

function insertCompare (a, b) {
  return a.priority === b.priority
    ? a.stream - b.stream
    : b.priority - a.priority
}

Scheduler.prototype.schedule = function schedule (data) {
  var priority = data.priority;
  var stream = data.stream;
  var chunks = data.chunks;

  // Synchronous frames should not be interleaved
  if (priority === false) {
    debug$1('queue sync', chunks);
    this.sync.push(data);
    this.count += chunks.length;

    this._read();
    return
  }

  debug$1('queue async priority=%d stream=%d', priority, stream, chunks);
  var item = new SchedulerItem(stream, priority);
  var index = utils$1.binaryLookup(this.list, item, insertCompare);

  // Push new item
  if (index >= this.list.length || insertCompare(this.list[index], item) !== 0) {
    this.list.splice(index, 0, item);
  } else { // Coalesce
    item = this.list[index];
  }

  item.push(data);

  this.count += chunks.length;

  this._read();
};

Scheduler.prototype._read = function _read () {
  if (this.count === 0) {
    return
  }

  if (this.pendingTick) {
    return
  }
  this.pendingTick = true;

  var self = this;
  process.nextTick(function () {
    self.pendingTick = false;
    self.tick();
  });
};

Scheduler.prototype.tick = function tick () {
  // No luck for async frames
  if (!this.tickSync()) { return false }

  return this.tickAsync()
};

Scheduler.prototype.tickSync = function tickSync () {
  // Empty sync queue first
  var sync = this.sync;
  var res = true;
  this.sync = [];
  for (var i = 0; i < sync.length; i++) {
    var item = sync[i];
    debug$1('tick sync pending=%d', this.count, item.chunks);
    for (var j = 0; j < item.chunks.length; j++) {
      this.count--;
      // TODO: handle stream backoff properly
      try {
        res = this.push(item.chunks[j]);
      } catch (err) {
        this.emit('error', err);
        return false
      }
    }
    debug$1('after tick sync pending=%d', this.count);

    // TODO(indutny): figure out the way to invoke callback on actual write
    if (item.callback) {
      item.callback(null);
    }
  }
  return res
};

Scheduler.prototype.tickAsync = function tickAsync () {
  var res = true;
  var list = this.list;
  if (list.length === 0) {
    return res
  }

  var startPriority = list[0].priority;
  for (var index = 0; list.length > 0; index++) {
    // Loop index
    index %= list.length;
    if (startPriority - list[index].priority > this.window) { index = 0; }
    debug$1('tick async index=%d start=%d', index, startPriority);

    var current = list[index];
    var item = current.shift();

    if (current.isEmpty()) {
      list.splice(index, 1);
      if (index === 0 && list.length > 0) {
        startPriority = list[0].priority;
      }
      index--;
    }

    debug$1('tick async pending=%d', this.count, item.chunks);
    for (var i = 0; i < item.chunks.length; i++) {
      this.count--;
      // TODO: handle stream backoff properly
      try {
        res = this.push(item.chunks[i]);
      } catch (err) {
        this.emit('error', err);
        return false
      }
    }
    debug$1('after tick pending=%d', this.count);

    // TODO(indutny): figure out the way to invoke callback on actual write
    if (item.callback) {
      item.callback(null);
    }
    if (!res) { break }
  }

  return res
};

Scheduler.prototype.dump = function dump () {
  this.tickSync();

  // Write everything out
  while (!this.tickAsync()) {
    // Intentional no-op
  }
  assert$7.strictEqual(this.count, 0);
};

function SchedulerItem (stream, priority) {
  this.stream = stream;
  this.priority = priority;
  this.queue = [];
}

SchedulerItem.prototype.push = function push (chunks) {
  this.queue.push(chunks);
};

SchedulerItem.prototype.shift = function shift () {
  return this.queue.shift()
};

SchedulerItem.prototype.isEmpty = function isEmpty () {
  return this.queue.length === 0
};

var Buffer$7 = buffer.Buffer;

function OffsetBuffer() {
  this.offset = 0;
  this.size = 0;
  this.buffers = [];
}
var obuf = OffsetBuffer;

OffsetBuffer.prototype.isEmpty = function isEmpty() {
  return this.size === 0;
};

OffsetBuffer.prototype.clone = function clone(size) {
  var r = new OffsetBuffer();
  r.offset = this.offset;
  r.size = size;
  r.buffers = this.buffers.slice();
  return r;
};

OffsetBuffer.prototype.toChunks = function toChunks() {
  if (this.size === 0)
    return [];

  // We are going to slice it anyway
  if (this.offset !== 0) {
    this.buffers[0] = this.buffers[0].slice(this.offset);
    this.offset = 0;
  }

  var chunks = [ ];
  var off = 0;
  for (var i = 0; off <= this.size && i < this.buffers.length; i++) {
    var buf = this.buffers[i];
    off += buf.length;

    // Slice off last buffer
    if (off > this.size) {
      buf = buf.slice(0, buf.length - (off - this.size));
      this.buffers[i] = buf;
    }

    chunks.push(buf);
  }

  // If some buffers were skipped - trim length
  if (i < this.buffers.length)
    this.buffers.length = i;

  return chunks;
};

OffsetBuffer.prototype.toString = function toString(enc) {
  return this.toChunks().map(function(c) {
    return c.toString(enc);
  }).join('');
};

OffsetBuffer.prototype.use = function use(buf, off, n) {
  this.buffers = [ buf ];
  this.offset = off;
  this.size = n;
};

OffsetBuffer.prototype.push = function push(data) {
  // Ignore empty writes
  if (data.length === 0)
    return;

  this.size += data.length;
  this.buffers.push(data);
};

OffsetBuffer.prototype.has = function has(n) {
  return this.size >= n;
};

OffsetBuffer.prototype.skip = function skip(n) {
  if (this.size === 0)
    return;

  this.size -= n;

  // Fast case, skip bytes in a first buffer
  if (this.offset + n < this.buffers[0].length) {
    this.offset += n;
    return;
  }

  var left = n - (this.buffers[0].length - this.offset);
  this.offset = 0;

  for (var shift = 1; left > 0 && shift < this.buffers.length; shift++) {
    var buf = this.buffers[shift];
    if (buf.length > left) {
      this.offset = left;
      break;
    }
    left -= buf.length;
  }
  this.buffers = this.buffers.slice(shift);
};

OffsetBuffer.prototype.copy = function copy(target, targetOff, off, n) {
  if (this.size === 0)
    return;
  if (off !== 0)
    throw new Error('Unsupported offset in .copy()');

  var toff = targetOff;
  var first = this.buffers[0];
  var toCopy = Math.min(n, first.length - this.offset);
  first.copy(target, toff, this.offset, this.offset + toCopy);

  toff += toCopy;
  var left = n - toCopy;
  for (var i = 1; left > 0 && i < this.buffers.length; i++) {
    var buf = this.buffers[i];
    var toCopy = Math.min(left, buf.length);

    buf.copy(target, toff, 0, toCopy);

    toff += toCopy;
    left -= toCopy;
  }
};

OffsetBuffer.prototype.take = function take(n) {
  if (n === 0)
    return new Buffer$7(0);

  this.size -= n;

  // Fast cases
  var first = this.buffers[0].length - this.offset;
  if (first === n) {
    var r = this.buffers.shift();
    if (this.offset !== 0) {
      r = r.slice(this.offset);
      this.offset = 0;
    }
    return r;
  } else if (first > n) {
    var r = this.buffers[0].slice(this.offset, this.offset + n);
    this.offset += n;
    return r;
  }

  // Allocate and fill buffer
  var out = new Buffer$7(n);
  var toOff = 0;
  var startOff = this.offset;
  for (var i = 0; toOff !== n && i < this.buffers.length; i++) {
    var buf = this.buffers[i];
    var toCopy = Math.min(buf.length - startOff, n - toOff);

    buf.copy(out, toOff, startOff, startOff + toCopy);
    if (startOff + toCopy < buf.length) {
      this.offset = startOff + toCopy;
      break;
    } else {
      toOff += toCopy;
      startOff = 0;
    }
  }

  this.buffers = this.buffers.slice(i);
  if (this.buffers.length === 0)
    this.offset = 0;

  return out;
};

OffsetBuffer.prototype.peekUInt8 = function peekUInt8() {
  return this.buffers[0][this.offset];
};

OffsetBuffer.prototype.readUInt8 = function readUInt8() {
  this.size -= 1;
  var first = this.buffers[0];
  var r = first[this.offset];
  if (++this.offset === first.length) {
    this.offset = 0;
    this.buffers.shift();
  }

  return r;
};

OffsetBuffer.prototype.readUInt16LE = function readUInt16LE() {
  var first = this.buffers[0];
  this.size -= 2;

  var r;
  var shift;

  // Fast case - first buffer has all bytes
  if (first.length - this.offset >= 2) {
    r = first.readUInt16LE(this.offset);
    shift = 0;
    this.offset += 2;

  // One byte here - one byte there
  } else {
    r = first[this.offset] | (this.buffers[1][0] << 8);
    shift = 1;
    this.offset = 1;
  }

  if (this.offset === this.buffers[shift].length) {
    this.offset = 0;
    shift++;
  }
  if (shift !== 0)
    this.buffers = this.buffers.slice(shift);

  return r;
};

OffsetBuffer.prototype.readUInt24LE = function readUInt24LE() {
  var first = this.buffers[0];

  var r;
  var shift;
  var firstHas = first.length - this.offset;

  // Fast case - first buffer has all bytes
  if (firstHas >= 3) {
    r = first.readUInt16LE(this.offset) | (first[this.offset + 2] << 16);
    shift = 0;
    this.offset += 3;

  // First buffer has 2 of 3 bytes
  } else if (firstHas >= 2) {
    r = first.readUInt16LE(this.offset) | (this.buffers[1][0] << 16);
    shift = 1;
    this.offset = 1;

  // Slow case: First buffer has 1 of 3 bytes
  } else {
    r = first[this.offset];
    this.offset = 0;
    this.buffers.shift();
    this.size -= 1;

    r |= this.readUInt16LE() << 8;
    return r;
  }

  this.size -= 3;
  if (this.offset === this.buffers[shift].length) {
    this.offset = 0;
    shift++;
  }
  if (shift !== 0)
    this.buffers = this.buffers.slice(shift);

  return r;
};

OffsetBuffer.prototype.readUInt32LE = function readUInt32LE() {
  var first = this.buffers[0];

  var r;
  var shift;
  var firstHas = first.length - this.offset;

  // Fast case - first buffer has all bytes
  if (firstHas >= 4) {
    r = first.readUInt32LE(this.offset);
    shift = 0;
    this.offset += 4;

  // First buffer has 3 of 4 bytes
  } else if (firstHas >= 3) {
    r = (first.readUInt16LE(this.offset) |
         (first[this.offset + 2] << 16)) +
        (this.buffers[1][0] * 0x1000000);
    shift = 1;
    this.offset = 1;

  // Slow case: First buffer has 2 of 4 bytes
  } else if (firstHas >= 2) {
    r = first.readUInt16LE(this.offset);
    this.offset = 0;
    this.buffers.shift();
    this.size -= 2;

    r += this.readUInt16LE() * 0x10000;
    return r;

  // Slow case: First buffer has 1 of 4 bytes
  } else {
    r = first[this.offset];
    this.offset = 0;
    this.buffers.shift();
    this.size -= 1;

    r += this.readUInt24LE() * 0x100;
    return r;
  }

  this.size -= 4;
  if (this.offset === this.buffers[shift].length) {
    this.offset = 0;
    shift++;
  }
  if (shift !== 0)
    this.buffers = this.buffers.slice(shift);

  return r;
};

OffsetBuffer.prototype.readUInt16BE = function readUInt16BE() {
  var r = this.readUInt16LE();

  return ((r & 0xff) << 8) | (r >> 8);
};

OffsetBuffer.prototype.readUInt24BE = function readUInt24BE() {
  var r = this.readUInt24LE();

  return ((r & 0xff) << 16) | (((r >> 8) & 0xff) << 8) | (r >> 16);
};

OffsetBuffer.prototype.readUInt32BE = function readUInt32BE() {
  var r = this.readUInt32LE();

  return (((r & 0xff) << 24) |
          (((r >>> 8) & 0xff) << 16) |
          (((r >>> 16) & 0xff) << 8) |
          (r >>> 24)) >>> 0;
};

// Signed number APIs

function signedInt8(num) {
  if (num >= 0x80)
    return -(0xff ^ num) - 1;
  else
    return num;
}

OffsetBuffer.prototype.peekInt8 = function peekInt8() {
  return signedInt8(this.peekUInt8());
};

OffsetBuffer.prototype.readInt8 = function readInt8() {
  return signedInt8(this.readUInt8());
};

function signedInt16(num) {
  if (num >= 0x8000)
    return -(0xffff ^ num) - 1;
  else
    return num;
}

OffsetBuffer.prototype.readInt16BE = function readInt16BE() {
  return signedInt16(this.readUInt16BE());
};

OffsetBuffer.prototype.readInt16LE = function readInt16LE() {
  return signedInt16(this.readUInt16LE());
};

function signedInt24(num) {
  if (num >= 0x800000)
    return -(0xffffff ^ num) - 1;
  else
    return num;
}

OffsetBuffer.prototype.readInt24BE = function readInt24BE() {
  return signedInt24(this.readUInt24BE());
};

OffsetBuffer.prototype.readInt24LE = function readInt24LE() {
  return signedInt24(this.readUInt24LE());
};

function signedInt32(num) {
  if (num >= 0x80000000)
    return -(0xffffffff ^ num) - 1;
  else
    return num;
}

OffsetBuffer.prototype.readInt32BE = function readInt32BE() {
  return signedInt32(this.readUInt32BE());
};

OffsetBuffer.prototype.readInt32LE = function readInt32LE() {
  return signedInt32(this.readUInt32LE());
};

var utils$2 = base.utils;

var Transform$1 = readable.Transform;

function Parser (options) {
  Transform$1.call(this, {
    readableObjectMode: true
  });

  this.buffer = new obuf();
  this.partial = false;
  this.waiting = 0;

  this.window = options.window;

  this.version = null;
  this.decompress = null;
  this.dead = false;
}
var parser = Parser;
util$6.inherits(Parser, Transform$1);

Parser.prototype.error = utils$2.error;

Parser.prototype.kill = function kill () {
  this.dead = true;
};

Parser.prototype._transform = function transform (data, encoding, cb) {
  if (!this.dead) { this.buffer.push(data); }

  this._consume(cb);
};

Parser.prototype._consume = function _consume (cb) {
  var self = this;

  function next (err, frame) {
    if (err) {
      return cb(err)
    }

    if (Array.isArray(frame)) {
      for (var i = 0; i < frame.length; i++) {
        self.push(frame[i]);
      }
    } else if (frame) {
      self.push(frame);
    }

    // Consume more packets
    if (!sync) {
      return self._consume(cb)
    }

    process.nextTick(function () {
      self._consume(cb);
    });
  }

  if (this.dead) {
    return cb()
  }

  if (this.buffer.size < this.waiting) {
    // No data at all
    if (this.buffer.size === 0) {
      return cb()
    }

    // Partial DATA frame or something that we can process partially
    if (this.partial) {
      var partial = this.buffer.clone(this.buffer.size);
      this.buffer.skip(partial.size);
      this.waiting -= partial.size;

      this.executePartial(partial, next);
      return
    }

    // We shall not do anything until we get all expected data
    return cb()
  }

  var sync = true;

  var content = this.buffer.clone(this.waiting);
  this.buffer.skip(this.waiting);

  this.execute(content, next);
  sync = false;
};

Parser.prototype.setVersion = function setVersion (version) {
  this.version = version;
  this.emit('version', version);
};

Parser.prototype.setCompression = function setCompresion (pair) {
  this.decompress = new spdyTransport.utils.LockStream(pair.decompress);
};

var Scheduler$1 = base.Scheduler;

function Framer (options) {
  Scheduler$1.call(this);

  this.version = null;
  this.compress = null;
  this.window = options.window;
  this.timeout = options.timeout;

  // Wait for `enablePush`
  this.pushEnabled = null;
}
util$6.inherits(Framer, Scheduler$1);
var framer = Framer;

Framer.prototype.setVersion = function setVersion (version) {
  this.version = version;
  this.emit('version');
};

Framer.prototype.setCompression = function setCompresion (pair) {
  this.compress = new spdyTransport.utils.LockStream(pair.compress);
};

Framer.prototype.enablePush = function enablePush (enable) {
  this.pushEnabled = enable;
  this.emit('_pushEnabled');
};

Framer.prototype._checkPush = function _checkPush (callback) {
  if (this.pushEnabled === null) {
    this.once('_pushEnabled', function () {
      this._checkPush(callback);
    });
    return
  }

  var err = null;
  if (!this.pushEnabled) {
    err = new Error('PUSH_PROMISE disabled by other side');
  }
  process.nextTick(function () {
    return callback(err)
  });
};

Framer.prototype._resetTimeout = function _resetTimeout () {
  if (this.timeout) {
    this.timeout.reset();
  }
};

var utils$3 = utils_1;
var constants$1 = constants;
var Scheduler$2 = scheduler;
var Parser$1 = parser;
var Framer$1 = framer;

var base = {
	utils: utils$3,
	constants: constants$1,
	Scheduler: Scheduler$2,
	Parser: Parser$1,
	Framer: Framer$1
};

var dictionary = {};
var dictionary_1 = dictionary;

dictionary[2] = Buffer.from([
  'optionsgetheadpostputdeletetraceacceptaccept-charsetaccept-encodingaccept-',
  'languageauthorizationexpectfromhostif-modified-sinceif-matchif-none-matchi',
  'f-rangeif-unmodifiedsincemax-forwardsproxy-authorizationrangerefererteuser',
  '-agent10010120020120220320420520630030130230330430530630740040140240340440',
  '5406407408409410411412413414415416417500501502503504505accept-rangesageeta',
  'glocationproxy-authenticatepublicretry-afterservervarywarningwww-authentic',
  'ateallowcontent-basecontent-encodingcache-controlconnectiondatetrailertran',
  'sfer-encodingupgradeviawarningcontent-languagecontent-lengthcontent-locati',
  'oncontent-md5content-rangecontent-typeetagexpireslast-modifiedset-cookieMo',
  'ndayTuesdayWednesdayThursdayFridaySaturdaySundayJanFebMarAprMayJunJulAugSe',
  'pOctNovDecchunkedtext/htmlimage/pngimage/jpgimage/gifapplication/xmlapplic',
  'ation/xhtmltext/plainpublicmax-agecharset=iso-8859-1utf-8gzipdeflateHTTP/1',
  '.1statusversionurl\x00'
].join(''));

dictionary[3] = Buffer.from([
  0x00, 0x00, 0x00, 0x07, 0x6f, 0x70, 0x74, 0x69, // ....opti
  0x6f, 0x6e, 0x73, 0x00, 0x00, 0x00, 0x04, 0x68, // ons....h
  0x65, 0x61, 0x64, 0x00, 0x00, 0x00, 0x04, 0x70, // ead....p
  0x6f, 0x73, 0x74, 0x00, 0x00, 0x00, 0x03, 0x70, // ost....p
  0x75, 0x74, 0x00, 0x00, 0x00, 0x06, 0x64, 0x65, // ut....de
  0x6c, 0x65, 0x74, 0x65, 0x00, 0x00, 0x00, 0x05, // lete....
  0x74, 0x72, 0x61, 0x63, 0x65, 0x00, 0x00, 0x00, // trace...
  0x06, 0x61, 0x63, 0x63, 0x65, 0x70, 0x74, 0x00, // .accept.
  0x00, 0x00, 0x0e, 0x61, 0x63, 0x63, 0x65, 0x70, // ...accep
  0x74, 0x2d, 0x63, 0x68, 0x61, 0x72, 0x73, 0x65, // t-charse
  0x74, 0x00, 0x00, 0x00, 0x0f, 0x61, 0x63, 0x63, // t....acc
  0x65, 0x70, 0x74, 0x2d, 0x65, 0x6e, 0x63, 0x6f, // ept-enco
  0x64, 0x69, 0x6e, 0x67, 0x00, 0x00, 0x00, 0x0f, // ding....
  0x61, 0x63, 0x63, 0x65, 0x70, 0x74, 0x2d, 0x6c, // accept-l
  0x61, 0x6e, 0x67, 0x75, 0x61, 0x67, 0x65, 0x00, // anguage.
  0x00, 0x00, 0x0d, 0x61, 0x63, 0x63, 0x65, 0x70, // ...accep
  0x74, 0x2d, 0x72, 0x61, 0x6e, 0x67, 0x65, 0x73, // t-ranges
  0x00, 0x00, 0x00, 0x03, 0x61, 0x67, 0x65, 0x00, // ....age.
  0x00, 0x00, 0x05, 0x61, 0x6c, 0x6c, 0x6f, 0x77, // ...allow
  0x00, 0x00, 0x00, 0x0d, 0x61, 0x75, 0x74, 0x68, // ....auth
  0x6f, 0x72, 0x69, 0x7a, 0x61, 0x74, 0x69, 0x6f, // orizatio
  0x6e, 0x00, 0x00, 0x00, 0x0d, 0x63, 0x61, 0x63, // n....cac
  0x68, 0x65, 0x2d, 0x63, 0x6f, 0x6e, 0x74, 0x72, // he-contr
  0x6f, 0x6c, 0x00, 0x00, 0x00, 0x0a, 0x63, 0x6f, // ol....co
  0x6e, 0x6e, 0x65, 0x63, 0x74, 0x69, 0x6f, 0x6e, // nnection
  0x00, 0x00, 0x00, 0x0c, 0x63, 0x6f, 0x6e, 0x74, // ....cont
  0x65, 0x6e, 0x74, 0x2d, 0x62, 0x61, 0x73, 0x65, // ent-base
  0x00, 0x00, 0x00, 0x10, 0x63, 0x6f, 0x6e, 0x74, // ....cont
  0x65, 0x6e, 0x74, 0x2d, 0x65, 0x6e, 0x63, 0x6f, // ent-enco
  0x64, 0x69, 0x6e, 0x67, 0x00, 0x00, 0x00, 0x10, // ding....
  0x63, 0x6f, 0x6e, 0x74, 0x65, 0x6e, 0x74, 0x2d, // content-
  0x6c, 0x61, 0x6e, 0x67, 0x75, 0x61, 0x67, 0x65, // language
  0x00, 0x00, 0x00, 0x0e, 0x63, 0x6f, 0x6e, 0x74, // ....cont
  0x65, 0x6e, 0x74, 0x2d, 0x6c, 0x65, 0x6e, 0x67, // ent-leng
  0x74, 0x68, 0x00, 0x00, 0x00, 0x10, 0x63, 0x6f, // th....co
  0x6e, 0x74, 0x65, 0x6e, 0x74, 0x2d, 0x6c, 0x6f, // ntent-lo
  0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x00, 0x00, // cation..
  0x00, 0x0b, 0x63, 0x6f, 0x6e, 0x74, 0x65, 0x6e, // ..conten
  0x74, 0x2d, 0x6d, 0x64, 0x35, 0x00, 0x00, 0x00, // t-md5...
  0x0d, 0x63, 0x6f, 0x6e, 0x74, 0x65, 0x6e, 0x74, // .content
  0x2d, 0x72, 0x61, 0x6e, 0x67, 0x65, 0x00, 0x00, // -range..
  0x00, 0x0c, 0x63, 0x6f, 0x6e, 0x74, 0x65, 0x6e, // ..conten
  0x74, 0x2d, 0x74, 0x79, 0x70, 0x65, 0x00, 0x00, // t-type..
  0x00, 0x04, 0x64, 0x61, 0x74, 0x65, 0x00, 0x00, // ..date..
  0x00, 0x04, 0x65, 0x74, 0x61, 0x67, 0x00, 0x00, // ..etag..
  0x00, 0x06, 0x65, 0x78, 0x70, 0x65, 0x63, 0x74, // ..expect
  0x00, 0x00, 0x00, 0x07, 0x65, 0x78, 0x70, 0x69, // ....expi
  0x72, 0x65, 0x73, 0x00, 0x00, 0x00, 0x04, 0x66, // res....f
  0x72, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x04, 0x68, // rom....h
  0x6f, 0x73, 0x74, 0x00, 0x00, 0x00, 0x08, 0x69, // ost....i
  0x66, 0x2d, 0x6d, 0x61, 0x74, 0x63, 0x68, 0x00, // f-match.
  0x00, 0x00, 0x11, 0x69, 0x66, 0x2d, 0x6d, 0x6f, // ...if-mo
  0x64, 0x69, 0x66, 0x69, 0x65, 0x64, 0x2d, 0x73, // dified-s
  0x69, 0x6e, 0x63, 0x65, 0x00, 0x00, 0x00, 0x0d, // ince....
  0x69, 0x66, 0x2d, 0x6e, 0x6f, 0x6e, 0x65, 0x2d, // if-none-
  0x6d, 0x61, 0x74, 0x63, 0x68, 0x00, 0x00, 0x00, // match...
  0x08, 0x69, 0x66, 0x2d, 0x72, 0x61, 0x6e, 0x67, // .if-rang
  0x65, 0x00, 0x00, 0x00, 0x13, 0x69, 0x66, 0x2d, // e....if-
  0x75, 0x6e, 0x6d, 0x6f, 0x64, 0x69, 0x66, 0x69, // unmodifi
  0x65, 0x64, 0x2d, 0x73, 0x69, 0x6e, 0x63, 0x65, // ed-since
  0x00, 0x00, 0x00, 0x0d, 0x6c, 0x61, 0x73, 0x74, // ....last
  0x2d, 0x6d, 0x6f, 0x64, 0x69, 0x66, 0x69, 0x65, // -modifie
  0x64, 0x00, 0x00, 0x00, 0x08, 0x6c, 0x6f, 0x63, // d....loc
  0x61, 0x74, 0x69, 0x6f, 0x6e, 0x00, 0x00, 0x00, // ation...
  0x0c, 0x6d, 0x61, 0x78, 0x2d, 0x66, 0x6f, 0x72, // .max-for
  0x77, 0x61, 0x72, 0x64, 0x73, 0x00, 0x00, 0x00, // wards...
  0x06, 0x70, 0x72, 0x61, 0x67, 0x6d, 0x61, 0x00, // .pragma.
  0x00, 0x00, 0x12, 0x70, 0x72, 0x6f, 0x78, 0x79, // ...proxy
  0x2d, 0x61, 0x75, 0x74, 0x68, 0x65, 0x6e, 0x74, // -authent
  0x69, 0x63, 0x61, 0x74, 0x65, 0x00, 0x00, 0x00, // icate...
  0x13, 0x70, 0x72, 0x6f, 0x78, 0x79, 0x2d, 0x61, // .proxy-a
  0x75, 0x74, 0x68, 0x6f, 0x72, 0x69, 0x7a, 0x61, // uthoriza
  0x74, 0x69, 0x6f, 0x6e, 0x00, 0x00, 0x00, 0x05, // tion....
  0x72, 0x61, 0x6e, 0x67, 0x65, 0x00, 0x00, 0x00, // range...
  0x07, 0x72, 0x65, 0x66, 0x65, 0x72, 0x65, 0x72, // .referer
  0x00, 0x00, 0x00, 0x0b, 0x72, 0x65, 0x74, 0x72, // ....retr
  0x79, 0x2d, 0x61, 0x66, 0x74, 0x65, 0x72, 0x00, // y-after.
  0x00, 0x00, 0x06, 0x73, 0x65, 0x72, 0x76, 0x65, // ...serve
  0x72, 0x00, 0x00, 0x00, 0x02, 0x74, 0x65, 0x00, // r....te.
  0x00, 0x00, 0x07, 0x74, 0x72, 0x61, 0x69, 0x6c, // ...trail
  0x65, 0x72, 0x00, 0x00, 0x00, 0x11, 0x74, 0x72, // er....tr
  0x61, 0x6e, 0x73, 0x66, 0x65, 0x72, 0x2d, 0x65, // ansfer-e
  0x6e, 0x63, 0x6f, 0x64, 0x69, 0x6e, 0x67, 0x00, // ncoding.
  0x00, 0x00, 0x07, 0x75, 0x70, 0x67, 0x72, 0x61, // ...upgra
  0x64, 0x65, 0x00, 0x00, 0x00, 0x0a, 0x75, 0x73, // de....us
  0x65, 0x72, 0x2d, 0x61, 0x67, 0x65, 0x6e, 0x74, // er-agent
  0x00, 0x00, 0x00, 0x04, 0x76, 0x61, 0x72, 0x79, // ....vary
  0x00, 0x00, 0x00, 0x03, 0x76, 0x69, 0x61, 0x00, // ....via.
  0x00, 0x00, 0x07, 0x77, 0x61, 0x72, 0x6e, 0x69, // ...warni
  0x6e, 0x67, 0x00, 0x00, 0x00, 0x10, 0x77, 0x77, // ng....ww
  0x77, 0x2d, 0x61, 0x75, 0x74, 0x68, 0x65, 0x6e, // w-authen
  0x74, 0x69, 0x63, 0x61, 0x74, 0x65, 0x00, 0x00, // ticate..
  0x00, 0x06, 0x6d, 0x65, 0x74, 0x68, 0x6f, 0x64, // ..method
  0x00, 0x00, 0x00, 0x03, 0x67, 0x65, 0x74, 0x00, // ....get.
  0x00, 0x00, 0x06, 0x73, 0x74, 0x61, 0x74, 0x75, // ...statu
  0x73, 0x00, 0x00, 0x00, 0x06, 0x32, 0x30, 0x30, // s....200
  0x20, 0x4f, 0x4b, 0x00, 0x00, 0x00, 0x07, 0x76, // .OK....v
  0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x00, 0x00, // ersion..
  0x00, 0x08, 0x48, 0x54, 0x54, 0x50, 0x2f, 0x31, // ..HTTP.1
  0x2e, 0x31, 0x00, 0x00, 0x00, 0x03, 0x75, 0x72, // .1....ur
  0x6c, 0x00, 0x00, 0x00, 0x06, 0x70, 0x75, 0x62, // l....pub
  0x6c, 0x69, 0x63, 0x00, 0x00, 0x00, 0x0a, 0x73, // lic....s
  0x65, 0x74, 0x2d, 0x63, 0x6f, 0x6f, 0x6b, 0x69, // et-cooki
  0x65, 0x00, 0x00, 0x00, 0x0a, 0x6b, 0x65, 0x65, // e....kee
  0x70, 0x2d, 0x61, 0x6c, 0x69, 0x76, 0x65, 0x00, // p-alive.
  0x00, 0x00, 0x06, 0x6f, 0x72, 0x69, 0x67, 0x69, // ...origi
  0x6e, 0x31, 0x30, 0x30, 0x31, 0x30, 0x31, 0x32, // n1001012
  0x30, 0x31, 0x32, 0x30, 0x32, 0x32, 0x30, 0x35, // 01202205
  0x32, 0x30, 0x36, 0x33, 0x30, 0x30, 0x33, 0x30, // 20630030
  0x32, 0x33, 0x30, 0x33, 0x33, 0x30, 0x34, 0x33, // 23033043
  0x30, 0x35, 0x33, 0x30, 0x36, 0x33, 0x30, 0x37, // 05306307
  0x34, 0x30, 0x32, 0x34, 0x30, 0x35, 0x34, 0x30, // 40240540
  0x36, 0x34, 0x30, 0x37, 0x34, 0x30, 0x38, 0x34, // 64074084
  0x30, 0x39, 0x34, 0x31, 0x30, 0x34, 0x31, 0x31, // 09410411
  0x34, 0x31, 0x32, 0x34, 0x31, 0x33, 0x34, 0x31, // 41241341
  0x34, 0x34, 0x31, 0x35, 0x34, 0x31, 0x36, 0x34, // 44154164
  0x31, 0x37, 0x35, 0x30, 0x32, 0x35, 0x30, 0x34, // 17502504
  0x35, 0x30, 0x35, 0x32, 0x30, 0x33, 0x20, 0x4e, // 505203.N
  0x6f, 0x6e, 0x2d, 0x41, 0x75, 0x74, 0x68, 0x6f, // on-Autho
  0x72, 0x69, 0x74, 0x61, 0x74, 0x69, 0x76, 0x65, // ritative
  0x20, 0x49, 0x6e, 0x66, 0x6f, 0x72, 0x6d, 0x61, // .Informa
  0x74, 0x69, 0x6f, 0x6e, 0x32, 0x30, 0x34, 0x20, // tion204.
  0x4e, 0x6f, 0x20, 0x43, 0x6f, 0x6e, 0x74, 0x65, // No.Conte
  0x6e, 0x74, 0x33, 0x30, 0x31, 0x20, 0x4d, 0x6f, // nt301.Mo
  0x76, 0x65, 0x64, 0x20, 0x50, 0x65, 0x72, 0x6d, // ved.Perm
  0x61, 0x6e, 0x65, 0x6e, 0x74, 0x6c, 0x79, 0x34, // anently4
  0x30, 0x30, 0x20, 0x42, 0x61, 0x64, 0x20, 0x52, // 00.Bad.R
  0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x34, 0x30, // equest40
  0x31, 0x20, 0x55, 0x6e, 0x61, 0x75, 0x74, 0x68, // 1.Unauth
  0x6f, 0x72, 0x69, 0x7a, 0x65, 0x64, 0x34, 0x30, // orized40
  0x33, 0x20, 0x46, 0x6f, 0x72, 0x62, 0x69, 0x64, // 3.Forbid
  0x64, 0x65, 0x6e, 0x34, 0x30, 0x34, 0x20, 0x4e, // den404.N
  0x6f, 0x74, 0x20, 0x46, 0x6f, 0x75, 0x6e, 0x64, // ot.Found
  0x35, 0x30, 0x30, 0x20, 0x49, 0x6e, 0x74, 0x65, // 500.Inte
  0x72, 0x6e, 0x61, 0x6c, 0x20, 0x53, 0x65, 0x72, // rnal.Ser
  0x76, 0x65, 0x72, 0x20, 0x45, 0x72, 0x72, 0x6f, // ver.Erro
  0x72, 0x35, 0x30, 0x31, 0x20, 0x4e, 0x6f, 0x74, // r501.Not
  0x20, 0x49, 0x6d, 0x70, 0x6c, 0x65, 0x6d, 0x65, // .Impleme
  0x6e, 0x74, 0x65, 0x64, 0x35, 0x30, 0x33, 0x20, // nted503.
  0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x20, // Service.
  0x55, 0x6e, 0x61, 0x76, 0x61, 0x69, 0x6c, 0x61, // Unavaila
  0x62, 0x6c, 0x65, 0x4a, 0x61, 0x6e, 0x20, 0x46, // bleJan.F
  0x65, 0x62, 0x20, 0x4d, 0x61, 0x72, 0x20, 0x41, // eb.Mar.A
  0x70, 0x72, 0x20, 0x4d, 0x61, 0x79, 0x20, 0x4a, // pr.May.J
  0x75, 0x6e, 0x20, 0x4a, 0x75, 0x6c, 0x20, 0x41, // un.Jul.A
  0x75, 0x67, 0x20, 0x53, 0x65, 0x70, 0x74, 0x20, // ug.Sept.
  0x4f, 0x63, 0x74, 0x20, 0x4e, 0x6f, 0x76, 0x20, // Oct.Nov.
  0x44, 0x65, 0x63, 0x20, 0x30, 0x30, 0x3a, 0x30, // Dec.00.0
  0x30, 0x3a, 0x30, 0x30, 0x20, 0x4d, 0x6f, 0x6e, // 0.00.Mon
  0x2c, 0x20, 0x54, 0x75, 0x65, 0x2c, 0x20, 0x57, // ..Tue..W
  0x65, 0x64, 0x2c, 0x20, 0x54, 0x68, 0x75, 0x2c, // ed..Thu.
  0x20, 0x46, 0x72, 0x69, 0x2c, 0x20, 0x53, 0x61, // .Fri..Sa
  0x74, 0x2c, 0x20, 0x53, 0x75, 0x6e, 0x2c, 0x20, // t..Sun..
  0x47, 0x4d, 0x54, 0x63, 0x68, 0x75, 0x6e, 0x6b, // GMTchunk
  0x65, 0x64, 0x2c, 0x74, 0x65, 0x78, 0x74, 0x2f, // ed.text.
  0x68, 0x74, 0x6d, 0x6c, 0x2c, 0x69, 0x6d, 0x61, // html.ima
  0x67, 0x65, 0x2f, 0x70, 0x6e, 0x67, 0x2c, 0x69, // ge.png.i
  0x6d, 0x61, 0x67, 0x65, 0x2f, 0x6a, 0x70, 0x67, // mage.jpg
  0x2c, 0x69, 0x6d, 0x61, 0x67, 0x65, 0x2f, 0x67, // .image.g
  0x69, 0x66, 0x2c, 0x61, 0x70, 0x70, 0x6c, 0x69, // if.appli
  0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x78, // cation.x
  0x6d, 0x6c, 0x2c, 0x61, 0x70, 0x70, 0x6c, 0x69, // ml.appli
  0x63, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x2f, 0x78, // cation.x
  0x68, 0x74, 0x6d, 0x6c, 0x2b, 0x78, 0x6d, 0x6c, // html.xml
  0x2c, 0x74, 0x65, 0x78, 0x74, 0x2f, 0x70, 0x6c, // .text.pl
  0x61, 0x69, 0x6e, 0x2c, 0x74, 0x65, 0x78, 0x74, // ain.text
  0x2f, 0x6a, 0x61, 0x76, 0x61, 0x73, 0x63, 0x72, // .javascr
  0x69, 0x70, 0x74, 0x2c, 0x70, 0x75, 0x62, 0x6c, // ipt.publ
  0x69, 0x63, 0x70, 0x72, 0x69, 0x76, 0x61, 0x74, // icprivat
  0x65, 0x6d, 0x61, 0x78, 0x2d, 0x61, 0x67, 0x65, // emax-age
  0x3d, 0x67, 0x7a, 0x69, 0x70, 0x2c, 0x64, 0x65, // .gzip.de
  0x66, 0x6c, 0x61, 0x74, 0x65, 0x2c, 0x73, 0x64, // flate.sd
  0x63, 0x68, 0x63, 0x68, 0x61, 0x72, 0x73, 0x65, // chcharse
  0x74, 0x3d, 0x75, 0x74, 0x66, 0x2d, 0x38, 0x63, // t.utf-8c
  0x68, 0x61, 0x72, 0x73, 0x65, 0x74, 0x3d, 0x69, // harset.i
  0x73, 0x6f, 0x2d, 0x38, 0x38, 0x35, 0x39, 0x2d, // so-8859-
  0x31, 0x2c, 0x75, 0x74, 0x66, 0x2d, 0x2c, 0x2a, // 1.utf-..
  0x2c, 0x65, 0x6e, 0x71, 0x3d, 0x30, 0x2e // .enq.0.
]);

dictionary[3.1] = dictionary[3];

var constants$2 = createCommonjsModule(function (module, exports) {


var base = spdyTransport.protocol.base;

exports.FRAME_HEADER_SIZE = 8;

exports.PING_OPAQUE_SIZE = 4;

exports.MAX_CONCURRENT_STREAMS = Infinity;
exports.DEFAULT_MAX_HEADER_LIST_SIZE = Infinity;

exports.DEFAULT_WEIGHT = 16;

exports.frameType = {
  SYN_STREAM: 1,
  SYN_REPLY: 2,
  RST_STREAM: 3,
  SETTINGS: 4,
  PING: 6,
  GOAWAY: 7,
  HEADERS: 8,
  WINDOW_UPDATE: 9,

  // Custom
  X_FORWARDED_FOR: 0xf000
};

exports.flags = {
  FLAG_FIN: 0x01,
  FLAG_COMPRESSED: 0x02,
  FLAG_UNIDIRECTIONAL: 0x02
};

exports.error = {
  PROTOCOL_ERROR: 1,
  INVALID_STREAM: 2,
  REFUSED_STREAM: 3,
  UNSUPPORTED_VERSION: 4,
  CANCEL: 5,
  INTERNAL_ERROR: 6,
  FLOW_CONTROL_ERROR: 7,
  STREAM_IN_USE: 8,
  // STREAM_ALREADY_CLOSED: 9
  STREAM_CLOSED: 9,
  INVALID_CREDENTIALS: 10,
  FRAME_TOO_LARGE: 11
};
exports.errorByCode = base.utils.reverse(exports.error);

exports.settings = {
  FLAG_SETTINGS_PERSIST_VALUE: 1,
  FLAG_SETTINGS_PERSISTED: 2,

  SETTINGS_UPLOAD_BANDWIDTH: 1,
  SETTINGS_DOWNLOAD_BANDWIDTH: 2,
  SETTINGS_ROUND_TRIP_TIME: 3,
  SETTINGS_MAX_CONCURRENT_STREAMS: 4,
  SETTINGS_CURRENT_CWND: 5,
  SETTINGS_DOWNLOAD_RETRANS_RATE: 6,
  SETTINGS_INITIAL_WINDOW_SIZE: 7,
  SETTINGS_CLIENT_CERTIFICATE_VECTOR_SIZE: 8
};

exports.settingsIndex = [
  null,

  'upload_bandwidth',
  'download_bandwidth',
  'round_trip_time',
  'max_concurrent_streams',
  'current_cwnd',
  'download_retrans_rate',
  'initial_window_size',
  'client_certificate_vector_size'
];

exports.DEFAULT_WINDOW = 64 * 1024;
exports.MAX_INITIAL_WINDOW_SIZE = 2147483647;

exports.goaway = {
  OK: 0,
  PROTOCOL_ERROR: 1,
  INTERNAL_ERROR: 2
};
exports.goawayByCode = base.utils.reverse(exports.goaway);

exports.statusReason = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing', // RFC 2518, obsoleted by RFC 4918
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status', // RFC 4918
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Moved Temporarily',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect', // RFC 7238
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Time-out',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Large',
  415: 'Unsupported Media Type',
  416: 'Requested Range Not Satisfiable',
  417: 'Expectation Failed',
  418: 'I\'m a teapot', // RFC 2324
  422: 'Unprocessable Entity', // RFC 4918
  423: 'Locked', // RFC 4918
  424: 'Failed Dependency', // RFC 4918
  425: 'Unordered Collection', // RFC 4918
  426: 'Upgrade Required', // RFC 2817
  428: 'Precondition Required', // RFC 6585
  429: 'Too Many Requests', // RFC 6585
  431: 'Request Header Fields Too Large', // RFC 6585
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Time-out',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates', // RFC 2295
  507: 'Insufficient Storage', // RFC 4918
  509: 'Bandwidth Limit Exceeded',
  510: 'Not Extended', // RFC 2774
  511: 'Network Authentication Required' // RFC 6585
};
});

var parser_1 = createCommonjsModule(function (module, exports) {

var parser = exports;


var base = spdyTransport.protocol.base;
var utils = base.utils;






function Parser (options) {
  base.Parser.call(this, options);

  this.isServer = options.isServer;
  this.waiting = constants$2.FRAME_HEADER_SIZE;
  this.state = 'frame-head';
  this.pendingHeader = null;
}
util$6.inherits(Parser, base.Parser);

parser.create = function create (options) {
  return new Parser(options)
};

Parser.prototype.setMaxFrameSize = function setMaxFrameSize (size) {
  // http2-only
};

Parser.prototype.setMaxHeaderListSize = function setMaxHeaderListSize (size) {
  // http2-only
};

// Only for testing
Parser.prototype.skipPreface = function skipPreface () {
};

Parser.prototype.execute = function execute (buffer, callback) {
  if (this.state === 'frame-head') { return this.onFrameHead(buffer, callback) }

  assert$7(this.state === 'frame-body' && this.pendingHeader !== null);

  var self = this;
  var header = this.pendingHeader;
  this.pendingHeader = null;

  this.onFrameBody(header, buffer, function (err, frame) {
    if (err) {
      return callback(err)
    }

    self.state = 'frame-head';
    self.waiting = constants$2.FRAME_HEADER_SIZE;
    self.partial = false;
    callback(null, frame);
  });
};

Parser.prototype.executePartial = function executePartial (buffer, callback) {
  var header = this.pendingHeader;

  if (this.window) {
    this.window.recv.update(-buffer.size);
  }

  // DATA frame
  callback(null, {
    type: 'DATA',
    id: header.id,

    // Partial DATA can't be FIN
    fin: false,
    data: buffer.take(buffer.size)
  });
};

Parser.prototype.onFrameHead = function onFrameHead (buffer, callback) {
  var header = {
    control: (buffer.peekUInt8() & 0x80) === 0x80,
    version: null,
    type: null,
    id: null,
    flags: null,
    length: null
  };

  if (header.control) {
    header.version = buffer.readUInt16BE() & 0x7fff;
    header.type = buffer.readUInt16BE();
  } else {
    header.id = buffer.readUInt32BE(0) & 0x7fffffff;
  }
  header.flags = buffer.readUInt8();
  header.length = buffer.readUInt24BE();

  if (this.version === null && header.control) {
    // TODO(indutny): do ProtocolError here and in the rest of errors
    if (header.version !== 2 && header.version !== 3) {
      return callback(new Error('Unsupported SPDY version: ' + header.version))
    }
    this.setVersion(header.version);
  }

  this.state = 'frame-body';
  this.waiting = header.length;
  this.pendingHeader = header;
  this.partial = !header.control;

  callback(null, null);
};

Parser.prototype.onFrameBody = function onFrameBody (header, buffer, callback) {
  // Data frame
  if (!header.control) {
    // Count received bytes
    if (this.window) {
      this.window.recv.update(-buffer.size);
    }

    // No support for compressed DATA
    if ((header.flags & constants$2.flags.FLAG_COMPRESSED) !== 0) {
      return callback(new Error('DATA compression not supported'))
    }

    if (header.id === 0) {
      return callback(this.error(constants$2.error.PROTOCOL_ERROR,
        'Invalid stream id for DATA'))
    }

    return callback(null, {
      type: 'DATA',
      id: header.id,
      fin: (header.flags & constants$2.flags.FLAG_FIN) !== 0,
      data: buffer.take(buffer.size)
    })
  }

  if (header.type === 0x01 || header.type === 0x02) { // SYN_STREAM or SYN_REPLY
    this.onSynHeadFrame(header.type, header.flags, buffer, callback);
  } else if (header.type === 0x03) { // RST_STREAM
    this.onRSTFrame(buffer, callback);
  } else if (header.type === 0x04) { // SETTINGS
    this.onSettingsFrame(buffer, callback);
  } else if (header.type === 0x05) {
    callback(null, { type: 'NOOP' });
  } else if (header.type === 0x06) { // PING
    this.onPingFrame(buffer, callback);
  } else if (header.type === 0x07) { // GOAWAY
    this.onGoawayFrame(buffer, callback);
  } else if (header.type === 0x08) { // HEADERS
    this.onHeaderFrames(buffer, callback);
  } else if (header.type === 0x09) { // WINDOW_UPDATE
    this.onWindowUpdateFrame(buffer, callback);
  } else if (header.type === 0xf000) { // X-FORWARDED
    this.onXForwardedFrame(buffer, callback);
  } else {
    callback(null, { type: 'unknown: ' + header.type });
  }
};

Parser.prototype._filterHeader = function _filterHeader (headers, name) {
  var res = {};
  var keys = Object.keys(headers);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key !== name) {
      res[key] = headers[key];
    }
  }

  return res
};

Parser.prototype.onSynHeadFrame = function onSynHeadFrame (type,
  flags,
  body,
  callback) {
  var self = this;
  var stream = type === 0x01;
  var offset = stream ? 10 : this.version === 2 ? 6 : 4;

  if (!body.has(offset)) {
    return callback(new Error('SynHead OOB'))
  }

  var head = body.clone(offset);
  body.skip(offset);
  this.parseKVs(body, function (err, headers) {
    if (err) {
      return callback(err)
    }

    if (stream &&
        (!headers[':method'] || !headers[':path'])) {
      return callback(new Error('Missing `:method` and/or `:path` header'))
    }

    var id = head.readUInt32BE() & 0x7fffffff;

    if (id === 0) {
      return callback(self.error(constants$2.error.PROTOCOL_ERROR,
        'Invalid stream id for HEADERS'))
    }

    var associated = stream ? head.readUInt32BE() & 0x7fffffff : 0;
    var priority = stream
      ? head.readUInt8() >> 5
      : utils.weightToPriority(constants$2.DEFAULT_WEIGHT);
    var fin = (flags & constants$2.flags.FLAG_FIN) !== 0;
    var unidir = (flags & constants$2.flags.FLAG_UNIDIRECTIONAL) !== 0;
    var path = headers[':path'];

    var isPush = stream && associated !== 0;

    var weight = utils.priorityToWeight(priority);
    var priorityInfo = {
      weight: weight,
      exclusive: false,
      parent: 0
    };

    if (!isPush) {
      callback(null, {
        type: 'HEADERS',
        id: id,
        priority: priorityInfo,
        fin: fin,
        writable: !unidir,
        headers: headers,
        path: path
      });
      return
    }

    if (stream && !headers[':status']) {
      return callback(new Error('Missing `:status` header'))
    }

    var filteredHeaders = self._filterHeader(headers, ':status');

    callback(null, [ {
      type: 'PUSH_PROMISE',
      id: associated,
      fin: false,
      promisedId: id,
      headers: filteredHeaders,
      path: path
    }, {
      type: 'HEADERS',
      id: id,
      fin: fin,
      priority: priorityInfo,
      writable: true,
      path: undefined,
      headers: {
        ':status': headers[':status']
      }
    }]);
  });
};

Parser.prototype.onHeaderFrames = function onHeaderFrames (body, callback) {
  var offset = this.version === 2 ? 6 : 4;
  if (!body.has(offset)) {
    return callback(new Error('HEADERS OOB'))
  }

  var streamId = body.readUInt32BE() & 0x7fffffff;
  if (this.version === 2) { body.skip(2); }

  this.parseKVs(body, function (err, headers) {
    if (err) { return callback(err) }

    callback(null, {
      type: 'HEADERS',
      priority: {
        parent: 0,
        exclusive: false,
        weight: constants$2.DEFAULT_WEIGHT
      },
      id: streamId,
      fin: false,
      writable: true,
      path: undefined,
      headers: headers
    });
  });
};

Parser.prototype.parseKVs = function parseKVs (buffer, callback) {
  var self = this;

  this.decompress.write(buffer.toChunks(), function (err, chunks) {
    if (err) {
      return callback(err)
    }

    var buffer = new obuf();
    for (var i = 0; i < chunks.length; i++) {
      buffer.push(chunks[i]);
    }

    var size = self.version === 2 ? 2 : 4;
    if (!buffer.has(size)) { return callback(new Error('KV OOB')) }

    var count = self.version === 2
      ? buffer.readUInt16BE()
      : buffer.readUInt32BE();

    var headers = {};

    function readString () {
      if (!buffer.has(size)) { return null }
      var len = self.version === 2
        ? buffer.readUInt16BE()
        : buffer.readUInt32BE();

      if (!buffer.has(len)) { return null }

      var value = buffer.take(len);
      return value.toString()
    }

    while (count > 0) {
      var key = readString();
      var value = readString();

      if (key === null || value === null) {
        return callback(new Error('Headers OOB'))
      }

      if (self.version < 3) {
        var isInternal = /^(method|version|url|host|scheme|status)$/.test(key);
        if (key === 'url') {
          key = 'path';
        }
        if (isInternal) {
          key = ':' + key;
        }
      }

      // Compatibility with HTTP2
      if (key === ':status') {
        value = value.split(/ /g, 2)[0];
      }

      count--;
      if (key === ':host') {
        key = ':authority';
      }

      // Skip version, not present in HTTP2
      if (key === ':version') {
        continue
      }

      value = value.split(/\0/g);
      for (var j = 0; j < value.length; j++) {
        utils.addHeaderLine(key, value[j], headers);
      }
    }

    callback(null, headers);
  });
};

Parser.prototype.onRSTFrame = function onRSTFrame (body, callback) {
  if (!body.has(8)) { return callback(new Error('RST OOB')) }

  var frame = {
    type: 'RST',
    id: body.readUInt32BE() & 0x7fffffff,
    code: constants$2.errorByCode[body.readUInt32BE()]
  };

  if (frame.id === 0) {
    return callback(this.error(constants$2.error.PROTOCOL_ERROR,
      'Invalid stream id for RST'))
  }

  if (body.size !== 0) {
    frame.extra = body.take(body.size);
  }
  callback(null, frame);
};

Parser.prototype.onSettingsFrame = function onSettingsFrame (body, callback) {
  if (!body.has(4)) {
    return callback(new Error('SETTINGS OOB'))
  }

  var settings = {};
  var number = body.readUInt32BE();
  var idMap = {
    1: 'upload_bandwidth',
    2: 'download_bandwidth',
    3: 'round_trip_time',
    4: 'max_concurrent_streams',
    5: 'current_cwnd',
    6: 'download_retrans_rate',
    7: 'initial_window_size',
    8: 'client_certificate_vector_size'
  };

  if (!body.has(number * 8)) {
    return callback(new Error('SETTINGS OOB#2'))
  }

  for (var i = 0; i < number; i++) {
    var id = this.version === 2
      ? body.readUInt32LE()
      : body.readUInt32BE();

    var flags = (id >> 24) & 0xff;
    id = id & 0xffffff;

    // Skip persisted settings
    if (flags & 0x2) { continue }

    var name = idMap[id];

    settings[name] = body.readUInt32BE();
  }

  callback(null, {
    type: 'SETTINGS',
    settings: settings
  });
};

Parser.prototype.onPingFrame = function onPingFrame (body, callback) {
  if (!body.has(4)) {
    return callback(new Error('PING OOB'))
  }

  var isServer = this.isServer;
  var opaque = body.clone(body.size).take(body.size);
  var id = body.readUInt32BE();
  var ack = isServer ? (id % 2 === 0) : (id % 2 === 1);

  callback(null, { type: 'PING', opaque: opaque, ack: ack });
};

Parser.prototype.onGoawayFrame = function onGoawayFrame (body, callback) {
  if (!body.has(8)) {
    return callback(new Error('GOAWAY OOB'))
  }

  callback(null, {
    type: 'GOAWAY',
    lastId: body.readUInt32BE() & 0x7fffffff,
    code: constants$2.goawayByCode[body.readUInt32BE()]
  });
};

Parser.prototype.onWindowUpdateFrame = function onWindowUpdateFrame (body,
  callback) {
  if (!body.has(8)) {
    return callback(new Error('WINDOW_UPDATE OOB'))
  }

  callback(null, {
    type: 'WINDOW_UPDATE',
    id: body.readUInt32BE() & 0x7fffffff,
    delta: body.readInt32BE()
  });
};

Parser.prototype.onXForwardedFrame = function onXForwardedFrame (body,
  callback) {
  if (!body.has(4)) {
    return callback(new Error('X_FORWARDED OOB'))
  }

  var len = body.readUInt32BE();
  if (!body.has(len)) { return callback(new Error('X_FORWARDED host length OOB')) }

  callback(null, {
    type: 'X_FORWARDED_FOR',
    host: body.take(len).toString()
  });
};
});

var minimalisticAssert = assert;

function assert(val, msg) {
  if (!val)
    throw new Error(msg || 'Assertion failed');
}

assert.equal = function assertEqual(l, r, msg) {
  if (l != r)
    throw new Error(msg || ('Assertion failed: ' + l + ' != ' + r));
};

var Buffer$8 = buffer.Buffer;

function WBuf() {
  this.buffers = [];
  this.toReserve = 0;
  this.size = 0;
  this.maxSize = 0;
  this.avail = 0;

  this.last = null;
  this.offset = 0;

  // Used in slicing
  this.sliceQueue = null;

  this.forceReserve = false;

  // Mostly a constant
  this.reserveRate = 64;
}
var wbuf = WBuf;

WBuf.prototype.reserve = function reserve(n) {
  this.toReserve += n;

  // Force reservation of extra bytes
  if (this.forceReserve)
    this.toReserve = Math.max(this.toReserve, this.reserveRate);
};

WBuf.prototype._ensure = function _ensure(n) {
  if (this.avail >= n)
    return;

  if (this.toReserve === 0)
    this.toReserve = this.reserveRate;

  this.toReserve = Math.max(n - this.avail, this.toReserve);

  if (this.avail === 0)
    this._next();
};

WBuf.prototype._next = function _next() {
  var buf;
  if (this.sliceQueue === null) {
    // Most common case
    buf = new Buffer$8(this.toReserve);
  } else {
    // Only for `.slice()` results
    buf = this.sliceQueue.shift();
    if (this.sliceQueue.length === 0)
      this.sliceQueue = null;
  }

  this.toReserve = 0;

  this.buffers.push(buf);
  this.avail = buf.length;
  this.offset = 0;
  this.last = buf;
};

WBuf.prototype._rangeCheck = function _rangeCheck() {
  if (this.maxSize !== 0 && this.size > this.maxSize)
    throw new RangeError('WBuf overflow');
};

WBuf.prototype._move = function _move(n) {
  this.size += n;
  if (this.avail === 0)
    this.last = null;

  this._rangeCheck();
};

WBuf.prototype.slice = function slice(start, end) {
  minimalisticAssert(0 <= start && start <= this.size);
  minimalisticAssert(0 <= end && end <= this.size);

  if (this.last === null)
    this._next();

  var res = new WBuf();

  // Only last chunk is requested
  if (start >= this.size - this.offset) {
    res.buffers.push(this.last);
    res.last = this.last;
    res.offset = start - this.size + this.offset;
    res.maxSize = end - start;
    res.avail = res.maxSize;

    return res;
  }

  var startIndex = -1;
  var startOffset = 0;
  var endIndex = -1;

  // Find buffer indices
  var offset = 0;
  for (var i = 0; i < this.buffers.length; i++) {
    var buf = this.buffers[i];
    var next = offset + buf.length;

    // Found the start
    if (start >= offset && start <= next) {
      startIndex = i;
      startOffset = start - offset;
      if (endIndex !== -1)
        break;
    }
    if (end >= offset && end <= next) {
      endIndex = i;
      if (startIndex !== -1)
        break;
    }

    offset = next;
  }

  res.last = this.buffers[startIndex];
  res.offset = startOffset;
  res.maxSize = end - start;

  // Multi-buffer slice
  if (startIndex < endIndex) {
    res.sliceQueue = this.buffers.slice(startIndex + 1, endIndex + 1);

    res.last = res.last.slice(res.offset);
    res.offset = 0;
  }

  res.avail = res.last.length - res.offset;
  res.buffers.push(res.last);

  return res;
};

WBuf.prototype.skip = function skip(n) {
  if (n === 0)
    return this.slice(this.size, this.size);

  this._ensure(n);

  var left = n;
  while (left > 0) {
    var toSkip = Math.min(left, this.avail);
    left -= toSkip;
    this.size += toSkip;
    if (toSkip === this.avail) {
      if (left !== 0) {
        this._next();
      } else {
        this.avail -= toSkip;
        this.offset += toSkip;
      }
    } else {
      this.offset += toSkip;
      this.avail -= toSkip;
    }
  }

  this._rangeCheck();

  return this.slice(this.size - n, this.size);
};

WBuf.prototype.write = function write(str) {
  var len = 0;
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c > 255)
      len += 2;
    else
      len += 1;
  }
  this.reserve(len);
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    var hi = c >>> 8;
    var lo = c & 0xff;

    if (hi)
      this.writeUInt8(hi);
    this.writeUInt8(lo);
  }
};

WBuf.prototype.copyFrom = function copyFrom(buf, start, end) {
  var off = start === undefined ? 0 : start;
  var len = end === undefined ? buf.length : end;
  if (off === len)
    return;

  this._ensure(len - off);
  while (off < len) {
    var toCopy = Math.min(len - off, this.avail);
    buf.copy(this.last, this.offset, off, off + toCopy);
    off += toCopy;
    this.size += toCopy;
    if (toCopy === this.avail) {
      if (off !== len) {
        this._next();
      } else {
        this.avail = 0;
        this.offset += toCopy;
      }
    } else {
      this.offset += toCopy;
      this.avail -= toCopy;
    }
  }

  this._rangeCheck();
};

WBuf.prototype.writeUInt8 = function writeUInt8(v) {
  this._ensure(1);

  this.last[this.offset++] = v;
  this.avail--;
  this._move(1);
};

WBuf.prototype.writeUInt16BE = function writeUInt16BE(v) {
  this._ensure(2);

  // Fast case - everything fits into the last buffer
  if (this.avail >= 2) {
    this.last.writeUInt16BE(v, this.offset);
    this.offset += 2;
    this.avail -= 2;

  // One byte here, one byte there
  } else {
    this.last[this.offset] = (v >>> 8);
    this._next();
    this.last[this.offset++] = v & 0xff;
    this.avail--;
  }

  this._move(2);
};

WBuf.prototype.writeUInt24BE = function writeUInt24BE(v) {
  this._ensure(3);

  // Fast case - everything fits into the last buffer
  if (this.avail >= 3) {
    this.last.writeUInt16BE(v >>> 8, this.offset);
    this.last[this.offset + 2] = v & 0xff;
    this.offset += 3;
    this.avail -= 3;
    this._move(3);

  // Two bytes here
  } else if (this.avail >= 2) {
    this.last.writeUInt16BE(v >>> 8, this.offset);
    this._next();
    this.last[this.offset++] = v & 0xff;
    this.avail--;
    this._move(3);

  // Just one byte here
  } else {
    this.last[this.offset] = v >>> 16;
    this._move(1);
    this._next();
    this.writeUInt16BE(v & 0xffff);
  }
};

WBuf.prototype.writeUInt32BE = function writeUInt32BE(v) {
  this._ensure(4);

  // Fast case - everything fits into the last buffer
  if (this.avail >= 4) {
    this.last.writeUInt32BE(v, this.offset);
    this.offset += 4;
    this.avail -= 4;
    this._move(4);

  // Three bytes here
  } else if (this.avail >= 3) {
    this.writeUInt24BE(v >>> 8);
    this._next();
    this.last[this.offset++] = v & 0xff;
    this.avail--;
    this._move(1);

  // Slow case, who cares
  } else {
    this.writeUInt16BE(v >>> 16);
    this.writeUInt16BE(v & 0xffff);
  }
};

WBuf.prototype.writeUInt16LE = function writeUInt16LE(num) {
  var r = ((num & 0xff) << 8) | (num >>> 8);
  this.writeUInt16BE(r);
};

WBuf.prototype.writeUInt24LE = function writeUInt24LE(num) {
  var r = ((num & 0xff) << 16) | (((num >>> 8) & 0xff) << 8) | (num >>> 16);
  this.writeUInt24BE(r);
};

WBuf.prototype.writeUInt32LE = function writeUInt32LE(num) {
  this._ensure(4);

  // Fast case - everything fits into the last buffer
  if (this.avail >= 4) {
    this.last.writeUInt32LE(num, this.offset);
    this.offset += 4;
    this.avail -= 4;
    this._move(4);

  // Three bytes here
  } else if (this.avail >= 3) {
    this.writeUInt24LE(num & 0xffffff);
    this._next();
    this.last[this.offset++] = num >>> 24;
    this.avail--;
    this._move(1);

  // Slow case, who cares
  } else {
    this.writeUInt16LE(num & 0xffff);
    this.writeUInt16LE(num >>> 16);
  }
};

WBuf.prototype.render = function render() {
  var left = this.size;
  var out = [];

  for (var i = 0; i < this.buffers.length && left >= 0; i++) {
    var buf = this.buffers[i];
    left -= buf.length;
    if (left >= 0) {
      out.push(buf);
    } else {
      out.push(buf.slice(0, buf.length + left));
    }
  }

  return out;
};

// Signed APIs
WBuf.prototype.writeInt8 = function writeInt8(num) {
  if (num < 0)
    return this.writeUInt8(0x100 + num);
  else
    return this.writeUInt8(num);
};

function toUnsigned16(num) {
  if (num < 0)
    return 0x10000 + num;
  else
    return num;
}

WBuf.prototype.writeInt16LE = function writeInt16LE(num) {
  this.writeUInt16LE(toUnsigned16(num));
};

WBuf.prototype.writeInt16BE = function writeInt16BE(num) {
  this.writeUInt16BE(toUnsigned16(num));
};

function toUnsigned24(num) {
  if (num < 0)
    return 0x1000000 + num;
  else
    return num;
}

WBuf.prototype.writeInt24LE = function writeInt24LE(num) {
  this.writeUInt24LE(toUnsigned24(num));
};

WBuf.prototype.writeInt24BE = function writeInt24BE(num) {
  this.writeUInt24BE(toUnsigned24(num));
};

function toUnsigned32(num) {
  if (num < 0)
    return (0xffffffff + num) + 1;
  else
    return num;
}

WBuf.prototype.writeInt32LE = function writeInt32LE(num) {
  this.writeUInt32LE(toUnsigned32(num));
};

WBuf.prototype.writeInt32BE = function writeInt32BE(num) {
  this.writeUInt32BE(toUnsigned32(num));
};

WBuf.prototype.writeComb = function writeComb(size, endian, value) {
  if (size === 1)
    return this.writeUInt8(value);

  if (endian === 'le') {
    if (size === 2)
      this.writeUInt16LE(value);
    else if (size === 3)
      this.writeUInt24LE(value);
    else if (size === 4)
      this.writeUInt32LE(value);
  } else {
    if (size === 2)
      this.writeUInt16BE(value);
    else if (size === 3)
      this.writeUInt24BE(value);
    else if (size === 4)
      this.writeUInt32BE(value);
  }
};

var constants$3 = spdy.constants;
var base$1 = spdyTransport.protocol.base;
var utils$4 = base$1.utils;



var Buffer$9 = buffer.Buffer;


var debug$2 = src('spdy:framer');

function Framer$2 (options) {
  base$1.Framer.call(this, options);
}
util$6.inherits(Framer$2, base$1.Framer);
var framer$1 = Framer$2;

Framer$2.create = function create (options) {
  return new Framer$2(options)
};

Framer$2.prototype.setMaxFrameSize = function setMaxFrameSize (size) {
  // http2-only
};

Framer$2.prototype.headersToDict = function headersToDict (headers,
  preprocess,
  callback) {
  function stringify (value) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        return value.join('\x00')
      } else if (typeof value === 'string') {
        return value
      } else {
        return value.toString()
      }
    } else {
      return ''
    }
  }

  // Lower case of all headers keys
  var loweredHeaders = {};
  Object.keys(headers || {}).map(function (key) {
    loweredHeaders[key.toLowerCase()] = headers[key];
  });

  // Allow outer code to add custom headers or remove something
  if (preprocess) { preprocess(loweredHeaders); }

  // Transform object into kv pairs
  var size = this.version === 2 ? 2 : 4;
  var len = size;
  var pairs = Object.keys(loweredHeaders).filter(function (key) {
    var lkey = key.toLowerCase();

    // Will be in `:host`
    if (lkey === 'host' && this.version >= 3) {
      return false
    }

    return lkey !== 'connection' && lkey !== 'keep-alive' &&
           lkey !== 'proxy-connection' && lkey !== 'transfer-encoding'
  }, this).map(function (key) {
    var klen = Buffer$9.byteLength(key);
    var value = stringify(loweredHeaders[key]);
    var vlen = Buffer$9.byteLength(value);

    len += size * 2 + klen + vlen;
    return [klen, key, vlen, value]
  });

  var block = new wbuf();
  block.reserve(len);

  if (this.version === 2) {
    block.writeUInt16BE(pairs.length);
  } else {
    block.writeUInt32BE(pairs.length);
  }

  pairs.forEach(function (pair) {
    // Write key length
    if (this.version === 2) {
      block.writeUInt16BE(pair[0]);
    } else {
      block.writeUInt32BE(pair[0]);
    }

    // Write key
    block.write(pair[1]);

    // Write value length
    if (this.version === 2) {
      block.writeUInt16BE(pair[2]);
    } else {
      block.writeUInt32BE(pair[2]);
    }
    // Write value
    block.write(pair[3]);
  }, this);

  assert$7(this.compress !== null, 'Framer version not initialized');
  this.compress.write(block.render(), callback);
};

Framer$2.prototype._frame = function _frame (frame, body, callback) {
  if (!this.version) {
    this.on('version', function () {
      this._frame(frame, body, callback);
    });
    return
  }

  debug$2('id=%d type=%s', frame.id, frame.type);

  var buffer = new wbuf();

  buffer.writeUInt16BE(0x8000 | this.version);
  buffer.writeUInt16BE(constants$3.frameType[frame.type]);
  buffer.writeUInt8(frame.flags);
  var len = buffer.skip(3);

  body(buffer);

  var frameSize = buffer.size - constants$3.FRAME_HEADER_SIZE;
  len.writeUInt24BE(frameSize);

  var chunks = buffer.render();
  var toWrite = {
    stream: frame.id,
    priority: false,
    chunks: chunks,
    callback: callback
  };

  this._resetTimeout();
  this.schedule(toWrite);

  return chunks
};

Framer$2.prototype._synFrame = function _synFrame (frame, callback) {
  var self = this;

  if (!frame.path) {
    throw new Error('`path` is required frame argument')
  }

  function preprocess (headers) {
    var method = frame.method || base$1.constants.DEFAULT_METHOD;
    var version = frame.version || 'HTTP/1.1';
    var scheme = frame.scheme || 'https';
    var host = frame.host ||
               (frame.headers && frame.headers.host) ||
               base$1.constants.DEFAULT_HOST;

    if (self.version === 2) {
      headers.method = method;
      headers.version = version;
      headers.url = frame.path;
      headers.scheme = scheme;
      headers.host = host;
      if (frame.status) {
        headers.status = frame.status;
      }
    } else {
      headers[':method'] = method;
      headers[':version'] = version;
      headers[':path'] = frame.path;
      headers[':scheme'] = scheme;
      headers[':host'] = host;
      if (frame.status) { headers[':status'] = frame.status; }
    }
  }

  this.headersToDict(frame.headers, preprocess, function (err, chunks) {
    if (err) {
      if (callback) {
        return callback(err)
      } else {
        return self.emit('error', err)
      }
    }

    self._frame({
      type: 'SYN_STREAM',
      id: frame.id,
      flags: frame.fin ? constants$3.flags.FLAG_FIN : 0
    }, function (buf) {
      buf.reserve(10);

      buf.writeUInt32BE(frame.id & 0x7fffffff);
      buf.writeUInt32BE(frame.associated & 0x7fffffff);

      var weight = (frame.priority && frame.priority.weight) ||
                   constants$3.DEFAULT_WEIGHT;

      // We only have 3 bits for priority in SPDY, try to fit it into this
      var priority = utils$4.weightToPriority(weight);
      buf.writeUInt8(priority << 5);

      // CREDENTIALS slot
      buf.writeUInt8(0);

      for (var i = 0; i < chunks.length; i++) {
        buf.copyFrom(chunks[i]);
      }
    }, callback);
  });
};

Framer$2.prototype.requestFrame = function requestFrame (frame, callback) {
  this._synFrame({
    id: frame.id,
    fin: frame.fin,
    associated: 0,
    method: frame.method,
    version: frame.version,
    scheme: frame.scheme,
    host: frame.host,
    path: frame.path,
    priority: frame.priority,
    headers: frame.headers
  }, callback);
};

Framer$2.prototype.responseFrame = function responseFrame (frame, callback) {
  var self = this;

  var reason = frame.reason;
  if (!reason) {
    reason = constants$3.statusReason[frame.status];
  }

  function preprocess (headers) {
    if (self.version === 2) {
      headers.status = frame.status + ' ' + reason;
      headers.version = 'HTTP/1.1';
    } else {
      headers[':status'] = frame.status + ' ' + reason;
      headers[':version'] = 'HTTP/1.1';
    }
  }

  this.headersToDict(frame.headers, preprocess, function (err, chunks) {
    if (err) {
      if (callback) {
        return callback(err)
      } else {
        return self.emit('error', err)
      }
    }

    self._frame({
      type: 'SYN_REPLY',
      id: frame.id,
      flags: 0
    }, function (buf) {
      buf.reserve(self.version === 2 ? 6 : 4);

      buf.writeUInt32BE(frame.id & 0x7fffffff);

      // Unused data
      if (self.version === 2) {
        buf.writeUInt16BE(0);
      }

      for (var i = 0; i < chunks.length; i++) {
        buf.copyFrom(chunks[i]);
      }
    }, callback);
  });
};

Framer$2.prototype.pushFrame = function pushFrame (frame, callback) {
  var self = this;

  this._checkPush(function (err) {
    if (err) { return callback(err) }

    self._synFrame({
      id: frame.promisedId,
      associated: frame.id,
      method: frame.method,
      status: frame.status || 200,
      version: frame.version,
      scheme: frame.scheme,
      host: frame.host,
      path: frame.path,
      priority: frame.priority,

      // Merge everything together, there is no difference in SPDY protocol
      headers: Object.assign(Object.assign({}, frame.headers), frame.response)
    }, callback);
  });
};

Framer$2.prototype.headersFrame = function headersFrame (frame, callback) {
  var self = this;

  this.headersToDict(frame.headers, null, function (err, chunks) {
    if (err) {
      if (callback) { return callback(err) } else {
        return self.emit('error', err)
      }
    }

    self._frame({
      type: 'HEADERS',
      id: frame.id,
      priority: false,
      flags: 0
    }, function (buf) {
      buf.reserve(4 + (self.version === 2 ? 2 : 0));
      buf.writeUInt32BE(frame.id & 0x7fffffff);

      // Unused data
      if (self.version === 2) { buf.writeUInt16BE(0); }

      for (var i = 0; i < chunks.length; i++) {
        buf.copyFrom(chunks[i]);
      }
    }, callback);
  });
};

Framer$2.prototype.dataFrame = function dataFrame (frame, callback) {
  if (!this.version) {
    return this.on('version', function () {
      this.dataFrame(frame, callback);
    })
  }

  debug$2('id=%d type=DATA', frame.id);

  var buffer = new wbuf();
  buffer.reserve(8 + frame.data.length);

  buffer.writeUInt32BE(frame.id & 0x7fffffff);
  buffer.writeUInt8(frame.fin ? 0x01 : 0x0);
  buffer.writeUInt24BE(frame.data.length);
  buffer.copyFrom(frame.data);

  var chunks = buffer.render();
  var toWrite = {
    stream: frame.id,
    priority: frame.priority,
    chunks: chunks,
    callback: callback
  };

  var self = this;
  this._resetTimeout();

  var bypass = this.version < 3.1;
  this.window.send.update(-frame.data.length, bypass ? undefined : function () {
    self._resetTimeout();
    self.schedule(toWrite);
  });

  if (bypass) {
    this._resetTimeout();
    this.schedule(toWrite);
  }
};

Framer$2.prototype.pingFrame = function pingFrame (frame, callback) {
  this._frame({
    type: 'PING',
    id: 0,
    flags: 0
  }, function (buf, callback) {
    buf.reserve(4);

    var opaque = frame.opaque;
    buf.writeUInt32BE(opaque.readUInt32BE(opaque.length - 4, true));
  }, callback);
};

Framer$2.prototype.rstFrame = function rstFrame (frame, callback) {
  this._frame({
    type: 'RST_STREAM',
    id: frame.id,
    flags: 0
  }, function (buf) {
    buf.reserve(8);

    // Stream ID
    buf.writeUInt32BE(frame.id & 0x7fffffff);
    // Status Code
    buf.writeUInt32BE(constants$3.error[frame.code]);

    // Extra debugging information
    if (frame.extra) {
      buf.write(frame.extra);
    }
  }, callback);
};

Framer$2.prototype.prefaceFrame = function prefaceFrame () {
};

Framer$2.prototype.settingsFrame = function settingsFrame (options, callback) {
  var self = this;

  var key = this.version + '/' + JSON.stringify(options);

  var settings = Framer$2.settingsCache[key];
  if (settings) {
    debug$2('cached settings');
    this._resetTimeout();
    this.schedule({
      stream: 0,
      priority: false,
      chunks: settings,
      callback: callback
    });
    return
  }

  var params = [];
  for (var i = 0; i < constants$3.settingsIndex.length; i++) {
    var name = constants$3.settingsIndex[i];
    if (!name) { continue }

    // value: Infinity
    if (!isFinite(options[name])) {
      continue
    }

    if (options[name] !== undefined) {
      params.push({ key: i, value: options[name] });
    }
  }

  var frame = this._frame({
    type: 'SETTINGS',
    id: 0,
    flags: 0
  }, function (buf) {
    buf.reserve(4 + 8 * params.length);

    // Count of entries
    buf.writeUInt32BE(params.length);

    params.forEach(function (param) {
      var flag = constants$3.settings.FLAG_SETTINGS_PERSIST_VALUE << 24;

      if (self.version === 2) {
        buf.writeUInt32LE(flag | param.key);
      } else { buf.writeUInt32BE(flag | param.key); }
      buf.writeUInt32BE(param.value & 0x7fffffff);
    });
  }, callback);

  Framer$2.settingsCache[key] = frame;
};
Framer$2.settingsCache = {};

Framer$2.prototype.ackSettingsFrame = function ackSettingsFrame (callback) {
  if (callback) {
    process.nextTick(callback);
  }
};

Framer$2.prototype.windowUpdateFrame = function windowUpdateFrame (frame,
  callback) {
  this._frame({
    type: 'WINDOW_UPDATE',
    id: frame.id,
    flags: 0
  }, function (buf) {
    buf.reserve(8);

    // ID
    buf.writeUInt32BE(frame.id & 0x7fffffff);

    // Delta
    buf.writeInt32BE(frame.delta);
  }, callback);
};

Framer$2.prototype.goawayFrame = function goawayFrame (frame, callback) {
  this._frame({
    type: 'GOAWAY',
    id: 0,
    flags: 0
  }, function (buf) {
    buf.reserve(8);

    // Last-good-stream-ID
    buf.writeUInt32BE(frame.lastId & 0x7fffffff);
    // Status
    buf.writeUInt32BE(constants$3.goaway[frame.code]);
  }, callback);
};

Framer$2.prototype.priorityFrame = function priorityFrame (frame, callback) {
  // No such thing in SPDY
  if (callback) {
    process.nextTick(callback);
  }
};

Framer$2.prototype.xForwardedFor = function xForwardedFor (frame, callback) {
  this._frame({
    type: 'X_FORWARDED_FOR',
    id: 0,
    flags: 0
  }, function (buf) {
    buf.writeUInt32BE(Buffer$9.byteLength(frame.host));
    buf.write(frame.host);
  }, callback);
};

var zlibPool = createCommonjsModule(function (module, exports) {

var zlibpool = exports;




// TODO(indutny): think about it, why has it always been Z_SYNC_FLUSH here.
// It should be possible to manually flush stuff after the write instead
function createDeflate (version, compression) {
  var deflate = zlib.createDeflate({
    dictionary: spdyTransport.protocol.spdy.dictionary[version],
    flush: zlib.Z_SYNC_FLUSH,
    windowBits: 11,
    level: compression ? zlib.Z_DEFAULT_COMPRESSION : zlib.Z_NO_COMPRESSION
  });

  // For node.js v0.8
  deflate._flush = zlib.Z_SYNC_FLUSH;

  return deflate
}

function createInflate (version) {
  var inflate = zlib.createInflate({
    dictionary: spdyTransport.protocol.spdy.dictionary[version],
    flush: zlib.Z_SYNC_FLUSH
  });

  // For node.js v0.8
  inflate._flush = zlib.Z_SYNC_FLUSH;

  return inflate
}

function Pool (compression) {
  this.compression = compression;
  this.pool = {
    2: [],
    3: [],
    3.1: []
  };
}

zlibpool.create = function create (compression) {
  return new Pool(compression)
};

Pool.prototype.get = function get (version) {
  if (this.pool[version].length > 0) {
    return this.pool[version].pop()
  } else {
    var id = version;

    return {
      version: version,
      compress: createDeflate(id, this.compression),
      decompress: createInflate(id)
    }
  }
};

Pool.prototype.put = function put (pair) {
  this.pool[pair.version].push(pair);
};
});

var name = 'spdy';

var dictionary$1 = dictionary_1;
var constants$4 = constants$2;
var parser$1 = parser_1;
var framer$2 = framer$1;
var compressionPool = zlibPool;

var spdy = {
	name: name,
	dictionary: dictionary$1,
	constants: constants$4,
	parser: parser$1,
	framer: framer$2,
	compressionPool: compressionPool
};

var constants$5 = createCommonjsModule(function (module, exports) {


var base = spdyTransport.protocol.base;

exports.PREFACE_SIZE = 24;
exports.PREFACE = 'PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n';
exports.PREFACE_BUFFER = Buffer.from(exports.PREFACE);

exports.PING_OPAQUE_SIZE = 8;

exports.FRAME_HEADER_SIZE = 9;
exports.INITIAL_MAX_FRAME_SIZE = 16384;
exports.ABSOLUTE_MAX_FRAME_SIZE = 16777215;
exports.HEADER_TABLE_SIZE = 4096;
exports.DEFAULT_MAX_HEADER_LIST_SIZE = 80 * 1024; // as in http_parser
exports.MAX_INITIAL_WINDOW_SIZE = 2147483647;

exports.DEFAULT_WEIGHT = 16;

exports.MAX_CONCURRENT_STREAMS = Infinity;

exports.frameType = {
  DATA: 0,
  HEADERS: 1,
  PRIORITY: 2,
  RST_STREAM: 3,
  SETTINGS: 4,
  PUSH_PROMISE: 5,
  PING: 6,
  GOAWAY: 7,
  WINDOW_UPDATE: 8,
  CONTINUATION: 9,

  // Custom
  X_FORWARDED_FOR: 0xde
};

exports.flags = {
  ACK: 0x01, // SETTINGS-only
  END_STREAM: 0x01,
  END_HEADERS: 0x04,
  PADDED: 0x08,
  PRIORITY: 0x20
};

exports.settings = {
  SETTINGS_HEADER_TABLE_SIZE: 0x01,
  SETTINGS_ENABLE_PUSH: 0x02,
  SETTINGS_MAX_CONCURRENT_STREAMS: 0x03,
  SETTINGS_INITIAL_WINDOW_SIZE: 0x04,
  SETTINGS_MAX_FRAME_SIZE: 0x05,
  SETTINGS_MAX_HEADER_LIST_SIZE: 0x06
};

exports.settingsIndex = [
  null,
  'header_table_size',
  'enable_push',
  'max_concurrent_streams',
  'initial_window_size',
  'max_frame_size',
  'max_header_list_size'
];

exports.error = {
  OK: 0,
  NO_ERROR: 0,

  PROTOCOL_ERROR: 1,
  INTERNAL_ERROR: 2,
  FLOW_CONTROL_ERROR: 3,
  SETTINGS_TIMEOUT: 4,

  STREAM_CLOSED: 5,
  INVALID_STREAM: 5,

  FRAME_SIZE_ERROR: 6,
  REFUSED_STREAM: 7,
  CANCEL: 8,
  COMPRESSION_ERROR: 9,
  CONNECT_ERROR: 10,
  ENHANCE_YOUR_CALM: 11,
  INADEQUATE_SECURITY: 12,
  HTTP_1_1_REQUIRED: 13
};
exports.errorByCode = base.utils.reverse(exports.error);

exports.DEFAULT_WINDOW = 64 * 1024 - 1;

exports.goaway = exports.error;
exports.goawayByCode = Object.assign({}, exports.errorByCode);
exports.goawayByCode[0] = 'OK';
});

var parser_1$1 = createCommonjsModule(function (module, exports) {

var parser = exports;


var base = spdyTransport.protocol.base;
var utils = base.utils;
var constants = http2.constants;




function Parser (options) {
  base.Parser.call(this, options);

  this.isServer = options.isServer;

  this.waiting = constants.PREFACE_SIZE;
  this.state = 'preface';
  this.pendingHeader = null;

  // Header Block queue
  this._lastHeaderBlock = null;
  this.maxFrameSize = constants.INITIAL_MAX_FRAME_SIZE;
  this.maxHeaderListSize = constants.DEFAULT_MAX_HEADER_LIST_SIZE;
}
util$6.inherits(Parser, base.Parser);

parser.create = function create (options) {
  return new Parser(options)
};

Parser.prototype.setMaxFrameSize = function setMaxFrameSize (size) {
  this.maxFrameSize = size;
};

Parser.prototype.setMaxHeaderListSize = function setMaxHeaderListSize (size) {
  this.maxHeaderListSize = size;
};

// Only for testing
Parser.prototype.skipPreface = function skipPreface () {
  // Just some number bigger than 3.1, doesn't really matter for HTTP2
  this.setVersion(4);

  // Parse frame header!
  this.state = 'frame-head';
  this.waiting = constants.FRAME_HEADER_SIZE;
};

Parser.prototype.execute = function execute (buffer, callback) {
  if (this.state === 'preface') { return this.onPreface(buffer, callback) }

  if (this.state === 'frame-head') {
    return this.onFrameHead(buffer, callback)
  }

  assert$7(this.state === 'frame-body' && this.pendingHeader !== null);

  var self = this;
  var header = this.pendingHeader;
  this.pendingHeader = null;

  this.onFrameBody(header, buffer, function (err, frame) {
    if (err) {
      return callback(err)
    }

    self.state = 'frame-head';
    self.partial = false;
    self.waiting = constants.FRAME_HEADER_SIZE;
    callback(null, frame);
  });
};

Parser.prototype.executePartial = function executePartial (buffer, callback) {
  var header = this.pendingHeader;

  assert$7.strictEqual(header.flags & constants.flags.PADDED, 0);

  if (this.window) { this.window.recv.update(-buffer.size); }

  callback(null, {
    type: 'DATA',
    id: header.id,

    // Partial DATA can't be FIN
    fin: false,
    data: buffer.take(buffer.size)
  });
};

Parser.prototype.onPreface = function onPreface (buffer, callback) {
  if (buffer.take(buffer.size).toString() !== constants.PREFACE) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Invalid preface'))
  }

  this.skipPreface();
  callback(null, null);
};

Parser.prototype.onFrameHead = function onFrameHead (buffer, callback) {
  var header = {
    length: buffer.readUInt24BE(),
    control: true,
    type: buffer.readUInt8(),
    flags: buffer.readUInt8(),
    id: buffer.readUInt32BE() & 0x7fffffff
  };

  if (header.length > this.maxFrameSize) {
    return callback(this.error(constants.error.FRAME_SIZE_ERROR,
      'Frame length OOB'))
  }

  header.control = header.type !== constants.frameType.DATA;

  this.state = 'frame-body';
  this.pendingHeader = header;
  this.waiting = header.length;
  this.partial = !header.control;

  // TODO(indutny): eventually support partial padded DATA
  if (this.partial) {
    this.partial = (header.flags & constants.flags.PADDED) === 0;
  }

  callback(null, null);
};

Parser.prototype.onFrameBody = function onFrameBody (header, buffer, callback) {
  var frameType = constants.frameType;

  if (header.type === frameType.DATA) {
    this.onDataFrame(header, buffer, callback);
  } else if (header.type === frameType.HEADERS) {
    this.onHeadersFrame(header, buffer, callback);
  } else if (header.type === frameType.CONTINUATION) {
    this.onContinuationFrame(header, buffer, callback);
  } else if (header.type === frameType.WINDOW_UPDATE) {
    this.onWindowUpdateFrame(header, buffer, callback);
  } else if (header.type === frameType.RST_STREAM) {
    this.onRSTFrame(header, buffer, callback);
  } else if (header.type === frameType.SETTINGS) {
    this.onSettingsFrame(header, buffer, callback);
  } else if (header.type === frameType.PUSH_PROMISE) {
    this.onPushPromiseFrame(header, buffer, callback);
  } else if (header.type === frameType.PING) {
    this.onPingFrame(header, buffer, callback);
  } else if (header.type === frameType.GOAWAY) {
    this.onGoawayFrame(header, buffer, callback);
  } else if (header.type === frameType.PRIORITY) {
    this.onPriorityFrame(header, buffer, callback);
  } else if (header.type === frameType.X_FORWARDED_FOR) {
    this.onXForwardedFrame(header, buffer, callback);
  } else {
    this.onUnknownFrame(header, buffer, callback);
  }
};

Parser.prototype.onUnknownFrame = function onUnknownFrame (header, buffer, callback) {
  if (this._lastHeaderBlock !== null) {
    callback(this.error(constants.error.PROTOCOL_ERROR,
      'Received unknown frame in the middle of a header block'));
    return
  }
  callback(null, { type: 'unknown: ' + header.type });
};

Parser.prototype.unpadData = function unpadData (header, body, callback) {
  var isPadded = (header.flags & constants.flags.PADDED) !== 0;

  if (!isPadded) { return callback(null, body) }

  if (!body.has(1)) {
    return callback(this.error(constants.error.FRAME_SIZE_ERROR,
      'Not enough space for padding'))
  }

  var pad = body.readUInt8();
  if (!body.has(pad)) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Invalid padding size'))
  }

  var contents = body.clone(body.size - pad);
  body.skip(body.size);
  callback(null, contents);
};

Parser.prototype.onDataFrame = function onDataFrame (header, body, callback) {
  var isEndStream = (header.flags & constants.flags.END_STREAM) !== 0;

  if (header.id === 0) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Received DATA frame with stream=0'))
  }

  // Count received bytes
  if (this.window) {
    this.window.recv.update(-body.size);
  }

  this.unpadData(header, body, function (err, data) {
    if (err) {
      return callback(err)
    }

    callback(null, {
      type: 'DATA',
      id: header.id,
      fin: isEndStream,
      data: data.take(data.size)
    });
  });
};

Parser.prototype.initHeaderBlock = function initHeaderBlock (header,
  frame,
  block,
  callback) {
  if (this._lastHeaderBlock) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Duplicate Stream ID'))
  }

  this._lastHeaderBlock = {
    id: header.id,
    frame: frame,
    queue: [],
    size: 0
  };

  this.queueHeaderBlock(header, block, callback);
};

Parser.prototype.queueHeaderBlock = function queueHeaderBlock (header,
  block,
  callback) {
  var self = this;
  var item = this._lastHeaderBlock;
  if (!this._lastHeaderBlock || item.id !== header.id) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'No matching stream for continuation'))
  }

  var fin = (header.flags & constants.flags.END_HEADERS) !== 0;

  var chunks = block.toChunks();
  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i];
    item.queue.push(chunk);
    item.size += chunk.length;
  }

  if (item.size >= self.maxHeaderListSize) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Compressed header list is too large'))
  }

  if (!fin) { return callback(null, null) }
  this._lastHeaderBlock = null;

  this.decompress.write(item.queue, function (err, chunks) {
    if (err) {
      return callback(self.error(constants.error.COMPRESSION_ERROR,
        err.message))
    }

    var headers = {};
    var size = 0;
    for (var i = 0; i < chunks.length; i++) {
      var header = chunks[i];

      size += header.name.length + header.value.length + 32;
      if (size >= self.maxHeaderListSize) {
        return callback(self.error(constants.error.PROTOCOL_ERROR,
          'Header list is too large'))
      }

      if (/[A-Z]/.test(header.name)) {
        return callback(self.error(constants.error.PROTOCOL_ERROR,
          'Header name must be lowercase'))
      }

      utils.addHeaderLine(header.name, header.value, headers);
    }

    item.frame.headers = headers;
    item.frame.path = headers[':path'];

    callback(null, item.frame);
  });
};

Parser.prototype.onHeadersFrame = function onHeadersFrame (header,
  body,
  callback) {
  var self = this;

  if (header.id === 0) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Invalid stream id for HEADERS'))
  }

  this.unpadData(header, body, function (err, data) {
    if (err) { return callback(err) }

    var isPriority = (header.flags & constants.flags.PRIORITY) !== 0;
    if (!data.has(isPriority ? 5 : 0)) {
      return callback(self.error(constants.error.FRAME_SIZE_ERROR,
        'Not enough data for HEADERS'))
    }

    var exclusive = false;
    var dependency = 0;
    var weight = constants.DEFAULT_WEIGHT;
    if (isPriority) {
      dependency = data.readUInt32BE();
      exclusive = (dependency & 0x80000000) !== 0;
      dependency &= 0x7fffffff;

      // Weight's range is [1, 256]
      weight = data.readUInt8() + 1;
    }

    if (dependency === header.id) {
      return callback(self.error(constants.error.PROTOCOL_ERROR,
        'Stream can\'t dependend on itself'))
    }

    var streamInfo = {
      type: 'HEADERS',
      id: header.id,
      priority: {
        parent: dependency,
        exclusive: exclusive,
        weight: weight
      },
      fin: (header.flags & constants.flags.END_STREAM) !== 0,
      writable: true,
      headers: null,
      path: null
    };

    self.initHeaderBlock(header, streamInfo, data, callback);
  });
};

Parser.prototype.onContinuationFrame = function onContinuationFrame (header,
  body,
  callback) {
  this.queueHeaderBlock(header, body, callback);
};

Parser.prototype.onRSTFrame = function onRSTFrame (header, body, callback) {
  if (body.size !== 4) {
    return callback(this.error(constants.error.FRAME_SIZE_ERROR,
      'RST_STREAM length not 4'))
  }

  if (header.id === 0) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Invalid stream id for RST_STREAM'))
  }

  callback(null, {
    type: 'RST',
    id: header.id,
    code: constants.errorByCode[body.readUInt32BE()]
  });
};

Parser.prototype._validateSettings = function _validateSettings (settings) {
  if (settings['enable_push'] !== undefined &&
      settings['enable_push'] !== 0 &&
      settings['enable_push'] !== 1) {
    return this.error(constants.error.PROTOCOL_ERROR,
      'SETTINGS_ENABLE_PUSH must be 0 or 1')
  }

  if (settings['initial_window_size'] !== undefined &&
      (settings['initial_window_size'] > constants.MAX_INITIAL_WINDOW_SIZE ||
       settings['initial_window_size'] < 0)) {
    return this.error(constants.error.FLOW_CONTROL_ERROR,
      'SETTINGS_INITIAL_WINDOW_SIZE is OOB')
  }

  if (settings['max_frame_size'] !== undefined &&
      (settings['max_frame_size'] > constants.ABSOLUTE_MAX_FRAME_SIZE ||
       settings['max_frame_size'] < constants.INITIAL_MAX_FRAME_SIZE)) {
    return this.error(constants.error.PROTOCOL_ERROR,
      'SETTINGS_MAX_FRAME_SIZE is OOB')
  }

  return undefined
};

Parser.prototype.onSettingsFrame = function onSettingsFrame (header,
  body,
  callback) {
  if (header.id !== 0) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Invalid stream id for SETTINGS'))
  }

  var isAck = (header.flags & constants.flags.ACK) !== 0;
  if (isAck && body.size !== 0) {
    return callback(this.error(constants.error.FRAME_SIZE_ERROR,
      'SETTINGS with ACK and non-zero length'))
  }

  if (isAck) {
    return callback(null, { type: 'ACK_SETTINGS' })
  }

  if (body.size % 6 !== 0) {
    return callback(this.error(constants.error.FRAME_SIZE_ERROR,
      'SETTINGS length not multiple of 6'))
  }

  var settings = {};
  while (!body.isEmpty()) {
    var id = body.readUInt16BE();
    var value = body.readUInt32BE();
    var name = constants.settingsIndex[id];

    if (name) {
      settings[name] = value;
    }
  }

  var err = this._validateSettings(settings);
  if (err !== undefined) {
    return callback(err)
  }

  callback(null, {
    type: 'SETTINGS',
    settings: settings
  });
};

Parser.prototype.onPushPromiseFrame = function onPushPromiseFrame (header,
  body,
  callback) {
  if (header.id === 0) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Invalid stream id for PUSH_PROMISE'))
  }

  var self = this;
  this.unpadData(header, body, function (err, data) {
    if (err) {
      return callback(err)
    }

    if (!data.has(4)) {
      return callback(self.error(constants.error.FRAME_SIZE_ERROR,
        'PUSH_PROMISE length less than 4'))
    }

    var streamInfo = {
      type: 'PUSH_PROMISE',
      id: header.id,
      fin: false,
      promisedId: data.readUInt32BE() & 0x7fffffff,
      headers: null,
      path: null
    };

    self.initHeaderBlock(header, streamInfo, data, callback);
  });
};

Parser.prototype.onPingFrame = function onPingFrame (header, body, callback) {
  if (body.size !== 8) {
    return callback(this.error(constants.error.FRAME_SIZE_ERROR,
      'PING length != 8'))
  }

  if (header.id !== 0) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Invalid stream id for PING'))
  }

  var ack = (header.flags & constants.flags.ACK) !== 0;
  callback(null, { type: 'PING', opaque: body.take(body.size), ack: ack });
};

Parser.prototype.onGoawayFrame = function onGoawayFrame (header,
  body,
  callback) {
  if (!body.has(8)) {
    return callback(this.error(constants.error.FRAME_SIZE_ERROR,
      'GOAWAY length < 8'))
  }

  if (header.id !== 0) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Invalid stream id for GOAWAY'))
  }

  var frame = {
    type: 'GOAWAY',
    lastId: body.readUInt32BE(),
    code: constants.goawayByCode[body.readUInt32BE()]
  };

  if (body.size !== 0) { frame.debug = body.take(body.size); }

  callback(null, frame);
};

Parser.prototype.onPriorityFrame = function onPriorityFrame (header,
  body,
  callback) {
  if (body.size !== 5) {
    return callback(this.error(constants.error.FRAME_SIZE_ERROR,
      'PRIORITY length != 5'))
  }

  if (header.id === 0) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Invalid stream id for PRIORITY'))
  }

  var dependency = body.readUInt32BE();

  // Again the range is from 1 to 256
  var weight = body.readUInt8() + 1;

  if (dependency === header.id) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'Stream can\'t dependend on itself'))
  }

  callback(null, {
    type: 'PRIORITY',
    id: header.id,
    priority: {
      exclusive: (dependency & 0x80000000) !== 0,
      parent: dependency & 0x7fffffff,
      weight: weight
    }
  });
};

Parser.prototype.onWindowUpdateFrame = function onWindowUpdateFrame (header,
  body,
  callback) {
  if (body.size !== 4) {
    return callback(this.error(constants.error.FRAME_SIZE_ERROR,
      'WINDOW_UPDATE length != 4'))
  }

  var delta = body.readInt32BE();
  if (delta === 0) {
    return callback(this.error(constants.error.PROTOCOL_ERROR,
      'WINDOW_UPDATE delta == 0'))
  }

  callback(null, {
    type: 'WINDOW_UPDATE',
    id: header.id,
    delta: delta
  });
};

Parser.prototype.onXForwardedFrame = function onXForwardedFrame (header,
  body,
  callback) {
  callback(null, {
    type: 'X_FORWARDED_FOR',
    host: body.take(body.size).toString()
  });
};
});

var base$2 = spdyTransport.protocol.base;
var constants$6 = http2.constants;





var debug$3 = src('spdy:framer');
var debugExtra = src('spdy:framer:extra');

function Framer$3 (options) {
  base$2.Framer.call(this, options);

  this.maxFrameSize = constants$6.INITIAL_MAX_FRAME_SIZE;
}
util$6.inherits(Framer$3, base$2.Framer);
var framer$3 = Framer$3;

Framer$3.create = function create (options) {
  return new Framer$3(options)
};

Framer$3.prototype.setMaxFrameSize = function setMaxFrameSize (size) {
  this.maxFrameSize = size;
};

Framer$3.prototype._frame = function _frame (frame, body, callback) {
  debug$3('id=%d type=%s', frame.id, frame.type);

  var buffer = new wbuf();

  buffer.reserve(constants$6.FRAME_HEADER_SIZE);
  var len = buffer.skip(3);
  buffer.writeUInt8(constants$6.frameType[frame.type]);
  buffer.writeUInt8(frame.flags);
  buffer.writeUInt32BE(frame.id & 0x7fffffff);

  body(buffer);

  var frameSize = buffer.size - constants$6.FRAME_HEADER_SIZE;
  len.writeUInt24BE(frameSize);

  var chunks = buffer.render();
  var toWrite = {
    stream: frame.id,
    priority: frame.priority === undefined ? false : frame.priority,
    chunks: chunks,
    callback: callback
  };

  if (this.window && frame.type === 'DATA') {
    var self = this;
    this._resetTimeout();
    this.window.send.update(-frameSize, function () {
      self._resetTimeout();
      self.schedule(toWrite);
    });
  } else {
    this._resetTimeout();
    this.schedule(toWrite);
  }

  return chunks
};

Framer$3.prototype._split = function _split (frame) {
  var buf = new obuf();
  for (var i = 0; i < frame.chunks.length; i++) { buf.push(frame.chunks[i]); }

  var frames = [];
  while (!buf.isEmpty()) {
    // First frame may have reserved bytes in it
    var size = this.maxFrameSize;
    if (frames.length === 0) {
      size -= frame.reserve;
    }
    size = Math.min(size, buf.size);

    var frameBuf = buf.clone(size);
    buf.skip(size);

    frames.push({
      size: frameBuf.size,
      chunks: frameBuf.toChunks()
    });
  }

  return frames
};

Framer$3.prototype._continuationFrame = function _continuationFrame (frame,
  body,
  callback) {
  var frames = this._split(frame);

  frames.forEach(function (subFrame, i) {
    var isFirst = i === 0;
    var isLast = i === frames.length - 1;

    var flags = isLast ? constants$6.flags.END_HEADERS : 0;

    // PRIORITY and friends
    if (isFirst) {
      flags |= frame.flags;
    }

    this._frame({
      id: frame.id,
      priority: false,
      type: isFirst ? frame.type : 'CONTINUATION',
      flags: flags
    }, function (buf) {
      // Fill those reserved bytes
      if (isFirst && body) { body(buf); }

      buf.reserve(subFrame.size);
      for (var i = 0; i < subFrame.chunks.length; i++) { buf.copyFrom(subFrame.chunks[i]); }
    }, isLast ? callback : null);
  }, this);

  if (frames.length === 0) {
    this._frame({
      id: frame.id,
      priority: false,
      type: frame.type,
      flags: frame.flags | constants$6.flags.END_HEADERS
    }, function (buf) {
      if (body) { body(buf); }
    }, callback);
  }
};

Framer$3.prototype._compressHeaders = function _compressHeaders (headers,
  pairs,
  callback) {
  Object.keys(headers || {}).forEach(function (name) {
    var lowName = name.toLowerCase();

    // Not allowed in HTTP2
    switch (lowName) {
      case 'host':
      case 'connection':
      case 'keep-alive':
      case 'proxy-connection':
      case 'transfer-encoding':
      case 'upgrade':
        return
    }

    // Should be in `pairs`
    if (/^:/.test(lowName)) {
      return
    }

    // Do not compress, or index Cookie field (for security reasons)
    var neverIndex = lowName === 'cookie' || lowName === 'set-cookie';

    var value = headers[name];
    if (Array.isArray(value)) {
      for (var i = 0; i < value.length; i++) {
        pairs.push({
          name: lowName,
          value: value[i] + '',
          neverIndex: neverIndex,
          huffman: !neverIndex
        });
      }
    } else {
      pairs.push({
        name: lowName,
        value: value + '',
        neverIndex: neverIndex,
        huffman: !neverIndex
      });
    }
  });

  assert$7(this.compress !== null, 'Framer version not initialized');
  debugExtra('compressing headers=%j', pairs);
  this.compress.write([ pairs ], callback);
};

Framer$3.prototype._isDefaultPriority = function _isDefaultPriority (priority) {
  if (!priority) { return true }

  return !priority.parent &&
         priority.weight === constants$6.DEFAULT &&
         !priority.exclusive
};

Framer$3.prototype._defaultHeaders = function _defaultHeaders (frame, pairs) {
  if (!frame.path) {
    throw new Error('`path` is required frame argument')
  }

  pairs.push({
    name: ':method',
    value: frame.method || base$2.constants.DEFAULT_METHOD
  });
  pairs.push({ name: ':path', value: frame.path });
  pairs.push({ name: ':scheme', value: frame.scheme || 'https' });
  pairs.push({
    name: ':authority',
    value: frame.host ||
           (frame.headers && frame.headers.host) ||
           base$2.constants.DEFAULT_HOST
  });
};

Framer$3.prototype._headersFrame = function _headersFrame (kind, frame, callback) {
  var pairs = [];

  if (kind === 'request') {
    this._defaultHeaders(frame, pairs);
  } else if (kind === 'response') {
    pairs.push({ name: ':status', value: (frame.status || 200) + '' });
  }

  var self = this;
  this._compressHeaders(frame.headers, pairs, function (err, chunks) {
    if (err) {
      if (callback) {
        return callback(err)
      } else {
        return self.emit('error', err)
      }
    }

    var reserve = 0;

    // If priority info is present, and the values are not default ones
    // reserve space for the priority info and add PRIORITY flag
    var priority = frame.priority;
    if (!self._isDefaultPriority(priority)) { reserve = 5; }

    var flags = reserve === 0 ? 0 : constants$6.flags.PRIORITY;

    // Mostly for testing
    if (frame.fin) {
      flags |= constants$6.flags.END_STREAM;
    }

    self._continuationFrame({
      id: frame.id,
      type: 'HEADERS',
      flags: flags,
      reserve: reserve,
      chunks: chunks
    }, function (buf) {
      if (reserve === 0) {
        return
      }

      buf.writeUInt32BE(((priority.exclusive ? 0x80000000 : 0) |
                         priority.parent) >>> 0);
      buf.writeUInt8((priority.weight | 0) - 1);
    }, callback);
  });
};

Framer$3.prototype.requestFrame = function requestFrame (frame, callback) {
  return this._headersFrame('request', frame, callback)
};

Framer$3.prototype.responseFrame = function responseFrame (frame, callback) {
  return this._headersFrame('response', frame, callback)
};

Framer$3.prototype.headersFrame = function headersFrame (frame, callback) {
  return this._headersFrame('headers', frame, callback)
};

Framer$3.prototype.pushFrame = function pushFrame (frame, callback) {
  var self = this;

  function compress (headers, pairs, callback) {
    self._compressHeaders(headers, pairs, function (err, chunks) {
      if (err) {
        if (callback) {
          return callback(err)
        } else {
          return self.emit('error', err)
        }
      }

      callback(chunks);
    });
  }

  function sendPromise (chunks) {
    self._continuationFrame({
      id: frame.id,
      type: 'PUSH_PROMISE',
      reserve: 4,
      chunks: chunks
    }, function (buf) {
      buf.writeUInt32BE(frame.promisedId);
    });
  }

  function sendResponse (chunks, callback) {
    var priority = frame.priority;
    var isDefaultPriority = self._isDefaultPriority(priority);
    var flags = isDefaultPriority ? 0 : constants$6.flags.PRIORITY;

    // Mostly for testing
    if (frame.fin) {
      flags |= constants$6.flags.END_STREAM;
    }

    self._continuationFrame({
      id: frame.promisedId,
      type: 'HEADERS',
      flags: flags,
      reserve: isDefaultPriority ? 0 : 5,
      chunks: chunks
    }, function (buf) {
      if (isDefaultPriority) {
        return
      }

      buf.writeUInt32BE((priority.exclusive ? 0x80000000 : 0) |
                        priority.parent);
      buf.writeUInt8((priority.weight | 0) - 1);
    }, callback);
  }

  this._checkPush(function (err) {
    if (err) {
      return callback(err)
    }

    var pairs = {
      promise: [],
      response: []
    };

    self._defaultHeaders(frame, pairs.promise);
    pairs.response.push({ name: ':status', value: (frame.status || 200) + '' });

    compress(frame.headers, pairs.promise, function (promiseChunks) {
      sendPromise(promiseChunks);
      if (frame.response === false) {
        return callback(null)
      }
      compress(frame.response, pairs.response, function (responseChunks) {
        sendResponse(responseChunks, callback);
      });
    });
  });
};

Framer$3.prototype.priorityFrame = function priorityFrame (frame, callback) {
  this._frame({
    id: frame.id,
    priority: false,
    type: 'PRIORITY',
    flags: 0
  }, function (buf) {
    var priority = frame.priority;
    buf.writeUInt32BE((priority.exclusive ? 0x80000000 : 0) |
                      priority.parent);
    buf.writeUInt8((priority.weight | 0) - 1);
  }, callback);
};

Framer$3.prototype.dataFrame = function dataFrame (frame, callback) {
  var frames = this._split({
    reserve: 0,
    chunks: [ frame.data ]
  });

  var fin = frame.fin ? constants$6.flags.END_STREAM : 0;

  var self = this;
  frames.forEach(function (subFrame, i) {
    var isLast = i === frames.length - 1;
    var flags = 0;
    if (isLast) {
      flags |= fin;
    }

    self._frame({
      id: frame.id,
      priority: frame.priority,
      type: 'DATA',
      flags: flags
    }, function (buf) {
      buf.reserve(subFrame.size);
      for (var i = 0; i < subFrame.chunks.length; i++) { buf.copyFrom(subFrame.chunks[i]); }
    }, isLast ? callback : null);
  });

  // Empty DATA
  if (frames.length === 0) {
    this._frame({
      id: frame.id,
      priority: frame.priority,
      type: 'DATA',
      flags: fin
    }, function (buf) {
      // No-op
    }, callback);
  }
};

Framer$3.prototype.pingFrame = function pingFrame (frame, callback) {
  this._frame({
    id: 0,
    type: 'PING',
    flags: frame.ack ? constants$6.flags.ACK : 0
  }, function (buf) {
    buf.copyFrom(frame.opaque);
  }, callback);
};

Framer$3.prototype.rstFrame = function rstFrame (frame, callback) {
  this._frame({
    id: frame.id,
    type: 'RST_STREAM',
    flags: 0
  }, function (buf) {
    buf.writeUInt32BE(constants$6.error[frame.code]);
  }, callback);
};

Framer$3.prototype.prefaceFrame = function prefaceFrame (callback) {
  debug$3('preface');
  this._resetTimeout();
  this.schedule({
    stream: 0,
    priority: false,
    chunks: [ constants$6.PREFACE_BUFFER ],
    callback: callback
  });
};

Framer$3.prototype.settingsFrame = function settingsFrame (options, callback) {
  var key = JSON.stringify(options);

  var settings = Framer$3.settingsCache[key];
  if (settings) {
    debug$3('cached settings');
    this._resetTimeout();
    this.schedule({
      id: 0,
      priority: false,
      chunks: settings,
      callback: callback
    });
    return
  }

  var params = [];
  for (var i = 0; i < constants$6.settingsIndex.length; i++) {
    var name = constants$6.settingsIndex[i];
    if (!name) {
      continue
    }

    // value: Infinity
    if (!isFinite(options[name])) {
      continue
    }

    if (options[name] !== undefined) {
      params.push({ key: i, value: options[name] });
    }
  }

  var bodySize = params.length * 6;

  var chunks = this._frame({
    id: 0,
    type: 'SETTINGS',
    flags: 0
  }, function (buffer) {
    buffer.reserve(bodySize);
    for (var i = 0; i < params.length; i++) {
      var param = params[i];

      buffer.writeUInt16BE(param.key);
      buffer.writeUInt32BE(param.value);
    }
  }, callback);

  Framer$3.settingsCache[key] = chunks;
};
Framer$3.settingsCache = {};

Framer$3.prototype.ackSettingsFrame = function ackSettingsFrame (callback) {
  /* var chunks = */ this._frame({
    id: 0,
    type: 'SETTINGS',
    flags: constants$6.flags.ACK
  }, function (buffer) {
    // No-op
  }, callback);
};

Framer$3.prototype.windowUpdateFrame = function windowUpdateFrame (frame,
  callback) {
  this._frame({
    id: frame.id,
    type: 'WINDOW_UPDATE',
    flags: 0
  }, function (buffer) {
    buffer.reserve(4);
    buffer.writeInt32BE(frame.delta);
  }, callback);
};

Framer$3.prototype.goawayFrame = function goawayFrame (frame, callback) {
  this._frame({
    type: 'GOAWAY',
    id: 0,
    flags: 0
  }, function (buf) {
    buf.reserve(8);

    // Last-good-stream-ID
    buf.writeUInt32BE(frame.lastId & 0x7fffffff);
    // Code
    buf.writeUInt32BE(constants$6.goaway[frame.code]);

    // Extra debugging information
    if (frame.extra) { buf.write(frame.extra); }
  }, callback);
};

Framer$3.prototype.xForwardedFor = function xForwardedFor (frame, callback) {
  this._frame({
    type: 'X_FORWARDED_FOR',
    id: 0,
    flags: 0
  }, function (buf) {
    buf.write(frame.host);
  }, callback);
};

var assert$1 = function assert(cond, text) {
  if (!cond)
    throw new Error(text);
};

var stringify = function stringify(arr) {
  var res = '';
  for (var i = 0; i < arr.length; i++)
    res += String.fromCharCode(arr[i]);
  return res;
};

var toArray = function toArray(str) {
  var res = [];
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    var hi = c >>> 8;
    var lo = c & 0xff;
    if (hi)
      res.push(hi, lo);
    else
      res.push(lo);
  }
  return res;
};

var utils$5 = {
	assert: assert$1,
	stringify: stringify,
	toArray: toArray
};

var decode =
    [2608,2609,2610,2657,2659,2661,2665,2671,2675,2676,0,0,0,0,0,0,0,0,0,0,
    3104,3109,3117,3118,3119,3123,3124,3125,3126,3127,3128,3129,3133,3137,3167,
    3170,3172,3174,3175,3176,3180,3181,3182,3184,3186,3189,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    3642,3650,3651,3652,3653,3654,3655,3656,3657,3658,3659,3660,3661,3662,3663,
    3664,3665,3666,3667,3668,3669,3670,3671,3673,3690,3691,3697,3702,3703,3704,
    3705,3706,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4134,4138,4140,4155,4184,4186,[1057,
    1058,1064,1065,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1087,0,1575,1579,1660,0,0,0,0,0,2083,2110,0,0,0,0,0,0,0,0,0,0,0,0,2560,
    2596,2624,2651,2653,2686,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,3166,3197,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3644,
    3680,3707,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,[1628,1731,1744,0,0,0,2176,2178,
    2179,2210,2232,2242,2272,2274,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2713,2721,2727,
    2732,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0],[2736,2737,2739,2769,2776,2777,2787,2789,2790,0,0,0,0,0,0,0,0,0,
    3201,3204,3205,3206,3208,3218,3226,3228,3232,3235,3236,3241,3242,3245,3250,
    3253,3257,3258,3259,3261,3262,3268,3270,3300,3304,3305,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3585,
    3719,3721,3722,3723,3724,3725,3727,3731,3733,3734,3735,3736,3739,3741,3742,
    3749,3750,3752,3758,3759,3764,3766,3767,3772,3775,3781,3815,3823,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,4105,4238,4240,4241,4244,4255,4267,4302,4311,4321,4332,4333,[711,719,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[746,747,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1216,1217,
    1224,1225,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1226,1229,1234,1237,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0],[1242,1243,1262,1264,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0],[1266,1267,1279,0,0,0,1739,1740,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0],[1747,1748,1750,1757,1758,1759,1777,1780,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1781,1782,1783,1784,1786,
    1787,1788,1789,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1790,0,
    2050,2051,2052,2053,2054,2055,2056,2059,2060,2062,2063,2064,2065,2066,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[2067,2068,2069,2071,2072,2073,2074,2075,
    2076,2077,2078,2079,2175,2268,2297,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3082,3085,3094,3328,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
    0,0,0,0,0]]]];
var encode =
    [[13,8184],[23,8388568],[28,268435426],[28,268435427],[28,268435428],[28,
    268435429],[28,268435430],[28,268435431],[28,268435432],[24,16777194],[30,
    1073741820],[28,268435433],[28,268435434],[30,1073741821],[28,268435435],
    [28,268435436],[28,268435437],[28,268435438],[28,268435439],[28,268435440],
    [28,268435441],[28,268435442],[30,1073741822],[28,268435443],[28,
    268435444],[28,268435445],[28,268435446],[28,268435447],[28,268435448],[28,
    268435449],[28,268435450],[28,268435451],[6,20],[10,1016],[10,1017],[12,
    4090],[13,8185],[6,21],[8,248],[11,2042],[10,1018],[10,1019],[8,249],[11,
    2043],[8,250],[6,22],[6,23],[6,24],[5,0],[5,1],[5,2],[6,25],[6,26],[6,27],
    [6,28],[6,29],[6,30],[6,31],[7,92],[8,251],[15,32764],[6,32],[12,4091],[10,
    1020],[13,8186],[6,33],[7,93],[7,94],[7,95],[7,96],[7,97],[7,98],[7,99],[7,
    100],[7,101],[7,102],[7,103],[7,104],[7,105],[7,106],[7,107],[7,108],[7,
    109],[7,110],[7,111],[7,112],[7,113],[7,114],[8,252],[7,115],[8,253],[13,
    8187],[19,524272],[13,8188],[14,16380],[6,34],[15,32765],[5,3],[6,35],[5,
    4],[6,36],[5,5],[6,37],[6,38],[6,39],[5,6],[7,116],[7,117],[6,40],[6,41],
    [6,42],[5,7],[6,43],[7,118],[6,44],[5,8],[5,9],[6,45],[7,119],[7,120],[7,
    121],[7,122],[7,123],[15,32766],[11,2044],[14,16381],[13,8189],[28,
    268435452],[20,1048550],[22,4194258],[20,1048551],[20,1048552],[22,
    4194259],[22,4194260],[22,4194261],[23,8388569],[22,4194262],[23,8388570],
    [23,8388571],[23,8388572],[23,8388573],[23,8388574],[24,16777195],[23,
    8388575],[24,16777196],[24,16777197],[22,4194263],[23,8388576],[24,
    16777198],[23,8388577],[23,8388578],[23,8388579],[23,8388580],[21,2097116],
    [22,4194264],[23,8388581],[22,4194265],[23,8388582],[23,8388583],[24,
    16777199],[22,4194266],[21,2097117],[20,1048553],[22,4194267],[22,4194268],
    [23,8388584],[23,8388585],[21,2097118],[23,8388586],[22,4194269],[22,
    4194270],[24,16777200],[21,2097119],[22,4194271],[23,8388587],[23,8388588],
    [21,2097120],[21,2097121],[22,4194272],[21,2097122],[23,8388589],[22,
    4194273],[23,8388590],[23,8388591],[20,1048554],[22,4194274],[22,4194275],
    [22,4194276],[23,8388592],[22,4194277],[22,4194278],[23,8388593],[26,
    67108832],[26,67108833],[20,1048555],[19,524273],[22,4194279],[23,8388594],
    [22,4194280],[25,33554412],[26,67108834],[26,67108835],[26,67108836],[27,
    134217694],[27,134217695],[26,67108837],[24,16777201],[25,33554413],[19,
    524274],[21,2097123],[26,67108838],[27,134217696],[27,134217697],[26,
    67108839],[27,134217698],[24,16777202],[21,2097124],[21,2097125],[26,
    67108840],[26,67108841],[28,268435453],[27,134217699],[27,134217700],[27,
    134217701],[20,1048556],[24,16777203],[20,1048557],[21,2097126],[22,
    4194281],[21,2097127],[21,2097128],[23,8388595],[22,4194282],[22,4194283],
    [25,33554414],[25,33554415],[24,16777204],[24,16777205],[26,67108842],[23,
    8388596],[26,67108843],[27,134217702],[26,67108844],[26,67108845],[27,
    134217703],[27,134217704],[27,134217705],[27,134217706],[27,134217707],[28,
    268435454],[27,134217708],[27,134217709],[27,134217710],[27,134217711],[27,
    134217712],[26,67108846],[30,1073741823]];

var huffman = {
	decode: decode,
	encode: encode
};

var table = [
  {
    "name": ":authority",
    "value": "",
    "nameSize": 10,
    "totalSize": 42
  },
  {
    "name": ":method",
    "value": "GET",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":method",
    "value": "POST",
    "nameSize": 7,
    "totalSize": 43
  },
  {
    "name": ":path",
    "value": "/",
    "nameSize": 5,
    "totalSize": 38
  },
  {
    "name": ":path",
    "value": "/index.html",
    "nameSize": 5,
    "totalSize": 48
  },
  {
    "name": ":scheme",
    "value": "http",
    "nameSize": 7,
    "totalSize": 43
  },
  {
    "name": ":scheme",
    "value": "https",
    "nameSize": 7,
    "totalSize": 44
  },
  {
    "name": ":status",
    "value": "200",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "204",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "206",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "304",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "400",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "404",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": ":status",
    "value": "500",
    "nameSize": 7,
    "totalSize": 42
  },
  {
    "name": "accept-charset",
    "value": "",
    "nameSize": 14,
    "totalSize": 46
  },
  {
    "name": "accept-encoding",
    "value": "gzip, deflate",
    "nameSize": 15,
    "totalSize": 60
  },
  {
    "name": "accept-language",
    "value": "",
    "nameSize": 15,
    "totalSize": 47
  },
  {
    "name": "accept-ranges",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "accept",
    "value": "",
    "nameSize": 6,
    "totalSize": 38
  },
  {
    "name": "access-control-allow-origin",
    "value": "",
    "nameSize": 27,
    "totalSize": 59
  },
  {
    "name": "age",
    "value": "",
    "nameSize": 3,
    "totalSize": 35
  },
  {
    "name": "allow",
    "value": "",
    "nameSize": 5,
    "totalSize": 37
  },
  {
    "name": "authorization",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "cache-control",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "content-disposition",
    "value": "",
    "nameSize": 19,
    "totalSize": 51
  },
  {
    "name": "content-encoding",
    "value": "",
    "nameSize": 16,
    "totalSize": 48
  },
  {
    "name": "content-language",
    "value": "",
    "nameSize": 16,
    "totalSize": 48
  },
  {
    "name": "content-length",
    "value": "",
    "nameSize": 14,
    "totalSize": 46
  },
  {
    "name": "content-location",
    "value": "",
    "nameSize": 16,
    "totalSize": 48
  },
  {
    "name": "content-range",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "content-type",
    "value": "",
    "nameSize": 12,
    "totalSize": 44
  },
  {
    "name": "cookie",
    "value": "",
    "nameSize": 6,
    "totalSize": 38
  },
  {
    "name": "date",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "etag",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "expect",
    "value": "",
    "nameSize": 6,
    "totalSize": 38
  },
  {
    "name": "expires",
    "value": "",
    "nameSize": 7,
    "totalSize": 39
  },
  {
    "name": "from",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "host",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "if-match",
    "value": "",
    "nameSize": 8,
    "totalSize": 40
  },
  {
    "name": "if-modified-since",
    "value": "",
    "nameSize": 17,
    "totalSize": 49
  },
  {
    "name": "if-none-match",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "if-range",
    "value": "",
    "nameSize": 8,
    "totalSize": 40
  },
  {
    "name": "if-unmodified-since",
    "value": "",
    "nameSize": 19,
    "totalSize": 51
  },
  {
    "name": "last-modified",
    "value": "",
    "nameSize": 13,
    "totalSize": 45
  },
  {
    "name": "link",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "location",
    "value": "",
    "nameSize": 8,
    "totalSize": 40
  },
  {
    "name": "max-forwards",
    "value": "",
    "nameSize": 12,
    "totalSize": 44
  },
  {
    "name": "proxy-authenticate",
    "value": "",
    "nameSize": 18,
    "totalSize": 50
  },
  {
    "name": "proxy-authorization",
    "value": "",
    "nameSize": 19,
    "totalSize": 51
  },
  {
    "name": "range",
    "value": "",
    "nameSize": 5,
    "totalSize": 37
  },
  {
    "name": "referer",
    "value": "",
    "nameSize": 7,
    "totalSize": 39
  },
  {
    "name": "refresh",
    "value": "",
    "nameSize": 7,
    "totalSize": 39
  },
  {
    "name": "retry-after",
    "value": "",
    "nameSize": 11,
    "totalSize": 43
  },
  {
    "name": "server",
    "value": "",
    "nameSize": 6,
    "totalSize": 38
  },
  {
    "name": "set-cookie",
    "value": "",
    "nameSize": 10,
    "totalSize": 42
  },
  {
    "name": "strict-transport-security",
    "value": "",
    "nameSize": 25,
    "totalSize": 57
  },
  {
    "name": "transfer-encoding",
    "value": "",
    "nameSize": 17,
    "totalSize": 49
  },
  {
    "name": "user-agent",
    "value": "",
    "nameSize": 10,
    "totalSize": 42
  },
  {
    "name": "vary",
    "value": "",
    "nameSize": 4,
    "totalSize": 36
  },
  {
    "name": "via",
    "value": "",
    "nameSize": 3,
    "totalSize": 35
  },
  {
    "name": "www-authenticate",
    "value": "",
    "nameSize": 16,
    "totalSize": 48
  }
];
var map = {
  ":authority": {
    "index": 1,
    "values": {
      "": 1
    }
  },
  ":method": {
    "index": 2,
    "values": {
      "GET": 2,
      "POST": 3
    }
  },
  ":path": {
    "index": 4,
    "values": {
      "/": 4,
      "/index.html": 5
    }
  },
  ":scheme": {
    "index": 6,
    "values": {
      "http": 6,
      "https": 7
    }
  },
  ":status": {
    "index": 8,
    "values": {
      "200": 8,
      "204": 9,
      "206": 10,
      "304": 11,
      "400": 12,
      "404": 13,
      "500": 14
    }
  },
  "accept-charset": {
    "index": 15,
    "values": {
      "": 15
    }
  },
  "accept-encoding": {
    "index": 16,
    "values": {
      "gzip, deflate": 16
    }
  },
  "accept-language": {
    "index": 17,
    "values": {
      "": 17
    }
  },
  "accept-ranges": {
    "index": 18,
    "values": {
      "": 18
    }
  },
  "accept": {
    "index": 19,
    "values": {
      "": 19
    }
  },
  "access-control-allow-origin": {
    "index": 20,
    "values": {
      "": 20
    }
  },
  "age": {
    "index": 21,
    "values": {
      "": 21
    }
  },
  "allow": {
    "index": 22,
    "values": {
      "": 22
    }
  },
  "authorization": {
    "index": 23,
    "values": {
      "": 23
    }
  },
  "cache-control": {
    "index": 24,
    "values": {
      "": 24
    }
  },
  "content-disposition": {
    "index": 25,
    "values": {
      "": 25
    }
  },
  "content-encoding": {
    "index": 26,
    "values": {
      "": 26
    }
  },
  "content-language": {
    "index": 27,
    "values": {
      "": 27
    }
  },
  "content-length": {
    "index": 28,
    "values": {
      "": 28
    }
  },
  "content-location": {
    "index": 29,
    "values": {
      "": 29
    }
  },
  "content-range": {
    "index": 30,
    "values": {
      "": 30
    }
  },
  "content-type": {
    "index": 31,
    "values": {
      "": 31
    }
  },
  "cookie": {
    "index": 32,
    "values": {
      "": 32
    }
  },
  "date": {
    "index": 33,
    "values": {
      "": 33
    }
  },
  "etag": {
    "index": 34,
    "values": {
      "": 34
    }
  },
  "expect": {
    "index": 35,
    "values": {
      "": 35
    }
  },
  "expires": {
    "index": 36,
    "values": {
      "": 36
    }
  },
  "from": {
    "index": 37,
    "values": {
      "": 37
    }
  },
  "host": {
    "index": 38,
    "values": {
      "": 38
    }
  },
  "if-match": {
    "index": 39,
    "values": {
      "": 39
    }
  },
  "if-modified-since": {
    "index": 40,
    "values": {
      "": 40
    }
  },
  "if-none-match": {
    "index": 41,
    "values": {
      "": 41
    }
  },
  "if-range": {
    "index": 42,
    "values": {
      "": 42
    }
  },
  "if-unmodified-since": {
    "index": 43,
    "values": {
      "": 43
    }
  },
  "last-modified": {
    "index": 44,
    "values": {
      "": 44
    }
  },
  "link": {
    "index": 45,
    "values": {
      "": 45
    }
  },
  "location": {
    "index": 46,
    "values": {
      "": 46
    }
  },
  "max-forwards": {
    "index": 47,
    "values": {
      "": 47
    }
  },
  "proxy-authenticate": {
    "index": 48,
    "values": {
      "": 48
    }
  },
  "proxy-authorization": {
    "index": 49,
    "values": {
      "": 49
    }
  },
  "range": {
    "index": 50,
    "values": {
      "": 50
    }
  },
  "referer": {
    "index": 51,
    "values": {
      "": 51
    }
  },
  "refresh": {
    "index": 52,
    "values": {
      "": 52
    }
  },
  "retry-after": {
    "index": 53,
    "values": {
      "": 53
    }
  },
  "server": {
    "index": 54,
    "values": {
      "": 54
    }
  },
  "set-cookie": {
    "index": 55,
    "values": {
      "": 55
    }
  },
  "strict-transport-security": {
    "index": 56,
    "values": {
      "": 56
    }
  },
  "transfer-encoding": {
    "index": 57,
    "values": {
      "": 57
    }
  },
  "user-agent": {
    "index": 58,
    "values": {
      "": 58
    }
  },
  "vary": {
    "index": 59,
    "values": {
      "": 59
    }
  },
  "via": {
    "index": 60,
    "values": {
      "": 60
    }
  },
  "www-authenticate": {
    "index": 61,
    "values": {
      "": 61
    }
  }
};

var staticTable = {
	table: table,
	map: map
};

var utils$6 = hpack_1.utils;
var assert$2 = utils$6.assert;

function Table(options) {
  this['static'] = hpack_1['static-table'];
  this.dynamic = [];
  this.size = 0;
  this.maxSize = 0;
  this.length = this['static'].table.length;
  this.protocolMaxSize = options.maxSize;
  this.maxSize = this.protocolMaxSize;
  this.lookupDepth = options.lookupDepth || 32;
}
var table$1 = Table;

Table.create = function create(options) {
  return new Table(options);
};

Table.prototype.lookup = function lookup(index) {
  assert$2(index !== 0, 'Zero indexed field');
  assert$2(index <= this.length, 'Indexed field OOB');

  if (index <= this['static'].table.length)
    return this['static'].table[index - 1];
  else
    return this.dynamic[this.length - index];
};

Table.prototype.reverseLookup = function reverseLookup(name, value) {
  var staticEntry = this['static'].map[name];
  if (staticEntry && staticEntry.values[value])
    return staticEntry.values[value];

  // Reverse search dynamic table (new items are at the end of it)
  var limit = Math.max(0, this.dynamic.length - this.lookupDepth);
  for (var i = this.dynamic.length - 1; i >= limit; i--) {
    var entry = this.dynamic[i];
    if (entry.name === name && entry.value === value)
      return this.length - i;

    if (entry.name === name) {
      // Prefer smaller index
      if (staticEntry)
        break;
      return -(this.length - i);
    }
  }

  if (staticEntry)
    return -staticEntry.index;

  return 0;
};

Table.prototype.add = function add(name, value, nameSize, valueSize) {
  var totalSize = nameSize + valueSize + 32;

  this.dynamic.push({
    name: name,
    value: value,
    nameSize: nameSize,
    totalSize: totalSize
  });
  this.size += totalSize;
  this.length++;

  this.evict();
};

Table.prototype.evict = function evict() {
  while (this.size > this.maxSize) {
    var entry = this.dynamic.shift();
    this.size -= entry.totalSize;
    this.length--;
  }
  assert$2(this.size >= 0, 'Table size sanity check failed');
};

Table.prototype.updateSize = function updateSize(size) {
  assert$2(size <= this.protocolMaxSize, 'Table size bigger than maximum');
  this.maxSize = size;
  this.evict();
};

var utils$7 = hpack_1.utils;
var huffman$1 = hpack_1.huffman.decode;
var assert$3 = utils$7.assert;



function Decoder() {
  this.buffer = new obuf();
  this.bitOffset = 0;

  // Used internally in decodeStr
  this._huffmanNode = null;
}
var decoder = Decoder;

Decoder.create = function create() {
  return new Decoder();
};

Decoder.prototype.isEmpty = function isEmpty() {
  return this.buffer.isEmpty();
};

Decoder.prototype.push = function push(chunk) {
  this.buffer.push(chunk);
};

Decoder.prototype.decodeBit = function decodeBit() {
  // Need at least one octet
  assert$3(this.buffer.has(1), 'Buffer too small for an int');

  var octet;
  var offset = this.bitOffset;

  if (++this.bitOffset === 8) {
    octet = this.buffer.readUInt8();
    this.bitOffset = 0;
  } else {
    octet = this.buffer.peekUInt8();
  }
  return (octet >>> (7 - offset)) & 1;
};

// Just for testing
Decoder.prototype.skipBits = function skipBits(n) {
  this.bitOffset += n;
  this.buffer.skip(this.bitOffset >> 3);
  this.bitOffset &= 0x7;
};

Decoder.prototype.decodeInt = function decodeInt() {
  // Need at least one octet
  assert$3(this.buffer.has(1), 'Buffer too small for an int');

  var prefix = 8 - this.bitOffset;

  // We are going to end up octet-aligned
  this.bitOffset = 0;

  var max = (1 << prefix) - 1;
  var octet = this.buffer.readUInt8() & max;

  // Fast case - int fits into the prefix
  if (octet !== max)
    return octet;

  // TODO(indutny): what about > 32bit numbers?
  var res = 0;
  var isLast = false;
  var len = 0;
  do {
    octet = this.buffer.readUInt8();
    isLast = (octet & 0x80) === 0;

    res <<= 7;
    res |= octet & 0x7f;
    len++;
  } while (!isLast);
  assert$3(isLast, 'Incomplete data for multi-octet integer');
  assert$3(len <= 4, 'Integer does not fit into 32 bits');

  // Reverse bits
  res = (res >>> 21) |
        (((res >> 14) & 0x7f) << 7) |
        (((res >> 7) & 0x7f) << 14) |
        ((res & 0x7f) << 21);
  res >>= (4 - len) * 7;

  // Append prefix max
  res += max;

  return res;
};

Decoder.prototype.decodeHuffmanWord = function decodeHuffmanWord(input,
                                                                 inputBits,
                                                                 out) {
  var root = huffman$1;
  var node = this._huffmanNode;
  var word = input;
  var bits = inputBits;

  for (; bits > 0; word &= (1 << bits) - 1) {
    // Nudge the word bit length to match it
    for (var i = Math.max(0, bits - 8); i < bits; i++) {
      var subnode = node[word >>> i];
      if (typeof subnode !== 'number') {
        node = subnode;
        bits = i;
        break;
      }

      if (subnode === 0)
        continue;

      // Word bit length should match
      if ((subnode >>> 9) !== bits - i) {
        subnode = 0;
        continue;
      }

      var octet = subnode & 0x1ff;
      assert$3(octet !== 256, 'EOS in encoding');
      out.push(octet);
      node = root;

      bits = i;
      break;
    }
    if (subnode === 0)
      break;
  }
  this._huffmanNode = node;

  return bits;
};

Decoder.prototype.decodeStr = function decodeStr() {
  var isHuffman = this.decodeBit();
  var len = this.decodeInt();
  assert$3(this.buffer.has(len), 'Not enough octets for string');

  if (!isHuffman)
    return this.buffer.take(len);

  this._huffmanNode = huffman$1;

  var out = [];

  var word = 0;
  var bits = 0;
  for (var i = 0; i < len; i++) {
    word <<= 8;
    word |= this.buffer.readUInt8();
    bits += 8;

    bits = this.decodeHuffmanWord(word, bits, out);
    word &= (1 << bits) - 1;
  }
  assert$3(this._huffmanNode === huffman$1, '8-bit EOS');
  assert$3(word + 1 === (1 << bits), 'Final sequence is not EOS');

  this._huffmanNode = null;

  return out;
};

var processNextickArgs = createCommonjsModule(function (module) {

if (typeof process === 'undefined' ||
    !process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}
});

var toString = {}.toString;

var isarray = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

var stream$1 = stream$3;

var safeBuffer$1 = createCommonjsModule(function (module, exports) {
/* eslint-disable node/no-deprecated-api */

var Buffer = buffer.Buffer;

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key];
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer;
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports);
  exports.Buffer = SafeBuffer;
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

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
  return buffer.SlowBuffer(size)
};
});

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
var isArray_1 = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
var isBoolean_1 = isBoolean;

function isNull(arg) {
  return arg === null;
}
var isNull_1 = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
var isNullOrUndefined_1 = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
var isNumber_1 = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
var isString_1 = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
var isSymbol_1 = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
var isUndefined_1 = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
var isRegExp_1 = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
var isObject_1 = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
var isDate_1 = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
var isError_1 = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
var isFunction_1 = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
var isPrimitive_1 = isPrimitive;

var isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

var util = {
	isArray: isArray_1,
	isBoolean: isBoolean_1,
	isNull: isNull_1,
	isNullOrUndefined: isNullOrUndefined_1,
	isNumber: isNumber_1,
	isString: isString_1,
	isSymbol: isSymbol_1,
	isUndefined: isUndefined_1,
	isRegExp: isRegExp_1,
	isObject: isObject_1,
	isDate: isDate_1,
	isError: isError_1,
	isFunction: isFunction_1,
	isPrimitive: isPrimitive_1,
	isBuffer: isBuffer
};

var BufferList = createCommonjsModule(function (module) {

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = safeBuffer$1.Buffer;


function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util$6 && util$6.inspect && util$6.inspect.custom) {
  module.exports.prototype[util$6.inspect.custom] = function () {
    var obj = util$6.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
});

/*<replacement>*/


/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy$1(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      processNextickArgs.nextTick(emitErrorNT$1, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      processNextickArgs.nextTick(emitErrorNT$1, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy$1() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT$1(self, err) {
  self.emit('error', err);
}

var destroy_1$1 = {
  destroy: destroy$1,
  undestroy: undestroy$1
};

/*<replacement>*/


/*</replacement>*/

var _stream_writable$1 = Writable$1;

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest$1(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish$1(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextickArgs.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex$3;
/*</replacement>*/

Writable$1.WritableState = WritableState$1;

/*<replacement>*/
var util$1 = Object.create(util);
util$1.inherits = inherits;
/*</replacement>*/

/*<replacement>*/
var internalUtil$1 = {
  deprecate: node$1
};
/*</replacement>*/

/*<replacement>*/

/*</replacement>*/

/*<replacement>*/

var Buffer$a = safeBuffer$1.Buffer;
var OurUint8Array$2 = commonjsGlobal.Uint8Array || function () {};
function _uint8ArrayToBuffer$2(chunk) {
  return Buffer$a.from(chunk);
}
function _isUint8Array$2(obj) {
  return Buffer$a.isBuffer(obj) || obj instanceof OurUint8Array$2;
}

/*</replacement>*/



util$1.inherits(Writable$1, stream$1);

function nop$1() {}

function WritableState$1(options, stream) {
  Duplex$3 = Duplex$3 || _stream_duplex$1;

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex$3;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite$1(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest$1(this);
}

WritableState$1.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState$1.prototype, 'buffer', {
      get: internalUtil$1.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance$1;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance$1 = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable$1, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance$1.call(this, object)) return true;
      if (this !== Writable$1) return false;

      return object && object._writableState instanceof WritableState$1;
    }
  });
} else {
  realHasInstance$1 = function (object) {
    return object instanceof this;
  };
}

function Writable$1(options) {
  Duplex$3 = Duplex$3 || _stream_duplex$1;

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance$1.call(Writable$1, this) && !(this instanceof Duplex$3)) {
    return new Writable$1(options);
  }

  this._writableState = new WritableState$1(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  stream$1.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable$1.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd$1(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextickArgs.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk$1(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    processNextickArgs.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable$1.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array$2(chunk);

  if (isBuf && !Buffer$a.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer$2(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop$1;

  if (state.ended) writeAfterEnd$1(this, cb);else if (isBuf || validChunk$1(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer$1(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable$1.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable$1.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer$1(this, state);
  }
};

Writable$1.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk$1(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer$a.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable$1.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer$1(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk$1(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite$1(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite$1(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError$1(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    processNextickArgs.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    processNextickArgs.nextTick(finishMaybe$1, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe$1(stream, state);
  }
}

function onwriteStateUpdate$1(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite$1(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate$1(state);

  if (er) onwriteError$1(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish$1(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer$1(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite$1, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite$1(stream, state, finished, cb);
    }
  }
}

function afterWrite$1(stream, state, finished, cb) {
  if (!finished) onwriteDrain$1(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe$1(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain$1(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer$1(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite$1(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest$1(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite$1(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable$1.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable$1.prototype._writev = null;

Writable$1.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable$1(this, state, cb);
};

function needFinish$1(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal$1(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe$1(stream, state);
  });
}
function prefinish$2(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      processNextickArgs.nextTick(callFinal$1, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe$1(stream, state) {
  var need = needFinish$1(state);
  if (need) {
    prefinish$2(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable$1(stream, state, cb) {
  state.ending = true;
  finishMaybe$1(stream, state);
  if (cb) {
    if (state.finished) processNextickArgs.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish$1(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable$1.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable$1.prototype.destroy = destroy_1$1.destroy;
Writable$1.prototype._undestroy = destroy_1$1.undestroy;
Writable$1.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};

/*<replacement>*/


/*</replacement>*/

/*<replacement>*/
var objectKeys$1 = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

var _stream_duplex$1 = Duplex$4;

/*<replacement>*/
var util$2 = Object.create(util);
util$2.inherits = inherits;
/*</replacement>*/




util$2.inherits(Duplex$4, _stream_readable$1);

{
  // avoid scope creep, the keys array can then be collected
  var keys$1 = objectKeys$1(_stream_writable$1.prototype);
  for (var v$1 = 0; v$1 < keys$1.length; v$1++) {
    var method$1 = keys$1[v$1];
    if (!Duplex$4.prototype[method$1]) Duplex$4.prototype[method$1] = _stream_writable$1.prototype[method$1];
  }
}

function Duplex$4(options) {
  if (!(this instanceof Duplex$4)) return new Duplex$4(options);

  _stream_readable$1.call(this, options);
  _stream_writable$1.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend$1);
}

Object.defineProperty(Duplex$4.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend$1() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextickArgs.nextTick(onEndNT$1, this);
}

function onEndNT$1(self) {
  self.end();
}

Object.defineProperty(Duplex$4.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex$4.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  processNextickArgs.nextTick(cb, err);
};

/*<replacement>*/

var Buffer$b = safeBuffer$1.Buffer;
/*</replacement>*/

var isEncoding$1 = Buffer$b.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding$1(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
}
// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding$1(enc) {
  var nenc = _normalizeEncoding$1(enc);
  if (typeof nenc !== 'string' && (Buffer$b.isEncoding === isEncoding$1 || !isEncoding$1(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
var StringDecoder_1$1 = StringDecoder$2;
function StringDecoder$2(encoding) {
  this.encoding = normalizeEncoding$1(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text$1;
      this.end = utf16End$1;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast$1;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text$1;
      this.end = base64End$1;
      nb = 3;
      break;
    default:
      this.write = simpleWrite$1;
      this.end = simpleEnd$1;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer$b.allocUnsafe(nb);
}

StringDecoder$2.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder$2.prototype.end = utf8End$1;

// Returns only complete characters in a Buffer
StringDecoder$2.prototype.text = utf8Text$1;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder$2.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte$1(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete$1(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte$1(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte$1(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte$1(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes$1(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast$1(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes$1(this, buf);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text$1(buf, i) {
  var total = utf8CheckIncomplete$1(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End$1(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text$1(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End$1(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text$1(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End$1(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite$1(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd$1(buf) {
  return buf && buf.length ? this.write(buf) : '';
}

var string_decoder$1 = {
	StringDecoder: StringDecoder_1$1
};

/*<replacement>*/


/*</replacement>*/

var _stream_readable$1 = Readable$2;

/*<replacement>*/

/*</replacement>*/

/*<replacement>*/
var Duplex$5;
/*</replacement>*/

Readable$2.ReadableState = ReadableState$1;

/*<replacement>*/
var EE$1 = events.EventEmitter;

var EElistenerCount$1 = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/

/*</replacement>*/

/*<replacement>*/

var Buffer$c = safeBuffer$1.Buffer;
var OurUint8Array$3 = commonjsGlobal.Uint8Array || function () {};
function _uint8ArrayToBuffer$3(chunk) {
  return Buffer$c.from(chunk);
}
function _isUint8Array$3(obj) {
  return Buffer$c.isBuffer(obj) || obj instanceof OurUint8Array$3;
}

/*</replacement>*/

/*<replacement>*/
var util$3 = Object.create(util);
util$3.inherits = inherits;
/*</replacement>*/

/*<replacement>*/

var debug$4 = void 0;
if (util$6 && util$6.debuglog) {
  debug$4 = util$6.debuglog('stream');
} else {
  debug$4 = function () {};
}
/*</replacement>*/



var StringDecoder$3;

util$3.inherits(Readable$2, stream$1);

var kProxyEvents$1 = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener$1(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isarray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState$1(options, stream) {
  Duplex$5 = Duplex$5 || _stream_duplex$1;

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex$5;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder$3) StringDecoder$3 = string_decoder$1.StringDecoder;
    this.decoder = new StringDecoder$3(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable$2(options) {
  Duplex$5 = Duplex$5 || _stream_duplex$1;

  if (!(this instanceof Readable$2)) return new Readable$2(options);

  this._readableState = new ReadableState$1(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  stream$1.call(this);
}

Object.defineProperty(Readable$2.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable$2.prototype.destroy = destroy_1$1.destroy;
Readable$2.prototype._undestroy = destroy_1$1.undestroy;
Readable$2.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable$2.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer$c.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk$1(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable$2.prototype.unshift = function (chunk) {
  return readableAddChunk$1(this, chunk, null, true, false);
};

function readableAddChunk$1(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk$1(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid$1(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer$c.prototype) {
        chunk = _uint8ArrayToBuffer$3(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk$1(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk$1(stream, state, chunk, false);else maybeReadMore$1(stream, state);
        } else {
          addChunk$1(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk$1(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable$1(stream);
  }
  maybeReadMore$1(stream, state);
}

function chunkInvalid$1(state, chunk) {
  var er;
  if (!_isUint8Array$3(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable$2.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable$2.prototype.setEncoding = function (enc) {
  if (!StringDecoder$3) StringDecoder$3 = string_decoder$1.StringDecoder;
  this._readableState.decoder = new StringDecoder$3(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM$1 = 0x800000;
function computeNewHighWaterMark$1(n) {
  if (n >= MAX_HWM$1) {
    n = MAX_HWM$1;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead$1(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark$1(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable$2.prototype.read = function (n) {
  debug$4('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug$4('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable$1(this);else emitReadable$1(this);
    return null;
  }

  n = howMuchToRead$1(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable$1(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug$4('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug$4('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug$4('reading or ended', doRead);
  } else if (doRead) {
    debug$4('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead$1(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList$1(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable$1(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk$1(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable$1(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable$1(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug$4('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextickArgs.nextTick(emitReadable_$1, stream);else emitReadable_$1(stream);
  }
}

function emitReadable_$1(stream) {
  debug$4('emit readable');
  stream.emit('readable');
  flow$1(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore$1(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextickArgs.nextTick(maybeReadMore_$1, stream, state);
  }
}

function maybeReadMore_$1(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug$4('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable$2.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable$2.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug$4('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) processNextickArgs.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug$4('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug$4('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain$1(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug$4('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug$4('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf$1(state.pipes, dest) !== -1) && !cleanedUp) {
        debug$4('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug$4('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount$1(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener$1(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug$4('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug$4('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug$4('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain$1(src) {
  return function () {
    var state = src._readableState;
    debug$4('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount$1(src, 'data')) {
      state.flowing = true;
      flow$1(src);
    }
  };
}

Readable$2.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf$1(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable$2.prototype.on = function (ev, fn) {
  var res = stream$1.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        processNextickArgs.nextTick(nReadingNextTick$1, this);
      } else if (state.length) {
        emitReadable$1(this);
      }
    }
  }

  return res;
};
Readable$2.prototype.addListener = Readable$2.prototype.on;

function nReadingNextTick$1(self) {
  debug$4('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable$2.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug$4('resume');
    state.flowing = true;
    resume$1(this, state);
  }
  return this;
};

function resume$1(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextickArgs.nextTick(resume_$1, stream, state);
  }
}

function resume_$1(stream, state) {
  if (!state.reading) {
    debug$4('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow$1(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable$2.prototype.pause = function () {
  debug$4('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug$4('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow$1(stream) {
  var state = stream._readableState;
  debug$4('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable$2.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug$4('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug$4('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents$1.length; n++) {
    stream.on(kProxyEvents$1[n], this.emit.bind(this, kProxyEvents$1[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug$4('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable$2.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable$2._fromList = fromList$1;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList$1(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer$c.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable$1(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextickArgs.nextTick(endReadableNT$1, state, stream);
  }
}

function endReadableNT$1(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf$1(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

var _stream_transform$1 = Transform$2;



/*<replacement>*/
var util$4 = Object.create(util);
util$4.inherits = inherits;
/*</replacement>*/

util$4.inherits(Transform$2, _stream_duplex$1);

function afterTransform$1(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform$2(options) {
  if (!(this instanceof Transform$2)) return new Transform$2(options);

  _stream_duplex$1.call(this, options);

  this._transformState = {
    afterTransform: afterTransform$1.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish$3);
}

function prefinish$3() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done$1(_this, er, data);
    });
  } else {
    done$1(this, null, null);
  }
}

Transform$2.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return _stream_duplex$1.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform$2.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform$2.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform$2.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform$2.prototype._destroy = function (err, cb) {
  var _this2 = this;

  _stream_duplex$1.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done$1(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}

var _stream_passthrough$1 = PassThrough$1;



/*<replacement>*/
var util$5 = Object.create(util);
util$5.inherits = inherits;
/*</replacement>*/

util$5.inherits(PassThrough$1, _stream_transform$1);

function PassThrough$1(options) {
  if (!(this instanceof PassThrough$1)) return new PassThrough$1(options);

  _stream_transform$1.call(this, options);
}

PassThrough$1.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};

var readable$1 = createCommonjsModule(function (module, exports) {
if (process.env.READABLE_STREAM === 'disable' && stream$3) {
  module.exports = stream$3;
  exports = module.exports = stream$3.Readable;
  exports.Readable = stream$3.Readable;
  exports.Writable = stream$3.Writable;
  exports.Duplex = stream$3.Duplex;
  exports.Transform = stream$3.Transform;
  exports.PassThrough = stream$3.PassThrough;
  exports.Stream = stream$3;
} else {
  exports = module.exports = _stream_readable$1;
  exports.Stream = stream$3 || exports;
  exports.Readable = exports;
  exports.Writable = _stream_writable$1;
  exports.Duplex = _stream_duplex$1;
  exports.Transform = _stream_transform$1;
  exports.PassThrough = _stream_passthrough$1;
}
});

var utils$8 = hpack_1.utils;
var decoder$1 = hpack_1.decoder;
var table$2 = hpack_1.table;
var assert$4 = utils$8.assert;


var Duplex$6 = readable$1.Duplex;

function Decompressor(options) {
  Duplex$6.call(this, {
    readableObjectMode: true
  });

  this._decoder = decoder$1.create();
  this._table = table$2.create(options.table);
}
inherits(Decompressor, Duplex$6);
var decompressor = Decompressor;

Decompressor.create = function create(options) {
  return new Decompressor(options);
};

Decompressor.prototype._read = function _read() {
  // We only push!
};

Decompressor.prototype._write = function _write(data, enc, cb) {
  this._decoder.push(data);

  cb(null);
};

Decompressor.prototype.execute = function execute(cb) {
  while (!this._decoder.isEmpty()) {
    try {
      this._execute();
    } catch (err) {
      if (cb)
        return done(err);
      else
        return this.emit('error', err);
    }
  }

  if (cb)
    done(null);

  function done(err) {
    process.nextTick(function() {
      cb(err);
    });
  }
};

Decompressor.prototype.updateTableSize = function updateTableSize(size) {
  this._table.updateSize(size);
};

Decompressor.prototype._execute = function _execute() {
  var isIndexed = this._decoder.decodeBit();
  if (isIndexed)
    return this._processIndexed();

  var isIncremental = this._decoder.decodeBit();
  var neverIndex = 0;
  if (!isIncremental) {
    var isUpdate = this._decoder.decodeBit();
    if (isUpdate)
      return this._processUpdate();

    neverIndex = this._decoder.decodeBit();
  }

  this._processLiteral(isIncremental, neverIndex);
};

Decompressor.prototype._processIndexed = function _processIndexed() {
  var index = this._decoder.decodeInt();

  var lookup = this._table.lookup(index);
  this.push({ name: lookup.name, value: lookup.value, neverIndex: false });
};

Decompressor.prototype._processLiteral = function _processLiteral(inc, never) {
  var index = this._decoder.decodeInt();

  var name;
  var nameSize;

  // Literal header-name too
  if (index === 0) {
    name = this._decoder.decodeStr();
    nameSize = name.length;
    name = utils$8.stringify(name);
  } else {
    var lookup = this._table.lookup(index);
    nameSize = lookup.nameSize;
    name = lookup.name;
  }

  var value = this._decoder.decodeStr();
  var valueSize = value.length;
  value = utils$8.stringify(value);

  if (inc)
    this._table.add(name, value, nameSize, valueSize);

  this.push({ name: name, value: value, neverIndex: never !== 0});
};

Decompressor.prototype._processUpdate = function _processUpdate() {
  var size = this._decoder.decodeInt();
  this.updateTableSize(size);
};

var utils$9 = hpack_1.utils;
var huffman$2 = hpack_1.huffman.encode;
var assert$5 = utils$9.assert;



function Encoder() {
  this.buffer = new wbuf();
  this.word = 0;
  this.bitOffset = 0;
}
var encoder = Encoder;

Encoder.create = function create() {
  return new Encoder();
};

Encoder.prototype.render = function render() {
  return this.buffer.render();
};

Encoder.prototype.encodeBit = function encodeBit(bit) {

  this.word <<= 1;
  this.word |= bit;
  this.bitOffset++;

  if (this.bitOffset === 8) {
    this.buffer.writeUInt8(this.word);
    this.word = 0;
    this.bitOffset = 0;
  }
};

Encoder.prototype.encodeBits = function encodeBits(bits, len) {
  var left = bits;
  var leftLen = len;

  while (leftLen > 0) {
    var avail = Math.min(leftLen, 8 - this.bitOffset);
    var toWrite = left >>> (leftLen - avail);

    if (avail === 8) {
      this.buffer.writeUInt8(toWrite);
    } else {
      this.word <<= avail;
      this.word |= toWrite;
      this.bitOffset += avail;
      if (this.bitOffset === 8) {
        this.buffer.writeUInt8(this.word);
        this.word = 0;
        this.bitOffset = 0;
      }
    }

    leftLen -= avail;
    left &= (1 << leftLen) - 1;
  }
};

// Just for testing
Encoder.prototype.skipBits = function skipBits(num) {
  this.bitOffset += num;
  this.buffer.skip(this.bitOffset >> 3);
  this.bitOffset &= 0x7;
};

Encoder.prototype.encodeInt = function encodeInt(num) {
  var prefix = 8 - this.bitOffset;

  // We are going to end up octet-aligned
  this.bitOffset = 0;

  var max = (1 << prefix) - 1;

  // Fast case - int fits into the prefix
  if (num < max) {
    this.buffer.writeUInt8((this.word << prefix) | num);
    return octet;
  }

  var left = num - max;
  this.buffer.writeUInt8((this.word << prefix) | max);
  do {
    var octet = left & 0x7f;
    left >>= 7;
    if (left !== 0)
      octet |= 0x80;

    this.buffer.writeUInt8(octet);
  } while (left !== 0);
};

Encoder.prototype.encodeStr = function encodeStr(value, isHuffman) {
  this.encodeBit(isHuffman ? 1 : 0);

  if (!isHuffman) {
    this.buffer.reserve(value.length + 1);
    this.encodeInt(value.length);
    for (var i = 0; i < value.length; i++)
      this.buffer.writeUInt8(value[i]);
    return;
  }

  var codes = [];
  var len = 0;
  var pad = 0;

  for (var i = 0; i < value.length; i++) {
    var code = huffman$2[value[i]];
    codes.push(code);
    len += code[0];
  }
  if (len % 8 !== 0)
    pad = 8 - (len % 8);
  len += pad;

  this.buffer.reserve((len / 8) + 1);
  this.encodeInt(len / 8);
  for (var i = 0; i < codes.length; i++) {
    var code = codes[i];
    this.encodeBits(code[1], code[0]);
  }

  // Append padding
  this.encodeBits(0xff >>> (8 - pad), pad);
};

var utils$a = hpack_1.utils;
var encoder$1 = hpack_1.encoder;
var table$3 = hpack_1.table;
var assert$6 = utils$a.assert;


var Duplex$7 = readable$1.Duplex;

function Compressor(options) {
  Duplex$7.call(this, {
    writableObjectMode: true
  });

  this._encoder = null;
  this._table = table$3.create(options.table);
}
inherits(Compressor, Duplex$7);
var compressor = Compressor;

Compressor.create = function create(options) {
  return new Compressor(options);
};

Compressor.prototype._read = function _read() {
  // We only push!
};

Compressor.prototype._write = function _write(data, enc, cb) {
  assert$6(Array.isArray(data), 'Compressor.write() expects list of headers');

  this._encoder = encoder$1.create();
  for (var i = 0; i < data.length; i++)
    this._encodeHeader(data[i]);

  var data = this._encoder.render();
  this._encoder = null;

  cb(null);
  for (var i = 0; i < data.length; i++)
    this.push(data[i]);
};

Compressor.prototype.updateTableSize = function updateTableSize(size) {
  if (size >= this._table.protocolMaxSize) {
    size = this._table.protocolMaxSize;

    var enc = encoder$1.create();

    // indexed = 0
    // incremental = 0
    // update = 1
    enc.encodeBits(1, 3);
    enc.encodeInt(size);

    var data = enc.render();
    for (var i = 0; i < data.length; i++)
      this.push(data[i]);
  }

  this._table.updateSize(size);
};

Compressor.prototype.reset = function reset() {
  var enc = encoder$1.create();
  var size = this._table.maxSize;

  // indexed = 0
  // incremental = 0
  // update = 1
  enc.encodeBits(1, 3);
  enc.encodeInt(0);

  // Evict everything
  this._table.updateSize(0);

  // indexed = 0
  // incremental = 0
  // update = 1
  enc.encodeBits(1, 3);
  enc.encodeInt(size);

  // Revert size
  this._table.updateSize(size);

  var data = enc.render();
  for (var i = 0; i < data.length; i++)
    this.push(data[i]);
};

Compressor.prototype._encodeHeader = function _encodeHeader(header) {
  if (header.neverIndex) {
    var index = 0;
    var neverIndex = 1;
    var isIndexed = 0;
    var isIncremental = 0;
  } else {
    var index = this._table.reverseLookup(header.name, header.value);
    var isIndexed = index > 0;
    var isIncremental = header.incremental !== false;
    var neverIndex = 0;
  }

  this._encoder.encodeBit(isIndexed);
  if (isIndexed) {
    this._encoder.encodeInt(index);
    return;
  }

  var name = utils$a.toArray(header.name);
  var value = utils$a.toArray(header.value);

  this._encoder.encodeBit(isIncremental);
  if (isIncremental) {
    this._table.add(header.name, header.value, name.length, value.length);
  } else {
    // Update = false
    this._encoder.encodeBit(0);
    this._encoder.encodeBit(neverIndex);
  }

  // index is negative for `name`-only headers
  this._encoder.encodeInt(-index);
  if (index === 0)
    this._encoder.encodeStr(name, header.huffman !== false);
  this._encoder.encodeStr(value, header.huffman !== false);
};

var hpack_1 = createCommonjsModule(function (module, exports) {
var hpack = exports;

hpack.utils = utils$5;
hpack.huffman = huffman;
hpack['static-table'] = staticTable;
hpack.table = table$1;

hpack.decoder = decoder;
hpack.decompressor = decompressor;

hpack.encoder = encoder;
hpack.compressor = compressor;
});

var constants$7 = http2.constants;



function Pool () {
}
var hpackPool = Pool;

Pool.create = function create () {
  return new Pool()
};

Pool.prototype.get = function get (version) {
  var options = {
    table: {
      maxSize: constants$7.HEADER_TABLE_SIZE
    }
  };

  var compress = hpack_1.compressor.create(options);
  var decompress = hpack_1.decompressor.create(options);

  return {
    version: version,

    compress: compress,
    decompress: decompress
  }
};

Pool.prototype.put = function put () {
};

var name$1 = 'h2';

var constants$8 = constants$5;
var parser$2 = parser_1$1;
var framer$4 = framer$3;
var compressionPool$1 = hpackPool;

var http2 = {
	name: name$1,
	constants: constants$8,
	parser: parser$2,
	framer: framer$4,
	compressionPool: compressionPool$1
};

var EventEmitter$1 = events.EventEmitter;
var debug$5 = {
  server: src('spdy:window:server'),
  client: src('spdy:window:client')
};

function Side (window, name, options) {
  EventEmitter$1.call(this);

  this.name = name;
  this.window = window;
  this.current = options.size;
  this.max = options.size;
  this.limit = options.max;
  this.lowWaterMark = options.lowWaterMark === undefined
    ? this.max / 2
    : options.lowWaterMark;

  this._refilling = false;
  this._refillQueue = [];
}
util$6.inherits(Side, EventEmitter$1);

Side.prototype.setMax = function setMax (max) {
  this.window.debug('id=%d side=%s setMax=%d',
    this.window.id,
    this.name,
    max);
  this.max = max;
  this.lowWaterMark = this.max / 2;
};

Side.prototype.updateMax = function updateMax (max) {
  var delta = max - this.max;
  this.window.debug('id=%d side=%s updateMax=%d delta=%d',
    this.window.id,
    this.name,
    max,
    delta);

  this.max = max;
  this.lowWaterMark = max / 2;

  this.update(delta);
};

Side.prototype.setLowWaterMark = function setLowWaterMark (lwm) {
  this.lowWaterMark = lwm;
};

Side.prototype.update = function update (size, callback) {
  // Not enough space for the update, wait for refill
  if (size <= 0 && callback && this.isEmpty()) {
    this.window.debug('id=%d side=%s wait for refill=%d [%d/%d]',
      this.window.id,
      this.name,
      -size,
      this.current,
      this.max);
    this._refillQueue.push({
      size: size,
      callback: callback
    });
    return
  }

  this.current += size;

  if (this.current > this.limit) {
    this.emit('overflow');
    return
  }

  this.window.debug('id=%d side=%s update by=%d [%d/%d]',
    this.window.id,
    this.name,
    size,
    this.current,
    this.max);

  // Time to send WINDOW_UPDATE
  if (size < 0 && this.isDraining()) {
    this.window.debug('id=%d side=%s drained', this.window.id, this.name);
    this.emit('drain');
  }

  // Time to write
  if (size > 0 && this.current > 0 && this.current <= size) {
    this.window.debug('id=%d side=%s full', this.window.id, this.name);
    this.emit('full');
  }

  this._processRefillQueue();

  if (callback) { process.nextTick(callback); }
};

Side.prototype.getCurrent = function getCurrent () {
  return this.current
};

Side.prototype.getMax = function getMax () {
  return this.max
};

Side.prototype.getDelta = function getDelta () {
  return this.max - this.current
};

Side.prototype.isDraining = function isDraining () {
  return this.current <= this.lowWaterMark
};

Side.prototype.isEmpty = function isEmpty () {
  return this.current <= 0
};

// Private

Side.prototype._processRefillQueue = function _processRefillQueue () {
  // Prevent recursion
  if (this._refilling) {
    return
  }
  this._refilling = true;

  while (this._refillQueue.length > 0) {
    var item = this._refillQueue[0];

    if (this.isEmpty()) {
      break
    }

    this.window.debug('id=%d side=%s refilled for size=%d',
      this.window.id,
      this.name,
      -item.size);

    this._refillQueue.shift();
    this.update(item.size, item.callback);
  }

  this._refilling = false;
};

function Window (options) {
  this.id = options.id;
  this.isServer = options.isServer;
  this.debug = this.isServer ? debug$5.server : debug$5.client;

  this.recv = new Side(this, 'recv', options.recv);
  this.send = new Side(this, 'send', options.send);
}
var window$1 = Window;

Window.prototype.clone = function clone (id) {
  return new Window({
    id: id,
    isServer: this.isServer,
    recv: {
      size: this.recv.max,
      max: this.recv.limit,
      lowWaterMark: this.recv.lowWaterMark
    },
    send: {
      size: this.send.max,
      max: this.send.limit,
      lowWaterMark: this.send.lowWaterMark
    }
  })
};

var utils$b = spdyTransport.utils;


var debug$6 = src('spdy:priority');

function PriorityNode (tree, options) {
  this.tree = tree;

  this.id = options.id;
  this.parent = options.parent;
  this.weight = options.weight;

  // To be calculated in `addChild`
  this.priorityFrom = 0;
  this.priorityTo = 1;
  this.priority = 1;

  this.children = {
    list: [],
    weight: 0
  };

  if (this.parent !== null) {
    this.parent.addChild(this);
  }
}

function compareChildren (a, b) {
  return a.weight === b.weight ? a.id - b.id : a.weight - b.weight
}

PriorityNode.prototype.toJSON = function toJSON () {
  return {
    parent: this.parent,
    weight: this.weight,
    exclusive: this.exclusive
  }
};

PriorityNode.prototype.getPriority = function getPriority () {
  return this.priority
};

PriorityNode.prototype.getPriorityRange = function getPriorityRange () {
  return { from: this.priorityFrom, to: this.priorityTo }
};

PriorityNode.prototype.addChild = function addChild (child) {
  child.parent = this;
  utils$b.binaryInsert(this.children.list, child, compareChildren);
  this.children.weight += child.weight;

  this._updatePriority(this.priorityFrom, this.priorityTo);
};

PriorityNode.prototype.remove = function remove () {
  assert$7(this.parent, 'Can\'t remove root node');

  this.parent.removeChild(this);
  this.tree._removeNode(this);

  // Move all children to the parent
  for (var i = 0; i < this.children.list.length; i++) {
    this.parent.addChild(this.children.list[i]);
  }
};

PriorityNode.prototype.removeChild = function removeChild (child) {
  this.children.weight -= child.weight;
  var index = utils$b.binarySearch(this.children.list, child, compareChildren);
  if (index !== -1 && this.children.list.length >= index) {
    this.children.list.splice(index, 1);
  }
};

PriorityNode.prototype.removeChildren = function removeChildren () {
  var children = this.children.list;
  this.children.list = [];
  this.children.weight = 0;
  return children
};

PriorityNode.prototype._updatePriority = function _updatePriority (from, to) {
  this.priority = to - from;
  this.priorityFrom = from;
  this.priorityTo = to;

  var weight = 0;
  for (var i = 0; i < this.children.list.length; i++) {
    var node = this.children.list[i];
    var nextWeight = weight + node.weight;

    node._updatePriority(
      from + this.priority * (weight / this.children.weight),
      from + this.priority * (nextWeight / this.children.weight)
    );
    weight = nextWeight;
  }
};

function PriorityTree (options) {
  this.map = {};
  this.list = [];
  this.defaultWeight = options.defaultWeight || 16;

  this.count = 0;
  this.maxCount = options.maxCount;

  // Root
  this.root = this.add({
    id: 0,
    parent: null,
    weight: 1
  });
}
var priority = PriorityTree;

PriorityTree.create = function create (options) {
  return new PriorityTree(options)
};

PriorityTree.prototype.add = function add (options) {
  if (options.id === options.parent) {
    return this.addDefault(options.id)
  }

  var parent = options.parent === null ? null : this.map[options.parent];
  if (parent === undefined) {
    return this.addDefault(options.id)
  }

  debug$6('add node=%d parent=%d weight=%d exclusive=%d',
    options.id,
    options.parent === null ? -1 : options.parent,
    options.weight || this.defaultWeight,
    options.exclusive ? 1 : 0);

  var children;
  if (options.exclusive) {
    children = parent.removeChildren();
  }

  var node = new PriorityNode(this, {
    id: options.id,
    parent: parent,
    weight: options.weight || this.defaultWeight
  });
  this.map[options.id] = node;

  if (options.exclusive) {
    for (var i = 0; i < children.length; i++) {
      node.addChild(children[i]);
    }
  }

  this.count++;
  if (this.count > this.maxCount) {
    debug$6('hit maximum remove id=%d', this.list[0].id);
    this.list.shift().remove();
  }

  // Root node is not subject to removal
  if (node.parent !== null) {
    this.list.push(node);
  }

  return node
};

// Only for testing, should use `node`'s methods
PriorityTree.prototype.get = function get (id) {
  return this.map[id]
};

PriorityTree.prototype.addDefault = function addDefault (id) {
  debug$6('creating default node');
  return this.add({ id: id, parent: 0, weight: this.defaultWeight })
};

PriorityTree.prototype._removeNode = function _removeNode (node) {
  delete this.map[node.id];
  var index = utils$b.binarySearch(this.list, node, compareChildren);
  this.list.splice(index, 1);
  this.count--;
};

var debug$7 = {
  client: src('spdy:stream:client'),
  server: src('spdy:stream:server')
};
var Duplex$8 = readable.Duplex;

function Stream (connection, options) {
  Duplex$8.call(this);

  var connectionState = connection._spdyState;

  var state = {};
  this._spdyState = state;

  this.id = options.id;
  this.method = options.method;
  this.path = options.path;
  this.host = options.host;
  this.headers = options.headers || {};
  this.connection = connection;
  this.parent = options.parent || null;

  state.socket = null;
  state.protocol = connectionState.protocol;
  state.constants = state.protocol.constants;

  // See _initPriority()
  state.priority = null;

  state.version = this.connection.getVersion();
  state.isServer = this.connection.isServer();
  state.debug = state.isServer ? debug$7.server : debug$7.client;

  state.framer = connectionState.framer;
  state.parser = connectionState.parser;

  state.request = options.request;
  state.needResponse = options.request;
  state.window = connectionState.streamWindow.clone(options.id);
  state.sessionWindow = connectionState.window;
  state.maxChunk = connectionState.maxChunk;

  // Can't send incoming request
  // (See `.send()` method)
  state.sent = !state.request;

  state.readable = options.readable !== false;
  state.writable = options.writable !== false;

  state.aborted = false;

  state.corked = 0;
  state.corkQueue = [];

  state.timeout = new spdyTransport.utils.Timeout(this);

  this.on('finish', this._onFinish);
  this.on('end', this._onEnd);

  var self = this;
  function _onWindowOverflow () {
    self._onWindowOverflow();
  }

  state.window.recv.on('overflow', _onWindowOverflow);
  state.window.send.on('overflow', _onWindowOverflow);

  this._initPriority(options.priority);

  if (!state.readable) { this.push(null); }
  if (!state.writable) {
    this._writableState.ended = true;
    this._writableState.finished = true;
  }
}
util$6.inherits(Stream, Duplex$8);
var Stream_1 = Stream;

Stream.prototype._init = function _init (socket) {
  this.socket = socket;
};

Stream.prototype._initPriority = function _initPriority (priority) {
  var state = this._spdyState;
  var connectionState = this.connection._spdyState;
  var root = connectionState.priorityRoot;

  if (!priority) {
    state.priority = root.addDefault(this.id);
    return
  }

  state.priority = root.add({
    id: this.id,
    parent: priority.parent,
    weight: priority.weight,
    exclusive: priority.exclusive
  });
};

Stream.prototype._handleFrame = function _handleFrame (frame) {
  var state = this._spdyState;

  // Ignore any kind of data after abort
  if (state.aborted) {
    state.debug('id=%d ignoring frame=%s after abort', this.id, frame.type);
    return
  }

  // Restart the timer on incoming frames
  state.timeout.reset();

  if (frame.type === 'DATA') {
    this._handleData(frame);
  } else if (frame.type === 'HEADERS') {
    this._handleHeaders(frame);
  } else if (frame.type === 'RST') {
    this._handleRST(frame);
  } else if (frame.type === 'WINDOW_UPDATE') { this._handleWindowUpdate(frame); } else if (frame.type === 'PRIORITY') {
    this._handlePriority(frame);
  } else if (frame.type === 'PUSH_PROMISE') { this._handlePushPromise(frame); }

  if (frame.fin) {
    state.debug('id=%d end', this.id);
    this.push(null);
  }
};

function checkAborted (stream, state, callback) {
  if (state.aborted) {
    state.debug('id=%d abort write', stream.id);
    process.nextTick(function () {
      callback(new Error('Stream write aborted'));
    });
    return true
  }

  return false
}

function _send (stream, state, data, callback) {
  if (checkAborted(stream, state, callback)) {
    return
  }

  state.debug('id=%d presend=%d', stream.id, data.length);

  state.timeout.reset();

  state.window.send.update(-data.length, function () {
    if (checkAborted(stream, state, callback)) {
      return
    }

    state.debug('id=%d send=%d', stream.id, data.length);

    state.timeout.reset();

    state.framer.dataFrame({
      id: stream.id,
      priority: state.priority.getPriority(),
      fin: false,
      data: data
    }, function (err) {
      state.debug('id=%d postsend=%d', stream.id, data.length);
      callback(err);
    });
  });
}

Stream.prototype._write = function _write (data, enc, callback) {
  var state = this._spdyState;

  // Send the request if it wasn't sent
  if (!state.sent) { this.send(); }

  // Writes should come after pending control frames (response and headers)
  if (state.corked !== 0) {
    var self = this;
    state.corkQueue.push(function () {
      self._write(data, enc, callback);
    });
    return
  }

  // Split DATA in chunks to prevent window from going negative
  this._splitStart(data, _send, callback);
};

Stream.prototype._splitStart = function _splitStart (data, onChunk, callback) {
  return this._split(data, 0, onChunk, callback)
};

Stream.prototype._split = function _split (data, offset, onChunk, callback) {
  if (offset === data.length) {
    return process.nextTick(callback)
  }

  var state = this._spdyState;
  var local = state.window.send;
  var session = state.sessionWindow.send;

  var availSession = Math.max(0, session.getCurrent());
  if (availSession === 0) {
    availSession = session.getMax();
  }
  var availLocal = Math.max(0, local.getCurrent());
  if (availLocal === 0) {
    availLocal = local.getMax();
  }

  var avail = Math.min(availSession, availLocal);
  avail = Math.min(avail, state.maxChunk);

  var self = this;

  if (avail === 0) {
    state.window.send.update(0, function () {
      self._split(data, offset, onChunk, callback);
    });
    return
  }

  // Split data in chunks in a following way:
  var limit = avail;
  var size = Math.min(data.length - offset, limit);

  var chunk = data.slice(offset, offset + size);

  onChunk(this, state, chunk, function (err) {
    if (err) { return callback(err) }

    // Get the next chunk
    self._split(data, offset + size, onChunk, callback);
  });
};

Stream.prototype._read = function _read () {
  var state = this._spdyState;

  if (!state.window.recv.isDraining()) {
    return
  }

  var delta = state.window.recv.getDelta();

  state.debug('id=%d window emptying, update by %d', this.id, delta);

  state.window.recv.update(delta);
  state.framer.windowUpdateFrame({
    id: this.id,
    delta: delta
  });
};

Stream.prototype._handleData = function _handleData (frame) {
  var state = this._spdyState;

  // DATA on ended or not readable stream!
  if (!state.readable || this._readableState.ended) {
    state.framer.rstFrame({ id: this.id, code: 'STREAM_CLOSED' });
    return
  }

  state.debug('id=%d recv=%d', this.id, frame.data.length);
  state.window.recv.update(-frame.data.length);

  this.push(frame.data);
};

Stream.prototype._handleRST = function _handleRST (frame) {
  if (frame.code !== 'CANCEL') {
    this.emit('error', new Error('Got RST: ' + frame.code));
  }
  this.abort();
};

Stream.prototype._handleWindowUpdate = function _handleWindowUpdate (frame) {
  var state = this._spdyState;

  state.window.send.update(frame.delta);
};

Stream.prototype._onWindowOverflow = function _onWindowOverflow () {
  var state = this._spdyState;

  state.debug('id=%d window overflow', this.id);
  state.framer.rstFrame({ id: this.id, code: 'FLOW_CONTROL_ERROR' });

  this.aborted = true;
  this.emit('error', new Error('HTTP2 window overflow'));
};

Stream.prototype._handlePriority = function _handlePriority (frame) {
  var state = this._spdyState;

  state.priority.remove();
  state.priority = null;
  this._initPriority(frame.priority);

  // Mostly for testing purposes
  this.emit('priority', frame.priority);
};

Stream.prototype._handleHeaders = function _handleHeaders (frame) {
  var state = this._spdyState;

  if (!state.readable || this._readableState.ended) {
    state.framer.rstFrame({ id: this.id, code: 'STREAM_CLOSED' });
    return
  }

  if (state.needResponse) {
    return this._handleResponse(frame)
  }

  this.emit('headers', frame.headers);
};

Stream.prototype._handleResponse = function _handleResponse (frame) {
  var state = this._spdyState;

  if (frame.headers[':status'] === undefined) {
    state.framer.rstFrame({ id: this.id, code: 'PROTOCOL_ERROR' });
    return
  }

  state.needResponse = false;
  this.emit('response', frame.headers[':status'] | 0, frame.headers);
};

Stream.prototype._onFinish = function _onFinish () {
  var state = this._spdyState;

  // Send the request if it wasn't sent
  if (!state.sent) {
    // NOTE: will send HEADERS with FIN flag
    this.send();
  } else {
    // Just an `.end()` without any writes will trigger immediate `finish` event
    // without any calls to `_write()`.
    if (state.corked !== 0) {
      var self = this;
      state.corkQueue.push(function () {
        self._onFinish();
      });
      return
    }

    state.framer.dataFrame({
      id: this.id,
      priority: state.priority.getPriority(),
      fin: true,
      data: Buffer.alloc(0)
    });
  }

  this._maybeClose();
};

Stream.prototype._onEnd = function _onEnd () {
  this._maybeClose();
};

Stream.prototype._checkEnded = function _checkEnded (callback) {
  var state = this._spdyState;

  var ended = false;
  if (state.aborted) { ended = true; }

  if (!state.writable || this._writableState.finished) { ended = true; }

  if (!ended) {
    return true
  }

  if (!callback) {
    return false
  }

  var err = new Error('Ended stream can\'t send frames');
  process.nextTick(function () {
    callback(err);
  });

  return false
};

Stream.prototype._maybeClose = function _maybeClose () {
  var state = this._spdyState;

  // .abort() emits `close`
  if (state.aborted) {
    return
  }

  if ((!state.readable || this._readableState.ended) &&
      this._writableState.finished) {
    // Clear timeout
    state.timeout.set(0);

    this.emit('close');
  }
};

Stream.prototype._handlePushPromise = function _handlePushPromise (frame) {
  var push = this.connection._createStream({
    id: frame.promisedId,
    parent: this,
    push: true,
    request: true,
    method: frame.headers[':method'],
    path: frame.headers[':path'],
    host: frame.headers[':authority'],
    priority: frame.priority,
    headers: frame.headers,
    writable: false
  });

  // GOAWAY
  if (this.connection._isGoaway(push.id)) {
    return
  }

  if (!this.emit('pushPromise', push)) {
    push.abort();
  }
};

Stream.prototype._hardCork = function _hardCork () {
  var state = this._spdyState;

  this.cork();
  state.corked++;
};

Stream.prototype._hardUncork = function _hardUncork () {
  var state = this._spdyState;

  this.uncork();
  state.corked--;
  if (state.corked !== 0) {
    return
  }

  // Invoke callbacks
  var queue = state.corkQueue;
  state.corkQueue = [];
  for (var i = 0; i < queue.length; i++) {
    queue[i]();
  }
};

Stream.prototype._sendPush = function _sendPush (status, response, callback) {
  var self = this;
  var state = this._spdyState;

  this._hardCork();
  state.framer.pushFrame({
    id: this.parent.id,
    promisedId: this.id,
    priority: state.priority.toJSON(),
    path: this.path,
    host: this.host,
    method: this.method,
    status: status,
    headers: this.headers,
    response: response
  }, function (err) {
    self._hardUncork();

    callback(err);
  });
};

Stream.prototype._wasSent = function _wasSent () {
  var state = this._spdyState;
  return state.sent
};

// Public API

Stream.prototype.send = function send (callback) {
  var state = this._spdyState;

  if (state.sent) {
    var err = new Error('Stream was already sent');
    process.nextTick(function () {
      if (callback) {
        callback(err);
      }
    });
    return
  }

  state.sent = true;
  state.timeout.reset();

  // GET requests should always be auto-finished
  if (this.method === 'GET') {
    this._writableState.ended = true;
    this._writableState.finished = true;
  }

  // TODO(indunty): ideally it should just take a stream object as an input
  var self = this;
  this._hardCork();
  state.framer.requestFrame({
    id: this.id,
    method: this.method,
    path: this.path,
    host: this.host,
    priority: state.priority.toJSON(),
    headers: this.headers,
    fin: this._writableState.finished
  }, function (err) {
    self._hardUncork();

    if (!callback) {
      return
    }

    callback(err);
  });
};

Stream.prototype.respond = function respond (status, headers, callback) {
  var self = this;
  var state = this._spdyState;
  assert$7(!state.request, 'Can\'t respond on request');

  state.timeout.reset();

  if (!this._checkEnded(callback)) { return }

  var frame = {
    id: this.id,
    status: status,
    headers: headers
  };
  this._hardCork();
  state.framer.responseFrame(frame, function (err) {
    self._hardUncork();
    if (callback) { callback(err); }
  });
};

Stream.prototype.setWindow = function setWindow (size) {
  var state = this._spdyState;

  state.timeout.reset();

  if (!this._checkEnded()) {
    return
  }

  state.debug('id=%d force window max=%d', this.id, size);
  state.window.recv.setMax(size);

  var delta = state.window.recv.getDelta();
  if (delta === 0) { return }

  state.framer.windowUpdateFrame({
    id: this.id,
    delta: delta
  });
  state.window.recv.update(delta);
};

Stream.prototype.sendHeaders = function sendHeaders (headers, callback) {
  var self = this;
  var state = this._spdyState;

  state.timeout.reset();

  if (!this._checkEnded(callback)) {
    return
  }

  // Request wasn't yet send, coalesce headers
  if (!state.sent) {
    this.headers = Object.assign({}, this.headers);
    Object.assign(this.headers, headers);
    process.nextTick(function () {
      if (callback) {
        callback(null);
      }
    });
    return
  }

  this._hardCork();
  state.framer.headersFrame({
    id: this.id,
    headers: headers
  }, function (err) {
    self._hardUncork();
    if (callback) { callback(err); }
  });
};

Stream.prototype._destroy = function destroy () {
  this.abort();
};

Stream.prototype.abort = function abort (code, callback) {
  var state = this._spdyState;

  // .abort(callback)
  if (typeof code === 'function') {
    callback = code;
    code = null;
  }

  if (this._readableState.ended && this._writableState.finished) {
    state.debug('id=%d already closed', this.id);
    if (callback) {
      process.nextTick(callback);
    }
    return
  }

  if (state.aborted) {
    state.debug('id=%d already aborted', this.id);
    if (callback) { process.nextTick(callback); }
    return
  }

  state.aborted = true;
  state.debug('id=%d abort', this.id);

  this.setTimeout(0);

  var abortCode = code || 'CANCEL';

  state.framer.rstFrame({
    id: this.id,
    code: abortCode
  });

  var self = this;
  process.nextTick(function () {
    if (callback) {
      callback(null);
    }
    self.emit('close', new Error('Aborted, code: ' + abortCode));
  });
};

Stream.prototype.setPriority = function setPriority (info) {
  var state = this._spdyState;

  state.timeout.reset();

  if (!this._checkEnded()) {
    return
  }

  state.debug('id=%d priority change', this.id, info);

  var frame = { id: this.id, priority: info };

  // Change priority on this side
  this._handlePriority(frame);

  // And on the other too
  state.framer.priorityFrame(frame);
};

Stream.prototype.pushPromise = function pushPromise (uri, callback) {
  if (!this._checkEnded(callback)) {
    return
  }

  var self = this;
  this._hardCork();
  var push = this.connection.pushPromise(this, uri, function (err) {
    self._hardUncork();
    if (!err) {
      push._hardUncork();
    }

    if (callback) {
      return callback(err, push)
    }

    if (err) { push.emit('error', err); }
  });
  push._hardCork();

  return push
};

Stream.prototype.setMaxChunk = function setMaxChunk (size) {
  var state = this._spdyState;
  state.maxChunk = size;
};

Stream.prototype.setTimeout = function setTimeout (delay, callback) {
  var state = this._spdyState;

  state.timeout.set(delay, callback);
};

var stream$2 = {
	Stream: Stream_1
};

var debug$8 = {
  server: src('spdy:connection:server'),
  client: src('spdy:connection:client')
};
var EventEmitter$2 = events.EventEmitter;

var Stream$1 = spdyTransport.Stream;

function Connection (socket, options) {
  EventEmitter$2.call(this);

  var state = {};
  this._spdyState = state;

  // NOTE: There's a big trick here. Connection is used as a `this` argument
  // to the wrapped `connection` event listener.
  // socket end doesn't necessarly mean connection drop
  this.httpAllowHalfOpen = true;

  state.timeout = new spdyTransport.utils.Timeout(this);

  // Protocol info
  state.protocol = spdyTransport.protocol[options.protocol];
  state.version = null;
  state.constants = state.protocol.constants;
  state.pair = null;
  state.isServer = options.isServer;

  // Root of priority tree (i.e. stream id = 0)
  state.priorityRoot = new spdyTransport.Priority({
    defaultWeight: state.constants.DEFAULT_WEIGHT,
    maxCount: spdyTransport.protocol.base.constants.MAX_PRIORITY_STREAMS
  });

  // Defaults
  state.maxStreams = options.maxStreams ||
                     state.constants.MAX_CONCURRENT_STREAMS;

  state.autoSpdy31 = options.protocol.name !== 'h2' && options.autoSpdy31;
  state.acceptPush = options.acceptPush === undefined
    ? !state.isServer
    : options.acceptPush;

  if (options.maxChunk === false) { state.maxChunk = Infinity; } else if (options.maxChunk === undefined) { state.maxChunk = spdyTransport.protocol.base.constants.DEFAULT_MAX_CHUNK; } else {
    state.maxChunk = options.maxChunk;
  }

  // Connection-level flow control
  var windowSize = options.windowSize || 1 << 20;
  state.window = new spdyTransport.Window({
    id: 0,
    isServer: state.isServer,
    recv: {
      size: state.constants.DEFAULT_WINDOW,
      max: state.constants.MAX_INITIAL_WINDOW_SIZE
    },
    send: {
      size: state.constants.DEFAULT_WINDOW,
      max: state.constants.MAX_INITIAL_WINDOW_SIZE
    }
  });

  // It starts with DEFAULT_WINDOW, update must be sent to change it on client
  state.window.recv.setMax(windowSize);

  // Boilerplate for Stream constructor
  state.streamWindow = new spdyTransport.Window({
    id: -1,
    isServer: state.isServer,
    recv: {
      size: windowSize,
      max: state.constants.MAX_INITIAL_WINDOW_SIZE
    },
    send: {
      size: state.constants.DEFAULT_WINDOW,
      max: state.constants.MAX_INITIAL_WINDOW_SIZE
    }
  });

  // Various state info
  state.pool = state.protocol.compressionPool.create(options.headerCompression);
  state.counters = {
    push: 0,
    stream: 0
  };

  // Init streams list
  state.stream = {
    map: {},
    count: 0,
    nextId: state.isServer ? 2 : 1,
    lastId: {
      both: 0,
      received: 0
    }
  };
  state.ping = {
    nextId: state.isServer ? 2 : 1,
    map: {}
  };
  state.goaway = false;

  // Debug
  state.debug = state.isServer ? debug$8.server : debug$8.client;

  // X-Forwarded feature
  state.xForward = null;

  // Create parser and hole for framer
  state.parser = state.protocol.parser.create({
    // NOTE: needed to distinguish ping from ping ACK in SPDY
    isServer: state.isServer,
    window: state.window
  });
  state.framer = state.protocol.framer.create({
    window: state.window,
    timeout: state.timeout
  });

  // SPDY has PUSH enabled on servers
  if (state.protocol.name === 'spdy') {
    state.framer.enablePush(state.isServer);
  }

  if (!state.isServer) { state.parser.skipPreface(); }

  this.socket = socket;

  this._init();
}
util$6.inherits(Connection, EventEmitter$2);
var Connection_1 = Connection;

Connection.create = function create (socket, options) {
  return new Connection(socket, options)
};

Connection.prototype._init = function init () {
  var self = this;
  var state = this._spdyState;
  var pool = state.pool;

  // Initialize session window
  state.window.recv.on('drain', function () {
    self._onSessionWindowDrain();
  });

  // Initialize parser
  state.parser.on('data', function (frame) {
    self._handleFrame(frame);
  });
  state.parser.once('version', function (version) {
    self._onVersion(version);
  });

  // Propagate parser errors
  state.parser.on('error', function (err) {
    self._onParserError(err);
  });

  // Propagate framer errors
  state.framer.on('error', function (err) {
    self.emit('error', err);
  });

  this.socket.pipe(state.parser);
  state.framer.pipe(this.socket);

  // Allow high-level api to catch socket errors
  this.socket.on('error', function onSocketError (e) {
    self.emit('error', e);
  });

  this.socket.once('close', function onclose (hadError) {
    var err;
    if (hadError) {
      err = new Error('socket hang up');
      err.code = 'ECONNRESET';
    }

    self.destroyStreams(err);
    self.emit('close');

    if (state.pair) {
      pool.put(state.pair);
    }

    state.framer.resume();
  });

  // Reset timeout on close
  this.once('close', function () {
    self.setTimeout(0);
  });

  function _onWindowOverflow () {
    self._onWindowOverflow();
  }

  state.window.recv.on('overflow', _onWindowOverflow);
  state.window.send.on('overflow', _onWindowOverflow);

  // Do not allow half-open connections
  this.socket.allowHalfOpen = false;
};

Connection.prototype._onVersion = function _onVersion (version) {
  var state = this._spdyState;
  var prev = state.version;
  var parser = state.parser;
  var framer = state.framer;
  var pool = state.pool;

  state.version = version;
  state.debug('id=0 version=%d', version);

  // Ignore transition to 3.1
  if (!prev) {
    state.pair = pool.get(version);
    parser.setCompression(state.pair);
    framer.setCompression(state.pair);
  }
  framer.setVersion(version);

  if (!state.isServer) {
    framer.prefaceFrame();
    if (state.xForward !== null) {
      framer.xForwardedFor({ host: state.xForward });
    }
  }

  // Send preface+settings frame (once)
  framer.settingsFrame({
    max_header_list_size: state.constants.DEFAULT_MAX_HEADER_LIST_SIZE,
    max_concurrent_streams: state.maxStreams,
    enable_push: state.acceptPush ? 1 : 0,
    initial_window_size: state.window.recv.max
  });

  // Update session window
  if (state.version >= 3.1 || (state.isServer && state.autoSpdy31)) { this._onSessionWindowDrain(); }

  this.emit('version', version);
};

Connection.prototype._onParserError = function _onParserError (err) {
  var state = this._spdyState;

  // Prevent further errors
  state.parser.kill();

  // Send GOAWAY
  if (err instanceof spdyTransport.protocol.base.utils.ProtocolError) {
    this._goaway({
      lastId: state.stream.lastId.both,
      code: err.code,
      extra: err.message,
      send: true
    });
  }

  this.emit('error', err);
};

Connection.prototype._handleFrame = function _handleFrame (frame) {
  var state = this._spdyState;

  state.debug('id=0 frame', frame);
  state.timeout.reset();

  // For testing purposes
  this.emit('frame', frame);

  var stream;

  // Session window update
  if (frame.type === 'WINDOW_UPDATE' && frame.id === 0) {
    if (state.version < 3.1 && state.autoSpdy31) {
      state.debug('id=0 switch version to 3.1');
      state.version = 3.1;
      this.emit('version', 3.1);
    }
    state.window.send.update(frame.delta);
    return
  }

  if (state.isServer && frame.type === 'PUSH_PROMISE') {
    state.debug('id=0 server PUSH_PROMISE');
    this._goaway({
      lastId: state.stream.lastId.both,
      code: 'PROTOCOL_ERROR',
      send: true
    });
    return
  }

  if (!stream && frame.id !== undefined) {
    // Load created one
    stream = state.stream.map[frame.id];

    // Fail if not found
    if (!stream &&
        frame.type !== 'HEADERS' &&
        frame.type !== 'PRIORITY' &&
        frame.type !== 'RST') {
      // Other side should destroy the stream upon receiving GOAWAY
      if (this._isGoaway(frame.id)) { return }

      state.debug('id=0 stream=%d not found', frame.id);
      state.framer.rstFrame({ id: frame.id, code: 'INVALID_STREAM' });
      return
    }
  }

  // Create new stream
  if (!stream && frame.type === 'HEADERS') {
    this._handleHeaders(frame);
    return
  }

  if (stream) {
    stream._handleFrame(frame);
  } else if (frame.type === 'SETTINGS') {
    this._handleSettings(frame.settings);
  } else if (frame.type === 'ACK_SETTINGS') ; else if (frame.type === 'PING') {
    this._handlePing(frame);
  } else if (frame.type === 'GOAWAY') {
    this._handleGoaway(frame);
  } else if (frame.type === 'X_FORWARDED_FOR') {
    // Set X-Forwarded-For only once
    if (state.xForward === null) {
      state.xForward = frame.host;
    }
  } else if (frame.type === 'PRIORITY') ; else {
    state.debug('id=0 unknown frame type: %s', frame.type);
  }
};

Connection.prototype._onWindowOverflow = function _onWindowOverflow () {
  var state = this._spdyState;
  state.debug('id=0 window overflow');
  this._goaway({
    lastId: state.stream.lastId.both,
    code: 'FLOW_CONTROL_ERROR',
    send: true
  });
};

Connection.prototype._isGoaway = function _isGoaway (id) {
  var state = this._spdyState;
  if (state.goaway !== false && state.goaway < id) { return true }
  return false
};

Connection.prototype._getId = function _getId () {
  var state = this._spdyState;

  var id = state.stream.nextId;
  state.stream.nextId += 2;
  return id
};

Connection.prototype._createStream = function _createStream (uri) {
  var state = this._spdyState;
  var id = uri.id;
  if (id === undefined) { id = this._getId(); }

  var isGoaway = this._isGoaway(id);

  if (uri.push && !state.acceptPush) {
    state.debug('id=0 push disabled promisedId=%d', id);

    // Fatal error
    this._goaway({
      lastId: state.stream.lastId.both,
      code: 'PROTOCOL_ERROR',
      send: true
    });
    isGoaway = true;
  }

  var stream = new Stream$1(this, {
    id: id,
    request: uri.request !== false,
    method: uri.method,
    path: uri.path,
    host: uri.host,
    priority: uri.priority,
    headers: uri.headers,
    parent: uri.parent,
    readable: !isGoaway && uri.readable,
    writable: !isGoaway && uri.writable
  });
  var self = this;

  // Just an empty stream for API consistency
  if (isGoaway) {
    return stream
  }

  state.stream.lastId.both = Math.max(state.stream.lastId.both, id);

  state.debug('id=0 add stream=%d', stream.id);
  state.stream.map[stream.id] = stream;
  state.stream.count++;
  state.counters.stream++;
  if (stream.parent !== null) {
    state.counters.push++;
  }

  stream.once('close', function () {
    self._removeStream(stream);
  });

  return stream
};

Connection.prototype._handleHeaders = function _handleHeaders (frame) {
  var state = this._spdyState;

  // Must be HEADERS frame after stream close
  if (frame.id <= state.stream.lastId.received) { return }

  // Someone is using our ids!
  if ((frame.id + state.stream.nextId) % 2 === 0) {
    state.framer.rstFrame({ id: frame.id, code: 'PROTOCOL_ERROR' });
    return
  }

  var stream = this._createStream({
    id: frame.id,
    request: false,
    method: frame.headers[':method'],
    path: frame.headers[':path'],
    host: frame.headers[':authority'],
    priority: frame.priority,
    headers: frame.headers,
    writable: frame.writable
  });

  // GOAWAY
  if (this._isGoaway(stream.id)) {
    return
  }

  state.stream.lastId.received = Math.max(
    state.stream.lastId.received,
    stream.id
  );

  // TODO(indutny) handle stream limit
  if (!this.emit('stream', stream)) {
    // No listeners was set - abort the stream
    stream.abort();
    return
  }

  // Create fake frame to simulate end of the data
  if (frame.fin) {
    stream._handleFrame({ type: 'FIN', fin: true });
  }

  return stream
};

Connection.prototype._onSessionWindowDrain = function _onSessionWindowDrain () {
  var state = this._spdyState;
  if (state.version < 3.1 && !(state.isServer && state.autoSpdy31)) {
    return
  }

  var delta = state.window.recv.getDelta();
  if (delta === 0) {
    return
  }

  state.debug('id=0 session window drain, update by %d', delta);

  state.framer.windowUpdateFrame({
    id: 0,
    delta: delta
  });
  state.window.recv.update(delta);
};

Connection.prototype.start = function start (version) {
  this._spdyState.parser.setVersion(version);
};

// Mostly for testing
Connection.prototype.getVersion = function getVersion () {
  return this._spdyState.version
};

Connection.prototype._handleSettings = function _handleSettings (settings) {
  var state = this._spdyState;

  state.framer.ackSettingsFrame();

  this._setDefaultWindow(settings);
  if (settings.max_frame_size) { state.framer.setMaxFrameSize(settings.max_frame_size); }

  // TODO(indutny): handle max_header_list_size
  if (settings.header_table_size) {
    try {
      state.pair.compress.updateTableSize(settings.header_table_size);
    } catch (e) {
      this._goaway({
        lastId: 0,
        code: 'PROTOCOL_ERROR',
        send: true
      });
      return
    }
  }

  // HTTP2 clients needs to enable PUSH streams explicitly
  if (state.protocol.name !== 'spdy') {
    if (settings.enable_push === undefined) {
      state.framer.enablePush(state.isServer);
    } else {
      state.framer.enablePush(settings.enable_push === 1);
    }
  }

  // TODO(indutny): handle max_concurrent_streams
};

Connection.prototype._setDefaultWindow = function _setDefaultWindow (settings) {
  if (settings.initial_window_size === undefined) {
    return
  }

  var state = this._spdyState;

  // Update defaults
  var window = state.streamWindow;
  window.send.setMax(settings.initial_window_size);

  // Update existing streams
  Object.keys(state.stream.map).forEach(function (id) {
    var stream = state.stream.map[id];
    var window = stream._spdyState.window;

    window.send.updateMax(settings.initial_window_size);
  });
};

Connection.prototype._handlePing = function handlePing (frame) {
  var self = this;
  var state = this._spdyState;

  // Handle incoming PING
  if (!frame.ack) {
    state.framer.pingFrame({
      opaque: frame.opaque,
      ack: true
    });

    self.emit('ping', frame.opaque);
    return
  }

  // Handle reply PING
  var hex = frame.opaque.toString('hex');
  if (!state.ping.map[hex]) {
    return
  }
  var ping = state.ping.map[hex];
  delete state.ping.map[hex];

  if (ping.cb) {
    ping.cb(null);
  }
};

Connection.prototype._handleGoaway = function handleGoaway (frame) {
  this._goaway({
    lastId: frame.lastId,
    code: frame.code,
    send: false
  });
};

Connection.prototype.ping = function ping (callback) {
  var state = this._spdyState;

  // HTTP2 is using 8-byte opaque
  var opaque = Buffer.alloc(state.constants.PING_OPAQUE_SIZE);
  opaque.fill(0);
  opaque.writeUInt32BE(state.ping.nextId, opaque.length - 4);
  state.ping.nextId += 2;

  state.ping.map[opaque.toString('hex')] = { cb: callback };
  state.framer.pingFrame({
    opaque: opaque,
    ack: false
  });
};

Connection.prototype.getCounter = function getCounter (name) {
  return this._spdyState.counters[name]
};

Connection.prototype.reserveStream = function reserveStream (uri, callback) {
  var stream = this._createStream(uri);

  // GOAWAY
  if (this._isGoaway(stream.id)) {
    var err = new Error('Can\'t send request after GOAWAY');
    process.nextTick(function () {
      if (callback) { callback(err); } else {
        stream.emit('error', err);
      }
    });
    return stream
  }

  if (callback) {
    process.nextTick(function () {
      callback(null, stream);
    });
  }

  return stream
};

Connection.prototype.request = function request (uri, callback) {
  var stream = this.reserveStream(uri, function (err) {
    if (err) {
      if (callback) {
        callback(err);
      } else {
        stream.emit('error', err);
      }
      return
    }

    if (stream._wasSent()) {
      if (callback) {
        callback(null, stream);
      }
      return
    }

    stream.send(function (err) {
      if (err) {
        if (callback) { return callback(err) } else { return stream.emit('error', err) }
      }

      if (callback) {
        callback(null, stream);
      }
    });
  });

  return stream
};

Connection.prototype._removeStream = function _removeStream (stream) {
  var state = this._spdyState;

  state.debug('id=0 remove stream=%d', stream.id);
  delete state.stream.map[stream.id];
  state.stream.count--;

  if (state.stream.count === 0) {
    this.emit('_streamDrain');
  }
};

Connection.prototype._goaway = function _goaway (params) {
  var state = this._spdyState;
  var self = this;

  state.goaway = params.lastId;
  state.debug('id=0 goaway from=%d', state.goaway);

  Object.keys(state.stream.map).forEach(function (id) {
    var stream = state.stream.map[id];

    // Abort every stream started after GOAWAY
    if (stream.id <= params.lastId) {
      return
    }

    stream.abort();
    stream.emit('error', new Error('New stream after GOAWAY'));
  });

  function finish () {
    // Destroy socket if there are no streams
    if (state.stream.count === 0 || params.code !== 'OK') {
      // No further frames should be processed
      state.parser.kill();

      process.nextTick(function () {
        var err = new Error('Fatal error: ' + params.code);
        self._onStreamDrain(err);
      });
      return
    }

    self.on('_streamDrain', self._onStreamDrain);
  }

  if (params.send) {
    // Make sure that GOAWAY frame is sent before dumping framer
    state.framer.goawayFrame({
      lastId: params.lastId,
      code: params.code,
      extra: params.extra
    }, finish);
  } else {
    finish();
  }
};

Connection.prototype._onStreamDrain = function _onStreamDrain (error) {
  var state = this._spdyState;

  state.debug('id=0 _onStreamDrain');

  state.framer.dump();
  state.framer.unpipe(this.socket);
  state.framer.resume();

  if (this.socket.destroySoon) {
    this.socket.destroySoon();
  }
  this.emit('close', error);
};

Connection.prototype.end = function end (callback) {
  var state = this._spdyState;

  if (callback) {
    this.once('close', callback);
  }
  this._goaway({
    lastId: state.stream.lastId.both,
    code: 'OK',
    send: true
  });
};

Connection.prototype.destroyStreams = function destroyStreams (err) {
  var state = this._spdyState;
  Object.keys(state.stream.map).forEach(function (id) {
    var stream = state.stream.map[id];

    stream.destroy();
    if (err) {
      stream.emit('error', err);
    }
  });
};

Connection.prototype.isServer = function isServer () {
  return this._spdyState.isServer
};

Connection.prototype.getXForwardedFor = function getXForwardFor () {
  return this._spdyState.xForward
};

Connection.prototype.sendXForwardedFor = function sendXForwardedFor (host) {
  var state = this._spdyState;
  if (state.version !== null) {
    state.framer.xForwardedFor({ host: host });
  } else {
    state.xForward = host;
  }
};

Connection.prototype.pushPromise = function pushPromise (parent, uri, callback) {
  var state = this._spdyState;

  var stream = this._createStream({
    request: false,
    parent: parent,
    method: uri.method,
    path: uri.path,
    host: uri.host,
    priority: uri.priority,
    headers: uri.headers,
    readable: false
  });

  var err;

  // TODO(indutny): deduplicate this logic somehow
  if (this._isGoaway(stream.id)) {
    err = new Error('Can\'t send PUSH_PROMISE after GOAWAY');

    process.nextTick(function () {
      if (callback) {
        callback(err);
      } else {
        stream.emit('error', err);
      }
    });
    return stream
  }

  if (uri.push && !state.acceptPush) {
    err = new Error(
      'Can\'t send PUSH_PROMISE, other side won\'t accept it');
    process.nextTick(function () {
      if (callback) { callback(err); } else {
        stream.emit('error', err);
      }
    });
    return stream
  }

  stream._sendPush(uri.status, uri.response, function (err) {
    if (!callback) {
      if (err) {
        stream.emit('error', err);
      }
      return
    }

    if (err) { return callback(err) }
    callback(null, stream);
  });

  return stream
};

Connection.prototype.setTimeout = function setTimeout (delay, callback) {
  var state = this._spdyState;

  state.timeout.set(delay, callback);
};

var connection = {
	Connection: Connection_1
};

var spdyTransport = createCommonjsModule(function (module, exports) {

var transport = exports;

// Exports utils
transport.utils = utils;

// Export parser&framer
transport.protocol = {};
transport.protocol.base = base;
transport.protocol.spdy = spdy;
transport.protocol.http2 = http2;

// Window
transport.Window = window$1;

// Priority Tree
transport.Priority = priority;

// Export Connection and Stream
transport.Stream = stream$2.Stream;
transport.Connection = connection.Connection;

// Just for `transport.connection.create()`
transport.connection = transport.Connection;
});

var agent = createCommonjsModule(function (module, exports) {







var debug = src('spdy:client');

// Node.js 0.10 and 0.12 support
Object.assign = process.versions.modules >= 46
  ? Object.assign // eslint-disable-next-line
  : util$6._extend;

var EventEmitter = events.EventEmitter;



var mode = /^v0\.8\./.test(process.version)
  ? 'rusty'
  : /^v0\.(9|10)\./.test(process.version)
    ? 'old'
    : /^v0\.12\./.test(process.version)
      ? 'normal'
      : 'modern';

var proto = {};

function instantiate (base) {
  function Agent (options) {
    this._init(base, options);
  }
  util$6.inherits(Agent, base);

  Agent.create = function create (options) {
    return new Agent(options)
  };

  Object.keys(proto).forEach(function (key) {
    Agent.prototype[key] = proto[key];
  });

  return Agent
}

proto._init = function _init (base, options) {
  base.call(this, options);

  var state = {};
  this._spdyState = state;

  state.host = options.host;
  state.options = options.spdy || {};
  state.secure = this instanceof https.Agent;
  state.fallback = false;
  state.createSocket = this._getCreateSocket();
  state.socket = null;
  state.connection = null;

  // No chunked encoding
  this.keepAlive = false;

  var self = this;
  this._connect(options, function (err, connection) {
    if (err) {
      return self.emit('error', err)
    }

    state.connection = connection;
    self.emit('_connect');
  });
};

proto._getCreateSocket = function _getCreateSocket () {
  // Find super's `createSocket` method
  var createSocket;
  var cons = this.constructor.super_;
  do {
    createSocket = cons.prototype.createSocket;

    if (cons.super_ === EventEmitter || !cons.super_) {
      break
    }
    cons = cons.super_;
  } while (!createSocket)
  if (!createSocket) {
    createSocket = http.Agent.prototype.createSocket;
  }

  assert$7(createSocket, '.createSocket() method not found');

  return createSocket
};

proto._connect = function _connect (options, callback) {
  var self = this;
  var state = this._spdyState;

  var protocols = state.options.protocols || [
    'h2',
    'spdy/3.1', 'spdy/3', 'spdy/2',
    'http/1.1', 'http/1.0'
  ];

  // TODO(indutny): reconnect automatically?
  var socket = this.createConnection(Object.assign({
    NPNProtocols: protocols,
    ALPNProtocols: protocols,
    servername: options.servername || options.host
  }, options));
  state.socket = socket;

  socket.setNoDelay(true);

  function onError (err) {
    return callback(err)
  }
  socket.on('error', onError);

  socket.on(state.secure ? 'secureConnect' : 'connect', function () {
    socket.removeListener('error', onError);

    var protocol;
    if (state.secure) {
      protocol = socket.npnProtocol ||
                 socket.alpnProtocol ||
                 state.options.protocol;
    } else {
      protocol = state.options.protocol;
    }

    // HTTP server - kill socket and switch to the fallback mode
    if (!protocol || protocol === 'http/1.1' || protocol === 'http/1.0') {
      debug('activating fallback');
      socket.destroy();
      state.fallback = true;
      return
    }

    debug('connected protocol=%j', protocol);
    var connection = spdyTransport.connection.create(socket, Object.assign({
      protocol: /spdy/.test(protocol) ? 'spdy' : 'http2',
      isServer: false
    }, state.options.connection || {}));

    // Pass connection level errors are passed to the agent.
    connection.on('error', function (err) {
      self.emit('error', err);
    });

    // Set version when we are certain
    if (protocol === 'h2') {
      connection.start(4);
    } else if (protocol === 'spdy/3.1') {
      connection.start(3.1);
    } else if (protocol === 'spdy/3') {
      connection.start(3);
    } else if (protocol === 'spdy/2') {
      connection.start(2);
    } else {
      socket.destroy();
      callback(new Error('Unexpected protocol: ' + protocol));
      return
    }

    if (state.options['x-forwarded-for'] !== undefined) {
      connection.sendXForwardedFor(state.options['x-forwarded-for']);
    }

    callback(null, connection);
  });
};

proto._createSocket = function _createSocket (req, options, callback) {
  var state = this._spdyState;
  if (state.fallback) { return state.createSocket(req, options) }

  var handle = spdy_1.handle.create(null, null, state.socket);

  var socketOptions = {
    handle: handle,
    allowHalfOpen: true
  };

  var socket;
  if (state.secure) {
    socket = new spdy_1.Socket(state.socket, socketOptions);
  } else {
    socket = new net.Socket(socketOptions);
  }

  handle.assignSocket(socket);
  handle.assignClientRequest(req);

  // Create stream only once `req.end()` is called
  var self = this;
  handle.once('needStream', function () {
    if (state.connection === null) {
      self.once('_connect', function () {
        handle.setStream(self._createStream(req, handle));
      });
    } else {
      handle.setStream(self._createStream(req, handle));
    }
  });

  // Yes, it is in reverse
  req.on('response', function (res) {
    handle.assignRequest(res);
  });
  handle.assignResponse(req);

  // Handle PUSH
  req.addListener('newListener', spdy_1.request.onNewListener);

  // For v0.8
  socket.readable = true;
  socket.writable = true;

  if (callback) {
    return callback(null, socket)
  }

  return socket
};

if (mode === 'modern' || mode === 'normal') {
  proto.createSocket = proto._createSocket;
} else {
  proto.createSocket = function createSocket (name, host, port, addr, req) {
    var state = this._spdyState;
    if (state.fallback) {
      return state.createSocket(name, host, port, addr, req)
    }

    return this._createSocket(req, {
      host: host,
      port: port
    })
  };
}

proto._createStream = function _createStream (req, handle) {
  var state = this._spdyState;

  var self = this;
  return state.connection.reserveStream({
    method: req.method,
    path: req.path,
    headers: req._headers,
    host: state.host
  }, function (err, stream) {
    if (err) {
      return self.emit('error', err)
    }

    stream.on('response', function (status, headers) {
      handle.emitResponse(status, headers);
    });
  })
};

// Public APIs

proto.close = function close (callback) {
  var state = this._spdyState;

  if (state.connection === null) {
    this.once('_connect', function () {
      this.close(callback);
    });
    return
  }

  state.connection.end(callback);
};

exports.Agent = instantiate(https.Agent);
exports.PlainAgent = instantiate(http.Agent);

exports.create = function create (base, options) {
  if (typeof base === 'object') {
    options = base;
    base = null;
  }

  if (base) {
    return instantiate(base).create(options)
  }

  if (options.spdy && options.spdy.plain) {
    return exports.PlainAgent.create(options)
  } else { return exports.Agent.create(options) }
};
});

var EventEmitter$3 = events.EventEmitter;

function Hose(socket, options, filter) {
  EventEmitter$3.call(this);

  if (typeof options === 'function') {
    filter = options;
    options = {};
  }

  this.socket = socket;
  this.options = options;
  this.filter = filter;

  this.buffer = null;

  var self = this;
  this.listeners = {
    error: function(err) {
      return self.onError(err);
    },
    data: function(chunk) {
      return self.onData(chunk);
    },
    end: function() {
      return self.onEnd();
    }
  };

  this.socket.on('error', this.listeners.error);
  this.socket.on('data', this.listeners.data);
  this.socket.on('end', this.listeners.end);
}
util$6.inherits(Hose, EventEmitter$3);
var hose = Hose;

Hose.create = function create(socket, options, filter) {
  return new Hose(socket, options, filter);
};

Hose.prototype.detach = function detach() {
  // Stop the flow
  this.socket.pause();

  this.socket.removeListener('error', this.listeners.error);
  this.socket.removeListener('data', this.listeners.data);
  this.socket.removeListener('end', this.listeners.end);
};

Hose.prototype.reemit = function reemit() {
  var buffer = this.buffer;
  this.buffer = null;

  // Modern age
  if (this.socket.unshift) {
    this.socket.unshift(buffer);
    if (this.socket.listeners('data').length > 0)
      this.socket.resume();
    return;
  }

  // Rusty node v0.8
  if (this.socket.ondata)
    this.socket.ondata(buffer, 0, buffer.length);
  this.socket.emit('data', buffer);
  this.socket.resume();
};

Hose.prototype.onError = function onError(err) {
  this.detach();
  this.emit('error', err);
};

Hose.prototype.onData = function onData(chunk) {
  if (this.buffer)
    this.buffer = Buffer.concat([ this.buffer, chunk ]);
  else
    this.buffer = chunk;

  var self = this;
  this.filter(this.buffer, function(err, protocol) {
    if (err)
      return self.onError(err);

    // No protocol selected yet
    if (!protocol)
      return;

    self.detach();
    self.emit('select', protocol, self.socket);
    self.reemit();
  });
};

Hose.prototype.onEnd = function onEnd() {
  this.detach();
  this.emit('error', new Error('Not enough data to recognize protocol'));
};

var server = createCommonjsModule(function (module, exports) {









var debug = src('spdy:server');
var EventEmitter = events.EventEmitter;

// Node.js 0.8, 0.10 and 0.12 support
Object.assign = process.versions.modules >= 46
  ? Object.assign // eslint-disable-next-line
  : util$6._extend;



var proto = {};

function instantiate (base) {
  function Server (options, handler) {
    this._init(base, options, handler);
  }
  util$6.inherits(Server, base);

  Server.create = function create (options, handler) {
    return new Server(options, handler)
  };

  Object.keys(proto).forEach(function (key) {
    Server.prototype[key] = proto[key];
  });

  return Server
}

proto._init = function _init (base, options, handler) {
  var state = {};
  this._spdyState = state;

  state.options = options.spdy || {};

  var protocols = state.options.protocols || [
    'h2',
    'spdy/3.1', 'spdy/3', 'spdy/2',
    'http/1.1', 'http/1.0'
  ];

  var actualOptions = Object.assign({
    NPNProtocols: protocols,

    // Future-proof
    ALPNProtocols: protocols
  }, options);

  state.secure = this instanceof tls.Server;

  if (state.secure) {
    base.call(this, actualOptions);
  } else {
    base.call(this);
  }

  // Support HEADERS+FIN
  this.httpAllowHalfOpen = true;

  var event = state.secure ? 'secureConnection' : 'connection';

  state.listeners = this.listeners(event).slice();
  assert$7(state.listeners.length > 0, 'Server does not have default listeners');
  this.removeAllListeners(event);

  if (state.options.plain) {
    this.on(event, this._onPlainConnection);
  } else { this.on(event, this._onConnection); }

  if (handler) {
    this.on('request', handler);
  }

  debug('server init secure=%d', state.secure);
};

proto._onConnection = function _onConnection (socket) {
  var state = this._spdyState;

  var protocol;
  if (state.secure) {
    protocol = socket.npnProtocol || socket.alpnProtocol;
  }

  this._handleConnection(socket, protocol);
};

proto._handleConnection = function _handleConnection (socket, protocol) {
  var state = this._spdyState;

  if (!protocol) {
    protocol = state.options.protocol;
  }

  debug('incoming socket protocol=%j', protocol);

  // No way we can do anything with the socket
  if (!protocol || protocol === 'http/1.1' || protocol === 'http/1.0') {
    debug('to default handler it goes');
    return this._invokeDefault(socket)
  }

  socket.setNoDelay(true);

  var connection = spdyTransport.connection.create(socket, Object.assign({
    protocol: /spdy/.test(protocol) ? 'spdy' : 'http2',
    isServer: true
  }, state.options.connection || {}));

  // Set version when we are certain
  if (protocol === 'http2') { connection.start(4); } else if (protocol === 'spdy/3.1') {
    connection.start(3.1);
  } else if (protocol === 'spdy/3') { connection.start(3); } else if (protocol === 'spdy/2') {
    connection.start(2);
  }

  connection.on('error', function () {
    socket.destroy();
  });

  var self = this;
  connection.on('stream', function (stream) {
    self._onStream(stream);
  });
};

// HTTP2 preface
var PREFACE = 'PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n';
var PREFACE_BUFFER = Buffer.from(PREFACE);

function hoseFilter (data, callback) {
  if (data.length < 1) {
    return callback(null, null)
  }

  // SPDY!
  if (data[0] === 0x80) { return callback(null, 'spdy') }

  var avail = Math.min(data.length, PREFACE_BUFFER.length);
  for (var i = 0; i < avail; i++) {
    if (data[i] !== PREFACE_BUFFER[i]) { return callback(null, 'http/1.1') }
  }

  // Not enough bytes to be sure about HTTP2
  if (avail !== PREFACE_BUFFER.length) { return callback(null, null) }

  return callback(null, 'h2')
}

proto._onPlainConnection = function _onPlainConnection (socket) {
  var hose$1 = hose.create(socket, {}, hoseFilter);

  var self = this;
  hose$1.on('select', function (protocol, socket) {
    self._handleConnection(socket, protocol);
  });

  hose$1.on('error', function (err) {
    debug('hose error %j', err.message);
    socket.destroy();
  });
};

proto._invokeDefault = function _invokeDefault (socket) {
  var state = this._spdyState;

  for (var i = 0; i < state.listeners.length; i++) { state.listeners[i].call(this, socket); }
};

proto._onStream = function _onStream (stream) {
  var state = this._spdyState;

  var handle = spdy_1.handle.create(this._spdyState.options, stream);

  var socketOptions = {
    handle: handle,
    allowHalfOpen: true
  };

  var socket;
  if (state.secure) {
    socket = new spdy_1.Socket(stream.connection.socket, socketOptions);
  } else {
    socket = new net.Socket(socketOptions);
  }

  // This is needed because the `error` listener, added by the default
  // `connection` listener, no longer has bound arguments. It relies instead
  // on the `server` property of the socket. See https://github.com/nodejs/node/pull/11926
  // for more details.
  // This is only done for Node.js >= 4 in order to not break compatibility
  // with older versions of the platform.
  if (process.versions.modules >= 46) { socket.server = this; }

  handle.assignSocket(socket);

  // For v0.8
  socket.readable = true;
  socket.writable = true;

  this._invokeDefault(socket);

  // For v0.8, 0.10 and 0.12
  if (process.versions.modules < 46) {
    // eslint-disable-next-line
    this.listenerCount = EventEmitter.listenerCount.bind(this);
  }

  // Add lazy `checkContinue` listener, otherwise `res.writeContinue` will be
  // called before the response object was patched by us.
  if (stream.headers.expect !== undefined &&
      /100-continue/i.test(stream.headers.expect) &&
      this.listenerCount('checkContinue') === 0) {
    this.once('checkContinue', function (req, res) {
      res.writeContinue();

      this.emit('request', req, res);
    });
  }

  handle.emitRequest();
};

proto.emit = function emit (event, req, res) {
  if (event !== 'request' && event !== 'checkContinue') {
    return EventEmitter.prototype.emit.apply(this, arguments)
  }

  if (!(req.socket._handle instanceof spdy_1.handle)) {
    debug('not spdy req/res');
    req.isSpdy = false;
    req.spdyVersion = 1;
    res.isSpdy = false;
    res.spdyVersion = 1;
    return EventEmitter.prototype.emit.apply(this, arguments)
  }

  var handle = req.connection._handle;

  req.isSpdy = true;
  req.spdyVersion = handle.getStream().connection.getVersion();
  res.isSpdy = true;
  res.spdyVersion = req.spdyVersion;
  req.spdyStream = handle.getStream();

  debug('override req/res');
  res.writeHead = spdy_1.response.writeHead;
  res.end = spdy_1.response.end;
  res.push = spdy_1.response.push;
  res.writeContinue = spdy_1.response.writeContinue;
  res.spdyStream = handle.getStream();

  res._req = req;

  handle.assignRequest(req);
  handle.assignResponse(res);

  return EventEmitter.prototype.emit.apply(this, arguments)
};

exports.Server = instantiate(https.Server);
exports.PlainServer = instantiate(http.Server);

exports.create = function create (base, options, handler) {
  if (typeof base === 'object') {
    handler = options;
    options = base;
    base = null;
  }

  if (base) {
    return instantiate(base).create(options, handler)
  }

  if (options.spdy && options.spdy.plain) { return exports.PlainServer.create(options, handler) } else {
    return exports.Server.create(options, handler)
  }
};
});

var spdy_1 = createCommonjsModule(function (module, exports) {

var spdy = exports;

// Export tools
spdy.handle = handle$1;
spdy.request = request;
spdy.response = response;
spdy.Socket = socket;

// Export client
spdy.agent = agent;
spdy.Agent = spdy.agent.Agent;
spdy.createAgent = spdy.agent.create;

// Export server
spdy.server = server;
spdy.Server = spdy.server.Server;
spdy.PlainServer = spdy.server.PlainServer;
spdy.createServer = spdy.server.create;
});
