import util from 'util';
import path from 'path';
import fs from 'fs';
import constants from 'constants';
import stream from 'stream';
import assert from 'assert';

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

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

class Hook {
	constructor(args) {
		if (!Array.isArray(args)) args = [];
		this._args = args;
		this.taps = [];
		this.interceptors = [];
		this.call = this._call;
		this.promise = this._promise;
		this.callAsync = this._callAsync;
		this._x = undefined;
	}

	compile(options) {
		throw new Error("Abstract: should be overriden");
	}

	_createCall(type) {
		return this.compile({
			taps: this.taps,
			interceptors: this.interceptors,
			args: this._args,
			type: type
		});
	}

	tap(options, fn) {
		if (typeof options === "string") options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error(
				"Invalid arguments to tap(options: Object, fn: function)"
			);
		options = Object.assign({ type: "sync", fn: fn }, options);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tap");
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	tapAsync(options, fn) {
		if (typeof options === "string") options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error(
				"Invalid arguments to tapAsync(options: Object, fn: function)"
			);
		options = Object.assign({ type: "async", fn: fn }, options);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tapAsync");
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	tapPromise(options, fn) {
		if (typeof options === "string") options = { name: options };
		if (typeof options !== "object" || options === null)
			throw new Error(
				"Invalid arguments to tapPromise(options: Object, fn: function)"
			);
		options = Object.assign({ type: "promise", fn: fn }, options);
		if (typeof options.name !== "string" || options.name === "")
			throw new Error("Missing name for tapPromise");
		options = this._runRegisterInterceptors(options);
		this._insert(options);
	}

	_runRegisterInterceptors(options) {
		for (const interceptor of this.interceptors) {
			if (interceptor.register) {
				const newOptions = interceptor.register(options);
				if (newOptions !== undefined) options = newOptions;
			}
		}
		return options;
	}

	withOptions(options) {
		const mergeOptions = opt =>
			Object.assign({}, options, typeof opt === "string" ? { name: opt } : opt);

		// Prevent creating endless prototype chains
		options = Object.assign({}, options, this._withOptions);
		const base = this._withOptionsBase || this;
		const newHook = Object.create(base);

		(newHook.tapAsync = (opt, fn) => base.tapAsync(mergeOptions(opt), fn)),
			(newHook.tap = (opt, fn) => base.tap(mergeOptions(opt), fn));
		newHook.tapPromise = (opt, fn) => base.tapPromise(mergeOptions(opt), fn);
		newHook._withOptions = options;
		newHook._withOptionsBase = base;
		return newHook;
	}

	isUsed() {
		return this.taps.length > 0 || this.interceptors.length > 0;
	}

	intercept(interceptor) {
		this._resetCompilation();
		this.interceptors.push(Object.assign({}, interceptor));
		if (interceptor.register) {
			for (let i = 0; i < this.taps.length; i++)
				this.taps[i] = interceptor.register(this.taps[i]);
		}
	}

	_resetCompilation() {
		this.call = this._call;
		this.callAsync = this._callAsync;
		this.promise = this._promise;
	}

	_insert(item) {
		this._resetCompilation();
		let before;
		if (typeof item.before === "string") before = new Set([item.before]);
		else if (Array.isArray(item.before)) {
			before = new Set(item.before);
		}
		let stage = 0;
		if (typeof item.stage === "number") stage = item.stage;
		let i = this.taps.length;
		while (i > 0) {
			i--;
			const x = this.taps[i];
			this.taps[i + 1] = x;
			const xStage = x.stage || 0;
			if (before) {
				if (before.has(x.name)) {
					before.delete(x.name);
					continue;
				}
				if (before.size > 0) {
					continue;
				}
			}
			if (xStage > stage) {
				continue;
			}
			i++;
			break;
		}
		this.taps[i] = item;
	}
}

function createCompileDelegate(name, type) {
	return function lazyCompileHook(...args) {
		this[name] = this._createCall(type);
		return this[name](...args);
	};
}

Object.defineProperties(Hook.prototype, {
	_call: {
		value: createCompileDelegate("call", "sync"),
		configurable: true,
		writable: true
	},
	_promise: {
		value: createCompileDelegate("promise", "promise"),
		configurable: true,
		writable: true
	},
	_callAsync: {
		value: createCompileDelegate("callAsync", "async"),
		configurable: true,
		writable: true
	}
});

var Hook_1 = Hook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

class HookCodeFactory {
	constructor(config) {
		this.config = config;
		this.options = undefined;
		this._args = undefined;
	}

	create(options) {
		this.init(options);
		let fn;
		switch (this.options.type) {
			case "sync":
				fn = new Function(
					this.args(),
					'"use strict";\n' +
						this.header() +
						this.content({
							onError: err => `throw ${err};\n`,
							onResult: result => `return ${result};\n`,
							resultReturns: true,
							onDone: () => "",
							rethrowIfPossible: true
						})
				);
				break;
			case "async":
				fn = new Function(
					this.args({
						after: "_callback"
					}),
					'"use strict";\n' +
						this.header() +
						this.content({
							onError: err => `_callback(${err});\n`,
							onResult: result => `_callback(null, ${result});\n`,
							onDone: () => "_callback();\n"
						})
				);
				break;
			case "promise":
				let errorHelperUsed = false;
				const content = this.content({
					onError: err => {
						errorHelperUsed = true;
						return `_error(${err});\n`;
					},
					onResult: result => `_resolve(${result});\n`,
					onDone: () => "_resolve();\n"
				});
				let code = "";
				code += '"use strict";\n';
				code += "return new Promise((_resolve, _reject) => {\n";
				if (errorHelperUsed) {
					code += "var _sync = true;\n";
					code += "function _error(_err) {\n";
					code += "if(_sync)\n";
					code += "_resolve(Promise.resolve().then(() => { throw _err; }));\n";
					code += "else\n";
					code += "_reject(_err);\n";
					code += "};\n";
				}
				code += this.header();
				code += content;
				if (errorHelperUsed) {
					code += "_sync = false;\n";
				}
				code += "});\n";
				fn = new Function(this.args(), code);
				break;
		}
		this.deinit();
		return fn;
	}

	setup(instance, options) {
		instance._x = options.taps.map(t => t.fn);
	}

	/**
	 * @param {{ type: "sync" | "promise" | "async", taps: Array<Tap>, interceptors: Array<Interceptor> }} options
	 */
	init(options) {
		this.options = options;
		this._args = options.args.slice();
	}

	deinit() {
		this.options = undefined;
		this._args = undefined;
	}

	header() {
		let code = "";
		if (this.needContext()) {
			code += "var _context = {};\n";
		} else {
			code += "var _context;\n";
		}
		code += "var _x = this._x;\n";
		if (this.options.interceptors.length > 0) {
			code += "var _taps = this.taps;\n";
			code += "var _interceptors = this.interceptors;\n";
		}
		for (let i = 0; i < this.options.interceptors.length; i++) {
			const interceptor = this.options.interceptors[i];
			if (interceptor.call) {
				code += `${this.getInterceptor(i)}.call(${this.args({
					before: interceptor.context ? "_context" : undefined
				})});\n`;
			}
		}
		return code;
	}

	needContext() {
		for (const tap of this.options.taps) if (tap.context) return true;
		return false;
	}

	callTap(tapIndex, { onError, onResult, onDone, rethrowIfPossible }) {
		let code = "";
		let hasTapCached = false;
		for (let i = 0; i < this.options.interceptors.length; i++) {
			const interceptor = this.options.interceptors[i];
			if (interceptor.tap) {
				if (!hasTapCached) {
					code += `var _tap${tapIndex} = ${this.getTap(tapIndex)};\n`;
					hasTapCached = true;
				}
				code += `${this.getInterceptor(i)}.tap(${
					interceptor.context ? "_context, " : ""
				}_tap${tapIndex});\n`;
			}
		}
		code += `var _fn${tapIndex} = ${this.getTapFn(tapIndex)};\n`;
		const tap = this.options.taps[tapIndex];
		switch (tap.type) {
			case "sync":
				if (!rethrowIfPossible) {
					code += `var _hasError${tapIndex} = false;\n`;
					code += "try {\n";
				}
				if (onResult) {
					code += `var _result${tapIndex} = _fn${tapIndex}(${this.args({
						before: tap.context ? "_context" : undefined
					})});\n`;
				} else {
					code += `_fn${tapIndex}(${this.args({
						before: tap.context ? "_context" : undefined
					})});\n`;
				}
				if (!rethrowIfPossible) {
					code += "} catch(_err) {\n";
					code += `_hasError${tapIndex} = true;\n`;
					code += onError("_err");
					code += "}\n";
					code += `if(!_hasError${tapIndex}) {\n`;
				}
				if (onResult) {
					code += onResult(`_result${tapIndex}`);
				}
				if (onDone) {
					code += onDone();
				}
				if (!rethrowIfPossible) {
					code += "}\n";
				}
				break;
			case "async":
				let cbCode = "";
				if (onResult) cbCode += `(_err${tapIndex}, _result${tapIndex}) => {\n`;
				else cbCode += `_err${tapIndex} => {\n`;
				cbCode += `if(_err${tapIndex}) {\n`;
				cbCode += onError(`_err${tapIndex}`);
				cbCode += "} else {\n";
				if (onResult) {
					cbCode += onResult(`_result${tapIndex}`);
				}
				if (onDone) {
					cbCode += onDone();
				}
				cbCode += "}\n";
				cbCode += "}";
				code += `_fn${tapIndex}(${this.args({
					before: tap.context ? "_context" : undefined,
					after: cbCode
				})});\n`;
				break;
			case "promise":
				code += `var _hasResult${tapIndex} = false;\n`;
				code += `var _promise${tapIndex} = _fn${tapIndex}(${this.args({
					before: tap.context ? "_context" : undefined
				})});\n`;
				code += `if (!_promise${tapIndex} || !_promise${tapIndex}.then)\n`;
				code += `  throw new Error('Tap function (tapPromise) did not return promise (returned ' + _promise${tapIndex} + ')');\n`;
				code += `_promise${tapIndex}.then(_result${tapIndex} => {\n`;
				code += `_hasResult${tapIndex} = true;\n`;
				if (onResult) {
					code += onResult(`_result${tapIndex}`);
				}
				if (onDone) {
					code += onDone();
				}
				code += `}, _err${tapIndex} => {\n`;
				code += `if(_hasResult${tapIndex}) throw _err${tapIndex};\n`;
				code += onError(`_err${tapIndex}`);
				code += "});\n";
				break;
		}
		return code;
	}

	callTapsSeries({
		onError,
		onResult,
		resultReturns,
		onDone,
		doneReturns,
		rethrowIfPossible
	}) {
		if (this.options.taps.length === 0) return onDone();
		const firstAsync = this.options.taps.findIndex(t => t.type !== "sync");
		const somethingReturns = resultReturns || doneReturns || false;
		let code = "";
		let current = onDone;
		for (let j = this.options.taps.length - 1; j >= 0; j--) {
			const i = j;
			const unroll = current !== onDone && this.options.taps[i].type !== "sync";
			if (unroll) {
				code += `function _next${i}() {\n`;
				code += current();
				code += `}\n`;
				current = () => `${somethingReturns ? "return " : ""}_next${i}();\n`;
			}
			const done = current;
			const doneBreak = skipDone => {
				if (skipDone) return "";
				return onDone();
			};
			const content = this.callTap(i, {
				onError: error => onError(i, error, done, doneBreak),
				onResult:
					onResult &&
					(result => {
						return onResult(i, result, done, doneBreak);
					}),
				onDone: !onResult && done,
				rethrowIfPossible:
					rethrowIfPossible && (firstAsync < 0 || i < firstAsync)
			});
			current = () => content;
		}
		code += current();
		return code;
	}

	callTapsLooping({ onError, onDone, rethrowIfPossible }) {
		if (this.options.taps.length === 0) return onDone();
		const syncOnly = this.options.taps.every(t => t.type === "sync");
		let code = "";
		if (!syncOnly) {
			code += "var _looper = () => {\n";
			code += "var _loopAsync = false;\n";
		}
		code += "var _loop;\n";
		code += "do {\n";
		code += "_loop = false;\n";
		for (let i = 0; i < this.options.interceptors.length; i++) {
			const interceptor = this.options.interceptors[i];
			if (interceptor.loop) {
				code += `${this.getInterceptor(i)}.loop(${this.args({
					before: interceptor.context ? "_context" : undefined
				})});\n`;
			}
		}
		code += this.callTapsSeries({
			onError,
			onResult: (i, result, next, doneBreak) => {
				let code = "";
				code += `if(${result} !== undefined) {\n`;
				code += "_loop = true;\n";
				if (!syncOnly) code += "if(_loopAsync) _looper();\n";
				code += doneBreak(true);
				code += `} else {\n`;
				code += next();
				code += `}\n`;
				return code;
			},
			onDone:
				onDone &&
				(() => {
					let code = "";
					code += "if(!_loop) {\n";
					code += onDone();
					code += "}\n";
					return code;
				}),
			rethrowIfPossible: rethrowIfPossible && syncOnly
		});
		code += "} while(_loop);\n";
		if (!syncOnly) {
			code += "_loopAsync = true;\n";
			code += "};\n";
			code += "_looper();\n";
		}
		return code;
	}

	callTapsParallel({
		onError,
		onResult,
		onDone,
		rethrowIfPossible,
		onTap = (i, run) => run()
	}) {
		if (this.options.taps.length <= 1) {
			return this.callTapsSeries({
				onError,
				onResult,
				onDone,
				rethrowIfPossible
			});
		}
		let code = "";
		code += "do {\n";
		code += `var _counter = ${this.options.taps.length};\n`;
		if (onDone) {
			code += "var _done = () => {\n";
			code += onDone();
			code += "};\n";
		}
		for (let i = 0; i < this.options.taps.length; i++) {
			const done = () => {
				if (onDone) return "if(--_counter === 0) _done();\n";
				else return "--_counter;";
			};
			const doneBreak = skipDone => {
				if (skipDone || !onDone) return "_counter = 0;\n";
				else return "_counter = 0;\n_done();\n";
			};
			code += "if(_counter <= 0) break;\n";
			code += onTap(
				i,
				() =>
					this.callTap(i, {
						onError: error => {
							let code = "";
							code += "if(_counter > 0) {\n";
							code += onError(i, error, done, doneBreak);
							code += "}\n";
							return code;
						},
						onResult:
							onResult &&
							(result => {
								let code = "";
								code += "if(_counter > 0) {\n";
								code += onResult(i, result, done, doneBreak);
								code += "}\n";
								return code;
							}),
						onDone:
							!onResult &&
							(() => {
								return done();
							}),
						rethrowIfPossible
					}),
				done,
				doneBreak
			);
		}
		code += "} while(false);\n";
		return code;
	}

	args({ before, after } = {}) {
		let allArgs = this._args;
		if (before) allArgs = [before].concat(allArgs);
		if (after) allArgs = allArgs.concat(after);
		if (allArgs.length === 0) {
			return "";
		} else {
			return allArgs.join(", ");
		}
	}

	getTapFn(idx) {
		return `_x[${idx}]`;
	}

	getTap(idx) {
		return `_taps[${idx}]`;
	}

	getInterceptor(idx) {
		return `_interceptors[${idx}]`;
	}
}

var HookCodeFactory_1 = HookCodeFactory;

class SyncBailHookCodeFactory extends HookCodeFactory_1 {
	content({ onError, onResult, resultReturns, onDone, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			onResult: (i, result, next) =>
				`if(${result} !== undefined) {\n${onResult(
					result
				)};\n} else {\n${next()}}\n`,
			resultReturns,
			onDone,
			rethrowIfPossible
		});
	}
}

const factory = new SyncBailHookCodeFactory();

class SyncBailHook extends Hook_1 {
	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncBailHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncBailHook");
	}

	compile(options) {
		factory.setup(this, options);
		return factory.create(options);
	}
}

var SyncBailHook_1 = SyncBailHook;

function Tapable() {
	this._pluginCompat = new SyncBailHook_1(["options"]);
	this._pluginCompat.tap(
		{
			name: "Tapable camelCase",
			stage: 100
		},
		options => {
			options.names.add(
				options.name.replace(/[- ]([a-z])/g, (str, ch) => ch.toUpperCase())
			);
		}
	);
	this._pluginCompat.tap(
		{
			name: "Tapable this.hooks",
			stage: 200
		},
		options => {
			let hook;
			for (const name of options.names) {
				hook = this.hooks[name];
				if (hook !== undefined) {
					break;
				}
			}
			if (hook !== undefined) {
				const tapOpt = {
					name: options.fn.name || "unnamed compat plugin",
					stage: options.stage || 0
				};
				if (options.async) hook.tapAsync(tapOpt, options.fn);
				else hook.tap(tapOpt, options.fn);
				return true;
			}
		}
	);
}
var Tapable_1 = Tapable;

Tapable.addCompatLayer = function addCompatLayer(instance) {
	Tapable.call(instance);
	instance.plugin = Tapable.prototype.plugin;
	instance.apply = Tapable.prototype.apply;
};

Tapable.prototype.plugin = util.deprecate(function plugin(name, fn) {
	if (Array.isArray(name)) {
		name.forEach(function(name) {
			this.plugin(name, fn);
		}, this);
		return;
	}
	const result = this._pluginCompat.call({
		name: name,
		fn: fn,
		names: new Set([name])
	});
	if (!result) {
		throw new Error(
			`Plugin could not be registered at '${name}'. Hook was not found.\n` +
				"BREAKING CHANGE: There need to exist a hook at 'this.hooks'. " +
				"To create a compatibility layer for this hook, hook into 'this._pluginCompat'."
		);
	}
}, "Tapable.plugin is deprecated. Use new API on `.hooks` instead");

Tapable.prototype.apply = util.deprecate(function apply() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].apply(this);
	}
}, "Tapable.apply is deprecated. Call apply on the plugin directly instead");

class SyncHookCodeFactory extends HookCodeFactory_1 {
	content({ onError, onDone, rethrowIfPossible }) {
		return this.callTapsSeries({
			onError: (i, err) => onError(err),
			onDone,
			rethrowIfPossible
		});
	}
}

const factory$1 = new SyncHookCodeFactory();

class SyncHook extends Hook_1 {
	tapAsync() {
		throw new Error("tapAsync is not supported on a SyncHook");
	}

	tapPromise() {
		throw new Error("tapPromise is not supported on a SyncHook");
	}

	compile(options) {
		factory$1.setup(this, options);
		return factory$1.create(options);
	}
}

var SyncHook_1 = SyncHook;

class AsyncSeriesBailHookCodeFactory extends HookCodeFactory_1 {
	content({ onError, onResult, resultReturns, onDone }) {
		return this.callTapsSeries({
			onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
			onResult: (i, result, next) =>
				`if(${result} !== undefined) {\n${onResult(
					result
				)};\n} else {\n${next()}}\n`,
			resultReturns,
			onDone
		});
	}
}

const factory$2 = new AsyncSeriesBailHookCodeFactory();

class AsyncSeriesBailHook extends Hook_1 {
	compile(options) {
		factory$2.setup(this, options);
		return factory$2.create(options);
	}
}

Object.defineProperties(AsyncSeriesBailHook.prototype, {
	_call: { value: undefined, configurable: true, writable: true }
});

var AsyncSeriesBailHook_1 = AsyncSeriesBailHook;

class AsyncSeriesHookCodeFactory extends HookCodeFactory_1 {
	content({ onError, onDone }) {
		return this.callTapsSeries({
			onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
			onDone
		});
	}
}

const factory$3 = new AsyncSeriesHookCodeFactory();

class AsyncSeriesHook extends Hook_1 {
	compile(options) {
		factory$3.setup(this, options);
		return factory$3.create(options);
	}
}

Object.defineProperties(AsyncSeriesHook.prototype, {
	_call: { value: undefined, configurable: true, writable: true }
});

var AsyncSeriesHook_1 = AsyncSeriesHook;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var createInnerContext = function createInnerContext(
	options,
	message,
	messageOptional
) {
	let messageReported = false;
	const childContext = {
		log: (() => {
			if (!options.log) return undefined;
			if (!message) return options.log;
			const logFunction = msg => {
				if (!messageReported) {
					options.log(message);
					messageReported = true;
				}
				options.log("  " + msg);
			};
			return logFunction;
		})(),
		stack: options.stack,
		missing: options.missing
	};
	return childContext;
};

// eslint-disable-next-line complexity
var normalize = function normalize(path) {
	var parts = path.split(/(\\+|\/+)/);
	if(parts.length === 1)
		return path;
	var result = [];
	var absolutePathStart = 0;
	for(var i = 0, sep = false; i < parts.length; i += 1, sep = !sep) {
		var part = parts[i];
		if(i === 0 && /^([A-Z]:)?$/i.test(part)) {
			result.push(part);
			absolutePathStart = 2;
		} else if(sep) {
			// UNC paths on Windows begin with a double backslash.
			if (i === 1 && parts[0].length === 0 && part === "\\\\") {
				result.push(part);
			} else {
				result.push(part[0]);
			}
		} else if(part === "..") {
			switch(result.length) {
				case 0:
					// i. e. ".." => ".."
					// i. e. "../a/b/c" => "../a/b/c"
					result.push(part);
					break;
				case 2:
					// i. e. "a/.." => ""
					// i. e. "/.." => "/"
					// i. e. "C:\.." => "C:\"
					// i. e. "a/../b/c" => "b/c"
					// i. e. "/../b/c" => "/b/c"
					// i. e. "C:\..\a\b\c" => "C:\a\b\c"
					if (result[0] !== ".") {
						i += 1;
						sep = !sep;
						result.length = absolutePathStart;
					} else {
						result.length = 0;
						result.push(part);
					}
					break;
				case 4:
					// i. e. "a/b/.." => "a"
					// i. e. "/a/.." => "/"
					// i. e. "C:\a\.." => "C:\"
					// i. e. "/a/../b/c" => "/b/c"
					if(absolutePathStart === 0) {
						result.length -= 3;
					} else {
						i += 1;
						sep = !sep;
						result.length = 2;
					}
					break;
				default:
					// i. e. "/a/b/.." => "/a"
					// i. e. "/a/b/../c" => "/a/c"
					result.length -= 3;
					break;
			}
		} else if(part === ".") {
			switch(result.length) {
				case 0:
					// i. e. "." => "."
					// i. e. "./a/b/c" => "./a/b/c"
					result.push(part);
					break;
				case 2:
					// i. e. "a/." => "a"
					// i. e. "/." => "/"
					// i. e. "C:\." => "C:\"
					// i. e. "C:\.\a\b\c" => "C:\a\b\c"
					if(absolutePathStart === 0) {
						result.length -= 1;
					} else {
						i += 1;
						sep = !sep;
					}
					break;
				default:
					// i. e. "a/b/." => "a/b"
					// i. e. "/a/." => "/"
					// i. e. "C:\a\." => "C:\"
					// i. e. "a/./b/c" => "a/b/c"
					// i. e. "/a/./b/c" => "/a/b/c"
					result.length -= 1;
					break;
			}
		} else if(part) {
			result.push(part);
		}
	}
	if(result.length === 1 && /^[A-Za-z]:$/.test(result[0]))
		return result[0] + "\\";
	return result.join("");
};

const absoluteWinRegExp = /^[A-Z]:([\\\/]|$)/i;
const absoluteNixRegExp = /^\//i;

var join = function join(path, request) {
	if(!request) return normalize(path);
	if(absoluteWinRegExp.test(request)) return normalize(request.replace(/\//g, "\\"));
	if(absoluteNixRegExp.test(request)) return normalize(request);
	if(path == "/") return normalize(path + request);
	if(absoluteWinRegExp.test(path)) return normalize(path.replace(/\//g, "\\") + "\\" + request.replace(/\//g, "\\"));
	if(absoluteNixRegExp.test(path)) return normalize(path + "/" + request);
	return normalize(path + "/" + request);
};

const REGEXP_NOT_MODULE = /^\.$|^\.[\\/]|^\.\.$|^\.\.[\\/]|^\/|^[A-Z]:[\\/]/i;
const REGEXP_DIRECTORY = /[\\/]$/i;


const memoizedJoin = new Map();


function withName(name, hook) {
	hook.name = name;
	return hook;
}

function toCamelCase(str) {
	return str.replace(/-([a-z])/g, str => str.substr(1).toUpperCase());
}

const deprecatedPushToMissing = util.deprecate((set, item) => {
	set.add(item);
}, "Resolver: 'missing' is now a Set. Use add instead of push.");

const deprecatedResolveContextInCallback = util.deprecate(x => {
	return x;
}, "Resolver: The callback argument was splitted into resolveContext and callback.");

const deprecatedHookAsString = util.deprecate(x => {
	return x;
}, "Resolver#doResolve: The type arguments (string) is now a hook argument (Hook). Pass a reference to the hook instead.");

class Resolver extends Tapable_1 {
	constructor(fileSystem) {
		super();
		this.fileSystem = fileSystem;
		this.hooks = {
			resolveStep: withName("resolveStep", new SyncHook_1(["hook", "request"])),
			noResolve: withName("noResolve", new SyncHook_1(["request", "error"])),
			resolve: withName(
				"resolve",
				new AsyncSeriesBailHook_1(["request", "resolveContext"])
			),
			result: new AsyncSeriesHook_1(["result", "resolveContext"])
		};
		this._pluginCompat.tap("Resolver: before/after", options => {
			if (/^before-/.test(options.name)) {
				options.name = options.name.substr(7);
				options.stage = -10;
			} else if (/^after-/.test(options.name)) {
				options.name = options.name.substr(6);
				options.stage = 10;
			}
		});
		this._pluginCompat.tap("Resolver: step hooks", options => {
			const name = options.name;
			const stepHook = !/^resolve(-s|S)tep$|^no(-r|R)esolve$/.test(name);
			if (stepHook) {
				options.async = true;
				this.ensureHook(name);
				const fn = options.fn;
				options.fn = (request, resolverContext, callback) => {
					const innerCallback = (err, result) => {
						if (err) return callback(err);
						if (result !== undefined) return callback(null, result);
						callback();
					};
					for (const key in resolverContext) {
						innerCallback[key] = resolverContext[key];
					}
					fn.call(this, request, innerCallback);
				};
			}
		});
	}

	ensureHook(name) {
		if (typeof name !== "string") return name;
		name = toCamelCase(name);
		if (/^before/.test(name)) {
			return this.ensureHook(
				name[6].toLowerCase() + name.substr(7)
			).withOptions({
				stage: -10
			});
		}
		if (/^after/.test(name)) {
			return this.ensureHook(
				name[5].toLowerCase() + name.substr(6)
			).withOptions({
				stage: 10
			});
		}
		const hook = this.hooks[name];
		if (!hook) {
			return (this.hooks[name] = withName(
				name,
				new AsyncSeriesBailHook_1(["request", "resolveContext"])
			));
		}
		return hook;
	}

	getHook(name) {
		if (typeof name !== "string") return name;
		name = toCamelCase(name);
		if (/^before/.test(name)) {
			return this.getHook(name[6].toLowerCase() + name.substr(7)).withOptions({
				stage: -10
			});
		}
		if (/^after/.test(name)) {
			return this.getHook(name[5].toLowerCase() + name.substr(6)).withOptions({
				stage: 10
			});
		}
		const hook = this.hooks[name];
		if (!hook) {
			throw new Error(`Hook ${name} doesn't exist`);
		}
		return hook;
	}

	resolveSync(context, path, request) {
		let err,
			result,
			sync = false;
		this.resolve(context, path, request, {}, (e, r) => {
			err = e;
			result = r;
			sync = true;
		});
		if (!sync)
			throw new Error(
				"Cannot 'resolveSync' because the fileSystem is not sync. Use 'resolve'!"
			);
		if (err) throw err;
		return result;
	}

	resolve(context, path, request, resolveContext, callback) {
		// TODO remove in enhanced-resolve 5
		// For backward compatiblity START
		if (typeof callback !== "function") {
			callback = deprecatedResolveContextInCallback(resolveContext);
			// resolveContext is a function containing additional properties
			// It's now used for resolveContext and callback
		}
		// END
		const obj = {
			context: context,
			path: path,
			request: request
		};

		const message = "resolve '" + request + "' in '" + path + "'";

		// Try to resolve assuming there is no error
		// We don't log stuff in this case
		return this.doResolve(
			this.hooks.resolve,
			obj,
			message,
			{
				missing: resolveContext.missing,
				stack: resolveContext.stack
			},
			(err, result) => {
				if (!err && result) {
					return callback(
						null,
						result.path === false ? false : result.path + (result.query || ""),
						result
					);
				}

				const localMissing = new Set();
				// TODO remove in enhanced-resolve 5
				localMissing.push = item => deprecatedPushToMissing(localMissing, item);
				const log = [];

				return this.doResolve(
					this.hooks.resolve,
					obj,
					message,
					{
						log: msg => {
							if (resolveContext.log) {
								resolveContext.log(msg);
							}
							log.push(msg);
						},
						missing: localMissing,
						stack: resolveContext.stack
					},
					(err, result) => {
						if (err) return callback(err);

						const error = new Error("Can't " + message);
						error.details = log.join("\n");
						error.missing = Array.from(localMissing);
						this.hooks.noResolve.call(obj, error);
						return callback(error);
					}
				);
			}
		);
	}

	doResolve(hook, request, message, resolveContext, callback) {
		// TODO remove in enhanced-resolve 5
		// For backward compatiblity START
		if (typeof callback !== "function") {
			callback = deprecatedResolveContextInCallback(resolveContext);
			// resolveContext is a function containing additional properties
			// It's now used for resolveContext and callback
		}
		if (typeof hook === "string") {
			const name = toCamelCase(hook);
			hook = deprecatedHookAsString(this.hooks[name]);
			if (!hook) {
				throw new Error(`Hook "${name}" doesn't exist`);
			}
		}
		// END
		if (typeof callback !== "function")
			throw new Error("callback is not a function " + Array.from(arguments));
		if (!resolveContext)
			throw new Error(
				"resolveContext is not an object " + Array.from(arguments)
			);

		const stackLine =
			hook.name +
			": (" +
			request.path +
			") " +
			(request.request || "") +
			(request.query || "") +
			(request.directory ? " directory" : "") +
			(request.module ? " module" : "");

		let newStack;
		if (resolveContext.stack) {
			newStack = new Set(resolveContext.stack);
			if (resolveContext.stack.has(stackLine)) {
				// Prevent recursion
				const recursionError = new Error(
					"Recursion in resolving\nStack:\n  " +
						Array.from(newStack).join("\n  ")
				);
				recursionError.recursion = true;
				if (resolveContext.log)
					resolveContext.log("abort resolving because of recursion");
				return callback(recursionError);
			}
			newStack.add(stackLine);
		} else {
			newStack = new Set([stackLine]);
		}
		this.hooks.resolveStep.call(hook, request);

		if (hook.isUsed()) {
			const innerContext = createInnerContext(
				{
					log: resolveContext.log,
					missing: resolveContext.missing,
					stack: newStack
				},
				message
			);
			return hook.callAsync(request, innerContext, (err, result) => {
				if (err) return callback(err);
				if (result) return callback(null, result);
				callback();
			});
		} else {
			callback();
		}
	}

	parse(identifier) {
		if (identifier === "") return null;
		const part = {
			request: "",
			query: "",
			module: false,
			directory: false,
			file: false
		};
		const idxQuery = identifier.indexOf("?");
		if (idxQuery === 0) {
			part.query = identifier;
		} else if (idxQuery > 0) {
			part.request = identifier.slice(0, idxQuery);
			part.query = identifier.slice(idxQuery);
		} else {
			part.request = identifier;
		}
		if (part.request) {
			part.module = this.isModule(part.request);
			part.directory = this.isDirectory(part.request);
			if (part.directory) {
				part.request = part.request.substr(0, part.request.length - 1);
			}
		}
		return part;
	}

	isModule(path) {
		return !REGEXP_NOT_MODULE.test(path);
	}

	isDirectory(path) {
		return REGEXP_DIRECTORY.test(path);
	}

	join(path, request) {
		let cacheEntry;
		let pathCache = memoizedJoin.get(path);
		if (typeof pathCache === "undefined") {
			memoizedJoin.set(path, (pathCache = new Map()));
		} else {
			cacheEntry = pathCache.get(request);
			if (typeof cacheEntry !== "undefined") return cacheEntry;
		}
		cacheEntry = join(path, request);
		pathCache.set(request, cacheEntry);
		return cacheEntry;
	}

	normalize(path) {
		return normalize(path);
	}
}

var Resolver_1 = Resolver;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

function SyncAsyncFileSystemDecorator(fs) {
	this.fs = fs;
	if (fs.statSync) {
		this.stat = function(arg, callback) {
			let result;
			try {
				result = fs.statSync(arg);
			} catch (e) {
				return callback(e);
			}
			callback(null, result);
		};
	}
	if (fs.readdirSync) {
		this.readdir = function(arg, callback) {
			let result;
			try {
				result = fs.readdirSync(arg);
			} catch (e) {
				return callback(e);
			}
			callback(null, result);
		};
	}
	if (fs.readFileSync) {
		this.readFile = function(arg, callback) {
			let result;
			try {
				result = fs.readFileSync(arg);
			} catch (e) {
				return callback(e);
			}
			callback(null, result);
		};
	}
	if (fs.readlinkSync) {
		this.readlink = function(arg, callback) {
			let result;
			try {
				result = fs.readlinkSync(arg);
			} catch (e) {
				return callback(e);
			}
			callback(null, result);
		};
	}
	if (fs.readJsonSync) {
		this.readJson = function(arg, callback) {
			let result;
			try {
				result = fs.readJsonSync(arg);
			} catch (e) {
				return callback(e);
			}
			callback(null, result);
		};
	}
}
var SyncAsyncFileSystemDecorator_1 = SyncAsyncFileSystemDecorator;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var ParsePlugin_1 = class ParsePlugin {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("ParsePlugin", (request, resolveContext, callback) => {
				const parsed = resolver.parse(request.request);
				const obj = Object.assign({}, request, parsed);
				if (request.query && !parsed.query) {
					obj.query = request.query;
				}
				if (parsed && resolveContext.log) {
					if (parsed.module) resolveContext.log("Parsed request is a module");
					if (parsed.directory)
						resolveContext.log("Parsed request is a directory");
				}
				resolver.doResolve(target, obj, null, resolveContext, callback);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var forEachBail = function forEachBail(array, iterator, callback) {
	if (array.length === 0) return callback();
	let currentPos = array.length;
	let currentResult;
	let done = [];
	for (let i = 0; i < array.length; i++) {
		const itCb = createIteratorCallback(i);
		iterator(array[i], itCb);
		if (currentPos === 0) break;
	}

	function createIteratorCallback(i) {
		return (...args) => {
			if (i >= currentPos) return; // ignore
			done.push(i);
			if (args.length > 0) {
				currentPos = i + 1;
				done = done.filter(item => {
					return item <= i;
				});
				currentResult = args;
			}
			if (done.length === currentPos) {
				callback.apply(null, currentResult);
				currentPos = 0;
			}
		};
	}
};

var withIndex = function forEachBailWithIndex(
	array,
	iterator,
	callback
) {
	if (array.length === 0) return callback();
	let currentPos = array.length;
	let currentResult;
	let done = [];
	for (let i = 0; i < array.length; i++) {
		const itCb = createIteratorCallback(i);
		iterator(array[i], i, itCb);
		if (currentPos === 0) break;
	}

	function createIteratorCallback(i) {
		return (...args) => {
			if (i >= currentPos) return; // ignore
			done.push(i);
			if (args.length > 0) {
				currentPos = i + 1;
				done = done.filter(item => {
					return item <= i;
				});
				currentResult = args;
			}
			if (done.length === currentPos) {
				callback.apply(null, currentResult);
				currentPos = 0;
			}
		};
	}
};
forEachBail.withIndex = withIndex;

function loadDescriptionFile(
	resolver,
	directory,
	filenames,
	resolveContext,
	callback
) {
	(function findDescriptionFile() {
		forEachBail(
			filenames,
			(filename, callback) => {
				const descriptionFilePath = resolver.join(directory, filename);
				if (resolver.fileSystem.readJson) {
					resolver.fileSystem.readJson(descriptionFilePath, (err, content) => {
						if (err) {
							if (typeof err.code !== "undefined") return callback();
							return onJson(err);
						}
						onJson(null, content);
					});
				} else {
					resolver.fileSystem.readFile(descriptionFilePath, (err, content) => {
						if (err) return callback();
						let json;
						try {
							json = JSON.parse(content);
						} catch (e) {
							onJson(e);
						}
						onJson(null, json);
					});
				}

				function onJson(err, content) {
					if (err) {
						if (resolveContext.log)
							resolveContext.log(
								descriptionFilePath + " (directory description file): " + err
							);
						else
							err.message =
								descriptionFilePath + " (directory description file): " + err;
						return callback(err);
					}
					callback(null, {
						content: content,
						directory: directory,
						path: descriptionFilePath
					});
				}
			},
			(err, result) => {
				if (err) return callback(err);
				if (result) {
					return callback(null, result);
				} else {
					directory = cdUp(directory);
					if (!directory) {
						return callback();
					} else {
						return findDescriptionFile();
					}
				}
			}
		);
	})();
}

function getField(content, field) {
	if (!content) return undefined;
	if (Array.isArray(field)) {
		let current = content;
		for (let j = 0; j < field.length; j++) {
			if (current === null || typeof current !== "object") {
				current = null;
				break;
			}
			current = current[field[j]];
		}
		if (typeof current === "object") {
			return current;
		}
	} else {
		if (typeof content[field] === "object") {
			return content[field];
		}
	}
}

function cdUp(directory) {
	if (directory === "/") return null;
	const i = directory.lastIndexOf("/"),
		j = directory.lastIndexOf("\\");
	const p = i < 0 ? j : j < 0 ? i : i < j ? j : i;
	if (p < 0) return null;
	return directory.substr(0, p || 1);
}

var loadDescriptionFile_1 = loadDescriptionFile;
var getField_1 = getField;
var cdUp_1 = cdUp;

var DescriptionFileUtils = {
	loadDescriptionFile: loadDescriptionFile_1,
	getField: getField_1,
	cdUp: cdUp_1
};

var DescriptionFilePlugin_1 = class DescriptionFilePlugin {
	constructor(source, filenames, target) {
		this.source = source;
		this.filenames = [].concat(filenames);
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync(
				"DescriptionFilePlugin",
				(request, resolveContext, callback) => {
					const directory = request.path;
					DescriptionFileUtils.loadDescriptionFile(
						resolver,
						directory,
						this.filenames,
						resolveContext,
						(err, result) => {
							if (err) return callback(err);
							if (!result) {
								if (resolveContext.missing) {
									this.filenames.forEach(filename => {
										resolveContext.missing.add(
											resolver.join(directory, filename)
										);
									});
								}
								if (resolveContext.log)
									resolveContext.log("No description file found");
								return callback();
							}
							const relativePath =
								"." +
								request.path
									.substr(result.directory.length)
									.replace(/\\/g, "/");
							const obj = Object.assign({}, request, {
								descriptionFilePath: result.path,
								descriptionFileData: result.content,
								descriptionFileRoot: result.directory,
								relativePath: relativePath
							});
							resolver.doResolve(
								target,
								obj,
								"using description file: " +
									result.path +
									" (relative path: " +
									relativePath +
									")",
								resolveContext,
								(err, result) => {
									if (err) return callback(err);

									// Don't allow other processing
									if (result === undefined) return callback(null, null);
									callback(null, result);
								}
							);
						}
					);
				}
			);
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var NextPlugin_1 = class NextPlugin {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("NextPlugin", (request, resolveContext, callback) => {
				resolver.doResolve(target, request, null, resolveContext, callback);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var TryNextPlugin_1 = class TryNextPlugin {
	constructor(source, message, target) {
		this.source = source;
		this.message = message;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("TryNextPlugin", (request, resolveContext, callback) => {
				resolver.doResolve(
					target,
					request,
					this.message,
					resolveContext,
					callback
				);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var ModuleKindPlugin_1 = class ModuleKindPlugin {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("ModuleKindPlugin", (request, resolveContext, callback) => {
				if (!request.module) return callback();
				const obj = Object.assign({}, request);
				delete obj.module;
				resolver.doResolve(
					target,
					obj,
					"resolve as module",
					resolveContext,
					(err, result) => {
						if (err) return callback(err);

						// Don't allow other alternatives
						if (result === undefined) return callback(null, null);
						callback(null, result);
					}
				);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var FileKindPlugin_1 = class FileKindPlugin {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("FileKindPlugin", (request, resolveContext, callback) => {
				if (request.directory) return callback();
				const obj = Object.assign({}, request);
				delete obj.directory;
				resolver.doResolve(target, obj, null, resolveContext, callback);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var JoinRequestPlugin_1 = class JoinRequestPlugin {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("JoinRequestPlugin", (request, resolveContext, callback) => {
				const obj = Object.assign({}, request, {
					path: resolver.join(request.path, request.request),
					relativePath:
						request.relativePath &&
						resolver.join(request.relativePath, request.request),
					request: undefined
				});
				resolver.doResolve(target, obj, null, resolveContext, callback);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var getPaths = function getPaths(path) {
	const parts = path.split(/(.*?[\\/]+)/);
	const paths = [path];
	const seqments = [parts[parts.length - 1]];
	let part = parts[parts.length - 1];
	path = path.substr(0, path.length - part.length - 1);
	for (let i = parts.length - 2; i > 2; i -= 2) {
		paths.push(path);
		part = parts[i];
		path = path.substr(0, path.length - part.length) || "/";
		seqments.push(part.substr(0, part.length - 1));
	}
	part = parts[1];
	seqments.push(part);
	paths.push(part);
	return {
		paths: paths,
		seqments: seqments
	};
};

var basename = function basename(path) {
	const i = path.lastIndexOf("/"),
		j = path.lastIndexOf("\\");
	const p = i < 0 ? j : j < 0 ? i : i < j ? j : i;
	if (p < 0) return null;
	const s = path.substr(p + 1);
	return s;
};
getPaths.basename = basename;

var ModulesInHierachicDirectoriesPlugin_1 = class ModulesInHierachicDirectoriesPlugin {
	constructor(source, directories, target) {
		this.source = source;
		this.directories = [].concat(directories);
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync(
				"ModulesInHierachicDirectoriesPlugin",
				(request, resolveContext, callback) => {
					const fs = resolver.fileSystem;
					const addrs = getPaths(request.path)
						.paths.map(p => {
							return this.directories.map(d => resolver.join(p, d));
						})
						.reduce((array, p) => {
							array.push.apply(array, p);
							return array;
						}, []);
					forEachBail(
						addrs,
						(addr, callback) => {
							fs.stat(addr, (err, stat) => {
								if (!err && stat && stat.isDirectory()) {
									const obj = Object.assign({}, request, {
										path: addr,
										request: "./" + request.request
									});
									const message = "looking for modules in " + addr;
									return resolver.doResolve(
										target,
										obj,
										message,
										resolveContext,
										callback
									);
								}
								if (resolveContext.log)
									resolveContext.log(
										addr + " doesn't exist or is not a directory"
									);
								if (resolveContext.missing) resolveContext.missing.add(addr);
								return callback();
							});
						},
						callback
					);
				}
			);
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var ModulesInRootPlugin_1 = class ModulesInRootPlugin {
	constructor(source, path, target) {
		this.source = source;
		this.path = path;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("ModulesInRootPlugin", (request, resolveContext, callback) => {
				const obj = Object.assign({}, request, {
					path: this.path,
					request: "./" + request.request
				});
				resolver.doResolve(
					target,
					obj,
					"looking for modules in " + this.path,
					resolveContext,
					callback
				);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

function startsWith(string, searchString) {
	const stringLength = string.length;
	const searchLength = searchString.length;

	// early out if the search length is greater than the search string
	if (searchLength > stringLength) {
		return false;
	}
	let index = -1;
	while (++index < searchLength) {
		if (string.charCodeAt(index) !== searchString.charCodeAt(index)) {
			return false;
		}
	}
	return true;
}

var AliasPlugin_1 = class AliasPlugin {
	constructor(source, options, target) {
		this.source = source;
		this.options = Array.isArray(options) ? options : [options];
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("AliasPlugin", (request, resolveContext, callback) => {
				const innerRequest = request.request || request.path;
				if (!innerRequest) return callback();
				for (const item of this.options) {
					if (
						innerRequest === item.name ||
						(!item.onlyModule && startsWith(innerRequest, item.name + "/"))
					) {
						if (
							innerRequest !== item.alias &&
							!startsWith(innerRequest, item.alias + "/")
						) {
							const newRequestStr =
								item.alias + innerRequest.substr(item.name.length);
							const obj = Object.assign({}, request, {
								request: newRequestStr
							});
							return resolver.doResolve(
								target,
								obj,
								"aliased with mapping '" +
									item.name +
									"': '" +
									item.alias +
									"' to '" +
									newRequestStr +
									"'",
								resolveContext,
								(err, result) => {
									if (err) return callback(err);

									// Don't allow other aliasing or raw request
									if (result === undefined) return callback(null, null);
									callback(null, result);
								}
							);
						}
					}
				}
				return callback();
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var getInnerRequest = function getInnerRequest(resolver, request) {
	if (
		typeof request.__innerRequest === "string" &&
		request.__innerRequest_request === request.request &&
		request.__innerRequest_relativePath === request.relativePath
	)
		return request.__innerRequest;
	let innerRequest;
	if (request.request) {
		innerRequest = request.request;
		if (/^\.\.?\//.test(innerRequest) && request.relativePath) {
			innerRequest = resolver.join(request.relativePath, innerRequest);
		}
	} else {
		innerRequest = request.relativePath;
	}
	request.__innerRequest_request = request.request;
	request.__innerRequest_relativePath = request.relativePath;
	return (request.__innerRequest = innerRequest);
};

var AliasFieldPlugin_1 = class AliasFieldPlugin {
	constructor(source, field, target) {
		this.source = source;
		this.field = field;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("AliasFieldPlugin", (request, resolveContext, callback) => {
				if (!request.descriptionFileData) return callback();
				const innerRequest = getInnerRequest(resolver, request);
				if (!innerRequest) return callback();
				const fieldData = DescriptionFileUtils.getField(
					request.descriptionFileData,
					this.field
				);
				if (typeof fieldData !== "object") {
					if (resolveContext.log)
						resolveContext.log(
							"Field '" +
								this.field +
								"' doesn't contain a valid alias configuration"
						);
					return callback();
				}
				const data1 = fieldData[innerRequest];
				const data2 = fieldData[innerRequest.replace(/^\.\//, "")];
				const data = typeof data1 !== "undefined" ? data1 : data2;
				if (data === innerRequest) return callback();
				if (data === undefined) return callback();
				if (data === false) {
					const ignoreObj = Object.assign({}, request, {
						path: false
					});
					return callback(null, ignoreObj);
				}
				const obj = Object.assign({}, request, {
					path: request.descriptionFileRoot,
					request: data
				});
				resolver.doResolve(
					target,
					obj,
					"aliased from description file " +
						request.descriptionFilePath +
						" with mapping '" +
						innerRequest +
						"' to '" +
						data +
						"'",
					resolveContext,
					(err, result) => {
						if (err) return callback(err);

						// Don't allow other aliasing or raw request
						if (result === undefined) return callback(null, null);
						callback(null, result);
					}
				);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

function globToRegExp(glob) {
	// * [^\\\/]*
	// /**/ /.+/
	// ^* \./.+ (concord special)
	// ? [^\\\/]
	// [!...] [^...]
	// [^...] [^...]
	// / [\\\/]
	// {...,...} (...|...)
	// ?(...|...) (...|...)?
	// +(...|...) (...|...)+
	// *(...|...) (...|...)*
	// @(...|...) (...|...)
	if (/^\(.+\)$/.test(glob)) {
		// allow to pass an RegExp in brackets
		return new RegExp(glob.substr(1, glob.length - 2));
	}
	const tokens = tokenize(glob);
	const process = createRoot();
	const regExpStr = tokens.map(process).join("");
	return new RegExp("^" + regExpStr + "$");
}

const SIMPLE_TOKENS = {
	"@(": "one",
	"?(": "zero-one",
	"+(": "one-many",
	"*(": "zero-many",
	"|": "segment-sep",
	"/**/": "any-path-segments",
	"**": "any-path",
	"*": "any-path-segment",
	"?": "any-char",
	"{": "or",
	"/": "path-sep",
	",": "comma",
	")": "closing-segment",
	"}": "closing-or"
};

function tokenize(glob) {
	return glob
		.split(
			/([@?+*]\(|\/\*\*\/|\*\*|[?*]|\[[!^]?(?:[^\]\\]|\\.)+\]|\{|,|\/|[|)}])/g
		)
		.map(item => {
			if (!item) return null;
			const t = SIMPLE_TOKENS[item];
			if (t) {
				return {
					type: t
				};
			}
			if (item[0] === "[") {
				if (item[1] === "^" || item[1] === "!") {
					return {
						type: "inverted-char-set",
						value: item.substr(2, item.length - 3)
					};
				} else {
					return {
						type: "char-set",
						value: item.substr(1, item.length - 2)
					};
				}
			}
			return {
				type: "string",
				value: item
			};
		})
		.filter(Boolean)
		.concat({
			type: "end"
		});
}

function createRoot() {
	const inOr = [];
	const process = createSeqment();
	let initial = true;
	return function(token) {
		switch (token.type) {
			case "or":
				inOr.push(initial);
				return "(";
			case "comma":
				if (inOr.length) {
					initial = inOr[inOr.length - 1];
					return "|";
				} else {
					return process(
						{
							type: "string",
							value: ","
						},
						initial
					);
				}
			case "closing-or":
				if (inOr.length === 0) throw new Error("Unmatched '}'");
				inOr.pop();
				return ")";
			case "end":
				if (inOr.length) throw new Error("Unmatched '{'");
				return process(token, initial);
			default: {
				const result = process(token, initial);
				initial = false;
				return result;
			}
		}
	};
}

function createSeqment() {
	const inSeqment = [];
	const process = createSimple();
	return function(token, initial) {
		switch (token.type) {
			case "one":
			case "one-many":
			case "zero-many":
			case "zero-one":
				inSeqment.push(token.type);
				return "(";
			case "segment-sep":
				if (inSeqment.length) {
					return "|";
				} else {
					return process(
						{
							type: "string",
							value: "|"
						},
						initial
					);
				}
			case "closing-segment": {
				const segment = inSeqment.pop();
				switch (segment) {
					case "one":
						return ")";
					case "one-many":
						return ")+";
					case "zero-many":
						return ")*";
					case "zero-one":
						return ")?";
				}
				throw new Error("Unexcepted segment " + segment);
			}
			case "end":
				if (inSeqment.length > 0) {
					throw new Error("Unmatched segment, missing ')'");
				}
				return process(token, initial);
			default:
				return process(token, initial);
		}
	};
}

function createSimple() {
	return function(token, initial) {
		switch (token.type) {
			case "path-sep":
				return "[\\\\/]+";
			case "any-path-segments":
				return "[\\\\/]+(?:(.+)[\\\\/]+)?";
			case "any-path":
				return "(.*)";
			case "any-path-segment":
				if (initial) {
					return "\\.[\\\\/]+(?:.*[\\\\/]+)?([^\\\\/]+)";
				} else {
					return "([^\\\\/]*)";
				}
			case "any-char":
				return "[^\\\\/]";
			case "inverted-char-set":
				return "[^" + token.value + "]";
			case "char-set":
				return "[" + token.value + "]";
			case "string":
				return token.value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
			case "end":
				return "";
			default:
				throw new Error("Unsupported token '" + token.type + "'");
		}
	};
}

var globToRegExp_2 = globToRegExp;

var globToRegExp_1 = {
	globToRegExp: globToRegExp_2
};

const globToRegExp$1 = globToRegExp_1.globToRegExp;

function parseType(type) {
	const items = type.split("+");
	const t = items.shift();
	return {
		type: t === "*" ? null : t,
		features: items
	};
}

function isTypeMatched(baseType, testedType) {
	if (typeof baseType === "string") baseType = parseType(baseType);
	if (typeof testedType === "string") testedType = parseType(testedType);
	if (testedType.type && testedType.type !== baseType.type) return false;
	return testedType.features.every(requiredFeature => {
		return baseType.features.indexOf(requiredFeature) >= 0;
	});
}

function isResourceTypeMatched(baseType, testedType) {
	baseType = baseType.split("/");
	testedType = testedType.split("/");
	if (baseType.length !== testedType.length) return false;
	for (let i = 0; i < baseType.length; i++) {
		if (!isTypeMatched(baseType[i], testedType[i])) return false;
	}
	return true;
}

function isResourceTypeSupported(context, type) {
	return (
		context.supportedResourceTypes &&
		context.supportedResourceTypes.some(supportedType => {
			return isResourceTypeMatched(supportedType, type);
		})
	);
}

function isEnvironment(context, env) {
	return (
		context.environments &&
		context.environments.every(environment => {
			return isTypeMatched(environment, env);
		})
	);
}

const globCache = {};

function getGlobRegExp(glob) {
	const regExp = globCache[glob] || (globCache[glob] = globToRegExp$1(glob));
	return regExp;
}

function matchGlob(glob, relativePath) {
	const regExp = getGlobRegExp(glob);
	return regExp.exec(relativePath);
}

function isGlobMatched(glob, relativePath) {
	return !!matchGlob(glob, relativePath);
}

function isConditionMatched(context, condition) {
	const items = condition.split("|");
	return items.some(function testFn(item) {
		item = item.trim();
		const inverted = /^!/.test(item);
		if (inverted) return !testFn(item.substr(1));
		if (/^[a-z]+:/.test(item)) {
			// match named condition
			const match = /^([a-z]+):\s*/.exec(item);
			const value = item.substr(match[0].length);
			const name = match[1];
			switch (name) {
				case "referrer":
					return isGlobMatched(value, context.referrer);
				default:
					return false;
			}
		} else if (item.indexOf("/") >= 0) {
			// match supported type
			return isResourceTypeSupported(context, item);
		} else {
			// match environment
			return isEnvironment(context, item);
		}
	});
}

function isKeyMatched(context, key) {
	for (;;) {
		const match = /^\[([^\]]+)\]\s*/.exec(key);
		if (!match) return key;
		key = key.substr(match[0].length);
		const condition = match[1];
		if (!isConditionMatched(context, condition)) {
			return false;
		}
	}
}

function getField$1(context, configuration, field) {
	let value;
	Object.keys(configuration).forEach(key => {
		const pureKey = isKeyMatched(context, key);
		if (pureKey === field) {
			value = configuration[key];
		}
	});
	return value;
}

function getMain(context, configuration) {
	return getField$1(context, configuration, "main");
}

function getExtensions(context, configuration) {
	return getField$1(context, configuration, "extensions");
}

function matchModule(context, configuration, request) {
	const modulesField = getField$1(context, configuration, "modules");
	if (!modulesField) return request;
	let newRequest = request;
	const keys = Object.keys(modulesField);
	let iteration = 0;
	let match;
	let index;
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const pureKey = isKeyMatched(context, key);
		match = matchGlob(pureKey, newRequest);
		if (match) {
			const value = modulesField[key];
			if (typeof value !== "string") {
				return value;
			} else if (/^\(.+\)$/.test(pureKey)) {
				newRequest = newRequest.replace(getGlobRegExp(pureKey), value);
			} else {
				index = 1;
				newRequest = value.replace(/(\/?\*)?\*/g, replaceMatcher);
			}
			i = -1;
			if (iteration++ > keys.length) {
				throw new Error("Request '" + request + "' matches recursively");
			}
		}
	}
	return newRequest;

	function replaceMatcher(find) {
		switch (find) {
			case "/**": {
				const m = match[index++];
				return m ? "/" + m : "";
			}
			case "**":
			case "*":
				return match[index++];
		}
	}
}

function matchType(context, configuration, relativePath) {
	const typesField = getField$1(context, configuration, "types");
	if (!typesField) return undefined;
	let type;
	Object.keys(typesField).forEach(key => {
		const pureKey = isKeyMatched(context, key);
		if (isGlobMatched(pureKey, relativePath)) {
			const value = typesField[key];
			if (!type && /\/\*$/.test(value))
				throw new Error(
					"value ('" +
						value +
						"') of key '" +
						key +
						"' contains '*', but there is no previous value defined"
				);
			type = value.replace(/\/\*$/, "/" + type);
		}
	});
	return type;
}

var parseType_1 = parseType;
var isTypeMatched_1 = isTypeMatched;
var isResourceTypeSupported_1 = isResourceTypeSupported;
var isEnvironment_1 = isEnvironment;
var isGlobMatched_1 = isGlobMatched;
var isConditionMatched_1 = isConditionMatched;
var isKeyMatched_1 = isKeyMatched;
var getField_1$1 = getField$1;
var getMain_1 = getMain;
var getExtensions_1 = getExtensions;
var matchModule_1 = matchModule;
var matchType_1 = matchType;

var concord = {
	parseType: parseType_1,
	isTypeMatched: isTypeMatched_1,
	isResourceTypeSupported: isResourceTypeSupported_1,
	isEnvironment: isEnvironment_1,
	isGlobMatched: isGlobMatched_1,
	isConditionMatched: isConditionMatched_1,
	isKeyMatched: isKeyMatched_1,
	getField: getField_1$1,
	getMain: getMain_1,
	getExtensions: getExtensions_1,
	matchModule: matchModule_1,
	matchType: matchType_1
};

var ConcordExtensionsPlugin_1 = class ConcordExtensionsPlugin {
	constructor(source, options, target) {
		this.source = source;
		this.options = options;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync(
				"ConcordExtensionsPlugin",
				(request, resolveContext, callback) => {
					const concordField = DescriptionFileUtils.getField(
						request.descriptionFileData,
						"concord"
					);
					if (!concordField) return callback();
					const extensions = concord.getExtensions(
						request.context,
						concordField
					);
					if (!extensions) return callback();
					forEachBail(
						extensions,
						(appending, callback) => {
							const obj = Object.assign({}, request, {
								path: request.path + appending,
								relativePath:
									request.relativePath && request.relativePath + appending
							});
							resolver.doResolve(
								target,
								obj,
								"concord extension: " + appending,
								resolveContext,
								callback
							);
						},
						(err, result) => {
							if (err) return callback(err);

							// Don't allow other processing
							if (result === undefined) return callback(null, null);
							callback(null, result);
						}
					);
				}
			);
	}
};

var ConcordMainPlugin_1 = class ConcordMainPlugin {
	constructor(source, options, target) {
		this.source = source;
		this.options = options;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("ConcordMainPlugin", (request, resolveContext, callback) => {
				if (request.path !== request.descriptionFileRoot) return callback();
				const concordField = DescriptionFileUtils.getField(
					request.descriptionFileData,
					"concord"
				);
				if (!concordField) return callback();
				const mainModule = concord.getMain(request.context, concordField);
				if (!mainModule) return callback();
				const obj = Object.assign({}, request, {
					request: mainModule
				});
				const filename = path.basename(request.descriptionFilePath);
				return resolver.doResolve(
					target,
					obj,
					"use " + mainModule + " from " + filename,
					resolveContext,
					callback
				);
			});
	}
};

var ConcordModulesPlugin_1 = class ConcordModulesPlugin {
	constructor(source, options, target) {
		this.source = source;
		this.options = options;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("ConcordModulesPlugin", (request, resolveContext, callback) => {
				const innerRequest = getInnerRequest(resolver, request);
				if (!innerRequest) return callback();
				const concordField = DescriptionFileUtils.getField(
					request.descriptionFileData,
					"concord"
				);
				if (!concordField) return callback();
				const data = concord.matchModule(
					request.context,
					concordField,
					innerRequest
				);
				if (data === innerRequest) return callback();
				if (data === undefined) return callback();
				if (data === false) {
					const ignoreObj = Object.assign({}, request, {
						path: false
					});
					return callback(null, ignoreObj);
				}
				const obj = Object.assign({}, request, {
					path: request.descriptionFileRoot,
					request: data
				});
				resolver.doResolve(
					target,
					obj,
					"aliased from description file " +
						request.descriptionFilePath +
						" with mapping '" +
						innerRequest +
						"' to '" +
						data +
						"'",
					resolveContext,
					(err, result) => {
						if (err) return callback(err);

						// Don't allow other aliasing or raw request
						if (result === undefined) return callback(null, null);
						callback(null, result);
					}
				);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var DirectoryExistsPlugin_1 = class DirectoryExistsPlugin {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync(
				"DirectoryExistsPlugin",
				(request, resolveContext, callback) => {
					const fs = resolver.fileSystem;
					const directory = request.path;
					fs.stat(directory, (err, stat) => {
						if (err || !stat) {
							if (resolveContext.missing) resolveContext.missing.add(directory);
							if (resolveContext.log)
								resolveContext.log(directory + " doesn't exist");
							return callback();
						}
						if (!stat.isDirectory()) {
							if (resolveContext.missing) resolveContext.missing.add(directory);
							if (resolveContext.log)
								resolveContext.log(directory + " is not a directory");
							return callback();
						}
						resolver.doResolve(
							target,
							request,
							"existing directory",
							resolveContext,
							callback
						);
					});
				}
			);
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var FileExistsPlugin_1 = class FileExistsPlugin {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		const fs = resolver.fileSystem;
		resolver
			.getHook(this.source)
			.tapAsync("FileExistsPlugin", (request, resolveContext, callback) => {
				const file = request.path;
				fs.stat(file, (err, stat) => {
					if (err || !stat) {
						if (resolveContext.missing) resolveContext.missing.add(file);
						if (resolveContext.log) resolveContext.log(file + " doesn't exist");
						return callback();
					}
					if (!stat.isFile()) {
						if (resolveContext.missing) resolveContext.missing.add(file);
						if (resolveContext.log) resolveContext.log(file + " is not a file");
						return callback();
					}
					resolver.doResolve(
						target,
						request,
						"existing file: " + file,
						resolveContext,
						callback
					);
				});
			});
	}
};

var SymlinkPlugin_1 = class SymlinkPlugin {
	constructor(source, target) {
		this.source = source;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		const fs = resolver.fileSystem;
		resolver
			.getHook(this.source)
			.tapAsync("SymlinkPlugin", (request, resolveContext, callback) => {
				const pathsResult = getPaths(request.path);
				const pathSeqments = pathsResult.seqments;
				const paths = pathsResult.paths;

				let containsSymlink = false;
				forEachBail.withIndex(
					paths,
					(path, idx, callback) => {
						fs.readlink(path, (err, result) => {
							if (!err && result) {
								pathSeqments[idx] = result;
								containsSymlink = true;
								// Shortcut when absolute symlink found
								if (/^(\/|[a-zA-Z]:($|\\))/.test(result))
									return callback(null, idx);
							}
							callback();
						});
					},
					(err, idx) => {
						if (!containsSymlink) return callback();
						const resultSeqments =
							typeof idx === "number"
								? pathSeqments.slice(0, idx + 1)
								: pathSeqments.slice();
						const result = resultSeqments.reverse().reduce((a, b) => {
							return resolver.join(a, b);
						});
						const obj = Object.assign({}, request, {
							path: result
						});
						resolver.doResolve(
							target,
							obj,
							"resolved symlink to " + result,
							resolveContext,
							callback
						);
					}
				);
			});
	}
};

var MainFieldPlugin_1 = class MainFieldPlugin {
	constructor(source, options, target) {
		this.source = source;
		this.options = options;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("MainFieldPlugin", (request, resolveContext, callback) => {
				if (request.path !== request.descriptionFileRoot) return callback();
				if (request.alreadyTriedMainField === request.descriptionFilePath)
					return callback();
				const content = request.descriptionFileData;
				const filename = path.basename(request.descriptionFilePath);
				let mainModule;
				const field = this.options.name;
				if (Array.isArray(field)) {
					let current = content;
					for (let j = 0; j < field.length; j++) {
						if (current === null || typeof current !== "object") {
							current = null;
							break;
						}
						current = current[field[j]];
					}
					if (typeof current === "string") {
						mainModule = current;
					}
				} else {
					if (typeof content[field] === "string") {
						mainModule = content[field];
					}
				}
				if (!mainModule) return callback();
				if (this.options.forceRelative && !/^\.\.?\//.test(mainModule))
					mainModule = "./" + mainModule;
				const obj = Object.assign({}, request, {
					request: mainModule,
					alreadyTriedMainField: request.descriptionFilePath
				});
				return resolver.doResolve(
					target,
					obj,
					"use " +
						mainModule +
						" from " +
						this.options.name +
						" in " +
						filename,
					resolveContext,
					callback
				);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var UseFilePlugin_1 = class UseFilePlugin {
	constructor(source, filename, target) {
		this.source = source;
		this.filename = filename;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("UseFilePlugin", (request, resolveContext, callback) => {
				const filePath = resolver.join(request.path, this.filename);
				const obj = Object.assign({}, request, {
					path: filePath,
					relativePath:
						request.relativePath &&
						resolver.join(request.relativePath, this.filename)
				});
				resolver.doResolve(
					target,
					obj,
					"using path: " + filePath,
					resolveContext,
					callback
				);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var AppendPlugin_1 = class AppendPlugin {
	constructor(source, appending, target) {
		this.source = source;
		this.appending = appending;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("AppendPlugin", (request, resolveContext, callback) => {
				const obj = Object.assign({}, request, {
					path: request.path + this.appending,
					relativePath:
						request.relativePath && request.relativePath + this.appending
				});
				resolver.doResolve(
					target,
					obj,
					this.appending,
					resolveContext,
					callback
				);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Ivan Kopeykin @vankop
*/

/** @typedef {import("./Resolver")} Resolver */
/** @typedef {import("./Resolver").ResolveStepHook} ResolveStepHook */

class RootPlugin {
	/**
	 * @param {string | ResolveStepHook} source source hook
	 * @param {Array<string>} root roots
	 * @param {string | ResolveStepHook} target target hook
	 */
	constructor(source, root, target) {
		this.root = root;
		this.source = source;
		this.target = target;
	}

	/**
	 * @param {Resolver} resolver the resolver
	 * @returns {void}
	 */
	apply(resolver) {
		const target = resolver.ensureHook(this.target);

		resolver
			.getHook(this.source)
			.tapAsync("RootPlugin", (request, resolveContext, callback) => {
				const req = request.request;
				if (!req) return callback();
				if (!req.startsWith("/")) return callback();

				const path = resolver.join(this.root, req.slice(1));
				const obj = Object.assign(request, {
					path,
					relativePath: request.relativePath && path
				});
				resolver.doResolve(
					target,
					obj,
					`root path ${this.root}`,
					resolveContext,
					callback
				);
			});
	}
}

var RootPlugin_1 = RootPlugin;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Ivan Kopeykin @vankop
*/

const slashCode = "/".charCodeAt(0);
const backslashCode = "\\".charCodeAt(0);

const isInside = (path, parent) => {
	if (!path.startsWith(parent)) return false;
	if (path.length === parent.length) return true;
	const charCode = path.charCodeAt(parent.length);
	return charCode === slashCode || charCode === backslashCode;
};

var RestrictionsPlugin_1 = class RestrictionsPlugin {
	constructor(source, restrictions) {
		this.source = source;
		this.restrictions = restrictions;
	}

	apply(resolver) {
		resolver
			.getHook(this.source)
			.tapAsync("RestrictionsPlugin", (request, resolveContext, callback) => {
				if (typeof request.path === "string") {
					const path = request.path;

					for (let i = 0; i < this.restrictions.length; i++) {
						const rule = this.restrictions[i];
						if (typeof rule === "string") {
							if (!isInside(path, rule)) {
								if (resolveContext.log) {
									resolveContext.log(
										`${path} is not inside of the restriction ${rule}`
									);
								}
								return callback(null, null);
							}
						} else if (!rule.test(path)) {
							if (resolveContext.log) {
								resolveContext.log(
									`${path} doesn't match the restriction ${rule}`
								);
							}
							return callback(null, null);
						}
					}
				}

				callback();
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var ResultPlugin_1 = class ResultPlugin {
	constructor(source) {
		this.source = source;
	}

	apply(resolver) {
		this.source.tapAsync(
			"ResultPlugin",
			(request, resolverContext, callback) => {
				const obj = Object.assign({}, request);
				if (resolverContext.log)
					resolverContext.log("reporting result " + obj.path);
				resolver.hooks.result.callAsync(obj, resolverContext, err => {
					if (err) return callback(err);
					callback(null, obj);
				});
			}
		);
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var ModuleAppendPlugin_1 = class ModuleAppendPlugin {
	constructor(source, appending, target) {
		this.source = source;
		this.appending = appending;
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("ModuleAppendPlugin", (request, resolveContext, callback) => {
				const i = request.request.indexOf("/"),
					j = request.request.indexOf("\\");
				const p = i < 0 ? j : j < 0 ? i : i < j ? i : j;
				let moduleName, remainingRequest;
				if (p < 0) {
					moduleName = request.request;
					remainingRequest = "";
				} else {
					moduleName = request.request.substr(0, p);
					remainingRequest = request.request.substr(p);
				}
				if (moduleName === "." || moduleName === "..") return callback();
				const moduleFinalName = moduleName + this.appending;
				const obj = Object.assign({}, request, {
					request: moduleFinalName + remainingRequest
				});
				resolver.doResolve(
					target,
					obj,
					"module variation " + moduleFinalName,
					resolveContext,
					callback
				);
			});
	}
};

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

function getCacheId(request, withContext) {
	return JSON.stringify({
		context: withContext ? request.context : "",
		path: request.path,
		query: request.query,
		request: request.request
	});
}

var UnsafeCachePlugin_1 = class UnsafeCachePlugin {
	constructor(source, filterPredicate, cache, withContext, target) {
		this.source = source;
		this.filterPredicate = filterPredicate;
		this.withContext = withContext;
		this.cache = cache || {};
		this.target = target;
	}

	apply(resolver) {
		const target = resolver.ensureHook(this.target);
		resolver
			.getHook(this.source)
			.tapAsync("UnsafeCachePlugin", (request, resolveContext, callback) => {
				if (!this.filterPredicate(request)) return callback();
				const cacheId = getCacheId(request, this.withContext);
				const cacheEntry = this.cache[cacheId];
				if (cacheEntry) {
					return callback(null, cacheEntry);
				}
				resolver.doResolve(
					target,
					request,
					null,
					resolveContext,
					(err, result) => {
						if (err) return callback(err);
						if (result) return callback(null, (this.cache[cacheId] = result));
						callback();
					}
				);
			});
	}
};

var createResolver = function(options) {
	//// OPTIONS ////

	// A list of directories to resolve modules from, can be absolute path or folder name
	let modules = options.modules || ["node_modules"];

	// A list of description files to read from
	const descriptionFiles = options.descriptionFiles || ["package.json"];

	// A list of additional resolve plugins which should be applied
	// The slice is there to create a copy, because otherwise pushing into plugins
	// changes the original options.plugins array, causing duplicate plugins
	const plugins = (options.plugins && options.plugins.slice()) || [];

	// A list of main fields in description files
	let mainFields = options.mainFields || ["main"];

	// A list of alias fields in description files
	const aliasFields = options.aliasFields || [];

	// A list of main files in directories
	const mainFiles = options.mainFiles || ["index"];

	// A list of extensions which should be tried for files
	let extensions = options.extensions || [".js", ".json", ".node"];

	// Enforce that a extension from extensions must be used
	const enforceExtension = options.enforceExtension || false;

	// A list of module extensions which should be tried for modules
	let moduleExtensions = options.moduleExtensions || [];

	// Enforce that a extension from moduleExtensions must be used
	const enforceModuleExtension = options.enforceModuleExtension || false;

	// A list of module alias configurations or an object which maps key to value
	let alias = options.alias || [];

	// Resolve symlinks to their symlinked location
	const symlinks =
		typeof options.symlinks !== "undefined" ? options.symlinks : true;

	// Resolve to a context instead of a file
	const resolveToContext = options.resolveToContext || false;

	// A list of root paths
	const roots = options.roots || [];

	const restrictions = options.restrictions || [];

	// Use this cache object to unsafely cache the successful requests
	let unsafeCache = options.unsafeCache || false;

	// Whether or not the unsafeCache should include request context as part of the cache key.
	const cacheWithContext =
		typeof options.cacheWithContext !== "undefined"
			? options.cacheWithContext
			: true;

	// Enable concord description file instructions
	const enableConcord = options.concord || false;

	// A function which decides whether a request should be cached or not.
	// an object is passed with `path` and `request` properties.
	const cachePredicate =
		options.cachePredicate ||
		function() {
			return true;
		};

	// The file system which should be used
	const fileSystem = options.fileSystem;

	// Use only the sync constiants of the file system calls
	const useSyncFileSystemCalls = options.useSyncFileSystemCalls;

	// A prepared Resolver to which the plugins are attached
	let resolver = options.resolver;

	//// options processing ////

	if (!resolver) {
		resolver = new Resolver_1(
			useSyncFileSystemCalls
				? new SyncAsyncFileSystemDecorator_1(fileSystem)
				: fileSystem
		);
	}

	extensions = [].concat(extensions);
	moduleExtensions = [].concat(moduleExtensions);

	modules = mergeFilteredToArray([].concat(modules), item => {
		return !isAbsolutePath(item);
	});

	mainFields = mainFields.map(item => {
		if (typeof item === "string" || Array.isArray(item)) {
			item = {
				name: item,
				forceRelative: true
			};
		}
		return item;
	});

	if (typeof alias === "object" && !Array.isArray(alias)) {
		alias = Object.keys(alias).map(key => {
			let onlyModule = false;
			let obj = alias[key];
			if (/\$$/.test(key)) {
				onlyModule = true;
				key = key.substr(0, key.length - 1);
			}
			if (typeof obj === "string") {
				obj = {
					alias: obj
				};
			}
			obj = Object.assign(
				{
					name: key,
					onlyModule: onlyModule
				},
				obj
			);
			return obj;
		});
	}

	if (unsafeCache && typeof unsafeCache !== "object") {
		unsafeCache = {};
	}

	//// pipeline ////

	resolver.ensureHook("resolve");
	resolver.ensureHook("parsedResolve");
	resolver.ensureHook("describedResolve");
	resolver.ensureHook("rawModule");
	resolver.ensureHook("module");
	resolver.ensureHook("relative");
	resolver.ensureHook("describedRelative");
	resolver.ensureHook("directory");
	resolver.ensureHook("existingDirectory");
	resolver.ensureHook("undescribedRawFile");
	resolver.ensureHook("rawFile");
	resolver.ensureHook("file");
	resolver.ensureHook("existingFile");
	resolver.ensureHook("resolved");

	// resolve
	if (unsafeCache) {
		plugins.push(
			new UnsafeCachePlugin_1(
				"resolve",
				cachePredicate,
				unsafeCache,
				cacheWithContext,
				"new-resolve"
			)
		);
		plugins.push(new ParsePlugin_1("new-resolve", "parsed-resolve"));
	} else {
		plugins.push(new ParsePlugin_1("resolve", "parsed-resolve"));
	}

	// parsed-resolve
	plugins.push(
		new DescriptionFilePlugin_1(
			"parsed-resolve",
			descriptionFiles,
			"described-resolve"
		)
	);
	plugins.push(new NextPlugin_1("after-parsed-resolve", "described-resolve"));

	// described-resolve
	if (alias.length > 0)
		plugins.push(new AliasPlugin_1("described-resolve", alias, "resolve"));
	if (enableConcord) {
		plugins.push(new ConcordModulesPlugin_1("described-resolve", {}, "resolve"));
	}
	aliasFields.forEach(item => {
		plugins.push(new AliasFieldPlugin_1("described-resolve", item, "resolve"));
	});
	plugins.push(new ModuleKindPlugin_1("after-described-resolve", "raw-module"));
	roots.forEach(root => {
		plugins.push(new RootPlugin_1("after-described-resolve", root, "relative"));
	});
	plugins.push(new JoinRequestPlugin_1("after-described-resolve", "relative"));

	// raw-module
	moduleExtensions.forEach(item => {
		plugins.push(new ModuleAppendPlugin_1("raw-module", item, "module"));
	});
	if (!enforceModuleExtension)
		plugins.push(new TryNextPlugin_1("raw-module", null, "module"));

	// module
	modules.forEach(item => {
		if (Array.isArray(item))
			plugins.push(
				new ModulesInHierachicDirectoriesPlugin_1("module", item, "resolve")
			);
		else plugins.push(new ModulesInRootPlugin_1("module", item, "resolve"));
	});

	// relative
	plugins.push(
		new DescriptionFilePlugin_1(
			"relative",
			descriptionFiles,
			"described-relative"
		)
	);
	plugins.push(new NextPlugin_1("after-relative", "described-relative"));

	// described-relative
	plugins.push(new FileKindPlugin_1("described-relative", "raw-file"));
	plugins.push(
		new TryNextPlugin_1("described-relative", "as directory", "directory")
	);

	// directory
	plugins.push(new DirectoryExistsPlugin_1("directory", "existing-directory"));

	if (resolveToContext) {
		// existing-directory
		plugins.push(new NextPlugin_1("existing-directory", "resolved"));
	} else {
		// existing-directory
		if (enableConcord) {
			plugins.push(new ConcordMainPlugin_1("existing-directory", {}, "resolve"));
		}
		mainFields.forEach(item => {
			plugins.push(new MainFieldPlugin_1("existing-directory", item, "resolve"));
		});
		mainFiles.forEach(item => {
			plugins.push(
				new UseFilePlugin_1("existing-directory", item, "undescribed-raw-file")
			);
		});

		// undescribed-raw-file
		plugins.push(
			new DescriptionFilePlugin_1(
				"undescribed-raw-file",
				descriptionFiles,
				"raw-file"
			)
		);
		plugins.push(new NextPlugin_1("after-undescribed-raw-file", "raw-file"));

		// raw-file
		if (!enforceExtension) {
			plugins.push(new TryNextPlugin_1("raw-file", "no extension", "file"));
		}
		if (enableConcord) {
			plugins.push(new ConcordExtensionsPlugin_1("raw-file", {}, "file"));
		}
		extensions.forEach(item => {
			plugins.push(new AppendPlugin_1("raw-file", item, "file"));
		});

		// file
		if (alias.length > 0)
			plugins.push(new AliasPlugin_1("file", alias, "resolve"));
		if (enableConcord) {
			plugins.push(new ConcordModulesPlugin_1("file", {}, "resolve"));
		}
		aliasFields.forEach(item => {
			plugins.push(new AliasFieldPlugin_1("file", item, "resolve"));
		});
		if (symlinks) plugins.push(new SymlinkPlugin_1("file", "relative"));
		plugins.push(new FileExistsPlugin_1("file", "existing-file"));

		// existing-file
		plugins.push(new NextPlugin_1("existing-file", "resolved"));
	}

	// resolved
	if (restrictions.length > 0) {
		plugins.push(new RestrictionsPlugin_1(resolver.hooks.resolved, restrictions));
	}
	plugins.push(new ResultPlugin_1(resolver.hooks.resolved));

	//// RESOLVER ////

	plugins.forEach(plugin => {
		plugin.apply(resolver);
	});

	return resolver;
};

function mergeFilteredToArray(array, filter) {
	return array.reduce((array, item) => {
		if (filter(item)) {
			const lastElement = array[array.length - 1];
			if (Array.isArray(lastElement)) {
				lastElement.push(item);
			} else {
				array.push([item]);
			}
			return array;
		} else {
			array.push(item);
			return array;
		}
	}, []);
}

function isAbsolutePath(path) {
	return /^[A-Z]:|^\//.test(path);
}

var ResolverFactory = {
	createResolver: createResolver
};

var origCwd = process.cwd;
var cwd = null;

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process);
  return cwd
};
try {
  process.cwd();
} catch (er) {}

var chdir = process.chdir;
process.chdir = function(d) {
  cwd = null;
  chdir.call(process, d);
};

var polyfills = patch;

function patch (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs);
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs);
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown);
  fs.fchown = chownFix(fs.fchown);
  fs.lchown = chownFix(fs.lchown);

  fs.chmod = chmodFix(fs.chmod);
  fs.fchmod = chmodFix(fs.fchmod);
  fs.lchmod = chmodFix(fs.lchmod);

  fs.chownSync = chownFixSync(fs.chownSync);
  fs.fchownSync = chownFixSync(fs.fchownSync);
  fs.lchownSync = chownFixSync(fs.lchownSync);

  fs.chmodSync = chmodFixSync(fs.chmodSync);
  fs.fchmodSync = chmodFixSync(fs.fchmodSync);
  fs.lchmodSync = chmodFixSync(fs.lchmodSync);

  fs.stat = statFix(fs.stat);
  fs.fstat = statFix(fs.fstat);
  fs.lstat = statFix(fs.lstat);

  fs.statSync = statFixSync(fs.statSync);
  fs.fstatSync = statFixSync(fs.fstatSync);
  fs.lstatSync = statFixSync(fs.lstatSync);

  // if lchmod/lchown do not exist, then make them no-ops
  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchmodSync = function () {};
  }
  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb);
    };
    fs.lchownSync = function () {};
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = (function (fs$rename) { return function (from, to, cb) {
      var start = Date.now();
      var backoff = 0;
      fs$rename(from, to, function CB (er) {
        if (er
            && (er.code === "EACCES" || er.code === "EPERM")
            && Date.now() - start < 60000) {
          setTimeout(function() {
            fs.stat(to, function (stater, st) {
              if (stater && stater.code === "ENOENT")
                fs$rename(from, to, CB);
              else
                cb(er);
            });
          }, backoff);
          if (backoff < 100)
            backoff += 10;
          return;
        }
        if (cb) cb(er);
      });
    }})(fs.rename);
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = (function (fs$read) {
    function read (fd, buffer, offset, length, position, callback_) {
      var callback;
      if (callback_ && typeof callback_ === 'function') {
        var eagCounter = 0;
        callback = function (er, _, __) {
          if (er && er.code === 'EAGAIN' && eagCounter < 10) {
            eagCounter ++;
            return fs$read.call(fs, fd, buffer, offset, length, position, callback)
          }
          callback_.apply(this, arguments);
        };
      }
      return fs$read.call(fs, fd, buffer, offset, length, position, callback)
    }

    // This ensures `util.promisify` works as it does for native `fs.read`.
    read.__proto__ = fs$read;
    return read
  })(fs.read);

  fs.readSync = (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0;
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++;
          continue
        }
        throw er
      }
    }
  }})(fs.readSync);

  function patchLchmod (fs) {
    fs.lchmod = function (path, mode, callback) {
      fs.open( path
             , constants.O_WRONLY | constants.O_SYMLINK
             , mode
             , function (err, fd) {
        if (err) {
          if (callback) callback(err);
          return
        }
        // prefer to return the chmod error, if one occurs,
        // but still try to close, and report closing errors if they occur.
        fs.fchmod(fd, mode, function (err) {
          fs.close(fd, function(err2) {
            if (callback) callback(err || err2);
          });
        });
      });
    };

    fs.lchmodSync = function (path, mode) {
      var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);

      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      var threw = true;
      var ret;
      try {
        ret = fs.fchmodSync(fd, mode);
        threw = false;
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd);
          } catch (er) {}
        } else {
          fs.closeSync(fd);
        }
      }
      return ret
    };
  }

  function patchLutimes (fs) {
    if (constants.hasOwnProperty("O_SYMLINK")) {
      fs.lutimes = function (path, at, mt, cb) {
        fs.open(path, constants.O_SYMLINK, function (er, fd) {
          if (er) {
            if (cb) cb(er);
            return
          }
          fs.futimes(fd, at, mt, function (er) {
            fs.close(fd, function (er2) {
              if (cb) cb(er || er2);
            });
          });
        });
      };

      fs.lutimesSync = function (path, at, mt) {
        var fd = fs.openSync(path, constants.O_SYMLINK);
        var ret;
        var threw = true;
        try {
          ret = fs.futimesSync(fd, at, mt);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs.closeSync(fd);
            } catch (er) {}
          } else {
            fs.closeSync(fd);
          }
        }
        return ret
      };

    } else {
      fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb); };
      fs.lutimesSync = function () {};
    }
  }

  function chmodFix (orig) {
    if (!orig) return orig
    return function (target, mode, cb) {
      return orig.call(fs, target, mode, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chmodFixSync (orig) {
    if (!orig) return orig
    return function (target, mode) {
      try {
        return orig.call(fs, target, mode)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }


  function chownFix (orig) {
    if (!orig) return orig
    return function (target, uid, gid, cb) {
      return orig.call(fs, target, uid, gid, function (er) {
        if (chownErOk(er)) er = null;
        if (cb) cb.apply(this, arguments);
      })
    }
  }

  function chownFixSync (orig) {
    if (!orig) return orig
    return function (target, uid, gid) {
      try {
        return orig.call(fs, target, uid, gid)
      } catch (er) {
        if (!chownErOk(er)) throw er
      }
    }
  }

  function statFix (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = null;
      }
      function callback (er, stats) {
        if (stats) {
          if (stats.uid < 0) stats.uid += 0x100000000;
          if (stats.gid < 0) stats.gid += 0x100000000;
        }
        if (cb) cb.apply(this, arguments);
      }
      return options ? orig.call(fs, target, options, callback)
        : orig.call(fs, target, callback)
    }
  }

  function statFixSync (orig) {
    if (!orig) return orig
    // Older versions of Node erroneously returned signed integers for
    // uid + gid.
    return function (target, options) {
      var stats = options ? orig.call(fs, target, options)
        : orig.call(fs, target);
      if (stats.uid < 0) stats.uid += 0x100000000;
      if (stats.gid < 0) stats.gid += 0x100000000;
      return stats;
    }
  }

  // ENOSYS means that the fs doesn't support the op. Just ignore
  // that, because it doesn't matter.
  //
  // if there's no getuid, or if getuid() is something other
  // than 0, and the error is EINVAL or EPERM, then just ignore
  // it.
  //
  // This specific case is a silent failure in cp, install, tar,
  // and most other unix tools that manage permissions.
  //
  // When running as root, or if other types of errors are
  // encountered, then it's strict.
  function chownErOk (er) {
    if (!er)
      return true

    if (er.code === "ENOSYS")
      return true

    var nonroot = !process.getuid || process.getuid() !== 0;
    if (nonroot) {
      if (er.code === "EINVAL" || er.code === "EPERM")
        return true
    }

    return false
  }
}

var Stream = stream.Stream;

var legacyStreams = legacy;

function legacy (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    });
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}

var clone_1 = clone;

function clone (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: obj.__proto__ };
  else
    var copy = Object.create(null);

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
  });

  return copy
}

var gracefulFs = createCommonjsModule(function (module) {
/* istanbul ignore next - node 0.x polyfill */
var gracefulQueue;
var previousSymbol;

/* istanbul ignore else - node 0.x polyfill */
if (typeof Symbol === 'function' && typeof Symbol.for === 'function') {
  gracefulQueue = Symbol.for('graceful-fs.queue');
  // This is used in testing by future versions
  previousSymbol = Symbol.for('graceful-fs.previous');
} else {
  gracefulQueue = '___graceful-fs.queue';
  previousSymbol = '___graceful-fs.previous';
}

function noop () {}

function publishQueue(context, queue) {
  Object.defineProperty(context, gracefulQueue, {
    get: function() {
      return queue
    }
  });
}

var debug = noop;
if (util.debuglog)
  debug = util.debuglog('gfs4');
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util.format.apply(util, arguments);
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ');
    console.error(m);
  };

// Once time initialization
if (!fs[gracefulQueue]) {
  // This queue can be shared by multiple loaded instances
  var queue = commonjsGlobal[gracefulQueue] || [];
  publishQueue(fs, queue);

  // Patch fs.close/closeSync to shared queue version, because we need
  // to retry() whenever a close happens *anywhere* in the program.
  // This is essential when multiple graceful-fs instances are
  // in play at the same time.
  fs.close = (function (fs$close) {
    function close (fd, cb) {
      return fs$close.call(fs, fd, function (err) {
        // This function uses the graceful-fs shared queue
        if (!err) {
          retry();
        }

        if (typeof cb === 'function')
          cb.apply(this, arguments);
      })
    }

    Object.defineProperty(close, previousSymbol, {
      value: fs$close
    });
    return close
  })(fs.close);

  fs.closeSync = (function (fs$closeSync) {
    function closeSync (fd) {
      // This function uses the graceful-fs shared queue
      fs$closeSync.apply(fs, arguments);
      retry();
    }

    Object.defineProperty(closeSync, previousSymbol, {
      value: fs$closeSync
    });
    return closeSync
  })(fs.closeSync);

  if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
    process.on('exit', function() {
      debug(fs[gracefulQueue]);
      assert.equal(fs[gracefulQueue].length, 0);
    });
  }
}

if (!commonjsGlobal[gracefulQueue]) {
  publishQueue(commonjsGlobal, fs[gracefulQueue]);
}

module.exports = patch(clone_1(fs));
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
    module.exports = patch(fs);
    fs.__patched = true;
}

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs);
  fs.gracefulify = patch;

  fs.createReadStream = createReadStream;
  fs.createWriteStream = createWriteStream;
  var fs$readFile = fs.readFile;
  fs.readFile = readFile;
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile;
  fs.writeFile = writeFile;
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile;
  if (fs$appendFile)
    fs.appendFile = appendFile;
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null;

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  var fs$readdir = fs.readdir;
  fs.readdir = readdir;
  function readdir (path, options, cb) {
    var args = [path];
    if (typeof options !== 'function') {
      args.push(options);
    } else {
      cb = options;
    }
    args.push(go$readdir$cb);

    return go$readdir(args)

    function go$readdir$cb (err, files) {
      if (files && files.sort)
        files.sort();

      if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
        enqueue([go$readdir, [args]]);

      else {
        if (typeof cb === 'function')
          cb.apply(this, arguments);
        retry();
      }
    }
  }

  function go$readdir (args) {
    return fs$readdir.apply(fs, args)
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacyStreams(fs);
    ReadStream = legStreams.ReadStream;
    WriteStream = legStreams.WriteStream;
  }

  var fs$ReadStream = fs.ReadStream;
  if (fs$ReadStream) {
    ReadStream.prototype = Object.create(fs$ReadStream.prototype);
    ReadStream.prototype.open = ReadStream$open;
  }

  var fs$WriteStream = fs.WriteStream;
  if (fs$WriteStream) {
    WriteStream.prototype = Object.create(fs$WriteStream.prototype);
    WriteStream.prototype.open = WriteStream$open;
  }

  Object.defineProperty(fs, 'ReadStream', {
    get: function () {
      return ReadStream
    },
    set: function (val) {
      ReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  Object.defineProperty(fs, 'WriteStream', {
    get: function () {
      return WriteStream
    },
    set: function (val) {
      WriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  // legacy names
  var FileReadStream = ReadStream;
  Object.defineProperty(fs, 'FileReadStream', {
    get: function () {
      return FileReadStream
    },
    set: function (val) {
      FileReadStream = val;
    },
    enumerable: true,
    configurable: true
  });
  var FileWriteStream = WriteStream;
  Object.defineProperty(fs, 'FileWriteStream', {
    get: function () {
      return FileWriteStream
    },
    set: function (val) {
      FileWriteStream = val;
    },
    enumerable: true,
    configurable: true
  });

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy();

        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
        that.read();
      }
    });
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this;
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy();
        that.emit('error', err);
      } else {
        that.fd = fd;
        that.emit('open', fd);
      }
    });
  }

  function createReadStream (path, options) {
    return new fs.ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new fs.WriteStream(path, options)
  }

  var fs$open = fs.open;
  fs.open = open;
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null;

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb]]);
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments);
          retry();
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1]);
  fs[gracefulQueue].push(elem);
}

function retry () {
  var elem = fs[gracefulQueue].shift();
  if (elem) {
    debug('RETRY', elem[0].name, elem[1]);
    elem[0].apply(null, elem[1]);
  }
}
});

class NodeJsInputFileSystem {
	readdir(path, callback) {
		gracefulFs.readdir(path, (err, files) => {
			callback(
				err,
				files &&
					files.map(file => {
						return file.normalize ? file.normalize("NFC") : file;
					})
			);
		});
	}

	readdirSync(path) {
		const files = gracefulFs.readdirSync(path);
		return (
			files &&
			files.map(file => {
				return file.normalize ? file.normalize("NFC") : file;
			})
		);
	}
}

const fsMethods = [
	"stat",
	"statSync",
	"readFile",
	"readFileSync",
	"readlink",
	"readlinkSync"
];

for (const key of fsMethods) {
	Object.defineProperty(NodeJsInputFileSystem.prototype, key, {
		configurable: true,
		writable: true,
		value: gracefulFs[key].bind(gracefulFs)
	});
}

var NodeJsInputFileSystem_1 = NodeJsInputFileSystem;

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

class Storage {
	constructor(duration) {
		this.duration = duration;
		this.running = new Map();
		this.data = new Map();
		this.levels = [];
		if (duration > 0) {
			this.levels.push(
				new Set(),
				new Set(),
				new Set(),
				new Set(),
				new Set(),
				new Set(),
				new Set(),
				new Set(),
				new Set()
			);
			for (let i = 8000; i < duration; i += 500) this.levels.push(new Set());
		}
		this.count = 0;
		this.interval = null;
		this.needTickCheck = false;
		this.nextTick = null;
		this.passive = true;
		this.tick = this.tick.bind(this);
	}

	ensureTick() {
		if (!this.interval && this.duration > 0 && !this.nextTick)
			this.interval = setInterval(
				this.tick,
				Math.floor(this.duration / this.levels.length)
			);
	}

	finished(name, err, result) {
		const callbacks = this.running.get(name);
		this.running.delete(name);
		if (this.duration > 0) {
			this.data.set(name, [err, result]);
			const levelData = this.levels[0];
			this.count -= levelData.size;
			levelData.add(name);
			this.count += levelData.size;
			this.ensureTick();
		}
		for (let i = 0; i < callbacks.length; i++) {
			callbacks[i](err, result);
		}
	}

	finishedSync(name, err, result) {
		if (this.duration > 0) {
			this.data.set(name, [err, result]);
			const levelData = this.levels[0];
			this.count -= levelData.size;
			levelData.add(name);
			this.count += levelData.size;
			this.ensureTick();
		}
	}

	provide(name, provider, callback) {
		if (typeof name !== "string") {
			callback(new TypeError("path must be a string"));
			return;
		}
		let running = this.running.get(name);
		if (running) {
			running.push(callback);
			return;
		}
		if (this.duration > 0) {
			this.checkTicks();
			const data = this.data.get(name);
			if (data) {
				return process.nextTick(() => {
					callback.apply(null, data);
				});
			}
		}
		this.running.set(name, (running = [callback]));
		provider(name, (err, result) => {
			this.finished(name, err, result);
		});
	}

	provideSync(name, provider) {
		if (typeof name !== "string") {
			throw new TypeError("path must be a string");
		}
		if (this.duration > 0) {
			this.checkTicks();
			const data = this.data.get(name);
			if (data) {
				if (data[0]) throw data[0];
				return data[1];
			}
		}
		let result;
		try {
			result = provider(name);
		} catch (e) {
			this.finishedSync(name, e);
			throw e;
		}
		this.finishedSync(name, null, result);
		return result;
	}

	tick() {
		const decay = this.levels.pop();
		for (let item of decay) {
			this.data.delete(item);
		}
		this.count -= decay.size;
		decay.clear();
		this.levels.unshift(decay);
		if (this.count === 0) {
			clearInterval(this.interval);
			this.interval = null;
			this.nextTick = null;
			return true;
		} else if (this.nextTick) {
			this.nextTick += Math.floor(this.duration / this.levels.length);
			const time = new Date().getTime();
			if (this.nextTick > time) {
				this.nextTick = null;
				this.interval = setInterval(
					this.tick,
					Math.floor(this.duration / this.levels.length)
				);
				return true;
			}
		} else if (this.passive) {
			clearInterval(this.interval);
			this.interval = null;
			this.nextTick =
				new Date().getTime() + Math.floor(this.duration / this.levels.length);
		} else {
			this.passive = true;
		}
	}

	checkTicks() {
		this.passive = false;
		if (this.nextTick) {
			while (!this.tick());
		}
	}

	purge(what) {
		if (!what) {
			this.count = 0;
			clearInterval(this.interval);
			this.nextTick = null;
			this.data.clear();
			this.levels.forEach(level => {
				level.clear();
			});
		} else if (typeof what === "string") {
			for (let key of this.data.keys()) {
				if (key.startsWith(what)) this.data.delete(key);
			}
		} else {
			for (let i = what.length - 1; i >= 0; i--) {
				this.purge(what[i]);
			}
		}
	}
}

var CachedInputFileSystem_1 = class CachedInputFileSystem {
	constructor(fileSystem, duration) {
		this.fileSystem = fileSystem;
		this._statStorage = new Storage(duration);
		this._readdirStorage = new Storage(duration);
		this._readFileStorage = new Storage(duration);
		this._readJsonStorage = new Storage(duration);
		this._readlinkStorage = new Storage(duration);

		this._stat = this.fileSystem.stat
			? this.fileSystem.stat.bind(this.fileSystem)
			: null;
		if (!this._stat) this.stat = null;

		this._statSync = this.fileSystem.statSync
			? this.fileSystem.statSync.bind(this.fileSystem)
			: null;
		if (!this._statSync) this.statSync = null;

		this._readdir = this.fileSystem.readdir
			? this.fileSystem.readdir.bind(this.fileSystem)
			: null;
		if (!this._readdir) this.readdir = null;

		this._readdirSync = this.fileSystem.readdirSync
			? this.fileSystem.readdirSync.bind(this.fileSystem)
			: null;
		if (!this._readdirSync) this.readdirSync = null;

		this._readFile = this.fileSystem.readFile
			? this.fileSystem.readFile.bind(this.fileSystem)
			: null;
		if (!this._readFile) this.readFile = null;

		this._readFileSync = this.fileSystem.readFileSync
			? this.fileSystem.readFileSync.bind(this.fileSystem)
			: null;
		if (!this._readFileSync) this.readFileSync = null;

		if (this.fileSystem.readJson) {
			this._readJson = this.fileSystem.readJson.bind(this.fileSystem);
		} else if (this.readFile) {
			this._readJson = (path, callback) => {
				this.readFile(path, (err, buffer) => {
					if (err) return callback(err);
					let data;
					try {
						data = JSON.parse(buffer.toString("utf-8"));
					} catch (e) {
						return callback(e);
					}
					callback(null, data);
				});
			};
		} else {
			this.readJson = null;
		}
		if (this.fileSystem.readJsonSync) {
			this._readJsonSync = this.fileSystem.readJsonSync.bind(this.fileSystem);
		} else if (this.readFileSync) {
			this._readJsonSync = path => {
				const buffer = this.readFileSync(path);
				const data = JSON.parse(buffer.toString("utf-8"));
				return data;
			};
		} else {
			this.readJsonSync = null;
		}

		this._readlink = this.fileSystem.readlink
			? this.fileSystem.readlink.bind(this.fileSystem)
			: null;
		if (!this._readlink) this.readlink = null;

		this._readlinkSync = this.fileSystem.readlinkSync
			? this.fileSystem.readlinkSync.bind(this.fileSystem)
			: null;
		if (!this._readlinkSync) this.readlinkSync = null;
	}

	stat(path, callback) {
		this._statStorage.provide(path, this._stat, callback);
	}

	readdir(path, callback) {
		this._readdirStorage.provide(path, this._readdir, callback);
	}

	readFile(path, callback) {
		this._readFileStorage.provide(path, this._readFile, callback);
	}

	readJson(path, callback) {
		this._readJsonStorage.provide(path, this._readJson, callback);
	}

	readlink(path, callback) {
		this._readlinkStorage.provide(path, this._readlink, callback);
	}

	statSync(path) {
		return this._statStorage.provideSync(path, this._statSync);
	}

	readdirSync(path) {
		return this._readdirStorage.provideSync(path, this._readdirSync);
	}

	readFileSync(path) {
		return this._readFileStorage.provideSync(path, this._readFileSync);
	}

	readJsonSync(path) {
		return this._readJsonStorage.provideSync(path, this._readJsonSync);
	}

	readlinkSync(path) {
		return this._readlinkStorage.provideSync(path, this._readlinkSync);
	}

	purge(what) {
		this._statStorage.purge(what);
		this._readdirStorage.purge(what);
		this._readFileStorage.purge(what);
		this._readlinkStorage.purge(what);
		this._readJsonStorage.purge(what);
	}
};

var node = createCommonjsModule(function (module) {






const nodeFileSystem = new CachedInputFileSystem_1(
	new NodeJsInputFileSystem_1(),
	4000
);

const nodeContext = {
	environments: ["node+es3+es5+process+native"]
};

const asyncResolver = ResolverFactory.createResolver({
	extensions: [".js", ".json", ".node"],
	fileSystem: nodeFileSystem
});
module.exports = function resolve(
	context,
	path,
	request,
	resolveContext,
	callback
) {
	if (typeof context === "string") {
		callback = resolveContext;
		resolveContext = request;
		request = path;
		path = context;
		context = nodeContext;
	}
	if (typeof callback !== "function") {
		callback = resolveContext;
	}
	asyncResolver.resolve(context, path, request, resolveContext, callback);
};

const syncResolver = ResolverFactory.createResolver({
	extensions: [".js", ".json", ".node"],
	useSyncFileSystemCalls: true,
	fileSystem: nodeFileSystem
});
module.exports.sync = function resolveSync(context, path, request) {
	if (typeof context === "string") {
		request = path;
		path = context;
		context = nodeContext;
	}
	return syncResolver.resolveSync(context, path, request);
};

const asyncContextResolver = ResolverFactory.createResolver({
	extensions: [".js", ".json", ".node"],
	resolveToContext: true,
	fileSystem: nodeFileSystem
});
module.exports.context = function resolveContext(
	context,
	path,
	request,
	resolveContext,
	callback
) {
	if (typeof context === "string") {
		callback = resolveContext;
		resolveContext = request;
		request = path;
		path = context;
		context = nodeContext;
	}
	if (typeof callback !== "function") {
		callback = resolveContext;
	}
	asyncContextResolver.resolve(
		context,
		path,
		request,
		resolveContext,
		callback
	);
};

const syncContextResolver = ResolverFactory.createResolver({
	extensions: [".js", ".json", ".node"],
	resolveToContext: true,
	useSyncFileSystemCalls: true,
	fileSystem: nodeFileSystem
});
module.exports.context.sync = function resolveContextSync(
	context,
	path,
	request
) {
	if (typeof context === "string") {
		request = path;
		path = context;
		context = nodeContext;
	}
	return syncContextResolver.resolveSync(context, path, request);
};

const asyncLoaderResolver = ResolverFactory.createResolver({
	extensions: [".js", ".json", ".node"],
	moduleExtensions: ["-loader"],
	mainFields: ["loader", "main"],
	fileSystem: nodeFileSystem
});
module.exports.loader = function resolveLoader(
	context,
	path,
	request,
	resolveContext,
	callback
) {
	if (typeof context === "string") {
		callback = resolveContext;
		resolveContext = request;
		request = path;
		path = context;
		context = nodeContext;
	}
	if (typeof callback !== "function") {
		callback = resolveContext;
	}
	asyncLoaderResolver.resolve(context, path, request, resolveContext, callback);
};

const syncLoaderResolver = ResolverFactory.createResolver({
	extensions: [".js", ".json", ".node"],
	moduleExtensions: ["-loader"],
	mainFields: ["loader", "main"],
	useSyncFileSystemCalls: true,
	fileSystem: nodeFileSystem
});
module.exports.loader.sync = function resolveLoaderSync(
	context,
	path,
	request
) {
	if (typeof context === "string") {
		request = path;
		path = context;
		context = nodeContext;
	}
	return syncLoaderResolver.resolveSync(context, path, request);
};

module.exports.create = function create(options) {
	options = Object.assign(
		{
			fileSystem: nodeFileSystem
		},
		options
	);
	const resolver = ResolverFactory.createResolver(options);
	return function(context, path, request, resolveContext, callback) {
		if (typeof context === "string") {
			callback = resolveContext;
			resolveContext = request;
			request = path;
			path = context;
			context = nodeContext;
		}
		if (typeof callback !== "function") {
			callback = resolveContext;
		}
		resolver.resolve(context, path, request, resolveContext, callback);
	};
};

module.exports.create.sync = function createSync(options) {
	options = Object.assign(
		{
			useSyncFileSystemCalls: true,
			fileSystem: nodeFileSystem
		},
		options
	);
	const resolver = ResolverFactory.createResolver(options);
	return function(context, path, request) {
		if (typeof context === "string") {
			request = path;
			path = context;
			context = nodeContext;
		}
		return resolver.resolveSync(context, path, request);
	};
};

// Export Resolver, FileSystems and Plugins
module.exports.ResolverFactory = ResolverFactory;

module.exports.NodeJsInputFileSystem = NodeJsInputFileSystem_1;
module.exports.CachedInputFileSystem = CachedInputFileSystem_1;
});
