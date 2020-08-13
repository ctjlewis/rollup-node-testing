import fs from 'fs';

const processFn = (fn, opts) => function () {
	const P = opts.promiseModule;
	const args = new Array(arguments.length);

	for (let i = 0; i < arguments.length; i++) {
		args[i] = arguments[i];
	}

	return new P((resolve, reject) => {
		if (opts.errorFirst) {
			args.push(function (err, result) {
				if (opts.multiArgs) {
					const results = new Array(arguments.length - 1);

					for (let i = 1; i < arguments.length; i++) {
						results[i - 1] = arguments[i];
					}

					if (err) {
						results.unshift(err);
						reject(results);
					} else {
						resolve(results);
					}
				} else if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		} else {
			args.push(function (result) {
				if (opts.multiArgs) {
					const results = new Array(arguments.length - 1);

					for (let i = 0; i < arguments.length; i++) {
						results[i] = arguments[i];
					}

					resolve(results);
				} else {
					resolve(result);
				}
			});
		}

		fn.apply(this, args);
	});
};

var pify = (obj, opts) => {
	opts = Object.assign({
		exclude: [/.+(Sync|Stream)$/],
		errorFirst: true,
		promiseModule: Promise
	}, opts);

	const filter = key => {
		const match = pattern => typeof pattern === 'string' ? key === pattern : pattern.test(key);
		return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
	};

	let ret;
	if (typeof obj === 'function') {
		ret = function () {
			if (opts.excludeMain) {
				return obj.apply(this, arguments);
			}

			return processFn(obj, opts).apply(this, arguments);
		};
	} else {
		ret = Object.create(Object.getPrototypeOf(obj));
	}

	for (const key in obj) { // eslint-disable-line guard-for-in
		const x = obj[key];
		ret[key] = typeof x === 'function' && filter(key) ? processFn(x, opts) : x;
	}

	return ret;
};

function type(fn, fn2, fp) {
	if (typeof fp !== 'string') {
		return Promise.reject(new TypeError(`Expected a string, got ${typeof fp}`));
	}

	return pify(fs[fn])(fp)
		.then(stats => stats[fn2]())
		.catch(err => {
			if (err.code === 'ENOENT') {
				return false;
			}

			throw err;
		});
}

function typeSync(fn, fn2, fp) {
	if (typeof fp !== 'string') {
		throw new TypeError(`Expected a string, got ${typeof fp}`);
	}

	try {
		return fs[fn](fp)[fn2]();
	} catch (err) {
		if (err.code === 'ENOENT') {
			return false;
		}

		throw err;
	}
}

var file = type.bind(null, 'stat', 'isFile');
var dir = type.bind(null, 'stat', 'isDirectory');
var symlink = type.bind(null, 'lstat', 'isSymbolicLink');
var fileSync = typeSync.bind(null, 'statSync', 'isFile');
var dirSync = typeSync.bind(null, 'statSync', 'isDirectory');
var symlinkSync = typeSync.bind(null, 'lstatSync', 'isSymbolicLink');
