var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var isNode = typeof commonjsGlobal !== 'undefined' && typeof commonjsGlobal.process !== 'undefined' && typeof commonjsGlobal.process.emit === 'function';

var asyncSetTimer = typeof setImmediate === 'undefined' ? setTimeout : setImmediate;
