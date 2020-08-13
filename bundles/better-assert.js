import assert$1 from 'assert';
import fs from 'fs';

var callsite = function(){
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack){ return stack; };
  var err = new Error;
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
};

/**
 * Module dependencies.
 */

var AssertionError = assert$1.AssertionError;

/**
 * Expose `assert`.
 */

var betterAssert = process.env.NO_ASSERT
  ? function(){}
  : assert;

/**
 * Assert the given `expr`.
 */

function assert(expr) {
  if (expr) return;

  var stack = callsite();
  var call = stack[1];
  var file = call.getFileName();
  var lineno = call.getLineNumber();
  var src = fs.readFileSync(file, 'utf8');
  var line = src.split('\n')[lineno-1];
  var src = line.match(/assert\((.*)\)/)[1];

  var err = new AssertionError({
    message: src,
    stackStartFunction: stack[0].getFunction()
  });

  throw err;
}
