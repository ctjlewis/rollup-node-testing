import util from 'util';
import events from 'events';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var EventEmitter = events.EventEmitter;

var sparklesNamespace = 'store@sparkles';
var defaultNamespace = 'default';

function getStore() {
  var store = commonjsGlobal[sparklesNamespace];

  if (!store) {
    store = commonjsGlobal[sparklesNamespace] = {};
  }

  return store;
}

function getEmitter(namespace) {

  var store = getStore();

  namespace = namespace || defaultNamespace;

  var ee = store[namespace];

  if (!ee) {
    ee = store[namespace] = new EventEmitter();
    ee.setMaxListeners(0);
    ee.remove = function remove() {
      ee.removeAllListeners();
      delete store[namespace];
    };
  }

  return ee;
}

function exists(namespace) {
  var store = getStore();

  return !!(store[namespace]);
}

var sparkles = getEmitter;
var exists_1 = exists;
sparkles.exists = exists_1;

var format = util.format;



var levels = [
  'debug',
  'info',
  'warn',
  'error',
];

function getLogger(namespace) {
  var logger = sparkles(namespace);

  levels.forEach(function(level) {
    logger[level] = makeLogLevel(logger, level);
  });

  return logger;
}

function makeLogLevel(self, level) {
  return function(msg) {
    if (typeof msg === 'string') {
      msg = format.apply(null, arguments);
    }

    self.emit(level, msg);
  };
}

var glogg = getLogger;

var logger = glogg('gulplog');
