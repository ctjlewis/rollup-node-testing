var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var next = (commonjsGlobal.process && process.nextTick) || commonjsGlobal.setImmediate || function (f) {
  setTimeout(f, 0);
};
