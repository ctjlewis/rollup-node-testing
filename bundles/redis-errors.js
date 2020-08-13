import assert from 'assert';
import util from 'util';

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
