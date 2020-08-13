import fs from 'fs';
import os from 'os';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

const tempDirectorySymbol = Symbol.for('__RESOLVED_TEMP_DIRECTORY__');

if (!commonjsGlobal[tempDirectorySymbol]) {
	Object.defineProperty(commonjsGlobal, tempDirectorySymbol, {
		value: fs.realpathSync(os.tmpdir())
	});
}
