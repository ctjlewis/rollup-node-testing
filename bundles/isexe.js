import 'fs';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

if (process.platform === 'win32' || commonjsGlobal.TESTING_WINDOWS) ;
