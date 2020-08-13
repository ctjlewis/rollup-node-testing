import util from 'util';
import assert from 'assert';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

/*global window, global*/


function now() { return new Date().getTime() }

var slice = Array.prototype.slice;
var console;
var times = {};

if (typeof commonjsGlobal !== "undefined" && commonjsGlobal.console) {
    console = commonjsGlobal.console;
} else if (typeof window !== "undefined" && window.console) {
    console = window.console;
} else {
    console = {};
}

var functions = [
    [log, "log"],
    [info, "info"],
    [warn, "warn"],
    [error, "error"],
    [time, "time"],
    [timeEnd, "timeEnd"],
    [trace, "trace"],
    [dir, "dir"],
    [consoleAssert, "assert"]
];

for (var i = 0; i < functions.length; i++) {
    var tuple = functions[i];
    var f = tuple[0];
    var name = tuple[1];

    if (!console[name]) {
        console[name] = f;
    }
}

function log() {}

function info() {
    console.log.apply(console, arguments);
}

function warn() {
    console.log.apply(console, arguments);
}

function error() {
    console.warn.apply(console, arguments);
}

function time(label) {
    times[label] = now();
}

function timeEnd(label) {
    var time = times[label];
    if (!time) {
        throw new Error("No such label: " + label)
    }

    delete times[label];
    var duration = now() - time;
    console.log(label + ": " + duration + "ms");
}

function trace() {
    var err = new Error();
    err.name = "Trace";
    err.message = util.format.apply(null, arguments);
    console.error(err.stack);
}

function dir(object) {
    console.log(util.inspect(object) + "\n");
}

function consoleAssert(expression) {
    if (!expression) {
        var arr = slice.call(arguments, 1);
        assert.ok(false, util.format.apply(null, arr));
    }
}
