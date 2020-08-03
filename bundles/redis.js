import net from 'net';
import tls from 'tls';
import util from 'util';
import assert from 'assert';
import events from 'events';
import buffer from 'buffer';
import string_decoder from 'string_decoder';
import url from 'url';

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

// hgetall converts its replies to an Object. If the reply is empty, null is returned.
// These function are only called with internal data and have therefore always the same instanceof X
function replyToObject (reply) {
    // The reply might be a string or a buffer if this is called in a transaction (multi)
    if (reply.length === 0 || !(reply instanceof Array)) {
        return null;
    }
    var obj = {};
    for (var i = 0; i < reply.length; i += 2) {
        obj[reply[i].toString('binary')] = reply[i + 1];
    }
    return obj;
}

function replyToStrings (reply) {
    if (reply instanceof Buffer) {
        return reply.toString();
    }
    if (reply instanceof Array) {
        var res = new Array(reply.length);
        for (var i = 0; i < reply.length; i++) {
            // Recusivly call the function as slowlog returns deep nested replies
            res[i] = replyToStrings(reply[i]);
        }
        return res;
    }

    return reply;
}

function print (err, reply) {
    if (err) {
        // A error always begins with Error:
        console.log(err.toString());
    } else {
        console.log('Reply: ' + reply);
    }
}

var camelCase;
// Deep clone arbitrary objects with arrays. Can't handle cyclic structures (results in a range error)
// Any attribute with a non primitive value besides object and array will be passed by reference (e.g. Buffers, Maps, Functions)
// All capital letters are going to be replaced with a lower case letter and a underscore infront of it
function clone (obj) {
    var copy;
    if (Array.isArray(obj)) {
        copy = new Array(obj.length);
        for (var i = 0; i < obj.length; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }
    if (Object.prototype.toString.call(obj) === '[object Object]') {
        copy = {};
        var elems = Object.keys(obj);
        var elem;
        while (elem = elems.pop()) {
            if (elem === 'tls') { // special handle tls
                copy[elem] = obj[elem];
                continue;
            }
            // Accept camelCase options and convert them to snake_case
            var snake_case = elem.replace(/[A-Z][^A-Z]/g, '_$&').toLowerCase();
            // If camelCase is detected, pass it to the client, so all variables are going to be camelCased
            // There are no deep nested options objects yet, but let's handle this future proof
            if (snake_case !== elem.toLowerCase()) {
                camelCase = true;
            }
            copy[snake_case] = clone(obj[elem]);
        }
        return copy;
    }
    return obj;
}

function convenienceClone (obj) {
    camelCase = false;
    obj = clone(obj) || {};
    if (camelCase) {
        obj.camel_case = true;
    }
    return obj;
}

function callbackOrEmit (self, callback, err, res) {
    if (callback) {
        callback(err, res);
    } else if (err) {
        self.emit('error', err);
    }
}

function replyInOrder (self, callback, err, res, queue) {
    // If the queue is explicitly passed, use that, otherwise fall back to the offline queue first,
    // as there might be commands in both queues at the same time
    var command_obj;
    /* istanbul ignore if: TODO: Remove this as soon as we test Redis 3.2 on travis */
    if (queue) {
        command_obj = queue.peekBack();
    } else {
        command_obj = self.offline_queue.peekBack() || self.command_queue.peekBack();
    }
    if (!command_obj) {
        process.nextTick(function () {
            callbackOrEmit(self, callback, err, res);
        });
    } else {
        var tmp = command_obj.callback;
        command_obj.callback = tmp ?
            function (e, r) {
                tmp(e, r);
                callbackOrEmit(self, callback, err, res);
            } :
            function (e, r) {
                if (e) {
                    self.emit('error', e);
                }
                callbackOrEmit(self, callback, err, res);
            };
    }
}

var utils = {
    reply_to_strings: replyToStrings,
    reply_to_object: replyToObject,
    print: print,
    err_code: /^([A-Z]+)\s+(.+)$/,
    monitor_regex: /^[0-9]{10,11}\.[0-9]+ \[[0-9]+ .+\]( ".+?")+$/,
    clone: convenienceClone,
    callback_or_emit: callbackOrEmit,
    reply_in_order: replyInOrder
};

var betterStackTraces = /development/i.test(process.env.NODE_ENV) || /\bredis\b/i.test(process.env.NODE_DEBUG);

function Command (command, args, callback, call_on_write) {
    this.command = command;
    this.args = args;
    this.buffer_args = false;
    this.callback = callback;
    this.call_on_write = call_on_write;
    if (betterStackTraces) {
        this.error = new Error();
    }
}

var command = Command;

/**
 * Custom implementation of a double ended queue.
 */
function Denque(array) {
  this._head = 0;
  this._tail = 0;
  this._capacityMask = 0x3;
  this._list = new Array(4);
  if (Array.isArray(array)) {
    this._fromArray(array);
  }
}

/**
 * -------------
 *  PUBLIC API
 * -------------
 */

/**
 * Returns the item at the specified index from the list.
 * 0 is the first element, 1 is the second, and so on...
 * Elements at negative values are that many from the end: -1 is one before the end
 * (the last element), -2 is two before the end (one before last), etc.
 * @param index
 * @returns {*}
 */
Denque.prototype.peekAt = function peekAt(index) {
  var i = index;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  var len = this.size();
  if (i >= len || i < -len) return undefined;
  if (i < 0) i += len;
  i = (this._head + i) & this._capacityMask;
  return this._list[i];
};

/**
 * Alias for peakAt()
 * @param i
 * @returns {*}
 */
Denque.prototype.get = function get(i) {
  return this.peekAt(i);
};

/**
 * Returns the first item in the list without removing it.
 * @returns {*}
 */
Denque.prototype.peek = function peek() {
  if (this._head === this._tail) return undefined;
  return this._list[this._head];
};

/**
 * Alias for peek()
 * @returns {*}
 */
Denque.prototype.peekFront = function peekFront() {
  return this.peek();
};

/**
 * Returns the item that is at the back of the queue without removing it.
 * Uses peekAt(-1)
 */
Denque.prototype.peekBack = function peekBack() {
  return this.peekAt(-1);
};

/**
 * Returns the current length of the queue
 * @return {Number}
 */
Object.defineProperty(Denque.prototype, 'length', {
  get: function length() {
    return this.size();
  }
});

/**
 * Return the number of items on the list, or 0 if empty.
 * @returns {number}
 */
Denque.prototype.size = function size() {
  if (this._head === this._tail) return 0;
  if (this._head < this._tail) return this._tail - this._head;
  else return this._capacityMask + 1 - (this._head - this._tail);
};

/**
 * Add an item at the beginning of the list.
 * @param item
 */
Denque.prototype.unshift = function unshift(item) {
  if (item === undefined) return this.size();
  var len = this._list.length;
  this._head = (this._head - 1 + len) & this._capacityMask;
  this._list[this._head] = item;
  if (this._tail === this._head) this._growArray();
  if (this._head < this._tail) return this._tail - this._head;
  else return this._capacityMask + 1 - (this._head - this._tail);
};

/**
 * Remove and return the first item on the list,
 * Returns undefined if the list is empty.
 * @returns {*}
 */
Denque.prototype.shift = function shift() {
  var head = this._head;
  if (head === this._tail) return undefined;
  var item = this._list[head];
  this._list[head] = undefined;
  this._head = (head + 1) & this._capacityMask;
  if (head < 2 && this._tail > 10000 && this._tail <= this._list.length >>> 2) this._shrinkArray();
  return item;
};

/**
 * Add an item to the bottom of the list.
 * @param item
 */
Denque.prototype.push = function push(item) {
  if (item === undefined) return this.size();
  var tail = this._tail;
  this._list[tail] = item;
  this._tail = (tail + 1) & this._capacityMask;
  if (this._tail === this._head) {
    this._growArray();
  }

  if (this._head < this._tail) return this._tail - this._head;
  else return this._capacityMask + 1 - (this._head - this._tail);
};

/**
 * Remove and return the last item on the list.
 * Returns undefined if the list is empty.
 * @returns {*}
 */
Denque.prototype.pop = function pop() {
  var tail = this._tail;
  if (tail === this._head) return undefined;
  var len = this._list.length;
  this._tail = (tail - 1 + len) & this._capacityMask;
  var item = this._list[this._tail];
  this._list[this._tail] = undefined;
  if (this._head < 2 && tail > 10000 && tail <= len >>> 2) this._shrinkArray();
  return item;
};

/**
 * Remove and return the item at the specified index from the list.
 * Returns undefined if the list is empty.
 * @param index
 * @returns {*}
 */
Denque.prototype.removeOne = function removeOne(index) {
  var i = index;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  if (this._head === this._tail) return void 0;
  var size = this.size();
  var len = this._list.length;
  if (i >= size || i < -size) return void 0;
  if (i < 0) i += size;
  i = (this._head + i) & this._capacityMask;
  var item = this._list[i];
  var k;
  if (index < size / 2) {
    for (k = index; k > 0; k--) {
      this._list[i] = this._list[i = (i - 1 + len) & this._capacityMask];
    }
    this._list[i] = void 0;
    this._head = (this._head + 1 + len) & this._capacityMask;
  } else {
    for (k = size - 1 - index; k > 0; k--) {
      this._list[i] = this._list[i = ( i + 1 + len) & this._capacityMask];
    }
    this._list[i] = void 0;
    this._tail = (this._tail - 1 + len) & this._capacityMask;
  }
  return item;
};

/**
 * Remove number of items from the specified index from the list.
 * Returns array of removed items.
 * Returns undefined if the list is empty.
 * @param index
 * @param count
 * @returns {array}
 */
Denque.prototype.remove = function remove(index, count) {
  var i = index;
  var removed;
  var del_count = count;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  if (this._head === this._tail) return void 0;
  var size = this.size();
  var len = this._list.length;
  if (i >= size || i < -size || count < 1) return void 0;
  if (i < 0) i += size;
  if (count === 1 || !count) {
    removed = new Array(1);
    removed[0] = this.removeOne(i);
    return removed;
  }
  if (i === 0 && i + count >= size) {
    removed = this.toArray();
    this.clear();
    return removed;
  }
  if (i + count > size) count = size - i;
  var k;
  removed = new Array(count);
  for (k = 0; k < count; k++) {
    removed[k] = this._list[(this._head + i + k) & this._capacityMask];
  }
  i = (this._head + i) & this._capacityMask;
  if (index + count === size) {
    this._tail = (this._tail - count + len) & this._capacityMask;
    for (k = count; k > 0; k--) {
      this._list[i = (i + 1 + len) & this._capacityMask] = void 0;
    }
    return removed;
  }
  if (index === 0) {
    this._head = (this._head + count + len) & this._capacityMask;
    for (k = count - 1; k > 0; k--) {
      this._list[i = (i + 1 + len) & this._capacityMask] = void 0;
    }
    return removed;
  }
  if (i < size / 2) {
    this._head = (this._head + index + count + len) & this._capacityMask;
    for (k = index; k > 0; k--) {
      this.unshift(this._list[i = (i - 1 + len) & this._capacityMask]);
    }
    i = (this._head - 1 + len) & this._capacityMask;
    while (del_count > 0) {
      this._list[i = (i - 1 + len) & this._capacityMask] = void 0;
      del_count--;
    }
    if (index < 0) this._tail = i;
  } else {
    this._tail = i;
    i = (i + count + len) & this._capacityMask;
    for (k = size - (count + index); k > 0; k--) {
      this.push(this._list[i++]);
    }
    i = this._tail;
    while (del_count > 0) {
      this._list[i = (i + 1 + len) & this._capacityMask] = void 0;
      del_count--;
    }
  }
  if (this._head < 2 && this._tail > 10000 && this._tail <= len >>> 2) this._shrinkArray();
  return removed;
};

/**
 * Native splice implementation.
 * Remove number of items from the specified index from the list and/or add new elements.
 * Returns array of removed items or empty array if count == 0.
 * Returns undefined if the list is empty.
 *
 * @param index
 * @param count
 * @param {...*} [elements]
 * @returns {array}
 */
Denque.prototype.splice = function splice(index, count) {
  var i = index;
  // expect a number or return undefined
  if ((i !== (i | 0))) {
    return void 0;
  }
  var size = this.size();
  if (i < 0) i += size;
  if (i > size) return void 0;
  if (arguments.length > 2) {
    var k;
    var temp;
    var removed;
    var arg_len = arguments.length;
    var len = this._list.length;
    var arguments_index = 2;
    if (!size || i < size / 2) {
      temp = new Array(i);
      for (k = 0; k < i; k++) {
        temp[k] = this._list[(this._head + k) & this._capacityMask];
      }
      if (count === 0) {
        removed = [];
        if (i > 0) {
          this._head = (this._head + i + len) & this._capacityMask;
        }
      } else {
        removed = this.remove(i, count);
        this._head = (this._head + i + len) & this._capacityMask;
      }
      while (arg_len > arguments_index) {
        this.unshift(arguments[--arg_len]);
      }
      for (k = i; k > 0; k--) {
        this.unshift(temp[k - 1]);
      }
    } else {
      temp = new Array(size - (i + count));
      var leng = temp.length;
      for (k = 0; k < leng; k++) {
        temp[k] = this._list[(this._head + i + count + k) & this._capacityMask];
      }
      if (count === 0) {
        removed = [];
        if (i != size) {
          this._tail = (this._head + i + len) & this._capacityMask;
        }
      } else {
        removed = this.remove(i, count);
        this._tail = (this._tail - leng + len) & this._capacityMask;
      }
      while (arguments_index < arg_len) {
        this.push(arguments[arguments_index++]);
      }
      for (k = 0; k < leng; k++) {
        this.push(temp[k]);
      }
    }
    return removed;
  } else {
    return this.remove(i, count);
  }
};

/**
 * Soft clear - does not reset capacity.
 */
Denque.prototype.clear = function clear() {
  this._head = 0;
  this._tail = 0;
};

/**
 * Returns true or false whether the list is empty.
 * @returns {boolean}
 */
Denque.prototype.isEmpty = function isEmpty() {
  return this._head === this._tail;
};

/**
 * Returns an array of all queue items.
 * @returns {Array}
 */
Denque.prototype.toArray = function toArray() {
  return this._copyArray(false);
};

/**
 * -------------
 *   INTERNALS
 * -------------
 */

/**
 * Fills the queue with items from an array
 * For use in the constructor
 * @param array
 * @private
 */
Denque.prototype._fromArray = function _fromArray(array) {
  for (var i = 0; i < array.length; i++) this.push(array[i]);
};

/**
 *
 * @param fullCopy
 * @returns {Array}
 * @private
 */
Denque.prototype._copyArray = function _copyArray(fullCopy) {
  var newArray = [];
  var list = this._list;
  var len = list.length;
  var i;
  if (fullCopy || this._head > this._tail) {
    for (i = this._head; i < len; i++) newArray.push(list[i]);
    for (i = 0; i < this._tail; i++) newArray.push(list[i]);
  } else {
    for (i = this._head; i < this._tail; i++) newArray.push(list[i]);
  }
  return newArray;
};

/**
 * Grows the internal list array.
 * @private
 */
Denque.prototype._growArray = function _growArray() {
  if (this._head) {
    // copy existing data, head to end, then beginning to tail.
    this._list = this._copyArray(true);
    this._head = 0;
  }

  // head is at 0 and array is now full, safe to extend
  this._tail = this._list.length;

  this._list.length *= 2;
  this._capacityMask = (this._capacityMask << 1) | 1;
};

/**
 * Shrinks the internal list array.
 * @private
 */
Denque.prototype._shrinkArray = function _shrinkArray() {
  this._list.length >>>= 1;
  this._capacityMask >>>= 1;
};


var denque = Denque;

// RedisError

function RedisError (message) {
  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  });
  Error.captureStackTrace(this, this.constructor);
}

util.inherits(RedisError, Error);

Object.defineProperty(RedisError.prototype, 'name', {
  value: 'RedisError',
  configurable: true,
  writable: true
});

// ParserError

function ParserError (message, buffer, offset) {
  assert(buffer);
  assert.strictEqual(typeof offset, 'number');

  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  });

  const tmp = Error.stackTraceLimit;
  Error.stackTraceLimit = 2;
  Error.captureStackTrace(this, this.constructor);
  Error.stackTraceLimit = tmp;
  this.offset = offset;
  this.buffer = buffer;
}

util.inherits(ParserError, RedisError);

Object.defineProperty(ParserError.prototype, 'name', {
  value: 'ParserError',
  configurable: true,
  writable: true
});

// ReplyError

function ReplyError (message) {
  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  });
  const tmp = Error.stackTraceLimit;
  Error.stackTraceLimit = 2;
  Error.captureStackTrace(this, this.constructor);
  Error.stackTraceLimit = tmp;
}

util.inherits(ReplyError, RedisError);

Object.defineProperty(ReplyError.prototype, 'name', {
  value: 'ReplyError',
  configurable: true,
  writable: true
});

// AbortError

function AbortError (message) {
  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  });
  Error.captureStackTrace(this, this.constructor);
}

util.inherits(AbortError, RedisError);

Object.defineProperty(AbortError.prototype, 'name', {
  value: 'AbortError',
  configurable: true,
  writable: true
});

// InterruptError

function InterruptError (message) {
  Object.defineProperty(this, 'message', {
    value: message || '',
    configurable: true,
    writable: true
  });
  Error.captureStackTrace(this, this.constructor);
}

util.inherits(InterruptError, AbortError);

Object.defineProperty(InterruptError.prototype, 'name', {
  value: 'InterruptError',
  configurable: true,
  writable: true
});

var old = {
  RedisError,
  ParserError,
  ReplyError,
  AbortError,
  InterruptError
};

class RedisError$1 extends Error {
  get name () {
    return this.constructor.name
  }
}

class ParserError$1 extends RedisError$1 {
  constructor (message, buffer, offset) {
    assert(buffer);
    assert.strictEqual(typeof offset, 'number');

    const tmp = Error.stackTraceLimit;
    Error.stackTraceLimit = 2;
    super(message);
    Error.stackTraceLimit = tmp;
    this.offset = offset;
    this.buffer = buffer;
  }

  get name () {
    return this.constructor.name
  }
}

class ReplyError$1 extends RedisError$1 {
  constructor (message) {
    const tmp = Error.stackTraceLimit;
    Error.stackTraceLimit = 2;
    super(message);
    Error.stackTraceLimit = tmp;
  }
  get name () {
    return this.constructor.name
  }
}

class AbortError$1 extends RedisError$1 {
  get name () {
    return this.constructor.name
  }
}

class InterruptError$1 extends AbortError$1 {
  get name () {
    return this.constructor.name
  }
}

var modern = {
  RedisError: RedisError$1,
  ParserError: ParserError$1,
  ReplyError: ReplyError$1,
  AbortError: AbortError$1,
  InterruptError: InterruptError$1
};

const Errors = process.version.charCodeAt(1) < 55 && process.version.charCodeAt(2) === 46
  ? old // Node.js < 7
  : modern;

var redisErrors = Errors;

var RedisError$2 = redisErrors.RedisError;
var ADD_STACKTRACE = false;

function AbortError$2 (obj, stack) {
    assert(obj, 'The options argument is required');
    assert.strictEqual(typeof obj, 'object', 'The options argument has to be of type object');

    Object.defineProperty(this, 'message', {
        value: obj.message || '',
        configurable: true,
        writable: true
    });
    if (stack || stack === undefined) {
        Error.captureStackTrace(this, AbortError$2);
    }
    for (var keys = Object.keys(obj), key = keys.pop(); key; key = keys.pop()) {
        this[key] = obj[key];
    }
}

function AggregateError (obj) {
    assert(obj, 'The options argument is required');
    assert.strictEqual(typeof obj, 'object', 'The options argument has to be of type object');

    AbortError$2.call(this, obj, ADD_STACKTRACE);
    Object.defineProperty(this, 'message', {
        value: obj.message || '',
        configurable: true,
        writable: true
    });
    Error.captureStackTrace(this, AggregateError);
    for (var keys = Object.keys(obj), key = keys.pop(); key; key = keys.pop()) {
        this[key] = obj[key];
    }
}

util.inherits(AbortError$2, RedisError$2);
util.inherits(AggregateError, AbortError$2);

Object.defineProperty(AbortError$2.prototype, 'name', {
    value: 'AbortError',
    configurable: true,
    writable: true
});
Object.defineProperty(AggregateError.prototype, 'name', {
    value: 'AggregateError',
    configurable: true,
    writable: true
});

var customErrors = {
    AbortError: AbortError$2,
    AggregateError: AggregateError
};

const Buffer$1 = buffer.Buffer;
const StringDecoder = string_decoder.StringDecoder;
const decoder = new StringDecoder();

const ReplyError$2 = redisErrors.ReplyError;
const ParserError$2 = redisErrors.ParserError;
var bufferPool = Buffer$1.allocUnsafe(32 * 1024);
var bufferOffset = 0;
var interval = null;
var counter = 0;
var notDecreased = 0;

/**
 * Used for integer numbers only
 * @param {JavascriptRedisParser} parser
 * @returns {undefined|number}
 */
function parseSimpleNumbers (parser) {
  const length = parser.buffer.length - 1;
  var offset = parser.offset;
  var number = 0;
  var sign = 1;

  if (parser.buffer[offset] === 45) {
    sign = -1;
    offset++;
  }

  while (offset < length) {
    const c1 = parser.buffer[offset++];
    if (c1 === 13) { // \r\n
      parser.offset = offset + 1;
      return sign * number
    }
    number = (number * 10) + (c1 - 48);
  }
}

/**
 * Used for integer numbers in case of the returnNumbers option
 *
 * Reading the string as parts of n SMI is more efficient than
 * using a string directly.
 *
 * @param {JavascriptRedisParser} parser
 * @returns {undefined|string}
 */
function parseStringNumbers (parser) {
  const length = parser.buffer.length - 1;
  var offset = parser.offset;
  var number = 0;
  var res = '';

  if (parser.buffer[offset] === 45) {
    res += '-';
    offset++;
  }

  while (offset < length) {
    var c1 = parser.buffer[offset++];
    if (c1 === 13) { // \r\n
      parser.offset = offset + 1;
      if (number !== 0) {
        res += number;
      }
      return res
    } else if (number > 429496728) {
      res += (number * 10) + (c1 - 48);
      number = 0;
    } else if (c1 === 48 && number === 0) {
      res += 0;
    } else {
      number = (number * 10) + (c1 - 48);
    }
  }
}

/**
 * Parse a '+' redis simple string response but forward the offsets
 * onto convertBufferRange to generate a string.
 * @param {JavascriptRedisParser} parser
 * @returns {undefined|string|Buffer}
 */
function parseSimpleString (parser) {
  const start = parser.offset;
  const buffer = parser.buffer;
  const length = buffer.length - 1;
  var offset = start;

  while (offset < length) {
    if (buffer[offset++] === 13) { // \r\n
      parser.offset = offset + 1;
      if (parser.optionReturnBuffers === true) {
        return parser.buffer.slice(start, offset - 1)
      }
      return parser.buffer.toString('utf8', start, offset - 1)
    }
  }
}

/**
 * Returns the read length
 * @param {JavascriptRedisParser} parser
 * @returns {undefined|number}
 */
function parseLength (parser) {
  const length = parser.buffer.length - 1;
  var offset = parser.offset;
  var number = 0;

  while (offset < length) {
    const c1 = parser.buffer[offset++];
    if (c1 === 13) {
      parser.offset = offset + 1;
      return number
    }
    number = (number * 10) + (c1 - 48);
  }
}

/**
 * Parse a ':' redis integer response
 *
 * If stringNumbers is activated the parser always returns numbers as string
 * This is important for big numbers (number > Math.pow(2, 53)) as js numbers
 * are 64bit floating point numbers with reduced precision
 *
 * @param {JavascriptRedisParser} parser
 * @returns {undefined|number|string}
 */
function parseInteger (parser) {
  if (parser.optionStringNumbers === true) {
    return parseStringNumbers(parser)
  }
  return parseSimpleNumbers(parser)
}

/**
 * Parse a '$' redis bulk string response
 * @param {JavascriptRedisParser} parser
 * @returns {undefined|null|string}
 */
function parseBulkString (parser) {
  const length = parseLength(parser);
  if (length === undefined) {
    return
  }
  if (length < 0) {
    return null
  }
  const offset = parser.offset + length;
  if (offset + 2 > parser.buffer.length) {
    parser.bigStrSize = offset + 2;
    parser.totalChunkSize = parser.buffer.length;
    parser.bufferCache.push(parser.buffer);
    return
  }
  const start = parser.offset;
  parser.offset = offset + 2;
  if (parser.optionReturnBuffers === true) {
    return parser.buffer.slice(start, offset)
  }
  return parser.buffer.toString('utf8', start, offset)
}

/**
 * Parse a '-' redis error response
 * @param {JavascriptRedisParser} parser
 * @returns {ReplyError}
 */
function parseError (parser) {
  var string = parseSimpleString(parser);
  if (string !== undefined) {
    if (parser.optionReturnBuffers === true) {
      string = string.toString();
    }
    return new ReplyError$2(string)
  }
}

/**
 * Parsing error handler, resets parser buffer
 * @param {JavascriptRedisParser} parser
 * @param {number} type
 * @returns {undefined}
 */
function handleError (parser, type) {
  const err = new ParserError$2(
    'Protocol error, got ' + JSON.stringify(String.fromCharCode(type)) + ' as reply type byte',
    JSON.stringify(parser.buffer),
    parser.offset
  );
  parser.buffer = null;
  parser.returnFatalError(err);
}

/**
 * Parse a '*' redis array response
 * @param {JavascriptRedisParser} parser
 * @returns {undefined|null|any[]}
 */
function parseArray (parser) {
  const length = parseLength(parser);
  if (length === undefined) {
    return
  }
  if (length < 0) {
    return null
  }
  const responses = new Array(length);
  return parseArrayElements(parser, responses, 0)
}

/**
 * Push a partly parsed array to the stack
 *
 * @param {JavascriptRedisParser} parser
 * @param {any[]} array
 * @param {number} pos
 * @returns {undefined}
 */
function pushArrayCache (parser, array, pos) {
  parser.arrayCache.push(array);
  parser.arrayPos.push(pos);
}

/**
 * Parse chunked redis array response
 * @param {JavascriptRedisParser} parser
 * @returns {undefined|any[]}
 */
function parseArrayChunks (parser) {
  const tmp = parser.arrayCache.pop();
  var pos = parser.arrayPos.pop();
  if (parser.arrayCache.length) {
    const res = parseArrayChunks(parser);
    if (res === undefined) {
      pushArrayCache(parser, tmp, pos);
      return
    }
    tmp[pos++] = res;
  }
  return parseArrayElements(parser, tmp, pos)
}

/**
 * Parse redis array response elements
 * @param {JavascriptRedisParser} parser
 * @param {Array} responses
 * @param {number} i
 * @returns {undefined|null|any[]}
 */
function parseArrayElements (parser, responses, i) {
  const bufferLength = parser.buffer.length;
  while (i < responses.length) {
    const offset = parser.offset;
    if (parser.offset >= bufferLength) {
      pushArrayCache(parser, responses, i);
      return
    }
    const response = parseType(parser, parser.buffer[parser.offset++]);
    if (response === undefined) {
      if (!(parser.arrayCache.length || parser.bufferCache.length)) {
        parser.offset = offset;
      }
      pushArrayCache(parser, responses, i);
      return
    }
    responses[i] = response;
    i++;
  }

  return responses
}

/**
 * Called the appropriate parser for the specified type.
 *
 * 36: $
 * 43: +
 * 42: *
 * 58: :
 * 45: -
 *
 * @param {JavascriptRedisParser} parser
 * @param {number} type
 * @returns {*}
 */
function parseType (parser, type) {
  switch (type) {
    case 36:
      return parseBulkString(parser)
    case 43:
      return parseSimpleString(parser)
    case 42:
      return parseArray(parser)
    case 58:
      return parseInteger(parser)
    case 45:
      return parseError(parser)
    default:
      return handleError(parser, type)
  }
}

/**
 * Decrease the bufferPool size over time
 *
 * Balance between increasing and decreasing the bufferPool.
 * Decrease the bufferPool by 10% by removing the first 10% of the current pool.
 * @returns {undefined}
 */
function decreaseBufferPool () {
  if (bufferPool.length > 50 * 1024) {
    if (counter === 1 || notDecreased > counter * 2) {
      const minSliceLen = Math.floor(bufferPool.length / 10);
      const sliceLength = minSliceLen < bufferOffset
        ? bufferOffset
        : minSliceLen;
      bufferOffset = 0;
      bufferPool = bufferPool.slice(sliceLength, bufferPool.length);
    } else {
      notDecreased++;
      counter--;
    }
  } else {
    clearInterval(interval);
    counter = 0;
    notDecreased = 0;
    interval = null;
  }
}

/**
 * Check if the requested size fits in the current bufferPool.
 * If it does not, reset and increase the bufferPool accordingly.
 *
 * @param {number} length
 * @returns {undefined}
 */
function resizeBuffer (length) {
  if (bufferPool.length < length + bufferOffset) {
    const multiplier = length > 1024 * 1024 * 75 ? 2 : 3;
    if (bufferOffset > 1024 * 1024 * 111) {
      bufferOffset = 1024 * 1024 * 50;
    }
    bufferPool = Buffer$1.allocUnsafe(length * multiplier + bufferOffset);
    bufferOffset = 0;
    counter++;
    if (interval === null) {
      interval = setInterval(decreaseBufferPool, 50);
    }
  }
}

/**
 * Concat a bulk string containing multiple chunks
 *
 * Notes:
 * 1) The first chunk might contain the whole bulk string including the \r
 * 2) We are only safe to fully add up elements that are neither the first nor any of the last two elements
 *
 * @param {JavascriptRedisParser} parser
 * @returns {String}
 */
function concatBulkString (parser) {
  const list = parser.bufferCache;
  const oldOffset = parser.offset;
  var chunks = list.length;
  var offset = parser.bigStrSize - parser.totalChunkSize;
  parser.offset = offset;
  if (offset <= 2) {
    if (chunks === 2) {
      return list[0].toString('utf8', oldOffset, list[0].length + offset - 2)
    }
    chunks--;
    offset = list[list.length - 2].length + offset;
  }
  var res = decoder.write(list[0].slice(oldOffset));
  for (var i = 1; i < chunks - 1; i++) {
    res += decoder.write(list[i]);
  }
  res += decoder.end(list[i].slice(0, offset - 2));
  return res
}

/**
 * Concat the collected chunks from parser.bufferCache.
 *
 * Increases the bufferPool size beforehand if necessary.
 *
 * @param {JavascriptRedisParser} parser
 * @returns {Buffer}
 */
function concatBulkBuffer (parser) {
  const list = parser.bufferCache;
  const oldOffset = parser.offset;
  const length = parser.bigStrSize - oldOffset - 2;
  var chunks = list.length;
  var offset = parser.bigStrSize - parser.totalChunkSize;
  parser.offset = offset;
  if (offset <= 2) {
    if (chunks === 2) {
      return list[0].slice(oldOffset, list[0].length + offset - 2)
    }
    chunks--;
    offset = list[list.length - 2].length + offset;
  }
  resizeBuffer(length);
  const start = bufferOffset;
  list[0].copy(bufferPool, start, oldOffset, list[0].length);
  bufferOffset += list[0].length - oldOffset;
  for (var i = 1; i < chunks - 1; i++) {
    list[i].copy(bufferPool, bufferOffset);
    bufferOffset += list[i].length;
  }
  list[i].copy(bufferPool, bufferOffset, 0, offset - 2);
  bufferOffset += offset - 2;
  return bufferPool.slice(start, bufferOffset)
}

class JavascriptRedisParser {
  /**
   * Javascript Redis Parser constructor
   * @param {{returnError: Function, returnReply: Function, returnFatalError?: Function, returnBuffers: boolean, stringNumbers: boolean }} options
   * @constructor
   */
  constructor (options) {
    if (!options) {
      throw new TypeError('Options are mandatory.')
    }
    if (typeof options.returnError !== 'function' || typeof options.returnReply !== 'function') {
      throw new TypeError('The returnReply and returnError options have to be functions.')
    }
    this.setReturnBuffers(!!options.returnBuffers);
    this.setStringNumbers(!!options.stringNumbers);
    this.returnError = options.returnError;
    this.returnFatalError = options.returnFatalError || options.returnError;
    this.returnReply = options.returnReply;
    this.reset();
  }

  /**
   * Reset the parser values to the initial state
   *
   * @returns {undefined}
   */
  reset () {
    this.offset = 0;
    this.buffer = null;
    this.bigStrSize = 0;
    this.totalChunkSize = 0;
    this.bufferCache = [];
    this.arrayCache = [];
    this.arrayPos = [];
  }

  /**
   * Set the returnBuffers option
   *
   * @param {boolean} returnBuffers
   * @returns {undefined}
   */
  setReturnBuffers (returnBuffers) {
    if (typeof returnBuffers !== 'boolean') {
      throw new TypeError('The returnBuffers argument has to be a boolean')
    }
    this.optionReturnBuffers = returnBuffers;
  }

  /**
   * Set the stringNumbers option
   *
   * @param {boolean} stringNumbers
   * @returns {undefined}
   */
  setStringNumbers (stringNumbers) {
    if (typeof stringNumbers !== 'boolean') {
      throw new TypeError('The stringNumbers argument has to be a boolean')
    }
    this.optionStringNumbers = stringNumbers;
  }

  /**
   * Parse the redis buffer
   * @param {Buffer} buffer
   * @returns {undefined}
   */
  execute (buffer) {
    if (this.buffer === null) {
      this.buffer = buffer;
      this.offset = 0;
    } else if (this.bigStrSize === 0) {
      const oldLength = this.buffer.length;
      const remainingLength = oldLength - this.offset;
      const newBuffer = Buffer$1.allocUnsafe(remainingLength + buffer.length);
      this.buffer.copy(newBuffer, 0, this.offset, oldLength);
      buffer.copy(newBuffer, remainingLength, 0, buffer.length);
      this.buffer = newBuffer;
      this.offset = 0;
      if (this.arrayCache.length) {
        const arr = parseArrayChunks(this);
        if (arr === undefined) {
          return
        }
        this.returnReply(arr);
      }
    } else if (this.totalChunkSize + buffer.length >= this.bigStrSize) {
      this.bufferCache.push(buffer);
      var tmp = this.optionReturnBuffers ? concatBulkBuffer(this) : concatBulkString(this);
      this.bigStrSize = 0;
      this.bufferCache = [];
      this.buffer = buffer;
      if (this.arrayCache.length) {
        this.arrayCache[0][this.arrayPos[0]++] = tmp;
        tmp = parseArrayChunks(this);
        if (tmp === undefined) {
          return
        }
      }
      this.returnReply(tmp);
    } else {
      this.bufferCache.push(buffer);
      this.totalChunkSize += buffer.length;
      return
    }

    while (this.offset < this.buffer.length) {
      const offset = this.offset;
      const type = this.buffer[this.offset++];
      const response = parseType(this, type);
      if (response === undefined) {
        if (!(this.arrayCache.length || this.bufferCache.length)) {
          this.offset = offset;
        }
        return
      }

      if (type === 45) {
        this.returnError(response);
      } else {
        this.returnReply(response);
      }
    }

    this.buffer = null;
  }
}

var parser = JavascriptRedisParser;

var redisParser = parser;

var acl = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale",
		"skip_slowlog"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var append = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var asking = {
	arity: 1,
	flags: [
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var auth = {
	arity: -2,
	flags: [
		"noscript",
		"loading",
		"stale",
		"skip_monitor",
		"skip_slowlog",
		"fast",
		"no_auth"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var bgrewriteaof = {
	arity: 1,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var bgsave = {
	arity: -1,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var bitcount = {
	arity: -2,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var bitfield = {
	arity: -2,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var bitfield_ro = {
	arity: -2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var bitop = {
	arity: -4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 2,
	keyStop: -1,
	step: 1
};
var bitpos = {
	arity: -3,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var blpop = {
	arity: -3,
	flags: [
		"write",
		"noscript"
	],
	keyStart: 1,
	keyStop: -2,
	step: 1
};
var brpop = {
	arity: -3,
	flags: [
		"write",
		"noscript"
	],
	keyStart: 1,
	keyStop: -2,
	step: 1
};
var brpoplpush = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"noscript"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var bzpopmax = {
	arity: -3,
	flags: [
		"write",
		"noscript",
		"fast"
	],
	keyStart: 1,
	keyStop: -2,
	step: 1
};
var bzpopmin = {
	arity: -3,
	flags: [
		"write",
		"noscript",
		"fast"
	],
	keyStart: 1,
	keyStop: -2,
	step: 1
};
var client = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var cluster = {
	arity: -2,
	flags: [
		"admin",
		"random",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var command$1 = {
	arity: -1,
	flags: [
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var config = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var dbsize = {
	arity: 1,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var debug = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var decr = {
	arity: 2,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var decrby = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var del = {
	arity: -2,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var discard = {
	arity: 1,
	flags: [
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var dump = {
	arity: 2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var echo = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var evalsha = {
	arity: -3,
	flags: [
		"noscript",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var exec = {
	arity: 1,
	flags: [
		"noscript",
		"loading",
		"stale",
		"skip_monitor",
		"skip_slowlog"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var exists = {
	arity: -2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var expire = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var expireat = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var flushall = {
	arity: -1,
	flags: [
		"write"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var flushdb = {
	arity: -1,
	flags: [
		"write"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var geoadd = {
	arity: -5,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var geodist = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var geohash = {
	arity: -2,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var geopos = {
	arity: -2,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var georadius = {
	arity: -6,
	flags: [
		"write",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var georadius_ro = {
	arity: -6,
	flags: [
		"readonly",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var georadiusbymember = {
	arity: -5,
	flags: [
		"write",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var georadiusbymember_ro = {
	arity: -5,
	flags: [
		"readonly",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var get = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var getbit = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var getrange = {
	arity: 4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var getset = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hdel = {
	arity: -3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hello = {
	arity: -2,
	flags: [
		"noscript",
		"loading",
		"stale",
		"skip_monitor",
		"skip_slowlog",
		"fast",
		"no_auth"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var hexists = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hget = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hgetall = {
	arity: 2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hincrby = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hincrbyfloat = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hkeys = {
	arity: 2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hlen = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hmget = {
	arity: -3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hmset = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hscan = {
	arity: -3,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hset = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hsetnx = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hstrlen = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var hvals = {
	arity: 2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var incr = {
	arity: 2,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var incrby = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var incrbyfloat = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var info = {
	arity: -1,
	flags: [
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var keys = {
	arity: 2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var lastsave = {
	arity: 1,
	flags: [
		"readonly",
		"random",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var latency = {
	arity: -2,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var lindex = {
	arity: 3,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var linsert = {
	arity: 5,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var llen = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lolwut = {
	arity: -1,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var lpop = {
	arity: 2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lpos = {
	arity: -3,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lpush = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lpushx = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lrange = {
	arity: 4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lrem = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var lset = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var ltrim = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var memory = {
	arity: -2,
	flags: [
		"readonly",
		"random",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var mget = {
	arity: -2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var migrate = {
	arity: -6,
	flags: [
		"write",
		"random",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var module = {
	arity: -2,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var monitor = {
	arity: 1,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var move = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var mset = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 2
};
var msetnx = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 2
};
var multi = {
	arity: 1,
	flags: [
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var object = {
	arity: -2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 2,
	keyStop: 2,
	step: 1
};
var persist = {
	arity: 2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var pexpire = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var pexpireat = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var pfadd = {
	arity: -2,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var pfcount = {
	arity: -2,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var pfdebug = {
	arity: -3,
	flags: [
		"write",
		"admin"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var pfmerge = {
	arity: -2,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var pfselftest = {
	arity: 1,
	flags: [
		"admin"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var ping = {
	arity: -1,
	flags: [
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var post = {
	arity: -1,
	flags: [
		"readonly",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var psetex = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var psubscribe = {
	arity: -2,
	flags: [
		"pubsub",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var psync = {
	arity: 3,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var pttl = {
	arity: 2,
	flags: [
		"readonly",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var publish = {
	arity: 3,
	flags: [
		"pubsub",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var pubsub = {
	arity: -2,
	flags: [
		"pubsub",
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var punsubscribe = {
	arity: -1,
	flags: [
		"pubsub",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var quit = {
	arity: 1,
	flags: [
		"loading",
		"stale",
		"readonly"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var randomkey = {
	arity: 1,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var readonly = {
	arity: 1,
	flags: [
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var readwrite = {
	arity: 1,
	flags: [
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var rename = {
	arity: 3,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var renamenx = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var replconf = {
	arity: -1,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var replicaof = {
	arity: 3,
	flags: [
		"admin",
		"noscript",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var restore = {
	arity: -4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var role = {
	arity: 1,
	flags: [
		"readonly",
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var rpop = {
	arity: 2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var rpoplpush = {
	arity: 3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var rpush = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var rpushx = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var sadd = {
	arity: -3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var save = {
	arity: 1,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var scan = {
	arity: -2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var scard = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var script = {
	arity: -2,
	flags: [
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var sdiff = {
	arity: -2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var sdiffstore = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var select = {
	arity: 2,
	flags: [
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var set = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var setbit = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var setex = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var setnx = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var setrange = {
	arity: 4,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var shutdown = {
	arity: -1,
	flags: [
		"admin",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var sinter = {
	arity: -2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var sinterstore = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var sismember = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var slaveof = {
	arity: 3,
	flags: [
		"admin",
		"noscript",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var slowlog = {
	arity: -2,
	flags: [
		"admin",
		"random",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var smembers = {
	arity: 2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var smove = {
	arity: 4,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 2,
	step: 1
};
var sort = {
	arity: -2,
	flags: [
		"write",
		"denyoom",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var spop = {
	arity: -2,
	flags: [
		"write",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var srandmember = {
	arity: -2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var srem = {
	arity: -3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var sscan = {
	arity: -3,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var stralgo = {
	arity: -2,
	flags: [
		"readonly",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var strlen = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var subscribe = {
	arity: -2,
	flags: [
		"pubsub",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var substr = {
	arity: 4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var sunion = {
	arity: -2,
	flags: [
		"readonly",
		"sort_for_script"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var sunionstore = {
	arity: -3,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var swapdb = {
	arity: 3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var sync = {
	arity: 1,
	flags: [
		"admin",
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var time = {
	arity: 1,
	flags: [
		"readonly",
		"random",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var touch = {
	arity: -2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var ttl = {
	arity: 2,
	flags: [
		"readonly",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var type = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var unlink = {
	arity: -2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var unsubscribe = {
	arity: -1,
	flags: [
		"pubsub",
		"noscript",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var unwatch = {
	arity: 1,
	flags: [
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var wait = {
	arity: 3,
	flags: [
		"noscript"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var watch = {
	arity: -2,
	flags: [
		"noscript",
		"loading",
		"stale",
		"fast"
	],
	keyStart: 1,
	keyStop: -1,
	step: 1
};
var xack = {
	arity: -4,
	flags: [
		"write",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xadd = {
	arity: -5,
	flags: [
		"write",
		"denyoom",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xclaim = {
	arity: -6,
	flags: [
		"write",
		"random",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xdel = {
	arity: -3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xgroup = {
	arity: -2,
	flags: [
		"write",
		"denyoom"
	],
	keyStart: 2,
	keyStop: 2,
	step: 1
};
var xinfo = {
	arity: -2,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 2,
	keyStop: 2,
	step: 1
};
var xlen = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xpending = {
	arity: -3,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xrange = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xread = {
	arity: -4,
	flags: [
		"readonly",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xreadgroup = {
	arity: -7,
	flags: [
		"write",
		"movablekeys"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xrevrange = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xsetid = {
	arity: 3,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var xtrim = {
	arity: -2,
	flags: [
		"write",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zadd = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zcard = {
	arity: 2,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zcount = {
	arity: 4,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zincrby = {
	arity: 4,
	flags: [
		"write",
		"denyoom",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zinterstore = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var zlexcount = {
	arity: 4,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zpopmax = {
	arity: -2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zpopmin = {
	arity: -2,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrange = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrangebylex = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrangebyscore = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrank = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrem = {
	arity: -3,
	flags: [
		"write",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zremrangebylex = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zremrangebyrank = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zremrangebyscore = {
	arity: 4,
	flags: [
		"write"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrevrange = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrevrangebylex = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrevrangebyscore = {
	arity: -4,
	flags: [
		"readonly"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zrevrank = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zscan = {
	arity: -3,
	flags: [
		"readonly",
		"random"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zscore = {
	arity: 3,
	flags: [
		"readonly",
		"fast"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
};
var zunionstore = {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
};
var commands = {
	acl: acl,
	append: append,
	asking: asking,
	auth: auth,
	bgrewriteaof: bgrewriteaof,
	bgsave: bgsave,
	bitcount: bitcount,
	bitfield: bitfield,
	bitfield_ro: bitfield_ro,
	bitop: bitop,
	bitpos: bitpos,
	blpop: blpop,
	brpop: brpop,
	brpoplpush: brpoplpush,
	bzpopmax: bzpopmax,
	bzpopmin: bzpopmin,
	client: client,
	cluster: cluster,
	command: command$1,
	config: config,
	dbsize: dbsize,
	debug: debug,
	decr: decr,
	decrby: decrby,
	del: del,
	discard: discard,
	dump: dump,
	echo: echo,
	"eval": {
	arity: -3,
	flags: [
		"noscript",
		"movablekeys"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
},
	evalsha: evalsha,
	exec: exec,
	exists: exists,
	expire: expire,
	expireat: expireat,
	flushall: flushall,
	flushdb: flushdb,
	geoadd: geoadd,
	geodist: geodist,
	geohash: geohash,
	geopos: geopos,
	georadius: georadius,
	georadius_ro: georadius_ro,
	georadiusbymember: georadiusbymember,
	georadiusbymember_ro: georadiusbymember_ro,
	get: get,
	getbit: getbit,
	getrange: getrange,
	getset: getset,
	hdel: hdel,
	hello: hello,
	hexists: hexists,
	hget: hget,
	hgetall: hgetall,
	hincrby: hincrby,
	hincrbyfloat: hincrbyfloat,
	hkeys: hkeys,
	hlen: hlen,
	hmget: hmget,
	hmset: hmset,
	"host:": {
	arity: -1,
	flags: [
		"readonly",
		"loading",
		"stale"
	],
	keyStart: 0,
	keyStop: 0,
	step: 0
},
	hscan: hscan,
	hset: hset,
	hsetnx: hsetnx,
	hstrlen: hstrlen,
	hvals: hvals,
	incr: incr,
	incrby: incrby,
	incrbyfloat: incrbyfloat,
	info: info,
	keys: keys,
	lastsave: lastsave,
	latency: latency,
	lindex: lindex,
	linsert: linsert,
	llen: llen,
	lolwut: lolwut,
	lpop: lpop,
	lpos: lpos,
	lpush: lpush,
	lpushx: lpushx,
	lrange: lrange,
	lrem: lrem,
	lset: lset,
	ltrim: ltrim,
	memory: memory,
	mget: mget,
	migrate: migrate,
	module: module,
	monitor: monitor,
	move: move,
	mset: mset,
	msetnx: msetnx,
	multi: multi,
	object: object,
	persist: persist,
	pexpire: pexpire,
	pexpireat: pexpireat,
	pfadd: pfadd,
	pfcount: pfcount,
	pfdebug: pfdebug,
	pfmerge: pfmerge,
	pfselftest: pfselftest,
	ping: ping,
	post: post,
	psetex: psetex,
	psubscribe: psubscribe,
	psync: psync,
	pttl: pttl,
	publish: publish,
	pubsub: pubsub,
	punsubscribe: punsubscribe,
	quit: quit,
	randomkey: randomkey,
	readonly: readonly,
	readwrite: readwrite,
	rename: rename,
	renamenx: renamenx,
	replconf: replconf,
	replicaof: replicaof,
	restore: restore,
	"restore-asking": {
	arity: -4,
	flags: [
		"write",
		"denyoom",
		"asking"
	],
	keyStart: 1,
	keyStop: 1,
	step: 1
},
	role: role,
	rpop: rpop,
	rpoplpush: rpoplpush,
	rpush: rpush,
	rpushx: rpushx,
	sadd: sadd,
	save: save,
	scan: scan,
	scard: scard,
	script: script,
	sdiff: sdiff,
	sdiffstore: sdiffstore,
	select: select,
	set: set,
	setbit: setbit,
	setex: setex,
	setnx: setnx,
	setrange: setrange,
	shutdown: shutdown,
	sinter: sinter,
	sinterstore: sinterstore,
	sismember: sismember,
	slaveof: slaveof,
	slowlog: slowlog,
	smembers: smembers,
	smove: smove,
	sort: sort,
	spop: spop,
	srandmember: srandmember,
	srem: srem,
	sscan: sscan,
	stralgo: stralgo,
	strlen: strlen,
	subscribe: subscribe,
	substr: substr,
	sunion: sunion,
	sunionstore: sunionstore,
	swapdb: swapdb,
	sync: sync,
	time: time,
	touch: touch,
	ttl: ttl,
	type: type,
	unlink: unlink,
	unsubscribe: unsubscribe,
	unwatch: unwatch,
	wait: wait,
	watch: watch,
	xack: xack,
	xadd: xadd,
	xclaim: xclaim,
	xdel: xdel,
	xgroup: xgroup,
	xinfo: xinfo,
	xlen: xlen,
	xpending: xpending,
	xrange: xrange,
	xread: xread,
	xreadgroup: xreadgroup,
	xrevrange: xrevrange,
	xsetid: xsetid,
	xtrim: xtrim,
	zadd: zadd,
	zcard: zcard,
	zcount: zcount,
	zincrby: zincrby,
	zinterstore: zinterstore,
	zlexcount: zlexcount,
	zpopmax: zpopmax,
	zpopmin: zpopmin,
	zrange: zrange,
	zrangebylex: zrangebylex,
	zrangebyscore: zrangebyscore,
	zrank: zrank,
	zrem: zrem,
	zremrangebylex: zremrangebylex,
	zremrangebyrank: zremrangebyrank,
	zremrangebyscore: zremrangebyscore,
	zrevrange: zrevrange,
	zrevrangebylex: zrevrangebylex,
	zrevrangebyscore: zrevrangebyscore,
	zrevrank: zrevrank,
	zscan: zscan,
	zscore: zscore,
	zunionstore: zunionstore
};

var commands$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	acl: acl,
	append: append,
	asking: asking,
	auth: auth,
	bgrewriteaof: bgrewriteaof,
	bgsave: bgsave,
	bitcount: bitcount,
	bitfield: bitfield,
	bitfield_ro: bitfield_ro,
	bitop: bitop,
	bitpos: bitpos,
	blpop: blpop,
	brpop: brpop,
	brpoplpush: brpoplpush,
	bzpopmax: bzpopmax,
	bzpopmin: bzpopmin,
	client: client,
	cluster: cluster,
	command: command$1,
	config: config,
	dbsize: dbsize,
	debug: debug,
	decr: decr,
	decrby: decrby,
	del: del,
	discard: discard,
	dump: dump,
	echo: echo,
	evalsha: evalsha,
	exec: exec,
	exists: exists,
	expire: expire,
	expireat: expireat,
	flushall: flushall,
	flushdb: flushdb,
	geoadd: geoadd,
	geodist: geodist,
	geohash: geohash,
	geopos: geopos,
	georadius: georadius,
	georadius_ro: georadius_ro,
	georadiusbymember: georadiusbymember,
	georadiusbymember_ro: georadiusbymember_ro,
	get: get,
	getbit: getbit,
	getrange: getrange,
	getset: getset,
	hdel: hdel,
	hello: hello,
	hexists: hexists,
	hget: hget,
	hgetall: hgetall,
	hincrby: hincrby,
	hincrbyfloat: hincrbyfloat,
	hkeys: hkeys,
	hlen: hlen,
	hmget: hmget,
	hmset: hmset,
	hscan: hscan,
	hset: hset,
	hsetnx: hsetnx,
	hstrlen: hstrlen,
	hvals: hvals,
	incr: incr,
	incrby: incrby,
	incrbyfloat: incrbyfloat,
	info: info,
	keys: keys,
	lastsave: lastsave,
	latency: latency,
	lindex: lindex,
	linsert: linsert,
	llen: llen,
	lolwut: lolwut,
	lpop: lpop,
	lpos: lpos,
	lpush: lpush,
	lpushx: lpushx,
	lrange: lrange,
	lrem: lrem,
	lset: lset,
	ltrim: ltrim,
	memory: memory,
	mget: mget,
	migrate: migrate,
	module: module,
	monitor: monitor,
	move: move,
	mset: mset,
	msetnx: msetnx,
	multi: multi,
	object: object,
	persist: persist,
	pexpire: pexpire,
	pexpireat: pexpireat,
	pfadd: pfadd,
	pfcount: pfcount,
	pfdebug: pfdebug,
	pfmerge: pfmerge,
	pfselftest: pfselftest,
	ping: ping,
	post: post,
	psetex: psetex,
	psubscribe: psubscribe,
	psync: psync,
	pttl: pttl,
	publish: publish,
	pubsub: pubsub,
	punsubscribe: punsubscribe,
	quit: quit,
	randomkey: randomkey,
	readonly: readonly,
	readwrite: readwrite,
	rename: rename,
	renamenx: renamenx,
	replconf: replconf,
	replicaof: replicaof,
	restore: restore,
	role: role,
	rpop: rpop,
	rpoplpush: rpoplpush,
	rpush: rpush,
	rpushx: rpushx,
	sadd: sadd,
	save: save,
	scan: scan,
	scard: scard,
	script: script,
	sdiff: sdiff,
	sdiffstore: sdiffstore,
	select: select,
	set: set,
	setbit: setbit,
	setex: setex,
	setnx: setnx,
	setrange: setrange,
	shutdown: shutdown,
	sinter: sinter,
	sinterstore: sinterstore,
	sismember: sismember,
	slaveof: slaveof,
	slowlog: slowlog,
	smembers: smembers,
	smove: smove,
	sort: sort,
	spop: spop,
	srandmember: srandmember,
	srem: srem,
	sscan: sscan,
	stralgo: stralgo,
	strlen: strlen,
	subscribe: subscribe,
	substr: substr,
	sunion: sunion,
	sunionstore: sunionstore,
	swapdb: swapdb,
	sync: sync,
	time: time,
	touch: touch,
	ttl: ttl,
	type: type,
	unlink: unlink,
	unsubscribe: unsubscribe,
	unwatch: unwatch,
	wait: wait,
	watch: watch,
	xack: xack,
	xadd: xadd,
	xclaim: xclaim,
	xdel: xdel,
	xgroup: xgroup,
	xinfo: xinfo,
	xlen: xlen,
	xpending: xpending,
	xrange: xrange,
	xread: xread,
	xreadgroup: xreadgroup,
	xrevrange: xrevrange,
	xsetid: xsetid,
	xtrim: xtrim,
	zadd: zadd,
	zcard: zcard,
	zcount: zcount,
	zincrby: zincrby,
	zinterstore: zinterstore,
	zlexcount: zlexcount,
	zpopmax: zpopmax,
	zpopmin: zpopmin,
	zrange: zrange,
	zrangebylex: zrangebylex,
	zrangebyscore: zrangebyscore,
	zrank: zrank,
	zrem: zrem,
	zremrangebylex: zremrangebylex,
	zremrangebyrank: zremrangebyrank,
	zremrangebyscore: zremrangebyscore,
	zrevrange: zrevrange,
	zrevrangebylex: zrevrangebylex,
	zrevrangebyscore: zrevrangebyscore,
	zrevrank: zrevrank,
	zscan: zscan,
	zscore: zscore,
	zunionstore: zunionstore,
	'default': commands
});

var commands$2 = getCjsExportFromNamespace(commands$1);

var redisCommands = createCommonjsModule(function (module, exports) {



/**
 * Redis command list
 *
 * All commands are lowercased.
 *
 * @var {string[]}
 * @public
 */
exports.list = Object.keys(commands$2);

var flags = {};
exports.list.forEach(function (commandName) {
  flags[commandName] = commands$2[commandName].flags.reduce(function (flags, flag) {
    flags[flag] = true;
    return flags
  }, {});
});
/**
 * Check if the command exists
 *
 * @param {string} commandName - the command name
 * @return {boolean} result
 * @public
 */
exports.exists = function (commandName) {
  return Boolean(commands$2[commandName])
};

/**
 * Check if the command has the flag
 *
 * Some of possible flags: readonly, noscript, loading
 * @param {string} commandName - the command name
 * @param {string} flag - the flag to check
 * @return {boolean} result
 * @public
 */
exports.hasFlag = function (commandName, flag) {
  if (!flags[commandName]) {
    throw new Error('Unknown command ' + commandName)
  }

  return Boolean(flags[commandName][flag])
};

/**
 * Get indexes of keys in the command arguments
 *
 * @param {string} commandName - the command name
 * @param {string[]} args - the arguments of the command
 * @param {object} [options] - options
 * @param {boolean} [options.parseExternalKey] - parse external keys
 * @return {number[]} - the list of the index
 * @public
 *
 * @example
 * ```javascript
 * getKeyIndexes('set', ['key', 'value']) // [0]
 * getKeyIndexes('mget', ['key1', 'key2']) // [0, 1]
 * ```
 */
exports.getKeyIndexes = function (commandName, args, options) {
  var command = commands$2[commandName];
  if (!command) {
    throw new Error('Unknown command ' + commandName)
  }

  if (!Array.isArray(args)) {
    throw new Error('Expect args to be an array')
  }

  var keys = [];
  var i, keyStart, keyStop, parseExternalKey;
  switch (commandName) {
    case 'zunionstore':
    case 'zinterstore':
      keys.push(0);
    // fall through
    case 'eval':
    case 'evalsha':
      keyStop = Number(args[1]) + 2;
      for (i = 2; i < keyStop; i++) {
        keys.push(i);
      }
      break
    case 'sort':
      parseExternalKey = options && options.parseExternalKey;
      keys.push(0);
      for (i = 1; i < args.length - 1; i++) {
        if (typeof args[i] !== 'string') {
          continue
        }
        var directive = args[i].toUpperCase();
        if (directive === 'GET') {
          i += 1;
          if (args[i] !== '#') {
            if (parseExternalKey) {
              keys.push([i, getExternalKeyNameLength(args[i])]);
            } else {
              keys.push(i);
            }
          }
        } else if (directive === 'BY') {
          i += 1;
          if (parseExternalKey) {
            keys.push([i, getExternalKeyNameLength(args[i])]);
          } else {
            keys.push(i);
          }
        } else if (directive === 'STORE') {
          i += 1;
          keys.push(i);
        }
      }
      break
    case 'migrate':
      if (args[2] === '') {
        for (i = 5; i < args.length - 1; i++) {
          if (args[i].toUpperCase() === 'KEYS') {
            for (var j = i + 1; j < args.length; j++) {
              keys.push(j);
            }
            break
          }
        }
      } else {
        keys.push(2);
      }
      break
    case 'xreadgroup':
    case 'xread':
      // Keys are 1st half of the args after STREAMS argument.
      for (i = commandName === 'xread' ? 0 : 3; i < args.length - 1; i++) {
        if (String(args[i]).toUpperCase() === 'STREAMS') {
          for (j = i + 1; j <= i + ((args.length - 1 - i) / 2); j++) {
            keys.push(j);
          }
          break
        }
      }
      break
    default:
      // Step has to be at least one in this case, otherwise the command does
      // not contain a key.
      if (command.step > 0) {
        keyStart = command.keyStart - 1;
        keyStop = command.keyStop > 0 ? command.keyStop : args.length + command.keyStop + 1;
        for (i = keyStart; i < keyStop; i += command.step) {
          keys.push(i);
        }
      }
      break
  }

  return keys
};

function getExternalKeyNameLength (key) {
  if (typeof key !== 'string') {
    key = String(key);
  }
  var hashPos = key.indexOf('->');
  return hashPos === -1 ? key.length : hashPos
}
});

function debug$1 () {
    if (redis.debug_mode) {
        var data = Array.prototype.slice.call(arguments);
        data.unshift(new Date().toISOString());
        console.error.apply(null, data);
    }
}

var debug_1 = debug$1;

var createClient = function createClient (port_arg, host_arg, options) {

    if (typeof port_arg === 'number' || typeof port_arg === 'string' && /^\d+$/.test(port_arg)) {

        var host;
        if (typeof host_arg === 'string') {
            host = host_arg;
        } else {
            if (options && host_arg) {
                throw new TypeError('Unknown type of connection in createClient()');
            }
            options = options || host_arg;
        }
        options = utils.clone(options);
        options.host = host || options.host;
        options.port = port_arg;

    } else if (typeof port_arg === 'string' || port_arg && port_arg.url) {

        options = utils.clone(port_arg.url ? port_arg : host_arg || options);
        var url$1 = port_arg.url || port_arg;
        var parsed = url.parse(url$1, true, true);

        // [redis:]//[[user][:password]@][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]]
        if (parsed.slashes) { // We require slashes
            if (parsed.auth) {
                options.password = parsed.auth.slice(parsed.auth.indexOf(':') + 1);
            }
            if (parsed.protocol) {
                if (parsed.protocol === 'rediss:') {
                    options.tls = options.tls || {};
                } else if (parsed.protocol !== 'redis:') {
                    console.warn('node_redis: WARNING: You passed "' + parsed.protocol.substring(0, parsed.protocol.length - 1) + '" as protocol instead of the "redis" protocol!');
                }
            }
            if (parsed.pathname && parsed.pathname !== '/') {
                options.db = parsed.pathname.substr(1);
            }
            if (parsed.hostname) {
                options.host = parsed.hostname;
            }
            if (parsed.port) {
                options.port = parsed.port;
            }
            if (parsed.search !== '') {
                var elem;
                for (elem in parsed.query) {
                    // If options are passed twice, only the parsed options will be used
                    if (elem in options) {
                        if (options[elem] === parsed.query[elem]) {
                            console.warn('node_redis: WARNING: You passed the ' + elem + ' option twice!');
                        } else {
                            throw new RangeError('The ' + elem + ' option is added twice and does not match');
                        }
                    }
                    options[elem] = parsed.query[elem];
                }
            }
        } else if (parsed.hostname) {
            throw new RangeError('The redis url must begin with slashes "//" or contain slashes after the redis protocol');
        } else {
            options.path = url$1;
        }

    } else if (typeof port_arg === 'object' || port_arg === undefined) {
        options = utils.clone(port_arg || options);
        options.host = options.host || host_arg;

        if (port_arg && arguments.length !== 1) {
            throw new TypeError('Too many arguments passed to createClient. Please only pass the options object');
        }
    }

    if (!options) {
        throw new TypeError('Unknown type of connection in createClient()');
    }

    return options;
};

function Multi (client, args) {
    this._client = client;
    this.queue = new denque();
    var command, tmp_args;
    if (args) { // Either undefined or an array. Fail hard if it's not an array
        for (var i = 0; i < args.length; i++) {
            command = args[i][0];
            tmp_args = args[i].slice(1);
            if (Array.isArray(command)) {
                this[command[0]].apply(this, command.slice(1).concat(tmp_args));
            } else {
                this[command].apply(this, tmp_args);
            }
        }
    }
}

function pipeline_transaction_command (self, command_obj, index) {
    // Queueing is done first, then the commands are executed
    var tmp = command_obj.callback;
    command_obj.callback = function (err, reply) {
        // Ignore the multi command. This is applied by node_redis and the user does not benefit by it
        if (err && index !== -1) {
            if (tmp) {
                tmp(err);
            }
            err.position = index;
            self.errors.push(err);
        }
        // Keep track of who wants buffer responses:
        // By the time the callback is called the command_obj got the buffer_args attribute attached
        self.wants_buffers[index] = command_obj.buffer_args;
        command_obj.callback = tmp;
    };
    self._client.internal_send_command(command_obj);
}

Multi.prototype.exec_atomic = Multi.prototype.EXEC_ATOMIC = Multi.prototype.execAtomic = function exec_atomic (callback) {
    if (this.queue.length < 2) {
        return this.exec_batch(callback);
    }
    return this.exec(callback);
};

function multi_callback (self, err, replies) {
    var i = 0, command_obj;

    if (err) {
        err.errors = self.errors;
        if (self.callback) {
            self.callback(err);
            // Exclude connection errors so that those errors won't be emitted twice
        } else if (err.code !== 'CONNECTION_BROKEN') {
            self._client.emit('error', err);
        }
        return;
    }

    if (replies) {
        while (command_obj = self.queue.shift()) {
            if (replies[i] instanceof Error) {
                var match = replies[i].message.match(utils.err_code);
                // LUA script could return user errors that don't behave like all other errors!
                if (match) {
                    replies[i].code = match[1];
                }
                replies[i].command = command_obj.command.toUpperCase();
                if (typeof command_obj.callback === 'function') {
                    command_obj.callback(replies[i]);
                }
            } else {
                // If we asked for strings, even in detect_buffers mode, then return strings:
                replies[i] = self._client.handle_reply(replies[i], command_obj.command, self.wants_buffers[i]);
                if (typeof command_obj.callback === 'function') {
                    command_obj.callback(null, replies[i]);
                }
            }
            i++;
        }
    }

    if (self.callback) {
        self.callback(null, replies);
    }
}

Multi.prototype.exec_transaction = function exec_transaction (callback) {
    if (this.monitoring || this._client.monitoring) {
        var err = new RangeError(
            'Using transaction with a client that is in monitor mode does not work due to faulty return values of Redis.'
        );
        err.command = 'EXEC';
        err.code = 'EXECABORT';
        return utils.reply_in_order(this._client, callback, err);
    }
    var self = this;
    var len = self.queue.length;
    self.errors = [];
    self.callback = callback;
    self._client.cork();
    self.wants_buffers = new Array(len);
    pipeline_transaction_command(self, new command('multi', []), -1);
    // Drain queue, callback will catch 'QUEUED' or error
    for (var index = 0; index < len; index++) {
        // The commands may not be shifted off, since they are needed in the result handler
        pipeline_transaction_command(self, self.queue.get(index), index);
    }

    self._client.internal_send_command(new command('exec', [], function (err, replies) {
        multi_callback(self, err, replies);
    }));
    self._client.uncork();
    return !self._client.should_buffer;
};

function batch_callback (self, cb, i) {
    return function batch_callback (err, res) {
        if (err) {
            self.results[i] = err;
            // Add the position to the error
            self.results[i].position = i;
        } else {
            self.results[i] = res;
        }
        cb(err, res);
    };
}

Multi.prototype.exec = Multi.prototype.EXEC = Multi.prototype.exec_batch = function exec_batch (callback) {
    var self = this;
    var len = self.queue.length;
    var index = 0;
    var command_obj;
    if (len === 0) {
        utils.reply_in_order(self._client, callback, null, []);
        return !self._client.should_buffer;
    }
    self._client.cork();
    if (!callback) {
        while (command_obj = self.queue.shift()) {
            self._client.internal_send_command(command_obj);
        }
        self._client.uncork();
        return !self._client.should_buffer;
    }
    var callback_without_own_cb = function (err, res) {
        if (err) {
            self.results.push(err);
            // Add the position to the error
            var i = self.results.length - 1;
            self.results[i].position = i;
        } else {
            self.results.push(res);
        }
        // Do not emit an error here. Otherwise each error would result in one emit.
        // The errors will be returned in the result anyway
    };
    var last_callback = function (cb) {
        return function (err, res) {
            cb(err, res);
            callback(null, self.results);
        };
    };
    self.results = [];
    while (command_obj = self.queue.shift()) {
        if (typeof command_obj.callback === 'function') {
            command_obj.callback = batch_callback(self, command_obj.callback, index);
        } else {
            command_obj.callback = callback_without_own_cb;
        }
        if (typeof callback === 'function' && index === len - 1) {
            command_obj.callback = last_callback(command_obj.callback);
        }
        this._client.internal_send_command(command_obj);
        index++;
    }
    self._client.uncork();
    return !self._client.should_buffer;
};

var multi$1 = Multi;

var no_password_is_set = /no password is set/;
var loading = /LOADING/;
var RedisClient = redis.RedisClient;

/********************************************************************************************
 Replace built-in redis functions

 The callback may be hooked as needed. The same does not apply to the rest of the function.
 State should not be set outside of the callback if not absolutly necessary.
 This is important to make sure it works the same as single command or in a multi context.
 To make sure everything works with the offline queue use the "call_on_write" function.
 This is going to be executed while writing to the stream.

 TODO: Implement individal command generation as soon as possible to prevent divergent code
 on single and multi calls!
********************************************************************************************/

RedisClient.prototype.multi = RedisClient.prototype.MULTI = function multi (args) {
    var multi = new multi$1(this, args);
    multi.exec = multi.EXEC = multi.exec_transaction;
    return multi;
};

// ATTENTION: This is not a native function but is still handled as a individual command as it behaves just the same as multi
RedisClient.prototype.batch = RedisClient.prototype.BATCH = function batch (args) {
    return new multi$1(this, args);
};

function select_callback (self, db, callback) {
    return function (err, res) {
        if (err === null) {
            // Store db in this.select_db to restore it on reconnect
            self.selected_db = db;
        }
        utils.callback_or_emit(self, callback, err, res);
    };
}

RedisClient.prototype.select = RedisClient.prototype.SELECT = function select (db, callback) {
    return this.internal_send_command(new command('select', [db], select_callback(this, db, callback)));
};

multi$1.prototype.select = multi$1.prototype.SELECT = function select (db, callback) {
    this.queue.push(new command('select', [db], select_callback(this._client, db, callback)));
    return this;
};

RedisClient.prototype.monitor = RedisClient.prototype.MONITOR = function monitor (callback) {
    // Use a individual command, as this is a special case that does not has to be checked for any other command
    var self = this;
    var call_on_write = function () {
        // Activating monitor mode has to happen before Redis returned the callback. The monitor result is returned first.
        // Therefore we expect the command to be properly processed. If this is not the case, it's not an issue either.
        self.monitoring = true;
    };
    return this.internal_send_command(new command('monitor', [], callback, call_on_write));
};

// Only works with batch, not in a transaction
multi$1.prototype.monitor = multi$1.prototype.MONITOR = function monitor (callback) {
    // Use a individual command, as this is a special case that does not has to be checked for any other command
    if (this.exec !== this.exec_transaction) {
        var self = this;
        var call_on_write = function () {
            self._client.monitoring = true;
        };
        this.queue.push(new command('monitor', [], callback, call_on_write));
        return this;
    }
    // Set multi monitoring to indicate the exec that it should abort
    // Remove this "hack" as soon as Redis might fix this
    this.monitoring = true;
    return this;
};

function quit_callback (self, callback) {
    return function (err, res) {
        if (err && err.code === 'NR_CLOSED') {
            // Pretent the quit command worked properly in this case.
            // Either the quit landed in the offline queue and was flushed at the reconnect
            // or the offline queue is deactivated and the command was rejected right away
            // or the stream is not writable
            // or while sending the quit, the connection ended / closed
            err = null;
            res = 'OK';
        }
        utils.callback_or_emit(self, callback, err, res);
        if (self.stream.writable) {
            // If the socket is still alive, kill it. This could happen if quit got a NR_CLOSED error code
            self.stream.destroy();
        }
    };
}

RedisClient.prototype.QUIT = RedisClient.prototype.quit = function quit (callback) {
    // TODO: Consider this for v.3
    // Allow the quit command to be fired as soon as possible to prevent it landing in the offline queue.
    // this.ready = this.offline_queue.length === 0;
    var backpressure_indicator = this.internal_send_command(new command('quit', [], quit_callback(this, callback)));
    // Calling quit should always end the connection, no matter if there's a connection or not
    this.closing = true;
    this.ready = false;
    return backpressure_indicator;
};

// Only works with batch, not in a transaction
multi$1.prototype.QUIT = multi$1.prototype.quit = function quit (callback) {
    var self = this._client;
    var call_on_write = function () {
        // If called in a multi context, we expect redis is available
        self.closing = true;
        self.ready = false;
    };
    this.queue.push(new command('quit', [], quit_callback(self, callback), call_on_write));
    return this;
};

function info_callback (self, callback) {
    return function (err, res) {
        if (res) {
            var obj = {};
            var lines = res.toString().split('\r\n');
            var line, parts, sub_parts;

            for (var i = 0; i < lines.length; i++) {
                parts = lines[i].split(':');
                if (parts[1]) {
                    if (parts[0].indexOf('db') === 0) {
                        sub_parts = parts[1].split(',');
                        obj[parts[0]] = {};
                        while (line = sub_parts.pop()) {
                            line = line.split('=');
                            obj[parts[0]][line[0]] = +line[1];
                        }
                    } else {
                        obj[parts[0]] = parts[1];
                    }
                }
            }
            obj.versions = [];
            if (obj.redis_version) {
                obj.redis_version.split('.').forEach(function (num) {
                    obj.versions.push(+num);
                });
            }
            // Expose info key/vals to users
            self.server_info = obj;
        } else {
            self.server_info = {};
        }
        utils.callback_or_emit(self, callback, err, res);
    };
}

// Store info in this.server_info after each call
RedisClient.prototype.info = RedisClient.prototype.INFO = function info (section, callback) {
    var args = [];
    if (typeof section === 'function') {
        callback = section;
    } else if (section !== undefined) {
        args = Array.isArray(section) ? section : [section];
    }
    return this.internal_send_command(new command('info', args, info_callback(this, callback)));
};

multi$1.prototype.info = multi$1.prototype.INFO = function info (section, callback) {
    var args = [];
    if (typeof section === 'function') {
        callback = section;
    } else if (section !== undefined) {
        args = Array.isArray(section) ? section : [section];
    }
    this.queue.push(new command('info', args, info_callback(this._client, callback)));
    return this;
};

function auth_callback (self, pass, callback) {
    return function (err, res) {
        if (err) {
            if (no_password_is_set.test(err.message)) {
                self.warn('Warning: Redis server does not require a password, but a password was supplied.');
                err = null;
                res = 'OK';
            } else if (loading.test(err.message)) {
                // If redis is still loading the db, it will not authenticate and everything else will fail
                debug_1('Redis still loading, trying to authenticate later');
                setTimeout(function () {
                    self.auth(pass, callback);
                }, 100);
                return;
            }
        }
        utils.callback_or_emit(self, callback, err, res);
    };
}

RedisClient.prototype.auth = RedisClient.prototype.AUTH = function auth (pass, callback) {
    debug_1('Sending auth to ' + this.address + ' id ' + this.connection_id);

    // Stash auth for connect and reconnect.
    this.auth_pass = pass;
    var ready = this.ready;
    this.ready = ready || this.offline_queue.length === 0;
    var tmp = this.internal_send_command(new command('auth', [pass], auth_callback(this, pass, callback)));
    this.ready = ready;
    return tmp;
};

// Only works with batch, not in a transaction
multi$1.prototype.auth = multi$1.prototype.AUTH = function auth (pass, callback) {
    debug_1('Sending auth to ' + this.address + ' id ' + this.connection_id);

    // Stash auth for connect and reconnect.
    this.auth_pass = pass;
    this.queue.push(new command('auth', [pass], auth_callback(this._client, callback)));
    return this;
};

RedisClient.prototype.client = RedisClient.prototype.CLIENT = function client () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0];
        callback = arguments[1];
    } else if (Array.isArray(arguments[1])) {
        if (len === 3) {
            callback = arguments[2];
        }
        len = arguments[1].length;
        arr = new Array(len + 1);
        arr[0] = arguments[0];
        for (; i < len; i += 1) {
            arr[i + 1] = arguments[1][i];
        }
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this;
    var call_on_write = undefined;
    // CLIENT REPLY ON|OFF|SKIP
    /* istanbul ignore next: TODO: Remove this as soon as Travis runs Redis 3.2 */
    if (arr.length === 2 && arr[0].toString().toUpperCase() === 'REPLY') {
        var reply_on_off = arr[1].toString().toUpperCase();
        if (reply_on_off === 'ON' || reply_on_off === 'OFF' || reply_on_off === 'SKIP') {
            call_on_write = function () {
                self.reply = reply_on_off;
            };
        }
    }
    return this.internal_send_command(new command('client', arr, callback, call_on_write));
};

multi$1.prototype.client = multi$1.prototype.CLIENT = function client () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0];
        callback = arguments[1];
    } else if (Array.isArray(arguments[1])) {
        if (len === 3) {
            callback = arguments[2];
        }
        len = arguments[1].length;
        arr = new Array(len + 1);
        arr[0] = arguments[0];
        for (; i < len; i += 1) {
            arr[i + 1] = arguments[1][i];
        }
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this._client;
    var call_on_write = undefined;
    // CLIENT REPLY ON|OFF|SKIP
    /* istanbul ignore next: TODO: Remove this as soon as Travis runs Redis 3.2 */
    if (arr.length === 2 && arr[0].toString().toUpperCase() === 'REPLY') {
        var reply_on_off = arr[1].toString().toUpperCase();
        if (reply_on_off === 'ON' || reply_on_off === 'OFF' || reply_on_off === 'SKIP') {
            call_on_write = function () {
                self.reply = reply_on_off;
            };
        }
    }
    this.queue.push(new command('client', arr, callback, call_on_write));
    return this;
};

RedisClient.prototype.hmset = RedisClient.prototype.HMSET = function hmset () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0];
        callback = arguments[1];
    } else if (Array.isArray(arguments[1])) {
        if (len === 3) {
            callback = arguments[2];
        }
        len = arguments[1].length;
        arr = new Array(len + 1);
        arr[0] = arguments[0];
        for (; i < len; i += 1) {
            arr[i + 1] = arguments[1][i];
        }
    } else if (typeof arguments[1] === 'object' && (arguments.length === 2 || arguments.length === 3 && (typeof arguments[2] === 'function' || typeof arguments[2] === 'undefined'))) {
        arr = [arguments[0]];
        for (var field in arguments[1]) {
            arr.push(field, arguments[1][field]);
        }
        callback = arguments[2];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    return this.internal_send_command(new command('hmset', arr, callback));
};

multi$1.prototype.hmset = multi$1.prototype.HMSET = function hmset () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0];
        callback = arguments[1];
    } else if (Array.isArray(arguments[1])) {
        if (len === 3) {
            callback = arguments[2];
        }
        len = arguments[1].length;
        arr = new Array(len + 1);
        arr[0] = arguments[0];
        for (; i < len; i += 1) {
            arr[i + 1] = arguments[1][i];
        }
    } else if (typeof arguments[1] === 'object' && (arguments.length === 2 || arguments.length === 3 && (typeof arguments[2] === 'function' || typeof arguments[2] === 'undefined'))) {
        arr = [arguments[0]];
        for (var field in arguments[1]) {
            arr.push(field, arguments[1][field]);
        }
        callback = arguments[2];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    this.queue.push(new command('hmset', arr, callback));
    return this;
};

RedisClient.prototype.subscribe = RedisClient.prototype.SUBSCRIBE = function subscribe () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0].slice(0);
        callback = arguments[1];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this;
    var call_on_write = function () {
        self.pub_sub_mode = self.pub_sub_mode || self.command_queue.length + 1;
    };
    return this.internal_send_command(new command('subscribe', arr, callback, call_on_write));
};

multi$1.prototype.subscribe = multi$1.prototype.SUBSCRIBE = function subscribe () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0].slice(0);
        callback = arguments[1];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this._client;
    var call_on_write = function () {
        self.pub_sub_mode = self.pub_sub_mode || self.command_queue.length + 1;
    };
    this.queue.push(new command('subscribe', arr, callback, call_on_write));
    return this;
};

RedisClient.prototype.unsubscribe = RedisClient.prototype.UNSUBSCRIBE = function unsubscribe () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0].slice(0);
        callback = arguments[1];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this;
    var call_on_write = function () {
        // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
        self.pub_sub_mode = self.pub_sub_mode || self.command_queue.length + 1;
    };
    return this.internal_send_command(new command('unsubscribe', arr, callback, call_on_write));
};

multi$1.prototype.unsubscribe = multi$1.prototype.UNSUBSCRIBE = function unsubscribe () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0].slice(0);
        callback = arguments[1];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this._client;
    var call_on_write = function () {
        // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
        self.pub_sub_mode = self.pub_sub_mode || self.command_queue.length + 1;
    };
    this.queue.push(new command('unsubscribe', arr, callback, call_on_write));
    return this;
};

RedisClient.prototype.psubscribe = RedisClient.prototype.PSUBSCRIBE = function psubscribe () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0].slice(0);
        callback = arguments[1];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this;
    var call_on_write = function () {
        self.pub_sub_mode = self.pub_sub_mode || self.command_queue.length + 1;
    };
    return this.internal_send_command(new command('psubscribe', arr, callback, call_on_write));
};

multi$1.prototype.psubscribe = multi$1.prototype.PSUBSCRIBE = function psubscribe () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0].slice(0);
        callback = arguments[1];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this._client;
    var call_on_write = function () {
        self.pub_sub_mode = self.pub_sub_mode || self.command_queue.length + 1;
    };
    this.queue.push(new command('psubscribe', arr, callback, call_on_write));
    return this;
};

RedisClient.prototype.punsubscribe = RedisClient.prototype.PUNSUBSCRIBE = function punsubscribe () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0].slice(0);
        callback = arguments[1];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this;
    var call_on_write = function () {
        // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
        self.pub_sub_mode = self.pub_sub_mode || self.command_queue.length + 1;
    };
    return this.internal_send_command(new command('punsubscribe', arr, callback, call_on_write));
};

multi$1.prototype.punsubscribe = multi$1.prototype.PUNSUBSCRIBE = function punsubscribe () {
    var arr,
        len = arguments.length,
        callback,
        i = 0;
    if (Array.isArray(arguments[0])) {
        arr = arguments[0].slice(0);
        callback = arguments[1];
    } else {
        len = arguments.length;
        // The later should not be the average use case
        if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
            len--;
            callback = arguments[len];
        }
        arr = new Array(len);
        for (; i < len; i += 1) {
            arr[i] = arguments[i];
        }
    }
    var self = this._client;
    var call_on_write = function () {
        // Pub sub has to be activated even if not in pub sub mode, as the return value is manipulated in the callback
        self.pub_sub_mode = self.pub_sub_mode || self.command_queue.length + 1;
    };
    this.queue.push(new command('punsubscribe', arr, callback, call_on_write));
    return this;
};

var RedisClient$1 = redis.RedisClient;

var noop = function () {};

/**********************************************
All documented and exposed API belongs in here
**********************************************/

// Redirect calls to the appropriate function and use to send arbitrary / not supported commands
RedisClient$1.prototype.send_command = RedisClient$1.prototype.sendCommand = function (command$1, args, callback) {
    // Throw to fail early instead of relying in order in this case
    if (typeof command$1 !== 'string') {
        throw new TypeError('Wrong input type "' + (command$1 !== null && command$1 !== undefined ? command$1.constructor.name : command$1) + '" for command name');
    }
    command$1 = command$1.toLowerCase();
    if (!Array.isArray(args)) {
        if (args === undefined || args === null) {
            args = [];
        } else if (typeof args === 'function' && callback === undefined) {
            callback = args;
            args = [];
        } else {
            throw new TypeError('Wrong input type "' + args.constructor.name + '" for args');
        }
    }
    if (typeof callback !== 'function' && callback !== undefined) {
        throw new TypeError('Wrong input type "' + (callback !== null ? callback.constructor.name : 'null') + '" for callback function');
    }

    // Using the raw multi command is only possible with this function
    // If the command is not yet added to the client, the internal function should be called right away
    // Otherwise we need to redirect the calls to make sure the internal functions don't get skipped
    // The internal functions could actually be used for any non hooked function
    // but this might change from time to time and at the moment there's no good way to distinguish them
    // from each other, so let's just do it do it this way for the time being
    if (command$1 === 'multi' || typeof this[command$1] !== 'function') {
        return this.internal_send_command(new command(command$1, args, callback));
    }
    if (typeof callback === 'function') {
        args = args.concat([callback]); // Prevent manipulating the input array
    }
    return this[command$1].apply(this, args);
};

RedisClient$1.prototype.end = function (flush) {
    // Flush queue if wanted
    if (flush) {
        this.flush_and_error({
            message: 'Connection forcefully ended and command aborted.',
            code: 'NR_CLOSED'
        });
    } else if (arguments.length === 0) {
        this.warn(
            'Using .end() without the flush parameter is deprecated and throws from v.3.0.0 on.\n' +
            'Please check the doku (https://github.com/NodeRedis/node_redis) and explictly use flush.'
        );
    }
    // Clear retry_timer
    if (this.retry_timer) {
        clearTimeout(this.retry_timer);
        this.retry_timer = null;
    }
    this.stream.removeAllListeners();
    this.stream.on('error', noop);
    this.connected = false;
    this.ready = false;
    this.closing = true;
    return this.stream.destroySoon();
};

RedisClient$1.prototype.unref = function () {
    if (this.connected) {
        debug_1("Unref'ing the socket connection");
        this.stream.unref();
    } else {
        debug_1('Not connected yet, will unref later');
        this.once('connect', function () {
            this.unref();
        });
    }
};

RedisClient$1.prototype.duplicate = function (options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }
    var existing_options = utils.clone(this.options);
    options = utils.clone(options);
    for (var elem in options) {
        existing_options[elem] = options[elem];
    }
    var client = new RedisClient$1(existing_options);
    client.selected_db = options.db || this.selected_db;
    if (typeof callback === 'function') {
        var ready_listener = function () {
            callback(null, client);
            client.removeAllListeners(error_listener);
        };
        var error_listener = function (err) {
            callback(err);
            client.end(true);
        };
        client.once('ready', ready_listener);
        client.once('error', error_listener);
        return;
    }
    return client;
};

var RedisClient$2 = redis.RedisClient;


var addCommand = function (command$1) {
    // Some rare Redis commands use special characters in their command name
    // Convert those to a underscore to prevent using invalid function names
    var commandName = command$1.replace(/(?:^([0-9])|[^a-zA-Z0-9_$])/g, '_$1');

    // Do not override existing functions
    if (!RedisClient$2.prototype[command$1]) {
        RedisClient$2.prototype[command$1.toUpperCase()] = RedisClient$2.prototype[command$1] = function () {
            var arr;
            var len = arguments.length;
            var callback;
            var i = 0;
            if (Array.isArray(arguments[0])) {
                arr = arguments[0];
                if (len === 2) {
                    callback = arguments[1];
                }
            } else if (len > 1 && Array.isArray(arguments[1])) {
                if (len === 3) {
                    callback = arguments[2];
                }
                len = arguments[1].length;
                arr = new Array(len + 1);
                arr[0] = arguments[0];
                for (; i < len; i += 1) {
                    arr[i + 1] = arguments[1][i];
                }
            } else {
                // The later should not be the average use case
                if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
                    len--;
                    callback = arguments[len];
                }
                arr = new Array(len);
                for (; i < len; i += 1) {
                    arr[i] = arguments[i];
                }
            }
            return this.internal_send_command(new command(command$1, arr, callback));
        };
        // Alias special function names (e.g. NR.RUN becomes NR_RUN and nr_run)
        if (commandName !== command$1) {
            RedisClient$2.prototype[commandName.toUpperCase()] = RedisClient$2.prototype[commandName] = RedisClient$2.prototype[command$1];
        }
        Object.defineProperty(RedisClient$2.prototype[command$1], 'name', {
            value: commandName
        });
    }

    // Do not override existing functions
    if (!multi$1.prototype[command$1]) {
        multi$1.prototype[command$1.toUpperCase()] = multi$1.prototype[command$1] = function () {
            var arr;
            var len = arguments.length;
            var callback;
            var i = 0;
            if (Array.isArray(arguments[0])) {
                arr = arguments[0];
                if (len === 2) {
                    callback = arguments[1];
                }
            } else if (len > 1 && Array.isArray(arguments[1])) {
                if (len === 3) {
                    callback = arguments[2];
                }
                len = arguments[1].length;
                arr = new Array(len + 1);
                arr[0] = arguments[0];
                for (; i < len; i += 1) {
                    arr[i + 1] = arguments[1][i];
                }
            } else {
                // The later should not be the average use case
                if (len !== 0 && (typeof arguments[len - 1] === 'function' || typeof arguments[len - 1] === 'undefined')) {
                    len--;
                    callback = arguments[len];
                }
                arr = new Array(len);
                for (; i < len; i += 1) {
                    arr[i] = arguments[i];
                }
            }
            this.queue.push(new command(command$1, arr, callback));
            return this;
        };
        // Alias special function names (e.g. NR.RUN becomes NR_RUN and nr_run)
        if (commandName !== command$1) {
            multi$1.prototype[commandName.toUpperCase()] = multi$1.prototype[commandName] = multi$1.prototype[command$1];
        }
        Object.defineProperty(multi$1.prototype[command$1], 'name', {
            value: commandName
        });
    }
};

redisCommands.list.forEach(addCommand);

var commands_1 = addCommand;

var redis = createCommonjsModule(function (module, exports) {














var SUBSCRIBE_COMMANDS = {
    subscribe: true,
    unsubscribe: true,
    psubscribe: true,
    punsubscribe: true
};

function noop () {}

function handle_detect_buffers_reply (reply, command, buffer_args) {
    if (buffer_args === false || this.message_buffers) {
        // If detect_buffers option was specified, then the reply from the parser will be a buffer.
        // If this command did not use Buffer arguments, then convert the reply to Strings here.
        reply = utils.reply_to_strings(reply);
    }

    if (command === 'hgetall') {
        reply = utils.reply_to_object(reply);
    }
    return reply;
}

exports.debug_mode = /\bredis\b/i.test(process.env.NODE_DEBUG);

// Attention: The second parameter might be removed at will and is not officially supported.
// Do not rely on this
function RedisClient (options, stream) {
    // Copy the options so they are not mutated
    options = utils.clone(options);
    events.call(this);
    var cnx_options = {};
    var self = this;
    /* istanbul ignore next: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
    for (var tls_option in options.tls) {
        cnx_options[tls_option] = options.tls[tls_option];
        // Copy the tls options into the general options to make sure the address is set right
        if (tls_option === 'port' || tls_option === 'host' || tls_option === 'path' || tls_option === 'family') {
            options[tls_option] = options.tls[tls_option];
        }
    }
    if (stream) {
        // The stream from the outside is used so no connection from this side is triggered but from the server this client should talk to
        // Reconnect etc won't work with this. This requires monkey patching to work, so it is not officially supported
        options.stream = stream;
        this.address = '"Private stream"';
    } else if (options.path) {
        cnx_options.path = options.path;
        this.address = options.path;
    } else {
        cnx_options.port = +options.port || 6379;
        cnx_options.host = options.host || '127.0.0.1';
        cnx_options.family = (!options.family && net.isIP(cnx_options.host)) || (options.family === 'IPv6' ? 6 : 4);
        this.address = cnx_options.host + ':' + cnx_options.port;
    }

    this.connection_options = cnx_options;
    this.connection_id = RedisClient.connection_id++;
    this.connected = false;
    this.ready = false;
    if (options.socket_keepalive === undefined) {
        options.socket_keepalive = true;
    }
    if (options.socket_initial_delay === undefined) {
        options.socket_initial_delay = 0;
        // set default to 0, which is aligned to https://nodejs.org/api/net.html#net_socket_setkeepalive_enable_initialdelay
    }
    for (var command in options.rename_commands) {
        options.rename_commands[command.toLowerCase()] = options.rename_commands[command];
    }
    options.return_buffers = !!options.return_buffers;
    options.detect_buffers = !!options.detect_buffers;
    // Override the detect_buffers setting if return_buffers is active and print a warning
    if (options.return_buffers && options.detect_buffers) {
        self.warn('WARNING: You activated return_buffers and detect_buffers at the same time. The return value is always going to be a buffer.');
        options.detect_buffers = false;
    }
    if (options.detect_buffers) {
        // We only need to look at the arguments if we do not know what we have to return
        this.handle_reply = handle_detect_buffers_reply;
    }
    this.should_buffer = false;
    this.command_queue = new denque(); // Holds sent commands to de-pipeline them
    this.offline_queue = new denque(); // Holds commands issued but not able to be sent
    this.pipeline_queue = new denque(); // Holds all pipelined commands
    // ATTENTION: connect_timeout should change in v.3.0 so it does not count towards ending reconnection attempts after x seconds
    // This should be done by the retry_strategy. Instead it should only be the timeout for connecting to redis
    this.connect_timeout = +options.connect_timeout || 3600000; // 60 * 60 * 1000 ms
    this.enable_offline_queue = options.enable_offline_queue === false ? false : true;
    this.initialize_retry_vars();
    this.pub_sub_mode = 0;
    this.subscription_set = {};
    this.monitoring = false;
    this.message_buffers = false;
    this.closing = false;
    this.server_info = {};
    this.auth_pass = options.auth_pass || options.password;
    this.selected_db = options.db; // Save the selected db here, used when reconnecting
    this.fire_strings = true; // Determine if strings or buffers should be written to the stream
    this.pipeline = false;
    this.sub_commands_left = 0;
    this.times_connected = 0;
    this.buffers = options.return_buffers || options.detect_buffers;
    this.options = options;
    this.reply = 'ON'; // Returning replies is the default
    this.create_stream();
    // The listeners will not be attached right away, so let's print the deprecation message while the listener is attached
    this.on('newListener', function (event) {
        if ((event === 'message_buffer' || event === 'pmessage_buffer' || event === 'messageBuffer' || event === 'pmessageBuffer') && !this.buffers && !this.message_buffers) {
            this.reply_parser.optionReturnBuffers = true;
            this.message_buffers = true;
            this.handle_reply = handle_detect_buffers_reply;
        }
    });
}
util.inherits(RedisClient, events);

RedisClient.connection_id = 0;

function create_parser (self) {
    return new redisParser({
        returnReply: function (data) {
            self.return_reply(data);
        },
        returnError: function (err) {
            // Return a ReplyError to indicate Redis returned an error
            self.return_error(err);
        },
        returnFatalError: function (err) {
            // Error out all fired commands. Otherwise they might rely on faulty data. We have to reconnect to get in a working state again
            // Note: the execution order is important. First flush and emit, then create the stream
            err.message += '. Please report this.';
            self.ready = false;
            self.flush_and_error({
                message: 'Fatal error encountered. Command aborted.',
                code: 'NR_FATAL'
            }, {
                error: err,
                queues: ['command_queue']
            });
            self.emit('error', err);
            self.create_stream();
        },
        returnBuffers: self.buffers || self.message_buffers,
        stringNumbers: self.options.string_numbers || false
    });
}

/******************************************************************************

    All functions in here are internal besides the RedisClient constructor
    and the exported functions. Don't rely on them as they will be private
    functions in node_redis v.3

******************************************************************************/

// Attention: the function name "create_stream" should not be changed, as other libraries need this to mock the stream (e.g. fakeredis)
RedisClient.prototype.create_stream = function () {
    var self = this;

    // Init parser
    this.reply_parser = create_parser(this);

    if (this.options.stream) {
        // Only add the listeners once in case of a reconnect try (that won't work)
        if (this.stream) {
            return;
        }
        this.stream = this.options.stream;
    } else {
        // On a reconnect destroy the former stream and retry
        if (this.stream) {
            this.stream.removeAllListeners();
            this.stream.destroy();
        }

        /* istanbul ignore if: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
        if (this.options.tls) {
            this.stream = tls.connect(this.connection_options);
        } else {
            this.stream = net.createConnection(this.connection_options);
        }
    }

    if (this.options.connect_timeout) {
        this.stream.setTimeout(this.connect_timeout, function () {
            // Note: This is only tested if a internet connection is established
            self.retry_totaltime = self.connect_timeout;
            self.connection_gone('timeout');
        });
    }

    /* istanbul ignore next: travis does not work with stunnel atm. Therefore the tls tests are skipped on travis */
    var connect_event = this.options.tls ? 'secureConnect' : 'connect';
    this.stream.once(connect_event, function () {
        this.removeAllListeners('timeout');
        self.times_connected++;
        self.on_connect();
    });

    this.stream.on('data', function (buffer_from_socket) {
        // The buffer_from_socket.toString() has a significant impact on big chunks and therefore this should only be used if necessary
        debug_1('Net read ' + self.address + ' id ' + self.connection_id); // + ': ' + buffer_from_socket.toString());
        self.reply_parser.execute(buffer_from_socket);
    });

    this.stream.on('error', function (err) {
        self.on_error(err);
    });

    this.stream.once('close', function (hadError) {
        self.connection_gone('close');
    });

    this.stream.once('end', function () {
        self.connection_gone('end');
    });

    this.stream.on('drain', function () {
        self.drain();
    });

    this.stream.setNoDelay();

    // Fire the command before redis is connected to be sure it's the first fired command
    if (this.auth_pass !== undefined) {
        this.ready = true;
        // Fail silently as we might not be able to connect
        this.auth(this.auth_pass, function (err) {
            if (err && err.code !== 'UNCERTAIN_STATE') {
                self.emit('error', err);
            }
        });
        this.ready = false;
    }
};

RedisClient.prototype.handle_reply = function (reply, command) {
    if (command === 'hgetall') {
        reply = utils.reply_to_object(reply);
    }
    return reply;
};

RedisClient.prototype.cork = noop;
RedisClient.prototype.uncork = noop;

RedisClient.prototype.initialize_retry_vars = function () {
    this.retry_timer = null;
    this.retry_totaltime = 0;
    this.retry_delay = 200;
    this.retry_backoff = 1.7;
    this.attempts = 1;
};

RedisClient.prototype.warn = function (msg) {
    var self = this;
    // Warn on the next tick. Otherwise no event listener can be added
    // for warnings that are emitted in the redis client constructor
    process.nextTick(function () {
        if (self.listeners('warning').length !== 0) {
            self.emit('warning', msg);
        } else {
            console.warn('node_redis:', msg);
        }
    });
};

// Flush provided queues, erroring any items with a callback first
RedisClient.prototype.flush_and_error = function (error_attributes, options) {
    options = options || {};
    var aggregated_errors = [];
    var queue_names = options.queues || ['command_queue', 'offline_queue']; // Flush the command_queue first to keep the order intakt
    for (var i = 0; i < queue_names.length; i++) {
        // If the command was fired it might have been processed so far
        if (queue_names[i] === 'command_queue') {
            error_attributes.message += ' It might have been processed.';
        } else { // As the command_queue is flushed first, remove this for the offline queue
            error_attributes.message = error_attributes.message.replace(' It might have been processed.', '');
        }
        // Don't flush everything from the queue
        for (var command_obj = this[queue_names[i]].shift(); command_obj; command_obj = this[queue_names[i]].shift()) {
            var err = new customErrors.AbortError(error_attributes);
            if (command_obj.error) {
                err.stack = err.stack + command_obj.error.stack.replace(/^Error.*?\n/, '\n');
            }
            err.command = command_obj.command.toUpperCase();
            if (command_obj.args && command_obj.args.length) {
                err.args = command_obj.args;
            }
            if (options.error) {
                err.origin = options.error;
            }
            if (typeof command_obj.callback === 'function') {
                command_obj.callback(err);
            } else {
                aggregated_errors.push(err);
            }
        }
    }
    // Currently this would be a breaking change, therefore it's only emitted in debug_mode
    if (exports.debug_mode && aggregated_errors.length) {
        var error;
        if (aggregated_errors.length === 1) {
            error = aggregated_errors[0];
        } else {
            error_attributes.message = error_attributes.message.replace('It', 'They').replace(/command/i, '$&s');
            error = new customErrors.AggregateError(error_attributes);
            error.errors = aggregated_errors;
        }
        this.emit('error', error);
    }
};

RedisClient.prototype.on_error = function (err) {
    if (this.closing) {
        return;
    }

    err.message = 'Redis connection to ' + this.address + ' failed - ' + err.message;
    debug_1(err.message);
    this.connected = false;
    this.ready = false;

    // Only emit the error if the retry_strategy option is not set
    if (!this.options.retry_strategy) {
        this.emit('error', err);
    }
    // 'error' events get turned into exceptions if they aren't listened for. If the user handled this error
    // then we should try to reconnect.
    this.connection_gone('error', err);
};

RedisClient.prototype.on_connect = function () {
    debug_1('Stream connected ' + this.address + ' id ' + this.connection_id);

    this.connected = true;
    this.ready = false;
    this.emitted_end = false;
    this.stream.setKeepAlive(this.options.socket_keepalive, this.options.socket_initial_delay);
    this.stream.setTimeout(0);

    this.emit('connect');
    this.initialize_retry_vars();

    if (this.options.no_ready_check) {
        this.on_ready();
    } else {
        this.ready_check();
    }
};

RedisClient.prototype.on_ready = function () {
    var self = this;

    debug_1('on_ready called ' + this.address + ' id ' + this.connection_id);
    this.ready = true;

    this.cork = function () {
        self.pipeline = true;
        if (self.stream.cork) {
            self.stream.cork();
        }
    };
    this.uncork = function () {
        if (self.fire_strings) {
            self.write_strings();
        } else {
            self.write_buffers();
        }
        self.pipeline = false;
        self.fire_strings = true;
        if (self.stream.uncork) {
            // TODO: Consider using next tick here. See https://github.com/NodeRedis/node_redis/issues/1033
            self.stream.uncork();
        }
    };

    // Restore modal commands from previous connection. The order of the commands is important
    if (this.selected_db !== undefined) {
        this.internal_send_command(new command('select', [this.selected_db]));
    }
    if (this.monitoring) { // Monitor has to be fired before pub sub commands
        this.internal_send_command(new command('monitor', []));
    }
    var callback_count = Object.keys(this.subscription_set).length;
    if (!this.options.disable_resubscribing && callback_count) {
        // only emit 'ready' when all subscriptions were made again
        // TODO: Remove the countdown for ready here. This is not coherent with all other modes and should therefore not be handled special
        // We know we are ready as soon as all commands were fired
        var callback = function () {
            callback_count--;
            if (callback_count === 0) {
                self.emit('ready');
            }
        };
        debug_1('Sending pub/sub on_ready commands');
        for (var key in this.subscription_set) {
            var command$1 = key.slice(0, key.indexOf('_'));
            var args = this.subscription_set[key];
            this[command$1]([args], callback);
        }
        this.send_offline_queue();
        return;
    }
    this.send_offline_queue();
    this.emit('ready');
};

RedisClient.prototype.on_info_cmd = function (err, res) {
    if (err) {
        if (err.message === "ERR unknown command 'info'") {
            this.on_ready();
            return;
        }
        err.message = 'Ready check failed: ' + err.message;
        this.emit('error', err);
        return;
    }

    /* istanbul ignore if: some servers might not respond with any info data. This is just a safety check that is difficult to test */
    if (!res) {
        debug_1('The info command returned without any data.');
        this.on_ready();
        return;
    }

    if (!this.server_info.loading || this.server_info.loading === '0') {
        // If the master_link_status exists but the link is not up, try again after 50 ms
        if (this.server_info.master_link_status && this.server_info.master_link_status !== 'up') {
            this.server_info.loading_eta_seconds = 0.05;
        } else {
            // Eta loading should change
            debug_1('Redis server ready.');
            this.on_ready();
            return;
        }
    }

    var retry_time = +this.server_info.loading_eta_seconds * 1000;
    if (retry_time > 1000) {
        retry_time = 1000;
    }
    debug_1('Redis server still loading, trying again in ' + retry_time);
    setTimeout(function (self) {
        self.ready_check();
    }, retry_time, this);
};

RedisClient.prototype.ready_check = function () {
    var self = this;
    debug_1('Checking server ready state...');
    // Always fire this info command as first command even if other commands are already queued up
    this.ready = true;
    this.info(function (err, res) {
        self.on_info_cmd(err, res);
    });
    this.ready = false;
};

RedisClient.prototype.send_offline_queue = function () {
    for (var command_obj = this.offline_queue.shift(); command_obj; command_obj = this.offline_queue.shift()) {
        debug_1('Sending offline command: ' + command_obj.command);
        this.internal_send_command(command_obj);
    }
    this.drain();
};

var retry_connection = function (self, error) {
    debug_1('Retrying connection...');

    var reconnect_params = {
        delay: self.retry_delay,
        attempt: self.attempts,
        error: error
    };
    if (self.options.camel_case) {
        reconnect_params.totalRetryTime = self.retry_totaltime;
        reconnect_params.timesConnected = self.times_connected;
    } else {
        reconnect_params.total_retry_time = self.retry_totaltime;
        reconnect_params.times_connected = self.times_connected;
    }
    self.emit('reconnecting', reconnect_params);

    self.retry_totaltime += self.retry_delay;
    self.attempts += 1;
    self.retry_delay = Math.round(self.retry_delay * self.retry_backoff);
    self.create_stream();
    self.retry_timer = null;
};

RedisClient.prototype.connection_gone = function (why, error) {
    // If a retry is already in progress, just let that happen
    if (this.retry_timer) {
        return;
    }
    error = error || null;

    debug_1('Redis connection is gone from ' + why + ' event.');
    this.connected = false;
    this.ready = false;
    // Deactivate cork to work with the offline queue
    this.cork = noop;
    this.uncork = noop;
    this.pipeline = false;
    this.pub_sub_mode = 0;

    // since we are collapsing end and close, users don't expect to be called twice
    if (!this.emitted_end) {
        this.emit('end');
        this.emitted_end = true;
    }

    // If this is a requested shutdown, then don't retry
    if (this.closing) {
        debug_1('Connection ended by quit / end command, not retrying.');
        this.flush_and_error({
            message: 'Stream connection ended and command aborted.',
            code: 'NR_CLOSED'
        }, {
            error: error
        });
        return;
    }

    if (typeof this.options.retry_strategy === 'function') {
        var retry_params = {
            attempt: this.attempts,
            error: error
        };
        if (this.options.camel_case) {
            retry_params.totalRetryTime = this.retry_totaltime;
            retry_params.timesConnected = this.times_connected;
        } else {
            retry_params.total_retry_time = this.retry_totaltime;
            retry_params.times_connected = this.times_connected;
        }
        this.retry_delay = this.options.retry_strategy(retry_params);
        if (typeof this.retry_delay !== 'number') {
            // Pass individual error through
            if (this.retry_delay instanceof Error) {
                error = this.retry_delay;
            }

            var errorMessage = 'Redis connection in broken state: retry aborted.';

            this.flush_and_error({
                message: errorMessage,
                code: 'CONNECTION_BROKEN',
            }, {
                error: error
            });
            var retryError = new Error(errorMessage);
            retryError.code = 'CONNECTION_BROKEN';
            if (error) {
                retryError.origin = error;
            }
            this.end(false);
            this.emit('error', retryError);
            return;
        }
    }

    if (this.retry_totaltime >= this.connect_timeout) {
        var message = 'Redis connection in broken state: connection timeout exceeded.';
        this.flush_and_error({
            message: message,
            code: 'CONNECTION_BROKEN',
        }, {
            error: error
        });
        var err = new Error(message);
        err.code = 'CONNECTION_BROKEN';
        if (error) {
            err.origin = error;
        }
        this.end(false);
        this.emit('error', err);
        return;
    }

    // Retry commands after a reconnect instead of throwing an error. Use this with caution
    if (this.options.retry_unfulfilled_commands) {
        this.offline_queue.unshift.apply(this.offline_queue, this.command_queue.toArray());
        this.command_queue.clear();
    } else if (this.command_queue.length !== 0) {
        this.flush_and_error({
            message: 'Redis connection lost and command aborted.',
            code: 'UNCERTAIN_STATE'
        }, {
            error: error,
            queues: ['command_queue']
        });
    }

    if (this.retry_totaltime + this.retry_delay > this.connect_timeout) {
        // Do not exceed the maximum
        this.retry_delay = this.connect_timeout - this.retry_totaltime;
    }

    debug_1('Retry connection in ' + this.retry_delay + ' ms');
    this.retry_timer = setTimeout(retry_connection, this.retry_delay, this, error);
};

RedisClient.prototype.return_error = function (err) {
    var command_obj = this.command_queue.shift();
    if (command_obj.error) {
        err.stack = command_obj.error.stack.replace(/^Error.*?\n/, 'ReplyError: ' + err.message + '\n');
    }
    err.command = command_obj.command.toUpperCase();
    if (command_obj.args && command_obj.args.length) {
        err.args = command_obj.args;
    }

    // Count down pub sub mode if in entering modus
    if (this.pub_sub_mode > 1) {
        this.pub_sub_mode--;
    }

    var match = err.message.match(utils.err_code);
    // LUA script could return user errors that don't behave like all other errors!
    if (match) {
        err.code = match[1];
    }

    utils.callback_or_emit(this, command_obj.callback, err);
};

RedisClient.prototype.drain = function () {
    this.should_buffer = false;
};

function normal_reply (self, reply) {
    var command_obj = self.command_queue.shift();
    if (typeof command_obj.callback === 'function') {
        if (command_obj.command !== 'exec') {
            reply = self.handle_reply(reply, command_obj.command, command_obj.buffer_args);
        }
        command_obj.callback(null, reply);
    } else {
        debug_1('No callback for reply');
    }
}

function subscribe_unsubscribe (self, reply, type) {
    // Subscribe commands take an optional callback and also emit an event, but only the _last_ response is included in the callback
    // The pub sub commands return each argument in a separate return value and have to be handled that way
    var command_obj = self.command_queue.get(0);
    var buffer = self.options.return_buffers || self.options.detect_buffers && command_obj.buffer_args;
    var channel = (buffer || reply[1] === null) ? reply[1] : reply[1].toString();
    var count = +reply[2]; // Return the channel counter as number no matter if `string_numbers` is activated or not
    debug_1(type, channel);

    // Emit first, then return the callback
    if (channel !== null) { // Do not emit or "unsubscribe" something if there was no channel to unsubscribe from
        self.emit(type, channel, count);
        if (type === 'subscribe' || type === 'psubscribe') {
            self.subscription_set[type + '_' + channel] = channel;
        } else {
            type = type === 'unsubscribe' ? 'subscribe' : 'psubscribe'; // Make types consistent
            delete self.subscription_set[type + '_' + channel];
        }
    }

    if (command_obj.args.length === 1 || self.sub_commands_left === 1 || command_obj.args.length === 0 && (count === 0 || channel === null)) {
        if (count === 0) { // unsubscribed from all channels
            var running_command;
            var i = 1;
            self.pub_sub_mode = 0; // Deactivating pub sub mode
            // This should be a rare case and therefore handling it this way should be good performance wise for the general case
            while (running_command = self.command_queue.get(i)) {
                if (SUBSCRIBE_COMMANDS[running_command.command]) {
                    self.pub_sub_mode = i; // Entering pub sub mode again
                    break;
                }
                i++;
            }
        }
        self.command_queue.shift();
        if (typeof command_obj.callback === 'function') {
            // TODO: The current return value is pretty useless.
            // Evaluate to change this in v.4 to return all subscribed / unsubscribed channels in an array including the number of channels subscribed too
            command_obj.callback(null, channel);
        }
        self.sub_commands_left = 0;
    } else {
        if (self.sub_commands_left !== 0) {
            self.sub_commands_left--;
        } else {
            self.sub_commands_left = command_obj.args.length ? command_obj.args.length - 1 : count;
        }
    }
}

function return_pub_sub (self, reply) {
    var type = reply[0].toString();
    if (type === 'message') { // channel, message
        if (!self.options.return_buffers || self.message_buffers) { // backwards compatible. Refactor this in v.4 to always return a string on the normal emitter
            self.emit('message', reply[1].toString(), reply[2].toString());
            self.emit('message_buffer', reply[1], reply[2]);
            self.emit('messageBuffer', reply[1], reply[2]);
        } else {
            self.emit('message', reply[1], reply[2]);
        }
    } else if (type === 'pmessage') { // pattern, channel, message
        if (!self.options.return_buffers || self.message_buffers) { // backwards compatible. Refactor this in v.4 to always return a string on the normal emitter
            self.emit('pmessage', reply[1].toString(), reply[2].toString(), reply[3].toString());
            self.emit('pmessage_buffer', reply[1], reply[2], reply[3]);
            self.emit('pmessageBuffer', reply[1], reply[2], reply[3]);
        } else {
            self.emit('pmessage', reply[1], reply[2], reply[3]);
        }
    } else {
        subscribe_unsubscribe(self, reply, type);
    }
}

RedisClient.prototype.return_reply = function (reply) {
    if (this.monitoring) {
        var replyStr;
        if (this.buffers && Buffer.isBuffer(reply)) {
            replyStr = reply.toString();
        } else {
            replyStr = reply;
        }
        // If in monitor mode, all normal commands are still working and we only want to emit the streamlined commands
        if (typeof replyStr === 'string' && utils.monitor_regex.test(replyStr)) {
            var timestamp = replyStr.slice(0, replyStr.indexOf(' '));
            var args = replyStr.slice(replyStr.indexOf('"') + 1, -1).split('" "').map(function (elem) {
                return elem.replace(/\\"/g, '"');
            });
            this.emit('monitor', timestamp, args, replyStr);
            return;
        }
    }
    if (this.pub_sub_mode === 0) {
        normal_reply(this, reply);
    } else if (this.pub_sub_mode !== 1) {
        this.pub_sub_mode--;
        normal_reply(this, reply);
    } else if (!(reply instanceof Array) || reply.length <= 2) {
        // Only PING and QUIT are allowed in this context besides the pub sub commands
        // Ping replies with ['pong', null|value] and quit with 'OK'
        normal_reply(this, reply);
    } else {
        return_pub_sub(this, reply);
    }
};

function handle_offline_command (self, command_obj) {
    var command = command_obj.command;
    var err, msg;
    if (self.closing || !self.enable_offline_queue) {
        command = command.toUpperCase();
        if (!self.closing) {
            if (self.stream.writable) {
                msg = 'The connection is not yet established and the offline queue is deactivated.';
            } else {
                msg = 'Stream not writeable.';
            }
        } else {
            msg = 'The connection is already closed.';
        }
        err = new customErrors.AbortError({
            message: command + " can't be processed. " + msg,
            code: 'NR_CLOSED',
            command: command
        });
        if (command_obj.args.length) {
            err.args = command_obj.args;
        }
        utils.reply_in_order(self, command_obj.callback, err);
    } else {
        debug_1('Queueing ' + command + ' for next server connection.');
        self.offline_queue.push(command_obj);
    }
    self.should_buffer = true;
}

// Do not call internal_send_command directly, if you are not absolutly certain it handles everything properly
// e.g. monitor / info does not work with internal_send_command only
RedisClient.prototype.internal_send_command = function (command_obj) {
    var arg, prefix_keys;
    var i = 0;
    var command_str = '';
    var args = command_obj.args;
    var command = command_obj.command;
    var len = args.length;
    var big_data = false;
    var args_copy = new Array(len);

    if (process.domain && command_obj.callback) {
        command_obj.callback = process.domain.bind(command_obj.callback);
    }

    if (this.ready === false || this.stream.writable === false) {
        // Handle offline commands right away
        handle_offline_command(this, command_obj);
        return false; // Indicate buffering
    }

    for (i = 0; i < len; i += 1) {
        if (typeof args[i] === 'string') {
            // 30000 seemed to be a good value to switch to buffers after testing and checking the pros and cons
            if (args[i].length > 30000) {
                big_data = true;
                args_copy[i] = Buffer.from(args[i], 'utf8');
            } else {
                args_copy[i] = args[i];
            }
        } else if (typeof args[i] === 'object') { // Checking for object instead of Buffer.isBuffer helps us finding data types that we can't handle properly
            if (args[i] instanceof Date) { // Accept dates as valid input
                args_copy[i] = args[i].toString();
            } else if (Buffer.isBuffer(args[i])) {
                args_copy[i] = args[i];
                command_obj.buffer_args = true;
                big_data = true;
            } else {
                var invalidArgError = new Error(
                    'node_redis: The ' + command.toUpperCase() + ' command contains a invalid argument type.\n' +
                    'Only strings, dates and buffers are accepted. Please update your code to use valid argument types.'
                );
                invalidArgError.command = command_obj.command.toUpperCase();
                if (command_obj.args && command_obj.args.length) {
                    invalidArgError.args = command_obj.args;
                }
                if (command_obj.callback) {
                    command_obj.callback(invalidArgError);
                    return false;
                }
                throw invalidArgError;
            }
        } else if (typeof args[i] === 'undefined') {
            var undefinedArgError = new Error(
                'node_redis: The ' + command.toUpperCase() + ' command contains a invalid argument type of "undefined".\n' +
                'Only strings, dates and buffers are accepted. Please update your code to use valid argument types.'
            );
            undefinedArgError.command = command_obj.command.toUpperCase();
            if (command_obj.args && command_obj.args.length) {
                undefinedArgError.args = command_obj.args;
            }
            // there is always a callback in this scenario
            command_obj.callback(undefinedArgError);
            return false;
        } else {
            // Seems like numbers are converted fast using string concatenation
            args_copy[i] = '' + args[i];
        }
    }

    if (this.options.prefix) {
        prefix_keys = redisCommands.getKeyIndexes(command, args_copy);
        for (i = prefix_keys.pop(); i !== undefined; i = prefix_keys.pop()) {
            args_copy[i] = this.options.prefix + args_copy[i];
        }
    }
    if (this.options.rename_commands && this.options.rename_commands[command]) {
        command = this.options.rename_commands[command];
    }
    // Always use 'Multi bulk commands', but if passed any Buffer args, then do multiple writes, one for each arg.
    // This means that using Buffers in commands is going to be slower, so use Strings if you don't already have a Buffer.
    command_str = '*' + (len + 1) + '\r\n$' + command.length + '\r\n' + command + '\r\n';

    if (big_data === false) { // Build up a string and send entire command in one write
        for (i = 0; i < len; i += 1) {
            arg = args_copy[i];
            command_str += '$' + Buffer.byteLength(arg) + '\r\n' + arg + '\r\n';
        }
        debug_1('Send ' + this.address + ' id ' + this.connection_id + ': ' + command_str);
        this.write(command_str);
    } else {
        debug_1('Send command (' + command_str + ') has Buffer arguments');
        this.fire_strings = false;
        this.write(command_str);

        for (i = 0; i < len; i += 1) {
            arg = args_copy[i];
            if (typeof arg === 'string') {
                this.write('$' + Buffer.byteLength(arg) + '\r\n' + arg + '\r\n');
            } else { // buffer
                this.write('$' + arg.length + '\r\n');
                this.write(arg);
                this.write('\r\n');
            }
            debug_1('send_command: buffer send ' + arg.length + ' bytes');
        }
    }
    if (command_obj.call_on_write) {
        command_obj.call_on_write();
    }
    // Handle `CLIENT REPLY ON|OFF|SKIP`
    // This has to be checked after call_on_write
    /* istanbul ignore else: TODO: Remove this as soon as we test Redis 3.2 on travis */
    if (this.reply === 'ON') {
        this.command_queue.push(command_obj);
    } else {
        // Do not expect a reply
        // Does this work in combination with the pub sub mode?
        if (command_obj.callback) {
            utils.reply_in_order(this, command_obj.callback, null, undefined, this.command_queue);
        }
        if (this.reply === 'SKIP') {
            this.reply = 'SKIP_ONE_MORE';
        } else if (this.reply === 'SKIP_ONE_MORE') {
            this.reply = 'ON';
        }
    }
    return !this.should_buffer;
};

RedisClient.prototype.write_strings = function () {
    var str = '';
    for (var command = this.pipeline_queue.shift(); command; command = this.pipeline_queue.shift()) {
        // Write to stream if the string is bigger than 4mb. The biggest string may be Math.pow(2, 28) - 15 chars long
        if (str.length + command.length > 4 * 1024 * 1024) {
            this.should_buffer = !this.stream.write(str);
            str = '';
        }
        str += command;
    }
    if (str !== '') {
        this.should_buffer = !this.stream.write(str);
    }
};

RedisClient.prototype.write_buffers = function () {
    for (var command = this.pipeline_queue.shift(); command; command = this.pipeline_queue.shift()) {
        this.should_buffer = !this.stream.write(command);
    }
};

RedisClient.prototype.write = function (data) {
    if (this.pipeline === false) {
        this.should_buffer = !this.stream.write(data);
        return;
    }
    this.pipeline_queue.push(data);
};

Object.defineProperty(exports, 'debugMode', {
    get: function () {
        return this.debug_mode;
    },
    set: function (val) {
        this.debug_mode = val;
    }
});

// Don't officially expose the command_queue directly but only the length as read only variable
Object.defineProperty(RedisClient.prototype, 'command_queue_length', {
    get: function () {
        return this.command_queue.length;
    }
});

Object.defineProperty(RedisClient.prototype, 'offline_queue_length', {
    get: function () {
        return this.offline_queue.length;
    }
});

// Add support for camelCase by adding read only properties to the client
// All known exposed snake_case variables are added here
Object.defineProperty(RedisClient.prototype, 'retryDelay', {
    get: function () {
        return this.retry_delay;
    }
});

Object.defineProperty(RedisClient.prototype, 'retryBackoff', {
    get: function () {
        return this.retry_backoff;
    }
});

Object.defineProperty(RedisClient.prototype, 'commandQueueLength', {
    get: function () {
        return this.command_queue.length;
    }
});

Object.defineProperty(RedisClient.prototype, 'offlineQueueLength', {
    get: function () {
        return this.offline_queue.length;
    }
});

Object.defineProperty(RedisClient.prototype, 'shouldBuffer', {
    get: function () {
        return this.should_buffer;
    }
});

Object.defineProperty(RedisClient.prototype, 'connectionId', {
    get: function () {
        return this.connection_id;
    }
});

Object.defineProperty(RedisClient.prototype, 'serverInfo', {
    get: function () {
        return this.server_info;
    }
});

exports.createClient = function () {
    return new RedisClient(createClient.apply(null, arguments));
};
exports.RedisClient = RedisClient;
exports.print = utils.print;
exports.Multi = multi$1;
exports.AbortError = customErrors.AbortError;
exports.RedisError = redisErrors.RedisError;
exports.ParserError = redisErrors.ParserError;
exports.ReplyError = redisErrors.ReplyError;
exports.AggregateError = customErrors.AggregateError;

// Add all redis commands / node_redis api to the client



//enables adding new commands (for modules and new commands)
exports.addCommand = exports.add_command = commands_1;
});
